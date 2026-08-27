/** Pure helpers for GitHub check_run / check_suite normalization. */

export type CheckRunStatus = "queued" | "in_progress" | "completed";

export type CheckRunConclusion =
  | "success"
  | "failure"
  | "neutral"
  | "cancelled"
  | "skipped"
  | "timed_out"
  | "action_required"
  | null;

export type NormalizedCheckRunInput = {
  githubCheckRunId: number;
  name: string;
  status: CheckRunStatus;
  conclusion: CheckRunConclusion;
  htmlUrl: string | null;
  headSha: string | null;
  completedAt: string | null;
  /** GitHub updated_at — used for out-of-order rejection. */
  updatedAt: string | null;
  pullRequestNumbers: number[];
};

const STATUS_RANK: Record<CheckRunStatus, number> = {
  queued: 0,
  in_progress: 1,
  completed: 2,
};

export function normalizeCheckRunStatus(value: unknown): CheckRunStatus | null {
  if (value === "queued" || value === "in_progress" || value === "completed") {
    return value;
  }
  return null;
}

export function normalizeCheckRunConclusion(value: unknown): CheckRunConclusion {
  if (value == null || value === "") return null;
  if (
    value === "success" ||
    value === "failure" ||
    value === "neutral" ||
    value === "cancelled" ||
    value === "skipped" ||
    value === "timed_out" ||
    value === "action_required"
  ) {
    return value;
  }
  return null;
}

/** Only conclusion === failure produces a ci_failed signal. */
export function isFailingConclusion(conclusion: CheckRunConclusion): boolean {
  return conclusion === "failure";
}

/**
 * Returns true when the incoming event should replace stored state.
 * Prefers newer updatedAt; if equal/missing, prefers higher status rank then completedAt.
 */
export function shouldApplyCheckRunUpdate(
  existing: {
    status: CheckRunStatus;
    updatedAt: string | null;
    completedAt: string | null;
  } | null,
  incoming: {
    status: CheckRunStatus;
    updatedAt: string | null;
    completedAt: string | null;
  },
): boolean {
  if (!existing) return true;

  const existingUpdated = Date.parse(existing.updatedAt ?? "");
  const incomingUpdated = Date.parse(incoming.updatedAt ?? "");
  if (Number.isFinite(incomingUpdated) && Number.isFinite(existingUpdated)) {
    if (incomingUpdated < existingUpdated) return false;
    if (incomingUpdated > existingUpdated) return true;
  }

  if (STATUS_RANK[incoming.status] < STATUS_RANK[existing.status]) return false;
  if (STATUS_RANK[incoming.status] > STATUS_RANK[existing.status]) return true;

  const existingCompleted = Date.parse(existing.completedAt ?? "");
  const incomingCompleted = Date.parse(incoming.completedAt ?? "");
  if (Number.isFinite(incomingCompleted) && Number.isFinite(existingCompleted)) {
    return incomingCompleted >= existingCompleted;
  }

  return true;
}

export function parseCheckRunPayload(
  checkRun: Record<string, unknown>,
): NormalizedCheckRunInput | null {
  const id = checkRun.id;
  if (typeof id !== "number" || !Number.isFinite(id)) return null;

  const status = normalizeCheckRunStatus(checkRun.status);
  if (!status) return null;

  const name = typeof checkRun.name === "string" ? checkRun.name : "check";
  const headSha =
    typeof checkRun.head_sha === "string"
      ? checkRun.head_sha
      : typeof (checkRun.check_suite as { head_sha?: string } | undefined)?.head_sha ===
          "string"
        ? (checkRun.check_suite as { head_sha: string }).head_sha
        : null;

  const pullRequests = Array.isArray(checkRun.pull_requests)
    ? checkRun.pull_requests
        .map((pr) =>
          typeof pr === "object" &&
          pr &&
          typeof (pr as { number?: unknown }).number === "number"
            ? (pr as { number: number }).number
            : null,
        )
        .filter((n): n is number => n != null)
    : [];

  return {
    githubCheckRunId: id,
    name,
    status,
    conclusion: normalizeCheckRunConclusion(checkRun.conclusion),
    htmlUrl: typeof checkRun.html_url === "string" ? checkRun.html_url : null,
    headSha,
    completedAt: typeof checkRun.completed_at === "string" ? checkRun.completed_at : null,
    updatedAt: typeof checkRun.updated_at === "string" ? checkRun.updated_at : null,
    pullRequestNumbers: pullRequests,
  };
}

/** Latest check per name+headSha wins for signal generation. */
export function latestChecksByNameSha<
  T extends {
    id: string;
    name: string;
    headSha: string | null;
    completedAt: string | null;
    status: CheckRunStatus;
    conclusion: CheckRunConclusion;
  },
>(checks: T[]): T[] {
  const map = new Map<string, T>();
  for (const check of checks) {
    const key = `${check.name}::${check.headSha ?? ""}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, check);
      continue;
    }
    const prevTime = Date.parse(prev.completedAt ?? "") || 0;
    const nextTime = Date.parse(check.completedAt ?? "") || 0;
    if (nextTime >= prevTime) map.set(key, check);
  }
  return [...map.values()];
}
