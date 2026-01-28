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
  Segmented,
  Avatar,
  DatePicker,
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
  AppstoreOutlined,
  BarsOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  UserAddOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import {
  ClientService,
  Client,
  CreateClientData,
  UpdateClientData,
} from "@/services/clientService";
import type { ColumnsType } from "antd/es/table";
import { useRBAC } from "@/lib/rbac";
import dayjs from "dayjs";

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
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<
    "add" | "edit" | "delete" | "view"
  >("add");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  // RBAC permissions
  const rbac = useRBAC(user?.role as any);
  const canManage = rbac?.canManageMembers;

  // Check permissions
  useEffect(() => {
    if (user && !["super_admin", "admin", "user"].includes(user.role)) {
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
        await ClientService.updateClient(
          selectedClient.id,
          formData as UpdateClientData
        );
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
            <MailOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
            <Text style={{ fontSize: 12 }}>{record.email}</Text>
          </Space>
          <br />
          {record.phone && (
            <Space size={4}>
              <PhoneOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
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
          <UserOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
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
          {dayjs(date).format("MMM DD, YYYY")}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center",
      fixed: "right",
      render: (_, record: Client) => {
        const menuItems = [
          {
            key: "view",
            icon: <EyeOutlined />,
            label: "View",
            onClick: () => showViewModal(record),
          },
          ...(canManage
            ? [
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
              ]
            : []),
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} size="small" />
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
          {/* <Space
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
          </Space> */}
          <Row align="middle" justify="space-between">
            {/* Left side - Title */}
            <Col>
              <Space align="center">
                <ShopOutlined style={{ fontSize: 24, color: "#1677ff" }} />
                <Title level={3} style={{ margin: 0 }}>
                  Client Management
                </Title>
              </Space>
            </Col>

            {/* Right side - Toggle + Add Button */}
            <Col>
              <Space>
                {/* Card / List Button Toggle */}
                <div
                  style={{
                    display: "flex",
                    background: "#f5f5f5",
                    borderRadius: 10,
                    padding: 2,
                    boxShadow: "inset 0 0 0 1px #d9d9d9",
                  }}
                >
                  {/* Card View Button */}
                  <Button
                    type="text"
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode("card")}
                    style={{
                      borderRadius: 8,
                      padding: "4px 14px",
                      fontWeight: 500,
                      background:
                        viewMode === "card" ? "#1677ff" : "transparent",
                      color: viewMode === "card" ? "#fff" : "#595959",
                      transition: "all 0.25s ease",
                    }}
                  >
                    Card
                  </Button>

                  {/* List View Button */}
                  <Button
                    type="text"
                    icon={<BarsOutlined />}
                    onClick={() => setViewMode("list")}
                    style={{
                      borderRadius: 8,
                      padding: "4px 14px",
                      fontWeight: 500,
                      background:
                        viewMode === "list" ? "#1677ff" : "transparent",
                      color: viewMode === "list" ? "#fff" : "#595959",
                      transition: "all 0.25s ease",
                    }}
                  >
                    List
                  </Button>
                </div>
                

                {/* Add Client Button */}
                {canManage && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={showAddModal}
                  >
                    Add Client
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
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
                  valueStyle={{ color: "#1677ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Active Clients"
                  value={stats.overview.activeClients}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Inactive Clients"
                  value={stats.overview.inactiveClients}
                  valueStyle={{ color: "#ff4d4f" }}
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

       

        {viewMode === "card" ? (
          <Row gutter={[24, 24]}>
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                    <Card
                      loading
                      style={{
                        height: 320,
                        borderRadius: 18,
                      }}
                    />
                  </Col>
                ))
              : clients.map((client) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={client.id}>
                    <Card
                      hoverable
                      className="client-card"
                      onClick={() => showViewModal(client)}
                      style={{
                        height: "100%",
                        borderRadius: 18,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        border: "1px solid rgba(22,119,255,0.15)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
                        background:
                          "linear-gradient(180deg, #ffffff 0%, #fafcff 100%)",
                      }}
                      bodyStyle={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        padding: 18,
                      }}
                    >
                      {/* ===== HEADER ===== */}
                      <div
                        style={{
                          display: "flex",
                          marginBottom: 18,
                          alignItems: "center",
                        }}
                      >
                        <Avatar
                          size={52}
                          style={{
                            background:
                              "linear-gradient(135deg, #1677ff, #69b1ff)",
                            boxShadow: "0 8px 20px rgba(22,119,255,0.4)",
                            fontWeight: "bold",
                            fontSize: 18,
                          }}
                        >
                          {client.name?.[0]?.toUpperCase()}
                        </Avatar>

                        <div style={{ marginLeft: 14, flex: 1 }}>
                          <Title
                            level={5}
                            style={{
                              margin: 0,
                              lineHeight: 1.3,
                              fontWeight: 600,
                            }}
                            ellipsis={{ tooltip: client.name }}
                          >
                            {client.name}
                          </Title>

                          {client.company && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {client.company}
                            </Text>
                          )}

                          <div style={{ marginTop: 6 }}>
                            <Tag
                              color={client.isActive ? "blue" : "red"}
                              style={{
                                fontWeight: 600,
                                borderRadius: 6,
                              }}
                            >
                              {client.isActive ? "ACTIVE" : "INACTIVE"}
                            </Tag>
                          </div>
                        </div>
                      </div>

                      {/* ===== CLIENT INFO ===== */}
                      <div
                        style={{
                          background: "rgba(245,248,250,0.9)",
                          backdropFilter: "blur(6px)",
                          padding: 14,
                          borderRadius: 12,
                          marginBottom: 18,
                          flex: 1,
                          border: "1px solid #e6f4ff",
                        }}
                      >
                        <Space direction="vertical" size={8}>
                          <Space>
                            <MailOutlined style={{ color: "#1677ff" }} />
                            <Text style={{ fontSize: 13 }}>
                              {client.email || "—"}
                            </Text>
                          </Space>

                          {client.phone && (
                            <Space>
                              <PhoneOutlined style={{ color: "#1677ff" }} />
                              <Text style={{ fontSize: 13 }}>
                                {client.phone}
                              </Text>
                            </Space>
                          )}

                          {client.contactPerson && (
                            <Space>
                              <UserOutlined style={{ color: "#1677ff" }} />
                              <Text style={{ fontSize: 13 }}>
                                {client.contactPerson}
                              </Text>
                            </Space>
                          )}
                        </Space>
                      </div>

                      {/* ===== FOOTER ===== */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(client.createdAt).format("MMM DD, YYYY")}
                        </Text>

                        <Space>
                          {canManage && (
                            <>
                              <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showEditModal(client);
                                }}
                              />
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showDeleteModal(client);
                                }}
                              />
                            </>
                          )}
                        </Space>
                      </div>
                    </Card>
                  </Col>
                ))}
          </Row>
        ) : (
          <Card size="small">
            <Table
              columns={columns}
              dataSource={clients}
              rowKey="id"
              loading={loading}
              onRow={(record) => ({
                onClick: () => showViewModal(record),
              })}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} clients`,
                onChange: (page, pageSize) =>
                  setPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize || 10,
                  })),
              }}
              size="small"
              scroll={{ x: 900 }}
            />
          </Card>
        )}

        {/*Modal*/}
        <Modal
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setSelectedClient(null);
          }}
          footer={null}
          width={700}
          centered
          destroyOnClose
          styles={{
            content: {
              borderRadius: 20,
              padding: 0,
              overflow: "hidden",
            },
          }}
        >
          {selectedClient && modalType === "view" && (
            <>
              {/* ===== CLIENT HEADER (same as project modal header) ===== */}
              <div
                className="client-view-header"
                style={{
                  padding: "22px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background:
                    "linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)",
                  color: "#fff",
                }}
              >
                {/* Avatar */}
                <Avatar
                  size={52}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.25)",
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                >
                  {selectedClient.name?.[0]?.toUpperCase()}
                </Avatar>

                {/* Name & Email */}
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ margin: 0, color: "#fff" }}>
                    {selectedClient.name}
                  </Title>
                  <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                    {selectedClient.email || "—"}
                  </Text>
                </div>

                {/* Status Tag */}
                <Tag
                  color={selectedClient.isActive ? "blue" : "red"}
                  style={{
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 6,
                  }}
                >
                  {selectedClient.isActive ? "ACTIVE" : "INACTIVE"}
                </Tag>
              </div>

              {/* ===== BODY ===== */}
              <div style={{ padding: 24, background: "#fafcff" }}>
                <Row gutter={[16, 16]}>
                  {selectedClient.phone && (
                    <Col span={12}>
                      <Card
                        size="small"
                        bordered={false}
                        className="client-view-card"
                      >
                        <Text strong>Phone</Text>
                        <div style={{ marginTop: 6 }}>
                          {selectedClient.phone}
                        </div>
                      </Card>
                    </Col>
                  )}
                  {selectedClient.company && (
                    <Col span={12}>
                      <Card
                        size="small"
                        bordered={false}
                        className="client-view-card"
                      >
                        <Text strong>Company</Text>
                        <div style={{ marginTop: 6 }}>
                          {selectedClient.company}
                        </div>
                      </Card>
                    </Col>
                  )}
                  {selectedClient.contactPerson && (
                    <Col span={12}>
                      <Card
                        size="small"
                        bordered={false}
                        className="client-view-card"
                      >
                        <Text strong>Contact Person</Text>
                        <div style={{ marginTop: 6 }}>
                          {selectedClient.contactPerson}
                        </div>
                      </Card>
                    </Col>
                  )}
                  {selectedClient.address && (
                    <Col span={24}>
                      <Card
                        size="small"
                        bordered={false}
                        className="client-view-card"
                      >
                        <Text strong>Address</Text>
                        <div style={{ marginTop: 6 }}>
                          {selectedClient.address}
                        </div>
                      </Card>
                    </Col>
                  )}
                  {selectedClient.notes && (
                    <Col span={24}>
                      <Card
                        size="small"
                        bordered={false}
                        className="client-view-card"
                      >
                        <Text strong>Notes</Text>
                        <div style={{ marginTop: 6 }}>
                          {selectedClient.notes}
                        </div>
                      </Card>
                    </Col>
                  )}
                  <Col span={12}>
                    <Card
                      size="small"
                      bordered={false}
                      className="client-view-card"
                    >
                      <Text strong>Created</Text>
                      <div style={{ marginTop: 6, color: "#595959" }}>
                        {dayjs(selectedClient.createdAt).format(
                          "MMM DD, YYYY HH:mm"
                        )}
                      </div>
                    </Card>
                  </Col>
                  {selectedClient.createdBy && (
                    <Col span={12}>
                      <Card
                        size="small"
                        bordered={false}
                        className="client-view-card"
                      >
                        <Text strong>Created By</Text>
                        <div style={{ marginTop: 6, color: "#595959" }}>
                          {selectedClient.createdBy.name}
                        </div>
                      </Card>
                    </Col>
                  )}
                </Row>
              </div>

              {/* ===== FOOTER ===== */}
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #f0f0f0",
                  background: "#fff",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <Button
                  onClick={() => setIsModalVisible(false)}
                  className="client-view-close-btn"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
}
