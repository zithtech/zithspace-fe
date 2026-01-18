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
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { SprintCompletionSummary } from "@/services/sprintCompletionService";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface SummaryTabProps {
  summary: SprintCompletionSummary;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ summary }) => {
  const { sprint, tickets, statistics, destinations } = summary;

  // Calculate velocity
  const velocity =
    statistics.totalPoints > 0
      ? Math.round((statistics.completedPoints / statistics.totalPoints) * 100)
      : 0;

  // Sprint duration
  const duration = dayjs(sprint.endDate).diff(dayjs(sprint.startDate), "days");
  const daysRemaining = dayjs(sprint.endDate).diff(dayjs(), "days");

  return (
    <div style={{ padding: 24, height: "calc(85vh - 220px)", overflow: "auto" }}>
      {/* Sprint Info Card */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">Sprint Details</Text>
              <Title level={4} style={{ margin: 0 }}>
                {sprint.name}
              </Title>
              <Space size={16}>
                <Text>
                  <CalendarOutlined /> {dayjs(sprint.startDate).format("MMM D")} -{" "}
                  {dayjs(sprint.endDate).format("MMM D, YYYY")}
                </Text>
                <Text type="secondary">({duration} days)</Text>
                {daysRemaining > 0 && (
                  <Tag color="processing">{daysRemaining} days remaining</Tag>
                )}
                {daysRemaining === 0 && <Tag color="warning">Ends today</Tag>}
                {daysRemaining < 0 && (
                  <Tag color="error">
                    Overdue by {Math.abs(daysRemaining)} days
                  </Tag>
                )}
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Tickets"
              value={statistics.totalTickets}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed"
              value={statistics.completedTickets}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
              suffix={`/ ${statistics.totalTickets}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending"
              value={statistics.pendingTickets}
              prefix={<ClockCircleOutlined />}
              valueStyle={{
                color: statistics.pendingTickets > 0 ? "#faad14" : "#52c41a",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Velocity"
              value={velocity}
              prefix={<FireOutlined />}
              suffix="%"
              valueStyle={{ color: velocity >= 80 ? "#52c41a" : "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress Card */}
      <Card title="Sprint Progress" style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text strong>Completion</Text>
                <Text strong>{statistics.completionPercentage}%</Text>
              </div>
              <Progress
                percent={statistics.completionPercentage}
                status={
                  statistics.completionPercentage === 100 ? "success" : "active"
                }
                strokeColor={{
                  "0%": "#1890ff",
                  "100%": "#52c41a",
                }}
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text>Story Points</Text>
                <Text strong>
                  {statistics.completedPoints} / {statistics.totalPoints}
                </Text>
              </div>
              <Progress
                percent={velocity}
                status={velocity === 100 ? "success" : "active"}
                size="small"
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text>Tickets</Text>
                <Text strong>
                  {statistics.completedTickets} / {statistics.totalTickets}
                </Text>
              </div>
              <Progress
                percent={statistics.completionPercentage}
                status={
                  statistics.completionPercentage === 100 ? "success" : "active"
                }
                size="small"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Available Destinations */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TrophyOutlined />
                <span>Available Destinations</span>
              </Space>
            }
            style={{ height: "100%" }}
          >
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <div>
                <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
                  Next Sprints ({destinations.sprints.length})
                </Text>
                {destinations.sprints.length > 0 ? (
                  <List
                    size="small"
                    dataSource={destinations.sprints}
                    renderItem={(sprint) => (
                      <List.Item>
                        <Space>
                          <Tag color="blue">{sprint.status}</Tag>
                          <Text>{sprint.name}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No upcoming sprints"
                  />
                )}
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <div>
                <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
                  Buckets ({destinations.buckets.length})
                </Text>
                {destinations.buckets.length > 0 ? (
                  <List
                    size="small"
                    dataSource={destinations.buckets}
                    renderItem={(bucket) => (
                      <List.Item>
                        <Space>
                          {bucket.color && (
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background: bucket.color,
                              }}
                            />
                          )}
                          <Text>{bucket.name}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No buckets available"
                  />
                )}
              </div>
            </Space>
          </Card>
        </Col>

        {/* Completion Checklist */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined />
                <span>Completion Checklist</span>
              </Space>
            }
            style={{ height: "100%" }}
          >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div>
                <Space>
                  {statistics.pendingTickets === 0 ? (
                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                  ) : (
                    <ClockCircleOutlined style={{ color: "#faad14", fontSize: 16 }} />
                  )}
                  <Text>
                    All tickets resolved{" "}
                    {statistics.pendingTickets === 0 ? (
                      <Tag color="success">✓ Complete</Tag>
                    ) : (
                      <Tag color="warning">
                        {statistics.pendingTickets} pending
                      </Tag>
                    )}
                  </Text>
                </Space>
              </div>
              <div>
                <Space>
                  {velocity >= 70 ? (
                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                  ) : (
                    <ClockCircleOutlined style={{ color: "#faad14", fontSize: 16 }} />
                  )}
                  <Text>
                    Velocity target (70%+){" "}
                    <Tag color={velocity >= 70 ? "success" : "warning"}>
                      {velocity}%
                    </Tag>
                  </Text>
                </Space>
              </div>
              <div>
                <Space>
                  <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                  <Text>
                    Sprint duration <Tag color="default">{duration} days</Tag>
                  </Text>
                </Space>
              </div>
              <Divider style={{ margin: "12px 0" }} />
              {statistics.pendingTickets === 0 ? (
                <div
                  style={{
                    padding: 16,
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    borderRadius: 8,
                  }}
                >
                  <Space direction="vertical" size={4}>
                    <Text strong style={{ color: "#52c41a" }}>
                      ✓ Ready to Complete
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      All tickets have been resolved. You can now complete this
                      sprint.
                    </Text>
                  </Space>
                </div>
              ) : (
                <div
                  style={{
                    padding: 16,
                    background: "#fffbe6",
                    border: "1px solid #ffe58f",
                    borderRadius: 8,
                  }}
                >
                  <Space direction="vertical" size={4}>
                    <Text strong style={{ color: "#faad14" }}>
                      ⚠ Pending Actions Required
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Please resolve {statistics.pendingTickets} pending ticket(s)
                      before completing the sprint.
                    </Text>
                  </Space>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SummaryTab;
