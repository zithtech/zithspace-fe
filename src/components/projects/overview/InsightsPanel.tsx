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
      className="rounded-xl border border-gray-100 mb-4" 
      headStyle={{ borderBottom: 'none', fontSize: '11px', color: '#8c8c8c', fontWeight: 600, letterSpacing: '0.05em' }}
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
              <Text style={{ fontSize: '13px', color: '#555' }}>{item}</Text>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
};
