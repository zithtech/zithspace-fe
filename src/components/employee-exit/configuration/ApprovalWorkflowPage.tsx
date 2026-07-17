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
  Popconfirm,
  Typography,
  Divider,
  Drawer,
  Tag,
  Row,
  Col,
  Input,
  Tooltip,
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
} from 'lucide-react';
import { ApprovalWorkflowService, ExitApprovalStep } from '@/services/approvalWorkflowService';
import { PositionService } from '@/services/positionService';
import { commonDrawerProps, drawerFormStyles, SectionCard } from '@/components/common/DrawerSection';

const { Title, Text } = Typography;

const ApprovalWorkflowPage: React.FC = () => {
  const [steps, setSteps] = useState<ExitApprovalStep[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
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
      const [stepsData, positionsData] = await Promise.all([
        ApprovalWorkflowService.getSteps(),
        PositionService.getAll()
      ]);
      setSteps(Array.isArray(stepsData) ? stepsData : []);
      setPositions(Array.isArray(positionsData) ? positionsData : []);
    } catch (error: any) {
      notificationApi.error({
        message: 'Error',
        description: 'Failed to fetch data'
      });
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
          <Popconfirm
            title="Delete this workflow step?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Remove Step">
              <Button 
                type="text" 
                danger 
                icon={<Trash2 size={18} />} 
                className="action-btn-danger"
              />
            </Tooltip>
          </Popconfirm>
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

  return (
    <div style={{ padding: '8px 0' }}>
      {notificationContextHolder}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Input 
            placeholder="Search steps..." 
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
          Add Step
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredSteps} 
        rowKey="id" 
        loading={loading}
        pagination={false}
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

        <Form form={form} layout="vertical" requiredMark={false} className="customer-drawer-form">
          <div className="px-6 py-6 space-y-5 pb-24">
            
            <SectionCard title="Step Details" icon={<Settings2 size={16} />}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="stepOrder"
                    label={<Text strong style={{ fontSize: 13 }}>Processing Order</Text>}
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber min={1} style={{ width: '100%', height: 38, paddingTop: 3 }} placeholder="e.g. 1" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="mandatory"
                    label={<Text strong style={{ fontSize: 13 }}>Mandatory Enforcement</Text>}
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch checkedChildren="REQUIRED" unCheckedChildren="OPTIONAL" />
                  </Form.Item>
                </Col>
              </Row>
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
};

export default ApprovalWorkflowPage;
