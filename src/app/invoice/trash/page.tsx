"use client";

import { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import {
  Typography,
  Table,
  Button,
  Input,
  Modal,
  Spin,
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
import isBetween from "dayjs/plugin/isBetween";

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

const { Title } = Typography;
const { RangePicker } = DatePicker;

dayjs.extend(isBetween);

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
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

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

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((inv: any) => {
        if (statusFilter && inv.status !== statusFilter) return false;
        if (dateRange && dateRange[0] && dateRange[1]) {
          const date = dayjs(inv.invoiceDate);
          if (!date.isBetween(dateRange[0], dateRange[1], "day", "[]"))
            return false;
        }
        return true;
      }),
    [invoices, statusFilter, dateRange]
  );

  const customerCount = new Set(
    filteredInvoices.map((i: any) => i.customerId)
  ).size;
  const totalAmount = filteredInvoices.reduce(
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
      width: 130,
      align: "right",
      render: (v) => (
        <span
          className="text-[12px] font-semibold tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          ${Number(v || 0).toLocaleString()}
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
              <button
                type="button"
                onClick={() => openDeleteModal(record)}
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
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  if (!canReadInvoiceTrash) return null;

  return (
    <MainLayout>
      {messageContextHolder}
      {modalContextHolder}
      <div
        style={{
          margin: "0 -24px",
          background: "var(--customers-page-bg)",
          minHeight: "calc(100vh - 54px)",
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
          <div className="px-6 py-2 md:py-0 min-h-[48px] md:h-12 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/invoice/invoices")}
                  className="p-1 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
                  aria-label="Back"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ChevronLeft size={16} />
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
              <span
                className="h-3 w-px hidden sm:inline"
                style={{ background: "var(--border-color)" }}
              />
              <span
                className="text-[11.5px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Review and restore deleted invoices, or remove them permanently
              </span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Tooltip title="Refresh">
                <Button
                  icon={
                    <RefreshCw
                      size={13}
                      className={isFetching ? "animate-spin" : ""}
                    />
                  }
                  onClick={async () => {
                    await queryClient.invalidateQueries({
                      queryKey: invoiceKeys.lists(),
                    });
                    refetch();
                  }}
                  className="flex-1 md:flex-initial flex items-center justify-center"
                  style={{
                    borderRadius: 6,
                    height: 30,
                    width: 30,
                  }}
                />
              </Tooltip>
              <Button
                icon={<ChevronLeft size={13} />}
                onClick={() => router.push("/invoice/invoices")}
                className="flex-1 md:flex-initial flex items-center justify-center"
                style={{
                  borderRadius: 6,
                  height: 30,
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <span>Back to invoices</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 pt-4 pb-8">
          <div className="mx-auto max-w-[1600px]">
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <StatTile
                label="Trashed invoices"
                value={isLoading ? "—" : total}
                icon={Trash2}
                color="#f87171"
                bgColor="rgba(248,113,113,0.1)"
              />
              <StatTile
                label="Affected customers"
                value={isLoading ? "—" : customerCount}
                icon={Users}
                color="#3B82F6"
                bgColor="rgba(59,130,246,0.1)"
              />
              <StatTile
                label="Total amount"
                value={
                  isLoading ? "—" : `$${totalAmount.toLocaleString()}`
                }
                icon={Inbox}
                color="#64748b"
                bgColor="rgba(100,116,139,0.1)"
              />
            </div>

            {/* FILTERS — all on one line */}
            <div
              className="flex flex-wrap items-center gap-2 mb-2.5 px-3 py-2"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: 0,
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
                  style={{ width: 150, height: 30 }}
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
                  style={{ height: 30, borderRadius: 6 }}
                />
              </div>

              <span className="h-4 w-px" style={{ background: "var(--border-color)" }} />

              {/* Search */}
              <Input
                placeholder="Search by invoice number or customer..."
                prefix={
                  <Search
                    size={13}
                    style={{ color: "var(--text-secondary)" }}
                  />
                }
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: 260,
                  height: 30,
                  borderRadius: 6,
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                  fontSize: 12,
                }}
              />

              {/* Clear */}
              {filterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter(null);
                    setDateRange(null);
                  }}
                  className="text-[11.5px] font-medium hover:underline"
                  style={{ color: "#f87171" }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* SELECTION BAR */}
            {selectedRowKeys.length > 0 && (
              <div
                className="rounded-none px-3.5 py-1.5 mb-2.5 flex items-center justify-between"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={14}
                    style={{ color: "#3B82F6" }}
                  />
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: "#3B82F6" }}
                  >
                    {selectedRowKeys.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {canRestoreInvoiceTrash && (
                    <Button
                      size="small"
                      icon={<RotateCcw size={12} />}
                      onClick={handleBulkRestore}
                      loading={bulkRestoreMutation.isPending}
                      style={{
                        borderRadius: 6,
                        height: 28,
                        fontSize: 11.5,
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
                      icon={<Trash2 size={12} />}
                      onClick={openBulkDeleteModal}
                      loading={bulkDeleteProgress.isDeleting}
                      style={{
                        borderRadius: 6,
                        height: 28,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background: "#f87171",
                      }}
                    >
                      Delete permanently
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRowKeys([]);
                      setSelectedInvoices([]);
                    }}
                    className="p-1 rounded-md transition-colors hover:bg-white"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* CONTENT */}
            {isLoading || (filteredInvoices.length === 0 && isFetching) ? (
              <div
                className="flex flex-col justify-center items-center h-64 rounded-none"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Spin />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 rounded-none"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1.5px dashed var(--border-color)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-3.5"
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    color: "#f87171",
                    border: "1px solid rgba(248,113,113,0.2)",
                  }}
                >
                  <Trash2 size={20} strokeWidth={2} />
                </div>
                <Title
                  level={5}
                  style={{
                    color: "var(--text-primary)",
                    margin: 0,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {searchText || filterCount > 0
                    ? "No deleted invoices match"
                    : "Trash is empty"}
                </Title>
                <Typography.Text
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    marginTop: 4,
                    marginBottom: 16,
                  }}
                >
                  {searchText || filterCount > 0
                    ? "Try adjusting your search or filters"
                    : "Deleted invoices will appear here for 30 days"}
                </Typography.Text>
                {!searchText && filterCount === 0 && (
                  <Button
                    icon={<ChevronLeft size={13} />}
                    onClick={() => router.push("/invoice/invoices")}
                    style={{
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
            ) : (
              <div
                className="rounded-none overflow-hidden"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Table
                  loading={isFetching}
                  size="middle"
                  rowSelection={rowSelection}
                  columns={columns}
                  dataSource={filteredInvoices.map((inv) => ({
                    ...inv,
                    key: inv.id,
                  }))}
                  pagination={false}
                  scroll={{ x: 1100 }}
                  className="trash-table"
                />
              </div>
            )}
          </div>
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
                options={[5, 10, 15, 25, 50, 100].map((n) => ({
                  value: n,
                  label: `${n} / page`,
                }))}
                popupMatchSelectWidth={120}
              />
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pp-stat-card {
          background: var(--bg-pure-white, #fff); border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 0; padding: 10px 12px; min-height: 84px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 8px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 11.5px; font-weight: 600; color: var(--text-slate-600, #475569); }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 18px; font-weight: 800; color: var(--text-slate-900, #0f172a); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 10.5px; color: var(--text-slate-400, #94a3b8); font-weight: 500; }

        .trash-table .ant-table-thead > tr > th {
          background-color: var(--bg-slate-50) !important;
          color: var(--text-secondary) !important;
          font-weight: 650 !important;
          font-size: 10.5px !important;
          padding: 6px 12px !important;
          white-space: nowrap !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid var(--border-color) !important;
          text-transform: uppercase !important;
        }
        .trash-table .ant-table-tbody > tr > td {
          padding: 8px 12px !important;
          border-bottom: 1px solid var(--border-color) !important;
          font-size: 12px !important;
        }
        .trash-table .ant-table-row:hover > td {
          background-color: var(--bg-slate-50) !important;
        }
        .trash-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }

        /* Footer + pager */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 10px 14px; border-top: 1px solid var(--border-slate-200, #e2e8f0);
        }
        .pp-footer--sticky {
          position: sticky; bottom: 0; z-index: 30;
          margin: 16px 0 0 0;
          padding: 0 24px;
          background: var(--bg-pure-white, #fff);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          height: 48px;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500, #64748b); }
        .pp-footer-info strong { color: var(--text-slate-700, #334155); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200, #e2e8f0);
          background: var(--bg-pure-white, #fff); color: var(--text-slate-600, #475569); cursor: pointer; font-size: 12.5px; font-weight: 600;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }
      `,
        }}
      />

      {/* SINGLE DELETE MODAL */}
      <Modal
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setInvoiceToDelete(null);
        }}
        footer={null}
        width={460}
        centered
        closable={false}
        styles={{
          body: { padding: 0 },
          mask: {
            backdropFilter: "blur(4px)",
            background: "rgba(15, 23, 42, 0.45)",
          },
          content: { padding: 0, borderRadius: 12, overflow: "hidden" },
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
                background: "rgba(248,113,113,0.1)",
                color: "#f87171",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              <Trash2 size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Permanently delete invoice
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

        {invoiceToDelete && (
          <div className="px-6 py-5">
            <p
              className="text-[13px] leading-relaxed mb-4"
              style={{ color: "var(--text-secondary)" }}
            >
              You are about to permanently delete invoice{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {invoiceToDelete.invoiceNumber}
              </span>{" "}
              for{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {(invoiceToDelete.customerSnapshot as any)?.companyName ||
                  "Unknown"}
              </span>
              .
            </p>

            <div
              className="rounded-none overflow-hidden mb-4"
              style={{ border: "1px solid var(--border-color)" }}
            >
              <div
                className="grid grid-cols-2"
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <div
                  className="px-4 py-3"
                  style={{ borderRight: "1px solid var(--border-color)" }}
                >
                  <div
                    className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Invoice number
                  </div>
                  <div
                    className="text-[14px] font-semibold mt-0.5 tabular-nums"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {invoiceToDelete.invoiceNumber}
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div
                    className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Amount
                  </div>
                  <div
                    className="text-[14px] font-semibold mt-0.5 tabular-nums"
                    style={{ color: "var(--text-primary)" }}
                  >
                    ${Number(invoiceToDelete.grandTotal || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="rounded-none p-3 mb-5 flex items-start gap-2"
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              <AlertCircle
                size={14}
                className="mt-0.5 flex-shrink-0"
                style={{ color: "#f87171" }}
              />
              <span className="text-[12px]" style={{ color: "#f87171" }}>
                The invoice will be removed from the database and cannot be
                restored.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={() => {
                  setDeleteModalVisible(false);
                  setInvoiceToDelete(null);
                }}
                style={{ borderRadius: 6, height: 32 }}
              >
                Cancel
              </Button>
              <Button
                danger
                type="primary"
                loading={deletingId === invoiceToDelete.id}
                onClick={handlePermanentDelete}
                style={{ borderRadius: 6, height: 32, fontWeight: 600, background: "#f87171" }}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* BULK DELETE MODAL */}
      <Modal
        open={bulkDeleteModalVisible}
        onCancel={() => setBulkDeleteModalVisible(false)}
        footer={null}
        width={500}
        centered
        closable={false}
        styles={{
          body: { padding: 0 },
          mask: {
            backdropFilter: "blur(4px)",
            background: "rgba(15, 23, 42, 0.45)",
          },
          content: { padding: 0, borderRadius: 12, overflow: "hidden" },
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
                background: "rgba(248,113,113,0.1)",
                color: "#f87171",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              <Trash2 size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Delete {selectedInvoices.length} invoices
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
          <div
            className="rounded-none p-3 mb-4 max-h-64 overflow-y-auto"
            style={{
              background: "var(--bg-slate-50)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Selected for deletion
            </div>
            <div className="space-y-1.5">
              {selectedInvoices.slice(0, 10).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between text-[12.5px]"
                >
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {inv.invoiceNumber}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    ${Number(inv.grandTotal || 0).toLocaleString()}
                  </span>
                </div>
              ))}
              {selectedInvoices.length > 10 && (
                <div
                  className="text-[11.5px] italic mt-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  …and {selectedInvoices.length - 10} more
                </div>
              )}
            </div>
          </div>

          <div
            className="rounded-none p-3 mb-5 flex items-start gap-2"
            style={{
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            <AlertCircle
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: "#f87171" }}
            />
            <span className="text-[12px]" style={{ color: "#f87171" }}>
              All selected invoices will be permanently removed from the
              database.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => setBulkDeleteModalVisible(false)}
              style={{ borderRadius: 6, height: 32 }}
            >
              Cancel
            </Button>
            <Button
              danger
              type="primary"
              onClick={startBulkDelete}
              style={{ borderRadius: 6, height: 32, fontWeight: 600, background: "#f87171" }}
            >
              Delete {selectedInvoices.length} invoices
            </Button>
          </div>
        </div>
      </Modal>

      {/* BULK DELETE PROGRESS MODAL */}
      <Modal
        open={bulkDeleteProgress.visible}
        closable={false}
        maskClosable={false}
        footer={null}
        width={420}
        centered
        styles={{
          body: { padding: 0 },
          mask: {
            backdropFilter: "blur(4px)",
            background: "rgba(15, 23, 42, 0.45)",
          },
          content: { padding: 0, borderRadius: 12, overflow: "hidden" },
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
                background: "rgba(59,130,246,0.1)",
                color: "#3B82F6",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              <RefreshCw size={18} strokeWidth={2.25} className="animate-spin" />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
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
        </div>

        <div className="px-6 py-5">
          <div className="flex justify-between items-center mb-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: "var(--text-secondary)" }}
            >
              Progress
            </span>
            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {bulkDeleteProgress.completed}/{bulkDeleteProgress.total}
            </span>
          </div>
          <Progress
            percent={Math.round(
              (bulkDeleteProgress.completed / bulkDeleteProgress.total) * 100
            )}
            status={bulkDeleteProgress.failed > 0 ? "exception" : "active"}
            strokeColor={
              bulkDeleteProgress.failed > 0 ? undefined : "#3B82F6"
            }
            strokeWidth={6}
            showInfo={false}
          />
          <div className="flex justify-between text-[11px] mt-2">
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: "#10b981" }}
            >
              <CheckCircle2 size={11} /> Success:{" "}
              {bulkDeleteProgress.completed - bulkDeleteProgress.failed}
            </span>
            {bulkDeleteProgress.failed > 0 && (
              <span
                className="inline-flex items-center gap-1.5"
                style={{ color: "#f87171" }}
              >
                <XCircle size={11} /> Failed: {bulkDeleteProgress.failed}
              </span>
            )}
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
