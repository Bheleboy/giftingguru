import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, HubFooter, HubHeader, ProductGrid } from "../../components/hub";
import { breadcrumbLd, categoryLabel, categorySlug, getCatalogueIndex, jsonLd, productPath, SITE_URL } from "../../lib/seo";

export const revalidate = 3600;

async function load(params) {
  const { slug } = await params;
  const { brands } = await getCatalogueIndex();
  return brands.find((b) => b.slug === slug) || null;
}

export async function generateMetadata({ params }) {
  const brand = await load(params);
  if (!brand) return { title: "Brand not found | GiftingGuru", robots: { index: false } };
  const url = `${SITE_URL}/brands/${brand.slug}`;
  const description = `Shop ${brand.items.length} ${brand.label} products online in South Africa at GiftingGuru. Gift-ready ${brand.label} picks with nationwide delivery, free over R1 500.`;
  return {
    title: `${brand.label} South Africa | Shop ${brand.label} online | Gifting Guru`,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, siteName: "GiftingGuru", title: `${brand.label} | GiftingGuru`, description, locale: "en_ZA",
      images: brand.items[0]?.image_urls?.[0] ? [{ url: brand.items[0].image_urls[0] }] : undefined },
  };
}

export default async function BrandPage({ params }) {
  const brand = await load(params);
  if (!brand) notFound();
  const trail = [{ name: "Home", path: "/" }, { name: "Brands", path: "/brands" }, { name: brand.label, path: `/brands/${brand.slug}` }];
  const cats = new Map();
  for (const p of brand.items) { const c = categorySlug(p); if (c && c !== "digital") cats.set(c, (cats.get(c) || 0) + 1); }
  const topCats = [...cats.entries()].sort((a, b) => b[1] - a[1]);
  const inStock = brand.items.filter((p) => p.available).length;
  const list = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brand.label} | GiftingGuru`,
    url: `${SITE_URL}/brands/${brand.slug}`,
    about: { "@type": "Brand", name: brand.label },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: brand.items.length,
      itemListElement: brand.items.slice(0, 50).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${productPath(p)}`, name: p.name })),
    },
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbLd(trail))} />
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(list)} />
    <HubHeader />
    <main className="hubmain">
      <Crumbs trail={trail} />
      <h1>{brand.label}</h1>
      <p className="hublead">
        Shop {brand.items.length} {brand.label} products at GiftingGuru, {inStock} in stock now
        {topCats.length ? `, across ${topCats.slice(0, 4).map(([c]) => categoryLabel(c).toLowerCase()).join(", ")}` : ""}. Delivered anywhere in South Africa, free on orders over R1 500.
      </p>
      {topCats.length > 1 ? (
        <div className="hubchips" aria-label={`${brand.label} categories`}>
          {topCats.map(([c, n]) => <Link key={c} href={`/shop/${c}`}>{categoryLabel(c)} <small>{n}</small></Link>)}
        </div>
      ) : null}
      <ProductGrid items={brand.items} />
    </main>
    <HubFooter />
  </>;
}
