import React from "react";
import { Card, Typography, List, Progress, Row, Col, Avatar, Space } from "antd";

const { Text } = Typography;

interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string;
  contribution: number;
  done: number;
  active: number;
  todo: number;
  assigned: number;
  totalHours: number;
  totalProjectDone?: number;
}

interface TeamProgressTableProps {
  members: TeamMember[];
}

export const TeamProgressTable: React.FC<TeamProgressTableProps> = ({ members = [] }) => {
  return (
    <Card
      title="TEAM PROGRESS"
      bordered={false}
      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col"
      style={{ height: '600px' }}
      styles={{
        header: { borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', padding: '0 24px', flexShrink: 0 },
        body: { padding: '0 24px', overflowY: 'auto', flex: 1 }
      }}
      extra={<Text type="secondary" style={{ fontSize: '11px', cursor: 'pointer', color: 'var(--text-secondary)' }}>Sort ↑↓</Text>}
    >
      <List
        dataSource={members}
        renderItem={(item) => (
          <List.Item style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 0' }}>
            <div className="w-full">
              <Row justify="space-between" align="middle" className="mb-3">
                <Col>
                  <Space size="middle">
                    <Avatar
                      //size="middle" 
                      src={item.avatarUrl}
                      style={{
                        backgroundColor: 'rgba(56, 233, 77, 0.1)',
                        color: '#38e94d',
                        fontSize: '12px',
                        border: '1px solid rgba(56, 233, 77, 0.2)',
                        fontWeight: 600
                      }}
                    >
                      {item.name?.substring(0, 2).toUpperCase() || "UN"}
                    </Avatar>
                    <div>
                      <Text strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>{item.name || "Unknown Member"}</Text>
                      <Text type="secondary" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Contributor</Text>
                    </div>
                  </Space>
                </Col>
                <Col style={{ textAlign: 'right' }}>
                  <Text strong style={{ fontSize: '14px', color: '#38e94d' }}>{item.contribution || 0}%</Text>
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    ({item.done}/{item.totalProjectDone || 0} completed)
                  </div>
                </Col>
              </Row>
              <Progress
                percent={item.contribution || 0}
                showInfo={false}
                size="small"
                strokeColor="#38e94d"
                trailColor="rgba(0,0,0,0.05)"
                strokeWidth={6}
              />
              <div className="mt-3">
                <Row gutter={8}>
                  <Col span={6}>
                    <div style={{ background: 'var(--bg-slate-50)', padding: '6px 8px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>TOTAL</div>
                      <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>{item.assigned || 0}</Text>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ background: 'var(--bg-slate-50)', padding: '6px 8px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>DONE</div>
                      <Text strong style={{ fontSize: '12px', color: '#52c41a' }}>{item.done || 0}</Text>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ background: 'var(--bg-slate-50)', padding: '6px 8px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>ACTIVE</div>
                      <Text strong style={{ fontSize: '12px', color: '#faad14' }}>{item.active || 0}</Text>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ background: 'var(--bg-slate-50)', padding: '6px 8px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>HOURS</div>
                      <Text strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{item.totalHours || 0}h</Text>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};
