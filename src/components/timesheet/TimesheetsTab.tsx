
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
} from "lucide-react";
import dayjs from "dayjs";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useTimesheets,
  useDeleteTimesheet,
  useTimesheetById,
} from "@/hooks/useTimesheet";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import utc from "dayjs/plugin/utc";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

dayjs.extend(utc);

const { Title, Text } = Typography;

/* ------------------ Data ------------------ */
type Props = {
  goToSubmitTimesheet: (id?: string, mode?: "edit" | "resubmit") => void;
};

export default function TimesheetsTab({ goToSubmitTimesheet }: Props) {
  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card
      bodyStyle={{ padding: "16px 20px" }}
      style={{
        borderRadius: 12,
        background: "var(--bg-pure-white)",
        border: "1px solid var(--border-slate-100)",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "var(--text-slate-600)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 4 }}>{value}</div>
        </div>
        <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );

  const router = useRouter();
  // For showing the rejection reason modal
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [currentRejectReason, setCurrentRejectReason] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const deleteMutation = useDeleteTimesheet();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { canCreateTimesheet, canUpdateTimesheet, canDeleteTimesheet, canManageTimesheets } = usePermission();
  const { message } = App.useApp();
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");

  const closeDesc = () => {
    setIsDescModalOpen(false);
    setSelectedDesc("");
  };

  const { data: previewTimesheetData, refetch } = useTimesheetById(
    previewId || undefined,
  );

  const { user } = useAuth();

  const { data: allTimesheets, isLoading } = useTimesheets({ userId: user?.id });

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

  // Updated previewColumns to show dynamic dates based on each row's actual date
  const previewColumns = [
    {
      title: "Date",
      render: (_: any, row: any) => {
        if (!previewTimesheetData?.weekStart) return "-";
        if (row.day) return dayjs(row.day).format("MMM DD");
        if (row.date) return dayjs(row.date).format("MMM DD");
        return "-";
      },
    },
    {
      title: "Project",
      dataIndex: "projectName",
      render: (text: string) => text || "-",
    },
    {
      title: "Task",
      dataIndex: "taskName",
      render: (text: string) => text || "-",
    },
    {
      title: "Description",
      render: (_: any, row: any) => {
        const preview = row.description ? row.description.slice(0, 30) : "";
        const hasMore = row.description && row.description.length > 30;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>
              {preview}
              {hasMore ? "..." : ""}
            </span>
            {row.description && row.description.length > 0 && (
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedDesc(row.description || "");
                  setIsDescModalOpen(true);
                }}
              />
            )}
          </div>
        );
      },
      dataIndex: "description",
    },
    {
      title: "Hours",
      dataIndex: "hours",
      render: (h: number) => (h ? `${h}h` : "0h"),
    },
    {
      title: "Billable",
      dataIndex: "billable",
      render: (v: boolean) => (v ? "Yes" : "No"),
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
      {
        title: "Status",
        dataIndex: "status",
        render: (status: string, record: any) => {
          const statusConfig: any = {
            APPROVED: { color: "#10b981", icon: <CheckCircle2 size={14} />, label: "Approved" },
            REJECTED: { color: "#ef4444", icon: <AlertCircle size={14} />, label: "Rejected" },
            SUBMITTED: { color: "#f59e0b", icon: <Clock size={14} />, label: "Submitted" },
            DRAFT: { color: "#3b82f6", icon: <FileText size={14} />, label: "Draft" },
          };
          const config = statusConfig[status] || { color: "#64748b", icon: <Clock size={14} />, label: status };

          return (
            <Space>
              <Tag
                icon={config.icon}
                style={{
                  borderRadius: 6,
                  background: `${config.color}12`,
                  color: config.color,
                  border: `1px solid ${config.color}30`,
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
        render: (_: any, record: any) => (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "preview",
                  icon: <EyeOutlined />,
                  label: "Preview",
                  onClick: () => {
                    setPreviewId(record.key);
                    setPreviewOpen(true);
                  },
                },
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit",
                  disabled: !canUpdateTimesheet || ["APPROVED", "REJECTED"].includes(record.status),
                  onClick: () => {
                    goToSubmitTimesheet(record.key, "edit");
                  },
                },
                {
                  key: "resubmit",
                  icon: <RedoOutlined />,
                  label: "Resubmit",
                  disabled: !canUpdateTimesheet,
                  onClick: () => {
                    goToSubmitTimesheet?.(record.key, "resubmit");
                  },
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Delete",
                  danger: true,
                  disabled: !canDeleteTimesheet && !canManageTimesheets,
                  onClick: () => {
                    setDeleteId(record.key);
                    setShowDeleteModal(true);
                  },
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreVertical size={16} color="var(--text-slate-400)" />} />
          </Dropdown>
        ),
      },
    ],
    [goToSubmitTimesheet],
  );

  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const search = searchText.toLowerCase();
      const matchesSearch =
        item.employeeName?.toLowerCase().includes(search) ||
        item.status?.toLowerCase().includes(search) ||
        dayjs(item.weekStart).format("MMM DD").toLowerCase().includes(search);
      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tableData, searchText, statusFilter]);

  const stats = [
    { label: "Approved", value: filteredData.filter(t => t.status === "APPROVED").length, color: "#10b981", icon: CheckCircle2 },
    { label: "Pending", value: filteredData.filter(t => t.status === "SUBMITTED").length, color: "#f59e0b", icon: Clock },
    { label: "Rejected", value: filteredData.filter(t => t.status === "REJECTED").length, color: "#ef4444", icon: AlertCircle },
  ];

  return (
    <div style={{
      margin: "0 -24px",
      background: "var(--bg-pure-white)",
      height: "calc(100vh - 64px)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      <TimeTrackingHeader
        style={{ padding: '9.5px 32px' }}
        icon={<FileText size={20} color="#0ea5e9" />}
        title="Timesheets"
        description="Manage and track your weekly timesheet submissions."
        extra={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Input
              placeholder="Search timesheets..."
              prefix={<Search size={16} color="var(--text-slate-400)" />}
              style={{ width: 280, borderRadius: 12, height: 38, border: "1px solid var(--border-slate-200)" }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Dropdown
              menu={{
                items: [
                  { key: "all", label: "All Statuses" },
                  { key: "APPROVED", label: "Approved" },
                  { key: "REJECTED", label: "Rejected" },
                  { key: "SUBMITTED", label: "Submitted" },
                  { key: "DRAFT", label: "Draft" },
                ],
                onClick: ({ key }) => setStatusFilter(key === "all" ? null : key),
              }}
            >
              <Button
                style={{ borderRadius: 12, height: 38, display: "flex", alignItems: "center", gap: 8 }}
                icon={<Filter size={16} />}
              >
                {statusFilter ? statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase() : "Filter"}
              </Button>
            </Dropdown>
            {canCreateTimesheet && (
              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                style={{ borderRadius: 10, height: 38, fontWeight: 500 }}
                onClick={() => goToSubmitTimesheet()}
              >
                Create Timesheet
              </Button>
            )}
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 32px 32px 32px", scrollbarWidth: "none" }}>
        {/* Mini Stats Row */}
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          {stats.map(stat => (
            <Col key={stat.label} xs={24} sm={8}>
              <StatCard
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
              />
            </Col>
          ))}
        </Row>

        <Card
          bordered={false}
          style={{ borderRadius: 16, background: "var(--bg-pure-white)", border: "1px solid var(--border-slate-100)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", overflow: "hidden" }}
          bodyStyle={{ padding: "0" }}
        >
          <Table
            loading={isLoading}
            columns={columns}
            dataSource={filteredData}
            rowKey="key"
            size="middle"
            pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 20, position: ["bottomRight"], style: { padding: "12px 24px", margin: 0 } }}
            rowClassName={() => "history-table-row"}
            scroll={{ x: 1000 }}
          />
        </Card>
      </div>

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
        width={720}
        centered
        bodyStyle={{ padding: "0" }}
        title={
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-slate-100)" }}>
            {previewTimesheetData && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar size={36} style={{ backgroundColor: "var(--bg-sky-50)", color: "var(--text-sky-500)", fontWeight: 700, fontSize: 14 }}>
                    {previewTimesheetData.user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Text strong style={{ margin: 0, color: "var(--text-slate-900)", fontSize: 15, display: "block", lineHeight: 1.2 }}>{previewTimesheetData.user?.name}</Text>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Calendar size={12} color="var(--text-slate-400)" />
                      <Text style={{ fontSize: 12, color: "var(--text-slate-600)" }}>
                        {dayjs(previewTimesheetData.weekStart).format("MMM DD")} – {dayjs(previewTimesheetData.weekEnd).format("MMM DD, YYYY")}
                      </Text>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Tag style={{ borderRadius: 6, fontWeight: 600, fontSize: 11, margin: 0, padding: "2px 10px", background: "var(--bg-slate-50)", border: "1px solid var(--border-slate-200)", color: "var(--text-slate-700)" }}>Total: {previewTimesheetData.totalHours}h</Tag>
                  {(() => {
                    const status = previewTimesheetData.status;
                    const config: any = {
                      APPROVED: { color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
                      REJECTED: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                      SUBMITTED: { color: "#f59e0b", bg: "#fffbeb", border: "#fef3c7" },
                    };
                    const c = config[status] || { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
                    return (
                      <Tag style={{
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 11,
                        margin: 0,
                        padding: "2px 10px",
                        color: c.color,
                        background: c.bg,
                        border: `1px solid ${c.border}`
                      }}>
                        {status}
                      </Tag>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        }
        footer={[
          <div key="footer" style={{ padding: "12px 24px", borderTop: "1px solid var(--border-slate-100)", display: "flex", justifyContent: "flex-end" }}>
            <Button key="close" onClick={() => setPreviewOpen(false)} style={{ borderRadius: 8, height: 38, padding: "0 24px", fontWeight: 500 }}>
              Close
            </Button>
          </div>
        ]}
      >
        <div style={{ padding: "0 24px 24px 24px" }}>
          <Table
            columns={previewColumns as any}
            dataSource={getPreviewRows()}
            pagination={false}
            bordered={false}
            rowKey="id"
            size="small"
            loading={!previewTimesheetData}
          />
        </div>
      </Modal>

      <Modal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        centered
        title="Confirm Deletion"
        okText="Delete"
        okButtonProps={{ danger: true, style: { borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        onOk={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId, {
              onSuccess: () => {
                setShowDeleteModal(false);
                message.success("Timesheet deleted successfully!");
              },
            });
          }
        }}
      >
        <Text>Are you sure you want to delete this timesheet? This action cannot be undone.</Text>
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

      <style dangerouslySetInnerHTML={{
        __html: `
        .history-table-row:hover {
          background-color: var(--bg-slate-50) !important;
          cursor: pointer;
        }
        .ant-table-thead > tr > th {
          background-color: var(--bg-table-header) !important;
          color: var(--text-slate-900) !important;
          font-weight: 600 !important;
          padding: 12px 16px !important;
          border-bottom: 2px solid var(--border-slate-200) !important;
        }
        .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
          background-color: var(--bg-pure-white) !important;
          color: var(--text-slate-600) !important;
        }
      `}} />
    </div>
  );
}