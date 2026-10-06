import "server-only";

import { cache } from "react";
import { calculateRetailPrice, createServerClient, getPricingContext } from "./pricing";

// The ONLY product fields that may leave the server. Wholesale cost, markup,
// supplier ids/urls and raw supplier data stay in the database and admin views.
export const PUBLIC_PRODUCT_FIELDS = [
  "id", "sku", "name", "slug", "description", "brand", "category_path",
  "image_urls", "stock_qty", "synced_at",
];

// Columns the server needs to compute public values (never returned as-is).
const SERVER_COLUMNS = [...PUBLIC_PRODUCT_FIELDS, "active", "wholesale_price"].join(",");

export const SITE_URL = "https://www.giftingguru.co.za";

export function productUrl(product) {
  return `${SITE_URL}/products/${encodeURIComponent(product.sku)}`;
}

function toPublic(product, context) {
  const override = context.overrides.get(product.id);
  const retail = override?.enabled === false ? null : calculateRetailPrice(product, context.store, context.rules, override);
  const stock = Math.max(0, Math.floor(Number(product.stock_qty || 0)));
  const out = {};
  for (const field of PUBLIC_PRODUCT_FIELDS) out[field] = product[field] ?? null;
  out.stock_qty = stock;
  out.retail_price = retail;
  out.available = Boolean(product.active && retail && stock > 0 && override?.enabled !== false);
  return out;
}

async function storeContext(storeId) {
  if (storeId) return getPricingContext(storeId);
  const db = createServerClient();
  const { data } = await db.from("stores").select("id").eq("slug", "giftingguru").single();
  return getPricingContext(data.id);
}

async function fetchActive(db) {
  const { count } = await db.from("products").select("id", { count: "exact", head: true }).eq("active", true);
  const offsets = Array.from({ length: Math.max(1, Math.ceil((count || 0) / 1000)) }, (_, i) => i * 1000);
  const pages = await Promise.all(offsets.map((from) => db.from("products").select(SERVER_COLUMNS)
    .eq("active", true).order("synced_at", { ascending: false }).order("id", { ascending: true })
    .range(from, from + 999)));
  const failed = pages.find((page) => page.error);
  if (failed) throw failed.error;
  return [...new Map(pages.flatMap((page) => page.data || []).map((p) => [p.id, p])).values()];
}

// Full storefront catalogue: retail prices only.
export const getPublicCatalogue = cache(async (storeId) => {
  const db = createServerClient();
  const [rows, context] = await Promise.all([fetchActive(db), storeContext(storeId)]);
  return rows.map((row) => toPublic(row, context)).filter((p) => p.retail_price);
});

// One product by SKU, including inactive ones so old links can explain what happened.
export const getPublicProduct = cache(async (sku, storeId) => {
  const db = createServerClient();
  const [{ data, error }, context] = await Promise.all([
    db.from("products").select(SERVER_COLUMNS).eq("sku", sku).order("synced_at", { ascending: false }).limit(1).maybeSingle(),
    storeContext(storeId),
  ]);
  if (error) throw error;
  if (!data) return null;
  const product = toPublic(data, context);
  product.active = Boolean(data.active);
  return product;
});

// A few in-stock alternatives from the same category (for unavailable products).
export async function getAlternatives(product, storeId, limit = 4) {
  if (!product?.category_path) return [];
  const db = createServerClient();
  const [{ data }, context] = await Promise.all([
    db.from("products").select(SERVER_COLUMNS).eq("active", true).eq("category_path", product.category_path)
      .gt("stock_qty", 0).neq("sku", product.sku).order("stock_qty", { ascending: false }).limit(limit * 3),
    storeContext(storeId),
  ]);
  return (data || []).map((row) => toPublic(row, context)).filter((p) => p.available).slice(0, limit);
}

// Products eligible for Google Shopping / sitemap (physical, purchasable).
export async function getMerchantProducts(storeId) {
  const all = await getPublicCatalogue(storeId);
  return all.filter((p) => String(p.category_path || "").toLowerCase() !== "digital");
}
