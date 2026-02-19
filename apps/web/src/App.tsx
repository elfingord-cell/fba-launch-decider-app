import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Circle,
  Copy,
  Download,
  Info,
  Layers,
  LogIn,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserPlus,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useKernelBridge } from "@/hooks/useKernelBridge";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

const FIELD_HELP: Record<string, string> = {
  name: "Interner Produktname für Portfolio und Vergleich.",
  "basic.priceGross": "Bruttopreis in EUR inkl. USt. Kerninput für Umsatz und Margen.",
  "basic.demandValue": "Absatzannahme pro Monat oder Tag gemäß Auswahl darunter.",
  "assumptions.ads.tacosRate": "Anteil Werbekosten am Bruttoumsatz in Prozent.",
  "assumptions.returns.returnRate": "Retourenquote in Prozent auf Absatzbasis.",
  "basic.exwUnit": "Einkaufspreis je Einheit beim Hersteller in USD.",
  "basic.netWeightG": "Nettogewicht pro Einheit in Gramm. Treiber für FBA und Transport.",
  "basic.unitsPerOrder": "PO-Menge pro Importorder. Einfluss auf fixe Kosten je Stück.",
};

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

function statusLabel(color: GoNoGoColor | string) {
  if (color === "green") {
    return "Go";
  }
  if (color === "orange") {
    return "Watch";
  }
  if (color === "red") {
    return "No-Go";
  }
  return "Neutral";
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

function stageLabel(stage: "quick" | "validation") {
  return stage === "validation" ? "Validation" : "QuickCheck";
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

function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
      {help ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-slate-400 transition hover:text-slate-600" aria-label={`Info zu ${label}`}>
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px] text-xs leading-relaxed">{help}</TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}

function renderField(def: FieldDef, selectedProduct: Record<string, unknown>, updateField: (path: string, value: unknown) => void) {
  const value = getByPath(selectedProduct, def.path);
  const selectValue = value === undefined || value === null || value === "" ? undefined : String(value);

  return (
    <label key={def.path} className="grid gap-1.5">
      <FieldLabel label={def.label} help={FIELD_HELP[def.path]} />
      {def.type === "select" && def.options ? (
        <Select value={selectValue} onValueChange={(next) => updateField(def.path, next)}>
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
          onChange={(event) => updateField(def.path, event.target.value)}
        />
      )}
    </label>
  );
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

      <div className="flex-1 space-y-2 overflow-auto pr-1">
        {snapshot.products.map((product) => {
          const active = product.id === snapshot.selectedId;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              className={cn(
                "relative w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition",
                active && "border-blue-200 bg-blue-50/40",
              )}
            >
              {active ? <span className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-blue-500" aria-hidden="true" /> : null}
              <div className="mb-1 flex items-center gap-2">
                <Circle
                  className={cn(
                    "h-2.5 w-2.5 fill-current",
                    product.goNoGoStatus === "green"
                      ? "text-emerald-500"
                      : product.goNoGoStatus === "orange"
                        ? "text-amber-500"
                        : "text-rose-500",
                  )}
                />
                <span className="text-xs font-semibold text-slate-800">{product.name || "Unbenannt"}</span>
              </div>
              <div className="space-y-0.5 pl-0.5 text-[11px] text-slate-500">
                <p>{formatCurrency(product.headlineMetrics.priceGross)} brutto</p>
                <p>{formatPercent(product.headlineMetrics.netMarginPct)} Netto-Marge</p>
                <p>{formatPercent(product.headlineMetrics.sellerboardMarginPct)} Sellerboard</p>
              </div>
              <Badge className="mt-2 w-fit" variant="neutral">
                {stageLabel(product.stage)}
              </Badge>
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

function App() {
  const { loading, error, bridge, snapshot } = useKernelBridge();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [advancedSheetOpen, setAdvancedSheetOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [fxPending, setFxPending] = useState(false);
  const [importPending, setImportPending] = useState(false);
  const [validationStress, setValidationStress] = useState(-10);

  const selectedProduct = (snapshot?.selectedProduct ?? null) as Record<string, unknown> | null;
  const metrics = snapshot?.metrics;

  const visual = metrics?.visualCockpit as Record<string, unknown> | null;
  const waterfall = (visual?.waterfall as { blocks?: Array<{ key: string; label: string; value: number }>; startValue?: number; endValue?: number }) ?? {};
  const riskRows = (visual?.risk as { rows?: Array<{ key: string; label: string; value: number; minValue: number; targetValue: number }> })?.rows ?? [];
  const sensitivity = (visual?.sensitivity as { worst?: number; base?: number; best?: number; stresses?: Array<{ label: string; value: number }> }) ?? {};

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

  const quickRanks = useMemo(() => {
    const ranking = new Map<string, number>();
    [...quickBlocks]
      .sort((a, b) => b.valuePerUnit - a.valuePerUnit)
      .forEach((item, index) => ranking.set(item.key, index + 1));
    return ranking;
  }, [quickBlocks]);

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

  const kpiCards = useMemo(() => {
    if (!metrics) {
      return [];
    }
    return [
      {
        title: "Netto-Marge nach PPC",
        value: metrics.kpis.netMarginAfterPpc,
        color: metrics.decision.kpiStatus.netMarginAfterPpc,
        secondaryLabel: "Kosten / Stk",
        secondaryValue: formatCurrency(metrics.kpis.totalCostPerUnit),
        badge: statusLabel(metrics.decision.kpiStatus.netMarginAfterPpc),
      },
      {
        title: "Marge vor PPC",
        value: metrics.kpis.marginBeforePpc,
        color: metrics.decision.kpiStatus.marginBeforePpc,
        secondaryLabel: "Gewinn / Stk",
        secondaryValue: formatCurrency(metrics.kpis.profitPerUnit),
        badge: statusLabel(metrics.decision.kpiStatus.marginBeforePpc),
      },
      {
        title: "ROI (Unit-basiert)",
        value: metrics.kpis.roiUnit,
        color: metrics.decision.kpiStatus.roi,
        secondaryLabel: "Umsatz / Mo",
        secondaryValue: formatCurrency(metrics.kpis.grossRevenueMonthly),
        badge: statusLabel(metrics.decision.kpiStatus.roi),
      },
      {
        title: "Sellerboard-Marge",
        value: metrics.kpis.sellerboardMargin,
        color: "neutral",
        secondaryLabel: "Gewinn netto / Mo",
        secondaryValue: formatCurrency(metrics.kpis.profitMonthly),
        badge: "Neutral",
      },
    ];
  }, [metrics]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">Kernel wird geladen ...</div>;
  }

  if (error || !bridge || !snapshot || !selectedProduct || !metrics) {
    return <div className="m-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error ?? "Kein Snapshot verfügbar."}</div>;
  }

  const appMode = snapshot.sessionState.appMode;
  const decisionColor = metrics.decision.color;
  const isSharedReady =
    snapshot.sessionState.storageMode === "shared" &&
    snapshot.sessionState.isAuthenticated &&
    snapshot.sessionState.hasWorkspaceAccess;
  const canImportLocal = isSharedReady && snapshot.sessionState.pendingLocalImport;

  const syncTone = isSharedReady
    ? snapshot.syncState.connected
      ? "text-emerald-700"
      : "text-amber-700"
    : "text-slate-500";

  const syncLabel = isSharedReady
    ? snapshot.syncState.connected
      ? "Live-Sync aktiv"
      : "Sync aktiv"
    : "Lokaler Modus";

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthStatus(null);
    setAuthPending(true);
    try {
      if (authView === "login") {
        const result = await bridge.actions.login(authEmail, authPassword);
        if (!result.ok) {
          setAuthStatus(result.error ?? "Anmeldung fehlgeschlagen.");
          return;
        }
        setAuthStatus("Anmeldung erfolgreich. Workspace wird geladen ...");
        setAuthPassword("");
        return;
      }
      const result = await bridge.actions.register(authEmail, authPassword);
      if (!result.ok) {
        setAuthStatus(result.error ?? "Registrierung fehlgeschlagen.");
        return;
      }
      if (result.requiresEmailConfirmation) {
        setAuthStatus("Registrierung erfolgreich. Bitte E-Mail bestätigen.");
      } else {
        setAuthStatus("Registrierung erfolgreich. Workspace wird geladen ...");
      }
      setAuthPassword("");
    } catch (submitError) {
      setAuthStatus(submitError instanceof Error ? submitError.message : "Authentifizierung fehlgeschlagen.");
    } finally {
      setAuthPending(false);
    }
  };

  const handleRefreshFx = async () => {
    setFxPending(true);
    setActionStatus(null);
    try {
      await bridge.actions.refreshFx();
      setActionStatus("FX-Kurs aktualisiert.");
    } catch (refreshError) {
      setActionStatus(refreshError instanceof Error ? refreshError.message : "FX-Refresh fehlgeschlagen.");
    } finally {
      setFxPending(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncPending(true);
    setActionStatus(null);
    try {
      await bridge.actions.syncNow();
      setActionStatus("Sync ausgelöst.");
    } catch (syncError) {
      setActionStatus(syncError instanceof Error ? syncError.message : "Sync fehlgeschlagen.");
    } finally {
      setSyncPending(false);
    }
  };

  const handleImportLocal = async () => {
    setImportPending(true);
    setActionStatus(null);
    try {
      const result = await bridge.actions.importLocalData();
      setActionStatus(result.ok ? "Lokale Daten importiert." : "Kein lokaler Import verfügbar.");
    } catch (importError) {
      setActionStatus(importError instanceof Error ? importError.message : "Import fehlgeschlagen.");
    } finally {
      setImportPending(false);
    }
  };

  const handleLogout = async () => {
    setActionStatus(null);
    try {
      const result = await bridge.actions.logout();
      if (!result.ok) {
        setActionStatus(result.error ?? "Abmeldung fehlgeschlagen.");
        return;
      }
      setActionStatus("Abgemeldet.");
    } catch (logoutError) {
      setActionStatus(logoutError instanceof Error ? logoutError.message : "Abmeldung fehlgeschlagen.");
    }
  };

  if (appMode === "auth_required") {
    return (
      <TooltipProvider>
        <div className="flex min-h-full items-center justify-center bg-slate-50 p-4">
          <Card className="w-full max-w-[460px] p-6">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-600">
              <LogIn className="h-4 w-4" /> Workspace-Anmeldung
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Gemeinsamer Workspace</h1>
            <p className="mt-1 text-sm text-slate-500">Bitte anmelden oder registrieren, um Produktdaten und Sync zu nutzen.</p>

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={authView === "login" ? "default" : "outline"}
                className={cn("flex-1", authView === "login" && "bg-slate-800 hover:bg-slate-700")}
                onClick={() => setAuthView("login")}
              >
                <LogIn className="mr-1 h-3.5 w-3.5" /> Login
              </Button>
              <Button
                type="button"
                size="sm"
                variant={authView === "register" ? "default" : "outline"}
                className={cn("flex-1", authView === "register" && "bg-slate-800 hover:bg-slate-700")}
                onClick={() => setAuthView("register")}
              >
                <UserPlus className="mr-1 h-3.5 w-3.5" /> Registrieren
              </Button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleAuthSubmit}>
              <label className="grid gap-1.5">
                <FieldLabel label="E-Mail" />
                <Input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="name@firma.de"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="grid gap-1.5">
                <FieldLabel label="Passwort" />
                <Input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  autoComplete={authView === "login" ? "current-password" : "new-password"}
                  required
                />
              </label>
              <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700" disabled={authPending}>
                {authPending ? "Bitte warten ..." : authView === "login" ? "Anmelden" : "Registrieren"}
              </Button>
            </form>

            {authStatus ? (
              <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{authStatus}</p>
            ) : null}
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  if (appMode === "no_access") {
    return (
      <TooltipProvider>
        <div className="flex min-h-full items-center justify-center bg-slate-50 p-4">
          <Card className="w-full max-w-[520px] p-6">
            <div className="mb-3 flex items-center gap-2 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Kein Zugriff auf Workspace</h1>
            </div>
            <p className="text-sm text-slate-600">
              Dein Account ist authentifiziert, hat aber aktuell keinen Zugriff auf den geteilten Workspace.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleRefreshFx} disabled={fxPending}>
                <RefreshCw className={cn("mr-1 h-3.5 w-3.5", fxPending && "animate-spin")} /> Neu laden
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-3.5 w-3.5" /> Abmelden
              </Button>
            </div>
            {actionStatus ? <p className="mt-3 text-xs text-slate-500">{actionStatus}</p> : null}
          </Card>
        </div>
      </TooltipProvider>
    );
  }

  const waterfallBlocks = waterfall.blocks ?? [];
  const waterfallScale = Math.max(
    1,
    Math.abs(Number(waterfall.startValue ?? 0)),
    ...waterfallBlocks.map((block) => Math.abs(Number(block.value ?? 0))),
  );

  const sensitivityWorst = Number(sensitivity.worst ?? 0);
  const sensitivityBase = Number(sensitivity.base ?? 0);
  const sensitivityBest = Number(sensitivity.best ?? 0);
  const sensitivitySpan = Math.max(1, sensitivityBest - sensitivityWorst);
  const sensitivityPos = (value: number) => {
    const ratio = (value - sensitivityWorst) / sensitivitySpan;
    return Math.max(6, Math.min(94, 6 + ratio * 88));
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 p-4 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <Sidebar
              snapshot={snapshot}
              onAdd={() => bridge.actions.addProduct()}
              onSelect={(id) => bridge.actions.selectProduct(id)}
              onDuplicate={() => bridge.actions.duplicateProduct(snapshot.selectedId ?? undefined)}
              onDelete={() => bridge.actions.deleteProduct(snapshot.selectedId ?? undefined)}
            />
          </div>

          <main className="grid min-h-0 gap-4">
            <Card className="p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Amazon FBA 80/20 Modell</p>
                  <h1 className="text-[44px] font-semibold leading-none tracking-tight text-slate-900">Produkt: {String(selectedProduct.name || "Unbenannt")}</h1>
                  <p className="mt-1 text-xs text-slate-500">Launch-Entscheider pro Produkt: schnelle Go/Watch/No-Go Bewertung mit Progressive Disclosure.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                      1 USD = {formatNumber(snapshot.fxStatus.usdToEur)} EUR
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-500">
                      Stand: {formatDate(snapshot.fxStatus.date)}
                    </span>
                    <span className={cn("inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1", syncTone)}>
                      {isSharedReady && snapshot.syncState.connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                      {syncLabel}
                    </span>
                    {snapshot.sessionState.userEmail ? (
                      <span className="text-slate-500">{snapshot.sessionState.userEmail}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileSidebarOpen(true)}>
                    <Menu className="mr-1 h-3.5 w-3.5" /> Portfolio
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRefreshFx} disabled={fxPending}>
                    <RefreshCw className={cn("mr-1 h-3.5 w-3.5", fxPending && "animate-spin")} /> Kurs aktualisieren
                  </Button>
                  <a
                    href="/settings.html"
                    className="inline-flex h-8 items-center rounded-md border border-border bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Settings className="mr-1 h-3.5 w-3.5" /> Zu Settings
                  </a>
                  {isSharedReady ? (
                    <Button variant="outline" size="sm" onClick={handleSyncNow} disabled={syncPending}>
                      <RefreshCw className={cn("mr-1 h-3.5 w-3.5", syncPending && "animate-spin")} /> Jetzt synchronisieren
                    </Button>
                  ) : null}
                  {canImportLocal ? (
                    <Button variant="outline" size="sm" onClick={handleImportLocal} disabled={importPending}>
                      <Download className="mr-1 h-3.5 w-3.5" /> Lokale Daten importieren
                    </Button>
                  ) : null}
                  {snapshot.sessionState.isAuthenticated ? (
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                      <LogOut className="mr-1 h-3.5 w-3.5" /> Abmelden
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={() => setAdvancedSheetOpen(true)}>
                    <Sparkles className="mr-1 h-3.5 w-3.5" /> Erweitert
                  </Button>
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
              {actionStatus ? <p className="mt-3 text-xs text-slate-500">{actionStatus}</p> : null}
            </Card>

            <section className="card-shell sticky top-3 z-20 border border-blue-200 p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-start gap-2">
                  <div className="rounded-md border border-blue-100 bg-blue-50 p-2 text-blue-600">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-[36px] font-semibold leading-none tracking-tight text-slate-900">Decision-Bar</h2>
                    <p className="mt-1 text-xs text-slate-500">Wichtigste KPIs für die Go/No-Go Entscheidung.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => bridge.actions.toggleDecisionDetails()}>
                    {snapshot.uiState.quickShowAllKpis ? "Details ausblenden" : "Details einblenden"}
                  </Button>
                  <Badge variant={goNoGoVariant(decisionColor)} className="px-4 py-1 text-sm">
                    STATUS: {metrics.decision.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
                {kpiCards.map((item) => (
                  <Card key={item.title} className={cn("left-kpi-accent p-4", kpiClass(item.color))}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.title}</span>
                      <Badge variant={goNoGoVariant(item.color)}>{item.badge}</Badge>
                    </div>
                    <div className="text-[50px] font-semibold leading-none tracking-tight text-slate-900">
                      {item.value.toFixed(1)}
                      <span className="ml-1 text-[26px] font-medium text-slate-400">%</span>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">{item.secondaryLabel}</p>
                        <p className="text-lg font-semibold text-slate-800">{item.secondaryValue}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {snapshot.uiState.quickShowAllKpis ? (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-dashed border-slate-200 pt-3 xl:grid-cols-5">
                  <Card className="p-2.5">
                    <p className="text-[11px] text-slate-500">Shipping / Unit</p>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(metrics.kpis.shippingUnit)}</p>
                  </Card>
                  <Card className="p-2.5">
                    <p className="text-[11px] text-slate-500">Landed / Unit</p>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(metrics.kpis.landedUnit)}</p>
                  </Card>
                  <Card className="p-2.5">
                    <p className="text-[11px] text-slate-500">Gewinn netto / Monat</p>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(metrics.kpis.profitMonthly)}</p>
                  </Card>
                  <Card className="p-2.5">
                    <p className="text-[11px] text-slate-500">Break-even</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {metrics.kpis.breakEvenPrice == null ? "n/a" : formatCurrency(metrics.kpis.breakEvenPrice)}
                    </p>
                  </Card>
                  <Card className="p-2.5">
                    <p className="text-[11px] text-slate-500">Max TACoS</p>
                    <p className="text-sm font-semibold text-slate-900">{formatPercent(metrics.kpis.maxTacosRateForTarget)}</p>
                  </Card>
                </div>
              ) : null}
            </section>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-[34px] leading-none tracking-tight">Visual Cockpit</CardTitle>
                  <CardDescription>Detaillierte Analyse der Kostentreiber.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => bridge.actions.toggleVisualCockpit()}>
                  {snapshot.uiState.cockpitVisualCollapsed ? "Ausklappen" : "Einklappen"}
                </Button>
              </CardHeader>
              <CardContent>
                {snapshot.uiState.cockpitVisualCollapsed ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Visual Cockpit ist eingeklappt.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Card className="p-3">
                      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        <span>Unit-Economics-Waterfall</span>
                        <span>Netto-Preis minus Kosten</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-600">Netto-Preis</span>
                            <span className="font-semibold text-blue-600">+{formatCurrency(Number(waterfall.startValue ?? 0))}</span>
                          </div>
                          <div className="h-1.5 rounded bg-slate-100">
                            <div className="h-1.5 rounded bg-blue-500" style={{ width: "100%" }} />
                          </div>
                        </div>

                        {waterfallBlocks.map((block) => (
                          <div key={block.key}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-600">{block.label}</span>
                              <span className="font-medium text-rose-500">-{formatCurrency(block.value)}</span>
                            </div>
                            <div className="h-1.5 rounded bg-slate-100">
                              <div
                                className="h-1.5 rounded bg-rose-300"
                                style={{ width: `${Math.max(6, Math.min(100, (Math.abs(block.value) / waterfallScale) * 100))}%` }}
                              />
                            </div>
                          </div>
                        ))}

                        <div className="border-t border-slate-100 pt-3">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">Gewinn pro Unit</span>
                            <span className="font-semibold text-emerald-600">+{formatCurrency(Number(waterfall.endValue ?? 0))}</span>
                          </div>
                          <div className="h-1.5 rounded bg-emerald-100">
                            <div
                              className="h-1.5 rounded bg-emerald-500"
                              style={{ width: `${Math.max(6, Math.min(100, (Math.abs(Number(waterfall.endValue ?? 0)) / waterfallScale) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-3">
                      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        <span>Ampel-Risiko-Matrix</span>
                        <span>Min/Target-Zonen</span>
                      </div>
                      <div className="space-y-4">
                        {riskRows.map((row) => {
                          const max = Math.max(row.targetValue * 1.35, row.minValue * 1.7, row.value * 1.1, 1);
                          const marker = Math.max(0, Math.min(100, (row.value / max) * 100));
                          const redWidth = Math.max(0, (row.minValue / max) * 100);
                          const amberWidth = Math.max(0, ((row.targetValue - row.minValue) / max) * 100);
                          const greenWidth = Math.max(0, 100 - redWidth - amberWidth);
                          return (
                            <div key={row.key} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">{row.label}</span>
                                <strong className="text-slate-800">{formatPercent(row.value)}</strong>
                              </div>
                              <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full bg-rose-200" style={{ width: `${redWidth}%` }} />
                                <div className="absolute left-0 top-0 h-full bg-amber-200" style={{ left: `${redWidth}%`, width: `${amberWidth}%` }} />
                                <div className="absolute left-0 top-0 h-full bg-emerald-200" style={{ left: `${redWidth + amberWidth}%`, width: `${greenWidth}%` }} />
                                <span className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-slate-700" style={{ left: `${marker}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>Sensitivity-Envelope</span>
                          <span>Worst vs Best Case</span>
                        </div>
                        <div className="relative h-12 rounded-md border border-dashed border-slate-200 bg-slate-50">
                          <div className="absolute left-6 right-6 top-1/2 h-0.5 -translate-y-1/2 bg-slate-300" />
                          <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-rose-400" style={{ left: `${sensitivityPos(sensitivityWorst)}%` }} />
                          <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-blue-400" style={{ left: `${sensitivityPos(sensitivityBase)}%` }} />
                          <span className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-emerald-400" style={{ left: `${sensitivityPos(sensitivityBest)}%` }} />
                        </div>
                        <div className="mt-2 grid grid-cols-3 text-[11px] text-slate-500">
                          <span>{formatCurrency(sensitivityWorst)}</span>
                          <span className="text-center">{formatCurrency(sensitivityBase)}</span>
                          <span className="text-right">{formatCurrency(sensitivityBest)}</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs value={snapshot.uiState.stage} onValueChange={(value) => bridge.actions.setStage(value as "quick" | "validation")} className="card-shell p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-500" />
                  <div>
                    <h2 className="text-[28px] font-semibold leading-none tracking-tight text-slate-900">Workflow</h2>
                    <p className="text-xs text-slate-500">Trennung zwischen schneller Schätzung und harter Prüfung.</p>
                  </div>
                </div>
                <TabsList>
                  <TabsTrigger value="quick">QuickCheck</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="quick" className="mt-0">
                <Card className="border-slate-100">
                  <CardHeader>
                    <div>
                      <CardTitle>QuickCheck Workflow</CardTitle>
                      <CardDescription>Prüfe die 7 Kostenkategorien.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {quickBlocks.map((block) => {
                        const rank = quickRanks.get(block.key) ?? 0;
                        const isTop = rank > 0 && rank <= 3;
                        const isAmazon = block.key === "amazon";
                        return (
                          <button
                            key={block.key}
                            type="button"
                            className={cn(
                              "rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50",
                              isAmazon && "border-rose-200",
                            )}
                            onClick={() => {
                              const payload = bridge.actions.buildDriverPayloadForBlock(block.key, "quick");
                              bridge.actions.openDriver(payload);
                            }}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className={cn("text-[11px] font-semibold uppercase tracking-wide", isAmazon ? "text-rose-600" : "text-slate-500")}>
                                {block.title}
                              </span>
                              {isTop ? (
                                <Badge variant={rank === 1 ? "no_go" : rank === 2 ? "watch" : "neutral"}>{`Top ${rank}`}</Badge>
                              ) : null}
                            </div>
                            <div className={cn("text-3xl font-semibold leading-none tracking-tight", isAmazon ? "text-rose-600" : "text-slate-800")}>
                              {formatCurrency(block.valuePerUnit)}
                              <span className="ml-1 text-sm font-medium text-slate-400">/ Unit</span>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">{formatPercent(block.sharePct)} Anteil</div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="validation" className="mt-0">
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
                          {(metrics.validation.blockItems as Array<Record<string, unknown>>).slice(0, 10).map((item, idx) => {
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
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Sensitivity Playground
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                            <span>Was wenn Preis reduziert wird?</span>
                            <strong>{validationStress}%</strong>
                          </div>
                          <input
                            type="range"
                            min={-20}
                            max={5}
                            value={validationStress}
                            onChange={(event) => setValidationStress(Number(event.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          <Card className="p-2">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">Worst</div>
                            <div className="text-base font-semibold text-slate-800">{formatCurrency(sensitivityWorst)}</div>
                          </Card>
                          <Card className="p-2">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">Base</div>
                            <div className="text-base font-semibold text-slate-800">{formatCurrency(sensitivityBase)}</div>
                          </Card>
                          <Card className="p-2">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">Best</div>
                            <div className="text-base font-semibold text-slate-800">{formatCurrency(sensitivityBest)}</div>
                          </Card>
                        </div>
                      </div>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-[28px] leading-none tracking-tight">Eingabe</CardTitle>
                  <CardDescription>Alle bestehenden Eingabefelder bleiben erhalten. Primär-Felder sichtbar, Rest unter Erweitert.</CardDescription>
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
                          {showAdvancedFields ? (
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
                          ) : null}
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

          <Sheet open={advancedSheetOpen} onOpenChange={setAdvancedSheetOpen}>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Erweiterte Kennzahlen</SheetTitle>
                <SheetDescription>Zusatzmetriken, Validierungsdetails und Residuals außerhalb der Hauptfläche.</SheetDescription>
              </SheetHeader>

              <div className="space-y-3 text-sm">
                <Card className="p-3">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">KPI-Set</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] text-slate-500">Break-even</p>
                      <p className="font-semibold text-slate-800">
                        {metrics.kpis.breakEvenPrice == null ? "n/a" : formatCurrency(metrics.kpis.breakEvenPrice)}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] text-slate-500">Max TACoS</p>
                      <p className="font-semibold text-slate-800">{formatPercent(metrics.kpis.maxTacosRateForTarget)}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] text-slate-500">Shipping / Unit</p>
                      <p className="font-semibold text-slate-800">{formatCurrency(metrics.kpis.shippingUnit)}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] text-slate-500">Landed / Unit</p>
                      <p className="font-semibold text-slate-800">{formatCurrency(metrics.kpis.landedUnit)}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Annahme</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Anteil</TableHead>
                        <TableHead>EUR / Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(metrics.validation.blockItems as Array<Record<string, unknown>>).slice(0, 24).map((item, idx) => {
                        const isCore = Boolean(item.isCore);
                        const checked = Boolean(item.isChecked);
                        return (
                          <TableRow key={`advanced-${String(item.id ?? idx)}`}>
                            <TableCell className="font-medium text-slate-700">{String(item.label ?? "-")}</TableCell>
                            <TableCell>
                              {isCore ? <Badge variant="info">Core</Badge> : checked ? <Badge variant="go">Validiert</Badge> : <Badge variant="watch">Offen</Badge>}
                            </TableCell>
                            <TableCell>{formatPercent(Number(item.sharePct ?? 0))}</TableCell>
                            <TableCell>{formatCurrency(Number(item.perUnit ?? 0))}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={Boolean(snapshot.uiState.driverPayload)} onOpenChange={(open) => !open && bridge.actions.closeDriver()}>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{String((snapshot.uiState.driverPayload as Record<string, unknown> | null)?.title ?? "Treiber-Details")}</SheetTitle>
                <SheetDescription>{String((snapshot.uiState.driverPayload as Record<string, unknown> | null)?.explain ?? "Treiber-Maske")}</SheetDescription>
              </SheetHeader>
              {Boolean(snapshot.uiState.driverPayload) ? (
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
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
