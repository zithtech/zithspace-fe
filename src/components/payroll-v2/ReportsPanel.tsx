'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Select, Button, Table, Tag, message, Spin, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, DownloadOutlined, BarChartOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import PayrollV2Service, { PayRun, SalaryRegister, RegisterRow } from '@/services/payrollV2Service';

const PALETTE = { violet: '#8B5CF6', green: '#10B981', red: '#EF4444', blue: '#3B82F6', slate: '#64748B' } as const;
const TINT = { violet: 'rgba(139,92,246,0.10)', green: 'rgba(16,185,129,0.10)', blue: 'rgba(59,130,246,0.10)', red: 'rgba(239,68,68,0.10)' } as const;
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n: number) => `₹${inr.format(Math.round(n))}`;
const STATUS_COLOR: Record<string, string> = { draft: 'default', pending_approval: 'gold', approved: 'blue', finalized: 'green', paid: 'green', cancelled: 'red' };

function csvCell(v: string | number): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ReportsPanel() {
  const { canReadPayrollReports } = usePermission();
  const [runs, setRuns] = useState<PayRun[]>([]);
  const [runId, setRunId] = useState<string | undefined>(undefined);
  const [reg, setReg] = useState<SalaryRegister | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingReg, setLoadingReg] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const r = await PayrollV2Service.listRuns();
      setRuns(r);
      if (r.length && !runId) setRunId(r[0].id);
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to load runs'); }
    finally { setLoadingRuns(false); }
  }, [runId]);
  useEffect(() => { if (canReadPayrollReports) loadRuns(); }, [canReadPayrollReports, loadRuns]);

  const loadRegister = useCallback(async (id: string) => {
    setLoadingReg(true);
    try { setReg(await PayrollV2Service.getSalaryRegister(id)); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to load register'); setReg(null); }
    finally { setLoadingReg(false); }
  }, []);
  useEffect(() => { if (runId) loadRegister(runId); }, [runId, loadRegister]);

  const downloadCsv = () => {
    if (!reg) return;
    const head = ['Employee', 'Designation', 'Paid Days', 'LOP Days',
      ...reg.earningCols.map((c) => c.name), 'Gross',
      ...reg.deductionCols.map((c) => c.name), 'Total Deductions', 'Net'];
    const lines = [head.map(csvCell).join(',')];
    for (const r of reg.rows) {
      lines.push([
        r.name, r.designation ?? '', r.paidDays, r.lopDays,
        ...reg.earningCols.map((c) => r.amounts[c.code] ?? 0), r.gross,
        ...reg.deductionCols.map((c) => r.amounts[c.code] ?? 0), r.totalDeductions, r.net,
      ].map(csvCell).join(','));
    }
    const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `salary-register-${reg.run.periodLabel.replace(/\s+/g, '-')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<RegisterRow> = useMemo(() => {
    if (!reg) return [];
    const earn: ColumnsType<RegisterRow> = reg.earningCols.map((c) => ({
      title: c.name, key: `e_${c.code}`, align: 'right' as const, width: 110,
      render: (_: any, r: RegisterRow) => money(r.amounts[c.code] ?? 0),
    }));
    const ded: ColumnsType<RegisterRow> = reg.deductionCols.map((c) => ({
      title: c.name, key: `d_${c.code}`, align: 'right' as const, width: 110,
      render: (_: any, r: RegisterRow) => <span style={{ color: PALETTE.red }}>{(r.amounts[c.code] ?? 0) ? '−' : ''}{money(r.amounts[c.code] ?? 0)}</span>,
    }));
    return [
      {
        title: 'Employee', key: 'emp', fixed: 'left' as const, width: 180,
        render: (_: any, r: RegisterRow) => (
          <div><div style={{ fontWeight: 600 }}>{r.name}</div>{r.designation && <div style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{r.designation}</div>}</div>
        ),
      },
      { title: 'Paid', key: 'paid', width: 64, align: 'center' as const, render: (_: any, r: RegisterRow) => <span>{r.paidDays}</span> },
      { title: 'LOP', key: 'lop', width: 60, align: 'center' as const, render: (_: any, r: RegisterRow) => (r.lopDays > 0 ? <Tag color="orange" style={{ margin: 0 }}>{r.lopDays}</Tag> : '—') },
      ...earn,
      { title: 'Gross', key: 'gross', align: 'right' as const, width: 110, render: (_: any, r: RegisterRow) => <strong>{money(r.gross)}</strong> },
      ...ded,
      { title: 'Net Pay', key: 'net', fixed: 'right' as const, align: 'right' as const, width: 120, render: (_: any, r: RegisterRow) => <strong style={{ color: PALETTE.green }}>{money(r.net)}</strong> },
    ];
  }, [reg]);

  if (!canReadPayrollReports) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.slate }}>You don’t have permission to view payroll reports.</div>;
  }

  return (
    <div className="rpt">
      <div className="rpt-header">
        <div className="rpt-header-about">
          <div className="rpt-header-icon"><BarChartOutlined /></div>
          <div>
            <div className="rpt-header-title">Reports</div>
            <div className="rpt-header-sub">Salary register &amp; statutory summary per pay run</div>
          </div>
        </div>
        <div className="rpt-header-actions">
          <Select
            value={runId} onChange={setRunId} loading={loadingRuns} style={{ width: 260 }} placeholder="Select a pay run"
            options={runs.map((r) => ({ value: r.id, label: `${r.periodLabel} · ${r.payGroupName}` }))}
          />
          <button type="button" className="rpt-ghost-btn" onClick={() => runId && loadRegister(runId)}><ReloadOutlined spin={loadingReg} /></button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={downloadCsv} disabled={!reg || reg.rows.length === 0}>Download CSV</Button>
        </div>
      </div>

      {loadingReg ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin /></div>
      ) : !reg ? (
        <div style={{ padding: 56 }}><Empty description={runs.length ? 'Select a pay run' : 'No pay runs yet'} /></div>
      ) : (
        <>
          <div className="rpt-summary">
            <div className="rpt-sum"><span>Period</span><strong>{reg.run.periodLabel} <Tag color={STATUS_COLOR[reg.run.status]} style={{ marginLeft: 4 }}>{reg.run.status}</Tag></strong></div>
            <div className="rpt-sum"><span>Employees</span><strong>{reg.run.employeeCount}</strong></div>
            <div className="rpt-sum"><span>Gross</span><strong>{money(reg.run.totalGross)}</strong></div>
            <div className="rpt-sum"><span>Deductions</span><strong style={{ color: PALETTE.red }}>−{money(reg.run.totalDeductions)}</strong></div>
            <div className="rpt-sum rpt-sum--net"><span>Net Payout</span><strong>{money(reg.run.totalNet)}</strong></div>
          </div>

          {reg.statutory.length > 0 && (
            <div className="rpt-stat">
              <div className="rpt-stat-title">Statutory &amp; deduction totals</div>
              <div className="rpt-stat-cells">
                {reg.statutory.map((s) => (
                  <div key={s.code} className="rpt-stat-cell"><span>{s.name}</span><strong>{money(s.total)}</strong></div>
                ))}
              </div>
            </div>
          )}

          <div className="rpt-table-wrap">
            <Table
              rowKey="employeeId" size="small" className="rpt-table" columns={columns} dataSource={reg.rows}
              pagination={false} scroll={{ x: 'max-content' }}
            />
          </div>
        </>
      )}

      <style jsx global>{`
        .rpt { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .rpt-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .rpt-header-about { display: flex; align-items: center; gap: 12px; }
        .rpt-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.violet}; color: ${PALETTE.violet}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .rpt-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .rpt-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .rpt-header-actions { display: flex; align-items: center; gap: 8px; }
        .rpt-ghost-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }

        .rpt-summary { display: flex; align-items: stretch; gap: 0; flex-wrap: wrap; padding: 16px 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .rpt-sum { display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 2px 22px; }
        .rpt-sum + .rpt-sum { border-left: 1px solid var(--border-slate-200); }
        .rpt-sum span { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-slate-400); }
        .rpt-sum strong { font-size: 16px; font-weight: 800; color: var(--text-slate-900); display: inline-flex; align-items: center; }
        .rpt-sum--net strong { color: ${PALETTE.green}; }

        .rpt-stat { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .rpt-stat-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-slate-400); margin-bottom: 10px; }
        .rpt-stat-cells { display: flex; gap: 28px; flex-wrap: wrap; }
        .rpt-stat-cell { display: flex; flex-direction: column; gap: 2px; }
        .rpt-stat-cell span { font-size: 11px; color: var(--text-slate-500); }
        .rpt-stat-cell strong { font-size: 15px; font-weight: 800; color: ${PALETTE.red}; }

        .rpt-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; overflow: hidden; }
        .rpt-table .ant-table { background: transparent; font-size: 12px; }
        .rpt-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 9.5px !important; font-weight: 700 !important; letter-spacing: 0.03em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 10px !important; white-space: nowrap !important; }
        .rpt-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 10px !important; white-space: nowrap; }
        .rpt-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .rpt-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
      `}</style>
    </div>
  );
}
