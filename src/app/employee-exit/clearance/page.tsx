'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Space, Tabs, Select, Tooltip, App } from 'antd';
import {
  Search,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck,
  RotateCw,
  X
} from 'lucide-react';
import dayjs from 'dayjs';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';
import { DepartmentService } from '@/services/departmentService';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { StatCards } from '@/components/common/StatCards';
import { FilterBar, FilterToggleButton, TicketFilterPill } from '@/components/common/FilterBar';
import NoData from '@/components/common/NoData';

export default function ClearancePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('it');
  const { message: messageApi } = App.useApp();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const fetchClearances = useCallback(async () => {
    try {
      setLoading(true);
      const data = await EmployeeExitService.getClearances();
      setRequests(data || []);
    } catch (error) {
      messageApi.error('Failed to fetch clearance requests');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchClearances();
    DepartmentService.getAll().then(setDepartments).catch(console.error);
  }, [fetchClearances]);

  const [clearanceModalVisible, setClearanceModalVisible] = useState(false);
  const [selectedClearance, setSelectedClearance] = useState<{ id: string, department: string } | null>(null);
  const [clearanceRemarks, setClearanceRemarks] = useState('');
  const [checklistState, setChecklistState] = useState<Record<string, string>>({});

  // Checklist Config State
  const [dynamicChecklists, setDynamicChecklists] = useState<Record<string, any[]>>({});

  const fetchChecklistConfigs = useCallback(async () => {
    try {
      const data = await EmployeeExitService.getChecklistConfigs();
      const grouped: Record<string, any[]> = { IT: [], ADMIN: [], FINANCE: [], HR: [] };
      (data || []).forEach((item: any) => {
        if (!grouped[item.department]) {
          grouped[item.department] = [];
        }
        grouped[item.department].push(item);
      });
      setDynamicChecklists(grouped);
    } catch (error) {
      console.error("Failed to load configs", error);
    }
  }, []);

  useEffect(() => {
    fetchClearances();
    fetchChecklistConfigs();
  }, [fetchClearances, fetchChecklistConfigs]);

  const handleClear = async () => {
    if (!selectedClearance) return;
    try {
      setLoading(true);
      await EmployeeExitService.updateClearanceStatus(
        selectedClearance.id,
        selectedClearance.department,
        true,
        clearanceRemarks || 'Cleared via portal',
        checklistState
      );
      messageApi.success(`${selectedClearance.department} clearance completed successfully`);
      setClearanceModalVisible(false);
      setClearanceRemarks('');
      setChecklistState({});
      setSelectedClearance(null);
      fetchClearances();
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to update clearance status');
      setLoading(false);
    }
  };

  const openClearanceModal = (id: string, department: string) => {
    setSelectedClearance({ id, department });
    const items = dynamicChecklists[department] || [];
    const initialState: Record<string, string> = {};
    items.forEach((item: any) => {
      const isYesNo = department.toUpperCase() === 'HR' || item.itemName.toLowerCase().includes('completed') || item.itemName.toLowerCase().includes('interview');
      initialState[item.itemName] = isYesNo ? 'YES' : 'RETURNED';
    });
    setChecklistState(initialState);
    setClearanceModalVisible(true);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (!searchText) return true;
      const q = searchText.toLowerCase();
      const n1 = (r.employee?.first_name || '').toLowerCase();
      const n2 = (r.employee?.last_name || '').toLowerCase();
      const code = (r.employee?.employee_code || '').toLowerCase();
      return n1.includes(q) || n2.includes(q) || code.includes(q);
    });
  }, [requests, searchText]);

  const departmentRequests = useMemo(() => {
    return filteredRequests.filter((r: any) => {
      const matchesDept = r.clearance?.department?.toUpperCase() === activeTab.toUpperCase();
      if (!matchesDept) return false;
      if (statusFilter === 'cleared') return !!r.clearance?.isCleared;
      if (statusFilter === 'pending') return !r.clearance?.isCleared;
      return true;
    });
  }, [filteredRequests, activeTab, statusFilter]);

  const deptStats = useMemo(() => {
    const allDeptReqs = filteredRequests.filter((r: any) =>
      r.clearance?.department?.toUpperCase() === activeTab.toUpperCase()
    );
    const total = allDeptReqs.length;
    const cleared = allDeptReqs.filter(r => (r as any).clearance?.isCleared).length;
    const pending = total - cleared;
    return { total, cleared, pending };
  }, [filteredRequests, activeTab]);

  const activeFilterCount = statusFilter ? 1 : 0;
  const total = departmentRequests.length;
  const pageCount = Math.ceil(total / pageSize);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pagedData = departmentRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      title: 'DEPARTMENT',
      dataIndex: 'departmentId',
      key: 'departmentId',
      render: (dep: string) => {
        let displayDep = dep || 'N/A';
        try {
          if (dep && dep.startsWith('{')) {
            const obj = JSON.parse(dep);
            displayDep = obj.label || obj.value || dep;
          }
        } catch (e) {}

        const deptObj = departments.find(d => d.id === displayDep);
        if (deptObj) {
          displayDep = deptObj.name;
        }

        return (
          <span style={{ color: 'var(--text-slate-600, #475569)', fontSize: 12.5, fontWeight: 500 }}>
            {displayDep}
          </span>
        );
      },
    },
    {
      title: 'LAST WORKING DAY',
      dataIndex: 'proposedLastWorkingDay',
      key: 'proposedLastWorkingDay',
      render: (date: string) => (
        <span style={{ color: 'var(--text-slate-500, #64748b)', fontSize: 12.5 }}>
          {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
        </span>
      ),
    },
    {
      title: 'STATUS',
      key: 'status',
      render: (_: any, record: any) => {
        const cleared = record.clearance?.isCleared;
        const bg = cleared ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)';
        const color = cleared ? '#10b981' : '#f59e0b';
        const border = cleared ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.25)';

        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: bg, color, border,
            padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {cleared ? 'CLEARED' : 'PENDING'}
          </span>
        );
      }
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          {record.clearance?.isCleared ? (
            <span style={{ fontSize: 12, color: 'var(--text-slate-500)', fontWeight: 600 }}>Cleared</span>
          ) : (
            <Button
              type="primary"
              size="small"
              onClick={() => openClearanceModal(record.id, activeTab.toUpperCase())}
              style={{ background: '#10b981', borderColor: '#10b981', fontSize: 11.5, fontWeight: 600, height: 26, borderRadius: 5 }}
            >
              Mark as Cleared
            </Button>
          )}
        </Space>
      ),
    }
  ];

  return (
    <>
      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="exit-search-bar" style={{ display: 'flex', alignItems: 'center', padding: '0 12px', width: 260, height: 32 }}>
            <Search size={14} color="var(--text-slate-400)" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              placeholder="Search clearances..."
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
            <strong>{total}</strong> items
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(k) => { setActiveTab(k); setCurrentPage(1); }}
            style={{ margin: 0 }}
            tabBarStyle={{ margin: 0 }}
            items={[
              { key: 'it', label: 'IT' },
              { key: 'admin', label: 'Admin' },
              { key: 'finance', label: 'Finance' },
              { key: 'hr', label: 'HR' },
            ]}
          />
          <Tooltip title="Refresh">
            <button
              type="button"
              className="exit-ghost-btn"
              onClick={fetchClearances}
              aria-label="Refresh"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="exit-body">
        <StatCards
          title={`${activeTab.toUpperCase()} Clearance Overview`}
          statusText="ACTIVE"
          progressPct={deptStats.total > 0 ? Math.round((deptStats.cleared / deptStats.total) * 100) : 0}
          cells={[
            {
              title: 'Total Items',
              value: deptStats.total,
              icon: <ArrowUpRight size={14} />,
              color: '#3b82f6',
              tint: 'rgba(59,130,246,0.1)',
              hint: `${activeTab.toUpperCase()} dept.`
            },
            {
              title: 'Cleared',
              value: deptStats.cleared,
              icon: <CheckCircle size={14} />,
              color: '#10b981',
              tint: 'rgba(16,185,129,0.1)',
              hint: 'Assets retrieved'
            },
            {
              title: 'Pending',
              value: deptStats.pending,
              icon: <Clock size={14} />,
              color: '#f59e0b',
              tint: 'rgba(245,158,11,0.1)',
              hint: 'Needs attention'
            },
          ]}
        />

        {isFilterOpen && (
          <FilterBar
            activeCount={activeFilterCount}
            onReset={() => {
              setStatusFilter(undefined);
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
                { value: 'cleared', label: 'Cleared', dotColor: '#10b981' },
                { value: 'pending', label: 'Pending', dotColor: '#f59e0b' },
              ]}
              onChange={(v) => {
                setStatusFilter(v ? String(v) : undefined);
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
                    title="No Clearances Found"
                    description="There are no departmental clearances matching your filter."
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

      {/* Clearance Modal */}
      {clearanceModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-pure-white, #ffffff)', padding: 24, borderRadius: 10, width: 460, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid var(--border-slate-200, #e2e8f0)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--text-slate-900, #0f172a)', fontSize: 16, fontWeight: 700 }}>
                Complete {selectedClearance?.department} Clearance
              </h3>
              <button
                onClick={() => setClearanceModalVisible(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-slate-400)', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Checklist */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 12, fontSize: 12.5, color: 'var(--text-slate-600)', fontWeight: 600 }}>Verify the following items:</label>
              {selectedClearance && dynamicChecklists[selectedClearance.department]?.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.itemName}</span>
                    <Select
                      size="small"
                      style={{ width: 140 }}
                      value={checklistState[item.itemName]}
                      onChange={(val) => setChecklistState(prev => ({ ...prev, [item.itemName]: val }))}
                      options={
                        (selectedClearance?.department.toUpperCase() === 'HR') || item.itemName.toLowerCase().includes('completed') || item.itemName.toLowerCase().includes('interview')
                          ? [
                              { label: 'Yes', value: 'YES' },
                              { label: 'No', value: 'NO' },
                              { label: 'N/A', value: 'NA' }
                            ]
                          : [
                              { label: 'Returned', value: 'RETURNED' },
                              { label: 'Not Returned', value: 'NOT_RETURNED' },
                              { label: 'N/A', value: 'NA' }
                            ]
                      }
                    />
                  </div>
                </div>
              ))}
              {(!selectedClearance || !dynamicChecklists[selectedClearance.department] || dynamicChecklists[selectedClearance.department].length === 0) && (
                <div style={{ fontSize: 12.5, color: 'var(--text-slate-400)' }}>No specific checklist items configured for this department.</div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12.5, color: 'var(--text-slate-600)', fontWeight: 600 }}>Remarks / Adjustments (Optional)</label>
              <textarea
                rows={3}
                value={clearanceRemarks}
                onChange={e => setClearanceRemarks(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border-slate-200, #e2e8f0)', background: 'var(--bg-pure-white, #ffffff)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                placeholder="Enter remarks (e.g. Missing laptop charger, deduct $50)"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={() => setClearanceModalVisible(false)}>Cancel</Button>
              <Button type="primary" onClick={handleClear} loading={loading} style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 600 }}>Confirm Clearance</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
