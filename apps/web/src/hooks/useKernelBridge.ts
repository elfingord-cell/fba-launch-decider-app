import { useEffect, useMemo, useState } from "react";
import type { BridgeSnapshot, KernelBridge } from "@/lib/bridge";
import { getKernelBridge } from "@/lib/bridge";

interface BridgeState {
  loading: boolean;
  error: string | null;
  bridge: KernelBridge | null;
  snapshot: BridgeSnapshot | null;
}

export function useKernelBridge() {
  const [state, setState] = useState<BridgeState>({
    loading: true,
    error: null,
    bridge: null,
    snapshot: null,
  });

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | null = null;

    const tryBoot = async (attempt = 0) => {
      const bridge = getKernelBridge();
      if (!bridge) {
        if (attempt < 80) {
          window.setTimeout(() => {
            void tryBoot(attempt + 1);
          }, 50);
          return;
        }
        if (!disposed) {
          setState((prev) => ({ ...prev, loading: false, error: "Kernel Bridge nicht gefunden." }));
        }
        return;
      }

      try {
        const initial = await bridge.init();
        if (disposed) {
          return;
        }
        unsubscribe = bridge.subscribe((snapshot) => {
          if (disposed) {
            return;
          }
          setState((prev) => ({ ...prev, snapshot }));
        });
        setState({ loading: false, error: null, bridge, snapshot: initial });
      } catch (error) {
        if (!disposed) {
          const message = error instanceof Error ? error.message : "Bridge Init fehlgeschlagen";
          setState((prev) => ({ ...prev, loading: false, error: message }));
        }
      }
    };

    void tryBoot();

    return () => {
      disposed = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return useMemo(() => state, [state]);
}
