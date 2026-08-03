"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createOrganizationAction,
  createProjectAction,
  deleteOrganizationAction,
  deleteProjectAction,
  updateProjectStatusAction,
} from "@/features/organizations/actions";
import {
  getActiveOrganization,
  getActiveProject,
  getProjectsForOrganization,
  type WorkspaceState,
} from "@/features/organizations/workspace-state";
import type { Project } from "@/lib/domain/types";

const PREFS_STORAGE_KEY = "hubforge.workspace.prefs.v1";

type WorkspaceContextValue = {
  state: WorkspaceState;
  activeOrganization: ReturnType<typeof getActiveOrganization>;
  activeProject: ReturnType<typeof getActiveProject>;
  organizationProjects: ReturnType<typeof getProjectsForOrganization>;
  pending: boolean;
  error: string | null;
  addOrganization: (name: string) => Promise<void>;
  addProject: (input: { name: string; description: string }) => Promise<void>;
  setProjectStatus: (projectId: string, status: Project["status"]) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
  removeOrganization: (organizationId: string) => Promise<void>;
  setActiveOrganization: (organizationId: string) => void;
  setActiveProject: (projectId: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

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

export function WorkspaceProvider({
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

  const setProjectStatus = useCallback(
    async (projectId: string, status: Project["status"]) => {
      setPending(true);
      setError(null);
      const result = await updateProjectStatusAction({ projectId, status });
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setState((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === result.data.id ? result.data : project,
        ),
      }));
    },
    [],
  );

  const removeProject = useCallback(async (projectId: string) => {
    setPending(true);
    setError(null);
    const result = await deleteProjectAction(projectId);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setState((current) => {
      const projects = current.projects.filter((project) => project.id !== projectId);
      const organizationId = current.activeOrganizationId;
      const remaining = projects.filter(
        (project) => project.organizationId === organizationId,
      );
      const next = {
        ...current,
        projects,
        activeProjectId:
          current.activeProjectId === projectId
            ? (remaining[0]?.id ?? "")
            : current.activeProjectId,
      };
      writePrefs(next.activeOrganizationId, next.activeProjectId);
      return next;
    });
  }, []);

  const removeOrganization = useCallback(async (organizationId: string) => {
    setPending(true);
    setError(null);
    const result = await deleteOrganizationAction(organizationId);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setState((current) => {
      const organizations = current.organizations.filter(
        (organization) => organization.id !== organizationId,
      );
      const projects = current.projects.filter(
        (project) => project.organizationId !== organizationId,
      );
      const nextOrganizationId =
        current.activeOrganizationId === organizationId
          ? (organizations[0]?.id ?? "")
          : current.activeOrganizationId;
      const remaining = projects.filter(
        (project) => project.organizationId === nextOrganizationId,
      );
      const next = {
        ...current,
        organizations,
        projects,
        activeOrganizationId: nextOrganizationId,
        activeProjectId:
          current.activeOrganizationId === organizationId
            ? (remaining[0]?.id ?? "")
            : current.activeProjectId,
      };
      writePrefs(next.activeOrganizationId, next.activeProjectId);
      return next;
    });
  }, []);

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
      setProjectStatus,
      removeProject,
      removeOrganization,
      setActiveOrganization,
      setActiveProject,
    };
  }, [
    state,
    pending,
    error,
    addOrganization,
    addProject,
    setProjectStatus,
    removeProject,
    removeOrganization,
    setActiveOrganization,
    setActiveProject,
  ]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return value;
}
