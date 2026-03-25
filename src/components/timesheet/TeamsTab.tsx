"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Table,
  Typography,
  Space,
  Select,
  Tag,
  Button,
  Dropdown,
  Divider,
  Modal,
  Drawer,
  Input,
  Avatar,
  message,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  EyeOutlined,
  WarningOutlined,
  CloseOutlined,
  CheckOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import {
  Users,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  MoreVertical,
  FileText,
  Mail,
} from "lucide-react";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useTimesheets, useTimesheetById } from "@/hooks/useTimesheet";
import { reviewTimesheet } from "@/services/timesheetService";

interface TimesheetRowUI {
  id?: string;
  key: string;
  day: string;
  date: string;
  projectId?: string;
  taskId?: string;
  description?: string;
  hours?: number;
  billable?: boolean;
  status?: "Draft" | "Submitted" | "Approved" | "Rejected";
  isSummary?: boolean;
  employeeName: string;
  projectName?: string;
  taskName?: string;
}

const { Title, Text } = Typography;

type Props = {
  goToSubmitTimesheet: (id?: string, mode?: "edit" | "resubmit") => void;
  onActionCompleted?: () => void;
};

export default function TeamsTab({
  goToSubmitTimesheet,
  onActionCompleted,
}: Props) {
  const router = useRouter();

  /* ---------------- STATE ---------------- */
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const [selectedTimesheet, setSelectedTimesheet] = useState<any | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");

  const closeDesc = () => {
    setIsDescModalOpen(false);
    setSelectedDesc("");
  };

  const timesheetRows: TimesheetRowUI[] = selectedTimesheet
    ? [...selectedTimesheet.rows]
      .sort((a: any, b: any) => {
        let dateA = a.day ? dayjs(a.day) : a.date ? dayjs(a.date) : dayjs(selectedTimesheet.weekStart);
        let dateB = b.day ? dayjs(b.day) : b.date ? dayjs(b.date) : dayjs(selectedTimesheet.weekStart);
        return dateA.valueOf() - dateB.valueOf();
      })
      .map((row: any, index: number) => {
        let dateObj = row.day ? dayjs(row.day) : row.date ? dayjs(row.date) : dayjs(selectedTimesheet.weekStart).add(index, "day");
        return {
          key: row.id || `row-${index}-${Math.random()}`,
          id: row.id,
          day: dateObj.format("ddd"),
          date: dateObj.format("MMM DD"),
          employeeName: selectedTimesheet.user?.name || "Unknown",
          projectName: row.projectName,
          taskName: row.taskName,
          description: row.description || "",
          hours: row.hours,
          status: selectedTimesheet.status,
          billable: row.billable,
        };
      })
    : [];

  const { data: timesheetsData, isLoading } = useTimesheets();
  const timesheets = timesheetsData?.data || [];

  const filteredData = useMemo(() => {
    return timesheets.filter((t) => {
      const userId = t.user?.id;
      const memberOk = selectedMembers.length === 0 || (userId ? selectedMembers.includes(userId) : false);
      const weekOk = selectedWeek ? dayjs(t.weekStart).startOf("week").isSame(dayjs(selectedWeek), "day") : true;
      return memberOk && weekOk;
    });
  }, [timesheets, selectedMembers, selectedWeek]);

  const members = useMemo(() => {
    const map = new Map();
    timesheets.forEach((t) => {
      if (t.user) map.set(t.user.id, { id: t.user.id, name: t.user.name });
    });
    return Array.from(map.values());
  }, [timesheets]);

  const weekOptions = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < 6; i++) {
      const start = dayjs().startOf("week").subtract(i, "week");
      const end = start.add(6, "day");
      weeks.push({
        label: `${start.format("MMM DD")} – ${end.format("MMM DD")}`,
        value: start.format("YYYY-MM-DD"),
      });
    }
    return weeks;
  }, []);

  /* ---------------- COUNTS ---------------- */
  const approvedCount = filteredData.filter(t => t.status === "APPROVED").length;
  const pendingCount = filteredData.filter(t => t.status === "SUBMITTED").length;
  const rejectedCount = filteredData.filter(t => t.status === "REJECTED").length;

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    {
      title: "Employee",
      render: (_: any, r: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar size={36} style={{ backgroundColor: "#f0f9ff", color: "#0ea5e9", fontWeight: 600 }}>
            {r.user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ display: "block", color: "#1e293b", fontSize: 14 }}>{r.user?.name}</Text>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Mail size={12} color="#94a3b8" />
              <Text style={{ color: "#64748b", fontSize: 12 }}>{r.user?.email}</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Week Period",
      render: (_: any, r: any) => {
        const start = dayjs(r.weekStart);
        const end = start.add(6, "day");
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
      render: (_: any, r: any) => {
        const config: any = {
          APPROVED: { color: "#10b981", icon: <CheckCircle2 size={14} />, label: "Approved" },
          REJECTED: { color: "#ef4444", icon: <AlertCircle size={14} />, label: "Rejected" },
          SUBMITTED: { color: "#f59e0b", icon: <Clock size={14} />, label: "Submitted" },
          DRAFT: { color: "#3b82f6", icon: <FileText size={14} />, label: "Draft" },
        };
        const st = config[r.status] || { color: "#64748b", icon: <Clock size={14} />, label: r.status };
        return (
          <Tag
            icon={st.icon}
            style={{
              borderRadius: 6,
              background: `${st.color}12`,
              color: st.color,
              border: `1px solid ${st.color}30`,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 500
            }}
          >
            {st.label}
          </Tag>
        );
      },
    },
    {
      title: "Total Hours",
      dataIndex: "totalHours",
      render: (h: number) => (
        <Tag style={{ borderRadius: 20, background: "#eff6ff", border: "1px solid #dbeafe", color: "#1d4ed8", fontWeight: 600, padding: "0 12px" }}>
          {h}h
        </Tag>
      ),
    },
    {
      title: "Actions",
      align: "center" as const,
      render: (_: any, r: any) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "Review Timesheet",
                onClick: () => {
                  setSelectedTimesheet(r);
                  setIsModalOpen(true);
                },
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreVertical size={16} color="#64748b" />} />
        </Dropdown>
      ),
    },
  ];

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTimesheet(null);
  };

  const handleExport = (rows: TimesheetRowUI[]) => {
    if (!rows.length) return;
    const headers = ["Date", "Day", "Employee", "Project", "Task", "Description", "Hours", "Billable", "Status"];
    const csvRows = rows.map((r) => [r.date, r.day, r.employeeName, r.projectName ?? "", r.taskName ?? "", r.description ?? "", r.hours ?? 0, r.billable ? "Yes" : "No", r.status ?? "Draft"]);
    const csvContent = [headers, ...csvRows].map((row) => row.map(String).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheet_${selectedTimesheet?.user?.name || "export"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: "Approved", value: approvedCount, color: "#10b981", icon: CheckCircle2 },
    { label: "Pending", value: pendingCount, color: "#f59e0b", icon: Clock },
    { label: "Rejected", value: rejectedCount, color: "#ef4444", icon: AlertCircle },
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
              <Users size={28} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Team Timesheets</Title>
              <Text style={{ color: "#64748b", fontSize: 15 }}>Review and manage timesheet submissions from your team members.</Text>
            </div>
          </Space>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Select
            mode="multiple"
            placeholder="Search members..."
            style={{ width: 220, height: 44 }}
            className="custom-select-44"
            value={selectedMembers}
            onChange={setSelectedMembers}
            options={members.map((m) => ({ label: m.name, value: m.id }))}
            maxTagCount="responsive"
          />
          <Select
            placeholder="Filter by week"
            style={{ width: 200, height: 44 }}
            value={selectedWeek}
            onChange={setSelectedWeek}
            options={weekOptions}
            allowClear
            suffixIcon={<Calendar size={16} color="#94a3b8" />}
          />
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, scrollbarWidth: "none" }}>
        {/* Stats Row */}
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
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          size="middle"
          loading={isLoading}
          pagination={{ pageSize: 10, position: ["bottomRight"], style: { padding: "12px 24px", margin: 0 } }}
          rowClassName={() => "history-table-row"}
          scroll={{ x: 1000 }}
        />
      </Card>
      </div>

      {/* Review Modal */}
      <Modal
        title={
          <div style={{ padding: "16px 0", borderBottom: "1px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar size={40} style={{ backgroundColor: "#0ea5e9", fontWeight: 700, fontSize: 16 }}>
                  {selectedTimesheet?.user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text strong style={{ margin: 0, color: "#1e293b", fontSize: 16, display: "block", lineHeight: 1.2 }}>{selectedTimesheet?.user?.name}</Text>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <Tag color={selectedTimesheet?.status === "APPROVED" ? "success" : selectedTimesheet?.status === "REJECTED" ? "error" : "warning"} style={{ borderRadius: 6, fontWeight: 600, fontSize: 11, margin: 0 }}>
                      {selectedTimesheet?.status || "Draft"}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>• {selectedTimesheet?.totalHours}h Total</Text>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button danger size="middle" onClick={() => { setRejectOpen(true); setIsModalOpen(false); }} style={{ borderRadius: 8, fontWeight: 500 }} disabled={selectedTimesheet?.status === "REJECTED"}>Reject</Button>
                <Button type="primary" size="middle" onClick={() => { setApproveOpen(true); setIsModalOpen(false); }} style={{ borderRadius: 8, background: "#0ea5e9", borderColor: "#0ea5e9", fontWeight: 500 }} disabled={selectedTimesheet?.status === "APPROVED"}>Approve</Button>
              </div>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={closeModal}
        width={800}
        centered
        bodyStyle={{ padding: "0 24px 24px 24px" }}
        footer={[
          <Button key="export" icon={<ExportOutlined />} onClick={() => handleExport(timesheetRows)} style={{ borderRadius: 8, height: 40 }}>Export CSV</Button>,
          <Button key="close" onClick={closeModal} style={{ borderRadius: 8, height: 40, padding: "0 24px" }}>Close</Button>
        ]}
      >
        <div style={{ padding: "8px 0" }}>
          <Table<TimesheetRowUI>
            columns={[
              { title: "Date", dataIndex: "date", key: "date" },
              { title: "Day", dataIndex: "day", key: "day" },
              { title: "Project", dataIndex: "projectName", key: "projectName" },
              { title: "Task", dataIndex: "taskName", key: "taskName" },
              {
                title: "Description",
                render: (_: any, r) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Text ellipsis={{ tooltip: r.description }} style={{ maxWidth: 150 }}>{r.description || "-"}</Text>
                    {r.description && r.description.length > 20 && (
                      <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedDesc(r.description || ""); setIsDescModalOpen(true); }} />
                    )}
                  </div>
                ),
              },
              { title: "Hours", dataIndex: "hours", key: "hours", render: (h) => <strong>{h}h</strong> },
            ]}
            dataSource={timesheetRows}
            rowKey="key"
            pagination={false}
            size="small"
            bordered
          />
        </div>
      </Modal>

      {/* Reject Drawer */}
      <Drawer
        title={<div style={{ display: "flex", alignItems: "center", gap: 10 }}><AlertCircle size={20} color="#ef4444" /> Reject Timesheet</div>}
        placement="right"
        width={400}
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button onClick={() => setRejectOpen(false)} style={{ borderRadius: 8 }}>Cancel</Button>
            <Button danger type="primary" loading={loading} disabled={!rejectReason} onClick={async () => {
              if (!selectedTimesheet?.id) return;
              try {
                setLoading(true);
                await reviewTimesheet(selectedTimesheet.id, "REJECTED", rejectReason);
                message.success("Timesheet rejected successfully");
                setRejectOpen(false);
                setRejectReason("");
                queryClient.invalidateQueries({ queryKey: ["timesheets"] });
                onActionCompleted?.();
              } catch (err) {
                message.error("Action failed");
              } finally {
                setLoading(false);
              }
            }} style={{ borderRadius: 8 }}>Confirm Rejection</Button>
          </div>
        }
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>Please provide a reason for rejecting this timesheet submission.</Text>
        <Input.TextArea
          rows={6}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Explain what needs to be corrected..."
          style={{ borderRadius: 10, resize: "none" }}
        />
        <div style={{ marginTop: 24 }}>
          <Text strong style={{ display: "block", marginBottom: 12 }}>Common Reasons:</Text>
          <Space wrap>
            {["Incorrect project", "Missing description", "Hours mismatch"].map(r => (
              <Button key={r} size="small" style={{ borderRadius: 6 }} onClick={() => setRejectReason(prev => prev ? `${prev}\n- ${r}` : `- ${r}`)}>{r}</Button>
            ))}
          </Space>
        </div>
      </Drawer>

      {/* Approve Modal */}
      <Modal
        title={<div style={{ display: "flex", alignItems: "center", gap: 10 }}><CheckCircle2 size={20} color="#0ea5e9" /> Approve Timesheet</div>}
        open={approveOpen}
        onCancel={() => setApproveOpen(false)}
        okText="Confirm Approval"
        okButtonProps={{ loading, style: { background: "#0ea5e9", borderColor: "#0ea5e9", borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        onOk={async () => {
          if (!selectedTimesheet?.id) return;
          try {
            setLoading(true);
            await reviewTimesheet(selectedTimesheet.id, "APPROVED", "");
            message.success("Timesheet approved successfully");
            setApproveOpen(false);
            queryClient.invalidateQueries({ queryKey: ["timesheets"] });
            onActionCompleted?.();
          } catch (err) {
            message.error("Action failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        <Text>You are about to approve the timesheet for <strong>{selectedTimesheet?.user?.name}</strong>. This will finalize the entries for this period.</Text>
      </Modal>

      <Modal
        title="Full Description"
        open={isDescModalOpen}
        onCancel={closeDesc}
        footer={null}
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
        .custom-select-44 .ant-select-selector {
          height: 44px !important;
          padding: 4px 11px !important;
          border-radius: 12px !important;
        }
      `}} />
    </div>
  );
}
