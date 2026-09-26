"use client";

import { useEffect } from "react";

export default function ClearCart() {
  useEffect(() => {
    try { localStorage.removeItem("ggcart"); } catch {}
  }, []);
  return null;
}
