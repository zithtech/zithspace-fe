
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
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const { Title, Text } = Typography;

/* ------------------ Data ------------------ */
type Props = {
  goToSubmitTimesheet: (id?: string, mode?: "edit" | "resubmit") => void;
};

export default function TimesheetsTab({ goToSubmitTimesheet }: Props) {
  const router = useRouter();
  // For showing the rejection reason modal
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [currentRejectReason, setCurrentRejectReason] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const deleteMutation = useDeleteTimesheet();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  const { data: allTimesheets, isLoading } = useTimesheets();

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
              <div style={{ padding: "4px 8px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <Text style={{ fontSize: 13, color: "#475569" }}>{start.format("MMM DD")}</Text>
              </div>
              <ChevronRight size={14} color="#94a3b8" />
              <div style={{ padding: "4px 8px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <Text style={{ fontSize: 13, color: "#475569" }}>{end.format("MMM DD")}</Text>
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
          <Tag style={{ borderRadius: 20, background: "#eff6ff", border: "1px solid #dbeafe", color: "#1d4ed8", fontWeight: 600, padding: "0 12px" }}>
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
                  disabled: ["APPROVED", "REJECTED"].includes(record.status),
                  onClick: () => {
                    goToSubmitTimesheet(record.key, "edit");
                  },
                },
                {
                  key: "resubmit",
                  icon: <RedoOutlined />,
                  label: "Resubmit",
                  onClick: () => {
                    goToSubmitTimesheet?.(record.key, "resubmit");
                  },
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Delete",
                  danger: true,
                  onClick: () => {
                    setDeleteId(record.key);
                    setShowDeleteModal(true);
                  },
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreVertical size={16} color="#64748b" />} />
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
      padding: "0 32px 24px 32px",
      background: "#ffffff",
      height: "calc(100vh - 72px)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* Header Section */}
      <div style={{
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 24,
        position: "sticky",
        top: 0,
        background: "#ffffff",
        zIndex: 10,
        padding: "24px 0 12px 0"
      }}>
        <div style={{ flex: 1 }}>
          <Space size={14} align="center">
            <div style={{ background: "#f0f9ff", padding: 12, borderRadius: 14, color: "#0ea5e9", display: "flex" }}>
              <FileText size={28} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Timesheets</Title>
              <Text style={{ color: "#64748b", fontSize: 15 }}>Manage and track your weekly timesheet submissions.</Text>
            </div>
          </Space>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Input
            placeholder="Search timesheets..."
            prefix={<Search size={16} color="#94a3b8" />}
            style={{ width: 280, borderRadius: 12, height: 44, border: "1px solid #e2e8f0" }}
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
              style={{ borderRadius: 12, height: 44, display: "flex", alignItems: "center", gap: 8 }}
              icon={<Filter size={16} />}
            >
              {statusFilter ? statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase() : "Filter"}
            </Button>
          </Dropdown>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            style={{ borderRadius: 10, height: 44, fontWeight: 500 }}
            onClick={() => goToSubmitTimesheet()}
          >
            Create Timesheet
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, scrollbarWidth: "none" }}>
        {/* Mini Stats Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {stats.map(stat => (
            <Col key={stat.label} xs={24} sm={8}>
              <div style={{
                padding: "16px 20px",
                background: `${stat.color}08`,
                borderRadius: 14,
                border: `1px solid ${stat.color}15`,
                display: "flex",
                alignItems: "center",
                gap: 12
              }}>
                <div style={{ color: stat.color, background: `${stat.color}15`, padding: 8, borderRadius: 10, display: "flex" }}>
                  <stat.icon size={18} />
                </div>
                <div>
                  <Text style={{ color: "#64748b", fontSize: 13, display: "block" }}>{stat.label}</Text>
                  <Text style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{stat.value}</Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <Card
          bordered={false}
          style={{ borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", overflow: "hidden" }}
          bodyStyle={{ padding: "0" }}
        >
          <Table
            loading={isLoading}
            columns={columns}
            dataSource={filteredData}
            rowKey="key"
            size="middle"
            pagination={{ pageSize: 10, position: ["bottomRight"], style: { padding: "12px 24px", margin: 0 } }}
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
          <div style={{ background: "#fff1f0", border: "1px solid #ffa39e", borderRadius: 10, padding: 16, color: "#1e293b", lineHeight: 1.6 }}>
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
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
            {previewTimesheetData && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar size={36} style={{ backgroundColor: "#f0f9ff", color: "#0ea5e9", fontWeight: 700, fontSize: 14 }}>
                    {previewTimesheetData.user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Text strong style={{ margin: 0, color: "#1e293b", fontSize: 15, display: "block", lineHeight: 1.2 }}>{previewTimesheetData.user?.name}</Text>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Calendar size={12} color="#94a3b8" />
                      <Text style={{ fontSize: 12, color: "#64748b" }}>
                        {dayjs(previewTimesheetData.weekStart).format("MMM DD")} – {dayjs(previewTimesheetData.weekEnd).format("MMM DD, YYYY")}
                      </Text>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Tag style={{ borderRadius: 6, fontWeight: 600, fontSize: 11, margin: 0, padding: "2px 10px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}>Total: {previewTimesheetData.totalHours}h</Tag>
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
          <div key="footer" style={{ padding: "12px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
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
        <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <Text style={{ whiteSpace: "pre-wrap", color: "#334155", lineHeight: 1.6 }}>{selectedDesc}</Text>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .history-table-row:hover {
          background-color: #f8fafc !important;
          cursor: pointer;
        }
        .ant-table-thead > tr > th {
          background-color: #f1f5f9 !important;
          color: #475569 !important;
          font-weight: 600 !important;
          padding: 12px 16px !important;
          border-bottom: 2px solid #e2e8f0 !important;
        }
        .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
      `}} />
    </div>
  );
}