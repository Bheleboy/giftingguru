import { NextResponse } from "next/server";
import { requireAdmin } from "../../smd/admin-auth";
import { createServerClient } from "../../../lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createServerClient().rpc("sync_health");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
