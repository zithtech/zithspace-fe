"use client";

import React from 'react';
import { Drawer, Table, Tag, Typography, Space, Divider, Avatar, Card } from 'antd';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Squad } from '@/services/squadService';

const { Title, Text } = Typography;

interface SquadViewDrawerProps {
  visible: boolean;
  onClose: () => void;
  squad: Squad | null;
}

const SquadViewDrawer: React.FC<SquadViewDrawerProps> = ({ visible, onClose, squad }) => {
  if (!squad) return null;

  const columns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      render: (_: any, __: any, index: number) => <span style={{ fontSize: '11px', color: '#8c8c8c' }}>{index + 1}</span>,
    },
    {
      title: 'Name',
      dataIndex: ['member', 'name'],
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <Avatar size="small" style={{ background: record.memberType === 'HEAD' ? 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' : record.memberType === 'SUB_HEAD' ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : '#f0f2f5', color: record.memberType === 'MEMBER' ? '#595959' : '#fff', fontSize: '10px', fontWeight: 600, border: '1px solid #fff' }}>{text.charAt(0).toUpperCase()}</Avatar>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ fontSize: '13px', color: '#141414' }}>{text}</Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>{record.member.workEmail}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'memberType',
      key: 'role',
      render: (role: string) => {
        let color = 'blue';
        if (role === 'HEAD') color = 'green';
        if (role === 'SUB_HEAD') color = 'cyan';
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: 'Designation',
      dataIndex: ['member', 'position', 'title'],
      key: 'designation',
      render: (text: string) => <Text type="secondary" style={{ fontSize: '12px', fontWeight: 400 }}>{text || '-'}</Text>,
    }
  ];

  // Sort members: HEAD -> SUB_HEAD -> MEMBER
  const sortedMembers = [...(squad.squadMembers || [])].sort((a, b) => {
    const roles = { 'HEAD': 0, 'SUB_HEAD': 1, 'MEMBER': 2 };
    return roles[a.memberType as keyof typeof roles] - roles[b.memberType as keyof typeof roles];
  });

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
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#141414' }}>{squad.squadName}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 400 }}>{squad.squadCode}</div>
          </div>
        </Space>
      }
      width={800}
      onClose={onClose}
      open={visible}
      extra={
        <Tag color={squad.isArchived ? 'orange' : (squad.squadStatus ? 'green' : 'red')}>
          {squad.isArchived ? 'Archived' : (squad.squadStatus ? 'Active' : 'Inactive')}
        </Tag>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <Text type="secondary" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
          SQUAD OVERVIEW
        </Text>
        <Card size="small" bordered={false} style={{ backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px' }}>
            <Space size={32}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text type="secondary" style={{ fontSize: '10px', fontWeight: 500 }}>SQUAD SIZE</Text>
                <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{squad.squadMembers?.length || 0}</Title>
              </div>
              <Divider type="vertical" style={{ height: '24px', margin: '0 4px' }} />
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text type="secondary" style={{ fontSize: '10px' }}>HEADS</Text>
                  <Text strong style={{ fontSize: '13px', color: '#52c41a' }}>{squad.squadMembers?.filter(m => m.memberType === 'HEAD').length}</Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text type="secondary" style={{ fontSize: '10px' }}>SUB HEADS</Text>
                  <Text strong style={{ fontSize: '13px', color: '#faad14' }}>{squad.squadMembers?.filter(m => m.memberType === 'SUB_HEAD').length}</Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text type="secondary" style={{ fontSize: '10px' }}>MEMBERS</Text>
                  <Text strong style={{ fontSize: '13px', color: '#1890ff' }}>{squad.squadMembers?.filter(m => m.memberType === 'MEMBER').length}</Text>
                </div>
              </div>
            </Space>
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Title level={5} style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Allocation Details</Title>
          <Tag style={{ borderRadius: '10px', fontSize: '10px', border: 'none', background: '#f0f0f0', lineHeight: '16px' }}>{squad.squadMembers?.length || 0}</Tag>
        </div>
      </div>

      <Table 
        dataSource={sortedMembers} 
        columns={columns} 
        pagination={false} 
        rowKey="id"
        size="middle"
        style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}
      />
    </Drawer>
  );
};

export default SquadViewDrawer;
