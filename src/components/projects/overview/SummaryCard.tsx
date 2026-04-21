import React from "react";
import { Card, Typography, Row, Col, Space } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface SummaryCardProps {
  title: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  icon: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  total,
  completed,
  inProgress,
  notStarted,
  icon,
}) => {
  return (
    <Card className="rounded-xl border border-gray-100" bordered={false}>
      <Row justify="space-between" align="middle" className="mb-3">
        <Col>
          <Space>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: '#f6f8fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#555',
              fontSize: '16px'
            }}>
              {icon}
            </div>
            <Text strong style={{ textTransform: 'uppercase', fontSize: '11px', color: '#8c8c8c', letterSpacing: '0.05em' }}>
              {title}
            </Text>
          </Space>
        </Col>
        <Col>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{total}</Title>
        </Col>
      </Row>

      <div className="space-y-2">
        <Row justify="space-between" align="middle" style={{ padding: '6px 0', borderBottom: '1px solid #f9f9f9' }}>
          <Space size="small">
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px' }}>Completed</Text>
          </Space>
          <Text strong style={{ fontSize: '13px' }}>{completed}</Text>
        </Row>
        <Row justify="space-between" align="middle" style={{ padding: '6px 0', borderBottom: '1px solid #f9f9f9' }}>
          <Space size="small">
            <ClockCircleOutlined style={{ color: '#faad14', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px' }}>In Progress</Text>
          </Space>
          <Text strong style={{ fontSize: '13px' }}>{inProgress}</Text>
        </Row>
        <Row justify="space-between" align="middle" style={{ padding: '6px 0' }}>
          <Space size="small">
            <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px' }}>Not Started</Text>
          </Space>
          <Text strong style={{ fontSize: '13px' }}>{notStarted}</Text>
        </Row>
      </div>
    </Card>
  );
};
