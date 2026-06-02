'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Tabs,
  Row,
  Col,
  Select,
  Skeleton,
  notification,
  Popconfirm,
  Segmented,
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
} from '@ant-design/icons';
import { Drawer, Divider } from 'antd';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { EscalationServiceV2 } from '@/services/escalationServiceV2';
import { EscalationSettingsService } from '@/services/escalationSettings';
import { TimeTrackingHeader } from '@/components/time-tracking/TimeTrackingHeader';
import CreateEscalationDrawer from '@/components/escalations/CreateEscalationDrawer';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const BLUE_PRIMARY = 'var(--premium-blue)';

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
  <div className="qe-stat-card" style={{ ['--qe-accent' as any]: accent }}>
    <div className="qe-stat-head">
      <div
        className="qe-stat-icon"
        style={{
          background: `${accent}14`,
          color: accent,
          boxShadow: `inset 0 0 0 1px ${accent}26`,
        }}
      >
        {icon}
      </div>
      <Text className="qe-stat-label">{label}</Text>
      <div className="qe-stat-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 56, height: 22 }} />
        ) : (
          <span className="qe-stat-value">{value}</span>
        )}
      </div>
    </div>
    {subtle && <Text className="qe-stat-subtle">{subtle}</Text>}
    {chart && <div className="qe-stat-chart">{chart}</div>}
    <span
      className="qe-stat-accent"
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
    <div className="qe-minibar">
      <div className="qe-minibar-track">
        {segments.map((s, i) => (
          <Tooltip key={i} title={`${s.label}: ${s.value}`}>
            <span
              className="qe-minibar-seg"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="qe-minibar-legend">
        {segments.map((s, i) => (
          <span key={i} className="qe-minibar-legend-item">
            <span className="qe-minibar-dot" style={{ background: s.color }} />
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

export default function EscalationListPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { canReadEscalation, canCreateEscalation, canUpdateEscalation, canDeleteEscalation } = usePermission();

  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
  const [sortOrder, setSortOrder] = useState<'recent' | 'priority'>('recent');

  // Create drawer
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const [notify, contextHolder] = notification.useNotification();

  const notifyPremium = (type: 'success' | 'error', title: string, description: string) => {
    notify[type]({
      message: <span className="premium-notif-title">{title}</span>,
      description: <span className="premium-notif-desc">{description}</span>,
      icon:
        type === 'success' ? (
          <CheckCircleFilled style={{ color: '#10B981' }} />
        ) : (
          <CloseCircleFilled style={{ color: '#EF4444' }} />
        ),
      className: 'premium-notification',
      placement: 'topRight',
      duration: 4,
    });
  };

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const [escData, statusData] = await Promise.all([
        EscalationServiceV2.getAllEscalations(),
        EscalationSettingsService.getStatuses(),
      ]);
      setEscalations(escData || []);
      setStatuses(statusData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Route Guard ────────────────────────────────────────────────────────────
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

  const getPriorityTag = (priority: any) => (
    <Tag color={priority?.color || 'blue'} style={{ borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
      {priority?.name?.toUpperCase() || 'MEDIUM'}
    </Tag>
  );

  /* --------------------------- Distinct filter options --------------------- */

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

  /* ----------------------------- Filtering --------------------------------- */

  const filteredEscalations = useMemo(() => {
    let list = [...escalations];

    if (searchText) {
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

    if (activeTab === '2') {
      list = list.filter((e) =>
        (e.targetMembers || []).some((m: any) => m.user?.id === user?.id),
      );
    } else if (activeTab === '3') {
      list = list.filter((e) => (e.createdBy?.id || e.created_by_id) === user?.id);
    }

    if (sortOrder === 'priority') {
      list.sort((a, b) => {
        const wa = a.priority?.weight || a.priority_weight || 0;
        const wb = b.priority?.weight || b.priority_weight || 0;
        return wb - wa;
      });
    } else {
      list.sort((a, b) => {
        const da = dayjs(a.createdAt || a.created_at);
        const db = dayjs(b.createdAt || b.created_at);
        return db.valueOf() - da.valueOf();
      });
    }

    return list;
  }, [escalations, searchText, statusFilter, priorityFilter, categoryFilter, activeTab, user, sortOrder]);

  /* ------------------------------ Stats ------------------------------------ */

  const statsData = useMemo(() => {
    const total = escalations.length;
    const highPriority = escalations.filter((e) => {
      const weight = e.priority_weight || e.priority?.weight || 0;
      const name = (e.priority_name || e.priority?.name || '').toLowerCase();
      return weight >= 80 || name === 'high' || name === 'urgent';
    }).length;
    const pending = escalations.filter((e) => e.escalationStatus?.isDefault).length;
    const resolved = escalations.filter((e) => e.escalationStatus?.isFinal).length;
    const inProgress = total - pending - resolved;
    const myInvolvement = escalations.filter((e) =>
      (e.targetMembers || []).some((m: any) => m.user?.id === user?.id),
    ).length;
    return { total, highPriority, pending, resolved, inProgress, myInvolvement };
  }, [escalations, user]);

  const resolvedPct = statsData.total > 0 ? Math.round((statsData.resolved / statsData.total) * 100) : 0;
  const highPriorityPct =
    statsData.total > 0 ? Math.round((statsData.highPriority / statsData.total) * 100) : 0;

  const hasActiveFilter =
    !!searchText ||
    statusFilter.length > 0 ||
    priorityFilter.length > 0 ||
    categoryFilter.length > 0;

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter([]);
    setPriorityFilter([]);
    setCategoryFilter([]);
  };

  /* ----------------------------- Helpers ----------------------------------- */

  const getStatusBadge = (record: any) => {
    const name = record.status_name || record.escalationStatus?.name || record.status;
    const color = record.status_color || record.escalationStatus?.color || BLUE_PRIMARY;
    if (!name) return <Badge status="default" text="Unknown" />;
    return <Badge color={color} text={name} style={{ fontWeight: 500 }} />;
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

  /* ----------------------------- Columns ----------------------------------- */

  const columns = [
    {
      title: 'Subject & Category',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 14 }}>
            {text || record.short_summary || 'No Subject'}
          </Text>
          {getCategoryTag(record.category || { name: record.category_name })}
        </Space>
      ),
    },
    {
      title: 'Target Team Members',
      dataIndex: 'targetMembers',
      key: 'targetMembers',
      render: (members: any[], record: any) => {
        const list = members || record.targetMembers || [];
        if (list.length === 0)
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              —
            </Text>
          );

        if (list.length === 1) {
          return (
            <Space>
              <Avatar size="small" style={{ backgroundColor: BLUE_PRIMARY }}>
                {list[0].user?.name?.charAt(0)}
              </Avatar>
              <Text style={{ fontSize: 13 }}>{list[0].user?.name}</Text>
            </Space>
          );
        }
        return (
          <Avatar.Group
            max={{ count: 3 }}
            size="small"
          >
            {list.map((m: any, idx: number) => (
              <Tooltip title={m.user?.name} key={idx}>
                <Avatar style={{ backgroundColor: BLUE_PRIMARY }}>{m.user?.name?.charAt(0)}</Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        );
      },
    },
    {
      title: 'Tickets',
      dataIndex: 'tickets',
      key: 'tickets',
      render: (tickets: any[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 150 }}>
          {tickets?.map((t, idx) => (
            <Tooltip title={t.ticket?.title} key={idx}>
              <Tag
                color="cyan"
                style={{
                  fontSize: 10,
                  borderRadius: 4,
                  margin: 0,
                  padding: '0 4px',
                  background: 'var(--bg-sky-50)',
                  border: '1px solid var(--border-sky-100)',
                  color: 'var(--text-sky-600)',
                }}
              >
                {t.ticket?.ticketNumber}
              </Tag>
            </Tooltip>
          ))}
          {(!tickets || tickets.length === 0) && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              —
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: any, record: any) => getPriorityTag(priority || { name: record.priority_name }),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: any) => getStatusBadge(record),
    },
    {
      title: 'Raised By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (user: any) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-slate-400)' }}>
            {user?.name?.charAt(0)}
          </Avatar>
          <Text type="secondary" style={{ color: 'var(--text-slate-400)' }}>
            {user?.name || 'System'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Raised Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string, record: any) => (
        <Tooltip title={dayjs(date || record.created_at).format('YYYY-MM-DD HH:mm:ss')}>
          <Text style={{ fontSize: 13, color: 'var(--text-slate-400)' }}>
            {dayjs(date || record.created_at).format('MMM D, YYYY')}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          {canUpdateEscalation && (
            <Tooltip title="Edit / View Details">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: BLUE_PRIMARY }} />}
                onClick={() => {
                  setSelectedEscalation(record);
                  setTempStatus(record.statusId || record.status);
                  setIsEditing(true);
                  setDrawerVisible(true);
                }}
              />
            </Tooltip>
          )}
          {canDeleteEscalation && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Delete Escalation"
                description="Are you sure you want to delete this escalation? This action cannot be undone."
                onConfirm={() => handleDelete(record.id)}
                okText="Yes, Delete"
                cancelText="No"
                okButtonProps={{ danger: true, loading: deleting === record.id }}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleting === record.id}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      {contextHolder}
      <div className="qe-shell">
        <TimeTrackingHeader
          icon={<AlertOutlined style={{ fontSize: 20, color: BLUE_PRIMARY }} />}
          title="Quality & Performance Escalations"
          description="Monitor and resolve manual escalations related to deployment quality and team regressions."
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            borderBottom: '1px solid var(--border-slate-200)',
            padding: '9.5px 32px',
            marginBottom: 20,
          }}
          extra={
            canCreateEscalation && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateDrawerOpen(true)}
                className="qe-primary-btn"
              >
                Raise Escalation
              </Button>
            )
          }
        />

        <div className="qe-content">
          {/* Premium stats grid */}
          <div className="qe-stat-grid">
            <StatCard
              label="Active Escalations"
              value={statsData.total}
              icon={<ExclamationCircleOutlined />}
              accent="#3b82f6"
              subtle="Across all categories"
              loading={loading && statsData.total === 0}
              chart={
                statsData.total > 0 ? (
                  <MiniBar
                    segments={[
                      {
                        value: statsData.pending,
                        color: '#f59e0b',
                        label: `${statsData.pending} pending`,
                      },
                      {
                        value: Math.max(statsData.inProgress, 0),
                        color: '#3b82f6',
                        label: `${Math.max(statsData.inProgress, 0)} in progress`,
                      },
                      {
                        value: statsData.resolved,
                        color: '#10b981',
                        label: `${statsData.resolved} resolved`,
                      },
                    ]}
                  />
                ) : null
              }
            />

            <StatCard
              label="High Priority"
              value={statsData.highPriority}
              icon={<FireOutlined />}
              accent="#ef4444"
              subtle={
                statsData.total > 0 ? `${highPriorityPct}% of all open` : 'No escalations yet'
              }
              loading={loading && statsData.total === 0}
              chart={
                statsData.total > 0 ? (
                  <div className="qe-progress-row">
                    <div className="qe-progress-track">
                      <span
                        className="qe-progress-fill"
                        style={{
                          width: `${highPriorityPct}%`,
                          background: 'linear-gradient(90deg, #ef4444, #f97316)',
                        }}
                      />
                    </div>
                    <span className="qe-progress-label">{highPriorityPct}%</span>
                  </div>
                ) : null
              }
            />

            <StatCard
              label="Pending Reviews"
              value={statsData.pending}
              icon={<ClockCircleOutlined />}
              accent="#f59e0b"
              subtle="Awaiting initial triage"
              loading={loading && statsData.total === 0}
              chart={
                statsData.total > 0 ? (
                  <div className="qe-cv-row">
                    <UserOutlined style={{ fontSize: 11 }} />
                    <span>
                      <strong>{statsData.myInvolvement}</strong> involve you
                    </span>
                  </div>
                ) : null
              }
            />

            <StatCard
              label="Total Resolved"
              value={statsData.resolved}
              icon={<CheckCircleOutlined />}
              accent="#10b981"
              subtle={
                statsData.total > 0 ? `${resolvedPct}% completion rate` : 'No escalations yet'
              }
              loading={loading && statsData.total === 0}
              chart={
                statsData.total > 0 ? (
                  <div className="qe-progress-row">
                    <div className="qe-progress-track">
                      <span
                        className="qe-progress-fill"
                        style={{
                          width: `${resolvedPct}%`,
                          background: 'linear-gradient(90deg, #10b981, #34d399)',
                        }}
                      />
                    </div>
                    <span className="qe-progress-label">{resolvedPct}%</span>
                  </div>
                ) : null
              }
            />
          </div>

          {/* Tabs */}
          <Tabs
            className="qe-tabs"
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: '1',
                label: (
                  <span className="qe-tab-label">
                    <AppstoreOutlined /> All
                    <span className="qe-tab-count">{escalations.length}</span>
                  </span>
                ),
              },
              {
                key: '2',
                label: (
                  <span className="qe-tab-label">
                    <UserOutlined /> My Involvement
                    <span className="qe-tab-count">{statsData.myInvolvement}</span>
                  </span>
                ),
              },
              {
                key: '3',
                label: (
                  <span className="qe-tab-label">
                    <FileTextOutlined /> Raised by Me
                    <span className="qe-tab-count">
                      {escalations.filter((e) => (e.createdBy?.id || e.created_by_id) === user?.id).length}
                    </span>
                  </span>
                ),
              },
            ]}
          />

          {/* Single-row premium filter bar */}
          <div className="qe-toolbar">
            <Input
              className="qe-search"
              prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', marginRight: 6 }} />}
              placeholder="Search subject, target, project…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            <Select
              className="qe-filter-select"
              mode="multiple"
              allowClear
              showSearch
              maxTagCount="responsive"
              placeholder={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ExclamationCircleOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                  Status
                </span>
              }
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ flex: '1 1 160px', minWidth: 150, maxWidth: 220 }}
              options={statusOptions.map((o) => ({
                value: o.value,
                label: o.label,
                rich: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: o.color || BLUE_PRIMARY,
                      }}
                    />
                    {o.label}
                  </span>
                ),
              }))}
              optionRender={(option) => (option.data as any).rich}
              filterOption={(input, option: any) =>
                (option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
            />

            <Select
              className="qe-filter-select"
              mode="multiple"
              allowClear
              showSearch
              maxTagCount="responsive"
              placeholder={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FireOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                  Priority
                </span>
              }
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ flex: '1 1 160px', minWidth: 150, maxWidth: 220 }}
              options={priorityOptions.map((o) => ({
                value: o.value,
                label: o.label,
                rich: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: o.color || '#94a3b8',
                      }}
                    />
                    {o.label}
                  </span>
                ),
              }))}
              optionRender={(option) => (option.data as any).rich}
              filterOption={(input, option: any) =>
                (option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
            />

            <Select
              className="qe-filter-select"
              mode="multiple"
              allowClear
              showSearch
              maxTagCount="responsive"
              placeholder={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <TagOutlined style={{ fontSize: 12, color: 'var(--text-slate-400)' }} />
                  Category
                </span>
              }
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ flex: '1 1 180px', minWidth: 160, maxWidth: 240 }}
              options={categoryOptions.map((o) => ({
                value: o.value,
                label: o.label,
                rich: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 4,
                        height: 14,
                        borderRadius: 2,
                        background: o.color || '#94a3b8',
                      }}
                    />
                    {o.label}
                  </span>
                ),
              }))}
              optionRender={(option) => (option.data as any).rich}
              filterOption={(input, option: any) =>
                (option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
            />

            {hasActiveFilter && (
              <Tooltip title="Clear all filters">
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={handleClearFilters}
                  className="qe-clear-btn"
                >
                  Reset
                </Button>
              </Tooltip>
            )}

            <div className="qe-toolbar__divider" />

            <Segmented
              className="qe-sort-segmented"
              value={sortOrder}
              onChange={(v) => setSortOrder(v as 'recent' | 'priority')}
              options={[
                { label: 'Recent', value: 'recent' },
                { label: 'Priority', value: 'priority' },
              ]}
            />

            <Text className="qe-count-text">
              <strong>{filteredEscalations.length}</strong> of {escalations.length}
            </Text>
          </div>

          {/* Active filter chips */}
          {(statusFilter.length > 0 || priorityFilter.length > 0 || categoryFilter.length > 0) && (
            <div className="qe-chips">
              {statusFilter.map((id) => {
                const opt = statusOptions.find((o) => o.value === id);
                if (!opt) return null;
                return (
                  <span key={`s-${id}`} className="qe-chip is-status" style={{ ['--chip-color' as any]: opt.color || BLUE_PRIMARY }}>
                    <span className="qe-chip__dot" />
                    {opt.label}
                    <button
                      className="qe-chip__remove"
                      onClick={() => setStatusFilter(statusFilter.filter((x) => x !== id))}
                      aria-label={`Remove ${opt.label}`}
                    >
                      <CloseOutlined />
                    </button>
                  </span>
                );
              })}
              {priorityFilter.map((id) => {
                const opt = priorityOptions.find((o) => o.value === id);
                if (!opt) return null;
                return (
                  <span key={`p-${id}`} className="qe-chip is-priority">
                    <FireOutlined className="qe-chip__icon" />
                    {opt.label}
                    <button
                      className="qe-chip__remove"
                      onClick={() => setPriorityFilter(priorityFilter.filter((x) => x !== id))}
                      aria-label={`Remove ${opt.label}`}
                    >
                      <CloseOutlined />
                    </button>
                  </span>
                );
              })}
              {categoryFilter.map((name) => (
                <span key={`c-${name}`} className="qe-chip is-category">
                  <TagOutlined className="qe-chip__icon" />
                  {name}
                  <button
                    className="qe-chip__remove"
                    onClick={() => setCategoryFilter(categoryFilter.filter((x) => x !== name))}
                    aria-label={`Remove ${name}`}
                  >
                    <CloseOutlined />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Table */}
          <Card
            style={{
              borderRadius: 14,
              border: '1px solid var(--border-slate-200)',
              overflow: 'hidden',
              background: 'var(--bg-pure-white)',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
              marginTop: 16,
            }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={columns}
              dataSource={filteredEscalations}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}` }}
              rowKey="id"
              loading={loading}
              className="premium-table qe-table"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedEscalation(record);
                  setTempStatus(record.statusId || record.status);
                  setIsEditing(false);
                  setDrawerVisible(true);
                },
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
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
          width={600}
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
                      Edit
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
                {/* Header Info */}
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

                {/* Grid Info */}
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

                {/* Description */}
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

                {/* Linked Tickets */}
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

                {/* Target Members */}
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

                {/* Creator Audit */}
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
      </div>
    </MainLayout>
  );
}
