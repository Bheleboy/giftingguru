import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServerClient, getPricingContext, resolveMarkup } from "../../../lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY read-only audit endpoint. Only the holder of the one-time key can call it.
const KEY_SHA256 = "887d70ee552e93d292c04ac3e014c90a2fd02160a0f060e7856d9b2a02171db6";

function allowed(request) {
  const key = request.headers.get("x-audit-key") || "";
  const a = Buffer.from(createHash("sha256").update(key).digest("hex"));
  const b = Buffer.from(KEY_SHA256);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request) {
  if (!allowed(request)) return new NextResponse("Not found", { status: 404 });
  const skus = (new URL(request.url).searchParams.get("skus") || "").split(",").filter(Boolean).slice(0, 20);
  const db = createServerClient();
  const { data: store } = await db.from("stores").select("id").eq("slug", "giftingguru").single();
  const context = await getPricingContext(store.id);
  const { data: rows, error } = await db.from("products").select("*").in("sku", skus);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const products = (rows || []).map((p) => {
    const { raw, raw_data, supplier_raw, ...rest } = p;
    const override = context.overrides.get(p.id);
    return {
      ...rest,
      applied_markup_pct: resolveMarkup(p, context.store, context.rules, override),
      override: override || null,
      raw_keys: Object.keys(raw || raw_data || supplier_raw || {}),
      raw_price_fields: Object.fromEntries(Object.entries(raw || raw_data || supplier_raw || {}).filter(([k]) => /price|cost|rrp|retail|dealer/i.test(k))),
    };
  });
  const { data: health } = await db.rpc("sync_health");
  return NextResponse.json({ store: context.store, rules: context.rules, products, sync_health: health });
}
