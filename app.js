const STORAGE_KEY_PRODUCTS = "fba-margin-calculator.8020.v3.products";
const STORAGE_KEY_SETTINGS = "fba-margin-calculator.8020.v3.settings";
const LEGACY_STORAGE_KEY = "fba-margin-calculator.8020.v2";
const APP_PAGE = document.body?.dataset?.page === "settings" ? "settings" : "product";

const MIN_REFERRAL_FEE = 0.3;
const DEFAULT_USD_TO_EUR = 0.92;
const FX_ENDPOINT = "https://api.frankfurter.app/latest?from=USD&to=EUR";

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
  importCustomsDutyRate: 4.7,
  importVatRate: 19,
};

const DEFAULT_SETTINGS = {
  shipping12m: {
    lclRateEurPerCbm: 128,
    originFixedEurPerShipment: 180,
    destinationFixedEurPerShipment: 260,
    deOncarriageFixedEurPerShipment: 165,
    customsBrokerEnabled: true,
    customsBrokerFixedEurPerShipment: 95,
  },
  cartonRules: {
    preset: "legacy",
    maxLengthCm: CARTON_PRESETS.legacy.maxLengthCm,
    maxWidthCm: CARTON_PRESETS.legacy.maxWidthCm,
    maxHeightCm: CARTON_PRESETS.legacy.maxHeightCm,
    maxWeightKg: CARTON_PRESETS.legacy.maxWeightKg,
    packFactor: 0.85,
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
  costDefaults: {
    packagingPerUnitEur: 0.32,
    otherUnitCostEur: 0.18,
    docsPerOrderEur: 45,
    freightPapersPerOrderEur: 28,
    threePlInboundPerCartonEur: 1.1,
    threePlStoragePerPalletMonthEur: 19,
    threePlOutboundPerCartonEur: 3.2,
    unitsPerPallet: 240,
    avg3PlStorageMonths: 1.2,
    amazonStoragePerCbmMonthEur: 28,
    avgAmazonStorageMonths: 1.5,
    greetingCardPerLaunchUnitEur: 0.22,
    samplesPerProductEur: 120,
    toolingPerProductEur: 220,
    certificatesPerProductEur: 180,
    inspectionPerProductEur: 260,
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
  "basic.transportMode": "v1: Sea LCL. Rail/Air sind nur als Platzhalter sichtbar.",
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
  "assumptions.import.importVatRate": "Einfuhrumsatzsteuer in %.",
  "assumptions.import.includeImportVatAsCost": "Wenn aktiv, wird EUSt direkt als Kostenblock berücksichtigt.",
  "assumptions.import.includeImportVatInCashRoi": "Wenn aktiv, wird EUSt-Vorfinanzierung im Cash-ROI als gebundenes Kapital erfasst.",

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

  "assumptions.extraCosts.overridePackagingGroup": "Wenn aktiv, nutzt das Produkt eigene Verpackungs-/Stückkosten statt globaler Settings.",
  "assumptions.extraCosts.packagingPerUnitEur": "Zusätzliche Verpackungskosten pro Stück (EUR).",
  "assumptions.extraCosts.otherUnitCostEur": "Weitere variable Zusatzkosten pro Stück (EUR).",
  "assumptions.extraCosts.overrideLogisticsGroup": "Wenn aktiv, nutzt das Produkt eigene 3PL-/Lager-/Orderlogistik-Kosten statt globaler Settings.",
  "assumptions.extraCosts.docsPerOrderEur": "Fixkosten je Order für Dokumentation (EUR).",
  "assumptions.extraCosts.freightPapersPerOrderEur": "Fixkosten je Order für Frachtpapiere (EUR).",
  "assumptions.extraCosts.threePlInboundPerCartonEur": "3PL Wareneingang/Handling je Umkarton (EUR).",
  "assumptions.extraCosts.threePlStoragePerPalletMonthEur": "3PL Lagerkosten je Palette und Monat (EUR).",
  "assumptions.extraCosts.threePlOutboundPerCartonEur": "Versandkosten 3PL -> Amazon je Umkarton (EUR).",
  "assumptions.extraCosts.unitsPerPallet": "Annahme, wie viele Units auf einer Palette liegen (für 3PL Storage-Rechnung).",
  "assumptions.extraCosts.avg3PlStorageMonths": "Durchschnittliche Lagerdauer im 3PL in Monaten.",
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
  "shipping12m.lclRateEurPerCbm": "12-Monats-Durchschnitt: variabler LCL-Tarif in EUR pro CBM (W/M).",
  "shipping12m.originFixedEurPerShipment": "12-Monats-Durchschnitt: fixe Origin-Kosten je Shipment in EUR.",
  "shipping12m.destinationFixedEurPerShipment": "12-Monats-Durchschnitt: fixe Destination-Kosten je Shipment in EUR.",
  "shipping12m.deOncarriageFixedEurPerShipment": "12-Monats-Durchschnitt: fixer DE On-Carriage Anteil je Shipment in EUR.",
  "shipping12m.customsBrokerEnabled": "Aktiviert optionalen Customs-Broker-Fixkostenblock.",
  "shipping12m.customsBrokerFixedEurPerShipment": "12-Monats-Durchschnitt: fixer Customs-Broker Betrag je Shipment in EUR.",
  "cartonRules.maxLengthCm": "Maximale Karton-Länge in cm für Auto-Kartonisierung.",
  "cartonRules.maxWidthCm": "Maximale Karton-Breite in cm für Auto-Kartonisierung.",
  "cartonRules.maxHeightCm": "Maximale Karton-Höhe in cm für Auto-Kartonisierung.",
  "cartonRules.maxWeightKg": "Maximales Karton-Gewicht in kg für Auto-Kartonisierung.",
  "cartonRules.packFactor": "Packfaktor für Luft/Polster (z. B. 0,85). Niedriger = konservativeres Packing.",
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
  "costDefaults.threePlInboundPerCartonEur": "Globaler Default für 3PL-Wareneingang je Umkarton (EUR).",
  "costDefaults.threePlStoragePerPalletMonthEur": "Globaler Default für 3PL-Lagerung je Palette/Monat (EUR).",
  "costDefaults.threePlOutboundPerCartonEur": "Globaler Default für 3PL -> Amazon je Umkarton (EUR).",
  "costDefaults.unitsPerPallet": "Globaler Default für Units je Palette (für 3PL-Lagerkosten-Umrechnung).",
  "costDefaults.avg3PlStorageMonths": "Globaler Default für durchschnittliche 3PL-Lagerdauer in Monaten.",
  "costDefaults.amazonStoragePerCbmMonthEur": "Globaler Default für Amazon-Lagerkosten je CBM/Monat (EUR).",
  "costDefaults.avgAmazonStorageMonths": "Globaler Default für durchschnittliche Amazon-Lagerdauer in Monaten.",
  "costDefaults.greetingCardPerLaunchUnitEur": "Globaler Default für handgeschriebene Grußkarte pro Launch-Unit (EUR).",
  "costDefaults.samplesPerProductEur": "Globaler Default für Samples je Produkt (einmalig, EUR).",
  "costDefaults.toolingPerProductEur": "Globaler Default für Tooling je Produkt (einmalig, EUR).",
  "costDefaults.certificatesPerProductEur": "Globaler Default für Zertifikate je Produkt (einmalig, EUR).",
  "costDefaults.inspectionPerProductEur": "Globaler Default für Quality Inspection in China je Produkt (einmalig, EUR).",
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

const KPI_HELP = {
  kpiRevenueGross: "Brutto-Umsatz/Monat = Verkaufspreis brutto × Monatsabsatz.",
  kpiRevenueNet: "Netto-Umsatz/Monat = Verkaufspreis netto × Monatsabsatz.",
  kpiSellerboardMargin:
    "Sellerboard-Marge % = (Gewinn vor Overhead / Brutto-Umsatz) × 100. Overhead = produktunabhängige Fixkosten.",
  kpiNetMargin: "Netto-Marge % = Gewinn netto / Netto-Umsatz × 100. Zielbereich: > 20%.",
  kpiShippingUnit: "Door-to-door Shipping je Unit als 12-Monats-Durchschnitt (ein Richtwert).",
  kpiLandedUnit: "Landed je Unit = EXW(EUR) + Shipping + Zoll (+ optional EUSt als Kosten).",
  kpiDb1Unit: "DB1/Stück = Nettoverkaufspreis - Unit Economics je Stück (Landed, Amazon, Ads, Retouren).",
  kpiDb1Margin: "DB1-Marge % = DB1/Stück / Nettoverkaufspreis × 100.",
  kpiGrossProfitMonthly: "Gewinn brutto/Monat = DB1/Stück × Monatsabsatz (vor Block 2 und 3).",
  kpiProfitMonthly: "Gewinn netto/Monat = Gewinn brutto/Monat - Launch/Lifecycle - Leakage.",
  kpiBreakEvenPrice: "Break-even Preis brutto: Preis, bei dem Gewinn netto/Monat = 0.",
  kpiMaxTacos: "Max TACoS: höchste Ads-Quote, bei der die Ziel-Nettomarge gerade noch erreicht wird.",
  kpiProductRoi: "Produkt-ROI = Gewinn im Zeitraum / (Landed Kapital + Launch-Budget) × 100.",
  kpiCashRoi: "Cash-ROI = Gewinn im Zeitraum / (Produktkapital + Launch + optionale EUSt-Vorfinanzierung) × 100.",
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
  "Cash-ROI in % inkl. optionaler EUSt-Vorfinanzierung.",
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
    text: "Cash-ROI berücksichtigt optional auch gebundenes Kapital aus EUSt-Vorfinanzierung.",
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
]);

const SETTINGS_BOOLEAN_PATHS = new Set(["shipping12m.customsBrokerEnabled"]);

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

const state = {
  products: [],
  settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
  selectedId: null,
  fx: {
    usdToEur: DEFAULT_USD_TO_EUR,
    date: null,
    source: "Fallback",
    loading: false,
    error: null,
  },
  ui: {
    advancedVisible: false,
    compareSort: "profit_desc",
    compareFilter: "all",
    focusedDriverPaths: [],
    focusedDriverLabel: "",
    workspaceTab: "product",
    driverModal: null,
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
  stageImpactList: document.getElementById("stageImpactList"),
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
  basicShippingUnit: document.getElementById("basicShippingUnit"),
  basicShippingMeta: document.getElementById("basicShippingMeta"),
  chainSupplierCost: document.getElementById("chainSupplierCost"),
  chainImportCost: document.getElementById("chainImportCost"),
  chainThreePlCost: document.getElementById("chainThreePlCost"),
  chainInboundCost: document.getElementById("chainInboundCost"),
  chainAmazonCost: document.getElementById("chainAmazonCost"),
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
  kpiGrossProfitMonthly: document.getElementById("kpiGrossProfitMonthly"),
  kpiProfitMonthly: document.getElementById("kpiProfitMonthly"),
  kpiBreakEvenPrice: document.getElementById("kpiBreakEvenPrice"),
  kpiMaxTacos: document.getElementById("kpiMaxTacos"),
  kpiProductRoi: document.getElementById("kpiProductRoi"),
  kpiCashRoi: document.getElementById("kpiCashRoi"),
  kpiPayback: document.getElementById("kpiPayback"),

  unitBlockList: document.getElementById("unitBlockList"),
  launchBlockList: document.getElementById("launchBlockList"),
  leakageBlockList: document.getElementById("leakageBlockList"),

  sensPriceDown: document.getElementById("sensPriceDown"),
  sensTacosUp: document.getElementById("sensTacosUp"),
  sensUnitsDown: document.getElementById("sensUnitsDown"),
  sensWorst: document.getElementById("sensWorst"),
  sensBest: document.getElementById("sensBest"),
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultProduct(index = 1) {
  return {
    id: uid(),
    name: `Produkt ${index}`,
    workflow: {
      stage: "quick",
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
      transportMode: "sea_lcl",
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
      extraCosts: {
        overridePackagingGroup: false,
        packagingPerUnitEur: DEFAULT_SETTINGS.costDefaults.packagingPerUnitEur,
        otherUnitCostEur: DEFAULT_SETTINGS.costDefaults.otherUnitCostEur,

        overrideLogisticsGroup: false,
        docsPerOrderEur: DEFAULT_SETTINGS.costDefaults.docsPerOrderEur,
        freightPapersPerOrderEur: DEFAULT_SETTINGS.costDefaults.freightPapersPerOrderEur,
        threePlInboundPerCartonEur: DEFAULT_SETTINGS.costDefaults.threePlInboundPerCartonEur,
        threePlStoragePerPalletMonthEur: DEFAULT_SETTINGS.costDefaults.threePlStoragePerPalletMonthEur,
        threePlOutboundPerCartonEur: DEFAULT_SETTINGS.costDefaults.threePlOutboundPerCartonEur,
        unitsPerPallet: DEFAULT_SETTINGS.costDefaults.unitsPerPallet,
        avg3PlStorageMonths: DEFAULT_SETTINGS.costDefaults.avg3PlStorageMonths,
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
  settings.shipping12m.lclRateEurPerCbm = clamp(num(settings.shipping12m.lclRateEurPerCbm, 0), 0, 2000);
  settings.shipping12m.originFixedEurPerShipment = clamp(num(settings.shipping12m.originFixedEurPerShipment, 0), 0, 5000);
  settings.shipping12m.destinationFixedEurPerShipment = clamp(num(settings.shipping12m.destinationFixedEurPerShipment, 0), 0, 5000);
  settings.shipping12m.deOncarriageFixedEurPerShipment = clamp(num(settings.shipping12m.deOncarriageFixedEurPerShipment, 0), 0, 5000);
  settings.shipping12m.customsBrokerFixedEurPerShipment = clamp(num(settings.shipping12m.customsBrokerFixedEurPerShipment, 0), 0, 5000);
  settings.shipping12m.customsBrokerEnabled = Boolean(settings.shipping12m.customsBrokerEnabled);

  settings.cartonRules.maxLengthCm = clamp(num(settings.cartonRules.maxLengthCm, 63.5), 1, 200);
  settings.cartonRules.maxWidthCm = clamp(num(settings.cartonRules.maxWidthCm, 63.5), 1, 200);
  settings.cartonRules.maxHeightCm = clamp(num(settings.cartonRules.maxHeightCm, 63.5), 1, 200);
  settings.cartonRules.maxWeightKg = clamp(num(settings.cartonRules.maxWeightKg, 23), 1, 80);
  settings.cartonRules.packFactor = clamp(num(settings.cartonRules.packFactor, 0.85), 0.5, 0.99);

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

  settings.costDefaults.packagingPerUnitEur = clamp(num(settings.costDefaults.packagingPerUnitEur, 0), 0, 50);
  settings.costDefaults.otherUnitCostEur = clamp(num(settings.costDefaults.otherUnitCostEur, 0), 0, 50);
  settings.costDefaults.docsPerOrderEur = clamp(num(settings.costDefaults.docsPerOrderEur, 0), 0, 5000);
  settings.costDefaults.freightPapersPerOrderEur = clamp(num(settings.costDefaults.freightPapersPerOrderEur, 0), 0, 5000);
  settings.costDefaults.threePlInboundPerCartonEur = clamp(num(settings.costDefaults.threePlInboundPerCartonEur, 0), 0, 100);
  settings.costDefaults.threePlStoragePerPalletMonthEur = clamp(num(settings.costDefaults.threePlStoragePerPalletMonthEur, 0), 0, 500);
  settings.costDefaults.threePlOutboundPerCartonEur = clamp(num(settings.costDefaults.threePlOutboundPerCartonEur, 0), 0, 200);
  settings.costDefaults.unitsPerPallet = clamp(roundInt(settings.costDefaults.unitsPerPallet, 240), 1, 10000);
  settings.costDefaults.avg3PlStorageMonths = clamp(num(settings.costDefaults.avg3PlStorageMonths, 1.2), 0, 12);
  settings.costDefaults.amazonStoragePerCbmMonthEur = clamp(num(settings.costDefaults.amazonStoragePerCbmMonthEur, 0), 0, 1000);
  settings.costDefaults.avgAmazonStorageMonths = clamp(num(settings.costDefaults.avgAmazonStorageMonths, 1.5), 0, 12);
  settings.costDefaults.greetingCardPerLaunchUnitEur = clamp(num(settings.costDefaults.greetingCardPerLaunchUnitEur, 0), 0, 20);
  settings.costDefaults.samplesPerProductEur = clamp(num(settings.costDefaults.samplesPerProductEur, 0), 0, 10000);
  settings.costDefaults.toolingPerProductEur = clamp(num(settings.costDefaults.toolingPerProductEur, 0), 0, 50000);
  settings.costDefaults.certificatesPerProductEur = clamp(num(settings.costDefaults.certificatesPerProductEur, 0), 0, 10000);
  settings.costDefaults.inspectionPerProductEur = clamp(num(settings.costDefaults.inspectionPerProductEur, 0), 0, 10000);

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
      extraCosts: { ...base.assumptions.extraCosts, ...(raw.assumptions?.extraCosts ?? {}) },
    },
  };

  if (!Number.isFinite(num(merged.basic.unitsPerOrder, NaN))) {
    const oldUnitsPerCarton = num(raw?.basic?.unitsPerCarton, 0);
    merged.basic.unitsPerOrder = oldUnitsPerCarton > 0 ? oldUnitsPerCarton * 50 : base.basic.unitsPerOrder;
  }

  if (merged.basic.transportMode === "sea") {
    merged.basic.transportMode = "sea_lcl";
  }
  if (!["sea_lcl", "rail", "air"].includes(merged.basic.transportMode)) {
    merged.basic.transportMode = "sea_lcl";
  }
  if (!["ai", "photographer", "visual_advantage"].includes(merged.basic.listingPackage)) {
    merged.basic.listingPackage = "ai";
  }
  if (!["low", "medium", "high"].includes(merged.basic.launchCompetition)) {
    merged.basic.launchCompetition = "medium";
  }

  merged.basic.horizonMonths = clamp(roundInt(merged.basic.horizonMonths, base.basic.horizonMonths), 1, 36);
  merged.basic.unitsPerOrder = Math.max(1, roundInt(merged.basic.unitsPerOrder, base.basic.unitsPerOrder));
  merged.basic.netWeightG = Math.max(0, num(merged.basic.netWeightG, base.basic.netWeightG));
  if (!WORKFLOW_STAGES.includes(merged.workflow.stage)) {
    merged.workflow.stage = "quick";
  }

  return merged;
}

function loadSettings() {
  const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (!raw) {
    state.settings = defaultSettings();
    saveSettings();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const merged = {
      ...defaultSettings(),
      ...parsed,
      shipping12m: {
        ...defaultSettings().shipping12m,
        ...(parsed?.shipping12m ?? {}),
      },
      cartonRules: {
        ...defaultSettings().cartonRules,
        ...(parsed?.cartonRules ?? {}),
      },
      categoryDefaults: ensureCategoryDefaults(parsed?.categoryDefaults),
      lifecycle: ensureLifecycleSettings(parsed?.lifecycle),
      costDefaults: ensureCostDefaults(parsed?.costDefaults),
    };
    state.settings = sanitizeSettings(merged);
  } catch (_error) {
    state.settings = defaultSettings();
    saveSettings();
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
}

function loadProducts() {
  const rawCurrent = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);

  const raw = rawCurrent || rawLegacy;
  if (!raw) {
    state.products = [defaultProduct(1), defaultProduct(2)];
    state.selectedId = state.products[0].id;
    saveProducts();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("invalid");
    }

    state.products = parsed.map((item, index) => migrateProduct(item, index));
    state.selectedId = state.products[0].id;
    saveProducts();
  } catch (_error) {
    state.products = [defaultProduct(1)];
    state.selectedId = state.products[0].id;
    saveProducts();
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(state.products));
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

function calculateShippingDoorToDoor(product) {
  const basic = product.basic;
  const rules = state.settings.cartonRules;
  const shipping = state.settings.shipping12m;

  const l = Math.max(0.1, num(basic.packLengthCm, 0.1));
  const w = Math.max(0.1, num(basic.packWidthCm, 0.1));
  const h = Math.max(0.1, num(basic.packHeightCm, 0.1));
  const unitWeightKg = Math.max(0.001, num(basic.netWeightG, 1) / 1000);
  const unitsPerOrder = Math.max(1, roundInt(basic.unitsPerOrder, 1));

  const unitCbm = (l * w * h) / 1_000_000;

  const maxLengthCm = Math.max(1, num(rules.maxLengthCm, 63.5));
  const maxWidthCm = Math.max(1, num(rules.maxWidthCm, 63.5));
  const maxHeightCm = Math.max(1, num(rules.maxHeightCm, 63.5));
  const maxWeightKg = Math.max(1, num(rules.maxWeightKg, 23));
  const packFactor = clamp(num(rules.packFactor, 0.85), 0.5, 0.99);

  const unitDimsSorted = toSortedDims(l, w, h);
  const maxDimsSorted = toSortedDims(maxLengthCm, maxWidthCm, maxHeightCm);
  const oversizeFlag = unitDimsSorted[0] > maxDimsSorted[0] || unitDimsSorted[1] > maxDimsSorted[1] || unitDimsSorted[2] > maxDimsSorted[2];

  const maxCartonCbm = (maxLengthCm * maxWidthCm * maxHeightCm) / 1_000_000;
  const effectiveCartonCbm = maxCartonCbm * packFactor;

  const unitsByWeightRaw = Math.floor(maxWeightKg / unitWeightKg);
  const unitsByWeight = Math.max(1, unitsByWeightRaw);

  const unitsByVolumeRaw = Math.floor(effectiveCartonCbm / Math.max(unitCbm, 0.000001));
  const unitsByVolume = Math.max(1, unitsByVolumeRaw);

  const unitsPerCartonAuto = oversizeFlag ? 1 : Math.max(1, Math.min(unitsByWeight, unitsByVolume));
  const cartonsCount = Math.max(1, Math.ceil(unitsPerOrder / unitsPerCartonAuto));

  const cartonCbm = oversizeFlag
    ? Math.max(unitCbm / packFactor, unitCbm)
    : Math.min(maxCartonCbm, (unitsPerCartonAuto * unitCbm) / packFactor);

  const shipmentCbm = cartonsCount * cartonCbm;
  const shipmentWeightKg = unitsPerOrder * unitWeightKg;
  const chargeableCbm = Math.max(shipmentCbm, shipmentWeightKg / 1000);

  const originFixed = Math.max(0, num(shipping.originFixedEurPerShipment));
  const variableLcl = Math.max(0, num(shipping.lclRateEurPerCbm)) * chargeableCbm;
  const destinationFixed = Math.max(0, num(shipping.destinationFixedEurPerShipment));
  const oncarriageFixed = Math.max(0, num(shipping.deOncarriageFixedEurPerShipment));
  const customsBroker = shipping.customsBrokerEnabled ? Math.max(0, num(shipping.customsBrokerFixedEurPerShipment)) : 0;

  const shippingTotal = originFixed + variableLcl + destinationFixed + oncarriageFixed + customsBroker;
  const shippingPerUnit = unitsPerOrder > 0 ? shippingTotal / unitsPerOrder : 0;

  const lines = [
    { key: "origin", label: "Origin fixed", total: originFixed },
    { key: "lcl", label: "LCL variabel (W/M)", total: variableLcl },
    { key: "destination", label: "Destination fixed", total: destinationFixed },
    { key: "oncarriage", label: "DE On-Carriage", total: oncarriageFixed },
    { key: "broker", label: "Customs Broker", total: customsBroker },
  ].map((line) => ({
    ...line,
    perUnit: unitsPerOrder > 0 ? line.total / unitsPerOrder : 0,
  }));

  const oversizeNote = oversizeFlag
    ? "Produktkante überschreitet Karton-Maxmaß. Es wird mit 1 Unit/Karton weitergerechnet (Oversize-Flag)."
    : "";

  return {
    transportMode: basic.transportMode,
    unitCbm,
    unitWeightKg,
    unitsPerOrder,
    unitsPerCartonAuto,
    cartonsCount,
    shipmentCbm,
    shipmentWeightKg,
    chargeableCbm,
    shippingTotal,
    shippingPerUnit,
    breakdown: lines,
    oversizeFlag,
    oversizeNote,
  };
}

function resolveAssumptions(product) {
  const basic = product.basic;
  const assumptions = product.assumptions;
  const category = state.settings.categoryDefaults[basic.category] ?? state.settings.categoryDefaults.generic;
  const costDefaults = state.settings.costDefaults ?? DEFAULT_SETTINGS.costDefaults;
  const listingPackages = state.settings.lifecycle?.listingPackages ?? DEFAULT_SETTINGS.lifecycle.listingPackages;
  const launchProfiles = state.settings.lifecycle?.launchProfiles ?? DEFAULT_SETTINGS.lifecycle.launchProfiles;
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

  const defaultLeakage = clamp(GLOBAL_DEFAULTS.leakageRatePct, 0, 20);
  const defaultCustomsRate = clamp(GLOBAL_DEFAULTS.importCustomsDutyRate, 0, 40);
  const defaultImportVatRate = clamp(GLOBAL_DEFAULTS.importVatRate, 0, 30);
  const defaultReferralRate = clamp(category.referralRate, 0, 25);
  const defaultTargetMargin = clamp(category.targetMarginPct, 0, 50);
  const defaultLifecycleMonths = clamp(roundInt(state.settings.lifecycle?.defaultMonths, 36), 1, 120);
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
  const threePlInboundPerCartonEur = clamp(
    useLogisticsOverride
      ? num(extra.threePlInboundPerCartonEur, costDefaults.threePlInboundPerCartonEur)
      : num(costDefaults.threePlInboundPerCartonEur, 0),
    0,
    100,
  );
  const threePlStoragePerPalletMonthEur = clamp(
    useLogisticsOverride
      ? num(extra.threePlStoragePerPalletMonthEur, costDefaults.threePlStoragePerPalletMonthEur)
      : num(costDefaults.threePlStoragePerPalletMonthEur, 0),
    0,
    500,
  );
  const threePlOutboundPerCartonEur = clamp(
    useLogisticsOverride
      ? num(extra.threePlOutboundPerCartonEur, costDefaults.threePlOutboundPerCartonEur)
      : num(costDefaults.threePlOutboundPerCartonEur, 0),
    0,
    200,
  );
  const unitsPerPallet = clamp(
    roundInt(useLogisticsOverride ? num(extra.unitsPerPallet, costDefaults.unitsPerPallet) : num(costDefaults.unitsPerPallet, 240), 240),
    1,
    10000,
  );
  const avg3PlStorageMonths = clamp(
    useLogisticsOverride
      ? num(extra.avg3PlStorageMonths, costDefaults.avg3PlStorageMonths)
      : num(costDefaults.avg3PlStorageMonths, 1.2),
    0,
    12,
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
    vatRate: MARKETPLACE_VAT[basic.marketplace] ?? 19,

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
      threePlInboundPerCartonEur,
      threePlStoragePerPalletMonthEur,
      threePlOutboundPerCartonEur,
      unitsPerPallet,
      avg3PlStorageMonths,
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

function buildStageState(product, metrics) {
  const stage = getProductStage(product);
  const deepDive = product.workflow?.deepDive ?? {};

  const quickPass = metrics.netMarginPct > 20 && metrics.db1Unit > 0;
  const validationPass =
    quickPass &&
    metrics.sensitivity.worst.profitMonthly > 0 &&
    metrics.paybackMonths !== null &&
    metrics.paybackMonths <= 8;
  const deepChecklistPass =
    Boolean(deepDive.supplierValidated) &&
    Boolean(deepDive.complianceChecked) &&
    Boolean(deepDive.sampleDecisionReady);
  const deepPass = validationPass && deepChecklistPass;

  const readinessByStage = {
    quick: quickPass,
    validation: validationPass,
    deep_dive: deepPass,
  };

  const hintByStage = {
    quick:
      "Quick-Check: Ballpark-Marge und Unit-Economics prüfen (Netto-Marge > 20%, DB1 > 0 als Leitwert).",
    validation:
      "Validation: kritische Annahmen validieren (Worst-Case > 0, Payback <= 8 Monate als Leitwert).",
    deep_dive:
      "Deep-Dive: finale Risikoprüfung und Sample-Entscheidung.",
  };

  let statusClass = "warn";
  let statusText = "Status: in Prüfung";
  if (readinessByStage[stage]) {
    statusClass = "pass";
    statusText = `Status: ${STAGE_LABELS[stage]} bereit`;
  } else if (stage === "quick") {
    statusClass = "fail";
    statusText = "Status: Quick-Check offen";
  } else {
    statusClass = "warn";
    statusText = `Status: ${STAGE_LABELS[stage]} offen`;
  }

  const blockers = [];
  if (!quickPass) {
    blockers.push("Quick-Check offen: Netto-Marge > 20% und DB1 > 0 noch nicht erreicht.");
  }
  if (stage !== "quick" && !validationPass) {
    blockers.push("Validation offen: Worst-Case oder Payback-Leitwert ist noch kritisch.");
  }
  if (stage === "deep_dive" && !deepChecklistPass) {
    blockers.push("Deep-Dive Checklist unvollständig.");
  }

  return {
    stage,
    quickPass,
    validationPass,
    deepPass,
    deepChecklistPass,
    readinessByStage,
    hint: hintByStage[stage],
    statusClass,
    statusText,
    blockers,
  };
}

function calculateProduct(product, scenario = {}, options = { includeDerived: true }) {
  const resolved = resolveAssumptions(product);
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

  const shipping = calculateShippingDoorToDoor(product);
  const extra = resolved.extraCosts;

  const exwUnitUsd = Math.max(0, num(basic.exwUnit));
  const exwUnit = exwUnitUsd * fxUsdToEur;
  const shippingUnit = shipping.shippingPerUnit;
  const packagingUnit = extra.packagingPerUnitEur + extra.otherUnitCostEur;
  const orderFixedPerUnit =
    (extra.docsPerOrderEur + extra.freightPapersPerOrderEur) / Math.max(1, shipping.unitsPerOrder);
  const threePlInboundPerUnit =
    (shipping.cartonsCount * extra.threePlInboundPerCartonEur) / Math.max(1, shipping.unitsPerOrder);
  const threePlOutboundPerUnit =
    (shipping.cartonsCount * extra.threePlOutboundPerCartonEur) / Math.max(1, shipping.unitsPerOrder);
  const threePlStoragePerUnit =
    (extra.threePlStoragePerPalletMonthEur * extra.avg3PlStorageMonths) / Math.max(1, extra.unitsPerPallet);
  const amazonStoragePerUnit = extra.amazonStoragePerCbmMonthEur * extra.avgAmazonStorageMonths * shipping.unitCbm;
  const logisticsExtraUnit =
    orderFixedPerUnit +
    threePlInboundPerUnit +
    threePlOutboundPerUnit +
    threePlStoragePerUnit +
    amazonStoragePerUnit;

  const landedBeforeDuty = exwUnit + shippingUnit + packagingUnit + logisticsExtraUnit;
  const customsUnit = landedBeforeDuty * (resolved.customsDutyRate / 100);
  const importVatUnit = (landedBeforeDuty + customsUnit) * (resolved.importVatRate / 100);

  const landedUnit = landedBeforeDuty + customsUnit + (resolved.includeImportVatAsCost ? importVatUnit : 0);

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
  const importVatCostMonthly = resolved.includeImportVatAsCost ? importVatUnit * monthlyUnits : 0;

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
  const sellerboardMarginPct = grossRevenueMonthly > 0 ? (profitBeforeOverheadMonthly / grossRevenueMonthly) * 100 : 0;

  const investedCapital = landedUnit * unitsHorizon + launchBudget + listingPackageCost + setupOneOffTotal;
  const productRoiPct = investedCapital > 0 ? (profitHorizon / investedCapital) * 100 : 0;

  const importVatPrefinance = resolved.includeImportVatInCashRoi ? importVatUnit * unitsHorizon : 0;
  const cashCapital = investedCapital + importVatPrefinance;
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
    threePlInboundPerUnit,
    threePlOutboundPerUnit,
    threePlStoragePerUnit,
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
  };
  return map[path] ?? null;
}

function impactMonthlyFromPath(path, metrics) {
  if (!path || !metrics) {
    return 0;
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
        metrics.threePlOutboundPerUnit +
        metrics.amazonStoragePerUnit +
        metrics.packagingUnit) *
      metrics.monthlyUnits
    );
  }
  if (path.startsWith("settings.shipping12m.") || path.startsWith("settings.cartonRules.")) {
    return metrics.shippingMonthly;
  }
  if (path.startsWith("settings.costDefaults.")) {
    return metrics.block1Monthly + metrics.block2Monthly;
  }
  return 0;
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

function getPathHelp(path) {
  if (path.startsWith("settings.")) {
    return SETTINGS_HELP[path.slice("settings.".length)] ?? "";
  }
  return FIELD_HELP[path] ?? "";
}

function buildStageImpactItems(metrics, stage) {
  const threePlInboundMonthly = metrics.threePlInboundPerUnit * metrics.monthlyUnits;
  const threePlStorageMonthly = metrics.threePlStoragePerUnit * metrics.monthlyUnits;
  const threePlOutboundMonthly = metrics.threePlOutboundPerUnit * metrics.monthlyUnits;
  const amazonStorageMonthly = metrics.amazonStoragePerUnit * metrics.monthlyUnits;
  const amazonFeesMonthly = metrics.referralMonthly + metrics.fbaFeeUnit * metrics.monthlyUnits + amazonStorageMonthly;
  const orderOpsMonthly = metrics.orderFixedPerUnit * metrics.monthlyUnits;
  const setupAmortizedMonthly = metrics.setupOneOffTotal / Math.max(1, metrics.horizonMonths);
  const unitBase = Math.max(1, metrics.monthlyUnits);
  const shippingImportUnit = metrics.shippingUnit + metrics.customsUnit + metrics.orderFixedPerUnit;
  const amazonFeesUnit = metrics.referralFeeUnit + metrics.fbaFeeUnit;
  const threePlInboundUnit =
    metrics.threePlInboundPerUnit +
    metrics.threePlStoragePerUnit +
    metrics.threePlOutboundPerUnit +
    metrics.amazonStoragePerUnit;
  const listingLifecycleUnit = metrics.block2Monthly / unitBase;
  const leakageUnit = metrics.block3Monthly / unitBase;

  const quickItems = [
    {
      label: "Shipping & Import (EUR/Unit)",
      value: formatCurrency(shippingImportUnit),
      impactMonthly: (shippingImportUnit * metrics.monthlyUnits),
      explain: "Door-to-Door Shipping, Zoll und orderbezogene Import-Fixkosten pro Unit.",
      formula: "Shipping & Import/Unit = Shipping/Unit + Zoll/Unit + Order-Fix/Unit.",
      source: "User-Input (Preis/EK/Maße) + Global Settings (Shipping, Kosten-Defaults) + Kategorie-Default (Zoll/Steuer).",
      robustness: "Mittel (mehrere Annahmen entlang der Kette).",
      driverPaths: [
        "basic.unitsPerOrder",
        "basic.packLengthCm",
        "basic.packWidthCm",
        "basic.packHeightCm",
        "basic.netWeightG",
        "assumptions.import.customsDutyRate",
        "assumptions.extraCosts.overridePackagingGroup",
        "settings.shipping12m.lclRateEurPerCbm",
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
      value: formatCurrency(threePlInboundUnit),
      impactMonthly: (threePlInboundUnit * metrics.monthlyUnits),
      explain: "3PL Inbound, 3PL Lagerung, 3PL->Amazon und Amazon-Lageranteil pro Unit.",
      formula: "3PL & Inbound/Unit = 3PL Inbound + 3PL Lager + 3PL Outbound + Amazon-Lager.",
      source: "Global costDefaults (3PL/Storage) oder Produkt-Override.",
      robustness: "Mittel (volumen- und lagerdauerabhängig).",
      driverPaths: [
        "assumptions.extraCosts.overrideLogisticsGroup",
        "assumptions.extraCosts.threePlInboundPerCartonEur",
        "assumptions.extraCosts.threePlStoragePerPalletMonthEur",
        "assumptions.extraCosts.threePlOutboundPerCartonEur",
        "assumptions.extraCosts.amazonStoragePerCbmMonthEur",
        "assumptions.extraCosts.avgAmazonStorageMonths",
        "settings.costDefaults.threePlInboundPerCartonEur",
        "settings.costDefaults.threePlStoragePerPalletMonthEur",
        "settings.costDefaults.threePlOutboundPerCartonEur",
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
      explain: "Internationaler D2D-Anteil aus Fixblöcken + LCL variabel (W/M).",
      formula: "Shipping Total = Origin + Destination + On-Carriage + optional Broker + (chargeable CBM × LCL-Rate).",
      source: "Globale 12M-Settings + Produktmaße/-gewicht/-Menge.",
      robustness: "Mittel (Richtwert, kein Live-Spot-Tarif).",
      driverPaths: [
        "basic.unitsPerOrder",
        "basic.netWeightG",
        "basic.packLengthCm",
        "basic.packWidthCm",
        "basic.packHeightCm",
        "settings.shipping12m.lclRateEurPerCbm",
        "settings.shipping12m.originFixedEurPerShipment",
        "settings.shipping12m.destinationFixedEurPerShipment",
        "settings.shipping12m.deOncarriageFixedEurPerShipment",
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
        "assumptions.extraCosts.threePlStoragePerPalletMonthEur",
        "assumptions.extraCosts.unitsPerPallet",
        "assumptions.extraCosts.avg3PlStorageMonths",
        "settings.costDefaults.threePlStoragePerPalletMonthEur",
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
      label: "3PL Inbound + Outbound / Monat",
      value: formatCurrency(threePlInboundMonthly + threePlOutboundMonthly),
      impactMonthly: threePlInboundMonthly + threePlOutboundMonthly,
      explain: "3PL Wareneingang je Karton plus Versand 3PL -> Amazon je Karton.",
      formula: "Inbound/Outbound je Unit aus Kartonanzahl und Gebühren je Karton.",
      source: "Globale 3PL-Defaults + Auto-Kartonisierung.",
      robustness: "Mittel (karton- und mengenabhängig).",
      driverPaths: [
        "assumptions.extraCosts.threePlInboundPerCartonEur",
        "assumptions.extraCosts.threePlOutboundPerCartonEur",
        "basic.unitsPerOrder",
        "basic.packLengthCm",
        "basic.packWidthCm",
        "basic.packHeightCm",
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
      explain: "Zoll auf importierten Warenwert (inkl. Shippinganteile im Landed-Teil).",
      formula: "Zoll/Unit = Zollsatz × Landed before duty; danach × Monatsabsatz.",
      source: "Default China->DE (oder Override) + Landed-Basis.",
      robustness: "Hoch (tariflich vorgegeben).",
      driverPaths: ["assumptions.import.customsDutyRate", "basic.exwUnit", "basic.unitsPerOrder"],
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
  const paths = [...new Set((payload?.driverPaths ?? []).filter(Boolean))];
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
  };
  applyDriverFocus(paths, state.ui.driverModal.title);
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

  const summary = document.createElement("article");
  summary.className = "modal-field";
  const summaryTitle = document.createElement("strong");
  summaryTitle.textContent = "Was ist das?";
  summary.appendChild(summaryTitle);
  const summaryText = document.createElement("small");
  summaryText.textContent = state.ui.driverModal.explain || "Kostentreiber der aktuellen Kalkulation.";
  summary.appendChild(summaryText);

  const formulaTitle = document.createElement("strong");
  formulaTitle.textContent = "Wie wird es berechnet?";
  formulaTitle.style.marginTop = "8px";
  summary.appendChild(formulaTitle);
  const formulaText = document.createElement("small");
  formulaText.textContent =
    state.ui.driverModal.formula ||
    "Der Wert wird aus den unten gelisteten Inputs/Defaults direkt gemäß Kostenmodell berechnet.";
  summary.appendChild(formulaText);

  if (state.ui.driverModal.source || state.ui.driverModal.robustness) {
    const sourceText = document.createElement("small");
    const parts = [];
    if (state.ui.driverModal.source) {
      parts.push(`Herkunft: ${state.ui.driverModal.source}`);
    }
    if (state.ui.driverModal.robustness) {
      parts.push(`Robustheit: ${state.ui.driverModal.robustness}`);
    }
    sourceText.textContent = parts.join(" · ");
    summary.appendChild(sourceText);
  }
  dom.driverModalFields.appendChild(summary);

  const sectionHead = document.createElement("article");
  sectionHead.className = "modal-field";
  const sectionTitle = document.createElement("strong");
  sectionTitle.textContent = "Relevante Inputs & Annahmen";
  sectionHead.appendChild(sectionTitle);
  const sectionText = document.createElement("small");
  sectionText.textContent = "Nur die Felder, die diesen Kostentreiber direkt beeinflussen.";
  sectionHead.appendChild(sectionText);
  dom.driverModalFields.appendChild(sectionHead);

  state.ui.driverModal.driverPaths.forEach((path) => {
    const sourceControl = getFieldControl(path);
    const label = extractControlLabel(sourceControl, path);
    const helpText = getPathHelp(path);

    const field = document.createElement("article");
    field.className = "modal-field";

    const head = document.createElement("div");
    head.className = "modal-field-head";
    const strong = document.createElement("strong");
    strong.textContent = label;
    head.appendChild(strong);
    field.appendChild(head);

    if (path.startsWith("settings.")) {
      const settingsPath = path.slice("settings.".length);
      const value = getByPath(state.settings, settingsPath);
      const text = document.createElement("small");
      text.textContent = `Globaler Wert: ${
        typeof value === "boolean" ? (value ? "aktiv" : "inaktiv") : formatNumber(num(value, 0))
      }`;
      field.appendChild(text);
      if (helpText) {
        const help = document.createElement("small");
        help.textContent = helpText;
        field.appendChild(help);
      }
      const actions = document.createElement("div");
      actions.className = "modal-actions";
      const button = document.createElement("button");
      button.className = "btn btn-ghost";
      button.type = "button";
      button.textContent = "In Settings öffnen";
      button.addEventListener("click", () => {
        closeDriverModal();
        focusMetricDrivers([path], inferAdvancedSectionFromPath(path), label);
      });
      actions.appendChild(button);
      field.appendChild(actions);
      dom.driverModalFields.appendChild(field);
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
        refreshAfterModalInput();
      });
      field.appendChild(control);
    } else if (control instanceof HTMLInputElement) {
      const currentValue = getByPath(selected, path);
      control.value = currentValue ?? "";
      control.disabled = !overrideEnabled;
      control.addEventListener("change", () => {
        updateSelectedField(path, control.value);
        refreshAfterModalInput();
      });
      field.appendChild(control);
    }

    if (helpText) {
      const help = document.createElement("small");
      help.textContent = helpText;
      field.appendChild(help);
    }

    dom.driverModalFields.appendChild(field);
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
  container.innerHTML = "";

  lines.forEach((line) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    const impact = classifyImpact(line.impactMonthly, options.totalCostMonthly);
    const chip = document.createElement("em");

    label.textContent = line.label;
    value.textContent = line.value;

    chip.className = `impact-chip ${impact.level}`;
    chip.textContent = impact.label;
    label.appendChild(chip);

    li.classList.add(`impact-${impact.level}`);
    li.dataset.impactLevel = impact.level;
    li.dataset.impactShare = String(impact.sharePct);

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
      li.title = `${line.explain}${formula}\nImpact: ${impact.label} (${formatPercent(impact.sharePct)} der Gesamtkosten).${defaultSource}${robustness}`;
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

function renderShippingDetails(metrics) {
  if (dom.basicShippingUnit) {
    dom.basicShippingUnit.textContent = formatCurrency(metrics.shippingUnit);
  }
  if (dom.basicShippingMeta) {
    dom.basicShippingMeta.textContent = `Chargeable: ${formatNumber(metrics.shipping.chargeableCbm)} CBM · PO: ${formatNumber(metrics.shipping.unitsPerOrder)} Units`;
  }

  if (dom.shippingMethodText) {
    dom.shippingMethodText.textContent =
      "So berechnen wir Shipping (12-Monats-Ø): Für China→DE schätzen wir Kartons automatisch aus Produktmaßen, Gewicht und Amazon-Kartonlimits. Daraus berechnen wir chargeable CBM (W/M) und addieren fixe Origin/Destination/On-Carriage Kosten. Ergebnis ist ein einzelner Richtwert in EUR/Unit, kein Live-Tarif.";
  }

  if (dom.shippingDetailList) {
    dom.shippingDetailList.innerHTML = "";
    metrics.shipping.breakdown.forEach((line) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${line.label}</span><strong>${formatCurrency(line.total)} · ${formatCurrency(line.perUnit)}/Unit</strong>`;
      dom.shippingDetailList.appendChild(li);
    });

    const totalLi = document.createElement("li");
    totalLi.innerHTML = `<span>Shipping total</span><strong>${formatCurrency(metrics.shipping.shippingTotal)} · ${formatCurrency(metrics.shipping.shippingPerUnit)}/Unit</strong>`;
    dom.shippingDetailList.appendChild(totalLi);
  }

  if (dom.shippingDebugInfo) {
    const base = `units_per_carton_auto=${formatNumber(metrics.shipping.unitsPerCartonAuto)} · cartons_count=${formatNumber(metrics.shipping.cartonsCount)} · shipment_cbm=${formatNumber(metrics.shipping.shipmentCbm)} · shipment_weight_kg=${formatNumber(metrics.shipping.shipmentWeightKg)} · chargeable_cbm=${formatNumber(metrics.shipping.chargeableCbm)}`;
    dom.shippingDebugInfo.textContent = metrics.shipping.oversizeFlag
      ? `${base} · Hinweis: ${metrics.shipping.oversizeNote}`
      : base;
  }
}

function renderLogisticsChain(metrics) {
  if (!dom.chainSupplierCost) {
    return;
  }

  const supplierUnit = metrics.exwUnit + metrics.packagingUnit;
  const importUnit = metrics.shippingUnit + metrics.customsUnit + metrics.orderFixedPerUnit;
  const threePlUnit = metrics.threePlInboundPerUnit + metrics.threePlStoragePerUnit;
  const inboundUnit = metrics.threePlOutboundPerUnit;
  const amazonUnit = metrics.referralFeeUnit + metrics.fbaFeeUnit + metrics.amazonStoragePerUnit;

  const monthlyFactor = metrics.monthlyUnits;
  dom.chainSupplierCost.textContent = `${formatCurrency(supplierUnit)}/Unit · ${formatCurrency(supplierUnit * monthlyFactor)}/Monat`;
  dom.chainImportCost.textContent = `${formatCurrency(importUnit)}/Unit · ${formatCurrency(importUnit * monthlyFactor)}/Monat`;
  dom.chainThreePlCost.textContent = `${formatCurrency(threePlUnit)}/Unit · ${formatCurrency(threePlUnit * monthlyFactor)}/Monat`;
  dom.chainInboundCost.textContent = `${formatCurrency(inboundUnit)}/Unit · ${formatCurrency(inboundUnit * monthlyFactor)}/Monat`;
  dom.chainAmazonCost.textContent = `${formatCurrency(amazonUnit)}/Unit · ${formatCurrency(amazonUnit * monthlyFactor)}/Monat`;
}

function renderSelectedOutputs(metrics) {
  setKpi(dom.kpiRevenueGross, metrics.grossRevenueMonthly, "currency");
  setKpi(dom.kpiRevenueNet, metrics.netRevenueMonthly, "currency");
  setKpi(dom.kpiSellerboardMargin, metrics.sellerboardMarginPct, "percent");
  setKpi(dom.kpiNetMargin, metrics.netMarginPct, "percent");
  setKpi(dom.kpiShippingUnit, metrics.shippingUnit, "currency");
  setKpi(dom.kpiLandedUnit, metrics.landedUnit, "currency");
  setKpi(dom.kpiDb1Unit, metrics.db1Unit, "currency");
  setKpi(dom.kpiDb1Margin, metrics.db1MarginPct, "percent");
  setKpi(dom.kpiGrossProfitMonthly, metrics.grossProfitMonthly, "currency");
  setKpi(dom.kpiProfitMonthly, metrics.profitMonthly, "currency");

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

  renderShippingDetails(metrics);
  renderLogisticsChain(metrics);

  renderBlockList(
    dom.unitBlockList,
    [
      {
        label: "EXW / Einheit (USD)",
        value: formatUsd(metrics.exwUnitUsd),
        explain: "Direkter EK in USD. Umrechnung mit aktuellem USD→EUR Kurs.",
        impactMonthly: metrics.exwUnit * metrics.monthlyUnits,
        driverPaths: ["basic.exwUnit"],
      },
      {
        label: `EXW umgerechnet / Einheit (EUR, 1 USD=${formatNumber(metrics.fxUsdToEur)} EUR)`,
        value: formatCurrency(metrics.exwUnit),
        explain: "EXW(EUR) = EXW(USD) × USD→EUR.",
        impactMonthly: metrics.exwUnit * metrics.monthlyUnits,
        driverPaths: ["basic.exwUnit"],
      },
      {
        label: "Verpackung + weitere Stückkosten / Einheit (EUR)",
        value: formatCurrency(metrics.packagingUnit),
        targetSection: "advancedOpsSection",
        explain: "Zusätzliche Verpackungskosten und weitere variable Kosten pro Unit.",
        formula: "Verpackung/Unit + weitere Kosten/Unit.",
        source: "Global costDefaults oder produktbezogener Override.",
        robustness: "Mittel bis hoch (lieferanten- und materialabhängig).",
        impactMonthly: metrics.packagingUnit * metrics.monthlyUnits,
        driverPaths: [
          "assumptions.extraCosts.overridePackagingGroup",
          "assumptions.extraCosts.packagingPerUnitEur",
          "assumptions.extraCosts.otherUnitCostEur",
          "settings.costDefaults.packagingPerUnitEur",
          "settings.costDefaults.otherUnitCostEur",
        ],
      },
      {
        label: "Shipping door-to-door / Einheit (EUR)",
        value: formatCurrency(metrics.shippingUnit),
        targetSection: "advancedShippingSection",
        explain: "12M-Ø Door-to-Door-Modell: fixe Kosten + LCL variabel über chargeable CBM.",
        formula: "Shipping/Unit = Shipping total (Fixkosten + LCL W/M) / Units pro Order.",
        source: "Globale 12M Shipping-Settings + Produktmaße/-gewicht.",
        robustness: "Mittel (Richtwert, kein Live-Spot).",
        impactMonthly: metrics.shippingMonthly,
        driverPaths: [
          "basic.unitsPerOrder",
          "basic.netWeightG",
          "basic.packLengthCm",
          "basic.packWidthCm",
          "basic.packHeightCm",
          "settings.shipping12m.lclRateEurPerCbm",
          "settings.shipping12m.originFixedEurPerShipment",
          "settings.shipping12m.destinationFixedEurPerShipment",
          "settings.shipping12m.deOncarriageFixedEurPerShipment",
          "settings.cartonRules.packFactor",
        ],
      },
      {
        label: "Order-Fixkosten (Docs + Frachtpapiere) / Einheit (EUR)",
        value: formatCurrency(metrics.orderFixedPerUnit),
        targetSection: "advancedOpsSection",
        explain: "Fixkosten je Order, verteilt auf Units pro Order.",
        formula: "Order-Fix/Unit = (Dokumentation + Frachtpapiere) / Units pro Order.",
        source: "Global costDefaults oder Produkt-Override.",
        robustness: "Hoch (fixe Prozesskosten).",
        impactMonthly: metrics.orderFixedPerUnit * metrics.monthlyUnits,
        driverPaths: [
          "assumptions.extraCosts.overrideLogisticsGroup",
          "assumptions.extraCosts.docsPerOrderEur",
          "assumptions.extraCosts.freightPapersPerOrderEur",
          "basic.unitsPerOrder",
          "settings.costDefaults.docsPerOrderEur",
          "settings.costDefaults.freightPapersPerOrderEur",
        ],
      },
      {
        label: "3PL Inbound / Einheit (EUR)",
        value: formatCurrency(metrics.threePlInboundPerUnit),
        targetSection: "advancedOpsSection",
        explain: "3PL Wareneingang je Karton, verteilt auf Units pro Order.",
        formula: "3PL Inbound/Unit = (Kartonanzahl × Inbound je Karton) / Units pro Order.",
        source: "Global costDefaults + Auto-Kartonisierung oder Produkt-Override.",
        robustness: "Mittel.",
        impactMonthly: metrics.threePlInboundPerUnit * metrics.monthlyUnits,
        driverPaths: [
          "assumptions.extraCosts.overrideLogisticsGroup",
          "assumptions.extraCosts.threePlInboundPerCartonEur",
          "basic.unitsPerOrder",
          "basic.packLengthCm",
          "basic.packWidthCm",
          "basic.packHeightCm",
          "settings.costDefaults.threePlInboundPerCartonEur",
        ],
      },
      {
        label: "3PL Lagerung / Einheit (EUR)",
        value: formatCurrency(metrics.threePlStoragePerUnit),
        targetSection: "advancedOpsSection",
        explain: "3PL Lager je Palette/Monat, umgerechnet auf Unit und Lagerdauer.",
        formula: "3PL Lager/Unit = (EUR Palette/Monat × 3PL-Monate) / Units je Palette.",
        source: "Global costDefaults oder Produkt-Override.",
        robustness: "Mittel bis hoch.",
        impactMonthly: metrics.threePlStoragePerUnit * metrics.monthlyUnits,
        driverPaths: [
          "assumptions.extraCosts.overrideLogisticsGroup",
          "assumptions.extraCosts.threePlStoragePerPalletMonthEur",
          "assumptions.extraCosts.unitsPerPallet",
          "assumptions.extraCosts.avg3PlStorageMonths",
          "settings.costDefaults.threePlStoragePerPalletMonthEur",
        ],
      },
      {
        label: "3PL -> Amazon Versand / Einheit (EUR)",
        value: formatCurrency(metrics.threePlOutboundPerUnit),
        targetSection: "advancedOpsSection",
        explain: "Outbound-Versand von 3PL zu Amazon je Karton, auf Unit verteilt.",
        formula: "3PL Outbound/Unit = (Kartonanzahl × Outbound je Karton) / Units pro Order.",
        source: "Global costDefaults + Auto-Kartonisierung oder Produkt-Override.",
        robustness: "Mittel.",
        impactMonthly: metrics.threePlOutboundPerUnit * metrics.monthlyUnits,
        driverPaths: [
          "assumptions.extraCosts.overrideLogisticsGroup",
          "assumptions.extraCosts.threePlOutboundPerCartonEur",
          "basic.unitsPerOrder",
          "basic.packLengthCm",
          "basic.packWidthCm",
          "basic.packHeightCm",
          "settings.costDefaults.threePlOutboundPerCartonEur",
        ],
      },
      {
        label: "Amazon Lagerung / Einheit (EUR)",
        value: formatCurrency(metrics.amazonStoragePerUnit),
        targetSection: "advancedOpsSection",
        explain: "Amazon-Lagerkosten aus EUR/CBM, Lagerdauer und Unit-CBM.",
        formula: "Amazon Lager/Unit = EUR je CBM/Monat × Amazon-Monate × Unit-CBM.",
        source: "Global costDefaults oder Produkt-Override.",
        robustness: "Mittel (saisonal/volumenabhängig).",
        impactMonthly: metrics.amazonStoragePerUnit * metrics.monthlyUnits,
        driverPaths: [
          "assumptions.extraCosts.overrideLogisticsGroup",
          "assumptions.extraCosts.amazonStoragePerCbmMonthEur",
          "assumptions.extraCosts.avgAmazonStorageMonths",
          "basic.packLengthCm",
          "basic.packWidthCm",
          "basic.packHeightCm",
          "settings.costDefaults.amazonStoragePerCbmMonthEur",
        ],
      },
      {
        label: "Zoll / Einheit (EUR)",
        value: formatCurrency(metrics.customsUnit),
        targetSection: "advancedImportSection",
        explain: "Zoll auf EXW + Shipping bis Import.",
        formula: "Zoll/Unit = customsDutyRate × landedBeforeDuty.",
        source: "Default (Route/Kategorie) oder Produkt-Override.",
        robustness: "Hoch.",
        impactMonthly: metrics.customsMonthly,
        driverPaths: ["assumptions.import.customsDutyRate", "basic.exwUnit", "basic.unitsPerOrder"],
      },
      {
        label: "Landed / Einheit (EUR)",
        value: formatCurrency(metrics.landedUnit),
        targetSection: "advancedShippingSection",
        explain: "Landed = EXW(EUR) + Shipping + Zoll (+ optional EUSt als Kosten).",
        formula: "Landed/Unit = EXW(EUR) + Shipping + Zoll (+ optional EUSt).",
        source: "User Inputs + globale Defaults.",
        robustness: "Mittel.",
        impactMonthly: metrics.landedUnit * metrics.monthlyUnits,
        driverPaths: [
          "basic.exwUnit",
          "basic.unitsPerOrder",
          "assumptions.import.customsDutyRate",
          "assumptions.import.importVatRate",
          "assumptions.import.includeImportVatAsCost",
        ],
      },
      {
        label: "Amazon Referral / Einheit (EUR, brutto-basiert)",
        value: formatCurrency(metrics.referralFeeUnit),
        targetSection: "advancedImportSection",
        explain: "Referral Fee in % auf Brutto-Preis, mindestens Mindestgebühr.",
        formula: "Referral/Unit = max(Mindestfee, Brutto-Preis × Referral%).",
        source: "Kategorie-Default oder Produkt-Override.",
        robustness: "Hoch.",
        impactMonthly: metrics.referralMonthly,
        driverPaths: ["assumptions.amazon.referralRate", "basic.category", "basic.priceGross"],
      },
      {
        label: `FBA Fee / Einheit (EUR, ${metrics.fbaTier})`,
        value: formatCurrency(metrics.fbaFeeUnit),
        targetSection: "advancedImportSection",
        explain: "Automatische FBA-Tier-Erkennung (oder manueller Override).",
        formula: "FBA Fee = Auto-Tier aus Maßen/Gewicht oder manueller Wert.",
        source: "FBA-Tierlogik + optionales Produkt-Override.",
        robustness: "Mittel bis hoch.",
        impactMonthly: metrics.fbaFeeUnit * metrics.monthlyUnits,
        driverPaths: [
          "assumptions.amazon.useManualFbaFee",
          "assumptions.amazon.manualFbaFee",
          "basic.netWeightG",
          "basic.packLengthCm",
          "basic.packWidthCm",
          "basic.packHeightCm",
        ],
      },
      {
        label: `Ads / Einheit (EUR, eff. ${formatPercent(metrics.effectiveTacosRate)} auf Netto-Umsatz)`,
        value: formatCurrency(metrics.adsUnit),
        targetSection: "advancedAdsSection",
        explain: "Ads-Kosten = Netto-Preis × effektiver TACoS inkl. Launch-Boost-Profil.",
        formula: "Ads/Unit = Netto-Preis × effektiver TACoS%.",
        source: "User TACoS + Launch-Profil-Defaults.",
        robustness: "Niedrig bis mittel.",
        impactMonthly: metrics.adsMonthly,
        driverPaths: [
          "assumptions.ads.tacosRate",
          "assumptions.ads.launchMultiplier",
          "assumptions.ads.launchMonths",
          "basic.launchCompetition",
          "settings.lifecycle.launchProfiles.low.startTacosBoostPct",
          "settings.lifecycle.launchProfiles.medium.startTacosBoostPct",
          "settings.lifecycle.launchProfiles.high.startTacosBoostPct",
          "basic.category",
        ],
      },
      {
        label: "Retourenverlust + Handling / Einheit (EUR)",
        value: formatCurrency(metrics.returnLossUnit + metrics.returnHandlingUnit),
        targetSection: "advancedReturnsSection",
        explain: "Retourenquote, Unsellable-Anteil, Wiederverkaufsquote und Handling kombiniert.",
        formula: "Retouren/Unit = Verlustanteile aus Landed + Handlinganteil je Retoure.",
        source: "Kategorie-Defaults oder Produkt-Override.",
        robustness: "Niedrig bis mittel.",
        impactMonthly: metrics.returnsMonthly,
        driverPaths: [
          "assumptions.returns.returnRate",
          "assumptions.returns.resaleRate",
          "assumptions.returns.unsellableShare",
          "assumptions.returns.handlingCost",
        ],
      },
      {
        label: "Block 1 gesamt / Monat (EUR)",
        value: formatCurrency(metrics.block1Monthly),
        targetSection: "advancedShippingSection",
        explain: "Summe aller Unit-Economics-Kostenblöcke.",
        formula: "Block 1 = (Landed + Amazon Fees + Ads + Retouren) × Monatsabsatz.",
        source: "Aggregierter Kostenblock aus allen Unit-Treibern.",
        robustness: "Mittel.",
        impactMonthly: metrics.block1Monthly,
        driverPaths: [
          "basic.exwUnit",
          "basic.unitsPerOrder",
          "assumptions.ads.tacosRate",
          "assumptions.amazon.referralRate",
          "assumptions.returns.returnRate",
        ],
      },
    ],
    { totalCostMonthly: metrics.totalCostMonthly },
  );

  renderBlockList(
    dom.launchBlockList,
    [
      {
        label: `Launch-Profil (${launchCompetitionLabel(metrics.basic.launchCompetition)})`,
        value: `TACoS +${formatPercent(metrics.averageLaunchTacosBoostPct)} · Preis -${formatPercent(metrics.averageLaunchPriceDiscountPct)}`,
        targetSection: "settingsLifecycleSection",
        explain: "Profil steuert Launch-PPC-Druck und Einführungspreis in den ersten Wochen.",
        impactMonthly:
          Math.abs(metrics.netRevenueTargetMonthly - metrics.netRevenueMonthly) + metrics.launchAdsIncrementMonthly,
        driverPaths: [
          "basic.launchCompetition",
          "settings.lifecycle.launchProfiles.low.weeks",
          "settings.lifecycle.launchProfiles.low.startTacosBoostPct",
          "settings.lifecycle.launchProfiles.low.endTacosBoostPct",
          "settings.lifecycle.launchProfiles.low.startPriceDiscountPct",
          "settings.lifecycle.launchProfiles.medium.weeks",
          "settings.lifecycle.launchProfiles.medium.startTacosBoostPct",
          "settings.lifecycle.launchProfiles.medium.endTacosBoostPct",
          "settings.lifecycle.launchProfiles.medium.startPriceDiscountPct",
          "settings.lifecycle.launchProfiles.high.weeks",
          "settings.lifecycle.launchProfiles.high.startTacosBoostPct",
          "settings.lifecycle.launchProfiles.high.endTacosBoostPct",
          "settings.lifecycle.launchProfiles.high.startPriceDiscountPct",
        ],
      },
      {
        label: "Launch-Budget gesamt (EUR)",
        value: formatCurrency(metrics.launchBudget),
        targetSection: "advancedLifecycleSection",
        explain: "Einmaliges Budget, über Zeitraum amortisiert.",
        formula: "Launch gesamt = Pflichtfeld oder Summe Launch-Split.",
        source: "User-Input (produktbezogen).",
        robustness: "Hoch.",
        impactMonthly: metrics.launchMonthly,
        driverPaths: ["basic.launchBudgetTotal", "assumptions.launchSplit.enabled"],
      },
      {
        label: `Listing-Paket (${listingPackageLabel(metrics.resolved.listingPackageKey)}) gesamt (EUR)`,
        value: formatCurrency(metrics.listingPackageCost),
        targetSection: "settingsLifecycleSection",
        explain: "Listing-Erstellung, Bilder/Infografiken und A+ Content aus globalem Paketpreis.",
        formula: "Listing total = Summe Paketkomponenten (Listing + Bilder + A+).",
        source: "Global Settings (Listing-Pakete).",
        robustness: "Hoch.",
        impactMonthly: metrics.listingMonthly,
        driverPaths: [
          "basic.listingPackage",
          "settings.lifecycle.listingPackages.ai.listingCreationEur",
          "settings.lifecycle.listingPackages.ai.imagesInfographicsEur",
          "settings.lifecycle.listingPackages.ai.aPlusContentEur",
          "settings.lifecycle.listingPackages.photographer.listingCreationEur",
          "settings.lifecycle.listingPackages.photographer.imagesInfographicsEur",
          "settings.lifecycle.listingPackages.photographer.aPlusContentEur",
          "settings.lifecycle.listingPackages.visual_advantage.listingCreationEur",
          "settings.lifecycle.listingPackages.visual_advantage.imagesInfographicsEur",
          "settings.lifecycle.listingPackages.visual_advantage.aPlusContentEur",
        ],
      },
      {
        label: "Launch / Einheit über Zeitraum (EUR)",
        value: formatCurrency(metrics.launchUnit),
        targetSection: "advancedLifecycleSection",
        explain: "Launch-Budget geteilt durch geplante Units im Zeitraum.",
        impactMonthly: metrics.launchMonthly,
        driverPaths: ["basic.launchBudgetTotal", "basic.horizonMonths", "basic.demandValue", "basic.demandBasis"],
      },
      {
        label: "Launch amortisiert / Monat (EUR)",
        value: formatCurrency(metrics.launchMonthly),
        targetSection: "advancedLifecycleSection",
        explain: "Launch-Budget geteilt durch Betrachtungszeitraum in Monaten.",
        impactMonthly: metrics.launchMonthly,
        driverPaths: ["basic.launchBudgetTotal", "basic.horizonMonths"],
      },
      {
        label: `Listing amortisiert / Monat (EUR, ${formatNumber(metrics.lifecycleMonthsSetting)} Monate)`,
        value: formatCurrency(metrics.listingMonthly),
        targetSection: "settingsLifecycleSection",
        explain: "Listing-Paketkosten werden über den globalen Lifecycle-Horizont verteilt.",
        impactMonthly: metrics.listingMonthly,
        driverPaths: ["basic.listingPackage", "settings.lifecycle.defaultMonths"],
      },
      {
        label: "Weitere Lifecycle / Monat (EUR)",
        value: formatCurrency(metrics.otherLifecycleMonthly),
        targetSection: "advancedLifecycleSection",
        explain: "Zusätzliche, dauerhafte Lifecycle-Kosten außerhalb Unit Economics.",
        impactMonthly: metrics.otherLifecycleMonthly,
        driverPaths: ["assumptions.lifecycle.otherMonthlyCost"],
      },
      {
        label: "Block 2 gesamt / Monat (EUR)",
        value: formatCurrency(metrics.block2Monthly),
        targetSection: "advancedLifecycleSection",
        explain: "Summe aus Launch-Amortisation, Listing-Amortisation und weiteren Lifecycle-Kosten.",
        formula: "Block 2 = Launch/Monat + Listing/Monat + Launch Ops/Monat + weitere Lifecycle-Kosten.",
        source: "Aggregierter Launch/Lifecycle-Block.",
        robustness: "Mittel bis hoch.",
        impactMonthly: metrics.block2Monthly,
        driverPaths: [
          "basic.launchBudgetTotal",
          "basic.listingPackage",
          "settings.lifecycle.defaultMonths",
          "assumptions.lifecycle.otherMonthlyCost",
        ],
      },
    ],
    { totalCostMonthly: metrics.totalCostMonthly },
  );

  renderBlockList(
    dom.leakageBlockList,
    [
      {
        label: `Leakage-Rate (${formatPercent(metrics.leakageRatePct)} vom Netto-Umsatz)`,
        value: formatCurrency(metrics.block3Monthly),
        targetSection: "advancedLeakageSection",
        explain: "Pauschaler Sicherheitsabschlag für vergessene/indirekte Kosten.",
        formula: "Leakage/Monat = Netto-Umsatz × Leakage%.",
        source: "Globales Leakage-Setting oder Produkt-Override.",
        robustness: "Mittel.",
        impactMonthly: metrics.block3Monthly,
        driverPaths: ["assumptions.leakage.ratePct", "basic.priceGross", "basic.demandValue", "basic.demandBasis"],
      },
      {
        label: "Netto-Umsatz / Monat (EUR)",
        value: formatCurrency(metrics.netRevenueMonthly),
        explain: "Bemessungsgrundlage für den pauschalen Leakage-Block.",
        formula: "Netto-Umsatz = (Brutto-Preis / (1+USt)) × Monatsabsatz.",
        source: "User-Input Preis + Marketplace-USt + Absatzannahme.",
        robustness: "Hoch.",
        impactMonthly: metrics.block3Monthly,
        driverPaths: ["basic.priceGross", "basic.marketplace", "basic.demandValue", "basic.demandBasis"],
      },
      {
        label: "Block 3 gesamt / Monat (EUR)",
        value: formatCurrency(metrics.block3Monthly),
        targetSection: "advancedLeakageSection",
        explain: "Gesamter Leakage-Kostenblock pro Monat.",
        formula: "Block 3 = Leakage-Rate × Netto-Umsatz/Monat.",
        source: "Globales Leakage-Setting + Umsatztreiber.",
        robustness: "Mittel.",
        impactMonthly: metrics.block3Monthly,
        driverPaths: ["assumptions.leakage.ratePct", "basic.priceGross", "basic.demandValue", "basic.demandBasis"],
      },
    ],
    { totalCostMonthly: metrics.totalCostMonthly },
  );

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

function applyStageVisibility(product, stageState) {
  const stage = stageState.stage;
  const isDeep = stage === "deep_dive";
  const isQuick = stage === "quick";

  if (dom.advancedToggleWrap) {
    dom.advancedToggleWrap.classList.toggle("hidden", isQuick);
  }

  if (isQuick) {
    state.ui.advancedVisible = false;
  }

  dom.advancedPanel.classList.toggle("hidden", !state.ui.advancedVisible);
  if (dom.advancedToggle) {
    dom.advancedToggle.checked = state.ui.advancedVisible;
    dom.advancedToggle.disabled = isQuick;
  }

  const deepDiveSection = document.getElementById("advancedDeepDiveSection");
  if (deepDiveSection) {
    deepDiveSection.classList.toggle("hidden", !isDeep);
  }

  const deepDiveCheckboxes = document.querySelectorAll('[data-path^="workflow.deepDive."]');
  deepDiveCheckboxes.forEach((node) => {
    node.disabled = !isDeep;
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

  const packagingOverride = Boolean(getByPath(product, "assumptions.extraCosts.overridePackagingGroup"));
  document.querySelectorAll('[data-path^="assumptions.extraCosts.packagingPerUnitEur"], [data-path^="assumptions.extraCosts.otherUnitCostEur"]').forEach((field) => {
    field.disabled = !packagingOverride;
  });

  const logisticsOverride = Boolean(getByPath(product, "assumptions.extraCosts.overrideLogisticsGroup"));
  document.querySelectorAll('[data-path^="assumptions.extraCosts.docsPerOrderEur"], [data-path^="assumptions.extraCosts.freightPapersPerOrderEur"], [data-path^="assumptions.extraCosts.threePlInboundPerCartonEur"], [data-path^="assumptions.extraCosts.threePlStoragePerPalletMonthEur"], [data-path^="assumptions.extraCosts.threePlOutboundPerCartonEur"], [data-path^="assumptions.extraCosts.unitsPerPallet"], [data-path^="assumptions.extraCosts.avg3PlStorageMonths"], [data-path^="assumptions.extraCosts.amazonStoragePerCbmMonthEur"], [data-path^="assumptions.extraCosts.avgAmazonStorageMonths"]').forEach((field) => {
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

  renderSettingsInputs();
}

function openAdvancedSection(sectionId) {
  if (APP_PAGE === "product" && sectionId.startsWith("settings")) {
    window.location.href = `settings.html#${sectionId}`;
    return;
  }

  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }

  if (sectionId.startsWith("settings")) {
    setWorkspaceTab("settings");
  } else {
    setWorkspaceTab("product");
    state.ui.advancedVisible = true;
    dom.advancedPanel.classList.remove("hidden");
    dom.advancedToggle.checked = true;
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
  if (path.startsWith("assumptions.extraCosts.")) {
    return "advancedOpsSection";
  }
  if (path.startsWith("settings.")) {
    if (path.startsWith("settings.shipping12m.")) {
      return "settingsShippingSection";
    }
    if (path.startsWith("settings.cartonRules.")) {
      return "settingsCartonSection";
    }
    if (path.startsWith("settings.costDefaults.")) {
      return "settingsCostDefaultsSection";
    }
    if (path.startsWith("settings.lifecycle.")) {
      return "settingsLifecycleSection";
    }
    return "settingsCategorySection";
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
  renderStageImpactList(stageState.stage, metrics);

  renderSelectedOutputs(metrics);
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
  if (path === "basic.transportMode" && !["sea_lcl", "rail", "air"].includes(selected.basic.transportMode)) {
    selected.basic.transportMode = "sea_lcl";
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
  saveSettings();
}

function addProduct() {
  const product = defaultProduct(state.products.length + 1);
  state.products.push(product);
  state.selectedId = product.id;
  saveProducts();
  renderAll();
}

function duplicateProduct() {
  const selected = getSelectedProduct();
  if (!selected) {
    return;
  }

  const copy = deepClone(selected);
  copy.id = uid();
  copy.name = `${selected.name} (Kopie)`;

  state.products.push(copy);
  state.selectedId = copy.id;
  saveProducts();
  renderAll();
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
  renderAll();
}

function setSelectedStage(stage) {
  const selected = getSelectedProduct();
  if (!selected || !WORKFLOW_STAGES.includes(stage)) {
    return;
  }

  selected.workflow.stage = stage;
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
    dom.advancedToggle.title = "Advanced blendet produktspezifische Defaults, Overwrites und Shipping-Details ein.";
  }
  if (dom.stageQuickBtn) {
    dom.stageQuickBtn.title = "Quick-Check: schneller Ballpark-Check mit den wichtigsten Treibern.";
  }
  if (dom.stageValidationBtn) {
    dom.stageValidationBtn.title = "Validation: zentrale Annahmen prüfen und absichern.";
  }
  if (dom.stageDeepBtn) {
    dom.stageDeepBtn.title = "Deep-Dive: finale Prüfung vor Sample/PO-Entscheidung.";
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
      saveSettings();
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

  [dom.unitBlockList, dom.launchBlockList, dom.leakageBlockList].forEach((list) => {
    if (!list) {
      return;
    }
    list.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
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
  });

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

function init() {
  loadSettings();
  renderCategoryDefaultsAdmin();
  bindEvents();

  if (APP_PAGE === "settings") {
    renderSettingsInputs();
    applyMouseoverHelp();
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    return;
  }

  loadProducts();
  renderFxStatus();
  renderAll();
  refreshFxRate();
}

init();
