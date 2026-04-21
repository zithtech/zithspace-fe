import React from "react";
import { Card, Typography, Avatar, Space } from "antd";

const { Text, Title, Paragraph } = Typography;

interface ProjectInfoCardProps {
  projectHead: string;
  projectHeadAvatar?: string | null;
  teamCount: number;
  description: string | null;
}

export const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({
  projectHead,
  projectHeadAvatar,
  teamCount,
  description,
}) => {
  return (
    <Card 
      className="rounded-xl border-[var(--border-color)] h-full bg-[var(--bg-secondary)]" 
      bordered={false} 
      styles={{ body: { padding: '24px' } }}
    >
      <Title level={5} style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '24px' }}>
        PROJECT INFO
      </Title>

      <div className="space-y-6">
        <div>
          <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '10px', fontWeight: 500 }}>PROJECT HEAD</Text>
          <div style={{ 
            background: 'var(--bg-slate-50)', 
            padding: '16px', 
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Space align="center" size="middle">
              <Avatar 
                size="large"
                src={projectHeadAvatar}
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  color: 'var(--primary-color)', 
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                {projectHead.substring(0, 1).toUpperCase()}
              </Avatar>
              <div>
                <Text strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block' }}>{projectHead}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>Project Manager</Text>
              </div>
            </Space>
          </div>
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '10px', fontWeight: 500 }}>DESCRIPTION</Text>
          <div style={{ 
            minHeight: '100px',
            background: 'var(--bg-slate-50)', 
            padding: '16px', 
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}>
            <Paragraph
              ellipsis={{ rows: 4, expandable: true, symbol: 'View More' }}
              style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7', margin: 0 }}
            >
              {description || "No description provided for this project."}
            </Paragraph>
          </div>
        </div>

        <div style={{ 
          paddingTop: '20px', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: 500 }}>TEAM SIZE</Text>
            <Text strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{teamCount} Members</Text>
          </div>
          <div style={{ 
            padding: '4px 12px', 
            background: 'rgba(82, 196, 26, 0.1)', 
            color: '#52c41a', 
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700
          }}>
            ACTIVE
          </div>
        </div>
      </div>
    </Card>
  );
};
