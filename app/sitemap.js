import { getMerchantProducts, productUrl } from "./lib/catalog";

export default async function sitemap() {
  const products = await getMerchantProducts();
  return [
    { url: "https://giftingguru.vercel.app", changeFrequency: "daily", priority: 1 },
    ...products.map((product) => ({
      url: productUrl(product),
      lastModified: product.synced_at || undefined,
      changeFrequency: "daily",
      priority: 0.8,
    })),
  ];
}
