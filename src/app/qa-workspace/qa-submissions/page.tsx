"use client";
import { message } from "@/providers/AntdGlobalProvider";

import NoData from "@/components/common/NoData";
/**
 * QA Submissions — dashboard and list (§4, §5).
 *
 * A scope is submitted more than once over its life (initial results, retest,
 * final), so this page lists submission *milestones*, not one row per scope.
 * The status column carries the real meaning — "140 passed / 10 failed,
 * Submitted" and "150 passed, QA Signed-off" are both valid states, and the
 * dashboard distinguishes them rather than collapsing everything into
 * pass/fail (§31).
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Input, Select, Tooltip, DatePicker, App, Popover, Space  } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FileDoneOutlined,
  FilterOutlined,
  ExpandAltOutlined,
  ProjectOutlined,
  AimOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  FileCheck2,
  FileEdit,
  Send,
  RefreshCcw,
  CheckCircle2,
  ShieldCheck,
  ThumbsUp,
  Undo2,
  Eye,
  Pencil,
  Trash2,
  Layers,
  Menu,
  RotateCw,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import type { SortOrder } from "antd/es/table/interface";

import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import QaSubmissionsFilters from "./QaSubmissionsFilters";
import ZukvoLoader, { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { MembersService } from "@/services/membersService";
import { ProjectService } from "@/services/projectService";
import QaSubmissionService, {
  RECOMMENDATIONS,
  SUBMISSION_STATUSES,
  type QaRecommendation,
  type SubmissionListItem,
  type SubmissionStats,
  type SubmissionStatus,
} from "@/services/qaSubmissionService";
import {
  QA_SUBMISSION_STYLES,
  RecommendationPill,
  StatTile,
  StatusPill,
  fmtDate,
  initialsOf,
} from "./shared";

const { RangePicker } = DatePicker;

/**
 * The dashboard cards, in workflow order. `statuses` is what each card filters
 * the list down to — "Submitted" covers Under Review too, since both mean
 * "reported and waiting on someone".
 */
const DASHBOARD_CARDS: Array<{
  key: keyof SubmissionStats;
  label: string;
  icon: any;
  color: string;
  bg: string;
  sub: string;
  statuses?: SubmissionStatus[];
}> = [
  { key: "total", label: "Total Submissions", icon: Layers, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", sub: "all milestones" },
  { key: "draft", label: "Draft", icon: FileEdit, color: "#64748b", bg: "rgba(100,116,139,0.1)", sub: "being prepared", statuses: ["Draft"] },
  { key: "submitted", label: "Submitted", icon: Send, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", sub: "awaiting action", statuses: ["Submitted", "Under Review"] },
  { key: "retesting", label: "Retesting", icon: RefreshCcw, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", sub: "validating fixes", statuses: ["Retesting"] },
  { key: "ready_for_signoff", label: "Ready for Sign-off", icon: CheckCircle2, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", sub: "testing complete", statuses: ["Ready for QA Sign-off"] },
  { key: "approved", label: "Approved", icon: ThumbsUp, color: "#10b981", bg: "rgba(16,185,129,0.12)", sub: "accepted — awaiting QA sign-off", statuses: ["Approved"] },
  { key: "qa_signed_off", label: "QA Signed-off", icon: ShieldCheck, color: "#10b981", bg: "rgba(16,185,129,0.12)", sub: "closed by QA", statuses: ["QA Signed-off"] },
  { key: "sent_back", label: "Sent Back", icon: Undo2, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", sub: "needs QA attention", statuses: ["Sent Back"] },
];

function QaSubmissionsContent() {
  useActivitySource({ section: "WORK", module: "QA", page: "QaSubmissions" });

  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    canReadSubmission,
    canCreateSubmission,
    canUpdateSubmission,
    canDeleteSubmission,
  } = usePermission();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [rows, setRows] = useState<SubmissionListItem[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scopes, setScopes] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Filters (§5)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string | undefined>();
  const [ownerFilter, setOwnerFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    searchParams.get("status") || undefined,
  );
  const [recommendationFilter, setRecommendationFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | undefined>();
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, scopeFilter, ownerFilter, statusFilter, recommendationFilter, dateRange, projectFilter]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await QaSubmissionService.list({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        scopeId: scopeFilter,
        qaOwnerId: ownerFilter,
        status: statusFilter as SubmissionStatus | undefined,
        recommendation: recommendationFilter as QaRecommendation | undefined,
        from: dateRange?.[0]?.format("YYYY-MM-DD"),
        to: dateRange?.[1]?.format("YYYY-MM-DD"),
        sortBy,
        sortDir,
        projectName: projectFilter || undefined,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch {
      message.error("Failed to load QA submissions");
    } finally {
      setLoading(false);
    }
  }, [
    page, pageSize, debouncedSearch, scopeFilter, ownerFilter, statusFilter,
    recommendationFilter, dateRange, sortBy, sortDir, message, projectFilter,
  ]);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await QaSubmissionService.getStats());
    } catch {
      /* the cards simply stay blank — not worth a toast over */
    }
  }, []);

  useEffect(() => {
    if (!canReadSubmission) return;
    fetchList();
  }, [canReadSubmission, fetchList]);

  useEffect(() => {
    if (!canReadSubmission) return;
    fetchStats();
    (async () => {
      try {
        const scopeRes = await axios.get("/api/v2/qa/test-scopes?limit=1000").catch(() => null);
        if (scopeRes) {
          setScopes(Array.isArray(scopeRes) ? scopeRes : (scopeRes as any)?.data?.data || (scopeRes as any)?.data || []);
        }

        const memberRes = await MembersService.getMembers({ limit: 500 }).catch(() => null);
        if (memberRes) {
          setMembers(memberRes.data || []);
        }

        const projectRes = await ProjectService.getUserProjects(true).catch(() => null);
        if (projectRes) {
          const plist: any[] = Array.isArray(projectRes) ? projectRes : (projectRes as any)?.data ?? [];
          setProjectOptions(
            plist
              .map((p: any) => ({ value: String(p.label ?? p.name ?? ''), label: String(p.label ?? p.name ?? '') }))
              .filter(o => o.value)
          );
        }
      } catch (err) {
        console.error("Error loading QA filter options:", err);
      }
    })();
  }, [canReadSubmission, fetchStats]);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        fetchList(),
        fetchStats()
      ]);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await QaSubmissionService.remove(id);
      message.success("QA Submission deleted");
      fetchList();
      fetchStats();
    } catch (e: any) {
      message.error(e?.response?.data?.error || "Failed to delete the submission");
    }
  };

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (scopeFilter ? 1 : 0) +
    (ownerFilter ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (recommendationFilter ? 1 : 0) +
    (dateRange?.[0] ? 1 : 0) +
    (projectFilter ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setScopeFilter(undefined);
    setOwnerFilter(undefined);
    setStatusFilter(undefined);
    setRecommendationFilter(undefined);
    setDateRange(null);
    setProjectFilter(undefined);
  };

  /** Clicking a dashboard card filters the list to that card's statuses. */
  const applyCardFilter = (card: (typeof DASHBOARD_CARDS)[number]) => {
    if (!card.statuses) {
      setStatusFilter(undefined);
      return;
    }
    setStatusFilter(statusFilter === card.statuses[0] ? undefined : card.statuses[0]);
  };

  const scopeOptions = useMemo(
    () => scopes.map((s: any) => ({ value: s.id, label: s.name, description: s.type })),
    [scopes],
  );
  const memberOptions = useMemo(
    () => members.map((m: any) => ({ value: String(m.id), label: m.name, avatarUrl: m.avatarUrl })),
    [members],
  );

  const openSubmission = (id: string) => router.push(`/qa-workspace/qa-submissions/${id}`);

  if (!canReadSubmission) return null;

  /**
   * A cold load has nothing behind the blur yet. Distinguished from a refetch,
   * where the previous rows stay in place and blur — which is the whole point of
   * the overlay: the list doesn't collapse and reflow on every filter change.
   */
  const firstLoad = loading && rows.length === 0;

  /** Reflects the server-side sort back onto the column headers. */
  const sortOrderFor = (field: string): SortOrder =>
    sortBy === field ? (sortDir === "asc" ? "ascend" : "descend") : null;

  const numCell = (value: number, tone?: "pass" | "fail") => (
    <span
      className={`qs-num${value === 0 ? " qs-num--zero" : ""}`}
      style={value > 0 && tone === "fail" ? { color: "#dc2626" } : value > 0 && tone === "pass" ? { color: "#047857" } : undefined}
    >
      {value}
    </span>
  );

  const columns = [
    {
      title: "Submission",
      dataIndex: "submission_name",
      key: "submission_name",
      width: 280,
      fixed: "left" as const,
      // Sorting is server-side — the page only holds one page of rows.
      sorter: true,
      sortOrder: sortOrderFor("submission_name"),
      render: (name: string, r: SubmissionListItem) => (
        <div className="sc-name">
          <span className="sc-name__badge">{initialsOf(name)}</span>
          <span className="sc-name__text">
            <span className="sc-name__title" title={name}>
              {name}
            </span>
            <span className="sc-name__meta">
              {r.submission_type} · v{r.version}
            </span>
          </span>
        </div>
      ),
    },
    {
      title: "Scope",
      dataIndex: "scope_name",
      key: "scope_name",
      width: 170,
      render: (v: string) => <span className="qs-num" style={{ fontWeight: 500 }}>{v || "—"}</span>,
    },
    {
      title: "QA Owner",
      dataIndex: "qa_owner_name",
      key: "qa_owner_name",
      width: 150,
      render: (v: string) => v || <span className="qs-muted">Unassigned</span>,
    },
    { title: "Runs", dataIndex: "run_count", key: "run_count", width: 70, align: "right" as const, render: (v: number) => numCell(v) },
    { title: "Total", dataIndex: "total_cases", key: "total_cases", width: 75, align: "right" as const, render: (v: number) => numCell(v) },
    { title: "Passed", dataIndex: "passed", key: "passed", width: 80, align: "right" as const, render: (v: number) => numCell(v, "pass") },
    { title: "Failed", dataIndex: "failed", key: "failed", width: 80, align: "right" as const, render: (v: number) => numCell(v, "fail") },
    { title: "Blocked", dataIndex: "blocked", key: "blocked", width: 85, align: "right" as const, render: (v: number) => numCell(v) },
    { title: "Open Bugs", dataIndex: "open_bugs", key: "open_bugs", width: 100, align: "right" as const, render: (v: number) => numCell(v, "fail") },
    {
      title: "Recommendation",
      dataIndex: "qa_recommendation",
      key: "qa_recommendation",
      width: 185,
      sorter: true,
      sortOrder: sortOrderFor("qa_recommendation"),
      render: (v: QaRecommendation) => <RecommendationPill value={v} size="sm" />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 175,
      sorter: true,
      sortOrder: sortOrderFor("status"),
      render: (v: SubmissionStatus) => <StatusPill status={v} size="sm" />,
    },
    {
      title: "Submitted On",
      dataIndex: "submitted_at",
      key: "submitted_at",
      width: 130,
      sorter: true,
      sortOrder: sortOrderFor("submitted_at"),
      render: (v: string) => <span className="qs-num" style={{ fontWeight: 500 }}>{fmtDate(v)}</span>,
    },
    {
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 130,
      sorter: true,
      sortOrder: sortOrderFor("updated_at"),
      render: (v: string) => <span className="qs-num" style={{ fontWeight: 500 }}>{fmtDate(v)}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "right" as const,
      fixed: "right" as const,
      render: (_: any, r: SubmissionListItem) => {
        // A signed-off record is history — editing and deleting are hidden
        // rather than shown-and-rejected (§24, §32).
        const locked = r.status === "QA Signed-off" || r.status === "Approved";
        return (
          <div className="sc-rowactions" onClick={(e) => e.stopPropagation()}>
            <Tooltip title="View">
              <button className="qs-iconbtn" onClick={() => openSubmission(r.id)} aria-label="View">
                <Eye size={15} />
              </button>
            </Tooltip>
            {canUpdateSubmission && !locked && (
              <Tooltip title="Edit">
                <button
                  className="qs-iconbtn"
                  onClick={() => router.push(`/qa-workspace/qa-submissions/edit/${r.id}`)}
                  aria-label="Edit"
                >
                  <Pencil size={15} />
                </button>
              </Tooltip>
            )}
            {canDeleteSubmission && !locked && (
              <ConfirmDialog
                tone="danger"
                title="Delete QA Submission?"
                description="This removes the submission, its linked runs, known issues and history. The test runs themselves are not affected."
                confirmText="Delete"
                onConfirm={() => handleDelete(r.id)}
              >
                <Tooltip title="Delete">
                  <button className="qs-iconbtn is-danger" aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </Tooltip>
              </ConfirmDialog>
            )}
          </div>
        );
      },
    },
  ];

  const renderCard = (r: SubmissionListItem) => (
    <div
      key={r.id}
      className="qs-section"
      style={{ marginBottom: 0, cursor: "pointer" }}
      onClick={() => openSubmission(r.id)}
    >
      <div className="qs-section__head">
        <div className="qs-section__title">
          <span className="sc-name__badge">{initialsOf(r.submission_name)}</span>
          <div>
            <h3>{r.submission_name}</h3>
            <p>
              {r.scope_name || "No scope"} · {r.qa_owner_name || "Unassigned"} · v{r.version}
            </p>
          </div>
        </div>
        <StatusPill status={r.status} size="sm" />
      </div>
      <div className="qs-section__body">
        <div className="qs-metrics">
          <div className="qs-metric">
            <span className="qs-metric__label">Total</span>
            <span className="qs-metric__value">{r.total_cases}</span>
          </div>
          <div className="qs-metric qs-metric--green">
            <span className="qs-metric__label">Passed</span>
            <span className="qs-metric__value">{r.passed}</span>
          </div>
          <div className="qs-metric qs-metric--red">
            <span className="qs-metric__label">Failed</span>
            <span className="qs-metric__value">{r.failed}</span>
          </div>
          <div className="qs-metric qs-metric--amber">
            <span className="qs-metric__label">Open bugs</span>
            <span className="qs-metric__value">{r.open_bugs}</span>
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <RecommendationPill value={r.qa_recommendation} size="sm" />
          <span className="qs-muted">
            {r.run_count} run{r.run_count === 1 ? "" : "s"} · {fmtDate(r.submitted_at || r.created_at)}
          </span>
        </div>
      </div>
    </div>
  );

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: QA_SUBMISSION_STYLES + `
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
          .pp-topbar { flex-wrap: wrap; gap: 6px; }
          .sc-filters, .pp-topbar { gap: 6px; }
          .sc-filters__search { width: 100% !important; min-width: 0; }

          /* Table: horizontal scroll */
          .pp-table-wrap { overflow-x: auto !important; }
          .pp-table .ant-table { min-width: 680px; }

          /* Topbar: compress buttons */
          .sc-topbar { padding: 8px 14px !important; }

          /* Footer: wrap on small screens */
          .pp-footer { flex-wrap: wrap; height: auto; min-height: 44px; padding: 8px 14px; gap: 6px; }
        }

        @media (max-width: 480px) {
          .grid.grid-cols-2.lg\:grid-cols-4,
          .grid.grid-cols-2.lg\:grid-cols-5 { grid-template-columns: 1fr !important; }
          .sc-topbar__sub, .sc-topbar__div { display: none !important; }
          .pp-footer-info { font-size: 11px; }
        }

        /* ── Inline filter row — mirrors TicketList exactly ──────────────── */
        .tl-filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .tl-filter-row {
          background: #0f1419;
          border-color: #1f2937;
        }
        .tl-filter-row-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-filter-row-label { color: #94a3b8; }
        .tl-filter-row-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500);
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0;
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .tl-filter-row-count {
          background: #111720;
          border-color: #2d3748;
          color: #cbd5e1;
        }
        .tl-filter-row-pills {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .sc-clear {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 28px;
          padding: 0 10px;
          background: transparent;
          border: 1px dashed var(--border-slate-200);
          border-radius: 8px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-500);
          cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .sc-clear:hover {
          color: #1d4ed8;
          border-color: rgba(59,130,246,0.45);
          background: rgba(59,130,246,0.06);
          border-style: solid;
        }
        [data-theme='dark'] .sc-clear {
          border-color: #2d3748;
          color: #94a3b8;
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
                <FileCheck2 size={18} />
              </div>
              <div>
                <h1 className="pp-side-title">QA Submissions</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateSubmission && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/qa-workspace/qa-submissions/create")}
                block
                className="pp-side-cta"
              >
                Create QA Submission
              </Button>
            )}
          </div>

          <div className="dh-sidebar-scroll">
            <span className="pp-nav-caption">Lifecycle</span>
            {DASHBOARD_CARDS.filter((c) => c.statuses).map((card) => {
              const active = statusFilter === card.statuses![0];
              return (
                <button
                  key={card.key}
                  className={`pp-nav-item ${active ? "is-active" : ""}`}
                  onClick={() => applyCardFilter(card)}
                >
                  <card.icon size={15} className="pp-nav-icon" />
                  <span className="pp-nav-label">{card.label}</span>
                  {stats && <span className="pp-nav-count">{stats[card.key] ?? 0}</span>}
                </button>
              );
            })}
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
              <span className="sc-topbar__h1">QA Submissions</span>
              <span className="sc-topbar__div" />
              <span className="sc-topbar__sub">
                Formal reporting of completed testing, QA sign-off and approval
              </span>
            </div>

            <div className="dh-main-controls">
              <Button
                type="default"
                icon={<RotateCw size={14} className={loading ? "animate-spin" : ""} />}
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0 }}
              />
              <div className="pp-segmented">
                <button type="button" className={viewMode === "grid" ? "is-active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view">
                  <AppstoreOutlined />
                </button>
                <button type="button" className={viewMode === "list" ? "is-active" : ""} onClick={() => setViewMode("list")} aria-label="List view">
                  <UnorderedListOutlined />
                </button>
              </div>
              {canCreateSubmission && (
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => router.push("/qa-workspace/qa-submissions/create")}>
                  Create QA Submission
                </Button>
              )}
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Dashboard cards (§4) — the whole lifecycle reads left to right on
                one row, so the shape of the pipeline is visible at a glance.
                The per-card hint moves into a tooltip; at this width the tile
                only has room for the count and its label. */}
            <div className="qs-statrow">
              {DASHBOARD_CARDS.map((card) => {
                return (
                  <Tooltip key={card.key} title={card.sub} mouseEnterDelay={0.4}>
                  <div>
                    <StatTile
                      compact
                      label={card.label}
                      value={stats?.[card.key] ?? "—"}
                      icon={card.icon}
                      color={card.color}
                      bgColor={card.bg}
                    />
                  </div>
                  </Tooltip>
                );
              })}
            </div>

            {/* Filters and Search (§5) — matches Ticket List pattern exactly */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0', flexWrap: 'wrap' }}>
              <Input
                style={{ width: 240, height: 30 }}
                placeholder="Search submissions, scopes…"
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)", fontSize: 12 }} />}
                className="saas-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />

              <Space.Compact className="ticket-filter-group">
                <Popover
                  content={
                    <QaSubmissionsFilters
                      filters={{ projectFilter, scopeFilter, ownerFilter, statusFilter, recommendationFilter, dateRange }}
                      onFilterChange={(key: keyof import('./QaSubmissionsFilters').QaSubmissionsFiltersState, val: any) => {
                        if (key === 'projectFilter') setProjectFilter(val);
                        if (key === 'scopeFilter') setScopeFilter(val);
                        if (key === 'ownerFilter') setOwnerFilter(val);
                        if (key === 'statusFilter') setStatusFilter(val);
                        if (key === 'recommendationFilter') setRecommendationFilter(val);
                        if (key === 'dateRange') setDateRange(val);
                      }}
                      onReset={clearFilters}
                      projectOptions={projectOptions}
                      scopeOptions={scopeOptions}
                      ownerOptions={memberOptions}
                      statusOptions={SUBMISSION_STATUSES.map(s => ({ value: s, label: s }))}
                      recommendationOptions={RECOMMENDATIONS.map(r => ({ value: r, label: r }))}
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
                    className={activeFilterCount > 0 ? 'saas-tag-blue' : ''}
                    style={{ height: 30, fontWeight: 600, fontSize: 12 }}
                  >
                    Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </Button>
                </Popover>
                <Button
                  icon={<ExpandAltOutlined />}
                  style={{ height: 30 }}
                  aria-label="Expand filters"
                  onClick={() => setIsFilterRowOpen(prev => !prev)}
                />
              </Space.Compact>
            </div>

            {/* Inline Filter Row — compact TicketFilterPill row, same as Ticket List */}
            {isFilterRowOpen && (
              <div className="tl-filter-row">
                <div className="tl-filter-row-label">
                  <FilterOutlined style={{ fontSize: 11 }} />
                  <span>Filters</span>
                  <span className="tl-filter-row-count">
                    {activeFilterCount > 0 ? activeFilterCount : '0'}
                  </span>
                </div>
                <div className="tl-filter-row-pills">
                  <TicketFilterPill
                    icon={<ProjectOutlined style={{ fontSize: 11 }} />}
                    label="Project"
                    value={projectFilter || ""}
                    options={projectOptions}
                    onChange={setProjectFilter}
                    itemNoun="projects"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<AimOutlined style={{ fontSize: 11 }} />}
                    label="Scope"
                    value={scopeFilter || ""}
                    options={scopeOptions}
                    onChange={setScopeFilter}
                    itemNoun="scopes"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<UserOutlined style={{ fontSize: 11 }} />}
                    label="Owner"
                    value={ownerFilter || ""}
                    options={memberOptions}
                    onChange={setOwnerFilter}
                    itemNoun="people"
                    multiple={false}
                    showAvatar
                  />
                  <TicketFilterPill
                    icon={<CheckCircleOutlined style={{ fontSize: 11 }} />}
                    label="Status"
                    value={statusFilter || ""}
                    options={SUBMISSION_STATUSES.map(s => ({ value: s, label: s }))}
                    onChange={setStatusFilter}
                    itemNoun="statuses"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<CheckCircleOutlined style={{ fontSize: 11 }} />}
                    label="Outcome"
                    value={recommendationFilter || ""}
                    options={RECOMMENDATIONS.map(r => ({ value: r, label: r }))}
                    onChange={setRecommendationFilter}
                    itemNoun="recommendations"
                    multiple={false}
                  />
                  {dateRange && dateRange[0] && dateRange[1] && (
                    <TicketFilterPill
                      icon={<CalendarOutlined style={{ fontSize: 11 }} />}
                      label="Date"
                      value={`${dayjs(dateRange[0]).format('MMM D')} – ${dayjs(dateRange[1]).format('MMM D')}`}
                      options={[]}
                      onChange={() => setDateRange(null)}
                      itemNoun="dates"
                      multiple={false}
                    />
                  )}
                  {activeFilterCount > 0 && (
                    <button type="button" className="sc-clear" onClick={clearFilters} style={{ marginLeft: 'auto' }}>
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Only the results blur — blurring the filters above would disable
                the search box mid-keystroke, since every keystroke refetches. */}
            <div style={{ marginTop: 12 }}>
            <ZukvoLoadingOverlay
              loading={loading}
              message="Loading QA submissions…"
              minHeight={firstLoad ? 360 : undefined}
            >
            {viewMode === "list" ? (
              <div className="sc-tablewrap">
                {/* Nothing to show behind the blur on a cold load, and the table's
                    "No submissions yet" text would be a lie while still loading. */}
                {firstLoad ? (
                  <div style={{ minHeight: 360 }} />
                ) : (
                <Table
                  className="sc-table"
                  dataSource={rows}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 1740 }}
                  onRow={(r) => ({ onClick: () => openSubmission(r.id) })}
                  onChange={(_p, _f, sorter: any) => {
                    // Clearing a column's sort falls back to most-recently-updated.
                    if (!sorter?.order) {
                      setSortBy("updated_at");
                      setSortDir("desc");
                      return;
                    }
                    setSortBy(String(sorter.field ?? sorter.columnKey));
                    setSortDir(sorter.order === "ascend" ? "asc" : "desc");
                  }}
                  locale={{
                    emptyText: <NoData description={(
                                                <div className="sc-empty">
                                                  <FileDoneOutlined className="sc-empty__icon" />
                                                  <p className="sc-empty__title">
                                                    {activeFilterCount > 0 ? "No submissions match these filters" : "No QA submissions yet"}
                                                  </p>
                                                  <p className="sc-empty__desc">
                                                    {activeFilterCount > 0
                                                      ? "Try widening your search or clearing the filters."
                                                      : "Create a submission to report the testing results for a scope. You can submit while bugs are still open — sign-off comes later."}
                                                  </p>
                                                  {activeFilterCount > 0 ? (
                                                    <Button size="small" onClick={clearFilters}>
                                                      Clear filters
                                                    </Button>
                                                  ) : (
                                                    canCreateSubmission && (
                                                      <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => router.push("/qa-workspace/qa-submissions/create")}>
                                                        Create QA Submission
                                                      </Button>
                                                    )
                                                  )}
                                                </div>
                                              )} />,
                  }}
                />
                )}
              </div>
            ) : (
              <div className="pp-grid" style={firstLoad ? { minHeight: 360 } : undefined}>
                {firstLoad ? null : rows.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <NoData description={
                      <div className="sc-empty pp-empty">
                        <FileDoneOutlined className="sc-empty__icon pp-empty-orb" />
                        <p className="sc-empty__title pp-empty-title">
                          {activeFilterCount > 0 ? "No submissions match these filters" : "No QA submissions yet"}
                        </p>
                        <p className="sc-empty__desc pp-empty-sub">
                          {activeFilterCount > 0
                            ? "Try widening your search or clearing the filters."
                            : "Create a submission to report the testing results for a scope."}
                        </p>
                      </div>
                    } />
                  </div>
                ) : (
                  rows.map(renderCard)
                )}
              </div>
            )}
            </ZukvoLoadingOverlay>
            </div>
          </div>

          {total > 0 && (
            <div className="pp-footer">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
              </div>
              <div className="pp-pager">
                <button type="button" className="pp-pager-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ‹
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                  .map((p) => (
                    <button key={p} type="button" className={`pp-pager-num ${p === page ? "is-active" : ""}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                <button type="button" className="pp-pager-btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                  ›
                </button>
                <Select
                  className="pp-pagesize"
                  value={pageSize}
                  onChange={(v) => {
                    setPageSize(v);
                    setPage(1);
                  }}
                  options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </MainLayout>
  );
}

export default function QaSubmissionsPage() {
  return (
    <Suspense fallback={<ZukvoLoader size="lg" fullscreen message="Loading QA submissions…" />}>
      <QaSubmissionsContent />
    </Suspense>
  );
}
