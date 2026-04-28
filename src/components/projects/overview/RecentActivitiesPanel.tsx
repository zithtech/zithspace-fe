import React from "react";
import { Card, Typography, List, Timeline, Space } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
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
      title="RECENT UPDATES" 
      bordered={false} 
      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col" 
      style={{ height: '292px' }}
      styles={{
        header: { borderBottom: 'none', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', flexShrink: 0 },
        body: { overflowY: 'auto', flex: 1, paddingTop: 0 }
      }}
    >
      <Timeline mode="left" style={{ marginTop: '12px' }}>
        {activities.map((item) => (
          <Timeline.Item 
            key={item.id} 
            style={{ paddingBottom: '20px' }} 
            color={
              item.action.includes('Created') ? '#1890ff' : 
              item.action.includes('Status') || item.action.includes('Updated') ? '#faad14' : 
              item.action.includes('Comment') ? '#722ed1' : 
              item.action.includes('Attachment') ? '#eb2f96' : '#38e94d'
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <Text strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{item.userName}</Text>
                <Text style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.action.toLowerCase()}</Text>
                <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>{item.ticketNumber}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: '12px', color: 'var(--text-slate-600)', marginTop: '2px' }} ellipsis>
                {item.ticketTitle}
              </Text>
              <Text type="secondary" style={{ fontSize: '10px', marginTop: '4px', color: 'var(--text-slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ClockCircleOutlined style={{ fontSize: '10px' }} />
                {dayjs(item.timestamp).fromNow()}
              </Text>
            </div>
          </Timeline.Item>
        ))}
        {activities.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <Text type="secondary" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No recent activity found.</Text>
          </div>
        )}
      </Timeline>
    </Card>
  );
};
