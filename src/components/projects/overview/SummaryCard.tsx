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
    <Card className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]" bordered={false}>
      <Row justify="space-between" align="middle" className="mb-3">
        <Col>
          <Space>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'var(--bg-slate-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              fontSize: '16px',
              border: '1px solid var(--border-color)'
            }}>
              {icon}
            </div>
            <Text strong style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              {title}
            </Text>
          </Space>
        </Col>
        <Col>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{total}</Title>
        </Col>
      </Row>

      <div className="space-y-2">
        <Row justify="space-between" align="middle" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
          <Space size="small">
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Completed</Text>
          </Space>
          <Text strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{completed}</Text>
        </Row>
        <Row justify="space-between" align="middle" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
          <Space size="small">
            <ClockCircleOutlined style={{ color: '#faad14', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>In Progress</Text>
          </Space>
          <Text strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{inProgress}</Text>
        </Row>
        <Row justify="space-between" align="middle" style={{ padding: '6px 0' }}>
          <Space size="small">
            <InfoCircleOutlined style={{ color: 'var(--text-slate-400)', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Not Started</Text>
          </Space>
          <Text strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{notStarted}</Text>
        </Row>
      </div>
    </Card>
  );
};
