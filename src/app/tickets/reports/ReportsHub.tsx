"use client";

import NoData from "@/components/common/NoData";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  Button,
  Select,
  Tooltip,
  Dropdown,
  message,
  Input,
  Popover,
  DatePicker,
  Space,
  Segmented,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  EllipsisOutlined,
  EyeOutlined,
  ReloadOutlined as RegenOutlined,
  RightOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  DownloadOutlined,
  FileDoneOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  ExpandAltOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { SprintReportExportRunner } from "./[sprintId]/SprintReportView";
import { Sparkles } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import ReportFilters from "./ReportFilters";
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import { QaProjectSwitcher } from "@/components/qa/QaProjectGate";
import { useRouter } from "next/navigation";
import { ProjectService } from "@/services/projectService";
import {
  SprintReportsService,
  SprintReportListItem,
} from "@/services/sprintReportsService";

type ProjectOption = {
  value: string;
  label: string;
  code: string;
  description?: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

const initialsOf = (name: string) =>
  (name || "—")
    .split(/[\s-]+/)
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// Smooth area sparkline used inside the stat cards (mirrors proposals page).
const HEALTH_META: Record<string, { color: string; bg: string }> = {
  Healthy: { color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  "Moderate Risk": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "High Risk": { color: "#ff8c42", bg: "rgba(255,140,66,0.12)" },
  "Critical Sprint": { color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
};

const CARD_ACCENTS: [string, string][] = [
  ["#3b82f6", "#2563eb"],
  ["#10b981", "#059669"],
  ["#64748b", "#475569"],
];
const accentFor = (key: string): [string, string] => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
};

/**
 * Sprint Reports v2 — proposals-style workspace.
 * Left sidebar = projects. Main = generated reports for the selected project,
 * with the same topbar / stat cards / table+grid / sticky pagination structure
 * as the Proposals main page.
 */
export default function ReportsHub() {
  console.log("Forcing HMR reload for ReportsHub");
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [reports, setReports] = useState<SprintReportListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);


  const [searchText, setSearchText] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [healthFilter, setHealthFilter] = useState<string | null>(null);
  const [completionFilter, setCompletionFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── ⌘K focuses search ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Load projects ──
  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    ProjectService.getUserProjectsForTickets()
      .then((rows) => {
        if (cancelled) return;
        setProjects(rows);
        if (rows.length > 0) setProjectId(rows[0].value);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message ?? "Failed to load projects");
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchReports = async (pid: string) => {
    if (!pid) {
      setReports([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await SprintReportsService.list(pid);
      setReports(Array.isArray(rows) ? rows : (rows?.data || []));
    } catch (err: any) {
      setError(err?.message ?? "Failed to load sprint reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setReports([]);
      return;
    }
    setLoading(true);
    setError(null);
    
    SprintReportsService.list(projectId)
      .then((allRows) => {
        if (!cancelled) setReports(Array.isArray(allRows) ? allRows : (allRows?.data || []));
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message ?? "Failed to load sprint reports");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
      
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    setTablePage(1);
  }, [projectId, searchText, statusFilter, healthFilter, completionFilter, dateRange]);

  /* ── Filters ──────────────────────────────────────────────────────────
     Everything here runs over the full list: the API loads every completed
     sprint for the project and slices in JS, so the unpaginated call already
     holds the lot. Filtering client-side keeps the counts honest — a
     server-side slice would have filtered one page while the totals kept
     counting all of them. */
  const HEALTH_BANDS = [
    { value: 'healthy', label: 'Healthy · 80+', test: (n: number) => n >= 80 },
    { value: 'at-risk', label: 'At risk · 60–79', test: (n: number) => n >= 60 && n < 80 },
    { value: 'critical', label: 'Critical · below 60', test: (n: number) => n < 60 },
  ];
  const COMPLETION_BANDS = [
    { value: 'full', label: 'Fully delivered · 100%', test: (n: number) => n >= 100 },
    { value: 'high', label: '75 – 99%', test: (n: number) => n >= 75 && n < 100 },
    { value: 'mid', label: '50 – 74%', test: (n: number) => n >= 50 && n < 75 },
    { value: 'low', label: 'Below 50%', test: (n: number) => n < 50 },
  ];
  const REPORT_STATUS_OPTIONS = [
    { value: 'generated', label: 'Generated' },
    { value: 'pending', label: 'Not generated yet' },
  ];

  const activeFilterCount =
    (searchText.trim() ? 1 : 0) + (statusFilter ? 1 : 0) + (healthFilter ? 1 : 0) +
    (completionFilter ? 1 : 0) + (dateRange && (dateRange[0] || dateRange[1]) ? 1 : 0);

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter(null);
    setHealthFilter(null);
    setCompletionFilter(null);
    setDateRange(null);
  };

  const filteredReports = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const health = HEALTH_BANDS.find((b) => b.value === healthFilter);
    const completion = COMPLETION_BANDS.find((b) => b.value === completionFilter);
    return reports.filter((r) => {
      if (statusFilter === 'generated' && !r.hasReport) return false;
      if (statusFilter === 'pending' && r.hasReport) return false;
      /* A sprint with no report has no health or completion to band. */
      if (health && !(r.hasReport && health.test(r.healthScore ?? 0))) return false;
      if (completion && !(r.hasReport && completion.test(r.completionPct ?? 0))) return false;
      if (dateRange?.[0] || dateRange?.[1]) {
        if (!r.completedAt) return false;
        const d = dayjs(r.completedAt);
        if (dateRange[0] && d.isBefore(dateRange[0], 'day')) return false;
        if (dateRange[1] && d.isAfter(dateRange[1], 'day')) return false;
      }
      if (!q) return true;
      return (
        (r.sprintName || '').toLowerCase().includes(q) ||
        (r.sprintGoal || '').toLowerCase().includes(q)
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, searchText, statusFilter, healthFilter, completionFilter, dateRange]);

  const tableReports = useMemo(
    () => filteredReports.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize),
    [filteredReports, tablePage, tablePageSize],
  );
  const totalTableReports = filteredReports.length;

  const selectedProject = projects.find((p) => p.value === projectId);

  /* The rail's project list becomes the header's switcher. */
  const projectSwitcherOptions = projects.map((p) => ({
    value: p.value,
    label: p.label,
    code: (p.code || p.label || '?').slice(0, 3).toUpperCase(),
  }));

  const generatedCount = reports.filter((r) => r.hasReport).length;

  // ── Stats ──
  /* ── Banner figures ───────────────────────────────────────────────────
     The stat cards folded into the banner; the bar tracks how many completed
     sprints actually have a report behind them. */
  const bannerStats = useMemo(() => {
    const gen = reports.filter((r) => r.hasReport);
    const avg = (pick: (r: SprintReportListItem) => number | null | undefined) =>
      gen.length === 0 ? 0 : Math.round(gen.reduce((s, r) => s + (pick(r) ?? 0), 0) / gen.length);
    return {
      avgHealth: avg((r) => r.healthScore),
      avgCompletion: avg((r) => r.completionPct),
      ticketsShipped: gen.reduce((s, r) => s + (r.completedTickets ?? 0), 0),
      generatedPct: reports.length === 0 ? 0 : Math.round((gen.length / reports.length) * 100),
    };
  }, [reports]);

  const bannerAccent =
    reports.length === 0 ? '#64748b'
      : bannerStats.generatedPct === 100 ? '#10b981' : '#3b82f6';

  const handleGenerate = async (sprintId: string) => {
    setGenerating((g) => ({ ...g, [sprintId]: true }));
    try {
      const summary = await SprintReportsService.generate(sprintId);
      
      const updateFn = (prev: SprintReportListItem[]) => 
        prev.map((r) =>
          r.sprintId === sprintId
            ? {
              ...r,
              hasReport: true,
              healthScore: summary.healthScore,
              healthBand: summary.healthBand,
              completionPct: summary.completionPct,
              totalTickets: summary.totalTickets,
              completedTickets: summary.completedTickets,
              generatedAt: summary.generatedAt,
              generatedById: summary.generatedById,
            }
            : r
        );
        
      setReports(updateFn);
    } catch (err: any) {
      setError(err?.message ?? "Failed to generate report");
    } finally {
      setGenerating((g) => {
        const next = { ...g };
        delete next[sprintId];
        return next;
      });
    }
  };

  const openReport = (r: SprintReportListItem) => {
    if (r.hasReport) router.push(`/tickets/reports/${r.sprintId}`);
  };

  // ── Download (PDF / DOCX) without leaving the list ──
  const [exportTarget, setExportTarget] = useState<{
    sprintId: string;
    format: "pdf" | "docx";
  } | null>(null);
  const hideExportMsg = useRef<(() => void) | null>(null);

  const handleDownload = (sprintId: string, format: "pdf" | "docx") => {
    if (exportTarget) return; // one export at a time
    hideExportMsg.current = message.loading(
      `Preparing ${format === "pdf" ? "PDF" : "Word"} report…`,
      0
    );
    setExportTarget({ sprintId, format });
  };

  const handleExportDone = (ok: boolean) => {
    hideExportMsg.current?.();
    hideExportMsg.current = null;
    if (ok) message.success("Report downloaded");
    else message.error("Couldn't generate the report file");
    setExportTarget(null);
  };

  // Action menu shared by the table rows and the grid cards.
  const reportMenu = (r: SprintReportListItem) => ({
    items: [
      { key: "view", label: "Open report", icon: <EyeOutlined /> },
      {
        key: "pdf",
        label: "Download PDF",
        icon: <FilePdfOutlined />,
        disabled: !!exportTarget,
      },
      // {
      //   key: "docx",
      //   label: "Download Word",
      //   icon: <FileWordOutlined />,
      //   disabled: !!exportTarget,
      // },
      { type: "divider" as const },
      { key: "regen", label: "Regenerate", icon: <RegenOutlined /> },
    ],
    onClick: ({ key, domEvent }: { key: string; domEvent: any }) => {
      domEvent.stopPropagation();
      if (key === "view") openReport(r);
      else if (key === "pdf") handleDownload(r.sprintId, "pdf");
      else if (key === "docx") handleDownload(r.sprintId, "docx");
      else if (key === "regen") handleGenerate(r.sprintId);
    },
  });

  // Download-only menu (PDF / Word) for the inline download icon.
  const downloadMenu = (r: SprintReportListItem) => ({
    items: [
      { key: "pdf", label: "Download PDF", icon: <FilePdfOutlined />, disabled: !!exportTarget },
      // { key: "docx", label: "Download Word", icon: <FileWordOutlined />, disabled: !!exportTarget },
    ],
    onClick: ({ key, domEvent }: { key: string; domEvent: any }) => {
      domEvent.stopPropagation();
      handleDownload(r.sprintId, key as "pdf" | "docx");
    },
  });

  const healthPill = (band: string | null, score: number | null) => {
    const meta = (band && HEALTH_META[band]) || { color: "#64748b", bg: "rgba(100,116,139,0.10)" };
    return (
      <span className="pp-vis-pill" style={{ color: meta.color, background: meta.bg, borderColor: "transparent" }}>
        <span className="pp-vis-dot" style={{ background: meta.color }} />
        {band ?? "—"}
        {score != null ? <span style={{ marginLeft: 2, opacity: 0.8 }}>{score}</span> : null}
      </span>
    );
  };

  const completionBar = (r: SprintReportListItem) => {
    const pct =
      r.completionPct != null
        ? Math.round(r.completionPct)
        : r.totalTickets && r.totalTickets > 0
          ? Math.round(((r.completedTickets ?? 0) / r.totalTickets) * 100)
          : 0;
    return (
      <div className="rh-bar-wrap">
        <div className="rh-bar-track">
          <div className="rh-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <span className="rh-bar-pct">{pct}%</span>
      </div>
    );
  };

  // ── Table columns ──
  const columns: ColumnsType<SprintReportListItem> = [
    {
      title: "SPRINT",
      dataIndex: "sprintName",
      key: "sprintName",
      width: 360,
      render: (_: any, r) => (
        <div className="pp-name-cell">
          <div className="pp-name-icon"><FileTextOutlined style={{ fontSize: 14 }} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="pp-name-title">{r.sprintName || "Untitled sprint"}</div>
            {r.sprintGoal ? <div className="rh-sub">{r.sprintGoal}</div> : null}
          </div>
        </div>
      ),
    },
    {
      title: "HEALTH",
      key: "health",
      width: 150,
      render: (_: any, r) =>
        r.hasReport ? healthPill(r.healthBand, r.healthScore) : <span className="pp-muted">—</span>,
    },
    {
      title: "COMPLETION",
      key: "completion",
      width: 140,
      render: (_: any, r) => (r.hasReport ? completionBar(r) : <span className="pp-muted">—</span>),
    },
    {
      title: "TICKETS",
      key: "tickets",
      width: 110,
      render: (_: any, r) =>
        r.hasReport ? (
          <span className="rh-tickets">
            <strong>{r.completedTickets ?? 0}</strong>
            <span className="pp-muted"> / {r.totalTickets ?? 0}</span>
          </span>
        ) : (
          <span className="pp-muted">—</span>
        ),
    },
    {
      title: "GENERATED",
      key: "generated",
      width: 112,
      ellipsis: true,
      render: (_: any, r) =>
        r.hasReport && r.generatedAt ? (
          <div className="pp-date">
            <span className="pp-date-main">{fmtDate(r.generatedAt)}</span>
            <span className="pp-date-sub">{r.generatedByName || "—"}</span>
          </div>
        ) : (
          <div className="pp-date">
            <span className="pp-date-main">Completed</span>
            <span className="pp-date-sub">{fmtDate(r.completedAt)}</span>
          </div>
        ),
    },
    {
      title: "ACTION",
      key: "actions",
      align: "right" as const,
      width: 160,
      render: (_: any, r) =>
        r.hasReport ? (
          <div className="rh-actions">
            <Button
              size="small"
              className="rh-act-btn"
              icon={<RegenOutlined spin={!!generating[r.sprintId]} />}
              disabled={!!generating[r.sprintId]}
              onClick={(e) => {
                e.stopPropagation();
                handleGenerate(r.sprintId);
              }}
            >
              Regenerate
            </Button>
            <Dropdown menu={downloadMenu(r)} trigger={["click"]} placement="bottomRight">
              <Tooltip title="Download">
                <Button
                  size="small"
                  className="pp-icon-btn"
                  icon={<DownloadOutlined />}
                  loading={exportTarget?.sprintId === r.sprintId}
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Dropdown>
          </div>
        ) : (
          <Button
            type="primary"
            size="small"
            className="rh-gen-btn"
            loading={!!generating[r.sprintId]}
            icon={!generating[r.sprintId] ? <ThunderboltOutlined /> : undefined}
            onClick={(e) => {
              e.stopPropagation();
              handleGenerate(r.sprintId);
            }}
          >
            Generate
          </Button>
        ),
    },
  ];

  const total = totalTableReports;
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));

  const emptyState = (
    <div className="pp-empty">
      <div className="pp-empty-orb"><Sparkles size={26} /></div>
      <div className="pp-empty-title">
        {activeFilterCount > 0 ? "No sprints match these filters" : "No reports yet"}
      </div>
      <div className="pp-empty-sub">
        {activeFilterCount > 0
          ? "Try widening your search or clearing the filters."
          : "Reports appear here once a sprint in this project is completed."}
      </div>
      {activeFilterCount > 0 && (
        <Button size="small" onClick={resetFilters} style={{ marginTop: 12 }}>
          Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="pp-shell">
      {exportTarget ? (
        <SprintReportExportRunner
          sprintId={exportTarget.sprintId}
          format={exportTarget.format}
          onDone={handleExportDone}
        />
      ) : null}
      {/* ============================ MAIN ============================ */}
      <main className="pp-main">
        {/* ── Header row — project, search, view controls ────────────── */}
        <div className="saas-header-container sc-header">
          <QaProjectSwitcher
            projects={projectSwitcherOptions}
            value={projectId || null}
            onChange={(id: string | null) => setProjectId(id || "")}
            loading={projectsLoading}
            placeholder="Select a project"
          />

          <Divider type="vertical" style={{ height: 24, margin: 0, opacity: 0.5 }} />

          <div className="sc-header-controls">
            <Input
              placeholder="Quick search sprints, reports..."
              prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />}
              className="saas-input"
              style={{ maxWidth: 280, borderRadius: 8, height: 30, background: 'transparent', fontSize: 12 }}
              value={searchText}
              onChange={(e: any) => setSearchText(e.target.value)}
              allowClear
            />

            <Space.Compact className="ticket-filter-group">
              <Popover
                content={
                  <ReportFilters
                    filters={{
                      status: statusFilter || undefined,
                      health: healthFilter || undefined,
                      completion: completionFilter || undefined,
                      dateRange,
                    }}
                    onFilterChange={(key: any, val: any) => {
                      if (key === 'status') setStatusFilter(val || null);
                      if (key === 'health') setHealthFilter(val || null);
                      if (key === 'completion') setCompletionFilter(val || null);
                      if (key === 'dateRange') setDateRange(val);
                    }}
                    onReset={resetFilters}
                    statusOptions={REPORT_STATUS_OPTIONS}
                    healthOptions={HEALTH_BANDS.map(({ value, label }) => ({ value, label }))}
                    completionOptions={COMPLETION_BANDS.map(({ value, label }) => ({ value, label }))}
                  />
                }
                trigger="click"
                open={isFilterPanelOpen}
                onOpenChange={setIsFilterPanelOpen}
                placement="bottomLeft"
                overlayClassName="tf-popover-overlay"
                styles={{ body: { padding: 0 } }}
              >
                <Button
                  icon={<FilterOutlined />}
                  disabled={!projectId}
                  className={activeFilterCount > 0 ? 'saas-tag-blue' : ''}
                  style={{ height: 30, fontWeight: 600, fontSize: 12 }}
                >
                  Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              </Popover>
              <Button
                icon={<ExpandAltOutlined />}
                style={{ height: 30 }}
                disabled={!projectId}
                aria-label="Expand filters"
                onClick={() => setIsFilterRowOpen((v) => !v)}
              />
            </Space.Compact>
          </div>

          <Space size={10} className="sc-header-right">
            <Segmented
              className="saas-segmented-premium"
              value={view}
              onChange={(v: any) => setView(v)}
              options={[
                { value: 'list', label: (<Tooltip title="List View" mouseEnterDelay={0.5}><span style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}><UnorderedListOutlined style={{ fontSize: 13 }} /></span></Tooltip>) },
                { value: 'grid', label: (<Tooltip title="Grid View" mouseEnterDelay={0.5}><span style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}><AppstoreOutlined style={{ fontSize: 13 }} /></span></Tooltip>) },
              ]}
            />

            <Tooltip title="Refresh reports">
              <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={() => fetchReports(projectId)}
                disabled={loading || !projectId}
                style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>
          </Space>
        </div>

        {/* ── Inline filter row — the pill strip the Ticket List uses ── */}
        {isFilterRowOpen && projectId && (
          <div className="tl-filter-row">
            <div className="tl-filter-row-label">
              <FilterOutlined style={{ fontSize: 11 }} />
              <span>Filters</span>
              <span className="tl-filter-row-count">{activeFilterCount > 0 ? activeFilterCount : '0'}</span>
            </div>
            <div className="tl-filter-row-pills">
              <TicketFilterPill
                icon={<FileDoneOutlined style={{ fontSize: 11 }} />}
                label="Report"
                value={statusFilter || ""}
                options={REPORT_STATUS_OPTIONS}
                onChange={(val: any) => setStatusFilter(val || null)}
                itemNoun="states"
                multiple={false}
              />
              <TicketFilterPill
                icon={<HeartOutlined style={{ fontSize: 11 }} />}
                label="Health"
                value={healthFilter || ""}
                options={HEALTH_BANDS.map(({ value, label }) => ({ value, label }))}
                onChange={(val: any) => setHealthFilter(val || null)}
                itemNoun="bands"
                width={220}
                multiple={false}
              />
              <TicketFilterPill
                icon={<CheckCircleOutlined style={{ fontSize: 11 }} />}
                label="Completion"
                value={completionFilter || ""}
                options={COMPLETION_BANDS.map(({ value, label }) => ({ value, label }))}
                onChange={(val: any) => setCompletionFilter(val || null)}
                itemNoun="ranges"
                width={220}
                multiple={false}
              />
              <DatePicker.RangePicker
                className="premium-range-picker"
                size="small"
                style={{ height: 28 }}
                value={dateRange as any}
                onChange={(v) => setDateRange(v as any)}
                format="DD MMM YY"
                allowEmpty={[true, true]}
              />
            </div>
            <div className="tl-filter-row-actions">
              {activeFilterCount > 0 && (
                <button type="button" className="tl-filter-row-reset" onClick={resetFilters}>
                  <ReloadOutlined style={{ fontSize: 10 }} />
                  Reset
                </button>
              )}
              <button
                type="button"
                className="tl-filter-row-close"
                onClick={() => setIsFilterRowOpen(false)}
                aria-label="Close filters"
                title="Close filters"
              >
                <CloseOutlined style={{ fontSize: 10 }} />
              </button>
            </div>
          </div>
        )}

        {/* ── Overview banner — the Ticket List's sprint head, reading the
             report library for this project. ─────────────────────────── */}
        <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
          <div className="tl-sprint-row1">
            <div className="tl-sprint-title-block">
              <span
                className="tl-sprint-dot"
                style={{ background: bannerAccent, boxShadow: `0 0 0 3px ${bannerAccent}33` }}
              />
              <span className="tl-sprint-title rh-banner-title">
                Sprint Reports — {selectedProject?.label ?? "Select a project"}
              </span>
              <span className="tl-sprint-tags">
                <span className="tl-sprint-tag tl-sprint-tag-active">{generatedCount} GENERATED</span>
                <span className="tl-sprint-tag tl-sprint-tag-neutral">{reports.length} COMPLETED SPRINTS</span>
                {activeFilterCount > 0 && (
                  <span className="tl-sprint-tag tl-sprint-tag-running">{activeFilterCount} FILTERED</span>
                )}
              </span>
            </div>
          </div>

          <div className="tl-sprint-row2">
            <span className="tl-sprint-meta">
              <span className="pp-pulse" />
              <b>{bannerStats.avgHealth}</b> average health
            </span>
            <span className="tl-sprint-meta"><b>{bannerStats.avgCompletion}%</b> average completion</span>
            <span className="tl-sprint-meta"><b>{bannerStats.ticketsShipped}</b> tickets shipped</span>
            <span className="tl-sprint-meta">
              Reports are generated when a sprint is completed.
            </span>
          </div>

          <div className="tl-sprint-row3">
            <div className="tl-sprint-progress-bar">
              <div className="tl-sprint-progress-fill" style={{ width: `${Math.min(100, bannerStats.generatedPct)}%` }} />
            </div>
            <span className="tl-sprint-progress-pct">{bannerStats.generatedPct}%</span>
          </div>
        </div>

        {error ? <div className="rh-error">{error}</div> : null}

        {/* Body */}
        <div className="pp-body">
          {view === "list" ? (
            <div className="pp-table-wrap">
              <Table
                columns={columns}
                dataSource={tableReports}
                loading={loading}
                rowKey="sprintId"
                size="small"
                className="pp-table"
                scroll={{ x: 'max-content' }}
                pagination={false}
                locale={{ emptyText: <NoData description={emptyState} /> }}
                onRow={(record) => ({
                  onClick: (e) => {
                    const t = e.target as HTMLElement;
                    if (t.closest("button, .ant-dropdown-trigger")) return;
                    openReport(record);
                  },
                  className: record.hasReport ? "pp-row" : "rh-row-locked",
                })}
              />
            </div>
          ) : (
            <div className="pp-grid">
              {loading ? (
                <div className="pp-grid-loading">Loading…</div>
              ) : tableReports.length === 0 ? (
                <div style={{ gridColumn: "1 / -1" }}><NoData description={emptyState} /></div>
              ) : (
                tableReports.map((r) => {
                  const accent = accentFor(r.sprintId);
                  const pct =
                    r.completionPct != null ? Math.round(r.completionPct) : 0;
                  return (
                    <div
                      key={r.sprintId}
                      className="pc-card"
                      style={{ cursor: r.hasReport ? "pointer" : "default" }}
                      onClick={() => openReport(r)}
                    >
                      <div className="pc-top">
                        <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
                          {initialsOf(r.sprintName || "S")}
                        </div>
                        <div className="pc-identity-body">
                          <div className="pc-title">{r.sprintName || "Untitled sprint"}</div>
                          <div className="pc-client-line">
                            <span className="pc-client-key">
                              {r.hasReport && r.generatedAt ? "Generated:" : "Completed:"}
                            </span>
                            <span className="pc-client-val">
                              {fmtDate(r.hasReport ? r.generatedAt : r.completedAt)}
                            </span>
                          </div>
                        </div>
                        {r.hasReport ? (
                          <Dropdown menu={reportMenu(r)} trigger={["click"]} placement="bottomRight">
                            <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                              <EllipsisOutlined />
                            </button>
                          </Dropdown>
                        ) : null}
                      </div>

                      <div className="pc-foot">
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Health</span>
                            {r.hasReport ? healthPill(r.healthBand, r.healthScore) : <span className="pp-muted">—</span>}
                          </span>
                          <span className="pc-foot-div" />
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Tickets</span>
                            <span className="pc-foot-val">{r.hasReport ? `${r.completedTickets ?? 0} / ${r.totalTickets ?? 0}` : "—"}</span>
                          </span>
                        </div>
                        <div className="pc-foot-row">
                          {r.hasReport ? (
                            <>
                              <span className="pc-foot-item" style={{ flex: 1, minWidth: 0 }}>
                                <span className="pc-foot-key">Completion</span>
                                <span className="rh-bar-wrap" style={{ flex: 1 }}>
                                  <span className="rh-bar-track">
                                    <span className="rh-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                                  </span>
                                  <span className="rh-bar-pct">{pct}%</span>
                                </span>
                              </span>
                              <span className="pc-foot-div" />
                              <button
                                type="button"
                                className="pc-foot-item pc-view-btn"
                                onClick={(e) => { e.stopPropagation(); openReport(r); }}
                              >
                                <EyeOutlined />
                                View report
                                <RightOutlined style={{ fontSize: 9 }} />
                              </button>
                            </>
                          ) : (
                            <Button
                              type="primary"
                              size="small"
                              className="rh-gen-btn"
                              loading={!!generating[r.sprintId]}
                              icon={!generating[r.sprintId] ? <ThunderboltOutlined /> : undefined}
                              onClick={(e) => { e.stopPropagation(); handleGenerate(r.sprintId); }}
                            >
                              Generate report
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="pp-footer pp-footer--sticky">
            <div className="pp-footer-info">
              Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
            </div>
            <div className="pp-pager">
              <button type="button" className="pp-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
                <button key={p} type="button" className={`pp-pager-num ${p === tablePage ? "is-active" : ""}`} onClick={() => setTablePage(p)}>{p}</button>
              ))}
              <button type="button" className="pp-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
              <Select
                className="pp-pagesize"
                value={tablePageSize}
                onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
                options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
                popupMatchSelectWidth={120}
              />
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .pp-shell {
          display: flex;
          margin: 0;
          height: 100%;
          overflow: hidden;
          background: var(--bg-pure-white);
        }

        /* ---------------- Main ---------------- */
        .pp-main { flex: 1; min-width: 0; padding: 0; display: flex; flex-direction: column; overflow-y: auto; }

        /* ── Header row, matched to the Ticket List ─────────────────────── */
        .sc-header {
          position: sticky;
          top: 0;
          z-index: 100;
          margin: 0;
          padding: 9.7px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .sc-header { background: #0f1419; border-bottom-color: #1f2937; }
        .sc-header-controls { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .sc-header-right { flex-shrink: 0; }

        /* ── Overview banner ────────────────────────────────────────────── */
        .tl-section-head {
          padding: 10px 16px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-section-head { background: #0f1419; border-bottom-color: #1f2937; }
        .tl-sprint-head-v2 { display: flex; flex-direction: column; gap: 6px; }
        .tl-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .tl-sprint-title-block { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
        .tl-sprint-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .rh-banner-title {
          font-size: 14px; font-weight: 800; color: var(--text-slate-900);
          letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        [data-theme='dark'] .rh-banner-title { color: #f1f5f9; }
        .tl-sprint-tags { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .tl-sprint-tag {
          display: inline-flex; align-items: center; height: 18px; padding: 0 6px;
          font-size: 9px; font-weight: 800; letter-spacing: 0.04em; border-radius: 4px;
          border: 1px solid transparent; text-transform: uppercase; line-height: 1;
        }
        .tl-sprint-tag-active { background: transparent; color: #10b981; border-color: rgba(16,185,129,0.32); }
        .tl-sprint-tag-neutral { background: transparent; color: #64748b; border-color: rgba(100,116,139,0.32); }
        .tl-sprint-tag-running { background: transparent; color: #3b82f6; border-color: rgba(59,130,246,0.32); }
        [data-theme='dark'] .tl-sprint-tag-active { color: #34d399; }

        .tl-sprint-row2 { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding-left: 15px; }
        .tl-sprint-meta {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -0.005em;
        }
        .tl-sprint-meta b { color: var(--text-slate-900); font-weight: 800; }
        [data-theme='dark'] .tl-sprint-meta { color: #94a3b8 !important; }
        [data-theme='dark'] .tl-sprint-meta b { color: #f1f5f9 !important; }

        .tl-sprint-row3 { display: flex; align-items: center; gap: 12px; padding-left: 15px; }
        .tl-sprint-progress-bar {
          flex: 1 1 auto; position: relative; height: 6px;
          background: var(--bg-slate-100); border-radius: 999px; overflow: hidden; min-width: 60px;
        }
        [data-theme='dark'] .tl-sprint-progress-bar { background: #1f2937 !important; }
        .tl-sprint-progress-fill {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          border-radius: 999px; transition: width 0.4s ease;
        }
        .tl-sprint-progress-pct {
          flex-shrink: 0; font-size: 12px; font-weight: 800; color: var(--text-slate-900);
          font-variant-numeric: tabular-nums; min-width: 36px; text-align: right;
        }
        [data-theme='dark'] .tl-sprint-progress-pct { color: #f1f5f9 !important; }

        /* ── Inline filter row ──────────────────────────────────────────── */
        .tl-filter-row {
          display: flex; align-items: center; gap: 10px; padding: 8px 16px;
          background: var(--bg-slate-50); border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-filter-row { background: #0f1419; border-bottom-color: #1f2937; }
        .tl-filter-row-label {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 10.5px; font-weight: 800; color: var(--text-slate-500);
          text-transform: uppercase; letter-spacing: 0.08em; flex-shrink: 0;
        }
        .tl-filter-row-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; padding: 0 6px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500); border-radius: 999px;
          font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .tl-filter-row-pills { flex: 1 1 auto; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .tl-filter-row-actions { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; }
        .tl-filter-row-reset {
          display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px;
          background: transparent; border: 1px dashed var(--border-slate-200); border-radius: 8px;
          font-family: inherit; font-size: 11px; font-weight: 700; color: var(--text-slate-500); cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .tl-filter-row-reset:hover {
          color: #1d4ed8; border-color: rgba(59,130,246,0.45);
          background: rgba(59,130,246,0.06); border-style: solid;
        }
        .tl-filter-row-close {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; background: transparent;
          border: 1px solid var(--border-slate-200); border-radius: 8px;
          color: var(--text-slate-500); cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .tl-filter-row-close:hover { color: var(--text-slate-900); background: var(--bg-pure-white); border-color: var(--text-slate-400); }
        [data-theme='dark'] .tl-filter-row-label { color: #94a3b8; }
        [data-theme='dark'] .tl-filter-row-count { background: #111720; border-color: #2d3748; color: #cbd5e1; }
        [data-theme='dark'] .tl-filter-row-reset,
        [data-theme='dark'] .tl-filter-row-close { border-color: #2d3748; color: #94a3b8; }
        @media (max-width: 900px) { .tl-filter-row-label { display: none; } }

        /* The card grid keeps a gutter; the table runs edge to edge. */
        .pp-grid { padding: 12px 16px 16px; }
        .rh-error { margin: 12px 16px 0; }

        @media (max-width: 900px) {
          .tl-sprint-row2, .tl-sprint-row3 { padding-left: 0; }
        }
        .pp-body { flex: 1 0 auto; min-width: 0; }

        /* Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table .ant-table, .pp-table .ant-table-wrapper, .pp-table .ant-table-container, .pp-table .ant-table-content, .pp-table .ant-table-header, .pp-table .ant-table-body {
          background: transparent !important;
          border-radius: 0 !important;
        }
        .pp-table .ant-table-thead > tr > th, .pp-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em !important;
          text-transform: uppercase !important; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
        }
        [data-theme='dark'] .pp-table .ant-table-thead > tr > th,
        [data-theme='dark'] .pp-table .ant-table-thead > tr > td {
          background: #161B22 !important;
          color: #94A3B8 !important;
          border-bottom-color: #374151 !important;
        }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }

        .pp-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .pp-name-icon {
          width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; color: #3B82F6;
          background: var(--bg-blue-50);
        }
        .pp-name-icon .anticon { font-size: 12px !important; }
        .pp-name-title { font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rh-sub { font-size: 10.5px; color: var(--text-slate-400); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; margin-top: 1px; }

        .pp-muted { color: var(--text-slate-400); }
        .pp-date { display: flex; flex-direction: column; line-height: 1.25; }
        .pp-date-main { font-size: 11px; font-weight: 500; color: var(--text-slate-700); }
        .pp-date-sub { font-size: 9.5px; color: var(--text-slate-400); }
        .rh-tickets { font-size: 12px; color: var(--text-slate-700); }
        .rh-tickets strong { font-weight: 700; }

        .pp-vis-pill {
          display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
          border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
        }
        .pp-vis-dot { width: 6px; height: 6px; border-radius: 50%; }
        .pp-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        .pp-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

        .rh-bar-wrap { display: flex; align-items: center; gap: 8px; min-width: 88px; }
        .rh-bar-track { flex: 1; height: 6px; background: var(--bg-slate-100); border-radius: 99px; overflow: hidden; }
        .rh-bar-fill { display: block; height: 100%; border-radius: 99px; background: #10b981; }
        .rh-bar-pct { font-size: 11px; font-weight: 700; color: var(--text-slate-700); min-width: 32px; text-align: right; font-variant-numeric: tabular-nums; }

        .rh-gen-btn { background: #3b82f6 !important; border: none !important; border-radius: 8px !important; font-weight: 600 !important; box-shadow: none !important; }
        .rh-gen-btn:hover { background: #2563eb !important; }
        .rh-actions { display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; }
        .rh-act-btn {
          border-radius: 8px !important; border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important; color: var(--text-slate-700) !important;
          font-weight: 600 !important; font-size: 12px !important; box-shadow: none !important;
        }
        .rh-act-btn:not(:disabled):hover { color: #4f46e5 !important; border-color: #c7d2fe !important; }
        .rh-error {
          margin-bottom: 12px; padding: 10px 12px; border-radius: 8px;
          border: 1px solid rgba(239,68,68,0.25); background: rgba(239,68,68,0.06); color: #b91c1c; font-size: 13px;
        }

        /* Footer + pager */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 0 14px; border-top: 1px solid var(--border-slate-200); height: 52px !important; box-sizing: border-box;
        }
        .pp-footer--sticky {
          position: sticky; bottom: 0; z-index: 30; margin: 8px -18px 0; padding: 0 18px;
          background: var(--bg-primary) !important;
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          height: 52px !important; box-sizing: border-box;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Empty + grid */
        .pp-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .pp-empty-orb {
          width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
        }
        .pp-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; text-align: center; max-width: 360px; }
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }
        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 12px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-val { font-weight: 600; }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
        .pc-view-btn { background: none; border: none; cursor: pointer; padding: 0; color: #3B82F6; font-weight: 700; font-size: 11.5px; }
        .pc-view-btn .anticon { font-size: 12px; }
        .pc-view-btn:hover { text-decoration: underline; }

        @media (max-width: 700px) { .pp-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

