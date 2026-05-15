"use client";

import React, { useMemo, useState } from 'react';
import { Button, Dropdown, Avatar, Tooltip, App, MenuProps } from 'antd';
import {
  MoreOutlined,
  TeamOutlined,
  DeleteOutlined,
  InboxOutlined,
  RollbackOutlined,
  EyeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Squad, SquadService } from '@/services/squadService';
import { usePermission } from '@/hooks/usePermission';

interface SquadCardProps {
  squad: Squad;
  onOpen: (squad: Squad) => void;
  onManage: (squad: Squad) => void;
  onRefresh: () => void;
}

const HEAD_AVATAR_BG = 'linear-gradient(135deg, #10b981, #059669)';
const SUBHEAD_AVATAR_BG = 'linear-gradient(135deg, #f59e0b, #d97706)';
const MEMBER_AVATAR_BG = 'linear-gradient(135deg, #3b82f6, #6366f1)';

const SquadCard: React.FC<SquadCardProps> = ({ squad, onOpen, onManage, onRefresh }) => {
  const { message, modal } = App.useApp();
  const { canUpdateSquad, canDeleteSquad } = usePermission();
  const [busy, setBusy] = useState(false);

  const handleArchive = async () => {
    try {
      setBusy(true);
      await SquadService.archiveSquad(squad.id, !squad.isArchived);
      message.success(`Squad ${squad.isArchived ? 'unarchived' : 'archived'} successfully`);
      onRefresh();
    } catch (error) {
      console.error(error);
      message.error('Failed to update squad archive status');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Delete this squad?',
      content: 'This action cannot be undone. All squad memberships will be removed.',
      okText: 'Yes, delete',
      okType: 'danger',
      cancelText: 'Cancel',
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

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [];
    
    if (canUpdateSquad) {
      items.push({
        key: 'archive',
        icon: squad.isArchived ? <RollbackOutlined /> : <InboxOutlined />,
        label: squad.isArchived ? 'Unarchive' : 'Archive',
        onClick: handleArchive,
      });
    }

    if (canDeleteSquad) {
      if (items.length > 0) items.push({ type: 'divider' });
      items.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
        label: 'Delete',
        onClick: handleDelete,
      });
    }
    
    return items;
  }, [canUpdateSquad, canDeleteSquad, squad.isArchived]);

  const { heads, subHeads, members, initials, statusClass, statusBadgeClass, statusLabel } = useMemo(() => {
    const heads = squad.squadMembers?.filter(m => m.memberType === 'HEAD') || [];
    const subHeads = squad.squadMembers?.filter(m => m.memberType === 'SUB_HEAD') || [];
    const members = squad.squadMembers?.filter(m => m.memberType === 'MEMBER') || [];
    const initials = squad.squadName
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    const statusClass = squad.isArchived
      ? 'is-archived'
      : squad.squadStatus
        ? 'is-active'
        : 'is-inactive';
    const statusBadgeClass = squad.isArchived
      ? 'squad-status--archived'
      : squad.squadStatus
        ? 'squad-status--active'
        : 'squad-status--inactive';
    const statusLabel = squad.isArchived ? 'Archived' : squad.squadStatus ? 'Active' : 'Inactive';
    return { heads, subHeads, members, initials, statusClass, statusBadgeClass, statusLabel };
  }, [squad]);

  const renderAvatarGroup = (
    group: typeof heads,
    bg: string,
    maxCount = 3,
  ) => {
    if (group.length === 0) {
      return <span className="squad-card-v2__avatars-empty">— Unassigned</span>;
    }
    return (
      <Avatar.Group max={{ count: maxCount }} size={26} className="squad-card-v2__avatars">
        {group.map(m => (
          <Tooltip key={m.id} title={m.member.name}>
            <Avatar style={{ background: bg }}>
              {m.member.name.substring(0, 2).toUpperCase()}
            </Avatar>
          </Tooltip>
        ))}
      </Avatar.Group>
    );
  };

  return (
    <div className={`squad-card-v2 ${statusClass}`}>
      <div className="squad-card-v2__accent" />
      <div className="squad-card-v2__body">
        <div className="squad-card-v2__header">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
            <div className="squad-card-v2__avatar">{initials || <TeamOutlined />}</div>
            <div className="squad-card-v2__title-block">
              <div className="squad-card-v2__title" title={squad.squadName}>
                {squad.squadName}
              </div>
              <div className="squad-card-v2__code">{squad.squadCode}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span className={`squad-card-v2__status ${statusBadgeClass}`}>
              <span className="squad-status-dot" />
              {statusLabel}
            </span>
            {menuItems.length > 0 && (
              <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight" disabled={busy}>
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  className="squad-card-v2__menu-btn"
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            )}
          </div>
        </div>

        <div>
          <div className="squad-card-v2__role-row">
            <div className="squad-card-v2__role-label">
              <span className="squad-card-v2__role-dot is-head" />
              Heads
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="squad-card-v2__role-count">{heads.length}</span>
              {renderAvatarGroup(heads, HEAD_AVATAR_BG)}
            </div>
          </div>
          <div className="squad-card-v2__role-row">
            <div className="squad-card-v2__role-label">
              <span className="squad-card-v2__role-dot is-subhead" />
              Sub-Heads
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="squad-card-v2__role-count">{subHeads.length}</span>
              {renderAvatarGroup(subHeads, SUBHEAD_AVATAR_BG)}
            </div>
          </div>
          <div className="squad-card-v2__role-row">
            <div className="squad-card-v2__role-label">
              <span className="squad-card-v2__role-dot is-member" />
              Members
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="squad-card-v2__role-count">{members.length}</span>
              {renderAvatarGroup(members, MEMBER_AVATAR_BG, 5)}
            </div>
          </div>
        </div>
      </div>

      <div className="squad-card-v2__footer">
        <Button icon={<EyeOutlined />} onClick={() => onOpen(squad)}>
          View
        </Button>
        {canUpdateSquad && (
          <Button type="primary" icon={<SettingOutlined />} onClick={() => onManage(squad)}>
            Manage
          </Button>
        )}
      </div>
    </div>
  );
};

export default SquadCard;
