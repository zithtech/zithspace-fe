"use client";

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Divider, Tag, App, Typography, Table, Row, Col, Card, Avatar, Tooltip, Popconfirm } from 'antd';
import { TeamOutlined, PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { Squad, SquadService, CreateSquadData, UpdateSquadData, SquadMember } from '@/services/squadService';
import { MembersService } from '@/services/membersService';

const { Option } = Select;
const { Title, Text } = Typography;

interface SquadDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Squad | null;
}

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
        // Enforce uniqueness: if a member has multiple roles, pick the highest priority one
        const memberMap = new Map<string, SquadMember>();
        const rolePriority = { 'HEAD': 1, 'SUB_HEAD': 2, 'MEMBER': 3 };

        initialData.squadMembers?.forEach(sm => {
          const existing = memberMap.get(sm.squadMemberId);
          if (!existing || rolePriority[sm.memberType as keyof typeof rolePriority] < rolePriority[existing.memberType as keyof typeof rolePriority]) {
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
      await SquadService.updateSquad(initialData.id, {
        headIds,
        subHeadIds,
        memberIds,
      });
      message.success('Squad members updated');
      setLocalSquadMembers(updatedLocalMembers);
      // Update form fields to stay in sync
      form.setFieldsValue({ headIds, subHeadIds, memberIds });
      onSuccess();
    } catch (error) {
      console.error(error);
      message.error('Failed to update squad members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (values: any) => {
    if (!initialData) return;

    // Check if member already exists
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
        position: { title: memberInfo.position }
      }
    };

    const updatedMembers = [...localSquadMembers, newMember];
    await syncSquadMembers(updatedMembers);
    addMemberForm.resetFields();
    setShowAddMember(false);
  };

  const handleUpdateRole = async (memberRecordId: string, newRole: 'HEAD' | 'SUB_HEAD' | 'MEMBER') => {
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
    const value = e.target.value;
    const generatedCode = value.toUpperCase().replace(/\s+/g, '_');
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

  const columns = [
    {
      title: 'Member',
      key: 'name',
      render: (record: SquadMember) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: 'var(--premium-blue)' }}>{record.member.name.charAt(0).toUpperCase()}</Avatar>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ fontSize: '13px', color: 'var(--text-slate-900)' }}>{record.member.name}</Text>
            <Text type="secondary" style={{ fontSize: '11px', color: 'var(--text-slate-400)' }}>{record.member.workEmail}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'memberType',
      key: 'role',
      render: (role: string, record: SquadMember) => {
        if (editingMemberId === record.id) {
          return (
            <Select<'HEAD' | 'SUB_HEAD' | 'MEMBER'>
              size="small" 
              defaultValue={role as 'HEAD' | 'SUB_HEAD' | 'MEMBER'} 
              style={{ width: 120 }} 
              onChange={(val) => handleUpdateRole(record.id, val)}
              onBlur={() => setEditingMemberId(null)}
              autoFocus
            >
              <Option value="HEAD">HEAD</Option>
              <Option value="SUB_HEAD">SUB_HEAD</Option>
              <Option value="MEMBER">MEMBER</Option>
            </Select>
          );
        }
        let color = 'blue';
        if (role === 'HEAD') color = 'green';
        if (role === 'SUB_HEAD') color = 'gold';
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (record: SquadMember) => (
        <Space>
          <Button 
            size="small" 
            type="text" 
            icon={<EditOutlined style={{ color: 'var(--premium-blue)' }} />} 
            onClick={() => setEditingMemberId(record.id)} 
          />
          <Popconfirm
            title="Remove member from squad?"
            onConfirm={() => handleDeleteMember(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <Space size={12}>
          <div style={{
            backgroundColor: 'var(--bg-blue-50)',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TeamOutlined style={{ fontSize: '20px', color: 'var(--premium-blue)' }} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-slate-900)' }}>{initialData ? 'Manage Squad' : 'Create Squad'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-slate-400)', fontWeight: 400 }}>
              {initialData ? `Configuring ${initialData.squadName}` : 'Define a new project team and assign leadership.'}
            </div>
          </div>
        </Space>
      }
      width={650}
      onClose={onClose}
      open={visible}
      style={{ padding: 0 }}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          {!initialData && (
            <Button onClick={() => form.submit()} type="primary" loading={loading}>
              Create
            </Button>
          )}
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="squadName"
              label="Squad Name"
              rules={[{ required: true, message: 'Please enter squad name' }]}
            >
              <Input placeholder="Frontend Team" onChange={handleNameChange} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="squadCode"
              label="Squad Code"
              rules={[{ required: true, message: 'Please enter squad code' }]}
            >
              <Input placeholder="FRONTEND_TEAM" />
            </Form.Item>
          </Col>
        </Row>

        {initialData ? (
          <div style={{ marginTop: '8px' }}>
            <Card size="small" bordered={false} style={{ backgroundColor: 'var(--bg-slate-50)', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-slate-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px' }}>
                <Space size={24}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-slate-400)' }}>TOTAL MEMBERS</Text>
                    <Title level={4} style={{ margin: 0, color: 'var(--text-slate-900)' }}>{localSquadMembers.length}</Title>
                  </div>
                  <Divider type="vertical" style={{ height: '32px' }} />
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>HEADS</Text>
                      <Tag color="green" style={{ borderRadius: '6px', margin: 0, fontWeight: 600 }}>{headCount}</Tag>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>SUB HEADS</Text>
                      <Tag color="gold" style={{ borderRadius: '6px', margin: 0, fontWeight: 600 }}>{subHeadCount}</Tag>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text type="secondary" style={{ fontSize: '12px', color: 'var(--text-slate-400)' }}>MEMBERS</Text>
                      <Tag color="blue" bordered={false} style={{ borderRadius: '6px', margin: 0, fontWeight: 600, background: 'var(--bg-blue-50)', color: 'var(--premium-blue)' }}>{memberCount}</Tag>
                    </div>
                  </div>
                </Space>
                <Button 
                  type="primary" 
                  ghost 
                  icon={showAddMember ? <CloseOutlined /> : <UserAddOutlined />} 
                  onClick={() => setShowAddMember(!showAddMember)}
                  style={{ borderRadius: '8px' }}
                >
                  {showAddMember ? 'Cancel' : 'Add Members'}
                </Button>
              </div>
            </Card>

            {showAddMember && (
              <Card size="small" style={{ marginBottom: '24px', border: '1px solid var(--border-sky-100)', backgroundColor: 'var(--bg-sky-50)', borderRadius: '12px' }}>
                <Form form={addMemberForm} layout="vertical" onFinish={handleAddMember}>
                  <Row gutter={12} align="bottom">
                    <Col span={12}>
                      <Form.Item name="memberId" label="Select Member" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="Search member" showSearch optionFilterProp="label">
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
                      <Form.Item name="role" label="Assign Role" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="Choose role">
                          <Option value="HEAD">HEAD</Option>
                          <Option value="SUB_HEAD">SUB_HEAD</Option>
                          <Option value="MEMBER">MEMBER</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button type="primary" block icon={<PlusOutlined />} onClick={() => addMemberForm.submit()}>
                        Add
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Text strong style={{ fontSize: '16px', color: 'var(--text-slate-900)' }}>Member Listing</Text>
              <Text type="secondary" style={{ fontSize: '13px', color: 'var(--text-slate-400)' }}>{localSquadMembers.length} Employees</Text>
            </div>
            
            <Table 
              dataSource={localSquadMembers} 
              columns={columns} 
              rowKey="id" 
              pagination={false}
              size="small"
              className="squad-member-table premium-table"
              style={{ border: '1px solid var(--border-slate-200)', borderRadius: '8px', overflow: 'hidden' }}
            />

            <Divider style={{ margin: '24px 0' }} />
            
            <Form.Item name="squadStatus" label="Squad Status">
              <Select style={{ width: '200px' }}>
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>
            <Button type="primary" onClick={() => form.submit()} loading={loading} style={{ height: '40px', padding: '0 32px', borderRadius: '8px' }}>
              Save Squad Details
            </Button>
          </div>
        ) : (
          <>
            <Divider orientation="left">Squad Leadership</Divider>

            <Form.Item
              name="headIds"
              label="Squad Head"
              rules={[{ required: true, message: 'Please select at least one head' }]}
            >
              <Select mode="multiple" placeholder="Select heads" showSearch optionFilterProp="label">
                {members.map(m => (
                  <Option key={m.value} value={m.value} label={m.label}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{m.label}</span>
                      <small style={{ color: '#8c8c8c' }}>{m.position} • {m.email}</small>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="subHeadIds"
              label="Squad Sub Head"
            >
              <Select mode="multiple" placeholder="Select sub-heads" showSearch optionFilterProp="label">
                {members.map(m => (
                  <Option key={m.value} value={m.value} label={m.label}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{m.label}</span>
                      <small style={{ color: '#8c8c8c' }}>{m.position} • {m.email}</small>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Divider orientation="left">Squad Members</Divider>

            <Form.Item
              name="memberIds"
              label="Squad Members"
            >
              <Select mode="multiple" placeholder="Select members" showSearch optionFilterProp="label">
                {members.map(m => (
                  <Option key={m.value} value={m.value} label={m.label}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{m.label}</span>
                      <small style={{ color: '#8c8c8c' }}>{m.position} • {m.email}</small>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </>
        )}
      </Form>
    </Drawer>
  );
};

export default SquadDrawer;
