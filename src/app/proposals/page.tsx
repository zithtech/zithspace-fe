'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Button,
  Table,
  Space,
  Input,
  message,
  Dropdown,
  Tooltip,
  Popconfirm,
  Segmented,
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
} from '@ant-design/icons';
import { Sparkles, TrendingUp } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { ProposalService } from '@/services/proposalService';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

type StatusKey = 'all' | 'draft' | 'sent' | 'accepted' | 'declined';

const STATUS_META: Record<Exclude<StatusKey, 'all'>, { label: string; color: string; bg: string; ring: string; icon: React.ReactNode }> = {
  draft:    { label: 'Draft',    color: '#64748b', bg: 'rgba(100,116,139,0.10)', ring: 'rgba(100,116,139,0.25)', icon: <ClockCircleOutlined /> },
  sent:     { label: 'Sent',     color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  ring: 'rgba(59,130,246,0.25)',  icon: <SendOutlined /> },
  accepted: { label: 'Accepted', color: '#10b981', bg: 'rgba(16,185,129,0.10)',  ring: 'rgba(16,185,129,0.25)',  icon: <CheckCircleOutlined /> },
  declined: { label: 'Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   ring: 'rgba(239,68,68,0.25)',   icon: <CloseCircleOutlined /> },
};

export default function ProposalsListPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const router = useRouter();
  const [messageApi, messageHolder] = message.useMessage();

  const fetchProposals = async () => {
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
    } catch (err: any) {
      console.error('Fetch error:', err);
      if (err.status !== 401) {
        message.error('Failed to load proposals');
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
      message.success('Proposal deleted');
      fetchProposals();
    } catch (err) {
      console.error('Delete error:', err);
      message.error('Failed to delete proposal');
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
    const winRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, drafts, sent, accepted, winRate };
  }, [proposals]);

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
    return proposals.filter((p) => {
      const matchesSearch =
        p.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status?.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchText, statusFilter]);

  const resolveTitle = (record: any) => {
    let displayTitle = record.title;
    if (!displayTitle || displayTitle === 'Updated Proposal') {
      try {
        const blocks = typeof record.blocks_data === 'string' ? JSON.parse(record.blocks_data) : record.blocks_data || [];
        const coverData = blocks.find((b: any) => b.type === 'cover')?.data;
        if (coverData?.title) displayTitle = coverData.title;
      } catch (e) {}
    }
    return displayTitle || 'Untitled Proposal';
  };

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
            <Text type="secondary" className="prop-cell-title__sub">
              Created {dayjs(record.created_at).format('MMM D, YYYY')}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'CLIENT',
      dataIndex: 'client_name',
      key: 'client_name',
      render: (text: string) => {
        const initials = (text || '—').split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div className="prop-client">
            <div className="prop-client__avatar">{initials || '—'}</div>
            <Text className="prop-client__name">{text || '—'}</Text>
          </div>
        );
      },
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
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
      title: '',
      key: 'actions',
      align: 'right' as const,
      width: 200,
      render: (_: any, record: any) => (
        <Space size={2} className="prop-actions">
          <Tooltip title="View">
            <Button type="text" className="prop-icon-btn" icon={<EyeOutlined />} onClick={() => router.push(`/proposals/${record.id}`)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" className="prop-icon-btn" icon={<EditOutlined />} onClick={() => router.push(`/proposals/builder?id=${record.id}`)} />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                { key: 'pdf', label: 'Export PDF', icon: <FilePdfOutlined style={{ color: '#ef4444' }} /> },
                { key: 'word', label: 'Export Word', icon: <FileWordOutlined style={{ color: '#2563eb' }} /> },
              ],
              onClick: ({ key }) => {
                if (key === 'pdf') handleExport(record.id, 'pdf');
                else if (key === 'word') handleExport(record.id, 'word');
              },
            }}
            trigger={['click']}
          >
            <Button type="text" className="prop-icon-btn" icon={<DownloadOutlined />} />
          </Dropdown>
          <Popconfirm
            title="Delete Proposal"
            description="Are you sure you want to delete this proposal?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" className="prop-icon-btn prop-icon-btn--danger" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const StatCard = ({
    label,
    value,
    icon,
    color,
    bg,
    ring,
    suffix,
    delta,
  }: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    ring: string;
    suffix?: string;
    delta?: string;
  }) => (
    <div className="prop-stat" style={{ ['--st-color' as any]: color, ['--st-bg' as any]: bg, ['--st-ring' as any]: ring }}>
      <div className="prop-stat__icon">{icon}</div>
      <div className="prop-stat__body">
        <div className="prop-stat__label">{label}</div>
        <div className="prop-stat__value">
          {value}
          {suffix && <span className="prop-stat__suffix">{suffix}</span>}
        </div>
      </div>
      {delta && (
        <div className="prop-stat__delta">
          <TrendingUp size={10} />
          {delta}
        </div>
      )}
    </div>
  );

  return (
    <MainLayout>
      {messageHolder}

      <div className="prop-page">
        {/* Compact Header */}
        <div className="prop-header">
          <div className="prop-header__left">
            <div className="prop-header__icon">
              <SnippetsOutlined />
            </div>
            <div className="prop-header__text">
              <Title level={4} className="prop-header__title">Proposals</Title>
              <Text className="prop-header__sub">Manage and track your winning business proposals</Text>
            </div>
          </div>
          <div className="prop-header__right">
            <Button
              type="primary"
              className="prop-cta-primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/proposals/builder')}
            >
              New Proposal
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="prop-stats-grid">
          <StatCard
            label="Total Proposals"
            value={stats.total}
            icon={<SnippetsOutlined />}
            color="#3b82f6"
            bg="rgba(59,130,246,0.10)"
            ring="rgba(59,130,246,0.25)"
          />
          <StatCard
            label="In Draft"
            value={stats.drafts}
            icon={<ClockCircleOutlined />}
            color="#64748b"
            bg="rgba(100,116,139,0.10)"
            ring="rgba(100,116,139,0.25)"
          />
          <StatCard
            label="Sent to Clients"
            value={stats.sent}
            icon={<SendOutlined />}
            color="#8b5cf6"
            bg="rgba(139,92,246,0.10)"
            ring="rgba(139,92,246,0.25)"
          />
          <StatCard
            label="Win Rate"
            value={stats.winRate}
            suffix="%"
            icon={<CheckCircleOutlined />}
            color="#10b981"
            bg="rgba(16,185,129,0.10)"
            ring="rgba(16,185,129,0.25)"
            delta={stats.accepted > 0 ? `${stats.accepted} closed` : undefined}
          />
        </div>

        {/* Toolbar + Table */}
        <div className="prop-card">
          <div className="prop-toolbar">
            <div className="prop-toolbar__left">
              <Input
                placeholder="Search by name, client…"
                prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="prop-search"
                allowClear
              />
              <Segmented
                className="prop-status-seg"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as StatusKey)}
                options={[
                  { label: `All (${stats.total})`, value: 'all' },
                  { label: `Drafts (${stats.drafts})`, value: 'draft' },
                  { label: `Sent (${stats.sent})`, value: 'sent' },
                  { label: `Accepted (${stats.accepted})`, value: 'accepted' },
                ]}
              />
            </div>

            <div className="prop-toolbar__right">
              <Text className="prop-count">
                <strong>{filteredProposals.length}</strong> {filteredProposals.length === 1 ? 'result' : 'results'}
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
            </div>
          </div>

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
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      className="prop-cta-primary"
                      onClick={() => router.push('/proposals/builder')}
                      style={{ marginTop: 14 }}
                    >
                      New Proposal
                    </Button>
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
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="prop-cta-primary"
                    onClick={() => router.push('/proposals/builder')}
                    style={{ marginTop: 14 }}
                  >
                    New Proposal
                  </Button>
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
      </div>
    </MainLayout>
  );
}
