'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
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
  Upload,
  message,
  notification,
  Tag,
  Popconfirm,
  Row,
  Col,
  ConfigProvider,
} from 'antd';
import { PlusOutlined, InboxOutlined, ClockCircleOutlined, EyeOutlined, DeleteOutlined, UserOutlined, FileTextOutlined, SearchOutlined, CheckCircleOutlined, CalendarOutlined, CarryOutOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { EmployeeService } from '@/services/employeeServices';
import { ExitTypeService, ExitType } from '@/services/exitTypeService';
import { ReasonForExitService, ReasonForExit } from '@/services/reasonForExitService';
import { NoticePolicyService, NoticePolicy } from '@/services/noticePolicyService';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';
import { PositionService, Position } from '@/services/positionService';
import { DepartmentService } from '@/services/departmentService';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;
const { Search } = Input;

export default function EmployeeExitManagementPage() {
  const router = useRouter();
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [form] = Form.useForm();
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EmployeeExitRequest | null>(null);
  const [searchText, setSearchText] = useState('');

  // Data for Selects
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [exitTypes, setExitTypes] = useState<ExitType[]>([]);
  const [reasons, setReasons] = useState<ReasonForExit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [noticePolicies, setNoticePolicies] = useState<NoticePolicy[]>([]);

  const [buyoutEnabled, setBuyoutEnabled] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    console.log('🔄 Fetching all management data...');
    try {
      // Use Promise.allSettled to ensure one failure doesn't block everything
      const results = await Promise.allSettled([
        EmployeeExitService.getExitRequests(),
        EmployeeService.getEmployeesForSelect(),
        ExitTypeService.getAll(),
        ReasonForExitService.getAll(),
        PositionService.getAll(),
        DepartmentService.getAll(),
        NoticePolicyService.getAll(),
      ]);

      console.log('📊 Fetch results:', results.map((r, i) => ({
        index: i,
        status: r.status,
        hasData: r.status === 'fulfilled' ? !!r.value : false
      })));

      // Process results
      if (results[0].status === 'fulfilled') setRequests(results[0].value);
      else console.error('Failed to fetch exit requests:', results[0].reason);

      if (results[1].status === 'fulfilled') {
        const data = results[1].value;
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      } else console.error('Failed to fetch employees:', results[1].reason);

      if (results[2].status === 'fulfilled') setExitTypes(results[2].value);
      else console.error('Failed to fetch exit types:', results[2].reason);

      if (results[3].status === 'fulfilled') setReasons(results[3].value);
      else console.error('Failed to fetch reasons:', results[3].reason);

      if (results[4].status === 'fulfilled') setPositions(results[4].value);
      else console.error('Failed to fetch positions:', results[4].reason);

      if (results[5].status === 'fulfilled') setDepartments(results[5].value);
      else console.error('Failed to fetch departments:', results[5].reason);

      if (results[6].status === 'fulfilled') setNoticePolicies(results[6].value);
      else console.error('Failed to fetch notice policies:', results[6].reason);

      // If any critical data failed, inform user
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        notificationApi.warning({
          message: 'Warning',
          description: `Some data could not be loaded (${failedCount} requests failed). Please check the console.`
        });
      }

    } catch (error) {
      console.error('General error in fetchData:', error);
      notificationApi.error({
        message: 'Error',
        description: 'An unexpected error occurred while loading data'
      });
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleCreateNew = () => {
    setViewMode(false);
    setSelectedRequest(null);
    form.resetFields();
    setBuyoutEnabled(false);
    setDrawerVisible(true);
  };

  const handleView = async (id: string) => {
    try {
      const request = await EmployeeExitService.getExitRequestById(id);
      setSelectedRequest(request);
      setViewMode(true);
      setDrawerVisible(true);

      // Map dates for dayjs
      const formData = {
        ...request,
        reportingManagerId: request.reportingManagerId ? { value: request.reportingManagerId, label: request.reportingManagerName || request.reportingManagerId } : '',
        resignationDate: dayjs(request.resignationDate),
        proposedLastWorkingDay: dayjs(request.proposedLastWorkingDay),
        noticePeriodDay: dayjs(request.noticePeriodDay),
      };
      form.setFieldsValue(formData);
      setBuyoutEnabled(request.buyoutRequired);
    } catch (error) {
      notificationApi.error({
        message: 'Error',
        description: 'Failed to fetch request details'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await EmployeeExitService.deleteExitRequest(id);
      notificationApi.success({
        message: 'Success',
        description: 'Exit request deleted successfully'
      });
      fetchData();
    } catch (error) {
      notificationApi.error({
        message: 'Error',
        description: 'Failed to delete request'
      });
    }
  };

  const handleEmployeeChange = async (employeeId: string) => {
    try {
      const data = await EmployeeService.getWorkDetailByEmployee(employeeId);
      if (data) {
        form.setFieldsValue({
          positionId: data.positionId,
          departmentId: data.department?.id || data.position?.departmentId,
          reportingManagerId: data.reportingManagerId ? { value: data.reportingManagerId, label: data.reportingManagerName || data.reportingManagerId } : '',

          noticePeriodDays: data.noticePeriodDays || 0,
        });

        // Trigger calculating notice period date if resignation date exists
        calculateNoticeDate(form.getFieldValue('resignationDate'), data.noticePeriodDays);
      }
    } catch (error) {
      console.error('Error fetching work details:', error);
    }
  };

  const calculateNoticeDate = (resignationDate: any, days: number) => {
    if (resignationDate) {
      const noticeDate = dayjs(resignationDate).add(days || 0, 'day');
      form.setFieldsValue({ noticePeriodDay: noticeDate });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!values.resignationDate || !values.proposedLastWorkingDay || !values.noticePeriodDay) {
        notificationApi.error({
          message: 'Validation Error',
          description: 'Please ensure all dates are selected'
        });
        return;
      }

      const payload = {
        ...values,
        resignationDate: values.resignationDate.toISOString(),
        proposedLastWorkingDay: values.proposedLastWorkingDay.toISOString(),
        noticePeriodDay: values.noticePeriodDay.toISOString(),
        buyoutAmount: values.buyoutAmount ? Number(values.buyoutAmount) : null,
        // Ensure missing optional values are sent as null or excluded
        positionId: values.positionId || null,
        departmentId: values.departmentId || null,
        reportingManagerId: (values.reportingManagerId?.value || values.reportingManagerId) || null,
        explanation: values.explanation || null,
      };

      setLoading(true);
      await EmployeeExitService.createExitRequest(payload);
      notificationApi.success({
        message: 'Success',
        description: 'Exit request submitted successfully'
      });
      setDrawerVisible(false);
      fetchData();
    } catch (error: any) {
      console.error('Validation/Submission error:', error);
      // Check if it's a validation error from Ant Design
      if (error?.errorFields) {
        notificationApi.error({
          message: 'Validation Error',
          description: 'Please fill in all required fields correctly.'
        });
      } else {
        notificationApi.error({
          message: 'Error',
          description: error.message || 'Failed to submit exit request. Please check all fields.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: EmployeeExitRequest) => (
        <Space direction="vertical" size={0}>
          <Text strong>{`${record.employee?.first_name} ${record.employee?.last_name}`}</Text>
          <Text type="secondary" style={{ fontSize: "small" }}>{record.employee?.employee_code}</Text>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'departmentId',
      key: 'department',
      render: (id: string) => departments.find(d => d.id === id)?.name || 'N/A',
    },
    {
      title: 'Exit Type',
      dataIndex: 'exitTypeId',
      key: 'exitType',
      render: (id: string) => {
        const type = exitTypes.find(t => t.id === id);
        return type ? <Tag color="blue">{type.name}</Tag> : 'N/A';
      },
    },
    {
      title: 'Last Working Day',
      dataIndex: 'proposedLastWorkingDay',
      key: 'lwd',
      render: (date: string) => dayjs(date).format('DD/MM/YY'),
    },
    {
      title: 'Notice',
      key: 'notice',
      render: (_: any, record: EmployeeExitRequest) => {
        const lwd = dayjs(record.proposedLastWorkingDay);
        const today = dayjs().startOf('day');
        const remaining = lwd.diff(today, 'day');
        return remaining > 0 ? `${remaining} days` : 'Completed';
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: EmployeeExitRequest) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/employee-exit/management/${record.id}`)}
          />
          <Popconfirm
            title="Are you sure you want to delete this exit request?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const cardStyle = {
    borderRadius: 8,
    background: '#fff',
    border: '1px solid #f0f0f0',
    boxShadow: 'none',
  };

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const noticePeriodRequests = requests.filter(r => r.status === 'APPROVED').length;
  const completedRequests = requests.filter(r => r.status === 'COMPLETED').length;

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 8,
          boxShadow: 'none',
        },
        components: {
          Table: {
            rowHoverBg: '#ffffff',
          },
          Card: {
            boxShadow: 'none',
            boxShadowSecondary: 'none',
            boxShadowTertiary: 'none',
          },
          Drawer: {
            boxShadow: 'none',
          },
          Button: {
            boxShadow: 'none',
            primaryShadow: 'none',
          },
          Input: {
            boxShadow: 'none',
          },
          Select: {
            boxShadow: 'none',
          },
          DatePicker: {
            boxShadow: 'none',
          }
        }
      }}
    >
      <MainLayout>
      <div style={{ padding: '32px 40px', background: '#fff', minHeight: '100vh' }}>
        {notificationContextHolder}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space align="center" size="middle">
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#2563eb'
              }}>
                <FileTextOutlined />
              </div>
              <div>
                <Title level={2} style={{ margin: 0 }}>Employee Exit Management</Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  Manage employee exit requests, notice periods, and approvals.
                </Paragraph>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size="middle" align="center">
              <Search
                placeholder="Search by Employee Name"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onChange={(e) => handleSearch(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 280 }}
              />
              <Button type="primary" icon={<PlusOutlined />} size="middle" onClick={handleCreateNew} style={{ boxShadow: 'none' }}>
                New Exit Request
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" bodyStyle={{ padding: 16 }} style={cardStyle}>
              <Row align="middle" justify="space-between">
                <Col><div style={{ color: "#595959", fontSize: 13 }}>Total Employee Requests</div></Col>
                <Col>
                  <Row align="middle" gutter={8}>
                    <Col><div style={{ width: 32, height: 32, borderRadius: "8px", background: '#eff6ff', display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontSize: 16 }}><UserOutlined /></div></Col>
                    <Col><div style={{ fontSize: 20, fontWeight: 600, color: "#1e293b" }}>{totalRequests}</div></Col>
                  </Row>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" bodyStyle={{ padding: 16 }} style={cardStyle}>
              <Row align="middle" justify="space-between">
                <Col><div style={{ color: "#595959", fontSize: 13 }}>Pending Requests</div></Col>
                <Col>
                  <Row align="middle" gutter={8}>
                    <Col><div style={{ width: 32, height: 32, borderRadius: "8px", background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", fontSize: 16 }}><ClockCircleOutlined /></div></Col>
                    <Col><div style={{ fontSize: 20, fontWeight: 600, color: "#1e293b" }}>{pendingRequests}</div></Col>
                  </Row>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" bodyStyle={{ padding: 16 }} style={cardStyle}>
              <Row align="middle" justify="space-between">
                <Col><div style={{ color: "#595959", fontSize: 13 }}>Notice Period</div></Col>
                <Col>
                  <Row align="middle" gutter={8}>
                    <Col><div style={{ width: 32, height: 32, borderRadius: "8px", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", fontSize: 16 }}><CalendarOutlined /></div></Col>
                    <Col><div style={{ fontSize: 20, fontWeight: 600, color: "#1e293b" }}>{noticePeriodRequests}</div></Col>
                  </Row>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small" bodyStyle={{ padding: 16 }} style={cardStyle}>
              <Row align="middle" justify="space-between">
                <Col><div style={{ color: "#595959", fontSize: 13 }}>Completed Exit</div></Col>
                <Col>
                  <Row align="middle" gutter={8}>
                    <Col><div style={{ width: 32, height: 32, borderRadius: "8px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", fontSize: 16 }}><CarryOutOutlined /></div></Col>
                    <Col><div style={{ fontSize: 20, fontWeight: 600, color: "#1e293b" }}>{completedRequests}</div></Col>
                  </Row>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Card bordered={false} style={{ borderRadius: 8, boxShadow: 'none', border: '1px solid #f0f0f0' }} bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={filteredRequests}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            rowClassName={() => 'exit-table-row'}
          />
        </Card>

        <Drawer
          title={viewMode ? "Exit Request Details" : "New Exit Request"}
          width="40%"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          extra={
            !viewMode && (
              <Space>
                <Button onClick={() => setDrawerVisible(false)} style={{ boxShadow: 'none' }}>Cancel</Button>
                <Button type="primary" onClick={handleSubmit} loading={loading} style={{ boxShadow: 'none' }}>Submit</Button>
              </Space>
            )
          }
          styles={{
            header: {
              position: 'sticky',
              top: 0,
              zIndex: 1,
              background: '#fff',
              borderBottom: '1px solid #f0f0f0',
              padding: '16px 24px',
            },
            body: {
              padding: '24px',
              paddingBottom: 80,
              background: '#fff',
            },
            mask: {
              background: 'rgba(0, 0, 0, 0.05)',
            }
          }}
          style={{ boxShadow: 'none' }}
        >
          <Form
            form={form}
            layout="vertical"
            disabled={viewMode}
          >
            <Divider orientation="left" style={{ borderColor: '#f0f0f0', marginTop: 0 }}>Employee Information</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    placeholder="Select Employee"
                    options={employees}
                    onChange={handleEmployeeChange}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="positionId" label="Position">
                  <Select
                    disabled
                    options={positions.map(p => ({ value: p.id, label: p.title }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="departmentId" label="Department">
                  <Select
                    disabled
                    options={departments.map(d => ({ value: d.id, label: d.name }))}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="reportingManagerId" label="Reporting Manager">
                  <Select
                    disabled
                    labelInValue
                    options={employees}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" style={{ borderColor: '#f0f0f0' }}>Exit Details</Divider>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="exitTypeId" label="Exit Type" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    placeholder="Select Exit Type"
                    options={exitTypes.map(t => ({ value: t.id, label: t.name }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="resignationDate" label="Resignation Date" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} onChange={(val) => calculateNoticeDate(val as dayjs.Dayjs, form.getFieldValue('noticePeriodDays'))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="proposedLastWorkingDay" label="Proposed Last Working Day" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="noticePeriodDays" label="Notice Period (Days)">
                  <Input type="number" readOnly />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="noticePeriodDay" label="Notice End Date">
                  <DatePicker disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="exitReasonId" label="Reason for Exit" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    placeholder="Select Reason"
                    options={reasons.map(r => ({ value: r.id, label: r.name }))}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="explanation" label="Detailed Explanation (Optional)">
                  <TextArea rows={4} placeholder="Provide more details..." />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="attachments" label="Attachments (Optional)">
                  <Dragger>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  </Dragger>
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" style={{ borderColor: '#f0f0f0' }}>Notice Handling</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="waiveNoticePeriod" label="Waive Notice Period" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="buyoutRequired" label="Buyout Required" valuePropName="checked">
                  <Switch onChange={(checked) => setBuyoutEnabled(checked)} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="buyoutAmount" label="Buyout Amount">
                  <Input
                    type="number"
                    prefix="$"
                    disabled={!buyoutEnabled}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Drawer>
      </div>
      </MainLayout>
    </ConfigProvider>
  );
}
