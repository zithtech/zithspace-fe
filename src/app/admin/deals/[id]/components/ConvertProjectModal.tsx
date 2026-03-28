'use client';

import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, DatePicker, Select, InputNumber, Space, message, Divider, Typography, Button } from 'antd';
import { RocketOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Deal } from '@/services/dealService';
import { ClientService, ClientSelectOption } from '@/services/clientService';
import { userService } from '@/services/userService';

const { Text, Title } = Typography;
const { Option } = Select;

interface ConvertProjectModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (project: any) => void;
  deal: Deal;
  submitting: boolean;
  onConvert: (values: any) => Promise<void>;
}

const ConvertProjectModal: React.FC<ConvertProjectModalProps> = ({
  open,
  onCancel,
  onSuccess,
  deal,
  submitting,
  onConvert
}) => {
  const [form] = Form.useForm();
  const [clients, setClients] = useState<ClientSelectOption[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
      form.setFieldsValue({
        name: deal.title,
        description: deal.notes || `Project converted from deal: ${deal.title}`,
        startDate: dayjs(),
        endDate: deal.expectedClosingDate ? dayjs(deal.expectedClosingDate) : null,
        budget: deal.estimatedValue,
        defaultPriority: 'medium',
        billingType: 'Fixed',
        memberIds: deal.assignees?.map(a => a.user.id) || []
      });
    }
  }, [open, deal, form]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientData, userData] = await Promise.all([
        ClientService.getClientsForSelect(),
        userService.getUsers()
      ]);
      setClients(clientData);
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load modal data:', error);
      message.error('Failed to load clients or users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onConvert(values);
    } catch (error) {
      // Validation error handled by form
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <RocketOutlined style={{ color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Convert Deal to Project</Title>
        </Space>
      }
      open={open}
      onClose={onCancel}
      width={600}
      extra={
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button 
            type="primary" 
            loading={submitting} 
            onClick={handleSubmit}
            style={{ background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
          >
            Convert & Mark as Won
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
      >
        <div style={{ padding: '12px', backgroundColor: 'rgba(24, 144, 255, 0.05)', borderRadius: '8px', marginBottom: '24px' }}>
          <Text type="secondary">This action will create a new project based on the deal information. The deal status will be updated to <Text strong color="success">Won</Text>.</Text>
        </div>

        <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>Project Details</Divider>
        
        <Form.Item name="name" label="Project Name" rules={[{ required: true, message: 'Please enter project name' }]}>
          <Input placeholder="Enter project name" />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="projectCode" label="Project Code" style={{ flex: 1 }}>
            <Input placeholder="e.g. PRJ-2024" />
          </Form.Item>
          <Form.Item name="defaultPriority" label="Default Priority" style={{ flex: 1 }} rules={[{ required: true }]}>
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="description" label="Project Description">
          <Input.TextArea rows={3} placeholder="Add project background..." />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="startDate" label="Start Date" style={{ flex: 1 }} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="projectManagerId" label="Project Manager" rules={[{ required: true, message: 'Please select a project manager' }]}>
          <Select 
            placeholder="Select manager"
            showSearch
            optionFilterProp="children"
            loading={loading}
          >
            {users.map(user => (
              <Option key={user.id} value={user.id}>{user.name} ({user.email})</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="memberIds" label="Team Members">
          <Select 
            mode="multiple"
            placeholder="Select team members"
            showSearch
            optionFilterProp="children"
            loading={loading}
            suffixIcon={<TeamOutlined />}
          >
            {users.map(user => (
              <Option key={user.id} value={user.id}>{user.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Divider orientation="left" style={{ margin: '24px 0 16px 0' }}>Client & Finance</Divider>

        <Form.Item name="clientId" label="Assign to Client" rules={[{ required: true, message: 'Please select a client' }]}>
          <Select 
            placeholder="Search and select client"
            showSearch
            optionFilterProp="label"
            loading={loading}
            options={clients}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="billingType" label="Billing Type" style={{ flex: 1 }} rules={[{ required: true }]}>
            <Select>
              <Option value="Fixed">Fixed Price</Option>
              <Option value="Hourly">Hourly</Option>
              <Option value="Monthly">Monthly</Option>
              <Option value="Free">Free</Option>
            </Select>
          </Form.Item>
          <Form.Item name="budget" label="Project Budget" style={{ flex: 1 }}>
            <InputNumber 
              style={{ width: '100%' }} 
              prefix={<DollarOutlined />}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};

export default ConvertProjectModal;
