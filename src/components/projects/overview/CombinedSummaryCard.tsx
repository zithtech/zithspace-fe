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
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{stats.total}</Title>
        </Col>
      </Row>
      
      <div className="space-y-2">
        <Row justify="space-between" align="middle" style={{ padding: '6px 0', borderBottom: '1px solid #f9f9f9' }}>
          <Space size="small">
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px' }}>Completed</Text>
          </Space>
          <Text strong style={{ fontSize: '13px' }}>{stats.completed}</Text>
        </Row>
        <Row justify="space-between" align="middle" style={{ padding: '6px 0', borderBottom: '1px solid #f9f9f9' }}>
          <Space size="small">
            <ClockCircleOutlined style={{ color: '#faad14', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px' }}>In Progress</Text>
          </Space>
          <Text strong style={{ fontSize: '13px' }}>{stats.inProgress}</Text>
        </Row>
        <Row justify="space-between" align="middle" style={{ padding: '6px 0' }}>
          <Space size="small">
            <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: '12px' }} />
            <Text type="secondary" style={{ fontSize: '13px' }}>Not Started</Text>
          </Space>
          <Text strong style={{ fontSize: '13px' }}>{stats.notStarted}</Text>
        </Row>
      </div>
    </div>
  );

  return (
    <Card className="rounded-xl border border-gray-100 h-full" bordered={false} bodyStyle={{ padding: '24px' }}>
      <Row gutter={48} align="top">
        <Col span={11}>
          <SummaryPart title="Sprint Summary" stats={sprintSummary} icon={<AppstoreOutlined />} />
        </Col>
        <Col span={2} className="flex justify-center">
          <Divider type="vertical" style={{ height: '140px', borderLeft: '1px solid #f0f0f0' }} />
        </Col>
        <Col span={11}>
          <SummaryPart title="Ticket Summary" stats={ticketSummary} icon={<BarChartOutlined />} />
        </Col>
      </Row>
    </Card>
  );
};
