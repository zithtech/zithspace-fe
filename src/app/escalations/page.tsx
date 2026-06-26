"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Input,
  Badge,
  Card,
  Tooltip,
  Avatar,
  Row,
  Col,
  Select,
  Popconfirm,
  App,
  Dropdown,
  Upload
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BugOutlined,
  ProjectOutlined,
  UserOutlined,
  FileTextOutlined,
  HistoryOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
  TagOutlined,
  FireOutlined,
  AppstoreOutlined,
  CloseOutlined,
  FolderOutlined,
  EllipsisOutlined,
  UnorderedListOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  PaperClipOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { Drawer, Divider } from 'antd';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usePermission } from '@/hooks/usePermission';
import { EscalationServiceV2 } from '@/services/escalationServiceV2';
import { EscalationSettingsService } from '@/services/escalationSettings';
import CreateEscalationDrawer from '@/components/escalations/CreateEscalationDrawer';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useActivitySource } from '@/hooks/useActivitySource';
import { History, Menu } from 'lucide-react';
import TransactionHistoryDrawer from '@/components/common/TransactionHistoryDrawer';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const BLUE_PRIMARY = 'var(--premium-blue)';

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

export default function EscalationListPage() {
  useActivitySource({ section: "WORK", module: "Escalations", page: "EscalationList" });
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { canReadEscalation, canCreateEscalation, canUpdateEscalation, canDeleteEscalation, canReadActivityLog } = usePermission();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [savedView, setSavedView] = useState('all');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const [escalations, setEscalations] = useState<any[]>([]);
  const [trashEscalations, setTrashEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscalation, setSelectedEscalation] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempStatus, setTempStatus] = useState<string>('');
  const [statuses, setStatuses] = useState<any[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(15);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // Create drawer
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  // Edit drawer
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  // File Preview Drawer
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const searchRef = useRef<any>(null);
  const { message, modal } = App.useApp();

  const notifyPremium = (type: 'success' | 'error', title: string, description: string) => {
    if (type === 'success') {
      message.success(`${title} - ${description}`);
    } else {
      message.error(`${title} - ${description}`);
    }
  };

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const [escData, trashData, statusData] = await Promise.all([
        EscalationServiceV2.getAllEscalations(),
        EscalationServiceV2.getTrashEscalations(),
        EscalationSettingsService.getStatuses(),
      ]);
      setEscalations(escData || []);
      setTrashEscalations(trashData || []);
      setStatuses(statusData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user && !canReadEscalation) {
      router.push('/dashboard');
    }
  }, [user, isLoading, canReadEscalation, router]);

  useEffect(() => {
    if (canReadEscalation) {
      fetchEscalations();
    }
  }, [canReadEscalation]);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam) {
        setSavedView(viewParam);
      }
    }
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedEscalation || !tempStatus) return;

    setUpdating(true);
    try {
      await EscalationServiceV2.updateEscalation(selectedEscalation.id, { statusId: tempStatus } as any);
      notifyPremium('success', 'Status Updated', 'The escalation status has been successfully updated.');
      setDrawerVisible(false);
      fetchEscalations();
    } catch (error) {
      console.error('Failed to update status:', error);
      notifyPremium('error', 'Update Failed', 'Failed to update escalation status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await EscalationServiceV2.deleteEscalation(id);
      notifyPremium('success', 'Escalation Deleted', 'The escalation record has been permanently removed.');
      setEscalations((prev) => prev.filter((e) => e.id !== id));
      if (selectedEscalation?.id === id) {
        setDrawerVisible(false);
      }
    } catch (error) {
      console.error('Failed to delete escalation:', error);
      notifyPremium('error', 'Delete Failed', 'Failed to delete escalation. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleRefresh = () => {
    fetchEscalations();
  };

  const getPriorityTag = (priority: any) => (
    <Tag color={priority?.color || 'blue'} style={{ borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
      {priority?.name?.toUpperCase() || 'MEDIUM'}
    </Tag>
  );

  const getStatusBadge = (record: any) => {
    const name = record.status_name || record.escalationStatus?.name || record.status;
    const color = record.status_color || record.escalationStatus?.color || BLUE_PRIMARY;
    if (!name) return <Badge status="default" text="Unknown" />;
    return (
      <span className="es-vis-pill" style={{ color: color, background: `${color}1A`, borderColor: `${color}40` }}>
        <span className="es-vis-dot" style={{ background: color }} />
        {name}
      </span>
    );
  };

  const getCategoryTag = (cat: any) => (
    <Tag
      color="blue"
      style={{
        borderRadius: 4,
        borderLeft: cat?.color ? `4px solid ${cat.color}` : 'none',
        background: 'var(--bg-slate-50)',
        color: 'var(--text-slate-600)',
        fontWeight: 500,
      }}
      bordered={false}
    >
      {cat?.name || cat?.category_name || 'General'}
    </Tag>
  );

  const priorityOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string; color?: string }>();
    escalations.forEach((e) => {
      const p = e.priority || (e.priority_name ? { name: e.priority_name } : null);
      if (p?.name) {
        const key = p.name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { value: key, label: p.name, color: p.color });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [escalations]);

  const categoryOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string; color?: string }>();
    escalations.forEach((e) => {
      const c = e.category || (e.category_name ? { name: e.category_name } : null);
      if (c?.name) {
        if (!map.has(c.name)) {
          map.set(c.name, { value: c.name, label: c.name, color: c.color });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [escalations]);

  const statusOptions = useMemo(
    () =>
      statuses.map((s) => ({
        value: s.id,
        label: s.name,
        color: s.color,
      })),
    [statuses],
  );

  const filteredEscalations = useMemo(() => {
    let list = savedView === 'trash' ? [...trashEscalations] : [...escalations];

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((e) => {
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
    }

    if (statusFilter.length > 0) {
      const set = new Set(statusFilter);
      list = list.filter((e) => set.has(e.statusId || e.escalationStatus?.id || e.status));
    }

    if (priorityFilter.length > 0) {
      const set = new Set(priorityFilter);
      list = list.filter((e) => {
        const name = (e.priority?.name || e.priority_name || '').toLowerCase();
        return set.has(name);
      });
    }

    if (categoryFilter.length > 0) {
      const set = new Set(categoryFilter);
      list = list.filter((e) => set.has(e.category?.name || e.category_name));
    }

    if (savedView === 'my-involvement') {
      list = list.filter((e) =>
        (e.targetMembers || []).some((m: any) => m.user?.id === user?.id)
      );
    } else if (savedView === 'raised-by-me') {
      list = list.filter((e) => (e.createdBy?.id || e.created_by_id) === user?.id);
    }

    list.sort((a, b) => {
      const da = dayjs(a.createdAt || a.created_at);
      const db = dayjs(b.createdAt || b.created_at);
      return db.valueOf() - da.valueOf();
    });

    return list;
  }, [escalations, searchText, statusFilter, priorityFilter, categoryFilter, savedView, user]);

  useEffect(() => { setTablePage(1); }, [savedView, searchText, statusFilter, priorityFilter, categoryFilter]);

  const statsData = useMemo(() => {
    const total = escalations.length;
    const highPriority = escalations.filter((e) => {
      const weight = e.priority_weight || e.priority?.weight || 0;
      const name = (e.priority_name || e.priority?.name || '').toLowerCase();
      return weight >= 80 || name === 'high' || name === 'urgent';
    }).length;
    const pending = escalations.filter((e) => e.escalationStatus?.isDefault).length;
    const resolved = escalations.filter((e) => e.escalationStatus?.isFinal).length;
    const myInvolvement = escalations.filter((e) =>
      (e.targetMembers || []).some((m: any) => m.user?.id === user?.id),
    ).length;
    const pendingInvolvingMe = escalations.filter((e) =>
      e.escalationStatus?.isDefault && (e.targetMembers || []).some((m: any) => m.user?.id === user?.id)
    ).length;
    return { total, highPriority, pending, resolved, myInvolvement, pendingInvolvingMe };
  }, [escalations, user]);

  const statCells = useMemo(() => {
    const now = new Date();
    const MONTHS = 6;
    const bucketStarts: Date[] = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      bucketStarts.push(d);
    }

    const totalTrend = new Array(MONTHS).fill(0);
    const highPriTrend = new Array(MONTHS).fill(0);
    const pendingTrend = new Array(MONTHS).fill(0);
    const resolvedTrend = new Array(MONTHS).fill(0);

    escalations.forEach(e => {
      const created = new Date(e.createdAt || e.created_at);
      const weight = e.priority_weight || e.priority?.weight || 0;
      const name = (e.priority_name || e.priority?.name || '').toLowerCase();
      const isHighPri = weight >= 80 || name === 'high' || name === 'urgent';
      const isPending = e.escalationStatus?.isDefault;
      const isResolved = e.escalationStatus?.isFinal;

      for (let b = 0; b < MONTHS; b++) {
        const bucketEnd = b < MONTHS - 1 ? bucketStarts[b + 1] : new Date(now.getFullYear(), now.getMonth() + 1, 1);
        if (created < bucketEnd) {
          for (let j = b; j < MONTHS; j++) {
            totalTrend[j] += 1;
            if (isHighPri) highPriTrend[j] += 1;
            if (isPending) pendingTrend[j] += 1;
            if (isResolved) resolvedTrend[j] += 1;
          }
          break;
        }
      }
    });

    if (totalTrend[MONTHS - 1] === 0 && escalations.length > 0) {
      totalTrend[MONTHS - 1] = statsData.total;
      highPriTrend[MONTHS - 1] = statsData.highPriority;
      pendingTrend[MONTHS - 1] = statsData.pending;
      resolvedTrend[MONTHS - 1] = statsData.resolved;
    }

    return [
      { key: 'total', title: 'Active Escalations', subtitle: 'Across all categories', value: statsData.total, suffix: '', icon: <ExclamationCircleOutlined />, color: '#3b82f6', tint: 'rgba(59,130,246,0.10)', trend: totalTrend },
      { key: 'high', title: 'High Priority', value: statsData.highPriority, suffix: '', icon: <FireOutlined />, color: '#ef4444', tint: 'rgba(239,68,68,0.10)', trend: highPriTrend },
      { key: 'pending', title: 'Pending Reviews', subtitle: `${statsData.pendingInvolvingMe} involve you`, value: statsData.pending, suffix: '', icon: <ClockCircleOutlined />, color: '#f59e0b', tint: 'rgba(245,158,11,0.10)', trend: pendingTrend },
      { key: 'resolved', title: 'Total Resolved', value: statsData.resolved, suffix: '', icon: <CheckCircleOutlined />, color: '#10b981', tint: 'rgba(16,185,129,0.10)', trend: resolvedTrend },
    ];
  }, [escalations, statsData]);

  const viewCounts = useMemo(() => ({
    all: escalations.length,
    'my-involvement': escalations.filter((e) => (e.targetMembers || []).some((m: any) => m.user?.id === user?.id)).length,
    'raised-by-me': escalations.filter((e) => (e.createdBy?.id || e.created_by_id) === user?.id).length,
    trash: trashEscalations.length,
  }), [escalations, trashEscalations, user]);

  const viewsList = [
    { key: 'all', label: 'All Escalations', icon: <FolderOutlined />, color: '#3B82F6' },
    { key: 'my-involvement', label: 'My Involvement', icon: <UserOutlined />, color: '#64748B' },
    { key: 'raised-by-me', label: 'Raised by Me', icon: <FileTextOutlined />, color: '#10B981' },
    { key: 'trash', label: 'Trash', icon: <DeleteOutlined />, color: '#ef4444' },
  ];

  const hasActiveFilters = searchText.trim().length > 0 || statusFilter.length > 0 || priorityFilter.length > 0 || categoryFilter.length > 0;

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter([]);
    setPriorityFilter([]);
    setCategoryFilter([]);
  };

  const handleRestore = async (id: string) => {
    try {
      await EscalationServiceV2.restoreEscalation(id);
      notifyPremium('success', 'Escalation Restored', 'The escalation has been restored from trash.');
      fetchEscalations(); // Refresh lists
    } catch (error) {
      console.error('Failed to restore escalation:', error);
      notifyPremium('error', 'Restore Failed', 'Failed to restore escalation. Please try again.');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await EscalationServiceV2.permanentDeleteEscalation(id);
      notifyPremium('success', 'Permanently Deleted', 'The escalation has been permanently removed.');
      fetchEscalations(); // Refresh lists
    } catch (error) {
      console.error('Failed to permanently delete escalation:', error);
      notifyPremium('error', 'Delete Failed', 'Failed to permanently delete escalation.');
    }
  };

  const actionMenu = (record: any) => ({
    className: 'es-action-pop',
    items: record.isDeleted || record.is_deleted ? [
      { key: 'restore', label: <div className="es-menu-item"><span className="es-menu-ic" style={{ color: '#10b981', background: 'rgba(16,185,129,0.12)' }}><HistoryOutlined /></span><span className="es-menu-text"><span className="es-menu-title">Restore</span><span className="es-menu-desc">Restore from trash</span></span></div> },
      { type: 'divider' as const },
      { key: 'permanent_delete', danger: true, disabled: !canDeleteEscalation, label: <div className="es-menu-item"><span className="es-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}><DeleteOutlined /></span><span className="es-menu-text"><span className="es-menu-title">Delete Forever</span><span className="es-menu-desc">Irreversible</span></span></div> },
    ] : [
      { key: 'view', label: <div className="es-menu-item"><span className="es-menu-ic" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.12)' }}><AlertOutlined /></span><span className="es-menu-text"><span className="es-menu-title">View details</span><span className="es-menu-desc">Open escalation</span></span></div> },
      { key: 'edit', disabled: !canUpdateEscalation, label: <div className="es-menu-item"><span className="es-menu-ic" style={{ color: '#64748b', background: 'rgba(100,116,139,0.12)' }}><EditOutlined /></span><span className="es-menu-text"><span className="es-menu-title">Edit</span><span className="es-menu-desc">Modify escalation</span></span></div> },
      { type: 'divider' as const },
      { key: 'delete', danger: true, disabled: !canDeleteEscalation, label: <div className="es-menu-item"><span className="es-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}><DeleteOutlined /></span><span className="es-menu-text"><span className="es-menu-title">Delete</span><span className="es-menu-desc">Move to trash</span></span></div> },
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent.stopPropagation();
      if (key === 'restore') {
        handleRestore(record.id);
      } else if (key === 'permanent_delete') {
        modal.confirm({
          title: 'Delete Forever',
          content: 'Are you sure you want to permanently delete this escalation? This action cannot be undone.',
          okText: 'Delete Forever',
          okType: 'danger',
          onOk: () => handlePermanentDelete(record.id),
        });
      } else if (key === 'view') {
        setSelectedEscalation(record);
        setTempStatus(record.statusId || record.status);
        setIsEditing(false);
        setDrawerVisible(true);
      } else if (key === 'edit') {
        setEditingRecord(record);
        setEditDrawerOpen(true);
      } else if (key === 'delete') {
        modal.confirm({
          title: 'Delete Escalation',
          content: 'Are you sure you want to move this escalation to the trash?',
          okText: 'Delete',
          okType: 'danger',
          onOk: () => {
            handleDelete(record.id);
            setTrashEscalations(prev => [record, ...prev]);
          },
        });
      }
    },
  });

  const columns = [
    {
      title: 'SUBJECT & CATEGORY',
      dataIndex: 'subject',
      key: 'subject',
      fixed: 'left' as const,
      render: (text: string, record: any) => (
        <div className="es-name-cell">
          <div className="es-name-icon">
            <AlertOutlined style={{ fontSize: 12 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <span className="es-name-title">{text || record.short_summary || 'No Subject'}</span>
            <span style={{ fontSize: 11, color: 'var(--text-slate-400)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.category?.name || record.category_name || 'General'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'TARGET MEMBERS',
      dataIndex: 'targetMembers',
      key: 'targetMembers',
      width: 200,
      render: (members: any[], record: any) => {
        const list = members || record.targetMembers || [];
        if (list.length === 0) return <Text className="es-muted">—</Text>;

        const firstMember = list[0]?.user;
        const othersCount = list.length - 1;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 10, fontWeight: 700, width: 24, height: 24, lineHeight: '24px', flexShrink: 0 }}>
              {initialsOf(firstMember?.name)}
            </Avatar>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-slate-700)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {firstMember?.name || 'Unknown'}
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
      render: (priority: any, record: any) => getPriorityTag(priority || { name: record.priority_name }),
    },
    {
      title: 'STATUS',
      key: 'status',
      width: 140,
      render: (_: any, record: any) => getStatusBadge(record),
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
      title: 'RAISED DATE',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string, record: any) => {
        const d = dayjs(date || record.created_at);
        return (
          <div className="es-date">
            <span className="es-date-main">{d.format('MMM D, YYYY')}</span>
            <span className="es-date-sub">{d.format('h:mm A')}</span>
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
      render: (_: any, record: any) => (
        <Dropdown menu={actionMenu(record)} overlayClassName="es-action-pop" trigger={['click']} placement="bottomRight">
          <Button type="text" className="es-icon-btn" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  const total = filteredEscalations.length;
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pagedEscalations = filteredEscalations.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  const emptyState = (
    <div className="es-empty">
      <div className="es-empty-orb"><AlertOutlined style={{ fontSize: 26 }} /></div>
      <div className="es-empty-title">No escalations found</div>
      <div className="es-empty-sub">Monitor and resolve manual escalations related to quality and regressions.</div>
      {canCreateEscalation && (
        <Button type="primary" icon={<PlusOutlined />} className="es-btn-primary" onClick={() => setCreateDrawerOpen(true)} style={{ marginTop: 14 }}>
          Raise Escalation
        </Button>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="es-shell">
        {/* ============================ SIDEBAR ============================ */}
        {mobileSidebarOpen && <div className="es-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />}
        <aside className={`es-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
          <div className="es-sidebar-top">
            <div className="es-side-head">
              <div className="es-side-logo"><AlertOutlined style={{ color: isDark ? '#ffffff' : '#3b82f6' }} /></div>
              <div className="es-side-head-text">
                <div className="es-side-title">Escalations</div>
                <div className="es-side-subtitle">Quality & Performance</div>
              </div>
            </div>

            {canCreateEscalation && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="es-create-btn"
                onClick={() => setCreateDrawerOpen(true)}
                block
              >
                Raise Escalation
              </Button>
            )}
          </div>

          <div className="es-side-scroll">
            <div className="es-side-section-label">Views</div>
            <div className="es-side-list">
              {viewsList.map((v) => {
                const active = savedView === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    className={`es-view-item ${active ? 'is-active' : ''}`}
                    onClick={() => {
                      if (v.key === 'trash') {
                        router.push('/escalations/trash');
                      } else {
                        setSavedView(v.key);
                        router.replace(`/escalations?view=${v.key}`);
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
            <div className="es-side-section-label">Filters</div>
            <div className="es-side-filters">
              <SearchableDropdown
                mode="multiple"
                className="es-side-sd"
                placeholder="Category"
                searchPlaceholder="Search category"
                itemNoun="categories"
                value={categoryFilter}
                onChange={(v) => setCategoryFilter(v || [])}
                options={categoryOptions}
                width="100%"
              />
              <SearchableDropdown
                mode="multiple"
                className="es-side-sd"
                placeholder="Priority"
                searchPlaceholder="Search priority"
                itemNoun="priorities"
                value={priorityFilter}
                onChange={(v) => setPriorityFilter(v || [])}
                options={priorityOptions}
                width="100%"
              />
              <SearchableDropdown
                mode="multiple"
                className="es-side-sd"
                placeholder="Status"
                searchPlaceholder="Search status"
                itemNoun="statuses"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v || [])}
                options={statusOptions}
                width="100%"
              />
              {hasActiveFilters && (
                <button type="button" className="es-clear-filters" onClick={handleClearFilters}>
                  <CloseCircleOutlined /> Clear filters
                </button>
              )}
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
                  ref={searchRef}
                  className="es-search"
                  placeholder="Search subject, target, project…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <span className="es-kbd">⌘K</span>
              </div>
            </div>

            <div className="es-topbar-meta">
              <span className="es-meta-item"><span className="es-pulse" /><strong>{escalations.length}</strong> total</span>
              <span className="es-meta-dot">·</span>
              <span className="es-meta-item"><strong>{statsData.pending}</strong> pending</span>
            </div>

            <div className="es-topbar-actions">
              <div className="es-segmented">
                <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
              </div>
              <Tooltip title="Refresh">
                <button type="button" className="es-ghost-btn" onClick={handleRefresh}><ReloadOutlined spin={loading} /></button>
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

          {/* Table / grid */}
          <div className="es-body">
            {view === 'list' ? (
              <div className="es-table-wrap">
                <Table
                  columns={columns}
                  dataSource={pagedEscalations}
                  loading={loading}
                  rowKey="id"
                  size="small"
                  className="es-table"
                  scroll={{ x: 1000 }}
                  rowSelection={{ selectedRowKeys: selectedKeys, onChange: (keys) => setSelectedKeys(keys), columnWidth: 40 }}
                  pagination={false}
                  locale={{ emptyText: emptyState }}
                  onRow={(record) => ({
                    onClick: (e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest('.ant-checkbox-wrapper, .ant-table-selection-column, button, input, .ant-select, .ant-dropdown-trigger')) return;
                      setSelectedEscalation(record);
                      setTempStatus(record.statusId || record.status);
                      setIsEditing(false);
                      setDrawerVisible(true);
                    },
                    className: 'es-row',
                  })}
                />
              </div>
            ) : (
              <div className="es-grid">
                {loading ? (
                  <div className="es-grid-loading">Loading…</div>
                ) : filteredEscalations.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1' }}>{emptyState}</div>
                ) : (
                  filteredEscalations.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize).map((record) => {
                    const title = record.subject || record.short_summary || 'No Subject';
                    const accent = accentFor(record.id || title);
                    const list = record.targetMembers || [];
                    const statusName = record.status_name || record.escalationStatus?.name || record.status;
                    const statusColor = record.status_color || record.escalationStatus?.color || BLUE_PRIMARY;
                    const catName = record.category?.name || record.category_name || 'General';
                    const isHighProd = catName.toLowerCase() === 'high production issue';

                    return (
                      <div key={record.id} className="ec-card dh-card group transition-all flex flex-col relative cursor-pointer" style={{ borderRadius: 0, border: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)', overflow: 'hidden', minHeight: 110 }} onClick={() => {
                        setSelectedEscalation(record);
                        setTempStatus(record.statusId || record.status);
                        setIsEditing(false);
                        setDrawerVisible(true);
                      }}>
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

                        {/* ROW 2: Raised By & Raised Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid var(--border-slate-100)', fontSize: 11, color: 'var(--text-slate-500)', whiteSpace: 'nowrap', overflowX: 'auto', background: 'var(--bg-slate-50)' }} className="scrollbar-hide">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>Raised by</span>
                            <Avatar size={16} src={record.createdBy?.avatarUrl || record.createdBy?.avatar} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 9, fontWeight: 700 }}>
                              {initialsOf(record.createdBy?.name || 'System')}
                            </Avatar>
                            <span style={{ fontWeight: 500, color: 'var(--text-slate-700)' }}>{record.createdBy?.name || 'System'}</span>
                          </div>
                          <div style={{ width: 1, height: 12, background: 'var(--border-slate-200)' }} />
                          <div>Raised {dayjs(record.created_at || record.createdAt).format('MMM D, YYYY - hh:mm A')}</div>
                          {record.updated_at && (
                            <>
                              <div style={{ width: 1, height: 12, background: 'var(--border-slate-200)' }} />
                              <div>Updated {dayjs(record.updated_at).format('MMM D, YYYY - hh:mm A')}</div>
                            </>
                          )}
                        </div>

                        {/* ROW 3: Footer Stats */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', fontSize: 11, color: 'var(--text-slate-500)', whiteSpace: 'nowrap', overflowX: 'auto', background: 'var(--bg-slate-50)' }} className="scrollbar-hide">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>Status:</span>
                            <span className="es-vis-pill" style={{ color: statusColor, background: `${statusColor}1A`, borderColor: `${statusColor}40`, height: 20, fontSize: 10.5, padding: '0 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <span className="es-vis-dot" style={{ background: statusColor, width: 6, height: 6, borderRadius: '50%' }} />
                              {statusName || 'Unknown'}
                            </span>
                          </div>
                          <div style={{ width: 1, height: 12, background: 'var(--border-slate-200)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>Priority:</span>
                            {getPriorityTag(record.priority || { name: record.priority_name })}
                          </div>
                          <div style={{ width: 1, height: 12, background: 'var(--border-slate-200)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>Target Members:</span>
                            {list.length > 0 ? (
                              <Avatar.Group max={{ count: 3, style: { background: '#94a3b8', color: '#fff', fontSize: 10, fontWeight: 600, border: '1px solid #fff' } }} size={22}>
                                {list.map((m: any, idx: number) => (
                                  <Tooltip key={idx} title={m.user?.name}>
                                    <Avatar style={{ background: '#e2e8f0', color: '#475569', fontSize: 9.5, fontWeight: 700, border: '1px solid #fff' }}>
                                      {initialsOf(m.user?.name)}
                                    </Avatar>
                                  </Tooltip>
                                ))}
                              </Avatar.Group>
                            ) : (
                              <span style={{ fontWeight: 600, color: 'var(--text-slate-700)' }}>0</span>
                            )}
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
            <div className="es-footer es-footer--sticky">
              <div className="es-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
                {selectedKeys.length > 0 && <span className="es-footer-sel"> · {selectedKeys.length} selected</span>}
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
                  options={[15, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Escalation Detail Drawer */}
      <Drawer
        title={
          <Space direction="vertical" size={2}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertOutlined style={{ color: BLUE_PRIMARY }} />
              <Title level={4} style={{ margin: 0, color: 'var(--text-slate-900)' }}>
                Escalation Details
              </Title>
            </div>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-slate-400)' }}>
              ID: {selectedEscalation?.id?.split('-')[0].toUpperCase()} • Raised on{' '}
              {dayjs(selectedEscalation?.created_at || selectedEscalation?.createdAt).format('MMM D, YYYY at HH:mm')}
            </Text>
          </Space>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={450}
        extra={
          canReadActivityLog && selectedEscalation && (
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
        styles={{
          header: { borderBottom: '1px solid var(--border-slate-100)', padding: '16px 24px', background: 'var(--bg-pure-white)' },
          body: { padding: 0, background: 'var(--bg-pure-white)' },
          footer: { borderTop: '1px solid var(--border-slate-100)', padding: '12px 24px', background: 'var(--bg-pure-white)' },
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            {isEditing ? (
              <>
                <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="primary" loading={updating} onClick={handleUpdateStatus} style={{ background: BLUE_PRIMARY }}>
                  Update Status
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setDrawerVisible(false)}>Close</Button>
                {canUpdateEscalation && (
                  <Button type="primary" onClick={() => setIsEditing(true)} style={{ background: BLUE_PRIMARY }}>
                    Edit Status
                  </Button>
                )}
              </>
            )}
          </div>
        }
      >
        {selectedEscalation && (
          <div style={{ padding: '24px' }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card
                styles={{
                  body: {
                    padding: '12px 18px',
                    background: 'var(--bg-slate-50)',
                    border: '1px solid var(--border-slate-200)',
                    borderRadius: 12,
                  },
                }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-slate-400)',
                      }}
                    >
                      Subject
                    </Text>
                    <Title level={4} style={{ margin: '2px 0 0 0', fontWeight: 700, color: 'var(--text-slate-900)' }}>
                      {selectedEscalation.subject || selectedEscalation.short_summary}
                    </Title>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <Text
                        type="secondary"
                        style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-slate-400)' }}
                      >
                        Current Status
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        {isEditing ? (
                          <Select
                            value={tempStatus}
                            onChange={setTempStatus}
                            style={{ width: '100%' }}
                            options={statuses.map((s) => ({
                              label: (
                                <Space>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color || BLUE_PRIMARY }} />
                                  {s.name}
                                </Space>
                              ),
                              value: s.id,
                            }))}
                          />
                        ) : (
                          getStatusBadge(selectedEscalation)
                        )}
                      </div>
                    </div>
                    <div>
                      <Text
                        type="secondary"
                        style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-slate-400)' }}
                      >
                        Priority
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        {getPriorityTag(selectedEscalation.priority || { name: selectedEscalation.priority_name })}
                      </div>
                    </div>
                  </div>
                </Space>
              </Card>

              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <Space direction="vertical" size={2}>
                    <Text
                      type="secondary"
                      style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-slate-400)' }}
                    >
                      <ProjectOutlined /> Category
                    </Text>
                    {getCategoryTag(selectedEscalation.category || { name: selectedEscalation.category_name })}
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={2}>
                    <Text
                      type="secondary"
                      style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-slate-400)' }}
                    >
                      <PlusOutlined /> Related Project
                    </Text>
                    <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>
                      {selectedEscalation.project?.name || 'N/A'}
                    </Text>
                  </Space>
                </Col>
              </Row>

              <Divider style={{ margin: 0 }} />

              <div>
                <Space align="center" style={{ marginBottom: 8 }}>
                  <FileTextOutlined style={{ color: BLUE_PRIMARY, fontSize: 14 }} />
                  <Text strong style={{ fontSize: 14, color: 'var(--text-slate-900)' }}>
                    Detailed Description
                  </Text>
                </Space>
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-slate-200)',
                    borderRadius: 10,
                    fontSize: 13,
                    lineHeight: '1.5',
                    color: 'var(--text-slate-700)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedEscalation.description || selectedEscalation.detailed_description}
                </div>
              </div>

              {selectedEscalation.document_url && (() => {
                let parsedUrls: string[] = [];
                try {
                  parsedUrls = JSON.parse(selectedEscalation.document_url);
                  if (!Array.isArray(parsedUrls)) parsedUrls = [selectedEscalation.document_url];
                } catch {
                  parsedUrls = [selectedEscalation.document_url];
                }

                if (parsedUrls.length === 0) return null;

                const fileList = parsedUrls.map((url, idx) => {
                  let fileName = url.split('/').pop() || `Attachment ${idx + 1}`;
                  const match = fileName.match(/^[\w-]{12}_(.+)$/);
                  if (match) {
                    fileName = match[1];
                  }

                  let fileUrl = url;
                  if (url.startsWith('/')) {
                    fileUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}${url}`;
                  } else if (url.includes("r2.cloudflarestorage.com")) {
                    fileUrl = url.replace(
                      /https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+/,
                      "https://pub-7f315f14b4bb4930bd64cae157207c92.r2.dev"
                    );
                  }
                  
                  if (fileUrl.includes(".r2.dev") && !fileUrl.includes(".r2.dev/")) {
                    fileUrl = fileUrl.replace(".r2.dev", ".r2.dev/");
                  }

                  return {
                    uid: `existing-${idx}`,
                    name: fileName,
                    status: 'done' as const,
                    url: fileUrl,
                  };
                });

                return (
                  <div>
                    <Space align="center" style={{ marginBottom: 8 }}>
                      <PaperClipOutlined style={{ color: BLUE_PRIMARY, fontSize: 14 }} />
                      <Text strong style={{ fontSize: 14, color: 'var(--text-slate-900)' }}>
                        Attachments
                      </Text>
                    </Space>
                    <Upload
                      fileList={fileList}
                      showUploadList={{
                        showRemoveIcon: false,
                        showDownloadIcon: true,
                      }}
                      onPreview={(file) => setPreviewFile(file)}
                      onDownload={(file) => window.open(file.url, '_blank')}
                    />
                  </div>
                );
              })()}

              {selectedEscalation.tickets?.length > 0 && (
                <div>
                  <Space align="center" style={{ marginBottom: 10 }}>
                    <BugOutlined style={{ color: BLUE_PRIMARY, fontSize: 13 }} />
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-slate-400)',
                      }}
                    >
                      Linked Development Tickets
                    </Text>
                  </Space>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedEscalation.tickets.map((t: any, idx: number) => (
                      <Tag
                        key={idx}
                        color="blue"
                        bordered={false}
                        style={{
                          borderRadius: 4,
                          margin: 0,
                          padding: '4px 8px',
                          background: 'var(--bg-blue-50)',
                          border: '1px solid var(--border-slate-200)',
                        }}
                      >
                        <Space size={4}>
                          <Text strong style={{ fontSize: 11, color: 'var(--premium-blue)' }}>
                            {t.ticket?.ticketNumber}
                          </Text>
                          <Text style={{ fontSize: 11, color: 'var(--text-slate-600)' }}>{t.ticket?.title}</Text>
                        </Space>
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Space align="center" style={{ marginBottom: 10 }}>
                  <UserOutlined style={{ color: BLUE_PRIMARY, fontSize: 13 }} />
                  <Text
                    strong
                    style={{
                      fontSize: 13,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-slate-400)',
                    }}
                  >
                    Target Team Members
                  </Text>
                </Space>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedEscalation.targetMembers?.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '4px 10px 4px 4px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-slate-200)',
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      }}
                    >
                      <Avatar size={24} style={{ backgroundColor: BLUE_PRIMARY, fontSize: 10 }}>
                        {m.user?.name?.charAt(0)}
                      </Avatar>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text strong style={{ fontSize: 12, color: 'var(--text-slate-700)' }}>
                          {m.user?.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            color: 'var(--text-slate-400)',
                            background: 'var(--bg-slate-50)',
                            padding: '2px 6px',
                            borderRadius: 10,
                            fontWeight: 500,
                          }}
                        >
                          {m.user?.position?.title || 'Member'}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Divider style={{ margin: 0 }} />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--bg-slate-50)',
                  borderRadius: 10,
                }}
              >
                <Space size={10}>
                  <Avatar
                    size="small"
                    src={selectedEscalation.createdBy?.avatar}
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-slate-400)' }}
                  >
                    {selectedEscalation.createdBy?.name?.charAt(0)}
                  </Avatar>
                  <div>
                    <Text type="secondary" style={{ fontSize: 10, display: 'block', color: 'var(--text-slate-400)' }}>
                      Raised By
                    </Text>
                    <Text strong style={{ fontSize: 12, color: 'var(--text-slate-900)' }}>
                      {selectedEscalation.createdBy?.name || 'System / Not found'}
                    </Text>
                  </div>
                </Space>
                <Space size={10}>
                  <HistoryOutlined style={{ color: 'var(--text-slate-400)', fontSize: 14 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 10, display: 'block', color: 'var(--text-slate-400)' }}>
                      Last Updated
                    </Text>
                    <Text strong style={{ fontSize: 12, color: 'var(--text-slate-900)' }}>
                      {dayjs(selectedEscalation.updatedAt || selectedEscalation.updated_at).fromNow()}
                    </Text>
                  </div>
                </Space>
              </div>
            </Space>
          </div>
        )}
      </Drawer>

      <CreateEscalationDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={fetchEscalations}
      />

      {selectedEscalation && (
        <TransactionHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          entityType="escalation"
          entityId={selectedEscalation.id}
          subtitle={selectedEscalation.title || selectedEscalation.subject || `Escalation #${selectedEscalation.id.split('-')[0].toUpperCase()}`}
        />
      )}

      <CreateEscalationDrawer
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditingRecord(null);
        }}
        onSuccess={fetchEscalations}
        editingId={editingRecord?.id}
      />

      <style jsx global>{`
        .es-shell {
          display: flex;
          margin: 0 -16px;
          height: calc(100vh - 64px);
          background: var(--bg-pure-white);
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
          background: #3B82F6 !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 4px;
        }
        .es-create-btn:hover { background: #2563EB !important; }
        .es-create-btn .anticon { font-size: 12px !important; }
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
          color: #3B82F6; font-weight: 700;
          background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
        }
        .es-side-filters { display: flex; flex-direction: column; gap: 7px; padding: 0; }
        .es-side-sd { border-radius: 8px !important; }
        .es-side-select .ant-select-selector {
          border-radius: 8px !important; border-color: var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
        }
        .es-clear-filters {
          display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
          background: none; border: none; cursor: pointer; padding: 3px;
          font-size: 12px; font-weight: 600; color: #ef4444;
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
        .es-meta-dot { color: var(--text-slate-300); }
        .es-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
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
        /* Dark theme styles moved below */
        .es-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .es-stat-left { display: flex; align-items: center; gap: 8px; }
        .es-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .es-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .es-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .es-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .es-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .es-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .es-stat-spark { opacity: 0.95; }

        /* Table */
        .es-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .es-table .ant-table { background: transparent; font-size: 12px; }
        .es-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .es-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; background: var(--bg-pure-white) !important; }
        .es-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .es-table .ant-table-tbody > tr.es-row:hover > td { background: var(--bg-slate-50) !important; }
        .es-table .ant-table-tbody > tr.es-row { cursor: pointer; }
        .es-table .ant-table-selection-column { padding-inline: 6px !important; }

        .es-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .es-name-icon {
          width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; color: #3B82F6;
          background: var(--bg-blue-50);
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

        /* Empty + grid */
        .es-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .es-empty-orb {
          width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
        }
        .es-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .es-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }
        .es-btn-primary {
          background: #3B82F6 !important; border: none !important;
          border-radius: 6px !important; font-weight: 600 !important;
        }
        .es-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .es-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .ec-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
        }

        .ec-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .ec-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .ec-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .ec-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .ec-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .ec-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .ec-category-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .ec-category-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .ec-category-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .ec-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .ec-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
        .ec-foot-row + .ec-foot-row { border-top: 1px solid var(--border-slate-200); }
        .ec-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .ec-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .ec-foot-val { font-size: 11.5px; color: var(--text-slate-700); }
        .ec-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
        .ec-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .ec-view-btn .anticon { font-size: 12px; }
        .ec-view-btn:hover { text-decoration: underline; }

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

        @media (max-width: 700px) {
          .es-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 1100px) {
          .es-stats { grid-template-columns: repeat(2, 1fr); }
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
          background: rgba(255, 77, 79, 0.15);
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
          background: #0B0F1A !important;
          border-bottom-color: #1F2937 !important;
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

        @media (max-width: 820px) {
          .es-shell { flex-direction: column; }
          .es-mobile-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 998;
          }
          .es-sidebar {
            position: fixed; top: 0; left: -320px; bottom: 0;
            z-index: 999; height: 100%; max-height: none;
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
      `}</style>

      {/* File Preview Drawer */}
      <Drawer
        placement="left"
        width={700}
        closable={false}
        title={null}
        footer={null}
        mask={false}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        className={`hb-preview-drawer ${theme === "dark" ? "hb-preview-drawer-dark" : "hb-preview-drawer-light"}`}
        styles={{
          body: { padding: 0, height: '100%' }
        }}
      >
        {previewFile && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Text strong>{previewFile.name}</Typography.Text>
              <Space>
                <Button type="text" icon={<DownloadOutlined />} onClick={() => window.open(previewFile.url || previewFile.preview, '_blank')} />
                <Button type="text" icon={<CloseOutlined />} onClick={() => setPreviewFile(null)} />
              </Space>
            </div>
            <div style={{ flex: 1, padding: 24, background: 'var(--bg-slate-50)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto' }}>
              {(() => {
                const displayUrl = previewFile.url || previewFile.preview || '';
                const isImage = /\.(jpeg|jpg|gif|png|webp|svg|bmp|ico)/i.test(displayUrl);
                const isPdf = /\.pdf/i.test(displayUrl);

                if (isImage) {
                  return <img src={displayUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Preview" />;
                }
                if (isPdf) {
                  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(displayUrl)}&embedded=true`;
                  return <iframe src={googleDocsUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />;
                }

                return (
                  <div style={{ textAlign: 'center' }}>
                    <FileTextOutlined style={{ fontSize: 48, color: 'var(--text-slate-400)', marginBottom: 16 }} />
                    <Typography.Text type="secondary" style={{ display: 'block' }}>Preview not available for this file type</Typography.Text>
                    <Button type="primary" style={{ marginTop: 16 }} onClick={() => window.open(displayUrl, '_blank')}>
                      Download File
                    </Button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Drawer>
    </MainLayout>
  );
}
