'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  Switch,
  notification,
  Popconfirm,
  Card,
  Typography,
  Divider,
  Tag,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { ApprovalWorkflowService, ExitApprovalStep } from '@/services/approvalWorkflowService';
import { PositionService } from '@/services/positionService';

const { Title, Text, Paragraph } = Typography;

const ApprovalWorkflowPage: React.FC = () => {
  const [steps, setSteps] = useState<ExitApprovalStep[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStep, setEditingStep] = useState<ExitApprovalStep | null>(null);
  const [form] = Form.useForm();
  const [notificationApi, notificationContextHolder] = notification.useNotification();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching workflow data...');
      const [stepsData, positionsData] = await Promise.all([
        ApprovalWorkflowService.getSteps(),
        PositionService.getAll()
      ]);
      console.log('✅ Fetched Steps:', stepsData);
      console.log('✅ Fetched Positions:', positionsData);
      
      setSteps(Array.isArray(stepsData) ? stepsData : []);
      setPositions(Array.isArray(positionsData) ? positionsData : []);
    } catch (error: any) {
      console.error('❌ Data fetch error:', error);
      notificationApi.error({
        message: 'Error',
        description: 'Failed to fetch data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    console.log('➕ Add Step clicked');
    setEditingStep(null);
    form.resetFields();
    form.setFieldsValue({ 
      stepOrder: (Array.isArray(steps) ? steps.length : 0) + 1, 
      mandatory: true 
    });
    setModalVisible(true);
  };

  const handleEdit = (record: ExitApprovalStep) => {
    console.log('📝 Edit Step clicked:', record);
    setEditingStep(record);
    form.setFieldsValue({
      ...record,
      roleIds: record.roleIds || []
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await ApprovalWorkflowService.deleteStep(id);
      notificationApi.success({
        message: 'Success',
        description: 'Approval step deleted successfully'
      });
      fetchData();
    } catch (error: any) {
      notificationApi.error({
        message: 'Error',
        description: error.message || 'Failed to delete approval step'
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editingStep) {
        await ApprovalWorkflowService.updateStep(editingStep.id, values);
        notificationApi.success({
          message: 'Success',
          description: 'Approval step updated successfully'
        });
      } else {
        await ApprovalWorkflowService.createStep(values);
        notificationApi.success({
          message: 'Success',
          description: 'Approval step added successfully'
        });
      }
      
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      console.error('Validation/Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: any) => {
    try {
      await ApprovalWorkflowService.updateStep(id, { [field]: value });
      notificationApi.success({
        message: 'Success',
        description: 'Field updated successfully'
      });
      fetchData();
    } catch (error: any) {
      notificationApi.error({
        message: 'Error',
        description: error.message || 'Failed to update field'
      });
    }
  };

  const columns = [
    {
      title: 'Step Order',
      dataIndex: 'stepOrder',
      key: 'stepOrder',
      width: 120,
      align: 'center' as const,
      render: (order: number) => <Tag color="blue">Step {order}</Tag>
    },
    {
      title: 'Position',
      dataIndex: 'roleIds',
      key: 'roleIds',
      align: 'center' as const,
      render: (roleIds: string[], record: ExitApprovalStep) => (
        <Select
          mode="multiple"
          style={{ width: '100%', minWidth: '200px' }}
          placeholder="Select positions"
          value={Array.isArray(roleIds) ? roleIds : []}
          onChange={(val) => handleInlineUpdate(record.id, 'roleIds', val)}
          options={(positions || []).map(p => ({ label: p.title, value: p.id }))}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      )
    },
    {
      title: 'Mandatory',
      dataIndex: 'mandatory',
      key: 'mandatory',
      width: 120,
      align: 'center' as const,
      render: (mandatory: boolean, record: ExitApprovalStep) => (
        <Switch 
          checked={mandatory} 
          onChange={(val) => handleInlineUpdate(record.id, 'mandatory', val)} 
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: ExitApprovalStep) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#1890ff' }} />} 
            onClick={() => handleEdit(record)} 
          />
          <Popconfirm
            title="Are you sure you want to delete this step?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '0px' }}>
      {notificationContextHolder}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>Approval Workflow Configuration</Title>
          <Text type="secondary">Define the sequence of approvals required for employee exit requests.</Text>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            size="large"
            style={{ borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            Add Step
          </Button>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '1000px', margin: '0 auto' }}>
        <Table 
          columns={columns} 
          dataSource={steps} 
          rowKey="id" 
          loading={loading}
          pagination={false}
          className="custom-table"
        />
      </Card>

      <Modal
        title={
          <Space>
            <SettingOutlined style={{ color: '#1890ff' }} />
            <span>{editingStep ? 'Edit Approval Step' : 'Add Approval Step'}</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
        okText={editingStep ? "Update" : "Save"}
        cancelText="Cancel"
        style={{ top: 20 }}
      >
        <div style={{ marginBottom: 24 }}>
          <Space align="start">
            <InfoCircleOutlined style={{ color: '#1890ff', marginTop: 4 }} />
            <Text type="secondary">
              This form is used to configure approval steps. Each step defines which positions are responsible for approval.
            </Text>
          </Space>
        </div>
        
        <Divider />
        
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stepOrder"
                label="Step Order"
                rules={[{ required: true, message: 'Please input step order' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g., 1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mandatory"
                label="Mandatory Step"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="roleIds"
            label="Approver Positions"
            rules={[{ required: true, message: 'Please select at least one position' }]}
            help="Select the positions that can approve this step."
          >
            <Select
              mode="multiple"
              placeholder="Search and select positions"
              options={positions.map(p => ({ label: p.title, value: p.id }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalWorkflowPage;
