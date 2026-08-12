'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React from 'react';
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
  Alert,
  Tooltip,
  Divider,
  Button,
  Empty
} from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  BugOutlined,
  TeamOutlined,
  ProjectOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useTicketDashboardStats } from '@/hooks/useTickets';
import { getStatusColor, getPriorityColor } from '@/utils/ticketUtils';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function TicketDashboard() {
  const { data, isLoading, error, refetch } = useTicketDashboardStats();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <ZukvoLoader size="lg" message="Calculating metrics" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Dashboard Error"
        description="We couldn't load your ticket metrics. Please try again."
        type="error"
        showIcon
        style={{ margin: 24 }}
      />
    );
  }

  const generalStats = data?.generalStats || { total: 0, in_progress: 0, not_started: 0, completed: 0, blocked: 0 };
  const projectStats = data?.projectStats || [];
  const teamStats = data?.teamStats || [];
  const recentActivity = data?.recentActivity || [];
  const period = data?.period || { month: dayjs().format('MMMM YYYY') };

  const teamMemberColumns = [
    {
      title: 'Member',
      key: 'member',
      render: (_: any, record: any) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
            {record.user.name.charAt(0)}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 13 }}>{record.user.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>{record.user.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => <Text strong>{total}</Text>,
    },
    {
      title: 'Status Breakdown',
      key: 'breakdown',
      render: (_: any, record: any) => (
        <Space size={4} wrap>
          {record.statuses.map((s: any) => (
            <Tooltip key={s.status} title={s.status.replace('_', ' ').toUpperCase()}>
              <Tag
                color={getStatusColor(s.status)}
                style={{ margin: 0, fontSize: 10, padding: '0 4px' }}
              >
                {s.count}
              </Tag>
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: 'Efficiency',
      key: 'efficiency',
      render: (_: any, record: any) => {
        const completed = record.statuses.find((s: any) => s.status === 'completed')?.count || 0;
        const percent = record.total > 0 ? Math.round((completed / record.total) * 100) : 0;
        return (
          <div style={{ width: 100 }}>
            <Progress percent={percent} size="small" strokeColor={percent > 70 ? '#52c41a' : '#1890ff'} />
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Space align="center" size={12}>
            <div style={{
              background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
            }}>
              <DashboardOutlined style={{ color: 'white', fontSize: 20 }} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#262626' }}>
                Tickets Overview
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                Real-time performance metrics for <Text strong>{period.month}</Text>
              </Text>
            </div>
          </Space>
        </div>
        <Tag color="blue" icon={<ClockCircleOutlined />} style={{ padding: '4px 12px', borderRadius: 20 }}>
          Updated {dayjs().format('HH:mm')}
        </Tag>
      </div>

      {/* Metric Cards Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 16, backgroundColor: 'var(--bg-pure-white)', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Total Tickets</Text>}
              value={generalStats.total}
              prefix={<FileTextOutlined style={{ color: '#1677ff', marginRight: 8 }} />}
              valueStyle={{ color: '#262626', fontWeight: 700, fontSize: 28 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              <ArrowUpOutlined style={{ color: '#52c41a' }} /> <Text type="success" strong>12%</Text> from last month
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>In Progress</Text>}
              value={generalStats.in_progress}
              prefix={<PlayCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
              valueStyle={{ color: '#1890ff', fontWeight: 700, fontSize: 28 }}
            />
            <Progress
              percent={Math.round((generalStats.in_progress / generalStats.total) * 100)}
              showInfo={false}
              size="small"
              strokeColor="#1890ff"
              style={{ marginTop: 12 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Completed</Text>}
              value={generalStats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 700, fontSize: 28 }}
            />
            <Progress
              percent={Math.round((generalStats.completed / generalStats.total) * 100)}
              showInfo={false}
              size="small"
              strokeColor="#52c41a"
              style={{ marginTop: 12 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Efficiency</Text>}
              value={Math.round((generalStats.completed / (generalStats.total || 1)) * 100)}
              suffix="%"
              prefix={<ThunderboltOutlined style={{ color: '#faad14', marginRight: 8 }} />}
              valueStyle={{ color: '#262626', fontWeight: 700, fontSize: 28 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              Overall completion rate
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Left Column: Project Summaries & Team */}
        <Col xs={24} lg={16}>
          {/* Project Overview Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ProjectOutlined style={{ color: '#1677ff' }} /> Project Focus
              </Title>
              <Button type="link" size="small">View All</Button>
            </div>

            <Row gutter={[16, 16]}>
              {projectStats.map((project) => (
                <Col xs={24} md={12} key={project.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-pure-white)' }}
                    bodyStyle={{ padding: 20 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <Text strong style={{ fontSize: 16, color: '#1677ff' }}>{project.id}</Text>
                      <Tag color="blue" style={{ margin: 0, borderRadius: 12 }}>{project.total} Tickets</Tag>
                    </div>

                    <Row gutter={8}>
                      {project.statuses.map((s, idx) => (
                        <Col span={6} key={idx}>
                          <div style={{ textAlign: 'center', padding: '8px 4px', background: '#fafafa', borderRadius: 8 }}>
                            <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{s.status.split('_')[0].toUpperCase()}</Text>
                            <Text strong style={{ fontSize: 14 }}>{s.count}</Text>
                          </div>
                        </Col>
                      ))}
                    </Row>

                    <Divider style={{ margin: '16px 0' }} />

                    {/* Visual Progress */}
                    {(() => {
                      const completed = project.statuses.find(s => s.status === 'completed')?.count || 0;
                      const progress = Math.round((completed / project.total) * 100);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Progress percent={progress} size="small" style={{ flex: 1 }} />
                          <Text style={{ fontSize: 12 }} type="secondary">{progress}% Done</Text>
                        </div>
                      );
                    })()}
                  </Card>
                </Col>
              ))}
              {projectStats.length === 0 && (
                <Col span={24}>
                  <Empty description="No active project data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </Col>
              )}
            </Row>
          </div>

          {/* Team Members Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TeamOutlined style={{ color: '#1677ff' }} /> Team Performance
              </Title>
            </div>
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Table
                columns={teamMemberColumns}
                dataSource={teamStats}
                rowKey="id"
                pagination={false}
                size="middle"
                scroll={{ x: 600 }}
              />
            </Card>
          </div>
        </Col>

        {/* Right Column: Recent Activity & Insights */}
        <Col xs={24} lg={8}>
          <Title level={4} style={{ marginBottom: 16, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#faad14' }} /> Activity Stream
          </Title>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }} bodyStyle={{ padding: '0 20px' }}>
            {recentActivity.slice(0, 8).map((ticket, index) => (
              <div
                key={ticket.id}
                style={{
                  padding: '16px 0',
                  borderBottom: index === 7 ? 'none' : '1px solid var(--border-color)',
                  display: 'flex',
                  gap: 12
                }}
              >
                <Avatar size="small" style={{ backgroundColor: getStatusColor(ticket.status), flexShrink: 0, marginTop: 4 }}>
                  {ticket.status.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 13, display: 'block' }}>{ticket.ticketNumber}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(ticket.updatedAt).fromNow()}</Text>
                  </div>
                  <Text ellipsis title={ticket.title} style={{ fontSize: 12, color: '#595959', display: 'block' }}>
                    {ticket.title}
                  </Text>
                  <Tag color={getPriorityColor(ticket.priority)} style={{ fontSize: 9, height: 16, lineHeight: '14px', marginTop: 4 }}>
                    {ticket.priority}
                  </Tag>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <Empty description="No recent updates" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
            )}
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <Button type="link" size="small">View Full Activity Log</Button>
            </div>
          </Card>

          {/* Efficiency Insight */}
          <Card
            style={{
              marginTop: 24,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)',
              border: 'none'
            }}
          >
            <Space direction="vertical" size={8}>
              <SafetyCertificateOutlined style={{ color: 'white', fontSize: 24 }} />
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>PRO TIP</Text>
              <Title level={5} style={{ color: 'white', margin: 0 }}>Boost Team Output</Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Tickets in "In progress" for more than 3 days are marked as delayed. Review blockers in the daily standup.
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
