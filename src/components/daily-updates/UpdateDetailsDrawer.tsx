"use client";

import React from "react";
import {
  Drawer,
  Avatar,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Collapse,
} from "antd";
import {
  Clock,
  FileText,
  AlertCircle,
  Activity,
  Calendar,
  ChevronRight,
  Package,
  CheckCircle2,
  Zap,
} from "lucide-react";
import dayjs from "dayjs";
import {
  DailyStatusUpdate,
  ProjectUpdate,
  Task,
  WorkStatus,
  formatHours,
} from "@/types/dailyUpdate";

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface UpdateDetailsDrawerProps {
  update: DailyStatusUpdate | null;
  open: boolean;
  onClose: () => void;
}

export default function UpdateDetailsDrawer({
  update,
  open,
  onClose,
}: UpdateDetailsDrawerProps) {
  if (!update) return null;

  const projectUpdates = (update.projectUpdates || []) as ProjectUpdate[];
  const totalHours = projectUpdates.reduce(
    (sum, project) => sum + (project.hoursWorked || 0),
    0
  );

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case "happy": return "😊";
      case "neutral": return "😐";
      case "stressed": return "😰";
      case "blocked": return "🚫";
      default: return "😐";
    }
  };

  const getStatusConfig = (status: WorkStatus) => {
    const configs = {
      pending: { label: "Pending", color: "default", icon: "⏳" },
      in_progress: { label: "In Progress", color: "blue", icon: "⚙️" },
      dev_complete: { label: "Complete", color: "green", icon: "✅" },
      in_testing: { label: "Testing", color: "orange", icon: "🧪" },
      pushed_to_staging: { label: "Staging", color: "cyan", icon: "🚀" },
      pushed_to_production: { label: "Production", color: "purple", icon: "🎉" },
    };
    return configs[status] || configs.pending;
  };

  const formatTime = (isoString: string) => {
    return dayjs(isoString).format("h:mm A");
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width={640}
      title={null}
      closable={false}
      bodyStyle={{ padding: 0, backgroundColor: "#ffffff" }}
    >
      {/* Premium Header */}
      <div style={{
        padding: "24px",
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <Space size={16}>
            <Avatar
              size={56}
              style={{
                backgroundColor: update.updateType === "BOD" ? "#dcfce7" : "#dbeafe",
                color: update.updateType === "BOD" ? "#166534" : "#1e40af",
                fontSize: 20,
                fontWeight: 700,
                border: "2px solid #fff",
                boxShadow: "0 0 0 1px #e2e8f0"
              }}
            >
              {update.user?.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                {update.user?.name}
              </Title>
              <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                {update.user?.position?.title || "Team Member"}
              </Text>
            </div>
          </Space>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
            <Tag style={{
              margin: 0,
              padding: "4px 12px",
              borderRadius: 8,
              fontSize: 14,
              background: "#f1f5f9",
              border: "none",
              color: "#475569",
              fontWeight: 600
            }}>
              {getMoodEmoji(update.mood)} {update.mood?.toUpperCase()}
            </Tag>
            <div style={{ textAlign: "right" }}>
              {/* <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, color: "#1e293b", fontSize: 13, fontWeight: 600 }}>
                  <Calendar size={14} color="#0ea5e9" />
                  Due: {dayjs(update.date).format("MMM DD, YYYY")}
                </div> */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, color: "#94a3b8", fontSize: 11, marginTop: 4 }}>
                <Clock size={12} />
                Submitted: {dayjs(update.createdAt).format("MMM DD, h:mm A")}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{
            background: "#f0f9ff",
            padding: "8px 16px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid #e0f2fe"
          }}>
            <Clock size={16} color="#0ea5e9" />
            <div>
              <Text style={{ display: "block", fontSize: 10, color: "#0ea5e9", fontWeight: 700, textTransform: "uppercase", lineHeight: 1 }}>Total Hours</Text>
              <Text strong style={{ fontSize: 15, color: "#0369a1" }}>{formatHours(totalHours)}</Text>
            </div>
          </div>
          <div style={{
            background: "#f8fafc",
            padding: "8px 16px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid #e2e8f0"
          }}>
            <Activity size={16} color="#64748b" />
            <div>
              <Text style={{ display: "block", fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", lineHeight: 1 }}>Update Type</Text>
              <Text strong style={{ fontSize: 14, color: "#334155" }}>{update.updateType || "EOD"}</Text>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* General Notes */}
        {update.generalNotes && (
          <div style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            border: "1px solid #e2e8f0",
            marginBottom: 24,
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <FileText size={18} color="#0ea5e9" />
              <Text strong style={{ fontSize: 14, color: "#1e293b" }}>General Notes</Text>
            </div>
            <Text style={{ color: "#475569", fontSize: 14, lineHeight: 1.6 }}>{update.generalNotes}</Text>
          </div>
        )}

        {/* Project Updates List */}
        <Title level={5} style={{ marginBottom: 16, fontSize: 15, fontWeight: 700, color: "#334155" }}>
          Project Wise Details
        </Title>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {projectUpdates.map((project, idx) => (
            <div key={idx} style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
            }}>
              {/* Project Header */}
              <div style={{
                padding: "12px 20px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ background: "#fff", padding: 6, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <Package size={16} color="#0ea5e9" />
                  </div>
                  <Text strong style={{ fontSize: 14, color: "#0f172a" }}>{project.projectName}</Text>
                </div>
                <Tag style={{ borderRadius: 6, margin: 0, border: "none", background: "#dcfce7", color: "#166534", fontWeight: 600 }}>
                  {formatHours(project.hoursWorked)}
                </Tag>
              </div>

              <div style={{ padding: 20 }}>
                {/* Time range */}
                <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
                  <div>
                    <Text style={{ display: "block", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>START TIME</Text>
                    <Text strong style={{ fontSize: 13, color: "#334155" }}>{formatTime(project.startTime)}</Text>
                  </div>
                  <div>
                    <Text style={{ display: "block", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>END TIME</Text>
                    <Text strong style={{ fontSize: 13, color: "#334155" }}>{formatTime(project.endTime)}</Text>
                  </div>
                </div>

                {/* Tasks */}
                <Text strong style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 12, textTransform: "uppercase" }}>
                  Tasks & Achievements
                </Text>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {project.tasks.map((task, tIdx) => {
                    const status = getStatusConfig(task.status);
                    return (
                      <div key={tIdx} style={{
                        padding: 12,
                        background: "#f8fafc",
                        borderRadius: 12,
                        border: "1px solid #f1f5f9"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {task.type === "ticket" ? <Zap size={13} color="#3b82f6" /> : <ChevronRight size={13} color="#94a3b8" />}
                            <Text strong style={{ fontSize: 13, color: "#334155" }}>
                              {task.type === "ticket" ? task.ticketNumber : `Task ${tIdx + 1}`}
                            </Text>
                          </div>
                          <Tag style={{ borderRadius: 4, margin: 0, fontSize: 10, border: "none", background: "#fff", color: "#64748b", fontWeight: 600 }}>
                            {status.icon} {status.label}
                          </Tag>
                        </div>
                        <Text style={{ fontSize: 13, color: "#475569", display: "block", paddingLeft: 19 }}>
                          {task.type === "ticket" ? task.ticketTitle : task.description}
                        </Text>
                      </div>
                    );
                  })}
                </div>

                {/* Blockers & Project Notes */}
                {(project.blockers || project.notes) && (
                  <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    {project.blockers && (
                      <div style={{ padding: 12, background: "#fff1f2", borderRadius: 12, border: "1px solid #ffe4e6" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <AlertCircle size={14} color="#e11d48" />
                          <Text strong style={{ fontSize: 12, color: "#be123c" }}>Blockers</Text>
                        </div>
                        <Text style={{ fontSize: 12, color: "#991b1b" }}>{project.blockers}</Text>
                      </div>
                    )}
                    {project.notes && (
                      <div style={{ padding: 12, background: "#f0f9ff", borderRadius: 12, border: "1px solid #e0f2fe" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <FileText size={14} color="#0ea5e9" />
                          <Text strong style={{ fontSize: 12, color: "#0369a1" }}>Notes</Text>
                        </div>
                        <Text style={{ fontSize: 12, color: "#075985" }}>{project.notes}</Text>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 40 }} />
      </div>
    </Drawer>
  );
}
