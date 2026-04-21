import React from "react";
import { Card, Typography, List, Progress, Row, Col, Avatar, Space } from "antd";

const { Text } = Typography;

interface TeamMember {
  id: string;
  name: string;
  contribution: number;
  done: number;
  active: number;
  todo: number;
  assigned: number;
  totalHours: number;
}

interface TeamProgressTableProps {
  members: TeamMember[];
}

export const TeamProgressTable: React.FC<TeamProgressTableProps> = ({ members }) => {
  return (
    <Card
      title="TEAM"
      bordered={false}
      className="h-full rounded-xl border border-gray-100"
      headStyle={{ borderBottom: 'none', fontSize: '11px', color: '#8c8c8c', fontWeight: 600, letterSpacing: '0.05em' }}
      extra={<Text type="secondary" style={{ fontSize: '11px', cursor: 'pointer' }}>Sort ↑↓</Text>}
    >
      <List
        dataSource={members}
        renderItem={(item) => (
          <List.Item style={{ borderBottom: '1px solid #f9f9f9', padding: '12px 0' }}>
            <div className="w-full">
              <Row justify="space-between" align="middle" className="mb-2">
                <Col>
                  <Space>
                    <Avatar 
                      size="small" 
                      style={{ 
                        backgroundColor: '#f6ffed', 
                        color: '#38e94d', 
                        fontSize: '10px',
                        border: '1px solid #d9f7be'
                      }}
                    >
                      {item.name.substring(0, 2).toUpperCase()}
                    </Avatar>
                    <Text strong style={{ fontSize: '13px' }}>{item.name}</Text>
                  </Space>
                </Col>
                <Col>
                  <Text strong style={{ fontSize: '13px' }}>{item.contribution}%</Text>
                </Col>
              </Row>
              <Progress 
                percent={item.contribution} 
                showInfo={false} 
                size="small" 
                strokeColor="#38e94d" 
                trailColor="#f5f5f5"
              />
              <div className="mt-2">
                <Space size="middle">
                  <Text type="secondary" style={{ fontSize: '11px' }}><Text strong style={{ color: '#1890ff' }}>{item.assigned}</Text> total</Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}><Text strong style={{ color: '#52c41a' }}>{item.done}</Text> done</Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}><Text strong style={{ color: '#faad14' }}>{item.active}</Text> active</Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}><Text strong style={{ color: '#8c8c8c' }}>{item.totalHours}h</Text> logged</Text>
                </Space>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};
