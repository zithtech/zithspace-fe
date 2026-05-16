"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Row, Col, Spin, Empty, Alert } from "antd";
import { ProjectService } from "@/services/projectService";
import { CombinedSummaryCard } from "@/components/projects/overview/CombinedSummaryCard";
import { ProjectInfoCard } from "@/components/projects/overview/ProjectInfoCard";
import { TimeStatsBar } from "@/components/projects/overview/TimeStatsBar";
import { SprintProgressList } from "@/components/projects/overview/SprintProgressList";
import { TeamProgressTable } from "@/components/projects/overview/TeamProgressTable";
import { InsightsPanel } from "@/components/projects/overview/InsightsPanel";
import { RecentActivitiesPanel } from "@/components/projects/overview/RecentActivitiesPanel";
import MainLayout from "@/components/layout/MainLayout";
import { ProjectFormDrawer } from "@/components/projects/ProjectFormDrawer";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import {
  ProjectOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  EditOutlined
} from "@ant-design/icons";
import { Tag, Button, Space, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Text } = Typography;

const ProjectOverviewPage = () => {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };

  const { data: overviewData, isLoading, error, refetch } = useQuery({
    queryKey: ["projectOverview", projectId],
    queryFn: () => ProjectService.getProjectOverview(projectId),
    enabled: !!projectId,
  });

  const [drawerVisible, setDrawerVisible] = React.useState(false);

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
            zIndex: 100,
            margin: "-16px -24px 20px -24px",
            background: "var(--bg-secondary, #f8fafc)",
          }}
        >
          <TimeTrackingHeader
            showIconBox={false}
            icon={
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Tooltip title="Back to projects">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<ArrowLeftOutlined style={{ fontSize: 16 }} />}
                    onClick={() => router.push("/projects/manage")}
                    style={{
                      color: "var(--text-slate-500)",
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                </Tooltip>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#ffffff',
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 15,
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
                  letterSpacing: '0.02em'
                }}>
                  {project.name.split(' ').slice(0, 2).map((n: any[]) => n[0]).join('').toUpperCase() || <ProjectOutlined />}
                </div>
              </div>
            }
            title={project.name}
            subTitle={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                {project.code && (
                  <Tag style={{
                    margin: 0,
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 10,
                    padding: '0 8px',
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-slate-800, #1e293b)',
                    border: 'none',
                    color: '#ffffff',
                    letterSpacing: '0.05em'
                  }}>
                    #{project.code}
                  </Tag>
                )}
                <Tag color={
                  project.status === 'active' ? 'success' :
                    project.status === 'planning' ? 'processing' :
                      project.status === 'on-hold' ? 'warning' : 'default'
                } style={{
                  margin: 0,
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  textTransform: 'uppercase',
                  padding: '0 8px',
                  letterSpacing: '0.05em'
                }}>
                  {project.status.replace('-', ' ')}
                </Tag>
              </div>
            }
            description={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                <div style={{ width: 1, height: 16, background: 'var(--border-color)', margin: '0 4px' }} />
                <Space size={6}>
                  <CalendarOutlined style={{ fontSize: 12, color: "var(--text-slate-400)" }} />
                  <Text style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 600 }}>
                    {dayjs(project.startDate).format("MMM D, YYYY")} — {project.endDate ? dayjs(project.endDate).format("MMM D, YYYY") : "Ongoing"}
                  </Text>
                </Space>
              </div>
            }
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ minWidth: 160 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-slate-400)', textTransform: 'uppercase' }}>Progress</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-slate-900)' }}>{projectProgress}%</Text>
                  </div>
                  <div style={{ height: 6, width: '100%', background: 'var(--bg-secondary, #f1f5f9)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                      width: `${projectProgress}%`,
                      height: '100%',
                      background: 'var(--premium-blue, #3b82f6)',
                      borderRadius: 10,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setDrawerVisible(true)}
                  style={{ borderRadius: 8, height: 38, fontWeight: 600 }}
                >
                  Edit Project
                </Button>
              </div>
            }
            style={{
              borderRadius: 0,
              borderBottom: '1px solid var(--border-color)',
              marginBottom: 0,
              padding: '12px 24px'
            }}
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

        <ProjectFormDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          projectId={projectId}
          onSuccess={() => refetch()}
        />
      </div>
    </MainLayout>
  );
};

export default ProjectOverviewPage;
