import React from "react";
import { Card, Typography, List, Space } from "antd";

const { Text } = Typography;

interface InsightsPanelProps {
  insights: string[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  return (
    <Card 
      title="INSIGHTS" 
      bordered={false} 
      className="rounded-xl border-[var(--border-color)] bg-[var(--bg-secondary)]" 
      headStyle={{ borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', padding: '0 24px' }}
      bodyStyle={{ padding: '8px 24px 20px' }}
    >
      <List
        dataSource={insights}
        locale={{ emptyText: <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>No critical insights at this time.</Text> }}
        renderItem={(item) => (
          <List.Item style={{ borderBottom: 'none', padding: '10px 0' }}>
            <Space align="start" size="small">
              <div style={{ 
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                marginTop: '6px',
                background: item.toLowerCase().includes('behind') || item.toLowerCase().includes('schedule') ? '#ff4d4f' : 
                            item.toLowerCase().includes('imbalance') || item.toLowerCase().includes('remain') ? '#faad14' : '#52c41a', 
                flexShrink: 0
              }} />
              <Text style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>{item}</Text>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
};
