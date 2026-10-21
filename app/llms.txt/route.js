import { getCatalogueIndex, SITE_URL } from "../lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  const { categories, brands, items } = await getCatalogueIndex();
  const body = `# GiftingGuru (Gifting Guru)

> GiftingGuru (giftingguru.co.za) is a South African online gift and technology store owned by Private Clients Advisory (Pty) Ltd. It sells ${items.length.toLocaleString("en-ZA")} gifts, gadgets and home essentials from brands such as ${brands.slice(0, 8).map((b) => b.label).join(", ")}, and runs a free gift-reminder service that emails customers before birthdays, anniversaries and other special dates.

- Delivery: nationwide in South Africa, flat R120 per order, free when the order subtotal is R1 500 or more
- Prices: South African rand (ZAR), shown on every product page
- Checkout: secure online card and instant EFT payment
- Returns: change-of-mind notice within 7 days of delivery, plus Consumer Protection Act remedies for defective goods
- Contact: hello@giftingguru.co.za

## Shop by category
${categories.map((c) => `- [${c.label}](${SITE_URL}/shop/${c.slug}): ${c.items.length} products`).join("\n")}

## Shop by brand
${brands.slice(0, 40).map((b) => `- [${b.label}](${SITE_URL}/brands/${b.slug}): ${b.items.length} products`).join("\n")}

## Services
- [Free gift reminders](${SITE_URL}/gift-reminders): reminder emails before the dates that matter

## Policies
- [Shipping](${SITE_URL}/shipping)
- [Returns, refunds and exchanges](${SITE_URL}/returns)
- [Terms](${SITE_URL}/terms)
- [Privacy](${SITE_URL}/privacy)

## Machine-readable catalogue
- [Product feed (Google Merchant XML)](${SITE_URL}/google-merchant-feed.xml)
- [Sitemap](${SITE_URL}/sitemap.xml)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
