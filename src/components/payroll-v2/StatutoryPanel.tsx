'use client';
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, InputNumber, Switch, Input, message } from 'antd';
import { Landmark, Save, RotateCcw, ShieldCheck, PiggyBank, Percent, Building2, Menu } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import PayrollV2Service, {

  PfConfig, EsiConfig, UpdatePfInput, UpdateEsiInput } from '@/services/payrollV2Service';

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', amber: '#F59E0B', violet: '#8B5CF6' } as const;
const TINT = { blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', red: 'rgba(239,68,68,0.10)', amber: 'rgba(245,158,11,0.10)', violet: 'rgba(139,92,246,0.10)' } as const;

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n: number) => `₹${inr.format(Math.round(n))}`;

type View = 'pf' | 'esi';

const EMPTY_PF: UpdatePfInput = {
  enabled: true, employeeRate: 12, employerRate: 12, wageCeiling: 15000, restrictToCeiling: true,
  includeEmployerInCtc: true, epsEnabled: true, epsRate: 8.33, edliEnabled: true, edliRate: 0.5,
  adminChargesRate: 0.5, establishmentCode: '' };
const EMPTY_ESI: UpdateEsiInput = {
  enabled: true, employeeRate: 0.75, employerRate: 3.25, wageThreshold: 21000, establishmentCode: '' };

function pfToForm(c: PfConfig): UpdatePfInput {
  return {
    enabled: c.enabled, employeeRate: c.employeeRate, employerRate: c.employerRate, wageCeiling: c.wageCeiling,
    restrictToCeiling: c.restrictToCeiling, includeEmployerInCtc: c.includeEmployerInCtc, epsEnabled: c.epsEnabled,
    epsRate: c.epsRate, edliEnabled: c.edliEnabled, edliRate: c.edliRate, adminChargesRate: c.adminChargesRate,
    establishmentCode: c.establishmentCode ?? '' };
}
function esiToForm(c: EsiConfig): UpdateEsiInput {
  return { enabled: c.enabled, employeeRate: c.employeeRate, employerRate: c.employerRate, wageThreshold: c.wageThreshold, establishmentCode: c.establishmentCode ?? '' };
}

function SectionCard({ icon, tint, color, title, subtitle, children }: {
  icon: React.ReactNode; tint: string; color: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <section className="pvst-card">
      <div className="pvst-card-head">
        <div className="pvst-card-chip" style={{ background: tint, color }}>{icon}</div>
        <div><div className="pvst-card-title">{title}</div><div className="pvst-card-sub">{subtitle}</div></div>
      </div>
      <div className="pvst-card-body">{children}</div>
    </section>
  );
}
// Divided settings row (General-Settings style): label + hint on the left, the
// control on the right. `inline` drops the control (a Switch) straight at the
// right instead of in the fixed-width column.
function Field({ label, hint, children, inline }: { label: string; hint?: string; children: React.ReactNode; inline?: boolean }) {
  return (
    <div className="pvst-frow">
      <div className="pvst-frow-meta">
        <div className="pvst-frow-label">{label}</div>
        {hint && <div className="pvst-frow-hint">{hint}</div>}
      </div>
      {inline ? children : <div className="pvst-frow-ctrl">{children}</div>}
    </div>
  );
}

export default function StatutoryPanel() {
  const { canUpdatePayrollStatutory } = usePermission();
  const [view, setView] = useState<View>('pf');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pf, setPf] = useState<UpdatePfInput>(EMPTY_PF);
  const [pfSaved, setPfSaved] = useState<UpdatePfInput>(EMPTY_PF);
  const [esi, setEsi] = useState<UpdateEsiInput>(EMPTY_ESI);
  const [esiSaved, setEsiSaved] = useState<UpdateEsiInput>(EMPTY_ESI);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([PayrollV2Service.getPfConfig(), PayrollV2Service.getEsiConfig()]);
      const pfF = pfToForm(p); const esiF = esiToForm(e);
      setPf(pfF); setPfSaved(pfF); setEsi(esiF); setEsiSaved(esiF);
    } catch {
      message.error('Failed to load statutory config');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const pfDirty = useMemo(() => JSON.stringify(pf) !== JSON.stringify(pfSaved), [pf, pfSaved]);
  const esiDirty = useMemo(() => JSON.stringify(esi) !== JSON.stringify(esiSaved), [esi, esiSaved]);
  const dirty = view === 'pf' ? pfDirty : esiDirty;

  const setPfField = <K extends keyof UpdatePfInput>(k: K, v: UpdatePfInput[K]) => setPf((p) => ({ ...p, [k]: v }));
  const setEsiField = <K extends keyof UpdateEsiInput>(k: K, v: UpdateEsiInput[K]) => setEsi((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (view === 'pf') {
        const saved = await PayrollV2Service.updatePfConfig(pf);
        const f = pfToForm(saved); setPf(f); setPfSaved(f);
      } else {
        const saved = await PayrollV2Service.updateEsiConfig(esi);
        const f = esiToForm(saved); setEsi(f); setEsiSaved(f);
      }
      message.success('Statutory config saved');
    } catch {
      message.error('Failed to save statutory config');
    } finally { setSaving(false); }
  };

  const reset = () => (view === 'pf' ? setPf(pfSaved) : setEsi(esiSaved));

  // ── sample contribution preview (₹20,000 gross) ──────────────────────────────
  const SAMPLE = 20000;
  const pfPreview = useMemo(() => {
    const base = pf.restrictToCeiling ? Math.min(SAMPLE, pf.wageCeiling) : SAMPLE;
    const ee = (pf.employeeRate / 100) * base;
    const erTotal = (pf.employerRate / 100) * base;
    const eps = pf.epsEnabled ? (pf.epsRate / 100) * base : 0;
    return { base, ee, erTotal, eps, erPf: Math.max(0, erTotal - eps) };
  }, [pf]);
  const esiPreview = useMemo(() => {
    const applies = SAMPLE <= esi.wageThreshold;
    return { applies, ee: applies ? (esi.employeeRate / 100) * SAMPLE : 0, er: applies ? (esi.employerRate / 100) * SAMPLE : 0 };
  }, [esi]);

  return (
    <div className="pvst-page">
      <div className="pvst-header">
        <div className="pvst-header-about">
          <button
            type="button"
            className="pv-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-pv-sidebar'))}
          >
            <Menu size={20} />
          </button>
          <div className="pvst-head-chip" style={{ background: TINT.red, color: PALETTE.red }}><Landmark size={20} /></div>
          <div className="pvst-head-text">
            <div className="pvst-head-title">Statutory</div>
            <div className="pvst-head-sub">India compliance — Provident Fund &amp; Employee State Insurance</div>
          </div>
        </div>
        <div className="pvst-head-actions">
          <Button icon={<RotateCcw size={15} />} onClick={reset} disabled={!dirty || saving}>Reset</Button>
          {canUpdatePayrollStatutory && <Button type="primary" icon={<Save size={15} />} loading={saving} disabled={!dirty} onClick={save}>Save Changes</Button>}
        </div>
      </div>

      <div className="pvst-tabs">
        <button type="button" className={`pvst-tab ${view === 'pf' ? 'is-active' : ''}`} onClick={() => setView('pf')}>
          <PiggyBank size={15} /><span>Provident Fund</span>
        </button>
        <button type="button" className={`pvst-tab ${view === 'esi' ? 'is-active' : ''}`} onClick={() => setView('esi')}>
          <ShieldCheck size={15} /><span>ESI</span>
        </button>
      </div>

      {loading ? (
        <div className="pvst-loading"><LoadingSpinner fullScreen={false} /></div>
      ) : view === 'pf' ? (
        <div className="pvst-sections">
          <SectionCard icon={<PiggyBank size={16} />} tint={TINT.blue} color={PALETTE.blue} title="Provident Fund (EPF)" subtitle="Employee & employer contribution and wage ceiling">
            <Field label="Enable PF" hint="Deduct provident fund for eligible employees" inline>
              <Switch checked={pf.enabled} onChange={(v) => setPfField('enabled', v)} />
            </Field>
            <Field label="Employee contribution (%)" hint="Deducted from the employee's wages"><InputNumber min={0} max={100} step={0.5} value={pf.employeeRate} onChange={(v) => setPfField('employeeRate', Number(v ?? 0))} style={{ width: '100%' }} /></Field>
            <Field label="Employer contribution (%)" hint="Employer's matching share"><InputNumber min={0} max={100} step={0.5} value={pf.employerRate} onChange={(v) => setPfField('employerRate', Number(v ?? 0))} style={{ width: '100%' }} /></Field>
            <Field label="Wage ceiling" hint="Statutory cap is ₹15,000"><InputNumber min={0} max={10000000} step={500} value={pf.wageCeiling} onChange={(v) => setPfField('wageCeiling', Number(v ?? 0))} style={{ width: '100%' }} formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => Number((v || '').replace(/[^\d.]/g, '')) as any} /></Field>
            <Field label="Establishment / LIN code" hint="Your EPFO establishment / LIN number"><Input value={pf.establishmentCode ?? ''} onChange={(e) => setPfField('establishmentCode', e.target.value)} placeholder="e.g. KA/BNG/0012345" prefix={<Building2 size={14} style={{ color: 'var(--text-slate-400)' }} />} /></Field>
            <Field label="Restrict to wage ceiling" hint="Cap PF wages at the ceiling above" inline><Switch checked={pf.restrictToCeiling} onChange={(v) => setPfField('restrictToCeiling', v)} /></Field>
            <Field label="Include employer PF in CTC" hint="Employer share counts toward cost-to-company" inline><Switch checked={pf.includeEmployerInCtc} onChange={(v) => setPfField('includeEmployerInCtc', v)} /></Field>
          </SectionCard>

          <SectionCard icon={<Percent size={16} />} tint={TINT.violet} color={PALETTE.violet} title="EPS, EDLI & Admin Charges" subtitle="How the employer contribution is split and employer-borne charges">
            <Field label="Employee Pension Scheme (EPS)" hint="Part of employer share diverts to EPS" inline><Switch checked={pf.epsEnabled} onChange={(v) => setPfField('epsEnabled', v)} /></Field>
            {pf.epsEnabled && <Field label="EPS rate (%)" hint="Of PF wages (statutory 8.33%)"><InputNumber min={0} max={100} step={0.01} value={pf.epsRate} onChange={(v) => setPfField('epsRate', Number(v ?? 0))} style={{ width: '100%' }} /></Field>}
            <Field label="Enable EDLI" hint="Employees' Deposit Linked Insurance" inline><Switch checked={pf.edliEnabled} onChange={(v) => setPfField('edliEnabled', v)} /></Field>
            <Field label="EDLI rate (%)" hint="Insurance, employer-borne"><InputNumber min={0} max={100} step={0.1} value={pf.edliRate} onChange={(v) => setPfField('edliRate', Number(v ?? 0))} style={{ width: '100%' }} disabled={!pf.edliEnabled} /></Field>
            <Field label="EPF admin charges (%)" hint="Employer-borne, on PF wages"><InputNumber min={0} max={100} step={0.1} value={pf.adminChargesRate} onChange={(v) => setPfField('adminChargesRate', Number(v ?? 0))} style={{ width: '100%' }} /></Field>
          </SectionCard>

          <div className="pvst-preview">
            <div className="pvst-preview-head">Example on {money(SAMPLE)} gross</div>
            <div className="pvst-preview-cells">
              <div><span>PF wage</span><strong>{money(pfPreview.base)}</strong></div>
              <div><span>Employee PF</span><strong>{money(pfPreview.ee)}</strong></div>
              <div><span>Employer PF</span><strong>{money(pfPreview.erPf)}</strong></div>
              <div><span>EPS</span><strong>{money(pfPreview.eps)}</strong></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pvst-sections">
          <SectionCard icon={<ShieldCheck size={16} />} tint={TINT.green} color={PALETTE.green} title="Employee State Insurance (ESI)" subtitle="Applies to employees under the wage threshold">
            <Field label="Enable ESI" hint="Deduct ESI for eligible employees" inline>
              <Switch checked={esi.enabled} onChange={(v) => setEsiField('enabled', v)} />
            </Field>
            <Field label="Employee contribution (%)" hint="Statutory 0.75%"><InputNumber min={0} max={100} step={0.05} value={esi.employeeRate} onChange={(v) => setEsiField('employeeRate', Number(v ?? 0))} style={{ width: '100%' }} /></Field>
            <Field label="Employer contribution (%)" hint="Statutory 3.25%"><InputNumber min={0} max={100} step={0.05} value={esi.employerRate} onChange={(v) => setEsiField('employerRate', Number(v ?? 0))} style={{ width: '100%' }} /></Field>
            <Field label="Wage threshold" hint="ESI applies if gross ≤ this"><InputNumber min={0} max={10000000} step={500} value={esi.wageThreshold} onChange={(v) => setEsiField('wageThreshold', Number(v ?? 0))} style={{ width: '100%' }} formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => Number((v || '').replace(/[^\d.]/g, '')) as any} /></Field>
            <Field label="Establishment code" hint="Your ESIC establishment number"><Input value={esi.establishmentCode ?? ''} onChange={(e) => setEsiField('establishmentCode', e.target.value)} placeholder="e.g. 12000000000000999" prefix={<Building2 size={14} style={{ color: 'var(--text-slate-400)' }} />} /></Field>
          </SectionCard>

          <div className="pvst-preview">
            <div className="pvst-preview-head">Example on {money(SAMPLE)} gross</div>
            <div className="pvst-preview-cells">
              <div><span>Eligible</span><strong>{esiPreview.applies ? 'Yes' : 'No (above threshold)'}</strong></div>
              <div><span>Employee ESI</span><strong>{money(esiPreview.ee)}</strong></div>
              <div><span>Employer ESI</span><strong>{money(esiPreview.er)}</strong></div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .pvst-page { display: flex; flex-direction: column; gap: 14px; padding-bottom: 32px; }
        .pvst-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; padding: 4px 2px 16px; border-bottom: 1px solid var(--border-slate-100); }
        .pvst-head-chip { width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .pvst-head-text { flex: 1; min-width: 0; }
        .pvst-head-title { font-size: 18px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; }
        .pvst-head-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .pvst-head-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .pvst-loading { display: flex; justify-content: center; padding: 64px 0; }
        .pvst-tabs { display: inline-flex; gap: 4px; padding: 4px; margin-bottom: 4px; background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); border-radius: 12px; }
        .pvst-tab { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 18px; border: none; background: transparent; border-radius: 9px; font-size: 13px; font-weight: 600; line-height: 1; white-space: nowrap; color: var(--text-slate-500); cursor: pointer; transition: color .15s ease, background .15s ease, box-shadow .15s ease; }
        .pvst-tab svg { flex-shrink: 0; }
        .pvst-tab:hover { color: var(--text-slate-800); }
        .pvst-tab.is-active { background: var(--bg-pure-white); color: var(--text-slate-900); box-shadow: 0 1px 2px rgba(15,23,42,0.10), 0 0 0 1px rgba(15,23,42,0.05); }
        .pvst-sections { display: flex; flex-direction: column; gap: 14px; max-width: 880px; }
        .pvst-card { border: 1px solid var(--border-slate-200); border-radius: 12px; background: var(--bg-pure-white); overflow: hidden; }
        .pvst-card-head { display: flex; align-items: center; gap: 11px; padding: 14px 16px; border-bottom: 1px solid var(--border-slate-100); }
        .pvst-card-chip { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .pvst-card-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .pvst-card-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; }
        .pvst-card-body { padding: 6px 16px 8px; }
        .pvst-frow { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 13px 0; border-bottom: 1px solid var(--border-slate-100); }
        .pvst-frow:first-child { padding-top: 4px; }
        .pvst-frow:last-child { border-bottom: none; padding-bottom: 2px; }
        .pvst-frow-meta { min-width: 0; flex: 1; }
        .pvst-frow-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .pvst-frow-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 3px; line-height: 1.35; }
        .pvst-frow-ctrl { width: 300px; flex-shrink: 0; }
        @media (max-width: 640px) { .pvst-frow { flex-direction: column; align-items: stretch; gap: 8px; } .pvst-frow-ctrl { width: 100%; } }
        .pvst-page .ant-input-number { width: 100%; }
        .pvst-preview { border: 1px solid var(--border-color); background: var(--bg-pure-white); border-radius: 12px; padding: 14px 18px; max-width: 880px; }
        .pvst-preview-head { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-slate-400); margin-bottom: 10px; }
        .pvst-preview-cells { display: flex; gap: 26px; flex-wrap: wrap; }
        .pvst-preview-cells > div { display: flex; flex-direction: column; gap: 2px; }
        .pvst-preview-cells span { font-size: 11px; color: var(--text-slate-500); }
        .pvst-preview-cells strong { font-size: 16px; font-weight: 800; color: var(--text-slate-900); }
        .pvst-page .ant-input-number, .pvst-page .ant-input, .pvst-page .ant-input-affix-wrapper { border-radius: 6px !important; }

        .pvst-header-about { display: flex; align-items: center; gap: 12px; flex: 1 1 auto; min-width: 250px; }

        @media (max-width: 900px) {
          .pvst-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .pvst-head-actions {
            flex-wrap: wrap;
            width: 100%;
          }
          .pvst-head-actions > * {
            flex: 1;
            min-width: 120px;
          }
        }
        @media (max-width: 600px) {
          .pvst-tabs {
            flex-direction: column;
            align-items: stretch;
          }
          .pvst-tab {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
