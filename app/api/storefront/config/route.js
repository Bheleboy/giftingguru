import { NextResponse } from "next/server";
import { getCurrentStore, publicStoreConfig } from "../../../lib/store";

export async function GET() {
  const store = await getCurrentStore();
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  return NextResponse.json(publicStoreConfig(store), {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
