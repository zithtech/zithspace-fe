'use client';

import React, { useEffect, useState } from 'react';
import { Card, Input, Button, Switch, notification, Spin, Alert, Badge, Tooltip } from 'antd';
import {
  ShieldCheck,
  Lock,
  Key,
  Info,
  CheckCircle2,
  ShieldOff,
  Globe,
  ShieldAlert,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  getSecuritySettings,
  updateSecuritySettings,
  PasswordProtectionMode,
  SecuritySettings as ISecuritySettings,
} from '@/services/projectAgreementsService';

function generateRandomPassword(length = 14): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '#cbd5e1' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (score === 3 || score === 4) return { score: 2, label: 'Medium', color: '#f59e0b' };
  return { score: 3, label: 'Strong', color: '#10b981' };
}

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ISecuritySettings | null>(null);

  const [mode, setMode] = useState<PasswordProtectionMode>('DISABLED');
  const [tenantPassword, setTenantPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requirePdf, setRequirePdf] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getSecuritySettings();
      setSettings(data);
      setMode(data.passwordProtectionMode);
      setRequirePdf(data.requirePasswordForPdf);
    } catch (err: any) {
      notification.error({
        message: 'Security Settings Error',
        description: err?.response?.data?.error || err?.message || 'Failed to load security settings',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleGeneratePassword = () => {
    const newPass = generateRandomPassword();
    setTenantPassword(newPass);
    setShowPassword(true);
    notification.info({
      message: 'Generated Password',
      description: 'A strong 14-character random password was generated.',
      duration: 3,
    });
  };

  const handleCopyPassword = () => {
    if (!tenantPassword) return;
    navigator.clipboard.writeText(tenantPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSecuritySettings({
        passwordProtectionMode: mode,
        tenantPassword: tenantPassword.trim() || undefined,
        requirePasswordForPdf: requirePdf,
      });
      setSettings(updated);
      setTenantPassword('');
      setShowPassword(false);
      notification.success({
        message: 'Security Policy Updated',
        description: 'Agreement security configuration saved successfully.',
      });
    } catch (err: any) {
      notification.error({
        message: 'Save Failed',
        description: err?.response?.data?.error || err?.message || 'Could not save security settings',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: 340 }}>
        <Spin size="large" tip="Loading security settings..." />
      </div>
    );
  }

  const strength = getPasswordStrength(tenantPassword);

  const MODE_CARDS: Array<{
    id: PasswordProtectionMode;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: 'DISABLED',
      title: 'Disabled (Public Access)',
      subtitle: 'No password requirement',
      description: 'Agreements & templates can be viewed and downloaded directly without any password prompt.',
      icon: <ShieldOff size={20} color={mode === 'DISABLED' ? '#2563eb' : '#64748b'} />,
    },
    {
      id: 'TENANT_GLOBAL',
      title: 'Tenant Global Password',
      subtitle: 'Single company-wide password',
      description: 'All agreements in this workspace share one single company-wide global password.',
      icon: <Globe size={20} color={mode === 'TENANT_GLOBAL' ? '#2563eb' : '#64748b'} />,
    },
    {
      id: 'CUSTOM_OVERRIDE',
      title: 'Tenant Default with Overrides (Recommended)',
      subtitle: 'Global password + custom agreement passwords',
      description: 'Agreements use the tenant global password by default, but individual agreements/templates can set custom passwords.',
      icon: <ShieldAlert size={20} color={mode === 'CUSTOM_OVERRIDE' ? '#2563eb' : '#64748b'} />,
      badge: 'Recommended',
    },
    {
      id: 'PER_AGREEMENT',
      title: 'Per-Agreement Password Required',
      subtitle: 'Custom password compulsory',
      description: 'Every agreement and template must have its own custom password configured before publishing.',
      icon: <KeyRound size={20} color={mode === 'PER_AGREEMENT' ? '#2563eb' : '#64748b'} />,
    },
  ];

  return (
    <div className="pa-security-settings" style={{ width: '100%', padding: '16px 24px 40px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 14,
            padding: '24px 28px',
            color: '#fff',
            marginBottom: 28,
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Security & Password Policy
              </h2>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
                Enforce document encryption, global passwords, and granular access controls for agreements & templates.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: 12,
                fontWeight: 500,
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: mode === 'DISABLED' ? '#94a3b8' : '#10b981',
                  boxShadow: mode === 'DISABLED' ? 'none' : '0 0 8px #10b981',
                }}
              />
              Mode: {mode}
            </div>

            {settings?.hasTenantPassword && (
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#34d399',
                }}
              >
                Key Version v{settings.tenantPasswordVersion}
              </div>
            )}
          </div>
        </div>

        {/* Password Protection Mode Options */}
        <div style={{ marginBottom: 28 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-slate-900, #1e293b)',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Lock size={17} style={{ color: '#2563eb' }} />
            Select Protection Strategy
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
            {MODE_CARDS.map((item) => {
              const active = mode === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  style={{
                    border: active ? '2px solid #2563eb' : '1px solid var(--border-slate-200, #e2e8f0)',
                    borderRadius: 12,
                    padding: '16px 18px',
                    backgroundColor: active ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-card, #ffffff)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: active ? '0 4px 14px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  {item.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'rgba(37, 99, 235, 0.15)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: active ? 'rgba(37, 99, 235, 0.15)' : 'var(--icon-box-bg, #f1f5f9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {item.icon}
                    </div>

                    <div style={{ flex: 1, paddingRight: item.badge ? 70 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: active ? '#3b82f6' : 'var(--text-slate-900, #1e293b)' }}>
                          {item.title}
                        </span>
                        {active && <CheckCircle2 size={16} color="#2563eb" />}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-slate-500, #64748b)', marginTop: 2 }}>
                        {item.subtitle}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-slate-400, #64748b)', marginTop: 6, lineHeight: 1.45 }}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Password Configuration Card */}
        {(mode === 'TENANT_GLOBAL' || mode === 'CUSTOM_OVERRIDE') && (
          <Card
            className="pa-security-card"
            style={{
              marginBottom: 28,
              borderRadius: 12,
              borderColor: 'var(--border-slate-200, #e2e8f0)',
              backgroundColor: 'var(--bg-card, #ffffff)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
            bodyStyle={{ padding: 22 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--text-slate-900, #0f172a)',
                  }}
                >
                  <Key size={18} style={{ color: '#2563eb' }} />
                  Tenant Global Password
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-slate-500, #64748b)', margin: '4px 0 0' }}>
                  Shared default password across protected agreements and templates.
                </p>
              </div>

              <Button
                type="default"
                size="small"
                icon={<Sparkles size={14} color="#2563eb" />}
                onClick={handleGeneratePassword}
                style={{
                  borderRadius: 6,
                  fontWeight: 500,
                  borderColor: 'var(--border-slate-300, #cbd5e1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Auto-Generate
              </Button>
            </div>

            {settings?.hasTenantPassword ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircle2 size={16} />}
                message={`Active Global Password Configured (v${settings.tenantPasswordVersion})`}
                description="Enter a new password below only if you wish to rotate or update the global key."
                style={{ marginBottom: 20, borderRadius: 8 }}
              />
            ) : (
              <Alert
                type="warning"
                showIcon
                icon={<Info size={16} />}
                message="No Global Password Set"
                description="Protected agreements using tenant mode require a valid global password to be set."
                style={{ marginBottom: 20, borderRadius: 8 }}
              />
            )}

            <div style={{ maxWidth: 520 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text-slate-700, #334155)', marginBottom: 6 }}>
                {settings?.hasTenantPassword ? 'Update Tenant Global Password' : 'Set Tenant Global Password'}
              </label>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new global password"
                    value={tenantPassword}
                    onChange={(e) => setTenantPassword(e.target.value)}
                    size="large"
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

                {tenantPassword && (
                  <Tooltip title={copied ? 'Copied!' : 'Copy password'}>
                    <Button
                      size="large"
                      icon={copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                      onClick={handleCopyPassword}
                      style={{ borderRadius: 8 }}
                    />
                  </Tooltip>
                )}
              </div>

              {/* Password strength indicator */}
              {tenantPassword && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-slate-500, #64748b)' }}>Strength:</span>
                    <span style={{ fontWeight: 600, color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        style={{
                          height: 4,
                          flex: 1,
                          borderRadius: 2,
                          backgroundColor: step <= strength.score ? strength.color : 'var(--border-slate-200, #e2e8f0)',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--text-slate-400, #94a3b8)', marginTop: 10 }}>
                <Info size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: '-2px' }} />
                Updating the tenant password increments the key version and revokes existing unlock sessions immediately.
              </div>
            </div>
          </Card>
        )}

        {/* PDF Guard Switch Card */}
        <Card
          className="pa-security-card"
          style={{
            marginBottom: 28,
            borderRadius: 12,
            borderColor: 'var(--border-slate-200, #e2e8f0)',
            backgroundColor: 'var(--bg-card, #ffffff)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
          bodyStyle={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--text-slate-900, #0f172a)' }}>
                PDF Download Guard Protection
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-slate-500, #64748b)' }}>
                Require password verification before serving PDF previews or downloads in staff & client portals.
              </p>
            </div>
            <Switch checked={requirePdf} onChange={setRequirePdf} />
          </div>
        </Card>

        {/* Save Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={fetchSettings} disabled={saving} style={{ borderRadius: 8 }}>
            Reset
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            style={{
              borderRadius: 8,
              height: 40,
              padding: '0 24px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            }}
          >
            Save Security Policy
          </Button>
        </div>
      </div>

      <style jsx global>{`
        [data-theme='dark'] .pa-security-settings,
        .dark .pa-security-settings {
          --bg-card: #141a24;
          --border-slate-200: #263142;
          --border-slate-300: #334155;
          --text-slate-900: #f8fafc;
          --text-slate-700: #e2e8f0;
          --text-slate-500: #94a3b8;
          --text-slate-400: #64748b;
          --icon-box-bg: #1e293b;
        }

        [data-theme='dark'] .pa-security-card,
        .dark .pa-security-card {
          background-color: #141a24 !important;
          border-color: #263142 !important;
        }

        [data-theme='dark'] .pa-security-settings .ant-card,
        .dark .pa-security-settings .ant-card {
          background-color: #141a24 !important;
          border-color: #263142 !important;
          color: #f8fafc !important;
        }

        [data-theme='dark'] .pa-security-settings .ant-input,
        .dark .pa-security-settings .ant-input {
          background-color: #0f141c !important;
          border-color: #334155 !important;
          color: #f8fafc !important;
        }

        [data-theme='dark'] .pa-security-settings .ant-input::placeholder,
        .dark .pa-security-settings .ant-input::placeholder {
          color: #64748b !important;
        }

        [data-theme='dark'] .pa-security-settings .ant-btn-default,
        .dark .pa-security-settings .ant-btn-default {
          background-color: #1e293b !important;
          border-color: #334155 !important;
          color: #e2e8f0 !important;
        }

        [data-theme='dark'] .pa-security-settings .ant-btn-default:hover,
        .dark .pa-security-settings .ant-btn-default:hover {
          background-color: #334155 !important;
          border-color: #475569 !important;
          color: #ffffff !important;
        }

        [data-theme='dark'] .pa-security-settings .ant-alert-success,
        .dark .pa-security-settings .ant-alert-success {
          background-color: rgba(16, 185, 129, 0.12) !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
        }
        [data-theme='dark'] .pa-security-settings .ant-alert-success .ant-alert-message,
        .dark .pa-security-settings .ant-alert-success .ant-alert-message,
        [data-theme='dark'] .pa-security-settings .ant-alert-success .ant-alert-description,
        .dark .pa-security-settings .ant-alert-success .ant-alert-description {
          color: #a7f3d0 !important;
        }

        [data-theme='dark'] .pa-security-settings .ant-alert-warning,
        .dark .pa-security-settings .ant-alert-warning {
          background-color: rgba(245, 158, 11, 0.12) !important;
          border-color: rgba(245, 158, 11, 0.3) !important;
        }
        [data-theme='dark'] .pa-security-settings .ant-alert-warning .ant-alert-message,
        .dark .pa-security-settings .ant-alert-warning .ant-alert-message,
        [data-theme='dark'] .pa-security-settings .ant-alert-warning .ant-alert-description,
        .dark .pa-security-settings .ant-alert-warning .ant-alert-description {
          color: #fde68a !important;
        }
      `}</style>
    </div>
  );
}

