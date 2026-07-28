'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Form,
  InputNumber,
  Select,
  Switch,
  notification,
  Typography,
  Divider,
  Drawer,
  Tag,
  Row,
  Col,
  Input,
  Tooltip,
  Dropdown,
  Menu,
  App,
} from 'antd';
import {
  ShieldCheck,
  Plus,
  Search,
  Settings2,
  Trash2,
  Edit,
  ArrowRight,
  Briefcase,
  X,
  MoreVertical
} from 'lucide-react';
import dayjs from 'dayjs';
import { ApprovalWorkflowService, ExitApprovalStep } from '@/services/approvalWorkflowService';
import { GradeService, GradeAPIResponse } from '@/services/gradeService';
import { PositionService, Position } from '@/services/positionService';
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

const ApprovalWorkflowPage: React.FC<{ searchText?: string, createTrigger?: number, layoutMode?: 'table' | 'card' }> = ({ searchText = '', createTrigger = 0, layoutMode = 'table' }) => {
  const [steps, setSteps] = useState<ExitApprovalStep[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const { data: members = [] } = useMembers();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStep, setEditingStep] = useState<ExitApprovalStep | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stepsData, positionsData] = await Promise.all([
        ApprovalWorkflowService.getSteps(),
        PositionService.getAll()
      ]);
      setSteps(Array.isArray(stepsData) ? stepsData : []);
      setPositions(Array.isArray(positionsData) ? positionsData : []);
    } catch (error: any) {
      messageApi.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStep(null);
    form.resetFields();
    form.setFieldsValue({ 
      stepOrder: (Array.isArray(steps) ? steps.length : 0) + 1, 
      mandatory: true 
    });
    setModalVisible(true);
  };

  useEffect(() => {
    if (createTrigger > 0) {
      handleAdd();
    }
  }, [createTrigger]);

  const handleEdit = (record: ExitApprovalStep) => {
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
      messageApi.success('Approval step deleted successfully');
      fetchData();
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to delete approval step');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editingStep) {
        await ApprovalWorkflowService.updateStep(editingStep.id, values);
        messageApi.success('Approval step updated successfully');
      } else {
        await ApprovalWorkflowService.createStep(values);
        messageApi.success('Approval step added successfully');
      }
      
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      process.env.NODE_ENV === 'development' && console.error('Validation/Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Workflow Sequence',
      dataIndex: 'stepOrder',
      key: 'stepOrder',
      width: 180,
      render: (order: number) => (
        <Space size={12}>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: "50%", 
            background: "var(--bg-blue-50)", 
            color: "var(--premium-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 12,
            border: "2px solid var(--border-blue-100)"
          }}>
            {order}
          </div>
          <Text strong style={{ color: "var(--text-slate-900)" }}>Step {order}</Text>
        </Space>
      )
    },
    {
      title: 'Authorized Positions',
      dataIndex: 'roleIds',
      key: 'roleIds',
      render: (roleIds: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Array.isArray(roleIds) && roleIds.length > 0 ? (
            roleIds.map(id => {
              const pos = positions.find(p => p.id === id);
              return (
                <Tag key={id} style={{ 
                  borderRadius: 6, 
                  background: "var(--bg-slate-50)", 
                  border: "1px solid var(--border-slate-100)", 
                  color: "var(--text-slate-500)",
                  padding: "2px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  margin: 0
                }}>
                  <Briefcase size={12} />
                  {pos?.title || id}
                </Tag>
              );
            })
          ) : (
            <Text style={{ fontSize: 13, color: "var(--text-slate-500)", fontStyle: "italic" }}>No positions assigned</Text>
          )}
        </div>
      )
    },
    {
      title: 'Enforcement',
      dataIndex: 'mandatory',
      key: 'mandatory',
      width: 150,
      render: (mandatory: boolean) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {mandatory ? (
            <Tag color="error" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>MANDATORY</Tag>
          ) : (
            <Tag color="default" style={{ borderRadius: 6, margin: 0 }}>OPTIONAL</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: ExitApprovalStep) => (
        <Space size={4}>
          <Tooltip title="Configure Step">
            <Button 
              type="text" 
              icon={<Edit size={18} style={{ color: 'var(--text-slate-400)' }} />} 
              onClick={() => handleEdit(record)} 
              className="action-btn"
            />
          </Tooltip>
          <ConfirmDialog
            title="Delete this step?"
            onConfirm={() => handleDelete(record.id)}
            confirmText="Delete"
            placement="top"
          >
            <Tooltip title="Delete Step">
              <Button
                type="text"
                danger
                icon={<Trash2 size={18} />}
                className="action-btn-danger"
              />
            </Tooltip>
          </ConfirmDialog>
        </Space>
      )
    }
  ];

  const filteredSteps = steps.filter(step => {
    const roleTitles = (step.roleIds || [])
      .map(id => positions.find(p => p.id === id)?.title || "")
      .join(" ")
      .toLowerCase();
    const orderStr = `step ${step.stepOrder}`.toLowerCase();
    const q = searchText.toLowerCase();
    return orderStr.includes(q) || roleTitles.includes(q);
  });

  const total = filteredSteps.length;
  const pageCount = Math.ceil(total / pageSize);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const currentData = filteredSteps.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPositionName = (id: string) => positions.find(p => p.id === id)?.title || id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0' }}>
      {layoutMode === 'card' ? (
        <div className="pp-grid">
          {currentData.map(record => (
            <div key={record.id} className="pc-card">
              <div className="pc-top" style={{ padding: '12px', minHeight: '64px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div className="pc-avatar" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-blue-50)', color: 'var(--premium-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>
                  {record.stepOrder}
                </div>
                <div className="pc-identity-body" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div className="pc-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Step {record.stepOrder}</span>
                    {record.mandatory ? (
                      <Tag color="error" style={{ borderRadius: 20, padding: "0 8px", fontWeight: 700, border: 0, fontSize: '10.5px', height: '19px', display: 'inline-flex', alignItems: 'center', margin: 0 }}>
                        MANDATORY
                      </Tag>
                    ) : (
                      <Tag color="default" style={{ borderRadius: 20, padding: "0 8px", fontWeight: 700, border: 0, fontSize: '10.5px', height: '19px', display: 'inline-flex', alignItems: 'center', margin: 0 }}>
                        OPTIONAL
                      </Tag>
                    )}
                  </div>
                  <div className="pc-client-line" style={{ fontSize: '12px', color: 'var(--text-slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    ID: <span style={{ color: 'var(--text-slate-700)', fontWeight: 600 }}>{record.id.slice(0, 8)}</span>
                  </div>
                </div>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: '1',
                        label: menuLabel("Configure Step", "Modify step logic", <Edit size={14} />, '#64748b', 'rgba(100,116,139,0.12)'),
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
                              title="Delete this step?"
                              onConfirm={() => handleDelete(record.id)}
                              confirmText="Delete"
                              placement="top"
                            >
                              <div style={{ width: '100%' }}>
                                {menuLabel("Delete Step", "Remove this step", <Trash2 size={14} />, '#ef4444', 'rgba(239,68,68,0.12)')}
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
                <div className="pc-foot-row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '11px', color: 'var(--text-slate-500)', borderTop: '1px solid var(--border-slate-200)', padding: '10px 12px', marginTop: 'auto' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={12} style={{ color: 'var(--text-slate-400)' }} />
                    Roles:
                    {record.roleIds && record.roleIds.length > 0 ? (
                      record.roleIds.map((p, i) => (
                        <Tag key={i} color="purple" style={{ margin: 0, borderRadius: 4, fontWeight: 500, fontSize: '10px', height: '18px', lineHeight: '18px' }}>
                          {getPositionName(p)}
                        </Tag>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-slate-400)' }}>None</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pp-table-wrap" style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 0 }}>
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
        </div>
      )}

      {total > 0 && (
        <div className="pp-footer pp-footer--sticky" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingLeft: 0, paddingRight: 0, paddingTop: 16 }}>
          <div className="pp-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
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
              onClick={handleSubmit} 
              style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
            >
              {editingStep ? 'Update Step' : 'Save Step'}
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
                {editingStep ? "Edit Approval Step" : "Create Approval Step"}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Define sequence and responsibility mapping
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
          className="customer-drawer-form"
        >
          <div className="px-6 py-6 space-y-5 pb-24">
            
            <SectionCard title="Step Details" icon={<Settings2 size={16} />}>
              <Form.Item
                name="stepOrder"
                label={<Text strong style={{ fontSize: 13 }}>Processing Order</Text>}
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 12 }}
              >
                <InputNumber min={1} style={{ width: '100%', height: 38, paddingTop: 3 }} placeholder="e.g. 1" />
              </Form.Item>
              
              <Form.Item
                name="mandatory"
                label={<Text strong style={{ fontSize: 13 }}>Mandatory Enforcement</Text>}
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch checkedChildren="REQUIRED" unCheckedChildren="OPTIONAL" />
              </Form.Item>
            </SectionCard>

            <SectionCard title="Authorized Entities" icon={<ShieldCheck size={16} />}>
              <Form.Item
                name="roleIds"
                label={<Text strong style={{ fontSize: 13 }}>Approver Positions</Text>}
                rules={[{ required: true, message: 'Please select at least one position' }]}
                help="All selected positions will have authority to approve this step."
                style={{ marginBottom: 0 }}
              >
                <Select
                  mode="multiple"
                  placeholder="Search and select positions"
                  options={positions.map(p => ({ label: p.title, value: p.id }))}
                  showSearch
                  style={{ width: "100%" }}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </SectionCard>

            <div style={{ background: "var(--bg-secondary)", padding: 20, borderRadius: 12, border: "1px solid var(--border-slate-100)" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ color: "var(--premium-blue)" }}><ShieldCheck size={20} /></div>
                <div>
                  <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Workflow Logic</Text>
                  <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                    Requests will flow sequentially through steps. Mandatory steps cannot be skipped.
                  </Text>
                </div>
              </div>
            </div>

          </div>
        </Form>
      </Drawer>

    </div>
  );
};

export default ApprovalWorkflowPage;
