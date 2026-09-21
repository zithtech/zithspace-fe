"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import NoData from "@/components/common/NoData";

import React, { useState, useEffect, useMemo } from "react";
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
import { ReloadOutlined, MenuOutlined } from "@ant-design/icons";

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
import ConfirmDialog from "@/components/common/ConfirmDialog";

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


  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ServiceCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data: customersData, isLoading, refetch, isFetching } = useCustomers({
    page: currentPage,
    limit: pageSize,
    search: search || undefined,
    isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
  });
  const customers = customersData?.data || [];
  const totalCustomers = customersData?.pagination?.total ?? 0;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const counts = useMemo(() => {
    const all = customers.length;
    const active = customers.filter((c) => c.isActive).length;
    const inactive = all - active;
    return { all, active, inactive };
  }, [customers]);

  const progressPct = useMemo(() => {
    if (counts.all === 0) return 0;
    return Math.round((counts.active / counts.all) * 100);
  }, [counts]);

  const activeViewTitle = useMemo(() => {
    if (statusFilter === "active") return "Active";
    if (statusFilter === "inactive") return "Inactive";
    return "All Customers";
  }, [statusFilter]);

  const total = totalCustomers || customers.length;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedCustomers = useMemo(() => {
    return customers;
  }, [customers]);

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
      projectIds: values.projectIds || [],
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
    setViewDrawerVisible(false);
    setSelectedCustomerForView(null);
    setEditingCustomer(customer);
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

  // ─── Premium menu label helper ────────────────────────────────────────
  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );

  // ─── Shared action menu (table + cards) ───────────────────────────────────
  const getMenuItems = (customer: ServiceCustomer): MenuProps["items"] => [
    {
      key: "view",
      label: menuLabel("View profile", "Open customer details", <Eye size={14} />, '#3b82f6', 'rgba(59,130,246,0.12)'),
      onClick: (info: any) => {
        info?.domEvent?.stopPropagation?.();
        setSelectedCustomerForView(customer);
        setViewDrawerVisible(true);
      },
    },
    (canUpdateInvoiceCustomer || canDeleteInvoiceCustomer) && { type: "divider" as const },
    canUpdateInvoiceCustomer && {
      key: "status_toggle",
      label: customer.isActive
        ? menuLabel("Deactivate", "Disable this customer", <Ban size={14} />, '#f59e0b', 'rgba(245,158,11,0.12)')
        : menuLabel("Activate", "Enable this customer", <ShieldCheck size={14} />, '#10b981', 'rgba(16,185,129,0.12)'),
      onClick: async (info: any) => {
        info?.domEvent?.stopPropagation?.();
        try {
          await updateCustomer.mutateAsync({
            id: customer.id,
            data: { ...customer, isActive: !customer.isActive },
          });
          messageApi.success(`Customer ${customer.isActive ? "deactivated" : "activated"} successfully`);
        } catch (error: any) {
          messageApi.error(error.message || "Operation failed");
        }
      },
    },
    canUpdateInvoiceCustomer && {
      key: "edit",
      label: menuLabel("Edit", "Modify customer details", <Edit2 size={14} />, '#64748b', 'rgba(100,116,139,0.12)'),
      onClick: (info: any) => {
        info?.domEvent?.stopPropagation?.();
        handleEdit(customer);
      },
    },
    canDeleteInvoiceCustomer && { type: "divider" as const },
    canDeleteInvoiceCustomer && {
      key: "delete",
      danger: true,
      label: (
        <ConfirmDialog
          tone="danger"
          icon={<Trash2 size={14} />}
          title="Delete Customer"
          description={`Are you sure you want to delete "${customer.companyName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          placement="left"
          onConfirm={async () => {
            try {
              await deleteCustomer.mutateAsync(customer.id);
              messageApi.success("Customer deleted successfully");
            } catch (error: any) {
              if (error?.code === "23001" || error?.message?.includes("foreign key constraint")) {
                messageApi.error(
                  "Cannot delete customer: This customer has associated invoices. Please delete or reassign the invoices first.",
                  6
                );
              } else {
                messageApi.error(error?.message || "Failed to delete customer");
              }
            }
          }}
        >
          <div
            style={{ margin: '-5px -12px', padding: '5px 12px', width: 'calc(100% + 24px)', height: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuLabel("Delete", "Remove this customer", <Trash2 size={14} />, '#ef4444', 'rgba(239,68,68,0.12)')}
          </div>
        </ConfirmDialog>
      ),
    },
  ].filter(Boolean) as MenuProps["items"];

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
        <div className="flex flex-col gap-0.5 text-xs">
          {record.email && (
            <div className="flex items-center gap-1.5">
              <Mail size={12} style={{ color: "var(--text-secondary)" }} />
              <span style={{ color: "var(--text-primary)" }}>
                {record.email}
              </span>
            </div>
          )}
          {record.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={12} style={{ color: "var(--text-secondary)" }} />
              <span style={{ color: "var(--text-secondary)" }}>
                {record.phone}
              </span>
            </div>
          )}
          {!record.email && !record.phone && (
            <span style={{ color: "var(--text-secondary)" }}>—</span>
          )}
        </div>
      ),
    },
    {
      title: "TAX INFO",
      key: "taxInfo",
      render: (_: any, record: ServiceCustomer) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold"
              style={{
                background: "var(--bg-slate-50)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              GSTIN
            </span>
            <span style={{ color: "var(--text-primary)" }}>
              {record.gstin || record.taxId || "—"}
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
      width: 50,
      align: "center" as const,
      render: (_: any, record: ServiceCustomer) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            menu={{ items: getMenuItems(record) }}
            overlayClassName="pp-action-pop"
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreVertical size={16} style={{ color: "var(--text-secondary)" }} />}
            />
          </Dropdown>
        </div>
      ),
    },
  ];

  if (authLoading) return <MainLayout><ZukvoLoader size="md" /></MainLayout>;
  if (!canReadInvoiceCustomer) return null;

  return (
    <MainLayout>
      {contextHolder}
      <div className="pp-shell">
        {/* ============================ SIDEBAR ============================ */}
        {isMobileOpen && (
          <div className="pp-backdrop" onClick={() => setIsMobileOpen(false)} />
        )}
        <aside className={`pp-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
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
            <button className="pp-mobile-toggle" onClick={() => setIsMobileOpen(true)}>
              <MenuOutlined style={{ fontSize: 16 }} />
            </button>
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
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{total}</strong> customers</span>
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
            {/* ── Main Overview Banner (TicketList sprint head style) ── */}
            <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static invoice-overview-banner">
              {/* Row 1: dot + title + status tags */}
              <div className="tl-sprint-row1">
                <div className="tl-sprint-title-block">
                  <span
                    className="tl-sprint-dot"
                    style={{
                      background: "#3b82f6",
                      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                    }}
                  />
                  <Text
                    className="tl-sprint-title"
                    ellipsis={{ tooltip: `Customers — ${activeViewTitle}` }}
                  >
                    Customers — {activeViewTitle}
                  </Text>
                  <span className="tl-sprint-tags">
                    <span className="tl-sprint-tag tl-sprint-tag-neutral">
                      {counts.all} TOTAL
                    </span>
                    {counts.active > 0 && (
                      <span className="tl-sprint-tag tl-sprint-tag-active">
                        {counts.active} ACTIVE
                      </span>
                    )}
                    {counts.inactive > 0 && (
                      <span className="tl-sprint-tag tl-sprint-tag-delayed">
                        {counts.inactive} INACTIVE
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Row 2: customer count metrics */}
              <div className="tl-sprint-row2">
                <span className="tl-sprint-meta">
                  <b>{counts.active}</b>/{counts.all} customers active
                </span>
                <span className="tl-sprint-meta">
                  <b>{counts.inactive}</b> inactive
                </span>
              </div>

              {/* Row 3: wide progress bar + % */}
              <div className="tl-sprint-row3">
                <div className="tl-sprint-progress-bar">
                  <div
                    className="tl-sprint-progress-fill"
                    style={{ width: `${Math.min(100, progressPct)}%` }}
                  />
                </div>
                <span className="tl-sprint-progress-pct">{progressPct}%</span>
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
            ) : customers.length === 0 ? (
              <NoData description={
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
              } />
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
                          menu={{ items: getMenuItems(customer) }}
                          overlayClassName="pp-action-pop"
                          trigger={["click"]}
                          placement="bottomRight"
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
              <div className="pp-table-wrap">
                <Table
                  rowKey="id"
                  size="small"
                  columns={columns}
                  dataSource={pagedCustomers}
                  pagination={false}
                  onRow={(record) => ({
                    onClick: (e: any) => {
                      if (e?.target?.closest?.('.ant-dropdown, .ant-btn, .ant-dropdown-menu, .pp-action-pop, button')) {
                        return;
                      }
                      setSelectedCustomerForView(record);
                      setViewDrawerVisible(true);
                    },
                    className: "pp-row",
                  })}
                  className="saas-table tl-table pp-table customers-table"
                  scroll={{ x: 'max-content' }}
                  locale={{ emptyText: <NoData /> }}
                />
              </div>
            )}
          </div>

          {/* Sticky footer pagination */}
          {total > 0 && (
            <div className="pp-footer">
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
                  value={pageSize}
                  onChange={(val) => {
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="pp-pagesize"
                  size="small"
                  options={[
                    { value: 10, label: "10 / page" },
                    { value: 15, label: "15 / page" },
                    { value: 25, label: "25 / page" },
                    { value: 50, label: "50 / page" },
                  ]}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Drawer */}
      <CustomerDrawer
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
          form.resetFields();
        }}
        customer={editingCustomer}
        onSave={handleSave}
        loading={creating || updating}
      />

      <CustomerViewDrawer
        open={viewDrawerVisible}
        onClose={() => {
          setViewDrawerVisible(false);
          setSelectedCustomerForView(null);
        }}
        customer={selectedCustomerForView}
        onEdit={(customer) => {
          handleEdit(customer);
        }}
      />

      {/* Client Import Modal */}
      <ClientImportModal
        open={isClientImportModalOpen}
        onClose={() => setIsClientImportModalOpen(false)}
        onImport={handleImportClients}
        existingCustomers={customers}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={20} />
            <span>Delete Customer</span>
          </div>
        }
        open={isDeleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingCustomerId(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true, loading: deleteCustomer.status === "pending" }}
      >
        <p>
          Are you sure you want to delete this customer? This action cannot be
          undone.
        </p>
      </Modal>

      <style jsx global>{`
        /* --- TicketList sprint-head banner styles --- */
        .invoice-overview-banner {
          background: var(--bg-pure-white);
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid var(--border-slate-200);
          border-radius: 0;
          padding: 10px 24px 10px 14px;
          margin: 0;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .invoice-overview-banner .tl-sprint-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 5px;
        }
        .invoice-overview-banner .tl-sprint-title-block {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }
        .invoice-overview-banner .tl-sprint-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .invoice-overview-banner .tl-sprint-title {
          font-size: 13px !important;
          font-weight: 700 !important;
          color: var(--text-slate-900) !important;
          letter-spacing: -0.01em;
          margin: 0 !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .invoice-overview-banner .tl-sprint-tags {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }
        .invoice-overview-banner .tl-sprint-tag {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 1.5px 6px;
          border-radius: 4px;
        }
        .invoice-overview-banner .tl-sprint-tag-neutral {
          background: var(--bg-slate-100);
          color: var(--text-slate-600);
          border: 1px solid var(--border-slate-200);
        }
        .invoice-overview-banner .tl-sprint-tag-active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .invoice-overview-banner .tl-sprint-tag-today {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.25);
        }
        .invoice-overview-banner .tl-sprint-tag-delayed {
          background: rgba(248, 113, 113, 0.1);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.25);
        }
        .invoice-overview-banner .tl-sprint-row2 {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .invoice-overview-banner .tl-sprint-meta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-slate-500);
        }
        .invoice-overview-banner .tl-sprint-meta b {
          color: var(--text-slate-800);
          font-weight: 700;
        }
        .invoice-overview-banner .tl-sprint-row3 {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 15px;
        }
        .invoice-overview-banner .tl-sprint-progress-bar {
          flex: 1 1 auto;
          position: relative;
          height: 6px !important;
          background: var(--bg-slate-100);
          border-radius: 999px;
          overflow: hidden;
          min-width: 60px;
        }
        [data-theme='dark'] .invoice-overview-banner .tl-sprint-progress-bar { background: #1f2937 !important; }
        .invoice-overview-banner .tl-sprint-progress-fill {
          position: absolute;
          inset: 0;
          height: 100% !important;
          background: linear-gradient(90deg, #3b82f6, #10b981) !important;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .invoice-overview-banner .tl-sprint-progress-pct {
          flex-shrink: 0;
          font-size: 12px !important;
          font-weight: 800 !important;
          color: var(--text-slate-900) !important;
          font-variant-numeric: tabular-nums;
          min-width: 36px;
          text-align: right;
        }
        [data-theme='dark'] .invoice-overview-banner .tl-sprint-progress-pct { color: #f1f5f9 !important; }

        .pp-shell {
          display: flex;
          margin: 0 -24px;
          height: calc(100vh - 54px);
          max-height: calc(100vh - 54px);
          overflow: hidden;
          background: var(--bg-pure-white);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        [data-theme='dark'] .pp-shell { background: #0b0f12; }

        /* ---------------- Sidebar ---------------- */
        .pp-sidebar {
          width: 256px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 14px 34px;
          box-sizing: border-box;
          overflow: hidden;
        }
        [data-theme='dark'] .pp-sidebar { background: #0f1419; border-right-color: #1f2937; }
        .pp-side-head {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 4px 10px;
          border-bottom: 1px solid var(--border-slate-100);
          margin-bottom: 10px;
        }
        [data-theme='dark'] .pp-side-head { border-bottom-color: #1f2937; }
        .pp-side-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-blue-50);
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        [data-theme='dark'] .pp-side-title { color: #f1f5f9; }
        .pp-side-subtitle {
          font-size: 10.5px;
          color: var(--text-slate-400);
          font-weight: 700;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .pp-create-btn {
          height: 35px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          font-size: 12.5px !important;
          background: #3B82F6 !important;
          border: none !important;
          box-shadow: none !important;
          margin-bottom: 12px;
          color: #fff !important;
        }
        .pp-create-btn:hover { background: #2563EB !important; }
        .pp-create-btn .anticon { font-size: 12px !important; }
        .pp-side-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 0 -4px;
          padding: 0 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pp-side-scroll::-webkit-scrollbar { display: none; }
        .pp-side-section-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-slate-400);
          padding: 0 6px;
          margin: 12px 0 6px;
        }
        .pp-side-scroll > .pp-side-section-label:first-child { margin-top: 4px; }
        .pp-side-list { display: flex; flex-direction: column; gap: 1px; }
        .pp-view-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 6px 9px;
          border-radius: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background .12s ease;
          text-align: left;
        }
        .pp-view-item:hover { background: var(--bg-slate-50); }
        [data-theme='dark'] .pp-view-item:hover { background: #1a222d; }
        .pp-view-item.is-active { background: var(--bg-blue-50); }
        [data-theme='dark'] .pp-view-item.is-active { background: rgba(59,130,246,0.15); }
        .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
        [data-theme='dark'] .pp-view-item.is-active .pp-view-label { color: #f1f5f9; }
        .pp-view-icon { font-size: 13px; width: 15px; display: inline-flex; justify-content: center; }
        .pp-view-label { flex: 1; font-size: 12.5px; font-weight: 500; color: var(--text-slate-700); }
        [data-theme='dark'] .pp-view-label { color: #cbd5e1; }
        .pp-view-count {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-400);
          min-width: 16px;
          text-align: right;
        }
        .pp-view-item.is-active .pp-view-count {
          color: #3B82F6;
          font-weight: 700;
          background: rgba(59,130,246,0.12);
          border-radius: 5px;
          padding: 1px 6px;
          min-width: 0;
        }
        .pp-side-bottom-actions {
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid var(--border-slate-100);
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .pp-side-bottom-actions { background: #0f1419; border-top-color: #1f2937; }

        /* ---------------- Main ---------------- */
        .pp-main {
          flex: 1;
          min-width: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 100%;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .pp-main { background: #0b0f12; }
        .pp-topbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 24px 8px 14px;
          margin-bottom: 0;
          border-bottom: 1px solid var(--border-slate-200);
          flex-wrap: nowrap;
          flex-shrink: 0;
          background: var(--bg-pure-white);
          box-sizing: border-box;
        }
        [data-theme='dark'] .pp-topbar { background: #0f1419; border-bottom-color: #1f2937; }
        .pp-search-wrap {
          position: relative;
          flex: 1;
          max-width: 380px;
          min-width: 180px;
          display: flex;
          align-items: center;
          height: 30px;
          border-radius: 6px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          padding: 0 9px;
        }
        [data-theme='dark'] .pp-search-wrap { background: #131a22; border-color: #1f2937; }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 13px; }
        .pp-search {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          margin-left: 8px;
          font-size: 12.5px;
          color: var(--text-slate-900);
        }
        [data-theme='dark'] .pp-search { color: #f1f5f9; }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-topbar-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11.5px;
          color: var(--text-slate-500);
          white-space: nowrap;
        }
        .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        [data-theme='dark'] .pp-topbar-meta strong { color: #f1f5f9; }
        .pp-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.18);
          margin-right: 4px;
        }
        .pp-topbar-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .pp-ghost-btn {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50);
          color: var(--text-slate-700);
          cursor: pointer;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }
        .pp-divider { display: none; }

        .pp-body {
          flex: 1;
          min-height: 0;
          padding-bottom: 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Empty state */
        .pp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }
        .pp-empty-orb {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--bg-blue-50);
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .pp-empty-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-slate-800);
          margin-bottom: 4px;
        }
        .pp-empty-sub {
          font-size: 12px;
          color: var(--text-slate-400);
          max-width: 320px;
        }

        /* Grid view cards */
        .pp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 10px 24px 10px 14px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          box-sizing: border-box;
          align-content: start;
          align-items: start;
          grid-auto-rows: max-content;
        }
        .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .pc-card {
          border: 1px solid var(--border-slate-200);
          border-radius: 0;
          background: var(--bg-pure-white);
          cursor: pointer;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
          height: 144px;
        }
        [data-theme='dark'] .pc-card { background: #0f1419; border-color: #1f2937; }
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
        [data-theme='dark'] .pc-foot { background: #131a22; border-top-color: #1f2937; }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        [data-theme='dark'] .pc-foot-row + .pc-foot-row { border-top-color: #1f2937; }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }
        [data-theme='dark'] .pc-foot-item { color: #cbd5e1; }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-val { font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); flex-shrink: 0; }
        .pc-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .pc-view-btn:hover { text-decoration: underline; }

        .pp-btn-primary {
          background: #3B82F6 !important; border: none !important;
          border-radius: 0 !important; font-weight: 600 !important;
        }

        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        /* Table */
        .pp-table-wrap {
          background: var(--bg-pure-white);
          border: none;
          border-radius: 0;
          overflow-y: auto;
          overflow-x: auto;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          margin: 0;
          padding: 0;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pp-table-wrap::-webkit-scrollbar,
        .pp-table-wrap .ant-table-body::-webkit-scrollbar,
        .pp-table-wrap .ant-table-content::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .pp-table-wrap .ant-table-body,
        .pp-table-wrap .ant-table-content {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        [data-theme='dark'] .pp-table-wrap { background: #0b0f12; }
        .pp-table .ant-table-cell-scrollbar,
        .tl-table .ant-table-cell-scrollbar {
          display: none !important;
          width: 0 !important;
          padding: 0 !important;
        }

        .pp-table,
        .pp-table.ant-table-wrapper,
        .pp-table .ant-table,
        .tl-table .ant-table,
        .pp-table .ant-table-container,
        .tl-table .ant-table-container {
          background: transparent;
          font-size: 12px;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-end-start-radius: 0 !important;
          border-end-end-radius: 0 !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
        }
        .pp-table .ant-table-header,
        .tl-table .ant-table-header,
        .pp-table .ant-table-thead,
        .tl-table .ant-table-thead,
        .pp-table .ant-table-thead > tr,
        .tl-table .ant-table-thead > tr {
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-end-start-radius: 0 !important;
          border-end-end-radius: 0 !important;
        }
        .pp-table .ant-table-body,
        .tl-table .ant-table-body {
          flex: 1 1 auto !important;
          max-height: none !important;
          overflow-y: auto !important;
        }
        .pp-table .ant-table-thead > tr > th,
        .tl-table .ant-table-thead > tr > th,
        .pp-table .ant-table-thead > tr > td,
        .tl-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase !important;
          color: var(--text-slate-500) !important;
          padding: 5px 10px !important;
          white-space: nowrap !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-end-start-radius: 0 !important;
          border-end-end-radius: 0 !important;
        }
        .pp-table .ant-table-thead > tr > th::before,
        .tl-table .ant-table-thead > tr > th::before {
          display: none !important;
        }
        [data-theme='dark'] .pp-table .ant-table-thead > tr > th,
        [data-theme='dark'] .tl-table .ant-table-thead > tr > th {
          background: #0f1419 !important;
          border-bottom-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        .pp-table .ant-table-tbody > tr > td,
        .tl-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 4px 10px !important;
          font-size: 11.5px !important;
          border-radius: 0 !important;
        }
        .pp-table .ant-table-cell,
        .tl-table .ant-table-cell {
          line-height: 1.3 !important;
          border-radius: 0 !important;
        }
        [data-theme='dark'] .pp-table .ant-table-tbody > tr > td,
        [data-theme='dark'] .tl-table .ant-table-tbody > tr > td {
          border-bottom-color: #1f2937 !important;
        }
        .pp-table .ant-table-tbody > tr:last-child > td,
        .tl-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td,
        .tl-table .ant-table-tbody > tr.pp-row:hover > td,
        .pp-table .ant-table-tbody > tr:hover > td,
        .tl-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .pp-table .ant-table-tbody > tr.pp-row:hover > td,
        [data-theme='dark'] .tl-table .ant-table-tbody > tr.pp-row:hover > td,
        [data-theme='dark'] .pp-table .ant-table-tbody > tr:hover > td,
        [data-theme='dark'] .tl-table .ant-table-tbody > tr:hover > td {
          background: #1e293b !important;
        }
        .pp-table .ant-table-tbody > tr.pp-row {
          cursor: pointer;
        }
        .pp-table .ant-table-selection-column,
        .tl-table .ant-table-selection-column {
          padding-inline: 6px !important;
        }

        /* Footer + pager */
        .pp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 8px 24px 8px 14px;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          box-sizing: border-box;
          flex-shrink: 0;
          margin-top: auto;
          position: sticky;
          bottom: 0;
          z-index: 20;
        }
        [data-theme='dark'] .pp-footer { background: #0f1419; border-top-color: #1f2937; }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        [data-theme='dark'] .pp-footer-info strong { color: #f1f5f9; }

        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          display: inline-flex; align-items: center; justify-content: center;
        }
        [data-theme='dark'] .pp-pager-btn, [data-theme='dark'] .pp-pager-num { background: #131a22; border-color: #1f2937; color: #cbd5e1; }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 6px !important; height: 28px !important; }

        .pp-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(2px);
          z-index: 999;
        }
        .pp-mobile-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text-slate-600);
          margin-right: 12px;
        }
        @media (max-width: 1024px) {
          .pp-sidebar {
            position: fixed;
            left: -280px;
            top: 54px;
            bottom: 0;
            height: calc(100vh - 54px);
            transition: left 0.3s ease;
            z-index: 1000;
            box-shadow: 4px 0 24px rgba(15, 23, 42, 0.1);
            display: flex;
          }
          .pp-sidebar.is-open { left: 0; }
          .pp-backdrop { display: block; }
          .pp-mobile-toggle { display: flex; }
        }

        .pp-segmented {
          display: inline-flex;
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-slate-50);
          padding: 1px;
        }
        .pp-segmented button {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--text-slate-400);
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all .15s ease;
        }
        .pp-segmented button.is-active {
          background: var(--bg-pure-white);
          color: #3B82F6;
          box-shadow: 0 1px 3px rgba(15,23,42,0.08);
        }

        /* Premium action dropdown */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px;
          border-radius: 0;
          min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          overflow: hidden !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .pp-action-pop .ant-dropdown-menu::-webkit-scrollbar { display: none !important; }
        .pp-action-pop,
        .pp-action-pop * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .pp-action-pop ::-webkit-scrollbar { display: none !important; }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important;
          border-radius: 0 !important;
          margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px;
          height: 30px;
          border-radius: 0;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }
      `}</style>
    </MainLayout>
  );
}
