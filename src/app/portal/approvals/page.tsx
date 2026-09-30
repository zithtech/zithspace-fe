"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Input,
  Empty,
  Pagination,
  Switch,
  DatePicker,
  Typography,
  Button,
  Space,
  Tooltip,
  Tag,
} from "antd";
import {
  FilterOutlined,
  ExpandAltOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import {
  CheckSquare,
  Search,
  Hourglass,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  FolderOpen,
} from "lucide-react";
import {
  portalApprovalsService,
  PortalApprovalListItem,
  PortalApprovalMeta,
} from "@/services/portalApprovalsService";
import {
  p,
  STATUS_META,
  SUBJECT_LABEL,
  fmtRelative,
  fmtDate,
} from "./_ui";
import TicketFilterPill, {
  FilterPillOption,
} from "@/components/projects/TicketFilterPill";

dayjs.extend(quarterOfYear);

const { RangePicker } = DatePicker;

const STATUS_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "open", label: "Open" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const MINE_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "all", label: "All approvals" },
  { value: "mine", label: "Assigned to me" },
];

function getApprovalStatusTag(status: string) {
  switch (status) {
    case "approved":
      return { color: "#10b981", bg: "#d1fae5", label: "APPROVED" };
    case "rejected":
      return { color: "#ef4444", bg: "#fee2e2", label: "REJECTED" };
    case "open":
    default:
      return { color: "#d97706", bg: "#fef3c7", label: "OPEN" };
  }
}

export default function PortalApprovalsListPage() {
  const [items, setItems] = useState<PortalApprovalListItem[]>([]);
  const [meta, setMeta] = useState<PortalApprovalMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string>("ALL");
  const [mineFilter, setMineFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [page, setPage] = useState(1);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [limit, setLimit] = useState(15);

  const fromIso = datePicked?.[0]
    ? datePicked[0]!.format("YYYY-MM-DD")
    : undefined;
  const toIso = datePicked?.[1] ? datePicked[1]!.format("YYYY-MM-DD") : undefined;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalApprovalsService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        mine: mineFilter === "mine" ? true : undefined,
        search: search || undefined,
        from: fromIso,
        to: toIso,
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch {
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, mineFilter, fromIso, toIso]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (status !== "ALL") count++;
    if (mineFilter !== "all") count++;
    if (datePicked && (datePicked[0] || datePicked[1])) count++;
    return count;
  }, [status, mineFilter, datePicked]);

  const filtered = items;
  const total = meta?.total ?? items.length;
  const counts = meta?.counts || ({} as Record<string, number>);
  const openCount = counts.open || items.filter((a) => a.status === "open").length;
  const approvedCount =
    counts.approved || items.filter((a) => a.status === "approved").length;
  const rejectedCount =
    counts.rejected || items.filter((a) => a.status === "rejected").length;
  const completedPct =
    total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  const activeStatusLabel = useMemo(() => {
    if (status === "ALL") return "All approvals";
    const found = STATUS_FILTER_OPTIONS.find((s) => s.value === status);
    return found ? found.label : "All approvals";
  }, [status]);

  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: "Last 7 days", value: [dayjs().subtract(6, "day"), dayjs()] },
    { label: "Last 30 days", value: [dayjs().subtract(29, "day"), dayjs()] },
    {
      label: "This month",
      value: [dayjs().startOf("month"), dayjs().endOf("month")],
    },
    {
      label: "Last month",
      value: [
        dayjs().subtract(1, "month").startOf("month"),
        dayjs().subtract(1, "month").endOf("month"),
      ],
    },
    {
      label: "This quarter",
      value: [dayjs().startOf("quarter"), dayjs().endOf("quarter")],
    },
  ];

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {/* ── Top Header Toolbar matching Invoices, Meetings, Documents, Milestones, and CRs ── */}
      <div className="pm2-toolbar saas-header-container sc-header">
        <div className="pm2-head-id">
          <span className="pm2-head-ic">
            <CheckSquare size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Approvals</span>
            <span className="pm2-head-sub">OVERSEE SIGN-OFFS & DECISIONS</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search approval # or title..."
            prefix={
              <Search
                size={13}
                style={{ color: "var(--text-slate-400)", marginRight: 4 }}
              />
            }
            className="saas-input"
            style={{
              maxWidth: 280,
              borderRadius: 8,
              height: 32,
              background: "transparent",
              fontSize: 12.5,
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />

          <Space.Compact className="ticket-filter-group">
            <Button
              icon={<FilterOutlined />}
              className={activeFilterCount > 0 ? "saas-tag-blue" : ""}
              style={{ height: 32, fontWeight: 600, fontSize: 12 }}
              onClick={() => setIsFilterRowOpen((v) => !v)}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
            <Button
              icon={<ExpandAltOutlined />}
              style={{ height: 32 }}
              aria-label="Expand filters"
              onClick={() => setIsFilterRowOpen((v) => !v)}
            />
          </Space.Compact>

          {/* View Toggle */}
          <div
            className="premium-view-toggle"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              data-active={viewMode === "table" ? "true" : "false"}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <ListIcon size={13} />
            </button>
            <button
              type="button"
              data-active={viewMode === "card" ? "true" : "false"}
              onClick={() => setViewMode("card")}
              title="Card View"
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        </div>

        <Space size={10} className="sc-header-right">
          <Tooltip title="Refresh approvals">
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => load(true)}
              disabled={loading}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* ── Inline filter row (when opened) ── */}
      {isFilterRowOpen && (
        <div className="tl-filter-row">
          <div className="tl-filter-row-label">
            <FilterOutlined style={{ fontSize: 11 }} />
            <span>Filters</span>
            <span className="tl-filter-row-count">{activeFilterCount}</span>
          </div>

          <div className="tl-filter-row-pills">
            {/* Status Pill */}
            <TicketFilterPill
              icon={<CheckCircle2 size={12} />}
              label="Status"
              value={status === "ALL" ? "" : status}
              options={STATUS_FILTER_OPTIONS}
              onChange={(val: any) => {
                setStatus(val || "ALL");
                setPage(1);
              }}
              itemNoun="statuses"
              multiple={false}
            />

            {/* Scope Pill (All vs Assigned to me) */}
            <TicketFilterPill
              icon={<Users size={12} />}
              label="Scope"
              value={mineFilter === "all" ? "" : mineFilter}
              options={MINE_FILTER_OPTIONS}
              onChange={(val: any) => {
                setMineFilter(val || "all");
                setPage(1);
              }}
              itemNoun="scopes"
              multiple={false}
            />

            {/* Date Range Picker */}
            <RangePicker
              value={datePicked}
              onChange={(dates) => {
                setDatePicked(dates as [Dayjs | null, Dayjs | null] | null);
                setPage(1);
              }}
              presets={rangePresets}
              className="premium-rangepicker"
              style={{ height: 28, borderRadius: 6, fontSize: 12 }}
              placeholder={["Start", "End"]}
              format="DD MMM YY"
              suffixIcon={<Calendar size={12} color={p.textFaint} />}
              allowClear
            />
          </div>

          <div className="tl-filter-row-actions">
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="tl-filter-row-reset"
                onClick={() => {
                  setStatus("ALL");
                  setMineFilter("all");
                  setDatePicked(null);
                  setPage(1);
                }}
              >
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

      {/* ── Main Overview Banner (Sprint head style) ── */}
      <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
        <div className="tl-sprint-row1">
          <div className="tl-sprint-title-block">
            <span
              className="tl-sprint-dot"
              style={{
                background: "#3b82f6",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
              }}
            />
            <span className="tl-sprint-title pm2-banner-title">
              Sign-offs — {activeStatusLabel}
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {total} APPROVALS
              </span>
              {openCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-delayed">
                  {openCount} OPEN
                </span>
              )}
              {approvedCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {approvedCount} APPROVED
                </span>
              )}
              {rejectedCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-neutral">
                  {rejectedCount} REJECTED
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <span className="pm2-pulse-dot" />
            <b>{filtered.length}</b>{" "}
            {filtered.length === 1 ? "result" : "results"} on this page
          </span>
          <span className="tl-sprint-meta">
            <b>{openCount}</b> open
          </span>
          <span className="tl-sprint-meta">
            <b>{approvedCount}</b> approved
          </span>
          <span className="tl-sprint-meta">
            <b>{rejectedCount}</b> rejected
          </span>
        </div>

        <div className="tl-sprint-row3">
          <div className="tl-sprint-progress-bar">
            <div
              className="tl-sprint-progress-fill"
              style={{ width: `${Math.min(100, completedPct)}%` }}
            />
          </div>
          <span className="tl-sprint-progress-pct">{completedPct}%</span>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div
        className="portal-approvals-content"
        style={{
          padding: 0,
          width: "100%",
          flex: "1 0 auto",
        }}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <ZukvoLoader size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle }}>
                  {search || activeFilterCount > 0
                    ? "No approvals match your filter criteria."
                    : mineFilter === "mine"
                    ? "Nothing waiting on your decision."
                    : "No approvals raised yet."}
                </span>
              }
            />
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div
            className="pm-table-wrap"
            style={{
              background: "#ffffff",
              overflowX: "auto",
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(240px, 2fr) 130px 140px 140px 130px",
                minWidth: 920,
                gap: 12,
                padding: "7px 16px",
                background: "var(--bg-slate-50, #f8fafc)",
                borderBottom: "1px solid var(--border-slate-200, #e2e8f0)",
                fontSize: 10,
                fontWeight: 800,
                color: "var(--text-slate-400, #94a3b8)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                alignItems: "center",
              }}
            >
              <div>APPROVAL # / TITLE</div>
              <div>STATUS</div>
              <div>SUBJECT / PROJECT</div>
              <div>PROGRESS</div>
              <div>DUE DATE / UPDATED</div>
            </div>

            <div>
              {filtered.map((a, idx) => (
                <ApprovalTableRow
                  key={a.id}
                  a={a}
                  isLast={idx === filtered.length - 1}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Card View */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 14,
              padding: "16px 24px",
            }}
          >
            {filtered.map((a) => (
              <ApprovalCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer ── */}
      <div
        className="portal-approvals-pagination-footer"
        style={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: "#ffffff",
          borderTop: `1px solid ${p.border}`,
          boxShadow: "0 -4px 16px rgba(15, 23, 42, 0.04)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Typography.Text style={{ fontSize: 13, color: p.textSubtle }}>
            Showing{" "}
            <span style={{ color: p.text, fontWeight: 700 }}>
              {filtered.length > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span style={{ color: p.text, fontWeight: 700 }}>{total}</span>{" "}
            approval{total !== 1 ? "s" : ""}
          </Typography.Text>
        </div>

        <Pagination
          current={page}
          pageSize={limit}
          total={total}
          showSizeChanger
          pageSizeOptions={["10", "15", "20", "25", "50", "100"]}
          onChange={(p, size) => {
            setPage(p);
            if (size && size !== limit) {
              setLimit(size);
            }
          }}
          onShowSizeChange={(current, size) => {
            setPage(1);
            setLimit(size);
          }}
        />
      </div>

      <style jsx global>{`
        /* ── Header Toolbar ── */
        .pm2-toolbar.sc-header {
          position: sticky;
          top: 0;
          z-index: 100;
          height: auto;
          min-height: 0;
          margin: 0;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .sc-header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .sc-header-right {
          flex-shrink: 0;
        }

        .pm2-head-id {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          flex-shrink: 0;
        }
        .pm2-head-ic {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-size: 14px;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.18);
        }
        .pm2-head-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .pm2-head-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .pm2-head-sub {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-top: 1px;
        }

        /* ── Overview Banner ── */
        .tl-section-head {
          padding: 10px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .tl-sprint-head-v2 {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tl-sprint-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .tl-sprint-title-block {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .tl-sprint-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pm2-banner-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tl-sprint-tags {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .tl-sprint-tag {
          display: inline-flex;
          align-items: center;
          height: 18px;
          padding: 0 6px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          border-radius: 4px;
          border: 1px solid transparent;
          text-transform: uppercase;
          line-height: 1;
        }
        .tl-sprint-tag-active {
          background: transparent;
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.32);
        }
        .tl-sprint-tag-neutral {
          background: transparent;
          color: #64748b;
          border-color: rgba(100, 116, 139, 0.32);
        }
        .tl-sprint-tag-delayed {
          background: transparent;
          color: #d97706;
          border-color: rgba(217, 119, 6, 0.32);
        }

        .tl-sprint-row2 {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          padding-left: 15px;
        }
        .tl-sprint-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: -0.005em;
        }
        .tl-sprint-meta b {
          color: #0f172a;
          font-weight: 800;
        }
        .pm2-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .tl-sprint-row3 {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 15px;
        }
        .tl-sprint-progress-bar {
          flex: 1 1 auto;
          position: relative;
          height: 6px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
          min-width: 60px;
        }
        .tl-sprint-progress-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .tl-sprint-progress-pct {
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          font-variant-numeric: tabular-nums;
          min-width: 36px;
          text-align: right;
        }

        /* ── Inline Filter Row ── */
        .tl-filter-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .tl-filter-row-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        .tl-filter-row-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0;
          font-variant-numeric: tabular-nums;
        }
        .tl-filter-row-pills {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
        }
        .tl-filter-row-actions {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .tl-filter-row-reset {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 28px;
          padding: 0 10px;
          background: transparent;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .tl-filter-row-reset:hover {
          color: #1d4ed8;
          border-color: rgba(59, 130, 246, 0.45);
          background: rgba(59, 130, 246, 0.06);
          border-style: solid;
        }
        .tl-filter-row-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .tl-filter-row-close:hover {
          color: #0f172a;
          background: #ffffff;
          border-color: #94a3b8;
        }

        .saas-tag-blue {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          border-color: #bfdbfe !important;
        }

        /* ── View Toggle ── */
        .premium-view-toggle {
          display: inline-flex;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 2px;
        }
        .premium-view-toggle button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: none;
          background: transparent;
          color: #64748b;
          border-radius: 4px;
          cursor: pointer;
          transition: all 120ms ease;
        }
        .premium-view-toggle button:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .premium-view-toggle button[data-active='true'] {
          background: #eff6ff;
          color: #1d4ed8;
        }

        /* Card hover */
        .pm2-card {
          transition: all 140ms ease;
        }
        .pm2-card:hover {
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
          transform: translateY(-1px);
        }

        /* Row hover */
        .pm2-table-row {
          transition: background 120ms ease;
        }
        .pm2-table-row:hover {
          background: #f8fafc !important;
        }

        .portal-approvals-pagination-footer .ant-pagination-item,
        .portal-approvals-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .portal-approvals-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200, #e2e8f0) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500, #64748b) !important;
        }
        .portal-approvals-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .portal-approvals-pagination-footer .ant-pagination-item-active a {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Table Row Component                                            */
/* --------------------------------------------------------------- */

function ApprovalTableRow({
  a,
  isLast,
}: {
  a: PortalApprovalListItem;
  isLast: boolean;
}) {
  const statusTag = getApprovalStatusTag(a.status);
  const needsMyDecision = a.status === "open" && !a.myDecision;

  const progress =
    a.requiredCount > 0
      ? `${a.approvedCount}/${a.requiredCount} signed off`
      : "—";

  return (
    <Link
      href={`/portal/approvals/${a.id}`}
      className="pm2-table-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(240px, 2fr) 130px 140px 140px 130px",
        minWidth: 920,
        gap: 12,
        padding: "8px 16px",
        alignItems: "center",
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      {/* 1. Approval # / Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: needsMyDecision ? "#d97706" : "#3B82F6",
            background: needsMyDecision ? "#fef3c7" : "rgba(59, 130, 246, 0.08)",
            border: `1px solid ${
              needsMyDecision ? "#fde68a" : "rgba(59, 130, 246, 0.16)"
            }`,
          }}
        >
          <CheckSquare size={13} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={a.title}
          >
            {a.title}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 1,
            }}
          >
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 10,
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              {a.approvalNumber}
            </span>
            {needsMyDecision && (
              <span
                style={{
                  fontSize: 9.5,
                  padding: "0 5px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                  borderRadius: 4,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Needs your decision
              </span>
            )}
            {a.myDecision === "approved" && (
              <span
                style={{
                  fontSize: 9.5,
                  padding: "0 5px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#047857",
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                You approved
              </span>
            )}
            {a.myDecision === "rejected" && (
              <span
                style={{
                  fontSize: 9.5,
                  padding: "0 5px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                You rejected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Status */}
      <div>
        <Tag
          style={{
            borderRadius: 6,
            padding: "1px 8px",
            fontWeight: 700,
            fontSize: 10,
            textTransform: "uppercase",
            border: "none",
            margin: 0,
            color: statusTag.color,
            background: statusTag.bg,
          }}
        >
          {statusTag.label}
        </Tag>
      </div>

      {/* 3. Subject / Project */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "1px 6px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              color: "#475569",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {SUBJECT_LABEL[a.subjectType] || a.subjectType}
          </span>
          {a.projectName && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 7px",
                borderRadius: 6,
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: 10.5,
                fontWeight: 600,
                maxWidth: 110,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={a.projectName}
            >
              <FolderOpen size={10} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {a.projectName}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* 4. Progress */}
      <div
        style={{
          fontSize: 12,
          color: "#0f172a",
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Users size={12} color="#94a3b8" />
        <span>{progress}</span>
      </div>

      {/* 5. Due Date / Updated */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          color:
            a.dueDate && new Date(a.dueDate) < new Date() && a.status === "open"
              ? "#b91c1c"
              : "#475569",
          fontWeight:
            a.dueDate && new Date(a.dueDate) < new Date() && a.status === "open"
              ? 700
              : 500,
        }}
      >
        {a.dueDate ? (
          <>
            <Calendar size={12} color={a.dueDate && new Date(a.dueDate) < new Date() && a.status === "open" ? "#dc2626" : "#94a3b8"} />
            <span>Due {fmtRelative(a.dueDate)}</span>
          </>
        ) : (
          <>
            <Clock size={12} color="#94a3b8" />
            <span>{fmtRelative(a.lastActivityAt)}</span>
          </>
        )}
      </div>
    </Link>
  );
}

/* --------------------------------------------------------------- */
/*  Card Component (Card View)                                     */
/* --------------------------------------------------------------- */

function ApprovalCard({ a }: { a: PortalApprovalListItem }) {
  const statusTag = getApprovalStatusTag(a.status);
  const needsMyDecision = a.status === "open" && !a.myDecision;

  const progress =
    a.requiredCount > 0
      ? `${a.approvedCount}/${a.requiredCount} signed off`
      : "—";

  return (
    <Link
      href={`/portal/approvals/${a.id}`}
      className="pm2-card"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* Card Top */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: needsMyDecision ? "#d97706" : "#3B82F6",
              background: needsMyDecision ? "#fef3c7" : "rgba(59, 130, 246, 0.08)",
              border: `1px solid ${
                needsMyDecision ? "#fde68a" : "rgba(59, 130, 246, 0.16)"
              }`,
            }}
          >
            <CheckSquare size={13} />
          </div>
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              background: "#f1f5f9",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {a.approvalNumber}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {needsMyDecision && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 7px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                color: "#92400e",
                borderRadius: 6,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Needs decision
            </span>
          )}
          <Tag
            style={{
              borderRadius: 6,
              padding: "1px 8px",
              fontWeight: 700,
              fontSize: 10,
              textTransform: "uppercase",
              border: "none",
              margin: 0,
              color: statusTag.color,
              background: statusTag.bg,
            }}
          >
            {statusTag.label}
          </Tag>
        </div>
      </div>

      {/* Title */}
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
            wordBreak: "break-word",
          }}
        >
          {a.title}
        </div>
      </div>

      {/* Subject & Project */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            padding: "2px 7px",
            background: "#f1f5f9",
            color: "#475569",
            borderRadius: 6,
            fontSize: 10.5,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {SUBJECT_LABEL[a.subjectType] || a.subjectType}
        </span>
        {a.projectName && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 7px",
              borderRadius: 6,
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: 10.5,
              fontWeight: 600,
            }}
          >
            <FolderOpen size={10} />
            {a.projectName}
          </span>
        )}
      </div>

      {/* Progress Strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: "#f8fafc",
          padding: "8px 12px",
          borderRadius: 6,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Users size={12} color="#64748b" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
            {progress}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 11.5,
          color: "#64748b",
          marginTop: "auto",
          paddingTop: 8,
          borderTop: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Clock size={12} color="#94a3b8" />
          <span>Updated {fmtRelative(a.lastActivityAt)}</span>
        </div>

        {a.dueDate && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color:
                new Date(a.dueDate) < new Date() && a.status === "open"
                  ? "#b91c1c"
                  : "#64748b",
              fontWeight:
                new Date(a.dueDate) < new Date() && a.status === "open"
                  ? 700
                  : 500,
            }}
          >
            <Calendar size={12} color="#94a3b8" />
            <span>Due {fmtRelative(a.dueDate)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
