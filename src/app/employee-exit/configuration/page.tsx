'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState } from 'react';
import { Typography, Tabs, Card, Input, Button, Dropdown } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Clock,
  ShieldCheck,
  FileText,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';
import NoticePeriodPolicyPage from '@/components/employee-exit/configuration/NoticePeriodPolicyPage';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import ApprovalWorkflowPage from '@/components/employee-exit/configuration/ApprovalWorkflowPage';
import ExitTypePage from '@/components/employee-exit/configuration/ExitTypePage';
import ReasonForExitPage from '@/components/employee-exit/configuration/ReasonForExitPage';
import ChecklistConfigPage from '@/components/employee-exit/configuration/ChecklistConfigPage';
import { GradeService, GradeAPIResponse } from '@/services/gradeService';
import { PositionService, Position } from '@/services/positionService';

const { Title, Text } = Typography;

const tabTitles: Record<string, string> = {
  'notice-period-policy': 'Notice Period',
  'approval-workflow': 'Approval Workflow',
  'exit-type': 'Exit Types',
  'reason-for-exit': 'Exit Reasons',
  'checklist-config': 'Department Checklist'
};

export default function EmployeeExitConfigurationPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadExitConfig } = usePermission();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notice-period-policy');
  const [triggers, setTriggers] = useState<Record<string, number>>({});
  const [searchText, setSearchText] = useState('');
  
  const [filterPolicy, setFilterPolicy] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string | null>(null);

  const [grades, setGrades] = useState<GradeAPIResponse[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  React.useEffect(() => {
    GradeService.getAllGrades().then(res => setGrades(res || [])).catch(() => {});
    PositionService.getAll().then(res => setPositions(res || [])).catch(() => {});
  }, []);

  const roleOptions = React.useMemo(() => {
    if (filterLevel === 'grades') {
      return grades.map(g => ({ label: (g as any).gradeName || (g as any).name || g.id, value: g.id }));
    }
    if (filterLevel === 'positions') {
      return positions.map(p => ({ label: p.title || (p as any).name || p.id, value: p.id }));
    }
    return [];
  }, [filterLevel, grades, positions]);

  React.useEffect(() => {
    if (!authLoading && !canReadExitConfig) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadExitConfig, router]);

  if (authLoading || !canReadExitConfig) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <ZukvoLoader size="lg" message="Loading..." />
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
      children: <NoticePeriodPolicyPage createTrigger={triggers['notice-period-policy'] || 0} />
    },
    {
      key: 'approval-workflow',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} /> Approval Workflow
        </span>
      ),
      children: <ApprovalWorkflowPage createTrigger={triggers['approval-workflow'] || 0} />
    },
    {
      key: 'exit-type',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} /> Exit Types
        </span>
      ),
      children: <ExitTypePage createTrigger={triggers['exit-type'] || 0} />
    },
    {
      key: 'reason-for-exit',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} /> Exit Reasons
        </span>
      ),
      children: <ReasonForExitPage createTrigger={triggers['reason-for-exit'] || 0} />
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, overflow: 'hidden' }}>
      <div className="exit-page-header" style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <strong style={{ fontSize: 16, color: 'var(--text-slate-900)', whiteSpace: 'nowrap', marginRight: 8 }}>
            {tabTitles[activeTab] || 'Configuration'}
          </strong>
          <Input 
            prefix={<Search size={16} style={{ color: 'var(--text-slate-400)' }} />}
            placeholder="Search..."
            style={{ width: 240, borderRadius: 6, height: 36 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          {activeTab === 'notice-period-policy' && (
            <>
              <SearchableDropdown
                placeholder="Applicable Level"
                value={filterLevel}
                onChange={(val) => {
                  setFilterLevel(val);
                  setFilterRole(null);
                }}
                options={[
                  { label: 'Positions', value: 'positions' },
                  { label: 'Grades', value: 'grades' }
                ]}
              />
              <SearchableDropdown
                placeholder="Role"
                value={filterRole}
                onChange={setFilterRole}
                options={roleOptions}
                disabled={!filterLevel}
              />
              <SearchableDropdown
                placeholder="Status"
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' }
                ]}
              />
            </>
          )}
          
          {(activeTab === 'approval-workflow' || activeTab === 'exit-type' || activeTab === 'reason-for-exit') && (
            <SearchableDropdown
              placeholder="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' }
              ]}
            />
          )}
        </div>
        
        {activeTab !== 'checklist-config' && (
          <button 
            type="button" 
            onClick={() => setTriggers(prev => ({ ...prev, [activeTab]: (prev[activeTab] || 0) + 1 }))}
            style={{ 
              background: 'var(--premium-blue)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6, 
              padding: '8px 16px', 
              fontSize: 13, 
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Configuration
          </button>
        )}
      </div>

      <div className="exit-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            animated={true}
            size="large"
            className="config-tabs"
            tabBarStyle={{ margin: '0 0 16px 0', padding: 0 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .config-tabs .ant-tabs-content-holder {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .config-tabs .ant-tabs-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .config-tabs .ant-tabs-tabpane-active {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}} />
    </div>
  );
}
