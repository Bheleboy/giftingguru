// Browser-only helpers: campaign attribution + event tracking.
// Events go to our own /api/track (always) and to Meta Pixel / GA4 when those are configured.

const ATTR_KEY = "gg_attr";
const SESSION_KEY = "gg_sid";
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function safeStorage(kind) {
  try { return window[kind]; } catch { return null; }
}

export function sessionId() {
  const store = safeStorage("sessionStorage");
  if (!store) return null;
  let id = store.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() || String(Date.now()) + Math.random()).replace(/-/g, "").slice(0, 24);
    store.setItem(SESSION_KEY, id);
  }
  return id;
}

// Call on every page load. Keeps first-touch and last-touch campaign data for 30 days.
export function captureAttribution() {
  if (typeof window === "undefined") return null;
  const store = safeStorage("localStorage");
  const url = new URL(window.location.href);
  const found = {};
  for (const key of PARAMS) {
    const value = url.searchParams.get(key);
    if (value) found[key] = value.slice(0, 200);
  }
  let saved = null;
  try { saved = JSON.parse(store?.getItem(ATTR_KEY) || "null"); } catch {}
  if (saved && Date.now() - (saved.updatedAt || 0) > THIRTY_DAYS) saved = null;
  if (Object.keys(found).length) {
    const touch = { ...found, landing: url.pathname, at: new Date().toISOString() };
    saved = { first: saved?.first || touch, last: touch, updatedAt: Date.now() };
    if (!saved.first.referrer && document.referrer) saved.first.referrer = document.referrer.slice(0, 200);
    store?.setItem(ATTR_KEY, JSON.stringify(saved));
  } else if (!saved && document.referrer && !document.referrer.includes(window.location.host)) {
    const touch = { referrer: document.referrer.slice(0, 200), landing: url.pathname, at: new Date().toISOString() };
    saved = { first: touch, last: touch, updatedAt: Date.now() };
    store?.setItem(ATTR_KEY, JSON.stringify(saved));
  }
  return saved;
}

export function getAttribution() {
  try {
    const saved = JSON.parse(safeStorage("localStorage")?.getItem(ATTR_KEY) || "null");
    return saved ? { first: saved.first, last: saved.last } : null;
  } catch { return null; }
}

// Current UTM query string, so internal links keep campaign tags.
export function campaignQuery() {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  const keep = new URLSearchParams();
  for (const key of PARAMS) if (url.searchParams.get(key)) keep.set(key, url.searchParams.get(key));
  const s = keep.toString();
  return s ? "&" + s : "";
}

const META = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase", reminder_signup: "Lead" };

// event: view_item | add_to_cart | begin_checkout | reminder_signup | purchase (purchase: client pixels only)
export function track(event, data = {}, { eventId } = {}) {
  if (typeof window === "undefined") return;
  const value = data.value != null ? Number(data.value) : undefined;
  try {
    if (window.fbq && META[event]) {
      window.fbq("track", META[event], {
        currency: "ZAR", value,
        content_ids: data.sku ? [data.sku] : data.skus, content_type: "product", content_name: data.name,
      }, eventId ? { eventID: eventId } : undefined);
    }
  } catch {}
  try {
    if (window.gtag) {
      const gaEvent = event === "reminder_signup" ? "sign_up" : event;
      window.gtag("event", gaEvent, {
        currency: "ZAR", value, transaction_id: data.orderNumber,
        items: data.sku ? [{ item_id: data.sku, item_name: data.name, price: data.price, quantity: data.qty || 1 }] : data.items,
      });
    }
  } catch {}
  if (event === "purchase") return; // purchases are recorded server-side once payment is verified
  try {
    const body = JSON.stringify({ event, sku: data.sku, value, path: window.location.pathname, sessionId: sessionId(), attribution: getAttribution() });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
  } catch {}
}
