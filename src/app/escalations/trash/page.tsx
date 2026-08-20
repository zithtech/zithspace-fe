'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Table,
  Button,
  Typography,
  Tooltip,
  Popconfirm,
  Avatar,
  Empty,
  Tag,
  App,
  Skeleton,
  Badge,
  Select,
  Dropdown,
} from 'antd';
import {
  DeleteOutlined,
  UndoOutlined,
  SearchOutlined,
  ReloadOutlined,
  AlertOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  FolderOutlined,
  UserOutlined,
  FileTextOutlined,
  FireOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usePermission } from '@/hooks/usePermission';
import { EscalationServiceV2 } from '@/services/escalationServiceV2';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Menu } from 'lucide-react';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

dayjs.extend(relativeTime);

const { Text } = Typography;
const BLUE_PRIMARY = 'var(--premium-blue)';

const CARD_ACCENTS: [string, string][] = [
  ['#3b82f6', '#2563eb'], // blue
  ['#10b981', '#059669'], // green
  ['#8b5cf6', '#7c3aed'], // purple
  ['#f59e0b', '#d97706'], // orange
  ['#ef4444', '#dc2626'], // red
];

const accentFor = (key: string): [string, string] => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
};

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

export default function EscalationTrashPage() {
  console.log("Forcing HMR reload for EscalationTrashPage");
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { canReadEscalation, canDeleteEscalation, canUpdateEscalation } = usePermission();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [activeEscalations, setActiveEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // View mode
  const [view, setView] = useState<'list' | 'grid'>('list');

  // Pagination states
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [totalEscalations, setTotalEscalations] = useState(0);
  const [totalActive, setTotalActive] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { message, modal } = App.useApp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const fetchTrashedEscalations = async () => {
    setLoading(true);
    try {
      const limit = tablePageSize;
      const offset = (tablePage - 1) * tablePageSize;

      const [activeData, trashData] = await Promise.all([
        EscalationServiceV2.getAllEscalations(limit, offset),
        EscalationServiceV2.getTrashEscalations(limit, offset),
      ]);
      setActiveEscalations(activeData?.data || []);
      setTotalActive(activeData?.total || 0);

      setEscalations(trashData?.data || []);
      setTotalEscalations(trashData?.total || 0);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Failed to fetch trashed escalations.');
    } finally {
      setLoading(false);
    }
  };

  // Route Guard
  useEffect(() => {
    if (!authLoading && user && !canReadEscalation) {
      router.push('/dashboard');
    }
  }, [user, authLoading, canReadEscalation, router]);

  useEffect(() => {
    if (canReadEscalation) {
      fetchTrashedEscalations();
    }
  }, [canReadEscalation, tablePage, tablePageSize]);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await EscalationServiceV2.restoreEscalation(id);
      message.success('Escalation restored successfully');
      setEscalations((prev) => prev.filter((e) => e.id !== id));
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch (error) {
      console.error('Failed to restore escalation:', error);
      message.error('Failed to restore escalation.');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await EscalationServiceV2.permanentDeleteEscalation(id);
      message.success('Escalation permanently deleted');
      setEscalations((prev) => prev.filter((e) => e.id !== id));
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch (error) {
      console.error('Failed to permanently delete escalation:', error);
      message.error('Failed to permanently delete escalation.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptying(true);
    try {
      await EscalationServiceV2.emptyTrash();
      message.success('All trashed escalations have been permanently deleted');
      setEscalations([]);
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Failed to empty trash:', error);
      message.error('Failed to empty trash.');
    } finally {
      setEmptying(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      const ids = selectedRowKeys as string[];
      await EscalationServiceV2.bulkRestore(ids);
      message.success(`${ids.length} escalations restored successfully`);
      setEscalations((prev) => prev.filter((e) => !ids.includes(e.id)));
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Failed to bulk restore:', error);
      message.error('Failed to restore selected escalations.');
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      const ids = selectedRowKeys as string[];
      await EscalationServiceV2.bulkPermanentDelete(ids);
      message.success(`${ids.length} escalations permanently deleted`);
      setEscalations((prev) => prev.filter((e) => !ids.includes(e.id)));
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      message.error('Failed to permanently delete selected escalations.');
    }
  };

  // Filter list
  const filteredEscalations = useMemo(() => {
    if (!searchQuery) return escalations;
    const q = searchQuery.toLowerCase();
    return escalations.filter((e) => {
      const subject = e.subject || e.short_summary || '';
      const catName = e.category?.name || e.category_name || '';
      const projName = e.project?.name || e.project_name || '';
      const members = e.targetMembers || [];
      return (
        subject.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q) ||
        projName.toLowerCase().includes(q) ||
        members.some((m: any) => (m.user?.name || '').toLowerCase().includes(q))
      );
    });
  }, [escalations, searchQuery]);

  useEffect(() => {
    setTablePage(1);
  }, [searchQuery]);

  const isViewLoading = loading || authLoading || isRefreshing;

  // Stats computation
  const statsData = useMemo(() => {
    const total = totalEscalations || escalations.length;
    const highPriority = escalations.filter((e) => {
      const weight = e.priority_weight || e.priority?.weight || 0;
      const name = (e.priority_name || e.priority?.name || '').toLowerCase();
      return weight >= 80 || name === 'high' || name === 'urgent';
    }).length;
    const pending = escalations.filter((e) => e.escalationStatus?.isDefault || e.status?.toLowerCase() === 'pending' || e.status_name?.toLowerCase() === 'pending').length;
    const resolved = escalations.filter((e) => e.escalationStatus?.isFinal || e.status?.toLowerCase() === 'resolved' || e.status_name?.toLowerCase() === 'resolved').length;
    return { total, highPriority, pending, resolved };
  }, [escalations]);

  const statCells = useMemo(() => {
    const deletedAtTrend = (cond: (e: any) => boolean) => {
      const now = new Date();
      const MONTHS = 6;
      const trend = new Array(MONTHS).fill(0);
      const bucketStarts: Date[] = [];
      for (let i = MONTHS - 1; i >= 0; i--) {
        bucketStarts.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
      }
      escalations.filter(cond).forEach((e) => {
        const deleted = new Date(e.deleted_at || e.updated_at || e.created_at);
        for (let b = 0; b < MONTHS; b++) {
          const bucketEnd = b < MONTHS - 1 ? bucketStarts[b + 1] : new Date(now.getFullYear(), now.getMonth() + 1, 1);
          if (deleted < bucketEnd) {
            for (let j = b; j < MONTHS; j++) {
              trend[j] += 1;
            }
            break;
          }
        }
      });
      const count = escalations.filter(cond).length;
      if (trend[MONTHS - 1] === 0 && count > 0) {
        trend[MONTHS - 1] = count;
      }
      return trend;
    };

    return [
      { key: 'total', title: 'Trashed Escalations', subtitle: 'Pending purge', value: statsData.total, suffix: '', icon: <DeleteOutlined />, color: '#ef4444', tint: 'rgba(239,68,68,0.10)', trend: deletedAtTrend(() => true) },
      { key: 'high', title: 'High Priority', value: statsData.highPriority, suffix: '', icon: <FireOutlined />, color: '#ef4444', tint: 'rgba(239,68,68,0.10)', trend: deletedAtTrend((e) => { const weight = e.priority_weight || e.priority?.weight || 0; const name = (e.priority_name || e.priority?.name || '').toLowerCase(); return weight >= 80 || name === 'high' || name === 'urgent'; }) },
      { key: 'pending', title: 'Pending Reviews', value: statsData.pending, suffix: '', icon: <ClockCircleOutlined />, color: '#f59e0b', tint: 'rgba(245,158,11,0.10)', trend: deletedAtTrend((e) => e.escalationStatus?.isDefault || e.status?.toLowerCase() === 'pending' || e.status_name?.toLowerCase() === 'pending') },
      { key: 'resolved', title: 'Total Resolved', value: statsData.resolved, suffix: '', icon: <CheckCircleOutlined />, color: '#10b981', tint: 'rgba(16,185,129,0.10)', trend: deletedAtTrend((e) => e.escalationStatus?.isFinal || e.status?.toLowerCase() === 'resolved' || e.status_name?.toLowerCase() === 'resolved') },
    ];
  }, [escalations, statsData]);

  const viewCounts = useMemo(() => ({
    all: activeEscalations.length,
    'my-involvement': activeEscalations.filter((e) => (e.targetMembers || []).some((m: any) => m.user?.id === user?.id)).length,
    'raised-by-me': activeEscalations.filter((e) => (e.createdBy?.id || e.created_by_id) === user?.id).length,
    trash: escalations.length,
  }), [activeEscalations, escalations, user]);

  const viewsList = [
    { key: 'all', label: 'All Escalations', icon: <FolderOutlined />, color: '#3B82F6' },
    { key: 'my-involvement', label: 'My Involvement', icon: <UserOutlined />, color: '#64748B' },
    { key: 'raised-by-me', label: 'Raised by Me', icon: <FileTextOutlined />, color: '#10B981' },
    { key: 'trash', label: 'Trash', icon: <DeleteOutlined />, color: '#ef4444' },
  ];

  // Action Menu for Cards/Ellipsis dropdown
  const actionMenu = (record: any) => ({
    className: 'es-action-pop',
    items: [
      {
        key: 'restore',
        disabled: !canUpdateEscalation,
        label: (
          <div className="es-menu-item">
            <span className="es-menu-ic" style={{ color: '#10b981', background: 'rgba(16,185,129,0.12)' }}>
              <UndoOutlined />
            </span>
            <span className="es-menu-text">
              <span className="es-menu-title">Restore</span>
              <span className="es-menu-desc">Restore escalation</span>
            </span>
          </div>
        ),
      },
      { type: 'divider' as const },
      {
        key: 'permanent_delete',
        danger: true,
        disabled: !canDeleteEscalation,
        label: (
          <ConfirmDialog
            tone="danger"
            icon={<DeleteOutlined style={{ fontSize: 15 }} />}
            title="Delete Forever"
            description="Are you sure you want to permanently delete this escalation? This action cannot be undone."
            confirmText="Delete Forever"
            cancelText="Cancel"
            placement="left"
            onConfirm={() => handlePermanentDelete(record.id)}
          >
            <div
              style={{
                margin: '-5px -12px',
                padding: '5px 12px',
                width: 'calc(100% + 24px)',
                height: '100%'
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="es-menu-item">
                <span className="es-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}>
                  <DeleteOutlined />
                </span>
                <span className="es-menu-text">
                  <span className="es-menu-title">Delete Forever</span>
                  <span className="es-menu-desc">Irreversible</span>
                </span>
              </div>
            </div>
          </ConfirmDialog>
        ),
      },
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent.stopPropagation();
      if (key === 'restore') {
        handleRestore(record.id);
      }
    },
  });

  // Column definitions
  const columns = [
    {
      title: 'SUBJECT & CATEGORY',
      key: 'escalation',
      render: (record: any) => (
        <div className="es-name-cell">
          <div className="es-name-icon" style={{ color: '#ff4d4f', background: 'rgba(255,77,79,0.1)' }}>
            <AlertOutlined style={{ fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <span className="es-name-title" style={{ fontWeight: 600 }}>
              {record.subject || record.short_summary || 'No Subject'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-slate-400)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(record.category_name || record.category?.name || 'General').toUpperCase()}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'TARGET TEAM MEMBERS',
      dataIndex: 'targetMembers',
      key: 'targetMembers',
      width: 220,
      render: (members: any[], record: any) => {
        const list = members || record.targetMembers || [];
        if (list.length === 0) return <Text className="es-muted">—</Text>;
        const firstMember = list[0]?.user;
        const othersCount = list.length - 1;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 10, fontWeight: 700, width: 24, height: 24, lineHeight: '24px', flexShrink: 0 }}>
              {initialsOf(firstMember?.name || 'U')}
            </Avatar>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-slate-700)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {firstMember?.name || 'User'}
            </span>
            {othersCount > 0 && (
              <Tooltip title={list.slice(1).map((m: any) => m.user?.name).join(', ')}>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-slate-500)', background: 'var(--bg-slate-100)', padding: '2px 6px', borderRadius: 10, flexShrink: 0, cursor: 'default' }}>
                  +{othersCount}
                </span>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: 'PRIORITY',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: any, record: any) => (
        <Tag color={record.priority_color || priority?.color || 'blue'} style={{ borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
          {(record.priority_name || priority?.name || 'MEDIUM').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'RAISED BY',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 160,
      render: (user: any) => {
        if (!user?.name) return <Text className="es-muted">System</Text>;
        return (
          <div className="es-creator">
            <Avatar size={20} src={user.avatarUrl || user.avatar} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 9, fontWeight: 700 }}>
              {initialsOf(user.name)}
            </Avatar>
            <span className="es-creator-name">{user.name}</span>
          </div>
        );
      },
    },
    {
      title: 'DELETED AT',
      dataIndex: 'deleted_at',
      key: 'deletedAt',
      width: 150,
      render: (date: string) => {
        const d = dayjs(date);
        return (
          <div className="es-date">
            <span className="es-date-main">{d.isValid() ? d.format('MMM D, YYYY') : '—'}</span>
            <span className="es-date-sub">{d.isValid() ? d.format('h:mm A') : ''}</span>
          </div>
        );
      },
    },
    {
      title: 'STATUS',
      key: 'status',
      width: 120,
      render: () => (
        <span className="es-vis-pill" style={{ color: '#ff4d4f', background: 'rgba(255,77,79,0.1)', borderColor: 'rgba(255,77,79,0.2)' }}>
          <span className="es-vis-dot" style={{ background: '#ff4d4f' }} />
          DELETED
        </span>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right' as const,
      width: 120,
      fixed: 'right' as const,
      render: (record: any) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdateEscalation && (
            <Tooltip title="Restore Escalation">
              <Button
                type="text"
                className="es-icon-btn"
                icon={<UndoOutlined style={{ color: '#52c41a' }} />}
                loading={restoringId === record.id}
                onClick={() => handleRestore(record.id)}
              />
            </Tooltip>
          )}
          {canDeleteEscalation && (
            <ConfirmDialog
              tone="danger"
              icon={<ExclamationCircleOutlined style={{ fontSize: 16 }} />}
              title="Delete Forever"
              description="This action cannot be undone. All associated data will be lost."
              confirmText="Delete Forever"
              cancelText="Cancel"
              placement="topRight"
              onConfirm={() => handlePermanentDelete(record.id)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Permanent Delete">
                  <Button
                    type="text"
                    className="es-icon-btn"
                    icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
                    loading={deletingId === record.id}
                  />
                </Tooltip>
              </div>
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  const total = totalEscalations || filteredEscalations.length;
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pagedEscalations = filteredEscalations;

  const emptyState = (
    <div className="es-empty">
      <div className="es-empty-orb" style={{ background: 'var(--bg-slate-100)', color: 'var(--text-slate-400)' }}><DeleteOutlined style={{ fontSize: 26 }} /></div>
      <div className="es-empty-title">No escalations found in trash</div>
      <div className="es-empty-sub">Deleted escalations will appear here. You can restore or permanently delete them.</div>
    </div>
  );

  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <ZukvoLoader size="lg" fullscreen='viewport' />
        </div>
      </MainLayout>
    );
  }

  if (!canReadEscalation) return null;

  return (
    <MainLayout>
      <div className="es-shell">
        {/* ============================ SIDEBAR ============================ */}
        {mobileSidebarOpen && <div className="es-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />}
        <aside className={`es-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
          <div className="es-side-head">
            <div className="es-side-logo"><AlertOutlined style={{ color: isDark ? '#ffffff' : '#ff4d4f', fontSize: 24 }} /></div>
            <div className="es-side-head-text">
              <div className="es-side-title">Escalations</div>
              <div className="es-side-subtitle">Trash Repository</div>
            </div>
          </div>

          {canDeleteEscalation && (
            <ConfirmDialog
              tone="danger"
              icon={<DeleteOutlined style={{ fontSize: 16 }} />}
              title="Empty Trash"
              description="This will permanently delete all escalations currently in the trash. This action cannot be undone."
              confirmText="Empty All"
              cancelText="Cancel"
              placement="bottom"
              disabled={filteredEscalations.length === 0 || isViewLoading}
              onConfirm={handleEmptyTrash}
            >
              <Button
                icon={<DeleteOutlined />}
                loading={emptying}
                className="es-empty-trash-btn"
                disabled={filteredEscalations.length === 0 || isViewLoading}
                block
              >
                Empty Trash
              </Button>
            </ConfirmDialog>
          )}

          <div className="es-side-scroll">
            <div className="es-side-section-label">Views</div>
            <div className="es-side-list">
              {viewsList.map((v) => {
                const active = v.key === 'trash';
                return (
                  <button
                    key={v.key}
                    type="button"
                    className={`es-view-item ${active ? 'is-active' : ''}`}
                    onClick={() => {
                      if (v.key !== 'trash') {
                        router.push(`/escalations?view=${v.key}`);
                      }
                    }}
                  >
                    <span className="es-view-icon" style={{ color: active ? v.color : 'var(--text-slate-400)' }}>{v.icon}</span>
                    <span className="es-view-label">{v.label}</span>
                    <span className="es-view-count">{(viewCounts as any)[v.key]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="es-main">
          <div className="es-topbar">
            <div className="es-topbar-left" style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 8, maxWidth: 520 }}>
              <Button
                className="es-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
              <div className="es-search-wrap" style={{ maxWidth: 'none' }}>
                <SearchOutlined className="es-search-icon" />
                <input
                  ref={searchInputRef}
                  className="es-search"
                  placeholder="Search trashed subject, target, project…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="es-topbar-meta">
              <span className="es-meta-item"><span className="es-pulse" style={{ background: '#ff4d4f', boxShadow: '0 0 0 3px rgba(255,77,79,0.18)' }} /><strong>{escalations.length}</strong> in trash</span>
            </div>

            <div className="es-topbar-actions">
              <div className="es-segmented">
                <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
              </div>
              <Tooltip title="Refresh">
                <button type="button" className="es-ghost-btn" onClick={async () => {
                  setIsRefreshing(true);
                  await fetchTrashedEscalations();
                  setIsRefreshing(false);
                  message.success('Trash view refreshed');
                }}><ReloadOutlined spin={isRefreshing} /></button>
              </Tooltip>
            </div>
          </div>

          <div className="es-divider" />

          {/* Stat cards */}
          <div className="es-stats">
            {statCells.map((s) => (
              <div key={s.key} className="es-stat-card">
                <div className="es-stat-top">
                  <div className="es-stat-left">
                    <span className="es-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="es-stat-label">{s.title}</span>
                      {(s as any).subtitle && <span style={{ fontSize: 10, color: 'var(--text-slate-400)', marginTop: 1 }}>{(s as any).subtitle}</span>}
                    </div>
                  </div>
                </div>
                <div className="es-stat-bottom">
                  <div className="es-stat-value-wrap">
                    <span className="es-stat-value">{s.value}{s.suffix}</span>
                  </div>
                  <div className="es-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Table / Grid Wrap */}
          <div className="es-body">
            {selectedRowKeys.length > 0 && (
              <div className="saas-bulk-actions">
                <div className="saas-bulk-content">
                  <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#1890ff' }} />
                  <Text strong style={{ marginLeft: 8 }}>Escalations Selected</Text>
                </div>
                <div className="saas-bulk-buttons">
                  {canUpdateEscalation && (
                    <Button
                      type="text"
                      size="small"
                      icon={<UndoOutlined />}
                      onClick={handleBulkRestore}
                      className="saas-bulk-btn restore"
                    >
                      Restore
                    </Button>
                  )}
                  {canDeleteEscalation && (
                    <ConfirmDialog
                      tone="danger"
                      icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                      title="Purge Selected"
                      description={`This will permanently delete the ${selectedRowKeys.length} selected escalations. This action cannot be undone.`}
                      confirmText="Purge Selected"
                      cancelText="Cancel"
                      placement="bottomRight"
                      onConfirm={handleBulkPermanentDelete}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        className="saas-bulk-btn purge"
                      >
                        Purge
                      </Button>
                    </ConfirmDialog>
                  )}
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => setSelectedRowKeys([])}
                    className="saas-bulk-btn cancel"
                  />
                </div>
              </div>
            )}

            <ZukvoLoadingOverlay loading={isViewLoading} message="">
              {view === 'list' ? (
                <div className="es-table-wrap">
                  <Table
                    rowSelection={isViewLoading ? undefined : {
                      selectedRowKeys,
                      onChange: (keys) => setSelectedRowKeys(keys),
                      columnWidth: 40,
                    }}
                    dataSource={isViewLoading ? Array(5).fill({}) : pagedEscalations}
                    columns={columns.map((col) => ({
                      ...col,
                      render: (text: any, record: any, index: number) => {
                        if (isViewLoading) {
                          return <Skeleton.Input active size="small" block style={{ height: 20 }} />;
                        }
                        return col.render ? (col.render as any)(text, record, index) : text;
                      },
                    }))}
                    rowKey={(record: any) => record.id || Math.random()}
                    pagination={false}
                    className="es-table"
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: isViewLoading ? <div style={{ minHeight: 400 }} /> : emptyState }}
                  />
                </div>
              ) : (
                <div className="es-grid">
                  {isViewLoading ? (
                    <div style={{ gridColumn: '1 / -1', minHeight: 400 }} />
                  ) : filteredEscalations.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1' }}>{emptyState}</div>
                  ) : (
                    pagedEscalations.map((record) => {
                      const title = record.subject || record.short_summary || 'No Subject';
                      const list = record.targetMembers || [];
                      const statusName = 'DELETED';
                      const statusColor = '#ff4d4f';
                      const catName = record.category?.name || record.category_name || 'General';
                      const isHighProd = catName.toLowerCase() === 'high production issue';

                      return (
                        <div
                          key={record.id}
                          className="ec-card dh-card group transition-all flex flex-col relative cursor-pointer"
                          style={{
                            borderRadius: 0,
                            border: '1px solid var(--border-slate-200)',
                            background: 'var(--bg-pure-white)',
                            overflow: 'hidden',
                            minHeight: 110,
                          }}
                        >
                          {/* ROW 1: Header */}
                          <div className="flex-1 flex flex-col p-3 min-w-0" style={{ borderBottom: '1px solid var(--border-slate-100)' }}>
                            <div className="flex items-start gap-2 min-w-0 pr-[68px]">
                              <div
                                className="flex items-center justify-center shrink-0"
                                style={{ width: 28, height: 28, borderRadius: 8, background: isHighProd ? '#fef2f2' : 'var(--bg-blue-50)', color: isHighProd ? '#ef4444' : '#3b82f6' }}
                              >
                                <AlertOutlined style={{ fontSize: 14 }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="m-0 font-semibold text-[13px] leading-tight truncate" style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }} title={title}>
                                  {title}
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 10.5, color: 'var(--text-slate-500)' }}>
                                  <span>ID: {record.id?.split('-')[0].toUpperCase()}</span>
                                  <span>•</span>
                                  <span>Category: {catName}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-auto pt-2 flex items-center justify-between gap-2" style={{ position: 'absolute', top: 12, right: 12 }}>
                              <Dropdown menu={actionMenu(record)} overlayClassName="es-action-pop" trigger={['click']} placement="bottomRight">
                                <button type="button" onClick={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-slate-400)', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }} className="hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                  <EllipsisOutlined style={{ fontSize: 16 }} />
                                </button>
                              </Dropdown>
                            </div>
                          </div>

                          {/* ROW 2: Raised By & Deleted Date */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid var(--border-slate-100)', fontSize: 11, color: 'var(--text-slate-500)', whiteSpace: 'nowrap', overflowX: 'auto', background: 'var(--bg-slate-50)' }} className="scrollbar-hide">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>Raised by</span>
                              <Avatar size={16} src={record.createdBy?.avatarUrl || record.createdBy?.avatar} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 9, fontWeight: 700 }}>
                                {initialsOf(record.createdBy?.name || 'System')}
                              </Avatar>
                              <span style={{ fontWeight: 500, color: 'var(--text-slate-700)' }}>{record.createdBy?.name || 'System'}</span>
                            </div>
                            <div style={{ width: 1, height: 12, background: 'var(--border-slate-200)' }} />
                            <div>Deleted {dayjs(record.deleted_at).format('MMM D, YYYY - hh:mm A')}</div>
                          </div>

                          {/* ROW 3: Footer Stats */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', fontSize: 11, color: 'var(--text-slate-500)', whiteSpace: 'nowrap', overflowX: 'auto', background: 'var(--bg-slate-50)' }} className="scrollbar-hide">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>Status:</span>
                              <span className="es-vis-pill" style={{ color: statusColor, background: `${statusColor}1A`, borderColor: `${statusColor}40`, height: 20, fontSize: 10.5, padding: '0 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span className="es-vis-dot" style={{ background: statusColor, width: 6, height: 6, borderRadius: '50%' }} />
                                {statusName}
                              </span>
                            </div>
                            <div style={{ width: 1, height: 12, background: 'var(--border-slate-200)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>Priority:</span>
                              <Tag color={record.priority_color || record.priority?.color || 'blue'} style={{ borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
                                {(record.priority_name || record.priority?.name || 'MEDIUM').toUpperCase()}
                              </Tag>
                            </div>
                            <div style={{ width: 1, height: 12, background: 'var(--border-slate-200)' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>Target Members:</span>
                              {list.length > 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  {list.map((m: any, idx: number) => (
                                    <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <Avatar size={16} style={{ background: '#e2e8f0', color: '#475569', fontSize: 9.5, fontWeight: 700, border: '1px solid #fff', flexShrink: 0 }}>
                                        {initialsOf(m.user?.name)}
                                      </Avatar>
                                      <span style={{ fontWeight: 600, color: 'var(--text-slate-700)', fontSize: 11 }}>{m.user?.name || '—'}</span>
                                      {idx < list.length - 1 && <span style={{ color: 'var(--border-slate-300)', marginLeft: 2 }}>,</span>}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ fontWeight: 600, color: 'var(--text-slate-700)' }}>—</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </ZukvoLoadingOverlay>
          </div>

          {/* Sticky footer custom pagination */}
          {total > 0 && (
            <div className="es-footer es-footer--sticky">
              <div className="es-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
                {selectedRowKeys.length > 0 && <span className="es-footer-sel"> · {selectedRowKeys.length} selected</span>}
              </div>
              <div className="es-pager">
                <button type="button" className="es-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
                  <button key={p} type="button" className={`es-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
                ))}
                <button type="button" className="es-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
                <Select
                  className="es-pagesize"
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

      <style jsx global>{`
        .es-shell {
          display: flex;
          margin: 0 -16px;
          height: calc(100vh - 64px);
          background:
            radial-gradient(1200px 400px at 0% -100px, rgba(59, 130, 246, 0.04), transparent 60%),
            radial-gradient(900px 360px at 100% -120px, rgba(139, 92, 246, 0.04), transparent 55%),
            var(--bg-pure-white);
          overflow: hidden;
        }

        /* ---------------- Sidebar ---------------- */
        .es-sidebar {
          width: 240px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0;
          position: sticky;
          top: 0;
          height: calc(100vh - 64px);
        }
        .es-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .es-side-logo {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .es-side-logo .anticon { font-size: 24px !important; color: var(--text-slate-900) !important; }
        .es-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .es-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .es-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .es-create-btn {
          height: 36px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 4px;
        }
        .es-empty-trash-btn {
          height: 36px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          font-size: 12.5px !important;
          background: #fff2f0 !important;
          color: #ff4d4f !important;
          border: none !important;
          box-shadow: none !important;
          margin-bottom: 4px;
        }
        .es-empty-trash-btn:hover {
          background: #fff2f0 !important;
          color: #ff4d4f !important;
        }
        .es-empty-trash-btn:disabled {
          background: #f5f5f5 !important;
          color: rgba(0, 0, 0, 0.25) !important;
          border: 1px solid #d9d9d9 !important;
        }
        .es-empty-trash-btn .anticon { font-size: 12px !important; }
        .es-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
        .es-side-scroll::-webkit-scrollbar { width: 5px; }
        .es-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
        .es-side-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
        }
        .es-side-scroll > .es-side-section-label:first-child { margin-top: 6px; }
        .es-side-list { display: flex; flex-direction: column; gap: 1px; }
        .es-view-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
          cursor: pointer; transition: background .12s ease; text-align: left;
        }
        .es-view-item:hover { background: var(--bg-slate-50); }
        .es-view-item.is-active { background: var(--bg-blue-50); }
        .es-view-item.is-active .es-view-label { color: var(--text-slate-900); font-weight: 600; }
        .es-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
        .es-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .es-view-count {
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
          min-width: 18px; text-align: right;
        }
        .es-view-item.is-active .es-view-count {
          color: #ff4d4f; font-weight: 700;
          background: rgba(255,77,79,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
        }

        /* ---------------- Main ---------------- */
        .es-main { flex: 1; min-width: 0; padding: 8px 18px 0; display: flex; flex-direction: column; height: 100%; }
        .es-body { flex: 1; min-height: 0; overflow-y: auto; }
        .es-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .es-search-wrap {
          position: relative; flex: 1; max-width: 520px; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .es-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .es-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .es-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900);
        }
        .es-search::placeholder { color: var(--text-slate-400); }
        .es-kbd {
          font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          border-radius: 5px; padding: 1px 6px;
        }
        .es-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
        .es-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        .es-pulse { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 6px; vertical-align: middle; }
        .es-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .es-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .es-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .es-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
        .es-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .es-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }

        .es-divider { height: 1px; background: var(--border-slate-200); margin: 0 -18px 10px; }

        /* Stat cards */
        .es-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .es-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 10px 14px; min-height: 80px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 6px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          transition: none !important;
          transform: none !important;
        }
        .es-stat-card:hover {
          transform: none !important;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04) !important;
          border-color: var(--border-slate-200) !important;
        }
        .es-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .es-stat-left { display: flex; align-items: center; gap: 8px; }
        .es-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .es-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .es-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .es-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .es-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .es-stat-spark { opacity: 0.95; }

        /* Table */
        .es-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .es-table,
        .es-table.ant-table-wrapper,
        .es-table .ant-table,
        .es-table .ant-table-wrapper,
        .es-table .ant-table-container,
        .es-table .ant-table-content,
        .es-table .ant-table-header,
        .es-table .ant-table-body {
          background: transparent !important;
          border-radius: 0px !important;
        }
        .es-table .ant-table-thead > tr > th, .es-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em !important;
          text-transform: uppercase !important; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
        }
        .es-table .ant-table-thead > tr > th::before { display: none !important; }
        .es-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; background: var(--bg-pure-white) !important; }
        .es-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .es-table .ant-table-tbody > tr.es-row:hover > td { background: var(--bg-slate-50) !important; }
        .es-table .ant-table-selection-column { padding-inline: 6px !important; }

        .es-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .es-name-icon {
          width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .es-name-title { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .es-muted { color: var(--text-slate-400); }

        .es-creator { display: flex; align-items: center; gap: 6px; }
        .es-creator-name { font-size: 11.5px; color: var(--text-slate-700); white-space: nowrap; }
        .es-date { display: flex; flex-direction: column; line-height: 1.25; }
        .es-date-main { font-size: 11px; font-weight: 500; color: var(--text-slate-700); }
        .es-date-sub { font-size: 9.5px; color: var(--text-slate-400); }

        .es-vis-pill {
          display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
          border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
        }
        .es-vis-dot { width: 6px; height: 6px; border-radius: 50%; }
        .es-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        .es-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

        /* Footer + pager */
        .es-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
        }
        .es-footer--sticky {
          position: sticky; bottom: 0; z-index: 30; margin: 0 -18px 0; padding: 6px 18px;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
        }
        .es-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .es-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .es-footer-sel { color: #3B82F6; font-weight: 600; }
        .es-pager { display: flex; align-items: center; gap: 3px; }
        .es-pager-btn, .es-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .es-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .es-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .es-pagesize { margin-left: 5px; }
        .es-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Empty state */
        .es-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .es-empty-orb {
          width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .es-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .es-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }

        /* Grid */
        .es-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .es-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .ec-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
        }

        /* Premium action dropdown */
        .es-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 200px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .es-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .es-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .es-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .es-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .es-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .es-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .es-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .es-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .es-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .es-action-pop .ant-dropdown-menu-item-danger .es-menu-title { color: #ef4444; }

        /* Bulk actions */
        .saas-bulk-actions {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0;
          padding: 12px 20px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: var(--premium-shadow);
          animation: slideIn 0.3s ease-out;
        }

        .saas-bulk-content {
          display: flex;
          align-items: center;
        }

        .saas-bulk-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .saas-bulk-btn {
          border-radius: 6px !important;
          font-weight: 500 !important;
          font-size: 13px !important;
          height: 32px !important;
          padding: 4px 12px !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
        }

        .saas-bulk-btn.restore {
          color: #52c41a !important;
        }
        .saas-bulk-btn.restore:hover {
          background: #f6ffed !important;
        }

        .saas-bulk-btn.purge {
          color: #ff4d4f !important;
        }
        .saas-bulk-btn.purge:hover {
          background: #fff1f0 !important;
        }

        .saas-bulk-btn.cancel {
          color: var(--text-slate-400) !important;
        }
        .saas-bulk-btn.cancel:hover {
          background: var(--bg-slate-50) !important;
        }

        [data-theme='dark'] .saas-bulk-actions {
          background: #161B22;
          border-color: #1F2937;
        }
        [data-theme='dark'] .saas-bulk-btn.restore:hover {
          background: rgba(82, 196, 26, 0.1) !important;
        }
        [data-theme='dark'] .saas-bulk-btn.purge:hover {
          background: rgba(255, 77, 79, 0.1) !important;
        }
        [data-theme='dark'] .saas-bulk-btn.cancel:hover {
          background: #1F2937 !important;
        }

        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        [data-theme='dark'] .es-shell {
          background:
            radial-gradient(1200px 400px at 0% -100px, rgba(59, 130, 246, 0.08), transparent 60%),
            radial-gradient(900px 360px at 100% -120px, rgba(139, 92, 246, 0.08), transparent 55%),
            #0B0F1A;
        }
        [data-theme='dark'] .es-sidebar {
          background: #0B0F1A !important;
          border-right-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-side-head {
          border-bottom-color: #1F2937;
        }
        [data-theme='dark'] .es-side-title {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-view-item:hover {
          background: #161B22;
        }
        [data-theme='dark'] .es-view-item.is-active {
          background: rgba(59, 130, 246, 0.15);
        }
        [data-theme='dark'] .es-view-label {
          color: #94A3B8;
        }
        [data-theme='dark'] .es-view-item.is-active .es-view-label {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-search-wrap {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-search {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-ghost-btn {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
          color: #94A3B8;
        }
        [data-theme='dark'] .es-divider {
          background: #1F2937;
        }
        [data-theme='dark'] .es-stat-card {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
          transform: none !important;
        }
        [data-theme='dark'] .es-stat-card:hover {
          border-color: #1F2937 !important;
          box-shadow: none !important;
          transform: none !important;
        }
        [data-theme='dark'] .es-stat-label {
          color: #94A3B8;
        }
        [data-theme='dark'] .es-stat-value {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-table-wrap {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-table .ant-table-thead > tr > th {
          background: #161B22 !important;
          border-bottom-color: #374151 !important;
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .es-table .ant-table-tbody > tr > td {
          background: #0B0F1A !important;
          border-bottom-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-table .ant-table-tbody > tr.es-row:hover > td {
          background: #161B22 !important;
        }
        [data-theme='dark'] .es-name-title {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-creator-name {
          color: #94A3B8;
        }
        [data-theme='dark'] .es-date-main {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-footer--sticky {
          background: #0B0F1A !important;
          border-top-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-footer-info {
          color: #94A3B8;
        }
        [data-theme='dark'] .es-footer-info strong {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-pager-btn, [data-theme='dark'] .es-pager-num {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
          color: #94A3B8;
        }
        [data-theme='dark'] .es-empty-title {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-empty-trash-btn {
          background: transparent !important;
          border: 1px solid #ff4d4f !important;
          color: #ff4d4f !important;
        }
        [data-theme='dark'] .es-empty-trash-btn:hover {
          background: transparent !important;
          color: #ff4d4f !important;
        }
        [data-theme='dark'] .es-empty-trash-btn:disabled {
          background: #1f1f1f !important;
          color: #434343 !important;
          border-color: #434343 !important;
        }
        [data-theme='dark'] .es-segmented {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-segmented button.is-active {
          background: #161B22 !important;
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-action-pop .ant-dropdown-menu {
          background: #161B22;
          border-color: #1F2937;
        }
        [data-theme='dark'] .es-action-pop .ant-dropdown-menu-item:hover {
          background: #1F2937 !important;
        }
        [data-theme='dark'] .es-action-pop .ant-dropdown-menu-item-divider {
          background: #1F2937;
        }
        [data-theme='dark'] .es-menu-title {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-action-pop .ant-dropdown-menu-item-danger:hover {
          background: rgba(239, 68, 68, 0.15) !important;
        }

        .es-mobile-menu-btn { display: none !important; }



        @media (max-width: 1100px) {
          .es-stats { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 820px) {
          .es-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
          .es-main { height: auto; overflow: visible; }
          .es-body { overflow: visible; }

          .es-mobile-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
          }
          .es-sidebar {
            position: fixed; top: 0; left: -320px; bottom: 0;
            z-index: 1100; height: 100%; max-height: none;
            border-right: 1px solid var(--border-slate-200); border-bottom: 0;
            display: flex; flex-direction: column; align-items: stretch;
            background: var(--bg-pure-white); width: 280px; box-sizing: border-box;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 4px 0 24px rgba(0,0,0,0.08);
          }
          .es-sidebar.is-open { left: 0; }
          .es-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
          .es-topbar-left { max-width: none !important; width: 100%; }
          .es-topbar-actions { width: 100%; justify-content: flex-start; }
          .es-topbar-meta { display: none; }
          .es-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; color: var(--text-slate-700); }
        }

        @media (max-width: 700px) {
          .es-grid { grid-template-columns: 1fr; }
          .es-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </MainLayout>
  );
}
