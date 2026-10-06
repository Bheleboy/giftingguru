import { NextResponse } from "next/server";
import { createServerClient } from "../../lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// First-party funnel events. Purchases are NOT accepted here: they are recorded
// server-side only after Stitch confirms payment, so they can't be faked or duplicated.
const ALLOWED = new Set(["view_item", "add_to_cart", "begin_checkout", "reminder_signup"]);

function clean(value, max = 200) {
  return typeof value === "string" ? value.slice(0, max) : null;
}

function cleanAttribution(attr) {
  if (!attr || typeof attr !== "object") return null;
  const pick = (t) => t && typeof t === "object" ? Object.fromEntries(
    Object.entries(t).filter(([k]) => /^(utm_[a-z]+|fbclid|gclid|landing|referrer|at)$/.test(k)).map(([k, v]) => [k, clean(String(v))])
  ) : null;
  return { first: pick(attr.first), last: pick(attr.last) };
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!ALLOWED.has(body?.event)) return NextResponse.json({ ok: false }, { status: 400 });
    const value = Number(body.value);
    await createServerClient().from("analytics_events").insert({
      event: body.event,
      session_id: clean(body.sessionId, 64),
      path: clean(body.path, 300),
      sku: clean(body.sku, 80),
      value: Number.isFinite(value) && value >= 0 && value < 1e7 ? value : null,
      attribution: cleanAttribution(body.attribution),
      user_agent: clean(request.headers.get("user-agent"), 300),
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
