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
  App,
  Select,
  Skeleton,
} from "antd";
import type { MenuProps } from "antd";
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
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  FileText,
} from "lucide-react";
import { ReloadOutlined } from "@ant-design/icons";

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

const CARD_ACCENTS: [string, string][] = [
  ['#3b82f6', '#2563eb'], // blue
  ['#10b981', '#059669'], // green
  ['#64748b', '#475569'], // grey
];

const accentFor = (key: string): [string, string] => {
  return ['#3b82f6', '#2563eb'];
};

const initialsOf = (name: string) =>
  (name || '—')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

type StatusFilter = "all" | "active" | "inactive";

export default function InvoiceproCustomerPage() {
  const router = useRouter();
  const {
    canReadInvoiceCustomer,
    canCreateInvoiceCustomer,
    canUpdateInvoiceCustomer,
    canDeleteInvoiceCustomer,
  } = usePermission();
  const { isLoading: authLoading } = useAuth();

  const { data: customersData, isLoading, refetch, isFetching } = useCustomers();
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const total = filteredCustomers.length;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedCustomers = useMemo(() => {
    return filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

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
              background: "rgba(16,185,129,0.08)",
              color: "#10b981",
              border: "1px solid rgba(16,185,129,0.25)",
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
      fixed: "right" as const,
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
          canDeleteInvoiceCustomer ? { type: "divider" } : null,
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
      <div className="pp-shell">
        {/* ============================ SIDEBAR ============================ */}
        <aside className="pp-sidebar">
          <div className="pp-side-head">
            <div className="pp-side-logo"><Users size={20} /></div>
            <div className="pp-side-head-text">
              <div className="pp-side-title">Customers</div>
              <div className="pp-side-subtitle">Contacts · Profiles</div>
            </div>
          </div>

          {canCreateInvoiceCustomer && (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              className="pp-create-btn"
              onClick={() => {
                setEditingCustomer(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
              block
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              Add Customer
            </Button>
          )}

          <div className="pp-side-scroll">
            <div className="pp-side-section-label">Views</div>
            <div className="pp-side-list">
              <button
                type="button"
                className={`pp-view-item ${statusFilter === "all" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                <span className="pp-view-icon" style={{ color: statusFilter === "all" ? "#3b82f6" : "var(--text-slate-400)" }}><Users size={14} /></span>
                <span className="pp-view-label">All Customers</span>
                <span className="pp-view-count">{counts.all}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${statusFilter === "active" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("active")}
              >
                <span className="pp-view-icon" style={{ color: statusFilter === "active" ? "#10b981" : "var(--text-slate-400)" }}><CheckCircle2 size={14} /></span>
                <span className="pp-view-label">Active</span>
                <span className="pp-view-count">{counts.active}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${statusFilter === "inactive" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("inactive")}
              >
                <span className="pp-view-icon" style={{ color: statusFilter === "inactive" ? "#f87171" : "var(--text-slate-400)" }}><Ban size={14} /></span>
                <span className="pp-view-label">Inactive</span>
                <span className="pp-view-count">{counts.inactive}</span>
              </button>
            </div>


          </div>

          <div className="pp-side-bottom-actions">
            <button
              type="button"
              className="pp-view-item"
              onClick={() => router.push("/invoice/invoices")}
              style={{ padding: "7px 10px", borderRadius: "8px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", width: "100%", marginBottom: "4px" }}
            >
              <span className="pp-view-icon" style={{ color: "#3b82f6" }}><ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /></span>
              <span className="pp-view-label">Invoices</span>
            </button>
          </div>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="pp-main">
          {/* Top search bar */}
          <div className="pp-topbar">
            <div className="pp-search-wrap">
              <Search className="pp-search-icon" size={14} />
              <input
                className="pp-search"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{filteredCustomers.length}</strong> customers</span>
            </div>

            <div className="pp-topbar-actions">
              <div className="pp-segmented">
                 <button
                  type="button"
                  className={viewMode === "table" ? "is-active" : ""}
                  onClick={() => setViewMode("table")}
                  aria-label="Table view"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  className={viewMode === "card" ? "is-active" : ""}
                  onClick={() => setViewMode("card")}
                  aria-label="Card view"
                >
                  <LayoutGrid size={14} />
                </button>
               
              </div>
              <Tooltip title="Refresh">
                <button type="button" className="pp-ghost-btn" onClick={() => refetch()}><ReloadOutlined spin={isLoading || isFetching} /></button>
              </Tooltip>
              {canCreateInvoiceCustomer && (
                <Button
                  icon={<Import size={13} />}
                  onClick={() => setIsClientImportModalOpen(true)}
                  className="flex items-center justify-center font-semibold text-xs"
                  style={{
                    borderRadius: 6,
                    height: 30,
                  }}
                >
                  Import from Client
                </Button>
              )}
            </div>
          </div>

          <div className="pp-divider" />

          {/* Main View Area */}
          <div className="pp-body">
            {/* Stat Cards */}
            <div className="pp-stats pp-stats-3">
              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
                      <Users size={14} />
                    </span>
                    <span className="pp-stat-label">Total Customers</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{isLoading ? "—" : counts.all}</span>
                  </div>
                  <span className="pp-stat-period">All registered</span>
                </div>
              </div>

              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                      <CheckCircle2 size={14} />
                    </span>
                    <span className="pp-stat-label">Active</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{isLoading ? "—" : counts.active}</span>
                  </div>
                  <span className="pp-stat-period">Currently active</span>
                </div>
              </div>

              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                      <Ban size={14} />
                    </span>
                    <span className="pp-stat-label">Inactive</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{isLoading ? "—" : counts.inactive}</span>
                  </div>
                  <span className="pp-stat-period">Deactivated</span>
                </div>
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="pp-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="pc-card p-4"
                    style={{
                      background: "var(--bg-slate-50)",
                      border: "1px solid var(--border-slate-200)",
                    }}
                  >
                    <Skeleton active avatar paragraph={{ rows: 1 }} />
                  </div>
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="pp-empty">
                <div className="pp-empty-orb"><Users size={26} /></div>
                <div className="pp-empty-title">
                  {search || statusFilter !== "all"
                    ? "No customers match your filters"
                    : "No customers yet"}
                </div>
                <div className="pp-empty-sub">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search or filter"
                    : "Get started by adding your first customer."}
                </div>
                {!search && statusFilter === "all" && canCreateInvoiceCustomer && (
                  <Button
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      setEditingCustomer(null);
                      form.resetFields();
                      setIsModalOpen(true);
                    }}
                    className="pp-btn-primary"
                    style={{
                      marginTop: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    Add Customer
                  </Button>
                )}
              </div>
            ) : viewMode === "card" ? (
              <div className="pp-grid">
                {pagedCustomers.map((customer) => {
                  const accent = accentFor(customer.companyName || '');
                  return (
                    <div
                      key={customer.id}
                      className="pc-card"
                      onClick={() => {
                        setSelectedCustomerForView(customer);
                        setViewDrawerVisible(true);
                      }}
                    >
                      <div className="pc-top">
                        <div
                          className="pc-avatar"
                          style={{
                            background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)`,
                          }}
                        >
                          {initialsOf(customer.companyName)}
                        </div>
                        <div className="pc-identity-body">
                          <div className="pc-title" style={{ fontSize: '13px' }}>{customer.companyName}</div>
                          <div className="pc-client-line">
                            <span className="pc-client-key">Tax ID:</span>
                            <span className="pc-client-val">
                              {customer.taxId || customer.gstin || "—"}
                            </span>
                          </div>
                        </div>
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: "view",
                                icon: <Eye size={14} />,
                                label: "View profile",
                                onClick: () => {
                                  setSelectedCustomerForView(customer);
                                  setViewDrawerVisible(true);
                                },
                              },
                              (canUpdateInvoiceCustomer || canDeleteInvoiceCustomer) && {
                                type: "divider",
                              },
                              canUpdateInvoiceCustomer && {
                                key: "status_toggle",
                                icon: customer.isActive ? <Ban size={14} /> : <ShieldCheck size={14} />,
                                label: customer.isActive ? "Deactivate" : "Activate",
                                onClick: async () => {
                                  try {
                                    await updateCustomer.mutateAsync({
                                      id: customer.id,
                                      data: { ...customer, isActive: !customer.isActive },
                                    });
                                    messageApi.success(
                                      `Customer ${customer.isActive ? "deactivated" : "activated"
                                      } successfully`
                                    );
                                  } catch (error: any) {
                                    messageApi.error(error.message || "Operation failed");
                                  }
                                },
                              },
                              canUpdateInvoiceCustomer && {
                                key: "edit",
                                icon: <Edit2 size={14} />,
                                label: "Edit",
                                onClick: () => handleEdit(customer),
                              },
                              canDeleteInvoiceCustomer && { type: "divider" },
                              canDeleteInvoiceCustomer && {
                                key: "delete",
                                danger: true,
                                icon: <Trash2 size={14} />,
                                label: "Delete",
                                onClick: () => {
                                  setDeletingCustomerId(customer.id);
                                  setIsDeleteModalOpen(true);
                                },
                              },
                            ].filter(Boolean) as MenuProps["items"],
                          }}
                          trigger={["click"]}
                        >
                          <button
                            type="button"
                            className="pc-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </Dropdown>
                      </div>

                      <div className="pc-foot">
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Email:</span>
                            <span className="pc-foot-val">{customer.email || "—"}</span>
                          </span>
                          <span className="pc-foot-div" />
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Phone:</span>
                            <span className="pc-foot-val">{customer.phone || "—"}</span>
                          </span>
                        </div>
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Status:</span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: customer.isActive ? "#10b981" : "#94a3b8",
                              }}
                            >
                              {customer.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </span>
                          <span className="pc-foot-div" />
                          <button
                            type="button"
                            className="pc-foot-item pc-view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomerForView(customer);
                              setViewDrawerVisible(true);
                            }}
                          >
                            Profile
                          </button>
                          {canUpdateInvoiceCustomer && (
                            <>
                              <span className="pc-foot-div" />
                              <button
                                type="button"
                                className="pc-foot-item pc-view-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(customer);
                                }}
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="overflow-hidden"
                style={{
                  background: "var(--bg-pure-white)",
                  border: "1px solid var(--border-slate-200)",
                }}
              >
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={pagedCustomers}
                  pagination={false}
                  size="middle"
                  onRow={(record) => ({
                    onClick: () => {
                      setSelectedCustomerForView(record);
                      setViewDrawerVisible(true);
                    },
                    className: "cursor-pointer",
                  })}
                  className="customers-table"
                  scroll={{ x: 'max-content', y: 'calc(100vh - 325px)' }}
                />
              </div>
            )}
          </div>

          {/* Sticky footer pagination */}
          {total > 0 && (
            <div className="pp-footer pp-footer--sticky">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
              </div>
              <div className="pp-pager">
                <button
                  type="button"
                  className="pp-pager-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)
                  .map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pp-pager-num ${p === currentPage ? "is-active" : ""}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  type="button"
                  className="pp-pager-btn"
                  disabled={currentPage >= pageCount}
                  onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                >
                  ›
                </button>
                <Select
                  className="pp-pagesize"
                  value={pageSize}
                  onChange={(v) => {
                    setPageSize(v);
                    setCurrentPage(1);
                  }}
                  options={[5, 10, 15, 25, 50, 100].map((n) => ({
                    value: n,
                    label: `${n} / page`,
                  }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
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

      {/* Delete confirmation modal */}
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
                background: "rgba(248,113,113,0.08)",
                color: "#f87171",
                border: "1px solid rgba(248,113,113,0.25)",
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
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.20)",
            }}
          >
            <AlertCircle
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: "#f87171" }}
            />
            <span className="text-[12px]" style={{ color: "#f87171" }}>
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

      <style jsx global>{`
        .pp-shell {
          display: flex;
          margin: 0 -24px;
          height: calc(100vh - 54px);
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .pp-shell,
        .pp-shell *,
        .ant-table,
        .ant-btn,
        .ant-select,
        .ant-picker,
        .ant-input,
        .ant-modal,
        .ant-drawer,
        .ant-tooltip,
        .ant-popconfirm,
        .ant-dropdown {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif !important;
        }

        /* ---------------- Sidebar ---------------- */
        .pp-sidebar {
          width: 264px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0 38px;
          position: sticky;
          top: 0;
          height: calc(100vh - 54px);
          z-index: 31;
        }
        .pp-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .pp-side-logo {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          color: var(--text-slate-900);
        }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .pp-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .pp-create-btn {
          height: 35px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          background: #3B82F6 !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 12px;
          color: #fff !important;
        }
        .pp-create-btn:hover { background: #2563EB !important; }
        .pp-create-btn .anticon { font-size: 12px !important; }
        .pp-side-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pp-side-scroll::-webkit-scrollbar {
          display: none;
        }
        .pp-side-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
        }
        .pp-side-scroll > .pp-side-section-label:first-child { margin-top: 6px; }
        .pp-side-list { display: flex; flex-direction: column; gap: 1px; }
        .pp-view-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
          cursor: pointer; transition: background .12s ease; text-align: left;
        }
        .pp-view-item:hover { background: var(--bg-slate-50); }
        .pp-view-item.is-active { background: var(--bg-blue-50); }
        .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
        .pp-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
        .pp-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .pp-view-count {
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
          min-width: 18px; text-align: right;
        }
        .pp-view-item.is-active .pp-view-count {
          color: #3B82F6; font-weight: 700;
          background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
        }
        .pp-side-bottom-actions {
          margin: auto -14px 0 -38px;
          padding: 8px 14px 0 38px;
          border-top: 1px solid var(--border-slate-100);
          background: var(--bg-pure-white);
        }
        .pp-trash {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0; text-align: left;
          margin: 0 -14px 0 -38px; padding: 0 0 0 38px;
          height: 45px;
          width: calc(100% + 52px);
          border-top: 1px solid var(--border-slate-200);
          background: transparent; color: var(--text-slate-600); font-size: 13px; font-weight: 500; cursor: pointer;
          border-left: none; border-right: none; border-bottom: none;
        }
        .pp-trash:hover { color: #3B82F6; }

        /* ---------------- Main ---------------- */
        .pp-main { flex: 1; min-width: 0; padding: 8px 32px 0 20px; display: flex; flex-direction: column; }
        .pp-body { flex: 1; min-height: 0; display: flex; flex-direction: column; }
        .pp-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .pp-search-wrap {
          position: relative; flex: 1; max-width: 520px; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900);
        }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
        .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
        .pp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .pp-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }

        .pp-divider { height: 1px; background: var(--border-slate-200); margin: 0 -32px 10px -20px; }

        /* Stat cards */
        .pp-stats { display: grid; gap: 12px; margin-bottom: 14px; }
        .pp-stats-3 { grid-template-columns: repeat(3, 1fr); }
        .pp-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        /* Grid view cards (matching accounts dashboard) */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
          height: 144px;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; height: 64px; overflow: hidden; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); height: 78px; justify-content: center; }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-val { font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); flex-shrink: 0; }
        .pc-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .pc-view-btn .anticon { font-size: 12px; }
        .pc-view-btn:hover { text-decoration: underline; }

        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }

        .pp-btn-primary {
          background: #3B82F6 !important; border: none !important;
          border-radius: 0 !important; font-weight: 600 !important;
        }

        /* Empty + grid */
        .pp-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .pp-empty-orb {
          width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
        }
        .pp-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }

        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        /* Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table-wrap ::-webkit-scrollbar { display: none !important; }
        .pp-table-wrap, .pp-table-wrap * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .customers-table .ant-table { background: transparent; font-size: 12px; }
        .customers-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .customers-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 10px !important; }
        .customers-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .customers-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }

        /* Footer + pager */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
        }
        .pp-footer--sticky {
          position: sticky; bottom: 0; z-index: 30;
          margin: 8px -32px 0 -20px;
          padding: 0 32px 0 20px;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          height: 45px;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }

        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        @media (max-width: 820px) {
          .pp-sidebar { display: none; }
          .pp-topbar-meta { display: none; }
        }

        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
      `}</style>
    </MainLayout>
  );
}
