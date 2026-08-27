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
import { Button, Input, Tooltip } from "antd";
import { BugOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Menu, RotateCw, Boxes, Folder, FolderOpen, ChevronDown, Target,
  Layers, PlayCircle, ClipboardList, AlertTriangle, ArrowUpRight, Sparkles,
} from "lucide-react";
import dayjs from "dayjs";

import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useActivitySource } from "@/hooks/useActivitySource";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Kpi, Metric, ResultBar, fmtAgo, fmtDate, initialsOf, norm,
  useCoverageData, useUserProjects, type ModuleNode,
} from "./shared";

/** How many projects the rail lists before "Show more". */
const PROJECTS_PREVIEW = 3;
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

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
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

  /** One health read per module, shared by the header chips and the rows. */
  const healthByKey = useMemo(() => {
    const map = new Map<string, ReturnType<typeof healthOf>>();
    nodes.forEach(n => map.set(n.key, healthOf(n)));
    return map;
  }, [nodes]);

  /** Everything the search and gap filters leave — before the band filter. */
  const baseNodes = useMemo(() => {
    const q = norm(debouncedSearch);
    return nodes.filter(n => {
      // An empty catch-all bucket is noise; an empty real module is a finding.
      if ((n.unassigned || n.adhoc) && !n.scopes.length && !n.cases.length && !n.suites.length && !n.runs.length) return false;
      if (q && !norm(n.name).includes(q)) return false;
      if (gapsOnly && n.runs.length > 0 && n.cases.length > 0) return false;
      return true;
    });
  }, [nodes, debouncedSearch, gapsOnly]);

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

  const totals = useMemo(() => {
    const passed = nodes.reduce((n, m) => n + m.passed, 0);
    const failed = nodes.reduce((n, m) => n + m.failed, 0);
    const executed = passed + failed + nodes.reduce((n, m) => n + m.blocked, 0);
    return {
      modules: nodes.filter(n => !n.unassigned).length,
      covered: nodes.filter(n => n.runs.length > 0).length,
      scopes: new Set(scopes.map((s: any) => s.id)).size,
      cases: cases.length,
      childCases: nodes.reduce((n, m) => n + m.childCases, 0),
      suites: suites.length,
      runs: runs.length,
      passRate: executed > 0 ? Math.round((passed / executed) * 100) : null,
      failed,
    };
  }, [nodes, scopes, cases, suites, runs]);

  const visibleProjects = showAllProjects ? projects : projects.slice(0, PROJECTS_PREVIEW);
  const hiddenProjectCount = Math.max(0, projects.length - PROJECTS_PREVIEW);
  const canRead = canReadScope || canReadCase || canReadSuite || canReadRun;

  if (!canRead) return null;

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="dh-shell">
        <div
          className={`dh-sidebar-backdrop ${mobileSidebarOpen ? "is-open" : ""}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />

        <aside className={`dh-sidebar ${mobileSidebarOpen ? "is-mobile-open" : ""}`}>
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo"><BugOutlined /></div>
              <div className="pp-side-head-text">
                <h1 className="pp-side-title">Coverage</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>
          </div>

          <div className="dh-sidebar-scroll">
            <span className="pp-nav-caption">Projects</span>
            <button
              className={`pp-nav-item ${!projectId ? "is-active" : ""}`}
              onClick={() => { setProjectId(undefined); setMobileSidebarOpen(false); }}
            >
              <Boxes size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">All Projects</span>
              {projects.length > 0 ? <span className="pp-nav-count">{projects.length}</span> : null}
            </button>
            {visibleProjects.map(p => (
              <button
                key={p.value}
                className={`pp-nav-item ${projectId === p.value ? "is-active" : ""}`}
                onClick={() => { setProjectId(p.value); setMobileSidebarOpen(false); }}
                title={p.label}
              >
                {projectId === p.value
                  ? <FolderOpen size={15} className="pp-nav-icon" />
                  : <Folder size={15} className="pp-nav-icon" />}
                <span className="pp-nav-label">{p.label}</span>
              </button>
            ))}
            {!loadingProjects && projects.length === 0 && (
              <span className="pp-nav-empty">No projects assigned</span>
            )}
            {hiddenProjectCount > 0 && (
              <button
                type="button"
                className={`pp-nav-more ${showAllProjects ? "is-open" : ""}`}
                onClick={() => setShowAllProjects(v => !v)}
              >
                <ChevronDown size={13} className="pp-nav-more-icon" />
                {showAllProjects ? "Show less" : `Show ${hiddenProjectCount} more`}
              </button>
            )}

            <span className="pp-nav-caption">View</span>
            <button
              className={`pp-nav-item ${!gapsOnly ? "is-active" : ""}`}
              onClick={() => setGapsOnly(false)}
            >
              <Layers size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">Everything</span>
            </button>
            <button
              className={`pp-nav-item ${gapsOnly ? "is-active" : ""}`}
              onClick={() => setGapsOnly(true)}
            >
              <AlertTriangle size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">Gaps only</span>
            </button>
          </div>
        </aside>

        <main className="dh-main">
          <header className="cm-hero">
            <div className="cm-hero__main">
              <Button
                className="dh-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
              <span className="cm-hero__badge">
                {project ? initialsOf(project.label) : <Boxes size={17} />}
              </span>
              <div className="cm-hero__id">
                <span className="cm-hero__eyebrow">
                  <Sparkles size={11} />
                  Coverage Map
                </span>
                <h1 className="cm-hero__title">{project?.label || "All projects"}</h1>
              </div>
            </div>

            <div className="cm-hero__side">
              {/* Health at project level — each chip filters the map to its band. */}
              <div className="cm-bands">
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

              <div className="cm-hero__actions">
                <Button
                  type="default"
                  icon={<RotateCw size={14} className={loading ? "animate-spin" : ""} />}
                  onClick={refetch}
                  disabled={loading}
                  title="Refresh"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0 }}
                />
              </div>
            </div>
          </header>

          <div className="dh-main-scroll">
            {/* Headline numbers for the selected project */}
            <div className="cm-kpis">
              <Kpi
                icon={Boxes}
                label="Modules in play"
                value={totals.modules}
                sub={`${totals.covered} with executed runs`}
              />
              <Kpi
                icon={Target}
                label="Scopes"
                value={totals.scopes}
                sub="planned against these modules"
              />
              <Kpi
                icon={ClipboardList}
                label="Cases"
                value={totals.cases}
                sub={`${totals.childCases} module cases beneath them`}
              />
              <Kpi
                icon={Layers}
                label="Suites"
                value={totals.suites}
                sub="assembled for execution"
              />
              <Kpi
                icon={PlayCircle}
                label="Runs"
                value={totals.runs}
                tone={totals.passRate !== null && totals.passRate >= 80 ? "green" : "blue"}
                sub={totals.passRate === null ? "nothing executed yet" : `${totals.passRate}% pass · ${totals.failed} failed`}
              />
            </div>

            {/* Controls */}
            <div className="cm-controls">
              <Input
                className="cm-search"
                placeholder="Search modules…"
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                allowClear
              />
              <div className="cm-seg">
                {SORTS.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    className={sortKey === s.value ? "is-active" : ""}
                    onClick={() => setSortKey(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
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

            <ZukvoLoadingOverlay loading={loading} message="Building the coverage map…" minHeight={loading ? 360 : undefined}>
              <div className="cm-tree">
                {!loading && visibleNodes.length === 0 && (
                  <div className="cm-empty">
                    <Sparkles size={26} className="cm-empty__ic" />
                    <p className="cm-empty__title">
                      {gapsOnly ? "No gaps in this project" : "Nothing mapped yet"}
                    </p>
                    <p className="cm-empty__desc">
                      {gapsOnly
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
.dh-shell { display: flex; height: calc(100vh - 64px); background: transparent; overflow: hidden; position: relative; }
.dh-sidebar {
  width: 194px; background: transparent; border-right: 1px solid var(--border-slate-200);
  display: flex; flex-direction: column; z-index: 10; flex-shrink: 0;
}
.dh-sidebar-backdrop { display: none; }
.dh-sidebar-top { padding: 12px 10px 10px; flex-shrink: 0; border-bottom: 1px solid var(--border-slate-100); }
.pp-side-head { display: flex; align-items: center; gap: 9px; padding: 0 2px; }
.pp-side-logo {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  background: var(--bg-blue-50); color: #3B82F6;
  display: flex; align-items: center; justify-content: center; font-size: 15px;
  border: 1px solid rgba(59,130,246,.16);
}
.pp-side-head-text { min-width: 0; }
.pp-side-title { font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); line-height: 1.15; margin: 0; }
.pp-side-subtitle { font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; margin: 1px 0 0; letter-spacing: .02em; }

.dh-sidebar-scroll { flex: 1; overflow-y: auto; padding: 12px 8px 16px; }
.pp-nav-caption {
  display: block; padding: 0 8px; margin: 0 0 6px;
  font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  color: var(--text-slate-400);
}
.pp-nav-caption + .pp-nav-item { margin-top: 0; }
.pp-nav-item ~ .pp-nav-caption, .pp-nav-more + .pp-nav-caption { margin-top: 16px; }
.pp-nav-item {
  position: relative;
  display: flex; align-items: center; gap: 9px; width: 100%; height: 33px; padding: 0 9px;
  border-radius: 7px; border: none; background: transparent; color: var(--text-slate-600);
  font-size: 12.5px; font-weight: 500; cursor: pointer; text-align: left;
  transition: background .15s ease, color .15s ease; margin-bottom: 2px;
}
.pp-nav-icon { flex-shrink: 0; color: var(--text-slate-400); transition: color .15s ease; }
.pp-nav-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-nav-count {
  flex-shrink: 0; min-width: 20px; padding: 1px 6px; border-radius: 999px;
  font-size: 10.5px; font-weight: 700; text-align: center;
  background: var(--bg-slate-50); color: var(--text-slate-500);
  border: 1px solid var(--border-slate-100);
}
.pp-nav-item:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
.pp-nav-item:hover .pp-nav-icon { color: var(--text-slate-600); }
.pp-nav-item.is-active { background: var(--bg-blue-50); color: #3B82F6; font-weight: 650; }
.pp-nav-item.is-active .pp-nav-icon { color: #3B82F6; }
.pp-nav-item.is-active .pp-nav-count { background: rgba(59,130,246,.14); color: #2563eb; border-color: transparent; }
.pp-nav-item.is-active::before {
  content: ''; position: absolute; left: -8px; top: 7px; bottom: 7px;
  width: 3px; border-radius: 0 3px 3px 0; background: #3B82F6;
}
.pp-nav-more {
  display: flex; align-items: center; gap: 6px; width: 100%; height: 28px; padding: 0 9px;
  margin-top: 2px; border: none; background: transparent; border-radius: 7px;
  color: var(--text-slate-500); font-size: 11.5px; font-weight: 600; cursor: pointer; text-align: left;
  transition: background .15s ease, color .15s ease;
}
.pp-nav-more:hover { background: var(--bg-slate-50); color: #3B82F6; }
.pp-nav-more-icon { transition: transform .18s ease; }
.pp-nav-more.is-open .pp-nav-more-icon { transform: rotate(180deg); }
.pp-nav-empty { display: block; padding: 4px 9px 2px; font-size: 11.5px; color: var(--text-slate-400); }

.dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
.dh-main-scroll { flex: 1; overflow-y: auto; padding: 16px 20px 28px; background: transparent; }
.dh-mobile-menu-btn { display: none !important; }

/* ── KPI strip ─────────────────────────────────────────────────────────── */
.cm-kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 14px; }
.cm-kpi {
  position: relative; overflow: hidden;
  padding: 12px 14px; border-radius: 12px;
  border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
}
.cm-kpi::after {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
  background: #3B82F6; opacity: .5;
}
.cm-kpi--green::after { background: #10b981; }
.cm-kpi--ash::after { background: #94a3b8; }
.cm-kpi:hover { border-color: #cbd5e1; box-shadow: 0 6px 20px rgba(15,23,42,.05); transform: translateY(-1px); }
.cm-kpi__top { display: flex; align-items: center; gap: 7px; }
.cm-kpi__ic {
  width: 22px; height: 22px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
  background: rgba(59,130,246,.1); color: #2563eb; border: 1px solid rgba(59,130,246,.18);
}
.cm-kpi--green .cm-kpi__ic { background: rgba(16,185,129,.1); color: #047857; border-color: rgba(16,185,129,.2); }
.cm-kpi--ash .cm-kpi__ic { background: var(--bg-slate-50); color: var(--text-slate-500); border-color: var(--border-slate-100); }
.cm-kpi__label { font-size: 11px; font-weight: 650; color: var(--text-slate-500); letter-spacing: .01em; }
.cm-kpi__value { margin-top: 8px; font-size: 24px; font-weight: 800; letter-spacing: -.03em; color: var(--text-slate-900); line-height: 1; }
.cm-kpi__sub { margin-top: 5px; font-size: 11px; color: var(--text-slate-400); line-height: 1.35; }

/* ── Controls ──────────────────────────────────────────────────────────── */
.cm-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.cm-search { width: 260px; }
.cm-controls .ant-input-affix-wrapper { height: 32px !important; border-radius: 8px; }
.cm-seg {
  display: inline-flex; padding: 2px; gap: 2px;
  border: 1px solid var(--border-slate-200); border-radius: 9px; background: var(--bg-slate-50);
}
.cm-seg button {
  height: 26px; padding: 0 11px; border: none; border-radius: 7px; background: transparent; cursor: pointer;
  font-size: 11.5px; font-weight: 600; color: var(--text-slate-500);
  transition: background .15s ease, color .15s ease;
}
.cm-seg button:hover { color: var(--text-slate-800); }
.cm-seg button.is-active { background: var(--bg-pure-white); color: #2563eb; box-shadow: 0 1px 2px rgba(15,23,42,.06); }
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

/* ── Hero header: the project first, the map second ────────────────────── */
.cm-hero {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  min-height: 56px; padding: 8px 20px; border-bottom: 1px solid var(--border-slate-200);
  background: linear-gradient(180deg, rgba(59,130,246,.045), transparent);
}
.cm-hero__main { display: flex; align-items: center; gap: 12px; min-width: 0; }
.cm-hero__badge {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12.5px; font-weight: 800; letter-spacing: -.02em;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2);
  box-shadow: 0 2px 8px rgba(59,130,246,.08);
}
.cm-hero__id { min-width: 0; }
.cm-hero__eyebrow {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
  color: #3B82F6;
}
.cm-hero__title {
  margin: 1px 0 0; font-size: 16px; font-weight: 800; letter-spacing: -.03em; line-height: 1.2;
  color: var(--text-slate-900);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cm-hero__side { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-left: auto; }
.cm-hero__actions { display: flex; align-items: center; gap: 8px; }
.cm-hero__actions .ant-btn { height: 32px !important; border-radius: 8px; }

/* ── Health bands: legend and filter in one control ────────────────────── */
.cm-bands {
  display: inline-flex; align-items: center; gap: 2px; padding: 3px;
  border-radius: 11px; background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
}
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
@media (max-width: 760px) {
  .cm-hero { padding: 8px 14px; }
  .cm-hero__side { width: 100%; justify-content: space-between; }
  .cm-hero__title { font-size: 15px; }
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
@media (max-width: 1280px) {
  .cm-kpis { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 1100px) {
  .cm-node__bar { display: none; }
}
@media (max-width: 900px) {
  .cm-node__body { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 820px) {
  .dh-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
  .dh-main { height: auto; overflow: visible; width: 100%; }
  .dh-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; margin-right: 8px; color: var(--text-slate-600); }
  .dh-sidebar-backdrop {
    display: block; position: fixed; inset: 0;
    background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
    opacity: 0; pointer-events: none; transition: opacity .3s;
  }
  .dh-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }
  .dh-sidebar {
    position: fixed; top: 0; left: -320px; bottom: 0; z-index: 1100;
    height: 100%; width: 280px; box-sizing: border-box;
    background: var(--bg-pure-white); border-right: 1px solid var(--border-slate-200);
    transition: left .3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 4px 0 24px rgba(0,0,0,.08);
  }
  .dh-sidebar.is-mobile-open { left: 0; }
  .cm-kpis { grid-template-columns: repeat(2, 1fr); }
  .dh-main-scroll { padding: 12px 14px 24px; }
  .cm-search { width: 100%; }
  .cm-node__metrics { width: 100%; justify-content: flex-start; }
}
@media (max-width: 520px) {
  .cm-kpis { grid-template-columns: 1fr; }
  .cm-node__head { flex-wrap: wrap; }
}
`;
