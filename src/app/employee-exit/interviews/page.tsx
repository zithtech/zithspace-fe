'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Space, notification, Drawer, Form, Input, Rate, Row, Col, Select } from 'antd';
import { 
  Search, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  XCircle,
  MessageSquare
} from 'lucide-react';
import dayjs from 'dayjs';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';

export default function ExitInterviewsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EmployeeExitRequest | null>(null);
  const [form] = Form.useForm();
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await EmployeeExitService.getExitRequests();
      setRequests((data || []).filter(r => r.status === 'APPROVED'));
    } catch (error) {
      notificationApi.error({
        message: 'Error',
        description: 'Failed to fetch exit interviews'
      });
    } finally {
      setLoading(false);
    }
  }, [notificationApi]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

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
    const completed = requests.filter(r => (r as any).hasInterview).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [requests]);

  const handleSubmitInterview = async (values: any) => {
    if (!selectedRequest) return;
    try {
      await EmployeeExitService.submitExitInterview(selectedRequest.id, values);
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, hasInterview: true } : r));
      notificationApi.success({
        message: 'Interview Submitted',
        description: `Exit interview recorded for ${selectedRequest.employee?.first_name}`
      });
      setIsDrawerVisible(false);
      form.resetFields();
    } catch (error: any) {
      notificationApi.error({
        message: 'Submission Failed',
        description: error.message || 'Failed to submit interview'
      });
    }
  };

  const openInterviewDrawer = async (record: EmployeeExitRequest) => {
    setSelectedRequest(record);
    setIsDrawerVisible(true);
    form.resetFields();
    try {
      const existing = await EmployeeExitService.getExitInterview(record.id);
      if (existing) {
        setTimeout(() => {
          form.setFieldsValue({
            cultureRating: existing.cultureRating || 0,
            managementRating: existing.managementRating || 0,
            growthRating: existing.growthRating || 0,
            compensationRating: existing.compensationRating || 0,
            reasonDetail: existing.reasonDetail || '',
            positiveFeedback: existing.positiveFeedback || '',
            constructiveFeedback: existing.constructiveFeedback || '',
            interviewerNotes: existing.interviewerNotes || ''
          });
        }, 100);
      } else {
        notificationApi.warning({ message: 'Debug', description: 'existing is null' });
      }
    } catch (e) {
      notificationApi.error({ message: 'Error', description: String(e) });
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
      title: 'STATUS',
      key: 'status',
      render: (_: any, record: any) => (
        record.hasInterview ? (
          <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={14} /> COMPLETED
          </span>
        ) : (
          <span style={{ color: '#f87171', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} /> PENDING
          </span>
        )
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
            icon={<MessageSquare size={14} />} 
            onClick={() => openInterviewDrawer(record)}
            style={{ background: '#3b82f6', border: 'none', fontSize: 12, fontWeight: 600 }}
          >
            {(record as any).hasInterview ? 'View / Edit' : 'Record'}
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
      {notificationContextHolder}
      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="exit-search-bar" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', width: 300, height: 32 }}>
            <Search size={13} color="var(--text-slate-400)" style={{ marginRight: 8, flexShrink: 0 }} />
            <input placeholder="Search interviews..." value={searchText} onChange={e => setSearchText(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: 'var(--text-primary)' }} />
          </div>
          <span className="exit-topbar-meta"><span className="exit-pulse" /><strong>{total}</strong> records</span>
        </div>
      </div>

      <div className="exit-body">
        <div className="exit-stats exit-stats-3">
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><ArrowUpRight size={13} /></span><span className="exit-stat-label">Total Scheduled</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.total}</span></div><span className="exit-stat-period">Exit interviews</span></div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={13} /></span><span className="exit-stat-label">Completed</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.completed}</span></div><span className="exit-stat-period">Feedback recorded</span></div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-top"><div className="exit-stat-left"><span className="exit-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={13} /></span><span className="exit-stat-label">Pending</span></div></div>
            <div className="exit-stat-bottom"><div className="exit-stat-value-wrap"><span className="exit-stat-value">{stats.pending}</span></div><span className="exit-stat-period">To be conducted</span></div>
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

      <Drawer
        title={<span style={{ color: 'var(--text-primary)' }}>Exit Interview: {selectedRequest?.employee?.first_name || ''}</span>}
        width={600}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        style={{ background: 'var(--bg-primary)' }}
        headerStyle={{ borderBottom: '1px solid var(--border-color)' }}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerVisible(false)} style={{ background: 'transparent', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-400)' }}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()} style={{ background: '#3b82f6', border: 'none', fontWeight: 600 }}>Submit Feedback</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitInterview}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Experience Ratings</div>
          <Row gutter={16}>
            <Col span={12}><Form.Item label={<span style={{ color: 'var(--text-slate-400)' }}>Company Culture</span>} name="cultureRating" rules={[{ required: true }]}><Rate /></Form.Item></Col>
            <Col span={12}><Form.Item label={<span style={{ color: 'var(--text-slate-400)' }}>Management</span>} name="managementRating" rules={[{ required: true }]}><Rate /></Form.Item></Col>
            <Col span={12}><Form.Item label={<span style={{ color: 'var(--text-slate-400)' }}>Career Growth</span>} name="growthRating" rules={[{ required: true }]}><Rate /></Form.Item></Col>
            <Col span={12}><Form.Item label={<span style={{ color: 'var(--text-slate-400)' }}>Compensation</span>} name="compensationRating" rules={[{ required: true }]}><Rate /></Form.Item></Col>
          </Row>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16, marginTop: 16, marginBottom: 16 }}>Detailed Feedback</div>
          <Form.Item label={<span style={{ color: 'var(--text-slate-400)' }}>Primary reason for leaving</span>} name="reasonDetail" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Please elaborate..." style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: 'var(--text-slate-400)' }}>What did you like most?</span>} name="positiveFeedback">
            <Input.TextArea rows={3} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: 'var(--text-slate-400)' }}>What could be improved?</span>} name="constructiveFeedback">
            <Input.TextArea rows={3} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: 'var(--text-slate-400)' }}>Interviewer Notes (Private)</span>} name="interviewerNotes">
            <Input.TextArea rows={3} placeholder="Private notes for HR..." style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
