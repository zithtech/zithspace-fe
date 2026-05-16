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
  Avatar,
  Divider,
  Form,
  Modal,
  TimePicker,
  Popconfirm,
  App,
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { AttendanceService, Attendance, AttendanceFilters } from '@/services/attendanceService';
import { MembersService, Member } from '@/services/membersService';
import { ProjectService } from '@/services/projectService';
import { usePermission } from '@/hooks/usePermission';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(localeData);
dayjs.extend(weekday);
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ExtendedAttendance extends Attendance {
  member?: {
    id: string;
    name: string;
    position: string;
    avatarUrl?: string;
  };
  effectiveWorkMinutes?: number;
}

export default function ManageAttendancePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { notification } = App.useApp();
  const router = useRouter();
  const { 
    canManageAttendance, 
    canCreateAttendance, 
    canUpdateAttendance, 
    canDeleteAttendance 
  } = usePermission();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [memberFilter, setMemberFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().startOf('day'),
    dayjs().endOf('day'),
  ]);
  const [projectFilter, setProjectFilter] = useState<string | undefined>(undefined);
  const [projects, setProjects] = useState<any[]>([]);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    if (!authLoading && !canManageAttendance) {
      router.push('/attendance/dashboard');
    }
  }, [authLoading, canManageAttendance, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filters: any = {
        page: pagination.current,
        limit: pagination.pageSize,
        status: statusFilter,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
        search: searchTerm,
        member: memberFilter,
        projectId: projectFilter,
      };

      const [attendanceRes, membersRes, projectsRes] = await Promise.all([
        AttendanceService.getAttendance(filters),
        MembersService.getMembers({ limit: 100 }),
        ProjectService.getProjectsForSelect(),
      ]);

      setAttendanceRecords(attendanceRes.data);
      setPagination(prev => ({ ...prev, total: attendanceRes.pagination.total }));
      setMembers(membersRes.data);
      setProjects(projectsRes);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      notification.error({
        message: 'Load Error',
        description: 'Failed to load attendance management data',
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && canManageAttendance) {
      fetchData();
    }
  }, [user, canManageAttendance, pagination.current, pagination.pageSize, searchTerm, statusFilter, memberFilter, dateRange, projectFilter]);

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

  const handleUpdate = async (values: any, isEdit: boolean) => {
    try {
      setActionLoading(true);

      const selectedDate = dayjs(values.date);
      const clockInTime = values.clockIn ? dayjs(values.clockIn) : null;
      const clockOutTime = values.clockOut ? dayjs(values.clockOut) : null;

      // Combine selected date with selected times to get correct ISO strings
      const formattedClockIn = clockInTime
        ? selectedDate.hour(clockInTime.hour()).minute(clockInTime.minute()).second(0).toISOString()
        : undefined;

      const formattedClockOut = clockOutTime
        ? selectedDate.hour(clockOutTime.hour()).minute(clockOutTime.minute()).second(0).toISOString()
        : undefined;

      const payload = {
        date: selectedDate.toISOString(),
        status: values.status,
        clockIn: formattedClockIn,
        clockOut: formattedClockOut,
        notes: values.notes,
        userId: values.member,
      };

      if (isEdit && editingRecord) {
        await AttendanceService.updateAttendance(editingRecord.id, payload);
        notification.success({
          message: 'Update Successful',
          description: 'Attendance record updated successfully!',
          placement: 'topRight'
        });
      } else {
        await AttendanceService.createAttendance(payload as any);
        notification.success({
          message: 'Record Created',
          description: 'Attendance record added successfully!',
          placement: 'topRight'
        });
      }

      isEdit ? setIsEditModalVisible(false) : setIsAddModalVisible(false);
      addForm.resetFields();
      editForm.resetFields();
      fetchData();
    } catch (err: any) {
      console.error('Update failed:', err);
      notification.error({
        message: 'Action Failed',
        description: err?.message || `Failed to ${isEdit ? 'update' : 'add'} record`,
        placement: 'topRight'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true);
      await AttendanceService.deleteAttendance(id);
      notification.success({
        message: 'Record Deleted',
        description: 'Attendance record deleted successfully!',
        placement: 'topRight'
      });
      fetchData();
    } catch (err: any) {
      console.error('Delete failed:', err);
      notification.error({
        message: 'Delete Failed',
        description: err?.message || 'Failed to delete record',
        placement: 'topRight'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const columns: ColumnsType<ExtendedAttendance> = [
    {
      title: 'Member',
      key: 'member',
      width: 250,
      render: (_, record) => {
        const member: any = record.member;
        return (
          <Space>
            <Avatar
              size={40}
              src={record.member?.avatarUrl}
              style={{ backgroundColor: '#1677ff', borderRadius: '10px' }}
            >
              {record.member?.name?.charAt(0)}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: '15px' }}>{member?.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>{member?.position?.title || 'Team Member'}</Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => <Text style={{ fontSize: '14px' }}>{dayjs(date).format('MMM DD, YYYY')}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} style={{ borderRadius: '6px', border: 'none', fontWeight: 600 }}>
          {status.toUpperCase().replace('-', ' ')}
        </Tag>
      ),
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
      render: (_, record) => record.effectiveWorkMinutes ? formatDuration(record.effectiveWorkMinutes) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          {canUpdateAttendance && (
            <Button
              type="text"
              icon={<EditOutlined />}
              style={{ color: '#1677ff' }}
              onClick={() => {
                setEditingRecord(record);
                editForm.setFieldsValue({
                  date: dayjs(record.date),
                  clockIn: record.clockIn ? dayjs(record.clockIn) : null,
                  clockOut: record.clockOut ? dayjs(record.clockOut) : null,
                  status: record.status,
                });
                setIsEditModalVisible(true);
              }}
            />
          )}
          {canDeleteAttendance && (
            <Popconfirm title="Delete record?" onConfirm={() => handleDelete(record.id)}>
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
          {!canUpdateAttendance && !canDeleteAttendance && <Text type="secondary">-</Text>}
        </Space>
      ),
    },
  ];

  if (authLoading || !canManageAttendance) return null;

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
              <TeamOutlined style={{ fontSize: 24, color: 'var(--premium-blue)' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--text-slate-900)' }}>Manage Attendance</Title>
              <Text style={{ color: 'var(--text-slate-500)' }}>Review and manage member attendance records</Text>
            </div>
          </Space>

          {canCreateAttendance && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
              style={{ height: '40px', borderRadius: '8px', fontWeight: 600, background: 'var(--premium-blue)', boxShadow: '0 4px 12px rgba(22, 119, 255, 0.2)' }}
            >
              Add Record
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        <Card
          style={{ marginBottom: '24px', borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', background: 'var(--bg-pure-white)' }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} lg={6}>
              <Input
                placeholder="Search by name..."
                prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: '8px', background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-900)' }}
                allowClear
              />
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Select
                placeholder="Status"
                style={{ width: '100%' }}
                dropdownStyle={{ borderRadius: '8px' }}
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
              >
                <Option value="present">Present</Option>
                <Option value="late">Late</Option>
                <Option value="absent">Absent</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Select
                placeholder="Project"
                style={{ width: '100%' }}
                dropdownStyle={{ borderRadius: '8px' }}
                value={projectFilter}
                onChange={setProjectFilter}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {projects.map(p => (
                  <Option key={p.value} value={p.value}>{p.label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} lg={4}>
              {/* <Select
                placeholder="Team Member"
                style={{ width: '100%' }}
                value={memberFilter}
                onChange={setMemberFilter}
                showSearch
                optionFilterProp="children"
                allowClear
              >
                {members.map(m => <Option key={m.id} value={m.id}>{m.name}</Option>)}
              </Select> */}

              <Select
                placeholder="Team Member"
                style={{ width: '100%' }}
                value={memberFilter}
                onChange={setMemberFilter}
                showSearch
                optionFilterProp="children"
                allowClear
                filterOption={(input, option) =>
                  String(option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                }
              >
                {members.map(m => (
                  <Option key={m.id} value={m.id}>
                    {m.name || ""}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} lg={6}>
              <RangePicker
                style={{ width: '100%', borderRadius: '8px' }}
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([
                      dates[0].startOf('day'),
                      dates[1].endOf('day'),
                    ]);
                  } else {
                    setDateRange(null);
                  }
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* Records Table */}
        <Card
          style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', background: 'var(--bg-pure-white)' }}
          bodyStyle={{ padding: '0' }}
        >
          <Table
            columns={columns}
            dataSource={attendanceRecords}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              size: 'default',
              style: { padding: '16px 24px' }
            }}
            onChange={(newPagination) => {
              setPagination({
                ...pagination,
                current: newPagination.current || 1,
                pageSize: newPagination.pageSize || 10,
              });
            }}
            size="middle"
            scroll={{ x: 900 }}
          />
        </Card>

        <Modal
          title={
            <div style={{ paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--bg-blue-50)', padding: '10px', borderRadius: '10px' }}>
                  <PlusOutlined style={{ color: 'var(--premium-blue)', fontSize: '18px' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-slate-900)' }}>Add Attendance Record</div>
                  <div style={{ fontWeight: 400, fontSize: '12px', color: 'var(--text-slate-400)' }}>Create a manual entry for a team member</div>
                </div>
              </div>
            </div>
          }
          open={isAddModalVisible}
          onCancel={() => setIsAddModalVisible(false)}
          footer={null}
          width={520}
          centered
          className="premium-modal themed-modal"
        >
          <Divider style={{ margin: '0 0 24px 0', opacity: 0.6, borderColor: 'var(--border-slate-100)' }} />
          <Form
            form={addForm}
            layout="vertical"
            onFinish={(v) => handleUpdate(v, false)}
            initialValues={{ date: dayjs(), status: 'present' }}
          >
            <Form.Item
              name="member"
              label={<span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Team Member</span>}
              rules={[{ required: true, message: 'Please select a member' }]}
            >
              <Select
                placeholder="Search and select member"
                showSearch
                optionFilterProp="label"
                style={{ height: '42px' }}
                dropdownStyle={{ borderRadius: '10px' }}
                filterOption={(input, option) =>
                  String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              >
                {members.map(member => (
                  <Option
                    key={member.id}
                    value={member.id}
                    label={member.name || ""}
                  >
                    <Space>
                      <Avatar
                        size="small"
                        src={member?.avatarUrl}
                        style={{ backgroundColor: '#1677ff' }}
                      >
                        {member.name?.charAt(0)}
                      </Avatar>
                      <Text>{member.name}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        • {member.position?.title || 'Team Member'}
                      </Text>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={14}>
                <Form.Item
                  name="date"
                  label={<span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Date</span>}
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: '100%', height: '40px', borderRadius: '8px', background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-900)' }} />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  name="status"
                  label={<span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Status</span>}
                  rules={[{ required: true }]}
                >
                  <Select style={{ height: '40px', borderRadius: '8px' }} dropdownStyle={{ background: 'var(--bg-pure-white)' }}>
                    <Option value="present"><Tag color="success" bordered={false}>Present</Tag></Option>
                    <Option value="late"><Tag color="warning" bordered={false}>Late</Tag></Option>
                    <Option value="absent"><Tag color="error" bordered={false}>Absent</Tag></Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div style={{ background: 'var(--bg-slate-50)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <Text style={{ fontSize: '12px', display: 'block', marginBottom: '12px', fontWeight: 500, color: 'var(--text-slate-400)' }}>
                <ClockCircleOutlined /> TIME LOGS (OPTIONAL)
              </Text>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clockIn" label="Clock In" style={{ marginBottom: 0 }}>
                    <TimePicker format="HH:mm" popupClassName="my-timepicker-popup"
                      style={{ width: '100%', height: '36px', borderRadius: '6px' }} placeholder="09:00" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clockOut" label="Clock Out" style={{ marginBottom: 0 }}>
                    <TimePicker format="HH:mm" popupClassName="my-timepicker-popup"
                      style={{ width: '100%', height: '36px', borderRadius: '6px' }} placeholder="18:00" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: '24px 0 20px 0', borderColor: 'var(--border-slate-100)' }} />

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space size="middle">
                <Button
                  onClick={() => setIsAddModalVisible(false)}
                  style={{ borderRadius: '8px', height: '40px', padding: '0 20px' }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={actionLoading}
                  style={{
                    borderRadius: '8px',
                    height: '40px',
                    padding: '0 32px',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(22, 119, 255, 0.2)'
                  }}
                >
                  Create Record
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={
            <div style={{ paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--bg-green-50)', padding: '10px', borderRadius: '10px' }}>
                  <EditOutlined style={{ color: 'var(--text-holiday)', fontSize: '18px' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-slate-900)' }}>Edit Attendance Record</div>
                  <div style={{ fontWeight: 400, fontSize: '12px', color: 'var(--text-slate-400)' }}>Modify existing attendance details</div>
                </div>
              </div>
            </div>
          }
          open={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          footer={null}
          width={520}
          centered
          className="themed-modal"
        >          <Divider style={{ margin: '0 0 24px 0', opacity: 0.6, borderColor: 'var(--border-slate-100)' }} />
          <Form
            form={editForm}
            layout="vertical"
            onFinish={(v) => handleUpdate(v, true)}
            style={{ marginTop: '16px' }}
          >
            <Row gutter={16}>
              <Col span={14}>
                <Form.Item
                  name="date"
                  label={<span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Date</span>}
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: '100%', height: '40px', borderRadius: '8px', background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-900)' }} />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  name="status"
                  label={<span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Status</span>}
                  rules={[{ required: true }]}
                >
                  <Select style={{ height: '40px', borderRadius: '8px' }} dropdownStyle={{ background: 'var(--bg-pure-white)' }}>
                    <Option value="present"><Tag color="success" bordered={false}>Present</Tag></Option>
                    <Option value="late"><Tag color="warning" bordered={false}>Late</Tag></Option>
                    <Option value="absent"><Tag color="error" bordered={false}>Absent</Tag></Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div style={{ background: 'var(--bg-slate-50)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <Text style={{ fontSize: '12px', display: 'block', marginBottom: '12px', fontWeight: 500, color: 'var(--text-slate-400)' }}>
                <ClockCircleOutlined /> TIME LOGS
              </Text>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clockIn" label="Clock In" style={{ marginBottom: 0 }}>
                    <TimePicker format="HH:mm" onChange={(time) => {
                      console.log(time); // immediate value
                    }} style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clockOut" label="Clock Out" style={{ marginBottom: 0 }}>
                    <TimePicker format="HH:mm" needConfirm={false} onChange={(time) => {
                      console.log(time); // immediate value
                    }} style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider style={{ margin: '24px 0 20px 0', borderColor: 'var(--border-slate-100)' }} />

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>

              <Space size="middle">
                <Button
                  onClick={() => setIsEditModalVisible(false)}
                  style={{ borderRadius: '8px', height: '40px', padding: '0 20px' }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={actionLoading}
                  style={{
                    borderRadius: '8px',
                    height: '40px',
                    padding: '0 32px',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(22, 119, 255, 0.2)'
                  }}
                >
                  Update Record
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
        <style jsx global>{`
          .themed-modal .ant-modal-content {
            background-color: var(--bg-pure-white) !important;
          }
          .themed-modal .ant-form-item-label label {
            color: var(--text-slate-900) !important;
          }
          .ant-table-thead > tr > th {
            background-color: var(--bg-slate-50) !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
            color: var(--text-slate-900) !important;
          }
          .ant-table-tbody > tr > td {
            border-bottom: 1px solid var(--border-slate-100) !important;
            color: var(--text-slate-900) !important;
          }
          .ant-table-pagination.ant-pagination {
            border-top: 1px solid var(--border-slate-100) !important;
          }
            .my-timepicker-popup .ant-picker-footer {
  display: none !important;
}
        `}</style>
      </div>
    </MainLayout>
  );
}
