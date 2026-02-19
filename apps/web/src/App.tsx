import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronRight,
  Circle,
  Copy,
  Layers,
  Menu,
  Plus,
  Trash2,
} from "lucide-react";
import { useKernelBridge } from "@/hooks/useKernelBridge";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BridgeSnapshot, GoNoGoColor } from "@/lib/bridge";
import { cn } from "@/lib/utils";

type FieldType = "text" | "number" | "select";

interface FieldDef {
  path: string;
  label: string;
  type: FieldType;
  step?: string;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
}

const PRIMARY_FIELDS: Record<string, FieldDef[]> = {
  market: [
    { path: "name", label: "Produktname", type: "text" },
    { path: "basic.priceGross", label: "Verkaufspreis (brutto EUR)", type: "number", step: "0.01", min: 0 },
    {
      path: "basic.category",
      label: "Kategorie",
      type: "select",
      options: [
        { value: "home", label: "Home & Küche" },
        { value: "beauty", label: "Beauty" },
        { value: "electronics", label: "Elektronik" },
        { value: "apparel", label: "Bekleidung" },
        { value: "pet", label: "Haustier" },
        { value: "generic", label: "Sonstiges" },
      ],
    },
    { path: "basic.demandValue", label: "Absatzannahme", type: "number", step: "1", min: 0 },
    {
      path: "basic.demandBasis",
      label: "Absatz-Basis",
      type: "select",
      options: [
        { value: "month", label: "Einheiten / Monat" },
        { value: "day", label: "Einheiten / Tag" },
      ],
    },
    { path: "assumptions.ads.tacosRate", label: "TACoS Target (%)", type: "number", step: "0.1", min: 0, max: 100 },
    { path: "assumptions.returns.returnRate", label: "Retourenquote (%)", type: "number", step: "0.1", min: 0, max: 100 },
  ],
  shipping: [
    { path: "basic.netWeightG", label: "Produktgewicht netto (g)", type: "number", step: "1", min: 0 },
    { path: "basic.packLengthCm", label: "Verpackung Länge (cm)", type: "number", step: "0.1", min: 0 },
    { path: "basic.packWidthCm", label: "Verpackung Breite (cm)", type: "number", step: "0.1", min: 0 },
    { path: "basic.packHeightCm", label: "Verpackung Höhe (cm)", type: "number", step: "0.1", min: 0 },
    { path: "basic.unitsPerOrder", label: "Units pro Order", type: "number", step: "1", min: 1 },
    {
      path: "basic.transportMode",
      label: "Transportmodus",
      type: "select",
      options: [
        { value: "rail", label: "Rail" },
        { value: "sea_lcl", label: "Sea LCL" },
      ],
    },
  ],
  purchase: [
    { path: "basic.exwUnit", label: "EXW / Einheit (USD)", type: "number", step: "0.01", min: 0 },
    {
      path: "basic.marketplace",
      label: "Marketplace",
      type: "select",
      options: [
        { value: "DE", label: "Amazon.de" },
        { value: "FR", label: "Amazon.fr" },
        { value: "IT", label: "Amazon.it" },
        { value: "ES", label: "Amazon.es" },
      ],
    },
    {
      path: "basic.fulfillmentModel",
      label: "Fulfillment",
      type: "select",
      options: [{ value: "fba", label: "FBA" }],
    },
    {
      path: "basic.listingPackage",
      label: "Listing-Service",
      type: "select",
      options: [
        { value: "ai", label: "KI" },
        { value: "photographer", label: "Fotograf" },
        { value: "visual_advantage", label: "Visual Advantage" },
      ],
    },
    {
      path: "basic.launchCompetition",
      label: "Nischenwettbewerb",
      type: "select",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
    },
  ],
};

const QUICK_ORDER = ["product", "shipping_import", "threepl", "amazon", "ads_returns", "launch_lifecycle", "overhead"];

function goNoGoVariant(color: GoNoGoColor | string) {
  if (color === "green") {
    return "go" as const;
  }
  if (color === "orange") {
    return "watch" as const;
  }
  if (color === "red") {
    return "no_go" as const;
  }
  return "neutral" as const;
}

function kpiClass(color: GoNoGoColor | string) {
  if (color === "green") {
    return "kpi-go";
  }
  if (color === "orange") {
    return "kpi-watch";
  }
  if (color === "red") {
    return "kpi-no-go";
  }
  return "kpi-neutral";
}

function getByPath(data: Record<string, unknown>, path: string): unknown {
  if (!path) {
    return undefined;
  }
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, data);
}

function flattenEditablePaths(source: Record<string, unknown>, prefix = "", out: string[] = []) {
  Object.entries(source).forEach(([key, value]) => {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    if (["id"].includes(nextPath)) {
      return;
    }
    if (Array.isArray(value)) {
      return;
    }
    if (value && typeof value === "object") {
      flattenEditablePaths(value as Record<string, unknown>, nextPath, out);
      return;
    }
    if (["string", "number", "boolean"].includes(typeof value)) {
      out.push(nextPath);
    }
  });
  return out;
}

function Sidebar({ snapshot, onSelect, onAdd, onDuplicate, onDelete }: {
  snapshot: BridgeSnapshot;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <aside className="card-shell flex h-full flex-col gap-3 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-600">Produkte</h2>
        <Button size="sm" className="h-7 bg-orange-500 px-3 text-xs hover:bg-orange-600" onClick={onAdd}>
          <Plus className="mr-1 h-3 w-3" /> Neu
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-auto">
        {snapshot.products.map((product) => {
          const active = product.id === snapshot.selectedId;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              className={cn(
                "w-full rounded-lg border border-border bg-white p-2.5 text-left transition",
                active && "border-orange-200 bg-orange-50/60 shadow-sm",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <Circle className={cn("h-2.5 w-2.5 fill-current", product.goNoGoStatus === "green" ? "text-emerald-500" : product.goNoGoStatus === "orange" ? "text-amber-500" : "text-rose-500")} />
                <span className="text-xs font-semibold text-slate-800">{product.name || "Unbenannt"}</span>
              </div>
              <p className="text-[11px] text-slate-500">{formatCurrency(product.headlineMetrics.priceGross)} brutto</p>
              <p className="text-[11px] text-slate-500">{formatPercent(product.headlineMetrics.netMarginPct)} Netto-Marge</p>
              <p className="text-[11px] text-slate-500">{formatPercent(product.headlineMetrics.sellerboardMarginPct)} Sellerboard</p>
              <Badge className="mt-2 w-fit" variant="neutral">{product.stage === "validation" ? "Validation" : "QuickCheck"}</Badge>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 border-t border-border pt-2">
        <Button variant="outline" size="sm" className="w-full justify-center text-xs" onClick={onDuplicate}>
          <Copy className="mr-1 h-3.5 w-3.5" /> Duplizieren
        </Button>
        <Button variant="danger" size="sm" className="w-full justify-center text-xs" onClick={onDelete}>
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Löschen
        </Button>
      </div>
    </aside>
  );
}

function renderField(def: FieldDef, selectedProduct: Record<string, unknown>, updateField: (path: string, value: unknown) => void) {
  const value = getByPath(selectedProduct, def.path);
  return (
    <label key={def.path} className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{def.label}</span>
      {def.type === "select" && def.options ? (
        <Select value={String(value ?? "")} onValueChange={(next) => updateField(def.path, next)}>
          <SelectTrigger>
            <SelectValue placeholder="Wählen" />
          </SelectTrigger>
          <SelectContent>
            {def.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={def.type}
          value={value === undefined || value === null ? "" : String(value)}
          min={def.min}
          max={def.max}
          step={def.step}
          onChange={(event) => {
            if (def.type === "number") {
              updateField(def.path, event.target.value);
              return;
            }
            updateField(def.path, event.target.value);
          }}
        />
      )}
    </label>
  );
}

function App() {
  const { loading, error, bridge, snapshot } = useKernelBridge();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const selectedProduct = (snapshot?.selectedProduct ?? null) as Record<string, unknown> | null;
  const metrics = snapshot?.metrics;
  const visual = metrics?.visualCockpit as Record<string, unknown> | null;
  const quickBlocks = useMemo(() => {
    const blocks = [...(metrics?.quickBlocks ?? [])];
    blocks.sort((a, b) => {
      const ia = QUICK_ORDER.indexOf(a.key);
      const ib = QUICK_ORDER.indexOf(b.key);
      if (ia === -1 || ib === -1) {
        return a.title.localeCompare(b.title, "de-DE");
      }
      return ia - ib;
    });
    return blocks;
  }, [metrics?.quickBlocks]);

  const knownPaths = useMemo(() => new Set(Object.values(PRIMARY_FIELDS).flat().map((item) => item.path)), []);
  const advancedPaths = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }
    return flattenEditablePaths(selectedProduct)
      .filter((path) => !knownPaths.has(path))
      .filter((path) => !path.startsWith("workflow.reviewStatus"))
      .sort((a, b) => a.localeCompare(b, "de-DE"));
  }, [knownPaths, selectedProduct]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">Kernel wird geladen ...</div>;
  }

  if (error || !bridge || !snapshot || !selectedProduct || !metrics) {
    return <div className="m-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error ?? "Kein Snapshot verfügbar."}</div>;
  }

  const decisionColor = metrics.decision.color;
  const waterfall = (visual?.waterfall as { blocks?: Array<{ key: string; label: string; value: number }>; startValue?: number; endValue?: number }) ?? {};
  const riskRows = (visual?.risk as { rows?: Array<{ key: string; label: string; value: number; minValue: number; targetValue: number }> })?.rows ?? [];
  const sensitivity = (visual?.sensitivity as { worst?: number; base?: number; best?: number; stresses?: Array<{ label: string; value: number }> }) ?? {};

  return (
    <div className="mx-auto grid h-full max-w-[1600px] grid-cols-1 gap-3 p-3 lg:grid-cols-[250px_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <Sidebar
          snapshot={snapshot}
          onAdd={() => bridge.actions.addProduct()}
          onSelect={(id) => bridge.actions.selectProduct(id)}
          onDuplicate={() => bridge.actions.duplicateProduct(snapshot.selectedId ?? undefined)}
          onDelete={() => bridge.actions.deleteProduct(snapshot.selectedId ?? undefined)}
        />
      </div>

      <main className="grid min-h-0 gap-3">
        <Card className="px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Amazon FBA 80/20 Modell</p>
              <h1 className="text-[34px] font-bold leading-none tracking-tight text-slate-800">Produkt: {String(selectedProduct.name || "Unbenannt")}</h1>
              <p className="text-xs text-slate-500">Launch-Entscheider pro Produkt: schnelle Go/Watch/No-Go Bewertung mit Progressive Disclosure.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileSidebarOpen(true)}>
                <Menu className="mr-1 h-3.5 w-3.5" /> Portfolio
              </Button>
              <div className="rounded-md border border-border bg-white px-3 py-1.5 text-xs text-slate-500">
                Stand: {formatDate(snapshot.fxStatus.date)} | Quelle: {snapshot.fxStatus.source}
              </div>
              <Button variant="outline" size="sm">Kurs aktualisieren</Button>
              <a href="/settings.html" className="inline-flex h-8 items-center rounded-md border border-border bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">Zu Settings</a>
              <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border bg-white text-center">
                <div className="px-3 py-1">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Produkte</div>
                  <div className="text-lg font-semibold text-slate-800">{snapshot.settingsMeta.productCount}</div>
                </div>
                <div className="border-l border-border px-3 py-1">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Speicher</div>
                  <div className="text-lg font-semibold text-slate-800">{snapshot.settingsMeta.storageMode === "shared" ? "gemeinsam" : "lokal"}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <section className="sticky top-2 z-20 card-shell border-2 border-blue-200 p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-3">
            <div className="flex items-start gap-2">
              <div className="rounded-md border border-blue-100 bg-blue-50 p-2 text-blue-600"><BarChart3 className="h-4 w-4" /></div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Decision-Bar</h2>
                <p className="text-xs text-slate-500">Wichtigste KPIs für die Go/No-Go Entscheidung.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => bridge.actions.toggleDecisionDetails()}>
                {snapshot.uiState.quickShowAllKpis ? "Details ausblenden" : "Details einblenden"}
              </Button>
              <Badge variant={goNoGoVariant(decisionColor)} className="px-4 py-1 text-sm">STATUS: {metrics.decision.label}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
            <Card className={cn("left-kpi-accent p-3", kpiClass(metrics.decision.kpiStatus.netMarginAfterPpc))}>
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                <span>Netto-Marge nach PPC</span>
                <Badge variant={goNoGoVariant(metrics.decision.kpiStatus.netMarginAfterPpc)}>Watch</Badge>
              </div>
              <div className="text-5xl font-bold tracking-tight text-slate-900">{metrics.kpis.netMarginAfterPpc.toFixed(1)}<span className="ml-1 text-2xl font-medium text-slate-400">%</span></div>
              <p className="mt-2 text-xs text-slate-500">Kosten / Stk: {formatCurrency(metrics.kpis.totalCostPerUnit)}</p>
            </Card>

            <Card className={cn("left-kpi-accent p-3", kpiClass(metrics.decision.kpiStatus.marginBeforePpc))}>
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                <span>Marge vor PPC</span>
                <Badge variant={goNoGoVariant(metrics.decision.kpiStatus.marginBeforePpc)}>Go</Badge>
              </div>
              <div className="text-5xl font-bold tracking-tight text-slate-900">{metrics.kpis.marginBeforePpc.toFixed(1)}<span className="ml-1 text-2xl font-medium text-slate-400">%</span></div>
              <p className="mt-2 text-xs text-slate-500">Gewinn / Stk: {formatCurrency(metrics.kpis.profitPerUnit)}</p>
            </Card>

            <Card className={cn("left-kpi-accent p-3", kpiClass(metrics.decision.kpiStatus.roi))}>
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                <span>ROI (Unit-basiert)</span>
                <Badge variant={goNoGoVariant(metrics.decision.kpiStatus.roi)}>No-Go</Badge>
              </div>
              <div className="text-5xl font-bold tracking-tight text-slate-900">{metrics.kpis.roiUnit.toFixed(1)}<span className="ml-1 text-2xl font-medium text-slate-400">%</span></div>
              <p className="mt-2 text-xs text-slate-500">Umsatz / Mo: {formatCurrency(metrics.kpis.grossRevenueMonthly)}</p>
            </Card>

            <Card className="left-kpi-accent kpi-neutral p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                <span>Sellerboard-Marge</span>
                <Badge variant="neutral">Neutral</Badge>
              </div>
              <div className="text-5xl font-bold tracking-tight text-slate-900">{metrics.kpis.sellerboardMargin.toFixed(1)}<span className="ml-1 text-2xl font-medium text-slate-400">%</span></div>
              <p className="mt-2 text-xs text-slate-500">Gewinn netto / Mo: {formatCurrency(metrics.kpis.profitMonthly)}</p>
            </Card>
          </div>

          {snapshot.uiState.quickShowAllKpis && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-dashed border-slate-200 pt-3 xl:grid-cols-5">
              <Card className="p-2"><p className="text-[11px] text-slate-500">Shipping / Unit</p><p className="text-sm font-semibold">{formatCurrency(metrics.kpis.shippingUnit)}</p></Card>
              <Card className="p-2"><p className="text-[11px] text-slate-500">Landed / Unit</p><p className="text-sm font-semibold">{formatCurrency(metrics.kpis.landedUnit)}</p></Card>
              <Card className="p-2"><p className="text-[11px] text-slate-500">Gewinn netto / Monat</p><p className="text-sm font-semibold">{formatCurrency(metrics.kpis.profitMonthly)}</p></Card>
              <Card className="p-2"><p className="text-[11px] text-slate-500">Break-even</p><p className="text-sm font-semibold">{metrics.kpis.breakEvenPrice == null ? "n/a" : formatCurrency(metrics.kpis.breakEvenPrice)}</p></Card>
              <Card className="p-2"><p className="text-[11px] text-slate-500">Max TACoS</p><p className="text-sm font-semibold">{formatPercent(metrics.kpis.maxTacosRateForTarget)}</p></Card>
            </div>
          )}
        </section>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Visual Cockpit</CardTitle>
              <CardDescription>Detaillierte Analyse der Kostentreiber.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => bridge.actions.toggleVisualCockpit()}>
              {snapshot.uiState.cockpitVisualCollapsed ? "Ausklappen" : "Einklappen"}
            </Button>
          </CardHeader>
          <CardContent>
            {!snapshot.uiState.cockpitVisualCollapsed && (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <Card className="p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Unit-Economics-Waterfall</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1 text-sm"><span>Netto-Preis</span><span className="font-semibold text-blue-600">+{formatCurrency(Number(waterfall.startValue ?? 0))}</span></div>
                    {(waterfall.blocks ?? []).map((block) => (
                      <div key={block.key} className="flex items-center justify-between text-sm"><span className="text-slate-600">{block.label}</span><span className="font-medium text-rose-500">-{formatCurrency(block.value)}</span></div>
                    ))}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm"><span className="font-semibold">Gewinn pro Unit</span><span className="font-semibold text-emerald-600">+{formatCurrency(Number(waterfall.endValue ?? 0))}</span></div>
                  </div>
                </Card>

                <Card className="p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ampel-Risiko-Matrix</div>
                  <div className="space-y-3">
                    {riskRows.map((row) => {
                      const max = Math.max(row.targetValue * 1.4, row.minValue * 1.8, row.value * 1.1, 1);
                      const marker = Math.max(0, Math.min(100, (row.value / max) * 100));
                      return (
                        <div key={row.key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-600"><span>{row.label}</span><strong>{formatPercent(row.value)}</strong></div>
                          <div className="relative h-2 rounded-full bg-slate-200">
                            <div className="absolute left-0 top-0 h-2 rounded-l-full bg-rose-200" style={{ width: `${Math.max(0, (row.minValue / max) * 100)}%` }} />
                            <div className="absolute top-0 h-2 bg-amber-200" style={{ left: `${Math.max(0, (row.minValue / max) * 100)}%`, width: `${Math.max(0, ((row.targetValue - row.minValue) / max) * 100)}%` }} />
                            <div className="absolute right-0 top-0 h-2 rounded-r-full bg-emerald-200" style={{ width: `${Math.max(0, ((max - row.targetValue) / max) * 100)}%` }} />
                            <span className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded bg-slate-700" style={{ left: `${marker}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500"><span>Sensitivity-Envelope</span><span>Worst vs Best</span></div>
                    <div className="relative h-10 rounded-md border border-dashed border-slate-200 bg-slate-50">
                      <div className="absolute left-6 right-6 top-1/2 h-0.5 -translate-y-1/2 bg-slate-300" />
                      <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-rose-400" style={{ left: "18%" }} />
                      <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-blue-400" style={{ left: "50%" }} />
                      <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-emerald-400" style={{ left: "82%" }} />
                    </div>
                    <div className="mt-2 grid grid-cols-3 text-[11px] text-slate-500">
                      <span>{formatCurrency(Number(sensitivity.worst ?? 0))}</span>
                      <span className="text-center">{formatCurrency(Number(sensitivity.base ?? 0))}</span>
                      <span className="text-right">{formatCurrency(Number(sensitivity.best ?? 0))}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={snapshot.uiState.stage} onValueChange={(value) => bridge.actions.setStage(value as "quick" | "validation") }>
          <TabsList>
            <TabsTrigger value="quick">QuickCheck</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-500" />
                  <div>
                    <CardTitle>QuickCheck Workflow</CardTitle>
                    <CardDescription>Prüfe die 7 Kostenkategorien.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {quickBlocks.map((block, index) => {
                    const topRank = [...quickBlocks].sort((a, b) => b.valuePerUnit - a.valuePerUnit).findIndex((item) => item.key === block.key) + 1;
                    const isTop = topRank > 0 && topRank <= 3;
                    const isAmazon = block.key === "amazon";
                    return (
                      <button
                        key={block.key}
                        type="button"
                        className={cn(
                          "rounded-lg border bg-white p-3 text-left transition hover:bg-slate-50",
                          isAmazon && "border-rose-200",
                        )}
                        onClick={() => {
                          const payload = bridge.actions.buildDriverPayloadForBlock(block.key, "quick");
                          bridge.actions.openDriver(payload);
                        }}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{block.title}</span>
                          {isTop && <Badge variant={topRank === 1 ? "no_go" : topRank === 2 ? "watch" : "go"}>{`Top ${topRank}`}</Badge>}
                        </div>
                        <div className="text-2xl font-semibold text-slate-800">{formatCurrency(block.valuePerUnit)}<span className="ml-1 text-sm text-slate-400">/ Unit</span></div>
                        <div className="mt-1 text-xs text-slate-500">{formatPercent(block.sharePct)} Anteil</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Validation Workflow</CardTitle>
                  <CardDescription>Triage-View für offene Annahmen und Restkosten.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Validation-Abdeckung</span>
                    <span className="text-slate-600">{formatPercent(metrics.validation.coveragePct)}</span>
                  </div>
                  <Progress value={metrics.validation.coveragePct} />
                  <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-500 md:grid-cols-3">
                    <span>Ziel: {formatPercent(metrics.validation.coverageTargetPct)}</span>
                    <span>Abgedeckt: {formatCurrency(metrics.validation.coveredPerUnit)} / Unit</span>
                    <span>Offen: {formatCurrency(metrics.validation.residualPerUnit)} / Unit</span>
                  </div>
                </Card>

                <Card className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Annahme</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Anteil</TableHead>
                        <TableHead>Wert</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(metrics.validation.blockItems as Array<Record<string, unknown>>).slice(0, 8).map((item, idx) => {
                        const isCore = Boolean(item.isCore);
                        const checked = Boolean(item.isChecked);
                        return (
                          <TableRow key={`${String(item.id ?? idx)}`}>
                            <TableCell className="font-medium text-slate-700">{String(item.label ?? "-")}</TableCell>
                            <TableCell>
                              {isCore ? <Badge variant="info">Core</Badge> : checked ? <Badge variant="go">Validiert</Badge> : <Badge variant="watch">Offen</Badge>}
                            </TableCell>
                            <TableCell>{formatPercent(Number(item.sharePct ?? 0))}</TableCell>
                            <TableCell>{formatCurrency(Number(item.perUnit ?? 0))} / Unit</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>

                <Card className="p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"><AlertTriangle className="h-4 w-4 text-amber-500" />Sensitivity Playground</div>
                  <p className="text-xs text-slate-500">Worst/Base/Best aus dem bestehenden Rechenkern. Für Detail-Sandbox bleiben die bestehenden Validation-Regler im Kernel erhalten.</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                    {(sensitivity.stresses ?? []).map((stress) => (
                      <Card key={stress.label} className="p-2">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">{stress.label}</div>
                        <div className="text-base font-semibold text-slate-800">{formatCurrency(stress.value)}</div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Eingabe</CardTitle>
              <CardDescription>Drei Blöcke mit Progressive Disclosure. Alle bestehenden Datenpfade bleiben bedienbar.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={["market"]} className="space-y-2">
              <AccordionItem value="market">
                <AccordionTrigger>1) Markt & Absatz</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {PRIMARY_FIELDS.market.map((field) => renderField(field, selectedProduct, bridge.actions.updateField))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipping">
                <AccordionTrigger>2) Produkt, Verpackung & Shipping Input</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {PRIMARY_FIELDS.shipping.map((field) => renderField(field, selectedProduct, bridge.actions.updateField))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="purchase">
                <AccordionTrigger>3) Einkauf, Amazon & Launch</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {PRIMARY_FIELDS.purchase.map((field) => renderField(field, selectedProduct, bridge.actions.updateField))}
                    </div>
                    <div className="rounded-md border border-dashed border-slate-300 p-3">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                        onClick={() => setShowAdvancedFields((prev) => !prev)}
                      >
                        <ChevronRight className={cn("h-3.5 w-3.5 transition", showAdvancedFields && "rotate-90")} />
                        Erweitert (alle übrigen Felder)
                      </button>
                      {showAdvancedFields && (
                        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                          {advancedPaths.map((path) => {
                            const raw = getByPath(selectedProduct, path);
                            const isBool = typeof raw === "boolean";
                            return (
                              <label key={path} className="grid gap-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{path}</span>
                                {isBool ? (
                                  <select
                                    className="h-9 rounded-md border border-input bg-white px-3 text-sm"
                                    value={String(raw)}
                                    onChange={(event) => bridge.actions.updateField(path, event.target.value === "true")}
                                  >
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                  </select>
                                ) : (
                                  <Input
                                    value={raw === undefined || raw === null ? "" : String(raw)}
                                    onChange={(event) => bridge.actions.updateField(path, event.target.value)}
                                  />
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent className="max-w-sm p-0">
          <Sidebar
            snapshot={snapshot}
            onAdd={() => bridge.actions.addProduct()}
            onSelect={(id) => {
              bridge.actions.selectProduct(id);
              setMobileSidebarOpen(false);
            }}
            onDuplicate={() => bridge.actions.duplicateProduct(snapshot.selectedId ?? undefined)}
            onDelete={() => bridge.actions.deleteProduct(snapshot.selectedId ?? undefined)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(snapshot.uiState.driverPayload)} onOpenChange={(open) => !open && bridge.actions.closeDriver()}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{String((snapshot.uiState.driverPayload as Record<string, unknown> | null)?.title ?? "Treiber-Details")}</SheetTitle>
            <SheetDescription>{String((snapshot.uiState.driverPayload as Record<string, unknown> | null)?.explain ?? "Treiber-Maske")}</SheetDescription>
          </SheetHeader>
          {Boolean(snapshot.uiState.driverPayload) && (
            <div className="space-y-3 text-sm">
              <Card className="p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Wert</p>
                <p className="text-lg font-semibold text-slate-800">{String((snapshot.uiState.driverPayload as Record<string, unknown>).value ?? "-")}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Formel</p>
                <p className="text-slate-700">{String((snapshot.uiState.driverPayload as Record<string, unknown>).formula ?? "-")}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Quelle</p>
                <p className="text-slate-700">{String((snapshot.uiState.driverPayload as Record<string, unknown>).source ?? "-")}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Driver Paths</p>
                <div className="mt-2 space-y-1">
                  {Array.isArray((snapshot.uiState.driverPayload as Record<string, unknown>).driverPaths)
                    ? ((snapshot.uiState.driverPayload as Record<string, unknown>).driverPaths as unknown[]).map((path, idx) => (
                      <div key={`${String(path)}-${idx}`} className="rounded border border-border bg-slate-50 px-2 py-1 text-xs text-slate-600">
                        {String(path)}
                      </div>
                    ))
                    : <p className="text-xs text-slate-500">Keine Pfade verfügbar.</p>}
                </div>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default App;
