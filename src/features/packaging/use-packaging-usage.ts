"use client";

import { useEffect, useState } from "react";
import { getPackagingUsageAction } from "@/features/packaging/actions";
import type { PackagingUsage } from "@/lib/packaging/limits";

export function usePackagingUsage(organizationId?: string | null, refreshKey = 0) {
  const [usage, setUsage] = useState<PackagingUsage | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getPackagingUsageAction(organizationId).then((result) => {
      if (cancelled || !result.ok) return;
      setUsage(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, refreshKey]);

  return usage;
}
