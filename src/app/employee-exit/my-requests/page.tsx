'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {  Table, Button, Dropdown, Select, Modal , App } from 'antd';
import { Search, Plus, MoreVertical, ArrowUpRight, CheckCircle, Clock, XCircle, Trash2, Edit2, Eye } from 'lucide-react';
import { EmployeeExitService } from '@/services/employeeExitService';
import dayjs from 'dayjs';
import { CreateExitRequestDrawer } from '@/components/employee-exit/CreateExitRequestDrawer';
import { ExitRequestDetailsDrawer } from '@/components/employee-exit/ExitRequestDetailsDrawer';
import { useAuth } from '@/context/AuthContext';

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const { message: messageApi } = App.useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await EmployeeExitService.getExitRequests();
      const mine = (res || []).filter((r: any) =>
        r.employee_id === user?.employeeId || r.created_by_id === user?.id
      );
      setRequests(mine);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [fetchData, user]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const q = searchText.toLowerCase();
      return (r.exitType?.name || '').toLowerCase().includes(q);
    });
  }, [requests, searchText]);

  const stats = useMemo(() => {
    const total = requests.length;
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const pending = requests.filter(r => !r.status || r.status === 'PENDING').length;
    const rejected = requests.filter(r => r.status === 'REJECTED' || r.status === 'WITHDRAWN').length;
    return { total, approved, pending, rejected };
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
      render: (_: any, record: any) => {
        const name = `${record.employee?.first_name || ''} ${record.employee?.last_name || ''}`.trim() || 'N/A';
        const code = record.employee?.employee_code || '';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'var(--bg-blue-50)', color: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 11, border: '1px solid var(--border-blue-200)'
            }}>
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
      title: 'TYPE',
      key: 'type',
      render: (_: any, record: any) => {
        const name = record.exitType?.name || record.exit_type_id || 'Resignation';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'var(--bg-blue-50)', color: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 11, border: '1px solid var(--border-blue-200)'
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>Exit Request</span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'LWD',
      key: 'lwd',
      render: (_: any, record: any) => (
        <span style={{ color: 'var(--text-slate-400)', fontSize: 12 }}>
          {record.proposedLastWorkingDay ? dayjs(record.proposedLastWorkingDay).format("MMM DD, YYYY") : "—"}
        </span>
      )
    },
    {
      title: 'RESIGN DATE',
      key: 'date',
      render: (_: any, record: any) => (
        <span style={{ color: 'var(--text-slate-400)', fontSize: 12 }}>
          {record.resignationDate ? dayjs(record.resignationDate).format("MMM DD, YYYY") : "—"}
        </span>
      )
    },
    {
      title: 'STATUS',
      key: 'status',
      render: (_: any, record: any) => {
        const s = (record.status || 'PENDING').toUpperCase();
        const cfg: Record<string, { bg: string; color: string; border: string }> = {
          APPROVED:  { bg: 'rgba(16,185,129,0.08)',  color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' },
          PENDING:   { bg: 'rgba(245,158,11,0.08)',  color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' },
          REJECTED:  { bg: 'rgba(239,68,68,0.08)',   color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' },
          WITHDRAWN: { bg: 'rgba(100,116,139,0.08)', color: '#64748b', border: '1px solid rgba(100,116,139,0.25)' },
        };
        const { bg, color, border } = cfg[s] || cfg.PENDING;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color, border, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {s}
          </span>
        );
      }
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view',   label: <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Eye size={13} /> View Details</span> },
              { key: 'edit',   label: <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Edit2 size={13} /> Edit</span> },
              { type: 'divider' as const },
              { key: 'delete', label: <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#ef4444' }}><Trash2 size={13} /> Delete</span>, danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'view') {
                setSelectedRequestId(record.id);
                setDetailsDrawerVisible(true);
              } else if (key === 'edit') {
                setEditingRecord(record);
                setDrawerVisible(true);
              } else if (key === 'delete') {
                Modal.confirm({
                  title: 'Delete Exit Request',
                  content: 'Are you sure you want to delete this exit request? This cannot be undone.',
                  okText: 'Delete',
                  okButtonProps: { danger: true },
                  cancelText: 'Cancel',
                  onOk: async () => {
                    try {
                      await EmployeeExitService.deleteExitRequest(record.id);
                      messageApi.success('Exit request deleted.');
                      fetchData();
                    } catch (e: any) {
                      messageApi.error(e.message || 'Failed to delete.');
                    }
                  }
                });
              }
            }
          }}
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
      

      {/* Header */}
      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="exit-search-bar" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', width: 300, height: 32 }}>
            <Search size={13} color="var(--text-slate-400)" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              placeholder="Search my requests..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: 'var(--text-primary)' }}
            />
          </div>
          <span className="exit-topbar-meta">
            <span className="exit-pulse" />
            <strong>{total}</strong> requests
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            type="primary"
            icon={<Plus size={13} />}
            onClick={() => setDrawerVisible(true)}
            style={{ background: '#3b82f6', border: 'none', fontWeight: 600, borderRadius: 0, height: 30, fontSize: 12 }}
          >
            New Request
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="exit-body">
        {/* Stats */}
        <div className="exit-stats exit-stats-4">
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><ArrowUpRight size={13} /></span><span className="exit-stat-label">Total</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.total}</span></div><span className="exit-stat-period">My requests</span></div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={13} /></span><span className="exit-stat-label">Approved</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.approved}</span></div><span className="exit-stat-period">Cleared</span></div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={13} /></span><span className="exit-stat-label">Pending</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.pending}</span></div><span className="exit-stat-period">Awaiting</span></div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><XCircle size={13} /></span><span className="exit-stat-label">Withdrawn</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.rejected}</span></div><span className="exit-stat-period">Cancelled</span></div>
          </div>
        </div>

        {/* Table */}
        <div className="exit-table-wrap">
          <Table
            size="small"
            columns={columns}
            dataSource={pagedData}
            rowKey="id"
            loading={loading}
            pagination={false}
            className="exit-table"
            scroll={{ x: 700 }}
          />
        </div>
      </div>

      {/* Sticky Footer */}
      {total > 0 && (
        <div className="exit-footer exit-footer--sticky">
          <div className="exit-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="exit-pager">
            <button type="button" className="exit-pager-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`exit-pager-num ${p === currentPage ? 'is-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button type="button" className="exit-pager-btn" disabled={currentPage >= pageCount} onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}>›</button>
            <Select
              className="exit-pagesize"
              value={pageSize}
              onChange={(v) => { setPageSize(v); setCurrentPage(1); }}
              options={[10, 20, 25, 50].map(n => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={110}
            />
          </div>
        </div>
      )}

      <CreateExitRequestDrawer
        visible={drawerVisible}
        initialData={editingRecord}
        onClose={() => { setDrawerVisible(false); setEditingRecord(null); }}
        onSuccess={() => { setDrawerVisible(false); setEditingRecord(null); fetchData(); }}
        isSelfService={true}
      />

      <ExitRequestDetailsDrawer
        visible={detailsDrawerVisible}
        requestId={selectedRequestId}
        onClose={() => {
          setDetailsDrawerVisible(false);
          setSelectedRequestId(null);
        }}
      />
    </>
  );
}
