import { getMerchantProducts, productUrl, retailPrice, SITE_URL } from "../lib/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function xml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cleanDescription(product) {
  const fallback = `${product.name}. New product supplied by an authorised South African reseller.`;
  return String(product.description || fallback)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

function inferredBrand(product) {
  const known = [
    "VolkanoX", "Volkano", "TP-Link", "Creality", "Ellies", "Amplify",
    "Switched", "Rocka", "Eiger", "Connex Connect", "Kingsons", "Edumatic",
  ];
  const text = `${product.brand || ""} ${product.name || ""}`;
  return known.find((brand) => text.toLowerCase().includes(brand.toLowerCase()))
    || product.brand
    || String(product.name).split(/\s+/)[0]
    || "GiftingGuru";
}

export async function GET() {
  try {
    const products = await getMerchantProducts();
    const items = products.map((product) => {
      const price = retailPrice(product);
      const availability = Number(product.stock_qty || 0) > 0 ? "in_stock" : "out_of_stock";
      const additionalImages = (product.image_urls || []).slice(1, 11)
        .map((image) => `<g:additional_image_link>${xml(image)}</g:additional_image_link>`)
        .join("");

      return `<item>
<g:id>${xml(product.sku)}</g:id>
<title>${xml(product.name)}</title>
<description>${xml(cleanDescription(product))}</description>
<link>${xml(productUrl(product))}</link>
<g:image_link>${xml(product.image_urls[0])}</g:image_link>
${additionalImages}
<g:availability>${availability}</g:availability>
<g:price>${price.toFixed(2)} ZAR</g:price>
<g:condition>new</g:condition>
<g:brand>${xml(inferredBrand(product))}</g:brand>
<g:mpn>${xml(product.sku)}</g:mpn>
<g:product_type>${xml(String(product.category_path || "Gifts & Technology").replaceAll("/", " > "))}</g:product_type>
</item>`;
    }).join("\n");

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>GiftingGuru South Africa</title>
<link>${SITE_URL}</link>
<description>GiftingGuru live product catalogue</description>
${items}
</channel>
</rss>`;

    return new Response(body, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
        "X-Product-Count": String(products.length),
      },
    });
  } catch (error) {
    return new Response(`Feed generation failed: ${error.message}`, { status: 500 });
  }
}
