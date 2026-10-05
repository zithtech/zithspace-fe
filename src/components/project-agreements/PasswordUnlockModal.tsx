'use client';

import React, { useState } from 'react';
import { Modal, Input, Button, Alert, Badge } from 'antd';
import { Lock, ShieldAlert, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface PasswordUnlockModalProps {
  open: boolean;
  documentTitle?: string;
  documentNumber?: string | null;
  scope?: 'TENANT' | 'AGREEMENT' | 'TEMPLATE';
  loading?: boolean;
  errorMessage?: string | null;
  onUnlock: (password: string) => Promise<void>;
  onCancel?: () => void;
}

export default function PasswordUnlockModal({
  open,
  documentTitle = 'Protected Document',
  documentNumber,
  scope,
  loading = false,
  errorMessage = null,
  onUnlock,
  onCancel,
}: PasswordUnlockModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the password to unlock.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onUnlock(password.trim());
      setPassword('');
      setShowPassword(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Incorrect password.');
    } finally {
      setSubmitting(false);
    }
  };

  const getScopeBadge = () => {
    if (scope === 'TENANT') {
      return { label: 'Tenant Global Lock', bg: 'rgba(37, 99, 235, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    }
    if (scope === 'AGREEMENT') {
      return { label: 'Custom Agreement Lock', bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    }
    if (scope === 'TEMPLATE') {
      return { label: 'Template Password Lock', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    }
    return { label: 'Password Protection', bg: 'rgba(100, 116, 139, 0.12)', color: '#64748b', border: 'rgba(100, 116, 139, 0.3)' };
  };

  const badge = getScopeBadge();

  return (
    <Modal
      open={open}
      footer={null}
      closable={Boolean(onCancel)}
      onCancel={onCancel}
      centered
      width={440}
      zIndex={2000}
      className="pa-password-unlock-modal"
      styles={{
        body: { padding: '28px 24px 24px' },
      }}
    >
      <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
        {/* Shield Icon Container */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(29, 78, 216, 0.08) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: '#3b82f6',
            boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.2)',
          }}
        >
          <Lock size={30} />
        </div>

        {/* Lock Scope Badge */}
        <div style={{ marginBottom: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              background: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.border}`,
              padding: '3px 10px',
              borderRadius: 20,
            }}
          >
            <ShieldCheck size={13} />
            {badge.label}
          </span>
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-slate-900, #0f172a)' }}>
          Password Required
        </h3>

        <p style={{ fontSize: 13, color: 'var(--text-slate-500, #64748b)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Enter the password to access full contents of{' '}
          <strong style={{ color: 'var(--text-slate-700, #334155)' }}>{documentTitle}</strong>
          {documentNumber ? ` (${documentNumber})` : ''}.
        </p>

        {(error || errorMessage) && (
          <Alert
            type="error"
            showIcon
            icon={<ShieldAlert size={16} />}
            message={error || errorMessage}
            style={{ marginBottom: 18, textAlign: 'left', fontSize: 13, borderRadius: 8 }}
          />
        )}

        <div style={{ marginBottom: 20, textAlign: 'left', position: 'relative' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-slate-700, #475569)', marginBottom: 6 }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              type={showPassword ? 'text' : 'password'}
              size="large"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              autoFocus
              disabled={submitting || loading}
              style={{ borderRadius: 8, paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-slate-400, #64748b)',
                padding: 0,
                display: 'flex',
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button
          type="primary"
          size="large"
          block
          htmlType="submit"
          loading={submitting || loading}
          style={{
            height: 44,
            fontWeight: 600,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          }}
        >
          Unlock & Access
        </Button>
      </form>
    </Modal>
  );
}

