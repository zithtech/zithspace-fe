"use client";

import React, { useMemo, useState } from 'react';
import { Drawer, Input, Button, Tooltip, Avatar, App } from 'antd';
import {
  TeamOutlined,
  CrownOutlined,
  StarOutlined,
  UserOutlined,
  MailOutlined,
  CopyOutlined,
  SearchOutlined,
  SettingOutlined,
  CloseOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { Squad, SquadMember } from '@/services/squadService';
import { usePermission } from '@/hooks/usePermission';
import { History } from 'lucide-react';
import TransactionHistoryDrawer from '@/components/common/TransactionHistoryDrawer';

interface SquadViewDrawerProps {
  visible: boolean;
  onClose: () => void;
  squad: Squad | null;
  onManage?: (squad: Squad) => void;
}

type Role = 'HEAD' | 'SUB_HEAD' | 'MEMBER';
type FilterKey = 'ALL' | Role;

const ROLE_META: Record<Role, { label: string; cls: 'is-head' | 'is-subhead' | 'is-member'; icon: React.ReactNode; badgeIcon: React.ReactNode }> = {
  HEAD:     { label: 'Heads',     cls: 'is-head',    icon: <CrownOutlined />, badgeIcon: <CrownOutlined /> },
  SUB_HEAD: { label: 'Sub-Heads', cls: 'is-subhead', icon: <StarOutlined />,  badgeIcon: <StarOutlined /> },
  MEMBER:   { label: 'Members',   cls: 'is-member',  icon: <UserOutlined />,  badgeIcon: <UserOutlined /> },
};

const ROLE_ORDER: Role[] = ['HEAD', 'SUB_HEAD', 'MEMBER'];

const SquadViewDrawer: React.FC<SquadViewDrawerProps> = ({ visible, onClose, squad, onManage }) => {
  const { message } = App.useApp();
  const { canUpdateSquad, canReadActivityLog } = usePermission();
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [search, setSearch] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const grouped = useMemo(() => {
    const buckets: Record<Role, SquadMember[]> = { HEAD: [], SUB_HEAD: [], MEMBER: [] };
    if (squad) {
      for (const m of squad.squadMembers || []) {
        const role = m.memberType as Role;
        if (buckets[role]) buckets[role].push(m);
      }
    }
    return buckets;
  }, [squad]);

  const initials = useMemo(() => {
    if (!squad) return '';
    return squad.squadName
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [squad]);

  if (!squad) return null;

  const total = squad.squadMembers?.length || 0;
  const statusKey: 'is-active' | 'is-inactive' | 'is-archived' = squad.isArchived
    ? 'is-archived'
    : squad.squadStatus
      ? 'is-active'
      : 'is-inactive';
  const statusLabel = squad.isArchived ? 'Archived' : squad.squadStatus ? 'Active' : 'Inactive';

  const matchesSearch = (m: SquadMember) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.member.name.toLowerCase().includes(q) ||
      m.member.workEmail?.toLowerCase().includes(q) ||
      m.member.position?.title?.toLowerCase().includes(q)
    );
  };

  const visibleByRole: Record<Role, SquadMember[]> = {
    HEAD: grouped.HEAD.filter(matchesSearch),
    SUB_HEAD: grouped.SUB_HEAD.filter(matchesSearch),
    MEMBER: grouped.MEMBER.filter(matchesSearch),
  };

  const rolesToRender: Role[] =
    filter === 'ALL' ? ROLE_ORDER : [filter];

  const totalVisible = rolesToRender.reduce((sum, r) => sum + visibleByRole[r].length, 0);

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      message.success('Email copied');
    } catch {
      message.error('Could not copy email');
    }
  };

  const renderMemberCard = (m: SquadMember) => {
    const role = m.memberType as Role;
    const meta = ROLE_META[role];
    return (
      <div key={m.id} className={`svd-member-card ${meta.cls}`}>
        <div className="svd-member-card__avatar">
          {m.member.name.charAt(0).toUpperCase()}
          <span className="svd-member-card__avatar-badge">{meta.badgeIcon}</span>
        </div>
        <div className="svd-member-card__main">
          <div className="svd-member-card__name" title={m.member.name}>
            {m.member.name}
          </div>
          <div className="svd-member-card__meta">
            <span className="svd-member-card__designation">
              {m.member.position?.title || 'No designation'}
            </span>
          </div>
        </div>
        <div className="svd-member-card__actions">
          <Tooltip title="Copy email">
            <Button
              size="small"
              className="svd-member-card__action-btn"
              icon={<CopyOutlined />}
              onClick={() => copyEmail(m.member.workEmail)}
            />
          </Tooltip>
          <Tooltip title={`Email ${m.member.name}`}>
            <Button
              size="small"
              className="svd-member-card__action-btn"
              icon={<MailOutlined />}
              href={`mailto:${m.member.workEmail}`}
            />
          </Tooltip>
        </div>
      </div>
    );
  };

  const renderGroup = (role: Role) => {
    const list = visibleByRole[role];
    const meta = ROLE_META[role];
    if (list.length === 0 && filter === 'ALL' && grouped[role].length === 0 && search) {
      return null;
    }
    return (
      <div key={role} className="svd-group">
        <div className="svd-group__header">
          <div className={`svd-group__icon ${meta.cls}`}>{meta.icon}</div>
          <div className="svd-group__title">{meta.label}</div>
          <div className="svd-group__count">{list.length}</div>
          <div className="svd-group__divider" />
        </div>
        {list.length === 0 ? (
          <div className="svd-empty" style={{ padding: '28px 14px' }}>
            <div className="svd-empty__icon" style={{ width: 40, height: 40, fontSize: 16, marginBottom: 8 }}>
              {meta.icon}
            </div>
            <div className="svd-empty__sub">
              {search ? `No ${meta.label.toLowerCase()} matched “${search}”.` : `No ${meta.label.toLowerCase()} assigned yet.`}
            </div>
          </div>
        ) : (
          <div className="svd-grid">{list.map(renderMemberCard)}</div>
        )}
      </div>
    );
  };

  const handleManageClick = () => {
    if (onManage) {
      onClose();
      setTimeout(() => onManage(squad), 80);
    }
  };

  return (
    <>
    <Drawer
      className="squad-drawer"
      extra={
        canReadActivityLog && squad && (
          <Button
            icon={<History size={14} />}
            onClick={() => setHistoryOpen(true)}
            size="small"
            style={{ borderRadius: 6 }}
          >
            History
          </Button>
        )
      }
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.16), rgba(139, 92, 246, 0.12))',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: 'var(--premium-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TeamOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-slate-900)' }}>Squad Overview</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-slate-400)', marginTop: 2 }}>
              Read-only details and members
            </div>
          </div>
        </div>
      }
      width={760}
      onClose={onClose}
      open={visible}
      destroyOnHidden
      closeIcon={<CloseOutlined style={{ fontSize: 14 }} />}
      footer={
        <div className="svd-footer">
          <span className="svd-footer__hint">
            <UserOutlined /> {total} {total === 1 ? 'member' : 'members'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={onClose}>Close</Button>
            {onManage && canUpdateSquad && (
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={handleManageClick}
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
                Manage Squad
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Hero panel */}
      <div className="svd-hero">
        <div className="svd-hero__top">
          <div className="svd-hero__avatar">{initials || <TeamOutlined />}</div>
          <div className="svd-hero__title-block">
            <div className="svd-hero__name" title={squad.squadName}>{squad.squadName}</div>
            <div className="svd-hero__sub">
              <span className="svd-hero__chip is-code">{squad.squadCode}</span>
              <span className={`svd-hero__chip ${statusKey}`}>
                <span className="svd-hero__chip-dot" />
                {statusLabel}
              </span>
              <span className="svd-hero__chip">
                <UserOutlined style={{ fontSize: 10 }} />
                {total} {total === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>

          {grouped.HEAD.length > 0 && (
            <div className="svd-hero__leads">
              <div className="svd-hero__leads-label">Led by</div>
              <Avatar.Group max={{ count: 3 }} size={28}>
                {grouped.HEAD.map(h => (
                  <Tooltip key={h.id} title={h.member.name}>
                    <Avatar>{h.member.name.substring(0, 2).toUpperCase()}</Avatar>
                  </Tooltip>
                ))}
              </Avatar.Group>
            </div>
          )}
        </div>

        <div className="svd-hero__metrics">
          <div className="svd-hero__metric">
            <div className="svd-hero__metric-value">{total}</div>
            <div className="svd-hero__metric-label">Total</div>
          </div>
          <div className="svd-hero__metric is-head">
            <div className="svd-hero__metric-value">{grouped.HEAD.length}</div>
            <div className="svd-hero__metric-label">Heads</div>
          </div>
          <div className="svd-hero__metric is-subhead">
            <div className="svd-hero__metric-value">{grouped.SUB_HEAD.length}</div>
            <div className="svd-hero__metric-label">Sub-Heads</div>
          </div>
          <div className="svd-hero__metric is-member">
            <div className="svd-hero__metric-value">{grouped.MEMBER.length}</div>
            <div className="svd-hero__metric-label">Members</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      {total > 0 && (
        <>
          <div className="svd-filter-bar">
            <Input
              className="svd-search"
              prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', marginRight: 6 }} />}
              placeholder="Search by name, designation, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>

          <div className="svd-filter-bar" style={{ marginBottom: 18 }}>
            <div className="svd-tabs">
              <button
                className={`svd-tab${filter === 'ALL' ? ' is-active' : ''}`}
                onClick={() => setFilter('ALL')}
              >
                All
                <span className="svd-tab__count">{total}</span>
              </button>
              {ROLE_ORDER.map(r => {
                const meta = ROLE_META[r];
                const count = grouped[r].length;
                return (
                  <button
                    key={r}
                    className={`svd-tab ${meta.cls}${filter === r ? ' is-active' : ''}`}
                    onClick={() => setFilter(r)}
                  >
                    {meta.icon}
                    {meta.label}
                    <span className="svd-tab__count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Body */}
      {total === 0 ? (
        <div className="svd-empty">
          <div className="svd-empty__icon">
            <InboxOutlined />
          </div>
          <div className="svd-empty__title">No members yet</div>
          <div className="svd-empty__sub">
            This squad doesn’t have any members assigned. Use Manage to add heads, sub-heads, and members.
          </div>
        </div>
      ) : totalVisible === 0 ? (
        <div className="svd-empty">
          <div className="svd-empty__icon">
            <SearchOutlined />
          </div>
          <div className="svd-empty__title">No matches</div>
          <div className="svd-empty__sub">
            No members match {search ? `“${search}”` : 'the current filter'}.
          </div>
        </div>
      ) : (
        rolesToRender.map(renderGroup)
      )}
    </Drawer>
      {squad && (
        <TransactionHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          entityType="squad"
          entityId={squad.id}
          subtitle={squad.squadName}
        />
      )}
    </>
  );
};

export default SquadViewDrawer;
