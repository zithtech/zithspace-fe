"use client";

import React, { useState } from "react";
import {
  Card,
  Typography,
  Button,
  Table,
  Form,
  Select,
  InputNumber,
  Space,
  Row,
  Col,
  Tag,
  List,
  Drawer
} from "antd";
import { EditOutlined, DeleteOutlined, UserOutlined, FileTextOutlined, SaveOutlined, ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useEmployeeOnboarding } from "@/hooks/use-onboarding";
import { useSalaryStructures } from "@/hooks/useSalaryStructure";
import {
  useSalaryAssignments,
  useAssignSalaryStructure,
  useUpdateSalaryAssignment,
  useDeleteSalaryAssignment
} from "@/hooks/useSalaryAssignment";
import { calculateSalaryPreview, SalaryComponentInput } from "@/utils/salaryCalculation";
import { Modal, message } from "antd";

const { confirm } = Modal;

const { Title, Text } = Typography;
const { Option } = Select;

const EmployeeSalaryAssignmentPage = () => {
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  // Hooks
  const {
    onboardedEmployees,
    loading: employeesLoading,
    fetchEmployees
  } = useEmployeeOnboarding();

  const { data: structures, isLoading: structuresLoading } = useSalaryStructures();
  const { data: assignments, isLoading: assignmentsLoading } = useSalaryAssignments();
  const assignMutation = useAssignSalaryStructure();
  const updateMutation = useUpdateSalaryAssignment();
  const deleteMutation = useDeleteSalaryAssignment();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const onFinish = (values: any) => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: values },
        {
          onSuccess: () => {
            setEditingId(null);
            form.resetFields();
            setDrawerVisible(false);
          },
        }
      );
    } else {
      assignMutation.mutate(values, {
        onSuccess: () => {
          form.resetFields();
          setDrawerVisible(false);
        },
      });
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    setDrawerVisible(true);
    form.setFieldsValue({
      employeeId: record.employeeId,
      structureId: record.structureId,
      baseSalary: Number(record.baseSalary),
      salaryType: record.salaryType,
    });
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Are you sure you want to delete this assignment?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk() {
        deleteMutation.mutate(id);
      },
    });
  };

  // Form watches
  const baseSalary = Form.useWatch("baseSalary", form);
  const salaryType = Form.useWatch("salaryType", form);
  const structureId = Form.useWatch("structureId", form);

  // Calculation results from local utility (Frontend-Only Preview)
  const calculationResult = React.useMemo(() => {
    if (!baseSalary || !salaryType || !structureId) {
      return [];
    }

    const selectedStructure = structures?.find(s => s.id === structureId);
    if (!selectedStructure?.components) return [];

    const gross = salaryType === "YEARLY" ? Number(baseSalary) / 12 : Number(baseSalary);

    const componentInputs: SalaryComponentInput[] = selectedStructure.components.map((c: any) => ({
      componentId: c.componentId,
      componentCode: c.component?.componentCode || "",
      componentName: c.component?.componentName || "",
      type: c.component?.type || "Earning",
      calculationType: c.calculationType,
      percentageBasis: c.percentageBasis,
      value: Number(c.value) || 0,
    }));

    return calculateSalaryPreview(gross, componentInputs);
  }, [baseSalary, salaryType, structureId, structures]);

  // Derived totals
  const totalEarnings = React.useMemo(() => {
    return (calculationResult || [])
      .filter(c => c.type === "Earning")
      .reduce((sum, c) => sum + (Number(c.calculatedAmount) || 0), 0);
  }, [calculationResult]);

  const totalDeductions = React.useMemo(() => {
    return (calculationResult || [])
      .filter(c => c.type === "Deduction")
      .reduce((sum, c) => sum + (Number(c.calculatedAmount) || 0), 0);
  }, [calculationResult]);

  const monthlyGross = totalEarnings;
  const monthlyNet = totalEarnings - totalDeductions;

  const columns = [
    {
      title: "Employee",
      dataIndex: "employee",
      key: "employee",
      render: (employee: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{`${employee?.first_name} ${employee?.last_name}`}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>{employee?.employee_code}</Text>
        </Space>
      ),
    },
    {
      title: "Salary Structure",
      dataIndex: "structure",
      key: "structure",
      render: (structure: any) => <Tag color="blue">{structure?.name}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "salaryType",
      key: "salaryType",
      render: (type: string) => <Tag color={type === "YEARLY" ? "green" : "cyan"}>{type}</Tag>,
    },
    {
      title: "Base Salary",
      dataIndex: "baseSalary",
      key: "baseSalary",
      render: (amt: number) => `₹${Number(amt).toLocaleString()}`,
    },
    {
      title: "Monthly Gross",
      key: "monthlyGross",
      render: (_: any, record: any) => {
        if (record.components && record.components.length > 0) {
          const totalEarnings = record.components
            .filter((c: any) => c.component?.type === "Earning")
            .reduce((sum: number, c: any) => sum + Number(c.amount), 0);
          return <Text strong style={{ color: "#3f51b5" }}>₹{totalEarnings.toLocaleString()}</Text>;
        }
        return <Text strong style={{ color: "#3f51b5" }}>₹0</Text>;
      },
    },
    {
      title: "Monthly Net",
      key: "monthlyNet",
      render: (_: any, record: any) => {
        if (record.components && record.components.length > 0) {
          const totalEarnings = record.components
            .filter((c: any) => c.component?.type === "Earning")
            .reduce((sum: number, c: any) => sum + Number(c.amount), 0);
          const totalDeductions = record.components
            .filter((c: any) => c.component?.type === "Deduction")
            .reduce((sum: number, c: any) => sum + Number(c.amount), 0);
          return <Tag color="green">₹{(totalEarnings - totalDeductions).toLocaleString()}</Tag>;
        }
        return <Tag color="green">₹0</Tag>;
      },
    },
    {
      title: "Assigned Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ marginBottom: 0 }}>Employee Salary Assignment</Title>
          <Text type="secondary">Assign defined salary structures to specific employees</Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setDrawerVisible(true);
            }}
          >
            New Assignment
          </Button>
        </Col>
      </Row>

      <Row gutter={[0, 24]}>
        <Col span={24}>
          <Card
            title="Active Assignments"
            bordered={false}
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)", borderRadius: 12 }}
          >
            <Table
              dataSource={assignments}
              columns={columns}
              loading={assignmentsLoading}
              rowKey="id"
              pagination={{ pageSize: 12 }}
              expandable={{
                expandedRowRender: (record) => {
                  let earnings: any[] = [];
                  let deductions: any[] = [];

                  if (record.components && record.components.length > 0) {
                    earnings = record.components
                      .filter((c: any) => c.component?.type === "Earning")
                      .map((c: any) => ({ name: c.component?.componentName, amount: Number(c.amount) }));
                    deductions = record.components
                      .filter((c: any) => c.component?.type === "Deduction")
                      .map((c: any) => ({ name: c.component?.componentName, amount: Number(c.amount) }));
                  }

                  return (
                    <div style={{ margin: 0, padding: "8px 24px", background: "#f9f9f9", borderRadius: 8 }}>
                      <Row gutter={48}>
                        <Col span={12}>
                          <Title level={5} style={{ fontSize: "14px", marginBottom: 12 }}>Earnings Breakdown</Title>
                          <List
                            size="small"
                            dataSource={earnings}
                            renderItem={(item: any) => (
                              <List.Item style={{ padding: "4px 0" }}>
                                <Text>{item.name}</Text>
                                <Text strong>₹{item.amount.toLocaleString()}</Text>
                              </List.Item>
                            )}
                          />
                        </Col>
                        <Col span={12}>
                          <Title level={5} style={{ fontSize: "14px", marginBottom: 12 }}>Deductions Breakdown</Title>
                          <List
                            size="small"
                            dataSource={deductions}
                            renderItem={(item: any) => (
                              <List.Item style={{ padding: "4px 0" }}>
                                <Text>{item.name}</Text>
                                <Text strong style={{ color: "#f5222d" }}>₹{item.amount.toLocaleString()}</Text>
                              </List.Item>
                            )}
                          />
                        </Col>
                      </Row>
                    </div>
                  );
                },
              }}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title={<span><FileTextOutlined /> {editingId ? "Update Assignment" : "Assign Salary Structure"}</span>}
        width={480}
        onClose={() => {
          setDrawerVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
        open={drawerVisible}
        destroyOnClose
        forceRender
        footer={
          <div style={{ textAlign: "right", padding: "10px 16px" }}>
            <Button style={{ marginRight: 8 }} onClick={() => setDrawerVisible(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={assignMutation.isPending || updateMutation.isPending}
              icon={<SaveOutlined />}
            >
              {editingId ? "Update" : "Confirm"}
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ salaryType: "MONTHLY" }}
        >
          <Form.Item
            label="Assign Employee"
            name="employeeId"
            rules={[{ required: true, message: "Please select an employee" }]}
          >
            <Select
              showSearch
              placeholder="Search and select employee"
              loading={employeesLoading}
              optionFilterProp="label"
              suffixIcon={<UserOutlined />}
              options={onboardedEmployees?.map(emp => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName} (${emp.employee_code})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Salary Structure"
            name="structureId"
            rules={[{ required: true, message: "Please select a structure" }]}
          >
            <Select
              placeholder="Select structure"
              loading={structuresLoading}
            >
              {structures?.map((s) => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>


          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Salary Type"
                name="salaryType"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="MONTHLY">Monthly</Option>
                  <Option value="YEARLY">Yearly</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Amount"
                name="baseSalary"
                rules={[{ required: true, message: "Enter amount" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value!.replace(/\₹\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
          </Row>

          {calculationResult.length > 0 && (
            <div style={{ marginTop: 32, padding: "20px", background: "#f8faff", borderRadius: 16, border: "1px solid #e1e8f5" }}>
              <Title level={5} style={{ marginBottom: 16, fontSize: 14, color: "#475467", display: "flex", alignItems: "center", gap: 8 }}>
                <SaveOutlined style={{ color: "#1677ff" }} /> Preview Calculation
              </Title>
              
              <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>MONTHLY GROSS</Text>
                    <Text strong style={{ fontSize: 15, color: "#1a3353" }}>₹{monthlyGross.toLocaleString()}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>DEDUCTIONS</Text>
                    <Text strong style={{ fontSize: 15, color: "#f5222d" }}>₹{totalDeductions.toLocaleString()}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center", background: "#ffffff", padding: "6px", borderRadius: 8, border: "1px solid #d9e8ff" }}>
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>NET PAY</Text>
                    <Text strong style={{ fontSize: 16, color: "#10b981" }}>₹{monthlyNet.toLocaleString()}</Text>
                  </div>
                </Col>
              </Row>

              <div style={{ background: "#ffffff", borderRadius: 12, padding: "12px", border: "1px solid #eef2f8" }}>
                <Text strong style={{ fontSize: 12, color: "#475467", display: "block", marginBottom: 8, paddingLeft: 4 }}>Breakdown</Text>
                <List
                  size="small"
                  dataSource={calculationResult}
                  renderItem={(item) => (
                    <List.Item style={{ padding: "6px 8px", borderBottom: "1px solid #f5f8ff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <Space size={4}>
                          <Text style={{ fontSize: 13 }}>{item.componentName}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            ({item.calculationType === "PERCENTAGE" ? `${item.value}%` : "Fixed"})
                          </Text>
                        </Space>
                        <Text strong style={{ fontSize: 13, color: item.type === "Deduction" ? "#f5222d" : "#1a3353" }}>
                          {item.type === "Deduction" ? "-" : ""}₹{item.calculatedAmount.toLocaleString()}
                        </Text>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          )}
        </Form>
      </Drawer>
    </div>
  );
};

export default EmployeeSalaryAssignmentPage;
