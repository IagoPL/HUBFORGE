export type DemoSignalKind = "fact" | "inference";

export type DemoSignalType =
  | "work_blocked"
  | "review_waiting"
  | "ci_failed"
  | "work_stale"
  | "unassigned_critical"
  | "completed_since_visit"
  | "dependency_impact";

export type DemoMember = {
  id: string;
  name: string;
  functionalRole: string;
  availableThisWeek: boolean;
};

export type DemoWorkItem = {
  id: string;
  title: string;
  status: "backlog" | "ready" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assigneeId: string | null;
  dependsOn: string[];
  blocks: string[];
  completedSinceVisit: boolean;
  staleDays: number | null;
};

export type DemoSignal = {
  id: string;
  type: DemoSignalType;
  kind: DemoSignalKind;
  severity: "high" | "medium" | "low";
  title: string;
  evidence: string;
  whyItMatters: string;
  recommendedAction: string;
  occurredAt: string;
  assigneeLabel: string;
  originLabel: string;
  /** Simulated GitHub path — never a live URL. */
  originRef: string;
  subjectWorkId: string | null;
};

export type DemoDependencyEdge = {
  id: string;
  blockedId: string;
  blockerId: string;
  blockedTitle: string;
  blockerTitle: string;
  affectedCount: number;
  assigneeLabel: string;
  status: string;
  blockedForDays: number;
  evidence: string;
};

export type DemoWorkspace = {
  mode: "demo";
  organizationName: string;
  projectName: string;
  lastVisitAt: string;
  members: DemoMember[];
  work: DemoWorkItem[];
  signals: DemoSignal[];
  dependencies: DemoDependencyEdge[];
  briefingFacts: string[];
};
