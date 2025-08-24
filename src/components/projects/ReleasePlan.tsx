'use client';

import React from 'react';
import { Card, Typography, Button, Space, Row, Col } from 'antd';
import { CalendarOutlined, PlusCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function ReleasePlan() {
  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Release Plan
      </Title>

      <Card style={{ textAlign: 'center', padding: 48 }}>
        <CalendarOutlined style={{ fontSize: 64, color: '#1677ff', marginBottom: 24 }} />
        
        <Title level={4} style={{ marginBottom: 16 }}>
          Release Plan Management
        </Title>
        
        <Paragraph style={{ fontSize: 16, color: '#666', marginBottom: 32 }}>
          This section will contain comprehensive release planning functionality including:
        </Paragraph>

        <div style={{ textAlign: 'left', maxWidth: 600, margin: '0 auto', marginBottom: 32 }}>
          <ul style={{ fontSize: 14, lineHeight: 2 }}>
            <li><strong>Create Release Plan:</strong> Define release objectives, timelines, and scope</li>
            <li><strong>Ticket Assignment:</strong> Link tickets to specific release plans</li>
            <li><strong>Progress Tracking:</strong> Monitor release progress with visual indicators</li>
            <li><strong>Release Timeline:</strong> Gantt chart view of release milestones</li>
            <li><strong>Team Coordination:</strong> Assign team members and track responsibilities</li>
            <li><strong>Release Notes:</strong> Generate automated release documentation</li>
            <li><strong>Deployment Planning:</strong> Schedule and manage deployment phases</li>
          </ul>
        </div>

        <Space size="large">
          <Button 
            type="primary" 
            size="large"
            icon={<PlusCircleOutlined />}
          >
            Create Release Plan
          </Button>
        </Space>

        <div style={{ marginTop: 32, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
            <strong>Coming Soon:</strong> Full release planning functionality will be implemented in the next phase of development.
          </Paragraph>
        </div>
      </Card>
    </div>
  );
}
