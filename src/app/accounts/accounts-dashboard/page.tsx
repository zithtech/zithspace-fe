'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import {
  Typography,
  Button,
  Table,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Avatar,
  Switch,
  App,
  Dropdown,
  Tooltip,
  Drawer,
  Empty,
  Space,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PieChartOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  EllipsisOutlined,
  RestOutlined,
  HistoryOutlined,
  BankOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { TransactionsService, Transaction, CreateTransactionData, UpdateTransactionData } from '@/services/transactionsService';
import { MembersService, Member } from '@/services/membersService';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { usePermission } from '@/hooks/usePermission';
import { useActivitySource } from '@/hooks/useActivitySource';
import { History, Sparkles, Menu, X } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

interface TransactionFormData {
  type: 'credit' | 'debit';
  amount: number;
  member: string;
  category: 'salary' | 'expense' | 'client_payment' | 'office_expense' | 'bonus' | 'refund' | 'other';
  description: string;
  notes?: string;
  date: dayjs.Dayjs;
}

const initialsOf = (name: string) =>
  (name || '—')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const CARD_ACCENTS: [string, string][] = [
  ['#3b82f6', '#2563eb'], // blue
  ['#10b981', '#059669'], // green
  ['#64748b', '#475569'], // grey
];

const accentFor = (key: string): [string, string] => {
  return ['#3b82f6', '#2563eb'];
};

const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96;
  const h = 34;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block', width: '100%', maxWidth: '96px', height: 'auto' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function AccountsPage() {
  const { message: messageApi } = App.useApp();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm();
  const {
    canReadAccount,
    canCreateAccount,
    canUpdateAccount,
    canDeleteAccount,
    canReadUser,
    canReadActivityLog
  } = usePermission();

  const [historyOpen, setHistoryOpen] = useState(false);

  // Register UX context for activity logging
  useActivitySource({ section: "FINANCE", module: "Accounts", page: "AccountsDashboard" });

  const hasShownError = React.useRef(false);

  // Protect route - requires account.read permission
  useEffect(() => {
    if (!isLoading && user && !canReadAccount) {
      router.push('/dashboard');
    }
  }, [user, isLoading, canReadAccount, router]);

  // Alert if member module read permission is missing
  useEffect(() => {
    if (!isLoading && user && !canReadUser && !hasShownError.current) {
      messageApi.error("Members permission is missing");
      hasShownError.current = true;
    }
  }, [user, isLoading, canReadUser, messageApi]);

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Summary data
  const [summary, setSummary] = useState<any>(null);

  // Pagination and filtering
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [searchText, setSearchText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [memberFilter, setMemberFilter] = useState<string | undefined>(undefined);
  const [thisMonthOnly, setThisMonthOnly] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [sortBy, setSortBy] = useState<string | undefined>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>('desc');

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [breakdownDrawerVisible, setBreakdownDrawerVisible] = useState(false);
  const [recentDrawerVisible, setRecentDrawerVisible] = useState(false);

  // Layout states
  const [savedView, setSavedView] = useState<'all' | 'mine' | 'credit' | 'debit'>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const searchRef = useRef<any>(null);

  // Expense categories
  const { data: categoriesResponse, isLoading: categoriesLoading } = useExpenseCategories();
  const expenseCategories = categoriesResponse?.data || [];

  const memberOptions = useMemo(() => {
    return members.map((member) => ({
      value: member.id,
      label: member.name,
      description: member.position?.title || 'N/A',
      avatarUrl: member.avatarUrl || null,
    }));
  }, [members]);

  const categoryOptions = useMemo(() => {
    return expenseCategories.map((category: any) => ({
      value: category.name,
      label: category.name,
    }));
  }, [expenseCategories]);

  // Debounce search input logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchText);
      setPagination(prev => ({ ...prev, current: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Sync savedView with typeFilter and memberFilter
  useEffect(() => {
    if (savedView === 'all') {
      setTypeFilter(undefined);
      setMemberFilter(undefined);
    } else if (savedView === 'credit') {
      setTypeFilter('credit');
      setMemberFilter(undefined);
    } else if (savedView === 'debit') {
      setTypeFilter('debit');
      setMemberFilter(undefined);
    } else if (savedView === 'mine') {
      setTypeFilter(undefined);
      if (user?.id) {
        setMemberFilter(user.id);
      }
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [savedView, user]);

  // Key shortcut to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
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
        messageApi.error(error.message);
      } else {
        messageApi.error('Failed to fetch transactions');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const startDate = dateRange?.[0]?.toISOString();
      const endDate = dateRange?.[1]?.toISOString();

      const data = await TransactionsService.getSummary(startDate, endDate);
      setSummary(data);
    } catch (error) {
      console.error('Fetch summary error:', error);
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    }
  };

  // Fetch members
  const fetchMembers = async () => {
    if (!canReadUser) return;
    try {
      const response = await MembersService.getMembers({ limit: 100 });
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchSummary();
      fetchMembers();
    }
  }, [user, pagination.current, pagination.pageSize, searchTerm, typeFilter, categoryFilter, memberFilter, dateRange, sortBy, sortOrder]);

  // Handle form submission
  const handleSubmit = async (values: TransactionFormData) => {
    try {
      setFormLoading(true);

      // Ensure amount is a valid number
      const amount = Number(values.amount);
      if (isNaN(amount) || amount <= 0) {
        messageApi.error('Amount must be a valid number greater than 0');
        setFormLoading(false);
        return;
      }

      if (modalType === 'edit' && selectedTransaction) {
        const updatePayload: UpdateTransactionData = {
          type: values.type,
          amount: amount,
          category: values.category,
          description: values.description,
          notes: values.notes || '',
          date: values.date.toDate(),
        };

        await TransactionsService.updateTransaction(selectedTransaction.id, updatePayload);
        messageApi.success('Transaction updated successfully');
      } else {
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
        messageApi.success('Transaction created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedTransaction(null);
      fetchTransactions();
      fetchSummary();
    } catch (error) {
      console.error('Transaction operation error:', error);
      if (error instanceof Error) {
        messageApi.error(error.message);
      } else {
        messageApi.error('Operation failed');
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

    form.setFieldsValue({
      type: transaction.type,
      amount: Number(transaction.amount),
      member: typeof transaction.member === 'object' ? transaction.member.id : transaction.member,
      category: transaction.category,
      description: transaction.description,
      notes: transaction.notes || '',
      date: dayjs(transaction.date),
    });
    setIsModalVisible(true);
  };

  // Format currency (INR)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Get category color restricted strictly to Blue, Green, and Grey
  const getCategoryColor = (category: string, type?: 'credit' | 'debit') => {
    if (type === 'credit') return '#10b981'; // Green
    if (type === 'debit') return '#64748b';  // Grey
    const creditCategories = ['salary', 'bonus', 'client_payment', 'refund'];
    if (creditCategories.includes(category.toLowerCase())) {
      return '#10b981';
    }
    return '#64748b';
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

  // Handle table pagination and sorting changes
  const handleTableChange = (
    newPagination: any,
    filters: any,
    sorter: any
  ) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 20,
    }));

    if (sorter && !Array.isArray(sorter) && sorter.field && sorter.order) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    } else {
      setSortBy(undefined);
      setSortOrder(undefined);
    }
  };

  // Safe trend extraction helper
  const getTrendData = (key: 'credits' | 'debits' | 'net') => {
    if (!summary?.monthlyTrend || summary.monthlyTrend.length === 0) {
      return [0, 0, 0, 0, 0];
    }
    return summary.monthlyTrend.map((t: any) => Number(t[key] || 0));
  };

  // Sidebar Views configuration
  const views = [
    { key: 'all', label: 'All transactions', icon: <FolderOutlined />, color: '#3b82f6' },
    { key: 'mine', label: 'My transactions', icon: <UserOutlined />, color: '#64748b' },
    { key: 'credit', label: 'Credits', icon: <ArrowUpOutlined style={{ color: '#10b981' }} />, color: '#10b981' },
    { key: 'debit', label: 'Debits', icon: <ArrowDownOutlined style={{ color: '#64748b' }} />, color: '#64748b' },
  ] as const;

  // View counts
  const viewCounts = useMemo(() => ({
    all: summary?.balance?.totalCount || 0,
    credit: summary?.balance?.creditCount || 0,
    debit: summary?.balance?.debitCount || 0,
    mine: transactions.filter(t => {
      const m = typeof t.member === 'object' ? t.member.id : t.member;
      return m === user?.id;
    }).length,
  }), [summary, transactions, user]);

  const handleRefresh = () => {
    fetchTransactions();
    fetchSummary();
    fetchMembers();
  };

  // Premium row/card action menu label helper
  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );

  const actionMenu = (record: Transaction) => ({
    className: 'pp-action-menu',
    items: [
      { key: 'edit', disabled: !canUpdateAccount, label: menuLabel('Edit transaction', 'Modify entry details', <EditOutlined />, '#3b82f6', 'rgba(59,130,246,0.12)') },
      { type: 'divider' as const },
      {
        key: 'delete',
        danger: true,
        disabled: !canDeleteAccount,
        label: (
          <ConfirmDialog
            tone="danger"
            title="Delete Transaction"
            description="Are you sure you want to delete this transaction? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            placement="left"
            onConfirm={async () => {
              try {
                await TransactionsService.deleteTransaction(record.id);
                messageApi.success('Transaction deleted successfully');
                fetchTransactions();
                fetchSummary();
              } catch (error) {
                console.error('Delete transaction error:', error);
                if (error instanceof Error) {
                  messageApi.error(error.message);
                } else {
                  messageApi.error('Delete failed');
                }
              }
            }}
          >
            <div
              style={{
                margin: '-5px -12px',
                padding: '5px 12px',
                width: 'calc(100% + 24px)',
                height: '100%'
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {menuLabel('Delete transaction', 'Permanently remove entry', <DeleteOutlined />, '#ef4444', 'rgba(239,68,68,0.12)')}
            </div>
          </ConfirmDialog>
        )
      },
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent.stopPropagation();
      if (key === 'edit') showEditModal(record);
    },
  });

  // Table columns
  const columns: ColumnsType<Transaction> = [
    {
      title: 'DATE',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (date: string) => (
        <div className="pp-date">
          <span className="pp-date-main">{dayjs(date).format('MMM D, YYYY')}</span>
          <span className="pp-date-sub">{dayjs(date).format('h:mm A')}</span>
        </div>
      ),
      sorter: true,
      sortOrder: sortBy === 'date' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
    },
    {
      title: 'TYPE',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: 'credit' | 'debit') => {
        const isCredit = type === 'credit';
        const color = isCredit ? '#10b981' : '#64748b';
        const bg = isCredit ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.10)';
        const ring = isCredit ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.25)';
        return (
          <span className="pp-vis-pill" style={{ color, background: bg, borderColor: ring }}>
            <span className="pp-vis-dot" style={{ background: color }} />
            {type.toUpperCase()}
          </span>
        );
      },
      sorter: true,
      sortOrder: sortBy === 'type' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
    },
    {
      title: 'AMOUNT',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number, record: Transaction) => (
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-slate-900)'
        }}>
          {record.type === 'credit' ? '+' : '-'}{formatCurrency(amount)}
        </span>
      ),
      sorter: true,
      sortOrder: sortBy === 'amount' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
    },
    {
      title: 'MEMBER',
      key: 'member',
      width: 220,
      render: (_, record: Transaction) => {
        const m = typeof record.member === 'object' ? record.member : null;
        if (!m) return <Text className="pp-muted">—</Text>;
        return (
          <div className="pp-creator">
            <Avatar size={20} src={m.avatarUrl} style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6', fontSize: 9, fontWeight: 700 }}>
              {initialsOf(m.name)}
            </Avatar>
            <span className="pp-creator-name">{m.name}</span>
          </div>
        );
      },
      sorter: true,
      sortOrder: sortBy === 'member' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
    },
    {
      title: 'CATEGORY',
      dataIndex: 'category',
      key: 'category',
      width: 200,
      render: (category: string, record: Transaction) => {
        const isCredit = record.type === 'credit';
        const color = isCredit ? '#10b981' : '#64748b';
        const bg = isCredit ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.10)';
        return (
          <span className="pp-tag" style={{ background: bg, color }}>
            <span className="pp-tag-dot" />
            {category.replace('_', ' ').toUpperCase()}
          </span>
        );
      },
      sorter: true,
      sortOrder: sortBy === 'category' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
    },
    {
      title: 'DESCRIPTION',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: Transaction) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tooltip title={text} placement="topLeft">
              <span style={{
                fontSize: '11.5px',
                fontWeight: 500,
                color: 'var(--text-slate-900)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.4',
                maxWidth: '300px'
              }}>
                {text}
              </span>
            </Tooltip>
            {(record.metadata?.invoiceId || record.metadata?.source === 'invoice_module') && (
              <span className="pp-tag pp-tag--blue" style={{ height: '17px', padding: '0 5px', fontSize: '9px', flexShrink: 0 }}>INVOICE</span>
            )}
          </div>
          {record.notes && <span style={{ fontSize: '11px', color: 'var(--text-slate-400)' }}>{record.notes}</span>}
        </div>
      ),
      sorter: true,
      sortOrder: sortBy === 'description' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : undefined,
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center' as const,
      width: 80,
      fixed: 'right' as const,
      render: (_, record: Transaction) => (
        <Dropdown
          menu={actionMenu(record)}
          overlayClassName="pp-action-pop"
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" className="pp-icon-btn" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  // Stat cells configurations
  const statCells = useMemo(() => {
    const creditsTrend = getTrendData('credits');
    const debitsTrend = getTrendData('debits');
    const netTrend = getTrendData('net');
    return [
      {
        key: 'credits',
        title: 'Total Credits',
        value: formatCurrency(summary?.balance?.credits || 0),
        suffix: '',
        icon: <ArrowUpOutlined />,
        color: '#10b981', // Green
        tint: 'rgba(16,185,129,0.10)',
        trend: creditsTrend,
        delta: summary?.balance?.creditCount || 0,
        deltaLabel: 'transactions',
      },
      {
        key: 'debits',
        title: 'Total Debits',
        value: formatCurrency(summary?.balance?.debits || 0),
        suffix: '',
        icon: <ArrowDownOutlined />,
        color: '#64748b', // Grey
        tint: 'rgba(100,116,139,0.10)',
        trend: debitsTrend,
        delta: summary?.balance?.debitCount || 0,
        deltaLabel: 'transactions',
      },
      {
        key: 'net',
        title: 'Net Balance',
        value: formatCurrency(summary?.balance?.net || 0),
        suffix: '',
        icon: <WalletOutlined />,
        color: '#3b82f6', // Blue
        tint: 'rgba(59,130,246,0.10)',
        trend: netTrend,
        delta: summary?.balance?.totalCount || 0,
        deltaLabel: 'transactions',
      },
      {
        key: 'month',
        title: 'This Month',
        value: formatCurrency(summary?.monthlyTrend?.[summary.monthlyTrend.length - 1]?.net || 0),
        suffix: '',
        icon: <CalendarOutlined />,
        color: '#3b82f6', // Blue
        tint: 'rgba(59,130,246,0.10)',
        trend: netTrend,
        delta: 0,
        deltaLabel: '',
      },
    ];
  }, [summary]);

  const total = pagination.total;
  const pageStart = total === 0 ? 0 : (pagination.current - 1) * pagination.pageSize + 1;
  const pageEnd = Math.min(pagination.current * pagination.pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const emptyState = (
    <div className="pp-empty">
      <div className="pp-empty-orb"><Sparkles size={26} /></div>
      <div className="pp-empty-title">No transactions found</div>
      <div className="pp-empty-sub">Add a transaction to start tracking company finances.</div>
      {canCreateAccount && (
        <Button type="primary" icon={<PlusOutlined />} className="pp-btn-primary" onClick={showAddModal} style={{ marginTop: 14 }}>
          Add Transaction
        </Button>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="pp-shell">
        {/* ============================ SIDEBAR ============================ */}
        {isMobileOpen && (
          <div className="pp-backdrop" onClick={() => setIsMobileOpen(false)} />
        )}
        <aside className={`pp-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
          <div className="pp-side-head">
            <div className="pp-side-logo"><BankOutlined /></div>
            <div className="pp-side-head-text">
              <div className="pp-side-title">Accounts</div>
              <div className="pp-side-subtitle">Income & expenses</div>
            </div>
          </div>

          {canCreateAccount && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="pp-create-btn"
              onClick={showAddModal}
              block
            >
              Add Transaction
            </Button>
          )}

          <div className="pp-side-scroll">
            <div className="pp-side-section-label">Views</div>
            <div className="pp-side-list">
              {views.map((v) => {
                const active = savedView === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    className={`pp-view-item ${active ? 'is-active' : ''}`}
                    onClick={() => setSavedView(v.key)}
                  >
                    <span className="pp-view-icon" style={{ color: active ? v.color : 'var(--text-slate-400)' }}>{v.icon}</span>
                    <span className="pp-view-label">{v.label}</span>
                    <span className="pp-view-count">{viewCounts[v.key]}</span>
                  </button>
                );
              })}
            </div>

            <div className="pp-side-section-label">Filters</div>
            <div className="pp-side-filters">
              <SearchableDropdown
                className="pp-side-sd"
                placeholder="Category"
                searchPlaceholder="Search categories"
                itemNoun="categories"
                value={categoryFilter ?? undefined}
                onChange={(v) => setCategoryFilter(v ?? undefined)}
                options={expenseCategories.map((c: any) => ({ value: c.name, label: c.name }))}
                width={212}
                disabled={expenseCategories.length === 0}
              />
              {(canCreateAccount || canUpdateAccount || canDeleteAccount) && (
                <SearchableDropdown
                  className="pp-side-sd"
                  placeholder="Member"
                  searchPlaceholder="Search members"
                  itemNoun="members"
                  value={memberFilter ?? undefined}
                  onChange={(v) => setMemberFilter(v ?? undefined)}
                  options={memberOptions}
                  width={212}
                  disabled={members.length === 0}
                />
              )}
              <RangePicker
                className="pp-side-range"
                value={dateRange}
                onChange={handleDateRangeChange}
                placeholder={['Start date', 'End date']}
                separator={<span style={{ color: 'var(--text-slate-400)' }}>›</span>}
                suffixIcon={null}
                format="MMM D"
              />
              <div className="pp-side-switch-wrap">
                <span className="pp-side-switch-label">This month only</span>
                <Switch
                  size="small"
                  checked={thisMonthOnly}
                  onChange={handleThisMonthToggle}
                />
              </div>
              {(categoryFilter || memberFilter || dateRange || !thisMonthOnly || searchText) && (
                <button
                  type="button"
                  className="pp-clear-filters"
                  onClick={() => {
                    setCategoryFilter(undefined);
                    setMemberFilter(undefined);
                    setDateRange(null);
                    setThisMonthOnly(false);
                    setSearchText('');
                  }}
                >
                  <CloseCircleOutlined /> Clear filters
                </button>
              )}
            </div>

            <div className="pp-side-section-label">Actions</div>
            <div className="pp-side-list">
              <button
                type="button"
                className="pp-view-item"
                onClick={() => setRecentDrawerVisible(true)}
              >
                <span className="pp-view-icon" style={{ color: '#10b981' }}><FileTextOutlined /></span>
                <span className="pp-view-label">Recent Activity</span>
              </button>
              <button
                type="button"
                className="pp-view-item"
                onClick={() => setBreakdownDrawerVisible(true)}
              >
                <span className="pp-view-icon" style={{ color: '#3b82f6' }}><PieChartOutlined /></span>
                <span className="pp-view-label">Breakdown</span>
              </button>
              {canReadActivityLog && (
                <button
                  type="button"
                  className="pp-view-item"
                  onClick={() => {
                    setSelectedTransaction(null);
                    setHistoryOpen(true);
                  }}
                >
                  <span className="pp-view-icon" style={{ color: '#64748b' }}><HistoryOutlined /></span>
                  <span className="pp-view-label">History</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            className="pp-trash"
            onClick={() => router.push('/accounts/trash')}
          >
            <RestOutlined /> Trash
          </button>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="pp-main">
          {/* Top search & views bar */}
          <div className="pp-topbar">
            <button className="pp-mobile-toggle" onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="pp-search-wrap">
              <SearchOutlined className="pp-search-icon" />
              <input
                ref={searchRef}
                className="pp-search"
                placeholder="Search transactions, notes, descriptions…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{pagination.total}</strong> entries</span>
              <span className="pp-meta-dot">·</span>
              <span className="pp-meta-item"><strong>{formatCurrency(summary?.balance?.net || 0)}</strong> net balance</span>
            </div>

            <div className="pp-topbar-actions">
              <div className="pp-segmented">
                <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
                <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
              </div>
              <Tooltip title="Refresh">
                <button type="button" className="pp-ghost-btn" onClick={handleRefresh}><ReloadOutlined spin={loading} /></button>
              </Tooltip>
            </div>
          </div>

          <div className="pp-divider" />

          {/* Sparkline Stat Cards */}
          <div className="pp-stats">
            {statCells.map((s) => (
              <div key={s.key} className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                    <span className="pp-stat-label">{s.title}</span>
                  </div>
                  {s.delta > 0 && (
                    <span className="pp-stat-delta" style={{ color: s.color, background: s.tint }}>
                      +{s.delta} {s.deltaLabel}
                    </span>
                  )}
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{s.value}{s.suffix}</span>
                    <span className="pp-stat-period">monthly trend</span>
                  </div>
                  <div className="pp-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Main View Area */}
          <div className="pp-body">
            <ZukvoLoadingOverlay loading={loading} message="">
              {view === 'list' ? (
                <div className="pp-table-wrap">
                  <Table
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    size="small"
                    className="pp-table"
                    scroll={{ x: 1000 }}
                    pagination={false}
                    locale={{ emptyText: emptyState }}
                    onRow={(record) => ({
                      onClick: (e) => {
                        const t = e.target as HTMLElement;
                        if (t.closest('.ant-checkbox-wrapper, .ant-table-selection-column, button, input, .ant-select, .ant-dropdown-trigger, .pp-icon-btn')) return;
                        showEditModal(record);
                      },
                      className: 'pp-row',
                    })}
                  />

                </div>
              ) : (
                <div className="pp-grid">
                  {loading ? (
                    <div className="pp-grid-loading">Loading…</div>
                  ) : transactions.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1' }}>{emptyState}</div>
                  ) : (
                    transactions.map((item) => {
                      const isCredit = item.type === 'credit';
                      const color = isCredit ? '#10b981' : '#64748b';
                      const bg = isCredit ? 'rgba(16,185,129,0.10)' : 'rgba(100,116,139,0.10)';
                      const accent = accentFor(item.id || item.description || '');
                      const member = typeof item.member === 'object' ? item.member : null;
                      return (
                        <div key={item.id} className="pc-card" onClick={() => showEditModal(item)}>
                          <div className="pc-top">
                            <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
                              {initialsOf(item.description)}
                            </div>
                            <div className="pc-identity-body">
                              <Tooltip title={item.description} placement="topLeft">
                                <div className="pc-title" style={{ fontSize: '13px' }}>{item.description}</div>
                              </Tooltip>
                              <div className="pc-client-line">
                                <span className="pc-client-key">Category:</span>
                                <span className="pc-client-val" style={{ textTransform: 'capitalize' }}>
                                  {item.category.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                            <Dropdown
                              menu={actionMenu(item)}
                              overlayClassName="pp-action-pop"
                              trigger={['click']}
                              placement="bottomRight"
                            >
                              <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                                <EllipsisOutlined />
                              </button>
                            </Dropdown>
                          </div>

                          <div className="pc-foot">
                            <div className="pc-foot-row">
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Member:</span>
                                {member ? (
                                  <>
                                    <Avatar size={16} src={member.avatarUrl} style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6', fontSize: 8, fontWeight: 700 }}>
                                      {initialsOf(member.name)}
                                    </Avatar>
                                    <span className="pc-foot-val">{member.name}</span>
                                  </>
                                ) : <span className="pc-foot-val">—</span>}
                              </span>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Date:</span>
                                <span className="pc-foot-val">{dayjs(item.date).format('MMM D, YYYY · h:mm A')}</span>
                              </span>
                            </div>
                            <div className="pc-foot-row">
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Type:</span>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: color }}>
                                  {item.type.toUpperCase()}
                                </span>
                              </span>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Amount:</span>
                                <span style={{ fontWeight: 800, color: 'var(--text-slate-900)' }}>
                                  {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
                                </span>
                              </span>
                              {/* <span className="pc-foot-div" /> */}
                              {/* <button
                              type="button"
                              className="pc-foot-item pc-view-btn"
                              onClick={(e) => { e.stopPropagation(); showEditModal(item); }}
                            >
                              <EditOutlined /> Edit
                            </button> */}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </ZukvoLoadingOverlay>
          </div>

          {/* Sticky footer pagination */}
          {total > 0 && (
            <div className="pp-footer pp-footer--sticky">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
              </div>
              <div className="pp-pager">
                <button type="button" className="pp-pager-btn" disabled={pagination.current <= 1} onClick={() => setPagination(p => ({ ...p, current: Math.max(1, p.current - 1) }))}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, pagination.current - 3), Math.max(0, pagination.current - 3) + 5).map((p) => (
                  <button key={p} type="button" className={`pp-pager-num ${p === pagination.current ? 'is-active' : ''}`} onClick={() => setPagination(prev => ({ ...prev, current: p }))}>{p}</button>
                ))}
                <button type="button" className="pp-pager-btn" disabled={pagination.current >= pageCount} onClick={() => setPagination(p => ({ ...p, current: Math.min(pageCount, p.current + 1) }))}>›</button>
                <Select
                  className="pp-pagesize"
                  value={pagination.pageSize}
                  onChange={(v) => { setPagination(p => ({ ...p, pageSize: v, current: 1 })); }}
                  options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
      </div>

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
        width={720}
        open={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedTransaction(null);
        }}
        destroyOnClose
        extra={
          modalType === 'edit' && selectedTransaction && canReadActivityLog && (
            <Button
              icon={<History size={14} />}
              onClick={() => setHistoryOpen(true)}
              size="small"
              style={{ borderRadius: 6 }}
            >
              History
            </Button>
          )
        }
        styles={{
          header: { borderBottom: '1px solid var(--accounts-card-border)', padding: '12px 18px', background: 'var(--accounts-card-bg)' },
          body: { padding: 0, background: 'var(--customers-page-bg)' },
          footer: { borderTop: '1px solid var(--accounts-card-border)', padding: '10px 18px', background: 'var(--accounts-card-bg)' },
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
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
          colon={false}
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
              >
                <SearchableDropdown
                  placeholder="Select type"
                  searchPlaceholder="Search type..."
                  itemNoun="types"
                  options={[
                    {
                      value: "credit",
                      label: "Credit (Money In)",
                      badge: (
                        <div style={{
                          width: 20, height: 20, borderRadius: '100%',
                          backgroundColor: '#8b5cf6', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 800
                        }}>C</div>
                      )
                    },
                    {
                      value: "debit",
                      label: "Debit (Money Out)",
                      badge: (
                        <div style={{
                          width: 20, height: 20, borderRadius: '100%',
                          backgroundColor: '#3b82f6', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 800
                        }}>D</div>
                      )
                    }
                  ]}
                  style={{ width: '100%', height: 40 }}
                  width="100%"
                />
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
              >
                <SearchableDropdown
                  placeholder="Select member"
                  searchPlaceholder="Search members..."
                  itemNoun="members"
                  options={memberOptions}
                  showSelectedAvatar={true}
                  disabled={modalType === 'edit'}
                  style={{ width: '100%', height: 40 }}
                  width="100%"
                />
              </Form.Item>

              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <SearchableDropdown
                  placeholder="Select category"
                  searchPlaceholder="Search categories..."
                  itemNoun="categories"
                  options={categoryOptions}
                  style={{ width: '100%', height: 40 }}
                  width="100%"
                />
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
                  style={{ padding: '10px 14px' }}
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

      <TransactionHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entityType={selectedTransaction ? "account_transaction" : undefined}
        entityId={selectedTransaction?.id}
        module={selectedTransaction ? undefined : "Accounts"}
        title={selectedTransaction ? "Transaction history" : "Accounts history"}
        subtitle={selectedTransaction ? selectedTransaction.description : "All financial account events"}
      />

      <style jsx global>{`
        .pp-shell {
          display: flex;
          margin: 0 -24px;
          min-height: calc(100vh - 54px);
          background: var(--bg-pure-white);
        }
        .pp-shell,
        .pp-shell *,
        .ant-table,
        .ant-btn,
        .ant-select,
        .ant-picker,
        .ant-input,
        .ant-modal,
        .ant-drawer,
        .ant-tooltip,
        .ant-popconfirm,
        .ant-dropdown {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif !important;
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
        }
        .pp-side-logo .anticon { font-size: 24px !important; color: var(--text-slate-900) !important; }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .pp-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .pp-create-btn {
          height: 35px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          background: #3B82F6 !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 12px;
          color: #fff !important;
        }
        .pp-create-btn:hover { background: #2563EB !important; }
        .pp-create-btn .anticon { font-size: 12px !important; }
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
        .pp-side-switch-wrap {
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 8px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); margin-top: 2px;
        }
        .pp-side-switch-label { font-size: 11.5px; font-weight: 600; color: var(--text-slate-700); }
        .pp-clear-filters {
          display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
          background: none; border: none; cursor: pointer; padding: 3px;
          font-size: 12px; font-weight: 600; color: #64748b;
        }
        .pp-clear-filters:hover { color: #3b82f6; }
        .pp-trash {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0; text-align: left;
          margin: 0 -14px 0 -38px; padding: 0 0 0 38px;
          height: 45px;
          width: calc(100% + 52px);
          border-top: 1px solid var(--border-slate-200);
          background: transparent; color: var(--text-slate-600); font-size: 13px; font-weight: 500; cursor: pointer;
        }
        .pp-trash .anticon { font-size: 15px; }
        .pp-trash:hover { color: #3B82F6; }

        /* ---------------- Main ---------------- */
        .pp-main { flex: 1; min-width: 0; padding: 8px 32px 0 20px; display: flex; flex-direction: column; }
        .pp-body { flex: 1 0 auto; padding-bottom: 60px; }
        .pp-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
        .pp-search-wrap {
          position: relative; flex: 1; max-width: 520px; min-width: 240px; display: flex; align-items: center;
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
        .pp-kbd {
          font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          border-radius: 5px; padding: 1px 6px;
        }
        .pp-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
        .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-meta-dot { color: var(--text-slate-300); }
        .pp-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
        .pp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
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
        .pp-stat-delta {
          display: inline-flex; align-items: center; gap: 2px; font-size: 10.5px; font-weight: 700;
          border-radius: 6px; padding: 1px 6px;
        }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; white-space: nowrap; }
        .pp-stat-spark { opacity: 0.95; }

        /* Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table-wrap ::-webkit-scrollbar { display: none !important; }
        .pp-table-wrap, .pp-table-wrap * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .pp-table .ant-table, .pp-table .ant-table-container, .pp-table .ant-table-content { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important; border-radius: 0 !important;
        }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }

        .pp-date { display: flex; flex-direction: column; line-height: 1.25; }
        .pp-date-main { font-size: 11px; font-weight: 500; color: var(--text-slate-700); }
        .pp-date-sub { font-size: 9.5px; color: var(--text-slate-400); }

        .pp-vis-pill {
          display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
          border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
        }
        .pp-vis-dot { width: 6px; height: 6px; border-radius: 50%; }

        .pp-creator { display: flex; align-items: center; gap: 6px; }
        .pp-creator-name { font-size: 11.5px; color: var(--text-slate-700); white-space: nowrap; }

        .pp-tag {
          display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px;
          border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap;
        }
        .pp-tag--blue { background: var(--bg-blue-50); color: #3B82F6; }
        .pp-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
        .pp-muted { color: var(--text-slate-400); }

        .pp-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        .pp-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

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

        /* Empty + grid */
        .pp-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .pp-empty-orb {
          width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
        }
        .pp-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }
        .pp-btn-primary {
          background: #3B82F6 !important; border: none !important;
          border-radius: 8px !important; font-weight: 600 !important;
        }
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
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); flex-shrink: 0; }
        .pc-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .pc-view-btn .anticon { font-size: 12px; }
        .pc-view-btn:hover { text-decoration: underline; }

        /* Premium action dropdown */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          overflow: hidden !important;
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
          overflow: hidden !important;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }
        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }
        .pc-status-tag .anticon { font-size: 9px; }

        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pp-mobile-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text-slate-600);
          margin-right: 12px;
        }
        .pp-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(2px);
          z-index: 999;
        }

        @media (max-width: 1250px) {
          .pp-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1024px) {
          .pp-stats { grid-template-columns: 1fr; }
          .pp-sidebar {
            position: fixed;
            left: -280px;
            top: 54px;
            bottom: 0;
            height: calc(100vh - 54px);
            transition: left 0.3s ease;
            z-index: 1000;
            box-shadow: 4px 0 24px rgba(15, 23, 42, 0.1);
          }
          .pp-sidebar.is-open { left: 0; }
          .pp-backdrop { display: block; }
          .pp-mobile-toggle { display: flex; }
        }

        /* Accounts breakdown components (Drawers styles preserved with Blue, Green, Grey theme) */
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
          color: #3b82f6;
          background: linear-gradient(135deg, rgba(59,130,246,0.14), rgba(100,116,139,0.14));
          border: 1px solid rgba(59,130,246,0.22);
          box-shadow: 0 8px 18px -10px rgba(59,130,246,0.55);
        }
        .accounts-breakdown__title-text { line-height: 1.15; }
        .accounts-breakdown__title-main {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--text-slate-900);
        }
        .accounts-breakdown__title-sub {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-400);
          margin-top: 2px;
        }
        .accounts-breakdown__body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px 22px 28px;
        }
        .accounts-breakdown__hero {
          position: relative;
          padding: 1px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(59,130,246,0.35), rgba(100,116,139,0.20) 45%, var(--border-slate-200) 100%);
          isolation: isolate;
        }
        .accounts-breakdown__hero-glow {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          background: radial-gradient(120% 80% at 100% 0%, rgba(100,116,139,0.18) 0%, transparent 55%);
          pointer-events: none;
          z-index: 0;
        }
        .accounts-breakdown__hero-inner {
          position: relative;
          z-index: 1;
          padding: 18px 18px 16px;
          border-radius: 17px;
          background: var(--bg-pure-white);
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
          color: var(--text-slate-400);
        }
        .accounts-breakdown__hero-value {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-slate-900);
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
          color: #3b82f6;
          background: rgba(59,130,246,0.10);
          border: 1px solid rgba(59,130,246,0.22);
        }
        .accounts-breakdown__hero-sub {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-slate-400);
        }
        .accounts-breakdown__stack {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          overflow: hidden;
          display: flex;
          background: rgba(100, 116, 139, 0.1);
          box-shadow: inset 0 0 0 1px var(--border-slate-200);
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
          color: var(--text-slate-600);
          text-transform: capitalize;
        }
        .accounts-breakdown__legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          display: inline-block;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
        }
        .accounts-breakdown__legend-more {
          color: var(--text-slate-400);
        }
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
          color: var(--text-slate-400);
        }
        .accounts-breakdown__list-hint {
          color: var(--text-slate-400);
          font-weight: 500;
          letter-spacing: .04em;
          text-transform: none;
          font-size: 10.5px;
        }
        .accounts-breakdown__row {
          position: relative;
          padding: 14px 16px;
          border-radius: 14px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
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
          border-color: color-mix(in srgb, var(--cat-color) 40%, var(--border-slate-200));
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
          color: var(--text-slate-400);
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
          color: var(--text-slate-900);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .accounts-breakdown__row-amount {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--text-slate-900);
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
          color: var(--text-slate-400);
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
          color: var(--text-slate-400);
        }
        .accounts-recent-drawer__count {
          color: var(--text-slate-400);
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
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
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
        .accounts-recent-drawer__row.is-credit::before { background: #10b981; }
        .accounts-recent-drawer__row.is-debit::before { background: #64748b; }
        .accounts-recent-drawer__row:hover {
          transform: translateY(-1px);
        }
        .accounts-recent-drawer__row.is-credit:hover {
          border-color: color-mix(in srgb, #10b981 35%, var(--border-slate-200));
          box-shadow: 0 14px 28px -22px color-mix(in srgb, #10b981 65%, transparent);
        }
        .accounts-recent-drawer__row.is-debit:hover {
          border-color: color-mix(in srgb, #64748b 35%, var(--border-slate-200));
          box-shadow: 0 14px 28px -22px color-mix(in srgb, #64748b 65%, transparent);
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
          color: #10b981;
          background: rgba(16,185,129,0.10);
          border: 1px solid color-mix(in srgb, #10b981 25%, transparent);
        }
        .accounts-recent-drawer__row.is-debit .accounts-recent-drawer__avatar {
          color: #64748b;
          background: rgba(100,116,139,0.10);
          border: 1px solid color-mix(in srgb, #64748b 25%, transparent);
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
          color: var(--text-slate-900);
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
          color: var(--text-slate-400);
        }
        .accounts-recent-drawer__member {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--text-slate-600);
          font-weight: 600;
        }
        .accounts-recent-drawer__dot {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: var(--text-slate-400);
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
        .accounts-recent-drawer__amount {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .accounts-recent-drawer__row.is-credit .accounts-recent-drawer__amount {
          color: #10b981;
        }
        .accounts-recent-drawer__row.is-debit .accounts-recent-drawer__amount {
          color: #64748b;
        }

        /* ===== Transaction Drawer Styles ===== */
        .accounts-tx-drawer__icon.is-add {
          color: #3b82f6 !important;
          background: linear-gradient(135deg, rgba(59,130,246,0.16), rgba(100,116,139,0.14)) !important;
          border: 1px solid rgba(59,130,246,0.24) !important;
          box-shadow: 0 8px 18px -10px rgba(59,130,246,0.55) !important;
        }
        .accounts-tx-drawer__icon.is-edit {
          color: #64748b !important;
          background: linear-gradient(135deg, rgba(100,116,139,0.18), rgba(100,116,139,0.14)) !important;
          border: 1px solid rgba(100,116,139,0.28) !important;
          box-shadow: 0 8px 18px -10px rgba(100,116,139,0.55) !important;
        }
        .accounts-tx-drawer__body {
          padding: 12px 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .accounts-tx-drawer__footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }
        .accounts-tx-section {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0 !important;
          padding: 12px 14px 4px;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03);
        }
        .accounts-tx-section__head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px dashed var(--border-slate-200);
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
          color: #3b82f6;
          background: rgba(59,130,246,0.10);
          border: 1px solid rgba(59,130,246,0.22);
          font-variant-numeric: tabular-nums;
        }
        .accounts-tx-section__title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .accounts-tx-section__sub {
          font-size: 11px;
          color: var(--text-slate-400);
          margin-top: 2px;
          font-weight: 500;
        }
        .accounts-tx-form .ant-form-item-label {
          padding-bottom: 4px !important;
        }
        .accounts-tx-form .ant-form-item-label > label {
          font-size: 11.5px !important;
          font-weight: 600 !important;
          color: var(--text-slate-400) !important;
          letter-spacing: .02em;
          height: 18px !important;
        }
        .accounts-tx-form .ant-form-item {
          margin-bottom: 10px;
        }
        .accounts-tx-form .fp-trigger {
          width: 100% !important;
          height: 38px !important;
          border-radius: 8px !important;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          padding: 0 14px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          font-weight: 500 !important;
          font-size: 13.5px !important;
          color: var(--text-slate-700) !important;
          transition: border-color .2s ease, box-shadow .2s ease !important;
        }
        .accounts-tx-form .fp-trigger:hover {
          border-color: #3b82f6 !important;
        }
        .accounts-tx-form .fp-trigger.is-open,
        .accounts-tx-form .fp-trigger.is-active {
          border-color: #3b82f6 !important;
          background: var(--bg-pure-white) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
          color: var(--text-slate-900) !important;
        }
        .accounts-tx-form .fp-trigger-chevron {
          margin-left: auto !important;
        }
        .accounts-tx-form .ant-input,
        .accounts-tx-form .ant-input-textarea,
        .accounts-tx-form .ant-input-number,
        .accounts-tx-form .ant-picker,
        .accounts-tx-form .ant-select-selector {
          border-radius: 8px !important;
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .accounts-tx-form .ant-input-textarea {
          position: relative !important;
        }
        .accounts-tx-form .ant-input-lg,
        .accounts-tx-form .ant-input-number-lg,
        .accounts-tx-form .ant-picker-large,
        .accounts-tx-form .ant-select-lg .ant-select-selector {
          border-radius: 8px !important;
        }
        .accounts-tx-form .ant-input:hover,
        .accounts-tx-form .ant-input-textarea:hover,
        .accounts-tx-form .ant-input-number:hover,
        .accounts-tx-form .ant-picker:hover,
        .accounts-tx-form .ant-select:hover .ant-select-selector {
          border-color: #3b82f6 !important;
        }
        .accounts-tx-form .ant-input:focus,
        .accounts-tx-form .ant-input-focused,
        .accounts-tx-form .ant-input-textarea:focus-within,
        .accounts-tx-form .ant-input-number-focused,
        .accounts-tx-form .ant-picker-focused,
        .accounts-tx-form .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
        }
        .accounts-tx-form .ant-input-textarea textarea {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          outline: none !important;
          padding: 10px 14px 30px 14px !important;
          resize: none !important;
        }
        .accounts-tx-form .ant-input-textarea::after,
        .accounts-tx-form .ant-input-textarea .ant-input-data-count {
          position: absolute !important;
          bottom: 8px !important;
          right: 12px !important;
          font-size: 11px !important;
          color: var(--text-slate-400) !important;
          margin: 0 !important;
          float: none !important;
          pointer-events: none !important;
        }
        .accounts-tx-form .ant-input-number-input {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
      `}</style>
    </MainLayout>
  );
}
