'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  Button,
  Statistic,
} from 'antd';
import {
  ProjectOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  ControlOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function ProjectsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading projects..." />
      </MainLayout>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  const quickActions = [
    {
      title: 'Ticket Dashboard',
      description: 'View comprehensive ticket analytics and project overview',
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      path: '/projects/dashboard',
      color: '#1677ff'
    },
    {
      title: 'Create Ticket',
      description: 'Create new tickets with detailed workflow management',
      icon: <PlusCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      path: '/projects/create',
      color: '#52c41a'
    },
    {
      title: 'View Tickets',
      description: 'Browse and manage all tickets with advanced filtering',
      icon: <UnorderedListOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      path: '/projects/tickets',
      color: '#faad14'
    },
    {
      title: 'Plans',
      description: 'Plan and track release milestones and deliverables',
      icon: <CalendarOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      path: '/projects/plans',
      color: '#722ed1'
    },
    {
      title: 'Settings',
      description: 'Configure ticket types, workflows, and integrations',
      icon: <ControlOutlined style={{ fontSize: 24, color: '#f5222d' }} />,
      path: '/projects/settings',
      color: '#f5222d'
    }
  ];

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Space align="center">
            <ProjectOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            <Title level={2} style={{ margin: 0 }}>
              Project Management
            </Title>
          </Space>
          <Paragraph style={{ marginTop: 8, fontSize: 16, color: '#666' }}>
            Comprehensive ticket management system for tracking tasks, managing workflows, and coordinating team efforts across multiple projects.
          </Paragraph>
        </div>

        {/* Quick Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Projects"
                value={2}
                suffix="Active"
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Tickets"
                value={45}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={12}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Completed"
                value={20}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Title level={3} style={{ marginBottom: 24 }}>
          Quick Actions
        </Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                hoverable
                style={{ height: '100%' }}
                onClick={() => router.push(action.path)}
              >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  {action.icon}
                  <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                    {action.title}
                  </Title>
                  <Paragraph 
                    type="secondary" 
                    style={{ marginBottom: 16, minHeight: 44 }}
                  >
                    {action.description}
                  </Paragraph>
                  <Button 
                    type="primary" 
                    icon={<ArrowRightOutlined />}
                    style={{ backgroundColor: action.color, borderColor: action.color }}
                  >
                    Open
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Project Overview */}
        <Title level={3} style={{ marginTop: 40, marginBottom: 24 }}>
          Active Projects
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="VDrive" extra={<Button type="link">View Details</Button>}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="Total Tickets" value={25} />
                </Col>
                <Col span={8}>
                  <Statistic title="In Progress" value={7} valueStyle={{ color: '#1677ff' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="Completed" value={12} valueStyle={{ color: '#52c41a' }} />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Zithmi" extra={<Button type="link">View Details</Button>}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="Total Tickets" value={20} />
                </Col>
                <Col span={8}>
                  <Statistic title="In Progress" value={5} valueStyle={{ color: '#1677ff' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="Completed" value={8} valueStyle={{ color: '#52c41a' }} />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
