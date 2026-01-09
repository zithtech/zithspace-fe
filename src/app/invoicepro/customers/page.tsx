"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Space,
  Typography,
  Input,
  Button,
  Modal,
  Form,
  Row,
  Col,
  message,
  Card,
  Divider,
  Dropdown,
  Popconfirm,
} from "antd";
import {
  SettingOutlined,
  PlusOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

import { useCustomers } from "@/context/CustomerContext";
import { nanoid } from "nanoid";
import { Customer } from "@/types/invoice";
import CustomerModal from "@/components/customer/CustomerModal";

export default function InvoiceproCustomerPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  //const [customers, setCustomers] = useState<Customer[]>([]);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  // mock backend

  const { customers, addCustomer, updateCustomer, deleteCustomer } =
    useCustomers();
  const [form] = Form.useForm();

  // 🔹 MOCK SAVE (replace later with API)
  // const saveCustomer = async (data: Customer) => {
  //   addCustomer({
  //     id: nanoid(), // temporary id
  //     ...data,
  //   });
  // };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingCustomer) {
        updateCustomer(editingCustomer.id, values);
        message.success("Customer updated");
      } else {
        addCustomer({ id: nanoid(), ...values });
        message.success("Customer added");
      }

      form.resetFields();
      setEditingCustomer(null);
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name?.toLowerCase().includes(search.toLowerCase())
  );

  // 🔹 EDIT
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setIsModalOpen(true);
  };

  // 🔹 DELETE
  const confirmDelete = (id: string) => {
    Modal.confirm({
      title: "Delete customer?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk() {
        deleteCustomer(id);
        message.success("Customer deleted");
      },
    });
  };

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Space align="center">
            <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
            <Title level={3} style={{ margin: 0 }}>
              Customers
            </Title>
          </Space>
        </div>

        {/* Search + Add */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            padding: "12px 16px",
            background: "#fff",
            borderRadius: 8,
            border: "1px solid #f0f0f0",
          }}
        >
          <Input.Search
            placeholder="Search customers..."
            allowClear
            size="large"
            style={{ flex: 1, minWidth: 240 }}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCustomer(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            Add Customer
          </Button>
        </div>

        {/* Customers List */}
        <div className="mt-6">
          {customers.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-gray-400">
              No customers added yet
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredCustomers.map((customer) => (
                <Col xs={24} sm={12} md={8} lg={6} key={customer.id}>
                  {/* 🔹 Gradient border wrapper */}
                  <div className="gradient-border-wrapper">
                    <Card
                      hoverable
                      className="relative bg-white"
                      bodyStyle={{ padding: 16 }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          {/* Avatar */}
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-base font-semibold">
                            {customer.name?.charAt(0)}
                          </div>

                          {/* Company */}
                          <div>
                            <Typography.Text className="block font-medium text-gray-800">
                              {customer.name}
                            </Typography.Text>

                            <Typography.Text
                              type="secondary"
                              className="text-xs"
                            >
                              {customer.city}
                              {customer.city && customer.country && ", "}
                              {customer.country}
                            </Typography.Text>
                          </div>
                        </div>

                        {/* More */}
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: "edit",
                                icon: <EditOutlined />,
                                label: "Edit",
                                onClick: () => handleEdit(customer),
                              },
                              {
                                key: "delete",
                                danger: true,
                                label: (
                                  <Popconfirm
                                    title="Delete customer?"
                                    description="This action cannot be undone"
                                    okText="Delete"
                                    okType="danger"
                                    onConfirm={() => {
                                      deleteCustomer(customer.id);
                                      message.success("Customer deleted");
                                    }}
                                  >
                                    <span>
                                      <DeleteOutlined /> Delete
                                    </span>
                                  </Popconfirm>
                                ),
                              },
                            ],
                          }}
                          trigger={["click"]}
                        >
                          <MoreOutlined className="cursor-pointer text-gray-400" />
                        </Dropdown>
                      </div>

                      {/* Contact Info */}
                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <MailOutlined className="text-gray-400" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}

                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <PhoneOutlined className="text-gray-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}

                        {customer.address && (
                          <div className="flex items-center gap-2">
                            <EnvironmentOutlined className="text-gray-400" />
                            <span className="line-clamp-1">
                              {customer.address}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Divider + Tax ID */}
                      {customer.taxid && (
                        <>
                          <Divider className="my-3" />
                          <Typography.Text className="text-xs text-gray-500">
                            Tax ID:{" "}
                            <span className="font-medium">
                              {customer.taxid}
                            </span>
                          </Typography.Text>
                        </>
                      )}
                    </Card>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* Modal */}
        {/* <Modal
          title={editingCustomer ? "Edit Customer" : "Add Customer"}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
            form.resetFields();
          }}
          onOk={handleSave}
          okText="Save"
          confirmLoading={loading}
          width={520}
          destroyOnClose
        >
          <Form layout="vertical" form={form}>
            <Form.Item
              label="Company Name"
              name="name"
              rules={[{ required: true, message: "Enter company name" }]}
            >
              <Input placeholder="Acme Corp" size="large" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Enter email" }]}
            >
              <Input placeholder="contact@company.com" size="large" />
            </Form.Item>

            <Form.Item label="Phone" name="phone">
              <Input placeholder="+91 98765 43210" size="large" />
            </Form.Item>

            <Form.Item label="Address" name="address">
              <Input placeholder="123 Business Ave" size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="City" name="city">
                  <Input placeholder="San Francisco" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Country" name="country">
                  <Input placeholder="USA" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Tax ID" name="taxid">
              <Input placeholder="US-12345678" size="large" />
            </Form.Item>
          </Form>
        </Modal> */}

        <CustomerModal
          open={isModalOpen}
          loading={loading}
          customer={editingCustomer}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }}
          onSave={(values, id) => {
            if (id) {
              updateCustomer(id, values);
            } else {
              addCustomer({ id: nanoid(), ...values });
            }
            setIsModalOpen(false);
          }}
        />
      </div>
    </MainLayout>
  );
}
