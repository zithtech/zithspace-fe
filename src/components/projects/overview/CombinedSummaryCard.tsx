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
  const SummaryPart = ({ title, stats, icon, color }: { title: string, stats: SummaryStats, icon: React.ReactNode, color: string }) => (
    <div className="w-full">
      <Row justify="space-between" align="middle" className="mb-6">
        <Col>
          <Space size="middle">
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: '10px', 
              background: 'var(--bg-slate-50)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: color,
              fontSize: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              {icon}
            </div>
            <Text strong style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.08em', fontWeight: 600 }}>
              {title}
            </Text>
          </Space>
        </Col>
        <Col>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total}</Title>
        </Col>
      </Row>
      
      <div className="space-y-3">
        <Row justify="space-between" align="middle" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
          <Space size="small">
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
            <Text style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Completed</Text>
          </Space>
          <Text strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{stats.completed}</Text>
        </Row>
        <Row justify="space-between" align="middle" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
          <Space size="small">
            <ClockCircleOutlined style={{ color: '#faad14', fontSize: '14px' }} />
            <Text style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>In Progress</Text>
          </Space>
          <Text strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{stats.inProgress}</Text>
        </Row>
        <Row justify="space-between" align="middle" style={{ padding: '8px 0' }}>
          <Space size="small">
            <InfoCircleOutlined style={{ color: 'var(--text-secondary)', fontSize: '14px' }} />
            <Text style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Not Started</Text>
          </Space>
          <Text strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{stats.notStarted}</Text>
        </Row>
      </div>
    </div>
  );

  return (
    <Card 
      className="rounded-xl border-[var(--border-color)] h-full bg-[var(--bg-secondary)]" 
      bordered={false} 
      styles={{ body: { padding: '32px' } }}
    >
      <Row gutter={64} align="top">
        <Col span={11}>
          <SummaryPart title="Sprint Summary" stats={sprintSummary} icon={<AppstoreOutlined />} color="#1677ff" />
        </Col>
        <Col span={2} className="flex justify-center" style={{ display: 'flex', alignItems: 'center' }}>
          <Divider type="vertical" style={{ height: '160px', borderColor: 'var(--border-color)' }} />
        </Col>
        <Col span={11}>
          <SummaryPart title="Ticket Summary" stats={ticketSummary} icon={<BarChartOutlined />} color="#722ed1" />
        </Col>
      </Row>
    </Card>
  );
};
