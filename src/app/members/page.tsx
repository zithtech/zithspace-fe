"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Alert,
  Dropdown,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { MembersService, Member, CreateMemberData, UpdateMemberData } from '@/services/membersService';
import { SettingsService, Shift } from '@/services/settingsService';
import { ApiError } from '@/lib/axios';
import type { ColumnsType } from "antd/es/table";
import { useRBAC } from "@/lib/rbac";

const { Title, Text } = Typography;
const { Option } = Select;

interface MemberFormData {
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  role: "super_admin" | "admin" | "user";
  position:
    | "Developer"
    | "CEO"
    | "DevOps"
    | "Project Manager"
    | "Product Manager"
    | "UI/UX"
    | "Business Management";
  reportsTo: string;
}

export default function MembersPage() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return <LoadingSpinner message="Loading members..." />;
  }
  const router = useRouter();
  const [form] = Form.useForm();

  // State management
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination and filtering
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [positionFilter, setPositionFilter] = useState<string | undefined>(undefined);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "delete">("add");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Available managers for dropdown
  const [managers, setManagers] = useState<Member[]>([]);
  
  // Available shifts for dropdown
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Check permissions - Allow all users to view, but redirect if no access
  useEffect(() => {
    if (user && !['super_admin', 'admin', 'user'].includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Fetch members
  const fetchMembers = async () => {
    try {
      setLoading(true);

      const response = await MembersService.getMembers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm,
        role: roleFilter,
        position: positionFilter,
      });

      setMembers(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      console.error("Failed to fetch members:", error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Failed to fetch members");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch managers for dropdown
  const fetchManagers = async () => {
    try {
      const managers = await MembersService.getMembersForSelect();
      setManagers(managers.map(m => ({
        id: m.value,
        name: m.label,
        position: m.position,
      } as Member)));
    } catch (error) {
      console.error("Failed to fetch managers:", error);
    }
  };

  // Fetch shifts for dropdown
  const fetchShifts = async () => {
    try {
      const shifts = await SettingsService.getAllShifts();
      setShifts(shifts || []);
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
      setShifts([]); // Set empty array on error
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
      fetchManagers();
      fetchShifts();
    }
  }, [
    user,
    pagination.current,
    pagination.pageSize,
    searchTerm,
    roleFilter,
    positionFilter,
  ]);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      setFormLoading(true);
      setError("");

      if (modalType === "edit" && selectedMember) {
        const updatePayload: UpdateMemberData = {
          name: values.name,
          phone: values.phone,
          personalEmail: values.personalEmail,
          workEmail: values.workEmail,
          role: values.role,
          position: values.position,
          reportsToId: values.reportsTo || null,
          isActive: values.isActive !== undefined ? values.isActive : true,
          workDays: values.workDays || [1, 2, 3, 4, 5], // FIXED: Include workDays
          assignedShiftId: values.assignedShift || null, // FIXED: Include shift assignment
        };
        await MembersService.updateMember(selectedMember.id, updatePayload);
        setSuccess("Member updated successfully");
      } else {
        const createPayload: CreateMemberData = {
          name: values.name,
          phone: values.phone,
          personalEmail: values.personalEmail,
          workEmail: values.workEmail,
          role: values.role,
          position: values.position,
          password: 'temp123', // Default password - should be changed on first login
          reportsToId: values.reportsTo || null,
          workDays: values.workDays || [1, 2, 3, 4, 5], // FIXED: Include workDays
          assignedShiftId: values.assignedShift || null, // FIXED: Include shift assignment
          isActive: true, // FIXED: Set default active status
        };
        await MembersService.createMember(createPayload);
        setSuccess("Member created successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      console.error("Failed to submit member form:", error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Operation failed");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedMember) return;

    try {
      setFormLoading(true);
      await MembersService.deleteMember(selectedMember.id);
      setSuccess("Member deleted successfully");
      setIsModalVisible(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      console.error("Failed to delete member:", error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Delete failed");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Modal handlers
  const showAddModal = () => {
    setModalType("add");
    form.resetFields();
    setSelectedMember(null);
    setIsModalVisible(true);
  };

  const showEditModal = (member: Member) => {
    setModalType("edit");
    setSelectedMember(member);
    form.setFieldsValue({
      name: member?.name,
      phone: member?.phone,
      personalEmail: member?.personalEmail,
      workEmail: member?.workEmail,
      role: member?.role,
      position: member?.position,
      reportsTo:
        typeof member.reportsTo === "object"
          ? member?.reportsTo?.id
          : member?.reportsTo || "",
      assignedShift: (member as any)?.assignedShift?.id || (member as any)?.assignedShiftId || null, // FIXED: Populate shift
      workDays: (member as any)?.workDays || [1, 2, 3, 4, 5], // FIXED: Populate work days
      isActive: member?.isActive !== undefined ? member?.isActive : true, // FIXED: Populate isActive
    });
    setIsModalVisible(true);
  };

  const showDeleteModal = (member: Member) => {
    setModalType("delete");
    setSelectedMember(member);
    setIsModalVisible(true);
  };

  // Table columns
  const columns: ColumnsType<Member> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (text: string, record: Member) => (
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background:
                record.role === "super_admin"
                  ? "#ff4d4f"
                  : record.role === "admin"
                  ? "#faad14"
                  : "#52c41a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {text.charAt(0).toUpperCase()}
          </div>
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {text}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record?.position}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: 200,
      render: (_, record: Member) => (
        <div>
          <Text style={{ fontSize: 12 }}>{record.workEmail}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record?.phone}
          </Text>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 100,
      render: (role: string) => (
        <Tag
          color={
            role === "super_admin"
              ? "red"
              : role === "admin"
              ? "orange"
              : "green"
          }
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {role?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Reports To",
      key: "reportsTo",
      width: 120,
      render: (_, record: Member) => (
        <Text style={{ fontSize: 12 }}>
          {record?.reportsTo
            ? typeof record?.reportsTo === "object"
              ? record?.reportsTo?.name
              : "-"
            : "-"}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, record: Member) => {
        if (!rbac?.canManageMembers) return null;

        const menuItems = [
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit",
            onClick: () => showEditModal(record),
          },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Delete",
            danger: true,
            onClick: () => showDeleteModal(record),
          },
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              style={{ width: 24, height: 24 }}
            />
          </Dropdown>
        );
      },
    },
  ];

  // Clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Don't render if no user
  if (!user) {
    return null;
  }

  // RBAC permissions
  const rbac = useRBAC(user.role as any);
  const canManage = rbac?.canManageMembers;

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Space align="center">
              <TeamOutlined style={{ fontSize: 24, color: "#1677ff" }} />
              <Title level={3} style={{ margin: 0 }}>
                Members Management
              </Title>
            </Space>
            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showAddModal}
                size="middle"
              >
                Add Member
              </Button>
            )}
          </Space>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16, fontSize: 13 }}
            onClose={() => setError("")}
          />
        )}
        {success && (
          <Alert
            message={success}
            type="success"
            showIcon
            closable
            style={{ marginBottom: 16, fontSize: 13 }}
            onClose={() => setSuccess("")}
          />
        )}

        {/* Filters Card */}
        <Card
          size="small"
          // className='flex items-center gap-8'
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 16 } }}
        >
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search members..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />

            <Select
              placeholder="Filter by role"
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: 200 }}
              allowClear
            >
              <Option value="super_admin">super_admin</Option>
              <Option value="admin">admin</Option>
              <Option value="user">User</Option>
            </Select>

            <Select
              placeholder="Filter by position"
              value={positionFilter}
              onChange={setPositionFilter}
              style={{ width: 200 }}
              allowClear
            >
              <Option value="Developer">Developer</Option>
              <Option value="CEO">CEO</Option>
              <Option value="DevOps">DevOps</Option>
              <Option value="Project Manager">Project Manager</Option>
              <Option value="Product Manager">Product Manager</Option>
              <Option value="UI/UX">UI/UX</Option>
              <Option value="Business Management">Business Management</Option>
            </Select>
          </div>
        </Card>

        {/* Members Table */}
        <Card
          size="small"
          // bodyStyle={{ padding: 0 }}
          // className="compact-table"
        >
          <Table
            columns={columns}
            dataSource={members}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total}`,
              onChange: (page, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || 10,
                }));
              },
              // size: 'small',
            }}
            // size="small"
            scroll={{ x: 800 }}
          />
        </Card>

        {/* Modal */}
        <Modal
          title={
            modalType === "add"
              ? "Add New Member"
              : modalType === "edit"
              ? "Edit Member"
              : "Delete Member"
          }
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setSelectedMember(null);
          }}
          footer={null}
          width={modalType === "delete" ? 400 : 600}
        >
          {modalType === "delete" ? (
            <div>
              <Text>
                Are you sure you want to delete{" "}
                <strong>{selectedMember?.name}</strong>? This action will
                deactivate the member account.
              </Text>
              <div style={{ marginTop: 20, textAlign: "right" }}>
                <Space>
                  <Button onClick={() => setIsModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    danger
                    loading={formLoading}
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </Space>
              </div>
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="middle"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[
                    { required: true, message: "Please enter full name" },
                  ]}
                >
                  <Input placeholder="Enter full name" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[
                    { required: true, message: "Please enter phone number" },
                  ]}
                >
                  <Input placeholder="Enter phone number" />
                </Form.Item>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Form.Item
                  name="personalEmail"
                  label="Personal Email"
                  rules={[
                    { required: true, message: "Please enter personal email" },
                    { type: "email", message: "Please enter valid email" },
                  ]}
                >
                  <Input placeholder="Enter personal email" />
                </Form.Item>

                <Form.Item
                  name="workEmail"
                  label="Work Email"
                  rules={[
                    { required: true, message: "Please enter work email" },
                    { type: "email", message: "Please enter valid email" },
                  ]}
                >
                  <Input placeholder="Enter work email" />
                </Form.Item>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Form.Item
                  name="role"
                  label="Role"
                  rules={[{ required: true, message: "Please select role" }]}
                >
                  <Select placeholder="Select role">
                    <Option value="user">User</Option>
                    <Option value="admin">Admin</Option>
                    <Option value="super_admin">Super Admin</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="position"
                  label="Position"
                  rules={[
                    { required: true, message: "Please select position" },
                  ]}
                >
                  <Select placeholder="Select position">
                    <Option value="Developer">Developer</Option>
                    <Option value="CEO">CEO</Option>
                    <Option value="DevOps">DevOps</Option>
                    <Option value="Project Manager">Project Manager</Option>
                    <Option value="Product Manager">Product Manager</Option>
                    <Option value="UI/UX">UI/UX</Option>
                    <Option value="Business Management">
                      Business Management
                    </Option>
                  </Select>
                </Form.Item>
              </div>

              <Form.Item name="reportsTo" label="Reports To">
                <Select placeholder="Select manager (optional)" allowClear>
                  {managers
                    .filter((m) => m.id !== selectedMember?.id)
                    .map((manager) => (
                      <Option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.position})
                      </Option>
                    ))}
                </Select>
              </Form.Item>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Form.Item name="assignedShift" label="Assigned Shift">
                  <Select placeholder="Select shift (optional)" allowClear>
                    <Option value="flexible">Flexible Shift (Default)</Option>
                    {shifts.map((shift) => (
                      <Option key={shift.id} value={shift.id}>
                        {shift.name} ({shift.startTime} - {shift.endTime})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="workDays" label="Work Days" initialValue={[1, 2, 3, 4, 5]}>
                  <Checkbox.Group>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      <Checkbox value={1}>Mon</Checkbox>
                      <Checkbox value={2}>Tue</Checkbox>
                      <Checkbox value={3}>Wed</Checkbox>
                      <Checkbox value={4}>Thu</Checkbox>
                      <Checkbox value={5}>Fri</Checkbox>
                      <Checkbox value={6}>Sat</Checkbox>
                      <Checkbox value={0}>Sun</Checkbox>
                    </div>
                  </Checkbox.Group>
                </Form.Item>
              </div>

              <div style={{ textAlign: "right", marginTop: 20 }}>
                <Space>
                  <Button onClick={() => setIsModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={formLoading}
                  >
                    {modalType === "add" ? "Add Member" : "Update Member"}
                  </Button>
                </Space>
              </div>
            </Form>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}
