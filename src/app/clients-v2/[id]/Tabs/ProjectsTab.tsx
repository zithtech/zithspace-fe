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
  message,
  Card,
  Row,
  Col,
  Tooltip,
  Avatar,
  Progress,
  Segmented,
  Dropdown,
  Drawer,
} from "antd";
import {
  Plus,
  Edit2,
  Eye,
  Trash2,
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
  FolderInput as FolderInputIcon,
  Link2,
  LayoutGrid,
  List,
  MoreHorizontal,
} from "lucide-react";
import { api } from "@/lib/axios";
import { usePermission } from "@/hooks/usePermission";
import dayjs from "dayjs";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import {
  ClientV2Service,
  ImportableProject,
} from "@/services/clientV2Service";
import { MembersService } from "@/services/membersService";
import { commonDrawerProps, SectionCard, drawerFormStyles } from "@/components/common/DrawerSection";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

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
  const { canUpdateClient } = usePermission();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");


  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  const projectActionMenu = (project: any) => ({
    className: "pp-action-pop",
    items: [
      {
        key: "view",
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}><Eye size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">View Overview</span>
              <span className="pp-menu-desc">Monitor progress</span>
            </span>
          </div>
        ),
        onClick: (info: any) => {
          info.domEvent?.stopPropagation();
          router.push(`/projects/${project.id}/overview`);
        }
      },
      {
        key: "edit",
        disabled: !canUpdateClient,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#64748b", background: "rgba(100, 116, 139, 0.12)" }}><Edit2 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title">Edit Configuration</span>
              <span className="pp-menu-desc">Modify settings</span>
            </span>
          </div>
        ),
        onClick: (info: any) => {
          info.domEvent?.stopPropagation();
          openEditModal(project);
        }
      },
      {
        key: "delete",
        danger: true,
        disabled: !canUpdateClient,
        label: (
          <div className="pp-menu-item">
            <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}><Trash2 size={13} /></span>
            <span className="pp-menu-text">
              <span className="pp-menu-title" style={{ color: "#ef4444" }}>Delete</span>
              <span className="pp-menu-desc">Remove project permanently</span>
            </span>
          </div>
        ),
        onClick: (info: any) => {
          info.domEvent?.stopPropagation();
          modal.confirm({
            title: "Delete Project",
            content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: () => handleDeleteProject(project.id, project.name),
          });
        }
      }
    ]
  });

  // Import-existing-projects modal state
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);

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
      messageApi.error("Load Error: Failed to load project database.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await MembersService.getMembersForSelect();
      setEmployees(data || []);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchProjects(),
        fetchEmployees(),
        onRefresh(),
      ]);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
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
      messageApi.warning(
        "Duplicate detected: Please choose a unique project name and code before creating."
      );
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
      messageApi.success("Project Created: New client project has been initialized successfully.");
      setIsModalVisible(false);
      form.resetFields();
      resetChecks();
      fetchProjects();
      onRefresh();
    } catch (error: any) {
      messageApi.error(
        `Creation Failed: ${error.response?.data?.error || "Failed to create project record."}`
      );
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
      messageApi.success("Project Updated: Project configuration has been successfully modified.");
      setIsEditModalVisible(false);
      editForm.resetFields();
      setEditingProject(null);
      fetchProjects();
      onRefresh();
    } catch (error: any) {
      messageApi.error(
        `Update Failed: ${error.response?.data?.error || "Failed to save project changes."}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    try {
      await api.delete(`/api/clients-v2/projects/${projectId}`);
      messageApi.success(`Project Deleted: "${projectName}" has been permanently deleted.`);
      fetchProjects();
      onRefresh();
    } catch (error: any) {
      messageApi.error(
        `Delete Failed: ${error.response?.data?.error || "Failed to delete project."}`
      );
    }
  };

  const columns = [
    {
      title: "Project Identity",
      key: "name",
      width: 280,
      render: (_: any, record: any) => (
        <Space size={12}>
          <Avatar
            style={{ backgroundColor: "#3b82f6", color: "#fff" }}
          >
            {(record.name?.[0] || "").toUpperCase()}
          </Avatar>
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
      title: "Created By",
      key: "createdBy",
      render: (_: any, record: any) => {
        const creator = record.createdBy;
        if (!creator?.name) return <span style={{ color: "var(--text-slate-400)" }}>—</span>;
        return (
          <div className="pp-creator" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Avatar size={20} src={creator.avatarUrl || creator.avatar} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 9, fontWeight: 700 }}>
              {(creator.name?.[0] || "").toUpperCase()}
            </Avatar>
            <span className="pp-creator-name" style={{ fontSize: "11.5px", color: "var(--text-slate-700)", whiteSpace: "nowrap" }}>{creator.name}</span>
          </div>
        );
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? (
          <div className="pp-date" style={{ display: "flex", flexDirection: "column" }}>
            <span className="pp-date-main" style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-slate-700)" }}>{dayjs(date).format("MMM D, YYYY")}</span>
            <span className="pp-date-sub" style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>{dayjs(date).format("h:mm A")}</span>
          </div>
        ) : <span style={{ color: "var(--text-slate-400)" }}>—</span>,
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
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 72,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Dropdown
          menu={projectActionMenu(record)}
          overlayClassName="pp-action-pop"
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            className="pp-icon-btn"
            icon={<MoreHorizontal size={16} />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {contextHolder}
      {modalContextHolder}

      <div className="cd-tab-sticky-head">
        <div className="projects-header-wrap" style={{ margin: "0 -32px" }}>
          <TimeTrackingHeader
            icon={<Layers size={20} color="#3b82f6" />}
            title="Projects"
            description="Monitor project lifecycles, budget utilization, and leadership assignments"
            style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)", padding: "4px 32px", marginBottom: "8px" }}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            extra={
              <div style={{ display: "flex", gap: "12px", flexWrap: "nowrap", alignItems: "center" }}>
                {canUpdateClient && (
                  <Button
                    icon={<FolderInputIcon size={16} />}
                    onClick={() => setIsImportModalVisible(true)}
                    style={{
                      borderRadius: 8,
                      height: 32,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      background: "var(--bg-slate-50)",
                      border: "1px solid var(--border-slate-200)",
                      color: "var(--text-slate-700)",
                      whiteSpace: "nowrap"
                    }}
                    className="premium-action-btn-secondary"
                  >
                    Import Projects
                  </Button>
                )}
                {canUpdateClient && (
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={() => setIsModalVisible(true)}
                    style={{
                      borderRadius: 8,
                      height: 32,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Initiate Project
                  </Button>
                )}
              </div>
            }
          />
        </div>

        <div style={{ margin: "12px 0 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Input
            placeholder="Search by name or project code..."
            prefix={<Search size={15} style={{ color: "var(--text-slate-400)", marginRight: 8 }} />}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="projects-search-input"
            style={{ width: "320px" }}
            allowClear
          />

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="ptab-segmented">
              <button
                type="button"
                className={viewMode === "grid" ? "is-active" : ""}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "is-active" : ""}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="ptab-divider" />
      </div>

      <ZukvoLoadingOverlay loading={loading} message="">
        {viewMode === "list" ? (
          <div className="pp-table-wrap">
            <Table
              dataSource={filteredProjects}
              columns={columns}
              rowKey="id"
              pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 20, hideOnSinglePage: true }}
              className="pp-table"
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

          </div>
        ) : (
          <div className="pp-grid">
            {filteredProjects.length === 0 ? (
              <div className="ptab-empty-wrapper">
                <div className="ptab-empty">
                  <div className="ptab-empty-icon">
                    <Layers size={26} />
                  </div>
                  <div className="ptab-empty-title">No projects yet</div>
                  <div className="ptab-empty-desc">
                    Initiate the first project under this client to start tracking budget, timelines, and ownership.
                  </div>
                </div>
              </div>
            ) : (
              filteredProjects.map((project) => {
                const name = project.name;
                const initials = (name?.[0] || "").toUpperCase();

                const sKey = project.status || "Draft";
                const statusConfig: any = {
                  Active: { color: "success", icon: <Activity size={10} /> },
                  Draft: { color: "processing", icon: <FileText size={10} /> },
                  "On Hold": { color: "warning", icon: <Clock size={10} /> },
                  Completed: { color: "default", icon: <CheckCircle2 size={10} /> },
                  Closed: { color: "error", icon: <AlertCircle size={10} /> },
                };
                const statusItem = statusConfig[sKey] || { color: "default", icon: null };

                const created = project.createdAt ? dayjs(project.createdAt) : null;
                const updated = project.updatedAt ? dayjs(project.updatedAt) : null;

                const symbol = currencyOptions.find((c) => c.value === project.currency)?.symbol || "$";
                const budget = Number(project.budget || 0);
                const invoiced = Number(project.invoicedAmount || 0);
                const percentage = budget > 0 ? Math.min(100, (invoiced / budget) * 100) : 0;

                return (
                  <div key={project.id} className="pc-card" onClick={() => router.push(`/projects/${project.id}/overview`)}>
                    <div className="pc-top">
                      <div className="pc-avatar" style={{ background: "#3b82f6", color: "#fff", borderRadius: "50%" }}>
                        {initials}
                      </div>
                      <div className="pc-identity-body">
                        <div className="pc-title" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span>{name}</span>
                          <Tag
                            color={statusItem.color}
                            icon={statusItem.icon}
                            style={{ borderRadius: 6, fontWeight: 600, border: 0, fontSize: "10px", padding: "1px 6px", display: "inline-flex", alignItems: "center", gap: 3 }}
                          >
                            {sKey.toUpperCase()}
                          </Tag>
                        </div>
                        <div className="pc-client-line">
                          <span className="pc-client-key">Code:</span>
                          <span className="pc-client-val">{project.code}</span>
                        </div>
                      </div>
                      <Dropdown
                        menu={projectActionMenu(project)}
                        overlayClassName="pp-action-pop"
                        trigger={["click"]}
                        placement="bottomRight"
                      >
                        <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal size={14} />
                        </button>
                      </Dropdown>
                    </div>

                    <div className="pc-foot">
                      <div className="pc-foot-row">
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Created by</span>
                          <Avatar size={16} src={project.createdBy?.avatarUrl || project.createdBy?.avatar} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 8, fontWeight: 700 }}>
                            {(project.createdBy?.name?.[0] || "—").toUpperCase()}
                          </Avatar>
                          <span className="pc-foot-val">{project.createdBy?.name || "—"}</span>
                        </span>
                        <span className="pc-foot-div" />
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Created</span>
                          <span className="pc-foot-val">{created ? created.format("MMM D, YYYY · h:mm A") : "—"}</span>
                        </span>
                        <span className="pc-foot-div" />
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Updated</span>
                          <span className="pc-foot-val">{updated ? updated.format("MMM D, YYYY · h:mm A") : "—"}</span>
                        </span>
                      </div>

                      <div className="pc-foot-row">
                        <span className="pc-foot-item">
                          <Briefcase size={12} style={{ color: "var(--text-slate-400)", flexShrink: 0 }} />
                          <span style={{ fontSize: "11.5px", color: "var(--text-slate-700)" }}>{project.billingType}</span>
                        </span>
                        <span className="pc-foot-div" />
                        <span className="pc-foot-item">
                          <User size={12} style={{ color: "var(--text-slate-400)", flexShrink: 0 }} />
                          <span style={{ fontSize: "11.5px", color: "var(--text-slate-700)", fontWeight: 500 }}>
                            {project.projectManager?.name || (project.projectManager?.first_name ? `${project.projectManager.first_name} ${project.projectManager.last_name}` : "Unassigned")}
                          </span>
                        </span>
                        {project.startDate && (
                          <>
                            <span className="pc-foot-div" />
                            <span className="pc-foot-item">
                              <Calendar size={12} style={{ color: "var(--text-slate-400)", flexShrink: 0 }} />
                              <span style={{ fontSize: "11.5px", color: "var(--text-slate-700)", fontWeight: 500 }}>
                                {dayjs(project.startDate).format("MMM DD, YYYY")}
                              </span>
                            </span>
                          </>
                        )}
                        {budget > 0 && (
                          <>
                            <span className="pc-foot-div" />
                            <span className="pc-foot-item" style={{ gap: "6px" }}>
                              <span style={{ color: "var(--text-slate-500)", fontWeight: 500, fontSize: "11px" }}>Budget: {symbol}{budget.toLocaleString()}</span>
                              <div style={{ width: "36px", display: "inline-flex", alignItems: "center" }}>
                                <Progress
                                  percent={percentage}
                                  size="small"
                                  showInfo={false}
                                  strokeColor="var(--premium-blue)"
                                  trailColor="var(--border-slate-100)"
                                  strokeWidth={3}
                                  style={{ margin: 0 }}
                                />
                              </div>
                              <span style={{ color: "var(--text-slate-600)", fontWeight: 600, fontSize: "10.5px" }}>{Math.round(percentage)}% used</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </ZukvoLoadingOverlay>

      {/* Create Drawer */}
      <>
        <style>{drawerFormStyles}</style>
        <Drawer
          {...commonDrawerProps}
          open={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            form.resetFields();
            resetChecks();
          }}
          destroyOnClose
        >
          <div className="flex flex-col h-full bg-[var(--customers-page-bg,#0B0F1A)]">
            <div className="customer-drawer-header shrink-0 flex items-center justify-between px-6 py-4 border-b border-dashed border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ background: "rgba(59, 130, 246, 0.12)", border: `1px solid rgba(59, 130, 246, 0.22)`, color: "#3b82f6" }}
                >
                  <Layers size={16} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight m-0">Initiate New Project</h2>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 6,
                    padding: "6px 12px",
                    background: `rgba(59,130,246,0.08)`,
                    border: `1px solid rgba(59,130,246,0.22)`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#3b82f6",
                    lineHeight: 1.5,
                  }}>
                    Define scope, leadership, and budget for this engagement
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                  resetChecks();
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 customer-drawer-form">
              <Form
                form={form}
                layout="horizontal"
                labelCol={{ span: 7 }}
                wrapperCol={{ span: 17 }}
                labelAlign="left"
                onFinish={handleCreateProject}
                requiredMark={false}
              >
                <SectionCard
                  title="Identity"
                  subtitle="Provide the project name and code."
                  icon={<Hash size={14} />}
                  step="STEP 1"
                >
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
                </SectionCard>

                <SectionCard
                  title="Leadership & Status"
                  subtitle="Assign a manager and set the initial status."
                  icon={<User size={14} />}
                  step="STEP 2"
                >
                  <Form.Item
                    label="Project manager"
                    name="projectManagerId"
                    rules={[{ required: true, message: "Assignment required" }]}
                  >
                    <SearchableDropdown
                      placeholder="Assign a manager"
                      searchPlaceholder="Search managers..."
                      options={employees.map((emp: any) => ({
                        value: emp.value,
                        label: emp.label,
                        avatarUrl: emp.avatarUrl,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Initial status"
                    name="status"
                    initialValue="Draft"
                    rules={[{ required: true }]}
                  >
                    <SearchableDropdown
                      placeholder="Select status"
                      options={[
                        { value: "Draft", label: "Drafting phase" },
                        { value: "Active", label: "Operational / Active" },
                        { value: "On Hold", label: "Delayed / On hold" },
                        { value: "Completed", label: "Project completed" },
                        { value: "Closed", label: "System closed" },
                      ]}
                    />
                  </Form.Item>
                </SectionCard>

                <SectionCard
                  title="Billing & Budget"
                  subtitle="Set up the billing model and allocated budget."
                  icon={<Wallet size={14} />}
                  step="STEP 3"
                >
                  <Form.Item
                    label="Billing model"
                    name="billingType"
                    rules={[{ required: true }]}
                  >
                    <SearchableDropdown
                      placeholder="Select model"
                      options={[
                        { value: "Hourly", label: "Hourly rate" },
                        { value: "Monthly", label: "Monthly subscription" },
                        { value: "Daily", label: "Daily allowance" },
                        { value: "Fixed", label: "Fixed project cost" },
                        { value: "Non-Billable", label: "Internal / Non-billable" },
                      ]}
                    />
                  </Form.Item>
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
                </SectionCard>

                <SectionCard
                  title="Timeline"
                  subtitle="Specify the start and estimated completion dates."
                  icon={<Calendar size={14} />}
                  step="STEP 4"
                >
                  <Form.Item
                    label="Start date"
                    name="startDate"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <DatePicker style={{ width: "100%" }} placeholder="Commencement" />
                  </Form.Item>
                  <Form.Item label="End date" name="endDate">
                    <DatePicker style={{ width: "100%" }} placeholder="Estimated completion" />
                  </Form.Item>
                </SectionCard>
              </Form>
            </div>

            <div className="customer-drawer-footer shrink-0 px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3 bg-[var(--customers-page-bg,#0B0F1A)]">
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
                resetChecks();
              }} className="border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] bg-transparent">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                onClick={() => form.submit()}
                icon={<Plus size={14} />}
                className="font-medium shadow-sm hover:opacity-90"
              >
                Initialize Project
              </Button>
            </div>
          </div>
        </Drawer>
      </>

      {/* Edit Drawer */}
      <>
        <Drawer
          {...commonDrawerProps}
          open={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            editForm.resetFields();
            setEditingProject(null);
          }}
          destroyOnClose
        >
          <div className="flex flex-col h-full bg-[var(--customers-page-bg,#0B0F1A)]">
            <div className="customer-drawer-header shrink-0 flex items-center justify-between px-6 py-4 border-b border-dashed border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ background: "rgba(59, 130, 246, 0.12)", border: `1px solid rgba(59, 130, 246, 0.22)`, color: "#3b82f6" }}
                >
                  <Edit2 size={16} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight m-0">Update Project Configuration</h2>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 6,
                    padding: "6px 12px",
                    background: `rgba(59,130,246,0.08)`,
                    border: `1px solid rgba(59,130,246,0.22)`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#3b82f6",
                    lineHeight: 1.5,
                  }}>
                    Modify configuration and settings for this project
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalVisible(false);
                  editForm.resetFields();
                  setEditingProject(null);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 customer-drawer-form">
              <Form
                form={editForm}
                layout="horizontal"
                labelCol={{ span: 7 }}
                wrapperCol={{ span: 17 }}
                labelAlign="left"
                onFinish={handleEditProject}
              >
                <SectionCard
                  title="Identity"
                  subtitle="Modify the project name and code."
                  icon={<Hash size={14} />}
                  step="STEP 1"
                >
                  <Form.Item label="Project Name" name="name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Project Code" name="code">
                    <Input disabled />
                  </Form.Item>
                </SectionCard>

                <SectionCard
                  title="Leadership & Status"
                  subtitle="Assign a manager and set the current status."
                  icon={<User size={14} />}
                  step="STEP 2"
                >
                  <Form.Item label="Project Manager" name="projectManagerId" rules={[{ required: true }]}>
                    <SearchableDropdown
                      placeholder="Assign a manager"
                      searchPlaceholder="Search managers..."
                      options={employees.map((emp: any) => ({
                        value: emp.value,
                        label: emp.label,
                        avatarUrl: emp.avatarUrl,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item label="Project Status" name="status" rules={[{ required: true }]}>
                    <SearchableDropdown
                      placeholder="Select status"
                      options={[
                        { value: "Draft", label: "Draft" },
                        { value: "Active", label: "Active" },
                        { value: "On Hold", label: "On Hold" },
                        { value: "Completed", label: "Completed" },
                        { value: "Closed", label: "Closed" },
                      ]}
                    />
                  </Form.Item>
                </SectionCard>

                <SectionCard
                  title="Billing & Budget"
                  subtitle="Adjust the billing model and total budget."
                  icon={<Wallet size={14} />}
                  step="STEP 3"
                >
                  <Form.Item label="Billing Type" name="billingType" rules={[{ required: true }]}>
                    <SearchableDropdown
                      placeholder="Select model"
                      options={[
                        { value: "Hourly", label: "Hourly" },
                        { value: "Monthly", label: "Monthly" },
                        { value: "Daily", label: "Daily" },
                        { value: "Fixed", label: "Fixed" },
                        { value: "Non-Billable", label: "Non-Billable" },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label="Total Budget" name="budget">
                    <InputNumber
                      addonBefore={currencySelector}
                      style={{ width: "100%", display: "flex", alignItems: "center" }}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as unknown as number}
                    />
                  </Form.Item>
                </SectionCard>

                <SectionCard
                  title="Timeline"
                  subtitle="Adjust the start and end dates."
                  icon={<Calendar size={14} />}
                  step="STEP 4"
                >
                  <Form.Item label="Start Date" name="startDate" rules={[{ required: true }]}>
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item label="End Date" name="endDate">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </SectionCard>
              </Form>
            </div>

            <div className="customer-drawer-footer shrink-0 px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3 bg-[var(--customers-page-bg,#0B0F1A)]">
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  editForm.resetFields();
                  setEditingProject(null);
                }}
                className="border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                onClick={() => editForm.submit()}
                icon={<CheckCircle2 size={14} />}
                className="font-medium shadow-sm hover:opacity-90"
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </Drawer>
      </>

      <ImportProjectsModal
        open={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        clientId={clientId}
        messageApi={messageApi}
        onImported={() => {
          setIsImportModalVisible(false);
          fetchProjects();
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        [data-theme="dark"] .pmodal-body .ant-picker,
        [data-theme="dark"] .premium-modal .ant-input,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper,
        [data-theme="dark"] .premium-modal .ant-select-selector,
        [data-theme="dark"] .premium-modal .ant-input-number,
        [data-theme="dark"] .ptab-segmented button.is-active {
          background: var(--bg-slate-900);
          color: #a78bfa;
        }

        /* Proposal Style Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table .ant-table { background: transparent; font-size: 12px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .pp-table .ant-table-thead > tr > th::before { display: none !important; }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-placeholder > td { background: transparent !important; }

        .pp-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        .pp-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

        /* Proposal Style Cards Grid */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }
        .pc-status-tag .anticon { font-size: 9px; }

        /* Dropdown Action Popover */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 200px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

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

        /* Prevent horizontal overflow from edge-to-edge header bleed */
        .cd-tabs .ant-tabs-content-holder {
          overflow-x: hidden !important;
        }

        /* Full bleed header styling flush with vertical sidebar border */
        .projects-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .projects-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .projects-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        /* Borderless/transparent unified search and filter dropdown controls */
        .projects-search-input.ant-input-affix-wrapper {
          height: 32px !important;
          border-radius: 8px !important;
          background: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          box-shadow: none !important;
          transition: all 0.2s ease !important;
          padding: 4px 12px !important;
        }
        .projects-search-input.ant-input-affix-wrapper:hover {
          border-color: var(--border-slate-200) !important;
        }
        .projects-search-input.ant-input-affix-wrapper:focus-within {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
          background: var(--bg-pure-white) !important;
        }
        .projects-search-input .ant-input {
          background: transparent !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: var(--text-slate-800) !important;
        }
        [data-theme="dark"] .projects-search-input.ant-input-affix-wrapper {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .projects-search-input.ant-input-affix-wrapper:hover {
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .projects-search-input.ant-input-affix-wrapper:focus-within {
          background: var(--bg-slate-900) !important;
          border-color: #8b5cf6 !important;
        }

        /* Input Fields Inside Modals (Add/Edit and Initialize Modal) */
        .pmodal-body .ant-input-affix-wrapper,
        .pmodal-body .ant-select-selector,
        .pmodal-body .ant-input-number,
        .pmodal-body .ant-picker,
        .premium-modal .ant-input-affix-wrapper,
        .premium-modal .ant-select-selector,
        .premium-modal .ant-input-number,
        .premium-modal .ant-picker {
          border: 1px solid var(--border-slate-200) !important;
        }
        .pmodal-body .ant-input,
        .premium-modal .ant-input {
          border: 1px solid var(--border-slate-200) !important;
        }
        .pmodal-body .ant-input-affix-wrapper .ant-input,
        .pmodal-body .ant-input-affix-wrapper .ant-input:focus,
        .pmodal-body .ant-input-affix-wrapper .ant-input:hover,
        .premium-modal .ant-input-affix-wrapper .ant-input,
        .premium-modal .ant-input-affix-wrapper .ant-input:focus,
        .premium-modal .ant-input-affix-wrapper .ant-input:hover,
        .pmodal-body .ant-input-number .ant-input-number-input,
        .pmodal-body .ant-input-number .ant-input-number-input:focus,
        .pmodal-body .ant-input-number .ant-input-number-input:hover,
        .premium-modal .ant-input-number .ant-input-number-input,
        .premium-modal .ant-input-number .ant-input-number-input:focus,
        .premium-modal .ant-input-number .ant-input-number-input:hover {
          border: 0 !important;
          border-width: 0 !important;
          box-shadow: none !important;
        }

        /* Unified styling for inputs with addons (e.g. Budget Input) */
        .pmodal-body .ant-input-number-group-wrapper,
        .premium-modal .ant-input-number-group-wrapper {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 10px !important;
          background: var(--bg-slate-50) !important;
          transition: all 0.2s ease !important;
          overflow: hidden !important;
          display: block !important;
          width: 100% !important;
        }
        .pmodal-body .ant-input-number-group-wrapper:hover,
        .premium-modal .ant-input-number-group-wrapper:hover {
          border-color: rgba(139, 92, 246, 0.45) !important;
        }
        .pmodal-body .ant-input-number-group-wrapper-focused,
        .premium-modal .ant-input-number-group-wrapper-focused,
        .pmodal-body .ant-input-number-group-wrapper:focus-within,
        .premium-modal .ant-input-number-group-wrapper:focus-within {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
          background: var(--bg-pure-white) !important;
        }

        /* Reset inner elements of the group input */
        .pmodal-body .ant-input-number-group-wrapper .ant-input-number,
        .premium-modal .ant-input-number-group-wrapper .ant-input-number {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          width: 100% !important;
        }
        .pmodal-body .ant-input-number-group-wrapper .ant-input-number-group-addon,
        .premium-modal .ant-input-number-group-wrapper .ant-input-number-group-addon {
          background: transparent !important;
          border: none !important;
          border-right: 1px solid var(--border-slate-200) !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        .pmodal-body .ant-input-number-group-wrapper .ant-select-selector,
        .premium-modal .ant-input-number-group-wrapper .ant-select-selector {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          height: 36px !important;
          display: flex !important;
          align-items: center !important;
        }

        /* Input Hover state */
        .pmodal-body .ant-input:hover,
        .pmodal-body .ant-input-affix-wrapper:hover,
        .pmodal-body .ant-select:hover .ant-select-selector,
        .pmodal-body .ant-input-number:hover,
        .pmodal-body .ant-picker:hover,
        .premium-modal .ant-input:hover,
        .premium-modal .ant-input-affix-wrapper:hover,
        .premium-modal .ant-select:hover .ant-select-selector,
        .premium-modal .ant-input-number:hover,
        .premium-modal .ant-picker:hover {
          border-color: rgba(139, 92, 246, 0.45) !important;
        }

        /* Input Focus state */
        .pmodal-body .ant-input-affix-wrapper-focused,
        .pmodal-body .ant-select-focused .ant-select-selector,
        .pmodal-body .ant-input-number-focused,
        .pmodal-body .ant-picker-focused,
        .pmodal-body .ant-input:focus,
        .premium-modal .ant-input-affix-wrapper-focused,
        .premium-modal .ant-select-focused .ant-select-selector,
        .premium-modal .ant-input-number-focused,
        .premium-modal .ant-picker-focused,
        .premium-modal .ant-input:focus,
        .premium-modal .ant-input-affix-wrapper:focus-within {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
          background: var(--bg-pure-white) !important;
        }

        /* Dark theme overrides for inputs */
        [data-theme="dark"] .pmodal-body .ant-input,
        [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper,
        [data-theme="dark"] .pmodal-body .ant-select-selector,
        [data-theme="dark"] .pmodal-body .ant-input-number,
        [data-theme="dark"] .pmodal-body .ant-picker,
        [data-theme="dark"] .premium-modal .ant-input,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper,
        [data-theme="dark"] .premium-modal .ant-select-selector,
        [data-theme="dark"] .premium-modal .ant-input-number,
        [data-theme="dark"] .premium-modal .ant-picker {
          background: var(--bg-primary) !important;
          border-color: var(--border-slate-200) !important;
          color: var(--text-slate-900) !important;
        }
        
        [data-theme="dark"] .pmodal-body .ant-input:hover,
        [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper:hover,
        [data-theme="dark"] .pmodal-body .ant-select:hover .ant-select-selector,
        [data-theme="dark"] .pmodal-body .ant-input-number:hover,
        [data-theme="dark"] .pmodal-body .ant-picker:hover,
        [data-theme="dark"] .premium-modal .ant-input:hover,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper:hover,
        [data-theme="dark"] .premium-modal .ant-select:hover .ant-select-selector,
        [data-theme="dark"] .premium-modal .ant-input-number:hover,
        [data-theme="dark"] .premium-modal .ant-picker:hover {
          border-color: rgba(167, 139, 250, 0.55) !important;
        }

        [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper-focused,
        [data-theme="dark"] .pmodal-body .ant-select-focused .ant-select-selector,
        [data-theme="dark"] .pmodal-body .ant-input-number-focused,
        [data-theme="dark"] .pmodal-body .ant-picker-focused,
        [data-theme="dark"] .pmodal-body .ant-input:focus,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper-focused,
        [data-theme="dark"] .premium-modal .ant-select-focused .ant-select-selector,
        [data-theme="dark"] .premium-modal .ant-input-number-focused,
        [data-theme="dark"] .premium-modal .ant-picker-focused,
        [data-theme="dark"] .premium-modal .ant-input:focus,
        [data-theme="dark"] .premium-modal .ant-input-affix-wrapper:focus-within {
          border-color: #a78bfa !important;
          box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.18) !important;
          background: var(--bg-secondary) !important;
        }

        /* Dark theme overrides for addon group */
        [data-theme="dark"] .pmodal-body .ant-input-number-group-wrapper,
        [data-theme="dark"] .premium-modal .ant-input-number-group-wrapper {
          background: var(--bg-primary) !important;
          border-color: var(--border-slate-200) !important;
        }
        [data-theme="dark"] .pmodal-body .ant-input-number-group-wrapper:hover,
        [data-theme="dark"] .premium-modal .ant-input-number-group-wrapper:hover {
          border-color: rgba(167, 139, 250, 0.55) !important;
        }
        [data-theme="dark"] .pmodal-body .ant-input-number-group-wrapper-focused,
        [data-theme="dark"] .premium-modal .ant-input-number-group-wrapper-focused,
        [data-theme="dark"] .pmodal-body .ant-input-number-group-wrapper:focus-within,
        [data-theme="dark"] .premium-modal .ant-input-number-group-wrapper:focus-within {
          border-color: #a78bfa !important;
          box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.18) !important;
          background: var(--bg-secondary) !important;
        }
        [data-theme="dark"] .pmodal-body .ant-input-number-group-wrapper .ant-input-number-group-addon,
        [data-theme="dark"] .premium-modal .ant-input-number-group-wrapper .ant-input-number-group-addon {
          border-right: 1px solid var(--border-slate-200) !important;
        }

        /* Import Projects Modal Custom Styling Overrides for Theme Adaptivity */
        html body .import-project-search-input {
          background-color: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          color: var(--text-slate-900) !important;
          height: 32px !important;
          border-radius: 8px !important;
        }
        html body .import-project-search-input .ant-input {
          background-color: transparent !important;
          color: var(--text-slate-900) !important;
        }
        html body .import-project-search-input:hover,
        html body .import-project-search-input:focus {
          border-color: #8b5cf6 !important;
        }
        [data-theme="dark"] html body .import-project-search-input {
          background-color: var(--bg-secondary) !important;
          border: 1px solid var(--border-slate-800) !important;
        }
        
        html body .import-project-row {
          background-color: transparent !important;
          transition: background 0.15s ease !important;
        }
        html body .import-project-row:hover {
          background-color: var(--bg-slate-100) !important;
        }
        html body .import-project-row.selected {
          background-color: rgba(139, 92, 246, 0.12) !important;
        }
        [data-theme="dark"] html body .import-project-row:hover {
          background-color: var(--bg-secondary) !important;
        }

        html body .import-project-cancel-btn {
          background-color: transparent !important;
          border: 1px solid var(--border-slate-200) !important;
          color: var(--text-slate-700) !important;
        }
        [data-theme="dark"] html body .import-project-cancel-btn {
          color: var(--text-slate-300) !important;
          border-color: var(--border-slate-800) !important;
        }
      `}} />
    </div>
  );
}

/* ====================================================================== */
/*  Import Projects modal — pick from existing tenant projects that aren't */
/*  already linked to this client.                                          */
/* ====================================================================== */

function ImportProjectsModal({
  open,
  onClose,
  clientId,
  onImported,
  messageApi,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onImported: () => void;
  messageApi: any;
}) {
  const [items, setItems] = useState<ImportableProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reload = async (q?: string) => {
    setLoading(true);
    try {
      const data = await ClientV2Service.getImportableProjects(clientId, q);
      setItems(data || []);
    } catch (err: any) {
      messageApi.error(`Failed to load projects: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected([]);
      setItems([]);
      return;
    }
    reload("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounce search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => reload(search), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggle = (id: string) => {
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  const submit = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      const res = await ClientV2Service.importProjects(clientId, selected);
      messageApi.success(
        `Linked ${res.linked} project${res.linked === 1 ? "" : "s"}${res.skipped > 0 ? ` · ${res.skipped} already linked, skipped` : ""
        }`
      );
      onImported();
    } catch (err: any) {
      messageApi.error(`Import failed: ${err?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={680}
      closable={false}
      styles={{
        mask: { backgroundColor: "rgba(15,23,42,0.45)" },
        content: {
          background: "var(--bg-pure-white, #ffffff)",
          border: "1px solid var(--border-slate-200, #e5e7eb)",
          padding: 0,
          overflow: "hidden",
        },
        body: { padding: 0 },
      }}
    >
      {/* Accent ribbon */}
      <div style={{ height: 3, background: "#8b5cf6" }} />

      {/* Header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border-slate-100, #e5e7eb)",
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: "rgba(139, 92, 246, 0.1)",
            color: "#8b5cf6",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FolderInputIcon size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-slate-900, #0f172a)",
              letterSpacing: "-0.01em",
            }}
          >
            Import existing projects
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12.5,
              color: "var(--text-slate-500, #64748b)",
              lineHeight: 1.55,
            }}
          >
            Link projects already in this workspace to this client. A project
            can be shared with multiple clients — importing here doesn&apos;t
            unlink it from any others.
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 18 }}>
        <Input
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<Search size={14} color="var(--text-slate-400, #94a3b8)" />}
          placeholder="Search by project name or code…"
          className="import-project-search-input"
          style={{ marginBottom: 12 }}
        />

        <div
          style={{
            border: "1px solid var(--border-slate-200, #e5e7eb)",
            borderRadius: 10,
            maxHeight: 380,
            overflowY: "auto",
            background: "var(--bg-slate-50, #f8fafc)",
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--text-slate-500, #64748b)",
                fontSize: 13,
              }}
            >
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--text-slate-500, #64748b)",
                fontSize: 13,
              }}
            >
              {search
                ? `No projects match "${search}".`
                : "Every project in this workspace is already linked to this client."}
            </div>
          ) : (
            items.map((p, i) => {
              const isSelected = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`import-project-row ${isSelected ? "selected" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px",
                    border: "none",
                    borderTop: i === 0 ? "none" : "1px solid var(--border-slate-100, #e5e7eb)",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    transition: "background 120ms ease",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: isSelected ? "#8b5cf6" : "var(--bg-pure-white, #ffffff)",
                      border: `1px solid ${isSelected ? "#8b5cf6" : "var(--border-slate-300, #cbd5e1)"
                        }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <CheckCircle2 size={12} color="#ffffff" strokeWidth={3} />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--text-slate-900, #0f172a)",
                        }}
                      >
                        {p.name}
                      </span>
                      {p.code && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: "1px 7px",
                            background: "var(--bg-slate-100, #f1f5f9)",
                            border: "1px solid var(--border-slate-200, #e2e8f0)",
                            color: "var(--text-slate-700, #475569)",
                            borderRadius: 999,
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, monospace",
                          }}
                        >
                          {p.code}
                        </span>
                      )}
                      {p.otherClientCount > 0 && (
                        <Tooltip
                          title={`Already linked to ${p.otherClientCount} other client${p.otherClientCount === 1 ? "" : "s"
                            }`}
                        >
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 500,
                              padding: "1px 7px",
                              background: "rgba(139, 92, 246, 0.1)",
                              border: "1px solid rgba(139, 92, 246, 0.2)",
                              color: "#8b5cf6",
                              borderRadius: 999,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Link2 size={10} />
                            Shared
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 11.5,
                        color: "var(--text-slate-50, #64748b)",
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span>Status: {p.status}</span>
                      {p.projectManagerName && (
                        <>
                          <span style={{ color: "var(--border-slate-200, #cbd5e1)" }}>·</span>
                          <span>PM: {p.projectManagerName}</span>
                        </>
                      )}
                      {p.startDate && (
                        <>
                          <span style={{ color: "var(--border-slate-200, #cbd5e1)" }}>·</span>
                          <span>
                            Started {dayjs(p.startDate).format("MMM D, YYYY")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selected.length > 0 && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              background: "rgba(139, 92, 246, 0.1)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              color: "#8b5cf6",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            {selected.length} project{selected.length === 1 ? "" : "s"}{" "}
            selected
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--border-slate-100, #e5e7eb)",
          padding: "12px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          background: "var(--bg-pure-white, #ffffff)",
        }}
      >
        <span style={{ fontSize: 11.5, color: "var(--text-slate-400, #94a3b8)" }}>
          {items.length} project{items.length === 1 ? "" : "s"} available
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={onClose} className="import-project-cancel-btn">Cancel</Button>
          <Button
            type="primary"
            disabled={selected.length === 0 || submitting}
            loading={submitting}
            onClick={submit}
            icon={<FolderInputIcon size={14} />}
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              borderColor: "transparent",
            }}
          >
            {selected.length > 0
              ? `Import ${selected.length} project${selected.length === 1 ? "" : "s"
              }`
              : "Import"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
