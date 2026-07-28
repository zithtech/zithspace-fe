"use client";

import {
  Card,
  Typography,
  Space,
  Input,
  Button,
  Table,
  Tag,
  Dropdown,
  Modal,
  Avatar,
  Divider,
  App,
  Tooltip,
  Row,
  Col,
  Select
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  RedoOutlined,
  DeleteOutlined,
  MoreOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  MoreVertical,
  Plus,
  LayoutGrid,
  List,
  X,
  Menu,
} from "lucide-react";
import dayjs from "dayjs";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useTimesheets,
  useDeleteTimesheet,
  useTimesheetById,
  useApproveTimesheet,
} from "@/hooks/useTimesheet";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const max = Math.max(...values, 1);
  const w = 96; const h = 32;
  const stepX = w / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block', width: '100%', maxWidth: '96px', height: 'auto' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const StatBox = ({ label, value, icon: Icon, color, subText }: any) => {
  const trend = [3, 4, 7, 5, 8, 6, 9];
  return (
    <div className="ts-stat-card" style={{ borderRadius: 0 }}>
      <div className="ts-stat-top">
        <div className="ts-stat-left">
          <span className="ts-stat-icon" style={{ background: `${color}15`, color: color }}><Icon size={16} /></span>
          <span className="ts-stat-label">{label}</span>
        </div>
      </div>
      <div className="ts-stat-bottom">
        <div className="ts-stat-value-wrap">
          <span className="ts-stat-value">{value}</span>
          {subText && <span className="ts-stat-period">{subText}</span>}
        </div>
        <div className="ts-stat-spark"><AreaSparkline values={trend} color={color} /></div>
      </div>
    </div>
  );
};

const { Title, Text } = Typography;

/* ------------------ Data ------------------ */
type Props = {
  goToSubmitTimesheet: (id?: string, mode?: "edit" | "resubmit") => void;
  teamMode?: boolean;
  approvalMode?: boolean;
};

export default function TimesheetsTab({ goToSubmitTimesheet, teamMode, approvalMode }: Props) {
  const router = useRouter();
  // For showing the rejection reason modal
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [currentRejectReason, setCurrentRejectReason] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [activeView, setActiveView] = useState("all");
  const [displayMode, setDisplayMode] = useState<"list" | "grid">("list");

  const [previewId, setPreviewId] = useState<string | null>(null);
  const deleteMutation = useDeleteTimesheet();
  const approveMutation = useApproveTimesheet();
  const { canCreateTimesheet, canUpdateTimesheet, canDeleteTimesheet, canManageTimesheets } = usePermission();
  const { message } = App.useApp();
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, searchText, displayMode]);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [targetActionId, setTargetActionId] = useState("");

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync({ id, status: "APPROVED" });
      message.success("Timesheet approved successfully!");
    } catch (error: any) {
      message.error(error.message || "Failed to approve timesheet");
    }
  };

  const handleReject = async () => {
    if (!rejectReasonInput.trim()) {
      message.error("Rejection reason is required");
      return;
    }
    try {
      await approveMutation.mutateAsync({ id: targetActionId, status: "REJECTED", rejectReason: rejectReasonInput });
      message.success("Timesheet rejected successfully!");
      setRejectModalOpen(false);
      setRejectReasonInput("");
    } catch (error: any) {
      message.error(error.message || "Failed to reject timesheet");
    }
  };

  const closeDesc = () => {
    setIsDescModalOpen(false);
    setSelectedDesc("");
  };

  const { data: previewTimesheetData, refetch } = useTimesheetById(
    previewId || undefined,
  );

  const { user } = useAuth();
  const { data: allTimesheets, isLoading } = useTimesheets(approvalMode ? { forApproval: true } : (teamMode ? {} : { userId: user?.id }));

  useEffect(() => {
    if (previewId) {
      refetch();
    }
  }, [previewId, refetch]);

  const tableData = useMemo(() => {
    if (!allTimesheets?.data) return [];

    return allTimesheets.data.map((t) => ({
      key: t.id,
      weekStart: t.weekStart,
      employeeName: t.user?.name || "-",
      status: t.status,
      approvedBy: t.approvedBy,
      createdAt: dayjs(t.createdAt).format("YYYY-MM-DD"),
      totalHours: `${t.totalHours}h`,
      leave: t.leaveCount || 0,
      rejectReason: t.rejectReason || "",
    }));
  }, [allTimesheets]);

  const viewCounts = useMemo(() => {
    const counts = { all: 0, draft: 0, submitted: 0, approved: 0, rejected: 0 };
    counts.all = tableData.length;
    tableData.forEach((t) => {
      if (t.status === "DRAFT") counts.draft++;
      else if (t.status === "SUBMITTED") counts.submitted++;
      else if (t.status === "APPROVED") counts.approved++;
      else if (t.status === "REJECTED") counts.rejected++;
    });
    return counts;
  }, [tableData]);

  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const search = searchText.toLowerCase();
      const matchesSearch =
        item.employeeName?.toLowerCase().includes(search) ||
        item.status?.toLowerCase().includes(search) ||
        dayjs(item.weekStart).format("MMM DD").toLowerCase().includes(search);

      let matchesView = true;
      if (activeView === "draft") matchesView = item.status === "DRAFT";
      if (activeView === "submitted") matchesView = item.status === "SUBMITTED";
      if (activeView === "approved") matchesView = item.status === "APPROVED";
      if (activeView === "rejected") matchesView = item.status === "REJECTED";

      return matchesSearch && matchesView;
    });
  }, [tableData, searchText, activeView]);

  const previewColumns = [
    {
      title: "Date",
      width: 90,
      render: (_: any, row: any) => {
        if (!previewTimesheetData?.weekStart) return <span style={{ color: "var(--text-slate-400)" }}>-</span>;
        let d = "-";
        if (row.day) d = dayjs(row.day).format("MMM DD");
        else if (row.date) d = dayjs(row.date).format("MMM DD");
        return <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{d}</span>;
      },
    },
    {
      title: "Project",
      dataIndex: "projectName",
      width: 160,
      render: (text: string) => text ? <span style={{ fontWeight: 500 }}>{text}</span> : <span style={{ color: "var(--text-slate-400)" }}>-</span>,
    },
    {
      title: "Task",
      dataIndex: "taskName",
      width: 180,
      render: (text: string) => text ? <span>{text}</span> : <span style={{ color: "var(--text-slate-400)" }}>-</span>,
    },
    {
      title: "Description",
      render: (_: any, row: any) => {
        const preview = row.description ? row.description.slice(0, 40) : "";
        const hasMore = row.description && row.description.length > 40;

        return row.description ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--text-slate-600)" }}>
              {preview}
              {hasMore ? "..." : ""}
            </span>
            {hasMore && (
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ fontSize: 13 }} />}
                onClick={() => {
                  setSelectedDesc(row.description || "");
                  setIsDescModalOpen(true);
                }}
                style={{ color: "#3b82f6" }}
              />
            )}
          </div>
        ) : (
          <span style={{ color: "var(--text-slate-400)" }}>-</span>
        );
      },
      dataIndex: "description",
    },
    {
      title: "Hours",
      dataIndex: "hours",
      width: 90,
      render: (h: number) => h ? <span style={{ fontWeight: 600 }}>{h}h</span> : <span style={{ color: "var(--text-slate-400)" }}>0h</span>,
    },
    {
      title: "Billable",
      dataIndex: "billable",
      width: 90,
      render: (v: boolean) => (
        <span style={{
          padding: "2px 8px",
          borderRadius: 4,
          background: v ? "rgba(16, 185, 129, 0.1)" : "var(--bg-slate-100)",
          color: v ? "#10b981" : "var(--text-slate-500)",
          fontSize: 12,
          fontWeight: 600
        }}>
          {v ? "Yes" : "No"}
        </span>
      ),
    },
  ];

  const getPreviewRows = () => {
    if (previewTimesheetData?.rows?.length) {
      const sortedRows = [...previewTimesheetData.rows].sort((a: any, b: any) => {
        let dateA = a.day ? dayjs(a.day) : a.date ? dayjs(a.date) : dayjs(previewTimesheetData.weekStart);
        let dateB = b.day ? dayjs(b.day) : b.date ? dayjs(b.date) : dayjs(previewTimesheetData.weekStart);
        return dateA.valueOf() - dateB.valueOf();
      });

      return sortedRows.map((row: any, index: number) => ({
        ...row,
        key: row.id || `row-${index}`,
      }));
    }

    return Array.from({ length: 7 }).map((_, index) => {
      const date = dayjs(previewTimesheetData?.weekStart).startOf("week").add(index, "day");
      return {
        id: `empty-${index}`,
        key: `empty-${index}`,
        projectName: "-",
        taskName: "-",
        description: "-",
        hours: 0,
        billable: false,
        day: date.toISOString(),
      };
    });
  };

  const getStatusConfig = (status: string) => {
    const statusConfig: any = {
      APPROVED: { color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)", icon: <CheckCircle2 size={14} />, label: "Approved" },
      REJECTED: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)", icon: <AlertCircle size={14} />, label: "Rejected" },
      SUBMITTED: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)", icon: <Clock size={14} />, label: "Submitted" },
      DRAFT: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.3)", icon: <FileText size={14} />, label: "Draft" },
    };
    return statusConfig[status] || { color: "#64748b", bg: "rgba(100, 116, 139, 0.12)", border: "rgba(100, 116, 139, 0.3)", icon: <Clock size={14} />, label: status };
  };

  /* ------------------ Columns ------------------ */
  const columns = useMemo(
    () => [
      {
        title: "Week Period",
        render: (_: any, record: any) => {
          if (!record.weekStart) return "-";
          const start = dayjs(record.weekStart).day(0);
          const end = dayjs(record.weekStart).day(6);
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ padding: "4px 8px", background: "var(--bg-slate-50)", borderRadius: 8, border: "1px solid var(--border-slate-200)" }}>
                <Text style={{ fontSize: 13, color: "var(--text-slate-700)" }}>{start.format("MMM DD")}</Text>
              </div>
              <ChevronRight size={14} color="var(--text-slate-400)" />
              <div style={{ padding: "4px 8px", background: "var(--bg-slate-50)", borderRadius: 8, border: "1px solid var(--border-slate-200)" }}>
                <Text style={{ fontSize: 13, color: "var(--text-slate-700)" }}>{end.format("MMM DD")}</Text>
              </div>
            </div>
          );
        },
      },
      ...(teamMode || approvalMode
        ? [
          {
            title: "Employee",
            dataIndex: "employeeName",
            render: (name: string) => (
              <span style={{ fontWeight: 500, color: "var(--text-slate-700)" }}>
                {name}
              </span>
            ),
          },
        ]
        : []),
      {
        title: "Status",
        dataIndex: "status",
        render: (status: string, record: any) => {
          const config = getStatusConfig(status);
          return (
            <Space>
              <Tag
                icon={config.icon}
                style={{
                  borderRadius: 6,
                  background: config.bg,
                  color: config.color,
                  border: `1px solid ${config.border}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontWeight: 500
                }}
              >
                {config.label}
              </Tag>
              {status === "REJECTED" && (
                <Tooltip title="View Reason">
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined style={{ color: "#ef4444" }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentRejectReason(record.rejectReason);
                      setShowRejectReasonModal(true);
                    }}
                  />
                </Tooltip>
              )}
            </Space>
          );
        },
      },
      {
        title: "Approver",
        dataIndex: "approvedBy",
        render: (approvedBy: any) => approvedBy?.name || "-",
      },
      {
        title: "Total Hours",
        dataIndex: "totalHours",
        render: (hours: string) => (
          <Tag style={{ borderRadius: 20, background: "var(--bg-blue-50)", border: "1px solid var(--border-blue-200)", color: "var(--text-blue-700)", fontWeight: 600, padding: "0 12px" }}>
            {hours}
          </Tag>
        )
      },
      {
        title: "Leave",
        dataIndex: "leave",
        render: (leave: number) => {
          const color = leave > 0 ? "#ef4444" : "#64748b";
          return (
            <Tag
              style={{
                borderRadius: 6,
                background: `${color}12`,
                color: color,
                border: leave > 0 ? `1px solid ${color}30` : "none"
              }}
            >
              {leave} {leave === 1 ? "Day" : "Days"}
            </Tag>
          );
        },
      },
      {
        title: "Created At",
        dataIndex: "createdAt",
        render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      },
      {
        title: "Actions",
        align: "center" as const,
        render: (_: any, record: any) => {
          const menuItems: any[] = [
            {
              key: "preview",
              label: <div className="ts-menu-item"><div className="ts-menu-ic" style={{ background: "rgba(59,130,246,0.12)", color: "#3B82F6" }}><EyeOutlined /></div><div className="ts-menu-text"><span className="ts-menu-title">Preview</span><span className="ts-menu-desc">View timesheet details</span></div></div>,
              onClick: () => {
                setPreviewId(record.key);
                setPreviewOpen(true);
              },
            },
            { type: "divider" },
          ];

          if (approvalMode && record.status === "SUBMITTED") {
            menuItems.push(
              {
                key: "approve",
                label: <div className="ts-menu-item"><div className="ts-menu-ic" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}><CheckCircle2 size={16} /></div><div className="ts-menu-text"><span className="ts-menu-title">Approve</span><span className="ts-menu-desc">Approve timesheet</span></div></div>,
                onClick: () => handleApprove(record.key),
              },
              {
                key: "reject",
                label: <div className="ts-menu-item"><div className="ts-menu-ic" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}><AlertCircle size={16} /></div><div className="ts-menu-text"><span className="ts-menu-title">Reject</span><span className="ts-menu-desc">Reject timesheet</span></div></div>,
                onClick: () => {
                  setTargetActionId(record.key);
                  setRejectModalOpen(true);
                },
              },
              { type: "divider" }
            );
          }

          if (!approvalMode) {
            menuItems.push(
              {
                key: "edit",
                label: <div className="ts-menu-item"><div className="ts-menu-ic" style={{ background: "rgba(100,116,139,0.12)", color: "#64748b" }}><EditOutlined /></div><div className="ts-menu-text"><span className="ts-menu-title">Edit</span><span className="ts-menu-desc">Modify timesheet details</span></div></div>,
                disabled: !canUpdateTimesheet || ["APPROVED", "REJECTED"].includes(record.status),
                onClick: () => {
                  goToSubmitTimesheet(record.key, "edit");
                },
              },
              {
                key: "resubmit",
                label: <div className="ts-menu-item"><div className="ts-menu-ic" style={{ background: "rgba(100,116,139,0.12)", color: "#64748b" }}><RedoOutlined /></div><div className="ts-menu-text"><span className="ts-menu-title">Resubmit</span><span className="ts-menu-desc">Submit timesheet again</span></div></div>,
                disabled: !canUpdateTimesheet,
                onClick: () => {
                  goToSubmitTimesheet?.(record.key, "resubmit");
                },
              },
              { type: "divider" },
              {
                key: "delete",
                danger: true,
                label: (
                  <ConfirmDialog
                    tone="danger"
                    icon={<DeleteOutlined />}
                    title="Delete Timesheet?"
                    description="Are you sure you want to permanently delete this timesheet? All recorded hours will be removed."
                    confirmText="Yes, delete it"
                    cancelText="Cancel"
                    onConfirm={async () => {
                      await deleteMutation.mutateAsync(record.key);
                      message.success("Timesheet deleted successfully!");
                    }}
                  >
                    <div
                      className="ts-menu-item"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="ts-menu-ic" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}><DeleteOutlined /></div>
                      <div className="ts-menu-text"><span className="ts-menu-title">Delete</span><span className="ts-menu-desc">Remove this timesheet</span></div>
                    </div>
                  </ConfirmDialog>
                ),
                disabled: !canDeleteTimesheet && !canManageTimesheets,
              }
            );
          }

          return (
            <Dropdown
              trigger={["click"]}
              overlayClassName="ts-action-pop"
              menu={{ items: menuItems }}
            >
              <Button className="ts-ghost-btn" icon={<MoreVertical size={16} />} />
            </Dropdown>
          );
        },
      },
    ],
    [goToSubmitTimesheet, canUpdateTimesheet, canDeleteTimesheet, canManageTimesheets],
  );

  return (
    <div className="ts-shell">
      {/* ============================ SIDEBAR ============================ */}
      {isMobileOpen && (
        <div className="ts-backdrop" onClick={() => setIsMobileOpen(false)} />
      )}
      <aside className={`ts-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
        <div className="ts-side-head">
          <div className="ts-side-logo"><Calendar size={20} /></div>
          <div className="ts-side-head-text">
            <div className="ts-side-title">Timesheets</div>
            <div className="ts-side-subtitle">Time · Tracking</div>
          </div>
        </div>

        {canCreateTimesheet && !approvalMode && !teamMode && (
          <Button
            type="primary"
            icon={<Plus size={14} />}
            className="ts-create-btn"
            onClick={() => goToSubmitTimesheet()}
            block
          >
            Create Timesheet
          </Button>
        )}

        <div className="ts-side-scroll">
          <div className="ts-side-section-label">Views</div>
          <div className="ts-side-list">
            <button type="button" className={`ts-view-item ${activeView === "all" ? "is-active" : ""}`} onClick={() => setActiveView("all")}>
              <span className="ts-view-icon" style={{ color: activeView === "all" ? "#3b82f6" : "var(--text-slate-400)" }}><FileText size={14} /></span>
              <span className="ts-view-label">All timesheets</span>
              <span className="ts-view-count">{viewCounts.all}</span>
            </button>
            <button type="button" className={`ts-view-item ${activeView === "draft" ? "is-active" : ""}`} onClick={() => setActiveView("draft")}>
              <span className="ts-view-icon" style={{ color: activeView === "draft" ? "#64748b" : "var(--text-slate-400)" }}><FileText size={14} /></span>
              <span className="ts-view-label">Drafts</span>
              <span className="ts-view-count">{viewCounts.draft}</span>
            </button>
            <button type="button" className={`ts-view-item ${activeView === "submitted" ? "is-active" : ""}`} onClick={() => setActiveView("submitted")}>
              <span className="ts-view-icon" style={{ color: activeView === "submitted" ? "#f59e0b" : "var(--text-slate-400)" }}><Clock size={14} /></span>
              <span className="ts-view-label">Pending Approval</span>
              <span className="ts-view-count">{viewCounts.submitted}</span>
            </button>
            <button type="button" className={`ts-view-item ${activeView === "approved" ? "is-active" : ""}`} onClick={() => setActiveView("approved")}>
              <span className="ts-view-icon" style={{ color: activeView === "approved" ? "#10b981" : "var(--text-slate-400)" }}><CheckCircle2 size={14} /></span>
              <span className="ts-view-label">Approved</span>
              <span className="ts-view-count">{viewCounts.approved}</span>
            </button>
            <button type="button" className={`ts-view-item ${activeView === "rejected" ? "is-active" : ""}`} onClick={() => setActiveView("rejected")}>
              <span className="ts-view-icon" style={{ color: activeView === "rejected" ? "#ef4444" : "var(--text-slate-400)" }}><AlertCircle size={14} /></span>
              <span className="ts-view-label">Rejected</span>
              <span className="ts-view-count">{viewCounts.rejected}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================ MAIN CONTENT ============================ */}
      <main className="ts-main">
        <div className="ts-body">
          <div className="ts-header-sticky">
            <div className="ts-topbar">
              <button
                className="ts-mobile-trigger"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div className="ts-search-wrap">
                <Search className="ts-search-icon" />
                <input
                  type="text"
                  className="ts-search"
                  placeholder="Search timesheets..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div className="ts-topbar-actions">
                <div className="ts-segmented">
                  <button
                    className={displayMode === 'grid' ? 'is-active' : ''}
                    onClick={() => setDisplayMode('grid')}
                    title="Grid View"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    className={displayMode === 'list' ? 'is-active' : ''}
                    onClick={() => setDisplayMode('list')}
                    title="List View"
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div className="ts-divider" />
            {/* Stats Cards */}
            <div className="ts-stats">
              <StatBox label="Total Timesheets" value={viewCounts.all} icon={FileText} color="#3b82f6" subText="All Time" />
              <StatBox label="Pending" value={viewCounts.submitted} icon={Clock} color="#f59e0b" subText="All Time" />
              <StatBox label="Approved" value={viewCounts.approved} icon={CheckCircle2} color="#10b981" subText="All Time" />
              <StatBox label="Rejected" value={viewCounts.rejected} icon={AlertCircle} color="#ef4444" subText="All Time" />
            </div>
          </div>

          {(() => {
            const total = filteredData.length;
            const pageCount = Math.ceil(total / pageSize);
            const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
            const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
            const pageEnd = Math.min(currentPage * pageSize, total);

            return (
              <>
                {/* List View */}
                {displayMode === 'list' && (
                  <div className="ts-table-wrap">
                    <Table
                      className="ts-table"
                      loading={isLoading}
                      columns={columns}
                      dataSource={pagedData}
                      rowKey="key"
                      size="middle"
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                    />
                  </div>
                )}

                {/* Grid View */}
                {displayMode === 'grid' && (
                  <div className="ts-grid">
                    {pagedData.map((record) => {
                      const config = getStatusConfig(record.status);
                      const start = dayjs(record.weekStart).day(0);
                      const end = dayjs(record.weekStart).day(6);

                      const menuItems: any[] = [
                        {
                          key: "preview",
                          label: <div className="ts-menu-item"><div className="ts-menu-ic" style={{ background: "rgba(59,130,246,0.12)", color: "#3B82F6" }}><EyeOutlined /></div><div className="ts-menu-text"><span className="ts-menu-title">Preview</span><span className="ts-menu-desc">View timesheet</span></div></div>,
                          onClick: () => { setPreviewId(record.key); setPreviewOpen(true); },
                        },
                        { type: "divider" },
                      ];

                      if (approvalMode && record.status === "SUBMITTED") {
                        menuItems.push(
                          {
                            key: "approve",
                            label: <div className="ts-menu-item"><div className="ts-menu-ic" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}><CheckCircle2 size={16} /></div><div className="ts-menu-text"><span className="ts-menu-title">Approve</span><span className="ts-menu-desc">Approve timesheet</span></div></div>,
                            onClick: () => handleApprove(record.key),
                          },
                          {
                            key: "reject",
                            label: <div className="ts-menu-item"><div className="ts-menu-ic" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}><AlertCircle size={16} /></div><div className="ts-menu-text"><span className="ts-menu-title">Reject</span><span className="ts-menu-desc">Reject timesheet</span></div></div>,
                            onClick: () => {
                              setTargetActionId(record.key);
                              setRejectModalOpen(true);
                            },
                          },
                          { type: "divider" }
                        );
                      }

                      if (!approvalMode) {
                        menuItems.push(
                          {
                            key: "edit",
                            label: <div className="ts-menu-item"><div className="ts-menu-ic" style={{ background: "rgba(100,116,139,0.12)", color: "#64748b" }}><EditOutlined /></div><div className="ts-menu-text"><span className="ts-menu-title">Edit</span><span className="ts-menu-desc">Modify timesheet</span></div></div>,
                            disabled: !canUpdateTimesheet || ["APPROVED", "REJECTED"].includes(record.status),
                            onClick: () => goToSubmitTimesheet(record.key, "edit"),
                          },
                          {
                            key: "delete",
                            danger: true,
                            label: (
                              <ConfirmDialog
                                tone="danger"
                                icon={<DeleteOutlined />}
                                title="Delete Timesheet?"
                                description="Are you sure you want to permanently delete this timesheet? All recorded hours will be removed."
                                confirmText="Yes, delete it"
                                cancelText="Cancel"
                                onConfirm={async () => {
                                  await deleteMutation.mutateAsync(record.key);
                                  message.success("Timesheet deleted successfully!");
                                }}
                              >
                                <div
                                  className="ts-menu-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <div className="ts-menu-ic" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}><DeleteOutlined /></div>
                                  <div className="ts-menu-text"><span className="ts-menu-title">Delete</span><span className="ts-menu-desc">Remove timesheet</span></div>
                                </div>
                              </ConfirmDialog>
                            ),
                            disabled: !canDeleteTimesheet && !canManageTimesheets,
                          }
                        );
                      }

                      return (
                        <div key={record.key} className="tc-card">
                          <div className="tc-top">
                            <div className="tc-avatar" style={{ background: "var(--bg-slate-100)", color: "var(--text-slate-600)" }}>
                              <Calendar size={14} />
                            </div>
                            <div className="tc-identity-body">
                              <div className="tc-title">{start.format("MMM DD")} - {end.format("MMM DD, YYYY")}</div>
                              <div className="tc-client-line">
                                <span className="tc-client-key">Hours:</span>
                                <span className="tc-client-val">{record.totalHours}</span>
                              </div>
                            </div>
                            <Dropdown
                              trigger={["click"]}
                              overlayClassName="ts-action-pop"
                              menu={{ items: menuItems }}
                            >
                              <button className="tc-actions"><MoreVertical size={14} /></button>
                            </Dropdown>
                          </div>
                          <div className="tc-foot">
                            <div className="tc-foot-row">
                              <span className="tc-foot-item">
                                <span className="tc-foot-key">Created At:</span>
                                <span className="tc-foot-val">{dayjs(record.createdAt || record.weekStart).format('MMM DD, YYYY')}</span>
                              </span>
                              <span className="tc-foot-div" />
                              <span className="tc-foot-item">
                                <span className="tc-foot-key">Created By:</span>
                                <span className="tc-foot-val">{record.employeeName || "System"}</span>
                              </span>
                              <span className="tc-foot-div" />
                              <span className="tc-foot-item">
                                <span className="tc-foot-key">Updated:</span>
                                <span className="tc-foot-val">{dayjs(record.createdAt || record.weekStart).format('MMM DD, YYYY')}</span>
                              </span>
                            </div>
                            <div className="tc-foot-row">
                              <span className="tc-foot-item">
                                <span className="tc-foot-key">Status:</span>
                                <span className="tc-status-tag" style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
                                  {config.icon} {config.label}
                                </span>
                              </span>
                              <span className="tc-foot-div" />
                              <span className="tc-foot-item">
                                <span className="tc-foot-key">Leaves:</span>
                                <span className="tc-foot-val">{record.leave} Days</span>
                              </span>
                              <span className="tc-foot-div" />
                              <span className="tc-foot-item">
                                <span className="tc-foot-key">Approver:</span>
                                <span className="tc-foot-val">{(record.approvedBy as any)?.name || "Pending"}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredData.length === 0 && !isLoading && (
                      <div className="ts-grid-loading">No timesheets found.</div>
                    )}
                  </div>
                )}

                {/* Sticky footer pagination */}
                {total > 0 && (
                  <div className="pp-footer pp-footer--sticky">
                    <div className="pp-footer-info">
                      Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
                    </div>
                    <div className="pp-pager">
                      <button type="button" className="pp-pager-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</button>
                      {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((p) => (
                        <button key={p} type="button" className={`pp-pager-num ${p === currentPage ? 'is-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                      ))}
                      <button type="button" className="pp-pager-btn" disabled={currentPage >= pageCount} onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}>›</button>
                      <Select
                        className="pp-pagesize"
                        value={pageSize}
                        onChange={(v) => { setPageSize(v); setCurrentPage(1); }}
                        options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                        popupMatchSelectWidth={120}
                      />
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </main>

      {/* MODALS AND DRAWERS */}
      <Modal
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReasonInput("");
        }}
        onOk={handleReject}
        title="Reject Timesheet"
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 16 }}>
          <Typography.Text strong>Reason for Rejection</Typography.Text>
          <Input.TextArea
            rows={4}
            placeholder="Provide a reason for rejecting this timesheet..."
            value={rejectReasonInput}
            onChange={(e) => setRejectReasonInput(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>

      <Modal
        open={showRejectReasonModal}
        onCancel={() => setShowRejectReasonModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowRejectReasonModal(false)} style={{ borderRadius: 8 }}>
            Got it
          </Button>
        ]}
        centered
        width={450}
        title={<div style={{ display: "flex", alignItems: "center", gap: 10 }}><AlertCircle size={20} color="#ef4444" /> Rejection Reason</div>}
      >
        <div style={{ padding: "8px 0" }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>Manager feedback for this timesheet:</Text>
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 10, padding: 16, color: "var(--text-slate-900)", lineHeight: 1.6 }}>
            {currentRejectReason || "No reasons provided."}
          </div>
        </div>
      </Modal>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={850}
        centered
        closable={false}
        className="ts-preview-modal"
        title={null}
        footer={null}
        bodyStyle={{ padding: 0, borderRadius: 0 }}
        wrapClassName="ts-preview-modal-wrap"
      >
        <div style={{ padding: "20px 24px", background: "transparent", borderBottom: "1px solid var(--border-slate-200)", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", borderRadius: 8 }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-slate-900)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>Timesheet Overview</div>
              <div style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500, marginTop: 2 }}>Detailed view of submitted hours</div>
            </div>
          </div>
          <Button type="text" icon={<X size={20} />} onClick={() => setPreviewOpen(false)} style={{ color: "var(--text-slate-400)" }} />
        </div>

        {previewTimesheetData && (
          <div style={{ padding: "24px", background: "transparent" }}>
            {/* Top Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "transparent", border: "1px solid var(--border-slate-200)", padding: "16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar size={42} style={{ backgroundColor: "var(--bg-sky-50)", color: "var(--text-sky-500)", fontWeight: 700, border: "1px solid rgba(14,165,233,0.15)" }}>
                  {previewTimesheetData.user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-slate-400)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Employee</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-slate-900)" }}>{previewTimesheetData.user?.name}</div>
                </div>
              </div>

              <div style={{ background: "transparent", border: "1px solid var(--border-slate-200)", padding: "16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 8, background: "transparent", border: "1px solid var(--border-slate-200)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-slate-600)" }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-slate-400)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Period</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-slate-900)" }}>
                    {dayjs(previewTimesheetData.weekStart).format("MMM DD")} – {dayjs(previewTimesheetData.weekEnd).format("MMM DD")}
                  </div>
                </div>
              </div>

              {(() => {
                const status = previewTimesheetData.status;
                const c = getStatusConfig(status);
                return (
                  <div style={{ background: "transparent", border: "1px solid var(--border-slate-200)", padding: "16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, border: `1px solid ${c.border}` }}>
                      {c.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-slate-400)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Status & Hours</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: c.color }}>{status}</span>
                        <span style={{ color: "var(--text-slate-300)" }}>|</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-slate-900)" }}>{previewTimesheetData.totalHours}h</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Table Area */}
            <div style={{ background: "transparent", border: "1px solid var(--border-slate-200)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-slate-200)", display: "flex", alignItems: "center", gap: 8, background: "rgba(59, 130, 246, 0.05)" }}>
                <List size={16} color="var(--text-slate-500)" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-slate-800)" }}>Time Entries</span>
              </div>
              <Table
                className="ts-preview-table-enhanced"
                columns={previewColumns as any}
                dataSource={getPreviewRows()}
                pagination={false}
                rowKey="id"
                size="small"
                loading={!previewTimesheetData}
                bordered={false}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Task Description"
        open={isDescModalOpen}
        onCancel={closeDesc}
        footer={null}
        width={600}
        centered
      >
        <div style={{ background: "var(--bg-slate-50)", padding: 20, borderRadius: 12, border: "1px solid var(--border-color)" }}>
          <Text style={{ whiteSpace: "pre-wrap", color: "var(--text-slate-700)", lineHeight: 1.6 }}>{selectedDesc}</Text>
        </div>
      </Modal>

      <style jsx global>{`
        /* Premium action dropdown */
        .ts-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          overflow: hidden !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .ts-action-pop .ant-dropdown-menu::-webkit-scrollbar { display: none !important; }
        .ts-action-pop,
        .ts-action-pop * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .ts-action-pop ::-webkit-scrollbar { display: none !important; }
        .ts-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
          overflow: hidden !important;
        }
        .ts-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .ts-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .ts-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .ts-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .ts-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .ts-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .ts-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .ts-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .ts-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .ts-action-pop .ant-dropdown-menu-item-danger .ts-menu-title { color: #ef4444; }
        .ts-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .ts-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

        [data-theme="dark"] .ts-action-pop .ant-dropdown-menu {
          background: var(--bg-pure-white) !important;
          border-color: var(--border-slate-100) !important;
        }
        [data-theme="dark"] .ts-action-pop .ant-dropdown-menu-item:hover {
          background: var(--bg-slate-50) !important;
        }

        .ts-preview-table-enhanced .ant-table-thead > tr > th {
          background: transparent !important;
          color: var(--text-slate-500) !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-weight: 700 !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          border-radius: 0 !important;
        }
        .ts-preview-table-enhanced .ant-table-thead > tr > th::before {
          display: none !important;
        }
        .ts-preview-table-enhanced .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          font-size: 13px !important;
          color: var(--text-slate-700) !important;
        }

        .ts-shell {
          display: flex;
          margin: 0;
          min-height: calc(100vh - 54px);
          background: transparent;
        }
        .ts-shell,
        .ts-shell *,
        .ant-table,
        .ant-btn,
        .ant-select,
        .ant-picker,
        .ant-input,
        .ant-modal,
        .ant-drawer,
        .ant-tooltip,
        .ant-popconfirm,
        .ant-dropdown {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif !important;
        }

        /* ---------------- Sidebar ---------------- */
        .ts-sidebar {
          width: 264px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: transparent;
          display: flex;
          flex-direction: column;
          padding: 14px 16px 0 16px;
          position: sticky;
          top: 0;
          align-self: flex-start;
          height: calc(100vh - 54px);
          z-index: 31;
        }
        .ts-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .ts-side-logo {
          width: 32px; height: 32px; border-radius: 8px;
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        .ts-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .ts-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .ts-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .ts-create-btn {
          height: 35px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          background: #3B82F6 !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 12px;
          color: #fff !important;
        }
        .ts-create-btn:hover { background: #2563EB !important; }
        .ts-create-btn .anticon { font-size: 12px !important; }
        .ts-side-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .ts-side-scroll::-webkit-scrollbar {
          display: none;
        }
        .ts-side-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); margin: 0 0 6px 8px;
        }
        .ts-side-scroll > .ts-side-section-label:first-child { margin-top: 6px; }
        .ts-side-list { display: flex; flex-direction: column; gap: 1px; }
        .ts-view-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
          cursor: pointer; transition: background .12s ease; text-align: left;
        }
        .ts-view-item:hover { background: var(--bg-slate-50); }
        .ts-view-item.is-active { background: var(--bg-blue-50); }
        .ts-view-item.is-active .ts-view-label { color: var(--text-slate-900); font-weight: 600; }
        .ts-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
        .ts-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .ts-view-count {
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
          min-width: 18px; text-align: right;
        }
        .ts-view-item.is-active .ts-view-count {
          color: #3B82F6; font-weight: 700;
          background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
        }

        /* Footer + pager */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
        }
        .pp-footer--sticky {
          position: sticky; bottom: 0; z-index: 30;
          margin: auto -32px 0 -20px;
          padding: 0 32px 0 20px;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          height: 45px;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* ---------------- Main ---------------- */
        .ts-main { flex: 1; min-width: 0; padding: 8px 32px 0 20px; display: flex; flex-direction: column; }
        .ts-body { flex: 1 0 auto; padding-bottom: 0px; min-width: 0; display: flex; flex-direction: column; }
        .ts-header-sticky {
          position: sticky;
          top: 0;
          z-index: 20;
          background: var(--bg-pure-white);
          padding-top: 8px;
          padding-bottom: 4px;
          margin-top: -8px;
        }
        .ts-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
        .ts-mobile-trigger {
          display: none; width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-700); cursor: pointer;
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ts-search-wrap {
          position: relative; flex: 1; max-width: 520px; min-width: 240px; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .ts-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .ts-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .ts-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900);
        }
        .ts-search::placeholder { color: var(--text-slate-400); }
        
        .ts-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .ts-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .ts-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }

        .ts-divider { height: 1px; background: var(--border-slate-200); margin: 0 -32px 10px -20px; }

        /* Stat cards */
        .ts-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .ts-stat-card {
          background: transparent; border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .ts-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .ts-stat-left { display: flex; align-items: center; gap: 8px; }
        .ts-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .ts-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .ts-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .ts-stat-value-wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .ts-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .ts-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; white-space: nowrap; }
        .ts-stat-spark { opacity: 0.95; }

        /* Table */
        .ts-table-wrap { background: transparent; border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .ts-table-wrap ::-webkit-scrollbar { display: none !important; }
        .ts-table-wrap, .ts-table-wrap * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ts-table, .ts-table.ant-table-wrapper, .ts-table .ant-table, .ts-table .ant-table-container, .ts-table .ant-table-content, .ts-table .ant-table-header, .ts-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .ts-table .ant-table-thead > tr > th,
        .ts-table .ant-table-thead > tr > td {
          background: transparent !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .ts-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 10px !important; }
        .ts-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .ts-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        
        /* Grid view cards */
        .ts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .ts-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .tc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: transparent;
          overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .tc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .tc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; height: 64px; overflow: hidden; }
        .tc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .tc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .tc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .tc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .tc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .tc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .tc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .tc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .tc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: transparent; justify-content: center; }
        .tc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .tc-foot-row + .tc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .tc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }
        .tc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .tc-foot-val { font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: 600; }
        .tc-foot-div { width: 1px; height: 12px; background: var(--border-slate-200); margin: 0 4px; flex-shrink: 0; }
        .tc-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .tc-view-btn:hover { text-decoration: underline; }
        .tc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }

        .ts-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: transparent; }
        .ts-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .ts-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }

        .ts-backdrop {
          display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(2px); z-index: 999;
        }
        @media (max-width: 1024px) {
          .ts-main { padding: 8px 16px 0 16px; }
          .ts-mobile-trigger { display: inline-flex; }
          .ts-sidebar {
            position: fixed; left: -280px; top: 54px; bottom: 0; height: calc(100vh - 54px);
            transition: left 0.3s ease; z-index: 1000; box-shadow: 4px 0 24px rgba(15, 23, 42, 0.1);
            background: var(--bg-pure-white);
          }
          .ts-sidebar.is-open { left: 0; }
          .ts-backdrop { display: block; }
          .ts-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .ts-stats { grid-template-columns: 1fr; }
        }
        @media (max-width: 700px) {
          .ts-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}