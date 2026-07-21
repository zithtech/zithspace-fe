
"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
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
  Dropdown,
  Skeleton,
  Segmented,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
  RollbackOutlined,
  CloseOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  FileDoneOutlined,
  FolderOutlined,
  StarFilled,
  CloseCircleOutlined,
  EllipsisOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  CaretDownOutlined
} from '@ant-design/icons';
import { Squad, SquadService } from '@/services/squadService';
import SquadCard from '@/components/squad/SquadCard';
import SquadDrawer from '@/components/squad/SquadDrawer';
import SquadViewDrawer from '@/components/squad/SquadViewDrawer';
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { usePermission } from '@/hooks/usePermission';
import { useActivitySource } from '@/hooks/useActivitySource';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import dayjs from 'dayjs';
import { Menu } from 'lucide-react';
import ConfirmDialog from "@/components/common/ConfirmDialog";

const { Text } = Typography;

const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96;
  const h = 34;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const initialsOf = (name: string) =>
  (name || '—')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const avatarColorFor = (str: string): string => {
  const COLORS = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};

const CARD_ACCENTS: [string, string][] = [
  ['#3b82f6', '#2563eb'], // blue
  ['#10b981', '#059669'], // green
  ['#8b5cf6', '#7c3aed'], // purple
  ['#f59e0b', '#d97706'], // orange
];
const accentFor = (key: string): [string, string] => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
};

export default function SquadManagement() {
  console.log("Forcing HMR reload for SquadManagement");
  useActivitySource({ section: "WORK", module: "Squad", page: "SquadView" });
  const { user, isLoading: authLoading } = useAuth();
  const { canReadSquad, canCreateSquad, canUpdateSquad, canDeleteSquad } = usePermission();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(false);
  const [squads, setSquads] = useState<Squad[]>([]);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [savedView, setSavedView] = useState<string>('all');
  const [view, setView] = useState<'list' | 'grid'>('grid');

  const [selectedSquadIds, setSelectedSquadIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  const searchRef = useRef<any>(null);

  useEffect(() => {
    if (user && canReadSquad) {
      fetchSquads();
    }
  }, [user, canReadSquad]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  const handleRefresh = () => {
    fetchSquads();
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

  const handleArchive = async (squad: Squad) => {
    try {
      setLoading(true);
      await SquadService.archiveSquad(squad.id, !squad.isArchived);
      message.success(`Squad ${squad.isArchived ? 'unarchived' : 'archived'} successfully`);
      fetchSquads();
    } catch (error) {
      console.error(error);
      message.error('Failed to update squad archive status');
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering ---
  const filteredSquads = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return squads.filter((s) => {
      // Saved View Filter
      if (savedView === 'active' && (!s.squadStatus || s.isArchived)) return false;
      if (savedView === 'inactive' && (s.squadStatus || s.isArchived)) return false;
      if (savedView === 'archived' && !s.isArchived) return false;

      // Status Filter
      if (statusFilter === 'active' && (!s.squadStatus || s.isArchived)) return false;
      if (statusFilter === 'inactive' && (s.squadStatus || s.isArchived)) return false;
      if (statusFilter === 'archived' && !s.isArchived) return false;

      // Search Text
      const matchesSearch = !q ||
        s.squadName.toLowerCase().includes(q) ||
        s.squadCode.toLowerCase().includes(q);

      // Selected Squad IDs
      const matchesSquadIds = selectedSquadIds.length === 0 || selectedSquadIds.includes(s.id);

      // Selected User IDs
      const matchesUserIds = selectedUserIds.length === 0 || s.squadMembers?.some(m => selectedUserIds.includes(m.squadMemberId));

      return matchesSearch && matchesSquadIds && matchesUserIds;
    });
  }, [squads, searchText, savedView, statusFilter, selectedSquadIds, selectedUserIds]);

  useEffect(() => { setTablePage(1); }, [savedView, searchText, statusFilter, selectedSquadIds, selectedUserIds]);

  const statsData = useMemo(() => {
    const totalSquads = squads.length;
    const activeSquads = squads.filter(s => s.squadStatus && !s.isArchived).length;
    const inactiveSquads = squads.filter(s => !s.squadStatus && !s.isArchived).length;
    const archivedSquads = squads.filter(s => s.isArchived).length;
    let totalMembers = 0;
    let heads = 0;
    let subHeads = 0;
    let members = 0;
    squads.forEach(s => {
      s.squadMembers?.forEach(m => {
        totalMembers += 1;
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
      uniqueMembers: totalMembers,
      heads,
      subHeads,
      members,
      leadership: heads + subHeads,
    };
  }, [squads]);

  // Build real sparkline trends from squad createdAt dates (6-month cumulative growth)
  const statCells = useMemo(() => {
    const now = new Date();
    const MONTHS = 6;
    // Generate month boundaries (start of each month, oldest first)
    const bucketStarts: Date[] = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      bucketStarts.push(d);
    }

    // For each squad, determine which bucket it falls into (by createdAt)
    const totalByMonth = new Array(MONTHS).fill(0);
    const activeByMonth = new Array(MONTHS).fill(0);
    const leadersByMonth = new Array(MONTHS).fill(0);
    const contributorsByMonth = new Array(MONTHS).fill(0);

    squads.forEach(s => {
      const created = new Date(s.createdAt);
      const memberCount = s.squadMembers?.length || 0;
      const headCount = s.squadMembers?.filter(m => m.memberType === 'HEAD').length || 0;
      const subHeadCount = s.squadMembers?.filter(m => m.memberType === 'SUB_HEAD').length || 0;
      const isActive = s.squadStatus && !s.isArchived;

      // Find which bucket this squad was created in (or before)
      for (let b = 0; b < MONTHS; b++) {
        const bucketEnd = b < MONTHS - 1 ? bucketStarts[b + 1] : new Date(now.getFullYear(), now.getMonth() + 1, 1);
        if (created < bucketEnd) {
          // This squad exists from this bucket onward (cumulative)
          for (let j = b; j < MONTHS; j++) {
            totalByMonth[j] += 1;
            if (isActive) activeByMonth[j] += 1;
            leadersByMonth[j] += headCount + subHeadCount;
            contributorsByMonth[j] += memberCount;
          }
          break;
        }
      }
    });

    // Ensure at least the current value shows even if all squads predate the window
    if (totalByMonth[MONTHS - 1] === 0 && squads.length > 0) {
      totalByMonth[MONTHS - 1] = statsData.totalSquads;
      activeByMonth[MONTHS - 1] = statsData.activeSquads;
      leadersByMonth[MONTHS - 1] = statsData.leadership;
      contributorsByMonth[MONTHS - 1] = statsData.uniqueMembers;
    }

    return [
      { key: 'total', title: 'Total Squads', value: statsData.totalSquads, suffix: '', icon: <RocketOutlined />, color: '#3b82f6', tint: 'rgba(59,130,246,0.10)', trend: totalByMonth, delta: 0 },
      { key: 'members', title: 'Total Contributors', value: statsData.uniqueMembers, suffix: '', icon: <TeamOutlined />, color: '#10b981', tint: 'rgba(16,185,129,0.10)', trend: contributorsByMonth, delta: 0 },
      { key: 'active', title: 'Active Squads', value: statsData.activeSquads, suffix: '', icon: <StarOutlined />, color: '#10b981', tint: 'rgba(16,185,129,0.10)', trend: activeByMonth, delta: 0 },
      { key: 'leaders', title: 'Leadership', value: statsData.leadership, suffix: '', icon: <CrownOutlined />, color: '#3b82f6', tint: 'rgba(59,130,246,0.10)', trend: leadersByMonth, delta: 0 },
    ];
  }, [squads, statsData]);

  const viewCounts = useMemo(() => ({
    all: statsData.totalSquads,
    active: statsData.activeSquads,
    inactive: statsData.inactiveSquads,
    archived: statsData.archivedSquads,
  }), [statsData]);

  const views = [
    { key: 'all', label: 'All Squads', icon: <FolderOutlined />, color: '#3B82F6' },
    { key: 'active', label: 'Active', icon: <StarFilled />, color: '#10B981' },
    { key: 'inactive', label: 'Inactive', icon: <ClockCircleOutlined />, color: '#64748B' },
    { key: 'archived', label: 'Archived', icon: <InboxOutlined />, color: '#3B82F6' },
  ];

  const squadOptions = useMemo(
    () => squads.map(s => ({ value: s.id, label: s.squadName, code: s.squadCode })).sort((a, b) => a.label.localeCompare(b.label)),
    [squads]
  );

  const userOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string; sub?: string; avatarUrl?: string }>();
    squads.forEach(s => {
      s.squadMembers?.forEach(m => {
        if (!map.has(m.squadMemberId)) {
          map.set(m.squadMemberId, {
            value: m.squadMemberId,
            label: m.member.name,
            sub: m.member.workEmail,
            avatarUrl: m.member.avatarUrl || m.member.avatar,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label)).map(u => ({
      value: u.value,
      label: u.label,
      description: u.sub,
      badge: (
        <Avatar
          src={u.avatarUrl || undefined}
          size={20}
          style={{
            backgroundColor: u.avatarUrl ? 'transparent' : avatarColorFor(u.label || ''),
            color: '#fff',
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          {initialsOf(u.label)}
        </Avatar>
      )
    }));
  }, [squads]);

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' },
  ];

  const hasActiveFilters = searchText.trim().length > 0 || statusFilter !== 'all' || selectedSquadIds.length > 0 || selectedUserIds.length > 0;

  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setSelectedSquadIds([]);
    setSelectedUserIds([]);
  };

  const actionMenu = (squad: Squad) => ({
    className: 'sq-action-pop',
    items: [
      { key: 'view', label: <div className="sq-menu-item"><span className="sq-menu-ic" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.12)' }}><EyeOutlined /></span><span className="sq-menu-text"><span className="sq-menu-title">View details</span><span className="sq-menu-desc">Open squad details</span></span></div> },
      { key: 'edit', disabled: !canUpdateSquad, label: <div className="sq-menu-item"><span className="sq-menu-ic" style={{ color: '#64748b', background: 'rgba(100,116,139,0.12)' }}><EditOutlined /></span><span className="sq-menu-text"><span className="sq-menu-title">Manage</span><span className="sq-menu-desc">Edit squad configuration</span></span></div> },
      { key: 'archive', disabled: !canUpdateSquad, label: <div className="sq-menu-item"><span className="sq-menu-ic" style={{ color: '#4f46e5', background: 'rgba(79,70,229,0.12)' }}>{squad.isArchived ? <RollbackOutlined /> : <InboxOutlined />}</span><span className="sq-menu-text"><span className="sq-menu-title">{squad.isArchived ? 'Unarchive' : 'Archive'}</span><span className="sq-menu-desc">{squad.isArchived ? 'Restore squad to active list' : 'Archive this squad'}</span></span></div> },
      { type: 'divider' as const },
      { 
        key: 'delete', 
        danger: true, 
        disabled: !canDeleteSquad, 
        label: (
          <ConfirmDialog
            tone="danger"
            title="Delete Squad"
            description={`Are you sure you want to delete "${squad.squadName}"? This action cannot be undone.`}
            confirmText="Delete"
            onConfirm={() => handleDelete(squad.id)}
            placement="left"
          >
            <div className="sq-menu-item" style={{ cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
              <span className="sq-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}><DeleteOutlined /></span>
              <span className="sq-menu-text"><span className="sq-menu-title">Delete</span><span className="sq-menu-desc">Remove this squad</span></span>
            </div>
          </ConfirmDialog>
        ) 
      },
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent.stopPropagation();
      if (key === 'view') handleOpen(squad);
      else if (key === 'edit') handleManage(squad);
      else if (key === 'archive') handleArchive(squad);
      // delete is handled by ConfirmDialog
    },
  });

  const columns: ColumnsType<any> = [
    {
      title: 'SQUAD',
      dataIndex: 'squadName',
      key: 'squadName',
      render: (text: string, record: Squad) => {
        const initials = text.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div className="sq-name-cell">
            <div className="sq-name-icon">
              {initials || <TeamOutlined style={{ fontSize: 12 }} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="sq-name-title">{text}</span>
              <span style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{record.squadCode}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'STATUS',
      dataIndex: 'squadStatus',
      key: 'status',
      width: 140,
      render: (status: boolean, record: Squad) => {
        const isArchived = record.isArchived;
        const meta = isArchived
          ? { label: 'Archived', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', ring: 'rgba(59,130,246,0.25)' }
          : status
            ? { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.10)', ring: 'rgba(16,185,129,0.25)' }
            : { label: 'Inactive', color: '#64748b', bg: 'rgba(100,116,139,0.10)', ring: 'rgba(100,116,139,0.25)' };

        return (
          <span className="sq-vis-pill" style={{ color: meta.color, background: meta.bg, borderColor: meta.ring }}>
            <span className="sq-vis-dot" style={{ background: meta.color }} />
            {meta.label}
          </span>
        );
      },
    },
    {
      title: 'COMPOSITION',
      key: 'composition',
      width: 270,
      render: (record: Squad) => {
        const all = record.squadMembers || [];
        const heads = all.filter(m => m.memberType === 'HEAD').length;
        const subHeads = all.filter(m => m.memberType === 'SUB_HEAD').length;
        const members = all.filter(m => m.memberType === 'MEMBER').length;
        const total = heads + subHeads + members;
        if (total === 0) return <Text className="sq-muted">—</Text>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', height: 6, width: 80, borderRadius: 3, overflow: 'hidden', background: 'var(--bg-slate-100)' }}>
              {heads > 0 && <Tooltip title={`${heads} Heads`}><div style={{ width: `${(heads / total) * 100}%`, background: '#10b981' }} /></Tooltip>}
              {subHeads > 0 && <Tooltip title={`${subHeads} Sub-Heads`}><div style={{ width: `${(subHeads / total) * 100}%`, background: '#60a5fa' }} /></Tooltip>}
              {members > 0 && <Tooltip title={`${members} Members`}><div style={{ width: `${(members / total) * 100}%`, background: '#3b82f6' }} /></Tooltip>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-slate-500)', display: 'flex', gap: 8, whiteSpace: 'nowrap' }}>
              <span><b>{heads}</b> HEADS</span>
              <span><b>{subHeads}</b> SUB-HEADS</span>
              <span><b>{members}</b> MEMBERS</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'TEAM',
      key: 'team',
      width: 200,
      render: (record: Squad) => {
        const all = record.squadMembers || [];
        const ordered = [...all.filter(m => m.memberType === 'HEAD'), ...all.filter(m => m.memberType === 'SUB_HEAD'), ...all.filter(m => m.memberType === 'MEMBER')];
        if (ordered.length === 0) return <Text className="sq-muted">—</Text>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar.Group max={{ count: 4 }} size={24}>
              {ordered.map(m => (
                <Tooltip key={m.id} title={`${m.member.name} · ${m.memberType}`}>
                  <Avatar style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 10, fontWeight: 700 }}>
                    {initialsOf(m.member.name)}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
            <span style={{ fontSize: 11, color: 'var(--text-slate-400)' }}><UserOutlined /> {ordered.length}</span>
          </div>
        );
      },
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center' as const,
      width: 72,
      fixed: 'right' as const,
      render: (_: any, record: Squad) => (
        <Dropdown menu={actionMenu(record)} overlayClassName="sq-action-pop" trigger={['click']} placement="bottomRight">
          <Button type="text" className="sq-icon-btn" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

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

  const total = filteredSquads.length;
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pagedSquads = filteredSquads.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  const emptyState = (
    <div className="sq-empty">
      <div className="sq-empty-orb"><InboxOutlined style={{ fontSize: 26 }} /></div>
      <div className="sq-empty-title">No squads found</div>
      <div className="sq-empty-sub">Start by creating your first squad.</div>
      {canCreateSquad && (
        <Button type="primary" icon={<PlusOutlined />} className="sq-btn-primary" onClick={handleCreate} style={{ marginTop: 14 }}>
          Create Squad
        </Button>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="sq-shell">
        {/* ============================ SIDEBAR ============================ */}
        {mobileSidebarOpen && <div className="sq-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />}
        <aside className={`sq-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
          <div className="sq-sidebar-top">
            <div className="sq-side-head">
              <div className="sq-side-logo"><TeamOutlined style={{ color: isDark ? '#ffffff' : '#3b82f6' }} /></div>
              <div className="sq-side-head-text">
                <div className="sq-side-title">Squads</div>
                <div className="sq-side-subtitle">Management · Teams</div>
              </div>
            </div>

            {canCreateSquad && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="sq-create-btn"
                onClick={handleCreate}
                block
              >
                Create Squad
              </Button>
            )}
          </div>

          <div className="sq-side-scroll">
            <div className="sq-side-section-label">Views</div>
            <div className="sq-side-list">
              {views.map((v) => {
                const active = savedView === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    className={`sq-view-item ${active ? 'is-active' : ''}`}
                    onClick={() => setSavedView(v.key)}
                  >
                    <span className="sq-view-icon" style={{ color: active ? v.color : 'var(--text-slate-400)' }}>{v.icon}</span>
                    <span className="sq-view-label">{v.label}</span>
                    <span className="sq-view-count">{(viewCounts as any)[v.key]}</span>
                  </button>
                );
              })}
            </div>

            <div className="sq-side-section-label">Filters</div>
            <div className="sq-side-filters" style={{ padding: '0 8px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SearchableDropdown
                mode="multiple"
                className="sq-side-sd"
                placeholder="Select squads"
                searchPlaceholder="Search squads..."
                itemNoun="squads"
                value={selectedSquadIds}
                onChange={(v) => setSelectedSquadIds(v || [])}
                options={squadOptions}
                width="100%"
              />
              <SearchableDropdown
                mode="multiple"
                className="sq-side-sd"
                placeholder="Filter by Members"
                searchPlaceholder="Search members..."
                itemNoun="members"
                value={selectedUserIds}
                onChange={(v) => setSelectedUserIds(v || [])}
                options={userOptions}
                width="100%"
              />
              {hasActiveFilters && (
                <button type="button" className="sq-clear-filters" onClick={clearFilters}>
                  <CloseCircleOutlined /> Clear filters
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="sq-main">
          <div className="sq-topbar">
            <div className="sq-topbar-left" style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 8, maxWidth: 520 }}>
              <Button
                className="sq-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
              <div className="sq-search-wrap" style={{ maxWidth: 'none' }}>
                <SearchOutlined className="sq-search-icon" />
                <input
                  ref={searchRef}
                  className="sq-search"
                  placeholder="Search squads by name or code…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />

              </div>
            </div>

            <div className="sq-topbar-meta">
              <span className="sq-meta-item"><span className="sq-pulse" /><strong>{squads.length}</strong> squads</span>
              <span className="sq-meta-dot">·</span>
              <span className="sq-meta-item"><strong>{statsData.uniqueMembers}</strong> members</span>
            </div>

            <div className="sq-topbar-actions">
              <div className="sq-segmented">
                <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
              </div>
              <Tooltip title="Refresh">
                <button type="button" className="sq-ghost-btn" onClick={handleRefresh}><ReloadOutlined spin={loading} /></button>
              </Tooltip>
            </div>
          </div>

          <div className="sq-divider" />

          {/* Stat cards */}
          <div className="sq-stats">
            {statCells.map((s) => (
              <div key={s.key} className="sq-stat-card">
                <div className="sq-stat-top">
                  <div className="sq-stat-left">
                    <span className="sq-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                    <span className="sq-stat-label">
                      {s.title}
                    </span>
                  </div>
                </div>
                <div className="sq-stat-bottom" style={{ alignItems: 'center' }}>
                  <div className="sq-stat-value-wrap" style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="sq-stat-value">{s.value}{s.suffix}</span>
                      {s.key === 'total' && <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>(Across all teams)</span>}
                      {s.key === 'leaders' && <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>({statsData.heads} Heads · {statsData.subHeads} Sub-Heads)</span>}
                    </div>
                  </div>
                  {s.key !== 'leaders' && <div className="sq-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>}
                </div>
              </div>
            ))}
          </div>

          {/* Table / grid */}
          <div className="sq-body">
            {view === 'list' ? (
              <div className="sq-table-wrap">
                <Table
                  columns={columns}
                  dataSource={pagedSquads}
                  loading={loading}
                  rowKey="id"
                  size="small"
                  className="sq-table"
                  scroll={{ x: 'max-content' }}
                  rowSelection={{ selectedRowKeys: selectedKeys, onChange: (keys) => setSelectedKeys(keys), columnWidth: 40 }}
                  pagination={false}
                  locale={{ emptyText: emptyState }}
                  onRow={(record) => ({
                    onClick: (e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest('.ant-checkbox-wrapper, .ant-table-selection-column, button, input, .ant-select, .ant-dropdown-trigger')) return;
                      handleOpen(record);
                    },
                    className: 'sq-row',
                  })}
                />
              </div>
            ) : (
              <div className="sq-grid">
                {loading ? (
                  <div className="sq-grid-loading">Loading…</div>
                ) : filteredSquads.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1' }}>{emptyState}</div>
                ) : (
                  filteredSquads.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize).map((s) => {
                    const isArchived = s.isArchived;
                    const meta = isArchived
                      ? { label: 'Archived', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' }
                      : s.squadStatus
                        ? { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.10)' }
                        : { label: 'Inactive', color: '#64748b', bg: 'rgba(100,116,139,0.10)' };

                    const title = s.squadName;
                    const accent = accentFor(s.id || s.squadName);

                    const all = s.squadMembers || [];
                    const headsArr = all.filter(m => m.memberType === 'HEAD');
                    const subHeadsArr = all.filter(m => m.memberType === 'SUB_HEAD');
                    const membersArr = all.filter(m => m.memberType === 'MEMBER');
                    const heads = headsArr.length;
                    const subHeads = subHeadsArr.length;
                    const members = membersArr.length;
                    const ordered = [...headsArr, ...subHeadsArr, ...membersArr];

                    return (
                      <div key={s.id} className="sc-card" onClick={() => handleOpen(s)}>
                        <div className="sc-top">
                          <div className="sc-avatar" style={{ background: '#3B82F6' }}>
                            {initialsOf(title)}
                          </div>
                          <div className="sc-identity-body">
                            <div className="sc-title">{title}</div>
                            <div className="sc-client-line">
                              <span className="sc-client-key">Code:</span>
                              <span className="sc-client-val">{s.squadCode}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="sc-status-tag" style={{ color: meta.color, background: meta.bg }}>
                              {meta.label}
                            </span>
                            <Dropdown menu={actionMenu(s)} overlayClassName="sq-action-pop" trigger={['click']} placement="bottomRight">
                              <button type="button" className="sc-actions" onClick={(e) => e.stopPropagation()}>
                                <EllipsisOutlined />
                              </button>
                            </Dropdown>
                          </div>
                        </div>

                        <div className="sc-foot">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-slate-50)', overflowX: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-slate-500)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <CrownOutlined style={{ fontSize: 12 }} /> Heads
                                <span style={{ border: '1px solid var(--border-slate-200)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: 'var(--bg-pure-white)', color: 'var(--text-slate-700)' }}>{heads}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-slate-500)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <StarOutlined style={{ fontSize: 12 }} /> Sub-Heads
                                <span style={{ border: '1px solid var(--border-slate-200)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: 'var(--bg-pure-white)', color: 'var(--text-slate-700)' }}>{subHeads}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-slate-500)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <UserOutlined style={{ fontSize: 12 }} /> Members
                                <span style={{ border: '1px solid var(--border-slate-200)', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: 'var(--bg-pure-white)', color: 'var(--text-slate-700)' }}>{members}</span>
                              </div>
                            </div>
                            {ordered.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
                                <Avatar.Group max={{ count: 3 }} size={26}>
                                  {ordered.map(m => (
                                    <Tooltip key={m.id} title={`${m.member.name} · ${m.memberType}`}>
                                      <Avatar style={{ background: 'var(--bg-slate-200)', color: 'var(--text-slate-700)', fontSize: 10.5, fontWeight: 700, border: '2px solid var(--bg-slate-50)' }}>
                                        {initialsOf(m.member.name)}
                                      </Avatar>
                                    </Tooltip>
                                  ))}
                                </Avatar.Group>
                              </div>
                            )}
                          </div>
                          <div className="sc-foot-row" style={{ justifyContent: 'center', gap: '32px', padding: '10px 12px', background: 'var(--bg-slate-50)', borderTop: '1px solid var(--border-slate-200)', borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}>
                            <button type="button" className="sc-view-btn" onClick={(e) => { e.stopPropagation(); handleOpen(s); }}>
                              <EyeOutlined /> View Details
                            </button>
                            <div style={{ width: 1, height: 14, background: 'var(--border-slate-300, #cbd5e1)' }} />
                            <button type="button" className="sc-manage-btn" onClick={(e) => { e.stopPropagation(); handleManage(s); }} disabled={!canUpdateSquad}>
                              <EditOutlined /> Manage
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="sq-footer sq-footer--sticky">
              <div className="sq-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
                {selectedKeys.length > 0 && <span className="sq-footer-sel"> · {selectedKeys.length} selected</span>}
              </div>
              <div className="sq-pager">
                <button type="button" className="sq-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
                  <button key={p} type="button" className={`sq-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
                ))}
                <button type="button" className="sq-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
                <Select
                  className="sq-pagesize"
                  value={tablePageSize}
                  onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
                  options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
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

      <style jsx global>{`
          .sq-shell {
            display: flex;
            margin: 0 -16px;
            height: calc(100vh - 64px);
            background: var(--bg-pure-white);
            overflow: hidden;
          }

          /* ---------------- Sidebar ---------------- */
          .sq-sidebar {
            width: 240px;
            flex-shrink: 0;
            border-right: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 0;
            height: calc(100vh - 64px);
          }
          .sq-sidebar-top {
            padding: 14px 14px 12px 18px;
          }
          .sq-side-head {
            display: flex; align-items: center; gap: 10px; padding-bottom: 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .sq-side-logo {
            flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          }
          .sq-side-logo .anticon { font-size: 24px !important; }
          .sq-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .sq-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .sq-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .sq-create-btn {
            height: 32px !important; border-radius: 6px !important; font-weight: 600 !important; font-size: 12.5px !important;
            background: #3B82F6 !important;
            border: none !important; box-shadow: none !important;
            margin-bottom: 4px;
          }
          .sq-create-btn:hover { background: #2563EB !important; }
          .sq-create-btn .anticon { font-size: 12px !important; }
          .sq-side-scroll {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px 10px 6px 16px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .sq-side-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
          .sq-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .sq-side-scroll > .sq-side-section-label:first-child { margin-top: 6px; }
          .sq-side-list { display: flex; flex-direction: column; gap: 1px; }
          .sq-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left;
          }
          .sq-view-item:hover { background: var(--bg-slate-50); }
          .sq-view-item.is-active { background: var(--bg-blue-50); }
          .sq-view-item.is-active .sq-view-label { color: var(--text-slate-900); font-weight: 600; }
          .sq-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
          .sq-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          .sq-view-count {
            font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
            min-width: 18px; text-align: right;
          }
          .sq-view-item.is-active .sq-view-count {
            color: #3B82F6; font-weight: 700;
            background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
          }
          .sq-side-filters { display: flex; flex-direction: column; gap: 7px; padding: 0; }
          .sq-side-sd { border-radius: 6px !important; }
          .sq-side-select .ant-select-selector,
          .sq-side-range.ant-picker {
            border-radius: 6px !important; border-color: var(--border-slate-200) !important;
            background: var(--bg-pure-white) !important;
          }
          .sq-side-select { width: 100%; }
          .sq-side-range .ant-picker-input > input { font-size: 12.5px; }
          .sq-clear-filters {
            display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
            background: none; border: none; cursor: pointer; padding: 3px;
            font-size: 12px; font-weight: 600; color: #ef4444;
          }
          .sq-side-recents { display: flex; flex-direction: column; }
          .sq-recents-empty { font-size: 11px; color: var(--text-slate-400); padding: 2px 8px; }
          .sq-recent-item {
            display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
            padding: 5px 8px; border: none; background: transparent; cursor: pointer;
            border-bottom: 1px solid var(--border-slate-100);
            transition: background .12s ease;
          }
          .sq-recent-item:last-child { border-bottom: none; }
          .sq-recent-item:hover { background: var(--bg-slate-50); }
          .sq-recent-icon { font-size: 12px; color: #3B82F6; flex-shrink: 0; }
          .sq-recent-body { display: flex; flex-direction: column; min-width: 0; gap: 0; }
          .sq-recent-title { font-size: 11.5px; font-weight: 600; color: var(--text-slate-900); line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .sq-recent-sub { font-size: 9.5px; color: var(--text-slate-400); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .sq-trash {
            display: flex; align-items: center; gap: 10px; flex-shrink: 0; text-align: left;
            margin: 0 -14px; padding: 12px 22px;
            border-top: 1px solid var(--border-slate-200);
            background: transparent; color: var(--text-slate-600); font-size: 13px; font-weight: 500; cursor: pointer;
          }
          .sq-trash .anticon { font-size: 15px; }
          .sq-trash:hover { color: #ef4444; }

          /* ---------------- Main ---------------- */
          .sq-main { flex: 1; min-width: 0; padding: 8px 18px 0; display: flex; flex-direction: column; height: 100%; }
          .sq-body { flex: 1; min-height: 0; overflow-y: auto; }
          .sq-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
          .sq-search-wrap {
            position: relative; flex: 1; max-width: 520px; display: flex; align-items: center;
            height: 32px; border-radius: 8px; background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200); padding: 0 10px;
          }
          .sq-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
          .sq-search-icon { color: var(--text-slate-400); font-size: 14px; }
          .sq-search {
            flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
            font-size: 13px; color: var(--text-slate-900);
          }
          .sq-search::placeholder { color: var(--text-slate-400); }
          .sq-kbd {
            font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
            background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
            border-radius: 5px; padding: 1px 6px;
          }
          .sq-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
          .sq-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
          .sq-meta-dot { color: var(--text-slate-300); }
          .sq-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
          .sq-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
          .sq-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
          .sq-segmented button {
            width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
            color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
          }
          .sq-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
          .sq-ghost-btn {
            width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
            display: inline-flex; align-items: center; justify-content: center;
          }
          .sq-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }

          .sq-divider { height: 1px; background: var(--border-slate-200); margin: 0 -18px 10px; }

          /* Stat cards */
          .sq-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
          .sq-stat-card {
            background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
            border-radius: 0; padding: 12px 14px; min-height: 92px;
            display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
            box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          }
          .sq-stat-top { display: flex; align-items: center; justify-content: space-between; }
          .sq-stat-left { display: flex; align-items: center; gap: 8px; }
          .sq-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
          .sq-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
          .sq-stat-delta {
            display: inline-flex; align-items: center; gap: 2px; font-size: 10.5px; font-weight: 700;
            color: #10b981; background: rgba(16,185,129,0.10); border-radius: 6px; padding: 1px 6px;
          }
          .sq-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
          .sq-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
          .sq-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
          .sq-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
          .sq-stat-spark { opacity: 0.95; }

          /* Table */
          .sq-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
          .sq-table,
          .sq-table.ant-table-wrapper,
          .sq-table .ant-table,
          .sq-table .ant-table-wrapper,
          .sq-table .ant-table-container,
          .sq-table .ant-table-content,
          .sq-table .ant-table-header,
          .sq-table .ant-table-body {
            background: transparent !important;
            border-radius: 0px !important;
          }
          .sq-table .ant-table-thead > tr > th, .sq-table .ant-table-thead > tr > td {
            background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
            font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em !important;
            text-transform: uppercase !important; color: var(--text-slate-400) !important; padding: 6px 10px !important;
            white-space: nowrap !important;
            border-radius: 0 !important;
            border-start-start-radius: 0 !important;
            border-start-end-radius: 0 !important;
          }
          .sq-table .ant-table-thead > tr > th::before { display: none !important; }
          [data-theme='dark'] .sq-table .ant-table-thead > tr > th,
          [data-theme='dark'] .sq-table .ant-table-thead > tr > td {
            background: #161B22 !important;
            color: #94A3B8 !important;
            border-bottom-color: #374151 !important;
          }
          .sq-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
          .sq-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
          .sq-table .ant-table-tbody > tr.sq-row:hover > td { background: var(--bg-slate-50) !important; }
          .sq-table .ant-table-tbody > tr.sq-row { cursor: pointer; }
          .sq-table .ant-table-selection-column { padding-inline: 6px !important; }

          .sq-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
          .sq-star { background: none; border: none; cursor: pointer; padding: 0; color: var(--text-slate-300); line-height: 0; flex-shrink: 0; }
          .sq-star:hover, .sq-star.is-on { color: #3B82F6; }
          .sq-star .anticon { font-size: 13px !important; }
          .sq-name-icon {
            width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center; color: #3B82F6;
            background: var(--bg-blue-50);
          }
          .sq-name-icon .anticon { font-size: 12px !important; }
          .sq-name-title { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          .sq-tag {
            display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px;
            border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap;
          }
          .sq-tag--blue { background: var(--bg-blue-50); color: #3B82F6; }
          .sq-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
          .sq-add { font-size: 11.5px; color: var(--text-slate-400); cursor: default; }
          .sq-muted { color: var(--text-slate-400); }

          .sq-maillink {
            display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer;
            font-size: 11.5px; font-weight: 700; color: #3B82F6; padding: 0;
          }
          .sq-maillink.is-sent { color: #10b981; }

          .sq-creator { display: flex; align-items: center; gap: 6px; }
          .sq-creator-name { font-size: 11.5px; color: var(--text-slate-700); white-space: nowrap; }
          .sq-date { display: flex; flex-direction: column; line-height: 1.25; }
          .sq-date-main { font-size: 11px; font-weight: 500; color: var(--text-slate-700); }
          .sq-date-sub { font-size: 9.5px; color: var(--text-slate-400); }

          .sq-vis-pill {
            display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
            border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
          }
          .sq-vis-dot { width: 6px; height: 6px; border-radius: 50%; }
          .sq-status-opt { display: inline-flex; align-items: center; gap: 8px; }
          .sq-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
          .sq-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

          /* Footer + pager */
          .sq-footer {
            display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
            padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
          }
          .sq-footer--sticky {
            position: sticky; bottom: 0; z-index: 30; margin: 0 -18px 0; padding: 8px 18px;
            background: var(--bg-pure-white);
            box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          }
          .sq-footer-info { font-size: 12px; color: var(--text-slate-500); }
          .sq-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
          .sq-footer-sel { color: #3B82F6; font-weight: 600; }
          .sq-pager { display: flex; align-items: center; gap: 3px; }
          .sq-pager-btn, .sq-pager-num {
            min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          }
          .sq-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .sq-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
          .sq-pagesize { margin-left: 5px; }
          .sq-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

          /* Empty + grid */
          .sq-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
          .sq-empty-orb {
            width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
            background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
          }
          .sq-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
          .sq-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }
          .sq-btn-primary {
            background: #3B82F6 !important; border: none !important;
            border-radius: 0 !important; font-weight: 600 !important;
          }
          .sq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .sq-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

          .sc-card {
            border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
            cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
            transition: box-shadow .15s ease, border-color .15s ease;
          }
          .sc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

          .sc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
          .sc-avatar {
            width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-weight: 800; font-size: 12px;
          }
          .sc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
          .sc-actions {
            flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
            background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
          }
          .sc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
          .sc-title {
            font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          }
          .sc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
          .sc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
          .sc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          .sc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
          .sc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
          .sc-foot-row + .sc-foot-row { border-top: 1px solid var(--border-slate-200); }
          .sc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
          .sc-foot-key { font-size: 9px; font-weight: 600; color: var(--text-slate-400); }
          .sc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
          .sc-timeline-btn { background: none; border: none; cursor: pointer; padding: 0; color: #3b82f6; }
          .sc-timeline-btn .sc-foot-key { color: #3b82f6; }
          .sc-timeline-btn .anticon { font-size: 12px; }
          .sc-timeline-btn:hover { text-decoration: underline; }
          .sc-timeline-view { font-size: 10.5px; font-weight: 700; color: #3b82f6; }
          .sc-view-btn {
            background: none; border: none; cursor: pointer; padding: 0;
            color: #3B82F6; font-weight: 700; font-size: 11.5px;
          }
          .sc-view-btn .anticon { font-size: 12px; }
          .sc-view-btn:hover { text-decoration: underline; }
          .sc-manage-btn {
            background: none; border: none; cursor: pointer; padding: 0;
            color: #64748b; font-weight: 700; font-size: 11.5px;
          }
          .sc-manage-btn[disabled] { opacity: 0.5; cursor: not-allowed; text-decoration: none !important; }
          .sc-manage-btn .anticon { font-size: 12px; }
          .sc-manage-btn:hover:not([disabled]) { text-decoration: underline; color: #475569; }

          /* Premium action dropdown */
          .sq-action-pop .ant-dropdown-menu {
            padding: 6px; border-radius: 0; min-width: 236px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          }
          .sq-action-pop .ant-dropdown-menu::-webkit-scrollbar { display: none !important; }
          .sq-action-pop,
          .sq-action-pop * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
          .sq-action-pop ::-webkit-scrollbar { display: none !important; }
          .sq-action-pop .ant-dropdown-menu-item {
            padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
            transition: background .12s ease;
          }
          .sq-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
          .sq-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
          .sq-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
          .sq-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
          .sq-menu-ic {
            width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
          }
          .sq-menu-text { display: flex; flex-direction: column; min-width: 0; }
          .sq-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
          .sq-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
          .sq-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
          .sq-action-pop .ant-dropdown-menu-item-danger .sq-menu-title { color: #ef4444; }
          .sq-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
          .sq-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }
          .sc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 18px; padding: 0 6px; border-radius: 4px; font-size: 9.5px; font-weight: 700; }
          .sc-status-tag .anticon { font-size: 9px; }
          .sc-mail-val { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; }

          @media (max-width: 1100px) {
            .sq-stats { grid-template-columns: repeat(2, 1fr); }
          }
          
          .sq-mobile-menu-btn { display: none !important; }
          
          @media (max-width: 820px) {
            .sq-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
            .sq-main { height: auto; overflow: visible; }
            .sq-body { overflow: visible; }
            
            .sq-mobile-overlay {
              position: fixed; top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
            }
            .sq-sidebar {
              position: fixed; top: 0; left: -320px; bottom: 0;
              z-index: 1100; height: 100%; max-height: none;
              border-right: 1px solid var(--border-slate-200); border-bottom: 0;
              display: flex; flex-direction: column; align-items: stretch;
              background: var(--bg-pure-white); width: 280px; box-sizing: border-box;
              transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: 4px 0 24px rgba(0,0,0,0.08);
            }
            .sq-sidebar.is-open { left: 0; }
            .sq-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
            .sq-topbar-left { max-width: none !important; width: 100%; }
            .sq-topbar-actions { width: 100%; justify-content: flex-start; }
            .sq-topbar-meta { display: none; }
            .sq-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; color: var(--text-slate-700); }
          }

          @media (max-width: 700px) {
            .sq-grid { grid-template-columns: 1fr; }
            .sq-stats { grid-template-columns: 1fr; }
          }
        
          /* ===================== Dark Theme Overrides ===================== */
          [data-theme='dark'] .sq-shell,
          [data-theme='dark'] .sq-main { background: #0B0F1A !important; }

          [data-theme='dark'] .sq-sidebar {
            background: #0B0F1A !important;
            border-right-color: #374151 !important;
          }
          [data-theme='dark'] .sq-side-head {
            border-bottom-color: #374151 !important;
          }
          [data-theme='dark'] .sq-side-title { color: #F1F5F9 !important; }
          [data-theme='dark'] .sq-side-subtitle { color: #64748B !important; }
          [data-theme='dark'] .sq-side-section-label { color: #64748B !important; }

          [data-theme='dark'] .sq-view-item:hover { background: rgba(255,255,255,0.05) !important; }
          [data-theme='dark'] .sq-view-item.is-active { background: rgba(59,130,246,0.15) !important; }
          [data-theme='dark'] .sq-view-label { color: #94A3B8 !important; }
          [data-theme='dark'] .sq-view-item.is-active .sq-view-label { color: #F1F5F9 !important; }
          [data-theme='dark'] .sq-view-count { color: #64748B !important; }

          [data-theme='dark'] .sq-side-select .ant-select-selector,
          [data-theme='dark'] .sq-side-sd .sd-trigger {
            background: #0B0F1A !important;
            border-color: #374151 !important;
            color: #F1F5F9 !important;
          }
          [data-theme='dark'] .sq-side-select .ant-select-arrow { color: #94A3B8 !important; }

          [data-theme='dark'] .sq-topbar { background: #0B0F1A !important; }
          [data-theme='dark'] .sq-search-wrap {
            border-color: #374151 !important;
          }
          [data-theme='dark'] .sq-search { color: #F1F5F9 !important; }
          [data-theme='dark'] .sq-search::placeholder { color: #64748B !important; }
          [data-theme='dark'] .sq-kbd {
            background: #161B22 !important;
            border-color: #374151 !important;
            color: #64748B !important;
          }
          [data-theme='dark'] .sq-divider { background: #374151 !important; }

          /* Stat cards */
          [data-theme='dark'] .sq-stat-card {
            background: #0B0F1A !important;
            border-color: #374151 !important;
            box-shadow: none !important;
          }
          [data-theme='dark'] .sq-stat-label { color: #94A3B8 !important; }
          [data-theme='dark'] .sq-stat-value { color: #F1F5F9 !important; }

          /* Table */
          [data-theme='dark'] .sq-table-wrap {
            background: #0B0F1A !important;
            border-color: #374151 !important;
          }
          [data-theme='dark'] .sq-table .ant-table-thead > tr > th {
            background: #161B22 !important;
            color: #94A3B8 !important;
            border-bottom-color: #374151 !important;
          }
          [data-theme='dark'] .sq-table .ant-table-tbody > tr > td {
            background: #0B0F1A !important;
            color: #F1F5F9 !important;
            border-bottom-color: #1F2937 !important;
          }
          [data-theme='dark'] .sq-table .ant-table-tbody > tr.sq-row:hover > td {
            background: #161B22 !important;
          }
          [data-theme='dark'] .sq-name-title { color: #F1F5F9 !important; }

          /* Grid cards */
          [data-theme='dark'] .sc-card {
            background: #0B0F1A !important;
            border-color: #374151 !important;
          }
          [data-theme='dark'] .sc-card:hover {
            border-color: #4B5563 !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
          }
          [data-theme='dark'] .sc-title { color: #F1F5F9 !important; }
          [data-theme='dark'] .sc-client-val { color: #94A3B8 !important; }
          [data-theme='dark'] .sc-foot {
            background: #161B22 !important;
            border-top-color: #374151 !important;
          }
          [data-theme='dark'] .sc-foot-row { border-top-color: #374151 !important; }

          /* Footer */
          [data-theme='dark'] .sq-footer--sticky {
            background: #0B0F1A !important;
            border-top-color: #374151 !important;
            box-shadow: 0 -4px 14px rgba(0,0,0,0.3) !important;
          }
          [data-theme='dark'] .sq-footer-info { color: #94A3B8 !important; }
          [data-theme='dark'] .sq-footer-info strong { color: #F1F5F9 !important; }
          [data-theme='dark'] .sq-pager-btn,
          [data-theme='dark'] .sq-pager-num {
            background: #161B22 !important;
            border-color: #374151 !important;
            color: #94A3B8 !important;
          }
          [data-theme='dark'] .sq-pager-num.is-active {
            background: #3B82F6 !important;
            border-color: #3B82F6 !important;
            color: #fff !important;
          }
          [data-theme='dark'] .sq-pagesize .ant-select-selector {
            background: #161B22 !important;
            border-color: #374151 !important;
            color: #94A3B8 !important;
          }

          /* Segmented view switcher */
          [data-theme='dark'] .sq-segmented {
            background: #161B22 !important;
            border-color: #374151 !important;
          }
          [data-theme='dark'] .sq-segmented button { color: #64748B !important; }
          [data-theme='dark'] .sq-segmented button.is-active {
            background: rgba(59,130,246,0.15) !important;
            color: #3B82F6 !important;
          }
          [data-theme='dark'] .sq-ghost-btn {
            background: #161B22 !important;
            border-color: #374151 !important;
            color: #94A3B8 !important;
          }
          [data-theme='dark'] .sq-topbar-meta { color: #64748B !important; }
          [data-theme='dark'] .sq-topbar-meta strong { color: #94A3B8 !important; }

        `}</style>
    </MainLayout>
  );
}
