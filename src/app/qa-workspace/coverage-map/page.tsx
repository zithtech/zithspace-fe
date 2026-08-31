"use client";

/**
 * Coverage Map — one project's QA footprint, module by module.
 *
 * Every other QA Space page answers "what is in this list?". This one answers
 * "what does this project actually cover?": for each module, the scopes that
 * planned it, the scenarios and cases written for it, the suites assembled from
 * them, and the runs executed against those suites. Opening a module takes you
 * to its own page for the end-to-end detail.
 */

import React, { useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { QaProjectSwitcher } from "@/components/qa/QaProjectGate";
import { Button, Input, Tooltip, Space, Segmented, Divider } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { RotateCw, Boxes, Target, Layers, PlayCircle, ClipboardList, AlertTriangle, ArrowUpRight, Sparkles } from "lucide-react";
import dayjs from "dayjs";

import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useActivitySource } from "@/hooks/useActivitySource";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { useDebounce } from "@/hooks/useDebounce";
import { Metric, ResultBar, fmtAgo, fmtDate, initialsOf, norm,
  useCoverageData, useUserProjects, type ModuleNode,
} from "./shared";

/** How many projects the rail lists before "Show more". */
const SORTS = [
  { value: "activity", label: "Recent activity" },
  { value: "coverage", label: "Least covered" },
  { value: "name", label: "Module name" },
] as const;
type SortKey = (typeof SORTS)[number]["value"];

type HealthBand = "green" | "blue" | "orange" | "red" | "none";

const HEALTH_LABEL: Record<HealthBand, string> = {
  green: "Healthy",
  blue: "Steady",
  orange: "Watch",
  red: "At risk",
  none: "Not run",
};

/** The bands the workspace reads a module's health by. */
const HEALTH_LEGEND: { band: HealthBand; label: string }[] = [
  { band: "green", label: "90%+" },
  { band: "blue", label: "80–89%" },
  { band: "orange", label: "70–79%" },
  { band: "red", label: "Below 70%" },
  { band: "none", label: "Not run" },
];

const runDate = (r: any) => r?.started_at || r?.created_at || null;

/**
 * A module's health is how its *latest* run went, not its lifetime average —
 * an old green streak shouldn't hide a run that just went red.
 */
function healthOf(node: ModuleNode): { band: HealthBand; rate: number | null; run: any | null } {
  const latest = node.runs
    .slice()
    .sort((a: any, b: any) => dayjs(runDate(b) || 0).valueOf() - dayjs(runDate(a) || 0).valueOf())[0];
  if (!latest) return { band: "none", rate: null, run: null };

  const passed = Number(latest.passed_count || 0);
  const failed = Number(latest.failed_count || 0);
  const blocked = Number(latest.blocked_count || 0);
  const executed = passed + failed + blocked;
  if (!executed) return { band: "none", rate: null, run: latest };

  const rate = Math.round((passed / executed) * 100);
  const band: HealthBand = rate >= 90 ? "green" : rate >= 80 ? "blue" : rate >= 70 ? "orange" : "red";
  return { band, rate, run: latest };
}

export default function CoverageMapPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "CoverageMap" });

  const router = useRouter();
  const { canReadScope, canReadCase, canReadSuite, canReadRun } = usePermission();

  const [projectId, setProjectId] = useState<string | undefined>();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [sortKey, setSortKey] = useState<SortKey>("activity");
  const [gapsOnly, setGapsOnly] = useState(false);
  const [bandFilter, setBandFilter] = useState<HealthBand | null>(null);

  const { projects, loading: loadingProjects } = useUserProjects();

  // The map is read per project, so land on one rather than on nothing.
  React.useEffect(() => {
    if (!projectId && projects.length) setProjectId(projects[0].value);
  }, [projects, projectId]);

  const { loading, source, nodes, refetch, project } = useCoverageData(
    projects,
    projectId,
    { canReadScope, canReadCase, canReadSuite, canReadRun },
    !loadingProjects,
  );
  const { scopes, cases, suites, runs } = source;

  /**
   * The map is what the project has actually touched: a module earns its row by
   * having at least one scope, case, suite or run behind it. A module sitting in
   * the settings list with nothing filed against it is not part of this project's
   * coverage, so it is left out rather than padding the list with empty rows.
   */
  const mappedNodes = useMemo(
    () => nodes.filter(n => n.scopes.length > 0 || n.cases.length > 0 || n.suites.length > 0 || n.runs.length > 0),
    [nodes],
  );

  /** One health read per module, shared by the header chips and the rows. */
  const healthByKey = useMemo(() => {
    const map = new Map<string, ReturnType<typeof healthOf>>();
    mappedNodes.forEach(n => map.set(n.key, healthOf(n)));
    return map;
  }, [mappedNodes]);

  /** Everything the search and gap filters leave — before the band filter. */
  const baseNodes = useMemo(() => {
    const q = norm(debouncedSearch);
    return mappedNodes.filter(n => {
      if (q && !norm(n.name).includes(q)) return false;
      if (gapsOnly && n.runs.length > 0 && n.cases.length > 0) return false;
      return true;
    });
  }, [mappedNodes, debouncedSearch, gapsOnly]);

  const bandCounts = useMemo(() => {
    const counts: Record<HealthBand, number> = { green: 0, blue: 0, orange: 0, red: 0, none: 0 };
    baseNodes.forEach(n => { counts[healthByKey.get(n.key)?.band ?? "none"] += 1; });
    return counts;
  }, [baseNodes, healthByKey]);

  const visibleNodes = useMemo(() => {
    let list = bandFilter
      ? baseNodes.filter(n => (healthByKey.get(n.key)?.band ?? "none") === bandFilter)
      : baseNodes;
    list = list.slice().sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "coverage") {
        const weight = (n: ModuleNode) => n.runs.length * 3 + n.suites.length * 2 + n.cases.length + n.scopes.length;
        return weight(a) - weight(b);
      }
      return dayjs(b.lastActivity || 0).valueOf() - dayjs(a.lastActivity || 0).valueOf();
    });
    return list;
  }, [baseNodes, healthByKey, bandFilter, sortKey]);

  // Counted over the mapped modules so the headline matches the list beneath it.
  const totals = useMemo(() => {
    const passed = mappedNodes.reduce((n, m) => n + m.passed, 0);
    const failed = mappedNodes.reduce((n, m) => n + m.failed, 0);
    const executed = passed + failed + mappedNodes.reduce((n, m) => n + m.blocked, 0);
    return {
      modules: mappedNodes.filter(n => !n.unassigned).length,
      covered: mappedNodes.filter(n => n.runs.length > 0).length,
      scopes: new Set(scopes.map((s: any) => s.id)).size,
      cases: cases.length,
      childCases: mappedNodes.reduce((n, m) => n + m.childCases, 0),
      suites: suites.length,
      runs: runs.length,
      passRate: executed > 0 ? Math.round((passed / executed) * 100) : null,
      failed,
    };
  }, [mappedNodes, scopes, cases, suites, runs]);

  const canRead = canReadScope || canReadCase || canReadSuite || canReadRun;

  if (!canRead) return null;

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="dh-shell">
        <main className="dh-main">
          {/* ── Header row — project, search, view controls ─────────── */}
          <div className="saas-header-container sc-header">
            <QaProjectSwitcher
              projects={projects as any}
              value={projectId ?? null}
              onChange={(id: string | null) => setProjectId(id ?? undefined)}
              loading={loadingProjects}
              placeholder="All projects"
            />

            <Divider type="vertical" style={{ height: 24, margin: 0, opacity: 0.5 }} />

            <div className="sc-header-controls">
              <Input
                placeholder="Quick search modules..."
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)", fontSize: 12 }} />}
                className="saas-input"
                style={{ maxWidth: 260, borderRadius: 8, height: 30, background: "transparent", fontSize: 12 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                allowClear
              />
            </div>

            {/* Right side — the View switch that used to live in the rail,
                then the ordering and refresh. */}
            <Space size={10} className="sc-header-right">
              <Segmented
                className="saas-segmented-premium sc-owner-seg"
                value={gapsOnly ? "gaps" : "all"}
                onChange={(v: any) => setGapsOnly(v === "gaps")}
                options={[
                  {
                    value: "all",
                    label: (
                      <span className="sc-owner-opt">
                        <Layers size={13} />
                        <span className="sc-owner-opt__label">Everything</span>
                      </span>
                    ),
                  },
                  {
                    value: "gaps",
                    label: (
                      <span className="sc-owner-opt">
                        <AlertTriangle size={13} />
                        <span className="sc-owner-opt__label">Gaps only</span>
                      </span>
                    ),
                  },
                ]}
              />

              <Segmented
                className="saas-segmented-premium"
                value={sortKey}
                onChange={(v: any) => setSortKey(v)}
                options={SORTS.map(s => ({ value: s.value, label: s.label }))}
              />

              <Tooltip title="Refresh map">
                <Button
                  icon={<RotateCw size={14} className={loading ? "animate-spin" : ""} />}
                  onClick={refetch}
                  disabled={loading}
                  style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                />
              </Tooltip>
            </Space>
          </div>

          {/* ── Overview banner — the hero and the KPI row, together. The
               health chips stay clickable and pin to the right edge. ─── */}
          <div className="cm-banner">
            <div className="cm-banner__main">
              <div className="cm-banner__row1">
                <span className="cm-banner__badge">
                  {project ? initialsOf(project.label) : <Boxes size={15} />}
                </span>
                <span className="cm-banner__id">
                  <span className="cm-banner__title">{project?.label || "All projects"} — Coverage Map</span>
                  <span className="cm-banner__sub">
                    Every module with a scope, case, suite or run behind it.
                  </span>
                </span>
                <span className="cm-banner__tags">
                  <span className="cm-banner__tag">{totals.modules} MODULES</span>
                  {totals.passRate !== null && (
                    <span
                      className="cm-banner__tag"
                      style={{
                        color: totals.passRate >= 80 ? "#10b981" : totals.passRate >= 50 ? "#3b82f6" : "#ef4444",
                        borderColor: totals.passRate >= 80 ? "rgba(16,185,129,.5)" : totals.passRate >= 50 ? "rgba(59,130,246,.5)" : "rgba(239,68,68,.5)",
                      }}
                    >
                      {totals.passRate}% PASS
                    </span>
                  )}
                </span>
              </div>

              <div className="cm-banner__row2">
                <span className="cm-banner__meta">
                  <Boxes size={11} />
                  <b>{totals.covered}</b>/{totals.modules} modules with runs
                </span>
                <span className="cm-banner__meta">
                  <Target size={11} />
                  <b>{totals.scopes}</b> scopes
                </span>
                <span className="cm-banner__meta">
                  <ClipboardList size={11} />
                  <b>{totals.cases}</b> cases
                  <span className="cm-banner__soft">({totals.childCases} module cases)</span>
                </span>
                <span className="cm-banner__meta">
                  <Layers size={11} />
                  <b>{totals.suites}</b> suites
                </span>
                <span className="cm-banner__meta">
                  <PlayCircle size={11} />
                  <b>{totals.runs}</b> runs
                  {totals.failed > 0 && <span className="cm-banner__soft">({totals.failed} failed)</span>}
                </span>
              </div>
            </div>

            <div className="cm-banner__bands">
              {HEALTH_LEGEND.map(l => {
                const n = bandCounts[l.band];
                const isOn = bandFilter === l.band;
                return (
                  <Tooltip key={l.band} title={`${HEALTH_LABEL[l.band]} · latest run ${l.label}`}>
                    <button
                      type="button"
                      className={`cm-band is-${l.band}${isOn ? " is-on" : ""}${n === 0 ? " is-zero" : ""}`}
                      onClick={() => setBandFilter(isOn ? null : l.band)}
                      disabled={n === 0}
                    >
                      <i />
                      <b>{n}</b>
                      <span className="cm-band__label">{HEALTH_LABEL[l.band]}</span>
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Active-filter flags */}
            {(gapsOnly || bandFilter) && (
              <div className="cm-controls">
                {gapsOnly && (
                  <span className="cm-flag">
                    <AlertTriangle size={12} />
                    Showing modules missing cases or runs
                  </span>
                )}
                {bandFilter && (
                  <button type="button" className="cm-flag is-clear" onClick={() => setBandFilter(null)}>
                    Showing {HEALTH_LABEL[bandFilter].toLowerCase()} modules only — clear
                  </button>
                )}
              </div>
            )}

            <ZukvoLoadingOverlay loading={loading} message="Building the coverage map…" minHeight={loading ? 360 : undefined}>
              <div className="cm-tree">
                {!loading && visibleNodes.length === 0 && (
                  <div className="cm-empty">
                    <Sparkles size={26} className="cm-empty__ic" />
                    <p className="cm-empty__title">
                      {debouncedSearch
                        ? "No modules match that search"
                        : bandFilter
                          ? `No ${HEALTH_LABEL[bandFilter].toLowerCase()} modules`
                          : gapsOnly ? "No gaps in this project" : "Nothing mapped yet"}
                    </p>
                    <p className="cm-empty__desc">
                      {debouncedSearch || bandFilter
                        ? "The map lists a module only once it has a scope, case, suite or run behind it."
                        : gapsOnly
                          ? "Every module here has cases written and runs executed against them."
                          : "Once this project has scopes, cases, suites or runs, each module's coverage shows up here."}
                    </p>
                  </div>
                )}

                {visibleNodes.map(node => {
                  const health = healthOf(node);
                  const records = node.scopes.length + node.cases.length + node.suites.length + node.runs.length;
                  return (
                    <button
                      key={node.key}
                      className={`cm-node is-${health.band}`}
                      onClick={() => router.push(
                        `/qa-workspace/coverage-map/${encodeURIComponent(node.key)}`
                        + `?name=${encodeURIComponent(node.name)}`
                        + (projectId ? `&project=${encodeURIComponent(projectId)}` : "")
                      )}
                    >
                      <span className={`cm-node__av${node.unassigned || node.adhoc ? " is-soft" : ""}`}>
                        {initialsOf(node.name)}
                      </span>

                      <span className="cm-node__id">
                        <span className="cm-node__name">
                          {node.name}
                          {node.adhoc && <span className="cm-tag">ad hoc</span>}
                          {node.unassigned && <span className="cm-tag">no module</span>}
                          <span className="cm-records">{records} record{records === 1 ? "" : "s"}</span>
                        </span>
                        <span className="cm-node__meta">{fmtAgo(node.lastActivity)}</span>
                      </span>

                      <span className="cm-node__bar">
                        <ResultBar passed={node.passed} failed={node.failed} blocked={node.blocked} notExecuted={node.notExecuted} />
                      </span>

                      <span className="cm-node__metrics">
                        <Metric icon={Target} n={node.scopes.length} noun="scopes" />
                        <Metric icon={ClipboardList} n={node.cases.length} noun="cases" />
                        <Metric icon={Layers} n={node.suites.length} noun="suites" />
                        <Metric icon={PlayCircle} n={node.runs.length} noun="runs" />
                      </span>

                      <Tooltip
                        title={health.run
                          ? `Latest run: ${health.run.run_name || "Untitled run"} · ${fmtDate(runDate(health.run)) || "no date"}`
                            + ` · ${Number(health.run.passed_count || 0)} passed, ${Number(health.run.failed_count || 0)} failed`
                          : "No run has been executed against this module"}
                      >
                        <span className={`cm-health cm-health--${health.band}`}>
                          <span className="cm-health__dot" />
                          {health.rate !== null ? `${health.rate}%` : "—"}
                          <span className="cm-health__label">{HEALTH_LABEL[health.band]}</span>
                        </span>
                      </Tooltip>

                      <span className="cm-node__go"><ArrowUpRight size={15} /></span>
                    </button>
                  );
                })}
              </div>
            </ZukvoLoadingOverlay>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Styles — the shared QA Space shell, plus the map's own tree.
 * Palette stays blue / green / ash; red is reserved for failures.
 * ──────────────────────────────────────────────────────────────────────────── */
const STYLES = `
.dh-shell { display: flex; height: calc(100vh - 64px); background: var(--bg-pure-white); overflow: hidden; position: relative; }

/* ── Header row, matched to the Ticket List ────────────────────────────── */
.sc-header {
  position: sticky; top: 0; z-index: 100;
  margin: 0; padding: 9.7px 16px;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: var(--bg-pure-white);
  border-bottom: 1px solid var(--border-slate-200);
  flex-shrink: 0;
}
[data-theme='dark'] .sc-header { background: #0f1419; border-bottom-color: #1f2937; }
.sc-header-controls { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.sc-header-right { flex-shrink: 0; }
.sc-owner-seg .ant-segmented-item-label { padding: 0 4px; }
.sc-owner-opt { display: inline-flex; align-items: center; gap: 6px; height: 100%; }
.sc-owner-opt__label { font-size: 12px; font-weight: 600; white-space: nowrap; }
@media (max-width: 1100px) { .sc-owner-opt__label { display: none; } }

/* ── Overview banner — the hero and the KPI strip, together ───────────── */
.cm-banner {
  display: flex; align-items: stretch; gap: 16px;
  background: var(--bg-slate-50);
  border-bottom: 1px solid var(--border-slate-200);
  flex-shrink: 0;
}
[data-theme='dark'] .cm-banner { background: #0f1419; border-bottom-color: #1f2937; }
.cm-banner__main {
  flex: 1 1 auto; min-width: 0;
  display: flex; flex-direction: column; justify-content: center; gap: 7px;
  padding: 11px 16px;
}
.cm-banner__row1 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.cm-banner__badge {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12.5px; font-weight: 800; letter-spacing: -.02em;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2);
}
.cm-banner__id { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
.cm-banner__title {
  font-size: 14px; font-weight: 800; letter-spacing: -.01em; color: var(--text-slate-900);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
[data-theme='dark'] .cm-banner__title { color: #f1f5f9; }
.cm-banner__sub {
  font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cm-banner__tags { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
.cm-banner__tag {
  display: inline-flex; align-items: center; height: 18px; padding: 0 6px;
  font-size: 9px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase;
  line-height: 1; border-radius: 4px; background: transparent;
  border: 1px solid rgba(100,116,139,.32); color: var(--text-slate-500);
}
.cm-banner__row2 { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding-left: 44px; }
.cm-banner__meta {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -.005em;
}
.cm-banner__meta b { color: var(--text-slate-900); font-weight: 800; }
.cm-banner__soft { color: var(--text-slate-400); font-weight: 500; }
[data-theme='dark'] .cm-banner__meta { color: #94a3b8; }
[data-theme='dark'] .cm-banner__meta b { color: #f1f5f9; }
/* The health chips keep filtering; they just live at the banner's right edge. */
.cm-banner__bands {
  display: flex; align-items: center; gap: 2px; flex-shrink: 0;
  padding: 11px 16px;
  border-left: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .cm-banner__bands { border-left-color: #1f2937; }
@media (max-width: 1100px) {
  .cm-banner { flex-direction: column; gap: 0; }
  .cm-banner__row2 { padding-left: 0; }
  .cm-banner__bands {
    border-left: none;
    border-top: 1px solid var(--border-slate-200);
    flex-wrap: wrap;
  }
}
.dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
.dh-main-scroll { flex: 1; overflow-y: auto; padding: 14px 16px 20px; background: transparent; }

/* ── Controls ──────────────────────────────────────────────────────────── */
.cm-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.cm-controls:empty { display: none; }
.cm-flag {
  display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px;
  border-radius: 999px; font-size: 11.5px; font-weight: 600;
  color: #2563eb; background: rgba(59,130,246,.09); border: 1px solid rgba(59,130,246,.2);
}

/* ── The tree ──────────────────────────────────────────────────────────── */
.cm-tree { display: flex; flex-direction: column; gap: 8px; }
.cm-node {
  display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
  padding: 12px 14px; cursor: pointer;
  border: 1px solid var(--border-slate-200); border-radius: 12px;
  background: var(--bg-pure-white); overflow: hidden;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.cm-node:hover { border-color: #cbd5e1; box-shadow: 0 4px 16px rgba(15,23,42,.05); }

.cm-node__go {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 28px; height: 28px; border-radius: 8px;
  color: var(--text-slate-300); transition: color .15s ease, background .15s ease, transform .15s ease;
}
.cm-node:hover .cm-node__go { color: #2563eb; background: rgba(59,130,246,.1); transform: translateX(2px); }
.cm-node__av {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; letter-spacing: -.01em;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.18);
}
.cm-node__av.is-soft { color: var(--text-slate-500); background: var(--bg-slate-50); border-color: var(--border-slate-200); }
.cm-node__id { display: flex; flex-direction: column; gap: 3px; min-width: 168px; max-width: 260px; flex: 1 1 200px; }
.cm-node__name {
  display: flex; align-items: center; gap: 7px;
  font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -.01em;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cm-tag {
  flex-shrink: 0; padding: 1px 7px; border-radius: 999px;
  font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
  color: var(--text-slate-500); background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
}
.cm-node__meta { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

.cm-node__bar { display: flex; align-items: center; gap: 9px; flex: 1 1 160px; min-width: 130px; }
.cm-bar {
  display: flex; height: 7px; flex: 1; min-width: 90px; border-radius: 999px; overflow: hidden;
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.cm-bar.is-empty { align-items: center; justify-content: center; height: auto; padding: 2px 8px; background: transparent; border-style: dashed; }
.cm-bar__none { font-size: 10.5px; color: var(--text-slate-400); white-space: nowrap; }
.cm-bar__seg { height: 100%; }
.cm-bar__seg.is-pass { background: #10b981; }
.cm-bar__seg.is-fail { background: #ef4444; }
.cm-bar__seg.is-block { background: #94a3b8; }
.cm-bar__seg.is-todo { background: var(--border-slate-200); }
/* ── Module health: the pass rate of the latest run ────────────────────── */
.cm-health {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  height: 26px; padding: 0 10px; border-radius: 999px;
  font-size: 11.5px; font-weight: 750; font-variant-numeric: tabular-nums;
  border: 1px solid; white-space: nowrap;
}
.cm-health__dot { width: 7px; height: 7px; border-radius: 999px; background: currentColor; flex-shrink: 0; }
.cm-health__label { font-weight: 600; opacity: .75; }
.cm-health--green { color: #047857; background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.28); }
.cm-health--blue { color: #2563eb; background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.28); }
.cm-health--orange { color: #b45309; background: rgba(245,158,11,.14); border-color: rgba(245,158,11,.3); }
.cm-health--red { color: #dc2626; background: rgba(239,68,68,.12); border-color: rgba(239,68,68,.28); }
.cm-health--none { color: #64748b; background: var(--bg-slate-50); border-color: var(--border-slate-200); }

/* The whole row carries the band, so a red module reads at a glance. */
.cm-node { position: relative; }
.cm-node::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--border-slate-200); transition: background .18s ease;
}
.cm-node.is-green::before { background: #10b981; }
.cm-node.is-blue::before { background: #3B82F6; }
.cm-node.is-orange::before { background: #f59e0b; }
.cm-node.is-red::before { background: #ef4444; }
.cm-node.is-green { background: rgba(16,185,129,.03); }
.cm-node.is-blue { background: rgba(59,130,246,.03); }
.cm-node.is-orange { background: rgba(245,158,11,.04); }
.cm-node.is-red { background: rgba(239,68,68,.035); }
.cm-node.is-green .cm-node__av { color: #047857; background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.22); }
.cm-node.is-orange .cm-node__av { color: #b45309; background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.24); }
.cm-node.is-red .cm-node__av { color: #dc2626; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.22); }
.cm-node.is-red { border-color: rgba(239,68,68,.28); }

/* "how much is in here", before anything is expanded */
.cm-records {
  flex-shrink: 0; padding: 1px 8px; border-radius: 999px;
  font-size: 10px; font-weight: 700; letter-spacing: .02em;
  color: var(--text-slate-500); background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
}

/* ── Health bands: legend and filter in one control ────────────────────── */
.cm-band {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px;
  border: 1px solid transparent; border-radius: 8px; background: transparent; cursor: pointer;
  font-size: 11.5px; color: var(--text-slate-500);
  transition: background .15s ease, border-color .15s ease, color .15s ease;
}
.cm-band b { font-weight: 800; font-variant-numeric: tabular-nums; color: var(--text-slate-800); }
.cm-band i { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; }
.cm-band__label { font-weight: 600; }
.cm-band:hover:not(:disabled) { background: var(--bg-pure-white); border-color: var(--border-slate-200); }
.cm-band:disabled { opacity: .4; cursor: default; }
.cm-band.is-green i { background: #10b981; }
.cm-band.is-blue i { background: #3B82F6; }
.cm-band.is-orange i { background: #f59e0b; }
.cm-band.is-red i { background: #ef4444; }
.cm-band.is-none i { background: var(--border-slate-300, #cbd5e1); }
.cm-band.is-on { background: var(--bg-pure-white); box-shadow: 0 1px 3px rgba(15,23,42,.08); }
.cm-band.is-on.is-green { border-color: rgba(16,185,129,.35); color: #047857; }
.cm-band.is-on.is-green b { color: #047857; }
.cm-band.is-on.is-blue { border-color: rgba(59,130,246,.35); color: #2563eb; }
.cm-band.is-on.is-blue b { color: #2563eb; }
.cm-band.is-on.is-orange { border-color: rgba(245,158,11,.4); color: #b45309; }
.cm-band.is-on.is-orange b { color: #b45309; }
.cm-band.is-on.is-red { border-color: rgba(239,68,68,.38); color: #dc2626; }
.cm-band.is-on.is-red b { color: #dc2626; }
.cm-band.is-on.is-none { border-color: var(--border-slate-200); }

.cm-flag.is-clear { cursor: pointer; }
.cm-flag.is-clear:hover { background: rgba(59,130,246,.16); }

@media (max-width: 1180px) {
  .cm-band__label { display: none; }
  .cm-band { padding: 0 9px; }
}

.cm-node__metrics { display: flex; align-items: center; gap: 6px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.cm-metric {
  display: inline-flex; align-items: center; gap: 5px; height: 25px; padding: 0 9px;
  border-radius: 7px; font-size: 11.5px; color: var(--text-slate-600);
  background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
.cm-metric b { font-weight: 750; color: var(--text-slate-900); }
.cm-metric svg { color: var(--text-slate-400); }
.cm-metric__noun { color: var(--text-slate-400); }
.cm-metric.is-empty { opacity: .55; }

.cm-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 54px 20px; text-align: center;
  border: 1px dashed var(--border-slate-200); border-radius: 12px;
}
.cm-empty__ic { color: var(--text-slate-300); }
.cm-empty__title { margin: 4px 0 0; font-size: 13.5px; font-weight: 700; color: var(--text-slate-800); }
.cm-empty__desc { margin: 0; font-size: 12px; color: var(--text-slate-400); max-width: 380px; line-height: 1.5; }

/* ── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .cm-node__bar { display: none; }
}
@media (max-width: 900px) {
  .cm-node__body { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 820px) {
  .dh-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
  .dh-main { height: auto; overflow: visible; width: 100%; }
  .dh-main-scroll { padding: 12px 12px 24px; }
  .cm-node__metrics { width: 100%; justify-content: flex-start; }
}
@media (max-width: 520px) {
  .cm-node__head { flex-wrap: wrap; }
}
`;
