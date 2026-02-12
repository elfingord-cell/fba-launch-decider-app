const STORAGE_KEY_PRODUCTS = "fba-margin-calculator.8020.v3.products";
const STORAGE_KEY_SETTINGS = "fba-margin-calculator.8020.v3.settings";
const LEGACY_STORAGE_KEY = "fba-margin-calculator.8020.v2";
const APP_PAGE = document.body?.dataset?.page === "settings" ? "settings" : "product";

const MIN_REFERRAL_FEE = 0.3;
const DEFAULT_USD_TO_EUR = 0.92;
const FX_ENDPOINT = "https://api.frankfurter.app/latest?from=USD&to=EUR";
const SUPABASE_CONFIG_ENDPOINT = "/api/config";
const LOCAL_SUPABASE_CONFIG_KEY = "fba-margin-calculator.supabase-config";
const REMOTE_SAVE_DEBOUNCE_MS = 350;
const SUPABASE_CLIENT_TIMEOUT_MS = 12000;
const REALTIME_PULL_DEBOUNCE_MS = 200;
const REALTIME_FALLBACK_PULL_MS = 15000;
const REALTIME_EDIT_GRACE_MS = 1200;
const REALTIME_PRESENCE_HEARTBEAT_MS = 20000;

const MARKETPLACE_VAT = {
  DE: 19,
  FR: 20,
  IT: 22,
  ES: 21,
};

const WORKFLOW_STAGES = ["quick", "validation", "deep_dive"];
const WORKFLOW_VISIBLE_STAGES = ["quick", "validation"];
const STAGE_LABELS = {
  quick: "QuickCheck",
  validation: "Validation",
  deep_dive: "Deep-Dive",
};
const STAGE_NEXT_STEP_TEXT = {
  quick: "Nächster Schritt: 5 Kostenblöcke prüfen, dann Validation aktivieren.",
  validation: "Nächster Schritt: Offene Restkosten schließen, bis die Zielabdeckung erreicht ist.",
  deep_dive: "Nächster Schritt: Kritische Treiber im Detail absichern.",
};
const STAGE_VISIBILITY = {
  quick: { topN: 10 },
  validation: { topN: 20 },
  deep_dive: { topN: Number.POSITIVE_INFINITY },
};
const VALIDATION_COVERAGE_TARGET_DEFAULT = 95;
const VALIDATION_PLAYGROUND_PATHS = [
  "basic.netWeightG",
  "basic.packLengthCm",
  "basic.packWidthCm",
  "basic.packHeightCm",
  "assumptions.ads.tacosRate",
  "assumptions.returns.returnRate",
  "basic.horizonMonths",
  "basic.listingPackage",
];

const CHAIN_STAGE_ORDER = [
  "supplier",
  "shipping_to_3pl",
  "threepl",
  "amazon_inbound",
  "amazon",
  "launch",
];

const CHAIN_STAGE_META = {
  supplier: {
    label: "Lieferant",
    explain: "Kosten am Ursprung/Lieferanten.",
    formula: "Summe aller Lieferanten-Kostenzeilen.",
    source: "Produktinput + Defaults/Overrides.",
    robustness: "Mittel",
  },
  shipping_to_3pl: {
    label: "Shipping zu 3PL",
    explain: "Door-to-door Import bis 3PL inkl. Vorlauf/Hauptlauf/Nachlauf/Zoll/Versicherung.",
    formula: "Summe aller Shipping-&-Import-Zeilen.",
    source: "Shipping 12M + Produktinput.",
    robustness: "Mittel",
  },
  threepl: {
    label: "3PL",
    explain: "Wareneingang und Lagerung im 3PL.",
    formula: "Summe der 3PL Receiving- und Lagerzeilen.",
    source: "3PL-Settings + Produktinput.",
    robustness: "Mittel",
  },
  amazon_inbound: {
    label: "Amazon Inbound",
    explain: "Outbound aus 3PL und Versand ins Amazon-Lager.",
    formula: "Summe der 3PL->Amazon Service- und Carrier-Zeilen.",
    source: "3PL-Settings + Kartonisierung.",
    robustness: "Mittel",
  },
  amazon: {
    label: "Amazon",
    explain: "Amazon-Verkaufs-, PPC- und laufende Marktplatzkosten.",
    formula: "Summe der Amazon- und Werbung/Retouren-Zeilen (inkl. PPC/TACoS).",
    source: "Kategorie-Defaults + Produktinput + Overrides.",
    robustness: "Mittel",
  },
  launch: {
    label: "Sonstiges & Lifecycle",
    explain: "Einmalige Setup-, Lifecycle- und sonstige indirekte Kostenblöcke.",
    formula: "Summe der Launch-/Lifecycle-Zeilen plus Overhead/Leakage.",
    source: "Launch/Listing-Settings + Overhead-Defaults + Produktinput.",
    robustness: "Mittel bis hoch",
  },
};

const CARTON_PRESETS = {
  legacy: {
    label: "Standard (63,5cm / 23kg)",
    maxLengthCm: 63.5,
    maxWidthCm: 63.5,
    maxHeightCm: 63.5,
    maxWeightKg: 23,
  },
  update_2025: {
    label: "Update 20.06.2025 (91,4/63,5/63,5 / 22,7kg)",
    maxLengthCm: 91.4,
    maxWidthCm: 63.5,
    maxHeightCm: 63.5,
    maxWeightKg: 22.7,
  },
};

const BASE_CATEGORY_DEFAULTS = {
  home: {
    label: "Home & Küche",
    referralRate: 15,
    tacosRate: 12,
    returnRate: 5,
    sellableShare: 45,
    // Legacy-Felder bleiben lesbar.
    resaleRate: 45,
    unsellableShare: 55,
    targetMarginPct: 15,
  },
  beauty: {
    label: "Beauty",
    referralRate: 15,
    tacosRate: 14,
    returnRate: 4,
    sellableShare: 52,
    // Legacy-Felder bleiben lesbar.
    resaleRate: 52,
    unsellableShare: 48,
    targetMarginPct: 16,
  },
  electronics: {
    label: "Elektronik",
    referralRate: 8,
    tacosRate: 10,
    returnRate: 8,
    sellableShare: 40,
    // Legacy-Felder bleiben lesbar.
    resaleRate: 40,
    unsellableShare: 60,
    targetMarginPct: 14,
  },
  apparel: {
    label: "Bekleidung",
    referralRate: 15,
    tacosRate: 16,
    returnRate: 12,
    sellableShare: 36,
    // Legacy-Felder bleiben lesbar.
    resaleRate: 36,
    unsellableShare: 64,
    targetMarginPct: 18,
  },
  pet: {
    label: "Haustier",
    referralRate: 15,
    tacosRate: 11,
    returnRate: 6,
    sellableShare: 46,
    // Legacy-Felder bleiben lesbar.
    resaleRate: 46,
    unsellableShare: 54,
    targetMarginPct: 15,
  },
  generic: {
    label: "Sonstiges",
    referralRate: 15,
    tacosRate: 12,
    returnRate: 7,
    sellableShare: 42,
    // Legacy-Felder bleiben lesbar.
    resaleRate: 42,
    unsellableShare: 58,
    targetMarginPct: 15,
  },
};

const GLOBAL_DEFAULTS = {
  launchAdsMultiplier: 1.5,
  launchBoostMonths: 3,
  leakageRatePct: 3,
  returnHandlingCost: 1.1,
  importCustomsDutyRate: 6.5,
  importVatRate: 19,
};

function deriveSellableSharePct(rawSellableShare, rawUnsellableShare, rawResaleRate, fallbackPct = 42) {
  if (Number.isFinite(num(rawSellableShare, NaN))) {
    return clamp(num(rawSellableShare, fallbackPct), 0, 100);
  }
  if (Number.isFinite(num(rawUnsellableShare, NaN))) {
    return clamp(100 - num(rawUnsellableShare, 100 - fallbackPct), 0, 100);
  }
  if (Number.isFinite(num(rawResaleRate, NaN))) {
    return clamp(num(rawResaleRate, fallbackPct), 0, 100);
  }
  return clamp(num(fallbackPct, 42), 0, 100);
}

const RAIL_BALANCED_V1_DEFAULTS = {
  rateEurPerCbm: 185,
  originFixedEurPerShipment: 150,
  destinationFixedEurPerShipment: 210,
  deOncarriageFixedEurPerShipment: 145,
  customsBrokerFixedEurPerShipment: 95,
};

const RAIL_FORTO_V2_DEFAULTS = {
  rateEurPerCbm: 162.071849,
  originFixedEurPerShipment: 108.01,
  mainRunFixedEurPerShipment: 180.01,
  deOncarriageFixedEurPerShipment: 400,
  customsBrokerFixedEurPerShipment: 52.5,
  insuranceRatePct: 0.624,
};

const LEGACY_RAIL_CARTON_EQUIVALENT_CBM = 0.05;
const AMAZON_FBA_DE_RATECARD_VERSION = "2026-02";
const AMAZON_FBA_DE_RATECARD_DEFAULT_URL = "https://m.media-amazon.com/images/G/02/sell/images/260114-FBA-Rate-Card-DE.pdf";
const AMAZON_FBA_DE_DEFAULT_VOLUMETRIC_DIVISOR = 5000;

const RAIL_SHIPPING_V3_DEFAULTS = {
  rateEurPerCbm: 164.7,
  originBaseEurPerShipment: 36.69,
  originPerCbmEur: 0.285 / LEGACY_RAIL_CARTON_EQUIVALENT_CBM,
  originPerCartonEur: 0.285,
  mainRunFixedEurPerShipment: 185,
  deOncarriageBaseEurPerShipment: 300,
  deOncarriagePerCbmEur: 0.4 / LEGACY_RAIL_CARTON_EQUIVALENT_CBM,
  deOncarriagePerCartonEur: 0.4,
  customsBrokerFixedEurPerShipment: 50,
  insuranceRatePct: 0.624,
  manualSurchargeEnabled: false,
  manualSurchargeEurPerShipment: 0,
};

const DEFAULT_SETTINGS = {
  tax: {
    fallbackUsdToEur: DEFAULT_USD_TO_EUR,
    customsDutyRatePct: GLOBAL_DEFAULTS.importCustomsDutyRate,
    vatRates: {
      DE: MARKETPLACE_VAT.DE,
      FR: MARKETPLACE_VAT.FR,
      IT: MARKETPLACE_VAT.IT,
      ES: MARKETPLACE_VAT.ES,
    },
  },
  shipping12m: {
    modes: {
      sea_lcl: {
        rateEurPerCbm: 128,
        originFixedEurPerShipment: 180,
        destinationFixedEurPerShipment: 260,
        deOncarriageFixedEurPerShipment: 165,
      },
      rail: {
        rateEurPerCbm: RAIL_SHIPPING_V3_DEFAULTS.rateEurPerCbm,
        originBaseEurPerShipment: RAIL_SHIPPING_V3_DEFAULTS.originBaseEurPerShipment,
        originPerCbmEur: RAIL_SHIPPING_V3_DEFAULTS.originPerCbmEur,
        originPerCartonEur: RAIL_SHIPPING_V3_DEFAULTS.originPerCartonEur,
        mainRunFixedEurPerShipment: RAIL_SHIPPING_V3_DEFAULTS.mainRunFixedEurPerShipment,
        deOncarriageBaseEurPerShipment: RAIL_SHIPPING_V3_DEFAULTS.deOncarriageBaseEurPerShipment,
        deOncarriagePerCbmEur: RAIL_SHIPPING_V3_DEFAULTS.deOncarriagePerCbmEur,
        deOncarriagePerCartonEur: RAIL_SHIPPING_V3_DEFAULTS.deOncarriagePerCartonEur,
        // Legacy-Felder bleiben lesbar.
        originFixedEurPerShipment: RAIL_SHIPPING_V3_DEFAULTS.originBaseEurPerShipment,
        destinationFixedEurPerShipment: RAIL_SHIPPING_V3_DEFAULTS.mainRunFixedEurPerShipment,
        deOncarriageFixedEurPerShipment: RAIL_SHIPPING_V3_DEFAULTS.deOncarriageBaseEurPerShipment,
      },
    },
    customsBrokerEnabled: true,
    customsBrokerFixedEurPerShipment: RAIL_SHIPPING_V3_DEFAULTS.customsBrokerFixedEurPerShipment,
    insurance: {
      enabled: true,
      basis: "goods_value_eur",
      ratePct: RAIL_SHIPPING_V3_DEFAULTS.insuranceRatePct,
    },
    manualSurchargeEnabled: RAIL_SHIPPING_V3_DEFAULTS.manualSurchargeEnabled,
    manualSurchargeEurPerShipment: RAIL_SHIPPING_V3_DEFAULTS.manualSurchargeEurPerShipment,
  },
  amazonFba: {
    de: {
      rateCardVersion: AMAZON_FBA_DE_RATECARD_VERSION,
      sourceUrl: AMAZON_FBA_DE_RATECARD_DEFAULT_URL,
      volumetricDivisor: AMAZON_FBA_DE_DEFAULT_VOLUMETRIC_DIVISOR,
    },
  },
  cartonRules: {
    preset: "legacy",
    maxLengthCm: CARTON_PRESETS.legacy.maxLengthCm,
    maxWidthCm: CARTON_PRESETS.legacy.maxWidthCm,
    maxHeightCm: CARTON_PRESETS.legacy.maxHeightCm,
    maxWeightKg: CARTON_PRESETS.legacy.maxWeightKg,
    packFactor: 0.85,
    estimationMode: "conservative",
    supplierSoftMaxLengthCm: 40,
    supplierSoftMaxWidthCm: 40,
    supplierSoftMaxHeightCm: 35,
    supplierSoftMaxGrossWeightKg: 18,
    outerBufferCm: 1.5,
    grossWeightUpliftPct: 5,
    equivalentCartonFillPct: 90,
  },
  categoryDefaults: JSON.parse(JSON.stringify(BASE_CATEGORY_DEFAULTS)),
  lifecycle: {
    defaultMonths: 36,
    listingPackages: {
      ai: {
        listingCreationEur: 120,
        imagesInfographicsEur: 180,
        aPlusContentEur: 140,
      },
      photographer: {
        listingCreationEur: 340,
        imagesInfographicsEur: 690,
        aPlusContentEur: 420,
      },
      visual_advantage: {
        listingCreationEur: 560,
        imagesInfographicsEur: 1250,
        aPlusContentEur: 780,
      },
    },
    launchProfiles: {
      low: {
        weeks: 6,
        startTacosBoostPct: 20,
        endTacosBoostPct: 4,
        startPriceDiscountPct: 8,
      },
      medium: {
        weeks: 6,
        startTacosBoostPct: 40,
        endTacosBoostPct: 8,
        startPriceDiscountPct: 12,
      },
      high: {
        weeks: 6,
        startTacosBoostPct: 70,
        endTacosBoostPct: 12,
        startPriceDiscountPct: 18,
      },
    },
  },
  threePl: {
    receivingPerCartonSortedEur: 3.5,
    receivingPerCartonMixedEur: 8.99,
    storagePerPalletPerMonthEur: 10.9,
    unitsPerPallet: 240,
    avgStorageMonths: 1.2,
    outboundBasePerCartonEur: 2.35,
    pickPackPerCartonEur: 0.3,
    fbaProcessingPerCartonEur: 1.9,
    insertPerInsertEur: 0.1,
    thirdCountryLabelPerLabelEur: 0.27,
    insertsPerCartonDefault: 1,
    labelsPerCartonDefault: 0,
    carrierCostPerCartonEur: 3.2,
    shelfMPerMonthEur: 2.49,
    shelfLPerMonthEur: 5.49,
  },
  costDefaults: {
    packagingPerUnitEur: 0.32,
    otherUnitCostEur: 0.18,
    docsPerOrderEur: 45,
    freightPapersPerOrderEur: 28,
    amazonStoragePerCbmMonthEur: 28,
    avgAmazonStorageMonths: 1.5,
    leakageRatePct: 3,
    greetingCardPerLaunchUnitEur: 0.22,
    samplesPerProductEur: 120,
    toolingPerProductEur: 220,
    certificatesPerProductEur: 180,
    inspectionPerProductEur: 260,
  },
  meta: {
    railDefaultsVersion: 2,
    railShippingModelVersion: 3,
  },
};
const FBA_RATECARD_DE_2026 = {
  standard: [
    {
      key: "light_envelope",
      label: "Leichter Umschlag",
      maxDimsCm: [33, 23, 2.5],
      pricing: {
        type: "bands",
        bands: [
          { maxWeightG: 20, feeEur: 2.33 },
          { maxWeightG: 40, feeEur: 2.37 },
          { maxWeightG: 60, feeEur: 2.39 },
          { maxWeightG: 80, feeEur: 2.52 },
          { maxWeightG: 100, feeEur: 2.54 },
        ],
      },
    },
    {
      key: "standard_envelope",
      label: "Standardumschlag",
      maxDimsCm: [33, 23, 2.5],
      pricing: {
        type: "bands",
        bands: [
          { maxWeightG: 210, feeEur: 2.57 },
          { maxWeightG: 460, feeEur: 2.68 },
        ],
      },
    },
    {
      key: "large_envelope",
      label: "Großer Umschlag",
      maxDimsCm: [33, 23, 4],
      pricing: {
        type: "bands",
        bands: [{ maxWeightG: 960, feeEur: 3.04 }],
      },
    },
    {
      key: "xlarge_envelope",
      label: "Extra großer Umschlag",
      maxDimsCm: [33, 23, 6],
      pricing: {
        type: "bands",
        bands: [{ maxWeightG: 960, feeEur: 3.42 }],
      },
    },
    {
      key: "small_parcel",
      label: "Kleines Paket",
      maxDimsCm: [35, 25, 12],
      pricing: {
        type: "bands",
        bands: [
          { maxWeightG: 150, feeEur: 3.38 },
          { maxWeightG: 400, feeEur: 3.39 },
          { maxWeightG: 900, feeEur: 3.4 },
          { maxWeightG: 1400, feeEur: 3.41 },
          { maxWeightG: 1900, feeEur: 3.43 },
          { maxWeightG: 3900, feeEur: 4.54 },
        ],
      },
    },
    {
      key: "standard_parcel",
      label: "Standardpaket",
      maxDimsCm: [45, 34, 26],
      pricing: {
        type: "bands",
        bands: [
          { maxWeightG: 150, feeEur: 3.39 },
          { maxWeightG: 400, feeEur: 3.42 },
          { maxWeightG: 900, feeEur: 3.44 },
          { maxWeightG: 1400, feeEur: 3.93 },
          { maxWeightG: 1900, feeEur: 3.95 },
          { maxWeightG: 2900, feeEur: 4.55 },
          { maxWeightG: 3900, feeEur: 5.09 },
          { maxWeightG: 5900, feeEur: 5.22 },
          { maxWeightG: 8900, feeEur: 6.03 },
          { maxWeightG: 11900, feeEur: 6.65 },
        ],
      },
    },
  ],
  apparel: [
    {
      key: "small_1",
      label: "Kleines Paket 1",
      maxDimsCm: [35, 25, 7],
      maxShippingWeightG: 3900,
      pricing: {
        type: "base_plus_step",
        baseWeightG: 100,
        baseFeeEur: 3.3,
        stepWeightG: 100,
        stepFeeEur: 0.05,
      },
    },
    {
      key: "small_2",
      label: "Kleines Paket 2",
      maxDimsCm: [35, 25, 9],
      maxShippingWeightG: 3900,
      pricing: {
        type: "base_plus_step",
        baseWeightG: 100,
        baseFeeEur: 3.34,
        stepWeightG: 100,
        stepFeeEur: 0.06,
      },
    },
    {
      key: "small_3",
      label: "Kleines Paket 3",
      maxDimsCm: [35, 25, 12],
      maxShippingWeightG: 3900,
      pricing: {
        type: "base_plus_step",
        baseWeightG: 100,
        baseFeeEur: 3.38,
        stepWeightG: 100,
        stepFeeEur: 0.07,
      },
    },
    {
      key: "medium_1",
      label: "Mittelgroßes Paket 1",
      maxDimsCm: [40, 30, 6],
      maxShippingWeightG: 11900,
      pricing: {
        type: "base_plus_step",
        baseWeightG: 100,
        baseFeeEur: 3.5,
        stepWeightG: 100,
        stepFeeEur: 0.07,
      },
    },
    {
      key: "medium_2",
      label: "Mittelgroßes Paket 2",
      maxDimsCm: [40, 30, 20],
      maxShippingWeightG: 11900,
      pricing: {
        type: "base_plus_step",
        baseWeightG: 100,
        baseFeeEur: 3.73,
        stepWeightG: 100,
        stepFeeEur: 0.07,
      },
    },
    {
      key: "large_1",
      label: "Großes Paket 1",
      maxDimsCm: [45, 34, 10],
      maxShippingWeightG: 11900,
      pricing: {
        type: "base_plus_step",
        baseWeightG: 100,
        baseFeeEur: 3.97,
        stepWeightG: 100,
        stepFeeEur: 0.07,
      },
    },
    {
      key: "large_2",
      label: "Großes Paket 2",
      maxDimsCm: [45, 34, 26],
      maxShippingWeightG: 11900,
      pricing: {
        type: "base_plus_step",
        baseWeightG: 100,
        baseFeeEur: 4.38,
        stepWeightG: 100,
        stepFeeEur: 0.08,
      },
    },
  ],
};

const FBA_OPTIMIZATION_LIMITS = {
  maxWeightReductionPct: 8,
  maxWeightReductionGCap: 250,
  maxDimReductionPctPerSide: 8,
  maxDimReductionPctTotal: 12,
  maxDimReductionCmPerSideCap: 2,
  maxDimReductionCmTotalCap: 4,
};

const SHIPPING_3D_MAX_RENDER_UNITS = 250;
const SHIPPING_3D_THREE_LOCAL = "vendor/three/three.min.js";
const SHIPPING_3D_ORBIT_LOCAL = "vendor/three/OrbitControls.js";

const FIELD_HELP = {
  name: "Interner Produktname zur Vergleichbarkeit in der Multi-Produkt-Ansicht.",
  "basic.priceGross": "Brutto-Verkaufspreis in EUR (inkl. USt.). Netto = Brutto / (1 + USt).",
  "basic.category": "Kategorie steuert Defaults wie TACoS, Retouren, Referral Fee und Zielmarge.",
  "basic.demandValue": "Absatzannahme je Tag oder Monat. Daraus werden Monats- und Zeitraum-Units berechnet.",
  "basic.demandBasis": "Wähle, ob die Absatzannahme pro Tag oder pro Monat gilt.",
  "basic.horizonMonths": "Betrachtungszeitraum in Monaten; verteilt Launch-Kosten und bestimmt ROI/Payback.",
  "basic.netWeightG": "Produktgewicht netto in Gramm; relevant für Kartonisierung, FBA-Tier und Shipping.",
  "basic.packLengthCm": "Produktverpackung Länge in cm je Einheit (nicht Umkarton).",
  "basic.packWidthCm": "Produktverpackung Breite in cm je Einheit (nicht Umkarton).",
  "basic.packHeightCm": "Produktverpackung Höhe in cm je Einheit (nicht Umkarton).",
  "basic.unitsPerOrder": "Typische PO-Menge in Einheiten pro Import-Order. Basis für Door-to-Door Shipping/Unit.",
  "basic.transportMode": "Transportmodus China -> DE für Door-to-Door Shipping (v1: Rail und Sea LCL).",
  "basic.exwUnit": "Einkaufspreis EXW in USD. Wird mit aktuellem USD→EUR Kurs umgerechnet.",
  "basic.marketplace": "Marktplatz setzt die lokale USt für Brutto→Netto Berechnung.",
  "basic.fulfillmentModel": "Fulfillment-Flag. v1 rechnet FBA.",
  "basic.launchBudgetTotal": "Einmaliges Launch-Budget in EUR; wird auf Zeitraum amortisiert.",
  "basic.listingPackage": "Auswahl der Listing-Serviceklasse. Preise kommen aus globalen Settings.",
  "basic.launchCompetition": "Wettbewerbsniveau der Nische. Steuert Launch-Boost auf TACoS und Einführungspreis.",

  "assumptions.ads.tacosRate": "TACoS in % vom Brutto-Umsatz. Ads-Kosten je Stück = Brutto-Preis × TACoS.",
  "assumptions.ads.launchMultiplier": "Multiplikator für TACoS in den ersten Launch-Monaten.",
  "assumptions.ads.launchMonths": "Anzahl Monate mit erhöhtem TACoS durch Launch-Multiplier.",

  "assumptions.returns.returnRate": "Retourenquote in % der Verkäufe.",
  "assumptions.returns.sellableShare": "Davon verkaufbar in % der Retouren. Unsellable wird abgeleitet als 100 - verkaufbar.",
  "assumptions.returns.resaleRate": "Legacy-Feld (fachlich inaktiv).",
  "assumptions.returns.unsellableShare": "Legacy-Feld (fachlich inaktiv, wird aus verkaufbar% abgeleitet).",
  "assumptions.returns.handlingCost": "Interne Bearbeitungskosten je Retoure in EUR.",

  "assumptions.leakage.ratePct": "Pauschale vergessene Kosten als % vom Netto-Umsatz (Leakage-Block).",

  "assumptions.import.customsDutyRate": "Zollsatz in % auf Warenwert + Shipping bis Import.",
  "assumptions.import.importVatRate": "Legacy-Feld (EUSt wird im Modell nicht als Kosten oder Cash-ROI-Faktor verwendet).",
  "assumptions.import.includeImportVatAsCost": "Legacy-Feld ohne Wirkung im aktuellen Modell.",
  "assumptions.import.includeImportVatInCashRoi": "Legacy-Feld ohne Wirkung im aktuellen Modell.",

  "assumptions.amazon.referralRate": "Amazon Empfehlungsgebühr in % vom Brutto-Verkaufspreis.",
  "assumptions.amazon.useManualFbaFee": "Aktiviert eine manuelle FBA-Gebühr statt Auto-Tier-Erkennung.",
  "assumptions.amazon.manualFbaFee": "Manuell gesetzte FBA Fee in EUR je Einheit.",

  "assumptions.lifecycle.targetMarginPct": "Ziel-Nettomarge in %, für die Max-TACoS berechnet wird.",
  "assumptions.lifecycle.otherMonthlyCost": "Weitere monatliche Lifecycle-Kosten in EUR.",
  "assumptions.launchSplit.enabled": "Aktiviert die Aufteilung des Launch-Budgets nach Kostenarten.",
  "assumptions.launchSplit.listing": "Kosten für Listing/Fotos/A+ in EUR.",
  "assumptions.launchSplit.vine": "Kosten für Amazon Vine in EUR.",
  "assumptions.launchSplit.coupons": "Launch-Kosten für Coupons/Discounts in EUR.",
  "assumptions.launchSplit.other": "Sonstige Launch-Kosten in EUR.",
  "assumptions.cartonization.manualEnabled": "Aktiviert eine manuelle Umkartonisierung (Packing-List Override).",
  "assumptions.cartonization.unitsPerCarton": "Manuelle Stück je Umkarton aus realer Packing List.",
  "assumptions.cartonization.cartonLengthCm": "Manuelle Umkarton-Länge in cm (optional).",
  "assumptions.cartonization.cartonWidthCm": "Manuelle Umkarton-Breite in cm (optional).",
  "assumptions.cartonization.cartonHeightCm": "Manuelle Umkarton-Höhe in cm (optional).",
  "assumptions.cartonization.cartonGrossWeightKg": "Manuelles Umkarton-Bruttogewicht in kg (optional).",

  "assumptions.extraCosts.overridePackagingGroup": "Wenn aktiv, nutzt das Produkt eigene Verpackungs-/Stückkosten statt globaler Settings.",
  "assumptions.extraCosts.packagingPerUnitEur": "Zusätzliche Verpackungskosten pro Stück (EUR).",
  "assumptions.extraCosts.otherUnitCostEur": "Weitere variable Zusatzkosten pro Stück (EUR).",
  "assumptions.extraCosts.overrideLogisticsGroup": "Wenn aktiv, nutzt das Produkt eigene 3PL-/Lager-/Orderlogistik-Kosten statt globaler Settings.",
  "assumptions.extraCosts.docsPerOrderEur": "Fixkosten je Order für Dokumentation (EUR).",
  "assumptions.extraCosts.freightPapersPerOrderEur": "Fixkosten je Order für Frachtpapiere (EUR).",
  "assumptions.extraCosts.receivingMode": "3PL Receiving-Modus: sorted (Standard) oder mixed.",
  "assumptions.extraCosts.receivingPerCartonSortedEur": "3PL Wareneingang sorted je Karton (EUR).",
  "assumptions.extraCosts.receivingPerCartonMixedEur": "3PL Wareneingang mixed je Karton (EUR).",
  "assumptions.extraCosts.storagePerPalletPerMonthEur": "3PL Lagerkosten je Palette und Monat (EUR).",
  "assumptions.extraCosts.unitsPerPallet": "Annahme, wie viele Units auf einer Palette liegen (für 3PL Storage-Rechnung).",
  "assumptions.extraCosts.avg3PlStorageMonths": "Durchschnittliche Lagerdauer im 3PL in Monaten.",
  "assumptions.extraCosts.outboundBasePerCartonEur": "3PL Warenausgang Basis je Karton (EUR).",
  "assumptions.extraCosts.pickPackPerCartonEur": "3PL Pick & Pack je Karton (EUR).",
  "assumptions.extraCosts.fbaProcessingPerCartonEur": "3PL FBA-Processing je Karton (EUR).",
  "assumptions.extraCosts.insertsPerCarton": "Anzahl Beilagen je Karton für Outbound.",
  "assumptions.extraCosts.insertPerInsertEur": "Kosten je Beilage (Insert) in EUR.",
  "assumptions.extraCosts.labelsPerCarton": "Anzahl Drittland-Labels je Karton.",
  "assumptions.extraCosts.thirdCountryLabelPerLabelEur": "Kosten je Drittland-Label in EUR.",
  "assumptions.extraCosts.carrierCostPerCartonEur": "Carrier-Kosten 3PL -> Amazon je Karton (EUR).",
  "assumptions.extraCosts.amazonStoragePerCbmMonthEur": "Amazon-Lagerkosten je CBM und Monat (EUR).",
  "assumptions.extraCosts.avgAmazonStorageMonths": "Durchschnittliche Lagerdauer bei Amazon in Monaten.",
  "assumptions.extraCosts.overrideLaunchOpsGroup": "Wenn aktiv, nutzt das Produkt eigene Launch-Operationskosten statt globaler Settings.",
  "assumptions.extraCosts.greetingCardPerLaunchUnitEur": "Handgeschriebene Grußkarte pro Launch-Unit (EUR).",
  "assumptions.extraCosts.samplesPerProductEur": "Samples (einmalig) je Produkt (EUR).",
  "assumptions.extraCosts.toolingPerProductEur": "Tooling-Kosten (einmalig) je Produkt (EUR).",
  "assumptions.extraCosts.certificatesPerProductEur": "Zertifikate (einmalig) je Produkt (EUR).",
  "assumptions.extraCosts.inspectionPerProductEur": "Quality Inspection in China (einmalig) je Produkt (EUR).",

  "workflow.deepDive.supplierValidated": "Supplier-Angebot, MOQ und Produktionsfähigkeit wurden verifiziert.",
  "workflow.deepDive.complianceChecked": "Regulatorische und produktrechtliche Anforderungen wurden geprüft.",
  "workflow.deepDive.sampleDecisionReady": "Alle relevanten Punkte sind für die finale Sample-Entscheidung vorbereitet.",
};

const SETTINGS_HELP = {
  "tax.fallbackUsdToEur": "Fallback-Umrechnungskurs USD->EUR, falls kein Livekurs verfügbar ist.",
  "tax.customsDutyRatePct": "Globaler Standard-Zollsatz in %, angewendet auf Warenwert (EUR) + Shipping D2D (EUR).",
  "tax.vatRates.DE": "MwSt-Satz für Marketplace DE in Prozent.",
  "tax.vatRates.FR": "MwSt-Satz für Marketplace FR in Prozent.",
  "tax.vatRates.IT": "MwSt-Satz für Marketplace IT in Prozent.",
  "tax.vatRates.ES": "MwSt-Satz für Marketplace ES in Prozent.",
  "shipping12m.modes.sea_lcl.rateEurPerCbm": "12-Monats-Durchschnitt: Sea LCL variabler Tarif in EUR pro CBM (W/M).",
  "shipping12m.modes.sea_lcl.originFixedEurPerShipment": "12-Monats-Durchschnitt: Sea LCL Vorlauf-Fixkosten je Shipment in EUR.",
  "shipping12m.modes.sea_lcl.destinationFixedEurPerShipment": "12-Monats-Durchschnitt: Sea LCL Hauptlauf-Fixkosten je Shipment in EUR.",
  "shipping12m.modes.sea_lcl.deOncarriageFixedEurPerShipment": "12-Monats-Durchschnitt: Sea LCL Nachlauf-Fixkosten je Shipment in EUR.",
  "shipping12m.modes.rail.rateEurPerCbm": "12-Monats-Durchschnitt: Rail variabler Tarif in EUR pro CBM (W/M).",
  "shipping12m.modes.rail.originBaseEurPerShipment": "Rail Vorlauf-Fixanteil je Shipment in EUR.",
  "shipping12m.modes.rail.originPerCbmEur": "Rail Vorlauf variabel je CBM in EUR.",
  "shipping12m.modes.rail.originPerCartonEur": "Legacy-Feld für Rail Vorlauf variabel je Karton in EUR.",
  "shipping12m.modes.rail.originFixedEurPerShipment": "Legacy-Feld für Rail Vorlauf-Fixkosten (wird auf Vorlauf-Basis gemappt).",
  "shipping12m.modes.rail.mainRunFixedEurPerShipment": "12-Monats-Durchschnitt: Rail Hauptlauf-Fixkosten je Shipment in EUR (z. B. THC/Handling).",
  "shipping12m.modes.rail.destinationFixedEurPerShipment": "Legacy-Feld für Rail Hauptlauf-Fixkosten (wird für neue Rail-Logik nicht mehr primär genutzt).",
  "shipping12m.modes.rail.deOncarriageBaseEurPerShipment": "Rail Nachlauf-Fixanteil je Shipment in EUR.",
  "shipping12m.modes.rail.deOncarriagePerCbmEur": "Rail Nachlauf variabel je CBM in EUR.",
  "shipping12m.modes.rail.deOncarriagePerCartonEur": "Legacy-Feld für Rail Nachlauf variabel je Karton in EUR.",
  "shipping12m.modes.rail.deOncarriageFixedEurPerShipment": "Legacy-Feld für Rail Nachlauf-Fixkosten (wird auf Nachlauf-Basis gemappt).",
  "shipping12m.customsBrokerEnabled": "Aktiviert optionalen Fixkostenblock für Zollabfertigung.",
  "shipping12m.customsBrokerFixedEurPerShipment": "12-Monats-Durchschnitt: fixer Betrag für Zollabfertigung je Shipment in EUR.",
  "shipping12m.insurance.enabled": "Aktiviert die Versicherungsberechnung im Shipping-Block.",
  "shipping12m.insurance.basis": "Basis der Versicherung (v1: nur Warenwert in EUR).",
  "shipping12m.insurance.ratePct": "Versicherungssatz in % auf die gewählte Versicherungsbasis.",
  "shipping12m.manualSurchargeEnabled": "Aktiviert optionale manuelle Nachbelastung je Shipment (z. B. Advance Commission).",
  "shipping12m.manualSurchargeEurPerShipment": "Manuelle Nachbelastung je Shipment in EUR (nur wenn aktiv).",
  "amazonFba.de.rateCardVersion": "Version der hinterlegten DE-FBA-Ratecard. Verhalten ist auf 2026-02 fixiert.",
  "amazonFba.de.sourceUrl": "Pflegbarer Link zur offiziellen DE-FBA-Ratecard (für Transparenz und Double-Check).",
  "amazonFba.de.volumetricDivisor": "Divisor für dimensionsabhängiges Versandgewicht: (L×B×H / Divisor) × 1000g.",
  "cartonRules.maxLengthCm": "Maximale Karton-Länge in cm für Auto-Kartonisierung.",
  "cartonRules.maxWidthCm": "Maximale Karton-Breite in cm für Auto-Kartonisierung.",
  "cartonRules.maxHeightCm": "Maximale Karton-Höhe in cm für Auto-Kartonisierung.",
  "cartonRules.maxWeightKg": "Maximales Karton-Gewicht in kg für Auto-Kartonisierung.",
  "cartonRules.packFactor": "Legacy-Parameter aus früherer Volumenlogik (nur Kompatibilität, aktuell inaktiv).",
  "cartonRules.estimationMode": "Legacy-Parameter (konservativ/balanced/maximal), wird in der aktiven Kartonisierung nicht mehr verwendet.",
  "cartonRules.supplierSoftMaxLengthCm": "Legacy-Parameter für Supplier-Soft-Caps (aktuell inaktiv).",
  "cartonRules.supplierSoftMaxWidthCm": "Legacy-Parameter für Supplier-Soft-Caps (aktuell inaktiv).",
  "cartonRules.supplierSoftMaxHeightCm": "Legacy-Parameter für Supplier-Soft-Caps (aktuell inaktiv).",
  "cartonRules.supplierSoftMaxGrossWeightKg": "Legacy-Parameter für Supplier-Soft-Caps (aktuell inaktiv).",
  "cartonRules.outerBufferCm": "Zusätzlicher Umkarton-Puffer je Achse in cm (Polster/Luft).",
  "cartonRules.grossWeightUpliftPct": "Aufschlag von Netto- auf Bruttogewicht je Unit in %.",
  "cartonRules.equivalentCartonFillPct": "Auslastung der Äquivalenz-Referenz in %. Referenz = maximal zulässiger Karton × Auslastung.",
  "lifecycle.defaultMonths": "Lifecycle-Horizont für die Amortisation von Listing-Kosten (Monate).",
  "lifecycle.listingPackages.ai.listingCreationEur": "Kosten für Listing-Erstellung im Paket KI (EUR).",
  "lifecycle.listingPackages.ai.imagesInfographicsEur": "Kosten für Bilder/Infografiken im Paket KI (EUR).",
  "lifecycle.listingPackages.ai.aPlusContentEur": "Kosten für A+ Content im Paket KI (EUR).",
  "lifecycle.listingPackages.photographer.listingCreationEur": "Kosten für Listing-Erstellung im Paket Fotograf (EUR).",
  "lifecycle.listingPackages.photographer.imagesInfographicsEur": "Kosten für Bilder/Infografiken im Paket Fotograf (EUR).",
  "lifecycle.listingPackages.photographer.aPlusContentEur": "Kosten für A+ Content im Paket Fotograf (EUR).",
  "lifecycle.listingPackages.visual_advantage.listingCreationEur": "Kosten für Listing-Erstellung im Paket Visual Advantage (EUR).",
  "lifecycle.listingPackages.visual_advantage.imagesInfographicsEur": "Kosten für Bilder/Infografiken im Paket Visual Advantage (EUR).",
  "lifecycle.listingPackages.visual_advantage.aPlusContentEur": "Kosten für A+ Content im Paket Visual Advantage (EUR).",
  "lifecycle.launchProfiles.low.weeks": "Launch-Dauer in Wochen für Low-Competition Profil.",
  "lifecycle.launchProfiles.low.startTacosBoostPct": "Start-Boost auf TACoS in % für Low-Competition.",
  "lifecycle.launchProfiles.low.endTacosBoostPct": "End-Boost auf TACoS in % für Low-Competition.",
  "lifecycle.launchProfiles.low.startPriceDiscountPct": "Start-Rabatt auf Zielpreis in % für Low-Competition.",
  "lifecycle.launchProfiles.medium.weeks": "Launch-Dauer in Wochen für Medium-Competition Profil.",
  "lifecycle.launchProfiles.medium.startTacosBoostPct": "Start-Boost auf TACoS in % für Medium-Competition.",
  "lifecycle.launchProfiles.medium.endTacosBoostPct": "End-Boost auf TACoS in % für Medium-Competition.",
  "lifecycle.launchProfiles.medium.startPriceDiscountPct": "Start-Rabatt auf Zielpreis in % für Medium-Competition.",
  "lifecycle.launchProfiles.high.weeks": "Launch-Dauer in Wochen für High-Competition Profil.",
  "lifecycle.launchProfiles.high.startTacosBoostPct": "Start-Boost auf TACoS in % für High-Competition.",
  "lifecycle.launchProfiles.high.endTacosBoostPct": "End-Boost auf TACoS in % für High-Competition.",
  "lifecycle.launchProfiles.high.startPriceDiscountPct": "Start-Rabatt auf Zielpreis in % für High-Competition.",
  "costDefaults.packagingPerUnitEur": "Globaler Default für zusätzliche Verpackungskosten pro Stück (EUR).",
  "costDefaults.otherUnitCostEur": "Globaler Default für weitere variable Zusatzkosten pro Stück (EUR).",
  "costDefaults.docsPerOrderEur": "Globaler Default für Dokumentation je Order (EUR).",
  "costDefaults.freightPapersPerOrderEur": "Globaler Default für Frachtpapiere je Order (EUR).",
  "costDefaults.amazonStoragePerCbmMonthEur": "Globaler Default für Amazon-Lagerkosten je CBM/Monat (EUR).",
  "costDefaults.avgAmazonStorageMonths": "Globaler Default für durchschnittliche Amazon-Lagerdauer in Monaten.",
  "costDefaults.leakageRatePct": "Globaler Default für Leakage/Overhead in % vom Netto-Umsatz.",
  "costDefaults.greetingCardPerLaunchUnitEur": "Globaler Default für handgeschriebene Grußkarte pro Launch-Unit (EUR).",
  "costDefaults.samplesPerProductEur": "Globaler Default für Samples je Produkt (einmalig, EUR).",
  "costDefaults.toolingPerProductEur": "Globaler Default für Tooling je Produkt (einmalig, EUR).",
  "costDefaults.certificatesPerProductEur": "Globaler Default für Zertifikate je Produkt (einmalig, EUR).",
  "costDefaults.inspectionPerProductEur": "Globaler Default für Quality Inspection in China je Produkt (einmalig, EUR).",
  "threePl.receivingPerCartonSortedEur": "3PL Receiving (sorted) je Karton in EUR.",
  "threePl.receivingPerCartonMixedEur": "3PL Receiving (mixed) je Karton in EUR.",
  "threePl.storagePerPalletPerMonthEur": "3PL Lagerung je Palette und Monat in EUR.",
  "threePl.unitsPerPallet": "Annahme für Units pro Palette zur Storage-Umrechnung.",
  "threePl.avgStorageMonths": "Durchschnittliche Lagerdauer im 3PL in Monaten.",
  "threePl.outboundBasePerCartonEur": "3PL Outbound Basis je Karton in EUR.",
  "threePl.pickPackPerCartonEur": "3PL Pick&Pack je Karton in EUR.",
  "threePl.fbaProcessingPerCartonEur": "3PL FBA-Processing je Karton in EUR.",
  "threePl.insertPerInsertEur": "Kosten je Insert (Beilage) in EUR.",
  "threePl.thirdCountryLabelPerLabelEur": "Kosten je Drittland-Label in EUR.",
  "threePl.insertsPerCartonDefault": "Default-Anzahl Inserts pro Karton.",
  "threePl.labelsPerCartonDefault": "Default-Anzahl Drittland-Labels pro Karton.",
  "threePl.carrierCostPerCartonEur": "Carrier-Kosten von 3PL zu Amazon je Karton in EUR (Richtwert).",
  "threePl.shelfMPerMonthEur": "Infowert: Regalplatz M je Monat in EUR.",
  "threePl.shelfLPerMonthEur": "Infowert: Regalplatz L je Monat in EUR.",
  "categoryDefaults.home.tacosRate": "Default TACoS % für Kategorie Home.",
  "categoryDefaults.home.returnRate": "Default Retourenquote % für Kategorie Home.",
  "categoryDefaults.home.sellableShare": "Default davon verkaufbar % für Kategorie Home.",
  "categoryDefaults.home.resaleRate": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.home.unsellableShare": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.home.referralRate": "Default Referral Fee % für Kategorie Home.",
  "categoryDefaults.home.targetMarginPct": "Default Zielmarge % für Kategorie Home.",
  "categoryDefaults.beauty.tacosRate": "Default TACoS % für Kategorie Beauty.",
  "categoryDefaults.beauty.returnRate": "Default Retourenquote % für Kategorie Beauty.",
  "categoryDefaults.beauty.sellableShare": "Default davon verkaufbar % für Kategorie Beauty.",
  "categoryDefaults.beauty.resaleRate": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.beauty.unsellableShare": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.beauty.referralRate": "Default Referral Fee % für Kategorie Beauty.",
  "categoryDefaults.beauty.targetMarginPct": "Default Zielmarge % für Kategorie Beauty.",
  "categoryDefaults.electronics.tacosRate": "Default TACoS % für Kategorie Elektronik.",
  "categoryDefaults.electronics.returnRate": "Default Retourenquote % für Kategorie Elektronik.",
  "categoryDefaults.electronics.sellableShare": "Default davon verkaufbar % für Kategorie Elektronik.",
  "categoryDefaults.electronics.resaleRate": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.electronics.unsellableShare": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.electronics.referralRate": "Default Referral Fee % für Kategorie Elektronik.",
  "categoryDefaults.electronics.targetMarginPct": "Default Zielmarge % für Kategorie Elektronik.",
  "categoryDefaults.apparel.tacosRate": "Default TACoS % für Kategorie Bekleidung.",
  "categoryDefaults.apparel.returnRate": "Default Retourenquote % für Kategorie Bekleidung.",
  "categoryDefaults.apparel.sellableShare": "Default davon verkaufbar % für Kategorie Bekleidung.",
  "categoryDefaults.apparel.resaleRate": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.apparel.unsellableShare": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.apparel.referralRate": "Default Referral Fee % für Kategorie Bekleidung.",
  "categoryDefaults.apparel.targetMarginPct": "Default Zielmarge % für Kategorie Bekleidung.",
  "categoryDefaults.pet.tacosRate": "Default TACoS % für Kategorie Haustier.",
  "categoryDefaults.pet.returnRate": "Default Retourenquote % für Kategorie Haustier.",
  "categoryDefaults.pet.sellableShare": "Default davon verkaufbar % für Kategorie Haustier.",
  "categoryDefaults.pet.resaleRate": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.pet.unsellableShare": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.pet.referralRate": "Default Referral Fee % für Kategorie Haustier.",
  "categoryDefaults.pet.targetMarginPct": "Default Zielmarge % für Kategorie Haustier.",
  "categoryDefaults.generic.tacosRate": "Default TACoS % für Kategorie Sonstiges.",
  "categoryDefaults.generic.returnRate": "Default Retourenquote % für Kategorie Sonstiges.",
  "categoryDefaults.generic.sellableShare": "Default davon verkaufbar % für Kategorie Sonstiges.",
  "categoryDefaults.generic.resaleRate": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.generic.unsellableShare": "Legacy-Feld (fachlich inaktiv).",
  "categoryDefaults.generic.referralRate": "Default Referral Fee % für Kategorie Sonstiges.",
  "categoryDefaults.generic.targetMarginPct": "Default Zielmarge % für Kategorie Sonstiges.",
};

const PATH_LABEL_OVERRIDES = {
  "settings.tax.fallbackUsdToEur": "Fallback USD -> EUR",
  "settings.tax.customsDutyRatePct": "Standard Zollsatz (%)",
  "settings.shipping12m.modes.sea_lcl.rateEurPerCbm": "Sea LCL Rate (EUR/CBM, 12M-Ø)",
  "settings.shipping12m.modes.sea_lcl.originFixedEurPerShipment": "Sea LCL Vorlauf fix (EUR/Shipment)",
  "settings.shipping12m.modes.sea_lcl.destinationFixedEurPerShipment": "Sea LCL Hauptlauf fix (EUR/Shipment)",
  "settings.shipping12m.modes.sea_lcl.deOncarriageFixedEurPerShipment": "Sea LCL Nachlauf fix (EUR/Shipment)",
  "settings.shipping12m.modes.rail.rateEurPerCbm": "Rail Rate (EUR/CBM, 12M-Ø)",
  "settings.shipping12m.modes.rail.originBaseEurPerShipment": "Rail Vorlauf Basis (EUR/Shipment)",
  "settings.shipping12m.modes.rail.originPerCbmEur": "Rail Vorlauf variabel (EUR/CBM)",
  "settings.shipping12m.modes.rail.originPerCartonEur": "Rail Vorlauf variabel (legacy, EUR/Karton)",
  "settings.shipping12m.modes.rail.originFixedEurPerShipment": "Rail Vorlauf fix (legacy, EUR/Shipment)",
  "settings.shipping12m.modes.rail.mainRunFixedEurPerShipment": "Rail Hauptlauf fix (EUR/Shipment)",
  "settings.shipping12m.modes.rail.destinationFixedEurPerShipment": "Rail Hauptlauf fix (legacy, EUR/Shipment)",
  "settings.shipping12m.modes.rail.deOncarriageBaseEurPerShipment": "Rail Nachlauf Basis (EUR/Shipment)",
  "settings.shipping12m.modes.rail.deOncarriagePerCbmEur": "Rail Nachlauf variabel (EUR/CBM)",
  "settings.shipping12m.modes.rail.deOncarriagePerCartonEur": "Rail Nachlauf variabel (legacy, EUR/Karton)",
  "settings.shipping12m.modes.rail.deOncarriageFixedEurPerShipment": "Rail Nachlauf fix (legacy, EUR/Shipment)",
  "settings.shipping12m.customsBrokerEnabled": "Zollabfertigung aktiv",
  "settings.shipping12m.customsBrokerFixedEurPerShipment": "Zollabfertigung fix (EUR/Shipment)",
  "settings.shipping12m.insurance.enabled": "Versicherung aktiv",
  "settings.shipping12m.insurance.basis": "Versicherungsbasis",
  "settings.shipping12m.insurance.ratePct": "Versicherungssatz (%)",
  "settings.shipping12m.manualSurchargeEnabled": "Nachbelastung aktiv",
  "settings.shipping12m.manualSurchargeEurPerShipment": "Nachbelastung (EUR/Shipment)",
  "settings.amazonFba.de.rateCardVersion": "FBA-Ratecard Version (DE)",
  "settings.amazonFba.de.sourceUrl": "FBA-Ratecard Quellenlink (DE)",
  "settings.amazonFba.de.volumetricDivisor": "FBA Volumetric Divisor",
  "settings.cartonRules.maxLengthCm": "Karton max Länge (cm)",
  "settings.cartonRules.maxWidthCm": "Karton max Breite (cm)",
  "settings.cartonRules.maxHeightCm": "Karton max Höhe (cm)",
  "settings.cartonRules.maxWeightKg": "Karton max Gewicht (kg)",
  "settings.cartonRules.packFactor": "Packfaktor (Legacy)",
  "settings.cartonRules.estimationMode": "Schätzmodus (Legacy, inaktiv)",
  "settings.cartonRules.supplierSoftMaxLengthCm": "Supplier Soft-Cap Länge (Legacy)",
  "settings.cartonRules.supplierSoftMaxWidthCm": "Supplier Soft-Cap Breite (Legacy)",
  "settings.cartonRules.supplierSoftMaxHeightCm": "Supplier Soft-Cap Höhe (Legacy)",
  "settings.cartonRules.supplierSoftMaxGrossWeightKg": "Supplier Soft-Cap Bruttogewicht (Legacy)",
  "settings.cartonRules.outerBufferCm": "Outer Buffer je Achse (cm)",
  "settings.cartonRules.grossWeightUpliftPct": "Gewichtsaufschlag netto->brutto (%)",
  "settings.cartonRules.equivalentCartonFillPct": "Äquivalenz-Referenz Auslastung (%)",
  "settings.threePl.receivingPerCartonSortedEur": "3PL Receiving sortenrein (EUR/Karton)",
  "settings.threePl.receivingPerCartonMixedEur": "3PL Receiving gemischt (EUR/Karton)",
  "settings.threePl.storagePerPalletPerMonthEur": "3PL Lagerung (EUR/Palette/Monat)",
  "settings.threePl.unitsPerPallet": "Units je Palette",
  "settings.threePl.avgStorageMonths": "Ø 3PL Lagerdauer (Monate)",
  "settings.threePl.outboundBasePerCartonEur": "3PL Outbound base (EUR/Karton)",
  "settings.threePl.pickPackPerCartonEur": "3PL Pick & Pack (EUR/Karton)",
  "settings.threePl.fbaProcessingPerCartonEur": "3PL FBA Abwicklung (EUR/Karton)",
  "settings.threePl.insertPerInsertEur": "Beilage je Stück (EUR)",
  "settings.threePl.thirdCountryLabelPerLabelEur": "Drittland-Label je Stück (EUR)",
  "settings.threePl.insertsPerCartonDefault": "Beilagen je Karton (Default)",
  "settings.threePl.labelsPerCartonDefault": "Labels je Karton (Default)",
  "settings.threePl.carrierCostPerCartonEur": "Carrier 3PL -> Amazon (EUR/Karton)",
  "settings.costDefaults.packagingPerUnitEur": "Packaging pro Unit (EUR)",
  "settings.costDefaults.otherUnitCostEur": "Weitere Stückkosten pro Unit (EUR)",
  "settings.costDefaults.docsPerOrderEur": "Dokumentation pro Order (EUR)",
  "settings.costDefaults.freightPapersPerOrderEur": "Frachtpapiere pro Order (EUR)",
  "settings.costDefaults.amazonStoragePerCbmMonthEur": "Amazon Lager (EUR/CBM/Monat)",
  "settings.costDefaults.avgAmazonStorageMonths": "Ø Amazon Lagerdauer (Monate)",
  "settings.costDefaults.leakageRatePct": "Leakage/Overhead (% vom Netto-Umsatz)",
  "settings.costDefaults.greetingCardPerLaunchUnitEur": "Grußkarte pro Launch-Unit (EUR)",
  "settings.costDefaults.samplesPerProductEur": "Samples je Produkt (EUR)",
  "settings.costDefaults.toolingPerProductEur": "Tooling je Produkt (EUR)",
  "settings.costDefaults.certificatesPerProductEur": "Zertifikate je Produkt (EUR)",
  "settings.costDefaults.inspectionPerProductEur": "Inspection in China je Produkt (EUR)",
  "basic.packLengthCm": "Produktverpackung-Länge (cm)",
  "basic.packWidthCm": "Produktverpackung-Breite (cm)",
  "basic.packHeightCm": "Produktverpackung-Höhe (cm)",
  "assumptions.cartonization.manualEnabled": "Manuelle Umkartonisierung aktiv",
  "assumptions.cartonization.unitsPerCarton": "Stück je Umkarton",
  "assumptions.cartonization.cartonLengthCm": "Umkarton-Länge (cm)",
  "assumptions.cartonization.cartonWidthCm": "Umkarton-Breite (cm)",
  "assumptions.cartonization.cartonHeightCm": "Umkarton-Höhe (cm)",
  "assumptions.cartonization.cartonGrossWeightKg": "Umkarton-Bruttogewicht (kg)",
  "assumptions.returns.sellableShare": "Davon verkaufbar (%)",
  "derived.shipping.chargeableCbm": "Abrechnungsvolumen (W/M-CBM)",
  "derived.shipping.equivalentCartonsCount": "Abrechnungs-Kartons (Äquivalenz)",
  "derived.shipping.equivalentReferenceCbm": "Referenzvolumen je Äquivalenz-Karton",
  "derived.shipping.equivalentReferenceWeightKg": "Referenzgewicht je Äquivalenz-Karton",
  "derived.returns.returnLossPerReturnEur": "Verlust pro 1 Retoure (EUR)",
  "derived.returns.returnCostPerReturnEur": "Kosten pro 1 Retoure (EUR)",
  "derived.returns.sellableSharePct": "Davon verkaufbar (%)",
  "derived.returns.unsellableSharePctDerived": "Davon nicht verkaufbar (%)",
};

const KPI_HELP = {
  kpiRevenueGross: "Brutto-Umsatz/Monat = Verkaufspreis brutto × Monatsabsatz.",
  kpiRevenueNet: "Netto-Umsatz/Monat = Verkaufspreis netto × Monatsabsatz.",
  kpiSellerboardMargin:
    "Sellerboard-Marge % = (Gewinn vor Overhead / Brutto-Umsatz) × 100. Overhead = produktunabhängige Fixkosten.",
  kpiNetMargin: "Netto-Marge % = Gewinn netto / Netto-Umsatz × 100. Zielbereich: > 20%.",
  kpiShippingUnit: "Door-to-door Shipping je Unit als 12-Monats-Durchschnitt (ein Richtwert).",
  kpiLandedUnit: "Landed je Unit = EXW(EUR) + Shipping + Zoll.",
  kpiDb1Unit: "DB1/Stück = Nettoverkaufspreis - Unit Economics je Stück (Landed, Amazon, Ads, Retouren).",
  kpiDb1Margin: "DB1-Marge % = DB1/Stück / Nettoverkaufspreis × 100.",
  kpiNetMarginBeforePpc: "Nettomarge vor PPC % = (Gewinn netto/Monat + Ads/Monat) / Netto-Umsatz/Monat × 100.",
  kpiGrossProfitMonthly: "Gewinn brutto/Monat = DB1/Stück × Monatsabsatz (vor Block 2 und 3).",
  kpiProfitMonthly: "Gewinn netto/Monat = Gewinn brutto/Monat - Launch/Lifecycle - Leakage.",
  kpiTotalCostMonthly: "Gesamtkosten/Monat = Block 1 (Unit Economics) + Block 2 (Launch/Lifecycle) + Block 3 (Leakage).",
  kpiTotalCostPerUnit: "Gesamtkosten/Unit = Gesamtkosten/Monat / Monatsabsatz.",
  kpiBreakEvenPrice: "Break-even Preis brutto: Preis, bei dem Gewinn netto/Monat = 0.",
  kpiMaxTacos: "Max TACoS: höchste Ads-Quote, bei der die Ziel-Nettomarge gerade noch erreicht wird.",
  kpiProductRoi: "Produkt-ROI = Gewinn im Zeitraum / (Landed Kapital + Launch-Budget) × 100.",
  kpiCashRoi: "Cash-ROI = Gewinn im Zeitraum / (Produktkapital + Launch) × 100.",
  kpiPayback: "Payback (Monate) = initial gebundenes Kapital / Gewinn netto pro Monat.",
};

const TABLE_HEADER_HELP = [
  "Produktname für schnelle Auswahl im Editor.",
  "Kategorie für Default-Set (Ads, Retouren, Fees).",
  "Verkaufspreis brutto in EUR (inkl. USt).",
  "Verkaufspreis netto in EUR (ohne USt).",
  "Door-to-door Shipping je Unit (12-Monats-Ø).",
  "Landed Cost je Unit.",
  "DB1 je Stück in EUR auf Netto-Basis.",
  "DB1-Marge in % vom Nettoverkaufspreis.",
  "Gewinn netto pro Monat in EUR nach allen 3 Kostenblöcken.",
  "Produkt-ROI in % auf Waren- und Launch-Kapital.",
  "Cash-ROI in % auf gebundenes Produkt- und Launch-Kapital.",
  "Payback-Zeit bis Kapitalrückfluss in Monaten.",
  "Brutto-Preis, bei dem Gewinn netto = 0.",
  "Maximal mögliche TACoS-Quote für die Zielmarge.",
  "Sensitivitätsampel auf Basis Worst-Case.",
  "Worst/Best Gewinn netto pro Monat aus Sensitivität.",
];

const TERM_HELP_BY_TEXT = [
  {
    match: "Leakage / Overhead",
    text: "Leakage ist ein Sicherheitsaufschlag für häufig vergessene Kosten (z. B. kleine Tools, Gebührenreste, operative Streuverluste).",
  },
  {
    match: "Unit Economics",
    text: "Unit Economics sind alle variablen Kosten je verkauftem Stück (inkl. Landed, Amazon, Ads, Retouren).",
  },
  {
    match: "Launch & Lifecycle",
    text: "Kostenblock für einmalige oder temporäre Kosten, die auf Zeitraum/Units verteilt werden.",
  },
  {
    match: "Fixkosten / Leakage",
    text: "Pauschaler Kostenblock als % vom Netto-Umsatz, um nicht explizit modellierte Kosten abzudecken.",
  },
  {
    match: "DB1",
    text: "DB1 = Nettoverkaufspreis minus direkte variable Stückkosten (Block 1).",
  },
  {
    match: "Cash-ROI",
    text: "Cash-ROI setzt Gewinn ins Verhältnis zu gebundenem Produkt- und Launch-Kapital.",
  },
  {
    match: "Payback",
    text: "Payback zeigt, nach wie vielen Monaten das gebundene Kapital zurückverdient ist.",
  },
  {
    match: "Shipping door-to-door",
    text: "Ein Richtwert auf 12-Monats-Durchschnittsbasis. Kein Live-Spot-Tarif.",
  },
];

const COST_METRIC_TOOLTIPS = {
  "quick.exw": "EXW/Einkauf pro verkaufter Einheit in EUR (USD-EK × USD→EUR).",
  "quick.shipping_to_3pl": "Importblock pro Einheit bis 3PL: Door-to-door Shipping + Zoll + orderbezogene Fixkosten.",
  "quick.threepl": "3PL-Kosten pro Einheit: Receiving, Lagerung, Outbound-Service und Carrier.",
  "quick.amazon_core": "Amazon-Kernkosten pro Einheit: Referral + TACoS + FBA Fulfillment.",
  "quick.launch_core": "Launch-Kernkosten pro Einheit: Listing + Launch-Budget + Launch-Ops.",
  "quick.coverage_pct": "Anteil der fünf QuickCheck-Kernblöcke an den gesamten Kosten pro Einheit.",
  "quick.total_cost_per_unit": "Gesamte Stückkosten über alle modellierten Kostenblöcke.",
  "quick.covered_cost_per_unit": "Kosten pro Einheit, die bereits durch den QuickCheck-Workflow abgedeckt sind.",
  "quick.residual_cost_per_unit": "Restkosten pro Einheit außerhalb des QuickCheck-Workflows.",
  "validation.coverage_pct": "Anteil der validierten Blöcke an den gesamten Kosten pro Einheit.",
  "validation.target_pct": "Zielabdeckung für Validation (Standard 95%).",
  "validation.covered_cost_per_unit": "Validierte Kosten pro Einheit.",
  "validation.residual_cost_per_unit": "Noch offene, nicht validierte Restkosten pro Einheit.",
  "shipping.units_by_weight_cap":
    "Was bedeutet das? Maximal mögliche Stück je Umkarton unter der zulässigen Gewichtsgrenze.\nFormel: floor(Karton-Maximalgewicht / Stück-Bruttogewicht).\nWofür genutzt? Startwert für die automatische Kartonisierung.",
  "shipping.units_by_dimension_cap":
    "Was bedeutet das? Maximal mögliche Stück je Umkarton unter den zulässigen Maßgrenzen.\nFormel: Best-Fit über Orientierungen unter maximal erlaubten Kartonmaßen inkl. Buffer.\nWofür genutzt? Startwert für die automatische Kartonisierung.",
  "shipping.units_per_carton":
    "Was bedeutet das? Tatsächlich verwendete Stück je Umkarton (auto oder manuell).\nFormel: Auto startet mit min(Gewichtsgrenze, Maßgrenze) und reduziert ggf., bis eine exakte Anordnung im zulässigen Umkarton möglich ist.\nWofür genutzt? Physische Kartonanzahl, Sendungsvolumen und Teile der 3PL-Kosten.\nWas kann ich tun? Bei Downshift reale Umkartonmaße manuell setzen oder Stück je Umkarton reduzieren.",
  "shipping.physical_cartons":
    "Definition: Physisch benötigte Umkartons für die PO.\nFormel: ceil(PO Stück / Stück je Umkarton).\nWird genutzt für: Shipment-Bildung und kartonbasierte 3PL-/Carrier-Positionen.",
  "shipping.shipment_cbm":
    "Definition: Tatsächliches Sendungsvolumen der gesamten PO.\nFormel: physische Kartons × Umkarton-CBM.\nWird genutzt für: Rail Vorlauf/Nachlauf variabel (EUR/CBM).",
  "shipping.shipment_weight_kg":
    "Definition: Tatsächliches Sendungsgewicht der gesamten PO.\nFormel: PO Stück × Stück-Bruttogewicht (bei Manual ggf. aus Umkartongewicht abgeleitet).\nWird genutzt für: W/M-Abgleich und Transparenz.",
  "shipping.chargeable_cbm":
    "Definition: Abrechnungsvolumen nach W/M für den Hauptlauf.\nFormel: max(Sendungsvolumen-CBM, Sendungsgewicht-kg/1000).\nWird genutzt für: Hauptlauf variabel (EUR/CBM), nicht für Rail Vor-/Nachlauf.",
  "shipping.equivalent_cartons":
    "Definition: Referenz-Kartonzahl aus Volumen/Gewicht relativ zu einer Standardreferenz.\nFormel: ceil(max(Shipment-CBM/Referenz-CBM, Shipment-Gewicht/Referenzgewicht)).\nWird genutzt für: Transparenz/Benchmark; aktuell nicht als Rail Vor-/Nachlauf-Treiber.",
  "shipping.reference_cbm":
    "Definition: Referenzvolumen je Äquivalenz-Karton.\nFormel: Volumen eines maximal zulässigen Kartons × Auslastung (%).\nWird genutzt für: Berechnung der Abrechnungs-Kartons (Äquivalenz) als Info-Wert.",
  "shipping.reference_weight_kg":
    "Definition: Referenzgewicht je Äquivalenz-Karton.\nFormel: maximales Kartongewicht × Auslastung (%).\nWird genutzt für: Berechnung der Abrechnungs-Kartons (Äquivalenz) als Info-Wert.",
  "shipping.volume_fill_pct":
    "Was bedeutet das? Volumen-Packgrad des Umkartons in %.\nFormel: (Produktvolumen im Umkarton / Umkartonvolumen) × 100.\nWofür genutzt? Transparenz, wie effizient der Umkarton mit Ware statt Luft gefüllt ist.",
  "shipping.void_volume_liters":
    "Was bedeutet das? Freies Luftvolumen im Umkarton in Litern.\nFormel: max(0, Umkartonvolumen - Produktvolumen im Umkarton) × 1000.\nWofür genutzt? Transparenz für Verpackungsoptimierung.",
  "shipping.weight_fill_pct":
    "Was bedeutet das? Gewichtsauslastung je Umkarton gegenüber der maximal zulässigen Kartongrenze.\nFormel: (Umkarton-Bruttogewicht / maximales Kartongewicht) × 100.\nWofür genutzt? Frühwarnung, wenn Gewichtsgrenze knapp oder überschritten ist.",
  "shipping.manual_fit_status":
    "Was bedeutet das? Plausibilitätsstatus der manuellen Umkartonisierung (Maße/Gewicht).\nFormel: Prüft Stückzahl gegen physisch mögliche Belegung und Gewicht gegen maximal zulässiges Kartongewicht.\nWofür genutzt? Warnung mit konkretem Korrekturvorschlag.",
  "shipping.layout_preview":
    "Was bedeutet das? Drehbares 3D-Schema der Produktanordnung im Umkarton.\nFormel: Raster aus nx × ny × nz auf Basis der besten Orientierung.\nWofür genutzt? Visuelle Prüfung von Platzierung, Kantenmaßen und freiem Volumen.",
  "shipping.total_po": "Shipping D2D (ohne Zoll und Order-Fix) für die komplette PO/Sendung.",
  "shipping.per_unit": "Shipping D2D (ohne Zoll und Order-Fix) je verkaufter Einheit.",
  "amazon.referral_unit": "Referral Fee pro Einheit (prozentual auf Bruttoverkaufspreis, mind. Mindestgebühr).",
  "amazon.tacos_unit": "Ads/TACoS pro Einheit als Prozentsatz vom Bruttoverkaufspreis.",
  "amazon.fba_unit": "FBA Fulfillment Fee pro Einheit aus DE-Ratecard (oder manuellem Fallback).",
  "amazon.fba_profile": "Aktives FBA-Profil (Standard/Apparel) für die Tierzuordnung.",
  "amazon.fba_tier": "Gematchte FBA-Größen-/Gewichtsklasse aus der hinterlegten DE-Ratecard.",
  "amazon.fba_shipping_weight": "FBA-Versandgewicht = max(tatsächliches Gewicht, dimensionsabhängiges Gewicht).",
  "amazon.fba_source": "Quelle der FBA-Berechnung (auto/manuell/fallback) inklusive Ratecard-Version.",
  "returns.sellable_share": "Davon verkaufbar (%) der Retouren; nicht verkaufbar wird als 100 - verkaufbar berechnet.",
  "returns.unsellable_share_derived": "Nicht verkaufbarer Retourenanteil, automatisch aus 100 - verkaufbar berechnet.",
  "returns.return_loss_per_return": "Warenwertverlust pro Retoure auf Landed-Basis.",
  "returns.return_cost_per_return": "Gesamtkosten pro Retoure = Warenwertverlust pro Retoure + Handling je Retoure.",
};

const UI_HELP_TEXT = {
  "ui.settings_flow":
    "Globale Settings wirken auf alle Produkte. Empfohlene Reihenfolge: Shipping/3PL zuerst, danach Amazon/Kategorie, dann Launch/Overhead.",
  "ui.decision_bar":
    "Decision-Bar: Kompakter KPI-Block für die schnelle Go/Watch/No-Go Entscheidung. Details bleiben optional.",
  "ui.basic_flow":
    "Basic-Flow: QuickCheck für den Erstcheck, danach Validation für die strukturierte Restkostenprüfung.",
  "ui.quick_workflow":
    "QuickCheck fokussiert auf 5 Kernkostenblöcke. Ziel: schnell erkennen, ob die Idee grundsätzlich tragfähig ist.",
  "ui.validation_workflow":
    "Validation schließt die größten Restkostenblöcke bis zur Zielabdeckung (Standard 95%).",
  "ui.market_absatz":
    "Markt & Absatz legt den Nachfrage- und Preisrahmen fest und bestimmt direkt Umsatz, Marge und ROI.",
  "ui.product_shipping":
    "Produkt- und Versandparameter steuern Kartonisierung, Shipping und 3PL-Anteile je Unit.",
  "ui.purchase_launch":
    "Einkauf, Amazon und Launch definieren EXW, Gebühren sowie Budgeteffekte auf Gewinn und Payback.",
};

const QUICK_BLOCK_SUMMARY = {
  exw: "enthält: Einkauf + FX-Umrechnung.",
  shipping_to_3pl: "enthält: D2D-Shipping + Zoll + Orderfixkosten.",
  threepl: "enthält: Receiving, Lagerung, Outbound.",
  amazon_core: "enthält: Referral, TACoS, FBA Fee.",
  launch_core: "enthält: Listing, Launch-Budget, Ops.",
};

const DERIVED_DRIVER_MAP = {
  "derived.shipping.unitsPerOrder": {
    label: "PO-Menge (Stück pro Order)",
    help: "Stück pro Import-Order (PO), Basis für kartonbasierte Umrechnung.",
    format: "number",
    read: (metrics) => metrics.shipping.unitsPerOrder,
  },
  "derived.shipping.unitsPerCartonAuto": {
    label: "Stück je Umkarton (auto/manuell)",
    help: "Stück je Umkarton aus min(Gewichtsgrenze, Maßgrenze) unter maximal zulässigen Kartongrenzen oder manuellem Packing-List-Override.",
    format: "number",
    read: (metrics) => metrics.shipping.unitsPerCartonAuto,
  },
  "derived.shipping.unitsByWeightCap": {
    label: "Stück je Umkarton nach Gewichtsgrenze",
    help: "Maximal mögliche Stück je Umkarton unter Amazon-Gewichtsgrenze.",
    format: "number",
    read: (metrics) => metrics.shipping.unitsByWeightCap,
  },
  "derived.shipping.unitsByDimensionCap": {
    label: "Stück je Umkarton nach Maßgrenze",
    help: "Maximal mögliche Stück je Umkarton unter Amazon-Maßgrenzen (inkl. Outer-Buffer).",
    format: "number",
    read: (metrics) => metrics.shipping.unitsByDimensionCap,
  },
  "derived.shipping.unitsPerCartonCapCandidate": {
    label: "Kandidatenwert Stück je Umkarton (vor Downshift)",
    help: "Startkandidat der Auto-Kartonisierung = min(Stück nach Gewichtsgrenze, Stück nach Maßgrenze).",
    format: "number",
    read: (metrics) => metrics.shipping.unitsPerCartonCapCandidate,
  },
  "derived.shipping.unitsPerCartonDownshift": {
    label: "Auto-Downshift Stück je Umkarton",
    help: "Reduktion vom Kandidatenwert auf den finalen Auto-Wert, falls keine exakte Belegung unter zulässigen Kartongrenzen möglich ist.",
    format: "number",
    read: (metrics) => metrics.shipping.unitsPerCartonDownshift,
  },
  "derived.shipping.unitsPerCartonSelectionReason": {
    label: "Auswahlgrund Stück je Umkarton",
    help: "Grund der finalen Auswahl: auto_cap_feasible, auto_cap_downshift_exact_fit oder manual_override.",
    format: "string",
    read: (metrics) => cartonizationSelectionReasonLabel(metrics.shipping.unitsPerCartonSelectionReason),
  },
  "derived.shipping.cartonsCount": {
    label: "Anzahl Umkartons (physisch)",
    help: "Physische Kartonanzahl = ceil(PO Units / units_per_carton_auto).",
    format: "number",
    read: (metrics) => metrics.shipping.cartonsCount,
  },
  "derived.shipping.physicalCartonsCount": {
    label: "Anzahl Umkartons (physisch)",
    help: "Physische Kartonanzahl = ceil(PO Units / units_per_carton_auto).",
    format: "number",
    read: (metrics) => metrics.shipping.physicalCartonsCount,
  },
  "derived.shipping.equivalentCartonsCount": {
    label: "Abrechnungs-Kartons (Äquivalenz)",
    help: "Referenzwert aus Volumen/Gewicht: max(Shipment-CBM/Referenzvolumen, Shipment-Gewicht/Referenzgewicht). Aktuell Info-Wert.",
    format: "number",
    read: (metrics) => metrics.shipping.equivalentCartonsCount,
  },
  "derived.shipping.equivalentReferenceCbm": {
    label: "Referenzvolumen je Äquivalenz-Karton (CBM)",
    help: "Referenzvolumen je Äquivalenz-Karton = Maximalvolumen eines zulässigen Kartons × Auslastung.",
    format: "number",
    read: (metrics) => metrics.shipping.equivalentReferenceCbm,
  },
  "derived.shipping.equivalentReferenceWeightKg": {
    label: "Referenzgewicht je Äquivalenz-Karton (kg)",
    help: "Referenzgewicht je Äquivalenz-Karton = maximales Kartongewicht × Auslastung.",
    format: "number",
    read: (metrics) => metrics.shipping.equivalentReferenceWeightKg,
  },
  "derived.shipping.shipmentCbm": {
    label: "Sendungsvolumen (CBM)",
    help: "Volumen der gesamten Shipment in CBM.",
    format: "number",
    read: (metrics) => metrics.shipping.shipmentCbm,
  },
  "derived.shipping.shipmentWeightKg": {
    label: "Sendungsgewicht (kg)",
    help: "Gesamtgewicht der Shipment in kg.",
    format: "number",
    read: (metrics) => metrics.shipping.shipmentWeightKg,
  },
  "derived.shipping.chargeableCbm": {
    label: "Abrechnungsvolumen (W/M-CBM)",
    help: "Für den Hauptlauf abrechenbares Volumen nach W/M = max(Shipment-CBM, Shipment-Gewicht/1000).",
    format: "number",
    read: (metrics) => metrics.shipping.chargeableCbm,
  },
  "derived.shipping.volumeFillPct": {
    label: "Volumen-Packgrad je Umkarton (%)",
    help: "Packgrad = Produktvolumen im Umkarton / Umkartonvolumen.",
    format: "percent",
    read: (metrics) => metrics.shipping.volumeFillPct,
  },
  "derived.shipping.voidVolumeLiters": {
    label: "Luft je Umkarton (Liter)",
    help: "Freies Volumen je Umkarton als Literwert.",
    format: "number",
    read: (metrics) => metrics.shipping.voidVolumeLiters,
  },
  "derived.shipping.weightFillPct": {
    label: "Gewichtsauslastung je Umkarton (%)",
    help: "Auslastung gegen maximal zulässiges Kartongewicht pro Umkarton.",
    format: "percent",
    read: (metrics) => metrics.shipping.weightFillPct,
  },
  "derived.shipping.manualFitStatus": {
    label: "Plausibilitätsstatus manuelle Umkartonisierung",
    help: "Status der manuellen Plausibilitätsprüfung (Maße/Gewicht).",
    format: "string",
    read: (metrics) => metrics.shipping.manualFitStatus,
  },
  "derived.shipping.manualMaxUnitsByDimensions": {
    label: "Maximal mögliche Stück bei manuellen Maßen",
    help: "Physisch maximal mögliche Stückzahl je Umkarton auf Basis manueller Maße.",
    format: "number",
    read: (metrics) => metrics.shipping.manualMaxUnitsByDimensions,
  },
  "derived.shipping.layoutPreview": {
    label: "Packbild Vorschau (Top-View)",
    help: "2D-Schema mit Raster nx × ny und Layeranzahl nz.",
    format: "string",
    read: (metrics) => {
      const preview = metrics.shipping.layoutPreview;
      if (!preview?.available) {
        return "Nicht verfügbar";
      }
      return `${preview.nx}x${preview.ny}x${preview.nz} · ${preview.placedUnits} Stück`;
    },
  },
  "derived.returns.returnLossPerReturnEur": {
    label: "Verlust pro 1 Retoure (EUR)",
    help: "Warenwertverlust pro Retoure auf Landed-Basis: (1 - verkaufbar%) × Landed.",
    format: "currency",
    read: (metrics) => metrics.returnLossPerReturn,
  },
  "derived.returns.returnCostPerReturnEur": {
    label: "Kosten pro 1 Retoure (EUR)",
    help: "Gesamtkosten pro Retoure: Verlust pro Retoure + Handlingkosten je Retoure.",
    format: "currency",
    read: (metrics) => metrics.returnCostPerReturn,
  },
  "derived.returns.sellableSharePct": {
    label: "Davon verkaufbar (%)",
    help: "Anteil der Retouren, der verkaufbar ist.",
    format: "percent",
    read: (metrics) => metrics.sellableSharePct,
  },
  "derived.returns.unsellableSharePctDerived": {
    label: "Davon nicht verkaufbar (%)",
    help: "Automatisch abgeleitet als 100 - verkaufbar%.",
    format: "percent",
    read: (metrics) => metrics.unsellableSharePctDerived,
  },
  "derived.shipping.estimatedCartonLengthCm": {
    label: "Geschätzte Umkarton-Länge (cm)",
    help: "Geschätzte Umkarton-Länge in cm aus Auto-Kartonisierung oder manuellem Override.",
    format: "number",
    read: (metrics) => metrics.shipping.estimatedCartonLengthCm,
  },
  "derived.shipping.estimatedCartonWidthCm": {
    label: "Geschätzte Umkarton-Breite (cm)",
    help: "Geschätzte Umkarton-Breite in cm aus Auto-Kartonisierung oder manuellem Override.",
    format: "number",
    read: (metrics) => metrics.shipping.estimatedCartonWidthCm,
  },
  "derived.shipping.estimatedCartonHeightCm": {
    label: "Geschätzte Umkarton-Höhe (cm)",
    help: "Geschätzte Umkarton-Höhe in cm aus Auto-Kartonisierung oder manuellem Override.",
    format: "number",
    read: (metrics) => metrics.shipping.estimatedCartonHeightCm,
  },
  "derived.shipping.estimatedCartonGrossWeightKg": {
    label: "Geschätztes Umkarton-Bruttogewicht (kg)",
    help: "Geschätztes Umkarton-Bruttogewicht in kg aus Auto-Kartonisierung oder manuellem Override.",
    format: "number",
    read: (metrics) => metrics.shipping.estimatedCartonGrossWeightKg,
  },
  "derived.shipping.cartonizationSource": {
    label: "Quelle der Kartonisierung",
    help: "Quelle der Kartonisierung: automatisch nach zulässigen Kartongrenzen oder manueller Override.",
    format: "string",
    read: (metrics) => metrics.shipping.cartonizationSourceLabel ?? metrics.shipping.cartonizationSource,
  },
  "derived.shipping.goodsValueEur": {
    label: "Warenwert (EUR)",
    help: "Warenwert in EUR = EXW USD × PO Units × USD->EUR.",
    format: "currency",
    read: (metrics) => metrics.shipping.goodsValueEur,
  },
  "derived.amazon.fbaShippingWeightG": {
    label: "FBA Versandgewicht (g)",
    help: "Versandgewicht = max(tatsächliches Gewicht, dimensionsabhängiges Gewicht).",
    format: "number",
    read: (metrics) => metrics.fbaShippingWeightG,
  },
  "derived.amazon.fbaTierLabel": {
    label: "FBA Auto-Tier",
    help: "Gematchtes FBA-Tier aus DE-Ratecard 2026-02.",
    format: "string",
    read: (metrics) => metrics.fbaTierLabel,
  },
  "derived.amazon.fbaFeeSource": {
    label: "FBA Fee Quelle",
    help: "Quelle der Fulfillment-Fee: auto, manual oder Fallback.",
    format: "string",
    read: (metrics) => metrics.fbaFeeSource,
  },
  "derived.amazon.fbaRateCardVersion": {
    label: "FBA Ratecard Version",
    help: "Aktive DE-Ratecard-Version für die Auto-Berechnung.",
    format: "string",
    read: (metrics) => metrics.fbaRateCardVersion,
  },
  "derived.quick.coreCoveragePct": {
    label: "Quick-Kostenabdeckung (%)",
    help: "Abdeckungsgrad der fünf QuickCheck-Hauptkostenblöcke an den Gesamtkosten je Unit.",
    format: "percent",
    read: (metrics) => metrics.quickCoreCoveragePct,
  },
  "derived.quick.coreResidualPerUnit": {
    label: "Quick-Restkosten (EUR/Unit)",
    help: "Nicht durch die fünf QuickCheck-Hauptblöcke abgedeckte Restkosten je Unit.",
    format: "currency",
    read: (metrics) => metrics.quickCoreResidualPerUnit,
  },
  "derived.quick.blockShippingTo3plPerUnit": {
    label: "Quick-Block Shipping -> 3PL (EUR/Unit)",
    help: "Quick-Hauptblock Shipping inkl. Customs und orderbezogenen Import-Fixkosten je Unit.",
    format: "currency",
    read: (metrics) => metrics.quickBlockShippingTo3plPerUnit,
  },
  "derived.quick.blockAmazonCorePerUnit": {
    label: "Quick-Block Amazon Core (EUR/Unit)",
    help: "Quick-Hauptblock Amazon Core aus Referral, TACoS und FBA je Unit.",
    format: "currency",
    read: (metrics) => metrics.quickBlockAmazonCorePerUnit,
  },
  "derived.quick.blockLaunchCorePerUnit": {
    label: "Quick-Block Launch Core (EUR/Unit)",
    help: "Quick-Hauptblock Launch Core aus Listing, Launch-Budget und Launch-Ops je Unit.",
    format: "currency",
    read: (metrics) => metrics.quickBlockLaunchCorePerUnit,
  },
  "derived.quick.residualTop1PerUnit": {
    label: "Quick-Restkosten Top 1 (EUR/Unit)",
    help: "Größter Nicht-Core-Kostenblock außerhalb des QuickCheck-Workflows.",
    format: "currency",
    read: (metrics) => metrics.quickResidualTop1PerUnit,
  },
  "derived.quick.residualTop2PerUnit": {
    label: "Quick-Restkosten Top 2 (EUR/Unit)",
    help: "Zweitgrößter Nicht-Core-Kostenblock außerhalb des QuickCheck-Workflows.",
    format: "currency",
    read: (metrics) => metrics.quickResidualTop2PerUnit,
  },
  "derived.quick.residualTop3PerUnit": {
    label: "Quick-Restkosten Top 3 (EUR/Unit)",
    help: "Drittgrößter Nicht-Core-Kostenblock außerhalb des QuickCheck-Workflows.",
    format: "currency",
    read: (metrics) => metrics.quickResidualTop3PerUnit,
  },
  "derived.validation.coveragePct": {
    label: "Validation-Abdeckung (%)",
    help: "Abdeckungsgrad der validierten Blöcke an den Gesamtkosten je Unit.",
    format: "percent",
    read: (metrics) => metrics.validationCoveragePct,
  },
  "derived.validation.coveredPerUnit": {
    label: "Validation abgedeckt (EUR/Unit)",
    help: "Summe der in Validation abgedeckten Kosten je Unit.",
    format: "currency",
    read: (metrics) => metrics.validationCoveredPerUnit,
  },
  "derived.validation.residualPerUnit": {
    label: "Validation offen (EUR/Unit)",
    help: "Noch nicht validierte Restkosten je Unit.",
    format: "currency",
    read: (metrics) => metrics.validationResidualPerUnit,
  },
  "derived.validation.targetPct": {
    label: "Validation Zielabdeckung (%)",
    help: "Konfiguriertes Ziel für die Validation-Abdeckung.",
    format: "percent",
    read: (metrics) => metrics.validationCoverageTargetPct,
  },
  "derived.threepl.palletsCount": {
    label: "Anzahl Paletten",
    help: "Paletten = ceil(PO Units / units_per_pallet).",
    format: "number",
    read: (metrics) => metrics.palletsCount,
  },
  "derived.threepl.inboundTotal": {
    label: "3PL Receiving total (EUR)",
    help: "Receiving Gesamtkosten je Shipment.",
    format: "currency",
    read: (metrics) => metrics.threePlInboundTotal,
  },
  "derived.threepl.storageTotal": {
    label: "3PL Storage total (EUR)",
    help: "Storage Gesamtkosten je Shipment.",
    format: "currency",
    read: (metrics) => metrics.threePlStorageTotal,
  },
  "derived.threepl.outboundServiceTotal": {
    label: "3PL Service total (EUR)",
    help: "Outbound-Service Gesamtkosten je Shipment.",
    format: "currency",
    read: (metrics) => metrics.threePlOutboundServiceTotal,
  },
  "derived.threepl.carrierTotal": {
    label: "3PL Carrier total (EUR)",
    help: "Carrier Gesamtkosten je Shipment.",
    format: "currency",
    read: (metrics) => metrics.threePlCarrierTotal,
  },
};

const DEFAULT_ROBUSTNESS = {
  "ads.tacosRate": { score: 45, why: "Ads-Leistung ist stark produkt- und keywordabhängig." },
  "ads.launchMultiplier": { score: 50, why: "Launch-Druck schwankt je Wettbewerb und Rankingstatus." },
  "ads.launchMonths": { score: 55, why: "Launch-Dauer ist meist planbar, aber marktabhängig." },
  "returns.returnRate": { score: 50, why: "Retouren variieren je Produktqualität und Erwartungsmanagement." },
  "returns.sellableShare": { score: 40, why: "Verkaufbarkeit hängt stark von Zustand, Kategorie und Verpackung ab." },
  "returns.unsellableSharePctDerived": { score: 40, why: "Abgeleiteter Gegenwert aus verkaufbar%." },
  "returns.handlingCost": { score: 60, why: "Interne Handling-Kosten sind intern meist gut messbar." },
  "leakage.ratePct": { score: 45, why: "Leakage ist ein pauschaler Sicherheitspuffer." },
  "import.customsDutyRate": { score: 82, why: "Zollsätze sind tariflich gut definiert." },
  "import.importVatRate": { score: 95, why: "Einfuhrumsatzsteuer ist rechtlich klar festgelegt." },
  "amazon.referralRate": { score: 88, why: "Referral-Fee ist von Amazon-Kategoriegebühren vorgegeben." },
  "lifecycle.targetMarginPct": { score: 70, why: "Zielmarge ist strategisch und bewusst wählbar." },
  "lifecycle.otherMonthlyCost": { score: 40, why: "Weitere Lifecycle-Kosten sind oft schwer vollständig planbar." },
  "cartonization.unitsPerCarton": { score: 72, why: "Mit realer Packing-List ist der Wert meist stabil und belastbar." },
  "cartonization.cartonLengthCm": { score: 70, why: "Manuelle Kartonmaße sind bei Lieferantenfreigabe gut belastbar." },
  "cartonization.cartonWidthCm": { score: 70, why: "Manuelle Kartonmaße sind bei Lieferantenfreigabe gut belastbar." },
  "cartonization.cartonHeightCm": { score: 70, why: "Manuelle Kartonmaße sind bei Lieferantenfreigabe gut belastbar." },
  "cartonization.cartonGrossWeightKg": { score: 68, why: "Bruttogewicht ist stabil, aber kann je Packmaterial leicht schwanken." },
};

const BOOLEAN_PATHS = new Set([
  "assumptions.ads.overrideTacos",
  "assumptions.ads.overrideLaunchMultiplier",
  "assumptions.ads.overrideLaunchMonths",
  "assumptions.returns.overrideReturnRate",
  "assumptions.returns.overrideSellableShare",
  "assumptions.returns.overrideResaleRate",
  "assumptions.returns.overrideUnsellableShare",
  "assumptions.returns.overrideHandlingCost",
  "assumptions.leakage.overrideRatePct",
  "assumptions.import.overrideCustomsDutyRate",
  "assumptions.import.overrideImportVatRate",
  "assumptions.import.includeImportVatAsCost",
  "assumptions.import.includeImportVatInCashRoi",
  "assumptions.amazon.overrideReferralRate",
  "assumptions.amazon.useManualFbaFee",
  "assumptions.lifecycle.overrideTargetMarginPct",
  "assumptions.lifecycle.overrideOtherMonthlyCost",
  "assumptions.launchSplit.enabled",
  "assumptions.cartonization.manualEnabled",
  "assumptions.extraCosts.overridePackagingGroup",
  "assumptions.extraCosts.overrideLogisticsGroup",
  "assumptions.extraCosts.overrideLaunchOpsGroup",
  "workflow.deepDive.supplierValidated",
  "workflow.deepDive.complianceChecked",
  "workflow.deepDive.sampleDecisionReady",
]);

const STRING_PATHS = new Set([
  "name",
  "basic.category",
  "basic.demandBasis",
  "basic.transportMode",
  "basic.marketplace",
  "basic.fulfillmentModel",
  "basic.listingPackage",
  "basic.launchCompetition",
  "assumptions.extraCosts.receivingMode",
]);

const SETTINGS_BOOLEAN_PATHS = new Set([
  "shipping12m.customsBrokerEnabled",
  "shipping12m.insurance.enabled",
  "shipping12m.manualSurchargeEnabled",
]);
const SETTINGS_STRING_PATHS = new Set([
  "shipping12m.insurance.basis",
  "amazonFba.de.rateCardVersion",
  "amazonFba.de.sourceUrl",
]);

const OVERRIDE_CONTROL_MAP = [
  ["assumptions.ads.overrideTacos", "assumptions.ads.tacosRate"],
  ["assumptions.ads.overrideLaunchMultiplier", "assumptions.ads.launchMultiplier"],
  ["assumptions.ads.overrideLaunchMonths", "assumptions.ads.launchMonths"],
  ["assumptions.returns.overrideReturnRate", "assumptions.returns.returnRate"],
  ["assumptions.returns.overrideSellableShare", "assumptions.returns.sellableShare"],
  ["assumptions.returns.overrideResaleRate", "assumptions.returns.resaleRate"],
  ["assumptions.returns.overrideUnsellableShare", "assumptions.returns.unsellableShare"],
  ["assumptions.returns.overrideHandlingCost", "assumptions.returns.handlingCost"],
  ["assumptions.leakage.overrideRatePct", "assumptions.leakage.ratePct"],
  ["assumptions.import.overrideCustomsDutyRate", "assumptions.import.customsDutyRate"],
  ["assumptions.import.overrideImportVatRate", "assumptions.import.importVatRate"],
  ["assumptions.amazon.overrideReferralRate", "assumptions.amazon.referralRate"],
  ["assumptions.lifecycle.overrideTargetMarginPct", "assumptions.lifecycle.targetMarginPct"],
  ["assumptions.lifecycle.overrideOtherMonthlyCost", "assumptions.lifecycle.otherMonthlyCost"],
];

const VALUE_TO_OVERRIDE_MAP = new Map(
  OVERRIDE_CONTROL_MAP.map(([overridePath, valuePath]) => [valuePath, overridePath]),
);

const AMAZON_FBA_MANUAL_OVERRIDE_PATH = "assumptions.amazon.useManualFbaFee";
const AMAZON_FBA_MANUAL_FEE_PATH = "assumptions.amazon.manualFbaFee";

const EXTRA_COST_TO_SETTING_PATH = {
  "assumptions.extraCosts.packagingPerUnitEur": "settings.costDefaults.packagingPerUnitEur",
  "assumptions.extraCosts.otherUnitCostEur": "settings.costDefaults.otherUnitCostEur",
  "assumptions.extraCosts.docsPerOrderEur": "settings.costDefaults.docsPerOrderEur",
  "assumptions.extraCosts.freightPapersPerOrderEur": "settings.costDefaults.freightPapersPerOrderEur",
  "assumptions.extraCosts.amazonStoragePerCbmMonthEur": "settings.costDefaults.amazonStoragePerCbmMonthEur",
  "assumptions.extraCosts.avgAmazonStorageMonths": "settings.costDefaults.avgAmazonStorageMonths",
  "assumptions.extraCosts.greetingCardPerLaunchUnitEur": "settings.costDefaults.greetingCardPerLaunchUnitEur",
  "assumptions.extraCosts.samplesPerProductEur": "settings.costDefaults.samplesPerProductEur",
  "assumptions.extraCosts.toolingPerProductEur": "settings.costDefaults.toolingPerProductEur",
  "assumptions.extraCosts.certificatesPerProductEur": "settings.costDefaults.certificatesPerProductEur",
  "assumptions.extraCosts.inspectionPerProductEur": "settings.costDefaults.inspectionPerProductEur",
  "assumptions.extraCosts.receivingPerCartonSortedEur": "settings.threePl.receivingPerCartonSortedEur",
  "assumptions.extraCosts.receivingPerCartonMixedEur": "settings.threePl.receivingPerCartonMixedEur",
  "assumptions.extraCosts.storagePerPalletPerMonthEur": "settings.threePl.storagePerPalletPerMonthEur",
  "assumptions.extraCosts.unitsPerPallet": "settings.threePl.unitsPerPallet",
  "assumptions.extraCosts.avg3PlStorageMonths": "settings.threePl.avgStorageMonths",
  "assumptions.extraCosts.outboundBasePerCartonEur": "settings.threePl.outboundBasePerCartonEur",
  "assumptions.extraCosts.pickPackPerCartonEur": "settings.threePl.pickPackPerCartonEur",
  "assumptions.extraCosts.fbaProcessingPerCartonEur": "settings.threePl.fbaProcessingPerCartonEur",
  "assumptions.extraCosts.insertPerInsertEur": "settings.threePl.insertPerInsertEur",
  "assumptions.extraCosts.thirdCountryLabelPerLabelEur": "settings.threePl.thirdCountryLabelPerLabelEur",
  "assumptions.extraCosts.insertsPerCarton": "settings.threePl.insertsPerCartonDefault",
  "assumptions.extraCosts.labelsPerCarton": "settings.threePl.labelsPerCartonDefault",
  "assumptions.extraCosts.carrierCostPerCartonEur": "settings.threePl.carrierCostPerCartonEur",
};

const SETTING_TO_EXTRA_COST_PATH = new Map(
  Object.entries(EXTRA_COST_TO_SETTING_PATH).map(([assumptionPath, settingPath]) => [settingPath, assumptionPath]),
);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const state = {
  products: [],
  settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
  selectedId: null,
  session: {
    appMode: "loading",
    requiresAuth: false,
    isAuthenticated: false,
    hasWorkspaceAccess: false,
    pendingLocalImport: false,
    userId: null,
    userEmail: "",
    workspaceId: null,
    workspaceName: "",
  },
  storage: {
    mode: "local",
    adapter: null,
  },
  supabase: {
    client: null,
    authSubscribed: false,
  },
  sync: {
    settingsTimer: null,
    productsTimer: null,
    settingsSaving: false,
    productsSaving: false,
    settingsPending: false,
    productsPending: false,
    lastRemoteError: null,
    lastRemoteSuccessAt: null,
  },
  realtime: {
    channel: null,
    channelWorkspaceId: null,
    connected: false,
    pullTimer: null,
    pullInFlight: false,
    pendingPull: false,
    pendingApply: false,
    fallbackTimer: null,
    lastEventAt: null,
    lastPullAt: null,
    lastLocalEditAt: 0,
  },
  presence: {
    editingByField: {},
    myEditingField: null,
    heartbeatTimer: null,
    focusClearTimer: null,
  },
  fx: {
    usdToEur: DEFAULT_USD_TO_EUR,
    date: null,
    source: "Fallback",
    loading: false,
    error: null,
  },
  ui: {
    advancedVisible: false,
    quickShowAllKpis: false,
    compareSort: "profit_desc",
    compareFilter: "all",
    focusedDriverPaths: [],
    focusedDriverLabel: "",
    workspaceTab: "product",
    driverModal: null,
    costCategoryExpanded: {},
    chainExpanded: {},
    validationSandboxDraft: null,
    validationSandboxActive: false,
    validationSandboxProductId: null,
    validationBaselineMetrics: null,
    validationSandboxMetrics: null,
    shipping3dCleanup: null,
    shipping3dInlineCleanup: null,
  },
};

const dom = {
  productCount: document.getElementById("productCount"),
  productList: document.getElementById("productList"),
  productItemTemplate: document.getElementById("productItemTemplate"),
  addProductBtn: document.getElementById("addProductBtn"),
  duplicateProductBtn: document.getElementById("duplicateProductBtn"),
  deleteProductBtn: document.getElementById("deleteProductBtn"),
  stageQuickBtn: document.getElementById("stageQuickBtn"),
  stageValidationBtn: document.getElementById("stageValidationBtn"),
  stageDeepBtn: document.getElementById("stageDeepBtn"),
  stageHint: document.getElementById("stageHint"),
  stageNextStep: document.getElementById("stageNextStep"),
  stageGateStatus: document.getElementById("stageGateStatus"),
  stageWarning: document.getElementById("stageWarning"),
  quickStagePanel: document.getElementById("quickStagePanel"),
  validationStagePanel: document.getElementById("validationStagePanel"),
  validationPlaygroundPanel: document.getElementById("validationPlaygroundPanel"),
  quickCostWorkflowGrid: document.getElementById("quickCostWorkflowGrid"),
  validationBlockGrid: document.getElementById("validationBlockGrid"),
  quickBlockExwPerUnit: document.getElementById("quickBlockExwPerUnit"),
  quickBlockShippingTo3plPerUnit: document.getElementById("quickBlockShippingTo3plPerUnit"),
  quickBlockThreePlPerUnit: document.getElementById("quickBlockThreePlPerUnit"),
  quickBlockAmazonCorePerUnit: document.getElementById("quickBlockAmazonCorePerUnit"),
  quickBlockLaunchCorePerUnit: document.getElementById("quickBlockLaunchCorePerUnit"),
  quickCoverageCard: document.getElementById("quickCoverageCard"),
  quickCoreCoveragePct: document.getElementById("quickCoreCoveragePct"),
  quickCoreTotalCost: document.getElementById("quickCoreTotalCost"),
  quickCoreCoveredCost: document.getElementById("quickCoreCoveredCost"),
  quickCoreResidualCost: document.getElementById("quickCoreResidualCost"),
  quickCoverageStatus: document.getElementById("quickCoverageStatus"),
  quickResidualTopList: document.getElementById("quickResidualTopList"),
  validationCoverageCard: document.getElementById("validationCoverageCard"),
  validationCoveragePct: document.getElementById("validationCoveragePct"),
  validationCoverageTarget: document.getElementById("validationCoverageTarget"),
  validationCoveredCost: document.getElementById("validationCoveredCost"),
  validationResidualCost: document.getElementById("validationResidualCost"),
  validationCoverageStatus: document.getElementById("validationCoverageStatus"),
  validationOpenTopList: document.getElementById("validationOpenTopList"),
  validationCompareGrid: document.getElementById("validationCompareGrid"),
  validationApplyBtn: document.getElementById("validationApplyBtn"),
  validationDiscardBtn: document.getElementById("validationDiscardBtn"),
  validationResetBtn: document.getElementById("validationResetBtn"),
  toggleAllKpisBtn: document.getElementById("toggleAllKpisBtn"),
  decisionSecondaryWrap: document.getElementById("decisionSecondaryWrap"),
  advancedToggleWrap: document.getElementById("advancedToggleWrap"),
  advancedToggle: document.getElementById("advancedToggle"),
  advancedPanel: document.getElementById("advancedPanel"),
  headerProductName: document.getElementById("headerProductName"),
  fxStatus: document.getElementById("fxStatus"),
  refreshFxBtn: document.getElementById("refreshFxBtn"),
  launchSplitBox: document.getElementById("launchSplitBox"),
  launchSplitHint: document.getElementById("launchSplitHint"),
  compareSort: document.getElementById("compareSort"),
  compareFilter: document.getElementById("compareFilter"),
  comparisonBody: document.getElementById("comparisonBody"),
  trafficLight: document.getElementById("trafficLight"),
  driverFocusHint: document.getElementById("driverFocusHint"),
  outputsCard: document.getElementById("outputsCard"),
  shippingQuickCard: document.getElementById("shippingQuickCard"),
  shippingModuleSection: document.getElementById("shippingModuleSection"),
  shippingModuleCanvasHost: document.getElementById("shippingModuleCanvasHost"),
  shippingModuleMeta: document.getElementById("shippingModuleMeta"),
  shippingModuleStatus: document.getElementById("shippingModuleStatus"),
  shippingModuleOpenDetailBtn: document.getElementById("shippingModuleOpenDetailBtn"),
  cartonPresetSelect: document.getElementById("cartonPresetSelect"),
  categoryDefaultsAdmin: document.getElementById("categoryDefaultsAdmin"),
  shippingMethodText: document.getElementById("shippingMethodText"),
  shippingDetailList: document.getElementById("shippingDetailList"),
  shippingTotalPo: document.getElementById("shippingTotalPo"),
  shippingTotalUnit: document.getElementById("shippingTotalUnit"),
  shippingUnitsByWeightCap: document.getElementById("shippingUnitsByWeightCap"),
  shippingUnitsByDimensionCap: document.getElementById("shippingUnitsByDimensionCap"),
  shippingCartonUnits: document.getElementById("shippingCartonUnits"),
  shippingPhysicalCartons: document.getElementById("shippingPhysicalCartons"),
  shippingShipmentCbm: document.getElementById("shippingShipmentCbm"),
  shippingShipmentWeight: document.getElementById("shippingShipmentWeight"),
  shippingChargeableCbm: document.getElementById("shippingChargeableCbm"),
  shippingEquivalentFillPct: document.getElementById("shippingEquivalentFillPct"),
  shippingEquivalentReferenceCbm: document.getElementById("shippingEquivalentReferenceCbm"),
  shippingEquivalentReferenceWeightKg: document.getElementById("shippingEquivalentReferenceWeightKg"),
  shippingEquivalentCartons: document.getElementById("shippingEquivalentCartons"),
  shippingCartonDims: document.getElementById("shippingCartonDims"),
  shippingCartonWeight: document.getElementById("shippingCartonWeight"),
  shippingCartonSource: document.getElementById("shippingCartonSource"),
  shippingOversizeNote: document.getElementById("shippingOversizeNote"),
  basicShippingUnit: document.getElementById("basicShippingUnit"),
  basicShippingMeta: document.getElementById("basicShippingMeta"),
  fbaInfoCard: document.getElementById("fbaInfoCard"),
  fbaInfoFeeUnit: document.getElementById("fbaInfoFeeUnit"),
  fbaInfoProfile: document.getElementById("fbaInfoProfile"),
  fbaInfoTier: document.getElementById("fbaInfoTier"),
  fbaInfoTableFee: document.getElementById("fbaInfoTableFee"),
  fbaInfoTableFeeMeta: document.getElementById("fbaInfoTableFeeMeta"),
  fbaInfoShippingWeight: document.getElementById("fbaInfoShippingWeight"),
  fbaInfoWeightBreakdown: document.getElementById("fbaInfoWeightBreakdown"),
  fbaInfoSource: document.getElementById("fbaInfoSource"),
  fbaInfoSourceLink: document.getElementById("fbaInfoSourceLink"),
  fbaInfoFallback: document.getElementById("fbaInfoFallback"),
  fbaInfoHints: document.getElementById("fbaInfoHints"),
  advancedFbaOverridePanel: document.getElementById("advancedFbaOverridePanel"),
  advancedFbaAutoHint: document.getElementById("advancedFbaAutoHint"),
  advancedFbaOverrideStatus: document.getElementById("advancedFbaOverrideStatus"),
  chainMapSection: document.getElementById("chainMapSection"),
  categoryMapSection: document.getElementById("categoryMapSection"),
  sensitivitySection: document.getElementById("sensitivitySection"),
  chainSupplierChips: document.getElementById("chainSupplierChips"),
  chainImportChips: document.getElementById("chainImportChips"),
  chainThreePlChips: document.getElementById("chainThreePlChips"),
  chainInboundChips: document.getElementById("chainInboundChips"),
  chainAmazonChips: document.getElementById("chainAmazonChips"),
  chainLaunchChips: document.getElementById("chainLaunchChips"),
  chainTotalSummary: document.getElementById("chainTotalSummary"),
  categoryTotalSummary: document.getElementById("categoryTotalSummary"),
  costDeltaSummary: document.getElementById("costDeltaSummary"),
  costDeltaCard: document.getElementById("costDeltaCard"),
  appContent: document.getElementById("appContent"),
  authPanel: document.getElementById("authPanel"),
  noAccessPanel: document.getElementById("noAccessPanel"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authLoginBtn: document.getElementById("authLoginBtn"),
  authRegisterBtn: document.getElementById("authRegisterBtn"),
  authLogoutBtn: document.getElementById("authLogoutBtn"),
  authStatus: document.getElementById("authStatus"),
  storageModeLabel: document.getElementById("storageModeLabel"),
  sessionInfo: document.getElementById("sessionInfo"),
  syncNowBtn: document.getElementById("syncNowBtn"),
  importLocalBtn: document.getElementById("importLocalBtn"),
  compareCard: document.getElementById("compareCard"),
  productWorkspace: document.getElementById("productWorkspace"),
  driverModal: document.getElementById("driverModal"),
  driverModalTitle: document.getElementById("driverModalTitle"),
  driverModalSubtitle: document.getElementById("driverModalSubtitle"),
  driverModalFields: document.getElementById("driverModalFields"),
  driverModalCloseBtn: document.getElementById("driverModalCloseBtn"),

  kpiRevenueGross: document.getElementById("kpiRevenueGross"),
  kpiRevenueNet: document.getElementById("kpiRevenueNet"),
  kpiSellerboardMargin: document.getElementById("kpiSellerboardMargin"),
  kpiNetMargin: document.getElementById("kpiNetMargin"),
  kpiShippingUnit: document.getElementById("kpiShippingUnit"),
  kpiLandedUnit: document.getElementById("kpiLandedUnit"),
  kpiDb1Unit: document.getElementById("kpiDb1Unit"),
  kpiDb1Margin: document.getElementById("kpiDb1Margin"),
  kpiNetMarginBeforePpc: document.getElementById("kpiNetMarginBeforePpc"),
  kpiGrossProfitMonthly: document.getElementById("kpiGrossProfitMonthly"),
  kpiProfitMonthly: document.getElementById("kpiProfitMonthly"),
  kpiTotalCostMonthly: document.getElementById("kpiTotalCostMonthly"),
  kpiTotalCostPerUnit: document.getElementById("kpiTotalCostPerUnit"),
  kpiBreakEvenPrice: document.getElementById("kpiBreakEvenPrice"),
  kpiMaxTacos: document.getElementById("kpiMaxTacos"),
  kpiProductRoi: document.getElementById("kpiProductRoi"),
  kpiCashRoi: document.getElementById("kpiCashRoi"),
  kpiPayback: document.getElementById("kpiPayback"),

  costCategoryGrid: document.getElementById("costCategoryGrid"),

  sensPriceDown: document.getElementById("sensPriceDown"),
  sensTacosUp: document.getElementById("sensTacosUp"),
  sensUnitsDown: document.getElementById("sensUnitsDown"),
  sensWorst: document.getElementById("sensWorst"),
  sensBest: document.getElementById("sensBest"),
};

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isUuid(value) {
  return typeof value === "string" && UUID_REGEX.test(value);
}

function ensureProductId(product) {
  if (!product || typeof product !== "object") {
    return uid();
  }
  if (!isUuid(product.id)) {
    product.id = uid();
  }
  return product.id;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundInt(value, fallback = 0) {
  return Math.round(num(value, fallback));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatUsd(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return `${value.toFixed(1)} %`;
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(value);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(parsed);
  }
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function listingPackageLabel(key) {
  const labels = {
    ai: "KI",
    photographer: "Fotograf",
    visual_advantage: "Visual Advantage",
  };
  return labels[key] ?? key;
}

function launchCompetitionLabel(key) {
  const labels = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };
  return labels[key] ?? key;
}

function normalizeShippingMode(mode) {
  return mode === "rail" ? "rail" : "sea_lcl";
}

function shippingModeLabel(mode) {
  const normalized = normalizeShippingMode(mode);
  return normalized === "rail" ? "Rail" : "Sea LCL";
}

function shippingModeSettingsPathPrefix(mode) {
  return `settings.shipping12m.modes.${normalizeShippingMode(mode)}`;
}

function shippingModeDriverPaths(mode) {
  const normalized = normalizeShippingMode(mode);
  const prefix = shippingModeSettingsPathPrefix(normalized);
  if (normalized === "rail") {
    return [
      `${prefix}.rateEurPerCbm`,
      `${prefix}.originBaseEurPerShipment`,
      `${prefix}.originPerCbmEur`,
      `${prefix}.mainRunFixedEurPerShipment`,
      `${prefix}.deOncarriageBaseEurPerShipment`,
      `${prefix}.deOncarriagePerCbmEur`,
      "settings.shipping12m.customsBrokerEnabled",
      "settings.shipping12m.customsBrokerFixedEurPerShipment",
      "settings.shipping12m.insurance.enabled",
      "settings.shipping12m.insurance.basis",
      "settings.shipping12m.insurance.ratePct",
      "settings.shipping12m.manualSurchargeEnabled",
      "settings.shipping12m.manualSurchargeEurPerShipment",
    ];
  }
  const categories = [
    `${prefix}.rateEurPerCbm`,
    `${prefix}.originFixedEurPerShipment`,
    `${prefix}.destinationFixedEurPerShipment`,
    `${prefix}.deOncarriageFixedEurPerShipment`,
    "settings.shipping12m.customsBrokerEnabled",
    "settings.shipping12m.customsBrokerFixedEurPerShipment",
    "settings.shipping12m.insurance.enabled",
    "settings.shipping12m.insurance.basis",
    "settings.shipping12m.insurance.ratePct",
  ];
  return categories;
}

function shippingOriginDriverPaths(mode) {
  const normalized = normalizeShippingMode(mode);
  const prefix = shippingModeSettingsPathPrefix(normalized);
  if (normalized === "rail") {
    return [`${prefix}.originBaseEurPerShipment`, `${prefix}.originPerCbmEur`];
  }
  return [`${prefix}.originFixedEurPerShipment`];
}

function shippingMainRunFixedDriverPaths(mode) {
  const normalized = normalizeShippingMode(mode);
  const prefix = shippingModeSettingsPathPrefix(normalized);
  if (normalized === "rail") {
    return [`${prefix}.mainRunFixedEurPerShipment`];
  }
  return [`${prefix}.destinationFixedEurPerShipment`];
}

function shippingOncarriageDriverPaths(mode) {
  const normalized = normalizeShippingMode(mode);
  const prefix = shippingModeSettingsPathPrefix(normalized);
  if (normalized === "rail") {
    return [`${prefix}.deOncarriageBaseEurPerShipment`, `${prefix}.deOncarriagePerCbmEur`];
  }
  return [`${prefix}.deOncarriageFixedEurPerShipment`];
}

function shippingManualSurchargeDriverPaths(mode) {
  if (normalizeShippingMode(mode) !== "rail") {
    return [];
  }
  return ["settings.shipping12m.manualSurchargeEnabled", "settings.shipping12m.manualSurchargeEurPerShipment"];
}

function cartonizationSettingsPaths() {
  return [
    "settings.cartonRules.maxLengthCm",
    "settings.cartonRules.maxWidthCm",
    "settings.cartonRules.maxHeightCm",
    "settings.cartonRules.maxWeightKg",
    "settings.cartonRules.outerBufferCm",
    "settings.cartonRules.grossWeightUpliftPct",
    "settings.cartonRules.equivalentCartonFillPct",
  ];
}

function cartonizationProductPaths() {
  return [
    "assumptions.cartonization.manualEnabled",
    "assumptions.cartonization.unitsPerCarton",
    "assumptions.cartonization.cartonLengthCm",
    "assumptions.cartonization.cartonWidthCm",
    "assumptions.cartonization.cartonHeightCm",
    "assumptions.cartonization.cartonGrossWeightKg",
  ];
}

function robustnessLabel(score) {
  if (score >= 80) {
    return "hoch";
  }
  if (score >= 60) {
    return "mittel";
  }
  return "niedrig";
}

function getByPath(object, path) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), object);
}

function setByPath(object, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  let cursor = object;
  keys.forEach((key) => {
    if (cursor[key] === undefined || cursor[key] === null || typeof cursor[key] !== "object") {
      cursor[key] = {};
    }
    cursor = cursor[key];
  });
  cursor[last] = value;
}

function unsetByPath(object, path) {
  if (!object || typeof object !== "object") {
    return;
  }
  const keys = path.split(".");
  const last = keys.pop();
  let cursor = object;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) {
      return;
    }
    cursor = cursor[key];
  }
  if (cursor && typeof cursor === "object" && last in cursor) {
    delete cursor[last];
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resolveEffectiveSettings(product) {
  const effective = deepClone(state.settings);
  const overrides = product?.assumptions?.localSettingOverrides;
  if (overrides && typeof overrides === "object") {
    const stack = [{ value: overrides, prefix: "" }];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || typeof current.value !== "object" || current.value === null) {
        continue;
      }
      Object.entries(current.value).forEach(([key, nested]) => {
        const nextPath = current.prefix ? `${current.prefix}.${key}` : key;
        if (nested && typeof nested === "object" && !Array.isArray(nested)) {
          stack.push({ value: nested, prefix: nextPath });
          return;
        }
        setByPath(effective, nextPath, nested);
      });
    }
  }
  return sanitizeSettings(effective);
}

function defaultProduct(index = 1) {
  return {
    id: uid(),
    name: `Produkt ${index}`,
    workflow: {
      stage: "quick",
      validation: {
        checkedBlockIds: [],
        coverageTargetPct: VALIDATION_COVERAGE_TARGET_DEFAULT,
        lastAppliedAt: null,
      },
      review: {
        validation: {},
        deep_dive: {},
      },
      deepDive: {
        supplierValidated: false,
        complianceChecked: false,
        sampleDecisionReady: false,
      },
    },
    basic: {
      priceGross: 29.99,
      category: "home",
      demandValue: 280,
      demandBasis: "month",
      horizonMonths: 6,
      netWeightG: 520,
      packLengthCm: 24,
      packWidthCm: 16,
      packHeightCm: 8,
      unitsPerOrder: 1200,
      transportMode: "rail",
      exwUnit: 6.4,
      marketplace: "DE",
      fulfillmentModel: "fba",
      launchBudgetTotal: 0,
      listingPackage: "ai",
      launchCompetition: "medium",
    },
    assumptions: {
      ads: {
        overrideTacos: true,
        tacosRate: 10,
        overrideLaunchMultiplier: false,
        launchMultiplier: 1.5,
        overrideLaunchMonths: false,
        launchMonths: 3,
      },
      returns: {
        overrideReturnRate: true,
        returnRate: 10,
        overrideSellableShare: false,
        sellableShare: 45,
        // Legacy-Felder bleiben für Alt-Daten lesbar.
        overrideResaleRate: false,
        resaleRate: 45,
        overrideUnsellableShare: false,
        unsellableShare: 55,
        overrideHandlingCost: false,
        handlingCost: 1.1,
      },
      leakage: {
        overrideRatePct: false,
        ratePct: 3,
      },
      import: {
        overrideCustomsDutyRate: false,
        customsDutyRate: GLOBAL_DEFAULTS.importCustomsDutyRate,
        overrideImportVatRate: false,
        importVatRate: GLOBAL_DEFAULTS.importVatRate,
        includeImportVatAsCost: false,
        includeImportVatInCashRoi: true,
      },
      amazon: {
        overrideReferralRate: false,
        referralRate: 15,
        useManualFbaFee: false,
        manualFbaFee: 3.8,
      },
      lifecycle: {
        overrideTargetMarginPct: false,
        targetMarginPct: 15,
        overrideOtherMonthlyCost: false,
        otherMonthlyCost: 0,
      },
      launchSplit: {
        enabled: false,
        listing: 0,
        vine: 0,
        coupons: 0,
        other: 0,
      },
      cartonization: {
        manualEnabled: false,
        unitsPerCarton: 4,
        cartonLengthCm: 0,
        cartonWidthCm: 0,
        cartonHeightCm: 0,
        cartonGrossWeightKg: 0,
      },
      localSettingOverrides: {},
      extraCosts: {
        overridePackagingGroup: false,
        packagingPerUnitEur: DEFAULT_SETTINGS.costDefaults.packagingPerUnitEur,
        otherUnitCostEur: DEFAULT_SETTINGS.costDefaults.otherUnitCostEur,

        overrideLogisticsGroup: false,
        docsPerOrderEur: DEFAULT_SETTINGS.costDefaults.docsPerOrderEur,
        freightPapersPerOrderEur: DEFAULT_SETTINGS.costDefaults.freightPapersPerOrderEur,
        receivingMode: "sorted",
        receivingPerCartonSortedEur: DEFAULT_SETTINGS.threePl.receivingPerCartonSortedEur,
        receivingPerCartonMixedEur: DEFAULT_SETTINGS.threePl.receivingPerCartonMixedEur,
        storagePerPalletPerMonthEur: DEFAULT_SETTINGS.threePl.storagePerPalletPerMonthEur,
        unitsPerPallet: DEFAULT_SETTINGS.threePl.unitsPerPallet,
        avg3PlStorageMonths: DEFAULT_SETTINGS.threePl.avgStorageMonths,
        outboundBasePerCartonEur: DEFAULT_SETTINGS.threePl.outboundBasePerCartonEur,
        pickPackPerCartonEur: DEFAULT_SETTINGS.threePl.pickPackPerCartonEur,
        fbaProcessingPerCartonEur: DEFAULT_SETTINGS.threePl.fbaProcessingPerCartonEur,
        insertsPerCarton: DEFAULT_SETTINGS.threePl.insertsPerCartonDefault,
        insertPerInsertEur: DEFAULT_SETTINGS.threePl.insertPerInsertEur,
        labelsPerCarton: DEFAULT_SETTINGS.threePl.labelsPerCartonDefault,
        thirdCountryLabelPerLabelEur: DEFAULT_SETTINGS.threePl.thirdCountryLabelPerLabelEur,
        carrierCostPerCartonEur: DEFAULT_SETTINGS.threePl.carrierCostPerCartonEur,
        amazonStoragePerCbmMonthEur: DEFAULT_SETTINGS.costDefaults.amazonStoragePerCbmMonthEur,
        avgAmazonStorageMonths: DEFAULT_SETTINGS.costDefaults.avgAmazonStorageMonths,

        overrideLaunchOpsGroup: false,
        greetingCardPerLaunchUnitEur: DEFAULT_SETTINGS.costDefaults.greetingCardPerLaunchUnitEur,
        samplesPerProductEur: DEFAULT_SETTINGS.costDefaults.samplesPerProductEur,
        toolingPerProductEur: DEFAULT_SETTINGS.costDefaults.toolingPerProductEur,
        certificatesPerProductEur: DEFAULT_SETTINGS.costDefaults.certificatesPerProductEur,
        inspectionPerProductEur: DEFAULT_SETTINGS.costDefaults.inspectionPerProductEur,
      },
    },
  };
}

function ensureCategoryDefaults(rawDefaults) {
  const base = deepClone(BASE_CATEGORY_DEFAULTS);
  const source = rawDefaults && typeof rawDefaults === "object" ? rawDefaults : {};

  Object.keys(base).forEach((key) => {
    const candidate = source[key] ?? {};
    base[key] = {
      ...base[key],
      ...candidate,
    };
    base[key].sellableShare = deriveSellableSharePct(
      base[key].sellableShare,
      base[key].unsellableShare,
      base[key].resaleRate,
      base[key].sellableShare,
    );
  });

  return base;
}

function ensureLifecycleSettings(rawLifecycle) {
  const base = deepClone(DEFAULT_SETTINGS.lifecycle);
  const source = rawLifecycle && typeof rawLifecycle === "object" ? rawLifecycle : {};

  base.defaultMonths = source.defaultMonths ?? base.defaultMonths;

  const packageKeys = Object.keys(base.listingPackages);
  packageKeys.forEach((key) => {
    base.listingPackages[key] = {
      ...base.listingPackages[key],
      ...(source.listingPackages?.[key] ?? {}),
    };
  });

  const profileKeys = Object.keys(base.launchProfiles);
  profileKeys.forEach((key) => {
    base.launchProfiles[key] = {
      ...base.launchProfiles[key],
      ...(source.launchProfiles?.[key] ?? {}),
    };
  });

  return base;
}

function ensureCostDefaults(rawCostDefaults) {
  return {
    ...deepClone(DEFAULT_SETTINGS.costDefaults),
    ...(rawCostDefaults && typeof rawCostDefaults === "object" ? rawCostDefaults : {}),
  };
}

function ensureTaxSettings(rawTax) {
  const source = rawTax && typeof rawTax === "object" ? rawTax : {};
  return {
    fallbackUsdToEur: clamp(num(source.fallbackUsdToEur, DEFAULT_USD_TO_EUR), 0.2, 2),
    customsDutyRatePct: clamp(num(source.customsDutyRatePct, GLOBAL_DEFAULTS.importCustomsDutyRate), 0, 40),
    vatRates: {
      DE: clamp(num(source?.vatRates?.DE, MARKETPLACE_VAT.DE), 0, 30),
      FR: clamp(num(source?.vatRates?.FR, MARKETPLACE_VAT.FR), 0, 30),
      IT: clamp(num(source?.vatRates?.IT, MARKETPLACE_VAT.IT), 0, 30),
      ES: clamp(num(source?.vatRates?.ES, MARKETPLACE_VAT.ES), 0, 30),
    },
  };
}

function ensureAmazonFbaSettings(rawAmazonFba) {
  const base = deepClone(DEFAULT_SETTINGS.amazonFba);
  const source = rawAmazonFba && typeof rawAmazonFba === "object" ? rawAmazonFba : {};
  const deSource = source.de && typeof source.de === "object" ? source.de : {};
  return {
    ...base,
    ...source,
    de: {
      ...base.de,
      ...deSource,
    },
  };
}

function ensureThreePlSettings(rawThreePl, rawCostDefaults) {
  const source = rawThreePl && typeof rawThreePl === "object" ? rawThreePl : {};
  const legacy = rawCostDefaults && typeof rawCostDefaults === "object" ? rawCostDefaults : {};

  return {
    ...deepClone(DEFAULT_SETTINGS.threePl),
    ...source,
    receivingPerCartonSortedEur:
      source.receivingPerCartonSortedEur ?? legacy.threePlInboundPerCartonEur ?? DEFAULT_SETTINGS.threePl.receivingPerCartonSortedEur,
    storagePerPalletPerMonthEur:
      source.storagePerPalletPerMonthEur ?? legacy.threePlStoragePerPalletMonthEur ?? DEFAULT_SETTINGS.threePl.storagePerPalletPerMonthEur,
    carrierCostPerCartonEur:
      source.carrierCostPerCartonEur ?? legacy.threePlOutboundPerCartonEur ?? DEFAULT_SETTINGS.threePl.carrierCostPerCartonEur,
    unitsPerPallet:
      source.unitsPerPallet ?? legacy.unitsPerPallet ?? DEFAULT_SETTINGS.threePl.unitsPerPallet,
    avgStorageMonths:
      source.avgStorageMonths ?? legacy.avg3PlStorageMonths ?? DEFAULT_SETTINGS.threePl.avgStorageMonths,
  };
}

function ensureShipping12mSettings(rawShipping12m) {
  const base = deepClone(DEFAULT_SETTINGS.shipping12m);
  const source = rawShipping12m && typeof rawShipping12m === "object" ? rawShipping12m : {};
  const merged = {
    ...base,
    ...source,
    modes: {
      sea_lcl: {
        ...base.modes.sea_lcl,
        ...(source?.modes?.sea_lcl ?? {}),
      },
      rail: {
        ...base.modes.rail,
        ...(source?.modes?.rail ?? {}),
      },
    },
    insurance: {
      ...base.insurance,
      ...(source?.insurance ?? {}),
    },
  };

  const legacySeaRate = source.lclRateEurPerCbm;
  const legacySeaOrigin = source.originFixedEurPerShipment;
  const legacySeaDestination = source.destinationFixedEurPerShipment;
  const legacySeaOncarriage = source.deOncarriageFixedEurPerShipment;

  if (legacySeaRate !== undefined) {
    merged.modes.sea_lcl.rateEurPerCbm = legacySeaRate;
  }
  if (legacySeaOrigin !== undefined) {
    merged.modes.sea_lcl.originFixedEurPerShipment = legacySeaOrigin;
  }
  if (legacySeaDestination !== undefined) {
    merged.modes.sea_lcl.destinationFixedEurPerShipment = legacySeaDestination;
  }
  if (legacySeaOncarriage !== undefined) {
    merged.modes.sea_lcl.deOncarriageFixedEurPerShipment = legacySeaOncarriage;
  }
  if (
    source?.modes?.rail?.mainRunFixedEurPerShipment === undefined &&
    source?.modes?.rail?.destinationFixedEurPerShipment !== undefined
  ) {
    merged.modes.rail.mainRunFixedEurPerShipment = source.modes.rail.destinationFixedEurPerShipment;
  }
  if (merged.modes.rail.mainRunFixedEurPerShipment === undefined) {
    merged.modes.rail.mainRunFixedEurPerShipment = merged.modes.rail.destinationFixedEurPerShipment;
  }
  if (
    source?.modes?.rail?.originBaseEurPerShipment === undefined &&
    source?.modes?.rail?.originFixedEurPerShipment !== undefined
  ) {
    merged.modes.rail.originBaseEurPerShipment = source.modes.rail.originFixedEurPerShipment;
  }
  if (
    source?.modes?.rail?.deOncarriageBaseEurPerShipment === undefined &&
    source?.modes?.rail?.deOncarriageFixedEurPerShipment !== undefined
  ) {
    merged.modes.rail.deOncarriageBaseEurPerShipment = source.modes.rail.deOncarriageFixedEurPerShipment;
  }
  if (merged.modes.rail.originFixedEurPerShipment === undefined) {
    merged.modes.rail.originFixedEurPerShipment = merged.modes.rail.originBaseEurPerShipment;
  }
  if (merged.modes.rail.destinationFixedEurPerShipment === undefined) {
    merged.modes.rail.destinationFixedEurPerShipment = merged.modes.rail.mainRunFixedEurPerShipment;
  }
  if (merged.modes.rail.deOncarriageFixedEurPerShipment === undefined) {
    merged.modes.rail.deOncarriageFixedEurPerShipment = merged.modes.rail.deOncarriageBaseEurPerShipment;
  }
  if (
    source?.modes?.rail?.originPerCbmEur === undefined &&
    source?.modes?.rail?.originPerCartonEur !== undefined
  ) {
    merged.modes.rail.originPerCbmEur = num(source.modes.rail.originPerCartonEur, 0) / LEGACY_RAIL_CARTON_EQUIVALENT_CBM;
  }
  if (
    source?.modes?.rail?.deOncarriagePerCbmEur === undefined &&
    source?.modes?.rail?.deOncarriagePerCartonEur !== undefined
  ) {
    merged.modes.rail.deOncarriagePerCbmEur = num(source.modes.rail.deOncarriagePerCartonEur, 0) / LEGACY_RAIL_CARTON_EQUIVALENT_CBM;
  }
  if (merged.modes.rail.originPerCbmEur === undefined) {
    merged.modes.rail.originPerCbmEur =
      num(merged.modes.rail.originPerCartonEur, 0) / LEGACY_RAIL_CARTON_EQUIVALENT_CBM;
  }
  if (merged.modes.rail.deOncarriagePerCbmEur === undefined) {
    merged.modes.rail.deOncarriagePerCbmEur =
      num(merged.modes.rail.deOncarriagePerCartonEur, 0) / LEGACY_RAIL_CARTON_EQUIVALENT_CBM;
  }
  if (merged.manualSurchargeEnabled === undefined) {
    merged.manualSurchargeEnabled = base.manualSurchargeEnabled;
  }
  if (merged.manualSurchargeEurPerShipment === undefined) {
    merged.manualSurchargeEurPerShipment = base.manualSurchargeEurPerShipment;
  }

  return merged;
}

function applyRailFortoV2Defaults(settings) {
  settings.shipping12m.modes.rail.rateEurPerCbm = RAIL_FORTO_V2_DEFAULTS.rateEurPerCbm;
  settings.shipping12m.modes.rail.originFixedEurPerShipment = RAIL_FORTO_V2_DEFAULTS.originFixedEurPerShipment;
  settings.shipping12m.modes.rail.mainRunFixedEurPerShipment = RAIL_FORTO_V2_DEFAULTS.mainRunFixedEurPerShipment;
  settings.shipping12m.modes.rail.destinationFixedEurPerShipment = RAIL_FORTO_V2_DEFAULTS.mainRunFixedEurPerShipment;
  settings.shipping12m.modes.rail.deOncarriageFixedEurPerShipment = RAIL_FORTO_V2_DEFAULTS.deOncarriageFixedEurPerShipment;
  settings.shipping12m.customsBrokerEnabled = true;
  settings.shipping12m.customsBrokerFixedEurPerShipment = RAIL_FORTO_V2_DEFAULTS.customsBrokerFixedEurPerShipment;
  settings.shipping12m.insurance.enabled = true;
  settings.shipping12m.insurance.basis = "goods_value_eur";
  settings.shipping12m.insurance.ratePct = RAIL_FORTO_V2_DEFAULTS.insuranceRatePct;
}

function applyRailShippingV3Defaults(settings) {
  settings.shipping12m.modes.rail.rateEurPerCbm = RAIL_SHIPPING_V3_DEFAULTS.rateEurPerCbm;
  settings.shipping12m.modes.rail.originBaseEurPerShipment = RAIL_SHIPPING_V3_DEFAULTS.originBaseEurPerShipment;
  settings.shipping12m.modes.rail.originPerCbmEur = RAIL_SHIPPING_V3_DEFAULTS.originPerCbmEur;
  settings.shipping12m.modes.rail.originPerCartonEur = RAIL_SHIPPING_V3_DEFAULTS.originPerCartonEur;
  settings.shipping12m.modes.rail.mainRunFixedEurPerShipment = RAIL_SHIPPING_V3_DEFAULTS.mainRunFixedEurPerShipment;
  settings.shipping12m.modes.rail.deOncarriageBaseEurPerShipment = RAIL_SHIPPING_V3_DEFAULTS.deOncarriageBaseEurPerShipment;
  settings.shipping12m.modes.rail.deOncarriagePerCbmEur = RAIL_SHIPPING_V3_DEFAULTS.deOncarriagePerCbmEur;
  settings.shipping12m.modes.rail.deOncarriagePerCartonEur = RAIL_SHIPPING_V3_DEFAULTS.deOncarriagePerCartonEur;

  // Legacy-Felder bleiben für Bestandsdaten/alte Treiberpfade lesbar.
  settings.shipping12m.modes.rail.originFixedEurPerShipment = RAIL_SHIPPING_V3_DEFAULTS.originBaseEurPerShipment;
  settings.shipping12m.modes.rail.destinationFixedEurPerShipment = RAIL_SHIPPING_V3_DEFAULTS.mainRunFixedEurPerShipment;
  settings.shipping12m.modes.rail.deOncarriageFixedEurPerShipment = RAIL_SHIPPING_V3_DEFAULTS.deOncarriageBaseEurPerShipment;

  settings.shipping12m.customsBrokerEnabled = true;
  settings.shipping12m.customsBrokerFixedEurPerShipment = RAIL_SHIPPING_V3_DEFAULTS.customsBrokerFixedEurPerShipment;
  settings.shipping12m.insurance.enabled = true;
  settings.shipping12m.insurance.basis = "goods_value_eur";
  settings.shipping12m.insurance.ratePct = RAIL_SHIPPING_V3_DEFAULTS.insuranceRatePct;

  settings.shipping12m.manualSurchargeEnabled = RAIL_SHIPPING_V3_DEFAULTS.manualSurchargeEnabled;
  settings.shipping12m.manualSurchargeEurPerShipment = RAIL_SHIPPING_V3_DEFAULTS.manualSurchargeEurPerShipment;
}

function isNearlyEqual(value, expected, epsilon = 0.01) {
  return Math.abs(num(value, 0) - expected) <= epsilon;
}

function isLegacyRailBalancedSignature(settings) {
  const rail = settings?.shipping12m?.modes?.rail ?? {};
  return (
    isNearlyEqual(rail.rateEurPerCbm, RAIL_BALANCED_V1_DEFAULTS.rateEurPerCbm) &&
    isNearlyEqual(rail.originFixedEurPerShipment, RAIL_BALANCED_V1_DEFAULTS.originFixedEurPerShipment) &&
    isNearlyEqual(rail.destinationFixedEurPerShipment, RAIL_BALANCED_V1_DEFAULTS.destinationFixedEurPerShipment) &&
    isNearlyEqual(rail.deOncarriageFixedEurPerShipment, RAIL_BALANCED_V1_DEFAULTS.deOncarriageFixedEurPerShipment) &&
    isNearlyEqual(settings?.shipping12m?.customsBrokerFixedEurPerShipment, RAIL_BALANCED_V1_DEFAULTS.customsBrokerFixedEurPerShipment)
  );
}

function migrateRailDefaultsV2(settings, parsedSettings) {
  const rawVersion = num(parsedSettings?.meta?.railDefaultsVersion, 0);
  if (rawVersion >= 2) {
    if (!settings.meta || typeof settings.meta !== "object") {
      settings.meta = {};
    }
    settings.meta.railDefaultsVersion = 2;
    return false;
  }

  if (!settings.meta || typeof settings.meta !== "object") {
    settings.meta = {};
  }
  if (isLegacyRailBalancedSignature(settings)) {
    applyRailFortoV2Defaults(settings);
  }
  settings.meta.railDefaultsVersion = 2;
  return true;
}

function migrateRailShippingModelV3(settings, parsedSettings) {
  const rawVersion = num(parsedSettings?.meta?.railShippingModelVersion, 0);
  if (!settings.meta || typeof settings.meta !== "object") {
    settings.meta = {};
  }
  if (rawVersion >= 3) {
    settings.meta.railShippingModelVersion = 3;
    return false;
  }
  applyRailShippingV3Defaults(settings);
  settings.meta.railShippingModelVersion = 3;
  return true;
}

function applyCartonPreset(preset, settings) {
  const chosen = CARTON_PRESETS[preset];
  if (!chosen) {
    return;
  }
  settings.cartonRules.preset = preset;
  settings.cartonRules.maxLengthCm = chosen.maxLengthCm;
  settings.cartonRules.maxWidthCm = chosen.maxWidthCm;
  settings.cartonRules.maxHeightCm = chosen.maxHeightCm;
  settings.cartonRules.maxWeightKg = chosen.maxWeightKg;
}

function sanitizeSettings(settings) {
  settings.shipping12m = ensureShipping12mSettings(settings.shipping12m);
  settings.amazonFba = ensureAmazonFbaSettings(settings.amazonFba);

  settings.tax.fallbackUsdToEur = clamp(num(settings.tax.fallbackUsdToEur, DEFAULT_USD_TO_EUR), 0.2, 2);
  settings.tax.customsDutyRatePct = clamp(num(settings.tax.customsDutyRatePct, GLOBAL_DEFAULTS.importCustomsDutyRate), 0, 40);
  settings.tax.vatRates.DE = clamp(num(settings.tax.vatRates.DE, MARKETPLACE_VAT.DE), 0, 30);
  settings.tax.vatRates.FR = clamp(num(settings.tax.vatRates.FR, MARKETPLACE_VAT.FR), 0, 30);
  settings.tax.vatRates.IT = clamp(num(settings.tax.vatRates.IT, MARKETPLACE_VAT.IT), 0, 30);
  settings.tax.vatRates.ES = clamp(num(settings.tax.vatRates.ES, MARKETPLACE_VAT.ES), 0, 30);

  settings.shipping12m.modes.sea_lcl.rateEurPerCbm = clamp(num(settings.shipping12m.modes.sea_lcl.rateEurPerCbm, 0), 0, 2000);
  settings.shipping12m.modes.sea_lcl.originFixedEurPerShipment = clamp(
    num(settings.shipping12m.modes.sea_lcl.originFixedEurPerShipment, 0),
    0,
    5000,
  );
  settings.shipping12m.modes.sea_lcl.destinationFixedEurPerShipment = clamp(
    num(settings.shipping12m.modes.sea_lcl.destinationFixedEurPerShipment, 0),
    0,
    5000,
  );
  settings.shipping12m.modes.sea_lcl.deOncarriageFixedEurPerShipment = clamp(
    num(settings.shipping12m.modes.sea_lcl.deOncarriageFixedEurPerShipment, 0),
    0,
    5000,
  );
  settings.shipping12m.modes.rail.rateEurPerCbm = clamp(num(settings.shipping12m.modes.rail.rateEurPerCbm, 0), 0, 2000);
  settings.shipping12m.modes.rail.originBaseEurPerShipment = clamp(
    num(settings.shipping12m.modes.rail.originBaseEurPerShipment, settings.shipping12m.modes.rail.originFixedEurPerShipment),
    0,
    5000,
  );
  settings.shipping12m.modes.rail.originPerCartonEur = clamp(
    num(settings.shipping12m.modes.rail.originPerCartonEur, 0),
    0,
    200,
  );
  settings.shipping12m.modes.rail.originPerCbmEur = clamp(
    num(
      settings.shipping12m.modes.rail.originPerCbmEur,
      num(settings.shipping12m.modes.rail.originPerCartonEur, 0) / LEGACY_RAIL_CARTON_EQUIVALENT_CBM,
    ),
    0,
    500,
  );
  settings.shipping12m.modes.rail.mainRunFixedEurPerShipment = clamp(
    num(
      settings.shipping12m.modes.rail.mainRunFixedEurPerShipment,
      settings.shipping12m.modes.rail.destinationFixedEurPerShipment,
    ),
    0,
    5000,
  );
  settings.shipping12m.modes.rail.deOncarriageBaseEurPerShipment = clamp(
    num(
      settings.shipping12m.modes.rail.deOncarriageBaseEurPerShipment,
      settings.shipping12m.modes.rail.deOncarriageFixedEurPerShipment,
    ),
    0,
    5000,
  );
  settings.shipping12m.modes.rail.deOncarriagePerCartonEur = clamp(
    num(settings.shipping12m.modes.rail.deOncarriagePerCartonEur, 0),
    0,
    200,
  );
  settings.shipping12m.modes.rail.deOncarriagePerCbmEur = clamp(
    num(
      settings.shipping12m.modes.rail.deOncarriagePerCbmEur,
      num(settings.shipping12m.modes.rail.deOncarriagePerCartonEur, 0) / LEGACY_RAIL_CARTON_EQUIVALENT_CBM,
    ),
    0,
    500,
  );
  settings.shipping12m.modes.rail.originFixedEurPerShipment = clamp(
    num(settings.shipping12m.modes.rail.originFixedEurPerShipment, settings.shipping12m.modes.rail.originBaseEurPerShipment),
    0,
    5000,
  );
  settings.shipping12m.modes.rail.destinationFixedEurPerShipment = clamp(
    num(settings.shipping12m.modes.rail.destinationFixedEurPerShipment, settings.shipping12m.modes.rail.mainRunFixedEurPerShipment),
    0,
    5000,
  );
  settings.shipping12m.modes.rail.deOncarriageFixedEurPerShipment = clamp(
    num(settings.shipping12m.modes.rail.deOncarriageFixedEurPerShipment, settings.shipping12m.modes.rail.deOncarriageBaseEurPerShipment),
    0,
    5000,
  );
  settings.shipping12m.manualSurchargeEnabled = Boolean(settings.shipping12m.manualSurchargeEnabled);
  settings.shipping12m.manualSurchargeEurPerShipment = clamp(num(settings.shipping12m.manualSurchargeEurPerShipment, 0), 0, 5000);
  settings.shipping12m.customsBrokerFixedEurPerShipment = clamp(num(settings.shipping12m.customsBrokerFixedEurPerShipment, 0), 0, 5000);
  settings.shipping12m.customsBrokerEnabled = Boolean(settings.shipping12m.customsBrokerEnabled);
  settings.shipping12m.insurance.enabled = Boolean(settings.shipping12m.insurance?.enabled);
  settings.shipping12m.insurance.basis = settings.shipping12m.insurance?.basis === "goods_value_eur"
    ? "goods_value_eur"
    : "goods_value_eur";
  settings.shipping12m.insurance.ratePct = clamp(num(settings.shipping12m.insurance?.ratePct, 0), 0, 20);

  settings.amazonFba.de.rateCardVersion = AMAZON_FBA_DE_RATECARD_VERSION;
  const sourceUrl = String(settings.amazonFba?.de?.sourceUrl ?? "").trim();
  settings.amazonFba.de.sourceUrl = sourceUrl || AMAZON_FBA_DE_RATECARD_DEFAULT_URL;
  settings.amazonFba.de.volumetricDivisor = clamp(
    num(settings.amazonFba?.de?.volumetricDivisor, AMAZON_FBA_DE_DEFAULT_VOLUMETRIC_DIVISOR),
    3000,
    10000,
  );

  settings.cartonRules.maxLengthCm = clamp(num(settings.cartonRules.maxLengthCm, 63.5), 1, 200);
  settings.cartonRules.maxWidthCm = clamp(num(settings.cartonRules.maxWidthCm, 63.5), 1, 200);
  settings.cartonRules.maxHeightCm = clamp(num(settings.cartonRules.maxHeightCm, 63.5), 1, 200);
  settings.cartonRules.maxWeightKg = clamp(num(settings.cartonRules.maxWeightKg, 23), 1, 80);
  settings.cartonRules.packFactor = clamp(num(settings.cartonRules.packFactor, 0.85), 0.5, 0.99);
  if (!["conservative", "balanced", "maximal"].includes(settings.cartonRules.estimationMode)) {
    settings.cartonRules.estimationMode = "conservative";
  }
  settings.cartonRules.supplierSoftMaxLengthCm = clamp(num(settings.cartonRules.supplierSoftMaxLengthCm, 40), 1, 200);
  settings.cartonRules.supplierSoftMaxWidthCm = clamp(num(settings.cartonRules.supplierSoftMaxWidthCm, 40), 1, 200);
  settings.cartonRules.supplierSoftMaxHeightCm = clamp(num(settings.cartonRules.supplierSoftMaxHeightCm, 35), 1, 200);
  settings.cartonRules.supplierSoftMaxGrossWeightKg = clamp(num(settings.cartonRules.supplierSoftMaxGrossWeightKg, 18), 1, 80);
  settings.cartonRules.outerBufferCm = clamp(num(settings.cartonRules.outerBufferCm, 1.5), 0, 20);
  settings.cartonRules.grossWeightUpliftPct = clamp(num(settings.cartonRules.grossWeightUpliftPct, 5), 0, 50);
  settings.cartonRules.equivalentCartonFillPct = clamp(num(settings.cartonRules.equivalentCartonFillPct, 90), 50, 100);

  const preset = settings.cartonRules.preset;
  if (!["legacy", "update_2025", "custom"].includes(preset)) {
    settings.cartonRules.preset = "custom";
  }

  Object.keys(settings.categoryDefaults).forEach((key) => {
    const item = settings.categoryDefaults[key];
    item.label = String(item.label ?? BASE_CATEGORY_DEFAULTS[key]?.label ?? key);
    item.referralRate = clamp(num(item.referralRate, 15), 0, 25);
    item.tacosRate = clamp(num(item.tacosRate, 12), 0, 100);
    item.returnRate = clamp(num(item.returnRate, 7), 0, 100);
    item.sellableShare = deriveSellableSharePct(
      item.sellableShare,
      item.unsellableShare,
      item.resaleRate,
      BASE_CATEGORY_DEFAULTS[key]?.sellableShare ?? 42,
    );
    const unsellableDerived = clamp(100 - item.sellableShare, 0, 100);
    // Legacy-Felder bleiben lesbar, aber fachlich inaktiv.
    item.resaleRate = clamp(num(item.resaleRate, item.sellableShare), 0, 100);
    item.unsellableShare = clamp(num(item.unsellableShare, unsellableDerived), 0, 100);
    item.targetMarginPct = clamp(num(item.targetMarginPct, 15), 0, 50);
  });

  settings.lifecycle.defaultMonths = clamp(roundInt(settings.lifecycle.defaultMonths, 36), 1, 120);

  Object.keys(settings.lifecycle.listingPackages).forEach((key) => {
    const pack = settings.lifecycle.listingPackages[key];
    pack.listingCreationEur = clamp(num(pack.listingCreationEur, 0), 0, 20000);
    pack.imagesInfographicsEur = clamp(num(pack.imagesInfographicsEur, 0), 0, 20000);
    pack.aPlusContentEur = clamp(num(pack.aPlusContentEur, 0), 0, 20000);
  });

  Object.keys(settings.lifecycle.launchProfiles).forEach((key) => {
    const profile = settings.lifecycle.launchProfiles[key];
    profile.weeks = clamp(num(profile.weeks, 6), 1, 24);
    profile.startTacosBoostPct = clamp(num(profile.startTacosBoostPct, 0), 0, 300);
    profile.endTacosBoostPct = clamp(num(profile.endTacosBoostPct, 0), 0, 300);
    profile.startPriceDiscountPct = clamp(num(profile.startPriceDiscountPct, 0), 0, 60);
  });

  settings.threePl.receivingPerCartonSortedEur = clamp(num(settings.threePl.receivingPerCartonSortedEur, 0), 0, 200);
  settings.threePl.receivingPerCartonMixedEur = clamp(num(settings.threePl.receivingPerCartonMixedEur, 0), 0, 200);
  settings.threePl.storagePerPalletPerMonthEur = clamp(num(settings.threePl.storagePerPalletPerMonthEur, 0), 0, 1000);
  settings.threePl.unitsPerPallet = clamp(roundInt(settings.threePl.unitsPerPallet, 240), 1, 10000);
  settings.threePl.avgStorageMonths = clamp(num(settings.threePl.avgStorageMonths, 1.2), 0, 24);
  settings.threePl.outboundBasePerCartonEur = clamp(num(settings.threePl.outboundBasePerCartonEur, 0), 0, 200);
  settings.threePl.pickPackPerCartonEur = clamp(num(settings.threePl.pickPackPerCartonEur, 0), 0, 200);
  settings.threePl.fbaProcessingPerCartonEur = clamp(num(settings.threePl.fbaProcessingPerCartonEur, 0), 0, 200);
  settings.threePl.insertPerInsertEur = clamp(num(settings.threePl.insertPerInsertEur, 0), 0, 50);
  settings.threePl.thirdCountryLabelPerLabelEur = clamp(num(settings.threePl.thirdCountryLabelPerLabelEur, 0), 0, 50);
  settings.threePl.insertsPerCartonDefault = clamp(roundInt(settings.threePl.insertsPerCartonDefault, 1), 0, 20);
  settings.threePl.labelsPerCartonDefault = clamp(roundInt(settings.threePl.labelsPerCartonDefault, 0), 0, 20);
  settings.threePl.carrierCostPerCartonEur = clamp(num(settings.threePl.carrierCostPerCartonEur, 0), 0, 200);
  settings.threePl.shelfMPerMonthEur = clamp(num(settings.threePl.shelfMPerMonthEur, 0), 0, 200);
  settings.threePl.shelfLPerMonthEur = clamp(num(settings.threePl.shelfLPerMonthEur, 0), 0, 200);

  settings.costDefaults.packagingPerUnitEur = clamp(num(settings.costDefaults.packagingPerUnitEur, 0), 0, 50);
  settings.costDefaults.otherUnitCostEur = clamp(num(settings.costDefaults.otherUnitCostEur, 0), 0, 50);
  settings.costDefaults.docsPerOrderEur = clamp(num(settings.costDefaults.docsPerOrderEur, 0), 0, 5000);
  settings.costDefaults.freightPapersPerOrderEur = clamp(num(settings.costDefaults.freightPapersPerOrderEur, 0), 0, 5000);
  settings.costDefaults.amazonStoragePerCbmMonthEur = clamp(num(settings.costDefaults.amazonStoragePerCbmMonthEur, 0), 0, 1000);
  settings.costDefaults.avgAmazonStorageMonths = clamp(num(settings.costDefaults.avgAmazonStorageMonths, 1.5), 0, 12);
  settings.costDefaults.leakageRatePct = clamp(num(settings.costDefaults.leakageRatePct, 3), 0, 20);
  settings.costDefaults.greetingCardPerLaunchUnitEur = clamp(num(settings.costDefaults.greetingCardPerLaunchUnitEur, 0), 0, 20);
  settings.costDefaults.samplesPerProductEur = clamp(num(settings.costDefaults.samplesPerProductEur, 0), 0, 10000);
  settings.costDefaults.toolingPerProductEur = clamp(num(settings.costDefaults.toolingPerProductEur, 0), 0, 50000);
  settings.costDefaults.certificatesPerProductEur = clamp(num(settings.costDefaults.certificatesPerProductEur, 0), 0, 10000);
  settings.costDefaults.inspectionPerProductEur = clamp(num(settings.costDefaults.inspectionPerProductEur, 0), 0, 10000);

  if (!settings.meta || typeof settings.meta !== "object") {
    settings.meta = {};
  }
  settings.meta.railDefaultsVersion = Math.max(0, roundInt(settings.meta.railDefaultsVersion, 0));
  settings.meta.railShippingModelVersion = Math.max(0, roundInt(settings.meta.railShippingModelVersion, 0));

  return settings;
}

function defaultSettings() {
  return sanitizeSettings(deepClone(DEFAULT_SETTINGS));
}

function migrateProduct(raw, index) {
  const base = defaultProduct(index + 1);
  if (!raw || typeof raw !== "object") {
    return base;
  }

  const merged = {
    ...base,
    ...raw,
    id: raw.id || uid(),
    workflow: {
      ...base.workflow,
      ...(raw.workflow ?? {}),
      validation: {
        ...(base.workflow.validation ?? {}),
        ...(raw.workflow?.validation ?? {}),
      },
      review: {
        ...(base.workflow.review ?? {}),
        ...(raw.workflow?.review ?? {}),
        validation: {
          ...((base.workflow.review ?? {}).validation ?? {}),
          ...((raw.workflow?.review ?? {}).validation ?? {}),
        },
        deep_dive: {
          ...((base.workflow.review ?? {}).deep_dive ?? {}),
          ...((raw.workflow?.review ?? {}).deep_dive ?? {}),
        },
      },
      deepDive: { ...base.workflow.deepDive, ...(raw.workflow?.deepDive ?? {}) },
    },
    basic: {
      ...base.basic,
      ...(raw.basic ?? {}),
    },
    assumptions: {
      ...base.assumptions,
      ...(raw.assumptions ?? {}),
      ads: { ...base.assumptions.ads, ...(raw.assumptions?.ads ?? {}) },
      returns: { ...base.assumptions.returns, ...(raw.assumptions?.returns ?? {}) },
      leakage: { ...base.assumptions.leakage, ...(raw.assumptions?.leakage ?? {}) },
      import: { ...base.assumptions.import, ...(raw.assumptions?.import ?? {}) },
      amazon: { ...base.assumptions.amazon, ...(raw.assumptions?.amazon ?? {}) },
      lifecycle: { ...base.assumptions.lifecycle, ...(raw.assumptions?.lifecycle ?? {}) },
      launchSplit: { ...base.assumptions.launchSplit, ...(raw.assumptions?.launchSplit ?? {}) },
      cartonization: { ...base.assumptions.cartonization, ...(raw.assumptions?.cartonization ?? {}) },
      localSettingOverrides: {
        ...(base.assumptions.localSettingOverrides ?? {}),
        ...(raw.assumptions?.localSettingOverrides ?? {}),
      },
      extraCosts: { ...base.assumptions.extraCosts, ...(raw.assumptions?.extraCosts ?? {}) },
    },
  };

  const rawExtra = raw?.assumptions?.extraCosts ?? {};
  const mergedExtra = merged.assumptions.extraCosts;
  if (rawExtra.threePlInboundPerCartonEur !== undefined && rawExtra.receivingPerCartonSortedEur === undefined) {
    mergedExtra.receivingPerCartonSortedEur = num(rawExtra.threePlInboundPerCartonEur, mergedExtra.receivingPerCartonSortedEur);
  }
  if (rawExtra.threePlStoragePerPalletMonthEur !== undefined && rawExtra.storagePerPalletPerMonthEur === undefined) {
    mergedExtra.storagePerPalletPerMonthEur = num(rawExtra.threePlStoragePerPalletMonthEur, mergedExtra.storagePerPalletPerMonthEur);
  }
  if (rawExtra.threePlOutboundPerCartonEur !== undefined && rawExtra.carrierCostPerCartonEur === undefined) {
    mergedExtra.carrierCostPerCartonEur = num(rawExtra.threePlOutboundPerCartonEur, mergedExtra.carrierCostPerCartonEur);
  }
  if (!["sorted", "mixed"].includes(mergedExtra.receivingMode)) {
    mergedExtra.receivingMode = "sorted";
  }

  if (!Number.isFinite(num(merged.basic.unitsPerOrder, NaN))) {
    const oldUnitsPerCarton = num(raw?.basic?.unitsPerCarton, 0);
    merged.basic.unitsPerOrder = oldUnitsPerCarton > 0 ? oldUnitsPerCarton * 50 : base.basic.unitsPerOrder;
  }

  const rawTransportMode = raw?.basic?.transportMode;
  if (rawTransportMode === undefined || rawTransportMode === null || rawTransportMode === "") {
    merged.basic.transportMode = "sea_lcl";
  } else if (merged.basic.transportMode === "sea") {
    merged.basic.transportMode = "sea_lcl";
  }
  if (!["sea_lcl", "rail"].includes(merged.basic.transportMode)) {
    merged.basic.transportMode = "sea_lcl";
  }
  if (!["ai", "photographer", "visual_advantage"].includes(merged.basic.listingPackage)) {
    merged.basic.listingPackage = "ai";
  }
  if (!["low", "medium", "high"].includes(merged.basic.launchCompetition)) {
    merged.basic.launchCompetition = "medium";
  }
  merged.assumptions.cartonization.manualEnabled = Boolean(merged.assumptions.cartonization.manualEnabled);
  merged.assumptions.cartonization.unitsPerCarton = Math.max(
    1,
    roundInt(merged.assumptions.cartonization.unitsPerCarton, base.assumptions.cartonization.unitsPerCarton),
  );
  merged.assumptions.cartonization.cartonLengthCm = Math.max(0, num(merged.assumptions.cartonization.cartonLengthCm, 0));
  merged.assumptions.cartonization.cartonWidthCm = Math.max(0, num(merged.assumptions.cartonization.cartonWidthCm, 0));
  merged.assumptions.cartonization.cartonHeightCm = Math.max(0, num(merged.assumptions.cartonization.cartonHeightCm, 0));
  merged.assumptions.cartonization.cartonGrossWeightKg = Math.max(0, num(merged.assumptions.cartonization.cartonGrossWeightKg, 0));

  const categoryKey = merged.basic.category in BASE_CATEGORY_DEFAULTS ? merged.basic.category : "generic";
  const categorySellableFallback = BASE_CATEGORY_DEFAULTS[categoryKey]?.sellableShare ?? 42;
  merged.assumptions.returns.overrideSellableShare = Boolean(merged.assumptions.returns.overrideSellableShare);
  merged.assumptions.returns.sellableShare = deriveSellableSharePct(
    merged.assumptions.returns.sellableShare,
    merged.assumptions.returns.unsellableShare,
    merged.assumptions.returns.resaleRate,
    categorySellableFallback,
  );
  if (
    !merged.assumptions.returns.overrideSellableShare &&
    (merged.assumptions.returns.overrideUnsellableShare || merged.assumptions.returns.overrideResaleRate)
  ) {
    merged.assumptions.returns.overrideSellableShare = true;
  }
  // Legacy-Felder bleiben lesbar, aber fachlich inaktiv.
  merged.assumptions.returns.resaleRate = clamp(
    num(merged.assumptions.returns.resaleRate, merged.assumptions.returns.sellableShare),
    0,
    100,
  );
  merged.assumptions.returns.unsellableShare = clamp(
    num(merged.assumptions.returns.unsellableShare, 100 - merged.assumptions.returns.sellableShare),
    0,
    100,
  );

  merged.basic.horizonMonths = clamp(roundInt(merged.basic.horizonMonths, base.basic.horizonMonths), 1, 36);
  merged.basic.unitsPerOrder = Math.max(1, roundInt(merged.basic.unitsPerOrder, base.basic.unitsPerOrder));
  merged.basic.netWeightG = Math.max(0, num(merged.basic.netWeightG, base.basic.netWeightG));
  if (!merged.workflow.validation || typeof merged.workflow.validation !== "object") {
    merged.workflow.validation = { ...base.workflow.validation };
  }
  if (!Array.isArray(merged.workflow.validation.checkedBlockIds)) {
    merged.workflow.validation.checkedBlockIds = [];
  }
  merged.workflow.validation.checkedBlockIds = [...new Set(
    merged.workflow.validation.checkedBlockIds
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean),
  )];
  merged.workflow.validation.coverageTargetPct = clamp(
    num(merged.workflow.validation.coverageTargetPct, VALIDATION_COVERAGE_TARGET_DEFAULT),
    80,
    99,
  );
  merged.workflow.validation.lastAppliedAt =
    merged.workflow.validation.lastAppliedAt ? String(merged.workflow.validation.lastAppliedAt) : null;
  if (!WORKFLOW_STAGES.includes(merged.workflow.stage)) {
    merged.workflow.stage = "quick";
  }
  if (merged.workflow.stage === "deep_dive") {
    merged.workflow.stage = "validation";
  }
  if (!merged.workflow.review || typeof merged.workflow.review !== "object") {
    merged.workflow.review = { validation: {}, deep_dive: {} };
  }
  if (!merged.workflow.review.validation || typeof merged.workflow.review.validation !== "object") {
    merged.workflow.review.validation = {};
  }
  if (!merged.workflow.review.deep_dive || typeof merged.workflow.review.deep_dive !== "object") {
    merged.workflow.review.deep_dive = {};
  }
  const normalizeReviewBucket = (bucket) => {
    if (Array.isArray(bucket)) {
      return bucket.reduce((acc, entry) => {
        if (!entry || typeof entry !== "object" || !entry.targetId) {
          return acc;
        }
        acc[entry.targetId] = {
          targetId: String(entry.targetId),
          status: ["pending", "checked", "overridden"].includes(entry.status) ? entry.status : "pending",
          lastValue: num(entry.lastValue, 0),
          updatedAt: entry.updatedAt ?? null,
        };
        return acc;
      }, {});
    }
    if (!bucket || typeof bucket !== "object") {
      return {};
    }
    return Object.entries(bucket).reduce((acc, [key, entry]) => {
      const targetId = String(entry?.targetId ?? key);
      acc[targetId] = {
        targetId,
        status: ["pending", "checked", "overridden"].includes(entry?.status) ? entry.status : "pending",
        lastValue: num(entry?.lastValue, 0),
        updatedAt: entry?.updatedAt ?? null,
      };
      return acc;
    }, {});
  };
  merged.workflow.review.validation = normalizeReviewBucket(merged.workflow.review.validation);
  merged.workflow.review.deep_dive = normalizeReviewBucket(merged.workflow.review.deep_dive);

  return merged;
}

function loadSettingsLocal() {
  const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (!raw) {
    state.settings = defaultSettings();
    state.fx.usdToEur = state.settings.tax.fallbackUsdToEur;
    state.fx.source = "Fallback (Settings)";
    saveSettingsLocal();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const merged = {
      ...defaultSettings(),
      ...parsed,
      tax: ensureTaxSettings(parsed?.tax),
      shipping12m: ensureShipping12mSettings(parsed?.shipping12m),
      amazonFba: ensureAmazonFbaSettings(parsed?.amazonFba),
      cartonRules: {
        ...defaultSettings().cartonRules,
        ...(parsed?.cartonRules ?? {}),
      },
      categoryDefaults: ensureCategoryDefaults(parsed?.categoryDefaults),
      lifecycle: ensureLifecycleSettings(parsed?.lifecycle),
      threePl: ensureThreePlSettings(parsed?.threePl, parsed?.costDefaults),
      costDefaults: ensureCostDefaults(parsed?.costDefaults),
    };
    state.settings = sanitizeSettings(merged);
    const migratedV2 = migrateRailDefaultsV2(state.settings, parsed);
    const migratedV3 = migrateRailShippingModelV3(state.settings, parsed);
    if (migratedV2 || migratedV3) {
      state.settings = sanitizeSettings(state.settings);
      saveSettingsLocal();
    }
    state.fx.usdToEur = state.settings.tax.fallbackUsdToEur;
    state.fx.source = "Fallback (Settings)";
  } catch (_error) {
    state.settings = defaultSettings();
    state.fx.usdToEur = state.settings.tax.fallbackUsdToEur;
    state.fx.source = "Fallback (Settings)";
    saveSettingsLocal();
  }
}

function saveSettingsLocal() {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
}

function loadProductsLocal() {
  const rawCurrent = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);

  const raw = rawCurrent || rawLegacy;
  if (!raw) {
    state.products = [defaultProduct(1), defaultProduct(2)];
    state.selectedId = state.products[0].id;
    saveProductsLocal();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("invalid");
    }

    state.products = parsed.map((item, index) => migrateProduct(item, index));
    state.selectedId = state.products[0].id;
    saveProductsLocal();
  } catch (_error) {
    state.products = [defaultProduct(1)];
    state.selectedId = state.products[0].id;
    saveProductsLocal();
  }
}

function saveProductsLocal() {
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(state.products));
}

function loadSettings() {
  loadSettingsLocal();
}

function loadProducts() {
  loadProductsLocal();
}

function isSharedStoreActive() {
  return (
    state.storage.mode === "shared" &&
    state.storage.adapter?.type === "shared" &&
    Boolean(state.session.workspaceId) &&
    Boolean(state.session.userId)
  );
}

function scheduleRemoteSettingsSave() {
  if (!isSharedStoreActive() || !state.storage.adapter?.saveSettings) {
    return;
  }
  if (state.sync.settingsTimer) {
    clearTimeout(state.sync.settingsTimer);
  }
  state.sync.settingsTimer = setTimeout(async () => {
    state.sync.settingsTimer = null;
    if (state.sync.settingsSaving) {
      state.sync.settingsPending = true;
      return;
    }
    state.sync.settingsSaving = true;
    try {
      do {
        state.sync.settingsPending = false;
        await state.storage.adapter.saveSettings(state.settings);
        state.sync.lastRemoteError = null;
        state.sync.lastRemoteSuccessAt = new Date().toISOString();
        setSessionInfoText();
      } while (state.sync.settingsPending);
    } catch (error) {
      console.error("Remote settings save failed", error);
      state.sync.lastRemoteError = error?.message || "Settings konnten nicht gespeichert werden.";
      setAuthStatus("Speichern der Settings in Supabase fehlgeschlagen.", true);
      setSessionInfoText();
    } finally {
      state.sync.settingsSaving = false;
    }
  }, REMOTE_SAVE_DEBOUNCE_MS);
}

function scheduleRemoteProductsSave() {
  if (!isSharedStoreActive() || !state.storage.adapter?.saveProducts) {
    return;
  }
  if (state.sync.productsTimer) {
    clearTimeout(state.sync.productsTimer);
  }
  state.sync.productsTimer = setTimeout(async () => {
    state.sync.productsTimer = null;
    if (state.sync.productsSaving) {
      state.sync.productsPending = true;
      return;
    }
    state.sync.productsSaving = true;
    try {
      do {
        state.sync.productsPending = false;
        await state.storage.adapter.saveProducts(state.products);
        state.sync.lastRemoteError = null;
        state.sync.lastRemoteSuccessAt = new Date().toISOString();
        setSessionInfoText();
      } while (state.sync.productsPending);
    } catch (error) {
      console.error("Remote products save failed", error);
      state.sync.lastRemoteError = error?.message || "Produkte konnten nicht gespeichert werden.";
      setAuthStatus("Speichern der Produkte in Supabase fehlgeschlagen.", true);
      setSessionInfoText();
    } finally {
      state.sync.productsSaving = false;
    }
  }, REMOTE_SAVE_DEBOUNCE_MS);
}

async function flushRemoteProductsSave() {
  if (!isSharedStoreActive() || !state.storage.adapter?.saveProducts) {
    return true;
  }
  if (state.sync.productsTimer) {
    clearTimeout(state.sync.productsTimer);
    state.sync.productsTimer = null;
  }
  try {
    await state.storage.adapter.saveProducts(state.products);
    state.sync.lastRemoteError = null;
    state.sync.lastRemoteSuccessAt = new Date().toISOString();
    setSessionInfoText();
    return true;
  } catch (error) {
    console.error("Immediate remote products save failed", error);
    state.sync.lastRemoteError = error?.message || "Produkte konnten nicht gespeichert werden.";
    setAuthStatus("Remote-Speicherung fehlgeschlagen. Änderungen sind nur lokal.", true);
    setSessionInfoText();
    return false;
  }
}

async function flushRemoteSettingsSave() {
  if (!isSharedStoreActive() || !state.storage.adapter?.saveSettings) {
    return true;
  }
  if (state.sync.settingsTimer) {
    clearTimeout(state.sync.settingsTimer);
    state.sync.settingsTimer = null;
  }
  try {
    await state.storage.adapter.saveSettings(state.settings);
    state.sync.lastRemoteError = null;
    state.sync.lastRemoteSuccessAt = new Date().toISOString();
    setSessionInfoText();
    return true;
  } catch (error) {
    console.error("Immediate remote settings save failed", error);
    state.sync.lastRemoteError = error?.message || "Settings konnten nicht gespeichert werden.";
    setAuthStatus("Remote-Speicherung der Settings fehlgeschlagen.", true);
    setSessionInfoText();
    return false;
  }
}

function saveSettings({ flushRemoteNow = false } = {}) {
  saveSettingsLocal();
  scheduleRemoteSettingsSave();
  if (flushRemoteNow && isSharedStoreActive()) {
    void flushRemoteSettingsSave();
  }
}

function saveProducts() {
  state.products.forEach((product) => ensureProductId(product));
  saveProductsLocal();
  scheduleRemoteProductsSave();
}

function isEditableControl(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
}

function fieldKeyForControl(control) {
  if (!isEditableControl(control)) {
    return null;
  }
  const settingsPath = control.dataset.settingsPath;
  if (settingsPath) {
    return `settings:${settingsPath}`;
  }
  const productPath = control.dataset.path;
  if (!productPath || !state.selectedId) {
    return null;
  }
  return `product:${state.selectedId}:${productPath}`;
}

function clearSoftLockUi() {
  document.querySelectorAll(".soft-locked").forEach((node) => {
    node.classList.remove("soft-locked");
  });
  document.querySelectorAll(".soft-lock-hint").forEach((node) => {
    node.remove();
  });
}

function applySoftLocksToUI() {
  clearSoftLockUi();
  if (!isSharedStoreActive()) {
    return;
  }
  const controls = document.querySelectorAll("[data-path], [data-settings-path]");
  controls.forEach((control) => {
    if (!isEditableControl(control)) {
      return;
    }
    const fieldKey = fieldKeyForControl(control);
    if (!fieldKey) {
      return;
    }
    const lockerLabel = state.presence.editingByField[fieldKey];
    if (!lockerLabel) {
      return;
    }
    control.classList.add("soft-locked");
    const label = control.closest("label");
    if (!label) {
      return;
    }
    const hint = document.createElement("small");
    hint.className = "soft-lock-hint";
    hint.textContent = `${lockerLabel} bearbeitet dieses Feld gerade`;
    label.appendChild(hint);
  });
}

function refreshPresenceLocksFromChannel() {
  const channel = state.realtime.channel;
  if (!channel || typeof channel.presenceState !== "function") {
    state.presence.editingByField = {};
    applySoftLocksToUI();
    return;
  }
  const nextEditingByField = {};
  const presenceState = channel.presenceState();
  Object.values(presenceState).forEach((entries) => {
    if (!Array.isArray(entries)) {
      return;
    }
    entries.forEach((entry) => {
      const fieldKey = String(entry?.fieldKey ?? "").trim();
      if (!fieldKey) {
        return;
      }
      const userId = String(entry?.userId ?? "");
      if (userId && userId === state.session.userId) {
        return;
      }
      const userEmail = String(entry?.userEmail ?? "").trim();
      if (!nextEditingByField[fieldKey]) {
        nextEditingByField[fieldKey] = userEmail || "Kollege";
      }
    });
  });
  state.presence.editingByField = nextEditingByField;
  applySoftLocksToUI();
}

async function trackPresenceField(fieldKey) {
  const channel = state.realtime.channel;
  if (!channel || !state.realtime.connected || typeof channel.track !== "function") {
    return;
  }
  try {
    await channel.track({
      userId: state.session.userId,
      userEmail: state.session.userEmail,
      fieldKey: fieldKey || null,
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Realtime presence track failed", error);
  }
}

function stopPresenceHeartbeat() {
  if (!state.presence.heartbeatTimer) {
    return;
  }
  clearInterval(state.presence.heartbeatTimer);
  state.presence.heartbeatTimer = null;
}

function startPresenceHeartbeat() {
  stopPresenceHeartbeat();
  state.presence.heartbeatTimer = setInterval(() => {
    void trackPresenceField(state.presence.myEditingField);
  }, REALTIME_PRESENCE_HEARTBEAT_MS);
}

function markLocalEditActivity() {
  state.realtime.lastLocalEditAt = Date.now();
}

function isSafeToApplyRemoteSnapshot() {
  if (state.presence.myEditingField) {
    return false;
  }
  if (Date.now() - state.realtime.lastLocalEditAt < REALTIME_EDIT_GRACE_MS) {
    return false;
  }
  if (state.sync.settingsSaving || state.sync.productsSaving) {
    return false;
  }
  return true;
}

function snapshotSignature(value) {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return "";
  }
}

function productCollectionSignature(products) {
  if (!Array.isArray(products)) {
    return "[]";
  }
  const normalized = products
    .map((product) => ({
      id: String(product?.id ?? ""),
      payload: product,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return snapshotSignature(normalized);
}

function orderRemoteProductsForApply(remoteProducts, currentProducts) {
  if (!Array.isArray(remoteProducts)) {
    return [];
  }
  const currentOrderById = new Map();
  if (Array.isArray(currentProducts)) {
    currentProducts.forEach((product, index) => {
      currentOrderById.set(String(product?.id ?? ""), index);
    });
  }
  return [...remoteProducts].sort((a, b) => {
    const idA = String(a?.id ?? "");
    const idB = String(b?.id ?? "");
    const indexA = currentOrderById.has(idA) ? currentOrderById.get(idA) : Number.MAX_SAFE_INTEGER;
    const indexB = currentOrderById.has(idB) ? currentOrderById.get(idB) : Number.MAX_SAFE_INTEGER;
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return idA.localeCompare(idB);
  });
}

function scheduleRemotePull(reason = "event", { immediate = false, forceApply = false } = {}) {
  if (!isSharedStoreActive()) {
    return;
  }
  if (state.realtime.pullTimer) {
    clearTimeout(state.realtime.pullTimer);
    state.realtime.pullTimer = null;
  }
  state.realtime.pullTimer = setTimeout(() => {
    state.realtime.pullTimer = null;
    void pullRemoteSnapshot({ reason, forceApply });
  }, immediate ? 0 : REALTIME_PULL_DEBOUNCE_MS);
}

function maybeApplyDeferredRemotePull() {
  if (!state.realtime.pendingApply || !isSafeToApplyRemoteSnapshot()) {
    return;
  }
  scheduleRemotePull("deferred_apply", { immediate: true, forceApply: true });
}

async function pullRemoteSnapshot({ reason = "event", forceApply = false } = {}) {
  if (!isSharedStoreActive() || !state.storage.adapter?.loadSettings || !state.storage.adapter?.loadProducts) {
    return false;
  }
  if (state.realtime.pullInFlight) {
    state.realtime.pendingPull = true;
    return false;
  }

  state.realtime.pullInFlight = true;
  try {
    const [remoteSettingsRaw, remoteProductsRaw] = await Promise.all([
      state.storage.adapter.loadSettings(),
      state.storage.adapter.loadProducts(),
    ]);

    const remoteSettings = normalizeRemoteSettings(remoteSettingsRaw) ?? defaultSettings();
    let remoteProducts = normalizeRemoteProducts(remoteProductsRaw);
    if (remoteProducts.length === 0) {
      remoteProducts = [defaultProduct(1)];
    }
    remoteProducts.forEach((product) => ensureProductId(product));

    const settingsChanged = snapshotSignature(remoteSettings) !== snapshotSignature(state.settings);
    const productsChanged = productCollectionSignature(remoteProducts) !== productCollectionSignature(state.products);
    if (!settingsChanged && !productsChanged) {
      state.realtime.lastPullAt = new Date().toISOString();
      setSessionInfoText();
      return false;
    }

    if (!forceApply && !isSafeToApplyRemoteSnapshot()) {
      state.realtime.pendingApply = true;
      window.setTimeout(() => {
        maybeApplyDeferredRemotePull();
      }, REALTIME_EDIT_GRACE_MS);
      setSessionInfoText();
      return false;
    }

    const previousSelectedId = state.selectedId;
    state.settings = remoteSettings;
    state.products = orderRemoteProductsForApply(remoteProducts, state.products);
    state.selectedId = previousSelectedId;
    selectFirstProductIfNeeded();
    saveSettingsLocal();
    saveProductsLocal();

    state.sync.lastRemoteError = null;
    state.sync.lastRemoteSuccessAt = new Date().toISOString();
    state.realtime.lastPullAt = state.sync.lastRemoteSuccessAt;
    state.realtime.pendingApply = false;

    if (APP_PAGE === "settings") {
      renderSettingsInputs();
      applyMouseoverHelp();
    } else {
      renderAll();
    }
    setSessionInfoText();

    if (reason === "manual_sync") {
      setAuthStatus("Synchronisiert.");
    }
    return true;
  } catch (error) {
    console.error("Remote pull failed", error);
    state.sync.lastRemoteError = error?.message || "Remote-Daten konnten nicht geladen werden.";
    setSessionInfoText();
    if (reason === "manual_sync") {
      setAuthStatus("Synchronisierung fehlgeschlagen: " + state.sync.lastRemoteError, true);
    }
    return false;
  } finally {
    state.realtime.pullInFlight = false;
    if (state.realtime.pendingPull) {
      state.realtime.pendingPull = false;
      scheduleRemotePull("pending_queue", { immediate: true, forceApply });
    } else {
      maybeApplyDeferredRemotePull();
    }
  }
}

function startFallbackRemotePull() {
  if (state.realtime.fallbackTimer || !isSharedStoreActive()) {
    return;
  }
  state.realtime.fallbackTimer = setInterval(() => {
    scheduleRemotePull("fallback_poll", { immediate: true });
  }, REALTIME_FALLBACK_PULL_MS);
  setSessionInfoText();
}

function stopFallbackRemotePull() {
  if (!state.realtime.fallbackTimer) {
    return;
  }
  clearInterval(state.realtime.fallbackTimer);
  state.realtime.fallbackTimer = null;
}

function handleRealtimeChannelStatus(status) {
  if (status === "SUBSCRIBED") {
    state.realtime.connected = true;
    stopFallbackRemotePull();
    setSessionInfoText();
    refreshPresenceLocksFromChannel();
    startPresenceHeartbeat();
    void trackPresenceField(state.presence.myEditingField);
    scheduleRemotePull("realtime_subscribed", { immediate: true });
    return;
  }
  if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
    state.realtime.connected = false;
    stopPresenceHeartbeat();
    startFallbackRemotePull();
    setSessionInfoText();
  }
}

function stopRealtimeSync() {
  if (state.realtime.pullTimer) {
    clearTimeout(state.realtime.pullTimer);
    state.realtime.pullTimer = null;
  }
  stopFallbackRemotePull();
  stopPresenceHeartbeat();
  if (state.presence.focusClearTimer) {
    clearTimeout(state.presence.focusClearTimer);
    state.presence.focusClearTimer = null;
  }

  const channel = state.realtime.channel;
  state.realtime.channel = null;
  state.realtime.channelWorkspaceId = null;
  state.realtime.connected = false;
  state.realtime.pullInFlight = false;
  state.realtime.pendingPull = false;
  state.realtime.pendingApply = false;
  state.realtime.lastEventAt = null;

  state.presence.editingByField = {};
  state.presence.myEditingField = null;
  clearSoftLockUi();

  if (channel) {
    void (async () => {
      try {
        if (typeof channel.untrack === "function") {
          await channel.untrack();
        }
      } catch (_error) {
        // Ignore untrack cleanup failures.
      }
      try {
        await channel.unsubscribe();
      } catch (_error) {
        // Ignore unsubscribe cleanup failures.
      }
      try {
        state.supabase.client?.removeChannel?.(channel);
      } catch (_error) {
        // Ignore remove channel cleanup failures.
      }
    })();
  }
  setSessionInfoText();
}

function startRealtimeSync() {
  if (!isSharedStoreActive() || !state.supabase.client?.channel) {
    stopRealtimeSync();
    return;
  }

  const workspaceId = state.session.workspaceId;
  if (
    state.realtime.channel &&
    state.realtime.channelWorkspaceId === workspaceId
  ) {
    return;
  }

  stopRealtimeSync();

  const channel = state.supabase.client.channel(`workspace:${workspaceId}`, {
    config: {
      presence: {
        key: state.session.userId || undefined,
      },
    },
  });

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "workspace_settings", filter: `workspace_id=eq.${workspaceId}` },
    () => {
      state.realtime.lastEventAt = new Date().toISOString();
      scheduleRemotePull("workspace_settings_event");
    },
  );
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "products", filter: `workspace_id=eq.${workspaceId}` },
    () => {
      state.realtime.lastEventAt = new Date().toISOString();
      scheduleRemotePull("products_event");
    },
  );
  channel.on("presence", { event: "sync" }, () => {
    refreshPresenceLocksFromChannel();
  });
  channel.on("presence", { event: "join" }, () => {
    refreshPresenceLocksFromChannel();
  });
  channel.on("presence", { event: "leave" }, () => {
    refreshPresenceLocksFromChannel();
  });

  state.realtime.channel = channel;
  state.realtime.channelWorkspaceId = workspaceId;
  state.realtime.connected = false;
  setSessionInfoText();
  startFallbackRemotePull();

  channel.subscribe((status) => {
    handleRealtimeChannelStatus(status);
  });
}

async function handleSyncNow() {
  if (!isSharedStoreActive()) {
    return;
  }
  setAuthStatus("Synchronisierung läuft ...");
  await flushRemoteSettingsSave();
  await flushRemoteProductsSave();
  await pullRemoteSnapshot({ reason: "manual_sync", forceApply: true });
}

function setStorageModeLabel() {
  if (!dom.storageModeLabel) {
    return;
  }
  dom.storageModeLabel.textContent = state.storage.mode === "shared" ? "gemeinsam" : "lokal";
}

function setSessionInfoText() {
  if (!dom.sessionInfo) {
    return;
  }
  const hasSession = state.session.isAuthenticated && state.session.workspaceId;
  dom.sessionInfo.classList.toggle("hidden", !hasSession);
  if (!hasSession) {
    dom.sessionInfo.textContent = "";
    return;
  }
  const workspaceLabel = state.session.workspaceName || state.session.workspaceId;
  const base = `${state.session.userEmail} · Workspace: ${workspaceLabel}`;
  if (state.storage.mode !== "shared") {
    dom.sessionInfo.textContent = base;
    return;
  }
  if (state.sync.lastRemoteError) {
    dom.sessionInfo.textContent = `${base} · Sync-Fehler: ${state.sync.lastRemoteError}`;
    return;
  }
  const syncHints = [];
  if (state.realtime.connected) {
    syncHints.push("Live-Sync aktiv");
  } else if (state.realtime.fallbackTimer) {
    syncHints.push("Live-Sync getrennt · Fallback aktiv");
  }
  if (state.realtime.pendingApply) {
    syncHints.push("Remote-Änderungen warten auf Übernahme");
  }
  if (state.sync.lastRemoteSuccessAt) {
    syncHints.push(`Letzter Sync: ${formatDate(state.sync.lastRemoteSuccessAt)}`);
  }
  dom.sessionInfo.textContent = syncHints.length > 0 ? `${base} · ${syncHints.join(" · ")}` : `${base} · Sync läuft`;
}

function setAuthStatus(message, isError = false) {
  if (!dom.authStatus) {
    return;
  }
  dom.authStatus.textContent = message ?? "";
  dom.authStatus.classList.toggle("fail", Boolean(isError));
  dom.authStatus.classList.toggle("pass", !isError && Boolean(message));
}

async function withTimeout(promise, ms, label = "operation") {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(label + "_timeout")), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function setAppMode(mode, reason = "") {
  state.session.appMode = mode;

  const showAuth = mode === "auth_required";
  const showNoAccess = mode === "no_access";
  const showApp = mode === "ready_shared" || mode === "ready_local";

  if (dom.appContent) {
    dom.appContent.classList.toggle("hidden", !showApp);
  }
  if (dom.authPanel) {
    dom.authPanel.classList.toggle("hidden", !showAuth);
  }
  if (dom.noAccessPanel) {
    dom.noAccessPanel.classList.toggle("hidden", !showNoAccess);
  }
  if (dom.authLogoutBtn) {
    dom.authLogoutBtn.classList.toggle("hidden", !(state.session.isAuthenticated && state.session.hasWorkspaceAccess && state.storage.adapter?.type === "shared"));
  }
  if (dom.syncNowBtn) {
    dom.syncNowBtn.classList.toggle("hidden", !(state.session.isAuthenticated && state.session.hasWorkspaceAccess && state.storage.adapter?.type === "shared"));
  }
  if (dom.compareCard) {
    dom.compareCard.classList.toggle("hidden", !showApp);
  }

  if (showAuth) {
    setAuthStatus(reason || "Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
  } else if (showNoAccess) {
    setAuthStatus(reason || "Kein Zugriff auf Workspace.", true);
  } else if (mode === "ready_shared") {
    if (dom.authPassword instanceof HTMLInputElement) {
      dom.authPassword.value = "";
    }
    if (state.sync.lastRemoteError) {
      setAuthStatus(`Remote-Sync Fehler: ${state.sync.lastRemoteError}`, true);
    } else if (state.sync.lastRemoteSuccessAt) {
      setAuthStatus(`Gemeinsamer Workspace aktiv · letzter Sync ${formatDate(state.sync.lastRemoteSuccessAt)}`);
    } else {
      setAuthStatus("Gemeinsamer Workspace aktiv.");
    }
  } else if (mode === "ready_local") {
    setAuthStatus("Lokaler Modus aktiv.");
  } else {
    setAuthStatus(reason);
  }
}

function setAppLockedState({ showAuth = false, showNoAccess = false } = {}) {
  if (showAuth) {
    setAppMode("auth_required");
    return;
  }
  if (showNoAccess) {
    setAppMode("no_access");
    return;
  }
  if (state.storage.mode === "shared" && state.session.isAuthenticated && state.session.hasWorkspaceAccess) {
    setAppMode("ready_shared");
    return;
  }
  setAppMode("ready_local");
}

function configureSessionState({
  requiresAuth = false,
  isAuthenticated = false,
  hasWorkspaceAccess = false,
  pendingLocalImport = false,
  userId = null,
  userEmail = "",
  workspaceId = null,
  workspaceName = "",
} = {}) {
  state.session.requiresAuth = requiresAuth;
  state.session.isAuthenticated = isAuthenticated;
  state.session.hasWorkspaceAccess = hasWorkspaceAccess;
  state.session.pendingLocalImport = pendingLocalImport;
  state.session.userId = userId;
  state.session.userEmail = userEmail;
  state.session.workspaceId = workspaceId;
  state.session.workspaceName = workspaceName;
  setSessionInfoText();
}

function createLocalStoreAdapter() {
  return {
    type: "local",
    async loadSettings() {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return raw ? JSON.parse(raw) : null;
    },
    async loadProducts() {
      const rawCurrent = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      const raw = rawCurrent || rawLegacy;
      return raw ? JSON.parse(raw) : null;
    },
    async saveSettings(settings) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    },
    async saveProducts(products) {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    },
  };
}

async function loadRemoteConfig() {
  const normalizeConfig = (candidate) => {
    if (!candidate || typeof candidate !== "object") {
      return null;
    }
    const supabaseUrl = String(candidate.supabaseUrl ?? "").trim();
    const supabaseAnonKey = String(candidate.supabaseAnonKey ?? "").trim();
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }
    return { supabaseUrl, supabaseAnonKey };
  };

  try {
    const windowConfig = normalizeConfig(window.APP_CONFIG);
    if (windowConfig) {
      return windowConfig;
    }
  } catch (_error) {
    // Ignore and continue with endpoint/local fallback.
  }

  try {
    const localRaw = localStorage.getItem(LOCAL_SUPABASE_CONFIG_KEY);
    if (localRaw) {
      const parsedLocal = JSON.parse(localRaw);
      const localConfig = normalizeConfig(parsedLocal);
      if (localConfig) {
        return localConfig;
      }
    }
  } catch (_error) {
    // Ignore invalid local override and continue.
  }

  try {
    const response = await fetch(SUPABASE_CONFIG_ENDPOINT, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    return normalizeConfig(payload);
  } catch (_error) {
    return null;
  }
}

async function createSupabaseClientFromConfig() {
  const config = await loadRemoteConfig();
  if (!config || !window.supabase?.createClient) {
    return null;
  }
  try {
    return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } catch (_error) {
    return null;
  }
}

async function fetchWorkspaceMembership(client, userId) {
  const { data: membership, error } = await client
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!membership?.workspace_id) {
    return null;
  }

  let workspaceName = "";
  const { data: workspaceRow } = await client
    .from("workspaces")
    .select("name")
    .eq("id", membership.workspace_id)
    .limit(1)
    .maybeSingle();
  workspaceName = workspaceRow?.name ?? "";

  return {
    workspaceId: membership.workspace_id,
    role: membership.role ?? "editor",
    workspaceName,
  };
}

function createSupabaseStoreAdapter(client, workspaceId, userId) {
  return {
    type: "shared",
    workspaceId,
    userId,
    async loadSettings() {
      const { data, error } = await client
        .from("workspace_settings")
        .select("payload")
        .eq("workspace_id", workspaceId)
        .limit(1)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data?.payload ?? null;
    },
    async loadProducts() {
      const { data, error } = await client
        .from("products")
        .select("id, name, payload, updated_at")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false });
      if (error) {
        throw error;
      }
      return data ?? [];
    },
    async saveSettings(settings) {
      const { error } = await client.from("workspace_settings").upsert(
        {
          workspace_id: workspaceId,
          payload: settings,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id" },
      );
      if (error) {
        throw error;
      }
    },
    async saveProducts(products) {
      const nowIso = new Date().toISOString();
      const rows = products.map((product) => ({
        id: product.id,
        workspace_id: workspaceId,
        name: String(product.name ?? "").trim() || "Produkt",
        payload: product,
        created_by: userId,
        updated_by: userId,
        updated_at: nowIso,
      }));

      if (rows.length > 0) {
        const { error: upsertError } = await client.from("products").upsert(rows, { onConflict: "id" });
        if (upsertError) {
          throw upsertError;
        }
      }

      const { data: existingRows, error: existingError } = await client
        .from("products")
        .select("id")
        .eq("workspace_id", workspaceId);
      if (existingError) {
        throw existingError;
      }

      const keepIds = new Set(products.map((product) => product.id));
      const deleteIds = (existingRows ?? []).map((row) => row.id).filter((id) => !keepIds.has(id));
      if (deleteIds.length > 0) {
        const { error: deleteError } = await client
          .from("products")
          .delete()
          .eq("workspace_id", workspaceId)
          .in("id", deleteIds);
        if (deleteError) {
          throw deleteError;
        }
      }
    },
  };
}

function normalizeRemoteProducts(rawRows) {
  if (!Array.isArray(rawRows)) {
    return [];
  }
  return rawRows.map((row, index) => {
    const migrated = migrateProduct(row?.payload ?? {}, index);
    migrated.id = row?.id ?? migrated.id;
    if (row?.name && !migrated.name) {
      migrated.name = row.name;
    }
    return migrated;
  });
}

function normalizeRemoteSettings(rawSettings) {
  if (!rawSettings || typeof rawSettings !== "object") {
    return null;
  }
  const merged = {
    ...defaultSettings(),
    ...rawSettings,
    tax: ensureTaxSettings(rawSettings?.tax),
    shipping12m: ensureShipping12mSettings(rawSettings?.shipping12m),
    amazonFba: ensureAmazonFbaSettings(rawSettings?.amazonFba),
    cartonRules: {
      ...defaultSettings().cartonRules,
      ...(rawSettings?.cartonRules ?? {}),
    },
    categoryDefaults: ensureCategoryDefaults(rawSettings?.categoryDefaults),
    lifecycle: ensureLifecycleSettings(rawSettings?.lifecycle),
    threePl: ensureThreePlSettings(rawSettings?.threePl, rawSettings?.costDefaults),
    costDefaults: ensureCostDefaults(rawSettings?.costDefaults),
  };
  return sanitizeSettings(merged);
}

async function importLocalDataToRemoteIfNeeded(adapter) {
  const remoteProductsRaw = await adapter.loadProducts();
  const remoteProducts = normalizeRemoteProducts(remoteProductsRaw);

  if (remoteProducts.length > 0) {
    return { imported: false, skipped: true, reason: "remote_has_data", remoteProducts };
  }

  const localProductsRaw = localStorage.getItem(STORAGE_KEY_PRODUCTS) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  const localSettingsRaw = localStorage.getItem(STORAGE_KEY_SETTINGS);
  const hasLocalProducts = Boolean(localProductsRaw);
  const hasLocalSettings = Boolean(localSettingsRaw);
  if (!hasLocalProducts && !hasLocalSettings) {
    return { imported: false, skipped: true, reason: "no_local_data", remoteProducts: [] };
  }

  return {
    imported: false,
    skipped: true,
    reason: "local_data_available",
    hasLocalProducts,
    hasLocalSettings,
    remoteProducts: [],
  };
}

async function importLocalDataIntoSharedWorkspace() {
  const adapter = state.storage.adapter;
  if (!isSharedStoreActive() || !adapter?.saveProducts || !adapter?.saveSettings) {
    return false;
  }

  const localProductsRaw = localStorage.getItem(STORAGE_KEY_PRODUCTS) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  const localSettingsRaw = localStorage.getItem(STORAGE_KEY_SETTINGS);
  const hasLocalProducts = Boolean(localProductsRaw);
  const hasLocalSettings = Boolean(localSettingsRaw);

  if (!hasLocalProducts && !hasLocalSettings) {
    setAuthStatus("Keine lokalen Daten für Import gefunden.");
    return false;
  }

  let importProducts = [];
  if (hasLocalProducts) {
    try {
      const parsed = JSON.parse(localProductsRaw);
      importProducts = Array.isArray(parsed) ? parsed.map((item, index) => migrateProduct(item, index)) : [];
    } catch (_error) {
      importProducts = [];
    }
  }
  if (importProducts.length === 0) {
    importProducts = [defaultProduct(1)];
  }
  importProducts.forEach((product) => ensureProductId(product));

  let importSettings = defaultSettings();
  if (hasLocalSettings) {
    try {
      const parsedSettings = JSON.parse(localSettingsRaw);
      importSettings = normalizeRemoteSettings(parsedSettings) ?? defaultSettings();
    } catch (_error) {
      importSettings = defaultSettings();
    }
  }

  await adapter.saveSettings(importSettings);
  await adapter.saveProducts(importProducts);
  state.settings = normalizeRemoteSettings(importSettings) ?? defaultSettings();
  state.products = importProducts.map((item, index) => migrateProduct(item, index));
  state.products.forEach((product) => ensureProductId(product));
  selectFirstProductIfNeeded();
  saveSettingsLocal();
  saveProductsLocal();
  state.sync.lastRemoteError = null;
  state.sync.lastRemoteSuccessAt = new Date().toISOString();
  state.session.pendingLocalImport = false;
  setAuthStatus("Lokale Daten wurden in den gemeinsamen Workspace importiert.");
  renderPageAfterLoad();
  return true;
}

function selectFirstProductIfNeeded() {
  state.products.forEach((product) => ensureProductId(product));
  if (!state.products.length) {
    state.products = [defaultProduct(1)];
  }
  if (!state.selectedId || !state.products.some((item) => item.id === state.selectedId)) {
    state.selectedId = state.products[0].id;
  }
}

async function activateSharedWorkspace(user) {
  if (!state.supabase.client) {
    return false;
  }

  state.session.pendingLocalImport = false;
  const membership = await fetchWorkspaceMembership(state.supabase.client, user.id);
  if (!membership) {
    stopRealtimeSync();
    configureSessionState({
      requiresAuth: true,
      isAuthenticated: true,
      hasWorkspaceAccess: false,
      userId: user.id,
      userEmail: user.email ?? "",
    });
    state.storage.mode = "local";
    state.storage.adapter = createLocalStoreAdapter();
    setStorageModeLabel();
    setAppMode("no_access", "Kein Zugriff auf Workspace.");
    return false;
  }

  const adapter = createSupabaseStoreAdapter(state.supabase.client, membership.workspaceId, user.id);
  state.storage.mode = "shared";
  state.storage.adapter = adapter;
  setStorageModeLabel();

  const importResult = await importLocalDataToRemoteIfNeeded(adapter);
  let remoteSettings = await adapter.loadSettings();
  let remoteProducts = await adapter.loadProducts();

  if (!remoteSettings) {
    remoteSettings = importResult.remoteSettings ?? defaultSettings();
    await adapter.saveSettings(remoteSettings);
  }

  let normalizedProducts = normalizeRemoteProducts(remoteProducts);
  if (normalizedProducts.length === 0) {
    normalizedProducts = importResult.remoteProducts?.length ? importResult.remoteProducts : [defaultProduct(1)];
    await adapter.saveProducts(normalizedProducts);
    remoteProducts = await adapter.loadProducts();
    normalizedProducts = normalizeRemoteProducts(remoteProducts);
  }

  const normalizedSettings = normalizeRemoteSettings(remoteSettings) ?? defaultSettings();
  state.settings = normalizedSettings;
  state.products = normalizedProducts;
  state.products.forEach((product) => ensureProductId(product));
  selectFirstProductIfNeeded();

  configureSessionState({
    requiresAuth: true,
    isAuthenticated: true,
    hasWorkspaceAccess: true,
    userId: user.id,
    userEmail: user.email ?? "",
    workspaceId: membership.workspaceId,
    workspaceName: membership.workspaceName,
    pendingLocalImport: importResult.reason === "local_data_available",
  });

  saveSettingsLocal();
  saveProductsLocal();
  state.fx.usdToEur = state.settings.tax.fallbackUsdToEur;
  state.fx.source = "Fallback (Settings)";

  startRealtimeSync();
  setAppMode("ready_shared");
  return true;
}

function formatAuthError(error, fallback = "Unbekannter Fehler") {
  const message = error?.message ?? error?.error_description ?? fallback;
  return String(message);
}

function resetToAuthRequiredState(
  reason = "Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.",
) {
  stopRealtimeSync();
  state.storage.mode = "local";
  state.storage.adapter = createLocalStoreAdapter();
  setStorageModeLabel();
  configureSessionState({
    requiresAuth: true,
    isAuthenticated: false,
    hasWorkspaceAccess: false,
    pendingLocalImport: false,
    userId: null,
    userEmail: "",
    workspaceId: null,
    workspaceName: "",
  });
  setAppMode("auth_required", reason);
}

async function ensureSupabaseClient({ label = "supabase_client", showStatusOnError = true } = {}) {
  if (state.supabase.client) {
    return state.supabase.client;
  }
  try {
    state.supabase.client = await withTimeout(createSupabaseClientFromConfig(), SUPABASE_CLIENT_TIMEOUT_MS, label);
  } catch (clientError) {
    console.error("Supabase client init failed", clientError);
    if (showStatusOnError) {
      setAuthStatus("Supabase-Verbindung nicht erreichbar. Bitte Seite neu laden.", true);
    }
    return null;
  }
  if (!state.supabase.client && showStatusOnError) {
    setAuthStatus("Supabase ist nicht konfiguriert. /api/config prüfen.", true);
  }
  return state.supabase.client;
}

async function applySupabaseSession(session, source = "session_sync") {
  const user = session?.user ?? null;
  if (!user) {
    resetToAuthRequiredState("Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
    return false;
  }

  try {
    const activated = await activateSharedWorkspace(user);
    if (!activated) {
      return false;
    }
    setAppMode("ready_shared");
    renderPageAfterLoad();
    return true;
  } catch (error) {
    console.error(`Supabase session sync failed (${source})`, error);
    resetToAuthRequiredState("Bitte erneut anmelden oder Workspace-Zugriff prüfen.");
    setAuthStatus(`Workspace konnte nicht geladen werden: ${formatAuthError(error)}`, true);
    return false;
  }
}

async function syncSessionFromClient(source = "session_sync") {
  if (!state.supabase.client) {
    return null;
  }
  try {
    const { data, error } = await state.supabase.client.auth.getSession();
    if (error) {
      throw error;
    }
    return await applySupabaseSession(data?.session ?? null, source);
  } catch (error) {
    console.error(`Supabase getSession failed (${source})`, error);
    resetToAuthRequiredState("Bitte neu anmelden.");
    setAuthStatus(`Session konnte nicht geladen werden: ${formatAuthError(error)}`, true);
    return null;
  }
}

async function setLocalMode() {
  stopRealtimeSync();
  state.storage.mode = "local";
  state.storage.adapter = createLocalStoreAdapter();
  setStorageModeLabel();
  configureSessionState({
    requiresAuth: false,
    isAuthenticated: false,
    hasWorkspaceAccess: true,
    pendingLocalImport: false,
  });
  state.sync.lastRemoteError = null;
  setAppMode("ready_local");
}

function exposeSyncDebug() {
  window.__syncDebug = {
    get mode() {
      return state.storage.mode;
    },
    get adapterType() {
      return state.storage.adapter?.type ?? null;
    },
    get appMode() {
      return state.session.appMode;
    },
    get workspaceId() {
      return state.session.workspaceId;
    },
    get userId() {
      return state.session.userId;
    },
    get lastRemoteError() {
      return state.sync.lastRemoteError;
    },
    get lastRemoteSuccessAt() {
      return state.sync.lastRemoteSuccessAt;
    },
    get realtimeConnected() {
      return state.realtime.connected;
    },
    get realtimeFallbackActive() {
      return Boolean(state.realtime.fallbackTimer);
    },
    get pendingRemoteApply() {
      return state.realtime.pendingApply;
    },
    get lastRealtimeEventAt() {
      return state.realtime.lastEventAt;
    },
  };
}

async function bootstrapCollaborationSession() {
  setAppMode("loading", "Session wird geladen ...");
  stopRealtimeSync();

  // Lokale Basis nur als Fallback laden, ohne Shared-Modus vorzutäuschen.
  state.storage.mode = "local";
  state.storage.adapter = createLocalStoreAdapter();
  setStorageModeLabel();
  loadSettingsLocal();
  loadProductsLocal();
  selectFirstProductIfNeeded();

  configureSessionState({
    requiresAuth: true,
    isAuthenticated: false,
    hasWorkspaceAccess: false,
    pendingLocalImport: false,
  });
  setAppMode("auth_required", "Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
  setAuthStatus("Supabase Verbindung wird aufgebaut ...");

  const client = await ensureSupabaseClient({ label: "supabase_client_bootstrap", showStatusOnError: false });
  if (!client) {
    resetToAuthRequiredState("Supabase ist aktuell nicht erreichbar. Bitte Seite neu laden.");
    setAuthStatus("Supabase-Konfiguration fehlt oder ist ungültig.", true);
    return;
  }

  state.supabase.client = client;

  if (!state.supabase.authSubscribed) {
    state.supabase.authSubscribed = true;
    client.auth.onAuthStateChange((_event, session) => {
      void applySupabaseSession(session, "auth_state_change");
    });
  }

  const restored = await syncSessionFromClient("bootstrap");
  if (restored === false) {
    setAuthStatus("Bereit zur Anmeldung.");
  }
}

async function handleAuthLogin() {
  const client = await ensureSupabaseClient({ label: "supabase_client_login" });
  if (!client) {
    return;
  }

  const email = String(dom.authEmail?.value ?? "").trim();
  const password = String(dom.authPassword?.value ?? "");
  if (!email || !password) {
    setAuthStatus("Bitte E-Mail und Passwort eingeben.", true);
    return;
  }

  setAuthStatus("Anmeldung läuft ...");

  let slowHintTimer = null;
  try {
    slowHintTimer = window.setTimeout(() => {
      setAuthStatus("Anmeldung dauert länger (Supabase Wakeup). Bitte kurz warten ...");
    }, 12000);

    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (slowHintTimer) {
      window.clearTimeout(slowHintTimer);
      slowHintTimer = null;
    }

    if (error) {
      setAppMode("auth_required", "Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
      setAuthStatus("Anmeldung fehlgeschlagen: " + formatAuthError(error), true);
      return;
    }

    setAuthStatus("Anmeldung erfolgreich. Workspace wird geladen ...");
    const session = data?.session ?? null;
    if (session?.user) {
      await applySupabaseSession(session, "login_result");
      return;
    }
    await syncSessionFromClient("login_post_signin");
  } finally {
    if (slowHintTimer) {
      window.clearTimeout(slowHintTimer);
    }
  }
}

async function handleAuthRegister() {
  const client = await ensureSupabaseClient({ label: "supabase_client_register" });
  if (!client) {
    return;
  }
  const email = String(dom.authEmail?.value ?? "").trim();
  const password = String(dom.authPassword?.value ?? "");
  if (!email || !password) {
    setAuthStatus("Bitte E-Mail und Passwort eingeben.", true);
    return;
  }
  setAuthStatus("Registrierung läuft ...");
  const { error, data } = await client.auth.signUp({ email, password });
  if (error) {
    setAuthStatus(`Registrierung fehlgeschlagen: ${formatAuthError(error)}`, true);
    return;
  }
  const hasSession = Boolean(data?.session?.user);
  if (hasSession) {
    setAuthStatus("Registrierung erfolgreich. Workspace wird geladen ...");
    await applySupabaseSession(data.session, "register_result");
    return;
  }
  setAuthStatus("Registrierung angelegt. Bitte E-Mail bestätigen und danach anmelden.");
}

async function handleAuthLogout() {
  const client = state.supabase.client;
  if (!client) {
    resetToAuthRequiredState("Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
    setAuthStatus("Abgemeldet.");
    return;
  }

  try {
    await client.auth.signOut();
  } catch (error) {
    console.error("Supabase logout failed", error);
  }
  resetToAuthRequiredState("Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
  setAuthStatus("Abgemeldet.");
}

function getSelectedProduct() {
  return state.products.find((item) => item.id === state.selectedId) ?? null;
}

function renderCategoryDefaultsAdmin() {
  if (!dom.categoryDefaultsAdmin) {
    return;
  }

  dom.categoryDefaultsAdmin.innerHTML = "";

  Object.entries(state.settings.categoryDefaults).forEach(([key, category]) => {
    const wrapper = document.createElement("section");
    wrapper.className = "admin-category-card";

    wrapper.innerHTML = `
      <h5>${category.label}</h5>
      <div class="admin-grid compact">
        <label>
          Referral %
          <input data-settings-path="categoryDefaults.${key}.referralRate" type="number" min="0" max="25" step="0.1" />
        </label>
        <label>
          TACoS %
          <input data-settings-path="categoryDefaults.${key}.tacosRate" type="number" min="0" max="100" step="0.1" />
        </label>
        <label>
          Retouren %
          <input data-settings-path="categoryDefaults.${key}.returnRate" type="number" min="0" max="100" step="0.1" />
        </label>
        <label>
          Verkaufbar %
          <input data-settings-path="categoryDefaults.${key}.sellableShare" type="number" min="0" max="100" step="0.1" />
        </label>
        <label>
          Zielmarge %
          <input data-settings-path="categoryDefaults.${key}.targetMarginPct" type="number" min="0" max="50" step="0.1" />
        </label>
      </div>
    `;

    dom.categoryDefaultsAdmin.appendChild(wrapper);
  });
}

function renderSettingsInputs() {
  const fields = document.querySelectorAll("[data-settings-path]");
  fields.forEach((field) => {
    const path = field.dataset.settingsPath;
    const value = getByPath(state.settings, path);

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = Boolean(value);
      return;
    }
    field.value = value ?? "";
  });

  if (dom.cartonPresetSelect) {
    dom.cartonPresetSelect.value = state.settings.cartonRules.preset;
  }

  const customsBrokerField = document.querySelector('[data-settings-path="shipping12m.customsBrokerFixedEurPerShipment"]');
  if (customsBrokerField) {
    customsBrokerField.disabled = !state.settings.shipping12m.customsBrokerEnabled;
  }
  const insuranceBasisField = document.querySelector('[data-settings-path="shipping12m.insurance.basis"]');
  const insuranceRateField = document.querySelector('[data-settings-path="shipping12m.insurance.ratePct"]');
  const insuranceEnabled = Boolean(state.settings.shipping12m.insurance?.enabled);
  if (insuranceBasisField) {
    insuranceBasisField.disabled = !insuranceEnabled;
  }
  if (insuranceRateField) {
    insuranceRateField.disabled = !insuranceEnabled;
  }
  const surchargeField = document.querySelector('[data-settings-path="shipping12m.manualSurchargeEurPerShipment"]');
  if (surchargeField) {
    surchargeField.disabled = !Boolean(state.settings.shipping12m.manualSurchargeEnabled);
  }
  applySoftLocksToUI();
}

function toSortedDims(lengthCm, widthCm, heightCm) {
  return [num(lengthCm), num(widthCm), num(heightCm)].sort((a, b) => b - a);
}

function dimsFit(sortedDims, maxDims) {
  const sortedMax = [...maxDims].sort((a, b) => b - a);
  return (
    sortedDims[0] <= sortedMax[0] &&
    sortedDims[1] <= sortedMax[1] &&
    sortedDims[2] <= sortedMax[2]
  );
}

function fbaProfileLabel(profile) {
  return profile === "apparel" ? "Apparel" : "Standard";
}

function resolveFbaProfile(product) {
  return product?.basic?.category === "apparel" ? "apparel" : "standard";
}

function calculateFbaShippingWeightG(product, settings) {
  const actualWeightG = Math.max(0, num(product?.basic?.netWeightG, 0));
  const lengthCm = Math.max(0, num(product?.basic?.packLengthCm, 0));
  const widthCm = Math.max(0, num(product?.basic?.packWidthCm, 0));
  const heightCm = Math.max(0, num(product?.basic?.packHeightCm, 0));
  const volumetricDivisor = clamp(
    num(settings?.amazonFba?.de?.volumetricDivisor, AMAZON_FBA_DE_DEFAULT_VOLUMETRIC_DIVISOR),
    3000,
    10000,
  );
  const dimensionalWeightG = Math.max(0, ((lengthCm * widthCm * heightCm) / Math.max(1, volumetricDivisor)) * 1000);
  const shippingWeightG = Math.max(actualWeightG, dimensionalWeightG);
  return {
    actualWeightG: Math.ceil(actualWeightG),
    dimensionalWeightG: Math.ceil(dimensionalWeightG),
    shippingWeightG: Math.ceil(shippingWeightG),
    volumetricDivisor,
  };
}

function resolveFbaTierFee(tier, shippingWeightG) {
  if (!tier || !tier.pricing) {
    return null;
  }
  const pricing = tier.pricing;
  if (pricing.type === "bands") {
    const matchedBand = (pricing.bands ?? []).find((band) => shippingWeightG <= num(band.maxWeightG, 0));
    if (!matchedBand) {
      return null;
    }
    return round2(num(matchedBand.feeEur, 0));
  }
  if (pricing.type === "base_plus_step") {
    const baseWeightG = Math.max(1, num(pricing.baseWeightG, 100));
    const baseFeeEur = Math.max(0, num(pricing.baseFeeEur, 0));
    const stepWeightG = Math.max(1, num(pricing.stepWeightG, 100));
    const stepFeeEur = Math.max(0, num(pricing.stepFeeEur, 0));
    if (shippingWeightG <= baseWeightG) {
      return round2(baseFeeEur);
    }
    const steps = Math.max(0, Math.ceil((shippingWeightG - baseWeightG) / stepWeightG));
    return round2(baseFeeEur + steps * stepFeeEur);
  }
  return null;
}

function findFbaTierDe2026(profile, sortedDims, shippingWeightG) {
  const tiers = FBA_RATECARD_DE_2026[profile] ?? FBA_RATECARD_DE_2026.standard;
  for (const tier of tiers) {
    if (!dimsFit(sortedDims, tier.maxDimsCm)) {
      continue;
    }
    const maxShippingWeightG = num(tier.maxShippingWeightG, Number.POSITIVE_INFINITY);
    if (shippingWeightG > maxShippingWeightG) {
      continue;
    }
    const fee = resolveFbaTierFee(tier, shippingWeightG);
    if (fee === null) {
      continue;
    }
    return { tier, fee };
  }
  return null;
}

function findCheaperTargetForTier(tier, shippingWeightG, currentFee) {
  if (!tier || !tier.pricing) {
    return null;
  }
  const pricing = tier.pricing;
  if (pricing.type === "bands") {
    const bands = Array.isArray(pricing.bands) ? pricing.bands : [];
    const options = bands
      .filter((band) => num(band.feeEur, Number.POSITIVE_INFINITY) < currentFee)
      .map((band) => {
        const targetWeightMaxG = Math.max(1, roundInt(band.maxWeightG, 1));
        const weightReductionNeededG = Math.max(0, Math.ceil(shippingWeightG - targetWeightMaxG));
        return {
          targetFeeEur: round2(num(band.feeEur, 0)),
          targetWeightMaxG,
          weightReductionNeededG,
        };
      });
    if (options.length === 0) {
      return null;
    }
    options.sort((a, b) => a.weightReductionNeededG - b.weightReductionNeededG || b.targetFeeEur - a.targetFeeEur);
    return options[0];
  }

  if (pricing.type === "base_plus_step") {
    const baseWeightG = Math.max(1, roundInt(pricing.baseWeightG, 100));
    const baseFeeEur = Math.max(0, num(pricing.baseFeeEur, 0));
    const stepWeightG = Math.max(1, roundInt(pricing.stepWeightG, 100));
    const stepFeeEur = Math.max(0.000001, num(pricing.stepFeeEur, 0.01));
    const tierMaxWeight = Math.max(1, roundInt(num(tier.maxShippingWeightG, Number.POSITIVE_INFINITY), 1));
    const feasibleUpper = Math.min(shippingWeightG, tierMaxWeight);
    if (!Number.isFinite(feasibleUpper) || feasibleUpper <= 0) {
      return null;
    }

    const maxFeeAllowed = currentFee - 0.0001;
    if (maxFeeAllowed < baseFeeEur) {
      return null;
    }
    const maxAllowedSteps = Math.floor((maxFeeAllowed - baseFeeEur) / stepFeeEur);
    if (maxAllowedSteps < 0) {
      return null;
    }
    const targetWeightMaxG = Math.max(baseWeightG, Math.min(tierMaxWeight, baseWeightG + maxAllowedSteps * stepWeightG));
    const weightReductionNeededG = Math.max(0, Math.ceil(shippingWeightG - targetWeightMaxG));
    const targetFeeEur = resolveFbaTierFee(tier, targetWeightMaxG);
    if (targetFeeEur === null || targetFeeEur >= currentFee) {
      return null;
    }
    return {
      targetFeeEur: round2(targetFeeEur),
      targetWeightMaxG,
      weightReductionNeededG,
    };
  }

  return null;
}

function computeFbaDimensionReductionNeed(sortedDims, maxDimsCm) {
  const sortedMax = [...maxDimsCm].sort((a, b) => b - a);
  const reductions = sortedDims.map((value, index) => Math.max(0, value - sortedMax[index]));
  const total = reductions.reduce((sum, value) => sum + value, 0);
  const pctByAxis = reductions.map((value, index) => {
    const base = Math.max(0.000001, num(sortedDims[index], 0));
    return (value / base) * 100;
  });
  const totalBase = sortedDims.reduce((sum, value) => sum + Math.max(0, num(value, 0)), 0);
  const totalPct = totalBase > 0 ? (total / totalBase) * 100 : 0;
  return {
    byAxis: reductions,
    total,
    perSideMax: Math.max(...reductions),
    pctByAxis,
    totalPct,
  };
}

function formatFbaDimReductionText(reductionByAxis, reductionPctByAxis = []) {
  const axisLabels = ["lange Seite", "mittlere Seite", "kurze Seite"];
  const parts = [];
  reductionByAxis.forEach((value, index) => {
    if (value > 0) {
      const pct = num(reductionPctByAxis[index], 0);
      parts.push(`${axisLabels[index]} -${formatNumber(round2(value))} cm (-${formatPercent(pct)})`);
    }
  });
  return parts.join(", ");
}

function buildFbaOptimizationHints(profile, sortedDims, shippingWeightG, matchedTier, currentFee) {
  const weightByPct = Math.max(1, Math.ceil(shippingWeightG * (FBA_OPTIMIZATION_LIMITS.maxWeightReductionPct / 100)));
  const maxWeightReductionAllowedG = Math.max(
    1,
    Math.min(weightByPct, Math.max(1, roundInt(FBA_OPTIMIZATION_LIMITS.maxWeightReductionGCap, 250))),
  );
  const maxDimReductionAllowedByAxis = sortedDims.map((value) => {
    const byPct = Math.max(0, value * (FBA_OPTIMIZATION_LIMITS.maxDimReductionPctPerSide / 100));
    return Math.min(byPct, FBA_OPTIMIZATION_LIMITS.maxDimReductionCmPerSideCap);
  });
  const sumDims = sortedDims.reduce((sum, value) => sum + Math.max(0, value), 0);
  const maxDimReductionAllowedTotal = Math.min(
    Math.max(0, sumDims * (FBA_OPTIMIZATION_LIMITS.maxDimReductionPctTotal / 100)),
    FBA_OPTIMIZATION_LIMITS.maxDimReductionCmTotalCap,
  );
  const hints = [];

  const sameTierTarget = findCheaperTargetForTier(matchedTier, shippingWeightG, currentFee);
  if (sameTierTarget && sameTierTarget.weightReductionNeededG > 0 && sameTierTarget.weightReductionNeededG <= maxWeightReductionAllowedG) {
    const savings = round2(currentFee - sameTierTarget.targetFeeEur);
    if (savings > 0) {
      const reductionPct = shippingWeightG > 0 ? (sameTierTarget.weightReductionNeededG / shippingWeightG) * 100 : 0;
      hints.push({
        id: "same_tier_weight",
        type: "weight_band",
        savingsEur: savings,
        text: `Mit ca. ${formatNumber(sameTierTarget.weightReductionNeededG)} g (-${formatPercent(reductionPct)}) weniger Versandgewicht könntest du auf ${formatCurrency(sameTierTarget.targetFeeEur)} fallen (${formatCurrency(savings)} weniger, z. B. durch weniger Verpackungsmaterial).`,
      });
    }
  }

  const tiers = FBA_RATECARD_DE_2026[profile] ?? FBA_RATECARD_DE_2026.standard;
  const crossTierOptions = [];
  tiers.forEach((tier) => {
    if (tier.key === matchedTier.key) {
      return;
    }
    const target = findCheaperTargetForTier(tier, shippingWeightG, currentFee);
    if (!target) {
      return;
    }
    const dimNeed = computeFbaDimensionReductionNeed(sortedDims, tier.maxDimsCm);
    const exceedsAxisThreshold = dimNeed.byAxis.some((value, index) => value > maxDimReductionAllowedByAxis[index]);
    if (
      exceedsAxisThreshold ||
      dimNeed.total > maxDimReductionAllowedTotal ||
      target.weightReductionNeededG > maxWeightReductionAllowedG
    ) {
      return;
    }
    const savings = round2(currentFee - target.targetFeeEur);
    if (savings <= 0) {
      return;
    }
    if (dimNeed.total <= 0 && target.weightReductionNeededG <= 0) {
      return;
    }
    const changes = [];
    if (target.weightReductionNeededG > 0) {
      const reductionPct = shippingWeightG > 0 ? (target.weightReductionNeededG / shippingWeightG) * 100 : 0;
      changes.push(`Gewicht -${formatNumber(target.weightReductionNeededG)} g (-${formatPercent(reductionPct)})`);
    }
    const dimText = formatFbaDimReductionText(dimNeed.byAxis, dimNeed.pctByAxis);
    if (dimText) {
      changes.push(dimText);
    }
    crossTierOptions.push({
      savingsEur: savings,
      effortScore: target.weightReductionNeededG + dimNeed.total * 120,
      text: `Potenzial zur günstigeren Kategorie "${tier.label}": ${changes.join(" · ")} -> ${formatCurrency(target.targetFeeEur)} (${formatCurrency(savings)} weniger, sofern realistisch umsetzbar).`,
    });
  });
  crossTierOptions.sort((a, b) => b.savingsEur - a.savingsEur || a.effortScore - b.effortScore);
  const bestCrossTier = crossTierOptions[0];
  if (bestCrossTier) {
    hints.push({
      id: "cross_tier",
      type: "tier_drop",
      savingsEur: bestCrossTier.savingsEur,
      text: bestCrossTier.text,
    });
  }

  return hints.slice(0, 2);
}

function estimateFbaFee(product, resolved, settings = state.settings) {
  const marketplace = String(product?.basic?.marketplace ?? "").toUpperCase();
  const rateCardVersion = settings?.amazonFba?.de?.rateCardVersion ?? AMAZON_FBA_DE_RATECARD_VERSION;
  const rateCardUrl = String(settings?.amazonFba?.de?.sourceUrl ?? AMAZON_FBA_DE_RATECARD_DEFAULT_URL).trim() || AMAZON_FBA_DE_RATECARD_DEFAULT_URL;
  const profile = resolveFbaProfile(product);
  const weights = calculateFbaShippingWeightG(product, settings);
  const dims = toSortedDims(
    product?.basic?.packLengthCm,
    product?.basic?.packWidthCm,
    product?.basic?.packHeightCm,
  );

  if (resolved.useManualFbaFee) {
    return {
      fee: Math.max(0, num(resolved.manualFbaFee)),
      tierKey: "manual_override",
      tierLabel: "Manuell",
      source: "manual",
      rateCardVersion,
      rateCardUrl,
      profile,
      profileLabel: fbaProfileLabel(profile),
      actualWeightG: weights.actualWeightG,
      dimensionalWeightG: weights.dimensionalWeightG,
      shippingWeightG: weights.shippingWeightG,
      fallbackReason: "",
      volumetricDivisor: weights.volumetricDivisor,
      optimizationHints: [],
    };
  }

  if (marketplace !== "DE") {
    return {
      fee: Math.max(0, num(resolved.manualFbaFee)),
      tierKey: "fallback_non_de",
      tierLabel: "Fallback (manuell)",
      source: "fallback_non_de",
      rateCardVersion,
      rateCardUrl,
      profile,
      profileLabel: fbaProfileLabel(profile),
      actualWeightG: weights.actualWeightG,
      dimensionalWeightG: weights.dimensionalWeightG,
      shippingWeightG: weights.shippingWeightG,
      fallbackReason: "Auto-Berechnung ist aktuell nur für Amazon.de aktiv.",
      volumetricDivisor: weights.volumetricDivisor,
      optimizationHints: [],
    };
  }

  const matched = findFbaTierDe2026(profile, dims, weights.shippingWeightG);
  if (matched) {
    return {
      fee: matched.fee,
      tierKey: matched.tier.key,
      tierLabel: matched.tier.label,
      source: "auto",
      rateCardVersion,
      rateCardUrl,
      profile,
      profileLabel: fbaProfileLabel(profile),
      actualWeightG: weights.actualWeightG,
      dimensionalWeightG: weights.dimensionalWeightG,
      shippingWeightG: weights.shippingWeightG,
      fallbackReason: "",
      volumetricDivisor: weights.volumetricDivisor,
      optimizationHints: buildFbaOptimizationHints(profile, dims, weights.shippingWeightG, matched.tier, matched.fee),
    };
  }

  return {
    fee: Math.max(0, num(resolved.manualFbaFee)),
    tierKey: "fallback_no_tier",
    tierLabel: "Kein Tier-Match (Fallback manuell)",
    source: "fallback_no_tier",
    rateCardVersion,
    rateCardUrl,
    profile,
    profileLabel: fbaProfileLabel(profile),
    actualWeightG: weights.actualWeightG,
    dimensionalWeightG: weights.dimensionalWeightG,
    shippingWeightG: weights.shippingWeightG,
    fallbackReason: "Kein DE-Ratecard-Tier-Match für Maße/Gewicht; daher wird der manuelle FBA-Wert verwendet.",
    volumetricDivisor: weights.volumetricDivisor,
    optimizationHints: [],
  };
}

function resolveValue(isOverride, overrideValue, defaultValue, min = 0, max = Number.POSITIVE_INFINITY) {
  const picked = isOverride ? num(overrideValue, defaultValue) : num(defaultValue, 0);
  return clamp(picked, min, max);
}

function assumedText(isOverride, defaultValue, activeValue, formatter) {
  if (isOverride) {
    return `Override aktiv: ${formatter(activeValue)}`;
  }
  return `Default: ${formatter(defaultValue)}`;
}

function cartonizationSourceLabel(source) {
  if (source === "manual_override") {
    return "Manuell (Packing-List Override)";
  }
  return "Automatisch nach maximal zulässigen Karton-Grenzen";
}

function cartonizationSelectionReasonLabel(reason) {
  if (reason === "manual_override") {
    return "Manueller Override aktiv";
  }
  if (reason === "auto_cap_downshift_exact_fit") {
    return "Kandidatenwert reduziert, weil dafür keine exakte Anordnung im zulässigen Umkarton möglich war";
  }
  return "Kandidatenwert passt ohne Anpassung";
}

function cartonizationSelectionActionLabel(reason) {
  if (reason === "auto_cap_downshift_exact_fit") {
    return "Was tun: Stück je Umkarton reduzieren oder reale Umkartonmaße manuell setzen.";
  }
  if (reason === "manual_override") {
    return "Was tun: Nur prüfen, ob manuelle Maße/Gewicht zur Stückzahl plausibel sind.";
  }
  return "Keine Aktion nötig.";
}

function buildDimensionOrientations(lengthCm, widthCm, heightCm) {
  const variants = [
    [lengthCm, widthCm, heightCm],
    [lengthCm, heightCm, widthCm],
    [widthCm, lengthCm, heightCm],
    [widthCm, heightCm, lengthCm],
    [heightCm, lengthCm, widthCm],
    [heightCm, widthCm, lengthCm],
  ];
  const seen = new Set();
  return variants.filter((dims) => {
    const key = dims.map((value) => value.toFixed(4)).join("|");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function bestOrientationFitForCarton(unitDims, cartonDims, outerBufferCm) {
  const safeBuffer = Math.max(0, num(outerBufferCm, 0));
  const safeCarton = {
    lengthCm: Math.max(0, num(cartonDims?.lengthCm, 0)),
    widthCm: Math.max(0, num(cartonDims?.widthCm, 0)),
    heightCm: Math.max(0, num(cartonDims?.heightCm, 0)),
  };
  const orientations = buildDimensionOrientations(unitDims[0], unitDims[1], unitDims[2]);
  let best = null;

  orientations.forEach(([unitL, unitW, unitH]) => {
    const maxNx = Math.max(0, Math.floor((safeCarton.lengthCm - safeBuffer) / Math.max(0.000001, unitL)));
    const maxNy = Math.max(0, Math.floor((safeCarton.widthCm - safeBuffer) / Math.max(0.000001, unitW)));
    const maxNz = Math.max(0, Math.floor((safeCarton.heightCm - safeBuffer) / Math.max(0.000001, unitH)));
    const maxUnits = maxNx * maxNy * maxNz;
    const candidate = {
      orientation: [unitL, unitW, unitH],
      nx: maxNx,
      ny: maxNy,
      nz: maxNz,
      maxUnits,
    };
    if (!best) {
      best = candidate;
      return;
    }
    if (candidate.maxUnits > best.maxUnits) {
      best = candidate;
      return;
    }
    if (candidate.maxUnits === best.maxUnits) {
      const bestFootprint = best.nx * best.ny;
      const candidateFootprint = candidate.nx * candidate.ny;
      if (candidateFootprint > bestFootprint) {
        best = candidate;
      }
    }
  });

  return best;
}

function maxUnitsByDimensionCap(unitDims, hardCaps, outerBufferCm, minUnits = 1) {
  const best = bestOrientationFitForCarton(unitDims, hardCaps, outerBufferCm);
  const safeMin = Math.max(0, roundInt(minUnits, 0));
  return Math.max(safeMin, num(best?.maxUnits, 0));
}

function calculateCartonLayoutPreview(options) {
  const unitDims = Array.isArray(options?.unitDims) ? options.unitDims : [0, 0, 0];
  const cartonDims = options?.cartonDims ?? {};
  const requestedUnits = Math.max(1, roundInt(options?.units, 1));
  const outerBufferCm = Math.max(0, num(options?.outerBufferCm, 0));
  const manualEnabled = Boolean(options?.manualEnabled);
  const manualDimsDeclared = Boolean(options?.manualDimsDeclared);

  const best = bestOrientationFitForCarton(unitDims, cartonDims, outerBufferCm);
  const defaultFitType = manualEnabled
    ? (manualDimsDeclared ? "manual_declared" : "manual_estimated")
    : "auto";
  if (!best || best.maxUnits <= 0 || best.nx <= 0 || best.ny <= 0 || best.nz <= 0) {
    return {
      available: false,
      orientation: null,
      nx: 0,
      ny: 0,
      nz: 0,
      placedUnits: 0,
      freeAreaPctTopView: 100,
      fitType: "fallback",
    };
  }

  const placedUnits = Math.max(0, Math.min(requestedUnits, best.maxUnits));
  const topSlots = Math.max(1, best.nx * best.ny);
  const placedTopView = Math.min(topSlots, placedUnits);
  const freeAreaPctTopView = clamp(((topSlots - placedTopView) / topSlots) * 100, 0, 100);

  return {
    available: true,
    orientation: best.orientation,
    nx: best.nx,
    ny: best.ny,
    nz: best.nz,
    placedUnits,
    freeAreaPctTopView,
    fitType: defaultFitType,
  };
}

function computeShippingLayoutPreview(options) {
  const unitDims = Array.isArray(options?.unitDims) ? options.unitDims : [0, 0, 0];
  const cartonDims = options?.cartonDims ?? {};
  const requestedUnits = Math.max(1, roundInt(options?.units, 1));
  const outerBufferCm = Math.max(0, num(options?.outerBufferCm, 0));
  const manualEnabled = Boolean(options?.manualEnabled);
  const manualDimsDeclared = Boolean(options?.manualDimsDeclared);
  const defaultFitType = manualEnabled
    ? (manualDimsDeclared ? "manual_declared" : "manual_estimated")
    : "auto";
  const orientationCount = buildDimensionOrientations(
    Math.max(0.000001, num(unitDims[0], 0)),
    Math.max(0.000001, num(unitDims[1], 0)),
    Math.max(0.000001, num(unitDims[2], 0)),
  ).length;
  const fallbackPreview = calculateCartonLayoutPreview(options);
  const fallbackCapacity = Math.max(0, roundInt(fallbackPreview.nx, 0) * roundInt(fallbackPreview.ny, 0) * roundInt(fallbackPreview.nz, 0));
  const fallbackPlaced = Math.max(0, roundInt(fallbackPreview.placedUnits, 0));
  const fallbackClipped = Math.max(0, fallbackPlaced - SHIPPING_3D_MAX_RENDER_UNITS);
  const cartonLengthCm = Math.max(0, num(cartonDims.lengthCm, 0));
  const cartonWidthCm = Math.max(0, num(cartonDims.widthCm, 0));
  const cartonHeightCm = Math.max(0, num(cartonDims.heightCm, 0));
  const unitVolumeCbm = (Math.max(0, num(unitDims[0], 0)) * Math.max(0, num(unitDims[1], 0)) * Math.max(0, num(unitDims[2], 0))) / 1_000_000;
  const cartonVolumeCbm = (cartonLengthCm * cartonWidthCm * cartonHeightCm) / 1_000_000;

  const mapFallbackPreview = () => ({
    ...fallbackPreview,
    fitType: fallbackPreview.available ? defaultFitType : "fallback",
    capacityUnits: fallbackCapacity,
    clippedUnits: fallbackClipped,
    reasonCode: !fallbackPreview.available ? "no_fit" : (fallbackClipped > 0 ? "clipped_render" : "ok"),
    evaluatedOrientationCount: orientationCount,
    freeVolumeCbm: Math.max(0, cartonVolumeCbm - fallbackPlaced * unitVolumeCbm),
    freeVolumeLiters: Math.max(0, cartonVolumeCbm - fallbackPlaced * unitVolumeCbm) * 1000,
  });

  if (!(window.Packaging3D && typeof window.Packaging3D.computeLayout === "function")) {
    return mapFallbackPreview();
  }

  try {
    const modulePreview = window.Packaging3D.computeLayout({
      unitDimsCm: unitDims,
      cartonDimsCm: [cartonLengthCm, cartonWidthCm, cartonHeightCm],
      targetUnits: requestedUnits,
      outerBufferCm,
      allowSixOrientations: true,
      mode: "maximal",
      renderLimit: SHIPPING_3D_MAX_RENDER_UNITS,
    });
    if (!modulePreview || !modulePreview.available) {
      const fallback = mapFallbackPreview();
      return {
        ...fallback,
        reasonCode: modulePreview?.reasonCode ?? fallback.reasonCode,
      };
    }

    return {
      available: true,
      orientation: Array.isArray(modulePreview.orientationCm) ? modulePreview.orientationCm : null,
      nx: Math.max(0, roundInt(modulePreview.nx, 0)),
      ny: Math.max(0, roundInt(modulePreview.ny, 0)),
      nz: Math.max(0, roundInt(modulePreview.nz, 0)),
      placedUnits: Math.max(0, roundInt(modulePreview.placedUnits, 0)),
      freeAreaPctTopView: clamp(num(modulePreview.freeAreaTopPct, 0), 0, 100),
      fitType: defaultFitType,
      capacityUnits: Math.max(0, roundInt(modulePreview.capacityUnits, 0)),
      clippedUnits: Math.max(0, roundInt(modulePreview.clippedUnits, 0)),
      reasonCode: modulePreview.reasonCode || "ok",
      evaluatedOrientationCount: Math.max(0, roundInt(modulePreview.evaluatedOrientationCount, orientationCount)),
      freeVolumeCbm: Math.max(0, num(modulePreview.freeVolumeCbm, 0)),
      freeVolumeLiters: Math.max(0, num(modulePreview.freeVolumeLiters, 0)),
    };
  } catch (error) {
    console.error("Packaging3D computeLayout failed; fallback preview active.", error);
    return mapFallbackPreview();
  }
}

function buildCartonCandidates(options) {
  const {
    unitDims,
    unitCbm,
    unitGrossKg,
    hardCaps,
    softCaps,
    outerBufferCm,
  } = options;
  const candidates = [];
  const orientations = buildDimensionOrientations(unitDims[0], unitDims[1], unitDims[2]);
  const maxAxisSteps = 40;

  orientations.forEach(([unitL, unitW, unitH]) => {
    const maxNxHard = Math.min(maxAxisSteps, Math.max(0, Math.floor((hardCaps.lengthCm - outerBufferCm) / unitL)));
    const maxNyHard = Math.min(maxAxisSteps, Math.max(0, Math.floor((hardCaps.widthCm - outerBufferCm) / unitW)));
    const maxNzHard = Math.min(maxAxisSteps, Math.max(0, Math.floor((hardCaps.heightCm - outerBufferCm) / unitH)));

    if (maxNxHard < 1 || maxNyHard < 1 || maxNzHard < 1) {
      return;
    }

    for (let nx = 1; nx <= maxNxHard; nx += 1) {
      for (let ny = 1; ny <= maxNyHard; ny += 1) {
        const maxNzByWeight = Math.max(0, Math.floor(hardCaps.weightKg / Math.max(0.000001, unitGrossKg * nx * ny)));
        const nzLimit = Math.min(maxNzHard, maxNzByWeight);
        if (nzLimit < 1) {
          continue;
        }
        for (let nz = 1; nz <= nzLimit; nz += 1) {
          const units = nx * ny * nz;
          const cartonLengthCm = nx * unitL + outerBufferCm;
          const cartonWidthCm = ny * unitW + outerBufferCm;
          const cartonHeightCm = nz * unitH + outerBufferCm;
          const cartonGrossKg = units * unitGrossKg;
          const cartonCbm = (cartonLengthCm * cartonWidthCm * cartonHeightCm) / 1_000_000;
          const utilization = cartonCbm > 0 ? (units * unitCbm) / cartonCbm : 0;

          const hardValid =
            cartonLengthCm <= hardCaps.lengthCm &&
            cartonWidthCm <= hardCaps.widthCm &&
            cartonHeightCm <= hardCaps.heightCm &&
            cartonGrossKg <= hardCaps.weightKg;
          if (!hardValid) {
            continue;
          }

          const softValid =
            cartonLengthCm <= softCaps.lengthCm &&
            cartonWidthCm <= softCaps.widthCm &&
            cartonHeightCm <= softCaps.heightCm &&
            cartonGrossKg <= softCaps.weightKg;

          candidates.push({
            units,
            nx,
            ny,
            nz,
            cartonLengthCm,
            cartonWidthCm,
            cartonHeightCm,
            cartonGrossKg,
            cartonCbm,
            utilization,
            hardValid,
            softValid,
          });
        }
      }
    }
  });

  return candidates;
}

function compareConservativeCandidates(a, b) {
  if (b.units !== a.units) {
    return b.units - a.units;
  }
  if (Math.abs(b.utilization - a.utilization) > 1e-6) {
    return b.utilization - a.utilization;
  }
  const aMaxDim = Math.max(a.cartonLengthCm, a.cartonWidthCm, a.cartonHeightCm);
  const bMaxDim = Math.max(b.cartonLengthCm, b.cartonWidthCm, b.cartonHeightCm);
  if (Math.abs(aMaxDim - bMaxDim) > 1e-6) {
    return aMaxDim - bMaxDim;
  }
  const aWeightDelta = Math.abs(a.cartonGrossKg - 16);
  const bWeightDelta = Math.abs(b.cartonGrossKg - 16);
  if (Math.abs(aWeightDelta - bWeightDelta) > 1e-6) {
    return aWeightDelta - bWeightDelta;
  }
  return a.cartonCbm - b.cartonCbm;
}

function candidateMaxDim(candidate) {
  return Math.max(candidate.cartonLengthCm, candidate.cartonWidthCm, candidate.cartonHeightCm);
}

function candidateWeightFill(candidate, capWeightKg) {
  const divisor = Math.max(0.000001, num(capWeightKg, 1));
  return clamp(candidate.cartonGrossKg / divisor, 0, 1.2);
}

function candidateCompactness(candidate, hardCaps) {
  const hardLongest = Math.max(hardCaps.lengthCm, hardCaps.widthCm, hardCaps.heightCm);
  const ratio = candidateMaxDim(candidate) / Math.max(0.000001, hardLongest);
  return clamp(1 - ratio, 0, 1);
}

function candidateDensityRatio(candidate) {
  const density = candidate.units / Math.max(0.000001, candidate.cartonCbm);
  return clamp(density / 5000, 0, 1);
}

function scoreBalancedCandidate(candidate, hardCaps, softCaps) {
  const weightCap = candidate.softValid ? softCaps.weightKg : hardCaps.weightKg;
  const utilization = clamp(candidate.utilization, 0, 1.2);
  return (
    candidate.units * 100 +
    utilization * 25 +
    candidateWeightFill(candidate, weightCap) * 10 +
    candidateCompactness(candidate, hardCaps) * 5 +
    (candidate.softValid ? 12 : 0)
  );
}

function scoreMaximalCandidate(candidate, hardCaps) {
  const utilization = clamp(candidate.utilization, 0, 1.2);
  return (
    candidate.units * 100 +
    candidateDensityRatio(candidate) * 35 +
    utilization * 20 +
    candidateWeightFill(candidate, hardCaps.weightKg) * 12 +
    candidateCompactness(candidate, hardCaps) * 5
  );
}

function selectTopByScore(candidates, scoreFn) {
  const sorted = [...candidates].sort((a, b) => {
    const scoreDiff = scoreFn(b) - scoreFn(a);
    if (Math.abs(scoreDiff) > 0.0001) {
      return scoreDiff;
    }
    return compareConservativeCandidates(a, b);
  });
  return sorted[0] ?? null;
}

function selectCartonCandidateByMode(candidates, mode, hardCaps, softCaps) {
  const softCandidates = candidates.filter((candidate) => candidate.softValid);
  if (mode === "maximal") {
    return selectTopByScore(candidates, (candidate) => scoreMaximalCandidate(candidate, hardCaps));
  }
  if (mode === "balanced") {
    return selectTopByScore(candidates, (candidate) => scoreBalancedCandidate(candidate, hardCaps, softCaps));
  }
  const pool = softCandidates.length > 0 ? softCandidates : candidates;
  const sorted = [...pool].sort(compareConservativeCandidates);
  return sorted[0] ?? null;
}

function estimateCartonForExactUnits(options) {
  const {
    unitDims,
    unitGrossKg,
    hardCaps,
    softCaps,
    outerBufferCm,
    targetUnits,
  } = options;
  if (!Number.isFinite(targetUnits) || targetUnits < 1) {
    return null;
  }
  const normalizedTarget = Math.max(1, roundInt(targetUnits, 1));
  const orientations = buildDimensionOrientations(unitDims[0], unitDims[1], unitDims[2]);
  const candidates = [];

  orientations.forEach(([unitL, unitW, unitH]) => {
    for (let nx = 1; nx <= normalizedTarget; nx += 1) {
      if (normalizedTarget % nx !== 0) {
        continue;
      }
      const remainAfterX = normalizedTarget / nx;
      for (let ny = 1; ny <= remainAfterX; ny += 1) {
        if (remainAfterX % ny !== 0) {
          continue;
        }
        const nz = remainAfterX / ny;
        const cartonLengthCm = nx * unitL + outerBufferCm;
        const cartonWidthCm = ny * unitW + outerBufferCm;
        const cartonHeightCm = nz * unitH + outerBufferCm;
        const cartonGrossKg = normalizedTarget * unitGrossKg;
        const hardValid =
          cartonLengthCm <= hardCaps.lengthCm &&
          cartonWidthCm <= hardCaps.widthCm &&
          cartonHeightCm <= hardCaps.heightCm &&
          cartonGrossKg <= hardCaps.weightKg;
        if (!hardValid) {
          continue;
        }
        const softValid =
          cartonLengthCm <= softCaps.lengthCm &&
          cartonWidthCm <= softCaps.widthCm &&
          cartonHeightCm <= softCaps.heightCm &&
          cartonGrossKg <= softCaps.weightKg;
        const cartonCbm = (cartonLengthCm * cartonWidthCm * cartonHeightCm) / 1_000_000;
        candidates.push({
          cartonLengthCm,
          cartonWidthCm,
          cartonHeightCm,
          cartonGrossKg,
          cartonCbm,
          nx,
          ny,
          nz,
          orientation: [unitL, unitW, unitH],
          softValid,
        });
      }
    }
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    if (a.softValid !== b.softValid) {
      return a.softValid ? -1 : 1;
    }
    const aMax = Math.max(a.cartonLengthCm, a.cartonWidthCm, a.cartonHeightCm);
    const bMax = Math.max(b.cartonLengthCm, b.cartonWidthCm, b.cartonHeightCm);
    if (Math.abs(aMax - bMax) > 1e-6) {
      return aMax - bMax;
    }
    if (Math.abs(a.cartonCbm - b.cartonCbm) > 1e-9) {
      return a.cartonCbm - b.cartonCbm;
    }
    return Math.abs(a.cartonGrossKg - 16) - Math.abs(b.cartonGrossKg - 16);
  });

  return candidates[0];
}

function calculateShippingDoorToDoor(product, settings = state.settings) {
  const basic = product.basic;
  const rules = settings.cartonRules;
  const shipping = ensureShipping12mSettings(settings.shipping12m);
  const modeKey = normalizeShippingMode(basic.transportMode);
  const modeLabel = shippingModeLabel(modeKey);
  const modeSettings = shipping?.modes?.[modeKey] ?? shipping?.modes?.sea_lcl ?? DEFAULT_SETTINGS.shipping12m.modes.sea_lcl;

  const lengthCm = Math.max(0.1, num(basic.packLengthCm, 0.1));
  const widthCm = Math.max(0.1, num(basic.packWidthCm, 0.1));
  const heightCm = Math.max(0.1, num(basic.packHeightCm, 0.1));
  const unitWeightKgNet = Math.max(0.001, num(basic.netWeightG, 1) / 1000);
  const unitsPerOrder = Math.max(1, roundInt(basic.unitsPerOrder, 1));
  const unitCbm = (lengthCm * widthCm * heightCm) / 1_000_000;

  const hardCaps = {
    lengthCm: Math.max(1, num(rules.maxLengthCm, 63.5)),
    widthCm: Math.max(1, num(rules.maxWidthCm, 63.5)),
    heightCm: Math.max(1, num(rules.maxHeightCm, 63.5)),
    weightKg: Math.max(1, num(rules.maxWeightKg, 23)),
  };
  const outerBufferCm = clamp(num(rules.outerBufferCm, 1.5), 0, 20);
  const grossWeightUpliftPct = clamp(num(rules.grossWeightUpliftPct, 5), 0, 50);
  const equivalentFillPct = clamp(num(rules.equivalentCartonFillPct, 90), 50, 100);
  const unitWeightKgGross = unitWeightKgNet * (1 + grossWeightUpliftPct / 100);

  const unitDimsSorted = toSortedDims(lengthCm, widthCm, heightCm);
  const hardDimsSorted = toSortedDims(hardCaps.lengthCm, hardCaps.widthCm, hardCaps.heightCm);
  const oversizeFlag = unitDimsSorted[0] > hardDimsSorted[0] || unitDimsSorted[1] > hardDimsSorted[1] || unitDimsSorted[2] > hardDimsSorted[2];

  const assumptionsCarton = product.assumptions?.cartonization ?? {};
  const manualEnabled = Boolean(assumptionsCarton.manualEnabled);
  const unitsByWeightCap = Math.max(1, Math.floor(hardCaps.weightKg / Math.max(0.000001, unitWeightKgGross)));
  const unitsByDimensionCap = maxUnitsByDimensionCap([lengthCm, widthCm, heightCm], hardCaps, outerBufferCm);

  const estimateForUnits = (targetUnits) => estimateCartonForExactUnits({
    unitDims: [lengthCm, widthCm, heightCm],
    unitGrossKg: unitWeightKgGross,
    hardCaps,
    softCaps: hardCaps,
    outerBufferCm,
    targetUnits,
  });

  const unitsPerCartonCapCandidate = Math.max(1, Math.min(unitsByWeightCap, unitsByDimensionCap));
  let unitsPerCartonAuto = unitsPerCartonCapCandidate;
  let estimatedAuto = estimateForUnits(unitsPerCartonAuto);
  while (!estimatedAuto && unitsPerCartonAuto > 1) {
    unitsPerCartonAuto -= 1;
    estimatedAuto = estimateForUnits(unitsPerCartonAuto);
  }

  const manualUnitsPerCarton = Math.max(1, roundInt(assumptionsCarton.unitsPerCarton, unitsPerCartonAuto));

  let estimatedCartonLengthCm = estimatedAuto?.cartonLengthCm ?? (lengthCm + outerBufferCm);
  let estimatedCartonWidthCm = estimatedAuto?.cartonWidthCm ?? (widthCm + outerBufferCm);
  let estimatedCartonHeightCm = estimatedAuto?.cartonHeightCm ?? (heightCm + outerBufferCm);
  let estimatedCartonGrossWeightKg = estimatedAuto?.cartonGrossKg ?? (unitWeightKgGross * unitsPerCartonAuto);
  let manualDimensionsProvided = false;
  let manualWeightProvided = false;
  let cartonizationSource = "auto_hard_caps";
  let unitsPerCartonSelectionReason = unitsPerCartonAuto < unitsPerCartonCapCandidate
    ? "auto_cap_downshift_exact_fit"
    : "auto_cap_feasible";

  if (manualEnabled) {
    unitsPerCartonAuto = manualUnitsPerCarton;
    const manualLengthCm = Math.max(0, num(assumptionsCarton.cartonLengthCm, 0));
    const manualWidthCm = Math.max(0, num(assumptionsCarton.cartonWidthCm, 0));
    const manualHeightCm = Math.max(0, num(assumptionsCarton.cartonHeightCm, 0));
    const manualGrossKg = Math.max(0, num(assumptionsCarton.cartonGrossWeightKg, 0));
    manualDimensionsProvided = manualLengthCm > 0 && manualWidthCm > 0 && manualHeightCm > 0;
    manualWeightProvided = manualGrossKg > 0;

    if (manualDimensionsProvided) {
      estimatedCartonLengthCm = manualLengthCm;
      estimatedCartonWidthCm = manualWidthCm;
      estimatedCartonHeightCm = manualHeightCm;
    } else {
      const estimatedForManualUnits = estimateCartonForExactUnits({
        unitDims: [lengthCm, widthCm, heightCm],
        unitGrossKg: unitWeightKgGross,
        hardCaps,
        softCaps: hardCaps,
        outerBufferCm,
        targetUnits: manualUnitsPerCarton,
      });
      if (estimatedForManualUnits) {
        estimatedCartonLengthCm = estimatedForManualUnits.cartonLengthCm;
        estimatedCartonWidthCm = estimatedForManualUnits.cartonWidthCm;
        estimatedCartonHeightCm = estimatedForManualUnits.cartonHeightCm;
        estimatedCartonGrossWeightKg = estimatedForManualUnits.cartonGrossKg;
      }
    }

    if (manualWeightProvided) {
      estimatedCartonGrossWeightKg = manualGrossKg;
    } else if (!Number.isFinite(estimatedCartonGrossWeightKg) || estimatedCartonGrossWeightKg <= 0) {
      estimatedCartonGrossWeightKg = unitsPerCartonAuto * unitWeightKgGross;
    }
    cartonizationSource = "manual_override";
    unitsPerCartonSelectionReason = "manual_override";
  }
  const unitsPerCartonDownshift = manualEnabled ? 0 : Math.max(0, unitsPerCartonCapCandidate - unitsPerCartonAuto);
  const manualMaxUnitsByDimensions = manualDimensionsProvided
    ? maxUnitsByDimensionCap(
      [lengthCm, widthCm, heightCm],
      {
        lengthCm: estimatedCartonLengthCm,
        widthCm: estimatedCartonWidthCm,
        heightCm: estimatedCartonHeightCm,
      },
      outerBufferCm,
      0,
    )
    : 0;

  const physicalCartonsCount = Math.max(1, Math.ceil(unitsPerOrder / Math.max(1, unitsPerCartonAuto)));
  const cartonsCount = physicalCartonsCount;
  const cartonCbm = Math.max(
    0.000001,
    (estimatedCartonLengthCm * estimatedCartonWidthCm * estimatedCartonHeightCm) / 1_000_000,
  );
  const shipmentCbm = physicalCartonsCount * cartonCbm;

  let shipmentWeightKg = unitsPerOrder * unitWeightKgGross;
  if (manualEnabled && estimatedCartonGrossWeightKg > 0 && unitsPerCartonAuto > 0) {
    const manualGrossPerUnit = estimatedCartonGrossWeightKg / unitsPerCartonAuto;
    shipmentWeightKg = unitsPerOrder * manualGrossPerUnit;
  }
  shipmentWeightKg = Math.max(0.001, shipmentWeightKg);
  const productVolumeInCartonCbm = Math.max(0, unitCbm * unitsPerCartonAuto);
  const voidVolumeCbm = Math.max(0, cartonCbm - productVolumeInCartonCbm);
  const voidVolumeLiters = voidVolumeCbm * 1000;
  const volumeFillPct = cartonCbm > 0 ? (productVolumeInCartonCbm / cartonCbm) * 100 : 0;
  const weightFillPct = hardCaps.weightKg > 0 ? (estimatedCartonGrossWeightKg / hardCaps.weightKg) * 100 : 0;

  const manualDimWarn = manualEnabled && manualDimensionsProvided && unitsPerCartonAuto > manualMaxUnitsByDimensions;
  const manualWeightWarn = manualEnabled && manualWeightProvided && estimatedCartonGrossWeightKg > hardCaps.weightKg;
  let manualFitStatus = "n/a";
  let manualFitHint = "";
  let manualSuggestion = "";
  if (manualEnabled) {
    manualFitStatus = "ok";
    if (manualDimWarn && manualWeightWarn) {
      manualFitStatus = "warn_dim_weight";
      manualFitHint =
        `Manuelle Angabe ist nicht plausibel: ${formatNumber(unitsPerCartonAuto)} Stück je Umkarton überschreiten die Maßgrenzen und das manuelle Umkarton-Gewicht überschreitet ${formatNumber(hardCaps.weightKg)} kg.`;
      manualSuggestion =
        `Reduziere auf maximal ${formatNumber(manualMaxUnitsByDimensions)} Stück je Umkarton und senke das Umkarton-Bruttogewicht auf <= ${formatNumber(hardCaps.weightKg)} kg.`;
    } else if (manualDimWarn) {
      manualFitStatus = "warn_dim";
      manualFitHint =
        `Manuelle Maßangaben sind inkonsistent: Bei diesen Umkartonmaßen passen physisch nur ${formatNumber(manualMaxUnitsByDimensions)} Stück.`;
      manualSuggestion =
        `Reduziere Stück je Umkarton auf <= ${formatNumber(manualMaxUnitsByDimensions)} oder erhöhe die Umkartonmaße.`;
    } else if (manualWeightWarn) {
      manualFitStatus = "warn_weight";
      manualFitHint =
        `Manuelles Umkarton-Bruttogewicht liegt über der zulässigen Gewichtsgrenze von ${formatNumber(hardCaps.weightKg)} kg.`;
      manualSuggestion =
        `Reduziere das Umkarton-Bruttogewicht oder die Stück je Umkarton, bis <= ${formatNumber(hardCaps.weightKg)} kg erreicht sind.`;
    } else if (!manualDimensionsProvided && !manualWeightProvided) {
      manualFitStatus = "n/a";
      manualFitHint =
        "Für die manuelle Stückzahl werden Umkartonmaße/-gewicht aktuell geschätzt. Für einen Plausibilitätscheck bitte reale Umkartondaten ergänzen.";
      manualSuggestion =
        "Trage reale Umkartonmaße und/oder ein reales Umkarton-Bruttogewicht ein, um die Plausibilität sicher zu prüfen.";
    } else if (!manualDimensionsProvided) {
      manualFitStatus = "n/a";
      manualFitHint =
        "Manuelle Umkartonmaße fehlen. Gewicht wurde berücksichtigt, die physische Belegung nach Maßen konnte aber nicht geprüft werden.";
      manualSuggestion = "Trage reale Umkartonmaße ein, damit die Maß-Plausibilität geprüft werden kann.";
    } else {
      manualFitHint = "Manuelle Umkartonisierung ist innerhalb der zulässigen Grenzen plausibel.";
      manualSuggestion = "Keine direkte Korrektur nötig.";
    }
  }

  const layoutPreview = computeShippingLayoutPreview({
    unitDims: [lengthCm, widthCm, heightCm],
    cartonDims: {
      lengthCm: estimatedCartonLengthCm,
      widthCm: estimatedCartonWidthCm,
      heightCm: estimatedCartonHeightCm,
    },
    units: unitsPerCartonAuto,
    outerBufferCm,
    manualEnabled,
    manualDimsDeclared: manualDimensionsProvided,
  });

  const equivalentFill = equivalentFillPct / 100;
  const hardCbm = (hardCaps.lengthCm * hardCaps.widthCm * hardCaps.heightCm) / 1_000_000;
  const equivalentReferenceCbm = Math.max(0.000001, hardCbm * equivalentFill);
  const equivalentReferenceWeightKg = Math.max(0.001, hardCaps.weightKg * equivalentFill);
  const equivalentCartonsCount = Math.max(
    1,
    Math.ceil(
      Math.max(
        shipmentCbm / equivalentReferenceCbm,
        shipmentWeightKg / equivalentReferenceWeightKg,
      ),
    ),
  );

  const chargeableCbm = Math.max(shipmentCbm, shipmentWeightKg / 1000);

  const fxUsdToEur = Math.max(0, num(state.fx?.usdToEur, settings?.tax?.fallbackUsdToEur ?? DEFAULT_USD_TO_EUR));
  const exwUnitUsd = Math.max(0, num(basic.exwUnit));
  const goodsValueEur = exwUnitUsd * unitsPerOrder * fxUsdToEur;

  const insuranceEnabled = Boolean(shipping.insurance?.enabled);
  const insuranceBasis = shipping.insurance?.basis === "goods_value_eur" ? "goods_value_eur" : "goods_value_eur";
  const insuranceRatePct = clamp(num(shipping.insurance?.ratePct, 0), 0, 20);
  const insuranceBaseEur = goodsValueEur;

  const rateEurPerCbm = Math.max(0, num(modeSettings.rateEurPerCbm));
  const mainRunVariable = rateEurPerCbm * chargeableCbm;
  const destinationFixedLegacy = Math.max(0, num(modeSettings.destinationFixedEurPerShipment));

  let originBaseEurPerShipment = 0;
  let originPerCbmEur = 0;
  let originPerCartonEur = 0;
  let deOncarriageBaseEurPerShipment = 0;
  let deOncarriagePerCbmEur = 0;
  let deOncarriagePerCartonEur = 0;
  let originTotal = 0;
  let deOncarriageTotal = 0;
  let originVariableCartonBasis = "fixed";
  let deOncarriageVariableCartonBasis = "fixed";

  if (modeKey === "rail") {
    originBaseEurPerShipment = Math.max(0, num(modeSettings.originBaseEurPerShipment, modeSettings.originFixedEurPerShipment));
    originPerCbmEur = Math.max(
      0,
      num(modeSettings.originPerCbmEur, num(modeSettings.originPerCartonEur, 0) / LEGACY_RAIL_CARTON_EQUIVALENT_CBM),
    );
    originPerCartonEur = Math.max(0, num(modeSettings.originPerCartonEur, 0));
    deOncarriageBaseEurPerShipment = Math.max(
      0,
      num(modeSettings.deOncarriageBaseEurPerShipment, modeSettings.deOncarriageFixedEurPerShipment),
    );
    deOncarriagePerCbmEur = Math.max(
      0,
      num(modeSettings.deOncarriagePerCbmEur, num(modeSettings.deOncarriagePerCartonEur, 0) / LEGACY_RAIL_CARTON_EQUIVALENT_CBM),
    );
    deOncarriagePerCartonEur = Math.max(0, num(modeSettings.deOncarriagePerCartonEur, 0));
    originTotal = originBaseEurPerShipment + originPerCbmEur * shipmentCbm;
    deOncarriageTotal = deOncarriageBaseEurPerShipment + deOncarriagePerCbmEur * shipmentCbm;
    originVariableCartonBasis = "shipment_cbm";
    deOncarriageVariableCartonBasis = "shipment_cbm";
  } else {
    originBaseEurPerShipment = Math.max(0, num(modeSettings.originFixedEurPerShipment));
    deOncarriageBaseEurPerShipment = Math.max(0, num(modeSettings.deOncarriageFixedEurPerShipment));
    originTotal = originBaseEurPerShipment;
    deOncarriageTotal = deOncarriageBaseEurPerShipment;
  }

  const mainRunFixed = modeKey === "rail"
    ? Math.max(0, num(modeSettings.mainRunFixedEurPerShipment, destinationFixedLegacy))
    : destinationFixedLegacy;
  const customsBroker = shipping.customsBrokerEnabled ? Math.max(0, num(shipping.customsBrokerFixedEurPerShipment)) : 0;
  const insuranceTotal = insuranceEnabled ? insuranceBaseEur * (insuranceRatePct / 100) : 0;
  const manualSurchargeEnabled = modeKey === "rail" && Boolean(shipping.manualSurchargeEnabled);
  const manualSurchargeEurPerShipment = manualSurchargeEnabled
    ? Math.max(0, num(shipping.manualSurchargeEurPerShipment))
    : 0;
  const manualSurchargeTotal = manualSurchargeEurPerShipment;

  const shippingTotal = originTotal + mainRunVariable + mainRunFixed + deOncarriageTotal + customsBroker + insuranceTotal + manualSurchargeTotal;
  const shippingPerUnit = unitsPerOrder > 0 ? shippingTotal / unitsPerOrder : 0;

  const lines = [
    {
      key: "pre_run",
      label: "Vorlauf",
      total: originTotal,
      formula: modeKey === "rail"
        ? "Vorlauf = Vorlauf-Basis + (Vorlauf je CBM × Shipment-CBM)"
        : "Vorlauf = origin_fixed",
      source: `Global Setting -> Shipping 12M -> ${modeLabel}`,
    },
    {
      key: "main_run_variable",
      label: "Hauptlauf variabel (W/M)",
      total: mainRunVariable,
      formula: "Hauptlauf variabel = Abrechnungsvolumen (CBM) × Rate (EUR/CBM)",
      source: `Global Setting -> Shipping 12M -> ${modeLabel}`,
    },
    {
      key: "main_run_fixed",
      label: "Hauptlauf Fixkosten",
      total: mainRunFixed,
      formula: "Hauptlauf fix = main_run_fixed",
      source: `Global Setting -> Shipping 12M -> ${modeLabel}`,
    },
    {
      key: "oncarriage",
      label: "Nachlauf",
      total: deOncarriageTotal,
      formula: modeKey === "rail"
        ? "Nachlauf = Nachlauf-Basis + (Nachlauf je CBM × Shipment-CBM)"
        : "Nachlauf = de_oncarriage_fixed",
      source: `Global Setting -> Shipping 12M -> ${modeLabel}`,
    },
    {
      key: "broker",
      label: "Zollabfertigung (Broker)",
      total: customsBroker,
      formula: "Zollabfertigung = customs_broker_fixed (optional)",
      source: "Global Setting -> Shipping 12M -> Gemeinsam",
    },
    {
      key: "insurance",
      label: "Versicherung",
      total: insuranceTotal,
      formula: "Versicherung = Warenwert (EUR) × Versicherungsrate %",
      source: "Global Setting -> Shipping 12M -> Versicherung",
    },
    {
      key: "manual_surcharge",
      label: "Nachbelastung",
      total: manualSurchargeTotal,
      formula: "Nachbelastung = manual_surcharge_eur_per_shipment (optional)",
      source: "Global Setting -> Shipping 12M -> Rail",
    },
  ].map((line) => ({
    ...line,
    perUnit: unitsPerOrder > 0 ? line.total / unitsPerOrder : 0,
  }));

  const oversizeNote = oversizeFlag
    ? "Produktkante überschreitet ein maximal zulässiges Kartonmaß. Es wird konservativ mit 1 Stück je Umkarton weitergerechnet."
    : "";

  return {
    transportMode: modeKey,
    modeKey,
    modeLabel,
    unitCbm,
    unitWeightKg: unitWeightKgNet,
    unitGrossWeightKg: unitWeightKgGross,
    unitsPerOrder,
    unitsByWeightCap,
    unitsByDimensionCap,
    unitsPerCartonCapCandidate,
    unitsPerCartonDownshift,
    unitsPerCartonSelectionReason,
    unitsPerCartonAuto,
    physicalCartonsCount,
    cartonsCount,
    estimatedCartonLengthCm,
    estimatedCartonWidthCm,
    estimatedCartonHeightCm,
    estimatedCartonGrossWeightKg,
    cartonVolumeCbm: cartonCbm,
    productVolumeInCartonCbm,
    voidVolumeCbm,
    voidVolumeLiters,
    volumeFillPct,
    weightFillPct,
    cartonizationSource,
    cartonizationSourceLabel: cartonizationSourceLabel(cartonizationSource),
    manualFitStatus,
    manualMaxUnitsByDimensions,
    manualFitHint,
    manualSuggestion,
    layoutPreview,
    shipmentCbm,
    shipmentWeightKg,
    chargeableCbm,
    equivalentCartonsCount,
    equivalentReferenceCbm,
    equivalentReferenceWeightKg,
    equivalentFillPct,
    goodsValueEur,
    insuranceEnabled,
    insuranceBasis,
    insuranceRatePct,
    insuranceBaseEur,
    originBaseEurPerShipment,
    originPerCbmEur,
    originPerCartonEur,
    originTotal,
    originFixed: originTotal,
    mainRunVariable,
    mainRunFixed,
    destinationFixed: destinationFixedLegacy,
    deOncarriageBaseEurPerShipment,
    deOncarriagePerCbmEur,
    deOncarriagePerCartonEur,
    deOncarriageTotal,
    oncarriageFixed: deOncarriageTotal,
    originVariableCartonBasis,
    deOncarriageVariableCartonBasis,
    customsBroker,
    insuranceTotal,
    manualSurchargeEnabled,
    manualSurchargeEurPerShipment,
    manualSurchargeTotal,
    shippingTotal,
    shippingPerUnit,
    breakdown: lines,
    breakdownMap: Object.fromEntries(lines.map((line) => [line.key, line])),
    oversizeFlag,
    oversizeNote,
  };
}

function resolveAssumptions(product, settings = state.settings) {
  const basic = product.basic;
  const assumptions = product.assumptions;
  const category = settings.categoryDefaults[basic.category] ?? settings.categoryDefaults.generic;
  const costDefaults = settings.costDefaults ?? DEFAULT_SETTINGS.costDefaults;
  const threePlDefaults = settings.threePl ?? DEFAULT_SETTINGS.threePl;
  const listingPackages = settings.lifecycle?.listingPackages ?? DEFAULT_SETTINGS.lifecycle.listingPackages;
  const launchProfiles = settings.lifecycle?.launchProfiles ?? DEFAULT_SETTINGS.lifecycle.launchProfiles;
  const isOverrideActive = (flag) => Boolean(flag);

  const listingPackageKey = basic.listingPackage in listingPackages ? basic.listingPackage : "ai";
  const listingPackage = listingPackages[listingPackageKey] ?? listingPackages.ai;
  const launchProfileKey = basic.launchCompetition in launchProfiles ? basic.launchCompetition : "medium";
  const launchProfile = launchProfiles[launchProfileKey] ?? launchProfiles.medium;

  const defaultTacos = clamp(category.tacosRate, 0, 100);
  const defaultLaunchMultiplier = GLOBAL_DEFAULTS.launchAdsMultiplier;
  const defaultLaunchMonths = Math.max(
    1,
    Math.min(
      roundInt(basic.horizonMonths, 1),
      Math.max(GLOBAL_DEFAULTS.launchBoostMonths, Math.ceil(clamp(num(launchProfile.weeks, 6), 1, 24) / 4.345)),
    ),
  );

  const defaultReturnRate = clamp(category.returnRate, 0, 100);
  const defaultSellableShare = deriveSellableSharePct(
    category.sellableShare,
    category.unsellableShare,
    category.resaleRate,
    42,
  );
  const defaultUnsellableShareDerived = clamp(100 - defaultSellableShare, 0, 100);
  const defaultReturnHandling = GLOBAL_DEFAULTS.returnHandlingCost;

  const defaultLeakage = clamp(num(costDefaults.leakageRatePct, GLOBAL_DEFAULTS.leakageRatePct), 0, 20);
  const defaultCustomsRate = clamp(num(settings.tax?.customsDutyRatePct, GLOBAL_DEFAULTS.importCustomsDutyRate), 0, 40);
  const defaultImportVatRate = clamp(GLOBAL_DEFAULTS.importVatRate, 0, 30);
  const defaultReferralRate = clamp(category.referralRate, 0, 25);
  const defaultTargetMargin = clamp(category.targetMarginPct, 0, 50);
  const defaultLifecycleMonths = clamp(roundInt(settings.lifecycle?.defaultMonths, 36), 1, 120);
  const defaultListingPackageTotal =
    num(listingPackage.listingCreationEur) +
    num(listingPackage.imagesInfographicsEur) +
    num(listingPackage.aPlusContentEur);

  const extra = assumptions.extraCosts ?? {};
  const usePackagingOverride = Boolean(extra.overridePackagingGroup);
  const useLogisticsOverride = Boolean(extra.overrideLogisticsGroup);
  const useLaunchOpsOverride = Boolean(extra.overrideLaunchOpsGroup);

  const packagingPerUnitEur = clamp(
    usePackagingOverride ? num(extra.packagingPerUnitEur, costDefaults.packagingPerUnitEur) : num(costDefaults.packagingPerUnitEur, 0),
    0,
    50,
  );
  const otherUnitCostEur = clamp(
    usePackagingOverride ? num(extra.otherUnitCostEur, costDefaults.otherUnitCostEur) : num(costDefaults.otherUnitCostEur, 0),
    0,
    50,
  );

  const docsPerOrderEur = clamp(
    useLogisticsOverride ? num(extra.docsPerOrderEur, costDefaults.docsPerOrderEur) : num(costDefaults.docsPerOrderEur, 0),
    0,
    5000,
  );
  const freightPapersPerOrderEur = clamp(
    useLogisticsOverride
      ? num(extra.freightPapersPerOrderEur, costDefaults.freightPapersPerOrderEur)
      : num(costDefaults.freightPapersPerOrderEur, 0),
    0,
    5000,
  );
  const receivingMode = useLogisticsOverride && ["sorted", "mixed"].includes(extra.receivingMode)
    ? String(extra.receivingMode)
    : "sorted";
  const receivingPerCartonSortedEur = clamp(
    useLogisticsOverride
      ? num(extra.receivingPerCartonSortedEur, threePlDefaults.receivingPerCartonSortedEur)
      : num(threePlDefaults.receivingPerCartonSortedEur, 0),
    0,
    200,
  );
  const receivingPerCartonMixedEur = clamp(
    useLogisticsOverride
      ? num(extra.receivingPerCartonMixedEur, threePlDefaults.receivingPerCartonMixedEur)
      : num(threePlDefaults.receivingPerCartonMixedEur, 0),
    0,
    200,
  );
  const receivingPerCartonEur = receivingMode === "mixed" ? receivingPerCartonMixedEur : receivingPerCartonSortedEur;
  const storagePerPalletPerMonthEur = clamp(
    useLogisticsOverride
      ? num(extra.storagePerPalletPerMonthEur, threePlDefaults.storagePerPalletPerMonthEur)
      : num(threePlDefaults.storagePerPalletPerMonthEur, 0),
    0,
    1000,
  );
  const unitsPerPallet = clamp(
    roundInt(
      useLogisticsOverride
        ? num(extra.unitsPerPallet, threePlDefaults.unitsPerPallet)
        : num(threePlDefaults.unitsPerPallet, 240),
      240,
    ),
    1,
    10000,
  );
  const avg3PlStorageMonths = clamp(
    useLogisticsOverride
      ? num(extra.avg3PlStorageMonths, threePlDefaults.avgStorageMonths)
      : num(threePlDefaults.avgStorageMonths, 1.2),
    0,
    24,
  );
  const outboundBasePerCartonEur = clamp(
    useLogisticsOverride
      ? num(extra.outboundBasePerCartonEur, threePlDefaults.outboundBasePerCartonEur)
      : num(threePlDefaults.outboundBasePerCartonEur, 0),
    0,
    200,
  );
  const pickPackPerCartonEur = clamp(
    useLogisticsOverride
      ? num(extra.pickPackPerCartonEur, threePlDefaults.pickPackPerCartonEur)
      : num(threePlDefaults.pickPackPerCartonEur, 0),
    0,
    200,
  );
  const fbaProcessingPerCartonEur = clamp(
    useLogisticsOverride
      ? num(extra.fbaProcessingPerCartonEur, threePlDefaults.fbaProcessingPerCartonEur)
      : num(threePlDefaults.fbaProcessingPerCartonEur, 0),
    0,
    200,
  );
  const insertsPerCarton = clamp(
    roundInt(
      useLogisticsOverride
        ? num(extra.insertsPerCarton, threePlDefaults.insertsPerCartonDefault)
        : num(threePlDefaults.insertsPerCartonDefault, 1),
      1,
    ),
    0,
    20,
  );
  const insertPerInsertEur = clamp(
    useLogisticsOverride
      ? num(extra.insertPerInsertEur, threePlDefaults.insertPerInsertEur)
      : num(threePlDefaults.insertPerInsertEur, 0),
    0,
    50,
  );
  const labelsPerCarton = clamp(
    roundInt(
      useLogisticsOverride
        ? num(extra.labelsPerCarton, threePlDefaults.labelsPerCartonDefault)
        : num(threePlDefaults.labelsPerCartonDefault, 0),
      0,
    ),
    0,
    20,
  );
  const thirdCountryLabelPerLabelEur = clamp(
    useLogisticsOverride
      ? num(extra.thirdCountryLabelPerLabelEur, threePlDefaults.thirdCountryLabelPerLabelEur)
      : num(threePlDefaults.thirdCountryLabelPerLabelEur, 0),
    0,
    50,
  );
  const carrierCostPerCartonEur = clamp(
    useLogisticsOverride
      ? num(extra.carrierCostPerCartonEur, threePlDefaults.carrierCostPerCartonEur)
      : num(threePlDefaults.carrierCostPerCartonEur, 0),
    0,
    200,
  );
  const amazonStoragePerCbmMonthEur = clamp(
    useLogisticsOverride
      ? num(extra.amazonStoragePerCbmMonthEur, costDefaults.amazonStoragePerCbmMonthEur)
      : num(costDefaults.amazonStoragePerCbmMonthEur, 0),
    0,
    1000,
  );
  const avgAmazonStorageMonths = clamp(
    useLogisticsOverride
      ? num(extra.avgAmazonStorageMonths, costDefaults.avgAmazonStorageMonths)
      : num(costDefaults.avgAmazonStorageMonths, 1.5),
    0,
    12,
  );

  const greetingCardPerLaunchUnitEur = clamp(
    useLaunchOpsOverride
      ? num(extra.greetingCardPerLaunchUnitEur, costDefaults.greetingCardPerLaunchUnitEur)
      : num(costDefaults.greetingCardPerLaunchUnitEur, 0),
    0,
    20,
  );
  const samplesPerProductEur = clamp(
    useLaunchOpsOverride ? num(extra.samplesPerProductEur, costDefaults.samplesPerProductEur) : num(costDefaults.samplesPerProductEur, 0),
    0,
    10000,
  );
  const toolingPerProductEur = clamp(
    useLaunchOpsOverride ? num(extra.toolingPerProductEur, costDefaults.toolingPerProductEur) : num(costDefaults.toolingPerProductEur, 0),
    0,
    50000,
  );
  const certificatesPerProductEur = clamp(
    useLaunchOpsOverride
      ? num(extra.certificatesPerProductEur, costDefaults.certificatesPerProductEur)
      : num(costDefaults.certificatesPerProductEur, 0),
    0,
    10000,
  );
  const inspectionPerProductEur = clamp(
    useLaunchOpsOverride ? num(extra.inspectionPerProductEur, costDefaults.inspectionPerProductEur) : num(costDefaults.inspectionPerProductEur, 0),
    0,
    10000,
  );

  const defaultBase = {
    defaultTacos,
    defaultLaunchMultiplier,
    defaultLaunchMonths,
    defaultReturnRate,
    defaultSellableShare,
    defaultUnsellableShareDerived,
    defaultReturnHandling,
    defaultLeakage,
    defaultCustomsRate,
    defaultImportVatRate,
    defaultReferralRate,
    defaultTargetMargin,
    defaultLifecycleMonths,
    defaultListingPackageTotal,
    categoryBase: category,
  };

  const resolvedSellableShare = resolveValue(
    isOverrideActive(assumptions.returns.overrideSellableShare),
    assumptions.returns.sellableShare,
    defaultSellableShare,
    0,
    100,
  );

  const resolved = {
    vatRate: settings.tax?.vatRates?.[basic.marketplace] ?? MARKETPLACE_VAT[basic.marketplace] ?? 19,

    tacosRate: resolveValue(isOverrideActive(assumptions.ads.overrideTacos), assumptions.ads.tacosRate, defaultTacos, 0, 100),
    launchAdsMultiplier: resolveValue(
      isOverrideActive(assumptions.ads.overrideLaunchMultiplier),
      assumptions.ads.launchMultiplier,
      defaultLaunchMultiplier,
      1,
      5,
    ),
    launchBoostMonths: resolveValue(
      isOverrideActive(assumptions.ads.overrideLaunchMonths),
      assumptions.ads.launchMonths,
      defaultLaunchMonths,
      1,
      Math.max(1, roundInt(basic.horizonMonths, 1)),
    ),

    returnRate: resolveValue(
      isOverrideActive(assumptions.returns.overrideReturnRate),
      assumptions.returns.returnRate,
      defaultReturnRate,
      0,
      100,
    ),
    sellableShare: resolvedSellableShare,
    // Legacy-Aliase für Abwärtskompatibilität.
    resaleRate: resolvedSellableShare,
    unsellableShare: clamp(100 - resolvedSellableShare, 0, 100),
    returnHandlingCost: resolveValue(
      isOverrideActive(assumptions.returns.overrideHandlingCost),
      assumptions.returns.handlingCost,
      defaultReturnHandling,
      0,
      30,
    ),

    leakageRatePct: resolveValue(
      isOverrideActive(assumptions.leakage.overrideRatePct),
      assumptions.leakage.ratePct,
      defaultLeakage,
      0,
      20,
    ),

    customsDutyRate: resolveValue(
      isOverrideActive(assumptions.import.overrideCustomsDutyRate),
      assumptions.import.customsDutyRate,
      defaultCustomsRate,
      0,
      40,
    ),
    importVatRate: resolveValue(
      isOverrideActive(assumptions.import.overrideImportVatRate),
      assumptions.import.importVatRate,
      defaultImportVatRate,
      0,
      30,
    ),
    includeImportVatAsCost: Boolean(assumptions.import.includeImportVatAsCost),
    includeImportVatInCashRoi: Boolean(assumptions.import.includeImportVatInCashRoi),

    referralRate: resolveValue(
      isOverrideActive(assumptions.amazon.overrideReferralRate),
      assumptions.amazon.referralRate,
      defaultReferralRate,
      0,
      25,
    ),
    useManualFbaFee: Boolean(assumptions.amazon.useManualFbaFee),
    manualFbaFee: clamp(num(assumptions.amazon.manualFbaFee, 0), 0, 50),

    targetMarginPct: resolveValue(
      isOverrideActive(assumptions.lifecycle.overrideTargetMarginPct),
      assumptions.lifecycle.targetMarginPct,
      defaultTargetMargin,
      0,
      50,
    ),
    otherMonthlyCost: resolveValue(
      isOverrideActive(assumptions.lifecycle.overrideOtherMonthlyCost),
      assumptions.lifecycle.otherMonthlyCost,
      0,
      0,
      100000,
    ),

    categoryLabel: category.label,
    listingPackageKey,
    listingPackage,
    listingPackageTotal: Math.max(0, defaultListingPackageTotal),
    lifecycleMonths: defaultLifecycleMonths,
    launchProfileKey,
    launchProfile: {
      weeks: clamp(num(launchProfile.weeks, 6), 1, 24),
      startTacosBoostPct: clamp(num(launchProfile.startTacosBoostPct, 0), 0, 300),
      endTacosBoostPct: clamp(num(launchProfile.endTacosBoostPct, 0), 0, 300),
      startPriceDiscountPct: clamp(num(launchProfile.startPriceDiscountPct, 0), 0, 60),
    },
    extraCosts: {
      packagingPerUnitEur,
      otherUnitCostEur,
      docsPerOrderEur,
      freightPapersPerOrderEur,
      receivingMode,
      receivingPerCartonSortedEur,
      receivingPerCartonMixedEur,
      receivingPerCartonEur,
      storagePerPalletPerMonthEur,
      unitsPerPallet,
      avg3PlStorageMonths,
      outboundBasePerCartonEur,
      pickPackPerCartonEur,
      fbaProcessingPerCartonEur,
      insertsPerCarton,
      insertPerInsertEur,
      labelsPerCarton,
      thirdCountryLabelPerLabelEur,
      carrierCostPerCartonEur,
      amazonStoragePerCbmMonthEur,
      avgAmazonStorageMonths,
      greetingCardPerLaunchUnitEur,
      samplesPerProductEur,
      toolingPerProductEur,
      certificatesPerProductEur,
      inspectionPerProductEur,
      usePackagingOverride,
      useLogisticsOverride,
      useLaunchOpsOverride,
    },

    launchBudgetSplitTotal:
      num(assumptions.launchSplit.listing) +
      num(assumptions.launchSplit.vine) +
      num(assumptions.launchSplit.coupons) +
      num(assumptions.launchSplit.other),
    launchSplitEnabled: Boolean(assumptions.launchSplit.enabled),
    defaultBase,
  };

  resolved.launchBudgetEffective =
    resolved.launchSplitEnabled && resolved.launchBudgetSplitTotal > 0
      ? resolved.launchBudgetSplitTotal
      : Math.max(0, num(basic.launchBudgetTotal));

  resolved.assumedLabels = {
    "ads.tacosRate": assumedText(
      isOverrideActive(assumptions.ads.overrideTacos),
      defaultTacos,
      resolved.tacosRate,
      formatPercent,
    ),
    "ads.launchMultiplier": assumedText(
      isOverrideActive(assumptions.ads.overrideLaunchMultiplier),
      defaultLaunchMultiplier,
      resolved.launchAdsMultiplier,
      formatNumber,
    ),
    "ads.launchMonths": assumedText(
      isOverrideActive(assumptions.ads.overrideLaunchMonths),
      defaultLaunchMonths,
      resolved.launchBoostMonths,
      formatNumber,
    ),

    "returns.returnRate": assumedText(
      isOverrideActive(assumptions.returns.overrideReturnRate),
      defaultReturnRate,
      resolved.returnRate,
      formatPercent,
    ),
    "returns.sellableShare": assumedText(
      isOverrideActive(assumptions.returns.overrideSellableShare),
      defaultSellableShare,
      resolved.sellableShare,
      formatPercent,
    ),
    "returns.unsellableSharePctDerived": `Abgeleitet: ${formatPercent(100 - resolved.sellableShare)} (100 - verkaufbar).`,
    "returns.handlingCost": assumedText(
      isOverrideActive(assumptions.returns.overrideHandlingCost),
      defaultReturnHandling,
      resolved.returnHandlingCost,
      formatCurrency,
    ),

    "leakage.ratePct": assumedText(
      isOverrideActive(assumptions.leakage.overrideRatePct),
      defaultLeakage,
      resolved.leakageRatePct,
      formatPercent,
    ),

    "import.customsDutyRate": assumedText(
      isOverrideActive(assumptions.import.overrideCustomsDutyRate),
      defaultCustomsRate,
      resolved.customsDutyRate,
      formatPercent,
    ),
    "import.importVatRate": assumedText(
      isOverrideActive(assumptions.import.overrideImportVatRate),
      defaultImportVatRate,
      resolved.importVatRate,
      formatPercent,
    ),

    "amazon.referralRate": assumedText(
      isOverrideActive(assumptions.amazon.overrideReferralRate),
      defaultReferralRate,
      resolved.referralRate,
      formatPercent,
    ),

    "lifecycle.targetMarginPct": assumedText(
      isOverrideActive(assumptions.lifecycle.overrideTargetMarginPct),
      defaultTargetMargin,
      resolved.targetMarginPct,
      formatPercent,
    ),
    "lifecycle.otherMonthlyCost": assumedText(
      isOverrideActive(assumptions.lifecycle.overrideOtherMonthlyCost),
      0,
      resolved.otherMonthlyCost,
      formatCurrency,
    ),
  };

  return resolved;
}

function unitsMonthlyFromBasic(basic) {
  const demand = Math.max(0, num(basic.demandValue));
  if (basic.demandBasis === "day") {
    return demand * 30.4;
  }
  return demand;
}

function getProductStage(product) {
  const stage = product?.workflow?.stage;
  if (stage === "deep_dive") {
    return "validation";
  }
  if (WORKFLOW_VISIBLE_STAGES.includes(stage)) {
    return stage;
  }
  return "quick";
}

function getStageTopN(stage) {
  const configured = STAGE_VISIBILITY[stage]?.topN;
  return Number.isFinite(configured) ? Math.max(0, roundInt(configured, 0)) : Number.POSITIVE_INFINITY;
}

function chainStageKeyForLine(categoryKey, lineLabel = "") {
  const label = String(lineLabel ?? "");
  if (categoryKey === "product") {
    return "supplier";
  }
  if (categoryKey === "shipping_import") {
    return "shipping_to_3pl";
  }
  if (categoryKey === "threepl") {
    if (label.includes("-> Amazon")) {
      return "amazon_inbound";
    }
    return "threepl";
  }
  if (categoryKey === "launch_lifecycle") {
    return "launch";
  }
  if (categoryKey === "overhead") {
    return "launch";
  }
  if (categoryKey === "ads_returns") {
    return "amazon";
  }
  if (categoryKey === "amazon") {
    return "amazon";
  }
  return "amazon";
}

function isEditableDriverPath(path) {
  return typeof path === "string" && (path.startsWith("basic.") || path.startsWith("assumptions.") || path.startsWith("settings."));
}

function hasEditableDriverPath(driverPaths) {
  if (!Array.isArray(driverPaths) || driverPaths.length === 0) {
    return false;
  }
  return driverPaths.some((path) => isEditableDriverPath(path));
}

function ensureReviewStore(product) {
  if (!product.workflow || typeof product.workflow !== "object") {
    product.workflow = {};
  }
  if (!product.workflow.review || typeof product.workflow.review !== "object") {
    product.workflow.review = { validation: {}, deep_dive: {} };
  }
  if (!product.workflow.review.validation || typeof product.workflow.review.validation !== "object") {
    product.workflow.review.validation = {};
  }
  if (!product.workflow.review.deep_dive || typeof product.workflow.review.deep_dive !== "object") {
    product.workflow.review.deep_dive = {};
  }
  return product.workflow.review;
}

function getStageReviewStore(product, stage) {
  const review = ensureReviewStore(product);
  return stage === "deep_dive" ? review.deep_dive : review.validation;
}

function buildReviewTargets(metrics, stage) {
  const categories = buildCostCategoryData(metrics);
  const candidates = [];

  categories.forEach((category) => {
    category.lines.forEach((line) => {
      if (!line || !line.reviewEligible || line.isSummary) {
        return;
      }
      const editablePaths = (line.driverPaths ?? []).filter((path) => isEditableDriverPath(path));
      if (editablePaths.length === 0) {
        return;
      }
      candidates.push({
        stage,
        targetId: line.id,
        categoryKey: category.key,
        categoryTitle: category.title,
        chainStageKey: line.chainStageKey || chainStageKeyForLine(category.key, line.label),
        label: line.label,
        valueRaw: num(line.valueRaw, 0),
        value: line.value,
        impactMonthly: Math.max(0, num(line.impactMonthly, 0)),
        explain: line.explain ?? "",
        formula: line.formula ?? "",
        source: line.source ?? "",
        robustness: line.robustness ?? "",
        driverPaths: editablePaths,
      });
    });
  });

  candidates.sort((a, b) => b.impactMonthly - a.impactMonthly);
  if (stage === "validation") {
    return candidates.slice(0, getStageTopN("validation"));
  }
  return candidates;
}

function isReviewStale(savedValue, currentValue, tolerance = 0.01) {
  if (!Number.isFinite(num(savedValue, NaN)) || !Number.isFinite(num(currentValue, NaN))) {
    return true;
  }
  return Math.abs(num(savedValue, 0) - num(currentValue, 0)) > tolerance;
}

function getReviewProgress(product, metrics, stage) {
  const targets = buildReviewTargets(metrics, stage);
  const store = getStageReviewStore(product, stage);

  let completed = 0;
  const items = targets.map((target) => {
    const saved = store[target.targetId];
    let status = saved?.status ?? "pending";
    if (status !== "pending" && isReviewStale(saved?.lastValue, target.valueRaw)) {
      status = "pending";
    }
    const done = status === "checked" || status === "overridden";
    if (done) {
      completed += 1;
    }
    return {
      ...target,
      status,
      updatedAt: saved?.updatedAt ?? null,
      lastValue: saved?.lastValue ?? null,
    };
  });

  return {
    stage,
    total: items.length,
    completed,
    isReady: items.length > 0 && completed >= items.length,
    items,
  };
}

function setReviewStatus(product, stage, targetId, status, lastValue) {
  const store = getStageReviewStore(product, stage);
  store[targetId] = {
    targetId,
    status,
    lastValue: num(lastValue, 0),
    updatedAt: new Date().toISOString(),
  };
  saveProducts();
}

function markReviewChecked(product, stage, targetId, lastValue) {
  setReviewStatus(product, stage, targetId, "checked", lastValue);
}

function markReviewOverridden(product, stage, targetId, lastValue) {
  setReviewStatus(product, stage, targetId, "overridden", lastValue);
}

function markReviewPending(product, stage, targetId) {
  const store = getStageReviewStore(product, stage);
  if (store && typeof store === "object" && targetId in store) {
    delete store[targetId];
    saveProducts();
  }
}

function findReviewTarget(product, stage, targetId) {
  const metrics = calculateProduct(product);
  const targets = buildReviewTargets(metrics, stage);
  return targets.find((target) => target.targetId === targetId) ?? null;
}

function markReviewOverriddenFromModal(product) {
  const context = state.ui.driverModal;
  if (!context?.reviewStage || !context?.reviewTargetId) {
    return;
  }
  const metrics = calculateProduct(product);
  const targets = buildReviewTargets(metrics, context.reviewStage);
  const target = targets.find((item) => item.targetId === context.reviewTargetId);
  if (!target) {
    return;
  }
  markReviewOverridden(product, context.reviewStage, context.reviewTargetId, target.valueRaw);
}

function buildStageState(product, metrics) {
  const stage = getProductStage(product);
  const quickReady = metrics.priceGrossTarget > 0 && metrics.monthlyUnits > 0;
  const validationReady = Boolean(metrics.validationReady);
  const coveragePct = num(metrics.validationCoveragePct, 0);
  const coverageTargetPct = clamp(num(metrics.validationCoverageTargetPct, VALIDATION_COVERAGE_TARGET_DEFAULT), 80, 99);

  const readinessByStage = {
    quick: quickReady,
    validation: validationReady,
    deep_dive: false,
  };

  const hintByStage = {
    quick:
      "QuickCheck: leaner 80/20-Workflow mit fünf Hauptkostenblöcken und transparenter Abdeckungsanzeige.",
    validation:
      "Validation: Größte Kostenblöcke bis 95% Abdeckung validieren und Kernannahmen über Sandbox testen.",
    deep_dive:
      "Deep-Dive ist aktuell deaktiviert.",
  };

  const statusClass = readinessByStage[stage] ? "pass" : (stage === "quick" ? "fail" : "warn");
  let statusText = "Status: in Prüfung";
  if (stage === "quick") {
    statusText = readinessByStage.quick ? "Status: QuickCheck bereit" : "Status: QuickCheck unvollständig";
  } else if (stage === "validation") {
    statusText = validationReady
      ? `Status: Validation bereit (${formatPercent(coveragePct)} von ${formatPercent(coverageTargetPct)})`
      : `Status: Validation offen (${formatPercent(coveragePct)} von ${formatPercent(coverageTargetPct)})`;
  } else if (stage === "deep_dive") {
    statusText = "Status: Deep-Dive deaktiviert";
  }

  const blockers = [];
  if (stage === "validation" && !validationReady) {
    blockers.push(`Validation offen: ${formatPercent(coveragePct)} von ${formatPercent(coverageTargetPct)} abgedeckt.`);
  }

  const kpiWarnings = [];
  if (!(metrics.netMarginPct > 20 && metrics.db1Unit > 0)) {
    kpiWarnings.push("KPI-Warnung: Netto-Marge <= 20% oder DB1 <= 0.");
  }
  if (metrics.sensitivity?.worst?.profitMonthly <= 0) {
    kpiWarnings.push("KPI-Warnung: Worst-Case Gewinn <= 0.");
  }
  if (metrics.paybackMonths === null || metrics.paybackMonths > 8) {
    kpiWarnings.push("KPI-Warnung: Payback > 8 Monate oder nicht erreichbar.");
  }

  return {
    stage,
    quickPass: quickReady,
    validationPass: validationReady,
    deepPass: false,
    deepChecklistPass: false,
    readinessByStage,
    hint: hintByStage[stage],
    statusClass,
    statusText,
    blockers,
    kpiWarnings,
    validationReview: { total: 0, completed: 0, isReady: validationReady, items: [] },
    deepDiveReview: { total: 0, completed: 0, isReady: false, items: [] },
  };
}

function calculateProduct(product, scenario = {}, options = { includeDerived: true }) {
  const effectiveSettings = resolveEffectiveSettings(product);
  const resolved = resolveAssumptions(product, effectiveSettings);
  const basic = product.basic;

  const monthlyUnits = Math.max(
    0,
    (scenario.monthlyUnits ?? unitsMonthlyFromBasic(basic)) * (scenario.unitsFactor ?? 1),
  );
  const horizonMonths = Math.max(1, roundInt(basic.horizonMonths, 1));
  const unitsHorizon = monthlyUnits * horizonMonths;

  const priceGrossBase = Math.max(0, num(basic.priceGross));
  const priceGrossTarget = Math.max(
    0,
    (scenario.priceGross ?? priceGrossBase) * (scenario.priceFactor ?? 1),
  );

  const vatFactor = 1 + resolved.vatRate / 100;
  const targetPriceNet = vatFactor > 0 ? priceGrossTarget / vatFactor : priceGrossTarget;
  const fxUsdToEur = Math.max(0, num(state.fx.usdToEur, DEFAULT_USD_TO_EUR));

  const shipping = calculateShippingDoorToDoor(product, effectiveSettings);
  const extra = resolved.extraCosts;

  const exwUnitUsd = Math.max(0, num(basic.exwUnit));
  const exwUnit = exwUnitUsd * fxUsdToEur;
  const shippingUnit = shipping.shippingPerUnit;
  const packagingUnit = extra.packagingPerUnitEur + extra.otherUnitCostEur;
  const orderFixedPerUnit =
    (extra.docsPerOrderEur + extra.freightPapersPerOrderEur) / Math.max(1, shipping.unitsPerOrder);
  const palletsCount = Math.max(1, Math.ceil(shipping.unitsPerOrder / Math.max(1, extra.unitsPerPallet)));
  const threePlInboundTotal = shipping.cartonsCount * extra.receivingPerCartonEur;
  const threePlInboundPerUnit = threePlInboundTotal / Math.max(1, shipping.unitsPerOrder);
  const threePlStorageTotal = palletsCount * extra.storagePerPalletPerMonthEur * extra.avg3PlStorageMonths;
  const threePlStoragePerUnit = threePlStorageTotal / Math.max(1, shipping.unitsPerOrder);
  const outboundServicePerCarton =
    extra.outboundBasePerCartonEur +
    extra.pickPackPerCartonEur +
    extra.fbaProcessingPerCartonEur +
    extra.insertsPerCarton * extra.insertPerInsertEur +
    extra.labelsPerCarton * extra.thirdCountryLabelPerLabelEur;
  const threePlOutboundServiceTotal = shipping.cartonsCount * outboundServicePerCarton;
  const threePlOutboundServicePerUnit = threePlOutboundServiceTotal / Math.max(1, shipping.unitsPerOrder);
  const threePlCarrierTotal = shipping.cartonsCount * extra.carrierCostPerCartonEur;
  const threePlCarrierPerUnit = threePlCarrierTotal / Math.max(1, shipping.unitsPerOrder);
  const threePlTotalPerUnit =
    threePlInboundPerUnit + threePlStoragePerUnit + threePlOutboundServicePerUnit + threePlCarrierPerUnit;
  const amazonStoragePerUnit = extra.amazonStoragePerCbmMonthEur * extra.avgAmazonStorageMonths * shipping.unitCbm;
  const logisticsExtraUnit =
    orderFixedPerUnit +
    threePlInboundPerUnit +
    threePlStoragePerUnit +
    threePlOutboundServicePerUnit +
    threePlCarrierPerUnit +
    amazonStoragePerUnit;

  const landedBeforeDuty = exwUnit + shippingUnit + packagingUnit + logisticsExtraUnit;
  const customsBaseUnit = exwUnit + shippingUnit;
  const customsUnit = customsBaseUnit * (resolved.customsDutyRate / 100);
  const importVatUnit = 0;

  const landedUnit = landedBeforeDuty + customsUnit;

  const fba = estimateFbaFee(product, resolved, effectiveSettings);
  const fbaRateCardReference = estimateFbaFee(
    product,
    { ...resolved, useManualFbaFee: false },
    effectiveSettings,
  );

  const launchProfileWeeks = clamp(num(resolved.launchProfile.weeks, 6), 1, 24);
  const launchMonthsFromProfile = Math.min(horizonMonths, Math.max(launchProfileWeeks / 4.345, 0.25));
  const launchBoostMonths = Math.min(
    horizonMonths,
    Math.max(launchMonthsFromProfile, Math.max(1, roundInt(resolved.launchBoostMonths, 1))),
  );
  const averageLaunchPriceDiscountPct = resolved.launchProfile.startPriceDiscountPct / 2;
  const launchPriceFactor = Math.max(0.55, 1 - averageLaunchPriceDiscountPct / 100);
  const launchPriceWeightFactor =
    (launchBoostMonths * launchPriceFactor + (horizonMonths - launchBoostMonths)) / horizonMonths;

  const priceGross = priceGrossTarget * launchPriceWeightFactor;
  const priceNet = vatFactor > 0 ? priceGross / vatFactor : priceGross;
  const referralFeeUnit = Math.max(priceGross * (resolved.referralRate / 100), MIN_REFERRAL_FEE);

  const averageLaunchTacosBoostPct =
    (resolved.launchProfile.startTacosBoostPct + resolved.launchProfile.endTacosBoostPct) / 2;
  const profileLaunchMultiplier = 1 + averageLaunchTacosBoostPct / 100;
  const launchAdsMultiplierEffective = resolved.launchAdsMultiplier * profileLaunchMultiplier;
  const launchWeightFactor =
    (launchBoostMonths * launchAdsMultiplierEffective + (horizonMonths - launchBoostMonths)) /
    horizonMonths;

  const baseTacosRate =
    scenario.forceTacosRate !== undefined
      ? num(scenario.forceTacosRate)
      : resolved.tacosRate + num(scenario.tacosDelta);
  const tacosRate = clamp(baseTacosRate, 0, 100);
  const effectiveTacosRate = tacosRate * launchWeightFactor;

  const adsUnit = priceGross * (effectiveTacosRate / 100);

  const returnRate = resolved.returnRate / 100;
  const sellableShare = resolved.sellableShare / 100;
  const unsellableShare = Math.max(0, 1 - sellableShare);
  const returnLossPerReturn = unsellableShare * landedUnit;
  const returnCostPerReturn = returnLossPerReturn + resolved.returnHandlingCost;
  const returnLossUnit = returnRate * returnLossPerReturn;
  const returnHandlingUnit = returnRate * resolved.returnHandlingCost;
  const returnsUnit = returnRate * returnCostPerReturn;

  const unitEconomicsUnit = landedUnit + referralFeeUnit + fba.fee + adsUnit + returnsUnit;

  const db1Unit = priceNet - unitEconomicsUnit;
  const db1MarginPct = priceNet > 0 ? (db1Unit / priceNet) * 100 : 0;

  const grossRevenueMonthly = priceGross * monthlyUnits;
  const grossRevenueTargetMonthly = priceGrossTarget * monthlyUnits;
  const netRevenueMonthly = priceNet * monthlyUnits;
  const netRevenueTargetMonthly = targetPriceNet * monthlyUnits;

  const block1Monthly = unitEconomicsUnit * monthlyUnits;
  const shippingMonthly = shippingUnit * monthlyUnits;
  const adsMonthly = adsUnit * monthlyUnits;
  const returnsMonthly = returnsUnit * monthlyUnits;
  const referralMonthly = referralFeeUnit * monthlyUnits;
  const customsMonthly = customsUnit * monthlyUnits;
  const importVatCostMonthly = 0;

  const launchAdsBaseUnit = priceGross * (tacosRate / 100);
  const launchAdsIncrementMonthly = Math.max(0, (adsUnit - launchAdsBaseUnit) * monthlyUnits);

  const launchBudget = resolved.launchBudgetEffective;
  const listingPackageCost = resolved.listingPackageTotal;
  const listingUnit = unitsHorizon > 0 ? listingPackageCost / unitsHorizon : 0;
  const listingMonthly = listingPackageCost / resolved.lifecycleMonths;
  const launchUnit = unitsHorizon > 0 ? launchBudget / unitsHorizon : 0;
  const launchMonthly = launchBudget / horizonMonths;
  const launchUnits = monthlyUnits * launchBoostMonths;
  const greetingCardTotal = extra.greetingCardPerLaunchUnitEur * launchUnits;
  const setupOneOffTotal =
    extra.samplesPerProductEur +
    extra.toolingPerProductEur +
    extra.certificatesPerProductEur +
    extra.inspectionPerProductEur;
  const launchOpsUnit = unitsHorizon > 0 ? (greetingCardTotal + setupOneOffTotal) / unitsHorizon : 0;
  const launchOpsMonthly = (greetingCardTotal + setupOneOffTotal) / horizonMonths;

  const lifecycleMonthly = launchMonthly + listingMonthly + launchOpsMonthly + resolved.otherMonthlyCost;
  const block2Monthly = lifecycleMonthly;

  const leakageMonthly = netRevenueMonthly * (resolved.leakageRatePct / 100);
  const block3Monthly = leakageMonthly;

  const grossProfitMonthly = db1Unit * monthlyUnits;
  const profitMonthly = grossProfitMonthly - block2Monthly - block3Monthly;
  const profitBeforeOverheadMonthly = grossProfitMonthly - block2Monthly;
  const profitHorizon = profitMonthly * horizonMonths;
  const netMarginPct = netRevenueMonthly > 0 ? (profitMonthly / netRevenueMonthly) * 100 : 0;
  const netMarginBeforePpcPct = netRevenueMonthly > 0 ? ((profitMonthly + adsMonthly) / netRevenueMonthly) * 100 : 0;
  const sellerboardMarginPct = grossRevenueMonthly > 0 ? (profitBeforeOverheadMonthly / grossRevenueMonthly) * 100 : 0;

  const quickBlockExwPerUnit = exwUnit;
  const quickBlockShippingTo3plPerUnit = shippingUnit + customsUnit + orderFixedPerUnit;
  const quickBlockThreePlPerUnit = threePlTotalPerUnit;
  const quickBlockAmazonCorePerUnit = referralFeeUnit + adsUnit + fba.fee;
  const quickBlockLaunchCorePerUnit = listingUnit + launchUnit + launchOpsUnit;
  const quickCoreCostPerUnit =
    quickBlockExwPerUnit +
    quickBlockShippingTo3plPerUnit +
    quickBlockThreePlPerUnit +
    quickBlockAmazonCorePerUnit +
    quickBlockLaunchCorePerUnit;
  const quickCoreCostMonthly = quickCoreCostPerUnit * monthlyUnits;

  const investedCapital = landedUnit * unitsHorizon + launchBudget + listingPackageCost + setupOneOffTotal;
  const productRoiPct = investedCapital > 0 ? (profitHorizon / investedCapital) * 100 : 0;

  const importVatPrefinance = 0;
  const cashCapital = investedCapital;
  const cashRoiPct = cashCapital > 0 ? (profitHorizon / cashCapital) * 100 : 0;

  const paybackBase = launchBudget + listingPackageCost + setupOneOffTotal + landedUnit * monthlyUnits;
  const paybackMonths = profitMonthly > 0 ? paybackBase / profitMonthly : null;

  const totalCostMonthly = block1Monthly + block2Monthly + block3Monthly;
  const totalCostPerUnit = monthlyUnits > 0 ? totalCostMonthly / monthlyUnits : 0;
  const quickCoreCoveragePct = totalCostPerUnit > 0 ? (quickCoreCostPerUnit / totalCostPerUnit) * 100 : 0;
  const quickCoreResidualPerUnit = Math.max(0, totalCostPerUnit - quickCoreCostPerUnit);
  const quickCoreResidualMonthly = quickCoreResidualPerUnit * monthlyUnits;

  const result = {
    productId: product.id,
    name: product.name,
    basic,
    resolved,
    monthlyUnits,
    horizonMonths,
    unitsHorizon,
    priceGrossTarget,
    priceGross,
    targetPriceNet,
    priceNet,
    launchProfileWeeks,
    launchMonthsFromProfile,
    launchBoostMonths,
    averageLaunchPriceDiscountPct,
    launchPriceWeightFactor,
    averageLaunchTacosBoostPct,
    launchAdsMultiplierEffective,
    fxUsdToEur,
    vatRate: resolved.vatRate,

    shipping,
    shippingUnit,
    shippingMonthly,

    exwUnitUsd,
    exwUnit,
    packagingUnit,
    logisticsExtraUnit,
    orderFixedPerUnit,
    palletsCount,
    threePlInboundTotal,
    threePlStorageTotal,
    threePlOutboundServiceTotal,
    threePlCarrierTotal,
    threePlInboundPerUnit,
    threePlStoragePerUnit,
    threePlOutboundServicePerUnit,
    threePlCarrierPerUnit,
    threePlTotalPerUnit,
    amazonStoragePerUnit,
    customsUnit,
    importVatUnit,
    landedUnit,

    referralFeeUnit,
    referralMonthly,
    fbaFeeUnit: fba.fee,
    fbaTier: fba.tierLabel,
    fbaTierKey: fba.tierKey,
    fbaTierLabel: fba.tierLabel,
    fbaFeeSource: fba.source,
    fbaRateCardFeeUnit: fbaRateCardReference.source === "auto" ? fbaRateCardReference.fee : null,
    fbaRateCardTierLabel: fbaRateCardReference.source === "auto" ? fbaRateCardReference.tierLabel : "",
    fbaRateCardSource: fbaRateCardReference.source,
    fbaRateCardFallbackReason: fbaRateCardReference.fallbackReason,
    fbaRateCardVersion: fba.rateCardVersion,
    fbaRateCardUrl: fba.rateCardUrl,
    fbaProfile: fba.profile,
    fbaProfileLabel: fba.profileLabel,
    fbaActualWeightG: fba.actualWeightG,
    fbaDimensionalWeightG: fba.dimensionalWeightG,
    fbaShippingWeightG: fba.shippingWeightG,
    fbaFallbackReason: fba.fallbackReason,
    fbaVolumetricDivisor: fba.volumetricDivisor,
    fbaOptimizationHints: Array.isArray(fba.optimizationHints) ? fba.optimizationHints : [],
    customsMonthly,
    importVatCostMonthly,

    tacosRate,
    effectiveTacosRate,
    adsUnit,
    adsMonthly,
    launchAdsIncrementMonthly,

    returnRatePct: resolved.returnRate,
    sellableSharePct: resolved.sellableShare,
    unsellableSharePctDerived: (100 - resolved.sellableShare),
    // Legacy für Abwärtskompatibilität.
    resaleRatePct: resolved.sellableShare,
    unsellableSharePct: (100 - resolved.sellableShare),
    returnLossPerReturn,
    returnCostPerReturn,
    returnLossUnit,
    returnHandlingUnit,
    returnsUnit,
    returnsMonthly,

    unitEconomicsUnit,
    block1Monthly,

    launchBudget,
    launchUnit,
    launchMonthly,
    listingPackageCost,
    listingUnit,
    listingMonthly,
    launchUnits,
    greetingCardTotal,
    setupOneOffTotal,
    launchOpsUnit,
    launchOpsMonthly,
    lifecycleMonthsSetting: resolved.lifecycleMonths,
    otherLifecycleMonthly: resolved.otherMonthlyCost,
    block2Monthly,

    leakageRatePct: resolved.leakageRatePct,
    block3Monthly,
    totalCostMonthly,
    totalCostPerUnit,
    shippingCategoryTotalEurPerUnit: shippingUnit,
    shippingCategoryTotalEurPerMonth: shippingMonthly,
    quickBlockExwPerUnit,
    quickBlockShippingTo3plPerUnit,
    quickBlockThreePlPerUnit,
    quickBlockAmazonCorePerUnit,
    quickBlockLaunchCorePerUnit,
    quickCoreCostPerUnit,
    quickCoreCostMonthly,
    quickCoreCoveragePct,
    quickCoreResidualPerUnit,
    quickCoreResidualMonthly,
    quickResidualTopItems: [],
    quickResidualTop1PerUnit: 0,
    quickResidualTop2PerUnit: 0,
    quickResidualTop3PerUnit: 0,
    validationCoverageTargetPct: getValidationCoverageTargetPct(product),
    validationCoveredPerUnit: 0,
    validationResidualPerUnit: totalCostPerUnit,
    validationCoveragePct: 0,
    validationReady: false,
    validationBlockItems: [],
    validationSuggestedResidualItems: [],
    validationOpenTopResidualItems: [],
    validationCheckedBlockIds: [],

    db1Unit,
    db1MarginPct,
    grossRevenueMonthly,
    grossRevenueTargetMonthly,
    netRevenueMonthly,
    netRevenueTargetMonthly,
    grossProfitMonthly,
    profitMonthly,
    profitBeforeOverheadMonthly,
    netMarginPct,
    netMarginBeforePpcPct,
    sellerboardMarginPct,
    profitHorizon,

    investedCapital,
    importVatPrefinance,
    productRoiPct,
    cashRoiPct,
    paybackMonths,

    targetMarginPct: resolved.targetMarginPct,
  };

  if (!options.includeDerived) {
    return result;
  }

  result.breakEvenPrice = solveBreakEvenPrice(product);
  result.maxTacosRateForTarget = solveMaxTacosRateForTargetMargin(product, resolved.targetMarginPct);
  result.quickResidualTopItems = buildQuickResidualItems(result);
  result.quickResidualTop1PerUnit = num(result.quickResidualTopItems[0]?.perUnit, 0);
  result.quickResidualTop2PerUnit = num(result.quickResidualTopItems[1]?.perUnit, 0);
  result.quickResidualTop3PerUnit = num(result.quickResidualTopItems[2]?.perUnit, 0);
  const validationData = buildValidationWorkflowData(result, product);
  result.validationCoverageTargetPct = validationData.coverageTargetPct;
  result.validationCoveredPerUnit = validationData.coveredPerUnit;
  result.validationResidualPerUnit = validationData.residualPerUnit;
  result.validationCoveragePct = validationData.coveragePct;
  result.validationReady = validationData.ready;
  result.validationBlockItems = validationData.blockItems;
  result.validationSuggestedResidualItems = validationData.suggestedResidualItems;
  result.validationOpenTopResidualItems = validationData.openTopResidualItems;
  result.validationCheckedBlockIds = validationData.checkedResidualIds;
  result.sensitivity = buildSensitivity(product, result.targetMarginPct);

  return result;
}

function solveBreakEvenPrice(product) {
  const evaluate = (candidatePrice) => {
    const snapshot = calculateProduct(product, { priceGross: candidatePrice }, { includeDerived: false });
    return snapshot.profitMonthly;
  };

  let lower = 0.01;
  let upper = Math.max(5, num(product.basic.priceGross) * 2.5, 35);

  let lowerProfit = evaluate(lower);
  let upperProfit = evaluate(upper);

  let guard = 0;
  while (upperProfit < 0 && guard < 24) {
    upper *= 1.45;
    upperProfit = evaluate(upper);
    guard += 1;
  }

  if (upperProfit < 0) {
    return null;
  }
  if (lowerProfit > 0) {
    return round2(lower);
  }

  for (let i = 0; i < 44; i += 1) {
    const mid = (lower + upper) / 2;
    const midProfit = evaluate(mid);
    if (midProfit >= 0) {
      upper = mid;
      upperProfit = midProfit;
    } else {
      lower = mid;
      lowerProfit = midProfit;
    }
  }

  return round2(upper);
}

function solveMaxTacosRateForTargetMargin(product, targetMarginPct) {
  const marginAt = (candidateTacos) => {
    const snapshot = calculateProduct(
      product,
      { forceTacosRate: candidateTacos },
      { includeDerived: false },
    );
    return snapshot.netMarginPct;
  };

  if (marginAt(0) < targetMarginPct) {
    return 0;
  }

  let lower = 0;
  let upper = 80;
  let guard = 0;

  while (marginAt(upper) >= targetMarginPct && upper < 200 && guard < 15) {
    upper += 10;
    guard += 1;
  }

  for (let i = 0; i < 36; i += 1) {
    const mid = (lower + upper) / 2;
    const margin = marginAt(mid);
    if (margin >= targetMarginPct) {
      lower = mid;
    } else {
      upper = mid;
    }
  }

  return round2(lower);
}

function classifyTraffic(baseMetrics, worstMetrics, targetMarginPct) {
  if (baseMetrics.profitMonthly <= 0 || baseMetrics.db1Unit <= 0 || baseMetrics.netMarginPct < 15) {
    return {
      color: "red",
      label: "Rot",
      text: "Netto-Marge kritisch (<15%) oder unprofitabel",
    };
  }

  if (baseMetrics.netMarginPct < 20 || worstMetrics.profitMonthly <= 0) {
    return {
      color: "yellow",
      label: "Gelb",
      text: "Profitabel, aber noch nicht robust (>20% Netto-Marge)",
    };
  }

  if (baseMetrics.netMarginPct >= 20 && baseMetrics.netMarginPct >= targetMarginPct) {
    return {
      color: "green",
      label: "Grün",
      text: "Launch-ready: Netto-Marge > 20% und robust",
    };
  }

  return {
    color: "yellow",
    label: "Gelb",
    text: "Profitabel, aber unter Zielmarge",
  };
}

function classifyLaunchDecision(metrics) {
  const netMargin = num(metrics.netMarginPct, 0);
  const db1 = num(metrics.db1Unit, 0);

  if (netMargin > 20 && db1 > 0) {
    return {
      color: "green",
      label: "GO",
      text: "Netto-Marge > 20% und DB1/Stück > 0.",
    };
  }

  if (netMargin < 15 || db1 <= 0) {
    return {
      color: "red",
      label: "NO-GO",
      text: "Netto-Marge < 15% oder DB1/Stück ≤ 0.",
    };
  }

  return {
    color: "yellow",
    label: "WATCH",
    text: "Netto-Marge 15-20% oder DB1 knapp positiv.",
  };
}

function buildSensitivity(product, targetMarginPct) {
  const priceDown = calculateProduct(product, { priceFactor: 0.9 }, { includeDerived: false });
  const tacosUp = calculateProduct(product, { tacosDelta: 2 }, { includeDerived: false });
  const unitsDown = calculateProduct(product, { unitsFactor: 0.9 }, { includeDerived: false });

  const worst = calculateProduct(
    product,
    { priceFactor: 0.9, tacosDelta: 2, unitsFactor: 0.9 },
    { includeDerived: false },
  );
  const best = calculateProduct(
    product,
    { priceFactor: 1.1, tacosDelta: -2, unitsFactor: 1.1 },
    { includeDerived: false },
  );
  const base = calculateProduct(product, {}, { includeDerived: false });

  const traffic = classifyTraffic(base, worst, targetMarginPct);

  return {
    priceDown,
    tacosUp,
    unitsDown,
    worst,
    best,
    traffic,
  };
}

function buildDefaultDiagnostics(product, metrics) {
  const assumptions = product.assumptions;
  const resolved = metrics.resolved;
  const defaults = resolved.defaultBase;
  const overrideOn = (flag) => Boolean(flag);
  const totalCostMonthly = Math.max(metrics.totalCostMonthly, 0.0001);

  const formatterByType = {
    percent: formatPercent,
    currency: formatCurrency,
    number: formatNumber,
  };

  function makeEntry(key, config) {
    const {
      override,
      activeValue,
      formatType,
      source,
      impactMonthly,
      costNote,
      robustnessKey = key,
    } = config;

    const formatter = formatterByType[formatType] ?? formatNumber;
    const impactValue = Math.max(0, num(impactMonthly, 0));
    const impactPct = (impactValue / totalCostMonthly) * 100;
    const robustness = DEFAULT_ROBUSTNESS[robustnessKey] ?? {
      score: 50,
      why: "Keine feste Heuristik hinterlegt.",
    };
    const robustnessWord = robustnessLabel(robustness.score);

    const short = `${override ? "Override" : "Default"}: ${formatter(activeValue)} · Impact ~${formatPercent(impactPct)} · Robustheit: ${robustnessWord}`;
    const title = `${short}\nHerleitung: ${source}\nImpact auf Gesamtkosten: ca. ${formatCurrency(impactValue)} / Monat (${formatPercent(impactPct)}).\nRobustheit: ${robustness.score}/100 (${robustnessWord}) - ${robustness.why}\nHinweis: ${costNote}`;

    return { short, title };
  }

  return {
    "ads.tacosRate": makeEntry("ads.tacosRate", {
      override: overrideOn(assumptions.ads.overrideTacos),
      activeValue: resolved.tacosRate,
      formatType: "percent",
      source: `Kategorie-Default (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultTacos)}.`,
      impactMonthly: metrics.adsMonthly,
      costNote: "Direkter Treiber der Ads-Kosten im Unit-Economics-Block.",
    }),
    "ads.launchMultiplier": makeEntry("ads.launchMultiplier", {
      override: overrideOn(assumptions.ads.overrideLaunchMultiplier),
      activeValue: resolved.launchAdsMultiplier,
      formatType: "number",
      source: `Globaler Launch-Boost = ${formatNumber(defaults.defaultLaunchMultiplier)}.`,
      impactMonthly: metrics.launchAdsIncrementMonthly,
      costNote: "Verändert nur den zusätzlichen Ads-Druck in Launch-Monaten.",
    }),
    "ads.launchMonths": makeEntry("ads.launchMonths", {
      override: overrideOn(assumptions.ads.overrideLaunchMonths),
      activeValue: resolved.launchBoostMonths,
      formatType: "number",
      source: `Default = min(Zeitraum, ${formatNumber(GLOBAL_DEFAULTS.launchBoostMonths)} Monate).`,
      impactMonthly: metrics.launchAdsIncrementMonthly,
      costNote: "Bestimmt die Dauer des erhöhten TACoS-Fensters.",
    }),
    "returns.returnRate": makeEntry("returns.returnRate", {
      override: overrideOn(assumptions.returns.overrideReturnRate),
      activeValue: resolved.returnRate,
      formatType: "percent",
      source: `Kategorie-Default (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultReturnRate)}.`,
      impactMonthly: metrics.returnsMonthly,
      costNote: "Treiber für Retourenverluste und Handlingkosten.",
    }),
    "returns.sellableShare": makeEntry("returns.sellableShare", {
      override: overrideOn(assumptions.returns.overrideSellableShare),
      activeValue: resolved.sellableShare,
      formatType: "percent",
      source: `Kategorie-Default (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultSellableShare)}.`,
      impactMonthly: metrics.returnsMonthly,
      costNote: "Steuert den Anteil der Retouren ohne Warenverlust; Unsellable wird aus 100 - verkaufbar abgeleitet.",
    }),
    "returns.unsellableSharePctDerived": makeEntry("returns.unsellableSharePctDerived", {
      override: false,
      activeValue: 100 - resolved.sellableShare,
      formatType: "percent",
      source: "Abgeleitet aus verkaufbar%: unsellable = 100 - verkaufbar.",
      impactMonthly: metrics.returnsMonthly,
      costNote: "Nur Transparenzwert (read-only), wird nicht separat gepflegt.",
      robustnessKey: "returns.unsellableSharePctDerived",
    }),
    "returns.handlingCost": makeEntry("returns.handlingCost", {
      override: overrideOn(assumptions.returns.overrideHandlingCost),
      activeValue: resolved.returnHandlingCost,
      formatType: "currency",
      source: `Globaler Default für Retourenhandling = ${formatCurrency(defaults.defaultReturnHandling)} pro Retoure.`,
      impactMonthly: metrics.monthlyUnits * (resolved.returnRate / 100) * resolved.returnHandlingCost,
      costNote: "Fixer Kostensatz je Retoure zusätzlich zum Warenwertverlust.",
    }),
    "leakage.ratePct": makeEntry("leakage.ratePct", {
      override: overrideOn(assumptions.leakage.overrideRatePct),
      activeValue: resolved.leakageRatePct,
      formatType: "percent",
      source: `Globales Leakage = ${formatPercent(defaults.defaultLeakage)}.`,
      impactMonthly: metrics.block3Monthly,
      costNote: "Sicherheitsblock für nicht explizit modellierte Kosten.",
    }),
    "import.customsDutyRate": makeEntry("import.customsDutyRate", {
      override: overrideOn(assumptions.import.overrideCustomsDutyRate),
      activeValue: resolved.customsDutyRate,
      formatType: "percent",
      source: `Default China→DE = ${formatPercent(defaults.defaultCustomsRate)}.`,
      impactMonthly: metrics.customsMonthly,
      costNote: "Zoll fällt auf importierten Warenwert inkl. Shippinganteil an.",
    }),
    "import.importVatRate": makeEntry("import.importVatRate", {
      override: overrideOn(assumptions.import.overrideImportVatRate),
      activeValue: resolved.importVatRate,
      formatType: "percent",
      source: `Default EUSt = ${formatPercent(defaults.defaultImportVatRate)}.`,
      impactMonthly: metrics.importVatCostMonthly,
      costNote: resolved.includeImportVatAsCost
        ? "Aktiv als Kostenbestandteil in der Kalkulation."
        : "Nur für Cash-Bindung relevant, nicht als Kostenblock im P&L.",
    }),
    "amazon.referralRate": makeEntry("amazon.referralRate", {
      override: overrideOn(assumptions.amazon.overrideReferralRate),
      activeValue: resolved.referralRate,
      formatType: "percent",
      source: `Kategorie-Default Referral Fee (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultReferralRate)}.`,
      impactMonthly: metrics.referralMonthly,
      costNote: "Prozentual auf Brutto-Verkaufspreis mit Mindestgebühr.",
    }),
    "lifecycle.targetMarginPct": makeEntry("lifecycle.targetMarginPct", {
      override: overrideOn(assumptions.lifecycle.overrideTargetMarginPct),
      activeValue: resolved.targetMarginPct,
      formatType: "percent",
      source: `Kategorie-Zielmarge (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultTargetMargin)}.`,
      impactMonthly: 0,
      costNote: "Beeinflusst keine Kosten direkt, sondern den KPI 'Max TACoS'.",
    }),
    "lifecycle.otherMonthlyCost": makeEntry("lifecycle.otherMonthlyCost", {
      override: overrideOn(assumptions.lifecycle.overrideOtherMonthlyCost),
      activeValue: resolved.otherMonthlyCost,
      formatType: "currency",
      source: "Default ist 0 EUR, bis zusätzliche Lifecycle-Kosten hinterlegt werden.",
      impactMonthly: metrics.otherLifecycleMonthly,
      costNote: "Direkter Abzug im Launch/Lifecycle-Block pro Monat.",
    }),
  };
}

function asKpiClass(element, numericValue) {
  element.classList.remove("positive", "negative");
  if (!Number.isFinite(numericValue)) {
    return;
  }
  if (numericValue > 0) {
    element.classList.add("positive");
  } else if (numericValue < 0) {
    element.classList.add("negative");
  }
}

function setKpi(element, value, type) {
  let text = "-";
  if (type === "currency") {
    text = formatCurrency(value);
  } else if (type === "percent") {
    text = formatPercent(value);
  } else if (type === "months") {
    text = value === null ? "n/a" : `${formatNumber(value)} Monate`;
  } else if (type === "text") {
    text = String(value ?? "-");
  }

  element.textContent = text;
  if (type === "currency" || type === "percent") {
    asKpiClass(element, value);
  } else {
    element.classList.remove("positive", "negative");
  }
}

function tooltipForMetric(key, fallback = "") {
  return COST_METRIC_TOOLTIPS[key] ?? fallback;
}

function setTooltip(node, key, fallback = "") {
  if (!(node instanceof HTMLElement)) {
    return;
  }
  const text = tooltipForMetric(key, fallback);
  if (text) {
    node.title = text;
  }
}

function helpTextByKey(key) {
  if (!key) {
    return "";
  }
  if (UI_HELP_TEXT[key]) {
    return UI_HELP_TEXT[key];
  }
  if (COST_METRIC_TOOLTIPS[key]) {
    return COST_METRIC_TOOLTIPS[key];
  }
  if (KPI_HELP[key]) {
    return KPI_HELP[key];
  }
  if (FIELD_HELP[key]) {
    return FIELD_HELP[key];
  }
  if (SETTINGS_HELP[key]) {
    return SETTINGS_HELP[key];
  }
  return "";
}

function closeInlineHelpNotes(keepTrigger = null) {
  document.querySelectorAll(".inline-help-note").forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    if (keepTrigger && node.dataset.helpOwner && node.dataset.helpOwner === keepTrigger.dataset.helpOwner) {
      return;
    }
    node.remove();
  });
  document.querySelectorAll(".info-trigger[aria-expanded='true']").forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    if (keepTrigger && node === keepTrigger) {
      return;
    }
    node.setAttribute("aria-expanded", "false");
  });
}

function toggleInlineHelpNote(trigger) {
  if (!(trigger instanceof HTMLElement)) {
    return;
  }
  const key = trigger.dataset.helpKey ?? "";
  const text = helpTextByKey(key);
  if (!text) {
    return;
  }
  const host = trigger.closest(".help-context");
  if (!(host instanceof HTMLElement)) {
    return;
  }
  if (!trigger.dataset.helpOwner) {
    trigger.dataset.helpOwner = uid();
  }
  const owner = trigger.dataset.helpOwner;
  const existing = host.querySelector(`.inline-help-note[data-help-owner="${owner}"]`);
  if (existing instanceof HTMLElement) {
    existing.remove();
    trigger.setAttribute("aria-expanded", "false");
    return;
  }
  closeInlineHelpNotes(trigger);
  const note = document.createElement("p");
  note.className = "inline-help-note";
  note.dataset.helpOwner = owner;
  note.textContent = text;
  host.appendChild(note);
  trigger.setAttribute("aria-expanded", "true");
}

function classifyImpact(impactMonthly, totalCostMonthly) {
  const impact = Math.max(0, num(impactMonthly, 0));
  const base = Math.max(0.0001, num(totalCostMonthly, 0));
  const share = impact / base;
  if (share >= 0.12) {
    return { level: "high", label: "hoch", sharePct: share * 100 };
  }
  if (share >= 0.04) {
    return { level: "medium", label: "mittel", sharePct: share * 100 };
  }
  return { level: "low", label: "niedrig", sharePct: share * 100 };
}

function diagnosticsKeyFromPath(path) {
  if (!path) {
    return null;
  }
  const map = {
    "assumptions.ads.tacosRate": "ads.tacosRate",
    "assumptions.ads.launchMultiplier": "ads.launchMultiplier",
    "assumptions.ads.launchMonths": "ads.launchMonths",
    "assumptions.returns.returnRate": "returns.returnRate",
    "assumptions.returns.sellableShare": "returns.sellableShare",
    "assumptions.returns.resaleRate": "returns.sellableShare",
    "assumptions.returns.unsellableShare": "returns.unsellableSharePctDerived",
    "assumptions.returns.handlingCost": "returns.handlingCost",
    "assumptions.leakage.ratePct": "leakage.ratePct",
    "assumptions.import.customsDutyRate": "import.customsDutyRate",
    "assumptions.import.importVatRate": "import.importVatRate",
    "assumptions.amazon.referralRate": "amazon.referralRate",
    "assumptions.lifecycle.targetMarginPct": "lifecycle.targetMarginPct",
    "assumptions.lifecycle.otherMonthlyCost": "lifecycle.otherMonthlyCost",
    "assumptions.cartonization.unitsPerCarton": "cartonization.unitsPerCarton",
    "assumptions.cartonization.cartonLengthCm": "cartonization.cartonLengthCm",
    "assumptions.cartonization.cartonWidthCm": "cartonization.cartonWidthCm",
    "assumptions.cartonization.cartonHeightCm": "cartonization.cartonHeightCm",
    "assumptions.cartonization.cartonGrossWeightKg": "cartonization.cartonGrossWeightKg",
  };
  return map[path] ?? null;
}

function impactMonthlyFromPath(path, metrics) {
  if (!path || !metrics) {
    return 0;
  }
  if (path.startsWith("derived.shipping.")) {
    return metrics.shippingMonthly + metrics.customsMonthly;
  }
  if (path.startsWith("derived.threepl.")) {
    return metrics.threePlTotalPerUnit * metrics.monthlyUnits;
  }
  if (path.startsWith("derived.returns.")) {
    return metrics.returnsMonthly;
  }
  if (path.startsWith("derived.")) {
    return metrics.totalCostMonthly * 0.08;
  }
  if (path.startsWith("assumptions.ads.")) {
    return metrics.adsMonthly;
  }
  if (path.startsWith("assumptions.returns.")) {
    return metrics.returnsMonthly;
  }
  if (path.startsWith("assumptions.leakage.")) {
    return metrics.block3Monthly;
  }
  if (path.startsWith("assumptions.import.customsDutyRate")) {
    return metrics.customsMonthly;
  }
  if (path.startsWith("assumptions.amazon.")) {
    return metrics.referralMonthly + metrics.fbaFeeUnit * metrics.monthlyUnits;
  }
  if (path.startsWith("assumptions.extraCosts.")) {
    return (
      (metrics.orderFixedPerUnit +
        metrics.threePlInboundPerUnit +
        metrics.threePlStoragePerUnit +
        metrics.threePlOutboundServicePerUnit +
        metrics.threePlCarrierPerUnit +
        metrics.amazonStoragePerUnit +
        metrics.packagingUnit) *
      metrics.monthlyUnits
    );
  }
  if (path.startsWith("assumptions.cartonization.")) {
    return metrics.shippingMonthly;
  }
  if (path.startsWith("settings.shipping12m.") || path.startsWith("settings.cartonRules.")) {
    return metrics.shippingMonthly;
  }
  if (
    path.startsWith("settings.costDefaults.") ||
    path.startsWith("settings.threePl.") ||
    path.startsWith("settings.tax.")
  ) {
    return metrics.block1Monthly + metrics.block2Monthly;
  }
  return 0;
}

function driverTypePriority(path) {
  if (path.startsWith("basic.") || path.startsWith("assumptions.") || path.startsWith("workflow.")) {
    return 0;
  }
  if (path.startsWith("settings.")) {
    return 1;
  }
  if (path.startsWith("derived.")) {
    return 2;
  }
  return 3;
}

function sortDriverPathsForModal(paths, metrics) {
  const unique = [...new Set((paths ?? []).filter(Boolean))];
  return unique
    .map((path, idx) => ({
      path,
      idx,
      impactMonthly: impactMonthlyFromPath(path, metrics),
      priority: driverTypePriority(path),
    }))
    .sort((a, b) => {
      const diff = b.impactMonthly - a.impactMonthly;
      if (Math.abs(diff) > 0.0001) {
        return diff;
      }
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.idx - b.idx;
    })
    .map((row) => row.path);
}

function getDriverControl(path) {
  if (path.startsWith("settings.")) {
    const settingsPath = path.slice("settings.".length);
    const node = document.querySelector(`[data-settings-path="${settingsPath}"]`);
    return node instanceof HTMLElement ? node : null;
  }

  const node = document.querySelector(`[data-path="${path}"]`);
  return node instanceof HTMLElement ? node : null;
}

function clearDriverFocus() {
  document.querySelectorAll(".driver-focus").forEach((node) => node.classList.remove("driver-focus"));
}

function applyDriverFocus(paths, labelText = "") {
  clearDriverFocus();
  const unique = [...new Set((paths ?? []).filter(Boolean))];

  if (unique.length === 0) {
    state.ui.focusedDriverPaths = [];
    state.ui.focusedDriverLabel = "";
    if (dom.driverFocusHint) {
      dom.driverFocusHint.textContent =
        "Tipp: Klicke auf eine Kostenzeile. Die wichtigsten Treiber werden markiert (Impact: niedrig/mittel/hoch).";
    }
    return;
  }

  state.ui.focusedDriverPaths = unique;
  state.ui.focusedDriverLabel = labelText;

  unique.forEach((path) => {
    const control = getDriverControl(path);
    if (!control) {
      return;
    }

    control.classList.add("driver-focus");
    const label = control.closest("label");
    if (label) {
      label.classList.add("driver-focus");
    }

    if (path.startsWith("settings.")) {
      return;
    }

    const mappedFlag = OVERRIDE_CONTROL_MAP.find(([, valuePath]) => valuePath === path);
    if (mappedFlag) {
      const flagInput = document.querySelector(`[data-path="${mappedFlag[0]}"]`);
      if (flagInput) {
        flagInput.classList.add("driver-focus");
        const flagLabel = flagInput.closest("label");
        if (flagLabel) {
          flagLabel.classList.add("driver-focus");
        }
      }
    }
  });

  if (dom.driverFocusHint) {
    const rendered = unique.map((path) => `\`${path}\``).join(", ");
    dom.driverFocusHint.textContent = `Treiber für "${labelText || "Metrik"}": ${rendered}`;
  }
}

function setWorkspaceTab(tab) {
  state.ui.workspaceTab = tab === "settings" ? "settings" : "product";
  renderWorkspaceTabs();
}

function renderWorkspaceTabs() {
  if (APP_PAGE === "product" && dom.productWorkspace) {
    dom.productWorkspace.classList.remove("hidden");
  }
}

function getFieldControl(path) {
  if (path.startsWith("settings.")) {
    const settingsPath = path.slice("settings.".length);
    return document.querySelector(`[data-settings-path="${settingsPath}"]`);
  }
  return document.querySelector(`[data-path="${path}"]`);
}

function extractControlLabel(control, fallback) {
  if (!(control instanceof HTMLElement)) {
    return fallback;
  }
  const label = control.closest("label");
  if (!(label instanceof HTMLElement)) {
    return fallback;
  }
  const clone = label.cloneNode(true);
  clone.querySelectorAll("input, select, small, button").forEach((node) => node.remove());
  const text = clone.textContent?.replace(/\s+/g, " ").trim();
  return text || fallback;
}

function humanizePathSegment(segment) {
  return segment
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/pct/gi, "%")
    .replace(/\beur\b/gi, "EUR")
    .replace(/\bcbm\b/gi, "CBM")
    .replace(/\b3pl\b/gi, "3PL")
    .replace(/\s+/g, " ")
    .trim();
}

function fallbackLabelFromPath(path) {
  if (!path) {
    return "";
  }
  const normalized = path.startsWith("settings.") ? path : path;
  if (PATH_LABEL_OVERRIDES[normalized]) {
    return PATH_LABEL_OVERRIDES[normalized];
  }
  const segments = normalized.split(".");
  const last = segments[segments.length - 1] ?? normalized;
  return humanizePathSegment(last);
}

function resolveLabelForPath(path, control) {
  if (PATH_LABEL_OVERRIDES[path]) {
    return PATH_LABEL_OVERRIDES[path];
  }
  const controlLabel = extractControlLabel(control, "");
  if (controlLabel && controlLabel !== path) {
    return controlLabel;
  }
  return fallbackLabelFromPath(path);
}

function getPathHelp(path) {
  if (path.startsWith("derived.")) {
    return DERIVED_DRIVER_MAP[path]?.help ?? "";
  }
  if (path.startsWith("settings.")) {
    return SETTINGS_HELP[path.slice("settings.".length)] ?? "";
  }
  return FIELD_HELP[path] ?? "";
}

function settingsSectionIdFromPath(settingsPath) {
  const prefixed = settingsPath.startsWith("settings.") ? settingsPath : `settings.${settingsPath}`;
  if (prefixed.startsWith("settings.tax.")) {
    return "settingsTaxSection";
  }
  if (prefixed.startsWith("settings.shipping12m.")) {
    if (prefixed.startsWith("settings.shipping12m.modes.rail.")) {
      return "settingsShippingRailMode";
    }
    if (prefixed.startsWith("settings.shipping12m.manualSurcharge")) {
      return "settingsShippingRailMode";
    }
    if (prefixed.startsWith("settings.shipping12m.modes.sea_lcl.")) {
      return "settingsShippingSeaMode";
    }
    return "settingsShippingSection";
  }
  if (prefixed.startsWith("settings.cartonRules.")) {
    return "settingsCartonSection";
  }
  if (prefixed.startsWith("settings.threePl.receiving")) {
    return "settings3plReceivingSection";
  }
  if (
    prefixed.startsWith("settings.threePl.storage") ||
    prefixed.startsWith("settings.threePl.unitsPerPallet") ||
    prefixed.startsWith("settings.threePl.avgStorageMonths") ||
    prefixed.startsWith("settings.threePl.shelf")
  ) {
    return "settings3plStorageSection";
  }
  if (
    prefixed.startsWith("settings.threePl.outbound") ||
    prefixed.startsWith("settings.threePl.pickPack") ||
    prefixed.startsWith("settings.threePl.fbaProcessing") ||
    prefixed.startsWith("settings.threePl.insert") ||
    prefixed.startsWith("settings.threePl.thirdCountryLabel") ||
    prefixed.startsWith("settings.threePl.insertsPerCartonDefault") ||
    prefixed.startsWith("settings.threePl.labelsPerCartonDefault")
  ) {
    return "settings3plOutboundSection";
  }
  if (prefixed.startsWith("settings.threePl.carrierCostPerCartonEur")) {
    return "settings3plCarrierSection";
  }
  if (prefixed.startsWith("settings.amazonFba.")) {
    return "settingsAmazonSection";
  }
  if (
    prefixed.startsWith("settings.costDefaults.amazonStoragePerCbmMonthEur") ||
    prefixed.startsWith("settings.costDefaults.avgAmazonStorageMonths")
  ) {
    return "settingsAmazonSection";
  }
  if (prefixed.startsWith("settings.costDefaults.leakageRatePct")) {
    return "settingsOverheadSection";
  }
  if (prefixed.startsWith("settings.costDefaults.")) {
    return "settingsProductDefaultsSection";
  }
  if (prefixed.startsWith("settings.lifecycle.")) {
    return "settingsLifecycleSection";
  }
  if (prefixed.startsWith("settings.categoryDefaults.")) {
    return "settingsCategorySection";
  }
  return "settingsCategorySection";
}

function getProductSettingOverride(product, settingsPath) {
  return getByPath(product?.assumptions?.localSettingOverrides ?? {}, settingsPath);
}

function getEffectiveSettingValueForProduct(product, settingsPath) {
  const productOverride = getProductSettingOverride(product, settingsPath);
  if (productOverride !== undefined) {
    return productOverride;
  }
  return getByPath(state.settings, settingsPath);
}

function countProductsAffectedByGlobalSetting(settingsPath) {
  return state.products.filter((item) => getProductSettingOverride(item, settingsPath) === undefined).length;
}

function formatDerivedValue(value, formatType) {
  if (formatType === "currency") {
    return formatCurrency(num(value, 0));
  }
  if (formatType === "percent") {
    return formatPercent(num(value, 0));
  }
  if (formatType === "string") {
    return String(value ?? "-");
  }
  return formatNumber(num(value, 0));
}

function buildStageImpactItems(metrics, stage) {
  const threePlInboundMonthly = metrics.threePlInboundPerUnit * metrics.monthlyUnits;
  const threePlStorageMonthly = metrics.threePlStoragePerUnit * metrics.monthlyUnits;
  const threePlOutboundServiceMonthly = metrics.threePlOutboundServicePerUnit * metrics.monthlyUnits;
  const threePlCarrierMonthly = metrics.threePlCarrierPerUnit * metrics.monthlyUnits;
  const amazonStorageMonthly = metrics.amazonStoragePerUnit * metrics.monthlyUnits;
  const amazonFeesMonthly = metrics.referralMonthly + metrics.fbaFeeUnit * metrics.monthlyUnits + amazonStorageMonthly;
  const orderOpsMonthly = metrics.orderFixedPerUnit * metrics.monthlyUnits;
  const setupAmortizedMonthly = metrics.setupOneOffTotal / Math.max(1, metrics.horizonMonths);
  const unitBase = Math.max(1, metrics.monthlyUnits);
  const shippingImportUnit = metrics.shippingUnit + metrics.customsUnit + metrics.orderFixedPerUnit;
  const amazonFeesUnit = metrics.referralFeeUnit + metrics.fbaFeeUnit;
  const threePlCoreUnit =
    metrics.threePlInboundPerUnit +
    metrics.threePlStoragePerUnit +
    metrics.threePlOutboundServicePerUnit +
    metrics.threePlCarrierPerUnit;
  const listingLifecycleUnit = metrics.block2Monthly / unitBase;
  const leakageUnit = metrics.block3Monthly / unitBase;

  const quickItems = [
    {
      label: "Shipping & Import gesamt (EUR/Unit)",
      value: formatCurrency(shippingImportUnit),
      impactMonthly: (shippingImportUnit * metrics.monthlyUnits),
      explain: "Door-to-Door Shipping, Zoll und orderbezogene Import-Fixkosten pro Unit.",
      formula: "Shipping & Import/Unit = (Vorlauf + Hauptlauf variabel + Hauptlauf fix + Nachlauf + Zollabfertigung + Versicherung + Nachbelastung)/Unit + Zoll/Unit + Order-Fix/Unit.",
      source: `User-Input (Preis/EK/Maße) + Global Settings (Shipping ${metrics.shipping.modeLabel}, Kosten-Defaults) + Kategorie-Default (Zoll/Steuer).`,
      robustness: "Mittel (mehrere Annahmen entlang der Kette).",
      driverPaths: [
        "derived.shipping.unitsPerOrder",
        "derived.shipping.unitsPerCartonAuto",
        "derived.shipping.estimatedCartonLengthCm",
        "derived.shipping.estimatedCartonWidthCm",
        "derived.shipping.estimatedCartonHeightCm",
        "derived.shipping.estimatedCartonGrossWeightKg",
        "derived.shipping.cartonizationSource",
        "derived.shipping.cartonsCount",
        "derived.shipping.chargeableCbm",
        "basic.unitsPerOrder",
        "basic.packLengthCm",
        "basic.packWidthCm",
        "basic.packHeightCm",
        "basic.netWeightG",
        "assumptions.import.customsDutyRate",
        "assumptions.extraCosts.overridePackagingGroup",
        ...cartonizationProductPaths(),
        ...cartonizationSettingsPaths(),
        ...shippingModeDriverPaths(metrics.shipping.modeKey),
      ],
      pinned: true,
    },
    {
      label: "Amazon Fees (Referral + FBA) (EUR/Unit)",
      value: formatCurrency(amazonFeesUnit),
      impactMonthly: amazonFeesMonthly,
      explain: "Amazon-Transaktionskosten pro Unit aus Referral Fee und FBA Fee.",
      formula: "Amazon Fees/Unit = Referral/Unit + FBA Fee/Unit.",
      source: "Kategorie-Defaults + DE-Ratecard-Logik (2026-02) + globale Lager-Defaults.",
      robustness: "Mittel bis hoch (Referral stabil, FBA/Lager je nach Maße und Lagerdauer).",
      driverPaths: [
        "basic.marketplace",
        "basic.category",
        "assumptions.amazon.referralRate",
        "assumptions.amazon.useManualFbaFee",
        "assumptions.amazon.manualFbaFee",
        "derived.amazon.fbaFeeSource",
        "derived.amazon.fbaTierLabel",
        "derived.amazon.fbaShippingWeightG",
        "derived.amazon.fbaRateCardVersion",
        "settings.amazonFba.de.rateCardVersion",
        "settings.amazonFba.de.sourceUrl",
        "settings.amazonFba.de.volumetricDivisor",
        "assumptions.extraCosts.amazonStoragePerCbmMonthEur",
        "assumptions.extraCosts.avgAmazonStorageMonths",
      ],
      pinned: true,
    },
    {
      label: "3PL & Inbound (EUR/Unit)",
      value: formatCurrency(threePlCoreUnit),
      impactMonthly: (threePlCoreUnit * metrics.monthlyUnits),
      explain: "3PL Inbound, 3PL Lagerung, Service 3PL->Amazon und Carrier 3PL->Amazon pro Unit.",
      formula: "3PL gesamt/Unit = Inbound + Lagerung + Outbound Service + Carrier.",
      source: "Globale 3PL-Settings oder produktbezogener Override.",
      robustness: "Mittel (volumen- und lagerdauerabhängig).",
      driverPaths: [
        "derived.shipping.unitsPerOrder",
        "derived.shipping.unitsPerCartonAuto",
        "derived.shipping.estimatedCartonLengthCm",
        "derived.shipping.estimatedCartonWidthCm",
        "derived.shipping.estimatedCartonHeightCm",
        "derived.shipping.cartonizationSource",
        "derived.shipping.cartonsCount",
        "derived.threepl.inboundTotal",
        "derived.threepl.storageTotal",
        "derived.threepl.outboundServiceTotal",
        "derived.threepl.carrierTotal",
        "assumptions.extraCosts.overrideLogisticsGroup",
        "assumptions.extraCosts.receivingMode",
        "assumptions.extraCosts.receivingPerCartonSortedEur",
        "assumptions.extraCosts.receivingPerCartonMixedEur",
        "assumptions.extraCosts.storagePerPalletPerMonthEur",
        "assumptions.extraCosts.unitsPerPallet",
        "assumptions.extraCosts.avg3PlStorageMonths",
        "assumptions.extraCosts.outboundBasePerCartonEur",
        "assumptions.extraCosts.pickPackPerCartonEur",
        "assumptions.extraCosts.fbaProcessingPerCartonEur",
        "assumptions.extraCosts.insertsPerCarton",
        "assumptions.extraCosts.insertPerInsertEur",
        "assumptions.extraCosts.labelsPerCarton",
        "assumptions.extraCosts.thirdCountryLabelPerLabelEur",
        "assumptions.extraCosts.carrierCostPerCartonEur",
        "settings.threePl.receivingPerCartonSortedEur",
        "settings.threePl.storagePerPalletPerMonthEur",
        "settings.threePl.outboundBasePerCartonEur",
        "settings.threePl.carrierCostPerCartonEur",
      ],
      pinned: true,
    },
    {
      label: "Werbung/Ads inkl. Launch-Boost (EUR/Unit)",
      value: formatCurrency(metrics.adsUnit),
      impactMonthly: metrics.adsMonthly,
      explain: "TACoS-basiert inkl. Launch-Boost-Profil.",
      formula: "Ads/Unit = Brutto-Preis × effektiver TACoS%; effektiver TACoS berücksichtigt Launch-Boost.",
      source: "User-Input TACoS + Kategorie-/Launch-Defaults.",
      robustness: "Niedrig bis mittel (stark markt- und rankingabhängig).",
      driverPaths: [
        "assumptions.ads.tacosRate",
        "assumptions.ads.launchMultiplier",
        "assumptions.ads.launchMonths",
        "basic.launchCompetition",
      ],
      pinned: true,
    },
    {
      label: "Retourenverlust (EUR/Unit)",
      value: formatCurrency(metrics.returnsUnit),
      impactMonthly: metrics.returnsMonthly,
      explain: "Retourenverlust plus Handlingkosten.",
      formula: "Retouren/Unit = Retourenquote × (((1 - verkaufbar%) × Landed) + Handling je Retoure).",
      source: "Kategorie-Defaults für Retouren + User-Override.",
      robustness: "Niedrig bis mittel (qualitäts- und listingabhängig).",
      driverPaths: [
        "assumptions.returns.returnRate",
        "assumptions.returns.sellableShare",
        "assumptions.returns.handlingCost",
        "derived.returns.returnLossPerReturnEur",
        "derived.returns.returnCostPerReturnEur",
      ],
    },
    {
      label: "Listing & Lifecycle (EUR/Unit)",
      value: formatCurrency(listingLifecycleUnit),
      impactMonthly: metrics.block2Monthly,
      explain: "Amortisierte Listing-, Launch- und Lifecycle-Kosten pro Unit.",
      formula: "Listing & Lifecycle/Unit = Block 2/Monat ÷ Monatsabsatz.",
      source: "Global Listing/Lifecycle Settings + Launchbudget.",
      robustness: "Mittel bis hoch.",
      driverPaths: [
        "basic.launchBudgetTotal",
        "basic.listingPackage",
        "basic.horizonMonths",
        "settings.lifecycle.defaultMonths",
        "assumptions.lifecycle.otherMonthlyCost",
      ],
    },
    {
      label: "Leakage/Overhead (EUR/Unit)",
      value: formatCurrency(leakageUnit),
      impactMonthly: metrics.block3Monthly,
      explain: "Pauschaler Overhead-Block auf Netto-Umsatz.",
      formula: "Leakage/Unit = (Netto-Umsatz/Monat × Leakage%-Satz) / Monatsabsatz.",
      source: "Globales Leakage-Setting (2-5% üblich).",
      robustness: "Mittel (bewusster Sicherheitsblock).",
      driverPaths: ["assumptions.leakage.ratePct", "basic.priceGross", "basic.demandValue", "basic.demandBasis"],
    },
  ];

  const validationItems = [
    {
      label: "Door-to-Door Shipping / Monat",
      value: formatCurrency(metrics.shippingMonthly),
      impactMonthly: metrics.shippingMonthly,
      explain: "Internationaler D2D-Anteil aus Fixblöcken + variablem W/M-Tarif.",
      formula: `Shipping Total (${metrics.shipping.modeLabel}) = Vorlauf + Hauptlauf variabel + Hauptlauf fix + Nachlauf + Zollabfertigung + Versicherung + Nachbelastung.`,
      source: `Globale 12M-Settings (${metrics.shipping.modeLabel}) + Produktmaße/-gewicht/-Menge.`,
      robustness: "Mittel (Richtwert, kein Live-Spot-Tarif).",
      driverPaths: [
        "derived.shipping.unitsPerCartonAuto",
        "derived.shipping.estimatedCartonLengthCm",
        "derived.shipping.estimatedCartonWidthCm",
        "derived.shipping.estimatedCartonHeightCm",
        "derived.shipping.estimatedCartonGrossWeightKg",
        "derived.shipping.cartonizationSource",
        "basic.unitsPerOrder",
        "basic.netWeightG",
        "basic.packLengthCm",
        "basic.packWidthCm",
        "basic.packHeightCm",
        ...cartonizationProductPaths(),
        ...cartonizationSettingsPaths(),
        ...shippingModeDriverPaths(metrics.shipping.modeKey),
      ],
      pinned: true,
    },
    {
      label: "3PL Lagerung / Monat",
      value: formatCurrency(threePlStorageMonthly),
      impactMonthly: threePlStorageMonthly,
      explain: "3PL Lagerkosten aus Palette/Monat, Lagerdauer und Units je Palette.",
      formula: "3PL Lager/Unit = (EUR je Palette/Monat × Lagerdauer) / Units je Palette.",
      source: "Globale 3PL-Defaults oder Produkt-Override.",
      robustness: "Mittel bis hoch (interner Vertrag meist stabil).",
      driverPaths: [
        "assumptions.extraCosts.storagePerPalletPerMonthEur",
        "assumptions.extraCosts.unitsPerPallet",
        "assumptions.extraCosts.avg3PlStorageMonths",
        "settings.threePl.storagePerPalletPerMonthEur",
      ],
      pinned: true,
    },
    {
      label: "Amazon Lagerung / Monat",
      value: formatCurrency(amazonStorageMonthly),
      impactMonthly: amazonStorageMonthly,
      explain: "Amazon-Lagerkosten aus EUR/CBM, Lagerdauer und Unit-CBM.",
      formula: "Amazon Lager/Unit = EUR je CBM/Monat × Amazon-Lagerdauer × Unit-CBM.",
      source: "Globale Lager-Defaults + Produktmaße.",
      robustness: "Mittel (saisonal und dimensionsabhängig).",
      driverPaths: [
        "assumptions.extraCosts.amazonStoragePerCbmMonthEur",
        "assumptions.extraCosts.avgAmazonStorageMonths",
        "basic.packLengthCm",
        "basic.packWidthCm",
        "basic.packHeightCm",
      ],
      pinned: true,
    },
    {
      label: "3PL Inbound + Service + Carrier / Monat",
      value: formatCurrency(threePlInboundMonthly + threePlOutboundServiceMonthly + threePlCarrierMonthly),
      impactMonthly: threePlInboundMonthly + threePlOutboundServiceMonthly + threePlCarrierMonthly,
      explain: "Receiving, Outbound-Service und Carrier auf Basis Kartonanzahl.",
      formula: "Monatsanteil = (Inbound/Unit + Outbound Service/Unit + Carrier/Unit) × Monatsabsatz.",
      source: "3PL-Settings + Auto-Kartonisierung.",
      robustness: "Mittel (karton- und mengenabhängig).",
      driverPaths: [
        "derived.shipping.unitsPerOrder",
        "derived.shipping.unitsPerCartonAuto",
        "derived.shipping.cartonsCount",
        "derived.threepl.inboundTotal",
        "assumptions.extraCosts.receivingMode",
        "assumptions.extraCosts.receivingPerCartonSortedEur",
        "assumptions.extraCosts.receivingPerCartonMixedEur",
        "assumptions.extraCosts.outboundBasePerCartonEur",
        "assumptions.extraCosts.pickPackPerCartonEur",
        "assumptions.extraCosts.fbaProcessingPerCartonEur",
        "assumptions.extraCosts.carrierCostPerCartonEur",
        "basic.unitsPerOrder",
        "basic.packLengthCm",
        "basic.packWidthCm",
        "basic.packHeightCm",
        ...cartonizationProductPaths(),
        ...cartonizationSettingsPaths(),
      ],
    },
    {
      label: "Order-Fixkosten / Monat",
      value: formatCurrency(orderOpsMonthly),
      impactMonthly: orderOpsMonthly,
      explain: "Dokumentation und Frachtpapiere je Import-Order.",
      formula: "Order-Fix/Unit = (Dokumentation + Frachtpapiere) / Units pro Order.",
      source: "Global costDefaults oder Produkt-Override.",
      robustness: "Hoch (fixe Prozesskosten).",
      driverPaths: [
        "assumptions.extraCosts.docsPerOrderEur",
        "assumptions.extraCosts.freightPapersPerOrderEur",
        "settings.costDefaults.docsPerOrderEur",
        "settings.costDefaults.freightPapersPerOrderEur",
      ],
    },
    {
      label: "Launch-PPC Mehrkosten / Monat",
      value: formatCurrency(metrics.launchAdsIncrementMonthly),
      impactMonthly: metrics.launchAdsIncrementMonthly,
      explain: "Zusätzlicher Ads-Kostenanteil durch Launch-Boost-Profil.",
      formula: "Launch-PPC Mehrkosten = (Ads mit Boost - Ads ohne Boost) × Monatsabsatz.",
      source: "Launch-Profil in Settings + TACoS-Annahmen.",
      robustness: "Niedrig bis mittel (kampagnenabhängig).",
      driverPaths: [
        "assumptions.ads.launchMultiplier",
        "assumptions.ads.launchMonths",
        "basic.launchCompetition",
      ],
    },
    {
      label: "Leakage / Monat",
      value: formatCurrency(metrics.block3Monthly),
      impactMonthly: metrics.block3Monthly,
      explain: "Pauschaler Overhead-Block auf Netto-Umsatz.",
      driverPaths: ["assumptions.leakage.ratePct", "basic.priceGross", "basic.demandValue", "basic.demandBasis"],
    },
  ];

  const deepDiveItems = [
    {
      label: "Setupkosten gesamt (einmalig)",
      value: formatCurrency(metrics.setupOneOffTotal),
      impactMonthly: setupAmortizedMonthly,
      explain: "Samples, Tooling, Zertifikate und Quality Inspection (einmalig).",
      formula: "Setup total = Samples + Tooling + Zertifikate + Inspection; optional amortisiert pro Monat.",
      source: "Global costDefaults oder Produkt-Override.",
      robustness: "Hoch (einmalige, planbare Kosten).",
      driverPaths: [
        "assumptions.extraCosts.overrideLaunchOpsGroup",
        "assumptions.extraCosts.samplesPerProductEur",
        "assumptions.extraCosts.toolingPerProductEur",
        "assumptions.extraCosts.certificatesPerProductEur",
        "assumptions.extraCosts.inspectionPerProductEur",
        "settings.costDefaults.samplesPerProductEur",
        "settings.costDefaults.toolingPerProductEur",
      ],
      pinned: true,
    },
    {
      label: "Listing-Paket gesamt (einmalig)",
      value: formatCurrency(metrics.listingPackageCost),
      impactMonthly: metrics.listingMonthly,
      explain: "Listing-Erstellung, Bilder/Infografiken und A+ Content.",
      formula: "Listing total = Listing + Bilder/Infografiken + A+ (je Paket).",
      source: "Globale Listing-Paket-Settings (KI/Fotograf/Visual Advantage).",
      robustness: "Hoch (dienstleistungsbasiert, gut planbar).",
      driverPaths: [
        "basic.listingPackage",
        "settings.lifecycle.listingPackages.ai.listingCreationEur",
        "settings.lifecycle.listingPackages.photographer.imagesInfographicsEur",
        "settings.lifecycle.listingPackages.visual_advantage.aPlusContentEur",
      ],
      pinned: true,
    },
    {
      label: "Launch-Budget / Monat",
      value: formatCurrency(metrics.launchMonthly),
      impactMonthly: metrics.launchMonthly,
      explain: "Launchbudget amortisiert auf den Betrachtungszeitraum.",
      formula: "Launch/Monat = Launchbudget gesamt / Betrachtungszeitraum (Monate).",
      source: "User-Input + ggf. Launch-Split.",
      robustness: "Hoch (direkte Budgetvorgabe).",
      driverPaths: ["basic.launchBudgetTotal", "basic.horizonMonths"],
    },
    {
      label: "Launch Ops (Grußkarte + Setup) / Monat",
      value: formatCurrency(metrics.launchOpsMonthly),
      impactMonthly: metrics.launchOpsMonthly,
      explain: "Launch-Operationskosten inklusive Grußkarten und Einmalkosten.",
      formula: "Launch Ops/Monat = (Grußkarten total + Setup total) / Betrachtungszeitraum.",
      source: "Global costDefaults oder Produkt-Override.",
      robustness: "Mittel bis hoch (teilweise volumenabhängig).",
      driverPaths: [
        "assumptions.extraCosts.greetingCardPerLaunchUnitEur",
        "assumptions.extraCosts.samplesPerProductEur",
        "assumptions.extraCosts.toolingPerProductEur",
        "assumptions.extraCosts.certificatesPerProductEur",
        "assumptions.extraCosts.inspectionPerProductEur",
      ],
    },
    {
      label: "Zoll / Monat",
      value: formatCurrency(metrics.customsMonthly),
      impactMonthly: metrics.customsMonthly,
      explain: "Zoll auf Warenwert plus Shipping D2D.",
      formula: "Zoll/Unit = Zollsatz × (Warenwert EUR + Shipping D2D/Unit); danach × Monatsabsatz.",
      source: "Globaler Zollsatz aus Settings (oder Produkt-Override).",
      robustness: "Hoch (tariflich vorgegeben).",
      driverPaths: ["assumptions.import.customsDutyRate", "settings.tax.customsDutyRatePct", "basic.exwUnit", "basic.unitsPerOrder"],
    },
    {
      label: "Leakage / Monat",
      value: formatCurrency(metrics.block3Monthly),
      impactMonthly: metrics.block3Monthly,
      explain: "Pauschaler Overhead-Block auf Netto-Umsatz.",
      driverPaths: ["assumptions.leakage.ratePct", "basic.priceGross", "basic.demandValue", "basic.demandBasis"],
    },
  ];

  const stageMap = {
    quick: quickItems,
    validation: validationItems,
    deep_dive: deepDiveItems,
  };

  const allItems = (stageMap[stage] ?? quickItems).map((item, index) => ({ ...item, id: `${stage}-${index}` }));
  const pinned = allItems.filter((item) => item.pinned);
  const nonPinned = allItems
    .filter((item) => !item.pinned)
    .sort((a, b) => Math.max(0, num(b.impactMonthly, 0)) - Math.max(0, num(a.impactMonthly, 0)));

  const limit = stage === "quick" ? 7 : 6;
  return [...pinned, ...nonPinned].slice(0, limit);
}

function openDriverModal(payload) {
  const selected = getSelectedProduct();
  const paths = normalizeDriverPathsForModal(payload?.driverPaths ?? [], selected);
  if (!payload || paths.length === 0) {
    return;
  }
  state.ui.driverModal = {
    title: payload.title || payload.label || "Treiber-Maske",
    value: payload.value ?? "",
    explain: payload.explain ?? "",
    formula: payload.formula ?? "",
    source: payload.source ?? "",
    robustness: payload.robustness ?? "",
    driverPaths: paths,
    detailPreset: payload.detailPreset ?? null,
    reviewStage: payload.reviewStage ?? null,
    reviewTargetId: payload.reviewTargetId ?? null,
  };
  renderDriverModal();
}

function ensureShipping3dCleanup(scopeKey = "driver_modal") {
  if (window.Packaging3D && typeof window.Packaging3D.unmountAll === "function") {
    try {
      window.Packaging3D.unmountAll(scopeKey);
    } catch (error) {
      console.error("Shipping 3D cleanup failed", error);
    }
  }
  if (scopeKey === "inline") {
    state.ui.shipping3dInlineCleanup = null;
    return;
  }
  state.ui.shipping3dCleanup = null;
}

function closeDriverModal() {
  ensureShipping3dCleanup();
  state.ui.driverModal = null;
  if (dom.driverModal) {
    dom.driverModal.classList.add("hidden");
  }
  applyDriverFocus([], "");
}

function cloneControlForModal(sourceControl, { path = "", settingsPath = "" } = {}) {
  const fallbackSelectOptions = {
    "basic.category": [
      ["home", "Home & Küche"],
      ["beauty", "Beauty"],
      ["electronics", "Elektronik"],
      ["apparel", "Bekleidung"],
      ["pet", "Haustier"],
      ["generic", "Sonstiges"],
    ],
    "basic.demandBasis": [
      ["month", "Einheiten / Monat"],
      ["day", "Einheiten / Tag"],
    ],
    "basic.transportMode": [
      ["rail", "Rail (Default)"],
      ["sea_lcl", "Sea LCL"],
    ],
    "basic.marketplace": [
      ["DE", "Amazon.de"],
      ["FR", "Amazon.fr"],
      ["IT", "Amazon.it"],
      ["ES", "Amazon.es"],
    ],
    "basic.fulfillmentModel": [["fba", "FBA"]],
    "basic.listingPackage": [
      ["ai", "KI"],
      ["photographer", "Fotograf"],
      ["visual_advantage", "Visual Advantage"],
    ],
    "basic.launchCompetition": [
      ["low", "Low"],
      ["medium", "Medium"],
      ["high", "High"],
    ],
    "assumptions.extraCosts.receivingMode": [
      ["sorted", "sorted"],
      ["mixed", "mixed"],
    ],
    "shipping12m.insurance.basis": [["goods_value_eur", "Nur Warenwert (EUR)"]],
    "cartonRules.estimationMode": [
      ["conservative", "Konservativ"],
      ["balanced", "Balanced"],
      ["maximal", "Maximal"],
    ],
  };
  const createSelectFromOptions = (options) => {
    const select = document.createElement("select");
    (options ?? []).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    return select;
  };

  if (sourceControl instanceof HTMLSelectElement) {
    const select = document.createElement("select");
    Array.from(sourceControl.options).forEach((option) => {
      const clone = document.createElement("option");
      clone.value = option.value;
      clone.textContent = option.textContent;
      clone.disabled = option.disabled;
      select.appendChild(clone);
    });
    return select;
  }

  if (sourceControl instanceof HTMLInputElement && sourceControl.type === "checkbox") {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    return checkbox;
  }

  if (path && BOOLEAN_PATHS.has(path)) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    return checkbox;
  }
  if (settingsPath && SETTINGS_BOOLEAN_PATHS.has(settingsPath)) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    return checkbox;
  }

  if (path && STRING_PATHS.has(path)) {
    const options = fallbackSelectOptions[path];
    if (options) {
      return createSelectFromOptions(options);
    }
    const text = document.createElement("input");
    text.type = "text";
    return text;
  }
  if (settingsPath && SETTINGS_STRING_PATHS.has(settingsPath)) {
    const options = fallbackSelectOptions[settingsPath];
    if (options) {
      return createSelectFromOptions(options);
    }
    const text = document.createElement("input");
    text.type = "text";
    return text;
  }

  const input = document.createElement("input");
  if (sourceControl instanceof HTMLInputElement) {
    input.type = sourceControl.type || "text";
    if (sourceControl.min !== "") {
      input.min = sourceControl.min;
    }
    if (sourceControl.max !== "") {
      input.max = sourceControl.max;
    }
    if (sourceControl.step !== "") {
      input.step = sourceControl.step;
    }
    input.placeholder = sourceControl.placeholder;
  } else {
    input.type = "number";
    input.step = "0.01";
  }
  return input;
}

function refreshAfterModalInput() {
  renderComputedViews();
  const selected = getSelectedProduct();
  if (selected) {
    renderInputs(selected);
  }
  renderDriverModal();
  applyMouseoverHelp();
}

function settingsValueText(path, value) {
  if (typeof value === "boolean") {
    return value ? "aktiv" : "inaktiv";
  }
  if (SETTINGS_STRING_PATHS.has(path)) {
    if (path === "shipping12m.insurance.basis") {
      return value === "goods_value_eur" ? "Nur Warenwert (EUR)" : String(value ?? "-");
    }
    return String(value ?? "-");
  }
  if (
    path.endsWith("Pct") ||
    /(?:referralRate|tacosRate|returnRate|sellableShare|resaleRate|unsellableShare|customsDutyRate|importVatRate|targetMarginPct)$/.test(path)
  ) {
    return formatPercent(num(value, 0));
  }
  if (path.endsWith("Eur") || path.includes("EurPer") || path.includes("cost") || path.includes("Cost")) {
    return formatCurrency(num(value, 0));
  }
  return formatNumber(num(value, 0));
}

function getGroupOverridePath(path) {
  if (!path.startsWith("assumptions.extraCosts.")) {
    return null;
  }
  if (path.includes("packagingPerUnitEur") || path.includes("otherUnitCostEur")) {
    return "assumptions.extraCosts.overridePackagingGroup";
  }
  if (
    path.includes("docsPerOrderEur") ||
    path.includes("freightPapersPerOrderEur") ||
    path.includes("receiving") ||
    path.includes("storagePerPallet") ||
    path.includes("unitsPerPallet") ||
    path.includes("avg3PlStorageMonths") ||
    path.includes("outboundBasePerCartonEur") ||
    path.includes("pickPackPerCartonEur") ||
    path.includes("fbaProcessingPerCartonEur") ||
    path.includes("insertsPerCarton") ||
    path.includes("insertPerInsertEur") ||
    path.includes("labelsPerCarton") ||
    path.includes("thirdCountryLabelPerLabelEur") ||
    path.includes("carrierCostPerCartonEur") ||
    path.includes("amazonStoragePerCbmMonthEur") ||
    path.includes("avgAmazonStorageMonths")
  ) {
    return "assumptions.extraCosts.overrideLogisticsGroup";
  }
  if (
    path.includes("greetingCardPerLaunchUnitEur") ||
    path.includes("samplesPerProductEur") ||
    path.includes("toolingPerProductEur") ||
    path.includes("certificatesPerProductEur") ||
    path.includes("inspectionPerProductEur")
  ) {
    return "assumptions.extraCosts.overrideLaunchOpsGroup";
  }
  return null;
}

function normalizeDriverPathForModal(path, selected) {
  if (!path) {
    return null;
  }
  if (!(selected && typeof selected === "object")) {
    return path;
  }

  if (path.startsWith("assumptions.extraCosts.")) {
    const mappedSettingPath = EXTRA_COST_TO_SETTING_PATH[path];
    if (mappedSettingPath) {
      const overridePath = getGroupOverridePath(path);
      const overrideActive = overridePath ? Boolean(getByPath(selected, overridePath)) : false;
      return overrideActive ? path : mappedSettingPath;
    }
  }

  if (path.startsWith("settings.")) {
    const mappedAssumptionPath = SETTING_TO_EXTRA_COST_PATH.get(path);
    if (mappedAssumptionPath) {
      const overridePath = getGroupOverridePath(mappedAssumptionPath);
      const overrideActive = overridePath ? Boolean(getByPath(selected, overridePath)) : false;
      return overrideActive ? mappedAssumptionPath : path;
    }
  }

  return path;
}

function normalizeToCanonicalDriverKey(path, selected) {
  const normalized = normalizeDriverPathForModal(path, selected);
  if (!normalized) {
    return null;
  }
  const aliases = {
    "assumptions.extraCosts.amazonStoragePerCbmMonthEur": "canonical.amazon.storage.rate",
    "settings.costDefaults.amazonStoragePerCbmMonthEur": "canonical.amazon.storage.rate",
    "assumptions.extraCosts.avgAmazonStorageMonths": "canonical.amazon.storage.months",
    "settings.costDefaults.avgAmazonStorageMonths": "canonical.amazon.storage.months",
  };
  return aliases[normalized] ?? normalized;
}

function dedupeDriverFieldsByCanonicalKey(paths, selected) {
  const unique = [...new Set((paths ?? []).filter(Boolean))];
  const normalized = [];
  const seen = new Set();
  unique.forEach((path) => {
    const mapped = normalizeDriverPathForModal(path, selected);
    const canonical = normalizeToCanonicalDriverKey(mapped, selected);
    if (!mapped || !canonical || seen.has(canonical)) {
      return;
    }
    seen.add(canonical);
    normalized.push(mapped);
  });
  return normalized;
}

function normalizeDriverPathsForModal(paths, selected) {
  return dedupeDriverFieldsByCanonicalKey(paths, selected);
}

function modalGroupForPath(path) {
  if (path.startsWith("derived.")) {
    return "calculated";
  }
  if (path.startsWith("settings.")) {
    return "defaults";
  }
  return "user";
}

const SHIPPING_DEFAULT_MODAL_GROUPS = [
  { key: "carton_rules", title: "Kartonregeln" },
  { key: "rail", title: "Rail" },
  { key: "sea_lcl", title: "Sea LCL" },
  { key: "addons", title: "Add-ons" },
];

const SHIPPING_DEFAULT_PATH_ORDER = [
  "settings.cartonRules.maxLengthCm",
  "settings.cartonRules.maxWidthCm",
  "settings.cartonRules.maxHeightCm",
  "settings.cartonRules.maxWeightKg",
  "settings.cartonRules.outerBufferCm",
  "settings.cartonRules.grossWeightUpliftPct",
  "settings.cartonRules.equivalentCartonFillPct",
  "settings.shipping12m.modes.rail.rateEurPerCbm",
  "settings.shipping12m.modes.rail.originBaseEurPerShipment",
  "settings.shipping12m.modes.rail.originPerCbmEur",
  "settings.shipping12m.modes.rail.mainRunFixedEurPerShipment",
  "settings.shipping12m.modes.rail.deOncarriageBaseEurPerShipment",
  "settings.shipping12m.modes.rail.deOncarriagePerCbmEur",
  "settings.shipping12m.modes.sea_lcl.rateEurPerCbm",
  "settings.shipping12m.modes.sea_lcl.originFixedEurPerShipment",
  "settings.shipping12m.modes.sea_lcl.destinationFixedEurPerShipment",
  "settings.shipping12m.modes.sea_lcl.deOncarriageFixedEurPerShipment",
  "settings.shipping12m.customsBrokerEnabled",
  "settings.shipping12m.customsBrokerFixedEurPerShipment",
  "settings.shipping12m.insurance.enabled",
  "settings.shipping12m.insurance.basis",
  "settings.shipping12m.insurance.ratePct",
  "settings.shipping12m.manualSurchargeEnabled",
  "settings.shipping12m.manualSurchargeEurPerShipment",
];

const SHIPPING_DEFAULT_PATH_ORDER_MAP = new Map(
  SHIPPING_DEFAULT_PATH_ORDER.map((path, index) => [path, index]),
);

function shippingDefaultModalGroupKey(path) {
  if (!path.startsWith("settings.")) {
    return null;
  }
  if (path.startsWith("settings.cartonRules.")) {
    return "carton_rules";
  }
  if (path.startsWith("settings.shipping12m.modes.rail.")) {
    return "rail";
  }
  if (path.startsWith("settings.shipping12m.modes.sea_lcl.")) {
    return "sea_lcl";
  }
  if (
    path.startsWith("settings.shipping12m.customsBroker") ||
    path.startsWith("settings.shipping12m.insurance.") ||
    path.startsWith("settings.shipping12m.manualSurcharge")
  ) {
    return "addons";
  }
  return null;
}

function shippingDefaultPathOrderRank(path) {
  const rank = SHIPPING_DEFAULT_PATH_ORDER_MAP.get(path);
  return rank === undefined ? Number.POSITIVE_INFINITY : rank;
}

function buildDriverFieldBadges(path, selected, diagnostics, metrics) {
  const badges = [];
  if (path.startsWith("derived.")) {
    badges.push({ tone: "neutral", label: "Abgeleitet", title: "Reiner Rechenwert (read-only)." });
  } else if (path.startsWith("settings.")) {
    badges.push({ tone: "info", label: "Global Setting", title: "Dieser Wert gilt produktübergreifend." });
  } else if (path.startsWith("basic.")) {
    badges.push({ tone: "primary", label: "User Input", title: "Direkte Produkteingabe." });
  } else if (path.startsWith("workflow.")) {
    badges.push({ tone: "primary", label: "Produktstatus", title: "Produktbezogener Workflow-Status." });
  } else {
    const overridePath = VALUE_TO_OVERRIDE_MAP.get(path) || getGroupOverridePath(path);
    if (overridePath) {
      const active = Boolean(getByPath(selected, overridePath));
      const overrideLabel = fallbackLabelFromPath(overridePath);
      if (active) {
        badges.push({ tone: "warn", label: "Produkt Override", title: `Aktiv über "${overrideLabel}".` });
      } else {
        badges.push({ tone: "ok", label: "Default aktiv", title: `Kein Override: Wert kommt aus Defaults/Settings.` });
      }
    } else if (path.startsWith("assumptions.")) {
      badges.push({ tone: "ok", label: "Annahme", title: "Produktannahme im Modell." });
    }

    const diagKey = diagnosticsKeyFromPath(path);
    const diag = diagKey ? diagnostics[diagKey] : null;
    if (diag) {
      badges.push({ tone: "neutral", label: "Default-Info", title: diag.short });
    }
  }

  if (metrics) {
    const impact = classifyImpact(impactMonthlyFromPath(path, metrics), metrics.totalCostMonthly);
    badges.push({
      tone: `impact-${impact.level}`,
      label: `Impact ${impact.label}`,
      title: `Anteil an Gesamtkosten: ${formatPercent(impact.sharePct)}.`,
    });
  }

  return badges;
}

function appendModalBadges(container, badgeItems) {
  const badges = document.createElement("div");
  badges.className = "modal-badges";
  badgeItems.forEach((item) => {
    const badge = document.createElement("span");
    badge.className = `modal-badge ${item.tone}`;
    badge.textContent = item.label;
    if (item.title) {
      badge.title = item.title;
    }
    badges.appendChild(badge);
  });
  if (badges.childElementCount > 0) {
    container.appendChild(badges);
  }
}

function mergeModalBadgeItems(...badgeLists) {
  const merged = new Map();
  badgeLists.flat().forEach((item) => {
    if (!item || !item.label) {
      return;
    }
    const key = `${item.tone}|${item.label}`;
    if (!merged.has(key)) {
      merged.set(key, item);
    }
  });
  return [...merged.values()];
}

function buildAmazonFbaOverrideModalField(selected, metrics, diagnostics) {
  if (!selected) {
    return null;
  }

  const manualEnabled = Boolean(getByPath(selected, AMAZON_FBA_MANUAL_OVERRIDE_PATH));
  const manualValue = num(getByPath(selected, AMAZON_FBA_MANUAL_FEE_PATH), 0);
  const rateCardReference = fbaRateCardReferenceSnapshot(metrics);

  const field = document.createElement("article");
  field.className = "modal-field modal-field-wide";

  const head = document.createElement("div");
  head.className = "modal-field-head";
  const strong = document.createElement("strong");
  strong.textContent = "FBA Fee Override (statt Auto-Tier)";
  head.appendChild(strong);
  field.appendChild(head);

  appendModalBadges(
    field,
    mergeModalBadgeItems(
      buildDriverFieldBadges(AMAZON_FBA_MANUAL_OVERRIDE_PATH, selected, diagnostics, metrics),
      buildDriverFieldBadges(AMAZON_FBA_MANUAL_FEE_PATH, selected, diagnostics, metrics),
    ),
  );

  const baseInfo = document.createElement("small");
  baseInfo.textContent = `Berechneter Tabellenpreis (DE Ratecard): ${rateCardReference.detailText}.`;
  field.appendChild(baseInfo);

  if (!rateCardReference.available && rateCardReference.metaText) {
    const baseMeta = document.createElement("small");
    baseMeta.textContent = rateCardReference.metaText;
    field.appendChild(baseMeta);
  }

  const toggleWrap = document.createElement("label");
  toggleWrap.className = "toggle-row";
  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.checked = manualEnabled;
  toggle.addEventListener("change", () => {
    updateSelectedField(AMAZON_FBA_MANUAL_OVERRIDE_PATH, toggle.checked);
    markReviewOverriddenFromModal(selected);
    refreshAfterModalInput();
  });
  const toggleText = document.createElement("span");
  toggleText.textContent = "Override aktivieren (manueller FBA-Wert)";
  toggleWrap.append(toggle, toggleText);
  field.appendChild(toggleWrap);

  const sourceControl = getFieldControl(AMAZON_FBA_MANUAL_FEE_PATH);
  let manualInput = cloneControlForModal(sourceControl, { path: AMAZON_FBA_MANUAL_FEE_PATH });
  if (!(manualInput instanceof HTMLInputElement)) {
    manualInput = document.createElement("input");
    manualInput.type = "number";
  }
  manualInput.type = "number";
  if (!manualInput.min) {
    manualInput.min = "0";
  }
  if (!manualInput.step) {
    manualInput.step = "0.01";
  }
  manualInput.value = getByPath(selected, AMAZON_FBA_MANUAL_FEE_PATH) ?? "";
  manualInput.disabled = !manualEnabled;
  manualInput.addEventListener("change", () => {
    updateSelectedField(AMAZON_FBA_MANUAL_FEE_PATH, manualInput.value);
    markReviewOverriddenFromModal(selected);
    refreshAfterModalInput();
  });

  const manualFeeWrap = document.createElement("label");
  manualFeeWrap.textContent = "Manuelle FBA Fee / Einheit (EUR)";
  manualFeeWrap.appendChild(manualInput);
  field.appendChild(manualFeeWrap);

  const status = document.createElement("small");
  if (manualEnabled) {
    status.textContent = rateCardReference.available
      ? `Aktiv: Override ${formatCurrency(manualValue)} (Auto-Tier wäre ${rateCardReference.detailText}).`
      : `Aktiv: Override ${formatCurrency(manualValue)}.`;
  } else {
    status.textContent = rateCardReference.available
      ? `Aktiv: Auto-Tier ${formatCurrency(metrics.fbaFeeUnit)} (Tabellenpreis).`
      : `Aktiv: ${formatCurrency(metrics.fbaFeeUnit)}.`;
  }
  field.appendChild(status);

  const help = document.createElement("small");
  help.textContent = "Standard ist Auto-Tier aus der DE-Ratecard. Mit Override nutzt die Kalkulation den manuellen FBA-Wert.";
  field.appendChild(help);

  return field;
}

function renderDriverModal() {
  if (!dom.driverModal || !dom.driverModalFields || !dom.driverModalTitle || !dom.driverModalSubtitle) {
    return;
  }
  if (!state.ui.driverModal) {
    ensureShipping3dCleanup();
    dom.driverModal.classList.add("hidden");
    return;
  }

  const selected = getSelectedProduct();
  if (!selected) {
    closeDriverModal();
    return;
  }

  dom.driverModal.classList.remove("hidden");
  dom.driverModalTitle.textContent = state.ui.driverModal.title;
  dom.driverModalSubtitle.textContent = [state.ui.driverModal.value]
    .filter((item) => Boolean(item))
    .join(" · ");
  ensureShipping3dCleanup();
  dom.driverModalFields.innerHTML = "";

  const modalMetrics = calculateProduct(selected);
  const modalDiagnostics = buildDefaultDiagnostics(selected, modalMetrics);
  const driverPaths = normalizeDriverPathsForModal(state.ui.driverModal.driverPaths, selected);

  const summaryGrid = document.createElement("section");
  summaryGrid.className = "modal-summary-grid";
  const addSummaryCard = (title, text) => {
    const card = document.createElement("article");
    card.className = "modal-summary-card";
    const heading = document.createElement("strong");
    heading.textContent = title;
    card.appendChild(heading);
    const body = document.createElement("small");
    body.textContent = text;
    card.appendChild(body);
    summaryGrid.appendChild(card);
  };
  addSummaryCard("Was ist das?", state.ui.driverModal.explain || "Kostentreiber der aktuellen Kalkulation.");
  addSummaryCard(
    "Wie wird es berechnet?",
    state.ui.driverModal.formula ||
      "Der Wert wird aus den unten gelisteten Inputs/Defaults direkt gemäß Kostenmodell berechnet.",
  );
  addSummaryCard(
    "Herkunft & Robustheit",
    [
      state.ui.driverModal.source ? `Herkunft: ${state.ui.driverModal.source}` : null,
      state.ui.driverModal.robustness ? `Robustheit: ${state.ui.driverModal.robustness}` : null,
    ].filter(Boolean).join(" · ") || "Quelle und Robustheit folgen aus den verknüpften Inputs.",
  );

  const hasReturnsDriver = driverPaths.some((path) => path.startsWith("assumptions.returns.") || path.startsWith("derived.returns."));
  if (hasReturnsDriver) {
    addSummaryCard(
      "Kosten pro 1 Retoure",
      `${formatCurrency(modalMetrics.returnCostPerReturn)} = ${formatCurrency(modalMetrics.returnLossPerReturn)} Verlust + ${formatCurrency(modalMetrics.resolved.returnHandlingCost)} Handling.`,
    );
    addSummaryCard(
      "Verlust pro 1 Retoure",
      `${formatCurrency(modalMetrics.returnLossPerReturn)} = (1 - ${formatPercent(modalMetrics.sellableSharePct)}) × ${formatCurrency(modalMetrics.landedUnit)} Landed.`,
    );
  }
  dom.driverModalFields.appendChild(summaryGrid);

  const presetHandledPaths = new Set();
  if (state.ui.driverModal.detailPreset === "shipping_dashboard") {
    dom.driverModalFields.appendChild(createShippingDashboardModalContent(modalMetrics));
    const manualSection = createShippingManualOverrideModalSection(selected, modalMetrics);
    if (manualSection) {
      dom.driverModalFields.appendChild(manualSection);
      cartonizationProductPaths().forEach((path) => presetHandledPaths.add(path));
    }
  }
  if (state.ui.driverModal.detailPreset === "amazon_core") {
    dom.driverModalFields.appendChild(createAmazonCoreModalContent(modalMetrics));
  }

  const groupMeta = {
    user: {
      title: "Von dir eingegeben",
      hint: "Produktfelder und Annahmen, die den Treiber direkt beeinflussen.",
    },
    defaults: {
      title: "Defaults & globale Settings",
      hint: "Systemweite Parameter. Optional als Produkt-Override oder globaler Default speicherbar.",
    },
    calculated: {
      title: "Berechnete Zwischenwerte (read-only)",
      hint: "Transparenzwerte aus der Rechnung. Nicht direkt editierbar.",
    },
  };
  const groupOrder = ["user", "defaults", "calculated"];
  const groupNodes = new Map();
  const shippingDefaultGroupNodes = new Map();
  const isShippingPreset = state.ui.driverModal.detailPreset === "shipping_dashboard";
  const accordionActions = document.createElement("div");
  accordionActions.className = "modal-accordion-actions";
  const expandAllBtn = document.createElement("button");
  expandAllBtn.className = "btn btn-ghost";
  expandAllBtn.type = "button";
  expandAllBtn.textContent = "Alles aufklappen";
  const collapseAllBtn = document.createElement("button");
  collapseAllBtn.className = "btn btn-ghost";
  collapseAllBtn.type = "button";
  collapseAllBtn.textContent = "Alles einklappen";
  accordionActions.append(expandAllBtn, collapseAllBtn);
  dom.driverModalFields.appendChild(accordionActions);

  groupOrder.forEach((groupKey, index) => {
    const details = document.createElement("details");
    details.className = "modal-group";
    details.open = index === 0;
    const summary = document.createElement("summary");
    summary.className = "modal-group-summary";
    summary.innerHTML = `<span>${groupMeta[groupKey].title}</span><small>${groupMeta[groupKey].hint}</small>`;
    const fields = document.createElement("div");
    fields.className = "modal-group-fields";
    if (isShippingPreset && groupKey === "defaults") {
      fields.classList.add("modal-group-fields-stack");
    }
    details.append(summary, fields);
    dom.driverModalFields.appendChild(details);
    groupNodes.set(groupKey, { details, fields });

    if (isShippingPreset && groupKey === "defaults") {
      SHIPPING_DEFAULT_MODAL_GROUPS.forEach((entry) => {
        const subgroup = document.createElement("details");
        subgroup.className = "modal-group modal-subgroup";
        subgroup.open = false;
        const subgroupSummary = document.createElement("summary");
        subgroupSummary.className = "modal-group-summary";
        subgroupSummary.innerHTML = `<span>${entry.title}</span><small>Shipping-Defaults</small>`;
        const subgroupFields = document.createElement("div");
        subgroupFields.className = "modal-group-fields";
        subgroup.append(subgroupSummary, subgroupFields);
        fields.appendChild(subgroup);
        shippingDefaultGroupNodes.set(entry.key, { details: subgroup, fields: subgroupFields });
      });
    }
  });

  expandAllBtn.addEventListener("click", () => {
    groupOrder.forEach((groupKey) => {
      const node = groupNodes.get(groupKey);
      if (node && !node.details.classList.contains("hidden")) {
        node.details.open = true;
      }
    });
  });
  collapseAllBtn.addEventListener("click", () => {
    groupOrder.forEach((groupKey) => {
      const node = groupNodes.get(groupKey);
      if (node && !node.details.classList.contains("hidden")) {
        node.details.open = false;
      }
    });
  });

  const ensureGroupFields = (groupKey) => {
    return groupNodes.get(groupKey)?.fields ?? null;
  };

  let orderedPaths = sortDriverPathsForModal(driverPaths, modalMetrics)
    .filter((path) => !presetHandledPaths.has(path));
  if (isShippingPreset) {
    const shippingSettings = orderedPaths.filter((path) => shippingDefaultModalGroupKey(path));
    const nonShippingSettings = orderedPaths.filter((path) => !shippingDefaultModalGroupKey(path));
    shippingSettings.sort((a, b) => shippingDefaultPathOrderRank(a) - shippingDefaultPathOrderRank(b));
    orderedPaths = [...nonShippingSettings, ...shippingSettings];
  }
  let amazonFbaOverrideRendered = false;
  orderedPaths.forEach((path) => {
    const baseGroupKey = modalGroupForPath(path);
    const groupFields = ensureGroupFields(baseGroupKey);
    if (!groupFields) {
      return;
    }
    let targetFields = groupFields;
    if (isShippingPreset && baseGroupKey === "defaults") {
      const subgroupKey = shippingDefaultModalGroupKey(path);
      if (subgroupKey && shippingDefaultGroupNodes.has(subgroupKey)) {
        targetFields = shippingDefaultGroupNodes.get(subgroupKey).fields;
      }
    }

    const isAmazonFbaManualPath =
      path === AMAZON_FBA_MANUAL_OVERRIDE_PATH || path === AMAZON_FBA_MANUAL_FEE_PATH;
    if (isAmazonFbaManualPath) {
      if (amazonFbaOverrideRendered) {
        return;
      }
      const fbaField = buildAmazonFbaOverrideModalField(selected, modalMetrics, modalDiagnostics);
      if (fbaField) {
        targetFields.appendChild(fbaField);
      }
      amazonFbaOverrideRendered = true;
      return;
    }

    if (path.startsWith("derived.")) {
      const definition = DERIVED_DRIVER_MAP[path];
      if (!definition) {
        return;
      }
      const field = document.createElement("article");
      field.className = "modal-field";

      const head = document.createElement("div");
      head.className = "modal-field-head";
      const strong = document.createElement("strong");
      strong.textContent = definition.label;
      head.appendChild(strong);
      field.appendChild(head);

      appendModalBadges(field, buildDriverFieldBadges(path, selected, modalDiagnostics, modalMetrics));

      const valueText = document.createElement("small");
      valueText.textContent = `Aktueller Wert: ${formatDerivedValue(definition.read(modalMetrics), definition.format)}`;
      field.appendChild(valueText);

      if (definition.help) {
        const help = document.createElement("small");
        help.textContent = definition.help;
        field.appendChild(help);
      }

      targetFields.appendChild(field);
      return;
    }

    const sourceControl = getFieldControl(path);
    const label = resolveLabelForPath(path, sourceControl);
    const helpText = getPathHelp(path);

    const field = document.createElement("article");
    field.className = "modal-field";

    const head = document.createElement("div");
    head.className = "modal-field-head";
    const strong = document.createElement("strong");
    strong.textContent = label;
    head.appendChild(strong);
    field.appendChild(head);

    appendModalBadges(field, buildDriverFieldBadges(path, selected, modalDiagnostics, modalMetrics));

    if (path.startsWith("settings.")) {
      const settingsPath = path.slice("settings.".length);
      const globalValue = getByPath(state.settings, settingsPath);
      const productValue = getProductSettingOverride(selected, settingsPath);
      const effectiveValue = getEffectiveSettingValueForProduct(selected, settingsPath);

      const sourceText = document.createElement("small");
      sourceText.textContent =
        productValue === undefined
          ? `Aktuell aktiv: ${settingsValueText(settingsPath, effectiveValue)} (globaler Default).`
          : `Aktuell aktiv: ${settingsValueText(settingsPath, effectiveValue)} (Produkt-Override). Global: ${settingsValueText(settingsPath, globalValue)}.`;
      field.appendChild(sourceText);

      const controlSource = sourceControl ?? document.querySelector(`[data-settings-path="${settingsPath}"]`);
      let control = cloneControlForModal(controlSource, { settingsPath });
      if (control instanceof HTMLInputElement && control.type === "checkbox") {
        control.checked = Boolean(effectiveValue);
      } else if (control instanceof HTMLSelectElement) {
        control.value = String(effectiveValue ?? "");
      } else if (control instanceof HTMLInputElement) {
        control.value = effectiveValue ?? "";
      }
      field.appendChild(control);

      if (helpText) {
        const help = document.createElement("small");
        help.textContent = helpText;
        field.appendChild(help);
      }

      const actions = document.createElement("div");
      actions.className = "modal-actions";

      const readControlValue = () => {
        if (control instanceof HTMLInputElement && control.type === "checkbox") {
          return control.checked;
        }
        if (control instanceof HTMLSelectElement) {
          return control.value;
        }
        if (control instanceof HTMLInputElement) {
          return control.value;
        }
        return "";
      };

      const oldEffectiveText = settingsValueText(settingsPath, effectiveValue);
      const oldGlobalText = settingsValueText(settingsPath, globalValue);

      const saveProductBtn = document.createElement("button");
      saveProductBtn.className = "btn btn-primary";
      saveProductBtn.type = "button";
      saveProductBtn.textContent = "Nur für dieses Produkt";
      saveProductBtn.addEventListener("click", () => {
        const raw = readControlValue();
        const nextValue = normalizeSettingsValue(settingsPath, raw);
        if (String(nextValue) === String(effectiveValue)) {
          return;
        }
        if (!selected.assumptions.localSettingOverrides || typeof selected.assumptions.localSettingOverrides !== "object") {
          selected.assumptions.localSettingOverrides = {};
        }
        setByPath(selected.assumptions.localSettingOverrides, settingsPath, nextValue);
        saveProducts();
        markReviewOverriddenFromModal(selected);
        refreshAfterModalInput();
      });
      actions.appendChild(saveProductBtn);

      const saveGlobalBtn = document.createElement("button");
      saveGlobalBtn.className = "btn btn-ghost";
      saveGlobalBtn.type = "button";
      saveGlobalBtn.textContent = "Als globalen Default speichern";
      saveGlobalBtn.addEventListener("click", () => {
        const raw = readControlValue();
        const nextValue = normalizeSettingsValue(settingsPath, raw);
        const nextText = settingsValueText(settingsPath, nextValue);
        const affectedProducts = countProductsAffectedByGlobalSetting(settingsPath);
        const confirmed = window.confirm(
          `Globalen Default aktualisieren?\n${label}\nAlt: ${oldGlobalText}\nNeu: ${nextText}\nProdukte betroffen: ${affectedProducts}\n\nSind Sie sicher?`,
        );
        if (!confirmed) {
          return;
        }
        updateSettingsField(settingsPath, nextValue);
        markReviewOverriddenFromModal(selected);
        refreshAfterModalInput();
      });
      actions.appendChild(saveGlobalBtn);

      if (productValue !== undefined) {
        const clearBtn = document.createElement("button");
        clearBtn.className = "btn btn-ghost";
        clearBtn.type = "button";
        clearBtn.textContent = "Produkt-Override löschen";
        clearBtn.addEventListener("click", () => {
          unsetByPath(selected.assumptions.localSettingOverrides, settingsPath);
          saveProducts();
          markReviewOverriddenFromModal(selected);
          refreshAfterModalInput();
        });
        actions.appendChild(clearBtn);
      }

      const openSettingsBtn = document.createElement("button");
      openSettingsBtn.className = "btn btn-ghost";
      openSettingsBtn.type = "button";
      openSettingsBtn.textContent = "In Settings öffnen";
      openSettingsBtn.addEventListener("click", () => {
        const sectionId = settingsSectionIdFromPath(settingsPath);
        window.location.href = `settings.html#${sectionId}`;
      });
      actions.appendChild(openSettingsBtn);

      field.appendChild(actions);

      const saveHint = document.createElement("small");
      saveHint.textContent = `Speicherweg: ${oldEffectiveText} -> neuer Wert. Wahl zwischen Produkt-Override und globalem Default.`;
      field.appendChild(saveHint);

      targetFields.appendChild(field);
      return;
    }

    const overridePath = VALUE_TO_OVERRIDE_MAP.get(path);
    const overrideEnabled = overridePath ? Boolean(getByPath(selected, overridePath)) : true;

    if (overridePath) {
      const overrideWrap = document.createElement("label");
      overrideWrap.className = "toggle-row";
      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = overrideEnabled;
      toggle.addEventListener("change", () => {
        updateSelectedField(overridePath, toggle.checked);
        markReviewOverriddenFromModal(selected);
        refreshAfterModalInput();
      });
      const text = document.createElement("span");
      text.textContent = "Override aktivieren";
      overrideWrap.append(toggle, text);
      field.appendChild(overrideWrap);
    }

    const control = cloneControlForModal(sourceControl, { path });
    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      control.checked = Boolean(getByPath(selected, path));
      control.disabled = !overrideEnabled;
      control.addEventListener("change", () => {
        updateSelectedField(path, control.checked);
        markReviewOverriddenFromModal(selected);
        refreshAfterModalInput();
      });
      const checkboxWrap = document.createElement("label");
      checkboxWrap.className = "toggle-row";
      const text = document.createElement("span");
      text.textContent = label;
      checkboxWrap.append(control, text);
      field.appendChild(checkboxWrap);
    } else if (control instanceof HTMLSelectElement) {
      control.value = String(getByPath(selected, path) ?? "");
      control.disabled = !overrideEnabled;
      control.addEventListener("change", () => {
        updateSelectedField(path, control.value);
        markReviewOverriddenFromModal(selected);
        refreshAfterModalInput();
      });
      field.appendChild(control);
    } else if (control instanceof HTMLInputElement) {
      const currentValue = getByPath(selected, path);
      control.value = currentValue ?? "";
      control.disabled = !overrideEnabled;
      control.addEventListener("change", () => {
        updateSelectedField(path, control.value);
        markReviewOverriddenFromModal(selected);
        refreshAfterModalInput();
      });
      field.appendChild(control);
    }

    if (helpText) {
      const help = document.createElement("small");
      help.textContent = helpText;
      field.appendChild(help);
    }

    const diagKey = diagnosticsKeyFromPath(path);
    const diag = diagKey ? modalDiagnostics[diagKey] : null;
    if (diag) {
      const diagText = document.createElement("small");
      diagText.textContent = `Default-Logik: ${diag.short}`;
      field.appendChild(diagText);
    }

    if (path.startsWith("assumptions.extraCosts.")) {
      const mappedSettingsPath = EXTRA_COST_TO_SETTING_PATH[path];
      if (mappedSettingsPath) {
        const openSettingsBtn = document.createElement("button");
        openSettingsBtn.className = "btn btn-ghost";
        openSettingsBtn.type = "button";
        openSettingsBtn.textContent = "Globalen Default in Settings öffnen";
        openSettingsBtn.addEventListener("click", () => {
          const sectionId = settingsSectionIdFromPath(mappedSettingsPath);
          window.location.href = `settings.html#${sectionId}`;
        });
        const actions = document.createElement("div");
        actions.className = "modal-actions";
        actions.appendChild(openSettingsBtn);
        field.appendChild(actions);
      }
    }

    targetFields.appendChild(field);
  });

  shippingDefaultGroupNodes.forEach((node) => {
    if (node.fields.childElementCount === 0) {
      const emptyNote = document.createElement("p");
      emptyNote.className = "hint shipping-empty-note";
      emptyNote.textContent = "Keine aktiven Werte für den aktuellen Transportmodus.";
      node.fields.appendChild(emptyNote);
    }
    node.details.classList.remove("hidden");
  });

  groupOrder.forEach((groupKey, index) => {
    const node = groupNodes.get(groupKey);
    if (!node) {
      return;
    }
    let isEmpty = node.fields.childElementCount === 0;
    if (isShippingPreset && groupKey === "defaults") {
      isEmpty = false;
    }
    node.details.classList.toggle("hidden", isEmpty);
    if (!isEmpty && index === 0) {
      node.details.open = true;
    }
  });
}

function renderStageImpactList(stage, metrics) {
  if (!dom.stageImpactList) {
    return;
  }
  dom.stageImpactList.innerHTML = "";
  const items = buildStageImpactItems(metrics, stage);

  items.forEach((item) => {
    const impact = classifyImpact(item.impactMonthly, metrics.totalCostMonthly);
    const li = document.createElement("li");
    li.classList.add("clickable-row", `impact-${impact.level}`);
    const formula = item.formula ? `\nRechenweg: ${item.formula}` : "";
    const defaultSource = item.source ? `\nHerkunft: ${item.source}` : "";
    const robustness = item.robustness ? `\nRobustheit: ${item.robustness}` : "";
    li.title = `${item.explain}${formula}\nImpact: ${impact.label} (${formatPercent(impact.sharePct)} der Gesamtkosten).${defaultSource}${robustness}`;

    const label = document.createElement("span");
    label.textContent = item.label;

    const chip = document.createElement("em");
    chip.className = `impact-chip ${impact.level}`;
    chip.textContent = impact.label;
    label.appendChild(chip);

    const value = document.createElement("strong");
    value.textContent = item.value;

    li.append(label, value);
    li.addEventListener("click", () => {
      openDriverModal({
        title: item.label,
        value: item.value,
        explain: item.explain,
        formula: item.formula,
        source: item.source,
        robustness: item.robustness,
        driverPaths: item.driverPaths,
      });
    });

    dom.stageImpactList.appendChild(li);
  });
}

function renderBlockList(container, lines, options = { totalCostMonthly: 1 }) {
  if (!container) {
    return;
  }
  container.innerHTML = "";

  lines.forEach((line) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    const isSummaryLine = Boolean(line.isSummary || line.excludeFromCategoryTotal);
    const impact = isSummaryLine ? null : classifyImpact(line.impactMonthly, options.totalCostMonthly);
    const chip = document.createElement("em");

    label.textContent = line.label;
    value.textContent = line.value;

    if (!isSummaryLine && impact) {
      chip.className = `impact-chip ${impact.level}`;
      chip.textContent = impact.label;
      label.appendChild(chip);
    }

    if (!isSummaryLine && impact) {
      li.classList.add(`impact-${impact.level}`);
      li.dataset.impactLevel = impact.level;
      li.dataset.impactShare = String(impact.sharePct);
    } else {
      li.classList.add("is-summary-row");
      li.dataset.impactLevel = "none";
      li.dataset.impactShare = "0";
    }

    const driverPaths = Array.isArray(line.driverPaths) ? line.driverPaths : [];
    if (driverPaths.length > 0) {
      li.dataset.driverPaths = JSON.stringify(driverPaths);
    }
    li.dataset.lineLabel = line.label;
    li.dataset.lineExplain = line.explain ?? "";
    li.dataset.lineFormula = line.formula ?? "";
    li.dataset.lineSource = line.source ?? "";
    li.dataset.lineRobustness = line.robustness ?? "";

    if (line.explain) {
      const formula = line.formula ? `\nRechenweg: ${line.formula}` : "";
      const defaultSource = line.source ? `\nHerkunft: ${line.source}` : "";
      const robustness = line.robustness ? `\nRobustheit: ${line.robustness}` : "";
      const impactText = !isSummaryLine && impact
        ? `\nImpact: ${impact.label} (${formatPercent(impact.sharePct)} der Gesamtkosten).`
        : "\nSummenzeile (nicht farbklassifiziert).";
      li.title = `${line.explain}${formula}${impactText}${defaultSource}${robustness}`;
      label.title = li.title;
      value.title = li.title;
    }

    if (line.targetSection || driverPaths.length > 0) {
      if (line.targetSection) {
        li.dataset.targetSection = line.targetSection;
      }
      li.classList.add("clickable-row");
      li.title = line.explain
        ? `${line.explain}\nKlick: Treiber-Maske mit relevanten Inputs öffnen.`
        : "Klick: Treiber-Maske mit relevanten Inputs öffnen.";
    }

    li.append(label, value);
    container.appendChild(li);
  });
}

function buildCostCategoryData(metrics) {
  const monthlyUnits = Math.max(1, metrics.monthlyUnits);
  const horizonUnits = Math.max(1, metrics.unitsHorizon);
  const extra = metrics.resolved.extraCosts;
  const setupSampleUnit = extra.samplesPerProductEur / horizonUnits;
  const setupToolingUnit = extra.toolingPerProductEur / horizonUnits;
  const setupCertificatesUnit = extra.certificatesPerProductEur / horizonUnits;
  const setupInspectionUnit = extra.inspectionPerProductEur / horizonUnits;
  const listingLifecycleUnit = metrics.block2Monthly / monthlyUnits;
  const leakageUnit = metrics.block3Monthly / monthlyUnits;
  const amazonFeesUnit = metrics.referralFeeUnit + metrics.fbaFeeUnit + metrics.amazonStoragePerUnit;
  const shippingUnitsBase = Math.max(1, metrics.shipping.unitsPerOrder);
  const shippingPreRunUnit = metrics.shipping.originTotal / shippingUnitsBase;
  const shippingMainRunVariableUnit = metrics.shipping.mainRunVariable / shippingUnitsBase;
  const shippingMainRunFixedUnit = metrics.shipping.mainRunFixed / shippingUnitsBase;
  const shippingPostRunUnit = metrics.shipping.deOncarriageTotal / shippingUnitsBase;
  const shippingCustomsClearanceUnit = metrics.shipping.customsBroker / shippingUnitsBase;
  const shippingInsuranceUnit = metrics.shipping.insuranceTotal / shippingUnitsBase;
  const shippingSurchargeUnit = metrics.shipping.manualSurchargeTotal / shippingUnitsBase;

  const line = (config) => ({
    ...config,
    value: formatCurrency(num(config.valueRaw, 0)),
    impactMonthly: num(config.impactMonthly, 0),
  });

  const categories = [
    {
      key: "product",
      title: "Produkt",
      description: "Einkauf und direkte Produktkosten am Ursprung.",
      collapsedRows: 4,
      lines: [
        line({
          id: "quick_core.exw",
          label: "EXW umgerechnet (EUR/Unit)",
          valueRaw: metrics.exwUnit,
          impactMonthly: metrics.exwUnit * metrics.monthlyUnits,
          explain: "Einkaufspreis EXW in EUR aus USD-EK und aktuellem FX-Kurs.",
          formula: "EXW(EUR) = EXW(USD) × USD→EUR.",
          source: "User-Input + FX.",
          robustness: "Mittel.",
          driverPaths: ["basic.exwUnit", "settings.tax.fallbackUsdToEur"],
        }),
        line({
          label: "Packaging & Other (EUR/Unit)",
          valueRaw: metrics.packagingUnit,
          impactMonthly: metrics.packagingUnit * metrics.monthlyUnits,
          explain: "Zusätzliche Verpackungs- und weitere Stückkosten.",
          formula: "Packaging/Unit = packaging_per_unit + other_unit_costs.",
          source: "Settings oder Produkt-Override.",
          robustness: "Mittel.",
          driverPaths: [
            "assumptions.extraCosts.overridePackagingGroup",
            "assumptions.extraCosts.packagingPerUnitEur",
            "assumptions.extraCosts.otherUnitCostEur",
            "settings.costDefaults.packagingPerUnitEur",
            "settings.costDefaults.otherUnitCostEur",
          ],
        }),
        line({
          label: "Samples amortisiert (EUR/Unit)",
          valueRaw: setupSampleUnit,
          impactMonthly: setupSampleUnit * metrics.monthlyUnits,
          explain: "Einmalige Sample-Kosten auf den Betrachtungszeitraum umgelegt.",
          formula: "Samples/Unit = samples_per_product / Units im Zeitraum.",
          source: "Settings oder Produkt-Override.",
          robustness: "Hoch.",
          driverPaths: [
            "assumptions.extraCosts.overrideLaunchOpsGroup",
            "assumptions.extraCosts.samplesPerProductEur",
            "settings.costDefaults.samplesPerProductEur",
            "basic.horizonMonths",
            "basic.demandValue",
            "basic.demandBasis",
          ],
        }),
        line({
          label: "Tooling amortisiert (EUR/Unit)",
          valueRaw: setupToolingUnit,
          impactMonthly: setupToolingUnit * metrics.monthlyUnits,
          explain: "Einmalige Tooling-Kosten auf den Zeitraum verteilt.",
          formula: "Tooling/Unit = tooling_per_product / Units im Zeitraum.",
          source: "Settings oder Produkt-Override.",
          robustness: "Hoch.",
          driverPaths: [
            "assumptions.extraCosts.overrideLaunchOpsGroup",
            "assumptions.extraCosts.toolingPerProductEur",
            "settings.costDefaults.toolingPerProductEur",
            "basic.horizonMonths",
            "basic.demandValue",
            "basic.demandBasis",
          ],
        }),
        line({
          label: "Zertifikate amortisiert (EUR/Unit)",
          valueRaw: setupCertificatesUnit,
          impactMonthly: setupCertificatesUnit * metrics.monthlyUnits,
          explain: "Compliance-/Zertifikatskosten auf den Zeitraum verteilt.",
          formula: "Certificates/Unit = certificates_per_product / Units im Zeitraum.",
          source: "Settings oder Produkt-Override.",
          robustness: "Hoch.",
          driverPaths: [
            "assumptions.extraCosts.overrideLaunchOpsGroup",
            "assumptions.extraCosts.certificatesPerProductEur",
            "settings.costDefaults.certificatesPerProductEur",
            "basic.horizonMonths",
            "basic.demandValue",
            "basic.demandBasis",
          ],
        }),
        line({
          label: "Inspection amortisiert (EUR/Unit)",
          valueRaw: setupInspectionUnit,
          impactMonthly: setupInspectionUnit * metrics.monthlyUnits,
          explain: "Quality-Inspection-Kosten in China auf den Zeitraum verteilt.",
          formula: "Inspection/Unit = inspection_per_product / Units im Zeitraum.",
          source: "Settings oder Produkt-Override.",
          robustness: "Hoch.",
          driverPaths: [
            "assumptions.extraCosts.overrideLaunchOpsGroup",
            "assumptions.extraCosts.inspectionPerProductEur",
            "settings.costDefaults.inspectionPerProductEur",
            "basic.horizonMonths",
            "basic.demandValue",
            "basic.demandBasis",
          ],
        }),
      ],
    },
    {
      key: "shipping_import",
      title: "Shipping & Import (Vorlauf/Hauptlauf/Nachlauf)",
      description: "China -> DE Door-to-Door inkl. Zoll und Importanteile.",
      collapsedRows: 6,
      lines: [
        line({
          id: "quick_core.shipping.origin",
          label: "Vorlauf (EUR/Unit)",
          valueRaw: shippingPreRunUnit,
          impactMonthly: shippingPreRunUnit * metrics.monthlyUnits,
          explain: "Abholung/Trucking am Ursprung.",
          formula: metrics.shipping.modeKey === "rail"
            ? "Vorlauf/Unit = (Vorlauf-Basis + Vorlauf je CBM × Shipment-CBM) / PO-Menge."
            : "Vorlauf/Unit = origin_fixed / PO Units.",
          source: `Shipping 12M (${metrics.shipping.modeLabel}).`,
          robustness: "Mittel.",
          driverPaths: [
            "basic.unitsPerOrder",
            "derived.shipping.shipmentCbm",
            ...shippingOriginDriverPaths(metrics.shipping.modeKey),
          ],
        }),
        line({
          id: "quick_core.shipping.main_variable",
          label: "Hauptlauf variabel (EUR/Unit)",
          valueRaw: shippingMainRunVariableUnit,
          impactMonthly: shippingMainRunVariableUnit * metrics.monthlyUnits,
          explain: "Variabler Hauptlaufanteil auf Basis W/M (CBM oder Gewicht).",
          formula: "Hauptlauf variabel/Unit = (Abrechnungsvolumen (CBM) × Rate (EUR/CBM)) / PO-Menge.",
          source: `Shipping 12M (${metrics.shipping.modeLabel}) + Kartonisierung.`,
          robustness: "Mittel.",
          driverPaths: [
            "derived.shipping.chargeableCbm",
            "basic.unitsPerOrder",
            ...shippingModeDriverPaths(metrics.shipping.modeKey).filter((path) => path.endsWith("rateEurPerCbm")),
          ],
        }),
        line({
          id: "quick_core.shipping.main_fixed",
          label: "Hauptlauf Fixkosten (EUR/Unit)",
          valueRaw: shippingMainRunFixedUnit,
          impactMonthly: shippingMainRunFixedUnit * metrics.monthlyUnits,
          explain: "Fixe Hauptlaufnebenkosten wie Terminal-/Carrier-Handling.",
          formula: "Hauptlauf fix/Unit = main_run_fixed / PO Units.",
          source: `Shipping 12M (${metrics.shipping.modeLabel}).`,
          robustness: "Mittel.",
          driverPaths: [
            "basic.unitsPerOrder",
            ...shippingMainRunFixedDriverPaths(metrics.shipping.modeKey),
          ],
        }),
        line({
          id: "quick_core.shipping.post",
          label: "Nachlauf (EUR/Unit)",
          valueRaw: shippingPostRunUnit,
          impactMonthly: shippingPostRunUnit * metrics.monthlyUnits,
          explain: "Inlandstransport in DE nach Ankunft.",
          formula: metrics.shipping.modeKey === "rail"
            ? "Nachlauf/Unit = (Nachlauf-Basis + Nachlauf je CBM × Shipment-CBM) / PO-Menge."
            : "Nachlauf/Unit = de_oncarriage_fixed / PO Units.",
          source: `Shipping 12M (${metrics.shipping.modeLabel}).`,
          robustness: "Mittel.",
          driverPaths: [
            "basic.unitsPerOrder",
            "derived.shipping.shipmentCbm",
            ...shippingOncarriageDriverPaths(metrics.shipping.modeKey),
          ],
        }),
        line({
          id: "quick_core.shipping.customs_clearance",
          label: "Zollabfertigung (Broker) (EUR/Unit)",
          valueRaw: shippingCustomsClearanceUnit,
          impactMonthly: shippingCustomsClearanceUnit * metrics.monthlyUnits,
          explain: "Customs Clearance am Zielhafen/-terminal.",
          formula: "Zollabfertigung (Broker)/Unit = customs_broker_fixed / PO Units.",
          source: "Shipping 12M -> Gemeinsam.",
          robustness: "Hoch.",
          driverPaths: [
            "basic.unitsPerOrder",
            "settings.shipping12m.customsBrokerEnabled",
            "settings.shipping12m.customsBrokerFixedEurPerShipment",
          ],
        }),
        line({
          id: "quick_core.shipping.insurance",
          label: "Versicherung (EUR/Unit)",
          valueRaw: shippingInsuranceUnit,
          impactMonthly: shippingInsuranceUnit * metrics.monthlyUnits,
          explain: "Transportversicherung auf Basis Warenwert (EUR).",
          formula: "Versicherung/Unit = (Warenwert EUR × Versicherungsrate %) / PO Units.",
          source: "Shipping 12M -> Versicherung + EXW + FX.",
          robustness: "Mittel.",
          driverPaths: [
            "derived.shipping.goodsValueEur",
            "basic.exwUnit",
            "basic.unitsPerOrder",
            "settings.tax.fallbackUsdToEur",
            "settings.shipping12m.insurance.enabled",
            "settings.shipping12m.insurance.basis",
            "settings.shipping12m.insurance.ratePct",
          ],
        }),
        line({
          id: "quick_core.shipping.surcharge",
          label: "Nachbelastung (EUR/Unit)",
          valueRaw: shippingSurchargeUnit,
          impactMonthly: shippingSurchargeUnit * metrics.monthlyUnits,
          explain: "Optionaler manueller Fixbetrag je Shipment (z. B. Advance Commission).",
          formula: "Nachbelastung/Unit = manual_surcharge_eur_per_shipment / PO Units.",
          source: "Shipping 12M -> Rail.",
          robustness: "Mittel.",
          driverPaths: [
            "basic.unitsPerOrder",
            ...shippingManualSurchargeDriverPaths(metrics.shipping.modeKey),
          ],
        }),
        line({
          id: "quick_core.shipping.customs_duty",
          label: "Zoll (EUR/Unit)",
          valueRaw: metrics.customsUnit,
          impactMonthly: metrics.customsMonthly,
          explain: "Zollkosten auf Warenwert plus Shipping D2D.",
          formula: "Zoll/Unit = Zollsatz × (Warenwert in EUR + Shipping D2D je Unit).",
          source: "Import-Default/Override.",
          robustness: "Hoch.",
          driverPaths: ["assumptions.import.customsDutyRate", "settings.tax.customsDutyRatePct", "basic.exwUnit", "basic.unitsPerOrder"],
        }),
        line({
          id: "quick_core.shipping.order_fixed",
          label: "Order-Fixkosten (EUR/Unit)",
          valueRaw: metrics.orderFixedPerUnit,
          impactMonthly: metrics.orderFixedPerUnit * metrics.monthlyUnits,
          explain: "Dokumentation/Frachtpapiere je Order, auf Unit umgelegt.",
          formula: "Order-Fix/Unit = (Dokumentation + Frachtpapiere) / PO Units.",
          source: "Settings oder Produkt-Override.",
          robustness: "Hoch.",
          driverPaths: [
            "assumptions.extraCosts.overrideLogisticsGroup",
            "assumptions.extraCosts.docsPerOrderEur",
            "assumptions.extraCosts.freightPapersPerOrderEur",
            "settings.costDefaults.docsPerOrderEur",
            "settings.costDefaults.freightPapersPerOrderEur",
            "basic.unitsPerOrder",
          ],
        }),
      ],
    },
    {
      key: "threepl",
      title: "3PL (DE)",
      description: "Receiving, Storage und Versand an Amazon auf Kartonbasis.",
      collapsedRows: 5,
      lines: [
        line({
          id: "quick_core.threepl.inbound",
          label: "3PL Inbound / Receiving (EUR/Unit)",
          valueRaw: metrics.threePlInboundPerUnit,
          impactMonthly: metrics.threePlInboundPerUnit * metrics.monthlyUnits,
          explain: "Wareneingangskosten im 3PL je Karton.",
          formula: "Inbound/Unit = physische Umkartons × Receiving-Rate je Karton / PO-Menge.",
          source: "3PL Settings/Override.",
          robustness: "Mittel.",
          driverPaths: [
            "derived.shipping.unitsPerOrder",
            "derived.shipping.unitsPerCartonAuto",
            "derived.shipping.estimatedCartonLengthCm",
            "derived.shipping.estimatedCartonWidthCm",
            "derived.shipping.estimatedCartonHeightCm",
            "derived.shipping.cartonizationSource",
            "derived.shipping.physicalCartonsCount",
            "derived.shipping.cartonsCount",
            ...cartonizationProductPaths(),
            ...cartonizationSettingsPaths(),
            "assumptions.extraCosts.receivingMode",
            "assumptions.extraCosts.receivingPerCartonSortedEur",
            "assumptions.extraCosts.receivingPerCartonMixedEur",
            "settings.threePl.receivingPerCartonSortedEur",
            "settings.threePl.receivingPerCartonMixedEur",
          ],
        }),
        line({
          id: "quick_core.threepl.storage",
          label: "3PL Lagerung (EUR/Unit)",
          valueRaw: metrics.threePlStoragePerUnit,
          impactMonthly: metrics.threePlStoragePerUnit * metrics.monthlyUnits,
          explain: "Lagerkosten im 3PL (Palette/Monat) auf Unit umgerechnet.",
          formula: "Storage/Unit = ceil(PO Units/units_per_pallet) × storage_rate × months / PO Units.",
          source: "3PL Settings/Override.",
          robustness: "Mittel bis hoch.",
          driverPaths: [
            "derived.shipping.unitsPerOrder",
            "derived.threepl.palletsCount",
            "assumptions.extraCosts.storagePerPalletPerMonthEur",
            "assumptions.extraCosts.unitsPerPallet",
            "assumptions.extraCosts.avg3PlStorageMonths",
            "settings.threePl.storagePerPalletPerMonthEur",
            "settings.threePl.unitsPerPallet",
            "settings.threePl.avgStorageMonths",
          ],
        }),
        line({
          id: "quick_core.threepl.service",
          label: "3PL -> Amazon Service (EUR/Unit)",
          valueRaw: metrics.threePlOutboundServicePerUnit,
          impactMonthly: metrics.threePlOutboundServicePerUnit * metrics.monthlyUnits,
          explain: "Outbound-Service je Karton (Base, Pick & Pack, FBA Processing, optionale Extras).",
          formula: "Service/Unit = physische Umkartons × Servicekosten je Karton / PO-Menge.",
          source: "3PL Settings/Override.",
          robustness: "Mittel.",
          driverPaths: [
            "derived.shipping.unitsPerOrder",
            "derived.shipping.physicalCartonsCount",
            "derived.shipping.cartonsCount",
            "assumptions.extraCosts.outboundBasePerCartonEur",
            "assumptions.extraCosts.pickPackPerCartonEur",
            "assumptions.extraCosts.fbaProcessingPerCartonEur",
            "assumptions.extraCosts.insertsPerCarton",
            "assumptions.extraCosts.insertPerInsertEur",
            "assumptions.extraCosts.labelsPerCarton",
            "assumptions.extraCosts.thirdCountryLabelPerLabelEur",
            "settings.threePl.outboundBasePerCartonEur",
            "settings.threePl.pickPackPerCartonEur",
            "settings.threePl.fbaProcessingPerCartonEur",
          ],
        }),
        line({
          id: "quick_core.threepl.carrier",
          label: "3PL -> Amazon Carrier (EUR/Unit)",
          valueRaw: metrics.threePlCarrierPerUnit,
          impactMonthly: metrics.threePlCarrierPerUnit * metrics.monthlyUnits,
          explain: "Transportkosten vom 3PL zu Amazon je Karton.",
          formula: "Carrier/Unit = physische Umkartons × Carrier-Kosten je Karton / PO-Menge.",
          source: "3PL Settings/Override.",
          robustness: "Mittel.",
          driverPaths: [
            "derived.shipping.unitsPerOrder",
            "derived.shipping.physicalCartonsCount",
            "derived.shipping.cartonsCount",
            "assumptions.extraCosts.carrierCostPerCartonEur",
            "settings.threePl.carrierCostPerCartonEur",
          ],
        }),
        line({
          label: "3PL gesamt (EUR/Unit)",
          valueRaw: metrics.threePlTotalPerUnit,
          impactMonthly: metrics.threePlTotalPerUnit * metrics.monthlyUnits,
          explain: "Summenzeile über Inbound, Lagerung, Service und Carrier.",
          formula: "3PL total/Unit = inbound + storage + outbound service + carrier.",
          source: "Aggregierter 3PL-Block.",
          robustness: "Mittel.",
          isSummary: true,
          excludeFromCategoryTotal: true,
          driverPaths: [
            "derived.threepl.inboundTotal",
            "derived.threepl.storageTotal",
            "derived.threepl.outboundServiceTotal",
            "derived.threepl.carrierTotal",
          ],
        }),
      ],
    },
    {
      key: "amazon",
      title: "Amazon",
      description: "Amazon Fees und Lagerkosten.",
      collapsedRows: 4,
      lines: [
        line({
          id: "quick_core.amazon.referral",
          label: "Referral Fee (EUR/Unit)",
          valueRaw: metrics.referralFeeUnit,
          impactMonthly: metrics.referralMonthly,
          explain: "Prozentuale Amazon-Provision auf den Verkaufspreis.",
          formula: "Referral/Unit = max(min fee, price_gross × referral_rate).",
          source: "Kategorie-Default oder Override.",
          robustness: "Hoch.",
          driverPaths: ["assumptions.amazon.referralRate", "basic.category", "basic.priceGross"],
        }),
        line({
          id: "quick_core.amazon.fba",
          label: "FBA Fee (EUR/Unit)",
          valueRaw: metrics.fbaFeeUnit,
          impactMonthly: metrics.fbaFeeUnit * metrics.monthlyUnits,
          explain: "Fulfillment-Gebühr je Unit aus DE-Ratecard 2026-02 (auto) oder manuellem Fallback/Override.",
          formula: "FBA/Unit = Auto (Tier aus Maße + Versandgewicht) oder manueller Wert bei Override/Fallback.",
          source: "Amazon DE Ratecard 2026-02 + Produktdaten + Settings-Link.",
          robustness: "Mittel bis hoch.",
          driverPaths: [
            "basic.marketplace",
            "basic.category",
            "assumptions.amazon.useManualFbaFee",
            "assumptions.amazon.manualFbaFee",
            "derived.amazon.fbaFeeSource",
            "derived.amazon.fbaTierLabel",
            "derived.amazon.fbaShippingWeightG",
            "derived.amazon.fbaRateCardVersion",
            "settings.amazonFba.de.rateCardVersion",
            "settings.amazonFba.de.sourceUrl",
            "settings.amazonFba.de.volumetricDivisor",
            "basic.netWeightG",
            "basic.packLengthCm",
            "basic.packWidthCm",
            "basic.packHeightCm",
          ],
        }),
        line({
          label: "Amazon Lagerung (EUR/Unit)",
          valueRaw: metrics.amazonStoragePerUnit,
          impactMonthly: metrics.amazonStoragePerUnit * metrics.monthlyUnits,
          explain: "Lagerkosten bei Amazon aus CBM-Volumen und Lagerdauer.",
          formula: "Amazon storage/Unit = rate_per_cbm_month × months × unit_cbm.",
          source: "Settings oder Produkt-Override.",
          robustness: "Mittel.",
          driverPaths: [
            "assumptions.extraCosts.amazonStoragePerCbmMonthEur",
            "assumptions.extraCosts.avgAmazonStorageMonths",
            "settings.costDefaults.amazonStoragePerCbmMonthEur",
            "settings.costDefaults.avgAmazonStorageMonths",
            "basic.packLengthCm",
            "basic.packWidthCm",
            "basic.packHeightCm",
          ],
        }),
        line({
          label: "Amazon gesamt (EUR/Unit)",
          valueRaw: amazonFeesUnit,
          impactMonthly: amazonFeesUnit * metrics.monthlyUnits,
          explain: "Summenzeile über Referral, FBA und Amazon-Lagerung.",
          formula: "Amazon total/Unit = referral + fba + storage.",
          source: "Aggregierter Amazon-Block.",
          robustness: "Mittel.",
          isSummary: true,
          excludeFromCategoryTotal: true,
          driverPaths: [
            "assumptions.amazon.referralRate",
            "assumptions.amazon.useManualFbaFee",
            "derived.amazon.fbaFeeSource",
            "derived.amazon.fbaTierLabel",
            "assumptions.extraCosts.amazonStoragePerCbmMonthEur",
          ],
        }),
      ],
    },
    {
      key: "ads_returns",
      title: "Werbung & Retouren",
      description: "Performance- und Qualitätskosten im laufenden Verkauf.",
      collapsedRows: 4,
      lines: [
        line({
          id: "quick_core.amazon.ads",
          label: "Ads inkl. Launch-Boost (EUR/Unit)",
          valueRaw: metrics.adsUnit,
          impactMonthly: metrics.adsMonthly,
          explain: "Werbekosten auf Brutto-Umsatzbasis inklusive Launch-Profil.",
          formula: "Ads/Unit = gross_price × effective_TACoS.",
          source: "Kategorie-Defaults + Launch-Profil + Overrides.",
          robustness: "Niedrig bis mittel.",
          driverPaths: [
            "assumptions.ads.tacosRate",
            "assumptions.ads.launchMultiplier",
            "assumptions.ads.launchMonths",
            "basic.launchCompetition",
          ],
        }),
        line({
          label: "Retourenverlust (EUR/Unit)",
          valueRaw: metrics.returnLossUnit,
          impactMonthly: metrics.returnLossUnit * metrics.monthlyUnits,
          explain: "Warenwertverlust aus nicht verkaufbaren Retouren auf Landed-Basis.",
          formula: "Return loss/Unit = retourenquote × (1 - verkaufbar%) × landed.",
          source: "Kategorie-Defaults + Overrides.",
          robustness: "Niedrig bis mittel.",
          driverPaths: [
            "assumptions.returns.returnRate",
            "assumptions.returns.sellableShare",
            "derived.returns.returnLossPerReturnEur",
          ],
        }),
        line({
          label: "Retouren-Handling (EUR/Unit)",
          valueRaw: metrics.returnHandlingUnit,
          impactMonthly: metrics.returnHandlingUnit * metrics.monthlyUnits,
          explain: "Interne Bearbeitungskosten je Retoure, auf Unit umgelegt.",
          formula: "Handling/Unit = return_rate × handling_cost_per_return.",
          source: "Default/Override.",
          robustness: "Mittel.",
          driverPaths: [
            "assumptions.returns.returnRate",
            "assumptions.returns.handlingCost",
            "derived.returns.returnCostPerReturnEur",
          ],
        }),
      ],
    },
    {
      key: "launch_lifecycle",
      title: "Launch & Lifecycle",
      description: "Einmalige/temporäre Kosten über den Zeitraum verteilt.",
      collapsedRows: 4,
      lines: [
        line({
          id: "quick_core.launch.budget",
          label: "Launch-Budget amortisiert (EUR/Unit)",
          valueRaw: metrics.launchUnit,
          impactMonthly: metrics.launchMonthly,
          explain: "Launchbudget über Betrachtungszeitraum verteilt.",
          formula: "Launch/Unit = launch_budget_total / Units im Zeitraum.",
          source: "Produktinput + optional Launch-Split.",
          robustness: "Hoch.",
          driverPaths: ["basic.launchBudgetTotal", "assumptions.launchSplit.enabled", "basic.horizonMonths"],
        }),
        line({
          id: "quick_core.launch.listing",
          label: "Listing amortisiert (EUR/Unit)",
          valueRaw: metrics.listingUnit,
          impactMonthly: metrics.listingMonthly,
          explain: "Listing-Paketkosten über Lifecycle-Horizont verteilt.",
          formula: "Listing/Unit = listing_package_total / Units im Zeitraum.",
          source: "Listing-Paket Settings + Produktauswahl.",
          robustness: "Hoch.",
          driverPaths: ["basic.listingPackage", "settings.lifecycle.defaultMonths"],
        }),
        line({
          id: "quick_core.launch.ops",
          label: "Launch Ops amortisiert (EUR/Unit)",
          valueRaw: metrics.launchOpsUnit,
          impactMonthly: metrics.launchOpsMonthly,
          explain: "Grußkarten und Setup-Einmalkosten über den Zeitraum verteilt.",
          formula: "Launch ops/Unit = (greeting cards + setup one-offs) / Units im Zeitraum.",
          source: "Settings oder Produkt-Override.",
          robustness: "Mittel bis hoch.",
          driverPaths: [
            "assumptions.extraCosts.greetingCardPerLaunchUnitEur",
            "assumptions.extraCosts.samplesPerProductEur",
            "assumptions.extraCosts.toolingPerProductEur",
            "assumptions.extraCosts.certificatesPerProductEur",
            "assumptions.extraCosts.inspectionPerProductEur",
          ],
        }),
        line({
          label: "Lifecycle gesamt (EUR/Unit)",
          valueRaw: listingLifecycleUnit,
          impactMonthly: metrics.block2Monthly,
          explain: "Gesamter Launch/Lifecycle-Block pro Unit.",
          formula: "Lifecycle total/Unit = block2_monthly / monthly_units.",
          source: "Aggregierter Block 2.",
          robustness: "Mittel.",
          isSummary: true,
          driverPaths: [
            "basic.launchBudgetTotal",
            "basic.listingPackage",
            "assumptions.lifecycle.otherMonthlyCost",
            "basic.horizonMonths",
          ],
          excludeFromCategoryTotal: true,
        }),
      ],
    },
    {
      key: "overhead",
      title: "Overhead / Leakage",
      description: "Sicherheitsblock für vergessene, indirekte Kosten.",
      collapsedRows: 3,
      lines: [
        line({
          label: "Leakage / Overhead (EUR/Unit)",
          valueRaw: leakageUnit,
          impactMonthly: metrics.block3Monthly,
          explain: "Pauschaler Kostenblock als Anteil vom Netto-Umsatz.",
          formula: "Leakage/Unit = (net_revenue_monthly × leakage_rate) / monthly_units.",
          source: "Globaler Default oder Produkt-Override.",
          robustness: "Mittel.",
          driverPaths: [
            "assumptions.leakage.overrideRatePct",
            "assumptions.leakage.ratePct",
            "settings.costDefaults.leakageRatePct",
            "basic.priceGross",
            "basic.demandValue",
            "basic.demandBasis",
          ],
        }),
      ],
    },
  ];

  return categories.map((category) => {
    const normalizedLines = category.lines.map((lineItem, index) => {
      const driverPaths = Array.isArray(lineItem.driverPaths) ? [...new Set(lineItem.driverPaths)] : [];
      const isSummary = Boolean(lineItem.isSummary || lineItem.excludeFromCategoryTotal);
      return {
        ...lineItem,
        id: lineItem.id || `${category.key}.${index + 1}`,
        chainStageKey: lineItem.chainStageKey || chainStageKeyForLine(category.key, lineItem.label),
        driverPaths,
        reviewEligible: !isSummary && hasEditableDriverPath(driverPaths),
      };
    });

    const totalPerUnit = normalizedLines.reduce((sum, lineItem) => (
      lineItem.excludeFromCategoryTotal ? sum : sum + num(lineItem.valueRaw, 0)
    ), 0);
    const totalMonthly = totalPerUnit * Math.max(0, num(metrics.monthlyUnits, 0));
    return {
      ...category,
      lines: normalizedLines,
      totalMonthly,
      totalPerUnit,
    };
  });
}

function renderCostCategoryGrid(metrics, stage = "quick", prebuiltCategories = null) {
  if (!dom.costCategoryGrid) {
    return;
  }
  dom.costCategoryGrid.innerHTML = "";
  const categories = prebuiltCategories ?? buildCostCategoryData(metrics);

  categories.forEach((category) => {
    const computedTotalPerUnit = category.lines.reduce((sum, lineItem) => (
      lineItem.excludeFromCategoryTotal ? sum : sum + num(lineItem.valueRaw, 0)
    ), 0);
    const computedTotalMonthly = computedTotalPerUnit * Math.max(0, num(metrics.monthlyUnits, 0));
    const displayLines = category.lines.filter((lineItem) => !lineItem.isSummary);

    const card = document.createElement("article");
    card.className = "cost-category-card";

    const head = document.createElement("div");
    head.className = "cost-category-head";
    const title = document.createElement("h4");
    title.textContent = category.title;
    const summary = document.createElement("div");
    summary.className = "cost-category-summary";
    summary.innerHTML = `<strong>Summe: ${formatCurrency(computedTotalPerUnit)} / Unit</strong><small>${formatCurrency(computedTotalMonthly)} / Monat</small>`;
    const subtitle = document.createElement("p");
    subtitle.textContent = category.description;
    head.append(title, summary, subtitle);
    card.appendChild(head);

    const list = document.createElement("ul");
    list.className = "calc-list cost-category-list";
    card.appendChild(list);

    const expanded = Boolean(state.ui.costCategoryExpanded?.[category.key]);
    const collapsedRows = stage === "quick" ? 0 : Math.max(1, num(category.collapsedRows, 4));
    const visibleLines = expanded ? displayLines : displayLines.slice(0, collapsedRows);
    renderBlockList(list, visibleLines, { totalCostMonthly: metrics.totalCostMonthly });

    if (displayLines.length > collapsedRows) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "cost-category-toggle";
      toggle.dataset.categoryToggle = category.key;
      toggle.textContent = expanded ? "Weniger anzeigen" : `Weitere anzeigen (${displayLines.length - collapsedRows})`;
      card.appendChild(toggle);
    }

    dom.costCategoryGrid.appendChild(card);
  });
}

function fbaFeeSourceLabel(source) {
  switch (source) {
    case "auto":
      return "Auto (DE Ratecard)";
    case "manual":
      return "Manuell";
    case "fallback_non_de":
      return "Fallback: Nicht-DE";
    case "fallback_no_tier":
      return "Fallback: Kein Tier";
    default:
      return "Unbekannt";
  }
}

function fbaRateCardReferenceSnapshot(metrics) {
  const fee = num(metrics?.fbaRateCardFeeUnit, NaN);
  const tierLabel = String(metrics?.fbaRateCardTierLabel ?? "").trim();
  if (Number.isFinite(fee) && fee >= 0) {
    const value = formatCurrency(fee);
    return {
      available: true,
      valueText: value,
      detailText: tierLabel ? `${value} (${tierLabel})` : value,
      metaText: tierLabel ? `Auto-Tier: ${tierLabel}` : "Auto-Tier (DE Ratecard)",
    };
  }
  if (metrics?.fbaRateCardSource === "fallback_non_de") {
    return {
      available: false,
      valueText: "n/a",
      detailText: "n/a (nur Amazon.de)",
      metaText: "Für Nicht-DE aktuell ohne Tabellenpreis.",
    };
  }
  if (metrics?.fbaRateCardSource === "fallback_no_tier") {
    return {
      available: false,
      valueText: "n/a",
      detailText: "n/a (kein Tier-Match)",
      metaText: metrics?.fbaRateCardFallbackReason || "Kein passendes DE-Tier für Maße/Gewicht.",
    };
  }
  return {
    available: false,
    valueText: "-",
    detailText: "-",
    metaText: "",
  };
}

function renderFbaDetails(metrics) {
  if (!dom.fbaInfoCard) {
    return;
  }
  const rateCardReference = fbaRateCardReferenceSnapshot(metrics);
  if (dom.fbaInfoFeeUnit) {
    dom.fbaInfoFeeUnit.textContent = formatCurrency(metrics.fbaFeeUnit);
    setTooltip(dom.fbaInfoFeeUnit, "amazon.fba_unit");
  }
  if (dom.fbaInfoProfile) {
    dom.fbaInfoProfile.textContent = metrics.fbaProfileLabel ?? fbaProfileLabel(metrics.fbaProfile);
    setTooltip(dom.fbaInfoProfile, "amazon.fba_profile");
  }
  if (dom.fbaInfoTier) {
    dom.fbaInfoTier.textContent = metrics.fbaTierLabel || "-";
    setTooltip(dom.fbaInfoTier, "amazon.fba_tier");
  }
  if (dom.fbaInfoTableFee) {
    dom.fbaInfoTableFee.textContent = rateCardReference.valueText;
    setTooltip(dom.fbaInfoTableFee, "amazon.fba_unit");
  }
  if (dom.fbaInfoTableFeeMeta) {
    dom.fbaInfoTableFeeMeta.textContent = rateCardReference.metaText || "";
    dom.fbaInfoTableFeeMeta.classList.toggle("hidden", !rateCardReference.metaText);
    setTooltip(dom.fbaInfoTableFeeMeta, "amazon.fba_source");
  }
  if (dom.advancedFbaAutoHint) {
    dom.advancedFbaAutoHint.textContent = `Berechneter Tabellenpreis (DE Ratecard): ${rateCardReference.detailText}.`;
    setTooltip(dom.advancedFbaAutoHint, "amazon.fba_source");
  }
  if (dom.advancedFbaOverrideStatus) {
    let statusText = `Aktiv: ${formatCurrency(metrics.fbaFeeUnit)}.`;
    if (metrics.fbaFeeSource === "manual") {
      statusText = rateCardReference.available
        ? `Aktiv: Override ${formatCurrency(metrics.fbaFeeUnit)} (Auto-Tier wäre ${rateCardReference.detailText}).`
        : `Aktiv: Override ${formatCurrency(metrics.fbaFeeUnit)}.`;
    } else if (metrics.fbaFeeSource === "auto") {
      statusText = `Aktiv: Auto-Tier ${formatCurrency(metrics.fbaFeeUnit)} (Tabellenpreis).`;
    } else if (metrics.fbaFeeSource === "fallback_non_de") {
      statusText = `Aktiv: Fallback ${formatCurrency(metrics.fbaFeeUnit)} (Auto-Tier derzeit nur für Amazon.de).`;
    } else if (metrics.fbaFeeSource === "fallback_no_tier") {
      statusText = `Aktiv: Fallback ${formatCurrency(metrics.fbaFeeUnit)} (${metrics.fbaFallbackReason || "kein passendes Tier-Match"}).`;
    }
    dom.advancedFbaOverrideStatus.textContent = statusText;
    setTooltip(dom.advancedFbaOverrideStatus, "amazon.fba_source");
  }
  if (dom.advancedFbaOverridePanel) {
    dom.advancedFbaOverridePanel.classList.toggle("is-manual", metrics.fbaFeeSource === "manual");
  }
  if (dom.fbaInfoShippingWeight) {
    dom.fbaInfoShippingWeight.textContent = `${formatNumber(metrics.fbaShippingWeightG)} g`;
    setTooltip(dom.fbaInfoShippingWeight, "amazon.fba_shipping_weight");
  }
  if (dom.fbaInfoWeightBreakdown) {
    dom.fbaInfoWeightBreakdown.textContent =
      `actual ${formatNumber(metrics.fbaActualWeightG)} g vs. dimensional ${formatNumber(metrics.fbaDimensionalWeightG)} g (Divisor ${formatNumber(metrics.fbaVolumetricDivisor)})`;
    setTooltip(dom.fbaInfoWeightBreakdown, "amazon.fba_shipping_weight");
  }
  if (dom.fbaInfoSource) {
    dom.fbaInfoSource.textContent = `${metrics.fbaRateCardVersion} · ${fbaFeeSourceLabel(metrics.fbaFeeSource)}`;
    setTooltip(dom.fbaInfoSource, "amazon.fba_source");
  }
  if (dom.fbaInfoSourceLink) {
    const href = String(metrics.fbaRateCardUrl ?? "").trim();
    if (href) {
      dom.fbaInfoSourceLink.href = href;
      dom.fbaInfoSourceLink.classList.remove("hidden");
    } else {
      dom.fbaInfoSourceLink.removeAttribute("href");
      dom.fbaInfoSourceLink.classList.add("hidden");
    }
  }
  if (dom.fbaInfoFallback) {
    const isFallback = metrics.fbaFeeSource === "fallback_non_de" || metrics.fbaFeeSource === "fallback_no_tier";
    const isManual = metrics.fbaFeeSource === "manual";
    if (isFallback) {
      dom.fbaInfoFallback.textContent = `Warnung: ${metrics.fbaFallbackReason || "Kein passendes DE-Tier, daher manueller FBA-Wert."}`;
      dom.fbaInfoFallback.classList.remove("hidden");
    } else if (isManual) {
      dom.fbaInfoFallback.textContent = "Hinweis: Manueller FBA-Override ist aktiv.";
      dom.fbaInfoFallback.classList.remove("hidden");
    } else {
      dom.fbaInfoFallback.textContent = "";
      dom.fbaInfoFallback.classList.add("hidden");
    }
  }
  if (dom.fbaInfoHints) {
    dom.fbaInfoHints.innerHTML = "";
    const hints = Array.isArray(metrics.fbaOptimizationHints) ? metrics.fbaOptimizationHints : [];
    if (metrics.fbaFeeSource === "auto" && hints.length > 0) {
      hints.slice(0, 2).forEach((hint) => {
        const li = document.createElement("li");
        li.textContent = hint.text;
        dom.fbaInfoHints.appendChild(li);
      });
      dom.fbaInfoHints.classList.remove("hidden");
    } else {
      dom.fbaInfoHints.classList.add("hidden");
    }
  }
}

function createAmazonCoreModalContent(metrics) {
  const section = document.createElement("section");
  section.className = "amazon-core-modal";
  const rateCardReference = fbaRateCardReferenceSnapshot(metrics);

  const head = document.createElement("div");
  head.className = "shipping-dashboard-head";
  const headLeft = document.createElement("div");
  const heading = document.createElement("h4");
  heading.textContent = "Amazon Core Übersicht";
  const subtitle = document.createElement("p");
  subtitle.className = "hint";
  subtitle.textContent = "Referral, TACoS und FBA getrennt, damit der Kostenbeitrag je Block sofort sichtbar ist.";
  headLeft.append(heading, subtitle);
  const tile = document.createElement("article");
  tile.className = "shipping-total-tile";
  tile.title = tooltipForMetric("quick.amazon_core");
  tile.innerHTML = `
    <span>Amazon Core gesamt</span>
    <strong>${formatCurrency(metrics.quickBlockAmazonCorePerUnit)} / Unit</strong>
    <small>Anteil an Gesamtkosten: ${formatPercent(metrics.totalCostPerUnit > 0 ? (metrics.quickBlockAmazonCorePerUnit / metrics.totalCostPerUnit) * 100 : 0)}</small>
  `;
  head.append(headLeft, tile);
  section.appendChild(head);

  const shareFor = (value) =>
    metrics.quickBlockAmazonCorePerUnit > 0 ? (num(value, 0) / metrics.quickBlockAmazonCorePerUnit) * 100 : 0;
  const cards = document.createElement("div");
  cards.className = "amazon-core-grid";
  const addCard = (title, value, formula, tone = "neutral", tooltipKey = "") => {
    const card = document.createElement("article");
    card.className = `amazon-core-card tone-${tone}`;
    card.title = tooltipForMetric(tooltipKey, formula);
    card.innerHTML = `
      <span>${title}</span>
      <strong>${formatCurrency(value)} / Unit</strong>
      <small>${formatPercent(shareFor(value))} von Amazon Core</small>
      <p>${formula}</p>
    `;
    cards.appendChild(card);
  };
  addCard("Referral", metrics.referralFeeUnit, "Brutto-Preis × Referral-%", "referral", "amazon.referral_unit");
  addCard("TACoS", metrics.adsUnit, "Brutto-Preis × TACoS-%", "ads", "amazon.tacos_unit");
  addCard("FBA Fulfillment", metrics.fbaFeeUnit, "Auto-Tier (DE Ratecard) oder manueller Override/Fallback", "fba", "amazon.fba_unit");
  section.appendChild(cards);

  const fbaPanel = document.createElement("article");
  fbaPanel.className = "shipping-panel amazon-core-fba-panel";
  const fbaTitle = document.createElement("h4");
  fbaTitle.textContent = "FBA Fulfillment Details";
  const sourceText = document.createElement("p");
  sourceText.className = "hint";
  sourceText.textContent = `${metrics.fbaRateCardVersion} · ${fbaFeeSourceLabel(metrics.fbaFeeSource)}`;
  sourceText.title = tooltipForMetric("amazon.fba_source");
  fbaPanel.append(fbaTitle, sourceText);

  const detailGrid = document.createElement("div");
  detailGrid.className = "shipping-kpi-grid";
  const detailRows = [
    { label: "Profil", value: metrics.fbaProfileLabel ?? fbaProfileLabel(metrics.fbaProfile), tooltipKey: "amazon.fba_profile" },
    { label: "Tier", value: metrics.fbaTierLabel || "-", tooltipKey: "amazon.fba_tier" },
    { label: "Preis laut Tabelle", value: rateCardReference.detailText, tooltipKey: "amazon.fba_unit" },
    { label: "Versandgewicht", value: `${formatNumber(metrics.fbaShippingWeightG)} g`, tooltipKey: "amazon.fba_shipping_weight" },
    {
      label: "Gewichtslogik",
      value: `actual ${formatNumber(metrics.fbaActualWeightG)} g vs. dimensional ${formatNumber(metrics.fbaDimensionalWeightG)} g`,
      tooltipKey: "amazon.fba_shipping_weight",
    },
  ];
  detailRows.forEach((row) => {
    const item = document.createElement("article");
    item.className = "shipping-kpi-item";
    item.title = tooltipForMetric(row.tooltipKey, "");
    item.innerHTML = `<span>${row.label}</span><strong>${row.value}</strong>`;
    detailGrid.appendChild(item);
  });
  fbaPanel.appendChild(detailGrid);

  if (metrics.fbaRateCardUrl) {
    const link = document.createElement("a");
    link.className = "fba-source-link";
    link.href = metrics.fbaRateCardUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Ratecard-Quelle öffnen";
    fbaPanel.appendChild(link);
  }

  if (metrics.fbaFeeSource === "fallback_non_de" || metrics.fbaFeeSource === "fallback_no_tier") {
    const fallback = document.createElement("p");
    fallback.className = "hint warn";
    fallback.textContent = `Warnung: ${metrics.fbaFallbackReason || "Kein passendes Tier gefunden, manueller FBA-Wert aktiv."}`;
    fbaPanel.appendChild(fallback);
  } else if (metrics.fbaFeeSource === "manual") {
    const manual = document.createElement("p");
    manual.className = "hint";
    manual.textContent = rateCardReference.available
      ? `Manueller FBA-Override ist aktiv (${formatCurrency(metrics.fbaFeeUnit)} statt Tabellenpreis ${rateCardReference.detailText}).`
      : `Manueller FBA-Override ist aktiv (${formatCurrency(metrics.fbaFeeUnit)}).`;
    fbaPanel.appendChild(manual);
  }

  section.appendChild(fbaPanel);
  return section;
}

function shippingManualFitStatusLabel(status) {
  if (status === "warn_dim_weight") {
    return "Warnung (Maße + Gewicht)";
  }
  if (status === "warn_dim") {
    return "Warnung (Maße)";
  }
  if (status === "warn_weight") {
    return "Warnung (Gewicht)";
  }
  if (status === "ok") {
    return "Plausibel";
  }
  return "Nicht geprüft";
}

function createShippingLayoutFallbackElement(metrics, reason = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "shipping-layout-3d-fallback";
  if (reason) {
    const note = document.createElement("p");
    note.className = "hint warn";
    note.textContent = reason;
    wrapper.appendChild(note);
  }
  wrapper.appendChild(createShippingLayoutPreviewElement(metrics));
  return wrapper;
}

function createTextSprite(text, options = {}) {
  const THREE = window.THREE;
  const sprite = new THREE.Sprite();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return sprite;
  }

  const fontPx = Math.max(20, roundInt(options.fontPx, 36));
  const paddingX = Math.max(8, roundInt(options.paddingX, 14));
  const paddingY = Math.max(6, roundInt(options.paddingY, 9));
  const fontFamily = options.fontFamily ?? "\"Space Grotesk\", \"Manrope\", sans-serif";
  context.font = `700 ${fontPx}px ${fontFamily}`;
  const measuredWidth = Math.ceil(context.measureText(text).width);
  canvas.width = Math.max(64, measuredWidth + paddingX * 2);
  canvas.height = Math.max(40, Math.ceil(fontPx * 1.5) + paddingY * 2);

  context.font = `700 ${fontPx}px ${fontFamily}`;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = options.background ?? "rgba(247, 251, 250, 0.92)";
  context.strokeStyle = options.border ?? "rgba(58, 96, 84, 0.45)";
  context.lineWidth = 2;
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(1, 1, canvas.width - 2, canvas.height - 2, 9);
  } else {
    context.rect(1, 1, canvas.width - 2, canvas.height - 2);
  }
  context.fill();
  context.stroke();

  context.fillStyle = options.color ?? "#1f3b33";
  context.textBaseline = "middle";
  context.fillText(text, paddingX, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  sprite.material = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const scale = Math.max(0.0015, num(options.scale, 0.0043));
  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);
  sprite.renderOrder = 12;
  return sprite;
}

function createDimensionAnnotation3d({
  start,
  end,
  label,
  color = 0x3a7a64,
  offsetDirection = null,
  tickFactor = 0.03,
  labelOffsetFactor = 0.18,
}) {
  const THREE = window.THREE;
  const group = new THREE.Group();
  const startPoint = start.clone();
  const endPoint = end.clone();
  const direction = endPoint.clone().sub(startPoint);
  const lineLength = Math.max(0.0001, direction.length());
  const lineDir = direction.clone().normalize();

  const baseGeom = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
  const baseLine = new THREE.Line(baseGeom, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
  baseLine.renderOrder = 10;
  group.add(baseLine);

  let labelDir = offsetDirection instanceof THREE.Vector3 ? offsetDirection.clone() : new THREE.Vector3(0, 1, 0);
  if (labelDir.lengthSq() < 1e-8) {
    labelDir = new THREE.Vector3(0, 1, 0);
  }
  labelDir.normalize();

  let tickDir = new THREE.Vector3().crossVectors(lineDir, labelDir);
  if (tickDir.lengthSq() < 1e-8) {
    tickDir = new THREE.Vector3().crossVectors(lineDir, new THREE.Vector3(0, 0, 1));
  }
  if (tickDir.lengthSq() < 1e-8) {
    tickDir = new THREE.Vector3(1, 0, 0);
  }
  tickDir.normalize();

  const halfTick = tickDir.multiplyScalar(Math.max(0.016, lineLength * tickFactor));
  [startPoint, endPoint].forEach((point) => {
    const tickGeom = new THREE.BufferGeometry().setFromPoints([
      point.clone().sub(halfTick),
      point.clone().add(halfTick),
    ]);
    const tick = new THREE.Line(tickGeom, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
    tick.renderOrder = 10;
    group.add(tick);
  });

  const labelSprite = createTextSprite(label);
  const labelOffset = labelDir.multiplyScalar(Math.max(0.08, lineLength * labelOffsetFactor));
  labelSprite.position.copy(startPoint.clone().add(endPoint).multiplyScalar(0.5).add(labelOffset));
  group.add(labelSprite);
  return group;
}

function buildShippingLayout3dScene(container, metrics) {
  const THREE = window.THREE;
  const preview = metrics.shipping.layoutPreview ?? {};
  if (!preview.available) {
    throw new Error("Layout preview unavailable");
  }

  const cartonLengthCm = Math.max(0.1, num(metrics.shipping.estimatedCartonLengthCm, 1));
  const cartonWidthCm = Math.max(0.1, num(metrics.shipping.estimatedCartonWidthCm, 1));
  const cartonHeightCm = Math.max(0.1, num(metrics.shipping.estimatedCartonHeightCm, 1));

  const orientation = Array.isArray(preview.orientation) && preview.orientation.length === 3
    ? preview.orientation
    : [cartonLengthCm, cartonWidthCm, cartonHeightCm];
  const unitLengthCm = Math.max(0.05, num(orientation[0], cartonLengthCm));
  const unitWidthCm = Math.max(0.05, num(orientation[1], cartonWidthCm));
  const unitHeightCm = Math.max(0.05, num(orientation[2], cartonHeightCm));

  const nx = Math.max(1, roundInt(preview.nx, 1));
  const ny = Math.max(1, roundInt(preview.ny, 1));
  const nz = Math.max(1, roundInt(preview.nz, 1));
  const placedUnits = Math.max(0, roundInt(preview.placedUnits, 0));
  const renderedUnits = Math.min(placedUnits, SHIPPING_3D_MAX_RENDER_UNITS);

  const longestCartonDim = Math.max(cartonLengthCm, cartonWidthCm, cartonHeightCm);
  const worldScale = 6 / Math.max(1, longestCartonDim);
  const cartonX = cartonLengthCm * worldScale;
  const cartonY = cartonHeightCm * worldScale;
  const cartonZ = cartonWidthCm * worldScale;
  const unitX = unitLengthCm * worldScale;
  const unitY = unitHeightCm * worldScale;
  const unitZ = unitWidthCm * worldScale;
  const maxWorldDim = Math.max(cartonX, cartonY, cartonZ);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 800);
  camera.position.set(maxWorldDim * 1.45, maxWorldDim * 1.05, maxWorldDim * 1.45);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.92));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.78);
  keyLight.position.set(maxWorldDim * 2.1, maxWorldDim * 2.2, maxWorldDim * 1.3);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xbde0d4, 0.35);
  fillLight.position.set(-maxWorldDim * 1.4, maxWorldDim * 0.8, -maxWorldDim * 1.8);
  scene.add(fillLight);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.dampingFactor = 0.08;
  controls.minDistance = maxWorldDim * 0.58;
  controls.maxDistance = maxWorldDim * 8;
  controls.target.set(0, 0, 0);
  controls.update();

  const cartonGeometry = new THREE.BoxGeometry(cartonX, cartonY, cartonZ);
  const cartonMaterial = new THREE.MeshPhongMaterial({
    color: 0x99ceb9,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const cartonMesh = new THREE.Mesh(cartonGeometry, cartonMaterial);
  cartonMesh.renderOrder = 1;
  scene.add(cartonMesh);

  const cartonEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cartonGeometry),
    new THREE.LineBasicMaterial({ color: 0x2d5f53, transparent: true, opacity: 0.9 }),
  );
  cartonEdges.renderOrder = 4;
  scene.add(cartonEdges);

  const productsGroup = new THREE.Group();
  scene.add(productsGroup);
  const productGeometry = new THREE.BoxGeometry(unitX, unitY, unitZ);
  const productMaterial = new THREE.MeshPhongMaterial({ color: 0x7fcbb0, transparent: true, opacity: 0.94 });
  const productHighlightMaterial = new THREE.MeshPhongMaterial({
    color: 0x2f8e6f,
    emissive: 0x133a2f,
    emissiveIntensity: 0.26,
    transparent: true,
    opacity: 0.98,
  });

  let rendered = 0;
  let highlightedMesh = null;
  const startX = -cartonX / 2 + unitX / 2;
  const startY = -cartonY / 2 + unitY / 2;
  const startZ = -cartonZ / 2 + unitZ / 2;
  for (let layer = 0; layer < nz && rendered < renderedUnits; layer += 1) {
    for (let row = 0; row < ny && rendered < renderedUnits; row += 1) {
      for (let col = 0; col < nx && rendered < renderedUnits; col += 1) {
        const mesh = new THREE.Mesh(productGeometry, rendered === 0 ? productHighlightMaterial : productMaterial);
        mesh.position.set(
          startX + col * unitX,
          startY + layer * unitY,
          startZ + row * unitZ,
        );
        mesh.renderOrder = rendered === 0 ? 9 : 5;
        productsGroup.add(mesh);
        if (rendered === 0) {
          highlightedMesh = mesh;
        }
        rendered += 1;
      }
    }
  }

  const cartonOffset = maxWorldDim * 0.11;
  scene.add(
    createDimensionAnnotation3d({
      start: new THREE.Vector3(-cartonX / 2, -cartonY / 2 - cartonOffset, cartonZ / 2 + cartonOffset * 0.22),
      end: new THREE.Vector3(cartonX / 2, -cartonY / 2 - cartonOffset, cartonZ / 2 + cartonOffset * 0.22),
      label: `Umkarton L ${formatNumber(cartonLengthCm)} cm`,
      offsetDirection: new THREE.Vector3(0, -1, 0),
    }),
  );
  scene.add(
    createDimensionAnnotation3d({
      start: new THREE.Vector3(cartonX / 2 + cartonOffset * 0.3, -cartonY / 2 - cartonOffset, -cartonZ / 2),
      end: new THREE.Vector3(cartonX / 2 + cartonOffset * 0.3, -cartonY / 2 - cartonOffset, cartonZ / 2),
      label: `Umkarton B ${formatNumber(cartonWidthCm)} cm`,
      offsetDirection: new THREE.Vector3(1, -1, 0),
    }),
  );
  scene.add(
    createDimensionAnnotation3d({
      start: new THREE.Vector3(cartonX / 2 + cartonOffset * 0.38, -cartonY / 2, cartonZ / 2 + cartonOffset * 0.38),
      end: new THREE.Vector3(cartonX / 2 + cartonOffset * 0.38, cartonY / 2, cartonZ / 2 + cartonOffset * 0.38),
      label: `Umkarton H ${formatNumber(cartonHeightCm)} cm`,
      offsetDirection: new THREE.Vector3(1, 0, 1),
    }),
  );

  if (highlightedMesh) {
    const halfX = unitX / 2;
    const halfY = unitY / 2;
    const halfZ = unitZ / 2;
    const highlightOffset = Math.max(unitX, unitY, unitZ) * 0.55;
    const cx = highlightedMesh.position.x;
    const cy = highlightedMesh.position.y;
    const cz = highlightedMesh.position.z;

    scene.add(
      createDimensionAnnotation3d({
        start: new THREE.Vector3(cx - halfX, cy + halfY + highlightOffset, cz + halfZ + highlightOffset * 0.2),
        end: new THREE.Vector3(cx + halfX, cy + halfY + highlightOffset, cz + halfZ + highlightOffset * 0.2),
        label: `Produkt L ${formatNumber(unitLengthCm)} cm`,
        offsetDirection: new THREE.Vector3(0, 1, 0),
      }),
    );
    scene.add(
      createDimensionAnnotation3d({
        start: new THREE.Vector3(cx + halfX + highlightOffset * 0.24, cy + halfY + highlightOffset, cz - halfZ),
        end: new THREE.Vector3(cx + halfX + highlightOffset * 0.24, cy + halfY + highlightOffset, cz + halfZ),
        label: `Produkt B ${formatNumber(unitWidthCm)} cm`,
        offsetDirection: new THREE.Vector3(1, 1, 0),
      }),
    );
    scene.add(
      createDimensionAnnotation3d({
        start: new THREE.Vector3(cx + halfX + highlightOffset * 0.28, cy - halfY, cz + halfZ + highlightOffset * 0.24),
        end: new THREE.Vector3(cx + halfX + highlightOffset * 0.28, cy + halfY, cz + halfZ + highlightOffset * 0.24),
        label: `Produkt H ${formatNumber(unitHeightCm)} cm`,
        offsetDirection: new THREE.Vector3(1, 0, 1),
      }),
    );
  }

  const resize = () => {
    const width = Math.max(280, roundInt(container.clientWidth, 0) || 320);
    const height = Math.max(220, roundInt(container.clientHeight, 0) || 320);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();

  let rafId = 0;
  let disposed = false;
  const renderFrame = () => {
    if (disposed) {
      return;
    }
    rafId = requestAnimationFrame(renderFrame);
    controls.update();
    renderer.render(scene, camera);
  };
  renderFrame();

  window.addEventListener("resize", resize);
  let resizeObserver = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);
  }

  const disposeMaterial = (material) => {
    if (!material) {
      return;
    }
    if (Array.isArray(material)) {
      material.forEach((item) => disposeMaterial(item));
      return;
    }
    if (material.map) {
      material.map.dispose();
    }
    material.dispose();
  };

  const cleanup = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    window.removeEventListener("resize", resize);
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    controls.dispose();
    scene.traverse((node) => {
      if (node.geometry) {
        node.geometry.dispose();
      }
      if (node.material) {
        disposeMaterial(node.material);
      }
    });
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return {
    cleanup,
    renderedUnits: rendered,
    totalUnits: placedUnits,
  };
}

function createShippingLayout3dElement(metrics) {
  const wrapper = document.createElement("div");
  wrapper.className = "shipping-layout-3d-wrap";
  wrapper.title = tooltipForMetric("shipping.layout_preview", "");

  const canvasHost = document.createElement("div");
  canvasHost.className = "shipping-layout-3d-canvas";
  const status = document.createElement("p");
  status.className = "hint";
  status.textContent = "3D-Packbild wird geladen ...";
  canvasHost.appendChild(status);

  const meta = document.createElement("div");
  meta.className = "shipping-layout-3d-meta";
  const freeVolumePct = clamp(100 - num(metrics.shipping.volumeFillPct, 0), 0, 100);
  const productDimsText = Array.isArray(metrics.shipping.layoutPreview?.orientation) && metrics.shipping.layoutPreview.orientation.length === 3
    ? `${formatNumber(metrics.shipping.layoutPreview.orientation[0])} × ${formatNumber(metrics.shipping.layoutPreview.orientation[1])} × ${formatNumber(metrics.shipping.layoutPreview.orientation[2])} cm`
    : "-";
  meta.innerHTML =
    `<p><strong>Freies Volumen:</strong> ${formatNumber(metrics.shipping.voidVolumeLiters)} L (${formatNumber(metrics.shipping.voidVolumeCbm)} CBM)</p>` +
    `<p><strong>Luftanteil:</strong> ${formatPercent(freeVolumePct)} · <strong>Volumen-Packgrad:</strong> ${formatPercent(metrics.shipping.volumeFillPct)}</p>` +
    `<p><strong>Umkarton:</strong> ${formatNumber(metrics.shipping.estimatedCartonLengthCm)} × ${formatNumber(metrics.shipping.estimatedCartonWidthCm)} × ${formatNumber(metrics.shipping.estimatedCartonHeightCm)} cm</p>` +
    `<p><strong>Produkt (im Raster):</strong> ${productDimsText}</p>`;

  const legend = document.createElement("div");
  legend.className = "shipping-layout-3d-legend";
  legend.innerHTML =
    `<span><i class="tone-carton"></i>Umkarton (transparent)</span>` +
    `<span><i class="tone-product"></i>Produktverpackungen</span>` +
    `<span><i class="tone-highlight"></i>Referenz-Produkt</span>`;

  wrapper.append(canvasHost, meta, legend);

  const fallbackTo2d = (reason) => {
    ensureShipping3dCleanup("driver_modal");
    canvasHost.innerHTML = "";
    canvasHost.appendChild(createShippingLayoutFallbackElement(metrics, reason));
  };

  if (!metrics.shipping.layoutPreview?.available) {
    fallbackTo2d("3D-Packbild nicht verfügbar. Es werden zuerst konsistente Layoutdaten benötigt.");
    return wrapper;
  }

  if (!(window.Packaging3D && typeof window.Packaging3D.buildViewModel === "function" && typeof window.Packaging3D.mount === "function")) {
    fallbackTo2d(
      `Lokales 3D-Modul nicht verfügbar. Erwartete Assets: ${SHIPPING_3D_THREE_LOCAL} + ${SHIPPING_3D_ORBIT_LOCAL}. 2D-Fallback aktiv.`,
    );
    return wrapper;
  }

  const orientedUnitDims = Array.isArray(metrics.shipping.layoutPreview?.orientation) && metrics.shipping.layoutPreview.orientation.length === 3
    ? metrics.shipping.layoutPreview.orientation
    : [
      Math.max(0.1, num(metrics.shipping.estimatedCartonLengthCm, 1)),
      Math.max(0.1, num(metrics.shipping.estimatedCartonWidthCm, 1)),
      Math.max(0.1, num(metrics.shipping.estimatedCartonHeightCm, 1)),
    ];

  const viewModel = window.Packaging3D.buildViewModel({
    unitDimsCm: orientedUnitDims,
    cartonDimsCm: [
      Math.max(0.1, num(metrics.shipping.estimatedCartonLengthCm, 1)),
      Math.max(0.1, num(metrics.shipping.estimatedCartonWidthCm, 1)),
      Math.max(0.1, num(metrics.shipping.estimatedCartonHeightCm, 1)),
    ],
    targetUnits: Math.max(1, roundInt(metrics.shipping.unitsPerCartonAuto, 1)),
    outerBufferCm: Math.max(0, num(state.settings?.cartonRules?.outerBufferCm, 0)),
    allowSixOrientations: true,
    mode: "maximal",
    renderLimit: SHIPPING_3D_MAX_RENDER_UNITS,
  });

  if (!viewModel?.layout?.available) {
    fallbackTo2d("3D-Layoutdaten nicht verfügbar. 2D-Fallback aktiv.");
    return wrapper;
  }

  try {
    ensureShipping3dCleanup("driver_modal");
    const result = window.Packaging3D.mount(canvasHost, viewModel, { scopeKey: "driver_modal" });
    if (result && typeof result.cleanup === "function") {
      state.ui.shipping3dCleanup = result.cleanup;
    } else {
      state.ui.shipping3dCleanup = () => ensureShipping3dCleanup("driver_modal");
    }
    const renderedUnits = Math.max(0, roundInt(result?.renderedUnits, 0));
    const totalUnits = Math.max(0, roundInt(result?.totalUnits, viewModel.layout.placedUnits));
    if (totalUnits > renderedUnits) {
      const note = document.createElement("p");
      note.className = "hint";
      note.textContent = `Visualisiert: ${formatNumber(renderedUnits)} von ${formatNumber(totalUnits)} Stück (Limit ${formatNumber(SHIPPING_3D_MAX_RENDER_UNITS)}).`;
      canvasHost.appendChild(note);
    }
  } catch (error) {
    console.error("Packaging3D modal render failed", error);
    fallbackTo2d("3D-Rendering nicht möglich (Browser/WebGL). 2D-Fallback aktiv.");
  }

  return wrapper;
}

function createShippingLayoutPreviewElement(metrics) {
  const wrapper = document.createElement("div");
  wrapper.className = "shipping-layout-wrap";
  wrapper.title = tooltipForMetric("shipping.layout_preview", "");
  const preview = metrics.shipping.layoutPreview;
  if (!preview?.available) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = "Packbild nicht verfügbar. Bitte prüfe Produkt- und Umkartonmaße.";
    wrapper.appendChild(hint);
    return wrapper;
  }

  const cols = Math.max(1, roundInt(preview.nx, 1));
  const rows = Math.max(1, roundInt(preview.ny, 1));
  const topSlots = Math.max(1, cols * rows);
  const topPlaced = Math.min(topSlots, Math.max(0, roundInt(preview.placedUnits, 0)));
  const totalPlaced = Math.max(0, roundInt(preview.placedUnits, 0));
  const targetUnits = Math.max(1, roundInt(metrics.shipping.unitsPerCartonAuto, 1));

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 280 180");
  svg.classList.add("shipping-layout-svg");
  const outer = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  outer.setAttribute("x", "8");
  outer.setAttribute("y", "8");
  outer.setAttribute("width", "264");
  outer.setAttribute("height", "164");
  outer.setAttribute("rx", "6");
  outer.setAttribute("class", "shipping-layout-outer");
  svg.appendChild(outer);

  const inset = 14;
  const gap = 2;
  const usableW = 280 - inset * 2;
  const usableH = 180 - inset * 2;
  const cellW = (usableW - gap * (cols - 1)) / cols;
  const cellH = (usableH - gap * (rows - 1)) / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const idx = row * cols + col;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(inset + col * (cellW + gap)));
      rect.setAttribute("y", String(inset + row * (cellH + gap)));
      rect.setAttribute("width", String(cellW));
      rect.setAttribute("height", String(cellH));
      rect.setAttribute("rx", "2");
      rect.setAttribute("class", idx < topPlaced ? "shipping-layout-cell filled" : "shipping-layout-cell");
      svg.appendChild(rect);
    }
  }

  const meta = document.createElement("div");
  meta.className = "shipping-layout-meta";
  const orientationText = Array.isArray(preview.orientation) && preview.orientation.length === 3
    ? `${formatNumber(preview.orientation[0])} × ${formatNumber(preview.orientation[1])} × ${formatNumber(preview.orientation[2])} cm`
    : "-";
  const fitTypeLabel = {
    auto: "Auto",
    manual_estimated: "Manuell (Umkarton geschätzt)",
    manual_declared: "Manuell (Umkarton vorgegeben)",
    fallback: "Fallback",
  }[preview.fitType] ?? "Auto";
  meta.innerHTML =
    `<p><strong>Basis:</strong> ${fitTypeLabel}</p>` +
    `<p><strong>Raster:</strong> ${cols} × ${rows} (Top-View), ${formatNumber(preview.nz)} Layer</p>` +
    `<p><strong>Platzierte Stücke:</strong> ${formatNumber(totalPlaced)}/${formatNumber(targetUnits)}</p>` +
    `<p><strong>Freie Fläche Top-View:</strong> ${formatPercent(preview.freeAreaPctTopView)}</p>` +
    `<p><strong>Orientierung je Stück:</strong> ${orientationText}</p>`;

  wrapper.append(svg, meta);
  return wrapper;
}

function createShippingDashboardModalContent(metrics) {
  const modeLabel = metrics.shipping.modeLabel ?? shippingModeLabel(metrics.shipping.transportMode);
  const unitsPerPo = Math.max(1, num(metrics.shipping.unitsPerOrder, 1));
  const shippingD2dPerUnit = Math.max(0, num(metrics.shipping.shippingPerUnit, 0));
  const customsPerUnit = Math.max(0, num(metrics.customsUnit, 0));
  const orderFixedPerUnit = Math.max(0, num(metrics.orderFixedPerUnit, 0));
  const importSurchargesPerUnit = customsPerUnit + orderFixedPerUnit;
  const shippingTo3plPerUnit = Math.max(
    0,
    num(metrics.quickBlockShippingTo3plPerUnit, shippingD2dPerUnit + importSurchargesPerUnit),
  );
  const shippingD2dTotalPo = Math.max(0, num(metrics.shipping.shippingTotal, shippingD2dPerUnit * unitsPerPo));
  const importSurchargesTotalPo = importSurchargesPerUnit * unitsPerPo;
  const shippingTo3plTotalPo = shippingD2dTotalPo + importSurchargesTotalPo;
  const equationDiff = Math.abs(shippingD2dPerUnit + importSurchargesPerUnit - shippingTo3plPerUnit);
  const equationMatches = equationDiff <= 0.0005;

  const section = document.createElement("section");
  section.className = "shipping-dashboard shipping-modal-dashboard";

  const head = document.createElement("div");
  head.className = "shipping-dashboard-head";
  const headLeft = document.createElement("div");
  const heading = document.createElement("h4");
  heading.textContent = "Shipping Dashboard (Bottom-up)";
  const method = document.createElement("p");
  method.className = "hint";
  method.textContent =
    `Modus ${modeLabel}: Auto-Kartonisierung startet mit der maximal zulässigen Stückzahl aus Gewichts- und Maßgrenze. Rail Vor-/Nachlauf variabel basiert auf Sendungsvolumen (CBM).`;
  headLeft.append(heading, method);
  const tile = document.createElement("article");
  tile.className = "shipping-total-tile";
  tile.title = `${tooltipForMetric("shipping.total_po")}\n${tooltipForMetric("shipping.per_unit")}`;
  tile.innerHTML = `
    <span>Shipping D2D total pro PO</span>
    <strong>${formatCurrency(shippingD2dTotalPo)}</strong>
    <small>${formatCurrency(shippingD2dPerUnit)} / Unit · Shipping D2D</small>
  `;
  head.append(headLeft, tile);
  section.appendChild(head);

  const bridge = document.createElement("section");
  bridge.className = "shipping-bridge";

  const bridgeGrid = document.createElement("div");
  bridgeGrid.className = "shipping-bridge-grid";
  const addBridgeCard = (label, value, hint, toneClass = "") => {
    const card = document.createElement("article");
    card.className = `shipping-bridge-card ${toneClass}`.trim();
    card.innerHTML = `
      <span>${label}</span>
      <strong>${formatCurrency(value)} / Unit</strong>
      <small>${hint}</small>
    `;
    bridgeGrid.appendChild(card);
  };
  const addBridgeOperator = (symbol) => {
    const operator = document.createElement("span");
    operator.className = "shipping-bridge-operator";
    operator.textContent = symbol;
    bridgeGrid.appendChild(operator);
  };

  addBridgeCard("Shipping D2D / Unit", shippingD2dPerUnit, "(Vorlauf bis Nachbelastung)", "tone-d2d");
  addBridgeOperator("+");
  addBridgeCard("Import-Aufschläge / Unit", importSurchargesPerUnit, "(Zoll + Order-Fix)", "tone-import");
  addBridgeOperator("=");
  addBridgeCard("Shipping zu 3PL / Unit", shippingTo3plPerUnit, "(Gesamt)", "tone-total");
  bridge.appendChild(bridgeGrid);

  const equationLine = document.createElement("p");
  equationLine.className = `shipping-bridge-formula ${equationMatches ? "is-consistent" : "is-warning"}`;
  equationLine.innerHTML =
    `Shipping zu 3PL / Unit = Shipping D2D / Unit + Zoll / Unit + Order-Fix / Unit · ` +
    `<strong>${formatCurrency(shippingTo3plPerUnit)} = ${formatCurrency(shippingD2dPerUnit)} + ${formatCurrency(customsPerUnit)} + ${formatCurrency(orderFixedPerUnit)}</strong>` +
    (equationMatches ? " ✓" : "");
  bridge.appendChild(equationLine);

  const poLine = document.createElement("p");
  poLine.className = "shipping-bridge-po";
  poLine.innerHTML =
    `PO-Sicht: <strong>${formatCurrency(shippingD2dTotalPo)}</strong> (Shipping D2D) + ` +
    `<strong>${formatCurrency(importSurchargesTotalPo)}</strong> (Import-Aufschläge) = ` +
    `<strong>${formatCurrency(shippingTo3plTotalPo)}</strong> (Shipping zu 3PL)`;
  bridge.appendChild(poLine);
  section.appendChild(bridge);

  if (metrics.shipping.oversizeFlag) {
    const oversize = document.createElement("p");
    oversize.className = "hint warn";
    oversize.textContent = metrics.shipping.oversizeNote;
    section.appendChild(oversize);
  }

  const createKpiGrid = (rows) => {
    const grid = document.createElement("div");
    grid.className = "shipping-kpi-grid";
    rows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "shipping-kpi-item";
      item.innerHTML = `<span>${row.label}</span><strong>${row.value}</strong>`;
      item.title = tooltipForMetric(row.tooltipKey, "");
      grid.appendChild(item);
    });
    return grid;
  };

  const mainGrid = document.createElement("div");
  mainGrid.className = "shipping-dashboard-grid shipping-dashboard-grid-compact";

  const cartonPanel = document.createElement("article");
  cartonPanel.className = "shipping-panel";
  const cartonTitle = document.createElement("h4");
  cartonTitle.textContent = "Kartonisierung";
  cartonPanel.appendChild(cartonTitle);
  cartonPanel.appendChild(
    createKpiGrid([
      { label: "Stück nach Gewichtsgrenze", value: formatNumber(metrics.shipping.unitsByWeightCap), tooltipKey: "shipping.units_by_weight_cap" },
      { label: "Stück nach Maßgrenze", value: formatNumber(metrics.shipping.unitsByDimensionCap), tooltipKey: "shipping.units_by_dimension_cap" },
      {
        label: "Gewählte Stück je Umkarton",
        value: `${formatNumber(metrics.shipping.unitsPerCartonAuto)} (${metrics.shipping.cartonizationSource === "manual_override" ? "manuell" : "auto"})`,
        tooltipKey: "shipping.units_per_carton",
      },
      { label: "Physische Kartons", value: formatNumber(metrics.shipping.physicalCartonsCount), tooltipKey: "shipping.physical_cartons" },
      { label: "Volumen-Packgrad", value: formatPercent(metrics.shipping.volumeFillPct), tooltipKey: "shipping.volume_fill_pct" },
      { label: "Luft je Umkarton", value: `${formatNumber(metrics.shipping.voidVolumeLiters)} L`, tooltipKey: "shipping.void_volume_liters" },
      { label: "Gewichtsauslastung", value: formatPercent(metrics.shipping.weightFillPct), tooltipKey: "shipping.weight_fill_pct" },
    ]),
  );
  if (
    metrics.shipping.unitsPerCartonSelectionReason === "auto_cap_downshift_exact_fit" &&
    metrics.shipping.unitsPerCartonDownshift > 0
  ) {
    const downshiftHint = document.createElement("p");
    downshiftHint.className = "hint warn";
    downshiftHint.textContent =
      `Auto von ${formatNumber(metrics.shipping.unitsPerCartonCapCandidate)} auf ${formatNumber(metrics.shipping.unitsPerCartonAuto)} reduziert: Für den Kandidatenwert passt keine exakte Anordnung im zulässigen Umkarton.`;
    cartonPanel.appendChild(downshiftHint);
    const downshiftAction = document.createElement("p");
    downshiftAction.className = "hint";
    downshiftAction.textContent =
      "Was du tun kannst: Stück je Umkarton reduzieren oder reale Umkartonmaße manuell setzen.";
    cartonPanel.appendChild(downshiftAction);
  }

  if (metrics.shipping.cartonizationSource === "manual_override") {
    const manualFitBox = document.createElement("div");
    manualFitBox.className = `shipping-fit-box ${String(metrics.shipping.manualFitStatus).startsWith("warn") ? "warn" : ""}`;
    manualFitBox.title = tooltipForMetric("shipping.manual_fit_status", "");
    const statusLine = document.createElement("strong");
    statusLine.textContent = `Manuelle Plausibilitätsprüfung: ${shippingManualFitStatusLabel(metrics.shipping.manualFitStatus)}`;
    manualFitBox.appendChild(statusLine);
    if (metrics.shipping.manualFitHint) {
      const hint = document.createElement("p");
      hint.textContent = metrics.shipping.manualFitHint;
      manualFitBox.appendChild(hint);
    }
    if (metrics.shipping.manualSuggestion) {
      const suggestion = document.createElement("p");
      suggestion.textContent = `Vorschlag: ${metrics.shipping.manualSuggestion}`;
      manualFitBox.appendChild(suggestion);
    }
    cartonPanel.appendChild(manualFitBox);
  }

  const cartonDetails = document.createElement("details");
  cartonDetails.className = "shipping-detail-toggle";
  cartonDetails.innerHTML =
    `<summary>Weitere Kartonisierungsdetails</summary>` +
    `<div class="shipping-detail-body">` +
    `<p><strong>Quelle:</strong> ${metrics.shipping.cartonizationSourceLabel}</p>` +
    `<p><strong>Kandidatenwert (vor Plausibilitätsprüfung):</strong> ${formatNumber(metrics.shipping.unitsPerCartonCapCandidate)} Stück je Umkarton</p>` +
    `<p><strong>Auswahlgrund:</strong> ${cartonizationSelectionReasonLabel(metrics.shipping.unitsPerCartonSelectionReason)}</p>` +
    `<p><strong>Was tun:</strong> ${cartonizationSelectionActionLabel(metrics.shipping.unitsPerCartonSelectionReason)}</p>` +
    `<p><strong>Umkartonmaße:</strong> ${formatNumber(metrics.shipping.estimatedCartonLengthCm)} × ${formatNumber(metrics.shipping.estimatedCartonWidthCm)} × ${formatNumber(metrics.shipping.estimatedCartonHeightCm)} cm</p>` +
    `<p><strong>Umkarton-Bruttogewicht:</strong> ${formatNumber(metrics.shipping.estimatedCartonGrossWeightKg)} kg</p>` +
    `</div>`;
  cartonPanel.appendChild(cartonDetails);

  const layoutDetails = document.createElement("details");
  layoutDetails.className = "shipping-detail-toggle";
  layoutDetails.innerHTML = "<summary>Packbild (3D, drehbar)</summary>";
  const layoutBody = document.createElement("div");
  layoutBody.className = "shipping-detail-body";
  const volumeHint = document.createElement("p");
  const freeVolumePct = clamp(100 - num(metrics.shipping.volumeFillPct, 0), 0, 100);
  volumeHint.innerHTML =
    `<strong>Freies Volumen:</strong> ${formatNumber(metrics.shipping.voidVolumeLiters)} L (${formatNumber(metrics.shipping.voidVolumeCbm)} CBM) · ` +
    `<strong>Luftanteil:</strong> ${formatPercent(freeVolumePct)}`;
  layoutBody.appendChild(volumeHint);
  layoutBody.appendChild(createShippingLayout3dElement(metrics));
  layoutDetails.appendChild(layoutBody);
  cartonPanel.appendChild(layoutDetails);

  mainGrid.appendChild(cartonPanel);

  const basisPanel = document.createElement("article");
  basisPanel.className = "shipping-panel";
  const basisTitle = document.createElement("h4");
  basisTitle.textContent = "Abrechnungsbasis";
  basisPanel.appendChild(basisTitle);
  const basisHint = document.createElement("p");
  basisHint.className = "hint";
  basisHint.textContent =
    "Vorlauf/Nachlauf (Rail) nutzt Sendungsvolumen. Hauptlauf variabel nutzt Abrechnungsvolumen (W/M).";
  basisPanel.appendChild(basisHint);
  basisPanel.appendChild(
    createKpiGrid([
      { label: "Sendungsvolumen (CBM)", value: `${formatNumber(metrics.shipping.shipmentCbm)} CBM`, tooltipKey: "shipping.shipment_cbm" },
      { label: "Sendungsgewicht", value: `${formatNumber(metrics.shipping.shipmentWeightKg)} kg`, tooltipKey: "shipping.shipment_weight_kg" },
      { label: "Abrechnungsvolumen (W/M-CBM)", value: `${formatNumber(metrics.shipping.chargeableCbm)} CBM`, tooltipKey: "shipping.chargeable_cbm" },
    ]),
  );
  const extendedBasisDetails = document.createElement("details");
  extendedBasisDetails.className = "shipping-detail-toggle";
  extendedBasisDetails.innerHTML = `<summary>Erweiterte Referenzwerte (Info)</summary>`;
  extendedBasisDetails.appendChild(
    createKpiGrid([
      { label: "Abrechnungs-Kartons (Äquivalenz)", value: formatNumber(metrics.shipping.equivalentCartonsCount), tooltipKey: "shipping.equivalent_cartons" },
      { label: "Referenzvolumen je Äquivalenz-Karton", value: `${formatNumber(metrics.shipping.equivalentReferenceCbm)} CBM`, tooltipKey: "shipping.reference_cbm" },
      { label: "Referenzgewicht je Äquivalenz-Karton", value: `${formatNumber(metrics.shipping.equivalentReferenceWeightKg)} kg`, tooltipKey: "shipping.reference_weight_kg" },
    ]),
  );
  basisPanel.appendChild(extendedBasisDetails);
  mainGrid.appendChild(basisPanel);

  const costPanel = document.createElement("article");
  costPanel.className = "shipping-panel";
  const costTitle = document.createElement("h4");
  costTitle.textContent = "Kosten je PO und je Unit";
  const costHint = document.createElement("p");
  costHint.className = "hint";
  costHint.textContent = "Shipping zu 3PL / Unit = Shipping D2D / Unit + Zoll / Unit + Order-Fix / Unit.";
  costHint.title = "Rechenbrücke: D2D-Kosten plus Import-Aufschläge ergeben den Gesamtblock Shipping zu 3PL.";
  costPanel.append(costTitle, costHint);

  const d2dDetails = document.createElement("details");
  d2dDetails.className = "shipping-detail-toggle";
  d2dDetails.open = true;
  d2dDetails.innerHTML = `<summary>A) Shipping D2D (ohne Zoll & Order-Fix) · ${formatCurrency(shippingD2dPerUnit)}/Unit</summary>`;
  const d2dList = document.createElement("ul");
  d2dList.className = "calc-list shipping-detail-body";
  metrics.shipping.breakdown.forEach((line) => {
    const li = document.createElement("li");
    li.className = "shipping-breakdown-row";
    li.innerHTML =
      `<div><span>${line.label}</span><small>${line.formula ?? ""}</small></div>` +
      `<strong>${formatCurrency(line.total)} · ${formatCurrency(line.perUnit)}/Unit</strong>`;
    li.title = [line.formula ? `Rechenweg: ${line.formula}` : null, line.source ? `Herkunft: ${line.source}` : null]
      .filter(Boolean)
      .join("\n");
    d2dList.appendChild(li);
  });
  d2dDetails.appendChild(d2dList);
  const d2dSubtotal = document.createElement("p");
  d2dSubtotal.className = "shipping-breakdown-subtotal";
  d2dSubtotal.innerHTML =
    `Zwischensumme Shipping D2D: <strong>${formatCurrency(shippingD2dTotalPo)}</strong> pro PO · ` +
    `<strong>${formatCurrency(shippingD2dPerUnit)}</strong>/Unit`;
  d2dDetails.appendChild(d2dSubtotal);
  costPanel.appendChild(d2dDetails);

  const importDetails = document.createElement("details");
  importDetails.className = "shipping-detail-toggle";
  importDetails.innerHTML = `<summary>B) Import-Aufschläge (Zoll + Order-Fix) · ${formatCurrency(importSurchargesPerUnit)}/Unit</summary>`;
  const importList = document.createElement("ul");
  importList.className = "calc-list shipping-detail-body";
  [
    {
      label: "Zoll (Abgabe)",
      total: customsPerUnit * unitsPerPo,
      perUnit: customsPerUnit,
      formula: "Zoll = Zollsatz × (Warenwert EUR + Shipping D2D/Unit)",
      source: "Import-Default/Override",
    },
    {
      label: "Order-Fixkosten",
      total: orderFixedPerUnit * unitsPerPo,
      perUnit: orderFixedPerUnit,
      formula: "Order-Fix/Unit = (Dokumentation + Frachtpapiere) / PO Units",
      source: "Global costDefaults oder Produkt-Override",
    },
  ].forEach((line) => {
    const li = document.createElement("li");
    li.className = "shipping-breakdown-row";
    li.innerHTML =
      `<div><span>${line.label}</span><small>${line.formula}</small></div>` +
      `<strong>${formatCurrency(line.total)} · ${formatCurrency(line.perUnit)}/Unit</strong>`;
    li.title = `Rechenweg: ${line.formula}\nHerkunft: ${line.source}`;
    importList.appendChild(li);
  });
  importDetails.appendChild(importList);
  const importSubtotal = document.createElement("p");
  importSubtotal.className = "shipping-breakdown-subtotal";
  importSubtotal.innerHTML =
    `Zwischensumme Import-Aufschläge: <strong>${formatCurrency(importSurchargesTotalPo)}</strong> pro PO · ` +
    `<strong>${formatCurrency(importSurchargesPerUnit)}</strong>/Unit`;
  importDetails.appendChild(importSubtotal);
  costPanel.appendChild(importDetails);

  const totalCard = document.createElement("article");
  totalCard.className = "shipping-endsum-card";
  totalCard.innerHTML = `
    <span>C) Endsumme Shipping zu 3PL</span>
    <strong>${formatCurrency(shippingTo3plPerUnit)} / Unit</strong>
    <small>${formatCurrency(shippingTo3plTotalPo)} pro PO</small>
  `;
  costPanel.appendChild(totalCard);

  mainGrid.appendChild(costPanel);

  section.appendChild(mainGrid);
  return section;
}

function createShippingManualOverrideModalSection(selected, metrics = null) {
  if (!selected) {
    return null;
  }

  const manualTogglePath = "assumptions.cartonization.manualEnabled";
  const manualPaths = [
    manualTogglePath,
    "assumptions.cartonization.unitsPerCarton",
    "assumptions.cartonization.cartonLengthCm",
    "assumptions.cartonization.cartonWidthCm",
    "assumptions.cartonization.cartonHeightCm",
    "assumptions.cartonization.cartonGrossWeightKg",
  ];
  const manualEnabled = Boolean(getByPath(selected, manualTogglePath));

  const section = document.createElement("section");
  section.className = "shipping-panel";

  const title = document.createElement("h4");
  title.textContent = "Manuelle Umkartonisierung (optional)";
  section.appendChild(title);

  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent =
    "Wenn Maße/Gewicht leer bleiben, wird für die manuelle Stückzahl ein plausibler Umkarton geschätzt.";
  section.appendChild(hint);

  const manualStatus = metrics?.shipping?.manualFitStatus ?? "n/a";
  if (manualEnabled && (manualStatus !== "n/a" || Boolean(metrics?.shipping?.manualFitHint))) {
    const fitInfo = document.createElement("div");
    fitInfo.className = `shipping-fit-box ${String(manualStatus).startsWith("warn") ? "warn" : ""}`;
    fitInfo.title = tooltipForMetric("shipping.manual_fit_status", "");
    const title = document.createElement("strong");
    title.textContent = `Plausibilitätsstatus: ${shippingManualFitStatusLabel(manualStatus)}`;
    fitInfo.appendChild(title);
    if (metrics?.shipping?.manualFitHint) {
      const hintText = document.createElement("p");
      hintText.textContent = metrics.shipping.manualFitHint;
      fitInfo.appendChild(hintText);
    }
    if (metrics?.shipping?.manualSuggestion) {
      const suggestionText = document.createElement("p");
      suggestionText.textContent = `Vorschlag: ${metrics.shipping.manualSuggestion}`;
      fitInfo.appendChild(suggestionText);
    }
    section.appendChild(fitInfo);
  }

  const grid = document.createElement("div");
  grid.className = "modal-group-fields";

  manualPaths.forEach((path) => {
    const sourceControl = getFieldControl(path);
    const labelText = resolveLabelForPath(path, sourceControl);
    const helpText = getPathHelp(path);
    const currentValue = getByPath(selected, path);

    const field = document.createElement("article");
    field.className = "modal-field";

    const head = document.createElement("div");
    head.className = "modal-field-head";
    const strong = document.createElement("strong");
    strong.textContent = labelText;
    head.appendChild(strong);
    field.appendChild(head);

    const control = cloneControlForModal(sourceControl, { path });
    const isManualToggle = path === manualTogglePath;

    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      control.checked = Boolean(currentValue);
      control.disabled = false;
      control.addEventListener("change", () => {
        updateSelectedField(path, control.checked);
        markReviewOverriddenFromModal(selected);
        refreshAfterModalInput();
      });
      const wrap = document.createElement("label");
      wrap.className = "toggle-row";
      const text = document.createElement("span");
      text.textContent = labelText;
      wrap.append(control, text);
      field.appendChild(wrap);
    } else if (control instanceof HTMLSelectElement) {
      control.value = String(currentValue ?? "");
      control.disabled = !isManualToggle && !manualEnabled;
      control.addEventListener("change", () => {
        updateSelectedField(path, control.value);
        markReviewOverriddenFromModal(selected);
        refreshAfterModalInput();
      });
      field.appendChild(control);
    } else if (control instanceof HTMLInputElement) {
      control.value = currentValue ?? "";
      control.disabled = !isManualToggle && !manualEnabled;
      if (!(sourceControl instanceof HTMLInputElement)) {
        if (path === "assumptions.cartonization.unitsPerCarton") {
          control.type = "number";
          control.step = "1";
          control.min = "1";
        } else if (path.endsWith("Cm")) {
          control.type = "number";
          control.step = "0.1";
          control.min = "0";
        } else if (path.endsWith("Kg")) {
          control.type = "number";
          control.step = "0.1";
          control.min = "0";
        }
      }
      control.addEventListener("change", () => {
        updateSelectedField(path, control.value);
        markReviewOverriddenFromModal(selected);
        refreshAfterModalInput();
      });
      field.appendChild(control);
    }

    if (helpText) {
      const help = document.createElement("small");
      help.textContent = helpText;
      field.appendChild(help);
    }

    grid.appendChild(field);
  });

  section.appendChild(grid);
  return section;
}

function quickCoverageMeta(coveragePct) {
  if (coveragePct >= 80) {
    return {
      tone: "ok",
      text: "Abdeckung hoch: Der QuickCheck-Workflow deckt den Großteil der Kosten ab.",
    };
  }
  if (coveragePct >= 65) {
    return {
      tone: "warn",
      text: "Abdeckung mittel: Größte Restkosten prüfen und bei Bedarf nachschärfen.",
    };
  }
  return {
    tone: "critical",
    text: "Abdeckung niedrig: Zusätzliche Kostenblöcke für einen belastbaren QuickCheck prüfen.",
  };
}

const QUICK_CORE_COST_LINE_IDS = new Set([
  "quick_core.exw",
  "quick_core.shipping.origin",
  "quick_core.shipping.main_variable",
  "quick_core.shipping.main_fixed",
  "quick_core.shipping.post",
  "quick_core.shipping.customs_clearance",
  "quick_core.shipping.insurance",
  "quick_core.shipping.surcharge",
  "quick_core.shipping.customs_duty",
  "quick_core.shipping.order_fixed",
  "quick_core.threepl.inbound",
  "quick_core.threepl.storage",
  "quick_core.threepl.service",
  "quick_core.threepl.carrier",
  "quick_core.amazon.referral",
  "quick_core.amazon.fba",
  "quick_core.amazon.ads",
  "quick_core.launch.budget",
  "quick_core.launch.listing",
  "quick_core.launch.ops",
]);

function getValidationCoverageTargetPct(product) {
  return clamp(
    num(product?.workflow?.validation?.coverageTargetPct, VALIDATION_COVERAGE_TARGET_DEFAULT),
    80,
    99,
  );
}

function getValidationCheckedBlockIds(product) {
  const raw = product?.workflow?.validation?.checkedBlockIds;
  if (!Array.isArray(raw)) {
    return [];
  }
  return [...new Set(raw.map((entry) => String(entry ?? "").trim()).filter(Boolean))];
}

function buildValidationWorkflowData(metrics, product, prebuiltCategories = null) {
  const categories = prebuiltCategories ?? buildCostCategoryData(metrics);
  const totalCostPerUnit = Math.max(0, num(metrics.totalCostPerUnit, 0));
  const coverageTargetPct = getValidationCoverageTargetPct(product);
  const checkedResidualIds = new Set(getValidationCheckedBlockIds(product));

  const coreItems = [
    { id: "core.exw", blockKey: "exw", label: "EXW / Einkauf", perUnit: num(metrics.quickBlockExwPerUnit, 0) },
    { id: "core.shipping_to_3pl", blockKey: "shipping_to_3pl", label: "Shipping zu 3PL", perUnit: num(metrics.quickBlockShippingTo3plPerUnit, 0) },
    { id: "core.threepl", blockKey: "threepl", label: "3PL", perUnit: num(metrics.quickBlockThreePlPerUnit, 0) },
    { id: "core.amazon_core", blockKey: "amazon_core", label: "Amazon (Referral + TACoS + FBA)", perUnit: num(metrics.quickBlockAmazonCorePerUnit, 0) },
    { id: "core.launch_core", blockKey: "launch_core", label: "Launch (Listing + Budget + Ops)", perUnit: num(metrics.quickBlockLaunchCorePerUnit, 0) },
  ].map((item) => ({
    ...item,
    sharePct: totalCostPerUnit > 0 ? (item.perUnit / totalCostPerUnit) * 100 : 0,
    isCore: true,
    isChecked: true,
    isSuggested: false,
    detailType: "core",
  }));

  const residualItems = [];
  categories.forEach((category) => {
    category.lines.forEach((lineItem) => {
      if (lineItem.isSummary || lineItem.excludeFromCategoryTotal) {
        return;
      }
      if (QUICK_CORE_COST_LINE_IDS.has(lineItem.id)) {
        return;
      }
      const perUnit = num(lineItem.valueRaw, 0);
      if (perUnit <= 0.0001) {
        return;
      }
      const id = String(lineItem.id ?? `${category.key}:${lineItem.label}`);
      residualItems.push({
        id,
        label: lineItem.label,
        perUnit,
        sharePct: totalCostPerUnit > 0 ? (perUnit / totalCostPerUnit) * 100 : 0,
        isCore: false,
        isChecked: checkedResidualIds.has(id),
        isSuggested: false,
        detailType: "residual",
        explain: lineItem.explain ?? "",
        formula: lineItem.formula ?? "",
        source: lineItem.source ?? "",
        robustness: lineItem.robustness ?? "Mittel",
        driverPaths: Array.isArray(lineItem.driverPaths) ? lineItem.driverPaths : [],
      });
    });
  });
  residualItems.sort((a, b) => b.perUnit - a.perUnit);

  const coveredByCore = coreItems.reduce((sum, item) => sum + item.perUnit, 0);
  const coveredByCheckedResidual = residualItems.reduce(
    (sum, item) => (item.isChecked ? sum + item.perUnit : sum),
    0,
  );
  const coveredPerUnit = coveredByCore + coveredByCheckedResidual;
  const coveragePct = totalCostPerUnit > 0 ? (coveredPerUnit / totalCostPerUnit) * 100 : 0;
  const residualPerUnit = Math.max(0, totalCostPerUnit - coveredPerUnit);

  const suggestedResidualItems = [];
  let runningCovered = coveredPerUnit;
  residualItems.forEach((item) => {
    if (runningCovered / Math.max(totalCostPerUnit, 0.0001) * 100 >= coverageTargetPct) {
      return;
    }
    if (item.isChecked) {
      return;
    }
    item.isSuggested = true;
    suggestedResidualItems.push(item);
    runningCovered += item.perUnit;
  });

  const openTopResidualItems = residualItems.filter((item) => !item.isChecked).slice(0, 3);

  return {
    coverageTargetPct,
    coveredPerUnit,
    residualPerUnit,
    coveragePct,
    ready: coveragePct >= coverageTargetPct,
    blockItems: [...coreItems, ...residualItems],
    suggestedResidualItems,
    openTopResidualItems,
    checkedResidualIds: [...checkedResidualIds],
  };
}

function ensureValidationWorkflowState(product) {
  if (!product.workflow || typeof product.workflow !== "object") {
    product.workflow = {};
  }
  if (!product.workflow.validation || typeof product.workflow.validation !== "object") {
    product.workflow.validation = {
      checkedBlockIds: [],
      coverageTargetPct: VALIDATION_COVERAGE_TARGET_DEFAULT,
      lastAppliedAt: null,
    };
  }
  if (!Array.isArray(product.workflow.validation.checkedBlockIds)) {
    product.workflow.validation.checkedBlockIds = [];
  }
  product.workflow.validation.checkedBlockIds = [...new Set(
    product.workflow.validation.checkedBlockIds
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean),
  )];
  product.workflow.validation.coverageTargetPct = getValidationCoverageTargetPct(product);
  product.workflow.validation.lastAppliedAt = product.workflow.validation.lastAppliedAt
    ? String(product.workflow.validation.lastAppliedAt)
    : null;
  return product.workflow.validation;
}

function buildQuickResidualItems(metrics, prebuiltCategories = null) {
  const categories = prebuiltCategories ?? buildCostCategoryData(metrics);
  const monthlyUnits = Math.max(0, num(metrics.monthlyUnits, 0));
  const totalCostPerUnit = Math.max(0, num(metrics.totalCostPerUnit, 0));
  const rows = [];

  categories.forEach((category) => {
    category.lines.forEach((lineItem) => {
      if (lineItem.isSummary || lineItem.excludeFromCategoryTotal) {
        return;
      }
      if (QUICK_CORE_COST_LINE_IDS.has(lineItem.id)) {
        return;
      }
      const perUnit = num(lineItem.valueRaw, 0);
      if (perUnit <= 0.0001) {
        return;
      }
      const monthly = perUnit * monthlyUnits;
      const sharePct = totalCostPerUnit > 0 ? (perUnit / totalCostPerUnit) * 100 : 0;
      rows.push({
        id: lineItem.id ?? `${category.key}:${lineItem.label}`,
        label: lineItem.label,
        perUnit,
        monthly,
        sharePct,
        explain: lineItem.explain ?? "",
        formula: lineItem.formula ?? "",
        source: lineItem.source ?? "",
        robustness: lineItem.robustness ?? "Mittel",
        driverPaths: Array.isArray(lineItem.driverPaths) ? lineItem.driverPaths : [],
      });
    });
  });

  return rows
    .sort((a, b) => num(b.perUnit, 0) - num(a.perUnit, 0))
    .slice(0, 3);
}

function buildCostBlockModalPayload(metrics, blockKey, contextStage = "quick") {
  const modeLabel = metrics.shipping.modeLabel ?? shippingModeLabel(metrics.shipping.modeKey);
  const listingPackageKey = metrics.resolved?.listingPackageKey ?? "ai";
  const listingPackagePrefix = `settings.lifecycle.listingPackages.${listingPackageKey}`;
  const baseValue = (perUnit) => `${formatCurrency(perUnit)} / Unit`;

  if (blockKey === "exw") {
    return {
      title: "EXW / Einkauf (EUR/Unit)",
      value: baseValue(metrics.quickBlockExwPerUnit),
      explain: "Einkaufskosten pro Unit auf EXW-Basis, umgerechnet von USD in EUR.",
      formula: "EXW/Unit = EXW(USD) × USD->EUR FX.",
      source: "User-Input + FX-Kurs.",
      robustness: "Mittel.",
      driverPaths: ["basic.exwUnit", "settings.tax.fallbackUsdToEur"],
    };
  }

  if (blockKey === "shipping_to_3pl") {
    return {
      title: "Shipping zu 3PL (EUR/Unit)",
      value: baseValue(metrics.quickBlockShippingTo3plPerUnit),
      explain: "Importkostenblock von CN bis 3PL inkl. Shipping, Customs und orderbezogenen Import-Fixkosten.",
      formula: "Shipping->3PL/Unit = Shipping D2D/Unit + Customs/Unit + Order-Fix/Unit.",
      source: `Shipping 12M (${modeLabel}) + Zollsatz + PO-Parameter.`,
      robustness: "Mittel.",
      detailPreset: "shipping_dashboard",
      driverPaths: [
        "derived.quick.blockShippingTo3plPerUnit",
        "derived.shipping.shipmentCbm",
        "derived.shipping.shipmentWeightKg",
        "derived.shipping.chargeableCbm",
        "derived.shipping.unitsByWeightCap",
        "derived.shipping.unitsByDimensionCap",
        "derived.shipping.unitsPerCartonCapCandidate",
        "derived.shipping.unitsPerCartonDownshift",
        "derived.shipping.unitsPerCartonSelectionReason",
        "derived.shipping.unitsPerCartonAuto",
        "derived.shipping.physicalCartonsCount",
        "derived.shipping.cartonizationSource",
        "basic.unitsPerOrder",
        "basic.transportMode",
        "basic.netWeightG",
        "basic.packLengthCm",
        "basic.packWidthCm",
        "basic.packHeightCm",
        "assumptions.import.customsDutyRate",
        ...cartonizationProductPaths(),
        ...cartonizationSettingsPaths(),
        ...shippingModeDriverPaths(metrics.shipping.modeKey),
      ],
    };
  }

  if (blockKey === "threepl") {
    return {
      title: "3PL (EUR/Unit)",
      value: baseValue(metrics.quickBlockThreePlPerUnit),
      explain: "3PL Inbound, Lagerung, Outbound-Service und Carrier im Amazon-Zulauf.",
      formula: "3PL/Unit = inbound + storage + outbound service + carrier.",
      source: "3PL Defaults/Overrides.",
      robustness: "Mittel.",
      driverPaths: [
        "derived.threepl.inboundTotal",
        "derived.threepl.storageTotal",
        "derived.threepl.outboundServiceTotal",
        "derived.threepl.carrierTotal",
        "derived.shipping.physicalCartonsCount",
        "derived.shipping.unitsPerOrder",
        "assumptions.extraCosts.receivingMode",
        "assumptions.extraCosts.receivingPerCartonSortedEur",
        "assumptions.extraCosts.receivingPerCartonMixedEur",
        "assumptions.extraCosts.storagePerPalletPerMonthEur",
        "assumptions.extraCosts.unitsPerPallet",
        "assumptions.extraCosts.avg3PlStorageMonths",
        "assumptions.extraCosts.outboundBasePerCartonEur",
        "assumptions.extraCosts.pickPackPerCartonEur",
        "assumptions.extraCosts.fbaProcessingPerCartonEur",
        "assumptions.extraCosts.carrierCostPerCartonEur",
        "settings.threePl.receivingPerCartonSortedEur",
        "settings.threePl.storagePerPalletPerMonthEur",
        "settings.threePl.outboundBasePerCartonEur",
        "settings.threePl.carrierCostPerCartonEur",
      ],
    };
  }

  if (blockKey === "amazon_core") {
    return {
      title: "Amazon Core (Referral + TACoS + FBA) (EUR/Unit)",
      value: baseValue(metrics.quickBlockAmazonCorePerUnit),
      explain: "Amazon-Kernkosten in der Wertschöpfung: Referral, Ads/TACoS und FBA Fulfillment.",
      formula: "Amazon Core/Unit = referral + ads + fba.",
      source: "Amazon-Gebührenlogik + Kategorie-/Launch-Parameter + DE FBA Ratecard.",
      robustness: "Mittel bis hoch.",
      detailPreset: "amazon_core",
      driverPaths: [
        "derived.quick.blockAmazonCorePerUnit",
        "assumptions.amazon.referralRate",
        "assumptions.ads.tacosRate",
        "assumptions.ads.launchMultiplier",
        "assumptions.ads.launchMonths",
        "assumptions.amazon.useManualFbaFee",
        "assumptions.amazon.manualFbaFee",
        "derived.amazon.fbaFeeSource",
        "derived.amazon.fbaTierLabel",
        "derived.amazon.fbaShippingWeightG",
        "derived.amazon.fbaRateCardVersion",
        "settings.amazonFba.de.rateCardVersion",
        "settings.amazonFba.de.sourceUrl",
        "settings.amazonFba.de.volumetricDivisor",
        "basic.priceGross",
        "basic.marketplace",
        "basic.category",
        "basic.netWeightG",
        "basic.packLengthCm",
        "basic.packWidthCm",
        "basic.packHeightCm",
      ],
    };
  }

  if (blockKey === "launch_core") {
    return {
      title: "Launch Core (EUR/Unit)",
      value: baseValue(metrics.quickBlockLaunchCorePerUnit),
      explain: "Launch-Grundblock aus Listing, Launch-Budget und operativen Launch-Setups.",
      formula: "Launch Core/Unit = listing_unit + launch_budget_unit + launch_ops_unit.",
      source: "Listing-/Launch-Settings + Produktinput.",
      robustness: "Mittel.",
      driverPaths: [
        "derived.quick.blockLaunchCorePerUnit",
        "basic.launchBudgetTotal",
        "basic.listingPackage",
        "basic.horizonMonths",
        "basic.launchCompetition",
        "assumptions.launchSplit.enabled",
        "assumptions.launchSplit.listing",
        "assumptions.launchSplit.vine",
        "assumptions.launchSplit.coupons",
        "assumptions.launchSplit.other",
        "assumptions.extraCosts.samplesPerProductEur",
        "assumptions.extraCosts.toolingPerProductEur",
        "assumptions.extraCosts.certificatesPerProductEur",
        "assumptions.extraCosts.inspectionPerProductEur",
        "settings.lifecycle.defaultMonths",
        `${listingPackagePrefix}.listingCreationEur`,
        `${listingPackagePrefix}.imagesInfographicsEur`,
        `${listingPackagePrefix}.aPlusContentEur`,
      ],
    };
  }

  return null;
}

function renderQuickCostWorkflow(metrics) {
  const setQuickBlock = (perUnitNode, perUnitValue) => {
    if (perUnitNode) {
      perUnitNode.textContent = `${formatCurrency(perUnitValue)} / Unit`;
    }
  };
  const setQuickSubline = (blockKey) => {
    const node = document.querySelector(`[data-quick-subline="${blockKey}"]`);
    if (!(node instanceof HTMLElement)) {
      return;
    }
    node.textContent = QUICK_BLOCK_SUMMARY[blockKey] ?? "";
  };

  setQuickBlock(dom.quickBlockExwPerUnit, metrics.quickBlockExwPerUnit);
  setQuickBlock(dom.quickBlockShippingTo3plPerUnit, metrics.quickBlockShippingTo3plPerUnit);
  setQuickBlock(dom.quickBlockThreePlPerUnit, metrics.quickBlockThreePlPerUnit);
  setQuickBlock(dom.quickBlockAmazonCorePerUnit, metrics.quickBlockAmazonCorePerUnit);
  setQuickBlock(dom.quickBlockLaunchCorePerUnit, metrics.quickBlockLaunchCorePerUnit);
  setQuickSubline("exw");
  setQuickSubline("shipping_to_3pl");
  setQuickSubline("threepl");
  setQuickSubline("amazon_core");
  setQuickSubline("launch_core");

  setTooltip(document.querySelector('[data-quick-block="exw"]'), "quick.exw");
  setTooltip(document.querySelector('[data-quick-block="shipping_to_3pl"]'), "quick.shipping_to_3pl");
  setTooltip(document.querySelector('[data-quick-block="threepl"]'), "quick.threepl");
  setTooltip(document.querySelector('[data-quick-block="amazon_core"]'), "quick.amazon_core");
  setTooltip(document.querySelector('[data-quick-block="launch_core"]'), "quick.launch_core");

  if (dom.quickCoreCoveragePct) {
    dom.quickCoreCoveragePct.textContent = formatPercent(clamp(metrics.quickCoreCoveragePct, 0, 100));
    setTooltip(dom.quickCoreCoveragePct, "quick.coverage_pct");
  }
  if (dom.quickCoreTotalCost) {
    dom.quickCoreTotalCost.textContent = `Gesamtkosten: ${formatCurrency(metrics.totalCostPerUnit)} / Unit`;
    setTooltip(dom.quickCoreTotalCost, "quick.total_cost_per_unit");
  }
  if (dom.quickCoreCoveredCost) {
    dom.quickCoreCoveredCost.textContent = `Abgedeckt: ${formatCurrency(metrics.quickCoreCostPerUnit)} / Unit`;
    setTooltip(dom.quickCoreCoveredCost, "quick.covered_cost_per_unit");
  }
  if (dom.quickCoreResidualCost) {
    dom.quickCoreResidualCost.textContent = `Rest: ${formatCurrency(metrics.quickCoreResidualPerUnit)} / Unit`;
    setTooltip(dom.quickCoreResidualCost, "quick.residual_cost_per_unit");
  }

  const coverageMeta = quickCoverageMeta(metrics.quickCoreCoveragePct);
  if (dom.quickCoverageStatus) {
    dom.quickCoverageStatus.textContent = coverageMeta.text;
  }
  if (dom.quickCoverageCard) {
    dom.quickCoverageCard.classList.remove("coverage-ok", "coverage-warn", "coverage-critical");
    dom.quickCoverageCard.classList.add(`coverage-${coverageMeta.tone}`);
  }

  if (dom.quickResidualTopList) {
    dom.quickResidualTopList.innerHTML = "";
    const topResiduals = Array.isArray(metrics.quickResidualTopItems) ? metrics.quickResidualTopItems : [];
    if (topResiduals.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Keine wesentlichen Restkosten außerhalb der fünf QuickCheck-Hauptblöcke.";
      dom.quickResidualTopList.appendChild(li);
    } else {
      topResiduals.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML =
          `<div><span>${item.label}</span><small>${formatPercent(item.sharePct)} Anteil</small></div>` +
          `<strong>${formatCurrency(item.perUnit)} / Unit</strong>`;
        li.title = item.explain || "Restkostenposition außerhalb des QuickCheck-Core-Workflows.";
        if (Array.isArray(item.driverPaths) && item.driverPaths.length > 0) {
          li.classList.add("quick-residual-clickable");
          li.title = `${item.explain || "Restkostenposition außerhalb des QuickCheck-Core-Workflows."}\nKlick: Details und Treiber öffnen.`;
          li.addEventListener("click", () => {
            openDriverModal({
              title: `${item.label} (Restkosten)`,
              value: `${formatCurrency(item.perUnit)} / Unit`,
              explain: item.explain || "Kostenposition außerhalb des QuickCheck-Core-Workflows.",
              formula: item.formula || "",
              source: item.source || "",
              robustness: item.robustness || "Mittel",
              driverPaths: item.driverPaths,
            });
          });
        }
        dom.quickResidualTopList.appendChild(li);
      });
    }
  }
}

function validationCoverageMeta(coveragePct, targetPct) {
  if (coveragePct >= targetPct) {
    return {
      tone: "ok",
      text: "Validation erfüllt: Zielabdeckung erreicht.",
    };
  }
  if (coveragePct >= targetPct - 10) {
    return {
      tone: "warn",
      text: "Fast am Ziel: Prüfe empfohlene Restkostenblöcke.",
    };
  }
  return {
    tone: "critical",
    text: "Validation offen: Zu wenig Kostenabdeckung, bitte weitere Restkosten validieren.",
  };
}

function updateValidationCheckedBlock(product, blockId, checked) {
  if (!product || !blockId) {
    return;
  }
  const workflowValidation = ensureValidationWorkflowState(product);
  const next = new Set(workflowValidation.checkedBlockIds);
  if (checked) {
    next.add(blockId);
  } else {
    next.delete(blockId);
  }
  workflowValidation.checkedBlockIds = [...next];
  saveProducts();
  renderComputedViews();
}

function renderValidationWorkflow(metrics, product) {
  const isValidation = getProductStage(product) === "validation";
  if (dom.validationStagePanel) {
    dom.validationStagePanel.classList.toggle("hidden", !isValidation);
  }
  if (!isValidation) {
    if (dom.validationBlockGrid) {
      dom.validationBlockGrid.innerHTML = "";
    }
    return;
  }
  if (!dom.validationBlockGrid) {
    return;
  }
  const coveragePct = clamp(num(metrics.validationCoveragePct, 0), 0, 200);
  const targetPct = clamp(num(metrics.validationCoverageTargetPct, VALIDATION_COVERAGE_TARGET_DEFAULT), 80, 99);
  const coveredPerUnit = num(metrics.validationCoveredPerUnit, 0);
  const residualPerUnit = Math.max(0, num(metrics.validationResidualPerUnit, 0));
  const blockItems = Array.isArray(metrics.validationBlockItems) ? metrics.validationBlockItems : [];
  const openTopResidualItems = Array.isArray(metrics.validationOpenTopResidualItems)
    ? metrics.validationOpenTopResidualItems
    : [];
  const meta = validationCoverageMeta(coveragePct, targetPct);

  if (dom.validationCoveragePct) {
    dom.validationCoveragePct.textContent = formatPercent(coveragePct);
    setTooltip(dom.validationCoveragePct, "validation.coverage_pct");
  }
  if (dom.validationCoverageTarget) {
    dom.validationCoverageTarget.textContent = `Ziel: ${formatPercent(targetPct)} Abdeckung`;
    setTooltip(dom.validationCoverageTarget, "validation.target_pct");
  }
  if (dom.validationCoveredCost) {
    dom.validationCoveredCost.textContent = `Abgedeckt: ${formatCurrency(coveredPerUnit)} / Unit`;
    setTooltip(dom.validationCoveredCost, "validation.covered_cost_per_unit");
  }
  if (dom.validationResidualCost) {
    dom.validationResidualCost.textContent = `Offen: ${formatCurrency(residualPerUnit)} / Unit`;
    setTooltip(dom.validationResidualCost, "validation.residual_cost_per_unit");
  }
  if (dom.validationCoverageStatus) {
    dom.validationCoverageStatus.textContent = meta.text;
  }
  if (dom.validationCoverageCard) {
    dom.validationCoverageCard.classList.remove("coverage-ok", "coverage-warn", "coverage-critical");
    dom.validationCoverageCard.classList.add(`coverage-${meta.tone}`);
  }
  if (dom.validationOpenTopList) {
    dom.validationOpenTopList.innerHTML = "";
    if (openTopResidualItems.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Keine wesentlichen offenen Restkosten mehr.";
      dom.validationOpenTopList.appendChild(li);
    } else {
      openTopResidualItems.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML =
          `<div><span>${item.label}</span><small>${formatPercent(item.sharePct)} Anteil</small></div>` +
          `<strong>${formatCurrency(item.perUnit)} / Unit</strong>`;
        li.title = item.explain || "Offene Restkostenposition außerhalb der Core-Blöcke.";
        dom.validationOpenTopList.appendChild(li);
      });
    }
  }

  dom.validationBlockGrid.innerHTML = "";
  blockItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "validation-block-card";
    if (item.isCore) {
      card.classList.add("core");
    }
    if (item.isSuggested) {
      card.classList.add("suggested");
    }
    if (item.isChecked) {
      card.classList.add("checked");
    }

    const head = document.createElement("div");
    head.className = "validation-block-head";
    const title = document.createElement("strong");
    title.textContent = item.label;
    head.appendChild(title);
    const badgeWrap = document.createElement("div");
    badgeWrap.className = "validation-block-badges";
    const makeBadge = (text, tone) => {
      const badge = document.createElement("span");
      badge.className = `validation-chip ${tone}`;
      badge.textContent = text;
      return badge;
    };
    if (item.isCore) {
      badgeWrap.appendChild(makeBadge("Core", "core"));
      badgeWrap.appendChild(makeBadge("Validiert", "checked"));
    } else {
      badgeWrap.appendChild(makeBadge(item.isChecked ? "Validiert" : "Offen", item.isChecked ? "checked" : "open"));
      if (item.isSuggested) {
        badgeWrap.appendChild(makeBadge("Empfohlen für 95%", "suggested"));
      }
    }
    head.appendChild(badgeWrap);
    card.appendChild(head);

    const values = document.createElement("p");
    values.className = "validation-block-values";
    values.textContent = `${formatCurrency(item.perUnit)} / Unit · Anteil ${formatPercent(item.sharePct)}`;
    values.title = item.explain || `${item.label}: Kostenanteil an den Gesamtkosten pro Unit.`;
    card.appendChild(values);

    const actions = document.createElement("div");
    actions.className = "validation-block-actions";
    const detailBtn = document.createElement("button");
    detailBtn.type = "button";
    detailBtn.className = "btn btn-ghost";
    detailBtn.textContent = "Details";
    detailBtn.addEventListener("click", () => {
      if (item.detailType === "core" && item.blockKey) {
        openCostBlockModal(item.blockKey, "validation");
        return;
      }
      openValidationResidualModal(item);
    });
    if (item.detailType !== "core" && (!Array.isArray(item.driverPaths) || item.driverPaths.length === 0)) {
      detailBtn.disabled = true;
    }
    actions.appendChild(detailBtn);

    if (!item.isCore) {
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = item.isChecked ? "btn btn-ghost" : "btn btn-primary";
      toggleBtn.textContent = item.isChecked ? "Validierung zurücknehmen" : "Als validiert markieren";
      toggleBtn.addEventListener("click", () => {
        updateValidationCheckedBlock(product, item.id, !item.isChecked);
      });
      actions.appendChild(toggleBtn);
    }

    card.appendChild(actions);
    dom.validationBlockGrid.appendChild(card);
  });
}

function createValidationSandboxDraftFromProduct(product) {
  const draft = {};
  VALIDATION_PLAYGROUND_PATHS.forEach((path) => {
    draft[path] = getByPath(product, path);
  });
  return draft;
}

function normalizeValidationDraftValue(path, rawValue) {
  if (STRING_PATHS.has(path)) {
    return String(rawValue ?? "");
  }
  if (path === "basic.horizonMonths") {
    return Math.max(1, roundInt(rawValue, 1));
  }
  return Math.max(0, num(rawValue, 0));
}

function syncValidationDraftControls(draft) {
  const controls = document.querySelectorAll("[data-validation-draft-path]");
  controls.forEach((control) => {
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) {
      return;
    }
    const path = control.dataset.validationDraftPath;
    if (!path) {
      return;
    }
    const value = draft[path];
    if (control instanceof HTMLInputElement) {
      control.value = value ?? "";
    } else {
      control.value = String(value ?? "");
    }
  });
}

function buildSandboxProduct(product, draft) {
  const clone = deepClone(product);
  Object.entries(draft).forEach(([path, value]) => {
    setByPath(clone, path, value);
  });
  return clone;
}

function isValidationDraftDifferentFromProduct(product, draft) {
  return VALIDATION_PLAYGROUND_PATHS.some((path) => {
    const original = getByPath(product, path);
    const next = draft[path];
    if (STRING_PATHS.has(path)) {
      return String(original ?? "") !== String(next ?? "");
    }
    return Math.abs(num(original, 0) - num(next, 0)) > 0.0001;
  });
}

function renderValidationSandboxCompare(baselineMetrics, sandboxMetrics) {
  if (!dom.validationCompareGrid) {
    return;
  }
  dom.validationCompareGrid.innerHTML = "";
  const rows = [
    {
      label: "Sellerboard-Marge",
      base: baselineMetrics.sellerboardMarginPct,
      next: sandboxMetrics.sellerboardMarginPct,
      format: "percent",
      suffix: "",
      deltaPositiveIsGood: true,
    },
    {
      label: "Deckungsbeitrag pro Stück",
      base: baselineMetrics.db1Unit,
      next: sandboxMetrics.db1Unit,
      format: "currency",
      suffix: "/ Unit",
      deltaPositiveIsGood: true,
    },
    {
      label: "Gesamtkosten",
      base: baselineMetrics.totalCostPerUnit,
      next: sandboxMetrics.totalCostPerUnit,
      format: "currency",
      suffix: "/ Unit",
      deltaPositiveIsGood: false,
    },
    {
      label: "Shipping D2D",
      base: baselineMetrics.shippingUnit,
      next: sandboxMetrics.shippingUnit,
      format: "currency",
      suffix: "/ Unit",
      deltaPositiveIsGood: false,
    },
    {
      label: "Amazon Core",
      base: baselineMetrics.quickBlockAmazonCorePerUnit,
      next: sandboxMetrics.quickBlockAmazonCorePerUnit,
      format: "currency",
      suffix: "/ Unit",
      deltaPositiveIsGood: false,
    },
    {
      label: "Gewinn netto",
      base: baselineMetrics.profitMonthly,
      next: sandboxMetrics.profitMonthly,
      format: "currency",
      suffix: "/ Monat",
      deltaPositiveIsGood: true,
    },
  ];
  rows.forEach((row) => {
    const card = document.createElement("article");
    card.className = "validation-compare-card";
    const delta = num(row.next, 0) - num(row.base, 0);
    const deltaPositiveIsGood = row.deltaPositiveIsGood !== false;
    const tone = Math.abs(delta) < 0.0001
      ? "neutral"
      : (deltaPositiveIsGood ? (delta > 0 ? "up-good" : "down-bad") : (delta < 0 ? "up-good" : "down-bad"));
    card.classList.add(tone);

    const formatValue = (value) => {
      if (row.format === "percent") {
        return `${formatPercent(value)}${row.suffix}`;
      }
      return `${formatCurrency(value)} ${row.suffix}`.trim();
    };

    card.innerHTML =
      `<span>${row.label}</span>` +
      `<strong>${formatValue(row.base)} -> ${formatValue(row.next)}</strong>` +
      `<small>Delta: ${row.format === "percent" ? formatPercent(delta) : `${formatCurrency(delta)}${row.suffix ? ` ${row.suffix}` : ""}`}</small>`;
    dom.validationCompareGrid.appendChild(card);
  });
}

function renderValidationPlayground(product, baselineMetrics) {
  if (!dom.validationPlaygroundPanel) {
    return;
  }
  const isValidation = getProductStage(product) === "validation";
  dom.validationPlaygroundPanel.classList.toggle("hidden", !isValidation);
  if (!isValidation) {
    return;
  }

  const productChanged = state.ui.validationSandboxProductId !== product.id;
  if (productChanged || !state.ui.validationSandboxDraft) {
    state.ui.validationSandboxDraft = createValidationSandboxDraftFromProduct(product);
    state.ui.validationSandboxProductId = product.id;
  }
  const draft = state.ui.validationSandboxDraft;
  syncValidationDraftControls(draft);

  const sandboxProduct = buildSandboxProduct(product, draft);
  const sandboxMetrics = calculateProduct(sandboxProduct);
  const sandboxActive = isValidationDraftDifferentFromProduct(product, draft);

  state.ui.validationSandboxActive = sandboxActive;
  state.ui.validationBaselineMetrics = baselineMetrics;
  state.ui.validationSandboxMetrics = sandboxMetrics;

  if (dom.validationApplyBtn) {
    dom.validationApplyBtn.disabled = !sandboxActive;
  }
  if (dom.validationDiscardBtn) {
    dom.validationDiscardBtn.disabled = !sandboxActive;
  }
  if (dom.validationResetBtn) {
    dom.validationResetBtn.disabled = !sandboxActive;
  }

  renderValidationSandboxCompare(baselineMetrics, sandboxMetrics);
}

function openCostBlockModal(blockKey, contextStage = "quick") {
  const selected = getSelectedProduct();
  if (!selected || !blockKey) {
    return;
  }
  const metrics = calculateProduct(selected);
  const payload = buildCostBlockModalPayload(metrics, blockKey, contextStage);
  if (!payload) {
    return;
  }
  openDriverModal(payload);
}

function openValidationResidualModal(item) {
  if (!item || !Array.isArray(item.driverPaths) || item.driverPaths.length === 0) {
    return;
  }
  openDriverModal({
    title: `${item.label} (Validation-Restkosten)`,
    value: `${formatCurrency(item.perUnit)} / Unit`,
    explain: item.explain || "Kostenposition außerhalb des QuickCheck-Core-Workflows.",
    formula: item.formula || "",
    source: item.source || "",
    robustness: item.robustness || "Mittel",
    driverPaths: item.driverPaths,
  });
}

function renderShippingModuleInline(metrics) {
  if (!dom.shippingModuleSection || !dom.shippingModuleCanvasHost || !dom.shippingModuleMeta || !dom.shippingModuleStatus) {
    return;
  }

  dom.shippingModuleSection.classList.remove("hidden");
  const preview = metrics?.shipping?.layoutPreview ?? null;
  if (!preview?.available) {
    ensureShipping3dCleanup("inline");
    dom.shippingModuleCanvasHost.innerHTML = "";
    dom.shippingModuleCanvasHost.appendChild(
      createShippingLayoutFallbackElement(metrics, "3D-Layoutdaten fehlen. Bitte Produkt- und Umkartonmaße prüfen."),
    );
    dom.shippingModuleMeta.textContent = "Orientierung: - · Raster: - · Platzierte Stücke: -";
    dom.shippingModuleStatus.textContent = "2D-Fallback aktiv.";
    return;
  }

  const orientationText = Array.isArray(preview.orientation) && preview.orientation.length === 3
    ? `${formatNumber(preview.orientation[0])} × ${formatNumber(preview.orientation[1])} × ${formatNumber(preview.orientation[2])} cm`
    : "-";
  const cartonText = `${formatNumber(metrics.shipping.estimatedCartonLengthCm)} × ${formatNumber(metrics.shipping.estimatedCartonWidthCm)} × ${formatNumber(metrics.shipping.estimatedCartonHeightCm)} cm`;
  dom.shippingModuleMeta.textContent =
    `Umkarton: ${cartonText} · Produkt: ${orientationText} · Raster: ${formatNumber(preview.nx)} × ${formatNumber(preview.ny)} × ${formatNumber(preview.nz)} · Stück: ${formatNumber(preview.placedUnits)}/${formatNumber(metrics.shipping.unitsPerCartonAuto)}`;

  if (!(window.Packaging3D && typeof window.Packaging3D.buildViewModel === "function" && typeof window.Packaging3D.mount === "function")) {
    ensureShipping3dCleanup("inline");
    dom.shippingModuleCanvasHost.innerHTML = "";
    dom.shippingModuleCanvasHost.appendChild(
      createShippingLayoutFallbackElement(
        metrics,
        `Lokales 3D-Modul nicht verfügbar (${SHIPPING_3D_THREE_LOCAL}, ${SHIPPING_3D_ORBIT_LOCAL}).`,
      ),
    );
    dom.shippingModuleStatus.textContent = "2D-Fallback aktiv.";
    return;
  }

  const viewModel = window.Packaging3D.buildViewModel({
    unitDimsCm: Array.isArray(preview.orientation) && preview.orientation.length === 3
      ? preview.orientation
      : [
        Math.max(0.1, num(metrics.shipping.estimatedCartonLengthCm, 1)),
        Math.max(0.1, num(metrics.shipping.estimatedCartonWidthCm, 1)),
        Math.max(0.1, num(metrics.shipping.estimatedCartonHeightCm, 1)),
      ],
    cartonDimsCm: [
      Math.max(0.1, num(metrics.shipping.estimatedCartonLengthCm, 1)),
      Math.max(0.1, num(metrics.shipping.estimatedCartonWidthCm, 1)),
      Math.max(0.1, num(metrics.shipping.estimatedCartonHeightCm, 1)),
    ],
    targetUnits: Math.max(1, roundInt(metrics.shipping.unitsPerCartonAuto, 1)),
    outerBufferCm: Math.max(0, num(state.settings?.cartonRules?.outerBufferCm, 0)),
    allowSixOrientations: true,
    mode: "maximal",
    renderLimit: SHIPPING_3D_MAX_RENDER_UNITS,
  });

  if (!viewModel?.layout?.available) {
    ensureShipping3dCleanup("inline");
    dom.shippingModuleCanvasHost.innerHTML = "";
    dom.shippingModuleCanvasHost.appendChild(
      createShippingLayoutFallbackElement(metrics, "3D-Layout konnte nicht berechnet werden. 2D-Fallback aktiv."),
    );
    dom.shippingModuleStatus.textContent = "2D-Fallback aktiv.";
    return;
  }

  try {
    ensureShipping3dCleanup("inline");
    const result = window.Packaging3D.mount(dom.shippingModuleCanvasHost, viewModel, { scopeKey: "inline" });
    if (result && typeof result.cleanup === "function") {
      state.ui.shipping3dInlineCleanup = result.cleanup;
    } else {
      state.ui.shipping3dInlineCleanup = () => ensureShipping3dCleanup("inline");
    }
    const renderedUnits = Math.max(0, roundInt(result?.renderedUnits, 0));
    const totalUnits = Math.max(0, roundInt(result?.totalUnits, viewModel.layout.placedUnits));
    if (totalUnits > renderedUnits) {
      dom.shippingModuleStatus.textContent =
        `Visualisiert: ${formatNumber(renderedUnits)} von ${formatNumber(totalUnits)} Stück (Limit ${formatNumber(SHIPPING_3D_MAX_RENDER_UNITS)}).`;
    } else {
      dom.shippingModuleStatus.textContent = "3D-Packbild aktiv.";
    }
  } catch (error) {
    console.error("Packaging3D inline render failed", error);
    ensureShipping3dCleanup("inline");
    dom.shippingModuleCanvasHost.innerHTML = "";
    dom.shippingModuleCanvasHost.appendChild(
      createShippingLayoutFallbackElement(metrics, "3D-Rendering nicht möglich. 2D-Fallback aktiv."),
    );
    dom.shippingModuleStatus.textContent = "2D-Fallback aktiv.";
  }
}

function renderShippingDetails(metrics) {
  const hasInlineShippingDom =
    Boolean(dom.basicShippingUnit) ||
    Boolean(dom.shippingDetailList) ||
    Boolean(dom.shippingMethodText) ||
    Boolean(dom.shippingTotalPo);
  if (!hasInlineShippingDom) {
    return;
  }

  const modeLabel = metrics.shipping.modeLabel ?? shippingModeLabel(metrics.shipping.transportMode);
  const quickLabel = document.querySelector("#shippingQuickCard p");
  if (quickLabel) {
    quickLabel.textContent = `Shipping door-to-door gesamt (${modeLabel}, EUR / Unit)`;
  }
  if (dom.basicShippingUnit) {
    dom.basicShippingUnit.textContent = formatCurrency(metrics.shippingUnit);
  }
  if (dom.basicShippingMeta) {
    dom.basicShippingMeta.textContent =
      `${modeLabel} · Sendungsvolumen: ${formatNumber(metrics.shipping.shipmentCbm)} CBM · Abrechnungsvolumen (W/M): ${formatNumber(metrics.shipping.chargeableCbm)} CBM · Kartons physisch: ${formatNumber(metrics.shipping.physicalCartonsCount)} · PO: ${formatNumber(metrics.shipping.unitsPerOrder)} Units`;
  }
  if (dom.shippingTotalPo) {
    dom.shippingTotalPo.textContent = formatCurrency(metrics.shipping.shippingTotal);
  }
  if (dom.shippingTotalUnit) {
    dom.shippingTotalUnit.textContent = `${formatCurrency(metrics.shipping.shippingPerUnit)} / Unit`;
  }
  if (dom.shippingUnitsByWeightCap) {
    dom.shippingUnitsByWeightCap.textContent = formatNumber(metrics.shipping.unitsByWeightCap);
  }
  if (dom.shippingUnitsByDimensionCap) {
    dom.shippingUnitsByDimensionCap.textContent = formatNumber(metrics.shipping.unitsByDimensionCap);
  }
  if (dom.shippingShipmentCbm) {
    dom.shippingShipmentCbm.textContent = `${formatNumber(metrics.shipping.shipmentCbm)} CBM`;
  }
  if (dom.shippingCartonUnits) {
    const modeText = metrics.shipping.cartonizationSource === "manual_override" ? "manuell" : "auto";
    dom.shippingCartonUnits.textContent = `${formatNumber(metrics.shipping.unitsPerCartonAuto)} (${modeText})`;
  }
  if (dom.shippingPhysicalCartons) {
    dom.shippingPhysicalCartons.textContent = formatNumber(metrics.shipping.physicalCartonsCount);
  }
  if (dom.shippingShipmentWeight) {
    dom.shippingShipmentWeight.textContent = `${formatNumber(metrics.shipping.shipmentWeightKg)} kg`;
  }
  if (dom.shippingChargeableCbm) {
    dom.shippingChargeableCbm.textContent = `${formatNumber(metrics.shipping.chargeableCbm)} CBM`;
  }
  if (dom.shippingEquivalentFillPct) {
    dom.shippingEquivalentFillPct.textContent = formatPercent(metrics.shipping.equivalentFillPct);
  }
  if (dom.shippingEquivalentReferenceCbm) {
    dom.shippingEquivalentReferenceCbm.textContent = `${formatNumber(metrics.shipping.equivalentReferenceCbm)} CBM`;
  }
  if (dom.shippingEquivalentReferenceWeightKg) {
    dom.shippingEquivalentReferenceWeightKg.textContent = `${formatNumber(metrics.shipping.equivalentReferenceWeightKg)} kg`;
  }
  if (dom.shippingEquivalentCartons) {
    dom.shippingEquivalentCartons.textContent = formatNumber(metrics.shipping.equivalentCartonsCount);
  }
  if (dom.shippingCartonDims) {
    dom.shippingCartonDims.textContent =
      `${formatNumber(metrics.shipping.estimatedCartonLengthCm)} × ${formatNumber(metrics.shipping.estimatedCartonWidthCm)} × ${formatNumber(metrics.shipping.estimatedCartonHeightCm)} cm`;
  }
  if (dom.shippingCartonWeight) {
    dom.shippingCartonWeight.textContent = `${formatNumber(metrics.shipping.estimatedCartonGrossWeightKg)} kg`;
  }
  if (dom.shippingCartonSource) {
    dom.shippingCartonSource.textContent = metrics.shipping.cartonizationSourceLabel;
  }

  if (dom.shippingMethodText) {
    dom.shippingMethodText.textContent =
      `So berechnen wir Shipping (12-Monats-Ø, Modus ${modeLabel}): Auto-Kartonisierung startet mit min(Gewichtsgrenze, Maßgrenze) innerhalb der maximal zulässigen Kartongrenzen. Optional kannst du reale Packing-List-Werte manuell setzen. Daraus entstehen physische Kartons, Sendungsvolumen (CBM) und Abrechnungsvolumen (W/M-CBM). Bei Rail werden Vorlauf und Nachlauf variabel über Sendungsvolumen gerechnet, nicht über Kartonanzahl.`;
  }

  if (dom.shippingOversizeNote) {
    if (metrics.shipping.oversizeFlag) {
      dom.shippingOversizeNote.textContent = metrics.shipping.oversizeNote;
      dom.shippingOversizeNote.classList.remove("hidden");
    } else {
      dom.shippingOversizeNote.textContent = "";
      dom.shippingOversizeNote.classList.add("hidden");
    }
  }

  if (dom.shippingDetailList) {
    dom.shippingDetailList.innerHTML = "";
    metrics.shipping.breakdown.forEach((line) => {
      const li = document.createElement("li");
      li.classList.add("shipping-breakdown-row");
      li.innerHTML = `<div><span>${line.label}</span><small>${line.formula ?? ""}</small></div><strong>${formatCurrency(line.total)} · ${formatCurrency(line.perUnit)}/Unit</strong>`;
      li.title = line.source ? `Herkunft: ${line.source}` : line.label;
      dom.shippingDetailList.appendChild(li);
    });
  }
}

function buildChainStageDataFromCategories(categories, stage, topN, monthlyUnits = 0) {
  let lines = [];
  const isQuickStage = stage === "quick";
  const quickShippingAggregateId = "chain.shipping_to_3pl.total.quick";

  categories.forEach((category) => {
    category.lines.forEach((lineItem) => {
      if (lineItem.isSummary || lineItem.excludeFromCategoryTotal) {
        return;
      }
      lines.push({
        ...lineItem,
        categoryKey: category.key,
        categoryTitle: category.title,
        chainStageKey: lineItem.chainStageKey || chainStageKeyForLine(category.key, lineItem.label),
      });
    });
  });

  if (isQuickStage) {
    const shippingLines = lines.filter((lineItem) => lineItem.chainStageKey === "shipping_to_3pl");
    if (shippingLines.length > 0) {
      const shippingValueRaw = shippingLines.reduce((sum, lineItem) => sum + num(lineItem.valueRaw, 0), 0);
      const shippingImpactMonthly = shippingLines.reduce((sum, lineItem) => sum + Math.max(0, num(lineItem.impactMonthly, 0)), 0);
      const shippingDriverPaths = [...new Set(shippingLines.flatMap((lineItem) => lineItem.driverPaths ?? []))];

      const shippingAggregateLine = {
        id: quickShippingAggregateId,
        label: "Shipping CN -> 3PL gesamt (EUR/Unit)",
        valueRaw: shippingValueRaw,
        value: formatCurrency(shippingValueRaw),
        impactMonthly: shippingImpactMonthly,
        explain:
          "Aggregierter Shipping-Block von China bis 3PL. Im QuickCheck ohne Detailaufsplittung nach Vorlauf/Hauptlauf/Nachlauf.",
        formula:
          "Shipping gesamt/Unit = Summe aller Shipping-&-Import-Komponenten je Unit (Vorlauf, Hauptlauf variabel/fix, Nachlauf, Zollabfertigung, Versicherung, Nachbelastung, Zoll, Order-Fixkosten).",
        source: "Shipping-12M-Defaults + Produktinput + Import-/Order-Defaults.",
        robustness: "Mittel.",
        reviewEligible: true,
        categoryKey: "shipping_import",
        categoryTitle: "Shipping & Import",
        chainStageKey: "shipping_to_3pl",
        driverPaths: shippingDriverPaths,
      };

      lines = lines
        .filter((lineItem) => lineItem.chainStageKey !== "shipping_to_3pl")
        .concat([shippingAggregateLine]);
    }
  }

  const sortedByImpact = [...lines].sort((a, b) => b.impactMonthly - a.impactMonthly);
  const topLimit = Number.isFinite(topN) ? Math.max(0, roundInt(topN, 0)) : sortedByImpact.length;
  const globallyVisibleIds = new Set();
  if (Number.isFinite(topN)) {
    if (isQuickStage) {
      const shippingAggregate = sortedByImpact.find((lineItem) => lineItem.id === quickShippingAggregateId);
      if (shippingAggregate) {
        globallyVisibleIds.add(quickShippingAggregateId);
        const remaining = Math.max(0, topLimit - 1);
        sortedByImpact
          .filter((lineItem) => lineItem.id !== quickShippingAggregateId)
          .slice(0, remaining)
          .forEach((lineItem) => globallyVisibleIds.add(lineItem.id));
      } else {
        sortedByImpact.slice(0, topLimit).forEach((lineItem) => globallyVisibleIds.add(lineItem.id));
      }
    } else {
      sortedByImpact.slice(0, topLimit).forEach((lineItem) => globallyVisibleIds.add(lineItem.id));
    }
  }

  return CHAIN_STAGE_ORDER.map((stageKey) => {
    const stageLines = lines
      .filter((lineItem) => lineItem.chainStageKey === stageKey)
      .sort((a, b) => b.impactMonthly - a.impactMonthly);
    const expandedKey = `${stage}:${stageKey}`;
    const expanded = isQuickStage && stageKey === "shipping_to_3pl" ? false : Boolean(state.ui.chainExpanded?.[expandedKey]);
    const visibleLines = (!Number.isFinite(topN) || expanded)
      ? stageLines
      : stageLines.filter((lineItem) => globallyVisibleIds.has(lineItem.id));
    const hiddenCount = Math.max(0, stageLines.length - visibleLines.length);
    const totalPerUnit = stageLines.reduce((sum, lineItem) => sum + num(lineItem.valueRaw, 0), 0);
    const totalMonthly = totalPerUnit * Math.max(0, num(monthlyUnits, 0));
    const driverPaths = [...new Set(stageLines.flatMap((lineItem) => lineItem.driverPaths ?? []))];
    return {
      key: stageKey,
      title: CHAIN_STAGE_META[stageKey]?.label ?? stageKey,
      lines: stageLines,
      visibleLines,
      hiddenCount,
      expandedKey,
      expanded,
      totalPerUnit,
      totalMonthly,
      driverPaths,
      explain: CHAIN_STAGE_META[stageKey]?.explain ?? "Summierte Kostenzeilen dieser Stufe.",
      formula: CHAIN_STAGE_META[stageKey]?.formula ?? "Kategorie-Summe der zugeordneten Zeilen.",
      source: CHAIN_STAGE_META[stageKey]?.source ?? "Kostenmodell.",
      robustness: CHAIN_STAGE_META[stageKey]?.robustness ?? "Mittel",
    };
  });
}

function renderLogisticsChain(metrics, stage = "quick", prebuiltCategories = null) {
  if (!dom.chainSupplierChips) {
    return;
  }

  const categories = prebuiltCategories ?? buildCostCategoryData(metrics);
  const topN = getStageTopN(stage);
  const stageRows = buildChainStageDataFromCategories(categories, stage, topN, metrics.monthlyUnits);
  const stageByKey = Object.fromEntries(stageRows.map((row) => [row.key, row]));

  const stageContainerMap = {
    supplier: dom.chainSupplierChips,
    shipping_to_3pl: dom.chainImportChips,
    threepl: dom.chainThreePlChips,
    amazon_inbound: dom.chainInboundChips,
    amazon: dom.chainAmazonChips,
    launch: dom.chainLaunchChips,
  };

  const renderStation = (container, stageRow) => {
    if (!container || !stageRow) {
      return;
    }
    container.innerHTML = "";
    const stationCard = container.closest("article");
    if (stationCard) {
      stationCard.classList.toggle("chain-stage-misc", stageRow.key === "launch");
    }

    const totalNode = document.createElement("button");
    totalNode.type = "button";
    totalNode.className = "chain-station-total clickable";
    totalNode.innerHTML = `<span>Kategorie-Summe</span><strong>${formatCurrency(stageRow.totalPerUnit)} / Unit</strong><small>${formatCurrency(stageRow.totalMonthly)} / Monat</small>`;
    totalNode.title = `${stageRow.explain}\nRechenweg: ${stageRow.formula}\nKlick: Treiber-Maske mit relevanten Inputs öffnen.`;
    totalNode.addEventListener("click", () => {
      openDriverModal({
        title: `Kategorie-Summe ${stageRow.title} (EUR/Unit)`,
        value: `${formatCurrency(stageRow.totalPerUnit)} / Unit · ${formatCurrency(stageRow.totalMonthly)} / Monat`,
        explain: stageRow.explain,
        formula: stageRow.formula,
        source: stageRow.source,
        robustness: stageRow.robustness,
        driverPaths: stageRow.driverPaths,
      });
    });
    container.appendChild(totalNode);

    stageRow.visibleLines.forEach((lineItem) => {
      const rank = stageRow.lines.findIndex((candidate) => candidate.id === lineItem.id) + 1;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chain-chip";
      const impact = classifyImpact(lineItem.impactMonthly, metrics.totalCostMonthly);
      chip.classList.add(`impact-${impact.level}`);
      if (rank > 0 && rank <= 3) {
        chip.classList.add("is-top-impact", `rank-${rank}`);
      }
      const rankBadge = rank > 0 && rank <= 3 ? `<em class="chain-rank-badge">Top ${rank}</em>` : "";
      chip.innerHTML = `
        <span>${rankBadge}${lineItem.label}</span>
        <strong>${formatCurrency(lineItem.valueRaw)}</strong>
        <small>Impact ${formatNumber(impact.sharePct)}%</small>
      `;
      chip.title = `${lineItem.explain}\nRechenweg: ${lineItem.formula}\nImpact: ${impact.label}`;
      chip.addEventListener("click", () => {
        openDriverModal({
          title: lineItem.label,
          value: `${formatCurrency(lineItem.valueRaw)} / Unit · ${formatCurrency(lineItem.impactMonthly)} / Monat`,
          explain: lineItem.explain,
          formula: lineItem.formula,
          source: lineItem.source,
          robustness: lineItem.robustness,
          driverPaths: lineItem.driverPaths,
        });
      });
      container.appendChild(chip);
    });

    if (stageRow.hiddenCount > 0) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "chain-more-btn";
      toggle.textContent = stageRow.expanded ? "Weniger anzeigen" : `Weitere anzeigen (${stageRow.hiddenCount})`;
      toggle.addEventListener("click", () => {
        if (!state.ui.chainExpanded || typeof state.ui.chainExpanded !== "object") {
          state.ui.chainExpanded = {};
        }
        state.ui.chainExpanded[stageRow.expandedKey] = !stageRow.expanded;
        renderComputedViews();
      });
      container.appendChild(toggle);
    }
  };

  CHAIN_STAGE_ORDER.forEach((stageKey) => {
    renderStation(stageContainerMap[stageKey], stageByKey[stageKey]);
  });

  const chainTotalPerUnit = stageRows.reduce((sum, row) => sum + row.totalPerUnit, 0);
  const chainTotalMonthly = stageRows.reduce((sum, row) => sum + row.totalMonthly, 0);
  const categoryTotalPerUnit = categories.reduce((sum, category) => sum + num(category.totalPerUnit, 0), 0);
  const categoryTotalMonthly = categories.reduce((sum, category) => sum + num(category.totalMonthly, 0), 0);
  const deltaPerUnit = chainTotalPerUnit - categoryTotalPerUnit;
  const deltaMonthly = chainTotalMonthly - categoryTotalMonthly;

  if (dom.chainTotalSummary) {
    dom.chainTotalSummary.textContent = `${formatCurrency(chainTotalPerUnit)} / Unit · ${formatCurrency(chainTotalMonthly)} / Monat`;
  }
  if (dom.categoryTotalSummary) {
    dom.categoryTotalSummary.textContent = `${formatCurrency(categoryTotalPerUnit)} / Unit · ${formatCurrency(categoryTotalMonthly)} / Monat`;
  }
  if (dom.costDeltaSummary) {
    dom.costDeltaSummary.textContent = `${formatCurrency(deltaPerUnit)} / Unit · ${formatCurrency(deltaMonthly)} / Monat`;
  }
  if (dom.costDeltaCard) {
    const deltaAbs = Math.abs(deltaPerUnit) + Math.abs(deltaMonthly);
    dom.costDeltaCard.classList.remove("delta-ok", "delta-warn");
    dom.costDeltaCard.classList.add(deltaAbs <= 0.01 ? "delta-ok" : "delta-warn");
  }
}

function renderSelectedOutputs(product, metrics, stage = "quick") {
  setKpi(dom.kpiRevenueGross, metrics.grossRevenueMonthly, "currency");
  setKpi(dom.kpiRevenueNet, metrics.netRevenueMonthly, "currency");
  setKpi(dom.kpiSellerboardMargin, metrics.sellerboardMarginPct, "percent");
  setKpi(dom.kpiNetMargin, metrics.netMarginPct, "percent");
  setKpi(dom.kpiShippingUnit, metrics.shippingUnit, "currency");
  setKpi(dom.kpiLandedUnit, metrics.landedUnit, "currency");
  setKpi(dom.kpiDb1Unit, metrics.db1Unit, "currency");
  setKpi(dom.kpiDb1Margin, metrics.db1MarginPct, "percent");
  setKpi(dom.kpiNetMarginBeforePpc, metrics.netMarginBeforePpcPct, "percent");
  setKpi(dom.kpiGrossProfitMonthly, metrics.grossProfitMonthly, "currency");
  setKpi(dom.kpiProfitMonthly, metrics.profitMonthly, "currency");
  setKpi(dom.kpiTotalCostMonthly, metrics.totalCostMonthly, "currency");
  setKpi(dom.kpiTotalCostPerUnit, metrics.totalCostPerUnit, "currency");

  if (metrics.breakEvenPrice === null) {
    setKpi(dom.kpiBreakEvenPrice, "nicht erreichbar", "text");
  } else {
    setKpi(dom.kpiBreakEvenPrice, metrics.breakEvenPrice, "currency");
  }

  setKpi(dom.kpiMaxTacos, metrics.maxTacosRateForTarget, "percent");
  setKpi(dom.kpiProductRoi, metrics.productRoiPct, "percent");
  setKpi(dom.kpiCashRoi, metrics.cashRoiPct, "percent");
  setKpi(dom.kpiPayback, metrics.paybackMonths, "months");

  renderQuickCostWorkflow(metrics);
  if (stage === "validation") {
    renderValidationWorkflow(metrics, product);
  } else if (dom.validationStagePanel) {
    dom.validationStagePanel.classList.add("hidden");
  }
  if (dom.kpiNetMargin) {
    dom.kpiNetMargin.classList.remove("margin-good", "margin-mid", "margin-low");
    if (metrics.netMarginPct > 20) {
      dom.kpiNetMargin.classList.add("margin-good");
    } else if (metrics.netMarginPct >= 15) {
      dom.kpiNetMargin.classList.add("margin-mid");
    } else {
      dom.kpiNetMargin.classList.add("margin-low");
    }
  }

  if (dom.kpiNetMarginBeforePpc) {
    dom.kpiNetMarginBeforePpc.classList.remove("margin-good", "margin-mid", "margin-low");
    if (metrics.netMarginBeforePpcPct > 20) {
      dom.kpiNetMarginBeforePpc.classList.add("margin-good");
    } else if (metrics.netMarginBeforePpcPct >= 15) {
      dom.kpiNetMarginBeforePpc.classList.add("margin-mid");
    } else {
      dom.kpiNetMarginBeforePpc.classList.add("margin-low");
    }
  }

  renderShippingModuleInline(metrics);
  renderShippingDetails(metrics);
  renderFbaDetails(metrics);
  const categories = buildCostCategoryData(metrics);
  renderLogisticsChain(metrics, stage, categories);
  renderCostCategoryGrid(metrics, stage, categories);

  setKpi(dom.sensPriceDown, metrics.sensitivity.priceDown.profitMonthly, "currency");
  setKpi(dom.sensTacosUp, metrics.sensitivity.tacosUp.profitMonthly, "currency");
  setKpi(dom.sensUnitsDown, metrics.sensitivity.unitsDown.profitMonthly, "currency");
  setKpi(dom.sensWorst, metrics.sensitivity.worst.profitMonthly, "currency");
  setKpi(dom.sensBest, metrics.sensitivity.best.profitMonthly, "currency");

  const launchDecision = classifyLaunchDecision(metrics);
  if (dom.trafficLight) {
    dom.trafficLight.className = `traffic-badge traffic-${launchDecision.color}`;
    dom.trafficLight.textContent = launchDecision.label;
    dom.trafficLight.title = `Launch-Entscheidung: ${launchDecision.text}`;
  }

  applyDriverFocus(state.ui.focusedDriverPaths, state.ui.focusedDriverLabel);
}

function renderAssumedLabels(assumedLabels, diagnostics = {}) {
  const labels = document.querySelectorAll("[data-assumed]");
  labels.forEach((node) => {
    const key = node.dataset.assumed;
    const diagnostic = diagnostics[key];
    if (diagnostic) {
      node.textContent = diagnostic.short;
      node.title = diagnostic.title;
    } else {
      node.textContent = assumedLabels[key] ?? "";
      node.title = assumedLabels[key] ?? "";
    }
  });
}

function renderLaunchHint(product, resolved) {
  const splitEnabled = Boolean(product.assumptions.launchSplit.enabled);
  const splitTotal = resolved.launchBudgetSplitTotal;
  const baseLaunch = num(product.basic.launchBudgetTotal);
  const listingMonthly = resolved.listingPackageTotal / resolved.lifecycleMonths;
  const listingText = `Listing-Paket (${listingPackageLabel(resolved.listingPackageKey)}): ${formatCurrency(resolved.listingPackageTotal)} gesamt, ${formatCurrency(listingMonthly)}/Monat über ${formatNumber(resolved.lifecycleMonths)} Monate.`;

  if (!splitEnabled) {
    dom.launchSplitHint.textContent = `Aktiv: Pflichtfeld Launch-Budget (${formatCurrency(baseLaunch)}). ${listingText}`;
    return;
  }

  if (splitTotal <= 0) {
    dom.launchSplitHint.textContent =
      `Launch-Split aktiviert, aber Summe = 0. Es wird auf Launch-Budget gesamt zurückgefallen. ${listingText}`;
    return;
  }

  dom.launchSplitHint.textContent = `Launch-Split aktiv: ${formatCurrency(splitTotal)} (ersetzt Pflichtfeld-Wert). ${listingText}`;
}

function renderStagePanel(product, metrics) {
  const stageState = buildStageState(product, metrics);

  if (dom.stageHint) {
    dom.stageHint.textContent = stageState.hint;
  }

  if (dom.stageNextStep) {
    const stepText = STAGE_NEXT_STEP_TEXT[stageState.stage] ?? STAGE_NEXT_STEP_TEXT.quick;
    dom.stageNextStep.textContent = stepText;
    dom.stageNextStep.classList.toggle("validation", stageState.stage === "validation");
    dom.stageNextStep.classList.toggle("quick", stageState.stage !== "validation");
  }

  if (dom.stageGateStatus) {
    dom.stageGateStatus.classList.remove("pass", "warn", "fail");
    dom.stageGateStatus.classList.add(stageState.statusClass);
    dom.stageGateStatus.textContent = stageState.blockers.length > 0
      ? `${stageState.statusText} · ${stageState.blockers[0]}`
      : stageState.statusText;
  }

  if (dom.stageWarning) {
    const firstWarning = stageState.kpiWarnings?.[0];
    dom.stageWarning.classList.toggle("hidden", !firstWarning);
    dom.stageWarning.textContent = firstWarning ?? "";
  }

  const stageButtonMap = {
    quick: dom.stageQuickBtn,
    validation: dom.stageValidationBtn,
    deep_dive: dom.stageDeepBtn,
  };

  WORKFLOW_VISIBLE_STAGES.forEach((stageKey) => {
    const btn = stageButtonMap[stageKey];
    if (!btn) {
      return;
    }
    btn.classList.toggle("active", stageKey === stageState.stage);
    btn.disabled = false;
  });

  return stageState;
}

function renderDecisionBar(stage) {
  const isQuick = stage === "quick";
  if (isQuick) {
    state.ui.quickShowAllKpis = false;
  }
  const showSecondary = !isQuick && Boolean(state.ui.quickShowAllKpis);
  if (dom.decisionSecondaryWrap) {
    dom.decisionSecondaryWrap.classList.toggle("hidden", !showSecondary);
  }
  if (dom.toggleAllKpisBtn) {
    dom.toggleAllKpisBtn.classList.toggle("hidden", isQuick);
    dom.toggleAllKpisBtn.textContent = showSecondary ? "Weitere KPIs einklappen" : "Weitere KPIs ausklappen";
    dom.toggleAllKpisBtn.setAttribute("aria-expanded", showSecondary ? "true" : "false");
  }
}

function reviewGroupLabel(target) {
  const chainStageKey = target?.chainStageKey;
  if (chainStageKey && CHAIN_STAGE_META[chainStageKey]) {
    return CHAIN_STAGE_META[chainStageKey].label;
  }
  return "Weitere Treiber";
}

const REVIEW_GROUP_ORDER = [
  ...CHAIN_STAGE_ORDER.map((stageKey) => CHAIN_STAGE_META[stageKey].label),
  "Weitere Treiber",
];

function renderReviewItemsGrouped(container, items, stage) {
  container.innerHTML = "";
  const grouped = new Map();
  items.forEach((item) => {
    const group = reviewGroupLabel(item);
    if (!grouped.has(group)) {
      grouped.set(group, []);
    }
    grouped.get(group).push(item);
  });

  REVIEW_GROUP_ORDER.forEach((group) => {
    const groupItems = grouped.get(group);
    if (!groupItems || groupItems.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.className = "review-group";
    const title = document.createElement("h4");
    title.className = "review-group-title";
    title.textContent = group;
    section.appendChild(title);

    const list = document.createElement("ul");
    list.className = "calc-list review-group-list";
    groupItems.forEach((target) => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      left.className = "review-item-main";
      const rowTitle = document.createElement("strong");
      rowTitle.textContent = target.label;
      const rowMeta = document.createElement("small");
      rowMeta.textContent = `${target.categoryTitle} · ${target.value}`;
      left.append(rowTitle, rowMeta);

      const actions = document.createElement("div");
      actions.className = "review-actions";

      const chip = document.createElement("span");
      const status = target.status;
      chip.className = `review-status-chip review-status-${status}`;
      chip.textContent = status === "checked" ? "geprüft" : status === "overridden" ? "überschrieben" : "offen";
      actions.appendChild(chip);

      const checkBtn = document.createElement("button");
      checkBtn.type = "button";
      checkBtn.className = "btn btn-ghost";
      checkBtn.dataset.reviewAction = status === "checked" ? "uncheck" : "check";
      checkBtn.dataset.reviewStage = stage;
      checkBtn.dataset.reviewTargetId = target.targetId;
      checkBtn.textContent = status === "checked" ? "Auf ungeprüft" : "Prüfen";
      actions.appendChild(checkBtn);

      const overrideBtn = document.createElement("button");
      overrideBtn.type = "button";
      overrideBtn.className = "btn btn-primary";
      overrideBtn.dataset.reviewAction = "override";
      overrideBtn.dataset.reviewStage = stage;
      overrideBtn.dataset.reviewTargetId = target.targetId;
      overrideBtn.textContent = "Öffnen & überschreiben";
      actions.appendChild(overrideBtn);

      if (status !== "pending") {
        const resetBtn = document.createElement("button");
        resetBtn.type = "button";
        resetBtn.className = "btn btn-ghost";
        resetBtn.dataset.reviewAction = "reset";
        resetBtn.dataset.reviewStage = stage;
        resetBtn.dataset.reviewTargetId = target.targetId;
        resetBtn.textContent = "Zurücksetzen";
        actions.appendChild(resetBtn);
      }

      li.append(left, actions);
      list.appendChild(li);
    });

    section.appendChild(list);
    container.appendChild(section);
  });
}

function applyStageVisibility(product, stageState) {
  const stage = stageState.stage;
  const isValidation = stage === "validation";
  const isQuick = stage === "quick";
  const isLeanStage = isQuick || isValidation;

  if (dom.advancedToggleWrap) {
    dom.advancedToggleWrap.classList.add("hidden");
  }

  state.ui.advancedVisible = false;

  if (dom.advancedPanel) {
    dom.advancedPanel.classList.add("hidden");
  }
  if (dom.advancedToggle) {
    dom.advancedToggle.checked = false;
    dom.advancedToggle.disabled = true;
  }

  if (dom.quickStagePanel) {
    dom.quickStagePanel.classList.toggle("hidden", !isQuick);
  }
  if (dom.validationStagePanel) {
    dom.validationStagePanel.classList.toggle("hidden", !isValidation);
  }
  if (dom.validationPlaygroundPanel) {
    dom.validationPlaygroundPanel.classList.toggle("hidden", !isValidation);
  }
  if (dom.shippingQuickCard) {
    dom.shippingQuickCard.classList.toggle("hidden", isLeanStage);
  }
  if (dom.fbaInfoCard) {
    dom.fbaInfoCard.classList.toggle("hidden", isLeanStage);
  }
  if (dom.outputsCard) {
    dom.outputsCard.classList.toggle("hidden", isLeanStage);
  }
  if (dom.compareCard) {
    dom.compareCard.classList.toggle("hidden", isLeanStage);
  }
  if (dom.chainMapSection) {
    dom.chainMapSection.classList.toggle("hidden", isLeanStage);
  }
  if (dom.categoryMapSection) {
    dom.categoryMapSection.classList.toggle("hidden", isLeanStage);
  }
  if (dom.sensitivitySection) {
    dom.sensitivitySection.classList.toggle("hidden", isLeanStage);
  }
  if (dom.driverFocusHint) {
    dom.driverFocusHint.classList.toggle("hidden", isLeanStage);
  }

  const deepDiveCheckboxes = document.querySelectorAll('[data-path^="workflow.deepDive."]');
  deepDiveCheckboxes.forEach((node) => {
    node.disabled = true;
  });
}

function syncControlStates(product) {
  OVERRIDE_CONTROL_MAP.forEach(([flagPath, valuePath]) => {
    const flag = Boolean(getByPath(product, flagPath));
    const inputs = document.querySelectorAll(`[data-path="${valuePath}"]`);
    inputs.forEach((input) => {
      input.disabled = !flag;
    });
  });

  const manualFbaOverrideEnabled = Boolean(getByPath(product, AMAZON_FBA_MANUAL_OVERRIDE_PATH));
  const manualFbaFeeInputs = document.querySelectorAll(`[data-path="${AMAZON_FBA_MANUAL_FEE_PATH}"]`);
  manualFbaFeeInputs.forEach((manualFbaFeeInput) => {
    manualFbaFeeInput.disabled = !manualFbaOverrideEnabled;
  });

  const launchSplitEnabled = Boolean(getByPath(product, "assumptions.launchSplit.enabled"));
  const launchSplitFields = dom.launchSplitBox.querySelectorAll("input[data-path]");
  launchSplitFields.forEach((field) => {
    field.disabled = !launchSplitEnabled;
  });

  const cartonManualEnabled = Boolean(getByPath(product, "assumptions.cartonization.manualEnabled"));
  document.querySelectorAll('[data-path="assumptions.cartonization.unitsPerCarton"], [data-path="assumptions.cartonization.cartonLengthCm"], [data-path="assumptions.cartonization.cartonWidthCm"], [data-path="assumptions.cartonization.cartonHeightCm"], [data-path="assumptions.cartonization.cartonGrossWeightKg"]').forEach((field) => {
    field.disabled = !cartonManualEnabled;
  });

  const packagingOverride = Boolean(getByPath(product, "assumptions.extraCosts.overridePackagingGroup"));
  document.querySelectorAll('[data-path^="assumptions.extraCosts.packagingPerUnitEur"], [data-path^="assumptions.extraCosts.otherUnitCostEur"]').forEach((field) => {
    field.disabled = !packagingOverride;
  });

  const logisticsOverride = Boolean(getByPath(product, "assumptions.extraCosts.overrideLogisticsGroup"));
  document.querySelectorAll('[data-path^="assumptions.extraCosts.docsPerOrderEur"], [data-path^="assumptions.extraCosts.freightPapersPerOrderEur"], [data-path^="assumptions.extraCosts.receivingMode"], [data-path^="assumptions.extraCosts.receivingPerCartonSortedEur"], [data-path^="assumptions.extraCosts.receivingPerCartonMixedEur"], [data-path^="assumptions.extraCosts.storagePerPalletPerMonthEur"], [data-path^="assumptions.extraCosts.unitsPerPallet"], [data-path^="assumptions.extraCosts.avg3PlStorageMonths"], [data-path^="assumptions.extraCosts.outboundBasePerCartonEur"], [data-path^="assumptions.extraCosts.pickPackPerCartonEur"], [data-path^="assumptions.extraCosts.fbaProcessingPerCartonEur"], [data-path^="assumptions.extraCosts.insertsPerCarton"], [data-path^="assumptions.extraCosts.insertPerInsertEur"], [data-path^="assumptions.extraCosts.labelsPerCarton"], [data-path^="assumptions.extraCosts.thirdCountryLabelPerLabelEur"], [data-path^="assumptions.extraCosts.carrierCostPerCartonEur"], [data-path^="assumptions.extraCosts.amazonStoragePerCbmMonthEur"], [data-path^="assumptions.extraCosts.avgAmazonStorageMonths"]').forEach((field) => {
    field.disabled = !logisticsOverride;
  });

  const launchOpsOverride = Boolean(getByPath(product, "assumptions.extraCosts.overrideLaunchOpsGroup"));
  document.querySelectorAll('[data-path^="assumptions.extraCosts.greetingCardPerLaunchUnitEur"], [data-path^="assumptions.extraCosts.samplesPerProductEur"], [data-path^="assumptions.extraCosts.toolingPerProductEur"], [data-path^="assumptions.extraCosts.certificatesPerProductEur"], [data-path^="assumptions.extraCosts.inspectionPerProductEur"]').forEach((field) => {
    field.disabled = !launchOpsOverride;
  });

  const customsBrokerField = document.querySelector('[data-settings-path="shipping12m.customsBrokerFixedEurPerShipment"]');
  if (customsBrokerField) {
    customsBrokerField.disabled = !state.settings.shipping12m.customsBrokerEnabled;
  }
  const insuranceBasisField = document.querySelector('[data-settings-path="shipping12m.insurance.basis"]');
  const insuranceRateField = document.querySelector('[data-settings-path="shipping12m.insurance.ratePct"]');
  const insuranceEnabled = Boolean(state.settings.shipping12m.insurance?.enabled);
  if (insuranceBasisField) {
    insuranceBasisField.disabled = !insuranceEnabled;
  }
  if (insuranceRateField) {
    insuranceRateField.disabled = !insuranceEnabled;
  }
  const surchargeField = document.querySelector('[data-settings-path="shipping12m.manualSurchargeEurPerShipment"]');
  if (surchargeField) {
    surchargeField.disabled = !Boolean(state.settings.shipping12m.manualSurchargeEnabled);
  }

  renderSettingsInputs();
}

function openAdvancedSection(sectionId) {
  const isSettingsSection = sectionId.startsWith("settings");
  if (APP_PAGE === "product" && isSettingsSection) {
    window.location.href = `settings.html#${sectionId}`;
    return;
  }

  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }

  if (isSettingsSection) {
    const details = section.tagName.toLowerCase() === "details" ? section : section.closest("details");
    if (details instanceof HTMLDetailsElement) {
      details.open = true;
    }
    setWorkspaceTab("settings");
  } else {
    setWorkspaceTab("product");
  }

  section.scrollIntoView({ behavior: "smooth", block: "center" });
  section.classList.add("advanced-focus");
  window.setTimeout(() => {
    section.classList.remove("advanced-focus");
  }, 1400);
}

function inferAdvancedSectionFromPath(path) {
  if (!path) {
    return null;
  }
  const selected = getSelectedProduct();
  const stage = selected ? getProductStage(selected) : "quick";
  const stageWorkflowSection = stage === "validation" ? "validationStagePanel" : "quickStagePanel";

  if (path.startsWith("assumptions.ads.")) {
    return "advancedAdsSection";
  }
  if (path.startsWith("assumptions.returns.")) {
    return "advancedReturnsSection";
  }
  if (path.startsWith("assumptions.leakage.")) {
    return "advancedLeakageSection";
  }
  if (path.startsWith("assumptions.import.") || path.startsWith("assumptions.amazon.")) {
    return "advancedImportSection";
  }
  if (path.startsWith("assumptions.lifecycle.") || path.startsWith("assumptions.launchSplit.")) {
    return "advancedLifecycleSection";
  }
  if (path.startsWith("assumptions.cartonization.")) {
    return stageWorkflowSection;
  }
  if (path.startsWith("assumptions.extraCosts.")) {
    return "advancedOpsSection";
  }
  if (path.startsWith("settings.")) {
    return settingsSectionIdFromPath(path.slice("settings.".length));
  }
  if (path.startsWith("workflow.deepDive.")) {
    return stageWorkflowSection;
  }
  if (
    path === "basic.unitsPerOrder" ||
    path === "basic.transportMode" ||
    path === "basic.netWeightG" ||
    path === "basic.packLengthCm" ||
    path === "basic.packWidthCm" ||
    path === "basic.packHeightCm"
  ) {
    return stageWorkflowSection;
  }
  return null;
}

function focusMetricDrivers(driverPaths, targetSection, lineLabel = "") {
  const paths = [...new Set((driverPaths ?? []).filter(Boolean))];
  const firstFocusedPath = paths.find((path) => path.startsWith("assumptions.") || path.startsWith("settings.")) ?? paths[0];
  const inferredSection = targetSection || inferAdvancedSectionFromPath(firstFocusedPath);
  if (inferredSection) {
    openAdvancedSection(inferredSection);
  } else if (paths.some((path) => path.startsWith("settings."))) {
    setWorkspaceTab("settings");
  } else if (paths.length > 0) {
    setWorkspaceTab("product");
  }

  applyDriverFocus(paths, lineLabel);

  const preferredPaths = firstFocusedPath ? [firstFocusedPath, ...paths] : paths;
  const firstMatch = preferredPaths
    .map((path) => getDriverControl(path))
    .find((node) => node instanceof HTMLElement);

  if (firstMatch instanceof HTMLElement) {
    firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function renderInputs(product) {
  const allFields = document.querySelectorAll("[data-path]");
  allFields.forEach((field) => {
    const path = field.dataset.path;
    const value = getByPath(product, path);
    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value ?? "";
    }
  });

  dom.compareSort.value = state.ui.compareSort;
  dom.compareFilter.value = state.ui.compareFilter;
  applySoftLocksToUI();
}

function renderProductList(metricsById = new Map()) {
  dom.productList.innerHTML = "";

  state.products.forEach((product) => {
    const metrics = metricsById.get(product.id) ?? calculateProduct(product);
    const stageState = buildStageState(product, metrics);
    const fragment = dom.productItemTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".product-btn");
    const name = fragment.querySelector(".name");
    const meta = fragment.querySelector(".meta");
    const pill = fragment.querySelector(".pill");

    name.textContent = product.name || "Unbenannt";
    meta.textContent = `${formatCurrency(product.basic.priceGross)} brutto · ${formatPercent(metrics.netMarginPct)} Netto-Marge · ${formatPercent(metrics.sellerboardMarginPct)} Sellerboard`;

    pill.textContent = `${STAGE_LABELS[stageState.stage]}`;
    pill.classList.remove("yellow", "red");
    if (!stageState.readinessByStage[stageState.stage]) {
      pill.classList.add("yellow");
    }
    if (stageState.stage === "quick" && !stageState.quickPass) {
      pill.classList.add("red");
    }

    if (product.id === state.selectedId) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      state.selectedId = product.id;
      setWorkspaceTab("product");
      renderAll();
    });

    dom.productList.appendChild(fragment);
  });

  dom.productCount.textContent = String(state.products.length);
}

function compareValue(row, sortKey) {
  switch (sortKey) {
    case "db1_margin_desc":
      return row.metrics.db1MarginPct;
    case "roi_desc":
      return row.metrics.productRoiPct;
    case "cash_roi_desc":
      return row.metrics.cashRoiPct;
    case "payback_asc":
      return row.metrics.paybackMonths ?? Number.POSITIVE_INFINITY;
    case "shipping_asc":
      return row.metrics.shippingUnit;
    case "max_tacos_desc":
      return row.metrics.maxTacosRateForTarget;
    case "profit_desc":
    default:
      return row.metrics.profitMonthly;
  }
}

function renderComparison(metricsById = new Map()) {
  const rows = state.products.map((product) => ({
    product,
    metrics: metricsById.get(product.id) ?? calculateProduct(product),
  }));

  const filter = state.ui.compareFilter;
  const filtered = rows.filter((row) => {
    if (filter === "all") {
      return true;
    }
    if (filter === "profit") {
      return row.metrics.profitMonthly > 0;
    }
    return row.metrics.sensitivity.traffic.color === filter;
  });

  const sortKey = state.ui.compareSort;
  filtered.sort((a, b) => {
    const av = compareValue(a, sortKey);
    const bv = compareValue(b, sortKey);
    const aFinite = Number.isFinite(av);
    const bFinite = Number.isFinite(bv);

    if (!aFinite && !bFinite) {
      return 0;
    }
    if (!aFinite) {
      return 1;
    }
    if (!bFinite) {
      return -1;
    }

    if (sortKey.endsWith("_asc")) {
      return av - bv;
    }
    return bv - av;
  });

  dom.comparisonBody.innerHTML = "";

  filtered.forEach((row) => {
    const tr = document.createElement("tr");

    const trafficClass = row.metrics.sensitivity.traffic.color;
    const trafficBadge = `<span class="badge ${trafficClass === "yellow" ? "yellow" : trafficClass === "red" ? "red" : ""}">${row.metrics.sensitivity.traffic.label}</span>`;

    tr.innerHTML = `
      <td><button class="link-btn" data-select-product="${row.product.id}">${row.product.name}</button></td>
      <td>${state.settings.categoryDefaults[row.product.basic.category]?.label ?? row.product.basic.category}</td>
      <td>${formatCurrency(row.metrics.priceGross)}</td>
      <td>${formatCurrency(row.metrics.priceNet)}</td>
      <td>${formatCurrency(row.metrics.shippingUnit)}</td>
      <td>${formatCurrency(row.metrics.landedUnit)}</td>
      <td>${formatCurrency(row.metrics.db1Unit)}</td>
      <td>${formatPercent(row.metrics.db1MarginPct)}</td>
      <td>${formatCurrency(row.metrics.profitMonthly)}</td>
      <td>${formatPercent(row.metrics.productRoiPct)}</td>
      <td>${formatPercent(row.metrics.cashRoiPct)}</td>
      <td>${row.metrics.paybackMonths === null ? "n/a" : `${formatNumber(row.metrics.paybackMonths)} M`}</td>
      <td>${row.metrics.breakEvenPrice === null ? "n/a" : formatCurrency(row.metrics.breakEvenPrice)}</td>
      <td>${formatPercent(row.metrics.maxTacosRateForTarget)}</td>
      <td>${trafficBadge}</td>
      <td>${formatCurrency(row.metrics.sensitivity.worst.profitMonthly)} / ${formatCurrency(row.metrics.sensitivity.best.profitMonthly)}</td>
    `;

    dom.comparisonBody.appendChild(tr);
  });
}

function renderSelectedProductPanels(metricsById = new Map()) {
  const product = getSelectedProduct();
  if (!product) {
    return;
  }

  if (dom.headerProductName) {
    const displayName = product.name?.trim() || "Unbenanntes Produkt";
    dom.headerProductName.textContent = `Produkt: ${displayName}`;
  }

  renderFxStatus();

  const metrics = metricsById.get(product.id) ?? calculateProduct(product);
  const resolved = metrics.resolved;
  const diagnostics = buildDefaultDiagnostics(product, metrics);
  const stageState = renderStagePanel(product, metrics);
  applyStageVisibility(product, stageState);
  renderDecisionBar(stageState.stage);
  renderSelectedOutputs(product, metrics, stageState.stage);
  renderValidationPlayground(product, metrics);
  renderAssumedLabels(resolved.assumedLabels, diagnostics);
  renderLaunchHint(product, resolved);
  syncControlStates(product);
}

function buildMetricsCache() {
  const cache = new Map();
  state.products.forEach((product) => {
    cache.set(product.id, calculateProduct(product));
  });
  return cache;
}

function renderComputedViews() {
  const metricsById = buildMetricsCache();
  renderProductList(metricsById);
  renderSelectedProductPanels(metricsById);
  renderComparison(metricsById);
}

function renderAll() {
  selectFirstProductIfNeeded();
  const selected = getSelectedProduct();
  if (!selected) {
    return;
  }

  renderWorkspaceTabs();
  renderInputs(selected);
  renderSettingsInputs();
  renderComputedViews();
  renderDriverModal();
  applyMouseoverHelp();
  applySoftLocksToUI();
}

function normalizeFieldValue(path, rawValue) {
  if (BOOLEAN_PATHS.has(path)) {
    return Boolean(rawValue);
  }
  if (STRING_PATHS.has(path)) {
    return String(rawValue);
  }
  return num(rawValue, 0);
}

function normalizeSettingsValue(path, rawValue) {
  if (SETTINGS_BOOLEAN_PATHS.has(path)) {
    return Boolean(rawValue);
  }
  if (SETTINGS_STRING_PATHS.has(path)) {
    return String(rawValue);
  }
  return num(rawValue, 0);
}

function updateSelectedField(path, rawValue) {
  const selected = getSelectedProduct();
  if (!selected) {
    return;
  }
  markLocalEditActivity();

  const nextValue = normalizeFieldValue(path, rawValue);
  setByPath(selected, path, nextValue);

  if (path === "basic.horizonMonths") {
    selected.basic.horizonMonths = clamp(roundInt(selected.basic.horizonMonths, 1), 1, 36);
  }
  if (path === "basic.unitsPerOrder") {
    selected.basic.unitsPerOrder = Math.max(1, roundInt(selected.basic.unitsPerOrder, 1));
  }
  if (path === "basic.netWeightG") {
    selected.basic.netWeightG = Math.max(0, num(selected.basic.netWeightG));
  }
  if (path === "basic.transportMode" && !["sea_lcl", "rail"].includes(selected.basic.transportMode)) {
    selected.basic.transportMode = "sea_lcl";
  }
  if (path === "assumptions.cartonization.unitsPerCarton") {
    selected.assumptions.cartonization.unitsPerCarton = Math.max(1, roundInt(selected.assumptions.cartonization.unitsPerCarton, 1));
  }
  if (
    path === "assumptions.cartonization.cartonLengthCm" ||
    path === "assumptions.cartonization.cartonWidthCm" ||
    path === "assumptions.cartonization.cartonHeightCm" ||
    path === "assumptions.cartonization.cartonGrossWeightKg"
  ) {
    setByPath(selected, path, Math.max(0, num(getByPath(selected, path), 0)));
  }

  saveProducts();
}

function updateSettingsField(path, rawValue) {
  markLocalEditActivity();
  const nextValue = normalizeSettingsValue(path, rawValue);
  setByPath(state.settings, path, nextValue);

  if (path.startsWith("cartonRules.") && path !== "cartonRules.preset") {
    state.settings.cartonRules.preset = "custom";
  }

  sanitizeSettings(state.settings);
  if (path === "tax.fallbackUsdToEur" && state.fx.source.startsWith("Fallback")) {
    state.fx.usdToEur = state.settings.tax.fallbackUsdToEur;
  }
  saveSettings({ flushRemoteNow: true });
}

function addProduct() {
  const product = defaultProduct(state.products.length + 1);
  ensureProductId(product);
  state.products.push(product);
  state.selectedId = product.id;
  saveProducts();
  flushRemoteProductsSave().finally(() => {
    renderAll();
  });
}

function duplicateProduct() {
  const selected = getSelectedProduct();
  if (!selected) {
    return;
  }

  const copy = deepClone(selected);
  copy.id = uid();
  ensureProductId(copy);
  copy.name = `${selected.name} (Kopie)`;

  state.products.push(copy);
  state.selectedId = copy.id;
  saveProducts();
  flushRemoteProductsSave().finally(() => {
    renderAll();
  });
}

function deleteProduct() {
  const selected = getSelectedProduct();
  if (!selected) {
    return;
  }

  const confirmed = window.confirm(`Produkt "${selected.name}" löschen?`);
  if (!confirmed) {
    return;
  }

  state.products = state.products.filter((product) => product.id !== selected.id);
  if (state.products.length === 0) {
    state.products = [defaultProduct(1)];
  }
  state.selectedId = state.products[0].id;
  saveProducts();
  flushRemoteProductsSave().finally(() => {
    renderAll();
  });
}

function setSelectedStage(stage) {
  const selected = getSelectedProduct();
  if (!selected) {
    return;
  }
  const normalizedStage = stage === "deep_dive" ? "validation" : stage;
  if (!WORKFLOW_VISIBLE_STAGES.includes(normalizedStage)) {
    return;
  }

  selected.workflow.stage = normalizedStage;
  if (normalizedStage === "quick") {
    state.ui.advancedVisible = false;
    state.ui.costCategoryExpanded = {};
  }
  saveProducts();
  renderAll();
}

function renderFxStatus() {
  if (!dom.fxStatus) {
    return;
  }
  if (dom.refreshFxBtn) {
    dom.refreshFxBtn.disabled = state.fx.loading;
  }

  const rateText = `1 USD = ${formatNumber(state.fx.usdToEur)} EUR`;
  const dateText = state.fx.date ? `Stand: ${formatDate(state.fx.date)}` : "Stand: Fallback";
  const sourceText = `Quelle: ${state.fx.source}`;

  dom.fxStatus.classList.remove("ok", "warn");

  if (state.fx.loading) {
    dom.fxStatus.textContent = "USD→EUR Kurs wird aktualisiert ...";
    dom.fxStatus.classList.add("warn");
  } else if (state.fx.error) {
    dom.fxStatus.textContent = `${rateText} · ${dateText} · ${sourceText} · Fehler: ${state.fx.error}`;
    dom.fxStatus.classList.add("warn");
  } else {
    dom.fxStatus.textContent = `${rateText} · ${dateText} · ${sourceText}`;
    dom.fxStatus.classList.add("ok");
  }
}

async function refreshFxRate() {
  state.fx.loading = true;
  state.fx.error = null;
  renderFxStatus();

  try {
    const response = await fetch(FX_ENDPOINT, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const latest = num(payload?.rates?.EUR, NaN);
    if (!Number.isFinite(latest) || latest <= 0) {
      throw new Error("kein gültiger EUR-Kurs");
    }

    state.fx.usdToEur = latest;
    state.fx.date = payload?.date ?? new Date().toISOString();
    state.fx.source = "Frankfurter (ECB Referenzkurs)";
    state.fx.error = null;
  } catch (error) {
    state.fx.error = error instanceof Error ? error.message : "unbekannt";
  } finally {
    state.fx.loading = false;
    renderFxStatus();
    renderComputedViews();
  }
}

function applyMouseoverHelp() {
  const selected = getSelectedProduct();
  const metrics = selected ? calculateProduct(selected) : null;
  const diagnostics = selected && metrics ? buildDefaultDiagnostics(selected, metrics) : {};

  if (dom.advancedToggle) {
    dom.advancedToggle.title = "Advanced ist in diesem Flow deaktiviert. Änderungen laufen über Treiber-Masken.";
  }
  if (dom.stageQuickBtn) {
    dom.stageQuickBtn.title = "QuickCheck: leaner 80/20-Workflow mit fünf Hauptkostenblöcken.";
  }
  if (dom.stageValidationBtn) {
    dom.stageValidationBtn.title = "Validation: Kostenabdeckung bis 95% und Kernannahmen im Sandbox-Playground prüfen.";
  }
  if (dom.stageDeepBtn) {
    dom.stageDeepBtn.title = "Deep-Dive ist aktuell deaktiviert.";
  }
  if (dom.toggleAllKpisBtn) {
    const selected = getSelectedProduct();
    const isValidation = selected ? getProductStage(selected) === "validation" : false;
    dom.toggleAllKpisBtn.title = isValidation
      ? "Zeigt zusätzliche KPIs in der Decision-Bar."
      : "Im QuickCheck ausgeblendet.";
  }
  if (dom.compareSort) {
    dom.compareSort.title = "Sortiert die Vergleichstabelle nach dem gewählten KPI.";
  }
  if (dom.compareFilter) {
    dom.compareFilter.title = "Filtert Produkte nach Ampelstatus oder Profitabilität.";
  }
  if (dom.fxStatus) {
    dom.fxStatus.title =
      "Aktueller USD→EUR Umrechnungskurs für EK (EXW). Quelle: Frankfurter API auf Basis ECB Referenzkurs.";
  }
  if (dom.refreshFxBtn) {
    dom.refreshFxBtn.title = "Lädt den neuesten USD→EUR Kurs erneut.";
  }
  if (dom.cartonPresetSelect) {
    dom.cartonPresetSelect.title = "Wählt ein Amazon-Kartonprofil als Basis für die Auto-Kartonisierung.";
  }

  document.querySelectorAll("[data-help-key]").forEach((trigger) => {
    if (!(trigger instanceof HTMLElement)) {
      return;
    }
    const text = helpTextByKey(trigger.dataset.helpKey ?? "");
    if (!text) {
      return;
    }
    trigger.title = text;
  });

  const inputs = document.querySelectorAll("[data-path]");
  inputs.forEach((input) => {
    const path = input.dataset.path;
    const helpText = FIELD_HELP[path] ?? "";
    const diagKey = diagnosticsKeyFromPath(path);
    const diag = diagKey ? diagnostics[diagKey] : null;
    const impact = metrics ? classifyImpact(impactMonthlyFromPath(path, metrics), metrics.totalCostMonthly) : null;
    const robustness = diagKey && DEFAULT_ROBUSTNESS[diagKey] ? DEFAULT_ROBUSTNESS[diagKey] : null;
    const robustnessWord = robustness ? robustnessLabel(robustness.score) : "mittel";
    const defaultSource = path.startsWith("assumptions.")
      ? "Produktannahme (Default aus Kategorie/Global, optional Override)"
      : "User Input";

    const parts = [
      helpText,
      "Rechenweg: Der Wert fließt direkt in die zugehörige Kostenformel ein.",
      `Herkunft: ${defaultSource}.`,
      impact ? `Impact: ${impact.label} (${formatPercent(impact.sharePct)} der Gesamtkosten).` : "Impact: n/a.",
      `Robustheit: ${robustnessWord}${robustness ? ` (${robustness.why})` : ""}.`,
    ].filter((item) => Boolean(item));

    if (diag?.title) {
      parts.push(diag.title);
    }

    input.title = parts.join("\n");
    const label = input.closest("label");
    if (label) {
      label.title = input.title;
    }
  });

  const settingInputs = document.querySelectorAll("[data-settings-path]");
  settingInputs.forEach((input) => {
    const path = input.dataset.settingsPath;
    const helpText = SETTINGS_HELP[path] ?? "";
    const fullPath = `settings.${path}`;
    const impact = metrics ? classifyImpact(impactMonthlyFromPath(fullPath, metrics), metrics.totalCostMonthly) : null;
    const robustnessWord = path.startsWith("shipping12m.")
      ? "mittel"
      : path.startsWith("cartonRules.")
        ? "mittel"
      : path.startsWith("threePl.")
        ? "mittel"
      : path.startsWith("categoryDefaults.")
        ? "mittel"
        : "hoch";
    const title = [
      helpText,
      "Rechenweg: Globaler Parameter, der in die entsprechenden Kostenblöcke übernommen wird.",
      "Herkunft: Global Setting.",
      impact ? `Impact: ${impact.label} (${formatPercent(impact.sharePct)} der Gesamtkosten).` : "Impact: n/a.",
      `Robustheit: ${robustnessWord}.`,
    ].filter((item) => Boolean(item)).join("\n");

    input.title = title;
    const label = input.closest("label");
    if (label) {
      label.title = title;
    }
  });

  const kpis = document.querySelectorAll("[data-kpi]");
  kpis.forEach((card) => {
    const key = card.dataset.kpi;
    const text = KPI_HELP[key];
    if (!text) {
      return;
    }
    card.title = text;
    const label = card.querySelector("span");
    if (label) {
      label.title = text;
    }
  });

  const summaries = document.querySelectorAll(".block-grid summary");
  summaries.forEach((summary) => {
    const text = summary.textContent?.trim() ?? "";
    if (text.startsWith("Block 1")) {
      summary.title =
        "Unit Economics pro Order/Stück: Landed, Amazon Fees, Ads und Retoureneffekte.";
    } else if (text.startsWith("Block 2")) {
      summary.title =
        "Launch & Lifecycle: einmalige/temporäre Kosten, auf Zeitraum bzw. Monatsbasis verteilt.";
    } else if (text.startsWith("Block 3")) {
      summary.title =
        "Fixkosten/Leakage als pauschaler Kostenblock (typisch 2-5% vom Netto-Umsatz).";
    }
  });

  const headers = document.querySelectorAll(".compare-card th");
  headers.forEach((header, index) => {
    header.title = TABLE_HEADER_HELP[index] ?? "";
  });

  const termNodes = document.querySelectorAll("h2, h3, h4, h5, summary, th, span, p, label");
  termNodes.forEach((node) => {
    if (node.title) {
      return;
    }
    const text = node.textContent?.trim();
    if (!text) {
      return;
    }
    const matched = TERM_HELP_BY_TEXT.find((item) => text.includes(item.match));
    if (!matched) {
      return;
    }
    node.title = matched.text;
  });
}

function bindEvents() {
  document.addEventListener("focusin", (event) => {
    const target = event.target;
    if (!isEditableControl(target)) {
      return;
    }
    const fieldKey = fieldKeyForControl(target);
    if (!fieldKey) {
      return;
    }
    markLocalEditActivity();
    state.presence.myEditingField = fieldKey;
    void trackPresenceField(fieldKey);
  });

  document.addEventListener("focusout", () => {
    if (state.presence.focusClearTimer) {
      clearTimeout(state.presence.focusClearTimer);
      state.presence.focusClearTimer = null;
    }
    state.presence.focusClearTimer = setTimeout(() => {
      const active = document.activeElement;
      const activeFieldKey = isEditableControl(active) ? fieldKeyForControl(active) : null;
      state.presence.myEditingField = activeFieldKey;
      void trackPresenceField(activeFieldKey);
      maybeApplyDeferredRemotePull();
    }, 0);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const helpTrigger = target.closest(".info-trigger[data-help-key]");
    if (helpTrigger instanceof HTMLElement) {
      event.preventDefault();
      event.stopPropagation();
      toggleInlineHelpNote(helpTrigger);
      return;
    }
    if (!target.closest(".help-context")) {
      closeInlineHelpNotes();
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }
    if (fieldKeyForControl(target)) {
      markLocalEditActivity();
    }

    const path = target.dataset.path;
    if (!path) {
      return;
    }

    if (target.type === "checkbox") {
      return;
    }

    updateSelectedField(path, target.value);
    renderComputedViews();
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    const path = target.dataset.path;
    const settingsPath = target.dataset.settingsPath;
    const value = target.type === "checkbox" ? target.checked : target.value;
    if (fieldKeyForControl(target)) {
      markLocalEditActivity();
    }

    if (path) {
      updateSelectedField(path, value);
      renderComputedViews();
      maybeApplyDeferredRemotePull();
      return;
    }

    if (settingsPath) {
      updateSettingsField(settingsPath, value);
      if (APP_PAGE === "product") {
        renderComputedViews();
      }
      renderSettingsInputs();
      applyMouseoverHelp();
      maybeApplyDeferredRemotePull();
    }
  });

  if (dom.cartonPresetSelect) {
    dom.cartonPresetSelect.addEventListener("change", () => {
      const preset = dom.cartonPresetSelect.value;
      if (preset === "legacy" || preset === "update_2025") {
        applyCartonPreset(preset, state.settings);
      } else {
        state.settings.cartonRules.preset = "custom";
      }
      sanitizeSettings(state.settings);
      saveSettings({ flushRemoteNow: true });
      renderAll();
    });
  }

  if (dom.stageQuickBtn) {
    dom.stageQuickBtn.addEventListener("click", () => setSelectedStage("quick"));
  }
  if (dom.stageValidationBtn) {
    dom.stageValidationBtn.addEventListener("click", () => setSelectedStage("validation"));
  }

  if (dom.quickCostWorkflowGrid) {
    dom.quickCostWorkflowGrid.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const blockBtn = target.closest("[data-quick-block]");
      if (!(blockBtn instanceof HTMLElement)) {
        return;
      }
      const blockKey = blockBtn.dataset.quickBlock;
      if (!blockKey) {
        return;
      }
      openCostBlockModal(blockKey, "quick");
    });
  }

  if (dom.shippingModuleOpenDetailBtn) {
    dom.shippingModuleOpenDetailBtn.addEventListener("click", () => {
      const selected = getSelectedProduct();
      if (!selected) {
        return;
      }
      openCostBlockModal("shipping_to_3pl", getProductStage(selected));
    });
  }

  const validationDraftControls = document.querySelectorAll("[data-validation-draft-path]");
  validationDraftControls.forEach((control) => {
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) {
      return;
    }
    control.addEventListener("change", () => {
      const selected = getSelectedProduct();
      if (!selected || getProductStage(selected) !== "validation") {
        return;
      }
      const path = control.dataset.validationDraftPath;
      if (!path) {
        return;
      }
      if (!state.ui.validationSandboxDraft) {
        state.ui.validationSandboxDraft = createValidationSandboxDraftFromProduct(selected);
      }
      state.ui.validationSandboxDraft[path] = normalizeValidationDraftValue(path, control.value);
      renderComputedViews();
    });
  });

  if (dom.validationApplyBtn) {
    dom.validationApplyBtn.addEventListener("click", () => {
      const selected = getSelectedProduct();
      if (!selected || !state.ui.validationSandboxDraft) {
        return;
      }
      const draft = state.ui.validationSandboxDraft;
      VALIDATION_PLAYGROUND_PATHS.forEach((path) => {
        setByPath(selected, path, draft[path]);
      });
      ensureValidationWorkflowState(selected).lastAppliedAt = new Date().toISOString();
      state.ui.validationSandboxDraft = createValidationSandboxDraftFromProduct(selected);
      saveProducts();
      renderAll();
    });
  }

  if (dom.validationDiscardBtn) {
    dom.validationDiscardBtn.addEventListener("click", () => {
      const selected = getSelectedProduct();
      if (!selected) {
        return;
      }
      state.ui.validationSandboxDraft = createValidationSandboxDraftFromProduct(selected);
      renderComputedViews();
    });
  }

  if (dom.validationResetBtn) {
    dom.validationResetBtn.addEventListener("click", () => {
      const selected = getSelectedProduct();
      if (!selected) {
        return;
      }
      state.ui.validationSandboxDraft = createValidationSandboxDraftFromProduct(selected);
      renderComputedViews();
    });
  }

  if (dom.toggleAllKpisBtn) {
    dom.toggleAllKpisBtn.addEventListener("click", () => {
      state.ui.quickShowAllKpis = !state.ui.quickShowAllKpis;
      renderComputedViews();
    });
  }

  if (dom.advancedToggle) {
    dom.advancedToggle.addEventListener("change", () => {
      state.ui.advancedVisible = dom.advancedToggle.checked;
      renderAll();
    });
  }

  if (dom.compareSort) {
    dom.compareSort.addEventListener("change", () => {
      state.ui.compareSort = dom.compareSort.value;
      renderComputedViews();
    });
  }

  if (dom.compareFilter) {
    dom.compareFilter.addEventListener("change", () => {
      state.ui.compareFilter = dom.compareFilter.value;
      renderComputedViews();
    });
  }

  if (dom.refreshFxBtn) {
    dom.refreshFxBtn.addEventListener("click", () => {
      refreshFxRate();
    });
  }

  if (dom.syncNowBtn) {
    dom.syncNowBtn.addEventListener("click", async () => {
      await handleSyncNow();
    });
  }

  if (dom.authLoginBtn) {
    dom.authLoginBtn.addEventListener("click", async () => {
      await handleAuthLogin();
    });
  }
  if (dom.authRegisterBtn) {
    dom.authRegisterBtn.addEventListener("click", async () => {
      await handleAuthRegister();
    });
  }
  if (dom.authLogoutBtn) {
    dom.authLogoutBtn.addEventListener("click", async () => {
      await handleAuthLogout();
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      return;
    }
    if (!isSharedStoreActive()) {
      return;
    }
    scheduleRemotePull("tab_visible", { immediate: true });
  });

  if (dom.importLocalBtn) {
    dom.importLocalBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "Lokale Produkte/Settings in den gemeinsamen Workspace importieren? Bestehende Remote-Daten werden ersetzt.",
      );
      if (!confirmed) {
        return;
      }
      const imported = await importLocalDataIntoSharedWorkspace();
      if (imported) {
        await flushRemoteProductsSave();
        await flushRemoteSettingsSave();
        renderAll();
      }
    });
  }

  if (dom.costCategoryGrid) {
    dom.costCategoryGrid.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const toggle = target.closest("[data-category-toggle]");
      if (toggle instanceof HTMLElement) {
        const key = toggle.dataset.categoryToggle;
        if (!key) {
          return;
        }
        const current = Boolean(state.ui.costCategoryExpanded?.[key]);
        state.ui.costCategoryExpanded[key] = !current;
        renderComputedViews();
        return;
      }

      const row = target.closest("li.clickable-row");
      if (!(row instanceof HTMLElement)) {
        return;
      }

      const labelText = row.dataset.lineLabel ?? "";
      let driverPaths = [];
      try {
        driverPaths = JSON.parse(row.dataset.driverPaths ?? "[]");
      } catch (_error) {
        driverPaths = [];
      }

      const valueText = row.querySelector("strong")?.textContent?.trim() ?? "";
      const explain = row.dataset.lineExplain ?? "";
      const formula = row.dataset.lineFormula ?? "";
      const source = row.dataset.lineSource ?? "";
      const robustness = row.dataset.lineRobustness ?? "";

      openDriverModal({
        title: labelText,
        value: valueText,
        explain,
        formula,
        source,
        robustness,
        driverPaths,
      });
    });
  }

  if (dom.addProductBtn) {
    dom.addProductBtn.addEventListener("click", addProduct);
  }
  if (dom.duplicateProductBtn) {
    dom.duplicateProductBtn.addEventListener("click", duplicateProduct);
  }
  if (dom.deleteProductBtn) {
    dom.deleteProductBtn.addEventListener("click", deleteProduct);
  }

  if (dom.driverModalCloseBtn) {
    dom.driverModalCloseBtn.addEventListener("click", () => closeDriverModal());
  }
  if (dom.driverModal) {
    dom.driverModal.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.dataset.modalClose === "true") {
        closeDriverModal();
      }
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    closeInlineHelpNotes();
    if (state.ui.driverModal) {
      closeDriverModal();
    }
  });

  if (!dom.comparisonBody) {
    if (APP_PAGE === "settings") {
      document.querySelectorAll('.settings-chain-nav a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
          const href = anchor.getAttribute("href");
          if (!href || !href.startsWith("#")) {
            return;
          }
          const target = document.querySelector(href);
          if (!(target instanceof HTMLElement)) {
            return;
          }
          const details = target.tagName.toLowerCase() === "details" ? target : target.closest("details");
          if (details instanceof HTMLDetailsElement) {
            details.open = true;
          }
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          event.preventDefault();
        });
      });
    }
    return;
  }
  dom.comparisonBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest("[data-select-product]");
    if (!(button instanceof HTMLElement)) {
      return;
    }

    const id = button.dataset.selectProduct;
    if (!id) {
      return;
    }

    if (!state.products.find((product) => product.id === id)) {
      return;
    }

    state.selectedId = id;
    setWorkspaceTab("product");
    renderAll();
  });
}

function scrollToHashSectionIfPresent() {
  if (!window.location.hash) {
    return;
  }
  const target = document.querySelector(window.location.hash);
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const details = target.tagName.toLowerCase() === "details" ? target : target.closest("details");
  if (details instanceof HTMLDetailsElement) {
    details.open = true;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPageAfterLoad() {
  if (isSharedStoreActive()) {
    startRealtimeSync();
  } else {
    stopRealtimeSync();
  }
  renderCategoryDefaultsAdmin();
  setStorageModeLabel();
  setSessionInfoText();

  if (dom.importLocalBtn) {
    const showImport =
      APP_PAGE === "product" &&
      state.storage.adapter?.type === "shared" &&
      state.session.isAuthenticated &&
      state.session.hasWorkspaceAccess &&
      state.session.pendingLocalImport;
    dom.importLocalBtn.classList.toggle("hidden", !showImport);
  }

  if (APP_PAGE === "settings") {
    renderSettingsInputs();
    applyMouseoverHelp();
    scrollToHashSectionIfPresent();
    return;
  }

  renderFxStatus();
  renderAll();
}

async function init() {
  bindEvents();
  exposeSyncDebug();

  await bootstrapCollaborationSession();
  setStorageModeLabel();
  setSessionInfoText();

  if (state.session.requiresAuth && (!state.session.isAuthenticated || !state.session.hasWorkspaceAccess)) {
    if (!state.session.isAuthenticated) {
      setAppMode("auth_required", "Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
    } else {
      setAppMode("no_access", "Kein Zugriff auf Workspace.");
    }
    return;
  }

  if (state.storage.mode === "shared") {
    setAppMode("ready_shared");
  } else {
    setAppMode("ready_local");
  }
  renderPageAfterLoad();
  refreshFxRate();
}

init().catch((error) => {
  console.error("App init failed", error);
  stopRealtimeSync();
  setAuthStatus("Initialisierung fehlgeschlagen. Fallback auf lokale Daten.", true);
  setAppMode("ready_local");
  loadSettingsLocal();
  loadProductsLocal();
  selectFirstProductIfNeeded();
  renderPageAfterLoad();
});
