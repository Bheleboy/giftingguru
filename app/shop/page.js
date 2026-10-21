import Link from "next/link";
import { Crumbs, HubFooter, HubHeader, TileList } from "../components/hub";
import { breadcrumbLd, getCatalogueIndex, jsonLd, SITE_URL } from "../lib/seo";

export const revalidate = 3600;

export const metadata = {
  title: "Shop gifts and tech by category | Gifting Guru South Africa",
  description: "Browse every GiftingGuru category: lighting, audio, smart devices, kitchen and home, gaming, travel and more. Delivered across South Africa.",
  alternates: { canonical: `${SITE_URL}/shop` },
  openGraph: { type: "website", url: `${SITE_URL}/shop`, siteName: "GiftingGuru", title: "Shop by category | GiftingGuru", locale: "en_ZA" },
};

export default async function ShopIndex() {
  const { categories, brands, items } = await getCatalogueIndex();
  const trail = [{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbLd(trail))} />
    <HubHeader />
    <main className="hubmain">
      <Crumbs trail={trail} />
      <h1>Shop by category</h1>
      <p className="hublead">{items.length.toLocaleString("en-ZA")} gifts, gadgets and home essentials across {categories.length} categories, delivered anywhere in South Africa.</p>
      <TileList tiles={categories} base="/shop" />
      <h2>Popular brands</h2>
      <div className="hubchips">
        {brands.slice(0, 24).map((b) => <Link key={b.slug} href={`/brands/${b.slug}`}>{b.label}</Link>)}
        <Link href="/brands">All brands</Link>
      </div>
    </main>
    <HubFooter />
  </>;
}
