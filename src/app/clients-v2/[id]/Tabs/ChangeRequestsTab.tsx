"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  message,
  Tooltip,
  Tag,
  Popconfirm,
  Table,
  Segmented,
  Dropdown,
  Space,
  Row,
  Col,
  Avatar,
} from "antd";
import {
  Plus,
  GitPullRequest,
  ChevronRight,
  Send,
  Hash,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Activity,
  AlertTriangle,
  Receipt,
  Layers,
  Pencil,
  Trash2,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import { crService, CrListItem, CrDetail, CrStatus } from "@/services/crService";
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
    surface: dark ? "#0B0F1A" : "#ffffff",
    surfaceElevated: dark ? "#131B2D" : "#ffffff",
    surfaceMuted: dark ? "#0F1626" : "#f8fafc",
    border: dark ? "#1E293B" : "#e5e7eb",
    borderStrong: dark ? "#273449" : "#d1d5db",
    text: dark ? "#F1F5F9" : "#0f172a",
    textMuted: dark ? "#CBD5E1" : "#475569",
    textSubtle: dark ? "#94A3B8" : "#64748b",
    textFaint: dark ? "#64748B" : "#94a3b8",
    accent: "#3b82f6",
    accentBg: dark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    accentBorder: dark ? "rgba(59,130,246,0.35)" : "#bfdbfe",
    accentText: dark ? "#93c5fd" : "#1d4ed8",
    success: dark ? "#34d399" : "#059669",
    successBg: dark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    successBorder: dark ? "rgba(16,185,129,0.35)" : "#a7f3d0",
    successText: dark ? "#6ee7b7" : "#047857",
    warning: dark ? "#fbbf24" : "#d97706",
    warningBg: dark ? "rgba(245,158,11,0.12)" : "#fffbeb",
    warningBorder: dark ? "rgba(245,158,11,0.35)" : "#fde68a",
    warningText: dark ? "#fcd34d" : "#92400e",
    danger: dark ? "#f87171" : "#dc2626",
    dangerBg: dark ? "rgba(239,68,68,0.12)" : "#fef2f2",
    dangerBorder: dark ? "rgba(239,68,68,0.35)" : "#fecaca",
    dangerText: dark ? "#fca5a5" : "#b91c1c",
    purpleBg: dark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
    purpleBorder: dark ? "rgba(139,92,246,0.35)" : "#ddd6fe",
    purpleText: dark ? "#c4b5fd" : "#6d28d9",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.45)",
  };
};

const STATUS_META: Record<
  string,
  { label: string; tone: keyof ReturnType<typeof toneMap>; icon: any }
> = {
  draft: { label: "Draft", tone: "neutral", icon: Layers },
  submitted: { label: "Submitted", tone: "accent", icon: Clock },
  under_review: { label: "Under review", tone: "purple", icon: Activity },
  estimated: { label: "Estimated", tone: "warning", icon: DollarSign },
  approved: { label: "Approved", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", tone: "danger", icon: XCircle },
  scheduled: { label: "Scheduled", tone: "accent", icon: Calendar },
  in_progress: { label: "In progress", tone: "accent", icon: Activity },
  delivered: { label: "Delivered", tone: "success", icon: CheckCircle2 },
  closed: { label: "Closed", tone: "neutral", icon: XCircle },
  cancelled: { label: "Cancelled", tone: "neutral", icon: XCircle },
};
const PRIORITY_META: Record<
  string,
  { label: string; tone: keyof ReturnType<typeof toneMap> }
> = {
  critical: { label: "Critical", tone: "danger" },
  high: { label: "High", tone: "warning" },
  medium: { label: "Medium", tone: "accent" },
  low: { label: "Low", tone: "neutral" },
};

function toneMap(c: ReturnType<typeof palette>) {
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

function fmtCurrency(value: any, currency?: string | null) {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency || ""} ${n.toFixed(2)}`.trim();
  }
}

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
}

export default function ChangeRequestsTab({ clientId, projects = [] }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => toneMap(c), [c]);
  const { canUpdateClient, canDeleteClient } = usePermission();

  const [items, setItems] = useState<CrListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCr, setEditingCr] = useState<CrDetail | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await crService.listForClient(clientId));
    } catch (err: any) {
      messageApi.error(`Failed to load change requests: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (id: string) => {
    setEditingId(id);
    setFetchingDetail(true);
    try {
      const detail = await crService.detail(id);
      setEditingCr(detail);
    } catch (err: any) {
      messageApi.error(`Failed to load details: ${err?.message}`);
      setEditingId(null);
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleDeleteRow = async (id: string) => {
    try {
      await crService.delete(id);
      messageApi.success("Change request deleted");
      load();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message}`);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const crActionMenu = (cr: any) => ({
    className: "pp-action-pop",
    items: [
      {
        key: "edit",
        disabled: !canUpdateClient,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}><Pencil size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">Edit</span>
              <span className="pp-menu-desc">Modify details</span>
            </span>
          </div>
        )
      },
      {
        key: "delete",
        danger: true,
        disabled: !canDeleteClient,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}><Trash2 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title" style={{ color: "#ef4444" }}>Delete</span>
              <span className="pp-menu-desc">Remove change request</span>
            </span>
          </div>
        )
      }
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent?.stopPropagation();
      if (key === "edit") {
        handleEditClick(cr.id);
      } else if (key === "delete") {
        modal.confirm({
          title: "Delete Change Request",
          content: `Are you sure you want to delete "${cr.subject}"? This action cannot be undone.`,
          okText: "Delete",
          okType: "danger",
          cancelText: "Cancel",
          onOk: () => handleDeleteRow(cr.id),
        });
      }
    }
  });

  const columns = [
    {
      title: "Change Request",
      key: "subject",
      render: (_: any, record: any) => (
        <Space size={12}>
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
            <GitPullRequest size={14} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-slate-900)", fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, minWidth: 0, width: "100%" }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, padding: "1px 5px", background: c.surfaceMuted, border: `1px solid ${c.border}`, borderRadius: "4px", color: c.textMuted, flexShrink: 0 }}>
                {record.crNumber}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "350px", flexShrink: 1, minWidth: 0 }} title={record.subject}>
                {record.subject}
              </span>
              {record.createdByPortalUserId && (
                <Tooltip title="Raised by client from portal">
                  <Tag color="processing" style={{ borderRadius: 6, fontWeight: 500, border: 0, fontSize: 10, margin: 0, flexShrink: 0 }}>CLIENT-RAISED</Tag>
                </Tooltip>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-slate-500)", display: "flex", gap: 8, marginTop: 2 }}>
              {record.projectName && <span>Project: {record.projectName}</span>}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: any) => {
        const st = STATUS_META[record.status] || STATUS_META.submitted;
        const StIcon = st.icon;
        return (
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
        );
      }
    },
    {
      title: "Priority",
      key: "priority",
      render: (_: any, record: any) => {
        const pri = PRIORITY_META[record.priority] || PRIORITY_META.medium;
        return (
          <span
            style={{
              display: "inline-block",
              padding: "2px 9px",
              background: tones[pri.tone].bg,
              border: `1px solid ${tones[pri.tone].border}`,
              color: tones[pri.tone].text,
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 500,
            }}
          >
            {pri.label}
          </span>
        );
      }
    },
    {
      title: "Estimate",
      key: "estimate",
      render: (_: any, record: any) => {
        const estimateText = record.estimatedCost
          ? fmtCurrency(record.estimatedCost, record.estimatedCurrency)
          : record.estimatedHoursMin || record.estimatedHoursMax
            ? `${record.estimatedHoursMin || "?"}–${record.estimatedHoursMax || "?"} h`
            : "—";
        return (
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-slate-700)" }}>
            {estimateText}
          </span>
        );
      }
    },
    {
      title: "Links & Messages",
      key: "links",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {record.linkedSprintVersion && (
            <div style={{ fontSize: 11.5, color: "var(--text-slate-500)" }}>
              Sprint {record.linkedSprintVersion}
            </div>
          )}
          {record.linkedInvoiceNumber && (
            <div style={{ fontSize: 11.5, color: "var(--text-slate-500)", display: "flex", gap: 4, alignItems: "center" }}>
              <Receipt size={11} /> {record.linkedInvoiceNumber}
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
            {record.messageCount} message{record.messageCount !== 1 ? "s" : ""}
          </div>
        </div>
      )
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
      render: (_: any, record: any) => {
        const name = record.createdByPortalName || record.createdByStaffName;
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
      dataIndex: "lastActivityAt",
      key: "lastActivityAt",
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
      render: (_: any, record: any) => (
        <Dropdown
          menu={crActionMenu(record)}
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

  const filteredItems = items.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (item.subject || "").toLowerCase().includes(search) ||
      (item.crNumber || "").toLowerCase().includes(search) ||
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

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}
      {modalContextHolder}

      {/* Header */}
      <div className="cr-header-wrap" style={{ margin: "0 -32px" }}>
        <TimeTrackingHeader
          icon={<GitPullRequest size={20} color="#3b82f6" />}
          title="Change requests"
          description="Track every scope change with impact, time and cost estimates."
          extra={
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => setCreateOpen(true)}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                borderColor: "transparent",
                borderRadius: "8px",
                height: "36px",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              New change request
            </Button>
          }
          style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)" }}
        />
      </div>

      <div style={{ margin: "12px 0 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by CR number, subject or project..."
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
              label: STATUS_META[key].label,
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
            <GitPullRequest size={22} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
            No change requests found
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
              ? "No change requests match your search criteria. Try modifying your filters."
              : "Log a scope change here or wait for the client to raise one from their portal."}
          </div>
          {(!searchTerm && selectedProject === "all" && selectedStatus === "all") && (
            <div style={{ marginTop: 18 }}>
              <Button
                type="primary"
                icon={<Plus size={15} />}
                onClick={() => setCreateOpen(true)}
              >
                Log first change request
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
              onClick: () => setOpenId(record.id),
              style: { cursor: "pointer" }
            })}
          />
        </div>
      ) : (
        <div className="pp-grid">
          {filteredItems.map((cr) => {
            const st = STATUS_META[cr.status] || STATUS_META.submitted;
            const pri = PRIORITY_META[cr.priority] || PRIORITY_META.medium;
            const estimateText = cr.estimatedCost
              ? fmtCurrency(cr.estimatedCost, cr.estimatedCurrency)
              : cr.estimatedHoursMin || cr.estimatedHoursMax
                ? `${cr.estimatedHoursMin || "?"}–${cr.estimatedHoursMax || "?"} h`
                : "—";

            return (
              <div key={cr.id} className="pc-card" onClick={() => setOpenId(cr.id)}>
                <div className="pc-top">
                  <div className="pc-avatar" style={{ background: c.purpleBg, border: `1px solid ${c.purpleBorder}`, color: c.purpleText, borderRadius: "6px" }}>
                    <GitPullRequest size={15} />
                  </div>
                  <div className="pc-identity-body" style={{ minWidth: 0 }}>
                    {/* 1st Row: Subject (truncated with dots) */}
                    <div className="pc-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", fontWeight: 700 }} title={cr.subject}>
                      {cr.subject}
                    </div>
                    {/* 2nd Row: Project, Status, Code, Client Raised */}
                    <div className="pc-client-line" style={{ marginTop: 4, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span className="pc-client-key">Project:</span>
                      <span className="pc-client-val" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cr.projectName || "No Project"}
                      </span>
                      <span
                        className="pc-status-tag"
                        style={{
                          color: tones[st.tone].text,
                          background: tones[st.tone].bg,
                          border: `1px solid ${tones[st.tone].border}`,
                          height: "18px",
                          padding: "0 6px",
                          fontSize: "9.5px",
                          fontWeight: 700,
                          borderRadius: "4px",
                          lineHeight: "16px",
                        }}
                      >
                        {st.label.toUpperCase()}
                      </span>
                      <span style={{ color: "var(--text-slate-300)" }}>·</span>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", padding: "1px 5px", background: c.surfaceMuted, border: `1px solid ${c.border}`, borderRadius: "4px", color: c.textMuted }}>
                        {cr.crNumber}
                      </span>
                      {cr.createdByPortalUserId && (
                        <>
                          <span style={{ color: "var(--text-slate-300)" }}>·</span>
                          <Tooltip title="Raised by client from portal">
                            <span className="pc-status-tag" style={{ color: c.accentText, background: c.accentBg, padding: "1px 6px", fontSize: "10px", height: "auto" }}>
                              CLIENT-RAISED
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                  <Dropdown
                    menu={crActionMenu(cr)}
                    overlayClassName="pp-action-pop"
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal size={14} />
                    </button>
                  </Dropdown>
                </div>

                <div className="pc-foot">
                  {/* Foot Row 1 (User's 2rd row): Created, Created By, Updated */}
                  <div className="pc-foot-row">
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Created:</span>
                      <span className="pc-foot-val">{cr.createdAt ? dayjs(cr.createdAt).format("MMM D, YYYY · h:mm A") : "—"}</span>
                    </span>
                    <span className="pc-foot-div" />
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Created by:</span>
                      {(() => {
                        const name = cr.createdByPortalName || cr.createdByStaffName;
                        if (!name) return <span className="pc-foot-val">—</span>;
                        return (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Avatar size={16} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 8, fontWeight: 700 }}>
                              {(name[0] || "").toUpperCase()}
                            </Avatar>
                            <span className="pc-foot-val">
                              {name.trim().split(/\s+/)[0]}
                            </span>
                          </span>
                        );
                      })()}
                    </span>
                    <span className="pc-foot-div" />
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Updated:</span>
                      <span className="pc-foot-val">{cr.lastActivityAt ? dayjs(cr.lastActivityAt).format("MMM D, YYYY · h:mm A") : "—"}</span>
                    </span>
                  </div>

                  {/* Foot Row 2 (User's 3rd row): Rest of them (Priority, Estimate, Sprint, Invoice, Messages) */}
                  <div className="pc-foot-row">
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Priority:</span>
                      <span
                        className="pc-status-tag"
                        style={{
                          color: tones[pri.tone].text,
                          background: tones[pri.tone].bg,
                          border: `1px solid ${tones[pri.tone].border}`,
                        }}
                      >
                        {pri.label.toUpperCase()}
                      </span>
                    </span>
                    <span className="pc-foot-div" />
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Estimate:</span>
                      <span style={{ fontWeight: 600 }}>{estimateText}</span>
                    </span>
                    {cr.linkedSprintVersion && (
                      <>
                        <span className="pc-foot-div" />
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Sprint:</span>
                          <span className="pc-foot-val">{cr.linkedSprintVersion}</span>
                        </span>
                      </>
                    )}
                    {cr.linkedInvoiceNumber && (
                      <>
                        <span className="pc-foot-div" />
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Invoice:</span>
                          <span className="pc-foot-val">{cr.linkedInvoiceNumber}</span>
                        </span>
                      </>
                    )}
                    <span className="pc-foot-div" />
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Messages:</span>
                      <span className="pc-foot-val">{cr.messageCount}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      <CreateCrModal
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
      <CrDetailDrawer
        id={openId}
        c={c}
        tones={tones}
        messageApi={messageApi}
        onClose={() => setOpenId(null)}
        onMutated={load}
      />
      {editingCr && (
        <EditCrModal
          open={!!editingId}
          onClose={() => {
            setEditingId(null);
            setEditingCr(null);
          }}
          onUpdated={() => {
            setEditingId(null);
            setEditingCr(null);
            load();
          }}
          cr={editingCr}
          projects={projects}
          c={c}
          messageApi={messageApi}
        />
      )}


      {/* Premium adaptive header styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Full bleed header styling flush with vertical sidebar border */
        .cr-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .cr-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .cr-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .cr-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        html body .cr-header-wrap .ptab-primary-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25) !important;
        }
        .premium-modal .ant-modal-header {
          background: transparent !important;
          border-bottom: none !important;
          padding: 20px 24px 0 !important;
        }
        .premium-table .ant-table {
          background: transparent !important;
          color: var(--text-slate-700) !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-400) !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          padding: 6px 10px !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          white-space: nowrap !important;
        }
        .premium-table .ant-table-thead > tr > th::before { display: none !important; }
        .premium-table .ant-table-tbody > tr > td {
          padding: 6.5px 10px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        .premium-table .ant-table-placeholder > td {
          background: transparent !important;
        }
        .premium-action-btn:hover {
          background: var(--bg-slate-50) !important;
          color: #8b5cf6 !important;
        }
        .ant-form-item-label {
            padding-bottom: 6px !important;
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
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
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
        [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper:hover {
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper:focus-within {
          background: var(--bg-slate-900) !important;
          border-color: #8b5cf6 !important;
        }

        .contacts-filter-select.ant-select {
          height: 32px !important;
          border-radius: 8px !important;
        }
        .contacts-filter-select.ant-select .ant-select-selector {
          border-radius: 8px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          background: var(--bg-slate-50) !important;
          background-color: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          box-shadow: none !important;
          transition: all 0.2s ease !important;
          padding: 0 12px !important;
        }
        .contacts-filter-select.ant-select:hover .ant-select-selector {
          border-color: var(--border-slate-200) !important;
          background-color: var(--bg-slate-50) !important;
        }
        .contacts-filter-select.ant-select.ant-select-focused .ant-select-selector {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
          background: var(--bg-pure-white) !important;
          background-color: var(--bg-pure-white) !important;
        }
        .contacts-filter-select.ant-select .ant-select-selection-item,
        .contacts-filter-select.ant-select .ant-select-selection-placeholder {
          font-size: 13px !important;
          font-weight: 500 !important;
          color: var(--text-slate-800) !important;
          line-height: 30px !important;
        }
        [data-theme="dark"] .contacts-filter-select.ant-select .ant-select-arrow {
          color: var(--text-slate-400) !important;
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

        /* Proposal Style Cards Grid */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .ptab-empty-wrapper { grid-column: 1 / -1; }
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
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 9px; font-weight: 600; color: var(--text-slate-400); text-transform: uppercase; letter-spacing: 0.02em; }
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

        /* Input Fields Inside Modals (Add and Edit Modal) */
        .pmodal-body .ant-input-affix-wrapper,
        .pmodal-body .ant-select-selector,
        .pmodal-body .ant-input-number,
        .premium-modal .ant-input-affix-wrapper,
        .premium-modal .ant-select-selector,
        .premium-modal .ant-input-number {
          border: 1px solid var(--border-slate-200) !important;
        }
        .pmodal-body .ant-input,
        .premium-modal .ant-input {
          border: 1px solid var(--border-slate-200) !important;
        }
        .pmodal-body .ant-input-affix-wrapper .ant-input,
        .pmodal-body .ant-input-affix-wrapper .ant-input:focus,
        .pmodal-body .ant-input-affix-wrapper .ant-input:hover,
        .premium-modal .ant-input-affix-wrapper .ant-input,
        .premium-modal .ant-input-affix-wrapper .ant-input:focus,
        .premium-modal .ant-input-affix-wrapper .ant-input:hover,
        .pmodal-body .ant-input-number .ant-input-number-input,
        .pmodal-body .ant-input-number .ant-input-number-input:focus,
        .pmodal-body .ant-input-number .ant-input-number-input:hover,
        .premium-modal .ant-input-number .ant-input-number-input,
        .premium-modal .ant-input-number .ant-input-number-input:focus,
        .premium-modal .ant-input-number .ant-input-number-input:hover {
          border: 0 !important;
          border-width: 0 !important;
          box-shadow: none !important;
        }

        /* Input Hover state */
        .pmodal-body .ant-input:hover,
        .pmodal-body .ant-input-affix-wrapper:hover,
        .pmodal-body .ant-select:hover .ant-select-selector,
        .pmodal-body .ant-input-number:hover,
        .premium-modal .ant-input:hover,
        .premium-modal .ant-input-affix-wrapper:hover,
        .premium-modal .ant-select:hover .ant-select-selector,
        .premium-modal .ant-input-number:hover {
          border-color: rgba(139, 92, 246, 0.45) !important;
        }

        /* Input Focus state */
        .pmodal-body .ant-input-affix-wrapper-focused,
        .pmodal-body .ant-select-focused .ant-select-selector,
        .pmodal-body .ant-input-number-focused,
        .pmodal-body .ant-input:focus,
        .premium-modal .ant-input-affix-wrapper-focused,
        .premium-modal .ant-select-focused .ant-select-selector,
        .premium-modal .ant-input-number-focused,
        .premium-modal .ant-input:focus,
        .premium-modal .ant-input-affix-wrapper:focus-within {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
          background: var(--bg-pure-white) !important;
        }

        /* Dark theme overrides for inputs */
        [data-theme="dark"] .pmodal-body .ant-input,
        [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper,
        [data-theme="dark"] .pmodal-body .ant-select-selector,
        [data-theme="dark"] .pmodal-body .ant-input-number,
        [data-theme="dark"] .premium-modal .ant-input,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper,
        [data-theme="dark"] .premium-modal .ant-select-selector,
        [data-theme="dark"] .premium-modal .ant-input-number {
          background: var(--bg-primary) !important;
          border-color: var(--border-slate-200) !important;
          color: var(--text-slate-900) !important;
        }
        
        [data-theme="dark"] .pmodal-body .ant-input:hover,
        [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper:hover,
        [data-theme="dark"] .pmodal-body .ant-select:hover .ant-select-selector,
        [data-theme="dark"] .pmodal-body .ant-input-number:hover,
        [data-theme="dark"] .premium-modal .ant-input:hover,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper:hover,
        [data-theme="dark"] .premium-modal .ant-select:hover .ant-select-selector,
        [data-theme="dark"] .premium-modal .ant-input-number:hover {
          border-color: rgba(167, 139, 250, 0.55) !important;
        }

        [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper-focused,
        [data-theme="dark"] .pmodal-body .ant-select-focused .ant-select-selector,
        [data-theme="dark"] .pmodal-body .ant-input-number-focused,
        [data-theme="dark"] .pmodal-body .ant-input:focus,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper-focused,
        [data-theme="dark"] .premium-modal .ant-select-focused .ant-select-selector,
        [data-theme="dark"] .premium-modal .ant-input-number-focused,
        [data-theme="dark"] .premium-modal .ant-input:focus,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper:focus-within {
          border-color: #a78bfa !important;
          box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.18) !important;
          background: var(--bg-secondary) !important;
        }

        /* Prevent horizontal overflow from edge-to-edge header bleed */
        .cd-tabs .ant-tabs-content-holder {
          overflow-x: hidden !important;
        }
      `}} />
    </div>
  );
}

/* --------------------------------------------------------------- */

function CrRow({
  cr,
  c,
  tones,
  onOpen,
  onEdit,
  onDelete,
}: {
  cr: CrListItem;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof toneMap>;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  const { canUpdateClient, canDeleteClient } = usePermission();
  const st = STATUS_META[cr.status] || STATUS_META.submitted;
  const pri = PRIORITY_META[cr.priority] || PRIORITY_META.medium;
  const StIcon = st.icon;

  const estimateText = cr.estimatedCost
    ? fmtCurrency(cr.estimatedCost, cr.estimatedCurrency)
    : cr.estimatedHoursMin || cr.estimatedHoursMax
      ? `${cr.estimatedHoursMin || "?"}–${cr.estimatedHoursMax || "?"} h`
      : "—";

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="cr-card-row"
      style={{
        gap: 14,
        padding: "14px 18px",
        background: hover ? c.surfaceMuted : c.surfaceElevated,
        border: `1px solid ${hover ? c.borderStrong : c.border}`,
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        alignItems: "center",
        transition: "border-color 120ms ease, background 120ms ease",
        color: c.text,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          background: c.purpleBg,
          border: `1px solid ${c.purpleBorder}`,
          color: c.purpleText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GitPullRequest size={16} />
      </div>
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
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11.5,
              padding: "1px 7px",
              background: c.surfaceMuted,
              border: `1px solid ${c.border}`,
              borderRadius: 6,
              color: c.textMuted,
            }}
          >
            {cr.crNumber}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: c.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cr.subject}
          </span>
          {cr.createdByPortalUserId && (
            <Tooltip title="Raised by the client from the portal">
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  padding: "1px 6px",
                  background: c.accentBg,
                  border: `1px solid ${c.accentBorder}`,
                  color: c.accentText,
                  borderRadius: 999,
                }}
              >
                Client-raised
              </span>
            </Tooltip>
          )}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: c.textSubtle,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {cr.projectName && <span>{cr.projectName}</span>}
          {cr.linkedInvoiceNumber && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span
                style={{ display: "inline-flex", gap: 3, alignItems: "center" }}
              >
                <Receipt size={11} />
                {cr.linkedInvoiceNumber}
              </span>
            </>
          )}
          {cr.linkedSprintVersion && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span>Sprint {cr.linkedSprintVersion}</span>
            </>
          )}
          <span style={{ color: c.textFaint }}>·</span>
          <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
            <Hash size={11} />
            {cr.messageCount}
          </span>
        </div>
      </div>
      <div>
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
      </div>
      <div>
        <span
          style={{
            display: "inline-block",
            padding: "2px 9px",
            background: tones[pri.tone].bg,
            border: `1px solid ${tones[pri.tone].border}`,
            color: tones[pri.tone].text,
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 500,
          }}
        >
          {pri.label}
        </span>
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: c.textMuted,
          fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
        }}
      >
        {estimateText}
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {canUpdateClient && hover && (
          <Tooltip title="Edit details">
            <Button
              type="text"
              size="small"
              icon={<Pencil size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={{ color: c.textMuted, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            />
          </Tooltip>
        )}
        {canDeleteClient && hover && (
          <Popconfirm
            title="Delete Change Request"
            description="Permanently delete this change request?"
            onConfirm={(e) => {
              e?.stopPropagation();
              onDelete();
            }}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onPopupClick={(e) => e.stopPropagation()}
          >
            <Tooltip title="Delete CR">
              <Button
                type="text"
                danger
                size="small"
                icon={<Trash2 size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              />
            </Tooltip>
          </Popconfirm>
        )}
        <ChevronRight size={16} color={c.textFaint} />
      </div>
    </button>
  );
}

/* --------------------------------------------------------------- */

function CreateCrModal({
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
        priority: "medium",
        status: "under_review",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      await crService.create(clientId, {
        subject: values.subject.trim(),
        description: values.description.trim(),
        priority: values.priority,
        projectId: values.projectId || undefined,
        status: values.status,
        impactAnalysis: values.impactAnalysis || undefined,
        estimatedHoursMin: values.estimatedHoursMin ?? undefined,
        estimatedHoursMax: values.estimatedHoursMax ?? undefined,
        estimatedCost: values.estimatedCost ?? undefined,
        estimatedCurrency: values.estimatedCurrency || undefined,
        targetDeliveryDate: values.targetDeliveryDate
          ? dayjs(values.targetDeliveryDate).format("YYYY-MM-DD")
          : undefined,
      });
      messageApi.success("Change request created");
      onCreated();
    } catch (err: any) {
      messageApi.error(`Could not create CR: ${err?.message}`);
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
      ribbonColor={c.purpleText}
      iconTile={{ bg: c.purpleBg, border: c.purpleBorder, text: c.purpleText }}
      icon={<GitPullRequest size={20} />}
      title="Log a change request"
      subtitle="Capture the ask now. Estimate fields are optional — you can fill them in later from the detail drawer once you've assessed impact."
      tip={
        <span>
          <DollarSign
            size={11}
            style={{ verticalAlign: -1, marginRight: 5, color: c.warningText }}
          />
          When you fill in the estimate and set status to{" "}
          <strong>Estimated</strong>, the client sees an Approve / Reject prompt
          on their portal.
        </span>
      }
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to create">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            onClick={() => form.submit()}
            icon={<GitPullRequest size={14} />}
          >
            Create change request
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="The ask"
          description="What the client wants changed, in their words plus your context."
          icon={<GitPullRequest size={11} />}
          plain
        >
          <Form.Item
            name="subject"
            label={<L c={c}>Subject</L>}
            rules={[{ required: true, message: "Subject is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<Layers size={13} color={c.textFaint} />}
              placeholder="Short description of the change"
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<L c={c}>Full description</L>}
            rules={[{ required: true, message: "Description is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea
              rows={4}
              placeholder="What did the client request? What context matters?"
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.2fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="priority"
              label={<L c={c}>Priority</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="projectId"
              label={<L c={c} hint="optional">Project</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                allowClear
                placeholder="—"
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.code ? `${p.name} · ${p.code}` : p.name,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="status"
              label={<L c={c}>Initial status</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={[
                  { value: "under_review", label: "Under review" },
                  { value: "submitted", label: "Submitted" },
                  { value: "estimated", label: "Estimated" },
                  { value: "draft", label: "Draft — hidden from client" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "scheduled", label: "Scheduled" },
                  { value: "in_progress", label: "In progress" },
                  { value: "delivered", label: "Delivered" },
                  { value: "closed", label: "Closed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </Form.Item>
          </div>
        </ModalSection>

        <ModalSection
          c={c}
          title="Estimate"
          description="Optional now. Once published, the client gets a one-click approve / reject prompt."
          icon={<DollarSign size={11} />}
        >
          <Form.Item
            name="impactAnalysis"
            label={<L c={c}>Impact analysis</L>}
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea
              rows={2}
              placeholder="What's affected? Dependencies? Risks?"
            />
          </Form.Item>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.2fr 0.8fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="estimatedHoursMin"
              label={<L c={c}>Hours min</L>}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={0.5}
                placeholder="8"
              />
            </Form.Item>
            <Form.Item
              name="estimatedHoursMax"
              label={<L c={c}>Hours max</L>}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={0.5}
                placeholder="16"
              />
            </Form.Item>
            <Form.Item
              name="estimatedCost"
              label={<L c={c}>Cost</L>}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={100}
                placeholder="2500"
              />
            </Form.Item>
            <Form.Item
              name="estimatedCurrency"
              label={<L c={c}>Currency</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                allowClear
                placeholder="USD"
                options={["USD", "INR", "EUR", "GBP", "AED"].map((cur) => ({
                  value: cur,
                  label: cur,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="targetDeliveryDate"
              label={<L c={c}>Target delivery</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
          </div>
        </ModalSection>
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

function EditCrModal({
  open,
  onClose,
  onUpdated,
  cr,
  projects,
  c,
  messageApi,
}: {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  cr: CrDetail;
  projects: { id: string; name: string; code?: string | null }[];
  c: ReturnType<typeof palette>;
  messageApi: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && cr) {
      form.setFieldsValue({
        subject: cr.subject,
        description: cr.description,
        priority: cr.priority,
        projectId: cr.projectId || undefined,
        status: cr.status,
        impactAnalysis: cr.impactAnalysis || undefined,
        estimatedHoursMin: cr.estimatedHoursMin != null ? Number(cr.estimatedHoursMin) : undefined,
        estimatedHoursMax: cr.estimatedHoursMax != null ? Number(cr.estimatedHoursMax) : undefined,
        estimatedCost: cr.estimatedCost != null ? Number(cr.estimatedCost) : undefined,
        estimatedCurrency: cr.estimatedCurrency || undefined,
        targetDeliveryDate: cr.targetDeliveryDate ? dayjs(cr.targetDeliveryDate) : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, cr, form]);

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      await crService.update(cr.id, {
        subject: values.subject.trim(),
        description: values.description.trim(),
        priority: values.priority,
        projectId: values.projectId || null,
        status: values.status,
        impactAnalysis: values.impactAnalysis || null,
        estimatedHoursMin: values.estimatedHoursMin ?? null,
        estimatedHoursMax: values.estimatedHoursMax ?? null,
        estimatedCost: values.estimatedCost ?? null,
        estimatedCurrency: values.estimatedCurrency || null,
        targetDeliveryDate: values.targetDeliveryDate
          ? dayjs(values.targetDeliveryDate).format("YYYY-MM-DD")
          : null,
      });
      messageApi.success("Change request updated");
      onUpdated();
    } catch (err: any) {
      messageApi.error(`Could not update CR: ${err?.message}`);
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
      ribbonColor={c.purpleText}
      iconTile={{ bg: c.purpleBg, border: c.purpleBorder, text: c.purpleText }}
      icon={<GitPullRequest size={20} />}
      title="Edit change request"
      subtitle="Modify the details, priority, project scope or estimations."
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to update">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            onClick={() => form.submit()}
            icon={<Pencil size={14} />}
          >
            Update change request
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="The ask"
          description="What the client wants changed, in their words plus your context."
          icon={<GitPullRequest size={11} />}
          plain
        >
          <Form.Item
            name="subject"
            label={<L c={c}>Subject</L>}
            rules={[{ required: true, message: "Subject is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<Layers size={13} color={c.textFaint} />}
              placeholder="Short description of the change"
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<L c={c}>Full description</L>}
            rules={[{ required: true, message: "Description is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea
              rows={4}
              placeholder="What did the client request? What context matters?"
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.2fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="priority"
              label={<L c={c}>Priority</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="projectId"
              label={<L c={c} hint="optional">Project</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                allowClear
                placeholder="—"
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.code ? `${p.name} · ${p.code}` : p.name,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="status"
              label={<L c={c}>Status</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={[
                  { value: "under_review", label: "Under review" },
                  { value: "submitted", label: "Submitted" },
                  { value: "estimated", label: "Estimated" },
                  { value: "draft", label: "Draft — hidden from client" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "scheduled", label: "Scheduled" },
                  { value: "in_progress", label: "In progress" },
                  { value: "delivered", label: "Delivered" },
                  { value: "closed", label: "Closed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </Form.Item>
          </div>
        </ModalSection>

        <ModalSection
          c={c}
          title="Estimate"
          description="Assess impact and provide time + cost estimates."
          icon={<DollarSign size={11} />}
        >
          <Form.Item
            name="impactAnalysis"
            label={<L c={c}>Impact analysis</L>}
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea
              rows={2}
              placeholder="What's affected? Dependencies? Risks?"
            />
          </Form.Item>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.2fr 0.8fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="estimatedHoursMin"
              label={<L c={c}>Hours min</L>}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={0.5}
                placeholder="8"
              />
            </Form.Item>
            <Form.Item
              name="estimatedHoursMax"
              label={<L c={c}>Hours max</L>}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={0.5}
                placeholder="16"
              />
            </Form.Item>
            <Form.Item
              name="estimatedCost"
              label={<L c={c}>Cost</L>}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={100}
                placeholder="2500"
              />
            </Form.Item>
            <Form.Item
              name="estimatedCurrency"
              label={<L c={c}>Currency</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                allowClear
                placeholder="USD"
                options={["USD", "INR", "EUR", "GBP", "AED"].map((cur) => ({
                  value: cur,
                  label: cur,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="targetDeliveryDate"
              label={<L c={c}>Target delivery</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
            </Form.Item>
          </div>
        </ModalSection>
      </Form>
    </PremiumModal>
  );
}

/* ====================================================================== */
/*  Detail drawer — staff view, with estimate editor + status controls     */
/* ====================================================================== */

function CrDetailDrawer({
  id,
  c,
  tones,
  messageApi,
  onClose,
  onMutated,
}: {
  id: string | null;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof toneMap>;
  messageApi: any;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [cr, setCr] = useState<CrDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimateForm] = Form.useForm();
  const [replyBody, setReplyBody] = useState("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await crService.detail(id);
      setCr(data);
      estimateForm.setFieldsValue({
        impactAnalysis: data.impactAnalysis || "",
        estimatedHoursMin: data.estimatedHoursMin
          ? Number(data.estimatedHoursMin)
          : undefined,
        estimatedHoursMax: data.estimatedHoursMax
          ? Number(data.estimatedHoursMax)
          : undefined,
        estimatedCost: data.estimatedCost
          ? Number(data.estimatedCost)
          : undefined,
        estimatedCurrency: data.estimatedCurrency || undefined,
        targetDeliveryDate: data.targetDeliveryDate
          ? dayjs(data.targetDeliveryDate)
          : undefined,
      });
    } catch (err: any) {
      messageApi.error(`Failed to load: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setCr(null);
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveEstimate = async (publish: boolean) => {
    if (!cr) return;
    const values = estimateForm.getFieldsValue();
    try {
      await crService.updateEstimate(cr.id, {
        impactAnalysis: values.impactAnalysis || undefined,
        estimatedHoursMin: values.estimatedHoursMin ?? undefined,
        estimatedHoursMax: values.estimatedHoursMax ?? undefined,
        estimatedCost: values.estimatedCost ?? undefined,
        estimatedCurrency: values.estimatedCurrency || undefined,
        targetDeliveryDate: values.targetDeliveryDate
          ? dayjs(values.targetDeliveryDate).format("YYYY-MM-DD")
          : undefined,
        publish,
      });
      messageApi.success(publish ? "Estimate published" : "Estimate saved");
      load();
      onMutated();
    } catch (err: any) {
      messageApi.error(`Save failed: ${err?.message}`);
    }
  };

  const changeStatus = async (s: CrStatus) => {
    if (!cr) return;
    try {
      await crService.updateStatus(cr.id, s);
      load();
      onMutated();
    } catch (err: any) {
      messageApi.error(`Update failed: ${err?.message}`);
    }
  };

  const sendReply = async () => {
    if (!cr || !replyBody.trim()) return;
    try {
      await crService.reply(cr.id, replyBody.trim());
      setReplyBody("");
      load();
    } catch (err: any) {
      messageApi.error(`Send failed: ${err?.message}`);
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
      {!cr || loading ? (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: c.textSubtle,
          }}
        >
          {loading ? "Loading…" : "Nothing to show"}
        </div>
      ) : (
        <CrDetailBody
          cr={cr}
          c={c}
          tones={tones}
          estimateForm={estimateForm}
          onSaveEstimate={saveEstimate}
          onChangeStatus={changeStatus}
          replyBody={replyBody}
          setReplyBody={setReplyBody}
          onReply={sendReply}
        />
      )}
    </Drawer>
  );
}

function CrDetailBody({
  cr,
  c,
  tones,
  estimateForm,
  onSaveEstimate,
  onChangeStatus,
  replyBody,
  setReplyBody,
  onReply,
}: {
  cr: CrDetail;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof toneMap>;
  estimateForm: any;
  onSaveEstimate: (publish: boolean) => void;
  onChangeStatus: (s: CrStatus) => void;
  replyBody: string;
  setReplyBody: (s: string) => void;
  onReply: () => void;
}) {
  const { canUpdateClient, canDeleteClient } = usePermission();
  const st = STATUS_META[cr.status] || STATUS_META.submitted;
  const pri = PRIORITY_META[cr.priority] || PRIORITY_META.medium;
  const StIcon = st.icon;
  const canEditEstimate = !["closed", "cancelled", "delivered"].includes(
    cr.status,
  );

  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: "10px 16px 8px",
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
          <GitPullRequest size={16} />
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
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11.5,
                padding: "1px 7px",
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                borderRadius: 6,
                color: c.textMuted,
              }}
            >
              {cr.crNumber}
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
            <span
              style={{
                padding: "2px 9px",
                background: tones[pri.tone].bg,
                border: `1px solid ${tones[pri.tone].border}`,
                color: tones[pri.tone].text,
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 500,
              }}
            >
              {pri.label}
            </span>
            {cr.createdByPortalUserId && (
              <span
                style={{
                  padding: "2px 9px",
                  background: c.accentBg,
                  border: `1px solid ${c.accentBorder}`,
                  color: c.accentText,
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 500,
                }}
              >
                Client-raised
              </span>
            )}
          </div>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: 16,
              fontWeight: 600,
              color: c.text,
              letterSpacing: "-0.01em",
            }}
          >
            {cr.subject}
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
            {cr.projectName && <span>📁 {cr.projectName}</span>}
            {cr.targetDeliveryDate && (
              <span>Target {fmtDate(cr.targetDeliveryDate)}</span>
            )}
            {cr.linkedInvoiceNumber && (
              <span>
                <Receipt
                  size={11}
                  style={{ verticalAlign: -1, marginRight: 2 }}
                />
                {cr.linkedInvoiceNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div
        style={{
          background: c.surfaceMuted,
          borderBottom: `1px solid ${c.border}`,
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
            {(() => {
              const name = cr.createdByPortalName || cr.createdByStaffName;
              return (
                <>
                  <Avatar size={20} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 9, fontWeight: 700 }}>
                    {((name || "?")[0] || "").toUpperCase()}
                  </Avatar>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: c.text }}>
                    {name || "—"}
                  </span>
                </>
              );
            })()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Created At
          </div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: c.text }}>
            {cr.createdAt ? new Date(cr.createdAt).toLocaleString(undefined, {
              month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric"
            }) : "—"}
          </div>
        </div>
      </div>

      {/* Status transition row */}
      {canEditEstimate && (
        <div
          style={{
            padding: "6px 16px",
            background: c.surfaceMuted,
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: c.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Status
          </span>
          <SearchableDropdown
            placeholder="Status"
            searchPlaceholder="Search statuses"
            itemNoun="statuses"
            value={cr.status}
            onChange={(v) => {
              if (v) onChangeStatus(v as CrStatus);
            }}
            options={(
              [
                "submitted",
                "under_review",
                "estimated",
                "approved",
                "rejected",
                "scheduled",
                "in_progress",
                "delivered",
                "closed",
                "cancelled",
              ] as CrStatus[]
            ).map((s) => ({
              value: s,
              label: STATUS_META[s]?.label || s,
            }))}
            width={180}
            style={{ width: 170 }}
            allowClear={false}
            hideAvatar={true}
          />
          {cr.clientDecision && (
            <Tag
              color="default"
              style={{
                background:
                  cr.clientDecision === "approved" ? c.successBg : c.dangerBg,
                borderColor:
                  cr.clientDecision === "approved"
                    ? c.successBorder
                    : c.dangerBorder,
                color:
                  cr.clientDecision === "approved"
                    ? c.successText
                    : c.dangerText,
              }}
            >
              Client {cr.clientDecision} {fmtDate(cr.clientDecisionAt)}
            </Tag>
          )}
        </div>
      )}

      {/* Body — two columns: estimate editor + conversation */}
      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {cr.description && (
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
            <div
              style={{
                padding: "10px 12px",
                fontSize: 13,
                color: c.text,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {cr.description}
            </div>
          </div>
        )}
        {/* Estimate editor */}
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
              padding: "8px 12px",
              background: c.surfaceMuted,
              borderBottom: `1px solid ${c.border}`,
              fontSize: 11,
              fontWeight: 600,
              color: c.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <DollarSign size={12} /> Estimate
          </div>
          <div style={{ padding: "10px 12px" }}>
            {!canEditEstimate ? (
              <div style={{ fontSize: 12.5, color: c.textSubtle }}>
                Estimate locked — CR is {STATUS_META[cr.status]?.label}.
              </div>
            ) : (
              <Form form={estimateForm} layout="vertical" requiredMark={false}>
                <Form.Item
                  name="impactAnalysis"
                  label={<L c={c}>Impact analysis</L>}
                  style={{ marginBottom: 8 }}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <Form.Item
                    name="estimatedHoursMin"
                    label={<L c={c}>Hours min</L>}
                    style={{ marginBottom: 8 }}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} step={0.5} />
                  </Form.Item>
                  <Form.Item
                    name="estimatedHoursMax"
                    label={<L c={c}>Hours max</L>}
                    style={{ marginBottom: 8 }}
                  >
                    <InputNumber style={{ width: "100%" }} min={0} step={0.5} />
                  </Form.Item>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 0.8fr 1fr",
                    gap: 8,
                  }}
                >
                  <Form.Item
                    name="estimatedCost"
                    label={<L c={c}>Cost</L>}
                    style={{ marginBottom: 8 }}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      step={100}
                    />
                  </Form.Item>
                  <Form.Item
                    name="estimatedCurrency"
                    label={<L c={c}>Cur.</L>}
                    style={{ marginBottom: 8 }}
                  >
                    <Select
                      allowClear
                      options={["USD", "INR", "EUR", "GBP", "AED"].map(
                        (cur) => ({ value: cur, label: cur }),
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    name="targetDeliveryDate"
                    label={<L c={c}>Target</L>}
                    style={{ marginBottom: 8 }}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <Button size="small" onClick={() => onSaveEstimate(false)}>
                    Save draft
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    icon={<Send size={12} />}
                    onClick={() => onSaveEstimate(true)}
                  >
                    Publish to client
                  </Button>
                </div>
                {cr.clientDecision && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "6px 8px",
                      background:
                        cr.clientDecision === "approved"
                          ? c.successBg
                          : c.dangerBg,
                      border: `1px solid ${cr.clientDecision === "approved"
                          ? c.successBorder
                          : c.dangerBorder
                        }`,
                      color:
                        cr.clientDecision === "approved"
                          ? c.successText
                          : c.dangerText,
                      fontSize: 12,
                      borderRadius: 0,
                    }}
                  >
                    Client {cr.clientDecision} this estimate{" "}
                    {fmtDate(cr.clientDecisionAt)}
                    {cr.clientDecisionNote && (
                      <>
                        {" "}
                        — &ldquo;
                        <span style={{ fontStyle: "italic" }}>
                          {cr.clientDecisionNote}
                        </span>
                        &rdquo;
                      </>
                    )}
                  </div>
                )}
              </Form>
            )}
          </div>
        </div>

        {/* Conversation */}
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
            Conversation · {cr.messages.length}
          </div>
          <div
            style={{
              padding: "10px 12px",
              maxHeight: 300,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {cr.messages.length === 0 ? (
              <div style={{ fontSize: 12.5, color: c.textSubtle }}>
                No messages yet.
              </div>
            ) : (
              cr.messages.map((m) =>
                m.isSystemEvent ? (
                  <SystemRow key={m.id} m={m} c={c} />
                ) : (
                  <BubbleRow key={m.id} m={m} c={c} />
                ),
              )
            )}
          </div>
          <div
            style={{
              padding: "8px 12px",
              borderTop: `1px solid ${c.border}`,
              background: c.surfaceMuted,
              display: "flex",
              gap: 6,
            }}
          >
            <Input.TextArea
              rows={2}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Reply…"
            />
            <Button
              type="primary"
              icon={<Send size={13} />}
              disabled={!replyBody.trim()}
              onClick={onReply}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function BubbleRow({
  m,
  c,
}: {
  m: CrDetail["messages"][number];
  c: ReturnType<typeof palette>;
}) {
  const isStaff = m.authorType === "staff";
  const name =
    m.authorType === "portal"
      ? m.portalUserName || m.portalUserEmail || "Client"
      : m.staffUserName || "Team member";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isStaff ? "row-reverse" : "row",
        gap: 8,
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: isStaff ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: c.textSubtle,
          }}
        >
          <strong style={{ color: c.text }}>{name}</strong> ·{" "}
          {new Date(m.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div
          style={{
            padding: "6px 10px",
            background: isStaff ? c.accentBg : c.surfaceMuted,
            border: `1px solid ${isStaff ? c.accentBorder : c.border}`,
            borderRadius: 8,
            color: c.text,
            fontSize: 12.5,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {m.body}
        </div>
      </div>
    </div>
  );
}

function SystemRow({
  m,
  c,
}: {
  m: CrDetail["messages"][number];
  c: ReturnType<typeof palette>;
}) {
  const desc =
    m.eventType === "status_change"
      ? `Status: ${prettify(m.eventFrom)} → ${prettify(m.eventTo)}`
      : m.eventType === "estimate_published"
        ? "Estimate published to client"
        : m.eventType === "estimate_updated"
          ? "Estimate updated"
          : m.eventType === "client_decision"
            ? m.body
            : m.eventType === "invoice_linked"
              ? `Invoice link ${m.eventTo ? "set" : "cleared"}`
              : m.eventType === "sprint_linked"
                ? `Sprint link ${m.eventTo ? "set" : "cleared"}`
                : m.eventType === "assignment"
                  ? "Assignment changed"
                  : m.eventType === "created_from_mom"
                    ? m.body
                    : m.eventType === "attachment_upload_failed"
                      ? `Attachment upload failed${m.body ? `: ${m.body}` : ""}`
                      : m.body || "System event";
  return (
    <div
      style={{
        textAlign: "center",
        fontSize: 11,
        color: c.textSubtle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <AlertTriangle size={11} />
      {desc}
    </div>
  );
}

function prettify(s: string | null) {
  if (!s) return "—";
  return s.replace(/_/g, " ");
}
