'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Table, Select, Tooltip, App } from 'antd';
import {
  Search,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  RotateCw,
  X,
  Check,
  X as CloseIcon
} from 'lucide-react';
import dayjs from 'dayjs';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { StatCards } from '@/components/common/StatCards';
import { FilterBar, FilterToggleButton, TicketFilterPill } from '@/components/common/FilterBar';
import NoData from '@/components/common/NoData';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [noticeFilter, setNoticeFilter] = useState<string | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

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
      if (noticeFilter === 'waived' && !r.waiveNoticePeriod) return false;
      if (noticeFilter === 'standard' && r.waiveNoticePeriod) return false;
      if (!searchText) return true;
      const q = searchText.toLowerCase();
      const n1 = (r.employee?.first_name || '').toLowerCase();
      const n2 = (r.employee?.last_name || '').toLowerCase();
      const code = (r.employee?.employee_code || '').toLowerCase();
      return n1.includes(q) || n2.includes(q) || code.includes(q);
    });
  }, [requests, searchText, noticeFilter]);

  const stats = useMemo(() => {
    const total = requests.length;
    const standard = requests.filter(r => !r.waiveNoticePeriod).length;
    const waived = requests.filter(r => r.waiveNoticePeriod).length;
    return { total, standard, waived };
  }, [requests]);

  const activeFilterCount = noticeFilter ? 1 : 0;
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
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12, border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-slate-900, #0f172a)', fontSize: 13 }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-slate-400, #94a3b8)' }}>{code}</span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'EXIT TYPE',
      dataIndex: 'exitType',
      key: 'exitType',
      render: (t: any) => (
        <span style={{ color: 'var(--text-slate-700, #334155)', fontSize: 12.5, fontWeight: 500 }}>
          {t?.name || 'Resignation'}
        </span>
      )
    },
    {
      title: 'RESIGN DATE',
      dataIndex: 'resignationDate',
      key: 'resignationDate',
      render: (date: string) => (
        <span style={{ color: 'var(--text-slate-500, #64748b)', fontSize: 12.5 }}>
          {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
        </span>
      )
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, color: cfg.color, border: cfg.border, padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em' }}>
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
        return <span style={{ color: 'var(--text-slate-500, #64748b)', fontSize: 12.5 }}>{displayName}</span>;
      }
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 140,
      align: 'right' as const,
      render: (_: any, record: EmployeeExitRequest) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <Button
            type="primary"
            size="small"
            icon={<Check size={12} />}
            onClick={() => handleUpdateStatus(record.id, 'APPROVED')}
            style={{ background: '#10b981', borderColor: '#10b981', fontSize: 11.5, fontWeight: 600, height: 26, borderRadius: 5 }}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseIcon size={12} />}
            onClick={() => handleUpdateStatus(record.id, 'REJECTED')}
            style={{ fontSize: 11.5, fontWeight: 600, height: 26, borderRadius: 5 }}
          >
            Reject
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="exit-search-bar" style={{ display: 'flex', alignItems: 'center', padding: '0 12px', width: 280, height: 32 }}>
            <Search size={14} color="var(--text-slate-400)" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              placeholder="Search approvals..."
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: 'var(--text-primary)' }}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-slate-400)', display: 'flex', alignItems: 'center' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
          <FilterToggleButton
            isOpen={isFilterOpen}
            onToggle={() => setIsFilterOpen(prev => !prev)}
            activeCount={activeFilterCount}
          />
          <span className="exit-topbar-meta">
            <span className="exit-pulse" />
            <strong>{total}</strong> approvals pending
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip title="Refresh">
            <button
              type="button"
              className="exit-ghost-btn"
              onClick={fetchApprovals}
              aria-label="Refresh"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="exit-body">
        <StatCards
          title="Approvals Overview"
          statusText="PENDING"
          statusColor="#f59e0b"
          progressPct={stats.total > 0 ? Math.round(((stats.standard) / stats.total) * 100) : 0}
          cells={[
            {
              title: 'Total Pending',
              value: stats.total,
              icon: <ArrowUpRight size={14} />,
              color: '#3b82f6',
              tint: 'rgba(59,130,246,0.1)',
              hint: 'Awaiting action'
            },
            {
              title: 'Standard Notice',
              value: stats.standard,
              icon: <CheckCircle size={14} />,
              color: '#10b981',
              tint: 'rgba(16,185,129,0.1)',
              hint: 'Regular exit'
            },
            {
              title: 'Waived Notice',
              value: stats.waived,
              icon: <Clock size={14} />,
              color: '#f59e0b',
              tint: 'rgba(245,158,11,0.1)',
              hint: 'Exceptions requested'
            },
            {
              title: 'Overdue / Escalated',
              value: 0,
              icon: <XCircle size={14} />,
              color: '#64748b',
              tint: 'rgba(100,116,139,0.1)',
              hint: 'Within SLA'
            },
          ]}
        />

        {isFilterOpen && (
          <FilterBar
            activeCount={activeFilterCount}
            onReset={() => {
              setNoticeFilter(undefined);
              setSearchText("");
              setCurrentPage(1);
            }}
            onClose={() => setIsFilterOpen(false)}
          >
            <TicketFilterPill
              label="Notice Period"
              icon={<Clock size={12} />}
              value={noticeFilter}
              options={[
                { value: 'standard', label: 'Standard Notice', dotColor: '#10b981' },
                { value: 'waived', label: 'Waived Notice', dotColor: '#f59e0b' },
              ]}
              onChange={(v) => {
                setNoticeFilter(v ? String(v) : undefined);
                setCurrentPage(1);
              }}
            />
          </FilterBar>
        )}

        <div className="exit-table-wrap">
          <ZukvoLoadingOverlay loading={loading} message="">
            <Table
              size="small"
              className="exit-table"
              columns={columns}
              dataSource={pagedData}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
              locale={{
                emptyText: (
                  <NoData
                    title="No Pending Approvals"
                    description="There are no exit requests awaiting your approval."
                  />
                )
              }}
            />
          </ZukvoLoadingOverlay>
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
