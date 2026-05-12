"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  X,
  Wallet,
  Briefcase,
  Hash,
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
  const router = useRouter();
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

  // Live duplicate-check state for the Initiate New Project modal
  type CheckState = { status: "idle" | "checking" | "available" | "taken"; value: string };
  const [nameCheck, setNameCheck] = useState<CheckState>({ status: "idle", value: "" });
  const [codeCheck, setCodeCheck] = useState<CheckState>({ status: "idle", value: "" });
  const nameTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the latest typed value via ref — synchronous & immune to form-state lag
  const latestName = React.useRef("");
  const latestCode = React.useRef("");

  const runCheck = async (field: "name" | "code", value: string) => {
    if (value.length < 3) return;
    const setter = field === "name" ? setNameCheck : setCodeCheck;
    const latest = field === "name" ? latestName : latestCode;
    try {
      const url = `/api/clients-v2/projects/check?${field}=${encodeURIComponent(value)}`;
      const data = await api.get(url);
      // Bail if user kept typing — only apply result for the most recent value
      if (latest.current.trim() !== value) return;
      const exists = field === "name" ? !!data?.nameExists : !!data?.codeExists;
      setter({ status: exists ? "taken" : "available", value });
      form.setFields([
        {
          name: field,
          errors: exists
            ? [field === "name" ? "A project with this name already exists" : "This project code is already in use"]
            : [],
        },
      ]);
    } catch (err) {
      console.error("Project availability check failed", err);
      if (latest.current.trim() === value) {
        setter({ status: "idle", value });
      }
    }
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    latestName.current = v;
    if (nameTimer.current) clearTimeout(nameTimer.current);
    const trimmed = v.trim();
    if (trimmed.length < 3) {
      setNameCheck({ status: "idle", value: v });
      form.setFields([{ name: "name", errors: [] }]);
      return;
    }
    setNameCheck({ status: "checking", value: v });
    nameTimer.current = setTimeout(() => runCheck("name", trimmed), 400);
  };

  const onCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    latestCode.current = v;
    if (codeTimer.current) clearTimeout(codeTimer.current);
    const trimmed = v.trim();
    if (trimmed.length < 3) {
      setCodeCheck({ status: "idle", value: v });
      form.setFields([{ name: "code", errors: [] }]);
      return;
    }
    setCodeCheck({ status: "checking", value: v });
    codeTimer.current = setTimeout(() => runCheck("code", trimmed), 400);
  };

  const resetChecks = () => {
    if (nameTimer.current) clearTimeout(nameTimer.current);
    if (codeTimer.current) clearTimeout(codeTimer.current);
    latestName.current = "";
    latestCode.current = "";
    setNameCheck({ status: "idle", value: "" });
    setCodeCheck({ status: "idle", value: "" });
  };

  const renderCheckSuffix = (s: CheckState) => {
    if (s.status === "checking") return <span className="pmodal-check spin"><Clock size={13} /></span>;
    if (s.status === "available") return <span className="pmodal-check ok"><CheckCircle2 size={14} /></span>;
    if (s.status === "taken") return <span className="pmodal-check bad"><AlertCircle size={14} /></span>;
    return null;
  };

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
    if (nameCheck.status === "taken" || codeCheck.status === "taken") {
      notify.warning({
        message: "Duplicate detected",
        description: "Please choose a unique project name and code before creating.",
        placement: "top",
      });
      return;
    }
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
      resetChecks();
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
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Project Overview">
            <Button
              type="text"
              className="premium-action-btn"
              icon={<Eye size={16} />}
              style={{ color: "var(--text-slate-400)" }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/projects/${record.id}/overview`);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit Configuration">
            <Button
              type="text"
              className="premium-action-btn"
              icon={<Edit2 size={16} />}
              style={{ color: "var(--text-slate-400)" }}
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(record);
              }}
            />
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
      <Card className="ptab-card" styles={{ body: { padding: 0 } }}>
        <div className="ptab-header">
          <div className="ptab-header-left">
            <div className="ptab-header-icon blue">
              <Layers size={20} />
            </div>
            <div className="ptab-header-titlewrap">
              <div className="ptab-header-title">
                Internal Projects
                <span className="ptab-header-count">{filteredProjects.length}</span>
              </div>
              <div className="ptab-header-desc">
                Monitor project lifecycles, budget utilization, and leadership assignments
              </div>
            </div>
          </div>
          <div className="ptab-header-right">
            <Input
              placeholder="Search by name or project code..."
              prefix={<Search size={15} style={{ color: "var(--text-slate-400)" }} />}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ptab-search"
              allowClear
            />
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsModalVisible(true)}
              className="ptab-primary-btn"
            >
              Initiate Project
            </Button>
          </div>
        </div>

        <Table
          dataSource={filteredProjects}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          className="premium-table"
          scroll={{ x: "max-content" }}
          onRow={(record) => ({
            onClick: () => router.push(`/projects/${record.id}/overview`),
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: (
              <div className="ptab-empty">
                <div className="ptab-empty-icon">
                  <Layers size={26} />
                </div>
                <div className="ptab-empty-title">No projects yet</div>
                <div className="ptab-empty-desc">
                  Initiate the first project under this client to start tracking budget, timelines, and ownership.
                </div>
              </div>
            ),
          }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          resetChecks();
        }}
        footer={null}
        title={null}
        width={640}
        centered
        destroyOnClose
        className="pmodal pmodal-compact pmodal-project"
        closeIcon={<X size={16} />}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateProject}>
          <div className="pmodal-hero pmodal-hero-slim">
            <div className="pmodal-hero-content">
              <div className="pmodal-hero-icon">
                <Layers size={18} />
              </div>
              <div className="pmodal-hero-text">
                <div className="pmodal-hero-title">Initiate New Project</div>
                <div className="pmodal-hero-sub">
                  Define scope, leadership, and budget for this engagement
                </div>
              </div>
            </div>
          </div>

          <div className="pmodal-body pmodal-body-compact">
            <div className="pmodal-step-band">
              <span className="pmodal-step-num">01</span>
              <span className="pmodal-step-icon"><Hash size={11} /></span>
              <span className="pmodal-step-text">Identity</span>
            </div>
            <Row gutter={12}>
              <Col xs={24} sm={14}>
                <Form.Item
                  label="Project name"
                  name="name"
                  rules={[{ required: true, message: "Required" }]}
                  hasFeedback={false}
                  extra={
                    nameCheck.status === "available" ? (
                      <span className="pmodal-check-hint ok">Name is available</span>
                    ) : nameCheck.status === "checking" ? (
                      <span className="pmodal-check-hint muted">Checking availability…</span>
                    ) : null
                  }
                >
                  <Input
                    placeholder="e.g. Q3 Infrastructure Modernization"
                    onChange={onNameChange}
                    suffix={renderCheckSuffix(nameCheck)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item
                  label="Project code"
                  name="code"
                  rules={[{ required: true, message: "Required" }]}
                  hasFeedback={false}
                  extra={
                    codeCheck.status === "available" ? (
                      <span className="pmodal-check-hint ok">Code is available</span>
                    ) : codeCheck.status === "checking" ? (
                      <span className="pmodal-check-hint muted">Checking…</span>
                    ) : null
                  }
                >
                  <Input
                    placeholder="PRJ-2024-001"
                    onChange={onCodeChange}
                    suffix={renderCheckSuffix(codeCheck)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="pmodal-step-band">
              <span className="pmodal-step-num">02</span>
              <span className="pmodal-step-icon"><User size={11} /></span>
              <span className="pmodal-step-text">Leadership &amp; Status</span>
            </div>
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Project manager"
                  name="projectManagerId"
                  rules={[{ required: true, message: "Assignment required" }]}
                >
                  <Select
                    placeholder="Assign a manager"
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
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Initial status"
                  name="status"
                  initialValue="Draft"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Select.Option value="Draft">Drafting phase</Select.Option>
                    <Select.Option value="Active">Operational / Active</Select.Option>
                    <Select.Option value="On Hold">Delayed / On hold</Select.Option>
                    <Select.Option value="Completed">Project completed</Select.Option>
                    <Select.Option value="Closed">System closed</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div className="pmodal-step-band">
              <span className="pmodal-step-num">03</span>
              <span className="pmodal-step-icon"><Wallet size={11} /></span>
              <span className="pmodal-step-text">Billing &amp; Budget</span>
            </div>
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Billing model"
                  name="billingType"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select model">
                    <Select.Option value="Hourly">Hourly rate</Select.Option>
                    <Select.Option value="Monthly">Monthly subscription</Select.Option>
                    <Select.Option value="Daily">Daily allowance</Select.Option>
                    <Select.Option value="Fixed">Fixed project cost</Select.Option>
                    <Select.Option value="Non-Billable">Internal / Non-billable</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Allocated budget" name="budget">
                  <InputNumber
                    type="number"
                    addonBefore={currencySelector}
                    style={{ width: "100%" }}
                    placeholder="0.00"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="pmodal-step-band">
              <span className="pmodal-step-num">04</span>
              <span className="pmodal-step-icon"><Calendar size={11} /></span>
              <span className="pmodal-step-text">Timeline</span>
            </div>
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Start date"
                  name="startDate"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <DatePicker style={{ width: "100%" }} placeholder="Commencement" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="End date" name="endDate">
                  <DatePicker style={{ width: "100%" }} placeholder="Estimated completion" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="pmodal-footer pmodal-footer-compact">
            <Button
              onClick={() => setIsModalVisible(false)}
              className="pmodal-btn-cancel"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<Plus size={14} />}
              className="pmodal-btn-primary"
            >
              Initialize Project
            </Button>
          </div>
        </Form>
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
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Project Name</span>} name="name" rules={[{ required: true }]}>
                  <Input style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Project Code</span>} name="code">
                  <Input disabled style={{ borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Project Manager</span>} name="projectManagerId" rules={[{ required: true }]}>
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
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Project Status</span>} name="status" rules={[{ required: true }]}>
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
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Billing Type</span>} name="billingType" rules={[{ required: true }]}>
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
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Total Budget</span>} name="budget">
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
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Start Date</span>} name="startDate" rules={[{ required: true }]}>
                  <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>End Date</span>} name="endDate">
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
        .premium-table .ant-table {
          background: transparent !important;
          color: var(--text-slate-700) !important;
        }
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
        .premium-table .ant-table-thead > tr > th::before { display: none !important; }
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        .premium-table .ant-table-placeholder > td {
          background: transparent !important;
        }
        .premium-action-btn:hover {
          background: var(--bg-slate-50) !important;
          color: #8b5cf6 !important;
        }
        [data-theme="dark"] .premium-action-btn {
          color: var(--text-slate-400) !important;
        }
        [data-theme="dark"] .premium-action-btn:hover {
          background: rgba(139, 92, 246, 0.16) !important;
          color: #a78bfa !important;
        }
      `}} />
    </div>
  );
}
