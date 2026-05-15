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
  Avatar,
  Divider,
  List,
  Space,
  DatePicker,
  App,
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { AttendanceService, Attendance } from '@/services/attendanceService';
import { usePermission } from '@/hooks/usePermission';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(localeData);
dayjs.extend(weekday);
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Types
interface DashboardSummary {
  totalMembers: number;
  expectedToday: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  wfhToday: number;
  attendanceRate: number;
}

interface PresentEmployee {
  id: string;
  name: string;
  avatarUrl?: string;
  position: string | { id: string; title: string; code: string; } | null;
  status: string;
  clockInTime: string;
  shift: {
    name: string;
    startTime: string;
    endTime: string;
  };
  workHours: number;
}

export default function AttendanceDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { notification } = App.useApp();
  const router = useRouter();
  const { canReadAttendanceDashboard } = usePermission();

  const [loading, setLoading] = useState(true);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [presentEmployees, setPresentEmployees] = useState<PresentEmployee[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    if (!authLoading && !canReadAttendanceDashboard) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadAttendanceDashboard, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      let startDate: string | undefined;
      let endDate: string | undefined;

      if (dateFilter === 'week') {
        startDate = dayjs().startOf('week').toISOString();
        endDate = dayjs().endOf('day').toISOString();
      } else if (dateFilter === 'month') {
        startDate = dayjs().startOf('month').toISOString();
        endDate = dayjs().endOf('day').toISOString();
      } else if (dateFilter === 'custom' && customDateRange) {
        startDate = customDateRange[0].startOf('day').toISOString();
        endDate = customDateRange[1].endOf('day').toISOString();
      } else {
        startDate = dayjs().startOf('day').toISOString();
        endDate = dayjs().endOf('day').toISOString();
      }

      const [summary, employees] = await Promise.all([
        AttendanceService.getDashboardSummary(startDate, endDate),
        AttendanceService.getPresentMembers(startDate, endDate),
      ]);
      setDashboardSummary(summary as any);
      setPresentEmployees(employees as any);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      notification.error({
        message: 'Dashboard Error',
        description: 'Failed to load dashboard data',
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && canReadAttendanceDashboard) {
      fetchData();
    }
  }, [user, canReadAttendanceDashboard, dateFilter, customDateRange]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: '#52c41a',
      late: '#faad14',
      absent: '#ff4d4f',
    };
    return colors[status] || '#8c8c8c';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      present: <CheckCircleOutlined />,
      late: <ExclamationCircleOutlined />,
      absent: <CloseCircleOutlined />,
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getFilterLabel = () => {
    if (dateFilter === 'today') return 'today';
    if (dateFilter === 'week') return 'this week';
    if (dateFilter === 'month') return 'this month';
    if (dateFilter === 'custom' && customDateRange) {
      return `${customDateRange[0].format('MMM DD')} - ${customDateRange[1].format('MMM DD')}`;
    }
    return 'today';
  };

  if (authLoading || !canReadAttendanceDashboard) return null;

  return (
    <MainLayout>
      <div style={{ 
        margin: "0 -24px", 
        padding: "24px 32px", 
        background: "var(--bg-pure-white)", 
        minHeight: "calc(100vh - 64px)" 
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <DashboardOutlined style={{ fontSize: 24, color: 'var(--premium-blue)' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--text-slate-900)' }}>Attendance Dashboard</Title>
              <Text type="secondary" style={{ color: 'var(--text-slate-500)' }}>Overview of organization attendance {getFilterLabel()}</Text>
            </div>
          </Space>

          <Card size="small" style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', background: 'var(--bg-pure-white)' }}>
            <Space>
              <Button
                type={dateFilter === 'today' ? 'primary' : 'default'}
                onClick={() => setDateFilter('today')}
                style={{ borderRadius: '6px' }}
              >
                Today
              </Button>
              <Button
                type={dateFilter === 'week' ? 'primary' : 'default'}
                onClick={() => setDateFilter('week')}
                style={{ borderRadius: '6px' }}
              >
                Week
              </Button>
              <Button
                type={dateFilter === 'month' ? 'primary' : 'default'}
                onClick={() => setDateFilter('month')}
                style={{ borderRadius: '6px' }}
              >
                Month
              </Button>
              <DatePicker.RangePicker
                value={customDateRange}
                onChange={(dates) => {
                  setCustomDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
                  setDateFilter('custom');
                }}
                style={{ borderRadius: '6px', background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)' }}
              />
            </Space>
          </Card>
        </div>

        {/* Statistics Grid */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          {[
            { title: 'Total Members', value: dashboardSummary?.totalMembers, color: '#1677ff', icon: <TeamOutlined /> },
            { title: dateFilter === 'today' ? 'Expected Today' : 'Expected Records', value: dashboardSummary?.expectedToday, color: '#722ed1', icon: <ClockCircleOutlined /> },
            { title: dateFilter === 'today' ? 'Present Today' : 'Present Records', value: dashboardSummary?.presentToday, color: '#52c41a', icon: <CheckCircleOutlined /> },
            { title: dateFilter === 'today' ? 'Absent Today' : 'Absent Records', value: dashboardSummary?.absentToday, color: '#ff4d4f', icon: <CloseCircleOutlined /> },
          ].map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card 
                bordered={false} 
                style={{ 
                  borderRadius: '16px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  background: 'var(--bg-pure-white)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    background: `${stat.color}10`, 
                    padding: '12px', 
                    borderRadius: '12px',
                    color: stat.color,
                    fontSize: '20px'
                  }}>
                    {stat.icon}
                  </div>
                  <Statistic 
                    title={<Text style={{ fontSize: '14px', color: 'var(--text-slate-500)' }}>{stat.title}</Text>} 
                    value={stat.value || 0} 
                    valueStyle={{ fontWeight: 700, fontSize: '24px', color: 'var(--text-slate-900)' }}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card 
              title={
                <Space>
                  <TeamOutlined style={{ color: 'var(--premium-blue)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Present Employees ({getFilterLabel()})</span>
                </Space>
              }
              style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', background: 'var(--bg-pure-white)' }}
              bodyStyle={{ padding: '0 24px' }}
            >
              <List
                dataSource={presentEmployees}
                loading={loading}
                renderItem={(employee) => (
                  <List.Item style={{ padding: '16px 0' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={48}
                          src={employee.avatarUrl}
                          style={{
                            backgroundColor: getStatusColor(employee.status),
                            fontSize: '18px',
                            fontWeight: 600,
                            borderRadius: '12px'
                          }}
                        >
                          {employee.name.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <Space size={12}>
                          <Text strong style={{ fontSize: '16px', color: 'var(--text-slate-900)' }}>{employee.name}</Text>
                          <Tag
                            color={getStatusColor(employee.status)}
                            style={{ 
                              borderRadius: '6px', 
                              border: 'none', 
                              fontWeight: 600,
                              padding: '2px 8px'
                            }}
                          >
                            {employee.status.toUpperCase()}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: '4px' }}>
                          <Space split={<Divider type="vertical" style={{ borderColor: 'var(--border-slate-100)' }} />} wrap>
                            <Text style={{ color: 'var(--text-slate-500)' }}>{typeof employee.position === 'object' ? (employee.position as any)?.title : employee.position || 'N/A'}</Text>
                            <Text style={{ color: 'var(--text-slate-500)' }}>
                              <ClockCircleOutlined style={{ marginRight: '4px' }} />
                              {dayjs(employee.clockInTime).format('MMM DD, HH:mm')}
                            </Text>
                            <Text style={{ color: 'var(--text-slate-500)' }}>
                              Work Hours: <Text strong style={{ color: 'var(--text-slate-900)' }}>{formatDuration(employee.workHours)}</Text>
                            </Text>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: 'No employees present today' }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card 
              title={<span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Attendance Health</span>}
              style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', height: '100%', background: 'var(--bg-pure-white)' }}
            >
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Statistic
                  title={<Text style={{ color: 'var(--text-slate-500)' }}>Overall Attendance Rate</Text>}
                  value={dashboardSummary?.attendanceRate || 0}
                  suffix="%"
                  valueStyle={{
                    color: (dashboardSummary?.attendanceRate || 0) >= 90 ? '#52c41a' :
                           (dashboardSummary?.attendanceRate || 0) >= 75 ? '#faad14' : '#ff4d4f',
                    fontSize: '48px',
                    fontWeight: 800
                  }}
                />
                <div style={{ marginTop: '24px' }}>
                  <Divider orientation="left" plain><span style={{ color: 'var(--text-slate-400)' }}>Insights</span></Divider>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <Text style={{ color: 'var(--text-slate-500)' }}>Late Today</Text>
                    <Tag color="orange" style={{ borderRadius: '6px', border: 'none', fontWeight: 600 }}>
                      {dashboardSummary?.lateToday || 0} Employees
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: 'var(--text-slate-500)' }}>Work from Home</Text>
                    <Tag color="purple" style={{ borderRadius: '6px', border: 'none', fontWeight: 600 }}>
                      {dashboardSummary?.wfhToday || 0} Employees
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
        <style jsx global>{`
          .ant-list-item {
            border-bottom: 1px solid var(--border-slate-100) !important;
          }
          .ant-divider-horizontal {
             border-top: 1px solid var(--border-slate-100) !important;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
