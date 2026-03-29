"use client";

import React, { useState } from 'react';
import { Table, Button, Space, Typography, Tag, Tooltip, Row, Col, Drawer, Divider, Modal, Input, Form, Alert, Card, Empty, DatePicker } from 'antd';
import { 
  BankOutlined, 
  HistoryOutlined, 
  FileExcelOutlined, 
  SendOutlined,
  MailOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { useApprovedPayouts } from '@/hooks/useApprovedPayouts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ApprovedPayoutsPage: React.FC = () => {
  const { 
    data, 
    loading, 
    bankFile,
    isGenerating,
    isMailModalVisible,
    toEmail,
    sendingEmail,
    month,
    year,
    setIsMailModalVisible,
    setToEmail,
    setMonth,
    setYear,
    generateBankFile,
    downloadBankFile,
    sendBankFileEmail,
    markAsPaid,
    markingPaid
  } = useApprovedPayouts();

  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [isHistoryDrawerVisible, setIsHistoryDrawerVisible] = useState(false);

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.employee.first_name} {record.employee.last_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.employee.employee_code}</Text>
        </Space>
      ),
    },
    {
      title: 'Month/Year',
      key: 'period',
      render: (record: any) => (
        <Tag color="blue">{record.month}/{record.year}</Tag>
      ),
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (amount: number) => (
        <Text strong>₹{Number(amount).toLocaleString('en-IN')}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'APPROVED' || status === 'Approved') color = 'success';
        if (status === 'SENT_TO_BANK') color = 'processing';
        if (status === 'PAID') color = 'purple';
        return (
          <Tag color={color} style={{ borderRadius: '4px', padding: '0 12px' }}>
            {status.replace(/_/g, ' ')}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Approval Trail">
            <Button 
              type="text" 
              icon={<HistoryOutlined style={{ color: '#1677ff', fontSize: 18 }} />} 
              onClick={() => {
                setSelectedPayout(record);
                setIsHistoryDrawerVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: '0 24px 24px 24px', backgroundColor: '#fff', minHeight: '100vh' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '24px 0', borderBottom: '1px solid #f0f0f0' }}>
          <Space align="center" size="middle">
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: '#e6f7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #91d5ff'
            }}>
              <BankOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0 }}>Approved Payroll</Title>
              <Text type="secondary">Process disbursements for approved payroll cycles</Text>
            </div>
          </Space>

          <Space>
            <div style={{ marginRight: 16 }}>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Payroll Period</Text>
              <DatePicker 
                picker="month" 
                format="MMMM YYYY"
                value={dayjs(`${year}-${month}-01`)}
                onChange={(date) => {
                  if (date) {
                    setMonth(date.month() + 1);
                    setYear(date.year());
                  }
                }}
                allowClear={false}
                style={{ width: 200, height: '40px', borderRadius: '8px' }}
                suffixIcon={<CalendarOutlined style={{ color: '#1677ff' }} />}
              />
            </div>

            {!bankFile ? (
              <Button
                type="primary"
                icon={<SyncOutlined spin={isGenerating} />}
                style={{ backgroundColor: '#1677ff', height: '40px', borderRadius: '8px', marginTop: 20 }}
                onClick={generateBankFile}
                loading={isGenerating}
                disabled={data.length === 0}
              >
                Generate Bank File
              </Button>
            ) : (
              <Space style={{ marginTop: 20 }}>
                <Button
                  icon={<DownloadOutlined />}
                  style={{ height: '40px', borderRadius: '8px' }}
                  onClick={downloadBankFile}
                >
                  Download File
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  style={{ backgroundColor: bankFile.status === 'SENT' ? '#52c41a' : '#1677ff', borderColor: bankFile.status === 'SENT' ? '#52c41a' : '#1677ff', height: '40px', borderRadius: '8px' }}
                  onClick={() => setIsMailModalVisible(true)}
                >
                  {bankFile.status === 'SENT' ? 'Resend to Bank' : 'Send to Bank'}
                </Button>
                {bankFile.status === 'SENT' && (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', height: '40px', borderRadius: '8px' }}
                    onClick={() => {
                      Modal.confirm({
                        title: 'Mark as Paid?',
                        icon: <CheckCircleOutlined style={{ color: '#722ed1' }} />,
                        content: `This will mark all payouts for ${dayjs(`${year}-${month}-01`).format('MMMM YYYY')} as PAID. This action will update the status of all employees in this period.`,
                        okText: 'Yes, Mark as Paid',
                        cancelText: 'Cancel',
                        onOk: markAsPaid,
                        okButtonProps: { style: { backgroundColor: '#722ed1', borderColor: '#722ed1' } }
                      });
                    }}
                    loading={markingPaid}
                  >
                    Mark as Paid
                  </Button>
                )}
              </Space>
            )}
          </Space>
        </div>

        {/* Status Alert */}
        {bankFile && (
          <Alert
            message={
              <Space split={<Divider type="vertical" />}>
                <Text strong>Bank File Info:</Text>
                <Text>Status: <Tag color={bankFile.status === 'SENT' ? 'success' : 'processing'}>{bankFile.status}</Tag></Text>
                <Text>Generated: <Text strong>{dayjs(bankFile.createdAt).format('DD MMM YYYY, HH:mm')}</Text> by <Text strong>{bankFile.createdBy?.name}</Text></Text>
                {bankFile.sentAt && (
                  <Text>Last Sent: <Text strong>{dayjs(bankFile.sentAt).format('DD MMM YYYY, HH:mm')}</Text> by <Text strong>{bankFile.sender?.name}</Text></Text>
                )}
              </Space>
            }
            type={bankFile.status === 'SENT' ? 'success' : 'info'}
            showIcon
            icon={bankFile.status === 'SENT' ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
            style={{ marginBottom: 24, borderRadius: '8px' }}
          />
        )}

        {data.length > 0 ? (
          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            style={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          />
        ) : (
          <Card style={{ borderRadius: '12px', textAlign: 'center', padding: '40px 0' }}>
            <Empty 
              description={
                <Space direction="vertical">
                  <Text type="secondary">No approved payouts found for {dayjs().format('MMMM YYYY')}</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>Workflows must be fully approved before they appear here.</Text>
                </Space>
              }
            />
          </Card>
        )}

        {/* History Drawer */}
        <Drawer
          title={<Space><HistoryOutlined /> Approval Trail</Space>}
          placement="right"
          onClose={() => setIsHistoryDrawerVisible(false)}
          open={isHistoryDrawerVisible}
          width={450}
        >
          {selectedPayout && (
            <div>
              <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: 24 }}>
                <Row gutter={[16, 24]}>
                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text strong style={{ fontSize: 16 }}>{selectedPayout.employee.first_name} {selectedPayout.employee.last_name}</Text>
                      <br />
                      <Text type="secondary">{selectedPayout.employee.employee_code}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Amount</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text strong style={{ color: '#1677ff', fontSize: 15 }}>₹{Number(selectedPayout.netSalary).toLocaleString('en-IN')}</Text>
                    </div>
                  </Col>
                  <Col span={24}>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bank Account Details</Text>
                    {selectedPayout.employee.bankDetail ? (
                      <div style={{ marginTop: 8, padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                        <Row gutter={[16, 8]}>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Bank Name</Text>
                            <div><Text strong>{selectedPayout.employee.bankDetail.bankName}</Text></div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Account Number</Text>
                            <div><Text strong>{selectedPayout.employee.bankDetail.accountNumber ? '********' : 'N/A'}</Text></div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 11 }}>IFSC Code</Text>
                            <div><Text strong>{selectedPayout.employee.bankDetail.ifscCode ? '********' : 'N/A'}</Text></div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Account Holder</Text>
                            <div><Text strong>{selectedPayout.employee.bankDetail.accountHolderName || `${selectedPayout.employee.first_name} ${selectedPayout.employee.last_name}`}</Text></div>
                          </Col>
                        </Row>
                        <Alert 
                          message="Sensitive bank details are masked for security" 
                          type="info" 
                          showIcon 
                          style={{ marginTop: 12, fontSize: 11 }}
                        />
                      </div>
                    ) : (
                      <div style={{ marginTop: 8 }}><Tag color="error">Bank details not configured</Tag></div>
                    )}
                  </Col>
                </Row>
              </div>
              <Divider />
              <Title level={5}>History</Title>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {(selectedPayout.approvalLogs || []).map((log: any, index: number) => (
                  <div key={log.id} style={{ 
                    padding: '12px', 
                    borderLeft: `2px solid ${log.action === 'APPROVE' ? '#1677ff' : '#ff4d4f'}`,
                    backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff',
                    marginBottom: 8,
                    borderRadius: '0 4px 4px 0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong>{log.action === 'APPROVE' ? 'Approved' : 'Rejected'}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{new Date(log.createdAt).toLocaleString()}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>By: {log.performedBy?.name}</Text>
                    {log.remarks && <div style={{ marginTop: 4, fontStyle: 'italic' }}>"{log.remarks}"</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Drawer>

        {/* Send to Bank Modal */}
        <Modal
          title={<Space><MailOutlined /> Send Disbursement to Bank</Space>}
          open={isMailModalVisible}
          onOk={sendBankFileEmail}
          onCancel={() => setIsMailModalVisible(false)}
          confirmLoading={sendingEmail}
          okText={bankFile?.status === 'SENT' ? "Resend Email" : "Send Email"}
          cancelText="Cancel"
          okButtonProps={{ style: { backgroundColor: '#1677ff', borderColor: '#1677ff' } }}
        >
          <div style={{ margin: '16px 0' }}>
            {bankFile?.status === 'SENT' && (
              <Alert 
                message="This file was already sent to the bank. Resending will create a new audit entry." 
                type="warning" 
                showIcon 
                style={{ marginBottom: 16 }}
              />
            )}
            <Text type="secondary">The previously generated Excel sheet from Cloud Storage will be attached.</Text>
            <Form layout="vertical" style={{ marginTop: 24 }}>
              <Form.Item label="Recipient Bank Email" required>
                <Input 
                  placeholder="e.g. finance@bank.com" 
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                />
              </Form.Item>
              <div style={{ padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '4px', border: '1px solid #adc6ff' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <FileExcelOutlined style={{ color: '#1890ff' }} />
                    <Text style={{ fontSize: 13 }}>{bankFile?.fileName}</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Contains {bankFile?.employeeCount} employees | Total: ₹{Number(bankFile?.totalAmount).toLocaleString('en-IN')}
                  </Text>
                </Space>
              </div>
            </Form>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default ApprovedPayoutsPage;
