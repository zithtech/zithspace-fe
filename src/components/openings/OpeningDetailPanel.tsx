'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Dropdown, Modal, Skeleton, Tabs, Tooltip, Input } from 'antd';
import {
  Archive,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Globe,
  Lock,
  PauseCircle,
  PlayCircle,
  RotateCw,
  Send,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { usePermission } from '@/hooks/usePermission';
import OpeningV2Service, {
  OpeningApprovalState,
  OpeningDetail,
  OpeningStatusState,
} from '@/services/openingV2Service';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import {
  OpeningStyles,
  PALETTE,
  PriorityChip,
  STATUS_META,
  StatusChip,
  TINT,
  fmtDate,
} from './ui';
import OpeningFormDrawer from './OpeningFormDrawer';
import CloseOpeningModal from './CloseOpeningModal';
import PostInternalModal from './PostInternalModal';
import OverviewTab from './tabs/OverviewTab';
import ApprovalsTab from './tabs/ApprovalsTab';
import PostingsTab from './tabs/PostingsTab';
import CandidatesTab from './tabs/CandidatesTab';
import ReferralsTab from './tabs/ReferralsTab';
import TimelineTab from './tabs/TimelineTab';
import { RoundsTab } from './tabs/RoundsTab';

// The lifecycle cockpit for one opening. The action bar is derived from server
// state, never from a local guess: `allowedTransitions` comes from the Phase 3
// state machine and `currentStep` from the Phase 2 approval snapshot, so the
// buttons on screen are exactly the moves the backend will accept.

export default function OpeningDetailPanel({ openingId }: { openingId: string }) {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  const [opening, setOpening] = useState<OpeningDetail | null>(null);
  const [statusState, setStatusState] = useState<OpeningStatusState | null>(null);
  const [approvals, setApprovals] = useState<OpeningApprovalState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [postInternalOpen, setPostInternalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteValue, setNoteValue] = useState('');
  const [noteModalConfig, setNoteModalConfig] = useState<{
    title: string;
    placeholder: string;
    required: boolean;
    action: (note: string) => Promise<unknown>;
    successMessage: string;
  } | null>(null);
  const [tab, setTab] = useState('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, s, a] = await Promise.all([
        OpeningV2Service.get(openingId),
        OpeningV2Service.getStatus(openingId),
        OpeningV2Service.getApprovals(openingId),
      ]);
      setOpening(o);
      setStatusState(s);
      setApprovals(a);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not load the opening');
    } finally {
      setLoading(false);
    }
  }, [openingId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Run a lifecycle action, then refresh everything the action could have moved. */
  const run = async (fn: () => Promise<unknown>, successMessage: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMessage);
      await load();
    } catch (err: any) {
      const data = err?.response?.data;
      toast.error(data?.details?.[0]?.message || data?.error || 'That action did not go through');
    } finally {
      setBusy(false);
    }
  };

  /** Prompt for a note, then run — used by everything that requires a reason. */
  const withNote = (
    title: string,
    placeholder: string,
    required: boolean,
    action: (note: string) => Promise<unknown>,
    successMessage: string
  ) => {
    setNoteModalConfig({ title, placeholder, required, action, successMessage });
    setNoteValue('');
    setNoteModalOpen(true);
  };

  if (loading && !opening) {
    return (
      <div className="omp">
        <OpeningStyles />
        <div style={{ padding: 24 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  if (!opening || !statusState) return null;

  const status = opening.status;
  const canUpdate = !!perms.canUpdateOpening;
  const canManage = !!perms.canManageOpenings;
  const currentStep = approvals?.currentStep ?? null;

  // Phase 3 tells us what is legal; we only decide how to present it.
  const allowed = statusState.allowedTransitions;
  const can = (to: string) => allowed.some((t) => t.to === to);

  const primaryActions: React.ReactNode[] = [];

  if (canUpdate && status === 'draft') {
    primaryActions.push(
      <Button
        key="submit"
        type="primary"
        icon={<Send size={14} />}
        loading={busy}
        onClick={() =>
          run(() => OpeningV2Service.submitForApproval(openingId), 'Submitted for approval')
        }
      >
        Submit for approval
      </Button>
    );
  }

  if (canUpdate && status === 'pending_approval') {
    primaryActions.push(
      <Button
        key="approve"
        type="primary"
        icon={<CheckCircle2 size={14} />}
        loading={busy}
        onClick={() =>
          withNote(
            `Approve “${currentStep?.stepName ?? 'this step'}”?`,
            'Optional note',
            false,
            (note) => OpeningV2Service.approve(openingId, note || null),
            'Approved'
          )
        }
      >
        Approve
      </Button>,
      <Button
        key="reject"
        danger
        icon={<XCircle size={14} />}
        loading={busy}
        onClick={() =>
          withNote(
            'Reject this opening?',
            'Why is it being rejected? (required)',
            true,
            (note) => OpeningV2Service.reject(openingId, note),
            'Rejected — returned to draft'
          )
        }
      >
        Reject
      </Button>
    );
  }

  if (canUpdate && can('internal_posting')) {
    primaryActions.push(
      <Button
        key="internal"
        type="primary"
        icon={<Lock size={14} />}
        loading={busy}
        onClick={() => setPostInternalOpen(true)}
      >
        Post internally
      </Button>
    );
  }

  if (canUpdate && can('external_posting')) {
    primaryActions.push(
      <Button
        key="external"
        type={can('internal_posting') ? 'default' : 'primary'}
        icon={<Globe size={14} />}
        loading={busy}
        onClick={() => run(() => OpeningV2Service.postExternally(openingId), 'Published externally')}
      >
        Post externally
      </Button>
    );
  }

  if (canUpdate && status === 'on_hold') {
    primaryActions.push(
      <Button
        key="resume"
        type="primary"
        icon={<PlayCircle size={14} />}
        loading={busy}
        onClick={() => run(() => OpeningV2Service.resume(openingId), 'Resumed')}
      >
        Resume
      </Button>
    );
  }

  // Everything else lives in the overflow menu so the bar stays readable.
  const menuItems: any[] = [];

  if (canUpdate && status === 'pending_approval') {
    menuItems.push({
      key: 'withdraw',
      label: 'Withdraw from approval',
      onClick: () =>
        withNote(
          'Withdraw this submission?',
          'Optional note',
          false,
          (note) => OpeningV2Service.withdraw(openingId, note || null),
          'Withdrawn — back to draft'
        ),
    });
    if (canManage && currentStep?.isOptional) {
      menuItems.push({
        key: 'skip',
        label: `Skip “${currentStep.stepName}” (optional)`,
        onClick: () =>
          withNote(
            `Skip “${currentStep.stepName}”?`,
            'Optional note',
            false,
            (note) => OpeningV2Service.skipStep(openingId, note || null),
            'Step skipped'
          ),
      });
    }
  }

  // Everything the state machine allows that is not already a primary button.
  // Rendering the server's own labels means new transitions appear here without
  // a frontend change, and nothing on screen can be a move the backend refuses.
  //
  // `cancelled` and `closed` are excluded on purpose: both are reached through
  // the Close dialog so a closure reason is always captured.
  const handledAsPrimary = new Set<string>(['internal_posting', 'external_posting']);
  const CLOSURE_STATUSES = new Set<string>(['cancelled', 'closed']);

  if (canUpdate) {
    for (const t of allowed) {
      if (handledAsPrimary.has(t.to) || CLOSURE_STATUSES.has(t.to)) continue;
      // The Resume button already covers the common way out of a hold.
      if (status === 'on_hold' && t.to === statusState.history.find((h) => h.toStatus === 'on_hold')?.fromStatus) {
        continue;
      }
      menuItems.push({
        key: `transition-${t.to}`,
        label: t.label,
        icon: t.to === 'on_hold' ? <PauseCircle size={14} /> : undefined,
        onClick: () =>
          t.requiresNote
            ? withNote(
                `${t.label}?`,
                'Add a note (required)',
                true,
                (note) =>
                  t.to === 'on_hold'
                    ? OpeningV2Service.hold(openingId, note)
                    : OpeningV2Service.changeStatus(openingId, { status: t.to, note }),
                t.label
              )
            : run(
                () => OpeningV2Service.changeStatus(openingId, { status: t.to }),
                t.label
              ),
      });
    }
  }

  if (canUpdate && !opening.closureReason && status !== 'draft') {
    menuItems.push({ type: 'divider' });
    menuItems.push({
      key: 'close',
      label: 'Close opening…',
      danger: true,
      onClick: () => setCloseOpen(true),
    });
  }

  // Closing normally archives too, but an opening closed with archive off can be
  // archived later — that is what this covers.
  const isFinished = ['closed', 'cancelled', 'filled'].includes(status);
  if (canUpdate && isFinished && !opening.isArchived) {
    menuItems.push({
      key: 'archive',
      label: 'Archive opening',
      icon: <Archive size={14} />,
      onClick: () => run(() => OpeningV2Service.archive(openingId), 'Archived'),
    });
  }

  if (canManage && opening.isArchived) {
    menuItems.push({
      key: 'unarchive',
      label: 'Restore from archive',
      onClick: () => run(() => OpeningV2Service.unarchive(openingId), 'Restored from the archive'),
    });
  }

  return (
    <div className="omp">
      <OpeningStyles />

      <div className="omp-header omp-detail-header">
        <div className="omp-head-about">
          <Button
            type="text"
            size="small"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push('/openings/list')}
          />
          <span className="omp-head-icon" style={{ background: TINT.blue, color: PALETTE.blue }}>
            <Briefcase size={17} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="omp-head-title">
              {opening.jobTitle}
              {opening.isArchived && <span className="omp-archived-flag">Archived</span>}
            </div>
            <div className="omp-head-sub">
              <span className="omp-code">{opening.openingCode}</span>
              {' · '}
              {[opening.departmentName, opening.clientName, opening.location]
                .filter(Boolean)
                .join(' · ') || 'No department'}
              {' · created '}
              {fmtDate(opening.createdAt)}
            </div>
          </div>
        </div>

        <div className="omp-head-actions">
          <Tooltip title={STATUS_META[status]?.hint}>
            <span>
              <StatusChip status={status} />
            </span>
          </Tooltip>
          <PriorityChip priority={opening.priority} />

          <Tooltip title="Refresh">
            <Button icon={<RotateCw size={14} />} loading={loading} onClick={load} />
          </Tooltip>

          {/* An opening under review is frozen server-side — hide Edit rather
              than let the user hit a 409. */}
          {canUpdate && status !== 'pending_approval' && !opening.isArchived && (
            <Button icon={<Edit3 size={14} />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          )}

          {primaryActions}

          {menuItems.length > 0 && (
            <SearchableDropdown
              options={menuItems.filter(m => m.key).map(m => ({ value: m.key, label: m.label, disabled: m.disabled }))}
              value={null}
              onChange={(val) => {
                toast.success(`Clicked: ${val}`);
                const item = menuItems.find(m => m.key === val);
                if (item?.onClick) {
                  setTimeout(() => item.onClick(), 0);
                }
              }}
              searchPlaceholder="Search actions..."
              customTrigger={
                <Button>
                  More <ChevronDown size={13} />
                </Button>
              }
            />
          )}
        </div>
      </div>

      {status === 'pending_approval' && currentStep && (
        <div className="omp-callout">
          <CheckCircle2 size={15} style={{ color: PALETTE.blue, flexShrink: 0 }} />
          <span>
            Waiting on <strong>{currentStep.stepName}</strong>
            {currentStep.approverName ? ` — ${currentStep.approverName}` : ''}
            {currentStep.roleName ? ` — anyone with the ${currentStep.roleName} role` : ''}
            {currentStep.isOptional && ' (optional step)'}
          </span>
        </div>
      )}

      {opening.closureReason && (
        <div className="omp-callout is-muted">
          <XCircle size={15} style={{ color: PALETTE.ash, flexShrink: 0 }} />
          <span>
            Closed as <strong>{opening.closureReason.replace(/_/g, ' ')}</strong>
            {opening.closureNote ? ` — ${opening.closureNote}` : ''}
          </span>
        </div>
      )}

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'overview',
            label: 'Overview',
            children: <OverviewTab opening={opening} />,
          },
          {
            key: 'approvals',
            label: 'Approvals',
            children: <ApprovalsTab state={approvals} />,
          },
          {
            key: 'postings',
            label: 'Postings',
            children: <PostingsTab openingId={openingId} onChanged={load} />,
          },
          {
            key: 'candidates',
            label: 'Candidates',
            children: <CandidatesTab openingId={openingId} onChanged={load} />,
          },
          {
            key: 'referrals',
            label: 'Referrals',
            children: <ReferralsTab openingId={openingId} />,
          },
          {
            key: 'rounds',
            label: 'Rounds',
            children: <RoundsTab opening={opening} />,
          },
          {
            key: 'timeline',
            label: 'Timeline',
            children: <TimelineTab history={statusState.history} />,
          },
        ]}
      />

      <OpeningFormDrawer
        open={editOpen}
        openingId={openingId}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          load();
        }}
      />

      <PostInternalModal
        open={postInternalOpen}
        openingId={openingId}
        onClose={() => setPostInternalOpen(false)}
        onPosted={() => {
          setPostInternalOpen(false);
          load();
        }}
      />

      <CloseOpeningModal
        open={closeOpen}
        opening={opening}
        onClose={() => setCloseOpen(false)}
        onClosed={() => {
          setCloseOpen(false);
          load();
        }}
      />

      <Modal
        title={noteModalConfig?.title}
        open={noteModalOpen}
        onCancel={() => {
          setNoteModalOpen(false);
          setNoteModalConfig(null);
        }}
        okText="Confirm"
        onOk={async () => {
          if (!noteModalConfig) return;
          if (noteModalConfig.required && !noteValue.trim()) {
            toast.error('A note is required');
            return;
          }
          setNoteModalOpen(false);
          await run(() => noteModalConfig.action(noteValue.trim()), noteModalConfig.successMessage);
        }}
      >
        <Input.TextArea
          rows={3}
          placeholder={noteModalConfig?.placeholder}
          value={noteValue}
          onChange={(e) => setNoteValue(e.target.value)}
          autoFocus
        />
      </Modal>

      <style jsx global>{`
        .omp-detail-header { align-items: flex-start; }
        .omp-archived-flag {
          margin-left: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--text-slate-500); background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-200); border-radius: 5px; padding: 1px 6px;
          vertical-align: middle;
        }
        .omp-callout {
          display: flex; align-items: center; gap: 10px; padding: 10px 14px; margin-bottom: 16px;
          border: 1px solid var(--border-slate-200); background: var(--bg-slate-50);
          font-size: 12.5px; color: var(--text-slate-700); border-radius: 8px;
        }
        .omp-callout.is-muted { color: var(--text-slate-500); }
      `}</style>
    </div>
  );
}
