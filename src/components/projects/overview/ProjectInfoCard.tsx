import React from "react";
import { Card, Typography, Row, Col, Avatar, Space, Tag } from "antd";
import { UserOutlined, TeamOutlined, ProfileOutlined } from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;

interface ProjectInfoCardProps {
  projectHead: string;
  avatarUrl?: string; // Added avatarUrl
  teamCount: number;
  description: string | null;
}

export const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({
  projectHead,
  avatarUrl,
  teamCount,
  description,
}) => {
  return (
    <Card 
      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] h-full" 
      bordered={false} 
      styles={{ body: { padding: '20px' } }}
    >
      <div className="space-y-4">
        {/* Top Header Section */}
        <Row gutter={16}>
          <Col span={14}>
            <div className="mb-1">
              <Text strong style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <UserOutlined className="mr-1" /> Team Head
              </Text>
            </div>
            <Space align="center">
              <Avatar 
                src={avatarUrl}
                style={{ 
                  backgroundColor: 'rgba(24, 144, 255, 0.1)', 
                  color: '#1890ff', 
                  border: '1px solid rgba(24, 144, 255, 0.2)' 
                }}
              >
                {!avatarUrl && projectHead.substring(0, 1).toUpperCase()}
              </Avatar>
              <Text strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{projectHead}</Text>
            </Space>
          </Col>
          <Col span={10}>
            <div className="mb-1">
              <Text strong style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <TeamOutlined className="mr-1" /> Members
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{teamCount}</Title>
              <Tag style={{ 
                marginLeft: '8px', 
                border: 'none', 
                background: 'var(--bg-slate-50)', 
                color: 'var(--text-secondary)',
                fontSize: '10px', 
                borderRadius: '4px' 
              }}>ACTIVE</Tag>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* Description Section */}
        <div>
          <div className="mb-2">
            <Text strong style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <ProfileOutlined className="mr-1" /> Project Description
            </Text>
          </div>
          <div style={{ 
            background: 'var(--bg-slate-50)', 
            padding: '12px', 
            borderRadius: '8px', 
            border: '1px solid var(--border-color)',
            minHeight: '80px'
          }}>
            <Paragraph 
              ellipsis={{ rows: 3, expandable: true, symbol: 'more' }} 
              style={{ fontSize: '13px', margin: 0, color: 'var(--text-slate-700)' }}
            >
              {description || "No description provided for this project."}
            </Paragraph>
          </div>
        </div>
      </div>
    </Card>
  );
};

const Divider = ({ style }: { style?: React.CSSProperties }) => (
  <div style={{ borderBottom: '1px solid var(--border-color)', ...style }} />
);
