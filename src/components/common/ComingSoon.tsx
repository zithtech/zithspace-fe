'use client';

import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { ToolOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ReactElement;
}

export default function ComingSoon({ 
  title, 
  description = "This feature is currently under development and will be available soon.",
  icon = <ToolOutlined />
}: ComingSoonProps) {
  const router = useRouter();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '24px',
      }}
    >
      <Card 
        style={{ 
          maxWidth: 500, 
          textAlign: 'center',
          width: '100%'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }}>
            {icon}
          </div>
          
          <Title level={2}>
            {title}
          </Title>
          
          <Title level={4} type="secondary">
            Coming Soon
          </Title>
          
          <Text type="secondary" style={{ fontSize: '16px' }}>
            {description}
          </Text>
          
          <Text type="secondary" style={{ fontSize: '14px' }}>
            We&apos;re working hard to bring you this feature. Stay tuned for updates!
          </Text>
          
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/dashboard')}
            style={{ marginTop: '16px' }}
          >
            Back to Dashboard
          </Button>
        </Space>
      </Card>
    </div>
  );
}
