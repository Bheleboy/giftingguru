import "server-only";

import { brandOf, categoryLabel, categorySlug, plain } from "./seo";

// Google product taxonomy (top levels and well-known branches) per store category.
const GOOGLE_CATEGORY = {
  devices: "Electronics",
  "kitchen-and-home": "Home & Garden > Kitchen & Dining",
  audio: "Electronics > Audio",
  networking: "Electronics > Networking",
  electrical: "Hardware > Power & Electrical Supplies",
  "mobile-accessories": "Electronics > Communications > Telephony > Mobile Phone Accessories",
  bags: "Luggage & Bags",
  "computer-peripherals": "Electronics > Electronics Accessories",
  lighting: "Home & Garden > Lighting",
  "baby-toddler": "Baby & Toddler",
  gaming: "Electronics",
  luggage: "Luggage & Bags",
  wearables: "Electronics",
  furniture: "Furniture",
  "smart-home": "Electronics",
  "health-and-wellness": "Health & Beauty",
  "education-and-learning": "Toys & Games",
  televisions: "Electronics > Video > Televisions",
  photography: "Cameras & Optics",
  "toys-and-games": "Toys & Games",
  "computer-accessories": "Electronics > Electronics Accessories",
  electronics: "Electronics",
  "fashion-and-beauty": "Apparel & Accessories",
  "sports-and-fitness": "Sporting Goods",
  software: "Software",
};

// Search-style phrases shoppers use for each category, worked into descriptions.
const CATEGORY_PHRASES = {
  devices: "smart gadget and tech gift",
  "kitchen-and-home": "kitchen and home essential",
  audio: "speaker, earphones and audio gift",
  networking: "Wi-Fi and networking upgrade",
  electrical: "power and electrical accessory",
  "mobile-accessories": "phone accessory",
  bags: "bag and backpack",
  "computer-peripherals": "computer accessory for home and office",
  lighting: "lamp and lighting gift",
  "baby-toddler": "baby and toddler essential",
  gaming: "gaming accessory and gamer gift",
  luggage: "luggage and travel gear",
  wearables: "smartwatch and wearable tech",
  furniture: "home and office furniture",
  "smart-home": "smart home device",
  "health-and-wellness": "health and wellness gift",
  "education-and-learning": "educational toy",
  televisions: "TV and home entertainment",
  photography: "camera and photography gear",
  "toys-and-games": "toy and game gift",
  "computer-accessories": "computer accessory",
  electronics: "electronics gift",
  "fashion-and-beauty": "fashion and beauty gift",
  "sports-and-fitness": "sports and fitness gear",
};

const NOISE = /new product supplied by an authorised south african reseller\.?/i;

export function merchantTitle(product) {
  const name = String(product.name || "").replace(/\s+/g, " ").trim();
  const brand = brandOf(product);
  // Lead with the brand when the supplier name does not already contain it.
  const titled = brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name;
  return titled.slice(0, 150);
}

export function merchantDescription(product, price) {
  const own = plain(product.description).replace(NOISE, "").trim();
  const slug = categorySlug(product);
  const brand = brandOf(product);
  const label = slug ? categoryLabel(slug).toLowerCase() : "gifts and tech";
  const phrase = CATEGORY_PHRASES[slug] || "gift idea";
  const freeDelivery = price >= 1500;
  const parts = [];
  const bare = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (own && bare(own) !== bare(product.name)) parts.push(own);
  parts.push(
    `${merchantTitle(product)}${brand ? `, a genuine ${brand} product` : ""}, available new from GiftingGuru in South Africa.`,
    `A practical ${phrase} from our ${label} range that works as a birthday, anniversary, Christmas or year-end gift.`,
    freeDelivery
      ? "Free nationwide delivery across South Africa."
      : "Nationwide delivery across South Africa for R120, free on orders of R1 500 or more.",
    "Secure online checkout, 7-day change-of-mind returns and free gift reminders so you never miss a special date.",
  );
  return parts.join(" ").replace(/\s+/g, " ").slice(0, 5000);
}

export function merchantFields(product, price) {
  const slug = categorySlug(product);
  const label = slug ? categoryLabel(slug) : "Gifts & Tech";
  const brand = brandOf(product);
  return {
    googleCategory: GOOGLE_CATEGORY[slug] || null,
    productType: ["Gifts & Tech", label, brand].filter(Boolean).join(" > "),
    shippingPrice: price >= 1500 ? "0.00" : "120.00",
    customLabels: [
      label,
      price < 250 ? "under R250" : price < 500 ? "R250 to R500" : price < 1500 ? "R500 to R1500" : "R1500 plus",
      brand || "Other brands",
    ],
  };
}
