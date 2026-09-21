"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect, useMemo, useState } from "react";
import {
  Empty,
  Pagination,
  DatePicker,
  Typography,
  Drawer,
  Button,
  Space,
  Tooltip,
  Input,
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
  Search,
  Rocket,
  ChevronRight,
  Calendar,
  Flag,
  FolderKanban,
  Tag,
  Folder,
  LayoutGrid,
  List as ListIcon,
  ArrowLeft,
  CalendarRange,
} from "lucide-react";
import {
  portalReleaseService,
  PortalRelease,
  PortalReleaseMeta,
  PortalReleaseStats,
} from "@/services/portalReleaseService";
import TicketFilterPill, {
  FilterPillOption,
} from "@/components/projects/TicketFilterPill";

dayjs.extend(quarterOfYear);

const { RangePicker } = DatePicker;

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  indigo: "#4f46e5",
  indigoBg: "#eef2ff",
  indigoBorder: "#c7d2fe",
  indigoText: "#4338ca",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  purpleBg: "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText: "#6d28d9",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
  overlay: "rgba(15,23,42,0.45)",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export default function PortalReleasesPage() {
  const [items, setItems] = useState<PortalRelease[]>([]);
  const [meta, setMeta] = useState<PortalReleaseMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [page, setPage] = useState(1);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [limit, setLimit] = useState(15);

  const fromIso = datePicked?.[0]?.format("YYYY-MM-DD") || undefined;
  const toIso = datePicked?.[1]?.format("YYYY-MM-DD") || undefined;

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await portalReleaseService.list({
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
    if (projectId) count++;
    if (datePicked && (datePicked[0] || datePicked[1])) count++;
    return count;
  }, [projectId, datePicked]);

  const filtered = items;

  const projectFilterOptions: FilterPillOption[] = useMemo(() => {
    if (!meta?.projects) return [];
    return meta.projects.map((proj) => ({
      value: proj.id,
      label: proj.name,
    }));
  }, [meta?.projects]);

  const stats: PortalReleaseStats = meta?.stats || {
    total: 0,
    thisMonth: 0,
    distinctProjects: 0,
    withMilestone: 0,
    latestVersion: null,
    latestDate: null,
  };

  const total = meta?.total ?? filtered.length;
  const progressPct = total > 0 ? 100 : 0;

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
      {/* ── Top Header Toolbar matching unified layout ── */}
      <div className="pm2-toolbar saas-header-container sc-header">
        <div className="pm2-head-id">
          <span className="pm2-head-ic">
            <Rocket size={16} />
          </span>
          <span className="pm2-head-text">
            <span className="pm2-head-title">Releases</span>
            <span className="pm2-head-sub">WHAT WE&apos;VE SHIPPED & VERSION HISTORY</span>
          </span>
        </div>

        <div className="sc-header-controls">
          <Input
            placeholder="Quick search title or version..."
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
          <Tooltip title="Refresh releases">
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
              suffixIcon={<CalendarRange size={12} color={p.textFaint} />}
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
              Releases Overview
            </span>
            <span className="tl-sprint-tags">
              <span className="tl-sprint-tag tl-sprint-tag-neutral">
                {stats.total} RELEASES
              </span>
              {stats.thisMonth > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  {stats.thisMonth} THIS MONTH
                </span>
              )}
              {stats.distinctProjects > 0 && (
                <span className="tl-sprint-tag tl-sprint-tag-neutral">
                  {stats.distinctProjects} PROJECTS
                </span>
              )}
              {stats.latestVersion && (
                <span className="tl-sprint-tag tl-sprint-tag-active">
                  LATEST {stats.latestVersion}
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
            <b>{stats.thisMonth}</b> released this month
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.distinctProjects}</b> active projects
          </span>
          {stats.latestVersion && (
            <span className="tl-sprint-meta">
              Latest: <b>{stats.latestVersion}</b>{" "}
              {stats.latestDate ? `(${fmtDate(stats.latestDate)})` : ""}
            </span>
          )}
        </div>

        <div className="tl-sprint-row3">
          <div className="tl-sprint-progress-bar">
            <div
              className="tl-sprint-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="tl-sprint-progress-pct">{progressPct}%</span>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div
        className="portal-releases-content"
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
                    ? "No releases match your filter criteria."
                    : "No releases published yet."}
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
                  "minmax(240px, 2fr) 140px 140px minmax(200px, 2fr) 120px",
                minWidth: 880,
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
              <div>RELEASE TITLE / VERSION</div>
              <div>PROJECT</div>
              <div>MILESTONE</div>
              <div>CHANGELOG PREVIEW</div>
              <div>RELEASE DATE</div>
            </div>

            <div>
              {filtered.map((r, idx) => (
                <ReleaseTableRow
                  key={r.id}
                  release={r}
                  isLast={idx === filtered.length - 1}
                  onOpen={() => setActiveId(r.id)}
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
            {filtered.map((r) => (
              <ReleaseCard
                key={r.id}
                release={r}
                onOpen={() => setActiveId(r.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Fixed Sticky Bottom Footer ── */}
      <div
        className="portal-releases-pagination-footer"
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
            release{total !== 1 ? "s" : ""}
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

      <ReleaseDetailDrawer
        id={activeId}
        onClose={() => setActiveId(null)}
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

        .portal-releases-pagination-footer .ant-pagination-item,
        .portal-releases-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .portal-releases-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200, #e2e8f0) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500, #64748b) !important;
        }
        .portal-releases-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .portal-releases-pagination-footer .ant-pagination-item-active a {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Table Row Component (Edge-to-edge, NO Actions Column)          */
/* --------------------------------------------------------------- */

function ReleaseTableRow({
  release,
  isLast,
  onOpen,
}: {
  release: PortalRelease;
  isLast: boolean;
  onOpen: () => void;
}) {
  const preview = stripHtml(release.description).slice(0, 140);

  return (
    <div
      onClick={onOpen}
      className="pm2-table-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(240px, 2fr) 140px 140px minmax(200px, 2fr) 120px",
        minWidth: 880,
        gap: 12,
        padding: "8px 16px",
        alignItems: "center",
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      {/* 1. Release Title / Version */}
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
            color: "#3B82F6",
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.16)",
          }}
        >
          <Rocket size={13} />
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
            title={release.title}
          >
            {release.title}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 1,
            }}
          >
            {release.version ? (
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 10,
                  padding: "0 6px",
                  background: p.purpleBg,
                  border: `1px solid ${p.purpleBorder}`,
                  color: p.purpleText,
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                {release.version}
              </span>
            ) : (
              <span style={{ fontSize: 10, color: "#94a3b8" }}>No version</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Project */}
      <div style={{ minWidth: 0 }}>
        {release.project ? (
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
            title={release.project.name}
          >
            <FolderKanban size={11} color="#94a3b8" />
            {release.project.name}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
        )}
      </div>

      {/* 3. Milestone */}
      <div style={{ minWidth: 0 }}>
        {release.milestone ? (
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
            title={release.milestone.name}
          >
            <Flag size={11} color="#94a3b8" />
            {release.milestone.name}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
        )}
      </div>

      {/* 4. Changelog Preview */}
      <div style={{ minWidth: 0 }}>
        <span
          style={{
            fontSize: 12,
            color: "#64748b",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
          title={preview}
        >
          {preview || "—"}
        </span>
      </div>

      {/* 5. Release Date */}
      <div>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
          {fmtDate(release.releaseDate)}
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Card Component                                                 */
/* --------------------------------------------------------------- */

function ReleaseCard({
  release,
  onOpen,
}: {
  release: PortalRelease;
  onOpen: () => void;
}) {
  const preview = stripHtml(release.description).slice(0, 180);

  return (
    <div
      onClick={onOpen}
      className="pm2-card"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px 18px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* Top row */}
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
              color: "#3B82F6",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.16)",
            }}
          >
            <Rocket size={14} />
          </div>
          {release.version && (
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11,
                fontWeight: 700,
                color: p.purpleText,
                padding: "1px 7px",
                background: p.purpleBg,
                border: `1px solid ${p.purpleBorder}`,
                borderRadius: 4,
              }}
            >
              {release.version}
            </span>
          )}
        </div>

        <span
          style={{
            fontSize: 11,
            color: "#64748b",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 500,
          }}
        >
          <Calendar size={11} color="#94a3b8" />
          {fmtDate(release.releaseDate)}
        </span>
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
          title={release.title}
        >
          {release.title}
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {preview}
        </div>
      )}

      {/* Footer: Project & Milestone */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {release.project && (
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
                maxWidth: 140,
              }}
            >
              <FolderKanban size={11} color="#94a3b8" />
              {release.project.name}
            </span>
          )}
          {release.milestone && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 500,
                color: "#64748b",
                maxWidth: 140,
              }}
            >
              <Flag size={11} color="#94a3b8" />
              {release.milestone.name}
            </span>
          )}
        </div>

        <ChevronRight size={14} color="#94a3b8" />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */
/*  Release Detail Drawer                                          */
/* --------------------------------------------------------------- */

function ReleaseDetailDrawer({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<PortalRelease | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setData(null);
      setNotFound(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    portalReleaseService
      .detail(id)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={760}
      title={null}
      closable={false}
      destroyOnClose
      styles={{
        mask: { backgroundColor: p.overlay },
        content: { background: p.surfaceElevated },
        header: { display: "none" },
        body: {
          padding: 0,
          background: p.surfaceElevated,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "14px 22px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "#ffffff",
            border: `1px solid ${p.border}`,
            borderRadius: 8,
            fontSize: 12.5,
            color: p.textMuted,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} />
          Close
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "22px 24px 28px",
        }}
      >
        {loading ? (
          <div
            style={{
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ZukvoLoader size="md" />
          </div>
        ) : notFound || !data ? (
          <div
            style={{
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle, fontSize: 13 }}>
                  Release not found.
                </span>
              }
            />
          </div>
        ) : (
          <ReleaseDetailBody data={data} />
        )}
      </div>
    </Drawer>
  );
}

function ReleaseDetailBody({ data }: { data: PortalRelease }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: p.accentBg,
            color: p.accentText,
            border: `1px solid ${p.accentBorder}`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Rocket size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: p.text,
                letterSpacing: "-0.015em",
              }}
            >
              {data.title}
            </h1>
            {data.version && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 10px",
                  background: p.purpleBg,
                  border: `1px solid ${p.purpleBorder}`,
                  color: p.purpleText,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Tag size={11} />
                {data.version}
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              fontSize: 12.5,
              color: p.textSubtle,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Calendar size={12} />
              Released {fmtDate(data.releaseDate)}
            </span>
            {data.milestone && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Flag size={12} />
                {data.milestone.name}
              </span>
            )}
            {data.project && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <FolderKanban size={12} />
                {data.project.name}
                {data.project.code ? ` · ${data.project.code}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: "18px 20px",
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 12,
        }}
      >
        {data.description ? (
          <div
            className="portal-release-description"
            style={{
              fontSize: 13.5,
              color: p.textMuted,
              lineHeight: 1.65,
            }}
            dangerouslySetInnerHTML={{ __html: data.description }}
          />
        ) : (
          <div style={{ fontSize: 13, color: p.textFaint }}>
            No description for this release.
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .portal-release-description img { max-width: 100%; height: auto; border-radius: 8px; }
        .portal-release-description p { margin: 0 0 10px 0; }
        .portal-release-description p:last-child { margin-bottom: 0; }
        .portal-release-description h1,
        .portal-release-description h2,
        .portal-release-description h3 {
          color: #0f172a; margin: 16px 0 8px 0; font-weight: 700;
        }
        .portal-release-description h1 { font-size: 17px; }
        .portal-release-description h2 { font-size: 15.5px; }
        .portal-release-description h3 { font-size: 14px; }
        .portal-release-description ul,
        .portal-release-description ol { padding-left: 22px; margin: 0 0 10px 0; }
        .portal-release-description li { margin: 3px 0; }
        .portal-release-description a { color: #1d4ed8; text-decoration: underline; }
        .portal-release-description code {
          background: #f8fafc; border: 1px solid #e5e7eb;
          padding: 1px 6px; border-radius: 4px; font-size: 12.5px;
        }
        .portal-release-description blockquote {
          margin: 10px 0; padding: 8px 14px;
          border-left: 3px solid #bfdbfe; background: #f8fafc;
          color: #475569; border-radius: 4px;
        }
      `,
        }}
      />
    </>
  );
}
