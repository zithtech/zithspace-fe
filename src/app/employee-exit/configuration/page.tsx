'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Typography, Tabs } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import NoticePeriodPolicyPage from '@/components/employee-exit/configuration/NoticePeriodPolicyPage';
import ApprovalWorkflowPage from '@/components/employee-exit/configuration/ApprovalWorkflowPage';
import ExitTypePage from '@/components/employee-exit/configuration/ExitTypePage';
import ReasonForExitPage from '@/components/employee-exit/configuration/ReasonForExitPage';

const { Title, Paragraph } = Typography;

export default function EmployeeExitConfigurationPage() {
  const [activeTab, setActiveTab] = useState('notice-period-policy');

  return (
    <MainLayout>
      <div style={{ padding: '24px', background: '#fff', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <SettingOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            Configuration
          </Title>
          <Paragraph style={{ marginBottom: 0, fontSize: 15, color: '#595959' }}>
            Manage employee exit configurations including notice period policies,
            approval workflows, exit types, and exit reasons.
          </Paragraph>
        </div>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          size="middle" 
          tabBarGutter={24}
          tabBarStyle={{ marginBottom: 24 }}
        >
          <Tabs.TabPane 
            tab={<span style={{ fontWeight: 600 }}>Notice Period Policy</span>} 
            key="notice-period-policy"
          >
            <NoticePeriodPolicyPage />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={<span style={{ fontWeight: 600 }}>Approval Workflow</span>} 
            key="approval-workflow"
          >
            <ApprovalWorkflowPage />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={<span style={{ fontWeight: 600 }}>Exit Type</span>} 
            key="exit-type"
          >
            <ExitTypePage />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={<span style={{ fontWeight: 600 }}>Reason for Exit</span>} 
            key="reason-for-exit" 
          >
            <ReasonForExitPage />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </MainLayout>
  );
}
