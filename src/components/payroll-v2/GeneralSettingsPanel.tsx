'use client';
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, InputNumber, Switch, message } from 'antd';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import {
  SlidersHorizontal,
  Save,
  RotateCcw,
  CalendarRange,
  Calculator,
  CircleSlash,
  Coins,
  Menu
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import PayrollV2Service, {

  PayrollSettings,
  UpdatePayrollSettingsInput,
  SalaryCalcBasis
} from '@/services/payrollV2Service';

const PALETTE = { blue: '#3B82F6', green: '#10B981', amber: '#F59E0B', red: '#EF4444', violet: '#8B5CF6' } as const;
const TINT = {
  blue: 'rgba(59,130,246,0.10)',
  green: 'rgba(16,185,129,0.10)',
  amber: 'rgba(245,158,11,0.10)',
  red: 'rgba(239,68,68,0.10)',
  violet: 'rgba(139,92,246,0.10)'
} as const;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'semi_monthly', label: 'Semi-monthly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'weekly', label: 'Weekly' },
];

const BASIS_OPTIONS: { value: SalaryCalcBasis; label: string; hint: string }[] = [
  { value: 'calendar_days', label: 'Calendar days', hint: 'Actual days in the month (28–31)' },
  { value: 'fixed_days', label: 'Fixed days', hint: 'Always a fixed number of days' },
  { value: 'working_days', label: 'Working days', hint: 'Excludes weekly-offs & holidays' },
];

const ROUNDING_OPTIONS = [
  { value: 'none', label: 'No rounding' },
  { value: 'nearest', label: 'Round to nearest' },
  { value: 'up', label: 'Round up' },
  { value: 'down', label: 'Round down' },
];

// Default form state used before the server payload arrives.
const EMPTY_FORM: UpdatePayrollSettingsInput = {
  financialYearStartMonth: 4,
  currency: 'INR',
  payFrequency: 'monthly',
  salaryCalcBasis: 'calendar_days',
  salaryFixedDays: 30,
  lopCalcBasis: 'calendar_days',
  lopFixedDays: 30,
  roundingMode: 'nearest',
  roundingNearest: 1,
  decimalPlaces: 2,
  payDay: 1,
  enableLop: true
};

function toForm(s: PayrollSettings): UpdatePayrollSettingsInput {
  return {
    financialYearStartMonth: s.financialYearStartMonth,
    currency: s.currency,
    payFrequency: s.payFrequency,
    salaryCalcBasis: s.salaryCalcBasis,
    salaryFixedDays: s.salaryFixedDays,
    lopCalcBasis: s.lopCalcBasis,
    lopFixedDays: s.lopFixedDays,
    roundingMode: s.roundingMode,
    roundingNearest: s.roundingNearest,
    decimalPlaces: s.decimalPlaces,
    payDay: s.payDay,
    enableLop: s.enableLop
  };
}

export default function GeneralSettingsPanel() {
  const { canUpdatePayrollSettings } = usePermission();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdatePayrollSettingsInput>(EMPTY_FORM);
  const [saved, setSaved] = useState<UpdatePayrollSettingsInput>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PayrollV2Service.getSettings();
      const f = toForm(data);
      setForm(f);
      setSaved(f);
    } catch {
      message.error('Failed to load payroll settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  const set = <K extends keyof UpdatePayrollSettingsInput>(
    key: K,
    value: UpdatePayrollSettingsInput[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const data = await PayrollV2Service.updateSettings(form);
      const f = toForm(data);
      setForm(f);
      setSaved(f);
      message.success('Payroll settings saved');
    } catch {
      message.error('Failed to save payroll settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pv-page">
      {/* ============================ HEADER ============================ */}
      <div className="pv-header">
        <button
          type="button"
          className="pv-mobile-menu-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('open-pv-sidebar'))}
        >
          <Menu size={20} />
        </button>
        <div className="pv-head-chip" style={{ background: TINT.blue, color: PALETTE.blue }}>
          <SlidersHorizontal size={20} />
        </div>
        <div className="pv-head-text">
          <div className="pv-head-title">General Settings</div>
          <div className="pv-head-sub">Organisation-wide payroll basics every pay run reads from</div>
        </div>
        <div className="pv-head-actions">
          <Button
            icon={<RotateCcw size={15} />}
            onClick={() => setForm(saved)}
            disabled={!dirty || saving}
          >
            Reset
          </Button>
          {canUpdatePayrollSettings && (
            <Button
              type="primary"
              icon={<Save size={15} />}
              loading={saving}
              disabled={!dirty}
              onClick={save}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="pv-loading"><LoadingSpinner fullScreen={false} /></div>
      ) : (
        <div className="pv-sections">
          {/* ---------------- Financial Year & Pay ---------------- */}
          <SectionCard
            icon={<CalendarRange size={16} />}
            tint={TINT.violet}
            color={PALETTE.violet}
            title="Financial Year & Pay Cycle"
            subtitle="The payroll year, currency, and when employees are paid"
          >
            <div className="pv-rows">
              <Field label="Financial year starts" hint="India statutory year begins in April">
                <PayrollSelect
                  value={String(form.financialYearStartMonth)}
                  onChange={(v) => set('financialYearStartMonth', Number(v))}
                  options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
                  searchPlaceholder="Search month…"
                  itemNoun="months"
                />
              </Field>
              <Field label="Currency" hint="Currency all payroll amounts are shown in">
                <PayrollSelect
                  value={form.currency}
                  onChange={(v) => set('currency', v)}
                  options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                  searchPlaceholder="Search currency…"
                  itemNoun="currencies"
                />
              </Field>
              <Field label="Pay frequency" hint="How often a pay run is processed">
                <PayrollSelect
                  value={form.payFrequency}
                  onChange={(v) => set('payFrequency', v as UpdatePayrollSettingsInput['payFrequency'])}
                  options={FREQUENCY_OPTIONS}
                  itemNoun="options"
                />
              </Field>
              <Field label="Pay day" hint="Day of month salary is disbursed (31 = last day)">
                <InputNumber
                  value={form.payDay}
                  onChange={(v) => set('payDay', Number(v ?? 1))}
                  min={1}
                  max={31}
                  style={{ width: '100%' }}
                />
              </Field>
            </div>
          </SectionCard>

          {/* ---------------- Salary calculation ---------------- */}
          <SectionCard
            icon={<Calculator size={16} />}
            tint={TINT.blue}
            color={PALETTE.blue}
            title="Salary Calculation Basis"
            subtitle="How a monthly salary converts to a per-day rate for proration"
          >
            <div className="pv-rows">
              <Field label="Calculate per-day pay on" hint={BASIS_OPTIONS.find((o) => o.value === form.salaryCalcBasis)?.hint}>
                <PayrollSelect
                  value={form.salaryCalcBasis}
                  onChange={(v) => set('salaryCalcBasis', v as SalaryCalcBasis)}
                  options={BASIS_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.hint }))}
                  searchPlaceholder="Search basis…"
                  itemNoun="options"
                />
              </Field>
              {form.salaryCalcBasis === 'fixed_days' && (
                <Field label="Fixed days per month">
                  <InputNumber
                    value={form.salaryFixedDays}
                    onChange={(v) => set('salaryFixedDays', Number(v ?? 30))}
                    min={1}
                    max={31}
                    style={{ width: '100%' }}
                  />
                </Field>
              )}
            </div>
          </SectionCard>

          {/* ---------------- Loss of Pay ---------------- */}
          <SectionCard
            icon={<CircleSlash size={16} />}
            tint={TINT.red}
            color={PALETTE.red}
            title="Loss of Pay (LOP)"
            subtitle="Deductions for unpaid leave and unapproved absence"
          >
            <div className="pv-rows">
              <Field label="Enable Loss of Pay" hint="Deduct pay for unpaid or unapproved absence" inlineSwitch>
                <Switch checked={form.enableLop} onChange={(v) => set('enableLop', v)} />
              </Field>
              {form.enableLop && (
                <>
                  <Field label="LOP per-day basis" hint="Per-day rate used for LOP deductions">
                    <PayrollSelect
                      value={form.lopCalcBasis}
                      onChange={(v) => set('lopCalcBasis', v as SalaryCalcBasis)}
                      options={BASIS_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.hint }))}
                      searchPlaceholder="Search basis…"
                      itemNoun="options"
                    />
                  </Field>
                  {form.lopCalcBasis === 'fixed_days' && (
                    <Field label="LOP fixed days per month">
                      <InputNumber
                        value={form.lopFixedDays}
                        onChange={(v) => set('lopFixedDays', Number(v ?? 30))}
                        min={1}
                        max={31}
                        style={{ width: '100%' }}
                      />
                    </Field>
                  )}
                </>
              )}
            </div>
          </SectionCard>

          {/* ---------------- Rounding & display ---------------- */}
          <SectionCard
            icon={<Coins size={16} />}
            tint={TINT.amber}
            color={PALETTE.amber}
            title="Rounding & Display"
            subtitle="How net pay is rounded and how amounts are shown"
          >
            <div className="pv-rows">
              <Field label="Net pay rounding" hint="How the final take-home figure is rounded">
                <PayrollSelect
                  value={form.roundingMode}
                  onChange={(v) => set('roundingMode', v as UpdatePayrollSettingsInput['roundingMode'])}
                  options={ROUNDING_OPTIONS}
                  itemNoun="options"
                />
              </Field>
              {form.roundingMode !== 'none' && (
                <Field label="Round to nearest" hint="e.g. 1 = whole unit, 10 = nearest ten">
                  <InputNumber
                    value={form.roundingNearest}
                    onChange={(v) => set('roundingNearest', Number(v ?? 1))}
                    min={0.01}
                    max={1000}
                    step={1}
                    style={{ width: '100%' }}
                  />
                </Field>
              )}
              <Field label="Decimal places" hint="Digits shown after the decimal point">
                <InputNumber
                  value={form.decimalPlaces}
                  onChange={(v) => set('decimalPlaces', Number(v ?? 2))}
                  min={0}
                  max={4}
                  style={{ width: '100%' }}
                />
              </Field>
            </div>
          </SectionCard>
        </div>
      )}

      <style jsx global>{`
        .pv-page { display: flex; flex-direction: column; gap: 14px; padding-bottom: 32px; }
        .pv-header {
          display: flex; align-items: center; gap: 14px;
          padding: 4px 2px 16px; border-bottom: 1px solid var(--border-slate-100);
        }
        .pv-head-chip {
          width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .pv-head-text { flex: 1; min-width: 0; }
        .pv-head-title { font-size: 18px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; }
        .pv-head-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .pv-head-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .pv-loading { display: flex; justify-content: center; padding: 64px 0; }
        .pv-sections { display: flex; flex-direction: column; gap: 14px; max-width: 880px; }

        .pv-card {
          border: 1px solid var(--border-slate-200); border-radius: 12px;
          background: var(--bg-pure-white); overflow: hidden;
        }
        .pv-card-head {
          display: flex; align-items: center; gap: 11px;
          padding: 14px 16px; border-bottom: 1px solid var(--border-slate-100);
        }
        .pv-card-chip {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .pv-card-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .pv-card-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; }
        .pv-card-body { padding: 16px; }

        .pv-rows { display: flex; flex-direction: column; }
        .pv-frow {
          display: flex; align-items: center; justify-content: space-between;
          gap: 20px; padding: 15px 0; border-bottom: 1px solid var(--border-slate-100);
        }
        .pv-frow:first-child { padding-top: 2px; }
        .pv-frow:last-child { border-bottom: none; padding-bottom: 2px; }
        .pv-frow-meta { min-width: 0; }
        .pv-frow-ctrl { width: 300px; flex-shrink: 0; }
        @media (max-width: 620px) {
          .pv-frow { flex-direction: column; align-items: stretch; gap: 8px; }
          .pv-frow-ctrl { width: 100%; }
        }
        .pv-field-label { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .pv-field-hint { font-size: 11.5px; color: var(--text-slate-400); line-height: 1.35; }

        .pv-page .ant-input, .pv-page .ant-input-affix-wrapper,
        .pv-page .ant-select-selector, .pv-page .ant-input-number { border-radius: 6px !important; }
        .pv-page .ant-input-number { width: 100%; }
      `}</style>
    </div>
  );
}

// ─── small presentational helpers ──────────────────────────────────────────────
function SectionCard({
  icon, tint, color, title, subtitle, children }: {
    icon: React.ReactNode; tint: string; color: string;
    title: string; subtitle: string; children: React.ReactNode;
  }) {
  return (
    <section className="pv-card">
      <div className="pv-card-head">
        <div className="pv-card-chip" style={{ background: tint, color }}>{icon}</div>
        <div>
          <div className="pv-card-title">{title}</div>
          <div className="pv-card-sub">{subtitle}</div>
        </div>
      </div>
      <div className="pv-card-body">{children}</div>
    </section>
  );
}

// Thin wrapper over the app-standard SearchableDropdown with payroll-settings
// defaults: no clear (values are required), no avatar, uniform inline sizing.
function PayrollSelect({
  value, onChange, options, searchPlaceholder, itemNoun }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string; description?: string }[];
    searchPlaceholder?: string;
    itemNoun?: string;
  }) {
  return (
    <SearchableDropdown
      value={value}
      onChange={(v) => { if (v) onChange(v as string); }}
      options={options}
      allowClear={false}
      hideAvatar
      searchPlaceholder={searchPlaceholder}
      itemNoun={itemNoun}
      style={{ width: '100%', height: 36 }}
    />
  );
}

function Field({
  label, hint, inlineSwitch, children }: {
    label: string; hint?: string; inlineSwitch?: boolean; children: React.ReactNode;
  }) {
  return (
    <div className="pv-frow">
      <div className="pv-frow-meta">
        <div className="pv-field-label">{label}</div>
        {hint && <div className="pv-field-hint" style={{ marginTop: 3 }}>{hint}</div>}
      </div>
      {inlineSwitch ? children : <div className="pv-frow-ctrl">{children}</div>}
    </div>
  );
}
