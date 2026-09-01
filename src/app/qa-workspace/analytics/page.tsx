"use client";
import { message } from "@/providers/AntdGlobalProvider";


import NoData from "@/components/common/NoData";
/**
 * QA Space — Reporting & Analytics.
 *
 * One filter bar (date range, QA Owner, Release, Scope, Run) drives every tab,
 * so a number can be followed across tabs without the basis quietly changing.
 *
 * Every chart has a table view behind it. That is partly a preference and partly
 * an obligation: the palette validator flagged two colours below 3:1 on the
 * light surface, and a table is the documented relief.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { App, Button, DatePicker, Table, Tooltip as AntTooltip  } from "antd";
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Target,
  Bug,
  ShieldCheck,
  LayoutGrid,
  Table2,
  Activity,
  AlertTriangle,
  Repeat2,
  Clock,
  Menu,
  RotateCw,
} from "lucide-react";
import dayjs from "dayjs";

import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import ZukvoLoader, { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import QaAnalyticsService, {
  type AnalyticsFilters,
  type BreakdownDimension,
  type BreakdownRow,
  type CoverageAnalytics,
  type DefectAnalytics,
  type FilterOptions,
  type Overview,
  type QualitySignals,
  type TrendPoint,
} from "@/services/qaAnalyticsService";
import {
  ChartCard,
  DefectFlow,
  EmptyChart,
  ExecutionTrend,
  OutcomeBar,
  PassRateTrend,
  RankedBar,
  STATUS_COLORS,
  useDark,
} from "./charts";
import { QA_SUBMISSION_STYLES, StatTile } from "../qa-submissions/shared";
import { ANALYTICS_STYLES } from "./styles";

const { RangePicker } = DatePicker;

type TabKey = "overview" | "owner" | "release" | "scope" | "run" | "defects" | "coverage" | "quality";

const TABS: Array<{ key: TabKey; label: string; icon: any }> = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "owner", label: "QA Owner", icon: Users },
  { key: "release", label: "Release", icon: Package },
  { key: "scope", label: "Scope", icon: Target },
  { key: "run", label: "Runs", icon: Activity },
  { key: "defects", label: "Defects", icon: Bug },
  { key: "coverage", label: "Coverage", icon: LayoutGrid },
  { key: "quality", label: "Quality Signals", icon: ShieldCheck },
];

/** Severity is ordered, so it maps onto the reserved status ramp. */
const SEVERITY_COLOR: Record<string, string> = {
  blocker: STATUS_COLORS.critical,
  critical: STATUS_COLORS.critical,
  major: STATUS_COLORS.serious,
  high: STATUS_COLORS.serious,
  medium: STATUS_COLORS.warning,
  normal: STATUS_COLORS.warning,
  minor: STATUS_COLORS.muted,
  low: STATUS_COLORS.muted,
};

const fmtBucket = (iso: string, granularity: string) =>
  granularity === "month" ? dayjs(iso).format("MMM YY") : dayjs(iso).format("D MMM");

function AnalyticsContent() {
  useActivitySource({ section: "WORK", module: "QA", page: "Analytics" });

  const { canReadQaAnalytics } = usePermission();
  const dark = useDark();

  const [tab, setTab] = useState<TabKey>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("week");
  const [asTable, setAsTable] = useState(false);
  const [loading, setLoading] = useState(true);


  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().subtract(90, "day"),
    dayjs(),
  ]);
  const [ownerId, setOwnerId] = useState<string | undefined>();
  const [release, setRelease] = useState<string | undefined>();
  const [scopeId, setScopeId] = useState<string | undefined>();
  const [runId, setRunId] = useState<string | undefined>();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [defects, setDefects] = useState<DefectAnalytics | null>(null);
  const [coverage, setCoverage] = useState<CoverageAnalytics | null>(null);
  const [quality, setQuality] = useState<QualitySignals | null>(null);

  const filters: AnalyticsFilters = useMemo(
    () => ({
      from: range?.[0]?.format("YYYY-MM-DD"),
      to: range?.[1]?.format("YYYY-MM-DD"),
      ownerId,
      release,
      scopeId,
      runId,
    }),
    [range, ownerId, release, scopeId, runId],
  );

  useEffect(() => {
    if (!canReadQaAnalytics) return;
    QaAnalyticsService.getFilters().then(setOptions).catch(() => {
      /* filters degrade to date-range only */
    });
  }, [canReadQaAnalytics]);

  /** Each tab fetches only what it draws, so switching tabs stays cheap. */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (tab === "overview") {
        const [o, t] = await Promise.all([
          QaAnalyticsService.getOverview(filters),
          QaAnalyticsService.getTrends(filters, granularity),
        ]);
        setOverview(o);
        setTrends(t);
      } else if (["owner", "release", "scope", "run"].includes(tab)) {
        setBreakdown(await QaAnalyticsService.getBreakdown(filters, tab as BreakdownDimension));
      } else if (tab === "defects") {
        const [d, t] = await Promise.all([
          QaAnalyticsService.getDefects(filters),
          QaAnalyticsService.getTrends(filters, granularity),
        ]);
        setDefects(d);
        setTrends(t);
      } else if (tab === "coverage") {
        setCoverage(await QaAnalyticsService.getCoverage());
      } else if (tab === "quality") {
        setQuality(await QaAnalyticsService.getQuality(filters));
      }
    } catch {
      message.error("Failed to load the report");
    } finally {
      setLoading(false);
    }
  }, [tab, filters, granularity, message]);

  useEffect(() => {
    if (canReadQaAnalytics) load();
  }, [canReadQaAnalytics, load]);

  const activeFilterCount =
    (ownerId ? 1 : 0) + (release ? 1 : 0) + (scopeId ? 1 : 0) + (runId ? 1 : 0);

  const clearFilters = () => {
    setOwnerId(undefined);
    setRelease(undefined);
    setScopeId(undefined);
    setRunId(undefined);
  };

  const trendData = useMemo(
    () => trends.map((t) => ({ ...t, bucket: fmtBucket(t.bucket, granularity) })),
    [trends, granularity],
  );

  if (!canReadQaAnalytics) return null;

  // ─── Shared renderers ──────────────────────────────────────────────
  const outcomeColumns = [
    { title: "Total", dataIndex: "total", key: "total", width: 80, align: "right" as const },
    { title: "Executed", dataIndex: "executed", key: "executed", width: 90, align: "right" as const },
    { title: "Passed", dataIndex: "passed", key: "passed", width: 85, align: "right" as const },
    { title: "Failed", dataIndex: "failed", key: "failed", width: 80, align: "right" as const },
    { title: "Blocked", dataIndex: "blocked", key: "blocked", width: 85, align: "right" as const },
    {
      title: "Pass rate",
      dataIndex: "pass_rate",
      key: "pass_rate",
      width: 100,
      align: "right" as const,
      render: (v: number) => `${v}%`,
    },
    { title: "Bugs", dataIndex: "bugs_linked", key: "bugs_linked", width: 75, align: "right" as const },
  ];

  const breakdownLabel =
    tab === "owner" ? "QA Owner" : tab === "release" ? "Release" : tab === "scope" ? "Scope" : "Run";

  const renderBreakdown = () => (
    <>
      <div className="qa-grid2">
        <ChartCard
          title={`Execution volume by ${breakdownLabel.toLowerCase()}`}
          subtitle="Results recorded in the selected range"
          height={Math.max(240, breakdown.slice(0, 12).length * 34 + 40)}
        >
          <RankedBar data={breakdown.slice(0, 12)} dataKey="total" />
        </ChartCard>
        <ChartCard
          title={`Pass rate by ${breakdownLabel.toLowerCase()}`}
          subtitle="Of results actually executed"
          height={Math.max(240, breakdown.slice(0, 12).length * 34 + 40)}
        >
          <RankedBar
            data={breakdown.slice(0, 12)}
            dataKey="pass_rate"
            colorBy={(r) =>
              r.pass_rate >= 95 ? STATUS_COLORS.good : r.pass_rate >= 80 ? STATUS_COLORS.warning : STATUS_COLORS.critical
            }
          />
        </ChartCard>
      </div>

      <div className="qa-chart" style={{ marginTop: 12 }}>
        <header className="qa-chart__head">
          <div>
            <h3>{breakdownLabel} detail</h3>
            <p>Every figure derived from the linked runs</p>
          </div>
        </header>
        <Table
          className="sc-table"
          size="small"
          rowKey="key"
          dataSource={breakdown}
          pagination={{ pageSize: 15, size: "small", hideOnSinglePage: true }}
          scroll={{ x: 900 }}
          columns={[
            {
              title: breakdownLabel,
              dataIndex: "label",
              key: "label",
              fixed: "left" as const,
              width: 220,
              render: (v: string, r: BreakdownRow) => (
                <div className="sc-name__text">
                  <span className="sc-name__title">{v}</span>
                  {(r.scope_name || r.suite_name || r.scope_owner) && (
                    <span className="sc-name__meta">
                      {[r.scope_name, r.suite_name, r.scope_owner].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              ),
            },
            { title: "Runs", dataIndex: "runs", key: "runs", width: 75, align: "right" as const },
            ...outcomeColumns,
          ]} locale={{ emptyText: <NoData /> }}
        />
      </div>
    </>
  );

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{
        __html: QA_SUBMISSION_STYLES + ANALYTICS_STYLES + `
        .dh-mobile-menu-btn { display: none !important; }

        @media (max-width: 820px) {
          .dh-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
          .dh-main { height: auto; overflow: visible; width: 100%; }
          .dh-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; margin-right: 8px; color: var(--text-slate-600); }
          .dh-mobile-menu-btn:hover { background: var(--bg-slate-100); }

          .dh-sidebar-backdrop {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
            opacity: 0; pointer-events: none; transition: opacity 0.3s;
            display: block !important;
          }
          .dh-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }

          .dh-sidebar {
            position: fixed; top: 0; left: -320px; bottom: 0;
            z-index: 1100; height: 100%; max-height: none;
            border-right: 1px solid var(--border-slate-200); border-bottom: 0;
            display: flex; flex-direction: column; align-items: stretch;
            background: var(--bg-pure-white); width: 280px; box-sizing: border-box;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 4px 0 24px rgba(0,0,0,0.08);
          }
          .dh-sidebar.is-mobile-open { left: 0; }

          /* Stats tiles grid → 2-col on mobile */
          .dh-main-scroll { padding: 12px 14px !important; }
          .grid.grid-cols-2.lg\:grid-cols-4,
          .grid.grid-cols-2.lg\:grid-cols-5 { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }

          /* Filter bar: full-width search, wrap other filters */
          .an-filters { flex-wrap: wrap; gap: 6px; }
          .an-filters .ant-picker { min-width: 0; flex: 1 1 160px; }

          /* Charts: allow horizontal scroll on very small screens */
          .an-chart-wrap { overflow-x: auto; }
          .an-table-wrap { overflow-x: auto !important; }
          .an-table .ant-table { min-width: 560px; }

          /* Topbar: compress controls */
          .sc-topbar { padding: 8px 14px !important; }
        }

        @media (max-width: 480px) {
          .grid.grid-cols-2.lg\:grid-cols-4,
          .grid.grid-cols-2.lg\:grid-cols-5 { grid-template-columns: 1fr !important; }
          .sc-topbar__sub, .sc-topbar__div { display: none !important; }
        }
      `}} />

      <div className="dh-shell">
        <div
          className={`dh-sidebar-backdrop ${mobileSidebarOpen ? 'is-open' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />
        <aside className={`dh-sidebar ${mobileSidebarOpen ? 'is-mobile-open' : ''}`}>
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo">
                <BarChart3 size={18} />
              </div>
              <div>
                <h1 className="pp-side-title">Analytics</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>
          </div>
          <div className="dh-sidebar-scroll">
            <span className="pp-nav-caption">Reports</span>
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`pp-nav-item ${tab === t.key ? "is-active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <t.icon size={15} className="pp-nav-icon" />
                <span className="pp-nav-label">{t.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar sc-topbar">
            <div className="sc-topbar__title" style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                className="dh-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
              <span className="sc-topbar__h1">{TABS.find((t) => t.key === tab)?.label}</span>
              <span className="sc-topbar__div" />
              <span className="sc-topbar__sub">
                Derived from test runs, the bug list and QA submissions — nothing is hand-entered
              </span>
            </div>
            <div className="dh-main-controls">
              <Button
                type="default"
                icon={<RotateCw size={14} className={loading ? "animate-spin" : ""} />}
                onClick={load}
                disabled={loading}
                title="Refresh"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0 }}
              />
              {(tab === "overview" || tab === "defects") && (
                <div className="pp-segmented" style={{ marginLeft: 0 }}>
                  {(["day", "week", "month"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={granularity === g ? "is-active" : ""}
                      onClick={() => setGranularity(g)}
                      style={{ width: "auto", padding: "0 10px", fontSize: 11.5, fontWeight: 600 }}
                    >
                      {g[0].toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              )}
              <AntTooltip title={asTable ? "Show charts" : "Show the underlying table"}>
                <Button
                  size="small"
                  icon={asTable ? <BarChart3 size={14} /> : <Table2 size={14} />}
                  onClick={() => setAsTable((v) => !v)}
                >
                  {asTable ? "Charts" : "Table"}
                </Button>
              </AntTooltip>
            </div>
          </div>

          {/* One filter bar for every tab. Deliberately outside the loading
              overlay so it stays usable while a report refreshes. */}
          <div className="qa-filterbar">
            <RangePicker
              value={range as any}
              onChange={(v) => setRange(v as any)}
              format="DD MMM YYYY"
              allowClear={false}
              presets={[
                { label: "Last 7 days", value: [dayjs().subtract(7, "day"), dayjs()] },
                { label: "Last 30 days", value: [dayjs().subtract(30, "day"), dayjs()] },
                { label: "Last 90 days", value: [dayjs().subtract(90, "day"), dayjs()] },
                { label: "This year", value: [dayjs().startOf("year"), dayjs()] },
              ]}
            />
            <SearchableDropdown
              options={(options?.owners ?? []).map((o) => ({ value: o.id, label: o.label }))}
              value={ownerId}
              onChange={setOwnerId}
              placeholder="All QA owners"
              itemNoun="people"
              className="sc-filters__field"
            />
            <SearchableDropdown
              options={(options?.releases ?? []).map((r) => ({ value: r, label: r }))}
              value={release}
              onChange={setRelease}
              placeholder="All releases"
              hideAvatar
              itemNoun="releases"
              className="sc-filters__field"
            />
            <SearchableDropdown
              options={(options?.scopes ?? []).map((s) => ({ value: s.id, label: s.label, description: s.status }))}
              value={scopeId}
              onChange={setScopeId}
              placeholder="All scopes"
              itemNoun="scopes"
              className="sc-filters__field"
            />
            <SearchableDropdown
              options={(options?.runs ?? []).map((r) => ({ value: r.id, label: r.label }))}
              value={runId}
              onChange={setRunId}
              placeholder="All runs"
              hideAvatar
              itemNoun="runs"
              className="sc-filters__field"
            />
            {activeFilterCount > 0 && (
              <button type="button" className="sc-clear" onClick={clearFilters}>
                Clear ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="dh-main-scroll">
            <ZukvoLoadingOverlay loading={loading} message="Building the report…" minHeight={340}>
              {/* ── Overview ──────────────────────────────────────── */}
              {tab === "overview" && overview && (
                <>
                  <div className="qs-statrow">
                    <StatTile compact label="Executions" value={overview.execution.total} icon={Activity} color="#2a78d6" bgColor="rgba(42,120,214,.1)" />
                    <StatTile compact label="Pass Rate" value={`${overview.execution.pass_rate}%`} icon={TrendingUp} color={STATUS_COLORS.good} bgColor="rgba(12,163,12,.1)" />
                    <StatTile compact label="Failed" value={overview.execution.failed} icon={AlertTriangle} color={STATUS_COLORS.critical} bgColor="rgba(208,59,59,.1)" />
                    <StatTile compact label="Defects" value={overview.defects.total} icon={Bug} color="#eb6834" bgColor="rgba(235,104,52,.1)" />
                    <StatTile compact label="Open Defects" value={overview.defects.open} icon={Bug} color={STATUS_COLORS.critical} bgColor="rgba(208,59,59,.1)" />
                    <StatTile compact label="Defect Density" value={overview.defects.density} icon={Target} color="#2a78d6" bgColor="rgba(42,120,214,.1)" />
                    <StatTile compact label="Rework Rate" value={`${overview.submissions.reworkRate}%`} icon={Repeat2} color={STATUS_COLORS.warning} bgColor="rgba(250,178,25,.12)" />
                    <StatTile
                      compact
                      label="Avg Days to Sign-off"
                      value={overview.submissions.avgDaysToSignoff ?? "—"}
                      icon={Clock}
                      color="#1baf7a"
                      bgColor="rgba(27,175,122,.1)"
                    />
                  </div>

                  <ChartCard
                    title="Execution outcome"
                    subtitle={`${overview.execution.executed} of ${overview.execution.total} results executed`}
                    height={90}
                  >
                    <OutcomeBar
                      passed={overview.execution.passed}
                      failed={overview.execution.failed}
                      blocked={overview.execution.blocked}
                      notExecuted={overview.execution.not_executed}
                    />
                  </ChartCard>

                  <div className="qa-grid2">
                    <ChartCard title="Pass rate over time" subtitle="Of results executed in each period">
                      <PassRateTrend data={trendData} />
                    </ChartCard>
                    <ChartCard title="Execution volume" subtitle="Results recorded, split by outcome">
                      <ExecutionTrend data={trendData} />
                    </ChartCard>
                  </div>

                  <div className="qa-grid2">
                    <ChartCard title="Defects found vs resolved" subtitle="Raised from the runs in this range">
                      <DefectFlow data={trendData} dark={dark} />
                    </ChartCard>
                    <ChartCard title="Submission pipeline" subtitle="Where reported testing currently sits" height={260}>
                      <div className="qa-kv">
                        {[
                          ["Total submissions", overview.submissions.total],
                          ["Awaiting approval", overview.submissions.awaitingApproval],
                          ["Approved", overview.submissions.approved],
                          ["Sent back", overview.submissions.sentBack],
                          ["Rework rate", `${overview.submissions.reworkRate}%`],
                          ["Critical defects open", overview.defects.criticalOpen],
                          ["Bug → ticket conversion", `${overview.defects.ticketConversion}%`],
                          ["Reopen rate", `${overview.defects.reopenRate}%`],
                        ].map(([k, v]) => (
                          <div key={String(k)} className="qa-kv__row">
                            <span>{k}</span>
                            <strong>{v}</strong>
                          </div>
                        ))}
                      </div>
                    </ChartCard>
                  </div>
                </>
              )}

              {/* ── Breakdowns ────────────────────────────────────── */}
              {["owner", "release", "scope", "run"].includes(tab) &&
                (breakdown.length === 0 ? (
                  <ChartCard title={`${breakdownLabel} report`} height={200}>
                    <EmptyChart message="No executions match these filters." />
                  </ChartCard>
                ) : asTable ? (
                  <div className="qa-chart">
                    <Table
                      className="sc-table"
                      size="small"
                      rowKey="key"
                      dataSource={breakdown}
                      pagination={{ pageSize: 20, size: "small" }}
                      scroll={{ x: 900 }}
                      columns={[
                        { title: breakdownLabel, dataIndex: "label", key: "label", fixed: "left" as const, width: 220 },
                        { title: "Runs", dataIndex: "runs", key: "runs", width: 75, align: "right" as const },
                        ...outcomeColumns,
                      ]} locale={{ emptyText: <NoData /> }}
                    />
                  </div>
                ) : (
                  renderBreakdown()
                ))}

              {/* ── Defects ───────────────────────────────────────── */}
              {tab === "defects" && defects && (
                <>
                  <div className="qs-statrow">
                    <StatTile compact label="0–2 days old" value={defects.ageing.d0_2} icon={Clock} color={STATUS_COLORS.good} bgColor="rgba(12,163,12,.1)" />
                    <StatTile compact label="3–7 days" value={defects.ageing.d3_7} icon={Clock} color={STATUS_COLORS.warning} bgColor="rgba(250,178,25,.12)" />
                    <StatTile compact label="8–30 days" value={defects.ageing.d8_30} icon={Clock} color={STATUS_COLORS.serious} bgColor="rgba(236,131,90,.12)" />
                    <StatTile compact label="Over 30 days" value={defects.ageing.d30_plus} icon={AlertTriangle} color={STATUS_COLORS.critical} bgColor="rgba(208,59,59,.1)" />
                    <StatTile compact label="Avg Open Age" value={`${defects.ageing.avgAgeDays}d`} icon={Clock} color="#2a78d6" bgColor="rgba(42,120,214,.1)" />
                  </div>

                  <div className="qa-grid2">
                    <ChartCard title="Defects by severity" subtitle="Raised from the runs in this range">
                      <RankedBar
                        data={defects.bySeverity.map((s) => ({ ...s, label: s.key }))}
                        colorBy={(r) => SEVERITY_COLOR[String(r.key).toLowerCase()] ?? STATUS_COLORS.muted}
                      />
                    </ChartCard>
                    <ChartCard title="Defects by module" subtitle="Where the defects are concentrated">
                      <RankedBar data={defects.byModule.map((m) => ({ ...m, label: m.key }))} />
                    </ChartCard>
                  </div>

                  <div className="qa-grid2">
                    <ChartCard title="Found vs resolved" subtitle="Is the backlog growing or shrinking?">
                      <DefectFlow data={trendData} dark={dark} />
                    </ChartCard>
                    <ChartCard title="Defect status" subtitle="Where each defect currently sits" height={260}>
                      <div className="qa-kv">
                        {defects.byStatus.map((s) => (
                          <div key={s.key} className="qa-kv__row">
                            <span style={{ textTransform: "capitalize" }}>{s.key}</span>
                            <strong>{s.total}</strong>
                          </div>
                        ))}
                      </div>
                    </ChartCard>
                  </div>
                </>
              )}

              {/* ── Coverage ──────────────────────────────────────── */}
              {tab === "coverage" && coverage && (
                <>
                  <div className="qs-statrow">
                    <StatTile compact label="Total Cases" value={coverage.gaps.totalCases} icon={LayoutGrid} color="#2a78d6" bgColor="rgba(42,120,214,.1)" />
                    <StatTile compact label="Ever Executed" value={`${coverage.gaps.coverage}%`} icon={TrendingUp} color={STATUS_COLORS.good} bgColor="rgba(12,163,12,.1)" />
                    <StatTile compact label="Never Run" value={coverage.gaps.neverRun} icon={AlertTriangle} color={STATUS_COLORS.critical} bgColor="rgba(208,59,59,.1)" />
                    <StatTile compact label="Not in a Suite" value={coverage.gaps.notInSuite} icon={AlertTriangle} color={STATUS_COLORS.warning} bgColor="rgba(250,178,25,.12)" />
                    <StatTile compact label="Suites Never Run" value={coverage.gaps.suitesNeverRun} icon={AlertTriangle} color={STATUS_COLORS.warning} bgColor="rgba(250,178,25,.12)" />
                    <StatTile compact label="Runs Without a Scope" value={coverage.gaps.runsWithoutScope} icon={Target} color={STATUS_COLORS.muted} bgColor="rgba(148,163,184,.14)" />
                  </div>

                  <div className="qa-grid2">
                    <ChartCard title="Cases by automation" subtitle="Manual vs automated coverage">
                      <RankedBar data={coverage.byAutomation.map((a) => ({ ...a, label: a.key }))} />
                    </ChartCard>
                    <ChartCard title="Cases by test type" subtitle="What kinds of testing exist">
                      <RankedBar data={coverage.byTestType.map((t) => ({ ...t, label: t.key }))} />
                    </ChartCard>
                  </div>

                  <ChartCard title="Cases by priority" subtitle="Is the high-priority work covered?">
                    <RankedBar data={coverage.byPriority.map((p) => ({ ...p, label: p.key }))} />
                  </ChartCard>
                </>
              )}

              {/* ── Quality signals ───────────────────────────────── */}
              {tab === "quality" && quality && (
                <>
                  <div className="qs-statrow">
                    <StatTile compact label="First-pass Yield" value={`${quality.firstPassYield.rate}%`} icon={ShieldCheck} color={STATUS_COLORS.good} bgColor="rgba(12,163,12,.1)" />
                    <StatTile compact label="Cases Retried" value={quality.firstPassYield.retried} icon={Repeat2} color={STATUS_COLORS.warning} bgColor="rgba(250,178,25,.12)" />
                    <StatTile compact label="Unstable Cases" value={quality.flakyCases.length} icon={AlertTriangle} color={STATUS_COLORS.serious} bgColor="rgba(236,131,90,.12)" />
                    <StatTile compact label="Scopes at Risk" value={quality.scopesAtRisk.length} icon={Clock} color={STATUS_COLORS.critical} bgColor="rgba(208,59,59,.1)" />
                  </div>

                  <div className="qa-chart">
                    <header className="qa-chart__head">
                      <div>
                        <h3>Unstable cases</h3>
                        <p>
                          Cases that have both passed and failed across runs — either the test is unreliable or the
                          feature is. Neither shows up in a pass-rate average.
                        </p>
                      </div>
                    </header>
                    <Table
                      className="sc-table"
                      size="small"
                      rowKey="test_case_id"
                      dataSource={quality.flakyCases}
                      pagination={false}
                      locale={{ emptyText: <NoData description={<div className="qa-chart__empty">No unstable cases — every case is consistent.</div>} /> }}
                      columns={[
                        {
                          title: "Test case",
                          key: "case",
                          render: (_: any, r: any) => (
                            <div className="sc-name__text">
                              <span className="sc-name__title">{r.case_name}</span>
                              <span className="sc-name__meta">{r.case_ref}</span>
                            </div>
                          ),
                        },
                        { title: "Attempts", dataIndex: "attempts", key: "attempts", width: 100, align: "right" as const },
                        { title: "Passed", dataIndex: "passes", key: "passes", width: 90, align: "right" as const },
                        { title: "Failed", dataIndex: "fails", key: "fails", width: 90, align: "right" as const },
                      ]}
                    />
                  </div>

                  <div className="qa-chart" style={{ marginTop: 12 }}>
                    <header className="qa-chart__head">
                      <div>
                        <h3>Scopes at risk</h3>
                        <p>Past their planned end date with testing still outstanding.</p>
                      </div>
                    </header>
                    <Table
                      className="sc-table"
                      size="small"
                      rowKey="id"
                      dataSource={quality.scopesAtRisk}
                      pagination={false}
                      locale={{ emptyText: <NoData description={<div className="qa-chart__empty">Nothing overdue — every scope is on track.</div>} /> }}
                      columns={[
                        { title: "Scope", dataIndex: "name", key: "name" },
                        { title: "QA Owner", dataIndex: "qa_owner", key: "qa_owner", width: 150, render: (v: string) => v || "—" },
                        { title: "Status", dataIndex: "status", key: "status", width: 120 },
                        {
                          title: "Progress",
                          key: "progress",
                          width: 160,
                          render: (_: any, r: any) => (
                            <div className="rn-progress">
                              <div className="rn-progress__bar">
                                <span style={{ width: `${r.progress}%` }} />
                              </div>
                              <span className="rn-progress__label">
                                {r.executed}/{r.total}
                              </span>
                            </div>
                          ),
                        },
                        {
                          title: "Overdue",
                          dataIndex: "daysOverdue",
                          key: "daysOverdue",
                          width: 110,
                          align: "right" as const,
                          render: (v: number) => `${v}d`,
                        },
                      ]}
                    />
                  </div>
                </>
              )}
            </ZukvoLoadingOverlay>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

export default function QaAnalyticsPage() {
  return (
    <Suspense fallback={<ZukvoLoader size="lg" fullscreen message="Loading QA analytics…" />}>
      <AnalyticsContent />
    </Suspense>
  );
}
