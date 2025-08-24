'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Table, 
  Progress, 
  Tag, 
  Space,
  Avatar,
  Spin,
  Alert
} from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  BugOutlined,
  TeamOutlined,
  ProjectOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface DashboardStats {
  totalTickets: number;
  inProgress: number;
  notStarted: number;
  completed: number;
  inTesting: number;
}

interface ProjectStats {
  projectName: string;
  totalTickets: number;
  inProgress: number;
  notStarted: number;
  completed: number;
  inTesting: number;
}

interface ReleasePlan {
  id: string;
  name: string;
  project: string;
  completedTickets: number;
  totalTickets: number;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  projects: string[];
  totalTickets: number;
  inProgress: number;
  notStarted: number;
  completed: number;
  inTesting: number;
}

export default function TicketDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [releasePlans, setReleasePlans] = useState<ReleasePlan[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      
      // Mock data for now
      setTimeout(() => {
        setDashboardStats({
          totalTickets: 45,
          inProgress: 12,
          notStarted: 8,
          completed: 20,
          inTesting: 5
        });

        setProjectStats([
          {
            projectName: 'VDrive',
            totalTickets: 25,
            inProgress: 7,
            notStarted: 4,
            completed: 12,
            inTesting: 2
          },
          {
            projectName: 'Zithmi',
            totalTickets: 20,
            inProgress: 5,
            notStarted: 4,
            completed: 8,
            inTesting: 3
          }
        ]);

        setReleasePlans([
          {
            id: '1',
            name: 'June Month Demo',
            project: 'VDrive',
            completedTickets: 6,
            totalTickets: 9
          },
          {
            id: '2',
            name: 'Q3 Release',
            project: 'Zithmi',
            completedTickets: 4,
            totalTickets: 7
          }
        ]);

        setTeamMembers([
          {
            id: '1',
            name: 'John Doe',
            projects: ['VDrive', 'Zithmi'],
            totalTickets: 15,
            inProgress: 4,
            notStarted: 2,
            completed: 8,
            inTesting: 1
          },
          {
            id: '2',
            name: 'Jane Smith',
            projects: ['VDrive'],
            totalTickets: 12,
            inProgress: 3,
            notStarted: 1,
            completed: 7,
            inTesting: 1
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const teamMemberColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TeamMember) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff' }}>
            {text.charAt(0)}
          </Avatar>
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Projects',
      dataIndex: 'projects',
      key: 'projects',
      render: (projects: string[]) => (
        <Space>
          {projects.map(project => (
            <Tag key={project} color="blue">{project}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Total Tickets',
      dataIndex: 'totalTickets',
      key: 'totalTickets',
    },
    {
      title: 'In Progress',
      dataIndex: 'inProgress',
      key: 'inProgress',
      render: (value: number) => <Tag color="processing">{value}</Tag>,
    },
    {
      title: 'Not Started',
      dataIndex: 'notStarted',
      key: 'notStarted',
      render: (value: number) => <Tag color="default">{value}</Tag>,
    },
    {
      title: 'Completed',
      dataIndex: 'completed',
      key: 'completed',
      render: (value: number) => <Tag color="success">{value}</Tag>,
    },
    {
      title: 'In Testing',
      dataIndex: 'inTesting',
      key: 'inTesting',
      render: (value: number) => <Tag color="warning">{value}</Tag>,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert message="Error" description={error} type="error" showIcon />
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Ticket Dashboard - July 2025
      </Title>

      {/* General Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card>
            <Statistic
              title="Total Tickets"
              value={dashboardStats?.totalTickets}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card>
            <Statistic
              title="In Progress"
              value={dashboardStats?.inProgress}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card>
            <Statistic
              title="Not Started"
              value={dashboardStats?.notStarted}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card>
            <Statistic
              title="Completed"
              value={dashboardStats?.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card>
            <Statistic
              title="In Testing"
              value={dashboardStats?.inTesting}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Project-wise Cards */}
      <Title level={4} style={{ marginBottom: 16 }}>
        Project Overview
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {projectStats.map((project) => (
          <Col xs={24} lg={12} key={project.projectName}>
            <Card 
              title={
                <Space>
                  <ProjectOutlined />
                  {project.projectName}
                </Space>
              }
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Total"
                    value={project.totalTickets}
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Progress"
                    value={project.inProgress}
                    valueStyle={{ fontSize: 16, color: '#1677ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Completed"
                    value={project.completed}
                    valueStyle={{ fontSize: 16, color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Testing"
                    value={project.inTesting}
                    valueStyle={{ fontSize: 16, color: '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Release Plan Cards */}
      <Title level={4} style={{ marginBottom: 16 }}>
        Release Plans
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {releasePlans.map((plan) => (
          <Col xs={24} lg={12} key={plan.id}>
            <Card 
              title={
                <Space>
                  <CalendarOutlined />
                  {plan.name}
                </Space>
              }
            >
              <div style={{ marginBottom: 8 }}>
                <Text strong>{plan.project}</Text>
              </div>
              <Progress
                percent={Math.round((plan.completedTickets / plan.totalTickets) * 100)}
                format={() => `${plan.completedTickets} of ${plan.totalTickets} completed`}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Team Members Table */}
      <Title level={4} style={{ marginBottom: 16 }}>
        <TeamOutlined /> Team Members
      </Title>
      <Card>
        <Table
          columns={teamMemberColumns}
          dataSource={teamMembers}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
