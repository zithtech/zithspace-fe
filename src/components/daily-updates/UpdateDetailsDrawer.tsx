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
      bodyStyle={{ padding: 0, backgroundColor: "var(--bg-pure-white)" }}
    >
      {/* Premium Header */}
      <div style={{
        padding: "24px",
        background: "var(--bg-pure-white)",
        borderBottom: "1px solid var(--border-slate-200)",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <Space size={16}>
            <Avatar
              size={56}
              src={update.user?.avatarUrl}
              style={{
                backgroundColor: update.updateType === "BOD" ? "var(--bg-holiday)" : "var(--bg-blue-50)",
                color: update.updateType === "BOD" ? "var(--text-holiday)" : "var(--text-blue-700)",
                fontSize: 20,
                fontWeight: 700,
                border: "2px solid var(--bg-pure-white)",
                boxShadow: "0 0 0 1px var(--border-slate-100)"
              }}
            >
              {update.user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                {update.user?.name}
              </Title>
              <Text style={{ fontSize: 13, color: "var(--text-slate-600)", fontWeight: 500 }}>
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
              background: "var(--bg-slate-50)",
              border: "none",
              color: "var(--text-slate-700)",
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
            background: "var(--bg-sky-50)",
            padding: "8px 16px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid var(--border-blue-200)"
          }}>
            <Clock size={16} color="var(--text-sky-500)" />
            <div>
              <Text style={{ display: "block", fontSize: 10, color: "var(--text-sky-500)", fontWeight: 700, textTransform: "uppercase", lineHeight: 1 }}>Total Hours</Text>
              <Text strong style={{ fontSize: 15, color: "var(--text-blue-700)" }}>{formatHours(totalHours)}</Text>
            </div>
          </div>
          <div style={{
            background: "var(--bg-slate-50)",
            padding: "8px 16px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid var(--border-slate-100)"
          }}>
            <Activity size={16} color="var(--text-slate-600)" />
            <div>
              <Text style={{ display: "block", fontSize: 10, color: "var(--text-slate-600)", fontWeight: 700, textTransform: "uppercase", lineHeight: 1 }}>Update Type</Text>
              <Text strong style={{ fontSize: 14, color: "var(--text-slate-900)" }}>{update.updateType || "EOD"}</Text>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* General Notes */}
        {update.generalNotes && (
          <div style={{
            background: "var(--bg-pure-white)",
            borderRadius: 16,
            padding: 20,
            border: "1px solid var(--border-slate-200)",
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
              background: "var(--bg-pure-white)",
              borderRadius: 16,
              border: "1px solid var(--border-slate-200)",
              overflow: "hidden",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
            }}>
              {/* Project Header */}
              <div style={{
                padding: "12px 20px",
                background: "var(--bg-table-header)",
                borderBottom: "1px solid var(--border-slate-200)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ background: "var(--bg-pure-white)", padding: 6, borderRadius: 8, border: "1px solid var(--border-slate-100)" }}>
                    <Package size={16} color="var(--text-sky-500)" />
                  </div>
                  <Text strong style={{ fontSize: 14, color: "var(--text-slate-900)" }}>{project.projectName}</Text>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 12, color: "var(--text-slate-600)", fontWeight: 500 }}>
                    {formatTime(project.startTime)} - {formatTime(project.endTime)}
                  </Text>
                  <Tag style={{ borderRadius: 6, margin: 0, border: "none", background: "var(--bg-holiday)", color: "var(--text-holiday)", fontWeight: 600 }}>
                    {formatHours(project.hoursWorked)}
                  </Tag>
                </div>
              </div>

              <div style={{ padding: 20 }}>


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
                        background: "var(--bg-secondary)",
                        borderRadius: 12,
                        border: "1px solid var(--border-slate-100)"
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
                      <div style={{ padding: 12, background: "var(--bg-leave)", borderRadius: 12, border: "1px solid var(--border-rose-200)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <AlertCircle size={14} color="#e11d48" />
                          <Text strong style={{ fontSize: 12, color: "#be123c" }}>Blockers</Text>
                        </div>
                        <Text style={{ fontSize: 12, color: "#991b1b" }}>{project.blockers}</Text>
                      </div>
                    )}
                    {project.notes && (
                      <div style={{ padding: 12, background: "var(--bg-sky-50)", borderRadius: 12, border: "1px solid var(--border-blue-200)" }}>
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
