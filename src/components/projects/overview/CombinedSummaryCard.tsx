import React from "react";
import { Card, Typography, Row, Col, Space, Divider } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined, AppstoreOutlined, BarChartOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface SummaryStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

interface CombinedSummaryCardProps {
  sprintSummary: SummaryStats;
  ticketSummary: SummaryStats;
}

export const CombinedSummaryCard: React.FC<CombinedSummaryCardProps> = ({
  sprintSummary,
  ticketSummary,
}) => {
  const SummaryPart = ({ title, stats, icon }: { title: string, stats: SummaryStats, icon: React.ReactNode }) => (
    <div className="w-full">
      <Row justify="space-between" align="middle" className="mb-4">
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
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</Title>
        </Col>
      </Row>
      
      <div className="space-y-2">
        <Row justify="space-between" align="middle" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
          <Space size="small">
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Completed</Text>
          </Space>
          <Text strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{stats.completed}</Text>
        </Row>
        <Row justify="space-between" align="middle" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
          <Space size="small">
            <ClockCircleOutlined style={{ color: '#faad14', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>In Progress</Text>
          </Space>
          <Text strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{stats.inProgress}</Text>
        </Row>
        <Row justify="space-between" align="middle" style={{ padding: '6px 0' }}>
          <Space size="small">
            <InfoCircleOutlined style={{ color: 'var(--text-slate-400)', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Not Started</Text>
          </Space>
          <Text strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{stats.notStarted}</Text>
        </Row>
      </div>
    </div>
  );

  return (
    <Card 
      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] h-full" 
      bordered={false} 
      bodyStyle={{ padding: '24px' }}
    >
      <Row gutter={48} align="top">
        <Col span={11}>
          <SummaryPart title="Sprint Summary" stats={sprintSummary} icon={<AppstoreOutlined />} />
        </Col>
        <Col span={2} className="flex justify-center">
          <Divider type="vertical" style={{ height: '140px', borderLeft: '1px solid var(--border-color)' }} />
        </Col>
        <Col span={11}>
          <SummaryPart title="Ticket Summary" stats={ticketSummary} icon={<BarChartOutlined />} />
        </Col>
      </Row>
    </Card>
  );
};
