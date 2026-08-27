import { DEFAULT_STALE_DAYS, type SignalEngineConfig } from "@/lib/signals/types";

export function createSignalEngineConfig(
  overrides: Partial<SignalEngineConfig> = {},
): SignalEngineConfig {
  return {
    staleDaysThreshold: overrides.staleDaysThreshold ?? DEFAULT_STALE_DAYS,
    now: overrides.now ?? new Date().toISOString(),
    demo: overrides.demo ?? false,
  };
}
