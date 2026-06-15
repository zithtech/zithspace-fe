'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Typography,
  Button,
  Table,
  Input,
  message,
  Dropdown,
  Tooltip,
  Select,
  Modal,
  DatePicker,
  Avatar,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SnippetsOutlined,
  EyeOutlined,
  FileWordOutlined,
  SendOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  RiseOutlined,
  UserOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  FolderOutlined,
  GlobalOutlined,
  HistoryOutlined,
  StarOutlined,
  StarFilled,
  RestOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import { Sparkles, Mail } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { ProposalService } from '@/services/proposalService';
import { userService } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { MailService } from '@/services/mailService';
import { LeadMailDrawer } from '@/components/leads/LeadMailDrawer';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ProposalActivityDrawer from '@/components/proposals/ProposalActivityDrawer';
import ProposalPreviewDrawer from '@/components/proposals/ProposalPreviewDrawer';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import dayjs from 'dayjs';
import { formatDistanceToNow } from 'date-fns';
import { useActivitySource } from '@/hooks/useActivitySource';

const { Text } = Typography;
const { RangePicker } = DatePicker;

type StatusKey = 'all' | 'draft' | 'sent' | 'accepted' | 'declined';
type SavedView = 'all' | 'mine' | 'sent' | 'starred';

const STATUS_META: Record<
  Exclude<StatusKey, 'all'>,
  { label: string; color: string; bg: string; ring: string; icon: React.ReactNode }
> = {
  draft: { label: 'Draft', color: '#64748b', bg: 'rgba(100,116,139,0.10)', ring: 'rgba(100,116,139,0.25)', icon: <ClockCircleOutlined /> },
  sent: { label: 'Sent', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', ring: 'rgba(59,130,246,0.25)', icon: <SendOutlined /> },
  accepted: { label: 'Accepted', color: '#10b981', bg: 'rgba(16,185,129,0.10)', ring: 'rgba(16,185,129,0.25)', icon: <CheckCircleOutlined /> },
  declined: { label: 'Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', ring: 'rgba(239,68,68,0.25)', icon: <CloseCircleOutlined /> },
};

// Deterministic accent gradient per card, hashed off client/title.
const CARD_ACCENTS: [string, string][] = [
  ['#3b82f6', '#2563eb'], // blue
  ['#10b981', '#059669'], // green
  ['#64748b', '#475569'], // ash
];
const accentFor = (key: string): [string, string] => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
};
// Smooth area sparkline used inside the stat cards (doc-hub style).
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

const RECENTS_KEY = 'proposal_recents_v1';
const STARRED_KEY = 'proposal_starred_v1';
const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

const readLS = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const initialsOf = (name: string) =>
  (name || '—')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function ProposalsListPage() {
  useActivitySource({ section: 'WORK', module: 'Proposals', page: 'ProposalList' });
  const { user, isLoading } = useAuth();
  const { canReadProposal, canCreateProposal, canUpdateProposal, canDeleteProposal } = usePermission();
  const router = useRouter();

  const [proposals, setProposals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<any>(null);
  const [savedView, setSavedView] = useState<SavedView>('all');
  const [view, setView] = useState<'list' | 'grid'>('grid');

  const [starred, setStarred] = useState<Record<string, boolean>>({});
  const [recents, setRecents] = useState<any[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(15);

  const [isMailDrawerVisible, setIsMailDrawerVisible] = useState(false);
  const [selectedProposalForMail, setSelectedProposalForMail] = useState<any>(null);
  const [activityProposal, setActivityProposal] = useState<any>(null);
  const [previewProposal, setPreviewProposal] = useState<any>(null);
  const [invoiceMailSettings, setInvoiceMailSettings] = useState<any>(null);

  const searchRef = useRef<any>(null);

  const [messageApi, messageHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  // ─── Persisted local UI state (starred + recents) ───────────────────────────
  useEffect(() => {
    setStarred(readLS<Record<string, boolean>>(STARRED_KEY, {}));
    setRecents(readLS<any[]>(RECENTS_KEY, []));
  }, []);

  const persistStarred = (next: Record<string, boolean>) => {
    setStarred(next);
    try { window.localStorage.setItem(STARRED_KEY, JSON.stringify(next)); } catch { }
  };

  const pushRecent = (p: any) => {
    const entry = { id: p.id, title: resolveTitle(p), client_name: p.client_name, ts: Date.now() };
    setRecents((prev) => {
      const next = [entry, ...prev.filter((r) => r.id !== p.id)].slice(0, 6);
      try { window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  };

  // ─── ⌘K focuses the search input ────────────────────────────────────────────
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

  // ─── Mail settings ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const invoiceSettings = await MailService.getInvoiceMailSettings();
        if (invoiceSettings) {
          const settings = (invoiceSettings as any).settings || [];
          setInvoiceMailSettings(settings.find((s: any) => s.is_default_invoice_mail) || settings[0] || null);
        }
      } catch (err) {
        console.warn('Failed to load mail settings', err);
      }
    })();
  }, []);

  // ─── Route Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && user && !canReadProposal) {
      router.push('/dashboard');
    }
  }, [user, isLoading, canReadProposal, router]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await ProposalService.getProposals();
      if (Array.isArray(data)) setProposals(data);
      else if (data && Array.isArray(data.data)) setProposals(data.data);
      else setProposals([]);
    } catch (err: any) {
      console.error('Fetch error:', err);
      if (err.status !== 401) messageApi.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleRefresh = () => {
    fetchProposals();
    fetchUsers();
  };

  useEffect(() => {
    fetchProposals();
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await ProposalService.deleteProposal(id);
      messageApi.success('Proposal deleted');
      fetchProposals();
    } catch (err) {
      console.error('Delete error:', err);
      messageApi.error('Failed to delete proposal');
    }
  };

  const handleStatusChange = async (record: any, status: Exclude<StatusKey, 'all'>) => {
    if (!canUpdateProposal || record.status === status) return;
    const prev = record.status;
    setProposals((list) => list.map((p) => (p.id === record.id ? { ...p, status } : p)));
    try {
      await ProposalService.updateProposal(record.id, { status });
      messageApi.success(`Marked as ${STATUS_META[status].label}`);
    } catch (err) {
      setProposals((list) => list.map((p) => (p.id === record.id ? { ...p, status: prev } : p)));
      messageApi.error('Failed to update status');
    }
  };

  const openProposal = (p: any) => {
    pushRecent(p);
    setPreviewProposal(p);
  };

  const toggleStar = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    persistStarred({ ...starred, [p.id]: !starred[p.id] });
  };

  const resolveTitle = (record: any) => {
    let displayTitle = record.title;
    if (!displayTitle || displayTitle === 'Updated Proposal') {
      try {
        const blocks = typeof record.blocks_data === 'string' ? JSON.parse(record.blocks_data) : record.blocks_data || [];
        const coverData = blocks.find((b: any) => b.type === 'cover')?.data;
        if (coverData?.title) displayTitle = coverData.title;
      } catch (e) { }
    }
    return displayTitle || 'Untitled Proposal';
  };

  const getStatusPill = (status: string, record?: any) => {
    const s = (status?.toLowerCase() || '') as Exclude<StatusKey, 'all'>;
    const meta = STATUS_META[s] || STATUS_META.draft;
    const pill = (
      <span className="pp-vis-pill" style={{ color: meta.color, background: meta.bg, borderColor: meta.ring }}>
        <span className="pp-vis-dot" style={{ background: meta.color }} />
        {meta.label}
        {record && canUpdateProposal && <CaretDownOutlined style={{ fontSize: 9, opacity: 0.6, marginLeft: 2 }} />}
      </span>
    );
    if (!record || !canUpdateProposal) return pill;
    return (
      <Dropdown
        trigger={['click']}
        menu={{
          selectable: true,
          selectedKeys: [s],
          items: (Object.keys(STATUS_META) as Exclude<StatusKey, 'all'>[]).map((k) => ({
            key: k,
            label: (
              <span className="pp-status-opt">
                <span className="pp-vis-dot" style={{ background: STATUS_META[k].color }} />
                {STATUS_META[k].label}
              </span>
            ),
          })),
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            handleStatusChange(record, key as Exclude<StatusKey, 'all'>);
          },
        }}
      >
        <span onClick={(e) => e.stopPropagation()} style={{ cursor: 'pointer' }}>{pill}</span>
      </Dropdown>
    );
  };

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = proposals.length;
    const drafts = proposals.filter((p) => p.status === 'draft').length;
    const sent = proposals.filter((p) => p.status === 'sent').length;
    const accepted = proposals.filter((p) => p.status === 'accepted').length;
    const declined = proposals.filter((p) => p.status === 'declined').length;
    const winRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, drafts, sent, accepted, declined, winRate };
  }, [proposals]);

  const statCells = useMemo(() => {
    const days: Date[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const trendFor = (predicate: (p: any) => boolean) => {
      const buckets = Object.fromEntries(days.map((d) => [dayKey(d), 0])) as Record<string, number>;
      proposals.filter(predicate).forEach((p) => {
        if (!p.created_at) return;
        const k = dayKey(new Date(p.created_at));
        if (k in buckets) buckets[k] += 1;
      });
      return days.map((d) => buckets[dayKey(d)]);
    };
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

    const totalTrend = trendFor(() => true);
    const draftTrend = trendFor((p) => p.status === 'draft');
    const sentTrend = trendFor((p) => p.status === 'sent');
    const wonTrend = trendFor((p) => p.status === 'accepted');

    return [
      { key: 'total', title: 'Total Proposals', value: stats.total, suffix: '', icon: <SnippetsOutlined />, color: '#3b82f6', tint: 'rgba(59,130,246,0.10)', trend: totalTrend, delta: sum(totalTrend) },
      { key: 'draft', title: 'In Draft', value: stats.drafts, suffix: '', icon: <FileTextOutlined />, color: '#64748b', tint: 'rgba(100,116,139,0.10)', trend: draftTrend, delta: sum(draftTrend) },
      { key: 'sent', title: 'Sent to Clients', value: stats.sent, suffix: '', icon: <SendOutlined />, color: '#3b82f6', tint: 'rgba(59,130,246,0.10)', trend: sentTrend, delta: sum(sentTrend) },
      { key: 'winrate', title: 'Win Rate', value: stats.winRate, suffix: '%', icon: <CheckCircleOutlined />, color: '#10b981', tint: 'rgba(16,185,129,0.10)', trend: wonTrend, delta: stats.accepted },
    ];
  }, [proposals, stats]);

  const handleExport = async (id: string, format: 'pdf' | 'word') => {
    const key = 'exporting';
    try {
      messageApi.open({ key, type: 'loading', content: `Downloading ${format.toUpperCase()}...`, duration: 0 });
      const response = await ProposalService.requestProposalExport(id);
      const resData = response?.data?.data || response?.data || response;
      const { pdfUrl, docxUrl } = resData || {};
      const fileUrl = format === 'pdf' ? pdfUrl : docxUrl;
      if (!fileUrl) throw new Error("Server didn't return a file URL");
      if (format === 'pdf') {
        window.open(fileUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', 'Proposal');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      messageApi.open({ key, type: 'success', content: 'Export complete!', duration: 3 });
    } catch (err: any) {
      console.error('Export Failed:', err);
      messageApi.open({ key, type: 'error', content: `Export Failed: ${err.message}` });
    }
  };

  // ─── Scope (saved views) + filtering ────────────────────────────────────────
  const scopedProposals = useMemo(() => {
    return proposals.filter((p) => {
      switch (savedView) {
        case 'mine': return p.createdBy?.id === user?.id;
        case 'sent': return p.status === 'sent';
        case 'starred': return !!starred[p.id];
        default: return true;
      }
    });
  }, [proposals, savedView, user?.id, starred]);

  const filteredProposals = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const from = dateRange?.[0] ? dayjs(dateRange[0]).startOf('day') : null;
    const to = dateRange?.[1] ? dayjs(dateRange[1]).endOf('day') : null;
    return scopedProposals.filter((p) => {
      const matchesSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.client_name?.toLowerCase().includes(q) ||
        p.createdBy?.name?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || p.status?.toLowerCase() === statusFilter;
      const matchesClient = !clientFilter || p.client_name === clientFilter;
      const matchesCreator = !creatorFilter || p.createdBy?.id === creatorFilter;
      const created = p.created_at ? dayjs(p.created_at) : null;
      const matchesDate =
        (!from || (created && !created.isBefore(from))) &&
        (!to || (created && !created.isAfter(to)));
      return matchesSearch && matchesStatus && matchesClient && matchesCreator && matchesDate;
    });
  }, [scopedProposals, searchText, statusFilter, clientFilter, creatorFilter, dateRange]);

  // Reset to first page whenever the result set changes.
  useEffect(() => { setTablePage(1); }, [savedView, searchText, statusFilter, clientFilter, creatorFilter, dateRange]);

  const clientOptions = useMemo(() => {
    const set = new Set<string>();
    proposals.forEach((p) => { if (p.client_name && p.client_name.trim()) set.add(p.client_name); });
    return Array.from(set).sort((a, b) => a.localeCompare(b)).map((name) => ({ value: name, label: name }));
  }, [proposals]);

  const creatorOptions = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; avatarUrl?: string }>();
    users.forEach((u) => { if (u.id && u.name) byId.set(u.id, { id: u.id, name: u.name, avatarUrl: u.avatar || u.avatarUrl }); });
    proposals.forEach((p) => {
      const c = p.createdBy;
      if (c?.id && c?.name && !byId.has(c.id)) byId.set(c.id, { id: c.id, name: c.name, avatarUrl: c.avatarUrl || c.avatar });
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)).map((u) => ({ value: u.id, label: u.name }));
  }, [users, proposals]);

  const statusOptions: { value: StatusKey; label: string }[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'declined', label: 'Declined' },
  ];

  const hasActiveFilters =
    searchText.trim().length > 0 || statusFilter !== 'all' || clientFilter !== null ||
    creatorFilter !== null || !!(dateRange && (dateRange[0] || dateRange[1]));

  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setClientFilter(null);
    setCreatorFilter(null);
    setDateRange(null);
  };

  const viewCounts = useMemo(() => ({
    all: proposals.length,
    mine: proposals.filter((p) => p.createdBy?.id === user?.id).length,
    sent: proposals.filter((p) => p.status === 'sent').length,
    starred: proposals.filter((p) => !!starred[p.id]).length,
  }), [proposals, user?.id, starred]);

  const lastUpdated = useMemo(() => {
    if (!proposals.length) return null;
    const latest = proposals.reduce((acc, p) => {
      const d = new Date(p.updated_at || p.created_at || 0);
      return d > acc ? d : acc;
    }, new Date(0));
    return latest.getTime() ? formatDistanceToNow(latest, { addSuffix: true }) : null;
  }, [proposals]);

  const views: { key: SavedView; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'all', label: 'All proposals', icon: <FolderOutlined />, color: '#3B82F6' },
    { key: 'mine', label: 'My proposals', icon: <UserOutlined />, color: '#64748B' },
    { key: 'sent', label: 'Sent', icon: <GlobalOutlined />, color: '#10B981' },
    { key: 'starred', label: 'Starred', icon: <StarFilled />, color: '#3B82F6' },
  ];

  // ─── Premium row/card action menu (shared by table + cards) ─────────────────
  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );

  const actionMenu = (p: any) => ({
    className: 'pp-action-menu',
    items: [
      { key: 'view', label: menuLabel('View proposal', 'Open the full view', <EyeOutlined />, '#3b82f6', 'rgba(59,130,246,0.12)') },
      { key: 'edit', disabled: !canUpdateProposal, label: menuLabel('Edit', 'Open in the builder', <EditOutlined />, '#64748b', 'rgba(100,116,139,0.12)') },
      { type: 'divider' as const },
      { key: 'pdf', label: menuLabel('Export PDF', 'Download as .pdf', <FilePdfOutlined />, '#64748b', 'rgba(100,116,139,0.12)') },
      { key: 'word', label: menuLabel('Export Word', 'Download as .docx', <FileWordOutlined />, '#3b82f6', 'rgba(59,130,246,0.12)') },
      { type: 'divider' as const },
      { key: 'delete', danger: true, disabled: !canDeleteProposal, label: menuLabel('Delete', 'Remove this proposal', <DeleteOutlined />, '#ef4444', 'rgba(239,68,68,0.12)') },
    ],
    onClick: ({ key, domEvent }: any) => {
      domEvent.stopPropagation();
      if (key === 'view') openProposal(p);
      else if (key === 'edit') router.push(`/proposals/builder?id=${p.id}`);
      else if (key === 'pdf') handleExport(p.id, 'pdf');
      else if (key === 'word') handleExport(p.id, 'word');
      else if (key === 'delete') {
        modal.confirm({
          title: 'Delete Proposal',
          content: 'Are you sure you want to delete this proposal? This action cannot be undone.',
          okText: 'Delete',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: () => handleDelete(p.id),
        });
      }
    },
  });

  // ─── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnsType<any> = [
    {
      title: 'NAME',
      dataIndex: 'title',
      key: 'title',
      width: 400,
      fixed: 'left' as const,
      render: (_: string, record: any) => {
        const isStar = !!starred[record.id];
        return (
          <div className="pp-name-cell">
            <button
              type="button"
              className={`pp-star ${isStar ? 'is-on' : ''}`}
              onClick={(e) => toggleStar(e, record)}
              aria-label={isStar ? 'Unstar' : 'Star'}
            >
              {isStar ? <StarFilled style={{ fontSize: 14 }} /> : <StarOutlined style={{ fontSize: 14 }} />}
            </button>
            <div className="pp-name-icon"><FileTextOutlined style={{ fontSize: 14 }} /></div>
            <span className="pp-name-title">{resolveTitle(record)}</span>
          </div>
        );
      },
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: any) => getStatusPill(status, record),
    },
    {
      title: 'MAIL',
      key: 'mail',
      width: 104,
      render: (_: any, record: any) => {
        const isSent = !!record.last_mail_at || !!record.is_mail_sent || record.status === 'sent';
        return (
          <button
            type="button"
            className={`pp-maillink ${isSent ? 'is-sent' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProposalForMail(record);
              setIsMailDrawerVisible(true);
            }}
          >
            {isSent ? <CheckCircleOutlined /> : <Mail size={13} />}
            {isSent ? 'Sent' : 'Send mail'}
          </button>
        );
      },
    },
    {
      title: 'CLIENT',
      dataIndex: 'client_name',
      key: 'client_name',
      width: 210,
      render: (text: string) =>
        text ? (
          <span className="pp-tag pp-tag--blue"><span className="pp-tag-dot" />{text}</span>
        ) : (
          <span className="pp-add">+ Add client</span>
        ),
    },
    {
      title: 'CREATED BY',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      width: 160,
      render: (_: any, record: any) => {
        const creator = record.createdBy;
        if (!creator?.name) return <Text className="pp-muted">—</Text>;
        return (
          <div className="pp-creator">
            <Avatar size={20} src={creator.avatarUrl || creator.avatar} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 9, fontWeight: 700 }}>
              {initialsOf(creator.name)}
            </Avatar>
            <span className="pp-creator-name">{creator.name}</span>
          </div>
        );
      },
    },
    {
      title: 'CREATED',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 118,
      render: (date: string) =>
        date ? (
          <div className="pp-date">
            <span className="pp-date-main">{dayjs(date).format('MMM D, YYYY')}</span>
            <span className="pp-date-sub">{dayjs(date).format('h:mm A')}</span>
          </div>
        ) : <Text className="pp-muted">—</Text>,
    },
    {
      title: 'UPDATED',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 118,
      render: (date: string) =>
        date ? (
          <div className="pp-date">
            <span className="pp-date-main">{dayjs(date).format('MMM D, YYYY')}</span>
            <span className="pp-date-sub">{dayjs(date).format('h:mm A')}</span>
          </div>
        ) : <Text className="pp-muted">—</Text>,
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center' as const,
      width: 72,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Dropdown
          menu={actionMenu(record)}
          overlayClassName="pp-action-pop"
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" className="pp-icon-btn" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  const total = filteredProposals.length;
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pagedProposals = filteredProposals.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  const emptyState = (
    <div className="pp-empty">
      <div className="pp-empty-orb"><Sparkles size={26} /></div>
      <div className="pp-empty-title">No proposals found</div>
      <div className="pp-empty-sub">Start by creating your first premium proposal.</div>
      {canCreateProposal && (
        <Button type="primary" icon={<PlusOutlined />} className="pp-btn-primary" onClick={() => router.push('/proposals/builder')} style={{ marginTop: 14 }}>
          New Proposal
        </Button>
      )}
    </div>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        {messageHolder}
        {modalContextHolder}

        <div className="pp-shell">
          {/* ============================ SIDEBAR ============================ */}
          <aside className="pp-sidebar">
            <div className="pp-side-head">
              <div className="pp-side-logo"><FileDoneOutlined /></div>
              <div className="pp-side-head-text">
                <div className="pp-side-title">Proposals</div>
                <div className="pp-side-subtitle">Drafts · sent · won</div>
              </div>
            </div>

            {canCreateProposal && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="pp-create-btn"
                onClick={() => router.push('/proposals/builder')}
                block
              >
                Create Proposal
              </Button>
            )}

            <div className="pp-side-scroll">
              <div className="pp-side-section-label">Views</div>
              <div className="pp-side-list">
                {views.map((v) => {
                  const active = savedView === v.key;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      className={`pp-view-item ${active ? 'is-active' : ''}`}
                      onClick={() => setSavedView(v.key)}
                    >
                      <span className="pp-view-icon" style={{ color: active ? v.color : 'var(--text-slate-400)' }}>{v.icon}</span>
                      <span className="pp-view-label">{v.label}</span>
                      <span className="pp-view-count">{viewCounts[v.key]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pp-side-section-label">Filters</div>
              <div className="pp-side-filters">
                <SearchableDropdown
                  className="pp-side-sd"
                  placeholder="Project"
                  searchPlaceholder="Search clients"
                  itemNoun="clients"
                  value={clientFilter ?? undefined}
                  onChange={(v) => setClientFilter(v ?? null)}
                  options={clientOptions}
                  width={232}
                  disabled={clientOptions.length === 0}
                />
                <SearchableDropdown
                  className="pp-side-sd"
                  placeholder="Status"
                  searchPlaceholder="Search statuses"
                  itemNoun="statuses"
                  value={statusFilter === 'all' ? undefined : statusFilter}
                  onChange={(v) => setStatusFilter((v as StatusKey) ?? 'all')}
                  options={statusOptions.filter((s) => s.value !== 'all')}
                  width={232}
                />
                <SearchableDropdown
                  className="pp-side-sd"
                  placeholder="Created by"
                  searchPlaceholder="Search people"
                  itemNoun="people"
                  value={creatorFilter ?? undefined}
                  onChange={(v) => setCreatorFilter(v ?? null)}
                  options={creatorOptions}
                  width={232}
                  disabled={creatorOptions.length === 0}
                />
                <RangePicker
                  className="pp-side-range"
                  value={dateRange}
                  onChange={(d) => setDateRange(d)}
                  placeholder={['Start date', 'End date']}
                  separator={<span style={{ color: 'var(--text-slate-400)' }}>›</span>}
                  suffixIcon={null}
                  format="MMM D"
                />
                {hasActiveFilters && (
                  <button type="button" className="pp-clear-filters" onClick={clearFilters}>
                    <CloseCircleOutlined /> Clear filters
                  </button>
                )}
              </div>

              <div className="pp-side-section-label">Recently opened</div>
              <div className="pp-side-recents">
                {recents.length === 0 ? (
                  <div className="pp-recents-empty">Proposals you open appear here</div>
                ) : (
                  recents.map((r) => (
                    <button key={r.id} type="button" className="pp-recent-item" onClick={() => setPreviewProposal(r)}>
                      <FileTextOutlined className="pp-recent-icon" />
                      <div className="pp-recent-body">
                        <span className="pp-recent-title">{r.title}</span>
                        <span className="pp-recent-sub">{r.client_name || 'No client'} · {formatDistanceToNow(new Date(r.ts), { addSuffix: true })}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <button type="button" className="pp-trash" onClick={() => messageApi.info('No trashed proposals')}>
              <RestOutlined /> Trash
            </button>
          </aside>

          {/* ============================ MAIN ============================ */}
          <main className="pp-main">
            {/* Search / status / view toggle bar */}
            <div className="pp-topbar">
              <div className="pp-search-wrap">
                <SearchOutlined className="pp-search-icon" />
                <input
                  ref={searchRef}
                  className="pp-search"
                  placeholder="Search proposals, clients, creators…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <span className="pp-kbd">⌘K</span>
              </div>

              <div className="pp-topbar-meta">
                <span className="pp-meta-item"><span className="pp-pulse" /><strong>{proposals.length}</strong> proposals</span>
                <span className="pp-meta-dot">·</span>
                <span className="pp-meta-item"><strong>{stats.sent}</strong> sent</span>
                {lastUpdated && (<><span className="pp-meta-dot">·</span><span className="pp-meta-item">Updated {lastUpdated}</span></>)}
              </div>

              <div className="pp-topbar-actions">
                <div className="pp-segmented">
                  <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                  <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
                </div>
                <Tooltip title="Refresh">
                  <button type="button" className="pp-ghost-btn" onClick={handleRefresh}><ReloadOutlined spin={loading} /></button>
                </Tooltip>
              </div>
            </div>

            <div className="pp-divider" />

            {/* Stat cards */}
            <div className="pp-stats">
              {statCells.map((s) => (
                <div key={s.key} className="pp-stat-card">
                  <div className="pp-stat-top">
                    <div className="pp-stat-left">
                      <span className="pp-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                      <span className="pp-stat-label">{s.title}</span>
                    </div>
                    {s.delta > 0 && (
                      <span className="pp-stat-delta"><RiseOutlined style={{ fontSize: 9 }} />+{s.delta}</span>
                    )}
                  </div>
                  <div className="pp-stat-bottom">
                    <div className="pp-stat-value-wrap">
                      <span className="pp-stat-value">{s.value}{s.suffix}</span>
                      <span className="pp-stat-period">this week</span>
                    </div>
                    <div className="pp-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table / grid */}
            <div className="pp-body">
              {view === 'list' ? (
                <div className="pp-table-wrap">
                  <Table
                    columns={columns}
                    dataSource={pagedProposals}
                    loading={loading}
                    rowKey="id"
                    size="small"
                    className="pp-table"
                    scroll={{ x: 1282 }}
                    rowSelection={{ selectedRowKeys: selectedKeys, onChange: (keys) => setSelectedKeys(keys), columnWidth: 40 }}
                    pagination={false}
                    locale={{ emptyText: emptyState }}
                    onRow={(record) => ({
                      onClick: (e) => {
                        const t = e.target as HTMLElement;
                        if (t.closest('.ant-checkbox-wrapper, .ant-table-selection-column, button, input, .ant-select, .ant-dropdown-trigger, .pp-star, .pp-maillink')) return;
                        openProposal(record);
                      },
                      className: 'pp-row',
                    })}
                  />
                </div>
              ) : (
                <div className="pp-grid">
                  {loading ? (
                    <div className="pp-grid-loading">Loading…</div>
                  ) : filteredProposals.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1' }}>{emptyState}</div>
                  ) : (
                    filteredProposals.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize).map((p) => {
                      const sKey = (p.status?.toLowerCase() || 'draft') as Exclude<StatusKey, 'all'>;
                      const meta = STATUS_META[sKey] || STATUS_META.draft;
                      const accent = accentFor(p.id || p.client_name || p.title || '');
                      const title = resolveTitle(p);
                      const created = p.created_at ? dayjs(p.created_at) : null;
                      const updated = p.updated_at ? dayjs(p.updated_at) : null;
                      const isSent = !!p.last_mail_at || !!p.is_mail_sent || sKey === 'sent';
                      return (
                        <div key={p.id} className="pc-card" onClick={() => openProposal(p)}>
                          <div className="pc-top">
                            <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
                              {initialsOf(p.client_name || title)}
                            </div>
                            <div className="pc-identity-body">
                              <div className="pc-title">{title}</div>
                              <div className="pc-client-line">
                                <span className="pc-client-key">Client:</span>
                                <span className="pc-client-val">{p.client_name || 'No client'}</span>
                              </div>
                            </div>
                            <Dropdown
                              menu={actionMenu(p)}
                              overlayClassName="pp-action-pop"
                              trigger={['click']}
                              placement="bottomRight"
                            >
                              <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                                <EllipsisOutlined />
                              </button>
                            </Dropdown>
                          </div>

                          <div className="pc-foot">
                            <div className="pc-foot-row">
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Created by</span>
                                <Avatar size={16} src={p.createdBy?.avatarUrl || p.createdBy?.avatar} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 8, fontWeight: 700 }}>
                                  {initialsOf(p.createdBy?.name || '—')}
                                </Avatar>
                                <span className="pc-foot-val">{p.createdBy?.name || '—'}</span>
                              </span>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Created</span>
                                <span className="pc-foot-val">{created ? created.format('MMM D, YYYY · h:mm A') : '—'}</span>
                              </span>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Updated</span>
                                <span className="pc-foot-val">{updated ? updated.format('MMM D, YYYY · h:mm A') : '—'}</span>
                              </span>
                            </div>
                            <div className="pc-foot-row">
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Status:</span>
                                <span className="pc-status-tag" style={{ color: meta.color, background: meta.bg }}>
                                  {meta.icon}{meta.label}
                                </span>
                              </span>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Mail:</span>
                                <span className="pc-mail-val" style={{ color: isSent ? '#10b981' : '#94a3b8' }}>
                                  {isSent ? <CheckCircleOutlined /> : <Mail size={12} />}
                                  {isSent ? 'Sent' : 'Not sent'}
                                </span>
                              </span>
                              <span className="pc-foot-div" />
                              <button
                                type="button"
                                className="pc-foot-item pc-view-btn"
                                onClick={(e) => { e.stopPropagation(); setPreviewProposal(p); }}
                              >
                                <EyeOutlined />
                                View Proposal
                              </button>
                              <span className="pc-foot-div" />
                              <button
                                type="button"
                                className="pc-foot-item pc-timeline-btn"
                                onClick={(e) => { e.stopPropagation(); setActivityProposal(p); }}
                              >
                                <HistoryOutlined />
                                <span className="pc-foot-key">Timeline</span>
                                <span className="pc-timeline-view">View</span>
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
              <div className="pp-footer pp-footer--sticky">
                <div className="pp-footer-info">
                  Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
                  {selectedKeys.length > 0 && <span className="pp-footer-sel"> · {selectedKeys.length} selected</span>}
                </div>
                <div className="pp-pager">
                  <button type="button" className="pp-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
                    <button key={p} type="button" className={`pp-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
                  ))}
                  <button type="button" className="pp-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
                  <Select
                    className="pp-pagesize"
                    value={tablePageSize}
                    onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
                    options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
                    popupMatchSelectWidth={120}
                  />
                </div>
              </div>
            )}
          </main>
        </div>

        <LeadMailDrawer
          visible={isMailDrawerVisible}
          onClose={() => { setIsMailDrawerVisible(false); setSelectedProposalForMail(null); }}
          lead={selectedProposalForMail ? {
            id: selectedProposalForMail.lead_id || selectedProposalForMail.id,
            title: selectedProposalForMail.title,
            client_name: selectedProposalForMail.client_name,
            client_mail: selectedProposalForMail.client_mail || '',
            proposal_id: selectedProposalForMail.id,
            last_mail_at: selectedProposalForMail.last_mail_at,
            is_mail_sent: selectedProposalForMail.is_mail_sent,
          } as any : null}
          fromEmail={invoiceMailSettings?.email}
          onSuccess={() => { setIsMailDrawerVisible(false); setSelectedProposalForMail(null); fetchProposals(); }}
        />

        <ProposalActivityDrawer
          open={!!activityProposal}
          onClose={() => setActivityProposal(null)}
          proposal={activityProposal ? { id: activityProposal.id, title: resolveTitle(activityProposal), client_name: activityProposal.client_name } : null}
        />

        <ProposalPreviewDrawer
          open={!!previewProposal}
          onClose={() => setPreviewProposal(null)}
          canEdit={canUpdateProposal}
          proposal={previewProposal ? { id: previewProposal.id, title: resolveTitle(previewProposal), client_name: previewProposal.client_name } : null}
        />

        <style jsx global>{`
          .pp-shell {
            display: flex;
            margin: 0 -16px;
            min-height: calc(100vh - 54px);
            background: var(--bg-pure-white);
          }

          /* ---------------- Sidebar ---------------- */
          .pp-sidebar {
            width: 240px;
            flex-shrink: 0;
            border-right: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            display: flex;
            flex-direction: column;
            padding: 14px 14px 0;
            position: sticky;
            top: 0;
            height: calc(100vh - 54px);
          }
          .pp-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .pp-side-logo {
            flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          }
          .pp-side-logo .anticon { font-size: 24px !important; color: var(--text-slate-900) !important; }
          .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .pp-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .pp-create-btn {
            height: 32px !important; border-radius: 0 !important; font-weight: 600 !important; font-size: 12.5px !important;
            background: #3B82F6 !important;
            border: none !important; box-shadow: none !important;
            margin-bottom: 4px;
          }
          .pp-create-btn:hover { background: #2563EB !important; }
          .pp-create-btn .anticon { font-size: 12px !important; }
          .pp-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .pp-side-scroll::-webkit-scrollbar { width: 5px; }
          .pp-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .pp-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .pp-side-scroll > .pp-side-section-label:first-child { margin-top: 6px; }
          .pp-side-list { display: flex; flex-direction: column; gap: 1px; }
          .pp-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left;
          }
          .pp-view-item:hover { background: var(--bg-slate-50); }
          .pp-view-item.is-active { background: var(--bg-blue-50); }
          .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
          .pp-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
          .pp-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          .pp-view-count {
            font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
            min-width: 18px; text-align: right;
          }
          .pp-view-item.is-active .pp-view-count {
            color: #3B82F6; font-weight: 700;
            background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
          }
          .pp-side-filters { display: flex; flex-direction: column; gap: 7px; padding: 0; }
          .pp-side-sd { border-radius: 0 !important; }
          .pp-side-select .ant-select-selector,
          .pp-side-range.ant-picker {
            border-radius: 0 !important; border-color: var(--border-slate-200) !important;
            background: var(--bg-pure-white) !important;
          }
          .pp-side-select { width: 100%; }
          .pp-side-select .ant-select-selector { height: 36px !important; padding: 0 11px !important; display: flex; align-items: center; }
          .pp-side-select .ant-select-selection-placeholder,
          .pp-side-select .ant-select-selection-item { font-size: 13px; line-height: 34px !important; }
          .pp-side-range { width: 100%; height: 36px; border-style: dashed !important; }
          .pp-side-range .ant-picker-input > input { font-size: 12.5px; }
          .pp-clear-filters {
            display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
            background: none; border: none; cursor: pointer; padding: 3px;
            font-size: 12px; font-weight: 600; color: #ef4444;
          }
          .pp-side-recents { display: flex; flex-direction: column; }
          .pp-recents-empty { font-size: 11px; color: var(--text-slate-400); padding: 2px 8px; }
          .pp-recent-item {
            display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
            padding: 5px 8px; border: none; background: transparent; cursor: pointer;
            border-bottom: 1px solid var(--border-slate-100);
            transition: background .12s ease;
          }
          .pp-recent-item:last-child { border-bottom: none; }
          .pp-recent-item:hover { background: var(--bg-slate-50); }
          .pp-recent-icon { font-size: 12px; color: #3B82F6; flex-shrink: 0; }
          .pp-recent-body { display: flex; flex-direction: column; min-width: 0; gap: 0; }
          .pp-recent-title { font-size: 11.5px; font-weight: 600; color: var(--text-slate-900); line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .pp-recent-sub { font-size: 9.5px; color: var(--text-slate-400); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .pp-trash {
            display: flex; align-items: center; gap: 10px; flex-shrink: 0; text-align: left;
            margin: 0 -14px; padding: 12px 22px;
            border-top: 1px solid var(--border-slate-200);
            background: transparent; color: var(--text-slate-600); font-size: 13px; font-weight: 500; cursor: pointer;
          }
          .pp-trash .anticon { font-size: 15px; }
          .pp-trash:hover { color: #ef4444; }

          /* ---------------- Main ---------------- */
          .pp-main { flex: 1; min-width: 0; padding: 8px 18px 0; display: flex; flex-direction: column; }
          .pp-body { flex: 1 0 auto; }
          .pp-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
          .pp-search-wrap {
            position: relative; flex: 1; max-width: 520px; display: flex; align-items: center;
            height: 32px; border-radius: 8px; background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200); padding: 0 10px;
          }
          .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
          .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
          .pp-search {
            flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
            font-size: 13px; color: var(--text-slate-900);
          }
          .pp-search::placeholder { color: var(--text-slate-400); }
          .pp-kbd {
            font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
            background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
            border-radius: 5px; padding: 1px 6px;
          }
          .pp-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
          .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
          .pp-meta-dot { color: var(--text-slate-300); }
          .pp-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
          .pp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
          .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
          .pp-segmented button {
            width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
            color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
          }
          .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
          .pp-ghost-btn {
            width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
            display: inline-flex; align-items: center; justify-content: center;
          }
          .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }

          .pp-divider { height: 1px; background: var(--border-slate-200); margin: 0 -18px 10px; }

          /* Stat cards */
          .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
          .pp-stat-card {
            background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
            border-radius: 0; padding: 12px 14px; min-height: 92px;
            display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
            box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          }
          .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
          .pp-stat-left { display: flex; align-items: center; gap: 8px; }
          .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
          .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
          .pp-stat-delta {
            display: inline-flex; align-items: center; gap: 2px; font-size: 10.5px; font-weight: 700;
            color: #10b981; background: rgba(16,185,129,0.10); border-radius: 6px; padding: 1px 6px;
          }
          .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
          .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
          .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
          .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
          .pp-stat-spark { opacity: 0.95; }

          /* Table */
          .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
          .pp-table .ant-table { background: transparent; font-size: 12px; }
          .pp-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
            font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
            text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
            white-space: nowrap !important;
          }
          .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
          .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
          .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
          .pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }
          .pp-table .ant-table-selection-column { padding-inline: 6px !important; }

          .pp-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
          .pp-star { background: none; border: none; cursor: pointer; padding: 0; color: var(--text-slate-300); line-height: 0; flex-shrink: 0; }
          .pp-star:hover, .pp-star.is-on { color: #3B82F6; }
          .pp-star .anticon { font-size: 13px !important; }
          .pp-name-icon {
            width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center; color: #3B82F6;
            background: var(--bg-blue-50);
          }
          .pp-name-icon .anticon { font-size: 12px !important; }
          .pp-name-title { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          .pp-tag {
            display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px;
            border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap;
          }
          .pp-tag--blue { background: var(--bg-blue-50); color: #3B82F6; }
          .pp-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
          .pp-add { font-size: 11.5px; color: var(--text-slate-400); cursor: default; }
          .pp-muted { color: var(--text-slate-400); }

          .pp-maillink {
            display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer;
            font-size: 11.5px; font-weight: 700; color: #3B82F6; padding: 0;
          }
          .pp-maillink.is-sent { color: #10b981; }

          .pp-creator { display: flex; align-items: center; gap: 6px; }
          .pp-creator-name { font-size: 11.5px; color: var(--text-slate-700); white-space: nowrap; }
          .pp-date { display: flex; flex-direction: column; line-height: 1.25; }
          .pp-date-main { font-size: 11px; font-weight: 500; color: var(--text-slate-700); }
          .pp-date-sub { font-size: 9.5px; color: var(--text-slate-400); }

          .pp-vis-pill {
            display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
            border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
          }
          .pp-vis-dot { width: 6px; height: 6px; border-radius: 50%; }
          .pp-status-opt { display: inline-flex; align-items: center; gap: 8px; }
          .pp-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
          .pp-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

          /* Footer + pager */
          .pp-footer {
            display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
            padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
          }
          .pp-footer--sticky {
            position: sticky; bottom: 0; z-index: 30; margin: 8px -18px 0; padding: 12px 18px;
            background: var(--bg-pure-white);
            box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          }
          .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
          .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
          .pp-footer-sel { color: #3B82F6; font-weight: 600; }
          .pp-pager { display: flex; align-items: center; gap: 3px; }
          .pp-pager-btn, .pp-pager-num {
            min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          }
          .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
          .pp-pagesize { margin-left: 5px; }
          .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

          /* Empty + grid */
          .pp-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
          .pp-empty-orb {
            width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
            background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
          }
          .pp-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
          .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }
          .pp-btn-primary {
            background: #3B82F6 !important; border: none !important;
            border-radius: 0 !important; font-weight: 600 !important;
          }
          .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

          .pc-card {
            border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
            cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
            transition: box-shadow .15s ease, border-color .15s ease;
          }
          .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

          .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
          .pc-avatar {
            width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-weight: 800; font-size: 12px;
          }
          .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
          .pc-actions {
            flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
            background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
          }
          .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
          .pc-title {
            font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          }
          .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
          .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
          .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
          .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
          .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
          .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
          .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
          .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
          .pc-timeline-btn { background: none; border: none; cursor: pointer; padding: 0; color: #3b82f6; }
          .pc-timeline-btn .pc-foot-key { color: #3b82f6; }
          .pc-timeline-btn .anticon { font-size: 12px; }
          .pc-timeline-btn:hover { text-decoration: underline; }
          .pc-timeline-view { font-size: 10.5px; font-weight: 700; color: #3b82f6; }
          .pc-view-btn {
            background: none; border: none; cursor: pointer; padding: 0;
            color: #3B82F6; font-weight: 700; font-size: 11.5px;
          }
          .pc-view-btn .anticon { font-size: 12px; }
          .pc-view-btn:hover { text-decoration: underline; }

          /* Premium action dropdown */
          .pp-action-pop .ant-dropdown-menu {
            padding: 6px; border-radius: 0; min-width: 236px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          }
          .pp-action-pop .ant-dropdown-menu-item {
            padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
            transition: background .12s ease;
          }
          .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
          .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
          .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
          .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
          .pp-menu-ic {
            width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
          }
          .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
          .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
          .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
          .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
          .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
          .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
          .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }
          .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }
          .pc-status-tag .anticon { font-size: 9px; }
          .pc-mail-val { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; }

          @media (max-width: 700px) {
            .pp-grid { grid-template-columns: 1fr; }
          }

          @media (max-width: 1100px) {
            .pp-stats { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 820px) {
            .pp-sidebar { display: none; }
            .pp-topbar-meta { display: none; }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
