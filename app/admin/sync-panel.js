"use client";

import { useEffect, useState } from "react";

function ago(iso) {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 48 ? `${hrs} h ago` : `${Math.round(hrs / 24)} days ago`;
}

export default function SyncPanel({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/sync-status", { headers: { authorization: "Bearer " + token }, cache: "no-store" })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error || "Failed"); setData(j); })
      .catch((e) => setError(e.message));
  }, [token]);
  const healthy = data && data.minutes_since_success != null && data.minutes_since_success <= 75 && !data.failures_24h;
  return (
    <section className="panel">
      <h2>Catalogue sync {data ? (healthy ? "✅" : "⚠️") : ""}</h2>
      {error ? <div className="status">{error}</div> : null}
      {data ? (
        <>
          <p>Last successful SMD sync: <b>{ago(data.last_success)}</b> ({data.successful_runs_24h} category runs in 24 h, schedule every 30 min).</p>
          <p>Failed sync calls in 24 h: <b>{data.failures_24h}</b>{data.last_failure ? ` · last: ${ago(data.last_failure.at)} (${data.last_failure.detail || "error"})` : ""}</p>
          <p>Products refreshed in the last 3 h: <b>{data.fresh_products}</b> of {data.active_products} active. Not seen at SMD for 3 h+ (marked unavailable): <b>{data.stale_products}</b>.</p>
        </>
      ) : !error ? <p>Loading...</p> : null}
    </section>
  );
}
