'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Typography, Tabs, Space } from 'antd';
import { 
  Settings2, 
  Clock, 
  ShieldCheck, 
  FileText, 
  MessageSquare,
} from 'lucide-react';
import NoticePeriodPolicyPage from '@/components/employee-exit/configuration/NoticePeriodPolicyPage';
import ApprovalWorkflowPage from '@/components/employee-exit/configuration/ApprovalWorkflowPage';
import ExitTypePage from '@/components/employee-exit/configuration/ExitTypePage';
import ReasonForExitPage from '@/components/employee-exit/configuration/ReasonForExitPage';

const { Title, Text, Paragraph } = Typography;

export default function EmployeeExitConfigurationPage() {
  const [activeTab, setActiveTab] = useState('notice-period-policy');

  return (
    <MainLayout>
      <div style={{ 
        margin: "0 -24px", 
        padding: "24px 32px", 
        background: "#ffffff", 
        minHeight: "calc(100vh - 64px)" 
      }}>
        {/* Header Section */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Space size={12} align="center">
              <div style={{ 
                background: "#eff6ff", 
                padding: 10, 
                borderRadius: 12, 
                color: "#2563eb",
                display: "flex"
              }}>
                <Settings2 size={24} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Exit Configuration</Title>
                <Text style={{ color: "#64748b", fontSize: 15 }}>Configure policies, workflows, and taxonomies for employee offboarding.</Text>
              </div>
            </Space>
          </div>
        </div>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          size="middle" 
          tabBarGutter={32}
          tabBarStyle={{ marginBottom: 24, borderBottom: "1px solid #f1f5f9" }}
        >
          <Tabs.TabPane 
            tab={
              <Space size={8}>
                <Clock size={16} />
                <span style={{ fontWeight: 600 }}>Notice Period</span>
              </Space>
            } 
            key="notice-period-policy"
          >
            <NoticePeriodPolicyPage />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={
              <Space size={8}>
                <ShieldCheck size={16} />
                <span style={{ fontWeight: 600 }}>Approval Workflow</span>
              </Space>
            } 
            key="approval-workflow"
          >
            <ApprovalWorkflowPage />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={
              <Space size={8}>
                <FileText size={16} />
                <span style={{ fontWeight: 600 }}>Exit Type</span>
              </Space>
            } 
            key="exit-type"
          >
            <ExitTypePage />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={
              <Space size={8}>
                <MessageSquare size={16} />
                <span style={{ fontWeight: 600 }}>Exit Reason</span>
              </Space>
            } 
            key="reason-for-exit" 
          >
            <ReasonForExitPage />
          </Tabs.TabPane>
        </Tabs>

        <style dangerouslySetInnerHTML={{ __html: `
          .ant-tabs-nav::before {
            border-bottom: none !important;
          }
          .ant-tabs-tab {
            padding: 12px 0 !important;
            transition: all 0.2s ease !important;
          }
          .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #2563eb !important;
          }
          .ant-tabs-ink-bar {
            background: #2563eb !important;
            height: 3px !important;
            border-radius: 3px 3px 0 0;
          }
        `}} />
      </div>
    </MainLayout>
  );
}
