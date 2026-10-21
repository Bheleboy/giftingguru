import { NextResponse } from "next/server";
import { getCurrentStore } from "../../../lib/store";
import { getPublicCatalogue } from "../../../lib/public-catalog";

// Full storefront catalogue (retail prices only), loaded by the browser after first paint.
export async function GET() {
  const store = await getCurrentStore();
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  const items = await getPublicCatalogue(store.id);
  return NextResponse.json({ items }, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=1800",
      "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
      "Vercel-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
    },
  });
}
