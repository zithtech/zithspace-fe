'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Typography,
  message,
  Popconfirm,
  Tooltip,
  Card,
  Divider,
  notification,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { ReasonForExit, ReasonForExitService, ReasonForExitPayload } from '@/services/reasonForExitService';

const { Title, Paragraph } = Typography;

export default function ReasonForExitPage() {
  const [form] = Form.useForm();
  const [reasons, setReasons] = useState<ReasonForExit[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReason, setEditingReason] = useState<ReasonForExit | null>(null);

  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchReasons = async () => {
    setLoading(true);
    try {
      const response = await ReasonForExitService.getAll();
      setReasons(Array.isArray(response) ? response : []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      notification.error({
        message: 'Fetch Failed',
        description: 'Failed to fetch reasons for exit',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingReason(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setModalVisible(true);
  };

  const handleEdit = (record: ReasonForExit) => {
    setEditingReason(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await ReasonForExitService.delete(id);
      notification.success({
        message: 'Success',
        description: 'Reason for Exit deleted successfully',
      });
      fetchReasons();
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: 'Failed to delete reason for exit',
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload: ReasonForExitPayload = {
        name: values.name,
        code: values.code,
        is_active: values.is_active,
      };

      if (editingReason) {
        await ReasonForExitService.update(editingReason.id, payload);
        notification.success({
          message: 'Success',
          description: 'Reason for Exit updated successfully',
        });
      } else {
        await ReasonForExitService.create(payload);
        notification.success({
          message: 'Success',
          description: 'Reason for Exit created successfully',
        });
      }
      setModalVisible(false);
      fetchReasons();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save reason for exit';
      notification.error({
        message: 'Error',
        description: errorMsg,
      });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const generatedCode = value.toUpperCase().replace(/\s+/g, '_');
    form.setFieldsValue({ code: generatedCode });
  };

  const columns = [
    {
      title: 'Order',
      key: 'order',
      render: (_: any, __: any, index: number) => index + 1,
      width: 80,
    },
    {
      title: 'Reasons',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Active / Inactive',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Switch checked={isActive} disabled size="small" />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: ReasonForExit) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this reason for exit?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card bordered={false} bodyStyle={{ padding: '0' }} style={{ background: 'transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '0' }}>
        <div>
           <Title level={4} style={{ margin: 0 }}>Reason For Exit Configuration</Title>
           <Paragraph type="secondary" style={{ margin: 0, fontSize: 14 }}>
             Manage the reasons for employee departures.
           </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="middle"
          style={{ borderRadius: '6px' }}
        >
          Add Reason
        </Button>
      </div>

      <div style={{ padding: '0' }}>
        <Table
          columns={columns}
          dataSource={reasons}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          style={{ 
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {editingReason ? 'Edit Reason for Exit' : 'Add Reason for Exit'}
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText={editingReason ? 'Update' : 'Add'}
        cancelText="Cancel"
        destroyOnClose
        width={500}
      >
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          {editingReason ? 'Update the details for this exit reason.' : 'Create a new reason for employee departure.'}
        </Paragraph>
        <Divider style={{ margin: '12px 0 24px' }} />
        
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 0 }}
          initialValues={{ is_active: true }}
          size="middle"
        >
          <Form.Item
            name="name"
            label="Reason for Exit"
            rules={[{ required: true, message: 'Please enter reason for exit' }]}
          >
            <Input 
              placeholder="e.g. Better Opportunity, Personal Reasons" 
              onChange={handleNameChange}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Please enter code' }]}
          >
            <Input 
              placeholder="Auto-generated code" 
              readOnly 
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Reason Active / Inactive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
