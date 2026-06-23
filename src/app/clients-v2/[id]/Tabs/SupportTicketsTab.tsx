"use client";

import dayjs from "dayjs";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Empty,
  Tooltip,
  Table,
  Tag,
} from "antd";
import {
  Plus,
  LifeBuoy,
  Send,
  Clock,
  CircleDot,
  User as UserIcon,
  FolderKanban,
  AlertTriangle,
  Bug,
  Sparkles,
  Server,
  KeyRound,
  HelpCircle,
  ChevronRight,
  Hash,
  MessageSquare,
  LayoutList,
  LayoutGrid,
  X,
  Search,
} from "lucide-react";
import {
  staffPortalTicketService,
  StaffPortalTicketListItem,
  StaffPortalTicketDetail,
  TicketStatus,
  TicketCategory,
  TicketPriority,
} from "@/services/staffPortalTicketService";
import { useTheme } from "@/context/ThemeContext";
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
} from "./_PremiumModal";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import SearchableDropdown from "@/components/common/SearchableDropdown";

type Mode = "light" | "dark";

const palette = (mode: Mode) => {
  const dark = mode === "dark";
  return {
    surfaceElevated: dark ? "#131B2D" : "#ffffff",
    surfaceMuted: dark ? "#0F1626" : "#f8fafc",
    border: dark ? "#1E293B" : "#e5e7eb",
    borderStrong: dark ? "#273449" : "#d1d5db",
    text: dark ? "#F1F5F9" : "#0f172a",
    textMuted: dark ? "#CBD5E1" : "#475569",
    textSubtle: dark ? "#94A3B8" : "#64748b",
    textFaint: dark ? "#64748B" : "#94a3b8",
    accentBg: dark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    accentBorder: dark ? "rgba(59,130,246,0.35)" : "#bfdbfe",
    accentText: dark ? "#93c5fd" : "#1d4ed8",
    successBg: dark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    successBorder: dark ? "rgba(16,185,129,0.35)" : "#a7f3d0",
    successText: dark ? "#6ee7b7" : "#047857",
    warningBg: dark ? "rgba(245,158,11,0.12)" : "#fffbeb",
    warningBorder: dark ? "rgba(245,158,11,0.35)" : "#fde68a",
    warningText: dark ? "#fcd34d" : "#92400e",
    dangerBg: dark ? "rgba(239,68,68,0.12)" : "#fef2f2",
    dangerBorder: dark ? "rgba(239,68,68,0.35)" : "#fecaca",
    dangerText: dark ? "#fca5a5" : "#b91c1c",
    purpleBg: dark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
    purpleBorder: dark ? "rgba(139,92,246,0.35)" : "#ddd6fe",
    purpleText: dark ? "#c4b5fd" : "#6d28d9",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.45)",
  };
};

function tonesOf(c: ReturnType<typeof palette>) {
  return {
    accent: { bg: c.accentBg, border: c.accentBorder, text: c.accentText },
    success: { bg: c.successBg, border: c.successBorder, text: c.successText },
    warning: { bg: c.warningBg, border: c.warningBorder, text: c.warningText },
    danger: { bg: c.dangerBg, border: c.dangerBorder, text: c.dangerText },
    purple: { bg: c.purpleBg, border: c.purpleBorder, text: c.purpleText },
    neutral: {
      bg: c.surfaceMuted,
      border: c.border,
      text: c.textSubtle,
    },
  };
}

const STATUS_META: Record<
  TicketStatus,
  { label: string; tone: keyof ReturnType<typeof tonesOf>; dot: string }
> = {
  new: { label: "New", tone: "accent", dot: "#3b82f6" },
  in_review: { label: "In review", tone: "purple", dot: "#8b5cf6" },
  in_progress: { label: "In progress", tone: "warning", dot: "#f59e0b" },
  waiting_on_client: {
    label: "Waiting on client",
    tone: "neutral",
    dot: "#94a3b8",
  },
  resolved: { label: "Resolved", tone: "success", dot: "#10b981" },
  closed: { label: "Closed", tone: "neutral", dot: "#64748b" },
};

const PRIORITY_META: Record<
  TicketPriority,
  { label: string; tone: keyof ReturnType<typeof tonesOf> }
> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "accent" },
  high: { label: "High", tone: "warning" },
  critical: { label: "Critical", tone: "danger" },
};

const CATEGORY_META: Record<
  TicketCategory,
  { label: string; icon: any; tone: keyof ReturnType<typeof tonesOf> }
> = {
  bug: { label: "Bug", icon: Bug, tone: "danger" },
  enhancement: { label: "Enhancement", icon: Sparkles, tone: "purple" },
  support: { label: "Support", icon: LifeBuoy, tone: "accent" },
  infra: { label: "Infra", icon: Server, tone: "warning" },
  access: { label: "Access", icon: KeyRound, tone: "neutral" },
  other: { label: "Other", icon: HelpCircle, tone: "neutral" },
};

function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
  onCountChange?: (n: number) => void;
}

export default function SupportTicketsTab({ clientId, projects = [], onCountChange }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => tonesOf(c), [c]);

  const [items, setItems] = useState<StaffPortalTicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [messageApi, contextHolder] = message.useMessage();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await staffPortalTicketService.list({
        clientId,
        status: statusFilter,
        search,
        limit: 100,
      });
      setItems(data);
      onCountChange?.(data.length);
    } catch (err: any) {
      messageApi.error(`Failed to load tickets: ${err?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: items.length };
    for (const it of items) acc[it.status] = (acc[it.status] || 0) + 1;
    return acc;
  }, [items]);

  const columns = useMemo(() => {
    return [
      {
        title: "Ticket #",
        dataIndex: "ticketNumber",
        key: "ticketNumber",
        width: 110,
        render: (v: string) => (
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 11.5, color: c.textMuted }}>
            {v}
          </span>
        ),
      },
      {
        title: "Subject",
        dataIndex: "subject",
        key: "subject",
        render: (_v: string, t: StaffPortalTicketListItem) => {
          const cat = CATEGORY_META[t.category] || CATEGORY_META.other;
          const CatIcon = cat.icon;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#3b82f6",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CatIcon size={13} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: c.text }}>
                {t.subject}
              </span>
            </div>
          );
        }
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (v: TicketStatus) => {
          const status = STATUS_META[v] || STATUS_META.new;
          return (
            <PillTone
              tone={tones[status.tone]}
              label={status.label}
              dot={status.dot}
            />
          );
        }
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        width: 110,
        render: (v: TicketPriority) => {
          const priority = PRIORITY_META[v] || PRIORITY_META.medium;
          return (
            <PillTone
              tone={tones[priority.tone]}
              label={priority.label}
              kind="priority"
            />
          );
        }
      },
      {
        title: "Project",
        dataIndex: "projectName",
        key: "projectName",
        width: 140,
        render: (v: string | null) => v ? (
          <span style={{ fontSize: 12, color: c.accentText, display: "inline-flex", gap: 4, alignItems: "center" }}>
            <FolderKanban size={11} />{v}
          </span>
        ) : <span style={{ color: c.textFaint }}>—</span>,
      },
      {
        title: "Assignee",
        dataIndex: "assignedStaffName",
        key: "assignedStaffName",
        width: 140,
        render: (v: string | null) => v ? (
          <span style={{ fontSize: 12.5, color: c.textMuted, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#3b82f6",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {v[0].toUpperCase()}
            </div>
            {v}
          </span>
        ) : <span style={{ color: c.textFaint }}>Unassigned</span>,
      },
      {
        title: "Messages",
        dataIndex: "messageCount",
        key: "messageCount",
        width: 100,
        render: (v: number) => (
          <span style={{ fontSize: 12.5, color: c.textSubtle, display: "inline-flex", gap: 4, alignItems: "center" }}>
            <MessageSquare size={12} />{v}
          </span>
        ),
      },
      {
        title: "Last Activity",
        dataIndex: "lastActivityAt",
        key: "lastActivityAt",
        width: 160,
        render: (v: string | null, t: StaffPortalTicketListItem) => {
          const overdue =
            t.dueDate &&
            t.status !== "closed" &&
            t.status !== "resolved" &&
            new Date(t.dueDate).getTime() < Date.now();
          return (
            <span
              style={{
                fontSize: 12.5,
                color: overdue ? tones.danger.text : c.textSubtle,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Clock size={11} />
              {fmtRelative(v)}
              {overdue && (
                <span
                  style={{
                    marginLeft: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    color: tones.danger.text,
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={11} />
                  overdue
                </span>
              )}
            </span>
          );
        }
      },
      {
        title: "",
        key: "openChevron",
        width: 40,
        render: () => <ChevronRight size={15} color={c.textFaint} />,
      }
    ];
  }, [c, tones]);

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}

      {/* Header */}
      <div className="support-header-wrap" style={{ margin: "0 -32px" }}>
        <TimeTrackingHeader
          icon={<LifeBuoy size={20} color="#3b82f6" />}
          title="Support tickets"
          description="Tickets raised by the client through the portal or opened by your team on their behalf."
          extra={
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => setCreateOpen(true)}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                borderColor: "transparent",
                borderRadius: "8px",
                height: "32px",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Create ticket
            </Button>
          }
          style={{
            background: "transparent",
            borderBottom: "1px solid var(--border-slate-100)",
            padding: "4px 32px",
            marginBottom: "8px",
          }}
        />
      </div>

      {/* Filters Row */}
      <div style={{ margin: "12px 0 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", flex: 1, minWidth: 0 }}>
          <Input
            allowClear
            className="contacts-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject or ticket #…"
            prefix={<Search size={15} style={{ color: "var(--text-slate-400)", marginRight: 8 }} />}
            style={{ width: "320px" }}
          />

          <SearchableDropdown
            placeholder="Status"
            searchPlaceholder="Search statuses"
            itemNoun="statuses"
            value={statusFilter === "all" ? undefined : statusFilter}
            onChange={(v) => setStatusFilter(v ?? "all")}
            options={(Object.keys(STATUS_META) as TicketStatus[]).map((key) => ({
              value: key,
              label: STATUS_META[key].label,
            }))}
            width={180}
            className="contacts-filter-select-sd"
          />
        </div>

        {/* View toggle */}
        <div className="ptab-segmented">
          <button
            type="button"
            className={viewMode === "card" ? "is-active" : ""}
            onClick={() => setViewMode("card")}
            aria-label="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            className={viewMode === "list" ? "is-active" : ""}
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <LayoutList size={15} />
          </button>
        </div>
      </div>

      <div className="ptab-divider" />

      {/* Body */}
      {loading ? (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            background: c.surfaceElevated,
            color: c.textSubtle,
          }}
        >
          Loading…
        </div>
      ) : items.length === 0 ? (
        <EmptyState c={c} onCreate={() => setCreateOpen(true)} />
      ) : viewMode === "list" ? (
        <div className="pp-table-wrap">
          <Table
            className="pp-table"
            dataSource={items}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            scroll={{ x: "max-content" }}
            onRow={(t) => ({ onClick: () => setOpenId(t.id), style: { cursor: "pointer" } })}
          />
        </div>
      ) : (
        <div className="pp-grid">
          {items.map((t) => (
            <TicketCard
              key={t.id}
              t={t}
              c={c}
              tones={tones}
              onClick={() => setOpenId(t.id)}
            />
          ))}
        </div>
      )}

      <CreateTicketModal
        open={createOpen}
        clientId={clientId}
        projects={projects}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          load();
        }}
        c={c}
        messageApi={messageApi}
      />

      <TicketDetailDrawer
        ticketId={openId}
        onClose={() => setOpenId(null)}
        onChanged={load}
        c={c}
        tones={tones}
        messageApi={messageApi}
      />

      {/* Premium adaptive header styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Full bleed header styling flush with vertical sidebar border */
        .support-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .support-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .support-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .support-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
        }

        /* Searchable Dropdown Overrides */
        .contacts-filter-select-sd.sd-trigger {
          height: 32px !important;
          border-radius: 8px !important;
          background: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          transition: all 0.2s ease !important;
          padding: 4px 12px !important;
          width: auto !important;
          min-width: 160px;
        }
        .contacts-filter-select-sd.sd-trigger:hover {
          border-color: var(--border-slate-200) !important;
          background: var(--bg-slate-50) !important;
        }
        .contacts-filter-select-sd.sd-trigger.is-active {
          border-color: #8b5cf6 !important;
          background: var(--bg-pure-white) !important;
        }
        .contacts-filter-select-sd.sd-trigger.is-open {
          border-color: #8b5cf6 !important;
          background: var(--bg-pure-white) !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
        }
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger:hover {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger.is-active,
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger.is-open {
          background: var(--bg-slate-900) !important;
          border-color: #8b5cf6 !important;
        }

        /* Segmented Toggles */
        .ptab-segmented {
          display: inline-flex;
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .ptab-segmented button {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--text-slate-400);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .ptab-segmented button:hover {
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
        }
        .ptab-segmented button.is-active {
          background: var(--bg-blue-50) !important;
          color: #3b82f6 !important;
        }
        [data-theme='dark'] .ptab-segmented {
          border-color: var(--border-slate-800);
          background: var(--bg-secondary);
        }
        [data-theme='dark'] .ptab-segmented button.is-active {
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }

        /* Proposal Style Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table .ant-table { background: transparent; font-size: 12px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .pp-table .ant-table-thead > tr > th::before { display: none !important; }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-placeholder > td { background: transparent !important; }

        /* Proposal Style Cards Grid */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .ptab-empty-wrapper { grid-column: 1 / -1; }
        @media (max-width: 700px) { .pp-grid { grid-template-columns: 1fr; } }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .pc-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
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
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }

        /* Dark Theme Support */
        [data-theme="dark"] .pp-table-wrap {
          border-color: var(--border-slate-800);
          background: var(--bg-secondary);
        }
        [data-theme="dark"] .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-800) !important;
          border-color: var(--border-slate-700) !important;
        }
        [data-theme="dark"] .pp-table .ant-table-tbody > tr > td {
          border-color: var(--border-slate-800) !important;
        }
        [data-theme="dark"] .pp-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-800) !important;
        }
        [data-theme="dark"] .pc-card {
          border-color: var(--border-slate-800);
          background: var(--bg-secondary);
        }
        [data-theme="dark"] .pc-card:hover {
          border-color: var(--border-slate-700);
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }
        [data-theme="dark"] .pc-foot {
          border-color: var(--border-slate-800);
          background: var(--bg-slate-800);
        }
        [data-theme="dark"] .pc-foot-row + .pc-foot-row {
          border-color: var(--border-slate-700);
        }
        [data-theme="dark"] .pc-foot-item {
          color: var(--text-slate-300);
        }
        [data-theme="dark"] .pc-foot-div {
          background: var(--border-slate-700);
        }
        [data-theme="dark"] .pc-title {
          color: var(--text-slate-100);
        }
        [data-theme="dark"] .pc-client-val {
          color: var(--text-slate-300);
        }
        [data-theme="dark"] .pc-actions:hover {
          background: var(--bg-slate-700);
          color: var(--text-slate-100);
        }
      `}} />
    </div>
  );
}

/* --------------------------------------------------------------- */

function StatusChip({
  c,
  tones,
  label,
  count,
  tone,
  active,
  onClick,
}: {
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  label: string;
  count: number;
  tone?: keyof ReturnType<typeof tonesOf>;
  active: boolean;
  onClick: () => void;
}) {
  const t = tone ? tones[tone] : tones.neutral;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 12px",
        background: active ? t.bg : c.surfaceElevated,
        color: active ? t.text : c.textMuted,
        border: `1px solid ${active ? t.border : c.border}`,
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 120ms ease",
      }}
    >
      {label}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "1px 7px",
          borderRadius: 999,
          background: active ? "rgba(255,255,255,0.4)" : c.surfaceMuted,
          color: active ? t.text : c.textSubtle,
          border: `1px solid ${active ? "transparent" : c.border}`,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({
  c,
  onCreate,
}: {
  c: ReturnType<typeof palette>;
  onCreate: () => void;
}) {
  return (
    <div
      style={{
        padding: 56,
        textAlign: "center",
        background: c.surfaceElevated,
        border: `1px dashed ${c.border}`,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: c.accentBg,
          color: c.accentText,
          border: `1px solid ${c.accentBorder}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <LifeBuoy size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
        No support tickets yet
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          color: c.textSubtle,
          maxWidth: 480,
          margin: "6px auto 0",
        }}
      >
        Anything the client raises from the portal lands here. You can also
        open one on their behalf — handy for phone calls or chats.
      </div>
      <div style={{ marginTop: 18 }}>
        <Button type="primary" icon={<Plus size={15} />} onClick={onCreate}>
          Create first ticket
        </Button>
      </div>
    </div>
  );
}

function TicketRow({
  t,
  c,
  tones,
  onClick,
}: {
  t: StaffPortalTicketListItem;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const status = STATUS_META[t.status] || STATUS_META.new;
  const priority = PRIORITY_META[t.priority] || PRIORITY_META.medium;
  const cat = CATEGORY_META[t.category] || CATEGORY_META.other;
  const CatIcon = cat.icon;
  const overdue =
    t.dueDate &&
    t.status !== "closed" &&
    t.status !== "resolved" &&
    new Date(t.dueDate).getTime() < Date.now();

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: c.surfaceElevated,
        border: `1px solid ${hover ? c.borderStrong : c.border}`,
        borderRadius: 12,
        cursor: "pointer",
        transition: "border-color 120ms ease",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: tones[cat.tone].bg,
          color: tones[cat.tone].text,
          border: `1px solid ${tones[cat.tone].border}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CatIcon size={17} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: c.textSubtle,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              padding: "1px 6px",
              border: `1px solid ${c.border}`,
              borderRadius: 5,
              background: c.surfaceMuted,
            }}
          >
            {t.ticketNumber}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: c.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 480,
            }}
          >
            {t.subject}
          </span>
        </div>
        <div
          style={{
            marginTop: 5,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            fontSize: 11.5,
            color: c.textSubtle,
          }}
        >
          <PillTone
            tone={tones[status.tone]}
            label={status.label}
            dot={status.dot}
          />
          <PillTone
            tone={tones[priority.tone]}
            label={priority.label}
            kind="priority"
          />
          {t.projectName && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FolderKanban size={11} />
              {t.projectName}
            </span>
          )}
          {t.assignedStaffName ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <UserIcon size={11} />
              {t.assignedStaffName}
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color: c.textFaint,
              }}
            >
              Unassigned
            </span>
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <MessageSquare size={11} />
            {t.messageCount}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: overdue ? tones.danger.text : c.textSubtle,
            }}
          >
            <Clock size={11} />
            {fmtRelative(t.lastActivityAt)}
            {overdue && (
              <span
                style={{
                  marginLeft: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  color: tones.danger.text,
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={11} />
                overdue
              </span>
            )}
          </span>
        </div>
      </div>
      <ChevronRight size={16} color={c.textFaint} />
    </div>
  );
}

function TicketCard({
  t,
  c,
  tones,
  onClick,
}: {
  t: StaffPortalTicketListItem;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onClick: () => void;
}) {
  const status = STATUS_META[t.status] || STATUS_META.new;
  const priority = PRIORITY_META[t.priority] || PRIORITY_META.medium;
  const cat = CATEGORY_META[t.category] || CATEGORY_META.other;
  const CatIcon = cat.icon;
  const overdue =
    t.dueDate &&
    t.status !== "closed" &&
    t.status !== "resolved" &&
    new Date(t.dueDate).getTime() < Date.now();

  return (
    <div
      className="pc-card"
      onClick={onClick}
    >
      <div className="pc-top">
        <div
          className="pc-avatar"
          style={{
            background: "#3b82f6",
            color: "#fff",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CatIcon size={13} />
        </div>
        <div className="pc-identity-body">
          <div className="pc-title" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span>{t.subject}</span>
            {/* Ticket code */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-slate-500)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                padding: "1px 5px",
                border: `1px solid var(--border-slate-200)`,
                borderRadius: 4,
                background: "var(--bg-slate-50)",
                flexShrink: 0,
              }}
            >
              {t.ticketNumber}
            </span>
            {/* Status pill beside the code */}
            <PillTone
              tone={tones[status.tone]}
              label={status.label}
              dot={status.dot}
            />
          </div>
          {t.projectName && (
            <div className="pc-client-line">
              <span className="pc-client-key">Project:</span>
              <span className="pc-client-val">{t.projectName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pc-foot">
        {/* Row 1 — Created, Updated, Assignee */}
        <div className="pc-foot-row">
          <span className="pc-foot-item">
            <span className="pc-foot-key">Created</span>
            <span className="pc-foot-val">
              {t.createdAt ? dayjs(t.createdAt).format("MMM D, YYYY · h:mm A") : "—"}
            </span>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Updated</span>
            <span className="pc-foot-val">
              {t.lastActivityAt ? dayjs(t.lastActivityAt).format("MMM D, YYYY · h:mm A") : "—"}
            </span>
          </span>
          {t.assignedStaffName && (
            <>
              <span className="pc-foot-div" />
              <span className="pc-foot-item">
                <span className="pc-foot-key">Assignee</span>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#3b82f6",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8.5px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {t.assignedStaffName[0].toUpperCase()}
                </div>
                <span className="pc-foot-val">{t.assignedStaffName}</span>
              </span>
            </>
          )}
        </div>

        {/* Row 2 — Messages, Priority, Overdue */}
        <div className="pc-foot-row">
          <span className="pc-foot-item">
            <MessageSquare size={12} style={{ color: "var(--text-slate-400)" }} />
            <span style={{ fontSize: "11.5px", color: "var(--text-slate-700)" }}>
              {t.messageCount} message{t.messageCount === 1 ? "" : "s"}
            </span>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <PillTone
              tone={tones[priority.tone]}
              label={priority.label}
              kind="priority"
            />
          </span>
          {overdue && (
            <>
              <span className="pc-foot-div" />
              <span className="pc-foot-item" style={{ color: tones.danger.text, fontWeight: 600 }}>
                <AlertTriangle size={12} />
                Overdue
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PillTone({
  tone,
  label,
  dot,
  kind,
}: {
  tone: { bg: string; border: string; text: string };
  label: string;
  dot?: string;
  kind?: "priority";
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "1px 8px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: dot,
          }}
        />
      )}
      {kind === "priority" && <CircleDot size={9} />}
      {label}
    </span>
  );
}

/* --------------------------------------------------------------- */

function CreateTicketModal({
  open,
  clientId,
  projects,
  onClose,
  onCreated,
  c,
  messageApi,
}: {
  open: boolean;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  onClose: () => void;
  onCreated: () => void;
  c: ReturnType<typeof palette>;
  messageApi: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        category: "support",
        priority: "medium",
      });
    } else {
      form.resetFields();
    }
  }, [open, form]);

  const submit = async (v: any) => {
    setSubmitting(true);
    try {
      await staffPortalTicketService.create({
        clientId,
        subject: v.subject.trim(),
        body: v.body.trim(),
        category: v.category,
        priority: v.priority,
        projectId: v.projectId || undefined,
      });
      messageApi.success("Ticket created");
      onCreated();
    } catch (err: any) {
      messageApi.error(`Create failed: ${err?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PremiumModal
      open={open}
      onClose={onClose}
      width={680}
      c={c}
      ribbonColor={c.accentText}
      iconTile={{ bg: c.accentBg, border: c.accentBorder, text: c.accentText }}
      icon={<LifeBuoy size={20} />}
      title="Create support ticket"
      subtitle="Opens a ticket on behalf of this client. The client will see it in their portal alongside their own tickets."
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to create">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            onClick={() => form.submit()}
            icon={<Plus size={14} />}
          >
            Create ticket
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="What's the issue"
          description="A short subject and a first message — the client will see both."
          icon={<Hash size={11} />}
          plain
        >
          <Form.Item
            name="subject"
            label={<L c={c}>Subject</L>}
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input
              placeholder="e.g. Login error after password reset"
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="body"
            label={<L c={c}>First message</L>}
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 16 }}
          >
            <Input.TextArea
              rows={5}
              placeholder="Steps, context, anything the client needs to know…"
              maxLength={4000}
              showCount
              style={{ padding: "10px 12px" }}
            />
          </Form.Item>
        </ModalSection>

        <ModalSection
          c={c}
          title="Routing"
          description="Category and priority shape the SLA. Project links the ticket to a project (optional)."
          icon={<FolderKanban size={11} />}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Form.Item
              name="category"
              label={<L c={c}>Category</L>}
              rules={[{ required: true }]}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={(Object.keys(CATEGORY_META) as TicketCategory[]).map(
                  (k) => ({ value: k, label: CATEGORY_META[k].label }),
                )}
              />
            </Form.Item>
            <Form.Item
              name="priority"
              label={<L c={c}>Priority</L>}
              rules={[{ required: true }]}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={(Object.keys(PRIORITY_META) as TicketPriority[]).map(
                  (k) => ({ value: k, label: PRIORITY_META[k].label }),
                )}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="projectId"
            label={
              <L c={c}>
                Project
              </L>
            }
            style={{ marginBottom: 0 }}
          >
            <Select
              allowClear
              placeholder={
                projects.length
                  ? "Pick a project this ticket relates to"
                  : "No projects linked to this client yet"
              }
              disabled={projects.length === 0}
              options={projects.map((p) => ({
                value: p.id,
                label: p.code ? `${p.name} · ${p.code}` : p.name,
              }))}
            />
          </Form.Item>
        </ModalSection>
      </Form>
    </PremiumModal>
  );
}

/* --------------------------------------------------------------- */

function TicketDetailDrawer({
  ticketId,
  onClose,
  onChanged,
  c,
  tones,
  messageApi,
}: {
  ticketId: string | null;
  onClose: () => void;
  onChanged: () => void;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  messageApi: any;
}) {
  const open = !!ticketId;
  const [detail, setDetail] = useState<StaffPortalTicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!ticketId) {
      setDetail(null);
      setReply("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    staffPortalTicketService
      .detail(ticketId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err: any) => {
        if (!cancelled) {
          messageApi.error(`Failed to load ticket: ${err?.message || ""}`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId, messageApi]);

  const refresh = async () => {
    if (!ticketId) return;
    try {
      const d = await staffPortalTicketService.detail(ticketId);
      setDetail(d);
    } catch {
      /* ignore */
    }
  };

  const send = async () => {
    if (!detail || !reply.trim()) return;
    setSending(true);
    try {
      await staffPortalTicketService.reply(detail.id, reply.trim());
      setReply("");
      await refresh();
      onChanged();
    } catch (err: any) {
      messageApi.error(`Send failed: ${err?.message || ""}`);
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (next: TicketStatus) => {
    if (!detail || detail.status === next) return;
    setSavingStatus(true);
    try {
      await staffPortalTicketService.updateStatus(detail.id, next);
      await refresh();
      onChanged();
    } catch (err: any) {
      messageApi.error(`Status change failed: ${err?.message || ""}`);
    } finally {
      setSavingStatus(false);
    }
  };

  const status = detail ? STATUS_META[detail.status] : null;
  const priority = detail ? PRIORITY_META[detail.priority] : null;
  const cat = detail ? CATEGORY_META[detail.category] : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={620}
      title={null}
      closable={false}
      styles={{
        mask: { backgroundColor: c.overlay },
        content: { background: c.surfaceElevated },
        header: { display: "none" },
        body: { padding: 0, background: c.surfaceMuted },
      }}
      zIndex={2000}
    >
      {loading || !detail ? (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            color: c.textSubtle,
          }}
        >
          Loading…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              background: c.surfaceElevated,
              borderBottom: `1px solid ${c.border}`,
              position: "relative",
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: c.textFaint,
                cursor: "pointer",
                transition: "all 120ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = c.surfaceMuted;
                e.currentTarget.style.color = c.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = c.textFaint;
              }}
            >
              <X size={15} />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: c.textSubtle,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                  padding: "1px 7px",
                  border: `1px solid ${c.border}`,
                  borderRadius: 5,
                  background: c.surfaceMuted,
                }}
              >
                {detail.ticket_number}
              </span>
              {status && (
                <PillTone
                  tone={tones[status.tone]}
                  label={status.label}
                  dot={status.dot}
                />
              )}
              {priority && (
                <PillTone
                  tone={tones[priority.tone]}
                  label={priority.label}
                  kind="priority"
                />
              )}
              {cat && (
                <PillTone tone={tones[cat.tone]} label={cat.label} />
              )}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: c.text,
                lineHeight: 1.3,
              }}
            >
              {detail.subject}
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 16,
                fontSize: 12,
                color: c.textSubtle,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {detail.projectName && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <FolderKanban size={13} />
                  {detail.projectName}
                </span>
              )}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <UserIcon size={13} />
                {detail.assignedStaffName || "Unassigned"}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Clock size={13} />
                Opened {fmtRelative(detail.created_at)}
              </span>
            </div>

            {/* Status changer */}
            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: c.textSubtle,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Status
              </span>
              <SearchableDropdown
                placeholder="Status"
                searchPlaceholder="Search statuses"
                itemNoun="statuses"
                value={detail.status}
                disabled={savingStatus}
                onChange={(v) => {
                  if (v) changeStatus(v as TicketStatus);
                }}
                options={(Object.keys(STATUS_META) as TicketStatus[]).map(
                  (s) => ({
                    value: s,
                    label: STATUS_META[s].label,
                  }),
                )}
                width={200}
                style={{ width: 200 }}
                allowClear={false}
                hideAvatar={true}
              />
            </div>
          </div>

          {/* Conversation */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {detail.messages.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: c.textSubtle, fontSize: 13 }}>
                    No messages yet
                  </span>
                }
              />
            ) : (
              detail.messages.map((m) => (
                <MessageBubble key={m.id} m={m} c={c} tones={tones} />
              ))
            )}
          </div>

          {/* Reply */}
          <div
            style={{
              padding: "16px 24px",
              background: c.surfaceElevated,
              borderTop: `1px solid ${c.border}`,
            }}
          >
            <Input.TextArea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply to the client…"
              autoSize={{ minRows: 2, maxRows: 6 }}
              style={{ padding: "10px 12px" }}
              onPressEnter={(e) => {
                if (e.metaKey || e.ctrlKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 11, color: c.textFaint }}>
                ⌘ ↵ to send
              </span>
              <Tooltip title="Send reply">
                <Button
                  type="primary"
                  icon={<Send size={13} />}
                  loading={sending}
                  disabled={!reply.trim()}
                  onClick={send}
                >
                  Send
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function MessageBubble({
  m,
  c,
  tones,
}: {
  m: StaffPortalTicketDetail["messages"][number];
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
}) {
  if (m.is_system_event) {
    return (
      <div
        style={{
          alignSelf: "center",
          fontSize: 11.5,
          color: c.textFaint,
          padding: "4px 10px",
          background: c.surfaceMuted,
          border: `1px solid ${c.border}`,
          borderRadius: 999,
          maxWidth: "80%",
          textAlign: "center",
        }}
      >
        {m.event_type === "status_change"
          ? `Status: ${m.event_from || "—"} → ${m.event_to || "—"}`
          : m.event_type === "assignment"
            ? `Assignment changed`
            : m.event_type || "Event"}
      </div>
    );
  }
  const isStaff = m.author_type === "staff";
  const tone = isStaff ? tones.accent : tones.neutral;
  return (
    <div
      style={{
        alignSelf: isStaff ? "flex-end" : "flex-start",
        maxWidth: "85%",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          background: tone.bg,
          color: c.text,
          border: `1px solid ${tone.border}`,
          borderRadius: 12,
          fontSize: 13.5,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
        }}
      >
        {m.body}
      </div>
      <div
        style={{
          fontSize: 10.5,
          color: c.textFaint,
          alignSelf: isStaff ? "flex-end" : "flex-start",
        }}
      >
        {isStaff
          ? m.staff_user_name || "Staff"
          : m.portal_user_name || m.portal_user_email || "Client"}{" "}
        · {fmtRelative(m.created_at)}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function L({
  c,
  children,
  hint,
}: {
  c: ReturnType<typeof palette>;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <span style={{ fontSize: 12.5, color: c.textMuted, fontWeight: 500 }}>
      {children}
      {hint && (
        <span
          style={{
            marginLeft: 6,
            fontSize: 11.5,
            color: c.textFaint,
            fontWeight: 400,
          }}
        >
          · {hint}
        </span>
      )}
    </span>
  );
}
