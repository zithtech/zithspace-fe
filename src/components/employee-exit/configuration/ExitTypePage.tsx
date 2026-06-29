'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  Switch,
  Space,
  Typography,
  notification,
  Popconfirm,
  Tooltip,
  Drawer,
  Tag,
  Divider,
} from 'antd';
import {
  ClipboardList,
  Plus,
  Search,
  Settings2,
  Trash2,
  Edit,
  ShieldCheck,
} from 'lucide-react';
import { ExitType, ExitTypeService, ExitTypePayload } from '@/services/exitTypeService';

const { Title, Text } = Typography;

export default function ExitTypePage() {
  const [form] = Form.useForm();
  const [exitTypes, setExitTypes] = useState<ExitType[]>([]);
  const [searchText, setSearchText] = useState('');
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
      title: 'Exit Type Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ExitType) => (
        <Space size={12}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 10, 
            background: "var(--bg-blue-50)", 
            color: "var(--premium-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14
          }}>
            <ClipboardList size={18} />
          </div>
          <div>
            <Text strong style={{ display: "block", color: "var(--text-slate-900)", fontSize: 14 }}>{text}</Text>
            <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>ID: {record.id.slice(0, 8)}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Technical Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Tag style={{ borderRadius: 6, background: "var(--bg-slate-50)", color: "var(--text-slate-500)", border: "1px solid var(--border-slate-100)", fontWeight: 500 }}>
          {code}
        </Tag>
      )
    },
    {
      title: 'Availability',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 150,
      render: (isActive: boolean) => (
        <Tag
          style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}
          color={isActive ? "success" : "default"}
        >
          {isActive ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      align: 'right' as const,
      render: (record: ExitType) => (
        <Space size={4}>
          <Tooltip title="Modify Type">
            <Button
              type="text"
              icon={<Edit size={18} style={{ color: 'var(--text-slate-400)' }} />}
              onClick={() => handleEdit(record)}
              className="action-btn"
            />
          </Tooltip>
          <Popconfirm
            title="Delete this exit type?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Remove Type">
              <Button
                type="text"
                danger
                icon={<Trash2 size={18} />}
                className="action-btn-danger"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredExitTypes = exitTypes.filter(type => 
    (type.name || '').toLowerCase().includes(searchText.toLowerCase()) || 
    (type.code || '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Input 
            placeholder="Search types..." 
            prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
            style={{ width: 280, borderRadius: 10, height: 40 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={handleAdd}
          style={{ borderRadius: 10, height: 40, fontWeight: 600, display: "flex", alignItems: "center", background: "var(--premium-blue)" }}
        >
          Add Exit Type
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredExitTypes}
        rowKey="id"
        loading={loading}
        pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 10, position: ["bottomRight"] }}
        size="middle"
        style={{ background: "var(--bg-pure-white)", borderRadius: 16, border: "1px solid var(--border-slate-100)", overflow: "hidden", boxShadow: "var(--shadow-premium-sm)" }}
      />

      <Drawer
        title={
          <Space size={12}>
            <div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)", display: "flex" }}>
              <Settings2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                {editingType ? "Edit Exit Type" : "Create Exit Type"}
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, color: "var(--text-slate-500)" }}>
                Define high-level categories for departures
              </div>
            </div>
          </Space>
        }
        width={500}
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "8px 0" }}>
            <Button onClick={() => setModalVisible(false)} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
            <Button 
              type="primary" 
              loading={loading} 
              onClick={handleSave} 
              style={{ borderRadius: 8, height: 40, padding: "0 24px" }}
            >
              {editingType ? 'Update Type' : 'Save Type'}
            </Button>
          </div>
        }
        className="config-drawer"
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ is_active: true }}
          style={{ background: "var(--bg-pure-white)" }}
        >
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16, color: "var(--text-slate-900)" }}>Identity Details</Title>
            <Form.Item
              name="name"
              label={<Text strong style={{ fontSize: 13 }}>Exit Type Name</Text>}
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input 
                placeholder="e.g. Voluntary Resignation" 
                onChange={handleNameChange}
              />
            </Form.Item>

            <Form.Item
              name="code"
              label={<Text strong style={{ fontSize: 13 }}>Classification Code</Text>}
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input 
                placeholder="Auto-gen" 
                readOnly 
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              />
            </Form.Item>
          </div>

          <Divider />

          <div style={{ background: "var(--bg-secondary)", padding: 20, borderRadius: 12, border: "1px solid var(--border-slate-100)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ color: "var(--premium-blue)" }}><ShieldCheck size={20} /></div>
                <div>
                  <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Operational Status</Text>
                  <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Inactive types won't appear in the request form.</Text>
                </div>
              </div>
              <Form.Item name="is_active" valuePropName="checked" noStyle>
                <Switch checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Drawer>

      <style dangerouslySetInnerHTML={{ __html: `
        .action-btn:hover { background: var(--bg-secondary) !important; color: var(--premium-blue) !important; }
        .action-btn-danger:hover { background: #fff1f2 !important; }
        .ant-table-thead > tr > th {
          background: var(--bg-secondary) !important;
          color: var(--text-slate-500) !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
        }
        .ant-table-row:hover > td { background: var(--bg-secondary) !important; }
        .config-drawer .ant-drawer-header { border-bottom: 1px solid var(--border-slate-100) !important; padding: 24px !important; }
        .config-drawer .ant-drawer-footer { border-top: 1px solid var(--border-slate-100) !important; padding: 16px 24px !important; }
      `}} />
    </div>
  );
}
