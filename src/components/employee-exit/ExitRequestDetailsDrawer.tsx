import React, { useEffect, useState } from 'react';
import { Drawer, Spin, Tabs, Descriptions, Tag, Timeline, Typography, Alert, Badge } from 'antd';
import { api } from '@/lib/axios';
import dayjs from 'dayjs';
import { CheckCircle, Clock, XCircle, User, Calendar, FileText, CreditCard, ShieldCheck } from 'lucide-react';

const { Text, Title } = Typography;

interface ExitRequestDetailsDrawerProps {
  visible: boolean;
  requestId: string | null;
  onClose: () => void;
}

const statusCfg: Record<string, { bg: string; color: string; border: string }> = {
  APPROVED:   { bg: 'rgba(16,185,129,0.1)',   color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' },
  PENDING:    { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
  REJECTED:   { bg: 'rgba(239,68,68,0.1)',    color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
  WITHDRAWN:  { bg: 'rgba(100,116,139,0.1)',  color: '#64748b', border: '1px solid rgba(100,116,139,0.3)' },
  COMPLETED:  { bg: 'rgba(99,102,241,0.1)',   color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' },
};

const renderStatus = (status: string) => {
  const s = (status || 'PENDING').toUpperCase();
  const { bg, color, border } = statusCfg[s] || statusCfg.PENDING;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color, border, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {s}
    </span>
  );
};

const InfoCard = ({ children, style }: any) => (
  <div style={{
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    padding: '16px 20px',
    marginBottom: 16,
    ...style
  }}>
    {children}
  </div>
);

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
    <span style={{ color: '#3b82f6' }}>{icon}</span>
    <Text strong style={{ fontSize: 13, color: '#1e293b' }}>{title}</Text>
  </div>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ marginBottom: 10 }}>
    <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>{label}</Text>
    <Text style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{value || '—'}</Text>
  </div>
);

export const ExitRequestDetailsDrawer: React.FC<ExitRequestDetailsDrawerProps> = ({ visible, requestId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && requestId) {
      fetchDetails(requestId);
    } else {
      setData(null);
      setError(null);
    }
  }, [visible, requestId]);

  const fetchDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await api.get(`/api/exit/request/${id}`);
      if (!result) {
        setError('No data returned from server.');
      } else {
        setData(result);
      }
    } catch (e: any) {
      console.error('[ExitRequestDetailsDrawer] fetch error:', e);
      setError(e?.response?.data?.error || e?.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Spin size="large" tip="Loading details..." />
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: 24 }}>
          <Alert type="error" message="Failed to load details" description={error} showIcon />
        </div>
      );
    }

    if (!data) {
      return (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Text type="secondary">No data available.</Text>
        </div>
      );
    }

    return (
      <div style={{ padding: 20 }}>
        {/* Employee Basic Details */}
        <InfoCard>
          <SectionTitle icon={<User size={14} />} title="Employee Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Name" value={`${data.employee?.first_name || ''} ${data.employee?.last_name || ''}`.trim() || '—'} />
            <Field label="Employee Code" value={data.employee?.employee_code} />
            <Field label="Reporting Manager" value={data.reportingManagerName} />
            <Field label="Department" value={data.departmentId} />
          </div>
        </InfoCard>

        {/* Exit Info */}
        <InfoCard>
          <SectionTitle icon={<Calendar size={14} />} title="Exit Information" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Resignation Date" value={data.resignationDate ? dayjs(data.resignationDate).format('MMM DD, YYYY') : '—'} />
            <Field label="Proposed Last Working Day" value={data.proposedLastWorkingDay ? dayjs(data.proposedLastWorkingDay).format('MMM DD, YYYY') : '—'} />
            <Field label="Notice Period Waived" value={data.waiveNoticePeriod ? 'Yes' : 'No'} />
            <Field label="Buyout Required" value={data.buyoutRequired ? `Yes${data.buyoutAmount ? ` — ₹${data.buyoutAmount}` : ''}` : 'No'} />
            <Field label="Overall Status" value={renderStatus(data.status)} />
            <Field label="Explanation" value={data.explanation} />
          </div>
        </InfoCard>

        <Tabs
          defaultActiveKey="approvals"
          style={{ marginTop: 4 }}
          items={[
            {
              key: 'approvals',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={13} />
                  Approvals
                  {data.approvals?.length > 0 && (
                    <span style={{ background: '#3b82f6', color: '#fff', borderRadius: 10, padding: '0px 6px', fontSize: 10, fontWeight: 700, marginLeft: 4 }}>
                      {data.approvals.length}
                    </span>
                  )}
                </span>
              ),
              children: (
                <InfoCard>
                  {(!data.approvals || data.approvals.length === 0) ? (
                    <Text type="secondary" style={{ fontSize: 13 }}>No approval steps configured for this request.</Text>
                  ) : (
                    <Timeline style={{ marginTop: 8 }}>
                      {data.approvals.map((app: any, idx: number) => {
                        let color = 'gray';
                        if (app.status === 'APPROVED') color = 'green';
                        if (app.status === 'REJECTED') color = 'red';
                        if (app.status === 'PENDING') color = 'blue';

                        return (
                          <Timeline.Item key={app.id || idx} color={color}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <Text strong style={{ fontSize: 13 }}>
                                  Step {app.stepOrder}: {app.approverType === 'ReportingManager' ? 'Reporting Manager' : (app.approverType || 'Approver')}
                                </Text>
                                {app.comments && (
                                  <Text type="secondary" style={{ display: 'block', marginTop: 2, fontSize: 12 }}>
                                    "{app.comments}"
                                  </Text>
                                )}
                                {app.actionDate && (
                                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                    {dayjs(app.actionDate).format('MMM DD, YYYY HH:mm')}
                                  </Text>
                                )}
                              </div>
                              <div>{renderStatus(app.status)}</div>
                            </div>
                          </Timeline.Item>
                        );
                      })}
                    </Timeline>
                  )}
                </InfoCard>
              )
            },
            {
              key: 'clearances',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={13} />
                  Clearances
                </span>
              ),
              children: (
                <InfoCard>
                  {(!data.clearances || data.clearances.length === 0) ? (
                    <Text type="secondary" style={{ fontSize: 13 }}>No clearances generated yet. Clearances are created once the exit request is approved.</Text>
                  ) : (
                    <div>
                      {data.clearances.map((c: any) => (
                        <div key={c.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 0',
                          borderBottom: '1px solid #f1f5f9'
                        }}>
                          <div>
                            <Text strong style={{ fontSize: 13 }}>{c.department} Department</Text>
                            {c.comments && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.comments}</div>}
                            {c.clearedAt && <div style={{ fontSize: 11, color: '#94a3b8' }}>{dayjs(c.clearedAt).format('MMM DD, YYYY')}</div>}
                          </div>
                          <div>
                            {c.isCleared ? (
                              <Tag color="success" icon={<CheckCircle size={11} />} style={{ borderRadius: 20, fontWeight: 600 }}>Cleared</Tag>
                            ) : (
                              <Tag color="warning" icon={<Clock size={11} />} style={{ borderRadius: 20, fontWeight: 600 }}>Pending</Tag>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </InfoCard>
              )
            },
            {
              key: 'fnf',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={13} />
                  Full &amp; Final
                </span>
              ),
              children: (
                <InfoCard>
                  {!data.fnf ? (
                    <Text type="secondary" style={{ fontSize: 13 }}>FnF settlement has not been processed yet.</Text>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="Status" value={renderStatus(data.fnf.status)} />
                      <Field label="Net Payable" value={<Text strong style={{ color: '#10b981', fontSize: 15 }}>₹{Number(data.fnf.totalPayable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>} />
                      <Field label="Processed At" value={data.fnf.processedAt ? dayjs(data.fnf.processedAt).format('MMM DD, YYYY') : '—'} />
                    </div>
                  )}
                </InfoCard>
              )
            }
          ]}
        />
      </div>
    );
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Exit Request Details</span>
          {data && renderStatus(data.status)}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={720}
      styles={{ body: { padding: 0, background: '#f8fafc' } }}
      destroyOnClose
    >
      {renderContent()}
    </Drawer>
  );
};
