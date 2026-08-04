export { createSignalEngineConfig } from "@/lib/signals/config";
export { buildEvidenceBundle } from "@/lib/signals/build-bundle";
export { generateSignals } from "@/lib/signals/generate";
export {
  prioritizeSignals,
  scoreSignal,
  PRIORITY_FORMULA,
} from "@/lib/signals/prioritize";
export { runSignalEngine, briefingFactCounts } from "@/lib/signals/briefing";
export { dependencyImpactFromBundle } from "@/lib/signals/dependency-impact";
export type { DependencyImpactRow } from "@/lib/signals/dependency-impact";
export { validatedSourceUrl } from "@/lib/signals/urls";
export type * from "@/lib/signals/types";
export { DEFAULT_STALE_DAYS } from "@/lib/signals/types";
