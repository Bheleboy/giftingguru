import { notFound } from "next/navigation";
import { getCurrentStore } from "../../lib/store";
import { getAlternatives, getPublicCatalogue, getPublicProduct, SITE_URL } from "../../lib/public-catalog";
import { COMPARE_GROUPS } from "../../lib/product-content";
import ProductActions from "./product-actions";
import Gallery from "./gallery";
import Link from "next/link";
import { brandOf, breadcrumbLd, categoryLabel, categorySlug, getCatalogueIndex, jsonLd as ld, largeImage, OFFER_EXTRAS, productIntro, slugify } from "../../lib/seo";
import { rands } from "../../lib/money";

export const revalidate = 300;

function plain(text, max) {
  return String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

async function load(params) {
  const { sku } = await params;
  const store = await getCurrentStore();
  const product = await getPublicProduct(decodeURIComponent(sku), store?.id);
  return { product, store };
}

export async function generateMetadata({ params }) {
  const { product } = await load(params);
  if (!product) return { title: "Product not found | GiftingGuru", robots: { index: false } };
  const url = `${SITE_URL}/products/${encodeURIComponent(product.sku)}`;
  const price = product.retail_price ? `${rands(product.retail_price)}` : "";
  const brand = brandOf(product);
  const lead = `Buy the ${product.name}${price ? " for " + price : ""} at Gifting Guru${brand ? `, your ${brand} stockist` : ""}. Delivery across South Africa, free over R1 500.`;
  const own = plain(product.description, 300);
  const raw = own && own.toLowerCase() !== String(product.name).toLowerCase() ? `${own}${price ? " " + price + " at Gifting Guru." : ""}` : lead;
  const description = raw.length <= 160 ? raw : raw.slice(0, 157).replace(/\s+\S*$/, "") + "...";
  const images = product.image_urls?.length ? product.image_urls.slice(0, 1).map((src) => ({ url: largeImage(src), width: 800, height: 800, alt: product.name })) : [{ url: `${SITE_URL}/reference-hero.webp` }];
  return {
    title: `${product.name}${price ? " | " + price : ""} | Gifting Guru South Africa`,
    description,
    alternates: { canonical: url },
    robots: product.active ? undefined : { index: false },
    openGraph: { type: "website", url, siteName: "GiftingGuru", title: product.name, description, images, locale: "en_ZA" },
    twitter: { card: "summary_large_image", title: product.name, description, images: images.map((i) => i.url) },
    other: product.retail_price ? {
      "product:price:amount": String(product.retail_price),
      "product:price:currency": "ZAR",
      "product:availability": product.available ? "in stock" : "out of stock",
    } : undefined,
  };
}

export default async function ProductPage({ params }) {
  const { product, store } = await load(params);
  if (!product) notFound();

  const price = product.retail_price;
  const stock = product.stock_qty;
  const image = product.image_urls?.[0] ? largeImage(product.image_urls[0]) : null;
  const brandName = brandOf(product);
  const catSlug = categorySlug(product);
  const catName = catSlug ? categoryLabel(catSlug) : null;
  const { brands, categories } = await getCatalogueIndex();
  const brandHub = brandName ? brands.find((b) => b.slug === slugify(brandName)) : null;
  const catHub = catSlug ? categories.find((c) => c.slug === catSlug) : null;
  const pool = [...(brandHub?.items || []).filter((p) => categorySlug(p) === catSlug), ...(catHub?.items || []), ...(brandHub?.items || [])];
  const seen = new Set([product.sku]);
  const related = pool.filter((p) => p.available && !seen.has(p.sku) && seen.add(p.sku)).slice(0, 8);
  const trail = [{ name: "Home", path: "/" }];
  if (catHub) trail.push({ name: catHub.label, path: `/shop/${catHub.slug}` });
  if (brandHub) trail.push({ name: brandHub.label, path: `/brands/${brandHub.slug}` });
  trail.push({ name: product.name, path: `/products/${encodeURIComponent(product.sku)}` });
  const intro = productIntro(product, brandName, catName);
  const alternatives = product.available ? [] : await getAlternatives(product, store?.id);
  const group = product.compare_group ? COMPARE_GROUPS[product.compare_group] : null;
  let compare = [];
  if (group) {
    const bySku = new Map((await getPublicCatalogue(store?.id)).map((p) => [p.sku, p]));
    compare = group.skus.map((s) => (s === product.sku ? product : bySku.get(s))).filter(Boolean);
  }
  const url = `${SITE_URL}/products/${encodeURIComponent(product.sku)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    mpn: product.sku,
    brand: { "@type": "Brand", name: brandName || product.brand || String(product.name).split(/\s+/)[0] },
    image: (product.image_urls || []).map((u) => largeImage(u)),
    description: [plain(product.description, 4000), intro].filter(Boolean).join(" "),
    category: catName || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "ZAR",
      price: price ? price.toFixed(2) : undefined,
      priceValidUntil: product.sale_ends ? product.sale_ends.slice(0, 10) : undefined,
      availability: product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url,
      ...OFFER_EXTRAS,
    },
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />
    <header style={{borderBottom:"1px solid #e5e7eb",background:"#fff"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
        <a href="/"><img src="/giftingguru-logo.png" alt="GiftingGuru" style={{width:200,maxWidth:"55vw",height:"auto"}} /></a>
        <a href="/#shop" style={{color:"#111827",fontWeight:700}}>Continue shopping</a>
      </div>
    </header>
    <script type="application/ld+json" dangerouslySetInnerHTML={ld(breadcrumbLd(trail))} />
    <main style={{maxWidth:1200,margin:"0 auto",padding:"28px 20px 72px"}}>
      <nav className="hubcrumbs" aria-label="Breadcrumb" style={{marginBottom:20}}>
        {trail.map((t, i) => <span key={t.path}>{i < trail.length - 1 ? <><Link href={t.path}>{t.name}</Link><span className="sep">/</span></> : <span aria-current="page">{t.name}</span>}</span>)}
      </nav>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:40,alignItems:"start"}}>
        <div style={{border:"1px solid #e5e7eb",borderRadius:16,padding:24,background:"#fff",minHeight:320,display:"grid",gridTemplateColumns:"minmax(0,1fr)",placeItems:"center",minWidth:0,overflow:"hidden"}}>
          {image ? <Gallery images={(product.image_urls || []).map((u) => largeImage(u))} alt={product.name} dim={!product.available} /> : null}
        </div>
        <section>
          <div style={{color:"#6b7280",fontSize:14,marginBottom:10}}>{brandHub ? <><Link href={`/brands/${brandHub.slug}`} style={{color:"#00a8e8",fontWeight:700}}>{brandHub.label}</Link> · </> : null}SKU {product.sku}</div>
          <h1 style={{fontSize:"clamp(28px,4vw,46px)",lineHeight:1.08,margin:"0 0 20px",color:"#111827"}}>{product.name}</h1>
          {price && product.active ? (
            <div style={{display:"flex",alignItems:"baseline",flexWrap:"wrap",gap:"6px 12px",marginBottom:12}}>
              {product.was_price ? <span style={{background:"#e63262",color:"#fff",fontWeight:800,fontSize:13,letterSpacing:".04em",textTransform:"uppercase",padding:"5px 10px",borderRadius:999,alignSelf:"center"}}>Sale</span> : null}
              <span style={{fontSize:34,fontWeight:800,color:product.was_price ? "#e63262" : "#111827"}}>{rands(price)}</span>
              {product.was_price ? <><s style={{fontSize:20,color:"#6b7280"}}>{rands(product.was_price)}</s><span style={{fontSize:15,fontWeight:700,color:"#159947"}}>Save {rands(product.was_price - price)}</span></> : null}
            </div>
          ) : null}
          {product.available ? (
            <div style={{fontWeight:700,color:"#159947",marginBottom:20}}>{stock < 10 ? `Only ${stock} left` : "In stock"} · Delivery R120, free over R1 500</div>
          ) : (
            <div style={{margin:"0 0 20px",padding:16,borderRadius:12,background:"#fff7ed",color:"#9a3412",fontWeight:600}}>
              {product.hidden_reason ? <>{product.hidden_reason}{product.replacement_sku ? <> <Link href={`/products/${encodeURIComponent(product.replacement_sku)}`} style={{color:"#9a3412",textDecoration:"underline"}}>See the replacement</Link></> : null}</> : <>{product.active ? "This product is currently out of stock." : "This product is no longer available."} Have a look at the similar products below.</>}
            </div>
          )}
          {product.best_for ? <p style={{margin:"0 0 14px",padding:"12px 14px",borderRadius:10,background:"#fff8d6",color:"#111827",lineHeight:1.5}}><strong>Best for:</strong> {product.best_for}</p> : null}
          {product.description && plain(product.description).toLowerCase() !== String(product.name).toLowerCase() ? <p style={{fontSize:17,lineHeight:1.7,color:"#4b5563"}}>{plain(product.description, 1200)}</p> : null}
          {product.specs?.length ? (
            <dl className="specs" style={{fontSize:15}}>
              {product.specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          ) : null}
          {product.oem_url ? <p style={{fontSize:14,margin:"0 0 16px"}}><a href={product.oem_url} target="_blank" rel="noopener noreferrer" style={{color:"#00a8e8",fontWeight:700}}>Full specifications from the manufacturer</a></p> : null}
          <p style={{fontSize:15,lineHeight:1.7,color:"#6b7280"}}>{intro}</p>
          <ProductActions sku={product.sku} name={product.name} price={price} available={product.available} category={product.category_path} />
          <div style={{marginTop:28,padding:20,borderRadius:12,background:"#f8fafc",color:"#374151"}}>
            <strong>Secure South African shopping</strong>
            <p style={{margin:"8px 0 0"}}>Secure checkout powered by Stitch. Nationwide delivery.</p>
          </div>
        </section>
      </div>
      {compare.length > 1 ? (
        <section id="compare" style={{marginTop:56}}>
          <h2 style={{fontSize:24,margin:"0 0 6px"}}>{group.title}</h2>
          <p style={{margin:"0 0 18px",color:"#6b7280"}}>Side by side, so you can pick the right one for your home.</p>
          <div className="comparewrap">
            <table className="comparetable">
              <thead>
                <tr>
                  <th scope="col"><span className="sr-only">Spec</span></th>
                  {compare.map((p) => (
                    <th key={p.sku} scope="col" className={p.sku === product.sku ? "current" : undefined}>
                      {p.sku === product.sku ? <span>{p.name}</span> : <Link href={`/products/${encodeURIComponent(p.sku)}`} style={{color:"#111827"}}>{p.name}</Link>}
                      <div style={{fontWeight:800,marginTop:6}}>{p.retail_price ? rands(p.retail_price) : ""}</div>
                      <div style={{fontWeight:600,fontSize:13,color:p.available ? "#159947" : "#9a3412",marginTop:2}}>{p.available ? "In stock" : "Out of stock"}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Best for</th>
                  {compare.map((p) => <td key={p.sku} className={p.sku === product.sku ? "current" : undefined}>{p.best_for}</td>)}
                </tr>
                {group.rows.map(([key, label]) => (
                  <tr key={key}>
                    <th scope="row">{label}</th>
                    {compare.map((p) => <td key={p.sku} className={p.sku === product.sku ? "current" : undefined}>{(p.specs || []).find(([l]) => l === label)?.[1] || ""}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {alternatives.length ? (
        <section style={{marginTop:56}}>
          <h2 style={{fontSize:24,margin:"0 0 18px"}}>Similar products in stock</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
            {alternatives.map((alt) => (
              <a key={alt.id} href={`/products/${encodeURIComponent(alt.sku)}`} style={{border:"1px solid #e5e7eb",borderRadius:12,padding:14,color:"#111827",textDecoration:"none",background:"#fff"}}>
                {alt.image_urls?.[0] ? <img src={alt.image_urls[0]} alt={alt.name} style={{width:"100%",height:150,objectFit:"contain"}} /> : null}
                <div style={{fontWeight:700,margin:"10px 0 6px",lineHeight:1.3}}>{alt.name}</div>
                <div style={{fontWeight:800}}>{rands(alt.retail_price)}</div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {related.length ? (
        <section style={{marginTop:56}}>
          <h2 style={{fontSize:24,margin:"0 0 18px"}}>{brandHub ? `More from ${brandHub.label}` : `More ${catName || "gift ideas"}`}</h2>
          <ul className="hubgrid">
            {related.map((p) => (
              <li key={p.id}>
                <Link href={`/products/${encodeURIComponent(p.sku)}`} className="hubcard">
                  <span className="hubpic">{p.image_urls?.[0] ? <img src={p.image_urls[0]} alt={p.name} loading="lazy" /> : null}</span>
                  <span className="hubname">{p.name}</span>
                  <span className="hubprice">{rands(p.retail_price)}{p.was_price ? <s style={{marginLeft:6,color:"#6b7280",fontWeight:500,fontSize:"0.85em"}}>{rands(p.was_price)}</s> : null}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p style={{marginTop:18,display:"flex",gap:18,flexWrap:"wrap"}}>
            {brandHub ? <Link href={`/brands/${brandHub.slug}`} style={{fontWeight:700,color:"#00a8e8"}}>All {brandHub.label} products</Link> : null}
            {catHub ? <Link href={`/shop/${catHub.slug}`} style={{fontWeight:700,color:"#00a8e8"}}>All {catHub.label.toLowerCase()}</Link> : null}
          </p>
        </section>
      ) : null}
    </main>
  </>;
}
