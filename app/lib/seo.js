import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getPublicCatalogue, SITE_URL } from "./public-catalog";

export { SITE_URL };
export const SITE_NAME = "GiftingGuru";
export const SITE_ALT_NAMES = ["Gifting Guru", "Gifting Guru South Africa", "giftingguru.co.za"];

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\(r\)|®|™/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function plain(text, max = 5000) {
  return String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

const KNOWN_BRANDS = [
  "VolkanoX", "Volkano", "TP-Link", "Creality", "Ellies", "Amplify", "Switched", "Rocka", "Eiger",
  "Connex Connect", "Kingsons", "Edu-matic", "LocknLock", "Travelwize", "Everfurn", "Elektra",
  "Pigeon", "Insta360", "Logitech", "Supanova", "Snappy", "Toshiba", "Casio", "Sharp", "Kioxia",
  "Sony", "Disney", "Bounce", "Carmen", "Nexon", "Soleyin", "Aura",
];

// Supplier "brand" values are sometimes the first word of the name ("Kitchen", "Pro", "SA").
export function brandOf(product) {
  const text = `${product.brand || ""} ${product.name || ""}`.toLowerCase();
  const known = KNOWN_BRANDS.find((b) => text.includes(b.toLowerCase()));
  if (known) return known;
  const raw = String(product.brand || "").replace(/\(r\)|®|™/gi, "").trim();
  return raw.length > 2 ? raw : null;
}

const CATEGORY_LABELS = {
  devices: "Smart Devices",
  "kitchen-and-home": "Kitchen & Home",
  audio: "Audio & Speakers",
  networking: "Networking & Wi-Fi",
  electrical: "Electrical & Power",
  "mobile-accessories": "Mobile Accessories",
  bags: "Bags & Backpacks",
  "computer-peripherals": "Computer Peripherals",
  lighting: "Lighting & Lamps",
  "baby-toddler": "Baby & Toddler",
  gaming: "Gaming",
  luggage: "Luggage & Travel",
  wearables: "Wearables & Smartwatches",
  furniture: "Furniture",
  "smart-home": "Smart Home",
  "health-and-wellness": "Health & Wellness",
  "education-and-learning": "Education & Learning",
  televisions: "Televisions",
  photography: "Photography & Action Cameras",
  "toys-and-games": "Toys & Games",
  "computer-accessories": "Computer Accessories",
  electronics: "Electronics",
  "fashion-and-beauty": "Fashion & Beauty",
  "sports-and-fitness": "Sports & Fitness",
  software: "Software",
  digital: "Digital",
};

export function categorySlug(product) {
  return slugify(String(product.category_path || "").split("/").filter(Boolean)[0] || "");
}

export function categoryLabel(slug) {
  if (CATEGORY_LABELS[slug]) return CATEGORY_LABELS[slug];
  return String(slug || "").split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export const productPath = (p) => `/products/${encodeURIComponent(p.sku)}`;

const LITE_FIELDS = ["id", "sku", "name", "brand", "category_path", "retail_price", "available", "stock_qty"];

async function buildIndex() {
  const rows = (await getPublicCatalogue()).filter((p) => p.sku && p.name);
  // Only what hubs and related-product rails need, so the cached index stays small.
  const items = rows.map((p) => {
    const out = {};
    for (const k of LITE_FIELDS) out[k] = p[k] ?? null;
    out.image_urls = p.image_urls?.length ? [p.image_urls[0]] : [];
    return out;
  });
  items.sort((a, b) => Number(b.available) - Number(a.available) || Number(b.stock_qty || 0) - Number(a.stock_qty || 0));
  const categories = new Map();
  const brands = new Map();
  for (const p of items) {
    const c = categorySlug(p);
    if (c && c !== "digital") {
      if (!categories.has(c)) categories.set(c, { slug: c, label: categoryLabel(c), items: [] });
      categories.get(c).items.push(p);
    }
    const b = brandOf(p);
    if (b) {
      const s = slugify(b);
      if (!brands.has(s)) brands.set(s, { slug: s, label: b, items: [] });
      brands.get(s).items.push(p);
    }
  }
  const byCount = (a, b) => b.items.length - a.items.length;
  return {
    items,
    categories: [...categories.values()].sort(byCount),
    // A brand page needs a few products to be worth indexing.
    brands: [...brands.values()].filter((b) => b.items.length >= 3).sort(byCount),
  };
}

const cachedIndex = unstable_cache(buildIndex, ["catalogue-index-v1"], { revalidate: 3600 });

// Catalogue grouped by category and brand, in-stock items first. Cached for an hour.
export const getCatalogueIndex = cache(() => cachedIndex());

export function priceText(p) {
  return p.retail_price ? `R ${Number(p.retail_price).toLocaleString("en-ZA")}` : "";
}

export function jsonLd(data) {
  return { __html: JSON.stringify(data).replaceAll("<", "\\u003c") };
}

export function breadcrumbLd(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: `${SITE_URL}${t.path}` })),
  };
}

export const OFFER_EXTRAS = {
  seller: { "@type": "Organization", name: SITE_NAME },
  shippingDetails: {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: "120.00", currency: "ZAR" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "ZA" },
  },
  hasMerchantReturnPolicy: {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "ZA",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    merchantReturnLink: `${SITE_URL}/returns`,
  },
};

// Supplier images default to 262px thumbnails; the CDN serves larger renditions on request.
export function largeImage(url, size = 800) {
  const s = String(url || "");
  if (!s.includes("storefront7.co.za")) return s;
  return s.replace(/([?&])height=\d+/, `$1height=${size}`).replace(/([?&])width=\d+/, `$1width=${size}`);
}

export function productIntro(p, brand, catLabel) {
  const price = priceText(p);
  const who = catLabel ? catLabel.toLowerCase() : "gift";
  const parts = [
    `The ${p.name}${brand && !String(p.name).toLowerCase().includes(brand.toLowerCase()) ? ` by ${brand}` : ""} is part of the GiftingGuru ${who} range${price ? `, priced at ${price}` : ""}.`,
    `Order it online from GiftingGuru and we deliver anywhere in South Africa for a flat R120, or free when your order comes to R1 500 or more.`,
    `It makes an easy birthday, anniversary or year-end gift, and you can set a free GiftingGuru reminder so the next special date never sneaks up on you.`,
  ];
  return parts.join(" ");
}
