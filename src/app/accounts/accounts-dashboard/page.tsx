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
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Avatar,
  Divider,
  Empty,
  Drawer,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
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

/* ================= PREMIUM METRIC CARDS ================= */
const StatCard = ({ label, value, icon: Icon, color, subValue, accent }: any) => (
  <div className="accounts-stat-card" style={{ ['--stat-accent' as any]: color }}>
    <div className="accounts-stat-card__glow" />
    <div className="accounts-stat-card__inner">
      <div className="accounts-stat-card__header">
        <span className="accounts-stat-card__label">{label}</span>
        <div className="accounts-stat-card__icon">
          <Icon size={16} />
        </div>
      </div>
      <div className="accounts-stat-card__value">{value}</div>
      <div className="accounts-stat-card__footer">
        {subValue && <span className="accounts-stat-card__sub">{subValue}</span>}
        {accent && <span className="accounts-stat-card__chip">{accent}</span>}
      </div>
      <div className="accounts-stat-card__bar">
        <span className="accounts-stat-card__bar-fill" />
      </div>
    </div>
  </div>
);

export default function AccountsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm();
  const {
    canReadAccount,
    canCreateAccount,
    canUpdateAccount,
    canDeleteAccount
  } = usePermission();

  // Protect route - requires account.read permission
  useEffect(() => {
    if (!isLoading && user && !canReadAccount) {
      router.push('/dashboard');
    }
  }, [user, isLoading, canReadAccount, router]);

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
  const [thisMonthOnly, setThisMonthOnly] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [breakdownDrawerVisible, setBreakdownDrawerVisible] = useState(false);
  const [recentDrawerVisible, setRecentDrawerVisible] = useState(false);

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
    setThisMonthOnly(false);
  };

  // Handle "This Month" toggle
  const handleThisMonthToggle = (checked: boolean) => {
    setThisMonthOnly(checked);
    if (checked) {
      setDateRange([dayjs().startOf('month'), dayjs().endOf('month')]);
    } else {
      setDateRange(null);
    }
  };

  // Table columns
  const columns: ColumnsType<Transaction> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (date: string) => (
        <div className="flex flex-col" style={{ lineHeight: 1.25 }}>
          <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--accounts-stat-value)' }}>
            {dayjs(date).format('MMM DD, YYYY')}
          </Text>
          <Text style={{ fontSize: 10.5, color: 'var(--accounts-stat-sub)', fontVariantNumeric: 'tabular-nums' }}>
            {dayjs(date).format('hh:mm A')}
          </Text>
        </div>
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
      width: 140,
      render: (amount: number, record: Transaction) => (
        <Text
          strong
          style={{
            fontSize: 13,
            paddingLeft: 14,
            display: 'inline-block',
            fontVariantNumeric: 'tabular-nums',
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
      width: 240,
      render: (_, record: Transaction) => {
        const member: any = typeof record.member === 'object' ? record.member : null;
        return member ? (
          <Space size={10} align="center">
            <Avatar
              size={28}
              src={member?.avatarUrl}
              style={{
                backgroundColor: getCategoryColor(record.category),
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {member.name.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ lineHeight: 1.25, minWidth: 0 }}>
              <Text strong style={{ fontSize: 12, color: 'var(--accounts-stat-value)', display: 'block' }}>
                {member.name}
              </Text>
              <Text style={{ fontSize: 10.5, color: 'var(--accounts-stat-sub)', whiteSpace: 'nowrap' }}>
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
      width: 180,
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
      width: 100,
      align: 'center',
      render: (_, record: Transaction) => {
        if (!canUpdateAccount && !canDeleteAccount) return null;

        return (
          <Space size={4} className="accounts-row-actions">
            {canUpdateAccount && (
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => showEditModal(record)}
                className="accounts-row-actions__btn accounts-row-actions__edit"
                aria-label="Edit transaction"
              />
            )}
            {canDeleteAccount && (
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => showDeleteModal(record)}
                className="accounts-row-actions__btn accounts-row-actions__delete"
                aria-label="Delete transaction"
              />
            )}
          </Space>
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
          style={{ padding: '9.5px 32px', marginBottom: 12 }}
          icon={<BankOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
          title="Accounts Management"
          description="Track company income, expenses, and transaction lifecycle."
          extra={
            <div className="flex items-center gap-3">
              <Button
                size="middle"
                icon={<FileTextOutlined />}
                onClick={() => setRecentDrawerVisible(true)}
                style={{ borderRadius: 8, height: 38, color: "var(--text-secondary)" }}
              >
                Recent Activity
              </Button>
              <Button
                size="middle"
                icon={<PieChartOutlined size={16} />}
                onClick={() => setBreakdownDrawerVisible(true)}
                style={{ borderRadius: 8, height: 38, color: "var(--text-secondary)" }}
              >
                Breakdown
              </Button>
              {canCreateAccount && (
                <Button
                  type="primary"
                  size="middle"
                  className="accounts-add-btn"
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

        <div style={{ padding: "0 32px 32px 32px" }}>

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
                accent="Inflow"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="Total Debits"
                value={formatCurrency(summary?.balance?.debits || 0)}
                icon={ArrowDownOutlined}
                color="#ef4444"
                subValue={`${summary?.balance?.debitCount || 0} transactions`}
                accent="Outflow"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="Net Balance"
                value={formatCurrency(summary?.balance?.net || 0)}
                icon={WalletOutlined}
                color="#3b82f6"
                subValue={`${summary?.balance?.totalCount || 0} total activity`}
                accent="Live"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="This Month"
                value={formatCurrency(summary?.monthlyTrend?.[summary.monthlyTrend.length - 1]?.net || 0)}
                icon={CalendarOutlined}
                color="#8b5cf6"
                subValue="Current month performance"
                accent={dayjs().format('MMM YYYY')}
              />
            </Col>
          </Row>

          {/* Premium Filter Bar */}
          <div className="accounts-filter-bar">
            <div className="accounts-filter-bar__label">
              <FilterOutlined style={{ fontSize: 13 }} />
              <span>Filters</span>
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 34,
                padding: '0 12px',
                background: 'var(--bg-pure-white)',
                border: '1px solid var(--border-slate-200)',
                borderRadius: 8,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              <Switch
                size="small"
                checked={thisMonthOnly}
                onChange={handleThisMonthToggle}
              />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                This Month
              </span>
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

            {(canCreateAccount || canUpdateAccount || canDeleteAccount) && (
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
            <Col xs={24}>
              {/* Transactions Table */}
              <Card
                size="small"
                styles={{ body: { padding: 0 } }}
                className="compact-table accounts-table-card"
                style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--accounts-card-border)', backgroundColor: 'var(--accounts-card-bg)' }}
              >
                <div className="accounts-table-card__header">
                  <div className="accounts-table-card__title">
                    <FileTextOutlined style={{ fontSize: 14, color: '#3b82f6' }} />
                    <span>Transactions Ledger</span>
                  </div>
                  <div className="accounts-table-card__count">
                    {pagination.total.toLocaleString()} entries
                  </div>
                </div>
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
          </Row>

          {/* Delete confirmation modal */}
          <Modal
            title="Delete Transaction"
            open={isModalVisible && modalType === 'delete'}
            onCancel={() => {
              setIsModalVisible(false);
              setSelectedTransaction(null);
            }}
            footer={null}
            width={400}
          >
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
          </Modal>

          {/* Transaction Add/Edit Drawer */}
          <Drawer
            title={
              <div className="accounts-breakdown__title">
                <div className={`accounts-breakdown__title-icon accounts-tx-drawer__icon ${modalType === 'edit' ? 'is-edit' : 'is-add'}`}>
                  {modalType === 'edit' ? <EditOutlined style={{ fontSize: 18 }} /> : <PlusOutlined style={{ fontSize: 18 }} />}
                </div>
                <div className="accounts-breakdown__title-text">
                  <div className="accounts-breakdown__title-main">
                    {modalType === 'edit' ? 'Edit Transaction' : 'New Transaction'}
                  </div>
                  <div className="accounts-breakdown__title-sub">
                    {modalType === 'edit' ? 'Update the details of this transaction' : 'Record a new income or expense entry'}
                  </div>
                </div>
              </div>
            }
            placement="right"
            width={520}
            open={isModalVisible && modalType !== 'delete'}
            onClose={() => {
              setIsModalVisible(false);
              form.resetFields();
              setSelectedTransaction(null);
            }}
            destroyOnClose
            styles={{
              header: { borderBottom: '1px solid var(--accounts-card-border)', padding: '18px 22px', background: 'var(--accounts-card-bg)' },
              body: { padding: 0, background: 'var(--customers-page-bg)' },
              footer: { borderTop: '1px solid var(--accounts-card-border)', padding: '14px 22px', background: 'var(--accounts-card-bg)' },
            }}
            footer={
              <div className="accounts-tx-drawer__footer">
                <Button
                  onClick={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                    setSelectedTransaction(null);
                  }}
                  size="middle"
                  style={{ borderRadius: 8, height: 38, padding: '0 16px' }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="middle"
                  loading={formLoading}
                  className="accounts-add-btn"
                  onClick={() => form.submit()}
                  icon={modalType === 'edit' ? <EditOutlined /> : <PlusOutlined />}
                  style={{ borderRadius: 8, height: 38, padding: '0 18px', fontWeight: 600 }}
                >
                  {modalType === 'edit' ? 'Update Transaction' : 'Add Transaction'}
                </Button>
              </div>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="middle"
              className="accounts-tx-form"
            >
              <div className="accounts-tx-drawer__body">
                {/* Section: Type & Amount */}
                <div className="accounts-tx-section">
                  <div className="accounts-tx-section__head">
                    <span className="accounts-tx-section__num">01</span>
                    <div>
                      <div className="accounts-tx-section__title">Transaction Basics</div>
                      <div className="accounts-tx-section__sub">Specify the direction and value of money movement</div>
                    </div>
                  </div>

                  <Form.Item
                    name="type"
                    label="Transaction Type"
                    rules={[{ required: true, message: 'Please select transaction type' }]}
                    shouldUpdate
                  >
                    <Select
                      showSearch
                      placeholder="Select type"
                      optionFilterProp="label"
                      size="large"
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
                      size="large"
                      style={{ width: '100%' }}
                      formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/₹\s?|(,*)/g, '')}
                      precision={2}
                    />
                  </Form.Item>
                </div>

                {/* Section: Member & Category */}
                <div className="accounts-tx-section">
                  <div className="accounts-tx-section__head">
                    <span className="accounts-tx-section__num">02</span>
                    <div>
                      <div className="accounts-tx-section__title">Attribution</div>
                      <div className="accounts-tx-section__sub">Who and what this transaction is for</div>
                    </div>
                  </div>

                  <Form.Item
                    name="member"
                    label="Member"
                    rules={[{ required: true, message: 'Please select member' }]}
                    tooltip={modalType === 'edit' ? 'Member cannot be changed when editing' : undefined}
                  >
                    <Select
                      placeholder="Select member"
                      showSearch
                      size="large"
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
                      size="large"
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

                  <Form.Item
                    name="date"
                    label="Transaction Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker size="large" style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                {/* Section: Description & Notes */}
                <div className="accounts-tx-section">
                  <div className="accounts-tx-section__head">
                    <span className="accounts-tx-section__num">03</span>
                    <div>
                      <div className="accounts-tx-section__title">Details</div>
                      <div className="accounts-tx-section__sub">Add a clear description and any additional context</div>
                    </div>
                  </div>

                  <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please enter description' }]}
                  >
                    <Input size="large" placeholder="Enter transaction description" />
                  </Form.Item>

                  <Form.Item
                    name="notes"
                    label="Notes (Optional)"
                  >
                    <TextArea
                      placeholder="Additional notes..."
                      rows={4}
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                </div>
              </div>
            </Form>
          </Drawer>

          {/* Category Breakdown Drawer */}
          <Drawer
            title={
              <div className="accounts-breakdown__title">
                <div className="accounts-breakdown__title-icon">
                  <PieChartOutlined style={{ fontSize: 18 }} />
                </div>
                <div className="accounts-breakdown__title-text">
                  <div className="accounts-breakdown__title-main">Category Breakdown</div>
                  <div className="accounts-breakdown__title-sub">Distribution of transactions by category</div>
                </div>
              </div>
            }
            placement="right"
            width={460}
            onClose={() => setBreakdownDrawerVisible(false)}
            open={breakdownDrawerVisible}
            className="accounts-breakdown-drawer"
            styles={{
              header: { borderBottom: '1px solid var(--accounts-card-border)', padding: '18px 22px', background: 'var(--accounts-card-bg)' },
              body: { padding: 0, background: 'var(--customers-page-bg)' }
            }}
          >
            {summary?.categoryBreakdown?.length > 0 ? (
              (() => {
                const totalAbs = summary.categoryBreakdown.reduce((s: number, c: any) => s + Math.abs(c.total), 0);
                const maxAbs = Math.max(...summary.categoryBreakdown.map((c: any) => Math.abs(c.total)));
                const totalCount = summary.categoryBreakdown.reduce((s: number, c: any) => s + (c.count || 0), 0);
                return (
                  <div className="accounts-breakdown__body">
                    {/* Hero summary */}
                    <div className="accounts-breakdown__hero">
                      <div className="accounts-breakdown__hero-glow" />
                      <div className="accounts-breakdown__hero-inner">
                        <div className="accounts-breakdown__hero-row">
                          <div>
                            <div className="accounts-breakdown__hero-label">Total Volume</div>
                            <div className="accounts-breakdown__hero-value">{formatCurrency(totalAbs)}</div>
                          </div>
                          <div className="accounts-breakdown__hero-meta">
                            <div className="accounts-breakdown__hero-pill">
                              {summary.categoryBreakdown.length} categories
                            </div>
                            <div className="accounts-breakdown__hero-sub">
                              {totalCount} transactions
                            </div>
                          </div>
                        </div>
                        {/* Stacked composition bar */}
                        <div className="accounts-breakdown__stack">
                          {summary.categoryBreakdown.map((c: any, i: number) => {
                            const w = (Math.abs(c.total) / totalAbs) * 100;
                            return (
                              <span
                                key={i}
                                className="accounts-breakdown__stack-seg"
                                style={{
                                  width: `${w}%`,
                                  background: getCategoryColor(c.category),
                                }}
                                title={`${c.category.replace('_', ' ')} — ${w.toFixed(1)}%`}
                              />
                            );
                          })}
                        </div>
                        <div className="accounts-breakdown__legend">
                          {summary.categoryBreakdown.slice(0, 4).map((c: any, i: number) => (
                            <div key={i} className="accounts-breakdown__legend-item">
                              <span className="accounts-breakdown__legend-dot" style={{ background: getCategoryColor(c.category) }} />
                              <span className="accounts-breakdown__legend-label">{c.category.replace('_', ' ')}</span>
                            </div>
                          ))}
                          {summary.categoryBreakdown.length > 4 && (
                            <div className="accounts-breakdown__legend-item accounts-breakdown__legend-more">
                              +{summary.categoryBreakdown.length - 4} more
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Category list */}
                    <div className="accounts-breakdown__list">
                      <div className="accounts-breakdown__list-header">
                        <span>By Category</span>
                        <span className="accounts-breakdown__list-hint">Sorted by volume</span>
                      </div>
                      {[...summary.categoryBreakdown]
                        .sort((a: any, b: any) => Math.abs(b.total) - Math.abs(a.total))
                        .map((item: any, index: number) => {
                          const pct = (Math.abs(item.total) / totalAbs) * 100;
                          const fillPct = Math.min(100, (Math.abs(item.total) / maxAbs) * 100);
                          const color = getCategoryColor(item.category);
                          return (
                            <div
                              key={index}
                              className="accounts-breakdown__row"
                              style={{ ['--cat-color' as any]: color }}
                            >
                              <div className="accounts-breakdown__row-head">
                                <div className="accounts-breakdown__row-title">
                                  <span className="accounts-breakdown__row-rank">{String(index + 1).padStart(2, '0')}</span>
                                  <span className="accounts-breakdown__row-dot" />
                                  <span className="accounts-breakdown__row-name">{item.category.replace('_', ' ')}</span>
                                </div>
                                <div className="accounts-breakdown__row-amount">{formatCurrency(Math.abs(item.total))}</div>
                              </div>
                              <div className="accounts-breakdown__row-bar">
                                <span
                                  className="accounts-breakdown__row-bar-fill"
                                  style={{ width: `${fillPct}%` }}
                                />
                              </div>
                              <div className="accounts-breakdown__row-foot">
                                <span className="accounts-breakdown__row-count">
                                  <FileTextOutlined style={{ fontSize: 10 }} />
                                  {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                                </span>
                                <span className="accounts-breakdown__row-pct">{pct.toFixed(1)}% of total</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="accounts-breakdown__empty">
                <Empty description="No breakdown data available" />
              </div>
            )}
          </Drawer>

          {/* Recent Activity Drawer */}
          <Drawer
            title={
              <div className="accounts-breakdown__title">
                <div className="accounts-breakdown__title-icon accounts-recent-drawer__icon">
                  <FileTextOutlined style={{ fontSize: 18 }} />
                </div>
                <div className="accounts-breakdown__title-text">
                  <div className="accounts-breakdown__title-main">Recent Activity</div>
                  <div className="accounts-breakdown__title-sub">Latest transaction events across the team</div>
                </div>
              </div>
            }
            placement="right"
            width={460}
            onClose={() => setRecentDrawerVisible(false)}
            open={recentDrawerVisible}
            styles={{
              header: { borderBottom: '1px solid var(--accounts-card-border)', padding: '18px 22px', background: 'var(--accounts-card-bg)' },
              body: { padding: 0, background: 'var(--customers-page-bg)' }
            }}
          >
            {summary?.recentTransactions?.length > 0 ? (
              <div className="accounts-recent-drawer__body">
                <div className="accounts-recent-drawer__header">
                  <span>Latest Transactions</span>
                  <span className="accounts-recent-drawer__count">
                    {summary.recentTransactions.length} {summary.recentTransactions.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <div className="accounts-recent-drawer__list">
                  {summary.recentTransactions.map((item: Transaction, idx: number) => {
                    const member: any = typeof item.member === 'object' ? item.member : null;
                    const isCredit = item.type === 'credit';
                    return (
                      <div key={item.id || idx} className={`accounts-recent-drawer__row ${isCredit ? 'is-credit' : 'is-debit'}`}>
                        <div className="accounts-recent-drawer__row-left">
                          <div className="accounts-recent-drawer__avatar">
                            {isCredit ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                          </div>
                          <div className="accounts-recent-drawer__meta">
                            <div className="accounts-recent-drawer__desc">{item.description}</div>
                            <div className="accounts-recent-drawer__sub">
                              <span className="accounts-recent-drawer__member">
                                {member?.avatarUrl ? (
                                  <Avatar size={16} src={member.avatarUrl} />
                                ) : (
                                  <Avatar
                                    size={16}
                                    style={{
                                      backgroundColor: getCategoryColor(item.category),
                                      fontSize: 9,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {member?.name?.charAt(0)?.toUpperCase() || '?'}
                                  </Avatar>
                                )}
                                <span>{member?.name || 'Unknown'}</span>
                              </span>
                              <span className="accounts-recent-drawer__dot" />
                              <span className="accounts-recent-drawer__date">{dayjs(item.date).format('MMM DD, YYYY')}</span>
                              <span
                                className="accounts-recent-drawer__cat"
                                style={{ ['--cat-color' as any]: getCategoryColor(item.category) }}
                              >
                                {item.category.replace('_', ' ')}
                              </span>
                              {item.metadata?.invoiceId && (
                                <span className="accounts-recent-drawer__invoice">Invoice</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="accounts-recent-drawer__amount">
                          {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="accounts-breakdown__empty">
                <Empty description="No recent transactions" />
              </div>
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

        /* ===== Premium Stat Card ===== */
        .accounts-stat-card {
          position: relative;
          height: 100%;
          padding: 1px;
          border-radius: 18px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--stat-accent) 28%, transparent) 0%, var(--accounts-stat-border) 45%, var(--accounts-stat-border) 100%);
          transition: transform .25s ease, box-shadow .25s ease;
          isolation: isolate;
        }
        .accounts-stat-card:hover {
          transform: translateY(-2px);
        }
        .accounts-stat-card__glow {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          background: radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--stat-accent) 14%, transparent) 0%, transparent 55%);
          pointer-events: none;
          opacity: .9;
          z-index: 0;
        }
        .accounts-stat-card__inner {
          position: relative;
          z-index: 1;
          height: 100%;
          padding: 16px 18px 14px;
          border-radius: 17px;
          background: var(--accounts-stat-bg);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .accounts-stat-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .accounts-stat-card__label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--accounts-stat-label);
        }
        .accounts-stat-card__icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--stat-accent);
          background: color-mix(in srgb, var(--stat-accent) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--stat-accent) 22%, transparent);
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--stat-accent) 8%, transparent), 0 6px 14px -8px color-mix(in srgb, var(--stat-accent) 60%, transparent);
        }
        .accounts-stat-card__value {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--accounts-stat-value);
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .accounts-stat-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .accounts-stat-card__sub {
          font-size: 11px;
          font-weight: 500;
          color: var(--accounts-stat-sub);
        }
        .accounts-stat-card__chip {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 999px;
          color: var(--stat-accent);
          background: color-mix(in srgb, var(--stat-accent) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--stat-accent) 20%, transparent);
        }
        .accounts-stat-card__bar {
          margin-top: 4px;
          height: 3px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--stat-accent) 8%, transparent);
          overflow: hidden;
        }
        .accounts-stat-card__bar-fill {
          display: block;
          height: 100%;
          width: 60%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--stat-accent), color-mix(in srgb, var(--stat-accent) 50%, transparent));
        }

        /* ===== Filter Bar ===== */
        .accounts-filter-bar {
          margin-bottom: 16px;
          padding: 10px 14px;
          background: var(--accounts-stat-bg);
          border: 1px solid var(--accounts-card-border);
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: nowrap;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03);
        }
        .accounts-filter-bar__label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          color: #6366f1;
          background: linear-gradient(135deg, rgba(99,102,241,0.10), rgba(139,92,246,0.10));
          border: 1px solid rgba(99,102,241,0.18);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          margin-right: 4px;
          flex-shrink: 0;
        }

        /* ===== Table Card Header ===== */
        .accounts-table-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--accounts-card-border);
          background: linear-gradient(180deg, color-mix(in srgb, var(--accounts-card-bg) 96%, transparent) 0%, var(--accounts-card-bg) 100%);
        }
        .accounts-table-card__title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--accounts-stat-value);
          letter-spacing: -0.01em;
        }
        .accounts-table-card__count {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--accounts-stat-sub);
          padding: 4px 10px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accounts-stat-label) 10%, transparent);
          border: 1px solid var(--accounts-card-border);
        }
        .accounts-table-card .ant-table-thead > tr > th {
          background: var(--bg-table-header) !important;
          font-size: 10.5px !important;
          font-weight: 700 !important;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--accounts-stat-label) !important;
          border-bottom: 1px solid var(--accounts-card-border) !important;
        }
        .accounts-table-card .ant-table-tbody > tr > td {
          transition: background-color .15s ease;
        }
        .accounts-table-card .ant-table-tbody > tr:hover > td {
          background: color-mix(in srgb, var(--accounts-stat-label) 5%, transparent) !important;
        }

        /* ===== Recent Activity Card ===== */
        .accounts-recent-card {
          border-radius: 16px !important;
          border: 1px solid var(--accounts-card-border) !important;
          background-color: var(--accounts-card-bg) !important;
          height: 100%;
          overflow: hidden;
        }
        .accounts-recent-card .ant-card-head {
          background: linear-gradient(180deg, color-mix(in srgb, var(--accounts-card-bg) 96%, transparent) 0%, var(--accounts-card-bg) 100%);
          border-bottom: 1px solid var(--accounts-card-border);
          padding: 0 14px;
          min-height: 48px;
        }
        .accounts-recent__title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 4px 0;
        }
        .accounts-recent__title-left {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--accounts-stat-value);
          letter-spacing: -0.01em;
        }
        .accounts-recent__icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.22);
        }
        .accounts-recent__badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 999px;
          color: #6366f1;
          background: rgba(99,102,241,0.10);
          border: 1px solid rgba(99,102,241,0.20);
        }
        .accounts-recent-card .ant-list-item {
          border-bottom: 1px solid var(--accounts-card-border) !important;
          transition: background-color .15s ease;
        }
        .accounts-recent-card .ant-list-item:last-child {
          border-bottom: none !important;
        }
        .accounts-recent-card .ant-list-item:hover {
          background: color-mix(in srgb, var(--accounts-stat-label) 4%, transparent);
        }

        /* ===== Category Breakdown Drawer ===== */
        .accounts-breakdown__title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .accounts-breakdown__title-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
          background: linear-gradient(135deg, rgba(99,102,241,0.14), rgba(139,92,246,0.14));
          border: 1px solid rgba(99,102,241,0.22);
          box-shadow: 0 8px 18px -10px rgba(99,102,241,0.55);
        }
        .accounts-breakdown__title-text { line-height: 1.15; }
        .accounts-breakdown__title-main {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--accounts-stat-value);
        }
        .accounts-breakdown__title-sub {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--accounts-stat-sub);
          margin-top: 2px;
        }

        .accounts-breakdown__body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px 22px 28px;
        }

        /* Hero */
        .accounts-breakdown__hero {
          position: relative;
          padding: 1px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.20) 45%, var(--accounts-card-border) 100%);
          isolation: isolate;
        }
        .accounts-breakdown__hero-glow {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          background: radial-gradient(120% 80% at 100% 0%, rgba(139,92,246,0.18) 0%, transparent 55%);
          pointer-events: none;
          z-index: 0;
        }
        .accounts-breakdown__hero-inner {
          position: relative;
          z-index: 1;
          padding: 18px 18px 16px;
          border-radius: 17px;
          background: var(--accounts-stat-bg);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .accounts-breakdown__hero-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .accounts-breakdown__hero-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--accounts-stat-label);
        }
        .accounts-breakdown__hero-value {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--accounts-stat-value);
          margin-top: 4px;
        }
        .accounts-breakdown__hero-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }
        .accounts-breakdown__hero-pill {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          color: #6366f1;
          background: rgba(99,102,241,0.10);
          border: 1px solid rgba(99,102,241,0.22);
        }
        .accounts-breakdown__hero-sub {
          font-size: 11px;
          font-weight: 500;
          color: var(--accounts-stat-sub);
        }
        .accounts-breakdown__stack {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          overflow: hidden;
          display: flex;
          background: color-mix(in srgb, var(--accounts-stat-label) 10%, transparent);
          box-shadow: inset 0 0 0 1px var(--accounts-card-border);
        }
        .accounts-breakdown__stack-seg {
          display: block;
          height: 100%;
          transition: opacity .2s ease;
        }
        .accounts-breakdown__stack-seg + .accounts-breakdown__stack-seg {
          box-shadow: inset 1px 0 0 0 rgba(255,255,255,0.35);
        }
        .accounts-breakdown__stack:hover .accounts-breakdown__stack-seg {
          opacity: .55;
        }
        .accounts-breakdown__stack:hover .accounts-breakdown__stack-seg:hover {
          opacity: 1;
        }
        .accounts-breakdown__legend {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
        }
        .accounts-breakdown__legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          font-weight: 600;
          color: var(--accounts-stat-label);
          text-transform: capitalize;
        }
        .accounts-breakdown__legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          display: inline-block;
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--accounts-stat-bg) 70%, transparent);
        }
        .accounts-breakdown__legend-more {
          color: var(--accounts-stat-sub);
        }

        /* List header */
        .accounts-breakdown__list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .accounts-breakdown__list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 4px 2px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--accounts-stat-label);
        }
        .accounts-breakdown__list-hint {
          color: var(--accounts-stat-sub);
          font-weight: 500;
          letter-spacing: .04em;
          text-transform: none;
          font-size: 10.5px;
        }

        /* Row */
        .accounts-breakdown__row {
          position: relative;
          padding: 14px 16px;
          border-radius: 14px;
          background: var(--accounts-stat-bg);
          border: 1px solid var(--accounts-card-border);
          transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
          overflow: hidden;
        }
        .accounts-breakdown__row::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--cat-color);
          opacity: .85;
        }
        .accounts-breakdown__row:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--cat-color) 40%, var(--accounts-card-border));
          box-shadow: 0 14px 28px -22px color-mix(in srgb, var(--cat-color) 70%, transparent);
        }
        .accounts-breakdown__row-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .accounts-breakdown__row-title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .accounts-breakdown__row-rank {
          font-size: 10px;
          font-weight: 700;
          color: var(--accounts-stat-sub);
          font-variant-numeric: tabular-nums;
          letter-spacing: .04em;
        }
        .accounts-breakdown__row-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--cat-color);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--cat-color) 18%, transparent);
          flex-shrink: 0;
        }
        .accounts-breakdown__row-name {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .04em;
          text-transform: uppercase;
          color: var(--accounts-stat-value);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .accounts-breakdown__row-amount {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--accounts-stat-value);
          font-variant-numeric: tabular-nums;
        }
        .accounts-breakdown__row-bar {
          height: 6px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--cat-color) 10%, transparent);
          overflow: hidden;
        }
        .accounts-breakdown__row-bar-fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--cat-color), color-mix(in srgb, var(--cat-color) 55%, transparent));
          transition: width .35s ease;
        }
        .accounts-breakdown__row-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 10.5px;
          font-weight: 600;
          color: var(--accounts-stat-sub);
        }
        .accounts-breakdown__row-count {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .accounts-breakdown__row-pct {
          color: var(--cat-color);
          font-weight: 700;
        }

        .accounts-breakdown__empty {
          padding: 60px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ===== Recent Activity Drawer ===== */
        .accounts-recent-drawer__icon {
          color: #10b981 !important;
          background: linear-gradient(135deg, rgba(16,185,129,0.16), rgba(59,130,246,0.14)) !important;
          border: 1px solid rgba(16,185,129,0.24) !important;
          box-shadow: 0 8px 18px -10px rgba(16,185,129,0.55) !important;
        }
        .accounts-recent-drawer__body {
          display: flex;
          flex-direction: column;
          padding: 18px 22px 28px;
        }
        .accounts-recent-drawer__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 4px 12px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--accounts-stat-label);
        }
        .accounts-recent-drawer__count {
          color: var(--accounts-stat-sub);
          font-weight: 500;
          letter-spacing: .04em;
          text-transform: none;
          font-size: 10.5px;
        }
        .accounts-recent-drawer__list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .accounts-recent-drawer__row {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          background: var(--accounts-stat-bg);
          border: 1px solid var(--accounts-card-border);
          border-radius: 14px;
          transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
          overflow: hidden;
        }
        .accounts-recent-drawer__row::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
        }
        .accounts-recent-drawer__row.is-credit::before { background: var(--accounts-emerald-text); }
        .accounts-recent-drawer__row.is-debit::before { background: var(--accounts-rose-text); }
        .accounts-recent-drawer__row:hover {
          transform: translateY(-1px);
        }
        .accounts-recent-drawer__row.is-credit:hover {
          border-color: color-mix(in srgb, var(--accounts-emerald-text) 35%, var(--accounts-card-border));
          box-shadow: 0 14px 28px -22px color-mix(in srgb, var(--accounts-emerald-text) 65%, transparent);
        }
        .accounts-recent-drawer__row.is-debit:hover {
          border-color: color-mix(in srgb, var(--accounts-rose-text) 35%, var(--accounts-card-border));
          box-shadow: 0 14px 28px -22px color-mix(in srgb, var(--accounts-rose-text) 65%, transparent);
        }
        .accounts-recent-drawer__row-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }
        .accounts-recent-drawer__avatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }
        .accounts-recent-drawer__row.is-credit .accounts-recent-drawer__avatar {
          color: var(--accounts-emerald-text);
          background: var(--accounts-emerald-bg);
          border: 1px solid color-mix(in srgb, var(--accounts-emerald-text) 25%, transparent);
        }
        .accounts-recent-drawer__row.is-debit .accounts-recent-drawer__avatar {
          color: var(--accounts-rose-text);
          background: var(--accounts-rose-bg);
          border: 1px solid color-mix(in srgb, var(--accounts-rose-text) 25%, transparent);
        }
        .accounts-recent-drawer__meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .accounts-recent-drawer__desc {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--accounts-stat-value);
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .accounts-recent-drawer__sub {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 10.5px;
          color: var(--accounts-stat-sub);
        }
        .accounts-recent-drawer__member {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--accounts-stat-label);
          font-weight: 600;
        }
        .accounts-recent-drawer__dot {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: var(--accounts-stat-sub);
        }
        .accounts-recent-drawer__date {
          font-weight: 500;
        }
        .accounts-recent-drawer__cat {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 999px;
          color: var(--cat-color);
          background: color-mix(in srgb, var(--cat-color) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--cat-color) 22%, transparent);
        }
        .accounts-recent-drawer__invoice {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: .04em;
          padding: 2px 7px;
          border-radius: 999px;
          color: var(--accounts-invoice-text);
          background: var(--accounts-invoice-bg);
          border: 1px solid color-mix(in srgb, var(--accounts-invoice-text) 30%, transparent);
        }
        .accounts-recent-drawer__amount {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .accounts-recent-drawer__row.is-credit .accounts-recent-drawer__amount {
          color: var(--accounts-emerald-text);
        }
        .accounts-recent-drawer__row.is-debit .accounts-recent-drawer__amount {
          color: var(--accounts-rose-text);
        }

        /* ===== Inline Row Actions ===== */
        .accounts-row-actions__btn {
          width: 28px !important;
          height: 28px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          border-radius: 8px !important;
          border: 1px solid transparent !important;
          color: var(--accounts-stat-sub) !important;
          transition: all .15s ease;
        }
        .accounts-row-actions__edit:hover {
          color: #3b82f6 !important;
          background: rgba(59,130,246,0.10) !important;
          border-color: rgba(59,130,246,0.22) !important;
        }
        .accounts-row-actions__delete:hover {
          color: var(--accounts-rose-text) !important;
          background: var(--accounts-rose-bg) !important;
          border-color: color-mix(in srgb, var(--accounts-rose-text) 25%, transparent) !important;
        }

        /* ===== Transaction Drawer ===== */
        .accounts-tx-drawer__icon.is-add {
          color: #3b82f6 !important;
          background: linear-gradient(135deg, rgba(59,130,246,0.16), rgba(99,102,241,0.14)) !important;
          border: 1px solid rgba(59,130,246,0.24) !important;
          box-shadow: 0 8px 18px -10px rgba(59,130,246,0.55) !important;
        }
        .accounts-tx-drawer__icon.is-edit {
          color: #f59e0b !important;
          background: linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.14)) !important;
          border: 1px solid rgba(245,158,11,0.28) !important;
          box-shadow: 0 8px 18px -10px rgba(245,158,11,0.55) !important;
        }
        .accounts-tx-drawer__body {
          padding: 18px 22px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .accounts-tx-drawer__footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        /* Section card */
        .accounts-tx-section {
          background: var(--accounts-stat-bg);
          border: 1px solid var(--accounts-card-border);
          border-radius: 16px;
          padding: 18px 18px 6px;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03);
        }
        .accounts-tx-section__head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px dashed var(--accounts-card-border);
        }
        .accounts-tx-section__num {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .04em;
          color: #6366f1;
          background: rgba(99,102,241,0.10);
          border: 1px solid rgba(99,102,241,0.22);
          font-variant-numeric: tabular-nums;
        }
        .accounts-tx-section__title {
          font-size: 13px;
          font-weight: 700;
          color: var(--accounts-stat-value);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .accounts-tx-section__sub {
          font-size: 11px;
          color: var(--accounts-stat-sub);
          margin-top: 2px;
          font-weight: 500;
        }
        .accounts-tx-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        /* Form polish inside drawer */
        .accounts-tx-form .ant-form-item-label > label {
          font-size: 11.5px !important;
          font-weight: 600 !important;
          color: var(--accounts-stat-label) !important;
          letter-spacing: .02em;
          height: 22px !important;
        }
        .accounts-tx-form .ant-form-item {
          margin-bottom: 14px;
        }
        .accounts-tx-form .ant-input,
        .accounts-tx-form .ant-input-number,
        .accounts-tx-form .ant-picker,
        .accounts-tx-form .ant-select-selector {
          border-radius: 10px !important;
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .accounts-tx-form .ant-input-lg,
        .accounts-tx-form .ant-input-number-lg,
        .accounts-tx-form .ant-picker-large,
        .accounts-tx-form .ant-select-lg .ant-select-selector {
          border-radius: 10px !important;
        }
        .accounts-tx-form .ant-input:hover,
        .accounts-tx-form .ant-input-number:hover,
        .accounts-tx-form .ant-picker:hover,
        .accounts-tx-form .ant-select:hover .ant-select-selector {
          border-color: #6366f1 !important;
        }
        .accounts-tx-form .ant-input:focus,
        .accounts-tx-form .ant-input-focused,
        .accounts-tx-form .ant-input-number-focused,
        .accounts-tx-form .ant-picker-focused,
        .accounts-tx-form .ant-select-focused .ant-select-selector {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
        }
        .accounts-tx-form .ant-input-number-input {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .accounts-add-btn {
          box-shadow: none !important;
        }
        .accounts-add-btn:hover {
          box-shadow: none !important;
        }
      `}} />
    </MainLayout>
  );
}
