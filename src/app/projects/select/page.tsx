'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Input, Empty, Space, Avatar, Tooltip, Progress, Badge, Spin } from 'antd';
import {
  SearchOutlined,
  ProjectOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  LayoutOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { ProjectService } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

// Professional blue color palette constants
const BLUE_PRIMARY = '#2563eb';
const BLUE_LIGHT = '#eff6ff';
const BLUE_BORDER = '#dbeafe';
const BLUE_TEXT = '#1e3a8a';
const BLUE_MUTE = '#60a5fa';

function ProjectSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { canReadProject } = usePermission();
  const [search, setSearch] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(true);

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadProject) {
      router.replace('/dashboard');
      return;
    }
  }, [authLoading, canReadProject, router]);

  // Fetch projects
  const { data: response, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'selection'],
    queryFn: () => ProjectService.getSelectionProjects(),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const projects = Array.isArray(response) ? response : (response?.data || []);
  const isLoading = authLoading || projectsLoading;

  // Optimized redirect logic with verification
  useEffect(() => {
    // Wait until auth and projects are loaded
    if (authLoading || projectsLoading) return;
    
    // If explicitly selecting, don't redirect
    const isExplicitSelect = searchParams.get('select') === 'true';
    if (isExplicitSelect) {
      setIsRedirecting(false);
      return;
    }

    const lastProjectId = localStorage.getItem('lastProjectId');
    if (lastProjectId) {
      // Verify the ID belongs to an accessible project
      const isValid = projects.some((p: any) => p.id === lastProjectId || p.value === lastProjectId);
      
      if (isValid) {
        router.replace(`/projects/${lastProjectId}/tickets`);
        return;
      } else {
        // Clear invalid ID to prevent loops
        localStorage.removeItem('lastProjectId');
      }
    }
    
    setIsRedirecting(false);
  }, [authLoading, projectsLoading, projects, router, searchParams]);

  if (!canReadProject && !authLoading) {
    return null;
  }

  const filteredProjects = projects.filter(p =>
    (p?.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p?.code?.toLowerCase() || '').includes(search.toLowerCase())
  );

  if ((!user && !authLoading) || isRedirecting) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff' }}>
          <Spin size="large" tip="Redirecting..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{
        padding: '32px 40px 48px 40px',
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Header Section - Modern Single Row Layout */}
        <div style={{
          maxWidth: 1200,
          margin: '0 auto 40px auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 32,
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <LayoutOutlined style={{ color: BLUE_PRIMARY, fontSize: 24 }} />
              <Title level={2} style={{
                margin: 0,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                fontSize: '2rem',
                color: '#0f172a'
              }}>
                My Projects
              </Title>
            </div>
            <Paragraph style={{
              fontSize: 15,
              color: '#64748b',
              maxWidth: 500,
              margin: 0,
              lineHeight: 1.5
            }}>
              Manage your workflow, track progress, and collaborate with your team.
            </Paragraph>
          </div>

          <div style={{ flex: '0 0 400px', minWidth: 300 }}>
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 18 }} />}
              placeholder="Search by project name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{
                borderRadius: 12,
                height: 48,
                fontSize: 14,
                border: '1px solid #e2e8f0',
                background: '#fff',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                padding: '0 16px'
              }}
            />
          </div>
        </div>

        {/* Project Cards Grid */}
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {isLoading ? (
            <Row gutter={[32, 32]}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Col xs={24} sm={12} lg={8} key={i}>
                  <Card loading style={{ height: 280, borderRadius: 16, border: '1px solid #f1f5f9' }} />
                </Col>
              ))}
            </Row>
          ) : filteredProjects.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: 24,
              padding: '80px 40px',
              textAlign: 'center',
              border: '1px solid #f1f5f9'
            }}>
              <Empty
                image={<div style={{ fontSize: 64, marginBottom: 16 }}>📁</div>}
                description={
                  <Space direction="vertical" size={4}>
                    <Text strong style={{ fontSize: 20, color: '#1e293b' }}>No Projects Found</Text>
                    <Text style={{ color: '#64748b', fontSize: 16 }}>
                      {search ? `We couldn't find any projects matching "${search}"` : "You haven't been assigned to any projects yet."}
                    </Text>
                  </Space>
                }
              />
            </div>
          ) : (
            <Row gutter={[32, 32]}>
              {filteredProjects.map(project => {
                const progressPercent = (project?.totalTickets || 0) > 0
                  ? Math.round(((project?.completedTickets || 0) / (project?.totalTickets || 1)) * 100)
                  : 0;

                return (
                  <Col xs={24} sm={12} lg={8} key={project?.id || 'unknown'}>
                    <Card
                      hoverable
                      onClick={() => project?.id && router.push(`/projects/${project.id}/tickets`)}
                      style={{
                        height: '100%',
                        borderRadius: 20,
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflow: 'hidden',
                        background: '#fff'
                      }}
                      bodyStyle={{ padding: '24px 28px' }}
                      className="project-selection-card"
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Card Header: Name and Abbreviated Tag */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 16
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                            <div style={{
                              backgroundColor: BLUE_LIGHT,
                              color: BLUE_PRIMARY,
                              padding: '4px 10px',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 800,
                              letterSpacing: '0.05em',
                              border: `1px solid ${BLUE_BORDER}`,
                              flexShrink: 0
                            }}>
                              {project?.name?.substring(0, 2).toUpperCase() || 'PR'}
                            </div>
                            <Title level={4} style={{
                              margin: 0,
                              fontWeight: 700,
                              fontSize: 17,
                              color: '#0f172a'
                            }} ellipsis={{ tooltip: project?.name }}>
                              {project?.name || 'Untitled Project'}
                            </Title>
                          </div>

                          <Tag
                            color={project?.status === 'active' ? 'processing' : 'default'}
                            style={{
                              margin: 0,
                              borderRadius: 100,
                              padding: '1px 10px',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              fontSize: 11,
                              border: 'none',
                              background: project?.status === 'active' ? BLUE_LIGHT : '#f8fafc',
                              color: project?.status === 'active' ? BLUE_PRIMARY : '#64748b',
                              marginLeft: 12
                            }}
                          >
                            {project?.status || 'Active'}
                          </Tag>
                        </div>

                        {/* Tag/Code Badge & Description */}
                        <div style={{ marginBottom: 20 }}>
                          <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 8 }}>
                            #{project?.code || 'N/A'}
                          </Text>
                          <Paragraph
                            style={{ color: '#64748b', fontSize: 14, margin: 0, lineHeight: 1.6 }}
                            ellipsis={{ rows: 2 }}
                          >
                            {project?.description || "Empowering teams to achieve project milestones with efficiency and transparency."}
                          </Paragraph>
                        </div>

                        {/* Progress */}
                        <div style={{ marginBottom: 28 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Task Progress</Text>
                            <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>{progressPercent}%</Text>
                          </div>
                          <Progress
                            percent={progressPercent}
                            showInfo={false}
                            strokeColor={BLUE_PRIMARY}
                            trailColor="#f1f5f9"
                            strokeWidth={8}
                            style={{ margin: 0 }}
                          />
                        </div>

                        {/* Stats & Members */}
                        <div style={{
                          marginTop: 'auto',
                          paddingTop: 20,
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Space size={16}>
                            <Tooltip title="Total Tasks">
                              <Space size={4}>
                                <ProjectOutlined style={{ color: '#94a3b8' }} />
                                <Text strong style={{ fontSize: 13 }}>{project?.totalTickets || 0}</Text>
                              </Space>
                            </Tooltip>
                            <Tooltip title="Active Members">
                              <Space size={4}>
                                <TeamOutlined style={{ color: '#94a3b8' }} />
                                <Text strong style={{ fontSize: 13 }}>{project?.members?.length || 0}</Text>
                              </Space>
                            </Tooltip>
                          </Space>

                          <Avatar.Group
                            maxCount={3}
                            size="small"
                            maxStyle={{
                              color: BLUE_TEXT,
                              backgroundColor: BLUE_LIGHT,
                              fontSize: 10,
                              fontWeight: 700
                            }}
                          >
                            {project?.members?.map((member: any, idx: number) => (
                              <Tooltip title={member?.user?.name} key={idx}>
                                <Avatar
                                  src={member?.user?.avatar}
                                  style={{ backgroundColor: BLUE_MUTE }}
                                >
                                  {member?.user?.name?.[0]?.toUpperCase()}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </Avatar.Group>
                        </div>

                        {/* Hover Action */}
                        <div className="card-arrow" style={{
                          position: 'absolute',
                          top: 24,
                          right: 24,
                          opacity: 0,
                          transform: 'translateX(-10px)',
                          transition: 'all 0.3s ease'
                        }}>
                          <ArrowRightOutlined style={{ color: BLUE_PRIMARY, fontSize: 16 }} />
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>

        <style jsx global>{`
          .project-selection-card:hover {
            border-color: ${BLUE_BORDER} !important;
            transform: translateY(-4px);
            box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.05) !important;
          }
          .project-selection-card:hover .card-arrow {
            opacity: 1 !important;
            transform: translateX(0) !important;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}

export default function ProjectSelectPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff' }}>
          <Spin size="large" tip="Loading ZithSpace..." />
        </div>
      </MainLayout>
    }>
      <ProjectSelectContent />
    </Suspense>
  );
}
