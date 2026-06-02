"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Button,
  Input,
  Select,
  Row,
  Col,
  Table,
  Avatar,
  message,
  Tooltip,
  Card,
  Skeleton,
  Segmented,
  Popconfirm,
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  CrownOutlined,
  StarOutlined,
  InboxOutlined,
  RocketOutlined,
  ReloadOutlined,
  CloseOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Squad, SquadService } from '@/services/squadService';
import SquadCard from '@/components/squad/SquadCard';
import SquadDrawer from '@/components/squad/SquadDrawer';
import SquadViewDrawer from '@/components/squad/SquadViewDrawer';
import { TimeTrackingHeader } from '@/components/time-tracking/TimeTrackingHeader';
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { usePermission } from '@/hooks/usePermission';

const { Text } = Typography;

/* -------------------------------------------------------------------------- */
/*                              Premium StatCard                              */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
  subtle?: string;
  loading?: boolean;
  chart?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accent,
  subtle,
  loading,
  chart,
}) => (
  <div className="sq-stat-card" style={{ ['--sq-accent' as any]: accent }}>
    <div className="sq-stat-head">
      <div
        className="sq-stat-icon"
        style={{
          background: `${accent}14`,
          color: accent,
          boxShadow: `inset 0 0 0 1px ${accent}26`,
        }}
      >
        {icon}
      </div>
      <Text className="sq-stat-label">{label}</Text>
      <div className="sq-stat-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 56, height: 22 }} />
        ) : (
          <span className="sq-stat-value">{value}</span>
        )}
      </div>
    </div>
    {subtle && <Text className="sq-stat-subtle">{subtle}</Text>}
    {chart && <div className="sq-stat-chart">{chart}</div>}
    <span
      className="sq-stat-accent"
      style={{ background: `linear-gradient(90deg, ${accent} 0%, transparent 80%)` }}
    />
  </div>
);

/* Mini distribution bar */
interface MiniBarProps {
  segments: { value: number; color: string; label: string }[];
}
const MiniBar: React.FC<MiniBarProps> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="sq-minibar">
      <div className="sq-minibar-track">
        {segments.map((s, i) => (
          <Tooltip key={i} title={`${s.label}: ${s.value}`}>
            <span
              className="sq-minibar-seg"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="sq-minibar-legend">
        {segments.map((s, i) => (
          <span key={i} className="sq-minibar-legend-item">
            <span className="sq-minibar-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function SquadManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const { canReadSquad, canCreateSquad, canUpdateSquad, canDeleteSquad } = usePermission();
  const [loading, setLoading] = useState(false);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [filteredSquads, setFilteredSquads] = useState<Squad[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSquadIds, setSelectedSquadIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null);

  useEffect(() => {
    if (user && canReadSquad) {
      fetchSquads();
    }
  }, [user, canReadSquad]);

  useEffect(() => {
    filterSquads();
  }, [squads, searchTerm, statusFilter, selectedSquadIds, selectedUserIds]);

  if (!authLoading && !canReadSquad) {
    return (
      <MainLayout>
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <InboxOutlined style={{ fontSize: 48, color: 'var(--text-slate-300)', marginBottom: 20 }} />
          <Typography.Title level={4}>Access Denied</Typography.Title>
          <Typography.Text type="secondary">
            You do not have permission to view squad information. Please contact your administrator.
          </Typography.Text>
        </div>
      </MainLayout>
    );
  }

  const fetchSquads = async () => {
    try {
      setLoading(true);
      const data = await SquadService.getSquads();
      setSquads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch squads');
    } finally {
      setLoading(false);
    }
  };

  const filterSquads = () => {
    let filtered = [...squads];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.squadName.toLowerCase().includes(q) ||
        s.squadCode.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'archived') {
        filtered = filtered.filter(s => s.isArchived);
      } else if (statusFilter === 'active') {
        filtered = filtered.filter(s => s.squadStatus && !s.isArchived);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(s => !s.squadStatus && !s.isArchived);
      }
    }

    if (selectedSquadIds.length > 0) {
      const set = new Set(selectedSquadIds);
      filtered = filtered.filter(s => set.has(s.id));
    }

    if (selectedUserIds.length > 0) {
      const set = new Set(selectedUserIds);
      filtered = filtered.filter(s =>
        s.squadMembers?.some(m => set.has(m.squadMemberId))
      );
    }

    setFilteredSquads(filtered);
  };

  /* ------------------------ Searchable filter options ----------------------- */

  const squadOptions = useMemo(
    () =>
      squads
        .map(s => ({
          value: s.id,
          label: s.squadName,
          code: s.squadCode,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [squads]
  );

  const userOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string; sub?: string }>();
    squads.forEach(s => {
      s.squadMembers?.forEach(m => {
        if (!map.has(m.squadMemberId)) {
          map.set(m.squadMemberId, {
            value: m.squadMemberId,
            label: m.member.name,
            sub: m.member.workEmail,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [squads]);

  /* ----------------------------- Stats payload ----------------------------- */

  const statsData = useMemo(() => {
    const totalSquads = squads.length;
    const activeSquads = squads.filter(s => s.squadStatus && !s.isArchived).length;
    const inactiveSquads = squads.filter(s => !s.squadStatus && !s.isArchived).length;
    const archivedSquads = squads.filter(s => s.isArchived).length;
    const uniqueMembers = new Set<string>();
    let heads = 0;
    let subHeads = 0;
    let members = 0;
    squads.forEach(s => {
      s.squadMembers?.forEach(m => {
        uniqueMembers.add(m.squadMemberId);
        if (m.memberType === 'HEAD') heads += 1;
        else if (m.memberType === 'SUB_HEAD') subHeads += 1;
        else members += 1;
      });
    });
    return {
      totalSquads,
      activeSquads,
      inactiveSquads,
      archivedSquads,
      uniqueMembers: uniqueMembers.size,
      heads,
      subHeads,
      members,
      leadership: heads + subHeads,
    };
  }, [squads]);

  const activePct =
    statsData.totalSquads > 0
      ? Math.round((statsData.activeSquads / statsData.totalSquads) * 100)
      : 0;

  const hasActiveFilter =
    !!searchTerm ||
    statusFilter !== 'all' ||
    selectedSquadIds.length > 0 ||
    selectedUserIds.length > 0;

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedSquadIds([]);
    setSelectedUserIds([]);
  };

  const handleCreate = () => {
    setCurrentSquad(null);
    setDrawerVisible(true);
  };

  const handleManage = (squad: Squad) => {
    setCurrentSquad(squad);
    setDrawerVisible(true);
  };

  const handleOpen = (squad: Squad) => {
    setCurrentSquad(squad);
    setViewDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await SquadService.deleteSquad(id);
      message.success('Squad deleted successfully');
      fetchSquads();
    } catch (error) {
      console.error(error);
      message.error('Failed to delete squad');
    }
  };

  const columns = [
    {
      title: 'Squad',
      dataIndex: 'squadName',
      key: 'squadName',
      width: 320,
      render: (text: string, record: Squad) => {
        const initials = text.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const isArchived = record.isArchived;
        const statusClass = isArchived ? 'is-archived' : record.squadStatus ? 'is-active' : 'is-inactive';
        return (
          <div className={`sq-list-name ${statusClass}`}>
            <div className="sq-list-name__avatar">{initials || <TeamOutlined />}</div>
            <div className="sq-list-name__text">
              <div className="sq-list-name__title" title={text}>{text}</div>
              <div className="sq-list-name__sub">
                <span className="sq-list-name__code">{record.squadCode}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Composition',
      key: 'composition',
      width: 240,
      render: (record: Squad) => {
        const all = record.squadMembers || [];
        const heads = all.filter(m => m.memberType === 'HEAD').length;
        const subHeads = all.filter(m => m.memberType === 'SUB_HEAD').length;
        const members = all.filter(m => m.memberType === 'MEMBER').length;
        const total = heads + subHeads + members;
        if (total === 0) {
          return <Text style={{ color: 'var(--text-slate-400)', fontSize: 12 }}>—</Text>;
        }
        return (
          <div className="sq-list-comp">
            <div className="sq-list-comp__bar">
              {heads > 0 && (
                <Tooltip title={`${heads} Head${heads === 1 ? '' : 's'}`}>
                  <span className="sq-list-comp__seg is-head" style={{ width: `${(heads / total) * 100}%` }} />
                </Tooltip>
              )}
              {subHeads > 0 && (
                <Tooltip title={`${subHeads} Sub-Head${subHeads === 1 ? '' : 's'}`}>
                  <span className="sq-list-comp__seg is-subhead" style={{ width: `${(subHeads / total) * 100}%` }} />
                </Tooltip>
              )}
              {members > 0 && (
                <Tooltip title={`${members} Member${members === 1 ? '' : 's'}`}>
                  <span className="sq-list-comp__seg is-member" style={{ width: `${(members / total) * 100}%` }} />
                </Tooltip>
              )}
            </div>
            <div className="sq-list-comp__legend">
              <span><b>{heads}</b>H</span>
              <span><b>{subHeads}</b>SH</span>
              <span><b>{members}</b>M</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Team',
      key: 'team',
      render: (record: Squad) => {
        const all = record.squadMembers || [];
        const heads = all.filter(m => m.memberType === 'HEAD');
        const subHeads = all.filter(m => m.memberType === 'SUB_HEAD');
        const members = all.filter(m => m.memberType === 'MEMBER');
        const ordered = [...heads, ...subHeads, ...members];
        if (ordered.length === 0) {
          return <Text style={{ color: 'var(--text-slate-400)', fontSize: 12 }}>—</Text>;
        }
        return (
          <div className="sq-list-team">
            <Avatar.Group max={{ count: 5 }} size={26} className="sq-list-team__avatars">
              {ordered.map(m => (
                <Tooltip
                  key={m.id}
                  title={`${m.member.name} · ${
                    m.memberType === 'HEAD' ? 'Head' : m.memberType === 'SUB_HEAD' ? 'Sub-Head' : 'Member'
                  }`}
                >
                  <Avatar
                    style={{
                      background:
                        m.memberType === 'HEAD'
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : m.memberType === 'SUB_HEAD'
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {m.member.name.substring(0, 2).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
            <span className="sq-list-team__count">
              <UserOutlined style={{ fontSize: 11, color: 'var(--text-slate-400)' }} />
              {ordered.length}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'squadStatus',
      key: 'status',
      width: 130,
      render: (status: boolean, record: Squad) => {
        const cls = record.isArchived
          ? 'squad-status--archived'
          : status
            ? 'squad-status--active'
            : 'squad-status--inactive';
        const label = record.isArchived ? 'Archived' : status ? 'Active' : 'Inactive';
        return (
          <span className={`squad-card-v2__status ${cls}`}>
            <span className="squad-status-dot" />
            {label}
          </span>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      align: 'right' as const,
      render: (record: Squad) => (
        <div className="sq-list-actions">
          <Tooltip title="View details">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => handleOpen(record)} />
          </Tooltip>
          {canUpdateSquad && (
            <Tooltip title="Manage squad">
              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleManage(record)} />
            </Tooltip>
          )}
          {canDeleteSquad && (
            <Tooltip title="Delete squad">
              <Popconfirm
                title="Delete Squad"
                description="Are you sure you want to delete this squad? This action cannot be undone."
                onConfirm={() => handleDelete(record.id)}
                okText="Yes, Delete"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  if (authLoading) {
    return (
      <MainLayout>
        <div className="squad-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <LoadingSpinner message="Authenticating system entrance..." />
        </div>
      </MainLayout>
    );
  }

  const renderSkeletonGrid = () => (
    <Row gutter={[20, 20]}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Col key={i} xs={24} sm={12} lg={8} xl={6}>
          <div className="squad-skel-card">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
              <div className="squad-skel-bar" style={{ width: 46, height: 46, borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <div className="squad-skel-bar" style={{ width: '60%', height: 14, marginBottom: 8 }} />
                <div className="squad-skel-bar" style={{ width: '40%', height: 10 }} />
              </div>
            </div>
            <div className="squad-skel-bar" style={{ width: '100%', height: 36, marginBottom: 8 }} />
            <div className="squad-skel-bar" style={{ width: '100%', height: 36, marginBottom: 8 }} />
            <div className="squad-skel-bar" style={{ width: '100%', height: 36 }} />
          </div>
        </Col>
      ))}
    </Row>
  );

  return (
    <MainLayout>
      <div className="squad-shell">
        <TimeTrackingHeader
          icon={<TeamOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
          title="Squad Management"
          description="Configure and manage project teams, leadership roles, and member allocations."
          style={{
            borderBottom: '1px solid var(--border-slate-200)',
            padding: '9.5px 32px',
            marginBottom: 20,
            boxShadow: 'none'
          }}
          extra={
            canCreateSquad && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                className="sq-primary-btn"
              >
                Create Squad
              </Button>
            )
          }
        />

        <div className="squad-content">
          {/* Stats Overview */}
          <div className="sq-stat-grid">
            <StatCard
              label="Total Squads"
              value={statsData.totalSquads}
              icon={<RocketOutlined />}
              accent="#3b82f6"
              subtle="Across all teams"
              loading={loading && statsData.totalSquads === 0}
              chart={
                statsData.totalSquads > 0 ? (
                  <MiniBar
                    segments={[
                      {
                        value: statsData.activeSquads,
                        color: '#10b981',
                        label: `${statsData.activeSquads} active`,
                      },
                      {
                        value: statsData.inactiveSquads,
                        color: '#94a3b8',
                        label: `${statsData.inactiveSquads} inactive`,
                      },
                      {
                        value: statsData.archivedSquads,
                        color: '#f59e0b',
                        label: `${statsData.archivedSquads} archived`,
                      },
                    ]}
                  />
                ) : null
              }
            />

            <StatCard
              label="Active Squads"
              value={statsData.activeSquads}
              icon={<StarOutlined />}
              accent="#10b981"
              subtle={
                statsData.totalSquads > 0
                  ? `${activePct}% of total`
                  : 'No squads yet'
              }
              loading={loading && statsData.totalSquads === 0}
              chart={
                statsData.totalSquads > 0 ? (
                  <div className="sq-progress-row">
                    <div className="sq-progress-track">
                      <span
                        className="sq-progress-fill"
                        style={{
                          width: `${activePct}%`,
                          background: 'linear-gradient(90deg, #10b981, #34d399)',
                        }}
                      />
                    </div>
                    <span className="sq-progress-label">{activePct}%</span>
                  </div>
                ) : null
              }
            />

            <StatCard
              label="Leadership"
              value={statsData.leadership}
              icon={<CrownOutlined />}
              accent="#f59e0b"
              subtle="Heads + Sub-Heads"
              loading={loading && statsData.totalSquads === 0}
              chart={
                statsData.leadership > 0 ? (
                  <MiniBar
                    segments={[
                      {
                        value: statsData.heads,
                        color: '#10b981',
                        label: `${statsData.heads} heads`,
                      },
                      {
                        value: statsData.subHeads,
                        color: '#f59e0b',
                        label: `${statsData.subHeads} sub-heads`,
                      },
                    ]}
                  />
                ) : null
              }
            />

            <StatCard
              label="Total Members"
              value={statsData.uniqueMembers}
              icon={<TeamOutlined />}
              accent="#8b5cf6"
              subtle={
                statsData.uniqueMembers > 0
                  ? `${(statsData.heads + statsData.subHeads + statsData.members)} assignments`
                  : 'No members yet'
              }
              loading={loading && statsData.totalSquads === 0}
              chart={
                statsData.uniqueMembers > 0 ? (
                  <div className="sq-cv-row">
                    <UserOutlined style={{ fontSize: 11 }} />
                    <span>
                      Avg <strong>
                        {statsData.totalSquads > 0
                          ? Math.round(
                              (statsData.heads + statsData.subHeads + statsData.members) /
                                statsData.totalSquads
                            )
                          : 0}
                      </strong> per squad
                    </span>
                  </div>
                ) : null
              }
            />
          </div>

          {/* Toolbar — single row */}
          <div className="sq-toolbar-v2">
            <div className="sq-toolbar-v2__row sq-toolbar-v2__row--single">
              <Input
                className="sq-search"
                prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', marginRight: 6 }} />}
                placeholder="Search by name or code…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />

              <Segmented
                className="sq-status-segmented"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as string)}
                options={[
                  { label: 'All', value: 'all' },
                  {
                    label: (
                      <span className="sq-seg-opt">
                        <span className="sq-seg-dot is-active" />
                        Active
                      </span>
                    ),
                    value: 'active',
                  },
                  {
                    label: (
                      <span className="sq-seg-opt">
                        <span className="sq-seg-dot is-inactive" />
                        Inactive
                      </span>
                    ),
                    value: 'inactive',
                  },
                  {
                    label: (
                      <span className="sq-seg-opt">
                        <span className="sq-seg-dot is-archived" />
                        Archived
                      </span>
                    ),
                    value: 'archived',
                  },
                ]}
              />

              <Select
                className="sq-filter-select"
                mode="multiple"
                allowClear
                showSearch
                maxTagCount="responsive"
                placeholder={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <RocketOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                    Squads
                  </span>
                }
                value={selectedSquadIds}
                onChange={setSelectedSquadIds}
                style={{ flex: '1 1 180px', minWidth: 160, maxWidth: 260 }}
                options={squadOptions.map(o => ({
                  value: o.value,
                  label: o.label,
                  searchText: `${o.label} ${o.code}`,
                  rich: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-slate-800)' }}>
                        {o.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text-slate-400)',
                          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                        }}
                      >
                        {o.code}
                      </span>
                    </div>
                  ),
                }))}
                optionRender={(option) => (option.data as any).rich}
                filterOption={(input, option: any) =>
                  (option?.searchText || '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />

              <Select
                className="sq-filter-select"
                mode="multiple"
                allowClear
                showSearch
                maxTagCount="responsive"
                placeholder={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <UserOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                    Members
                  </span>
                }
                value={selectedUserIds}
                onChange={setSelectedUserIds}
                style={{ flex: '1 1 180px', minWidth: 160, maxWidth: 260 }}
                options={userOptions.map(o => ({
                  value: o.value,
                  label: o.label,
                  searchText: `${o.label} ${o.sub || ''}`,
                  rich: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar
                        size={22}
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {o.label.substring(0, 2).toUpperCase()}
                      </Avatar>
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-slate-800)', fontSize: 13 }}>
                          {o.label}
                        </span>
                        {o.sub && (
                          <span style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>
                            {o.sub}
                          </span>
                        )}
                      </div>
                    </div>
                  ),
                }))}
                optionRender={(option) => (option.data as any).rich}
                filterOption={(input, option: any) =>
                  (option?.searchText || '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />

              {hasActiveFilter && (
                <Tooltip title="Clear all filters">
                  <Button
                    type="text"
                    size="middle"
                    icon={<ReloadOutlined />}
                    onClick={handleClearFilters}
                    className="sq-clear-btn"
                  >
                    Reset
                  </Button>
                </Tooltip>
              )}

              <div className="sq-toolbar-v2__divider" />

              <Text className="sq-count-text">
                <strong>{filteredSquads.length}</strong> of {squads.length}
              </Text>

              <div className="squad-view-switch">
                <Tooltip title="Grid view">
                  <button
                    className={viewMode === 'grid' ? 'is-active' : ''}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <AppstoreOutlined />
                  </button>
                </Tooltip>
                <Tooltip title="List view">
                  <button
                    className={viewMode === 'list' ? 'is-active' : ''}
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <BarsOutlined />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Row 3: Active filter chips */}
            {(selectedSquadIds.length > 0 || selectedUserIds.length > 0) && (
              <div className="sq-toolbar-v2__chips">
                {selectedSquadIds.map(id => {
                  const opt = squadOptions.find(o => o.value === id);
                  if (!opt) return null;
                  return (
                    <span key={`sq-${id}`} className="sq-chip is-squad">
                      <RocketOutlined className="sq-chip__icon" />
                      {opt.label}
                      <button
                        className="sq-chip__remove"
                        onClick={() =>
                          setSelectedSquadIds(selectedSquadIds.filter(x => x !== id))
                        }
                        aria-label={`Remove ${opt.label}`}
                      >
                        <CloseOutlined />
                      </button>
                    </span>
                  );
                })}
                {selectedUserIds.map(id => {
                  const opt = userOptions.find(o => o.value === id);
                  if (!opt) return null;
                  return (
                    <span key={`u-${id}`} className="sq-chip is-user">
                      <UserOutlined className="sq-chip__icon" />
                      {opt.label}
                      <button
                        className="sq-chip__remove"
                        onClick={() =>
                          setSelectedUserIds(selectedUserIds.filter(x => x !== id))
                        }
                        aria-label={`Remove ${opt.label}`}
                      >
                        <CloseOutlined />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="squad-content-area">
            {loading ? (
              viewMode === 'grid' ? (
                renderSkeletonGrid()
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <LoadingSpinner message="Fetching squads..." />
                </div>
              )
            ) : filteredSquads.length === 0 ? (
              <div className="squad-empty">
                <div className="squad-empty__illustration">
                  {hasActiveFilter ? <SearchOutlined /> : <InboxOutlined />}
                </div>
                <div className="squad-empty__title">
                  {hasActiveFilter ? 'No squads match your filters' : 'No squads yet'}
                </div>
                <div className="squad-empty__sub">
                  {hasActiveFilter
                    ? 'Try adjusting your search or filters to find what you’re looking for.'
                    : 'Create your first squad to start organising teams, leadership, and project allocations.'}
                </div>
                {!hasActiveFilter && canCreateSquad && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={handleCreate}
                    className="sq-primary-btn sq-primary-btn--lg"
                  >
                    Create First Squad
                  </Button>
                )}
                {hasActiveFilter && (
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleClearFilters}
                    className="sq-secondary-btn"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <Row gutter={[20, 20]} className="squad-grid">
                {filteredSquads.map(squad => (
                  <Col key={squad.id} xs={24} sm={12} lg={12} xl={8} xxl={6}>
                    <SquadCard
                      squad={squad}
                      onOpen={handleOpen}
                      onManage={handleManage}
                      onRefresh={fetchSquads}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <Card
                bordered={false}
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '1px solid var(--border-slate-200)',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                }}
                styles={{ body: { padding: 0 } }}
              >
                <Table
                  dataSource={filteredSquads}
                  columns={columns}
                  rowKey="id"
                  style={{ background: 'var(--bg-pure-white)' }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    position: ['bottomRight'],
                  }}
                  className="premium-table"
                />
              </Card>
            )}
          </div>

          <SquadDrawer
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            onSuccess={fetchSquads}
            initialData={currentSquad}
          />

          <SquadViewDrawer
            visible={viewDrawerVisible}
            onClose={() => setViewDrawerVisible(false)}
            squad={currentSquad}
            onManage={handleManage}
          />
        </div>
      </div>
    </MainLayout>
  );
}
