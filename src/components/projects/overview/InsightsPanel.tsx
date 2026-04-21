import React from "react";
import { Card, Typography, List, Space } from "antd";
import { BulbOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface InsightsPanelProps {
  insights: string[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  return (
    <Card 
      title="INSIGHTS" 
      bordered={false} 
      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] mb-4" 
      headStyle={{ borderBottom: 'none', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}
    >
      <List
        dataSource={insights}
        renderItem={(item) => (
          <List.Item style={{ borderBottom: 'none', padding: '6px 0' }}>
            <Space align="start" size="small">
              <span style={{ 
                color: item.toLowerCase().includes('behind') ? '#ff4d4f' : item.toLowerCase().includes('imbalance') ? '#faad14' : '#38e94d', 
                fontSize: '18px',
                lineHeight: '13px'
              }}>•</span>
              <Text style={{ fontSize: '13px', color: 'var(--text-slate-700)' }}>{item}</Text>
            </Space>
          </List.Item>
        )}
      />
      {insights.length === 0 && <Text type="secondary" style={{ fontSize: '12px' }}>No insights currently available.</Text>}
    </Card>
  );
};
