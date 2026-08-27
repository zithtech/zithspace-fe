"use client";

import NoData from "@/components/common/NoData";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { TransactionsService, Transaction } from "@/services/transactionsService";
import {
  Space,
  Typography,
  Button,
  Table,
  message,
  Tooltip,
  Popconfirm,
  Input,
  Tag,
} from "antd";
import {
  Trash2,
  RefreshCcw,
  Search,
  ArrowLeft,
  AlertCircle,
  Clock,
  User,
} from "lucide-react";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

export default function AccountTrashPage() {
  const router = useRouter();
  const { canReadAccount: canReadAccountTrash, canDeleteAccount } = usePermission();

  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState("");

  const fetchTrash = async () => {
    if (!canReadAccountTrash) return;
    setLoading(true);
    try {
      const response = await TransactionsService.getTrashTransactions({
        page,
        limit: pageSize,
        search: searchText,
      });
      setTransactions(response.data);
      setTotal(response.pagination.total);
    } catch (error: any) {
      message.error(error.message || "Failed to fetch trash");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [page, pageSize, canReadAccountTrash]);

  const handleRestore = async (id: string) => {
    try {
      await TransactionsService.restoreTransaction(id);
      message.success("Transaction restored successfully");
      fetchTrash();
    } catch (error: any) {
      message.error(error.message || "Failed to restore transaction");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await TransactionsService.permanentlyDeleteTransaction(id);
      message.success("Transaction permanently deleted");
      fetchTrash();
    } catch (error: any) {
      message.error(error.message || "Failed to delete transaction");
    }
  };

  const columns = [
    {
      title: "Transaction",
      dataIndex: "description",
      key: "description",
      render: (text: string, record: Transaction) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" className="text-xs">
            {record.category || "No category"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record: Transaction) => (
        <Text type={record.type === 'credit' ? 'success' : 'danger'} strong>
          {record.type === 'credit' ? '+' : '-'}${amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (member: any) => (
        <Space size={8}>
          <User size={14} className="text-slate-400" />
          <Text>{typeof member === 'object' ? member.name : member}</Text>
        </Space>
      ),
    },
    {
      title: "Deleted",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm:ss")}>
          <Space size={4}>
            <Clock size={14} className="text-slate-400" />
            <Text type="secondary">{dayjs(date).fromNow()}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center" as const,
      render: (_: any, record: Transaction) => (
        <Space size={12}>
          <Tooltip title="Restore">
            <Button
              type="text"
              size="small"
              icon={<RefreshCcw size={16} className="text-blue-500" />}
              onClick={() => handleRestore(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Permanent Delete"
            description="This action cannot be undone. Are you sure?"
            onConfirm={() => handlePermanentDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Permanently">
              <Button
                type="text"
                size="small"
                icon={<Trash2 size={16} className="text-red-500" />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!canReadAccountTrash) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <AlertCircle size={48} className="text-slate-300 mb-4" />
          <Title level={4}>Access Denied</Title>
          <Paragraph type="secondary">
            You don't have permission to access the Accounts Trash.
          </Paragraph>
          <Button type="primary" onClick={() => router.push("/accounts/accounts-dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        <TimeTrackingHeader
          icon={<Trash2 size={20} color="#ef4444" />}
          title="Accounts Trash"
          description="View and manage soft-deleted transactions. Items here can be restored or permanently removed."
          extra={
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              Back
            </Button>
          }
        />

        <div className="mt-8 rounded-xl border overflow-hidden shadow-sm" style={{ background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-slate-100)' }}>
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <Input
                placeholder="Search trash..."
                prefix={<Search size={16} className="text-slate-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={fetchTrash}
                allowClear
              />
              <Button onClick={fetchTrash} type="primary" ghost>Search</Button>
            </div>
            <Text type="secondary" className="text-xs font-medium uppercase tracking-wider">
              {total} items in trash
            </Text>
          </div>

          <ZukvoLoadingOverlay loading={loading} message="">
            <Table
              columns={columns}
              dataSource={transactions}
              rowKey="id"
              pagination={{
                pageSizeOptions: [10, 20, 25, 50, 100], current: page,
                pageSize: pageSize,
                total: total,
                onChange: (p, s) => {
                  setPage(p);
                  setPageSize(s);
                },
                showSizeChanger: true,
                className: "p-4",
              }} locale={{ emptyText: <NoData /> }}
            />
          </ZukvoLoadingOverlay>
        </div>
      </div>
    </MainLayout>
  );
}
