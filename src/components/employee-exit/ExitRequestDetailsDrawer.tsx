import React, { useEffect, useState } from 'react';
import { Drawer, Spin, Tabs, Tag, Timeline, Typography, Alert } from 'antd';
import { api } from '@/lib/axios';
import dayjs from 'dayjs';
import { CheckCircle, Clock, User, Calendar, FileText, CreditCard, ShieldCheck, X } from 'lucide-react';
import { commonDrawerProps, drawerFormStyles, SectionCard } from '@/components/common/DrawerSection';
import { DepartmentService } from '@/services/departmentService';
import { PositionService } from '@/services/positionService';

const { Text } = Typography;

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

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ marginBottom: 10 }}>
    <Text style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>{label}</Text>
    <Text style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{value || '—'}</Text>
  </div>
);

export const ExitRequestDetailsDrawer: React.FC<ExitRequestDetailsDrawerProps> = ({ visible, requestId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [deptRes, posRes] = await Promise.all([
          DepartmentService.getAll(),
          PositionService.getAll()
        ]);
        setDepartments(deptRes);
        setPositions(posRes);
      } catch (e) {
        console.error('Failed to fetch departments/positions', e);
      }
    };
    fetchReferences();
  }, []);

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
      <div className="px-6 py-6 pb-24 space-y-5">
        {/* Employee Basic Details */}
        <SectionCard title="Employee Details" icon={<User size={16} />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Name" value={`${data.employee?.first_name || ''} ${data.employee?.last_name || ''}`.trim() || '—'} />
            <Field label="Employee Code" value={data.employee?.employee_code} />
            <Field label="Reporting Manager" value={data.reportingManagerName} />
            <Field label="Department" value={departments.find(d => d.id === data.departmentId)?.name || data.departmentId} />
            <Field label="Position" value={positions.find(p => p.id === data.positionId)?.title || data.positionId} />
          </div>
        </SectionCard>

        {/* Exit Info */}
        <SectionCard title="Exit Information" icon={<Calendar size={16} />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Resignation Date" value={data.resignationDate ? dayjs(data.resignationDate).format('MMM DD, YYYY') : '—'} />
            <Field label="Proposed Last Working Day" value={data.proposedLastWorkingDay ? dayjs(data.proposedLastWorkingDay).format('MMM DD, YYYY') : '—'} />
            <Field label="Notice Period Waived" value={data.waiveNoticePeriod ? 'Yes' : 'No'} />
            <Field label="Buyout Required" value={data.buyoutRequired ? `Yes${data.buyoutAmount ? ` — ₹${data.buyoutAmount}` : ''}` : 'No'} />
            <Field label="Overall Status" value={renderStatus(data.status)} />
            <Field label="Explanation" value={data.explanation} />
            <Field label="Resignation Letter" value={(data.resignationLetterUrl || data.resignationLetter) ? (
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  let url = data.resignationLetterUrl || data.resignationLetter || '';
                  if (url.includes("r2.cloudflarestorage.com")) {
                    url = url.replace(
                      /https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+/,
                      "https://pub-7f315f14b4bb4930bd64cae157207c92.r2.dev"
                    );
                  }
                  if (url.includes(".r2.dev") && !url.includes(".r2.dev/")) {
                    url = url.replace(".r2.dev", ".r2.dev/");
                  }
                  if (url) {
                    window.open(url, '_blank');
                  }
                }}
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                View Document
              </a>
            ) : '—'} />
          </div>
        </SectionCard>

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
                <SectionCard title="Approval Timeline" icon={<ShieldCheck size={16} />}>
                  {(!data.approvals || data.approvals.length === 0) ? (
                    <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No approval steps configured for this request.</Text>
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
                                <Text style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                                  Step {app.stepOrder}: {app.approverType === 'ReportingManager' ? 'Reporting Manager' : (app.approverType || 'Approver')}
                                </Text>
                                {app.comments && (
                                  <Text style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'var(--text-secondary)' }}>
                                    "{app.comments}"
                                  </Text>
                                )}
                                {app.actionDate && (
                                  <Text style={{ fontSize: 11, display: 'block', color: 'var(--text-slate-400)' }}>
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
                </SectionCard>
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
                <SectionCard title="Department Clearances" icon={<CheckCircle size={16} />}>
                  {(!data.clearances || data.clearances.length === 0) ? (
                    <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No clearances generated yet. Clearances are created once the exit request is approved.</Text>
                  ) : (
                    <div>
                      {data.clearances.map((c: any) => (
                        <div key={c.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 0',
                          borderBottom: '1px solid var(--border-color)'
                        }}>
                          <div>
                            <Text style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{c.department} Department</Text>
                            {c.comments && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{c.comments}</div>}
                            {c.clearedAt && <div style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{dayjs(c.clearedAt).format('MMM DD, YYYY')}</div>}
                          </div>
                          <div>
                            {c.isCleared ? (
                              <Tag color="success" style={{ borderRadius: 20, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={11} /> Cleared
                              </Tag>
                            ) : (
                              <Tag color="warning" style={{ borderRadius: 20, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11} /> Pending
                              </Tag>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
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
                <SectionCard title="Full & Final Settlement" icon={<CreditCard size={16} />}>
                  {!data.fnf ? (
                    <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>FnF settlement has not been processed yet.</Text>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="Status" value={renderStatus(data.fnf.status)} />
                      <Field label="Net Payable" value={<Text strong style={{ color: '#10b981', fontSize: 15 }}>₹{Number(data.fnf.totalPayable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>} />
                      <Field label="Processed At" value={data.fnf.processedAt ? dayjs(data.fnf.processedAt).format('MMM DD, YYYY') : '—'} />
                    </div>
                  )}
                </SectionCard>
              )
            }
          ]}
        />
      </div>
    );
  };

  return (
    <Drawer
      {...commonDrawerProps}
      open={visible}
      onClose={onClose}
    >
      <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
      <div
        className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
        style={{
          background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--bg-blue-50)',
              color: 'var(--text-blue-700)',
              border: '1px solid var(--border-blue-200)',
            }}
          >
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              Exit Request Details
              {data && renderStatus(data.status)}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              View and track exit request progress
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)] cursor-pointer"
          style={{ color: 'var(--text-secondary)', border: 'none', background: 'transparent' }}
        >
          <X size={16} />
        </button>
      </div>
      {renderContent()}
    </Drawer>
  );
};
