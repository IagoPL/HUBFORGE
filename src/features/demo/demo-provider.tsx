"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getNorthlightAuroraDemo } from "@/features/demo/northlight-aurora";
import type { DemoWorkspace } from "@/features/demo/types";

const DemoContext = createContext<DemoWorkspace | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const workspace = getNorthlightAuroraDemo();
  return <DemoContext.Provider value={workspace}>{children}</DemoContext.Provider>;
}

export function useDemoWorkspace() {
  const value = useContext(DemoContext);
  if (!value) {
    throw new Error("useDemoWorkspace requires DemoProvider");
  }
  return value;
}

export function useOptionalDemoWorkspace() {
  return useContext(DemoContext);
}
