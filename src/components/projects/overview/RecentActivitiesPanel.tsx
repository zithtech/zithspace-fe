import React from "react";
import { Card, Typography, List, Timeline, Space } from "antd";
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
      className="rounded-xl border border-gray-100" 
      headStyle={{ borderBottom: 'none', fontSize: '11px', color: '#8c8c8c', fontWeight: 600, letterSpacing: '0.05em' }}
    >
      <Timeline mode="left" style={{ marginTop: '8px' }}>
        {activities.map((item) => (
          <Timeline.Item key={item.id} style={{ paddingBottom: '16px' }} color="#38e94d">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Space size="small">
                <Text strong style={{ fontSize: '12px' }}>{item.userName}</Text>
                <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>{item.action.toLowerCase()}</Text>
                <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>{item.ticketNumber}</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: '12px', color: '#555' }} ellipsis>
                {item.ticketTitle}
              </Text>
              <Text type="secondary" style={{ fontSize: '10px', marginTop: '2px', color: '#bfbfbf' }}>
                {dayjs(item.timestamp).fromNow()}
              </Text>
            </div>
          </Timeline.Item>
        ))}
        {activities.length === 0 && <Text type="secondary" style={{ fontSize: '12px' }}>No recent activities found.</Text>}
      </Timeline>
    </Card>
  );
};
