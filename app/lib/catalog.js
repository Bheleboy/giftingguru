import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

export const SITE_URL = "https://giftingguru.vercel.app";
export const VAT_MULTIPLIER = 1.15;
export const MARKUP_MULTIPLIER = 1.35;

const supabase = createClient(
  "https://xvzupsflasjdejgkcgrt.supabase.co",
  "sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf",
  { auth: { persistSession: false } },
);

export function retailPrice(product) {
  const wholesale = Number(product?.wholesale_price);
  if (!Number.isFinite(wholesale) || wholesale <= 0) return null;
  return Math.ceil(wholesale * VAT_MULTIPLIER * MARKUP_MULTIPLIER);
}

export function productUrl(product) {
  return `${SITE_URL}/products/${encodeURIComponent(product.sku)}`;
}

export const getProductBySku = cache(async (sku) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .eq("sku", sku)
    .maybeSingle();

  if (error) throw error;
  return data;
});

export async function getMerchantProducts() {
  const pageSize = 1000;
  const products = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("products")
      .select("id,sku,name,description,brand,category_path,wholesale_price,stock_qty,image_urls,synced_at")
      .eq("active", true)
      .order("sku", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    products.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  return products.filter(
    (product) => product.sku && product.name && product.image_urls?.[0] && retailPrice(product),
  );
}
