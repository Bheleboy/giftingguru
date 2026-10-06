"use client";

import { useEffect } from "react";
import { track } from "../../lib/analytics";

// Fires the ad-platform purchase event once per order. Event ID = order number so
// Meta/GA de-duplicate it; our own record is written server-side when payment is verified.
export default function PurchasePixel({ orderNumber, total }) {
  useEffect(() => {
    const key = "gg_purchase_" + orderNumber;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    track("purchase", { value: total, orderNumber }, { eventId: orderNumber });
  }, [orderNumber, total]);
  return null;
}
