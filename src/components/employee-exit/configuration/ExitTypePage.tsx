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
  X,
} from 'lucide-react';
import { ExitType, ExitTypeService, ExitTypePayload } from '@/services/exitTypeService';
import { commonDrawerProps, drawerFormStyles, SectionCard } from '@/components/common/DrawerSection';

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
        {...commonDrawerProps}
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        footer={
          <div
            className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <Button onClick={() => setModalVisible(false)} style={{ borderRadius: 8, height: 36 }}>Cancel</Button>
            <Button 
              type="primary" 
              loading={loading} 
              onClick={handleSave} 
              style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
            >
              {editingType ? 'Update Type' : 'Save Type'}
            </Button>
          </div>
        }
      >
        <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
        
        <div
          className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
          style={{
            background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--bg-blue-50)',
                color: 'var(--text-blue-700)',
                border: '1px solid var(--border-blue-200)',
              }}
            >
              <Settings2 size={18} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {editingType ? "Edit Exit Type" : "Create Exit Type"}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Define high-level categories for departures
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalVisible(false)}
            aria-label="Close"
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)] cursor-pointer"
            style={{ color: 'var(--text-secondary)', border: 'none', background: 'transparent' }}
          >
            <X size={16} />
          </button>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ is_active: true }}
          className="customer-drawer-form"
        >
          <div className="px-6 py-6 space-y-5 pb-24">
            
            <SectionCard title="Identity Details" icon={<Settings2 size={16} />}>
              <Form.Item
                name="name"
                label={<Text strong style={{ fontSize: 13 }}>Exit Type Name</Text>}
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 12 }}
              >
                <Input 
                  placeholder="e.g. Voluntary Resignation" 
                  onChange={handleNameChange}
                  style={{ height: 38 }}
                />
              </Form.Item>

              <Form.Item
                name="code"
                label={<Text strong style={{ fontSize: 13 }}>Classification Code</Text>}
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 0 }}
              >
                <Input 
                  placeholder="Auto-gen" 
                  readOnly 
                  style={{ backgroundColor: 'var(--bg-secondary)', height: 38 }}
                />
              </Form.Item>
            </SectionCard>

            <SectionCard title="Operational Status" icon={<ShieldCheck size={16} />}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Active Status</Text>
                  <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Inactive types won't appear in the request form.</Text>
                </div>
                <Form.Item name="is_active" valuePropName="checked" noStyle>
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </div>
            </SectionCard>

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
      `}} />
    </div>
  );
}
