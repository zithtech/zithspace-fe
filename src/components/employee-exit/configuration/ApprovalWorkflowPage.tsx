'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Space, Form, Select, Switch, Typography,
  Drawer, Tag, Tooltip, Dropdown, App
} from 'antd';
import {
  ShieldCheck, Settings2, Trash2, Edit, Briefcase, X, MoreVertical, Plus
} from 'lucide-react';
import dayjs from 'dayjs';
import { ApprovalWorkflowService, ExitApprovalStep } from '@/services/approvalWorkflowService';
import { GradeService, GradeAPIResponse } from '@/services/gradeService';
import { PositionService, Position } from '@/services/positionService';
import { commonDrawerProps, drawerFormStyles, SectionCard } from '@/components/common/DrawerSection';
import { useMembers } from '@/hooks/useGlobalData';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const { Title, Text } = Typography;

const ApprovalWorkflowPage: React.FC<{ searchText?: string, createTrigger?: number, layoutMode?: 'table' | 'card' }> = ({ searchText = '', createTrigger = 0, layoutMode = 'table' }) => {
  const [steps, setSteps] = useState<ExitApprovalStep[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const { data: members = [] } = useMembers();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  
  const [form] = Form.useForm();
  const levelType = Form.useWatch('levelType', form);
  const { message: messageApi } = App.useApp();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stepsData, positionsData, gradesData] = await Promise.all([
        ApprovalWorkflowService.getSteps(),
        PositionService.getAll(),
        GradeService.getAllGrades()
      ]);
      setSteps(Array.isArray(stepsData) ? stepsData : []);
      setPositions(Array.isArray(positionsData) ? positionsData : []);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
    } catch (error: any) {
      messageApi.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const workflows = useMemo(() => {
    const map = new Map<string, { levelType: string, levelId: string, steps: ExitApprovalStep[] }>();
    steps.forEach(step => {
      // Handle legacy steps without levelType
      const lt = step.levelType || 'Global';
      const li = step.levelId || 'default';
      const key = `${lt}-${li}`;
      if (!map.has(key)) {
        map.set(key, { levelType: lt, levelId: li, steps: [] });
      }
      map.get(key)!.steps.push(step);
    });
    // Sort steps by stepOrder
    Array.from(map.values()).forEach(w => w.steps.sort((a, b) => a.stepOrder - b.stepOrder));
    return Array.from(map.values());
  }, [steps]);

  const handleAdd = () => {
    setEditingWorkflow(null);
    form.resetFields();
    form.setFieldsValue({ 
      levelType: 'positions',
      useReportingManager: true,
      additionalSteps: []
    });
    setModalVisible(true);
  };

  useEffect(() => {
    if (createTrigger > 0) {
      handleAdd();
    }
  }, [createTrigger]);

  const handleEdit = (record: any) => {
    setEditingWorkflow(record);
    
    // Parse steps
    const hasReportingManager = record.steps.some((s: any) => s.approverType === 'ReportingManager');
    const additionalSteps = record.steps.filter((s: any) => s.approverType !== 'ReportingManager').map((s: any) => ({
      approverType: s.approverType || 'Position',
      roleIds: s.roleIds || [],
      mandatory: s.mandatory
    }));

    form.setFieldsValue({
      levelType: record.levelType,
      levelId: record.levelId,
      useReportingManager: hasReportingManager,
      additionalSteps
    });
    setModalVisible(true);
  };

  const handleDelete = async (record: any) => {
    try {
      // Need to delete all steps for this workflow
      for (const step of record.steps) {
        await ApprovalWorkflowService.deleteStep(step.id);
      }
      messageApi.success('Workflow deleted successfully');
      fetchData();
    } catch (error: any) {
      messageApi.error(error.message || 'Failed to delete workflow');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const payloadSteps = [];
      let currentOrder = 1;

      if (values.useReportingManager) {
        payloadSteps.push({
          stepOrder: currentOrder++,
          approverType: 'ReportingManager',
          mandatory: true,
          roleIds: []
        });
      }

      if (values.additionalSteps && values.additionalSteps.length > 0) {
        values.additionalSteps.forEach((s: any) => {
          payloadSteps.push({
            stepOrder: currentOrder++,
            approverType: s.approverType || 'Position',
            mandatory: s.mandatory !== false,
            roleIds: s.roleIds || []
          });
        });
      }

      const payload = {
        levelType: values.levelType,
        levelId: values.levelId,
        steps: payloadSteps
      };

      await ApprovalWorkflowService.saveSequence(payload);
      messageApi.success('Approval workflow saved successfully');
      
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      if (error.errorFields) return;
      messageApi.error(error.message || 'Failed to save workflow');
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (levelType: string, levelId: string) => {
    if (levelType === 'Global') return 'Global Default';
    if (levelType === 'grades') {
      const g = grades.find(g => g.id === levelId);
      return g?.name || g?.gradeName || levelId;
    }
    const p = positions.find(p => p.id === levelId);
    return p?.title || p?.position_name || levelId;
  };

  const getPositionName = (id: string) => {
    const p = positions.find(pos => pos.id === id);
    return p ? p.title : id;
  };

  const getGradeName = (id: string) => {
    const g = grades.find(gr => gr.id === id);
    return g ? (g.name || g.gradeName) : id;
  };

  const filteredWorkflows = workflows.filter(w => {
    if (!searchText) return true;
    const name = getRoleName(w.levelType, w.levelId).toLowerCase();
    return name.includes(searchText.toLowerCase());
  });

  const columns = [
    {
      title: 'Applicable Level',
      dataIndex: 'levelType',
      key: 'levelType',
      width: 150,
      render: (levelType: string) => (
        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
          {levelType === 'positions' ? 'POSITION' : levelType === 'grades' ? 'GRADE' : 'GLOBAL'}
        </Tag>
      )
    },
    {
      title: 'Configured Role',
      key: 'roleName',
      render: (_: any, record: any) => (
        <Text strong style={{ color: "var(--text-slate-900)" }}>
          {getRoleName(record.levelType, record.levelId)}
        </Text>
      )
    },
    {
      title: 'Workflow Steps',
      key: 'steps',
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          {record.steps.map((step: any, idx: number) => (
            <React.Fragment key={step.id}>
              <Tag style={{ 
                borderRadius: 6, 
                background: "var(--bg-slate-50)", 
                border: "1px solid var(--border-slate-200)", 
                color: "var(--text-slate-700)",
                padding: "2px 8px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                margin: 0
              }}>
                {step.approverType === 'ReportingManager' ? (
                  <><ShieldCheck size={12} color="var(--premium-blue)" /> Reporting Manager</>
                ) : step.approverType === 'Grade' ? (
                  <><Briefcase size={12} /> {step.roleIds?.length > 0 ? getGradeName(step.roleIds[0]) : 'Specific Grade'}</>
                ) : (
                  <><Briefcase size={12} /> {step.roleIds?.length > 0 ? getPositionName(step.roleIds[0]) : 'Specific Position'}</>
                )}
              </Tag>
              {idx < record.steps.length - 1 && <span style={{ color: "var(--text-slate-400)" }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Tooltip title="Configure Workflow">
            <Button 
              type="text" 
              icon={<Edit size={18} style={{ color: 'var(--text-slate-400)' }} />} 
              onClick={() => handleEdit(record)} 
            />
          </Tooltip>
          <ConfirmDialog
            title="Delete this workflow?"
            onConfirm={() => handleDelete(record)}
            confirmText="Delete"
            placement="bottomRight"
          >
            <Tooltip title="Remove">
              <Button 
                type="text" 
                danger 
                icon={<Trash2 size={18} />} 
              />
            </Tooltip>
          </ConfirmDialog>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0' }}>
      <div className="pp-table-wrap" style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 0 }}>
          <Table 
            className="pp-table"
            columns={columns} 
            dataSource={filteredWorkflows} 
            rowKey={(r) => `${r.levelType}-${r.levelId}`} 
            loading={loading}
            pagination={false}
          />
        </div>
      </div>

      <Drawer
        {...commonDrawerProps}
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        footer={
          <div
            className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <Button onClick={() => setModalVisible(false)} style={{ borderRadius: 8, height: 36 }}>Cancel</Button>
            <Button 
              type="primary" 
              loading={loading} 
              onClick={handleSubmit} 
              style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
            >
              {editingWorkflow ? 'Update Workflow' : 'Save Workflow'}
            </Button>
          </div>
        }
      >
        <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
        
        <div
          className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
          style={{ background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-blue-50)', color: 'var(--text-blue-700)', border: '1px solid var(--border-blue-200)' }}
            >
              <Settings2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {editingWorkflow ? "Edit Workflow Sequence" : "Create Workflow Sequence"}
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Define who needs to approve exits for this role
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalVisible(false)}
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
          className="customer-drawer-form"
        >
          <div className="px-6 py-6 space-y-5 pb-24">
            
            <SectionCard title="Target Role" icon={<Briefcase size={16} />}>
              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  name="levelType"
                  label={<Text strong style={{ fontSize: 13 }}>Applicable Level</Text>}
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ flex: 1 }}
                >
                  <Select
                    disabled={!!editingWorkflow}
                    options={[
                      { label: 'Positions', value: 'positions' },
                      { label: 'Grades', value: 'grades' }
                    ]}
                  />
                </Form.Item>
                
                <Form.Item
                  name="levelId"
                  label={<Text strong style={{ fontSize: 13 }}>Specific Role</Text>}
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ flex: 1 }}
                >
                  <Select
                    disabled={!!editingWorkflow}
                    showSearch
                    placeholder="Select Role"
                    options={
                      levelType === 'positions'
                        ? positions.map(p => ({ label: p.title, value: p.id }))
                        : grades.map(g => ({ label: g.name || g.gradeName, value: g.id }))
                    }
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  />
                </Form.Item>
              </div>
            </SectionCard>

            <SectionCard title="Workflow Sequence" icon={<ShieldCheck size={16} />}>
              <div style={{ 
                background: "var(--bg-slate-50)", 
                border: "1px solid var(--border-slate-200)", 
                borderRadius: 8, 
                padding: "16px",
                marginBottom: 16
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Space>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--premium-blue)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                      1
                    </div>
                    <div>
                      <Text strong style={{ display: "block" }}>Reporting Manager</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>Direct supervisor approval</Text>
                    </div>
                  </Space>
                  <Form.Item name="useReportingManager" valuePropName="checked" style={{ margin: 0 }}>
                    <Switch />
                  </Form.Item>
                </div>
              </div>

              <Form.List name="additionalSteps">
                {(fields, { add, remove }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {fields.map((field, index) => (
                      <div key={field.key} style={{ 
                        background: "var(--bg-secondary)", 
                        border: "1px solid var(--border-color)", 
                        borderRadius: 8, 
                        padding: "16px",
                        position: 'relative'
                      }}>
                        <div style={{ position: 'absolute', top: -10, left: 16, background: "var(--bg-secondary)", padding: "0 8px" }}>
                          <Text strong style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                            Step {form.getFieldValue('useReportingManager') ? index + 2 : index + 1}
                          </Text>
                        </div>
                        
                        <Button 
                          type="text" 
                          danger 
                          icon={<Trash2 size={16} />} 
                          onClick={() => remove(field.name)}
                          style={{ position: 'absolute', top: 8, right: 8 }}
                        />

                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                          <Form.Item
                            {...field}
                            name={[field.name, 'approverType']}
                            label={<Text strong style={{ fontSize: 13 }}>Approver Type</Text>}
                            style={{ width: 140, margin: 0 }}
                          >
                            <Select
                              options={[
                                { label: 'Position', value: 'Position' },
                                { label: 'Grade', value: 'Grade' }
                              ]}
                            />
                          </Form.Item>

                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => {
                              const prev = prevValues.additionalSteps?.[field.name]?.approverType;
                              const curr = currentValues.additionalSteps?.[field.name]?.approverType;
                              return prev !== curr;
                            }}
                          >
                            {() => {
                              const type = form.getFieldValue(['additionalSteps', field.name, 'approverType']) || 'Position';
                              return (
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'roleIds']}
                                  label={<Text strong style={{ fontSize: 13 }}>Select {type}</Text>}
                                  rules={[{ required: true, message: `Please select a ${type.toLowerCase()}` }]}
                                  style={{ flex: 1, margin: 0 }}
                                >
                                  <Select
                                    mode="multiple"
                                    placeholder={`Select ${type.toLowerCase()}(s)`}
                                    options={
                                      type === 'Position' 
                                        ? positions.map(p => ({ label: p.title, value: p.id }))
                                        : grades.map(g => ({ label: g.name || g.gradeName, value: g.id }))
                                    }
                                    showSearch
                                    maxCount={1}
                                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                  />
                                </Form.Item>
                              );
                            }}
                          </Form.Item>
                        </div>
                      </div>
                    ))}
                    
                    <Button 
                      type="dashed" 
                      onClick={() => add({ mandatory: true, approverType: 'Position' })} 
                      block 
                      icon={<Plus size={16} />}
                      style={{ height: 40, borderColor: "var(--premium-blue)", color: "var(--premium-blue)" }}
                    >
                      Add Additional Step
                    </Button>
                  </div>
                )}
              </Form.List>
            </SectionCard>

          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default ApprovalWorkflowPage;
