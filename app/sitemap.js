export const revalidate = 3600;

import { getMerchantProducts, productUrl, SITE_URL } from "./lib/catalog";
import { getCatalogueIndex } from "./lib/seo";

const STATIC = [
  ["/shop", "daily", 0.9], ["/brands", "weekly", 0.8], ["/gift-reminders", "monthly", 0.7],
  ["/about", "monthly", 0.4], ["/contact", "monthly", 0.4], ["/shipping", "yearly", 0.3],
  ["/returns", "yearly", 0.3], ["/terms", "yearly", 0.2], ["/privacy", "yearly", 0.2],
];

export default async function sitemap() {
  const [products, index] = await Promise.all([getMerchantProducts(), getCatalogueIndex().catch(() => ({ categories: [], brands: [] }))]);
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...STATIC.map(([path, changeFrequency, priority]) => ({ url: `${SITE_URL}${path}`, changeFrequency, priority })),
    ...index.categories.map((c) => ({ url: `${SITE_URL}/shop/${c.slug}`, lastModified: now, changeFrequency: "daily", priority: 0.8 })),
    ...index.brands.map((b) => ({ url: `${SITE_URL}/brands/${b.slug}`, lastModified: now, changeFrequency: "daily", priority: 0.7 })),
    ...products.map((product) => ({
      url: productUrl(product),
      lastModified: product.synced_at || undefined,
      changeFrequency: "daily",
      priority: product.available ? 0.6 : 0.3,
    })),
  ];
}
