"use client";

import { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Typography,
  Input,
  Button,
  message,
  Dropdown,
  Modal,
  Table,
  Spin,
  Tooltip,
  Form,
} from "antd";
import {
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
  Eye,
  AlertCircle,
  ShieldCheck,
  Ban,
  Import,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";

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
import { useActivitySource } from "@/hooks/useActivitySource";

const { Title, Text } = Typography;

type StatusFilter = "all" | "active" | "inactive";

export default function InvoiceproCustomerPage() {
  const router = useRouter();
  const {
    canReadInvoiceCustomer,
    canCreateInvoiceCustomer,
    canUpdateInvoiceCustomer,
    canDeleteInvoiceCustomer
  } = usePermission();
  const { isLoading: authLoading } = useAuth();

  const { data: customersData, isLoading } = useCustomers();
  const customers = customersData?.data || [];
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ServiceCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedCustomerForView, setSelectedCustomerForView] =
    useState<ServiceCustomer | null>(null);
  const [isClientImportModalOpen, setIsClientImportModalOpen] = useState(false);

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadInvoiceCustomer) {
      router.push("/invoice/invoices");
    }
  }, [authLoading, canReadInvoiceCustomer, router]);

  // Register UX context for activity logging
  useActivitySource({ section: "FINANCE", module: "Invoices", page: "InvoiceCustomerList" });

  const counts = useMemo(() => {
    const all = customers.length;
    const active = customers.filter((c) => c.isActive).length;
    const inactive = all - active;
    return { all, active, inactive };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch = c.companyName
        ?.toLowerCase()
        .includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === "active") return c.isActive;
      if (statusFilter === "inactive") return !c.isActive;
      return true;
    });
  }, [customers, search, statusFilter]);

  const filterPills: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "inactive", label: "Inactive", count: counts.inactive },
  ];

  const creating = createCustomer.status === "pending";
  const updating = updateCustomer.status === "pending";

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
          values.companyName.trim().toLowerCase() && c.id !== id
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
      if (
        error?.code === "23001" ||
        error?.message?.includes("foreign key constraint")
      ) {
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
          const customerData = {
            companyName: client.companyName,
            email: client.billingContactEmail || null,
            phone: null,
            address: client.billingAddress || null,
            city: null,
            country: client.country || null,
            taxId: client.gstVatTaxId || null,
            gstin: client.gstVatTaxId || client.vatNumber || null,
            pan: client.pan || null,
            isActive: client.isActive,
            clientId: client.id,
          };

          await createCustomer.mutateAsync(customerData);
          successCount++;
        } catch (error: any) {
          console.error(`Failed to import client ${client.companyName}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        messageApi.success(
          `Successfully imported ${successCount} customer${successCount !== 1 ? "s" : ""}`
        );
      }
      if (errorCount > 0) {
        messageApi.warning(
          `${errorCount} client${errorCount !== 1 ? "s" : ""} could not be imported`
        );
      }
    } catch {
      messageApi.error("Failed to import clients");
    }
  };

  // Stat tile — minimal accent strip, matches templates page
  const StatTile = ({
    label,
    value,
    icon: Icon,
    accent,
  }: {
    label: string;
    value: string | number;
    icon: any;
    accent: string;
  }) => (
    <div
      className="rounded-2xl px-5 py-4 flex items-center gap-4 relative overflow-hidden"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
      }}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: accent }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `${accent}14`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
      >
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </div>
        <div
          className="text-[22px] font-bold leading-tight tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </div>
      </div>
    </div>
  );

  const columns = [
    {
      title: "CUSTOMER",
      dataIndex: "companyName",
      key: "companyName",
      render: (value: string, record: ServiceCustomer) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold flex-shrink-0"
            style={{
              background: "var(--bg-blue-50)",
              color: "var(--text-blue-700)",
              border: "1px solid var(--border-blue-200)",
            }}
          >
            {value?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {value || "—"}
            </div>
            <div
              className="text-[11px] mt-0.5 flex items-center gap-1"
              style={{ color: "var(--text-secondary)" }}
            >
              <MapPin size={10} />
              {[record.city, record.country].filter(Boolean).join(", ") || "No address"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "CONTACT",
      key: "contact",
      render: (_: any, record: ServiceCustomer) => (
        <div className="space-y-1">
          <div
            className="flex items-center gap-1.5 text-[12.5px]"
            style={{ color: "var(--text-secondary)" }}
          >
            <Mail size={12} />
            <span className="truncate">{record.email || "—"}</span>
          </div>
          <div
            className="flex items-center gap-1.5 text-[12.5px]"
            style={{ color: "var(--text-secondary)" }}
          >
            <Phone size={12} />
            <span>{record.phone || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "TAX",
      key: "tax",
      render: (_: any, record: ServiceCustomer) => (
        <div className="flex flex-col gap-1 text-[11.5px] tabular-nums">
          <div className="flex items-center gap-1.5">
            <span
              className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold"
              style={{
                background: "var(--bg-slate-50)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              GST
            </span>
            <span style={{ color: "var(--text-primary)" }}>
              {record.gstin || "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold"
              style={{
                background: "var(--bg-slate-50)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              PAN
            </span>
            <span style={{ color: "var(--text-primary)" }}>
              {record.pan || "—"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "STATUS",
      key: "status",
      width: 110,
      render: (_: any, record: ServiceCustomer) =>
        record.isActive ? (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
            style={{
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
            Active
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
            style={{
              background: "var(--bg-slate-50)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#94a3b8" }} />
            Inactive
          </span>
        ),
    },
    {
      title: "",
      key: "action",
      width: 60,
      align: "center" as const,
      render: (_: any, record: ServiceCustomer) => {
        const menuItems: any[] = [
          {
            key: "view",
            icon: <Eye size={14} />,
            label: "View profile",
            onClick: () => {
              setSelectedCustomerForView(record);
              setViewDrawerVisible(true);
            },
          },
          (canUpdateInvoiceCustomer || canDeleteInvoiceCustomer) && { type: "divider" },
          canUpdateInvoiceCustomer
            ? {
                key: "status_toggle",
                icon: record.isActive ? <Ban size={14} /> : <ShieldCheck size={14} />,
                label: record.isActive ? "Deactivate" : "Activate",
                onClick: async () => {
                  try {
                    await updateCustomer.mutateAsync({
                      id: record.id,
                      data: { ...record, isActive: !record.isActive },
                    });
                    messageApi.success(
                      `Customer ${record.isActive ? "deactivated" : "activated"} successfully`
                    );
                  } catch (error: any) {
                    messageApi.error(error.message || "Operation failed");
                  }
                },
              }
            : null,
          canUpdateInvoiceCustomer
            ? {
                key: "edit",
                icon: <Edit2 size={14} />,
                label: "Edit",
                onClick: () => handleEdit(record),
              }
            : null,
          canDeleteInvoiceCustomer
            ? { type: "divider" }
            : null,
          canDeleteInvoiceCustomer
            ? {
                key: "delete",
                danger: true,
                icon: <Trash2 size={14} />,
                label: "Delete",
                onClick: () => {
                  setDeletingCustomerId(record.id);
                  setIsDeleteModalOpen(true);
                },
              }
            : null,
        ].filter(Boolean);

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              menu={{ items: menuItems as any }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={
                  <MoreVertical
                    size={16}
                    style={{ color: "var(--text-secondary)" }}
                  />
                }
              />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  if (authLoading) return <MainLayout><Spin /></MainLayout>;
  if (!canReadInvoiceCustomer) return null;

  return (
    <MainLayout>
      {contextHolder}
      <div
        style={{
          margin: "0 -24px",
          background: "var(--customers-page-bg)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* TOP BAR */}
        <div
          className="sticky top-0 z-40 backdrop-blur-md border-b"
          style={{
            background:
              "color-mix(in oklab, var(--customers-page-bg) 85%, transparent)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="px-8 py-3 md:py-0 min-h-[56px] md:h-14 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/invoice/invoices")}
                  className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
                  aria-label="Back"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ChevronLeft size={18} />
                </button>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "var(--bg-blue-50)",
                    color: "var(--text-blue-700)",
                    border: "1px solid var(--border-blue-200)",
                  }}
                >
                  <Users size={14} strokeWidth={2.25} />
                </div>
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Customers
                </span>
              </div>
              <span
                className="h-4 w-px hidden sm:inline"
                style={{ background: "var(--border-color)" }}
              />
              <span
                className="text-[12px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Manage customer details, contacts, and profiles
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto">
              {canCreateInvoiceCustomer && (
                <>
                  <Button
                    icon={<Import size={14} />}
                    onClick={() => setIsClientImportModalOpen(true)}
                    className="flex-1 md:flex-initial flex items-center justify-center"
                    style={{
                      borderRadius: 8,
                      height: 36,
                      fontWeight: 600,
                    }}
                  >
                    <span>Import from Client</span>
                  </Button>
                  <Button
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      setEditingCustomer(null);
                      form.resetFields();
                      setIsModalOpen(true);
                    }}
                    className="flex-1 md:flex-initial flex items-center justify-center"
                    style={{
                      borderRadius: 8,
                      height: 36,
                      fontWeight: 600,
                      background: "#2563eb",
                    }}
                  >
                    <span>Add customer</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 pt-6 pb-12">
          <div className="mx-auto max-w-[1600px]">
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <StatTile
                label="Total customers"
                value={isLoading ? "—" : counts.all}
                icon={Users}
                accent="#2563eb"
              />
              <StatTile
                label="Active"
                value={isLoading ? "—" : counts.active}
                icon={CheckCircle2}
                accent="#10b981"
              />
              <StatTile
                label="Inactive"
                value={isLoading ? "—" : counts.inactive}
                icon={Ban}
                accent="#f43f5e"
              />
            </div>

            {/* TOOLS */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                {filterPills.map((p) => {
                  const active = statusFilter === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setStatusFilter(p.key)}
                      className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium transition-all"
                      style={{
                        background: active
                          ? "var(--bg-blue-50)"
                          : "var(--bg-secondary)",
                        color: active
                          ? "var(--text-blue-700)"
                          : "var(--text-secondary)",
                        border: `1px solid ${
                          active ? "var(--border-blue-200)" : "var(--border-color)"
                        }`,
                        boxShadow: active
                          ? "0 0 0 3px rgba(96,165,250,0.12)"
                          : "none",
                      }}
                    >
                      {p.label}
                      <span
                        className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-md text-[11px] font-semibold tabular-nums"
                        style={{
                          background: active ? "white" : "var(--bg-slate-50)",
                          color: active
                            ? "var(--text-blue-700)"
                            : "var(--text-secondary)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        {p.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search customers..."
                  prefix={
                    <Search
                      size={14}
                      style={{ color: "var(--text-secondary)" }}
                    />
                  }
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[130px] sm:w-[180px] md:w-[280px]"
                  style={{
                    borderRadius: 8,
                    height: 36,
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                />
                <div
                  className="inline-flex items-center h-9 rounded-lg p-0.5"
                  style={{
                    background: "var(--bg-slate-50)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <Tooltip title="Card view">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setViewMode("card")}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold transition-all"
                      style={{
                        background:
                          viewMode === "card"
                            ? "var(--bg-secondary)"
                            : "transparent",
                        color:
                          viewMode === "card"
                            ? "var(--text-blue-700)"
                            : "var(--text-secondary)",
                        boxShadow:
                          viewMode === "card"
                            ? "0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px var(--border-color)"
                            : "none",
                      }}
                    >
                      <LayoutGrid size={14} strokeWidth={2.25} />
                      Cards
                    </button>
                  </Tooltip>
                  <Tooltip title="Table view">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setViewMode("table")}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold transition-all"
                      style={{
                        background:
                          viewMode === "table"
                            ? "var(--bg-secondary)"
                            : "transparent",
                        color:
                          viewMode === "table"
                            ? "var(--text-blue-700)"
                            : "var(--text-secondary)",
                        boxShadow:
                          viewMode === "table"
                            ? "0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px var(--border-color)"
                            : "none",
                      }}
                    >
                      <List size={14} strokeWidth={2.25} />
                      Table
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* CONTENT */}
            {isLoading ? (
              <div
                className="flex justify-center items-center h-64 rounded-2xl"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Spin />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 rounded-2xl"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1.5px dashed var(--border-color)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "var(--bg-blue-50)",
                    color: "var(--text-blue-700)",
                    border: "1px solid var(--border-blue-200)",
                  }}
                >
                  <Users size={24} strokeWidth={2} />
                </div>
                <Title
                  level={5}
                  style={{
                    color: "var(--text-primary)",
                    margin: 0,
                    fontWeight: 700,
                  }}
                >
                  {search || statusFilter !== "all"
                    ? "No customers match your filters"
                    : "No customers yet"}
                </Title>
                <Text
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    marginTop: 6,
                    marginBottom: 20,
                  }}
                >
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search or filter"
                    : "Get started by adding your first customer."}
                </Text>
                {!search && statusFilter === "all" && canCreateInvoiceCustomer && (
                  <Button
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      setEditingCustomer(null);
                      form.resetFields();
                      setIsModalOpen(true);
                    }}
                    style={{
                      borderRadius: 8,
                      height: 38,
                      fontWeight: 600,
                      background: "#2563eb",
                    }}
                  >
                    Add customer
                  </Button>
                )}
              </div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="customer-card group rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                    onClick={() => {
                      setSelectedCustomerForView(customer);
                      setViewDrawerVisible(true);
                    }}
                  >
                    {/* Header: avatar + name + status */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                        style={{
                          background: "var(--bg-blue-50)",
                          color: "var(--text-blue-700)",
                          border: "1px solid var(--border-blue-200)",
                        }}
                      >
                        {customer.companyName?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Tooltip title={customer.companyName} placement="top">
                          <div
                            className="text-[15px] font-semibold leading-tight truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {customer.companyName}
                          </div>
                        </Tooltip>
                        <span
                          className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold`}
                          style={
                            customer.isActive
                              ? {
                                  background: "#ecfdf5",
                                  color: "#047857",
                                  border: "1px solid #a7f3d0",
                                }
                              : {
                                  background: "var(--bg-slate-50)",
                                  color: "var(--text-secondary)",
                                  border: "1px solid var(--border-color)",
                                }
                          }
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: customer.isActive
                                ? "#10b981"
                                : "#94a3b8",
                            }}
                          />
                          {customer.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Contact info — compact one-line rows */}
                    <div className="space-y-1.5 mb-4">
                      <div
                        className="flex items-center gap-2 text-[12.5px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Mail
                          size={13}
                          className="flex-shrink-0"
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <span className="truncate">
                          {customer.email || "—"}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 text-[12.5px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Phone
                          size={13}
                          className="flex-shrink-0"
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <span>{customer.phone || "—"}</span>
                      </div>
                      <div
                        className="flex items-start gap-2 text-[12.5px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <MapPin
                          size={13}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <span className="line-clamp-2">
                          {[
                            customer.address,
                            customer.city,
                            customer.country,
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Action row */}
                    <div
                      className="grid grid-cols-3 gap-1.5 pt-3 mt-auto"
                      style={{ borderTop: "1px solid var(--border-color)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canUpdateInvoiceCustomer && (
                        <Tooltip title="Edit customer">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(customer);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-md text-[12px] font-semibold transition-colors"
                            style={{
                              background: "var(--bg-secondary)",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                        </Tooltip>
                      )}
                      {canUpdateInvoiceCustomer && (
                        <Tooltip
                          title={
                            customer.isActive ? "Deactivate" : "Activate"
                          }
                        >
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await updateCustomer.mutateAsync({
                                  id: customer.id,
                                  data: {
                                    companyName: customer.companyName,
                                    isActive: !customer.isActive,
                                  },
                                });
                                messageApi.success(
                                  `Customer ${
                                    customer.isActive
                                      ? "deactivated"
                                      : "activated"
                                  }`
                                );
                              } catch (error: any) {
                                messageApi.error(
                                  error.message || "Operation failed"
                                );
                              }
                            }}
                            className="inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-md text-[12px] font-semibold transition-colors"
                            style={{
                              background: "var(--bg-secondary)",
                              color: customer.isActive ? "#f59e0b" : "#10b981",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            {customer.isActive ? (
                              <Ban size={12} />
                            ) : (
                              <ShieldCheck size={12} />
                            )}
                            {customer.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </Tooltip>
                      )}
                      {canDeleteInvoiceCustomer && (
                        <Tooltip title="Delete customer">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingCustomerId(customer.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-md text-[12px] font-semibold transition-colors"
                            style={{
                              background: "var(--bg-secondary)",
                              color: "#b91c1c",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={filteredCustomers}
                  pagination={{
                    pageSize: 10,
                    style: { padding: "12px 20px" },
                  }}
                  size="middle"
                  onRow={(record) => ({
                    onClick: () => {
                      setSelectedCustomerForView(record);
                      setViewDrawerVisible(true);
                    },
                    className: "cursor-pointer",
                  })}
                  className="customers-table"
                />
              </div>
            )}
          </div>
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .customer-card:hover {
          border-color: #93c5fd !important;
          box-shadow: 0 0 0 3px rgba(96,165,250,0.10), 0 4px 12px -2px rgba(15,23,42,0.06);
        }
        .customers-table .ant-table-thead > tr > th {
          background-color: var(--bg-slate-50) !important;
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          padding: 10px 16px !important;
          letter-spacing: 0.06em !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .customers-table .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .customers-table .ant-table-row:hover > td {
          background-color: var(--bg-slate-50) !important;
        }
        .customers-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
      `,
        }}
      />

      {/* Delete confirmation modal — refined */}
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
          body: { padding: 0 },
          mask: {
            backdropFilter: "blur(4px)",
            background: "rgba(15, 23, 42, 0.45)",
          },
          content: { padding: 0, borderRadius: 20, overflow: "hidden" },
        }}
      >
        <div
          className="px-6 pt-5 pb-4 border-b"
          style={{
            background: "var(--bg-slate-50)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
              }}
            >
              <Trash2 size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Delete customer
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                This action cannot be undone
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p
            className="text-[13px] leading-relaxed mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            The customer profile, contact details and tax identifiers will be
            permanently removed.
          </p>

          <div
            className="rounded-lg p-3 mb-5 flex items-start gap-2"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            <AlertCircle
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: "#dc2626" }}
            />
            <span className="text-[12px]" style={{ color: "#991b1b" }}>
              If the customer has invoices linked to them, deletion will be
              blocked.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingCustomerId(null);
              }}
              style={{ borderRadius: 8, height: 36 }}
            >
              Keep customer
            </Button>
            <Button
              danger
              type="primary"
              loading={deleteCustomer.status === "pending"}
              onClick={confirmDelete}
              style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
            >
              Delete customer
            </Button>
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
