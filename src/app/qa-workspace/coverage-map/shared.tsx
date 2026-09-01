"use client";
import { message } from "@/providers/AntdGlobalProvider";


/**
 * Shared machinery for the Coverage Map and its module pages.
 *
 * Both pages answer the same question — what does this project actually cover?
 * — at different depths, so the fetching, the module rollup and the small
 * presentational pieces live here and are read from both.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tooltip } from "antd";
import dayjs from "dayjs";

import { api as axios, apiClient } from "@/lib/axios";
import { ProjectService } from "@/services/projectService";

export const norm = (s: any) => String(s ?? "").trim().toLowerCase();

export const fmtDate = (d?: string | null) => {
  if (!d) return null;
  const p = dayjs(d);
  return p.isValid() ? p.format("D MMM YYYY") : null;
};

export const fmtDateTime = (d?: string | null) => {
  if (!d) return null;
  const p = dayjs(d);
  return p.isValid() ? p.format("D MMM YYYY, h:mm A") : null;
};

/** "3 days ago" for anything recent, an absolute date once it stops mattering. */
export const fmtAgo = (d?: string | null) => {
  if (!d) return "No activity";
  const p = dayjs(d);
  if (!p.isValid()) return "No activity";
  const days = dayjs().diff(p, "day");
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return p.format("D MMM YYYY");
};

export function initialsOf(name: string) {
  const parts = String(name || "").split(/[\s_-]+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(name || "M").slice(0, 2).toUpperCase();
}

/** Newest of a set of timestamps, ignoring the empty ones. */
export const latest = (...dates: (string | null | undefined)[]) => {
  const valid = dates.filter(Boolean).map(d => dayjs(d as string)).filter(d => d.isValid());
  if (!valid.length) return null;
  return valid.reduce((a, b) => (b.isAfter(a) ? b : a)).toISOString();
};

export const statusTone = (s?: string) =>
  s === "Approved" || s === "Active" || s === "Completed" || s === "Pass" ? "green"
    : s === "Rejected" || s === "Deprecated" || s === "Fail" ? "red"
      : s === "Draft" || s === "Blocked" ? "ash" : "blue";

export interface ModuleNode {
  key: string;
  name: string;
  /** Named on a record but absent from the module list — created ad hoc. */
  adhoc: boolean;
  /** The catch-all bucket for records filed without a module. */
  unassigned: boolean;
  scopes: any[];
  cases: any[];
  suites: any[];
  runs: any[];
  childCases: number;
  passed: number;
  failed: number;
  blocked: number;
  notExecuted: number;
  lastActivity: string | null;
}

const emptyNode = (key: string, name: string, opts: Partial<ModuleNode> = {}): ModuleNode => ({
  key, name, adhoc: false, unassigned: false,
  scopes: [], cases: [], suites: [], runs: [],
  childCases: 0, passed: 0, failed: 0, blocked: 0, notExecuted: 0,
  lastActivity: null,
  ...opts,
});

export interface CoverageSource {
  modules: any[];
  scopes: any[];
  cases: any[];
  suites: any[];
  runs: any[];
}

/**
 * Rolls the five lists up per module.
 *
 * Scenarios carry a module id; suites use their own or inherit their scenario's;
 * runs reach a module through their suite. Scopes are the odd one out — they
 * name modules as free text — so they are matched on name, and anything that
 * matches nothing becomes its own row rather than disappearing.
 */
export function buildModuleNodes({ modules, scopes, cases, suites, runs }: CoverageSource): ModuleNode[] {
  const byKey = new Map<string, ModuleNode>();
  /** Module id and lowercased name both resolve to the same node. */
  const byAlias = new Map<string, string>();

  modules.forEach((m: any) => {
    const key = String(m.id);
    byKey.set(key, emptyNode(key, String(m.module_name || "Unnamed module")));
    byAlias.set(key, key);
    byAlias.set(norm(m.module_name), key);
  });

  const bucket = (alias?: string | null, fallbackName?: string) => {
    const hit = alias ? byAlias.get(norm(alias)) ?? byAlias.get(String(alias)) : undefined;
    if (hit) return byKey.get(hit)!;
    if (!alias) {
      if (!byKey.has("__unassigned")) {
        byKey.set("__unassigned", emptyNode("__unassigned", "Unassigned", { unassigned: true }));
      }
      return byKey.get("__unassigned")!;
    }
    const adhocKey = `__adhoc:${norm(alias)}`;
    if (!byKey.has(adhocKey)) {
      byKey.set(adhocKey, emptyNode(adhocKey, fallbackName || String(alias), { adhoc: true }));
      byAlias.set(norm(alias), adhocKey);
      if (fallbackName) byAlias.set(norm(fallbackName), adhocKey);
    }
    return byKey.get(adhocKey)!;
  };

  const caseById = new Map<string, any>();
  cases.forEach((c: any) => {
    caseById.set(String(c.id), c);
    const node = bucket(c.module_id ? String(c.module_id) : null, c.module_name);
    node.cases.push(c);
    node.childCases += Number(c.child_count || 0);
    node.lastActivity = latest(node.lastActivity, c.updated_at, c.created_at);
  });

  const suiteNode = new Map<string, ModuleNode>();
  suites.forEach((s: any) => {
    const parent = s.parent_test_case_id ? caseById.get(String(s.parent_test_case_id)) : null;
    const alias = s.module_id ? String(s.module_id) : (parent?.module_id ? String(parent.module_id) : null);
    const node = bucket(alias, s.module_name);
    node.suites.push(s);
    suiteNode.set(String(s.id), node);
    node.lastActivity = latest(node.lastActivity, s.updated_at, s.created_at);
  });

  runs.forEach((r: any) => {
    const node = r.suite_id ? suiteNode.get(String(r.suite_id)) : undefined;
    const target = node ?? bucket(null);
    target.runs.push(r);
    target.passed += Number(r.passed_count || 0);
    target.failed += Number(r.failed_count || 0);
    target.blocked += Number(r.blocked_count || 0);
    target.notExecuted += Number(r.not_executed_count || 0);
    target.lastActivity = latest(target.lastActivity, r.updated_at, r.started_at, r.created_at);
  });

  scopes.forEach((sc: any) => {
    const named: string[] = Array.isArray(sc?.details?.modules) ? sc.details.modules.filter(Boolean) : [];
    const targets = named.length ? named.map(n => bucket(n, n)) : [bucket(null)];
    new Set(targets).forEach(node => {
      node.scopes.push(sc);
      node.lastActivity = latest(node.lastActivity, sc.updated_at, sc.created_at);
    });
  });

  return Array.from(byKey.values());
}

export interface ProjectOption { value: string; label: string }

/** Active projects the signed-in user belongs to. */
export function useUserProjects() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ProjectService.getUserProjects(true)
      .then((res: any) => {
        if (cancelled) return;
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        setProjects(
          list
            .map((p: any) => ({ value: String(p.value ?? p.id ?? ""), label: String(p.label ?? p.name ?? "") }))
            .filter(p => p.value && p.label),
        );
      })
      .catch(() => { /* the rail shows the empty state */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { projects, loading };
}

interface CoveragePerms {
  canReadScope: boolean;
  canReadCase: boolean;
  canReadSuite: boolean;
  canReadRun: boolean;
}

const listOf = (res: any) => {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

/**
 * One project's scopes, scenarios, suites and runs. Composed from the existing
 * list endpoints so the map shows exactly what the rest of the workspace shows.
 */
export function useCoverageData(
  projects: ProjectOption[],
  projectId: string | undefined,
  perms: CoveragePerms,
  ready: boolean,
) {
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<CoverageSource>({ modules: [], scopes: [], cases: [], suites: [], runs: [] });

  const project = projects.find(p => p.value === projectId);

  const refetch = useCallback(async () => {
    setLoading(true);
    const allIds = projects.map(p => p.value).join(",");
    const allLabels = projects.map(p => p.label).join(",");
    const scoped = projectId ? { project_id: projectId } : {};
    try {
      const [modRes, scopeRes, caseRes, suiteRes, runRes] = await Promise.all([
        axios.get("/api/v2/qa/modules?limit=1000").catch(() => []),
        perms.canReadScope
          ? apiClient.get("/api/v2/qa/test-scopes", {
              params: {
                pageSize: 1000,
                ...(project ? { product: project.label } : {}),
                ...(allLabels ? { allowed_products: allLabels } : {}),
              },
            }).catch(() => null)
          : Promise.resolve(null),
        perms.canReadCase
          ? apiClient.get("/api/v2/qa/parents", {
              params: { pageSize: 1000, ...scoped, ...(allIds ? { allowed_projects: allIds } : {}) },
            }).catch(() => null)
          : Promise.resolve(null),
        perms.canReadSuite
          ? apiClient.get("/api/v2/qa/suites/all", {
              params: { pageSize: 1000, ...scoped, ...(allIds ? { allowed_projects: allIds } : {}) },
            }).catch(() => null)
          : Promise.resolve(null),
        perms.canReadRun
          ? apiClient.get("/api/v2/qa/runs/all", {
              params: { pageSize: 1000, ...scoped, ...(allIds ? { allowed_projects: allIds } : {}) },
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

      setSource({
        modules: Array.isArray(modRes) ? modRes : ((modRes as any)?.data ?? []),
        scopes: listOf(scopeRes),
        cases: listOf(caseRes),
        suites: listOf(suiteRes),
        runs: listOf(runRes),
      });
    } catch {
      message.error("Failed to build the coverage map");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, projectId, perms.canReadScope, perms.canReadCase, perms.canReadSuite, perms.canReadRun]);

  useEffect(() => {
    if (!ready) return;
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, projectId, projects.length]);

  const nodes = useMemo(() => buildModuleNodes(source), [source]);

  return { loading, source, nodes, refetch, project };
}

/* ── Shared presentational pieces ────────────────────────────────────────── */

export const Kpi = ({ icon: Icon, label, value, sub, tone = "blue" }: {
  icon: any; label: string; value: React.ReactNode; sub?: string; tone?: "blue" | "green" | "ash" | "red";
}) => (
  <div className={`cm-kpi cm-kpi--${tone}`}>
    <div className="cm-kpi__top">
      <span className="cm-kpi__ic"><Icon size={14} /></span>
      <span className="cm-kpi__label">{label}</span>
    </div>
    <div className="cm-kpi__value">{value}</div>
    {sub ? <div className="cm-kpi__sub">{sub}</div> : null}
  </div>
);

export const Metric = ({ icon: Icon, n, noun, muted }: { icon: any; n: number; noun: string; muted?: boolean }) => (
  <Tooltip title={`${n} ${noun}`}>
    <span className={`cm-metric${muted || n === 0 ? " is-empty" : ""}`}>
      <Icon size={13} />
      <b>{n}</b>
      <span className="cm-metric__noun">{noun}</span>
    </span>
  </Tooltip>
);

/** Executed results as one bar — pass / fail / blocked / not run. */
export const ResultBar = ({ passed, failed, blocked, notExecuted }: {
  passed: number; failed: number; blocked: number; notExecuted: number;
}) => {
  const total = passed + failed + blocked + notExecuted;
  if (!total) return <div className="cm-bar is-empty"><span className="cm-bar__none">No results recorded</span></div>;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <Tooltip title={`${passed} passed · ${failed} failed · ${blocked} blocked · ${notExecuted} not run`}>
      <div className="cm-bar">
        {passed > 0 && <span className="cm-bar__seg is-pass" style={{ width: pct(passed) }} />}
        {failed > 0 && <span className="cm-bar__seg is-fail" style={{ width: pct(failed) }} />}
        {blocked > 0 && <span className="cm-bar__seg is-block" style={{ width: pct(blocked) }} />}
        {notExecuted > 0 && <span className="cm-bar__seg is-todo" style={{ width: pct(notExecuted) }} />}
      </div>
    </Tooltip>
  );
};
