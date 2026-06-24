'use client';

import React, { useState } from 'react';
import { Popover, Button } from 'antd';
import type { TooltipPlacement } from 'antd/es/tooltip';
import { ExclamationCircleFilled } from '@ant-design/icons';

/**
 * ConfirmDialog — a reusable, premium confirmation popover.
 *
 * Anchors a box-shaped confirm card to its trigger child (so it appears right
 * next to the element that was clicked — e.g. a row's delete icon), with a
 * tinted icon-chip, description, and an action bar. Replaces antd's
 * <Popconfirm> with a richer, on-brand look.
 *
 * Usage — wrap the trigger:
 *   <ConfirmDialog
 *     tone="danger"
 *     title="Delete this item?"
 *     description="This cannot be undone."
 *     confirmText="Delete"
 *     onConfirm={async () => { await doDelete(row); }}
 *   >
 *     <Button danger icon={<DeleteOutlined />} />
 *   </ConfirmDialog>
 *
 * `onConfirm` may be async — the confirm button spins until it resolves, then
 * the popover closes automatically.
 */

export type ConfirmTone = 'danger' | 'primary' | 'warning' | 'success';

const TONES: Record<ConfirmTone, { color: string; tint: string }> = {
  danger: { color: '#EF4444', tint: 'rgba(239,68,68,0.10)' },
  primary: { color: '#3B82F6', tint: 'rgba(59,130,246,0.10)' },
  warning: { color: '#F59E0B', tint: 'rgba(245,158,11,0.10)' },
  success: { color: '#10B981', tint: 'rgba(16,185,129,0.10)' },
};

export interface ConfirmDialogProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  /** Custom header icon. Defaults to a tone-coloured exclamation. */
  icon?: React.ReactNode;
  /** Where the card sits relative to the trigger. Default 'bottomRight'. */
  placement?: TooltipPlacement;
  /** Card width in px. Default 300. */
  width?: number;
  disabled?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  /** The trigger element (e.g. the delete button). */
  children: React.ReactNode;
}

export default function ConfirmDialog({
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger',
  icon,
  placement = 'bottomRight',
  width = 300,
  disabled,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const t = TONES[tone];

  const handleConfirm = async () => {
    try {
      setBusy(true);
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    onCancel?.();
  };

  const content = (
    <div style={{ width }}>
      <div style={{ padding: '14px 16px 12px', display: 'flex', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 0,
            background: t.tint,
            color: t.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {icon ?? <ExclamationCircleFilled />}
        </div>
        <div style={{ minWidth: 0, paddingTop: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1.3 }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 12.5, color: 'var(--text-slate-500)', marginTop: 5, lineHeight: 1.5 }}>
              {description}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '10px 16px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary, #f8fafc)',
        }}
      >
        <Button size="small" onClick={handleCancel} disabled={busy} style={{ borderRadius: 6, fontWeight: 600, height: 30, padding: '0 14px' }}>
          {cancelText}
        </Button>
        <Button
          size="small"
          type="primary"
          danger={tone === 'danger'}
          loading={busy}
          onClick={handleConfirm}
          style={{
            borderRadius: 6,
            fontWeight: 600,
            height: 30,
            padding: '0 16px',
            ...(tone !== 'danger' ? { background: t.color, borderColor: t.color } : {}),
          }}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(v) => {
          if (disabled) return;
          if (!busy) setOpen(v);
        }}
        trigger="click"
        placement={placement}
        content={content}
        arrow
        styles={{ body: { padding: 0 } }}
        overlayClassName="confirm-pop-overlay"
      >
        {children}
      </Popover>
      {/* Square the portal-rendered card (box-shaped premium look) */}
      <style jsx global>{`
        .confirm-pop-overlay .ant-popover-inner {
          border-radius: 0 !important;
          padding: 0 !important;
          border: 1px solid var(--border-color);
          box-shadow: 0 12px 34px rgba(15, 23, 42, 0.16);
        }
      `}</style>
    </>
  );
}
