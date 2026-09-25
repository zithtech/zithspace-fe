'use client';

import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";

import { Menu } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Table, Tag, message, Tooltip, Pagination } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import PayrollV2Service, { PayPayslip } from '@/services/payrollV2Service';

const PALETTE = { cyan: '#06B6D4', green: '#10B981', red: '#EF4444', slate: '#64748B' } as const;
const TINT = { cyan: 'rgba(6,182,212,0.10)', green: 'rgba(16,185,129,0.10)' } as const;
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n: number) => `₹${inr.format(Math.round(n))}`;

export default function MyPayslipsPanel({ hideSidebarToggle }: { hideSidebarToggle?: boolean } = {}) {
  const [rows, setRows] = useState<PayPayslip[]>([]);
  const [latest, setLatest] = useState<PayPayslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p = page, l = limit) => {
    setLoading(true);
    try {
      const res = await PayrollV2Service.getMyPayslips({ page: p, limit: l });
      setRows(res.data);
      setTotal(res.pagination.total);
      if (p === 1 && res.data.length > 0) {
        setLatest(res.data[0]);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    load(page, limit);
  }, [page, limit, load]);

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
          {!hideSidebarToggle && (
            <button
              type="button"
              className="pv-mobile-menu-btn"
              onClick={() => window.dispatchEvent(new CustomEvent('open-pv-sidebar'))}
            >
              <Menu size={20} />
            </button>
          )}
          <div className="mps-header-icon"><FileTextOutlined /></div>
          <div>
            <div className="mps-header-title">My Payslips</div>
            <div className="mps-header-sub">Download your salary slips</div>
          </div>
        </div>
        <Tooltip title="Refresh"><button type="button" className="mps-ghost-btn" onClick={() => load(page, limit)}><ReloadOutlined spin={loading} /></button></Tooltip>
      </div>

      {loading && rows.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><ZukvoLoader size="md" /></div>
      ) : rows.length === 0 && !loading ? (
        <div style={{ padding: 56 }}><NoData description="No payslips available yet" /></div>
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
          <div className="pv-table-wrap">
            <Table rowKey="id" size="small" columns={columns} dataSource={rows} loading={loading} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: <NoData /> }} />
            {total > 0 && (
              <div className="mps-footer mps-footer--sticky">
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
        .mps { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .mps-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 0; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .mps-header-about { display: flex; align-items: center; gap: 12px; }
        .mps-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.cyan}; color: ${PALETTE.cyan}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .mps-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .mps-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .mps-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }

        .mps-loading { display: flex; align-items: center; justify-content: center; padding: 64px 0; }
        
        .mps-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 24px; background: var(--bg-pure-white); border: 1px dashed var(--border-slate-300); border-radius: 12px; text-align: center; }
        .mps-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); margin-top: 16px; }
        .mps-empty-sub { font-size: 13px; color: var(--text-slate-500); margin-top: 4px; }

        .mps-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0px !important; overflow: hidden; }
        .pv-table-wrap .ant-table, .pv-table-wrap .ant-table-container, .pv-table-wrap .ant-table-header, .pv-table-wrap .ant-table-thead, .pv-table-wrap .ant-table-thead > tr > th, .pv-table-wrap .ant-table-container table > thead > tr:first-child > th:first-child, .pv-table-wrap .ant-table-container table > thead > tr:first-child > th:last-child { border-radius: 0px !important; border-start-start-radius: 0px !important; border-start-end-radius: 0px !important; }
        .mps-table .ant-table, .mps-table .ant-table-container { background: transparent; font-size: 12.5px; border-radius: 0px !important; }
        .mps-table .ant-table-thead > tr > th, .mps-table .ant-table-container table > thead > tr:first-child > th:first-child, .mps-table .ant-table-container table > thead > tr:first-child > th:last-child { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 9px 12px !important; border-radius: 0px !important; border-start-start-radius: 0px !important; border-start-end-radius: 0px !important; }
        .mps-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 10px 12px !important; }
        .mps-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .mps-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }

        .mps-footer { display: flex; align-items: center; justify-content: flex-end; padding: 10px 16px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); }
        .mps-footer--sticky { position: sticky; bottom: 0; z-index: 10; box-shadow: 0 -4px 14px rgba(15, 23, 42, 0.05); }
        .mps-footer .ant-pagination { width: 100%; display: flex; align-items: center; justify-content: space-between; margin: 0 !important; padding: 0 !important; border-top: none !important; background: transparent !important; flex-wrap: wrap; gap: 8px; }
        .mps-footer .ant-pagination-total-text { margin-right: auto; color: var(--text-slate-500); font-size: 12.5px; }

        .mps-header-about { display: flex; align-items: center; gap: 12px; flex: 1 1 auto; min-width: 250px; }

        .mps-hero { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; margin: 12px 22px 16px 22px; border: 1px solid var(--border-color); border-radius: 12px; background: linear-gradient(120deg, ${TINT.green}, ${TINT.cyan}); }
        .mps-hero-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-slate-500); }
        .mps-hero-net { font-size: 32px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.03em; line-height: 1.1; margin: 4px 0; }
        .mps-hero-sub { font-size: 12.5px; color: var(--text-slate-600); }

        .mps-cal { width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }

        @media (max-width: 900px) {
          .mps-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .mps-hero {
            margin: 12px 16px 16px 16px;
          }
        }
        @media (max-width: 600px) {
          .mps-hero {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .mps-hero .ant-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
