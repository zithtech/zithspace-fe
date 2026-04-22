'use client';

import React, { useState } from 'react';
import { Card, Typography, Button, Space, Row, Col, List, Tabs, Divider, Tag, Badge } from 'antd';
import {
  ControlOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  GithubOutlined,
  TeamOutlined,
  BellOutlined,
  BlockOutlined,
  RobotOutlined,
  ExportOutlined,
  ArrowRightOutlined,
  HeartOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { globalDataKeys } from '@/hooks/useGlobalData';
import DropdownManager from './DropdownManager';

const { Title, Paragraph, Text } = Typography;

export default function TicketSettings() {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Handle data changes from DropdownManager
  const handleDataChange = () => {
    queryClient.invalidateQueries({ queryKey: globalDataKeys.ticketConfig });
  };

  const settingsFeatures = [
    { title: 'Lookup Mapping', icon: <DatabaseOutlined />, color: '#1677ff' },
    { title: 'Priority & Severity', icon: <ThunderboltOutlined />, color: '#faad14' },
    { title: 'Workflow Engine', icon: <ControlOutlined />, color: '#52c41a' },
    { title: 'GitHub Sync', icon: <GithubOutlined />, color: '#000' },
    { title: 'RBAC Controls', icon: <TeamOutlined />, color: '#722ed1' },
    { title: 'Smart Notifications', icon: <BellOutlined />, color: '#eb2f96' },
    { title: 'Dynamic Fields', icon: <BlockOutlined />, color: '#13c2c2' },
    { title: 'AI Automation', icon: <RobotOutlined />, color: '#2f54eb' }
  ];

  const renderOverviewTab = () => (
    <div className="no-scrollbar" style={{ padding: '0', height: '100%', overflow: 'hidden' }}>
      <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={16} style={{ display: 'flex' }}>
          {/* Main Hero Card */}
          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              background: 'var(--bg-pure-white)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 30px rgba(22, 119, 255, 0.05)',
              overflow: 'hidden',
              flex: 1
            }}
            bodyStyle={{ padding: '24px', height: '100%', display: 'flex', alignItems: 'center' }}
          >
            <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <Space align="start" size={24}>
                <div style={{
                  width: 64,
                  height: 64,
                  background: '#1677ff',
                  borderRadius: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(22, 119, 255, 0.25)'
                }}>
                  <SettingOutlined style={{ fontSize: 32, color: 'white' }} />
                </div>
                <div>
                  <Title level={2} style={{ marginBottom: 8, fontWeight: 800 }}>
                    System Orchestration
                  </Title>
                  <Paragraph style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 550, marginBottom: 24 }}>
                    Master your workspace architecture. Configure global taxonomies, optimize workflow lifecycles, and synchronize with external dev ecosystems from a single pane of glass.
                  </Paragraph>
                  <Space size="middle">
                    <Button
                      type="primary"
                      onClick={() => setActiveTab('dropdown-management')}
                      style={{ borderRadius: 10, height: 40, padding: '0 20px', fontWeight: 600 }}
                    >
                      Lookup Management
                    </Button>
                    <Button
                      icon={<GithubOutlined />}
                      style={{ borderRadius: 10, height: 40, padding: '0 20px', fontWeight: 600 }}
                    >
                      Connect Repository
                    </Button>
                  </Space>
                </div>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8} style={{ display: 'flex' }}>
          <Card
            title={<Text strong style={{ fontSize: 16 }}>Core Infrastructure</Text>}
            bordered={false}
            style={{ borderRadius: 20, flex: 1, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-pure-white)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
            bodyStyle={{ padding: '0 20px' }}
          >
            <List
              dataSource={settingsFeatures}
              renderItem={(item) => (
                <List.Item style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 30,
                        height: 30,
                        background: `${item.color}12`,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.color,
                        fontSize: 14
                      }}>
                        {item.icon}
                      </div>
                    }
                    title={<Text strong style={{ fontSize: 13 }}>{item.title}</Text>}
                  />
                  <Tag color="success" style={{ borderRadius: 10, fontSize: 10, margin: 0 }}>Active</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
          <Card bordered={false} style={{ borderRadius: 20, flex: 1, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-pure-white)' }} bodyStyle={{ padding: 24 }}>
            <Space direction="vertical" size={16}>
              <div style={{ width: 44, height: 44, backgroundColor: 'rgba(82, 196, 26, 0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HeartOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0 }}>System Health</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Configurations are optimized and synchronized.</Text>
              </div>
              <Divider style={{ margin: 0 }} />
              <Space>
                <Badge status="processing" color="#52c41a" />
                <Text strong style={{ fontSize: 12 }}>All Services Online</Text>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
          <Card bordered={false} style={{ borderRadius: 20, flex: 1, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-pure-white)' }} bodyStyle={{ padding: 24 }}>
            <Space direction="vertical" size={16}>
              <div style={{ width: 44, height: 44, backgroundColor: 'rgba(22, 119, 255, 0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SafetyCertificateOutlined style={{ color: '#1677ff', fontSize: 20 }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0 }}>RBAC Status</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Role-based access controls are strictly enforced.</Text>
              </div>
              <Divider style={{ margin: 0 }} />
              <Button size="small" type="link" style={{ padding: 0 }}>Manage Permissions</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
          <Card bordered={false} style={{ borderRadius: 20, flex: 1, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-pure-white)' }} bodyStyle={{ padding: 24 }}>
            <Space direction="vertical" size={16}>
              <div style={{ width: 44, height: 44, backgroundColor: 'rgba(250, 173, 20, 0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DeploymentUnitOutlined style={{ color: '#faad14', fontSize: 20 }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0 }}>Workflow Stage</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>11-step project lifecycle defined for all tickets.</Text>
              </div>
              <Divider style={{ margin: 0 }} />
              <Tag color="orange" style={{ borderRadius: 10 }}>Standard Default</Tag>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
          <Card bordered={false} style={{ borderRadius: 20, flex: 1, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-pure-white)' }} bodyStyle={{ padding: 24 }}>
            <Space direction="vertical" size={16}>
              <div style={{ width: 44, height: 44, backgroundColor: 'rgba(255, 77, 79, 0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ExportOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0 }}>Data IO</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Bulk sync and mapping export available.</Text>
              </div>
              <Divider style={{ margin: 0 }} />
              <Space>
                <Button size="small" icon={<PlusOutlined style={{ fontSize: 10 }} />}>Import</Button>
                <Button size="small">Export</Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div className="no-scrollbar" style={{
      margin: '0',
      height: 'calc(100vh - 104px)',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-pure-white)'
    }}>
      {/* Sticky Header and Tabs Container */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        paddingTop: 0,
        paddingBottom: 0,
        margin: '0 -20px 20px -20px',
        paddingLeft: 20,
        paddingRight: 20,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'var(--bg-pure-white)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ padding: '12px 0' }}>
          <Space align="center" size={12}>
            <ControlOutlined style={{ fontSize: 20, color: '#1677ff' }} />
            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Ticket Settings</Title>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          className="settings-tabs"
          style={{ marginBottom: 0 }}
          items={[
            {
              key: 'overview',
              label: (
                <Space>
                  <SettingOutlined />
                  Overview
                </Space>
              ),
            },
            {
              key: 'dropdown-management',
              label: (
                <Space>
                  <DatabaseOutlined />
                  Lookup Values
                </Space>
              ),
            }
          ]}
        />
      </div>

      {/* Content Area */}
      <div className="no-scrollbar" style={{ marginTop: 0, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {activeTab === 'overview' ? renderOverviewTab() : <DropdownManager onDataChange={handleDataChange} />}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .settings-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
        }
        .settings-tabs .ant-tabs-nav-list {
          gap: 8px;
        }
        .settings-tabs .ant-tabs-tab {
          border-radius: 12px 12px 0 0 !important;
          background: transparent !important;
          border: none !important;
          transition: all 0.3s;
        }
        .settings-tabs .ant-tabs-tab-active {
          background: var(--bg-pure-white) !important;
          box-shadow: 0 -4px 12px rgba(0,0,0,0.03);
        }
        .settings-tabs .ant-tabs-tab:hover {
          color: #1677ff !important;
        }
      `}</style>
    </div>
  );
}
