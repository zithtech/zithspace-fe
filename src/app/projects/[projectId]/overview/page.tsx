"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Spin, Empty, Alert, Tooltip, Button } from "antd";
import { ProjectService } from "@/services/projectService";
import { CombinedSummaryCard } from "@/components/projects/overview/CombinedSummaryCard";
import { ProjectInfoCard } from "@/components/projects/overview/ProjectInfoCard";
import { InsightsPanel } from "@/components/projects/overview/InsightsPanel";
import { RecentActivitiesPanel } from "@/components/projects/overview/RecentActivitiesPanel";
import { SprintTable } from "@/components/projects/overview/SprintTable";
import { TimelineTree } from "@/components/projects/overview/TimelineTree";
import { TeamProgressCards } from "@/components/projects/overview/TeamProgressCards";
import MainLayout from "@/components/layout/MainLayout";
import { ProjectFormDrawer } from "@/components/projects/ProjectFormDrawer";
import { usePermission } from "@/hooks/usePermission";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import {
  ProjectOutlined,
  ArrowLeftOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  EditOutlined,
  CalendarOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

type ViewKey = "overview" | "sprint" | "timeline" | "team";

const STATUS_TINT: Record<string, { color: string; bg: string }> = {
  active: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  planning: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  "on-hold": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  completed: { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
};

const ProjectOverviewPage = () => {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };

  const { data: overviewData, isLoading, error, refetch } = useQuery({
    queryKey: ["projectOverview", projectId],
    queryFn: () => ProjectService.getProjectOverview(projectId),
    enabled: !!projectId,
  });

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const { canReadActivityLog } = usePermission();

  // Timeline tickets are loaded on demand — only once the Timeline tab is opened.
  const { data: timelineTickets, isLoading: timelineLoading } = useQuery({
    queryKey: ["projectTimeline", projectId],
    queryFn: () => ProjectService.getProjectTimeline(projectId),
    enabled: !!projectId && activeView === "timeline",
  });

  const sprints = overviewData?.sprints ?? [];
  const team = overviewData?.team ?? [];

  if (isLoading) {
    return (
      <MainLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 64px)" }}>
          <Spin size="large" tip="Loading project overview..." />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div style={{ padding: 24 }}>
          <Alert message="Error" description="Failed to load project overview data. Please try again later." type="error" showIcon />
        </div>
      </MainLayout>
    );
  }

  if (!overviewData) {
    return (
      <MainLayout>
        <div style={{ padding: 24 }}>
          <Empty description="No overview data found for this project." />
        </div>
      </MainLayout>
    );
  }

  const { project, ticketSummary, sprintSummary, timeStats, activities, insights } = overviewData;

  const projectProgress =
    ticketSummary.total > 0 ? Math.round((ticketSummary.completed / ticketSummary.total) * 100) : 0;
  const avgPerDay = timeStats.daysWorked > 0 ? (timeStats.totalHours / timeStats.daysWorked).toFixed(1) : "0";
  const statusKey = (project.status || "").toLowerCase();
  const statusTint = STATUS_TINT[statusKey] || { color: "#64748b", bg: "rgba(100,116,139,0.12)" };
  const initials = project.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();

  const VIEWS: { key: ViewKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "overview", label: "Overview", icon: <AppstoreOutlined /> },
    { key: "sprint", label: "Sprint", icon: <ThunderboltOutlined />, count: sprints.length },
    { key: "timeline", label: "Timeline", icon: <CalendarOutlined />, count: sprints.length },
    { key: "team", label: "Team Progress", icon: <TeamOutlined />, count: team.length },
  ];

  // Mini multi-segment bar (done / active / remaining)
  const Bar = ({ done, active, rest }: { done: number; active: number; rest: number }) => {
    const total = Math.max(done + active + rest, 1);
    return (
      <div className="po-bar">
        <span style={{ flexGrow: done, background: "#10b981" }} />
        <span style={{ flexGrow: active, background: "#f59e0b" }} />
        <span style={{ flexGrow: rest, background: "var(--border-slate-200)" }} />
        <span style={{ flexGrow: total === 1 && done + active + rest === 0 ? 1 : 0, background: "var(--border-slate-200)" }} />
      </div>
    );
  };

  const statCards = [
    {
      key: "progress",
      label: "Overall Progress",
      icon: <RiseOutlined />,
      color: "#3b82f6",
      tint: "rgba(59,130,246,0.10)",
      value: `${projectProgress}%`,
      foot: (
        <div className="po-bar">
          <span style={{ flexGrow: projectProgress, background: "#3b82f6" }} />
          <span style={{ flexGrow: 100 - projectProgress, background: "var(--border-slate-200)" }} />
        </div>
      ),
    },
    {
      key: "tickets",
      label: "Tickets",
      icon: <CheckSquareOutlined />,
      color: "#8b5cf6",
      tint: "rgba(139,92,246,0.10)",
      value: `${ticketSummary.total}`,
      sub: `${ticketSummary.completed} done`,
      foot: <Bar done={ticketSummary.completed} active={ticketSummary.inProgress} rest={ticketSummary.notStarted} />,
    },
    {
      key: "sprints",
      label: "Sprints",
      icon: <ThunderboltOutlined />,
      color: "#0ea5e9",
      tint: "rgba(14,165,233,0.10)",
      value: `${sprintSummary.total}`,
      sub: `${sprintSummary.completed} completed`,
      foot: <Bar done={sprintSummary.completed} active={sprintSummary.inProgress} rest={sprintSummary.notStarted} />,
    },
    {
      key: "hours",
      label: "Hours Logged",
      icon: <ClockCircleOutlined />,
      color: "#10b981",
      tint: "rgba(16,185,129,0.10)",
      value: `${timeStats.totalHours}h`,
      sub: `${timeStats.daysWorked}d · ${avgPerDay}h / day`,
      foot: null,
    },
  ];

  return (
    <MainLayout>
      <div className="po-shell">
        {/* ============================ SIDEBAR ============================ */}
        <aside className="po-sidebar">
          <div className="po-side-head">
            <Tooltip title="Back to projects">
              <button className="po-back" onClick={() => router.push("/projects/manage")}>
                <ArrowLeftOutlined />
              </button>
            </Tooltip>
            <div className="po-side-logo">{initials || <ProjectOutlined />}</div>
            <div className="po-side-head-text">
              <div className="po-side-title" title={project.name}>{project.name}</div>
              <div className="po-side-subtitle">{project.code ? `#${project.code}` : "Project"} · {(project.status || "").replace("-", " ")}</div>
            </div>
          </div>

          <Button type="primary" icon={<EditOutlined />} className="po-create-btn" onClick={() => setDrawerVisible(true)} block>
            Edit Project
          </Button>

          <div className="po-side-scroll">
            <div className="po-side-section-label">Views</div>
            <div className="po-side-list">
              {VIEWS.map((v) => {
                const active = activeView === v.key;
                return (
                  <button key={v.key} className={`po-view-item ${active ? "is-active" : ""}`} onClick={() => setActiveView(v.key)}>
                    <span className="po-view-icon" style={{ color: active ? "#3B82F6" : "var(--text-slate-400)" }}>{v.icon}</span>
                    <span className="po-view-label">{v.label}</span>
                    {v.count != null && <span className="po-view-count">{v.count}</span>}
                  </button>
                );
              })}
            </div>

            <div className="po-side-section-label">Details</div>
            <div className="po-side-details">
              <div className="po-detail-row">
                <span className="po-detail-key">Status</span>
                <span className="po-detail-pill" style={{ color: statusTint.color, background: statusTint.bg }}>
                  {(project.status || "—").replace("-", " ")}
                </span>
              </div>
              <div className="po-detail-row">
                <span className="po-detail-key">Timeline</span>
                <span className="po-detail-val">
                  {dayjs(project.startDate).format("MMM D")} — {project.endDate ? dayjs(project.endDate).format("MMM D, YYYY") : "Ongoing"}
                </span>
              </div>
              <div className="po-detail-row">
                <span className="po-detail-key">Members</span>
                <span className="po-detail-val">{project.teamCount}</span>
              </div>
              <div style={{ padding: "4px 8px 2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span className="po-detail-key">Progress</span>
                  <span className="po-detail-val">{projectProgress}%</span>
                </div>
                <div className="po-bar">
                  <span style={{ flexGrow: projectProgress, background: "#3b82f6" }} />
                  <span style={{ flexGrow: 100 - projectProgress, background: "var(--border-slate-200)" }} />
                </div>
              </div>
            </div>

            <div className="po-side-section-label">Project Lead</div>
            <div className="po-side-lead">
              <div className="po-lead-avatar">{(project.projectHead || "U").substring(0, 1).toUpperCase()}</div>
              <div className="po-lead-body">
                <span className="po-lead-name">{project.projectHead || "Unassigned"}</span>
                <span className="po-lead-role">Project Manager</span>
              </div>
            </div>
          </div>

          {canReadActivityLog && (
            <button className="po-trash" onClick={() => setHistoryOpen(true)}>
              <HistoryOutlined /> Activity History
            </button>
          )}
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="po-main">
          {/* Stat cards */}
          <div className="po-stats">
            {statCards.map((s) => (
              <div key={s.key} className="po-stat-card">
                <div className="po-stat-top">
                  <span className="po-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                  <span className="po-stat-label">{s.label}</span>
                </div>
                <div className="po-stat-bottom">
                  <span className="po-stat-value">{s.value}</span>
                  {s.sub && <span className="po-stat-sub">{s.sub}</span>}
                </div>
                {s.foot}
              </div>
            ))}
          </div>

          {/* Content per view */}
          <div className="po-content">
            {activeView === "overview" && (
              <div className="po-overview">
                <div className="po-grid-15-9">
                  <CombinedSummaryCard sprintSummary={sprintSummary} ticketSummary={ticketSummary} />
                  <ProjectInfoCard
                    projectHead={project.projectHead}
                    avatarUrl={project.projectHeadAvatar}
                    teamCount={project.teamCount}
                    description={project.description}
                  />
                </div>
                <div className="po-grid-2 po-grid-grow">
                  <RecentActivitiesPanel activities={activities} height="100%" />
                  <InsightsPanel insights={insights} height="100%" />
                </div>
              </div>
            )}

            {activeView === "sprint" && (
              <SprintTable sprints={sprints} selectedSprintId={selectedSprintId} onSelectSprint={setSelectedSprintId} />
            )}

            {activeView === "timeline" &&
              (timelineLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 320,
                    background: "var(--bg-pure-white)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 10,
                  }}
                >
                  <Spin tip="Loading timeline..." />
                </div>
              ) : (
                <TimelineTree tickets={timelineTickets ?? []} />
              ))}

            {activeView === "team" && <TeamProgressCards members={team} />}
          </div>
        </main>
      </div>

      <ProjectFormDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} projectId={projectId} onSuccess={() => refetch()} />
      <TransactionHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entityType="project"
        entityId={projectId}
        subtitle={`${project.code ? `#${project.code} — ` : ""}${project.name}`}
      />

      <style jsx global>{`
        .po-shell {
          display: flex;
          margin: 0 -16px;
          min-height: calc(100vh - 54px);
          background: var(--bg-pure-white);
        }

        /* ---------------- Sidebar ---------------- */
        .po-sidebar {
          width: 248px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0;
          position: sticky;
          top: 0;
          height: calc(100vh - 54px);
        }
        .po-side-head {
          display: flex; align-items: center; gap: 10px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .po-back {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-500); cursor: pointer; font-size: 12px;
          display: inline-flex; align-items: center; justify-content: center; transition: background .12s ease;
        }
        .po-back:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .po-side-logo {
          flex-shrink: 0; width: 34px; height: 34px; border-radius: 9px; background: #3B82F6; color: #fff;
          display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; letter-spacing: 0.02em;
        }
        .po-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .po-side-title { font-size: 15px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .po-side-subtitle { font-size: 10px; color: var(--text-slate-400); font-weight: 700; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .po-create-btn {
          height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          background: #3B82F6 !important; border: none !important; box-shadow: none !important; margin-bottom: 4px;
        }
        .po-create-btn:hover { background: #2563EB !important; }

        .po-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
        .po-side-scroll::-webkit-scrollbar { width: 5px; }
        .po-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
        .po-side-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
        }
        .po-side-scroll > .po-side-section-label:first-child { margin-top: 6px; }
        .po-side-list { display: flex; flex-direction: column; gap: 1px; }
        .po-view-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
          cursor: pointer; transition: background .12s ease; text-align: left;
        }
        .po-view-item:hover { background: var(--bg-slate-50); }
        .po-view-item.is-active { background: var(--bg-blue-50); }
        .po-view-item.is-active .po-view-label { color: var(--text-slate-900); font-weight: 600; }
        .po-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
        .po-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .po-view-count { font-size: 11.5px; font-weight: 600; color: var(--text-slate-400); min-width: 18px; text-align: right; }
        .po-view-item.is-active .po-view-count {
          color: #3B82F6; font-weight: 700; background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
        }

        .po-side-details { display: flex; flex-direction: column; gap: 2px; }
        .po-detail-row { display: flex; align-items: center; justify-content: space-between; padding: 5px 8px; gap: 8px; }
        .po-detail-key { font-size: 11.5px; color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .po-detail-val { font-size: 11.5px; color: var(--text-slate-700); font-weight: 600; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .po-detail-pill { font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.03em; }

        .po-side-lead { display: flex; align-items: center; gap: 10px; padding: 6px 8px; }
        .po-lead-avatar {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #fff;
          display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;
        }
        .po-lead-body { display: flex; flex-direction: column; min-width: 0; }
        .po-lead-name { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .po-lead-role { font-size: 10px; color: var(--text-slate-400); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

        .po-trash {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0; text-align: left;
          margin: 0 -14px; padding: 12px 22px; border-top: 1px solid var(--border-slate-200);
          background: transparent; color: var(--text-slate-600); font-size: 13px; font-weight: 500; cursor: pointer;
        }
        .po-trash .anticon { font-size: 15px; }
        .po-trash:hover { color: #3B82F6; }

        /* ---------------- Main ---------------- */
        .po-main { flex: 1; min-width: 0; padding: 16px 18px 0; display: flex; flex-direction: column; }

        /* Stat cards */
        .po-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
        .po-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 9px; padding: 11px 13px; display: flex; flex-direction: column; gap: 7px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .po-stat-top { display: flex; align-items: center; gap: 8px; }
        .po-stat-icon { width: 24px; height: 24px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; }
        .po-stat-label { font-size: 11.5px; font-weight: 600; color: var(--text-slate-600); }
        .po-stat-bottom { display: flex; align-items: baseline; gap: 7px; }
        .po-stat-value { font-size: 21px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .po-stat-sub { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .po-bar { display: flex; height: 6px; border-radius: 999px; overflow: hidden; background: var(--border-slate-200); }
        .po-bar > span { display: block; transition: flex-grow .4s ease; }

        /* Content grids */
        .po-content { flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .po-overview { display: flex; flex-direction: column; gap: 12px; flex: 1; min-height: 0; }
        .po-grid-15-9 { display: grid; grid-template-columns: 1.55fr 1fr; gap: 12px; align-items: stretch; }
        .po-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .po-grid-grow { flex: 1; min-height: 360px; }

        @media (max-width: 1200px) { .po-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 1100px) { .po-grid-15-9, .po-grid-2 { grid-template-columns: 1fr; } }
        @media (max-width: 820px) {
          .po-sidebar { display: none; }
          .po-topbar-meta { display: none; }
        }
        @media (max-width: 600px) { .po-stats { grid-template-columns: 1fr; } }
      `}</style>
    </MainLayout>
  );
};

export default ProjectOverviewPage;

