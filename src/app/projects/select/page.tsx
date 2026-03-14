'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Input, Empty, Space, Avatar, Tooltip, Progress, Badge } from 'antd';
import { SearchOutlined, ProjectOutlined, UserOutlined, TeamOutlined, CheckCircleOutlined, SyncOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Spin } from 'antd';
import { Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { ProjectService } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

// Helper to generate a consistent color from a string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Helper for status colors
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success';
    case 'completed': return 'blue';
    case 'on_hold': return 'warning';
    case 'archived': return 'default';
    default: return 'processing';
  }
};

function ProjectSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { canReadProject } = usePermission();
  const [search, setSearch] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(true); // Start true to prevent flash

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadProject) {
      router.replace('/dashboard');
      return;
    }
  }, [authLoading, canReadProject, router]);

  // Auto-redirect logic
  React.useEffect(() => {
    // If user explicitly wants to select (via query param), skip redirect
    const isExplicitSelect = searchParams.get('select') === 'true';

    if (!isExplicitSelect) {
      const lastProjectId = localStorage.getItem('lastProjectId');
      if (lastProjectId) {
        // Check if lastProjectId is valid (optional, but good UX)
        // For speed, we just redirect. If 404, the project page handles it.
        router.replace(`/projects/${lastProjectId}/tickets`);
        return;
      }
    }

    // If no redirect happens, stop loading
    setIsRedirecting(false);
  }, [router, searchParams]);

  // Fetch full project details including Stats and Members
  const { data: response, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'selection'],
    queryFn: () => ProjectService.getSelectionProjects(),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  // API service already unwraps `data` from Axios response, but returns `PaginatedResponse` or just Array
  // The service method return type is `Promise<PaginatedResponse<Project>>` or `any` depending on our manual typing.
  // The `api.get` helper unwraps `response.data.data` IF `response.data.success` is true.

  // Checking `src/services/projectService.ts`, `getSelectionProjects` calls `api.get`.
  // `api.get` returns `response.data.data`.
  // So `response` here IS the array of projects (or `PaginatedResponse` if structured that way).
  // The backend controller returns `{ success: true, data: enrichedProjects }`.
  // `api.get` returns `enrichedProjects` directly.

  const projects = Array.isArray(response) ? response : (response?.data || []);
  const isLoading = authLoading || projectsLoading;

  // Permission check
  if (!canReadProject && !authLoading) {
    return null;
  }

  // Filter projects based on search
  const filteredProjects = projects.filter(p =>
    (p?.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p?.code?.toLowerCase() || '').includes(search.toLowerCase())
  );

  if ((!user && !authLoading) || isRedirecting) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" tip="Redirecting to your last project..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: '24px 40px', minHeight: '100vh', background: '#f0f2f5' }}>
        {/* Header Section */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ marginBottom: 8, color: '#001529' }}>
              My Projects
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Select a project to view tickets, sprints, and analytics
            </Text>
          </div>
          <div style={{ width: 400 }}>
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            />
          </div>
        </div>

        {/* Project Cards Grid */}
        {isLoading ? (
          <Row gutter={[24, 24]}>
            {[1, 2, 3, 4].map(i => (
              <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                <Card loading style={{ height: 350, borderRadius: 12 }} />
              </Col>
            ))}
          </Row>
        ) : filteredProjects.length === 0 ? (
          <Card style={{ borderRadius: 12, textAlign: 'center', padding: 60 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical">
                  <Text strong style={{ fontSize: 16 }}>No Projects Found</Text>
                  <Text type="secondary">
                    {search ? `No matches for "${search}"` : "You haven't been assigned to any projects yet."}
                  </Text>
                </Space>
              }
            />
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredProjects.map(project => {
              const progressPercent = (project?.totalTickets || 0) > 0
                ? Math.round(((project?.completedTickets || 0) / (project?.totalTickets || 1)) * 100)
                : 0;

              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={project?.id || 'unknown'}>
                  <Card
                    hoverable
                    onClick={() => project?.id && router.push(`/projects/${project.id}/tickets`)}
                    style={{
                      height: '100%',
                      borderRadius: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      border: '1px solid #f0f0f0',
                      transition: 'all 0.3s ease'
                    }}
                    bodyStyle={{
                      padding: 24,
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    actions={[]} // Removed actions as requested
                  >
                    {/* Card Header */}
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Space align="start">
                        <Avatar
                          shape="square"
                          size={48}
                          style={{
                            backgroundColor: '#1890ff', // Standard blue
                            fontSize: 20,
                            fontWeight: 'bold',
                            borderRadius: 12
                          }}
                        >
                          {project?.code?.substring(0, 2) || 'PR'}
                        </Avatar>
                        <div>
                          <Title level={4} style={{ margin: 0, lineHeight: 1.2, width: 200 }} ellipsis={{ tooltip: project?.name }}>
                            {project?.name || 'Untitled Project'}
                          </Title>
                          <Space size={4}>
                            <Tag bordered={false} color="blue">#{project?.code || 'N/A'}</Tag>
                            {/* Simplified status badge to blue/default */}
                            <Badge
                              status={project?.status === 'active' ? 'processing' : 'default'}
                              text={<Text type="secondary" style={{ fontSize: 12 }}>{project?.status || 'Active'}</Text>}
                            />
                          </Space>
                        </div>
                      </Space>
                    </div>

                    {/* Description */}
                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 2, tooltip: project?.description }}
                      style={{ marginBottom: 24, fontSize: 14, minHeight: 44 }}
                    >
                      {project?.description || "No description provided for this project."}
                    </Paragraph>

                    {/* Stats Grid - Monotone/Blue Theme */}
                    <div style={{ marginBottom: 24, background: '#f5f8fa', padding: 12, borderRadius: 8, border: '1px solid #e6f7ff' }}>
                      <Row gutter={8} style={{ textAlign: 'center' }}>
                        <Col span={8}>
                          <StatisticItem icon={<ProjectOutlined style={{ color: '#1890ff' }} />} value={project?.totalTickets || 0} label="Total" color="#262626" />
                        </Col>
                        <Col span={8}>
                          <StatisticItem icon={<SyncOutlined spin={(project?.inProgressTickets || 0) > 0} style={{ color: '#1890ff' }} />} value={project?.inProgressTickets || 0} label="In Progress" color="#262626" />
                        </Col>
                        <Col span={8}>
                          <StatisticItem icon={<CheckCircleOutlined style={{ color: '#1890ff' }} />} value={project?.completedTickets || 0} label="Done" color="#262626" />
                        </Col>
                      </Row>
                      <div style={{ marginTop: 12 }}>
                        {/* Blue progress bar */}
                        <Progress percent={progressPercent} size="small" strokeColor="#1890ff" showInfo={false} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>Progress</Text>
                          <Text strong style={{ fontSize: 11, color: '#1890ff' }}>{progressPercent}%</Text>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <Row align="middle" justify="space-between">
                        {/* Project Manager */}
                        <Col>
                          <Space size={8}>
                            <Avatar
                              size="small"
                              icon={<UserOutlined />}
                              src={undefined}
                              style={{ backgroundColor: '#1890ff' }} // Blue for PM
                            >
                              {project?.projectManager?.name?.[0]}
                            </Avatar>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <Text style={{ fontSize: 12, fontWeight: 500 }}>{project?.projectManager?.name || 'Unknown'}</Text>
                              <Text type="secondary" style={{ fontSize: 10 }}>Project Manager</Text>
                            </div>
                          </Space>
                        </Col>

                        {/* Team Members */}
                        <Col>
                          <Avatar.Group
                            maxCount={4}
                            maxStyle={{ color: '#1890ff', backgroundColor: '#e6f7ff' }} // Blue theme for overflow
                            size="small"
                          >
                            {project?.members?.map((member: any, idx: number) => (
                              <Tooltip title={`${member?.user?.name} (${member?.user?.position || 'Member'})`} key={idx}>
                                <Avatar style={{ backgroundColor: stringToColor(member?.user?.name || '') }}>
                                  {member?.user?.name?.[0]?.toUpperCase()}
                                </Avatar>
                              </Tooltip>
                            ))}
                            {(!project?.members || project.members.length === 0) && (
                              <Tooltip title="No team members">
                                <Avatar icon={<UserOutlined />} />
                              </Tooltip>
                            )}
                          </Avatar.Group>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    </MainLayout>
  );
}

// Mini Component for Stats
const StatisticItem = ({ icon, value, label, color }: any) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <Text strong style={{ fontSize: 16, color: color }}>
      {value}
    </Text>
    <div style={{ marginTop: 4 }}>{icon}</div>
    <Text type="secondary" style={{ fontSize: 11, marginTop: 2 }}>{label}</Text>
  </div>
);


export default function ProjectSelectPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" tip="Loading..." />
        </div>
      </MainLayout>
    }>
      <ProjectSelectContent />
    </Suspense>
  );
}
