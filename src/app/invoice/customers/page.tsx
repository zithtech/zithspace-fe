

"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
  Table,
  Spin
} from "antd";
import {
  UserPlus,
  Users,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Search,
  Plus,
  Building2,
  Globe,
  Fingerprint
} from "lucide-react";
import type { MenuProps } from "antd";

import CustomerModal from "@/components/customer/CustomerModal";
import { Customer as ServiceCustomer } from "@/services/customersService";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/use-customers";
import { Form } from "antd";

const { Title, Text } = Typography;

export default function InvoiceproCustomerPage() {
  const router = useRouter();
  const { canReadInvoice, canCreateInvoice, canUpdateInvoice, canDeleteInvoice } = usePermission();
  const { isLoading: authLoading } = useAuth();

  /* ================= ATTRACTIVE METRIC CARDS ================= */
  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card
      styles={{ body: { padding: "12px 16px" } }}
      style={{
        borderRadius: 16,
        border: "1px solid #f1f5f9",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        height: "100%"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
        </div>
        <div style={{
          color,
          background: `${color}12`,
          padding: 12,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadInvoice) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadInvoice, router]);

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
      gstin: values.gstin || "",
      pan: values.pan || "",
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
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-xs font-bold shrink-0">
            {value?.charAt(0)}
          </div>
          <Typography.Text strong style={{ color: "#1e293b" }}>{value || "-"}</Typography.Text>
        </div>
      ),
    },
    {
      title: "Contact Info",
      key: "contact",
      render: (_: any, record: ServiceCustomer) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Mail size={12} className="text-slate-400" />
            <span>{record.email || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Phone size={12} className="text-slate-400" />
            <span>{record.phone || "-"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Tax Identifiers",
      key: "tax",
      render: (_: any, record: ServiceCustomer) => (
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Tag color="blue" bordered={false} style={{ fontSize: '10px', margin: 0, padding: '0 4px' }}>GST</Tag>
            <span className="text-xs font-medium text-slate-600">{record.gstin || "-"}</span>
          </div>
          <div className="flex gap-2">
            <Tag color="cyan" bordered={false} style={{ fontSize: '10px', margin: 0, padding: '0 4px' }}>PAN</Tag>
            <span className="text-xs font-medium text-slate-600">{record.pan || "-"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Location",
      key: "location",
      render: (_: any, record: ServiceCustomer) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin size={12} className="text-slate-400" />
          <span className="truncate max-w-[120px]">
            {record.city || record.country
              ? `${record.city || ""} ${record.country || ""}`.trim()
              : "-"}
          </span>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      align: 'center' as const,
      render: (_: any, record: ServiceCustomer) => {
        if (!canUpdateInvoice && !canDeleteInvoice) return null;

        const menuItems: MenuProps['items'] = [];
        if (canUpdateInvoice) {
          menuItems.push({
            key: "edit",
            icon: <Edit2 size={16} />,
            label: "Edit",
            onClick: () => handleEdit(record),
          });
        }
        if (canDeleteInvoice) {
          menuItems.push({
            key: "delete",
            danger: true,
            icon: <Trash2 size={16} />,
            label: "Delete",
            onClick: () => {
              setDeletingCustomerId(record.id);
              setIsDeleteModalOpen(true);
            },
          });
        }

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" icon={<MoreVertical size={18} className="text-slate-400" />} />
          </Dropdown>
        );
      },
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




  if (authLoading) return <MainLayout><Spin /></MainLayout>;
  if (!canReadInvoice) return null;

  return (
    <MainLayout>
      {contextHolder}
      <div style={{
        margin: "0 -24px",
        padding: "24px 32px",
        background: "#ffffff",
        minHeight: "calc(100vh - 64px)"
      }}>
        {/* ================= HEADER ================= */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <Space size={14} align="center">
              <div style={{ background: "#eff6ff", padding: 12, borderRadius: 14, color: "#3b82f6", display: "flex" }}>
                <Users size={28} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Customers</Title>
                <Text style={{ color: "#64748b", fontSize: 15 }}>Manage customer details, contact information, and billing profiles.</Text>
              </div>
            </Space>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
            <Segmented
              options={[
                {
                  value: "card",
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px' }}>
                      <LayoutGrid size={16} />
                    </div>
                  )
                },
                {
                  value: "table",
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px' }}>
                      <List size={16} />
                    </div>
                  )
                },
              ]}
              value={viewMode}
              onChange={(value) => setViewMode(value as "card" | "table")}
              style={{ padding: 4, borderRadius: 10 }}
            />
            <Input.Search
              placeholder="Search customers..."
              allowClear
              size="large"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260, borderRadius: 12 }}
            />
            {canCreateInvoice && (
              <Button
                type="primary"
                size="large"
                icon={<Plus size={18} />}
                style={{ borderRadius: 12, height: 44, padding: "0 24px", fontWeight: 600, background: "#2563eb", border: "none" }}
                onClick={() => {
                  setEditingCustomer(null);
                  form.resetFields();
                  setIsModalOpen(true);
                }}
              >
                Add Customer
              </Button>
            )}
          </div>
        </div>

        {/* ================= METRIC STATS ================= */}
        <Row gutter={[24, 24]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Total Customers" value={totalCustomers} icon={Users} color="#3b82f6" />
          </Col>
          {/* We can add more stats here if needed, like active customers, etc. */}
        </Row>

        <Divider style={{ marginTop: "0" }} />


        {/* ================= CUSTOMERS LIST ================= */}
        <div style={{ marginTop: 8 }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64 bg-slate-50 rounded-2xl border border-slate-100">
              <Spin indicator={<Users size={32} className="animate-pulse text-blue-500" />} />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="size-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
                <Users size={32} className="text-slate-300" />
              </div>
              <Title level={4} style={{ color: "#64748b" }}>No customers found</Title>
              <Text style={{ color: "#94a3b8" }}>Get started by adding your first customer.</Text>
            </div>
          ) : viewMode === "card" ? (
            <Row gutter={[20, 20]}>
              {filteredCustomers.map((customer) => (
                <Col xs={24} sm={12} md={8} lg={6} key={customer.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 16, border: "1px solid #f1f5f9", overflow: 'hidden' }}
                    styles={{ body: { padding: 20 } }}
                    className="customer-card shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-lg font-bold">
                          {customer.companyName?.charAt(0)}
                        </div>
                        <div style={{ maxWidth: 140 }}>
                          <Typography.Text strong className="block text-slate-800 truncate" title={customer.companyName}>
                            {customer.companyName}
                          </Typography.Text>
                          <Typography.Text type="secondary" className="text-xs flex items-center gap-1">
                            {/* <MapPin size={10} /> */}
                            {customer.city}{customer.city && customer.country && ", "}{customer.country}
                          </Typography.Text>
                        </div>
                      </div>

                      {(canUpdateInvoice || canDeleteInvoice) && (
                        <Dropdown
                          menu={{
                            items: [
                              canUpdateInvoice && {
                                key: "edit",
                                icon: <Edit2 size={16} />,
                                label: "Edit",
                                onClick: () => handleEdit(customer),
                              },
                              canDeleteInvoice && {
                                key: "delete",
                                danger: true,
                                icon: <Trash2 size={16} />,
                                label: "Delete",
                                onClick: () => {
                                  setDeletingCustomerId(customer.id);
                                  setIsDeleteModalOpen(true);
                                },
                              },
                            ].filter(Boolean) as any
                          }}
                          trigger={["click"]}
                        >
                          <Button type="text" icon={<MoreVertical size={18} className="text-slate-400" />} />
                        </Dropdown>
                      )}
                    </div>

                    <div className="mt-5 space-y-2.5">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="p-1.5 bg-slate-50 rounded-lg"><Mail size={14} className="text-slate-400" /></div>
                        <span className="truncate">{customer.email || "--"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="p-1.5 bg-slate-50 rounded-lg"><Phone size={14} className="text-slate-400" /></div>
                        <span>{customer.phone || "--"}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <div className="p-1.5 bg-slate-50 rounded-lg shrink-0"><MapPin size={14} className="text-slate-400" /></div>
                        <span className="leading-tight">{customer.address || "--"}</span>
                      </div>
                    </div>

                    <Divider className="my-4 border-slate-100" />

                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Tax ID</span>
                        <span className="font-medium text-slate-700">{customer.taxId || "--"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">GSTIN</span>
                        <span className="font-medium text-slate-700">{customer.gstin || "--"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">PAN</span>
                        <span className="font-medium text-slate-700">{customer.pan || "--"}</span>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                overflow: "hidden"
              }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredCustomers}
                pagination={{
                  pageSize: 10,
                  style: { padding: "16px 24px" }
                }}
                size="middle"
                rowClassName={() => "customer-table-row"}
              />
            </Card>
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

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .customer-table-row:hover {
          background-color: #f8fafc !important;
        }
        .ant-table-thead > tr > th {
          background-color: #f1f5f9 !important;
          color: #475569 !important;
          font-weight: 600 !important;
          padding: 8px 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 8px 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .customer-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .customer-card:hover {
          transform: translateY(-2px);
        }
      `}} />

      <Modal
        open={isDeleteModalOpen}
        title={
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 size={20} />
            <span>Delete Customer</span>
          </div>
        }
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        confirmLoading={deleteCustomer.status === "pending"}
        onOk={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingCustomerId(null);
        }}
        style={{ borderRadius: 16 }}
      >
        <p className="py-4 text-slate-600">
          Are you sure you want to delete this customer? This action will remove all customer profiles and cannot be undone.
        </p>
      </Modal>

    </MainLayout>
  );
}


