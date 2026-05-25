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
  CrownOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Squad, SquadService } from '@/services/squadService';
import { usePermission } from '@/hooks/usePermission';

interface SquadCardProps {
  squad: Squad;
  onOpen: (squad: Squad) => void;
  onManage: (squad: Squad) => void;
  onRefresh: () => void;
}

const ROLE_BG = {
  HEAD: 'linear-gradient(135deg, #10b981, #059669)',
  SUB_HEAD: 'linear-gradient(135deg, #f59e0b, #d97706)',
  MEMBER: 'linear-gradient(135deg, #3b82f6, #6366f1)',
} as const;

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

  const computed = useMemo(() => {
    const all = squad.squadMembers || [];
    const heads = all.filter(m => m.memberType === 'HEAD');
    const subHeads = all.filter(m => m.memberType === 'SUB_HEAD');
    const members = all.filter(m => m.memberType === 'MEMBER');
    const total = heads.length + subHeads.length + members.length;

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

    // Ordered: heads → sub-heads → members
    const ordered = [...heads, ...subHeads, ...members];

    return {
      heads,
      subHeads,
      members,
      total,
      initials,
      statusClass,
      statusBadgeClass,
      statusLabel,
      ordered,
    };
  }, [squad]);

  const {
    heads,
    subHeads,
    members,
    total,
    initials,
    statusClass,
    statusBadgeClass,
    statusLabel,
    ordered,
  } = computed;

  const headsPct = total > 0 ? (heads.length / total) * 100 : 0;
  const subHeadsPct = total > 0 ? (subHeads.length / total) * 100 : 0;
  const membersPct = total > 0 ? (members.length / total) * 100 : 0;

  return (
    <div className={`sq-card ${statusClass}`}>
      <div className="sq-card__accent" />

      {/* Header */}
      <div className="sq-card__header">
        <div className="sq-card__avatar">{initials || <TeamOutlined />}</div>

        <div className="sq-card__title-block">
          <div className="sq-card__title-row">
            <div className="sq-card__title" title={squad.squadName}>
              {squad.squadName}
            </div>
            <span className={`sq-card__status ${statusBadgeClass}`}>
              <span className="squad-status-dot" />
              {statusLabel}
            </span>
          </div>
          <div className="sq-card__meta">
            <span className="sq-card__code">{squad.squadCode}</span>
            <span className="sq-card__meta-dot">•</span>
            <span className="sq-card__meta-text">
              <TeamOutlined style={{ fontSize: 11 }} />
              {total} {total === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>

        {menuItems.length > 0 && (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight" disabled={busy}>
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="sq-card__menu-btn"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        )}
      </div>

      {/* Composition bar */}
      <div className="sq-card__compbar">
        <div className="sq-card__compbar-track">
          {total === 0 ? (
            <span className="sq-card__compbar-empty" />
          ) : (
            <>
              {heads.length > 0 && (
                <Tooltip title={`${heads.length} Head${heads.length === 1 ? '' : 's'}`}>
                  <span
                    className="sq-card__compbar-seg is-head"
                    style={{ width: `${headsPct}%` }}
                  />
                </Tooltip>
              )}
              {subHeads.length > 0 && (
                <Tooltip title={`${subHeads.length} Sub-Head${subHeads.length === 1 ? '' : 's'}`}>
                  <span
                    className="sq-card__compbar-seg is-subhead"
                    style={{ width: `${subHeadsPct}%` }}
                  />
                </Tooltip>
              )}
              {members.length > 0 && (
                <Tooltip title={`${members.length} Member${members.length === 1 ? '' : 's'}`}>
                  <span
                    className="sq-card__compbar-seg is-member"
                    style={{ width: `${membersPct}%` }}
                  />
                </Tooltip>
              )}
            </>
          )}
        </div>
        <div className="sq-card__compbar-legend">
          <span className="sq-card__compbar-stat">
            <CrownOutlined className="is-head-color" />
            <strong>{heads.length}</strong>
            <em>Heads</em>
          </span>
          <span className="sq-card__compbar-stat">
            <StarOutlined className="is-subhead-color" />
            <strong>{subHeads.length}</strong>
            <em>Sub-Heads</em>
          </span>
          <span className="sq-card__compbar-stat">
            <TeamOutlined className="is-member-color" />
            <strong>{members.length}</strong>
            <em>Members</em>
          </span>
        </div>
      </div>

      {/* Unified avatar stack */}
      <div className="sq-card__avatars-row">
        {ordered.length === 0 ? (
          <div className="sq-card__avatars-empty">
            <InboxOutlined />
            <span>No members assigned yet</span>
          </div>
        ) : (
          <>
            <Avatar.Group max={{ count: 6 }} size={28} className="sq-card__avatars">
              {ordered.map(m => (
                <Tooltip
                  key={m.id}
                  title={
                    <span>
                      {m.member.name}
                      <span style={{ opacity: 0.7, marginLeft: 6, fontSize: 11 }}>
                        {m.memberType === 'HEAD'
                          ? '· Head'
                          : m.memberType === 'SUB_HEAD'
                            ? '· Sub-Head'
                            : '· Member'}
                      </span>
                    </span>
                  }
                >
                  <Avatar style={{ background: ROLE_BG[m.memberType], fontSize: 11, fontWeight: 600 }}>
                    {m.member.name.substring(0, 2).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
            {ordered.length > 6 && (
              <span className="sq-card__avatars-more">+{ordered.length - 6} more</span>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sq-card__footer">
        <Button icon={<EyeOutlined />} onClick={() => onOpen(squad)} className="sq-card__btn-ghost">
          View
        </Button>
        {canUpdateSquad && (
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => onManage(squad)}
            className="sq-card__btn-primary"
          >
            Manage
          </Button>
        )}
      </div>
    </div>
  );
};

export default SquadCard;
