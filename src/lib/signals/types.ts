/** Stable operational signal kinds. */
export type SignalKind =
  | "work_blocked"
  | "review_waiting"
  | "ci_failed"
  | "work_stale"
  | "unassigned_critical"
  | "dependency_released"
  | "work_completed"
  | "pull_request_merged"
  | "work_changed";

/** Fact = derived from stored evidence. Inference = calculated by a known rule. */
export type SignalClassification = "fact" | "inference";

export type SignalSeverity = "high" | "medium" | "low";

export type SignalSource = "github" | "hubforge" | "demo";

export type SubjectType =
  "task" | "pull_request" | "issue" | "check_run" | "dependency" | "member";

export type WorkPriority = "low" | "medium" | "high";

export type WorkStatus = "backlog" | "ready" | "in_progress" | "review" | "done";

/** Rule id that produced the signal — never opaque. */
export type EvidenceRuleId =
  | "rule.dependency_unresolved"
  | "rule.pull_request_awaiting_review"
  | "rule.check_run_failed"
  | "rule.work_stale_threshold"
  | "rule.unassigned_high_priority"
  | "rule.dependency_released"
  | "rule.work_completed"
  | "rule.pull_request_merged"
  | "rule.work_changed_since_visit"
  | "rule.assignee_unavailable"
  | "rule.critical_without_available_owner";

export type OperationalSignal = {
  id: string;
  kind: SignalKind;
  source: SignalSource;
  evidenceType: EvidenceRuleId;
  projectId: string;
  repositoryId: string | null;
  subjectId: string;
  subjectType: SubjectType;
  headline: string;
  explanation: string;
  occurredAt: string;
  severity: SignalSeverity;
  /** 0–1; independent of classification. */
  confidence: number;
  classification: SignalClassification;
  actorId: string | null;
  assigneeIds: string[];
  blockedCount: number;
  recommendedAction: string;
  /** Only validated absolute http(s) URLs, or null. */
  sourceUrl: string | null;
  metadata: Record<string, unknown>;
};

export type PrioritizedSignal = OperationalSignal & {
  priorityScore: number;
  priorityReason: string;
};

export type NormalizedTask = {
  id: string;
  title: string;
  status: WorkStatus;
  priority: WorkPriority;
  assigneeIds: string[];
  updatedAt: string | null;
  createdAt: string | null;
};

export type NormalizedDependency = {
  taskId: string;
  dependsOnTaskId: string;
  createdAt: string | null;
};

export type NormalizedEvent = {
  taskId: string;
  kind: string;
  summary: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  actorId: string | null;
};

export type NormalizedPullRequest = {
  id: string;
  number: number;
  title: string;
  state: "open" | "closed";
  merged: boolean;
  htmlUrl: string;
  authorLogin: string;
  updatedAt: string | null;
  mergedAt: string | null;
};

export type NormalizedIssue = {
  id: string;
  number: number;
  title: string;
  state: "open" | "closed";
  htmlUrl: string;
  taskId: string | null;
  updatedAt: string | null;
};

export type NormalizedCommit = {
  id: string;
  sha: string;
  message: string;
  htmlUrl: string;
  committedAt: string | null;
};

export type NormalizedCheckRun = {
  id: string;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  htmlUrl: string | null;
  completedAt: string | null;
  pullRequestId: string | null;
  headSha: string | null;
};

export type NormalizedMember = {
  id: string;
  name: string;
  functionalRole: string | null;
};

export type NormalizedAvailability = {
  memberId: string;
  startsAt: string;
  endsAt: string;
  kind: "available" | "busy" | "unavailable";
};

export type SignalEngineConfig = {
  /** Days without meaningful activity before work_stale (inference). */
  staleDaysThreshold: number;
  /** ISO "now" for deterministic tests. */
  now: string;
  /** Demo mode marks source and relaxes URL validation to demo:// refs in metadata only. */
  demo: boolean;
};

export type EvidenceBundle = {
  projectId: string;
  repositoryId: string | null;
  lastVisitAt: string | null;
  tasks: NormalizedTask[];
  dependencies: NormalizedDependency[];
  events: NormalizedEvent[];
  pullRequests: NormalizedPullRequest[];
  issues: NormalizedIssue[];
  commits: NormalizedCommit[];
  checkRuns: NormalizedCheckRun[];
  members: NormalizedMember[];
  availability: NormalizedAvailability[];
  config: SignalEngineConfig;
};

export type BriefingPartition = {
  /** Signals that occurred after lastVisitAt (or first-visit baseline). */
  sinceLastVisit: PrioritizedSignal[];
  /** Open problems that still need attention (may predate the visit). */
  persistentAttention: PrioritizedSignal[];
  firstVisit: boolean;
  lastVisitAt: string | null;
};

export const DEFAULT_STALE_DAYS = 5;
