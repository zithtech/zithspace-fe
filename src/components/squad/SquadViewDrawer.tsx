"use client";

import React, { useMemo, useState } from 'react';
import { Drawer, Input, Button, Tooltip, App, Avatar } from 'antd';
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
  HEAD: { label: 'Heads', cls: 'is-head', icon: <CrownOutlined />, badgeIcon: <CrownOutlined /> },
  SUB_HEAD: { label: 'Sub-Heads', cls: 'is-subhead', icon: <StarOutlined />, badgeIcon: <StarOutlined /> },
  MEMBER: { label: 'Members', cls: 'is-member', icon: <UserOutlined />, badgeIcon: <UserOutlined /> },
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
      <div
        key={m.id}
        className={`svd-member-card ${meta.cls}`}
        style={{
          boxShadow: 'none',
          borderRadius: 4,
          border: '1px solid var(--border-color)'
        }}
      >
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
          <div style={{ display: 'flex', gap: 8 }}>
            {canReadActivityLog && squad && (
              <Button
                icon={<History size={14} />}
                onClick={(e) => { e.stopPropagation(); setHistoryOpen(true); }}
                size="small"
              >
                History
              </Button>
            )}
            {onManage && canUpdateSquad && (
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={handleManageClick}
                size="small"
                style={{ background: '#3b82f6', border: 'none', boxShadow: 'none' }}
              >
                Manage Squad
              </Button>
            )}
          </div>
        }
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "inline-flex",
                alignItems: "center", justifyContent: "center",
                background: "#3B82F6", color: "#fff",
              }}
            >
              <TeamOutlined style={{ fontSize: 14 }} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-slate-900)", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 360 }}>
                {squad.squadName}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                {squad.squadCode} • {statusLabel}
              </div>
            </div>
          </div>
        }
        width={580}
        onClose={onClose}
        open={visible}
        destroyOnHidden
        closeIcon={<CloseOutlined style={{ fontSize: 14 }} />}
      >
        {/* Premium Details Card */}
        <div style={{
          background: 'var(--bg-pure-white)',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          padding: 16,
          marginBottom: 20,
          boxShadow: '0 2px 8px -4px rgba(15,23,42,0.05)'
        }}>
          {/* Top Row */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
              width: 54, height: 54, borderRadius: 6, flexShrink: 0,
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800,
              boxShadow: '0 4px 12px -4px rgba(59,130,246,0.4)'
            }}>
              {initials || <TeamOutlined />}
            </div>
            {/* Identity */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {squad.squadName}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-slate-50)', color: 'var(--text-slate-600)', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>
                  {squad.squadCode}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: squad.squadStatus ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: squad.squadStatus ? '#059669' : '#dc2626', border: `1px solid ${squad.squadStatus ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'currentColor', marginRight: 4 }}></span>
                  {statusLabel}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-slate-50)', color: 'var(--text-slate-600)', border: '1px solid var(--border-color)' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {total} members
                </span>
              </div>
            </div>
            {/* Led By */}
            {grouped.HEAD.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-slate-500)', textTransform: 'uppercase' }}>Led By</div>
                <Avatar.Group max={{ count: 3 }} size={28}>
                  {grouped.HEAD.map(h => (
                    <Tooltip key={h.id} title={h.member.name}>
                      <Avatar style={{ border: '2px solid var(--bg-pure-white)', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                        {h.member.name.substring(0, 2).toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  ))}
                </Avatar.Group>
              </div>
            )}
          </div>
          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border-color)', margin: '16px 0' }}></div>
          {/* Bottom Row: Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            <div style={{ borderRight: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-slate-900)', lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-slate-500)', textTransform: 'uppercase', marginTop: 4 }}>Total</div>
            </div>
            <div style={{ borderRight: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{grouped.HEAD.length}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-slate-500)', textTransform: 'uppercase', marginTop: 4 }}>Heads</div>
            </div>
            <div style={{ borderRight: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{grouped.SUB_HEAD.length}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-slate-500)', textTransform: 'uppercase', marginTop: 4 }}>Sub-Heads</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-slate-500)', lineHeight: 1 }}>{grouped.MEMBER.length}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-slate-500)', textTransform: 'uppercase', marginTop: 4 }}>Members</div>
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
          zIndex={1050}
        />
      )}
    </>
  );
};

export default SquadViewDrawer;
