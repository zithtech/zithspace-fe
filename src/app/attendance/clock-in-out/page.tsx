'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  Table,
  Button,
  Typography,
  Tag,
  Alert,
  Row,
  Col,
  Statistic,
  Divider,
  Space,
  DatePicker,
  Select,
  Drawer,
} from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  HistoryOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { AttendanceService, Attendance, TodayAttendance } from '@/services/attendanceService';
import { usePermission } from '@/hooks/usePermission';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(localeData);
dayjs.extend(weekday);
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface TodayAttendanceStatus extends TodayAttendance {
  shift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isFlexible?: boolean;
  };
  isClockIn: boolean;
  clockInTime?: string;
  clockOutTime?: string;
  totalWorkMinutes: number;
}

export default function ClockInOutPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { canClockInOut } = usePermission();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [todayStatus, setTodayStatus] = useState<TodayAttendanceStatus | null>(null);
  const [myAttendanceRecords, setMyAttendanceRecords] = useState<Attendance[]>([]);
  const [workHoursSummary, setWorkHoursSummary] = useState<any>(null);
  const [isHistoryDrawerVisible, setIsHistoryDrawerVisible] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [allHistoryRecords, setAllHistoryRecords] = useState<Attendance[]>([]);

  useEffect(() => {
    if (!authLoading && !canClockInOut) {
      router.push('/dashboard');
    }
  }, [authLoading, canClockInOut, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [status, records, summary] = await Promise.all([
        AttendanceService.getTodayAttendance(),
        AttendanceService.getAttendance({ page: 1, limit: 10, member: user?.id }),
        AttendanceService.getMySummary(),
      ]);
      setTodayStatus(status as any);
      setMyAttendanceRecords(records.data);
      setWorkHoursSummary(summary);
    } catch (err: any) {
      console.error('Failed to fetch clock data:', err);
      setError('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (page = 1, pageSize = 10) => {
    try {
      setHistoryLoading(true);
      const records = await AttendanceService.getAttendance({ 
        page, 
        limit: pageSize, 
        member: user?.id 
      });
      setAllHistoryRecords(records.data);
      setHistoryPagination({
        current: page,
        pageSize,
        total: records.pagination.total,
      });
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (user && canClockInOut) {
      fetchData();
    }
  }, [user, canClockInOut]);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      setError('');
      await AttendanceService.clockIn();
      setSuccess('Clocked in successfully!');
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to clock in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      setError('');
      await AttendanceService.clockOut();
      setSuccess('Clocked out successfully!');
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to clock out');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: '#10b981', // Emerald
      late: '#f59e0b',    // Amber
      absent: '#f43f5e',   // Rose
    };
    return colors[status] || '#64748b';
  };

  const columns: ColumnsType<Attendance> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => <Text style={{ fontSize: '14px' }}>{dayjs(date).format('MMM DD, YYYY')}</Text>,
    },
    {
      title: 'Clock In',
      dataIndex: 'clockIn',
      key: 'clockIn',
      render: (time) => time ? dayjs(time).format('HH:mm') : '-',
    },
    {
      title: 'Clock Out',
      dataIndex: 'clockOut',
      key: 'clockOut',
      render: (time) => time ? dayjs(time).format('HH:mm') : '-',
    },
    {
      title: 'Work Hours',
      key: 'workHours',
      render: (_, record: any) => record.effectiveWorkMinutes ? formatDuration(record.effectiveWorkMinutes) : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag 
          style={{ 
            borderRadius: '20px', 
            padding: '2px 14px', 
            fontWeight: 700,
            border: 'none',
            fontSize: '11px',
            backgroundColor: status === 'present' ? 'rgba(16, 185, 129, 0.15)' : status === 'late' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            color: status === 'present' ? '#10b981' : status === 'late' ? '#f59e0b' : '#f43f5e',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  if (authLoading || !canClockInOut) return null;

  return (
    <MainLayout>
      <div style={{ 
        margin: "0 -24px", 
        padding: "24px 32px", 
        background: "var(--bg-pure-white)", 
        minHeight: "calc(100vh - 64px)" 
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Space align="center" size={16}>
            <div style={{ 
              background: 'var(--bg-pure-white)', 
              padding: '12px', 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClockCircleOutlined style={{ fontSize: 24, color: 'var(--premium-blue)' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--text-slate-900)' }}>Clock In / Out</Title>
              <Text style={{ color: 'var(--text-slate-500)' }}>Track your daily working hours and attendance status</Text>
            </div>
          </Space>
        </div>

        {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: 24, borderRadius: '8px' }} />}
        {success && <Alert message={success} type="success" showIcon closable style={{ marginBottom: 24, borderRadius: '8px' }} />}

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={10}>
            <Card 
              style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', background: 'var(--bg-pure-white)' }}
              bodyStyle={{ padding: '32px' }}
            >
              {todayStatus ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <Text style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-slate-400)' }}>Current Shift</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Title level={2} style={{ margin: 0, color: 'var(--text-slate-900)' }}>
                        {todayStatus.shift?.name || 'General Shift'}
                      </Title>
                      <Text strong style={{ color: 'var(--premium-blue)', fontSize: '18px' }}>
                        {todayStatus.shift?.startTime} - {todayStatus.shift?.endTime}
                      </Text>
                    </div>
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    {!todayStatus.isClockIn ? (
                        <Button
                          type="primary"
                          size="large"
                          icon={<PlayCircleOutlined />}
                          onClick={handleClockIn}
                          loading={actionLoading}
                          style={{ 
                            width: '240px', 
                            height: '64px', 
                            borderRadius: '32px', 
                            fontSize: '20px', 
                            fontWeight: 700, 
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                            border: 'none',
                            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
                            transition: 'all 0.3s ease'
                          }}
                          className="premium-action-btn"
                        >
                          Clock In
                        </Button>
                      ) : !todayStatus.clockOutTime ? (
                        <Button
                          danger
                          size="large"
                          icon={<StopOutlined />}
                          onClick={handleClockOut}
                          loading={actionLoading}
                          style={{ 
                            width: '240px', 
                            height: '64px', 
                            borderRadius: '32px', 
                            fontSize: '20px', 
                            fontWeight: 700, 
                            background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                            border: 'none',
                            boxShadow: '0 8px 20px rgba(244, 63, 94, 0.35)',
                            transition: 'all 0.3s ease'
                          }}
                          className="premium-action-btn"
                        >
                          Clock Out
                        </Button>
                      ) : (
                        <div style={{ 
                          background: 'rgba(16, 185, 129, 0.1)', 
                          padding: '20px', 
                          borderRadius: '20px', 
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          display: 'inline-block',
                          minWidth: '240px'
                        }}>
                          <CheckCircleOutlined style={{ color: '#10b981', fontSize: '24px', marginBottom: '8px' }} />
                          <br />
                          <Text strong style={{ color: '#10b981', fontSize: '18px', display: 'block' }}>Day Complete</Text>
                        </div>
                    )}
                  </div>

                  <Row gutter={16} style={{ background: 'var(--bg-slate-50)', padding: '24px', borderRadius: '16px' }}>
                    <Col span={12}>
                      <Statistic title={<span style={{ color: 'var(--text-slate-400)' }}>Today's Hours</span>} value={formatDuration(todayStatus.totalWorkMinutes)} valueStyle={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-slate-900)' }} />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title={<span style={{ color: 'var(--text-slate-400)' }}>Status</span>} 
                        value={todayStatus.status.toUpperCase()} 
                        valueStyle={{ fontSize: '16px', fontWeight: 700, color: getStatusColor(todayStatus.status) }} 
                      />
                    </Col>
                  </Row>

                  {todayStatus.clockInTime && (
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '48px' }}>
                      <div>
                        <Text style={{ fontSize: '12px', color: 'var(--text-slate-400)' }}>CLOCK IN</Text>
                        <br />
                        <Text strong style={{ fontSize: '16px', color: 'var(--text-slate-900)' }}>{dayjs(todayStatus.clockInTime).format('HH:mm')}</Text>
                      </div>
                      <div>
                        <Text style={{ fontSize: '12px', color: 'var(--text-slate-400)' }}>CLOCK OUT</Text>
                        <br />
                        <Text strong style={{ fontSize: '16px', color: 'var(--text-slate-900)' }}>{todayStatus.clockOutTime ? dayjs(todayStatus.clockOutTime).format('HH:mm') : '--:--'}</Text>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text type="secondary">Loading status...</Text>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Card 
                  title={<Space><HistoryOutlined style={{ color: 'var(--premium-blue)' }} /><span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Work Hours Insights</span></Space>}
                  style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', background: 'var(--bg-pure-white)' }}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Statistic 
                        title={<span style={{ color: 'var(--text-slate-400)' }}>This Week</span>} 
                        value={workHoursSummary?.thisWeek?.workHours || '0h 0m'} 
                        valueStyle={{ fontWeight: 700, color: 'var(--text-slate-900)' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title={<span style={{ color: 'var(--text-slate-400)' }}>This Month</span>} 
                        value={workHoursSummary?.thisMonth?.workHours || '0h 0m'} 
                        valueStyle={{ fontWeight: 700, color: 'var(--text-slate-900)' }}
                      />
                    </Col>
                  </Row>
                  <Divider style={{ margin: '16px 0', borderColor: 'var(--border-slate-100)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text style={{ color: 'var(--text-slate-500)' }}>Daily Average</Text>
                      <br />
                      <Text strong style={{ color: 'var(--text-slate-900)' }}>{workHoursSummary?.thisWeek?.averagePerDay || '0h 0m'}</Text>
                    </div>
                    {workHoursSummary?.thisWeek?.overtimeMinutes > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <Text style={{ color: 'var(--text-slate-500)' }}>Overtime (Week)</Text>
                        <br />
                        <Tag color="gold" style={{ border: 'none', fontWeight: 600 }}>{workHoursSummary?.thisWeek?.overtimeHours}</Tag>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card 
                  title={<Space><CalendarOutlined style={{ color: '#fa8c16' }} /><span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Recent Activity</span></Space>}
                  style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', background: 'var(--bg-pure-white)' }}
                  bodyStyle={{ padding: '0 24px' }}
                >
                  <Table 
                    columns={columns} 
                    dataSource={myAttendanceRecords} 
                    rowKey="id" 
                    pagination={false}
                    loading={loading}
                    size="middle"
                  />
                  <div style={{ padding: '16px 0', textAlign: 'center' }}>
                    <Button 
                      type="link" 
                      onClick={() => {
                        setIsHistoryDrawerVisible(true);
                        fetchHistory(1, 10);
                      }}
                    >
                      View All History
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Drawer
          title={
            <Space>
              <HistoryOutlined style={{ color: 'var(--premium-blue)' }} />
              <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-slate-900)' }}>Your Attendance History</span>
            </Space>
          }
          placement="right"
          onClose={() => setIsHistoryDrawerVisible(false)}
          open={isHistoryDrawerVisible}
          width={750}
          className="premium-drawer"
          headerStyle={{ 
            borderBottom: '1px solid var(--border-slate-200)', 
            padding: '24px 32px',
            background: 'var(--bg-secondary)' 
          }}
          bodyStyle={{ 
            padding: '0',
            background: 'var(--bg-secondary)'
          }}
        >
          <div style={{ padding: '24px 32px' }}>
            <Table 
              columns={columns} 
              dataSource={allHistoryRecords} 
              rowKey="id" 
              loading={historyLoading}
              pagination={{
                ...historyPagination,
                onChange: (page, pageSize) => fetchHistory(page, pageSize),
                showSizeChanger: true,
                size: 'default',
                className: 'premium-pagination'
              }}
              size="middle"
              scroll={{ x: 600 }}
              className="premium-table"
            />
          </div>
        </Drawer>
      </div>
      <style jsx global>{`
        .premium-drawer .ant-drawer-content {
          background-color: var(--bg-secondary) !important;
        }
        .premium-drawer .ant-drawer-header {
          border-bottom: 1px solid var(--border-slate-100) !important;
          background: linear-gradient(to right, var(--bg-secondary), var(--bg-slate-50)) !important;
        }
        .premium-drawer .ant-drawer-header-title {
          flex-direction: row-reverse;
        }
        .premium-drawer .ant-drawer-close {
          margin-inline-end: 0;
          margin-inline-start: 12px;
          color: var(--text-slate-400);
          transition: transform 0.3s ease;
        }
        .premium-drawer .ant-drawer-close:hover {
          transform: rotate(90deg);
          color: #f43f5e;
        }
        .premium-table .ant-table {
          background: transparent !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-500) !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: '1px' !important;
          border-bottom: 2px solid var(--border-slate-100) !important;
          padding: 16px !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 18px 16px !important;
          border-bottom: 1px solid var(--border-slate-50) !important;
          color: var(--text-slate-900) !important;
          font-size: 14px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-table .ant-table-row:hover td {
          background: rgba(99, 102, 241, 0.04) !important;
          color: #4f46e5 !important;
        }
        .premium-pagination .ant-pagination-item-active {
          border-color: #6366f1 !important;
          background: #6366f1 !important;
        }
        .premium-pagination .ant-pagination-item-active a {
          color: #fff !important;
        }
        .premium-action-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .premium-action-btn:active {
          transform: translateY(0);
        }
        
        /* Custom scrollbar for Drawer */
        .premium-drawer .ant-drawer-body::-webkit-scrollbar {
          width: 6px;
        }
        .premium-drawer .ant-drawer-body::-webkit-scrollbar-thumb {
          background: var(--border-slate-200);
          border-radius: 10px;
        }
      `}</style>
    </MainLayout>
  );
}
