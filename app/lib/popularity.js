// Shared by the server (first-paint selection) and the browser (sorting).
export const sell = (p) => p.retail_price ?? null;
export const demandSignals = [
  [/(true wireless|tws|earbud)/i, 120],
  [/(bluetooth.*headphone|wireless.*headphone)/i, 110],
  [/(power bank|10000mah|20000mah)/i, 105],
  [/(fast charger|wall charger|usb-c charger|type-c charger)/i, 95],
  [/(bluetooth speaker|portable speaker)/i, 90],
  [/(smart watch|smartwatch|fitness watch)/i, 88],
  [/(gaming|gamepad|controller)/i, 78],
  [/(router|wi-fi|wifi|mesh)/i, 74],
  [/(laptop bag|backpack|computer accessory)/i, 65],
  [/(air fryer|kitchen appliance)/i, 62],
  [/(security camera|smart home)/i, 58],
  [/(kids|school|education)/i, 42],
];
export const heroSkus = new Set([
  "VK-2002-BK",
  "VK-9021-BK",
  "VK-1158-WT",
  "VK-3453-BK[V2]",
  "VK-5018-GN",
  "VK-8063-WT",
]);
export function popularityScore(p, store) {
  const text = [p.name, p.brand, p.category_path, p.description].join(" ");
  let score = 0;
  for (const [pattern, weight] of demandSignals)
    if (pattern.test(text)) score += weight;
  const stock = Number(p.stock_qty || 0),
    price = sell(p) || 0;
  if (stock > 0) score += 25;
  if (stock > 20) score += Math.min(25, Math.log10(stock + 1) * 10);
  if (price >= 150 && price <= 1500) score += 18;
  if (/volkano|amplify|switched|tp-link|eiger|rocka/i.test(text)) score += 15;
  if (heroSkus.has(p.sku)) score += 80;
  return score;
}
