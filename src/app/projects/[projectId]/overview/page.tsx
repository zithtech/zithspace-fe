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
import { AppstoreOutlined, BarChartOutlined } from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";

const ProjectOverviewPage = () => {
  const { projectId } = useParams() as { projectId: string };

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["projectOverview", projectId],
    queryFn: () => ProjectService.getProjectOverview(projectId),
    enabled: !!projectId,
  });

  // Log response for debugging as requested by user
  console.log("Project Overview Response:", response);

  const overviewData = response;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Loading project overview..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert
          message="Error"
          description="Failed to load project overview data. Please try again later."
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="p-8">
        <Empty description="No overview data found for this project." />
      </div>
    );
  }

  const { project, ticketSummary, sprintSummary, timeStats, sprints, team, activities, insights } = overviewData;

  // Calculate overall project progress based on tickets
  const projectProgress = ticketSummary.total > 0
    ? Math.round((ticketSummary.completed / ticketSummary.total) * 100)
    : 0;

  return (
    <MainLayout>
      <div className="p-4 bg-[var(--bg-primary)] min-h-screen">
        {/* Header */}
        <OverviewHeader
          name={project.name}
          code={project.code}
          status={project.status}
          startDate={project.startDate}
          endDate={project.endDate}
          progress={projectProgress}
        />

        {/* Summary & Project Info Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={15}>
            <CombinedSummaryCard
              sprintSummary={sprintSummary}
              ticketSummary={ticketSummary}
            />
          </Col>
          <Col xs={24} lg={9}>
            <ProjectInfoCard
              projectHead={project.projectHead}
              teamCount={project.teamCount}
              description={project.description}
            />
          </Col>
        </Row>

        {/* Time Stats Bar */}
        <TimeStatsBar
          hoursLogged={timeStats.totalHours}
          daysWorked={timeStats.daysWorked}
        />

        {/* Main 3-Column Layout */}
        <Row gutter={[16, 16]} className="mt-4">
          {/* Left Column: Sprints */}
          <Col xs={24} lg={8}>
            <SprintProgressList sprints={sprints} />
          </Col>

          {/* Center Column: Team */}
          <Col xs={24} lg={8}>
            <TeamProgressTable members={team} />
          </Col>

          {/* Right Column: Insights & Activity */}
          <Col xs={24} lg={8}>
            <div className="space-y-4">
              <InsightsPanel insights={insights} />
              <RecentActivitiesPanel activities={activities} />
            </div>
          </Col>
        </Row>
      </div>
    </MainLayout>


  );
};

export default ProjectOverviewPage;
