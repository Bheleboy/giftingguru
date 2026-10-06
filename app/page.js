import Storefront from "./storefront";
import { getCurrentStore, publicStoreConfig } from "./lib/store";
import { getPublicCatalogue } from "./lib/public-catalog";

export const revalidate = 300;

export const metadata = {
  title: "GiftingGuru | Smart gifts and tech, delivered across South Africa",
  description: "Shop gifts, tech and home essentials with nationwide delivery. Free delivery over R1 500, plus free reminders for the dates that matter.",
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
  const items = await getPublicCatalogue(store.id);
  return <Storefront initialItems={items} store={publicStoreConfig(store)} />;
}
