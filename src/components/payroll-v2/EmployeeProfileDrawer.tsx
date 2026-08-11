'use client';
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect, useState } from 'react';
import { Button, Input, Select, Drawer, Avatar, message, Space } from 'antd';
import { CloseOutlined, IdcardOutlined, BankOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PayrollV2Service, { MemberOption, TaxRegime, UpsertProfileInput } from '@/services/payrollV2Service';


const PALETTE = { slate: '#64748B', green: '#10B981', blue: '#3B82F6', violet: '#8B5CF6' } as const;
const TINT = { slate: 'rgba(100,116,139,0.12)', green: 'rgba(16,185,129,0.10)', blue: 'rgba(59,130,246,0.10)', violet: 'rgba(139,92,246,0.10)' } as const;

const EMPTY: UpsertProfileInput = {
  pan: '', uan: '', pfNumber: '', esiNumber: '', taxRegime: 'new',
  accountHolderName: '', bankName: '', bankAccountNumber: '', bankIfsc: '' };

const initials = (name: string) => name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

function SectionCard({ icon, tint, color, title, subtitle, children }: { icon: React.ReactNode; tint: string; color: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="epd-card">
      <div className="epd-card-head">
        <div className="epd-card-chip" style={{ background: tint, color }}>{icon}</div>
        <div><div className="epd-card-title">{title}</div><div className="epd-card-sub">{subtitle}</div></div>
      </div>
      <div className="epd-rows">{children}</div>
    </div>
  );
}
// Divided settings row (General-Settings style): label + hint on the left,
// control on the right.
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="epd-frow">
      <div className="epd-frow-meta">
        <div className="epd-frow-label">{label}</div>
        {hint && <div className="epd-frow-hint">{hint}</div>}
      </div>
      <div className="epd-frow-ctrl">{children}</div>
    </div>
  );
}

export default function EmployeeProfileDrawer({
  open, employee, canEdit, onClose, onSaved }: {
  open: boolean;
  employee: MemberOption | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpsertProfileInput>(EMPTY);

  useEffect(() => {
    if (!open || !employee) return;
    setLoading(true);
    PayrollV2Service.getEmployeeProfile(employee.value)
      .then((p) => {
        setForm(p ? {
          pan: p.pan ?? '', uan: p.uan ?? '', pfNumber: p.pfNumber ?? '', esiNumber: p.esiNumber ?? '',
          taxRegime: p.taxRegime, accountHolderName: p.accountHolderName ?? '', bankName: p.bankName ?? '',
          bankAccountNumber: p.bankAccountNumber ?? '', bankIfsc: p.bankIfsc ?? '' } : { ...EMPTY, accountHolderName: employee.label });
      })
      .catch(() => message.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [open, employee]);

  const set = <K extends keyof UpsertProfileInput>(k: K, v: UpsertProfileInput[K]) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!employee) return;
    setSaving(true);
    try {
      await PayrollV2Service.upsertEmployeeProfile(employee.value, form);
      message.success('Profile saved');
      onSaved();
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to save profile');
    } finally { setSaving(false); }
  };

  return (
    <Drawer title={null} open={open} onClose={onClose} width={760} closable={false} destroyOnClose
      styles={{ body: { padding: 0 }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
        <div className="epd-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <Avatar size={40} src={employee?.avatarUrl || undefined} style={{ background: TINT.slate, color: PALETTE.slate, fontWeight: 700, flexShrink: 0 }}>
              {employee && !employee.avatarUrl && initials(employee.label)}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <div className="epd-title">{employee?.label}</div>
              <div className="epd-sub">Statutory IDs &amp; bank account</div>
            </div>
          </div>
          <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={onClose} />
        </div>

        <div className="epd-body">
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><LoadingSpinner fullScreen={false} /></div> : (
            <>
              <SectionCard icon={<SafetyCertificateOutlined />} tint={TINT.violet} color={PALETTE.violet} title="Statutory IDs" subtitle="Identity & compliance numbers">
                <Field label="PAN" hint="10-character income-tax PAN"><Input value={form.pan ?? ''} maxLength={10} onChange={(e) => set('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" style={{ fontFamily: 'monospace' }} /></Field>
                <Field label="Tax regime" hint="Determines income-tax computation">
                  <Select value={form.taxRegime} onChange={(v) => set('taxRegime', v as TaxRegime)} style={{ width: '100%' }}
                    options={[{ value: 'new', label: 'New regime' }, { value: 'old', label: 'Old regime' }]} />
                </Field>
                <Field label="UAN (PF)" hint="Universal Account Number"><Input value={form.uan ?? ''} maxLength={20} onChange={(e) => set('uan', e.target.value)} placeholder="100200300400" /></Field>
                <Field label="PF number" hint="EPF member ID"><Input value={form.pfNumber ?? ''} maxLength={30} onChange={(e) => set('pfNumber', e.target.value)} placeholder="KA/BNG/0012345/678" /></Field>
                <Field label="ESI number" hint="ESIC insurance number"><Input value={form.esiNumber ?? ''} maxLength={30} onChange={(e) => set('esiNumber', e.target.value)} placeholder="3100012345" /></Field>
              </SectionCard>

              <SectionCard icon={<BankOutlined />} tint={TINT.green} color={PALETTE.green} title="Salary Bank Account" subtitle="Where this employee is paid">
                <Field label="Account holder name" hint="As printed on the bank record"><Input value={form.accountHolderName ?? ''} maxLength={120} onChange={(e) => set('accountHolderName', e.target.value)} placeholder="As per bank records" /></Field>
                <Field label="Bank name" hint="Bank the salary account is held with"><Input value={form.bankName ?? ''} maxLength={160} onChange={(e) => set('bankName', e.target.value)} placeholder="e.g. HDFC Bank" prefix={<BankOutlined style={{ color: 'var(--text-slate-400)' }} />} /></Field>
                <Field label="IFSC" hint="11-character branch IFSC"><Input value={form.bankIfsc ?? ''} maxLength={20} onChange={(e) => set('bankIfsc', e.target.value.toUpperCase())} placeholder="HDFC0001234" style={{ fontFamily: 'monospace' }} /></Field>
                <Field label="Account number" hint="Salary account credited each cycle"><Input value={form.bankAccountNumber ?? ''} maxLength={40} onChange={(e) => set('bankAccountNumber', e.target.value)} placeholder="50100123456789" /></Field>
              </SectionCard>
            </>
          )}
        </div>

        <div className="epd-foot">
          <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)' }}>Used by payslips & bank-file export</span>
          <Space size={10}>
            <Button onClick={onClose} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>Cancel</Button>
            {canEdit && <Button type="primary" loading={saving} onClick={save} icon={<CheckCircleOutlined />} style={{ height: 38, borderRadius: 6, fontWeight: 600 }}>Save Profile</Button>}
          </Space>
        </div>
      </div>

      <style jsx global>{`
        .epd-head { padding: 16px 18px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10; background: var(--bg-pure-white); }
        .epd-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2; }
        .epd-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }
        .epd-body { padding: 16px; flex: 1; overflow-y: auto; background: var(--bg-secondary, #f8fafc); display: flex; flex-direction: column; gap: 14px; }
        .epd-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; overflow: hidden; }
        .epd-card-head { display: flex; align-items: center; gap: 11px; padding: 14px 20px; border-bottom: 1px solid var(--border-slate-100); }
        .epd-card-chip { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .epd-card-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .epd-card-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; }
        .epd-rows { padding: 4px 20px 8px; }
        .epd-frow { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 13px 0; border-bottom: 1px solid var(--border-slate-100); }
        .epd-frow:last-child { border-bottom: none; }
        .epd-frow-meta { min-width: 0; flex: 1; }
        .epd-frow-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .epd-frow-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 3px; line-height: 1.35; }
        .epd-frow-ctrl { width: 340px; flex-shrink: 0; }
        @media (max-width: 640px) { .epd-frow { flex-direction: column; align-items: stretch; gap: 8px; } .epd-frow-ctrl { width: 100%; } }
        .epd-body .ant-input, .epd-body .ant-input-affix-wrapper, .epd-body .ant-select-selector { border-radius: 6px !important; }
        .epd-foot { padding: 14px 22px; border-top: 1px solid var(--border-color); background: var(--bg-pure-white); display: flex; justify-content: space-between; align-items: center; position: sticky; bottom: 0; }
      `}</style>
    </Drawer>
  );
}
