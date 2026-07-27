'use client';

import React, { useState } from 'react';
import { Typography, Tabs, Spin, Card } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Clock,
  ShieldCheck,
  FileText,
  MessageSquare
} from 'lucide-react';
import NoticePeriodPolicyPage from '@/components/employee-exit/configuration/NoticePeriodPolicyPage';
import ApprovalWorkflowPage from '@/components/employee-exit/configuration/ApprovalWorkflowPage';
import ExitTypePage from '@/components/employee-exit/configuration/ExitTypePage';
import ReasonForExitPage from '@/components/employee-exit/configuration/ReasonForExitPage';
import ChecklistConfigPage from '@/components/employee-exit/configuration/ChecklistConfigPage';

const { Title, Text } = Typography;

export default function EmployeeExitConfigurationPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadExitConfig } = usePermission();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notice-period-policy');

  React.useEffect(() => {
    if (!authLoading && !canReadExitConfig) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadExitConfig, router]);

  if (authLoading || !canReadExitConfig) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'notice-period-policy',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} /> Notice Period
        </span>
      ),
      children: <NoticePeriodPolicyPage />
    },
    {
      key: 'approval-workflow',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} /> Approval Workflow
        </span>
      ),
      children: <ApprovalWorkflowPage />
    },
    {
      key: 'exit-type',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} /> Exit Types
        </span>
      ),
      children: <ExitTypePage />
    },
    {
      key: 'reason-for-exit',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} /> Exit Reasons
        </span>
      ),
      children: <ReasonForExitPage />
    },
    {
      key: 'checklist-config',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} /> Department Checklist
        </span>
      ),
      children: <ChecklistConfigPage />
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0, color: 'var(--text-slate-900)' }}>Configuration</Title>
        <Text style={{ color: 'var(--text-slate-500)' }}>Manage policies, workflows, and exit codes</Text>
      </div>

      <Card bordered={false} className="shadow-sm" style={{ borderRadius: '12px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          animated={true}
          size="large"
          tabBarStyle={{ marginBottom: '24px' }}
        />
      </Card>
    </div>
  );
}
