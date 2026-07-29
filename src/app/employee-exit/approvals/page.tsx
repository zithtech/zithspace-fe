'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {  Button, Table, Dropdown, Select , App } from 'antd';
import { Search, MoreVertical, ArrowUpRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { message: messageApi } = App.useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await EmployeeExitService.getPendingApprovals();
      setRequests(data || []);
    } catch (error) {
      messageApi.error('Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setLoading(true);
      await EmployeeExitService.updateExitStatus(id, status);
      messageApi.success(`Exit request marked as ${status}`);
      fetchApprovals();
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to update status');
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const q = searchText.toLowerCase();
      const n1 = (r.employee?.first_name || '').toLowerCase();
      const n2 = (r.employee?.last_name || '').toLowerCase();
      const code = (r.employee?.employee_code || '').toLowerCase();
      return n1.includes(q) || n2.includes(q) || code.includes(q);
    });
  }, [requests, searchText]);

  const stats = useMemo(() => {
    const total = requests.length;
    const standard = requests.filter(r => !r.waiveNoticePeriod).length;
    const waived = requests.filter(r => r.waiveNoticePeriod).length;
    return { total, standard, waived };
  }, [requests]);

  const total = filteredRequests.length;
  const pageCount = Math.ceil(total / pageSize);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pagedData = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      title: 'EMPLOYEE',
      key: 'employee',
      render: (_: any, record: EmployeeExitRequest) => {
        const name = `${record.employee?.first_name || ''} ${record.employee?.last_name || ''}`.trim() || 'N/A';
        const code = record.employee?.employee_code || '';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-blue-50)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, border: '1px solid var(--border-blue-200)' }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{code}</span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'RESIGN DATE',
      dataIndex: 'resignationDate',
      key: 'resignationDate',
      render: (date: string) => <span style={{ color: 'var(--text-slate-400)', fontSize: 12 }}>{date ? dayjs(date).format('MMM DD, YYYY') : '—'}</span>,
    },
    {
      title: 'LWD',
      dataIndex: 'proposedLastWorkingDay',
      key: 'lwd',
      render: (date: string) => <span style={{ color: 'var(--text-slate-400)', fontSize: 12 }}>{date ? dayjs(date).format('MMM DD, YYYY') : '—'}</span>,
    },
    {
      title: 'NOTICE PERIOD',
      key: 'noticePeriod',
      render: (_: any, record: EmployeeExitRequest) => {
        const waived = record.waiveNoticePeriod;
        let noticeDaysStr = 'STANDARD';
        if (!waived && record.resignationDate && record.noticePeriodDay) {
          const days = dayjs(record.noticePeriodDay).diff(dayjs(record.resignationDate), 'day');
          if (days >= 0) noticeDaysStr = `${days} Days`;
        }
        const cfg = waived
          ? { bg: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }
          : { bg: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' };
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, color: cfg.color, border: cfg.border, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
            {waived ? 'WAIVED' : noticeDaysStr}
          </span>
        );
      }
    },
    {
      title: 'MANAGER',
      dataIndex: 'reportingManagerName',
      key: 'manager',
      render: (name: string) => {
        let displayName = name || 'N/A';
        try {
          if (name && name.startsWith('{')) {
            const obj = JSON.parse(name);
            displayName = obj.label || obj.value || name;
          }
        } catch (e) {}
        return <span style={{ color: 'var(--text-slate-400)', fontSize: 12 }}>{displayName}</span>;
      }
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      align: 'center' as const,
      render: (_: any, record: EmployeeExitRequest) => (
        <Dropdown
          menu={{ items: [
            { key: '1', label: 'Approve Request', onClick: () => handleUpdateStatus(record.id, 'APPROVED') },
            { key: '2', label: 'Reject Request', danger: true, onClick: () => handleUpdateStatus(record.id, 'REJECTED') },
          ]}}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreVertical size={15} color="var(--text-slate-400)" />} style={{ minWidth: 28 }} />
        </Dropdown>
      )
    }
  ];

  return (
    <>
      

      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="exit-search-bar" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', width: 300, height: 32 }}>
            <Search size={13} color="var(--text-slate-400)" style={{ marginRight: 8, flexShrink: 0 }} />
            <input placeholder="Search approvals..." value={searchText} onChange={e => setSearchText(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: 'var(--text-primary)' }} />
          </div>
          <span className="exit-topbar-meta"><span className="exit-pulse" /><strong>{total}</strong> approvals</span>
        </div>
      </div>

      <div className="exit-body">
        <div className="exit-stats exit-stats-4">
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><ArrowUpRight size={13} /></span><span className="exit-stat-label">Total Pending</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.total}</span></div><span className="exit-stat-period">Awaiting action</span></div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={13} /></span><span className="exit-stat-label">Standard Notice</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.standard}</span></div><span className="exit-stat-period">Regular exit</span></div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={13} /></span><span className="exit-stat-label">Waived Notice</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.waived}</span></div><span className="exit-stat-period">Exceptions</span></div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><XCircle size={13} /></span><span className="exit-stat-label">Overdue</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">0</span></div><span className="exit-stat-period">SLA Breached</span></div>
          </div>
        </div>

        <div className="exit-table-wrap">
          <Table size="small" className="exit-table" columns={columns} dataSource={pagedData} rowKey="id" loading={loading} pagination={false} scroll={{ x: 900 }} />
        </div>
      </div>

      {total > 0 && (
        <div className="exit-footer exit-footer--sticky">
          <div className="exit-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="exit-pager">
            <button type="button" className="exit-pager-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`exit-pager-num ${p === currentPage ? 'is-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button type="button" className="exit-pager-btn" disabled={currentPage >= pageCount} onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}>›</button>
            <Select className="exit-pagesize" value={pageSize} onChange={(v) => { setPageSize(v); setCurrentPage(1); }} options={[10, 20, 25, 50].map(n => ({ value: n, label: `${n} / page` }))} popupMatchSelectWidth={110} />
          </div>
        </div>
      )}
    </>
  );
}
