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
    // Official Creality product images (store.creality.com), served resized from their CDN.
    images: [
      "Ender-3_V3_plus.png?v=1745998642&width=1000",
      "Ender-3_V3_plus_a09947c4-5d51-4b2a-be6e-2df7e1872bbc.png?v=1745998642&width=1000",
      "Ender-3_V3_plus_2.png?v=1745998642&width=1000",
      "Ender-3_V3_plus_3.png?v=1742443505&width=1000",
      "d891d8d64ffc76d48876850f095347f5_4a6fee6b-fb65-4979-b0c6-13fe9459fdc1.webp?v=1742443503",
      "075d925343cb84fcefc78469a968ae31_0d99e430-5b3d-4d8b-aac7-2f6167e707ba.webp?v=1742443504",
      "91d763900f30f9fbca7160324fc97ec2_31a234d6-30b6-4bff-9c28-12308adfc899.webp?v=1742443504",
      "8ea5e4079ff2f0dccf810baa2c02c915_22eb6a20-a8dd-47ff-9130-83ed7d404c2d.webp?v=1742443504",
      "2f74a353f1c1e740638c5055b862c2f6_a3b4ec87-2a53-4452-8396-47b9cfed2be7.webp?v=1742443504",
      "b866233db01f1b91de955006b2a509cd_95c8ab02-c6d8-4dd1-a0c0-b8cf352d84e8.webp?v=1742443504",
      "f5d65339c23abb09509ed730aacd191f_6d6fe9bb-ff9c-4db9-8a0b-c23c27c28040.webp?v=1742443504",
      "af2189ca8257d107896e18f9c13544bf_6adc56a1-95de-4871-8bf0-7582632607f5.webp?v=1742443503",
      "b4f510426c7bab5e71e29249777420ee_468a6a03-ea4b-4c6f-a61a-c1349f753d83.webp?v=1742443504",
      "99497dfd55d5301cbf2a7472f35284da_ec968ac5-df8d-4fb8-b0ec-f57ffa2d3f96.webp?v=1742443504",
      "523f0efa6388db8f02fa4e3a049cb0c2_9da46e2f-fe52-4d04-8218-df77c02399c3.webp?v=1742443504",
    ].map((f) => `https://cdn.shopify.com/s/files/1/0911/3233/0284/files/${f}`),
    oemUrl: "https://www.creality.com/support/creality-ender-3-v3-plus",
  },
  "CREALITY-K1MAX2025": {
    name: "Creality K1 Max 2025 AI 3D Printer, CFS Ready (300 x 300 x 300 mm)",
    brand: "Creality",
    bestFor: "Small businesses, print farms and serious makers who want big, fast, enclosed printing that watches itself.",
    description:
      "The K1 Max is Creality's large-format enclosed CoreXY printer, now in its 2025 version and ready for Creality's CFS multicolour system. The 300 x 300 x 300 mm chamber takes full-size helmets, prototypes and batches of parts, and it prints at up to 600 mm/s (300 mm/s typical) with 20 000 mm/s² acceleration and up to 32 mm³/s flow. A ceramic-heated hotend reaches 200 °C in about 40 seconds and runs to 300 °C, with a hardened steel nozzle, titanium heatbreak and dual-gear direct extruder. Two smart features save failed prints: AI LiDAR scans the first layer at 1 micron resolution and pauses if something is wrong, and the built-in AI camera spots spaghetti, debris and foreign objects while letting you watch and record time-lapses from your phone. Levelling is hands-free, input shaping cuts ringing, and a large part-cooling fan plus an 18 W chamber fan keep overhangs crisp. The die-cast aluminium frame is fully enclosed with an air filter, and you send jobs over Wi-Fi or Ethernet from Creality Print, Cura or Simplify3D. Add Creality's CFS-C (sold separately) for multicolour printing with RFID filament recognition and automatic spool switching.",
    specs: {
      buildVolume: "300 x 300 x 300 mm, fully enclosed",
      speed: "Up to 600 mm/s (300 mm/s typical)",
      acceleration: "Up to 20 000 mm/s²",
      flow: "Up to 32 mm³/s",
      motion: "CoreXY, die-cast aluminium frame",
      extruder: "Dual-gear direct drive",
      nozzle: "Hardened steel, up to 300 °C, titanium heatbreak",
      ai: "AI LiDAR first-layer check, AI camera failure detection",
      calibration: "Hands-free auto levelling, input shaping",
      cooling: "Part-cooling fan plus 18 W chamber fan, air filter",
      multicolour: "CFS ready, add Creality CFS-C (sold separately)",
      connectivity: "Wi-Fi, Ethernet, USB, Creality Cloud",
      storage: "8 GB, dual-core 1.2 GHz",
    },
    // Official Creality product images (store.creality.com), served resized from their CDN.
    images: [
      "k1MAX-01-01.png?v=1773728799&width=1000",
      "f59638aabe522d268b780a97719c82a7_9e61b96d-3050-476c-801b-30d2d5ed8908.jpg?v=1773728497&width=1000",
      "93b473f116fe245222432ebe0bb7dea4_f5bd4b93-8b6d-441f-a624-7646cf5b2827.jpg?v=1773728497&width=1000",
      "de0e6a0935fb357d467a74984575c654_9fb5f931-c060-42aa-9b9a-9213e3f6fdbd.jpg?v=1773728497&width=1000",
      "f419be457ff710cc4db7a4b8bb6c2c9e_20ce9d8d-d055-4fc0-b625-9a55047fdc67.jpg?v=1773728497&width=1000",
      "4216e575a04fafaf4b9424eb1f4e8ea6_fc4c3bb8-5782-4495-8b69-f70761a486dd.jpg?v=1773728497&width=1000",
      "3d4f684231978adf9fa4272ddf0a23ef_4d063f0d-c00e-437c-a2c1-dfea7a26995e.jpg?v=1773728497&width=1000",
      "e92e29089c59465f9e116078bd8f80ae_8e299677-ea9a-4826-9de3-bb57b9eae221.jpg?v=1773728497&width=1000",
      "57a901f6d40d2e50180b182313f39bb3_7e37a75e-64cd-4692-a019-8bbdaea62555.jpg?v=1773728497&width=1000",
      "2aa29af8cc53d87d9e86cd8ac1ce2447_771ff66b-4cae-43f0-9724-8a62aa33c5c1.jpg?v=1773728497&width=1000",
    ].map((f) => `https://cdn.shopify.com/s/files/1/0893/0603/8637/files/${f}`),
    oemUrl: "https://www.creality.com/products/creality-k1-max-3d-printer",
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
  flow: "Max flow",
  ai: "AI features",
  cooling: "Cooling",
  multicolour: "Multicolour",
  storage: "Storage and CPU",
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
    image_urls: c.images?.length ? c.images : product.image_urls,
    best_for: c.bestFor || null,
    specs: c.specs ? Object.entries(c.specs).map(([key, value]) => [SPEC_LABELS[key] || key, value]) : null,
    oem_url: c.oemUrl || null,
    compare_group: c.hidden ? null : c.group || null,
    hidden_reason: c.hidden ? c.hiddenReason || null : null,
    replacement_sku: c.hidden ? c.replacement || null : null,
  };
}
