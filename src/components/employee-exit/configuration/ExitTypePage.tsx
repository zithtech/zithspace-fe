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
  notification,
  Popconfirm,
  Tooltip,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { ExitType, ExitTypeService, ExitTypePayload } from '@/services/exitTypeService';

const { Title, Paragraph } = Typography;

export default function ExitTypePage() {
  const [form] = Form.useForm();
  const [exitTypes, setExitTypes] = useState<ExitType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<ExitType | null>(null);

  useEffect(() => {
    fetchExitTypes();
  }, []);

  const fetchExitTypes = async () => {
    setLoading(true);
    try {
      const response = await ExitTypeService.getAll();
      setExitTypes(Array.isArray(response) ? response : (response as any).data || []);
    } catch (error: any) {
      console.error('Fetch error:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch exit types'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingType(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setModalVisible(true);
  };

  const handleEdit = (record: ExitType) => {
    setEditingType(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await ExitTypeService.delete(id);
      notification.success({
        message: 'Success',
        description: 'Exit Type deleted successfully'
      });
      fetchExitTypes();
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: 'Failed to delete exit type'
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload: ExitTypePayload = {
        name: values.name,
        code: values.code,
        is_active: values.is_active,
      };

      if (editingType) {
        await ExitTypeService.update(editingType.id, payload);
        notification.success({
          message: 'Success',
          description: 'Exit Type updated successfully'
        });
      } else {
        await ExitTypeService.create(payload);
        notification.success({
          message: 'Success',
          description: 'Exit Type created successfully'
        });
      }
      setModalVisible(false);
      fetchExitTypes();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save exit type';
      notification.error({
        message: 'Error',
        description: errorMsg
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
      title: 'Exit Type',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Is Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Switch checked={isActive} disabled size="small" />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: ExitType) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this exit type?"
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
    <Card bordered={false} bodyStyle={{ padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '16px 24px 0' }}>
        <div>
           <Title level={4} style={{ margin: 0 }}>Exit Type Configuration</Title>
           <Paragraph type="secondary" style={{ margin: 0 }}>
             Manage the reasons and types of employee departures.
           </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
          style={{ borderRadius: '6px' }}
        >
          Add Exit Type
        </Button>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <Table
          columns={columns}
          dataSource={exitTypes}
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
        title={editingType ? 'Edit Exit Type' : 'Add Exit Type'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText={editingType ? 'Update' : 'Add'}
        cancelText="Cancel"
        destroyOnClose
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="name"
            label="Exit Type"
            rules={[{ required: true, message: 'Please enter exit type name' }]}
          >
            <Input 
              placeholder="e.g. Resignation, Termination" 
              onChange={handleNameChange}
              size="large"
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
              size="large"
              style={{ backgroundColor: '#f5f5f5' }}
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Exit Type Active / Inactive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
