"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  
  Pagination,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  notification,
  Row,
  Col,
  Divider,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import {
  Search,
  Plus,
  GitPullRequest,
  ChevronRight,
  MessageCircle,
  Send,
  Receipt,
  Calendar,
  Clock,
  X,
  Folder,
  CalendarRange,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  Target,
  Activity,
  ArrowUpRight,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import {
  portalCrService,
  PortalCrListItem,
  PortalCrMeta,
  CrPriority,
} from "@/services/portalCrService";
import {
  p,
  TONE,
  STATUS_META,
  PRIORITY_META,
  fmtCurrency,
  fmtRelative,
} from "./_crUi";
import { AttachmentPicker } from "@/app/portal/_components/AttachmentPicker";

dayjs.extend(quarterOfYear);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under review" },
  { key: "estimated", label: "Estimate ready" },
  { key: "approved", label: "Approved" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_progress", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "rejected", label: "Rejected" },
  { key: "closed", label: "Closed" },
  { key: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS: { value: CrPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const INDIGO = "#4f46e5";
const INDIGO_BG = "#eef2ff";
const INDIGO_BORDER = "#c7d2fe";
const INDIGO_TEXT = "#4338ca";
const SURFACE_TINTED = "#fafbff";

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

function daysBetween(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function estimateText(cr: PortalCrListItem): string {
  if (cr.estimatedCost) return fmtCurrency(cr.estimatedCost, cr.estimatedCurrency);
  if (cr.estimatedHoursMin || cr.estimatedHoursMax)
    return `${cr.estimatedHoursMin || "?"}–${cr.estimatedHoursMax || "?"} h`;
  return "—";
}

type ViewMode = "card" | "list";
const VIEW_STORAGE_KEY = "portal.cr.view";

/* --------------------------------------------------------------- */

export default function PortalCrListPage() {
  const [items, setItems] = useState<PortalCrListItem[]>([]);
  const [meta, setMeta] = useState<PortalCrMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ALL");
  const [priority, setPriority] = useState<string | undefined>(undefined);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("card");
  const [createOpen, setCreateOpen] = useState(false);
  const [notify, contextHolder] = notification.useNotification();
  const limit = 20;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "card" || stored === "list") setView(stored);
    } catch {}
  }, []);

  const setViewPersist = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch {}
  };

  const fromIso = datePicked?.[0]
    ? datePicked[0]!.format("YYYY-MM-DD")
    : undefined;
  const toIso = datePicked?.[1] ? datePicked[1]!.format("YYYY-MM-DD") : undefined;

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalCrService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        priority: priority || undefined,
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
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, priority, projectId, fromIso, toIso]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Featured: CRs awaiting your decision (status='estimated' && no decision)
  const hasAnyFilter =
    status !== "ALL" || !!priority || !!projectId || !!search || !!fromIso || !!toIso;
  const featured = useMemo(() => {
    if (hasAnyFilter || page !== 1) return [];
    return items.filter(
      (cr) => cr.status === "estimated" && !cr.clientDecision,
    );
  }, [items, hasAnyFilter, page]);

  const restItems = useMemo(() => {
    if (featured.length === 0) return items;
    const ids = new Set(featured.map((cr) => cr.id));
    return items.filter((cr) => !ids.has(cr.id));
  }, [items, featured]);

  return (
    <div style={{ height: "100vh", overflowY: "auto", backgroundColor: "#ffffff" }}>
      {contextHolder}

      {/* Workstation Header */}
      <div
        className="saas-header-container portal-mom-header-container"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "20px 40px 20px 40px",
          marginBottom: 0,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col flex="1 1 auto" style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, rgba(79, 70, 229, 0.18), rgba(67, 56, 202, 0.08))",
                    color: INDIGO,
                    border: `1px solid ${INDIGO_BORDER}`,
                  }}
                >
                  <GitPullRequest size={17} color={INDIGO} />
                </div>
                <Title
                  level={4}
                  className="portal-mom-header-title"
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "var(--text-slate-900)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Change requests
                </Title>
              </div>

              <Divider
                type="vertical"
                style={{
                  height: 20,
                  borderColor: "rgba(0, 0, 0, 0.08)",
                  margin: "0 12px",
                }}
              />

              <div>
                <Text
                  className="portal-mom-header-desc"
                  style={{
                    fontSize: 12,
                    color: "var(--text-slate-600)",
                    fontWeight: 600,
                  }}
                >
                  Request a scope change, see our impact and cost estimate, and approve or reject before work starts.
                </Text>
              </div>
            </div>
          </Col>

          <Col flex="0 0 auto">
            <button
              onClick={() => setCreateOpen(true)}
              className="premium-new-cr"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                background: INDIGO,
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 140ms ease",
              }}
            >
              <Plus size={14} />
              New change request
            </button>
          </Col>
        </Row>
      </div>

      <div style={{ padding: "20px 40px 56px", maxWidth: 1280 }}>
        {/* Tabs + view toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FILTER_TABS.map((tab) => {
              const active = status === tab.key;
              const count =
                tab.key === "ALL"
                  ? meta?.total
                  : meta?.counts?.[tab.key as never];
              return (
                <button
                  key={tab.key}
                  className="premium-filter-tab"
                  data-active={active ? "true" : "false"}
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 11px",
                    background: active ? INDIGO : p.surfaceElevated,
                    color: active ? "#ffffff" : p.textMuted,
                    border: `1px solid ${active ? INDIGO : p.border}`,
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    cursor: "pointer",
                    transition: "all 120ms ease",
                  }}
                >
                  {tab.label}
                  {count != null && count > 0 && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "0 6px",
                        borderRadius: 999,
                        background: active
                          ? "rgba(255,255,255,0.18)"
                          : p.neutralBg,
                        color: active ? "#ffffff" : p.textSubtle,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <ViewToggle view={view} onChange={setViewPersist} />
        </div>

        {/* Premium filter bar */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          projects={meta?.projects || []}
          projectId={projectId}
          onProjectChange={(v) => {
            setProjectId(v);
            setPage(1);
          }}
          datePicked={datePicked}
          onDateChange={(r) => {
            setDatePicked(r);
            setPage(1);
          }}
          priority={priority}
          onPriorityChange={(v) => {
            setPriority(v);
            setPage(1);
          }}
        />

        {/* Active filter chips */}
        <ActiveFilterChips
          search={search}
          onClearSearch={() => setSearch("")}
          projectName={
            projectId
              ? meta?.projects.find((pr) => pr.id === projectId)?.name
              : undefined
          }
          onClearProject={() => {
            setProjectId(undefined);
            setPage(1);
          }}
          datePicked={datePicked}
          onClearDateRange={() => {
            setDatePicked(null);
            setPage(1);
          }}
          statusFilter={status !== "ALL" ? status : undefined}
          onClearStatus={() => {
            setStatus("ALL");
            setPage(1);
          }}
          priorityFilter={priority}
          onClearPriority={() => {
            setPriority(undefined);
            setPage(1);
          }}
        />

        {/* Featured: awaiting your decision */}
        {!loading && featured.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel
              icon={DollarSign}
              label="Awaiting your decision"
              count={featured.length}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  featured.length === 1
                    ? "1fr"
                    : "repeat(auto-fit, minmax(440px, 1fr))",
                gap: 12,
              }}
            >
              {featured.map((cr) => (
                <FeaturedCrCard key={cr.id} cr={cr} />
              ))}
            </div>
          </div>
        )}

        {!loading && featured.length > 0 && restItems.length > 0 && (
          <SectionLabel
            icon={GitPullRequest}
            label="All change requests"
            count={restItems.length}
          />
        )}

        {/* Body */}
        {loading ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              background: p.surfaceElevated,
              border: `1px solid ${p.border}`,
              borderRadius: 12,
            }}
          >
            <ZukvoLoader size="md" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={
              search
                ? `No change requests match "${search}"`
                : status !== "ALL"
                ? "Nothing in this status"
                : "No change requests yet"
            }
            body={
              search
                ? "Try a different search term or clear filters above."
                : "Raise a CR to request a scope change. We'll come back with an impact analysis and cost estimate."
            }
            ctaLabel="Raise your first CR"
            onCta={() => setCreateOpen(true)}
          />
        ) : restItems.length === 0 ? null : view === "card" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 12,
            }}
          >
            {restItems.map((cr) => (
              <CrCardCompact key={cr.id} cr={cr} />
            ))}
          </div>
        ) : (
          <CrList items={restItems} />
        )}

        {meta && meta.total > limit && (
          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Pagination
              current={page}
              pageSize={limit}
              total={meta.total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        )}

        <RaiseCrModal
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
          .portal-mom-header-container,
          [data-theme='dark'] .portal-mom-header-container,
          [data-theme='dark'] .saas-header-container.portal-mom-header-container,
          .saas-header-container.portal-mom-header-container {
            background: #ffffff !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
          .portal-mom-header-title {
            color: #0f172a !important;
          }
          .portal-mom-header-desc {
            color: #475569 !important;
          }

          .ant-input, .ant-select-selector, .ant-input-affix-wrapper, .ant-input-textarea, textarea.ant-input {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          .ant-input::placeholder, .ant-select-selection-placeholder {
            color: #94a3b8 !important;
          }
          .ant-select-selection-item {
            color: #0f172a !important;
          }
          .ant-input-affix-wrapper .ant-input {
            background-color: transparent !important;
            color: #0f172a !important;
          }
          .ant-input-affix-wrapper:hover, .ant-input:hover, .ant-select-selector:hover {
            border-color: #cbd5e1 !important;
          }
          .ant-input-affix-wrapper-focused, .ant-input-focused, .ant-select-focused .ant-select-selector {
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
          }
          .ant-select-arrow {
            color: #94a3b8 !important;
          }

          .premium-new-cr:hover {
            background: #4338ca !important;
          }

          /* Premium search input */
          .premium-search:hover {
            border-color: #cbd5e1 !important;
          }
          .premium-search[data-focused='true']:hover {
            border-color: #4f46e5 !important;
          }
          .premium-search input::placeholder {
            color: #94a3b8;
            font-weight: 500;
          }

          /* Premium select */
          .premium-select .ant-select-selector {
            height: 34px !important;
            padding: 0 11px !important;
            border-radius: 8px !important;
            border-color: #e5e7eb !important;
            display: flex;
            align-items: center;
          }
          .premium-select .ant-select-selection-search-input,
          .premium-select .ant-select-selection-item,
          .premium-select .ant-select-selection-placeholder {
            line-height: 32px !important;
            font-size: 13px !important;
            font-weight: 500 !important;
          }
          .premium-select.ant-select-focused .ant-select-selector,
          .premium-select .ant-select-selector:hover {
            border-color: #a5b4fc !important;
          }
          .premium-select.ant-select-focused .ant-select-selector {
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
          }
          .premium-select .ant-select-arrow {
            right: 11px;
          }

          /* Premium range picker */
          .premium-rangepicker.ant-picker {
            height: 34px !important;
            padding: 0 11px !important;
            border-radius: 8px !important;
            border-color: #e5e7eb !important;
          }
          .premium-rangepicker.ant-picker:hover {
            border-color: #a5b4fc !important;
          }
          .premium-rangepicker.ant-picker-focused {
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
          }
          .premium-rangepicker .ant-picker-input > input {
            font-size: 13px !important;
            font-weight: 500 !important;
            color: #0f172a !important;
          }
          .premium-rangepicker .ant-picker-input > input::placeholder {
            color: #94a3b8 !important;
            font-weight: 500 !important;
          }
          .premium-rangepicker .ant-picker-range-separator {
            padding: 0 6px !important;
          }
          .ant-picker-presets > ul > li {
            font-size: 12.5px !important;
            font-weight: 500 !important;
            color: #475569 !important;
            border-radius: 6px !important;
          }
          .ant-picker-presets > ul > li:hover {
            background: #eef2ff !important;
            color: #4338ca !important;
          }

          /* Filter chips */
          .premium-filter-chip button:hover {
            background: rgba(67, 56, 202, 0.12) !important;
          }
          .premium-clear-all:hover {
            text-decoration: underline;
          }

          .premium-filter-tab[data-active='false']:hover {
            border-color: #a5b4fc !important;
            color: #4338ca !important;
          }

          /* CR card hover */
          .premium-cr-card {
            position: relative;
          }
          .premium-cr-card::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background: transparent;
            border-radius: 10px 0 0 10px;
            transition: background 120ms ease;
          }
          .premium-cr-card[data-state='estimated']::before {
            background: #d97706;
          }
          .premium-cr-card[data-state='approved']::before,
          .premium-cr-card[data-state='delivered']::before {
            background: #059669;
          }
          .premium-cr-card[data-state='in_progress']::before,
          .premium-cr-card[data-state='scheduled']::before {
            background: #4f46e5;
          }
          .premium-cr-card[data-state='rejected']::before {
            background: #dc2626;
          }
          .premium-cr-card:hover {
            border-color: #a5b4fc !important;
          }
          .premium-cr-card:hover .premium-cr-arrow {
            transform: translateX(2px);
            color: #4f46e5;
          }
          .premium-cr-arrow {
            transition: transform 140ms ease, color 140ms ease;
          }

          /* CR row hover */
          .premium-cr-row {
            transition: background 120ms ease;
          }
          .premium-cr-row:hover {
            background: #fafbff;
          }
          .premium-cr-row:hover .premium-cr-arrow {
            transform: translateX(2px);
            color: #4f46e5;
          }

          /* Featured card */
          .premium-featured-cr:hover {
            border-color: #818cf8 !important;
          }
          .premium-featured-cr:hover .premium-featured-cta {
            background: #4338ca;
            gap: 6px;
          }

          /* View toggle */
          .premium-view-toggle {
            display: inline-flex;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 2px;
          }
          .premium-view-toggle button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 24px;
            background: transparent;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            color: #94a3b8;
            transition: all 120ms ease;
          }
          .premium-view-toggle button:hover {
            color: #4338ca;
          }
          .premium-view-toggle button[data-active='true'] {
            background: #eef2ff;
            color: #4338ca;
          }
        `}</style>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="premium-view-toggle" role="group" aria-label="View mode">
      <button
        type="button"
        data-active={view === "card" ? "true" : "false"}
        onClick={() => onChange("card")}
        title="Card view"
        aria-label="Card view"
      >
        <LayoutGrid size={13} />
      </button>
      <button
        type="button"
        data-active={view === "list" ? "true" : "false"}
        onClick={() => onChange("list")}
        title="List view"
        aria-label="List view"
      >
        <ListIcon size={13} />
      </button>
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  label,
  count,
}: {
  icon: any;
  label: string;
  count?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
      }}
    >
      <Icon size={13} color={INDIGO} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: p.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
        }}
      >
        {label}
      </span>
      {count != null && (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: p.textSubtle,
            padding: "0 6px",
            background: p.neutralBg,
            borderRadius: 999,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </span>
      )}
      <div
        style={{
          flex: 1,
          height: 1,
          background: p.neutralBorder,
          marginLeft: 2,
        }}
      />
    </div>
  );
}

function FilterBar({
  search,
  onSearchChange,
  projects,
  projectId,
  onProjectChange,
  datePicked,
  onDateChange,
  priority,
  onPriorityChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  projects: { id: string; name: string; code: string | null }[];
  projectId: string | undefined;
  onProjectChange: (v: string | undefined) => void;
  datePicked: [Dayjs | null, Dayjs | null] | null;
  onDateChange: (r: [Dayjs | null, Dayjs | null] | null) => void;
  priority: string | undefined;
  onPriorityChange: (v: string | undefined) => void;
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const today = dayjs();
  const rangePresets: { label: string; value: [Dayjs, Dayjs] }[] = [
    { label: "Last 7 days", value: [today.subtract(6, "day"), today] },
    { label: "Last 30 days", value: [today.subtract(29, "day"), today] },
    { label: "This month", value: [today.startOf("month"), today.endOf("month")] },
    {
      label: "Last month",
      value: [
        today.subtract(1, "month").startOf("month"),
        today.subtract(1, "month").endOf("month"),
      ],
    },
    { label: "This quarter", value: [today.startOf("quarter"), today.endOf("quarter")] },
    { label: "Next 30 days", value: [today, today.add(30, "day")] },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "stretch",
        flexWrap: "wrap",
        marginBottom: 10,
      }}
    >
      <div
        className="premium-search"
        data-focused={searchFocused ? "true" : "false"}
        style={{
          flex: "1 1 280px",
          minWidth: 240,
          maxWidth: 480,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 34,
          padding: "0 10px 0 12px",
          background: p.surface,
          border: `1px solid ${searchFocused ? INDIGO : p.border}`,
          borderRadius: 8,
          boxShadow: searchFocused
            ? "0 0 0 3px rgba(99, 102, 241, 0.12)"
            : "none",
          transition: "border-color 140ms ease, box-shadow 140ms ease",
        }}
      >
        <Search
          size={14}
          color={searchFocused ? INDIGO : p.textFaint}
          style={{ flexShrink: 0, transition: "color 140ms ease" }}
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search CR # or subject…"
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: p.text,
            fontSize: 13,
            fontWeight: 500,
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            style={{
              flexShrink: 0,
              width: 18,
              height: 18,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: p.neutralBg,
              border: "none",
              borderRadius: 999,
              color: p.textSubtle,
              cursor: "pointer",
            }}
          >
            <X size={11} />
          </button>
        )}
        <kbd
          aria-hidden
          style={{
            flexShrink: 0,
            display: search ? "none" : "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 18,
            minWidth: 22,
            padding: "0 5px",
            background: p.surfaceMuted,
            border: `1px solid ${p.border}`,
            borderRadius: 4,
            color: p.textFaint,
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          /
        </kbd>
      </div>

      <Select
        allowClear
        showSearch
        placeholder={
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: p.textSubtle,
              fontWeight: 500,
            }}
          >
            <Folder size={13} color={p.textFaint} />
            {projects.length > 0
              ? `All projects · ${projects.length}`
              : "Projects"}
          </span>
        }
        suffixIcon={<Folder size={13} color={p.textFaint} />}
        value={projectId}
        onChange={(v) => onProjectChange(v)}
        optionFilterProp="label"
        className="premium-select"
        style={{ width: 220, height: 34 }}
        options={projects.map((proj) => ({
          value: proj.id,
          label: proj.code ? `${proj.name} · ${proj.code}` : proj.name,
        }))}
        notFoundContent={
          <div style={{ padding: 8, fontSize: 12, color: p.textSubtle }}>
            No projects available
          </div>
        }
      />

      <Select
        allowClear
        placeholder={
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: p.textSubtle,
              fontWeight: 500,
            }}
          >
            <AlertTriangle size={13} color={p.textFaint} />
            All priorities
          </span>
        }
        suffixIcon={<AlertTriangle size={13} color={p.textFaint} />}
        value={priority}
        onChange={(v) => onPriorityChange(v)}
        className="premium-select"
        style={{ width: 160, height: 34 }}
        options={PRIORITY_OPTIONS}
      />

      <RangePicker
        value={datePicked as any}
        onChange={(r) => onDateChange(r as any)}
        format="MMM D, YYYY"
        allowEmpty={[true, true]}
        placeholder={["From", "To"]}
        className="premium-rangepicker"
        suffixIcon={<CalendarRange size={13} color={p.textFaint} />}
        separator={<span style={{ color: p.textFaint }}>→</span>}
        presets={rangePresets}
        style={{ height: 34 }}
      />
    </div>
  );
}

function ActiveFilterChips({
  search,
  onClearSearch,
  projectName,
  onClearProject,
  datePicked,
  onClearDateRange,
  statusFilter,
  onClearStatus,
  priorityFilter,
  onClearPriority,
}: {
  search: string;
  onClearSearch: () => void;
  projectName: string | undefined;
  onClearProject: () => void;
  datePicked: [Dayjs | null, Dayjs | null] | null;
  onClearDateRange: () => void;
  statusFilter: string | undefined;
  onClearStatus: () => void;
  priorityFilter: string | undefined;
  onClearPriority: () => void;
}) {
  const hasDates = !!(datePicked && (datePicked[0] || datePicked[1]));
  const any = !!search || !!projectName || hasDates || !!statusFilter || !!priorityFilter;
  if (!any) return null;

  const dateLabel = hasDates
    ? `${datePicked?.[0] ? datePicked[0].format("MMM D") : "Any"} → ${
        datePicked?.[1] ? datePicked[1].format("MMM D, YYYY") : "Any"
      }`
    : "";

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 700,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginRight: 2,
        }}
      >
        <SlidersHorizontal size={11} />
        Active
      </span>
      {statusFilter && (
        <FilterChip
          icon={Activity}
          label={`Status: ${statusFilter.replace("_", " ")}`}
          onClear={onClearStatus}
        />
      )}
      {projectName && (
        <FilterChip
          icon={Folder}
          label={`Project: ${projectName}`}
          onClear={onClearProject}
        />
      )}
      {priorityFilter && (
        <FilterChip
          icon={AlertTriangle}
          label={`Priority: ${priorityFilter}`}
          onClear={onClearPriority}
        />
      )}
      {hasDates && (
        <FilterChip
          icon={CalendarRange}
          label={dateLabel}
          onClear={onClearDateRange}
        />
      )}
      {search && (
        <FilterChip
          icon={Search}
          label={`"${search}"`}
          onClear={onClearSearch}
        />
      )}
      <button
        type="button"
        onClick={() => {
          if (search) onClearSearch();
          if (projectName) onClearProject();
          if (hasDates) onClearDateRange();
          if (statusFilter) onClearStatus();
          if (priorityFilter) onClearPriority();
        }}
        className="premium-clear-all"
        style={{
          marginLeft: 4,
          padding: "2px 8px",
          background: "transparent",
          border: "none",
          color: INDIGO_TEXT,
          fontSize: 11.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Clear all
      </button>
    </div>
  );
}

function FilterChip({
  icon: Icon,
  label,
  onClear,
}: {
  icon: any;
  label: string;
  onClear: () => void;
}) {
  return (
    <span
      className="premium-filter-chip"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 4px 3px 9px",
        background: INDIGO_BG,
        border: `1px solid ${INDIGO_BORDER}`,
        color: INDIGO_TEXT,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        lineHeight: 1.2,
      }}
    >
      <Icon size={10} />
      <span
        style={{
          maxWidth: 180,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove filter"
        style={{
          width: 16,
          height: 16,
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          borderRadius: 999,
          color: INDIGO_TEXT,
          cursor: "pointer",
        }}
      >
        <X size={10} />
      </button>
    </span>
  );
}

function EmptyState({
  title,
  body,
  ctaLabel,
  onCta,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <div
      style={{
        padding: 56,
        textAlign: "center",
        background: SURFACE_TINTED,
        border: `1px dashed ${p.neutralBorder}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: p.surface,
          border: `1px solid ${p.border}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Target size={18} color={p.textFaint} />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: p.text }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: p.textSubtle, marginTop: 4 }}>
        {body}
      </div>
      {ctaLabel && onCta && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={onCta}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              background: INDIGO,
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

function StatusPill({ status, compact }: { status: string; compact?: boolean }) {
  const st = STATUS_META[status] || STATUS_META.submitted;
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

function FeaturedCrCard({ cr }: { cr: PortalCrListItem }) {
  const days = daysBetween(cr.targetDeliveryDate);
  return (
    <Link
      href={`/portal/change-requests/${cr.id}`}
      className="premium-featured-cr"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "16px 18px 16px 22px",
        background: "linear-gradient(180deg, #fffbeb 0%, #ffffff 70%)",
        border: `1px solid ${p.warningBorder}`,
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
        overflow: "hidden",
        transition: "border-color 140ms ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${p.warning}, #f97316)`,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                background: p.warningBg,
                border: `1px solid ${p.warningBorder}`,
                color: p.warningText,
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              <DollarSign size={10} />
              Estimate ready
            </span>
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11.5,
                padding: "1px 7px",
                background: p.surfaceMuted,
                border: `1px solid ${p.border}`,
                borderRadius: 6,
                color: p.textMuted,
                fontWeight: 600,
              }}
            >
              {cr.crNumber}
            </span>
            <PriorityChip priority={cr.priority} compact />
          </div>
          <div
            style={{
              fontSize: 15.5,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {cr.subject}
          </div>
          {cr.projectName && (
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: p.textSubtle,
                fontWeight: 600,
              }}
            >
              {cr.projectName}
            </div>
          )}
        </div>
        <span
          className="premium-featured-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 11px",
            background: INDIGO,
            color: "#ffffff",
            borderRadius: 7,
            fontSize: 11.5,
            fontWeight: 600,
            flexShrink: 0,
            transition: "background 140ms ease, gap 140ms ease",
          }}
        >
          Review & decide
          <ArrowUpRight size={12} />
        </span>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 0,
          background: p.surface,
          border: `1px solid ${p.border}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <FeaturedStat
          icon={DollarSign}
          label="Estimate"
          value={estimateText(cr)}
          tone={p.text}
        />
        <FeaturedStat
          icon={Calendar}
          label={
            days != null && days >= 0
              ? "Target in"
              : days != null && days < 0
              ? "Past target"
              : "Target"
          }
          value={
            days == null
              ? fmtDateShort(cr.targetDeliveryDate)
              : days > 0
              ? `${days}d`
              : days === 0
              ? "today"
              : `${-days}d`
          }
          tone={
            days != null && days < 0
              ? p.dangerText
              : days != null && days <= 3
              ? p.warningText
              : p.text
          }
          divider
        />
        <FeaturedStat
          icon={MessageCircle}
          label="Messages"
          value={String(cr.messageCount)}
          tone={p.text}
          divider
        />
        <FeaturedStat
          icon={Clock}
          label="Updated"
          value={fmtRelative(cr.lastActivityAt)}
          tone={p.textMuted}
          divider
        />
      </div>
    </Link>
  );
}

function FeaturedStat({
  icon: Icon,
  label,
  value,
  tone,
  divider,
}: {
  icon: any;
  label: string;
  value: string;
  tone: string;
  divider?: boolean;
}) {
  return (
    <div
      style={{
        padding: "9px 12px",
        borderLeft: divider ? `1px solid ${p.border}` : "none",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 9.5,
          fontWeight: 700,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <Icon size={10} />
        {label}
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 13,
          fontWeight: 700,
          color: tone,
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CrCardCompact({ cr }: { cr: PortalCrListItem }) {
  const awaitingDecision = cr.status === "estimated" && !cr.clientDecision;
  return (
    <Link
      href={`/portal/change-requests/${cr.id}`}
      className="premium-cr-card"
      data-state={cr.status}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "13px 14px 13px 16px",
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 10,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 140ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
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
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11,
                padding: "1px 6px",
                background: p.surfaceMuted,
                border: `1px solid ${p.border}`,
                borderRadius: 5,
                color: p.textMuted,
                fontWeight: 600,
              }}
            >
              {cr.crNumber}
            </span>
            <PriorityChip priority={cr.priority} compact />
            {awaitingDecision && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "1px 7px",
                  background: p.warningBg,
                  border: `1px solid ${p.warningBorder}`,
                  color: p.warningText,
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              >
                <DollarSign size={9} />
                Decide
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 13.5,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.005em",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {cr.subject}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <StatusPill status={cr.status} compact />
          <ChevronRight
            size={13}
            color={p.textFaint}
            className="premium-cr-arrow"
          />
        </div>
      </div>

      {(cr.projectName || cr.linkedInvoiceNumber) && (
        <div
          style={{
            fontSize: 11.5,
            color: p.textMuted,
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {cr.projectName && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 500,
              }}
            >
              <Folder size={10} color={p.textFaint} />
              {cr.projectName}
            </span>
          )}
          {cr.linkedInvoiceNumber && (
            <>
              {cr.projectName && <span style={{ color: p.textFaint }}>·</span>}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontWeight: 500,
                }}
              >
                <Receipt size={10} color={p.textFaint} />
                {cr.linkedInvoiceNumber}
              </span>
            </>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 11,
          color: p.textSubtle,
          flexWrap: "wrap",
          paddingTop: 8,
          borderTop: `1px dashed ${p.neutralBorder}`,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            gap: 4,
            alignItems: "center",
            fontWeight: 600,
            color: p.text,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <DollarSign size={11} color={INDIGO} />
          {estimateText(cr)}
        </span>
        {cr.targetDeliveryDate && (
          <span
            style={{
              display: "inline-flex",
              gap: 4,
              alignItems: "center",
              fontWeight: 500,
            }}
          >
            <Calendar size={10} />
            {fmtDateShort(cr.targetDeliveryDate)}
          </span>
        )}
        <span
          style={{
            display: "inline-flex",
            gap: 4,
            alignItems: "center",
            fontWeight: 500,
          }}
        >
          <MessageCircle size={10} />
          {cr.messageCount}
        </span>
        <span
          style={{
            display: "inline-flex",
            gap: 4,
            alignItems: "center",
            fontWeight: 500,
          }}
        >
          <Clock size={10} />
          {fmtRelative(cr.lastActivityAt)}
        </span>
      </div>
    </Link>
  );
}

function CrList({ items }: { items: PortalCrListItem[] }) {
  return (
    <div
      style={{
        background: p.surface,
        border: `1px solid ${p.border}`,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "100px minmax(200px, 1.8fr) 120px 90px 100px 100px 80px 16px",
          gap: 10,
          padding: "8px 16px",
          background: p.surfaceMuted,
          borderBottom: `1px solid ${p.border}`,
          fontSize: 10,
          fontWeight: 700,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <div>CR #</div>
        <div>Subject</div>
        <div>Status</div>
        <div>Priority</div>
        <div style={{ textAlign: "right" }}>Estimate</div>
        <div>Target</div>
        <div>Updated</div>
        <div />
      </div>
      {items.map((cr, idx) => (
        <CrRow key={cr.id} cr={cr} isLast={idx === items.length - 1} />
      ))}
    </div>
  );
}

function CrRow({ cr, isLast }: { cr: PortalCrListItem; isLast: boolean }) {
  const awaitingDecision = cr.status === "estimated" && !cr.clientDecision;
  return (
    <Link
      href={`/portal/change-requests/${cr.id}`}
      className="premium-cr-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "100px minmax(200px, 1.8fr) 120px 90px 100px 100px 80px 16px",
        gap: 10,
        padding: "11px 16px",
        alignItems: "center",
        borderBottom: isLast ? "none" : `1px solid ${p.border}`,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div>
        <span
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 11.5,
            padding: "1px 7px",
            background: p.surfaceMuted,
            border: `1px solid ${p.border}`,
            borderRadius: 5,
            color: p.textMuted,
            fontWeight: 600,
          }}
        >
          {cr.crNumber}
        </span>
      </div>
      <div style={{ minWidth: 0 }}>
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
              fontSize: 13,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.005em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
          >
            {cr.subject}
          </span>
          {awaitingDecision && (
            <span
              style={{
                padding: "1px 6px",
                fontSize: 10,
                fontWeight: 700,
                background: p.warningBg,
                border: `1px solid ${p.warningBorder}`,
                color: p.warningText,
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Decide
            </span>
          )}
        </div>
        {(cr.projectName || cr.linkedInvoiceNumber) && (
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              color: p.textSubtle,
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {cr.projectName && (
              <span
                style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
              >
                <Folder size={10} />
                {cr.projectName}
              </span>
            )}
            {cr.linkedInvoiceNumber && (
              <>
                {cr.projectName && (
                  <span style={{ color: p.textFaint }}>·</span>
                )}
                <span
                  style={{
                    display: "inline-flex",
                    gap: 3,
                    alignItems: "center",
                  }}
                >
                  <Receipt size={10} />
                  {cr.linkedInvoiceNumber}
                </span>
              </>
            )}
            <span style={{ color: p.textFaint }}>·</span>
            <span
              style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
            >
              <MessageCircle size={10} />
              {cr.messageCount}
            </span>
          </div>
        )}
      </div>
      <div>
        <StatusPill status={cr.status} compact />
      </div>
      <div>
        <PriorityChip priority={cr.priority} compact />
      </div>
      <div
        style={{
          textAlign: "right",
          fontSize: 12.5,
          color: p.text,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {estimateText(cr)}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: cr.targetDeliveryDate ? p.textMuted : p.textFaint,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontWeight: 500,
        }}
      >
        <Calendar size={11} color={p.textFaint} />
        {cr.targetDeliveryDate ? fmtDateShort(cr.targetDeliveryDate) : "—"}
      </div>
      <div
        style={{
          fontSize: 11,
          color: p.textSubtle,
          fontWeight: 500,
        }}
      >
        {fmtRelative(cr.lastActivityAt)}
      </div>
      <ChevronRight
        size={14}
        color={p.textFaint}
        className="premium-cr-arrow"
      />
    </Link>
  );
}

/* --------------------------------------------------------------- */

function RaiseCrModal({
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
    portalCrService
      .projectOptions()
      .then((ps) => setProjects(ps || []))
      .catch(() => setProjects([]));
    form.setFieldsValue({ priority: "medium" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      notify.error({ message: `${f.name} exceeds 10 MB` });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setFiles((prev) => [
        ...prev,
        { dataUrl: String(reader.result), name: f.name, size: f.size },
      ]);
    reader.readAsDataURL(f);
  };

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      await portalCrService.create({
        subject: values.subject.trim(),
        description: values.description.trim(),
        priority: values.priority,
        projectId: values.projectId || undefined,
        attachments: files.map((f) => ({
          dataUrl: f.dataUrl,
          fileName: f.name,
        })),
      });
      notify.success({ message: "Change request submitted" });
      onCreated();
    } catch (err: any) {
      notify.error({ message: "Submit failed", description: err?.message });
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
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          padding: 0,
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
            background: INDIGO_BG,
            color: INDIGO_TEXT,
            border: `1px solid ${INDIGO_BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GitPullRequest size={18} />
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: p.text }}>
            Raise a change request
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              color: p.textSubtle,
            }}
          >
            Tell us what you&apos;d like to change. We&apos;ll come back with
            an impact analysis, time and cost estimate for you to approve.
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
              <span style={{ fontSize: 12.5, color: p.textMuted }}>
                Subject
              </span>
            }
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Input
              placeholder="Short summary (e.g. Add bulk-export to admin)"
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span style={{ fontSize: 12.5, color: p.textMuted }}>
                What would you like changed?
              </span>
            }
            rules={[{ required: true, message: "Description is required" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Describe the change. Why it matters, who needs it, any references…"
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="priority"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted }}>
                  Priority
                </span>
              }
            >
              <Select options={PRIORITY_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="projectId"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted }}>
                  Project (optional)
                </span>
              }
            >
              <Select
                allowClear
                placeholder="—"
                options={projects.map((pr) => ({
                  value: pr.id,
                  label: pr.code ? `${pr.name} · ${pr.code}` : pr.name,
                }))}
              />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 18, marginTop: 10 }}>
            <div
              style={{
                fontSize: 12.5,
                color: p.textMuted,
                marginBottom: 10,
              }}
            >
              Attachments
              <span style={{ color: p.textFaint, fontSize: 11.5 }}>
                {" "}
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
                background: INDIGO,
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
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
