'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Tag, Switch, InputNumber, message, Tooltip, Empty, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ReloadOutlined,
  SettingOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  ProfileOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import LeaveV2Service, {
  AccrualResult,
  AccrualSettings,
  LeavePolicyDetail,
  LeavePolicyListItem,
  LeaveTypeV2,
} from '@/services/leaveV2Service';

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', grey: '#94A3B8', amber: '#F59E0B' } as const;
const TINT = { blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', red: 'rgba(239,68,68,0.10)', grey: 'rgba(148,163,184,0.12)', amber: 'rgba(245,158,11,0.10)' } as const;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  .map((label, i) => ({ value: String(i + 1), label }));

const TERM_LABEL: Record<string, string> = { monthly: 'Monthly', quarterly: 'Quarterly', half_yearly: 'Half-yearly', yearly: 'Yearly' };

export default function ConfigurationPanel() {
  const router = useRouter();
  const { canReadLeavePolicy } = usePermission();

  // settings
  const [settings, setSettings] = useState<AccrualSettings | null>(null);
  const [savingMonth, setSavingMonth] = useState(false);

  // run
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [running, setRunning] = useState<false | 'preview' | 'apply'>(false);
  const [result, setResult] = useState<AccrualResult | null>(null);

  // policies
  const [policies, setPolicies] = useState<LeavePolicyListItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeV2[]>([]);
  const [polLoading, setPolLoading] = useState(false);
  const [polDetail, setPolDetail] = useState<Record<string, LeavePolicyDetail>>({});

  const load = useCallback(async () => {
    setPolLoading(true);
    try {
      const [s, p, lt] = await Promise.all([
        LeaveV2Service.getAccrualSettings(),
        LeaveV2Service.listPolicies(false),
        LeaveV2Service.listLeaveTypes(true),
      ]);
      setSettings(s);
      setPolicies(p);
      setLeaveTypes(lt);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load configuration');
    } finally {
      setPolLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ltName = (id: string) => leaveTypes.find((t) => t.id === id)?.name ?? id;

  const saveMonth = async (m: number) => {
    setSavingMonth(true);
    try {
      await LeaveV2Service.setLeaveYearStartMonth(m);
      setSettings((s) => (s ? { ...s, leaveYearStartMonth: m } : s));
      message.success(`Leave year now starts in ${MONTHS[m - 1].label}`);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to save');
    } finally {
      setSavingMonth(false);
    }
  };

  const run = async (dryRun: boolean) => {
    setRunning(dryRun ? 'preview' : 'apply');
    try {
      const r = await LeaveV2Service.runAccrual({ year, month, dryRun });
      setResult(r);
      message.success(dryRun ? `Preview: ${r.credited} would be credited` : `Accrual applied: ${r.credited} credited`);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Accrual run failed');
    } finally {
      setRunning(false);
    }
  };

  const onExpandPolicy = async (expanded: boolean, row: LeavePolicyListItem) => {
    if (!expanded || polDetail[row.id]) return;
    try {
      const d = await LeaveV2Service.getPolicy(row.id);
      setPolDetail((c) => ({ ...c, [row.id]: d }));
    } catch { /* ignore */ }
  };

  // ── Run result tables ────────────────────────────────────────────────────────
  const byTypeCols: ColumnsType<AccrualResult['byLeaveType'][number]> = [
    { title: 'Leave Type', dataIndex: 'leaveTypeName', key: 'name', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Employees', dataIndex: 'employees', key: 'emp' },
    { title: 'Total Units', dataIndex: 'units', key: 'units', render: (v) => <strong style={{ color: PALETTE.blue }}>{v}</strong> },
  ];
  const detailCols: ColumnsType<AccrualResult['details'][number]> = [
    { title: 'Employee', dataIndex: 'userName', key: 'user', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Leave Type', dataIndex: 'leaveTypeName', key: 'lt' },
    { title: 'Units', dataIndex: 'units', key: 'units', render: (v) => <strong>{v}</strong> },
    { title: 'Period', dataIndex: 'periodKey', key: 'pk', render: (v) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    { title: '', dataIndex: 'prorated', key: 'pro', render: (v) => (v ? <Tag color="orange">prorated</Tag> : null) },
  ];

  // ── Policy table ─────────────────────────────────────────────────────────────
  const policyCols: ColumnsType<LeavePolicyListItem> = [
    { title: 'Policy', dataIndex: 'name', key: 'name', render: (v, r) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: r.isActive ? PALETTE.blue : PALETTE.grey }} />
        <span style={{ fontWeight: 600 }}>{v}</span>
      </span>
    ) },
    { title: 'Term', dataIndex: 'termCycle', key: 'term', render: (v) => <Tag>{TERM_LABEL[v] ?? v}</Tag> },
    { title: 'LOP', dataIndex: 'lopOnExhaustion', key: 'lop', render: (v) => (v ? <Tag color="red">On</Tag> : <Tag>Off</Tag>) },
    { title: 'Applies To', dataIndex: 'assignmentCount', key: 'a', render: (v) => `${v} target${v === 1 ? '' : 's'}` },
    { title: 'Leave Types', dataIndex: 'lineCount', key: 'l', render: (v) => <Tag color="blue">{v}</Tag> },
  ];

  const expandedPolicy = (row: LeavePolicyListItem) => {
    const d = polDetail[row.id];
    if (!d) return <div style={{ padding: 12 }}><Spin size="small" /> Loading…</div>;
    return (
      <div style={{ padding: '6px 12px', background: 'var(--bg-slate-50)' }}>
        <Table
          rowKey="leaveTypeId"
          size="small"
          pagination={false}
          dataSource={d.lines}
          columns={[
            { title: 'Leave Type', key: 'lt', render: (_, l) => ltName(l.leaveTypeId) },
            { title: 'Accrual', key: 'm', render: (_, l) => (l.accrualMethod === 'monthly' ? 'Monthly' : 'Whole term') },
            { title: 'Count', key: 'c', render: (_, l) => `${l.countPerPeriod} ${l.accrualMethod === 'monthly' ? '/mo' : '/term'}` },
            { title: `Total / ${TERM_LABEL[d.termCycle]?.toLowerCase()}`, key: 't', render: (_, l) => <strong style={{ color: PALETTE.blue }}>{l.allocation ?? '—'}</strong> },
            { title: 'Carry Fwd', key: 'cf', render: (_, l) => (l.carryForward ? <Tag color="green">Yes{l.carryForwardMax != null ? ` (max ${l.carryForwardMax})` : ''}</Tag> : <Tag>No</Tag>) },
          ]}
        />
      </div>
    );
  };

  return (
    <div className="lvc">
      <div className="lvc-header">
        <div className="lvc-header-about">
          <div className="lvc-header-icon"><SettingOutlined /></div>
          <div>
            <div className="lvc-header-title">Configuration</div>
            <div className="lvc-header-sub">Leave year, accrual runs and policy allocations</div>
          </div>
        </div>
        <Tooltip title="Refresh"><button type="button" className="lvc-ghost-btn" onClick={load}><ReloadOutlined spin={polLoading} /></button></Tooltip>
      </div>

      {/* SETTINGS ROW */}
      <div className="lvc-cards">
        <div className="lvc-card">
          <div className="lvc-card-head"><CalendarOutlined style={{ color: PALETTE.blue }} /> Leave Year</div>
          <div className="lvc-card-body">
            <div className="lvc-field-label">Year starts in</div>
            <SearchableDropdown
              placeholder="Month"
              itemNoun="months"
              allowClear={false}
              value={settings ? String(settings.leaveYearStartMonth) : undefined}
              onChange={(v) => saveMonth(Number(v))}
              options={MONTHS}
              style={{ width: 200, height: 38, marginTop: 6 }}
              width={220}
            />
            <div className="lvc-hint">{savingMonth ? 'Saving…' : 'Quarter / half / yearly terms are computed from this month.'}</div>
          </div>
        </div>
        <div className="lvc-card">
          <div className="lvc-card-head"><ThunderboltOutlined style={{ color: PALETTE.amber }} /> Accrual Scheduler</div>
          <div className="lvc-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Switch checked={!!settings?.schedulerEnabled} disabled />
              <Tag color={settings?.schedulerEnabled ? 'green' : 'default'}>{settings?.schedulerEnabled ? 'Enabled' : 'Disabled'}</Tag>
            </div>
            <div className="lvc-hint">
              Monthly auto-run {settings?.schedulerEnabled ? 'is active.' : 'is off.'} Toggle via the <code>LEAVE_ACCRUAL_ENABLED</code> env flag (server). You can always run manually below.
            </div>
          </div>
        </div>
      </div>

      {/* RUN ACCRUAL */}
      <div className="lvc-section">
        <div className="lvc-section-head"><PlayCircleOutlined style={{ color: PALETTE.green }} /> Manual Accrual Run</div>
        <div className="lvc-run-bar">
          <div className="lvc-run-field">
            <span className="lvc-field-label">Year</span>
            <InputNumber style={{ width: 110 }} min={2000} max={2100} value={year} onChange={(v) => setYear(Number(v ?? now.getUTCFullYear()))} />
          </div>
          <div className="lvc-run-field">
            <span className="lvc-field-label">Month</span>
            <SearchableDropdown placeholder="Month" itemNoun="months" allowClear={false} value={String(month)} onChange={(v) => setMonth(Number(v))} options={MONTHS} style={{ width: 150, height: 36 }} width={200} />
          </div>
          <Button icon={<EyeOutlined />} loading={running === 'preview'} disabled={!!running} onClick={() => run(true)} style={{ height: 36, borderRadius: 6 }}>Preview</Button>
          <Button type="primary" icon={<PlayCircleOutlined />} loading={running === 'apply'} disabled={!!running} onClick={() => run(false)} style={{ height: 36, borderRadius: 6 }}>Run Accrual</Button>
        </div>

        {result && (
          <div className="lvc-result">
            <div className="lvc-result-banner" style={{ background: result.dryRun ? TINT.amber : TINT.green, color: result.dryRun ? PALETTE.amber : PALETTE.green }}>
              <InfoCircleOutlined /> {result.dryRun ? 'Preview (nothing written)' : 'Applied to the ledger'} — {MONTHS[result.month - 1].label} {result.year}
              <button type="button" className="lvc-result-close" onClick={() => setResult(null)} aria-label="Close" style={{ color: result.dryRun ? PALETTE.amber : PALETTE.green }}>
                <CloseOutlined />
              </button>
            </div>
            <div className="lvc-result-stats">
              {[
                { label: 'Employees', value: result.employees, icon: <TeamOutlined />, color: PALETTE.blue },
                { label: 'Policies', value: result.policies, icon: <ProfileOutlined />, color: PALETTE.grey },
                { label: result.dryRun ? 'Would credit' : 'Credited', value: result.credited, icon: <CheckCircleOutlined />, color: PALETTE.green },
                { label: 'Skipped', value: result.skipped, icon: <MinusCircleOutlined />, color: PALETTE.grey },
              ].map((s) => (
                <div key={s.label} className="lvc-rstat">
                  <span className="lvc-rstat-icon" style={{ color: s.color }}>{s.icon}</span>
                  <div><div className="lvc-rstat-val">{s.value}</div><div className="lvc-rstat-label">{s.label}</div></div>
                </div>
              ))}
            </div>

            <div className="lvc-result-grid">
              <div>
                <div className="lvc-mini-head">By Leave Type</div>
                {result.byLeaveType.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing credited" /> :
                  <Table rowKey="leaveTypeId" size="small" pagination={false} columns={byTypeCols} dataSource={result.byLeaveType} className="lvc-table" />}
              </div>
              <div>
                <div className="lvc-mini-head">Details {result.details.length >= 1000 && <span style={{ color: PALETTE.grey, fontWeight: 400 }}>(first 1000)</span>}</div>
                {result.details.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No grants" /> :
                  <Table rowKey={(d) => `${d.userId}-${d.leaveTypeId}-${d.periodKey}`} size="small" pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], defaultPageSize: 20, hideOnSinglePage: true }} columns={detailCols} dataSource={result.details} className="lvc-table" />}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* POLICY ALLOCATIONS */}
      <div className="lvc-section">
        <div className="lvc-section-head">
          <ProfileOutlined style={{ color: PALETTE.blue }} /> Policy Allocations
          {canReadLeavePolicy && <button type="button" className="lvc-link" onClick={() => router.push('/leaves-v2/policy')}>Manage <ArrowRightOutlined /></button>}
        </div>
        <div className="lvc-table-wrap">
          <Table
            rowKey="id"
            size="small"
            className="lvc-table"
            loading={polLoading}
            columns={policyCols}
            dataSource={policies}
            pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], defaultPageSize: 20, hideOnSinglePage: true }}
            expandable={{ expandedRowRender: expandedPolicy, onExpand: onExpandPolicy, rowExpandable: (r) => r.lineCount > 0 }}
            locale={{ emptyText: 'No active policies' }}
          />
        </div>
      </div>

      <style jsx global>{`
        .lvc { display: flex; flex-direction: column; }
        .lvc-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 16px; border-bottom: 1px solid var(--border-slate-200); }
        .lvc-header-about { display: flex; align-items: center; gap: 12px; }
        .lvc-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.grey}; color: ${PALETTE.grey}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .lvc-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .lvc-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .lvc-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; }
        .lvc-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .lvc-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; margin-bottom: 18px; }
        .lvc-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); }
        .lvc-card-head { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100); font-size: 13px; font-weight: 700; color: var(--text-slate-800); }
        .lvc-card-body { padding: 14px 16px; }
        .lvc-field-label { font-size: 12px; font-weight: 600; color: var(--text-slate-700); }
        .lvc-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 10px; line-height: 1.5; }
        .lvc-hint code { background: var(--bg-slate-100); padding: 1px 5px; border-radius: 4px; font-size: 11px; }
        .lvc-section { margin-bottom: 18px; }
        .lvc-section-head { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--text-slate-800); margin-bottom: 12px; }
        .lvc-link { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 600; color: ${PALETTE.blue}; display: inline-flex; align-items: center; gap: 4px; }
        .lvc-run-bar { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 14px 16px; }
        .lvc-run-field { display: flex; flex-direction: column; gap: 6px; }
        .lvc-result { margin-top: 14px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); }
        .lvc-result-banner { display: flex; align-items: center; gap: 8px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; }
        .lvc-result-close { margin-left: auto; background: none; border: none; cursor: pointer; opacity: 0.7; display: inline-flex; padding: 2px; }
        .lvc-result-close:hover { opacity: 1; }
        .lvc-result-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border-slate-100); border-bottom: 1px solid var(--border-slate-100); }
        .lvc-rstat { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--bg-pure-white); }
        .lvc-rstat-icon { font-size: 18px; }
        .lvc-rstat-val { font-size: 20px; font-weight: 800; color: var(--text-slate-900); line-height: 1; }
        .lvc-rstat-label { font-size: 11px; color: var(--text-slate-400); margin-top: 3px; }
        .lvc-result-grid { display: grid; grid-template-columns: 1fr 1.3fr; gap: 16px; padding: 16px; }
        .lvc-mini-head { font-size: 12px; font-weight: 700; color: var(--text-slate-600); margin-bottom: 8px; }
        .lvc-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); }
        .lvc-table .ant-table { font-size: 12px; }
        .lvc-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 7px 12px !important; }
        .lvc-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 7px 12px !important; }
        @media (max-width: 900px) { .lvc-result-grid { grid-template-columns: 1fr; } .lvc-result-stats { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
