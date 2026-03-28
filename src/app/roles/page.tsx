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

const { Title, Text } = Typography;
const { TextArea } = Input;

/** Human-readable label per permission resource. */
const RESOURCE_LABELS: Record<string, string> = {
  user:         "Users / Members",
  project:      "Projects",
  ticket:       "Tickets",
  attendance:   "Attendance",
  leave:        "Leaves",
  shift:        "Shifts",
  invoice:      "Invoices",
  transaction:  "Transactions",
  client:       "Clients",
  settings:     "Settings",
  role:         "Roles & RBAC",
  report:       "Reports",
  reimbursement:"Reimbursement",
  salary:       "Payroll / Salary",
  document:     "Documents",
  onboarding:   "Onboarding",
  timesheet:    "Timesheet",
  org:          "Org Structure",
  daily_update: "Daily Updates",
};

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
              background: record.isSystem ? "#e6f4ff" : "#f6ffed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: record.isSystem ? "#1677ff" : "#52c41a",
              fontSize: 18,
            }}
          >
            <SafetyOutlined />
          </div>
          <div>
            <Space size={4} align="center">
              <Text strong style={{ fontSize: 14, letterSpacing: '-0.2px' }}>
                {record.name}
              </Text>
              {record.isSystem && (
                <Tag bordered={false} color="blue" style={{ fontSize: 10, borderRadius: 4 }}>
                  SYSTEM
                </Tag>
              )}
            </Space>
            <div style={{ marginTop: -2 }}>
              <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
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
        <Text type="secondary" style={{ fontSize: 12 }}>
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
          style={{ backgroundColor: "#1677ff" }}
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
          <UserOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
          <Text style={{ fontSize: 12 }}>{record._count?.userRoles ?? 0}</Text>
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
              <LockOutlined style={{ color: "#bfbfbf" }} />
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
      <div style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 64px)', padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Space
            align="start"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Space align="start" size={16}>
              <SafetyOutlined style={{ fontSize: 28, color: "#1677ff", marginTop: 4 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  Roles & Permissions
                </Title>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 2 }}>
                  Manage and oversee system-wide access control and role assignments
                </Text>
              </div>
            </Space>
            {canCreateRole && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
                size="large"
                style={{ borderRadius: 8 }}
              >
                Create Role
              </Button>
            )}
          </Space>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: 'none' }} styles={{ body: { padding: '16px 20px' } }}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Roles</Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{roleStats.total}</Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: 'none' }} styles={{ body: { padding: '16px 20px' } }}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Roles</Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#1677ff' }}>{roleStats.system}</Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: 'none' }} styles={{ body: { padding: '16px 20px' } }}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Roles</Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#52c41a' }}>{roleStats.custom}</Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: 'none' }} styles={{ body: { padding: '16px 20px' } }}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Permissions</Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#faad14' }}>{roleStats.permissions}</Title>
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
            border: '1px solid #f0f0f0',
            boxShadow: 'none'
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Space size={8}>
                <SafetyOutlined style={{ color: '#1677ff' }} />
                <Text strong style={{ fontSize: 16 }}>Edit Permissions</Text>
                {drawerRole?.isSystem && <Tag bordered={false} color="blue" style={{ fontSize: 10 }}>SYSTEM</Tag>}
              </Space>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 400, marginTop: 4 }}>
                Configure access rights for the <strong>{drawerRole?.name}</strong> role
              </Text>
            </div>
          }
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={560}
          styles={{
            header: { borderBottom: '1px solid #f0f0f0', padding: '16px 24px' },
            body: { padding: '0 0 24px 0' }
          }}
          extra={
            canUpdateRole && (
              <Button 
                type="primary" 
                loading={drawerSaving} 
                onClick={handleSavePermissions}
                style={{ borderRadius: 6 }}
              >
                Save Changes
              </Button>
            )
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
                  background: "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  marginBottom: 16
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: 500 }}>
                  <Badge 
                    count={selectedPermIds.length} 
                    style={{ backgroundColor: '#1677ff', marginRight: 8 }} 
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
              <div style={{ padding: '0 24px' }}>
                {Object.entries(allPermissions).map(([resource, perms]) => {
                  const label = RESOURCE_LABELS[resource] || resource;
                  const selectedCount = perms.filter((p) => selectedPermIds.includes(p.id)).length;
                  const allInGroup = selectedCount === perms.length;
                  const someInGroup = selectedCount > 0 && !allInGroup;

                  return (
                    <div 
                      key={resource} 
                      style={{ 
                        marginBottom: 16, 
                        border: '1px solid #f0f0f0', 
                        borderRadius: 10,
                        overflow: 'hidden'
                      }}
                    >
                      {/* Group Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: 'space-between',
                          padding: "10px 16px",
                          background: '#fafafa',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                      >
                        <Space size={12}>
                          <Checkbox
                            checked={allInGroup}
                            indeterminate={someInGroup}
                            onChange={() => toggleResource(perms)}
                            disabled={!canUpdateRole}
                          />
                          <Text strong style={{ fontSize: 13, color: '#262626' }}>
                            {label}
                          </Text>
                        </Space>
                        <Tag bordered={false} style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                          {selectedCount} / {perms.length}
                        </Tag>
                      </div>

                      {/* Individual permission checkboxes */}
                      <div style={{ padding: '12px 16px' }}>
                        <Row gutter={[12, 12]}>
                          {perms.map((perm) => (
                            <Col key={perm.id} xs={12} sm={8}>
                              <Checkbox
                                checked={selectedPermIds.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                disabled={!canUpdateRole}
                                style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}
                              >
                                <Tooltip title={perm.description || perm.name}>
                                  <span style={{ marginLeft: 4 }}>{perm.action}</span>
                                </Tooltip>
                              </Checkbox>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Drawer>

        {/* ── Members Drawer ── */}
        <Drawer
          title={
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Space size={8}>
                <TeamOutlined style={{ color: '#1677ff' }} />
                <Text strong style={{ fontSize: 16 }}>Manage Members</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 400, marginTop: 4 }}>
                Assign or remove users from the <strong>{membersDrawerRole?.name}</strong> role
              </Text>
            </div>
          }
          open={membersDrawerOpen}
          onClose={() => setMembersDrawerOpen(false)}
          width={480}
          styles={{
            header: { borderBottom: '1px solid #f0f0f0', padding: '16px 24px' },
            body: { padding: '24px' }
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
                  background: '#fafafa', 
                  borderRadius: 10,
                  border: '1px solid #f0f0f0'
                }}>
                  <Text strong style={{ fontSize: 13, display: "block", marginBottom: 12, color: '#262626' }}>
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
                <Text strong style={{ fontSize: 14 }}>
                  Current Members
                </Text>
                <Badge 
                  count={roleMembers.length} 
                  showZero 
                  overflowCount={999}
                  style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', boxShadow: 'none' }}
                />
              </div>

              {roleMembers.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "48px 0", 
                  background: '#fafafa', 
                  borderRadius: 10,
                  border: '1px dashed #d9d9d9'
                }}>
                  <TeamOutlined style={{ fontSize: 32, marginBottom: 12, color: '#bfbfbf' }} />
                  <br />
                  <Text type="secondary" style={{ fontSize: 13 }}>No members assigned to this role</Text>
                </div>
              ) : (
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
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
                              style={{ backgroundColor: '#1677ff' }} 
                              icon={<UserOutlined />} 
                              size={40}
                            />
                          }
                          title={
                            <Text strong style={{ fontSize: 13 }}>
                              {entry.user.name}
                            </Text>
                          }
                          description={
                            <div style={{ marginTop: -2 }}>
                              <Text type="secondary" style={{ fontSize: 11 }}>
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
      </div>
    </MainLayout>
  );
}
