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
  const router = useRouter();
  const { canReadAttendance } = usePermission();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [presentEmployees, setPresentEmployees] = useState<PresentEmployee[]>([]);
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'custom'>('week');
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    if (!authLoading && !canReadAttendance) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadAttendance, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summary, employees] = await Promise.all([
        AttendanceService.getDashboardSummary(),
        AttendanceService.getPresentMembers(),
      ]);
      setDashboardSummary(summary as any);
      setPresentEmployees(employees as any);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && canReadAttendance) {
      fetchData();
    }
  }, [user, canReadAttendance]);

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

  if (authLoading || !canReadAttendance) return null;

  return (
    <MainLayout>
      <div style={{ padding: '24px', background: '#fff', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <DashboardOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Attendance Dashboard</Title>
              <Text type="secondary">Overview of organization attendance for today</Text>
            </div>
          </Space>

          <Card size="small" style={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Space>
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
                style={{ borderRadius: '6px' }}
              />
            </Space>
          </Card>
        </div>

        {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: 24, borderRadius: '8px' }} />}

        {/* Statistics Grid */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          {[
            { title: 'Total Members', value: dashboardSummary?.totalMembers, color: '#1677ff', icon: <TeamOutlined /> },
            { title: 'Expected Today', value: dashboardSummary?.expectedToday, color: '#722ed1', icon: <ClockCircleOutlined /> },
            { title: 'Present Today', value: dashboardSummary?.presentToday, color: '#52c41a', icon: <CheckCircleOutlined /> },
            { title: 'Absent Today', value: dashboardSummary?.absentToday, color: '#ff4d4f', icon: <CloseCircleOutlined /> },
          ].map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card 
                bordered={false} 
                style={{ 
                  borderRadius: '16px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  background: '#fff'
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
                    title={<Text type="secondary" style={{ fontSize: '14px' }}>{stat.title}</Text>} 
                    value={stat.value || 0} 
                    valueStyle={{ fontWeight: 700, fontSize: '24px', color: '#1a1a1a' }}
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
                  <TeamOutlined style={{ color: '#52c41a' }} />
                  <span style={{ fontWeight: 600 }}>Today's Present Employees</span>
                </Space>
              }
              style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
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
                          <Text strong style={{ fontSize: '16px' }}>{employee.name}</Text>
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
                          <Space split={<Divider type="vertical" />} wrap>
                            <Text type="secondary">{typeof employee.position === 'object' ? employee.position?.title : employee.position || 'N/A'}</Text>
                            <Text type="secondary">
                              <ClockCircleOutlined style={{ marginRight: '4px' }} />
                              Clock In: {dayjs(employee.clockInTime).format('HH:mm')}
                            </Text>
                            <Text type="secondary">
                              Work Hours: <Text strong style={{ color: '#1a1a1a' }}>{formatDuration(employee.workHours)}</Text>
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
              title={<span style={{ fontWeight: 600 }}>Attendance Health</span>}
              style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', height: '100%' }}
            >
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Statistic
                  title={<Text type="secondary">Overall Attendance Rate</Text>}
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
                  <Divider orientation="left" plain>Insights</Divider>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <Text type="secondary">Late Today</Text>
                    <Tag color="orange" style={{ borderRadius: '6px', border: 'none', fontWeight: 600 }}>
                      {dashboardSummary?.lateToday || 0} Employees
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Work from Home</Text>
                    <Tag color="purple" style={{ borderRadius: '6px', border: 'none', fontWeight: 600 }}>
                      {dashboardSummary?.wfhToday || 0} Employees
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
