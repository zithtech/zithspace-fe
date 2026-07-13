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
  Badge,
  App,
  Button,
} from "antd";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  MoreOutlined,
  ProjectOutlined,
  EditOutlined,
  DeleteOutlined,
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
  Activity,
  MoreVertical,
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
  getStatusConfig,
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
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const { canUpdateDailyUpdate, canDeleteDailyUpdate } = usePermission();
  const { user } = useAuth();

  const projectUpdates = (update.projectUpdates || []) as ProjectUpdate[];
  const totalHours = projectUpdates.reduce((sum, p) => sum + (p.hoursWorked || 0), 0);
  const totalTasks = projectUpdates.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
  const firstTask = projectUpdates[0]?.tasks?.[0];
  const status = firstTask?.status || "pending";
  const statusConfig = getStatusConfig(status);

  const isMissed = Boolean(update.is_missed);
  const isEditable = dayjs().diff(dayjs(update.createdAt), "hour") < 24;

  const handleConfirmDelete = async () => {
    try {
      await DailyUpdateService.deleteUpdate(update.id);
      messageApi.success("Daily update deleted successfully");
      onDelete();
    } catch (err: any) {
      messageApi.error(err.message || "Failed to delete update");
      throw err;
    }
  };

  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="du-menu-item">
      <span className="du-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="du-menu-text">
        <span className="du-menu-title">{title}</span>
        <span className="du-menu-desc">{desc}</span>
      </span>
    </div>
  );

  const isOwner = user?.id === update.userId;
  const editDisabled = !isEditable || !canUpdateDailyUpdate;

  const items: any[] = [];

  if (isOwner) {
    items.push({
      key: 'edit',
      disabled: editDisabled,
      label: menuLabel('Edit', 'Modify this update', <EditOutlined />, '#64748b', 'rgba(100,116,139,0.12)')
    });
  }

  if (canDeleteDailyUpdate) {
    if (items.length > 0) {
      items.push({
        type: 'divider'
      });
    }
    items.push({
      key: 'delete',
      danger: true,
      label: (
        <ConfirmDialog
          tone="danger"
          icon={<Trash2 size={15} />}
          title="Delete Update?"
          description="Are you sure you want to delete this status update? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          placement="left"
          onConfirm={handleConfirmDelete}
        >
          <div
            style={{
              margin: '-5px -12px',
              padding: '5px 12px',
              width: 'calc(100% + 24px)',
              height: '100%'
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {menuLabel('Delete', 'Remove this update', <DeleteOutlined />, '#ef4444', 'rgba(239,68,68,0.12)')}
          </div>
        </ConfirmDialog>
      )
    });
  }

  return (
    <>
      <Badge.Ribbon
        text={update.updateType || "EOD"}
        color="#3b82f6"
        style={{ top: 5, right: -8, fontSize: 10, fontWeight: 700 }}
      >
        <Card
          onClick={onOpen}
          style={{
            borderRadius: 0,
            border: "1px solid var(--border-slate-200)",
            background: "var(--bg-pure-white)",
            cursor: "pointer",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transition: "box-shadow .15s ease, border-color .15s ease",
          }}
          bodyStyle={{ padding: 0, display: "flex", flexDirection: "column" }}
          className="premium-update-card"
        >
          {/* Top Section */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px" }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-blue-700)", fontWeight: 800, fontSize: 12,
              background: update.user?.avatarUrl ? "transparent" : "var(--bg-blue-50)",
              overflow: "hidden"
            }}>
              {update.user?.avatarUrl ? (
                <img src={update.user.avatarUrl} alt={update.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                update.user?.name.charAt(0).toUpperCase()
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 3, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-slate-900)", letterSpacing: "-0.01em", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {update.user?.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, minWidth: 0 }}>
                <span style={{ color: "var(--text-slate-400)", fontWeight: 600, flexShrink: 0 }}>Role:</span>
                <span style={{ color: "var(--text-slate-700)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{update.user?.position?.title || "Team Member"}</span>
              </div>
            </div>

            {items.length > 0 && (
              <Dropdown
                trigger={["click"]}
                menu={{
                  items,
                  onClick: (info) => {
                    info.domEvent.stopPropagation();
                    if (info.key === "edit") router.push(`/daily-updates/submit?edit=${update.id}`);
                  },
                }}
                placement="bottomRight"
                overlayClassName="du-action-pop"
              >
                <Button
                  type="text"
                  className="du-icon-btn"
                  icon={<MoreVertical size={18} />}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginRight: 10 }}
                />
              </Dropdown>
            )}
          </div>

          {/* Foot Section (slate-50 background, containing both pills and dates) */}
          <div style={{ display: "flex", flexDirection: "column", padding: 0, borderTop: "1px solid var(--border-slate-200)", background: "var(--bg-slate-50)" }}>

            <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", overflow: "hidden", padding: "10px 12px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--text-sky-600)", background: "var(--bg-sky-50)", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0 }}>
                <Clock size={11} /> <span style={{ opacity: 0.7, fontWeight: 500 }}>Time:</span> {formatHours(totalHours)}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--text-slate-600)", background: "var(--bg-slate-50)", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0 }}>
                <ProjectOutlined /> <span style={{ opacity: 0.7, fontWeight: 500 }}>{projectUpdates.length === 1 ? "Project:" : "Projects:"}</span> {projectUpdates.length}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--text-slate-700)", background: "transparent", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0 }}>
                <span>{statusConfig.icon}</span> <span style={{ opacity: 0.7, fontWeight: 500 }}>Status:</span> {statusConfig.label}
              </span>
              {projectUpdates.length > 0 && (
                <span title={`Tasks: ${firstTask?.type === 'manual' ? 'Manual' : (firstTask?.ticketNumber || firstTask?.description || "No tasks")}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--text-slate-700)", background: "transparent", padding: "2px 6px", borderRadius: 4, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 1, minWidth: 0 }}>
                  <Activity size={11} color="var(--text-slate-400)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ opacity: 0.7, fontWeight: 500 }}>Tasks ({totalTasks}):</span> {firstTask?.type === 'manual' ? 'Manual' : (firstTask?.ticketNumber || firstTask?.description || "No tasks")}
                  </span>
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", overflow: "hidden", padding: "8px 12px", borderTop: "1px solid var(--border-slate-200)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-slate-700)", whiteSpace: "nowrap", flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-slate-400)" }}>Due Date:</span>
                <span style={{ fontWeight: 600 }}>
                  {update.is_missed && update.missed_updateAt
                    ? dayjs(update.missed_updateAt).format("DD MMM YYYY")
                    : dayjs(update.createdAt).format("DD MMM YYYY")}
                </span>
              </span>
              <span style={{ width: 1, height: 11, background: "var(--border-slate-300)", flexShrink: 0 }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-slate-700)", whiteSpace: "nowrap", flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-slate-400)", textTransform: "uppercase" }}>Submitted On</span>
                <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {dayjs((update.updatedAt && dayjs(update.updatedAt).diff(dayjs(update.createdAt), 'second') > 60) ? update.updatedAt : update.createdAt).format("MMM D, h:mm A")}
                </span>
              </span>
              {isMissed && (
                <>
                  <span style={{ width: 1, height: 11, background: "var(--border-slate-300)", flexShrink: 0 }} />
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 19, padding: "0 7px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: "var(--bg-leave)", color: "var(--text-leave)", textTransform: "uppercase", flexShrink: 0 }}>
                    MISSED
                  </span>
                </>
              )}
            </div>
          </div>
        </Card>
      </Badge.Ribbon>
    </>
  );
}
