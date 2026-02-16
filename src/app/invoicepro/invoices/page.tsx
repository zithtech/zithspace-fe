

"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Space,
  Typography,
  Card,
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
  Divider,
  Drawer,
  Spin,
  Empty,
  message,
  Menu,
  Progress
} from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  SettingOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  DownloadOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  LoadingOutlined,
  FormOutlined,
  FunnelPlotOutlined,
  ReloadOutlined,
  UserOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  RetweetOutlined,
  ArrowRightOutlined,
  CreditCardOutlined

} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import moment from "moment";
import isBetween from "dayjs/plugin/isBetween";

import { useInvoices, useDeleteInvoice, useDownloadInvoice, useUpdateInvoiceStatus, useSendInvoiceEmail } from "@/hooks/useInvoices";
import { useInvoicePaymentHistory } from "@/hooks/useInvoices";

// In your component file (InvoiceproInvoicesPage)
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
    'PARTIALLY_PAID': ['PAID', 'OVERDUE', 'CANCELLED'],
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
    'DRAFT': <ClockCircleOutlined />,
    'PENDING': <ClockCircleOutlined />,
    'APPROVED': <CheckCircleOutlined />,
    'SENT': <MailOutlined />,
    'PAID': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    'PARTIALLY_PAID': <DollarOutlined style={{ color: '#faad14' }} />,
    'OVERDUE': <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
    'CANCELLED': <CloseCircleOutlined style={{ color: '#bfbfbf' }} />
  };
  return icons[status] || <ClockCircleOutlined />;
};

export default function InvoiceproInvoicesPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");

  const { data, isLoading, isError, refetch } = useInvoices();
  const invoices = data?.data ?? [];
  const deleteMutation = useDeleteInvoice();

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








  /* ================= DELETE SINGLE ================= */
  const openDeleteModal = (record: any) => {
    //console.log("Opening delete modal for:", record.invoiceNumber);
    setInvoiceToDelete(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    try {
      setDeletingId(invoiceToDelete.id);
      await deleteMutation.mutateAsync(invoiceToDelete.id, {
        onSuccess: () => {
          messageApi.success(`Invoice ${invoiceToDelete.invoiceNumber} deleted successfully`);
          refetch(); // Refresh the invoice list
          setDeleteModalVisible(false);
          setInvoiceToDelete(null);
          setDeletingId(null);
        },
        onError: (error: any) => {
          messageApi.error(error.message || 'Failed to delete invoice');
          setDeletingId(null);
        }
      });
    } catch (error) {
      console.error('Delete failed:', error);
      setDeletingId(null);
    }
  };

  /* ================= BULK DELETE ================= */
  const openBulkDeleteModal = () => {
    if (selectedInvoices.length === 0) {
      messageApi.warning('Please select invoices to delete');
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
  
  setBulkDeleteProgress({
    visible: true,
    total: selectedInvoices.length,
    completed: 0,
    failed: 0,
    currentInvoice: null,
    isDeleting: true
  });

  const deletedInvoices: string[] = [];
  const failedInvoices: Array<{ invoiceNumber: string; error: string }> = [];
  
  for (let i = 0; i < selectedInvoices.length; i++) {
    const inv = selectedInvoices[i];
    
    setBulkDeleteProgress(prev => ({
      ...prev,
      currentInvoice: inv.invoiceNumber
    }));
    
    try {
      // THIS IS THE FIX - Use mutateAsync instead of fetch
      await deleteMutation.mutateAsync(inv.id);
      
      deletedInvoices.push(inv.invoiceNumber);
      
      setBulkDeleteProgress(prev => ({
        ...prev,
        completed: prev.completed + 1
      }));
      
    } catch (error: any) {
      console.error(`Failed to delete invoice ${inv.invoiceNumber}:`, error);
      
      failedInvoices.push({
        invoiceNumber: inv.invoiceNumber,
        error: error?.message || 'Unknown error'
      });
      
      setBulkDeleteProgress(prev => ({
        ...prev,
        failed: prev.failed + 1,
        completed: prev.completed + 1
      }));
    }
  }
  
  // Wait a moment before closing progress modal
  setTimeout(() => {
    setBulkDeleteProgress({
      visible: false,
      total: 0,
      completed: 0,
      failed: 0,
      currentInvoice: null,
      isDeleting: false
    });
    
    // Show results
    if (deletedInvoices.length > 0) {
      messageApi.success(`Deleted ${deletedInvoices.length} invoice(s) successfully`);
    }
    
    if (failedInvoices.length > 0) {
      messageApi.warning(`Failed to delete ${failedInvoices.length} invoice(s)`);
      
      // Show detailed error modal
      Modal.warning({
        title: 'Failed to Delete Some Invoices',
        content: (
          <div>
            <Alert
              message={`${failedInvoices.length} invoice(s) could not be deleted`}
              description="The following invoices failed to delete:"
              type="warning"
              showIcon
              className="mb-4"
            />
            <div className="max-h-60 overflow-y-auto border rounded p-2">
              <ul className="list-disc pl-4">
                {failedInvoices.map((failed, idx) => (
                  <li key={idx} className="mb-1 text-sm">
                    <Text strong>{failed.invoiceNumber}</Text>
                    <Text type="secondary" className="ml-2">
                      - {failed.error}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ),
        width: 500,
        okText: 'OK'
      });
    }
    
    // Clear selection and refresh data
    setSelectedRowKeys([]);
    setSelectedInvoices([]);
    // No need to call refetch() here because your useDeleteInvoice hook already invalidates queries
    
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
      icon: <EyeOutlined />,
      label: "View Details",
      onClick: () => {
        router.push(`/invoicepro/invoices/view/${record.invoiceNumber}`);
      },
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit Invoice",
      onClick: () => {
        router.push(`/invoicepro/newinvoice?edit=${record.id}`);
      },
    },
    {
      key: "download",
      icon: <DownloadOutlined />,
      label: record.id === downloadingId && isDownloading ? "Downloading..." : "Download PDF",
      disabled: isDownloading,
      onClick: () => {
        downloadInvoice(record.id);
      },
    },
    {
    key: "send_quick",
    icon: <MailOutlined />,
    label: "Quick Send Email",
    onClick: () => handleQuickSend(record),
  },
  {
    key: "compose_email",
    icon: <FormOutlined />,
    label: "Compose & Send",
    onClick: () => {
      setSelectedInvoiceForEmail(record);
      setEmailDrawerOpen(true);
    },
  },
    {
      key: "transactions",
      icon: <DollarOutlined />,
      label: "Transaction History",
      onClick: () => {
        setTransactionInvoice(record);
        setTransactionDrawerOpen(true);
      },
    },
    { type: "divider" },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: deletingId === record.id && deleteMutation.isPending ? "Deleting..." : "Delete",
      danger: true,
      disabled: deletingId === record.id && deleteMutation.isPending,
      onClick: () => {
        console.log("Delete clicked for:", record.invoiceNumber);
        openDeleteModal(record);
      },
    },
  ];

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
          paidAt: moment(),
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
        <Text strong style={{ color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: "CUSTOMER",
      key: "customer",
      width: 200,
      render: (_, record) => {
        const snapshot = record.customerSnapshot as any;
        return (
          <div className="truncate">
            <div className="font-medium text-gray-900 truncate">
              {snapshot?.companyName || record.customer?.companyName || "Unknown"}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {snapshot?.email || record.customer?.email || ""}
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
        <div className="text-gray-600">
          {date ? moment(date).format('MMM DD, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: "DUE DATE",
      dataIndex: "dueDate",
      width: 120,
      render: (date: string) => {
        const isOverdue = date && moment(date).isBefore(moment(), 'day');
        return (
          <div className={isOverdue ? "text-red-500 font-medium" : "text-gray-600"}>
            {date ? moment(date).format('MMM DD, YYYY') : '-'}
          </div>
        );
      },
    },
    {
      title: "AMOUNT",
      dataIndex: "total",
      width: 120,
      render: (v) => (
        <div className="font-semibold text-gray-900">
          ${Number(v).toFixed(2)}
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
                    icon={getStatusIcon(frontendStatus)}
                    className="hover:opacity-80 transition-opacity"
                    style={{
                      padding: "2px 6px",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 500,
                      lineHeight: "14px",
                    }}
                  >
                    {frontendStatus.replace('_', ' ')}
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
        const isFullyPaid = Number(v) === 0;
        return (
          <div className={isFullyPaid ? "text-green-600 font-medium" : "text-gray-900 font-semibold"}>
            ${Number(v).toFixed(2)}
            {isFullyPaid && <CheckCircleOutlined className="ml-1 text-green-500" />}
          </div>
        );
      },
    },
    {
      title: "ACTIONS",
      align: "center",
      width: 80,
      render: (_, record) => {
        const menu = (
          <Menu items={getMenuItems(record)} />
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
              icon={<MoreOutlined className="text-gray-500 hover:text-gray-700" />}
              className="hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
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



  return (
    <MainLayout>
      {contextHolder}
      <div className="p-3">
        {/* Invoices Table */}
        <Card className="shadow-sm border-gray-200">
          {/* Header */}
          <div className="flex flex-row items-center justify-between gap-4 mb-3 flex-nowrap">
            <div className="flex flex-col shrink-0">
              <div className="flex items-center space-x-3">
                <FormOutlined style={{ fontSize: 24, color: "#1677ff" }} />
                <Title level={2} className="!mb-0 !text-gray-900">
                  Invoices
                </Title>
              </div>

              <Text type="secondary" className=" mt-1">
                Manage, track payments, and monitor invoice statuses across customers.
              </Text>

              <div className="flex flex-wrap gap-2  mt-2">
                <Tag color="pink">
                  Total Invoice: <strong>{totalCount}</strong>
                </Tag>

                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Paid: <strong>{paidCount}</strong>
                </Tag>

                <Tag color="blue" icon={<ClockCircleOutlined />}>
                  Pending: <strong>{pendingCount}</strong>
                </Tag>

                <Tag color="purple">
                  Customers: <strong>{customerCount}</strong>
                </Tag>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-row items-center gap-3 flex-nowrap">
              <Input.Search
                placeholder="Search invoices..."
                allowClear
                size="middle"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64"
              />

              <Popover content={filterContent} trigger="click" placement="bottomRight">
                <Button size="middle" icon={<FunnelPlotOutlined />}>
                  Filter
                </Button>
              </Popover>

              <Button
                type="primary"
                size="middle"
                icon={<PlusOutlined />}
                onClick={() => router.push("/invoicepro/newinvoice")}
                className="h-11 shrink-0"
              >
                New Invoice
              </Button>
            </div>
          </div>

          <Divider style={{marginTop:"0"}} />

          {/* Bulk Action Bar */}
          {selectedRowKeys.length > 0 && (
            <div className="mb-3">
              <Alert
                message={
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {selectedRowKeys.length} invoice(s) selected
                    </span>
                    <Space size="middle">
                      <Button
                        icon={<MailOutlined />}
                        onClick={() => messageApi.info('Send email feature coming soon')}
                      >
                        Send Email
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        loading={isDownloading}
                        onClick={handleBulkDownload}
                      >
                        Download Selected
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={openBulkDeleteModal}
                        loading={bulkDeleteProgress.isDeleting}
                      >
                        Delete Selected
                      </Button>
                    </Space>
                  </div>
                }
                type="info"
                className="mb-0"
                closable
                onClose={() => {
                  setSelectedRowKeys([]);
                  setSelectedInvoices([]);
                }}
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingOutlined className="text-3xl text-blue-500" spin />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <ExclamationCircleOutlined className="text-4xl text-red-500 mb-4" />
              <Title level={4} className="!text-gray-700">Failed to load invoices</Title>
              <Text type="secondary">Please try again later</Text>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl text-gray-300 mb-4">📄</div>
              <Title level={4} className="!text-gray-500">No invoices found</Title>
              <Text type="secondary" className="mb-6 block">
                {searchText ? 'Try a different search term' : 'Create your first invoice to get started'}
              </Text>
              {!searchText && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => router.push("/invoicepro/newinvoice")}
                >
                  Create First Invoice
                </Button>
              )}
            </div>
          ) : (
            <Table
              size="small"
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
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`,
              }}
              scroll={{ x: 1000 }}
            />
          )}
        </Card>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        title="Delete Selected Invoices"
        open={bulkDeleteModalVisible}
        onCancel={closeBulkDeleteModal}
        onOk={startBulkDelete}
        okText={`Delete ${selectedInvoices.length} Invoices`}
        okType="danger"
        cancelText="Cancel"
        width={500}
      >
        <div className="py-4">
          <div className="flex items-center mb-3">
            <ExclamationCircleOutlined className="text-xl text-red-500 mr-2" />
            <Text strong>Are you sure you want to delete {selectedInvoices.length} selected invoice(s)?</Text>
          </div>
          
          <div className="mb-4 max-h-60 overflow-y-auto border rounded p-2">
            <Text type="secondary" className="block mb-2">Selected Invoices:</Text>
            <ul className="list-disc pl-4">
              {selectedInvoices.slice(0, 10).map((inv, index) => (
                <li key={inv.id} className="text-sm mb-1">
                  <Text strong>{inv.invoiceNumber}</Text>
                  <Text type="secondary" className="ml-2">
                    - ${Number(inv.total || 0).toFixed(2)}
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
            message="Warning: This action cannot be undone"
            description="All selected invoices and their associated data will be permanently deleted."
            type="warning"
            showIcon
          />
        </div>
      </Modal>

      {/* Bulk Delete Progress Modal */}
      <Modal
        title="Deleting Invoices..."
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
              <LoadingOutlined className="text-blue-500 mr-2" spin={bulkDeleteProgress.isDeleting} />
              <Text type="secondary">
                Deleting invoice: <Text strong>{bulkDeleteProgress.currentInvoice}</Text>
              </Text>
            </div>
          )}
          
          {!bulkDeleteProgress.isDeleting && (
            <div className="text-center">
              <Text type="success" strong>
                {bulkDeleteProgress.failed === 0 ? 'All invoices deleted successfully!' : 'Deletion completed!'}
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
                Please wait while invoices are being deleted...
              </Text>
            </div>
          )}
        </div>
      </Modal>

      {/* Single Delete Confirmation Modal */}
      <Modal
        title="Delete Invoice"
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setInvoiceToDelete(null);
        }}
        onOk={handleDeleteInvoice}
        confirmLoading={deletingId === invoiceToDelete?.id}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        width={500}
      >
        {invoiceToDelete && (
          <div className="py-4">
            <div className="flex items-center mb-3">
              <ExclamationCircleOutlined className="text-xl text-red-500 mr-2" />
              <Text strong>Are you sure you want to delete this invoice?</Text>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Text type="secondary" className="block text-sm">Invoice Number</Text>
                  <Text strong className="text-lg">{invoiceToDelete.invoiceNumber}</Text>
                </div>
                <div>
                  <Text type="secondary" className="block text-sm">Amount</Text>
                  <Text strong className="text-lg">${Number(invoiceToDelete.total || 0).toFixed(2)}</Text>
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
              message="Warning: This action cannot be undone"
              description="All invoice data, including PDF files and transaction history, will be permanently deleted."
              type="warning"
              showIcon
            />
          </div>
        )}
      </Modal>

      {/* Payment Status Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <DollarOutlined className="text-green-500 mr-2" />
            Update Payment for Invoice {statusInvoice?.invoiceNumber}
          </div>
        }
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          statusForm.resetFields();
        }}
        onOk={handlePaymentUpdate}
        confirmLoading={updateStatusMutation.isPending}
        okText="Update Payment"
        cancelText="Cancel"
        width={500}
      >
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold">
                ${Number(statusInvoice?.total || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Balance Due</div>
              <div className="text-2xl font-bold text-blue-600">
                ${Number(statusInvoice?.balanceDue || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <Form form={statusForm} layout="vertical">
          <Form.Item
            label="Paid Amount"
            name="paidAmount"
            rules={[
              { required: true, message: "Please enter paid amount" },
              {
                validator: (_, value) => {
                  const balanceDue = Number(statusInvoice?.balanceDue || 0);
                  const paidAmount = Number(value || 0);

                  if (paidAmount > balanceDue) {
                    return Promise.reject(new Error(`Amount cannot exceed balance due ($${balanceDue.toFixed(2)})`));
                  }
                  if (paidAmount <= 0) {
                    return Promise.reject(new Error('Amount must be greater than 0'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input
              type="number"
              min={0.01}
              max={statusInvoice?.balanceDue}
              placeholder="0.00"
              prefix="$"
              size="large"
              step="0.01"
            />
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="paymentMethod"
            initialValue="BANK_TRANSFER"
            rules={[{ required: true, message: "Please select payment method" }]}
          >
            <Select size="large">
              <Select.Option value="BANK_TRANSFER">Bank Transfer</Select.Option>
              <Select.Option value="CREDIT_CARD">Credit Card</Select.Option>
              <Select.Option value="CASH">Cash</Select.Option>
              <Select.Option value="CHECK">Check</Select.Option>
              <Select.Option value="OTHER">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Description / Note" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Enter note for payment (optional)"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Payment Date"
            name="paidAt"
            rules={[{ required: true, message: "Please select payment date" }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              size="large"
              defaultValue={moment()}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Approval Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <CheckCircleOutlined className="text-green-500 mr-2" />
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
        title={`Change Status for Invoice ${statusChangeInvoice?.invoiceNumber}`}
        open={statusChangeModalVisible}
        onCancel={() => {
          setStatusChangeModalVisible(false);
          setSelectedNewStatus(null);
        }}
        onOk={handleGeneralStatusUpdate}
        confirmLoading={updateStatusMutation.isPending}
        okText="Update Status"
        cancelText="Cancel"
        width={400}
      >
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">Current Status</div>
          <Tag
            color={getStatusColor(fromBackendStatus(statusChangeInvoice?.status))}
            icon={getStatusIcon(fromBackendStatus(statusChangeInvoice?.status))}
            className="text-sm font-medium"
          >
            {fromBackendStatus(statusChangeInvoice?.status)}
          </Tag>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">Select New Status</div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select new status"
            size="large"
            onChange={(value) => setSelectedNewStatus(value)}
            options={getAvailableTransitions(fromBackendStatus(statusChangeInvoice?.status)).map(status => ({
              label: (
                <div className="flex items-center">
                  {getStatusIcon(status)}
                  <span className="ml-2">{status}</span>
                </div>
              ),
              value: status
            }))}
          />
        </div>

        {(selectedNewStatus === 'PAID' || selectedNewStatus === 'PARTIALLY_PAID') && (
          <Alert
            message="Payment information will be required"
            description="You'll need to enter payment details for this status change."
            type="info"
            showIcon
            className="mb-2"
          />
        )}
      </Modal>

      {/* Transaction History Drawer */}


<Drawer
  title={
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
        <DollarOutlined className="text-white text-sm" />
      </div>
      <div>
        <div className="font-semibold text-base text-gray-900">Payment Transaction History</div>
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
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
      <span className="mt-3 text-gray-500 text-xs">Loading payment history...</span>
    </div>
  ) : !paymentHistory ? (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-5xl mb-3 text-gray-300">💳</div>
      <div className="text-base font-medium text-gray-700 mb-1">No payment history found</div>
      <p className="text-xs text-gray-500">This invoice has no recorded payments yet.</p>
    </div>
  ) : (
    <div className="space-y-4">
      {/* Invoice Summary - Single Line Metrics with Colors */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Invoice info */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-gray-500">Invoice</span>
              <div className="font-semibold text-gray-900">
                {paymentHistory?.summary?.invoiceNumber || transactionInvoice?.invoiceNumber}
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div>
              <span className="text-xs text-gray-500">Customer</span>
              <div className="font-medium text-gray-900">
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
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <FileTextOutlined className="text-blue-500 text-xs" />
                Total
              </span>
              <div className="font-semibold text-gray-900">
                ${Number(paymentHistory?.summary?.totalAmount || transactionInvoice?.total || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircleOutlined className="text-green-600 text-xs" />
                Paid
              </span>
              <div className="font-semibold text-green-700">
                ${Number(paymentHistory?.summary?.totalPaid || transactionInvoice?.paidAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <RetweetOutlined className="text-orange-600 text-xs" />
                Refund
              </span>
              <div className="font-semibold text-orange-700">
                ${Number(paymentHistory?.summary?.totalRefunded || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <DollarOutlined className="text-blue-600 text-xs" />
                Balance
              </span>
              <div className="font-semibold text-blue-700">
                ${Number(paymentHistory?.summary?.balanceDue || transactionInvoice?.balanceDue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Progress Bar - Colored */}
        {Number(paymentHistory?.summary?.totalAmount || 0) > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Progress</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                  style={{ width: `${Math.min(100, Math.round((Number(paymentHistory?.summary?.totalPaid || 0) / Number(paymentHistory?.summary?.totalAmount || 1)) * 100))}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-blue-600">
                {Math.round((Number(paymentHistory?.summary?.totalPaid || 0) / Number(paymentHistory?.summary?.totalAmount || 1)) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status Counts - Colored Icons, 2-Digit Format */}
      <div className="grid grid-cols-5 gap-2">
        <div className="bg-white px-3 py-2 rounded-md border border-gray-200">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-semibold text-gray-800">
            {String(paymentHistory?.summary?.paymentCount || paymentHistory.payments.length).padStart(2, '0')}
          </div>
        </div>
        
        <div className="bg-white px-3 py-2 rounded-md border border-gray-200">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <CheckCircleOutlined className="text-green-600 text-xs" />
            Completed
          </div>
          <div className="text-lg font-semibold text-gray-800">
            {String(paymentHistory?.summary?.completedPayments || 
             paymentHistory.payments.filter((p: any) => p.status === 'COMPLETED').length).padStart(2, '0')}
          </div>
        </div>
        
        <div className="bg-white px-3 py-2 rounded-md border border-gray-200">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <RetweetOutlined className="text-orange-600 text-xs" />
            Refunded
          </div>
          <div className="text-lg font-semibold text-gray-800">
            {String(paymentHistory?.summary?.refundedPayments || 
             paymentHistory.payments.filter((p: any) => p.status === 'REFUNDED').length).padStart(2, '0')}
          </div>
        </div>
        
        <div className="bg-white px-3 py-2 rounded-md border border-gray-200">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <CloseCircleOutlined className="text-red-600 text-xs" />
            Failed
          </div>
          <div className="text-lg font-semibold text-gray-800">
            {String(paymentHistory?.summary?.failedPayments || 
             paymentHistory.payments.filter((p: any) => p.status === 'FAILED').length).padStart(2, '0')}
          </div>
        </div>
        
        <div className="bg-white px-3 py-2 rounded-md border border-gray-200">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <ClockCircleOutlined className="text-blue-600 text-xs" />
            Pending
          </div>
          <div className="text-lg font-semibold text-gray-800">
            {String(paymentHistory?.summary?.pendingPayments || 
             paymentHistory.payments.filter((p: any) => p.status === 'PENDING').length).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Payment Table - Compact */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center">
              <FileTextOutlined className="text-blue-600 text-xs" />
            </div>
            <span className="font-medium text-gray-800 text-sm">Payment Transactions</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
              {paymentHistory.payments.length}
            </span>
          </div>
          <Button 
            size="small" 
            icon={<ReloadOutlined />}
            onClick={() => refetchPaymentHistory()}
            loading={isPaymentLoading}
            className="text-xs border-gray-300"
          />
        </div>

        {!paymentHistory.payments || paymentHistory.payments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 text-sm">No payment transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-left text-gray-600 font-medium">Date & Time</th>
                    <th className="px-4 py-2.5 text-right text-gray-600 font-medium">Amount</th>
                    <th className="px-4 py-2.5 text-center text-gray-600 font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right text-gray-600 font-medium">Paid</th>
                    <th className="px-4 py-2.5 text-right text-gray-600 font-medium">Balance</th>
                    <th className="px-4 py-2.5 text-left text-gray-600 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentHistory.payments.map((payment: any, index: number) => (
                    <tr key={payment.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-800">
                          {payment.date || moment(payment.paymentDate).format('MMM DD, YYYY')}
                        </div>
                        <div className="text-gray-400">
                          {payment.time || moment(payment.paymentDate).format('HH:mm')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className={`font-medium ${payment.status === 'REFUNDED' ? 'text-orange-600' : 'text-gray-800'}`}>
                          {payment.status === 'REFUNDED' ? '−' : ''}${Number(payment.amount || 0).toLocaleString()}
                        </span>
                        <div className="text-gray-400 text-[10px]">
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
                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-green-700">
                        ${Number(payment.totalPaid || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-blue-700">
                        ${Number(payment.balanceDue || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-600">
                          {payment.description || <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Simple Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <ClockCircleOutlined className="text-blue-600 text-xs" />
            </div>
            <span className="font-medium text-gray-800 text-sm">Payment Timeline</span>
            <span className="text-xs text-gray-500 ml-auto">Recent transactions</span>
          </div>
          
          <div className="space-y-2">
            {paymentHistory.payments.slice(0, 3).map((payment: any, idx: number) => (
              <div key={idx} className="flex gap-2 relative">
                {idx < Math.min(paymentHistory.payments.length, 3) - 1 && (
                  <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-gray-200"></div>
                )}
                <div className={`
                  w-4 h-4 rounded-full mt-0.5 flex items-center justify-center flex-shrink-0
                  ${payment.status === 'COMPLETED' ? 'bg-green-500' : ''}
                  ${payment.status === 'REFUNDED' ? 'bg-orange-500' : ''}
                  ${payment.status === 'FAILED' ? 'bg-red-500' : ''}
                  ${payment.status === 'PENDING' ? 'bg-blue-500' : ''}
                  ${!['COMPLETED','REFUNDED','FAILED','PENDING'].includes(payment.status) ? 'bg-gray-400' : ''}
                `}>
                  {payment.status === 'COMPLETED' && <CheckCircleOutlined className="text-white text-[8px]" />}
                  {payment.status === 'REFUNDED' && <RetweetOutlined className="text-white text-[8px]" />}
                  {payment.status === 'FAILED' && <CloseCircleOutlined className="text-white text-[8px]" />}
                  {payment.status === 'PENDING' && <ClockCircleOutlined className="text-white text-[8px]" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-gray-900 text-sm">
                        ${Number(payment.amount || 0).toLocaleString()} 
                      </span>
                      <span className="text-xs text-gray-600 ml-2">
                        {payment.description || 'Payment processed'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {payment.date || moment(payment.paymentDate).format('MMM DD · HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      {payment.paymentMethod?.replace('_', ' ') || 'Bank Transfer'}
                    </span>
                    {payment.processedBy && (
                      <span className="text-[10px] text-gray-500">
                        by {payment.processedBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {paymentHistory.payments.length > 3 && (
            <div className="text-center mt-3 pt-2 border-t border-gray-100">
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mx-auto">
                View all {paymentHistory.payments.length} transactions
                <ArrowRightOutlined className="text-[10px]" />
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
    





    </MainLayout>
  );
}