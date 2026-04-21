import React from "react";
import { Card, Typography, List, Progress, Row, Col, Tag } from "antd";
import dayjs from "dayjs";

const { Text, Title } = Typography;

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
      className="h-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]"
      headStyle={{ borderBottom: 'none', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}
    >
      <List
        dataSource={sprints}
        renderItem={(item) => (
          <List.Item style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 0' }}>
            <div className="w-full">
              <Row justify="space-between" align="middle" className="mb-2">
                <Col>
                  <Text strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.name}</Text>
                </Col>
                <Col>
                  <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{item.completedCount}/{item.ticketCount}</Text>
                </Col>
              </Row>
              <Progress
                percent={item.progress}
                size="small"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#52c41a',
                }}
              />
              <div className="mt-1 flex justify-between">
                <Text type="secondary" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {item.startDate ? dayjs(item.startDate).format("MMM D") : "-"} — {item.endDate ? dayjs(item.endDate).format("MMM D") : "-"}
                </Text>
                <Tag style={{ 
                  fontSize: '10px', 
                  borderRadius: '4px', 
                  border: 'none', 
                  background: item.progress === 100 ? 'rgba(82, 196, 26, 0.15)' : 'var(--bg-slate-50)', 
                  color: item.progress === 100 ? '#52c41a' : 'var(--text-secondary)' 
                }}>
                  {item.progress === 100 ? 'COMPLETED' : 'IN PROGRESS'}
                </Tag>
              </div>
            </div>
          </List.Item>
        )}
      />
      {sprints.length === 0 && <Text type="secondary" style={{ fontSize: '12px' }}>No sprints found.</Text>}
    </Card>
  );
};
