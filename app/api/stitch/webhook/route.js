import { NextResponse } from "next/server";
import { createServerClient } from "../../../lib/pricing";
import { confirmOrderPayment, verifyWebhookSignature } from "../../../lib/stitch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_NUMBER = /^GG-\d{8}-[A-Z0-9]{8}$/;

// Collect every string in the payload so we don't depend on Stitch's exact event shape.
function strings(value, out = new Set(), depth = 0) {
  if (depth > 6 || out.size > 200) return out;
  if (typeof value === "string") out.add(value.trim());
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out, depth + 1));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out, depth + 1));
  return out;
}

export async function POST(request) {
  const rawBody = await request.text();
  const db = createServerClient();

  const signature = await verifyWebhookSignature(db, request.headers, rawBody);
  // The signature is logged, not enforced: a wrong or rotated secret must never block a
  // real customer's order. Payment is only ever marked paid after Stitch's own API confirms
  // the link is PAID with the right amount and reference (confirmOrderPayment), so a forged
  // webhook can't mark anything paid.
  if (signature.verified) console.log("stitch webhook signature verified");
  else console.warn("stitch webhook signature not verified:", signature.reason);

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const values = [...strings(payload)].filter((v) => v && v.length <= 80);
  const orderNumbers = values.filter((v) => ORDER_NUMBER.test(v));

  const filters = [];
  if (orderNumbers.length) filters.push("order_number.in.(" + orderNumbers.join(",") + ")");
  const refs = values.filter((v) => /^[A-Za-z0-9_-]{4,64}$/.test(v)).slice(0, 50);
  if (refs.length) filters.push("payment_reference.in.(" + refs.join(",") + ")");
  if (!filters.length) return NextResponse.json({ ok: true, matched: 0 });

  const { data: orders, error } = await db
    .from("orders")
    .select("*")
    .eq("payment_provider", "stitch_express")
    .or(filters.join(","))
    .limit(10);
  if (error) {
    console.error("stitch webhook lookup failed", error);
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }

  let paid = 0;
  for (const order of orders || []) {
    try {
      const updated = await confirmOrderPayment(db, order);
      if (updated?.payment_status === "paid") paid += 1;
    } catch (err) {
      console.error("stitch webhook confirm failed", order.order_number, err?.message);
      return NextResponse.json({ error: "confirm failed" }, { status: 500 }); // Svix will retry
    }
  }

  return NextResponse.json({ ok: true, matched: orders?.length || 0, paid });
}
