'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Select, Modal, Tooltip, App } from 'antd';
import {
  Search,
  Plus,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Edit2,
  Eye,
  FileText,
  RotateCw,
  X
} from 'lucide-react';
import { EmployeeExitService } from '@/services/employeeExitService';
import dayjs from 'dayjs';
import { CreateExitRequestDrawer } from '@/components/employee-exit/CreateExitRequestDrawer';
import { ExitRequestDetailsDrawer } from '@/components/employee-exit/ExitRequestDetailsDrawer';
import { useAuth } from '@/context/AuthContext';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { StatCards } from '@/components/common/StatCards';
import { FilterBar, FilterToggleButton, TicketFilterPill } from '@/components/common/FilterBar';
import NoData from '@/components/common/NoData';

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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

  useEffect(() => {
    if (user) fetchData();
  }, [fetchData, user]);

  const exitTypeOptions = useMemo(() => {
    const typesSet = new Set<string>();
    requests.forEach(r => {
      const t = r.exitType?.name || r.exit_type_id;
      if (t) typesSet.add(t);
    });
    if (typesSet.size === 0) {
      return [
        { value: 'Resignation', label: 'Resignation' },
        { value: 'Termination', label: 'Termination' },
        { value: 'Retirement', label: 'Retirement' },
      ];
    }
    return Array.from(typesSet).map(t => ({ value: t, label: t }));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter && (r.status || 'PENDING').toUpperCase() !== statusFilter) {
        return false;
      }
      if (typeFilter) {
        const typeName = r.exitType?.name || r.exit_type_id || 'Resignation';
        if (typeName !== typeFilter) return false;
      }
      if (!searchText) return true;
      const q = searchText.toLowerCase();
      const type = (r.exitType?.name || '').toLowerCase();
      return type.includes(q);
    });
  }, [requests, searchText, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = requests.length;
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const pending = requests.filter(r => !r.status || r.status === 'PENDING').length;
    const rejected = requests.filter(r => r.status === 'REJECTED' || r.status === 'WITHDRAWN').length;
    return { total, approved, pending, rejected };
  }, [requests]);

  const activeFilterCount = (statusFilter ? 1 : 0) + (typeFilter ? 1 : 0);

  const total = filteredRequests.length;
  const pageCount = Math.ceil(total / pageSize);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pagedData = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      title: 'TYPE',
      key: 'type',
      render: (_: any, record: any) => {
        const name = record.exitType?.name || record.exit_type_id || 'Resignation';
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
              <span style={{ fontSize: 11, color: 'var(--text-slate-400, #94a3b8)' }}>Exit Request</span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'LAST WORKING DAY',
      key: 'lwd',
      render: (_: any, record: any) => (
        <span style={{ color: 'var(--text-slate-600, #475569)', fontSize: 12.5 }}>
          {record.proposedLastWorkingDay ? dayjs(record.proposedLastWorkingDay).format("MMM DD, YYYY") : "—"}
        </span>
      )
    },
    {
      title: 'RESIGN DATE',
      key: 'date',
      render: (_: any, record: any) => (
        <span style={{ color: 'var(--text-slate-500, #64748b)', fontSize: 12.5 }}>
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
          APPROVED: { bg: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' },
          PENDING: { bg: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' },
          REJECTED: { bg: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' },
          WITHDRAWN: { bg: 'rgba(100,116,139,0.08)', color: '#64748b', border: '1px solid rgba(100,116,139,0.25)' },
        };
        const { bg, color, border } = cfg[s] || cfg.PENDING;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color, border, padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {s}
          </span>
        );
      }
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Button
            type="text"
            size="small"
            icon={<Eye size={14} color="var(--text-slate-500)" />}
            title="View Details"
            onClick={() => { setSelectedRequestId(record.id); setDetailsDrawerVisible(true); }}
            style={{ minWidth: 28, height: 28, borderRadius: 6 }}
          />
          <Button
            type="text"
            size="small"
            icon={<Edit2 size={14} color="var(--text-slate-500)" />}
            title="Edit"
            onClick={() => { setEditingRecord(record); setDrawerVisible(true); }}
            style={{ minWidth: 28, height: 28, borderRadius: 6 }}
          />
          <Button
            type="text"
            size="small"
            icon={<Trash2 size={14} color="#ef4444" />}
            title="Delete"
            onClick={() => {
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
            }}
            style={{ minWidth: 28, height: 28, borderRadius: 6 }}
          />
        </div>
      )
    }
  ];

  return (
    <>
      {/* Header */}
      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="exit-search-bar" style={{ display: 'flex', alignItems: 'center', padding: '0 12px', width: 280, height: 32 }}>
            <Search size={14} color="var(--text-slate-400)" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              placeholder="Search my requests..."
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
            <strong>{total}</strong> requests
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip title="Refresh">
            <button
              type="button"
              className="exit-ghost-btn"
              onClick={fetchData}
              aria-label="Refresh"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => setDrawerVisible(true)}
            style={{
              background: '#3b82f6',
              borderColor: '#3b82f6',
              fontWeight: 600,
              borderRadius: 6,
              height: 32,
              fontSize: 12.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            New Request
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="exit-body">
        {/* StatCards */}
        <StatCards
          title="My Requests Overview"
          statusText="ACTIVE"
          progressPct={stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}
          cells={[
            {
              title: 'Total Requests',
              value: stats.total,
              icon: <ArrowUpRight size={14} />,
              color: '#3b82f6',
              tint: 'rgba(59,130,246,0.1)',
              hint: 'All filed'
            },
            {
              title: 'Approved',
              value: stats.approved,
              icon: <CheckCircle size={14} />,
              color: '#10b981',
              tint: 'rgba(16,185,129,0.1)',
              hint: 'Cleared'
            },
            {
              title: 'Pending',
              value: stats.pending,
              icon: <Clock size={14} />,
              color: '#f59e0b',
              tint: 'rgba(245,158,11,0.1)',
              hint: 'Awaiting review'
            },
            {
              title: 'Rejected / Withdrawn',
              value: stats.rejected,
              icon: <XCircle size={14} />,
              color: '#ef4444',
              tint: 'rgba(239,68,68,0.1)',
              hint: 'Cancelled'
            },
          ]}
        />

        {/* FilterBar */}
        {isFilterOpen && (
          <FilterBar
            activeCount={activeFilterCount}
            onReset={() => {
              setStatusFilter(undefined);
              setTypeFilter(undefined);
              setSearchText("");
              setCurrentPage(1);
            }}
            onClose={() => setIsFilterOpen(false)}
          >
            <TicketFilterPill
              label="Status"
              icon={<CheckCircle size={12} />}
              value={statusFilter}
              options={[
                { value: 'PENDING', label: 'Pending', dotColor: '#f59e0b' },
                { value: 'APPROVED', label: 'Approved', dotColor: '#10b981' },
                { value: 'REJECTED', label: 'Rejected', dotColor: '#ef4444' },
                { value: 'WITHDRAWN', label: 'Withdrawn', dotColor: '#64748b' },
              ]}
              onChange={(v) => {
                setStatusFilter(v ? String(v) : undefined);
                setCurrentPage(1);
              }}
            />
            <TicketFilterPill
              label="Exit Type"
              icon={<FileText size={12} />}
              value={typeFilter}
              options={exitTypeOptions}
              onChange={(v) => {
                setTypeFilter(v ? String(v) : undefined);
                setCurrentPage(1);
              }}
            />
          </FilterBar>
        )}

        {/* Table */}
        <div className="exit-table-wrap">
          <ZukvoLoadingOverlay loading={loading} message="">
            <Table
              size="small"
              columns={columns}
              dataSource={pagedData}
              rowKey="id"
              pagination={false}
              className="exit-table"
              scroll={{ x: 700 }}
              locale={{
                emptyText: (
                  <NoData
                    title="No Exit Requests Found"
                    description="You have not submitted any exit requests yet."
                  />
                )
              }}
            />
          </ZukvoLoadingOverlay>
        </div>
      </div>

      {/* Sticky Footer */}
      {total > 0 && (
        <div className="exit-footer exit-footer--sticky">
          <div className="exit-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="exit-pager">
            <button
              type="button"
              className="exit-pager-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`exit-pager-num ${p === currentPage ? 'is-active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
            <button
              type="button"
              className="exit-pager-btn"
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
            >
              ›
            </button>
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
