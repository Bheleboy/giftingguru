import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xvzupsflasjdejgkcgrt.supabase.co",
  "sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf",
  { auth: { persistSession: false } },
);

const DEFAULT_HOST = "www.giftingguru.co.za";

function cleanHostname(value = "") {
  return value.toLowerCase().split(":")[0].replace(/^https?:\/\//, "").replace(/\.$/, "");
}

async function loadStore(hostname) {
  const { data, error } = await supabase
    .from("store_domains")
    .select("hostname,is_primary,stores!inner(id,name,slug,domain,currency,default_markup_pct,vat_pct,active,store_branding(*))")
    .eq("hostname", hostname)
    .eq("verified", true)
    .eq("status", "verified")
    .eq("stores.active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data?.stores) return null;

  const branding = Array.isArray(data.stores.store_branding)
    ? data.stores.store_branding[0]
    : data.stores.store_branding;

  return {
    id: data.stores.id,
    name: data.stores.name,
    slug: data.stores.slug,
    hostname: data.hostname,
    currency: data.stores.currency,
    markupPct: Number(data.stores.default_markup_pct),
    vatPct: Number(data.stores.vat_pct),
    branding: branding || {},
  };
}

const getStoreByHostname = cache(loadStore);

export async function getCurrentStore() {
  const requestHeaders = await headers();
  const requestedHost = cleanHostname(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || DEFAULT_HOST,
  );
  return (
    (await getStoreByHostname(requestedHost)) ||
    (requestedHost === "localhost" ? await getStoreByHostname(DEFAULT_HOST) : null) ||
    (await getStoreByHostname(DEFAULT_HOST))
  );
}

export function publicStoreConfig(store) {
  if (!store) return null;
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    hostname: store.hostname,
    currency: store.currency,
    markupPct: store.markupPct,
    vatPct: store.vatPct,
    branding: {
      logoUrl: store.branding.logo_url,
      faviconUrl: store.branding.favicon_url,
      primaryColor: store.branding.primary_color,
      secondaryColor: store.branding.secondary_color,
      accentColor: store.branding.accent_color,
      supportEmail: store.branding.support_email,
      instagramUrl: store.branding.instagram_url,
      facebookUrl: store.branding.facebook_url,
      shipping: store.branding.metadata?.shipping,
    },
  };
}
