"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createOrganizationAction,
  createProjectAction,
} from "@/features/organizations/actions";
import type { WorkspaceMode } from "@/features/organizations/get-workspace";
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

const PREFS_STORAGE_KEY = "hubforge.workspace.prefs.v1";

type WorkspaceContextValue = {
  mode: WorkspaceMode;
  state: WorkspaceState;
  activeOrganization: ReturnType<typeof getActiveOrganization>;
  activeProject: ReturnType<typeof getActiveProject>;
  organizationProjects: ReturnType<typeof getProjectsForOrganization>;
  pending: boolean;
  error: string | null;
  addOrganization: (name: string) => Promise<void>;
  addProject: (input: { name: string; description: string }) => Promise<void>;
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

function writeDemoState(next: WorkspaceState) {
  memoryState = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

function writePrefs(organizationId: string, projectId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PREFS_STORAGE_KEY,
    JSON.stringify({
      activeOrganizationId: organizationId,
      activeProjectId: projectId,
    }),
  );
}

function DemoWorkspaceProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addOrganization = useCallback(async (name: string) => {
    writeDemoState(createOrganization(getSnapshot(), { name }));
  }, []);

  const addProject = useCallback(async (input: { name: string; description: string }) => {
    const current = getSnapshot();
    const organizationId =
      current.activeOrganizationId || current.organizations[0]?.id || "";
    if (!organizationId) return;
    writeDemoState(createProject(current, { ...input, organizationId }));
  }, []);

  const setActiveOrganization = useCallback((organizationId: string) => {
    const current = getSnapshot();
    const projects = getProjectsForOrganization(current, organizationId);
    writeDemoState({
      ...current,
      activeOrganizationId: organizationId,
      activeProjectId: projects[0]?.id ?? current.activeProjectId,
    });
  }, []);

  const setActiveProject = useCallback((projectId: string) => {
    writeDemoState({ ...getSnapshot(), activeProjectId: projectId });
  }, []);

  const value = useMemo<WorkspaceContextValue>(() => {
    const activeOrganization = getActiveOrganization(state);
    const activeProject = getActiveProject(state);
    return {
      mode: "demo",
      state,
      activeOrganization,
      activeProject,
      organizationProjects: getProjectsForOrganization(
        state,
        activeOrganization?.id ?? "",
      ),
      pending: false,
      error: null,
      addOrganization,
      addProject,
      setActiveOrganization,
      setActiveProject,
    };
  }, [state, addOrganization, addProject, setActiveOrganization, setActiveProject]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

function LiveWorkspaceProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: WorkspaceState;
}) {
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOrganization = useCallback(async (name: string) => {
    setPending(true);
    setError(null);
    const result = await createOrganizationAction(name);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setState((current) => ({
      ...current,
      organizations: [...current.organizations, result.data],
      activeOrganizationId: result.data.id,
    }));
    writePrefs(result.data.id, "");
  }, []);

  const addProject = useCallback(
    async (input: { name: string; description: string }) => {
      setPending(true);
      setError(null);
      const organizationId =
        state.activeOrganizationId || state.organizations[0]?.id || "";
      const result = await createProjectAction({ ...input, organizationId });
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setState((current) => ({
        ...current,
        projects: [...current.projects, result.data],
        activeOrganizationId: result.data.organizationId,
        activeProjectId: result.data.id,
      }));
      writePrefs(result.data.organizationId, result.data.id);
    },
    [state.activeOrganizationId, state.organizations],
  );

  const setActiveOrganization = useCallback((organizationId: string) => {
    setState((current) => {
      const projects = getProjectsForOrganization(current, organizationId);
      const next = {
        ...current,
        activeOrganizationId: organizationId,
        activeProjectId: projects[0]?.id ?? "",
      };
      writePrefs(next.activeOrganizationId, next.activeProjectId);
      return next;
    });
  }, []);

  const setActiveProject = useCallback((projectId: string) => {
    setState((current) => {
      const next = { ...current, activeProjectId: projectId };
      writePrefs(next.activeOrganizationId, next.activeProjectId);
      return next;
    });
  }, []);

  const value = useMemo<WorkspaceContextValue>(() => {
    const activeOrganization = getActiveOrganization(state);
    const activeProject = getActiveProject(state);
    return {
      mode: "live",
      state,
      activeOrganization,
      activeProject,
      organizationProjects: getProjectsForOrganization(
        state,
        activeOrganization?.id ?? "",
      ),
      pending,
      error,
      addOrganization,
      addProject,
      setActiveOrganization,
      setActiveProject,
    };
  }, [
    state,
    pending,
    error,
    addOrganization,
    addProject,
    setActiveOrganization,
    setActiveProject,
  ]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function WorkspaceProvider({
  children,
  mode = "demo",
  initialState,
}: {
  children: ReactNode;
  mode?: WorkspaceMode;
  initialState?: WorkspaceState;
}) {
  if (mode === "live" && initialState) {
    return (
      <LiveWorkspaceProvider initialState={initialState}>
        {children}
      </LiveWorkspaceProvider>
    );
  }

  return <DemoWorkspaceProvider>{children}</DemoWorkspaceProvider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return value;
}
