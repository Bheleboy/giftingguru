// Back-compat shim: all public catalogue reads go through the allowlisted, server-only module.
export { SITE_URL, productUrl, getMerchantProducts, getPublicProduct as getProductBySku } from "./public-catalog";

export function retailPrice(product) {
  return product?.retail_price ?? null;
}
