

"use client";

import { useState, useEffect } from "react";
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
  message,
  Menu,
  Progress,
} from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
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
  RefreshCw
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

// In your component file (InvoiceInvoicesPage)
import type {
  PaymentTransaction,
  PaymentHistoryData,
  PaymentStatus,
  PaymentMethod
} from "@/services/invoiceService";
import ComposeEmailDrawer from "@/components/customer/ComposeEmailDrawer";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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

// Define the InvoiceStatus to match your TypeScript interface
type InvoiceStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';

// Helper function to get available status transitions
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

// Helper to convert frontend status to backend status
const toBackendStatus = (status: InvoiceStatus): string => {
  return status === 'APPROVED' ? 'APPROVAL' : status;
};

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
    'DRAFT': <Clock size={16} />,
    'PENDING': <Clock size={16} />,
    'APPROVED': <CheckCircle size={16} />,
    'SENT': <Mail size={16} />,
    'PAID': <CheckCircle size={16} style={{ color: '#52c41a' }} />,
    'PARTIALLY_PAID': <DollarSign size={16} style={{ color: '#faad14' }} />,
    'OVERDUE': <AlertCircle size={16} style={{ color: '#ff4d4f' }} />,
    'CANCELLED': <XCircle size={16} style={{ color: '#bfbfbf' }} />
  };
  return icons[status] || <Clock size={16} />;
};

export default function InvoiceInvoicesPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const { canReadInvoice, canCreateInvoice, canUpdateInvoice, canDeleteInvoice } = usePermission();
  const { isLoading: authLoading } = useAuth();

  /* ================= STAT TILE (accent strip) ================= */
  const StatCard = ({ label, value, icon: Icon, color, sub }: any) => (
    <div
      className="rounded-2xl px-5 py-4 flex items-center gap-4 relative overflow-hidden"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
      }}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: color }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `${color}14`,
          color,
          border: `1px solid ${color}33`,
        }}
      >
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </div>
        <div
          className="text-[22px] font-bold leading-tight tabular-nums truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </div>
        {sub && (
          <div
            className="text-[11px] mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadInvoice) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadInvoice, router]);

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

  // In your component, update the hook call
  const {
    data: paymentHistory,
    isLoading: isPaymentLoading,
    refetch: refetchPaymentHistory,
  } = useInvoicePaymentHistory(
    transactionInvoice?.id,
    !!transactionDrawerOpen
  );

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [previewInvoiceNumber, setPreviewInvoiceNumber] = useState<string | null>(null);

  dayjs.extend(isBetween);

  // Add this useEffect after your hook calls
  useEffect(() => {
    if (paymentHistory && transactionDrawerOpen) {
      console.log('Payment History Data:', {
        hasData: !!paymentHistory,
        hasPayments: !!paymentHistory.payments,
        paymentsCount: paymentHistory.payments?.length || 0,
        summary: paymentHistory.summary,
        firstPayment: paymentHistory.payments?.[0],
        fullData: paymentHistory
      });
    }
  }, [paymentHistory, transactionDrawerOpen]);


  // Inside the component...
  const [emailDrawerOpen, setEmailDrawerOpen] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState<any>(null);

  const { mutate: sendEmail, isPending: isSendingEmail } = useSendInvoiceEmail();

  // Function to handle the Quick Send (Background)
  const handleQuickSend = (record: any) => {
    const snapshot = record.customerSnapshot as any;
    const targetEmail = snapshot?.email || record.customer?.email;

    if (!targetEmail) {
      messageApi.error("No email found for this customer.");
      return;
    }

    const hide = message.loading(`Sending invoice ${record.invoiceNumber}...`, 0);

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








  /* ================= TRASH SINGLE ================= */
  const openDeleteModal = (record: any) => {
    //console.log("Opening trash modal for:", record.invoiceNumber);
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
          refetch(); // Refresh the invoice list
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

  /* ================= BULK TRASH ================= */
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




  // const startBulkDelete = async () => {
  //   if (selectedInvoices.length === 0) return;

  //   setBulkDeleteModalVisible(false);

  //   setBulkDeleteProgress({
  //     visible: true,
  //     total: selectedInvoices.length,
  //     completed: 0,
  //     failed: 0,
  //     currentInvoice: null,
  //     isDeleting: true
  //   });

  //   const deletedInvoices: string[] = [];
  //   const failedInvoices: Array<{ invoiceNumber: string; error: string }> = [];

  //   for (let i = 0; i < selectedInvoices.length; i++) {
  //     const inv = selectedInvoices[i];

  //     setBulkDeleteProgress(prev => ({
  //       ...prev,
  //       currentInvoice: inv.invoiceNumber
  //     }));

  //     try {
  //       console.log(`Deleting invoice ${i + 1}/${selectedInvoices.length}:`, {
  //         id: inv.id,
  //         invoiceNumber: inv.invoiceNumber,
  //         url: `/api/invoices/${inv.id}`
  //       });

  //       // Test if the endpoint exists first
  //       const testResponse = await fetch(`/api/invoices/${inv.id}`, {
  //         method: 'HEAD',
  //       });

  //       console.log('HEAD response status:', testResponse.status);

  //       if (testResponse.status === 404) {
  //         throw new Error(`Invoice not found (404). ID: ${inv.id}, Number: ${inv.invoiceNumber}`);
  //       }

  //       // Now try the DELETE
  //       const response = await fetch(`/api/invoices/${inv.id}`, {
  //         method: 'DELETE',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       });

  //       console.log('DELETE response status:', response.status);

  //       if (!response.ok) {
  //         let errorMessage = `HTTP error! status: ${response.status}`;
  //         try {
  //           const errorData = await response.json();
  //           errorMessage = errorData.message || errorMessage;
  //         } catch {
  //           // Ignore JSON parse errors
  //         }
  //         throw new Error(errorMessage);
  //       }

  //       deletedInvoices.push(inv.invoiceNumber);

  //       setBulkDeleteProgress(prev => ({
  //         ...prev,
  //         completed: prev.completed + 1
  //       }));

  //       await new Promise(resolve => setTimeout(resolve, 300));

  //     } catch (error: any) {
  //       console.error(`Failed to delete invoice ${inv.invoiceNumber}:`, {
  //         error: error.message,
  //         invoiceId: inv.id,
  //         invoiceNumber: inv.invoiceNumber,
  //         stack: error.stack
  //       });

  //       failedInvoices.push({
  //         invoiceNumber: inv.invoiceNumber,
  //         error: error.message || 'Unknown error'
  //       });

  //       setBulkDeleteProgress(prev => ({
  //         ...prev,
  //         failed: prev.failed + 1,
  //         completed: prev.completed + 1
  //       }));
  //     }
  //   }




  //   // Wait a moment before closing progress modal
  //   setTimeout(() => {
  //     setBulkDeleteProgress({
  //       visible: false,
  //       total: 0,
  //       completed: 0,
  //       failed: 0,
  //       currentInvoice: null,
  //       isDeleting: false
  //     });

  //     // Show results
  //     if (deletedInvoices.length > 0) {
  //       messageApi.success(`Deleted ${deletedInvoices.length} invoice(s) successfully`);
  //     }

  //     if (failedInvoices.length > 0) {
  //       messageApi.warning(`Failed to delete ${failedInvoices.length} invoice(s)`);

  //       // Show detailed error modal
  //       Modal.warning({
  //         title: 'Failed to Delete Some Invoices',
  //         content: (
  //           <div>
  //             <Alert
  //               message={`${failedInvoices.length} invoice(s) could not be deleted`}
  //               description="The following invoices failed to delete:"
  //               type="warning"
  //               showIcon
  //               className="mb-4"
  //             />
  //             <div className="max-h-60 overflow-y-auto border rounded p-2">
  //               <ul className="list-disc pl-4">
  //                 {failedInvoices.map((failed, idx) => (
  //                   <li key={idx} className="mb-1 text-sm">
  //                     <Text strong>{failed.invoiceNumber}</Text>
  //                     <Text type="secondary" className="ml-2">
  //                       - {failed.error}
  //                     </Text>
  //                   </li>
  //                 ))}
  //               </ul>
  //             </div>
  //           </div>
  //         ),
  //         width: 500,
  //         okText: 'OK'
  //       });
  //     }

  //     // Clear selection and refresh data
  //     setSelectedRowKeys([]);
  //     setSelectedInvoices([]);
  //     refetch();

  //   }, 1500);

  //   // ... rest of your code
  // };


  const startBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;

    setBulkDeleteModalVisible(false);

    const ids = selectedInvoices.map(inv => inv.id);
    const invoiceNumbers = selectedInvoices.map(inv => inv.invoiceNumber);

    setBulkDeleteProgress({
      visible: true,
      total: selectedInvoices.length,
      completed: 0,
      failed: 0,
      currentInvoice: 'Processing bulk request...',
      isDeleting: true
    });

    try {
      const result = await bulkDeleteMutation.mutateAsync(ids);

      setBulkDeleteProgress(prev => ({
        ...prev,
        completed: selectedInvoices.length,
        currentInvoice: 'Finished'
      }));

      // Clear selection
      setSelectedRowKeys([]);
      setSelectedInvoices([]);

    } catch (error: any) {
      console.error(`Bulk trash failed:`, error);

      setBulkDeleteProgress(prev => ({
        ...prev,
        failed: selectedInvoices.length,
        isDeleting: false
      }));

      // In case of error, the hook already shows a message, but we might want to handle it here too
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

      // Clear selection
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

  /* ================= ACTION MENU ================= */
  const getMenuItems = (record: any): MenuProps["items"] => [
    {
      key: "view",
      icon: <Eye size={16} />,
      label: "View Details",
      onClick: () => {
        router.push(`/invoice/invoices/view/${record.invoiceNumber}`);
      },
    },
    canUpdateInvoice && ["DRAFT", "PENDING", "APPROVED", "APPROVAL"].includes(record.status) && {
      key: "edit",
      icon: <Edit2 size={16} />,
      label: "Edit Invoice",
      onClick: () => {
        router.push(`/invoice/newinvoice?edit=${record.id}`);
      },
    },
    {
      key: "download",
      icon: <Download size={16} />,
      label: record.id === downloadingId && isDownloading ? "Downloading..." : "Download PDF",
      disabled: isDownloading,
      onClick: () => {
        downloadInvoice(record.id);
      },
    },
    {
      key: "send_quick",
      icon: <Mail size={16} />,
      label: "Quick Send Email",
      onClick: () => handleQuickSend(record),
    },
    {
      key: "compose_email",
      icon: <Edit2 size={16} />,
      label: "Compose & Send",
      onClick: () => {
        setSelectedInvoiceForEmail(record);
        setEmailDrawerOpen(true);
      },
    },
    {
      key: "transactions",
      icon: <DollarSign size={16} />,
      label: "Transaction History",
      onClick: () => {
        setTransactionInvoice(record);
        setTransactionDrawerOpen(true);
      },
    },
    (canUpdateInvoice || canDeleteInvoice) && { type: "divider" },
    canDeleteInvoice && {
      key: "delete",
      icon: <Trash2 size={16} />,
      label: deletingId === record.id && deleteMutation.isPending ? "Moving to Trash..." : "Move to Trash",
      danger: true,
      disabled: deletingId === record.id && deleteMutation.isPending,
      onClick: () => {
        console.log("Move to trash clicked for:", record.invoiceNumber);
        openDeleteModal(record);
      },
    },
  ].filter(Boolean) as MenuProps["items"];

  /* ================= HANDLE STATUS CHANGE ================= */
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

  /* ================= HANDLE PAYMENT UPDATE ================= */
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
          refetch(); // Refresh the invoice list
          messageApi.success('Payment updated successfully');
        },
        onError: (error: any) => {
          messageApi.error(error.message || 'Failed to update payment');
        }
      });
    });
  };

  /* ================= HANDLE APPROVAL UPDATE ================= */
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
          refetch(); // Refresh the invoice list
          messageApi.success('Invoice approved successfully');
        },
        onError: (error: any) => {
          messageApi.error(error.message || 'Failed to approve invoice');
        }
      });
    });
  };

  /* ================= HANDLE GENERAL STATUS UPDATE ================= */
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
            refetch(); // Refresh the invoice list
            messageApi.success('Status updated successfully');
          },
          onError: (error: any) => {
            messageApi.error(error.message || 'Failed to update status');
          }
        });
      }
    }
  };

  /* ================= TABLE COLUMNS ================= */
  const columns: ColumnsType<any> = [
    {
      title: "INVOICE NO",
      dataIndex: "invoiceNumber",
      key: "invoice_number",
      width: 140,
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
              color: "var(--text-blue-700)",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 13,
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
          <div className="flex items-center gap-3 truncate">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--customers-avatar-bg)', color: 'var(--customers-avatar-text)' }}>
              {companyName.charAt(0)}
            </div>
            <div className="truncate">
              <div className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {companyName}
              </div>
              <div className="text-[10px] truncate" style={{ color: 'var(--text-slate-500)' }}>
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
      width: 120,
      render: (date: string) => (
        <div style={{ color: 'var(--text-secondary)' }}>
          {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: "DUE DATE",
      dataIndex: "dueDate",
      width: 120,
      render: (date: string) => {
        const isOverdue = date && dayjs(date).isBefore(dayjs(), 'day');
        return (
          <div className={isOverdue ? "text-red-500 font-medium" : ""} style={{ color: isOverdue ? '#ef4444' : 'var(--text-secondary)' }}>
            {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
          </div>
        );
      },
    },
    {
      title: "AMOUNT",
      dataIndex: "grandTotal",
      width: 120,
      render: (v, record) => (
        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
          ${Number(v || record.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 150,
      render: (status: string, record: any) => {
        const frontendStatus = fromBackendStatus(status);
        return (
          <div
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleStatusChange(record);
            }}
          >
            <Tooltip title="Click to change status">
              <Badge
                count={
                  <Tag
                    color={getStatusColor(frontendStatus)}
                    className="hover:opacity-80 transition-opacity m-0"
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: "1",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      border: "none",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em"
                    }}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      {getStatusIcon(frontendStatus)}
                      <span>{frontendStatus}</span>
                    </div>
                  </Tag>
                }
              />
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "BALANCE DUE",
      dataIndex: "balanceDue",
      width: 120,
      render: (v, record) => {
        // Use the balanceDue field directly since it's updated by the status update hook
        const balance = Number(v || 0);

        return (
          <div className={balance === 0 ? "text-green-600 font-medium" : "font-semibold"} style={{ color: balance === 0 ? '#10b981' : 'var(--text-primary)' }}>
            ${balance.toFixed(2)}
          </div>
        );
      },
    },
    {
      title: "ACTIONS",
      align: "center",
      width: 80,
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
                // Reset deleting state when dropdown closes
                setDeletingId(null);
              }
            }}
          >
            <Button
              type="text"
              icon={<MoreVertical size={18} style={{ color: 'var(--text-slate-400)' }} />}
              className="hover:bg-gray-100"
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

  /* ================= SEARCH AND FILTER ================= */
  const filteredInvoices = invoices.filter((inv) => {
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

    // STATUS
    if (statusFilter && fromBackendStatus(inv.status) !== statusFilter) {
      return false;
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

  const totalCount = invoices.length;
  const paidCount = invoices.filter(
    (i) => fromBackendStatus(i.status) === "PAID"
  ).length;
  const pendingCount = invoices.filter(
    (i) => fromBackendStatus(i.status) === "PENDING"
  ).length;
  const customerCount = new Set(
    invoices.map((i) => {
      const snapshot = i.customerSnapshot as CustomerSnapshot | null;
      return snapshot?.id || i.customer?.id;
    })
  ).size;

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

  const filterContent = (
    <div className="w-72">
      <Space direction="vertical" size="middle" className="w-full">
        {/* Date Range */}
        <div>
          <div className="text-sm font-medium mb-1">Filter by Date</div>
          <RangePicker
            className="w-full"
            value={dateRange as any}
            onChange={(values) => setDateRange(values)}
            allowClear
          />
        </div>

        {/* Status */}
        <div>
          <div className="text-sm font-medium mb-1">Filter by Status</div>
          <Select
            className="w-full"
            placeholder="Select status"
            allowClear
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { label: "Draft", value: "DRAFT" },
              { label: "Pending", value: "PENDING" },
              { label: "Approval", value: "APPROVED" },
              { label: "Sent", value: "SENT" },
              { label: "Submitted", value: "SUBMITTED" },
              { label: "Partially Paid", value: "PARTIALLY_PAID" },
              { label: "Paid", value: "PAID" },
              { label: "Overdue", value: "OVERDUE" },
              { label: "Cancelled", value: "CANCELLED" },
            ]}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            size="small"
            onClick={() => {
              setDateRange(null);
              setStatusFilter(null);
            }}
          >
            Reset
          </Button>
          <Button size="small" type="primary">
            Apply
          </Button>
        </div>
      </Space>
    </div>
  );



  if (authLoading) return <MainLayout><div style={{ padding: 100, textAlign: 'center' }}><Spin tip="Loading"><div style={{ padding: 20 }} /></Spin></div></MainLayout>;
  if (!canReadInvoice) return null;

  return (
    <MainLayout>
      {contextHolder}
      <div style={{
        margin: "0 -24px",
        background: "var(--customers-page-bg)",
        minHeight: "calc(100vh - 64px)"
      }}>
        {/* TOP BAR */}
        <div
          className="sticky top-0 z-40 backdrop-blur-md border-b"
          style={{
            background:
              "color-mix(in oklab, var(--customers-page-bg) 85%, transparent)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "var(--bg-blue-50)",
                  color: "var(--text-blue-700)",
                  border: "1px solid var(--border-blue-200)",
                }}
              >
                <FileText size={14} strokeWidth={2.25} />
              </div>
              <span
                className="text-[14px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Invoices
              </span>
              <span
                className="h-4 w-px"
                style={{ background: "var(--border-color)" }}
              />
              <span
                className="text-[12px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Manage, track payments, and monitor invoice statuses
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Search invoices..."
                allowClear
                prefix={
                  <Search
                    size={14}
                    style={{ color: "var(--text-secondary)" }}
                  />
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: 280,
                  height: 36,
                  borderRadius: 8,
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              />
              <Popover content={filterContent} trigger="click" placement="bottomRight">
                <Button
                  icon={<Filter size={14} />}
                  style={{
                    borderRadius: 8,
                    height: 36,
                    fontWeight: 600,
                  }}
                >
                  Filter
                </Button>
              </Popover>
              {canCreateInvoice && (
                <Button
                  type="primary"
                  icon={<Plus size={14} />}
                  onClick={() => router.push("/invoice/newinvoice")}
                  style={{
                    borderRadius: 8,
                    height: 36,
                    fontWeight: 600,
                    background: "#2563eb",
                  }}
                >
                  New invoice
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 pt-6 pb-12">
          <div className="mx-auto max-w-[1600px]">

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Total revenue"
            value={`$${invoices.reduce((sum, inv) => sum + Number(inv.grandTotal || (inv as any).total || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={TrendingUp}
            color="#2563eb"
            sub="All-time billed"
          />
          <StatCard
            label="Paid"
            value={paidCount}
            icon={CheckCircle}
            color="#10b981"
            sub="Settled invoices"
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            icon={Clock}
            color="#f59e0b"
            sub="Awaiting payment"
          />
          <StatCard
            label="Customers"
            value={customerCount}
            icon={User}
            color="#8b5cf6"
            sub="Unique clients"
          />
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
              {canDeleteInvoice && (
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
          <div
            className="flex justify-center items-center h-64 rounded-2xl"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <Spin />
          </div>
        ) : isError ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{
              background: "var(--bg-secondary)",
              border: "1.5px dashed #fecaca",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
              }}
            >
              <AlertCircle size={20} strokeWidth={2} />
            </div>
            <div
              className="text-[14px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Failed to load invoices
            </div>
            <div
              className="text-[12px] mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Please try again later
            </div>
            <Button
              icon={<RefreshCw size={14} />}
              onClick={() => refetch()}
              style={{ borderRadius: 8, height: 36, fontWeight: 600, marginTop: 16 }}
            >
              Retry
            </Button>
          </div>
        ) : filteredInvoices.length === 0 ? (
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
              <FileText size={24} strokeWidth={2} />
            </div>
            <div
              className="text-[14px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {searchText ? "No invoices match your search" : "No invoices yet"}
            </div>
            <div
              className="text-[12px] mt-1 mb-5"
              style={{ color: "var(--text-secondary)" }}
            >
              {searchText
                ? "Try a different search term"
                : "Create your first invoice to get started"}
            </div>
            {!searchText && canCreateInvoice && (
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => router.push("/invoice/newinvoice")}
                style={{
                  borderRadius: 8,
                  height: 38,
                  fontWeight: 600,
                  background: "#2563eb",
                }}
              >
                Create first invoice
              </Button>
            )}
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
              size="middle"
              rowSelection={rowSelection}
              columns={columns}
              dataSource={filteredInvoices.map((inv) => ({
                ...inv,
                key: inv.id,
              }))}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                style: { padding: "12px 20px" },
                showTotal: (total, range) =>
                  `${range[0]}–${range[1]} of ${total}`,
              }}
              scroll={{ x: 1000 }}
              className="invoices-table"
              rowClassName={() => "invoice-table-row"}
            />
          </div>
        )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .invoices-table .ant-table-thead > tr > th {
          background-color: var(--bg-slate-50) !important;
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          padding: 10px 16px !important;
          letter-spacing: 0.06em !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .invoices-table .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .invoices-table .ant-table-row:hover > td {
          background-color: var(--bg-slate-50) !important;
        }
        .invoices-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .ant-input-search-button {
          height: 100% !important;
          border-radius: 0 12px 12px 0 !important;
        }
        .ant-input-affix-wrapper {
          border-radius: 12px !important;
        }
        
        /* Dark theme specific styles - only apply when data-theme is dark */
        [data-theme='dark'] .invoice-table-row:hover {
          background-color: var(--customers-table-row-hover) !important;
        }
        [data-theme='dark'] .ant-table-thead > tr > th {
          background-color: var(--customers-table-header-bg) !important;
          color: var(--customers-table-header-text) !important;
          border-bottom: 2px solid var(--border-color) !important;
        }
        [data-theme='dark'] .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-color) !important;
        }
        [data-theme='dark'] .ant-table {
          background-color: var(--customers-card-bg) !important;
        }
        [data-theme='dark'] .ant-table-tbody > tr > td {
          background-color: var(--customers-card-bg) !important;
        }
        [data-theme='dark'] .ant-table-pagination {
          background-color: var(--customers-card-bg) !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-item {
          background-color: var(--customers-card-bg) !important;
          border-color: var(--border-color) !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-item a {
          color: var(--text-primary) !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-item-active {
          background-color: var(--customers-header-icon-color) !important;
          border-color: var(--customers-header-icon-color) !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-item-active a {
          color: #ffffff !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-options {
          color: var(--text-primary) !important;
        }
      `}} />

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

          <div className="mb-4 max-h-60 overflow-y-auto border rounded p-2">
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
                <li className="text-sm text-gray-500">
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
            <div className="mb-4 p-3 bg-gray-50 rounded">
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
          {/* Metrics Summary */}
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
            <CheckCircle size={20} className="text-green-500 mr-2" />
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
          {/* Status Flow Indicator */}
          <div className="rounded-2xl p-4 mb-6 border flex items-center justify-between" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)' }}>
            <div className="text-center flex-1 min-w-0">
              <Text type="secondary" className="text-[10px] font-bold uppercase tracking-wider block mb-2">Current Status</Text>
              <div className="flex justify-center">
                <Tag
                  color={getStatusColor(fromBackendStatus(statusChangeInvoice?.status))}
                  icon={getStatusIcon(fromBackendStatus(statusChangeInvoice?.status))}
                  className="px-3 py-1 rounded-full border-none font-bold text-[10px] m-0 shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  {fromBackendStatus(statusChangeInvoice?.status)}
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
                    icon={getStatusIcon(selectedNewStatus)}
                    className="px-3 py-1 rounded-full border-none font-bold text-[10px] m-0 shadow-sm animate-pulse flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {selectedNewStatus}
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
            {/* Invoice Summary - Single Line Metrics with Colors */}
            <div className="rounded-lg border p-4" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
              <div className="flex items-center justify-between">
                {/* Left side - Invoice info */}
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

                {/* Right side - Metrics in one line with colors */}
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

              {/* Payment Progress Bar - Colored */}
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

            {/* Status Counts - Colored Icons, 2-Digit Format */}
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

            {/* Payment Table - Compact */}
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

                  {/* Simple Pagination */}
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

            {/* Payment Timeline - Restored */}
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

      {/* ... existing Modals for Delete and Status ... */}

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

      {/* INVOICE PREVIEW SLIDER */}
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
              background:
                "color-mix(in oklab, var(--bg-secondary) 92%, transparent)",
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
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
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
                      router.push(
                        `/invoice/invoices/view/${previewInvoiceNumber}`
                      );
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



    </MainLayout>
  );
}