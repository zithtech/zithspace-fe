'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Space, notification, Tabs, Popconfirm, Select, Checkbox } from 'antd';
import { 
  Search, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  XCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';

export default function ClearancePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState('it');
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const fetchClearances = useCallback(async () => {
    try {
      setLoading(true);
      const data = await EmployeeExitService.getClearances();
      setRequests(data || []);
    } catch (error) {
      notificationApi.error({
        message: 'Error',
        description: 'Failed to fetch clearance requests'
      });
    } finally {
      setLoading(false);
    }
  }, [notificationApi]);

  useEffect(() => {
    fetchClearances();
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
      notificationApi.success({
        message: 'Success',
        description: `${selectedClearance.department} clearance completed successfully`
      });
      setClearanceModalVisible(false);
      setClearanceRemarks('');
      setChecklistState({});
      setSelectedClearance(null);
      fetchClearances();
    } catch (error: any) {
      notificationApi.error({
        message: 'Error',
        description: error.message || 'Failed to update clearance status'
      });
      setLoading(false);
    }
  };

  const openClearanceModal = (id: string, department: string) => {
    setSelectedClearance({ id, department });
    setClearanceRemarks('');
    
    // Initialize checklist
    const checklistItems = dynamicChecklists[department] || [];
    const initialState: Record<string, string> = {};
    checklistItems.forEach(item => initialState[item.itemName] = 'RETURNED');
    setChecklistState(initialState);
    
    setClearanceModalVisible(true);
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

  const departmentRequests = useMemo(() => {
    return filteredRequests.filter((r: any) => 
      r.clearance?.department?.toUpperCase() === activeTab.toUpperCase()
    );
  }, [filteredRequests, activeTab]);

  const stats = useMemo(() => {
    const total = departmentRequests.length;
    const cleared = departmentRequests.filter(r => (r as any).clearance?.isCleared).length;
    const pending = total - cleared;
    return { total, cleared, pending };
  }, [departmentRequests]);

  const columns = [
    {
      title: 'EMPLOYEE',
      key: 'employee',
      render: (_: any, record: EmployeeExitRequest) => {
        const name = `${record.employee?.first_name || ''} ${record.employee?.last_name || ''}`.trim() || 'N/A';
        const code = record.employee?.employee_code || '';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--border-color)', color: '#3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 12
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-slate-600)' }}>{code}</span>
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
        return (
          <span style={{ color: 'var(--text-slate-400)', fontSize: 13 }}>
            {displayDep}
          </span>
        );
      },
    },
    {
      title: 'LWD',
      dataIndex: 'proposedLastWorkingDay',
      key: 'proposedLastWorkingDay',
      render: (date: string) => (
        <span style={{ color: 'var(--text-slate-400)', fontSize: 13 }}>
          {date ? dayjs(date).format('MMM DD, YYYY') : '—'}
        </span>
      ),
    },
    {
      title: 'STATUS',
      key: 'status',
      render: (_: any, record: any) => {
        const cleared = record.clearance?.isCleared;
        let bg = cleared ? '#166534' : '#7c2d12';
        let color = cleared ? '#4ade80' : '#fb923c';
        let border = cleared ? '1px solid #14532d' : '1px solid #7c2d12';

        return (
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6, 
            background: bg, color, border, 
            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' 
          }}>
            {cleared ? 'CLEARED' : 'PENDING'}
          </div>
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
            <span style={{ fontSize: 12, color: 'var(--text-slate-600)', fontWeight: 600 }}>Cleared</span>
          ) : (
            <Button 
              type="primary" 
              size="small" 
              onClick={() => openClearanceModal(record.id, activeTab.toUpperCase())}
              style={{ background: '#10b981', borderColor: '#10b981', fontSize: 12, fontWeight: 600 }}
            >
              Mark as Cleared
            </Button>
          )}
        </Space>
      ),
    }
  ];
  
  const total = departmentRequests.length;
  const pageCount = Math.ceil(total / pageSize);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pagedData = departmentRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      {notificationContextHolder}
      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="exit-search-bar" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', width: 300, height: 32 }}>
            <Search size={13} color="var(--text-slate-400)" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              placeholder="Search clearances..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: 'var(--text-primary)' }}
            />
          </div>
          <span className="exit-topbar-meta"><span className="exit-pulse" /><strong>{total}</strong> items</span>
        </div>
        <div>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ margin: 0 }}
            items={[
              { key: 'it', label: 'IT' },
              { key: 'admin', label: 'Admin' },
              { key: 'finance', label: 'Finance' },
              { key: 'hr', label: 'HR' },
            ]}
          />
        </div>
      </div>

      <div className="exit-body">
            <div className="exit-stats exit-stats-3">
              <div className="exit-stat-card">
                <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><ArrowUpRight size={13} /></span><span className="exit-stat-label">Total Items</span></div></div>
                <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.total}</span></div><span className="exit-stat-period">{activeTab.toUpperCase()} dept.</span></div>
              </div>
              <div className="exit-stat-card">
                <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={13} /></span><span className="exit-stat-label">Cleared</span></div></div>
                <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.cleared}</span></div><span className="exit-stat-period">Assets retrieved</span></div>
              </div>
              <div className="exit-stat-card">
                <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={13} /></span><span className="exit-stat-label">Pending</span></div></div>
                <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.pending}</span></div><span className="exit-stat-period">Needs attention</span></div>
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

      {/* Clearance Modal */}
      {clearanceModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-primary)', padding: 24, borderRadius: 8, width: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Complete {selectedClearance?.department} Clearance</h3>
            
            {/* Checklist */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 12, fontSize: 13, color: 'var(--text-slate-600)', fontWeight: 600 }}>Verify the following items:</label>
              {selectedClearance && dynamicChecklists[selectedClearance.department]?.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.itemName}</span>
                    <Select 
                      size="small"
                      style={{ width: 140 }}
                      value={checklistState[item.itemName]}
                      onChange={(val) => setChecklistState(prev => ({ ...prev, [item.itemName]: val }))}
                      options={[
                        { label: 'Returned', value: 'RETURNED' },
                        { label: 'Not Returned', value: 'NOT_RETURNED' },
                        { label: 'N/A', value: 'NA' }
                      ]}
                    />
                  </div>
                </div>
              ))}
              {(!selectedClearance || !dynamicChecklists[selectedClearance.department] || dynamicChecklists[selectedClearance.department].length === 0) && (
                <div style={{ fontSize: 13, color: 'var(--text-slate-400)' }}>No specific checklist items configured for this department.</div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-slate-600)', fontWeight: 600 }}>Remarks / Adjustments (Optional)</label>
              <textarea 
                rows={3}
                value={clearanceRemarks}
                onChange={e => setClearanceRemarks(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                placeholder="Enter remarks (e.g. Missing laptop charger, deduct $50)"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => setClearanceModalVisible(false)}>Cancel</Button>
              <Button type="primary" onClick={handleClear} loading={loading} style={{ background: '#10b981', borderColor: '#10b981' }}>Confirm Clearance</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
