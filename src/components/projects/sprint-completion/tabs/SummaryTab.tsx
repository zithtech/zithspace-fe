"use client";

import React from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Typography,
  Space,
  Divider,
  Tag,
  List,
  Empty,
  Badge,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { SprintCompletionSummary } from "@/services/sprintCompletionService";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface SummaryTabProps {
  summary: SprintCompletionSummary;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ summary }) => {
  const { sprint, tickets, statistics } = summary;
  const destinations = summary?.availableDestinations || { sprints: [], buckets: [] };

  // Calculate velocity
  const velocity =
    statistics.totalPoints > 0
      ? Math.round((statistics.completedPoints / statistics.totalPoints) * 100)
      : 0;

  // Sprint duration
  const duration = dayjs(sprint.endDate).diff(dayjs(sprint.startDate), "days");
  const daysRemaining = dayjs(sprint.endDate).diff(dayjs(), "days");

  return (
    <div style={{ padding: '16px 20px', height: "calc(85vh - 220px)", overflow: "auto", background: '#ffffff' }}>
      {/* Sprint Info Card with Progress */}
      <Card 
        bordered={false} 
        style={{ 
          marginBottom: 20, 
          borderRadius: 16, 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          background: '#ffffff',
          border: '1px solid #f0f0f0'
        }}
      >
        <Row gutter={24} align="middle">
          {/* LEFT: Sprint Details - Increased span to give more room for date/tags */}
          <Col xs={24} md={18}>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                Sprint Focus
              </Text>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1a1a1a' }}>
                {sprint.name}
              </Title>
              <Space size={12} style={{ marginTop: 4, flexWrap: 'wrap' }}>
                <CalendarOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {dayjs(sprint.startDate).format("MMM D")} - {dayjs(sprint.endDate).format("MMM D")}
                </Text>
                <Divider type="vertical" style={{ margin: '0 4px', height: 12 }} />
                <Text type="secondary" style={{ fontSize: 13 }}>{duration} Days</Text>
                {daysRemaining > 0 && (
                  <Tag color="processing" style={{ borderRadius: 4, fontWeight: 600, fontSize: 10, border: 'none', marginLeft: 4 }}>{daysRemaining} DAYS LEFT</Tag>
                )}
                {daysRemaining === 0 && <Tag color="warning" style={{ borderRadius: 4, fontWeight: 600, fontSize: 10, border: 'none', marginLeft: 4 }}>ENDS TODAY</Tag>}
                {daysRemaining < 0 && (
                  <Tag color="error" style={{ borderRadius: 4, fontWeight: 600, fontSize: 10, border: 'none', marginLeft: 4 }}>
                    OVERDUE BY {Math.abs(daysRemaining)} DAYS
                  </Tag>
                )}
              </Space>
            </Space>
          </Col>

          {/* RIGHT: Overall Completion Circle - Kept but simplified */}
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
              <Progress
                type="circle"
                percent={statistics.completionPercentage}
                size={70}
                strokeWidth={10}
                strokeColor={{
                  '0%': '#1890ff',
                  '100%': '#52c41a',
                }}
                format={(percent) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{percent}%</span>
                  </div>
                )}
              />
              <Text strong style={{ fontSize: 10, marginTop: 4, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.5 }}>PROGRESS</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {[
          { title: "Total Tickets", value: statistics.totalTickets, icon: <FileTextOutlined />, color: "#1890ff", bg: "rgba(24, 144, 255, 0.05)" },
          { title: "Completed", value: statistics.completedTickets, suffix: `/ ${statistics.totalTickets}`, icon: <CheckCircleOutlined />, color: "#52c41a", bg: "rgba(82, 196, 26, 0.05)" },
          { title: "Pending", value: statistics.pendingTickets, icon: <ClockCircleOutlined />, color: statistics.pendingTickets > 0 ? "#faad14" : "#52c41a", bg: statistics.pendingTickets > 0 ? "rgba(250, 173, 20, 0.05)" : "rgba(82, 196, 26, 0.05)" },
          { title: "Sprint Velocity", value: velocity, suffix: "%", icon: <FireOutlined />, color: velocity >= 80 ? "#52c41a" : "#faad14", bg: velocity >= 80 ? "rgba(82, 196, 26, 0.05)" : "rgba(250, 173, 20, 0.05)" }
        ].map((stat, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card 
              bordered={false} 
              style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)' }}
              styles={{ body: { padding: '20px 24px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: stat.bg, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: stat.color,
                  fontSize: 20
                }}>
                  {stat.icon}
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{stat.title}</Text>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{stat.value}</Title>
                    {stat.suffix && <Text type="secondary" style={{ fontSize: 13 }}>{stat.suffix}</Text>}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Available Destinations */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title={
              <Space size={8}>
                <TrophyOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Available Destinations</span>
              </Space>
            }
            styles={{ 
              header: { padding: '12px 16px', minHeight: 'auto' },
              body: { padding: '16px' } 
            }}
            style={{ height: "100%", borderRadius: 12, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)', border: '1px solid #f0f0f0' }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 13, color: '#595959' }}>Next Sprints</Text>
                  <Badge count={destinations?.sprints?.length || 0} color="#1890ff" style={{ fontSize: 10, height: 16, minWidth: 16, lineHeight: '16px' }} />
                </div>
                {destinations?.sprints && destinations.sprints.length > 0 ? (
                  <List
                    size="small"
                    dataSource={destinations.sprints}
                    renderItem={(sprint) => (
                      <List.Item style={{ padding: '4px 0', border: 'none' }}>
                        <Space size={8}>
                          <Tag color="blue" style={{ borderRadius: 4, margin: 0, fontSize: 10, padding: '0 4px', border: 'none' }}>{sprint.status}</Tag>
                          <Text strong style={{ color: '#262626', fontSize: 12 }}>{sprint.version}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary" style={{ fontSize: 11 }}>No sprints</Text>} style={{ margin: '10px 0' }} />
                )}
              </Col>
              
              <Col span={1} style={{ display: 'flex', justifyContent: 'center' }}>
                <Divider type="vertical" style={{ height: '100%', margin: 0 }} />
              </Col>

              <Col span={11}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 13, color: '#595959' }}>Buckets</Text>
                  <Badge count={destinations?.buckets?.length || 0} color="#52c41a" style={{ fontSize: 10, height: 16, minWidth: 16, lineHeight: '16px' }} />
                </div>
                {destinations?.buckets && destinations.buckets.length > 0 ? (
                  <List
                    size="small"
                    dataSource={destinations.buckets}
                    renderItem={(bucket) => (
                      <List.Item style={{ padding: '4px 0', border: 'none' }}>
                        <Space size={8}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: bucket.color || '#d9d9d9' }} />
                          <Text style={{ color: '#262626', fontSize: 12 }}>{bucket.name}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary" style={{ fontSize: 11 }}>No buckets</Text>} style={{ margin: '10px 0' }} />
                )}
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Completion Checklist */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title={
              <Space size={8}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Completion Checklist</span>
              </Space>
            }
            styles={{ 
              header: { padding: '12px 16px', minHeight: 'auto' },
              body: { padding: '16px' } 
            }}
            style={{ height: "100%", borderRadius: 12, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)', border: '1px solid #f0f0f0' }}
          >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {[
                { 
                  label: "All tickets resolved", 
                  status: statistics.pendingTickets === 0, 
                  detail: statistics.pendingTickets === 0 ? "All items done" : `${statistics.pendingTickets} pending`
                },
                { 
                  label: "Velocity target", 
                  status: velocity >= 70, 
                  detail: `Velocity is ${velocity}% (Tar: 70%+)`
                },
                { 
                  label: "Sprint duration", 
                  status: true, 
                  detail: `Active for ${duration} days`
                }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: item.status ? 'rgba(82, 196, 26, 0.1)' : 'rgba(250, 173, 20, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.status ? 
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} /> : 
                      <ClockCircleOutlined style={{ color: '#faad14', fontSize: 12 }} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 13, display: 'block', color: '#1a1a1a', lineHeight: 1.2 }}>{item.label}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{item.detail}</Text>
                  </div>
                  <div>
                    {item.status ? 
                      <Tag color="success" style={{ border: 'none', background: '#f6ffed', color: '#52c41a', margin: 0, fontSize: 10 }}>DONE</Tag> : 
                      <Tag color="warning" style={{ border: 'none', background: '#fffbe6', color: '#faad14', margin: 0, fontSize: 10 }}>WAIT</Tag>
                    }
                  </div>
                </div>
              ))}
              
              <div
                style={{
                  marginTop: 4,
                  padding: '12px 16px',
                  background: statistics.pendingTickets === 0 ? 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)' : 'linear-gradient(135deg, #fffbe6 0%, #ffffff 100%)',
                  border: statistics.pendingTickets === 0 ? "1px solid #b7eb8f" : "1px solid #ffe58f",
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: statistics.pendingTickets === 0 ? '#52c41a' : '#faad14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0
                }}>
                  {statistics.pendingTickets === 0 ? <CheckCircleOutlined /> : <WarningOutlined />}
                </div>
                <div>
                  <Text strong style={{ color: statistics.pendingTickets === 0 ? "#389e0d" : "#d48806", fontSize: 13, display: 'block', lineHeight: 1.2 }}>
                    {statistics.pendingTickets === 0 ? 'Ready to Complete' : 'Attention Required'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {statistics.pendingTickets === 0 ? 'Requirements met. safe to proceed.' : `Please resolve ${statistics.pendingTickets} pending items.`}
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SummaryTab;
