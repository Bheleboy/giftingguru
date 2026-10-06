import "server-only";

// Runs once, when an order first becomes paid. Creates the supplier order and
// hands it to the supplier's order channel. Channels are pluggable per store:
//   manual      - email the reseller an order pack; reseller places it on the SMD portal (today)
//   smd_email   - email a structured purchase order straight to SMD's order desk (needs SMD to agree)
//   smd_api     - call an SMD ordering API (needs SMD to provide one)
// Paying the supplier is a separate step (see payment_method below) so a payouts
// provider can be added later without changing any of this.

const FROM = "GiftingGuru Orders <orders@send.giftingguru.co.za>";
const FALLBACK_NOTIFY = ["embhele@gmail.com"];

function rands(value) {
  return "R " + Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function addressLines(a = {}) {
  return [a.recipient, a.line1, a.line2, a.suburb, a.city, a.province, a.postalCode, a.country].filter(Boolean);
}

export async function sendEmail({ to, subject, html, replyTo, idempotencyKey }) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from: FROM, to, subject, html, reply_to: replyTo }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Resend failed (" + response.status + ")");
  return result.id;
}

async function logEvent(db, { order, supplierOrderId, type, status, details }) {
  await db.from("fulfilment_events").insert({
    store_id: order.store_id,
    order_id: order.id,
    supplier_order_id: supplierOrderId || null,
    event_type: type,
    status,
    details: details || {},
  });
}

async function loadContext(db, order) {
  const [{ data: items }, { data: customer }, { data: store }, { data: supplier }] = await Promise.all([
    db.from("order_items").select("sku,product_name,quantity,wholesale_unit_price,retail_unit_price,line_total").eq("order_id", order.id),
    db.from("customers").select("email,first_name,last_name,phone").eq("id", order.customer_id).maybeSingle(),
    db.from("stores").select("id,name,vat_pct,store_branding(support_email)").eq("id", order.store_id).maybeSingle(),
    db.from("suppliers").select("id,code,name,base_url").eq("code", "SMD").maybeSingle(),
  ]);
  const { data: connection } = supplier
    ? await db.from("supplier_connections").select("settings").eq("store_id", order.store_id).eq("supplier_id", supplier.id).maybeSingle()
    : { data: null };
  const branding = Array.isArray(store?.store_branding) ? store.store_branding[0] : store?.store_branding;
  const settings = connection?.settings || {};
  const vatMultiplier = 1 + Number(store?.vat_pct ?? 15) / 100;
  const supplierCostExVat = (items || []).reduce((sum, i) => sum + Number(i.wholesale_unit_price || 0) * Number(i.quantity || 0), 0);
  return {
    items: items || [],
    customer: customer || {},
    storeName: store?.name || "GiftingGuru",
    supportEmail: branding?.support_email || "hello@giftingguru.co.za",
    supplier,
    settings,
    channel: settings.order_channel || "manual",
    notify: settings.notify_emails?.length ? settings.notify_emails : [branding?.support_email, ...FALLBACK_NOTIFY].filter(Boolean),
    supplierCostExVat,
    supplierCostInclVat: Math.round(supplierCostExVat * vatMultiplier * 100) / 100,
  };
}

function customerConfirmationHtml(ctx, order, testMode) {
  const rows = ctx.items.map((i) => `<tr><td style="padding:6px 0">${esc(i.product_name)} &times; ${i.quantity}</td><td style="padding:6px 0;text-align:right">${rands(i.line_total)}</td></tr>`).join("");
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1d2433">
${testMode ? '<p style="background:#fff4d6;padding:10px;border-radius:6px"><b>TEST ORDER</b> - no real payment was taken.</p>' : ""}
<h2 style="margin-bottom:4px">Thank you, ${esc(ctx.customer.first_name || "")}!</h2>
<p>Your payment was received and order <b>${esc(order.order_number)}</b> is confirmed.</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #e4e7ec;border-bottom:1px solid #e4e7ec">${rows}
<tr><td style="padding:6px 0">Delivery</td><td style="padding:6px 0;text-align:right">${Number(order.shipping_total) ? rands(order.shipping_total) : "FREE"}</td></tr>
<tr><td style="padding:8px 0"><b>Total paid</b></td><td style="padding:8px 0;text-align:right"><b>${rands(order.total)}</b></td></tr></table>
<p><b>Delivering to:</b><br>${addressLines(order.shipping_address).map(esc).join("<br>")}</p>
<p>We'll email you again as soon as your order ships. Questions? Just reply to this email.</p>
<p>${esc(ctx.storeName)}</p></div>`;
}

function orderPackHtml(ctx, order, testMode) {
  const rows = ctx.items.map((i) => `<tr><td style="padding:6px;border:1px solid #e4e7ec;font-family:monospace">${esc(i.sku)}</td><td style="padding:6px;border:1px solid #e4e7ec">${esc(i.product_name)}</td><td style="padding:6px;border:1px solid #e4e7ec;text-align:center">${i.quantity}</td><td style="padding:6px;border:1px solid #e4e7ec;text-align:right">${rands(i.wholesale_unit_price)}</td></tr>`).join("");
  const a = order.shipping_address || {};
  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1d2433">
${testMode ? '<p style="background:#fff4d6;padding:10px;border-radius:6px"><b>TEST ORDER</b> - Stitch test mode. Do NOT place this with SMD.</p>' : ""}
<h2>Place with ${esc(ctx.supplier?.name || "supplier")}: ${esc(order.order_number)}</h2>
<p>Customer paid <b>${rands(order.total)}</b>. Place this order on the SMD portal as a dropship to the customer's address below, then record the SMD order number in the GiftingGuru admin.</p>
<table style="width:100%;border-collapse:collapse"><tr style="background:#f5f6f8"><th style="padding:6px;border:1px solid #e4e7ec;text-align:left">SKU</th><th style="padding:6px;border:1px solid #e4e7ec;text-align:left">Product</th><th style="padding:6px;border:1px solid #e4e7ec">Qty</th><th style="padding:6px;border:1px solid #e4e7ec;text-align:right">SMD unit (ex VAT)</th></tr>${rows}</table>
<p>Expected SMD cost: <b>${rands(ctx.supplierCostExVat)}</b> ex VAT / <b>${rands(ctx.supplierCostInclVat)}</b> incl VAT, plus SMD delivery.</p>
<h3 style="margin-bottom:4px">Deliver to</h3>
<p style="margin-top:0">${esc(a.recipient)}<br>${esc(ctx.customer.phone)}<br>${esc(a.line1)}${a.line2 ? "<br>" + esc(a.line2) : ""}<br>${esc(a.suburb)}${a.suburb ? ", " : ""}${esc(a.city)}<br>${esc(a.province)} ${esc(a.postalCode)}</p>
<p><a href="https://www.giftingguru.co.za/admin" style="background:#1d2433;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open admin to record SMD order</a> &nbsp; <a href="${esc((ctx.supplier?.base_url || "https://za.smdtechnologies.com") + "/account/login")}">SMD portal</a></p></div>`;
}

// Channel adapters. Each returns { status, reference? } for the supplier order.
const channels = {
  async manual(db, ctx, order, supplierOrder, testMode) {
    await sendEmail({
      to: ctx.notify,
      subject: (testMode ? "[TEST] " : "") + "Place SMD order: " + order.order_number + " (" + rands(order.total) + ")",
      html: orderPackHtml(ctx, order, testMode),
      idempotencyKey: "order-pack-" + supplierOrder.id,
    });
    return { status: "pending", event: "order_pack_sent" };
  },
};

export async function onOrderPaid(db, order, { testMode = false } = {}) {
  let supplierOrderId = null;
  try {
    const ctx = await loadContext(db, order);
    if (!ctx.supplier) throw new Error("SMD supplier record missing");

    const { data: supplierOrder, error } = await db
      .from("supplier_orders")
      .upsert({
        store_id: order.store_id,
        order_id: order.id,
        supplier_id: ctx.supplier.id,
        status: "pending",
        expected_total: ctx.supplierCostInclVat,
        idempotency_key: "order:" + order.id,
        raw_status: { channel: ctx.channel, payment_method: ctx.settings.payment_method || "manual", test: testMode },
      }, { onConflict: "idempotency_key", ignoreDuplicates: true })
      .select("id,status")
      .maybeSingle();
    if (error) throw error;
    if (!supplierOrder) return; // already handled by a concurrent call
    supplierOrderId = supplierOrder.id;

    await logEvent(db, { order, supplierOrderId, type: "payment_confirmed", status: "ok", details: { total: order.total, test: testMode } });
    // One purchase event per order (unique dedupe_key), with the campaign that brought the customer.
    await db.from("analytics_events").upsert({
      event: "purchase", value: Number(order.total), order_id: order.id, dedupe_key: "purchase:" + order.id,
      attribution: order.attribution || null, path: "/checkout", data: { order_number: order.order_number, test: testMode },
    }, { onConflict: "dedupe_key", ignoreDuplicates: true });

    try {
      await sendEmail({
        to: [ctx.customer.email],
        subject: (testMode ? "[TEST] " : "") + "Order confirmed: " + order.order_number,
        html: customerConfirmationHtml(ctx, order, testMode),
        replyTo: ctx.supportEmail,
        idempotencyKey: "order-confirm-" + order.id,
      });
      await logEvent(db, { order, supplierOrderId, type: "customer_confirmation_sent", status: "ok" });
    } catch (mailError) {
      await logEvent(db, { order, supplierOrderId, type: "customer_confirmation_sent", status: "failed", details: { error: mailError.message } });
    }

    const channel = channels[ctx.channel] || channels.manual;
    const result = await channel(db, ctx, order, supplierOrder, testMode);
    await logEvent(db, { order, supplierOrderId, type: result.event, status: "ok", details: { channel: ctx.channel } });
    await db.from("orders").update({ status: "supplier_ready", updated_at: new Date().toISOString() }).eq("id", order.id).eq("status", "paid");
  } catch (err) {
    console.error("fulfilment failed", order.order_number, err?.message);
    await logEvent(db, { order, supplierOrderId, type: "fulfilment_error", status: "failed", details: { error: err?.message } }).catch(() => {});
  }
}

// Called from the admin when the reseller records progress with SMD.
export async function recordSupplierProgress(db, { orderId, action, supplierReference, trackingNumber, courier, actor }) {
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) throw new Error("Order not found");
  const { data: supplierOrder } = await db.from("supplier_orders").select("*").eq("order_id", orderId).maybeSingle();
  if (!supplierOrder) throw new Error("No supplier order for this order yet");
  const testMode = Boolean(supplierOrder.raw_status?.test);
  const now = new Date().toISOString();
  const { data: customer } = await db.from("customers").select("email,first_name").eq("id", order.customer_id).maybeSingle();

  if (action === "ordered") {
    if (!supplierReference) throw new Error("SMD order number is required");
    await db.from("supplier_orders").update({ status: "submitted", supplier_order_reference: supplierReference, updated_at: now }).eq("id", supplierOrder.id);
    await db.from("orders").update({ status: "supplier_ordered", supplier_order_reference: supplierReference, updated_at: now }).eq("id", orderId);
    await logEvent(db, { order, supplierOrderId: supplierOrder.id, type: "supplier_order_placed", status: "ok", details: { supplierReference, actor } });
    return { status: "supplier_ordered" };
  }

  if (action === "shipped") {
    await db.from("supplier_orders").update({ status: "shipped", raw_status: { ...(supplierOrder.raw_status || {}), trackingNumber, courier }, updated_at: now }).eq("id", supplierOrder.id);
    await db.from("orders").update({ status: "shipped", updated_at: now }).eq("id", orderId);
    await logEvent(db, { order, supplierOrderId: supplierOrder.id, type: "shipped", status: "ok", details: { trackingNumber, courier, actor } });
    if (customer?.email) {
      await sendEmail({
        to: [customer.email],
        subject: (testMode ? "[TEST] " : "") + "Your order " + order.order_number + " is on its way",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1d2433"><h2>Good news, ${esc(customer.first_name || "")}!</h2><p>Order <b>${esc(order.order_number)}</b> has shipped.</p>${trackingNumber ? `<p>${esc(courier || "Courier")} tracking number: <b>${esc(trackingNumber)}</b></p>` : ""}<p>Delivery usually takes 2 to 5 working days. Reply to this email if you need anything.</p><p>GiftingGuru</p></div>`,
        replyTo: "hello@giftingguru.co.za",
        idempotencyKey: "order-shipped-" + order.id,
      }).catch((e) => logEvent(db, { order, supplierOrderId: supplierOrder.id, type: "shipping_email", status: "failed", details: { error: e.message } }));
    }
    return { status: "shipped" };
  }

  throw new Error("Unknown action");
}
