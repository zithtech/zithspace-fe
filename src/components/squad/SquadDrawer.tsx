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
} from '@ant-design/icons';
import { Squad, SquadService, SquadMember } from '@/services/squadService';
import { MembersService } from '@/services/membersService';

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
  const [form] = Form.useForm();
  const [addMemberForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
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
        setShowAddMember(false);
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
    setShowAddMember(false);
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
  const watchedHeadIds: string[] = Form.useWatch('headIds', form) || [];
  const watchedSubHeadIds: string[] = Form.useWatch('subHeadIds', form) || [];
  const watchedMemberIds: string[] = Form.useWatch('memberIds', form) || [];

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
          <div className={`squad-member-row__avatar ${meta.cls}`}>
            {record.member.name.charAt(0).toUpperCase()}
          </div>
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
    <Drawer
      className="squad-drawer"
      title={
        <Space size={12} align="center">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.16), rgba(139, 92, 246, 0.12))',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'var(--premium-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TeamOutlined style={{ fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-900)' }}>
              {initialData ? 'Manage Squad' : 'Create Squad'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-slate-400)', fontWeight: 400, marginTop: 2 }}>
              {initialData
                ? `Configuring ${initialData.squadName}`
                : 'Define a new project team and assign leadership.'}
            </div>
          </div>
        </Space>
      }
      width={680}
      onClose={onClose}
      open={visible}
      destroyOnHidden
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => form.submit()}
            type="primary"
            loading={loading}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              fontWeight: 600,
              height: 36,
              padding: '0 18px',
              borderRadius: 8,
              boxShadow: '0 6px 14px -6px rgba(37, 99, 235, 0.55)',
            }}
          >
            {initialData ? 'Save Changes' : 'Create Squad'}
          </Button>
        </div>
      }
    >
      {initialData && (
        <div className="squad-drawer__hero">
          <div className="squad-drawer__hero-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <div className="squad-drawer__hero-name">{initialData.squadName}</div>
            <div className="squad-drawer__hero-meta">
              <span className="squad-card-v2__code" style={{ marginTop: 0 }}>
                {initialData.squadCode}
              </span>
              <span
                className={`squad-card-v2__status ${
                  initialData.isArchived
                    ? 'squad-status--archived'
                    : initialData.squadStatus
                      ? 'squad-status--active'
                      : 'squad-status--inactive'
                }`}
              >
                <span className="squad-status-dot" />
                {initialData.isArchived ? 'Archived' : initialData.squadStatus ? 'Active' : 'Inactive'}
              </span>
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

      <Form form={form} layout="vertical" onFinish={onFinish}>
        {initialData ? (
          <>
            <div className="squad-section-title">
              <TeamOutlined /> Squad Identity
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="squadName"
                  label="Squad Name"
                  rules={[{ required: true, message: 'Please enter squad name' }]}
                >
                  <Input size="large" placeholder="Frontend Team" onChange={handleNameChange} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="squadCode"
                  label="Squad Code"
                  rules={[{ required: true, message: 'Please enter squad code' }]}
                >
                  <Input size="large" placeholder="FRONTEND_TEAM" />
                </Form.Item>
              </Col>
            </Row>
          </>
        ) : (
          <div className="scd-field-card">
            <div className="scd-field-card__header">
              <div className="scd-field-card__icon is-identity">
                <TeamOutlined />
              </div>
              <div className="scd-field-card__title-block">
                <div className="scd-field-card__title">Squad Identity</div>
                <div className="scd-field-card__sub">
                  A clear name and unique code so this squad is easy to find and reference.
                </div>
              </div>
            </div>
            <Row gutter={16}>
              <Col span={14}>
                <Form.Item
                  name="squadName"
                  label="Squad Name"
                  rules={[{ required: true, message: 'Please enter squad name' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input size="large" placeholder="e.g. Frontend Team" onChange={handleNameChange} />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  name="squadCode"
                  label="Squad Code"
                  rules={[{ required: true, message: 'Please enter squad code' }]}
                  style={{ marginBottom: 0 }}
                  tooltip="Auto-generated from the name. You can edit it."
                >
                  <Input size="large" placeholder="FRONTEND_TEAM" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        {initialData ? (
          <>
            <div className="squad-section-title">
              <UserOutlined /> Composition
            </div>
            <div className="squad-stat-strip">
              <div className="squad-stat-strip__item">
                <div className="squad-stat-strip__value">{localSquadMembers.length}</div>
                <div className="squad-stat-strip__label">Total</div>
              </div>
              <div className="squad-stat-strip__item is-head">
                <div className="squad-stat-strip__value">{headCount}</div>
                <div className="squad-stat-strip__label">Heads</div>
              </div>
              <div className="squad-stat-strip__item is-subhead">
                <div className="squad-stat-strip__value">{subHeadCount}</div>
                <div className="squad-stat-strip__label">Sub-Heads</div>
              </div>
              <div className="squad-stat-strip__item is-member">
                <div className="squad-stat-strip__value">{memberCount}</div>
                <div className="squad-stat-strip__label">Members</div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text strong style={{ fontSize: 14, color: 'var(--text-slate-900)' }}>
                Members
              </Text>
              <Button
                type={showAddMember ? 'default' : 'primary'}
                icon={showAddMember ? <CloseOutlined /> : <UserAddOutlined />}
                onClick={() => setShowAddMember(!showAddMember)}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  ...(showAddMember
                    ? {}
                    : {
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        border: 'none',
                        boxShadow: '0 6px 14px -8px rgba(37, 99, 235, 0.5)',
                      }),
                }}
              >
                {showAddMember ? 'Cancel' : 'Add Member'}
              </Button>
            </div>

            {showAddMember && (
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
                        <Select
                          placeholder="Search by name or email"
                          showSearch
                          optionFilterProp="label"
                          size="large"
                        >
                          {members.map(m => (
                            <Option key={m.value} value={m.value} label={m.label}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: 'var(--text-slate-900)' }}>{m.label}</span>
                                <small style={{ color: 'var(--text-slate-400)' }}>{m.position}</small>
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="role"
                        label="Assign Role"
                        rules={[{ required: true, message: 'Pick a role' }]}
                        style={{ marginBottom: 12 }}
                      >
                        <Select placeholder="Choose role" size="large">
                          <Option value="HEAD">Head</Option>
                          <Option value="SUB_HEAD">Sub-Head</Option>
                          <Option value="MEMBER">Member</Option>
                        </Select>
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
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
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
            )}

            <div className="squad-member-list">
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

            <div className="squad-section-title">
              <StarOutlined /> Status
            </div>
            <Form.Item name="squadStatus" style={{ marginBottom: 0 }}>
              <Select size="large" style={{ width: 220 }}>
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>
          </>
        ) : (
          <>
            {/* Heads */}
            <div className="scd-field-card">
              <div className="scd-field-card__header">
                <div className="scd-field-card__icon is-head">
                  <CrownOutlined />
                </div>
                <div className="scd-field-card__title-block">
                  <div className="scd-field-card__title">Squad Heads</div>
                  <div className="scd-field-card__sub">
                    Select one or more leads who own this squad. <span style={{ color: '#dc2626' }}>Required</span>
                  </div>
                </div>
                <div className={`scd-field-card__count${watchedHeadIds.length > 0 ? ' is-filled is-head' : ''}`}>
                  {watchedHeadIds.length}
                </div>
              </div>

              <Form.Item
                name="headIds"
                rules={[{ required: true, message: 'Please select at least one head' }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  mode="multiple"
                  placeholder="Search and assign heads…"
                  showSearch
                  optionFilterProp="label"
                  size="large"
                  maxTagCount="responsive"
                >
                  {members.map(m => (
                    <Option key={m.value} value={m.value} label={m.label}>
                      <div className="scd-option">
                        <div className="scd-option__avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                          {(m.label || '?').substring(0, 1).toUpperCase()}
                        </div>
                        <div className="scd-option__main">
                          <div className="scd-option__name">{m.label}</div>
                          <div className="scd-option__sub">{m.position} • {m.email}</div>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {watchedHeadIds.length > 0 && (
                <div className="scd-selected-row">
                  <span className="scd-selected-row__label">Selected</span>
                  <Avatar.Group max={{ count: 6 }} size={26}>
                    {watchedHeadIds.map(id => {
                      const m = memberLookup.get(id);
                      const initial = (m?.label || '?').substring(0, 1).toUpperCase();
                      return (
                        <Tooltip key={id} title={m?.label || id}>
                          <Avatar className="scd-selected-row__avatar is-head">
                            {initial}
                          </Avatar>
                        </Tooltip>
                      );
                    })}
                  </Avatar.Group>
                </div>
              )}
            </div>

            {/* Sub-Heads */}
            <div className="scd-field-card">
              <div className="scd-field-card__header">
                <div className="scd-field-card__icon is-subhead">
                  <StarOutlined />
                </div>
                <div className="scd-field-card__title-block">
                  <div className="scd-field-card__title">Sub-Heads</div>
                  <div className="scd-field-card__sub">
                    Deputies who assist the heads. Optional but recommended for larger squads.
                  </div>
                </div>
                <div className={`scd-field-card__count${watchedSubHeadIds.length > 0 ? ' is-filled is-subhead' : ''}`}>
                  {watchedSubHeadIds.length}
                </div>
              </div>

              <Form.Item name="subHeadIds" style={{ marginBottom: 0 }}>
                <Select
                  mode="multiple"
                  placeholder="Search and assign sub-heads…"
                  showSearch
                  optionFilterProp="label"
                  size="large"
                  maxTagCount="responsive"
                >
                  {members.map(m => (
                    <Option key={m.value} value={m.value} label={m.label}>
                      <div className="scd-option">
                        <div className="scd-option__avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                          {(m.label || '?').substring(0, 1).toUpperCase()}
                        </div>
                        <div className="scd-option__main">
                          <div className="scd-option__name">{m.label}</div>
                          <div className="scd-option__sub">{m.position} • {m.email}</div>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {watchedSubHeadIds.length > 0 && (
                <div className="scd-selected-row">
                  <span className="scd-selected-row__label">Selected</span>
                  <Avatar.Group max={{ count: 6 }} size={26}>
                    {watchedSubHeadIds.map(id => {
                      const m = memberLookup.get(id);
                      const initial = (m?.label || '?').substring(0, 1).toUpperCase();
                      return (
                        <Tooltip key={id} title={m?.label || id}>
                          <Avatar className="scd-selected-row__avatar is-subhead">
                            {initial}
                          </Avatar>
                        </Tooltip>
                      );
                    })}
                  </Avatar.Group>
                </div>
              )}
            </div>

            {/* Members */}
            <div className="scd-field-card">
              <div className="scd-field-card__header">
                <div className="scd-field-card__icon is-member">
                  <UserOutlined />
                </div>
                <div className="scd-field-card__title-block">
                  <div className="scd-field-card__title">Members</div>
                  <div className="scd-field-card__sub">
                    Contributors who are part of this squad. You can add more later.
                  </div>
                </div>
                <div className={`scd-field-card__count${watchedMemberIds.length > 0 ? ' is-filled is-member' : ''}`}>
                  {watchedMemberIds.length}
                </div>
              </div>

              <Form.Item name="memberIds" style={{ marginBottom: 0 }}>
                <Select
                  mode="multiple"
                  placeholder="Search and add members…"
                  showSearch
                  optionFilterProp="label"
                  size="large"
                  maxTagCount="responsive"
                >
                  {members.map(m => (
                    <Option key={m.value} value={m.value} label={m.label}>
                      <div className="scd-option">
                        <div className="scd-option__avatar">
                          {(m.label || '?').substring(0, 1).toUpperCase()}
                        </div>
                        <div className="scd-option__main">
                          <div className="scd-option__name">{m.label}</div>
                          <div className="scd-option__sub">{m.position} • {m.email}</div>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {watchedMemberIds.length > 0 && (
                <div className="scd-selected-row">
                  <span className="scd-selected-row__label">Selected</span>
                  <Avatar.Group max={{ count: 8 }} size={26}>
                    {watchedMemberIds.map(id => {
                      const m = memberLookup.get(id);
                      const initial = (m?.label || '?').substring(0, 1).toUpperCase();
                      return (
                        <Tooltip key={id} title={m?.label || id}>
                          <Avatar className="scd-selected-row__avatar is-member">
                            {initial}
                          </Avatar>
                        </Tooltip>
                      );
                    })}
                  </Avatar.Group>
                </div>
              )}
            </div>
          </>
        )}
      </Form>
    </Drawer>
  );
};

export default SquadDrawer;
