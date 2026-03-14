"use client";

import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
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
      title: "Role",
      key: "name",
      render: (_, record) => (
        <Space>
          <SafetyOutlined
            style={{ color: record.isSystem ? "#1677ff" : "#52c41a", fontSize: 16 }}
          />
          <div>
            <Space size={4}>
              <Text strong style={{ fontSize: 13 }}>
                {record.name}
              </Text>
              {record.isSystem && (
                <Tag color="blue" style={{ fontSize: 10, lineHeight: "16px" }}>
                  SYSTEM
                </Tag>
              )}
            </Space>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.slug}
            </Text>
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

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
            <Space align="center">
              <SafetyOutlined style={{ fontSize: 24, color: "#1677ff" }} />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Roles & Permissions
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Manage roles and their permission sets
                </Text>
              </div>
            </Space>
            {canCreateRole && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
              >
                Create Role
              </Button>
            )}
          </Space>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setError("")}
          />
        )}
        {success && (
          <Alert
            message={success}
            type="success"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setSuccess("")}
          />
        )}

        {/* ── Roles Table ── */}
        <Card size="small">
          <Table
            columns={columns}
            dataSource={roles}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
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
            <Space>
              <SafetyOutlined />
              <span>Permissions — {drawerRole?.name}</span>
              {drawerRole?.isSystem && <Tag color="blue">SYSTEM</Tag>}
            </Space>
          }
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={540}
          extra={
            canUpdateRole && (
              <Button type="primary" loading={drawerSaving} onClick={handleSavePermissions}>
                Save Permissions
              </Button>
            )
          }
        >
          {drawerLoadingPerms ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <Spin tip="Loading permissions..." />
            </div>
          ) : (
            <div>
              {/* Selected count + select-all controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  padding: "8px 12px",
                  background: "#f5f5f5",
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 12 }}>
                  <strong>{selectedPermIds.length}</strong> permission
                  {selectedPermIds.length !== 1 ? "s" : ""} selected
                </Text>
                {canUpdateRole && (
                  <Space size={4}>
                    <Button
                      type="link"
                      size="small"
                      icon={<CheckSquareOutlined />}
                      onClick={selectAll}
                      style={{ fontSize: 12 }}
                    >
                      Select all
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<BorderOutlined />}
                      onClick={clearAll}
                      style={{ fontSize: 12 }}
                    >
                      Clear all
                    </Button>
                  </Space>
                )}
              </div>

              {/* Permission groups */}
              {Object.entries(allPermissions).map(([resource, perms]) => {
                const label = RESOURCE_LABELS[resource] || resource;
                const selectedCount = perms.filter((p) => selectedPermIds.includes(p.id)).length;
                const allInGroup = selectedCount === perms.length;
                const someInGroup = selectedCount > 0 && !allInGroup;

                return (
                  <div key={resource} style={{ marginBottom: 20 }}>
                    {/* Group header with select-all checkbox */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <Checkbox
                        checked={allInGroup}
                        indeterminate={someInGroup}
                        onChange={() => toggleResource(perms)}
                        disabled={!canUpdateRole}
                      />
                      <Text strong style={{ fontSize: 13 }}>
                        {label}
                      </Text>
                      <Tag style={{ fontSize: 10, marginLeft: 4 }}>
                        {selectedCount}/{perms.length}
                      </Tag>
                    </div>

                    {/* Individual permission checkboxes */}
                    <Row gutter={[8, 8]} style={{ paddingLeft: 24 }}>
                      {perms.map((perm) => (
                        <Col key={perm.id} xs={12} sm={8}>
                          <Checkbox
                            checked={selectedPermIds.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            disabled={!canUpdateRole}
                            style={{ fontSize: 12 }}
                          >
                            <Tooltip title={perm.description || perm.name}>
                              <span>{perm.action}</span>
                            </Tooltip>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>

                    <Divider style={{ margin: "14px 0" }} />
                  </div>
                );
              })}
            </div>
          )}
        </Drawer>

        {/* ── Members Drawer ── */}
        <Drawer
          title={
            <Space>
              <TeamOutlined />
              <span>Members — {membersDrawerRole?.name}</span>
            </Space>
          }
          open={membersDrawerOpen}
          onClose={() => setMembersDrawerOpen(false)}
          width={440}
        >
          {membersDrawerLoading ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <Spin tip="Loading members..." />
            </div>
          ) : (
            <div>
              {/* Add member */}
              {canAssignRole && (
                <div style={{ marginBottom: 20 }}>
                  <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
                    Assign member to this role
                  </Text>
                  <Space.Compact style={{ width: "100%" }}>
                    <Select
                      placeholder="Search and select a member..."
                      showSearch
                      style={{ flex: 1 }}
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
                    >
                      Assign
                    </Button>
                  </Space.Compact>
                </div>
              )}

              <Divider style={{ margin: "12px 0" }} />

              {/* Current members */}
              <Text strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>
                Current members ({roleMembers.length})
              </Text>
              {roleMembers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#8c8c8c" }}>
                  <TeamOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                  <br />
                  <Text type="secondary">No members assigned yet</Text>
                </div>
              ) : (
                <List
                  size="small"
                  dataSource={roleMembers}
                  renderItem={(entry) => (
                    <List.Item
                      actions={
                        canAssignRole
                          ? [
                              <Popconfirm
                                key="remove"
                                title="Remove from role?"
                                onConfirm={() => handleRemoveMember(entry.user.id)}
                                okText="Remove"
                                okButtonProps={{ danger: true }}
                              >
                                <Button
                                  type="text"
                                  icon={<MinusCircleOutlined />}
                                  size="small"
                                  danger
                                />
                              </Popconfirm>,
                            ]
                          : []
                      }
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar size={32} style={{ backgroundColor: "#1677ff", fontSize: 12 }}>
                            {entry.user.name.charAt(0).toUpperCase()}
                          </Avatar>
                        }
                        title={
                          <Text style={{ fontSize: 13 }}>{entry.user.name}</Text>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {entry.user.workEmail}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          )}
        </Drawer>
      </div>
    </MainLayout>
  );
}
