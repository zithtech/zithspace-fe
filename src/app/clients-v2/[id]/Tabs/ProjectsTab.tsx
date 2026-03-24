"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Tag,
  Space,
  Popconfirm,
  notification,
  Card,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/axios";
import dayjs from "dayjs";

const currencyOptions = [
  { value: "USD", label: "US Dollar", symbol: "$", minor: "Cent" },
  { value: "INR", label: "Indian Rupee", symbol: "₹", minor: "Paise" },
  { value: "EUR", label: "Euro", symbol: "€", minor: "Cent" },
  { value: "GBP", label: "British Pound", symbol: "£", minor: "Pence" },
  { value: "JPY", label: "Japanese Yen", symbol: "¥", minor: "" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$", minor: "Cent" },
  { value: "CAD", label: "Canadian Dollar", symbol: "C$", minor: "Cent" },
  { value: "CNY", label: "Chinese Yuan", symbol: "¥", minor: "Fen" },
];

interface ProjectsTabProps {
  clientId: string;
  onRefresh: () => void;
}

export default function ProjectsTab({ clientId, onRefresh }: ProjectsTabProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [notify, contextHolder] = notification.useNotification();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/clients-v2/${clientId}/projects`);
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      notify.error({
        message: "Error",
        description: "Failed to load projects",
        placement: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await api.get("/api/clients-v2/employees/select");
      setEmployees(data || []);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, [clientId]);

  const currencySelector = (
    <Form.Item name="currency" noStyle initialValue="USD">
      <Select style={{ width: 60 }}>
        {currencyOptions.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.symbol}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );

  const handleCreateProject = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        startDate: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : undefined,
        endDate: values.endDate
          ? values.endDate.format("YYYY-MM-DD")
          : undefined,
      };

      await api.post(`/api/clients-v2/${clientId}/projects`, payload);
      console.log("data :", payload);
      notify.success({
        message: "Success",
        description: "Project created successfully",
        placement: "top",
      });
      setIsModalVisible(false);
      form.resetFields();
      fetchProjects();
      onRefresh();
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to create project";
      notify.error({
        message: "Error",
        description: msg,
        placement: "top",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    editForm.setFieldsValue({
      name: project.name,
      code: project.code,
      billingType: project.billingType,
      budget: project.budget,
      currency: project.currency || "USD",
      status: project.status,
      projectManagerId: project.projectManager?.id || project.projectManagerId, // Depending on relation response
      startDate: project.startDate ? dayjs(project.startDate) : undefined,
      endDate: project.endDate ? dayjs(project.endDate) : undefined,
    });
    setIsEditModalVisible(true);
  };

  const handleEditProject = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        startDate: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : undefined,
        endDate: values.endDate
          ? values.endDate.format("YYYY-MM-DD")
          : undefined,
      };

      await api.put(`/api/clients-v2/projects/${editingProject.id}`, payload);
      notify.success({
        message: "Success",
        description: "Project updated successfully",
        placement: "top",
      });
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditingProject(null);
      fetchProjects();
      onRefresh();
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to update project";
      notify.error({
        message: "Error",
        description: msg,
        placement: "top",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: "Project Name", dataIndex: "name", key: "name", width: 200 },
    { title: "Code", dataIndex: "code", key: "code" },
    { title: "Billing Type", dataIndex: "billingType", key: "billingType" },
    {
      title: "Budget",
      key: "budget",
      render: (_: any, record: any) => {
        const symbol =
          currencyOptions.find((c) => c.value === record.currency)?.symbol ||
          "";
        return record.budget
          ? `${symbol} ${Number(record.budget).toLocaleString()}`
          : "N/A";
      },
    },
    {
      title: "Invoiced",
      key: "invoicedAmount",
      render: (_: any, record: any) => {
        const symbol =
          currencyOptions.find((c) => c.value === record.currency)?.symbol ||
          "$";
        return record.invoicedAmount
          ? `${symbol} ${Number(record.invoicedAmount).toLocaleString()}`
          : `${symbol} 0`;
      },
    },
    {
      title: "Outstanding",
      key: "outstanding",
      render: (_: any, record: any) => {
        const symbol =
          currencyOptions.find((c) => c.value === record.currency)?.symbol ||
          "$";
        const budget = Number(record.budget || 0);
        const invoiced = Number(record.invoicedAmount || 0);
        const outstanding = budget - invoiced;
        return `${symbol} ${Math.max(0, outstanding).toLocaleString()}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          {
            Active: "#87d068",
            Draft: "geekblue",
            "On Hold": "orange",
            Completed: "#1677ff",
            Closed: "default",
          }[status] || "default";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Manager",
      dataIndex: ["projectManager", "name"],
      key: "projectManager",
      render: (name: string, record: any) => {
        // Handle fallback if legacy first_name / last_name structure is fetched
        if (!name && record.projectManager) {
          return (
            `${record.projectManager.first_name || ""} ${record.projectManager.last_name || ""}`.trim() ||
            "N/A"
          );
        }
        return name || "N/A";
      },
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: string) =>
        date ? dayjs(date).format("MMM DD, YYYY") : "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          />
        </Space>
      ),
    },
  ];

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Card className="premium-card" style={{ height: "60vh" }}>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <p
            style={{ fontSize: 12, fontWeight: 600, margin: 0, color: "grey" }}
          >
            Track all client projects, their status, budget, and team
            assignments.
          </p>
        </div>
        <Space>
          <Input
            placeholder="Search by project name..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Create Project
          </Button>
        </Space>
      </div>

      <Table
        dataSource={filteredProjects}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        className="premium-modal"
        title={
          <Space>
            <ProjectOutlined style={{ color: "#1677ff" }} />
            <span>Create Project</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, color: "#666" }}>
          Enter the details for the new project.
        </div>
        <Divider style={{ margin: "0 0 16px 0" }} />
        <Form form={form} layout="vertical" onFinish={handleCreateProject}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Form.Item
              label="Project Name"
              name="name"
              rules={[{ required: true }]}
            >
              <Input placeholder="E.g. Website Redesign" />
            </Form.Item>
            <Form.Item
              label="Project Code"
              name="code"
              rules={[{ required: true }]}
            >
              <Input placeholder="E.g. PRJ-001" />
            </Form.Item>

            <Form.Item
              label="Billing Type"
              name="billingType"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select Billing Type">
                <Select.Option value="Hourly">Hourly</Select.Option>
                <Select.Option value="Monthly">Monthly</Select.Option>
                <Select.Option value="Daily">Daily</Select.Option>
                <Select.Option value="Fixed">Fixed</Select.Option>
                <Select.Option value="Non-Billable">Non-Billable</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Budget" name="budget">
              <InputNumber
                addonBefore={currencySelector}
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) =>
                  value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                }
              />
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              initialValue="Draft"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="Draft">Draft</Select.Option>
                <Select.Option value="Active">Active</Select.Option>
                <Select.Option value="On Hold">On Hold</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="Closed">Closed</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Project Manager"
              name="projectManagerId"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select Manager"
                showSearch
                optionFilterProp="children"
              >
                {employees.map((emp) => (
                  <Select.Option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_code})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="End Date" name="endDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Form.Item
            style={{ textAlign: "right", marginTop: 24, marginBottom: 0 }}
          >
            <Space>
              <Button
                onClick={() => setIsModalVisible(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Create Project
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        className="premium-modal"
        title={
          <Space>
            <ProjectOutlined style={{ color: "#1677ff" }} />
            <span>Edit Project</span>
          </Space>
        }
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setEditingProject(null);
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, color: "#666" }}>
          Update the project details below.
        </div>
        <Divider style={{ margin: "0 0 16px 0" }} />
        <Form form={editForm} layout="vertical" onFinish={handleEditProject}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Form.Item
              label="Project Name"
              name="name"
              rules={[{ required: true }]}
            >
              <Input placeholder="E.g. Website Redesign" />
            </Form.Item>
            <Form.Item
              label="Project Code"
              name="code"
              rules={[{ required: true }]}
            >
              <Input placeholder="E.g. PRJ-001" disabled />
            </Form.Item>

            <Form.Item
              label="Billing Type"
              name="billingType"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select Billing Type">
                <Select.Option value="Hourly">Hourly</Select.Option>
                <Select.Option value="Monthly">Monthly</Select.Option>
                <Select.Option value="Daily">Daily</Select.Option>
                <Select.Option value="Fixed">Fixed</Select.Option>
                <Select.Option value="Non-Billable">Non-Billable</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Budget" name="budget">
              <InputNumber
                addonBefore={currencySelector}
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) =>
                  value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                }
              />
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              initialValue="Draft"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="Draft">Draft</Select.Option>
                <Select.Option value="Active">Active</Select.Option>
                <Select.Option value="On Hold">On Hold</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="Closed">Closed</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Project Manager"
              name="projectManagerId"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select Manager"
                showSearch
                optionFilterProp="children"
              >
                {employees.map((emp: any) => (
                  <Select.Option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_code})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="End Date" name="endDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Form.Item
            style={{ textAlign: "right", marginTop: 24, marginBottom: 0 }}
          >
            <Space>
              <Button
                onClick={() => setIsEditModalVisible(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
