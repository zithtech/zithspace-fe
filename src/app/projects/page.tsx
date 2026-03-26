"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  Button,
  Statistic,
  Spin,
  Tag,
  Divider,
  Progress,
  Empty
} from "antd";
import {
  ProjectOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  ControlOutlined,
  ArrowRightOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTicketDashboardStats } from "@/hooks/useTickets";
import dayjs from "dayjs";

const { Title, Paragraph, Text } = Typography;

export default function ProjectsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { canReadProject } = usePermission();
  const router = useRouter();
  
  const { data: stats, isLoading: statsLoading } = useTicketDashboardStats();

  // Route guard - requires project.read permission
  useEffect(() => {
    if (!authLoading && !canReadProject) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadProject, router]);

  if (authLoading || statsLoading) {
    return (
      <MainLayout>
        <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" tip="Orchestrating your workspace">
            <div style={{ padding: 20 }} />
          </Spin>
        </div>
        </div>
      </MainLayout>
    );
  }

  if (!canReadProject) return null;

  const generalStats = stats?.generalStats || { total: 0, in_progress: 0, not_started: 0, completed: 0, blocked: 0 };
  const projectStats = stats?.projectStats || [];
  const period = stats?.period || { month: dayjs().format('MMMM YYYY') };

  const quickActions = [
    {
      title: "Ticket Dashboard",
      description: "Comprehensive analytics and project visualizer",
      icon: <DashboardOutlined />,
      path: "/projects/dashboard",
      color: "#1677ff",
    },
    {
      title: "View Tickets",
      description: "Manage all tickets with advanced grid filters",
      icon: <UnorderedListOutlined />,
      path: "/projects/select",
      color: "#faad14",
    },
    {
      title: "Create Ticket",
      description: "New ticket with detailed workflow setup",
      icon: <PlusCircleOutlined />,
      path: "/projects/create",
      color: "#52c41a",
    },
  ];

  return (
    <MainLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
        {/* Premium Header */}
        <div style={{ marginBottom: 40 }}>
          <Space align="center" size={16}>
            <div style={{ 
              background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)',
              padding: '12px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(22, 119, 255, 0.2)'
            }}>
              <ProjectOutlined style={{ color: 'white', fontSize: 24 }} />
            </div>
            <div>
              <Title level={1} style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
                Project Overview
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                Welcome back, <Text strong>{user?.name}</Text>. Here's what's happening today.
              </Text>
            </div>
          </Space>
        </div>

        {/* Global Key Metrics */}
        <Row gutter={[20, 20]} style={{ marginBottom: 40 }}>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} hoverable style={{ borderRadius: 16, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <Statistic
                title={<Text strong type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>Active Projects</Text>}
                value={projectStats.length}
                prefix={<ProjectOutlined style={{ color: '#1677ff', marginRight: 8 }} />}
                valueStyle={{ fontWeight: 700, fontSize: 32 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} hoverable style={{ borderRadius: 16, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <Statistic
                title={<Text strong type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>In Progress</Text>}
                value={generalStats.in_progress}
                prefix={<PlayCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                valueStyle={{ fontWeight: 700, fontSize: 32, color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} hoverable style={{ borderRadius: 16, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <Statistic
                title={<Text strong type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>Completed</Text>}
                value={generalStats.completed}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                valueStyle={{ fontWeight: 700, fontSize: 32, color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} hoverable style={{ borderRadius: 16, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
              <Statistic
                title={<Text strong type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>Blocked</Text>}
                value={generalStats.blocked || 0}
                prefix={<ClockCircleOutlined style={{ color: '#f5222d', marginRight: 8 }} />}
                valueStyle={{ fontWeight: 700, fontSize: 32, color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[32, 32]}>
          {/* Main Action Centers */}
          <Col xs={24} lg={17}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, fontSize: 20 }}>Quick Operations</Title>
              </div>
              <Row gutter={[16, 16]}>
                {quickActions.map((action, index) => (
                  <Col xs={24} md={8} key={index}>
                    <Card
                      hoverable
                      bordered={false}
                      style={{ 
                        borderRadius: 20, 
                        textAlign: 'center', 
                        padding: '12px 0',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                        transition: 'transform 0.3s ease'
                      }}
                      onClick={() => router.push(action.path)}
                    >
                      <div style={{ 
                        fontSize: 32, 
                        color: action.color, 
                        marginBottom: 16,
                        background: `${action.color}10`,
                        width: 64,
                        height: 64,
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                      }}>
                        {action.icon}
                      </div>
                      <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 16 }}>{action.title}</Title>
                      <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20, minHeight: 40 }}>
                        {action.description}
                      </Paragraph>
                      <Button 
                        type="text" 
                        icon={<ArrowRightOutlined />} 
                        style={{ color: action.color, fontWeight: 600 }}
                      >
                        Enter
                      </Button>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Active Projects Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0, fontSize: 20 }}>Active Development Focus</Title>
              <Button type="link" onClick={() => router.push('/projects/manage')}>Manage Projects</Button>
            </div>
            
            <Row gutter={[20, 20]}>
              {projectStats.map((project) => {
                const completed = project.statuses.find(s => s.status === 'completed')?.count || 0;
                const progress = Math.round((completed / (project.total || 1)) * 100);
                
                return (
                  <Col xs={24} md={12} key={project.id}>
                    <Card 
                      hoverable 
                      bordered={false}
                      style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                      onClick={() => router.push(`/projects/${project.id}/tickets`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <Space direction="vertical" size={2}>
                          <Text strong style={{ fontSize: 18 }}>{project.id}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>Last updated {dayjs().format('MMM D')}</Text>
                        </Space>
                        <Tag color="cyan" style={{ borderRadius: 20, margin: 0, padding: '2px 10px' }}>Active</Tag>
                      </div>

                      <Row gutter={12} style={{ marginBottom: 24 }}>
                        <Col span={12}>
                          <div style={{ padding: 12, background: '#f9f9f9', borderRadius: 12 }}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Total Load</Text>
                            <Text strong style={{ fontSize: 20 }}>{project.total}</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ padding: 12, background: '#f0f5ff', borderRadius: 12 }}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase', color: '#1677ff' }}>Pending</Text>
                            <Text strong style={{ fontSize: 20, color: '#1677ff' }}>{project.total - completed}</Text>
                          </div>
                        </Col>
                      </Row>

                      <div style={{ marginBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text strong style={{ fontSize: 13 }}>Completion Progress</Text>
                          <Text strong style={{ color: '#52c41a' }}>{progress}%</Text>
                        </div>
                        <Progress 
                          percent={progress} 
                          status="active" 
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }} 
                          showInfo={false}
                        />
                      </div>
                    </Card>
                  </Col>
                );
              })}
              {projectStats.length === 0 && (
                <Col span={24}>
                  <Empty description="No active project data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </Col>
              )}
            </Row>
          </Col>

          {/* Right Sidebar: Quick Insights */}
          <Col xs={24} lg={7}>
            <Card 
              bordered={false} 
              style={{ 
                borderRadius: 20, 
                background: '#fafafa', 
                border: '1px solid #f0f0f0',
                marginBottom: 24 
              }}
            >
              <Title level={4} style={{ fontSize: 18, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <ThunderboltOutlined style={{ color: '#faad14' }} /> Daily Insight
              </Title>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a' }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14 }}>Productivity Peak</Text>
                    <Paragraph type="secondary" style={{ fontSize: 13, margin: '4px 0 0 0' }}>
                      Overall completion rate is at {Math.round((generalStats.completed / (generalStats.total || 1)) * 100)}% this month.
                    </Paragraph>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#faad14' }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14 }}>Focus Area</Text>
                    <Paragraph type="secondary" style={{ fontSize: 13, margin: '4px 0 0 0' }}>
                      You have {generalStats.in_progress} tasks in progress across all projects.
                    </Paragraph>
                  </div>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Want deeper insights?
                  </Text>
                  <Button 
                    type="link" 
                    icon={<ArrowRightOutlined />} 
                    style={{ display: 'block', margin: '8px auto' }}
                    onClick={() => router.push('/projects/dashboard')}
                  >
                    Go to Full Dashboard
                  </Button>
                </div>
              </div>
            </Card>

            {/* Support/Resource Card */}
            <Card 
              style={{ 
                borderRadius: 20, 
                background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 8px 24px rgba(22, 119, 255, 0.25)'
              }}
            >
              <Space direction="vertical" size={16}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  width: 40, 
                  height: 40, 
                  borderRadius: 12, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <CalendarOutlined style={{ fontSize: 20 }} />
                </div>
                <div>
                  <Title level={4} style={{ color: '#fff', margin: 0, fontSize: 18 }}>Release Planning</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                    Sync your tickets with release plans to track delivery milestones.
                  </Text>
                </div>
                <Button 
                  ghost 
                  style={{ borderRadius: 8, fontWeight: 600, border: '1px solid rgba(255,255,255,0.5)' }}
                  onClick={() => router.push('/projects/plans')}
                >
                  Configure Plans
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
