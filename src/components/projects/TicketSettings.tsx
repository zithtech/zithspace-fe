'use client';

import React, { useState } from 'react';
import { Card, Typography, Button, Space, Row, Col, List, Tabs } from 'antd';
import { ControlOutlined, SettingOutlined, PlusCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
import DropdownManager from './DropdownManager';

const { Title, Paragraph, Text } = Typography;

export default function TicketSettings() {
  const [activeTab, setActiveTab] = useState('overview');
  const settingsFeatures = [
    {
      title: 'Task Types Management',
      description: 'Add, edit, and remove custom task types (Bug, Task, Feat, Overwrite)',
      icon: '🏷️'
    },
    {
      title: 'Task Levels Configuration',
      description: 'Configure difficulty levels (Easy, Lite, Medium, Hard)',
      icon: '📊'
    },
    {
      title: 'Priority Settings',
      description: 'Customize priority levels and their colors (P1, P2, P3)',
      icon: '🚨'
    },
    {
      title: 'Workflow Customization',
      description: 'Modify the 11-step workflow process to match your team needs',
      icon: '⚙️'
    },
    {
      title: 'GitHub Integration',
      description: 'Connect with GitHub repositories, enable issue sync, and branch linking',
      icon: '🔗'
    },
    {
      title: 'Team Roles & Permissions',
      description: 'Configure user roles and access permissions for ticket management',
      icon: '👥'
    },
    {
      title: 'Notification Settings',
      description: 'Set up email and in-app notifications for ticket updates',
      icon: '🔔'
    },
    {
      title: 'Custom Fields',
      description: 'Add custom fields to tickets for project-specific requirements',
      icon: '📝'
    },
    {
      title: 'Automation Rules',
      description: 'Create automated workflows and triggers for ticket management',
      icon: '🤖'
    },
    {
      title: 'Export & Import',
      description: 'Bulk import/export tickets and configuration settings',
      icon: '📤'
    }
  ];

  const renderOverviewTab = () => (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card style={{ textAlign: 'center', padding: 32, marginBottom: 24 }}>
            <SettingOutlined style={{ fontSize: 64, color: '#1677ff', marginBottom: 24 }} />
            
            <Title level={4} style={{ marginBottom: 16 }}>
              Dynamic Configuration Management
            </Title>
            
            <Paragraph style={{ fontSize: 16, color: '#666', marginBottom: 32 }}>
              Comprehensive settings panel for customizing your ticket management system to match your team's workflow and requirements.
            </Paragraph>

            <Space size="large">
              <Button 
                type="primary" 
                size="large"
                icon={<DatabaseOutlined />}
                onClick={() => setActiveTab('dropdown-management')}
              >
                Manage Dropdown Options
              </Button>
            </Space>
          </Card>

          <Card title="GitHub Integration Preview" style={{ marginBottom: 24 }}>
            <div style={{ padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 16 }}>
              <Text strong>🔗 Repository Connection</Text>
              <br />
              <Text type="secondary">Connect your GitHub repositories to enable:</Text>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>Automatic issue synchronization</li>
                <li>Branch linking with tickets</li>
                <li>Pull request integration</li>
                <li>Commit tracking</li>
              </ul>
            </div>
            
            <div style={{ padding: 16, backgroundColor: '#f0f9ff', borderRadius: 8, border: '1px solid #e0f2fe' }}>
              <Text strong style={{ color: '#0369a1' }}>🚀 Coming Soon</Text>
              <br />
              <Text type="secondary">OAuth integration with GitHub API for seamless repository management</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Configuration Features" style={{ height: 'fit-content' }}>
            <List
              dataSource={settingsFeatures}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: 20 }}>{item.icon}</span>}
                    title={<Text strong style={{ fontSize: 14 }}>{item.title}</Text>}
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.description}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Title level={4} style={{ marginBottom: 8 }}>
            Advanced Configuration Panel
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            The settings panel will provide intuitive interfaces for:
          </Paragraph>
          
          <Row gutter={16} style={{ textAlign: 'left' }}>
            <Col xs={24} md={12}>
              <ul style={{ fontSize: 14, lineHeight: 1.8 }}>
                <li><strong>Drag & Drop:</strong> Reorder workflow steps</li>
                <li><strong>Color Coding:</strong> Customize status and priority colors</li>
                <li><strong>Field Validation:</strong> Set required fields and formats</li>
                <li><strong>Template Management:</strong> Create ticket templates</li>
              </ul>
            </Col>
            <Col xs={24} md={12}>
              <ul style={{ fontSize: 14, lineHeight: 1.8 }}>
                <li><strong>Time Tracking:</strong> Configure estimation methods</li>
                <li><strong>Approval Workflows:</strong> Set multi-level approvals</li>
                <li><strong>Integration APIs:</strong> Connect external tools</li>
                <li><strong>Backup & Restore:</strong> Configuration management</li>
              </ul>
            </Col>
          </Row>

          <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
              <strong>Development Status:</strong> Settings functionality will be implemented in the next development phase with full administrative controls and real-time configuration updates.
            </Paragraph>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Ticket Settings
      </Title>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <SettingOutlined />
                Overview
              </span>
            ),
            children: renderOverviewTab()
          },
          {
            key: 'dropdown-management',
            label: (
              <span>
                <DatabaseOutlined />
                Dropdown Management
              </span>
            ),
            children: <DropdownManager />
          }
        ]}
      />
    </div>
  );
}
