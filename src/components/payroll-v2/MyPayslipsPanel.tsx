'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Table, Tag, message, Spin, Empty, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import PayrollV2Service, { PayPayslip } from '@/services/payrollV2Service';

const PALETTE = { cyan: '#06B6D4', green: '#10B981', red: '#EF4444', slate: '#64748B' } as const;
const TINT = { cyan: 'rgba(6,182,212,0.10)', green: 'rgba(16,185,129,0.10)' } as const;
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n: number) => `₹${inr.format(Math.round(n))}`;

export default function MyPayslipsPanel() {
  const [rows, setRows] = useState<PayPayslip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await PayrollV2Service.getMyPayslips()); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to load payslips'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const latest = rows[0];

  const columns: ColumnsType<PayPayslip> = [
    {
      title: 'Period', dataIndex: 'periodLabel', key: 'period',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span className="mps-cal" style={{ background: TINT.cyan, color: PALETTE.cyan }}><FileTextOutlined /></span>
          <span style={{ fontWeight: 700 }}>{r.periodLabel}</span>
        </div>
      ),
    },
    { title: 'Gross', dataIndex: 'gross', key: 'gross', render: (v) => money(v) },
    { title: 'Deductions', dataIndex: 'totalDeductions', key: 'ded', render: (v) => <span style={{ color: PALETTE.red }}>−{money(v)}</span> },
    { title: 'LOP', dataIndex: 'lopDays', key: 'lop', render: (v) => (v > 0 ? <Tag color="orange">{v} day{v === 1 ? '' : 's'}</Tag> : <span style={{ color: 'var(--text-slate-300)' }}>—</span>) },
    { title: 'Net Pay', dataIndex: 'net', key: 'net', render: (v) => <span style={{ fontWeight: 800, color: PALETTE.green }}>{money(v)}</span> },
    {
      title: '', key: 'dl', width: 120, align: 'right',
      render: (_, r) => <Button size="small" type="primary" ghost icon={<DownloadOutlined />} href={r.fileUrl} target="_blank">Download</Button>,
    },
  ];

  return (
    <div className="mps">
      <div className="mps-header">
        <div className="mps-header-about">
          <div className="mps-header-icon"><FileTextOutlined /></div>
          <div>
            <div className="mps-header-title">My Payslips</div>
            <div className="mps-header-sub">Download your salary slips</div>
          </div>
        </div>
        <Tooltip title="Refresh"><button type="button" className="mps-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin /></div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 56 }}><Empty description="No payslips available yet" /></div>
      ) : (
        <>
          {latest && (
            <div className="mps-hero">
              <div className="mps-hero-left">
                <div className="mps-hero-label">Latest · {latest.periodLabel}</div>
                <div className="mps-hero-net">{money(latest.net)}</div>
                <div className="mps-hero-sub">Net pay · Gross {money(latest.gross)} · Deductions {money(latest.totalDeductions)}</div>
              </div>
              <Button type="primary" icon={<DownloadOutlined />} href={latest.fileUrl} target="_blank" size="large">Download payslip</Button>
            </div>
          )}
          <div className="mps-table-wrap">
            <Table rowKey="id" size="small" className="mps-table" columns={columns} dataSource={rows} pagination={false} />
          </div>
        </>
      )}

      <style jsx global>{`
        .mps { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .mps-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); }
        .mps-header-about { display: flex; align-items: center; gap: 12px; }
        .mps-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.cyan}; color: ${PALETTE.cyan}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .mps-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .mps-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .mps-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }

        .mps-hero { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; margin-bottom: 16px; border: 1px solid var(--border-color); border-radius: 12px; background: linear-gradient(120deg, ${TINT.green}, ${TINT.cyan}); }
        .mps-hero-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-slate-500); }
        .mps-hero-net { font-size: 32px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.03em; line-height: 1.1; margin: 4px 0; }
        .mps-hero-sub { font-size: 12.5px; color: var(--text-slate-600); }

        .mps-cal { width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .mps-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; overflow: hidden; }
        .mps-table .ant-table { background: transparent; font-size: 12.5px; }
        .mps-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 9px 12px !important; }
        .mps-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 10px 12px !important; }
        .mps-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .mps-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
      `}</style>
    </div>
  );
}
