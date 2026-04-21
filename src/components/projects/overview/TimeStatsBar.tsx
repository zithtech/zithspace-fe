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
    <div className="my-4 p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
      <Row gutter={64} align="middle">
        <Col>
          <Space size="middle">
            <div style={{ 
              padding: '10px', 
              borderRadius: '10px', 
              background: 'rgba(24, 144, 255, 0.1)', 
              display: 'flex',
              border: '1px solid rgba(24, 144, 255, 0.2)'
            }}>
              <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Hours Logged</div>
              <Text strong style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{hoursLogged}h</Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Space size="middle">
            <div style={{ 
              padding: '10px', 
              borderRadius: '10px', 
              background: 'rgba(82, 196, 26, 0.1)', 
              display: 'flex',
              border: '1px solid rgba(82, 196, 26, 0.2)'
            }}>
              <CalendarOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Days Worked</div>
              <Space align="baseline">
                <Text strong style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{daysWorked}d</Text>
                <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic' }}>(6h/day)</Text>
              </Space>
            </div>
          </Space>
        </Col>
      </Row>
    </div>
  );
};
