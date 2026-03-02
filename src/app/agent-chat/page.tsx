'use client';

import React from 'react';
import { Card, Typography, Space } from 'antd';
import AgentChat from '@/components/agent/AgentChat';
import { RobotOutlined, ThunderboltOutlined, SafetyOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function AgentChatPage() {
  return (
    <div style={{ height: 'calc(100vh - 120px)', padding: '24px', display: 'flex', gap: '24px' }}>
      {/* Main Chat Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <AgentChat />
      </div>

      {/* Info Sidebar */}
      <div style={{ width: '320px', flexShrink: 0 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Welcome Card */}
          <Card size="small">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space>
                <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <Title level={5} style={{ margin: 0 }}>AI Project Assistant</Title>
              </Space>
              <Paragraph style={{ margin: 0, fontSize: 13 }}>
                Chat with AI to manage your projects and tickets using natural language.
              </Paragraph>
            </Space>
          </Card>

          {/* Capabilities Card */}
          <Card title="What I Can Do" size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ fontSize: 12 }}>📊 Projects</Text>
                <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 12 }}>
                  <li>List and search projects</li>
                  <li>Get project details</li>
                  <li>View team members</li>
                  <li>Create new projects</li>
                </ul>
              </div>

              <div>
                <Text strong style={{ fontSize: 12 }}>🎫 Tickets</Text>
                <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 12 }}>
                  <li>Find tickets by status/priority</li>
                  <li>Get ticket details</li>
                  <li>Create and update tickets</li>
                  <li>View your assignments</li>
                </ul>
              </div>

              <div>
                <Text strong style={{ fontSize: 12 }}>📈 Analytics</Text>
                <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 12 }}>
                  <li>Dashboard statistics</li>
                  <li>Project progress</li>
                  <li>Team workload</li>
                </ul>
              </div>
            </Space>
          </Card>

          {/* Example Queries Card */}
          <Card title="Try These Queries" size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text code style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  Show me all active projects
                </Text>
                <Text code style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  What tickets are assigned to me?
                </Text>
                <Text code style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  Create a bug ticket in project X
                </Text>
                <Text code style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  Show dashboard statistics
                </Text>
                <Text code style={{ fontSize: 11, display: 'block' }}>
                  Get details for project ABC-123
                </Text>
              </div>
            </Space>
          </Card>

          {/* Features Card */}
          <Card size="small">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space>
                <ThunderboltOutlined style={{ color: '#faad14' }} />
                <Text strong style={{ fontSize: 13 }}>Fast & Intelligent</Text>
              </Space>
              <Text style={{ fontSize: 12 }}>
                Powered by advanced AI to understand your requests and provide accurate responses.
              </Text>

              <Space>
                <SafetyOutlined style={{ color: '#52c41a' }} />
                <Text strong style={{ fontSize: 13 }}>Secure & Private</Text>
              </Space>
              <Text style={{ fontSize: 12 }}>
                Your conversations are private and secure. Only you can see your chat history.
              </Text>
            </Space>
          </Card>
        </Space>
      </div>
    </div>
  );
}
