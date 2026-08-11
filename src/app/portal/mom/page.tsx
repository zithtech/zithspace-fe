"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect, useMemo, useState } from "react";
import { Input, Empty, Pagination, Select, DatePicker, Button } from "antd";
import MomDetailDrawer from "@/app/portal/_components/MomDetailDrawer";
import dayjs from "dayjs";
import {
  Search,
  Calendar,
  ChevronRight,
  Users,
  CheckSquare,
  Video,
  Clock,
  Lightbulb,
  Paperclip,
  FileText,
  Link2,
  ExternalLink,
  LayoutGrid,
  List,
  RefreshCw,
  ClipboardList,
  AlertCircle,
  CalendarDays,
  FolderOpen
} from "lucide-react";
import {
  portalMomService,
  PortalMomListItem,
  PortalMomListAttachment,
  PortalMomMeta
} from "@/services/portalMomService";
import { usePortalSocket } from "@/providers/PortalSocketProvider";


/* ─────────────────────────────────────────────────────────
 * Design tokens — premium dense
 * ─────────────────────────────────────────────────────── */
const T = {
  pageBg: "#f6f7f9",
  cardBg: "#ffffff",
  border: "#e5e7eb",
  borderHover: "#cbd5e1",
  borderSoft: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#4338ca",
  accentBg: "#eef2ff",
  accentBorder: "#c7d2fe",
  numFont:
    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace'
};

const { RangePicker } = DatePicker;

const GAP = 12;
const PAGE_PAD_X = 28;
const PAGE_PAD_Y = 24;

/* ─────────────────────────────────────────────────────────
 * Formatters
 * ─────────────────────────────────────────────────────── */
function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

function fmtTimeOnly(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "—";
  }
}

function fmtDateShort(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return iso;
  }
}

/* ─────────────────────────────────────────────────────────
 * Page
 * ─────────────────────────────────────────────────────── */
export default function PortalMomPage() {
  const [items, setItems] = useState<PortalMomListItem[]>([]);
  const [meta, setMeta] = useState<PortalMomMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [limit, setLimit] = useState(20);
  const [activeMomId, setActiveMomId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalMomService.list({
        page,
        limit,
        projectId,
        search: search || undefined
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch {
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, projectId, limit]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Real-time: staff creates/edits/deletes a meeting → reload list here.
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

  const filteredItems = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return items;
    const [start, end] = dateRange;
    return items.filter((m) => {
      if (!m.meetingDate) return false;
      const d = dayjs(m.meetingDate);
      return (
        (d.isAfter(start, "day") || d.isSame(start, "day")) &&
        (d.isBefore(end, "day") || d.isSame(end, "day"))
      );
    });
  }, [items, dateRange]);

  const stats = useMemo(() => {
    const now = dayjs();
    const startOfMonth = now.startOf("month");
    const thisMonth = filteredItems.filter(
      (m) => m.meetingDate && dayjs(m.meetingDate).isAfter(startOfMonth),
    ).length;
    const openActions = filteredItems.reduce(
      (s, m) => s + m.openActionCount,
      0,
    );
    const recordings = filteredItems.filter((m) => m.recordingUrl).length;
    const decisions = filteredItems.reduce((s, m) => s + m.decisionCount, 0);
    return {
      total: meta?.total ?? filteredItems.length,
      thisMonth,
      openActions,
      recordings,
      decisions
    };
  }, [filteredItems, meta]);

  return (
    <div
      style={{
        background: T.pageBg,
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden"
      }}
    >
      <div
        className="portal-mom-container"
        style={{
          maxWidth: 1480,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: GAP
        }}
      >
        <div
          className="portal-mom-sticky-header"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: T.pageBg,
            display: "flex",
            flexDirection: "column",
            gap: GAP
          }}
        >
          {/* Hero banner with KPI tiles */}
          <Hero stats={stats} loading={loading} onReload={load} />

          {/* Filter bar */}
          <FilterBar
            search={search}
            setSearch={setSearch}
            projectId={projectId}
            setProjectId={(v) => {
              setProjectId(v);
              setPage(1);
            }}
            projects={meta?.projects ?? []}
            dateRange={dateRange}
            setDateRange={(d) => setDateRange(d as any)}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>

        {/* Body */}
        {loading ? (
          <div
            style={{
              padding: 80,
              textAlign: "center",
              background: T.cardBg,
              border: `1px solid ${T.border}`,
              borderRadius: 12
            }}
          >
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            style={{
              padding: 64,
              textAlign: "center",
              background: T.cardBg,
              border: `1px dashed ${T.border}`,
              borderRadius: 12
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: T.textSubtle, fontSize: 13 }}>
                  {search
                    ? `No meetings match "${search}".`
                    : "No meeting minutes shared yet."}
                </span>
              }
            />
          </div>
        ) : viewMode === "list" ? (
          <ListView
            items={filteredItems}
            onRowClick={(id) => setActiveMomId(id)}
          />
        ) : (
          <GridView
            items={filteredItems}
            onCardClick={(id) => setActiveMomId(id)}
          />
        )}

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <PaginationBar
            page={page}
            limit={limit}
            total={meta.total}
            openActions={stats.openActions}
            onChange={(p, s) => {
              setPage(p);
              if (s && s !== limit) {
                setLimit(s);
                setPage(1);
              }
            }}
          />
        )}
      </div>

      <MomDetailDrawer
        momId={activeMomId}
        onClose={() => setActiveMomId(null)}
      />

      <style jsx global>{`
        /* AntD picker — neutralize dark theme */
        .ant-picker {
          background: ${T.cardBg} !important;
          border-color: ${T.border} !important;
        }
        .ant-picker:hover,
        .ant-picker-focused {
          border-color: ${T.accent} !important;
        }
        .ant-picker .ant-picker-input > input {
          color: ${T.text} !important;
        }
        .ant-picker .ant-picker-input > input::placeholder {
          color: ${T.textFaint} !important;
        }
        .ant-picker .ant-picker-suffix,
        .ant-picker .ant-picker-separator {
          color: ${T.textSubtle} !important;
        }
        .ant-select:not(.ant-select-customize-input) .ant-select-selector {
          background: ${T.cardBg} !important;
          border: 1px solid ${T.border} !important;
          color: ${T.text} !important;
        }
        /* Project filter — prominent, leftmost */
        .portal-mom-project-select.ant-select .ant-select-selector {
          border: 1px solid ${T.border} !important;
          border-radius: 8px !important;
          height: 34px !important;
          background: ${T.cardBg} !important;
        }
        .portal-mom-project-select.is-active.ant-select .ant-select-selector {
          background: ${T.accentBg} !important;
          border-color: ${T.accentBorder} !important;
        }
        .portal-mom-project-select.ant-select .ant-select-selection-placeholder,
        .portal-mom-project-select.ant-select .ant-select-selection-item {
          line-height: 32px !important;
        }
        /* Popup — force light theme regardless of global data-theme */
        html body .portal-mom-project-popup,
        html[data-theme='dark'] body .portal-mom-project-popup,
        [data-theme='dark'] .portal-mom-project-popup {
          background: ${T.cardBg} !important;
          border: 1px solid ${T.border} !important;
          padding: 4px !important;
        }
        html body .portal-mom-project-popup .ant-select-item,
        html[data-theme='dark'] body .portal-mom-project-popup .ant-select-item,
        [data-theme='dark'] .portal-mom-project-popup .ant-select-item {
          color: ${T.text} !important;
          background: transparent !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
          margin: 1px 0 !important;
        }
        html body .portal-mom-project-popup .ant-select-item-option-active,
        html[data-theme='dark'] body .portal-mom-project-popup .ant-select-item-option-active {
          background: ${T.borderSoft} !important;
        }
        html body .portal-mom-project-popup .ant-select-item-option-selected,
        html[data-theme='dark'] body .portal-mom-project-popup .ant-select-item-option-selected {
          background: ${T.accentBg} !important;
        }
        html body .portal-mom-project-popup .ant-select-item-empty,
        html[data-theme='dark'] body .portal-mom-project-popup .ant-select-item-empty {
          color: ${T.textFaint} !important;
          padding: 12px !important;
          text-align: center !important;
          font-size: 12px !important;
        }
        .ant-select .ant-select-selection-placeholder {
          color: ${T.textFaint} !important;
        }
        .ant-select-arrow {
          color: ${T.textSubtle} !important;
        }
        .portal-mom-search.ant-input-affix-wrapper {
          background: ${T.cardBg} !important;
          border-color: ${T.border} !important;
        }
        .portal-mom-search .ant-input {
          background: ${T.cardBg} !important;
          color: ${T.text} !important;
        }
        .portal-mom-search .ant-input::placeholder {
          color: ${T.textFaint} !important;
        }
        /* Pagination — white theme */
        .ant-pagination-item {
          background: ${T.cardBg} !important;
          border-color: ${T.border} !important;
        }
        .ant-pagination-item a {
          color: ${T.textMuted} !important;
        }
        .ant-pagination-item-active {
          border-color: ${T.accent} !important;
        }
        .ant-pagination-item-active a {
          color: ${T.accent} !important;
        }
        .ant-pagination-prev .ant-pagination-item-link,
        .ant-pagination-next .ant-pagination-item-link {
          background: ${T.cardBg} !important;
          border-color: ${T.border} !important;
          color: ${T.textMuted} !important;
        }
        .ant-empty-img-simple path,
        .ant-empty-image svg path,
        .ant-empty-image path {
          fill: #f8fafc !important;
          stroke: ${T.borderHover} !important;
        }
        .ant-empty-img-simple ellipse,
        .ant-empty-image svg ellipse,
        .ant-empty-image ellipse {
          fill: #e2e8f0 !important;
          stroke: ${T.borderHover} !important;
        }
        .mom-list-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }
        .mom-list-table thead th {
          padding: 10px 16px;
          font-size: 10.5px;
          font-weight: 600;
          color: ${T.textSubtle};
          letter-spacing: 0.07em;
          text-transform: uppercase;
          background: #fafbfc;
          border-bottom: 1px solid ${T.borderSoft};
          text-align: left;
          white-space: nowrap;
        }
        .mom-list-table tbody td {
          padding: 12px 16px;
          font-size: 13px;
          color: ${T.text};
          border-bottom: 1px solid ${T.borderSoft};
          vertical-align: middle;
        }
        .mom-list-table tbody tr {
          cursor: pointer;
          transition: background 120ms ease;
        }
        .mom-list-table tbody tr:hover {
          background: #f8fafc;
        }
        .mom-list-table tbody tr:hover .mom-row-title {
          color: ${T.accent};
        }
        .mom-list-table tbody tr:last-child td {
          border-bottom: none;
        }
        .portal-mom-container {
          padding: 0 28px 32px;
        }
        .portal-mom-sticky-header {
          padding-top: 24px;
          padding-bottom: 4px;
        }
        .portal-mom-date-picker {
          width: 240px;
        }
        @media (max-width: 992px) {
          .portal-mom-hero {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .portal-mom-hero-stats {
            width: 100% !important;
            flex-wrap: wrap !important;
          }
        }
        @media (max-width: 768px) {
          .portal-mom-container {
            padding: 0 12px 24px;
            gap: 8px !important;
          }
          .portal-mom-sticky-header {
            padding-top: 16px;
            padding-bottom: 4px;
          }
          .portal-mom-project-select {
            width: 100% !important;
          }
          .portal-mom-search {
            min-width: 100% !important;
          }
          .portal-mom-date-picker {
            width: 100% !important;
          }
          .portal-mom-view-toggle {
            width: 100% !important;
            display: flex !important;
          }
          .portal-mom-view-toggle button {
            flex: 1;
            justify-content: center;
          }
          .portal-mom-pagination-bar {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
        }
        @media (max-width: 576px) {
          .portal-mom-hero-stats > div {
            flex: 1 1 calc(50% - 6px);
            min-width: 0;
          }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * Hero with KPI tiles
 * ─────────────────────────────────────────────────────── */
const Hero: React.FC<{
  stats: {
    total: number;
    thisMonth: number;
    openActions: number;
    recordings: number;
    decisions: number;
  };
  loading: boolean;
  onReload: () => void;
}> = ({ stats, loading, onReload }) => (
  <div
    className="portal-mom-hero"
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 20,
      position: "relative",
      overflow: "hidden"
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: "linear-gradient(180deg, #4338ca 0%, #7c3aed 100%)"
      }}
    />
    <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: T.accentBg,
          color: T.accent,
          border: `1px solid ${T.accentBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <ClipboardList size={19} strokeWidth={2.2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: T.text,
            letterSpacing: "-0.022em",
            lineHeight: 1.2
          }}
        >
          Minutes of Meeting
        </div>
        <div
          style={{
            fontSize: 12,
            color: T.textSubtle,
            marginTop: 3,
            fontWeight: 500
          }}
        >
          Every meeting summary, decision logged, and action item — shared back from your account team.
        </div>
      </div>
    </div>

    <div className="portal-mom-hero-stats" style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "stretch" }}>
      {[
        { label: "Total", value: stats.total, accent: "#4338ca" },
        { label: "This month", value: stats.thisMonth, accent: "#0d9488" },
        { label: "Decisions", value: stats.decisions, accent: "#7c3aed" },
        { label: "Open actions", value: stats.openActions, accent: stats.openActions > 0 ? "#b45309" : T.textMuted },
        { label: "Recordings", value: stats.recordings, accent: "#2563eb" },
      ].map((s) => (
        <div
          key={s.label}
          style={{
            padding: "8px 12px",
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            background: "#fafbfc",
            minWidth: 78,
            textAlign: "center"
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: T.textSubtle
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: s.accent,
              marginTop: 2,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums"
            }}
          >
            {s.value}
          </div>
        </div>
      ))}
      <Button
        icon={<RefreshCw size={14} className={loading ? "spin-icon" : ""} />}
        onClick={onReload}
        style={{
          height: "auto",
          alignSelf: "stretch",
          minWidth: 38,
          background: T.cardBg,
          border: `1px solid ${T.border}`,
          color: T.textMuted,
          borderRadius: 8
        }}
      />
    </div>
    <style jsx global>{`
      .spin-icon {
        animation: portal-mom-spin 1s linear infinite;
      }
      @keyframes portal-mom-spin {
        from {
          transform: rotate(0);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
);

/* ─────────────────────────────────────────────────────────
 * Filter bar
 * ─────────────────────────────────────────────────────── */
const FilterBar: React.FC<{
  search: string;
  setSearch: (s: string) => void;
  projectId: string | undefined;
  setProjectId: (v: string | undefined) => void;
  projects: { id: string; name: string; code: string | null }[];
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
  setDateRange: (d: any) => void;
  viewMode: "list" | "card";
  setViewMode: (v: "list" | "card") => void;
}> = ({
  search,
  setSearch,
  projectId,
  setProjectId,
  projects,
  dateRange,
  setDateRange,
  viewMode,
  setViewMode }) => (
    <div
      className="portal-mom-filterbar"
      style={{
        background: T.cardBg,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "10px 12px",
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center"
      }}
    >
      {/* Project filter — prominent, leftmost */}
      <Select
        className={`portal-mom-project-select${projectId ? " is-active" : ""}`}
        popupClassName="portal-mom-project-popup"
        allowClear
        placeholder={
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: T.textSubtle,
              fontWeight: 500
            }}
          >
            <FolderOpen size={14} />
            {projects.length === 0
              ? "Loading projects…"
              : `All projects${projects.length ? ` · ${projects.length}` : ""}`}
          </span>
        }
        value={projectId}
        onChange={setProjectId}
        style={{ width: 260, height: 34 }}
        options={projects.map((proj) => ({
          value: proj.id,
          label: proj.name,
          code: proj.code
        }))}
        optionRender={(option) => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <FolderOpen size={13} color={T.textSubtle} />
            <span style={{ fontWeight: 600, color: T.text }}>
              {String(option.label)}
            </span>
            {(option.data as any)?.code && (
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: T.numFont,
                  fontSize: 11,
                  color: T.textFaint
                }}
              >
                {(option.data as any).code}
              </span>
            )}
          </div>
        )}
        labelRender={(label) => (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: T.accent,
              fontWeight: 600
            }}
          >
            <FolderOpen size={14} />
            {String(label.label ?? "")}
          </span>
        )}
      />
      <Input
        allowClear
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        prefix={<Search size={14} color={T.textSubtle} />}
        placeholder="Search meetings, MOM #, attendees…"
        className="portal-mom-search"
        style={{
          flex: 1,
          minWidth: 240,
          height: 34,
          borderRadius: 8
        }}
      />
      <RangePicker
        value={dateRange}
        onChange={setDateRange}
        className="portal-mom-date-picker"
        style={{
          height: 34,
          borderRadius: 8,
          borderColor: T.border
        }}
        placeholder={["Start", "End"]}
      />
      <div
        className="portal-mom-view-toggle"
        style={{
          display: "inline-flex",
          background: T.borderSoft,
          padding: 3,
          borderRadius: 8,
          border: `1px solid ${T.border}`,
          height: 34,
          boxSizing: "border-box",
          alignItems: "center"
        }}
      >
        {[
          { mode: "list" as const, icon: <List size={13} />, label: "List" },
          { mode: "card" as const, icon: <LayoutGrid size={13} />, label: "Cards" },
        ].map(({ mode, icon, label }) => {
          const active = viewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "0 10px",
                height: 26,
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 5,
                border: active ? `1px solid ${T.border}` : "1px solid transparent",
                cursor: "pointer",
                background: active ? T.cardBg : "transparent",
                color: active ? T.text : T.textSubtle,
                transition: "background 120ms ease, color 120ms ease"
              }}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );

/* ─────────────────────────────────────────────────────────
 * List view (table)
 * ─────────────────────────────────────────────────────── */
const ListView: React.FC<{
  items: PortalMomListItem[];
  onRowClick: (id: string) => void;
}> = ({ items, onRowClick }) => (
  <div
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      overflow: "hidden"
    }}
  >
    <div style={{ overflowX: "auto" }}>
      <table className="mom-list-table">
        <thead>
          <tr>
            <th style={{ width: 110 }}>MOM #</th>
            <th>Meeting</th>
            <th style={{ width: 170 }}>Date &amp; Time</th>
            <th style={{ width: 140 }}>Project</th>
            <th style={{ width: 320 }}>Activity</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.id} onClick={() => onRowClick(m.id)}>
              <td>
                <MomNumberPill momNumber={m.momNumber} />
              </td>
              <td>
                <div
                  className="mom-row-title"
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: T.text,
                    transition: "color 120ms ease",
                    letterSpacing: "-0.005em"
                  }}
                >
                  {m.title}
                </div>
                {m.summaryPreview && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: T.textSubtle,
                      marginTop: 3,
                      maxWidth: 460,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 500
                    }}
                    title={m.summaryPreview}
                  >
                    {m.summaryPreview}
                  </div>
                )}
              </td>
              <td>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: T.text,
                    fontVariantNumeric: "tabular-nums",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <CalendarDays size={12} color={T.accent} />
                  {fmtDateShort(m.meetingDate)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: T.textSubtle,
                    marginTop: 2,
                    fontFamily: T.numFont,
                    paddingLeft: 18
                  }}
                >
                  {fmtTimeOnly(m.meetingDate)}
                  {m.durationMinutes ? ` · ${m.durationMinutes} min` : ""}
                </div>
              </td>
              <td>
                {m.projectName ? (
                  <span
                    style={{
                      display: "inline-block",
                      maxWidth: 130,
                      background: T.borderSoft,
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: T.textMuted,
                      border: `1px solid ${T.border}`,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                    title={m.projectName}
                  >
                    {m.projectName}
                  </span>
                ) : (
                  <span style={{ color: T.textFaint }}>—</span>
                )}
              </td>
              <td>
                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    flexWrap: "wrap",
                    alignItems: "center"
                  }}
                >
                  <MiniChip
                    icon={Users}
                    value={m.attendeeCount}
                    label="attendees"
                    tone="neutral"
                  />
                  <MiniChip
                    icon={Lightbulb}
                    value={m.decisionCount}
                    label="decisions"
                    tone="purple"
                  />
                  <MiniChip
                    icon={CheckSquare}
                    value={m.actionCount}
                    label={
                      m.openActionCount > 0
                        ? `actions (${m.openActionCount} open)`
                        : "actions"
                    }
                    tone={m.openActionCount > 0 ? "warning" : "success"}
                  />
                  {m.recordingUrl && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        padding: "1.5px 7px",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        color: "#1d4ed8",
                        borderRadius: 999,
                        fontSize: 10.5,
                        fontWeight: 600
                      }}
                    >
                      <Video size={10} />
                      Recording
                    </span>
                  )}
                  {m.attachmentCount > 0 && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        padding: "1.5px 7px",
                        background: T.borderSoft,
                        border: `1px solid ${T.border}`,
                        color: T.textMuted,
                        borderRadius: 999,
                        fontSize: 10.5,
                        fontWeight: 600
                      }}
                    >
                      <Paperclip size={10} />
                      {m.attachmentCount}
                    </span>
                  )}
                </div>
              </td>
              <td style={{ textAlign: "right" }}>
                <ChevronRight size={15} color={T.textFaint} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
 * Grid view
 * ─────────────────────────────────────────────────────── */
const GridView: React.FC<{
  items: PortalMomListItem[];
  onCardClick: (id: string) => void;
}> = ({ items, onCardClick }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: GAP
    }}
  >
    {items.map((m) => (
      <MeetingGridCard key={m.id} mom={m} onClick={() => onCardClick(m.id)} />
    ))}
  </div>
);

const MeetingGridCard: React.FC<{
  mom: PortalMomListItem;
  onClick: () => void;
}> = ({ mom, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "14px 16px",
        background: T.cardBg,
        border: `1px solid ${hover ? T.borderHover : T.border}`,
        borderRadius: 12,
        cursor: "pointer",
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        transition: "border-color 150ms ease, transform 150ms ease",
        minHeight: 200
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8
        }}
      >
        <MomNumberPill momNumber={mom.momNumber} />
        {mom.projectName && (
          <span
            style={{
              maxWidth: 130,
              background: T.borderSoft,
              padding: "1.5px 7px",
              borderRadius: 5,
              fontSize: 10.5,
              fontWeight: 600,
              color: T.textMuted,
              border: `1px solid ${T.border}`,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
            title={mom.projectName}
          >
            {mom.projectName}
          </span>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: hover ? T.accent : T.text,
            letterSpacing: "-0.015em",
            lineHeight: 1.3,
            transition: "color 150ms ease",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
        >
          {mom.title}
        </div>
        <div
          style={{
            marginTop: 5,
            fontSize: 11.5,
            color: T.textSubtle,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 500
          }}
        >
          <CalendarDays size={11} color={T.accent} />
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmtDateShort(mom.meetingDate)} · {fmtTimeOnly(mom.meetingDate)}
          </span>
          {mom.durationMinutes && (
            <>
              <span style={{ color: T.textFaint }}>·</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {mom.durationMinutes}m
              </span>
            </>
          )}
        </div>
      </div>

      {mom.summaryPreview && (
        <div
          style={{
            fontSize: 12,
            color: T.textMuted,
            lineHeight: 1.5,
            padding: "8px 10px",
            background: "#fafbfc",
            borderLeft: `2px solid ${T.borderHover}`,
            borderRadius: "0 6px 6px 0",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontWeight: 500
          }}
        >
          {mom.summaryPreview}
        </div>
      )}

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          gap: 5,
          flexWrap: "wrap",
          alignItems: "center",
          borderTop: `1px solid ${T.borderSoft}`,
          paddingTop: 10
        }}
      >
        <MiniChip
          icon={Users}
          value={mom.attendeeCount}
          label="attendees"
          tone="neutral"
        />
        <MiniChip
          icon={Lightbulb}
          value={mom.decisionCount}
          label="decisions"
          tone="purple"
        />
        <MiniChip
          icon={CheckSquare}
          value={mom.actionCount}
          label={
            mom.openActionCount > 0
              ? `actions (${mom.openActionCount} open)`
              : "actions"
          }
          tone={mom.openActionCount > 0 ? "warning" : "success"}
        />
        {mom.recordingUrl && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "1.5px 7px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 600
            }}
          >
            <Video size={10} />
            Recording
          </span>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
 * Pagination
 * ─────────────────────────────────────────────────────── */
const PaginationBar: React.FC<{
  page: number;
  limit: number;
  total: number;
  openActions: number;
  onChange: (p: number, s: number) => void;
}> = ({ page, limit, total, openActions, onChange }) => (
  <div
    className="portal-mom-pagination-bar"
    style={{
      background: T.cardBg,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "12px 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12
    }}
  >
    <div
      style={{
        fontSize: 12,
        color: T.textSubtle,
        fontWeight: 500,
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }}
    >
      {openActions > 0 ? (
        <>
          <AlertCircle size={13} color="#b45309" />
          <span style={{ color: "#b45309", fontWeight: 600 }}>
            {openActions} open action item{openActions === 1 ? "" : "s"}
          </span>
          <span>remaining across these meetings</span>
        </>
      ) : (
        <>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#10b981"
            }}
          />
          <span style={{ color: "#047857", fontWeight: 600 }}>
            All action items resolved
          </span>
        </>
      )}
    </div>

    <Pagination
      current={page}
      pageSize={limit}
      total={total}
      onChange={onChange}
      showSizeChanger
      pageSizeOptions={[10, 20, 25, 50, 100]}
      showTotal={(t, range) => (
        <span
          style={{
            fontSize: 12,
            color: T.textSubtle,
            marginRight: 8,
            fontVariantNumeric: "tabular-nums"
          }}
        >
          <strong style={{ fontWeight: 600, color: T.text }}>
            {range[0]}–{range[1]}
          </strong>{" "}
          of{" "}
          <strong style={{ fontWeight: 600, color: T.text }}>{t}</strong>{" "}
          meetings
        </span>
      )}
    />
  </div>
);

/* ─────────────────────────────────────────────────────────
 * Small components
 * ─────────────────────────────────────────────────────── */
const MomNumberPill: React.FC<{ momNumber: string }> = ({ momNumber }) => (
  <span
    style={{
      fontFamily: T.numFont,
      fontSize: 10.5,
      fontWeight: 700,
      padding: "2px 7px",
      background: T.accentBg,
      border: `1px solid ${T.accentBorder}`,
      borderRadius: 5,
      color: T.accent,
      letterSpacing: "0.02em",
      whiteSpace: "nowrap"
    }}
  >
    {momNumber}
  </span>
);

function MiniChip({
  icon: Icon,
  value,
  label,
  tone }: {
    icon: any;
    value: number;
    label: string;
    tone: "neutral" | "purple" | "warning" | "success";
  }) {
  if (value === 0) return null;
  const map = {
    neutral: { bg: "#f1f5f9", border: "#e2e8f0", text: "#334155" },
    purple: { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    success: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857" }
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "1.5px 7px",
        background: map.bg,
        border: `1px solid ${map.border}`,
        color: map.text,
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums"
      }}
    >
      <Icon size={10} />
      {value} {label}
    </span>
  );
}

function looksLikeRealUrl(s: string | null | undefined): boolean {
  if (!s) return false;
  try {
    const u = new URL(s.trim());
    return (
      (u.protocol === "http:" || u.protocol === "https:") &&
      u.hostname.includes(".")
    );
  } catch {
    return false;
  }
}

function resolveAttachmentUrl(a: PortalMomListAttachment): string | null {
  if (a.kind === "file") return a.fileUrl ?? null;
  if (looksLikeRealUrl(a.linkUrl)) return a.linkUrl;
  if (looksLikeRealUrl(a.linkLabel)) return a.linkLabel;
  return a.linkUrl ?? null;
}

function AttachmentChip({
  attachment }: {
    attachment: PortalMomListAttachment;
  }) {
  const url = resolveAttachmentUrl(attachment);
  const isFile = attachment.kind === "file";
  const label = isFile
    ? attachment.fileName || "File"
    : attachment.linkLabel || attachment.linkUrl || "Link";

  const [attHover, setAttHover] = useState(false);

  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setAttHover(true)}
      onMouseLeave={() => setAttHover(false)}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        maxWidth: 220,
        padding: "2px 8px",
        background: attHover ? "#eff6ff" : T.cardBg,
        border: `1px solid ${attHover ? "#bfdbfe" : T.border}`,
        borderRadius: 999,
        color: attHover ? "#2563eb" : T.textMuted,
        textDecoration: "none",
        fontSize: 11,
        fontWeight: 500,
        transition: "background 150ms ease, color 150ms ease, border-color 150ms ease"
      }}
    >
      {isFile ? <FileText size={11} /> : <Link2 size={11} />}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0
        }}
      >
        {label}
      </span>
      <ExternalLink size={9} />
    </a>
  );
}
