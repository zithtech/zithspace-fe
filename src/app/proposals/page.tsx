'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Button,
  Table,
  Space,
  Input,
  App,
  Dropdown,
  Tooltip,
  Popconfirm,
  Segmented,
  Select,
  Modal,
  Popover,
  Switch,
} from 'antd';
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
  DownloadOutlined,
  SendOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  RiseOutlined,
  FilterOutlined,
  UserOutlined,
  TeamOutlined,
  EllipsisOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Sparkles, Settings, Layers, Mail } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { ProposalService } from '@/services/proposalService';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { TablePreferenceService } from '@/services/tablePreferenceService';
import { MailService } from '@/services/mailService';
import { LeadMailDrawer } from '@/components/leads/LeadMailDrawer';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

type StatusKey = 'all' | 'draft' | 'sent' | 'accepted' | 'declined';

const STATUS_META: Record<Exclude<StatusKey, 'all'>, { label: string; color: string; bg: string; ring: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: '#64748b', bg: 'rgba(100,116,139,0.10)', ring: 'rgba(100,116,139,0.25)', icon: <ClockCircleOutlined /> },
  sent: { label: 'Sent', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', ring: 'rgba(59,130,246,0.25)', icon: <SendOutlined /> },
  accepted: { label: 'Accepted', color: '#10b981', bg: 'rgba(16,185,129,0.10)', ring: 'rgba(16,185,129,0.25)', icon: <CheckCircleOutlined /> },
  declined: { label: 'Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', ring: 'rgba(239,68,68,0.25)', icon: <CloseCircleOutlined /> },
};

// Compact 7-day bar sparkline for the stats strip.
const Sparkline = ({ values, color }: { values: number[]; color: string }) => {
  const max = Math.max(...values, 1);
  const w = 70;
  const h = 26;
  const gap = 2;
  const bw = (w - (values.length - 1) * gap) / values.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {values.map((v, i) => {
        const bh = Math.max(2, (v / max) * h);
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={1.5}
            fill={color}
            opacity={0.18 + (v / max) * 0.62}
          />
        );
      })}
    </svg>
  );
};

const PROPOSALS_TABLE_KEY = "proposals_v1";
type PropDensity = "compact" | "comfortable" | "spacious";

const TOGGLEABLE_COLUMNS: { key: string; label: string }[] = [
  { key: 'title', label: 'Proposal Title' },
  { key: 'client_name', label: 'Client' },
  { key: 'status', label: 'Status' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'created_at', label: 'Created Date' },
  { key: 'updated_at', label: 'Last Updated' },
  { key: 'mail', label: 'Mail' },
  { key: 'actions', label: 'Actions' },
];

const DEFAULT_HIDDEN_COLS: Record<string, boolean> = {
  createdBy: false,
  updated_at: false,
};

export default function ProposalsListPage() {
  const { user, isLoading } = useAuth();
  const { canReadProposal, canCreateProposal, canUpdateProposal, canDeleteProposal } = usePermission();
  const router = useRouter();

  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [tableDensity, setTableDensity] = useState<PropDensity>("comfortable");
  const [hiddenCols, setHiddenCols] = useState<Record<string, boolean>>(DEFAULT_HIDDEN_COLS);
  const [tablePrefsLoaded, setTablePrefsLoaded] = useState(false);
  const tablePrefsSaveTimer = React.useRef<number | null>(null);
  const [isMailDrawerVisible, setIsMailDrawerVisible] = useState(false);
  const [selectedProposalForMail, setSelectedProposalForMail] = useState<any>(null);
  const [invoiceMailSettings, setInvoiceMailSettings] = useState<any>(null);

  // Load saved preferences
  useEffect(() => {
    (async () => {
      try {
        const [saved, invoiceSettings] = await Promise.all([
          TablePreferenceService.get<{
            density?: PropDensity;
            hiddenCols?: Record<string, boolean>;
          }>(PROPOSALS_TABLE_KEY),
          MailService.getInvoiceMailSettings()
        ]);

        if (saved?.density) setTableDensity(saved.density);
        if (saved?.hiddenCols) setHiddenCols(saved.hiddenCols);

        if (invoiceSettings) {
          const settings = (invoiceSettings as any).settings || [];
          setInvoiceMailSettings(settings.find((s: any) => s.is_default_invoice_mail) || settings[0] || null);
        }
      } catch (err) {
        console.warn("Failed to load table preferences or mail settings", err);
      } finally {
        setTablePrefsLoaded(true);
      }
    })();
  }, []);

  // Persist preferences
  useEffect(() => {
    if (!tablePrefsLoaded) return;
    if (tablePrefsSaveTimer.current !== null) window.clearTimeout(tablePrefsSaveTimer.current);
    tablePrefsSaveTimer.current = window.setTimeout(() => {
      TablePreferenceService.save(PROPOSALS_TABLE_KEY, {
        density: tableDensity,
        hiddenCols,
      }).catch((err) => console.warn("Failed to save table preferences", err));
    }, 300);
    return () => {
      if (tablePrefsSaveTimer.current !== null) window.clearTimeout(tablePrefsSaveTimer.current);
    };
  }, [tablePrefsLoaded, tableDensity, hiddenCols]);

  const { message: messageApi } = App.useApp();
  const [modal, modalContextHolder] = Modal.useModal();

  // ─── Route Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && user && !canReadProposal) {
      router.push("/dashboard");
    }
  }, [user, isLoading, canReadProposal, router]);

  const fetchProposals = async (showToast = false) => {
    try {
      setLoading(true);
      const data = await ProposalService.getProposals();

      if (Array.isArray(data)) {
        setProposals(data);
      } else if (data && Array.isArray(data.data)) {
        setProposals(data.data);
      } else {
        setProposals([]);
      }
      if (showToast) {
        messageApi.success('Proposals list refreshed');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      if (err.status !== 401) {
        messageApi.error('Failed to load proposals');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
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

  const getStatusTag = (status: string) => {
    const s = (status?.toLowerCase() || '') as Exclude<StatusKey, 'all'>;
    const meta = STATUS_META[s];
    if (!meta) {
      return (
        <span className="prop-status">
          <span className="prop-status__dot" style={{ background: '#94a3b8' }} />
          {status || '—'}
        </span>
      );
    }
    return (
      <span
        className="prop-status"
        style={{
          color: meta.color,
          background: meta.bg,
          borderColor: meta.ring,
        }}
      >
        <span className="prop-status__dot" style={{ background: meta.color, boxShadow: `0 0 0 3px ${meta.bg}` }} />
        {meta.label}
      </span>
    );
  };

  const stats = useMemo(() => {
    const total = proposals.length;
    const drafts = proposals.filter((p) => p.status === 'draft').length;
    const sent = proposals.filter((p) => p.status === 'sent').length;
    const accepted = proposals.filter((p) => p.status === 'accepted').length;
    const declined = proposals.filter((p) => p.status === 'declined').length;
    const winRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, drafts, sent, accepted, declined, winRate };
  }, [proposals]);

  // 7-day creation trends per metric for the sparkline strip.
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

    const totalTrend = trendFor(() => true);
    const weekTotal = totalTrend.reduce((a, b) => a + b, 0);

    return [
      {
        key: 'total',
        title: 'Total Proposals',
        value: stats.total,
        suffix: undefined,
        icon: <SnippetsOutlined />,
        color: '#3b82f6',
        tint: 'rgba(59,130,246,0.10)',
        trend: totalTrend,
        delta: weekTotal > 0 ? `+${weekTotal}` : null,
      },
      {
        key: 'drafts',
        title: 'In Draft',
        value: stats.drafts,
        suffix: undefined,
        icon: <ClockCircleOutlined />,
        color: '#64748b',
        tint: 'rgba(100,116,139,0.10)',
        trend: trendFor((p) => p.status === 'draft'),
        delta: null,
      },
      {
        key: 'sent',
        title: 'Sent to Clients',
        value: stats.sent,
        suffix: undefined,
        icon: <SendOutlined />,
        color: '#8b5cf6',
        tint: 'rgba(139,92,246,0.10)',
        trend: trendFor((p) => p.status === 'sent'),
        delta: null,
      },
      {
        key: 'winrate',
        title: 'Win Rate',
        value: stats.winRate,
        suffix: '%',
        icon: <CheckCircleOutlined />,
        color: '#10b981',
        tint: 'rgba(16,185,129,0.10)',
        trend: trendFor((p) => p.status === 'accepted'),
        delta: stats.accepted > 0 ? `${stats.accepted} won` : null,
      },
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

  const filteredProposals = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return proposals.filter((p) => {
      const matchesSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.client_name?.toLowerCase().includes(q) ||
        p.createdBy?.name?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || p.status?.toLowerCase() === statusFilter;
      const matchesClient = !clientFilter || p.client_name === clientFilter;
      const matchesCreator = !creatorFilter || p.createdBy?.id === creatorFilter;
      return matchesSearch && matchesStatus && matchesClient && matchesCreator;
    });
  }, [proposals, searchText, statusFilter, clientFilter, creatorFilter]);

  // Unique options for the filter dropdowns, derived from loaded proposals.
  const clientOptions = useMemo(() => {
    const set = new Set<string>();
    proposals.forEach((p) => {
      if (p.client_name && p.client_name.trim()) set.add(p.client_name);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));
  }, [proposals]);

  const creatorOptions = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; avatarUrl?: string }>();
    proposals.forEach((p) => {
      const c = p.createdBy;
      if (c?.id && c?.name) byId.set(c.id, c);
    });
    return Array.from(byId.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((u) => ({ value: u.id, label: u.name, avatarUrl: u.avatarUrl }));
  }, [proposals]);

  const statusOptions: { value: StatusKey; label: string; color?: string }[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'draft', label: 'Draft', color: STATUS_META.draft.color },
    { value: 'sent', label: 'Sent', color: STATUS_META.sent.color },
    { value: 'accepted', label: 'Accepted', color: STATUS_META.accepted.color },
    { value: 'declined', label: 'Declined', color: STATUS_META.declined.color },
  ];

  const hasActiveFilters =
    searchText.trim().length > 0 ||
    statusFilter !== 'all' ||
    clientFilter !== null ||
    creatorFilter !== null;

  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setClientFilter(null);
    setCreatorFilter(null);
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

  const initialsOf = (name: string) =>
    (name || '—')
      .split(' ')
      .map((s: string) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const columns = [
    {
      title: 'PROPOSAL',
      dataIndex: 'title',
      key: 'title',
      render: (_: string, record: any) => (
        <Space size="middle" className="prop-cell-title">
          <div className="prop-cell-title__icon">
            <SnippetsOutlined />
          </div>
          <div>
            <Text strong className="prop-cell-title__name">{resolveTitle(record)}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'CLIENT',
      dataIndex: 'client_name',
      key: 'client_name',
      render: (text: string) => (
        <div className="prop-client">
          <div className="prop-client__avatar">{initialsOf(text)}</div>
          <Text className="prop-client__name">{text || '—'}</Text>
        </div>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'CREATED BY',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (_: any, record: any) => {
        const creator = record.createdBy;
        if (!creator || !creator.name) {
          return <Text className="prop-creator__missing">—</Text>;
        }
        return (
          <div className="prop-creator">
            {creator.avatarUrl ? (
              <img className="prop-creator__avatar" src={creator.avatarUrl} alt={creator.name} />
            ) : (
              <div className="prop-creator__avatar prop-creator__avatar--initials">
                {initialsOf(creator.name)}
              </div>
            )}
            <Text className="prop-creator__name">{creator.name}</Text>
          </div>
        );
      },
    },
    {
      title: 'CREATED',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <Text className="prop-time">
          <ClockCircleOutlined style={{ marginRight: 6, opacity: 0.6 }} />
          {dayjs(date).format('MMM D, YYYY')}
        </Text>
      ),
    },
    {
      title: 'LAST UPDATED',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => (
        <Text className="prop-time">
          <ClockCircleOutlined style={{ marginRight: 6, opacity: 0.6 }} />
          {dayjs(date).format('MMM D · h:mm A')}
        </Text>
      ),
    },
    {
      title: 'Mail',
      key: 'mail',
      width: 140,
      render: (_: any, record: any) => {
        const isSent = !!record.last_mail_at || !!record.is_mail_sent || record.status === 'sent';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              type="link"
              icon={isSent ? <CheckCircleOutlined style={{ color: '#10b981' }} /> : <Mail size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProposalForMail(record);
                setIsMailDrawerVisible(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isSent ? '#10b981' : 'var(--premium-blue)',
                fontWeight: 700,
                fontSize: 13,
                padding: 0,
                height: 'auto'
              }}
            >
              {isSent ? 'Sent' : 'Send Mail'}
            </Button>
            {record.last_mail_at && (
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, paddingLeft: 20, marginTop: -2 }}>
                {dayjs(record.last_mail_at).format('MMM D, YYYY')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      align: 'right' as const,
      width: 80,
      render: (_: any, record: any) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: 'View', icon: <EyeOutlined /> },
              { key: 'edit', label: 'Edit', icon: <EditOutlined />, disabled: !canUpdateProposal },
              {
                key: 'download', label: 'Download', icon: <DownloadOutlined />, children: [
                  { key: 'pdf', label: 'PDF Document', icon: <FilePdfOutlined style={{ color: '#ef4444' }} /> },
                  { key: 'word', label: 'Word Document', icon: <FileWordOutlined style={{ color: '#2563eb' }} /> },
                ]
              },
              { type: 'divider' },
              { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, disabled: !canDeleteProposal },
            ],
            onClick: ({ key }) => {
              if (key === 'view') router.push(`/proposals/${record.id}`);
              else if (key === 'edit') router.push(`/proposals/builder?id=${record.id}`);
              else if (key === 'pdf') handleExport(record.id, 'pdf');
              else if (key === 'word') handleExport(record.id, 'word');
              else if (key === 'delete') {
                modal.confirm({
                  title: 'Delete Proposal',
                  content: 'Are you sure you want to delete this proposal? This action cannot be undone.',
                  okText: 'Delete',
                  okType: 'danger',
                  cancelText: 'Cancel',
                  onOk: () => handleDelete(record.id),
                });
              }
            },
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" className="prop-icon-btn" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ].filter(col => !hiddenCols[col.key as string]);

  return (
    <ProtectedRoute>
      <MainLayout>
        {modalContextHolder}

        <div className="prop-page">
          {/* Page header - STICKY */}
          <div className="prop-sticky">
            <div className="prop-header">
              <div className="prop-header__left">
                <div className="prop-header__icon">
                  <SnippetsOutlined />
                </div>
                <div className="prop-header__text">
                  <Title level={4} className="prop-header__title">Proposals</Title>
                  <span className="prop-header__divider" aria-hidden="true" />
                  <Text className="prop-header__sub">Manage and track your winning business proposals</Text>
                </div>
              </div>
              <div className="prop-header__right">
                <Button
                  type="default"
                  className="prop-cta-secondary"
                  icon={<ReloadOutlined />}
                  onClick={() => fetchProposals(true)}
                  loading={loading}
                >
                  Refresh
                </Button>
                {canCreateProposal && (
                  <Button
                    type="primary"
                    className="prop-cta-primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push('/proposals/builder')}
                  >
                    New Proposal
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip — doc-hub style */}
          <div className="prop-stats-strip" style={{ marginTop: 24 }}>
            {statCells.map((s, i) => (
              <div
                key={s.key}
                className={`prop-stat-cell ${i < statCells.length - 1 ? 'prop-stat-cell--divider' : ''}`}
              >
                <div
                  className="prop-stat-cell__icon"
                  style={{ background: s.tint, color: s.color }}
                >
                  {s.icon}
                </div>
                <div className="prop-stat-cell__body">
                  <span className="prop-stat-cell__label">{s.title}</span>
                  <div className="prop-stat-cell__value-row">
                    <span className="prop-stat-cell__value">
                      {s.value}
                      {s.suffix && <span className="prop-stat-cell__suffix">{s.suffix}</span>}
                    </span>
                    {s.delta && (
                      <Tooltip title="New this week">
                        <span
                          className="prop-stat-cell__delta"
                          style={{ background: s.tint, color: s.color }}
                        >
                          <RiseOutlined style={{ fontSize: 8 }} />
                          {s.delta}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div className="prop-stat-cell__spark">
                  <Sparkline values={s.trend} color={s.color} />
                  <span className="prop-stat-cell__spark-label">7d</span>
                </div>
              </div>
            ))}
          </div>

          {/* Filter bar — dedicated layout for search + filters */}
          <div className="prop-filterbar">
            <div className="prop-filterbar__group prop-filterbar__group--search">
              <Input
                placeholder="Search proposals, clients, creators…"
                prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="prop-search"
                allowClear
              />
            </div>

            <span className="prop-filterbar__sep" />

            <div className="prop-filterbar__group">
              <FilterOutlined className="prop-filterbar__group-icon" />
              <Select
                className="prop-filter-select"
                placeholder={<span><TeamOutlined style={{ marginRight: 6, opacity: 0.6 }} />Client</span>}
                value={clientFilter}
                onChange={(v) => setClientFilter(v ?? null)}
                options={clientOptions}
                showSearch
                allowClear
                optionFilterProp="label"
                popupMatchSelectWidth={260}
                disabled={clientOptions.length === 0}
              />
              <Select
                className="prop-filter-select"
                placeholder={<span><UserOutlined style={{ marginRight: 6, opacity: 0.6 }} />Created by</span>}
                value={creatorFilter}
                onChange={(v) => setCreatorFilter(v ?? null)}
                options={creatorOptions}
                showSearch
                allowClear
                optionFilterProp="label"
                popupMatchSelectWidth={260}
                disabled={creatorOptions.length === 0}
                optionRender={(option) => {
                  const meta = creatorOptions.find((c) => c.value === option.value);
                  return (
                    <div className="prop-filter-select__option">
                      {meta?.avatarUrl ? (
                        <img className="prop-filter-select__avatar" src={meta.avatarUrl} alt={meta.label} />
                      ) : (
                        <span className="prop-filter-select__avatar prop-filter-select__avatar--initials">
                          {initialsOf(meta?.label || '')}
                        </span>
                      )}
                      <span>{meta?.label}</span>
                    </div>
                  );
                }}
              />
              <Select
                className="prop-filter-select"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as StatusKey)}
                options={statusOptions.map((s) => ({
                  value: s.value,
                  label: s.color ? (
                    <span className="prop-filter-select__option">
                      <span className="prop-filter-select__dot" style={{ background: s.color }} />
                      {s.label}
                    </span>
                  ) : (
                    s.label
                  ),
                }))}
                showSearch
                optionFilterProp="value"
                popupMatchSelectWidth={200}
              />
            </div>

            {hasActiveFilters && (
              <>
                <span className="prop-filterbar__sep" />
                <button type="button" className="prop-filterbar__clear" onClick={clearFilters}>
                  <CloseCircleOutlined />
                  Clear filters
                </button>
              </>
            )}

            <span className="prop-filterbar__spacer" />
            <span className="prop-filterbar__sep prop-filterbar__sep--right" />

            <Text className="prop-count">
              <strong>{filteredProposals.length}</strong> {filteredProposals.length === 1 ? 'result' : 'results'}
              {hasActiveFilters && (
                <span className="prop-count__suffix"> · filtered from {proposals.length}</span>
              )}
            </Text>
            <Segmented
              className="prop-view-seg"
              value={view}
              onChange={(v) => setView(v as 'list' | 'grid')}
              options={[
                { value: 'list', icon: <UnorderedListOutlined /> },
                { value: 'grid', icon: <AppstoreOutlined /> },
              ]}
            />

            <Popover
              trigger={["click"]}
              placement="bottomRight"
              classNames={{ root: "prop-table-settings-popover" }}
              content={
                <div style={{ width: 240 }}>
                  <div className="prop-popover-section-label">
                    <Settings size={11} />
                    <span>Density</span>
                  </div>
                  <Segmented
                    block
                    value={tableDensity}
                    onChange={(v) => setTableDensity(v as PropDensity)}
                    options={[
                      { label: "Compact", value: "compact" },
                      { label: "Cozy", value: "comfortable" },
                      { label: "Roomy", value: "spacious" },
                    ]}
                  />
                  <div className="prop-popover-section-label" style={{ marginTop: 14 }}>
                    <Layers size={11} />
                    <span>Columns</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {TOGGLEABLE_COLUMNS.map((c) => (
                      <label key={c.key} className="prop-col-toggle-row">
                        <span>{c.label}</span>
                        <Switch
                          size="small"
                          checked={!hiddenCols[c.key]}
                          onChange={(checked) =>
                            setHiddenCols((prev) => ({ ...prev, [c.key]: !checked }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div className="prop-popover-footer">
                    <button
                      type="button"
                      className="prop-popover-reset"
                      onClick={() => {
                        setHiddenCols(DEFAULT_HIDDEN_COLS);
                        setTableDensity("comfortable");
                      }}
                    >
                      Reset
                    </button>
                    <span className="prop-popover-saved">Auto-saved</span>
                  </div>
                </div>
              }
            >
              <Tooltip title="Table settings">
                <Button
                  icon={<SettingOutlined />}
                  className="prop-filterbar__btn"
                  style={{ marginLeft: 8 }}
                />
              </Tooltip>
            </Popover>
          </div>

          {/* Table + Grid */}
          <div className="prop-card" data-density={tableDensity}>

            {view === 'list' ? (
              <Table
                columns={columns}
                dataSource={filteredProposals}
                loading={loading}
                rowKey="id"
                size="middle"
                pagination={{
                  pageSize: 10,
                  style: { padding: '14px 24px', margin: 0 },
                  showSizeChanger: false,
                }}
                rowClassName={() => 'prop-row'}
                locale={{
                  emptyText: (
                    <div className="prop-empty">
                      <div className="prop-empty__orb">
                        <Sparkles size={28} />
                      </div>
                      <div className="prop-empty__title">No proposals yet</div>
                      <div className="prop-empty__sub">Start by creating your first premium proposal.</div>
                      {canCreateProposal && (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          className="prop-cta-primary"
                          onClick={() => router.push('/proposals/builder')}
                          style={{ marginTop: 14 }}
                        >
                          New Proposal
                        </Button>
                      )}
                    </div>
                  ),
                }}
              />
            ) : (
              <div className="prop-grid">
                {loading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
                ) : filteredProposals.length === 0 ? (
                  <div className="prop-empty" style={{ gridColumn: '1 / -1' }}>
                    <div className="prop-empty__orb">
                      <Sparkles size={28} />
                    </div>
                    <div className="prop-empty__title">No proposals yet</div>
                    <div className="prop-empty__sub">Start by creating your first premium proposal.</div>
                    {canCreateProposal && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        className="prop-cta-primary"
                        onClick={() => router.push('/proposals/builder')}
                        style={{ marginTop: 14 }}
                      >
                        New Proposal
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredProposals.map((p) => (
                    <div
                      key={p.id}
                      className="prop-grid-card"
                      onClick={() => router.push(`/proposals/${p.id}`)}
                    >
                      <div className="prop-grid-card__head">
                        <div className="prop-grid-card__icon">
                          <SnippetsOutlined />
                        </div>
                        {getStatusTag(p.status)}
                      </div>
                      <div className="prop-grid-card__title">{resolveTitle(p)}</div>
                      <div className="prop-grid-card__client">
                        <div className="prop-client__avatar prop-client__avatar--sm">
                          {(p.client_name || '—')
                            .split(' ')
                            .map((s: string) => s[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <Text className="prop-client__name">{p.client_name || '—'}</Text>
                      </div>
                      <div className="prop-grid-card__foot">
                        <ClockCircleOutlined style={{ marginRight: 6, opacity: 0.6 }} />
                        {dayjs(p.updated_at).format('MMM D · h:mm A')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <LeadMailDrawer
            visible={isMailDrawerVisible}
            onClose={() => {
              setIsMailDrawerVisible(false);
              setSelectedProposalForMail(null);
            }}
            lead={selectedProposalForMail ? {
              id: selectedProposalForMail.lead_id || selectedProposalForMail.id,
              title: selectedProposalForMail.title,
              client_name: selectedProposalForMail.client_name,
              client_mail: selectedProposalForMail.client_mail || "",
              proposal_id: selectedProposalForMail.id,
              last_mail_at: selectedProposalForMail.last_mail_at,
              is_mail_sent: selectedProposalForMail.is_mail_sent
            } as any : null}
            fromEmail={invoiceMailSettings?.email}
            onSuccess={() => {
              setIsMailDrawerVisible(false);
              setSelectedProposalForMail(null);
              fetchProposals();
            }}
          />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
