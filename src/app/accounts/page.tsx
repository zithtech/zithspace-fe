'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
} from '@ant-design/icons';
import { Transaction, CreateTransactionData, UpdateTransactionData, User } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useRBAC } from '@/lib/rbac';

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

export default function AccountsPage() {
  const { data: session } = useSession();
  const [form] = Form.useForm();

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<User[]>([]);
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

  // RBAC permissions
  const rbac = useRBAC(session?.user?.role as any);
  const canManage = rbac.canManageTransactions;

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.pageSize.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter) params.append('type', typeFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (memberFilter) params.append('member', memberFilter);
      if (dateRange) {
        params.append('startDate', dateRange[0]?.toISOString());
        params.append('endDate', dateRange[1]?.toISOString());
      }

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data.data);
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
        }));
      } else {
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange[0]?.toISOString());
        params.append('endDate', dateRange[1]?.toISOString());
      }

      const response = await fetch(`/api/transactions/summary?${params}`);
      const data = await response.json();

      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Fetch summary error:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Fetch members
  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members?limit=100');
      const data = await response.json();
      if (data.success) {
        setMembers(data.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchTransactions();
      fetchSummary();
      fetchMembers();
    }
  }, [session, pagination.current, pagination.pageSize, searchTerm, typeFilter, categoryFilter, memberFilter, dateRange]);

  // Handle form submission
  const handleSubmit = async (values: TransactionFormData) => {
    try {
      setFormLoading(true);
      setError('');
      
      const payload: CreateTransactionData | UpdateTransactionData = {
        type: values.type,
        amount: values.amount,
        member: values.member,
        category: values.category,
        description: values.description,
        notes: values.notes || '',
        date: values.date.toDate(),
      };

      const response = modalType === 'edit' && selectedTransaction
        ? await fetch(`/api/transactions/${selectedTransaction._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const data = await response.json();

      if (data.success) {
        setSuccess(modalType === 'edit' ? 'Transaction updated successfully' : 'Transaction created successfully');
        setIsModalVisible(false);
        form.resetFields();
        setSelectedTransaction(null);
        fetchTransactions();
        fetchSummary();
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (error) {
      setError('Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTransaction) return;

    try {
      setFormLoading(true);

      const response = await fetch(`/api/transactions/${selectedTransaction._id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setSuccess('Transaction deleted successfully');
        setIsModalVisible(false);
        setSelectedTransaction(null);
        fetchTransactions();
        fetchSummary();
      } else {
        setError(data.error || 'Delete failed');
      }
    } catch (error) {
      setError('Delete failed');
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
      amount: transaction.amount,
      member: typeof transaction.member === 'object' ? transaction.member._id : transaction.member,
      category: transaction.category,
      description: transaction.description,
      notes: transaction.notes,
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
            color: record.type === 'credit' ? '#52c41a' : '#ff4d4f',
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
        const member = typeof record.member === 'object' ? record.member : null;
        return member ? (
          <Space>
            <Avatar
              size={24}
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
                {member.position}
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
        <div>
          <Text style={{ fontSize: 12 }}>{text}</Text>
          {record.notes && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.notes}
              </Text>
            </>
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

        if (rbac.canDeleteTransactions) {
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
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space align="center">
              <BankOutlined style={{ fontSize: 24, color: '#1677ff' }} />
              <Title level={3} style={{ margin: 0 }}>
                Accounts Management
              </Title>
            </Space>
            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showAddModal}
                size="middle"
              >
                Add Transaction
              </Button>
            )}
          </Space>
        </div>

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
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderLeft: '4px solid #52c41a' }}>
              <Statistic
                title="Total Credits"
                value={summary?.balance?.credits || 0}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: 20 }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {summary?.balance?.creditCount || 0} transactions
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderLeft: '4px solid #ff4d4f' }}>
              <Statistic
                title="Total Debits"
                value={summary?.balance?.debits || 0}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<ArrowDownOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f', fontSize: 20 }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {summary?.balance?.debitCount || 0} transactions
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderLeft: '4px solid #1677ff' }}>
              <Statistic
                title="Net Balance"
                value={summary?.balance?.net || 0}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<WalletOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ 
                  color: (summary?.balance?.net || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                  fontSize: 20 
                }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {summary?.balance?.totalCount || 0} total transactions
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ borderLeft: '4px solid #722ed1' }}>
              <Statistic
                title="This Month"
                value={summary?.monthlyTrend?.[summary.monthlyTrend.length - 1]?.net || 0}
                formatter={(value) => formatCurrency(Number(value))}
                prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: 20 }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Current month activity
              </Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* Main Transactions Table */}
          <Col xs={24} lg={16}>
            {/* Filters */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space wrap size={12}>
                <Input
                  placeholder="Search transactions..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 200 }}
                  allowClear
                />
                
                <Select
                  placeholder="Type"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: 100 }}
                  allowClear
                >
                  <Option value="credit">Credit</Option>
                  <Option value="debit">Debit</Option>
                </Select>

                <Select
                  placeholder="Category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: 140 }}
                  allowClear
                >
                  <Option value="salary">Salary</Option>
                  <Option value="bonus">Bonus</Option>
                  <Option value="client_payment">Client Payment</Option>
                  <Option value="expense">Expense</Option>
                  <Option value="office_expense">Office Expense</Option>
                  <Option value="investment">Investment</Option>
                  <Option value="refund">Refund</Option>
                  <Option value="other">Other</Option>
                </Select>

                {canManage && (
                  <Select
                    placeholder="Member"
                    value={memberFilter}
                    onChange={setMemberFilter}
                    style={{ width: 150 }}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {members.map((member) => (
                      <Option key={member._id} value={member._id}>
                        {member.name}
                      </Option>
                    ))}
                  </Select>
                )}

                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: 240 }}
                  size="middle"
                />
              </Space>
            </Card>

            {/* Transactions Table */}
            <Card size="small" styles={{ body: { padding: 0 } }} className="compact-table">
              <Table
                columns={columns}
                dataSource={transactions}
                rowKey="_id"
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

          {/* Sidebar - Category Breakdown & Recent Activity */}
          <Col xs={24} lg={8}>
            {/* Category Breakdown */}
            <Card
              title={
                <Space>
                  <CreditCardOutlined style={{ color: '#1677ff' }} />
                  <span>Category Breakdown</span>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
              styles={{ body: { padding: 16 } }}
            >
              {summary?.categoryBreakdown?.length > 0 ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {summary.categoryBreakdown.slice(0, 6).map((item: any, index: number) => (
                    <div key={index}>
                      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Tag
                          color={getCategoryColor(item.category)}
                          style={{ fontSize: 10, margin: 0 }}
                        >
                          {item.category.replace('_', ' ').toUpperCase()}
                        </Tag>
                        <Text strong style={{ fontSize: 12 }}>
                          {formatCurrency(Math.abs(item.total))}
                        </Text>
                      </Space>
                      <Progress
                        percent={Math.min(100, (Math.abs(item.total) / Math.max(...summary.categoryBreakdown.map((c: any) => Math.abs(c.total)))) * 100)}
                        strokeColor={getCategoryColor(item.category)}
                        size="small"
                        showInfo={false}
                      />
                    </div>
                  ))}
                </Space>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No data available"
                  style={{ margin: '20px 0' }}
                />
              )}
            </Card>

            {/* Recent Transactions */}
            <Card
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#52c41a' }} />
                  <span>Recent Activity</span>
                </Space>
              }
              size="small"
              styles={{ body: { padding: 0 } }}
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
                              size={32}
                              style={{
                                backgroundColor: item.type === 'credit' ? '#52c41a' : '#ff4d4f',
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {item.type === 'credit' ? '+' : '-'}
                            </Avatar>
                          }
                          title={
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 12 }}>{item.description}</Text>
                              <Text
                                strong
                                style={{
                                  fontSize: 12,
                                  color: item.type === 'credit' ? '#52c41a' : '#ff4d4f',
                                }}
                              >
                                {formatCurrency(item.amount)}
                              </Text>
                            </Space>
                          }
                          description={
                            <Space>
                              <Text type="secondary" style={{ fontSize: 10 }}>
                                {member?.name || 'Unknown'}
                              </Text>
                              <Divider type="vertical" style={{ margin: '0 4px' }} />
                              <Text type="secondary" style={{ fontSize: 10 }}>
                                {dayjs(item.date).format('MMM DD')}
                              </Text>
                            </Space>
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
                  <Select placeholder="Select type">
                    <Option value="credit">
                      <Space>
                        <ArrowUpOutlined style={{ color: '#52c41a' }} />
                        Credit (Money In)
                      </Space>
                    </Option>
                    <Option value="debit">
                      <Space>
                        <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
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
                >
                  <Select
                    placeholder="Select member"
                    showSearch
                    optionFilterProp="children"
                  >
                    {members.map((member) => (
                      <Option key={member._id} value={member._id}>
                        <Space>
                          <Avatar size={20} style={{ fontSize: 10 }}>
                            {member.name.charAt(0)}
                          </Avatar>
                          {member.name} - {member.position}
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
                  <Select placeholder="Select category">
                    <Option value="salary">Salary</Option>
                    <Option value="bonus">Bonus</Option>
                    <Option value="client_payment">Client Payment</Option>
                    <Option value="expense">Expense</Option>
                    <Option value="office_expense">Office Expense</Option>
                    <Option value="investment">Investment</Option>
                    <Option value="refund">Refund</Option>
                    <Option value="other">Other</Option>
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
      </div>
    </MainLayout>
  );
}
