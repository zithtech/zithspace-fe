"use client";

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Divider, Tag, App, Typography, Table, Row, Col, Card, Avatar, Tooltip, Popconfirm, Switch } from 'antd';
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
          <Avatar size="small" style={{ background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', fontSize: '10px', fontWeight: 600, border: '1px solid #fff' }}>{record.member.name.charAt(0).toUpperCase()}</Avatar>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ fontSize: '12px' }}>{record.member.name}</Text>
            <Text type="secondary" style={{ fontSize: '10px' }}>{record.member.workEmail}</Text>
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
            icon={<EditOutlined style={{ color: '#1890ff' }} />} 
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
            backgroundColor: '#ffffff',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TeamOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#141414' }}>{initialData ? 'Manage Squad' : 'Create Squad'}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 400 }}>
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
          <Button onClick={onClose} size="small">Cancel</Button>
          {initialData && (
             <Button onClick={() => form.submit()} type="primary" loading={loading} size="small">
              Save Details
            </Button>
          )}
        </Space>
      }
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ padding: '0 4px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            BASIC INFORMATION
          </Text>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="squadName"
                label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Squad Name</span>}
                rules={[{ required: true, message: 'Please enter squad name' }]}
                style={{ marginBottom: '12px' }}
              >
                <Input placeholder="Frontend Team" onChange={handleNameChange} style={{ borderRadius: '6px', height: '32px', fontSize: '13px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="squadCode"
                label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Squad Code</span>}
                rules={[{ required: true, message: 'Please enter squad code' }]}
                style={{ marginBottom: '12px' }}
              >
                <Input placeholder="FRONTEND_TEAM" style={{ borderRadius: '6px', height: '32px', fontSize: '13px' }} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {initialData ? (
          <div style={{ marginTop: '0' }}>
            <Text type="secondary" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              MEMBER ALLOCATION
            </Text>
            <Card size="small" bordered={false} style={{ backgroundColor: '#fafafa', borderRadius: '8px', marginBottom: '12px', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
                <Space size={24}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text type="secondary" style={{ fontSize: '10px', fontWeight: 500 }}>TOTAL CAPACITY</Text>
                    <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{localSquadMembers.length}</Title>
                  </div>
                  <Divider type="vertical" style={{ height: '24px', margin: '0 4px' }} />
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text type="secondary" style={{ fontSize: '10px' }}>HEADS</Text>
                      <Text strong style={{ fontSize: '13px', color: '#52c41a' }}>{headCount}</Text>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text type="secondary" style={{ fontSize: '10px' }}>SUB HEADS</Text>
                      <Text strong style={{ fontSize: '13px', color: '#faad14' }}>{subHeadCount}</Text>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Text type="secondary" style={{ fontSize: '10px' }}>MEMBERS</Text>
                      <Text strong style={{ fontSize: '13px', color: '#1890ff' }}>{memberCount}</Text>
                    </div>
                  </div>
                </Space>
                <Button 
                  type="primary" 
                  ghost 
                  icon={showAddMember ? <CloseOutlined /> : <UserAddOutlined />} 
                  onClick={() => setShowAddMember(!showAddMember)}
                  style={{ borderRadius: '6px' }}
                >
                  {showAddMember ? 'Cancel' : 'Add Members'}
                </Button>
              </div>
            </Card>

            {showAddMember && (
              <Card size="small" style={{ marginBottom: '20px', border: '1px solid #e6f7ff', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                <Form form={addMemberForm} layout="vertical" onFinish={handleAddMember}>
                  <Row gutter={12} align="bottom">
                    <Col span={12}>
                      <Form.Item name="memberId" label="Select Member" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="Search member" showSearch optionFilterProp="label">
                          {members.map(m => (
                            <Option key={m.value} value={m.value} label={m.label}>
                              {m.label}
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', marginTop: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Title level={5} style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Squad Members</Title>
                <Tag style={{ borderRadius: '10px', fontSize: '10px', border: 'none', background: '#f0f0f0', lineHeight: '16px' }}>{localSquadMembers.length}</Tag>
              </div>
              <Text type="secondary" style={{ fontSize: '11px' }}>Current Allocation</Text>
            </div>
            
            <Table 
              dataSource={localSquadMembers} 
              columns={columns} 
              rowKey="id" 
              pagination={false}
              size="small"
              className="squad-member-table"
              style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}
            />

            <div style={{ 
              padding: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: '#fafafa',
              border: '1px solid #f0f0f0', 
              borderRadius: '8px',
              marginTop: '12px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
                  <SaveOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
                </div>
                <div>
                  <Text strong style={{ display: 'block', fontSize: '12px' }}>Squad Active Status</Text>
                  <Text type="secondary" style={{ fontSize: '10px' }}>Visibility across the platform</Text>
                </div>
              </div>
              <Form.Item name="squadStatus" valuePropName="checked" noStyle>
                <Switch size="small" checkedChildren="ON" unCheckedChildren="OFF" />
              </Form.Item>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '0' }}>
            <Text type="secondary" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
              SQUAD LEADERSHIP
            </Text>
            <Form.Item
              name="headIds"
              label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Squad Heads</span>}
              rules={[{ required: true, message: 'Please select at least one head' }]}
              style={{ marginBottom: '16px' }}
            >
              <Select mode="multiple" placeholder="Select heads" showSearch optionFilterProp="label" style={{ borderRadius: '6px' }} size="middle">
                {members.map(m => (
                  <Option key={m.value} value={m.value} label={m.label}>
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '2px 0' }}>
                      <span style={{ fontSize: '13px' }}>{m.label}</span>
                      <small style={{ color: '#8c8c8c', fontSize: '11px' }}>{m.position}</small>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="subHeadIds"
              label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Squad Sub Heads</span>}
              style={{ marginBottom: '24px' }}
            >
              <Select mode="multiple" placeholder="Select sub-heads" showSearch optionFilterProp="label" style={{ borderRadius: '6px' }} size="middle">
                {members.map(m => (
                  <Option key={m.value} value={m.value} label={m.label}>
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '2px 0' }}>
                      <span style={{ fontSize: '13px' }}>{m.label}</span>
                      <small style={{ color: '#8c8c8c', fontSize: '11px' }}>{m.position}</small>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Text type="secondary" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
              TEAM ASSEMBLY
            </Text>
            <Form.Item
              name="memberIds"
              label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Squad Members</span>}
              style={{ marginBottom: '0' }}
            >
              <Select mode="multiple" placeholder="Select members" showSearch optionFilterProp="label" style={{ borderRadius: '6px' }} size="middle">
                {members.map(m => (
                  <Option key={m.value} value={m.value} label={m.label}>
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '2px 0' }}>
                      <span style={{ fontSize: '13px' }}>{m.label}</span>
                      <small style={{ color: '#8c8c8c', fontSize: '11px' }}>{m.position}</small>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <Button onClick={onClose} style={{ flex: 1, height: '36px', borderRadius: '6px' }}>Cancel</Button>
              <Button onClick={() => form.submit()} type="primary" loading={loading} style={{ flex: 1, height: '36px', borderRadius: '6px' }}>Create Squad</Button>
            </div>
          </div>
        )}
      </Form>
    </Drawer>
  );
};

export default SquadDrawer;
