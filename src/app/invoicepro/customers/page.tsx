

"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Space,
  Typography,
  Input,
  Button,
  message,
  Row,
  Col,
  Card,
  Divider,
  Dropdown,
  Modal,
  Tag,
  Segmented,
  Table
} from "antd";
import {
  UserAddOutlined,
  PlusOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  MenuFoldOutlined,
  AppstoreOutlined
} from "@ant-design/icons";

import CustomerModal from "@/components/customer/CustomerModal";
import { Customer as ServiceCustomer } from "@/services/customersService";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/use-customers";
import { Form } from "antd";

const { Title } = Typography;

export default function InvoiceproCustomerPage() {
  const { data: customersData, isLoading } = useCustomers();
  const customers = customersData?.data || [];

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ServiceCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
const [viewMode, setViewMode] = useState<"card" | "table">("card");




  // Filter customers based on search
  const filteredCustomers = customers.filter(c =>
    c.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const creating = createCustomer.status === "pending";
const updating = updateCustomer.status === "pending";

const totalCustomers = customers.length;






const handleSave = async (
  values: Omit<
    ServiceCustomer,
    "id" | "tenantId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"
  >,
  id?: string
) => {
  const isDuplicate = customers.some(
    (c) =>
      c.companyName?.trim().toLowerCase() ===
        values.companyName.trim().toLowerCase() &&
      c.id !== id
  );

  if (isDuplicate) {
    messageApi.error("Customer with this company name already exists");
    return;
  }

  const payload = {
    companyName: values.companyName.trim(),
    email: values.email || "",
    phone: values.phone || "",
    address: values.address || "",
    city: values.city || "",
    country: values.country || "",
    taxId: values.taxId || "",
  };

  try {
    if (id) {
      await updateCustomer.mutateAsync({ id, data: payload });
      messageApi.success("Customer updated successfully");
    } else {
      await createCustomer.mutateAsync(payload);
      messageApi.success("Customer created successfully");
    }

    setIsModalOpen(false);
    setEditingCustomer(null);
    form.resetFields();
  } catch (error: any) {
    messageApi.error(error.message || "Failed to save customer");
  }
};


const columns = [
  {
    title: "Company",
    dataIndex: "companyName",
    key: "companyName",
    render: (value: string) => value || "-",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    render: (value: string) => value || "-",
  },
  {
    title: "Phone",
    dataIndex: "phone",
    key: "phone",
    render: (value: string) => value || "-",
  },
  {
    title: "Location",
    key: "location",
    render: (_: any, record: ServiceCustomer) =>
      record.city || record.country
        ? `${record.city || ""} ${record.country || ""}`.trim()
        : "-",
  },
  {
    title: "Tax ID",
    dataIndex: "taxId",
    key: "taxId",
    render: (value: string) => value || "-",
  },
  {
    title: "Action",
    key: "action",
    render: (_: any, record: ServiceCustomer) => (
      <Dropdown
        menu={{
          items: [
            {
              key: "edit",
              icon: <EditOutlined />,
              label: "Edit",
              onClick: () => handleEdit(record),
            },
            {
              key: "delete",
              danger: true,
              label: "Delete",
              onClick: () => {
                setDeletingCustomerId(record.id);
                setIsDeleteModalOpen(true);
              },
            },
          ],
        }}
      >
        <MoreOutlined className="cursor-pointer" />
      </Dropdown>
    ),
  },
];

  // Edit customer
  const handleEdit = (customer: ServiceCustomer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setIsModalOpen(true);
  };



const confirmDelete = async () => {
  if (!deletingCustomerId) return;

  await deleteCustomer.mutateAsync(deletingCustomerId);

  messageApi.success("Customer deleted successfully");

  setIsDeleteModalOpen(false);
  setDeletingCustomerId(null);
};




  return (
    <MainLayout>
      {contextHolder}
      <div style={{ padding: 10 }}>

        <Card className="shadow-sm border-gray-200 h-full flex flex-col pb-40">


        {/* Header */}
        {/* <div style={{ marginBottom: 20 }}>
          <Space align="center">
            <UserAddOutlined style={{ fontSize: 24, color: "#1677ff" }} />
            <Title level={3} style={{ margin: 0 }}>
              Customers
            </Title>
          </Space>
        </div> */}

        {/* Search + Add */}
        {/* <div
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
        </div> */}


        <div className="flex flex-row items-center justify-between gap-4 mb-3 flex-nowrap">
  {/* LEFT */}
  <div className="flex flex-col shrink-0">
    {/* Icon + Title */}
    <div className="flex items-center space-x-3">
      <UserAddOutlined style={{ fontSize: 24, color: "#1677ff" }} />
      <Title level={3} className="!mb-0 !text-gray-900">
        Customers
      </Title>
    </div>

    {/* Description */}
    <Typography.Paragraph
      type="secondary"
      className=" mt-1 !mb-0"
    >
      Manage customer details, contact information, and billing profiles.
    </Typography.Paragraph>

    {/* TAG */}
    <div className=" mt-2">

      <Tag color="purple">
                  Customers: <strong>{totalCustomers}</strong>
                </Tag>
    </div>
  </div>

  {/* RIGHT */}
  <div className="flex flex-row items-center gap-3 flex-nowrap">
    <Segmented
  options={[
    { label: "Card", value: "card" ,icon:<AppstoreOutlined/>},
    { label: "Table", value: "table",icon:<MenuFoldOutlined/> },
  ]}
  value={viewMode}
  onChange={(value) => setViewMode(value as "card" | "table")}
/>

    <Input.Search
      placeholder="Search customers..."
      allowClear
      size="middle"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-64"
    />

    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => {
        setEditingCustomer(null);
        form.resetFields();
        setIsModalOpen(true);
      }}
      className="h-11 shrink-0"
    >
      Add Customer
    </Button>
  </div>
</div>

<Divider style={{marginTop:"0"}}/>


        {/* Customers List */}
        <div className="mt-6">
          {isLoading ? (
            <div>Loading...</div>
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-gray-400">
              No customers added yet
            </div>
          ) : viewMode === "card" ? (
            <Row gutter={[16, 16]}>
              {filteredCustomers.map((customer) => (
                <Col xs={24} sm={12} md={8} lg={6} key={customer.id}>
                  <div className="gradient-border-wrapper">
                    <Card hoverable className="relative bg-white" bodyStyle={{ padding: 16 }}>
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-base font-semibold">
                            {customer.companyName?.charAt(0)}
                          </div>

                          <div>
                            <Typography.Text className="block font-medium text-gray-800">
                              {customer.companyName}
                            </Typography.Text>

                            <Typography.Text type="secondary" className="text-xs">
                              {customer.city}
                              {customer.city && customer.country && ", "}
                              {customer.country}
                            </Typography.Text>
                          </div>
                        </div>

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
    <span
      onClick={() => {
        setDeletingCustomerId(customer.id);
        setIsDeleteModalOpen(true);
      }}
    >
      <DeleteOutlined /> Delete
    </span>
  ),
}

                            ],
                          }}
                          trigger={["click"]}
                        >
                          <MoreOutlined className="cursor-pointer text-gray-400" />
                        </Dropdown>
                      </div>

                      {/* Contact Info */}
                      {/* <div className="mt-4 space-y-2 text-sm text-gray-600">
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
                            <span className="line-clamp-1">{customer.address}</span>
                          </div>
                        )}
                      </div> */}

                      <div className="mt-4 space-y-2 text-sm text-gray-600">

  {/* EMAIL */}
  <div className="flex items-center gap-2">
    <MailOutlined className="text-gray-400" />
    <span className="truncate">
      {customer.email || "--"}
    </span>
  </div>

  {/* PHONE */}
  <div className="flex items-center gap-2">
    <PhoneOutlined className="text-gray-400" />
    <span>
      {customer.phone || "--"}
    </span>
  </div>

  {/* ADDRESS */}
  <div className="flex items-center gap-2">
    <EnvironmentOutlined className="text-gray-400" />
    <span className="line-clamp-1">
      {customer.address || "--"}
    </span>
  </div>

</div>


                      {/* {customer.taxId && (
                        <>
                          <Divider className="my-3" />
                          <Typography.Text className="text-xs text-gray-500">
                            Tax ID: <span className="font-medium">{customer.taxId}</span>
                          </Typography.Text>
                        </>
                      )} */}
                      <>
  <Divider className="my-3" />
  <Typography.Text className="text-xs text-gray-500">
    Tax ID:{" "}
    <span className="font-medium">
      {customer.taxId || "--"}
    </span>
  </Typography.Text>
</>

                    </Card>
                  </div>
                </Col>
              ))}
            </Row>
          ):(
            <Table
      rowKey="id"
      columns={columns}
      dataSource={filteredCustomers}
      pagination={{ pageSize: 10 }}
    />
          )}
        </div>

        <CustomerModal
          open={isModalOpen}
          loading={creating || updating}
          customer={editingCustomer}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }}
          onSave={handleSave}
        />

        </Card>
      </div>

      {/* hi */}



      <Modal
  open={isDeleteModalOpen}
  title="Delete customer"
  okText="Delete"
  okType="danger"
  cancelText="Cancel"
  confirmLoading={deleteCustomer.status === "pending"}
  onOk={confirmDelete}
  onCancel={() => {
    setIsDeleteModalOpen(false);
    setDeletingCustomerId(null);
  }}
>
  <p>
    Are you sure you want to delete this customer?  
    This action cannot be undone.
  </p>
</Modal>

    </MainLayout>
  );
}


