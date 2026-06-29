"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Table,
  Dropdown,
  Avatar,
  Space,
  Drawer,
} from "antd";
import {
  Plus,
  Flag,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  PauseCircle,
  XCircle,
  Edit3,
  Trash2,
  FolderKanban,
  ListChecks,
  X,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
} from "lucide-react";
import dayjs from "dayjs";
import {
  milestoneService,
  Milestone,
  MilestoneItem,
  MilestoneStatus,
  CreateMilestonePayload,
} from "@/services/milestoneService";
import { useTheme } from "@/context/ThemeContext";
import { usePermission } from "@/hooks/usePermission";
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
  MilestoneStatus,
  {
    label: string;
    tone: keyof ReturnType<typeof tonesOf>;
    icon: any;
    color: string;
  }
> = {
  not_started: { label: "Not started", tone: "neutral", icon: Circle, color: "#94a3b8" },
  in_progress: { label: "In progress", tone: "warning", icon: Clock, color: "#f59e0b" },
  completed: { label: "Completed", tone: "success", icon: CheckCircle2, color: "#10b981" },
  on_hold: { label: "On hold", tone: "purple", icon: PauseCircle, color: "#8b5cf6" },
  cancelled: { label: "Cancelled", tone: "danger", icon: XCircle, color: "#ef4444" },
};

function fmtDate(iso: string | null | undefined): string {
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

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
}

export default function MilestonesTab({ clientId, projects = [] }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => tonesOf(c), [c]);
  const { canUpdateClient } = usePermission();

  const [items, setItems] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [viewingMilestoneId, setViewingMilestoneId] = useState<string | null>(null);
  const viewingMilestone = useMemo(() => {
    if (!viewingMilestoneId) return null;
    return items.find((m) => m.id === viewingMilestoneId) || null;
  }, [items, viewingMilestoneId]);
  const [messageApi, contextHolder] = message.useMessage();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await milestoneService.list(clientId));
    } catch (err: any) {
      messageApi.error(`Failed to load milestones: ${err?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const remove = async (m: Milestone) => {
    try {
      await milestoneService.remove(m.id);
      messageApi.success("Milestone removed");
      load();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message || ""}`);
    }
  };

  const counts = useMemo(() => {
    const total = items.length;
    const completed = items.filter((m) => m.status === "completed").length;
    const inProgress = items.filter((m) => m.status === "in_progress").length;
    const itemsTotal = items.reduce((a, m) => a + m.itemsTotal, 0);
    const itemsDone = items.reduce((a, m) => a + m.itemsDone, 0);
    return { total, completed, inProgress, itemsTotal, itemsDone };
  }, [items]);

  const filteredItems = items.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (item.name || "").toLowerCase().includes(search) ||
      (item.projectName || "").toLowerCase().includes(search);

    let matchesProject = true;
    if (selectedProject !== "all") {
      matchesProject = item.projectId === selectedProject;
    }

    let matchesStatus = true;
    if (selectedStatus !== "all") {
      matchesStatus = item.status === selectedStatus;
    }

    return matchesSearch && matchesProject && matchesStatus;
  });

  const milestoneActionMenu = (m: Milestone) => ({
    className: "pp-action-pop",
    items: [
      {
        key: "edit",
        disabled: !canUpdateClient,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}><Edit3 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">Edit</span>
              <span className="pp-menu-desc">Modify milestone</span>
            </span>
          </div>
        )
      },
      {
        key: "delete",
        danger: true,
        disabled: !canUpdateClient,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}><Trash2 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title" style={{ color: "#ef4444" }}>Delete</span>
              <span className="pp-menu-desc">Remove milestone</span>
            </span>
          </div>
        )
      }
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent?.stopPropagation();
      if (key === "edit") {
        setEditing(m);
        setCreateOpen(true);
      } else if (key === "delete") {
        remove(m);
      }
    }
  });

  const columns = [
    {
      title: "Milestone",
      key: "name",
      render: (_: any, record: Milestone) => {
        const meta = STATUS_META[record.status] || STATUS_META.not_started;
        return (
          <Space size={12} style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: c.purpleBg,
                border: `1px solid ${c.purpleBorder}`,
                color: c.purpleText,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Flag size={14} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, color: "var(--text-slate-900)", fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, minWidth: 0, width: "100%" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px", flexShrink: 1, minWidth: 0 }} title={record.name}>
                  {record.name}
                </span>
                <span
                  className="pc-status-tag"
                  style={{
                    color: tones[meta.tone].text,
                    background: tones[meta.tone].bg,
                    border: `1px solid ${tones[meta.tone].border}`,
                    height: "18px",
                    padding: "0 6px",
                    fontSize: "9.5px",
                    fontWeight: 700,
                    borderRadius: "4px",
                    lineHeight: "16px",
                  }}
                >
                  {meta.label.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-slate-500)", display: "flex", gap: 8, marginTop: 2 }}>
                {record.projectName && <span>Project: {record.projectName}</span>}
              </div>
            </div>
          </Space>
        );
      }
    },
    {
      title: "Progress",
      key: "progress",
      render: (_: any, record: Milestone) => (
        <div style={{ width: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-slate-600)", fontWeight: 500 }}>
            <span>{record.itemsDone}/{record.itemsTotal} items</span>
            <span>{record.progress}%</span>
          </div>
          <div style={{ height: 5, background: c.surfaceMuted, border: `1px solid ${c.border}`, borderRadius: 999, overflow: "hidden", marginTop: 4 }}>
            <div style={{ width: `${record.progress}%`, height: "100%", background: record.status === "completed" ? "linear-gradient(90deg, #10b981, #14b8a6)" : "linear-gradient(90deg, #8b5cf6, #6366f1)" }} />
          </div>
        </div>
      )
    },
    {
      title: "Timeline",
      key: "timeline",
      render: (_: any, record: Milestone) => {
        const overdue =
          record.estEndDate &&
          record.status !== "completed" &&
          record.status !== "cancelled" &&
          dayjs(record.estEndDate).isBefore(dayjs(), "day");
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12, color: "var(--text-slate-600)" }}>
            <span>{fmtDate(record.estStartDate)} → {fmtDate(record.estEndDate)}</span>
            {record.actualEndDate && (
              <span style={{ color: tones.success.text, fontWeight: 500 }}>
                Delivered {fmtDate(record.actualEndDate)}
              </span>
            )}
            {overdue && <span style={{ color: tones.danger.text, fontWeight: 600 }}>Overdue</span>}
          </div>
        );
      }
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-slate-700)" }}>{dayjs(date).format("MMM D, YYYY")}</span>
            <span style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>{dayjs(date).format("h:mm A")}</span>
          </div>
        ) : <span style={{ color: "var(--text-slate-400)" }}>—</span>,
    },
    {
      title: "Created By",
      key: "createdBy",
      render: (_: any, record: Milestone) => {
        const name = record.createdByName;
        if (!name) return <span style={{ color: "var(--text-slate-400)" }}>—</span>;
        return (
          <div className="pp-creator" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Avatar size={20} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 9, fontWeight: 700 }}>
              {(name[0] || "").toUpperCase()}
            </Avatar>
            <span className="pp-creator-name" style={{ fontSize: "11.5px", color: "var(--text-slate-700)", whiteSpace: "nowrap" }}>{name}</span>
          </div>
        );
      },
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) =>
        date ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-slate-700)" }}>{dayjs(date).format("MMM D, YYYY")}</span>
            <span style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>{dayjs(date).format("h:mm A")}</span>
          </div>
        ) : <span style={{ color: "var(--text-slate-400)" }}>—</span>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 72,
      fixed: "right" as const,
      render: (_: any, record: Milestone) => (
        <Dropdown
          menu={milestoneActionMenu(record)}
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

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}

      {/* Header */}
      <div className="cd-tab-sticky-head">
      <div className="milestones-header-wrap" style={{ margin: "0 -32px" }}>
          <TimeTrackingHeader
            icon={<Flag size={20} color="#3b82f6" />}
            title="Delivery tracker"
            description="Milestones the client should know about, with a breakdown of the work behind each one."
            extra={
              <Button
                type="primary"
                icon={<Plus size={15} />}
                onClick={() => {
                  setEditing(null);
                  setCreateOpen(true);
                }}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  borderColor: "transparent",
                  borderRadius: "8px",
                  height: "36px",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Add milestone
              </Button>
            }
            style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)" }}
          />
        </div>
  
        {/* Summary strip */}
        {items.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginTop: 20,
              marginBottom: 16,
            }}
          >
            <SummaryStat
              c={c}
              tone={tones.accent}
              icon={Flag}
              label="Milestones"
              value={String(counts.total)}
            />
            <SummaryStat
              c={c}
              tone={tones.warning}
              icon={Clock}
              label="In progress"
              value={String(counts.inProgress)}
            />
            <SummaryStat
              c={c}
              tone={tones.success}
              icon={CheckCircle2}
              label="Completed"
              value={String(counts.completed)}
            />
            <SummaryStat
              c={c}
              tone={tones.purple}
              icon={ListChecks}
              label="Items done"
              value={`${counts.itemsDone} / ${counts.itemsTotal}`}
            />
          </div>
        )}
  
        {/* Filters & Toggles */}
        <div style={{ margin: "12px 0 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", flex: 1, minWidth: 0 }}>
            <Input
              placeholder="Search by milestone or project..."
              prefix={<Search size={15} style={{ color: "var(--text-slate-400)", marginRight: 8 }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="contacts-search-input"
              style={{ width: "320px" }}
              allowClear
            />
  
            <SearchableDropdown
              placeholder="Status"
              searchPlaceholder="Search statuses"
              itemNoun="statuses"
              value={selectedStatus === "all" ? undefined : selectedStatus}
              onChange={(v) => setSelectedStatus(v ?? "all")}
              options={Object.keys(STATUS_META).map((key) => ({
                value: key,
                label: STATUS_META[key as MilestoneStatus].label,
              }))}
              width={180}
              className="contacts-filter-select-sd"
            />
  
            <SearchableDropdown
              placeholder="Project"
              searchPlaceholder="Search projects"
              itemNoun="projects"
              value={selectedProject === "all" ? undefined : selectedProject}
              onChange={(v) => setSelectedProject(v ?? "all")}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              width={220}
              disabled={projects.length === 0}
              className="contacts-filter-select-sd"
            />
          </div>
  
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="ptab-segmented">
              <button
                type="button"
                className={viewMode === "grid" ? "is-active" : ""}
                onClick={() => setViewMode("grid")}
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
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
  
        <div className="ptab-divider" />
      </div>

      <div>
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
        ) : filteredItems.length === 0 ? (
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
                background: c.purpleBg,
                color: c.purpleText,
                border: `1px solid ${c.purpleBorder}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Flag size={22} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
              No milestones found
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: c.textSubtle,
                maxWidth: 460,
                margin: "6px auto 0",
              }}
            >
              {searchTerm || selectedProject !== "all" || selectedStatus !== "all"
                ? "No milestones match your search criteria. Try modifying your filters."
                : "Lay out the delivery plan as milestones — Landing page, Auth, Payments — with a breakdown of the work behind each one."}
            </div>
            {(!searchTerm && selectedProject === "all" && selectedStatus === "all") && (
              <div style={{ marginTop: 18 }}>
                <Button
                  type="primary"
                  icon={<Plus size={15} />}
                  onClick={() => {
                    setEditing(null);
                    setCreateOpen(true);
                  }}
                >
                  Create first milestone
                </Button>
              </div>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="pp-table-wrap">
            <Table
              dataSource={filteredItems}
              columns={columns}
              rowKey="id"
              pagination={false}
              className="pp-table"
              scroll={{ x: "max-content" }}
              onRow={(record) => ({
                onClick: () => setViewingMilestoneId(record.id),
                style: { cursor: "pointer" },
              })}
            />
          </div>
        ) : (
          <div className="pp-grid">
            {filteredItems.map((m) => (
              <MilestoneCard
                key={m.id}
                milestone={m}
                c={c}
                tones={tones}
                onEdit={() => {
                  setEditing(m);
                  setCreateOpen(true);
                }}
                onRemove={() => remove(m)}
                milestoneActionMenu={milestoneActionMenu}
                onViewDetails={() => setViewingMilestoneId(m.id)}
              />
            ))}
          </div>
        )}
      </div>

      <MilestoneModal
        open={createOpen}
        editing={editing}
        clientId={clientId}
        projects={projects}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreateOpen(false);
          setEditing(null);
          load();
        }}
        c={c}
        messageApi={messageApi}
      />

      <MilestoneDetailDrawer
        milestone={viewingMilestone}
        open={!!viewingMilestone}
        onClose={() => setViewingMilestoneId(null)}
        c={c}
        tones={tones}
        onChanged={load}
        messageApi={messageApi}
      />

      {/* Premium adaptive styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Full bleed header styling flush with vertical sidebar border */
        .milestones-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .milestones-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .milestones-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .milestones-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        .contacts-search-input.ant-input-affix-wrapper {
          height: 32px !important;
          border-radius: 8px !important;
          background: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          box-shadow: none !important;
          transition: all 0.2s ease !important;
          padding: 4px 12px !important;
        }
        .contacts-search-input.ant-input-affix-wrapper:hover {
          border-color: var(--border-slate-200) !important;
        }
        .contacts-search-input.ant-input-affix-wrapper:focus-within {
          border-color: #8b5cf6 !important;
          background: var(--bg-pure-white) !important;
          box-shadow: none !important;
        }
        .contacts-search-input .ant-input {
          background: transparent !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: var(--text-slate-800) !important;
        }
        [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper:focus-within {
          background: var(--bg-slate-900) !important;
          border-color: #8b5cf6 !important;
        }

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
        .contacts-filter-select-sd.sd-trigger.is-active {
          border-color: #8b5cf6 !important;
          background: var(--bg-pure-white) !important;
        }
        .contacts-filter-select-sd.sd-trigger.is-open {
          border-color: #8b5cf6 !important;
          background: var(--bg-pure-white) !important;
        }
        [data-theme="dark"] .contacts-filter-select-sd.sd-trigger {
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
          border-color: var(--border-slate-200);
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
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
      `}} />
    </div>
  );
}

/* --------------------------------------------------------------- */

function SummaryStat({
  c,
  tone,
  icon: Icon,
  label,
  value,
}: {
  c: ReturnType<typeof palette>;
  tone: { bg: string; border: string; text: string };
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: 14,
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 0,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 0,
          background: tone.bg,
          color: tone.text,
          border: `1px solid ${tone.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={17} />
      </div>
      <div>
        <div
          style={{
            fontSize: 10.5,
            color: c.textSubtle,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 17,
            fontWeight: 700,
            color: c.text,
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function MilestoneCard({
  milestone,
  c,
  tones,
  onEdit,
  onRemove,
  milestoneActionMenu,
  onViewDetails,
}: {
  milestone: Milestone;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onEdit: () => void;
  onRemove: () => void;
  milestoneActionMenu: any;
  onViewDetails: () => void;
}) {
  const statusMeta = STATUS_META[milestone.status] || STATUS_META.not_started;

  const overdue =
    milestone.estEndDate &&
    milestone.status !== "completed" &&
    milestone.status !== "cancelled" &&
    dayjs(milestone.estEndDate).isBefore(dayjs(), "day");

  return (
    <div
      className="pc-card"
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 0,
        overflow: "hidden",
      }}
    >
      {/* Top row */}
      <div
        className="pc-top"
        style={{
          cursor: "pointer",
          alignItems: "center",
        }}
        onClick={onViewDetails}
      >
        <div
          className="pc-avatar"
          style={{
            background: c.purpleBg,
            border: `1px solid ${c.purpleBorder}`,
            color: c.purpleText,
          }}
        >
          <Flag size={14} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="pc-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", fontWeight: 700 }} title={milestone.name}>
            {milestone.name}
          </div>
          <div className="pc-client-line" style={{ marginTop: 2, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span className="pc-client-key">Project:</span>
            <span className="pc-client-val" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {milestone.projectName || "No Project"}
            </span>
            <span
              className="pc-status-tag"
              style={{
                color: tones[statusMeta.tone].text,
                background: tones[statusMeta.tone].bg,
                border: `1px solid ${tones[statusMeta.tone].border}`,
                height: "18px",
                padding: "0 6px",
                fontSize: "9.5px",
                fontWeight: 700,
                borderRadius: "4px",
                lineHeight: "16px",
              }}
            >
              {statusMeta.label.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
          <Dropdown
            menu={milestoneActionMenu(milestone)}
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
        {/* Foot Row 1 (User's 2rd row): Created, Created By, Updated */}
        <div className="pc-foot-row">
          <span className="pc-foot-item">
            <span className="pc-foot-key">Created:</span>
            <span className="pc-foot-val">{milestone.createdAt ? dayjs(milestone.createdAt).format("MMM D, YYYY · h:mm A") : "—"}</span>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Created by:</span>
            {milestone.createdByName ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Avatar size={16} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 8, fontWeight: 700 }}>
                  {(milestone.createdByName[0] || "").toUpperCase()}
                </Avatar>
                <span className="pc-foot-val">
                  {milestone.createdByName.trim().split(/\s+/)[0]}
                </span>
              </span>
            ) : (
              <span className="pc-foot-val">—</span>
            )}
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Updated:</span>
            <span className="pc-foot-val">{milestone.updatedAt ? dayjs(milestone.updatedAt).format("MMM D, YYYY · h:mm A") : "—"}</span>
          </span>
        </div>

        {/* Foot Row 2 (User's 3rd row): Progress, Dates, Items count */}
        <div className="pc-foot-row">
          <span className="pc-foot-item" style={{ flex: 1, minWidth: 100 }}>
            <span className="pc-foot-key">Progress:</span>
            <span style={{ fontWeight: 600 }}>{milestone.progress}%</span>
            <div style={{ height: 4, background: c.border, borderRadius: 2, flex: 1, overflow: "hidden", marginLeft: 6 }}>
              <div style={{ width: `${milestone.progress}%`, height: "100%", background: milestone.status === "completed" ? "#10b981" : "#8b5cf6" }} />
            </div>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Items:</span>
            <span style={{ fontWeight: 600 }}>{milestone.itemsDone}/{milestone.itemsTotal}</span>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Dates:</span>
            <span className="pc-foot-val" style={{ fontSize: "11px" }}>
              {fmtDate(milestone.estStartDate)} → {fmtDate(milestone.estEndDate)}
            </span>
          </span>
          {overdue && (
            <>
              <span className="pc-foot-div" />
              <span className="pc-status-tag" style={{ color: tones.danger.text, background: tones.danger.bg, border: `1px solid ${tones.danger.border}`, padding: "1px 6px", height: "auto", fontSize: "9.5px" }}>
                OVERDUE
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MilestoneDetailDrawer({
  milestone,
  open,
  onClose,
  c,
  tones,
  onChanged,
  messageApi,
}: {
  milestone: Milestone | null;
  open: boolean;
  onClose: () => void;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onChanged: () => void;
  messageApi: any;
}) {
  const [adding, setAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  if (!milestone) return null;

  const toggleItem = async (it: MilestoneItem) => {
    try {
      await milestoneService.updateItem(it.id, { isCompleted: !it.isCompleted });
      onChanged();
    } catch (err: any) {
      messageApi.error(`Update failed: ${err?.message || ""}`);
    }
  };

  const removeItem = async (it: MilestoneItem) => {
    try {
      await milestoneService.removeItem(it.id);
      onChanged();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message || ""}`);
    }
  };

  const addItem = async () => {
    const name = newItemName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await milestoneService.addItem(milestone.id, { name });
      setNewItemName("");
      onChanged();
    } catch (err: any) {
      messageApi.error(`Add failed: ${err?.message || ""}`);
    } finally {
      setAdding(false);
    }
  };

  const statusMeta = STATUS_META[milestone.status] || STATUS_META.not_started;
  const overdue =
    milestone.estEndDate &&
    milestone.status !== "completed" &&
    milestone.status !== "cancelled" &&
    dayjs(milestone.estEndDate).isBefore(dayjs(), "day");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={640}
      title={null}
      closable={false}
      styles={{
        mask: { backgroundColor: c.overlay },
        content: { background: c.surfaceElevated },
        header: { display: "none" },
        body: {
          padding: 0,
          background: c.surfaceElevated,
        },
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 22px 12px",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: c.purpleBg,
            border: `1px solid ${c.purpleBorder}`,
            color: c.purpleText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Flag size={16} />
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
              className="pc-status-tag"
              style={{
                color: tones[statusMeta.tone].text,
                background: tones[statusMeta.tone].bg,
                border: `1px solid ${tones[statusMeta.tone].border}`,
                height: "18px",
                padding: "0 6px",
                fontSize: "9.5px",
                fontWeight: 700,
                borderRadius: "4px",
                lineHeight: "16px",
              }}
            >
              {statusMeta.label.toUpperCase()}
            </span>
            {overdue && (
              <span
                className="pc-status-tag"
                style={{
                  color: tones.danger.text,
                  background: tones.danger.bg,
                  border: `1px solid ${tones.danger.border}`,
                  height: "18px",
                  padding: "0 6px",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  borderRadius: "4px",
                  lineHeight: "16px",
                }}
              >
                OVERDUE
              </span>
            )}
          </div>
          <h2
            style={{
              margin: "6px 0 0",
              fontSize: 16,
              fontWeight: 600,
              color: c.text,
              letterSpacing: "-0.01em",
            }}
          >
            {milestone.name}
          </h2>
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: c.textSubtle,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {milestone.projectName && <span>📁 {milestone.projectName}</span>}
            <span>
              {fmtDate(milestone.estStartDate)} → {fmtDate(milestone.estEndDate)}
            </span>
          </div>
        </div>
        <Button
          type="text"
          onClick={onClose}
          icon={<X size={16} color={c.textSubtle} />}
          style={{ marginTop: -4 }}
          aria-label="Close"
        />
      </div>

      {/* Body */}
      <div
        style={{
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Progress Card */}
        <div
          style={{
            background: c.surfaceMuted,
            border: `1px solid ${c.border}`,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: c.text, fontWeight: 600 }}>
            <span>Milestone Progress</span>
            <span>{milestone.itemsDone}/{milestone.itemsTotal} items ({milestone.progress}%)</span>
          </div>
          <div style={{ height: 6, background: c.border, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${milestone.progress}%`, height: "100%", background: milestone.status === "completed" ? "#10b981" : "#8b5cf6" }} />
          </div>
        </div>

        {/* Info Grid */}
        <div
          style={{
            background: c.surfaceMuted,
            border: `1px solid ${c.border}`,
            borderRadius: 0,
            padding: "12px 16px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Created By
            </div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Avatar size={20} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 9, fontWeight: 700 }}>
                {((milestone.createdByName || "?")[0] || "").toUpperCase()}
              </Avatar>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: c.text }}>
                {milestone.createdByName || "—"}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Created At
            </div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: c.text }}>
              {milestone.createdAt ? dayjs(milestone.createdAt).format("MMM D, YYYY · h:mm A") : "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Last Updated
            </div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: c.text }}>
              {milestone.updatedAt ? dayjs(milestone.updatedAt).format("MMM D, YYYY · h:mm A") : "—"}
            </div>
          </div>
          {milestone.actualEndDate && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Actual End Date
              </div>
              <div style={{ marginTop: 4, fontSize: 12.5, color: tones.success.text, fontWeight: 600 }}>
                {fmtDate(milestone.actualEndDate)}
              </div>
            </div>
          )}
        </div>

        {/* Description Section */}
        {milestone.description && (
          <div
            style={{
              background: c.surfaceElevated,
              border: `1px solid ${c.border}`,
              borderRadius: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                background: c.surfaceMuted,
                borderBottom: `1px solid ${c.border}`,
                fontSize: 11,
                fontWeight: 600,
                color: c.textSubtle,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Description
            </div>
            <div style={{ padding: "12px 14px", fontSize: 13, color: c.textMuted, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {milestone.description}
            </div>
          </div>
        )}

        {/* Breakdown Items Section */}
        <div
          style={{
            background: c.surfaceElevated,
            border: `1px solid ${c.border}`,
            borderRadius: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
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
            <ListChecks size={12} />
            Breakdown Items · {milestone.items.length}
          </div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Add breakdown item…"
                onPressEnter={addItem}
                size="middle"
              />
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={addItem}
                loading={adding}
                disabled={!newItemName.trim()}
              >
                Add
              </Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {milestone.items.length === 0 && (
                <div style={{ fontSize: 12.5, color: c.textSubtle, fontStyle: "italic", padding: "6px 0" }}>
                  No breakdown items yet. Add the work above.
                </div>
              )}
              {milestone.items.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  c={c}
                  tones={tones}
                  onToggle={() => toggleItem(it)}
                  onRemove={() => removeItem(it)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

/* --------------------------------------------------------------- */

function ItemRow({
  item,
  c,
  tones,
  onToggle,
  onRemove,
}: {
  item: MilestoneItem;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        background: item.isCompleted ? tones.success.bg : c.surfaceMuted,
        border: `1px solid ${item.isCompleted ? tones.success.border : c.border}`,
        borderRadius: 8,
        transition: "all 120ms ease",
      }}
    >
      <button
        onClick={onToggle}
        type="button"
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: item.isCompleted ? tones.success.text : c.surfaceElevated,
          border: `1px solid ${item.isCompleted ? tones.success.text : c.borderStrong}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#ffffff",
          padding: 0,
          flexShrink: 0,
        }}
        aria-label={item.isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {item.isCompleted && <CheckSquare size={14} />}
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            color: c.text,
            textDecoration: item.isCompleted ? "line-through" : "none",
            opacity: item.isCompleted ? 0.7 : 1,
          }}
        >
          {item.name}
        </div>
        {item.description && (
          <div
            style={{
              marginTop: 2,
              fontSize: 11.5,
              color: c.textSubtle,
            }}
          >
            {item.description}
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        type="button"
        style={{
          width: 24,
          height: 24,
          borderRadius: 5,
          background: "transparent",
          border: "none",
          color: c.textFaint,
          cursor: "pointer",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Remove item"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- */

function MilestoneModal({
  open,
  editing,
  clientId,
  projects,
  onClose,
  onSaved,
  c,
  messageApi,
}: {
  open: boolean;
  editing: Milestone | null;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  onClose: () => void;
  onSaved: () => void;
  c: ReturnType<typeof palette>;
  messageApi: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [itemDrafts, setItemDrafts] = useState<{ name: string }[]>([]);
  const [draftInput, setDraftInput] = useState("");

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setItemDrafts([]);
      setDraftInput("");
      return;
    }
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        description: editing.description || undefined,
        status: editing.status,
        projectId: editing.projectId || undefined,
        estStartDate: editing.estStartDate ? dayjs(editing.estStartDate) : null,
        estEndDate: editing.estEndDate ? dayjs(editing.estEndDate) : null,
        actualEndDate: editing.actualEndDate ? dayjs(editing.actualEndDate) : null,
      });
    } else {
      form.setFieldsValue({ status: "not_started" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const addDraft = () => {
    const v = draftInput.trim();
    if (!v) return;
    setItemDrafts((arr) => [...arr, { name: v }]);
    setDraftInput("");
  };

  const submit = async (v: any) => {
    setSubmitting(true);
    try {
      const payload: CreateMilestonePayload = {
        name: v.name.trim(),
        description: v.description?.trim() || undefined,
        status: v.status,
        projectId: v.projectId || undefined,
        estStartDate: v.estStartDate ? v.estStartDate.format("YYYY-MM-DD") : null,
        estEndDate: v.estEndDate ? v.estEndDate.format("YYYY-MM-DD") : null,
        actualEndDate: v.actualEndDate ? v.actualEndDate.format("YYYY-MM-DD") : null,
      };
      if (editing) {
        await milestoneService.update(editing.id, payload);
        messageApi.success("Milestone updated");
      } else {
        await milestoneService.create(clientId, {
          ...payload,
          items: itemDrafts.length > 0 ? itemDrafts : undefined,
        });
        messageApi.success("Milestone created");
      }
      onSaved();
    } catch (err: any) {
      messageApi.error(`Save failed: ${err?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PremiumModal
      open={open}
      onClose={onClose}
      width={720}
      c={c}
      ribbonColor={c.accentText}
      iconTile={{ bg: c.accentBg, border: c.accentBorder, text: c.accentText }}
      icon={<Flag size={20} />}
      title={editing ? "Edit milestone" : "Add milestone"}
      subtitle={
        editing
          ? "Update the milestone details. Manage breakdown items inline on the card."
          : "Define a delivery checkpoint. Optionally seed it with a breakdown of the work."
      }
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to save">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            onClick={() => form.submit()}
            icon={<Plus size={14} />}
          >
            {editing ? "Save changes" : "Create milestone"}
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="What ships"
          description="A short name and what's being delivered. Visible in the client portal."
          icon={<Flag size={11} />}
          plain
        >
          <Form.Item
            name="name"
            label={<L c={c}>Milestone name</L>}
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="e.g. Landing page, Auth, Payments" maxLength={200} />
          </Form.Item>
          <Form.Item
            name="description"
            label={<L c={c}>Description</L>}
            style={{ marginBottom: 16 }}
          >
            <Input.TextArea
              rows={3}
              placeholder="What the client gets when this lands…"
              maxLength={1000}
              showCount
              style={{ padding: "10px 12px" }}
            />
          </Form.Item>
        </ModalSection>

        <ModalSection
          c={c}
          title="Status & dates"
          description="Status is auto-managed by the breakdown items, but you can override."
          icon={<Calendar size={11} />}
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
              name="status"
              label={<L c={c}>Status</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={(Object.keys(STATUS_META) as MilestoneStatus[]).map(
                  (k) => ({ value: k, label: STATUS_META[k].label }),
                )}
              />
            </Form.Item>
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
                placeholder="—"
                disabled={projects.length === 0}
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.code ? `${p.name} · ${p.code}` : p.name,
                }))}
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
              name="estStartDate"
              label={<L c={c}>EST start</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="estEndDate"
              label={<L c={c}>EST end</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="actualEndDate"
              label={<L c={c}>Actual end</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </ModalSection>

        {!editing && (
          <ModalSection
            c={c}
            title="Breakdown items"
            description="Optional starter list — e.g. Frontend, Backend, Integration, Wire-up."
            icon={<ListChecks size={11} />}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: itemDrafts.length > 0 ? 10 : 0,
              }}
            >
              <Input
                value={draftInput}
                onChange={(e) => setDraftInput(e.target.value)}
                placeholder="e.g. Frontend"
                onPressEnter={(e) => {
                  e.preventDefault();
                  addDraft();
                }}
              />
              <Button onClick={addDraft} icon={<Plus size={13} />} disabled={!draftInput.trim()}>
                Add
              </Button>
            </div>
            {itemDrafts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {itemDrafts.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      background: c.surfaceMuted,
                      border: `1px solid ${c.border}`,
                      borderRadius: 8,
                    }}
                  >
                    <Circle size={13} color={c.textFaint} />
                    <span style={{ flex: 1, fontSize: 13, color: c.text }}>
                      {it.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setItemDrafts((arr) => arr.filter((_, i) => i !== idx))
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        color: c.textFaint,
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ModalSection>
        )}
      </Form>
    </PremiumModal>
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
