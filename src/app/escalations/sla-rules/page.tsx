'use client';

import React, { useState } from 'react';
import { 
  Typography, 
  Button, 
  Card, 
  Table, 
  Tag, 
  Space, 
  Switch, 
  Tabs, 
  Input, 
  Badge,
  Tooltip,
  Divider,
  Collapse
} from 'antd';
import {
  SafetyOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  SlidersOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const BLUE_PRIMARY = 'var(--premium-blue)';

export default function SLARulesEnginePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { canManageEscalations } = usePermission();
  const [activeTab, setActiveTab] = useState('1');

  // ─── Route Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user && !canManageEscalations) {
      router.push("/escalations");
    }
  }, [user, authLoading, canManageEscalations, router]);

  const slaPolicies = [
    {
      id: 'SLA-001',
      name: 'Critical Infrastructure Response',
      response: '15 mins',
      resolution: '4 hours',
      status: true,
      appliedTo: 'Critical Priority Tickets',
    },
    {
      id: 'SLA-002',
      name: 'Standard Client Support',
      response: '2 hours',
      resolution: '24 hours',
      status: true,
      appliedTo: 'Medium/High Priority',
    },
    {
      id: 'SLA-003',
      name: 'Bug Report Cycle',
      response: '24 hours',
      resolution: '5 days',
      status: false,
      appliedTo: 'Feature Requests',
    }
  ];

  const escalationRules = [
    {
      id: 'RULE-01',
      name: 'Auto-Escalate on SLA Breach',
      trigger: 'Upon 100% SLA Breach',
      action: 'Notify Engineering Lead & Reassign',
      status: true,
    },
    {
      id: 'RULE-02',
      name: 'Manager Notification (80% SLA)',
      trigger: 'Upon 80% SLA Timer',
      action: 'Send Email to Project Manager',
      status: true,
    },
    {
      id: 'RULE-03',
      name: 'VIP Customer Fast-Track',
      trigger: 'If CustomerSegment IS Enterprise',
      action: 'Assign to Senior Support Eng',
      status: true,
    }
  ];

  const slaColumns = [
    {
      title: 'Policy Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong style={{ color: 'var(--text-slate-900)' }}>{text}</Text>,
    },
    {
      title: 'Applied To',
      dataIndex: 'appliedTo',
      key: 'appliedTo',
      render: (text: string) => <Tag bordered={false} style={{ borderRadius: 4, background: 'var(--bg-slate-50)', color: 'var(--text-slate-600)' }}>{text}</Tag>,
    },
    {
      title: 'Response / Resolution',
      key: 'timers',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13, color: 'var(--text-slate-600)' }}>Response: <Text strong style={{ color: 'var(--text-slate-900)' }}>{record.response}</Text></Text>
          <Text style={{ fontSize: 13, color: 'var(--text-slate-600)' }}>Resolution: <Text strong style={{ color: 'var(--text-slate-900)' }}>{record.resolution}</Text></Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean) => <Switch checked={status} size="small" />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="text" icon={<EditOutlined />} />
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ 
        margin: "0 -24px", 
        padding: "24px 32px", 
        background: "var(--bg-pure-white)", 
        minHeight: "calc(100vh - 64px)" 
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <Space align="center" style={{ marginBottom: 8 }}>
                <ThunderboltOutlined style={{ fontSize: 24, color: BLUE_PRIMARY }} />
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: 'var(--text-slate-900)' }}>SLA & Rules Engine</Title>
              </Space>
              <Text type="secondary" style={{ color: 'var(--text-slate-400)' }}>Define automation rules, response times, and escalation workflows to keep your team on track.</Text>
            </div>
            {canManageEscalations && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                size="large" 
                style={{ borderRadius: 8, height: 44, fontWeight: 600, background: BLUE_PRIMARY }}
              >
                Create New Policy
              </Button>
            )}
          </div>

          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="premium-tabs"
            items={[
              {
                key: '1',
                label: <Space><ClockCircleOutlined /> SLA Policies</Space>,
                children: (
                  <div style={{ marginTop: 16 }} className="fade-in">
                    <Card style={{ borderRadius: 16, border: '1px solid var(--border-slate-200)', overflow: 'hidden', background: 'var(--bg-pure-white)' }} bodyStyle={{ padding: 0 }}>
                      <Table 
                        columns={slaColumns} 
                        dataSource={slaPolicies} 
                        pagination={false}
                        rowKey="id"
                        style={{ margin: 0, background: 'var(--bg-pure-white)' }}
                        className="premium-table"
                      />
                    </Card>
                    
                    <div style={{ marginTop: 24 }}>
                      <Alert 
                        type="info" 
                        showIcon 
                        message="Intelligent Sorters"
                        description="Policies are evaluated from top to bottom. Use the drag handles (coming soon) to prioritize policy evaluations."
                        style={{ borderRadius: 12, border: '1px solid var(--border-sky-100)', background: 'var(--bg-sky-50)' }}
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: '2',
                label: <Space><SlidersOutlined /> Escalation Rules</Space>,
                children: (
                  <div style={{ marginTop: 16 }} className="fade-in">
                    <Card style={{ borderRadius: 16, border: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)' }} bodyStyle={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <Title level={4} style={{ margin: 0, color: 'var(--text-slate-900)' }}>Active Automation Rules</Title>
                        <Button icon={<SettingOutlined />} style={{ color: 'var(--text-slate-600)', background: 'var(--bg-pure-white)' }}>Global Settings</Button>
                      </div>
                      
                      <Collapse 
                        ghost 
                        expandIcon={({ isActive }) => <RightOutlined rotate={isActive ? 90 : 0} />}
                        className="rule-collapse"
                      >
                        {escalationRules.map((rule, idx) => (
                          <Panel 
                            header={
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', paddingRight: 12 }}>
                                <Space size={16}>
                                  <Badge status={rule.status ? 'success' : 'default'} />
                                  <Text strong>{rule.name}</Text>
                                </Space>
                                <Tag bordered={false} color={rule.status ? 'green' : 'default'} style={{ borderRadius: '6px' }}>{rule.status ? 'Active' : 'Disabled'}</Tag>
                              </div>
                            } 
                            key={idx}
                            style={{ marginBottom: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border-slate-200)', borderRadius: 12 }}
                          >
                            <div style={{ padding: '0 16px 16px 16px' }}>
                              <Divider style={{ margin: '12px 0' }} />
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', gap: 24 }}>
                                  <div style={{ flex: 1 }}>
                                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-slate-400)' }}>Condition / Trigger</Text>
                                    <div style={{ marginTop: 4, fontWeight: 600, color: 'var(--text-slate-900)' }}>{rule.trigger}</div>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-slate-400)' }}>Then Action</Text>
                                    <div style={{ marginTop: 4, fontWeight: 600, color: BLUE_PRIMARY }}>{rule.action}</div>
                                  </div>
                                </div>
                                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                  <Button size="small">Duplicate</Button>
                                  <Button size="small" type="primary">View Logic</Button>
                                </div>
                              </Space>
                            </div>
                          </Panel>
                        ))}
                      </Collapse>

                      <Button 
                        type="dashed" 
                        block 
                        icon={<PlusOutlined />} 
                        style={{ height: 50, borderRadius: 12, marginTop: 12, border: '1px dashed var(--border-slate-200)', color: 'var(--text-slate-400)' }}
                      >
                        Add Custom Automation Rule
                      </Button>
                    </Card>
                  </div>
                ),
              },
              {
                key: '3',
                label: <Space><SafetyOutlined /> Shift Management</Space>,
                children: (
                  <div style={{ marginTop: 16 }} className="fade-in">
                    <Card style={{ borderRadius: 16, border: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)', padding: 40, textAlign: 'center' }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>🗓️</div>
                      <Title level={3} style={{ color: 'var(--text-slate-900)' }}>Shift-Based Escalations</Title>
                      <Paragraph style={{ color: 'var(--text-slate-400)', fontSize: 16 }}>
                        Configure support rotas and shifts to ensure escalations are always routed to the right on-call engineer based on time of day.
                      </Paragraph>
                      <Button type="primary" ghost size="large" style={{ borderRadius: 8, marginTop: 12, color: BLUE_PRIMARY, borderColor: BLUE_PRIMARY }}>Configure Rotas</Button>
                    </Card>
                  </div>
                ),
              }
            ]}
          />
        </div>

        <style jsx global>{`
          .premium-tabs .ant-tabs-nav::before {
            border-bottom: 1px solid var(--border-slate-100);
          }
          .premium-tabs .ant-tabs-tab {
            padding: 12px 16px !important;
            margin: 0 16px 0 0 !important;
            font-weight: 500;
            color: var(--text-slate-600);
          }
          .premium-tabs .ant-tabs-tab-active {
            font-weight: 700;
          }
          .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: var(--premium-blue) !important;
          }
          .premium-tabs .ant-tabs-ink-bar {
            height: 3px !important;
            border-radius: 3px 3px 0 0;
            background: ${BLUE_PRIMARY} !important;
          }
          .rule-collapse .ant-collapse-header {
            padding: 16px 20px !important;
            align-items: center !important;
          }
          .fade-in {
            animation: fadeIn 0.3s ease-in;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}

// Simple Alert Component (Antd Alert was missing import but used above)
const Alert = ({ message, description, type, showIcon, style }: any) => (
  <div style={{ 
    padding: '12px 16px', 
    borderRadius: 8, 
    background: type === 'info' ? 'var(--bg-sky-50)' : 'var(--bg-slate-50)', 
    border: `1px solid ${type === 'info' ? 'var(--border-sky-100)' : 'var(--border-slate-100)'}`,
    display: 'flex',
    gap: 12,
    ...style
  }}>
    {showIcon && <QuestionCircleOutlined style={{ color: type === 'info' ? 'var(--premium-blue)' : 'var(--text-slate-400)', marginTop: 4 }} />}
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>{message}</div>
      <div style={{ color: 'var(--text-slate-600)', fontSize: 13, marginTop: 2 }}>{description}</div>
    </div>
  </div>
);
