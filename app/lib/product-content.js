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
    // Hidden: SMD's cost for this older vacuum-only model is higher than the
    // better RV20 Max (R2 781.91 vs R2 340.91 ex VAT, Oct 2026), so it would
    // always sell for more than a model that beats it on every spec.
    hidden: true,
    hiddenReason: "Replaced by the Tapo RV20 Max, which has stronger suction, mopping and a lower price.",
    replacement: "Tapo-RV20-Max",
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

  "ENDER-3V3-PLUS": {
    name: "Creality Ender-3 V3 Plus CoreXZ 3D Printer (300 x 300 x 330 mm)",
    brand: "Creality",
    bestFor: "Makers, small businesses and schools that want big prints, fast, without fiddly setup.",
    description:
      "The Ender-3 V3 Plus is the big-bed version of Creality's CoreXZ Ender-3 V3, with a 300 x 300 x 330 mm build volume, 58% more than the standard V3, so helmets, storage boxes and multi-part batches print in one go. The X and Z axes are belt-driven together by two motors, and two Y-axis motors with diagonal support rods keep the large bed steady, reaching up to 600 mm/s (300 mm/s typical) at 20 000 mm/s² acceleration. A direct-drive extruder with a spring-loaded grip feeds a 60 W, 300 °C hotend, and the tri-metal 'Unicorn' nozzle with a hardened steel tip swaps out one-handed. Two part-cooling fans keep overhangs crisp. Setup is hands-off: one tap runs auto bed levelling, Z-offset and input shaping, so there is no paper test. The frame is die-cast aluminium, it runs Klipper-based Creality OS, and you print over Wi-Fi or USB from Creality Print. It handles PLA, PETG, ABS, flexible TPU and carbon-fibre blends, and a filament run-out sensor and power-loss recovery protect long prints.",
    specs: {
      buildVolume: "300 x 300 x 330 mm",
      speed: "Up to 600 mm/s (300 mm/s typical)",
      acceleration: "Up to 20 000 mm/s²",
      motion: "CoreXZ, dual Y-axis motors",
      extruder: "Direct drive, 60 W hotend, up to 300 °C",
      nozzle: "0.4 mm quick-swap tri-metal, hardened steel tip",
      bed: "Flexible textured PEI, up to 100 °C",
      calibration: "Auto levelling, Z-offset and input shaping",
      filaments: "PLA, PETG, ABS, TPU 95A, PLA-CF, PETG-CF",
      screen: "4.3 inch colour touchscreen",
      connectivity: "Wi-Fi, USB drive, Creality Cloud",
      sensors: "Filament run-out, power-loss recovery",
      accuracy: "±0.2 mm, 0.1 to 0.35 mm layers",
      size: "410 x 445 x 577 mm, about 11.5 kg",
    },
    oemUrl: "https://www.creality.com/support/creality-ender-3-v3-plus",
  },
};

// Comparison groups: the order the products appear in, and the spec rows shown.
export const COMPARE_GROUPS = {
  "tapo-robot-vacuums": {
    title: "Compare Tapo robot vacuums",
    skus: ["Tapo-RV20-Max", "Tapo-RV20-Max-Plus", "TAPO-RV30-MAX-WHITE"],
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
  buildVolume: "Build volume",
  speed: "Print speed",
  acceleration: "Acceleration",
  motion: "Motion system",
  extruder: "Extruder",
  nozzle: "Nozzle",
  bed: "Build plate",
  calibration: "Calibration",
  filaments: "Filaments",
  screen: "Screen",
  connectivity: "Connectivity",
  sensors: "Sensors",
  accuracy: "Accuracy",
  size: "Size and weight",
};

// Products we never sell, whatever the supplier feed says (stock, price, active).
export function isHidden(sku) {
  return Boolean(PRODUCT_CONTENT[sku]?.hidden);
}

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
    compare_group: c.hidden ? null : c.group || null,
    hidden_reason: c.hidden ? c.hiddenReason || null : null,
    replacement_sku: c.hidden ? c.replacement || null : null,
  };
}
