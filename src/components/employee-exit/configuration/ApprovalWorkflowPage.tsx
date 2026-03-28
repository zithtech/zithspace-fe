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
} from 'lucide-react';
import { ApprovalWorkflowService, ExitApprovalStep } from '@/services/approvalWorkflowService';
import { PositionService } from '@/services/positionService';

const { Title, Text } = Typography;

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
            background: "#eff6ff", 
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 12,
            border: "2px solid #dbeafe"
          }}>
            {order}
          </div>
          <Text strong style={{ color: "#1e293b" }}>Step {order}</Text>
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
                  background: "#f8fafc", 
                  border: "1px solid #e2e8f0", 
                  color: "#475569",
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
            <Text type="secondary" italic style={{ fontSize: 13 }}>No positions assigned</Text>
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
              icon={<Edit size={18} style={{ color: '#64748b' }} />} 
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

  return (
    <div style={{ padding: '8px 0' }}>
      {notificationContextHolder}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Input 
            placeholder="Search steps..." 
            prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
            style={{ width: 280, borderRadius: 10, height: 40 }}
          />
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={18} />} 
          onClick={handleAdd}
          style={{ borderRadius: 10, height: 40, fontWeight: 600, display: "flex", alignItems: "center" }}
        >
          Add Step
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={steps} 
        rowKey="id" 
        loading={loading}
        pagination={false}
        style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden" }}
      />

      <Drawer
        title={
          <Space size={12}>
            <div style={{ background: "#eff6ff", padding: 8, borderRadius: 10, color: "#2563eb", display: "flex" }}>
              <Settings2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
                {editingStep ? "Edit Approval Step" : "Create Approval Step"}
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>
                Define sequence and responsibility mapping
              </div>
            </div>
          </Space>
        }
        width={520}
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "8px 0" }}>
            <Button onClick={() => setModalVisible(false)} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
            <Button 
              type="primary" 
              loading={loading} 
              onClick={handleSubmit} 
              style={{ borderRadius: 8, height: 40, padding: "0 24px" }}
            >
              {editingStep ? 'Update Step' : 'Save Step'}
            </Button>
          </div>
        }
        className="config-drawer"
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16, color: "#334155" }}>Step Details</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="stepOrder"
                  label={<Text strong style={{ fontSize: 13 }}>Processing Order</Text>}
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 1" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="mandatory"
                  label={<Text strong style={{ fontSize: 13 }}>Mandatory Enforcement</Text>}
                  valuePropName="checked"
                >
                  <Switch checkedChildren="REQUIRED" unCheckedChildren="OPTIONAL" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 16, color: "#334155" }}>Authorized Entities</Title>
            <Form.Item
              name="roleIds"
              label={<Text strong style={{ fontSize: 13 }}>Approver Positions</Text>}
              rules={[{ required: true, message: 'Please select at least one position' }]}
              help="All selected positions will have authority to approve this step."
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
          </div>

          <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #f1f5f9", marginTop: 24 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ color: "#3b82f6" }}><ShieldCheck size={20} /></div>
              <div>
                <Text strong style={{ fontSize: 14, display: "block", color: "#1e293b" }}>Workflow Logic</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Requests will flow sequentially through steps. Mandatory steps cannot be skipped.
                </Text>
              </div>
            </div>
          </div>
        </Form>
      </Drawer>

      <style dangerouslySetInnerHTML={{ __html: `
        .action-btn:hover { background: #f1f5f9 !important; color: #2563eb !important; }
        .action-btn-danger:hover { background: #fff1f2 !important; }
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
        }
        .ant-table-row:hover > td { background: #f8fafc !important; }
        .config-drawer .ant-drawer-header { border-bottom: 1px solid #f1f5f9 !important; padding: 24px !important; }
        .config-drawer .ant-drawer-footer { border-top: 1px solid #f1f5f9 !important; padding: 16px 24px !important; }
      `}} />
    </div>
  );
};

export default ApprovalWorkflowPage;
