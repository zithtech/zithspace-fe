"use client";

import React from "react";
import {
  Card,
  Avatar,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Dropdown,
  message,
  Modal,
  notification,
  Badge,
} from "antd";
import {
  MoreOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import {
  Clock,
  Trash2,
  Edit3,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Zap,
  Activity
} from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

import {
  DailyStatusUpdate,
  ProjectUpdate,
  formatHours,
} from "@/types/dailyUpdate";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import DailyUpdateService from "@/services/dailyUpdateService";
import { useAuth } from "@/context/AuthContext";

const { Text } = Typography;

interface UpdateCardProps {
  update: DailyStatusUpdate;
  onOpen: () => void;
  onDelete: () => void;
}

export default function UpdateCard({
  update,
  onOpen,
  onDelete,
}: UpdateCardProps) {
  const [api, contextHolder] = notification.useNotification();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const router = useRouter();
  const { canUpdateDailyUpdate, canDeleteDailyUpdate } = usePermission();
  const { user } = useAuth();

  const projectUpdates = (update.projectUpdates || []) as ProjectUpdate[];
  const totalHours = projectUpdates.reduce((sum, p) => sum + (p.hoursWorked || 0), 0);
  const totalTasks = projectUpdates.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);

  const isMissed = Boolean(update.is_missed);
  const isEditable = dayjs().diff(dayjs(update.createdAt), "hour") < 24;

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      await DailyUpdateService.deleteUpdate(update.id);
      message.success("Daily update deleted successfully");
      onDelete();
    } catch (err: any) {
      message.error(err.message || "Failed to delete update");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };


  return (
    <>
      {contextHolder}
      <Badge.Ribbon
        text={update.updateType || "EOD"}
        color={update.updateType === "BOD" ? "#22c55e" : "#3b82f6"}
        style={{ top: 5, right: -8, fontSize: 10, fontWeight: 700 }}
      >
        <Card
          hoverable
          onClick={onOpen}
          style={{
            borderRadius: 16,
            border: "1px solid var(--border-slate-200)",
            overflow: "hidden",
            background: "var(--bg-pure-white)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          bodyStyle={{ padding: 0 }}
          className="premium-update-card"
        >
          {/* Header Section */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-slate-100)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Space size={10}>
                <Avatar
                  size={32}
                  src={update.user?.avatarUrl}
                  style={{
                    backgroundColor: update.updateType === "BOD" ? "var(--bg-holiday)" : "var(--bg-blue-50)",
                    color: update.updateType === "BOD" ? "var(--text-holiday)" : "var(--text-blue-700)",
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  {update.user?.name.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text strong style={{ fontSize: 13, color: "var(--text-slate-900)", display: "block", lineHeight: 1.2 }}>
                    {update.user?.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                    {update.user?.position?.title || "Team Member"}
                  </Text>
                </div>
              </Space>


              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                {isMissed && (
                  <Tag style={{
                    margin: 0,
                    borderRadius: 6,
                    border: "none",
                    background: "var(--bg-leave)",
                    color: "var(--text-leave)",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase"
                  }}>
                    Missed
                  </Tag>
                )}

                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      ...(user?.id === update.userId ? [{ key: "edit", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Edit3 size={14} /> Edit</span>, disabled: !isEditable || !canUpdateDailyUpdate }] : []),
                      { key: "delete", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Trash2 size={14} /> Delete</span>, danger: true, disabled: !canDeleteDailyUpdate },
                    ],
                    onClick: (info) => {
                      info.domEvent.stopPropagation();
                      if (info.key === "edit") router.push(`/daily-updates/submit?edit=${update.id}`);
                      if (info.key === "delete") setIsDeleteModalOpen(true);
                    },
                  }}
                >


                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      cursor: "pointer",
                      padding: 10,
                      borderRadius: 6,
                      color: "var(--text-slate-900)",     // darker → bold feel
                      fontSize: 18,         // increase size
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-secondary)";
                      e.currentTarget.style.transform = "scale(1.1)";  // slight zoom
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <MoreOutlined />
                  </div>

                </Dropdown>

              </div>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            {/* Quick Stats Row */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <Tag style={{
                margin: 0,
                borderRadius: 6,
                border: "none",
                background: "var(--bg-sky-50)",
                color: "var(--text-sky-500)",
                fontSize: 11,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}>
                <Clock size={12} /> {formatHours(totalHours)}
              </Tag>
              <Tag style={{
                margin: 0,
                borderRadius: 6,
                border: "none",
                background: "var(--bg-slate-50)",
                color: "var(--text-slate-600)",
                fontSize: 11,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}>
                <ProjectOutlined style={{ fontSize: 12 }} /> {projectUpdates.length} Projects
              </Tag>

            </div>

            {/* Work Content Snapshot */}
            <div style={{
              background: "var(--bg-secondary)",
              borderRadius: 12,
              padding: 10,
              border: "1px solid var(--border-slate-100)",
              marginBottom: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Activity size={12} color="var(--text-slate-400)" />
                <Text strong style={{ fontSize: 11, color: "var(--text-slate-600)" }}>Recent Tasks ({totalTasks})</Text>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {projectUpdates.slice(0, 2).map((p, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-color)" }} />
                    <Text ellipsis style={{ fontSize: 11, color: "var(--text-slate-700)", flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>{p.projectName}:</span> {p.tasks?.[0]?.description || p.tasks?.[0]?.ticketNumber || "No tasks listed"}
                    </Text>
                  </div>
                ))}
                {projectUpdates.length > 2 && (
                  <Text style={{ fontSize: 10, color: "#94a3b8", marginLeft: 10 }}>
                    + {projectUpdates.length - 2} more projects
                  </Text>
                )}
              </div>
            </div>

            {/* Footer Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-slate-100)", paddingTop: 12 }}>
              <Space direction="vertical" size={2}>
                {/* <Text style={{ fontSize: 10, color: "#94a3b8", display: "block" }}>DUE DATE</Text>
                <Text style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>
                  {dayjs(update.date).format("MMM D, YYYY")}
                </Text> */}
                <Text type="secondary" style={{ fontSize: 10, color: "#94a3b8", display: "block" }}>
                  Due Date:{" "}
                  {update.is_missed && update.missed_updateAt
                    ? dayjs(update.missed_updateAt).format("DD MMM YYYY")
                    : dayjs(update.createdAt).format("DD MMM YYYY")}
                </Text>
              </Space>

              <Space direction="vertical" size={2} align="end">
                <Text style={{ fontSize: 10, color: "var(--text-slate-400)", display: "block" }}>SUBMITTED ON</Text>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 11, color: "var(--text-slate-700)", fontWeight: 600 }}>
                    {dayjs(update.createdAt).format("MMM D, h:mm A")}
                  </Text>
                </div>
              </Space>
            </div>
          </div>
        </Card>
      </Badge.Ribbon>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "var(--bg-leave)", padding: 8, borderRadius: 10, color: "var(--text-leave)" }}>
              <AlertCircle size={20} />
            </div>
            <span>Delete Daily Update</span>
          </div>
        }
        open={isDeleteModalOpen}
        onOk={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Delete Update"
        okType="danger"
        cancelText="Keep it"
        confirmLoading={isDeleting}
        centered
        style={{ borderRadius: 16 }}
      >
        <p style={{ color: "var(--text-slate-600)" }}>Are you sure you want to delete this status update? This action cannot be undone.</p>
      </Modal>
    </>
  );
}
