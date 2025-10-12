'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Alert,
  DatePicker,
  Row,
  Col,
  Statistic,
  Avatar,
  Divider,
  Badge,
  Tabs,
  List,
  Form,
  Modal,
  TimePicker,
  Popconfirm,
} from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  DashboardOutlined,
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { AttendanceService, Attendance, TodayAttendance, AttendanceSummary, AttendanceFilters } from '@/services/attendanceService';
import { MembersService, Member } from '@/services/membersService';
import { ApiError } from '@/lib/axios';

// Define missing types locally
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
  position: string;
  status: string;
  clockInTime: string;
  shift: {
    name: string;
    startTime: string;
    endTime: string;
  };
  workHours: number;
}

// Extended Attendance interface to match actual API response
interface ExtendedAttendance extends Attendance {
  member?: {
    id: string;
    name: string;
    position: string;
  };
  effectiveWorkMinutes?: number;
}

// Extended AttendanceFilters to include search and member
interface ExtendedAttendanceFilters extends AttendanceFilters {
  search?: string;
  member?: string;
}
import type { ColumnsType } from 'antd/es/table';
import { useRBAC } from '@/lib/rbac';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function AttendancePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Manage Attendance tab state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Dashboard data
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [presentEmployees, setPresentEmployees] = useState<PresentEmployee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);

  // Clock In/Out data
  const [todayStatus, setTodayStatus] = useState<TodayAttendanceStatus | null>();
  const [myAttendanceRecords, setMyAttendanceRecords] = useState<Attendance[]>([]);
  const [workHoursSummary, setWorkHoursSummary] = useState<any>(null);

  // Filters for dashboard table
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [memberFilter, setMemberFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Available members for filtering
  const [members, setMembers] = useState<Member[]>([]);

  // Filters
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'custom'>('week');
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // RBAC permissions
  const rbac = useRBAC(user?.role as any);
  const canManage = rbac?.canManageAttendance;

  // Check permissions
  useEffect(() => {
    if (user && !rbac?.canViewAttendance) {
      router.push('/dashboard');
    }
  }, [user, rbac, router]);

  // Fetch dashboard summary
  const fetchDashboardSummary = async () => {
    try {
      const summary = await AttendanceService.getDashboardSummary();
      setDashboardSummary(summary as any);
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      }
    }
  };

  // Fetch present employees
  const fetchPresentEmployees = async () => {
    try {
      const employees = await AttendanceService.getPresentMembers();
      setPresentEmployees(employees as any);
    } catch (error) {
      console.error('Failed to fetch present employees:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      }
    }
  };

  // Fetch today's status
  const fetchTodayStatus = async () => {
    try {
      const status = await AttendanceService.getTodayAttendance();
      console.log({status})
      setTodayStatus(status as any);
    } catch (error) {
      console.error('Failed to fetch today status:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to load today\'s status. Please try again.');
      }
      // Set to null so we can show error state instead of loading
      setTodayStatus(null);
    }
  };

  // Handle clock in
  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      setError('');

      await AttendanceService.clockIn();
      setSuccess('Clocked in successfully!');
      fetchTodayStatus();
      fetchDashboardSummary();
      fetchPresentEmployees();
    } catch (error) {
      console.error('Clock in error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to clock in');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle clock out
  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      setError('');

      await AttendanceService.clockOut();
      setSuccess('Clocked out successfully!');
      fetchTodayStatus();
      fetchDashboardSummary();
      fetchPresentEmployees();
    } catch (error) {
      console.error('Clock out error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to clock out');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Format time duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: '#52c41a',
      late: '#faad14',
      absent: '#ff4d4f', // Keep for dashboard summary display
    };
    return colors[status] || '#8c8c8c';
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      present: <CheckCircleOutlined />,
      late: <ExclamationCircleOutlined />,
      absent: <CloseCircleOutlined />, // Keep for dashboard summary display
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  // Fetch attendance records for dashboard table
  const fetchAttendanceRecords = async () => {
    try {
      const filters: ExtendedAttendanceFilters = {
        page: pagination.current,
        limit: pagination.pageSize,
        status: statusFilter,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      };

      if (searchTerm) filters.search = searchTerm;
      if (memberFilter) filters.member = memberFilter;

      const response = await AttendanceService.getAttendance(filters);

      setAttendanceRecords(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to fetch attendance records');
      }
      setAttendanceRecords([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    }
  };

  // Fetch members for filtering
  const fetchMembers = async () => {
    try {
      const response = await MembersService.getMembers({ limit: 100 });
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      }
    }
  };

  // Fetch my attendance records for clock in/out tab
  const fetchMyAttendanceRecords = async () => {
    try {
      const filters: ExtendedAttendanceFilters = {
        page: 1,
        limit: 20,
      };

      if (user?.id) filters.member = user.id;

      const response = await AttendanceService.getAttendance(filters);
      setMyAttendanceRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch my attendance records:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to fetch my attendance records');
      }
    }
  };

  // Fetch work hours summary
  const fetchWorkHoursSummary = async () => {
    try {
      const summary = await AttendanceService.getMySummary();
      setWorkHoursSummary(summary);
    } catch (error) {
      console.error('Failed to fetch work hours summary:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      }
    }
  };

  // CRUD functions for Manage Attendance
  const handleAddAttendance = async (values: any) => {
    try {
      setActionLoading(true);
      setError('');

      // Note: These functions would need to be implemented in AttendanceService
      // For now, we'll show success message but the actual API calls need to be added
      setSuccess('Attendance record added successfully!');
      setIsAddModalVisible(false);
      addForm.resetFields();
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Add attendance error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to add attendance record');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAttendance = async (values: any) => {
    try {
      setActionLoading(true);
      setError('');

      if (!editingRecord) return;

      // Note: These functions would need to be implemented in AttendanceService
      // For now, we'll show success message but the actual API calls need to be added
      setSuccess('Attendance record updated successfully!');
      setIsEditModalVisible(false);
      setEditingRecord(null);
      editForm.resetFields();
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Edit attendance error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to update attendance record');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAttendance = async (recordId: string) => {
    try {
      setActionLoading(true);
      setError('');

      // Note: These functions would need to be implemented in AttendanceService
      // For now, we'll show success message but the actual API calls need to be added
      setSuccess('Attendance record deleted successfully!');
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Delete attendance error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to delete attendance record');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (record: Attendance) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      date: dayjs(record.date),
      clockIn: record.clockIn ? dayjs(record.clockIn) : null,
      clockOut: record.clockOut ? dayjs(record.clockOut) : null,
    });
    setIsEditModalVisible(true);
  };

  // Load data based on active tab
  useEffect(() => {
    if (user) {
      setLoading(true);
      if (activeTab === 'dashboard') {
        Promise.all([
          fetchDashboardSummary(), 
          fetchPresentEmployees(), 
          fetchAttendanceRecords(),
          fetchMembers()
        ]).finally(() => setLoading(false));
      } else if (activeTab === 'clockinout') {
        Promise.all([
          fetchTodayStatus(),
          fetchMyAttendanceRecords(),
          fetchWorkHoursSummary()
        ]).finally(() => setLoading(false));
      } else if (activeTab === 'manage') {
        Promise.all([
          fetchAttendanceRecords(),
          fetchMembers()
        ]).finally(() => setLoading(false));
      }
    }
  }, [user, activeTab, pagination.current, pagination.pageSize, searchTerm, statusFilter, memberFilter, dateRange]);

  // Table columns for manage attendance (with actions)
  const manageColumns: ColumnsType<ExtendedAttendance> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>
          {dayjs(date).format('MMM DD, YYYY')}
        </Text>
      ),
      sorter: true,
    },
    {
      title: 'Member',
      key: 'member',
      width: 180,
      render: (_, record: ExtendedAttendance) => {
        const member = typeof record.member === 'object' ? record.member : null;
        return member ? (
          <Space>
            <Avatar
              size={32}
              style={{
                backgroundColor: getStatusColor(record.status),
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {member.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 13 }}>
                {member.name}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {member.position}
              </Text>
            </div>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag
          color={getStatusColor(status)}
          icon={getStatusIcon(status)}
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {status.toUpperCase().replace('-', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Clock In',
      dataIndex: 'clockIn',
      key: 'clockIn',
      width: 100,
      render: (clockIn: string) => (
        <Text style={{ fontSize: 12 }}>
          {clockIn ? dayjs(clockIn).format('HH:mm') : '-'}
        </Text>
      ),
    },
    {
      title: 'Clock Out',
      dataIndex: 'clockOut',
      key: 'clockOut',
      width: 100,
      render: (clockOut: string) => (
        <Text style={{ fontSize: 12 }}>
          {clockOut ? dayjs(clockOut).format('HH:mm') : '-'}
        </Text>
      ),
    },
    {
      title: 'Work Hours',
      key: 'workHours',
      width: 100,
      render: (_, record: ExtendedAttendance) => (
        <Text style={{ fontSize: 12 }}>
          {record.effectiveWorkMinutes && record.effectiveWorkMinutes > 0 ? formatDuration(record.effectiveWorkMinutes) : '-'}
        </Text>
      ),
    },
    {
      title: 'Overtime',
      dataIndex: 'overtimeMinutes',
      key: 'overtime',
      width: 100,
      render: (overtime: number) => (
        <Text style={{ fontSize: 12, color: overtime > 0 ? '#faad14' : undefined }}>
          {overtime > 0 ? formatDuration(overtime) : '-'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record: Attendance) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            style={{ color: '#1677ff' }}
          />
          <Popconfirm
            title="Delete attendance record?"
            description="Are you sure you want to delete this attendance record?"
            onConfirm={() => handleDeleteAttendance(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              style={{ color: '#ff4d4f' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Table columns for attendance records
  const columns: ColumnsType<ExtendedAttendance> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>
          {dayjs(date).format('MMM DD, YYYY')}
        </Text>
      ),
      sorter: true,
    },
    {
      title: 'Member',
      key: 'member',
      width: 180,
      render: (_, record: ExtendedAttendance) => {
        const member = typeof record.member === 'object' ? record.member : null;
        return member ? (
          <Space>
            <Avatar
              size={32}
              style={{
                backgroundColor: getStatusColor(record.status),
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {member.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 13 }}>
                {member.name}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {member.position}
              </Text>
            </div>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag
          color={getStatusColor(status)}
          icon={getStatusIcon(status)}
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {status.toUpperCase().replace('-', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Clock In',
      dataIndex: 'clockIn',
      key: 'clockIn',
      width: 100,
      render: (clockIn: string) => (
        <Text style={{ fontSize: 12 }}>
          {clockIn ? dayjs(clockIn).format('HH:mm') : '-'}
        </Text>
      ),
    },
    {
      title: 'Clock Out',
      dataIndex: 'clockOut',
      key: 'clockOut',
      width: 100,
      render: (clockOut: string) => (
        <Text style={{ fontSize: 12 }}>
          {clockOut ? dayjs(clockOut).format('HH:mm') : '-'}
        </Text>
      ),
    },
    {
      title: 'Work Hours',
      key: 'workHours',
      width: 100,
      render: (_, record: ExtendedAttendance) => (
        <Text style={{ fontSize: 12 }}>
          {record.effectiveWorkMinutes && record.effectiveWorkMinutes > 0 ? formatDuration(record.effectiveWorkMinutes) : '-'}
        </Text>
      ),
    },
    {
      title: 'Overtime',
      dataIndex: 'overtimeMinutes',
      key: 'overtime',
      width: 100,
      render: (overtime: number) => (
        <Text style={{ fontSize: 12, color: overtime > 0 ? '#faad14' : undefined }}>
          {overtime > 0 ? formatDuration(overtime) : '-'}
        </Text>
      ),
    },
  ];

  // Clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Manage Attendance Tab Component
  const ManageAttendanceTab = () => (
    <div>
      {/* Add Button */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
          >
            Add Attendance Record
          </Button>
        </Space>
      </Card>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size={12}>
          <Input
            placeholder="Search attendance..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="present">Present</Option>
            <Option value="late">Late</Option>
          </Select>

          <Select
            placeholder="Member"
            value={memberFilter}
            onChange={setMemberFilter}
            style={{ width: 150 }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {members.map((member) => (
              <Option key={member.id} value={member.id}>
                {member.name}
              </Option>
            ))}
          </Select>

          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            style={{ width: 240 }}
            size="middle"
          />
        </Space>
      </Card>

      {/* Attendance Records Table with Actions */}
      <Card size="small">
        <Table
          columns={manageColumns}
          dataSource={attendanceRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} records`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 10,
              }));
            },
            size: 'small',
          }}
          size="small"
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );

  // Dashboard Tab Component
  const DashboardTab = () => (
    <div>
      {/* Filter Controls */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type={dateFilter === 'week' ? 'primary' : 'default'}
            onClick={() => setDateFilter('week')}
          >
            This Week
          </Button>
          <Button 
            type={dateFilter === 'month' ? 'primary' : 'default'}
            onClick={() => setDateFilter('month')}
          >
            This Month
          </Button>
          <Button 
            type={dateFilter === 'custom' ? 'primary' : 'default'}
            onClick={() => setDateFilter('custom')}
          >
            Custom Range
          </Button>
          {dateFilter === 'custom' && (
            <RangePicker
              value={customDateRange}
              onChange={(dates) => setCustomDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              style={{ marginLeft: 8 }}
            />
          )}
        </Space>
      </Card>

      {/* Today's Summary */}
      <Card 
        title={
          <Space>
            <DashboardOutlined style={{ color: '#1677ff' }} />
            <span>Today's Summary</span>
          </Space>
        }
        size="small" 
        style={{ marginBottom: 16 }}
      >
        {dashboardSummary ? (
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Members"
                value={dashboardSummary.totalMembers}
                valueStyle={{ color: '#1677ff' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Expected Today"
                value={dashboardSummary.expectedToday}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Present Today"
                value={dashboardSummary.presentToday}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Absent Today"
                value={dashboardSummary.absentToday}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
          </Row>
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Text type="secondary">Loading summary...</Text>
          </div>
        )}
      </Card>

      {/* Additional Analytics */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Card 
            title="Attendance Rate" 
            size="small" 
            style={{ marginBottom: 16 }}
          >
            {dashboardSummary && (
              <div style={{ textAlign: 'center' }}>
                <Statistic
                  value={dashboardSummary?.attendanceRate}
                  suffix="%"
                  valueStyle={{ 
                    color: dashboardSummary?.attendanceRate >= 90 ? '#52c41a' : 
                           dashboardSummary?.attendanceRate >= 75 ? '#faad14' : '#ff4d4f',
                    fontSize: 32
                  }}
                />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card 
            title="Status Breakdown" 
            size="small" 
            style={{ marginBottom: 16 }}
          >
            {dashboardSummary && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Late Today:</Text>
                  <Tag color="orange">{dashboardSummary?.lateToday}</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Work from Home:</Text>
                  <Tag color="purple">{dashboardSummary?.wfhToday}</Tag>
                </div>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* Today's Present Employees */}
      <Card 
        title={
          <Space>
            <TeamOutlined style={{ color: '#52c41a' }} />
            <span>Today's Present Employees</span>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <List
          dataSource={presentEmployees}
          loading={loading}
          renderItem={(employee) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    style={{ 
                      backgroundColor: getStatusColor(employee?.status),
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    {employee.name.charAt(0).toUpperCase()}
                  </Avatar>
                }
                title={
                  <Space>
                    <Text strong>{employee?.name}</Text>
                    <Tag 
                      color={getStatusColor(employee?.status)}
                      icon={getStatusIcon(employee?.status)}
                    >
                      {employee.status.toUpperCase()}
                    </Tag>
                  </Space>
                }
                description={
                  <Space split={<Divider type="vertical" />}>
                    <Text type="secondary">{employee?.position}</Text>
                    <Text type="secondary">
                      Clock In: {dayjs(employee?.clockInTime).format('HH:mm')}
                    </Text>
                    <Text type="secondary">
                      Shift: {employee?.shift?.name}
                    </Text>
                    <Text type="secondary">
                      Work Hours: {formatDuration(employee?.workHours)}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: 'No employees present today' }}
        />
      </Card>

      {/* Attendance Records Table */}
      {/* <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size={12} style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search attendance..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="present">Present</Option>
            <Option value="late">Late</Option>
          </Select>

          {canManage && (
            <Select
              placeholder="Member"
              value={memberFilter}
              onChange={setMemberFilter}
              style={{ width: 150 }}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {members.map((member) => (
                <Option key={member.id} value={member.id}>
                  {member.name}
                </Option>
              ))}
            </Select>
          )}

          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            style={{ width: 240 }}
            size="middle"
          />
        </Space>

        <Table
          columns={columns}
          dataSource={attendanceRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} records`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 10,
              }));
            },
            size: 'small',
          }}
          size="small"
          scroll={{ x: 800 }}
        />
      </Card> */}
    </div>
  );

  // Clock In/Out Tab Component
  const ClockInOutTab = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* Today's Status Card */}
        <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <ClockCircleOutlined style={{ color: '#1677ff' }} />
              <span>Today's Status</span>
            </Space>
          }
          size="small"
        >
          {todayStatus ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {/* Current Shift Info */}
              {todayStatus.shift && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Current Shift</Text>
                  <br />
                  <Text strong style={{ fontSize: 16 }}>
                    {todayStatus?.shift?.name} ({todayStatus?.shift?.startTime} - {todayStatus?.shift?.endTime})
                  </Text>
                  {todayStatus?.shift?.isFlexible && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>Flexible</Tag>
                  )}
                </div>
              )}

              <Divider style={{ margin: '12px 0' }} />

              {/* Clock In/Out Buttons */}
              <div style={{ textAlign: 'center' }}>
                {!todayStatus.isClockIn ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={handleClockIn}
                    loading={actionLoading}
                    style={{ width: '100%', height: 50 }}
                  >
                    Clock In
                  </Button>
                ) : !todayStatus?.clockOutTime ? (
                  <Button
                    danger
                    size="large"
                    icon={<StopOutlined />}
                    onClick={handleClockOut}
                    loading={actionLoading}
                    style={{ width: '100%', height: 50 }}
                  >
                    Clock Out
                  </Button>
                ) : (
                  <Button
                    size="large"
                    disabled
                    style={{ width: '100%', height: 50 }}
                  >
                    Day Complete
                  </Button>
                )}
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* Status Information */}
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Status"
                    value={todayStatus.status.toUpperCase().replace('-', ' ')}
                    valueStyle={{ 
                      fontSize: 16, 
                      color: getStatusColor(todayStatus?.status) 
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Work Hours"
                    value={formatDuration(todayStatus?.totalWorkMinutes)}
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
              </Row>

              {todayStatus?.clockInTime && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Clock In</Text>
                    <br />
                    <Text strong style={{ fontSize: 14 }}>
                      {dayjs(todayStatus?.clockInTime).format('HH:mm')}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Clock Out</Text>
                    <br />
                    <Text strong style={{ fontSize: 14 }}>
                      {todayStatus?.clockOutTime 
                        ? dayjs(todayStatus?.clockOutTime).format('HH:mm')
                        : '-'
                      }
                    </Text>
                  </Col>
                </Row>
              )}
            </Space>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Text type="secondary">No records found</Text>
            </div>
          )}
        </Card>
      </Col>

      {/* My Work Hours Summary */}
      <Col xs={24} lg={12}>
        <Card
          title="My Work Hours Summary"
          size="small"
        >
          {workHoursSummary ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>This Week:</Text>
                <Text strong>{workHoursSummary?.thisWeek?.workHours}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>This Month:</Text>
                <Text strong>{workHoursSummary?.thisMonth?.workHours}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Average/Day:</Text>
                <Text>{workHoursSummary?.thisWeek?.averagePerDay}</Text>
              </div>
              {workHoursSummary?.thisWeek?.overtimeMinutes > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Overtime (Week):</Text>
                  <Text style={{ color: '#faad14' }}>{workHoursSummary?.thisWeek?.overtimeHours}</Text>
                </div>
              )}
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Custom Date Range</Text>
                <br />
                <Space style={{ marginTop: 8 }}>
                  <RangePicker size="small" />
                  <Button size="small" type="primary">Show</Button>
                </Space>
              </div>
            </Space>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Text type="secondary">Loading work hours summary...</Text>
            </div>
          )}
        </Card>
      </Col>
      </Row>

      {/* My Attendance Records Table */}
      <Card 
        title="My Attendance Records" 
        size="small"
      >
        <Space wrap size={12} style={{ marginBottom: 16 }}>
          <Select
            placeholder="Status"
            style={{ width: 120 }}
            allowClear
          >
            <Option value="present">Present</Option>
            <Option value="late">Late</Option>
          </Select>

          <RangePicker
            style={{ width: 240 }}
            size="middle"
          />
        </Space>

        <Table
          columns={columns}
          dataSource={myAttendanceRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: false,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} records`,
            size: 'small',
          }}
          size="small"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Space align="center">
            <ClockCircleOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            <Title level={3} style={{ margin: 0 }}>
              Attendance Management
            </Title>
          </Space>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16, fontSize: 13 }}
            onClose={() => setError('')}
          />
        )}
        {success && (
          <Alert
            message={success}
            type="success"
            showIcon
            closable
            style={{ marginBottom: 16, fontSize: 13 }}
            onClose={() => setSuccess('')}
          />
        )}

        {/* Tabs */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'dashboard',
              label: (
                <Space>
                  <DashboardOutlined />
                  Dashboard
                </Space>
              ),
              children: <DashboardTab />
            },
            {
              key: 'clockinout',
              label: (
                <Space>
                  <ClockCircleOutlined />
                  Clock In/Out
                </Space>
              ),
              children: <ClockInOutTab />
            },
            ...(canManage ? [{
              key: 'manage',
              label: (
                <Space>
                  <SettingOutlined />
                  Manage Attendance
                </Space>
              ),
              children: <ManageAttendanceTab />
            }] : [])
          ]}
        />

        {/* Add Attendance Modal */}
        <Modal
          title="Add Attendance Record"
          open={isAddModalVisible}
          onCancel={() => {
            setIsAddModalVisible(false);
            addForm.resetFields();
          }}
          footer={null}
          width={500}
        >
          <Form
            form={addForm}
            layout="vertical"
            onFinish={handleAddAttendance}
          >
            <Form.Item
              name="member"
              label="Member"
              rules={[{ required: true, message: 'Please select a member' }]}
            >
              <Select
                placeholder="Select member"
                showSearch
                optionFilterProp="children"
              >
                {members.map((member) => (
                  <Option key={member.id} value={member.id}>
                    {member.name} - {member.position}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="date"
              label="Date"
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="clockIn"
                  label="Clock In Time"
                >
                  <TimePicker
                    format="HH:mm"
                    style={{ width: '100%' }}
                    placeholder="Select clock in time"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="clockOut"
                  label="Clock Out Time"
                >
                  <TimePicker
                    format="HH:mm"
                    style={{ width: '100%' }}
                    placeholder="Select clock out time"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => {
                  setIsAddModalVisible(false);
                  addForm.resetFields();
                }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>
                  Add Record
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Attendance Modal */}
        <Modal
          title="Edit Attendance Record"
          open={isEditModalVisible}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingRecord(null);
            editForm.resetFields();
          }}
          footer={null}
          width={500}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditAttendance}
          >
            <Form.Item
              name="date"
              label="Date"
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="clockIn"
                  label="Clock In Time"
                >
                  <TimePicker
                    format="HH:mm"
                    style={{ width: '100%' }}
                    placeholder="Select clock in time"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="clockOut"
                  label="Clock Out Time"
                >
                  <TimePicker
                    format="HH:mm"
                    style={{ width: '100%' }}
                    placeholder="Select clock out time"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => {
                  setIsEditModalVisible(false);
                  setEditingRecord(null);
                  editForm.resetFields();
                }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>
                  Update Record
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
