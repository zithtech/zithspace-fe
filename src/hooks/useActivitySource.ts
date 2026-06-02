"use client";

import { useEffect } from "react";

/**
 * Pages call this to tell the BE which UX context any mutations done while
 * the page is mounted should be filed under in the activity log. The values
 * are sent as `x-zspace-section / x-zspace-module / x-zspace-page` headers
 * by an axios interceptor (see lib/axios.ts) and override whatever the
 * controller declared at the call site.
 *
 * Use it on pages where the FE view doesn't match the BE endpoint's default
 * categorisation — e.g. /projects/archived calls /api/trash/move, which the
 * BE would otherwise log under Module=Trash / Page=TrashView.
 *
 * Example:
 *   useActivitySource({ section: "WORK", module: "Archived", page: "ArchivedView" });
 */
export interface ActivitySource {
  section?: string;
  module?: string;
  page?: string;
}

let current: ActivitySource | null = null;

export function getActivitySource(): ActivitySource | null {
  return current;
}

export function useActivitySource(source: ActivitySource) {
  const key = `${source.section ?? ""}|${source.module ?? ""}|${source.page ?? ""}`;
  useEffect(() => {
    current = source;
    return () => {
      // Only clear if we still own it (a child route may have set its own)
      if (
        current?.section === source.section &&
        current?.module === source.module &&
        current?.page === source.page
      ) {
        current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
