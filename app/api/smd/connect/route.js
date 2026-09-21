import { NextResponse } from "next/server";
import { requireAdmin } from "../admin-auth";

export async function POST(req) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, message: "Authorised admin session." });
}
