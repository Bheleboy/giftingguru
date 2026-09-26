import "server-only";

import crypto from "node:crypto";
import { createServerClient } from "./pricing";

// Stitch Express REST API - https://express.stitch.money/api-docs
// Amounts are integer cents. Tokens live 15 minutes.
const BASE = "https://express.stitch.money/api/v1";
const PRODUCTION_HOST = "www.giftingguru.co.za";

function credentials() {
  const clientId = process.env.STITCH_CLIENT_ID || process.env.STITCH_TEST_CLIENT_ID;
  const clientSecret = process.env.STITCH_CLIENT_SECRET || process.env.STITCH_TEST_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function stitchConfigured() {
  return Boolean(credentials());
}

export function stitchMode() {
  const creds = credentials();
  if (!creds) return null;
  return creds.clientId.startsWith("test-") ? "test" : "live";
}

class StitchError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let cachedToken = null;

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const creds = credentials();
  if (!creds) throw new StitchError("Stitch credentials are not configured", 503);
  const response = await fetch(BASE + "/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ clientId: creds.clientId, clientSecret: creds.clientSecret, scope: "client_paymentrequest" }),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  const token = body?.data?.accessToken;
  if (!response.ok || !token) {
    throw new StitchError("Stitch token request failed (" + response.status + ")", response.status, body);
  }
  // Refresh a little early so a request never goes out with a token about to lapse.
  cachedToken = { value: token, expiresAt: Date.now() + 13 * 60 * 1000 };
  return token;
}

async function api(path, { method = "GET", body, retry = true } = {}) {
  const token = await getToken();
  const response = await fetch(BASE + path, {
    method,
    headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if ((response.status === 401 || response.status === 403) && retry) {
    cachedToken = null;
    return api(path, { method, body, retry: false });
  }
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = [...(json?.generalErrors || []), ...Object.values(json?.fieldErrors || {}).flat()].join("; ");
    throw new StitchError("Stitch " + method + " " + path + " failed (" + response.status + ")" + (detail ? ": " + detail : ""), response.status, json);
  }
  return json;
}

export function toCents(rands) {
  return Math.round(Number(rands) * 100);
}

function payerNameFrom(firstName, lastName) {
  let name = [firstName, lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim().slice(0, 40);
  if (name.length < 3) name = (name + " Customer").trim().slice(0, 40);
  return name;
}

function normalisePhone(value) {
  const raw = String(value || "").replace(/[^\d+]/g, "");
  if (/^\+27\d{9}$/.test(raw)) return raw;
  if (/^0\d{9}$/.test(raw)) return "+27" + raw.slice(1);
  if (/^27\d{9}$/.test(raw)) return "+" + raw;
  return undefined;
}

export function returnUrlFor(host) {
  return "https://" + (host || PRODUCTION_HOST) + "/checkout/return";
}

function webhookUrlFor(host) {
  return "https://" + (host || PRODUCTION_HOST) + "/api/stitch/webhook";
}

// Creates the hosted Stitch checkout for an order. Delivery is already inside `total`.
export async function createPaymentLink({ order, customer, host }) {
  const result = await api("/payment-links", {
    method: "POST",
    body: {
      amount: toCents(order.total),
      merchantReference: order.order_number,
      payerName: payerNameFrom(customer.firstName, customer.lastName),
      payerEmailAddress: customer.email || undefined,
      payerPhoneNumber: normalisePhone(customer.phone),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      collectDeliveryDetails: false,
      skipCheckoutPage: true,
    },
  });
  const link = result?.data?.payment;
  if (!link?.id || !link?.link) throw new StitchError("Stitch did not return a payment link", 502, result);
  // Send the customer back to our return page once they finish on Stitch.
  const url = new URL(link.link);
  url.searchParams.set("redirect_url", returnUrlFor(host));
  return { id: link.id, url: url.toString(), status: link.status };
}

export async function getPaymentLink(id) {
  const result = await api("/payment-links/" + encodeURIComponent(id));
  return result?.data?.payment || null;
}

// Single source of truth for "is this order paid": ask Stitch, never trust the caller.
export async function confirmOrderPayment(db, order) {
  if (!order || order.payment_status === "paid") return order;
  if (order.payment_provider !== "stitch_express" || !order.payment_reference) return order;

  const link = await getPaymentLink(order.payment_reference);
  if (!link) return order;

  if (link.status === "PAID") {
    if (Number(link.amount) !== toCents(order.total) || link.merchantReference !== order.order_number) {
      console.error("stitch amount/reference mismatch", { order: order.order_number, link: link.id, amount: link.amount });
      return order;
    }
    const { data, error } = await db
      .from("orders")
      .update({ status: "paid", payment_status: "paid", updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .neq("payment_status", "paid")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data || { ...order, status: "paid", payment_status: "paid" };
  }

  if (link.status === "EXPIRED" || link.status === "CANCELLED") {
    const { data } = await db
      .from("orders")
      .update({ payment_status: "failed", status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("payment_status", "pending")
      .select("*")
      .maybeSingle();
    return data || order;
  }

  return order;
}

// ---- One-time account setup: redirect URL + webhook (idempotent, safe to call often) ----

const setupDone = new Set();

async function getSetting(db, key) {
  const { data } = await db.from("integration_settings").select("value").eq("key", key).maybeSingle();
  return data?.value || null;
}

async function setSetting(db, key, value) {
  const { error } = await db.from("integration_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

function webhookSecretKey() {
  return "stitch_webhook_secret:" + credentials()?.clientId;
}

export async function ensureStitchSetup(host) {
  const creds = credentials();
  if (!creds) return;
  const cacheKey = creds.clientId + "|" + host;
  if (setupDone.has(cacheKey)) return;

  const db = createServerClient();
  const doneKey = "stitch_setup:" + cacheKey;
  if (await getSetting(db, doneKey)) {
    setupDone.add(cacheKey);
    return;
  }

  const returnUrl = returnUrlFor(host);
  const existing = await api("/redirect-urls");
  if (!(existing?.data?.redirectUrls || []).includes(returnUrl)) {
    await api("/redirect-urls", { method: "POST", body: { redirectUrl: returnUrl } });
  }

  if (!(await getSetting(db, webhookSecretKey()))) {
    try {
      const hook = await api("/webhook", { method: "POST", body: { url: webhookUrlFor(host) } });
      if (hook?.data?.secret) await setSetting(db, webhookSecretKey(), hook.data.secret);
    } catch (error) {
      // 409 = already registered earlier; payments are still verified via the API.
      if (error.status !== 409) throw error;
      console.warn("stitch webhook already registered; signing secret unavailable", webhookUrlFor(host));
    }
  }

  await setSetting(db, doneKey, new Date().toISOString());
  setupDone.add(cacheKey);
}

// ---- Webhook signature (Svix) ----

export async function verifyWebhookSignature(db, headers, rawBody) {
  const secret = await getSetting(db, webhookSecretKey());
  if (!secret) return { verified: false, reason: "no_secret" };

  const id = headers.get("svix-id") || headers.get("webhook-id");
  const timestamp = headers.get("svix-timestamp") || headers.get("webhook-timestamp");
  const signatures = headers.get("svix-signature") || headers.get("webhook-signature");
  if (!id || !timestamp || !signatures) return { verified: false, reason: "missing_headers" };
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return { verified: false, reason: "stale" };

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(id + "." + timestamp + "." + rawBody).digest();
  const ok = signatures.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
  return ok ? { verified: true } : { verified: false, reason: "bad_signature" };
}
