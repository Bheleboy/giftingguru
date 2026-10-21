import { Crumbs, HubFooter, HubHeader, TileList } from "../components/hub";
import { breadcrumbLd, getCatalogueIndex, jsonLd, SITE_URL } from "../lib/seo";

export const revalidate = 3600;

export const metadata = {
  title: "Shop by brand: Volkano, TP-Link, Creality, Ellies and more | Gifting Guru",
  description: "Shop Volkano, VolkanoX, TP-Link, Creality, Ellies, Amplify, Switched, LocknLock and more brands online with delivery across South Africa.",
  alternates: { canonical: `${SITE_URL}/brands` },
  openGraph: { type: "website", url: `${SITE_URL}/brands`, siteName: "GiftingGuru", title: "Shop by brand | GiftingGuru", locale: "en_ZA" },
};

export default async function BrandsIndex() {
  const { brands } = await getCatalogueIndex();
  const trail = [{ name: "Home", path: "/" }, { name: "Brands", path: "/brands" }];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbLd(trail))} />
    <HubHeader />
    <main className="hubmain">
      <Crumbs trail={trail} />
      <h1>Shop by brand</h1>
      <p className="hublead">{brands.length} brands of tech, gifts and home essentials, delivered across South Africa.</p>
      <TileList tiles={brands} base="/brands" />
    </main>
    <HubFooter />
  </>;
}
