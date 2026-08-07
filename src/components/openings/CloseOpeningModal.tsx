'use client';

import React, { useEffect, useState } from 'react';
import { App, Alert, Checkbox, Input, Modal } from 'antd';

import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import OpeningV2Service, {
  type ClosureReason,
  type OpeningDetail,
} from '@/services/openingV2Service';

// Phase 7 — closing an opening. The REASON drives the terminal status, so the
// modal shows what will happen rather than asking the user to pick both.

// The reason list and its reason→status mapping come from the backend
// (`GET /closure-reasons`), so adding a reason server-side needs no frontend
// change. FALLBACK_REASONS only covers that request failing.
interface ReasonOption {
  value: ClosureReason;
  label: string;
  outcome: string;
  needsDuplicate?: boolean;
}

const FALLBACK_REASONS: ReasonOption[] = [
  { value: 'position_filled', label: 'Position Filled', outcome: 'Closes the opening' },
  { value: 'cancelled', label: 'Cancelled', outcome: 'Cancels the opening' },
  { value: 'budget_issue', label: 'Budget Issue', outcome: 'Cancels the opening' },
  { value: 'client_cancelled', label: 'Client Cancelled', outcome: 'Cancels the opening' },
  {
    value: 'duplicate_opening',
    label: 'Duplicate Opening',
    outcome: 'Cancels the opening',
    needsDuplicate: true,
  },
];

export default function CloseOpeningModal({
  open,
  opening,
  onClose,
  onClosed,
}: {
  open: boolean;
  opening: OpeningDetail;
  onClose: () => void;
  onClosed: () => void;
}) {
  const { message } = App.useApp();
  const [reason, setReason] = useState<ClosureReason>('position_filled');
  const [note, setNote] = useState('');
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
  const [archive, setArchive] = useState(true);
  const [rejectRemaining, setRejectRemaining] = useState(false);
  const [openApplications, setOpenApplications] = useState<number | null>(null);
  const [options, setOptions] = useState<{ value: string; label: string; description?: string }[]>(
    []
  );
  const [saving, setSaving] = useState(false);
  const [reasons, setReasons] = useState<ReasonOption[]>(FALLBACK_REASONS);

  const selected = reasons.find((r) => r.value === reason) ?? FALLBACK_REASONS[0];

  useEffect(() => {
    if (!open) return;
    setReason('position_filled');
    setNote('');
    setDuplicateOf(null);
    setArchive(true);
    setRejectRemaining(false);

    OpeningV2Service.closureReasons()
      .then((rows) => {
        if (!rows?.length) return;
        setReasons(
          rows.map((r) => ({
            value: r.value,
            label: r.label,
            outcome: r.status === 'closed' ? 'Closes the opening' : 'Cancels the opening',
            needsDuplicate: !!r.requiresDuplicateLink,
          }))
        );
      })
      .catch(() => undefined);

    // How many candidates are mid-pipeline, so the warning is specific rather
    // than a generic "this may affect candidates".
    OpeningV2Service.getFunnel(opening.id)
      .then((f) => {
        const open =
          f.applications - (f.byStage.hired ?? 0) - (f.byStage.rejected ?? 0) - (f.byStage.withdrawn ?? 0);
        setOpenApplications(Math.max(0, open));
      })
      .catch(() => setOpenApplications(null));
  }, [open, opening.id]);

  // Only load the duplicate picker when it is actually needed.
  useEffect(() => {
    if (reason !== 'duplicate_opening' || options.length) return;
    OpeningV2Service.list({ pageSize: 200, archived: 'include' })
      .then((res) =>
        setOptions(
          res.items
            .filter((o) => o.id !== opening.id)
            .map((o) => ({
              value: o.id,
              label: `${o.openingCode} — ${o.jobTitle}`,
              description: o.departmentName ?? undefined,
            }))
        )
      )
      .catch(() => undefined);
  }, [reason, options.length, opening.id]);

  const submit = async () => {
    if (selected.needsDuplicate && !duplicateOf) {
      message.error('Pick the opening this duplicates');
      return;
    }
    setSaving(true);
    try {
      const result = await OpeningV2Service.close(opening.id, {
        closureReason: reason,
        note: note || null,
        duplicateOfOpeningId: selected.needsDuplicate ? duplicateOf : null,
        archive,
        rejectRemaining,
      });
      message.success(
        `Opening ${result.status}${result.archived ? ' and archived' : ''}` +
          (result.applicationsRejected
            ? ` · ${result.applicationsRejected} candidate(s) rejected`
            : '')
      );
      onClosed();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not close the opening');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={saving}
      okText="Close opening"
      okButtonProps={{ danger: reason !== 'position_filled' }}
      title={`Close ${opening.openingCode}`}
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
        <div>
          <div className="omp-field-label">Closing reason</div>
          <SearchableDropdown
            value={reason}
            onChange={(v: any) => setReason(v)}
            options={reasons.map((r) => ({
              value: r.value,
              label: r.label,
              description: r.outcome,
            }))}
            hideAvatar
            allowClear={false}
            width={340}
            style={{ width: '100%' }}
          />
        </div>

        {selected.needsDuplicate && (
          <div>
            <div className="omp-field-label">Duplicate of</div>
            <SearchableDropdown
              value={duplicateOf}
              onChange={(v: any) => setDuplicateOf(v)}
              options={options}
              placeholder="Select the original opening"
              itemNoun="openings"
              width={340}
              style={{ width: '100%' }}
            />
          </div>
        )}

        <div>
          <div className="omp-field-label">Note</div>
          <Input.TextArea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why is this closing?"
          />
        </div>

        {!!openApplications && (
          <Alert
            type="warning"
            showIcon
            message={`${openApplications} candidate${openApplications === 1 ? ' is' : 's are'} still in the pipeline`}
            description={
              <Checkbox
                checked={rejectRemaining}
                onChange={(e) => setRejectRemaining(e.target.checked)}
              >
                Reject them as part of closing
              </Checkbox>
            }
          />
        )}

        <Checkbox checked={archive} onChange={(e) => setArchive(e.target.checked)}>
          Archive the opening (removes it from the working list)
        </Checkbox>

        <div style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>
          Live job postings are taken down automatically.
        </div>
      </div>
    </Modal>
  );
}
