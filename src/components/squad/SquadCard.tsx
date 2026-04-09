"use client";

import React, { useState } from 'react';
import { Card, Tag, Button, Dropdown, Menu, Modal, Typography, Avatar, Tooltip, Space, App } from 'antd';
import { MoreOutlined, TeamOutlined, EditOutlined, EyeOutlined, DeleteOutlined, InboxOutlined, RollbackOutlined } from '@ant-design/icons';
import { Squad, SquadService } from '@/services/squadService';

const { Text, Title } = Typography;

interface SquadCardProps {
  squad: Squad;
  onOpen: (squad: Squad) => void;
  onManage: (squad: Squad) => void;
  onRefresh: () => void;
}

const SquadCard: React.FC<SquadCardProps> = ({ squad, onOpen, onManage, onRefresh }) => {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleArchive = async () => {
    try {
      setLoading(true);
      await SquadService.archiveSquad(squad.id, !squad.isArchived);
      message.success(`Squad ${squad.isArchived ? 'unarchived' : 'archived'} successfully`);
      onRefresh();
    } catch (error) {
      console.error(error);
      message.error('Failed to update squad archive status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Are you sure you want to delete this squad?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await SquadService.deleteSquad(squad.id);
          message.success('Squad deleted successfully');
          onRefresh();
        } catch (error) {
          console.error(error);
          message.error('Failed to delete squad');
        }
      },
    });
  };

  const menu = (
    <Menu>
      <Menu.Item key="archive" icon={squad.isArchived ? <RollbackOutlined /> : <InboxOutlined />} onClick={handleArchive}>
        {squad.isArchived ? 'Unarchive' : 'Archive'}
      </Menu.Item>
      <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={handleDelete}>
        Delete
      </Menu.Item>
    </Menu>
  );

  const headCount = squad.squadMembers.filter(m => m.memberType === 'HEAD').length;
  const subHeadCount = squad.squadMembers.filter(m => m.memberType === 'SUB_HEAD').length;
  const memberCount = squad.squadMembers.filter(m => m.memberType === 'MEMBER').length;
  const totalCount = squad.squadMembers.length;

  return (
    <Card
      className="squad-card-premium"
      hoverable
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        background: 'var(--bg-pure-white)',
        border: '1px solid var(--border-slate-200)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 12px 24px rgba(0,0,0,0.12)'
          : 'var(--card-shadow)'
      }}
      bodyStyle={{ padding: '24px' }}
      actions={[
        <Button key="open" type="primary" style={{ border: 'none', height: '40px', borderRadius: '8px' }} onClick={() => onOpen(squad)}>View Squad</Button>,
        <Button key="manage" style={{ height: '40px', borderRadius: '8px' }} onClick={() => onManage(squad)}>Manage Squad</Button>
      ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Avatar
            shape="square"
            size={40}
            icon={<TeamOutlined />}
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--premium-blue)', borderRadius: '8px' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Title level={5} style={{ margin: 0, color: 'var(--text-slate-900)' }}>{squad.squadName}</Title>
              <Space size={4} style={{ color: 'var(--text-slate-400)', fontSize: '14px' }}>
                <TeamOutlined />
                <Text type="secondary" style={{ color: 'var(--text-slate-400)' }}>{totalCount}</Text>
              </Space>
            </div>
            <Text type="secondary" style={{ fontSize: '12px', color: 'var(--text-slate-400)' }}>{squad.squadCode}</Text>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag color={squad.isArchived ? 'orange' : (squad.squadStatus ? 'green' : 'red')} style={{ borderRadius: '12px', margin: 0 }}>
            {squad.isArchived ? 'Archived' : (squad.squadStatus ? 'Active' : 'Inactive')}
          </Tag>
          <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-slate-400)' }}>SQUAD HEADS</Text>
          <Avatar.Group maxCount={3} size="small">
            {squad.squadMembers.filter(m => m.memberType === 'HEAD').map(m => (
              <Tooltip key={m.id} title={m.member.name}>
                <Avatar style={{ backgroundColor: '#87d068' }}>{m.member.name.substring(0, 2).toUpperCase()}</Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-slate-400)' }}>SUB HEADS</Text>
          <Avatar.Group maxCount={3} size="small">
            {squad.squadMembers.filter(m => m.memberType === 'SUB_HEAD').map(m => (
              <Tooltip key={m.id} title={m.member.name}>
                <Avatar style={{ backgroundColor: '#2db7f5' }}>{m.member.name.substring(0, 2).toUpperCase()}</Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-slate-400)' }}>MEMBERS</Text>
          <Avatar.Group maxCount={5} size="small">
            {squad.squadMembers.filter(m => m.memberType === 'MEMBER').map(m => (
              <Tooltip key={m.id} title={m.member.name}>
                <Avatar style={{ backgroundColor: '#108ee9' }}>{m.member.name.substring(0, 2).toUpperCase()}</Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        </div>
      </div>
    </Card>
  );
};

export default SquadCard;
