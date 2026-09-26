import { NextResponse } from "next/server";
import { requireAdmin } from "../../smd/admin-auth";
import { createServerClient } from "../../../lib/pricing";
import { recordSupplierProgress } from "../../../lib/fulfilment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createServerClient();
  const { data, error } = await db
    .from("orders")
    .select("id,order_number,status,payment_status,total,shipping_address,supplier_order_reference,created_at,customers(first_name,last_name,email,phone),order_items(sku,product_name,quantity,wholesale_unit_price),supplier_orders(status,expected_total,supplier_order_reference,raw_status)")
    .in("status", ["paid", "supplier_ready", "supplier_ordered", "shipped"])
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function POST(request) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const result = await recordSupplierProgress(createServerClient(), {
      orderId: String(body.orderId || ""),
      action: body.action,
      supplierReference: String(body.supplierReference || "").trim().slice(0, 60),
      trackingNumber: String(body.trackingNumber || "").trim().slice(0, 60),
      courier: String(body.courier || "").trim().slice(0, 60),
      actor: user.email,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
