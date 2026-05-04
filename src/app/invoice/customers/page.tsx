

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
  Spin,
  Badge
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
  Fingerprint,
  Eye,
  AlertCircle,
  ShieldCheck,
  Ban,
  Check,
  Import
} from "lucide-react";
import type { MenuProps } from "antd";

import CustomerDrawer from "@/components/customer/CustomerDrawer";
import CustomerViewDrawer from "@/components/invoice/CustomerViewDrawer";
import ClientImportModal from "@/components/customer/ClientImportModal";
import { Customer as ServiceCustomer } from "@/services/customersService";
import { ClientV2 } from "@/services/clientV2Service";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/use-customers";
import { Form } from "antd";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

const { Title, Text } = Typography;

export default function InvoiceproCustomerPage() {
  const router = useRouter();
  const { canReadInvoice, canCreateInvoice, canUpdateInvoice, canDeleteInvoice } = usePermission();
  const { isLoading: authLoading } = useAuth();

  /* ================= ATTRACTIVE METRIC CARDS ================= */
  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card
      styles={{ body: { padding: "12px 18px" } }}
      style={{
        borderRadius: 18,
        border: "1px solid var(--border-slate-100)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        height: "100%",
        background: "var(--customers-card-bg)",
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 2 }}>{label}</Text>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>{value}</div>
        </div>
        <div style={{
          color,
          background: `${color}15`,
          padding: 10,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 16px ${color}10`
        }}>
          <Icon size={20} strokeWidth={2.5} />
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

  const { data: customersData, isLoading, refetch } = useCustomers();
  const customers = customersData?.data || [];

  // Debug: Log customer data changes
  useEffect(() => {
    console.log("Customers data updated:", customers);
    console.log("Customers with email:", customers.filter(c => c.email));
    console.log("Customers with tax info:", customers.filter(c => c.taxId || c.gstin || c.pan));
  }, [customers]);

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

  // View Drawer State
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedCustomerForView, setSelectedCustomerForView] = useState<ServiceCustomer | null>(null);

  // Client Import Modal State
  const [isClientImportModalOpen, setIsClientImportModalOpen] = useState(false);




  // Filter customers based on search
  const filteredCustomers = customers.filter(c =>
    c.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const creating = createCustomer.status === "pending";
  const updating = updateCustomer.status === "pending";

  const totalCustomers = customers.length;
  const activeCustomersCount = customers.filter(c => c.isActive).length;
  const inactiveCustomersCount = customers.filter(c => !c.isActive).length;






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
      isActive: values.isActive ?? true,
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--customers-avatar-bg)', color: 'var(--customers-avatar-text)' }}>
            {value?.charAt(0)}
          </div>
          <Typography.Text strong style={{ color: "var(--text-primary)" }}>{value || "-"}</Typography.Text>
        </div>
      ),
    },
    {
      title: "Contact Info",
      key: "contact",
      render: (_: any, record: ServiceCustomer) => (
        <div>
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-slate-50)' }}><Mail size={14} style={{ color: 'var(--text-slate-400)' }} /></div>
            <span className="truncate">{record.email || "-"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-slate-50)' }}><Phone size={14} style={{ color: 'var(--text-slate-400)' }} /></div>
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
        <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <MapPin size={12} style={{ color: 'var(--text-slate-400)' }} />
          <span className="truncate max-w-[120px]">
            {record.city || record.country
              ? `${record.city || ""} ${record.country || ""}`.trim()
              : "-"}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_: any, record: ServiceCustomer) => (
        <Tag
          bordered={false}
          color={record.isActive ? "success" : "default"}
          className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider m-0"
        >
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      align: 'center' as const,
      render: (_: any, record: ServiceCustomer) => {
        if (!canUpdateInvoice && !canDeleteInvoice) return null;

        const menuItems: any[] = [
          {
            key: "view",
            icon: <Eye size={16} />,
            label: "View Profile",
            onClick: () => {
              setSelectedCustomerForView(record);
              setViewDrawerVisible(true);
            },
          },
          { type: 'divider' },
          canUpdateInvoice ? {
            key: "status_toggle",
            icon: record.isActive ? <Ban size={16} /> : <ShieldCheck size={16} />,
            label: record.isActive ? "Deactivate" : "Activate",
            onClick: async () => {
              try {
                await updateCustomer.mutateAsync({
                  id: record.id,
                  data: { ...record, isActive: !record.isActive }
                });
                messageApi.success(`Customer ${record.isActive ? "deactivated" : "activated"} successfully`);
              } catch (error: any) {
                messageApi.error(error.message || "Operation failed");
              }
            },
          } : null,
          { type: 'divider' },
        ].filter(Boolean);
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
          <Dropdown menu={{ items: menuItems.filter(Boolean) as any }} trigger={['click']}>
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

    try {
      await deleteCustomer.mutateAsync(deletingCustomerId);
      messageApi.success("Customer deleted successfully");
      setIsDeleteModalOpen(false);
      setDeletingCustomerId(null);
    } catch (error: any) {
      console.error("Delete customer error:", error);

      // Check if it's a foreign key constraint violation
      if (error?.code === '23001' || error?.message?.includes('foreign key constraint')) {
        messageApi.error(
          "Cannot delete customer: This customer has associated invoices. Please delete or reassign the invoices first.",
          6
        );
      } else {
        messageApi.error(error?.message || "Failed to delete customer");
      }
    }
  };

  const handleImportClients = async (clients: ClientV2[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const client of clients) {
        try {
          // Convert clientV2 to customer format
          const customerData = {
            companyName: client.companyName,
            email: client.billingContactEmail || null,
            phone: null, // ClientV2 doesn't have phone field
            address: client.billingAddress || null,
            city: null, // Could parse from address if needed
            country: client.country || null,
            taxId: client.gstVatTaxId || null,
            gstin: client.gstVatTaxId || client.vatNumber || null,
            pan: client.pan || null,
            isActive: client.isActive,
          };

          console.log(`Importing client ${client.companyName} with data:`, customerData);
          const result = await createCustomer.mutateAsync(customerData);
          console.log(`Successfully created customer:`, result);
          successCount++;
        } catch (error: any) {
          console.error(`Failed to import client ${client.companyName}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        messageApi.success(
          `Successfully imported ${successCount} client${successCount !== 1 ? "s" : ""} as customer${successCount !== 1 ? "s" : ""}`
        );
      }
      
      if (errorCount > 0) {
        messageApi.warning(
          `${errorCount} client${errorCount !== 1 ? "s" : ""} could not be imported`
        );
      }
    } catch (error: any) {
      console.error("Import clients error:", error);
      messageApi.error("Failed to import clients");
    }
  };




  if (authLoading) return <MainLayout><Spin /></MainLayout>;
  if (!canReadInvoice) return null;

  return (
    <MainLayout>
      {contextHolder}
      <div style={{
        margin: "0 -24px",
        background: "var(--customers-page-bg)",
        minHeight: "calc(100vh - 64px)"
      }}>
        <TimeTrackingHeader
          style={{ 
            padding: '9.5px 32px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-slate-100)',
            marginBottom: 0
          }}
          icon={<Users size={20} color="#8b5cf6" />}
          title="Customers"
          description="Manage customer details, contacts, and profiles."
          extra={
            <div style={{ display: "flex", gap: 10, alignItems: 'center' }}>
              <Segmented
                options={[
                  {
                    value: "card",
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 6px' }}>
                        <LayoutGrid size={14} />
                      </div>
                    )
                  },
                  {
                    value: "table",
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 6px' }}>
                        <List size={14} />
                      </div>
                    )
                  },
                ]}
                value={viewMode}
                onChange={(value) => setViewMode(value as "card" | "table")}
                style={{ padding: 2, borderRadius: 8 }}
              />
              <Input.Search
                placeholder="Search customers..."
                allowClear
                size="middle"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 240, borderRadius: 8 }}
              />
              {canCreateInvoice && (
                <>
                  <Button
                    size="middle"
                    icon={<Import size={16} />}
                    style={{ borderRadius: 8, height: 38, padding: "0 16px", fontWeight: 600, background: "white", color: "#2563eb", border: "1px solid #2563eb" }}
                    onClick={() => setIsClientImportModalOpen(true)}
                  >
                    Import from Client
                  </Button>
                  <Button
                    type="primary"
                    size="middle"
                    icon={<Plus size={16} />}
                    style={{ borderRadius: 8, height: 38, padding: "0 20px", fontWeight: 600, background: "#2563eb", border: "none" }}
                    onClick={() => {
                      setEditingCustomer(null);
                      form.resetFields();
                      setIsModalOpen(true);
                    }}
                  >
                    Add Customer
                  </Button>
                </>
              )}
            </div>
          }
        />

        <div style={{ padding: "16px 32px 32px 32px" }}>

        {/* ================= METRIC STATS ================= */}
        <Row gutter={[20, 20]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <StatCard label="Total Customers" value={isLoading ? "..." : totalCustomers} icon={Users} color="#3b82f6" />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard label="Active Clients" value={isLoading ? "..." : activeCustomersCount} icon={ShieldCheck} color="#10b981" />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard label="Inactive Accounts" value={isLoading ? "..." : inactiveCustomersCount} icon={Ban} color="#f43f5e" />
          </Col>
        </Row>




        {/* ================= CUSTOMERS LIST ================= */}
        <div style={{ marginTop: 8 }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64 rounded-2xl border" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)' }}>
              <Spin indicator={<Users size={32} className="animate-pulse text-blue-500" />} />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)' }}>
              <div className="size-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
                <Users size={32} className="text-slate-300" />
              </div>
              <Title level={4} style={{ color: "var(--text-secondary)" }}>No customers found</Title>
              <Text style={{ color: "var(--text-slate-400)" }}>Get started by adding your first customer.</Text>
            </div>
          ) : viewMode === "card" ? (
            <Row gutter={[20, 20]}>
              {filteredCustomers.map((customer) => (
                <Col xs={24} sm={12} md={8} lg={6} key={customer.id}>
                  <Badge.Ribbon
                    text={<span className="flex items-center gap-1.5"><Check size={12} /> Active</span>}
                    color="#10b981"
                    style={{ display: customer.isActive ? "flex" : "none", zIndex: 1, padding: "0 10px", borderRadius: "0 8px 0 8px" }}
                  >
                    <Card
                      hoverable
                      style={{ borderRadius: 16, border: "1px solid var(--customers-card-border)", overflow: 'hidden', height: '100%', background: 'var(--customers-card-bg)' }}
                      styles={{ body: { padding: 20, height: '100%', display: 'flex', flexDirection: 'column' } }}
                      className="customer-card shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold" style={{ backgroundColor: 'var(--customers-avatar-bg)', color: 'var(--customers-avatar-text)' }}>
                            {customer.companyName?.charAt(0)}
                          </div>
                          <div style={{ maxWidth: 140 }}>
                            <Typography.Text strong className="block truncate" style={{ color: 'var(--text-primary)' }} title={customer.companyName}>
                              {customer.companyName}
                            </Typography.Text>
                            <div className="flex items-center gap-2">
                              <Typography.Text type="secondary" className="text-xs">
                                {customer.city}{customer.city && customer.country && ", "}{customer.country}
                              </Typography.Text>
                            </div>
                          </div>
                        </div>

                        {(canReadInvoice || canUpdateInvoice || canDeleteInvoice) && (
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: "view",
                                  icon: <Eye size={16} />,
                                  label: "View Profile",
                                  onClick: () => {
                                    setSelectedCustomerForView(customer);
                                    setViewDrawerVisible(true);
                                  },
                                },
                                { type: 'divider' },
                                canUpdateInvoice ? {
                                  key: "status_toggle",
                                  icon: customer.isActive ? <Ban size={16} /> : <ShieldCheck size={16} />,
                                  label: customer.isActive ? "Deactivate Account" : "Activate Account",
                                  onClick: async () => {
                                    try {
                                      await updateCustomer.mutateAsync({
                                        id: customer.id,
                                        data: { companyName: customer.companyName, isActive: !customer.isActive }
                                      });
                                      messageApi.success(`Customer ${customer.isActive ? "deactivated" : "activated"} successfully`);
                                    } catch (error: any) {
                                      messageApi.error(error.message || "Operation failed");
                                    }
                                  },
                                } : null,
                                { type: 'divider' },
                                canUpdateInvoice ? {
                                  key: "edit",
                                  icon: <Edit2 size={16} />,
                                  label: "Edit Customer",
                                  onClick: () => handleEdit(customer),
                                } : null,
                                canDeleteInvoice ? {
                                  key: "delete",
                                  danger: true,
                                  icon: <Trash2 size={16} />,
                                  label: "Delete",
                                  onClick: () => {
                                    setDeletingCustomerId(customer.id);
                                    setIsDeleteModalOpen(true);
                                  },
                                } : null,
                              ].filter(Boolean) as any
                            }}
                            trigger={["click"]}
                          >
                            <Button type="text" icon={<MoreVertical size={18} className="text-slate-400" />} style={{ marginTop: 4 }} />
                          </Dropdown>
                        )}
                      </div>

                      <div className="mt-5 space-y-2.5" style={{ flex: 1 }}>
                        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-slate-50)' }}><Mail size={14} style={{ color: 'var(--text-slate-400)' }} /></div>
                          <span className="truncate">{customer.email || "--"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-slate-50)' }}><Phone size={14} style={{ color: 'var(--text-slate-400)' }} /></div>
                          <span>{customer.phone || "--"}</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: 'var(--bg-slate-50)' }}><MapPin size={14} style={{ color: 'var(--text-slate-400)' }} /></div>
                          <span className="leading-tight">{customer.address || "--"}</span>
                        </div>
                      </div>

                      <Divider className="my-4" style={{ borderColor: 'var(--customers-card-border)' }} />

                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span style={{ color: 'var(--text-slate-400)' }}>Tax ID</span>
                          <span className="font-medium" style={{ color: 'var(--text-slate-700)' }}>{customer.taxId || "--"}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span style={{ color: 'var(--text-slate-400)' }}>GSTIN</span>
                          <span className="font-medium" style={{ color: 'var(--text-slate-700)' }}>{customer.gstin || "--"}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span style={{ color: 'var(--text-slate-400)' }}>PAN</span>
                          <span className="font-medium" style={{ color: 'var(--text-slate-700)' }}>{customer.pan || "--"}</span>
                        </div>
                      </div>
                    </Card>
                  </Badge.Ribbon>
                </Col>
              ))}
            </Row>
          ) : (
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                border: "1px solid var(--customers-card-border)",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                overflow: "hidden",
                background: "var(--customers-card-bg)"
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

        <CustomerDrawer
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

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .customer-table-row:hover {
          background-color: var(--customers-table-row-hover) !important;
        }
        .ant-table-thead > tr > th {
          background-color: var(--customers-table-header-bg) !important;
          color: var(--customers-table-header-text) !important;
          font-weight: 600 !important;
          padding: 8px 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 8px 16px !important;
          border-bottom: 1px solid var(--customers-card-border) !important;
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
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingCustomerId(null);
        }}
        footer={null}
        width={440}
        centered
        closable={false}
        styles={{
          body: { padding: 0, overflow: 'hidden', borderRadius: '24px' },
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.6)' },
          content: { borderRadius: '24px', padding: 0, background: 'var(--customers-modal-bg)' }
        }}
        className="overflow-hidden"
      >
        <div className="relative">
          {/* Decorative Background Header */}
          <div className="h-32 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, var(--customers-delete-header-bg), var(--customers-modal-bg))' }}>
            {/* Icon Container */}
            <div className="w-20 h-20 rounded-[20px] flex items-center justify-center border relative z-10 bottom-[-24px]" style={{ backgroundColor: 'var(--customers-modal-bg)', borderColor: 'var(--customers-delete-icon-bg)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: 'var(--customers-delete-icon-bg)', color: 'var(--customers-delete-icon-color)', borderColor: 'var(--customers-delete-icon-bg)' }}>
                <Trash2 size={28} strokeWidth={2} />
              </div>
            </div>
          </div>

          <div className="px-8 pt-10 pb-8 text-center flex flex-col items-center">
            <h3 className="text-2xl font-extrabold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Delete Customer permanently?
            </h3>

            <p className="text-[14px] leading-relaxed mb-4 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Are you absolutely sure? This action will permanently erase the customer profile, including:
            </p>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-tight">
                  <strong>Important:</strong> If this customer has associated invoices, deletion will fail. You may need to delete or reassign those invoices first.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8 w-full">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><Building2 size={14} className="text-blue-500" /> Company Info</span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><Mail size={14} className="text-amber-500" /> Contact Details</span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><Fingerprint size={14} className="text-emerald-500" /> Tax Identifiers</span>
            </div>

            <div className="flex w-full gap-4">
              <Button
                size="large"
                className="flex-1 rounded-[16px] h-14 font-bold border-none transition-colors" style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-secondary)' }}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingCustomerId(null);
                }}
              >
                Keep Customer
              </Button>
              <Button
                size="large"
                danger
                type="primary"
                loading={deleteCustomer.status === "pending"}
                className="flex-1 rounded-[16px] h-14 font-bold border-none shadow-sm transition-all" style={{ backgroundColor: '#ef4444' }}
                onClick={confirmDelete}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <CustomerViewDrawer
        open={viewDrawerVisible}
        onClose={() => {
          setViewDrawerVisible(false);
          setSelectedCustomerForView(null);
        }}
        customer={selectedCustomerForView}
      />

      <ClientImportModal
        open={isClientImportModalOpen}
        onClose={() => setIsClientImportModalOpen(false)}
        onImport={handleImportClients}
        existingCustomers={customers}
      />

    </MainLayout>
  );
}


