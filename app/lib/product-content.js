// Curated product content, keyed by SKU.
//
// The supplier feed gives some products a thin or generic name/description
// (for example "Robot Vacuum Cleaner" or just the SKU). Entries here replace
// that text everywhere the product appears (storefront, product page, Google
// Shopping feed) and add a spec list, a "best for" line and a comparison group.
// The supplier sync never touches this file, so the content survives every sync.
//
// Specs come from the manufacturer's published spec sheets (linked in oemUrl).
// Descriptions are our own wording.

const TAPO_COMMON_VOICE = "Alexa and Google Home";

export const PRODUCT_CONTENT = {
  "TAPO-RV20": {
    name: "TP-Link Tapo RV20 LiDAR Robot Vacuum",
    brand: "TP-Link",
    group: "tapo-robot-vacuums",
    bestFor: "Vacuum-only cleaning, especially under very low beds and couches.",
    description:
      "The Tapo RV20 is the slimmest robot in the Tapo range at 7.8 cm, so it reaches under low beds and couches other robots can't. LiDAR maps your home so it cleans in neat rows instead of bumping around, and it has the largest dustbin in the range (800 ml). It vacuums only, with 2000 Pa suction that boosts automatically on carpet. Up to 3 hours per charge, then it returns to its base and carries on where it stopped.",
    specs: {
      suction: "2000 Pa",
      mopping: "No",
      navigation: "LiDAR",
      height: "7.8 cm",
      runtime: "Up to 180 min",
      dustbin: "800 ml",
      selfEmptying: "No",
      quiet: "51 dB",
      app: "Up to 4 floor maps, no-go zones, schedules",
      voice: TAPO_COMMON_VOICE,
    },
    oemUrl: "https://www.tapo.com/za/product/robot-vacuum/tapo-rv20/",
  },

  "Tapo-RV20-Max": {
    name: "TP-Link Tapo RV20 Max Robot Vacuum and Mop",
    brand: "TP-Link",
    group: "tapo-robot-vacuums",
    bestFor: "Most homes: strong suction and mopping at the lowest price of the mopping models.",
    description:
      "The Tapo RV20 Max vacuums and mops in one pass. 5300 Pa suction lifts fur, dust and crumbs and boosts automatically on carpet, while the 300 ml water tank with three flow levels mops hard floors and skips carpets. At 8.3 cm tall it fits under most sofas and beds, LiDAR maps up to 4 floors, and it runs for up to 3 hours before docking itself to recharge. Set rooms, schedules and no-go zones in the Tapo app.",
    specs: {
      suction: "5300 Pa",
      mopping: "Yes, 300 ml tank",
      navigation: "LiDAR",
      height: "8.3 cm",
      runtime: "Up to 180 min",
      dustbin: "300 ml",
      selfEmptying: "No",
      quiet: "52 dB",
      app: "Up to 4 floor maps, no-go zones, schedules",
      voice: TAPO_COMMON_VOICE,
    },
    oemUrl: "https://www.tapo.com/za/product/robot-vacuum/tapo-rv20-max/",
  },

  "Tapo-RV20-Max-Plus": {
    name: "TP-Link Tapo RV20 Max Plus Robot Vacuum and Mop with Auto-Empty Dock",
    brand: "TP-Link",
    group: "tapo-robot-vacuums",
    bestFor: "Pet owners and busy homes that don't want to empty a dustbin.",
    description:
      "The Tapo RV20 Max Plus is the RV20 Max robot (5300 Pa suction, mopping, LiDAR, 8.3 cm tall, up to 3 hours) with an auto-empty dock. After every clean the dock sucks the robot's dustbin empty into a sealed 3 L bag, which holds up to about two months of dust and pet hair. You change a bag every few weeks instead of emptying a bin after every run.",
    specs: {
      suction: "5300 Pa",
      mopping: "Yes, 300 ml tank",
      navigation: "LiDAR",
      height: "8.3 cm",
      runtime: "Up to 180 min",
      dustbin: "300 ml + 3 L dock bag",
      selfEmptying: "Yes, up to about 2 months per bag",
      quiet: "52 dB",
      app: "Up to 4 floor maps, no-go zones, schedules",
      voice: TAPO_COMMON_VOICE,
    },
    oemUrl: "https://www.tapo.com/za/product/robot-vacuum/tapo-rv20-max-plus/",
  },

  "TAPO-RV30-MAX-WHITE": {
    name: "TP-Link Tapo RV30 Max Robot Vacuum and Mop, White",
    brand: "TP-Link",
    group: "tapo-robot-vacuums",
    bestFor: "Open-plan homes and allergy-conscious households that want a white finish.",
    description:
      "The Tapo RV30 Max pairs 5300 Pa suction with an H11 HEPA filter that traps fine dust, and mops hard floors with a 300 ml water tank and three flow levels. LiDAR plus a motion sensor maps up to 4 floors, and you can lock the map so it stays accurate. It is 10 cm tall, so check the gap under your furniture: it needs about 10.2 cm to clean underneath. Up to 2.5 hours per charge, with automatic recharge and resume.",
    specs: {
      suction: "5300 Pa",
      mopping: "Yes, 300 ml tank",
      navigation: "LiDAR + motion sensor",
      height: "10 cm",
      runtime: "Up to 150 min",
      dustbin: "300 ml, H11 HEPA filter",
      selfEmptying: "No",
      quiet: "52 dB",
      app: "Up to 4 floor maps, no-go zones, map lock",
      voice: TAPO_COMMON_VOICE,
    },
    oemUrl: "https://www.tapo.com/za/product/robot-vacuum/tapo-rv30-max/",
  },
};

// Comparison groups: the order the products appear in, and the spec rows shown.
export const COMPARE_GROUPS = {
  "tapo-robot-vacuums": {
    title: "Compare Tapo robot vacuums",
    skus: ["TAPO-RV20", "Tapo-RV20-Max", "Tapo-RV20-Max-Plus", "TAPO-RV30-MAX-WHITE"],
    rows: [
      ["suction", "Suction"],
      ["mopping", "Mopping"],
      ["height", "Height"],
      ["runtime", "Runtime"],
      ["dustbin", "Dustbin"],
      ["selfEmptying", "Empties itself"],
      ["navigation", "Navigation"],
      ["quiet", "Quiet mode"],
    ],
  },
};

export const SPEC_LABELS = {
  suction: "Suction",
  mopping: "Mopping",
  navigation: "Navigation",
  height: "Height",
  runtime: "Runtime",
  dustbin: "Dustbin",
  selfEmptying: "Empties itself",
  quiet: "Quiet mode",
  app: "Tapo app",
  voice: "Voice control",
};

export function contentFor(sku) {
  return PRODUCT_CONTENT[sku] || null;
}

// Applied to every public product: replaces thin supplier text, adds specs.
export function withContent(product) {
  const c = contentFor(product.sku);
  if (!c) return product;
  return {
    ...product,
    name: c.name || product.name,
    brand: c.brand || product.brand,
    description: c.description || product.description,
    best_for: c.bestFor || null,
    specs: c.specs ? Object.entries(c.specs).map(([key, value]) => [SPEC_LABELS[key] || key, value]) : null,
    oem_url: c.oemUrl || null,
    compare_group: c.group || null,
  };
}
