import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, HubFooter, HubHeader, ProductGrid } from "../../components/hub";
import { brandOf, breadcrumbLd, getCatalogueIndex, jsonLd, priceText, productPath, SITE_URL, slugify } from "../../lib/seo";

// Render on request (the catalogue index is data-cached), not at build time.
export const dynamic = "force-dynamic";

async function load(params) {
  const { slug } = await params;
  const { categories } = await getCatalogueIndex();
  return categories.find((c) => c.slug === slug) || null;
}

function cheapest(items) {
  const prices = items.filter((p) => p.available && p.retail_price).map((p) => p.retail_price);
  return prices.length ? Math.min(...prices) : null;
}

export async function generateMetadata({ params }) {
  const cat = await load(params);
  if (!cat) return { title: "Category not found | GiftingGuru", robots: { index: false } };
  const url = `${SITE_URL}/shop/${cat.slug}`;
  const from = cheapest(cat.items);
  const description = `Shop ${cat.items.length} ${cat.label.toLowerCase()} products online${from ? ` from R ${from.toLocaleString("en-ZA")}` : ""}. Gift-ready picks with delivery across South Africa, free over R1 500.`;
  return {
    title: `${cat.label} | Buy online in South Africa | Gifting Guru`,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, siteName: "GiftingGuru", title: `${cat.label} | GiftingGuru`, description, locale: "en_ZA",
      images: cat.items[0]?.image_urls?.[0] ? [{ url: cat.items[0].image_urls[0] }] : undefined },
  };
}

export default async function CategoryPage({ params }) {
  const cat = await load(params);
  if (!cat) notFound();
  const trail = [{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: cat.label, path: `/shop/${cat.slug}` }];
  const brandCounts = new Map();
  for (const p of cat.items) { const b = brandOf(p); if (b) brandCounts.set(b, (brandCounts.get(b) || 0) + 1); }
  const topBrands = [...brandCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const inStock = cat.items.filter((p) => p.available).length;
  const from = cheapest(cat.items);
  const list = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cat.label} | GiftingGuru`,
    url: `${SITE_URL}/shop/${cat.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: cat.items.length,
      itemListElement: cat.items.slice(0, 50).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${productPath(p)}`, name: p.name })),
    },
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbLd(trail))} />
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(list)} />
    <HubHeader />
    <main className="hubmain">
      <Crumbs trail={trail} />
      <h1>{cat.label}</h1>
      <p className="hublead">
        {cat.items.length} {cat.label.toLowerCase()} products, {inStock} in stock now{from ? `, from R ${from.toLocaleString("en-ZA")}` : ""}.
        {topBrands.length ? ` Top brands include ${topBrands.slice(0, 4).map(([b]) => b).join(", ")}.` : ""} Flat R120 delivery anywhere in South Africa, free on orders over R1 500.
      </p>
      {topBrands.length > 1 ? (
        <div className="hubchips" aria-label="Brands in this category">
          {topBrands.map(([b, n]) => <Link key={b} href={`/brands/${slugify(b)}`}>{b} <small>{n}</small></Link>)}
        </div>
      ) : null}
      <ProductGrid items={cat.items} />
    </main>
    <HubFooter />
  </>;
}
