"use client";

import React from 'react';
import { Drawer, Table, Tag, Typography, Space, Divider, Avatar } from 'antd';
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
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Name',
      dataIndex: ['member', 'name'],
      key: 'name',
      render: (text: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{text}</Text>
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
        render: (text: string) => <Text type="secondary">{text || '-'}</Text>,
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
            backgroundColor: '#e6f7ff', 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <TeamOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{squad.squadName}</div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 400 }}>{squad.squadCode}</div>
          </div>
        </Space>
      }
      width={700}
      onClose={onClose}
      open={visible}
      extra={
        <Tag color={squad.isArchived ? 'orange' : (squad.squadStatus ? 'green' : 'red')}>
          {squad.isArchived ? 'Archived' : (squad.squadStatus ? 'Active' : 'Inactive')}
        </Tag>
      }
    >
      <div style={{ marginBottom: '24px' }}>
        <Title level={5}>Members Summary</Title>
        <Text type="secondary">Total number of members in the squad: {squad.squadMembers?.length || 0}</Text>
      </div>

      <Divider />

      <Table 
        dataSource={sortedMembers} 
        columns={columns} 
        pagination={false} 
        rowKey="id"
      />
    </Drawer>
  );
};

export default SquadViewDrawer;
