"use client";

import { useCallback, useEffect, useState } from "react";

const LABELS = {
  paid: "Paid - processing",
  supplier_ready: "Place with SMD",
  supplier_ordered: "Ordered with SMD",
  shipped: "Shipped",
};

function rands(v) {
  return "R " + Number(v || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 });
}

function OrderCard({ order, token, onDone }) {
  const [ref, setRef] = useState("");
  const [tracking, setTracking] = useState("");
  const [courier, setCourier] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const so = Array.isArray(order.supplier_orders) ? order.supplier_orders[0] : order.supplier_orders;
  const c = order.customers || {};
  const a = order.shipping_address || {};
  const test = so?.raw_status?.test;

  async function act(action) {
    setBusy(true); setMsg("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + token },
        body: JSON.stringify({ orderId: order.id, action, supplierReference: ref, trackingNumber: tracking, courier }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Update failed");
      onDone();
    } catch (error) { setMsg(error.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="field" style={{ borderTop: "1px solid #e4e7ec", paddingTop: 12 }}>
      <p><b>{order.order_number}</b> {test ? <b style={{ color: "#b54708" }}>TEST</b> : null} - {LABELS[order.status] || order.status} - {rands(order.total)}</p>
      <p>{c.first_name} {c.last_name} - {c.phone} - {c.email}<br />{[a.line1, a.line2, a.suburb, a.city, a.province, a.postalCode].filter(Boolean).join(", ")}</p>
      <p>{(order.order_items || []).map((i) => `${i.quantity} x ${i.sku} (${i.product_name})`).join("; ")}</p>
      {so ? <p>Expected SMD cost: {rands(so.expected_total)} incl VAT{order.supplier_order_reference ? ` - SMD ref ${order.supplier_order_reference}` : ""}</p> : <p>Supplier order not created yet.</p>}
      {(order.status === "supplier_ready" || order.status === "paid") && so ? (
        <>
          <label>SMD order number</label>
          <input value={ref} onChange={(e) => setRef(e.target.value)} disabled={busy} />
          <button className="btn" disabled={busy || !ref} onClick={() => act("ordered")}>{busy ? "Saving..." : "Mark as ordered with SMD"}</button>
        </>
      ) : null}
      {order.status === "supplier_ordered" ? (
        <>
          <label>Courier</label>
          <input value={courier} onChange={(e) => setCourier(e.target.value)} disabled={busy} />
          <label>Tracking number</label>
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} disabled={busy} />
          <button className="btn" disabled={busy} onClick={() => act("shipped")}>{busy ? "Saving..." : "Mark shipped and email customer"}</button>
        </>
      ) : null}
      {msg ? <div className="status">{msg}</div> : null}
    </div>
  );
}

export default function OrdersPanel({ token }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/orders", { headers: { authorization: "Bearer " + token }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load orders");
      setOrders(result.orders);
    } catch (e) { setError(e.message); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  return (
    <section className="panel">
      <h2>Orders to fulfil</h2>
      <button className="btn" onClick={load}>Refresh</button>
      {error ? <div className="status">{error}</div> : null}
      {orders && !orders.length ? <p>No paid orders waiting.</p> : null}
      {(orders || []).map((o) => <OrderCard key={o.id} order={o} token={token} onDone={load} />)}
    </section>
  );
}
