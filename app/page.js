import Storefront from "./storefront";
import { getCurrentStore, publicStoreConfig } from "./lib/store";
import { getPublicCatalogue } from "./lib/public-catalog";
import { getCatalogueIndex } from "./lib/seo";
import { firstPaint } from "./lib/first-paint";
import { unstable_cache } from "next/cache";

// The first-paint slice is small, so it is data-cached; the full list is only read when the cache refreshes.
const cachedFirstPaint = unstable_cache(
  async (storeId, config) => firstPaint(await getPublicCatalogue(storeId), config),
  ["home-first-paint-v1"],
  { revalidate: 300 },
);

export const revalidate = 300;

export const metadata = {
  title: "GiftingGuru | Gifts, tech and Volkano gadgets delivered across South Africa",
  description: "Gifting Guru is a South African online gift shop: Volkano, TP-Link, Creality and more, with nationwide delivery, free over R1 500, plus free reminders for the dates that matter.",
  alternates: { canonical: "https://www.giftingguru.co.za/" },
  openGraph: {
    type: "website",
    url: "https://www.giftingguru.co.za/",
    siteName: "GiftingGuru",
    title: "GiftingGuru | Smart gifts. Great finds.",
    description: "Gifts, tech and home essentials delivered across South Africa. Free delivery over R1 500.",
    images: [{ url: "https://www.giftingguru.co.za/reference-hero.webp" }],
    locale: "en_ZA",
  },
  twitter: { card: "summary_large_image" },
};

export default async function Home() {
  const store = await getCurrentStore();
  const config = publicStoreConfig(store);
  const [first, index] = await Promise.all([cachedFirstPaint(store.id, config), getCatalogueIndex()]);
  const browse = {
    categories: index.categories.map(({ slug, label }) => ({ slug, label })),
    brands: index.brands.slice(0, 16).map(({ slug, label }) => ({ slug, label })),
  };
  return <Storefront initialItems={first.items} categories={first.categories} catalogueTotal={first.total} store={config} browse={browse} />;
}
