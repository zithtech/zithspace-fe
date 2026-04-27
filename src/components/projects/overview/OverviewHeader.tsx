import React from "react";
import { Row, Col, Typography, Tag, Progress, Space, Avatar } from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface OverviewHeaderProps {
  name: string;
  code?: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date | null;
  progress: number;
}

export const OverviewHeader: React.FC<OverviewHeaderProps> = ({
  name,
  code,
  status,
  startDate,
  endDate,
  progress,
}) => {
  return (
    <div className="mb-4 p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
      <Row justify="space-between" align="middle">
        <Col>
          <Space align="center" size="large">
            <Avatar 
              size={56} 
              style={{ 
                backgroundColor: 'var(--bg-slate-50)', 
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '20px',
                fontWeight: 600
              }}
            >
              {name.substring(0, 2).toUpperCase()}
            </Avatar>
            <div>
              <Space align="center" size="small">
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{name}</Title>
                {code && (
                  <Text type="secondary" style={{ fontSize: '13px', background: 'var(--bg-slate-50)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                    {code}
                  </Text>
                )}
                <Tag 
                  color={status?.toLowerCase() === 'active' ? 'success' : 'processing'} 
                  style={{ 
                    borderRadius: '6px', 
                    border: 'none', 
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '0 8px' 
                  }}
                >
                  {status?.toUpperCase()}
                </Tag>
              </Space>
              <div className="mt-1">
                <Space size="large" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>
                    <Text type="secondary">Duration:</Text> {dayjs(startDate).format("MMM D, YYYY")} — {endDate ? dayjs(endDate).format("MMM D, YYYY") : "Ongoing"}
                  </span>
                  <span>
                    <Text type="secondary">Type:</Text> Internal Project
                  </span>
                </Space>
              </div>
            </div>
          </Space>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'right' }}>
            <div className="mb-1">
              <Text strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{progress}% Overall Progress</Text>
            </div>
            <Progress 
              percent={progress} 
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              showInfo={false}
              strokeWidth={8}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};
