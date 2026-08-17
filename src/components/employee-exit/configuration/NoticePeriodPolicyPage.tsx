'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Tooltip,
  Drawer,
  Divider,
  Dropdown,
  Menu,
  App,
} from 'antd';
import {
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  Search,
  Settings2,
  Trash2,
  Edit,
  X,
  MoreVertical
} from 'lucide-react';
import dayjs from 'dayjs';
import { NoticePolicy, NoticePolicyService, NoticePolicyPayload } from '@/services/noticePolicyService';
import { GradeService, GradeAPIResponse } from '@/services/gradeService';
import { PositionService, Position } from '@/services/positionService';
import { commonDrawerProps, drawerFormStyles, SectionCard } from '@/components/common/DrawerSection';
import { useMembers } from '@/hooks/useGlobalData';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const { Title, Text } = Typography;
const { TextArea } = Input;

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

export default function NoticePeriodPolicyPage({ searchText = '', createTrigger = 0, layoutMode = 'table' }: { searchText?: string, createTrigger?: number, layoutMode?: 'table' | 'card' }) {
  const [form] = Form.useForm();
  const [policies, setPolicies] = useState<NoticePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<NoticePolicy | null>(null);
  const [grades, setGrades] = useState<GradeAPIResponse[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: members = [] } = useMembers();
  const [positions, setPositions] = useState<Position[]>([]);
  const [levelOptions, setLevelOptions] = useState<{ label: string; value: string }[]>([]);
  const [levelType, setLevelType] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const { message: messageApi } = App.useApp();

  useEffect(() => {
    fetchPolicies();
    fetchGradesAndPositions();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await NoticePolicyService.getAll();
      setPolicies(data || []);
    } catch (error: any) {
      messageApi.error('Failed to fetch policies: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGradesAndPositions = async () => {
    try {
      const [gradesData, positionsData] = await Promise.all([
        GradeService.getAllGrades(),
        PositionService.getAll(),
      ]);
      setGrades((Array.isArray(gradesData) ? gradesData : gradesData?.data) || []);
      setPositions(positionsData || []);
    } catch (error: any) {
      process.env.NODE_ENV === 'development' && console.error('Error fetching levels:', error);
    }
  };

  useEffect(() => {
    if (levelType === 'Grades') {
      setLevelOptions(grades.map(g => ({ label: g.name, value: g.id })));
    } else if (levelType === 'Positions') {
      setLevelOptions(positions.map(p => ({ label: p.title, value: p.id })));
    } else {
      setLevelOptions([]);
    }
  }, [levelType, grades, positions]);

  const handleAdd = () => {
    setEditingPolicy(null);
    form.resetFields();
    form.setFieldsValue({ status: true });
    setModalVisible(true);
    setLevelType('');
  };

  useEffect(() => {
    if (createTrigger > 0) {
      handleAdd();
    }
  }, [createTrigger]);

  const handleEdit = (record: any) => {
    setEditingPolicy(record);
    const lvlType = record.levelType || record.level_type;
    setLevelType(lvlType);
    form.setFieldsValue({
      policy_name: record.policyName || record.policy_name,
      code: record.code || record.policy_code || record.reference_code || record.notice_period_code,
      description: record.description,
      level_type: lvlType,
      level_id: record.levelId || record.level_id,
      notice_period_days: record.noticePeriodDays ?? record.notice_period_days,
      probation_period_days: record.probationPeriodDays ?? record.probation_period_days ?? record.probotion_period_days,
      probation_notice_days: record.probationNoticeDays ?? record.probation_notice_days,
      buyout_calculating_type: (record.buyoutCalculatingType || record.buyout_calculating_type) === 'Gross',
      status: record.status ?? record.is_active ?? true,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await NoticePolicyService.delete(id);
      messageApi.success('Notice Policy deleted successfully');
      fetchPolicies();
    } catch (error: any) {
      messageApi.error('Failed to delete policy: ' + error.message);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const values = await form.validateFields();
      const payload: any = {
        policy_name: values.policy_name,
        code: values.code,
        description: values.description,
        level_type: values.level_type,
        level_id: values.level_id,
        notice_period_days: values.notice_period_days,
        probation_period_days: values.probation_period_days,
        probotion_period_days: values.probation_period_days, // send both just in case
        probation_notice_days: values.probation_notice_days,
        buyout_calculating_type: values.buyout_calculating_type ? 'Gross' : 'Basic',
        status: values.status,
      };

      if (editingPolicy) {
        await NoticePolicyService.update(editingPolicy.id, payload);
        messageApi.success('Notice Policy updated successfully');
      } else {
        await NoticePolicyService.create(payload);
        messageApi.success('Notice Policy created successfully');
      }
      setModalVisible(false);
      fetchPolicies();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save notice period policy';
      messageApi.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const updateGeneratedCode = () => {
    const name = form.getFieldValue('policy_name') || '';
    const levelId = form.getFieldValue('level_id') || '';

    if (name) {
      let code = name.toUpperCase().replace(/\s+/g, '_');
      if (levelId) {
        const shortId = levelId.toString().slice(-4).toUpperCase();
        code = `${code}_${shortId}`;
      }
      form.setFieldsValue({ code });
    }
  };

  const getLevelName = (levelType: string, levelId: string) => {
    if (levelType === 'Grades') {
      return grades.find(g => g.id === levelId)?.name || levelId;
    }
    if (levelType === 'Positions') {
      return positions.find(p => p.id === levelId)?.title || levelId;
    }
    return levelId;
  };

  const columns = [
    {
      title: 'Policy Name',
      dataIndex: 'policyName',
      key: 'policyName',
      render: (text: string, record: any) => {
        const policyName = text || record.policy_name || 'Unnamed Policy';
        const code = record.code || record.policy_code || record.reference_code || record.notice_period_code || '-';
        return (
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
              <Clock size={18} />
            </div>
            <div>
              <Text strong style={{ display: "block", color: "var(--text-slate-900)", fontSize: 14 }}>{policyName}</Text>
              <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>{code}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Applicable Level',
      key: 'levelId',
      render: (record: any) => {
        const levelType = record.levelType || record.level_type;
        const levelId = record.levelId || record.level_id;
        return (
          <Space direction="vertical" size={0}>
            <Tag color="purple" style={{ borderRadius: 6, margin: 0, fontWeight: 500 }}>
              {levelType}
            </Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {getLevelName(levelType, levelId)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Notice Period',
      key: 'noticePeriodDays',
      render: (record: any) => {
        const noticePeriodDays = record.noticePeriodDays ?? record.notice_period_days ?? 0;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ padding: "4px 8px", background: "var(--bg-green-50)", borderRadius: 6, color: "#16a34a", fontWeight: 700 }}>
              {noticePeriodDays} Days
            </div>
          </div>
        );
      },
    },
    {
      title: 'Probation',
      key: 'probationPeriodDays',
      render: (record: any) => {
        const probationPeriodDays = record.probationPeriodDays ?? record.probation_period_days ?? record.probotion_period_days;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ padding: "4px 8px", background: "var(--bg-slate-50)", borderRadius: 6, color: "var(--text-slate-700)", fontWeight: 600 }}>
              {probationPeriodDays != null ? `${probationPeriodDays} Days` : '-'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Prob. Notice',
      key: 'probationNoticeDays',
      render: (record: any) => {
        const probationNoticeDays = record.probationNoticeDays ?? record.probation_notice_days;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ padding: "4px 8px", background: "var(--bg-orange-50)", borderRadius: 6, color: "#d97706", fontWeight: 600 }}>
              {probationNoticeDays != null ? `${probationNoticeDays} Days` : '-'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Calculation',
      key: 'calculation',
      render: (record: any) => {
        const calcType = record.buyoutCalculatingType || record.buyout_calculating_type || 'Basic';
        return (
          <Space size={16}>
            <Tooltip title="Buyout Calculation Type">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} style={{ color: "var(--premium-blue)" }} />
                <Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>{calcType}</Text>
              </div>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean) => (
        <Tag
          style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}
          color={status ? "success" : "default"}
        >
          {status ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (record: NoticePolicy) => (
        <Space size={4}>
          <Tooltip title="Edit Rules">
            <Button
              type="text"
              icon={<Edit size={18} style={{ color: 'var(--text-slate-400)' }} />}
              onClick={() => handleEdit(record)}
              className="action-btn"
            />
          </Tooltip>
          <ConfirmDialog
            title="Delete this policy?"
            onConfirm={() => handleDelete(record.id)}
            confirmText="Delete"
            placement="top"
          >
            <Tooltip title="Delete Rule">
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

  const filteredPolicies = policies.filter(p =>
    (p.policyName || "").toLowerCase().includes(searchText.toLowerCase()) ||
    (p.code || "").toLowerCase().includes(searchText.toLowerCase())
  );

  const total = filteredPolicies.length;
  const pageCount = Math.ceil(total / pageSize);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const currentData = filteredPolicies.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0' }}>
      {layoutMode === 'card' ? (
        <div className="pp-grid">
          {currentData.map(record => (
            <div key={record.id} className="pc-card">
              <div className="pc-top" style={{ padding: '12px', minHeight: '64px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div className="pc-avatar" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-blue-50)', color: 'var(--premium-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>
                  <Clock size={16} />
                </div>
                <div className="pc-identity-body" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div className="pc-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.policyName}</span>
                    <Tag
                      style={{ borderRadius: 20, padding: "0 8px", fontWeight: 700, border: 0, fontSize: '10.5px', height: '19px', display: 'inline-flex', alignItems: 'center', margin: 0 }}
                      color={record.status ? "success" : "default"}
                    >
                      {record.status ? "ACTIVE" : "INACTIVE"}
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
                        label: menuLabel("Edit Rules", "Modify configurations", <Edit size={14} />, '#64748b', 'rgba(100,116,139,0.12)'),
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
                              title="Delete this policy?"
                              onConfirm={() => handleDelete(record.id)}
                              confirmText="Delete"
                              placement="top"
                            >
                              <div style={{ width: '100%' }}>
                                {menuLabel("Delete Rule", "Remove this policy", <Trash2 size={14} />, '#ef4444', 'rgba(239,68,68,0.12)')}
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
                  <span style={{ flexShrink: 0 }}>
                    Notice: <strong style={{ color: '#16a34a', fontWeight: 700 }}>{record.noticePeriodDays} Days</strong>
                  </span>
                  <span style={{ color: 'var(--border-slate-200)' }}>|</span>
                  <span style={{ flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Type: <strong style={{ color: 'var(--text-slate-700)', fontWeight: 600 }}>{record.buyoutCalculatingType}</strong>
                  </span>
                  <span style={{ color: 'var(--border-slate-200)' }}>|</span>
                  <span style={{ flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag color="purple" style={{ borderRadius: 4, margin: 0, fontWeight: 500, fontSize: '10px', padding: '0 4px', height: '16px', lineHeight: '16px' }}>
                      {record.levelType}
                    </Tag>
                    {getLevelName(record.levelType, record.levelId)}
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
              loading={isSaving}
              onClick={handleSave}
              style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
            >
              {editingPolicy ? 'Update Configuration' : 'Save Configuration'}
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
                {editingPolicy ? "Edit Rule" : "Create New Rule"}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Configure notice periods and level mappings
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
            
            <SectionCard title="Notice Strategy" icon={<Settings2 size={16} />}>
              <Form.Item
                name="policy_name"
                label={<Text strong style={{ fontSize: 13 }}>Policy Name</Text>}
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 12 }}
              >
                <Input placeholder="e.g. Executive Notice" onChange={updateGeneratedCode} style={{ height: 38 }} />
              </Form.Item>

              <Form.Item
                name="code"
                label={<Text strong style={{ fontSize: 13 }}>Reference Code</Text>}
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 12 }}
              >
                <Input placeholder="Auto-gen" disabled style={{ height: 38 }} />
              </Form.Item>

              <Form.Item
                name="level_type"
                label={<Text strong style={{ fontSize: 13 }}>Mapping Level</Text>}
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 12 }}
              >
                <Select
                  placeholder="Select level"
                  onChange={(val) => {
                    setLevelType(val);
                    form.setFieldsValue({ level_id: undefined });
                    updateGeneratedCode();
                  }}
                  style={{ height: 38 }}
                >
                  <Select.Option value="Grades">Grades</Select.Option>
                  <Select.Option value="Positions">Positions</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="level_id"
                label={<Text strong style={{ fontSize: 13 }}>Specific Entity</Text>}
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="Select value"
                  showSearch
                  optionFilterProp="children"
                  options={levelOptions}
                  disabled={!levelType}
                  onChange={updateGeneratedCode}
                  style={{ height: 38 }}
                />
              </Form.Item>
            </SectionCard>

            <SectionCard title="Period Durations" icon={<Clock size={16} />}>
              <Form.Item
                name="notice_period_days"
                label={<Text strong style={{ fontSize: 13 }}>Notice Days</Text>}
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 12 }}
              >
                <InputNumber style={{ width: '100%', height: 38, paddingTop: 3 }} min={0} placeholder="e.g. 60" />
              </Form.Item>

              <Form.Item
                name="probation_period_days"
                label={<Text strong style={{ fontSize: 13 }}>Probation</Text>}
                style={{ marginBottom: 12 }}
              >
                <InputNumber style={{ width: '100%', height: 38, paddingTop: 3 }} min={0} placeholder="Days" />
              </Form.Item>

              <Form.Item
                name="probation_notice_days"
                label={<Text strong style={{ fontSize: 13 }}>Prob. Notice</Text>}
                style={{ marginBottom: 0 }}
              >
                <InputNumber style={{ width: '100%', height: 38, paddingTop: 3 }} min={0} placeholder="Days" />
              </Form.Item>
            </SectionCard>

            <SectionCard title="Policy Controls" icon={<ShieldCheck size={16} />}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Gross Buyout</Text>
                  <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Calculate buyout based on Gross instead of Basic.</Text>
                </div>
                <Form.Item name="buyout_calculating_type" valuePropName="checked" noStyle>
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16 }}>
                <div>
                  <Text strong style={{ fontSize: 14, display: "block", color: "var(--text-slate-900)" }}>Active Policy</Text>
                  <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Allow this rule to be applied to new requests.</Text>
                </div>
                <Form.Item name="status" valuePropName="checked" noStyle>
                  <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
                </Form.Item>
              </div>
            </SectionCard>

            <Form.Item name="description" label={<Text strong style={{ fontSize: 13 }}>Additional Context</Text>}>
              <TextArea rows={3} placeholder="Provide details about this policy rule..." style={{ borderRadius: 8 }} />
            </Form.Item>

          </div>
        </Form>
      </Drawer>

    </div>
  );
}
