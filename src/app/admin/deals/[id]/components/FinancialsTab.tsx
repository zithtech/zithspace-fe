'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Progress,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Divider
} from 'antd';
import { 
  DollarOutlined, 
  PercentageOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { dealService, DealPaymentSchedule } from '@/services/dealService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface FinancialsTabProps {
  dealId: string;
}

const FinancialsTab: React.FC<FinancialsTabProps> = ({ dealId }) => {
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<any>(null);
  const [isMilestoneModalVisible, setIsMilestoneModalVisible] = useState(false);
  const [isFinancialModalVisible, setIsFinancialModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [financialForm] = Form.useForm();

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const data = await dealService.getFinancials(dealId);
      setFinancialData(data);
    } catch (error) {
      console.error('Failed to fetch financials:', error);
      message.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [dealId]);

  const handleUpdateFinancials = async (values: any) => {
    try {
      await dealService.updateFinancials(dealId, values);
      message.success('Financials updated successfully');
      setIsFinancialModalVisible(false);
      fetchFinancials();
    } catch (error) {
      message.error('Failed to update financials');
    }
  };

  const handleAddMilestone = async (values: any) => {
    try {
      await dealService.createPaymentMilestone(dealId, {
        ...values,
        dueDate: values.dueDate.toISOString()
      });
      message.success('Milestone added successfully');
      setIsMilestoneModalVisible(false);
      form.resetFields();
      fetchFinancials();
    } catch (error) {
      message.error('Failed to add milestone');
    }
  };

  const handleUpdatePaymentStatus = async (milestoneId: string, status: string) => {
    try {
      await dealService.updatePaymentStatus(milestoneId, status);
      message.success(`Status updated to ${status}`);
      fetchFinancials();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  if (loading && !financialData) return <div>Loading financials...</div>;

  const estimatedValue = Number(financialData?.estimatedValue || 0);
  const cost = Number(financialData?.cost || 0);
  const profit = estimatedValue - cost;
  const margin = estimatedValue > 0 ? (profit / estimatedValue) * 100 : 0;

  const chartData = [
    { name: 'Revenue', value: estimatedValue, color: '#1890ff' },
    { name: 'Cost', value: cost, color: '#ff4d4f' },
    { name: 'Profit', value: profit, color: '#52c41a' },
  ];

  const columns = [
    {
      title: 'Milestone',
      dataIndex: 'milestone',
      key: 'milestone',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${Number(amount).toLocaleString()}`,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Paid' ? 'success' : 'warning'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: DealPaymentSchedule) => (
        <Space size="middle">
          {record.status === 'Pending' ? (
            <Button 
              type="text" 
              icon={<CheckCircleOutlined />} 
              onClick={() => handleUpdatePaymentStatus(record.id, 'Paid')}
              style={{ color: '#52c41a' }}
            >
              Mark Paid
            </Button>
          ) : (
            <Button 
              type="text" 
              icon={<ClockCircleOutlined />} 
              onClick={() => handleUpdatePaymentStatus(record.id, 'Pending')}
              style={{ color: '#faad14' }}
            >
              Set Pending
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const glassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(5px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <Row gutter={[24, 24]}>
        {/* Statistics Cards */}
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={glassStyle}>
            <Statistic
              title="Estimated Value"
              value={estimatedValue}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => {
                financialForm.setFieldsValue({ estimatedValue, cost });
                setIsFinancialModalVisible(true);
              }}
              style={{ padding: 0, marginTop: 8 }}
            >
              Edit Values
            </Button>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={glassStyle}>
            <Statistic
              title="Projected Cost"
              value={cost}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={glassStyle}>
            <Statistic
              title="Projected Profit"
              value={profit}
              precision={2}
              prefix={profit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              valueStyle={{ color: profit >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={glassStyle}>
            <Statistic
              title="Profit Margin"
              value={margin}
              precision={1}
              prefix={<PercentageOutlined />}
              suffix="%"
              valueStyle={{ color: margin >= 20 ? '#52c41a' : '#faad14' }}
            />
            <Progress 
              percent={margin} 
              showInfo={false} 
              strokeColor={margin >= 20 ? '#52c41a' : '#faad14'} 
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>

        {/* Chart Section */}
        <Col xs={24} lg={10}>
          <Card variant="borderless" title="Financial Overview" style={{ ...glassStyle, height: '100%' }}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Payment Schedule Table */}
        <Col xs={24} lg={14}>
          <Card 
            variant="borderless" 
            title="Payment Schedule" 
            style={glassStyle}
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsMilestoneModalVisible(true)}>
                Add Milestone
              </Button>
            }
          >
            <Table 
              columns={columns} 
              dataSource={financialData?.paymentSchedule || []} 
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>

      {/* Financials Edit Modal */}
      <Modal
        title="Edit Deal Financials"
        open={isFinancialModalVisible}
        onCancel={() => setIsFinancialModalVisible(false)}
        onOk={() => financialForm.submit()}
      >
        <Form
          form={financialForm}
          layout="vertical"
          onFinish={handleUpdateFinancials}
        >
          <Form.Item name="estimatedValue" label="Estimated Value">
            <InputNumber 
              suffix="$" 
              style={{ width: '100%' }} 
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
            />
          </Form.Item>
          <Form.Item name="cost" label="Projected Cost">
            <InputNumber 
              suffix="$" 
              style={{ width: '100%' }} 
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Milestone Modal */}
      <Modal
        title="Add Payment Milestone"
        open={isMilestoneModalVisible}
        onCancel={() => setIsMilestoneModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMilestone}
          initialValues={{ status: 'Pending' }}
        >
          <Form.Item name="milestone" label="Milestone Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Initial Deposit" />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber 
              suffix="$" 
              style={{ width: '100%' }} 
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
            />
          </Form.Item>
          <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinancialsTab;
