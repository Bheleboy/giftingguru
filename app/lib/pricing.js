import "server-only";

import { createClient } from "@supabase/supabase-js";

const URL = "https://xvzupsflasjdejgkcgrt.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_ekMMmdmDw5YtFdhHUfh62g_Lz15Pwaf";

export function createServerClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || PUBLISHABLE_KEY;
  return createClient(URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function same(value, expected) {
  return String(value || "").trim().toLowerCase() === String(expected || "").trim().toLowerCase();
}

export function resolveMarkup(product, store, rules = [], override) {
  if (override?.markup_pct != null) return Number(override.markup_pct);
  const matches = rules
    .filter((rule) => rule.active)
    .filter((rule) => {
      if (rule.scope === "store") return true;
      if (rule.scope === "product") return same(rule.scope_value, product.id) || same(rule.scope_value, product.sku);
      if (rule.scope === "brand") return same(rule.scope_value, product.brand) || (product.name || "").toLowerCase().startsWith(String(rule.scope_value || "").toLowerCase());
      if (rule.scope === "category") return (product.category_path || "").toLowerCase().includes(String(rule.scope_value || "").toLowerCase());
      return false;
    })
    .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
  return matches.length ? Number(matches[0].markup_pct) : Number(store.default_markup_pct);
}

export function calculateRetailPrice(product, store, rules = [], override) {
  if (override?.fixed_retail_price != null) return Math.ceil(Number(override.fixed_retail_price));
  const wholesale = Number(product.wholesale_price);
  if (!Number.isFinite(wholesale) || wholesale <= 0) return null;
  const vatMultiplier = 1 + Number(store.vat_pct || 0) / 100;
  const markupMultiplier = 1 + resolveMarkup(product, store, rules, override) / 100;
  return Math.ceil(wholesale * vatMultiplier * markupMultiplier);
}

export async function getPricingContext(storeId) {
  const db = createServerClient();
  const [{ data: store, error: storeError }, { data: rules, error: ruleError }, { data: overrides, error: overrideError }] = await Promise.all([
    db.from("stores").select("id,default_markup_pct,vat_pct,currency").eq("id", storeId).single(),
    db.from("pricing_rules").select("scope,scope_value,markup_pct,priority,active").eq("store_id", storeId).eq("active", true),
    db.from("store_products").select("product_id,enabled,markup_pct,fixed_retail_price,featured").eq("store_id", storeId),
  ]);
  if (storeError) throw storeError;
  if (ruleError && process.env.SUPABASE_SERVICE_ROLE_KEY) throw ruleError;
  if (overrideError && process.env.SUPABASE_SERVICE_ROLE_KEY) throw overrideError;
  return {
    store,
    rules: rules || [],
    overrides: new Map((overrides || []).map((item) => [item.product_id, item])),
  };
}

export function priceCatalogue(products, context) {
  return products
    .filter((product) => context.overrides.get(product.id)?.enabled !== false)
    .map((product) => ({
      ...product,
      retail_price: calculateRetailPrice(product, context.store, context.rules, context.overrides.get(product.id)),
      pricing_source: context.overrides.get(product.id)?.fixed_retail_price != null
        ? "fixed"
        : context.overrides.get(product.id)?.markup_pct != null
          ? "product"
          : "rule",
    }));
}

