const STORAGE_KEY_PRODUCTS = "fba-margin-calculator.8020.v3.products";
const STORAGE_KEY_SETTINGS = "fba-margin-calculator.8020.v3.settings";
const LEGACY_STORAGE_KEY = "fba-margin-calculator.8020.v2";
const APP_PAGE = document.body?.dataset?.page === "settings" ? "settings" : "product";

const MIN_REFERRAL_FEE = 0.3;
const DEFAULT_USD_TO_EUR = 0.92;
const FX_ENDPOINT = "https://api.frankfurter.app/latest?from=USD&to=EUR";
const SUPABASE_CONFIG_ENDPOINT = "/api/config";
const REMOTE_SAVE_DEBOUNCE_MS = 350;

const MARKETPLACE_VAT = {
  DE: 19,
  FR: 20,
  IT: 22,
  ES: 21,
};

const WORKFLOW_STAGES = ["quick", "validation", "deep_dive"];
const STAGE_LABELS = {
  quick: "Quick-Check",
  validation: "Validation",
  deep_dive: "Deep-Dive",
};
const STAGE_VISIBILITY = {
  quick: { topN: 10 },
  validation: { topN: 20 },
  deep_dive: { topN: Number.POSITIVE_INFINITY },
};

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
    resaleRate: 45,
    unsellableShare: 55,
    targetMarginPct: 15,
  },
  beauty: {
    label: "Beauty",
    referralRate: 15,
    tacosRate: 14,
    returnRate: 4,
    resaleRate: 52,
    unsellableShare: 48,
    targetMarginPct: 16,
  },
  electronics: {
    label: "Elektronik",
    referralRate: 8,
    tacosRate: 10,
    returnRate: 8,
    resaleRate: 40,
    unsellableShare: 60,
    targetMarginPct: 14,
  },
  apparel: {
    label: "Bekleidung",
    referralRate: 15,
    tacosRate: 16,
    returnRate: 12,
    resaleRate: 36,
    unsellableShare: 64,
    targetMarginPct: 18,
  },
  pet: {
    label: "Haustier",
    referralRate: 15,
    tacosRate: 11,
    returnRate: 6,
    resaleRate: 46,
    unsellableShare: 54,
    targetMarginPct: 15,
  },
  generic: {
    label: "Sonstiges",
    referralRate: 15,
    tacosRate: 12,
    returnRate: 7,
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

const RAIL_SHIPPING_V3_DEFAULTS = {
  rateEurPerCbm: 164.7,
  originBaseEurPerShipment: 36.69,
  originPerCartonEur: 0.285,
  mainRunFixedEurPerShipment: 185,
  deOncarriageBaseEurPerShipment: 300,
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
        originPerCartonEur: RAIL_SHIPPING_V3_DEFAULTS.originPerCartonEur,
        mainRunFixedEurPerShipment: RAIL_SHIPPING_V3_DEFAULTS.mainRunFixedEurPerShipment,
        deOncarriageBaseEurPerShipment: RAIL_SHIPPING_V3_DEFAULTS.deOncarriageBaseEurPerShipment,
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

const FBA_STANDARD_TIERS = [
  {
    key: "small_1",
    label: "Kleines Paket 1",
    maxDims: [35, 25, 7],
    maxWeightG: 3900,
    baseFee: 3.3,
    stepFee: 0.05,
  },
  {
    key: "small_2",
    label: "Kleines Paket 2",
    maxDims: [35, 25, 9],
    maxWeightG: 3900,
    baseFee: 3.34,
    stepFee: 0.06,
  },
  {
    key: "small_3",
    label: "Kleines Paket 3",
    maxDims: [35, 25, 12],
    maxWeightG: 3900,
    baseFee: 3.38,
    stepFee: 0.07,
  },
  {
    key: "medium_1",
    label: "Mittelgrosses Paket 1",
    maxDims: [40, 30, 6],
    maxWeightG: 11900,
    baseFee: 3.5,
    stepFee: 0.07,
  },
  {
    key: "medium_2",
    label: "Mittelgrosses Paket 2",
    maxDims: [40, 30, 20],
    maxWeightG: 11900,
    baseFee: 3.73,
    stepFee: 0.07,
  },
  {
    key: "large_1",
    label: "Grosses Paket 1",
    maxDims: [45, 34, 10],
    maxWeightG: 11900,
    baseFee: 3.97,
    stepFee: 0.07,
  },
  {
    key: "large_2",
    label: "Grosses Paket 2",
    maxDims: [45, 34, 26],
    maxWeightG: 11900,
    baseFee: 4.38,
    stepFee: 0.08,
  },
];

const FIELD_HELP = {
  name: "Interner Produktname zur Vergleichbarkeit in der Multi-Produkt-Ansicht.",
  "basic.priceGross": "Brutto-Verkaufspreis in EUR (inkl. USt.). Netto = Brutto / (1 + USt).",
  "basic.category": "Kategorie steuert Defaults wie TACoS, Retouren, Referral Fee und Zielmarge.",
  "basic.demandValue": "Absatzannahme je Tag oder Monat. Daraus werden Monats- und Zeitraum-Units berechnet.",
  "basic.demandBasis": "Wähle, ob die Absatzannahme pro Tag oder pro Monat gilt.",
  "basic.horizonMonths": "Betrachtungszeitraum in Monaten; verteilt Launch-Kosten und bestimmt ROI/Payback.",
  "basic.netWeightG": "Produktgewicht netto in Gramm; relevant für Kartonisierung, FBA-Tier und Shipping.",
  "basic.packLengthCm": "Verpackungslänge in cm je Einheit.",
  "basic.packWidthCm": "Verpackungsbreite in cm je Einheit.",
  "basic.packHeightCm": "Verpackungshöhe in cm je Einheit.",
  "basic.unitsPerOrder": "Typische PO-Menge in Einheiten pro Import-Order. Basis für Door-to-Door Shipping/Unit.",
  "basic.transportMode": "Transportmodus China -> DE für Door-to-Door Shipping (v1: Rail und Sea LCL).",
  "basic.exwUnit": "Einkaufspreis EXW in USD. Wird mit aktuellem USD→EUR Kurs umgerechnet.",
  "basic.marketplace": "Marktplatz setzt die lokale USt für Brutto→Netto Berechnung.",
  "basic.fulfillmentModel": "Fulfillment-Flag. v1 rechnet FBA.",
  "basic.launchBudgetTotal": "Einmaliges Launch-Budget in EUR; wird auf Zeitraum amortisiert.",
  "basic.listingPackage": "Auswahl der Listing-Serviceklasse. Preise kommen aus globalen Settings.",
  "basic.launchCompetition": "Wettbewerbsniveau der Nische. Steuert Launch-Boost auf TACoS und Einführungspreis.",

  "assumptions.ads.tacosRate": "TACoS in % vom Netto-Umsatz. Ads-Kosten je Stück = Netto-Preis × TACoS.",
  "assumptions.ads.launchMultiplier": "Multiplikator für TACoS in den ersten Launch-Monaten.",
  "assumptions.ads.launchMonths": "Anzahl Monate mit erhöhtem TACoS durch Launch-Multiplier.",

  "assumptions.returns.returnRate": "Retourenquote in % der Verkäufe.",
  "assumptions.returns.resaleRate": "Anteil der Retouren, der wiederverkauft werden kann.",
  "assumptions.returns.unsellableShare": "Anteil der Retouren, der nicht wiederverkauft werden kann.",
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
  "assumptions.cartonization.manualEnabled": "Aktiviert einen manuellen Packing-List-Override für Units/Karton.",
  "assumptions.cartonization.unitsPerCarton": "Manuelle Units pro Umkarton aus realer Packing List.",
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
  "shipping12m.modes.rail.originPerCartonEur": "Rail Vorlauf variabel je Karton in EUR.",
  "shipping12m.modes.rail.originFixedEurPerShipment": "Legacy-Feld für Rail Vorlauf-Fixkosten (wird auf Vorlauf-Basis gemappt).",
  "shipping12m.modes.rail.mainRunFixedEurPerShipment": "12-Monats-Durchschnitt: Rail Hauptlauf-Fixkosten je Shipment in EUR (z. B. THC/Handling).",
  "shipping12m.modes.rail.destinationFixedEurPerShipment": "Legacy-Feld für Rail Hauptlauf-Fixkosten (wird für neue Rail-Logik nicht mehr primär genutzt).",
  "shipping12m.modes.rail.deOncarriageBaseEurPerShipment": "Rail Nachlauf-Fixanteil je Shipment in EUR.",
  "shipping12m.modes.rail.deOncarriagePerCartonEur": "Rail Nachlauf variabel je Karton in EUR.",
  "shipping12m.modes.rail.deOncarriageFixedEurPerShipment": "Legacy-Feld für Rail Nachlauf-Fixkosten (wird auf Nachlauf-Basis gemappt).",
  "shipping12m.customsBrokerEnabled": "Aktiviert optionalen Fixkostenblock für Zollabfertigung.",
  "shipping12m.customsBrokerFixedEurPerShipment": "12-Monats-Durchschnitt: fixer Betrag für Zollabfertigung je Shipment in EUR.",
  "shipping12m.insurance.enabled": "Aktiviert die Versicherungsberechnung im Shipping-Block.",
  "shipping12m.insurance.basis": "Basis der Versicherung (v1: nur Warenwert in EUR).",
  "shipping12m.insurance.ratePct": "Versicherungssatz in % auf die gewählte Versicherungsbasis.",
  "shipping12m.manualSurchargeEnabled": "Aktiviert optionale manuelle Nachbelastung je Shipment (z. B. Advance Commission).",
  "shipping12m.manualSurchargeEurPerShipment": "Manuelle Nachbelastung je Shipment in EUR (nur wenn aktiv).",
  "cartonRules.maxLengthCm": "Maximale Karton-Länge in cm für Auto-Kartonisierung.",
  "cartonRules.maxWidthCm": "Maximale Karton-Breite in cm für Auto-Kartonisierung.",
  "cartonRules.maxHeightCm": "Maximale Karton-Höhe in cm für Auto-Kartonisierung.",
  "cartonRules.maxWeightKg": "Maximales Karton-Gewicht in kg für Auto-Kartonisierung.",
  "cartonRules.packFactor": "Legacy-Parameter aus früherer Volumenlogik (Kompatibilität). Für v1-Schätzung sind Soft-/Hard-Caps, Buffer und Gewichtsaufschlag maßgeblich.",
  "cartonRules.estimationMode": "Schätzmodus für Auto-Kartonisierung: konservativ (Supplier-nah), balanced (Mittelweg), maximal (Kapazität priorisiert).",
  "cartonRules.supplierSoftMaxLengthCm": "Konservatives Supplier-Soft-Cap für Umkarton-Länge in cm.",
  "cartonRules.supplierSoftMaxWidthCm": "Konservatives Supplier-Soft-Cap für Umkarton-Breite in cm.",
  "cartonRules.supplierSoftMaxHeightCm": "Konservatives Supplier-Soft-Cap für Umkarton-Höhe in cm.",
  "cartonRules.supplierSoftMaxGrossWeightKg": "Konservatives Supplier-Soft-Cap für Umkarton-Bruttogewicht in kg.",
  "cartonRules.outerBufferCm": "Zusätzlicher Umkarton-Puffer je Achse in cm (Polster/Luft).",
  "cartonRules.grossWeightUpliftPct": "Aufschlag von Netto- auf Bruttogewicht je Unit in %.",
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
  "categoryDefaults.home.resaleRate": "Default Wiederverkaufsquote % für Kategorie Home.",
  "categoryDefaults.home.unsellableShare": "Default Unsellable-Anteil % für Kategorie Home.",
  "categoryDefaults.home.referralRate": "Default Referral Fee % für Kategorie Home.",
  "categoryDefaults.home.targetMarginPct": "Default Zielmarge % für Kategorie Home.",
  "categoryDefaults.beauty.tacosRate": "Default TACoS % für Kategorie Beauty.",
  "categoryDefaults.beauty.returnRate": "Default Retourenquote % für Kategorie Beauty.",
  "categoryDefaults.beauty.resaleRate": "Default Wiederverkaufsquote % für Kategorie Beauty.",
  "categoryDefaults.beauty.unsellableShare": "Default Unsellable-Anteil % für Kategorie Beauty.",
  "categoryDefaults.beauty.referralRate": "Default Referral Fee % für Kategorie Beauty.",
  "categoryDefaults.beauty.targetMarginPct": "Default Zielmarge % für Kategorie Beauty.",
  "categoryDefaults.electronics.tacosRate": "Default TACoS % für Kategorie Elektronik.",
  "categoryDefaults.electronics.returnRate": "Default Retourenquote % für Kategorie Elektronik.",
  "categoryDefaults.electronics.resaleRate": "Default Wiederverkaufsquote % für Kategorie Elektronik.",
  "categoryDefaults.electronics.unsellableShare": "Default Unsellable-Anteil % für Kategorie Elektronik.",
  "categoryDefaults.electronics.referralRate": "Default Referral Fee % für Kategorie Elektronik.",
  "categoryDefaults.electronics.targetMarginPct": "Default Zielmarge % für Kategorie Elektronik.",
  "categoryDefaults.apparel.tacosRate": "Default TACoS % für Kategorie Bekleidung.",
  "categoryDefaults.apparel.returnRate": "Default Retourenquote % für Kategorie Bekleidung.",
  "categoryDefaults.apparel.resaleRate": "Default Wiederverkaufsquote % für Kategorie Bekleidung.",
  "categoryDefaults.apparel.unsellableShare": "Default Unsellable-Anteil % für Kategorie Bekleidung.",
  "categoryDefaults.apparel.referralRate": "Default Referral Fee % für Kategorie Bekleidung.",
  "categoryDefaults.apparel.targetMarginPct": "Default Zielmarge % für Kategorie Bekleidung.",
  "categoryDefaults.pet.tacosRate": "Default TACoS % für Kategorie Haustier.",
  "categoryDefaults.pet.returnRate": "Default Retourenquote % für Kategorie Haustier.",
  "categoryDefaults.pet.resaleRate": "Default Wiederverkaufsquote % für Kategorie Haustier.",
  "categoryDefaults.pet.unsellableShare": "Default Unsellable-Anteil % für Kategorie Haustier.",
  "categoryDefaults.pet.referralRate": "Default Referral Fee % für Kategorie Haustier.",
  "categoryDefaults.pet.targetMarginPct": "Default Zielmarge % für Kategorie Haustier.",
  "categoryDefaults.generic.tacosRate": "Default TACoS % für Kategorie Sonstiges.",
  "categoryDefaults.generic.returnRate": "Default Retourenquote % für Kategorie Sonstiges.",
  "categoryDefaults.generic.resaleRate": "Default Wiederverkaufsquote % für Kategorie Sonstiges.",
  "categoryDefaults.generic.unsellableShare": "Default Unsellable-Anteil % für Kategorie Sonstiges.",
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
  "settings.shipping12m.modes.rail.originPerCartonEur": "Rail Vorlauf variabel (EUR/Karton)",
  "settings.shipping12m.modes.rail.originFixedEurPerShipment": "Rail Vorlauf fix (legacy, EUR/Shipment)",
  "settings.shipping12m.modes.rail.mainRunFixedEurPerShipment": "Rail Hauptlauf fix (EUR/Shipment)",
  "settings.shipping12m.modes.rail.destinationFixedEurPerShipment": "Rail Hauptlauf fix (legacy, EUR/Shipment)",
  "settings.shipping12m.modes.rail.deOncarriageBaseEurPerShipment": "Rail Nachlauf Basis (EUR/Shipment)",
  "settings.shipping12m.modes.rail.deOncarriagePerCartonEur": "Rail Nachlauf variabel (EUR/Karton)",
  "settings.shipping12m.modes.rail.deOncarriageFixedEurPerShipment": "Rail Nachlauf fix (legacy, EUR/Shipment)",
  "settings.shipping12m.customsBrokerEnabled": "Zollabfertigung aktiv",
  "settings.shipping12m.customsBrokerFixedEurPerShipment": "Zollabfertigung fix (EUR/Shipment)",
  "settings.shipping12m.insurance.enabled": "Versicherung aktiv",
  "settings.shipping12m.insurance.basis": "Versicherungsbasis",
  "settings.shipping12m.insurance.ratePct": "Versicherungssatz (%)",
  "settings.shipping12m.manualSurchargeEnabled": "Nachbelastung aktiv",
  "settings.shipping12m.manualSurchargeEurPerShipment": "Nachbelastung (EUR/Shipment)",
  "settings.cartonRules.maxLengthCm": "Karton max Länge (cm)",
  "settings.cartonRules.maxWidthCm": "Karton max Breite (cm)",
  "settings.cartonRules.maxHeightCm": "Karton max Höhe (cm)",
  "settings.cartonRules.maxWeightKg": "Karton max Gewicht (kg)",
  "settings.cartonRules.packFactor": "Packfaktor (Legacy)",
  "settings.cartonRules.estimationMode": "Schätzmodus (konservativ/balanced/maximal)",
  "settings.cartonRules.supplierSoftMaxLengthCm": "Supplier Soft-Cap Länge (cm)",
  "settings.cartonRules.supplierSoftMaxWidthCm": "Supplier Soft-Cap Breite (cm)",
  "settings.cartonRules.supplierSoftMaxHeightCm": "Supplier Soft-Cap Höhe (cm)",
  "settings.cartonRules.supplierSoftMaxGrossWeightKg": "Supplier Soft-Cap Bruttogewicht (kg)",
  "settings.cartonRules.outerBufferCm": "Outer Buffer je Achse (cm)",
  "settings.cartonRules.grossWeightUpliftPct": "Gewichtsaufschlag netto->brutto (%)",
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

const DERIVED_DRIVER_MAP = {
  "derived.shipping.unitsPerOrder": {
    label: "PO-Menge (Units pro Order)",
    help: "Units pro Import-Order (PO), Basis für carton-basierte Umrechnung.",
    format: "number",
    read: (metrics) => metrics.shipping.unitsPerOrder,
  },
  "derived.shipping.unitsPerCartonAuto": {
    label: "Units je Umkarton (auto/manuell)",
    help: "Units pro Umkarton aus Supplier-Soft-Caps/Hard-Fallback oder manuellem Packing-List-Override.",
    format: "number",
    read: (metrics) => metrics.shipping.unitsPerCartonAuto,
  },
  "derived.shipping.cartonsCount": {
    label: "Anzahl Umkartons",
    help: "Kartonanzahl = ceil(PO Units / units_per_carton_auto).",
    format: "number",
    read: (metrics) => metrics.shipping.cartonsCount,
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
    label: "Abrechnungsvolumen (Chargeable CBM)",
    help: "Abrechnungsvolumen nach W/M = max(CBM, Gewicht/1000).",
    format: "number",
    read: (metrics) => metrics.shipping.chargeableCbm,
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
    help: "Quelle der Kartonisierung: Auto mit Soft-Caps, Hard-Fallback oder manueller Override.",
    format: "string",
    read: (metrics) => metrics.shipping.cartonizationSourceLabel ?? metrics.shipping.cartonizationSource,
  },
  "derived.shipping.goodsValueEur": {
    label: "Warenwert (EUR)",
    help: "Warenwert in EUR = EXW USD × PO Units × USD->EUR.",
    format: "currency",
    read: (metrics) => metrics.shipping.goodsValueEur,
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
  "returns.resaleRate": { score: 40, why: "Wiederverkauf hängt stark von Zustand und Kategorie ab." },
  "returns.unsellableShare": { score: 35, why: "Unsellable-Anteile sind erfahrungsgemäß volatil." },
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
const SETTINGS_STRING_PATHS = new Set(["shipping12m.insurance.basis", "cartonRules.estimationMode"]);

const OVERRIDE_CONTROL_MAP = [
  ["assumptions.ads.overrideTacos", "assumptions.ads.tacosRate"],
  ["assumptions.ads.overrideLaunchMultiplier", "assumptions.ads.launchMultiplier"],
  ["assumptions.ads.overrideLaunchMonths", "assumptions.ads.launchMonths"],
  ["assumptions.returns.overrideReturnRate", "assumptions.returns.returnRate"],
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
  stageGateStatus: document.getElementById("stageGateStatus"),
  stageWarning: document.getElementById("stageWarning"),
  quickStagePanel: document.getElementById("quickStagePanel"),
  validationReviewPanel: document.getElementById("validationReviewPanel"),
  validationReviewStatus: document.getElementById("validationReviewStatus"),
  validationReviewList: document.getElementById("validationReviewList"),
  deepDiveReviewPanel: document.getElementById("deepDiveReviewPanel"),
  deepDiveReviewStatus: document.getElementById("deepDiveReviewStatus"),
  deepDiveReviewList: document.getElementById("deepDiveReviewList"),
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
  cartonPresetSelect: document.getElementById("cartonPresetSelect"),
  categoryDefaultsAdmin: document.getElementById("categoryDefaultsAdmin"),
  shippingMethodText: document.getElementById("shippingMethodText"),
  shippingDetailList: document.getElementById("shippingDetailList"),
  shippingDebugInfo: document.getElementById("shippingDebugInfo"),
  shippingCartonUnits: document.getElementById("shippingCartonUnits"),
  shippingCartonDims: document.getElementById("shippingCartonDims"),
  shippingCartonWeight: document.getElementById("shippingCartonWeight"),
  shippingCartonSource: document.getElementById("shippingCartonSource"),
  basicShippingUnit: document.getElementById("basicShippingUnit"),
  basicShippingMeta: document.getElementById("basicShippingMeta"),
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
      `${prefix}.originPerCartonEur`,
      `${prefix}.mainRunFixedEurPerShipment`,
      `${prefix}.deOncarriageBaseEurPerShipment`,
      `${prefix}.deOncarriagePerCartonEur`,
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
    return [`${prefix}.originBaseEurPerShipment`, `${prefix}.originPerCartonEur`];
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
    return [`${prefix}.deOncarriageBaseEurPerShipment`, `${prefix}.deOncarriagePerCartonEur`];
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
    "settings.cartonRules.estimationMode",
    "settings.cartonRules.maxLengthCm",
    "settings.cartonRules.maxWidthCm",
    "settings.cartonRules.maxHeightCm",
    "settings.cartonRules.maxWeightKg",
    "settings.cartonRules.supplierSoftMaxLengthCm",
    "settings.cartonRules.supplierSoftMaxWidthCm",
    "settings.cartonRules.supplierSoftMaxHeightCm",
    "settings.cartonRules.supplierSoftMaxGrossWeightKg",
    "settings.cartonRules.outerBufferCm",
    "settings.cartonRules.grossWeightUpliftPct",
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
  settings.shipping12m.modes.rail.originPerCartonEur = RAIL_SHIPPING_V3_DEFAULTS.originPerCartonEur;
  settings.shipping12m.modes.rail.mainRunFixedEurPerShipment = RAIL_SHIPPING_V3_DEFAULTS.mainRunFixedEurPerShipment;
  settings.shipping12m.modes.rail.deOncarriageBaseEurPerShipment = RAIL_SHIPPING_V3_DEFAULTS.deOncarriageBaseEurPerShipment;
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
    item.resaleRate = clamp(num(item.resaleRate, 42), 0, 100);
    item.unsellableShare = clamp(num(item.unsellableShare, 58), 0, 100);
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

  merged.basic.horizonMonths = clamp(roundInt(merged.basic.horizonMonths, base.basic.horizonMonths), 1, 36);
  merged.basic.unitsPerOrder = Math.max(1, roundInt(merged.basic.unitsPerOrder, base.basic.unitsPerOrder));
  merged.basic.netWeightG = Math.max(0, num(merged.basic.netWeightG, base.basic.netWeightG));
  if (!WORKFLOW_STAGES.includes(merged.workflow.stage)) {
    merged.workflow.stage = "quick";
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
  if (state.sync.lastRemoteSuccessAt) {
    dom.sessionInfo.textContent = `${base} · Letzter Sync: ${formatDate(state.sync.lastRemoteSuccessAt)}`;
    return;
  }
  dom.sessionInfo.textContent = `${base} · Sync läuft`;
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
  try {
    if (window.APP_CONFIG?.supabaseUrl && window.APP_CONFIG?.supabaseAnonKey) {
      return {
        supabaseUrl: window.APP_CONFIG.supabaseUrl,
        supabaseAnonKey: window.APP_CONFIG.supabaseAnonKey,
      };
    }
    const response = await fetch(SUPABASE_CONFIG_ENDPOINT, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    if (!payload?.supabaseUrl || !payload?.supabaseAnonKey) {
      return null;
    }
    return payload;
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

  setAppMode("ready_shared");
  return true;
}

async function setLocalMode() {
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
  };
}

async function bootstrapCollaborationSession() {
  setAppMode("loading", "Session wird geladen ...");

  // Lokale Basis nur als Fallback laden, ohne Shared-Modus vorzutäuschen.
  state.storage.mode = "local";
  state.storage.adapter = createLocalStoreAdapter();
  setStorageModeLabel();
  loadSettingsLocal();
  loadProductsLocal();
  selectFirstProductIfNeeded();

  let client = null;
  try {
    client = await withTimeout(createSupabaseClientFromConfig(), 8000, "supabase_client");
  } catch (clientError) {
    console.error("Supabase client init failed", clientError);
    configureSessionState({
      requiresAuth: true,
      isAuthenticated: false,
      hasWorkspaceAccess: false,
      pendingLocalImport: false,
    });
    setAppMode("auth_required", "Supabase ist aktuell nicht erreichbar. Bitte Seite neu laden.");
    setAuthStatus("Supabase-Initialisierung timeout/fehlerhaft.", true);
    return;
  }
  if (!client) {
    configureSessionState({
      requiresAuth: true,
      isAuthenticated: false,
      hasWorkspaceAccess: false,
      pendingLocalImport: false,
    });
    setAppMode("auth_required", "Supabase ist aktuell nicht erreichbar. Bitte Seite neu laden.");
    return;
  }

  state.supabase.client = client;
  configureSessionState({
    requiresAuth: true,
    isAuthenticated: false,
    hasWorkspaceAccess: false,
    pendingLocalImport: false,
  });

  if (!state.supabase.authSubscribed) {
    state.supabase.authSubscribed = true;
    client.auth.onAuthStateChange(async (event, session) => {
      // Die Initial-Session wird direkt über getSession() behandelt.
      if (event === "INITIAL_SESSION") {
        return;
      }

      const user = session?.user ?? null;
      if (!user) {
        state.storage.mode = "local";
        state.storage.adapter = createLocalStoreAdapter();
        setStorageModeLabel();
        configureSessionState({
          requiresAuth: true,
          isAuthenticated: false,
          hasWorkspaceAccess: false,
          pendingLocalImport: false,
        });
        setAppMode("auth_required", "Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
        return;
      }

      try {
        const activated = await activateSharedWorkspace(user);
        if (!activated) {
          return;
        }
        setAppMode("ready_shared");
        renderPageAfterLoad();
      } catch (error) {
        console.error("Supabase auth state change failed", error);
        setAuthStatus("Supabase Session konnte nicht aktualisiert werden.", true);
        setAppMode("auth_required", "Bitte erneut anmelden oder Workspace-Zugriff prüfen.");
      }
    });
  }

  let data = null;
  let error = null;
  try {
    const result = await withTimeout(client.auth.getSession(), 8000, "supabase_get_session");
    data = result?.data ?? null;
    error = result?.error ?? null;
  } catch (sessionError) {
    console.error("Supabase session load timeout", sessionError);
    setAppMode("auth_required", "Session-Check timeout. Bitte Seite neu laden und erneut anmelden.");
    setAuthStatus("Session-Check timeout. Bitte neu laden.", true);
    return;
  }
  if (error) {
    console.error("Supabase session load failed", error);
  }

  const user = data?.session?.user ?? null;
  if (!user) {
    setAppMode("auth_required", "Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
    return;
  }

  try {
    const activated = await activateSharedWorkspace(user);
    if (!activated) {
      return;
    }
    setAppMode("ready_shared");
  } catch (activateError) {
    console.error("Supabase workspace activation failed", activateError);
    setAppMode("auth_required", "Supabase-Verbindung fehlgeschlagen. Bitte später erneut versuchen.");
    setAuthStatus("Supabase-Verbindung fehlgeschlagen. Bitte später erneut versuchen.", true);
  }
}

async function handleAuthLogin() {
  if (!state.supabase.client) {
    setAuthStatus("Supabase ist nicht konfiguriert.", true);
    return;
  }
  const email = String(dom.authEmail?.value ?? "").trim();
  const password = String(dom.authPassword?.value ?? "");
  if (!email || !password) {
    setAuthStatus("Bitte E-Mail und Passwort eingeben.", true);
    return;
  }

  setAuthStatus("Anmeldung läuft ...");

  const { data, error } = await state.supabase.client.auth.signInWithPassword({ email, password });
  if (error) {
    setAppMode("auth_required", "Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
    setAuthStatus("Anmeldung fehlgeschlagen: " + error.message, true);
    return;
  }

  setAuthStatus("Anmeldung erfolgreich. Workspace wird geladen ...");

  // Primär wird über onAuthStateChange aktiviert. Falls der Event ausbleibt, hier direkter Fallback.
  const user = data?.user ?? data?.session?.user ?? null;
  if (!user) {
    return;
  }
  try {
    const activated = await activateSharedWorkspace(user);
    if (activated) {
      setAppMode("ready_shared");
      renderPageAfterLoad();
    }
  } catch (activateError) {
    console.error("Workspace activation after login failed", activateError);
    setAuthStatus("Workspace konnte nach Login nicht geladen werden.", true);
    setAppMode("auth_required", "Bitte erneut anmelden oder Workspace-Zugriff prüfen.");
  }
}

async function handleAuthRegister() {
  if (!state.supabase.client) {
    setAuthStatus("Supabase ist nicht konfiguriert.", true);
    return;
  }
  const email = String(dom.authEmail?.value ?? "").trim();
  const password = String(dom.authPassword?.value ?? "");
  if (!email || !password) {
    setAuthStatus("Bitte E-Mail und Passwort eingeben.", true);
    return;
  }
  setAuthStatus("Registrierung läuft ...");
  const { error, data } = await state.supabase.client.auth.signUp({ email, password });
  if (error) {
    setAuthStatus(`Registrierung fehlgeschlagen: ${error.message}`, true);
    return;
  }
  const hasSession = Boolean(data?.session?.user);
  setAuthStatus(
    hasSession
      ? "Registrierung erfolgreich."
      : "Registrierung angelegt. Bitte E-Mail bestätigen und danach anmelden.",
  );
}

async function handleAuthLogout() {
  if (!state.supabase.client) {
    return;
  }

  await state.supabase.client.auth.signOut();
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

  setAuthStatus("Abgemeldet.");
  setAppMode("auth_required", "Bitte anmelden, um auf den gemeinsamen Workspace zuzugreifen.");
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
          Wiederverkauf %
          <input data-settings-path="categoryDefaults.${key}.resaleRate" type="number" min="0" max="100" step="0.1" />
        </label>
        <label>
          Unsellable %
          <input data-settings-path="categoryDefaults.${key}.unsellableShare" type="number" min="0" max="100" step="0.1" />
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

function estimateFbaFee(product, resolved) {
  if (resolved.useManualFbaFee) {
    return {
      fee: Math.max(0, num(resolved.manualFbaFee)),
      tierLabel: "Manuell",
      source: "manual",
    };
  }

  const dims = toSortedDims(
    product.basic.packLengthCm,
    product.basic.packWidthCm,
    product.basic.packHeightCm,
  );
  const actualWeight = Math.max(0, num(product.basic.netWeightG));
  const volumetricWeight =
    (Math.max(0, num(product.basic.packLengthCm)) *
      Math.max(0, num(product.basic.packWidthCm)) *
      Math.max(0, num(product.basic.packHeightCm))) /
    5000;
  const shippingWeightG = Math.max(actualWeight, volumetricWeight * 1000);

  for (const tier of FBA_STANDARD_TIERS) {
    if (!dimsFit(dims, tier.maxDims)) {
      continue;
    }
    if (shippingWeightG > tier.maxWeightG) {
      continue;
    }
    const addSteps = Math.max(0, Math.ceil((shippingWeightG - 100) / 100));
    const fee = tier.baseFee + addSteps * tier.stepFee;
    return {
      fee: round2(fee),
      tierLabel: tier.label,
      source: "auto",
    };
  }

  return {
    fee: Math.max(0, num(resolved.manualFbaFee)),
    tierLabel: "Kein Standard-Tier (Fallback manuell)",
    source: "fallback",
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
  if (source === "auto_soft") {
    return "Auto (Supplier Soft-Caps)";
  }
  return "Auto (Hard-Cap Fallback)";
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
  const softCaps = {
    lengthCm: Math.max(1, num(rules.supplierSoftMaxLengthCm, 40)),
    widthCm: Math.max(1, num(rules.supplierSoftMaxWidthCm, 40)),
    heightCm: Math.max(1, num(rules.supplierSoftMaxHeightCm, 35)),
    weightKg: Math.max(1, num(rules.supplierSoftMaxGrossWeightKg, 18)),
  };
  const outerBufferCm = clamp(num(rules.outerBufferCm, 1.5), 0, 20);
  const grossWeightUpliftPct = clamp(num(rules.grossWeightUpliftPct, 5), 0, 50);
  const estimationMode = ["conservative", "balanced", "maximal"].includes(rules.estimationMode)
    ? rules.estimationMode
    : "conservative";
  const unitWeightKgGross = unitWeightKgNet * (1 + grossWeightUpliftPct / 100);

  const unitDimsSorted = toSortedDims(lengthCm, widthCm, heightCm);
  const hardDimsSorted = toSortedDims(hardCaps.lengthCm, hardCaps.widthCm, hardCaps.heightCm);
  const oversizeFlag = unitDimsSorted[0] > hardDimsSorted[0] || unitDimsSorted[1] > hardDimsSorted[1] || unitDimsSorted[2] > hardDimsSorted[2];

  const candidates = buildCartonCandidates({
    unitDims: [lengthCm, widthCm, heightCm],
    unitCbm,
    unitGrossKg: unitWeightKgGross,
    hardCaps,
    softCaps,
    outerBufferCm,
  });

  const selectedAuto = selectCartonCandidateByMode(candidates, estimationMode, hardCaps, softCaps);

  const assumptionsCarton = product.assumptions?.cartonization ?? {};
  const manualEnabled = Boolean(assumptionsCarton.manualEnabled);
  const manualUnitsPerCarton = Math.max(1, roundInt(assumptionsCarton.unitsPerCarton, selectedAuto?.units ?? 1));

  let unitsPerCartonAuto = selectedAuto?.units ?? 1;
  let estimatedCartonLengthCm = selectedAuto?.cartonLengthCm ?? (lengthCm + outerBufferCm);
  let estimatedCartonWidthCm = selectedAuto?.cartonWidthCm ?? (widthCm + outerBufferCm);
  let estimatedCartonHeightCm = selectedAuto?.cartonHeightCm ?? (heightCm + outerBufferCm);
  let estimatedCartonGrossWeightKg = selectedAuto?.cartonGrossKg ?? (unitWeightKgGross * unitsPerCartonAuto);
  let cartonizationSource = selectedAuto?.softValid ? "auto_soft" : "auto_hard_fallback";

  if (manualEnabled) {
    unitsPerCartonAuto = manualUnitsPerCarton;
    const manualLengthCm = Math.max(0, num(assumptionsCarton.cartonLengthCm, 0));
    const manualWidthCm = Math.max(0, num(assumptionsCarton.cartonWidthCm, 0));
    const manualHeightCm = Math.max(0, num(assumptionsCarton.cartonHeightCm, 0));
    const manualGrossKg = Math.max(0, num(assumptionsCarton.cartonGrossWeightKg, 0));

    if (manualLengthCm > 0 && manualWidthCm > 0 && manualHeightCm > 0) {
      estimatedCartonLengthCm = manualLengthCm;
      estimatedCartonWidthCm = manualWidthCm;
      estimatedCartonHeightCm = manualHeightCm;
    } else {
      const estimatedForManualUnits = estimateCartonForExactUnits({
        unitDims: [lengthCm, widthCm, heightCm],
        unitGrossKg: unitWeightKgGross,
        hardCaps,
        softCaps,
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

    if (manualGrossKg > 0) {
      estimatedCartonGrossWeightKg = manualGrossKg;
    } else if (!Number.isFinite(estimatedCartonGrossWeightKg) || estimatedCartonGrossWeightKg <= 0) {
      estimatedCartonGrossWeightKg = unitsPerCartonAuto * unitWeightKgGross;
    }
    cartonizationSource = "manual_override";
  }

  const cartonsCount = Math.max(1, Math.ceil(unitsPerOrder / Math.max(1, unitsPerCartonAuto)));
  const cartonCbm = Math.max(
    0.000001,
    (estimatedCartonLengthCm * estimatedCartonWidthCm * estimatedCartonHeightCm) / 1_000_000,
  );
  const shipmentCbm = cartonsCount * cartonCbm;

  let shipmentWeightKg = unitsPerOrder * unitWeightKgGross;
  if (manualEnabled && estimatedCartonGrossWeightKg > 0 && unitsPerCartonAuto > 0) {
    const manualGrossPerUnit = estimatedCartonGrossWeightKg / unitsPerCartonAuto;
    shipmentWeightKg = unitsPerOrder * manualGrossPerUnit;
  }
  shipmentWeightKg = Math.max(0.001, shipmentWeightKg);

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
  let originPerCartonEur = 0;
  let deOncarriageBaseEurPerShipment = 0;
  let deOncarriagePerCartonEur = 0;
  let originTotal = 0;
  let deOncarriageTotal = 0;

  if (modeKey === "rail") {
    originBaseEurPerShipment = Math.max(0, num(modeSettings.originBaseEurPerShipment, modeSettings.originFixedEurPerShipment));
    originPerCartonEur = Math.max(0, num(modeSettings.originPerCartonEur, 0));
    deOncarriageBaseEurPerShipment = Math.max(
      0,
      num(modeSettings.deOncarriageBaseEurPerShipment, modeSettings.deOncarriageFixedEurPerShipment),
    );
    deOncarriagePerCartonEur = Math.max(0, num(modeSettings.deOncarriagePerCartonEur, 0));
    originTotal = originBaseEurPerShipment + originPerCartonEur * cartonsCount;
    deOncarriageTotal = deOncarriageBaseEurPerShipment + deOncarriagePerCartonEur * cartonsCount;
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
        ? "Vorlauf = Vorlauf-Basis + (Vorlauf je Karton × Anzahl Umkartons)"
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
        ? "Nachlauf = Nachlauf-Basis + (Nachlauf je Karton × Anzahl Umkartons)"
        : "Nachlauf = de_oncarriage_fixed",
      source: `Global Setting -> Shipping 12M -> ${modeLabel}`,
    },
    {
      key: "broker",
      label: "Zollabfertigung",
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
    ? "Produktkante überschreitet Hard-Cap Kartonmaß. Es wird konservativ mit 1 Unit/Karton weitergerechnet."
    : "";

  return {
    transportMode: modeKey,
    modeKey,
    modeLabel,
    unitCbm,
    unitWeightKg: unitWeightKgNet,
    unitGrossWeightKg: unitWeightKgGross,
    unitsPerOrder,
    unitsPerCartonAuto,
    cartonsCount,
    estimatedCartonLengthCm,
    estimatedCartonWidthCm,
    estimatedCartonHeightCm,
    estimatedCartonGrossWeightKg,
    cartonizationSource,
    cartonizationSourceLabel: cartonizationSourceLabel(cartonizationSource),
    shipmentCbm,
    shipmentWeightKg,
    chargeableCbm,
    goodsValueEur,
    insuranceEnabled,
    insuranceBasis,
    insuranceRatePct,
    insuranceBaseEur,
    originBaseEurPerShipment,
    originPerCartonEur,
    originTotal,
    originFixed: originTotal,
    mainRunVariable,
    mainRunFixed,
    destinationFixed: destinationFixedLegacy,
    deOncarriageBaseEurPerShipment,
    deOncarriagePerCartonEur,
    deOncarriageTotal,
    oncarriageFixed: deOncarriageTotal,
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
  const defaultResaleRate = clamp(category.resaleRate, 0, 100);
  const defaultUnsellableShare = clamp(category.unsellableShare, 0, 100);
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
    defaultResaleRate,
    defaultUnsellableShare,
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
    resaleRate: resolveValue(
      isOverrideActive(assumptions.returns.overrideResaleRate),
      assumptions.returns.resaleRate,
      defaultResaleRate,
      0,
      100,
    ),
    unsellableShare: resolveValue(
      isOverrideActive(assumptions.returns.overrideUnsellableShare),
      assumptions.returns.unsellableShare,
      defaultUnsellableShare,
      0,
      100,
    ),
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
    "returns.resaleRate": assumedText(
      isOverrideActive(assumptions.returns.overrideResaleRate),
      defaultResaleRate,
      resolved.resaleRate,
      formatPercent,
    ),
    "returns.unsellableShare": assumedText(
      isOverrideActive(assumptions.returns.overrideUnsellableShare),
      defaultUnsellableShare,
      resolved.unsellableShare,
      formatPercent,
    ),
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
  if (WORKFLOW_STAGES.includes(stage)) {
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
  const deepDive = product.workflow?.deepDive ?? {};
  const validationReview = getReviewProgress(product, metrics, "validation");
  const deepDiveReview = getReviewProgress(product, metrics, "deep_dive");
  const deepChecklistPass =
    Boolean(deepDive.supplierValidated) &&
    Boolean(deepDive.complianceChecked) &&
    Boolean(deepDive.sampleDecisionReady);

  const quickReady = metrics.priceGrossTarget > 0 && metrics.monthlyUnits > 0;
  const validationReady = validationReview.isReady;
  const deepReady = deepDiveReview.isReady;

  const readinessByStage = {
    quick: quickReady,
    validation: validationReady,
    deep_dive: deepReady,
  };

  const hintByStage = {
    quick:
      "Quick-Check: schnelle Entscheidung mit Top-Kosten. Fülle nur Pflichtfelder aus und prüfe die wichtigsten Treiber in der Lieferkette.",
    validation:
      "Validation: Top-20 Treiber prüfen oder überschreiben. Fokus auf die größten Kostentreiber je Lieferkettenstufe.",
    deep_dive:
      "Deep-Dive: Vollprüfung aller editierbaren kostenrelevanten Treiber.",
  };

  const statusClass = readinessByStage[stage] ? "pass" : (stage === "quick" ? "fail" : "warn");
  let statusText = "Status: in Prüfung";
  if (stage === "quick") {
    statusText = readinessByStage.quick ? "Status: Quick-Check bereit" : "Status: Quick-Check unvollständig";
  } else if (stage === "validation") {
    statusText = validationReady
      ? `Status: Validation bereit (${validationReview.completed}/${validationReview.total})`
      : `Status: Validation ${validationReview.completed}/${validationReview.total} erledigt`;
  } else if (stage === "deep_dive") {
    statusText = deepReady
      ? `Status: Deep-Dive bereit (${deepDiveReview.completed}/${deepDiveReview.total})`
      : `Status: Deep-Dive ${deepDiveReview.completed}/${deepDiveReview.total} erledigt`;
  }

  const blockers = [];
  if (stage === "validation" && !validationReady) {
    blockers.push(`Validation offen: ${validationReview.completed}/${validationReview.total} Top-Treiber erledigt.`);
  }
  if (stage === "deep_dive" && !deepReady) {
    blockers.push(`Deep-Dive offen: ${deepDiveReview.completed}/${deepDiveReview.total} Treiber erledigt.`);
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
    deepPass: deepReady,
    deepChecklistPass,
    readinessByStage,
    hint: hintByStage[stage],
    statusClass,
    statusText,
    blockers,
    kpiWarnings,
    validationReview,
    deepDiveReview,
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

  const fba = estimateFbaFee(product, resolved);

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

  const adsUnit = priceNet * (effectiveTacosRate / 100);

  const returnRate = resolved.returnRate / 100;
  const resaleRate = resolved.resaleRate / 100;
  const unsellableShare = resolved.unsellableShare / 100;
  const sellableShare = Math.max(0, 1 - unsellableShare);
  const sellableLossFactor = Math.max(0, 1 - resaleRate);

  const returnLossUnit =
    returnRate * (unsellableShare * landedUnit + sellableShare * sellableLossFactor * landedUnit);
  const returnHandlingUnit = returnRate * resolved.returnHandlingCost;
  const returnsUnit = returnLossUnit + returnHandlingUnit;

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

  const launchAdsBaseUnit = priceNet * (tacosRate / 100);
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

  const investedCapital = landedUnit * unitsHorizon + launchBudget + listingPackageCost + setupOneOffTotal;
  const productRoiPct = investedCapital > 0 ? (profitHorizon / investedCapital) * 100 : 0;

  const importVatPrefinance = 0;
  const cashCapital = investedCapital;
  const cashRoiPct = cashCapital > 0 ? (profitHorizon / cashCapital) * 100 : 0;

  const paybackBase = launchBudget + listingPackageCost + setupOneOffTotal + landedUnit * monthlyUnits;
  const paybackMonths = profitMonthly > 0 ? paybackBase / profitMonthly : null;

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
    customsMonthly,
    importVatCostMonthly,

    tacosRate,
    effectiveTacosRate,
    adsUnit,
    adsMonthly,
    launchAdsIncrementMonthly,

    returnRatePct: resolved.returnRate,
    resaleRatePct: resolved.resaleRate,
    unsellableSharePct: resolved.unsellableShare,
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
    totalCostMonthly: block1Monthly + block2Monthly + block3Monthly,
    totalCostPerUnit: monthlyUnits > 0 ? (block1Monthly + block2Monthly + block3Monthly) / monthlyUnits : 0,
    shippingCategoryTotalEurPerUnit: shippingUnit,
    shippingCategoryTotalEurPerMonth: shippingMonthly,

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
    "returns.resaleRate": makeEntry("returns.resaleRate", {
      override: overrideOn(assumptions.returns.overrideResaleRate),
      activeValue: resolved.resaleRate,
      formatType: "percent",
      source: `Kategorie-Default (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultResaleRate)}.`,
      impactMonthly: metrics.returnsMonthly,
      costNote: "Je höher, desto geringer der Verlust aus rückführbarer Ware.",
    }),
    "returns.unsellableShare": makeEntry("returns.unsellableShare", {
      override: overrideOn(assumptions.returns.overrideUnsellableShare),
      activeValue: resolved.unsellableShare,
      formatType: "percent",
      source: `Kategorie-Default (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultUnsellableShare)}.`,
      impactMonthly: metrics.returnsMonthly,
      costNote: "Erhöht direkt den Anteil der Retouren mit vollem Landed-Loss.",
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
    "assumptions.returns.resaleRate": "returns.resaleRate",
    "assumptions.returns.unsellableShare": "returns.unsellableShare",
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
      source: "Kategorie-Defaults + FBA-Tierlogik + globale Lager-Defaults.",
      robustness: "Mittel bis hoch (Referral stabil, FBA/Lager je nach Maße und Lagerdauer).",
      driverPaths: [
        "assumptions.amazon.referralRate",
        "assumptions.amazon.useManualFbaFee",
        "assumptions.amazon.manualFbaFee",
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
      formula: "Ads/Unit = Netto-Preis × effektiver TACoS%; effektiver TACoS berücksichtigt Launch-Boost.",
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
      formula: "Retouren/Unit = Retourenquote × (unsellable × Landed + sellable × Loss-Faktor × Landed + Handling).",
      source: "Kategorie-Defaults für Retouren + User-Override.",
      robustness: "Niedrig bis mittel (qualitäts- und listingabhängig).",
      driverPaths: [
        "assumptions.returns.returnRate",
        "assumptions.returns.resaleRate",
        "assumptions.returns.unsellableShare",
        "assumptions.returns.handlingCost",
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
    reviewStage: payload.reviewStage ?? null,
    reviewTargetId: payload.reviewTargetId ?? null,
  };
  renderDriverModal();
}

function closeDriverModal() {
  state.ui.driverModal = null;
  if (dom.driverModal) {
    dom.driverModal.classList.add("hidden");
  }
  applyDriverFocus([], "");
}

function cloneControlForModal(sourceControl) {
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
    if (path === "cartonRules.estimationMode") {
      if (value === "conservative") {
        return "Konservativ";
      }
      if (value === "balanced") {
        return "Balanced";
      }
      if (value === "maximal") {
        return "Maximal";
      }
    }
    return String(value ?? "-");
  }
  if (
    path.endsWith("Pct") ||
    /(?:referralRate|tacosRate|returnRate|resaleRate|unsellableShare|customsDutyRate|importVatRate|targetMarginPct)$/.test(path)
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

function renderDriverModal() {
  if (!dom.driverModal || !dom.driverModalFields || !dom.driverModalTitle || !dom.driverModalSubtitle) {
    return;
  }
  if (!state.ui.driverModal) {
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
  dom.driverModalFields.appendChild(summaryGrid);

  const groupMeta = {
    user: {
      title: "Von dir eingegeben / direkt überschreibbar",
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
  const groupNodes = new Map();
  const ensureGroupFields = (groupKey) => {
    if (groupNodes.has(groupKey)) {
      return groupNodes.get(groupKey);
    }
    const section = document.createElement("section");
    section.className = "modal-group";
    const heading = document.createElement("h4");
    heading.textContent = groupMeta[groupKey].title;
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = groupMeta[groupKey].hint;
    const fields = document.createElement("div");
    fields.className = "modal-group-fields";
    section.append(heading, hint, fields);
    dom.driverModalFields.appendChild(section);
    groupNodes.set(groupKey, fields);
    return fields;
  };

  const orderedPaths = sortDriverPathsForModal(driverPaths, modalMetrics);
  orderedPaths.forEach((path) => {
    const groupFields = ensureGroupFields(modalGroupForPath(path));

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

      groupFields.appendChild(field);
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
      let control = cloneControlForModal(controlSource);
      if (!(controlSource instanceof HTMLElement)) {
        if (SETTINGS_BOOLEAN_PATHS.has(settingsPath)) {
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          control = checkbox;
        } else if (SETTINGS_STRING_PATHS.has(settingsPath)) {
          if (settingsPath === "shipping12m.insurance.basis") {
            const select = document.createElement("select");
            const option = document.createElement("option");
            option.value = "goods_value_eur";
            option.textContent = "Nur Warenwert (EUR)";
            select.appendChild(option);
            control = select;
          } else if (settingsPath === "cartonRules.estimationMode") {
            const select = document.createElement("select");
            [
              ["conservative", "Konservativ"],
              ["balanced", "Balanced"],
              ["maximal", "Maximal"],
            ].forEach(([value, label]) => {
              const option = document.createElement("option");
              option.value = value;
              option.textContent = label;
              select.appendChild(option);
            });
            control = select;
          } else {
            const text = document.createElement("input");
            text.type = "text";
            control = text;
          }
        }
      }
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

      groupFields.appendChild(field);
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

    const control = cloneControlForModal(sourceControl);
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

    groupFields.appendChild(field);
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
          label: "Vorlauf (EUR/Unit)",
          valueRaw: shippingPreRunUnit,
          impactMonthly: shippingPreRunUnit * metrics.monthlyUnits,
          explain: "Abholung/Trucking am Ursprung.",
          formula: metrics.shipping.modeKey === "rail"
            ? "Vorlauf/Unit = (Vorlauf-Basis + Vorlauf je Karton × Anzahl Umkartons) / PO-Menge."
            : "Vorlauf/Unit = origin_fixed / PO Units.",
          source: `Shipping 12M (${metrics.shipping.modeLabel}).`,
          robustness: "Mittel.",
          driverPaths: [
            "basic.unitsPerOrder",
            "derived.shipping.cartonsCount",
            ...shippingOriginDriverPaths(metrics.shipping.modeKey),
          ],
        }),
        line({
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
          label: "Nachlauf (EUR/Unit)",
          valueRaw: shippingPostRunUnit,
          impactMonthly: shippingPostRunUnit * metrics.monthlyUnits,
          explain: "Inlandstransport in DE nach Ankunft.",
          formula: metrics.shipping.modeKey === "rail"
            ? "Nachlauf/Unit = (Nachlauf-Basis + Nachlauf je Karton × Anzahl Umkartons) / PO-Menge."
            : "Nachlauf/Unit = de_oncarriage_fixed / PO Units.",
          source: `Shipping 12M (${metrics.shipping.modeLabel}).`,
          robustness: "Mittel.",
          driverPaths: [
            "basic.unitsPerOrder",
            "derived.shipping.cartonsCount",
            ...shippingOncarriageDriverPaths(metrics.shipping.modeKey),
          ],
        }),
        line({
          label: "Zollabfertigung (EUR/Unit)",
          valueRaw: shippingCustomsClearanceUnit,
          impactMonthly: shippingCustomsClearanceUnit * metrics.monthlyUnits,
          explain: "Customs Clearance am Zielhafen/-terminal.",
          formula: "Zollabfertigung/Unit = customs_broker_fixed / PO Units.",
          source: "Shipping 12M -> Gemeinsam.",
          robustness: "Hoch.",
          driverPaths: [
            "basic.unitsPerOrder",
            "settings.shipping12m.customsBrokerEnabled",
            "settings.shipping12m.customsBrokerFixedEurPerShipment",
          ],
        }),
        line({
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
          label: "Zoll (EUR/Unit)",
          valueRaw: metrics.customsUnit,
          impactMonthly: metrics.customsMonthly,
          explain: "Zollkosten auf Warenwert plus Shipping D2D.",
          formula: "Zoll/Unit = Zollsatz × (Warenwert in EUR + Shipping zu 3PL je Unit).",
          source: "Import-Default/Override.",
          robustness: "Hoch.",
          driverPaths: ["assumptions.import.customsDutyRate", "settings.tax.customsDutyRatePct", "basic.exwUnit", "basic.unitsPerOrder"],
        }),
        line({
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
          label: "3PL Inbound / Receiving (EUR/Unit)",
          valueRaw: metrics.threePlInboundPerUnit,
          impactMonthly: metrics.threePlInboundPerUnit * metrics.monthlyUnits,
          explain: "Wareneingangskosten im 3PL je Karton.",
          formula: "Inbound/Unit = Anzahl Umkartons × Receiving-Rate je Karton / PO-Menge.",
          source: "3PL Settings/Override.",
          robustness: "Mittel.",
          driverPaths: [
            "derived.shipping.unitsPerOrder",
            "derived.shipping.unitsPerCartonAuto",
            "derived.shipping.estimatedCartonLengthCm",
            "derived.shipping.estimatedCartonWidthCm",
            "derived.shipping.estimatedCartonHeightCm",
            "derived.shipping.cartonizationSource",
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
          label: "3PL -> Amazon Service (EUR/Unit)",
          valueRaw: metrics.threePlOutboundServicePerUnit,
          impactMonthly: metrics.threePlOutboundServicePerUnit * metrics.monthlyUnits,
          explain: "Outbound-Service je Karton (Base, Pick & Pack, FBA Processing, optionale Extras).",
          formula: "Service/Unit = Anzahl Umkartons × Servicekosten je Karton / PO-Menge.",
          source: "3PL Settings/Override.",
          robustness: "Mittel.",
          driverPaths: [
            "derived.shipping.unitsPerOrder",
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
          label: "3PL -> Amazon Carrier (EUR/Unit)",
          valueRaw: metrics.threePlCarrierPerUnit,
          impactMonthly: metrics.threePlCarrierPerUnit * metrics.monthlyUnits,
          explain: "Transportkosten vom 3PL zu Amazon je Karton.",
          formula: "Carrier/Unit = Anzahl Umkartons × Carrier-Kosten je Karton / PO-Menge.",
          source: "3PL Settings/Override.",
          robustness: "Mittel.",
          driverPaths: [
            "derived.shipping.unitsPerOrder",
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
          label: "FBA Fee (EUR/Unit)",
          valueRaw: metrics.fbaFeeUnit,
          impactMonthly: metrics.fbaFeeUnit * metrics.monthlyUnits,
          explain: "FBA-Gebühr je Unit nach Größen-/Gewichtstier oder manuellem Override.",
          formula: "FBA/Unit = auto tier fee oder manual fee.",
          source: "Amazon Fee-Logik + Produktdaten.",
          robustness: "Mittel bis hoch.",
          driverPaths: [
            "assumptions.amazon.useManualFbaFee",
            "assumptions.amazon.manualFbaFee",
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
          label: "Ads inkl. Launch-Boost (EUR/Unit)",
          valueRaw: metrics.adsUnit,
          impactMonthly: metrics.adsMonthly,
          explain: "Werbekosten auf Netto-Umsatzbasis inklusive Launch-Profil.",
          formula: "Ads/Unit = net_price × effective_TACoS.",
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
          explain: "Wertverlust aus Retouren und Unsellable-Anteilen.",
          formula: "Return loss/Unit = return_rate × landed × sellability factors.",
          source: "Kategorie-Defaults + Overrides.",
          robustness: "Niedrig bis mittel.",
          driverPaths: [
            "assumptions.returns.returnRate",
            "assumptions.returns.resaleRate",
            "assumptions.returns.unsellableShare",
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
          driverPaths: ["assumptions.returns.returnRate", "assumptions.returns.handlingCost"],
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

function renderShippingDetails(metrics) {
  const modeLabel = metrics.shipping.modeLabel ?? shippingModeLabel(metrics.shipping.transportMode);
  const quickLabel = document.querySelector("#shippingQuickCard p");
  if (quickLabel) {
    quickLabel.textContent = `Shipping door-to-door gesamt (${modeLabel}, EUR / Unit)`;
  }
  if (dom.basicShippingUnit) {
    dom.basicShippingUnit.textContent = formatCurrency(metrics.shippingUnit);
  }
  if (dom.basicShippingMeta) {
    dom.basicShippingMeta.textContent = `${modeLabel} · Chargeable: ${formatNumber(metrics.shipping.chargeableCbm)} CBM · PO: ${formatNumber(metrics.shipping.unitsPerOrder)} Units`;
  }

  if (dom.shippingCartonUnits) {
    const modeText = metrics.shipping.cartonizationSource === "manual_override" ? "manuell" : "auto";
    dom.shippingCartonUnits.textContent = `${formatNumber(metrics.shipping.unitsPerCartonAuto)} (${modeText})`;
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
      `So berechnen wir Shipping (12-Monats-Ø, Modus ${modeLabel}): Für China→DE schätzen wir Umkartons konservativ über Supplier-Soft-Caps und nutzen Amazon-Hard-Caps nur als Fallback. Optional kannst du reale Packing-List-Werte manuell setzen. Daraus berechnen wir chargeable CBM (W/M) und addieren Vorlauf, Hauptlauf (variabel + fix), Nachlauf, Zollabfertigung, Versicherung und optionale Nachbelastung. Ergebnis ist ein einzelner Richtwert in EUR/Unit, kein Live-Tarif.`;
  }

  if (dom.shippingDetailList) {
    dom.shippingDetailList.innerHTML = "";
    metrics.shipping.breakdown.forEach((line) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${line.label}</span><strong>${formatCurrency(line.total)} · ${formatCurrency(line.perUnit)}/Unit</strong>`;
      if (line.formula || line.source) {
        li.title = `${line.label}: ${line.formula ?? ""}${line.source ? `\nHerkunft: ${line.source}` : ""}`;
      }
      dom.shippingDetailList.appendChild(li);
    });

    const totalLi = document.createElement("li");
    totalLi.innerHTML = `<span>Shipping total (${modeLabel})</span><strong>${formatCurrency(metrics.shipping.shippingTotal)} · ${formatCurrency(metrics.shipping.shippingPerUnit)}/Unit</strong>`;
    totalLi.title = "Shipping Total = Vorlauf + Hauptlauf variabel + Hauptlauf fix + Nachlauf + Zollabfertigung + Versicherung + optionale Nachbelastung.";
    dom.shippingDetailList.appendChild(totalLi);
  }

  if (dom.shippingDebugInfo) {
    const base = [
      `Modus: ${metrics.shipping.modeLabel}`,
      `Kartonisierung: ${metrics.shipping.cartonizationSourceLabel}`,
      `Units je Umkarton: ${formatNumber(metrics.shipping.unitsPerCartonAuto)}`,
      `Umkarton (cm): ${formatNumber(metrics.shipping.estimatedCartonLengthCm)} × ${formatNumber(metrics.shipping.estimatedCartonWidthCm)} × ${formatNumber(metrics.shipping.estimatedCartonHeightCm)}`,
      `Umkarton Brutto (kg): ${formatNumber(metrics.shipping.estimatedCartonGrossWeightKg)}`,
      `Anzahl Umkartons: ${formatNumber(metrics.shipping.cartonsCount)}`,
      `Sendungsvolumen (CBM): ${formatNumber(metrics.shipping.shipmentCbm)}`,
      `Sendungsgewicht (kg): ${formatNumber(metrics.shipping.shipmentWeightKg)}`,
      `Abrechnungsvolumen (CBM): ${formatNumber(metrics.shipping.chargeableCbm)}`,
      `Warenwert (EUR): ${formatCurrency(metrics.shipping.goodsValueEur)}`,
      `Versicherungssatz: ${formatPercent(metrics.shipping.insuranceRatePct)}`,
      `Nachbelastung: ${formatCurrency(metrics.shipping.manualSurchargeTotal)}`,
    ].join(" · ");
    dom.shippingDebugInfo.textContent = metrics.shipping.oversizeFlag
      ? `${base} · Hinweis: ${metrics.shipping.oversizeNote}`
      : base;
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
          "Aggregierter Shipping-Block von China bis 3PL. Im Quick-Check ohne Detailaufsplittung nach Vorlauf/Hauptlauf/Nachlauf.",
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

function renderSelectedOutputs(metrics, stage = "quick") {
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

  renderShippingDetails(metrics);
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

  WORKFLOW_STAGES.forEach((stageKey) => {
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
  const showSecondary = !isQuick || state.ui.quickShowAllKpis;
  if (dom.decisionSecondaryWrap) {
    dom.decisionSecondaryWrap.classList.toggle("hidden", !showSecondary);
  }
  if (dom.toggleAllKpisBtn) {
    dom.toggleAllKpisBtn.classList.toggle("hidden", !isQuick);
    dom.toggleAllKpisBtn.textContent = showSecondary ? "Weniger KPIs anzeigen" : "Alle KPIs anzeigen";
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

function renderValidationReviewPanel(product, stageState) {
  if (!dom.validationReviewList || !dom.validationReviewStatus) {
    return;
  }
  const review = stageState.validationReview;
  const totalLabel = review.total > 0 ? review.total : getStageTopN("validation");
  dom.validationReviewStatus.textContent = `${review.completed}/${totalLabel} geprüft`;
  dom.validationReviewStatus.classList.remove("pass", "warn", "fail");
  dom.validationReviewStatus.classList.add(review.isReady ? "pass" : "warn");
  renderReviewItemsGrouped(dom.validationReviewList, review.items, "validation");
}

function renderDeepDiveReviewPanel(product, stageState) {
  if (!dom.deepDiveReviewList || !dom.deepDiveReviewStatus) {
    return;
  }
  const review = stageState.deepDiveReview;
  dom.deepDiveReviewStatus.textContent = `${review.completed}/${review.total} geprüft`;
  dom.deepDiveReviewStatus.classList.remove("pass", "warn", "fail");
  dom.deepDiveReviewStatus.classList.add(review.isReady ? "pass" : "warn");
  renderReviewItemsGrouped(dom.deepDiveReviewList, review.items, "deep_dive");
}

function applyStageVisibility(product, stageState) {
  const stage = stageState.stage;
  const isDeep = stage === "deep_dive";
  const isValidation = stage === "validation";
  const isQuick = stage === "quick";

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
  if (dom.validationReviewPanel) {
    dom.validationReviewPanel.classList.toggle("hidden", !isValidation);
  }
  if (dom.deepDiveReviewPanel) {
    dom.deepDiveReviewPanel.classList.toggle("hidden", !isDeep);
  }

  const deepDiveSection = document.getElementById("advancedDeepDiveSection");
  if (deepDiveSection) {
    deepDiveSection.classList.add("hidden");
  }

  const packingListOverrideSection = document.getElementById("packingListOverrideSection");
  if (packingListOverrideSection) {
    packingListOverrideSection.classList.add("hidden");
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

  const manualFbaFeeInputs = document.querySelectorAll('[data-path="assumptions.amazon.manualFbaFee"]');
  manualFbaFeeInputs.forEach((manualFbaFeeInput) => {
    manualFbaFeeInput.disabled = !Boolean(getByPath(product, "assumptions.amazon.useManualFbaFee"));
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
  if (APP_PAGE === "product" && sectionId.startsWith("settings")) {
    window.location.href = `settings.html#${sectionId}`;
    return;
  }

  if (!sectionId.startsWith("settings")) {
    return;
  }

  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }

  const details = section.tagName.toLowerCase() === "details" ? section : section.closest("details");
  if (details instanceof HTMLDetailsElement) {
    details.open = true;
  }

  setWorkspaceTab("settings");

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
    return "advancedShippingSection";
  }
  if (path.startsWith("assumptions.extraCosts.")) {
    return "advancedOpsSection";
  }
  if (path.startsWith("settings.")) {
    return settingsSectionIdFromPath(path.slice("settings.".length));
  }
  if (path.startsWith("workflow.deepDive.")) {
    return "advancedDeepDiveSection";
  }
  if (
    path === "basic.unitsPerOrder" ||
    path === "basic.transportMode" ||
    path === "basic.netWeightG" ||
    path === "basic.packLengthCm" ||
    path === "basic.packWidthCm" ||
    path === "basic.packHeightCm"
  ) {
    return "advancedShippingSection";
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
  renderValidationReviewPanel(product, stageState);
  renderDeepDiveReviewPanel(product, stageState);

  renderSelectedOutputs(metrics, stageState.stage);
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
  if (!selected || !WORKFLOW_STAGES.includes(stage)) {
    return;
  }

  selected.workflow.stage = stage;
  if (stage === "quick") {
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
    dom.stageQuickBtn.title = "Quick-Check: schnelle Entscheidung mit Top-10 Kostentreibern.";
  }
  if (dom.stageValidationBtn) {
    dom.stageValidationBtn.title = "Validation: Top-20 Kostentreiber prüfen oder überschreiben.";
  }
  if (dom.stageDeepBtn) {
    dom.stageDeepBtn.title = "Deep-Dive: Vollprüfung aller editierbaren kostentrelevanten Treiber.";
  }
  if (dom.toggleAllKpisBtn) {
    dom.toggleAllKpisBtn.title = "Zeigt in Quick-Check zusätzliche KPIs in der Decision-Bar.";
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
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
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

    if (path) {
      updateSelectedField(path, value);
      renderComputedViews();
      return;
    }

    if (settingsPath) {
      updateSettingsField(settingsPath, value);
      if (APP_PAGE === "product") {
        renderComputedViews();
      }
      renderSettingsInputs();
      applyMouseoverHelp();
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
  if (dom.stageDeepBtn) {
    dom.stageDeepBtn.addEventListener("click", () => setSelectedStage("deep_dive"));
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

  const handleReviewClick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const btn = target.closest("button[data-review-action]");
    if (!(btn instanceof HTMLElement)) {
      return;
    }

    const action = btn.dataset.reviewAction;
    const stage = btn.dataset.reviewStage;
    const targetId = btn.dataset.reviewTargetId;
    const selected = getSelectedProduct();
    if (!selected || !stage || !targetId) {
      return;
    }

    const reviewTarget = findReviewTarget(selected, stage, targetId);
    if (!reviewTarget) {
      return;
    }

    if (action === "check") {
      markReviewChecked(selected, stage, targetId, reviewTarget.valueRaw);
      renderAll();
      return;
    }

    if (action === "uncheck" || action === "reset") {
      markReviewPending(selected, stage, targetId);
      renderAll();
      return;
    }

    if (action === "override") {
      openDriverModal({
        title: reviewTarget.label,
        value: reviewTarget.value,
        explain: reviewTarget.explain,
        formula: reviewTarget.formula,
        source: reviewTarget.source,
        robustness: reviewTarget.robustness,
        driverPaths: reviewTarget.driverPaths,
        reviewStage: stage,
        reviewTargetId: targetId,
      });
    }
  };

  if (dom.validationReviewList) {
    dom.validationReviewList.addEventListener("click", handleReviewClick);
  }
  if (dom.deepDiveReviewList) {
    dom.deepDiveReviewList.addEventListener("click", handleReviewClick);
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
    if (event.key === "Escape" && state.ui.driverModal) {
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
  setAuthStatus("Initialisierung fehlgeschlagen. Fallback auf lokale Daten.", true);
  setAppMode("ready_local");
  loadSettingsLocal();
  loadProductsLocal();
  selectFirstProductIfNeeded();
  renderPageAfterLoad();
});
