"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Button,
  Typography,
  Space,
  Tooltip,
  Tag,
  Popconfirm,
  App,
  Empty,
  Card,
  Input,
  Skeleton,
  Badge,
  Dropdown,
  Avatar
} from "antd";
import {
  UndoOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  CloseOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EllipsisOutlined,
  CheckCircleOutlined,
  InboxOutlined
} from "@ant-design/icons";
import {
  Layers,
  Flame,
  Zap,
  FileText,
  Trash2,
  Menu,
  Target,
  Award,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Briefcase
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import LeadService, { Lead } from "@/services/leadService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import { useActivitySource } from "@/hooks/useActivitySource";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

dayjs.extend(relativeTime);

const { Text } = Typography;

const BLUE_PRIMARY = 'var(--premium-blue)';

/* -------------------------------------------------------------------------- */
/*                              Premium Sparkline                             */
/* -------------------------------------------------------------------------- */

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min;
  const width = 72;
  const height = 28;
  const bottomPadding = 4;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    let y = height - bottomPadding;
    if (max > min) {
      y = height - bottomPadding - ((d - min) / range) * (height - bottomPadding - 2);
    }
    return { x, y };
  });

  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x},${points[i].y}`;
  }

  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const isFlat = data.every(d => d === data[0]);
  const flatY = 2;
  const flatPathD = `M 0,${flatY} L ${width},${flatY}`;
  const flatFillD = `${flatPathD} L ${width},${height} L 0,${height} Z`;

  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={isFlat ? flatFillD : fillD} fill={`url(#${gradId})`} />
      <path d={isFlat ? flatPathD : pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

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

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent, subtle, loading, chart }) => (
  <div className="es-stat-card">
    <div className="es-stat-top">
      <div className="es-stat-left">
        <span className="es-stat-icon" style={{ background: `${accent}1c`, color: accent }}>{icon}</span>
        <span className="es-stat-label">{label}</span>
      </div>
    </div>

    <div className="es-stat-bottom">
      <div className="es-stat-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 56, height: 22 }} />
        ) : (
          <span className="es-stat-value">{value}</span>
        )}
        {subtle && (
          <span className="es-stat-period">{subtle}</span>
        )}
      </div>
      {chart && (
        <div className="es-stat-spark">{chart}</div>
      )}
    </div>
  </div>
);

const initialsOf = (name: string) =>
  (name || '—')
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const getGradient = (id: string) => {
  const colors = [
    ['#3b82f6', '#1d4ed8'],
    ['#ef4444', '#b91c1c'],
    ['#10b981', '#047857'],
    ['#f59e0b', '#d97706'],
    ['#8b5cf6', '#6d28d9'],
    ['#ec4899', '#be185d'],
  ];
  let sum = 0;
  for (let i = 0; i < (id || '').length; i++) {
    sum += (id || '').charCodeAt(i);
  }
  const pair = colors[sum % colors.length];
  return `linear-gradient(135deg, ${pair[0]} 0%, ${pair[1]} 100%)`;
};

export default function LeadsTrashPage() {
  console.log("Forcing HMR reload for LeadsTrashPage");
  useActivitySource({ section: "WORK", module: "Leads", page: "LeadsTrash" });
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { message, modal } = App.useApp();
  const { leads, loading, fetchTrashLeads, emptyTrash, bulkRestoreLeads, bulkDeleteLeads } = useLeads();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activeLeads, setActiveLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { user, isLoading: isAuthLoading } = useAuth();
  const { canReadLeadTrash, canRestoreLeadTrash, canDeleteLeadTrash } = usePermission();

  // ─── Route Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthLoading && user && !canReadLeadTrash) {
      router.push("/dashboard");
    }
  }, [user, isAuthLoading, canReadLeadTrash, router]);

  const fetchActiveLeads = useCallback(async () => {
    try {
      const data = await LeadService.getAll({ limit: 1000 });
      setActiveLeads(data?.data || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.warn("Failed to fetch active leads", err);
    }
  }, []);

  useEffect(() => {
    fetchActiveLeads();
    fetchTrashLeads();
  }, [fetchActiveLeads, fetchTrashLeads]);

  const handleRestore = async (id: string) => {
    try {
      await LeadService.restore(id);
      message.success("Lead restored successfully");
      fetchTrashLeads();
      fetchActiveLeads();
    } catch (error: any) {
      message.error(error.message || "Failed to restore lead");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await LeadService.permanentDelete(id);
      message.success("Lead permanently deleted");
      fetchTrashLeads();
    } catch (error: any) {
      message.error(error.message || "Failed to delete lead permanently");
    }
  };

  const filteredLeads = leads?.filter((l) =>
    (l.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.client_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const actionMenu = (item: Lead) => ({
    items: [
      canRestoreLeadTrash ? {
        key: 'restore',
        label: (
          <div className="es-menu-item">
            <span className="es-menu-ic" style={{ color: '#10b981', background: 'rgba(16,185,129,0.12)' }}>
              <UndoOutlined />
            </span>
            <span className="es-menu-text">
              <span className="es-menu-title">Restore</span>
              <span className="es-menu-desc">Restore lead to pipeline</span>
            </span>
          </div>
        )
      } : null,
      (canRestoreLeadTrash && canDeleteLeadTrash) ? { type: 'divider' as const } : null,
      canDeleteLeadTrash ? {
        key: 'delete',
        danger: true,
        label: (
          <ConfirmDialog
            tone="danger"
            icon={<DeleteOutlined style={{ fontSize: 15 }} />}
            title="Delete Forever"
            description="Are you sure you want to permanently delete this lead? This action cannot be undone."
            confirmText="Delete Forever"
            cancelText="Cancel"
            placement="left"
            onConfirm={() => handlePermanentDelete(item.id)}
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
                  <span className="es-menu-title">Permanent Delete</span>
                  <span className="es-menu-desc">Irreversible</span>
                </span>
              </div>
            </div>
          </ConfirmDialog>
        )
      } : null
    ].filter(Boolean) as any,
    onClick: ({ key, domEvent }: any) => {
      domEvent.stopPropagation();
      if (key === 'restore') {
        handleRestore(item.id);
      }
    }
  });

  const activeCounts = useMemo(() => {
    const today = dayjs().startOf('day');
    return {
      all: activeLeads.length,
      hot: activeLeads.filter(l => (l.ai_score || 0) >= 80).length,
      today: activeLeads.filter(l => dayjs(l.created_at || l.posted_on).isAfter(today)).length,
      withProposal: activeLeads.filter(l => !!l.proposal_id).length,
    };
  }, [activeLeads]);

  const deletedTrend = useMemo(() => {
    const trend = [0, 0, 0, 0, 0, 0, 0];
    const now = dayjs();
    leads.forEach(l => {
      if (!l.deleted_at) return;
      const diff = now.diff(dayjs(l.deleted_at), 'day');
      if (diff >= 0 && diff < 7) {
        trend[6 - diff]++;
      }
    });
    return trend;
  }, [leads]);

  const stats = useMemo(() => {
    const totalDeleted = leads.length;
    const hotDeleted = leads.filter(l => (l.ai_score || 0) >= 80).length;
    const withProposal = leads.filter(l => !!l.proposal_id).length;
    const purgingSoon = leads.filter(l => {
      if (!l.deleted_at) return false;
      const purgeDate = dayjs(l.deleted_at).add(7, 'days');
      return purgeDate.diff(dayjs(), 'day') <= 1;
    }).length;
    return { totalDeleted, hotDeleted, withProposal, purgingSoon };
  }, [leads]);

  const columns = [
    {
      title: "Lead Details",
      key: "lead",
      render: (record: Lead) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong className="es-row-title" style={{ fontSize: 13, color: "var(--text-slate-900)" }}>{record.title}</Text>
          <Text className="es-row-sub" style={{ fontSize: 11, color: "var(--text-slate-500)" }}>{record.client_name}</Text>
        </div>
      ),
    },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      width: 120,
      render: (platform: string) => (
        <Tag color="blue" style={{ borderRadius: 4 }}>{platform || 'Upwork'}</Tag>
      ),
    },
    {
      title: "Deleted At",
      key: "deletedAt",
      width: 180,
      render: (record: any) => (
        <Tooltip title={record.deleted_at ? dayjs(record.deleted_at).format("YYYY-MM-DD HH:mm:ss") : "N/A"}>
          <Text className="es-row-sub" style={{ fontSize: 12, color: "var(--text-slate-700)" }}>
            {record.deleted_at ? dayjs(record.deleted_at).fromNow() : "Recently"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Auto-Purge",
      key: "purge",
      width: 150,
      render: (record: any) => {
        if (!record.deleted_at) return <Tag color="warning" style={{ borderRadius: 4 }}>N/A</Tag>;
        const purgeDate = dayjs(record.deleted_at).add(7, 'days');
        const daysLeft = purgeDate.diff(dayjs(), 'day');
        return (
          <Tag color={daysLeft <= 1 ? "error" : "warning"} style={{ borderRadius: 4 }}>
            {daysLeft <= 0 ? "Purging soon" : `${daysLeft} days left`}
          </Tag>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 120,
      fixed: "right" as const,
      render: (record: Lead) => (
        <Space size={8}>
          {canRestoreLeadTrash && (
            <Tooltip title="Restore Lead">
              <Button
                type="text"
                className="es-icon-btn"
                icon={<UndoOutlined style={{ color: "#52c41a" }} />}
                onClick={() => handleRestore(record.id)}
              />
            </Tooltip>
          )}
          {canDeleteLeadTrash && (
            <ConfirmDialog
              tone="danger"
              icon={<ExclamationCircleOutlined style={{ fontSize: 16 }} />}
              title="Delete Forever"
              description="This action cannot be undone."
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
                    icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                  />
                </Tooltip>
              </div>
            </ConfirmDialog>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="es-shell">
          {mobileSidebarOpen && <div className="es-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />}

          {/* ============================ SIDEBAR ============================ */}
          <aside className={`es-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
            <div className="es-sidebar-top">
              <div className="es-side-head">
                <div className="es-side-logo"><InboxOutlined style={{ color: '#ff4d4f' }} /></div>
                <div className="es-side-head-text">
                  <div className="es-side-title">Leads Trash</div>
                  <div className="es-side-subtitle">Repository</div>
                </div>
              </div>

              {canDeleteLeadTrash && (
                <ConfirmDialog
                  tone="danger"
                  icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                  title="Empty Trash"
                  description="This will permanently delete all leads currently in the trash. This action cannot be undone."
                  confirmText="Empty All"
                  cancelText="Cancel"
                  placement="bottom"
                  disabled={leads.length === 0 || loading}
                  onConfirm={async () => {
                    try {
                      await emptyTrash();
                      message.success("Leads trash emptied successfully");
                    } catch (error: any) {
                      message.error(error.message || "Failed to empty trash");
                    }
                  }}
                >
                  <Button
                    icon={<DeleteOutlined />}
                    className="es-empty-trash-btn"
                    disabled={leads.length === 0 || loading}
                    block
                  >
                    Empty Trash
                  </Button>
                </ConfirmDialog>
              )}
            </div>

            <div className="es-side-scroll">
              <div className="es-side-section-label">Lead Views</div>
              <div className="es-side-list">
                <button
                  type="button"
                  className="es-view-item"
                  onClick={() => router.push('/leads?view=all')}
                >
                  <span className="es-view-icon" style={{ color: 'var(--text-slate-400)' }}><Layers size={14} /></span>
                  <span className="es-view-label">All Leads</span>
                  <span className="es-view-count">{activeCounts.all}</span>
                </button>
                <button
                  type="button"
                  className="es-view-item"
                  onClick={() => router.push('/leads?view=hot')}
                >
                  <span className="es-view-icon" style={{ color: 'var(--text-slate-400)' }}><Flame size={14} /></span>
                  <span className="es-view-label">Hot Leads</span>
                  <span className="es-view-count">{activeCounts.hot}</span>
                </button>
                <button
                  type="button"
                  className="es-view-item"
                  onClick={() => router.push('/leads?view=today')}
                >
                  <span className="es-view-icon" style={{ color: 'var(--text-slate-400)' }}><Zap size={14} /></span>
                  <span className="es-view-label">Added Today</span>
                  <span className="es-view-count">{activeCounts.today}</span>
                </button>
                <button
                  type="button"
                  className="es-view-item"
                  onClick={() => router.push('/leads?view=with_proposal')}
                >
                  {/* <span className="es-view-icon" style={{ color: 'var(--text-slate-400)' }}><FileText size={14} /></span> */}
                  {/* <span className="es-view-label">With Proposal</span> */}
                  {/* <span className="es-view-count">{activeCounts.withProposal}</span> */}
                </button>
              </div>

              <div className="es-side-section-label">Repositories</div>
              <div className="es-side-list">
                <button
                  type="button"
                  className="es-view-item is-active"
                  onClick={() => { }}
                >
                  <span className="es-view-icon" style={{ color: '#ff4d4f' }}><InboxOutlined /></span>
                  <span className="es-view-label">Trash Repository</span>
                  <span className="es-view-count">{leads.length}</span>
                </button>
              </div>
            </div>
          </aside>

          {/* ============================ MAIN ============================ */}
          <main className="es-main">
            <div className="es-topbar">
              <Button
                className="es-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
              <div className="es-search-wrap">
                <SearchOutlined className="es-search-icon" />
                <input
                  className="es-search"
                  placeholder="Search lead title, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

              </div>

              <div className="es-topbar-meta">
                <span className="es-meta-item"><span className="es-pulse" /><strong>{filteredLeads.length}</strong> deleted leads</span>
              </div>

              <div className="es-topbar-actions">
                <div className="es-segmented">
                  <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                  <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
                </div>
                <Tooltip title="Refresh view">
                  <button
                    type="button"
                    className="es-ghost-btn"
                    onClick={async () => {
                      setIsRefreshing(true);
                      await fetchTrashLeads();
                      await fetchActiveLeads();
                      setIsRefreshing(false);
                      message.success("Trash view synchronized");
                    }}
                  >
                    <ReloadOutlined spin={loading || isRefreshing} />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="es-divider" />

            {/* ============================ STATS ============================ */}
            <div className="es-stats">
              <StatCard
                label="Trashed Leads"
                value={stats.totalDeleted}
                icon={<Layers size={14} />}
                accent="#3b82f6"
                subtle="Total in repository"
                loading={loading && stats.totalDeleted === 0}
                chart={<Sparkline data={deletedTrend} color="#3b82f6" />}
              />

              <StatCard
                label="High Priority"
                value={stats.hotDeleted}
                icon={<Flame size={14} />}
                accent="#ef4444"
                subtle="AI score ≥ 80"
                loading={loading && stats.hotDeleted === 0}
                chart={<Sparkline data={deletedTrend} color="#ef4444" />}
              />

              <StatCard
                label="Auto-Purging"
                value={stats.purgingSoon}
                icon={<AlertCircle size={14} />}
                accent="#f59e0b"
                subtle="≤ 24 hours left"
                loading={loading && stats.purgingSoon === 0}
                chart={<Sparkline data={deletedTrend} color="#f59e0b" />}
              />
            </div>

            {/* ============================ BULK ACTIONS ============================ */}
            {selectedRowKeys.length > 0 && (
              <div className="saas-bulk-actions">
                <div className="saas-bulk-content">
                  <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#3b82f6' }} />
                  <Text strong style={{ marginLeft: 8 }}>Leads Selected</Text>
                </div>
                <div className="saas-bulk-buttons">
                  {canRestoreLeadTrash && (
                    <Button
                      type="text"
                      size="small"
                      icon={<UndoOutlined />}
                      onClick={async () => {
                        try {
                          await bulkRestoreLeads(selectedRowKeys as string[]);
                          setSelectedRowKeys([]);
                          message.success("Selected leads restored");
                          fetchActiveLeads();
                        } catch (err: any) {
                          message.error("Failed to restore leads");
                        }
                      }}
                      loading={loading}
                      className="saas-bulk-btn restore"
                    >
                      Restore
                    </Button>
                  )}
                  {canDeleteLeadTrash && (
                    <ConfirmDialog
                      tone="danger"
                      icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                      title="Purge Selected"
                      description={`This will permanently delete the ${selectedRowKeys.length} selected leads. This action cannot be undone.`}
                      confirmText="Purge Selected"
                      cancelText="Cancel"
                      placement="bottomRight"
                      onConfirm={async () => {
                        try {
                          await bulkDeleteLeads(selectedRowKeys as string[]);
                          setSelectedRowKeys([]);
                          message.success("Selected leads purged");
                        } catch (err: any) {
                          message.error("Failed to purge leads");
                        }
                      }}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        loading={loading}
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

            {/* ============================ CONTENT ============================ */}
            <div className="es-body">
              {!loading && filteredLeads.length === 0 ? (
                <div className="es-empty">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<Text type="secondary">No trashed leads found</Text>}
                  />
                </div>
              ) : view === 'list' ? (
                <div className="es-table-wrap">
                  <ZukvoLoadingOverlay loading={false} message="">
                    <Table
                      rowSelection={(loading || isRefreshing) ? undefined : {
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys)
                      }}
                      columns={columns.map(col => ({
                        ...col,
                        render: (text: any, record: any, index: number) => {
                          if (loading || isRefreshing) {
                            return <Skeleton.Input active size="small" block style={{ height: 24 }} />;
                          }
                          return col.render ? (col.render as any)(text, record, index) : text;
                        }
                      }))}
                      dataSource={(loading || isRefreshing) ? Array(5).fill({}) : filteredLeads}
                      scroll={{ x: "max-content" }}
                      rowKey={(record: any) => record.id || Math.random()}
                      pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 20, size: "small" }}
                      className="es-table"
                      locale={{
                        emptyText: (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<Text type="secondary">No trashed leads found</Text>}
                          />
                        )
                      }}
                    />
                  </ZukvoLoadingOverlay>
                </div>
              ) : (
                <div className="es-grid">
                  {filteredLeads.map((item: any) => {
                    return (
                      <div key={item.id} className="ec-card group flex flex-col relative">
                        <div className="ec-top">
                          <div
                            className="ec-avatar"
                            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                          >
                            {initialsOf(item.client_name || item.title)}
                          </div>
                          <div className="ec-identity-body">
                            <div className="ec-title">{item.title}</div>
                            <div className="ec-category-line">
                              <span className="ec-category-key">Client:</span>
                              <span className="ec-category-val" title={item.client_name || 'No client'}>
                                {item.client_name || 'No client'}
                              </span>
                            </div>
                          </div>
                          {(canRestoreLeadTrash || canDeleteLeadTrash) && (
                            <Dropdown
                              menu={actionMenu(item)}
                              overlayClassName="es-action-pop"
                              trigger={['click']}
                              placement="bottomRight"
                            >
                              <button type="button" className="ec-actions" onClick={(e) => e.stopPropagation()}>
                                <EllipsisOutlined />
                              </button>
                            </Dropdown>
                          )}
                        </div>
                        <div className="ec-foot">
                          <div className="ec-foot-row">
                            <span className="ec-foot-item" style={{ flex: 1 }}>
                              <span className="ec-foot-key">Source:</span>
                              <Tag color="blue" style={{ borderRadius: 4, margin: 0 }}>{item.platform || 'Upwork'}</Tag>
                            </span>
                            <span className="ec-foot-item">
                              <span className="ec-foot-key">Purge:</span>
                              {(() => {
                                if (!item.deleted_at) return <Tag color="warning" style={{ borderRadius: 4, margin: 0 }}>N/A</Tag>;
                                const purgeDate = dayjs(item.deleted_at).add(7, 'days');
                                const daysLeft = purgeDate.diff(dayjs(), 'day');
                                return (
                                  <Tag color={daysLeft <= 1 ? "error" : "warning"} style={{ borderRadius: 4, margin: 0 }}>
                                    {daysLeft <= 0 ? "Purging soon" : `${daysLeft} days left`}
                                  </Tag>
                                );
                              })()}
                            </span>
                          </div>
                          <div className="ec-foot-row" style={{ borderTop: '1px solid var(--border-slate-200)' }}>
                            <span className="ec-foot-item">
                              <span className="ec-foot-key">Deleted:</span>
                              <span className="ec-foot-val">{item.deleted_at ? dayjs(item.deleted_at).fromNow() : 'Recently'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>

        <style jsx global>{`
          .es-shell { display: flex; margin: 0 -16px; min-height: calc(100vh - 64px); background: var(--bg-pure-white); }
          .es-sidebar { width: 240px; flex-shrink: 0; border-right: 1px solid var(--border-slate-200); background: var(--bg-pure-white); display: flex; flex-direction: column; position: sticky; top: 0; height: calc(100vh - 64px); }
          .es-sidebar-top { padding: 14px 14px 12px 18px; }
          .es-side-head { display: flex; align-items: center; gap: 10px; padding-bottom: 14px; margin-bottom: 6px; border-bottom: 1px solid var(--border-slate-100); }
          .es-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
          .es-side-logo .anticon { font-size: 24px !important; color: var(--text-slate-900) !important; }
          .es-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .es-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .es-side-subtitle { font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.07em; }
          .es-empty-trash-btn {
            height: 32px !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            font-size: 12.5px !important;
            background: #fff1f0 !important;
            color: #ff4d4f !important;
            border: none !important;
            box-shadow: none !important;
            margin-bottom: 4px;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            cursor: pointer;
            width: 100%;
            transition: none !important;
          }
          .es-empty-trash-btn:hover, .es-empty-trash-btn:focus, .es-empty-trash-btn:active {
            background: #fff1f0 !important;
            color: #ff4d4f !important;
            border-color: transparent !important;
            box-shadow: none !important;
          }
          .es-empty-trash-btn .anticon, .es-empty-trash-btn svg {
            font-size: 12px !important;
            color: #ff4d4f !important;
          }
          .es-empty-trash-btn.ant-btn-disabled, .es-empty-trash-btn[disabled] {
            background: #f5f5f5 !important;
            color: rgba(0, 0, 0, 0.25) !important;
            border-color: transparent !important;
            cursor: not-allowed;
          }
          .es-empty-trash-btn.ant-btn-disabled .anticon, .es-empty-trash-btn[disabled] .anticon {
            color: rgba(0, 0, 0, 0.25) !important;
          }
          .es-side-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 10px 6px 16px; scrollbar-width: none; -ms-overflow-style: none; }
          .es-side-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
          .es-side-section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px; }
          .es-side-scroll > .es-side-section-label:first-child { margin-top: 6px; }
          .es-side-list { display: flex; flex-direction: column; gap: 1px; }
          .es-view-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 10px; border-radius: 8px; border: none; background: transparent; cursor: pointer; transition: background .12s ease; text-align: left; }
          .es-view-item:hover { background: var(--bg-slate-50); }
          .es-view-item.is-active { background: var(--bg-blue-50); }
          .es-view-item.is-active .es-view-label { color: var(--text-slate-900); font-weight: 600; }
          .es-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
          .es-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          .es-view-count { font-size: 11.5px; font-weight: 600; color: var(--text-slate-400); min-width: 18px; text-align: right; }
          .es-view-item.is-active .es-view-count { color: #ff4d4f; font-weight: 700; background: rgba(255,77,79,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0; }
          
          .es-main { flex: 1; min-width: 0; padding: 8px 18px 0; display: flex; flex-direction: column; }
          .es-body { flex: 1 0 auto; }
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
          .es-pulse { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; display: inline-block; box-shadow: 0 0 0 3px rgba(239,68,68,0.18); margin-right: 5px; }
          .es-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
          .es-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
          .es-segmented button {
            width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
            color: var(--text-slate-500); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
            transition: background 0.12s ease, color 0.12s ease;
          }
          .es-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
          .es-segmented button:not(.is-active):hover { background: var(--bg-slate-50); color: var(--text-slate-700); }
          .es-ghost-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
          .es-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }
          .es-divider { height: 1px; background: var(--border-slate-200); margin: 0 -18px 10px; }

          .es-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
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
          .es-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
          .es-stat-spark { opacity: 0.95; }

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
          .es-table .ant-table-thead > tr > th:first-child { border-top-left-radius: 0 !important; border-start-start-radius: 0 !important; }
          .es-table .ant-table-thead > tr > th:last-child { border-top-right-radius: 0 !important; border-start-end-radius: 0 !important; }
          .es-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; background: var(--bg-pure-white) !important; }
          .es-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
          .es-table .ant-table-tbody > tr.es-row:hover > td { background: var(--bg-slate-50) !important; }
          .es-table .ant-table-selection-column { padding-inline: 6px !important; }
          .es-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
          .es-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

          .es-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 10px; }
          .es-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }
          
          .ec-card {
            border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
            overflow: hidden; display: flex; flex-direction: column;
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

          /* Premium action dropdown */
          .es-action-pop .ant-dropdown-menu {
            padding: 6px; border-radius: 0; min-width: 220px;
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
          .es-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
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
          .es-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
          .es-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

          /* Bulk actions */
          .saas-bulk-actions {
            background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0;
            padding: 12px 20px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;
            box-shadow: var(--premium-shadow); animation: slideIn 0.3s ease-out;
          }
          .saas-bulk-content { display: flex; align-items: center; }
          .saas-bulk-buttons { display: flex; gap: 8px; align-items: center; }
          .saas-bulk-btn { border-radius: 6px !important; font-weight: 500 !important; font-size: 13px !important; height: 32px !important; padding: 4px 12px !important; display: flex !important; align-items: center !important; gap: 6px !important; }
          .saas-bulk-btn.restore { color: #52c41a !important; }
          .saas-bulk-btn.restore:hover { background: #f6ffed !important; }
          .saas-bulk-btn.purge { color: #ff4d4f !important; }
          .saas-bulk-btn.purge:hover { background: #fff1f0 !important; }
          .saas-bulk-btn.cancel { color: var(--text-slate-400) !important; }
          .saas-bulk-btn.cancel:hover { background: var(--bg-slate-50) !important; }

          .es-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }

          [data-theme='dark'] .es-shell {
            background:
              radial-gradient(1200px 400px at 0% -100px, rgba(59, 130, 246, 0.08), transparent 60%),
              radial-gradient(900px 360px at 100% -120px, rgba(139, 92, 246, 0.08), transparent 55%),
              #0B0F1A;
          }
          [data-theme='dark'] .es-sidebar { background: #0B0F1A !important; border-right-color: #1F2937 !important; }
          [data-theme='dark'] .es-side-head { border-bottom-color: #1F2937; }
          [data-theme='dark'] .es-side-title { color: #FFFFFF; }
          [data-theme='dark'] .es-view-item:hover { background: #161B22; }
          [data-theme='dark'] .es-view-item.is-active { background: rgba(59, 130, 246, 0.15); }
          [data-theme='dark'] .es-view-label { color: #94A3B8; }
          [data-theme='dark'] .es-view-item.is-active .es-view-label { color: #FFFFFF; }
          [data-theme='dark'] .es-search-wrap { background: #0B0F1A !important; border-color: #1F2937 !important; }
          [data-theme='dark'] .es-search { color: #FFFFFF; }
          [data-theme='dark'] .es-ghost-btn { background: #0B0F1A !important; border-color: #1F2937 !important; color: #94A3B8; }
          [data-theme='dark'] .es-divider { background: #1F2937; }
          [data-theme='dark'] .es-stat-card { background: #0B0F1A !important; border-color: #1F2937 !important; }
          [data-theme='dark'] .es-stat-card:hover { border-color: #1F2937 !important; box-shadow: none !important; }
          [data-theme='dark'] .es-stat-label { color: #94A3B8; }
          [data-theme='dark'] .es-stat-value { color: #FFFFFF; }
          [data-theme='dark'] .es-table-wrap { background: #0B0F1A !important; border-color: #1F2937 !important; }
          [data-theme='dark'] .es-table .ant-table-thead > tr > th,
          [data-theme='dark'] .es-table .ant-table-thead > tr > td {
            background: #161B22 !important;
            border-bottom-color: #374151 !important;
            color: #94A3B8 !important;
          }
          [data-theme='dark'] .es-table .ant-table-tbody > tr > td { background: #0B0F1A !important; border-bottom-color: #1F2937 !important; }
          [data-theme='dark'] .es-table .ant-table-tbody > tr.es-row:hover > td { background: #161B22 !important; }
          [data-theme='dark'] .es-row-title { color: #FFFFFF !important; }
          [data-theme='dark'] .es-row-sub { color: #94A3B8 !important; }
          [data-theme='dark'] .es-segmented { background: #0B0F1A !important; border-color: #1F2937 !important; }
          [data-theme='dark'] .es-segmented button { color: #64748B; }
          [data-theme='dark'] .es-segmented button.is-active { background: rgba(59,130,246,0.15) !important; color: #3B82F6 !important; }
          [data-theme='dark'] .es-segmented button:not(.is-active):hover { background: #161B22 !important; color: #94A3B8 !important; }
          [data-theme='dark'] .ec-card { background: #0B0F1A !important; border-color: #1F2937 !important; }
          [data-theme='dark'] .ec-top { border-bottom-color: #1F2937 !important; }
          [data-theme='dark'] .ec-title { color: #FFFFFF !important; }
          [data-theme='dark'] .ec-category-val { color: #94A3B8 !important; }
          [data-theme='dark'] .ec-foot { background: #161B22 !important; border-top-color: #1F2937 !important; }
          [data-theme='dark'] .ec-foot-row { border-top-color: #1F2937 !important; }
          [data-theme='dark'] .ec-foot-val { color: #94A3B8 !important; }
          [data-theme='dark'] .saas-bulk-actions { background: #161B22; border-color: #1F2937; }
          [data-theme='dark'] .saas-bulk-btn.restore:hover { background: rgba(82, 196, 26, 0.1) !important; }
          [data-theme='dark'] .saas-bulk-btn.purge:hover { background: rgba(255, 77, 79, 0.1) !important; }
          [data-theme='dark'] .saas-bulk-btn.cancel:hover { background: #1F2937 !important; }

          [data-theme='dark'] .es-action-pop .ant-dropdown-menu {
            background: #161B22 !important;
            border-color: #1F2937 !important;
            box-shadow: 0 16px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3) !important;
          }
          [data-theme='dark'] .es-action-pop .ant-dropdown-menu-item:hover { background: #1F2937 !important; }
          [data-theme='dark'] .es-action-pop .ant-dropdown-menu-item-divider { background: #1F2937 !important; }
          [data-theme='dark'] .es-menu-title { color: #FFFFFF !important; }
          [data-theme='dark'] .es-menu-desc { color: #64748B !important; }
          [data-theme='dark'] .es-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.12) !important; }
          [data-theme='dark'] .es-action-pop .ant-dropdown-menu-item-danger .es-menu-title { color: #f87171 !important; }

          [data-theme='dark'] .es-empty-trash-btn {
            background: rgba(255, 77, 79, 0.12) !important;
            color: #ff7875 !important;
          }
          [data-theme='dark'] .es-empty-trash-btn:hover, [data-theme='dark'] .es-empty-trash-btn:focus, [data-theme='dark'] .es-empty-trash-btn:active {
            background: rgba(255, 77, 79, 0.12) !important;
            color: #ff7875 !important;
            border-color: transparent !important;
            box-shadow: none !important;
          }
          [data-theme='dark'] .es-empty-trash-btn .anticon, [data-theme='dark'] .es-empty-trash-btn svg {
            color: #ff7875 !important;
          }
          [data-theme='dark'] .es-empty-trash-btn.ant-btn-disabled, [data-theme='dark'] .es-empty-trash-btn[disabled] {
            background: #161b22 !important;
            color: rgba(255, 255, 255, 0.3) !important;
            border-color: transparent !important;
          }
          [data-theme='dark'] .es-empty-trash-btn.ant-btn-disabled .anticon, [data-theme='dark'] .es-empty-trash-btn[disabled] .anticon {
            color: rgba(255, 255, 255, 0.3) !important;
          }

          .es-mobile-menu-btn { display: none !important; }

          @media (max-width: 1100px) {
            .es-stats { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 700px) {
            .es-grid { grid-template-columns: 1fr; }
            .es-stats { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 820px) {
            .es-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
            .es-main { height: auto; overflow: visible; }
            .es-body { overflow: visible; }
            .es-sidebar { position: fixed; top: 0; left: -320px; bottom: 0; z-index: 1100; height: 100%; max-height: none; display: flex; flex-direction: column; align-items: stretch; background: var(--bg-pure-white); width: 280px; box-sizing: border-box; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 4px 0 24px rgba(0,0,0,0.08); }
            .es-sidebar.is-open { left: 0; }
            .es-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
            .es-topbar-actions { width: 100%; justify-content: flex-start; }
            .es-topbar-meta { display: none; }
            .es-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; color: var(--text-slate-700); }
            .es-mobile-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099; }
          }
          @keyframes slideIn {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
