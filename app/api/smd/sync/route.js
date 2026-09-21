import { NextResponse } from "next/server";
import { requireAdmin } from "../admin-auth";

export async function POST(req) {
  try {
    const user = await requireAdmin(req);
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const authorization = req.headers.get("authorization");
    const response = await fetch("https://xvzupsflasjdejgkcgrt.supabase.co/functions/v1/smd-sync", {
      method: "POST", headers: { "content-type": "application/json", authorization }, body: JSON.stringify(body), cache: "no-store",
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "Sync failed" }, { status: 500 });
  }
}
