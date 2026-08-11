"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Input,
  Spin,
  Pagination,
  Select,
  DatePicker,
  Modal,
  Form,
  notification,
  Row as AntRow,
  Col,
  Divider,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import {
  Search,
  ChevronRight,
  Plus,
  MessageCircle,
  Send,
  AlertTriangle,
  Clock,
  LifeBuoy,
  X,
  Folder,
  CalendarRange,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  Target,
  Activity,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

dayjs.extend(quarterOfYear);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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
} from "./_ticketUi";
import { AttachmentPicker } from "@/app/portal/_components/AttachmentPicker";
import ZukvoLoader from "@/components/common/ZukvoLoader";

const INDIGO = "#4f46e5";
const INDIGO_BG = "#eef2ff";
const INDIGO_BORDER = "#c7d2fe";
const INDIGO_TEXT = "#4338ca";
const SURFACE_TINTED = "#fafbff";

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "new", label: "New" },
  { key: "in_progress", label: "In progress" },
  { key: "waiting_on_client", label: "Waiting on you" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "enhancement", label: "Enhancement" },
  { value: "support", label: "Support" },
  { value: "infra", label: "Infra issue" },
  { value: "access", label: "Access request" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

type ViewMode = "card" | "list";
const VIEW_STORAGE_KEY = "portal.tickets.view";

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

/* --------------------------------------------------------------- */

export default function PortalTicketsPage() {
  const [items, setItems] = useState<PortalTicketListItem[]>([]);
  const [meta, setMeta] = useState<PortalTicketMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ALL");
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [datePicked, setDatePicked] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("card");
  const [createOpen, setCreateOpen] = useState(false);
  const limit = 20;
  const [notify, contextHolder] = notification.useNotification();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "card" || stored === "list") setView(stored);
    } catch { }
  }, []);

  const setViewPersist = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch { }
  };

  const fromIso = datePicked?.[0]
    ? datePicked[0]!.format("YYYY-MM-DD")
    : undefined;
  const toIso = datePicked?.[1] ? datePicked[1]!.format("YYYY-MM-DD") : undefined;

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalTicketService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
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
  }, [page, status, projectId, fromIso, toIso]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Featured: tickets waiting on the client (action needed)
  const hasAnyFilter =
    status !== "ALL" || !!projectId || !!search || !!fromIso || !!toIso;
  const featured = useMemo(() => {
    if (hasAnyFilter || page !== 1) return [];
    return items.filter((t) => t.status === "waiting_on_client");
  }, [items, hasAnyFilter, page]);

  const restItems = useMemo(() => {
    if (featured.length === 0) return items;
    const ids = new Set(featured.map((t) => t.id));
    return items.filter((t) => !ids.has(t.id));
  }, [items, featured]);

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
        backgroundColor: "#ffffff",
      }}
    >
      {contextHolder}

      {/* Header */}
      <div
        className="saas-header-container portal-tickets-header-container"
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
        <AntRow justify="space-between" align="middle" gutter={[16, 16]}>
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
                  <LifeBuoy size={17} color={INDIGO} />
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
                  Support tickets
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
                  Raise a ticket, track our response, and keep everything in one
                  thread. SLA targets shown for every priority.
                </Text>
              </div>
            </div>
          </Col>
          <Col flex="0 0 auto">
            <button
              onClick={() => setCreateOpen(true)}
              className="premium-new-cta"
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
              Raise ticket
            </button>
          </Col>
        </AntRow>
      </div>

      <div
        className="portal-tickets-content-container"
        style={{ padding: "20px 40px 56px", maxWidth: 1280 }}
      >
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

        {/* Filter bar */}
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
        />

        {/* Featured: waiting on you */}
        {!loading && featured.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionLabel
              icon={AlertTriangle}
              label="Needs your attention"
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
              {featured.map((t) => (
                <FeaturedTicketCard key={t.id} ticket={t} />
              ))}
            </div>
          </div>
        )}

        {!loading && featured.length > 0 && restItems.length > 0 && (
          <SectionLabel
            icon={LifeBuoy}
            label="All tickets"
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
            <ZukvoLoader message="" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={
              search
                ? `No tickets match "${search}"`
                : status !== "ALL"
                  ? "Nothing in this status"
                  : "No tickets yet"
            }
            body={
              search
                ? "Try a different search term or clear filters above."
                : "Raise a ticket when something needs attention. We respond based on the priority you choose."
            }
            ctaLabel="Raise your first ticket"
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
            {restItems.map((t) => (
              <TicketCardCompact key={t.id} ticket={t} />
            ))}
          </div>
        ) : (
          <TicketList items={restItems} />
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

          .premium-new-cta:hover {
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

          /* Ticket card */
          .premium-ticket-card {
            position: relative;
          }
          .premium-ticket-card::before {
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
          .premium-ticket-card[data-state='waiting_on_client']::before {
            background: #d97706;
          }
          .premium-ticket-card[data-state='resolved']::before,
          .premium-ticket-card[data-state='closed']::before {
            background: #a7f3d0;
          }
          .premium-ticket-card[data-state='in_progress']::before,
          .premium-ticket-card[data-state='in_review']::before {
            background: #4f46e5;
          }
          .premium-ticket-card[data-sla='breached']::before {
            background: #dc2626 !important;
          }
          .premium-ticket-card:hover {
            border-color: #a5b4fc !important;
          }
          .premium-ticket-card:hover .premium-ticket-arrow {
            transform: translateX(2px);
            color: #4f46e5;
          }
          .premium-ticket-arrow {
            transition: transform 140ms ease, color 140ms ease;
          }

          /* Row hover */
          .premium-ticket-row {
            transition: background 120ms ease;
          }
          .premium-ticket-row:hover {
            background: #fafbff;
          }
          .premium-ticket-row:hover .premium-ticket-arrow {
            transform: translateX(2px);
            color: #4f46e5;
          }

          /* Featured */
          .premium-featured-ticket:hover {
            border-color: #f59e0b !important;
          }
          .premium-featured-ticket:hover .premium-featured-cta {
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

          @media (max-width: 640px) {
            .portal-tickets-header-container,
            .saas-header-container.portal-tickets-header-container {
              padding: 12px 16px !important;
            }
            .portal-tickets-content-container {
              padding: 16px 16px 40px !important;
            }
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
}: {
  search: string;
  onSearchChange: (v: string) => void;
  projects: { id: string; name: string; code: string | null }[];
  projectId: string | undefined;
  onProjectChange: (v: string | undefined) => void;
  datePicked: [Dayjs | null, Dayjs | null] | null;
  onDateChange: (r: [Dayjs | null, Dayjs | null] | null) => void;
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
          placeholder="Search ticket # or subject…"
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
}: {
  search: string;
  onClearSearch: () => void;
  projectName: string | undefined;
  onClearProject: () => void;
  datePicked: [Dayjs | null, Dayjs | null] | null;
  onClearDateRange: () => void;
  statusFilter: string | undefined;
  onClearStatus: () => void;
}) {
  const hasDates = !!(datePicked && (datePicked[0] || datePicked[1]));
  const any = !!search || !!projectName || hasDates || !!statusFilter;
  if (!any) return null;

  const dateLabel = hasDates
    ? `${datePicked?.[0] ? datePicked[0].format("MMM D") : "Any"} → ${datePicked?.[1] ? datePicked[1].format("MMM D, YYYY") : "Any"
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
          label={`Status: ${statusFilter.replace(/_/g, " ")}`}
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
            className="premium-new-cta"
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

function SlaBadge({ ticket }: { ticket: PortalTicketListItem }) {
  const breached =
    ticket.sla.firstResponseBreached || ticket.sla.resolutionBreached;
  if (!breached) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "1px 7px",
        background: p.dangerBg,
        border: `1px solid ${p.dangerBorder}`,
        color: p.dangerText,
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      <AlertTriangle size={10} />
      SLA breach
    </span>
  );
}

function FeaturedTicketCard({ ticket }: { ticket: PortalTicketListItem }) {
  const days = daysBetween(ticket.dueDate);
  const pri = PRIORITY_META[ticket.priority] || PRIORITY_META.medium;
  const priTone = TONE[pri.tone];
  return (
    <Link
      href={`/portal/tickets/${ticket.id}`}
      className="premium-featured-ticket"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 12,
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
              flexWrap: "wrap",
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
              <Clock size={10} />
              Waiting on you
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
              {ticket.ticketNumber}
            </span>
            <span
              style={{
                padding: "1px 7px",
                background: priTone.bg,
                border: `1px solid ${priTone.border}`,
                color: priTone.text,
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 600,
              }}
            >
              {pri.label}
            </span>
            <SlaBadge ticket={ticket} />
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: p.text,
              letterSpacing: "-0.01em",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {ticket.subject}
          </div>
          {ticket.projectName && (
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                color: p.textSubtle,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Folder size={11} color={p.textFaint} />
              {ticket.projectName}
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
          Reply
          <ArrowUpRight size={12} />
        </span>
      </div>

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
          icon={MessageCircle}
          label="Messages"
          value={String(ticket.messageCount)}
          tone={p.text}
        />
        <FeaturedStat
          icon={Calendar}
          label={
            days != null && days >= 0
              ? "Due in"
              : days != null && days < 0
                ? "Overdue"
                : "Due"
          }
          value={
            days == null
              ? fmtDateShort(ticket.dueDate)
              : days > 0
                ? `${days}d`
                : days === 0
                  ? "today"
                  : `${-days}d`
          }
          tone={
            days != null && days < 0
              ? p.dangerText
              : days != null && days <= 1
                ? p.warningText
                : p.text
          }
          divider
        />
        <FeaturedStat
          icon={Clock}
          label="Updated"
          value={fmtRelative(ticket.lastActivityAt)}
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

function TicketCardCompact({ ticket }: { ticket: PortalTicketListItem }) {
  const breached =
    ticket.sla.firstResponseBreached || ticket.sla.resolutionBreached;
  return (
    <Link
      href={`/portal/tickets/${ticket.id}`}
      className="premium-ticket-card"
      data-state={ticket.status}
      data-sla={breached ? "breached" : "ok"}
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
              {ticket.ticketNumber}
            </span>
            <CategoryChip category={ticket.category} compact />
            <PriorityChip priority={ticket.priority} compact />
            <SlaBadge ticket={ticket} />
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
            {ticket.subject}
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
          <StatusPill status={ticket.status} compact />
          <ChevronRight
            size={13}
            color={p.textFaint}
            className="premium-ticket-arrow"
          />
        </div>
      </div>

      {ticket.projectName && (
        <div
          style={{
            fontSize: 11.5,
            color: p.textMuted,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 500,
          }}
        >
          <Folder size={10} color={p.textFaint} />
          {ticket.projectName}
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
            fontWeight: 500,
          }}
        >
          <MessageCircle size={10} />
          {ticket.messageCount} message{ticket.messageCount === 1 ? "" : "s"}
        </span>
        {ticket.dueDate && (
          <span
            style={{
              display: "inline-flex",
              gap: 4,
              alignItems: "center",
              fontWeight: 500,
            }}
          >
            <Calendar size={10} />
            {fmtDateShort(ticket.dueDate)}
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
          <Clock size={10} />
          {fmtRelative(ticket.lastActivityAt)}
        </span>
      </div>
    </Link>
  );
}

function TicketList({ items }: { items: PortalTicketListItem[] }) {
  return (
    <div
      style={{
        background: p.surface,
        border: `1px solid ${p.border}`,
        borderRadius: 10,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "100px minmax(200px, 1.8fr) 110px 90px 100px 80px 16px",
          minWidth: 700,
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
        <div>Ticket #</div>
        <div>Subject</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Category</div>
        <div>Updated</div>
        <div />
      </div>
      {items.map((t, idx) => (
        <TicketRow key={t.id} ticket={t} isLast={idx === items.length - 1} />
      ))}
    </div>
  );
}

function TicketRow({
  ticket,
  isLast,
}: {
  ticket: PortalTicketListItem;
  isLast: boolean;
}) {
  const breached =
    ticket.sla.firstResponseBreached || ticket.sla.resolutionBreached;
  return (
    <Link
      href={`/portal/tickets/${ticket.id}`}
      className="premium-ticket-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "100px minmax(200px, 1.8fr) 110px 90px 100px 80px 16px",
        minWidth: 700,
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
          {ticket.ticketNumber}
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
            {ticket.subject}
          </span>
          {breached && <SlaBadge ticket={ticket} />}
        </div>
        {ticket.projectName && (
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              color: p.textSubtle,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
            >
              <Folder size={10} />
              {ticket.projectName}
            </span>
            <span style={{ color: p.textFaint }}>·</span>
            <span
              style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
            >
              <MessageCircle size={10} />
              {ticket.messageCount}
            </span>
          </div>
        )}
      </div>
      <div>
        <StatusPill status={ticket.status} compact />
      </div>
      <div>
        <PriorityChip priority={ticket.priority} compact />
      </div>
      <div>
        <CategoryChip category={ticket.category} compact />
      </div>
      <div
        style={{
          fontSize: 11,
          color: p.textSubtle,
          fontWeight: 500,
        }}
      >
        {fmtRelative(ticket.lastActivityAt)}
      </div>
      <ChevronRight
        size={14}
        color={p.textFaint}
        className="premium-ticket-arrow"
      />
    </Link>
  );
}

/* ====================================================================== */
/*  Raise Ticket modal                                                     */
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
          background: p.surfaceElevated,
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
            background: INDIGO_BG,
            color: INDIGO_TEXT,
            border: `1px solid ${INDIGO_BORDER}`,
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
            We&apos;ll respond based on the priority you choose. Critical
            issues get a 1-hour first-response target.
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
              <span style={{ fontSize: 12.5, color: p.textMuted }}>Subject</span>
            }
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Input
              placeholder="Brief, specific summary (e.g. Login page returns 500)"
              maxLength={120}
              showCount
            />
          </Form.Item>

          <div
            className="portal-tickets-modal-grid"
          >
            <Form.Item
              name="category"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted }}>
                  Category
                </span>
              }
              rules={[{ required: true }]}
            >
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="priority"
              label={
                <span style={{ fontSize: 12.5, color: p.textMuted }}>
                  Priority
                </span>
              }
              rules={[{ required: true }]}
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
                options={projects.map((proj) => ({
                  value: proj.id,
                  label: proj.code ? `${proj.name} · ${proj.code}` : proj.name,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="body"
            label={
              <span style={{ fontSize: 12.5, color: p.textMuted }}>
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
                marginBottom: 6,
              }}
            >
              Attachments{" "}
              <span style={{ color: p.textFaint, fontSize: 11.5 }}>
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
              className="premium-new-cta"
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
              {submitting ? "Submitting…" : "Submit ticket"}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
