'use client';

import React, { useState } from 'react';
import { Card, Typography, Button, Space, Row, Col, List, Tabs, Divider, Tag, Badge, Switch } from 'antd';
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
  CloudSyncOutlined,
  LinkOutlined,
  SearchOutlined,
  SlackOutlined,
  DiscordOutlined,
  BranchesOutlined,
  PullRequestOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ShareAltOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { globalDataKeys } from '@/hooks/useGlobalData';
import DropdownManager from './DropdownManager';
import BugListConfigManager from './BugListConfigManager';
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

const { Title, Paragraph, Text } = Typography;

export default function TicketSettings() {
  const [activeTab, setActiveTab] = useState('dropdown-management');
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

  const renderIntegrationTab = () => (
    <div className="no-scrollbar" style={{ padding: '0 48px 32px', height: '100%', overflowY: 'auto' }}>
      <Row gutter={[24, 24]}>
        {/* Main Integration Hero */}
        <Col span={24}>
          <Card
            bordered={false}
            className="premium-card"
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              border: 'none'
            }}
            styles={{ body: { padding: '40px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' } }}
          >
            <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', filter: 'blur(60px)' }} />
            <Row align="middle" gutter={48}>
              <Col flex="0 0 100px">
                <div style={{
                  width: 90,
                  height: 90,
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                  <GithubOutlined style={{ fontSize: 48, color: '#fff' }} />
                </div>
              </Col>
              <Col flex="1">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <Tag color="blue" style={{ borderRadius: 6, fontSize: 10, fontWeight: 800, background: 'rgba(59, 130, 246, 0.2)', border: 'none', color: '#60a5fa' }}>SYSTEM_CORE</Tag>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>AUTO_SYNC_ENABLED</Text>
                </div>
                <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 900, letterSpacing: '-1px' }}>GitHub Production Node</Title>
                <Paragraph style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 15, margin: '12px 0 28px', maxWidth: 650, lineHeight: 1.6 }}>
                  Bridge your development velocity with project orchestration. Monitor PR cycles, automate ticket lifecycles, and synchronize delivery telemetry in real-time.
                </Paragraph>
                <Space size={16}>
                  <Button type="primary" size="large" style={{ borderRadius: 8, fontWeight: 700, padding: '0 32px', height: 48, background: '#3b82f6' }}>
                    Reconnect Node
                  </Button>
                  <Button ghost size="large" style={{ borderRadius: 8, fontWeight: 700, padding: '0 32px', height: 48, borderColor: 'rgba(255,255,255,0.2)' }}>
                    Diagnostics
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Telemetry & Synchronization */}
        <Col xs={24} lg={16}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CloudSyncOutlined style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 800 }}>Synchronization Telemetry</span>
                </div>
              }
              bordered={false}
              className="saas-card"
              styles={{ body: { padding: '0 24px' } }}
              extra={<Tag color="processing">REAL-TIME</Tag>}
            >
              <List
                itemLayout="horizontal"
                dataSource={[
                  { title: 'Bi-directional Issue Sync', description: 'Real-time state synchronization between GitHub and Zukvo.', icon: <LinkOutlined />, status: 'active', meta: 'Last sync: 2m ago' },
                  { title: 'Automated Pull Requests', description: 'Automatic ticket linking and status transition on PR updates.', icon: <PullRequestOutlined />, status: 'active', meta: '12 events/hr' },
                  { title: 'Source Code Mapping', description: 'Trace commit authorship and link to specific task definitions.', icon: <BranchesOutlined />, status: 'inactive', meta: 'Setup required' },
                  { title: 'Deployment Triggers', description: 'Update ticket lifecycles based on CI/CD deployment status.', icon: <ThunderboltOutlined />, status: 'inactive', meta: 'Beta' }
                ]}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Switch size="small" checked={item.status === 'active'} />,
                      <Button type="text" icon={<SettingOutlined />} />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div className={`ts-sync-icon ${item.status === 'active' ? 'active' : 'inactive'}`}>
                          {item.icon}
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong style={{ fontSize: 14 }}>{item.title}</Text>
                          <Text className="ts-meta-badge">{item.meta}</Text>
                        </div>
                      }
                      description={<Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text>}
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card bordered={false} className="saas-card" styles={{ body: { padding: 24 } }}>
                  <Space align="start" size={16}>
                    <div className="ts-status-icon-box green">
                      <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 22 }} />
                    </div>
                    <div>
                      <Title level={5} style={{ margin: 0 }}>Webhook Health</Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>All integration hooks are operational.</Text>
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="ts-progress-bar-track green">
                          <div className="ts-progress-bar-fill green" />
                        </div>
                        <Text strong style={{ fontSize: 11, color: '#16a34a' }}>99.9% Up</Text>
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} className="saas-card" styles={{ body: { padding: 24 } }}>
                  <Space align="start" size={16}>
                    <div className="ts-status-icon-box orange">
                      <HistoryOutlined style={{ color: '#ea580c', fontSize: 22 }} />
                    </div>
                    <div>
                      <Title level={5} style={{ margin: 0 }}>Sync History</Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>Total 1,284 operations this month.</Text>
                      <Button type="link" size="small" style={{ padding: 0, marginTop: 4, fontSize: 11 }}>View detailed logs</Button>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        </Col>

        {/* Integration Marketplace / Secondary */}
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card
              title={<span style={{ fontWeight: 800 }}>Ecosystem Hub</span>}
              bordered={false}
              className="saas-card"
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div className="ts-ecosystem-item">
                  <div className="ts-ecosystem-icon-box">
                    <SlackOutlined style={{ fontSize: 24, color: '#4A154B' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 13 }}>Slack Notifications</Text>
                    <div className="ts-ecosystem-subtitle">Push updates to channels</div>
                  </div>
                  <Button size="small" type="primary" ghost style={{ borderRadius: 6, fontSize: 11 }}>Connect</Button>
                </div>

                <div className="ts-ecosystem-item">
                  <div className="ts-ecosystem-icon-box">
                    <DiscordOutlined style={{ fontSize: 24, color: '#5865F2' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 13 }}>Discord Webhooks</Text>
                    <div className="ts-ecosystem-subtitle">Developer event streams</div>
                  </div>
                  <Button size="small" type="primary" ghost style={{ borderRadius: 6, fontSize: 11 }}>Connect</Button>
                </div>

                <div className="ts-ecosystem-item active">
                  <div className="ts-ecosystem-icon-box">
                    <CloudSyncOutlined style={{ fontSize: 24, color: '#3b82f6' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 13 }}>REST API Access</Text>
                    <div className="ts-ecosystem-subtitle active">Direct system integration</div>
                  </div>
                  <Button size="small" type="primary" style={{ borderRadius: 6, fontSize: 11 }}>Manage</Button>
                </div>
              </Space>
            </Card>

            <Card bordered={false} className="saas-card ts-dev-utilities-card">
              <div style={{ textAlign: 'center' }}>
                <div className="ts-dev-utilities-label">Developer Utilities</div>
                <Paragraph className="ts-dev-utilities-desc">
                  Access documentation and API reference for building custom integrations.
                </Paragraph>
                <Button block style={{ borderRadius: 8, fontWeight: 600 }}>API Explorer</Button>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );

  return (
    <div className="ts-root" style={{
      margin: '0',
      height: 'calc(100vh - 104px)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Workstation Header */}
      <div className="ts-sticky-header" style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "var(--bg-pure-white)",
        margin: '-24px -32px 0',
        width: 'calc(100% + 64px)',
        borderLeft: '1px solid var(--border-slate-200)'
      }}>
        <TimeTrackingHeader
          icon={<ControlOutlined style={{ fontSize: 18, color: '#8b5cf6' }} />}
          title="Ticket Settings"
          description="Strategic task organization and cross-project categorization"
          style={{
            padding: '10.5px 32px 24px 32px',
            marginBottom: 0,
            background: "transparent"
          }}
        extra={
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="premium-nav-tabs"
            style={{ marginBottom: -11 }}
            items={[
              /* {
                key: 'integration',
                label: (
                  <Space size={8}>
                    <ShareAltOutlined />
                    <span>Integration</span>
                  </Space>
                ),
              }, */
              {
                key: 'dropdown-management',
                label: (
                  <Space size={8}>
                    <DatabaseOutlined />
                    <span>Configuration</span>
                  </Space>
                ),
              },
              {
                key: 'bug-list',
                label: (
                  <Space size={8}>
                    <BugOutlined />
                    <span>Bug List</span>
                  </Space>
                ),
              },
            ]}
          />
        }
      />
      <Divider style={{ margin: 0, width: '100%', minWidth: '100%' }} />
      </div>

      {/* Content Area */}
      <div className="no-scrollbar" style={{ marginTop: 0, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {activeTab === 'integration'
          ? renderIntegrationTab()
          : activeTab === 'bug-list'
            ? <BugListConfigManager />
            : <DropdownManager onDataChange={handleDataChange} />}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* ── Root container ──────────────────────────────────────── */
        .ts-root {
          background-color: transparent;
        }

        /* ── Header ──────────────────────────────────────────────── */
        .ts-header {
          background: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid var(--border-slate-200);
        }
        [data-theme='dark'] .ts-header {
          background: rgba(11, 15, 26, 0.85) !important;
          border-bottom-color: #1f2937 !important;
        }

        .ts-header-icon-box {
          width: 38px;
          height: 38px;
          background: var(--bg-purple-50);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(139, 92, 246, 0.2);
          flex-shrink: 0;
        }
        [data-theme='dark'] .ts-header-icon-box {
          background: rgba(139, 92, 246, 0.15) !important;
          border-color: rgba(139, 92, 246, 0.25) !important;
        }

        .ts-divider {
          width: 1.5px;
          height: 24px;
          background: var(--border-slate-200);
          border-radius: 1px;
        }
        [data-theme='dark'] .ts-divider {
          background: #374151 !important;
        }

        .ts-header-subtitle {
          font-size: 13px;
          color: var(--text-slate-600);
          font-weight: 600;
          margin-top: 1px;
        }

        /* ── Nav Tabs ─────────────────────────────────────────────── */
        .premium-nav-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
        }
        .premium-nav-tabs .ant-tabs-nav::before {
          display: none !important;
        }
        .premium-nav-tabs .ant-tabs-tab {
          padding: 8px 16px !important;
          margin: 0 4px !important;
          border-radius: 8px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
        }
        .premium-nav-tabs .ant-tabs-tab:hover {
          color: #3B82F6 !important;
          background: rgba(59, 130, 246, 0.05) !important;
        }
        .premium-nav-tabs .ant-tabs-tab-active {
          background: var(--bg-secondary) !important;
          color: #3B82F6 !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1) !important;
          border: 1px solid rgba(59, 130, 246, 0.1) !important;
        }
        [data-theme='dark'] .premium-nav-tabs .ant-tabs-tab-active {
          background: #1f2937 !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
        }
        .premium-nav-tabs .ant-tabs-ink-bar {
          display: none !important;
        }

        /* ── Sync icon badges ─────────────────────────────────────── */
        .ts-sync-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ts-sync-icon.active {
          background: var(--bg-blue-50);
          color: #3b82f6;
        }
        .ts-sync-icon.inactive {
          background: var(--bg-slate-50);
          color: var(--text-slate-400);
        }
        [data-theme='dark'] .ts-sync-icon.active {
          background: rgba(59, 130, 246, 0.15) !important;
        }
        [data-theme='dark'] .ts-sync-icon.inactive {
          background: #1f2937 !important;
        }

        /* ── Meta badge ───────────────────────────────────────────── */
        .ts-meta-badge {
          font-size: 10px;
          color: var(--text-slate-400);
          background: var(--bg-slate-50);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid var(--border-slate-100);
        }
        [data-theme='dark'] .ts-meta-badge {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }

        /* ── Status icon boxes ────────────────────────────────────── */
        .ts-status-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ts-status-icon-box.green {
          background: var(--bg-green-50);
        }
        .ts-status-icon-box.orange {
          background: var(--bg-orange-50);
        }
        [data-theme='dark'] .ts-status-icon-box.green {
          background: rgba(16, 185, 129, 0.15) !important;
        }
        [data-theme='dark'] .ts-status-icon-box.orange {
          background: rgba(249, 115, 22, 0.15) !important;
        }

        /* ── Progress bar ─────────────────────────────────────────── */
        .ts-progress-bar-track {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          overflow: hidden;
        }
        .ts-progress-bar-track.green {
          background: var(--bg-green-50);
        }
        [data-theme='dark'] .ts-progress-bar-track.green {
          background: rgba(16, 185, 129, 0.15) !important;
        }
        .ts-progress-bar-fill {
          width: 100%;
          height: 100%;
        }
        .ts-progress-bar-fill.green {
          background: #16a34a;
        }
        [data-theme='dark'] .ts-progress-bar-fill.green {
          background: #34d399 !important;
        }

        /* ── Ecosystem Hub items ──────────────────────────────────── */
        .ts-ecosystem-item {
          padding: 12px;
          border-radius: 12px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ts-ecosystem-item.active {
          background: var(--bg-blue-50);
          border-color: var(--border-blue-200);
        }
        [data-theme='dark'] .ts-ecosystem-item {
          background: #1a2035 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .ts-ecosystem-item.active {
          background: rgba(59, 130, 246, 0.1) !important;
          border-color: rgba(59, 130, 246, 0.2) !important;
        }

        .ts-ecosystem-icon-box {
          width: 40px;
          height: 40px;
          background: var(--bg-pure-white);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          flex-shrink: 0;
        }
        [data-theme='dark'] .ts-ecosystem-icon-box {
          background: #0b0f1a !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
        }

        .ts-ecosystem-subtitle {
          font-size: 11px;
          color: var(--text-slate-400);
        }
        .ts-ecosystem-subtitle.active {
          color: #3b82f6;
        }
        [data-theme='dark'] .ts-ecosystem-subtitle.active {
          color: #60a5fa !important;
        }

        /* ── Developer Utilities card ─────────────────────────────── */
        .ts-dev-utilities-card {
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .ts-dev-utilities-card {
          background: #161b22 !important;
        }

        .ts-dev-utilities-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-600);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .ts-dev-utilities-desc {
          font-size: 12px;
          color: var(--text-slate-400);
          margin-bottom: 16px;
        }

        /* ── Ant Design List dark overrides ──────────────────────── */
        [data-theme='dark'] .ant-list-item {
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .ant-list-item-meta-title {
          color: var(--text-slate-900) !important;
        }
      `}</style>
    </div>
  );
}
