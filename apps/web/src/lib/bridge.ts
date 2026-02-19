export type GoNoGoColor = "green" | "orange" | "red";

export interface BridgeSnapshot {
  timestamp: string;
  selectedId: string | null;
  products: Array<{
    id: string;
    name: string;
    stage: "quick" | "validation";
    goNoGoStatus: GoNoGoColor;
    headlineMetrics: {
      priceGross: number;
      netMarginPct: number;
      sellerboardMarginPct: number;
    };
  }>;
  selectedProduct: Record<string, unknown> | null;
  fxStatus: {
    usdToEur: number;
    date: string | null;
    source: string;
    loading: boolean;
    error: string | null;
    text: string;
  };
  settingsMeta: {
    storageMode: string;
    productCount: number;
    validationCoverageTargetDefault: number;
  };
  sessionState: {
    appMode: "loading" | "auth_required" | "no_access" | "ready_shared" | "ready_local" | string;
    requiresAuth: boolean;
    isAuthenticated: boolean;
    hasWorkspaceAccess: boolean;
    pendingLocalImport: boolean;
    userEmail: string;
    workspaceId: string | null;
    workspaceName: string;
    storageMode: string;
  };
  syncState: {
    connected: boolean;
    pendingApply: boolean;
    lastRemoteSuccessAt: string | null;
    lastRemoteError: string | null;
    realtimeFallbackActive: boolean;
  };
  uiState: {
    stage: "quick" | "validation";
    quickShowAllKpis: boolean;
    cockpitVisualCollapsed: boolean;
    advancedVisible: boolean;
    driverPayload: unknown;
  };
  metrics: {
    decision: {
      color: GoNoGoColor;
      label: string;
      score: number;
      text: string;
      kpiStatus: {
        netMarginAfterPpc: GoNoGoColor;
        marginBeforePpc: GoNoGoColor;
        roi: GoNoGoColor;
      };
    };
    kpis: {
      netMarginAfterPpc: number;
      marginBeforePpc: number;
      roiUnit: number;
      sellerboardMargin: number;
      totalCostPerUnit: number;
      profitPerUnit: number;
      grossRevenueMonthly: number;
      profitMonthly: number;
      shippingUnit: number;
      landedUnit: number;
      breakEvenPrice: number | null;
      maxTacosRateForTarget: number;
    };
    quickBlocks: Array<{
      key: string;
      title: string;
      description: string;
      valuePerUnit: number;
      sharePct: number;
    }>;
    validation: {
      ready: boolean;
      coveragePct: number;
      coverageTargetPct: number;
      coveredPerUnit: number;
      residualPerUnit: number;
      blockItems: Array<Record<string, unknown>>;
      openTopResidualItems: Array<Record<string, unknown>>;
    };
    visualCockpit: Record<string, unknown> | null;
  } | null;
}

export interface KernelBridge {
  init: () => Promise<BridgeSnapshot>;
  getSnapshot: () => BridgeSnapshot;
  subscribe: (listener: (snapshot: BridgeSnapshot, reason?: string) => void) => () => void;
  actions: {
    updateField: (path: string, value: unknown) => void;
    addProduct: () => void;
    duplicateProduct: (id?: string) => void;
    deleteProduct: (id?: string) => void;
    selectProduct: (id: string) => void;
    setStage: (stage: "quick" | "validation") => void;
    toggleDecisionDetails: () => void;
    toggleVisualCockpit: () => void;
    openDriver: (payload: unknown) => void;
    closeDriver: () => void;
    buildDriverPayloadForBlock: (blockKey: string, stage?: "quick" | "validation") => unknown;
    refreshFx: () => Promise<void>;
    syncNow: () => Promise<void>;
    login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    register: (email: string, password: string) => Promise<{ ok: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
    logout: () => Promise<{ ok: boolean; error?: string }>;
    importLocalData: () => Promise<{ ok: boolean }>;
  };
}

declare global {
  interface Window {
    FbaKernelBridge?: KernelBridge;
    __FBA_BRIDGE_ONLY__?: boolean;
  }
}

export function getKernelBridge(): KernelBridge | null {
  return window.FbaKernelBridge ?? null;
}
