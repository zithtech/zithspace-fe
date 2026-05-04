"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Row, Col, Spin, Empty, Alert } from "antd";
import { ProjectService } from "@/services/projectService";
import { OverviewHeader } from "@/components/projects/overview/OverviewHeader";
import { CombinedSummaryCard } from "@/components/projects/overview/CombinedSummaryCard";
import { ProjectInfoCard } from "@/components/projects/overview/ProjectInfoCard";
import { TimeStatsBar } from "@/components/projects/overview/TimeStatsBar";
import { SprintProgressList } from "@/components/projects/overview/SprintProgressList";
import { TeamProgressTable } from "@/components/projects/overview/TeamProgressTable";
import { InsightsPanel } from "@/components/projects/overview/InsightsPanel";
import { RecentActivitiesPanel } from "@/components/projects/overview/RecentActivitiesPanel";
import MainLayout from "@/components/layout/MainLayout";
import { useTicketSocketEvents } from "@/hooks/useTicketSocketEvents";
import { usePlanSocketEvents } from "@/hooks/usePlanSocketEvents";
import { useProjectSocketEvents } from "@/hooks/useProjectSocketEvents";

const ProjectOverviewPage = () => {
  const { projectId } = useParams() as { projectId: string };

  // Initialize real-time synchronization
  useTicketSocketEvents();
  usePlanSocketEvents();
  useProjectSocketEvents();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["projectOverview", projectId],
    queryFn: () => ProjectService.getProjectOverview(projectId),
    enabled: !!projectId,
  });

  const overviewData = response;

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
          <Alert
            message="Error"
            description="Failed to load project overview data. Please try again later."
            type="error"
            showIcon
          />
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

  const { project, ticketSummary, sprintSummary, timeStats, sprints, team, activities, insights } =
    overviewData;

  const projectProgress =
    ticketSummary.total > 0 ? Math.round((ticketSummary.completed / ticketSummary.total) * 100) : 0;

  return (
    <MainLayout>
      <div
        style={{
          margin: "-16px -16px 0 -16px",
          padding: "16px 24px 24px",
          background: "var(--bg-secondary, #f8fafc)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            marginBottom: 16,
            background: "var(--bg-secondary, #f8fafc)",
            paddingTop: 4,
          }}
        >
          <OverviewHeader
            name={project.name}
            code={project.code}
            status={project.status}
            startDate={project.startDate}
            endDate={project.endDate}
            progress={projectProgress}
          />
        </div>

        {/* Summary + Info */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={15}>
            <CombinedSummaryCard sprintSummary={sprintSummary} ticketSummary={ticketSummary} />
          </Col>
          <Col xs={24} lg={9}>
            <ProjectInfoCard
              projectHead={project.projectHead}
              avatarUrl={project.projectHeadAvatar}
              teamCount={project.teamCount}
              description={project.description}
            />
          </Col>
        </Row>

        {/* Time Stats */}
        <TimeStatsBar hoursLogged={timeStats.totalHours} daysWorked={timeStats.daysWorked} />

        {/* Main 3-column */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <SprintProgressList sprints={sprints} />
          </Col>
          <Col xs={24} lg={8}>
            <TeamProgressTable members={team} />
          </Col>
          <Col xs={24} lg={8}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <RecentActivitiesPanel activities={activities} />
              <InsightsPanel insights={insights} />
            </div>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
};

export default ProjectOverviewPage;
