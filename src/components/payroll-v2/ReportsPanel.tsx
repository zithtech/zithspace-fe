'use client';

import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";

import { Menu } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Select, Button, Table, Tag, message, Pagination } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, DownloadOutlined, BarChartOutlined, TeamOutlined, PlusCircleOutlined, MinusCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import PayrollV2Service, { PayRun, SalaryRegister, RegisterRow } from '@/services/payrollV2Service';
import { StatCards } from '@/components/payroll-v2/ui';

const PALETTE = { violet: '#8B5CF6', green: '#10B981', red: '#EF4444', blue: '#3B82F6', slate: '#64748B' } as const;
const TINT = { violet: 'rgba(139,92,246,0.10)', green: 'rgba(16,185,129,0.10)', blue: 'rgba(59,130,246,0.10)', red: 'rgba(239,68,68,0.10)' } as const;
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n: number) => `₹${inr.format(Math.round(n))}`;
const STATUS_TAG_STYLE: Record<string, {color: string; border: string}> = {
  draft: { color: PALETTE.slate, border: 'rgba(100,116,139,0.3)' },
  pending_approval: { color: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
  approved: { color: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
  finalized: { color: '#10B981', border: 'rgba(16,185,129,0.3)' },
  paid: { color: '#10B981', border: 'rgba(16,185,129,0.3)' },
  cancelled: { color: '#EF4444', border: 'rgba(239,68,68,0.3)' },
};

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

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const res = await PayrollV2Service.listRuns({ page: 1, limit: 100 });
      const r = Array.isArray(res) ? res : res.data;
      setRuns(r);
      if (r.length && !runId) setRunId(r[0].id);
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to load runs'); }
    finally { setLoadingRuns(false); }
  }, [runId]);
  useEffect(() => { if (canReadPayrollReports) loadRuns(); }, [canReadPayrollReports, loadRuns]);

  const loadRegister = useCallback(async (id: string, p = page, l = limit) => {
    setLoadingReg(true);
    try {
      const data = await PayrollV2Service.getSalaryRegister(id, { page: p, limit: l });
      setReg(data);
      setTotal(data.pagination?.total ?? data.rows.length);
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to load register'); setReg(null); }
    finally { setLoadingReg(false); }
  }, [page, limit]);

  useEffect(() => {
    if (runId) loadRegister(runId, page, limit);
  }, [runId, page, limit, loadRegister]);

  const downloadCsv = async () => {
    if (!runId || !reg) return;
    try {
      // Fetch full register dataset for complete CSV download
      const fullReg = await PayrollV2Service.getSalaryRegister(runId, { page: 1, limit: 10000 });
      const head = ['Employee', 'Designation', 'Paid Days', 'LOP Days',
        ...fullReg.earningCols.map((c) => c.name), 'Gross',
        ...fullReg.deductionCols.map((c) => c.name), 'Total Deductions', 'Net'];
      const lines = [head.map(csvCell).join(',')];
      for (const r of fullReg.rows) {
        lines.push([
          r.name, r.designation ?? '', r.paidDays, r.lopDays,
          ...fullReg.earningCols.map((c) => r.amounts[c.code] ?? 0), r.gross,
          ...fullReg.deductionCols.map((c) => r.amounts[c.code] ?? 0), r.totalDeductions, r.net,
        ].map(csvCell).join(','));
      }
      const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `salary-register-${fullReg.run.periodLabel.replace(/\s+/g, '-')}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      message.error('Failed to download CSV report');
    }
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
          <button
            type="button"
            className="pv-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('open-pv-sidebar'))}
          >
            <Menu size={20} />
          </button>
          <div className="rpt-header-icon"><BarChartOutlined /></div>
          <div>
            <div className="rpt-header-title">Reports</div>
            <div className="rpt-header-sub">Salary register &amp; statutory summary per pay run</div>
          </div>
        </div>
        <div className="rpt-header-actions">
          <Select
            value={runId} onChange={(val) => { setRunId(val); setPage(1); }} loading={loadingRuns} style={{ width: 260 }} placeholder="Select a pay run"
            options={runs.map((r) => ({ value: r.id, label: `${r.periodLabel} · ${r.payGroupName}` }))}
          />
          <button type="button" className="rpt-ghost-btn" onClick={() => runId && loadRegister(runId, page, limit)}><ReloadOutlined spin={loadingReg} /></button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={downloadCsv} disabled={!reg || reg.rows.length === 0}>Download CSV</Button>
        </div>
      </div>

      {loadingReg && (!reg || page === 1) ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><ZukvoLoader size="md" /></div>
      ) : !reg ? (
        <div style={{ padding: 56 }}><NoData description={runs.length ? 'Select a pay run' : 'No pay runs yet'} /></div>
      ) : (
        <>
          <StatCards
            title={reg.run.periodLabel}
            statusText={reg.run.status}
            statusColor={STATUS_TAG_STYLE[reg.run.status]?.color ?? PALETTE.slate}
            statusBorder={STATUS_TAG_STYLE[reg.run.status]?.border ?? 'rgba(100,116,139,0.3)'}
            cells={[
              { label: 'Employees', value: reg.run.employeeCount, icon: <TeamOutlined />, color: PALETTE.blue, tint: TINT.blue },
              { label: 'Gross', value: money(reg.run.totalGross), icon: <PlusCircleOutlined />, color: PALETTE.slate, tint: 'rgba(100,116,139,0.1)' },
              { label: 'Deductions', value: `−${money(reg.run.totalDeductions)}`, icon: <MinusCircleOutlined />, color: PALETTE.red, tint: TINT.red },
              { label: 'Net Payout', value: money(reg.run.totalNet), icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
            ]}
          />

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

          <div className="pv-table-wrap">
            <Table
              rowKey="employeeId" size="small" columns={columns} dataSource={reg.rows} loading={loadingReg}
              pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: <NoData /> }}
            />
            {total > 0 && (
              <div className="rpt-footer rpt-footer--sticky">
                <Pagination
                  size="small"
                  current={page}
                  pageSize={limit}
                  total={total}
                  showSizeChanger
                  pageSizeOptions={[10, 15, 20, 25, 50, 100]}
                  onChange={(newPage, newPageSize) => {
                    setPage(newPage);
                    setLimit(newPageSize);
                  }}
                  showTotal={(t, range) => (
                    <span>
                      Showing <strong>{range[0]}–{range[1]}</strong> of <strong>{t}</strong>
                    </span>
                  )}
                />
              </div>
            )}
          </div>
        </>
      )}

      <style jsx global>{`
        .rpt { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .rpt-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 0; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .rpt-header-about { display: flex; align-items: center; gap: 12px; flex: 1 1 auto; min-width: 250px; }
        .rpt-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.violet}; color: ${PALETTE.violet}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .rpt-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .rpt-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .rpt-header-actions { display: flex; align-items: center; gap: 8px; }
        .rpt-ghost-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }

        .rpt-stat { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .rpt-stat-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-slate-400); margin-bottom: 10px; }
        .rpt-stat-cells { display: flex; gap: 28px; flex-wrap: wrap; }
        .rpt-stat-cell { display: flex; flex-direction: column; gap: 2px; }
        .rpt-stat-cell span { font-size: 11px; color: var(--text-slate-500); }
        .rpt-stat-cell strong { font-size: 15px; font-weight: 800; color: ${PALETTE.red}; }

        .rpt-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0px !important; overflow: hidden; }
        .pv-table-wrap .ant-table, .pv-table-wrap .ant-table-container, .pv-table-wrap .ant-table-header, .pv-table-wrap .ant-table-thead, .pv-table-wrap .ant-table-thead > tr > th, .pv-table-wrap .ant-table-container table > thead > tr:first-child > th:first-child, .pv-table-wrap .ant-table-container table > thead > tr:first-child > th:last-child { border-radius: 0px !important; border-start-start-radius: 0px !important; border-start-end-radius: 0px !important; }
        .rpt-table .ant-table, .rpt-table .ant-table-container { background: transparent; font-size: 12px; border-radius: 0px !important; }
        .rpt-table .ant-table-thead > tr > th, .rpt-table .ant-table-container table > thead > tr:first-child > th:first-child, .rpt-table .ant-table-container table > thead > tr:first-child > th:last-child { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 9.5px !important; font-weight: 700 !important; letter-spacing: 0.03em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 10px !important; white-space: nowrap !important; border-radius: 0px !important; border-start-start-radius: 0px !important; border-start-end-radius: 0px !important; }
        .rpt-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 10px !important; white-space: nowrap; }
        .rpt-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .rpt-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }

        .rpt-footer { display: flex; align-items: center; justify-content: flex-end; padding: 10px 16px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); }
        .rpt-footer--sticky { position: sticky; bottom: 0; z-index: 10; box-shadow: 0 -4px 14px rgba(15, 23, 42, 0.05); }
        .rpt-footer .ant-pagination { width: 100%; display: flex; align-items: center; justify-content: space-between; margin: 0 !important; padding: 0 !important; border-top: none !important; background: transparent !important; flex-wrap: wrap; gap: 8px; }
        .rpt-footer .ant-pagination-total-text { margin-right: auto; color: var(--text-slate-500); font-size: 12.5px; }

        @media (max-width: 900px) {
          .rpt-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .rpt-header-actions {
            flex-wrap: wrap;
            width: 100%;
          }
          .rpt-header-actions > * {
            flex: 1;
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
}
