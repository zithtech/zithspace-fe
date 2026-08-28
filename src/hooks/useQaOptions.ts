"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useBugPriorityOptions,
  useBugSeverityOptions,
  useBugTypeOptions,
} from "@/hooks/useBugList";
import { api } from "@/lib/axios";

export interface QaSelectOption {
  value: string;
  label: string;
  description?: string;
}

/**
 * Dropdown options shared across the QA workspace, driven by QA Settings
 * (/qa-workspace/settings) rather than hardcoded per page.
 *
 * Values are the option *labels* — QA records store the display text, unlike
 * bugs which store the slug — so existing test cases keep matching.
 * Inactive options are filtered out, and each list falls back to a sensible
 * default set when the tenant has none configured yet.
 */
const toOptions = (
  rows: any[] | undefined,
  fallback: string[],
): QaSelectOption[] => {
  const active = (rows || []).filter((o: any) => o?.isActive !== false);
  if (active.length === 0) return fallback.map(v => ({ value: v, label: v }));
  return active.map((o: any) => ({
    value: o.label,
    label: o.label,
    description: o.description || undefined,
  }));
};

export function useQaOptions() {
  const priorities = useBugPriorityOptions();
  const severities = useBugSeverityOptions();
  const types = useBugTypeOptions();

  const priorityOptions = useMemo(
    () => toOptions(priorities.data, ["Critical", "High", "Medium", "Low"]),
    [priorities.data],
  );

  const severityOptions = useMemo(
    () => toOptions(severities.data, ["Blocker", "Critical", "Major", "Minor"]),
    [severities.data],
  );

  const testTypeOptions = useMemo(
    () => toOptions(types.data, ["Functional", "UI", "API"]),
    [types.data],
  );

  /** The option flagged as default in settings, for pre-filling new records. */
  const defaultOf = (rows: any[] | undefined, fallback: string) =>
    (rows || []).find((o: any) => o?.isDefault && o?.isActive !== false)?.label || fallback;

  /**
   * QA stores labels, bugs store slugs — resolve a label back to its configured
   * key so a bug raised from a test case lands on the right option.
   *
   * Returns undefined rather than guessing when the value can't be resolved
   * against the tenant's own options: the server rejects unknown keys, and
   * these fields are optional, so omitting beats sending something invalid.
   */
  const keyFor = (rows: any[] | undefined, label: string | undefined): string | undefined => {
    const active = (rows || []).filter((o: any) => o?.isActive !== false);
    if (active.length === 0) return undefined; // not loaded, or none configured

    const v = (label || "").trim().toLowerCase();
    const match = v
      ? active.find((o: any) => o?.label?.toLowerCase() === v || o?.key?.toLowerCase() === v)
      : undefined;
    if (match) return match.key;

    return active.find((o: any) => o?.isDefault)?.key;
  };

  return {
    priorityOptions,
    severityOptions,
    testTypeOptions,
    defaultPriority: defaultOf(priorities.data, "Medium"),
    defaultSeverity: defaultOf(severities.data, "Major"),
    defaultTestType: defaultOf(types.data, "Functional"),
    toSeverityKey: (label?: string) => keyFor(severities.data, label),
    toBugTypeKey: (label?: string) => keyFor(types.data, label),
    isLoading: priorities.isLoading || severities.isLoading || types.isLoading,
  };
}

/**
 * The QA module list — the single taxonomy bugs, scopes and test cases are all
 * filed under, curated in QA Space → Settings → Modules.
 *
 * Modules belong to a project, so a project only sees its own. Modules added
 * before projects were required carry no project yet and stay selectable
 * everywhere rather than vanishing from every dropdown at once.
 *
 * A viewer without the grant simply gets an empty list — the field is optional
 * on every form that uses it.
 */
export function useProjectQaModules(projectId?: string | null) {
  const query = useQuery({
    queryKey: ["qa-modules"],
    queryFn: async () => {
      const res: any = await api.get("/api/v2/qa/modules?limit=1000").catch(() => []);
      const rows = Array.isArray(res) ? res : (res?.data ?? []);
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const modules = useMemo(
    () => (query.data || []).filter((m: any) => !m.project_id || String(m.project_id) === String(projectId ?? "")),
    [query.data, projectId],
  );

  const options: QaSelectOption[] = useMemo(
    () =>
      modules
        .map((m: any) => ({
          value: String(m.module_name || m.name || ""),
          label: String(m.module_name || m.name || ""),
          description: m.description || undefined,
        }))
        .filter((o: QaSelectOption) => o.value)
        .sort((a: QaSelectOption, b: QaSelectOption) => a.label.localeCompare(b.label)),
    [modules],
  );

  return { modules, options, isLoading: query.isLoading, refetch: query.refetch };
}
