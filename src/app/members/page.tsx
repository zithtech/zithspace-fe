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
  Row,
  Col,
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
import {
  MembersService,
  Member,
  CreateMemberData,
  UpdateMemberData,
} from "@/services/membersService";
import { SettingsService, Shift } from "@/services/settingsService";
import { ApiError } from "@/lib/axios";
import type { ColumnsType } from "antd/es/table";
import { usePermission } from "@/hooks/usePermission";
import { usePositions } from "@/hooks/usePositions";

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
  const router = useRouter();
  const [form] = Form.useForm();
  const {
    canReadUser,
    canCreateUser,
    canUpdateUser,
    canDeleteUser,
    canManageUsers
  } = usePermission();
  const { dataSource: positions, loading: positionsLoading } = usePositions();

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
  const [positionFilter, setPositionFilter] = useState<string | undefined>(
    undefined,
  );

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "delete">("add");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Available managers for dropdown
  const [managers, setManagers] = useState<Member[]>([]);

  // Available shifts for dropdown
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Calculate member stats - MOVED ABOVE EARLY RETURNS
  const memberStats = React.useMemo(() => {
    return {
      total: pagination.total,
      superAdmin: members.filter(m => m.role === 'super_admin').length,
      admin: members.filter(m => m.role === 'admin').length,
      user: members.filter(m => m.role === 'user').length
    };
  }, [members, pagination.total]);

  // Fetch functions
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
      setManagers(
        managers.map(
          (m) =>
            ({
              id: m.value,
              name: m.label,
              position: m.position ? { title: m.position, id: "" } : null,
            }) as Member,
        ),
      );
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

  // Protect route - requires user.read permission
  useEffect(() => {
    if (!isLoading && !canReadUser) {
      router.push("/dashboard");
    }
  }, [isLoading, canReadUser, router]);

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
          positionId: values.position,
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
          positionId: values.position,
          password: "temp123", // Default password - should be changed on first login
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
      position: member?.position?.id,
      reportsTo:
        typeof member.reportsTo === "object"
          ? member?.reportsTo?.id
          : member?.reportsTo || "",
      assignedShift:
        (member as any)?.assignedShift?.id ||
        (member as any)?.assignedShiftId ||
        null, // FIXED: Populate shift
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
              {record?.position?.title}
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
      title: "Position",
      key: "position",
      width: 200,
      render: (_, record: Member) => (
        <div>
          <Text style={{ fontSize: 12 }}>{record?.position?.title}</Text>
        </div>
      ),
    },
    {
      title: "User Role",
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
        if (!canUpdateUser && !canDeleteUser && !canManageUsers) return null;

        const menuItems = [];
        if (canUpdateUser || canManageUsers) {
          menuItems.push({
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit",
            onClick: () => showEditModal(record),
          });
        }
        if (canDeleteUser || canManageUsers) {
          menuItems.push({
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Delete",
            danger: true,
            onClick: () => showDeleteModal(record),
          });
        }

        if (menuItems.length === 0) return null;

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
  if (!user || isLoading || !canReadUser) {
    if (isLoading) return <LoadingSpinner message="Loading members..." />;
    return null;
  }

  return (
    <MainLayout>
      <div style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 64px)', padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Space align="start" size={16}>
              <TeamOutlined style={{ fontSize: 28, color: "#1677ff", marginTop: 4 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  Members Management
                </Title>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 2 }}>
                  Directory and access control for all organization members
                </Text>
              </div>
            </Space>
            {(canCreateUser || canManageUsers) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showAddModal}
                size="large"
                style={{ borderRadius: 8 }}
              >
                Add Member
              </Button>
            )}
          </Space>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: 'none' }} styles={{ body: { padding: '16px 20px' } }}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Members</Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{memberStats.total}</Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: 'none' }} styles={{ body: { padding: '16px 20px' } }}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Super Admins</Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#ff4d4f' }}>{memberStats.superAdmin}</Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: 'none' }} styles={{ body: { padding: '16px 20px' } }}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Admins</Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#faad14' }}>{memberStats.admin}</Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: 'none' }} styles={{ body: { padding: '16px 20px' } }}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Regular Users</Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#52c41a' }}>{memberStats.user}</Title>
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

        {/* Filters and Table Container */}
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
          {/* Filters Bar */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Input
                placeholder="Search members..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 280, borderRadius: 8, height: 40 }}
                allowClear
              />

              <Select
                placeholder="Filter by role"
                value={roleFilter}
                onChange={setRoleFilter}
                style={{ width: 180, height: 40 }}
                allowClear
              >
                <Option value="super_admin">Super Admin</Option>
                <Option value="admin">Admin</Option>
                <Option value="user">User</Option>
              </Select>

              <Select
                placeholder="Filter by position"
                value={positionFilter}
                onChange={setPositionFilter}
                style={{ width: 220, height: 40 }}
                allowClear
                loading={positionsLoading}
              >
                {positions.map((position) => (
                  <Option key={position.id} value={position.title}>
                    {position.title}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Members Table */}
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
                `${range[0]}-${range[1]} of ${total} members`,
              onChange: (page, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || 10,
                }));
              },
              style: { padding: '16px 24px' }
            }}
            scroll={{ x: 1000 }}
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
                  <Select
                    placeholder="Select position"
                    loading={positionsLoading}
                  >
                    {positions.map((position) => (
                      <Option key={position.id} value={position.id}>
                        {position.title}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <Form.Item name="reportsTo" label="Reports To">
                <Select placeholder="Select manager (optional)" allowClear>
                  {managers
                    .filter((m) => m.id !== selectedMember?.id)
                    .map((manager) => (
                      <Option key={manager.id} value={manager.id}>{`${
                        manager.name
                      } - ${manager.id.substring(0, 8)}`}</Option>
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
                    {/* <Option value="flexible">Flexible Shift (Default)</Option> */}
                    {shifts.map((shift) => (
                      <Option key={shift.id} value={shift.id}>
                        {shift.name} ({shift.startTime} - {shift.endTime})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="workDays"
                  label="Work Days"
                  initialValue={[1, 2, 3, 4, 5]}
                >
                  <Checkbox.Group>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 8,
                      }}
                    >
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
