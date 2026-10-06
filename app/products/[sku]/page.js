import { notFound } from "next/navigation";
import { getCurrentStore } from "../../lib/store";
import { getAlternatives, getPublicProduct, SITE_URL } from "../../lib/public-catalog";
import ProductActions from "./product-actions";

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
  const price = product.retail_price ? `R ${product.retail_price.toLocaleString("en-ZA")}` : "";
  const description = plain(product.description, 155) || `Shop ${product.name}${price ? " for " + price : ""} at GiftingGuru. Nationwide delivery across South Africa.`;
  const images = product.image_urls?.length ? product.image_urls.slice(0, 1).map((src) => ({ url: src, alt: product.name })) : [{ url: `${SITE_URL}/reference-hero.webp` }];
  return {
    title: `${product.name}${price ? " | " + price : ""} | GiftingGuru`,
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
  const image = product.image_urls?.[0];
  const alternatives = product.available ? [] : await getAlternatives(product, store?.id);
  const url = `${SITE_URL}/products/${encodeURIComponent(product.sku)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    mpn: product.sku,
    brand: { "@type": "Brand", name: product.brand || String(product.name).split(/\s+/)[0] },
    image: product.image_urls || [],
    description: plain(product.description, 5000) || product.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "ZAR",
      price: price ? price.toFixed(2) : undefined,
      availability: product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url,
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
    <main style={{maxWidth:1200,margin:"0 auto",padding:"40px 20px 72px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:40,alignItems:"start"}}>
        <div style={{border:"1px solid #e5e7eb",borderRadius:16,padding:24,background:"#fff",minHeight:320,display:"grid",placeItems:"center"}}>
          {image ? <img src={image} alt={product.name} style={{maxWidth:"100%",maxHeight:460,objectFit:"contain",opacity:product.available ? 1 : 0.55}} /> : null}
        </div>
        <section>
          <div style={{color:"#6b7280",fontSize:14,marginBottom:10}}>SKU {product.sku}</div>
          <h1 style={{fontSize:"clamp(28px,4vw,46px)",lineHeight:1.08,margin:"0 0 20px",color:"#111827"}}>{product.name}</h1>
          {price ? <div style={{fontSize:34,fontWeight:800,color:"#111827",marginBottom:12}}>R {price.toLocaleString("en-ZA")}</div> : null}
          {product.available ? (
            <div style={{fontWeight:700,color:"#159947",marginBottom:20}}>{stock < 10 ? `Only ${stock} left` : "In stock"} · Delivery R120, free over R1 500</div>
          ) : (
            <div style={{margin:"0 0 20px",padding:16,borderRadius:12,background:"#fff7ed",color:"#9a3412",fontWeight:600}}>
              {product.active ? "This product is currently out of stock." : "This product is no longer available."} Have a look at the similar products below.
            </div>
          )}
          {product.description ? <p style={{fontSize:17,lineHeight:1.7,color:"#4b5563"}}>{plain(product.description, 1200)}</p> : null}
          <ProductActions sku={product.sku} name={product.name} price={price} available={product.available} category={product.category_path} />
          <div style={{marginTop:28,padding:20,borderRadius:12,background:"#f8fafc",color:"#374151"}}>
            <strong>Secure South African shopping</strong>
            <p style={{margin:"8px 0 0"}}>Secure checkout powered by Stitch. Nationwide delivery.</p>
          </div>
        </section>
      </div>
      {alternatives.length ? (
        <section style={{marginTop:56}}>
          <h2 style={{fontSize:24,margin:"0 0 18px"}}>Similar products in stock</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
            {alternatives.map((alt) => (
              <a key={alt.id} href={`/products/${encodeURIComponent(alt.sku)}`} style={{border:"1px solid #e5e7eb",borderRadius:12,padding:14,color:"#111827",textDecoration:"none",background:"#fff"}}>
                {alt.image_urls?.[0] ? <img src={alt.image_urls[0]} alt={alt.name} style={{width:"100%",height:150,objectFit:"contain"}} /> : null}
                <div style={{fontWeight:700,margin:"10px 0 6px",lineHeight:1.3}}>{alt.name}</div>
                <div style={{fontWeight:800}}>R {alt.retail_price.toLocaleString("en-ZA")}</div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  </>;
}
