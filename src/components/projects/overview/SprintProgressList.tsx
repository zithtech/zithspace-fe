import React from "react";
import { Card, Typography, List, Progress, Row, Col, Tag } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

interface Sprint {
  id: string;
  name: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  progress: number;
  ticketCount: number;
  completedCount: number;
}

interface SprintProgressListProps {
  sprints: Sprint[];
}

export const SprintProgressList: React.FC<SprintProgressListProps> = ({ sprints }) => {
  return (
    <Card
      title="SPRINTS"
      bordered={false}
      className="h-full rounded-xl border-[var(--border-color)] bg-[var(--bg-secondary)]"
      headStyle={{ borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', padding: '0 24px' }}
      bodyStyle={{ padding: '0 24px' }}
    >
      <List
        dataSource={sprints}
        renderItem={(item) => (
          <List.Item style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 0' }}>
            <div className="w-full">
              <Row justify="space-between" align="middle" className="mb-2">
                <Col>
                  <Text strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{item.name}</Text>
                </Col>
                <Col>
                  <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {item.completedCount} / {item.ticketCount}
                  </Text>
                </Col>
              </Row>
              <Progress
                percent={item.progress}
                size="small"
                strokeWidth={6}
                strokeColor={{
                  '0%': '#1677ff',
                  '100%': '#52c41a',
                }}
                trailColor="var(--border-color)"
              />
              <div className="mt-3 flex justify-between align-center">
                <Text type="secondary" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {item.startDate ? dayjs(item.startDate).format("MMM D") : "-"} — {item.endDate ? dayjs(item.endDate).format("MMM D") : "-"}
                </Text>
                <Tag 
                  style={{ 
                    fontSize: '10px', 
                    borderRadius: '4px', 
                    border: 'none', 
                    padding: '0 8px',
                    background: item.progress === 100 ? 'rgba(82, 196, 26, 0.1)' : 'var(--bg-slate-50)', 
                    color: item.progress === 100 ? '#52c41a' : 'var(--text-secondary)',
                    fontWeight: 600
                  }}
                >
                  {item.progress === 100 ? 'COMPLETED' : 'IN PROGRESS'}
                </Tag>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};
