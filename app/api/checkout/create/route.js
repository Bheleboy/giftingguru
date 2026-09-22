import { NextResponse } from "next/server";
import { getCurrentStore } from "../../../lib/store";
import { calculateRetailPrice, createServerClient, getPricingContext } from "../../../lib/pricing";

export const runtime = "nodejs";

function clean(value, max = 160) {
  return String(value || "").trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Checkout is not configured." }, { status: 503 });
  }

  try {
    const store = await getCurrentStore();
    const body = await request.json();
    const submitted = Array.isArray(body.items) ? body.items : [];
    const customer = body.customer || {};
    const address = body.shippingAddress || {};

    if (!store || !submitted.length || submitted.length > 50) {
      return NextResponse.json({ error: "Your cart is empty or invalid." }, { status: 400 });
    }

    const email = clean(customer.email, 254).toLowerCase();
    const firstName = clean(customer.firstName, 80);
    const lastName = clean(customer.lastName, 80);
    const phone = clean(customer.phone, 40);
    const shippingAddress = {
      recipient: clean(address.recipient || [firstName, lastName].filter(Boolean).join(" "), 160),
      line1: clean(address.line1, 180),
      line2: clean(address.line2, 180),
      suburb: clean(address.suburb, 100),
      city: clean(address.city, 100),
      province: clean(address.province, 100),
      postalCode: clean(address.postalCode, 20),
      country: "South Africa",
    };

    if (!firstName || !lastName || !validEmail(email) || !phone || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.province || !shippingAddress.postalCode) {
      return NextResponse.json({ error: "Please complete all required customer and delivery fields." }, { status: 400 });
    }

    const quantities = new Map();
    for (const line of submitted) {
      const id = clean(line.id, 64);
      const qty = Math.max(1, Math.min(20, Number.parseInt(line.qty, 10) || 1));
      if (id) quantities.set(id, Math.min(20, (quantities.get(id) || 0) + qty));
    }
    const ids = [...quantities.keys()];
    const db = createServerClient();
    const { data: products, error: productError } = await db
      .from("products")
      .select("id,sku,name,brand,category_path,wholesale_price,stock_qty,active")
      .in("id", ids)
      .eq("active", true);
    if (productError) throw productError;
    if (!products || products.length !== ids.length) {
      return NextResponse.json({ error: "One or more products are no longer available." }, { status: 409 });
    }

    const context = await getPricingContext(store.id);
    const lines = [];
    for (const product of products) {
      const override = context.overrides.get(product.id);
      const qty = quantities.get(product.id);
      if (override?.enabled === false) {
        return NextResponse.json({ error: product.name + " is no longer available from this store." }, { status: 409 });
      }
      if (Number(product.stock_qty || 0) < qty) {
        return NextResponse.json({ error: "Insufficient stock for " + product.name + "." }, { status: 409 });
      }
      const price = calculateRetailPrice(product, context.store, context.rules, override);
      if (!price) return NextResponse.json({ error: "Price is unavailable for " + product.name + "." }, { status: 409 });
      lines.push({ product, qty, price, lineTotal: price * qty });
    }

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const shipping = subtotal >= 1500 ? 0 : 120;
    const total = subtotal + shipping;
    const orderNumber = "GG-" + new Date().toISOString().slice(0, 10).replaceAll("-", "") + "-" + crypto.randomUUID().slice(0, 8).toUpperCase();

    let customerRecord;
    const { data: existing } = await db.from("customers").select("id").eq("store_id", store.id).eq("email", email).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (existing) {
      const { data, error } = await db.from("customers").update({ first_name: firstName, last_name: lastName, phone }).eq("id", existing.id).select("id").single();
      if (error) throw error;
      customerRecord = data;
    } else {
      const { data, error } = await db.from("customers").insert({ store_id: store.id, email, first_name: firstName, last_name: lastName, phone }).select("id").single();
      if (error) throw error;
      customerRecord = data;
    }

    const { data: order, error: orderError } = await db.from("orders").insert({
      store_id: store.id,
      customer_id: customerRecord.id,
      order_number: orderNumber,
      status: "pending_payment",
      payment_status: "unpaid",
      subtotal,
      shipping_total: shipping,
      tax_total: 0,
      total,
      shipping_address: shippingAddress,
      payment_provider: "pending",
    }).select("id,order_number,status,payment_status,subtotal,shipping_total,total").single();
    if (orderError) throw orderError;

    const { error: itemError } = await db.from("order_items").insert(lines.map(({ product, qty, price, lineTotal }) => ({
      order_id: order.id,
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      quantity: qty,
      wholesale_unit_price: product.wholesale_price,
      retail_unit_price: price,
      line_total: lineTotal,
    })));
    if (itemError) {
      await db.from("orders").delete().eq("id", order.id);
      throw itemError;
    }

    return NextResponse.json({
      ok: true,
      order,
      payment: { available: false, provider: null, status: "awaiting_provider_activation" },
      message: "Order created. Secure payment will be enabled when the payment provider is activated.",
    }, { status: 201 });
  } catch (error) {
    console.error("checkout create failed", error);
    return NextResponse.json({ error: "We could not create the order. Please try again." }, { status: 500 });
  }
}

