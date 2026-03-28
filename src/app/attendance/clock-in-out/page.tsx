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
} from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  HistoryOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { AttendanceService, Attendance, TodayAttendance } from '@/services/attendanceService';
import { usePermission } from '@/hooks/usePermission';
import dayjs from 'dayjs';
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
  const { canReadAttendance } = usePermission();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [todayStatus, setTodayStatus] = useState<TodayAttendanceStatus | null>(null);
  const [myAttendanceRecords, setMyAttendanceRecords] = useState<Attendance[]>([]);
  const [workHoursSummary, setWorkHoursSummary] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !canReadAttendance) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadAttendance, router]);

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

  useEffect(() => {
    if (user && canReadAttendance) {
      fetchData();
    }
  }, [user, canReadAttendance]);

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
      present: '#52c41a',
      late: '#faad14',
      absent: '#ff4d4f',
    };
    return colors[status] || '#8c8c8c';
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
        <Tag color={getStatusColor(status)} style={{ borderRadius: '6px', border: 'none', fontWeight: 600 }}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  if (authLoading || !canReadAttendance) return null;

  return (
    <MainLayout>
      <div style={{ padding: '24px', background: '#fff', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Space align="center" size={16}>
            <div style={{ 
              background: '#fff', 
              padding: '12px', 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClockCircleOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Clock In / Out</Title>
              <Text type="secondary">Track your daily working hours and attendance status</Text>
            </div>
          </Space>
        </div>

        {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: 24, borderRadius: '8px' }} />}
        {success && <Alert message={success} type="success" showIcon closable style={{ marginBottom: 24, borderRadius: '8px' }} />}

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={10}>
            <Card 
              style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              bodyStyle={{ padding: '32px' }}
            >
              {todayStatus ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <Text type="secondary" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Shift</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
                        {todayStatus.shift?.name || 'General Shift'}
                      </Title>
                      <Text strong style={{ color: '#1677ff', fontSize: '18px' }}>
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
                        style={{ width: '220px', height: '60px', borderRadius: '30px', fontSize: '18px', fontWeight: 600, background: '#1677ff', boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)' }}
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
                        style={{ width: '220px', height: '60px', borderRadius: '30px', fontSize: '18px', fontWeight: 600, boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)' }}
                      >
                        Clock Out
                      </Button>
                    ) : (
                      <div style={{ background: '#f6ffed', padding: '16px', borderRadius: '12px', border: '1px solid #b7eb8f' }}>
                        <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>Day Complete</Text>
                      </div>
                    )}
                  </div>

                  <Row gutter={16} style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px' }}>
                    <Col span={12}>
                      <Statistic title="Today's Hours" value={formatDuration(todayStatus.totalWorkMinutes)} valueStyle={{ fontSize: '20px', fontWeight: 700 }} />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="Status" 
                        value={todayStatus.status.toUpperCase()} 
                        valueStyle={{ fontSize: '16px', fontWeight: 700, color: getStatusColor(todayStatus.status) }} 
                      />
                    </Col>
                  </Row>

                  {todayStatus.clockInTime && (
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '48px' }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>CLOCK IN</Text>
                        <br />
                        <Text strong style={{ fontSize: '16px' }}>{dayjs(todayStatus.clockInTime).format('HH:mm')}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>CLOCK OUT</Text>
                        <br />
                        <Text strong style={{ fontSize: '16px' }}>{todayStatus.clockOutTime ? dayjs(todayStatus.clockOutTime).format('HH:mm') : '--:--'}</Text>
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
                  title={<Space><HistoryOutlined style={{ color: '#1677ff' }} /><span style={{ fontWeight: 600 }}>Work Hours Insights</span></Space>}
                  style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Statistic 
                        title="This Week" 
                        value={workHoursSummary?.thisWeek?.workHours || '0h 0m'} 
                        valueStyle={{ fontWeight: 700, color: '#1a1a1a' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic 
                        title="This Month" 
                        value={workHoursSummary?.thisMonth?.workHours || '0h 0m'} 
                        valueStyle={{ fontWeight: 700, color: '#1a1a1a' }}
                      />
                    </Col>
                  </Row>
                  <Divider style={{ margin: '16px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text type="secondary">Daily Average</Text>
                      <br />
                      <Text strong>{workHoursSummary?.thisWeek?.averagePerDay || '0h 0m'}</Text>
                    </div>
                    {workHoursSummary?.thisWeek?.overtimeMinutes > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <Text type="secondary">Overtime (Week)</Text>
                        <br />
                        <Tag color="gold" style={{ border: 'none', fontWeight: 600 }}>{workHoursSummary?.thisWeek?.overtimeHours}</Tag>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

              <Col span={24}>
                <Card 
                  title={<Space><CalendarOutlined style={{ color: '#fa8c16' }} /><span style={{ fontWeight: 600 }}>Recent Activity</span></Space>}
                  style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
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
                    <Button type="link">View All History</Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
