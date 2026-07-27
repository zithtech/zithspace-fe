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
  Tooltip,
  Drawer,
  Tag,
  Select,
  Dropdown,
  Menu,
  App,
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
  MoreVertical
} from 'lucide-react';
import dayjs from 'dayjs';
import { ExitType, ExitTypeService, ExitTypePayload } from '@/services/exitTypeService';
import { commonDrawerProps, drawerFormStyles, SectionCard } from '@/components/common/DrawerSection';
import { useMembers } from '@/hooks/useGlobalData';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const { Title, Text } = Typography;

const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
  <div className="pp-menu-item">
    <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
    <span className="pp-menu-text">
      <span className="pp-menu-title">{title}</span>
      <span className="pp-menu-desc">{desc}</span>
    </span>
  </div>
);

const getCreatorName = (record: any, members: any[] = []) => {
  const c = record.createdBy || record.created_by || record.creator || record.createdByUser;
  if (typeof c === 'object' && c !== null) {
    return c.name || c.first_name || c.firstName || c.employeeProfile?.firstName || c.employee?.first_name || 'Admin';
  }
  
  const creatorId = record.createdById || record.created_by_id || c;
  if (typeof creatorId === 'string' && members.length > 0) {
    const member = members.find(m => m.value === creatorId);
    if (member) return member.label;
  }
  
  return (typeof c === 'string' && !c.includes('-')) ? c : (record.createdByName || record.created_by_name || 'Admin');
};

export default function ExitTypePage({ searchText = '', createTrigger = 0, layoutMode = 'table' }: { searchText?: string, createTrigger?: number, layoutMode?: 'table' | 'card' }) {
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();
  const [exitTypes, setExitTypes] = useState<ExitType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<ExitType | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: members = [] } = useMembers();

  useEffect(() => {
    fetchExitTypes();
  }, []);

  const fetchExitTypes = async () => {
    setLoading(true);
    try {
      const response = await ExitTypeService.getAll();
      setExitTypes(Array.isArray(response) ? response : (response as any).data || []);
    } catch (error: any) {
      messageApi.error('Failed to fetch exit types');
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

  useEffect(() => {
    if (createTrigger > 0) {
      handleAdd();
    }
  }, [createTrigger]);

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
      messageApi.success('Exit Type deleted successfully');
      fetchExitTypes();
    } catch (error: any) {
      messageApi.error('Failed to delete exit type');
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
        messageApi.success('Exit Type updated successfully');
      } else {
        await ExitTypeService.create(payload);
        messageApi.success('Exit Type created successfully');
      }
      setModalVisible(false);
      fetchExitTypes();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save exit type';
      messageApi.error(errorMsg);
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
          <ConfirmDialog
            title="Delete this exit type?"
            onConfirm={() => handleDelete(record.id)}
            confirmText="Delete"
            placement="top"
          >
            <Tooltip title="Delete Type">
              <Button
                type="text"
                danger
                icon={<Trash2 size={18} />}
                className="action-btn-danger"
              />
            </Tooltip>
          </ConfirmDialog>
        </Space>
      ),
    },
  ];

  const filteredExitTypes = exitTypes.filter(type => 
    (type.name || '').toLowerCase().includes(searchText.toLowerCase()) || 
    (type.code || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const total = filteredExitTypes.length;
  const pageCount = Math.ceil(total / pageSize);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const currentData = filteredExitTypes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0' }}>

      {layoutMode === 'card' ? (
        <div className="pp-grid">
          {currentData.map(record => (
            <div key={record.id} className="pc-card">
              <div className="pc-top" style={{ padding: '12px', minHeight: '64px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div className="pc-avatar" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-blue-50)', color: 'var(--premium-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>
                  <ClipboardList size={16} />
                </div>
                <div className="pc-identity-body" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div className="pc-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.name}</span>
                    <Tag
                      style={{ borderRadius: 20, padding: "0 8px", fontWeight: 700, border: 0, fontSize: '10.5px', height: '19px', display: 'inline-flex', alignItems: 'center', margin: 0 }}
                      color={record.is_active ? "success" : "default"}
                    >
                      {record.is_active ? "ACTIVE" : "INACTIVE"}
                    </Tag>
                  </div>
                  <div className="pc-client-line" style={{ fontSize: '12px', color: 'var(--text-slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Code: <span style={{ color: 'var(--text-slate-700)', fontWeight: 600 }}>{record.code}</span>
                  </div>
                </div>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: '1',
                        label: menuLabel("Edit Type", "Modify configurations", <Edit size={14} />, '#64748b', 'rgba(100,116,139,0.12)'),
                        onClick: () => handleEdit(record)
                      },
                      {
                        type: 'divider'
                      },
                      {
                        key: '2',
                        onClick: (e) => {
                          e.domEvent.stopPropagation();
                        },
                        label: (
                          <div onClick={(e) => e.stopPropagation()}>
                            <ConfirmDialog
                              title="Delete this exit type?"
                              onConfirm={() => handleDelete(record.id)}
                              confirmText="Delete"
                              placement="top"
                            >
                              <div style={{ width: '100%' }}>
                                {menuLabel("Delete Type", "Remove this exit type", <Trash2 size={14} />, '#ef4444', 'rgba(239,68,68,0.12)')}
                              </div>
                            </ConfirmDialog>
                          </div>
                        )
                      }
                    ]
                  }}
                  trigger={['click']}
                  placement="bottomRight"
                  overlayClassName="pp-action-pop"
                >
                  <button className="pc-actions">
                    <MoreVertical size={16} />
                  </button>
                </Dropdown>
              </div>
              <div className="pc-foot" style={{ padding: '0', background: 'transparent', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="pc-foot-row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: '6px', fontSize: '10px', color: 'var(--text-slate-400)', padding: '8px 12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    Created by
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-blue-50)', color: 'var(--premium-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>
                      {getCreatorName(record, members)[0]?.toUpperCase() || 'A'}
                    </div>
                    <strong style={{ color: 'var(--text-slate-600)', fontWeight: 600 }}>{getCreatorName(record, members)}</strong>
                  </span>
                  <span style={{ color: 'var(--border-slate-200)', flexShrink: 0 }}>|</span>
                  <span style={{ flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>Updated <strong style={{ color: 'var(--text-slate-600)', fontWeight: 600 }}>{(record as any).updatedAt ? dayjs((record as any).updatedAt).format("MMM DD, YY") : (record as any).createdAt ? dayjs((record as any).createdAt).format("MMM DD, YY") : "—"}</strong></span>
                  <span style={{ color: 'var(--border-slate-200)', flexShrink: 0 }}>|</span>
                  <span style={{ flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>Created <strong style={{ color: 'var(--text-slate-600)', fontWeight: 600 }}>{(record as any).createdAt ? dayjs((record as any).createdAt).format("MMM DD, YY") : "—"}</strong></span>
                </div>
                <div className="pc-foot-row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: '6px', fontSize: '11px', color: 'var(--text-slate-500)', borderTop: '1px solid var(--border-slate-200)', padding: '10px 12px', marginTop: 'auto' }}>
                  <span style={{ flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>ID: <strong style={{ color: 'var(--text-slate-700)', fontWeight: 600 }}>{record.id.slice(0, 8)}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pp-table-wrap">
          <Table
            className="pp-table"
            columns={columns}
            dataSource={currentData}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 1000 }}
          />
        </div>
      )}

      <div style={{ flex: 1, minHeight: '60px' }} />

      {total > 0 && (
        <div className="pp-footer pp-footer--sticky">
          <div className="pp-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong> types
          </div>
          <div className="pp-pager">
            <button type="button" className="pp-pager-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`pp-pager-num ${p === currentPage ? 'is-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button type="button" className="pp-pager-btn" disabled={currentPage >= pageCount} onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}>›</button>
            <Select
              className="pp-pagesize"
              value={pageSize}
              onChange={(v) => { setPageSize(v); setCurrentPage(1); }}
              options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}

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
          layout="horizontal"
          labelAlign="left"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
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
    </div>
  );
}
