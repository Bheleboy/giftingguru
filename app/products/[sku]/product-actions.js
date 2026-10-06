"use client";

import { useEffect, useState } from "react";
import { campaignQuery, captureAttribution, track } from "../../lib/analytics";

// Client-side buttons for the server-rendered product page. Keeps UTM tags on every internal link.
export default function ProductActions({ sku, name, price, available, category }) {
  const [utm, setUtm] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    captureAttribution();
    setUtm(campaignQuery());
    if (available) track("view_item", { sku, name, value: price, price });
  }, [sku, name, price, available]);

  async function share() {
    const url = `${window.location.origin}/products/${encodeURIComponent(sku)}`;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else { await navigator.clipboard.writeText(url); setNote("Link copied"); setTimeout(() => setNote(""), 2000); }
    } catch {}
  }

  const button = { display: "inline-block", padding: "14px 24px", borderRadius: 9, fontWeight: 800, textDecoration: "none", border: 0, cursor: "pointer", fontSize: 16 };
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
      {available ? (
        <a href={`/?add=${encodeURIComponent(sku)}${utm}`} style={{ ...button, background: "#111827", color: "#fff" }}>Add to cart</a>
      ) : (
        <a href={`/?q=${encodeURIComponent(category || "")}${utm}#shop`} style={{ ...button, background: "#111827", color: "#fff" }}>Browse similar products</a>
      )}
      <button type="button" onClick={share} style={{ ...button, background: "#f3f4f6", color: "#111827" }}>{note || "Share"}</button>
    </div>
  );
}
