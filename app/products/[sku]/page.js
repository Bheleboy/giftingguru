import { notFound } from "next/navigation";
import { getProductBySku, retailPrice } from "../../lib/catalog";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { sku } = await params;
  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) return { title: "Product not found | GiftingGuru" };
  return {
    title: `${product.name} | GiftingGuru`,
    description: String(product.description || `Shop ${product.name} from GiftingGuru South Africa.`).slice(0, 160),
    alternates: { canonical: `/products/${encodeURIComponent(product.sku)}` },
    openGraph: { images: product.image_urls?.[0] ? [product.image_urls[0]] : [] },
  };
}

export default async function ProductPage({ params }) {
  const { sku } = await params;
  const product = await getProductBySku(decodeURIComponent(sku));
  if (!product) notFound();

  const price = retailPrice(product);
  const stock = Number(product.stock_qty || 0);
  const image = product.image_urls?.[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    mpn: product.sku,
    brand: { "@type": "Brand", name: product.brand || String(product.name).split(/\s+/)[0] },
    image: product.image_urls || [],
    description: product.description || product.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "ZAR",
      price: price?.toFixed(2),
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `https://giftingguru.vercel.app/products/${encodeURIComponent(product.sku)}`,
    },
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }} />
    <header style={{borderBottom:"1px solid #e5e7eb",background:"#fff"}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <a href="/"><img src="/giftingguru-logo.png" alt="GiftingGuru" style={{width:220,height:"auto"}} /></a>
        <a href="/#shop" style={{color:"#111827",fontWeight:700}}>Continue shopping</a>
      </div>
    </header>
    <main style={{maxWidth:1200,margin:"0 auto",padding:"48px 24px 72px"}}>
      <div style={{display:"grid",gridTemplateColumns:"minmax(280px,1fr) minmax(300px,1fr)",gap:48,alignItems:"start"}}>
        <div style={{border:"1px solid #e5e7eb",borderRadius:16,padding:28,background:"#fff",minHeight:420,display:"grid",placeItems:"center"}}>
          {image ? <img src={image} alt={product.name} style={{maxWidth:"100%",maxHeight:460,objectFit:"contain"}} /> : null}
        </div>
        <section>
          <div style={{color:"#6b7280",fontSize:14,marginBottom:10}}>SKU {product.sku}</div>
          <h1 style={{fontSize:"clamp(30px,4vw,48px)",lineHeight:1.08,margin:"0 0 20px",color:"#111827"}}>{product.name}</h1>
          <div style={{fontSize:34,fontWeight:800,color:"#111827",marginBottom:12}}>R {price?.toLocaleString("en-ZA")}</div>
          <div style={{fontWeight:700,color:stock > 0 ? "#159947" : "#b91c1c",marginBottom:28}}>{stock > 0 ? `${stock} in stock` : "Out of stock"}</div>
          {product.description ? <p style={{fontSize:17,lineHeight:1.7,color:"#4b5563"}}>{product.description}</p> : null}
          <div style={{marginTop:28,padding:20,borderRadius:12,background:"#f8fafc",color:"#374151"}}>
            <strong>Secure South African shopping</strong>
            <p style={{margin:"8px 0 0"}}>Live supplier availability and GiftingGuru retail pricing.</p>
          </div>
          <a href={`/?q=${encodeURIComponent(product.sku)}#shop`} style={{display:"inline-block",marginTop:24,padding:"14px 24px",borderRadius:9,background:"#111827",color:"#fff",fontWeight:800,textDecoration:"none"}}>View in store</a>
        </section>
      </div>
    </main>
  </>;
}
