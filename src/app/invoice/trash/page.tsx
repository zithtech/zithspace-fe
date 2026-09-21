"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import NoData from "@/components/common/NoData";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import {
  Typography,
  Table,
  Button,
  Input,
  Modal,
  message,
  Progress,
  Select,
  DatePicker,
  Tooltip,
  Tag,
} from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  Trash2,
  RotateCcw,
  Search,
  RefreshCw,
  ChevronLeft,
  XCircle,
  AlertCircle,
  Users,
  CheckCircle2,
  Inbox,
  X,
  Filter as FilterIcon,
  Clock,
  CheckCircle,
  Mail,
  DollarSign,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ReloadOutlined } from "@ant-design/icons";


import {
  useDeletedInvoices,
  useRestoreInvoice,
  useBulkRestoreInvoices,
  usePermanentDeleteInvoice,
  useBulkPermanentDeleteInvoices,
  invoiceKeys,
} from "@/hooks/useInvoices";
import { useQueryClient } from "@tanstack/react-query";
import { useActivitySource } from "@/hooks/useActivitySource";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { currencySymbol } from "@/utils/currencies";

const { Title } = Typography;
const { RangePicker } = DatePicker;


// Define the InvoiceStatus to match TypeScript interface
type InvoiceStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';

// Helper to convert backend status to frontend status
const fromBackendStatus = (status: string): InvoiceStatus => {
  if (status === 'APPROVAL') return 'APPROVED';
  return status as InvoiceStatus;
};

// Status color mapping
const getStatusColor = (status: InvoiceStatus) => {
  const colors: Record<InvoiceStatus, string> = {
    'DRAFT': 'default',
    'PENDING': 'blue',
    'APPROVED': 'cyan',
    'SENT': 'geekblue',
    'PAID': 'success',
    'PARTIALLY_PAID': 'warning',
    'OVERDUE': 'error',
    'CANCELLED': 'default'
  };
  return colors[status] || 'default';
};

// Status icon mapping
const getStatusIcon = (status: InvoiceStatus) => {
  const icons: Record<InvoiceStatus, React.ReactNode> = {
    'DRAFT': <Clock size={14} />,
    'PENDING': <Clock size={14} />,
    'APPROVED': <CheckCircle size={14} />,
    'SENT': <Mail size={14} />,
    'PAID': <CheckCircle size={14} style={{ color: '#52c41a' }} />,
    'PARTIALLY_PAID': <DollarSign size={14} style={{ color: '#faad14' }} />,
    'OVERDUE': <AlertCircle size={14} style={{ color: '#ff4d4f' }} />,
    'CANCELLED': <XCircle size={14} style={{ color: '#bfbfbf' }} />
  };
  return icons[status] || <Clock size={14} />;
};

export default function InvoiceTrashPage() {
  const router = useRouter();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const {
    canReadInvoiceTrash,
    canRestoreInvoiceTrash,
    canDeleteInvoiceTrash
  } = usePermission();
  const { isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !canReadInvoiceTrash) {
      router.push("/invoice/invoices");
    }
  }, [authLoading, canReadInvoiceTrash, router]);

  // Register UX context for activity logging
  useActivitySource({ section: "FINANCE", module: "Invoices", page: "InvoiceTrashView" });

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 15 });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  const { data, isLoading, isFetching, refetch } = useDeletedInvoices({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch,
    status: statusFilter || undefined,
    startDate: dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
    endDate: dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
  });

  const restoreMutation = useRestoreInvoice();
  const bulkRestoreMutation = useBulkRestoreInvoices();
  const permanentDeleteMutation = usePermanentDeleteInvoice();
  const bulkDeleteMutation = useBulkPermanentDeleteInvoices();

  const invoices = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const pageStart = total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = Math.min(pagination.page * pagination.limit, total);
  const pageCount = Math.max(1, Math.ceil(total / pagination.limit));

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter, dateRange]);

  const customerCount = new Set(
    invoices.map((i: any) => i.customerId)
  ).size;
  const totalAmount = invoices.reduce(
    (sum: number, i: any) => sum + Number(i.grandTotal || 0),
    0
  );

  const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{
    visible: boolean;
    total: number;
    completed: number;
    failed: number;
    currentInvoice: string | null;
    isDeleting: boolean;
  }>({
    visible: false,
    total: 0,
    completed: 0,
    failed: 0,
    currentInvoice: null,
    isDeleting: false,
  });

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRestore = (record: any) => {
    modal.confirm({
      title: "Restore invoice",
      icon: <RotateCcw size={18} className="text-emerald-500 mr-2" />,
      content: `Restore invoice ${record.invoiceNumber}?`,
      okText: "Restore",
      okType: "primary",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await restoreMutation.mutateAsync(record.id);
          messageApi.success("Invoice restored");
          refetch();
        } catch (error: any) {
          messageApi.error(error.message || "Failed to restore invoice");
        }
      },
    });
  };

  const handleBulkRestore = () => {
    if (selectedRowKeys.length === 0) return;
    modal.confirm({
      title: "Restore selected invoices",
      icon: <RotateCcw size={18} className="text-emerald-500 mr-2" />,
      content: `Restore ${selectedRowKeys.length} invoices?`,
      okText: "Restore all",
      okType: "primary",
      onOk: async () => {
        try {
          await bulkRestoreMutation.mutateAsync(selectedRowKeys as string[]);
          messageApi.success(`${selectedRowKeys.length} invoices restored`);
          setSelectedRowKeys([]);
          setSelectedInvoices([]);
          refetch();
        } catch (error: any) {
          messageApi.error(error.message || "Failed to restore invoices");
        }
      },
    });
  };

  const openDeleteModal = (record: any) => {
    setInvoiceToDelete(record);
    setDeleteModalVisible(true);
  };

  const handlePermanentDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      setDeletingId(invoiceToDelete.id);
      await permanentDeleteMutation.mutateAsync(invoiceToDelete.id);
      messageApi.success("Invoice permanently deleted");
      setDeleteModalVisible(false);
      setInvoiceToDelete(null);
      setDeletingId(null);
      refetch();
    } catch (error: any) {
      messageApi.error(error.message || "Failed to delete invoice");
      setDeletingId(null);
    }
  };

  const openBulkDeleteModal = () => {
    if (selectedInvoices.length === 0) {
      messageApi.warning("Please select invoices to delete");
      return;
    }
    setBulkDeleteModalVisible(true);
  };

  const startBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;
    setBulkDeleteModalVisible(false);
    const ids = selectedInvoices.map((inv) => inv.id);

    setBulkDeleteProgress({
      visible: true,
      total: selectedInvoices.length,
      completed: 0,
      failed: 0,
      currentInvoice: "Processing bulk deletion...",
      isDeleting: true,
    });

    try {
      await bulkDeleteMutation.mutateAsync(ids);
      setBulkDeleteProgress((prev) => ({
        ...prev,
        completed: selectedInvoices.length,
        currentInvoice: "Finished",
      }));
    } catch (error: any) {
      console.error("Bulk permanent delete failed:", error);
      setBulkDeleteProgress((prev) => ({
        ...prev,
        failed: selectedInvoices.length,
        isDeleting: false,
      }));
    }

    setTimeout(() => {
      setBulkDeleteProgress({
        visible: false,
        total: 0,
        completed: 0,
        failed: 0,
        currentInvoice: null,
        isDeleting: false,
      });
      setSelectedRowKeys([]);
      setSelectedInvoices([]);
      refetch();
    }, 1000);
  };

  // Stat tile — standard stat card style
  const StatTile = ({
    label,
    value,
    icon: Icon,
    color,
    bgColor,
    sub,
  }: {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    bgColor: string;
    sub?: string;
  }) => (
    <div className="pp-stat-card">
      <div className="pp-stat-top">
        <div className="pp-stat-left">
          <span className="pp-stat-icon" style={{ background: bgColor, color }}>
            <Icon size={14} />
          </span>
          <span className="pp-stat-label">{label}</span>
        </div>
      </div>
      <div className="pp-stat-bottom">
        <div className="pp-stat-value-wrap">
          <span className="pp-stat-value">{value}</span>
        </div>
        {sub && <span className="pp-stat-period">{sub}</span>}
      </div>
    </div>
  );

  const columns: ColumnsType<any> = [
    {
      title: "INVOICE",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      width: 200,
      render: (text, record) => {
        const snapshot = record.customerSnapshot as any;
        const companyName =
          snapshot?.companyName || record.customer?.companyName || "Unknown";
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
              style={{
                background: "var(--bg-blue-50)",
                color: "var(--text-blue-700)",
                border: "1px solid var(--border-blue-200)",
              }}
            >
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div
                className="text-sm font-semibold truncate flex items-center gap-1.5"
                style={{ color: "var(--text-primary)" }}
              >
                {text}
              </div>
              <div
                className="text-[11px] mt-0.5 truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {companyName}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "DATE",
      dataIndex: "invoiceDate",
      width: 120,
      render: (date: string) => (
        <span
          className="text-[12.5px]"
          style={{ color: "var(--text-secondary)" }}
        >
          {date ? dayjs(date).format("MMM D, YYYY") : "—"}
        </span>
      ),
    },
    {
      title: "DUE DATE",
      dataIndex: "dueDate",
      width: 120,
      render: (date: string) => (
        <span
          className="text-[12.5px]"
          style={{ color: "var(--text-secondary)" }}
        >
          {date ? dayjs(date).format("MMM D, YYYY") : "—"}
        </span>
      ),
    },
    {
      title: "DELETED",
      dataIndex: "deletedAt",
      width: 140,
      render: (date: string) => (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
          style={{
            background: "rgba(248,113,113,0.10)",
            color: "#f87171",
            border: "1px solid rgba(248,113,113,0.25)",
          }}
        >
          <Trash2 size={10} />
          {date ? dayjs(date).format("MMM D, YYYY") : "—"}
        </span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 140,
      render: (status: string) => {
        const frontendStatus = fromBackendStatus(status);
        const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
          paid: {
            bg: "rgba(16,185,129,0.10)",
            color: "#10b981",
            border: "rgba(16,185,129,0.25)",
            label: "Paid",
          },
          submitted: {
            bg: "rgba(59,130,246,0.10)",
            color: "#3b82f6",
            border: "rgba(59,130,246,0.25)",
            label: "Submitted",
          },
          pending: {
            bg: "rgba(59,130,246,0.10)",
            color: "#3b82f6",
            border: "rgba(59,130,246,0.25)",
            label: "Pending",
          },
          draft: {
            bg: "rgba(100,116,139,0.10)",
            color: "#64748b",
            border: "rgba(100,116,139,0.25)",
            label: "Draft",
          },
          overdue: {
            bg: "rgba(248,113,113,0.10)",
            color: "#f87171",
            border: "rgba(248,113,113,0.25)",
            label: "Overdue",
          },
        };
        const cfg =
          map[frontendStatus?.toLowerCase()] || {
            bg: "rgba(100,116,139,0.10)",
            color: "#64748b",
            border: "rgba(100,116,139,0.25)",
            label: frontendStatus || "Unknown",
          };
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
            style={{
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              textTransform: "uppercase"
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.color }}
            />
            {cfg.label}
          </span>
        );
      }
    },
    {
      title: "AMOUNT",
      dataIndex: "grandTotal",
      width: 160,
      align: "right",
      render: (v, record: any) => (
        <span
          className="text-[12px] font-semibold tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {currencySymbol(record?.currency)}{Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      align: "center",
      width: 180,
      fixed: "right" as const,
      render: (_, record) => (
        <div
          className="flex items-center justify-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {canRestoreInvoiceTrash && (
            <Tooltip title="Restore invoice">
              <button
                type="button"
                onClick={() => handleRestore(record)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-semibold transition-colors"
                style={{
                  background: "var(--bg-secondary)",
                  color: "#10b981",
                  border: "1px solid var(--border-color)",
                }}
              >
                <RotateCcw size={11} strokeWidth={2.25} />
                Restore
              </button>
            </Tooltip>
          )}
          {canDeleteInvoiceTrash && (
            <Tooltip title="Delete permanently">
              <ConfirmDialog
                tone="danger"
                title="Permanent Delete"
                description={`Are you sure you want to permanently delete invoice ${record.invoiceNumber}? This action cannot be undone.`}
                confirmText="Delete"
                onConfirm={async () => {
                  try {
                    setDeletingId(record.id);
                    await permanentDeleteMutation.mutateAsync(record.id);
                    messageApi.success("Invoice permanently deleted");
                    refetch();
                  } catch (error: any) {
                    messageApi.error(error.message || "Failed to delete invoice");
                  } finally {
                    setDeletingId(null);
                  }
                }}
                placement="left"
              >
                <button
                  type="button"
                  disabled={deletingId === record.id}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-60"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "#f87171",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <Trash2 size={11} strokeWidth={2.25} />
                  Delete
                </button>
              </ConfirmDialog>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[], rows: any[]) => {
      setSelectedRowKeys(keys);
      setSelectedInvoices(rows);
    },
  };

  const filterCount =
    (statusFilter ? 1 : 0) + (dateRange && dateRange[0] && dateRange[1] ? 1 : 0);

  if (authLoading)
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <ZukvoLoader size="lg" />
        </div>
      </MainLayout>
    );
  if (!canReadInvoiceTrash) return null;

  return (
    <MainLayout>
      {messageContextHolder}
      {modalContextHolder}
      <div className="pp-shell">
        {/* ============================ MAIN ============================ */}
        <main className="pp-main">
          {/* Top search bar & actions */}
          <div className="pp-topbar">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/invoice/invoices")}
                className="pp-ghost-btn"
                aria-label="Back"
              >
                <ChevronLeft size={14} />
              </button>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(248,113,113,0.1)",
                  color: "#f87171",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                <Trash2 size={13} strokeWidth={2.25} />
              </div>
              <span
                className="text-[13px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Trash
              </span>
            </div>

            <div className="pp-search-wrap">
              <Search className="pp-search-icon" size={13} />
              <input
                className="pp-search"
                placeholder="Search deleted invoices..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{total}</strong> in trash</span>
            </div>

            <div className="pp-topbar-actions">
              <Tooltip title="Refresh">
                <button
                  type="button"
                  className="pp-ghost-btn"
                  onClick={async () => {
                    await queryClient.invalidateQueries({
                      queryKey: invoiceKeys.lists(),
                    });
                    refetch();
                  }}
                >
                  <ReloadOutlined spin={isLoading || isFetching} />
                </button>
              </Tooltip>
              <Button
                icon={<ChevronLeft size={13} />}
                onClick={() => router.push("/invoice/invoices")}
                className="flex items-center justify-center font-semibold text-xs"
                style={{
                  borderRadius: 6,
                  height: 30,
                }}
              >
                Invoices
              </Button>
            </div>
          </div>

          <div className="pp-body">
            {/* ── Main Overview Banner (TicketList sprint head style) ── */}
            <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static invoice-overview-banner">
              {/* Row 1: dot + title + status tags */}
              <div className="tl-sprint-row1">
                <div className="tl-sprint-title-block">
                  <span
                    className="tl-sprint-dot"
                    style={{
                      background: "#f87171",
                      boxShadow: "0 0 0 3px rgba(248, 113, 113, 0.2)",
                    }}
                  />
                  <Typography.Text
                    className="tl-sprint-title"
                    ellipsis={{
                      tooltip: `Trash — ${statusFilter ? `${statusFilter} Invoices` : "Deleted Invoices"}`,
                    }}
                  >
                    Trash — {statusFilter ? `${statusFilter} Invoices` : "Deleted Invoices"}
                  </Typography.Text>
                  <span className="tl-sprint-tags">
                    <span className="tl-sprint-tag tl-sprint-tag-delayed">
                      {total} DELETED
                    </span>
                    {customerCount > 0 && (
                      <span className="tl-sprint-tag tl-sprint-tag-neutral">
                        {customerCount} CUSTOMERS
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Row 2: count metrics */}
              <div className="tl-sprint-row2">
                <span className="tl-sprint-meta">
                  <b>{total}</b> deleted invoices
                </span>
                <span className="tl-sprint-meta">
                  <b>{customerCount}</b> affected customers
                </span>
              </div>

              {/* Row 3: wide progress bar + % */}
              <div className="tl-sprint-row3">
                <div className="tl-sprint-progress-bar">
                  <div
                    className="tl-sprint-progress-fill"
                    style={{
                      width: `${total > 0 ? 100 : 0}%`,
                      background: "linear-gradient(90deg, #f87171 0%, #ef4444 100%)",
                    }}
                  />
                </div>
                <span className="tl-sprint-progress-pct">{total > 0 ? 100 : 0}%</span>
              </div>
            </div>

            {/* FILTERS — compact row */}
            <div
              className="flex flex-wrap items-center gap-2 py-1.5"
              style={{
                background: "var(--bg-slate-50)",
                borderBottom: "1px solid var(--border-slate-200)",
                boxSizing: "border-box",
                padding: "6px 24px",
              }}
            >
              {/* Status */}
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Status
                </span>
                <Select
                  placeholder="Any status"
                  allowClear
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  style={{ width: 140, height: 28 }}
                  size="small"
                  options={[
                    { label: "Draft", value: "DRAFT" },
                    { label: "Pending", value: "PENDING" },
                    { label: "Approved", value: "APPROVED" },
                    { label: "Sent", value: "SENT" },
                    { label: "Paid", value: "PAID" },
                    { label: "Partially Paid", value: "PARTIALLY_PAID" },
                    { label: "Overdue", value: "OVERDUE" },
                    { label: "Cancelled", value: "CANCELLED" },
                  ]}
                />
              </div>

              <span className="h-4 w-px" style={{ background: "var(--border-color)" }} />

              {/* Date Range */}
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Date range
                </span>
                <RangePicker
                  value={dateRange as any}
                  onChange={(values) => setDateRange(values)}
                  allowClear
                  size="small"
                  style={{ height: 28 }}
                />
              </div>

              {/* Bulk actions banner if rows selected */}
              {selectedRowKeys.length > 0 && (
                <div
                  className="ml-auto flex items-center gap-2 px-2.5 py-1 rounded-md"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} style={{ color: "#3B82F6" }} />
                    <span className="text-[11.5px] font-semibold text-blue-600">
                      {selectedRowKeys.length} selected
                    </span>
                  </div>
                  {canRestoreInvoiceTrash && (
                    <Button
                      size="small"
                      icon={<RotateCcw size={11} />}
                      onClick={handleBulkRestore}
                      loading={bulkRestoreMutation.isPending}
                      style={{
                        borderRadius: 5,
                        height: 24,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Restore
                    </Button>
                  )}
                  {canDeleteInvoiceTrash && (
                    <Button
                      size="small"
                      danger
                      type="primary"
                      icon={<Trash2 size={11} />}
                      onClick={openBulkDeleteModal}
                      loading={bulkDeleteProgress.isDeleting}
                      style={{
                        borderRadius: 5,
                        height: 24,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#f87171",
                      }}
                    >
                      Delete
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRowKeys([]);
                      setSelectedInvoices([]);
                    }}
                    className="p-1 rounded hover:bg-white text-slate-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* CONTENT */}
            {isLoading || (invoices.length === 0 && isFetching) ? (
              <div
                className="flex flex-col justify-center items-center h-64"
                style={{ background: "transparent" }}
              >
                <ZukvoLoader size="md" />
              </div>
            ) : invoices.length === 0 ? (
              <NoData
                description={
                  <div className="pp-empty">
                    <div
                      className="pp-empty-orb"
                      style={{
                        background: "rgba(248,113,113,0.1)",
                        color: "#f87171",
                      }}
                    >
                      <Trash2 size={24} />
                    </div>
                    <div className="pp-empty-title">
                      {searchText || filterCount > 0
                        ? "No deleted invoices match"
                        : "Trash is empty"}
                    </div>
                    <div className="pp-empty-sub">
                      {searchText || filterCount > 0
                        ? "Try adjusting your search or filters"
                        : "Deleted invoices will appear here for 30 days"}
                    </div>
                    {!searchText && filterCount === 0 && (
                      <Button
                        icon={<ChevronLeft size={13} />}
                        onClick={() => router.push("/invoice/invoices")}
                        style={{
                          marginTop: 14,
                          borderRadius: 6,
                          height: 32,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Back to invoices
                      </Button>
                    )}
                  </div>
                }
              />
            ) : (
              <div className="pp-table-wrap">
                <Table
                  loading={isFetching}
                  size="small"
                  rowSelection={rowSelection}
                  columns={columns}
                  dataSource={invoices.map((inv: any) => ({
                    ...inv,
                    key: inv.id,
                  }))}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  className="saas-table tl-table pp-table trash-table"
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
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                >
                  ‹
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .slice(Math.max(0, pagination.page - 3), Math.max(0, pagination.page - 3) + 5)
                  .map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pp-pager-num ${p === pagination.page ? "is-active" : ""}`}
                      onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  type="button"
                  className="pp-pager-btn"
                  disabled={pagination.page >= pageCount}
                  onClick={() => setPagination((p) => ({ ...p, page: Math.min(pageCount, p.page + 1) }))}
                >
                  ›
                </button>
                <Select
                  className="pp-pagesize"
                  value={pagination.limit}
                  onChange={(v) => setPagination({ page: 1, limit: v })}
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

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setInvoiceToDelete(null);
        }}
        footer={null}
        closable={false}
        width={420}
        centered
        destroyOnClose
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(248,113,113,0.1)",
                color: "#f87171",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              <Trash2 size={18} strokeWidth={2.25} />
            </div>
            <div>
              <div
                className="text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Delete permanently
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                This action cannot be undone
              </div>
            </div>
          </div>
          <p
            className="text-[13px] mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            Are you sure you want to permanently delete invoice{" "}
            <strong>{invoiceToDelete?.invoiceNumber}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setDeleteModalVisible(false);
                setInvoiceToDelete(null);
              }}
              style={{ borderRadius: 6 }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              danger
              onClick={handlePermanentDelete}
              loading={deletingId === invoiceToDelete?.id}
              style={{ borderRadius: 6, background: "#f87171" }}
            >
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Progress Modal */}
      <Modal
        open={bulkDeleteProgress.visible}
        footer={null}
        closable={false}
        width={420}
        centered
        destroyOnClose
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(59,130,246,0.1)",
                color: "#3B82F6",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              <RefreshCw size={18} strokeWidth={2.25} className="animate-spin" />
            </div>
            <div>
              <div
                className="text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Processing deletion
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Please wait, this may take a moment
              </div>
            </div>
          </div>
          <Progress
            percent={
              bulkDeleteProgress.total > 0
                ? Math.round((bulkDeleteProgress.completed / bulkDeleteProgress.total) * 100)
                : 0
            }
            status={bulkDeleteProgress.failed > 0 ? "exception" : "active"}
            strokeColor={bulkDeleteProgress.failed > 0 ? undefined : "#3B82F6"}
            strokeWidth={6}
            showInfo={false}
          />
        </div>
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
          padding: 10px 24px;
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
          background: linear-gradient(90deg, #f87171, #ef4444) !important;
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
          padding: 8px 24px;
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
          background: #f87171;
          display: inline-block;
          box-shadow: 0 0 0 3px rgba(248,113,113,0.18);
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
        .pp-table .ant-table-thead > tr > th:first-child,
        .pp-table .ant-table-tbody > tr > td:first-child,
        .pp-table .ant-table-selection-column,
        .tl-table .ant-table-selection-column {
          padding-left: 24px !important;
          padding-right: 6px !important;
        }
        .pp-table .ant-table-thead > tr > th:last-child,
        .pp-table .ant-table-tbody > tr > td:last-child {
          padding-right: 24px !important;
        }

        /* Footer + pager */
        .pp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 8px 24px;
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
      `}</style>
    </MainLayout>
  );
}
