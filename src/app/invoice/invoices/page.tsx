"use client";

import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import {
  Space,
  Typography,
  Table,
  Dropdown,
  Button,
  Input,
  Form,
  Modal,
  DatePicker,
  Select,
  Tag,
  Badge,
  Tooltip,
  Alert,
  Popover,
  Drawer,
  Spin,
  App,
  Menu,
  Progress,
  Timeline,
  Skeleton,
} from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { RestOutlined } from "@ant-design/icons";
import {
  FileText,
  DollarSign,
  AlertCircle,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Mail,
  Download,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  TrendingUp,
  User,
  History,
  RotateCcw,
  CreditCard,
  Loader2,
  ChevronRight,
  RefreshCw,
  Paperclip,
  LayoutGrid,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";

import isBetween from "dayjs/plugin/isBetween";

import {
  useInvoices,
  useDeleteInvoice,
  useBulkDeleteInvoice,
  useDownloadInvoice,
  useUpdateInvoiceStatus,
  useSendInvoiceEmail,
  useInvoicePaymentHistory
} from "@/hooks/useInvoices";

import type {
  PaymentTransaction,
  PaymentHistoryData,
  PaymentStatus,
  PaymentMethod
} from "@/services/invoiceService";
import ComposeEmailDrawer from "@/components/customer/ComposeEmailDrawer";
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
const { RangePicker } = DatePicker;

dayjs.extend(isBetween);

type CustomerSnapshot = {
  id?: string;
  companyName?: string;
  name?: string;
  email?: string;
};

interface FailedInvoice {
  invoiceNumber: string;
  error: string;
}

type InvoiceStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';

const getAvailableTransitions = (currentStatus: InvoiceStatus): InvoiceStatus[] => {
  const transitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    'DRAFT': ['PENDING', 'SENT', 'CANCELLED'],
    'PENDING': ['APPROVED', 'SENT', 'CANCELLED'],
    'APPROVED': ['SENT', 'CANCELLED'],
    'SENT': ['PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'],
    'OVERDUE': ['PAID', 'PARTIALLY_PAID', 'CANCELLED'],
    'PARTIALLY_PAID': ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
    'PAID': [],
    'CANCELLED': []
  };

  return transitions[currentStatus] || [];
};

const toBackendStatus = (status: InvoiceStatus): string => {
  return status === 'APPROVED' ? 'APPROVAL' : status;
};

const fromBackendStatus = (status: string): InvoiceStatus => {
  if (status === 'APPROVAL') return 'APPROVED';
  return status as InvoiceStatus;
};

const getStatusIcon = (status: InvoiceStatus) => {
  const icons: Record<InvoiceStatus, React.ReactNode> = {
    'DRAFT': <Clock size={13} />,
    'PENDING': <Clock size={13} />,
    'APPROVED': <CheckCircle size={13} />,
    'SENT': <Mail size={13} />,
    'PAID': <CheckCircle size={13} style={{ color: '#10b981' }} />,
    'PARTIALLY_PAID': <DollarSign size={13} style={{ color: '#3b82f6' }} />,
    'OVERDUE': <AlertCircle size={13} style={{ color: '#f87171' }} />,
    'CANCELLED': <XCircle size={13} style={{ color: '#64748b' }} />
  };
  return icons[status] || <Clock size={13} />;
};

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

const INVOICE_STATUS_META: Record<
  InvoiceStatus,
  { label: string; color: string; bg: string; ring: string }
> = {
  'DRAFT': { label: 'Draft', color: '#64748b', bg: 'rgba(100,116,139,0.10)', ring: 'rgba(100,116,139,0.25)' },
  'PENDING': { label: 'Pending', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', ring: 'rgba(59,130,246,0.25)' },
  'APPROVED': { label: 'Approved', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', ring: 'rgba(59,130,246,0.25)' },
  'SENT': { label: 'Sent', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', ring: 'rgba(59,130,246,0.25)' },
  'PAID': { label: 'Paid', color: '#10b981', bg: 'rgba(16,185,129,0.10)', ring: 'rgba(16,185,129,0.25)' },
  'PARTIALLY_PAID': { label: 'Partially Paid', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', ring: 'rgba(59,130,246,0.25)' },
  'OVERDUE': { label: 'Overdue', color: '#f87171', bg: 'rgba(248,113,113,0.10)', ring: 'rgba(248,113,113,0.25)' },
  'CANCELLED': { label: 'Cancelled', color: '#64748b', bg: 'rgba(100,116,139,0.10)', ring: 'rgba(100,116,139,0.25)' },
};

export default function InvoiceInvoicesPage() {
  const router = useRouter();
  const { message: messageApi } = App.useApp();
  const {
    canReadInvoice,
    canCreateInvoice,
    canUpdateInvoice,
    canDeleteInvoice,
    canUpdateInvoiceStatus,
    canSendInvoiceMail,
    canReadInvoiceHistory,
    canDeleteInvoiceTrash
  } = usePermission();
  const { isLoading: authLoading } = useAuth();

  // Register UX context for activity logging
  useActivitySource({ section: "FINANCE", module: "Invoices", page: "InvoiceList" });

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");

  const { data, isLoading, isError, refetch } = useInvoices();
  const invoices = data?.data ?? [];
  const deleteMutation = useDeleteInvoice();
  const bulkDeleteMutation = useBulkDeleteInvoice();

  const { mutate: downloadInvoice, isPending: isDownloading, variables: downloadingId } = useDownloadInvoice();
  const { mutateAsync: downloadAsync } = useDownloadInvoice();

  // For Paid / Partial Paid
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusInvoice, setStatusInvoice] = useState<any>(null);
  const [statusForm] = Form.useForm();
  const updateStatusMutation = useUpdateInvoiceStatus();

  // For Approval
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalInvoice, setApprovalInvoice] = useState<any>(null);
  const [approvalForm] = Form.useForm();

  // For general status change
  const [statusChangeModalVisible, setStatusChangeModalVisible] = useState(false);
  const [statusChangeInvoice, setStatusChangeInvoice] = useState<any>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<InvoiceStatus | null>(null);

  const [transactionDrawerOpen, setTransactionDrawerOpen] = useState(false);
  const [transactionInvoice, setTransactionInvoice] = useState<any>(null);

  // For delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);

  // For payment proof drawer
  const [proofDrawerVisible, setProofDrawerVisible] = useState(false);
  const [selectedProofInvoice, setSelectedProofInvoice] = useState<any>(null);
  const [viewedProofFile, setViewedProofFile] = useState<string | null>(null);

  // For bulk delete state
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
    isDeleting: false
  });

  const {
    data: paymentHistory,
    isLoading: isPaymentLoading,
    refetch: refetchPaymentHistory,
  } = useInvoicePaymentHistory(
    transactionInvoice?.id,
    !!transactionDrawerOpen
  );

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [activeView, setActiveView] = useState<"all" | "draft" | "awaiting" | "paid" | "overdue">("all");
  const [customerFilter, setCustomerFilter] = useState<string | null>(null);
  const [previewInvoiceNumber, setPreviewInvoiceNumber] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, activeView, customerFilter, dateRange]);

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadInvoice && !canReadInvoiceHistory) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadInvoice, canReadInvoiceHistory, router]);

  // Email state
  const [emailDrawerOpen, setEmailDrawerOpen] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<any>(null);
  const { mutate: sendEmail, isPending: isSendingEmail } = useSendInvoiceEmail();

  const handleQuickSend = (record: any) => {
    const snapshot = record.customerSnapshot as any;
    const targetEmail = snapshot?.email || record.customer?.email;

    if (!targetEmail) {
      messageApi.error("No email found for this customer.");
      return;
    }

    const hide = messageApi.loading(`Sending invoice ${record.invoiceNumber}...`, 0);

    sendEmail({
      id: record.id,
      data: {
        to: targetEmail,
        subject: `Invoice ${record.invoiceNumber} from Your Company`,
        message: `Dear ${snapshot?.name || 'Customer'},\n\nPlease find your invoice ${record.invoiceNumber} attached.`
      }
    }, {
      onSettled: () => hide(),
      onSuccess: () => messageApi.success("Email sent successfully!")
    });
  };

  const openDeleteModal = (record: any) => {
    setInvoiceToDelete(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    try {
      setDeletingId(invoiceToDelete.id);
      await deleteMutation.mutateAsync(invoiceToDelete.id, {
        onSuccess: () => {
          messageApi.success(`Invoice ${invoiceToDelete.invoiceNumber} moved to trash successfully`);
          refetch();
          setDeleteModalVisible(false);
          setInvoiceToDelete(null);
          setDeletingId(null);
        },
        onError: (error: any) => {
          messageApi.error(error.message || 'Failed to move invoice to trash');
          setDeletingId(null);
        }
      });
    } catch (error) {
      console.error('Moving to trash failed:', error);
      setDeletingId(null);
    }
  };

  const openBulkDeleteModal = () => {
    if (selectedInvoices.length === 0) {
      messageApi.warning('Please select invoices to move to trash');
      return;
    }
    setBulkDeleteModalVisible(true);
  };

  const closeBulkDeleteModal = () => {
    setBulkDeleteModalVisible(false);
  };

  const startBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;

    setBulkDeleteModalVisible(false);

    const ids = selectedInvoices.map(inv => inv.id);

    setBulkDeleteProgress({
      visible: true,
      total: selectedInvoices.length,
      completed: 0,
      failed: 0,
      currentInvoice: 'Processing bulk request...',
      isDeleting: true
    });

    try {
      await bulkDeleteMutation.mutateAsync(ids);

      setBulkDeleteProgress(prev => ({
        ...prev,
        completed: selectedInvoices.length,
        currentInvoice: 'Finished'
      }));

      setSelectedRowKeys([]);
      setSelectedInvoices([]);
    } catch (error: any) {
      console.error(`Bulk trash failed:`, error);
      setBulkDeleteProgress(prev => ({
        ...prev,
        failed: selectedInvoices.length,
        isDeleting: false
      }));
    }

    setTimeout(() => {
      setBulkDeleteProgress({
        visible: false,
        total: 0,
        completed: 0,
        failed: 0,
        currentInvoice: null,
        isDeleting: false
      });
      setSelectedRowKeys([]);
      setSelectedInvoices([]);
    }, 1000);
  };

  const cancelBulkDelete = () => {
    setBulkDeleteProgress({
      visible: false,
      total: 0,
      completed: 0,
      failed: 0,
      currentInvoice: null,
      isDeleting: false
    });
  };

  const getMenuItems = (record: any): MenuProps["items"] => [
    {
      key: "view",
      icon: <Eye size={14} />,
      label: "View Details",
      onClick: () => {
        router.push(`/invoice/invoices/view/${record.invoiceNumber}`);
      },
    },
    canUpdateInvoice && ["DRAFT", "PENDING", "APPROVED", "APPROVAL"].includes(record.status) && {
      key: "edit",
      icon: <Edit2 size={14} />,
      label: "Edit Invoice",
      onClick: () => {
        router.push(`/invoice/newinvoice?edit=${record.id}`);
      },
    },
    {
      key: "download",
      icon: <Download size={14} />,
      label: record.id === downloadingId && isDownloading ? "Downloading..." : "Download PDF",
      disabled: isDownloading,
      onClick: () => {
        downloadInvoice(record.id);
      },
    },
    canSendInvoiceMail && !['DRAFT', 'PENDING'].includes(record.status) && {
      key: "send_quick",
      icon: <Mail size={14} />,
      label: "Quick Send Email",
      onClick: () => handleQuickSend(record),
    },
    canSendInvoiceMail && !['DRAFT', 'PENDING'].includes(record.status) && {
      key: "compose_email",
      icon: <Edit2 size={14} />,
      label: "Compose & Send",
      onClick: () => {
        setSelectedInvoiceForEmail(record);
        setEmailDrawerOpen(true);
      },
    },
    canReadInvoiceHistory && {
      key: "transactions",
      icon: <DollarSign size={14} />,
      label: "Transaction History",
      onClick: () => {
        setTransactionInvoice(record);
        setTransactionDrawerOpen(true);
      },
    },
    (canUpdateInvoice || canDeleteInvoice || canDeleteInvoiceTrash) && { type: "divider" },
    (canDeleteInvoice || canDeleteInvoiceTrash) && {
      key: "delete",
      icon: <Trash2 size={14} />,
      label: deletingId === record.id && deleteMutation.isPending ? "Moving to Trash..." : "Move to Trash",
      danger: true,
      disabled: deletingId === record.id && deleteMutation.isPending,
      onClick: () => {
        openDeleteModal(record);
      },
    },
  ].filter(Boolean) as MenuProps["items"];

  const handleStatusChange = (record: any) => {
    const frontendStatus = fromBackendStatus(record.status);
    const availableTransitions = getAvailableTransitions(frontendStatus);

    if (availableTransitions.length === 0) {
      messageApi.info(`Invoice ${record.invoiceNumber} is already in final status: ${frontendStatus}`);
      return;
    }

    setStatusChangeInvoice(record);
    setSelectedNewStatus(null);
    setStatusChangeModalVisible(true);
  };

  const handlePaymentUpdate = () => {
    statusForm.validateFields().then((values) => {
      const paidAmount = Number(values.paidAmount);
      const paymentMethod = values.paymentMethod || "BANK_TRANSFER";
      const currentBalance = Number(statusInvoice.balanceDue);

      let newStatus: InvoiceStatus = 'PARTIALLY_PAID';
      if (paidAmount >= currentBalance) {
        newStatus = 'PAID';
      }

      updateStatusMutation.mutate({
        id: statusInvoice.id,
        status: newStatus,
        payment: {
          amount: paidAmount,
          method: paymentMethod,
          description: values.description || "",
          date: values.paidAt ? values.paidAt.toISOString() : new Date().toISOString()
        }
      }, {
        onSuccess: () => {
          setStatusModalVisible(false);
          statusForm.resetFields();
          refetch();
          messageApi.success('Payment updated successfully');
        },
        onError: (error: any) => {
          messageApi.error(error.message || 'Failed to update payment');
        }
      });
    });
  };

  const handleApprovalUpdate = () => {
    approvalForm.validateFields().then((values) => {
      updateStatusMutation.mutate({
        id: approvalInvoice.id,
        status: 'APPROVED',
        description: values.note,
      }, {
        onSuccess: () => {
          setApprovalModalVisible(false);
          approvalForm.resetFields();
          refetch();
          messageApi.success('Invoice approved successfully');
        },
        onError: (error: any) => {
          messageApi.error(error.message || 'Failed to approve invoice');
        }
      });
    });
  };

  const handleGeneralStatusUpdate = () => {
    if (selectedNewStatus) {
      if (selectedNewStatus === 'PAID' || selectedNewStatus === 'PARTIALLY_PAID') {
        setStatusInvoice(statusChangeInvoice);
        statusForm.setFieldsValue({
          paidAmount: statusChangeInvoice.balanceDue,
          description: statusChangeInvoice.description || "",
          paidAt: dayjs(),
          paymentMethod: "BANK_TRANSFER"
        });
        setStatusModalVisible(true);
        setStatusChangeModalVisible(false);
      } else if (selectedNewStatus === 'APPROVED') {
        setApprovalInvoice(statusChangeInvoice);
        approvalForm.setFieldsValue({
          note: statusChangeInvoice.description || ""
        });
        setApprovalModalVisible(true);
        setStatusChangeModalVisible(false);
      } else {
        updateStatusMutation.mutate({
          id: statusChangeInvoice.id,
          status: selectedNewStatus,
        }, {
          onSuccess: () => {
            setStatusChangeModalVisible(false);
            refetch();
            messageApi.success('Status updated successfully');
          },
          onError: (error: any) => {
            messageApi.error(error.message || 'Failed to update status');
          }
        });
      }
    }
  };

  /* ================= SEARCH AND FILTER ================= */
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const frontendStatus = fromBackendStatus(inv.status);

      // Sidebar view filter
      if (activeView === "draft" && frontendStatus !== "DRAFT") return false;
      if (activeView === "paid" && frontendStatus !== "PAID") return false;
      if (activeView === "overdue" && frontendStatus !== "OVERDUE") return false;
      if (activeView === "awaiting") {
        if (!["PENDING", "APPROVED", "SENT", "PARTIALLY_PAID"].includes(frontendStatus)) {
          return false;
        }
      }

      const snapshot = inv.customerSnapshot as any;
      const search = searchText?.toLowerCase().trim();

      // SEARCH
      const matchSearch =
        !search ||
        inv.invoiceNumber?.toLowerCase().includes(search) ||
        snapshot?.companyName?.toLowerCase().includes(search) ||
        snapshot?.name?.toLowerCase().includes(search) ||
        snapshot?.email?.toLowerCase().includes(search);

      if (!matchSearch) return false;

      // CUSTOMER FILTER
      if (customerFilter) {
        const id = snapshot?.id || inv.customer?.id;
        if (id !== customerFilter) return false;
      }

      // DATE RANGE
      if (dateRange?.[0] && dateRange?.[1]) {
        const invoiceDate = dayjs(inv.invoiceDate);
        if (
          !invoiceDate.isBetween(
            dayjs(dateRange[0]).startOf("day"),
            dayjs(dateRange[1]).endOf("day"),
            undefined,
            "[]"
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, activeView, searchText, customerFilter, dateRange]);

  const total = filteredInvoices.length;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedInvoices = useMemo(() => {
    return filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  const viewCounts = useMemo(() => {
    let drafts = 0;
    let awaiting = 0;
    let paid = 0;
    let overdue = 0;

    invoices.forEach((inv) => {
      const status = fromBackendStatus(inv.status);
      if (status === "DRAFT") drafts++;
      else if (status === "PAID") paid++;
      else if (status === "OVERDUE") overdue++;

      if (["PENDING", "APPROVED", "SENT", "PARTIALLY_PAID"].includes(status)) {
        awaiting++;
      }
    });

    return {
      all: invoices.length,
      draft: drafts,
      awaiting: awaiting,
      paid: paid,
      overdue: overdue,
    };
  }, [invoices]);

  const customerOptions = useMemo(() => {
    const map = new Map<string, string>();
    invoices.forEach((inv) => {
      const snapshot = inv.customerSnapshot as CustomerSnapshot | null;
      const companyName = snapshot?.companyName || inv.customer?.companyName;
      const id = snapshot?.id || inv.customer?.id;
      if (id && companyName) {
        map.set(id, companyName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [invoices]);

  const totalRevenue = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + Number(inv.grandTotal || (inv as any).total || 0), 0);
  }, [invoices]);

  const paidCount = invoices.filter(
    (i) => fromBackendStatus(i.status) === "PAID"
  ).length;

  const pendingCount = invoices.filter(
    (i) => ["PENDING", "APPROVED", "SENT", "PARTIALLY_PAID"].includes(fromBackendStatus(i.status))
  ).length;

  const customerCount = useMemo(() => {
    return new Set(
      invoices.map((i) => {
        const snapshot = i.customerSnapshot as CustomerSnapshot | null;
        return snapshot?.id || i.customer?.id;
      })
    ).size;
  }, [invoices]);

  /* ================= TABLE COLUMNS ================= */
  const columns: ColumnsType<any> = [
    {
      title: "INVOICE NO",
      dataIndex: "invoiceNumber",
      key: "invoice_number",
      width: 130,
      render: (text) => (
        <Tooltip title="Click to preview invoice">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (text) setPreviewInvoiceNumber(text);
            }}
            className="font-semibold transition-colors hover:underline"
            style={{
              color: "#3b82f6",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12.5,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {text}
          </button>
        </Tooltip>
      ),
    },
    {
      title: "CUSTOMER",
      key: "customer",
      width: 200,
      render: (_, record) => {
        const snapshot = record.customerSnapshot as any;
        const companyName = snapshot?.companyName || record.customer?.companyName || "Unknown";
        return (
          <div className="flex items-center gap-2.5 truncate">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--bg-blue-50)', color: '#3b82f6', width: 30, height: 30 }}>
              {companyName.charAt(0)}
            </div>
            <div className="truncate" style={{ lineHeight: 1.25 }}>
              <div className="font-bold truncate" style={{ color: 'var(--text-slate-900)', fontSize: 12.5 }}>
                {companyName}
              </div>
              <div className="text-[10px] truncate" style={{ color: 'var(--text-slate-400)' }}>
                {snapshot?.email || record.customer?.email || ""}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "DATE",
      dataIndex: "invoiceDate",
      width: 110,
      render: (date: string) => (
        <div style={{ color: 'var(--text-slate-500)', fontSize: 11.5 }}>
          {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: "DUE DATE",
      dataIndex: "dueDate",
      width: 110,
      render: (date: string) => {
        const isOverdue = date && dayjs(date).isBefore(dayjs(), 'day');
        return (
          <div className={isOverdue ? "text-red-400 font-medium" : ""} style={{ color: isOverdue ? '#f87171' : 'var(--text-slate-500)', fontSize: 11.5 }}>
            {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
          </div>
        );
      },
    },
    {
      title: "AMOUNT",
      dataIndex: "grandTotal",
      width: 110,
      render: (v, record) => (
        <div className="font-bold" style={{ color: 'var(--text-slate-900)', fontSize: 12.5 }}>
          ${Number(v || record.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      title: "CLIENT STATUS",
      dataIndex: "clientStatus",
      width: 130,
      render: (status: string) => {
        if (!status || status === "UNPAID") {
          return <span style={{ padding: "3.5px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.20)", textTransform: "uppercase", whiteSpace: "nowrap" }}>UNPAID</span>;
        }
        if (status === "PARTIALLY_PAID") {
          return <span style={{ padding: "3.5px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, color: "#3b82f6", background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.20)", textTransform: "uppercase", whiteSpace: "nowrap" }}>PARTIALLY PAID</span>;
        }
        if (status === "PAID") {
          return <span style={{ padding: "3.5px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)", textTransform: "uppercase", whiteSpace: "nowrap" }}>PAID</span>;
        }
        return <span style={{ color: "var(--text-slate-400)", fontSize: 11.5 }}>{status}</span>;
      },
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 170,
      render: (status: string, record: any) => {
        const frontendStatus = fromBackendStatus(status);
        const hasUnverifiedProofs = record.paymentProofs && record.paymentProofs.length > 0 && frontendStatus !== 'PAID';
        const meta = INVOICE_STATUS_META[frontendStatus] || INVOICE_STATUS_META.DRAFT;
        return (
          <div
            className={canUpdateInvoiceStatus ? "cursor-pointer flex items-center gap-2" : "flex items-center gap-2"}
            onClick={(e) => {
              if (canUpdateInvoiceStatus) {
                e.stopPropagation();
                e.preventDefault();
                handleStatusChange(record);
              }
            }}
          >
            <Tooltip title={canUpdateInvoiceStatus ? "Click to change status" : ""}>
              <Badge
                count={
                  <span
                    className={canUpdateInvoiceStatus ? "hover:opacity-80 transition-opacity m-0" : "m-0"}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 700,
                      lineHeight: "1",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      border: `1px solid ${meta.ring}`,
                      color: meta.color,
                      background: meta.bg,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      {getStatusIcon(frontendStatus)}
                      <span>{meta.label}</span>
                    </div>
                  </span>
                }
              />
            </Tooltip>
            {hasUnverifiedProofs && (
              <Tooltip title="View Payment Proofs">
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "rgba(59,130,246,0.12)", color: "#3B82F6", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedProofInvoice(record);
                    setViewedProofFile(record.paymentProofs?.[0]?.file || null);
                    setProofDrawerVisible(true);
                  }}
                >
                  <Paperclip size={12} />
                </div>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "BALANCE DUE",
      dataIndex: "balanceDue",
      width: 110,
      render: (v) => {
        const balance = Number(v || 0);
        return (
          <div className={balance === 0 ? "text-green-600 font-medium" : "font-semibold"} style={{ color: balance === 0 ? '#10b981' : 'var(--text-slate-900)', fontSize: 12.5 }}>
            ${balance.toFixed(2)}
          </div>
        );
      },
    },
    {
      title: "ACTIONS",
      align: "center",
      width: 72,
      fixed: "right" as const,
      render: (_, record) => {
        const menuItems = getMenuItems(record);
        if (!menuItems || menuItems.length === 0) return null;

        const menu = (
          <Menu items={menuItems} />
        );

        return (
          <Dropdown
            overlay={menu}
            trigger={['click']}
            placement="bottomRight"
            onOpenChange={(open) => {
              if (!open) {
                setDeletingId(null);
              }
            }}
          >
            <Button
              type="text"
              icon={<MoreVertical size={16} style={{ color: 'var(--text-slate-400)' }} />}
              className="hover:bg-gray-100"
              style={{ width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            />
          </Dropdown>
        );
      },
    },
  ];

  /* ================= ROW SELECTION ================= */
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[], rows: any[]) => {
      setSelectedRowKeys(keys);
      setSelectedInvoices(rows);
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.status === 'CANCELLED',
    }),
  };

  /* ================= BULK DOWNLOAD ================= */
  const handleBulkDownload = async () => {
    for (const inv of selectedInvoices) {
      try {
        await downloadAsync(inv.id);
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        console.error("Bulk download failed for:", inv.id);
        messageApi.error(`Failed to download invoice ${inv.invoiceNumber}`);
      }
    }
  };

  if (authLoading) return <MainLayout><div style={{ padding: 100, textAlign: 'center' }}><Spin tip="Loading"><div style={{ padding: 20 }} /></Spin></div></MainLayout>;
  if (!canReadInvoice && !canReadInvoiceHistory) return null;

  return (
    <MainLayout>
      <div className="pp-shell">
        {/* ============================ SIDEBAR ============================ */}
        <aside className="pp-sidebar">
          <div className="pp-side-head">
            <div className="pp-side-logo"><FileText size={20} /></div>
            <div className="pp-side-head-text">
              <div className="pp-side-title">Invoices</div>
              <div className="pp-side-subtitle">Billing · Payments</div>
            </div>
          </div>

          {canCreateInvoice && (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              className="pp-create-btn"
              onClick={() => router.push("/invoice/newinvoice")}
              block
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              New Invoice
            </Button>
          )}

          <div className="pp-side-scroll">
            <div className="pp-side-section-label">Views</div>
            <div className="pp-side-list">
              <button
                type="button"
                className={`pp-view-item ${activeView === "all" ? "is-active" : ""}`}
                onClick={() => setActiveView("all")}
              >
                <span className="pp-view-icon" style={{ color: activeView === "all" ? "#3b82f6" : "var(--text-slate-400)" }}><FileText size={14} /></span>
                <span className="pp-view-label">All invoices</span>
                <span className="pp-view-count">{viewCounts.all}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${activeView === "draft" ? "is-active" : ""}`}
                onClick={() => setActiveView("draft")}
              >
                <span className="pp-view-icon" style={{ color: activeView === "draft" ? "#64748b" : "var(--text-slate-400)" }}><Clock size={14} /></span>
                <span className="pp-view-label">Drafts</span>
                <span className="pp-view-count">{viewCounts.draft}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${activeView === "awaiting" ? "is-active" : ""}`}
                onClick={() => setActiveView("awaiting")}
              >
                <span className="pp-view-icon" style={{ color: activeView === "awaiting" ? "#3b82f6" : "var(--text-slate-400)" }}><Clock size={14} /></span>
                <span className="pp-view-label">Awaiting Payment</span>
                <span className="pp-view-count">{viewCounts.awaiting}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${activeView === "paid" ? "is-active" : ""}`}
                onClick={() => setActiveView("paid")}
              >
                <span className="pp-view-icon" style={{ color: activeView === "paid" ? "#10b981" : "var(--text-slate-400)" }}><CheckCircle size={14} /></span>
                <span className="pp-view-label">Paid</span>
                <span className="pp-view-count">{viewCounts.paid}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${activeView === "overdue" ? "is-active" : ""}`}
                onClick={() => setActiveView("overdue")}
              >
                <span className="pp-view-icon" style={{ color: activeView === "overdue" ? "#f87171" : "var(--text-slate-400)" }}><AlertCircle size={14} /></span>
                <span className="pp-view-label">Overdue</span>
                <span className="pp-view-count">{viewCounts.overdue}</span>
              </button>
            </div>

            <div className="pp-side-section-label">Filters</div>
            <div className="pp-side-filters" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Select
                showSearch
                optionFilterProp="label"
                className="pp-side-select"
                placeholder="Select Customer"
                value={customerFilter}
                onChange={(v) => setCustomerFilter(v || null)}
                allowClear
                options={customerOptions}
                style={{ width: "100%" }}
              />
              <RangePicker
                className="pp-side-range"
                value={dateRange as any}
                onChange={(d) => setDateRange(d as any)}
                placeholder={['Start date', 'End date']}
                separator={<span style={{ color: 'var(--text-slate-400)' }}>›</span>}
                suffixIcon={null}
                format="MMM D"
                style={{ width: "100%", height: "36px" }}
              />
              {(customerFilter || (dateRange && (dateRange[0] || dateRange[1]))) && (
                <button
                  type="button"
                  className="pp-clear-filters"
                  onClick={() => {
                    setCustomerFilter(null);
                    setDateRange(null);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", padding: "3px", fontSize: "12px", fontWeight: "600", color: "#f87171" }}
                >
                  <XCircle size={12} /> Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="pp-side-bottom-actions">
            <button
              type="button"
              className="pp-view-item"
              onClick={() => router.push("/invoice/dashboard")}
              style={{ padding: "7px 10px", borderRadius: "8px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", width: "100%", marginBottom: "4px" }}
            >
              <span className="pp-view-icon" style={{ color: "#3b82f6" }}><ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /></span>
              <span className="pp-view-label">Dashboard</span>
            </button>
            <button
              type="button"
              className="pp-trash"
              onClick={() => router.push("/invoice/trash")}
            >
              <RestOutlined /> Trash
            </button>
          </div>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="pp-main">
          {/* Top search & views bar */}
          <div className="pp-topbar">
            <div className="pp-search-wrap">
              <Search className="pp-search-icon" size={14} />
              <input
                className="pp-search"
                placeholder="Search invoices, clients, creators…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <Tooltip title="Refresh">
              <button type="button" className="pp-ghost-btn" onClick={() => refetch()}><RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /></button>
            </Tooltip>

            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{filteredInvoices.length}</strong> invoices</span>
            </div>

            <div className="pp-topbar-actions">
              <div className="pp-segmented">
                <button
                  type="button"
                  className={viewMode === "card" ? "is-active" : ""}
                  onClick={() => setViewMode("card")}
                  aria-label="Card view"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  className={viewMode === "table" ? "is-active" : ""}
                  onClick={() => setViewMode("table")}
                  aria-label="Table view"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="pp-divider" />

          {/* Main View Area */}
          <div className="pp-body">
            {/* Stat Cards */}
            <div className="pp-stats">
              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
                      <TrendingUp size={14} />
                    </span>
                    <span className="pp-stat-label">Total Revenue</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <span className="pp-stat-period">All-time billed</span>
                </div>
              </div>

              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                      <CheckCircle size={14} />
                    </span>
                    <span className="pp-stat-label">Paid Invoices</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{paidCount}</span>
                  </div>
                  <span className="pp-stat-period">Settled invoices</span>
                </div>
              </div>

              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: "rgba(100,116,139,0.1)", color: "#64748b" }}>
                      <Clock size={14} />
                    </span>
                    <span className="pp-stat-label">Awaiting Payment</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{pendingCount}</span>
                  </div>
                  <span className="pp-stat-period">Pending or sent</span>
                </div>
              </div>

              <div className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
                      <User size={14} />
                    </span>
                    <span className="pp-stat-label">Total Customers</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{customerCount}</span>
                  </div>
                  <span className="pp-stat-period">Unique clients</span>
                </div>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedRowKeys.length > 0 && (
              <div
                className="rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between"
                style={{
                  background: "var(--bg-blue-50)",
                  border: "1px solid var(--border-blue-200)",
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    size={14}
                    style={{ color: "var(--text-blue-700)" }}
                  />
                  <span
                    className="text-[12.5px] font-semibold"
                    style={{ color: "var(--text-blue-700)" }}
                  >
                    {selectedRowKeys.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    icon={<Download size={13} />}
                    loading={isDownloading}
                    onClick={handleBulkDownload}
                    style={{ borderRadius: 8, height: 32, fontWeight: 600 }}
                  >
                    Download
                  </Button>
                  {(canDeleteInvoice || canDeleteInvoiceTrash) && (
                    <Button
                      size="small"
                      danger
                      type="primary"
                      icon={<Trash2 size={13} />}
                      onClick={openBulkDeleteModal}
                      loading={bulkDeleteProgress.isDeleting}
                      style={{ borderRadius: 8, height: 32, fontWeight: 600 }}
                    >
                      Move to trash
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRowKeys([]);
                      setSelectedInvoices([]);
                    }}
                    className="p-1.5 rounded-md transition-colors hover:bg-white"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              </div>
            )}

            {isLoading ? (
              viewMode === "card" ? (
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
              ) : (
                <div className="pp-table-wrap">
                  <Table
                    size="small"
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={[]}
                    loading={true}
                    pagination={false}
                    scroll={{ x: 1100 }}
                    className="pp-table"
                  />
                </div>
              )
            ) : filteredInvoices.length === 0 ? (
              <div className="pp-empty">
                <div className="pp-empty-orb"><FileText size={26} /></div>
                <div className="pp-empty-title">No invoices found</div>
                <div className="pp-empty-sub">
                  {searchText || customerFilter || dateRange
                    ? "Try adjusting your search or filters."
                    : "Get started by creating your first invoice."}
                </div>
                {!searchText && !customerFilter && !dateRange && canCreateInvoice && (
                  <Button
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={() => router.push("/invoice/newinvoice")}
                    className="pp-btn-primary"
                    style={{ marginTop: 14 }}
                  >
                    New Invoice
                  </Button>
                )}
              </div>
            ) : viewMode === "card" ? (
              <div className="pp-grid">
                {pagedInvoices.map((record) => {
                  const snapshot = record.customerSnapshot as any;
                  const companyName = snapshot?.companyName || record.customer?.companyName || "Unknown";
                  const accent = accentFor(companyName);
                  const statusCfg = INVOICE_STATUS_META[fromBackendStatus(record.status)];

                  return (
                    <div
                      key={record.id}
                      className="pc-card"
                      onClick={() => setPreviewInvoiceNumber(record.invoiceNumber)}
                    >
                      <div className="pc-top">
                        <div
                          className="pc-avatar"
                          style={{
                            background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)`,
                          }}
                        >
                          {initialsOf(companyName)}
                        </div>
                        <div className="pc-identity-body">
                          <div className="pc-title">
                            {record.invoiceNumber}
                          </div>
                          <div className="pc-client-line">
                            <span className="pc-client-key">Company:</span>
                            <span className="pc-client-val">{companyName}</span>
                          </div>
                        </div>
                        <Dropdown
                          overlay={<Menu items={getMenuItems(record)} />}
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
                            <span className="pc-foot-key">Billed:</span>
                            <span className="pc-foot-val">
                              {record.invoiceDate ? dayjs(record.invoiceDate).format("MMM DD, YYYY") : "—"}
                            </span>
                          </span>
                          <span className="pc-foot-div" />
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Amount:</span>
                            <span className="pc-foot-val" style={{ fontWeight: 700 }}>
                              ${Number(record.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </span>
                        </div>
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Status:</span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: statusCfg.color,
                              }}
                            >
                              {statusCfg.label.toUpperCase()}
                            </span>
                          </span>
                          <span className="pc-foot-div" />
                          <button
                            type="button"
                            className="pc-foot-item pc-view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/invoice/invoices/view/${record.invoiceNumber}`);
                            }}
                          >
                            View
                          </button>
                          <span className="pc-foot-div" />
                          <button
                            type="button"
                            className="pc-foot-item pc-view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadInvoice(record.id);
                            }}
                          >
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pp-table-wrap">
                <Table
                  size="small"
                  rowSelection={rowSelection}
                  columns={columns}
                  dataSource={pagedInvoices.map((inv) => ({
                    ...inv,
                    key: inv.id,
                  }))}
                  pagination={false}
                  scroll={{ x: 1100 }}
                  className="pp-table"
                  onRow={(record) => ({
                    onClick: (e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest('button, input, .ant-select, .ant-dropdown, .ant-popover, .ant-popconfirm, .ant-modal, .ant-menu')) return;
                      setPreviewInvoiceNumber(record.invoiceNumber);
                    },
                    className: 'pp-row',
                  })}
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
                <button type="button" className="pp-pager-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((p) => (
                  <button key={p} type="button" className={`pp-pager-num ${p === currentPage ? 'is-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
                <button type="button" className="pp-pager-btn" disabled={currentPage >= pageCount} onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}>›</button>
                <Select
                  className="pp-pagesize"
                  value={pageSize}
                  onChange={(v) => { setPageSize(v); setCurrentPage(1); }}
                  options={[5, 10, 15, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bulk Trash Confirmation Modal */}
      <Modal
        title="Move Selected Invoices to Trash"
        open={bulkDeleteModalVisible}
        onCancel={closeBulkDeleteModal}
        onOk={startBulkDelete}
        okText={`Move to Trash (${selectedInvoices.length})`}
        okType="danger"
        cancelText="Cancel"
        width={500}
      >
        <div className="py-4">
          <div className="flex items-center mb-3">
            <AlertCircle size={20} className="text-yellow-500 mr-2" />
            <Text strong>Are you sure you want to move {selectedInvoices.length} selected invoice(s) to trash?</Text>
          </div>

          <div className="mb-4 max-h-60 overflow-y-auto rounded p-2" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
            <ul className="list-disc pl-4">
              {selectedInvoices.slice(0, 10).map((inv, index) => (
                <li key={inv.id} className="text-sm mb-1">
                  <Text strong>{inv.invoiceNumber}</Text>
                  <Text type="secondary" className="ml-2">
                    - ${Number(inv.grandTotal || inv.total || 0).toFixed(2)}
                    {inv.customerSnapshot && ` - ${(inv.customerSnapshot as any)?.companyName}`}
                  </Text>
                </li>
              ))}
              {selectedInvoices.length > 10 && (
                <li className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  ...and {selectedInvoices.length - 10} more
                </li>
              )}
            </ul>
          </div>

          <Alert
            message="Note: Invoices will be moved to Trash"
            description="You can restore these invoices later from the Trash folder if needed."
            type="warning"
            showIcon
          />
        </div>
      </Modal>

      {/* Bulk Trash Progress Modal */}
      <Modal
        title="Moving Invoices to Trash..."
        open={bulkDeleteProgress.visible}
        closable={false}
        maskClosable={false}
        footer={null}
        width={400}
      >
        <div className="py-4">
          <div className="flex justify-between mb-2">
            <Text>Progress:</Text>
            <Text strong>
              {bulkDeleteProgress.completed}/{bulkDeleteProgress.total}
            </Text>
          </div>

          <div className="mb-4">
            <Progress
              percent={Math.round((bulkDeleteProgress.completed / bulkDeleteProgress.total) * 100)}
              status={bulkDeleteProgress.failed > 0 ? "exception" : "active"}
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Success: {bulkDeleteProgress.completed - bulkDeleteProgress.failed}</span>
              <span>Failed: {bulkDeleteProgress.failed}</span>
            </div>
          </div>

          {bulkDeleteProgress.currentInvoice && (
            <div className="text-center mb-4">
              <Loader2 className="text-blue-500 mr-2 animate-spin" size={16} />
              <Text type="secondary">
                Moving invoice: <Text strong>{bulkDeleteProgress.currentInvoice}</Text>
              </Text>
            </div>
          )}

          {!bulkDeleteProgress.isDeleting && (
            <div className="text-center">
              <Text type="success" strong>
                {bulkDeleteProgress.failed === 0 ? 'All invoices moved to trash successfully!' : 'Process completed!'}
              </Text>
              <div className="mt-3">
                <Button type="primary" onClick={cancelBulkDelete} block>
                  OK
                </Button>
              </div>
            </div>
          )}

          {bulkDeleteProgress.isDeleting && (
            <div className="text-center">
              <Text type="secondary" className="text-sm">
                Please wait while invoices are being moved to trash...
              </Text>
            </div>
          )}
        </div>
      </Modal>

      {/* Single Trash Confirmation Modal */}
      <Modal
        title="Move to Trash"
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setInvoiceToDelete(null);
        }}
        onOk={handleDeleteInvoice}
        confirmLoading={deletingId === invoiceToDelete?.id}
        okText="Move to Trash"
        okType="danger"
        cancelText="Cancel"
        width={500}
      >
        {invoiceToDelete && (
          <div className="py-4">
            <div className="flex items-center mb-3">
              <AlertCircle size={20} className="text-yellow-500 mr-2" />
              <Text strong>Are you sure you want to move this invoice to trash?</Text>
            </div>
            <div className="mb-4 p-3 rounded" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Text type="secondary" className="block text-sm">Invoice Number</Text>
                  <Text strong className="text-lg">{invoiceToDelete.invoiceNumber}</Text>
                </div>
                <div>
                  <Text type="secondary" className="block text-sm">Amount</Text>
                  <Text strong className="text-lg">${Number(invoiceToDelete.grandTotal || invoiceToDelete.total || 0).toFixed(2)}</Text>
                </div>
                <div className="col-span-2">
                  <Text type="secondary" className="block text-sm">Customer</Text>
                  <Text strong>
                    {(invoiceToDelete.customerSnapshot as any)?.companyName || invoiceToDelete.customer?.companyName || "Unknown"}
                  </Text>
                </div>
              </div>
            </div>
            <Alert
              message="Note: Invoice will be moved to Trash"
              description="You can restore this invoice later from the Trash folder if needed."
              type="warning"
              showIcon
            />
          </div>
        )}
      </Modal>

      {/* Payment Status Modal */}
      <Modal
        title={null}
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          statusForm.resetFields();
        }}
        footer={null}
        width={500}
        styles={{
          mask: { backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.4)' },
          content: { padding: 0, borderRadius: 24, overflow: 'hidden', backgroundColor: 'var(--customers-card-bg)' }
        }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-slate-50)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--accounts-emerald-bg)', color: 'var(--accounts-emerald-text)', borderColor: 'var(--accounts-emerald-bg)' }}>
              <CreditCard size={20} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 16 }}>Record Payment</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Invoice #{statusInvoice?.invoiceNumber}</Text>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--border-color)' }}>
              <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Total</Text>
              <Text strong className="text-sm">
                ${Number(statusInvoice?.grandTotal || statusInvoice?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </div>
            <div className="p-3 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)' }}>
              <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Paid</Text>
              <Text strong className="text-sm" style={{ color: 'var(--accounts-emerald-text)' }}>
                ${Number(statusInvoice?.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </div>
            <div className="p-3 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--bg-blue-50)', borderColor: 'var(--border-color)' }}>
              <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider block mb-1">Due</Text>
              <Text strong className="text-sm" style={{ color: 'var(--text-sky-500)' }}>
                ${Number(statusInvoice?.balanceDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </div>
          </div>

          <Form form={statusForm} layout="vertical" onFinish={handlePaymentUpdate} requiredMark={false}>
            <Form.Item
              label={<span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Payment Amount (USD)</span>}
              name="paidAmount"
              rules={[
                { required: true, message: "Please enter amount" },
                {
                  validator: (_, value) => {
                    const balanceDue = Number(statusInvoice?.balanceDue || 0);
                    const paidAmount = Number(value || 0);
                    if (paidAmount > balanceDue) {
                      return Promise.reject(new Error(`Amount exceeds balance ($${balanceDue.toFixed(2)})`));
                    }
                    if (paidAmount <= 0) {
                      return Promise.reject(new Error('Amount must be positive'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                type="number"
                min={0}
                max={statusInvoice?.balanceDue}
                placeholder="0.00"
                prefix={<span className="text-slate-400">$</span>}
                className="h-12 rounded-xl text-lg font-bold"
                step="0.01"
                style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label={<span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Method</span>}
                name="paymentMethod"
                initialValue="BANK_TRANSFER"
              >
                <Select className="h-11 rounded-xl" popupClassName="rounded-xl">
                  <Select.Option value="BANK_TRANSFER">Bank Transfer</Select.Option>
                  <Select.Option value="CREDIT_CARD">Credit Card</Select.Option>
                  <Select.Option value="CASH">Cash</Select.Option>
                  <Select.Option value="CHECK">Check</Select.Option>
                  <Select.Option value="OTHER">Other</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label={<span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Date</span>}
                name="paidAt"
                initialValue={dayjs()}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  className="h-11 w-full rounded-xl"
                  popupClassName="rounded-xl"
                />
              </Form.Item>
            </div>

            <Form.Item
              label={<span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Note</span>}
              name="description"
            >
              <Input.TextArea
                rows={2}
                placeholder="Reference number or memo..."
                className="rounded-xl p-3"
                maxLength={200}
                style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </Form.Item>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={() => setStatusModalVisible(false)}
                className="h-11 flex-1 rounded-xl font-semibold"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateStatusMutation.isPending}
                className="h-11 flex-1 rounded-xl font-semibold border-none"
                style={{ backgroundColor: 'var(--customers-header-icon-color)' }}
              >
                Update Payment
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Approval Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <CheckCircle size={20} className="text-green-500 mr-2" style={{ color: "#10b981" }} />
            Approve Invoice {approvalInvoice?.invoiceNumber}
          </div>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          approvalForm.resetFields();
        }}
        onOk={handleApprovalUpdate}
        confirmLoading={updateStatusMutation.isPending}
        okText="Approve Invoice"
        cancelText="Cancel"
        width={400}
      >
        <Form form={approvalForm} layout="vertical">
          <Form.Item label="Approval Note (optional)" name="note">
            <Input.TextArea
              rows={4}
              placeholder="Enter note for approval"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        title={null}
        open={statusChangeModalVisible}
        onCancel={() => {
          setStatusChangeModalVisible(false);
          setSelectedNewStatus(null);
        }}
        footer={null}
        width={450}
        styles={{
          mask: { backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.4)' },
          content: { padding: 0, borderRadius: 24, overflow: 'hidden', backgroundColor: 'var(--customers-card-bg)' }
        }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-slate-50)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-blue-50)', color: 'var(--text-sky-500)', borderColor: 'var(--bg-blue-50)' }}>
              <RefreshCw size={20} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 16 }}>Update Status</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Invoice #{statusChangeInvoice?.invoiceNumber}</Text>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-2xl p-4 mb-6 border flex items-center justify-between" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)' }}>
            <div className="text-center flex-1 min-w-0">
              <Text type="secondary" className="text-[10px] font-bold uppercase tracking-wider block mb-2">Current Status</Text>
              <div className="flex justify-center">
                <Tag
                  color={getStatusColor(fromBackendStatus(statusChangeInvoice?.status))}
                  className="px-3 py-1.5 rounded-full border-none font-bold text-[11px] m-0 shadow-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {getStatusIcon(fromBackendStatus(statusChangeInvoice?.status))}
                  <span>{fromBackendStatus(statusChangeInvoice?.status)}</span>
                </Tag>
              </div>
            </div>

            <div className="px-4" style={{ color: 'var(--text-slate-400)' }}>
              <ChevronRight size={20} />
            </div>

            <div className="text-center flex-1 min-w-0">
              <Text type="secondary" className="text-[10px] font-bold uppercase tracking-wider block mb-2">Target Status</Text>
              <div className="flex justify-center">
                {selectedNewStatus ? (
                  <Tag
                    color={getStatusColor(selectedNewStatus)}
                    className="px-3 py-1.5 rounded-full border-none font-bold text-[11px] m-0 shadow-sm animate-pulse"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {getStatusIcon(selectedNewStatus)}
                    <span>{selectedNewStatus}</span>
                  </Tag>
                ) : (
                  <div className="h-6 w-20 rounded-full mx-auto animate-pulse" style={{ backgroundColor: 'var(--border-color)' }}></div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Select Next Step</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Where should this invoice go next?"
                size="large"
                value={selectedNewStatus}
                onChange={(value) => setSelectedNewStatus(value)}
                popupClassName="rounded-xl"
                className="rounded-xl border-slate-200"
                options={getAvailableTransitions(fromBackendStatus(statusChangeInvoice?.status)).map(status => ({
                  label: (
                    <div className="flex items-center gap-2 py-1">
                      <div className="p-1 rounded-md" style={{ backgroundColor: 'var(--bg-blue-50)', color: 'var(--text-sky-500)' }}>
                        {getStatusIcon(status)}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{status}</span>
                    </div>
                  ),
                  value: status
                }))}
              />
            </div>

            {(selectedNewStatus === 'PAID' || selectedNewStatus === 'PARTIALLY_PAID') && (
              <div className="p-4 rounded-2xl border flex gap-3" style={{ backgroundColor: 'rgba(250, 173, 20, 0.1)', borderColor: '#faad14' }}>
                <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#d48806' }} />
                <div className="text-xs leading-relaxed" style={{ color: '#d48806' }}>
                  <Text strong className="block mb-1" style={{ color: '#ad6800' }}>Payment Required</Text>
                  Moving to <Text strong style={{ color: '#ad6800' }}>{selectedNewStatus}</Text> will open the payment record form to log the transaction.
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <Button
              onClick={() => {
                setStatusChangeModalVisible(false);
                setSelectedNewStatus(null);
              }}
              className="h-11 flex-1 rounded-xl font-semibold"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleGeneralStatusUpdate}
              loading={updateStatusMutation.isPending}
              disabled={!selectedNewStatus}
              className="h-11 flex-1 rounded-xl font-semibold border-none"
              style={{ backgroundColor: 'var(--customers-header-icon-color)' }}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transaction History Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg" style={{ backgroundColor: 'var(--customers-header-icon-color)' }}>
              <DollarSign size={16} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Payment Transaction History</div>
              <div className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-slate-500)' }}>
                <span>Invoice #{paymentHistory?.summary?.invoiceNumber || transactionInvoice?.invoiceNumber}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <Badge
                  status="processing"
                  text={paymentHistory?.payments?.length ? `${paymentHistory.payments.length} transactions` : 'No transactions'}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        }
        open={transactionDrawerOpen}
        onClose={() => {
          setTransactionDrawerOpen(false);
          setTransactionInvoice(null);
        }}
        width={900}
        destroyOnClose
      >
        {isPaymentLoading ? (
          <div className="flex flex-col justify-center items-center h-56">
            <Spin size="default" />
            <span className="mt-3 text-xs" style={{ color: 'var(--text-slate-500)' }}>Loading payment history...</span>
          </div>
        ) : !paymentHistory ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-5xl mb-3" style={{ color: 'var(--text-slate-300)' }}>💳</div>
            <div className="text-base font-medium mb-1" style={{ color: 'var(--text-slate-700)' }}>No payment history found</div>
            <p className="text-xs" style={{ color: 'var(--text-slate-500)' }}>This invoice has no recorded payments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs" style={{ color: 'var(--text-slate-500)' }}>Invoice</span>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {paymentHistory?.summary?.invoiceNumber || transactionInvoice?.invoiceNumber}
                    </div>
                  </div>
                  <div className="w-px h-8" style={{ backgroundColor: 'var(--border-color)' }}></div>
                  <div>
                    <span className="text-xs" style={{ color: 'var(--text-slate-500)' }}>Customer</span>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {paymentHistory?.summary?.customerName ||
                        (transactionInvoice?.customerSnapshot as any)?.companyName ||
                        transactionInvoice?.customer?.companyName ||
                        'Unknown'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-slate-500)' }}>
                      <FileText size={12} style={{ color: 'var(--customers-header-icon-color)' }} />
                      Total
                    </span>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ${Number(paymentHistory?.summary?.totalAmount || transactionInvoice?.grandTotal || transactionInvoice?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-slate-500)' }}>
                      <CheckCircle size={12} className="text-green-600" />
                      Paid
                    </span>
                    <div className="font-semibold text-green-700">
                      ${Number(paymentHistory?.summary?.totalPaid || transactionInvoice?.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-slate-500)' }}>
                      <RotateCcw size={12} className="text-orange-600" />
                      Refund
                    </span>
                    <div className="font-semibold text-orange-700">
                      ${Number(paymentHistory?.summary?.totalRefunded || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-slate-500)' }}>
                      <DollarSign size={12} className="text-blue-600" />
                      Balance
                    </span>
                    <div className="font-semibold text-blue-700">
                      ${Number(paymentHistory?.summary?.balanceDue || transactionInvoice?.balanceDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {Number(paymentHistory?.summary?.totalAmount || 0) > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--text-slate-500)' }}>Progress</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-slate-100)' }}>
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                        style={{ width: `${Math.min(100, Math.round((Number(paymentHistory?.summary?.totalPaid || 0) / Number(paymentHistory?.summary?.totalAmount || 1)) * 100))}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--customers-header-icon-color)' }}>
                      {Math.round((Number(paymentHistory?.summary?.totalPaid || 0) / Number(paymentHistory?.summary?.totalAmount || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div className="px-3 py-2 rounded-md border" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                <div className="text-xs" style={{ color: 'var(--text-slate-500)' }}>Total</div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {String(paymentHistory?.summary?.paymentCount || paymentHistory.payments.length).padStart(2, '0')}
                </div>
              </div>

              <div className="px-3 py-2 rounded-md border" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-slate-500)' }}>
                  <CheckCircle size={12} className="text-green-600" />
                  Completed
                </div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {String(paymentHistory?.summary?.completedPayments ||
                    paymentHistory.payments.filter((p: any) => p.status === 'COMPLETED').length).padStart(2, '0')}
                </div>
              </div>

              <div className="px-3 py-2 rounded-md border" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-slate-500)' }}>
                  <RotateCcw size={12} className="text-orange-600" />
                  Refunded
                </div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {String(paymentHistory?.summary?.refundedPayments ||
                    paymentHistory.payments.filter((p: any) => p.status === 'REFUNDED').length).padStart(2, '0')}
                </div>
              </div>

              <div className="px-3 py-2 rounded-md border" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-slate-500)' }}>
                  <XCircle size={12} className="text-red-600" />
                  Failed
                </div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {String(paymentHistory?.summary?.failedPayments ||
                    paymentHistory.payments.filter((p: any) => p.status === 'FAILED').length).padStart(2, '0')}
                </div>
              </div>

              <div className="px-3 py-2 rounded-md border" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-slate-500)' }}>
                  <Clock size={12} className="text-blue-600" />
                  Pending
                </div>
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {String(paymentHistory?.summary?.pendingPayments ||
                    paymentHistory.payments.filter((p: any) => p.status === 'PENDING').length).padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
              <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--bg-slate-50)' }}>
                    <FileText size={12} style={{ color: 'var(--customers-header-icon-color)' }} />
                  </div>
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Payment Transactions</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-slate-400)' }}>
                    {paymentHistory.payments.length}
                  </span>
                </div>
                <Button
                  size="small"
                  icon={<RotateCcw size={16} />}
                  onClick={() => refetchPaymentHistory()}
                  loading={isPaymentLoading}
                  className="text-xs border-gray-300"
                />
              </div>

              {!paymentHistory.payments || paymentHistory.payments.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-slate-500)' }}>No payment transactions found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)' }}>
                          <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--text-slate-600)' }}>Date & Time</th>
                          <th className="px-4 py-2.5 text-right font-medium" style={{ color: 'var(--text-slate-600)' }}>Amount</th>
                          <th className="px-4 py-2.5 text-center font-medium" style={{ color: 'var(--text-slate-600)' }}>Status</th>
                          <th className="px-4 py-2.5 text-right font-medium" style={{ color: 'var(--text-slate-600)' }}>Paid</th>
                          <th className="px-4 py-2.5 text-right font-medium" style={{ color: 'var(--text-slate-600)' }}>Balance</th>
                          <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--text-slate-600)' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                        {paymentHistory.payments.map((payment: any, index: number) => (
                          <tr key={payment.id || index} className="hover:bg-gray-50" style={{ backgroundColor: 'transparent' }}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {payment.date || dayjs(payment.paymentDate).format('MMM DD, YYYY')}
                              </div>
                              <div style={{ color: 'var(--text-slate-400)' }}>
                                {payment.time || dayjs(payment.paymentDate).format('HH:mm')}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <span className={`font-medium`} style={{ color: payment.status === 'REFUNDED' ? '#f97316' : 'var(--text-primary)' }}>
                                {payment.status === 'REFUNDED' ? '−' : ''}${Number(payment.amount || 0).toLocaleString()}
                              </span>
                              <div className="text-[10px]" style={{ color: 'var(--text-slate-400)' }}>
                                {payment.paymentMethod?.replace('_', ' ') || 'Bank Transfer'}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex justify-center">
                                <span className={`
                            px-2 py-0.5 rounded-full text-[10px] font-medium border
                            ${payment.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${payment.status === 'REFUNDED' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                            ${payment.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                            ${payment.status === 'PENDING' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                          `}>
                                  {payment.status?.charAt(0) + payment.status?.slice(1).toLowerCase()}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right font-medium" style={{ color: '#16a34a' }}>
                              ${Number(payment.amount || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right font-medium" style={{ color: '#1d4ed8' }}>
                              ${Number(payment.balanceAfter || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <div style={{ color: 'var(--text-slate-600)' }}>
                                {payment.description || <span style={{ color: 'var(--text-slate-400)' }}>—</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-4 py-3 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-slate-50)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-slate-500)' }}>
                      Showing 1-{Math.min(5, paymentHistory.payments.length)} of {paymentHistory.payments.length}
                    </span>
                    <div className="flex gap-1">
                      <Button size="small" className="text-xs border-gray-300 px-2">Previous</Button>
                      <Button size="small" className="text-xs bg-gray-700 text-white border-gray-700 px-2">1</Button>
                      <Button size="small" className="text-xs border-gray-300 px-2">2</Button>
                      <Button size="small" className="text-xs border-gray-300 px-2">3</Button>
                      <Button size="small" className="text-xs border-gray-300 px-2">Next</Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {paymentHistory.payments && paymentHistory.payments.length > 0 && (
              <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-slate-50)' }}>
                    <Clock size={12} style={{ color: 'var(--customers-header-icon-color)' }} />
                  </div>
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Payment Timeline</span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-slate-500)' }}>Recent transactions</span>
                </div>

                <div className="space-y-2">
                  {paymentHistory.payments.slice(0, 3).map((payment: any, idx: number) => (
                    <div key={idx} className="flex gap-2 relative">
                      {idx < Math.min(paymentHistory.payments.length, 3) - 1 && (
                        <div className="absolute left-2 top-5 bottom-0 w-0.5" style={{ backgroundColor: 'var(--border-color)' }}></div>
                      )}
                      <div className={`
                  w-4 h-4 rounded-full mt-0.5 flex items-center justify-center flex-shrink-0
                  ${payment.status === 'COMPLETED' ? 'bg-green-500' : ''}
                  ${payment.status === 'REFUNDED' ? 'bg-orange-500' : ''}
                  ${payment.status === 'FAILED' ? 'bg-red-500' : ''}
                  ${payment.status === 'PENDING' ? 'bg-blue-500' : ''}
                  ${!['COMPLETED', 'REFUNDED', 'FAILED', 'PENDING'].includes(payment.status) ? 'bg-gray-400' : ''}
                `}>
                        {payment.status === 'COMPLETED' && <CheckCircle size={10} className="text-white" />}
                        {payment.status === 'REFUNDED' && <RotateCcw size={10} className="text-white" />}
                        {payment.status === 'FAILED' && <XCircle size={10} className="text-white" />}
                        {payment.status === 'PENDING' && <Clock size={10} className="text-white" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                              ${Number(payment.amount || 0).toLocaleString()}
                            </span>
                            <span className="text-xs ml-2" style={{ color: 'var(--text-slate-600)' }}>
                              {payment.description || 'Payment processed'}
                            </span>
                          </div>
                          <span className="text-xs whitespace-nowrap ml-2" style={{ color: 'var(--text-slate-400)' }}>
                            {payment.date || dayjs(payment.paymentDate).format('MMM DD · HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-slate-700)' }}>
                            {payment.paymentMethod?.replace('_', ' ') || 'Bank Transfer'}
                          </span>
                          {payment.processedBy && (
                            <span className="text-[10px]" style={{ color: 'var(--text-slate-500)' }}>
                              by {payment.processedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {paymentHistory.payments.length > 3 && (
                  <div className="text-center mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button className="text-xs font-medium flex items-center gap-1 mx-auto" style={{ color: 'var(--customers-header-icon-color)' }}>
                      View all {paymentHistory.payments.length} transactions
                      <ChevronRight size={10} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* EMAIL DRAWER */}
      {selectedInvoiceForEmail && (
        <ComposeEmailDrawer
          open={emailDrawerOpen}
          onClose={() => {
            setEmailDrawerOpen(false);
            setSelectedInvoiceForEmail(null);
          }}
          invoice={selectedInvoiceForEmail}
        />
      )}

      {/* INVOICE PREVIEW DRAWER */}
      <Drawer
        open={!!previewInvoiceNumber}
        onClose={() => setPreviewInvoiceNumber(null)}
        placement="right"
        width={1100}
        closable={false}
        styles={{
          body: { padding: 0, background: "var(--customers-page-bg)" },
          header: { display: "none" },
          wrapper: { boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.08)" },
          mask: {
            backdropFilter: "blur(2px)",
            background: "rgba(15, 23, 42, 0.35)",
          },
        }}
      >
        <div className="h-full flex flex-col">
          <div
            className="px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
            style={{
              background: "color-mix(in oklab, var(--bg-secondary) 92%, transparent)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "var(--bg-blue-50)",
                  color: "var(--text-blue-700)",
                  border: "1px solid var(--border-blue-200)",
                }}
              >
                <FileText size={18} strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <div
                  className="text-[15px] font-semibold leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  Invoice preview
                </div>
                <div
                  className="text-[12px] mt-0.5 truncate"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {previewInvoiceNumber}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip title="Open in full view">
                <Button
                  size="small"
                  onClick={() => {
                    if (previewInvoiceNumber) {
                      router.push(`/invoice/invoices/view/${previewInvoiceNumber}`);
                      setPreviewInvoiceNumber(null);
                    }
                  }}
                  style={{
                    borderRadius: 8,
                    height: 32,
                    fontWeight: 600,
                  }}
                >
                  Full view
                </Button>
              </Tooltip>
              <button
                type="button"
                onClick={() => setPreviewInvoiceNumber(null)}
                aria-label="Close"
                className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
                style={{ color: "var(--text-secondary)" }}
              >
                <XCircle size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {previewInvoiceNumber && (
              <iframe
                key={previewInvoiceNumber}
                src={`/invoice/invoices/view/${previewInvoiceNumber}`}
                className="w-full h-full"
                style={{
                  border: "none",
                  background: "var(--customers-page-bg)",
                }}
                title="Invoice preview"
              />
            )}
          </div>
        </div>
      </Drawer>

      {/* Payment Proof Timeline drawer */}
      <Drawer
        title={<div className="flex items-center gap-2"><Paperclip size={18} /> Payment Proofs</div>}
        placement="right"
        width={900}
        onClose={() => {
          setProofDrawerVisible(false);
          setSelectedProofInvoice(null);
          setViewedProofFile(null);
        }}
        open={proofDrawerVisible}
        bodyStyle={{ padding: 0 }}
      >
        <div className="flex h-full w-full">
          <div className="w-[350px] flex-shrink-0 p-6 overflow-y-auto border-r" style={{ borderColor: "var(--border-color)" }}>
            {selectedProofInvoice?.paymentProofs?.length > 0 ? (
              <div className="pt-2">
                <Timeline
                  items={selectedProofInvoice.paymentProofs.map((proof: any) => ({
                    dot: <CheckCircle size={18} className="text-green-500" style={{ background: "var(--customers-page-bg)", borderRadius: "50%" }} />,
                    children: (
                      <div
                        className={`ml-2 mb-6 p-4 rounded-xl border transition-all cursor-pointer ${viewedProofFile === proof.file ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'shadow-sm hover:shadow-md'}`}
                        style={{ background: "var(--bg-secondary)", borderColor: viewedProofFile === proof.file ? "var(--accent-color, #6366f1)" : "var(--border-color)" }}
                        onClick={() => setViewedProofFile(proof.file)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
                              {proof.paymentDate ? dayjs(proof.paymentDate).format('MMM DD, YYYY') : "Date Not Specified"}
                            </div>
                            <Text strong className="text-xl" style={{ color: "var(--text-primary)" }}>
                              ${Number(proof.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                          </div>
                          <Tag color="success" className="m-0 px-2 py-0.5 border-0 font-medium">Uploaded</Tag>
                        </div>

                        {(proof.reference || proof.note) && (
                          <div className="flex flex-col gap-2 mt-4 pt-3 border-t" style={{ borderColor: "var(--border-color)" }}>
                            {proof.reference && (
                              <div className="flex flex-col">
                                <Text type="secondary" className="text-[11px] uppercase tracking-wider font-semibold">Reference</Text>
                                <Text className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{proof.reference}</Text>
                              </div>
                            )}
                            {proof.note && (
                              <div className="flex flex-col mt-1">
                                <Text type="secondary" className="text-[11px] uppercase tracking-wider font-semibold">Note</Text>
                                <Text className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>{proof.note}</Text>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--accent-color, #4f46e5)" }}>
                          <Eye size={16} /> View Document
                        </div>
                      </div>
                    ),
                  }))}
                />
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: "var(--text-secondary)" }}>No payment proofs found.</div>
            )}
          </div>

          <div className="flex-1 flex flex-col p-6 h-full overflow-hidden" style={{ background: "var(--customers-page-bg)" }}>
            <div className="flex-1 rounded-xl border overflow-hidden shadow-sm flex items-center justify-center relative" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
              {viewedProofFile ? (
                <>
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <Button
                      icon={<FileText size={16} />}
                      onClick={() => window.open(viewedProofFile, "_blank")}
                      className="shadow-sm"
                    >
                      Open in Tab
                    </Button>
                  </div>
                  {viewedProofFile.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                    <img
                      src={viewedProofFile}
                      alt="Payment Proof"
                      className="max-w-full max-h-full object-contain p-4"
                    />
                  ) : (
                    <iframe
                      src={viewedProofFile}
                      className="w-full h-full border-none"
                      title="Payment Proof Viewer"
                    />
                  )}
                </>
              ) : (
                <div className="text-center flex flex-col items-center gap-3" style={{ color: "var(--text-secondary)" }}>
                  <FileText size={48} className="opacity-20" />
                  <p>Select a payment proof from the timeline to view</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .pp-shell {
          display: flex;
          margin: 0 -24px;
          min-height: calc(100vh - 54px);
          background: var(--bg-pure-white);
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
          height: 35px !important; border-radius: 8px !important; font-weight: 700 !important; font-size: 14px !important;
          background: #3B82F6 !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 12px;
        }
        .pp-create-btn:hover { background: #2563EB !important; }
        .pp-create-btn .anticon { font-size: 14px !important; }
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
        .pp-side-filters { display: flex; flex-direction: column; gap: 7px; padding: 0; }
        .pp-side-sd { border-radius: 8px !important; }
        .pp-side-sd.sd-trigger,
        .pp-side-sd.sd-trigger.is-compact { height: 35px !important; border-radius: 8px !important; }
        .pp-side-select .ant-select-selector,
        .pp-side-range.ant-picker {
          border-radius: 8px !important; border-color: var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
        }
        .pp-side-select { width: 100%; }
        .pp-side-select .ant-select-selector { height: 35px !important; padding: 0 12px !important; display: flex; align-items: center; }
        .pp-side-select .ant-select-selection-placeholder,
        .pp-side-select .ant-select-selection-item { font-size: 13px; line-height: 33px !important; }
        .pp-side-range { width: 100%; height: 35px; border-style: solid !important; }
        .pp-side-range .ant-picker-input > input { font-size: 13px; }
        .pp-clear-filters {
          display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
          background: none; border: none; cursor: pointer; padding: 3px;
          font-size: 12px; font-weight: 600; color: #f87171;
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
        }
        .pp-trash:hover { color: #3B82F6; }

        /* ---------------- Main ---------------- */
        .pp-main { flex: 1; min-width: 0; padding: 8px 32px 0 20px; display: flex; flex-direction: column; }
        .pp-body { flex: 1 0 auto; padding-bottom: 60px; }
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
        .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
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
        .pp-stat-value { font-size: 20px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        /* Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table-wrap ::-webkit-scrollbar { display: none !important; }
        .pp-table-wrap, .pp-table-wrap * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .pp-table .ant-table { background: transparent; font-size: 12px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }

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
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        @media (max-width: 820px) {
          .pp-sidebar { display: none; }
          .pp-topbar-meta { display: none; }
        }

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
        .pc-avatar img { width: 100%; height: 100%; object-fit: contain; }
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

        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }

        .pp-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .pp-empty-orb {
          width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
        }
        .pp-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }
        .pp-btn-primary {
          background: #3B82F6 !important; border: none !important;
          border-radius: 0 !important; font-weight: 600 !important;
        }

        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </MainLayout>
  );
}