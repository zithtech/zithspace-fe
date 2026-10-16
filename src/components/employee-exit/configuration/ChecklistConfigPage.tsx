'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, notification, Tooltip, Tag } from 'antd';
import {
  Plus,
  Trash2,
  Monitor,
  Shield,
  CreditCard,
  Users,
  CheckCircle2,
  Sparkles,
  CornerDownLeft,
  ListChecks,
  LucideIcon
} from 'lucide-react';
import { EmployeeExitService } from '@/services/employeeExitService';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import NoData from '@/components/common/NoData';

interface DepartmentMeta {
  key: string;
  name: string;
  description: string;
  scope: string;
  icon: LucideIcon;
  color: string;
  bgTint: string;
  borderColor: string;
  activeShadow: string;
  defaultSuggestions: string[];
}

const DEPARTMENTS: DepartmentMeta[] = [
  {
    key: 'IT',
    name: 'IT Clearance',
    description: 'Hardware, system credentials, corporate emails & cloud accounts',
    scope: 'IT & Infrastructure',
    icon: Monitor,
    color: '#2563eb',
    bgTint: 'rgba(37, 99, 235, 0.08)',
    borderColor: '#93c5fd',
    activeShadow: '0 0 0 2px rgba(37, 99, 235, 0.25)',
    defaultSuggestions: [
      'Revoke GitHub, Jira & cloud console access',
      'Collect company laptop, charger & peripherals',
      'Archive Google Workspace / Microsoft 365 account',
      'Remove 2FA / SSO authentication tokens',
      'Revoke VPN and internal network permissions'
    ]
  },
  {
    key: 'ADMIN',
    name: 'Admin Clearance',
    description: 'Physical access cards, workspace keys, locker & parking passes',
    scope: 'Facilities & Administration',
    icon: Shield,
    color: '#8b5cf6',
    bgTint: 'rgba(139, 92, 246, 0.08)',
    borderColor: '#c4b5fd',
    activeShadow: '0 0 0 2px rgba(139, 92, 246, 0.25)',
    defaultSuggestions: [
      'Collect RFID employee ID card & building badge',
      'Surrender desk keys, file drawer keys & locker keys',
      'Deactivate vehicle parking permit',
      'Return company mobile SIM card or hardware tokens',
      'Inspect assigned workspace condition'
    ]
  },
  {
    key: 'FINANCE',
    name: 'Finance Clearance',
    description: 'Expense claim settlements, corporate cards, advances & tax dues',
    scope: 'Finance & Accounts',
    icon: CreditCard,
    color: '#10b981',
    bgTint: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#6ee7b7',
    activeShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
    defaultSuggestions: [
      'Settle pending employee expense claims',
      'Surrender and cancel corporate credit cards',
      'Clear outstanding salary advances or loans',
      'Reconcile petty cash balances',
      'Finalize tax deduction declarations & TDS calculation'
    ]
  },
  {
    key: 'HR',
    name: 'HR Clearance',
    description: 'Exit interview, NDA review, benefits offboarding & relieving docs',
    scope: 'Human Resources',
    icon: Users,
    color: '#f59e0b',
    bgTint: 'rgba(245, 158, 11, 0.08)',
    borderColor: '#fcd34d',
    activeShadow: '0 0 0 2px rgba(245, 158, 11, 0.25)',
    defaultSuggestions: [
      'Conduct formal exit interview',
      'Review and sign Non-Disclosure Agreement (NDA)',
      'Review medical insurance cessation & portability options',
      'Provide PF / Gratuity transfer or withdrawal instructions',
      'Generate Experience Certificate & Relieving Letter'
    ]
  }
];

export default function ChecklistConfigPage() {
  const [loading, setLoading] = useState(false);
  const [activeDeptKey, setActiveDeptKey] = useState<string>('IT');
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [dynamicChecklists, setDynamicChecklists] = useState<Record<string, any[]>>({
    IT: [],
    ADMIN: [],
    FINANCE: [],
    HR: []
  });
  const [newItemName, setNewItemName] = useState('');

  const fetchChecklistConfigs = useCallback(async () => {
    try {
      const data = await EmployeeExitService.getChecklistConfigs();
      const grouped: Record<string, any[]> = { IT: [], ADMIN: [], FINANCE: [], HR: [] };
      (data || []).forEach((item: any) => {
        if (!grouped[item.department]) {
          grouped[item.department] = [];
        }
        grouped[item.department].push(item);
      });
      setDynamicChecklists(grouped);
    } catch (error) {
      console.error("Failed to load configs", error);
    }
  }, []);

  useEffect(() => {
    fetchChecklistConfigs();
  }, [fetchChecklistConfigs]);

  const activeDept = DEPARTMENTS.find(d => d.key === activeDeptKey) || DEPARTMENTS[0];
  const activeTasks = dynamicChecklists[activeDeptKey] || [];

  const handleAddConfig = async (dept: string, taskName?: string) => {
    const textToAdd = (taskName || newItemName).trim();
    if (!textToAdd) return;
    try {
      setLoading(true);
      await EmployeeExitService.addChecklistConfig(dept, textToAdd);
      setNewItemName('');
      await fetchChecklistConfigs();
      notificationApi.success({ message: 'Clearance task added successfully' });
    } catch (e: any) {
      notificationApi.error({ message: 'Failed to add item', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      setLoading(true);
      await EmployeeExitService.deleteChecklistConfig(id);
      await fetchChecklistConfigs();
      notificationApi.success({ message: 'Clearance task removed' });
    } catch (e: any) {
      notificationApi.error({ message: 'Failed to delete item', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Filter unused suggestions for the active department
  const existingTaskNames = new Set(activeTasks.map(t => (t.itemName || '').toLowerCase().trim()));
  const availableSuggestions = activeDept.defaultSuggestions.filter(
    s => !existingTaskNames.has(s.toLowerCase().trim())
  );

  return (
    <>
      {notificationContextHolder}
      <div className="checklist-page-container">
        
        {/* ── 1. Department Cards Row ──────────────────────────── */}
        <div className="dept-cards-grid">
          {DEPARTMENTS.map(dept => {
            const Icon = dept.icon;
            const count = dynamicChecklists[dept.key]?.length || 0;
            const isSelected = dept.key === activeDeptKey;

            return (
              <div
                key={dept.key}
                role="button"
                tabIndex={0}
                className={`dept-card ${isSelected ? 'is-selected' : ''}`}
                style={{
                  ['--dept-color' as any]: dept.color,
                  ['--dept-bg' as any]: dept.bgTint,
                  ['--dept-border' as any]: dept.borderColor,
                }}
                onClick={() => {
                  setActiveDeptKey(dept.key);
                  setNewItemName('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveDeptKey(dept.key);
                    setNewItemName('');
                  }
                }}
              >
                <div className="dept-card-top">
                  <div className="dept-card-icon" style={{ background: dept.bgTint, color: dept.color }}>
                    <Icon size={18} />
                  </div>
                  <span className="dept-card-badge" style={{ color: dept.color, background: dept.bgTint }}>
                    {count} {count === 1 ? 'Task' : 'Tasks'}
                  </span>
                </div>
                <div className="dept-card-body">
                  <h4 className="dept-card-title">{dept.name}</h4>
                  <p className="dept-card-desc">{dept.description}</p>
                </div>
                <div className="dept-card-footer">
                  <span className="dept-card-scope">{dept.scope}</span>
                  {isSelected && <span className="dept-card-pill">Active</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 2. Department Tasks Workspace ─────────────────────── */}
        <div className="dept-workspace-card">
          
          {/* Workspace Header */}
          <div className="dept-workspace-header">
            <div className="dept-header-left">
              <div
                className="dept-header-avatar"
                style={{ background: activeDept.bgTint, color: activeDept.color }}
              >
                <activeDept.icon size={22} />
              </div>
              <div className="dept-header-info">
                <div className="dept-header-row">
                  <h3 className="dept-header-title">{activeDept.name} Requirements</h3>
                  <Tag
                    style={{
                      borderRadius: 12,
                      padding: '1px 8px',
                      fontWeight: 600,
                      fontSize: 11,
                      border: `1px solid ${activeDept.borderColor}`,
                      color: activeDept.color,
                      background: activeDept.bgTint
                    }}
                  >
                    {activeDept.scope}
                  </Tag>
                </div>
                <p className="dept-header-sub">
                  Mandatory items to be verified and signed off by the {activeDept.name} team before final exit clearance.
                </p>
              </div>
            </div>

            <div className="dept-header-meta">
              <div className="dept-meta-pill" style={{ color: activeDept.color, background: activeDept.bgTint }}>
                <ListChecks size={14} />
                <strong>{activeTasks.length}</strong> {activeTasks.length === 1 ? 'item configured' : 'items configured'}
              </div>
            </div>
          </div>

          {/* Quick-Add Task Bar */}
          <div className="dept-add-bar">
            <div className="dept-input-wrapper">
              <Plus size={16} className="dept-input-icon" style={{ color: activeDept.color }} />
              <input
                type="text"
                placeholder={`Add clearance task for ${activeDept.name}...`}
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddConfig(activeDept.key);
                }}
                className="dept-input-field"
                disabled={loading}
              />
              <kbd className="dept-kbd-hint">
                <span>Enter</span>
                <CornerDownLeft size={10} />
              </kbd>
            </div>

            <Button
              type="primary"
              icon={<Plus size={15} strokeWidth={2.5} />}
              onClick={() => handleAddConfig(activeDept.key)}
              loading={loading}
              disabled={!newItemName.trim()}
              style={{
                height: 42,
                borderRadius: 8,
                padding: '0 20px',
                background: activeDept.color,
                fontWeight: 600,
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: `0 2px 8px ${activeDept.bgTint}`
              }}
            >
              Add Task
            </Button>
          </div>

          {/* Quick Suggestion Chips */}
          {availableSuggestions.length > 0 && (
            <div className="dept-suggestions">
              <div className="dept-suggestions-label">
                <Sparkles size={13} style={{ color: activeDept.color }} />
                <span>Suggested standard tasks:</span>
              </div>
              <div className="dept-suggestions-list">
                {availableSuggestions.slice(0, 3).map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="dept-suggestion-chip"
                    onClick={() => handleAddConfig(activeDept.key, suggestion)}
                    disabled={loading}
                    title="Click to add this standard task"
                  >
                    <Plus size={11} />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks List Content */}
          <div className="dept-tasks-section">
            {activeTasks.length === 0 ? (
              <div className="dept-empty-box">
                <NoData
                  title={`No ${activeDept.name} Tasks Configured`}
                  description={`Add the first clearance item above. These will be automatically assigned to ${activeDept.name} during employee exit.`}
                  accent={activeDept.color}
                />
              </div>
            ) : (
              <div className="dept-tasks-list">
                {activeTasks.map((item, idx) => {
                  const itemNumber = (idx + 1).toString().padStart(2, '0');
                  return (
                    <div key={item.id} className="dept-task-row">
                      <div className="dept-task-order" style={{ color: activeDept.color, background: activeDept.bgTint }}>
                        {itemNumber}
                      </div>

                      <div className="dept-task-icon-circle">
                        <CheckCircle2 size={16} style={{ color: activeDept.color }} />
                      </div>

                      <div className="dept-task-content">
                        <span className="dept-task-name">{item.itemName}</span>
                        <div className="dept-task-meta">
                          <span className="dept-meta-tag">{activeDept.key} Clearance</span>
                          <span className="dept-meta-dot">•</span>
                          <span className="dept-meta-req">Required for sign-off</span>
                        </div>
                      </div>

                      <div className="dept-task-actions">
                        <ConfirmDialog
                          title="Remove clearance task?"
                          onConfirm={() => handleDeleteConfig(item.id)}
                          confirmText="Remove"
                          placement="topRight"
                        >
                          <Tooltip title="Remove task">
                            <button
                              type="button"
                              className="dept-task-delete-btn"
                              disabled={loading}
                              aria-label="Delete task"
                            >
                              <Trash2 size={15} />
                            </button>
                          </Tooltip>
                        </ConfirmDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      <style jsx>{`
        .checklist-page-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 20px 24px 40px 24px;
          gap: 20px;
          background: transparent;
          overflow-y: auto;
          min-height: 0;
          height: 100%;
        }
        .checklist-page-container::-webkit-scrollbar {
          width: 6px;
        }
        .checklist-page-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .checklist-page-container::-webkit-scrollbar-thumb {
          background: var(--border-slate-300, #cbd5e1);
          border-radius: 4px;
        }
        .checklist-page-container::-webkit-scrollbar-thumb:hover {
          background: var(--text-slate-400, #94a3b8);
        }

        /* ── Department Selector Cards ── */
        .dept-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 1024px) {
          .dept-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .dept-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .dept-card {
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 12px;
          background: var(--bg-pure-white, #ffffff);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .dept-card:hover {
          border-color: var(--dept-border);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
        }
        .dept-card.is-selected {
          border-color: var(--dept-color);
          background: var(--bg-pure-white, #ffffff);
          box-shadow: 0 0 0 2px var(--dept-border), 0 8px 20px rgba(15, 23, 42, 0.08);
        }

        [data-theme="dark"] .dept-card {
          background: #111720 !important;
          border-color: #1f2937 !important;
        }
        [data-theme="dark"] .dept-card.is-selected {
          border-color: var(--dept-color) !important;
          box-shadow: 0 0 0 2px var(--dept-color) !important;
        }

        .dept-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dept-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dept-card-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
          letter-spacing: 0.02em;
        }

        .dept-card-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dept-card-title {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--text-slate-900, #0f172a);
          margin: 0;
          letter-spacing: -0.01em;
        }
        [data-theme="dark"] .dept-card-title {
          color: #f1f5f9;
        }
        .dept-card-desc {
          font-size: 12px;
          color: var(--text-slate-500, #64748b);
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dept-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid var(--border-slate-100, #f1f5f9);
          margin-top: auto;
        }
        [data-theme="dark"] .dept-card-footer {
          border-top-color: #1f2937;
        }
        .dept-card-scope {
          font-size: 11px;
          color: var(--text-slate-400, #94a3b8);
          font-weight: 500;
        }
        .dept-card-pill {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--dept-color);
        }

        /* ── Workspace Card ── */
        .dept-workspace-card {
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 14px;
          background: var(--bg-pure-white, #ffffff);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        [data-theme="dark"] .dept-workspace-card {
          background: #111720 !important;
          border-color: #1f2937 !important;
        }

        .dept-workspace-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
          background: var(--bg-slate-50, #f8fafc);
          gap: 16px;
        }
        [data-theme="dark"] .dept-workspace-header {
          background: #0d121a !important;
          border-bottom-color: #1f2937 !important;
        }

        .dept-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .dept-header-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dept-header-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dept-header-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dept-header-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-slate-900, #0f172a);
          margin: 0;
          letter-spacing: -0.01em;
        }
        [data-theme="dark"] .dept-header-title {
          color: #f1f5f9;
        }
        .dept-header-sub {
          font-size: 12.5px;
          color: var(--text-slate-500, #64748b);
          margin: 0;
        }

        .dept-meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        /* ── Add Bar ── */
        .dept-add-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
          background: var(--bg-pure-white, #ffffff);
        }
        [data-theme="dark"] .dept-add-bar {
          background: #111720 !important;
          border-bottom-color: #1f2937 !important;
        }

        .dept-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          position: relative;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 8px;
          height: 42px;
          padding: 0 14px;
          gap: 10px;
          transition: all 0.2s ease;
        }
        .dept-input-wrapper:focus-within {
          border-color: #3b82f6;
          background: var(--bg-pure-white, #ffffff);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }
        [data-theme="dark"] .dept-input-wrapper {
          background: #0d121a !important;
          border-color: #1f2937 !important;
        }
        [data-theme="dark"] .dept-input-wrapper:focus-within {
          background: #111720 !important;
          border-color: #3b82f6 !important;
        }

        .dept-input-icon {
          flex-shrink: 0;
        }
        .dept-input-field {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 13.5px;
          color: var(--text-slate-900, #0f172a);
        }
        [data-theme="dark"] .dept-input-field {
          color: #f1f5f9;
        }
        .dept-input-field::placeholder {
          color: var(--text-slate-400, #94a3b8);
        }

        .dept-kbd-hint {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          color: var(--text-slate-400, #94a3b8);
          font-size: 10.5px;
          font-family: inherit;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
        }
        [data-theme="dark"] .dept-kbd-hint {
          background: #1a2230;
          border-color: #2e3a4e;
        }

        /* ── Suggestions ── */
        .dept-suggestions {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          background: var(--bg-slate-50, #f8fafc);
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
          overflow-x: auto;
        }
        [data-theme="dark"] .dept-suggestions {
          background: #0d121a !important;
          border-bottom-color: #1f2937 !important;
        }

        .dept-suggestions-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-500, #64748b);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .dept-suggestions-list {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
        }
        .dept-suggestion-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          color: var(--text-slate-600, #475569);
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .dept-suggestion-chip:hover {
          border-color: #3b82f6;
          color: #2563eb;
          background: #eff6ff;
          transform: translateY(-1px);
        }
        [data-theme="dark"] .dept-suggestion-chip {
          background: #111720 !important;
          border-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        [data-theme="dark"] .dept-suggestion-chip:hover {
          background: rgba(37, 99, 235, 0.15) !important;
          border-color: #2563eb !important;
          color: #60a5fa !important;
        }

        /* ── Tasks List ── */
        .dept-tasks-section {
          padding: 16px 24px 24px;
          flex: 1;
          min-height: 0;
          max-height: 440px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .dept-tasks-section::-webkit-scrollbar {
          width: 6px;
        }
        .dept-tasks-section::-webkit-scrollbar-track {
          background: transparent;
        }
        .dept-tasks-section::-webkit-scrollbar-thumb {
          background: var(--border-slate-300, #cbd5e1);
          border-radius: 4px;
        }
        .dept-tasks-section::-webkit-scrollbar-thumb:hover {
          background: var(--text-slate-400, #94a3b8);
        }
        [data-theme="dark"] .dept-tasks-section::-webkit-scrollbar-thumb {
          background: #2e3a4e;
        }
        .dept-empty-box {
          padding: 40px 0;
        }

        .dept-tasks-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dept-task-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background: var(--bg-pure-white, #ffffff);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 9px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }
        .dept-task-row:hover {
          border-color: #93c5fd;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
          transform: translateY(-1px);
        }
        [data-theme="dark"] .dept-task-row {
          background: #0d121a !important;
          border-color: #1f2937 !important;
        }
        [data-theme="dark"] .dept-task-row:hover {
          border-color: #2563eb !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3) !important;
        }

        .dept-task-order {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          letter-spacing: -0.02em;
        }
        .dept-task-icon-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dept-task-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .dept-task-name {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-slate-800, #1e293b);
          line-height: 1.4;
        }
        [data-theme="dark"] .dept-task-name {
          color: #f1f5f9;
        }

        .dept-task-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-slate-400, #94a3b8);
        }
        .dept-meta-tag {
          font-weight: 600;
          color: var(--text-slate-500, #64748b);
        }
        .dept-meta-dot {
          color: var(--border-slate-200, #cbd5e1);
        }
        .dept-meta-req {
          color: var(--text-slate-400, #94a3b8);
        }

        .dept-task-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .dept-task-delete-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--text-slate-400, #94a3b8);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .dept-task-delete-btn:hover {
          color: #ef4444;
          background: #fee2e2;
        }
        [data-theme="dark"] .dept-task-delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }
      `}</style>
    </>
  );
}
