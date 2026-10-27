// Time-limited sale prices, keyed by SKU.
//
// A sale replaces the normal markup price everywhere: storefront, product page,
// checkout, Google Shopping feed and reminder emails. The normal price is kept
// as the "was" price so shoppers see the saving.
//
// Safety: a sale only applies while it is cheaper than the normal price AND at
// least MIN_MARGIN above SMD's cost incl. VAT. If SMD raises its cost so the
// sale would sell near or below cost, the product quietly falls back to its
// normal price instead of losing money.

export const MIN_MARGIN = 0.08;

export const SALES = {
  "ENDER-3V3-PLUS": {
    // Normal price R10 323 (cost incl. VAT ~R7 647 + 35%). SA competitors in
    // Oct 2026: R8 499 (clearance sales at 3D Printing Store and Create it 3D),
    // R9 499 lowest regular listing on PriceCheck.
    price: 8999,
    ends: "2026-12-12T23:59:59+02:00", // last shipping date before Christmas
    label: "Sale",
  },
};

export function activeSale(product, store, regular, now = Date.now()) {
  const sale = SALES[product?.sku];
  if (!sale || !regular) return null;
  if (sale.starts && now < Date.parse(sale.starts)) return null;
  if (sale.ends && now > Date.parse(sale.ends)) return null;
  if (!(sale.price < regular)) return null;
  const cost = Number(product.wholesale_price) * (1 + Number(store?.vat_pct ?? 15) / 100);
  if (!(cost > 0) || sale.price < Math.ceil(cost * (1 + MIN_MARGIN))) return null;
  return { price: sale.price, was: regular, label: sale.label || "Sale", ends: sale.ends || null };
}
