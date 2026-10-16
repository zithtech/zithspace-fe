'use client';

import React, { useState, useMemo } from 'react';
import { Tabs } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Clock,
  ShieldCheck,
  FileText,
  MessageSquare,
  Search,
  Plus,
  X,
  LayoutGrid,
  Table as TableIcon,
  Settings2,
  ClipboardCheck,
  LucideIcon
} from 'lucide-react';
import ZukvoLoader from "@/components/common/ZukvoLoader";
import NoticePeriodPolicyPage from '@/components/employee-exit/configuration/NoticePeriodPolicyPage';
import ApprovalWorkflowPage from '@/components/employee-exit/configuration/ApprovalWorkflowPage';
import ExitTypePage from '@/components/employee-exit/configuration/ExitTypePage';
import ReasonForExitPage from '@/components/employee-exit/configuration/ReasonForExitPage';
import ChecklistConfigPage from '@/components/employee-exit/configuration/ChecklistConfigPage';

interface TabConfig {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  addLabel: string | null;
  hasLayoutToggle: boolean;
}

const TABS: TabConfig[] = [
  {
    key: 'notice-period-policy',
    label: 'Notice Period',
    description: 'Notice duration policies, buyout calculations & eligibility rules',
    icon: Clock,
    addLabel: 'Add Policy',
    hasLayoutToggle: true,
  },
  {
    key: 'approval-workflow',
    label: 'Approval Workflow',
    description: 'Multi-stage approval hierarchies and approver assignments',
    icon: ShieldCheck,
    addLabel: 'Add Workflow',
    hasLayoutToggle: false,
  },
  {
    key: 'exit-type',
    label: 'Exit Types',
    description: 'Exit classifications (Resignation, Termination, Retirement)',
    icon: FileText,
    addLabel: 'Add Exit Type',
    hasLayoutToggle: true,
  },
  {
    key: 'reason-for-exit',
    label: 'Exit Reasons',
    description: 'Standardized offboarding reasons and analytics categories',
    icon: MessageSquare,
    addLabel: 'Add Exit Reason',
    hasLayoutToggle: true,
  },
  {
    key: 'checklist-config',
    label: 'Department Checklist',
    description: 'Clearance tasks and departmental requirements (IT, Admin, Finance, HR)',
    icon: ClipboardCheck,
    addLabel: null,
    hasLayoutToggle: false,
  },
];

export default function EmployeeExitConfigurationPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadExitConfig } = usePermission();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>('notice-period-policy');
  const [triggers, setTriggers] = useState<Record<string, number>>({});
  const [searchText, setSearchText] = useState('');
  const [layoutMode, setLayoutMode] = useState<'table' | 'card'>('table');

  React.useEffect(() => {
    if (!authLoading && !canReadExitConfig) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadExitConfig, router]);

  const currentTabConfig = useMemo(() => {
    return TABS.find(t => t.key === activeTab) || TABS[0];
  }, [activeTab]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchText('');
  };

  const triggerAdd = () => {
    setTriggers(prev => ({ ...prev, [activeTab]: (prev[activeTab] || 0) + 1 }));
  };

  if (authLoading || !canReadExitConfig) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <ZukvoLoader size="lg" message="Loading configuration..." />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'notice-period-policy',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Clock size={15} /> Notice Period
        </span>
      ),
      children: (
        <NoticePeriodPolicyPage
          searchText={searchText}
          createTrigger={triggers['notice-period-policy'] || 0}
          layoutMode={layoutMode}
        />
      )
    },
    {
      key: 'approval-workflow',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={15} /> Approval Workflow
        </span>
      ),
      children: (
        <ApprovalWorkflowPage
          searchText={searchText}
          createTrigger={triggers['approval-workflow'] || 0}
          layoutMode={layoutMode}
        />
      )
    },
    {
      key: 'exit-type',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <FileText size={15} /> Exit Types
        </span>
      ),
      children: (
        <ExitTypePage
          searchText={searchText}
          createTrigger={triggers['exit-type'] || 0}
          layoutMode={layoutMode}
        />
      )
    },
    {
      key: 'reason-for-exit',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={15} /> Exit Reasons
        </span>
      ),
      children: (
        <ReasonForExitPage
          searchText={searchText}
          createTrigger={triggers['reason-for-exit'] || 0}
          layoutMode={layoutMode}
        />
      )
    },
    {
      key: 'checklist-config',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <ClipboardCheck size={15} /> Department Checklist
        </span>
      ),
      children: <ChecklistConfigPage />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'var(--bg-blue-50, #eff6ff)',
            color: 'var(--premium-blue, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Settings2 size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-slate-900, #0f172a)', letterSpacing: '-0.01em' }}>
                {currentTabConfig.label}
              </h2>
              <span className="exit-topbar-meta">
                <span className="exit-pulse" />
                Configuration
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-slate-500, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentTabConfig.description}
            </span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Search Bar */}
          <div className="exit-search-bar" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 10px', height: 34, width: 220 }}>
            <Search size={14} style={{ color: 'var(--text-slate-400, #94a3b8)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={`Search ${currentTabConfig.label.toLowerCase()}...`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 12.5, width: '100%' }}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--text-slate-400)' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Table / Grid view toggle */}
          {currentTabConfig.hasLayoutToggle && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--bg-slate-100, #f1f5f9)',
              borderRadius: 6,
              padding: 2,
              gap: 2
            }}>
              <button
                type="button"
                title="Table view"
                onClick={() => setLayoutMode('table')}
                style={{
                  width: 30,
                  height: 30,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 5,
                  border: 'none',
                  background: layoutMode === 'table' ? 'var(--bg-pure-white, #ffffff)' : 'transparent',
                  color: layoutMode === 'table' ? '#2563eb' : 'var(--text-slate-500)',
                  boxShadow: layoutMode === 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <TableIcon size={14} />
              </button>
              <button
                type="button"
                title="Card grid view"
                onClick={() => setLayoutMode('card')}
                style={{
                  width: 30,
                  height: 30,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 5,
                  border: 'none',
                  background: layoutMode === 'card' ? 'var(--bg-pure-white, #ffffff)' : 'transparent',
                  color: layoutMode === 'card' ? '#2563eb' : 'var(--text-slate-500)',
                  boxShadow: layoutMode === 'card' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          )}

          {/* Add Configuration Button */}
          {currentTabConfig.addLabel && (
            <button
              type="button"
              onClick={triggerAdd}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 7,
                padding: '0 14px',
                height: 34,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(37, 99, 235, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(37, 99, 235, 0.25)';
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              {currentTabConfig.addLabel}
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs Navigation & Body ────────────────────────────── */}
      <div className="exit-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', padding: 0, overflow: 'hidden' }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          animated={{ inkBar: true, tabPane: false }}
          className="config-tabs"
        />
      </div>

    </div>
  );
}
