"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Input,
  Empty,
  Pagination,
  DatePicker,
  Modal,
  Form,
  notification,
  Button,
  Space,
  Tooltip,
  Typography,
  Select,
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
  LifeBuoy,
  Search,
  Plus,
  MessageCircle,
  Send,
  AlertTriangle,
  Clock,
  Folder,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  portalTicketService,
  PortalTicketListItem,
  PortalTicketMeta,
  TicketCategory,
  TicketPriority,
} from "@/services/portalTicketService";
import {
  p,
  TONE,
  CATEGORY_META,
  PRIORITY_META,
  STATUS_META,
  fmtRelative,
  fmtDate,
} from "./_ticketUi";
import TicketFilterPill, {
  FilterPillOption,
} from "@/components/projects/TicketFilterPill";
import { AttachmentPicker } from "@/app/portal/_components/AttachmentPicker";

dayjs.extend(quarterOfYear);

const { RangePicker } = DatePicker;

const STATUS_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_client", label: "Waiting on you" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const CATEGORY_FILTER_OPTIONS: FilterPillOption[] = [
  { value: "bug", label: "Bug" },
  { value: "enhancement", label: "Enhancement" },
  { value: "support", label: "Support" },
  { value: "infra", label: "Infra issue" },
  { value: "access", label: "Access request" },
  { value: "other", label: "Other" },
];

const CATEGORY_FORM_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "enhancement", label: "Enhancement" },
  { value: "support", label: "Support" },
  { value: "infra", label: "Infra issue" },
  { value: "access", label: "Access request" },
  { value: "other", label: "Other" },
];

const PRIORITY_FORM_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

export default function PortalTicketsPage() {
  const [items, setItems] = useState<PortalTicketListItem[]>([]);
  const [meta, setMeta] = useState<PortalTicketMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [page, setPage] = useState(1);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [limit, setLimit] = useState(15);
  const [notify, contextHolder] = notification.useNotification();

  const fromIso = datePicked?.[0]
    ? datePicked[0]!.format("YYYY-MM-DD")
    : undefined;
  const toIso = datePicked?.[1] ? datePicked[1]!.format("YYYY-MM-DD") : undefined;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalTicketService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        category: category === "ALL" ? undefined : category,
        priority: priority === "ALL" ? undefined : priority,
        search: search || undefined,
        projectId,
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
  }, [page, limit, status, category, priority, projectId, fromIso, toIso]);

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
    if (priority !== "ALL") count++;
    if (category !== "ALL") count++;
    if (projectId) count++;
    if (datePicked && (datePicked[0] || datePicked[1])) count++;
    return count;
  }, [status, priority, category, projectId, datePicked]);

  const filtered = useMemo(() => {
    let result = items;
    if (priority !== "ALL") {
      result = result.filter((t) => t.priority === priority);
    }
    if (category !== "ALL") {
      result = result.filter((t) => t.category === category);
    }
    return result;
  }, [items, priority, category]);

  const projectFilterOptions: FilterPillOption[] = useMemo(() => {
    if (!meta?.projects) return [];
    return meta.projects.map((proj) => ({
      value: proj.id,
      label: proj.code ? `${proj.name} (${proj.code})` : proj.name,
    }));
  }, [meta?.projects]);

  const total = meta?.total ?? filtered.length;
  const counts = meta?.counts || ({} as Record<string, number>);
  const waitingOnYouCount = counts.waiting_on_client || items.filter((t) => t.status === "waiting_on_client").length;
  const inProgressCount = counts.in_progress || items.filter((t) => t.status === "in_progress").length;
  const newCount = counts.new || items.filter((t) => t.status === "new").length;
  const resolvedCount = counts.resolved || items.filter((t) => t.status === "resolved").length;
  const closedCount = counts.closed || items.filter((t) => t.status === "closed").length;
  const completedPct = total > 0 ? Math.round(((resolvedCount + closedCount) / total) * 100) : 0;

  const activeStatusLabel = useMemo(() => {
    if (status === "ALL") return "All tickets";
    const found = STATUS_FILTER_OPTIONS.find((s) => s.value === status);
    return found ? found.label : "All tickets";
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
      {contextHolder}

      {/* ── Top Header Toolbar matching unified client portal layout ── */}
      <div className="pm2-toolbar saas-header-container sc-header">
        <div className="pm2-head-id">
          <span className="pm2-head-ic">
            <LifeBuoy size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Support Tickets</span>
            <span className="pm2-head-sub">OVERSEE ISSUES & INQUIRIES</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search ticket # or subject..."
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
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
            style={{
              height: 32,
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 12.5,
              background: "#3b82f6",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Raise ticket
          </Button>

          <Tooltip title="Refresh tickets">
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

            {/* Priority Pill */}
            <TicketFilterPill
              icon={<ShieldAlert size={12} />}
              label="Priority"
              value={priority === "ALL" ? "" : priority}
              options={PRIORITY_FILTER_OPTIONS}
              onChange={(val: any) => {
                setPriority(val || "ALL");
              }}
              itemNoun="priorities"
              multiple={false}
            />

            {/* Category Pill */}
            <TicketFilterPill
              icon={<LifeBuoy size={12} />}
              label="Category"
              value={category === "ALL" ? "" : category}
              options={CATEGORY_FILTER_OPTIONS}
              onChange={(val: any) => {
                setCategory(val || "ALL");
              }}
              itemNoun="categories"
              multiple={false}
            />

            {/* Project Pill */}
            {projectFilterOptions.length > 0 && (
              <TicketFilterPill
                icon={<Folder size={12} />}
                label="Project"
                value={projectId || ""}
                options={projectFilterOptions}
                onChange={(val: any) => {
                  setProjectId(val || undefined);
                  setPage(1);
                }}
                itemNoun="projects"
                multiple={false}
              />
            )}

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
                  setPriority("ALL");
                  setCategory("ALL");
                  setProjectId(undefined);
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
              Support Overview — {activeStatusLabel}
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {total} TICKETS
              </span>
              {waitingOnYouCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-delayed">
                  {waitingOnYouCount} WAITING ON YOU
                </span>
              )}
              {inProgressCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {inProgressCount} IN PROGRESS
                </span>
              )}
              {newCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-neutral">
                  {newCount} NEW
                </span>
              )}
              {(resolvedCount > 0 || closedCount > 0) && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {resolvedCount + closedCount} RESOLVED
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
          {waitingOnYouCount > 0 && (
            <span className="tl-sprint-meta" style={{ color: "#d97706" }}>
              <b>{waitingOnYouCount}</b> action required
            </span>
          )}
          <span className="tl-sprint-meta">
            <b>{inProgressCount}</b> in progress
          </span>
          <span className="tl-sprint-meta">
            <b>{newCount}</b> new
          </span>
          <span className="tl-sprint-meta">
            <b>{resolvedCount + closedCount}</b> closed / resolved
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
        className="portal-tickets-content"
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
                    ? "No tickets match your filter criteria."
                    : "No support tickets raised yet."}
                </span>
              }
            >
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => setCreateOpen(true)}
                style={{
                  marginTop: 12,
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 12.5,
                  background: "#3b82f6",
                  border: "none",
                }}
              >
                Raise a ticket
              </Button>
            </Empty>
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
                  "minmax(240px, 2fr) 130px 110px 120px 140px 120px",
                minWidth: 900,
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
              <div>TICKET # / SUBJECT</div>
              <div>STATUS</div>
              <div>PRIORITY</div>
              <div>CATEGORY</div>
              <div>PROJECT</div>
              <div>UPDATED</div>
            </div>

            <div>
              {filtered.map((ticket, idx) => (
                <TicketTableRow
                  key={ticket.id}
                  ticket={ticket}
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
            {filtered.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer ── */}
      <div
        className="portal-tickets-pagination-footer"
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
            ticket{total !== 1 ? "s" : ""}
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

      <RaiseTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        notify={notify}
        onCreated={() => {
          setCreateOpen(false);
          setPage(1);
          load();
        }}
      />

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

        .portal-tickets-pagination-footer .ant-pagination-item,
        .portal-tickets-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .portal-tickets-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200, #e2e8f0) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500, #64748b) !important;
        }
        .portal-tickets-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .portal-tickets-pagination-footer .ant-pagination-item-active a {
          color: #ffffff !important;
        }

        .portal-tickets-modal-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (max-width: 600px) {
          .portal-tickets-modal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Table Row Component (Edge-to-edge, NO Actions Column)          */
/* --------------------------------------------------------------- */

function TicketTableRow({
  ticket,
  isLast,
}: {
  ticket: PortalTicketListItem;
  isLast: boolean;
}) {
  const isWaiting = ticket.status === "waiting_on_client";
  const breached =
    ticket.sla.firstResponseBreached || ticket.sla.resolutionBreached;

  return (
    <Link
      href={`/portal/tickets/${ticket.id}`}
      className="pm2-table-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(240px, 2fr) 130px 110px 120px 140px 120px",
        minWidth: 900,
        gap: 12,
        padding: "8px 16px",
        alignItems: "center",
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      {/* 1. Ticket # / Subject */}
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
            color: isWaiting ? "#d97706" : "#3B82F6",
            background: isWaiting ? "#fef3c7" : "rgba(59, 130, 246, 0.08)",
            border: `1px solid ${
              isWaiting ? "#fde68a" : "rgba(59, 130, 246, 0.16)"
            }`,
          }}
        >
          <LifeBuoy size={13} />
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
            title={ticket.subject}
          >
            {ticket.subject}
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
              {ticket.ticketNumber}
            </span>
            {isWaiting && (
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
                Waiting on you
              </span>
            )}
            {breached && (
              <span
                style={{
                  fontSize: 9.5,
                  padding: "0 5px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: 4,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                SLA breach
              </span>
            )}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10,
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              <MessageCircle size={10} />
              {ticket.messageCount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Status */}
      <div>
        <StatusPill status={ticket.status} compact />
      </div>

      {/* 3. Priority */}
      <div>
        <PriorityChip priority={ticket.priority} compact />
      </div>

      {/* 4. Category */}
      <div>
        <CategoryChip category={ticket.category} compact />
      </div>

      {/* 5. Project */}
      <div style={{ minWidth: 0 }}>
        {ticket.projectName ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
            title={ticket.projectName}
          >
            <Folder size={11} color="#94a3b8" />
            {ticket.projectName}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
        )}
      </div>

      {/* 6. Updated */}
      <div>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
          {fmtRelative(ticket.lastActivityAt)}
        </span>
      </div>
    </Link>
  );
}

/* --------------------------------------------------------------- */
/*  Card Component                                                 */
/* --------------------------------------------------------------- */

function TicketCard({ ticket }: { ticket: PortalTicketListItem }) {
  const isWaiting = ticket.status === "waiting_on_client";
  const breached =
    ticket.sla.firstResponseBreached || ticket.sla.resolutionBreached;

  return (
    <Link
      href={`/portal/tickets/${ticket.id}`}
      className="pm2-card"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px 18px",
        background: "#ffffff",
        border: `1px solid ${isWaiting ? "#fde68a" : "#e2e8f0"}`,
        borderRadius: 10,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* Top row: Icon + Number + Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: isWaiting ? "#d97706" : "#3B82F6",
              background: isWaiting ? "#fef3c7" : "rgba(59, 130, 246, 0.08)",
              border: `1px solid ${
                isWaiting ? "#fde68a" : "rgba(59, 130, 246, 0.16)"
              }`,
            }}
          >
            <LifeBuoy size={14} />
          </div>
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            {ticket.ticketNumber}
          </span>
        </div>

        <StatusPill status={ticket.status} compact />
      </div>

      {/* Title */}
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.35,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
          title={ticket.subject}
        >
          {ticket.subject}
        </div>
      </div>

      {/* Chips: Category, Priority, SLA breach */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <CategoryChip category={ticket.category} compact />
        <PriorityChip priority={ticket.priority} compact />
        {isWaiting && (
          <span
            style={{
              fontSize: 10,
              padding: "1px 7px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92400e",
              borderRadius: 999,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Waiting on you
          </span>
        )}
        {breached && (
          <span
            style={{
              fontSize: 10,
              padding: "1px 7px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: 999,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            SLA breach
          </span>
        )}
      </div>

      {/* Footer: Project & Details */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 10,
          borderTop: "1px solid #f1f5f9",
          fontSize: 11,
          color: "#64748b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
          {ticket.projectName && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 600,
                color: "#334155",
                maxWidth: 160,
              }}
            >
              <Folder size={11} color="#94a3b8" />
              {ticket.projectName}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <MessageCircle size={11} color="#94a3b8" />
            {ticket.messageCount}
          </span>
          <span style={{ fontWeight: 500 }}>
            {fmtRelative(ticket.lastActivityAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* --------------------------------------------------------------- */
/*  Pill and Chip Helpers                                          */
/* --------------------------------------------------------------- */

function StatusPill({
  status,
  compact,
}: {
  status: string;
  compact?: boolean;
}) {
  const st = STATUS_META[status] || STATUS_META.new;
  const Icon = st.icon;
  const tone = TONE[st.tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: compact ? "1px 7px" : "2px 8px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: compact ? 10.5 : 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={10} />
      {st.label}
    </span>
  );
}

function PriorityChip({
  priority,
  compact,
}: {
  priority: string;
  compact?: boolean;
}) {
  const pri = PRIORITY_META[priority] || PRIORITY_META.medium;
  const tone = TONE[pri.tone];
  return (
    <span
      style={{
        display: "inline-block",
        padding: compact ? "1px 7px" : "2px 8px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: compact ? 10.5 : 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {pri.label}
    </span>
  );
}

function CategoryChip({
  category,
  compact,
}: {
  category: string;
  compact?: boolean;
}) {
  const cat = CATEGORY_META[category] || CATEGORY_META.other;
  const Icon = cat.icon;
  const tone = TONE[cat.tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: compact ? "1px 7px" : "2px 8px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: compact ? 10.5 : 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={10} />
      {cat.label}
    </span>
  );
}

/* ====================================================================== */
/*  Raise Ticket Modal                                                     */
/* ====================================================================== */

function RaiseTicketModal({
  open,
  onClose,
  onCreated,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  notify: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<
    { dataUrl: string; name: string; size: number }[]
  >([]);
  const [projects, setProjects] = useState<
    { id: string; name: string; code: string | null }[]
  >([]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setFiles([]);
      return;
    }
    portalTicketService
      .projectOptions()
      .then((list) => setProjects(list || []))
      .catch(() => setProjects([]));
    form.setFieldsValue({ category: "support", priority: "medium" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      notify.error({ message: `${f.name} exceeds 10 MB` });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFiles((prev) => [
        ...prev,
        { dataUrl: String(reader.result), name: f.name, size: f.size },
      ]);
    };
    reader.readAsDataURL(f);
  };

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      await portalTicketService.create({
        subject: values.subject.trim(),
        category: values.category,
        priority: values.priority,
        projectId: values.projectId || undefined,
        body: values.body.trim(),
        attachments: files.map((f) => ({
          dataUrl: f.dataUrl,
          fileName: f.name,
        })),
      });
      notify.success({ message: "Ticket raised" });
      onCreated();
    } catch (err: any) {
      notify.error({
        message: "Could not raise ticket",
        description: err?.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={620}
      closable={false}
      styles={{
        mask: { backgroundColor: "rgba(15,23,42,0.45)" },
        content: {
          background: "#ffffff",
          border: `1px solid ${p.border}`,
          padding: 0,
          overflow: "hidden",
          borderRadius: 14,
        },
        body: { padding: 0 },
      }}
    >
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: "rgba(59, 130, 246, 0.1)",
            color: "#2563eb",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LifeBuoy size={18} />
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: p.text }}>
            Raise a new ticket
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              color: p.textSubtle,
              lineHeight: 1.5,
            }}
          >
            We&apos;ll respond based on the priority you choose. Critical issues
            get a 1-hour first-response target.
          </div>
        </div>
      </div>

      <div style={{ padding: 22 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          requiredMark={false}
        >
          <Form.Item
            name="subject"
            label={
              <span style={{ fontSize: 12.5, color: p.textMuted, fontWeight: 600 }}>
                Subject
              </span>
            }
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Input
              placeholder="Brief, specific summary (e.g. Login page returns 500)"
              maxLength={120}
              showCount
            />
          </Form.Item>

          <div className="portal-tickets-modal-grid">
            <Form.Item
              name="category"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted, fontWeight: 600 }}>
                  Category
                </span>
              }
              rules={[{ required: true }]}
            >
              <Select options={CATEGORY_FORM_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="priority"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted, fontWeight: 600 }}>
                  Priority
                </span>
              }
              rules={[{ required: true }]}
            >
              <Select options={PRIORITY_FORM_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="projectId"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted, fontWeight: 600 }}>
                  Project (optional)
                </span>
              }
            >
              <Select
                allowClear
                placeholder="—"
                options={projects.map((proj) => ({
                  value: proj.id,
                  label: proj.code ? `${proj.name} (${proj.code})` : proj.name,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="body"
            label={
              <span style={{ fontSize: 12.5, color: p.textMuted, fontWeight: 600 }}>
                Details
              </span>
            }
            rules={[{ required: true, message: "Please describe the issue" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder={
                "What did you expect to happen? What actually happened?\n\nSteps to reproduce, browser/device, URLs, screenshots help a lot."
              }
            />
          </Form.Item>

          {/* Attachments */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12.5,
                color: p.textMuted,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Attachments{" "}
              <span style={{ color: p.textFaint, fontSize: 11.5, fontWeight: 400 }}>
                · optional · 10 MB each
              </span>
            </div>
            <AttachmentPicker
              files={files}
              onAdd={handleFile}
              onRemove={(i) =>
                setFiles((prev) => prev.filter((_, idx) => idx !== i))
              }
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
              paddingTop: 14,
              borderTop: `1px solid ${p.border}`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 14px",
                background: "#ffffff",
                border: `1px solid ${p.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: p.textMuted,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Send size={13} />
              {submitting ? "Submitting…" : "Submit ticket"}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
