


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
  Badge,
  Tooltip,
  Alert,
  Popover,
  Divider,
  Spin,
  Empty,
  message,
  Menu,
  Progress,
  Select,
  DatePicker
} from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  RollbackOutlined,
  MoreOutlined,
  FilterOutlined,
  DownloadOutlined,
  LoadingOutlined,
  FunnelPlotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import isBetween from "dayjs/plugin/isBetween";

import { 
  useDeletedInvoices, 
  useRestoreInvoice, 
  useBulkRestoreInvoices, 
  usePermanentDeleteInvoice, 
  useBulkPermanentDeleteInvoices 
} from "@/hooks/useInvoices";

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

// Status icon mapping
const getStatusIcon = (status: InvoiceStatus) => {
  const icons: Record<InvoiceStatus, React.ReactNode> = {
    'DRAFT': <ClockCircleOutlined />,
    'PENDING': <ClockCircleOutlined />,
    'APPROVED': <CheckCircleOutlined />,
    'SENT': <CheckCircleOutlined />,
    'PAID': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    'PARTIALLY_PAID': <CheckCircleOutlined style={{ color: '#faad14' }} />,
    'OVERDUE': <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
    'CANCELLED': <CheckCircleOutlined style={{ color: '#bfbfbf' }} />
  };
  return icons[status] || <ClockCircleOutlined />;
};

export default function InvoiceTrashPage() {
  const router = useRouter();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const { canReadInvoice, canDeleteInvoice } = usePermission();
  const { isLoading: authLoading } = useAuth();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadInvoice) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadInvoice, router]);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // Hooks
  const { data, isLoading, refetch } = useDeletedInvoices({
    page: pagination.page,
    limit: pagination.limit,
    search: searchText
  });

  const restoreMutation = useRestoreInvoice();
  const bulkRestoreMutation = useBulkRestoreInvoices();
  const permanentDeleteMutation = usePermanentDeleteInvoice();
  const bulkDeleteMutation = useBulkPermanentDeleteInvoices();

  const invoices = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  // Calculate stats

  const customerCount = new Set(invoices.map((i: any) => i.customerId)).size;

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

  /* ================= HANDLERS ================= */

  const handleRestore = (record: any) => {
    modal.confirm({
      title: 'Restore Invoice',
      icon: <RollbackOutlined style={{ color: '#52c41a' }} />,
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
      icon: <RollbackOutlined style={{ color: '#52c41a' }} />,
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
      icon: <RollbackOutlined style={{ color: '#52c41a' }} />,
      label: "Restore",
      onClick: () => handleRestore(record),
    },
    ...(canDeleteInvoice ? [
      {
        key: "delete",
        icon: <DeleteOutlined />,
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
        <Text strong style={{ color: '#1890ff' }}>
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
        return (
          <div>
            <div className="font-medium text-gray-900">
              {snapshot?.companyName || record.customer?.companyName || "Unknown"}
            </div>
            <div className="text-xs text-gray-500">
              {snapshot?.email || record.customer?.email || ""}
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
        <div className="text-gray-600">
          {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: "DUE DATE",
      dataIndex: "dueDate",
      width: 100,
      render: (date: string) => (
        <div className="text-gray-600">
          {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: "DELETED ON",
      dataIndex: "deletedAt",
      width: 120,
      render: (date: string) => (
        <div className="text-gray-600">
          {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: "DELETED BY",
      dataIndex: "deletedByUser",
      width: 120,
      render: (user) => user?.name || "System",
    },
    {
      title: "AMOUNT",
      dataIndex: "grandTotal",
      width: 100,
      align: 'right',
      render: (v) => (
        <div className="font-semibold text-gray-900">
          ${Number(v || 0).toFixed(2)}
        </div>
      ),
    },
    {
      title: "ACTIONS",
      align: "center",
      width: 60,
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
              icon={<MoreOutlined className="text-gray-500 hover:text-gray-700" />}
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
  };

  /* ================= FILTER ================= */
  const filteredInvoices = invoices.filter((inv) => {
    const snapshot = inv.customerSnapshot as any;
    const search = searchText?.toLowerCase().trim();

    const matchSearch =
      !search ||
      inv.invoiceNumber?.toLowerCase().includes(search) ||
      snapshot?.companyName?.toLowerCase().includes(search) ||
      snapshot?.name?.toLowerCase().includes(search) ||
      snapshot?.email?.toLowerCase().includes(search);

    if (!matchSearch) return false;

    if (statusFilter && inv.status !== statusFilter) {
      return false;
    }

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

  const filterContent = (
    <div className="w-72">
      <Space direction="vertical" size="middle" className="w-full">
        <div>
          <div className="text-sm font-medium mb-1">Filter by Date</div>
          <RangePicker
            className="w-full"
            value={dateRange as any}
            onChange={(values) => setDateRange(values)}
            allowClear
          />
        </div>

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
              { label: "Approved", value: "APPROVED" },
              { label: "Sent", value: "SENT" },
              { label: "Paid", value: "PAID" },
              { label: "Partially Paid", value: "PARTIALLY_PAID" },
              { label: "Overdue", value: "OVERDUE" },
              { label: "Cancelled", value: "CANCELLED" },
            ]}
          />
        </div>

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

  if (authLoading) return <MainLayout><Spin tip="Loading..." /></MainLayout>;
  if (!canReadInvoice) return null;

  return (
    <MainLayout>
      {messageContextHolder}
      {modalContextHolder}
      <div className="p-3">
        {/* Trash Table Card */}
        <Card className="shadow-sm border-gray-200">
          {/* Header */}
         {/* Header */}
<div className="flex flex-row items-center justify-between gap-4 mb-3 flex-nowrap">
  <div className="flex flex-col shrink-0">
    <div className="flex items-center space-x-3">
      <DeleteOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />
      <Title level={2} className="!mb-0 !text-gray-900">
        Invoice Trash
      </Title>
    </div>

    <Text type="secondary" className="mt-1">
      Manage and restore deleted invoices
    </Text>

    <div className="flex flex-wrap gap-2 mt-2">
      

      <Tag color="purple">
        Customers: <strong>{customerCount}</strong>
      </Tag>
      <Tag color="red">
        Deleted: <strong>{total}</strong>
      </Tag>
    </div>
  </div>

  {/* RIGHT */}
  <div className="flex flex-row items-center gap-3 flex-nowrap">
    <Input.Search
      placeholder="Search deleted invoices..."
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
      size="middle"
      icon={<ReloadOutlined />}
      onClick={() => refetch()}
      loading={isLoading}
    >
      Refresh
    </Button>

    <Button
      type="primary"
      size="middle"
      onClick={() => router.push("/invoicepro/invoices")}
      className="h-11 shrink-0"
    >
      Back to Invoices
    </Button>
  </div>
</div>

          <Divider style={{ marginTop: "0" }} />

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
                        icon={<RollbackOutlined />}
                        onClick={handleBulkRestore}
                        loading={bulkRestoreMutation.isPending}
                      >
                        Restore Selected
                      </Button>
                      {canDeleteInvoice && (
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={openBulkDeleteModal}
                          loading={bulkDeleteProgress.isDeleting}
                        >
                          Delete Permanently
                        </Button>
                      )}
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

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingOutlined className="text-3xl text-blue-500" spin />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl text-gray-300 mb-4">🗑️</div>
              <Title level={4} className="!text-gray-500">No deleted invoices found</Title>
              <Text type="secondary" className="mb-6 block">
                {searchText ? 'Try a different search term' : 'Deleted invoices will appear here'}
              </Text>
              <Button
                type="primary"
                onClick={() => router.push("/invoicepro/invoices")}
              >
                Go to Invoices
              </Button>
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
                total: total,
                current: pagination.page,
                pageSize: pagination.limit,
                onChange: (page, limit) => setPagination({ page, limit }),
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} deleted invoices`,
                pageSizeOptions: ['10', '20', '50', '100']
              }}
              scroll={{ x: 1200 }}
            />
          )}
        </Card>
      </div>

      {/* Single Delete Confirmation Modal */}
      <Modal
        title="Permanently Delete Invoice"
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
      >
        {invoiceToDelete && (
          <div className="py-4">
            <div className="flex items-center mb-3">
              <ExclamationCircleOutlined className="text-xl text-red-500 mr-2" />
              <Text strong>Are you sure you want to permanently delete this invoice?</Text>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Text type="secondary" className="block text-sm">Invoice Number</Text>
                  <Text strong className="text-lg">{invoiceToDelete.invoiceNumber}</Text>
                </div>
                <div>
                  <Text type="secondary" className="block text-sm">Amount</Text>
                  <Text strong className="text-lg">${Number(invoiceToDelete.grandTotal || 0).toFixed(2)}</Text>
                </div>
                <div className="col-span-2">
                  <Text type="secondary" className="block text-sm">Customer</Text>
                  <Text strong>
                    {(invoiceToDelete.customerSnapshot as any)?.companyName || "Unknown"}
                  </Text>
                </div>
              </div>
            </div>
            <Alert
              message="Warning: This action cannot be undone"
              description="All invoice data will be permanently deleted from the system."
              type="warning"
              showIcon
            />
          </div>
        )}
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        title="Delete Selected Invoices"
        open={bulkDeleteModalVisible}
        onCancel={() => setBulkDeleteModalVisible(false)}
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
                    - ${Number(inv.grandTotal || 0).toFixed(2)}
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
            description="All selected invoices will be permanently deleted."
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
                Deleting: <Text strong>{bulkDeleteProgress.currentInvoice}</Text>
              </Text>
            </div>
          )}
          
          {!bulkDeleteProgress.isDeleting && (
            <div className="text-center">
              <Button type="primary" onClick={cancelBulkDelete} block>
                OK
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </MainLayout>
  );
}