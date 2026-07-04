'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Table,
  Tag,
  Drawer,
  Form,
  Input,
  message,
  Tooltip,
  Modal,
  Space,
  Row,
  Col,
  Pagination,
  Typography,
} from 'antd';
const { Text } = Typography;
import type { ColumnsType } from 'antd/es/table';
import {
  MailPlus,
  UserPlus,
  Mail,
  AtSign,
  Copy,
  Pencil,
  Ban,
  CheckCircle2,
  RefreshCw,
  X,
  Link2,
  User,
  Smartphone,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import OnboardingGuard from '@/components/onboarding/OnboardingGuard';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { EmployeeOnboardingService } from '@/services/onboardingService';

// ── Module palette: blue / green / red / grey / gold (status only) ───────────
const PALETTE = {
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  grey: '#94A3B8',
  gold: '#F59E0B',
} as const;
const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  red: 'rgba(239,68,68,0.10)',
  grey: 'rgba(148,163,184,0.12)',
  gold: 'rgba(245,158,11,0.10)',
} as const;

type InviteStatus = 'invited' | 'employee_submitted' | 'completed' | 'revoked';

interface Invite {
  inviteId: string;
  employeeId: string;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string | null;
  status: InviteStatus;
  isExpired?: boolean;
  expiresAt?: string | null;
  submittedAt?: string | null;
  createdAt?: string | null;
}

interface CreatedInvite {
  inviteId: string;
  employeeId: string;
  employeeCode?: string;
  link?: string;
  token?: string;
  expiresAt?: string | null;
  emailed?: boolean;
  emailedTo?: string[];
}

interface CreateInviteForm {
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string;
  mobile?: string;
}

// Status → Tag colour + label. (antd Tag has no native "gold"; we tint inline.)
const STATUS_META: Record<InviteStatus, { label: string; color: string; tint: string }> = {
  invited: { label: 'Invited', color: PALETTE.blue, tint: TINT.blue },
  employee_submitted: { label: 'Submitted', color: PALETTE.gold, tint: TINT.gold },
  completed: { label: 'Completed', color: PALETTE.green, tint: TINT.green },
  revoked: { label: 'Revoked', color: PALETTE.red, tint: TINT.red },
};

const fmtDate = (v?: string | null): string => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const fieldLabel = (t: string) => (
  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-700)' }}>{t}</span>
);

// Section card — mirrors LeaveTypePanel's drawer section pattern.
function SectionCard({
  icon,
  tint,
  color,
  title,
  subtitle,
  step,
  children,
}: {
  icon: React.ReactNode;
  tint: string;
  color: string;
  title: string;
  subtitle: string;
  step: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-pure-white)',
        border: '1px solid var(--border-color)',
        borderRadius: 0,
        padding: '18px 24px 20px',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 0,
            background: tint,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
            {title}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-slate-500)', fontWeight: 500 }}>{subtitle}</div>
        </div>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 999,
            background: 'var(--bg-secondary, #f1f5f9)',
            color: 'var(--text-slate-500)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          {step}
        </span>
      </div>
      {children}
    </div>
  );
}

function InvitesContent() {
  const { canCreateOnboarding } = usePermission();

  const [rows, setRows] = useState<Invite[]>([]);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  const [loading, setLoading] = useState(false);

  // create drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<CreateInviteForm>();

  // edit drawer (name + emails of an existing draft)
  const [editing, setEditing] = useState<Invite | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm] = Form.useForm<CreateInviteForm>();

  // post-create "share link" modal
  const [created, setCreated] = useState<CreatedInvite | null>(null);

  // ── Defensive list reader: the api helper may unwrap to the array, or hand
  // back the full body. Accept res (array), res.data (array), or res.data.data.
  const readInvites = (res: any): Invite[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await EmployeeOnboardingService.listInvites();
      setRows(readInvites(res));
    } catch (err: any) {
      message.error(err?.message || 'Failed to load invites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      invited: rows.filter((r) => r.status === 'invited').length,
      submitted: rows.filter((r) => r.status === 'employee_submitted').length,
      completed: rows.filter((r) => r.status === 'completed').length,
    };
  }, [rows]);

  // ── Create ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    form.resetFields();
    setDrawerOpen(true);
  };

  const submit = async () => {
    let values: CreateInviteForm;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const res = await EmployeeOnboardingService.createInvite({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        workEmail: values.workEmail.trim(),
        personalEmail: values.personalEmail?.trim() || undefined,
        mobile: values.mobile?.trim() || undefined,
      });
      // Same defensive unwrap as the list reader.
      const payload: CreatedInvite = res?.data?.data ?? res?.data ?? res;
      setDrawerOpen(false);
      message.success('Invite created');
      if (payload) setCreated(payload);
      await load();
    } catch (err: any) {
      message.error(err?.message || 'Failed to create invite');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit (name + emails of an existing draft) ─────────────────────────────
  const openEdit = (r: Invite) => {
    setEditing(r);
    editForm.setFieldsValue({
      firstName: r.firstName || '',
      lastName: r.lastName || '',
      workEmail: r.workEmail || '',
      personalEmail: r.personalEmail || '',
    });
  };

  const submitEdit = async () => {
    if (!editing) return;
    let values: CreateInviteForm;
    try {
      values = await editForm.validateFields();
    } catch {
      return;
    }
    setEditSaving(true);
    try {
      await EmployeeOnboardingService.updateInviteContact(editing.employeeId, {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        workEmail: values.workEmail.trim(),
        personalEmail: values.personalEmail?.trim() || '',
      });
      message.success('Details updated');
      setEditing(null);
      await load();
    } catch (err: any) {
      message.error(err?.message || 'Failed to update details');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Revoke ──────────────────────────────────────────────────────────────
  const revoke = async (record: Invite) => {
    try {
      await EmployeeOnboardingService.revokeInvite(record.inviteId);
      message.success('Invite revoked');
      await load();
    } catch (err: any) {
      message.error(err?.message || 'Failed to revoke invite');
    }
  };

  // ── Activate ────────────────────────────────────────────────────────────
  const activate = async (record: Invite) => {
    try {
      await EmployeeOnboardingService.activateEmployee(record.employeeId);
      message.success('Employee activated');
      await load();
    } catch (err: any) {
      message.error(err?.message || 'Failed to activate employee');
    }
  };

  // ── Copy (share-link modal only — token is returned only at creation) ────
  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      message.success('Link copied to clipboard');
    } catch {
      message.error('Could not copy — please copy manually');
    }
  };

  const createdLink = useMemo(() => {
    if (!created) return '';
    if (created.link) return created.link;
    if (created.token && typeof window !== 'undefined') {
      return `${window.location.origin}/onboard/${created.token}`;
    }
    return '';
  }, [created]);

  // ── Columns ─────────────────────────────────────────────────────────────
  const columns: ColumnsType<Invite> = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, r) => {
        const name = `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || '—';
        const initials =
          `${(r.firstName ?? '').charAt(0)}${(r.lastName ?? '').charAt(0)}`.toUpperCase() || '?';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: TINT.blue,
                color: PALETTE.blue,
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {initials}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>{name}</div>
              {r.employeeCode && (
                <div style={{ fontSize: 11, color: 'var(--text-slate-400)', fontFamily: 'monospace' }}>
                  {r.employeeCode}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Work Email',
      dataIndex: 'workEmail',
      key: 'workEmail',
      render: (v) => <span style={{ color: 'var(--text-slate-600)' }}>{v || '—'}</span>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, r) => {
        const meta = STATUS_META[r.status] ?? STATUS_META.invited;
        const showExpired = r.isExpired && r.status !== 'completed' && r.status !== 'revoked';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag
              style={{
                margin: 0,
                border: 'none',
                background: meta.tint,
                color: meta.color,
                fontWeight: 600,
                borderRadius: 6,
              }}
            >
              {meta.label}
            </Tag>
            {showExpired && (
              <Tag
                style={{
                  margin: 0,
                  border: 'none',
                  background: TINT.grey,
                  color: PALETTE.grey,
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                Expired
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (v) => <span style={{ color: 'var(--text-slate-500)' }}>{fmtDate(v)}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      align: 'right',
      render: (_, r) => {
        return (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
            {/* Copy link — token is only returned once at creation, so we can't
                rebuild the public link from the list. Disable with a tooltip. */}
            <Tooltip title="Link shown once at creation">
              <span>
                <Button type="text" size="small" icon={<Copy size={15} />} disabled />
              </span>
            </Tooltip>

            {canCreateOnboarding && r.status !== 'completed' && r.status !== 'revoked' && (
              <Tooltip title="Edit name & emails">
                <Button
                  type="text"
                  size="small"
                  icon={<Pencil size={15} />}
                  onClick={() => openEdit(r)}
                  style={{ color: PALETTE.blue }}
                />
              </Tooltip>
            )}

            {r.status === 'employee_submitted' && (
              <ConfirmDialog
                tone="success"
                icon={<CheckCircle2 size={16} />}
                title="Activate this employee?"
                description={`${r.firstName} ${r.lastName} will become an active employee.`}
                confirmText="Activate"
                placement="bottomRight"
                onConfirm={() => activate(r)}
              >
                <Tooltip title="Activate">
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckCircle2 size={15} />}
                    style={{ color: PALETTE.green }}
                  />
                </Tooltip>
              </ConfirmDialog>
            )}

            {r.status !== 'completed' && r.status !== 'revoked' && (
              <ConfirmDialog
                tone="danger"
                icon={<Ban size={16} />}
                title="Revoke this invite?"
                description="The public onboarding link will stop working immediately."
                confirmText="Revoke"
                placement="bottomRight"
                onConfirm={() => revoke(r)}
              >
                <Tooltip title="Revoke">
                  <Button type="text" size="small" danger icon={<Ban size={15} />} />
                </Tooltip>
              </ConfirmDialog>
            )}
          </div>
        );
      },
    },
  ];

  const total = rows.length;
  const pageStart = (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);
  const pagedRows = useMemo(() => {
    return rows.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  }, [rows, tablePage, tablePageSize]);

  return (
    <div className="onbi">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="onbi-header">
        <div className="onbi-header-about">
          <button 
            className="ob-mobile-menu-btn" 
            onClick={() => window.dispatchEvent(new Event('open-ob-sidebar'))}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="onbi-header-icon">
            <MailPlus size={20} />
          </div>
          <div>
            <div className="onbi-header-title">Invites</div>
            <div className="onbi-header-sub">
              Send tokenized onboarding links and track who has completed their details
            </div>
          </div>
        </div>
        <div className="onbi-header-actions">
          <Tooltip title="Refresh">
            <button type="button" className="onbi-ghost-btn" onClick={load} aria-label="Refresh">
              <RefreshCw size={15} className={loading ? 'onbi-spin' : ''} />
            </button>
          </Tooltip>
          {canCreateOnboarding && (
            <Button
              type="primary"
              icon={<UserPlus size={16} />}
              onClick={openCreate}
              className="onbi-add-btn"
            >
              Invite Employee
            </Button>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
      <div className="onbi-stats">
        {[
          { key: 'total', label: 'Total Invites', value: stats.total, icon: <Mail size={14} />, color: PALETTE.blue, tint: TINT.blue, period: 'sent' },
          { key: 'invited', label: 'Awaiting', value: stats.invited, icon: <Link2 size={14} />, color: PALETTE.blue, tint: TINT.blue, period: 'not started' },
          { key: 'submitted', label: 'Submitted', value: stats.submitted, icon: <ShieldCheck size={14} />, color: PALETTE.gold, tint: TINT.gold, period: 'to activate' },
          { key: 'completed', label: 'Completed', value: stats.completed, icon: <CheckCircle2 size={14} />, color: PALETTE.green, tint: TINT.green, period: 'active' },
        ].map((s) => (
          <div key={s.key} className="onbi-stat-card">
            <div className="onbi-stat-top">
              <div className="onbi-stat-left">
                <span className="onbi-stat-icon" style={{ background: s.tint, color: s.color }}>
                  {s.icon}
                </span>
                <span className="onbi-stat-label">{s.label}</span>
              </div>
            </div>
            <div className="onbi-stat-bottom">
              <span className="onbi-stat-value">{s.value}</span>
              <span className="onbi-stat-period">{s.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABLE ───────────────────────────────────────────────────────── */}
      <div className="onbi-table-wrap">
        <Table
          rowKey="inviteId"
          size="small"
          className="onbi-table"
          loading={loading}
          columns={columns}
          dataSource={pagedRows}
          pagination={false}
          onRow={() => ({ className: 'onbi-row' })}
          locale={{ emptyText: 'No invites yet — invite your first employee.' }}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Sticky footer pager */}
      {total > 0 && (
        <div className="bd2-pagination">
          <Text className="bd2-pagination-meta">
            <b>{pageStart}</b>–
            <b>{pageEnd}</b> of{' '}
            <b>{total}</b>{' '}
            {total === 1 ? 'invite' : 'invites'}
          </Text>
          <Pagination
            current={tablePage}
            pageSize={tablePageSize}
            total={total}
            onChange={(p, s) => {
              setTablePage(p);
              if (s) setTablePageSize(s);
            }}
            showSizeChanger
            pageSizeOptions={[10, 20, 25, 50, 100]}
            size="small"
          />
        </div>
      )}

      {/* ── CREATE DRAWER ───────────────────────────────────────────────── */}
      <Drawer
        title={null}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={580}
        closable={false}
        destroyOnClose
        styles={{
          body: { padding: 0, background: 'var(--bg-pure-white)' },
          header: { display: 'none' },
          mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' },
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          {/* Header */}
          <div
            style={{
              padding: '16px 18px 12px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-pure-white)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 0,
                  background: TINT.blue,
                  color: PALETTE.blue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <UserPlus size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-900)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  Invite Employee
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-slate-500)', fontWeight: 500 }}>
                  We’ll generate a private link they can use to fill in their own details
                </div>
              </div>
            </div>
            <Button
              type="text"
              shape="circle"
              icon={<X size={18} />}
              onClick={() => setDrawerOpen(false)}
              style={{ color: 'var(--text-slate-500)' }}
            />
          </div>

          {/* Content */}
          <div style={{ padding: 16, flex: 1, overflowY: 'auto', background: 'var(--bg-secondary, #f8fafc)' }}>
            <Form form={form} layout="vertical" requiredMark="optional" className="onbi-drawer-form">
              <SectionCard
                icon={<User size={16} />}
                tint={TINT.blue}
                color={PALETTE.blue}
                title="Employee Details"
                subtitle="The basics we need to create their draft profile"
                step="STEP 1"
              >
                <Row gutter={[20, 6]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      style={{ marginBottom: 18 }}
                      name="firstName"
                      label={fieldLabel('First name')}
                      rules={[
                        { required: true, message: 'First name is required' },
                        { pattern: /^[A-Za-z\s]+$/, message: 'No special characters allowed' }
                      ]}
                    >
                      <Input size="large" maxLength={80} placeholder="Jane" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      style={{ marginBottom: 18 }}
                      name="lastName"
                      label={fieldLabel('Last name')}
                      rules={[
                        { required: true, message: 'Last name is required' },
                        { pattern: /^[A-Za-z\s]+$/, message: 'No special characters allowed' }
                      ]}
                    >
                      <Input size="large" maxLength={80} placeholder="Doe" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      style={{ marginBottom: 18 }}
                      name="workEmail"
                      label={fieldLabel('Work email')}
                      rules={[
                        { required: true, message: 'Work email is required' },
                        { type: 'email', message: 'Enter a valid email address' },
                      ]}
                    >
                      <Input
                        size="large"
                        maxLength={160}
                        placeholder="jane.doe@company.com"
                        prefix={<Mail size={14} style={{ color: 'var(--text-slate-400)' }} />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      style={{ marginBottom: 18 }}
                      name="personalEmail"
                      label={fieldLabel('Personal email')}
                      rules={[{ type: 'email', message: 'Enter a valid email address' }]}
                    >
                      <Input
                        size="large"
                        maxLength={160}
                        placeholder="jane.doe@gmail.com"
                        prefix={<AtSign size={14} style={{ color: 'var(--text-slate-400)' }} />}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      style={{ marginBottom: 0 }}
                      name="mobile"
                      label={fieldLabel('Mobile')}
                      rules={[{ pattern: /^[0-9]{7,15}$/, message: 'Must be 7-15 digits' }]}
                    >
                      <Input
                        size="large"
                        maxLength={15}
                        placeholder="9876543210"
                        prefix={<Smartphone size={14} style={{ color: 'var(--text-slate-400)' }} />}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>
            </Form>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-pure-white)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              bottom: 0,
            }}
          >
            <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500 }}>
              Fields marked required must be filled
            </span>
            <Space size={10}>
              <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={submit}
                loading={saving}
                icon={<UserPlus size={16} />}
                style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}
              >
                Create Invite
              </Button>
            </Space>
          </div>
        </div>
      </Drawer>

      {/* ── EDIT DRAWER (name + emails) ─────────────────────────────────── */}
      <Drawer
        title={null}
        open={!!editing}
        onClose={() => setEditing(null)}
        width={460}
        closable={false}
        destroyOnClose
        styles={{
          body: { padding: 0, background: 'var(--bg-pure-white)' },
          header: { display: 'none' },
          mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' },
        }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          {/* Header */}
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{ width: 40, height: 40, background: TINT.blue, color: PALETTE.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Pencil size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1.2 }}>
                  Edit Details
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-slate-500)', fontWeight: 500 }}>
                  {editing ? `${editing.firstName} ${editing.lastName} · ${editing.employeeCode || ''}` : ''}
                </div>
              </div>
            </div>
            <Button type="text" shape="circle" icon={<X size={18} />} onClick={() => setEditing(null)} style={{ color: 'var(--text-slate-500)' }} />
          </div>

          {/* Content */}
          <div style={{ padding: 16, flex: 1, overflowY: 'auto', background: 'var(--bg-secondary, #f8fafc)' }}>
            <Form form={editForm} layout="vertical" requiredMark="optional" className="onbi-drawer-form">
              <SectionCard
                icon={<User size={16} />}
                tint={TINT.blue}
                color={PALETTE.blue}
                title="Employee Details"
                subtitle="Update the new hire's name and email addresses"
                step="EDIT"
              >
                <Row gutter={[20, 6]}>
                  <Col xs={24} sm={12}>
                    <Form.Item style={{ marginBottom: 18 }} name="firstName" label={fieldLabel('First name')} rules={[
                      { required: true, message: 'First name is required' },
                      { pattern: /^[A-Za-z\s]+$/, message: 'No special characters allowed' }
                    ]}>
                      <Input size="large" maxLength={80} placeholder="Jane" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item style={{ marginBottom: 18 }} name="lastName" label={fieldLabel('Last name')} rules={[
                      { required: true, message: 'Last name is required' },
                      { pattern: /^[A-Za-z\s]+$/, message: 'No special characters allowed' }
                    ]}>
                      <Input size="large" maxLength={80} placeholder="Doe" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item style={{ marginBottom: 18 }} name="workEmail" label={fieldLabel('Work email')} rules={[{ required: true, message: 'Work email is required' }, { type: 'email', message: 'Enter a valid email address' }]}>
                      <Input size="large" maxLength={160} placeholder="jane.doe@company.com" prefix={<Mail size={14} style={{ color: 'var(--text-slate-400)' }} />} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item style={{ marginBottom: 0 }} name="personalEmail" label={fieldLabel('Personal email')} rules={[{ type: 'email', message: 'Enter a valid email address' }]}>
                      <Input size="large" maxLength={160} placeholder="jane.doe@gmail.com" prefix={<AtSign size={14} style={{ color: 'var(--text-slate-400)' }} />} />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>
            </Form>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-pure-white)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
            <Button onClick={() => setEditing(null)} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>
              Cancel
            </Button>
            <Button type="primary" onClick={submitEdit} loading={editSaving} icon={<Pencil size={15} />} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: '0 18px' }}>
              Save Changes
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ── SHARE-LINK MODAL (link is shown only once) ──────────────────── */}
      <Modal
        open={!!created}
        onCancel={() => setCreated(null)}
        footer={null}
        width={460}
        centered
        title={null}
        styles={{ body: { padding: 0 } }}
        classNames={{ content: 'onbi-modal' }}
      >
        <div style={{ padding: '20px 22px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: TINT.green,
                color: PALETTE.green,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-900)' }}>Invite ready</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-slate-500)' }}>
                {created?.emailed && created?.emailedTo?.length
                  ? `We emailed the link to ${created.emailedTo.join(' and ')}. You can also copy it below — it’s shown only once.`
                  : 'Share this private link with the employee. It’s shown only once.'}
              </div>
            </div>
          </div>

          {created?.employeeCode && (
            <div style={{ fontSize: 12, color: 'var(--text-slate-500)', marginBottom: 10 }}>
              Employee code:{' '}
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-slate-700)' }}>
                {created.employeeCode}
              </span>
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-700)', marginBottom: 6 }}>
            Onboarding link
          </div>
          {createdLink ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                readOnly
                value={createdLink}
                onFocus={(e) => e.currentTarget.select()}
                prefix={<Link2 size={14} style={{ color: 'var(--text-slate-400)' }} />}
                style={{ fontSize: 12.5 }}
              />
              <Button
                type="primary"
                icon={<Copy size={15} />}
                onClick={() => copyLink(createdLink)}
                style={{ borderRadius: 6, fontWeight: 600, flexShrink: 0 }}
              >
                Copy link
              </Button>
            </div>
          ) : (
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--text-slate-500)',
                background: 'var(--bg-secondary, #f8fafc)',
                border: '1px solid var(--border-color)',
                padding: '10px 12px',
              }}
            >
              The invite was created, but no link was returned. You can revoke and re-create it if needed.
            </div>
          )}

          {created?.expiresAt && (
            <div style={{ fontSize: 11.5, color: 'var(--text-slate-400)', marginTop: 8 }}>
              Expires {fmtDate(created.expiresAt)}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 22px',
            marginTop: 14,
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary, #f8fafc)',
          }}
        >
          <Button onClick={() => setCreated(null)} style={{ borderRadius: 6, fontWeight: 600 }}>
            Done
          </Button>
        </div>
      </Modal>

      <style jsx global>{`
        .onbi { display: flex; flex-direction: column; flex: 1; min-height: 0; }

        /* Header */
        .onbi-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          margin: -12px -22px 14px; padding: 12px 24px 14px 28px; border-bottom: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          position: sticky; top: 0; z-index: 30;
        }
        .onbi-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .onbi-header-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: ${TINT.blue}; color: ${PALETTE.blue};
          display: inline-flex; align-items: center; justify-content: center;
        }
        .onbi-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .onbi-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .onbi-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .onbi-ghost-btn {
          width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .onbi-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .onbi-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .onbi-spin { animation: onbi-rot 0.9s linear infinite; }
        @keyframes onbi-rot { to { transform: rotate(360deg); } }

        /* Stat cards */
        .onbi-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .onbi-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 84px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .onbi-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .onbi-stat-left { display: flex; align-items: center; gap: 8px; }
        .onbi-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
        .onbi-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .onbi-stat-bottom { display: flex; align-items: baseline; gap: 8px; }
        .onbi-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .onbi-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        /* Table */
        .onbi-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0px; overflow: hidden; }
        .onbi-table .ant-table,
        .onbi-table .ant-table-container { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .onbi-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
        }
        [data-theme='dark'] .onbi-table .ant-table-thead > tr > th {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
          color: #94A3B8 !important;
        }
        .onbi-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .onbi-table .ant-table-tbody > tr > td { padding: 8px 12px !important; border-bottom: 1px solid var(--border-slate-100) !important; }
        .onbi-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .onbi-table .ant-table-tbody > tr.onbi-row:hover > td { background: var(--bg-slate-50) !important; }

        /* Sticky pagination */
        .bd2-pagination {
          position: sticky;
          bottom: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: auto -22px 0;
          padding: 12px 28px;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-100);
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.02);
        }
        [data-theme='dark'] .bd2-pagination {
          background: #0d1117 !important;
          border-top-color: #1f2937 !important;
        }
        .bd2-pagination-meta {
          font-size: 11.5px !important;
          font-weight: 500 !important;
          color: var(--text-slate-500) !important;
          letter-spacing: -0.005em;
        }
        .bd2-pagination-meta b {
          color: var(--text-slate-900);
          font-weight: 800;
        }
        [data-theme='dark'] .bd2-pagination-meta b {
          color: #f1f5f9 !important;
        }
        .onbi-table .ant-pagination { margin: 12px 12px 8px !important; }

        /* Drawer form fields — outlined white, 40px, blue focus ring */
        .onbi-drawer-form .ant-input-affix-wrapper,
        .onbi-drawer-form .ant-input-affix-wrapper-lg,
        .onbi-drawer-form input.ant-input-lg,
        .onbi-drawer-form .ant-input-lg {
          height: 40px;
          border-radius: 6px !important;
          background: var(--bg-pure-white) !important;
          border: 1px solid var(--border-color) !important;
          box-shadow: none !important;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .onbi-drawer-form .ant-input-affix-wrapper:hover,
        .onbi-drawer-form .ant-input:hover { border-color: #93c5fd !important; }
        .onbi-drawer-form .ant-input-affix-wrapper-focused,
        .onbi-drawer-form .ant-input-focused,
        .onbi-drawer-form .ant-input:focus {
          border-color: ${PALETTE.blue} !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.10) !important;
        }
        /* The input INSIDE an affix wrapper must not draw its own box —
           the wrapper owns the border, height and focus ring. */
        .onbi-drawer-form .ant-input-affix-wrapper > input.ant-input {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          height: auto !important;
        }
        .onbi-drawer-form .ant-input-affix-wrapper { align-items: center; padding-top: 0; padding-bottom: 0; }
        .onbi-drawer-form .ant-input-affix-wrapper .ant-input-prefix { margin-inline-end: 8px; }
        /* antd's auto "(optional)" mark — keep it subtle. */
        .onbi-drawer-form .ant-form-item-optional {
          color: var(--text-slate-400) !important; font-weight: 500; font-size: 11.5px;
        }

        /* Share-link modal — square premium look */
        .onbi-modal { border-radius: 0 !important; padding: 0 !important; overflow: hidden; }

        @media (max-width: 900px) {
          .onbi-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 14px 16px;
            gap: 12px;
          }
          .onbi-header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .onbi-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default function OnboardingInvitesPage() {
  return (
    <OnboardingGuard itemKey="invites">
      <InvitesContent />
    </OnboardingGuard>
  );
}
