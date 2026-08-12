'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {  Button, Table, Space, Drawer, Form, InputNumber, Row, Col, Card, Select, Tag, Collapse , App } from 'antd';
import { 
  Search, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  XCircle,
  DollarSign,
  Calculator,
  MinusCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

export default function FnFPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EmployeeExitRequest | null>(null);
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [totalSettlement, setTotalSettlement] = useState<number>(0);
  const [clearances, setClearances] = useState<any[]>([]);

  const fetchFnFRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await EmployeeExitService.getExitRequests();
      // Only show requests that are approved or completed
      setRequests((data || []).filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED'));
    } catch (error) {
      messageApi.error('Failed to fetch FnF records');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchFnFRequests();
  }, [fetchFnFRequests]);

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
    const buyout = requests.filter(r => r.buyoutRequired).length;
    const standard = total - buyout;
    return { total, buyout, standard };
  }, [requests]);

  const handleValuesChange = (_: any, allValues: any) => {
    const additions = 
      (allValues.pendingSalary || 0) + 
      (allValues.leaveEncashment || 0) + 
      (allValues.bonus || 0) +
      (allValues.incentives || 0) + 
      (allValues.manualAdjustment > 0 ? allValues.manualAdjustment : 0);
      
    const deductions = 
      (allValues.noticeRecovery || 0) + 
      (allValues.assetDeduction || 0) + 
      (allValues.loanRecovery || 0) +
      (allValues.salaryAdvanceRecovery || 0) +
      (allValues.tax || 0) +
      (allValues.pf || 0) +
      (allValues.esi || 0) +
      (allValues.manualAdjustment < 0 ? Math.abs(allValues.manualAdjustment) : 0);
      
    setTotalSettlement(additions - deductions);
  };

  const handleProcessFnF = async (values: any) => {
    try {
      setLoading(true);
      if (!selectedRequest?.id) return;
      
      await EmployeeExitService.processFnFSettlement(selectedRequest.id, values);
      messageApi.success(`Final settlement of $${totalSettlement} processed for ${selectedRequest?.employee?.first_name}`);
      setIsDrawerVisible(false);
      form.resetFields();
      fetchFnFRequests();
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to process FnF settlement');
      setLoading(false);
    }
  };

  const openFnFDrawer = async (record: EmployeeExitRequest) => {
    setSelectedRequest(record);
    setIsDrawerVisible(true);
    setLoading(true);
    try {
      // Fetch clearances for the UI
      const fetchedClearances = await EmployeeExitService.getClearancesByRequestId(record.id);
      setClearances(fetchedClearances);

      // Mock / Real API call to calculate FnF
      const calcData = await EmployeeExitService.calculateFnF(record.id);
      
      const buyoutAmount = record.buyoutRequired && record.buyoutAmount ? record.buyoutAmount : 0;
      
      form.setFieldsValue({
        payrollRunId: calcData.payrollRunId,
        pendingSalary: calcData.pendingSalary || 0,
        leaveEncashment: calcData.leaveEncashment || 0,
        bonus: calcData.bonus || 0,
        incentives: calcData.incentives || 0,
        assetDeduction: calcData.assetDeduction || 0,
        loanRecovery: calcData.loanRecovery || 0,
        salaryAdvanceRecovery: calcData.salaryAdvanceRecovery || 0,
        tax: calcData.tax || 0,
        pf: calcData.pf || 0,
        esi: calcData.esi || 0,
        noticeRecovery: calcData.noticeRecovery || buyoutAmount,
        manualAdjustment: 0, // Added by Finance
        remarks: ''
      });
      
      const netPayable = calcData.pendingSalary + calcData.leaveEncashment + calcData.bonus + calcData.incentives 
        - (calcData.assetDeduction + calcData.loanRecovery + calcData.salaryAdvanceRecovery + calcData.tax + calcData.pf + calcData.esi + buyoutAmount);
      
      setTotalSettlement(netPayable);
    } catch (err: any) {
      messageApi.error(err.message || 'Failed to fetch payroll calculation');
    } finally {
      setLoading(false);
    }
  };

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
      title: 'BUYOUT REQUIRED',
      key: 'buyout',
      render: (_: any, record: EmployeeExitRequest) => {
        const req = record.buyoutRequired;
        return (
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6, 
            background: req ? '#7f1d1d' : 'transparent', 
            color: req ? '#f87171' : 'var(--text-slate-400)', 
            border: req ? '1px solid #7f1d1d' : '1px solid var(--border-slate-200)', 
            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' 
          }}>
            {req ? `YES ($${record.buyoutAmount})` : 'NO'}
          </div>
        );
      }
    },
    {
      title: 'SETTLEMENT',
      key: 'status',
      render: () => (
        <span style={{ color: '#fb923c', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <DollarSign size={14} /> PENDING
        </span>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: EmployeeExitRequest) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<Calculator size={14} />} 
            onClick={() => openFnFDrawer(record)}
            style={{ background: '#3b82f6', border: 'none', fontSize: 12, fontWeight: 600 }}
          >
            Process FnF
          </Button>
        </Space>
      ),
    }
  ];

  const total = filteredRequests.length;
  const pageCount = Math.ceil(total / pageSize);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pagedData = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      
      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="exit-search-bar" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', width: 300, height: 32 }}>
            <Search size={13} color="var(--text-slate-400)" style={{ marginRight: 8, flexShrink: 0 }} />
            <input placeholder="Search records..." value={searchText} onChange={e => setSearchText(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: 'var(--text-primary)' }} />
          </div>
          <span className="exit-topbar-meta"><span className="exit-pulse" /><strong>{total}</strong> records</span>
        </div>
      </div>

      <div className="exit-body">
        <div className="exit-stats exit-stats-3">
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><ArrowUpRight size={13} /></span><span className="exit-stat-label">Total Pending</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.total}</span></div><span className="exit-stat-period">FnF Settlements</span></div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><DollarSign size={13} /></span><span className="exit-stat-label">Buyout Due</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.buyout}</span></div><span className="exit-stat-period">Notice shortfalls</span></div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={13} /></span><span className="exit-stat-label">Standard Exit</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.standard}</span></div><span className="exit-stat-period">No buyout required</span></div>
          </div>
        </div>

        <div className="exit-table-wrap">
          <ZukvoLoadingOverlay loading={loading} message="">
                  <Table size="small" className="exit-table" columns={columns} dataSource={pagedData} rowKey="id" pagination={false} scroll={{ x: 900 }} />
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
            <Select className="exit-pagesize" value={pageSize} onChange={(v: number) => { setPageSize(v); setCurrentPage(1); }} options={[10, 20, 25, 50].map(n => ({ value: n, label: `${n} / page` }))} popupMatchSelectWidth={110} />
          </div>
        </div>
      )}

      <Drawer
        title={<span style={{ color: 'var(--text-primary)' }}>Process FnF: {selectedRequest?.employee?.first_name || ''}</span>}
        width={700}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        style={{ background: 'var(--bg-primary)' }}
        headerStyle={{ borderBottom: '1px solid var(--border-color)' }}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerVisible(false)} style={{ background: 'transparent', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-400)' }}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()} style={{ background: '#3b82f6', border: 'none', fontWeight: 600 }}>
              Finalize Settlement
            </Button>
          </Space>
        }
      >
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '16px 24px', borderRadius: 8, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-slate-400)', marginBottom: 4 }}>Net Payable</div>
            <div style={{ fontSize: 24, fontWeight: 700, margin: 0, color: totalSettlement >= 0 ? '#4ade80' : '#f87171' }}>$ {totalSettlement.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: totalSettlement >= 0 ? '#166534' : '#7f1d1d', color: totalSettlement >= 0 ? '#4ade80' : '#f87171', border: totalSettlement >= 0 ? '1px solid #14532d' : '1px solid #7f1d1d', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
              {totalSettlement >= 0 ? 'PAYABLE TO EMPLOYEE' : 'RECOVERABLE FROM EMPLOYEE'}
            </div>
          </div>
        </div>
        
        <Collapse
          style={{ marginBottom: 24, background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          items={[{
            key: '1',
            label: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Clearance Summary</span>,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {clearances.map((c: any) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.department}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-slate-400)' }}>Cleared by: {c.clearedByName || 'Unknown'}</div>
                      {c.comments && <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-slate-200)' }}>Comments: {c.comments}</div>}
                      
                      {c.checklist && Object.keys(c.checklist).length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {Object.entries(c.checklist).map(([item, isChecked]) => (
                            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-slate-300)' }}>
                              {isChecked === true || (typeof isChecked === 'string' && ['RETURNED', 'YES', 'CLEARED'].includes(isChecked.toUpperCase())) ? (
                                <CheckCircle size={14} color="#10b981" />
                              ) : isChecked === 'NA' || (typeof isChecked === 'string' && isChecked.toUpperCase() === 'N/A') ? (
                                <MinusCircle size={14} color="var(--text-slate-400)" />
                              ) : (
                                <XCircle size={14} color="#f87171" />
                              )}
                              <span>
                                {item}{' '}
                                {(isChecked === 'NA' || (typeof isChecked === 'string' && isChecked.toUpperCase() === 'N/A')) && (
                                  <span style={{ color: 'var(--text-slate-400)', fontSize: 10 }}>(N/A)</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Tag color={c.isCleared ? 'success' : 'warning'}>{c.isCleared ? 'CLEARED' : 'PENDING'}</Tag>
                    </div>
                  </div>
                ))}
                {clearances.length === 0 && <span style={{ color: 'var(--text-slate-400)', fontSize: 12 }}>No clearance data found.</span>}
              </div>
            )
          }]}
        />

        <Form form={form} layout="vertical" onFinish={handleProcessFnF} onValuesChange={handleValuesChange}>
          <Row gutter={24}>
            <Col span={12}>
              <Card title={<span style={{ color: '#4ade80' }}>Additions (+)</span>} size="small" style={{ borderColor: '#166534', background: 'var(--bg-secondary)' }} headStyle={{ borderBottom: '1px solid #166534' }}>
                <Form.Item label="Pending Salary" name="pendingSalary"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
                <Form.Item label="Leave Encashment" name="leaveEncashment"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
                <Form.Item label="Bonus" name="bonus"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
                <Form.Item label="Incentives" name="incentives"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
                <Form.Item label="Manual Adjustment (Positive)" name="manualAdjustment" help="Add negative value for deductions"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={<span style={{ color: '#f87171' }}>Deductions (-)</span>} size="small" style={{ borderColor: '#7f1d1d', background: 'var(--bg-secondary)' }} headStyle={{ borderBottom: '1px solid #7f1d1d' }}>
                <Form.Item label="Notice Recovery" name="noticeRecovery"><InputNumber style={{ width: '100%' }} prefix="$" disabled={selectedRequest?.buyoutRequired} /></Form.Item>
                <Form.Item label="Asset Deduction" name="assetDeduction"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
                <Form.Item label="Loan Recovery" name="loanRecovery"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
                <Form.Item label="Salary Advance Recovery" name="salaryAdvanceRecovery"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item>
                <Row gutter={12}>
                  <Col span={8}><Form.Item label="Tax" name="tax"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item></Col>
                  <Col span={8}><Form.Item label="PF" name="pf"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item></Col>
                  <Col span={8}><Form.Item label="ESI" name="esi"><InputNumber style={{ width: '100%' }} prefix="$" /></Form.Item></Col>
                </Row>
              </Card>
            </Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <Form.Item label="Finance Remarks" name="remarks">
              <Select mode="tags" style={{ width: '100%' }} placeholder="Add remarks or reasons for adjustments" />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </>
  );
}
