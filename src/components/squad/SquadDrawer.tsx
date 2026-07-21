"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Space,
  App,
  Typography,
  Row,
  Col,
  Popconfirm,
  Empty,
  Tooltip,
  Avatar,
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CloseOutlined,
  UserAddOutlined,
  CrownOutlined,
  StarOutlined,
  UserOutlined,
  CheckOutlined,
  BulbOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { Squad, SquadService, SquadMember } from '@/services/squadService';
import { MembersService } from '@/services/membersService';
import { History } from 'lucide-react';
import TransactionHistoryDrawer from '@/components/common/TransactionHistoryDrawer';
import { usePermission } from '@/hooks/usePermission';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import { commonDrawerProps, drawerFormStyles as formStyles, SectionCard } from '@/components/common/DrawerSection';

const { Option } = Select;
const { Text } = Typography;

interface SquadDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Squad | null;
}

type Role = 'HEAD' | 'SUB_HEAD' | 'MEMBER';

const ROLE_META: Record<Role, { label: string; cls: string }> = {
  HEAD: { label: 'Head', cls: 'is-head' },
  SUB_HEAD: { label: 'Sub-Head', cls: 'is-subhead' },
  MEMBER: { label: 'Member', cls: 'is-member' },
};

const SquadDrawer: React.FC<SquadDrawerProps> = ({ visible, onClose, onSuccess, initialData }) => {
  const { message } = App.useApp();
  const { canReadActivityLog } = usePermission();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [form] = Form.useForm();
  const [addMemberForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [localSquadMembers, setLocalSquadMembers] = useState<SquadMember[]>([]);

  useEffect(() => {
    if (visible) {
      fetchMembers();
      if (initialData) {
        const memberMap = new Map<string, SquadMember>();
        const rolePriority = { HEAD: 1, SUB_HEAD: 2, MEMBER: 3 };

        initialData.squadMembers?.forEach(sm => {
          const existing = memberMap.get(sm.squadMemberId);
          if (
            !existing ||
            rolePriority[sm.memberType as Role] < rolePriority[existing.memberType as Role]
          ) {
            memberMap.set(sm.squadMemberId, sm);
          }
        });

        const uniqueMembers = Array.from(memberMap.values());
        setLocalSquadMembers(uniqueMembers);

        const headIds = uniqueMembers.filter(m => m.memberType === 'HEAD').map(m => m.squadMemberId);
        const subHeadIds = uniqueMembers.filter(m => m.memberType === 'SUB_HEAD').map(m => m.squadMemberId);
        const memberIds = uniqueMembers.filter(m => m.memberType === 'MEMBER').map(m => m.squadMemberId);

        form.setFieldsValue({
          squadName: initialData.squadName,
          squadCode: initialData.squadCode,
          headIds,
          subHeadIds,
          memberIds,
          squadStatus: initialData.squadStatus,
          isArchived: initialData.isArchived,
        });
      } else {
        form.resetFields();
        setLocalSquadMembers([]);
        form.setFieldsValue({ squadStatus: true });

        setEditingMemberId(null);
      }
    }
  }, [visible, initialData, form]);

  const fetchMembers = async () => {
    try {
      const data = await MembersService.getMembersForSelect();
      setMembers(data);
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch members');
    }
  };

  const syncSquadMembers = async (updatedLocalMembers: SquadMember[]) => {
    if (!initialData) return;
    const headIds = updatedLocalMembers.filter(m => m.memberType === 'HEAD').map(m => m.squadMemberId);
    const subHeadIds = updatedLocalMembers.filter(m => m.memberType === 'SUB_HEAD').map(m => m.squadMemberId);
    const memberIds = updatedLocalMembers.filter(m => m.memberType === 'MEMBER').map(m => m.squadMemberId);

    try {
      setLoading(true);
      await SquadService.updateSquad(initialData.id, { headIds, subHeadIds, memberIds });
      message.success('Squad members updated');
      setLocalSquadMembers(updatedLocalMembers);
      form.setFieldsValue({ headIds, subHeadIds, memberIds });
      onSuccess();
    } catch (error) {
      console.error(error);
      message.error('Failed to update squad members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (values: { memberId: string; role: Role }) => {
    if (!initialData) return;
    if (localSquadMembers.some(m => m.squadMemberId === values.memberId)) {
      message.warning('Member already in squad');
      return;
    }
    const memberInfo = members.find(m => m.value === values.memberId);
    if (!memberInfo) return;

    const newMember: SquadMember = {
      id: `temp-${Date.now()}`,
      squadMemberId: values.memberId,
      memberType: values.role,
      status: true,
      member: {
        id: values.memberId,
        name: memberInfo.label,
        workEmail: memberInfo.email,
        position: { title: memberInfo.position },
      },
    };
    const updatedMembers = [...localSquadMembers, newMember];
    await syncSquadMembers(updatedMembers);
    addMemberForm.resetFields();

  };

  const handleUpdateRole = async (memberRecordId: string, newRole: Role) => {
    const updatedMembers = localSquadMembers.map(m =>
      m.id === memberRecordId ? { ...m, memberType: newRole } : m
    );
    await syncSquadMembers(updatedMembers);
    setEditingMemberId(null);
  };

  const handleDeleteMember = async (memberRecordId: string) => {
    const updatedMembers = localSquadMembers.filter(m => m.id !== memberRecordId);
    await syncSquadMembers(updatedMembers);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const generatedCode = e.target.value.toUpperCase().replace(/\s+/g, '_');
    form.setFieldsValue({ squadCode: generatedCode });
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      if (initialData) {
        await SquadService.updateSquad(initialData.id, values);
        message.success('Squad details updated');
      } else {
        await SquadService.createSquad(values);
        message.success('Squad created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      message.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const headCount = localSquadMembers.filter(m => m.memberType === 'HEAD').length;
  const subHeadCount = localSquadMembers.filter(m => m.memberType === 'SUB_HEAD').length;
  const memberCount = localSquadMembers.filter(m => m.memberType === 'MEMBER').length;

  // Live-watched values for the create-mode preview
  const watchedName: string = Form.useWatch('squadName', form) || '';
  const watchedCode: string = Form.useWatch('squadCode', form) || '';
  const watchedHeadIdsRaw = Form.useWatch('headIds', form);
  const watchedHeadIds: string[] = Array.isArray(watchedHeadIdsRaw) ? watchedHeadIdsRaw : [];
  const watchedSubHeadIdsRaw = Form.useWatch('subHeadIds', form);
  const watchedSubHeadIds: string[] = Array.isArray(watchedSubHeadIdsRaw) ? watchedSubHeadIdsRaw : [];
  const watchedMemberIdsRaw = Form.useWatch('memberIds', form);
  const watchedMemberIds: string[] = Array.isArray(watchedMemberIdsRaw) ? watchedMemberIdsRaw : [];

  const liveInitials = useMemo(() => {
    return (
      watchedName
        .split(/\s+/)
        .filter(Boolean)
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || ''
    );
  }, [watchedName]);

  const memberLookup = useMemo(() => {
    const map = new Map<string, { label: string; position?: string; email?: string }>();
    members.forEach(m => map.set(m.value, { label: m.label, position: m.position, email: m.email }));
    return map;
  }, [members]);

  const totalSelected = watchedHeadIds.length + watchedSubHeadIds.length + watchedMemberIds.length;

  // Step states for the stepper
  const stepIdentityDone = !!watchedName && !!watchedCode;
  const stepLeadershipDone = watchedHeadIds.length > 0;
  const stepMembersDone = watchedMemberIds.length > 0;
  const activeStep = !stepIdentityDone ? 0 : !stepLeadershipDone ? 1 : 2;
  const lineProgress1 = stepIdentityDone ? '100%' : '0%';
  const lineProgress2 = stepLeadershipDone ? '100%' : stepIdentityDone ? '50%' : '0%';

  const initials = useMemo(() => {
    const name = initialData?.squadName || form.getFieldValue('squadName') || '';
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'SQ'
    );
  }, [initialData, form]);

  const sortedLocalMembers = useMemo(() => {
    const order: Record<Role, number> = { HEAD: 0, SUB_HEAD: 1, MEMBER: 2 };
    return [...localSquadMembers].sort(
      (a, b) => order[a.memberType as Role] - order[b.memberType as Role]
    );
  }, [localSquadMembers]);

  const renderMemberRow = (record: SquadMember) => {
    const meta = ROLE_META[record.memberType as Role];
    const isEditing = editingMemberId === record.id;
    return (
      <div key={record.id} className="squad-member-row">
        <div className="squad-member-row__main">
          <Avatar 
            className="squad-member-row__avatar" 
            src={record.member.avatarUrl || undefined}
            style={{ background: 'var(--bg-slate-50)', color: 'var(--text-slate-500)' }}
          >
            {record.member.name.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div className="squad-member-row__name">{record.member.name}</div>
            <div className="squad-member-row__email">
              {record.member.position?.title ? `${record.member.position.title} • ` : ''}
              {record.member.workEmail}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isEditing ? (
            <Select<Role>
              size="small"
              defaultValue={record.memberType as Role}
              style={{ width: 130 }}
              onChange={(val) => handleUpdateRole(record.id, val)}
              onBlur={() => setEditingMemberId(null)}
              autoFocus
            >
              <Option value="HEAD">Head</Option>
              <Option value="SUB_HEAD">Sub-Head</Option>
              <Option value="MEMBER">Member</Option>
            </Select>
          ) : (
            <span className={`squad-role-tag ${meta.cls}`}>{meta.label}</span>
          )}
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => setEditingMemberId(record.id)}
          />
          <Popconfirm
            title="Remove member from squad?"
            onConfirm={() => handleDeleteMember(record.id)}
            okText="Remove"
            cancelText="Cancel"
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      </div>
    );
  };

  return (
    <>
    <Drawer
      {...commonDrawerProps}
      open={visible}
      onClose={onClose}
    >
      <style>{formStyles}</style>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Drawer Header */}
        <div
          className="customer-drawer-header"
          style={{
            padding: "16px 14px 12px 14px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 0,
                background: initialData
                  ? "rgba(245, 158, 11, 0.10)"
                  : "rgba(59, 130, 246, 0.10)",
                color: initialData ? "#f59e0b" : "var(--premium-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {initialData ? <EditOutlined /> : <TeamOutlined />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-slate-900)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                {initialData ? 'Manage Squad' : 'Create Squad'}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>
                {initialData
                  ? `Configuring ${initialData.squadName}`
                  : 'Define a new project team and assign leadership.'}
              </div>
            </div>
          </div>
          <Space>
            {initialData && canReadActivityLog && (
              <Button
                icon={<History size={14} />}
                onClick={(e) => { e.stopPropagation(); setHistoryOpen(true); }}
                size="small"
              >
                History
              </Button>
            )}
            <Button
              type="text"
              shape="circle"
              icon={<CloseOutlined />}
              onClick={onClose}
              style={{ color: "var(--text-slate-500)" }}
            />
          </Space>
        </div>

        {/* Drawer Form Content */}
        <div style={{ padding: "16px 16px", flex: 1, overflowY: "auto" }}>
        {initialData && (
          <div style={{
            background: 'var(--bg-pure-white)',
            border: '1px solid var(--border-slate-200)',
            borderRadius: 0,
            padding: 16,
            marginBottom: 24,
            boxShadow: '0 2px 8px -4px rgba(15,23,42,0.05)'
          }}>
            {/* Top Row */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{
                width: 54, height: 54, borderRadius: 0, flexShrink: 0,
                background: 'var(--bg-slate-50)', border: '1px solid var(--border-slate-200)', color: 'var(--text-slate-500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800,
              }}>
                {initials || <TeamOutlined />}
              </div>
              {/* Identity */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {initialData.squadName}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 0, background: 'var(--bg-slate-50)', color: 'var(--text-slate-600)', border: '1px solid var(--border-slate-200)', fontFamily: 'monospace' }}>
                    {initialData.squadCode}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 0, background: initialData.squadStatus ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: initialData.squadStatus ? '#34d399' : '#f87171', border: `1px solid ${initialData.squadStatus ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'currentColor', marginRight: 4 }}></span>
                    {initialData.isArchived ? 'Archived' : initialData.squadStatus ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 0, background: 'var(--bg-slate-50)', color: 'var(--text-slate-600)', border: '1px solid var(--border-slate-200)' }}>
                    <UserOutlined style={{ marginRight: 4 }} />
                    {localSquadMembers.length} members
                  </span>
                </div>
              </div>
              {/* Led By */}
              {localSquadMembers.filter(m => m.memberType === 'HEAD').length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-slate-400)', textTransform: 'uppercase' }}>Led By</div>
                  <Avatar.Group max={{ count: 3 }} size={28}>
                    {localSquadMembers.filter(m => m.memberType === 'HEAD').map(h => (
                      <Tooltip key={h.id} title={h.member.name}>
                        <Avatar style={{ border: '2px solid var(--bg-pure-white)', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                          {h.member.name.substring(0, 2).toUpperCase()}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </Avatar.Group>
                </div>
              )}
            </div>
            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-slate-100)', margin: '16px 0' }}></div>
            {/* Bottom Row: Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
              <div style={{ borderRight: '1px solid var(--border-slate-100)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-slate-900)', lineHeight: 1 }}>{localSquadMembers.length}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-slate-500)', textTransform: 'uppercase', marginTop: 4 }}>Total</div>
              </div>
              <div style={{ borderRight: '1px solid var(--border-slate-100)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{localSquadMembers.filter(m => m.memberType === 'HEAD').length}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-slate-500)', textTransform: 'uppercase', marginTop: 4 }}>Heads</div>
              </div>
              <div style={{ borderRight: '1px solid var(--border-slate-100)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{localSquadMembers.filter(m => m.memberType === 'SUB_HEAD').length}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-slate-500)', textTransform: 'uppercase', marginTop: 4 }}>Sub-Heads</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-slate-500)', lineHeight: 1 }}>{localSquadMembers.filter(m => m.memberType === 'MEMBER').length}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-slate-500)', textTransform: 'uppercase', marginTop: 4 }}>Members</div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE MODE: live preview, stepper, helper banner */}
        {!initialData && (
          <>
            <div className="scd-hero">
              <div className="scd-hero__top">
                <div className={`scd-hero__avatar${liveInitials ? '' : ' is-empty'}`}>
                  {liveInitials || <TeamOutlined />}
                </div>
                <div className="scd-hero__title-block">
                  <div className={`scd-hero__name${watchedName ? '' : ' is-placeholder'}`}>
                    {watchedName || 'New squad name'}
                  </div>
                  <div className="scd-hero__sub">
                    <span className="scd-hero__chip is-code">
                      {watchedCode || 'SQUAD_CODE'}
                    </span>
                    <span className="scd-hero__chip is-draft">
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'currentColor',
                        }}
                      />
                      Draft
                    </span>
                    <span className="scd-hero__chip">
                      <UserOutlined style={{ fontSize: 10 }} />
                      {totalSelected} {totalSelected === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="scd-hero__metrics">
                <div className="scd-hero__metric is-head">
                  <div className="scd-hero__metric-value">{watchedHeadIds.length}</div>
                  <div className="scd-hero__metric-label">Heads</div>
                </div>
                <div className="scd-hero__metric is-subhead">
                  <div className="scd-hero__metric-value">{watchedSubHeadIds.length}</div>
                  <div className="scd-hero__metric-label">Sub-Heads</div>
                </div>
                <div className="scd-hero__metric is-member">
                  <div className="scd-hero__metric-value">{watchedMemberIds.length}</div>
                  <div className="scd-hero__metric-label">Members</div>
                </div>
              </div>
            </div>

            <div className="scd-stepper">
              <div className={`scd-step${activeStep === 0 ? ' is-active' : ''}${stepIdentityDone ? ' is-done' : ''}`}>
                <div className="scd-step__bullet">
                  {stepIdentityDone ? <CheckOutlined style={{ fontSize: 11 }} /> : '1'}
                </div>
                <div className="scd-step__text">
                  <div className="scd-step__label">Identity</div>
                  <div className="scd-step__hint">Name & code</div>
                </div>
              </div>
              <div
                className="scd-step__line"
                style={{ ['--scd-line-progress' as never]: lineProgress1 }}
              />
              <div className={`scd-step${activeStep === 1 ? ' is-active' : ''}${stepLeadershipDone ? ' is-done' : ''}`}>
                <div className="scd-step__bullet">
                  {stepLeadershipDone ? <CheckOutlined style={{ fontSize: 11 }} /> : '2'}
                </div>
                <div className="scd-step__text">
                  <div className="scd-step__label">Leadership</div>
                  <div className="scd-step__hint">Heads (req.)</div>
                </div>
              </div>
              <div
                className="scd-step__line"
                style={{ ['--scd-line-progress' as never]: lineProgress2 }}
              />
              <div className={`scd-step${activeStep === 2 ? ' is-active' : ''}${stepMembersDone ? ' is-done' : ''}`}>
                <div className="scd-step__bullet">
                  {stepMembersDone ? <CheckOutlined style={{ fontSize: 11 }} /> : '3'}
                </div>
                <div className="scd-step__text">
                  <div className="scd-step__label">Members</div>
                  <div className="scd-step__hint">Optional</div>
                </div>
              </div>
            </div>

            <div className="scd-banner">
              <div className="scd-banner__icon">
                <BulbOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="scd-banner__title">How squads are structured</div>
                <div className="scd-banner__text">
                  Squads have a leadership hierarchy. Each role defines visibility and approval scope across projects.
                </div>
                <div className="scd-banner__roles">
                  <span className="scd-banner__role-chip is-head">
                    <span className="scd-banner__role-chip-dot" /> Head — owns the squad
                  </span>
                  <span className="scd-banner__role-chip is-subhead">
                    <span className="scd-banner__role-chip-dot" /> Sub-Head — assists leadership
                  </span>
                  <span className="scd-banner__role-chip is-member">
                    <span className="scd-banner__role-chip-dot" /> Member — contributes
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        <Form 
          form={form} 
          layout="horizontal" 
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
          colon={false}
          className="customer-drawer-form"
          onFinish={onFinish}
        >
          <SectionCard
            icon={<TeamOutlined />}
            title="Squad Identity"
            subtitle="A clear name and unique code so this squad is easy to find and reference."
            step="STEP 1"
          >
            <Form.Item
              name="squadName"
              label="Squad Name"
              rules={[{ required: true, message: 'Please enter squad name' }]}
              style={{ marginBottom: 14 }}
            >
              <Input size="large" placeholder="e.g. Frontend Team" onChange={handleNameChange} style={{ borderRadius: 6 }} suffix={<EditOutlined style={{ color: '#94a3b8' }} />} />
            </Form.Item>
            <Form.Item
              name="squadCode"
              label="Squad Code"
              rules={[{ required: true, message: 'Please enter squad code' }]}
              style={{ marginBottom: 14 }}
              tooltip="Auto-generated from the name. You can edit it."
            >
              <Input size="large" placeholder="FRONTEND_TEAM" style={{ borderRadius: 6 }} suffix={<EditOutlined style={{ color: '#94a3b8' }} />} />
            </Form.Item>
          </SectionCard>

          {initialData ? (
            <>

              <SectionCard
                icon={<TeamOutlined />}
                title="Manage Members"
                subtitle="Add or remove members and update their roles"
                step="STEP 2"
              >
                <div className="squad-add-member-panel">
                  <Form form={addMemberForm} layout="vertical" onFinish={handleAddMember}>
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            name="memberId"
                            label="Select Member"
                            rules={[{ required: true, message: 'Pick a member' }]}
                            style={{ marginBottom: 12 }}
                          >
                            <SearchableDropdown
                              placeholder="Select member"
                              searchPlaceholder="Search by name or email"
                              itemNoun="members"
                              width="100%"
                              options={members.map(m => ({
                                value: m.value,
                                label: m.label,
                                description: m.position,
                                avatarUrl: m.avatarUrl,
                              }))}
                              showSelectedAvatar
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="role"
                            label="Assign Role"
                            rules={[{ required: true, message: 'Pick a role' }]}
                            style={{ marginBottom: 12 }}
                          >
                            <SearchableDropdown
                              placeholder="Choose role"
                              searchPlaceholder="Search role"
                              itemNoun="roles"
                              width="100%"
                              options={[
                                { value: 'HEAD', label: 'Head' },
                                { value: 'SUB_HEAD', label: 'Sub-Head' },
                                { value: 'MEMBER', label: 'Member' },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item label=" " style={{ marginBottom: 12 }}>
                            <Button
                              type="primary"
                              block
                              size="large"
                              icon={<PlusOutlined />}
                              onClick={() => addMemberForm.submit()}
                              style={{
                                background: '#3B82F6',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                              }}
                            >
                              Add
                            </Button>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                </div>

                <div className="squad-member-list" style={{ marginTop: 16 }}>
                  {sortedLocalMembers.length === 0 ? (
                    <div style={{ padding: '40px 16px' }}>
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span style={{ color: 'var(--text-slate-400)' }}>
                            No members in this squad yet
                          </span>
                        }
                      />
                    </div>
                  ) : (
                    sortedLocalMembers.map(renderMemberRow)
                  )}
                </div>
              </SectionCard>

              <SectionCard
                icon={<StarOutlined />}
                title="Status & Visibility"
                subtitle="Manage whether this squad is active or archived"
                step="STEP 2"
              >
                <Form.Item name="squadStatus" label="Squad Status" style={{ marginBottom: 14 }}>
                  <Select size="large" style={{ borderRadius: 6 }}>
                    <Option value={true}>Active</Option>
                    <Option value={false}>Inactive</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="isArchived" label="Archived Status" style={{ marginBottom: 14 }}>
                  <Select size="large" style={{ borderRadius: 6 }}>
                    <Option value={false}>Active</Option>
                    <Option value={true}>Archived</Option>
                  </Select>
                </Form.Item>
              </SectionCard>
            </>
          ) : (
            <>
              <SectionCard
                icon={<CrownOutlined />}
                title="Leadership & Members"
                subtitle="Assign the core roles for this squad."
                step="STEP 2"
              >
                <Form.Item
                  name="headIds"
                  label="Squad Heads"
                  rules={[{ required: true, message: 'Please select at least one head' }]}
                  style={{ marginBottom: 14 }}
                >
                  <SearchableDropdown
                    mode="multiple"
                    placeholder="Search and assign heads…"
                    searchPlaceholder="Search by name or email"
                    itemNoun="heads"
                    width="100%"
                    options={members.map(m => ({
                      value: m.value,
                      label: m.label,
                      description: m.position,
                      avatarUrl: m.avatarUrl,
                    }))}
                    showSelectedAvatar
                  />
                </Form.Item>

                <Form.Item 
                  name="subHeadIds" 
                  label="Sub-Heads"
                  style={{ marginBottom: 14 }}
                >
                  <SearchableDropdown
                    mode="multiple"
                    placeholder="Search and assign sub-heads…"
                    searchPlaceholder="Search by name or email"
                    itemNoun="sub-heads"
                    width="100%"
                    options={members.map(m => ({
                      value: m.value,
                      label: m.label,
                      description: m.position,
                      avatarUrl: m.avatarUrl,
                    }))}
                    showSelectedAvatar
                  />
                </Form.Item>

                <Form.Item 
                  name="memberIds" 
                  label="Members"
                  style={{ marginBottom: 14 }}
                >
                  <SearchableDropdown
                    mode="multiple"
                    placeholder="Search and assign members…"
                    searchPlaceholder="Search by name or email"
                    itemNoun="members"
                    width="100%"
                    options={members.map(m => ({
                      value: m.value,
                      label: m.label,
                      description: m.position,
                      avatarUrl: m.avatarUrl,
                    }))}
                    showSelectedAvatar
                  />
                </Form.Item>
              </SectionCard>
            </>
          )}
        </Form>
        </div> {/* End Drawer Form Content */}

        {/* Drawer Footer */}
        <div
          className="customer-drawer-footer"
          style={{
            padding: "14px 28px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            position: "sticky",
            bottom: 0,
            gap: 8
          }}
        >
          <Button onClick={onClose} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: "0 18px" }}>Cancel</Button>
          <Button
            onClick={() => form.submit()}
            type="primary"
            loading={loading}
            style={{
              fontWeight: 600,
              height: 38,
              padding: '0 18px',
              borderRadius: 6,
            }}
          >
            {initialData ? 'Save Changes' : 'Create Squad'}
          </Button>
        </div>
      </div>
    </Drawer>
      {initialData && (
        <TransactionHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          entityType="squad"
          entityId={initialData.id}
          subtitle={initialData.squadName}
          zIndex={1050}
        />
      )}
    </>
  );
};

export default SquadDrawer;
