'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Alert,
  DatePicker,
  InputNumber,
  Dropdown,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Avatar,
  Divider,
  Empty,
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  FilterOutlined,
  DownloadOutlined,
  BankOutlined,
  WalletOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { TransactionsService, Transaction, CreateTransactionData, UpdateTransactionData, TransactionSummary } from '@/services/transactionsService';
import { MembersService, Member } from '@/services/membersService';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { ApiError } from '@/lib/axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { usePermission } from '@/hooks/usePermission';
import { TimeTrackingHeader } from '@/components/time-tracking/TimeTrackingHeader';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface TransactionFormData {
  type: 'credit' | 'debit';
  amount: number;
  member: string;
  category: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'refund' | 'other';
  description: string;
  notes?: string;
  date: dayjs.Dayjs;
}

/* ================= ATTRACTIVE METRIC CARDS ================= */
const StatCard = ({ label, value, icon: Icon, color, subValue }: any) => (
  <Card
    styles={{ body: { padding: "10px 14px" } }}
    style={{
      borderRadius: 16,
      border: "1px solid var(--accounts-stat-border)",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      height: "100%",
      backgroundColor: "var(--accounts-stat-bg)"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: "var(--accounts-stat-label)", fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{label}</Text>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accounts-stat-value)", marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        {subValue && (
          <div style={{ fontSize: 10, color: "var(--accounts-stat-sub)", marginTop: 2 }}>{subValue}</div>
        )}
      </div>
      <div style={{
        color,
        background: `${color}15`,
        padding: 8,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginLeft: 8,
        boxShadow: `0 0 12px ${color}08`
      }}>
        <Icon size={18} />
      </div>
    </div>
  </Card>
);

export default function AccountsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm();
  const { canReadTransaction, canManageTransactions: canManage, canDeleteTransaction } = usePermission();

  // Protect route - requires transaction.read permission
  useEffect(() => {
    if (!isLoading && user && !canReadTransaction) {
      router.push('/dashboard');
    }
  }, [user, isLoading, canReadTransaction, router]);

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Summary data
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Pagination and filtering
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [memberFilter, setMemberFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [breakdownDrawerVisible, setBreakdownDrawerVisible] = useState(false);

  // Expense categories
  const { data: expenseCategories = [], isLoading: categoriesLoading } = useExpenseCategories();

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const filters = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm || undefined,
        type: typeFilter as 'credit' | 'debit' | undefined,
        category: categoryFilter || undefined,
        member: memberFilter || undefined,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      };

      const response = await TransactionsService.getTransactions(filters);
      setTransactions(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      console.error('Fetch transactions error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to fetch transactions');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);

      const startDate = dateRange?.[0]?.toISOString();
      const endDate = dateRange?.[1]?.toISOString();

      const summary = await TransactionsService.getSummary(startDate, endDate);
      setSummary(summary);
    } catch (error) {
      console.error('Fetch summary error:', error);
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  // Fetch members
  const fetchMembers = async () => {
    try {
      const response = await MembersService.getMembers({ limit: 100 });
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchSummary();
      fetchMembers();
    }
  }, [user, pagination.current, pagination.pageSize, searchTerm, typeFilter, categoryFilter, memberFilter, dateRange]);

  // Handle form submission
  const handleSubmit = async (values: TransactionFormData) => {
    try {
      setFormLoading(true);
      setError('');

      // Ensure amount is a valid number
      const amount = Number(values.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Amount must be a valid number greater than 0');
        setFormLoading(false);
        return;
      }

      if (modalType === 'edit' && selectedTransaction) {
        // For edit mode, don't send member field (backend doesn't allow changing it)
        const updatePayload: UpdateTransactionData = {
          type: values.type,
          amount: amount,
          category: values.category,
          description: values.description,
          notes: values.notes || '',
          date: values.date.toDate(),
        };

        await TransactionsService.updateTransaction(selectedTransaction.id, updatePayload);
        setSuccess('Transaction updated successfully');
      } else {
        // For create mode, include member field
        const createPayload: CreateTransactionData = {
          type: values.type,
          amount: amount,
          member: values.member,
          category: values.category,
          description: values.description,
          notes: values.notes || '',
          date: values.date.toDate(),
        };

        await TransactionsService.createTransaction(createPayload);
        setSuccess('Transaction created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedTransaction(null);
      fetchTransactions();
      fetchSummary();
    } catch (error) {
      console.error('Transaction operation error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Operation failed');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTransaction) return;

    try {
      setFormLoading(true);

      await TransactionsService.deleteTransaction(selectedTransaction.id);
      setSuccess('Transaction deleted successfully');
      setIsModalVisible(false);
      setSelectedTransaction(null);
      fetchTransactions();
      fetchSummary();
    } catch (error) {
      console.error('Delete transaction error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Delete failed');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Modal handlers
  const showAddModal = () => {
    setModalType('add');
    form.resetFields();
    form.setFieldsValue({ date: dayjs() });
    setSelectedTransaction(null);
    setIsModalVisible(true);
  };

  const showEditModal = (transaction: Transaction) => {
    setModalType('edit');
    setSelectedTransaction(transaction);

    // Properly prefill form fields with correct data types
    form.setFieldsValue({
      type: transaction.type,
      amount: Number(transaction.amount), // Ensure amount is a number
      member: typeof transaction.member === 'object' ? transaction.member.id : transaction.member,
      category: transaction.category,
      description: transaction.description,
      notes: transaction.notes || '',
      date: dayjs(transaction.date),
    });
    setIsModalVisible(true);
  };

  const showDeleteModal = (transaction: Transaction) => {
    setModalType('delete');
    setSelectedTransaction(transaction);
    setIsModalVisible(true);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      salary: '#52c41a',
      bonus: '#1677ff',
      client_payment: '#722ed1',
      expense: '#ff4d4f',
      office_expense: '#faad14',
      refund: '#13c2c2',
      other: '#8c8c8c',
    };
    return colors[category] || '#8c8c8c';
  };

  // Handle date range change
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  // Table columns
  const columns: ColumnsType<Transaction> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      render: (date: string) => (
        <Text style={{ fontSize: 12 }}>
          {dayjs(date).format('MMM DD, YYYY')}
        </Text>
      ),
      sorter: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag
          color={type === 'credit' ? 'green' : 'red'}
          icon={type === 'credit' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number, record: Transaction) => (
        <Text
          strong
          style={{
            fontSize: 13,
            color: record.type === 'credit' ? 'var(--accounts-emerald-text)' : 'var(--accounts-rose-text)',
          }}
        >
          {record.type === 'credit' ? '+' : '-'}{formatCurrency(amount)}
        </Text>
      ),
      sorter: true,
    },
    {
      title: 'Member',
      key: 'member',
      width: 150,
      render: (_, record: Transaction) => {
        const member: any = typeof record.member === 'object' ? record.member : null;
        return member ? (
          <Space>
            <Avatar
              size={24}
              src={member?.avatarUrl}
              style={{
                backgroundColor: getCategoryColor(record.category),
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {member.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 12 }}>{member.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 10 }}>
                {member.position?.title || 'N/A'}
              </Text>
            </div>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag
          color={getCategoryColor(category)}
          style={{ fontSize: 10, fontWeight: 500 }}
        >
          {category.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string, record: Transaction) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Text style={{ fontSize: 12 }}>{text}</Text>
            {record.metadata?.invoiceId && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-md"
                style={{
                  border: '1px solid var(--accounts-invoice-border)',
                  backgroundColor: 'var(--accounts-invoice-bg)',
                  color: 'var(--accounts-invoice-text)',
                  fontWeight: 500
                }}
              >
                Invoice
              </span>
            )}
            {record.metadata?.source === 'invoice_module' && (
              <Tag color="geekblue" bordered={false} style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>INVOICE</Tag>
            )}
          </div>
          {record.notes && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.notes}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record: Transaction) => {
        if (!canManage) return null;

        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => showEditModal(record),
          },
        ];

        if (canDeleteTransaction) {
          menuItems.push({
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            onClick: () => showDeleteModal(record),
          });
        }

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
              style={{ width: 24, height: 24 }}
            />
          </Dropdown>
        );
      },
    },
  ];

  // Clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        background: "var(--customers-page-bg)",
        minHeight: "calc(100vh - 64px)"
      }}>
        <TimeTrackingHeader
          style={{ 
            padding: '9.5px 32px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-slate-100)',
            marginBottom: 0
          }}
          icon={<BankOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
          title="Accounts Management"
          description="Track company income, expenses, and transaction lifecycle."
          extra={
            <div className="flex items-center gap-3">
              <Button
                size="middle"
                icon={<PieChartOutlined size={16} />}
                onClick={() => setBreakdownDrawerVisible(true)}
                style={{ borderRadius: 8, height: 38, color: "var(--text-secondary)" }}
              >
                Breakdown
              </Button>
              {canManage && (
                <Button
                  type="primary"
                  size="middle"
                  icon={<PlusOutlined />}
                  style={{ borderRadius: 8, height: 38, padding: "0 16px", fontWeight: 600 }}
                  onClick={showAddModal}
                >
                  Add Transaction
                </Button>
              )}
            </div>
          }
        />

        <div style={{ padding: "16px 32px 32px 32px" }}>

          {/* Alerts */}
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16, fontSize: 13 }}
              onClose={() => setError('')}
            />
          )}
          {success && (
            <Alert
              message={success}
              type="success"
              showIcon
              closable
              style={{ marginBottom: 16, fontSize: 13 }}
              onClose={() => setSuccess('')}
            />
          )}

          {/* Summary Cards */}
          <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="Total Credits"
                value={formatCurrency(summary?.balance?.credits || 0)}
                icon={ArrowUpOutlined}
                color="#10b981"
                subValue={`${summary?.balance?.creditCount || 0} transactions`}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="Total Debits"
                value={formatCurrency(summary?.balance?.debits || 0)}
                icon={ArrowDownOutlined}
                color="#ef4444"
                subValue={`${summary?.balance?.debitCount || 0} transactions`}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="Net Balance"
                value={formatCurrency(summary?.balance?.net || 0)}
                icon={WalletOutlined}
                color="#3b82f6"
                subValue={`${summary?.balance?.totalCount || 0} total activity`}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="This Month"
                value={formatCurrency(summary?.monthlyTrend?.[summary.monthlyTrend.length - 1]?.net || 0)}
                icon={CalendarOutlined}
                color="#8b5cf6"
                subValue="Current month performance"
              />
            </Col>
          </Row>

          {/* Enhanced Single-Line Filter Bar */}
          <div style={{
            marginBottom: 16,
            padding: "8px 16px",
            background: "var(--bg-slate-50)",
            borderRadius: 12,
            border: "1px solid var(--border-slate-200)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "nowrap"
          }}>
            <div className="flex items-center gap-1.5 text-slate-400 mr-1">
              <FilterOutlined style={{ fontSize: 14 }} />
              <span className="text-[11px] font-semibold uppercase tracking-tight">Filters</span>
            </div>

            <div style={{ flex: 1, minWidth: 150 }}>
              <Input
                placeholder="Search..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="borderless"
                className="bg-white rounded-lg border-slate-200 hover:border-blue-400 transition-colors h-[34px] px-3 w-full border text-xs"
                allowClear
              />
            </div>

            <div style={{ width: 120 }}>
              <Select
                placeholder="Type"
                value={typeFilter}
                onChange={setTypeFilter}
                className="w-full h-[34px]"
                allowClear
                variant="borderless"
                style={{ background: 'var(--bg-pure-white)', borderRadius: 8, border: '1px solid var(--border-slate-200)', fontSize: '12px' }}
              >
                <Option value="credit">Credit</Option>
                <Option value="debit">Debit</Option>
              </Select>
            </div>

            <div style={{ width: 140 }}>
              <Select
                placeholder="Category"
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="w-full h-[34px]"
                allowClear
                variant="borderless"
                style={{ background: 'var(--bg-pure-white)', borderRadius: 8, border: '1px solid var(--border-slate-200)', fontSize: '12px' }}
              >
                {!categoriesLoading && expenseCategories.length > 0 ? (
                  expenseCategories.map((category) => (
                    <Option key={category.id} value={category.name}>
                      {category.name}
                    </Option>
                  ))
                ) : (
                  <Option disabled>No categories available</Option>
                )}
              </Select>
            </div>

            {canManage && (
              <div style={{ width: 140 }}>
                <Select
                  placeholder="Member"
                  value={memberFilter}
                  onChange={setMemberFilter}
                  className="w-full h-[34px]"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  variant="borderless"
                  style={{ background: 'var(--bg-pure-white)', borderRadius: 8, border: '1px solid var(--border-slate-200)', fontSize: '12px' }}
                >
                  {members.map((member) => (
                    <Option key={member.id} value={member.id}>
                      {member.name}
                    </Option>
                  ))}
                </Select>
              </div>
            )}

            <div style={{ width: 240 }}>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                className="w-full h-[34px] rounded-lg text-xs"
                style={{ background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-200)' }}
                variant="borderless"
              />
            </div>
          </div>

          <Row gutter={[20, 20]}>
            {/* Main Transactions Table */}
            <Col xs={24} lg={18}>
              {/* Transactions Table */}
              <Card
                size="small"
                styles={{ body: { padding: 0 } }}
                className="compact-table"
                style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-slate-200)' }}
              >
                <Table
                  columns={columns}
                  dataSource={transactions}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} transactions`,
                    onChange: (page, pageSize) => {
                      setPagination(prev => ({
                        ...prev,
                        current: page,
                        pageSize: pageSize || 10,
                      }));
                    },
                    size: 'small',
                  }}
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>

            {/* Sidebar - Recent Activity */}
            <Col xs={24} lg={6}>

              {/* Recent Transactions */}
              <Card
                title={
                  <Space size={8}>
                    <FileTextOutlined style={{ fontSize: 15, color: 'var(--accounts-emerald-text)' }} />
                    <span className="text-[13px] font-bold" style={{ color: 'var(--accounts-stat-value)' }}>Recent Activity</span>
                  </Space>
                }
                size="small"
                style={{ borderRadius: 16, border: '1px solid var(--accounts-card-border)', backgroundColor: 'var(--accounts-card-bg)', height: '100%' }}
                styles={{ body: { padding: 0, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' } }}
                className="hide-scrollbar"
              >
                {summary?.recentTransactions?.length > 0 ? (
                  <List
                    size="small"
                    dataSource={summary.recentTransactions}
                    renderItem={(item: Transaction) => {
                      const member = typeof item.member === 'object' ? item.member : null;
                      return (
                        <List.Item style={{ padding: '12px 16px', border: 'none' }}>
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                size={24}
                                style={{
                                  backgroundColor: item.type === 'credit' ? 'var(--accounts-emerald-bg)' : 'var(--accounts-rose-bg)',
                                  color: item.type === 'credit' ? 'var(--accounts-emerald-text)' : 'var(--accounts-rose-text)',
                                  fontSize: 11,
                                  fontWeight: 800
                                }}
                              >
                                {item.type === 'credit' ? '+' : '-'}
                              </Avatar>
                            }
                            title={
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <Text className="text-[11px] font-semibold truncate" style={{ color: 'var(--accounts-stat-value)' }}>{item.description}</Text>
                                {item.metadata?.invoiceId && (
                                  <span
                                    className="text-[9px] px-1.5 py-0.5 rounded-md inline"
                                    style={{
                                      border: '1px solid var(--accounts-invoice-border)',
                                      backgroundColor: 'var(--accounts-invoice-bg)',
                                      color: 'var(--accounts-invoice-text)',
                                      fontWeight: 500,
                                      width: 'fit-content',
                                      maxWidth: '60px'
                                    }}
                                  >
                                    Invoice
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <span className="text-[10px] font-medium truncate max-w-[50px]" style={{ color: 'var(--accounts-stat-sub)' }}>{member?.name || 'Unknown'}</span>
                                  <div className="w-0.5 h-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accounts-stat-sub)' }} />
                                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--accounts-stat-sub)' }}>{dayjs(item.date).format('MMM DD')}</span>
                                </div>
                              </div>
                            }
                            description={
                              <div className="mt-1">
                                <Text
                                  strong
                                  className="text-[11px] px-1.5 py-0.5 rounded-md"
                                  style={{
                                    backgroundColor: item.type === 'credit' ? 'var(--accounts-emerald-bg)' : 'var(--accounts-rose-bg)',
                                    color: item.type === 'credit' ? 'var(--accounts-emerald-text)' : 'var(--accounts-rose-text)'
                                  }}
                                >
                                  {formatCurrency(item.amount)}
                                </Text>
                              </div>
                            }
                          />
                        </List.Item>
                      );
                    }}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No recent transactions"
                    style={{ margin: '40px 0' }}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Transaction Modal */}
          <Modal
            title={
              modalType === 'add' ? 'Add New Transaction' :
                modalType === 'edit' ? 'Edit Transaction' : 'Delete Transaction'
            }
            open={isModalVisible}
            onCancel={() => {
              setIsModalVisible(false);
              form.resetFields();
              setSelectedTransaction(null);
            }}
            footer={null}
            width={modalType === 'delete' ? 400 : 600}
          >
            {modalType === 'delete' ? (
              <div>
                <Text>
                  Are you sure you want to delete this transaction?
                  This action cannot be undone.
                </Text>
                <div style={{ marginTop: 20, textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setIsModalVisible(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      danger
                      loading={formLoading}
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  </Space>
                </div>
              </div>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                size="middle"
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Form.Item
                    name="type"
                    label="Transaction Type"
                    rules={[{ required: true, message: 'Please select transaction type' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select type"
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      <Option value="credit" label="Credit (Money In)">
                        <Space>
                          <ArrowUpOutlined style={{ color: 'var(--accounts-emerald-text)' }} />
                          Credit (Money In)
                        </Space>
                      </Option>
                      <Option value="debit" label="Debit (Money Out)">
                        <Space>
                          <ArrowDownOutlined style={{ color: 'var(--accounts-rose-text)' }} />
                          Debit (Money Out)
                        </Space>
                      </Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="amount"
                    label="Amount"
                    rules={[
                      { required: true, message: 'Please enter amount' },
                      { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
                    ]}
                  >
                    <InputNumber
                      placeholder="0.00"
                      style={{ width: '100%' }}
                      formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/₹\s?|(,*)/g, '')}
                      precision={2}
                    />
                  </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Form.Item
                    name="member"
                    label="Member"
                    rules={[{ required: true, message: 'Please select member' }]}
                    tooltip={modalType === 'edit' ? 'Member cannot be changed when editing' : undefined}
                  >
                    <Select
                      placeholder="Select member"
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      disabled={modalType === 'edit'}
                    >
                      {members.map((member) => (
                        <Option key={member.id} value={member.id} label={member?.name}>
                          <Space>
                            <Avatar src={member?.avatarUrl} size={20} style={{ fontSize: 10 }}>
                              {member?.name.charAt(0)}
                            </Avatar>
                            {member?.name} - {member?.position?.title || 'N/A'}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: 'Please select category' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select category"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        String(option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {!categoriesLoading && expenseCategories.length > 0 ? (
                        expenseCategories.map((category) => (
                          <Option key={category.id} value={category.name}>
                            {category.name}
                          </Option>
                        ))
                      ) : (
                        <Option disabled>No categories available</Option>
                      )}
                    </Select>
                  </Form.Item>
                </div>

                <Form.Item
                  name="date"
                  label="Transaction Date"
                  rules={[{ required: true, message: 'Please select date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name="description"
                  label="Description"
                  rules={[{ required: true, message: 'Please enter description' }]}
                >
                  <Input placeholder="Enter transaction description" />
                </Form.Item>

                <Form.Item
                  name="notes"
                  label="Notes (Optional)"
                >
                  <TextArea
                    placeholder="Additional notes..."
                    rows={3}
                    maxLength={500}
                    showCount
                  />
                </Form.Item>

                <div style={{ textAlign: 'right', marginTop: 20 }}>
                  <Space>
                    <Button onClick={() => setIsModalVisible(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={formLoading}
                    >
                      {modalType === 'add' ? 'Add Transaction' : 'Update Transaction'}
                    </Button>
                  </Space>
                </div>
              </Form>
            )}
          </Modal>

          {/* Category Breakdown Drawer */}
          <Drawer
            title={
              <Space size={12}>
                <div style={{ background: 'var(--bg-blue-50)', padding: 8, borderRadius: 10, color: 'var(--text-blue-700)', display: 'flex' }}>
                  <PieChartOutlined style={{ fontSize: 18 }} />
                </div>
                <div style={{ lineHeight: 1.1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Category Breakdown</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>Detailed analysis of transactions by category</div>
                </div>
              </Space>
            }
            placement="right"
            width={450}
            onClose={() => setBreakdownDrawerVisible(false)}
            open={breakdownDrawerVisible}
            styles={{
              header: { borderBottom: '1px solid var(--border-slate-200)', padding: '20px 24px' },
              body: { padding: '24px' }
            }}
          >
            {summary?.categoryBreakdown?.length > 0 ? (
              <div className="flex flex-col gap-6">
                {summary.categoryBreakdown.map((item: any, index: number) => (
                  <div key={index} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/10 transition-all duration-300">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: getCategoryColor(item.category) }} />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{item.category.replace('_', ' ')}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">{formatCurrency(Math.abs(item.total))}</div>
                    </div>
                    <Progress
                      percent={Math.min(100, (Math.abs(item.total) / Math.max(...summary.categoryBreakdown.map((c: any) => Math.abs(c.total)))) * 100)}
                      strokeColor={getCategoryColor(item.category)}
                      size="small"
                      showInfo={false}
                      strokeWidth={8}
                      className="m-0"
                    />
                    <div className="mt-2 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span>{item.count} Transactions</span>
                      <span>{((Math.abs(item.total) / (summary.balance.credits + summary.balance.debits)) * 100).toFixed(1)}% of total</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No breakdown data available" />
            )}
          </Drawer>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar .ant-card-body::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar .ant-card-body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </MainLayout>
  );
}
