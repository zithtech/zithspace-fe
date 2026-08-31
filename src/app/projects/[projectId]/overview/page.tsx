"use client";

import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Alert, Tooltip, Button, Space, Divider } from "antd";
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
  ClockCircleOutlined,
  CheckSquareOutlined,
  HistoryOutlined,
  ReloadOutlined,
  CrownOutlined,
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

  const { data: overviewData, isLoading, isFetching, error, refetch } = useQuery({
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
          <ZukvoLoader size="lg" message="Loading project overview..." />
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
          <NoData description="No overview data found for this project." />
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

  return (
    <MainLayout noPadding>
      <div className="po-shell">
        {/* ── Header row — back, breadcrumb, actions ─────────────────── */}
        <div className="saas-header-container sc-header">
          <Tooltip title="Back to projects">
            <Button
              type="text"
              size="small"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/projects/manage")}
              className="po-back"
              aria-label="Back to projects"
            />
          </Tooltip>

          <Divider type="vertical" style={{ height: 24, margin: 0, opacity: 0.5 }} />

          <div className="po-crumbs">
            <button type="button" className="po-crumb" onClick={() => router.push("/projects/manage")}>Projects</button>
            <span className="po-sep">›</span>
            <span className="po-crumb-title" title={project.name}>{project.name}</span>
            {project.code ? <span className="po-crumb-code">#{project.code}</span> : null}
          </div>

          <div className="sc-header-controls" />

          <Space size={10} className="sc-header-right">
            <Tooltip title="Refresh overview">
              <Button
                icon={<ReloadOutlined spin={isFetching} />}
                onClick={() => refetch()}
                style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>
            {canReadActivityLog && (
              <Tooltip title="Activity history">
                <Button
                  icon={<HistoryOutlined />}
                  onClick={() => setHistoryOpen(true)}
                  style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Tooltip>
            )}
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setDrawerVisible(true)}
              style={{ height: 36, borderRadius: 8, fontWeight: 700 }}
            >
              Edit Project
            </Button>
          </Space>
        </div>

        {/* ── Overview banner — identity, the numbers the stat cards
             carried, and delivery progress. ─────────────────────────── */}
        <div className="tl-section-head tl-sprint-head-v2 po-banner">
          <div className="tl-sprint-row1">
            <div className="tl-sprint-title-block">
              <span className="po-banner-mark" style={{ background: statusTint.bg, color: statusTint.color }}>
                {initials || <ProjectOutlined />}
              </span>
              <span className="po-banner-id">
                <span className="po-banner-title" title={project.name}>{project.name}</span>
                <span className="po-banner-sub">
                  {project.description || "No description provided."}
                </span>
              </span>
              <span className="tl-sprint-tags">
                <span
                  className="tl-sprint-tag"
                  style={{ color: statusTint.color, borderColor: `${statusTint.color}52` }}
                >
                  {(project.status || "—").replace("-", " ")}
                </span>
                <span className="tl-sprint-tag tl-sprint-tag-neutral">{project.teamCount} MEMBERS</span>
              </span>
            </div>
          </div>

          <div className="tl-sprint-row2">
            <span className="tl-sprint-meta">
              <CalendarOutlined style={{ fontSize: 11 }} />
              <span>{dayjs(project.startDate).format("MMM D")}</span>
              <span className="po-arrow">→</span>
              <span>{project.endDate ? dayjs(project.endDate).format("MMM D, YYYY") : "Ongoing"}</span>
            </span>
            <span className="tl-sprint-meta">
              <CheckSquareOutlined style={{ fontSize: 11 }} />
              <b>{ticketSummary.completed}</b>/{ticketSummary.total} tickets done
            </span>
            <span className="tl-sprint-meta">
              <ThunderboltOutlined style={{ fontSize: 11 }} />
              <b>{sprintSummary.completed}</b>/{sprintSummary.total} sprints completed
            </span>
            <span className="tl-sprint-meta">
              <ClockCircleOutlined style={{ fontSize: 11 }} />
              <b>{timeStats.totalHours}h</b> logged · {avgPerDay}h / day
            </span>
            <span className="tl-sprint-meta">
              <CrownOutlined style={{ fontSize: 11 }} />
              <span>Lead</span>
              <b>{project.projectHead || "Unassigned"}</b>
            </span>
          </div>

          <div className="tl-sprint-row3">
            <div className="tl-sprint-progress-bar">
              <div className="tl-sprint-progress-fill" style={{ width: `${Math.min(100, projectProgress)}%` }} />
            </div>
            <span className="tl-sprint-progress-pct">{projectProgress}%</span>
          </div>
        </div>

        {/* ── View tabs — the rail's Views list ──────────────────────── */}
        <div className="po-tabs" role="tablist">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={activeView === v.key}
              className={`po-tab${activeView === v.key ? " is-active" : ""}`}
              onClick={() => setActiveView(v.key)}
            >
              <span className="po-tab__ic">{v.icon}</span>
              <span className="po-tab__label">{v.label}</span>
              {v.count != null && <span className="po-tab__count">{v.count}</span>}
            </button>
          ))}
        </div>

        {/* ── Content per view ──────────────────────────────────────── */}
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
              <div className="po-panel po-panel--center">
                <ZukvoLoader size="md" message="Loading timeline..." />
              </div>
            ) : (
              <TimelineTree tickets={timelineTickets ?? []} />
            ))}

          {activeView === "team" && <TeamProgressCards members={team} />}
        </div>
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
        /* ── Shell ──────────────────────────────────────────────────── */
        .po-shell {
          display: flex;
          flex-direction: column;
          margin: 0;
          min-height: calc(100vh - 54px);
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .po-shell { background: #0f1419; }

        /* ── Header row, matched to the Ticket List ─────────────────── */
        .sc-header {
          position: sticky;
          top: 0;
          z-index: 100;
          margin: 0;
          padding: 9.7px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .sc-header { background: #0f1419; border-bottom-color: #1f2937; }
        .sc-header-controls { flex: 1; min-width: 0; }
        .sc-header-right { flex-shrink: 0; }

        .po-back {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          display: inline-flex !important; align-items: center; justify-content: center;
          color: var(--text-slate-500);
        }
        .po-back:hover { background: var(--bg-slate-100); color: #2563eb; }
        .po-crumbs { display: flex; align-items: center; gap: 6px; min-width: 0; }
        .po-crumb {
          font-size: 12px; font-weight: 600; color: var(--text-slate-500);
          background: none; border: none; padding: 0; cursor: pointer; white-space: nowrap;
          font-family: inherit;
        }
        button.po-crumb:hover { color: #2563eb; text-decoration: underline; }
        .po-sep { color: var(--text-slate-300); font-size: 11px; flex-shrink: 0; }
        .po-crumb-title {
          font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em;
          min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        [data-theme='dark'] .po-crumb-title { color: #f1f5f9; }
        .po-crumb-code {
          font-size: 10px; font-weight: 800; letter-spacing: 0.04em;
          color: var(--text-slate-400); background: var(--bg-slate-100);
          border-radius: 4px; padding: 2px 5px; flex-shrink: 0;
        }
        [data-theme='dark'] .po-crumb-code { background: #1e293b; }

        /* ── Banner ─────────────────────────────────────────────────── */
        .tl-section-head {
          padding: 12px 16px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .tl-section-head { background: #0f1419; border-bottom-color: #1f2937; }
        .tl-sprint-head-v2 { display: flex; flex-direction: column; gap: 8px; }
        .tl-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .tl-sprint-title-block { display: flex; align-items: center; gap: 11px; min-width: 0; flex: 1 1 auto; }

        .po-banner-mark {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 40px; height: 40px; border-radius: 10px;
          font-size: 14px; font-weight: 800; letter-spacing: -0.01em;
        }
        .po-banner-id { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
        .po-banner-title {
          font-size: 15px; font-weight: 800; color: var(--text-slate-900);
          letter-spacing: -0.02em; line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        [data-theme='dark'] .po-banner-title { color: #f1f5f9; }
        .po-banner-sub {
          font-size: 11.5px; color: var(--text-slate-500); margin-top: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .tl-sprint-tags { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .tl-sprint-tag {
          display: inline-flex; align-items: center; height: 19px; padding: 0 7px;
          font-size: 9px; font-weight: 800; letter-spacing: 0.05em; border-radius: 5px;
          border: 1px solid transparent; text-transform: uppercase; line-height: 1;
          background: transparent;
        }
        .tl-sprint-tag-neutral { color: #64748b; border-color: rgba(100,116,139,0.32); }

        .tl-sprint-row2 { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding-left: 51px; }
        .tl-sprint-meta {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -0.005em;
        }
        .tl-sprint-meta b { color: var(--text-slate-900); font-weight: 800; }
        .po-arrow { color: var(--text-slate-400); }
        [data-theme='dark'] .tl-sprint-meta { color: #94a3b8 !important; }
        [data-theme='dark'] .tl-sprint-meta b { color: #f1f5f9 !important; }

        .tl-sprint-row3 { display: flex; align-items: center; gap: 12px; padding-left: 51px; }
        .tl-sprint-progress-bar {
          flex: 1 1 auto; position: relative; height: 6px;
          background: var(--bg-slate-100); border-radius: 999px; overflow: hidden; min-width: 60px;
        }
        [data-theme='dark'] .tl-sprint-progress-bar { background: #1f2937 !important; }
        .tl-sprint-progress-fill {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          border-radius: 999px; transition: width 0.4s ease;
        }
        .tl-sprint-progress-pct {
          flex-shrink: 0; font-size: 12px; font-weight: 800; color: var(--text-slate-900);
          font-variant-numeric: tabular-nums; min-width: 36px; text-align: right;
        }
        [data-theme='dark'] .tl-sprint-progress-pct { color: #f1f5f9 !important; }

        /* ── View tabs ──────────────────────────────────────────────── */
        .po-tabs {
          display: flex; align-items: center; gap: 2px;
          padding: 0 16px;
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .po-tabs::-webkit-scrollbar { display: none; }
        [data-theme='dark'] .po-tabs { background: #0f1419; border-bottom-color: #1f2937; }
        .po-tab {
          position: relative;
          display: inline-flex; align-items: center; gap: 7px;
          height: 40px; padding: 0 12px;
          background: none; border: none; cursor: pointer; font-family: inherit;
          font-size: 12.5px; font-weight: 600; color: var(--text-slate-500);
          white-space: nowrap;
          transition: color .12s ease;
        }
        .po-tab::after {
          content: ''; position: absolute; left: 8px; right: 8px; bottom: -1px; height: 2px;
          background: #3B82F6; border-radius: 2px 2px 0 0;
          opacity: 0; transform: scaleX(.6); transition: opacity .14s ease, transform .14s ease;
        }
        .po-tab:hover { color: var(--text-slate-900); }
        .po-tab.is-active { color: #3B82F6; font-weight: 700; }
        .po-tab.is-active::after { opacity: 1; transform: scaleX(1); }
        .po-tab:focus-visible { outline: none; box-shadow: inset 0 0 0 2px rgba(59,130,246,.24); border-radius: 6px; }
        .po-tab__ic { display: inline-flex; font-size: 13px; }
        .po-tab__count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 17px; padding: 0 5px; border-radius: 999px;
          background: var(--bg-slate-100); color: var(--text-slate-500);
          font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .po-tab.is-active .po-tab__count { background: var(--bg-blue-50); color: #3B82F6; }
        [data-theme='dark'] .po-tab__count { background: #1e293b; color: #94a3b8; }

        /* ── Content ────────────────────────────────────────────────── */
        .po-content { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 14px 16px 18px; }
        .po-overview { display: flex; flex-direction: column; gap: 12px; flex: 1; min-height: 0; }
        .po-grid-15-9 { display: grid; grid-template-columns: 1.55fr 1fr; gap: 12px; align-items: stretch; }
        .po-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .po-grid-grow { flex: 1; min-height: 360px; }
        .po-bar { display: flex; height: 6px; border-radius: 999px; overflow: hidden; background: var(--border-slate-200); }
        .po-bar > span { display: block; transition: flex-grow .4s ease; }

        /* ── One panel system, shared by every card on this page ────── */
        .po-panel {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .po-panel:hover { box-shadow: 0 4px 14px rgba(15,23,42,0.06); }
        [data-theme='dark'] .po-panel {
          background: #111720;
          border-color: #1f2937;
          box-shadow: none;
        }
        .po-panel--center { align-items: center; justify-content: center; min-height: 320px; }

        .po-panel__head {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          flex-shrink: 0;
        }
        [data-theme='dark'] .po-panel__head { background: #0f1419; border-bottom-color: #1f2937; }
        .po-panel__head-ic {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 26px; height: 26px; border-radius: 8px; font-size: 12px;
        }
        .po-panel__title {
          font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text-slate-500);
        }
        [data-theme='dark'] .po-panel__title { color: #94a3b8; }
        .po-panel__body { flex: 1; min-height: 0; overflow-y: auto; padding: 14px; }
        .po-panel__body--flush { padding: 0; }

        /* antd cards inside the content adopt the same surface */
        .po-content .ant-card {
          border-radius: 10px !important;
          border: 1px solid var(--border-slate-200) !important;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04) !important;
        }
        [data-theme='dark'] .po-content .ant-card {
          background: #111720 !important;
          border-color: #1f2937 !important;
          box-shadow: none !important;
        }

        /* ── Responsive ─────────────────────────────────────────────── */
        @media (max-width: 1100px) {
          .po-grid-15-9 { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .po-grid-2 { grid-template-columns: 1fr; }
          .po-grid-grow { min-height: 0; }
          .tl-sprint-row2, .tl-sprint-row3 { padding-left: 0; }
          .po-banner-sub { display: none; }
        }
        @media (max-width: 640px) {
          .po-content { padding: 12px 12px 16px; }
          .po-tabs { padding: 0 12px; }
          .po-tab__label { display: none; }
        }
      `}</style>
    </MainLayout>
  );
};

export default ProjectOverviewPage;

