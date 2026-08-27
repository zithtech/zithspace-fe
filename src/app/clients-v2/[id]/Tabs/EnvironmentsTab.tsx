"use client";

import NoData from "@/components/common/NoData";
import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Drawer,
  Form,
  Input,
  DatePicker,
  message,
  Popconfirm,
  Empty,
  Tooltip,
  Tag,
  Table,
  Dropdown,
} from "antd";
import {
  Plus,
  Server,
  Globe,
  Activity,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  History,
  Rocket,
  ExternalLink,
  Trash2,
  ChevronRight,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CircleDot,
  Search,
  LayoutList,
  LayoutGrid,
  MoreHorizontal,
  Clock,
} from "lucide-react";
import dayjs from "dayjs";
import {
  environmentsService,
  EnvListItem,
  EnvDetail,
  EnvKind,
  EnvStatus,
  Deployment,
  DeployStatus,
  CreateEnvPayload,
} from "@/services/environmentsService";
import { useTheme } from "@/context/ThemeContext";
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
} from "./_PremiumModal";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { commonDrawerProps, SectionCard, drawerFormStyles } from "@/components/common/DrawerSection";
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

const KIND_META: Record<string, { label: string; tone: keyof ReturnType<typeof tonesOf> }> = {
  production: { label: "Production", tone: "danger" },
  staging: { label: "Staging", tone: "warning" },
  uat: { label: "UAT", tone: "accent" },
  qa: { label: "QA", tone: "purple" },
  dev: { label: "Dev", tone: "neutral" },
  demo: { label: "Demo", tone: "neutral" },
  preview: { label: "Preview", tone: "neutral" },
  other: { label: "Other", tone: "neutral" },
};

const STATUS_META: Record<string, { label: string; tone: keyof ReturnType<typeof tonesOf>; icon: any }> = {
  operational: { label: "Operational", tone: "success", icon: CheckCircle2 },
  degraded: { label: "Degraded", tone: "warning", icon: AlertTriangle },
  down: { label: "Down", tone: "danger", icon: XCircle },
  maintenance: { label: "Maintenance", tone: "accent", icon: CircleDot },
  unknown: { label: "Unknown", tone: "neutral", icon: CircleDot },
};

const DEPLOY_STATUS_META: Record<string, { label: string; tone: keyof ReturnType<typeof tonesOf>; icon: any }> = {
  success: { label: "Success", tone: "success", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "danger", icon: XCircle },
  rolled_back: { label: "Rolled back", tone: "warning", icon: History },
  in_progress: { label: "In progress", tone: "accent", icon: CircleDot },
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

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
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
function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}
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
  return fmtDate(iso);
}
function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
function fmtDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h${m ? ` ${m}m` : ""}`;
}

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
  onCountChange?: (n: number) => void;
}

export default function EnvironmentsTab({ clientId, projects = [], onCountChange, onRefresh }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => tonesOf(c), [c]);

  const [items, setItems] = useState<EnvListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [drawerInitialEditing, setDrawerInitialEditing] = useState(false);
  const [drawerInitialLogDeploy, setDrawerInitialLogDeploy] = useState(false);

  const envActionMenu = (env: EnvListItem) => ({
    className: "pp-action-pop",
    items: [
      {
        key: "edit",
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}><Edit3 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">Edit</span>
              <span className="pp-menu-desc">Modify settings</span>
            </span>
          </div>
        )
      },
      {
        key: "log_deploy",
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.12)" }}><Rocket size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">Log Deploy</span>
              <span className="pp-menu-desc">Record a deployment</span>
            </span>
          </div>
        )
      },
      {
        key: "delete",
        danger: true,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}><Trash2 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title" style={{ color: "#ef4444" }}>Delete</span>
              <span className="pp-menu-desc">Remove environment</span>
            </span>
          </div>
        )
      }
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent?.stopPropagation();
      if (key === "edit") {
        setDrawerInitialEditing(true);
        setOpenId(env.id);
      } else if (key === "log_deploy") {
        setDrawerInitialLogDeploy(true);
        setOpenId(env.id);
      } else if (key === "delete") {
        Modal.confirm({
          title: "Delete Environment",
          content: `Are you sure you want to delete "${env.name}"? This action cannot be undone.`,
          okText: "Delete",
          okType: "danger",
          cancelText: "Cancel",
          onOk: async () => {
            try {
              await environmentsService.remove(env.id);
              messageApi.success("Environment deleted");
              load();
            } catch (err: any) {
              messageApi.error(`Delete failed: ${err?.message || ""}`);
            }
          },
        });
      }
    }
  });

  const load = async () => {
    setLoading(true);
    try {
      const loaded = await environmentsService.listForClient(clientId);
      setItems(loaded);
      onCountChange?.(loaded.length);
    } catch (err: any) {
      messageApi.error(`Failed to load environments: ${err?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        load(),
        onRefresh ? onRefresh() : Promise.resolve(),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const columns = [
    {
      title: "Environment",
      key: "env",
      render: (_: any, env: EnvListItem) => {
        const kindMeta = KIND_META[env.kind] || KIND_META.other;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="pc-avatar"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#3b82f6",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Server size={14} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontWeight: 600, color: c.text, fontSize: 13 }}>{env.name}</span>
              <span style={{ display: "inline-flex", marginTop: 2 }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    padding: "1px 6px",
                    background: tones[kindMeta.tone].bg,
                    border: `1px solid ${tones[kindMeta.tone].border}`,
                    color: tones[kindMeta.tone].text,
                    borderRadius: 999,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {kindMeta.label}
                </span>
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (url: string | null) =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: c.accentText,
              textDecoration: "none",
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            <Globe size={12} />
            {url.replace(/^https?:\/\//, "")}
            <ExternalLink size={10} />
          </a>
        ) : (
          <span style={{ color: c.textFaint }}>—</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const st = STATUS_META[status] || STATUS_META.unknown;
        const StIcon = st.icon;
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              background: tones[st.tone].bg,
              border: `1px solid ${tones[st.tone].border}`,
              color: tones[st.tone].text,
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 500,
            }}
          >
            <StIcon size={10} />
            {st.label}
          </span>
        );
      },
    },
    {
      title: "Version",
      dataIndex: "currentVersion",
      key: "currentVersion",
      render: (v: string | null) =>
        v ? (
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 11.5, color: c.textMuted }}>
            {v}
          </span>
        ) : (
          <span style={{ color: c.textFaint }}>—</span>
        ),
    },
    {
      title: "Last Deploy",
      dataIndex: "lastDeployedAt",
      key: "lastDeployedAt",
      render: (date: string | null) =>
        date ? (
          <span style={{ fontSize: 12.5, color: c.textMuted, display: "inline-flex", gap: 4, alignItems: "center" }}>
            <Clock size={12} />
            {fmtRelative(date)}
          </span>
        ) : (
          <span style={{ color: c.textFaint }}>Never</span>
        ),
    },
    {
      title: "SSL Expiry",
      dataIndex: "sslExpiresAt",
      key: "sslExpiresAt",
      render: (date: string | null) => {
        const sslDays = daysUntil(date);
        const sslTone =
          sslDays == null
            ? tones.neutral
            : sslDays < 0
              ? tones.danger
              : sslDays <= 14
                ? tones.warning
                : tones.success;
        const sslLabel =
          sslDays == null
            ? "—"
            : sslDays < 0
              ? `Expired`
              : `${sslDays}d left`;
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              background: sslTone.bg,
              border: `1px solid ${sslTone.border}`,
              color: sslTone.text,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {sslDays != null && sslDays < 0 ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
            {sslLabel}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 72,
      align: "right" as const,
      fixed: "right" as const,
      render: (_: any, env: EnvListItem) => (
        <Dropdown
          menu={envActionMenu(env)}
          overlayClassName="pp-action-pop"
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            className="pp-icon-btn"
            icon={<MoreHorizontal size={16} />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  const filtered = items.filter((env) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchesName = env.name.toLowerCase().includes(q);
      const matchesUrl = (env.url || "").toLowerCase().includes(q);
      const matchesVersion = (env.currentVersion || "").toLowerCase().includes(q);
      if (!matchesName && !matchesUrl && !matchesVersion) return false;
    }
    if (projectFilter && env.projectId !== projectFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}

      {/* Header */}
      <div className="cd-tab-sticky-head">
      <div className="env-header-wrap" style={{ margin: "0 -32px" }}>
          <TimeTrackingHeader
            icon={<Server size={20} color="#3b82f6" />}
            title="Environments"
            description="Track production, staging and UAT URLs, current versions, SSL certificates and backups."
            onRefresh={handleRefresh}
            refreshing={refreshing}
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
                Add environment
              </Button>
            }
            style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)", padding: "4px 32px", marginBottom: "8px" }}
          />
        </div>
  
        {/* ── Toolbar ── */}
        {items.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                margin: "12px 0 8px 0",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {/* Search */}
                <Input
                  allowClear
                  className="contacts-search-input"
                  prefix={<Search size={14} style={{ color: c.textFaint }} />}
                  placeholder="Search environments…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: 220,
                  }}
                />
  
                {/* Project filter */}
                {projects.length > 0 && (
                  <SearchableDropdown
                    placeholder="All projects"
                    searchPlaceholder="Search projects"
                    itemNoun="projects"
                    value={projectFilter ?? undefined}
                    onChange={(v) => setProjectFilter(v ?? null)}
                    options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    width={180}
                    className="contacts-filter-select-sd"
                  />
                )}
              </div>
  
              {/* View toggle */}
              <div className="ptab-segmented">
                <button
                  type="button"
                  className={viewMode === "list" ? "is-active" : ""}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <LayoutList size={15} />
                </button>
                <button
                  type="button"
                  className={viewMode === "card" ? "is-active" : ""}
                  onClick={() => setViewMode("card")}
                  aria-label="Card view"
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
            </div>
            <div className="ptab-divider" />
          </>
        )}
      </div>

      <div style={{ marginTop: filtered.length === 0 && items.length > 0 ? 20 : 0 }}>
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
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              border: `1px dashed ${c.border}`,
              borderRadius: 12,
              color: c.textSubtle,
            }}
          >
            No environments match your filters.
          </div>
        ) : viewMode === "card" ? (
          <div className="pp-grid">
            {filtered.map((env) => (
              <EnvCard
                key={env.id}
                env={env}
                c={c}
                tones={tones}
                onOpen={() => setOpenId(env.id)}
                envActionMenu={envActionMenu}
              />
            ))}
          </div>
        ) : (
          <div className="pp-table-wrap">
            <Table
              className="pp-table"
              dataSource={filtered}
              columns={columns}
              rowKey="id"
              pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 20, hideOnSinglePage: true }}
              scroll={{ x: "max-content" }}
              onRow={(env) => ({ onClick: () => setOpenId(env.id), style: { cursor: "pointer" } })} locale={{ emptyText: <NoData /> }}
            />
          </div>
        )}
      </div>

      <CreateEnvModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          load();
        }}
        clientId={clientId}
        projects={projects}
        c={c}
        messageApi={messageApi}
      />

      <EnvDetailDrawer
        id={openId}
        c={c}
        tones={tones}
        projects={projects}
        messageApi={messageApi}
        onClose={() => {
          setOpenId(null);
          setDrawerInitialEditing(false);
          setDrawerInitialLogDeploy(false);
        }}
        onMutated={load}
        initialEditing={drawerInitialEditing}
        initialLogDeploy={drawerInitialLogDeploy}
      />

      {/* Premium adaptive header styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Full bleed header styling flush with vertical sidebar border */
        .env-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .env-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .env-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .env-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
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

        .pp-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        .pp-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

        /* Proposal Style Cards Grid */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
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
        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }
        .pc-status-tag .anticon { font-size: 9px; }

        /* Dropdown Action Popover */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 200px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

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
        [data-theme="dark"] .pp-action-pop .ant-dropdown-menu {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-800) !important;
        }
        [data-theme="dark"] .pp-action-pop .ant-dropdown-menu-item:hover {
          background: var(--bg-slate-800) !important;
        }
        [data-theme="dark"] .pp-action-pop .pp-menu-title {
          color: var(--text-slate-200) !important;
        }
        [data-theme="dark"] .pp-action-pop .ant-dropdown-menu-item-divider {
          background: var(--border-slate-800) !important;
        }
      `}} />
    </div>
  );
}

/* --------------------------------------------------------------- */

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
        <Server size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
        No environments registered yet
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
        Add Production / Staging URLs so the client always knows where to
        check and what version is live.
      </div>
      <div style={{ marginTop: 18 }}>
        <Button type="primary" icon={<Plus size={15} />} onClick={onCreate}>
          Add first environment
        </Button>
      </div>
    </div>
  );
}

function EnvCard({
  env,
  c,
  tones,
  onOpen,
  envActionMenu,
}: {
  env: EnvListItem;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onOpen: () => void;
  envActionMenu: any;
}) {
  const kindMeta = KIND_META[env.kind] || KIND_META.other;
  const st = STATUS_META[env.status] || STATUS_META.unknown;
  const StIcon = st.icon;
  const sslDays = daysUntil(env.sslExpiresAt);
  const sslTone =
    sslDays == null
      ? tones.neutral
      : sslDays < 0
        ? tones.danger
        : sslDays <= 14
          ? tones.warning
          : tones.success;
  const sslLabel =
    sslDays == null
      ? "SSL —"
      : sslDays < 0
        ? `SSL expired ${Math.abs(sslDays)}d ago`
        : `SSL ${sslDays}d left`;

  return (
    <div
      className="pc-card"
      onClick={onOpen}
    >
      <div className="pc-top">
        <div className="pc-avatar" style={{ background: "#3b82f6", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Server size={14} />
        </div>
        <div className="pc-identity-body">
          <div className="pc-title" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span>{env.name}</span>
            <span
              className="pc-status-tag"
              style={{
                marginLeft: "4px",
                fontSize: "10px",
                padding: "1px 6px",
                background: tones[kindMeta.tone].bg,
                border: `1px solid ${tones[kindMeta.tone].border}`,
                color: tones[kindMeta.tone].text,
              }}
            >
              {kindMeta.label.toUpperCase()}
            </span>
            <span
              className="pc-status-tag"
              style={{
                marginLeft: "4px",
                fontSize: "10px",
                padding: "1px 6px",
                background: tones[st.tone].bg,
                border: `1px solid ${tones[st.tone].border}`,
                color: tones[st.tone].text,
              }}
            >
              {st.label.toUpperCase()}
            </span>
            {env.visibility === "internal" && (
              <span
                className="pc-status-tag"
                style={{
                  marginLeft: "4px",
                  fontSize: "10px",
                  padding: "1px 6px",
                  background: c.surfaceMuted,
                  border: `1px solid ${c.border}`,
                  color: c.textSubtle,
                }}
              >
                INTERNAL ONLY
              </span>
            )}
          </div>
          {env.url && (
            <div className="pc-client-line">
              <span className="pc-client-key">URL:</span>
              <a
                href={env.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="cc-comm-link"
                style={{ fontSize: "11.5px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}
              >
                <Globe size={11} />
                {env.url.replace(/^https?:\/\//, "")}
                <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
          <Dropdown
            menu={envActionMenu(env)}
            overlayClassName="pp-action-pop"
            trigger={["click"]}
            placement="bottomRight"
          >
            <button type="button" className="pc-actions">
              <MoreHorizontal size={14} />
            </button>
          </Dropdown>
        </div>
      </div>

      <div className="pc-foot">
        <div className="pc-foot-row">
          <span className="pc-foot-item">
            <span className="pc-foot-key">Version</span>
            <span className="pc-foot-val" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              {env.currentVersion || "—"}
            </span>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Last deploy</span>
            <span className="pc-foot-val">
              {env.lastDeployedAt ? fmtRelative(env.lastDeployedAt) : "Never"}
            </span>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Uptime</span>
            <span className="pc-foot-val">
              {env.uptimePercent != null ? `${Number(env.uptimePercent).toFixed(2)}%` : "—"}
            </span>
          </span>
        </div>

        <div className="pc-foot-row">
          <span className="pc-foot-item">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                background: sslTone.bg,
                border: `1px solid ${sslTone.border}`,
                color: sslTone.text,
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 600,
              }}
            >
              {sslDays != null && sslDays < 0 ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
              {sslLabel.toUpperCase()}
            </span>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                background: c.surfaceElevated,
                border: `1px solid ${c.border}`,
                color: c.textSubtle,
                borderRadius: 999,
                fontSize: 10.5,
              }}
            >
              <History size={10} />
              {env.deploymentCount} DEPLOYS
            </span>
          </span>
        </div>

      </div>
    </div>
  );
}

function Metric({
  c,
  label,
  value,
}: {
  c: ReturnType<typeof palette>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 2, color: c.text, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function CreateEnvModal({
  open,
  onClose,
  onCreated,
  clientId,
  projects,
  c,
  messageApi,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  c: ReturnType<typeof palette>;
  messageApi: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) form.resetFields();
    else
      form.setFieldsValue({
        kind: "production",
        visibility: "client",
        status: "operational",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      const payload: CreateEnvPayload = {
        name: values.name.trim(),
        kind: values.kind,
        url: values.url || undefined,
        projectId: values.projectId || undefined,
        visibility: values.visibility,
        status: values.status,
        currentVersion: values.currentVersion || undefined,
        sslExpiresAt: values.sslExpiresAt
          ? dayjs(values.sslExpiresAt).format("YYYY-MM-DD")
          : undefined,
        lastBackupAt: values.lastBackupAt
          ? dayjs(values.lastBackupAt).toISOString()
          : undefined,
        notes: values.notes || undefined,
      };
      await environmentsService.create(clientId, payload);
      messageApi.success("Environment added");
      onCreated();
    } catch (err: any) {
      messageApi.error(`Could not create environment: ${err?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{drawerFormStyles}</style>
      <Drawer
        {...commonDrawerProps}
        open={open}
        onClose={onClose}
      >
        <div className="flex flex-col h-full bg-[var(--customers-page-bg,#0B0F1A)]">
          <div className="customer-drawer-header shrink-0 flex items-center justify-between px-6 py-4 border-b border-dashed border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: c.accentBg, border: `1px solid ${c.accentBorder}`, color: c.accentText }}
              >
                <Server size={16} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight m-0">Add an environment</h2>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 6,
                  padding: "6px 12px",
                  background: `rgba(59,130,246,0.08)`,
                  border: `1px solid rgba(59,130,246,0.22)`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: c.accentText,
                  lineHeight: 1.5,
                }}>
                  Production · Staging · UAT — anything you want to track for this client. Visibility controls whether it shows in their portal.
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 customer-drawer-form">
            <div className="mb-6 p-3 rounded-lg flex gap-3" style={{ background: c.successBg, border: `1px solid ${c.successBorder}` }}>
              <ShieldCheck size={16} className="shrink-0 mt-0.5" style={{ color: c.successText }} />
              <div className="text-[12.5px] font-medium" style={{ color: c.successText }}>
                SSL and backup fields are color-coded in the client portal based on
                how soon they expire.
              </div>
            </div>
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        labelAlign="left"
        onFinish={submit}
        requiredMark={false}
      >
        <SectionCard
          title="Identity"
          subtitle="What this environment is, where it lives, and who sees it."
          icon={<Server size={14} />}
          step="STEP 1"
        >
          <Form.Item
            name="name"
            label="Display name"
            rules={[{ required: true, message: "Name is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<Server size={13} color={c.textFaint} />}
              placeholder="e.g. Production · Web"
              maxLength={120}
            />
          </Form.Item>

          <Form.Item
            name="kind"
            label="Type"
            rules={[{ required: true, message: "Type is required" }]}
            style={{ marginBottom: 12 }}
          >
            <SearchableDropdown
              options={(Object.keys(KIND_META) as EnvKind[]).map((k) => ({
                value: k,
                label: KIND_META[k].label,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Status is required" }]}
            style={{ marginBottom: 12 }}
          >
            <SearchableDropdown
              options={(Object.keys(STATUS_META) as EnvStatus[]).map((s) => ({
                value: s,
                label: STATUS_META[s].label,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="visibility"
            label="Visibility"
            rules={[{ required: true, message: "Visibility is required" }]}
            style={{ marginBottom: 12 }}
          >
            <SearchableDropdown
              options={[
                { value: "client", label: "Visible to client" },
                { value: "internal", label: "Internal only" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="url"
            label="URL"
            rules={[
              { required: true, message: "URL is required" },
              {
                type: "url",
                message: "Please enter a valid URL (e.g., https://example.com)",
              },
            ]}
            style={{ marginBottom: 0 }}
          >
            <Input
              prefix={<Globe size={13} color={c.textFaint} />}
              placeholder="https://app.example.com"
            />
          </Form.Item>
        </SectionCard>

        <SectionCard
          title="Health & metadata"
          subtitle="Version, SSL expiry and backup state — all surfaced as color-coded chips in the portal."
          icon={<ShieldCheck size={14} />}
          step="STEP 2"
        >
          <Form.Item
            name="currentVersion"
            label="Current version"
              rules={[{ required: true, message: "Current version is required" }]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="e.g. v2.4.1" maxLength={60} />
          </Form.Item>
          <Form.Item
            name="sslExpiresAt"
            label="SSL expires"
            rules={[{ required: true, message: "SSL expiry date is required" }]}
            style={{ marginBottom: 12 }}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="lastBackupAt"
            label="Last backup"
            rules={[{ required: true, message: "Last backup date is required" }]}
            style={{ marginBottom: 12 }}
          >
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>

          <Form.Item
            name="projectId"
            label="Project"
            rules={[{ required: true, message: "Project is required" }]}
            style={{ marginBottom: 12 }}
          >
            <SearchableDropdown
              placeholder="—"
              searchPlaceholder="Search projects..."
              options={projects.map((p) => ({
                value: p.id,
                label: p.code ? `${p.name} · ${p.code}` : p.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes (optional)"
            style={{ marginBottom: 0 }}
          >
            <Input.TextArea rows={2} placeholder="Anything else worth noting" />
          </Form.Item>
        </SectionCard>
      </Form>
    </div>
    
    <div className="customer-drawer-footer shrink-0 px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3 bg-[var(--customers-page-bg,#0B0F1A)]">
      <Button onClick={onClose} className="border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] bg-transparent">
        Cancel
      </Button>
      <Button
        type="primary"
        htmlType="submit"
        loading={submitting}
        onClick={() => form.submit()}
        icon={<Server size={14} />}
        className="font-medium shadow-sm hover:opacity-90"
      >
        Save environment
      </Button>
    </div>
  </div>
</Drawer>
</>
  );
}

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

/* ====================================================================== */
/*  Detail drawer — settings + deploy history + log new deploy             */
/* ====================================================================== */

function EnvDetailDrawer({
  id,
  c,
  tones,
  projects,
  messageApi,
  onClose,
  onMutated,
  initialEditing,
  initialLogDeploy,
}: {
  id: string | null;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  projects: { id: string; name: string; code?: string | null }[];
  messageApi: any;
  onClose: () => void;
  onMutated: () => void;
  initialEditing?: boolean;
  initialLogDeploy?: boolean;
}) {
  const [data, setData] = useState<EnvDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [logDeployOpen, setLogDeployOpen] = useState(false);
  const [settingsForm] = Form.useForm();

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await environmentsService.detail(id);
      setData(d);
      settingsForm.setFieldsValue({
        name: d.name,
        kind: d.kind,
        url: d.url,
        status: d.status,
        currentVersion: d.currentVersion,
        sslExpiresAt: d.sslExpiresAt ? dayjs(d.sslExpiresAt) : undefined,
        lastBackupAt: d.lastBackupAt ? dayjs(d.lastBackupAt) : undefined,
        uptimePercent: d.uptimePercent != null ? Number(d.uptimePercent) : undefined,
        notes: d.notes,
        visibility: d.visibility,
        projectId: d.projectId,
      });
    } catch (err: any) {
      messageApi.error(`Failed to load: ${err?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setData(null);
    setEditing(!!initialEditing);
    setLogDeployOpen(!!initialLogDeploy);
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, initialEditing, initialLogDeploy]);

  const saveSettings = async (v: any) => {
    if (!data) return;
    try {
      await environmentsService.update(data.id, {
        name: v.name.trim(),
        kind: v.kind,
        url: v.url || undefined,
        status: v.status,
        currentVersion: v.currentVersion || undefined,
        sslExpiresAt: v.sslExpiresAt
          ? dayjs(v.sslExpiresAt).format("YYYY-MM-DD")
          : undefined,
        lastBackupAt: v.lastBackupAt
          ? dayjs(v.lastBackupAt).toISOString()
          : undefined,
        uptimePercent: v.uptimePercent ?? undefined,
        notes: v.notes || undefined,
        visibility: v.visibility,
        projectId: v.projectId || undefined,
      });
      messageApi.success("Saved");
      setEditing(false);
      load();
      onMutated();
    } catch (err: any) {
      messageApi.error(`Save failed: ${err?.message || ""}`);
    }
  };

  const removeEnv = async () => {
    if (!data) return;
    try {
      await environmentsService.remove(data.id);
      messageApi.success("Environment deleted");
      onClose();
      onMutated();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message || ""}`);
    }
  };

  const removeDeploy = async (deploymentId: string) => {
    try {
      await environmentsService.removeDeployment(deploymentId);
      messageApi.success("Deployment removed");
      load();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message || ""}`);
    }
  };

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={760}
      title={null}
      closable={false}
      styles={{
        mask: { backgroundColor: c.overlay },
        content: { background: c.surfaceElevated },
        header: { display: "none" },
        body: { padding: 0, background: c.surfaceElevated },
      }}
    >
      {!data || loading ? (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: c.textSubtle,
          }}
        >
          {loading ? "Loading…" : <NoData description="Nothing to show" />}
        </div>
      ) : (
        <>
          <DrawerHeader
            data={data}
            c={c}
            tones={tones}
            editing={editing}
            onToggleEdit={() => setEditing((v) => !v)}
            onDelete={removeEnv}
            onLogDeploy={() => setLogDeployOpen(true)}
          />

          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
            {editing ? (
              <SettingsForm
                form={settingsForm}
                c={c}
                projects={projects}
                onSave={saveSettings}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <SettingsView data={data} c={c} tones={tones} />
            )}

            <DeployHistory
              deployments={data.deployments}
              c={c}
              tones={tones}
              onRemove={removeDeploy}
            />
          </div>

          <LogDeploymentModal
            open={logDeployOpen}
            onClose={() => setLogDeployOpen(false)}
            onLogged={() => {
              setLogDeployOpen(false);
              load();
              onMutated();
            }}
            envId={data.id}
            c={c}
            messageApi={messageApi}
          />
        </>
      )}
    </Drawer>
  );
}

function DrawerHeader({
  data,
  c,
  tones,
  editing,
  onToggleEdit,
  onDelete,
  onLogDeploy,
}: {
  data: EnvDetail;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  editing: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
  onLogDeploy: () => void;
}) {
  const kindMeta = KIND_META[data.kind] || KIND_META.other;
  const st = STATUS_META[data.status] || STATUS_META.unknown;
  const StIcon = st.icon;
  return (
    <div
      style={{
        padding: "20px 22px 14px",
        borderBottom: `1px solid ${c.border}`,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: c.accentBg,
          border: `1px solid ${c.accentBorder}`,
          color: c.accentText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Server size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              padding: "1px 8px",
              background: tones[kindMeta.tone].bg,
              border: `1px solid ${tones[kindMeta.tone].border}`,
              color: tones[kindMeta.tone].text,
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {kindMeta.label}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              background: tones[st.tone].bg,
              border: `1px solid ${tones[st.tone].border}`,
              color: tones[st.tone].text,
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 500,
            }}
          >
            <StIcon size={11} />
            {st.label}
          </span>
          {data.visibility === "internal" && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 500,
                padding: "1px 7px",
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                color: c.textSubtle,
                borderRadius: 999,
              }}
            >
              Internal only
            </span>
          )}
        </div>
        <h2
          style={{
            margin: "8px 0 0",
            fontSize: 18,
            fontWeight: 600,
            color: c.text,
            letterSpacing: "-0.01em",
          }}
        >
          {data.name}
        </h2>
        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12.5,
              color: c.accentText,
              textDecoration: "none",
            }}
          >
            <Globe size={11} />
            {data.url.replace(/^https?:\/\//, "")}
            <ExternalLink size={11} />
          </a>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Button
          size="small"
          icon={<Rocket size={13} />}
          onClick={onLogDeploy}
        >
          Log deploy
        </Button>
        <Button
          size="small"
          icon={<Edit3 size={13} />}
          onClick={onToggleEdit}
        >
          {editing ? "Done editing" : "Edit"}
        </Button>
        <Popconfirm
          title="Delete this environment?"
          description="All deployment history attached to it is also deleted."
          onConfirm={onDelete}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button size="small" danger icon={<Trash2 size={13} />} />
        </Popconfirm>
      </div>
    </div>
  );
}

function SettingsView({
  data,
  c,
  tones,
}: {
  data: EnvDetail;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
}) {
  const sslDays = daysUntil(data.sslExpiresAt);
  const sslTone =
    sslDays == null
      ? tones.neutral
      : sslDays < 0
        ? tones.danger
        : sslDays <= 14
          ? tones.warning
          : tones.success;

  return (
    <div
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          background: c.surfaceMuted,
          borderBottom: `1px solid ${c.border}`,
          fontSize: 11,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Health &amp; metadata
      </div>
      <div
        style={{
          padding: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        <KV
          c={c}
          label="Current version"
          value={
            data.currentVersion ? (
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {data.currentVersion}
              </span>
            ) : (
              "—"
            )
          }
        />
        <KV
          c={c}
          label="SSL expires"
          value={
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "1px 8px",
                background: sslTone.bg,
                border: `1px solid ${sslTone.border}`,
                color: sslTone.text,
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 500,
              }}
            >
              {sslDays != null && sslDays < 0 ? (
                <ShieldAlert size={11} />
              ) : (
                <ShieldCheck size={11} />
              )}
              {sslDays == null
                ? "—"
                : sslDays < 0
                  ? `Expired ${Math.abs(sslDays)}d ago`
                  : sslDays === 0
                    ? "Today"
                    : `${sslDays}d`}
            </span>
          }
        />
        <KV
          c={c}
          label="Last backup"
          value={
            data.lastBackupAt ? (
              <span>
                <HardDrive
                  size={11}
                  style={{ verticalAlign: -1, marginRight: 4, color: c.textSubtle }}
                />
                {fmtRelative(data.lastBackupAt)}
              </span>
            ) : (
              "—"
            )
          }
        />
        <KV
          c={c}
          label="Uptime"
          value={
            data.uptimePercent != null
              ? `${Number(data.uptimePercent).toFixed(2)}%`
              : "—"
          }
        />
        <KV c={c} label="Project" value={data.projectName || "—"} />
        <KV
          c={c}
          label="Created"
          value={`${fmtDate(data.createdAt)} · ${data.createdByName || "—"}`}
        />
      </div>
      {data.notes && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: `1px solid ${c.border}`,
            fontSize: 13,
            color: c.textMuted,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
          }}
        >
          {data.notes}
        </div>
      )}
    </div>
  );
}

function KV({
  c,
  label,
  value,
}: {
  c: ReturnType<typeof palette>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 13, color: c.text, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

function SettingsForm({
  form,
  c,
  projects,
  onSave,
  onCancel,
}: {
  form: any;
  c: ReturnType<typeof palette>;
  projects: { id: string; name: string; code?: string | null }[];
  onSave: (values: any) => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 0,
        padding: 16,
      }}
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={onSave}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 10,
          }}
        >
          <Form.Item
            name="name"
            label={<L c={c}>Name</L>}
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item
            name="kind"
            label={<L c={c}>Type</L>}
            rules={[{ required: true, message: "Type is required" }]}
          >
            <SearchableDropdown
              options={(Object.keys(KIND_META) as EnvKind[]).map((k) => ({
                value: k,
                label: KIND_META[k].label,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label={<L c={c}>Status</L>}
            rules={[{ required: true, message: "Status is required" }]}
          >
            <SearchableDropdown
              options={(Object.keys(STATUS_META) as EnvStatus[]).map((s) => ({
                value: s,
                label: STATUS_META[s].label,
              }))}
            />
          </Form.Item>
        </div>
        <Form.Item
          name="url"
          label={<L c={c}>URL</L>}
          rules={[
            { required: true, message: "URL is required" },
            {
              type: "url",
              message: "Please enter a valid URL (e.g., https://example.com)",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          <Form.Item
            name="currentVersion"
            label={<L c={c}>Current version</L>}
            rules={[{ required: true, message: "Current version is required" }]}
          >
            <Input maxLength={60} />
          </Form.Item>
          <Form.Item
            name="sslExpiresAt"
            label={<L c={c}>SSL expires</L>}
            rules={[{ required: true, message: "SSL expiry date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="lastBackupAt"
            label={<L c={c}>Last backup</L>}
            rules={[{ required: true, message: "Last backup date is required" }]}
          >
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          <Form.Item
            name="uptimePercent"
            label={<L c={c}>Uptime %</L>}
            rules={[{ required: true, message: "Uptime % is required" }]}
          >
            <Input type="number" step="0.01" min={0} max={100} />
          </Form.Item>
          <Form.Item
            name="visibility"
            label={<L c={c}>Visibility</L>}
            rules={[{ required: true, message: "Visibility is required" }]}
          >
            <SearchableDropdown
              options={[
                { value: "client", label: "Client" },
                { value: "internal", label: "Internal" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="projectId"
            label={<L c={c}>Project</L>}
            rules={[{ required: true, message: "Project is required" }]}
          >
            <SearchableDropdown
              searchPlaceholder="Search projects..."
              options={projects.map((p) => ({
                value: p.id,
                label: p.code ? `${p.name} · ${p.code}` : p.name,
              }))}
            />
          </Form.Item>
        </div>
        <Form.Item name="notes" label={<L c={c}>Notes</L>}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            paddingTop: 8,
            borderTop: `1px solid ${c.border}`,
          }}
        >
          <Button size="small" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="small" type="primary" htmlType="submit">
            Save changes
          </Button>
        </div>
      </Form>
    </div>
  );
}

function DeployHistory({
  deployments,
  c,
  tones,
  onRemove,
}: {
  deployments: Deployment[];
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          background: c.surfaceMuted,
          borderBottom: `1px solid ${c.border}`,
          fontSize: 11,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <History size={12} />
        Deployment history · {deployments.length}
      </div>
      {deployments.length === 0 ? (
        <div style={{ padding: 22, fontSize: 12.5, color: c.textSubtle }}>
          No deployments logged yet. Use “Log deploy” to record one.
        </div>
      ) : (
        <div>
          {deployments.map((d) => {
            const meta = DEPLOY_STATUS_META[d.status] || DEPLOY_STATUS_META.success;
            const Icon = meta.icon;
            return (
              <div
                key={d.id}
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${c.border}`,
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 110px 30px",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: c.text,
                      }}
                    >
                      {d.version}
                    </span>
                    {d.releaseNoteVersion && (
                      <Tooltip
                        title={`Release: ${d.releaseNoteTitle || d.releaseNoteVersion}`}
                      >
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 500,
                            padding: "1px 6px",
                            background: c.purpleBg,
                            border: `1px solid ${c.purpleBorder}`,
                            color: c.purpleText,
                            borderRadius: 999,
                          }}
                        >
                          {d.releaseNoteVersion}
                        </span>
                      </Tooltip>
                    )}
                    {d.rollbackOfDeploymentId && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 500,
                          padding: "1px 6px",
                          background: c.warningBg,
                          border: `1px solid ${c.warningBorder}`,
                          color: c.warningText,
                          borderRadius: 999,
                        }}
                      >
                        Rollback
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 11.5,
                      color: c.textSubtle,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{fmtDateTime(d.finishedAt)}</span>
                    {d.durationSeconds != null && (
                      <>
                        <span style={{ color: c.textFaint }}>·</span>
                        <span>{fmtDuration(d.durationSeconds)}</span>
                      </>
                    )}
                    {(d.deployedByStaffName || d.deployedBy) && (
                      <>
                        <span style={{ color: c.textFaint }}>·</span>
                        <span>
                          by {d.deployedByStaffName || d.deployedBy}
                        </span>
                      </>
                    )}
                  </div>
                  {d.changelogExcerpt && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: c.textMuted,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {d.changelogExcerpt}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 9px",
                    background: tones[meta.tone].bg,
                    border: `1px solid ${tones[meta.tone].border}`,
                    color: tones[meta.tone].text,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  <Icon size={11} />
                  {meta.label}
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: c.textSubtle,
                  }}
                >
                  {fmtRelative(d.finishedAt)}
                </span>
                <Popconfirm
                  title="Remove this deployment record?"
                  onConfirm={() => onRemove(d.id)}
                >
                  <Button
                    size="small"
                    type="text"
                    icon={<Trash2 size={13} color={c.textSubtle} />}
                  />
                </Popconfirm>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

function LogDeploymentModal({
  open,
  onClose,
  onLogged,
  envId,
  c,
  messageApi,
}: {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
  envId: string;
  c: ReturnType<typeof palette>;
  messageApi: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!open) form.resetFields();
    else
      form.setFieldsValue({
        status: "success",
        finishedAt: dayjs(),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (v: any) => {
    if (!v.version?.trim()) {
      messageApi.error("Version is required");
      return;
    }
    setSubmitting(true);
    try {
      await environmentsService.createDeployment(envId, {
        version: v.version.trim(),
        status: v.status,
        startedAt: v.startedAt ? dayjs(v.startedAt).toISOString() : undefined,
        finishedAt: v.finishedAt
          ? dayjs(v.finishedAt).toISOString()
          : undefined,
        deployedBy: v.deployedBy || undefined,
        changelogExcerpt: v.changelogExcerpt || undefined,
      });
      messageApi.success("Deployment logged");
      onLogged();
    } catch (err: any) {
      messageApi.error(`Could not log deployment: ${err?.message || ""}`);
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
      width={540}
      closable={false}
      styles={{
        mask: { backgroundColor: c.overlay },
        content: {
          background: c.surfaceElevated,
          border: `1px solid ${c.border}`,
          padding: 0,
        },
        body: { padding: 0 },
      }}
    >
      <div
        style={{
          padding: "20px 22px 16px",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: c.accentBg,
            color: c.accentText,
            border: `1px solid ${c.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Rocket size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: c.text }}>
            Log a deployment
          </div>
          <div style={{ marginTop: 3, fontSize: 12.5, color: c.textSubtle }}>
            Successful deploys auto-update the environment&apos;s current
            version.
          </div>
        </div>
      </div>
      <div style={{ padding: 22 }}>
        <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="version"
              label={<L c={c}>Version</L>}
              rules={[{ required: true }]}
            >
              <Input placeholder="e.g. v2.4.2" maxLength={60} />
            </Form.Item>
            <Form.Item name="status" label={<L c={c}>Status</L>}>
              <SearchableDropdown
                options={(Object.keys(DEPLOY_STATUS_META) as DeployStatus[]).map(
                  (s) => ({
                    value: s,
                    label: DEPLOY_STATUS_META[s].label,
                  }),
                )}
              />
            </Form.Item>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item name="startedAt" label={<L c={c}>Started at</L>}>
              <DatePicker
                showTime
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
            <Form.Item name="finishedAt" label={<L c={c}>Finished at</L>}>
              <DatePicker
                showTime
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
          </div>
          <Form.Item name="deployedBy" label={<L c={c}>Deployed by</L>}>
            <Input placeholder="Name or initials" />
          </Form.Item>
          <Form.Item
            name="changelogExcerpt"
            label={<L c={c}>Changelog snippet</L>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Optional notes the client will see"
            />
          </Form.Item>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 14,
              paddingTop: 14,
              borderTop: `1px solid ${c.border}`,
            }}
          >
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Log deployment
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
