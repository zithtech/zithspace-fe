'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Progress,
  List,
  Avatar,
  Tag,
  Button,
  Divider,
} from 'antd';
import {
  TeamOutlined,
  ProjectOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  CalendarOutlined,
  BellOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading dashboard..." />
      </MainLayout>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  // Mock data - in real app, this would come from APIs
  const stats = [
    {
      title: 'Total Members',
      value: 24,
      icon: <TeamOutlined style={{ color: '#1677ff' }} />,
      color: '#1677ff',
      change: '+12%',
    },
    {
      title: 'Active Projects',
      value: 8,
      icon: <ProjectOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
      change: '+5%',
    },
    {
      title: 'Assigned Tickets / Closed Tickets',
      value: '120 / 95',
      icon: <UserOutlined style={{ color: '#faad14' }} />,
      color: '#faad14',
      change: '+8%',
    },
    {
      title: 'Monthly Revenue',
      value: 45000,
      prefix: '$',
      icon: <DollarOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1',
      change: '+15%',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      user: 'John Doe',
      action: 'completed task',
      target: 'Website Redesign',
      time: '2 hours ago',
      avatar: 'J',
      color: '#1677ff',
    },
    {
      id: 2,
      user: 'Sarah Wilson',
      action: 'created project',
      target: 'Mobile App Development',
      time: '4 hours ago',
      avatar: 'S',
      color: '#52c41a',
    },
    {
      id: 3,
      user: 'Mike Johnson',
      action: 'updated client',
      target: 'Tech Corp',
      time: '6 hours ago',
      avatar: 'M',
      color: '#faad14',
    },
    {
      id: 4,
      user: 'Emily Davis',
      action: 'submitted report',
      target: 'Q4 Analytics',
      time: '8 hours ago',
      avatar: 'E',
      color: '#722ed1',
    },
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: 'Client Meeting - Tech Corp',
      time: 'Today, 2:00 PM',
      priority: 'high',
      type: 'meeting',
    },
    {
      id: 2,
      title: 'Code Review - Mobile App',
      time: 'Tomorrow, 10:00 AM',
      priority: 'medium',
      type: 'review',
    },
    {
      id: 3,
      title: 'Project Deadline - Website',
      time: 'Friday, 5:00 PM',
      priority: 'high',
      type: 'deadline',
    },
    {
      id: 4,
      title: 'Team Standup Meeting',
      time: 'Monday, 9:00 AM',
      priority: 'low',
      type: 'meeting',
    },
  ];

  const projectProgress = [
    {
      name: 'Squad 1',
      progress: 85,
      status: 'active',
      color: '#1677ff',
    },
    {
      name: 'Squad 2',
      progress: 60,
      status: 'active',
      color: '#52c41a',
    },
    {
      name: 'Squad 3',
      progress: 40,
      status: 'active',
      color: '#faad14',
    },
    {
      name: 'Squad 4',
      progress: 95,
      status: 'review',
      color: '#722ed1',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ff4d4f';
      case 'medium':
        return '#faad14';
      case 'low':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#262626' }}>
            Welcome back, {user?.name}!
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Here&apos;s what&apos;s happening with your projects today.
          </Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                size="small"
                style={{
                  borderLeft: `4px solid ${stat.color}`,
                  height: '100%',
                }}
                styles={{ body: { padding: 16 } }}
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                      {stat.title}
                    </Text>
                    {stat.icon}
                  </Space>
                  <Space align="baseline">
                    <Statistic
                      value={stat.value}
                      prefix={stat.prefix}
                      valueStyle={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: '#262626',
                        lineHeight: 1,
                      }}
                    />
                    <Tag
                      color="green"
                      style={{
                        fontSize: 10,
                        padding: '0 4px',
                        margin: 0,
                        border: 'none',
                      }}
                    >
                      <RiseOutlined /> {stat.change}
                    </Tag>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          {/* Project Progress */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#1677ff' }} />
                  <span>Work Progress</span>
                </Space>
              }
              size="small"
              extra={
                <Button type="link" size="small">
                  View All
                </Button>
              }
              styles={{ body: { padding: 16 } }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {projectProgress.map((project, index) => (
                  <div key={index}>
                    <Space
                      style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}
                    >
                      <Text strong style={{ fontSize: 13 }}>
                        {project.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: project.color }}>
                        {project.progress}%
                      </Text>
                    </Space>
                    <Progress
                      percent={project.progress}
                      strokeColor={project.color}
                      size="small"
                      showInfo={false}
                    />
                  </div>
                ))}
              </Space>
            </Card>
          </Col>

          {/* Recent Activities */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#52c41a' }} />
                  <span>Recent Activities</span>
                </Space>
              }
              size="small"
              extra={
                <Button type="link" size="small">
                  View All
                </Button>
              }
              styles={{ body: { padding: 0 } }}
            >
              <List
                size="small"
                dataSource={recentActivities}
                renderItem={(item) => (
                  <List.Item style={{ padding: '12px 16px', border: 'none' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={32}
                          style={{
                            backgroundColor: item.color,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {item.avatar}
                        </Avatar>
                      }
                      title={
                        <Text style={{ fontSize: 13 }}>
                          <Text strong>{item.user}</Text> {item.action}{' '}
                          <Text strong>{item.target}</Text>
                        </Text>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {item.time}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* Upcoming Tasks */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <CalendarOutlined style={{ color: '#faad14' }} />
                  <span>Upcoming Tasks</span>
                </Space>
              }
              size="small"
              extra={
                <Button type="link" size="small">
                  View Calendar
                </Button>
              }
              styles={{ body: { padding: 0 } }}
            >
              <List
                size="small"
                dataSource={upcomingTasks}
                renderItem={(item) => (
                  <List.Item
                    style={{ padding: '12px 16px', border: 'none' }}
                    actions={[
                      <Tag
                        key="priority"
                        color={getPriorityColor(item.priority)}
                        style={{ fontSize: 10, margin: 0 }}
                      >
                        {item.priority.toUpperCase()}
                      </Tag>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Text strong style={{ fontSize: 13 }}>
                          {item.title}
                        </Text>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {item.time}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* Quick Actions */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <BellOutlined style={{ color: '#722ed1' }} />
                  <span>Quick Actions</span>
                </Space>
              }
              size="small"
              styles={{ body: { padding: 16 } }}
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Button
                  type="primary"
                  block
                  icon={<PlusOutlined />}
                  size="middle"
                >
                  Create New Project
                </Button>
                <Button
                  block
                  icon={<TeamOutlined />}
                  size="middle"
                >
                  Add Team Member
                </Button>
                <Button
                  block
                  icon={<UserOutlined />}
                  size="middle"
                >
                  Add New Client
                </Button>
                <Divider style={{ margin: '12px 0' }} />
                <Button
                  type="link"
                  block
                  icon={<CalendarOutlined />}
                  size="small"
                  style={{ height: 'auto', padding: '4px 0' }}
                >
                  Schedule Meeting
                </Button>
                <Button
                  type="link"
                  block
                  icon={<ClockCircleOutlined />}
                  size="small"
                  style={{ height: 'auto', padding: '4px 0' }}
                >
                  Track Time
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
