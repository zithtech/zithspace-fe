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
      style={{
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #f0f0f0',
        boxShadow: 'none'
      }}
      bodyStyle={{ padding: '16px' }}
      actions={[
        <Button key="open" type="primary" style={{ border: 'none', height: '28px', borderRadius: '4px', fontSize: '12px', padding: '0 12px' }} onClick={() => onOpen(squad)}>View Squad</Button>,
        <Button key="manage" style={{ height: '28px', borderRadius: '4px', fontSize: '12px', padding: '0 12px' }} onClick={() => onManage(squad)}>Manage Squad</Button>
      ]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Avatar
            shape="square"
            size={32}
            icon={<TeamOutlined />}
            style={{ backgroundColor: '#f5f5f5', color: '#1890ff', borderRadius: '6px' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Title level={5} style={{ margin: 0, fontSize: '14px' }}>{squad.squadName}</Title>
              <Space size={4} style={{ color: '#8c8c8c', fontSize: '12px' }}>
                <TeamOutlined />
                <Text type="secondary" style={{ fontSize: '12px' }}>{totalCount}</Text>
              </Space>
            </div>
            <Text type="secondary" style={{ fontSize: '11px' }}>{squad.squadCode}</Text>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tag color={squad.isArchived ? 'orange' : (squad.squadStatus ? 'green' : 'red')} style={{ borderRadius: '4px', margin: 0, fontSize: '10px', lineHeight: '18px' }}>
            {squad.isArchived ? 'Archived' : (squad.squadStatus ? 'Active' : 'Inactive')}
          </Tag>
          <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      </div>

      <div style={{ marginBottom: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text type="secondary" style={{ fontSize: '11px', fontWeight: 600 }}>SQUAD HEADS</Text>
          <Avatar.Group maxCount={4} size={28}>
            {squad.squadMembers.filter(m => m.memberType === 'HEAD').map(m => (
              <Tooltip key={m.id} title={m.member.name}>
                <Avatar style={{ background: 'linear-gradient(135deg, #115bcbff 0%, #2575fc 100%)', fontSize: '10px', fontWeight: 600, border: '1.5px solid #fff' }}>{m.member.name.substring(0, 2).toUpperCase()}</Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text type="secondary" style={{ fontSize: '11px', fontWeight: 600 }}>SUB HEADS</Text>
          <Avatar.Group maxCount={4} size={28}>
            {squad.squadMembers.filter(m => m.memberType === 'SUB_HEAD').map(m => (
              <Tooltip key={m.id} title={m.member.name}>
                <Avatar style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', fontSize: '10px', fontWeight: 600, border: '1.5px solid #fff' }}>{m.member.name.substring(0, 2).toUpperCase()}</Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: '11px', fontWeight: 600 }}>MEMBERS</Text>
          <Avatar.Group maxCount={4} size={28}>
            {squad.squadMembers.filter(m => m.memberType === 'MEMBER').map(m => (
              <Tooltip key={m.id} title={m.member.name}>
                <Avatar style={{ background: '#f0f2f5', color: '# ', fontSize: '10px', fontWeight: 600, border: '1.5px solid #fff' }}>{m.member.name.substring(0, 2).toUpperCase()}</Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        </div>
      </div>
    </Card>
  );
};

export default SquadCard;
