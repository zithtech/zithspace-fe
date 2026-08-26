"use client";

/**
 * Approvals — the approver's own queue.
 *
 * QA Submissions is QA's list: it is organised around preparing and reporting a
 * result. This page is organised around the one decision the approver actually
 * makes on it — accept it, or send it back — so every reported submission is
 * listed with those two actions on the row, rather than buried a click deep on
 * the record.
 *
 * Nothing here is a separate kind of object: these are the same submissions,
 * filtered to the ones that have been reported.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { App, Button, DatePicker, Input, Modal, Select, Table, Tooltip } from "antd";
import { SearchOutlined, FileDoneOutlined } from "@ant-design/icons";
import {
  Eye,
  Inbox,
  Layers,
  RefreshCcw,
  Send,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  Undo2,
  Menu,
  RotateCw,
  Target,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import type { SortOrder } from "antd/es/table/interface";

import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import ZukvoLoader, { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import ScopeApprovals from "./ScopeApprovals";
import { MembersService } from "@/services/membersService";
import QaSubmissionService, {
  AWAITING_APPROVAL_STATUSES,
  RECOMMENDATIONS,
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
} from "../qa-submissions/shared";

const { RangePicker } = DatePicker;

/**
 * The sidebar buckets. `statuses` is what each one asks the server for — the
 * first bucket is the queue itself, the rest narrow it to a single stage so an
 * approver can work through one stage at a time.
 */
type Bucket = {
  key: string;
  label: string;
  icon: any;
  statuses: SubmissionStatus[];
  /** Reads the count off the shared stats payload. */
  count: (s: SubmissionStats) => number;
};

const BUCKETS: Bucket[] = [
  {
    key: "awaiting",
    label: "Awaiting Approval",
    icon: Inbox,
    statuses: AWAITING_APPROVAL_STATUSES,
    count: (s) => s.submitted + s.retesting + s.ready_for_signoff,
  },
  {
    key: "submitted",
    label: "Submitted",
    icon: Send,
    statuses: ["Submitted", "Under Review"],
    count: (s) => s.submitted,
  },
  { key: "retesting", label: "Retesting", icon: RefreshCcw, statuses: ["Retesting"], count: (s) => s.retesting },
  {
    key: "ready",
    label: "Ready for Sign-off",
    icon: CheckCircle2,
    statuses: ["Ready for QA Sign-off"],
    count: (s) => s.ready_for_signoff,
  },
  {
    key: "approved",
    label: "Approved",
    icon: ThumbsUp,
    statuses: ["Approved"],
    count: (s) => s.approved,
  },
  {
    key: "signed_off",
    label: "QA Signed-off",
    icon: ShieldCheck,
    statuses: ["QA Signed-off"],
    count: (s) => s.qa_signed_off,
  },
  { key: "sent_back", label: "Sent Back", icon: Undo2, statuses: ["Sent Back"], count: (s) => s.sent_back },
];

/** The tiles across the top — the queue, its two ends, and the total. */
const TILES: Array<{ key: string; label: string; icon: any; color: string; bg: string; sub: string }> = [
  { key: "awaiting", label: "Awaiting Approval", icon: Inbox, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", sub: "waiting on you" },
  { key: "approved", label: "Approved", icon: ThumbsUp, color: "#10b981", bg: "rgba(16,185,129,0.12)", sub: "accepted — now with QA for sign-off" },
  { key: "qa_signed_off", label: "QA Signed-off", icon: ShieldCheck, color: "#10b981", bg: "rgba(16,185,129,0.12)", sub: "closed by QA" },
  { key: "sent_back", label: "Sent Back", icon: Undo2, color: "#64748b", bg: "rgba(100,116,139,0.1)", sub: "returned to QA" },
  { key: "total", label: "All Submissions", icon: Layers, color: "#64748b", bg: "rgba(100,116,139,0.1)", sub: "every milestone" },
];

function ApprovalsContent() {
  useActivitySource({ section: "WORK", module: "QA", page: "QaApprovals" });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const { canReadPmApproval, canApproveSubmission, canSendBackSubmission, canApproveScope } = usePermission();

  const [rows, setRows] = useState<SubmissionListItem[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scopes, setScopes] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [bucketKey, setBucketKey] = useState<string>(searchParams.get("bucket") || "awaiting");
  /**
   * Test scopes are the other thing an approver decides on. They were their own
   * page until now; here they are simply a second view of the same queue, so
   * the sidebar switches between the two rather than the approver switching
   * screens.
   */
  const [view, setView] = useState<"submissions" | "scopes">(
    searchParams.get("view") === "scopes" ? "scopes" : "submissions",
  );
  /**
   * Permissions arrive with auth rather than on the first render, so the choice
   * is derived rather than seeded: an approver who only signs off scopes has no
   * submission queue to fall back to.
   */
  const effectiveView = canReadPmApproval ? view : "scopes";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string | undefined>();
  const [ownerFilter, setOwnerFilter] = useState<string | undefined>();
  const [recommendationFilter, setRecommendationFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [sortBy, setSortBy] = useState("submitted_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  /** The decision modals — one submission at a time, each with its own note. */
  const [approveTarget, setApproveTarget] = useState<SubmissionListItem | null>(null);
  const [approveComment, setApproveComment] = useState("");
  const [sendBackTarget, setSendBackTarget] = useState<SubmissionListItem | null>(null);
  const [sendBackReason, setSendBackReason] = useState("");

  const bucket = useMemo(
    () => BUCKETS.find((b) => b.key === bucketKey) || BUCKETS[0],
    [bucketKey],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, scopeFilter, ownerFilter, recommendationFilter, dateRange, bucketKey]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await QaSubmissionService.list({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        scopeId: scopeFilter,
        qaOwnerId: ownerFilter,
        // Several statuses in one call — the queue spans the whole reported
        // range, not a single stage.
        status: bucket.statuses.join(","),
        recommendation: recommendationFilter as QaRecommendation | undefined,
        from: dateRange?.[0]?.format("YYYY-MM-DD"),
        to: dateRange?.[1]?.format("YYYY-MM-DD"),
        sortBy,
        sortDir,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch {
      message.error("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }, [
    page, pageSize, debouncedSearch, scopeFilter, ownerFilter, bucket,
    recommendationFilter, dateRange, sortBy, sortDir, message,
  ]);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await QaSubmissionService.getStats());
    } catch {
      /* the tiles simply stay blank */
    }
  }, []);

  useEffect(() => {
    if (!canReadPmApproval || effectiveView !== "submissions") return;
    fetchList();
  }, [canReadPmApproval, fetchList, effectiveView]);

  useEffect(() => {
    if (!canReadPmApproval) return;
    fetchStats();
    (async () => {
      try {
        const [scopeRes, memberRes] = await Promise.all([
          axios.get("/api/v2/qa/test-scopes?limit=1000"),
          MembersService.getMembers({ limit: 500 }),
        ]);
        setScopes(Array.isArray(scopeRes) ? scopeRes : (scopeRes as any)?.data?.data || (scopeRes as any)?.data || []);
        setMembers(memberRes.data || []);
      } catch {
        /* filters degrade to free-text search */
      }
    })();
  }, [canReadPmApproval, fetchStats]);

  const tileValue = (key: string) => {
    if (!stats) return "—";
    if (key === "awaiting") return stats.submitted + stats.retesting + stats.ready_for_signoff;
    return (stats as any)[key] ?? 0;
  };

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

  const confirmApprove = async () => {
    if (!approveTarget) return;
    try {
      setBusy(true);
      await QaSubmissionService.approve(approveTarget.id, approveComment.trim() || undefined);
      message.success(`${approveTarget.submission_name} approved`);
      setApproveTarget(null);
      setApproveComment("");
      await Promise.all([fetchList(), fetchStats()]);
    } catch (e: any) {
      message.error(e?.response?.data?.error || "The submission could not be approved");
    } finally {
      setBusy(false);
    }
  };

  const confirmSendBack = async () => {
    if (!sendBackTarget) return;
    // The server rejects an empty reason too — asking here saves the round trip
    // and keeps the modal open with what was already typed.
    if (!sendBackReason.trim()) return message.error("A reason is required when sending a submission back");
    try {
      setBusy(true);
      await QaSubmissionService.sendBack(sendBackTarget.id, sendBackReason.trim());
      message.success(`${sendBackTarget.submission_name} sent back to QA`);
      setSendBackTarget(null);
      setSendBackReason("");
      await Promise.all([fetchList(), fetchStats()]);
    } catch (e: any) {
      message.error(e?.response?.data?.error || "The submission could not be sent back");
    } finally {
      setBusy(false);
    }
  };

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (scopeFilter ? 1 : 0) +
    (ownerFilter ? 1 : 0) +
    (recommendationFilter ? 1 : 0) +
    (dateRange?.[0] ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setScopeFilter(undefined);
    setOwnerFilter(undefined);
    setRecommendationFilter(undefined);
    setDateRange(null);
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

  // Either queue is enough to have business here — an approver who only signs
  // off test scopes still needs this page.
  if (!canReadPmApproval && !canApproveScope) return null;

  const firstLoad = loading && rows.length === 0;

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
    { title: "Total", dataIndex: "total_cases", key: "total_cases", width: 75, align: "right" as const, render: (v: number) => numCell(v) },
    { title: "Passed", dataIndex: "passed", key: "passed", width: 80, align: "right" as const, render: (v: number) => numCell(v, "pass") },
    { title: "Failed", dataIndex: "failed", key: "failed", width: 80, align: "right" as const, render: (v: number) => numCell(v, "fail") },
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
      title: "Decision",
      key: "decision",
      width: 300,
      align: "right" as const,
      fixed: "right" as const,
      render: (_: any, r: SubmissionListItem) => {
        // Once accepted there is nothing left for the approver to decide — the
        // record moves on to QA's sign-off, so the row states the outcome
        // instead of showing an inert pair of buttons.
        const decided = r.status === "Approved" || r.status === "QA Signed-off";
        return (
          <div className="sc-rowactions" onClick={(ev) => ev.stopPropagation()}>
            <Tooltip title="Open the full submission">
              <button className="qs-iconbtn" onClick={() => openSubmission(r.id)} aria-label="View">
                <Eye size={15} />
              </button>
            </Tooltip>
            {decided ? (
              <span className="qs-muted">
                Approved {fmtDate(r.approved_at)}
                {r.status === "QA Signed-off" ? " · signed off" : " · awaiting QA sign-off"}
              </span>
            ) : (
              <>
                {canSendBackSubmission && (
                  <Button
                    size="small"
                    icon={<Undo2 size={13} />}
                    onClick={() => {
                      setSendBackReason("");
                      setSendBackTarget(r);
                    }}
                  >
                    Send Back
                  </Button>
                )}
                {canApproveSubmission && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<ThumbsUp size={13} />}
                    onClick={() => {
                      setApproveComment("");
                      setApproveTarget(r);
                    }}
                  >
                    Approve submission
                  </Button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

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
                <ThumbsUp size={18} />
              </div>
              <div>
                <h1 className="pp-side-title">Approvals</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>
          </div>

          <div className="dh-sidebar-scroll">
            {canReadPmApproval && <span className="pp-nav-caption">Queue</span>}
            {canReadPmApproval && BUCKETS.map((b) => (
              <button
                key={b.key}
                className={`pp-nav-item ${effectiveView === "submissions" && bucketKey === b.key ? "is-active" : ""}`}
                onClick={() => {
                  setView("submissions");
                  setBucketKey(b.key);
                  setMobileSidebarOpen(false);
                }}
              >
                <b.icon size={15} className="pp-nav-icon" />
                <span className="pp-nav-label">{b.label}</span>
                {stats && <span className="pp-nav-count">{b.count(stats)}</span>}
              </button>
            ))}

            {canApproveScope && (
              <>
                <span className="pp-nav-caption">Test Scope</span>
                <button
                  className={`pp-nav-item ${effectiveView === "scopes" ? "is-active" : ""}`}
                  onClick={() => { setView("scopes"); setMobileSidebarOpen(false); }}
                >
                  <Target size={15} className="pp-nav-icon" />
                  <span className="pp-nav-label">Scope Approvals</span>
                </button>
              </>
            )}
          </div>
        </aside>

        <main className="dh-main">
          {effectiveView === "scopes" ? (
            <ScopeApprovals onOpenSidebar={() => setMobileSidebarOpen(true)} />
          ) : (
          <>
          <div className="dh-main-topbar sc-topbar">
            <div className="sc-topbar__title" style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                className="dh-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
              <span className="sc-topbar__h1">Approvals</span>
              <span className="sc-topbar__div" />
              <span className="sc-topbar__sub">
                Reported QA submissions waiting on a business decision — approve, or send back with a reason
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
            </div>
          </div>

          <div className="dh-main-scroll">
            <div className="qs-statrow">
              {TILES.map((t) => (
                <Tooltip key={t.key} title={t.sub} mouseEnterDelay={0.4}>
                  <div>
                    <StatTile
                      compact
                      label={t.label}
                      value={tileValue(t.key)}
                      icon={t.icon}
                      color={t.color}
                      bgColor={t.bg}
                    />
                  </div>
                </Tooltip>
              ))}
            </div>

            <div className="sc-filters">
              <Input
                className="sc-filters__search"
                placeholder="Search submissions, scopes…"
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
              <SearchableDropdown
                options={scopeOptions}
                value={scopeFilter}
                onChange={setScopeFilter}
                placeholder="All scopes"
                itemNoun="scopes"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={memberOptions}
                value={ownerFilter}
                onChange={setOwnerFilter}
                placeholder="Any QA owner"
                itemNoun="people"
                className="sc-filters__field"
              />
              <SearchableDropdown
                options={RECOMMENDATIONS.map((r) => ({ value: r, label: r }))}
                value={recommendationFilter}
                onChange={setRecommendationFilter}
                placeholder="Any recommendation"
                hideAvatar
                itemNoun="recommendations"
                className="sc-filters__field"
              />
              <RangePicker
                value={dateRange as any}
                onChange={(v) => setDateRange(v as any)}
                format="DD MMM YYYY"
                allowEmpty={[true, true]}
              />
              {activeFilterCount > 0 && (
                <button type="button" className="sc-clear" onClick={clearFilters}>
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>

            <ZukvoLoadingOverlay
              loading={loading || busy}
              message="Loading approvals…"
              minHeight={firstLoad ? 360 : undefined}
            >
              <div className="sc-tablewrap">
                {firstLoad ? (
                  <div style={{ minHeight: 360 }} />
                ) : (
                  <Table
                    className="sc-table"
                    dataSource={rows}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 1620 }}
                    onRow={(r) => ({ onClick: () => openSubmission(r.id) })}
                    onChange={(_p, _f, sorter: any) => {
                      if (!sorter?.order) {
                        setSortBy("submitted_at");
                        setSortDir("desc");
                        return;
                      }
                      setSortBy(String(sorter.field ?? sorter.columnKey));
                      setSortDir(sorter.order === "ascend" ? "asc" : "desc");
                    }}
                    locale={{
                      emptyText: (
                        <div className="sc-empty">
                          <FileDoneOutlined className="sc-empty__icon" />
                          <p className="sc-empty__title">
                            {activeFilterCount > 0
                              ? "No submissions match these filters"
                              : `Nothing in ${bucket.label.toLowerCase()}`}
                          </p>
                          <p className="sc-empty__desc">
                            {activeFilterCount > 0
                              ? "Try widening your search or clearing the filters."
                              : "Submissions appear here once QA reports their testing results."}
                          </p>
                          {activeFilterCount > 0 && (
                            <Button size="small" onClick={clearFilters}>
                              Clear filters
                            </Button>
                          )}
                        </div>
                      ),
                    }}
                  />
                )}
              </div>
            </ZukvoLoadingOverlay>
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
          </>
          )}
        </main>
      </div>

      {/* Approve — the figures are restated so the decision is made against the
          numbers, not just the name of the submission. */}
      <Modal
        open={!!approveTarget}
        onCancel={() => setApproveTarget(null)}
        title="Approve this QA Submission"
        okText="Approve submission"
        confirmLoading={busy}
        onOk={confirmApprove}
        width={560}
      >
        {approveTarget && (
          <>
            <p style={{ marginBottom: 10 }}>
              You are accepting <strong>{approveTarget.submission_name}</strong>
              {approveTarget.scope_name ? ` for ${approveTarget.scope_name}` : ""}.
            </p>
            <div className="qs-metrics" style={{ marginBottom: 12 }}>
              <div className="qs-metric">
                <span className="qs-metric__label">Total</span>
                <span className="qs-metric__value">{approveTarget.total_cases}</span>
              </div>
              <div className="qs-metric qs-metric--green">
                <span className="qs-metric__label">Passed</span>
                <span className="qs-metric__value">{approveTarget.passed}</span>
              </div>
              <div className="qs-metric qs-metric--red">
                <span className="qs-metric__label">Failed</span>
                <span className="qs-metric__value">{approveTarget.failed}</span>
              </div>
              <div className="qs-metric qs-metric--amber">
                <span className="qs-metric__label">Open bugs</span>
                <span className="qs-metric__value">{approveTarget.open_bugs}</span>
              </div>
            </div>
            <p className="qs-hint" style={{ marginBottom: 10 }}>
              Approving accepts the results as they currently stand. QA&apos;s final sign-off opens once you do — it is
              the step that closes the submission.
            </p>
            <Input.TextArea
              rows={3}
              value={approveComment}
              onChange={(ev) => setApproveComment(ev.target.value)}
              placeholder="Optional comment recorded against the approval"
            />
          </>
        )}
      </Modal>

      {/* Send Back — the reason is what QA acts on, so it is required. */}
      <Modal
        open={!!sendBackTarget}
        onCancel={() => setSendBackTarget(null)}
        title="Send this submission back to QA"
        okText="Send Back"
        confirmLoading={busy}
        onOk={confirmSendBack}
        width={560}
      >
        <p className="qs-hint" style={{ marginBottom: 10 }}>
          Returns <strong>{sendBackTarget?.submission_name}</strong> to QA with your reason. Nothing already recorded is
          deleted — QA updates the submission and reports again as a new version.
        </p>
        <Input.TextArea
          rows={4}
          value={sendBackReason}
          onChange={(ev) => setSendBackReason(ev.target.value)}
          placeholder="What does QA need to do before this can be approved?"
        />
      </Modal>
    </MainLayout>
  );
}

export default function QaApprovalsPage() {
  return (
    <Suspense fallback={<ZukvoLoader size="lg" fullscreen message="Loading approvals…" />}>
      <ApprovalsContent />
    </Suspense>
  );
}
