"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Empty,
  Tooltip,
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
  CheckSquare,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Hourglass,
  Ban,
  Users,
  Link2,
  Send,
  Trash2,
  ExternalLink,
  FileText,
  Download,
  Upload as UploadIcon,
  X,
  Calendar,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
} from "lucide-react";
import dayjs from "dayjs";
import {
  approvalsService,
  ApprovalListItem,
  ApprovalDetail,
  ApprovalSubjectType,
  CreateApprovalPayload,
} from "@/services/approvalsService";
import { clientPortalService } from "@/services/clientPortalService";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { useTheme } from "@/context/ThemeContext";
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
} from "./_PremiumModal";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

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

const STATUS_META: Record<
  string,
  { label: string; tone: keyof ReturnType<typeof tonesOf>; icon: any }
> = {
  open: { label: "Open", tone: "warning", icon: Hourglass },
  approved: { label: "Approved", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", tone: "danger", icon: XCircle },
  cancelled: { label: "Cancelled", tone: "neutral", icon: Ban },
  expired: { label: "Expired", tone: "neutral", icon: Clock },
};
const SUBJECT_LABEL: Record<string, string> = {
  design: "Design",
  requirement: "Requirement",
  sprint: "Sprint signoff",
  uat: "UAT signoff",
  production_release: "Production release",
  cr: "Change request",
  invoice: "Invoice",
  document: "Document",
  custom: "Custom",
};
const SUBJECT_OPTIONS: { value: ApprovalSubjectType; label: string }[] = (
  Object.keys(SUBJECT_LABEL) as ApprovalSubjectType[]
).map((k) => ({ value: k, label: SUBJECT_LABEL[k] }));

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

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
}

export default function ApprovalsTab({ clientId, projects = [] }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => tonesOf(c), [c]);

  const [items, setItems] = useState<ApprovalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await approvalsService.listForClient(clientId));
    } catch (err: any) {
      messageApi.error(`Failed to load approvals: ${err?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };

  const removeApproval = async (id: string) => {
    try {
      await approvalsService.remove(id);
      messageApi.success("Approval deleted successfully");
      load();
    } catch (err: any) {
      messageApi.error(`Failed to delete approval: ${err?.message || ""}`);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const filteredItems = items.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (item.title || "").toLowerCase().includes(search) ||
      (item.approvalNumber || "").toLowerCase().includes(search) ||
      (item.subjectLabel || "").toLowerCase().includes(search);

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

  const columns = [
    {
      title: "Approval Request",
      key: "title",
      render: (_: any, record: any) => (
        <Space size={12}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: c.accentBg,
              border: `1px solid ${c.accentBorder}`,
              color: c.accentText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CheckSquare size={14} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--text-slate-900)", fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, minWidth: 0, width: "100%" }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, padding: "1px 5px", background: c.surfaceMuted, border: `1px solid ${c.border}`, borderRadius: "4px", color: c.textMuted, flexShrink: 0 }}>
                {record.approvalNumber}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "350px", flexShrink: 1, minWidth: 0 }} title={record.title}>
                {record.title}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-slate-500)", display: "flex", gap: 8, marginTop: 2 }}>
              {record.projectName && <span>Project: {record.projectName}</span>}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Subject Type",
      key: "subjectType",
      render: (_: any, record: any) => (
        <Space size={6}>
          <span
            style={{
              padding: "1px 7px",
              background: c.purpleBg,
              border: `1px solid ${c.purpleBorder}`,
              color: c.purpleText,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {SUBJECT_LABEL[record.subjectType] || record.subjectType}
          </span>
          {record.subjectLabel && (
            <span style={{ fontSize: 12, color: c.textSubtle }}>{record.subjectLabel}</span>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: any) => {
        const st = STATUS_META[record.status] || STATUS_META.open;
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
      title: "Progress",
      key: "progress",
      render: (_: any, record: any) => {
        const progress = record.requiredCount > 0
          ? `${record.approvedCount}/${record.requiredCount} signed off`
          : "—";
        return (
          <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 500 }}>
            {progress}
            {record.rejectedCount > 0 && (
              <span style={{ color: c.dangerText, marginLeft: 6 }}>
                · {record.rejectedCount} rejected
              </span>
            )}
          </div>
        );
      }
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date: string | null) => (
        <span style={{ fontSize: 12, color: c.textSubtle }}>
          {date ? fmtDate(date) : "—"}
        </span>
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
        const name = record.requestedByName;
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
          menu={{
            items: [
              {
                key: "details",
                label: (
                  <div className="pp-menu-item">
                    <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}><FileText size={13} /></span>
                    <span className="pp-menu-text">
                      <span className="pp-menu-title">View Details</span>
                      <span className="pp-menu-desc">Review sign-off progress</span>
                    </span>
                  </div>
                )
              },
              { type: "divider" },
              {
                key: "delete",
                danger: true,
                label: (
                  <div className="pp-menu-item">
                    <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}><Trash2 size={13} /></span>
                    <span className="pp-menu-text">
                      <span className="pp-menu-title">Delete</span>
                      <span className="pp-menu-desc">Permanently remove</span>
                    </span>
                  </div>
                )
              }
            ],
            onClick: ({ key, domEvent }) => {
              domEvent?.stopPropagation();
              if (key === "delete") {
                removeApproval(record.id);
              } else {
                setOpenId(record.id);
              }
            }
          }}
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
      <div className="approvals-header-wrap" style={{ margin: "0 -32px" }}>
        <TimeTrackingHeader
          icon={<CheckSquare size={20} color="#3b82f6" />}
          title="Approvals"
          description="Request explicit client sign-off on designs, requirements, deliverables or releases."
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
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Request approval
            </Button>
          }
          style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)" }}
        />
      </div>

      <div style={{ margin: "12px 0 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", flex: 1, minWidth: 0 }}>
          <Input
            placeholder="Search by approval number, title or subject label..."
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
              background: c.accentBg,
              color: c.accentText,
              border: `1px solid ${c.accentBorder}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <CheckSquare size={22} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
            No approvals found
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
              ? "No approval requests match your search criteria. Try modifying your filters."
              : "Capture sign-off before delivery so there are no disputes later."}
          </div>
          {(!searchTerm && selectedProject === "all" && selectedStatus === "all") && (
            <div style={{ marginTop: 18 }}>
              <Button
                type="primary"
                icon={<Plus size={15} />}
                onClick={() => setCreateOpen(true)}
              >
                Request first approval
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
          {filteredItems.map((a) => {
            const st = STATUS_META[a.status] || STATUS_META.open;
            const progress = a.requiredCount > 0
              ? `${a.approvedCount}/${a.requiredCount} signed off`
              : "—";

            return (
              <div key={a.id} className="pc-card" onClick={() => setOpenId(a.id)}>
                <div className="pc-top">
                  <div className="pc-avatar" style={{ background: c.accentBg, border: `1px solid ${c.accentBorder}`, color: c.accentText, borderRadius: "6px" }}>
                    <CheckSquare size={15} />
                  </div>
                  <div className="pc-identity-body" style={{ minWidth: 0 }}>
                    <div className="pc-title" style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, width: "100%" }}>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", padding: "1px 5px", background: c.surfaceMuted, border: `1px solid ${c.border}`, borderRadius: "4px", color: c.textMuted, flexShrink: 0 }}>
                        {a.approvalNumber}
                      </span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 1, minWidth: 0 }} title={a.title}>
                        {a.title}
                      </span>
                    </div>
                    <div className="pc-client-line" style={{ marginTop: 2, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span className="pc-client-key">Project:</span>
                      <span className="pc-client-val" style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.projectName || "No Project"}
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
                    </div>
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "details",
                          label: (
                            <div className="pp-menu-item">
                              <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}><FileText size={13} /></span>
                              <span className="pp-menu-text">
                                <span className="pp-menu-title">View Details</span>
                                <span className="pp-menu-desc">Review sign-off progress</span>
                              </span>
                            </div>
                          )
                        },
                        { type: "divider" },
                        {
                          key: "delete",
                          danger: true,
                          label: (
                            <div className="pp-menu-item">
                              <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}><Trash2 size={13} /></span>
                              <span className="pp-menu-text">
                                <span className="pp-menu-title">Delete</span>
                                <span className="pp-menu-desc">Permanently remove</span>
                              </span>
                            </div>
                          )
                        }
                      ],
                      onClick: ({ key, domEvent }) => {
                        domEvent?.stopPropagation();
                        if (key === "delete") {
                          removeApproval(a.id);
                        } else {
                          setOpenId(a.id);
                        }
                      }
                    }}
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
                  {/* Foot Row 1 (User's 2nd row): Created, Created By, Updated */}
                  <div className="pc-foot-row">
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Created:</span>
                      <span className="pc-foot-val">{a.createdAt ? dayjs(a.createdAt).format("MMM D, YYYY · h:mm A") : "—"}</span>
                    </span>
                    <span className="pc-foot-div" />
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Created by:</span>
                      {(() => {
                        const name = a.requestedByName;
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
                      <span className="pc-foot-val">{a.lastActivityAt ? dayjs(a.lastActivityAt).format("MMM D, YYYY · h:mm A") : "—"}</span>
                    </span>
                  </div>

                  {/* Foot Row 2 (User's 3rd row): Rest of them (Progress, Type, Label, Due Date) */}
                  <div className="pc-foot-row">
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Progress:</span>
                      <span style={{ fontWeight: 600 }}>{progress}</span>
                      {a.rejectedCount > 0 && (
                        <span style={{ color: c.dangerText, marginLeft: 4 }}>
                          ({a.rejectedCount} rejected)
                        </span>
                      )}
                    </span>
                    <span className="pc-foot-div" />
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Type:</span>
                      <span className="pc-status-tag" style={{ color: c.purpleText, background: c.purpleBg, border: `1px solid ${c.purpleBorder}` }}>
                        {(SUBJECT_LABEL[a.subjectType] || a.subjectType).toUpperCase()}
                      </span>
                    </span>
                    {a.subjectLabel && (
                      <>
                        <span className="pc-foot-div" />
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Label:</span>
                          <span className="pc-foot-val">{a.subjectLabel}</span>
                        </span>
                      </>
                    )}
                    <span className="pc-foot-div" />
                    <span className="pc-foot-item">
                      <span className="pc-foot-key">Due Date:</span>
                      <span className="pc-foot-val">{a.dueDate ? dayjs(a.dueDate).format("MMM D, YYYY") : "No Due Date"}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      <CreateApprovalModal
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

      <ApprovalDetailDrawer
        id={openId}
        c={c}
        tones={tones}
        clientId={clientId}
        messageApi={messageApi}
        onClose={() => setOpenId(null)}
        onMutated={load}
      />


      {/* Premium adaptive header styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Full bleed header styling flush with vertical sidebar border */
        .approvals-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .approvals-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .approvals-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .approvals-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        html body .approvals-header-wrap .ptab-primary-btn {
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

function ApprovalRow({
  row,
  c,
  tones,
  onOpen,
}: {
  row: ApprovalListItem;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onOpen: () => void;
}) {
  const [hover, setHover] = useState(false);
  const st = STATUS_META[row.status] || STATUS_META.open;
  const StIcon = st.icon;

  const progress =
    row.requiredCount > 0
      ? `${row.approvedCount}/${row.requiredCount} signed off`
      : "—";

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1.6fr) 130px 130px 130px 30px",
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
          background: c.accentBg,
          border: `1px solid ${c.accentBorder}`,
          color: c.accentText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckSquare size={16} />
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
            {row.approvalNumber}
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
            {row.title}
          </span>
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
          <span
            style={{
              padding: "1px 7px",
              background: c.purpleBg,
              border: `1px solid ${c.purpleBorder}`,
              color: c.purpleText,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {SUBJECT_LABEL[row.subjectType] || row.subjectType}
          </span>
          {row.subjectLabel && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span style={{ minWidth: 0 }}>{row.subjectLabel}</span>
            </>
          )}
          {row.projectName && (
            <>
              <span style={{ color: c.textFaint }}>·</span>
              <span>{row.projectName}</span>
            </>
          )}
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
      <div style={{ fontSize: 12, color: c.textMuted, fontWeight: 500 }}>
        {progress}
        {row.rejectedCount > 0 && (
          <span style={{ color: c.dangerText, marginLeft: 6 }}>
            · {row.rejectedCount} rejected
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: c.textSubtle }}>
        {row.dueDate ? `Due ${fmtDate(row.dueDate)}` : fmtDate(row.createdAt)}
      </div>
      <ChevronRight size={16} color={c.textFaint} />
    </button>
  );
}

/* --------------------------------------------------------------- */

function CreateApprovalModal({
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
  const [portalUsers, setPortalUsers] = useState<
    { id: string; displayName: string | null; email: string; status: string }[]
  >([]);
  const [approverIds, setApproverIds] = useState<string[]>([]);
  const [files, setFiles] = useState<
    { dataUrl: string; name: string; size: number }[]
  >([]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setApproverIds([]);
      setFiles([]);
      return;
    }
    form.setFieldsValue({
      subjectType: "design",
    });
    clientPortalService
      .listForClient(clientId)
      .then((list) =>
        setPortalUsers(
          (list || [])
            .filter((u: any) => u.status === "active")
            .map((u: any) => ({
              id: u.id,
              displayName: u.displayName,
              email: u.email,
              status: u.status,
            })),
        ),
      )
      .catch(() => setPortalUsers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      messageApi.error(`${f.name} exceeds 10 MB`);
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
    if (approverIds.length === 0) {
      messageApi.error("Pick at least one approver");
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateApprovalPayload = {
        title: values.title.trim(),
        subjectType: values.subjectType,
        subjectLabel: values.subjectLabel || undefined,
        projectId: values.projectId || undefined,
        description: values.description || undefined,
        previewUrl: values.previewUrl || undefined,
        dueDate: values.dueDate
          ? dayjs(values.dueDate).toISOString()
          : undefined,
        expiresAt: values.expiresAt
          ? dayjs(values.expiresAt).toISOString()
          : undefined,
        approvers: approverIds.map((portalUserId) => ({
          approverType: "portal",
          portalUserId,
          required: true,
        })),
        attachments: files.map((f) => ({
          dataUrl: f.dataUrl,
          fileName: f.name,
        })),
      };
      await approvalsService.create(clientId, payload);
      messageApi.success("Approval request sent");
      onCreated();
    } catch (err: any) {
      messageApi.error(`Could not create approval: ${err?.message || ""}`);
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
      icon={<CheckSquare size={20} />}
      title="Request an approval"
      subtitle="Pick what needs sign-off and who must approve. Every decision is logged for the audit trail."
      tip={
        <span>
          All required approvers must approve before the request is closed.
          Any rejection from a required approver flips the whole request to{" "}
          <strong>rejected</strong>.
        </span>
      }
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to send">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            onClick={() => form.submit()}
            icon={<Send size={14} />}
          >
            Send to approvers
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="What needs approval"
          description="Subject + project + a clear ask. Add a preview URL so reviewers can decide quickly."
          icon={<CheckSquare size={11} />}
          plain
        >
          <Form.Item
            name="title"
            label={<L c={c}>Title</L>}
            rules={[{ required: true, message: "Title is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<CheckSquare size={13} color={c.textFaint} />}
              placeholder="e.g. Approve homepage design v3"
              maxLength={200}
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.4fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="subjectType"
              label={<L c={c}>Type</L>}
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <Select options={SUBJECT_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="subjectLabel"
              label={<L c={c} hint="optional">Subject label</L>}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="e.g. Homepage v3" maxLength={200} />
            </Form.Item>
            <Form.Item
              name="projectId"
              label={<L c={c} hint="optional">Project</L>}
              style={{ marginBottom: 12 }}
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
          </div>

          <Form.Item
            name="description"
            label={<L c={c}>What are they approving?</L>}
            style={{ marginBottom: 12 }}
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe what the approver should review and confirm…"
            />
          </Form.Item>

          <Form.Item
            name="previewUrl"
            label={
              <L c={c} hint="Figma · Loom · staging URL">
                Preview URL
              </L>
            }
            style={{ marginBottom: 0 }}
          >
            <Input
              prefix={<Link2 size={13} color={c.textFaint} />}
              placeholder="https://…"
            />
          </Form.Item>
        </ModalSection>

        <ModalSection
          c={c}
          title="Required approvers"
          description="At least one portal user. Each must approve for the request to close."
          icon={<Users size={11} />}
        >
          <Select
            mode="multiple"
            placeholder="Pick portal users who must approve"
            value={approverIds}
            onChange={setApproverIds}
            style={{ width: "100%" }}
            options={portalUsers.map((u) => ({
              value: u.id,
              label: (
                <span>
                  {u.displayName || u.email}
                  <span
                    style={{
                      color: c.textSubtle,
                      marginLeft: 6,
                      fontSize: 11.5,
                    }}
                  >
                    {u.email}
                  </span>
                </span>
              ),
            }))}
            notFoundContent={
              <div
                style={{
                  padding: 12,
                  fontSize: 12,
                  color: c.textSubtle,
                  textAlign: "center",
                }}
              >
                No active portal users for this client. Create credentials in
                the Portal Access tab first.
              </div>
            }
          />
        </ModalSection>

        <ModalSection
          c={c}
          title="Timing & attachments"
          description="When approval is needed and any supporting files (mocks, specs, PDFs)."
          icon={<Clock size={11} />}
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
              name="dueDate"
              label={<L c={c} hint="soft target">Due by</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker
                showTime
                needConfirm={false}
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
            <Form.Item
              name="expiresAt"
              label={<L c={c} hint="hard cutoff">Expires</L>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker
                showTime
                needConfirm={false}
                style={{ width: "100%" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
          </div>
          <AttachmentBox
            c={c}
            files={files}
            onAdd={handleFile}
            onRemove={(i) =>
              setFiles((prev) => prev.filter((_, idx) => idx !== i))
            }
          />
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

function AttachmentBox({
  c,
  files,
  onAdd,
  onRemove,
}: {
  c: ReturnType<typeof palette>;
  files: { name: string; size: number }[];
  onAdd: (f: File) => void;
  onRemove: (i: number) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ marginBottom: 12 }}
        onChange={(e) => {
          const fs = e.target.files;
          if (!fs) return;
          for (let i = 0; i < fs.length; i++) onAdd(fs[i]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: "100%",
          padding: 14,
          background: c.surfaceMuted,
          border: `1px dashed ${c.borderStrong}`,
          borderRadius: 10,
          cursor: "pointer",
          color: c.textMuted,
          fontSize: 12.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <UploadIcon size={14} />
        Click to attach files
      </button>
      {files.length > 0 && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "8px 10px",
                background: c.surfaceMuted,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                fontSize: 12.5,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 0,
                }}
              >
                <FileText size={13} color={c.textSubtle} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </span>
                <span style={{ color: c.textFaint, fontSize: 11 }}>
                  · {(f.size / 1024).toFixed(1)} KB
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: c.textSubtle,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/*  Detail drawer                                                          */
/* ====================================================================== */

function ApprovalDetailDrawer({
  id,
  c,
  tones,
  clientId,
  messageApi,
  onClose,
  onMutated,
}: {
  id: string | null;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  clientId: string;
  messageApi: any;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [data, setData] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingPortalUserId, setAddingPortalUserId] = useState<string | null>(
    null,
  );
  const [portalUsers, setPortalUsers] = useState<
    { id: string; displayName: string | null; email: string }[]
  >([]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setData(await approvalsService.detail(id));
    } catch (err: any) {
      messageApi.error(`Failed to load: ${err?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setData(null);
    if (id) {
      load();
      clientPortalService
        .listForClient(clientId)
        .then((list) =>
          setPortalUsers(
            (list || [])
              .filter((u: any) => u.status === "active")
              .map((u: any) => ({
                id: u.id,
                displayName: u.displayName,
                email: u.email,
              })),
          ),
        )
        .catch(() => setPortalUsers([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addApprover = async () => {
    if (!data || !addingPortalUserId) return;
    try {
      await approvalsService.addApprover(data.id, {
        approverType: "portal",
        portalUserId: addingPortalUserId,
        required: true,
      });
      setAddingPortalUserId(null);
      load();
      onMutated();
    } catch (err: any) {
      messageApi.error(`Could not add approver: ${err?.message || ""}`);
    }
  };
  const removeApprover = async (approverId: string) => {
    if (!data) return;
    try {
      await approvalsService.removeApprover(data.id, approverId);
      load();
      onMutated();
    } catch (err: any) {
      messageApi.error(`Remove failed: ${err?.message || ""}`);
    }
  };
  const cancel = async () => {
    if (!data) return;
    try {
      await approvalsService.cancel(data.id);
      load();
      onMutated();
    } catch (err: any) {
      messageApi.error(`Cancel failed: ${err?.message || ""}`);
    }
  };

  const availableToAdd = useMemo(() => {
    if (!data) return [] as typeof portalUsers;
    const taken = new Set(
      data.approvers
        .filter((a) => a.approverType === "portal" && a.portalUserId)
        .map((a) => a.portalUserId as string),
    );
    return portalUsers.filter((u) => !taken.has(u.id));
  }, [portalUsers, data]);

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={720}
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
          {loading ? "Loading…" : <Empty description="Nothing to show" />}
        </div>
      ) : (
        <>
          {/* Header */}
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
              <CheckSquare size={18} />
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
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11.5,
                    padding: "1px 7px",
                    background: c.surfaceMuted,
                    border: `1px solid ${c.border}`,
                    borderRadius: 6,
                    color: c.textMuted,
                  }}
                >
                  {data.approvalNumber}
                </span>
                <StatusPill status={data.status} tones={tones} />
                <span
                  style={{
                    padding: "2px 9px",
                    background: c.purpleBg,
                    border: `1px solid ${c.purpleBorder}`,
                    color: c.purpleText,
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 500,
                  }}
                >
                  {SUBJECT_LABEL[data.subjectType] || data.subjectType}
                </span>
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
                {data.title}
              </h2>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  fontSize: 12.5,
                  color: c.textSubtle,
                }}
              >
                {data.projectName && <span>📁 {data.projectName}</span>}
                {data.dueDate && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Calendar size={11} />
                    Due {fmtDateTime(data.dueDate)}
                  </span>
                )}
                {data.expiresAt && (
                  <span style={{ color: c.warningText, fontWeight: 500 }}>
                    Expires {fmtDateTime(data.expiresAt)}
                  </span>
                )}
              </div>
            </div>
            {data.status === "open" && (
              <Popconfirm
                title="Cancel this approval?"
                description="Approvers will see it marked cancelled. Pending decisions are discarded."
                onConfirm={cancel}
                okText="Cancel approval"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger>
                  Cancel
                </Button>
              </Popconfirm>
            )}
          </div>

          {/* Body */}
          <div
            style={{
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
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
                  {(() => {
                    const name = data.requestedByName;
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
                  {data.createdAt ? new Date(data.createdAt).toLocaleString(undefined, {
                    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric"
                  }) : "—"}
                </div>
              </div>
            </div>

            {data.description && (
              <Section c={c} title="Description">
                <div
                  style={{
                    fontSize: 13.5,
                    color: c.textMuted,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {data.description}
                </div>
              </Section>
            )}
            {data.previewUrl && (
              <Section c={c} title="Preview">
                <a
                  href={data.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    background: c.accentBg,
                    border: `1px solid ${c.accentBorder}`,
                    borderRadius: 8,
                    color: c.accentText,
                    fontSize: 12.5,
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  <Link2 size={12} />
                  Open preview
                  <ExternalLink size={11} />
                </a>
              </Section>
            )}

            {data.attachments.length > 0 && (
              <Section c={c} title={`Attachments · ${data.attachments.length}`}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {data.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 10px",
                        background: c.surfaceMuted,
                        border: `1px solid ${c.border}`,
                        borderRadius: 7,
                        color: c.accentText,
                        textDecoration: "none",
                        fontSize: 12,
                      }}
                    >
                      <FileText size={12} />
                      {a.file_name}
                      <Download size={11} />
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {/* Approvers */}
            <Section
              c={c}
              title={`Approvers · ${data.approvers.length}`}
              right={
                data.status === "open" && availableToAdd.length > 0 ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Select
                      size="small"
                      placeholder="Add approver"
                      value={addingPortalUserId || undefined}
                      onChange={(v) => setAddingPortalUserId(v)}
                      style={{ width: 200 }}
                      options={availableToAdd.map((u) => ({
                        value: u.id,
                        label: u.displayName || u.email,
                      }))}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<Plus size={12} />}
                      disabled={!addingPortalUserId}
                      onClick={addApprover}
                    >
                      Add
                    </Button>
                  </div>
                ) : null
              }
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {data.approvers.map((ap) => {
                  const decisionTone =
                    ap.decision === "approved"
                      ? tones.success
                      : ap.decision === "rejected"
                      ? tones.danger
                      : tones.warning;
                  const name =
                    ap.portalUserName ||
                    ap.portalUserEmail ||
                    ap.staffUserName ||
                    "?";
                  return (
                    <div
                      key={ap.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 12px",
                        background: c.surfaceMuted,
                        border: `1px solid ${c.border}`,
                        borderRadius: 9,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            background: c.purpleBg,
                            border: `1px solid ${c.purpleBorder}`,
                            color: c.purpleText,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {name
                            .split(" ")
                            .map((s) => s[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: c.text,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {name}
                            {ap.required ? (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10.5,
                                  fontWeight: 500,
                                  padding: "0px 6px",
                                  background: c.dangerBg,
                                  border: `1px solid ${c.dangerBorder}`,
                                  color: c.dangerText,
                                  borderRadius: 999,
                                }}
                              >
                                required
                              </span>
                            ) : null}
                          </div>
                          {ap.portalUserEmail && (
                            <div
                              style={{
                                fontSize: 11.5,
                                color: c.textSubtle,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ap.portalUserEmail}
                            </div>
                          )}
                          {ap.decisionNote && (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 11.5,
                                color: c.textMuted,
                                fontStyle: "italic",
                              }}
                            >
                              &ldquo;{ap.decisionNote}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 9px",
                            background: decisionTone.bg,
                            border: `1px solid ${decisionTone.border}`,
                            color: decisionTone.text,
                            borderRadius: 999,
                            fontSize: 11.5,
                            fontWeight: 500,
                          }}
                        >
                          {ap.decision === "approved" ? (
                            <CheckCircle2 size={11} />
                          ) : ap.decision === "rejected" ? (
                            <XCircle size={11} />
                          ) : (
                            <Hourglass size={11} />
                          )}
                          {ap.decision === "approved"
                            ? `Approved ${fmtRelative(ap.decidedAt)}`
                            : ap.decision === "rejected"
                            ? `Rejected ${fmtRelative(ap.decidedAt)}`
                            : "Pending"}
                        </span>
                        {!ap.decision && data.status === "open" && (
                          <Tooltip title="Remove approver">
                            <Button
                              size="small"
                              icon={<Trash2 size={12} />}
                              onClick={() => removeApprover(ap.id)}
                            />
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Audit trail */}
            <Section c={c} title={`Audit trail · ${data.events.length}`}>
              {data.events.length === 0 ? (
                <div style={{ fontSize: 12.5, color: c.textSubtle }}>
                  No events yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {data.events.map((e) => (
                    <div
                      key={e.id}
                      style={{
                        fontSize: 12,
                        color: c.textMuted,
                        padding: "4px 0",
                      }}
                    >
                      <span style={{ color: c.text, fontWeight: 500 }}>
                        {describeEvent(e)}
                      </span>
                      <span style={{ color: c.textFaint }}>
                        {" "}— {fmtDateTime(e.createdAt)}
                        {e.actorPortalName
                          ? ` · ${e.actorPortalName}`
                          : e.actorStaffName
                          ? ` · ${e.actorStaffName}`
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </>
      )}
    </Drawer>
  );
}

function describeEvent(e: any): string {
  switch (e.eventType) {
    case "created":
      return "Approval requested";
    case "approver_added":
      return "Approver added";
    case "approver_removed":
      return "Approver removed";
    case "approver_decision":
      return `Approver ${e.payload?.decision || "decided"}`;
    case "cancelled":
      return "Cancelled";
    case "attachment_upload_failed":
      return "Attachment upload failed";
    default:
      return e.eventType;
  }
}

function StatusPill({
  status,
  tones,
}: {
  status: string;
  tones: ReturnType<typeof tonesOf>;
}) {
  const st = STATUS_META[status] || STATUS_META.open;
  const Icon = st.icon;
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
      <Icon size={11} />
      {st.label}
    </span>
  );
}

function Section({
  c,
  title,
  right,
  children,
}: {
  c: ReturnType<typeof palette>;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function fmtRelative(iso: string | null) {
  if (!iso) return "";
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
