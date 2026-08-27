'use client';

import NoData from "@/components/common/NoData";
import React, { useCallback, useEffect, useState } from 'react';
import { App,
  Button,
  Drawer,
  Empty,
  Input,
  InputNumber,
  Skeleton,
  Switch,
  Table,
  Tooltip,
} from 'antd';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { ColumnsType } from 'antd/es/table';
import { GripVertical, Plus, Settings, Trash2, Bot } from 'lucide-react';

import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { RBACService } from '@/services/rbacService';
import OpeningV2Service, {
  type ApprovalWorkflowListItem,
  type ApproverType,
  type PostingSettings,
  type WorkflowStepInput,
} from '@/services/openingV2Service';
import {
  APPROVER_TYPE_LABELS,
  OpeningStyles,
  PALETTE,
  PanelHeader,
  TINT,
} from './ui';
import { useReferenceData } from './useReferenceData';

// Phase 2 + Phase 4 configuration: the approval chains an opening is submitted
// into, and how long the internal posting window runs.

export default function SettingsPanel() {
  const { message } = App.useApp();

  const reference = useReferenceData();

  const [workflows, setWorkflows] = useState<ApprovalWorkflowListItem[]>([]);
  const [posting, setPosting] = useState<PostingSettings | null>(null);
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPosting, setSavingPosting] = useState(false);
  const [sweeping, setSweeping] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [steps, setSteps] = useState<WorkflowStepInput[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wf, ps] = await Promise.all([
        OpeningV2Service.listWorkflows(true),
        OpeningV2Service.getPostingSettings(),
      ]);
      setWorkflows(wf);
      setPosting(ps);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Roles power the "anyone with the HR role" style of approval step.
  useEffect(() => {
    (async () => {
      try {
        const list = await RBACService.listRoles();
        setRoles((list ?? []).map((r: any) => ({ value: r.id, label: r.name })));
      } catch {
        // Role steps simply cannot be configured without the list; the rest of
        // the editor still works.
        setRoles([]);
      }
    })();
  }, []);

  const savePostingSettings = async (patch: Partial<PostingSettings>) => {
    setSavingPosting(true);
    try {
      const next = await OpeningV2Service.updatePostingSettings({
        internalPostingDays: patch.internalPostingDays,
        autoMoveToExternal: patch.autoMoveToExternal,
      });
      setPosting(next);
      message.success('Posting settings saved');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not save posting settings');
    } finally {
      setSavingPosting(false);
    }
  };

  // The cron runs hourly; this exists so the behaviour can be exercised (and a
  // stuck window unstuck) without waiting for the next tick.
  const runAutoMove = async () => {
    setSweeping(true);
    try {
      const result = await OpeningV2Service.runAutoMove();
      message.success(
        result.moved
          ? `Moved ${result.moved} of ${result.scanned} due posting(s) to external`
          : result.scanned
            ? `${result.scanned} due posting(s) scanned, none moved`
            : 'Nothing was due'
      );
      if (result.failed?.length) {
        message.error(`${result.failed.length} opening(s) failed — check the server logs`);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not run the sweep');
    } finally {
      setSweeping(false);
    }
  };

  const openEditor = async (id?: string) => {
    if (!id) {
      setEditingId(null);
      setName('');
      setDescription('');
      setIsDefault(workflows.length === 0);
      // The spec's chain, pre-filled — Finance optional, as described.
      setSteps([
        { stepName: 'Hiring Manager Approval', approverType: 'hiring_manager', isOptional: false },
        { stepName: 'HR Approval', approverType: 'role', isOptional: false },
        { stepName: 'Finance Approval', approverType: 'role', isOptional: true },
      ]);
      setEditorOpen(true);
      return;
    }

    try {
      const wf = await OpeningV2Service.getWorkflow(id);
      setEditingId(id);
      setName(wf.name);
      setDescription(wf.description ?? '');
      setIsDefault(wf.isDefault);
      setSteps(
        wf.steps.map((s) => ({
          stepName: s.stepName,
          approverType: s.approverType,
          roleId: s.roleId,
          specificUserId: s.specificUserId,
          fallbackUserId: s.fallbackUserId,
          isOptional: s.isOptional,
          slaHours: s.slaHours,
        }))
      );
      setEditorOpen(true);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not load the workflow');
    }
  };

  const saveWorkflow = async () => {
    if (!name.trim()) {
      message.error('Give the workflow a name');
      return;
    }
    if (steps.length === 0) {
      message.error('A workflow needs at least one step');
      return;
    }
    // The backend enforces these too; catching them here keeps the round trip.
    for (const s of steps) {
      if (!s.stepName?.trim()) {
        message.error('Every step needs a name');
        return;
      }
      if (s.approverType === 'role' && !s.roleId) {
        message.error(`“${s.stepName}” is a role step — pick the role`);
        return;
      }
      if (s.approverType === 'specific_user' && !s.specificUserId) {
        message.error(`“${s.stepName}” needs a specific person`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        isDefault,
        steps,
      };
      if (editingId) await OpeningV2Service.updateWorkflow(editingId, payload);
      else await OpeningV2Service.createWorkflow(payload);
      message.success(editingId ? 'Workflow updated' : 'Workflow created');
      setEditorOpen(false);
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not save the workflow');
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      await OpeningV2Service.deleteWorkflow(id);
      message.success('Workflow deleted');
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not delete the workflow');
    }
  };

  const columns: ColumnsType<ApprovalWorkflowListItem> = [
    {
      title: 'Workflow',
      render: (_: any, r) => (
        <div className="omp-title-cell">
          <span className="omp-title-main">
            {r.name}
            {r.isDefault && <span className="omp-default-flag">Default</span>}
          </span>
          <span className="omp-title-sub">{r.description ?? '—'}</span>
        </div>
      ),
    },
    { title: 'Steps', dataIndex: 'stepCount', width: 80, align: 'center' },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      align: 'center',
      render: (v: boolean) => (v ? 'Yes' : 'No'),
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      render: (_: any, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="small" onClick={() => openEditor(r.id)}>
            Edit
          </Button>
          <ConfirmDialog
            tone="danger"
            icon={<Trash2 size={18} />}
            title="Delete this workflow?"
            description="Openings mid-approval keep their own copy of the chain."
            confirmText="Delete"
            onConfirm={() => deleteWorkflow(r.id)}
          >
            <Button size="small" type="text" danger icon={<Trash2 size={13} />} />
          </ConfirmDialog>
        </div>
      ),
    },
  ];

  const updateStep = (i: number, patch: Partial<WorkflowStepInput>) =>
    setSteps((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const move = (i: number, delta: number) =>
    setSteps((prev) => {
      const next = [...prev];
      const target = i + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });

  return (
    <div className="omp">
      <OpeningStyles />

      <PanelHeader
        icon={<Settings size={17} />}
        color={PALETTE.ash}
        tint={TINT.ash}
        title="Settings"
        subtitle="Approval chains and posting windows"
      />

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <div className="omp-section">
            <div className="omp-section-head">
              <div>
                <div className="omp-section-title">Posting lifecycle</div>
                <div className="omp-section-sub">
                  How long an opening stays internal before it moves to external
                </div>
              </div>
            </div>

            <div className="omp-setting-row">
              <div>
                <div className="omp-setting-label">Internal posting window</div>
                <div className="omp-setting-hint">
                  Days an opening is visible only to employees. The spec default is 15.
                </div>
              </div>
              <InputNumber
                min={1}
                max={365}
                value={posting?.internalPostingDays}
                disabled={savingPosting}
                onChange={(v) => v && savePostingSettings({ internalPostingDays: v })}
                addonAfter="days"
                style={{ width: 140 }}
              />
            </div>

            <div className="omp-setting-row">
              <div>
                <div className="omp-setting-label">
                  Auto-move to external <Bot size={13} style={{ color: PALETTE.lightGray }} />
                </div>
                <div className="omp-setting-hint">
                  When the window elapses, publish externally automatically. A scheduled job runs
                  hourly; individual openings can opt out when posted.
                </div>
              </div>
              <Switch
                checked={posting?.autoMoveToExternal}
                loading={savingPosting}
                onChange={(v) => savePostingSettings({ autoMoveToExternal: v })}
              />
            </div>

            <div className="omp-setting-row">
              <div>
                <div className="omp-setting-label">Run the auto-move now</div>
                <div className="omp-setting-hint">
                  Moves every internal posting whose window has already elapsed. Safe to run any
                  time — it is idempotent.
                </div>
              </div>
              <Button loading={sweeping} onClick={runAutoMove}>
                Run sweep
              </Button>
            </div>
          </div>

          <div className="omp-section">
            <div className="omp-section-head">
              <div>
                <div className="omp-section-title">Approval workflows</div>
                <div className="omp-section-sub">
                  The chain an opening enters when submitted. Without one, submission falls back to
                  a single hiring-manager step.
                </div>
              </div>
              <Button type="primary" icon={<Plus size={14} />} onClick={() => openEditor()}>
                New workflow
              </Button>
            </div>

            <Table<ApprovalWorkflowListItem>
              rowKey="id"
              size="small"
              columns={columns}
              dataSource={workflows}
              pagination={false}
              className="omp-inner-table"
              locale={{
                emptyText: (
                  <div className="omp-empty">
                    <NoData description={
                                                  <>
                                                    <div className="omp-empty-title">No workflows configured</div>
                                                    <div className="omp-empty-sub">
                                                      Create one to get Hiring Manager → HR → Finance approvals.
                                                    </div>
                                                  </>
                                                } />
                  </div>
                ),
              }}
            />
          </div>
        </>
      )}

      <Drawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        width={720}
        title={editingId ? 'Edit approval workflow' : 'New approval workflow'}
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={saveWorkflow}>
              Save
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="omp-field-label">Name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Standard Hiring Approval" />
          </div>
          <div>
            <div className="omp-field-label">Description</div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="HM → HR → Finance"
            />
          </div>
          <label className="omp-inline-check">
            <Switch size="small" checked={isDefault} onChange={setIsDefault} />
            <span>Use this workflow by default when an opening is submitted</span>
          </label>

          <div className="omp-field-label" style={{ marginTop: 8 }}>
            Steps — order is the approval order
          </div>

          {steps.map((s, i) => (
            <div className="omp-step-editor" key={i}>
              <div className="omp-step-editor-head">
                <span className="omp-step-editor-order">
                  <GripVertical size={13} /> {i + 1}
                </span>
                <Input
                  value={s.stepName}
                  onChange={(e) => updateStep(i, { stepName: e.target.value })}
                  placeholder="Step name"
                  style={{ flex: 1 }}
                />
                <Tooltip title="Move up">
                  <Button size="small" disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </Button>
                </Tooltip>
                <Tooltip title="Move down">
                  <Button size="small" disabled={i === steps.length - 1} onClick={() => move(i, 1)}>
                    ↓
                  </Button>
                </Tooltip>
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<Trash2 size={13} />}
                  onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
                />
              </div>

              <div className="omp-step-editor-body">
                <SearchableDropdown
                  value={s.approverType}
                  onChange={(v: any) =>
                    updateStep(i, {
                      approverType: v as ApproverType,
                      roleId: null,
                      specificUserId: null,
                    })
                  }
                  options={Object.entries(APPROVER_TYPE_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  hideAvatar
                  allowClear={false}
                  width={240}
                  style={{ width: 190 }}
                />

                {s.approverType === 'role' && (
                  <SearchableDropdown
                    value={s.roleId ?? null}
                    onChange={(v: any) => updateStep(i, { roleId: v })}
                    options={roles}
                    placeholder="Pick the role"
                    itemNoun="roles"
                    style={{ flex: 1 }}
                  />
                )}
                {s.approverType === 'specific_user' && (
                  <SearchableDropdown
                    value={s.specificUserId ?? null}
                    onChange={(v: any) => updateStep(i, { specificUserId: v })}
                    options={reference.people}
                    loading={reference.loading}
                    placeholder="Pick the approver"
                    itemNoun="people"
                    style={{ flex: 1 }}
                  />
                )}

                <SearchableDropdown
                  value={s.fallbackUserId ?? null}
                  onChange={(v: any) => updateStep(i, { fallbackUserId: v })}
                  options={reference.people}
                  loading={reference.loading}
                  placeholder="Fallback approver (optional)"
                  itemNoun="people"
                  style={{ flex: 1 }}
                />

                <label className="omp-inline-check">
                  <Switch
                    size="small"
                    checked={!!s.isOptional}
                    onChange={(v) => updateStep(i, { isOptional: v })}
                  />
                  <span>Optional</span>
                </label>
              </div>
            </div>
          ))}

          <Button
            type="dashed"
            icon={<Plus size={14} />}
            onClick={() =>
              setSteps((prev) => [
                ...prev,
                { stepName: '', approverType: 'role', isOptional: false },
              ])
            }
          >
            Add step
          </Button>
        </div>
      </Drawer>

      <style jsx global>{`
        .omp-default-flag {
          margin-left: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: ${PALETTE.blue}; background: ${TINT.blue};
          border-radius: 4px; padding: 1px 6px;
        }
        .omp-setting-row {
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
          padding: 12px 0; border-bottom: 1px solid var(--border-slate-100);
        }
        .omp-setting-row:last-child { border-bottom: none; }
        .omp-setting-label {
          font-size: 12.5px; font-weight: 700; color: var(--text-slate-900);
          display: flex; align-items: center; gap: 6px;
        }
        .omp-setting-hint { font-size: 11.5px; color: var(--text-slate-500); margin-top: 2px; max-width: 520px; }
        .omp-inline-check { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-slate-600); }
        .omp-step-editor {
          border: 1px solid var(--border-slate-200); border-radius: 8px; padding: 10px 12px;
          background: var(--bg-pure-white);
        }
        .omp-step-editor-head { display: flex; align-items: center; gap: 8px; }
        .omp-step-editor-order {
          display: inline-flex; align-items: center; gap: 2px; font-size: 11px; font-weight: 700;
          color: var(--text-slate-400); width: 34px;
        }
        .omp-step-editor-body { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
      `}</style>
    </div>
  );
}
