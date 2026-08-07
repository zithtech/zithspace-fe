"use client";

import { useMemo } from "react";
import {
  useBugPriorityOptions,
  useBugSeverityOptions,
  useBugTypeOptions,
} from "@/hooks/useBugList";

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
