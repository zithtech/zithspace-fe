'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Switch, Select, ColorPicker, Drawer, Upload, message } from 'antd';
import { FileCog, Save, RotateCcw, Palette, ListChecks, Landmark, Banknote, LayoutTemplate, Check, Eye, EyeOff, Building2, UserRound, ImageUp, Trash2, Menu } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import PayrollV2Service, {

  PayslipTemplate, BankSettings, UpdatePayslipTemplateInput, UpdateBankSettingsInput, PaymentMode, BankFileFormat, PayslipTemplateStyle
} from '@/services/payrollV2Service';
import ZukvoLoader from '../common/ZukvoLoader';

const PALETTE = { pink: '#EC4899', blue: '#3B82F6', green: '#10B981', violet: '#8B5CF6', amber: '#F59E0B' } as const;
const TINT = { pink: 'rgba(236,72,153,0.10)', blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', violet: 'rgba(139,92,246,0.10)', amber: 'rgba(245,158,11,0.10)' } as const;

type View = 'payslip' | 'bank';

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'neft', label: 'NEFT' }, { value: 'imps', label: 'IMPS' }, { value: 'rtgs', label: 'RTGS' },
];
const BANK_FORMATS: { value: BankFileFormat; label: string }[] = [
  { value: 'generic_csv', label: 'Generic CSV' }, { value: 'hdfc', label: 'HDFC Bank' }, { value: 'icici', label: 'ICICI Bank' },
  { value: 'sbi', label: 'State Bank of India' }, { value: 'axis', label: 'Axis Bank' }, { value: 'kotak', label: 'Kotak Mahindra' },
];

const EMPTY_TPL: UpdatePayslipTemplateInput = {
  templateStyle: 'modern', showLogo: true, logoUrl: null, companyName: '', companyAddress: '',
  accentColor: '#3B82F6', footerNote: '', netPayInWords: true,
  showEmployeeCode: true, showEmail: true, showDesignation: true, showDepartment: true,
  showGrade: false, showLocation: false, showDateOfJoining: true, showBankName: true,
  showPan: true, showUan: true, showPfNumber: true, showEsiNumber: true, showBankAccount: true,
  showYtd: false, showLeaveBalance: true, showAttendanceSummary: false
};

const TEMPLATE_OPTIONS: { value: PayslipTemplateStyle; label: string; blurb: string }[] = [
  { value: 'modern', label: 'Modern', blurb: 'Summary cards, net-pay highlight & YTD columns' },
  { value: 'classic', label: 'Classic', blurb: 'Stacked earnings / deductions / reimbursements' },
  { value: 'minimal', label: 'Minimal', blurb: 'Compact, single design with an accent header' },
];
// Quick-pick accent palette for the branding card (custom colours still available via the picker).
const ACCENT_PRESETS = ['#0F172A', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#14B8A6', '#0EA5E9'];

const EMPTY_BANK: UpdateBankSettingsInput = {
  companyBankName: '', companyAccountNumber: '', companyIfsc: '', paymentMode: 'neft', bankFileFormat: 'generic_csv'
};

function tplToForm(t: PayslipTemplate): UpdatePayslipTemplateInput {
  return {
    templateStyle: t.templateStyle, showLogo: t.showLogo, logoUrl: t.logoUrl ?? null,
    companyName: t.companyName ?? '', companyAddress: t.companyAddress ?? '',
    accentColor: t.accentColor, footerNote: t.footerNote ?? '', netPayInWords: t.netPayInWords,
    showEmployeeCode: t.showEmployeeCode, showEmail: t.showEmail, showDesignation: t.showDesignation, showDepartment: t.showDepartment,
    showGrade: t.showGrade, showLocation: t.showLocation, showDateOfJoining: t.showDateOfJoining, showBankName: t.showBankName,
    showPan: t.showPan, showUan: t.showUan, showPfNumber: t.showPfNumber, showEsiNumber: t.showEsiNumber,
    showBankAccount: t.showBankAccount, showYtd: t.showYtd, showLeaveBalance: t.showLeaveBalance, showAttendanceSummary: t.showAttendanceSummary
  };
}
function bankToForm(b: BankSettings): UpdateBankSettingsInput {
  return { companyBankName: b.companyBankName ?? '', companyAccountNumber: b.companyAccountNumber ?? '', companyIfsc: b.companyIfsc ?? '', paymentMode: b.paymentMode, bankFileFormat: b.bankFileFormat };
}

function SectionCard({ icon, tint, color, title, subtitle, children }: { icon: React.ReactNode; tint: string; color: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="pvpb-card">
      <div className="pvpb-card-head">
        <div className="pvpb-card-chip" style={{ background: tint, color }}>{icon}</div>
        <div><div className="pvpb-card-title">{title}</div><div className="pvpb-card-sub">{subtitle}</div></div>
      </div>
      <div className="pvpb-card-body">{children}</div>
    </section>
  );
}
function ToggleItem({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="pvpb-toggle">
      <div><div className="pvpb-tg-title">{label}</div><div className="pvpb-tg-desc">{desc}</div></div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

// Settings row: label + hint on the left, control on the right (premium form style).
function FormRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="pvpb-frow">
      <div className="pvpb-brand-meta"><div className="pvpb-label">{label}</div><div className="pvpb-hint">{hint}</div></div>
      <div className="pvpb-frow-ctrl">{children}</div>
    </div>
  );
}

// A tiny stylised preview of each payslip layout (not the real PDF — just a hint
// of the structure so the user can pick).
function TemplateThumb({ style, accent }: { style: PayslipTemplateStyle; accent: string }) {
  const a = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : '#3B82F6';
  const line = (w: string, c = '#cbd5e1', h = 4) => <div style={{ width: w, height: h, borderRadius: 2, background: c }} />;
  const box = (children: React.ReactNode, extra: React.CSSProperties = {}) => (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: 5, display: 'flex', flexDirection: 'column', gap: 4, ...extra }}>{children}</div>
  );
  return (
    <div className="pvpb-thumb">
      {style === 'modern' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${a}`, paddingBottom: 5 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: `${a}33` }} />{line('34px', '#94a3b8')}</div>
            {line('26px', '#cbd5e1')}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>{line('90%')}{line('70%')}{line('80%')}</div>
            <div style={{ width: 52, borderRadius: 4, border: `1px solid ${a}66`, background: `${a}14`, borderLeft: `3px solid ${a}`, padding: 4 }}>{line('60%', a, 5)}{line('40%', '#cbd5e1')}</div>
          </div>
          {box(<div style={{ display: 'flex', gap: 6 }}><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>{line('100%')}{line('100%')}</div><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>{line('100%')}{line('100%')}</div></div>, { marginTop: 5 })}
          <div style={{ marginTop: 5, height: 12, borderRadius: 4, background: `${a}18`, border: `1px solid ${a}44` }} />
        </>
      )}
      {style === 'classic' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${a}55`, paddingBottom: 5 }}>{line('40px', '#94a3b8')}<div style={{ width: 10, height: 10, borderRadius: 5, background: `${a}44` }} /></div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>{line('50px', a, 6)}</div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ marginTop: 4 }}>
              <div style={{ borderBottom: `2px solid ${a}`, paddingBottom: 3, marginBottom: 3 }}>{line('30px', a)}</div>
              {line('100%')}{<div style={{ height: 4 }} />}{line('100%', '#e2e8f0')}
            </div>
          ))}
        </>
      )}
      {style === 'minimal' && (
        <>
          <div style={{ height: 20, borderRadius: 4, background: a, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px' }}>{line('30px', '#ffffffcc')}{line('20px', '#ffffff88')}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 4, padding: 5, marginTop: 5 }}><div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{line('40px', '#94a3b8')}{line('26px')}</div>{line('34px', a, 6)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>{line('40%', a)}{line('100%')}{line('100%')}</div><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>{line('40%', a)}{line('100%')}{line('100%')}</div></div>
          <div style={{ marginTop: 6, height: 11, borderRadius: 4, background: `${a}18`, border: `1px solid ${a}44` }} />
        </>
      )}
    </div>
  );
}

export default function PayslipBankPanel() {
  const { canUpdatePayrollPayslipBank } = usePermission();
  const [view, setView] = useState<View>('payslip');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tpl, setTpl] = useState<UpdatePayslipTemplateInput>(EMPTY_TPL);
  const [tplSaved, setTplSaved] = useState<UpdatePayslipTemplateInput>(EMPTY_TPL);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLabel, setPreviewLabel] = useState('');
  const [previewStyle, setPreviewStyle] = useState<PayslipTemplateStyle>('modern');
  const [previewing, setPreviewing] = useState(false);
  const [bank, setBank] = useState<UpdateBankSettingsInput>(EMPTY_BANK);
  const [bankSaved, setBankSaved] = useState<UpdateBankSettingsInput>(EMPTY_BANK);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, b] = await Promise.all([PayrollV2Service.getPayslipTemplate(), PayrollV2Service.getBankSettings()]);
      const tf = tplToForm(t); const bf = bankToForm(b);
      setTpl(tf); setTplSaved(tf); setBank(bf); setBankSaved(bf);
    } catch {
      message.error('Failed to load payslip & bank settings');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const tplDirty = useMemo(() => JSON.stringify(tpl) !== JSON.stringify(tplSaved), [tpl, tplSaved]);
  const bankDirty = useMemo(() => JSON.stringify(bank) !== JSON.stringify(bankSaved), [bank, bankSaved]);
  const dirty = view === 'payslip' ? tplDirty : bankDirty;

  const setTplField = <K extends keyof UpdatePayslipTemplateInput>(k: K, v: UpdatePayslipTemplateInput[K]) => setTpl((p) => ({ ...p, [k]: v }));
  const setBankField = <K extends keyof UpdateBankSettingsInput>(k: K, v: UpdateBankSettingsInput[K]) => setBank((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (view === 'payslip') { const s = await PayrollV2Service.updatePayslipTemplate(tpl); const f = tplToForm(s); setTpl(f); setTplSaved(f); }
      else { const s = await PayrollV2Service.updateBankSettings(bank); const f = bankToForm(s); setBank(f); setBankSaved(f); }
      message.success('Settings saved');
    } catch {
      message.error('Failed to save settings');
    } finally { setSaving(false); }
  };
  const reset = () => (view === 'payslip' ? setTpl(tplSaved) : setBank(bankSaved));

  // Fetch the sample HTML for a given style + branding config (reflects unsaved edits).
  const renderPreview = useCallback(async (style: PayslipTemplateStyle, cfg: UpdatePayslipTemplateInput) => {
    setPreviewing(true); setPreviewHtml('');
    try {
      setPreviewHtml(await PayrollV2Service.previewPayslipTemplate({ ...cfg, templateStyle: style }));
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to load preview'); }
    finally { setPreviewing(false); }
  }, []);

  const openPreview = (style: PayslipTemplateStyle, label: string) => {
    setPreviewStyle(style); setPreviewLabel(label); setPreviewOpen(true);
    renderPreview(style, tpl);
  };

  // Change accent from inside the preview drawer — updates branding + live-refreshes the slip.
  const setPreviewAccent = (hex: string) => {
    const next = { ...tpl, accentColor: hex };
    setTpl(next);
    renderPreview(previewStyle, next);
  };

  // Upload a payslip logo → R2, then set its URL on the (unsaved) template form.
  const [logoUploading, setLogoUploading] = useState(false);
  const uploadLogo = async (file: File) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) { message.error('Use a PNG, JPG, WEBP or GIF image'); return; }
    if (file.size > 2 * 1024 * 1024) { message.error('Logo must be under 2 MB'); return; }
    setLogoUploading(true);
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const url = await PayrollV2Service.uploadPayslipLogo(dataUri);
      setTplField('logoUrl', url);
      message.success('Logo uploaded');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to upload logo');
    } finally { setLogoUploading(false); }
  };

  const accent = /^#[0-9a-fA-F]{6}$/.test(tpl.accentColor ?? '') ? (tpl.accentColor as string) : '#3B82F6';

  return (
    <div className="pvpb-page">
      <div className="pvpb-header">
        <div className="pvpb-header-about">
          <button
            type="button"
            className="pv-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-pv-sidebar'))}
          >
            <Menu size={20} />
          </button>
          <div className="pvpb-head-chip" style={{ background: TINT.pink, color: PALETTE.pink }}><FileCog size={20} /></div>
          <div className="pvpb-head-text">
            <div className="pvpb-head-title">Payslip &amp; Bank</div>
            <div className="pvpb-head-sub">Payslip appearance and salary-disbursement settings</div>
          </div>
        </div>
        <div className="pvpb-head-actions">
          <Button icon={<RotateCcw size={15} />} onClick={reset} disabled={!dirty || saving}>Reset</Button>
          {canUpdatePayrollPayslipBank && <Button type="primary" icon={<Save size={15} />} loading={saving} disabled={!dirty} onClick={save}>Save Changes</Button>}
        </div>
      </div>

      <div className="pvpb-tabs">
        <button type="button" className={`pvpb-tab ${view === 'payslip' ? 'is-active' : ''}`} onClick={() => setView('payslip')}>
          <FileCog size={15} /><span>Payslip Template</span>
        </button>
        <button type="button" className={`pvpb-tab ${view === 'bank' ? 'is-active' : ''}`} onClick={() => setView('bank')}>
          <Banknote size={15} /><span>Bank &amp; Disbursement</span>
        </button>
      </div>

      {loading ? (
        <div className="pvpb-loading"><ZukvoLoader size="md" /></div>
      ) : view === 'payslip' ? (
        <div className="pvpb-sections">
          <SectionCard icon={<LayoutTemplate size={16} />} tint={TINT.pink} color={PALETTE.pink} title="Payslip Template" subtitle="Choose one design — all generated payslips use it">
            <div className="pvpb-tpl-grid">
              {TEMPLATE_OPTIONS.map((o) => {
                const selected = tpl.templateStyle === o.value;
                return (
                  <div key={o.value} role="button" tabIndex={0} className={`pvpb-tpl-card ${selected ? 'is-sel' : ''}`} onClick={() => setTplField('templateStyle', o.value)}>
                    {selected && <span className="pvpb-tpl-check"><Check size={13} /></span>}
                    <TemplateThumb style={o.value} accent={tpl.accentColor} />
                    <div className="pvpb-tpl-name">{o.label}</div>
                    <div className="pvpb-tpl-blurb">{o.blurb}</div>
                    <button type="button" className="pvpb-tpl-preview" onClick={(e) => { e.stopPropagation(); openPreview(o.value, o.label); }}>
                      <Eye size={13} /> Preview
                    </button>
                  </div>
                );
              })}
            </div>
          </SectionCard>
          <SectionCard icon={<Palette size={16} />} tint={TINT.violet} color={PALETTE.violet} title="Branding" subtitle="How the payslip looks">
            <div className="pvpb-brand">
              {/* Company name */}
              <div className="pvpb-brand-row">
                <div className="pvpb-brand-meta">
                  <div className="pvpb-label">Company name</div>
                  <div className="pvpb-hint">Printed on the payslip header. Leave blank to use your workspace name.</div>
                </div>
                <Input style={{ width: 300 }} maxLength={160} placeholder="e.g. Acme Technologies Pvt Ltd" value={tpl.companyName ?? ''} onChange={(e) => setTplField('companyName', e.target.value)} />
              </div>

              {/* Company address */}
              <div className="pvpb-brand-note">
                <div className="pvpb-label">Company address</div>
                <div className="pvpb-hint" style={{ marginBottom: 6 }}>Shown under the company name on the payslip.</div>
                <Input.TextArea rows={2} maxLength={400} placeholder="e.g. Level 4, Prestige Tech Park, Bengaluru 560103" value={tpl.companyAddress ?? ''} onChange={(e) => setTplField('companyAddress', e.target.value)} />
              </div>

              {/* Company logo — upload + preview */}
              <div className="pvpb-brand-row">
                <div className="pvpb-brand-logo">
                  <div className="pvpb-logo-preview" style={{
                    ...(tpl.logoUrl
                      ? { background: '#fff', borderStyle: 'solid', borderColor: 'var(--border-slate-200)', padding: 6 }
                      : (tpl.showLogo ? { background: `${accent}14`, borderColor: `${accent}40`, color: accent } : {})),
                    opacity: tpl.showLogo ? 1 : 0.45
                  }}>
                    {tpl.logoUrl ? <img src={tpl.logoUrl} alt="Company logo" /> : (tpl.showLogo ? <Building2 size={22} /> : <EyeOff size={18} />)}
                  </div>
                  <div className="pvpb-brand-meta">
                    <div className="pvpb-label">Company logo</div>
                    <div className="pvpb-hint">{tpl.logoUrl ? 'Shown on the payslip header · PNG, JPG, WEBP or GIF, up to 2 MB' : 'Upload a logo, or a monogram is auto-generated from the name · up to 2 MB'}</div>
                    <div className="pvpb-logo-actions">
                      <Upload accept="image/png,image/jpeg,image/webp,image/gif" showUploadList={false} beforeUpload={(f) => { uploadLogo(f as File); return false; }}>
                        <Button size="small" icon={<ImageUp size={14} />} loading={logoUploading}>{tpl.logoUrl ? 'Replace' : 'Upload logo'}</Button>
                      </Upload>
                      {tpl.logoUrl && <Button size="small" type="text" danger icon={<Trash2 size={14} />} onClick={() => setTplField('logoUrl', null)}>Remove</Button>}
                    </div>
                  </div>
                </div>
                <Switch checked={tpl.showLogo} onChange={(v) => setTplField('showLogo', v)} />
              </div>

              {/* Accent colour — preset swatches + custom picker */}
              <div className="pvpb-brand-row">
                <div className="pvpb-brand-meta">
                  <div className="pvpb-label">Accent colour</div>
                  <div className="pvpb-hint">Used for headings, highlights &amp; the net-pay banner</div>
                </div>
                <div className="pvpb-accent">
                  <div className="pvpb-swatches">
                    {ACCENT_PRESETS.map((c) => {
                      const sel = accent.toLowerCase() === c.toLowerCase();
                      return (
                        <button key={c} type="button" title={c} aria-label={c} onClick={() => setTplField('accentColor', c)}
                          className={`pvpb-swatch ${sel ? 'is-sel' : ''}`} style={{ background: c }}>
                          {sel && <Check size={13} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                  <ColorPicker value={tpl.accentColor} onChange={(_, hex) => setTplField('accentColor', hex)} showText format="hex" />
                </div>
              </div>

              {/* Net pay in words */}
              <div className="pvpb-brand-row">
                <div className="pvpb-brand-meta">
                  <div className="pvpb-label">Net pay in words</div>
                  <div className="pvpb-hint">Print the take-home amount spelled out in full</div>
                </div>
                <Switch checked={tpl.netPayInWords} onChange={(v) => setTplField('netPayInWords', v)} />
              </div>

              {/* Footer note */}
              <div className="pvpb-brand-note">
                <div className="pvpb-label">Footer note</div>
                <Input.TextArea rows={2} maxLength={500} placeholder="e.g. This is a computer-generated payslip and needs no signature." value={tpl.footerNote ?? ''} onChange={(e) => setTplField('footerNote', e.target.value)} />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<UserRound size={16} />} tint={TINT.amber} color={PALETTE.amber} title="Employee Details" subtitle="Which identity fields print on the payslip — name always shows">
            <div className="pvpb-toggles">
              <ToggleItem label="Employee code" desc="Employee ID / code" checked={tpl.showEmployeeCode} onChange={(v) => setTplField('showEmployeeCode', v)} />
              <ToggleItem label="Designation" desc="Job title / position" checked={tpl.showDesignation} onChange={(v) => setTplField('showDesignation', v)} />
              <ToggleItem label="Department" desc="Department name" checked={tpl.showDepartment} onChange={(v) => setTplField('showDepartment', v)} />
              <ToggleItem label="Grade" desc="Pay grade / level" checked={tpl.showGrade} onChange={(v) => setTplField('showGrade', v)} />
              <ToggleItem label="Location" desc="Work location" checked={tpl.showLocation} onChange={(v) => setTplField('showLocation', v)} />
              <ToggleItem label="Email" desc="Work email address" checked={tpl.showEmail} onChange={(v) => setTplField('showEmail', v)} />
              <ToggleItem label="Date of joining" desc="Employment start date" checked={tpl.showDateOfJoining} onChange={(v) => setTplField('showDateOfJoining', v)} />
              <ToggleItem label="Bank name" desc="Employee's bank name" checked={tpl.showBankName} onChange={(v) => setTplField('showBankName', v)} />
            </div>
          </SectionCard>

          <SectionCard icon={<ListChecks size={16} />} tint={TINT.blue} color={PALETTE.blue} title="Statutory & Other Fields" subtitle="Tax IDs and additional sections on the payslip">
            <div className="pvpb-toggles">
              <ToggleItem label="PAN" desc="Employee PAN number" checked={tpl.showPan} onChange={(v) => setTplField('showPan', v)} />
              <ToggleItem label="UAN" desc="Universal Account Number" checked={tpl.showUan} onChange={(v) => setTplField('showUan', v)} />
              <ToggleItem label="PF number" desc="Provident fund number" checked={tpl.showPfNumber} onChange={(v) => setTplField('showPfNumber', v)} />
              <ToggleItem label="ESI number" desc="ESI number" checked={tpl.showEsiNumber} onChange={(v) => setTplField('showEsiNumber', v)} />
              <ToggleItem label="Bank account" desc="Masked bank account" checked={tpl.showBankAccount} onChange={(v) => setTplField('showBankAccount', v)} />
              <ToggleItem label="Year-to-date (YTD)" desc="Cumulative earnings & deductions" checked={tpl.showYtd} onChange={(v) => setTplField('showYtd', v)} />
              <ToggleItem label="Leave balance" desc="Available leave summary" checked={tpl.showLeaveBalance} onChange={(v) => setTplField('showLeaveBalance', v)} />
              <ToggleItem label="Attendance summary" desc="Worked / LOP days" checked={tpl.showAttendanceSummary} onChange={(v) => setTplField('showAttendanceSummary', v)} />
            </div>
          </SectionCard>
        </div>
      ) : (
        <div className="pvpb-sections">
          <SectionCard icon={<Landmark size={16} />} tint={TINT.green} color={PALETTE.green} title="Company Disbursement Account" subtitle="The account salaries are paid from">
            <div className="pvpb-brand">
              <FormRow label="Bank name" hint="Bank the company salary account is held with">
                <Input value={bank.companyBankName ?? ''} onChange={(e) => setBankField('companyBankName', e.target.value)} placeholder="e.g. HDFC Bank" prefix={<Landmark size={14} style={{ color: 'var(--text-slate-400)' }} />} />
              </FormRow>
              <FormRow label="Account number" hint="Company salary account the batch is debited from">
                <Input value={bank.companyAccountNumber ?? ''} onChange={(e) => setBankField('companyAccountNumber', e.target.value)} placeholder="e.g. 50200012345678" />
              </FormRow>
              <FormRow label="IFSC code" hint="11-character IFSC of the account's branch">
                <Input value={bank.companyIfsc ?? ''} onChange={(e) => setBankField('companyIfsc', e.target.value.toUpperCase())} placeholder="e.g. HDFC0001234" style={{ fontFamily: 'monospace' }} />
              </FormRow>
            </div>
          </SectionCard>

          <SectionCard icon={<Banknote size={16} />} tint={TINT.amber} color={PALETTE.amber} title="Disbursement" subtitle="Payment method and bank-file format">
            <div className="pvpb-brand">
              <FormRow label="Payment mode" hint="How salaries are transferred to employees">
                <Select value={bank.paymentMode} onChange={(v) => setBankField('paymentMode', v)} options={PAYMENT_MODES} style={{ width: '100%' }} />
              </FormRow>
              <FormRow label="Bank file format" hint="Layout of the exported bank-upload file">
                <Select value={bank.bankFileFormat} onChange={(v) => setBankField('bankFileFormat', v)} options={BANK_FORMATS} style={{ width: '100%' }} />
              </FormRow>
            </div>
          </SectionCard>
        </div>
      )}

      <Drawer
        open={previewOpen} onClose={() => setPreviewOpen(false)} width={880}
        title={(
          <div className="pvpb-pv-head">
            <div className="pvpb-pv-title">
              <span className="pvpb-pv-chip" style={{ background: TINT.pink, color: PALETTE.pink }}><Eye size={15} /></span>
              <span className="pvpb-pv-name">Payslip preview · {previewLabel}</span>
              <span className="pvpb-pv-badge">example data</span>
            </div>
            <div className="pvpb-pv-accent">
              <span className="pvpb-pv-accent-lbl">Accent</span>
              <div className="pvpb-swatches">
                {ACCENT_PRESETS.map((c) => {
                  const sel = accent.toLowerCase() === c.toLowerCase();
                  return (
                    <button key={c} type="button" title={c} aria-label={c} onClick={() => setPreviewAccent(c)}
                      className={`pvpb-swatch ${sel ? 'is-sel' : ''}`} style={{ background: c }}>
                      {sel && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        styles={{ header: { padding: '12px 20px' }, body: { padding: 16, background: '#e5e7eb' } }}
      >
        {previewing ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><ZukvoLoader size="md" /></div>
        ) : (
          <iframe title="Payslip preview" srcDoc={previewHtml} style={{ width: '100%', height: '1050px', border: 'none', background: '#fff', boxShadow: '0 2px 14px rgba(0,0,0,0.15)' }} />
        )}
      </Drawer>

      <style jsx global>{`
        .pvpb-page { display: flex; flex-direction: column; gap: 14px; padding-bottom: 32px; }
        .pvpb-header { display: flex; align-items: center; gap: 14px; padding: 4px 2px 16px; border-bottom: 1px solid var(--border-slate-100); }
        .pvpb-head-chip { width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .pvpb-head-text { flex: 1; min-width: 0; }
        .pvpb-head-title { font-size: 18px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; }
        .pvpb-head-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .pvpb-head-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .pvpb-loading { display: flex; justify-content: center; padding: 64px 0; }

        /* Premium segmented tab bar — icon + label on one row */
        .pvpb-tabs { display: inline-flex; gap: 4px; padding: 4px; margin-bottom: 4px; background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); border-radius: 12px; }
        .pvpb-tab { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 18px; border: none; background: transparent; border-radius: 9px; font-size: 13px; font-weight: 600; line-height: 1; white-space: nowrap; color: var(--text-slate-500); cursor: pointer; transition: color .15s ease, background .15s ease, box-shadow .15s ease; }
        .pvpb-tab svg { flex-shrink: 0; }
        .pvpb-tab:hover { color: var(--text-slate-800); }
        .pvpb-tab.is-active { background: var(--bg-pure-white); color: var(--text-slate-900); box-shadow: 0 1px 2px rgba(15,23,42,0.10), 0 0 0 1px rgba(15,23,42,0.05); }

        /* Branding card */
        .pvpb-brand { display: flex; flex-direction: column; }
        .pvpb-brand-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 15px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvpb-brand-row:first-child { padding-top: 2px; }
        .pvpb-brand-meta { min-width: 0; }
        .pvpb-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 3px; line-height: 1.35; }
        .pvpb-accent { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
        .pvpb-swatches { display: flex; gap: 6px; }
        .pvpb-swatch { width: 26px; height: 26px; padding: 0; border: none; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08); transition: transform .12s ease, box-shadow .12s ease; }
        .pvpb-swatch:hover { transform: translateY(-1px); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.16); }
        .pvpb-swatch.is-sel { box-shadow: 0 0 0 2px var(--bg-pure-white), 0 0 0 4px var(--text-slate-900); }
        .pvpb-brand-logo { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .pvpb-logo-preview { width: 56px; height: 56px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--border-slate-300); background: var(--bg-slate-50); color: var(--text-slate-400); overflow: hidden; transition: all .15s ease; }
        .pvpb-logo-preview img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px; }
        .pvpb-logo-actions { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
        .pvpb-brand-note { padding-top: 15px; }
        .pvpb-brand-note .pvpb-label { margin-bottom: 6px; }

        /* Settings form rows (Bank & Disbursement) */
        .pvpb-frow { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 15px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvpb-frow:first-child { padding-top: 2px; }
        .pvpb-frow:last-child { border-bottom: none; padding-bottom: 2px; }
        .pvpb-frow-ctrl { width: 300px; flex-shrink: 0; }
        @media (max-width: 620px) { .pvpb-frow { flex-direction: column; align-items: stretch; gap: 8px; } .pvpb-frow-ctrl { width: 100%; } }

        /* Preview drawer header */
        .pvpb-pv-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .pvpb-pv-title { display: inline-flex; align-items: center; gap: 9px; min-width: 0; }
        .pvpb-pv-chip { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
        .pvpb-pv-name { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .pvpb-pv-badge { font-size: 11px; font-weight: 600; color: var(--text-slate-500); background: var(--bg-slate-100); padding: 2px 8px; border-radius: 6px; }
        .pvpb-pv-accent { display: inline-flex; align-items: center; gap: 10px; }
        .pvpb-pv-accent-lbl { font-size: 11.5px; font-weight: 600; color: var(--text-slate-400); text-transform: uppercase; letter-spacing: .04em; }
        .pvpb-sections { display: flex; flex-direction: column; gap: 14px; max-width: 880px; }
        .pvpb-card { border: 1px solid var(--border-slate-200); border-radius: 12px; background: var(--bg-pure-white); overflow: hidden; }
        .pvpb-card-head { display: flex; align-items: center; gap: 11px; padding: 14px 16px; border-bottom: 1px solid var(--border-slate-100); }
        .pvpb-card-chip { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .pvpb-card-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .pvpb-card-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; }
        .pvpb-card-body { padding: 16px; }
        .pvpb-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 18px; }
        @media (max-width: 640px) { .pvpb-grid { grid-template-columns: 1fr; } }
        .pvpb-field { display: flex; flex-direction: column; gap: 6px; }
        .pvpb-field.pvpb-inline { flex-direction: row; align-items: center; justify-content: space-between; border: 1px solid var(--border-color); padding: 0 12px; height: 40px; align-self: end; }
        .pvpb-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .pvpb-toggles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }
        @media (max-width: 640px) { .pvpb-toggles { grid-template-columns: 1fr; } }

        .pvpb-tpl-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        @media (max-width: 720px) { .pvpb-tpl-grid { grid-template-columns: 1fr; } }
        .pvpb-tpl-card { position: relative; text-align: left; cursor: pointer; background: var(--bg-pure-white); border: 1.5px solid var(--border-slate-200); border-radius: 10px; padding: 10px; transition: border-color .12s ease, box-shadow .12s ease; }
        .pvpb-tpl-card:hover { border-color: #cbd5e1; }
        .pvpb-tpl-card.is-sel { border-color: var(--text-slate-900); box-shadow: 0 0 0 3px rgba(15,23,42,0.06); }
        .pvpb-tpl-check { position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; border-radius: 50%; background: var(--text-slate-900); color: #fff; display: flex; align-items: center; justify-content: center; }
        .pvpb-thumb { height: 132px; background: #fff; border: 1px solid var(--border-slate-100); border-radius: 6px; padding: 8px; overflow: hidden; }
        .pvpb-tpl-name { font-size: 13px; font-weight: 700; color: var(--text-slate-900); margin-top: 9px; }
        .pvpb-tpl-blurb { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; line-height: 1.3; }
        .pvpb-tpl-preview { margin-top: 9px; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); font-size: 12px; font-weight: 600; cursor: pointer; transition: border-color .12s ease, color .12s ease; }
        .pvpb-tpl-preview:hover { border-color: #93c5fd; color: ${PALETTE.blue}; }
        .pvpb-toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvpb-tg-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .pvpb-tg-desc { font-size: 11.5px; color: var(--text-slate-400); margin-top: 1px; }
        .pvpb-page .ant-input, .pvpb-page .ant-input-affix-wrapper, .pvpb-page .ant-select-selector { border-radius: 6px !important; }

        .pvpb-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }

        @media (max-width: 900px) {
          .pvpb-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .pvpb-head-actions {
            flex-wrap: wrap;
            width: 100%;
          }
          .pvpb-head-actions > * {
            flex: 1;
            min-width: 120px;
          }
        }
        @media (max-width: 600px) {
          .pvpb-tabs {
            flex-direction: column;
            align-items: stretch;
          }
          .pvpb-tab {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
