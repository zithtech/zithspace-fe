"use client";

import React from "react";
import { Drawer, Avatar, Typography } from "antd";
import {
  Clock,
  FileText,
  AlertCircle,
  Activity,
  ChevronRight,
  Package,
  Zap,
  X,
  Briefcase,
  StickyNote,
  CalendarClock,
  ListChecks,
} from "lucide-react";
import dayjs from "dayjs";
import {
  DailyStatusUpdate,
  ProjectUpdate,
  WorkStatus,
  formatHours,
} from "@/types/dailyUpdate";
import { useTicketDrawer } from "@/context/TicketDrawerContext";

const { Text, Title } = Typography;

interface UpdateDetailsDrawerProps {
  update: DailyStatusUpdate | null;
  open: boolean;
  onClose: () => void;
}

const moodConfig: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
  happy:    { emoji: "😊", label: "Happy",    color: "#a16207", bg: "#fef9c3", border: "#fde68a" },
  neutral:  { emoji: "😐", label: "Neutral",  color: "var(--text-slate-700)", bg: "var(--bg-slate-50)", border: "var(--border-slate-200)" },
  stressed: { emoji: "😰", label: "Stressed", color: "#9a3412", bg: "#ffedd5", border: "#fed7aa" },
  blocked:  { emoji: "🚫", label: "Blocked",  color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
};

const statusConfig: Record<WorkStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending:              { label: "Pending",     color: "#475569", bg: "#f1f5f9", border: "#e2e8f0", dot: "#94a3b8" },
  in_progress:          { label: "In Progress", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
  dev_complete:         { label: "Complete",    color: "#166534", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e" },
  in_testing:           { label: "Testing",     color: "#9a3412", bg: "#fff7ed", border: "#fed7aa", dot: "#f97316" },
  pushed_to_staging:    { label: "Staging",     color: "#155e75", bg: "#ecfeff", border: "#a5f3fc", dot: "#06b6d4" },
  pushed_to_production: { label: "Production",  color: "#6b21a8", bg: "#faf5ff", border: "#e9d5ff", dot: "#a855f7" },
};

export default function UpdateDetailsDrawer({
  update,
  open,
  onClose,
}: UpdateDetailsDrawerProps) {
  const { open: openTicketDrawer } = useTicketDrawer();
  if (!update) return null;

  const projectUpdates = (update.projectUpdates || []) as ProjectUpdate[];
  const totalHours = projectUpdates.reduce((sum, p) => sum + (p.hoursWorked || 0), 0);
  const totalTasks = projectUpdates.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
  const mood = moodConfig[update.mood || "neutral"] || moodConfig.neutral;
  const isBOD = update.updateType === "BOD";

  const formatTime = (iso: string) => dayjs(iso).format("h:mm A");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width={680}
      title={null}
      closable={false}
      styles={{ body: { padding: 0, backgroundColor: "var(--bg-pure-white)" } }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        .udd-drawer .udd-card {
          transition: border-color .15s ease;
        }
        .udd-drawer .udd-card:hover {
          border-color: #cbd5e1;
        }
        .udd-drawer .udd-task-row {
          transition: background .15s ease, border-color .15s ease;
        }
        .udd-drawer .udd-task-row:hover {
          background: var(--bg-slate-50);
        }
        .udd-drawer .udd-close-btn {
          transition: all .15s ease;
        }
        .udd-drawer .udd-close-btn:hover {
          background: var(--bg-slate-100);
          color: var(--text-slate-900);
          border-color: var(--border-slate-200);
        }
        .udd-drawer .udd-ticket-link:hover {
          text-decoration: underline;
        }
        @keyframes uddFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .udd-drawer .udd-anim {
          animation: uddFadeUp .35s cubic-bezier(.2,.6,.2,1) both;
        }
        .udd-inline-note {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-areas: "icon label" "icon text";
          column-gap: 10px;
          padding: 10px 12px;
          background: var(--light-bg);
          border: 1px solid var(--light-border);
          border-radius: 10px;
        }
        .udd-inline-note-icon {
          grid-area: icon;
          color: var(--light-label);
          margin-top: 1px;
        }
        .udd-inline-note-label {
          grid-area: label;
          font-size: 11px;
          color: var(--light-label);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 2px;
          font-weight: 600;
        }
        .udd-inline-note-text {
          grid-area: text;
          font-size: 13px;
          color: var(--light-text);
          line-height: 1.5;
          white-space: pre-wrap;
        }
        [data-theme='dark'] .udd-inline-note {
          grid-template-areas: "icon label" "text text";
          column-gap: 8px;
          row-gap: 10px;
          background: var(--bg-pure-white);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .udd-inline-note-icon {
          color: var(--text-slate-600);
          margin-top: 0;
          display: flex;
          align-items: center;
        }
        [data-theme='dark'] .udd-inline-note-label {
          font-size: 13px;
          color: var(--text-slate-900);
          letter-spacing: 0.1px;
          text-transform: none;
          margin-bottom: 0;
          display: flex;
          align-items: center;
        }
        [data-theme='dark'] .udd-inline-note-text {
          font-size: 14px;
          color: var(--text-slate-700);
          line-height: 1.65;
        }

        /* Highlight Blockers in Dark Theme */
        [data-theme='dark'] .udd-inline-note-rose {
          background: rgba(225, 29, 72, 0.08);
          border-color: rgba(225, 29, 72, 0.2);
        }
        [data-theme='dark'] .udd-inline-note-rose .udd-inline-note-icon {
          color: #fb7185;
        }
        [data-theme='dark'] .udd-inline-note-rose .udd-inline-note-label {
          color: #fda4af;
        }
        [data-theme='dark'] .udd-inline-note-rose .udd-inline-note-text {
          color: #ffe4e6;
        }
        `
      }} />

      <div className="udd-drawer">
        {/* Hero Header */}
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg-pure-white)",
          borderBottom: "1px solid var(--border-slate-200)",
        }}>
          <div style={{ padding: "20px 28px 0" }}>
            {/* Top meta row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: isBOD ? "#fef3c7" : "#dbeafe",
                  color: isBOD ? "#92400e" : "#1e40af",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  border: `1px solid ${isBOD ? "#fde68a" : "#bfdbfe"}`,
                }}>
                  <Activity size={11} strokeWidth={2.5} />
                  {update.updateType || "EOD"} Update
                </div>
                <Text style={{ fontSize: 12, color: "var(--text-slate-400)", fontWeight: 500 }}>
                  Submitted · {dayjs(update.createdAt).format("MMM DD, h:mm A")}
                </Text>
              </div>
              <button
                className="udd-close-btn"
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: "1px solid var(--border-slate-200)",
                  background: "var(--bg-pure-white)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-slate-600)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
              <Avatar
                size={60}
                src={update.user?.avatarUrl}
                style={{
                  background: isBOD ? "#f59e0b" : "#6366f1",
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: 700,
                  border: "1px solid var(--border-slate-200)",
                  flexShrink: 0,
                }}
              >
                {update.user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <Title level={4} style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--text-slate-900)",
                    letterSpacing: -0.3,
                    lineHeight: 1.2,
                  }}>
                    {update.user?.name}
                  </Title>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 9px",
                    background: mood.bg,
                    color: mood.color,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    border: `1px solid ${mood.border}`,
                    lineHeight: 1.4,
                  }}>
                    <span style={{ fontSize: 12 }}>{mood.emoji}</span>
                    {mood.label}
                  </div>
                </div>
                <Text style={{ fontSize: 13, color: "var(--text-slate-600)", fontWeight: 500 }}>
                  {update.user?.position?.title || "Team Member"}
                </Text>
              </div>
            </div>

            {/* KPI Strip */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
              paddingBottom: 18,
            }}>
              <KPICard
                tone="blue"
                icon={<Clock size={15} strokeWidth={2.4} />}
                label="Total Hours"
                value={formatHours(totalHours)}
              />
              <KPICard
                tone="violet"
                icon={<Briefcase size={15} strokeWidth={2.4} />}
                label="Projects"
                value={String(projectUpdates.length)}
              />
              <KPICard
                tone="emerald"
                icon={<ListChecks size={15} strokeWidth={2.4} />}
                label="Tasks"
                value={String(totalTasks)}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px 40px" }}>
          {/* General Notes */}
          {update.generalNotes && (
            <div className="udd-anim" style={{
              background: "var(--bg-pure-white)",
              borderRadius: 12,
              padding: 16,
              border: "1px solid var(--border-slate-200)",
              marginBottom: 22,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <StickyNote size={15} strokeWidth={2.3} color="var(--text-slate-600)" />
                <Text strong style={{ fontSize: 13, color: "var(--text-slate-900)", letterSpacing: 0.1 }}>
                  General Notes
                </Text>
              </div>
              <Text style={{
                color: "var(--text-slate-700)",
                fontSize: 14,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}>
                {update.generalNotes}
              </Text>
            </div>
          )}

          {/* Section heading */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 3,
                height: 16,
                borderRadius: 2,
                background: "#6366f1",
              }} />
              <Title level={5} style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-slate-900)",
                letterSpacing: -0.1,
              }}>
                Project Wise Details
              </Title>
            </div>
            <Text style={{ fontSize: 12, color: "var(--text-slate-400)", fontWeight: 500 }}>
              {projectUpdates.length} {projectUpdates.length === 1 ? "project" : "projects"}
            </Text>
          </div>

          {/* Project Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projectUpdates.map((project, idx) => (
              <div
                key={idx}
                className="udd-card udd-anim"
                style={{
                  background: "var(--bg-pure-white)",
                  borderRadius: 12,
                  border: "1px solid var(--border-slate-200)",
                  overflow: "hidden",
                  animationDelay: `${idx * 40}ms`,
                }}
              >
                {/* Project header */}
                <div style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--border-slate-100)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  background: "var(--bg-slate-50)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "var(--bg-pure-white)",
                      border: "1px solid var(--border-slate-200)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Package size={17} strokeWidth={2.2} color="#4f46e5" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <Text strong style={{
                        display: "block",
                        fontSize: 14,
                        color: "var(--text-slate-900)",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {project.projectName}
                      </Text>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                        <CalendarClock size={11} color="var(--text-slate-400)" />
                        <Text style={{ fontSize: 11, color: "var(--text-slate-600)", fontWeight: 500 }}>
                          {formatTime(project.startTime)} – {formatTime(project.endTime)}
                        </Text>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 11px",
                    background: "#ecfdf5",
                    color: "#047857",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    border: "1px solid #a7f3d0",
                    flexShrink: 0,
                  }}>
                    <Clock size={11} strokeWidth={2.5} />
                    {formatHours(project.hoursWorked)}
                  </div>
                </div>

                <div style={{ padding: 16 }}>
                  <Text style={{
                    display: "block",
                    fontSize: 10,
                    color: "var(--text-slate-400)",
                    marginBottom: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}>
                    Tasks &amp; Achievements · {project.tasks.length}
                  </Text>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {project.tasks.map((task, tIdx) => {
                      const status = statusConfig[task.status] || statusConfig.pending;
                      const isTicket = task.type === "ticket";
                      return (
                        <div
                          key={tIdx}
                          className="udd-task-row"
                          style={{
                            padding: "12px 14px",
                            background: "var(--bg-pure-white)",
                            borderRadius: 10,
                            border: "1px solid var(--border-slate-100)",
                            borderLeft: `3px solid ${status.dot}`,
                          }}
                        >
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 12,
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <div style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 6,
                                  background: isTicket ? "#dbeafe" : "var(--bg-slate-100)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}>
                                  {isTicket
                                    ? <Zap size={12} color="#2563eb" strokeWidth={2.5} />
                                    : <ChevronRight size={13} color="var(--text-slate-600)" strokeWidth={2.5} />}
                                </div>
                                {isTicket && task.ticketId ? (
                                  <Text
                                    className="udd-ticket-link"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTicketDrawer(task.ticketId!);
                                    }}
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: "#2563eb",
                                      cursor: "pointer",
                                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                    }}
                                  >
                                    {task.ticketNumber}
                                  </Text>
                                ) : (
                                  <Text strong style={{
                                    fontSize: 13,
                                    color: "var(--text-slate-900)",
                                    fontFamily: isTicket ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
                                  }}>
                                    {isTicket ? task.ticketNumber : `Task ${tIdx + 1}`}
                                  </Text>
                                )}
                              </div>
                              <Text style={{
                                display: "block",
                                fontSize: 13,
                                color: "var(--text-slate-700)",
                                lineHeight: 1.5,
                                paddingLeft: 30,
                              }}>
                                {isTicket ? task.ticketTitle : task.description}
                              </Text>
                            </div>
                            <div style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "3px 9px",
                              background: status.bg,
                              color: status.color,
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              border: `1px solid ${status.border}`,
                              flexShrink: 0,
                              whiteSpace: "nowrap",
                              lineHeight: 1.4,
                            }}>
                              <span style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: status.dot,
                              }} />
                              {status.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Blockers & Notes */}
                  {(project.blockers || project.notes) && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      {project.blockers && (
                        <InlineNote
                          tone="rose"
                          icon={<AlertCircle size={15} strokeWidth={2.3} />}
                          label="Blockers"
                          text={project.blockers}
                        />
                      )}
                      {project.notes && (
                        <InlineNote
                          tone="sky"
                          icon={<FileText size={15} strokeWidth={2.3} />}
                          label="Notes"
                          text={project.notes}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

/* ───── Subcomponents ───── */

function KPICard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "blue" | "violet" | "emerald";
}) {
  const palette = {
    blue:    { color: "#1d4ed8", iconBg: "#eff6ff" },
    violet:  { color: "#6d28d9", iconBg: "#f5f3ff" },
    emerald: { color: "#047857", iconBg: "#ecfdf5" },
  }[tone];

  return (
    <div style={{
      background: "var(--bg-pure-white)",
      borderRadius: 10,
      padding: "10px 12px",
      border: "1px solid var(--border-slate-200)",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: palette.iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: palette.color,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "var(--text-slate-400)",
          lineHeight: 1.2,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-slate-900)",
          lineHeight: 1.2,
          marginTop: 2,
          letterSpacing: -0.2,
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function InlineNote({
  tone,
  icon,
  label,
  text,
}: {
  tone: "rose" | "sky";
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  const palette = {
    rose: { bg: "#fff1f2", color: "#9f1239", labelColor: "#be123c", border: "#fecdd3" },
    sky:  { bg: "#f0f9ff", color: "#075985", labelColor: "#0369a1", border: "#bae6fd" },
  }[tone];

  return (
    <div 
      className={`udd-inline-note udd-inline-note-${tone}`}
      style={{
        "--light-bg": palette.bg,
        "--light-border": palette.border,
        "--light-label": palette.labelColor,
        "--light-text": palette.color,
      } as React.CSSProperties}
    >
      <div className="udd-inline-note-icon">{icon}</div>
      <div className="udd-inline-note-label">{label}</div>
      <div className="udd-inline-note-text">{text}</div>
    </div>
  );
}
