import React from "react";
import { Card, Typography, Row, Col, Avatar, Space, Tag } from "antd";
import { UserOutlined, TeamOutlined, ProfileOutlined } from "@ant-design/icons";

const { Text, Title, Paragraph } = Typography;

interface ProjectInfoCardProps {
  projectHead: string;
  teamCount: number;
  description: string | null;
}

export const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({
  projectHead,
  teamCount,
  description,
}) => {
  return (
    <Card className="rounded-xl border border-gray-100 h-full" bordered={false} bodyStyle={{ padding: '20px' }}>
      <div className="space-y-4">
        {/* Top Header Section */}
        <Row gutter={16}>
          <Col span={14}>
            <div className="mb-1">
              <Text strong style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <UserOutlined className="mr-1" /> Team Head
              </Text>
            </div>
            <Space align="center">
              <Avatar style={{ backgroundColor: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff' }}>
                {projectHead.substring(0, 1).toUpperCase()}
              </Avatar>
              <Text strong style={{ fontSize: '14px' }}>{projectHead}</Text>
            </Space>
          </Col>
          <Col span={10}>
            <div className="mb-1">
              <Text strong style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <TeamOutlined className="mr-1" /> Members
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{teamCount}</Title>
              <Tag style={{ marginLeft: '8px', border: 'none', background: '#f5f5f5', fontSize: '10px', borderRadius: '4px' }}>ACTIVE</Tag>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        {/* Description Section */}
        <div>
          <div className="mb-2">
            <Text strong style={{ fontSize: '11px', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <ProfileOutlined className="mr-1" /> Project Description
            </Text>
          </div>
          <div style={{ 
            background: '#fafafa', 
            padding: '12px', 
            borderRadius: '8px', 
            border: '1px solid #f0f0f0',
            minHeight: '80px'
          }}>
            <Paragraph 
              ellipsis={{ rows: 3, expandable: true, symbol: 'more' }} 
              style={{ fontSize: '13px', margin: 0, color: '#555' }}
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
  <div style={{ borderBottom: '1px solid #f0f0f0', ...style }} />
);
