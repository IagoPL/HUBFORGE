"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  WORKSPACE_STORAGE_KEY,
  createDefaultWorkspaceState,
  createOrganization,
  createProject,
  getActiveOrganization,
  getActiveProject,
  getProjectsForOrganization,
  parseWorkspaceState,
  type WorkspaceState,
} from "@/features/organizations/workspace-state";

type WorkspaceContextValue = {
  state: WorkspaceState;
  activeOrganization: ReturnType<typeof getActiveOrganization>;
  activeProject: ReturnType<typeof getActiveProject>;
  organizationProjects: ReturnType<typeof getProjectsForOrganization>;
  addOrganization: (name: string) => void;
  addProject: (input: { name: string; description: string }) => void;
  setActiveOrganization: (organizationId: string) => void;
  setActiveProject: (projectId: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

let memoryState = createDefaultWorkspaceState();
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  for (const listener of listeners) listener();
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  memoryState = parseWorkspaceState(window.localStorage.getItem(WORKSPACE_STORAGE_KEY));
}

function subscribe(onStoreChange: () => void) {
  ensureHydrated();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot() {
  ensureHydrated();
  return memoryState;
}

const serverSnapshot = createDefaultWorkspaceState();

function getServerSnapshot() {
  return serverSnapshot;
}

function writeState(next: WorkspaceState) {
  memoryState = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addOrganization = useCallback((name: string) => {
    writeState(createOrganization(getSnapshot(), { name }));
  }, []);

  const addProject = useCallback((input: { name: string; description: string }) => {
    const current = getSnapshot();
    const organizationId =
      current.activeOrganizationId || current.organizations[0]?.id || "";
    if (!organizationId) return;
    writeState(createProject(current, { ...input, organizationId }));
  }, []);

  const setActiveOrganization = useCallback((organizationId: string) => {
    const current = getSnapshot();
    const projects = getProjectsForOrganization(current, organizationId);
    writeState({
      ...current,
      activeOrganizationId: organizationId,
      activeProjectId: projects[0]?.id ?? current.activeProjectId,
    });
  }, []);

  const setActiveProject = useCallback((projectId: string) => {
    writeState({ ...getSnapshot(), activeProjectId: projectId });
  }, []);

  const value = useMemo<WorkspaceContextValue>(() => {
    const activeOrganization = getActiveOrganization(state);
    const activeProject = getActiveProject(state);
    return {
      state,
      activeOrganization,
      activeProject,
      organizationProjects: getProjectsForOrganization(
        state,
        activeOrganization?.id ?? "",
      ),
      addOrganization,
      addProject,
      setActiveOrganization,
      setActiveProject,
    };
  }, [state, addOrganization, addProject, setActiveOrganization, setActiveProject]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return value;
}
