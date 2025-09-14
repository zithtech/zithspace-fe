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
  Divider,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ShopOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { ClientService, Client, CreateClientData, UpdateClientData } from '@/services/clientService';
import { MembersService } from '@/services/membersService';
import { ApiError } from '@/lib/axios';
import type { ColumnsType } from "antd/es/table";
import { useRBAC } from "@/lib/rbac";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Manager {
  id: string;
  name: string;
  position: string;
}

export default function ClientsPage() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return <LoadingSpinner message="Loading clients..." />;
  }

  const router = useRouter();
  const [form] = Form.useForm();

  // State management
  const [clients, setClients] = useState<Client[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [clientTypeFilter, setClientTypeFilter] = useState<string | undefined>(undefined);
  const [countryFilter, setCountryFilter] = useState<string | undefined>(undefined);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "delete" | "view">("add");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Available managers for dropdown
  const [managers, setManagers] = useState<Manager[]>([]);

  // Check permissions - Allow all users to view, but redirect if no access
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
        clientType: clientTypeFilter,
        country: countryFilter,
      });

      setClients(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Failed to fetch clients");
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
      })));
    } catch (error) {
      console.error("Failed to fetch managers:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchManagers();
    }
  }, [
    user,
    pagination.current,
    pagination.pageSize,
    searchTerm,
    statusFilter,
    clientTypeFilter,
    countryFilter,
  ]);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      setFormLoading(true);
      setError("");

      // Prepare form data
      const formData = {
        companyName: values.companyName,
        contactPerson: {
          firstName: values.firstName,
          lastName: values.lastName,
        },
        clientType: values.clientType,
        email: {
          primary: values.primaryEmail,
          alternate: values.alternateEmail || undefined,
        },
        phone: {
          primary: values.primaryPhone,
          alternate: values.alternatePhone || undefined,
        },
        website: values.website || undefined,
        socialLinks: {
          linkedin: values.linkedin || undefined,
          twitter: values.twitter || undefined,
          facebook: values.facebook || undefined,
        },
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          country: values.country,
          postalCode: values.postalCode,
        },
        billingAddress: values.sameBillingAddress ? undefined : {
          street: values.billingStreet,
          city: values.billingCity,
          state: values.billingState,
          country: values.billingCountry,
          postalCode: values.billingPostalCode,
        },
        industry: values.industry,
        businessType: values.businessType,
        taxInfo: {
          gstNumber: values.gstNumber || undefined,
          vatNumber: values.vatNumber || undefined,
          taxId: values.taxId || undefined,
        },
        paymentTerms: values.paymentTerms || undefined,
        status: values.status || 'Active',
        assignedManager: values.assignedManager,
        leadSource: values.leadSource || undefined,
        tags: values.tags || [],
        contractDetails: {
          startDate: values.contractStartDate || undefined,
          endDate: values.contractEndDate || undefined,
          renewalDate: values.contractRenewalDate || undefined,
          value: values.contractValue || undefined,
          currency: values.contractCurrency || undefined,
        },
        communicationPreferences: {
          email: values.prefEmail !== false,
          phone: values.prefPhone !== false,
          whatsapp: values.prefWhatsapp !== false,
          sms: values.prefSms !== false,
        },
        notes: values.notes || undefined,
      };

      if (modalType === "edit" && selectedClient) {
        await ClientService.updateClient(selectedClient.id, formData as UpdateClientData);
        setSuccess("Client updated successfully");
      } else {
        await ClientService.createClient(formData as CreateClientData);
        setSuccess("Client created successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      console.error("Failed to submit client form:", error);
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
    if (!selectedClient) return;

    try {
      setFormLoading(true);
      await ClientService.deleteClient(selectedClient.id);
      setSuccess("Client deleted successfully");
      setIsModalVisible(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      console.error("Failed to delete client:", error);
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
    setSelectedClient(null);
    setIsModalVisible(true);
  };

  const showEditModal = (client: Client) => {
    setModalType("edit");
    setSelectedClient(client);
    form.setFieldsValue({
      companyName: client.companyName,
      firstName: client.contactPerson.firstName,
      lastName: client.contactPerson.lastName,
      clientType: client.clientType,
      primaryEmail: client.email.primary,
      alternateEmail: client.email.alternate,
      primaryPhone: client.phone.primary,
      alternatePhone: client.phone.alternate,
      website: client.website,
      linkedin: client.socialLinks?.linkedin,
      twitter: client.socialLinks?.twitter,
      facebook: client.socialLinks?.facebook,
      street: client.address.street,
      city: client.address.city,
      state: client.address.state,
      country: client.address.country,
      postalCode: client.address.postalCode,
      billingStreet: client.billingAddress?.street,
      billingCity: client.billingAddress?.city,
      billingState: client.billingAddress?.state,
      billingCountry: client.billingAddress?.country,
      billingPostalCode: client.billingAddress?.postalCode,
      industry: client.industry,
      businessType: client.businessType,
      gstNumber: client.taxInfo?.gstNumber,
      vatNumber: client.taxInfo?.vatNumber,
      taxId: client.taxInfo?.taxId,
      paymentTerms: client.paymentTerms,
      status: client.status,
      assignedManager: client.assignedManager.id,
      leadSource: client.leadSource,
      tags: client.tags,
      contractStartDate: client.contractDetails?.startDate,
      contractEndDate: client.contractDetails?.endDate,
      contractRenewalDate: client.contractDetails?.renewalDate,
      contractValue: client.contractDetails?.value,
      contractCurrency: client.contractDetails?.currency,
      prefEmail: client.communicationPreferences?.email,
      prefPhone: client.communicationPreferences?.phone,
      prefWhatsapp: client.communicationPreferences?.whatsapp,
      prefSms: client.communicationPreferences?.sms,
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
              width: 32,
              height: 32,
              borderRadius: 16,
              background:
                record.status === "Active"
                  ? "#52c41a"
                  : record.status === "Prospect"
                  ? "#1677ff"
                  : record.status === "Lead"
                  ? "#faad14"
                  : "#ff4d4f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {record.companyName.charAt(0).toUpperCase()}
          </div>
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {record.companyName}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.contactPerson.firstName} {record.contactPerson.lastName}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: 180,
      render: (_, record: Client) => (
        <div>
          <Text style={{ fontSize: 12 }}>{record.email.primary}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.phone.primary}
          </Text>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "clientType",
      key: "clientType",
      width: 120,
      render: (type: string) => (
        <Tag
          color={
            type === "Enterprise"
              ? "purple"
              : type === "Small Business"
              ? "blue"
              : "green"
          }
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag
          color={
            status === "Active"
              ? "green"
              : status === "Prospect"
              ? "blue"
              : status === "Lead"
              ? "orange"
              : "red"
          }
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Manager",
      key: "assignedManager",
      width: 120,
      render: (_, record: Client) => (
        <Text style={{ fontSize: 12 }}>
          {record.assignedManager?.name || "-"}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "center",
      render: (_, record: Client) => {
        const rbac = useRBAC(user?.role as any);
        const canManage = rbac?.canManageMembers; // Using same permission as members for now

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
  const canManage = rbac?.canManageMembers; // Using same permission as members for now
//comment added
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

        {/* Filters Card */}
        <Card
          size="small"
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 16 } }}
        >
          <div className="flex items-center gap-2">
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
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="Prospect">Prospect</Option>
              <Option value="Lead">Lead</Option>
              <Option value="Suspended">Suspended</Option>
            </Select>

            <Select
              placeholder="Filter by type"
              value={clientTypeFilter}
              onChange={setClientTypeFilter}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="Individual">Individual</Option>
              <Option value="Small Business">Small Business</Option>
              <Option value="Enterprise">Enterprise</Option>
            </Select>

            <Select
              placeholder="Filter by country"
              value={countryFilter}
              onChange={setCountryFilter}
              style={{ width: 120 }}
              allowClear
            >
              <Option value="India">India</Option>
              <Option value="US">US</Option>
            </Select>
          </div>
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
                `${range[0]}-${range[1]} of ${total}`,
              onChange: (page, pageSize) => {
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || 10,
                }));
              },
            }}
            scroll={{ x: 800 }}
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
          width={modalType === "delete" ? 400 : modalType === "view" ? 800 : 900}
        >
          {modalType === "delete" ? (
            <div>
              <Text>
                Are you sure you want to delete{" "}
                <strong>{selectedClient?.companyName}</strong>? This action will
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
                      <Text strong>Company:</Text>
                      <br />
                      <Text>{selectedClient.companyName}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Contact Person:</Text>
                      <br />
                      <Text>{selectedClient.contactPerson.firstName} {selectedClient.contactPerson.lastName}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Email:</Text>
                      <br />
                      <Text>{selectedClient.email.primary}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Phone:</Text>
                      <br />
                      <Text>{selectedClient.phone.primary}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Type:</Text>
                      <br />
                      <Tag color="blue">{selectedClient.clientType}</Tag>
                    </Col>
                    <Col span={12}>
                      <Text strong>Status:</Text>
                      <br />
                      <Tag color={selectedClient.status === "Active" ? "green" : "red"}>
                        {selectedClient.status}
                      </Tag>
                    </Col>
                    <Col span={24}>
                      <Text strong>Address:</Text>
                      <br />
                      <Text>
                        {selectedClient.address.street}, {selectedClient.address.city}, {selectedClient.address.state}, {selectedClient.address.country} - {selectedClient.address.postalCode}
                      </Text>
                    </Col>
                    {selectedClient.notes && (
                      <Col span={24}>
                        <Text strong>Notes:</Text>
                        <br />
                        <Text>{selectedClient.notes}</Text>
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
              <Title level={5}>Basic Information</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="companyName"
                    label="Company Name"
                    rules={[
                      { required: true, message: "Please enter company name" },
                    ]}
                  >
                    <Input placeholder="Enter company name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="clientType"
                    label="Client Type"
                    rules={[
                      { required: true, message: "Please select client type" },
                    ]}
                  >
                    <Select placeholder="Select client type">
                      <Option value="Individual">Individual</Option>
                      <Option value="Small Business">Small Business</Option>
                      <Option value="Enterprise">Enterprise</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label="Contact First Name"
                    rules={[
                      { required: true, message: "Please enter first name" },
                    ]}
                  >
                    <Input placeholder="Enter first name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label="Contact Last Name"
                    rules={[
                      { required: true, message: "Please enter last name" },
                    ]}
                  >
                    <Input placeholder="Enter last name" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              <Title level={5}>Contact Information</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="primaryEmail"
                    label="Primary Email"
                    rules={[
                      { required: true, message: "Please enter primary email" },
                      { type: "email", message: "Please enter valid email" },
                    ]}
                  >
                    <Input placeholder="Enter primary email" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="alternateEmail"
                    label="Alternate Email"
                    rules={[
                      { type: "email", message: "Please enter valid email" },
                    ]}
                  >
                    <Input placeholder="Enter alternate email" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="primaryPhone"
                    label="Primary Phone"
                    rules={[
                      { required: true, message: "Please enter primary phone" },
                    ]}
                  >
                    <Input placeholder="Enter primary phone" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="alternatePhone"
                    label="Alternate Phone"
                  >
                    <Input placeholder="Enter alternate phone" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              <Title level={5}>Address Information</Title>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="street"
                    label="Street Address"
                    rules={[
                      { required: true, message: "Please enter street address" },
                    ]}
                  >
                    <Input placeholder="Enter street address" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="city"
                    label="City"
                    rules={[
                      { required: true, message: "Please enter city" },
                    ]}
                  >
                    <Input placeholder="Enter city" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="state"
                    label="State"
                    rules={[
                      { required: true, message: "Please enter state" },
                    ]}
                  >
                    <Input placeholder="Enter state" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="country"
                    label="Country"
                    rules={[
                      { required: true, message: "Please select country" },
                    ]}
                  >
                    <Select placeholder="Select country">
                      <Option value="India">India</Option>
                      <Option value="US">US</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="postalCode"
                    label="Postal Code"
                    rules={[
                      { required: true, message: "Please enter postal code" },
                    ]}
                  >
                    <Input placeholder="Enter postal code" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              <Title level={5}>Business Information</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="industry"
                    label="Industry"
                    rules={[
                      { required: true, message: "Please enter industry" },
                    ]}
                  >
                    <Input placeholder="Enter industry" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="businessType"
                    label="Business Type"
                    rules={[
                      { required: true, message: "Please enter business type" },
                    ]}
                  >
                    <Input placeholder="Enter business type" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="Status"
                    initialValue="Active"
                  >
                    <Select placeholder="Select status">
                      <Option value="Active">Active</Option>
                      <Option value="Inactive">Inactive</Option>
                      <Option value="Prospect">Prospect</Option>
                      <Option value="Lead">Lead</Option>
                      <Option value="Suspended">Suspended</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="assignedManager"
                    label="Assigned Manager"
                    rules={[
                      { required: true, message: "Please select assigned manager" },
                    ]}
                  >
                    <Select placeholder="Select assigned manager">
                      {managers.map((manager) => (
                        <Option key={manager.id} value={manager.id}>
                          {manager.name} ({manager.position})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

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
