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
  Row,
  Col,
  Tooltip,
  Avatar,
  Progress,
} from "antd";
import {
  Plus,
  Edit2,
  Eye,
  Search,
  Layers,
  Calendar,
  DollarSign,
  User,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
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
        message: "Load Error",
        description: "Failed to load project database.",
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
      <Select style={{ width: 70, border: "none" }} dropdownMatchSelectWidth={false}>
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
        startDate: values.startDate ? values.startDate.format("YYYY-MM-DD") : undefined,
        endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : undefined,
      };

      await api.post(`/api/clients-v2/${clientId}/projects`, payload);
      notify.success({
        message: "Project Created",
        description: "New client project has been initialized successfully.",
        placement: "top",
      });
      setIsModalVisible(false);
      form.resetFields();
      fetchProjects();
      onRefresh();
    } catch (error: any) {
      notify.error({
        message: "Creation Failed",
        description: error.response?.data?.error || "Failed to create project record.",
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
      projectManagerId: project.projectManager?.id || project.projectManagerId,
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
        startDate: values.startDate ? values.startDate.format("YYYY-MM-DD") : undefined,
        endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : undefined,
      };

      await api.put(`/api/clients-v2/projects/${editingProject.id}`, payload);
      notify.success({
        message: "Project Updated",
        description: "Project configuration has been successfully modified.",
        placement: "top",
      });
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditingProject(null);
      fetchProjects();
      onRefresh();
    } catch (error: any) {
      notify.error({
        message: "Update Failed",
        description: error.response?.data?.error || "Failed to save project changes.",
        placement: "top",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Project Identity",
      key: "name",
      width: 280,
      render: (_: any, record: any) => (
        <Space size={12}>
          <div style={{ background: "var(--bg-slate-50)", padding: 8, borderRadius: 8, color: "var(--text-slate-500)", display: "flex" }}>
            <Layers size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-slate-900)", fontSize: 14 }}>{record.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500 }}>CODE: {record.code}</div>
          </div>
        </Space>
      )
    },
    {
      title: "Billing Details",
      key: "billing",
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-slate-700)" }}>{record.billingType}</div>
          <div style={{ fontSize: 12, color: "var(--text-slate-400)" }}>Model</div>
        </div>
      )
    },
    {
      title: "Budget Status",
      key: "budget",
      render: (_: any, record: any) => {
        const symbol = currencyOptions.find((c) => c.value === record.currency)?.symbol || "$";
        const budget = Number(record.budget || 0);
        const invoiced = Number(record.invoicedAmount || 0);
        const percentage = budget > 0 ? Math.min(100, (invoiced / budget) * 100) : 0;

        return (
          <div style={{ width: 140 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-slate-900)" }}>{symbol}{budget.toLocaleString()}</span>
              <span style={{ fontSize: 11, color: "var(--text-slate-500)" }}>{Math.round(percentage)}%</span>
            </div>
            <Progress
              percent={percentage}
              size="small"
              showInfo={false}
              strokeColor="var(--premium-blue)"
              trailColor="var(--border-slate-100)"
              strokeWidth={6}
            />
          </div>
        );
      },
    },
    {
      title: "Lifecycle",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const config: any = {
          Active: { color: "success", icon: <Activity size={12} /> },
          Draft: { color: "processing", icon: <FileText size={12} /> },
          "On Hold": { color: "warning", icon: <Clock size={12} /> },
          Completed: { color: "default", icon: <CheckCircle2 size={12} /> },
          Closed: { color: "error", icon: <AlertCircle size={12} /> },
        };
        const item = config[status] || { color: "default", icon: null };
        return (
          <Tag
            color={item.color}
            icon={item.icon}
            style={{ borderRadius: 6, fontWeight: 600, border: 0, display: "flex", alignItems: "center", gap: 4, width: "fit-content" }}
          >
            {status?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Leadership",
      key: "projectManager",
      render: (_: any, record: any) => (
        <Space size={8}>
          <Avatar
            size="small"
            style={{ backgroundColor: "var(--bg-slate-50)", color: "var(--text-slate-400)" }}
            icon={<User size={12} />}
          />
          <span style={{ fontSize: 13, color: "var(--text-slate-700)", fontWeight: 500 }}>
            {record.projectManager?.first_name
              ? `${record.projectManager.first_name} ${record.projectManager.last_name}`
              : record.projectManager?.name || "Unassigned"}
          </span>
        </Space>
      ),
    },
    {
      title: "Timeline",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: string) => (
        <Space size={6} style={{ color: "var(--text-slate-500)", fontSize: 13 }}>
          <Calendar size={14} style={{ color: "var(--text-slate-400)" }} />
          {date ? dayjs(date).format("MMM DD, YYYY") : "N/A"}
        </Space>
      )
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Project Details">
            <Button type="text" className="premium-action-btn" icon={<Eye size={16} />} style={{ color: "var(--text-slate-400)" }} />
          </Tooltip>
          <Tooltip title="Edit Configuration">
            <Button type="text" className="premium-action-btn" icon={<Edit2 size={16} />} style={{ color: "var(--text-slate-400)" }} onClick={() => openEditModal(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {contextHolder}
      <Card
        style={{
          borderRadius: 16,
          border: "1px solid var(--border-slate-100)",
          background: "var(--bg-pure-white)"
        }}
        bodyStyle={{ padding: "0" }}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-slate-100)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-slate-900)" }}>Internal Projects</div>
            <div style={{ fontSize: 13, color: "var(--text-slate-500)", marginTop: 4 }}>Monitor project lifecycles, budget utilization, and leadership assignments</div>
          </div>
          <Space size={12}>
            <Input
              placeholder="Search by name or project code..."
              prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderRadius: 10, width: 300, height: 40 }}
            />
            <Button
              type="primary"
              size="large"
              icon={<Plus size={18} />}
              onClick={() => setIsModalVisible(true)}
              style={{ borderRadius: 10, height: 40, fontWeight: 600, display: "flex", alignItems: "center" }}
            >
              Initiate Project
            </Button>
          </Space>
        </div>

        <Table
          dataSource={filteredProjects}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          className="premium-table"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: <div style={{ padding: "40px 0", color: "#64748b" }}>No project initiatives recorded</div> }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#eff6ff", padding: 8, borderRadius: 8, color: "#3b82f6", display: "flex" }}>
              <Layers size={20} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>Initiate New Project</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={680}
        centered
        destroyOnClose
        className="premium-modal"
      >
        <div style={{ padding: "8px 0" }}>
          <Form form={form} layout="vertical" onFinish={handleCreateProject}>
            <Row gutter={20}>
              <Col xs={24} sm={14}>
                <Form.Item
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Project Name</span>}
                  name="name"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="e.g. Q3 Infrastructure Modernization" style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>System Identification Code</span>}
                  name="code"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="e.g. PRJ-2024-001" style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Project Leadership</span>}
                  name="projectManagerId"
                  rules={[{ required: true, message: "Assignment required" }]}
                >
                  <Select
                    placeholder="Assign a Project Manager"
                    showSearch
                    optionFilterProp="children"
                    style={{ borderRadius: 8, height: 40 }}
                  >
                    {employees.map((emp) => (
                      <Select.Option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Initial Lifecycle Status</span>}
                  name="status"
                  initialValue="Draft"
                  rules={[{ required: true }]}
                >
                  <Select style={{ borderRadius: 8, height: 40 }}>
                    <Select.Option value="Draft">Drafting Phase</Select.Option>
                    <Select.Option value="Active">Operational / Active</Select.Option>
                    <Select.Option value="On Hold">Delayed / On Hold</Select.Option>
                    <Select.Option value="Completed">Project Completed</Select.Option>
                    <Select.Option value="Closed">System Closed</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Billing Model</span>}
                  name="billingType"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select Model" style={{ borderRadius: 8, height: 40 }}>
                    <Select.Option value="Hourly">Hourly rate</Select.Option>
                    <Select.Option value="Monthly">Monthly subscription</Select.Option>
                    <Select.Option value="Daily">Daily allowance</Select.Option>
                    <Select.Option value="Fixed">Fixed project cost</Select.Option>
                    <Select.Option value="Non-Billable">Internal / Non-Billable</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Allocated Budget</span>} name="budget">
                  <InputNumber
                    type="number"
                    addonBefore={currencySelector}
                    style={{ width: "100%", borderRadius: 8, height: 40, display: "flex", alignItems: "center" }}
                    placeholder="0.00"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Project Commencement</span>}
                  name="startDate"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Estimated Completion</span>} name="endDate">
                  <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button
                onClick={() => setIsModalVisible(false)}
                style={{ borderRadius: 8, height: 40 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ borderRadius: 8, height: 40, fontWeight: 600, padding: "0 24px" }}
              >
                Initialize Project
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#f0f9ff", padding: 8, borderRadius: 8, color: "#0ea5e9", display: "flex" }}>
              <Edit2 size={20} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>Update Project Configuration</span>
          </div>
        }
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setEditingProject(null);
        }}
        footer={null}
        width={680}
        centered
        className="premium-modal"
      >
        <div style={{ padding: "8px 0" }}>
          <Form form={editForm} layout="vertical" onFinish={handleEditProject}>
            <Row gutter={20}>
              <Col xs={24} sm={14}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Project Name</span>} name="name" rules={[{ required: true }]}>
                  <Input style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Project Code</span>} name="code">
                  <Input disabled style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Project Manager</span>} name="projectManagerId" rules={[{ required: true }]}>
                  <Select showSearch optionFilterProp="children" style={{ borderRadius: 8, height: 40 }}>
                    {employees.map((emp) => (
                      <Select.Option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Project Status</span>} name="status" rules={[{ required: true }]}>
                  <Select style={{ borderRadius: 8, height: 40 }}>
                    <Select.Option value="Draft">Draft</Select.Option>
                    <Select.Option value="Active">Active</Select.Option>
                    <Select.Option value="On Hold">On Hold</Select.Option>
                    <Select.Option value="Completed">Completed</Select.Option>
                    <Select.Option value="Closed">Closed</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Billing Type</span>} name="billingType" rules={[{ required: true }]}>
                  <Select style={{ borderRadius: 8, height: 40 }}>
                    <Select.Option value="Hourly">Hourly</Select.Option>
                    <Select.Option value="Monthly">Monthly</Select.Option>
                    <Select.Option value="Daily">Daily</Select.Option>
                    <Select.Option value="Fixed">Fixed</Select.Option>
                    <Select.Option value="Non-Billable">Non-Billable</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Total Budget</span>} name="budget">
                  <InputNumber
                    addonBefore={currencySelector}
                    style={{ width: "100%", borderRadius: 8, height: 40, display: "flex", alignItems: "center" }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Start Date</span>} name="startDate" rules={[{ required: true }]}>
                  <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>End Date</span>} name="endDate">
                  <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button onClick={() => setIsEditModalVisible(false)} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting} style={{ borderRadius: 8, height: 40, fontWeight: 600, padding: "0 24px" }}>
                Save Configuration
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-500) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 16px 24px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .premium-action-btn:hover {
          background: var(--bg-slate-50) !important;
          color: var(--premium-blue) !important;
        }
      `}} />
    </div>
  );
}
