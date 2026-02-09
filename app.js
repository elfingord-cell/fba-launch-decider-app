const STORAGE_KEY_PRODUCTS = "fba-margin-calculator.8020.v3.products";
const STORAGE_KEY_SETTINGS = "fba-margin-calculator.8020.v3.settings";
const LEGACY_STORAGE_KEY = "fba-margin-calculator.8020.v2";

const MIN_REFERRAL_FEE = 0.3;
const DEFAULT_USD_TO_EUR = 0.92;
const FX_ENDPOINT = "https://api.frankfurter.app/latest?from=USD&to=EUR";

const MARKETPLACE_VAT = {
  DE: 19,
  FR: 20,
  IT: 22,
  ES: 21,
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
]);

const STRING_PATHS = new Set([
  "name",
  "basic.category",
  "basic.demandBasis",
  "basic.transportMode",
  "basic.marketplace",
  "basic.fulfillmentModel",
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
  },
};

const dom = {
  productCount: document.getElementById("productCount"),
  productList: document.getElementById("productList"),
  productItemTemplate: document.getElementById("productItemTemplate"),
  addProductBtn: document.getElementById("addProductBtn"),
  duplicateProductBtn: document.getElementById("duplicateProductBtn"),
  deleteProductBtn: document.getElementById("deleteProductBtn"),
  advancedToggle: document.getElementById("advancedToggle"),
  advancedPanel: document.getElementById("advancedPanel"),
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

  kpiRevenueGross: document.getElementById("kpiRevenueGross"),
  kpiRevenueNet: document.getElementById("kpiRevenueNet"),
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
    },
    assumptions: {
      ads: {
        overrideTacos: false,
        tacosRate: 12,
        overrideLaunchMultiplier: false,
        launchMultiplier: 1.5,
        overrideLaunchMonths: false,
        launchMonths: 3,
      },
      returns: {
        overrideReturnRate: false,
        returnRate: 6,
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

  merged.basic.horizonMonths = clamp(roundInt(merged.basic.horizonMonths, base.basic.horizonMonths), 1, 36);
  merged.basic.unitsPerOrder = Math.max(1, roundInt(merged.basic.unitsPerOrder, base.basic.unitsPerOrder));
  merged.basic.netWeightG = Math.max(0, num(merged.basic.netWeightG, base.basic.netWeightG));

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

  const defaultTacos = clamp(category.tacosRate, 0, 100);
  const defaultLaunchMultiplier = GLOBAL_DEFAULTS.launchAdsMultiplier;
  const defaultLaunchMonths = Math.max(1, Math.min(roundInt(basic.horizonMonths, 1), GLOBAL_DEFAULTS.launchBoostMonths));

  const defaultReturnRate = clamp(category.returnRate, 0, 100);
  const defaultResaleRate = clamp(category.resaleRate, 0, 100);
  const defaultUnsellableShare = clamp(category.unsellableShare, 0, 100);
  const defaultReturnHandling = GLOBAL_DEFAULTS.returnHandlingCost;

  const defaultLeakage = clamp(GLOBAL_DEFAULTS.leakageRatePct, 0, 20);
  const defaultCustomsRate = clamp(GLOBAL_DEFAULTS.importCustomsDutyRate, 0, 40);
  const defaultImportVatRate = clamp(GLOBAL_DEFAULTS.importVatRate, 0, 30);
  const defaultReferralRate = clamp(category.referralRate, 0, 25);
  const defaultTargetMargin = clamp(category.targetMarginPct, 0, 50);

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
    categoryBase: category,
  };

  const resolved = {
    vatRate: MARKETPLACE_VAT[basic.marketplace] ?? 19,

    tacosRate: resolveValue(assumptions.ads.overrideTacos, assumptions.ads.tacosRate, defaultTacos, 0, 100),
    launchAdsMultiplier: resolveValue(
      assumptions.ads.overrideLaunchMultiplier,
      assumptions.ads.launchMultiplier,
      defaultLaunchMultiplier,
      1,
      5,
    ),
    launchBoostMonths: resolveValue(
      assumptions.ads.overrideLaunchMonths,
      assumptions.ads.launchMonths,
      defaultLaunchMonths,
      1,
      Math.max(1, roundInt(basic.horizonMonths, 1)),
    ),

    returnRate: resolveValue(
      assumptions.returns.overrideReturnRate,
      assumptions.returns.returnRate,
      defaultReturnRate,
      0,
      100,
    ),
    resaleRate: resolveValue(
      assumptions.returns.overrideResaleRate,
      assumptions.returns.resaleRate,
      defaultResaleRate,
      0,
      100,
    ),
    unsellableShare: resolveValue(
      assumptions.returns.overrideUnsellableShare,
      assumptions.returns.unsellableShare,
      defaultUnsellableShare,
      0,
      100,
    ),
    returnHandlingCost: resolveValue(
      assumptions.returns.overrideHandlingCost,
      assumptions.returns.handlingCost,
      defaultReturnHandling,
      0,
      30,
    ),

    leakageRatePct: resolveValue(
      assumptions.leakage.overrideRatePct,
      assumptions.leakage.ratePct,
      defaultLeakage,
      0,
      20,
    ),

    customsDutyRate: resolveValue(
      assumptions.import.overrideCustomsDutyRate,
      assumptions.import.customsDutyRate,
      defaultCustomsRate,
      0,
      40,
    ),
    importVatRate: resolveValue(
      assumptions.import.overrideImportVatRate,
      assumptions.import.importVatRate,
      defaultImportVatRate,
      0,
      30,
    ),
    includeImportVatAsCost: Boolean(assumptions.import.includeImportVatAsCost),
    includeImportVatInCashRoi: Boolean(assumptions.import.includeImportVatInCashRoi),

    referralRate: resolveValue(
      assumptions.amazon.overrideReferralRate,
      assumptions.amazon.referralRate,
      defaultReferralRate,
      0,
      25,
    ),
    useManualFbaFee: Boolean(assumptions.amazon.useManualFbaFee),
    manualFbaFee: clamp(num(assumptions.amazon.manualFbaFee, 0), 0, 50),

    targetMarginPct: resolveValue(
      assumptions.lifecycle.overrideTargetMarginPct,
      assumptions.lifecycle.targetMarginPct,
      defaultTargetMargin,
      0,
      50,
    ),
    otherMonthlyCost: resolveValue(
      assumptions.lifecycle.overrideOtherMonthlyCost,
      assumptions.lifecycle.otherMonthlyCost,
      0,
      0,
      100000,
    ),

    categoryLabel: category.label,

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
    "ads.tacosRate": assumedText(assumptions.ads.overrideTacos, defaultTacos, resolved.tacosRate, formatPercent),
    "ads.launchMultiplier": assumedText(
      assumptions.ads.overrideLaunchMultiplier,
      defaultLaunchMultiplier,
      resolved.launchAdsMultiplier,
      formatNumber,
    ),
    "ads.launchMonths": assumedText(
      assumptions.ads.overrideLaunchMonths,
      defaultLaunchMonths,
      resolved.launchBoostMonths,
      formatNumber,
    ),

    "returns.returnRate": assumedText(
      assumptions.returns.overrideReturnRate,
      defaultReturnRate,
      resolved.returnRate,
      formatPercent,
    ),
    "returns.resaleRate": assumedText(
      assumptions.returns.overrideResaleRate,
      defaultResaleRate,
      resolved.resaleRate,
      formatPercent,
    ),
    "returns.unsellableShare": assumedText(
      assumptions.returns.overrideUnsellableShare,
      defaultUnsellableShare,
      resolved.unsellableShare,
      formatPercent,
    ),
    "returns.handlingCost": assumedText(
      assumptions.returns.overrideHandlingCost,
      defaultReturnHandling,
      resolved.returnHandlingCost,
      formatCurrency,
    ),

    "leakage.ratePct": assumedText(
      assumptions.leakage.overrideRatePct,
      defaultLeakage,
      resolved.leakageRatePct,
      formatPercent,
    ),

    "import.customsDutyRate": assumedText(
      assumptions.import.overrideCustomsDutyRate,
      defaultCustomsRate,
      resolved.customsDutyRate,
      formatPercent,
    ),
    "import.importVatRate": assumedText(
      assumptions.import.overrideImportVatRate,
      defaultImportVatRate,
      resolved.importVatRate,
      formatPercent,
    ),

    "amazon.referralRate": assumedText(
      assumptions.amazon.overrideReferralRate,
      defaultReferralRate,
      resolved.referralRate,
      formatPercent,
    ),

    "lifecycle.targetMarginPct": assumedText(
      assumptions.lifecycle.overrideTargetMarginPct,
      defaultTargetMargin,
      resolved.targetMarginPct,
      formatPercent,
    ),
    "lifecycle.otherMonthlyCost": assumedText(
      assumptions.lifecycle.overrideOtherMonthlyCost,
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
  const priceGross = Math.max(
    0,
    (scenario.priceGross ?? priceGrossBase) * (scenario.priceFactor ?? 1),
  );

  const vatFactor = 1 + resolved.vatRate / 100;
  const priceNet = vatFactor > 0 ? priceGross / vatFactor : priceGross;
  const fxUsdToEur = Math.max(0, num(state.fx.usdToEur, DEFAULT_USD_TO_EUR));

  const shipping = calculateShippingDoorToDoor(product);

  const exwUnitUsd = Math.max(0, num(basic.exwUnit));
  const exwUnit = exwUnitUsd * fxUsdToEur;
  const shippingUnit = shipping.shippingPerUnit;

  const landedBeforeDuty = exwUnit + shippingUnit;
  const customsUnit = landedBeforeDuty * (resolved.customsDutyRate / 100);
  const importVatUnit = (landedBeforeDuty + customsUnit) * (resolved.importVatRate / 100);

  const landedUnit = landedBeforeDuty + customsUnit + (resolved.includeImportVatAsCost ? importVatUnit : 0);

  const fba = estimateFbaFee(product, resolved);
  const referralFeeUnit = Math.max(priceGross * (resolved.referralRate / 100), MIN_REFERRAL_FEE);

  const launchBoostMonths = Math.min(horizonMonths, Math.max(1, roundInt(resolved.launchBoostMonths, 1)));
  const launchWeightFactor =
    (launchBoostMonths * resolved.launchAdsMultiplier + (horizonMonths - launchBoostMonths)) /
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
  const netRevenueMonthly = priceNet * monthlyUnits;

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
  const launchUnit = unitsHorizon > 0 ? launchBudget / unitsHorizon : 0;
  const launchMonthly = launchBudget / horizonMonths;

  const lifecycleMonthly = launchMonthly + resolved.otherMonthlyCost;
  const block2Monthly = lifecycleMonthly;

  const leakageMonthly = netRevenueMonthly * (resolved.leakageRatePct / 100);
  const block3Monthly = leakageMonthly;

  const grossProfitMonthly = db1Unit * monthlyUnits;
  const profitMonthly = grossProfitMonthly - block2Monthly - block3Monthly;
  const profitHorizon = profitMonthly * horizonMonths;
  const netMarginPct = netRevenueMonthly > 0 ? (profitMonthly / netRevenueMonthly) * 100 : 0;

  const investedCapital = landedUnit * unitsHorizon + launchBudget;
  const productRoiPct = investedCapital > 0 ? (profitHorizon / investedCapital) * 100 : 0;

  const importVatPrefinance = resolved.includeImportVatInCashRoi ? importVatUnit * unitsHorizon : 0;
  const cashCapital = investedCapital + importVatPrefinance;
  const cashRoiPct = cashCapital > 0 ? (profitHorizon / cashCapital) * 100 : 0;

  const paybackBase = launchBudget + landedUnit * monthlyUnits;
  const paybackMonths = profitMonthly > 0 ? paybackBase / profitMonthly : null;

  const result = {
    productId: product.id,
    name: product.name,
    basic,
    resolved,
    monthlyUnits,
    horizonMonths,
    unitsHorizon,
    priceGross,
    priceNet,
    fxUsdToEur,
    vatRate: resolved.vatRate,

    shipping,
    shippingUnit,
    shippingMonthly,

    exwUnitUsd,
    exwUnit,
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
    otherLifecycleMonthly: resolved.otherMonthlyCost,
    block2Monthly,

    leakageRatePct: resolved.leakageRatePct,
    block3Monthly,
    totalCostMonthly: block1Monthly + block2Monthly + block3Monthly,

    db1Unit,
    db1MarginPct,
    grossRevenueMonthly,
    netRevenueMonthly,
    grossProfitMonthly,
    profitMonthly,
    netMarginPct,
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
  if (baseMetrics.profitMonthly <= 0 || baseMetrics.db1Unit <= 0) {
    return {
      color: "red",
      label: "Rot",
      text: "Unprofitabel im Basisszenario",
    };
  }

  if (worstMetrics.profitMonthly <= 0) {
    return {
      color: "yellow",
      label: "Gelb",
      text: "Basisszenario profitabel, Worst Case kritisch",
    };
  }

  if (baseMetrics.netMarginPct >= targetMarginPct) {
    return {
      color: "green",
      label: "Grün",
      text: "Robust über Zielmarge",
    };
  }

  return {
    color: "yellow",
    label: "Gelb",
    text: "Profitabel, aber unter Zielmarge",
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
      override: assumptions.ads.overrideTacos,
      activeValue: resolved.tacosRate,
      formatType: "percent",
      source: `Kategorie-Default (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultTacos)}.`,
      impactMonthly: metrics.adsMonthly,
      costNote: "Direkter Treiber der Ads-Kosten im Unit-Economics-Block.",
    }),
    "ads.launchMultiplier": makeEntry("ads.launchMultiplier", {
      override: assumptions.ads.overrideLaunchMultiplier,
      activeValue: resolved.launchAdsMultiplier,
      formatType: "number",
      source: `Globaler Launch-Boost = ${formatNumber(defaults.defaultLaunchMultiplier)}.`,
      impactMonthly: metrics.launchAdsIncrementMonthly,
      costNote: "Verändert nur den zusätzlichen Ads-Druck in Launch-Monaten.",
    }),
    "ads.launchMonths": makeEntry("ads.launchMonths", {
      override: assumptions.ads.overrideLaunchMonths,
      activeValue: resolved.launchBoostMonths,
      formatType: "number",
      source: `Default = min(Zeitraum, ${formatNumber(GLOBAL_DEFAULTS.launchBoostMonths)} Monate).`,
      impactMonthly: metrics.launchAdsIncrementMonthly,
      costNote: "Bestimmt die Dauer des erhöhten TACoS-Fensters.",
    }),
    "returns.returnRate": makeEntry("returns.returnRate", {
      override: assumptions.returns.overrideReturnRate,
      activeValue: resolved.returnRate,
      formatType: "percent",
      source: `Kategorie-Default (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultReturnRate)}.`,
      impactMonthly: metrics.returnsMonthly,
      costNote: "Treiber für Retourenverluste und Handlingkosten.",
    }),
    "returns.resaleRate": makeEntry("returns.resaleRate", {
      override: assumptions.returns.overrideResaleRate,
      activeValue: resolved.resaleRate,
      formatType: "percent",
      source: `Kategorie-Default (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultResaleRate)}.`,
      impactMonthly: metrics.returnsMonthly,
      costNote: "Je höher, desto geringer der Verlust aus rückführbarer Ware.",
    }),
    "returns.unsellableShare": makeEntry("returns.unsellableShare", {
      override: assumptions.returns.overrideUnsellableShare,
      activeValue: resolved.unsellableShare,
      formatType: "percent",
      source: `Kategorie-Default (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultUnsellableShare)}.`,
      impactMonthly: metrics.returnsMonthly,
      costNote: "Erhöht direkt den Anteil der Retouren mit vollem Landed-Loss.",
    }),
    "returns.handlingCost": makeEntry("returns.handlingCost", {
      override: assumptions.returns.overrideHandlingCost,
      activeValue: resolved.returnHandlingCost,
      formatType: "currency",
      source: `Globaler Default für Retourenhandling = ${formatCurrency(defaults.defaultReturnHandling)} pro Retoure.`,
      impactMonthly: metrics.monthlyUnits * (resolved.returnRate / 100) * resolved.returnHandlingCost,
      costNote: "Fixer Kostensatz je Retoure zusätzlich zum Warenwertverlust.",
    }),
    "leakage.ratePct": makeEntry("leakage.ratePct", {
      override: assumptions.leakage.overrideRatePct,
      activeValue: resolved.leakageRatePct,
      formatType: "percent",
      source: `Globales Leakage = ${formatPercent(defaults.defaultLeakage)}.`,
      impactMonthly: metrics.block3Monthly,
      costNote: "Sicherheitsblock für nicht explizit modellierte Kosten.",
    }),
    "import.customsDutyRate": makeEntry("import.customsDutyRate", {
      override: assumptions.import.overrideCustomsDutyRate,
      activeValue: resolved.customsDutyRate,
      formatType: "percent",
      source: `Default China→DE = ${formatPercent(defaults.defaultCustomsRate)}.`,
      impactMonthly: metrics.customsMonthly,
      costNote: "Zoll fällt auf importierten Warenwert inkl. Shippinganteil an.",
    }),
    "import.importVatRate": makeEntry("import.importVatRate", {
      override: assumptions.import.overrideImportVatRate,
      activeValue: resolved.importVatRate,
      formatType: "percent",
      source: `Default EUSt = ${formatPercent(defaults.defaultImportVatRate)}.`,
      impactMonthly: metrics.importVatCostMonthly,
      costNote: resolved.includeImportVatAsCost
        ? "Aktiv als Kostenbestandteil in der Kalkulation."
        : "Nur für Cash-Bindung relevant, nicht als Kostenblock im P&L.",
    }),
    "amazon.referralRate": makeEntry("amazon.referralRate", {
      override: assumptions.amazon.overrideReferralRate,
      activeValue: resolved.referralRate,
      formatType: "percent",
      source: `Kategorie-Default Referral Fee (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultReferralRate)}.`,
      impactMonthly: metrics.referralMonthly,
      costNote: "Prozentual auf Brutto-Verkaufspreis mit Mindestgebühr.",
    }),
    "lifecycle.targetMarginPct": makeEntry("lifecycle.targetMarginPct", {
      override: assumptions.lifecycle.overrideTargetMarginPct,
      activeValue: resolved.targetMarginPct,
      formatType: "percent",
      source: `Kategorie-Zielmarge (${resolved.categoryLabel}) = ${formatPercent(defaults.defaultTargetMargin)}.`,
      impactMonthly: 0,
      costNote: "Beeinflusst keine Kosten direkt, sondern den KPI 'Max TACoS'.",
    }),
    "lifecycle.otherMonthlyCost": makeEntry("lifecycle.otherMonthlyCost", {
      override: assumptions.lifecycle.overrideOtherMonthlyCost,
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

    if (line.explain) {
      li.title = `${line.explain}\nImpact: ${impact.label} (${formatPercent(impact.sharePct)} der Gesamtkosten).`;
      label.title = li.title;
      value.title = li.title;
    }

    if (line.targetSection || driverPaths.length > 0) {
      if (line.targetSection) {
        li.dataset.targetSection = line.targetSection;
      }
      li.classList.add("clickable-row");
      li.title = line.explain
        ? `${line.explain}\nKlick: Treiber-Inputs hervorheben und in Advanced zum Override springen.`
        : "Klick: Treiber-Inputs hervorheben und in Advanced zum Override springen.";
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

function renderSelectedOutputs(metrics) {
  setKpi(dom.kpiRevenueGross, metrics.grossRevenueMonthly, "currency");
  setKpi(dom.kpiRevenueNet, metrics.netRevenueMonthly, "currency");
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

  renderShippingDetails(metrics);

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
        label: "Shipping door-to-door / Einheit (EUR)",
        value: formatCurrency(metrics.shippingUnit),
        targetSection: "advancedShippingSection",
        explain: "12M-Ø Door-to-Door-Modell: fixe Kosten + LCL variabel über chargeable CBM.",
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
        label: "Zoll / Einheit (EUR)",
        value: formatCurrency(metrics.customsUnit),
        targetSection: "advancedImportSection",
        explain: "Zoll auf EXW + Shipping bis Import.",
        impactMonthly: metrics.customsMonthly,
        driverPaths: ["assumptions.import.customsDutyRate", "basic.exwUnit", "basic.unitsPerOrder"],
      },
      {
        label: "Landed / Einheit (EUR)",
        value: formatCurrency(metrics.landedUnit),
        targetSection: "advancedShippingSection",
        explain: "Landed = EXW(EUR) + Shipping + Zoll (+ optional EUSt als Kosten).",
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
        impactMonthly: metrics.referralMonthly,
        driverPaths: ["assumptions.amazon.referralRate", "basic.category", "basic.priceGross"],
      },
      {
        label: `FBA Fee / Einheit (EUR, ${metrics.fbaTier})`,
        value: formatCurrency(metrics.fbaFeeUnit),
        targetSection: "advancedImportSection",
        explain: "Automatische FBA-Tier-Erkennung (oder manueller Override).",
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
        explain: "Ads-Kosten = Netto-Preis × effektiver TACoS inkl. Launch-Bias.",
        impactMonthly: metrics.adsMonthly,
        driverPaths: [
          "assumptions.ads.tacosRate",
          "assumptions.ads.launchMultiplier",
          "assumptions.ads.launchMonths",
          "basic.category",
        ],
      },
      {
        label: "Retourenverlust + Handling / Einheit (EUR)",
        value: formatCurrency(metrics.returnLossUnit + metrics.returnHandlingUnit),
        targetSection: "advancedReturnsSection",
        explain: "Retourenquote, Unsellable-Anteil, Wiederverkaufsquote und Handling kombiniert.",
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
        label: "Launch-Budget gesamt (EUR)",
        value: formatCurrency(metrics.launchBudget),
        targetSection: "advancedLifecycleSection",
        explain: "Einmaliges Budget, über Zeitraum amortisiert.",
        impactMonthly: metrics.launchMonthly,
        driverPaths: ["basic.launchBudgetTotal", "assumptions.launchSplit.enabled"],
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
        explain: "Summe Launch-Amortisation und Lifecycle-Monatskosten.",
        impactMonthly: metrics.block2Monthly,
        driverPaths: ["basic.launchBudgetTotal", "assumptions.lifecycle.otherMonthlyCost"],
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
        impactMonthly: metrics.block3Monthly,
        driverPaths: ["assumptions.leakage.ratePct", "basic.priceGross", "basic.demandValue", "basic.demandBasis"],
      },
      {
        label: "Netto-Umsatz / Monat (EUR)",
        value: formatCurrency(metrics.netRevenueMonthly),
        explain: "Basis für Leakage-Berechnung und Netto-Margen.",
        impactMonthly: metrics.block3Monthly,
        driverPaths: ["basic.priceGross", "basic.marketplace", "basic.demandValue", "basic.demandBasis"],
      },
      {
        label: "Gewinn netto / Monat nach 3 Blöcken (EUR)",
        value: formatCurrency(metrics.profitMonthly),
        explain: "Ergebnis nach Unit Economics, Launch/Lifecycle und Leakage.",
        impactMonthly: Math.max(0, metrics.profitMonthly),
        driverPaths: ["basic.priceGross", "basic.exwUnit", "assumptions.ads.tacosRate", "assumptions.leakage.ratePct"],
      },
    ],
    { totalCostMonthly: metrics.totalCostMonthly },
  );

  setKpi(dom.sensPriceDown, metrics.sensitivity.priceDown.profitMonthly, "currency");
  setKpi(dom.sensTacosUp, metrics.sensitivity.tacosUp.profitMonthly, "currency");
  setKpi(dom.sensUnitsDown, metrics.sensitivity.unitsDown.profitMonthly, "currency");
  setKpi(dom.sensWorst, metrics.sensitivity.worst.profitMonthly, "currency");
  setKpi(dom.sensBest, metrics.sensitivity.best.profitMonthly, "currency");

  dom.trafficLight.className = `traffic-badge traffic-${metrics.sensitivity.traffic.color}`;
  dom.trafficLight.textContent = `Ampel: ${metrics.sensitivity.traffic.label} · ${metrics.sensitivity.traffic.text}`;
  dom.trafficLight.title =
    "Ampel-Logik: Rot = Basisszenario unprofitabel, Gelb = Basis profitabel aber Worst-Case kritisch, Grün = robust über Zielmarge.";

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

  if (!splitEnabled) {
    dom.launchSplitHint.textContent = `Aktiv: Pflichtfeld Launch-Budget (${formatCurrency(baseLaunch)}).`;
    return;
  }

  if (splitTotal <= 0) {
    dom.launchSplitHint.textContent =
      "Launch-Split aktiviert, aber Summe = 0. Es wird auf Launch-Budget gesamt zurückgefallen.";
    return;
  }

  dom.launchSplitHint.textContent = `Launch-Split aktiv: ${formatCurrency(splitTotal)} (ersetzt Pflichtfeld-Wert).`;
}

function syncControlStates(product) {
  dom.advancedPanel.classList.toggle("hidden", !state.ui.advancedVisible);
  dom.advancedToggle.checked = state.ui.advancedVisible;

  OVERRIDE_CONTROL_MAP.forEach(([flagPath, valuePath]) => {
    const flag = Boolean(getByPath(product, flagPath));
    const input = document.querySelector(`[data-path="${valuePath}"]`);
    if (input) {
      input.disabled = !flag;
    }
  });

  const manualFbaFeeInput = document.querySelector('[data-path="assumptions.amazon.manualFbaFee"]');
  if (manualFbaFeeInput) {
    manualFbaFeeInput.disabled = !Boolean(getByPath(product, "assumptions.amazon.useManualFbaFee"));
  }

  const launchSplitEnabled = Boolean(getByPath(product, "assumptions.launchSplit.enabled"));
  const launchSplitFields = dom.launchSplitBox.querySelectorAll("input[data-path]");
  launchSplitFields.forEach((field) => {
    field.disabled = !launchSplitEnabled;
  });

  const customsBrokerField = document.querySelector('[data-settings-path="shipping12m.customsBrokerFixedEurPerShipment"]');
  if (customsBrokerField) {
    customsBrokerField.disabled = !state.settings.shipping12m.customsBrokerEnabled;
  }

  renderSettingsInputs();
}

function openAdvancedSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }

  state.ui.advancedVisible = true;
  dom.advancedPanel.classList.remove("hidden");
  dom.advancedToggle.checked = true;

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
  if (path.startsWith("settings.")) {
    return "advancedAdminSection";
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
  const firstAssumptionPath = paths.find((path) => path.startsWith("assumptions.") || path.startsWith("settings."));
  const inferredSection = targetSection || inferAdvancedSectionFromPath(firstAssumptionPath || paths[0]);
  const requiresAdvanced = Boolean(inferredSection) || paths.some((path) => path.startsWith("assumptions.") || path.startsWith("settings."));

  if (requiresAdvanced && inferredSection) {
    openAdvancedSection(inferredSection);
  }

  applyDriverFocus(paths, lineLabel);

  const preferredPaths = requiresAdvanced && firstAssumptionPath ? [firstAssumptionPath, ...paths] : paths;
  const firstMatch = preferredPaths.map((path) => getDriverControl(path)).find((node) => node instanceof HTMLElement);

  if (firstMatch instanceof HTMLElement) {
    firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function openAdvancedByBlock(blockKey) {
  const targets = {
    unit: "advancedShippingSection",
    launch: "advancedLifecycleSection",
    leakage: "advancedLeakageSection",
  };

  const blockDrivers = {
    unit: [
      "basic.exwUnit",
      "basic.unitsPerOrder",
      "assumptions.ads.tacosRate",
      "settings.shipping12m.lclRateEurPerCbm",
      "assumptions.amazon.referralRate",
    ],
    launch: ["basic.launchBudgetTotal", "assumptions.lifecycle.otherMonthlyCost"],
    leakage: ["assumptions.leakage.ratePct", "basic.priceGross", "basic.demandValue"],
  };

  const target = targets[blockKey];
  if (!target || !blockDrivers[blockKey]) {
    return;
  }

  focusMetricDrivers(blockDrivers[blockKey], target, `Block ${blockKey}`);
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
    const fragment = dom.productItemTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".product-btn");
    const name = fragment.querySelector(".name");
    const meta = fragment.querySelector(".meta");
    const pill = fragment.querySelector(".pill");

    name.textContent = product.name || "Unbenannt";
    meta.textContent = `${formatCurrency(product.basic.priceGross)} brutto · ${formatCurrency(metrics.shippingUnit)} Shipping · ${formatCurrency(metrics.profitMonthly)} netto`;

    pill.textContent = metrics.sensitivity.traffic.label;
    pill.classList.remove("yellow", "red");
    if (metrics.sensitivity.traffic.color === "yellow") {
      pill.classList.add("yellow");
    }
    if (metrics.sensitivity.traffic.color === "red") {
      pill.classList.add("red");
    }

    if (product.id === state.selectedId) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      state.selectedId = product.id;
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

  renderFxStatus();

  const metrics = metricsById.get(product.id) ?? calculateProduct(product);
  const resolved = metrics.resolved;
  const diagnostics = buildDefaultDiagnostics(product, metrics);

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

  renderInputs(selected);
  renderSettingsInputs();
  renderComputedViews();
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
  if (dom.advancedToggle) {
    dom.advancedToggle.title = "Advanced blendet Defaults, Overwrites, Shipping-Details und Admin-Settings ein.";
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
    const helpText = FIELD_HELP[path];
    if (!helpText) {
      return;
    }
    input.title = helpText;
    const label = input.closest("label");
    if (label) {
      label.title = helpText;
    }
  });

  const settingInputs = document.querySelectorAll("[data-settings-path]");
  settingInputs.forEach((input) => {
    const path = input.dataset.settingsPath;
    const helpText = SETTINGS_HELP[path];
    if (!helpText) {
      return;
    }
    input.title = helpText;
    const label = input.closest("label");
    if (label) {
      label.title = helpText;
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

function normalizeDriverPath(path) {
  if (path.startsWith("settings.")) {
    return path;
  }
  return path;
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
      renderComputedViews();
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

  dom.advancedToggle.addEventListener("change", () => {
    state.ui.advancedVisible = dom.advancedToggle.checked;
    renderAll();
  });

  dom.compareSort.addEventListener("change", () => {
    state.ui.compareSort = dom.compareSort.value;
    renderComputedViews();
  });

  dom.compareFilter.addEventListener("change", () => {
    state.ui.compareFilter = dom.compareFilter.value;
    renderComputedViews();
  });

  dom.refreshFxBtn.addEventListener("click", () => {
    refreshFxRate();
  });

  document.querySelectorAll(".block-grid details").forEach((detail) => {
    detail.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (!target.closest("summary")) {
        return;
      }
      const blockKey = detail.dataset.block;
      if (!blockKey) {
        return;
      }
      openAdvancedByBlock(blockKey);
    });
  });

  [dom.unitBlockList, dom.launchBlockList, dom.leakageBlockList].forEach((list) => {
    list.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const row = target.closest("li.clickable-row");
      if (!(row instanceof HTMLElement)) {
        return;
      }

      const sectionId = row.dataset.targetSection || null;
      const labelText = row.dataset.lineLabel ?? "";
      let driverPaths = [];
      try {
        driverPaths = JSON.parse(row.dataset.driverPaths ?? "[]");
      } catch (_error) {
        driverPaths = [];
      }

      focusMetricDrivers(driverPaths.map(normalizeDriverPath), sectionId, labelText);
    });
  });

  dom.addProductBtn.addEventListener("click", addProduct);
  dom.duplicateProductBtn.addEventListener("click", duplicateProduct);
  dom.deleteProductBtn.addEventListener("click", deleteProduct);

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
    renderAll();
  });
}

function init() {
  loadSettings();
  loadProducts();
  renderCategoryDefaultsAdmin();
  bindEvents();
  renderFxStatus();
  renderAll();
  refreshFxRate();
}

init();
