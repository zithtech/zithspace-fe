"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import {
  Space,
  Typography,
  Card,
  Table,
  Dropdown,
  Button,
  Input,
  Modal,
  Tag,
  Alert,
  Popover,
  Divider,
  Spin,
  message,
  Progress,
  Select,
  DatePicker,
  Row,
  Col
} from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  Trash2,
  RotateCcw,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  ArrowLeft,
  XCircle,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  ChevronRight,
  Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import isBetween from "dayjs/plugin/isBetween";

import { 
  useDeletedInvoices, 
  useRestoreInvoice, 
  useBulkRestoreInvoices, 
  usePermanentDeleteInvoice, 
  useBulkPermanentDeleteInvoices,
  invoiceKeys
} from "@/hooks/useInvoices";
import { useQueryClient } from "@tanstack/react-query";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

dayjs.extend(isBetween);

type InvoiceStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';

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

// Status icons using Lucide
const getStatusIcon = (status: InvoiceStatus) => {
  const icons: Record<InvoiceStatus, React.ReactNode> = {
    'DRAFT': <Clock size={14} />,
    'PENDING': <Clock size={14} />,
    'APPROVED': <CheckCircle size={14} />,
    'SENT': <CheckCircle size={14} />,
    'PAID': <CheckCircle size={14} className="text-green-500" />,
    'PARTIALLY_PAID': <Clock size={14} className="text-orange-500" />,
    'OVERDUE': <AlertCircle size={14} className="text-red-500" />,
    'CANCELLED': <XCircle size={14} className="text-gray-400" />
  };
  return icons[status] || <Clock size={14} />;
};

export default function InvoiceTrashPage() {
  const router = useRouter();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const { canReadInvoice, canDeleteInvoice } = usePermission();
  const { isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

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

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  // Hooks
  const { data, isLoading, isFetching, refetch } = useDeletedInvoices({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch
  });

  const restoreMutation = useRestoreInvoice();
  const bulkRestoreMutation = useBulkRestoreInvoices();
  const permanentDeleteMutation = usePermanentDeleteInvoice();
  const bulkDeleteMutation = useBulkPermanentDeleteInvoices();

  const invoices = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  // Client-side filtering for status and date range
  const filteredInvoices = invoices.filter((inv: any) => {
    let matches = true;
    if (statusFilter && inv.status !== statusFilter) matches = false;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const date = dayjs(inv.invoiceDate);
      if (!date.isBetween(dateRange[0], dateRange[1], 'day', '[]')) {
        matches = false;
      }
    }
    return matches;
  });

  // Calculate stats
  const customerCount = new Set(filteredInvoices.map((i: any) => i.customerId)).size;

  // Bulk delete state
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

  // Single delete state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRestore = (record: any) => {
    modal.confirm({
      title: 'Restore Invoice',
      icon: <RotateCcw size={20} className="text-green-500 mr-2" />,
      content: `Are you sure you want to restore invoice ${record.invoiceNumber}?`,
      okText: 'Restore',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await restoreMutation.mutateAsync(record.id);
          messageApi.success('Invoice restored successfully');
          refetch();
        } catch (error: any) {
          messageApi.error(error.message || 'Failed to restore invoice');
        }
      }
    });
  };

  const handleBulkRestore = () => {
    if (selectedRowKeys.length === 0) return;
    
    modal.confirm({
      title: 'Bulk Restore Invoices',
      icon: <RotateCcw size={20} className="text-green-500 mr-2" />,
      content: `Are you sure you want to restore ${selectedRowKeys.length} selected invoices?`,
      okText: 'Restore All',
      okType: 'primary',
      onOk: async () => {
        try {
          await bulkRestoreMutation.mutateAsync(selectedRowKeys as string[]);
          messageApi.success(`${selectedRowKeys.length} invoices restored successfully`);
          setSelectedRowKeys([]);
          setSelectedInvoices([]);
          refetch();
        } catch (error: any) {
          messageApi.error(error.message || 'Failed to restore invoices');
        }
      }
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
      messageApi.success('Invoice permanently deleted');
      setDeleteModalVisible(false);
      setInvoiceToDelete(null);
      setDeletingId(null);
      refetch();
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to delete invoice');
      setDeletingId(null);
    }
  };

  const openBulkDeleteModal = () => {
    if (selectedInvoices.length === 0) {
      messageApi.warning('Please select invoices to delete');
      return;
    }
    setBulkDeleteModalVisible(true);
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
      currentInvoice: 'Processing bulk deletion...',
      isDeleting: true
    });

    try {
      await bulkDeleteMutation.mutateAsync(ids);
      
      setBulkDeleteProgress(prev => ({
        ...prev,
        completed: selectedInvoices.length,
        currentInvoice: 'Finished'
      }));

    } catch (error: any) {
      console.error(`Bulk permanent delete failed:`, error);
      
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
      refetch();
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
      key: "restore",
      icon: <RotateCcw size={16} className="text-green-500" />,
      label: "Restore",
      onClick: () => handleRestore(record),
    },
    ...(canDeleteInvoice ? [
      {
        key: "delete",
        icon: <Trash2 size={16} />,
        label: deletingId === record.id ? "Deleting..." : "Delete Permanently",
        danger: true,
        disabled: deletingId === record.id,
        onClick: () => openDeleteModal(record),
      }
    ] : []),
  ];

  /* ================= TABLE COLUMNS ================= */
  const columns: ColumnsType<any> = [
    {
      title: "INVOICE NO",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      width: 140,
      render: (text) => (
        <Text strong style={{ color: '#2563eb', fontWeight: 700 }}>
          {text}
        </Text>
      ),
    },
    {
      title: "CUSTOMER",
      key: "customer",
      width: 220,
      render: (_, record) => {
        const snapshot = record.customerSnapshot as any;
        const companyName = snapshot?.companyName || record.customer?.companyName || "Unknown";
        return (
          <div className="flex items-center gap-3 truncate">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-xs font-bold shrink-0">
              {companyName.charAt(0)}
            </div>
            <div className="truncate">
              <div className="font-bold text-slate-800 truncate">
                {companyName}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
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
      width: 100,
      render: (date: string) => (
        <div className="text-slate-600">
          {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: "DUE DATE",
      dataIndex: "dueDate",
      width: 100,
      render: (date: string) => (
        <div className="text-slate-600 text-xs">
          {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: "DELETED ON",
      dataIndex: "deletedAt",
      width: 120,
      render: (date: string) => (
        <div className="text-slate-600 font-medium">
          {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: "AMOUNT",
      dataIndex: "grandTotal",
      width: 100,
      align: 'right',
      render: (v) => (
        <div className="font-semibold text-slate-800">
          ${Number(v || 0).toLocaleString()}
        </div>
      ),
    },
    {
      title: "ACTIONS",
      align: "center",
      width: 80,
      render: (_, record) => {
        const menuItems = getMenuItems(record);
        
        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreVertical size={18} className="text-slate-400" />}
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
  };

  const filterContent = (
    <div className="w-72 p-1">
      <Space direction="vertical" size="middle" className="w-full">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filter by Date</div>
          <RangePicker
            className="w-full rounded-lg"
            value={dateRange as any}
            onChange={(values) => setDateRange(values)}
            allowClear
          />
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filter by Status</div>
          <Select
            className="w-full"
            placeholder="Select status"
            allowClear
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
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

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            size="small"
            type="text"
            onClick={() => {
              setDateRange(null);
              setStatusFilter(null);
            }}
          >
            Reset
          </Button>
          <Button size="small" type="primary" className="rounded-md">
            Apply Filters
          </Button>
        </div>
      </Space>
    </div>
  );

  if (authLoading) return <MainLayout><div className="flex justify-center items-center h-screen"><Spin size="large" /></div></MainLayout>;
  if (!canReadInvoice) return null;

  return (
    <MainLayout>
      {messageContextHolder}
      {modalContextHolder}
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
              <div style={{ background: "#fef2f2", padding: 12, borderRadius: 14, color: "#ef4444", display: "flex" }}>
                <Trash2 size={28} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Invoice Trash</Title>
                <Text style={{ color: "#64748b", fontSize: 15 }}>Review and restore deleted invoices or remove them permanently.</Text>
              </div>
            </Space>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
            <Input.Search
              placeholder="Search deleted..."
              allowClear
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, borderRadius: 12 }}
            />
            <Popover content={filterContent} trigger="click" placement="bottomRight">
              <Button size="large" icon={<Filter size={18} />} style={{ borderRadius: 12, height: 44 }}>
                Filter
              </Button>
            </Popover>
            <Button
              size="large"
              icon={<RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />}
              onClick={async () => {
                await queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
                refetch();
              }}
              style={{ borderRadius: 12, height: 44 }}
            />
            <Button
              type="primary"
              size="large"
              icon={<ArrowLeft size={18} />}
              onClick={() => router.push("/invoice/invoices")}
              style={{ borderRadius: 12, height: 44, padding: "0 20px", fontWeight: 600 }}
            >
              Back to Invoices
            </Button>
          </div>
        </div>

        {/* ================= METRIC STATS ================= */}
        <Row gutter={[24, 24]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Total Deleted" value={total} icon={Trash2} color="#ef4444" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Affected Customers" value={customerCount} icon={Users} color="#8b5cf6" />
          </Col>
        </Row>

        <Divider style={{ marginTop: "0", borderTop: "1px solid #f1f5f9" }} />

        {/* ================= BULK ACTIONS ================= */}
        {selectedRowKeys.length > 0 && (
          <div className="mb-6">
            <Alert
              message={
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-700">
                    {selectedRowKeys.length} invoice(s) selected
                  </span>
                  <Space size="middle">
                    <Button
                      size="small"
                      icon={<RotateCcw size={14} />}
                      onClick={handleBulkRestore}
                      loading={bulkRestoreMutation.isPending}
                      className="rounded-md border-blue-200 text-blue-600"
                    >
                      Restore Selected
                    </Button>
                    {canDeleteInvoice && (
                      <Button
                        size="small"
                        danger
                        type="primary"
                        icon={<Trash2 size={14} />}
                        onClick={openBulkDeleteModal}
                        loading={bulkDeleteProgress.isDeleting}
                        className="rounded-md shadow-none"
                      >
                        Delete Permanently
                      </Button>
                    )}
                  </Space>
                </div>
              }
              type="info"
              className="bg-blue-50 border-blue-100 rounded-xl py-3 px-4"
              closable={false}
            />
          </div>
        )}

        {/* ================= TABLE ================= */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-slate-50 rounded-2xl border border-slate-100">
            <Spin size="large" />
            <Text className="mt-4 text-slate-500">Loading trashed invoices...</Text>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="size-20 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6">
              <Trash2 size={40} className="text-slate-200" />
            </div>
            <Title level={4} style={{ color: "#64748b" }}>No deleted invoices found</Title>
            <Text style={{ color: "#94a3b8" }} className="mb-6 block">
              {searchText ? 'Try a different search term' : 'The trash folder is currently empty'}
            </Text>
            <Button
              type="primary"
              size="large"
              icon={<ArrowLeft size={18} />}
              onClick={() => router.push("/invoice/invoices")}
              style={{ borderRadius: 12, height: 48, padding: "0 24px" }}
            >
              Return to Invoices
            </Button>
          </div>
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
              size="middle"
              rowSelection={rowSelection}
              columns={columns}
              dataSource={filteredInvoices.map((inv) => ({
                ...inv,
                key: inv.id,
              }))}
              pagination={{
                total: total,
                current: pagination.page,
                pageSize: pagination.limit,
                onChange: (page, limit) => setPagination({ page, limit }),
                showSizeChanger: true,
                showQuickJumper: true,
                style: { padding: "16px 24px" },
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} trashed invoices`,
              }}
              scroll={{ x: 1000 }}
              rowClassName={() => "trash-table-row"}
            />
          </Card>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .trash-table-row:hover {
          background-color: #fef2f2 !important;
        }
        .ant-table-thead > tr > th {
          background-color: #f1f5f9 !important;
          color: #475569 !important;
          font-weight: 600 !important;
          padding: 12px 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
      `}} />

      {/* Single Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <XCircle size={20} />
            <span>Permanently Delete Invoice</span>
          </div>
        }
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setInvoiceToDelete(null);
        }}
        onOk={handlePermanentDelete}
        confirmLoading={deletingId === invoiceToDelete?.id}
        okText="Delete Permanently"
        okType="danger"
        cancelText="Cancel"
        width={500}
        style={{ borderRadius: 16 }}
      >
        {invoiceToDelete && (
          <div className="py-4">
            <div className="flex items-center mb-4">
              <AlertCircle size={20} className="text-red-500 mr-2" />
              <Text strong className="text-slate-700">This action will remove all invoice records permanently.</Text>
            </div>
            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text type="secondary" className="block text-xs uppercase font-semibold">Invoice Number</Text>
                  <Text strong className="text-lg text-slate-800">{invoiceToDelete.invoiceNumber}</Text>
                </div>
                <div>
                  <Text type="secondary" className="block text-xs uppercase font-semibold">Amount</Text>
                  <Text strong className="text-lg text-slate-800">${Number(invoiceToDelete.grandTotal || 0).toLocaleString()}</Text>
                </div>
                <div className="col-span-2">
                  <Text type="secondary" className="block text-xs uppercase font-semibold">Customer</Text>
                  <Text strong className="text-slate-800 font-medium">
                    {(invoiceToDelete.customerSnapshot as any)?.companyName || "Unknown"}
                  </Text>
                </div>
              </div>
            </div>
            <Alert
              message="Irreversible Action"
              description="You will not be able to restore this invoice once it's deleted."
              type="warning"
              showIcon
              style={{ borderRadius: 12 }}
            />
          </div>
        )}
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 size={20} />
            <span>Delete Multiple Invoices</span>
          </div>
        }
        open={bulkDeleteModalVisible}
        onCancel={() => setBulkDeleteModalVisible(false)}
        onOk={startBulkDelete}
        okText={`Delete ${selectedInvoices.length} Invoices`}
        okType="danger"
        cancelText="Cancel"
        width={500}
        style={{ borderRadius: 16 }}
      >
        <div className="py-4">
          <div className="flex items-center mb-4 text-slate-700 font-medium">
            <Info size={20} className="text-red-500 mr-2" />
            Are you sure you want to delete {selectedInvoices.length} selected invoice(s)?
          </div>
          
          <div className="mb-4 max-h-60 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50">
            <Text type="secondary" className="block mb-2 text-xs uppercase font-semibold">Selected for deletion:</Text>
            <ul className="space-y-1">
              {selectedInvoices.slice(0, 10).map((inv) => (
                <li key={inv.id} className="text-sm flex justify-between items-center text-slate-600">
                  <span className="font-medium">{inv.invoiceNumber}</span>
                  <span className="text-slate-400">${Number(inv.grandTotal || 0).toLocaleString()}</span>
                </li>
              ))}
              {selectedInvoices.length > 10 && (
                <li className="text-xs text-slate-400 mt-2 italic">
                  ...and {selectedInvoices.length - 10} more
                </li>
              )}
            </ul>
          </div>
          
          <Alert
            message="Critical Warning"
            description="All selected invoices will be permanently removed from the database."
            type="error"
            showIcon
            style={{ borderRadius: 12 }}
          />
        </div>
      </Modal>

      {/* Bulk Delete Progress Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className="animate-spin text-blue-500" />
            <span>Processing Bulk Deletion</span>
          </div>
        }
        open={bulkDeleteProgress.visible}
        closable={false}
        maskClosable={false}
        footer={null}
        width={400}
        style={{ borderRadius: 16 }}
      >
        <div className="py-6">
          <div className="flex justify-between items-center mb-3">
            <Text className="text-slate-500 font-medium">Progress Status</Text>
            <Text strong className="text-blue-600">
              {bulkDeleteProgress.completed}/{bulkDeleteProgress.total}
            </Text>
          </div>
          
          <div className="mb-6">
            <Progress
              percent={Math.round((bulkDeleteProgress.completed / bulkDeleteProgress.total) * 100)}
              status={bulkDeleteProgress.failed > 0 ? "exception" : "active"}
              strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              strokeWidth={10}
            />
            <div className="flex justify-between text-xs font-semibold mt-2">
              <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Success: {bulkDeleteProgress.completed - bulkDeleteProgress.failed}</span>
              <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Failed: {bulkDeleteProgress.failed}</span>
            </div>
          </div>
          
          {bulkDeleteProgress.currentInvoice && (
            <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center gap-2">
              <Spin size="small" />
              <Text type="secondary" className="text-xs italic">
                {bulkDeleteProgress.currentInvoice}
              </Text>
            </div>
          )}
        </div>
      </Modal>
      <style dangerouslySetInnerHTML={{ __html: `
        .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          padding: 8px 16px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 2px solid #f1f5f9 !important;
        }
        .ant-table-tbody > tr > td {
          padding: 8px 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
      `}} />
    </MainLayout>
  );
}