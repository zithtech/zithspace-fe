'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import {
  Card,
  Typography,
  Button,
  Table,
  Space,
  Drawer,
  Form,
  Select,
  DatePicker,
  Input,
  Switch,
  Divider,
  Tag,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  notification,
} from 'antd';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  ClipboardList,
  TrendingDown,
  LogOut,
  FileText
} from "lucide-react";

// Components
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';

// Services
import { EmployeeService } from '@/services/employeeServices';
import { ExitTypeService, ExitType } from '@/services/exitTypeService';
import { ReasonForExitService, ReasonForExit } from '@/services/reasonForExitService';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';
import { PositionService, Position } from '@/services/positionService';
import { DepartmentService } from '@/services/departmentService';

const { Title, Text } = Typography;
const { TextArea } = Input;

// --- Components ---

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card
    styles={{ body: { padding: "16px 20px" } }}
    style={{
      borderRadius: 12,
      border: "1px solid var(--border-slate-100)",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      background: "var(--bg-pure-white)"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "var(--text-slate-500)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 4 }}>{value}</div>
      </div>
      <div style={{
        color: color,
        background: `${color}15`,
        padding: 10,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

// --- Page Component ---

export default function EmployeeExitManagementPage() {
  const router = useRouter();
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [form] = Form.useForm();

  // State
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [buyoutEnabled, setBuyoutEnabled] = useState(false);

  // Master Data
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [exitTypes, setExitTypes] = useState<ExitType[]>([]);
  const [reasons, setReasons] = useState<ReasonForExit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        EmployeeExitService.getExitRequests(),
        EmployeeService.getEmployeesForSelect(),
        ExitTypeService.getAll(),
        ReasonForExitService.getAll(),
        PositionService.getAll(),
        DepartmentService.getAll(),
      ]);

      if (results[0].status === 'fulfilled') setRequests(results[0].value);
      if (results[1].status === 'fulfilled') {
        const rawEmployees = Array.isArray(results[1].value) ? results[1].value : [];
        const formatted = rawEmployees.map((emp: any) => ({
          ...emp,
          // Use employeeId as the selection value to prevent mismatch with backend
          value: emp.employeeId || emp.value,
          label: emp.label
        }));
        setEmployees(formatted);
      }
      if (results[2].status === 'fulfilled') setExitTypes(results[2].value);
      if (results[3].status === 'fulfilled') setReasons(results[3].value);
      if (results[4].status === 'fulfilled') setPositions(results[4].value);
      if (results[5].status === 'fulfilled') setDepartments(results[5].value);

      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        notificationApi.warning({
          message: 'Partial Data Load',
          description: `${failedCount} data requests failed to load. Check console for details.`
        });
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      notificationApi.error({ message: 'Error', description: 'Failed to load management data' });
    } finally {
      setLoading(false);
    }
  }, [notificationApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!searchText) {
      setFilteredRequests(requests);
    } else {
      const filtered = requests.filter(r =>
        `${r.employee?.first_name} ${r.employee?.last_name}`.toLowerCase().includes(searchText.toLowerCase()) ||
        r.employee?.employee_code?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredRequests(filtered);
    }
  }, [searchText, requests]);

  // Handlers
  const handleCreateNew = () => {
    setViewMode(false);
    form.resetFields();
    setBuyoutEnabled(false);
    setDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await EmployeeExitService.deleteExitRequest(id);
      notificationApi.success({ message: 'Success', description: 'Exit request deleted' });
      fetchData();
    } catch (error) {
      notificationApi.error({ message: 'Error', description: 'Failed to delete request' });
    }
  };

  const [detailsLoading, setDetailsLoading] = useState(false);

  const handleEmployeeChange = async (employeeId: string) => {
    try {
      setDetailsLoading(true);
      console.log('Fetching details for employee:', employeeId);
      console.log('Fetching details for employee selection (Value):', employeeId);
      const data = await EmployeeService.getWorkDetailByEmployee(employeeId);
      console.log('Employee work details received:', data);

      if (data) {
        const posId = data.position?.id || data.positionId || null;
        const posTitle = data.position?.title || (positions.find(p => p.id === posId)?.title) || null;

        const deptId = data.department?.id ||
          data.departmentId ||
          data.position?.departmentId ||
          data.position?.department?.id ||
          null;
        const deptName = data.department?.name ||
          (departments.find(d => d.id === deptId)?.name) ||
          data.position?.department?.name ||
          null;

        const managerId = data.reportingManagerId;
        const managerName = data.reportingManagerName;

        console.log('Mapping results:', { posId, posTitle, deptId, deptName, managerId, managerName });

        const formValues: any = {};

        if (posId) {
          formValues.positionId = { value: posId, label: posTitle || posId };
        }

        if (deptId) {
          formValues.departmentId = { value: deptId, label: deptName || deptId };
        }

        if (managerId) {
          formValues.reportingManagerId = {
            value: managerId,
            label: managerName || managerId
          };
        } else if (managerName) {
          formValues.reportingManagerId = {
            value: managerName,
            label: managerName
          };
        }

        form.setFieldsValue(formValues);

        // Notice period handling
        const noticeDays = data.noticePeriodDays || data.noticePeriod || 0;
        if (noticeDays > 0) {
          form.setFieldsValue({ noticePeriodDays: noticeDays });
          const resignationDate = form.getFieldValue('resignationDate');
          if (resignationDate) {
            const noticeDate = dayjs(resignationDate).add(noticeDays, 'day');
            form.setFieldsValue({ noticePeriodDay: noticeDate });
          }
        }
      } else {
        console.warn('No work details found for this employee');
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      notificationApi.warning({
        message: 'Autofill Partial',
        description: 'Could not fetch all employee work details. Please fill manually.'
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const calculateNoticeDate = (resignationDate: any, days: number) => {
    if (resignationDate && days) {
      const noticeDate = dayjs(resignationDate).add(days || 0, 'day');
      form.setFieldsValue({ noticePeriodDay: noticeDate });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        ...values,
        resignationDate: values.resignationDate?.toISOString(),
        proposedLastWorkingDay: values.proposedLastWorkingDay?.toISOString(),
        noticePeriodDay: values.noticePeriodDay?.toISOString(),
        buyoutAmount: values.buyoutAmount ? Number(values.buyoutAmount) : null,
        positionId: (values.positionId?.value || values.positionId) || null,
        departmentId: (values.departmentId?.value || values.departmentId) || null,
        reportingManagerId: (values.reportingManagerId?.value || values.reportingManagerId) || null,
        explanation: values.explanation || null,
      };

      console.log('Final payload before submission:', payload);
      await EmployeeExitService.createExitRequest(payload);
      notificationApi.success({ message: 'Success', description: 'Exit request submitted successfully' });
      setDrawerVisible(false);
      fetchData();
    } catch (error: any) {
      console.error('Error submitting exit request:', error);
      notificationApi.error({
        message: 'Submission Failed',
        description: error.message || 'Please check all required fields.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Table Columns
  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      width: '25%',
      render: (_: any, record: EmployeeExitRequest) => (
        <Space size={12}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'var(--bg-blue-50)',
            color: 'var(--premium-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: 14,
            border: '1px solid var(--border-slate-100)'
          }}>
            {record.employee?.first_name?.[0].toUpperCase()}{record.employee?.last_name?.[0].toUpperCase()}
          </div>
          <div>
            <Text strong style={{ display: 'block', color: 'var(--text-slate-900)', fontSize: 14 }}>
              {`${record.employee?.first_name} ${record.employee?.last_name}`}
            </Text>
            <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>{record.employee?.employee_code}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'departmentId',
      key: 'department',
      render: (id: string) => (
        <Tag color="default" style={{ borderRadius: 6, border: "1px solid var(--border-slate-100)", background: "var(--bg-slate-50)", color: "var(--text-slate-500)" }}>
          {departments.find(d => d.id === id)?.name || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Exit Type',
      dataIndex: 'exitTypeId',
      key: 'exitType',
      render: (id: string) => {
        const type = exitTypes.find(t => t.id === id);
        return <Tag color="blue" style={{ borderRadius: 6, fontWeight: 500 }}>{type?.name || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Proposed LWD',
      dataIndex: 'proposedLastWorkingDay',
      key: 'lwd',
      render: (date: string) => (
        <Space size={8}>
          <Calendar size={14} style={{ color: "var(--text-slate-500)" }} />
          <Text style={{ fontSize: 13, color: "var(--text-slate-900)" }}>{dayjs(date).format('MMM DD, YYYY')}</Text>
        </Space>
      ),
    },
    {
      title: 'Notice Status',
      key: 'notice',
      render: (_: any, record: EmployeeExitRequest) => {
        const lwd = dayjs(record.proposedLastWorkingDay);
        const today = dayjs().startOf('day');
        const remaining = lwd.diff(today, 'day');
        const isPast = remaining < 0;

        return (
          <Tag
            color={isPast ? "success" : (remaining <= 7 ? "warning" : "processing")}
            icon={isPast ? <CheckCircle2 size={12} style={{ marginRight: 4 }} /> : <Clock size={12} style={{ marginRight: 4 }} />}
            style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}
          >
            {isPast ? 'COMPLETED' : `${remaining} DAYS`}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: EmployeeExitRequest) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<Eye size={18} style={{ color: "var(--text-slate-500)" }} />}
              onClick={() => router.push(`/employee-exit/management/${record.id}`)}
              className="action-btn"
            />
          </Tooltip>
          <Tooltip title="Delete Request">
            <Popconfirm
              title="Delete this exit request?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<Trash2 size={18} />} className="action-btn-danger" />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Stats
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const activeNotice = requests.filter(r => r.status === 'APPROVED').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ margin: "0 -24px", padding: "24px 32px", background: "var(--bg-secondary)", minHeight: "calc(100vh - 64px)" }}>
          {notificationContextHolder}

          {/* Header */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Space size={12} align="center">
                <div style={{ background: "var(--bg-blue-50)", padding: 10, borderRadius: 12, color: "var(--premium-blue)", display: "flex" }}>
                  <ClipboardList size={24} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Exit Management</Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 15 }}>Monitor and process employee exit requests and notice periods.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Input
                placeholder="Search employees..."
                prefix={<Search size={16} style={{ color: "var(--text-slate-400)" }} />}
                style={{ width: 280, borderRadius: 10, height: 44, background: "var(--bg-pure-white)", border: "1px solid var(--border-slate-200)", color: "var(--text-slate-900)" }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                size="large"
                icon={<Plus size={18} />}
                style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center", background: "var(--premium-blue)" }}
                onClick={handleCreateNew}
              >
                New Exit Request
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={6}>
              <StatCard label="Total Requests" value={totalRequests} icon={Users} color="#3b82f6" />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard label="Pending Approval" value={pendingRequests} icon={Clock} color="#f59e0b" />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard label="Active Notice" value={activeNotice} icon={TrendingDown} color="#8b5cf6" />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard label="Completed" value={completedCount} icon={CheckCircle2} color="#10b981" />
            </Col>
          </Row>

          {/* Content Table */}
          <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", overflow: "hidden", background: "var(--bg-pure-white)", boxShadow: "var(--shadow-premium-sm)" }}>
            <Table
              columns={columns}
              dataSource={filteredRequests}
              loading={loading}
              size="middle"
              rowKey="id"
              pagination={{ pageSize: 12, position: ["bottomRight"] }}
            />
          </Card>
        </div>

        {/* Create Request Drawer */}
        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                background: "var(--bg-blue-50)",
                padding: 10,
                borderRadius: 12,
                color: "var(--premium-blue)",
                display: "flex",
                boxShadow: "0 0 0 1px var(--border-slate-100)"
              }}>
                {viewMode ? <Eye size={20} /> : <Plus size={20} />}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)", lineHeight: 1.2 }}>
                  {viewMode ? "Exit Details" : "New Exit Request"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-slate-500)", marginTop: 2 }}>
                  {viewMode ? "Review employee exit information" : "Initiate a new employee exit process"}
                </div>
              </div>
            </div>
          }
          width={640}
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          className="exit-drawer"
          styles={{ body: { padding: "0 0 24px 0" } }}
          footer={!viewMode && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "16px 24px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-slate-100)" }}>
              <Button
                onClick={() => setDrawerVisible(false)}
                style={{ borderRadius: 8, height: 40, padding: "0 20px" }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleSubmit}
                style={{ borderRadius: 8, height: 40, padding: "0 24px", fontWeight: 600, background: "var(--premium-blue)" }}
              >
                Submit Exit Request
              </Button>
            </div>
          )}
        >
          <Form
            form={form}
            layout="vertical"
            disabled={viewMode}
            requiredMark={false}
            style={{ padding: "0", background: "var(--bg-pure-white)" }}
          >
            {/* Section: Employee */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-slate-100)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 4, height: 16, background: "var(--premium-blue)", borderRadius: 2 }} />
                <Text strong style={{ fontSize: 15, color: "var(--text-slate-900)", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                  Employee Information
                </Text>
              </div>

              <Form.Item
                name="employeeId"
                label={<Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 500 }}>Select Employee</Text>}
                rules={[{ required: true, message: 'Please select an employee' }]}
              >
                <Select
                  showSearch
                  placeholder="Search by name or code..."
                  options={employees}
                  onChange={handleEmployeeChange}
                  style={{ height: 44, borderRadius: 8 }}
                  dropdownStyle={{ borderRadius: 12 }}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>

              <Row gutter={20}>
                <Col span={12}>
                  <Form.Item name="positionId" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Current Position</Text>}>
                    <Select disabled loading={detailsLoading} labelInValue placeholder="Auto-filled" options={positions.map(p => ({ value: p.id, label: p.title }))} style={{ height: 44 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="departmentId" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Department</Text>}>
                    <Select disabled loading={detailsLoading} labelInValue placeholder="Auto-filled" options={departments.map(d => ({ value: d.id, label: d.name }))} style={{ height: 44 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="reportingManagerId" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Reporting Manager</Text>}>
                <Select disabled loading={detailsLoading} placeholder="Auto-filled" labelInValue options={employees} style={{ height: 44 }} />
              </Form.Item>
            </div>

            {/* Section: Timeline */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border-slate-100)", background: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 4, height: 16, background: "var(--premium-blue)", borderRadius: 2 }} />
                <Text strong style={{ fontSize: 15, color: "var(--text-slate-900)", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                  Exit Timeline
                </Text>
              </div>

              <Form.Item
                name="exitTypeId"
                label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Exit Category</Text>}
                rules={[{ required: true, message: 'Please select exit type' }]}
              >
                <Select placeholder="Select exit type" options={exitTypes.map(t => ({ value: t.id, label: t.name }))} style={{ height: 44 }} />
              </Form.Item>

              <Row gutter={20}>
                <Col span={12}>
                  <Form.Item
                    name="resignationDate"
                    label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Resignation Date</Text>}
                    rules={[{ required: true }]}
                  >
                    <DatePicker
                      style={{ width: '100%', height: 44 }}
                      placeholder="Select date"
                      onChange={(val) => calculateNoticeDate(val as dayjs.Dayjs, form.getFieldValue('noticePeriodDays'))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="proposedLastWorkingDay"
                    label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Proposed Last Working Day</Text>}
                    rules={[{ required: true }]}
                  >
                    <DatePicker style={{ width: '100%', height: 44 }} placeholder="Select date" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={20}>
                <Col span={12}>
                  <Form.Item name="noticePeriodDays" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Notice Period (Days)</Text>}>
                    <Input readOnly placeholder="0" style={{ height: 44, background: "#f8fafc", border: "1px dashed #e2e8f0" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="noticePeriodDay" label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Calculated Notice End Date</Text>}>
                    <DatePicker disabled style={{ width: '100%', height: 44, background: "#f8fafc", border: "1px dashed #e2e8f0" }} placeholder="Calculated" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Section: Details */}
            <div style={{ padding: "24px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 4, height: 16, background: "var(--premium-blue)", borderRadius: 2 }} />
                <Text strong style={{ fontSize: 15, color: "var(--text-slate-900)", textTransform: "uppercase", letterSpacing: "0.025em" }}>
                  Additional Details
                </Text>
              </div>

              <Form.Item
                name="exitReasonId"
                label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Reason for Exit</Text>}
                rules={[{ required: true, message: 'Please select a reason' }]}
              >
                <Select placeholder="Select reason" options={reasons.map(r => ({ value: r.id, label: r.name }))} style={{ height: 44 }} />
              </Form.Item>

              <Form.Item
                name="explanation"
                label={<Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Remarks & Explanation</Text>}
              >
                <TextArea rows={4} style={{ borderRadius: 8, padding: "12px" }} placeholder="Provide detailed explanation..." />
              </Form.Item>

              <div style={{ background: "var(--bg-secondary)", padding: "20px 24px", borderRadius: 12, border: "1px solid var(--border-slate-100)", marginTop: 8 }}>
                <Title level={5} style={{ marginBottom: 20, fontSize: 14, color: "var(--text-slate-500)", fontWeight: 600 }}>Policy Overrides</Title>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Form.Item name="waiveNoticePeriod" valuePropName="checked" noStyle>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <Text strong style={{ display: "block", color: "var(--text-slate-900)" }}>Waive Notice Period</Text>
                        <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Skip the required notice period for this employee</Text>
                      </div>
                      <Switch />
                    </div>
                  </Form.Item>

                  <Divider style={{ margin: "4px 0" }} />

                  <Form.Item name="buyoutRequired" valuePropName="checked" noStyle>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <Text strong style={{ display: "block", color: "var(--text-slate-900)" }}>Notice Buyout</Text>
                        <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Allow employee to pay for unserved notice period</Text>
                      </div>
                      <Switch onChange={setBuyoutEnabled} />
                    </div>
                  </Form.Item>

                  {buyoutEnabled && (
                    <div style={{ marginTop: 8 }}>
                      <Form.Item name="buyoutAmount" label={<Text style={{ fontSize: 12, color: "#64748b" }}>Buyout Amount</Text>}>
                        <Input type="number" prefix={<span style={{ color: "#94a3b8" }}>$</span>} placeholder="0.00" style={{ height: 44 }} />
                      </Form.Item>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Form>
        </Drawer>

        <style dangerouslySetInnerHTML={{
          __html: `
          .action-btn:hover { background: var(--bg-secondary) !important; color: var(--premium-blue) !important; }
          .ant-table-thead > tr > th { 
            background: var(--bg-secondary) !important; color: var(--text-slate-500) !important; 
            font-weight: 600 !important; text-transform: uppercase !important; 
            font-size: 11px !important; letter-spacing: 0.05em !important; 
          }
          .ant-table-row:hover > td { background: var(--bg-secondary) !important; }
          .ant-input:focus, .ant-select-focused .ant-select-selector { 
            border-color: var(--premium-blue) !important; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important; 
          }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
