import React from "react";
import { Row, Col, Typography, Space } from "antd";
import { ClockCircleOutlined, CalendarOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface TimeStatsBarProps {
  hoursLogged: number;
  daysWorked: number;
}

export const TimeStatsBar: React.FC<TimeStatsBarProps> = ({ hoursLogged, daysWorked }) => {
  return (
    <div className="my-4 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
      <Row gutter={48} align="middle">
        <Col>
          <Space size="middle">
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-slate-50)', display: 'flex', border: '1px solid var(--border-color)' }}>
              <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Hours Logged</div>
              <Text strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{hoursLogged}h</Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Space size="middle">
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-slate-50)', display: 'flex', border: '1px solid var(--border-color)' }}>
              <CalendarOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Days Worked</div>
              <Space align="baseline">
                <Text strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{daysWorked}d</Text>
                <Text type="secondary" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>(6h/day)</Text>
              </Space>
            </div>
          </Space>
        </Col>
      </Row>
    </div>
  );
};
