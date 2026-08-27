import { createSignalEngineConfig } from "@/lib/signals/config";
import type {
  EvidenceBundle,
  NormalizedAvailability,
  NormalizedCheckRun,
  NormalizedCommit,
  NormalizedDependency,
  NormalizedEvent,
  NormalizedIssue,
  NormalizedMember,
  NormalizedPullRequest,
  NormalizedTask,
  SignalEngineConfig,
} from "@/lib/signals/types";

/** Assemble a typed evidence bundle for the pure signal engine. */
export function buildEvidenceBundle(input: {
  projectId: string;
  repositoryId?: string | null;
  lastVisitAt?: string | null;
  tasks: NormalizedTask[];
  dependencies?: NormalizedDependency[];
  events?: NormalizedEvent[];
  pullRequests?: NormalizedPullRequest[];
  issues?: NormalizedIssue[];
  commits?: NormalizedCommit[];
  checkRuns?: NormalizedCheckRun[];
  members?: NormalizedMember[];
  availability?: NormalizedAvailability[];
  config?: Partial<SignalEngineConfig>;
}): EvidenceBundle {
  return {
    projectId: input.projectId,
    repositoryId: input.repositoryId ?? null,
    lastVisitAt: input.lastVisitAt ?? null,
    tasks: input.tasks,
    dependencies: input.dependencies ?? [],
    events: input.events ?? [],
    pullRequests: input.pullRequests ?? [],
    issues: input.issues ?? [],
    commits: input.commits ?? [],
    checkRuns: input.checkRuns ?? [],
    members: input.members ?? [],
    availability: input.availability ?? [],
    config: createSignalEngineConfig(input.config),
  };
}
