import { popularityScore } from "./popularity";

const topCategory = (p) => (p.category_path || "").split("/").filter(Boolean)[0];

// The small slice of the catalogue the homepage needs before the full list loads:
// the "Fresh finds" grid, the Volkano showcase and one product per category circle.
export function firstPaint(items, store) {
  const categories = [...new Set(items.map(topCategory).filter(Boolean))];
  const pick = new Map();
  const add = (p) => p && pick.set(p.id, p);
  [...items].sort((a, b) => popularityScore(b, store) - popularityScore(a, store)).slice(0, 24).forEach(add);
  items.filter((x) => (x.name || "").toLowerCase().includes("volkano") || (x.brand || "").toLowerCase() === "volkano").slice(0, 6).forEach(add);
  for (const c of categories.slice(0, 14)) add(items.find((x) => (x.category_path || "").includes(c)));
  // Keep catalogue order so first-match lookups give the same result before and after the full load.
  return { items: items.filter((p) => pick.has(p.id)), categories, total: items.length };
}
