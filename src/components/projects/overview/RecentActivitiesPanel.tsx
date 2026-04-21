import React from "react";
import { Card, Typography, Timeline, Space } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
const { Text } = Typography;

interface Activity {
  id: string;
  action: string;
  userName: string;
  ticketNumber: string;
  ticketTitle: string;
  timestamp: Date;
}

interface RecentActivitiesPanelProps {
  activities: Activity[];
}

export const RecentActivitiesPanel: React.FC<RecentActivitiesPanelProps> = ({ activities }) => {
  return (
    <Card 
      title="RECENT ACTIVITIES" 
      bordered={false} 
      className="rounded-xl border-[var(--border-color)] bg-[var(--bg-secondary)]" 
      headStyle={{ borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', padding: '0 24px' }}
      bodyStyle={{ padding: '24px' }}
    >
      <Timeline mode="left" style={{ marginTop: '8px' }}>
        {activities.map((item) => (
          <Timeline.Item key={item.id} style={{ paddingBottom: '20px' }} color="#52c41a">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Space size="small">
                <Text strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{item.userName}</Text>
                <Text style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.action.toLowerCase()}</Text>
                <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>{item.ticketNumber}</Text>
              </Space>
              <Text style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }} ellipsis>
                {item.ticketTitle}
              </Text>
              <Text type="secondary" style={{ fontSize: '10px', marginTop: '4px', fontStyle: 'italic' }}>
                {dayjs(item.timestamp).fromNow()}
              </Text>
            </div>
          </Timeline.Item>
        ))}
        {activities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>No recent activities found.</Text>
          </div>
        )}
      </Timeline>
    </Card>
  );
};
