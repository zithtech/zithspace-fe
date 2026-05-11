"use client";

import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import {
  Card,
  Table,
  Button,
  Typography,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Alert,
  Drawer,
  Checkbox,
  Divider,
  Tooltip,
  Badge,
  Popconfirm,
  Spin,
  Row,
  Col,
  Select,
  Avatar,
  List,
} from "antd";
import {
  SafetyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UserOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  TeamOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { RBACService, RBACRole, RBACPermission, RBACRoleDetail } from "@/services/rbacService";
import { MembersService } from "@/services/membersService";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

const { Title, Text } = Typography;
const { TextArea } = Input;

/** Human-readable label per permission resource. */
const RESOURCE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  integration: "Integrations",
  user: "Users / Members",
  project: "Projects",
  ticket: "Tickets",
  attendance: "Attendance",
  leave: "Leaves",
  shift: "Shifts",
  invoice:      "Invoices",
  account:      "Accounts & Finance",
  client:       "Clients / CRM",
  settings:     "General Settings",
  role:         "Roles & RBAC",
  report:       "Reports / Analytics",
  reimbursement: "Reimbursements",
  payroll:      "Payroll / Payslips",
  salary:       "Salary Structures",
  document:     "Documents / Hub",
  onboarding:   "Onboarding",
  timesheet:    "Timesheet",
  org:          "Org Structure",
  daily_update: "Daily Updates",
  squad:        "Squad Management",
  lead:         "Lead Management",
  proposal:     "Proposals",
  vendor:       "Vendors",
  escalation:   "Escalations",
  pipeline:     "Sales Pipeline",
  exit:         "Employee Exit",
  performance:  "Performance",
  opening:      "Opening Management",
  profile:      "User Profile",
  mail:         "Mail Settings",
  calendar:     "Calendar Settings",
  chat:         "Internal Chat",
  skills:       "Skills Portal",
  notification: "Notifications",
  bookmark:     "Bookmarks",
  time_tracking: "Time Tracking",
};

/** Logical grouping for permissions drawer */
const PERMISSION_MODULES = [
  {
    title: "Home",
    icon: <PlusOutlined />, // Placeholder or appropriate icon
    resources: ["dashboard", "integration", "mail", "calendar", "chat", "skills", "notification", "bookmark", "time_tracking"]
  },
  {
    title: "Work",
    resources: ["project", "ticket", "timesheet", "daily_update", "document", "proposal", "squad", "escalation", "lead", "pipeline"]
  },
  {
    title: "HRMS",
    resources: ["user", "attendance", "leave", "shift", "onboarding", "exit", "org", "performance", "opening", "profile"]
  },
  {
    title: "Finance",
    resources: ["invoice", "account", "reimbursement", "payroll", "salary", "vendor"]
  },
  {
    title: "Admin",
    resources: ["client", "settings", "role", "report"]
  }
];

export default function RolesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { canReadRole, canCreateRole, canUpdateRole, canDeleteRole, canAssignRole } = usePermission();

  const [roles, setRoles] = useState<RBACRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<Record<string, RBACPermission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Create role modal ──────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  // ── Edit role modal (name/description) ────────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<RBACRole | null>(null);
  const [editForm] = Form.useForm();

  // ── Members drawer ─────────────────────────────────────────────────────────
  const [membersDrawerRole, setMembersDrawerRole] = useState<RBACRole | null>(null);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [membersDrawerLoading, setMembersDrawerLoading] = useState(false);
  const [roleMembers, setRoleMembers] = useState<RBACRoleDetail["userRoles"]>([]);
  const [allMembers, setAllMembers] = useState<Array<{ value: string; label: string }>>([]);
  const [assigningMemberId, setAssigningMemberId] = useState<string | undefined>(undefined);
  const [assignLoading, setAssignLoading] = useState(false);

  // ── Permissions drawer ─────────────────────────────────────────────────────
  const [drawerRole, setDrawerRole] = useState<RBACRole | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerLoadingPerms, setDrawerLoadingPerms] = useState(false);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  // ── Auto-clear messages ────────────────────────────────────────────────────
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  // Calculate role stats
  const roleStats = React.useMemo(() => {
    return {
      total: roles.length,
      system: roles.filter(r => r.isSystem).length,
      custom: roles.filter(r => !r.isSystem).length,
      permissions: Object.values(allPermissions).flat().length
    };
  }, [roles, allPermissions]);

  // ── Route guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && user && !canReadRole) {
      router.push("/dashboard");
    }
  }, [user, isLoading, canReadRole, router]);

  // ── Initial data fetch ─────────────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await RBACService.listRoles();
      setRoles(data);
    } catch {
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const { grouped } = await RBACService.listPermissions();
      setAllPermissions(grouped);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchRoles();
      fetchPermissions();
    }
  }, [user, fetchRoles, fetchPermissions]);

  // ── Members drawer logic ───────────────────────────────────────────────────
  const openMembersDrawer = async (role: RBACRole) => {
    setMembersDrawerRole(role);
    setMembersDrawerOpen(true);
    setRoleMembers([]);
    setAssigningMemberId(undefined);
    setMembersDrawerLoading(true);
    try {
      const [fullRole, selectMembers] = await Promise.all([
        RBACService.getRoleById(role.id),
        MembersService.getMembersForSelect(),
      ]);
      setRoleMembers(fullRole.userRoles);
      setAllMembers(selectMembers.map((m) => ({ value: m.value, label: m.label })));
    } catch {
      setError("Failed to load role members");
    } finally {
      setMembersDrawerLoading(false);
    }
  };

  const handleAssignMember = async () => {
    if (!membersDrawerRole || !assigningMemberId) return;
    try {
      setAssignLoading(true);
      await RBACService.assignRoleToUser(assigningMemberId, membersDrawerRole.id);
      setSuccess(`Role assigned`);
      setAssigningMemberId(undefined);
      // Refresh member list
      const full = await RBACService.getRoleById(membersDrawerRole.id);
      setRoleMembers(full.userRoles);
      fetchRoles();
    } catch (err: any) {
      setError(err?.message || "Failed to assign role");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!membersDrawerRole) return;
    try {
      await RBACService.removeRoleFromUser(userId, membersDrawerRole.id);
      setRoleMembers((prev) => prev.filter((ur) => ur.user.id !== userId));
      fetchRoles();
    } catch (err: any) {
      setError(err?.message || "Failed to remove member from role");
    }
  };


  // ── Create role ────────────────────────────────────────────────────────────
  const handleCreateRole = async (values: { name: string; description?: string }) => {
    try {
      setCreateLoading(true);
      await RBACService.createRole(values);
      setSuccess("Role created successfully");
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchRoles();
    } catch (err: any) {
      setError(err?.message || "Failed to create role");
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit role (name/desc) ──────────────────────────────────────────────────
  const openEditModal = (role: RBACRole) => {
    setEditingRole(role);
    editForm.setFieldsValue({ name: role.name, description: role.description || "" });
    setEditModalOpen(true);
  };

  const handleEditRole = async (values: { name: string; description?: string }) => {
    if (!editingRole) return;
    try {
      setEditLoading(true);
      await RBACService.updateRole(editingRole.id, values);
      setSuccess("Role updated");
      setEditModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      setError(err?.message || "Failed to update role");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete role ────────────────────────────────────────────────────────────
  const handleDeleteRole = async (roleId: string) => {
    try {
      await RBACService.deleteRole(roleId);
      setSuccess("Role deleted");
      fetchRoles();
    } catch (err: any) {
      setError(err?.message || "Failed to delete role");
    }
  };

  // ── Permissions drawer ─────────────────────────────────────────────────────
  const openPermissionsDrawer = async (role: RBACRole) => {
    setDrawerRole(role);
    setDrawerOpen(true);
    setSelectedPermIds([]);
    setDrawerLoadingPerms(true);
    try {
      const full = await RBACService.getRoleById(role.id);
      setSelectedPermIds(full.rolePermissions.map((rp) => rp.permission.id));
    } catch {
      setError("Failed to load role permissions");
    } finally {
      setDrawerLoadingPerms(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!drawerRole) return;
    try {
      setDrawerSaving(true);
      await RBACService.setRolePermissions(drawerRole.id, selectedPermIds);
      setSuccess(`Permissions saved for "${drawerRole.name}"`);
      setDrawerOpen(false);
      fetchRoles();
    } catch (err: any) {
      setError(err?.message || "Failed to save permissions");
    } finally {
      setDrawerSaving(false);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleResource = (perms: RBACPermission[]) => {
    const ids = perms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPermIds.includes(id));
    if (allSelected) {
      setSelectedPermIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPermIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const selectAll = () => {
    const all = Object.values(allPermissions).flatMap((perms) => perms.map((p) => p.id));
    setSelectedPermIds(all);
  };

  const clearAll = () => setSelectedPermIds([]);

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnsType<RBACRole> = [
    {
      title: "Role Name",
      key: "name",
      width: 250,
      render: (_, record) => (
        <Space size={12}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: record.isSystem ? "var(--bg-blue-50)" : "var(--bg-green-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: record.isSystem ? "var(--premium-blue)" : "var(--text-holiday)",
              fontSize: 18,
            }}
          >
            <SafetyOutlined />
          </div>
          <div>
            <Space size={4} align="center">
              <Text strong style={{ fontSize: 14, letterSpacing: '-0.2px', color: 'var(--text-slate-900)' }}>
                {record.name}
              </Text>
              {record.isSystem && (
                <Tag bordered={false} color="blue" style={{ fontSize: 10, borderRadius: 4 }}>
                  SYSTEM
                </Tag>
              )}
            </Space>
            <div style={{ marginTop: -2 }}>
              <Text style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-slate-400)' }}>
                {record.slug}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => (
        <Text style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>
          {text || "—"}
        </Text>
      ),
    },
    {
      title: "Permissions",
      key: "perms",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Badge
          count={record._count?.rolePermissions ?? 0}
          style={{ backgroundColor: "var(--premium-blue)" }}
          overflowCount={999}
          showZero
        />
      ),
    },
    {
      title: "Members",
      key: "users",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          <UserOutlined style={{ color: "var(--text-slate-400)", fontSize: 12 }} />
          <Text style={{ fontSize: 12, color: 'var(--text-slate-900)' }}>{record._count?.userRoles ?? 0}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 80,
      render: (_, record) => (
        <Tag color={record.isActive ? "green" : "default"} style={{ fontSize: 10 }}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          {canAssignRole && (
            <Tooltip title="Manage members">
              <Button
                type="text"
                icon={<TeamOutlined />}
                size="small"
                onClick={() => openMembersDrawer(record)}
              />
            </Tooltip>
          )}
          {canUpdateRole && (
            <Tooltip title="Edit name / description">
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => openEditModal(record)}
                disabled={record.isSystem}
              />
            </Tooltip>
          )}
          {canUpdateRole && (
            <Tooltip title="Edit permissions">
              <Button
                type="text"
                icon={<SafetyOutlined />}
                size="small"
                onClick={() => openPermissionsDrawer(record)}
              />
            </Tooltip>
          )}
          {canDeleteRole && !record.isSystem && (
            <Popconfirm
              title="Delete this role?"
              description="All members assigned this role will lose its permissions immediately."
              onConfirm={() => handleDeleteRole(record.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete role">
                <Button type="text" icon={<DeleteOutlined />} size="small" danger />
              </Tooltip>
            </Popconfirm>
          )}
          {record.isSystem && (
            <Tooltip title="System roles cannot be deleted or renamed">
              <LockOutlined style={{ color: "var(--text-slate-300)" }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];


  // ── Render ─────────────────────────────────────────────────────────────────
  if (!user || isLoading || !canReadRole) {
    if (isLoading) return <LoadingSpinner message="Loading roles..." />;
    return null;
  }

  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        backgroundColor: 'var(--bg-pure-white)',
        minHeight: 'calc(100vh - 64px)'
      }}>
        <TimeTrackingHeader
          style={{ padding: '8.5px 32px' }}
          icon={<SafetyOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
          title="Roles & Permissions"
          description="Manage and oversee system-wide access control and role assignments"
          extra={
            canCreateRole ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
                size="large"
                style={{ borderRadius: 8 }}
              >
                Create Role
              </Button>
            ) : null
          }
        />

        <div style={{ padding: "24px 32px 32px 32px" }}>

          {/* Stats Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid var(--border-slate-100)', boxShadow: 'none', background: 'var(--bg-pure-white)' }} styles={{ body: { padding: '16px 20px' } }}>
                <Space direction="vertical" size={4}>
                  <Text style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-slate-500)' }}>Total Roles</Text>
                  <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--text-slate-900)' }}>{roleStats.total}</Title>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid var(--border-slate-100)', boxShadow: 'none', background: 'var(--bg-pure-white)' }} styles={{ body: { padding: '16px 20px' } }}>
                <Space direction="vertical" size={4}>
                  <Text style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-slate-500)' }}>System Roles</Text>
                  <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--premium-blue)' }}>{roleStats.system}</Title>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid var(--border-slate-100)', boxShadow: 'none', background: 'var(--bg-pure-white)' }} styles={{ body: { padding: '16px 20px' } }}>
                <Space direction="vertical" size={4}>
                  <Text style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-slate-500)' }}>Custom Roles</Text>
                  <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--text-holiday)' }}>{roleStats.custom}</Title>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ borderRadius: 12, border: '1px solid var(--border-slate-100)', boxShadow: 'none', background: 'var(--bg-pure-white)' }} styles={{ body: { padding: '16px 20px' } }}>
                <Space direction="vertical" size={4}>
                  <Text style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-slate-500)' }}>Total Permissions</Text>
                  <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--warning-yellow, #faad14)' }}>{roleStats.permissions}</Title>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Alerts */}
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16, fontSize: 13, borderRadius: 8 }}
              onClose={() => setError("")}
            />
          )}
          {success && (
            <Alert
              message={success}
              type="success"
              showIcon
              closable
              style={{ marginBottom: 16, fontSize: 13, borderRadius: 8 }}
              onClose={() => setSuccess("")}
            />
          )}

          {/* Roles Table Container */}
          <Card
            bordered={false}
            style={{
              marginBottom: 16,
              borderRadius: 12,
              border: '1px solid var(--border-slate-100)',
              boxShadow: 'none',
              background: 'var(--bg-pure-white)'
            }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={columns}
              dataSource={roles}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 1000 }}
            />
          </Card>
        </div>

        {/* ── Create Role Modal ── */}
        <Modal
          title="Create New Role"
          open={createModalOpen}
          onCancel={() => {
            setCreateModalOpen(false);
            createForm.resetFields();
          }}
          footer={null}
          width={480}
        >
          <Form form={createForm} layout="vertical" onFinish={handleCreateRole} style={{ marginTop: 16 }}>
            <Form.Item
              name="name"
              label="Role Name"
              rules={[{ required: true, message: "Please enter a role name" }]}
            >
              <Input placeholder="e.g. Project Manager" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <TextArea
                rows={3}
                placeholder="Describe what this role can do..."
                maxLength={200}
                showCount
              />
            </Form.Item>
            <div style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setCreateModalOpen(false);
                    createForm.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={createLoading}>
                  Create Role
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>

        {/* ── Edit Role Modal ── */}
        <Modal
          title={`Edit Role — ${editingRole?.name}`}
          open={editModalOpen}
          onCancel={() => setEditModalOpen(false)}
          footer={null}
          width={480}
        >
          <Form form={editForm} layout="vertical" onFinish={handleEditRole} style={{ marginTop: 16 }}>
            <Form.Item
              name="name"
              label="Role Name"
              rules={[{ required: true, message: "Please enter a role name" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <TextArea rows={3} maxLength={200} showCount />
            </Form.Item>
            <div style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={editLoading}>
                  Save Changes
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>

        {/* ── Permissions Drawer ── */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--bg-blue-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--premium-blue)',
                fontSize: 24,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}>
                <SafetyOutlined />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Space size={8}>
                  <Text strong style={{ fontSize: 20, color: 'var(--text-slate-900)', letterSpacing: '-0.5px' }}>
                    Access Control: {drawerRole?.name}
                  </Text>
                  {drawerRole?.isSystem && (
                    <Tag color="blue" bordered={false} style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>SYSTEM ROLE</Tag>
                  )}
                </Space>
                <Text style={{ fontSize: 13, fontWeight: 400, marginTop: 2, color: 'var(--text-slate-500)' }}>
                  Define granular permissions and operational limits for this role.
                </Text>
              </div>
            </div>
          }
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={820}
          styles={{
            header: { borderBottom: '1px solid var(--border-slate-100)', padding: '24px 32px', background: 'var(--bg-pure-white)' },
            body: { padding: '0 0 80px 0', background: 'var(--bg-secondary)' },
            footer: { borderTop: '1px solid var(--border-slate-100)', padding: '16px 32px', background: 'var(--bg-pure-white)' }
          }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => setDrawerOpen(false)} size="large" style={{ borderRadius: 10, padding: '0 24px' }}>
                Cancel
              </Button>
              {canUpdateRole && (
                <Button
                  type="primary"
                  size="large"
                  loading={drawerSaving}
                  onClick={handleSavePermissions}
                  style={{ borderRadius: 10, padding: '0 32px', fontWeight: 600, background: 'var(--premium-blue)' }}
                >
                  Save Configuration
                </Button>
              )}
            </div>
          }
        >
          {drawerLoadingPerms ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <Spin tip="Loading permissions">
                <div style={{ height: 40 }} />
              </Spin>
            </div>
          ) : (
            <div>
              {/* Selection Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 24px",
                  background: "var(--bg-slate-50)",
                  borderBottom: "1px solid var(--border-slate-100)",
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  marginBottom: 16
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-slate-900)' }}>
                  <Badge
                    count={selectedPermIds.length}
                    style={{ backgroundColor: 'var(--premium-blue)', marginRight: 8 }}
                  />
                  Permissions Selected
                </Text>
                {canUpdateRole && (
                  <Space size={16}>
                    <Button
                      type="link"
                      size="small"
                      icon={<CheckSquareOutlined />}
                      onClick={selectAll}
                      style={{ fontSize: 12, padding: 0 }}
                    >
                      Select All
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<BorderOutlined />}
                      onClick={clearAll}
                      style={{ fontSize: 12, padding: 0, color: '#ff4d4f' }}
                    >
                      Clear All
                    </Button>
                  </Space>
                )}
              </div>

              {/* Permission Groups */}
              <div style={{ padding: '24px 32px' }}>
                {PERMISSION_MODULES.map((module) => {
                  const moduleResources = module.resources.filter(r => allPermissions[r]);
                  if (moduleResources.length === 0) return null;

                  return (
                    <div key={module.title} style={{ marginBottom: 40 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 6, height: 24, background: 'var(--premium-blue)', borderRadius: 3 }} />
                        <Title level={4} style={{ margin: 0, fontSize: 18, color: 'var(--text-slate-900)', letterSpacing: '-0.3px' }}>
                          {module.title} Module
                        </Title>
                      </div>

                      {moduleResources.map((resource) => {
                        const perms = allPermissions[resource];
                        const label = RESOURCE_LABELS[resource] || resource;
                        const selectedCount = perms.filter((p) => selectedPermIds.includes(p.id)).length;
                        const allInGroup = selectedCount === perms.length;
                        const someInGroup = selectedCount > 0 && !allInGroup;

                        // Group by sub-resource
                        const subGroups: Record<string, RBACPermission[]> = {};
                        perms.forEach(p => {
                          const parts = p.name.split('.');
                          let subKey = `${label} Management`;
                          if (parts.length > 2) {
                            subKey = parts[1].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Management';
                          }
                          if (!subGroups[subKey]) subGroups[subKey] = [];
                          subGroups[subKey].push(p);
                        });

                        return (
                          <div
                            key={resource}
                            style={{
                              marginBottom: 24,
                              border: '1px solid var(--border-slate-200)',
                              borderRadius: 16,
                              overflow: 'hidden',
                              background: 'var(--bg-pure-white)',
                              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                            }}
                          >
                            {/* Group Header */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: 'space-between',
                                padding: "14px 20px",
                                background: 'var(--bg-slate-50)',
                                borderBottom: '1px solid var(--border-slate-100)'
                              }}
                            >
                              <Space size={14}>
                                <Checkbox
                                  checked={allInGroup}
                                  indeterminate={someInGroup}
                                  onChange={() => toggleResource(perms)}
                                  disabled={!canUpdateRole}
                                  style={{ transform: 'scale(1.1)' }}
                                />
                                <Text strong style={{ fontSize: 15, color: 'var(--text-slate-900)' }}>
                                  {label}
                                </Text>
                              </Space>
                              <Badge
                                count={`${selectedCount} / ${perms.length}`}
                                style={{ backgroundColor: selectedCount === perms.length ? 'var(--text-holiday)' : 'var(--text-slate-400)', boxShadow: 'none' }}
                              />
                            </div>

                            {/* Sub-groups within Resource */}
                            <div style={{ padding: '20px' }}>
                              {Object.entries(subGroups).map(([subTitle, subPerms], idx) => (
                                <div key={subTitle} style={{ marginBottom: idx === Object.entries(subGroups).length - 1 ? 0 : 24 }}>
                                  <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px dashed var(--border-slate-100)' }}>
                                    <Text strong style={{ fontSize: 13, color: 'var(--premium-blue)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                      {subTitle}
                                    </Text>
                                  </div>
                                  <Row gutter={[16, 16]}>
                                    {subPerms.map((perm) => (
                                      <Col key={perm.id} xs={24} sm={12} lg={8}>
                                        <div 
                                          onClick={() => canUpdateRole && togglePermission(perm.id)}
                                          style={{
                                            padding: '10px 14px',
                                            borderRadius: 10,
                                            border: '1px solid transparent',
                                            background: selectedPermIds.includes(perm.id) ? 'var(--bg-blue-50)' : 'var(--bg-slate-50)',
                                            borderColor: selectedPermIds.includes(perm.id) ? 'var(--border-blue-200)' : 'transparent',
                                            cursor: canUpdateRole ? 'pointer' : 'default',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10
                                          }}
                                        >
                                          <Checkbox
                                            checked={selectedPermIds.includes(perm.id)}
                                            disabled={!canUpdateRole}
                                            style={{ pointerEvents: 'none' }}
                                          />
                                          <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <Text strong style={{ fontSize: 13, display: 'block', color: selectedPermIds.includes(perm.id) ? 'var(--premium-blue)' : 'var(--text-slate-700)' }}>
                                              {perm.action.charAt(0).toUpperCase() + perm.action.slice(1)}
                                            </Text>
                                            {perm.description && (
                                              <Text type="secondary" style={{ fontSize: 11, display: 'block' }} ellipsis>
                                                {perm.description}
                                              </Text>
                                            )}
                                          </div>
                                        </div>
                                      </Col>
                                    ))}
                                  </Row>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Handle any resources not assigned to a module */}
                {Object.entries(allPermissions)
                  .filter(([res]) => !PERMISSION_MODULES.some(m => m.resources.includes(res)))
                  .length > 0 && (
                    <div style={{ marginBottom: 40 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 6, height: 24, background: 'var(--text-slate-400)', borderRadius: 3 }} />
                        <Title level={4} style={{ margin: 0, fontSize: 18, color: 'var(--text-slate-400)', letterSpacing: '-0.3px' }}>
                          Other Permissions
                        </Title>
                      </div>
                      {Object.entries(allPermissions)
                        .filter(([res]) => !PERMISSION_MODULES.some(m => m.resources.includes(res)))
                        .map(([resource, perms]) => {
                          const label = RESOURCE_LABELS[resource] || resource;
                          const selectedCount = perms.filter((p) => selectedPermIds.includes(p.id)).length;
                          const allInGroup = selectedCount === perms.length;
                          const someInGroup = selectedCount > 0 && !allInGroup;

                          // Group by sub-resource
                          const subGroups: Record<string, RBACPermission[]> = {};
                          perms.forEach(p => {
                            const parts = p.name.split('.');
                            let subKey = `${label} Management`;
                            if (parts.length > 2) {
                              subKey = parts[1].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Management';
                            }
                            if (!subGroups[subKey]) subGroups[subKey] = [];
                            subGroups[subKey].push(p);
                          });

                          return (
                            <div
                              key={resource}
                              style={{
                                marginBottom: 24,
                                border: '1px solid var(--border-slate-200)',
                                borderRadius: 16,
                                overflow: 'hidden',
                                background: 'var(--bg-pure-white)',
                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: 'space-between',
                                  padding: "14px 20px",
                                  background: 'var(--bg-slate-50)',
                                  borderBottom: '1px solid var(--border-slate-100)'
                                }}
                              >
                                <Space size={14}>
                                  <Checkbox
                                    checked={allInGroup}
                                    indeterminate={someInGroup}
                                    onChange={() => toggleResource(perms)}
                                    disabled={!canUpdateRole}
                                    style={{ transform: 'scale(1.1)' }}
                                  />
                                  <Text strong style={{ fontSize: 15, color: 'var(--text-slate-900)' }}>
                                    {label}
                                  </Text>
                                </Space>
                                <Badge
                                  count={`${selectedCount} / ${perms.length}`}
                                  style={{ backgroundColor: selectedCount === perms.length ? 'var(--text-holiday)' : 'var(--text-slate-400)', boxShadow: 'none' }}
                                />
                              </div>
                              <div style={{ padding: '20px' }}>
                                {Object.entries(subGroups).map(([subTitle, subPerms], idx) => (
                                  <div key={subTitle} style={{ marginBottom: idx === Object.entries(subGroups).length - 1 ? 0 : 24 }}>
                                    <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px dashed var(--border-slate-100)' }}>
                                      <Text strong style={{ fontSize: 13, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                        {subTitle}
                                      </Text>
                                    </div>
                                    <Row gutter={[16, 16]}>
                                      {subPerms.map((perm) => (
                                        <Col key={perm.id} xs={24} sm={12} lg={8}>
                                          <div 
                                            onClick={() => canUpdateRole && togglePermission(perm.id)}
                                            style={{
                                              padding: '10px 14px',
                                              borderRadius: 10,
                                              border: '1px solid transparent',
                                              background: selectedPermIds.includes(perm.id) ? 'var(--bg-slate-100)' : 'var(--bg-slate-50)',
                                              borderColor: selectedPermIds.includes(perm.id) ? 'var(--border-slate-200)' : 'transparent',
                                              cursor: canUpdateRole ? 'pointer' : 'default',
                                              transition: 'all 0.2s ease',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 10
                                            }}
                                          >
                                            <Checkbox
                                              checked={selectedPermIds.includes(perm.id)}
                                              disabled={!canUpdateRole}
                                              style={{ pointerEvents: 'none' }}
                                            />
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                              <Text strong style={{ fontSize: 13, display: 'block', color: 'var(--text-slate-700)' }}>
                                                {perm.action.charAt(0).toUpperCase() + perm.action.slice(1)}
                                              </Text>
                                              {perm.description && (
                                                <Text type="secondary" style={{ fontSize: 11, display: 'block' }} ellipsis>
                                                  {perm.description}
                                                </Text>
                                              )}
                                            </div>
                                          </div>
                                        </Col>
                                      ))}
                                    </Row>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
              </div>
            </div>
          )}
        </Drawer>

        {/* ── Members Drawer ── */}
        <Drawer
          title={
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Space size={8}>
                <TeamOutlined style={{ color: 'var(--premium-blue)' }} />
                <Text strong style={{ fontSize: 16, color: 'var(--text-slate-900)' }}>Manage Members</Text>
              </Space>
              <Text style={{ fontSize: 12, fontWeight: 400, marginTop: 4, color: 'var(--text-slate-500)' }}>
                Assign or remove users from the <strong style={{ color: 'var(--text-slate-900)' }}>{membersDrawerRole?.name}</strong> role
              </Text>
            </div>
          }
          open={membersDrawerOpen}
          onClose={() => setMembersDrawerOpen(false)}
          width={480}
          styles={{
            header: { borderBottom: '1px solid var(--border-slate-100)', padding: '16px 24px', background: 'var(--bg-pure-white)' },
            body: { padding: '24px', background: 'var(--bg-pure-white)' }
          }}
        >
          {membersDrawerLoading ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <Spin tip="Loading members">
                <div style={{ height: 40 }} />
              </Spin>
            </div>
          ) : (
            <div>
              {/* Add member section */}
              {canAssignRole && (
                <div style={{
                  marginBottom: 24,
                  padding: 16,
                  background: 'var(--bg-slate-50)',
                  borderRadius: 10,
                  border: '1px solid var(--border-slate-100)'
                }}>
                  <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12, color: 'var(--text-slate-900)' }}>
                    Assign New Member
                  </Text>
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      placeholder="Search and select member..."
                      showSearch
                      style={{ flex: 1, height: 40 }}
                      value={assigningMemberId}
                      onChange={setAssigningMemberId}
                      filterOption={(input, option) =>
                        (option?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      options={allMembers.filter(
                        (m) => !roleMembers.some((rm) => rm.user.id === m.value)
                      )}
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      loading={assignLoading}
                      disabled={!assigningMemberId}
                      onClick={handleAssignMember}
                      style={{ height: 40, borderRadius: '0 6px 6px 0' }}
                    >
                      Assign
                    </Button>
                  </Space.Compact>
                </div>
              )}

              {/* Current members list */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text strong style={{ fontSize: 14, color: 'var(--text-slate-900)' }}>
                  Current Members
                </Text>
                <Badge
                  count={roleMembers.length}
                  showZero
                  overflowCount={999}
                  style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-slate-500)', boxShadow: 'none' }}
                />
              </div>

              {roleMembers.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "48px 0",
                  background: 'var(--bg-slate-50)',
                  borderRadius: 10,
                  border: '1px dashed var(--border-slate-200)'
                }}>
                  <TeamOutlined style={{ fontSize: 32, marginBottom: 12, color: 'var(--text-slate-300)' }} />
                  <br />
                  <span style={{ fontSize: 13, color: 'var(--text-slate-500)' }}>No members assigned to this role</span>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border-slate-100)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-pure-white)' }}>
                  <List
                    size="large"
                    dataSource={roleMembers}
                    renderItem={(entry) => (
                      <List.Item
                        style={{ padding: '12px 16px' }}
                        actions={
                          canAssignRole
                            ? [
                              <Popconfirm
                                key="remove"
                                title="Remove from role?"
                                description={`Are you sure you want to remove ${entry.user.name} from this role?`}
                                onConfirm={() => handleRemoveMember(entry.user.id)}
                                okText="Remove"
                                okButtonProps={{ danger: true }}
                              >
                                <Button
                                  type="text"
                                  icon={<MinusCircleOutlined />}
                                  size="small"
                                  danger
                                  className="hover-danger-bg"
                                />
                              </Popconfirm>,
                            ]
                            : []
                        }
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{ backgroundColor: 'var(--premium-blue)' }}
                              icon={<UserOutlined />}
                              size={40}
                            />
                          }
                          title={
                            <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>
                              {entry.user.name}
                            </Text>
                          }
                          description={
                            <div style={{ marginTop: -2 }}>
                              <Text style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>
                                {entry.user.workEmail || 'No email provided'}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </div>
          )}
        </Drawer>
        <style jsx global>{`
          .ant-form-item-label > label {
            font-weight: 500;
            color: var(--text-slate-600) !important;
            font-size: 13px;
          }
          .ant-input, .ant-input-number, .ant-select-selector, .ant-picker, .ant-input-affix-wrapper {
            border-radius: 8px !important;
            border-color: var(--border-slate-200) !important;
            background: var(--bg-pure-white) !important;
            color: var(--text-slate-900) !important;
          }
          .ant-input:focus, .ant-input-number:focus, .ant-select-selector:focus {
            border-color: var(--premium-blue) !important;
            outline: none;
          }
          .ant-table-thead > tr > th {
            background: var(--bg-table-header) !important;
            border-bottom: 2px solid var(--border-slate-100) !important;
            color: var(--text-slate-900) !important;
          }
          .ant-table-row:hover > td {
            background: var(--bg-slate-50) !important;
          }
          .ant-drawer-content {
            background-color: var(--bg-pure-white) !important;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
