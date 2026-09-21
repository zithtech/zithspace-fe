"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Empty,
  Pagination,
  DatePicker,
  notification,
  Typography,
  Button,
  Tag,
  Tooltip,
  Space,
} from "antd";
import {
  FilterOutlined,
  ExpandAltOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import {
  Search,
  Calendar,
  Users,
  Video,
  Clock,
  RotateCw,
  FolderOpen,
  List as ListIcon,
  LayoutGrid,
} from "lucide-react";
import MomDetailDrawer from "@/app/portal/_components/MomDetailDrawer";
import {
  portalMomService,
  PortalMomListItem,
  PortalMomMeta,
} from "@/services/portalMomService";
import { usePortalSocket } from "@/providers/PortalSocketProvider";
import TicketFilterPill, {
  FilterPillOption,
} from "@/components/projects/TicketFilterPill";

const { RangePicker } = DatePicker;

/* --------------------------------------------------------------- */
/*  Theme palette                                                  */
/* --------------------------------------------------------------- */

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceSubtle: "#f1f5f9",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#3b82f6",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

/* --------------------------------------------------------------- */
/*  Formatters                                                     */
/* --------------------------------------------------------------- */

function fmtDateShort(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtTimeOnly(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/* --------------------------------------------------------------- */
/*  Main Component                                                 */
/* --------------------------------------------------------------- */

export default function PortalMomPage() {
  const [items, setItems] = useState<PortalMomListItem[]>([]);
  const [meta, setMeta] = useState<PortalMomMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [activeMomId, setActiveMomId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const fromIso = datePicked?.[0]
    ? datePicked[0]!.format("YYYY-MM-DD")
    : undefined;
  const toIso = datePicked?.[1] ? datePicked[1]!.format("YYYY-MM-DD") : undefined;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalMomService.list({
        page,
        limit,
        projectId,
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
  }, [page, limit, projectId, fromIso, toIso]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Real-time updates
  const { socket, connected } = usePortalSocket();
  useEffect(() => {
    if (!socket || !connected) return;
    const handler = () => load();
    socket.on("mom:created", handler);
    socket.on("mom:updated", handler);
    socket.on("mom:deleted", handler);
    return () => {
      socket.off("mom:created", handler);
      socket.off("mom:updated", handler);
      socket.off("mom:deleted", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, connected]);

  const projectOptions: FilterPillOption[] = useMemo(() => {
    return (
      meta?.projects?.map((proj) => ({
        value: proj.id,
        label: proj.name,
      })) || []
    );
  }, [meta?.projects]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (projectId) count++;
    if (datePicked && (datePicked[0] || datePicked[1])) count++;
    return count;
  }, [projectId, datePicked]);

  const filteredItems = useMemo(() => {
    if (!datePicked || !datePicked[0] || !datePicked[1]) return items;
    const [start, end] = datePicked;
    return items.filter((m) => {
      if (!m.meetingDate) return false;
      const d = dayjs(m.meetingDate);
      return (
        (d.isAfter(start, "day") || d.isSame(start, "day")) &&
        (d.isBefore(end, "day") || d.isSame(end, "day"))
      );
    });
  }, [items, datePicked]);

  const total = meta?.total ?? filteredItems.length;

  const stats = useMemo(() => {
    const now = dayjs();
    const startOfMonth = now.startOf("month");
    const thisMonth = filteredItems.filter(
      (m) => m.meetingDate && dayjs(m.meetingDate).isAfter(startOfMonth)
    ).length;
    const openActions = filteredItems.reduce(
      (s, m) => s + (m.openActionCount || 0),
      0
    );
    const totalActions = filteredItems.reduce(
      (s, m) => s + (m.actionCount || 0),
      0
    );
    const decisions = filteredItems.reduce(
      (s, m) => s + (m.decisionCount || 0),
      0
    );
    const actionPct =
      totalActions > 0
        ? Math.round(((totalActions - openActions) / totalActions) * 100)
        : 100;
    return {
      thisMonth,
      openActions,
      totalActions,
      decisions,
      actionPct,
    };
  }, [filteredItems]);

  const activeProjectLabel = useMemo(() => {
    if (!projectId) return "All meetings";
    const found = meta?.projects?.find((p) => p.id === projectId);
    return found ? found.name : "All meetings";
  }, [projectId, meta?.projects]);

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
      {/* ── Top Header Toolbar matching Invoices ── */}
      <div className="pm2-toolbar saas-header-container sc-header">
        <div className="pm2-head-id">
          <span className="pm2-head-ic">
            <Video size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Meetings</span>
            <span className="pm2-head-sub">MOM & ACTION ITEMS</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search meeting name..."
            prefix={<Search size={13} style={{ color: "var(--text-slate-400)", marginRight: 4 }} />}
            className="saas-input"
            style={{ maxWidth: 280, borderRadius: 8, height: 32, background: "transparent", fontSize: 12.5 }}
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
          <div className="premium-view-toggle" role="group" aria-label="View mode">
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
          <Tooltip title="Refresh meetings">
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => load(true)}
              disabled={loading}
              style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
            />
          </Tooltip>
        </Space>
      </div>

      {/* ── Inline filter row (when opened) matching Invoices ── */}
      {isFilterRowOpen && (
        <div className="tl-filter-row">
          <div className="tl-filter-row-label">
            <FilterOutlined style={{ fontSize: 11 }} />
            <span>Filters</span>
            <span className="tl-filter-row-count">{activeFilterCount}</span>
          </div>

          <div className="tl-filter-row-pills">
            {/* Project Pill */}
            {projectOptions.length > 0 && (
              <TicketFilterPill
                icon={<FolderOpen size={12} />}
                label="Project"
                value={projectId}
                options={projectOptions}
                onChange={(val: any) => {
                  setProjectId(val || undefined);
                  setPage(1);
                }}
                itemNoun="projects"
                width={240}
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
              Meetings — {activeProjectLabel}
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {total} MEETINGS
              </span>
              {stats.thisMonth > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {stats.thisMonth} THIS MONTH
                </span>
              )}
              {activeFilterCount > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-running">
                  {activeFilterCount} FILTERED
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <span className="pm2-pulse-dot" />
            <b>{filteredItems.length}</b>{" "}
            {filteredItems.length === 1 ? "result" : "results"} on this page
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.thisMonth}</b> this month
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.openActions}</b> open actions
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.decisions}</b> decisions
          </span>
        </div>

        <div className="tl-sprint-row3">
          <div className="tl-sprint-progress-bar">
            <div
              className="tl-sprint-progress-fill"
              style={{ width: `${Math.min(100, stats.actionPct)}%` }}
            />
          </div>
          <span className="tl-sprint-progress-pct">{stats.actionPct}%</span>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div
        className="portal-mom-content"
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
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle }}>
                  {search || activeFilterCount > 0
                    ? "No meetings match your filter criteria."
                    : "No meeting minutes shared yet."}
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
                  "minmax(240px, 2fr) 140px 150px 120px 120px 110px",
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
              <div>MEETING / MOM</div>
              <div>PROJECT</div>
              <div>DATE & TIME</div>
              <div>ATTENDEES</div>
              <div>ACTION ITEMS</div>
              <div>DECISIONS</div>
            </div>

            <div>
              {filteredItems.map((mom, idx) => (
                <MomRow
                  key={mom.id}
                  mom={mom}
                  isLast={idx === filteredItems.length - 1}
                  onClick={() => setActiveMomId(mom.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Card View */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
              padding: "16px 24px",
            }}
          >
            {filteredItems.map((mom) => (
              <MomCard
                key={mom.id}
                mom={mom}
                onClick={() => setActiveMomId(mom.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer ── */}
      <div
        className="portal-mom-pagination-footer"
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
              {total > 0 ? (page - 1) * limit + 1 : 0}–
              {Math.min(page * limit, total)}
            </span>{" "}
            of <span style={{ color: p.text, fontWeight: 700 }}>{total}</span>{" "}
            meeting{total !== 1 ? "s" : ""}
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

      {/* MOM Detail Drawer */}
      <MomDetailDrawer
        momId={activeMomId}
        onClose={() => setActiveMomId(null)}
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
          font-size: 14px;
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
        .tl-sprint-tag-running {
          background: transparent;
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.32);
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
          flex: 1;
          height: 5px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }
        .tl-sprint-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
          border-radius: 999px;
          transition: width 300ms ease;
        }
        .tl-sprint-progress-pct {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          min-width: 32px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        /* Row hover */
        .pm2-table-row {
          transition: background 120ms ease;
        }
        .pm2-table-row:hover {
          background: #f8fafc !important;
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

        .portal-mom-pagination-footer .ant-pagination-item,
        .portal-mom-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .portal-mom-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: #64748b !important;
        }
        .portal-mom-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .portal-mom-pagination-footer .ant-pagination-item-active a {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Row Component (Table View)                                     */
/* --------------------------------------------------------------- */

function MomRow({
  mom,
  isLast,
  onClick,
}: {
  mom: PortalMomListItem;
  isLast: boolean;
  onClick: () => void;
}) {
  const timeStr = fmtTimeOnly(mom.meetingDate);

  return (
    <div
      onClick={onClick}
      className="pm2-table-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(240px, 2fr) 140px 150px 120px 120px 110px",
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
      {/* 1. Meeting Title & MOM # */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3B82F6",
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.16)",
          }}
        >
          <Video size={13} />
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
          >
            {mom.title || "Meeting"}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#64748b",
              marginTop: 1,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontWeight: 600,
            }}
          >
            {mom.momNumber || `#${mom.id.slice(0, 8)}`}
          </span>
        </div>
      </div>

      {/* 2. Project */}
      <div>
        {mom.projectName ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 6,
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#3b82f6",
              }}
            />
            {mom.projectName}
          </span>
        ) : (
          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
        )}
      </div>

      {/* 3. Date & Time */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          color: "#475569",
        }}
      >
        <Calendar size={12} color="#94a3b8" />
        <span>
          {fmtDateShort(mom.meetingDate)}
          {timeStr && ` · ${timeStr}`}
        </span>
      </div>

      {/* 4. Attendees */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11.5,
          color: "#475569",
        }}
      >
        <Users size={12} color="#94a3b8" />
        <span>{mom.attendeeCount || 0} attendees</span>
      </div>

      {/* 5. Action Items */}
      <div>
        {mom.openActionCount > 0 ? (
          <Tag
            style={{
              borderRadius: 6,
              padding: "1px 8px",
              fontWeight: 700,
              fontSize: 10,
              textTransform: "uppercase",
              border: "none",
              margin: 0,
              color: "#b45309",
              background: "#fef3c7",
            }}
          >
            {mom.openActionCount} OPEN
          </Tag>
        ) : mom.actionCount > 0 ? (
          <Tag
            style={{
              borderRadius: 6,
              padding: "1px 8px",
              fontWeight: 700,
              fontSize: 10,
              textTransform: "uppercase",
              border: "none",
              margin: 0,
              color: "#15803d",
              background: "#dcfce7",
            }}
          >
            ALL DONE
          </Tag>
        ) : (
          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
        )}
      </div>

      {/* 6. Decisions */}
      <div>
        {mom.decisionCount > 0 ? (
          <Tag
            style={{
              borderRadius: 6,
              padding: "1px 8px",
              fontWeight: 700,
              fontSize: 10,
              textTransform: "uppercase",
              border: "none",
              margin: 0,
              color: "#4338ca",
              background: "#e0e7ff",
            }}
          >
            {mom.decisionCount} LOGGED
          </Tag>
        ) : (
          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Card Component (Card View)                                     */
/* --------------------------------------------------------------- */

function MomCard({
  mom,
  onClick,
}: {
  mom: PortalMomListItem;
  onClick: () => void;
}) {
  const timeStr = fmtTimeOnly(mom.meetingDate);

  return (
    <div
      onClick={onClick}
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
              color: "#3B82F6",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.16)",
            }}
          >
            <Video size={13} />
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
            {mom.momNumber || `#${mom.id.slice(0, 8)}`}
          </span>
        </div>

        {mom.projectName && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 6,
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#3b82f6",
              }}
            />
            {mom.projectName}
          </span>
        )}
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
          }}
        >
          {mom.title || "Meeting"}
        </div>
        {mom.summaryPreview && (
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 4,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {mom.summaryPreview}
          </div>
        )}
      </div>

      {/* Meta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 11.5,
          color: "#64748b",
          marginTop: "auto",
          paddingTop: 8,
          borderTop: "1px solid #f1f5f9",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Calendar size={12} color="#94a3b8" />
          <span>
            {fmtDateShort(mom.meetingDate)}
            {timeStr && ` · ${timeStr}`}
          </span>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Users size={12} color="#94a3b8" />
          <span>{mom.attendeeCount || 0} attendees</span>
        </div>
      </div>

      {/* Footer tags */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
          {mom.openActionCount > 0 ? (
            <Tag
              style={{
                borderRadius: 6,
                padding: "1px 8px",
                fontWeight: 700,
                fontSize: 10,
                textTransform: "uppercase",
                border: "none",
                margin: 0,
                color: "#b45309",
                background: "#fef3c7",
              }}
            >
              {mom.openActionCount} OPEN
            </Tag>
          ) : mom.actionCount > 0 ? (
            <Tag
              style={{
                borderRadius: 6,
                padding: "1px 8px",
                fontWeight: 700,
                fontSize: 10,
                textTransform: "uppercase",
                border: "none",
                margin: 0,
                color: "#15803d",
                background: "#dcfce7",
              }}
            >
              ALL DONE
            </Tag>
          ) : null}

          {mom.decisionCount > 0 && (
            <Tag
              style={{
                borderRadius: 6,
                padding: "1px 8px",
                fontWeight: 700,
                fontSize: 10,
                textTransform: "uppercase",
                border: "none",
                margin: 0,
                color: "#4338ca",
                background: "#e0e7ff",
              }}
            >
              {mom.decisionCount} DECISIONS
            </Tag>
          )}
        </div>
      </div>
    </div>
  );
}
