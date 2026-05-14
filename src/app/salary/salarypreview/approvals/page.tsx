"use client";

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Row, 
  Col, 
  Typography, 
  message, 
  Button, 
  Space, 
  Tag, 
  Tabs, 
  Form, 
  Input, 
  Modal,
  Badge,
  Tooltip,
  Drawer,
  Divider,
  Avatar
} from 'antd';
import { 
  SafetyCertificateOutlined,
  EyeOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Timeline } from 'antd';
import MainLayout from '@/components/layout/MainLayout';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useSalaryApprovals } from '@/hooks/useSalaryApprovals';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spin } from 'antd';

const { Title, Text, Paragraph } = Typography;

const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const { canReadPayroll, canProcessPayroll } = usePermission();
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadPayroll) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadPayroll, router]);

  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <Spin size="large" tip="Loading" />
        </div>
      </MainLayout>
    );
  }

  if (!canReadPayroll) return null;
  
  const { 
    data, 
    loading, 
    isProcessing, 
    processApprovalAction 
  } = useSalaryApprovals(activeTab);

  const [isProcessModalVisible, setIsProcessModalVisible] = useState(false);
  const [isHistoryDrawerVisible, setIsHistoryDrawerVisible] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [form] = Form.useForm();

  const handleProcessAction = async (values: any) => {
    const success = await processApprovalAction({
      salaryPayoutId: selectedPayout.id,
      action: actionType,
      remarks: values.remarks
    });

    if (success) {
      setIsProcessModalVisible(false);
      form.resetFields();
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (record: any) => (
        <Space size="middle">
          <Avatar 
            style={{ backgroundColor: '#e6f7ff', color: '#1890ff', fontWeight: 600 }}
            size={36}
          >
            {record.employee.first_name?.[0]}{record.employee.last_name?.[0]}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: '13px', color: '#262626' }}>
              {record.employee.first_name} {record.employee.last_name}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.employee.employee_code || 'N/A'}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Pay Period',
      key: 'period',
      render: (record: any) => (
        <Tag color="geekblue" style={{ borderRadius: 6, margin: 0, fontWeight: 500 }}>
          {dayjs(`${record.year}-${record.month}-01`).format('MMM YYYY').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Net Payable',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (val: any) => (
        <Text strong style={{ color: '#1890ff', fontSize: 14 }}>
          ₹{Number(val).toLocaleString('en-IN')}
        </Text>
      ),
    },
    {
      title: 'Workflow Status',
      key: 'wfStatus',
      render: (record: any) => {
        let color = 'processing';
        let icon = <ClockCircleOutlined />;
        
        if (record.status === 'APPROVED') {
          color = 'success';
          icon = <CheckCircleOutlined />;
        } else if (record.status === 'REJECTED') {
          color = 'error';
          icon = <CloseCircleOutlined />;
        }

        return (
          <Space direction="vertical" size={2}>
            <Tag icon={icon} color={color} style={{ borderRadius: 6, fontWeight: 500 }}>
              {record.status}
            </Tag>
            {record.status === 'PENDING' && (
              <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>Step {record.currentStep} of Workflow</Text>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Tooltip title="View Approval Trail">
            <Button 
              type="text" 
              shape="circle"
              icon={<HistoryOutlined style={{ color: '#1890ff', fontSize: 16 }} />} 
              onClick={() => {
                setSelectedPayout(record);
                setIsHistoryDrawerVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="View Statement Details">
            <Link href={`/salary/salarypreview/preview?employeeId=${record.employeeId}&month=${record.year}-${String(record.month).padStart(2,'0')}`}>
              <Button 
                type="text" 
                shape="circle"
                icon={<EyeOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />} 
              />
            </Link>
          </Tooltip>
          {activeTab === 'pending' && canProcessPayroll && (
            <>
              <Button 
                type="primary" 
                size="small" 
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', borderRadius: 6 }}
                onClick={() => {
                  setSelectedPayout(record);
                  setActionType('APPROVE');
                  setIsProcessModalVisible(true);
                }}
              >
                Approve
              </Button>
              <Button 
                danger 
                size="small"
                style={{ borderRadius: 6 }}
                onClick={() => {
                  setSelectedPayout(record);
                  setActionType('REJECT');
                  setIsProcessModalVisible(true);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: '0 24px 24px 24px', backgroundColor: '#fff', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, padding: '24px 0', borderBottom: '1px solid #f0f0f0' }}>
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
              <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0 }}>Payroll Approvals</Title>
              <Text type="secondary">Review and approve employee salary disbursements</Text>
            </div>
          </Space>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              { key: 'pending', label: 'Pending My Approval' },
              { key: 'history', label: 'All Payouts / Status' },
            ]}
          />
        </div>

        <Table 
          columns={columns} 
          dataSource={data} 
          loading={loading}
          rowKey="id"
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} approvals`
          }}
          className="premium-table"
          style={{ 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            borderRadius: 12,
            overflow: 'hidden'
          }}
        />

        {/* Process Step Modal */}
        <Modal
          title={`${actionType === 'APPROVE' ? 'Approve' : 'Reject'} Salary Payout`}
          open={isProcessModalVisible}
          onCancel={() => setIsProcessModalVisible(false)}
          onOk={() => form.submit()}
          confirmLoading={isProcessing}
        >
          {selectedPayout && (
            <div style={{ marginBottom: 16 }}>
              <Text>Processing salary for </Text>
              <Text strong>{selectedPayout.employee.first_name} {selectedPayout.employee.last_name}</Text>
              <div><Text type="secondary">Amount: ₹{Number(selectedPayout.netSalary).toLocaleString('en-IN')}</Text></div>
            </div>
          )}
          <Form form={form} layout="vertical" onFinish={handleProcessAction}>
            <Form.Item 
              name="remarks" 
              label="Remarks" 
              rules={[{ required: actionType === 'REJECT', message: 'Remarks are required for rejection' }]}
            >
              <Input.TextArea placeholder="Add a comment..." rows={4} />
            </Form.Item>
          </Form>
        </Modal>

        {/* History Drawer */}
        <Drawer
          title={<Space><HistoryOutlined style={{ color: '#1890ff' }} /> Approval Trail</Space>}
          open={isHistoryDrawerVisible}
          onClose={() => setIsHistoryDrawerVisible(false)}
          width={500}
        >
          {selectedPayout && (
            <div style={{ padding: '0 0 12px 0' }}>
              <div style={{ marginBottom: 24, padding: 20, backgroundColor: '#f8fbfc', borderRadius: 12, border: '1px solid #e6f7ff' }}>
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
                      <Text strong style={{ color: '#1890ff', fontSize: 15 }}>₹{Number(selectedPayout.netSalary).toLocaleString('en-IN')}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color={selectedPayout.status === 'APPROVED' ? 'success' : selectedPayout.status === 'REJECTED' ? 'error' : 'processing'} style={{ borderRadius: 10, padding: '0 10px' }}>
                        {selectedPayout.status}
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </div>

              <Divider orientation="left" style={{ fontSize: 13, color: '#8c8c8c', margin: '32px 0 16px 0' }}>Timeline History</Divider>
              
              <Timeline
                mode="left"
                items={[
                  // Initial Submission
                  {
                    dot: <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />,
                    children: (
                      <div>
                        <Text strong>Submitted for Approval</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {selectedPayout.approvalLogs?.find((l: any) => l.action === 'SUBMITTED')?.performedBy?.name || 'System'} 
                          • {dayjs(selectedPayout.createdAt).format('DD MMM YYYY, hh:mm A')}
                        </Text>
                      </div>
                    ),
                  },
                  // Workflow Steps
                  ...(selectedPayout.workflow?.steps || []).map((step: any) => {
                    const log = selectedPayout.approvalLogs?.find((l: any) => l.stepNumber === step.stepOrder);
                    const isCompleted = !!log;
                    const isCurrent = !isCompleted && selectedPayout.currentStep === step.stepOrder && selectedPayout.status === 'PENDING';
                    
                    let statusColor = isCompleted ? '#52c41a' : isCurrent ? '#1890ff' : '#d9d9d9';
                    let Icon = isCompleted ? CheckCircleOutlined : isCurrent ? ClockCircleOutlined : ClockCircleOutlined;
                    if (log?.action === 'REJECTED') {
                      statusColor = '#f5222d';
                      Icon = CloseCircleOutlined;
                    }

                    let approverLabel = "";
                    if (step.approverType === 'ROLE') approverLabel = `Role: ${step.role?.name || 'Unknown'}`;
                    else if (step.approverType === 'SPECIFIC_USER') approverLabel = `User: ${step.specificUser?.name || 'Unknown'}`;

                    return {
                      color: statusColor,
                      dot: <Icon style={{ fontSize: '16px' }} />,
                      children: (
                        <div style={{ opacity: isCompleted || isCurrent ? 1 : 0.5 }}>
                          <Text strong style={{ color: isCurrent ? '#1890ff' : 'inherit' }}>
                            Step {step.stepOrder}: {approverLabel}
                          </Text>
                          {isCompleted && (
                            <div style={{ marginTop: 4 }}>
                              <Tag color={log.action === 'APPROVED' ? 'green' : 'red'} style={{ fontSize: 10 }}>
                                {log.action}
                              </Tag>
                              <br />
                              <Text style={{ fontSize: 12 }}>By: {log.performedBy?.name}</Text>
                              {log.remarks && (
                                <div style={{ marginTop: 4, fontStyle: 'italic', color: '#8c8c8c', fontSize: 12 }}>
                                  "{log.remarks}"
                                </div>
                              )}
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {dayjs(log.createdAt).format('DD MMM YYYY, hh:mm A')}
                              </Text>
                            </div>
                          )}
                          {isCurrent && (
                            <div style={{ marginTop: 4 }}>
                              <Badge status="processing" text="Current Step - Waiting for approval" />
                            </div>
                          )}
                        </div>
                      ),
                    };
                  })
                ]}
              />
            </div>
          )}
        </Drawer>

        <style jsx global>{`
          .ant-tabs-nav { margin-bottom: 0 !important; }
        `}</style>
      </div>
    </MainLayout>
  );
};

export default ApprovalsPage;
