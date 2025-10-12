"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
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
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ShopOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ClientService, Client, CreateClientData, UpdateClientData } from '@/services/clientService';
import type { ColumnsType } from "antd/es/table";
import { useRBAC } from "@/lib/rbac";
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function ClientsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm();

  // State management
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState<any>(null);

  // Pagination and filtering
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "delete" | "view">("add");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // RBAC permissions
  const rbac = useRBAC(user?.role as any);
  const canManage = rbac?.canManageMembers;

  // Check permissions
  useEffect(() => {
    if (user && !['super_admin', 'admin', 'user'].includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);

      const response = await ClientService.getClients({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm,
        status: statusFilter,
      });

      setClients(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to fetch clients");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await ClientService.getClientStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchStats();
    }
  }, [user, pagination.current, pagination.pageSize, searchTerm, statusFilter]);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      setFormLoading(true);
      setError("");

      const formData: CreateClientData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        company: values.company,
        address: values.address,
        contactPerson: values.contactPerson,
        notes: values.notes,
      };

      if (modalType === "edit" && selectedClient) {
        await ClientService.updateClient(selectedClient.id, formData as UpdateClientData);
        setSuccess("Client updated successfully");
      } else {
        await ClientService.createClient(formData);
        setSuccess("Client created successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedClient(null);
      fetchClients();
      fetchStats();
    } catch (error: any) {
      console.error("Failed to submit client form:", error);
      if (error instanceof Error) {
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
    if (!selectedClient) return;

    try {
      setFormLoading(true);
      await ClientService.deleteClient(selectedClient.id);
      setSuccess("Client deleted successfully");
      setIsModalVisible(false);
      setSelectedClient(null);
      fetchClients();
      fetchStats();
    } catch (error: any) {
      console.error("Failed to delete client:", error);
      if (error instanceof Error) {
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
    setSelectedClient(null);
    setIsModalVisible(true);
  };

  const showEditModal = (client: Client) => {
    setModalType("edit");
    setSelectedClient(client);
    form.setFieldsValue({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      address: client.address,
      contactPerson: client.contactPerson,
      notes: client.notes,
    });
    setIsModalVisible(true);
  };

  const showViewModal = (client: Client) => {
    setModalType("view");
    setSelectedClient(client);
    setIsModalVisible(true);
  };

  const showDeleteModal = (client: Client) => {
    setModalType("delete");
    setSelectedClient(client);
    setIsModalVisible(true);
  };

  // Table columns
  const columns: ColumnsType<Client> = [
    {
      title: "Client",
      key: "client",
      width: 200,
      render: (_, record: Client) => (
        <Space>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: record.isActive ? "#52c41a" : "#ff4d4f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {record.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {record.name}
            </Text>
            <br />
            {record.company && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.company}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: 200,
      render: (_, record: Client) => (
        <div>
          <Space size={4}>
            <MailOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
            <Text style={{ fontSize: 12 }}>{record.email}</Text>
          </Space>
          <br />
          {record.phone && (
            <Space size={4}>
              <PhoneOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.phone}
              </Text>
            </Space>
          )}
        </div>
      ),
    },
    {
      title: "Contact Person",
      dataIndex: "contactPerson",
      key: "contactPerson",
      width: 150,
      render: (contactPerson: string) => (
        <Space size={4}>
          <UserOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
          <Text style={{ fontSize: 12 }}>{contactPerson || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) => (
        <Tag
          color={isActive ? "green" : "red"}
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {isActive ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {dayjs(date).format('MMM DD, YYYY')}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center",
      fixed: 'right',
      render: (_, record: Client) => {
        const menuItems = [
          {
            key: "view",
            icon: <EyeOutlined />,
            label: "View",
            onClick: () => showViewModal(record),
          },
          ...(canManage ? [
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
          ] : []),
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

  if (!user) {
    return null;
  }

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
              <ShopOutlined style={{ fontSize: 24, color: "#1677ff" }} />
              <Title level={3} style={{ margin: 0 }}>
                Client Management
              </Title>
            </Space>
            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showAddModal}
                size="middle"
              >
                Add Client
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

        {/* Stats Cards */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Total Clients"
                  value={stats.overview.totalClients}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Active Clients"
                  value={stats.overview.activeClients}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Inactive Clients"
                  value={stats.overview.inactiveClients}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters Card */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap size={12}>
            <Input
              placeholder="Search clients..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />

            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Space>
        </Card>

        {/* Clients Table */}
        <Card size="small">
          <Table
            columns={columns}
            dataSource={clients}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} clients`,
              onChange: (page, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || 10,
                }));
              },
              size: 'small',
            }}
            size="small"
            scroll={{ x: 900 }}
          />
        </Card>

        {/* Modal */}
        <Modal
          title={
            modalType === "add"
              ? "Add New Client"
              : modalType === "edit"
              ? "Edit Client"
              : modalType === "view"
              ? "Client Details"
              : "Delete Client"
          }
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setSelectedClient(null);
          }}
          footer={modalType === "view" ? [
            <Button key="close" onClick={() => setIsModalVisible(false)}>
              Close
            </Button>
          ] : null}
          width={modalType === "delete" ? 400 : modalType === "view" ? 600 : 700}
        >
          {modalType === "delete" ? (
            <div>
              <Text>
                Are you sure you want to delete{" "}
                <strong>{selectedClient?.name}</strong>? This action will
                deactivate the client account.
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
          ) : modalType === "view" ? (
            <div>
              {selectedClient && (
                <div>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text strong>Name:</Text>
                      <br />
                      <Text>{selectedClient.name}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Email:</Text>
                      <br />
                      <Text>{selectedClient.email}</Text>
                    </Col>
                    {selectedClient.phone && (
                      <Col span={12}>
                        <Text strong>Phone:</Text>
                        <br />
                        <Text>{selectedClient.phone}</Text>
                      </Col>
                    )}
                    {selectedClient.company && (
                      <Col span={12}>
                        <Text strong>Company:</Text>
                        <br />
                        <Text>{selectedClient.company}</Text>
                      </Col>
                    )}
                    {selectedClient.contactPerson && (
                      <Col span={12}>
                        <Text strong>Contact Person:</Text>
                        <br />
                        <Text>{selectedClient.contactPerson}</Text>
                      </Col>
                    )}
                    <Col span={12}>
                      <Text strong>Status:</Text>
                      <br />
                      <Tag color={selectedClient.isActive ? "green" : "red"}>
                        {selectedClient.isActive ? "ACTIVE" : "INACTIVE"}
                      </Tag>
                    </Col>
                    {selectedClient.address && (
                      <Col span={24}>
                        <Text strong>Address:</Text>
                        <br />
                        <Text>{selectedClient.address}</Text>
                      </Col>
                    )}
                    {selectedClient.notes && (
                      <Col span={24}>
                        <Text strong>Notes:</Text>
                        <br />
                        <Text>{selectedClient.notes}</Text>
                      </Col>
                    )}
                    <Col span={12}>
                      <Text strong>Created:</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(selectedClient.createdAt).format('MMM DD, YYYY HH:mm')}
                      </Text>
                    </Col>
                    {selectedClient.createdBy && (
                      <Col span={12}>
                        <Text strong>Created By:</Text>
                        <br />
                        <Text type="secondary">{selectedClient.createdBy.name}</Text>
                      </Col>
                    )}
                  </Row>
                </div>
              )}
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="middle"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Client Name"
                    rules={[
                      { required: true, message: "Please enter client name" },
                    ]}
                  >
                    <Input placeholder="Enter client name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Please enter email" },
                      { type: "email", message: "Please enter valid email" },
                    ]}
                  >
                    <Input placeholder="Enter email address" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone"
                  >
                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="company"
                    label="Company"
                  >
                    <Input placeholder="Enter company name" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="contactPerson"
                label="Contact Person"
              >
                <Input placeholder="Enter contact person name" />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
              >
                <TextArea rows={2} placeholder="Enter full address" />
              </Form.Item>

              <Form.Item name="notes" label="Notes">
                <TextArea rows={3} placeholder="Enter any additional notes" />
              </Form.Item>

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
                    {modalType === "add" ? "Add Client" : "Update Client"}
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
