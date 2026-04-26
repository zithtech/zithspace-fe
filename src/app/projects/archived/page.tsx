'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import TicketService from '@/services/ticketService';
import {
  Card,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  App,
  Empty,
  Badge,
  Popconfirm,
  Spin,
  Divider,
} from 'antd';
import dayjs from 'dayjs';
import {
  FolderOpenOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FolderOutlined,
  ProjectOutlined,
  InfoCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUserProjects } from '@/hooks/useGlobalData';
import { useTickets } from '@/hooks/useTickets';
import { useMoveToTrash } from '@/hooks/useTrash';
import { Ticket } from '@/services/ticketService';
import { Avatar, Tooltip, Row, Col } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ArchivedTicketsPage() {
  const { message, modal } = App.useApp();
  const { data: projects } = useUserProjects();
  const { isLoading: authLoading } = useAuth();
  const { canReadProject } = usePermission();
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadProject) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadProject, router]);

  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use useTickets hook with archivedOnly flag to show ONLY archived tickets
  const { data: ticketsData, isLoading, refetch, isFetching } = useTickets({
    archivedOnly: true,
    projectId: selectedProject,
    search: searchText,
    page,
    limit: pageSize,
  });

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const stats = await TicketService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleReload = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), loadStats()]);
      message.success("Archived tickets refreshed");
    } catch (e) {
      message.error("Failed to refresh archived tickets");
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalArchived = ticketsData?.pagination?.total || 0;

  // Calculate project-wise archived counts
  const projectStats = useMemo(() => {
    if (!dashboardStats?.projectStats || !projects) return [];

    return projects.map((p: any) => {
      const stats = dashboardStats.projectStats.find((s: any) => s.id === p.value);
      // Try both lowercase and uppercase 'completed'/'archived'
      const archivedCount = stats?.statuses?.reduce((acc: number, s: any) => {
        const statusStr = s.status?.toLowerCase() || '';
        if (statusStr === 'completed' || statusStr === 'archived' || statusStr === 'finished') {
          return acc + s.count;
        }
        return acc;
      }, 0) || 0;

      return {
        id: p.value,
        code: p.code,
        name: p.label,
        count: archivedCount
      };
    }).filter(p => p.count > 0).sort((a, b) => b.count - a.count).slice(0, 10); // Show up to 10
  }, [dashboardStats, projects]);

  // Use useMoveToTrash hook
  const { mutateAsync: moveToTrash, isPending: isDeleting } = useMoveToTrash();

  const handleDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select tickets to delete");
      return;
    }

    try {
      await moveToTrash(selectedRowKeys as string[]);
      setSelectedRowKeys([]);
      refetch();
    } catch (error: any) {
      // Error already handled by the hook
      console.error("Error moving to trash:", error);
    }
  };

  const tickets = ticketsData?.data || [];
  const pagination = ticketsData?.pagination;

  const columns: ColumnsType<Ticket> = [
    {
      title: 'ID',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 140,
      fixed: 'left',
      render: (text) => (
        <div style={{ position: 'relative', whiteSpace: 'nowrap' }}>
          <Text strong style={{ 
            color: "var(--premium-blue)", 
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
            letterSpacing: '-0.02em',
            background: 'var(--bg-slate-100)',
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid var(--border-slate-200)'
          }}>
            {text}
          </Text>
        </div>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>{text}</Text>
      )
    },
    {
      title: 'Project',
      key: 'project',
      width: 220,
      render: (_: any, record: Ticket) => {
        const project = typeof record.project === 'object' ? record.project : null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag className="ar-project-code-tag">
              {project?.code || 'GLB'}
            </Tag>
            <Text ellipsis style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-700)' }}>
              {project?.name || 'Global Repository'}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag className={`ar-status-tag ${status === 'completed' ? 'green' : 'slate'}`}>
          {status?.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            background: priority === 'HIGH' ? '#ef4444' : priority === 'MEDIUM' ? '#f59e0b' : '#10b981' 
          }} />
          <Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-600)' }}>{priority}</Text>
        </div>
      ),
    },
    {
      title: 'Assignee',
      key: 'assignee',
      width: 180,
      render: (_: any, record: Ticket) => {
        const name = record.assignee?.name;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar 
              size={24} 
              style={{ backgroundColor: '#6366f1', fontSize: 10, fontWeight: 700, boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)' }}
            >
              {name ? name.charAt(0) : '?'}
            </Avatar>
            <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-700)' }}>{name || 'Unassigned'}</Text>
          </div>
        );
      },
    },
    {
      title: 'Archived',
      dataIndex: 'updatedAt',
      key: 'archivedAt',
      width: 150,
      render: (date) => (
        <Text style={{ fontSize: 11, color: 'var(--text-slate-400)', fontWeight: 600 }}>
          {dayjs(date).format('MMM D, YYYY').toUpperCase()}
        </Text>
      )
    }
  ];

  // Loading & permission check
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ 
          margin: "0 -24px", 
          padding: "24px 32px", 
          background: "var(--bg-pure-white)", 
          minHeight: "calc(100vh - 64px)",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin size="large" tip="Orchestrating archived repository..." />
        </div>
      </MainLayout>
    );
  }

  if (!canReadProject) {
    return null;
  }

  return (
    <MainLayout>
      <div style={{ 
        margin: "0 -24px", 
        padding: "0 24px 24px 24px", 
        background: "var(--bg-pure-white)", 
        minHeight: "calc(100vh - 64px)" 
      }}>
        {/* Workstation Header */}
        <div className="saas-header-container" style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
          margin: "0 -24px 24px -24px",
          padding: '10.5px 48px'
        }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <Space size={16}>
                <div className="ar-header-icon-box">
                  <FolderOpenOutlined style={{ fontSize: 18, color: '#3b82f6' }} />
                </div>
                <Space split={<Divider type="vertical" className="ar-header-divider" />} size={16}>
                  <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
                    Archived Repository
                  </Title>
                  <Text style={{ fontSize: 12, color: 'var(--text-slate-600)', fontWeight: 600 }}>
                    Access completed historical tickets for audit and reporting
                  </Text>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space size={12}>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title="Move to Trash"
                    description={`Move ${selectedRowKeys.length} issues to trash?`}
                    onConfirm={handleDelete}
                    okText="Move to Trash"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, style: { fontWeight: 700 } }}
                  >
                    <Button
                      danger
                      type="primary"
                      icon={<DeleteOutlined />}
                      loading={isDeleting}
                      className="saas-button-item"
                      style={{ height: 36, fontWeight: 700, borderRadius: 6 }}
                    >
                      Delete Selection ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
                <Button
                  icon={<ReloadOutlined spin={isRefreshing} />}
                  onClick={handleReload}
                  loading={isRefreshing || isFetching || statsLoading}
                  className="saas-button-item"
                  style={{ height: 36, width: 36, borderRadius: 6 }}
                />
              </Space>
            </Col>
          </Row>
        </div>

        {/* Unified High-Density Archive Control Bar */}
        <div className="ar-control-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1 }}>
            {/* 1. Total Ticket Count */}
            <div className="ar-metrics-group">
              <div className="ar-metric-icon blue">
                <InboxOutlined style={{ color: '#3b82f6', fontSize: 16 }} />
              </div>
              <div>
                <Text style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-slate-900)', display: 'block', lineHeight: 1 }}>{totalArchived}</Text>
                <Text style={{ fontSize: 9, color: 'var(--text-slate-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL TICKETS</Text>
              </div>
            </div>

            {/* 2. Project Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-slate-600)', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>Filter Source:</Text>
              <Select
                placeholder="Select Archive Source"
                variant="borderless"
                className="ar-filter-select"
                allowClear
                value={selectedProject}
                onChange={setSelectedProject}
                loading={statsLoading}
                suffixIcon={<ProjectOutlined style={{ fontSize: 11, color: '#94a3b8' }} />}
              >
                <Option value={undefined}>
                  <Text style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>ALL SYSTEM ARCHIVES</Text>
                </Option>
                {projects?.map((project: any) => {
                  const pStats = projectStats.find((s: any) => s.id === project.value);
                  return (
                    <Option key={project.value} value={project.value} label={project.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 12 }}>
                        <Text style={{ fontSize: 11, fontWeight: 600 }}>{project.label}</Text>
                        <Tag className="ar-count-tag">
                          {pStats?.count || 0}
                        </Tag>
                      </div>
                    </Option>
                  );
                })}
              </Select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             {/* 3. Search Field - Right Side End */}
             <div className="ar-search-box">
                <SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 14 }} />
                <Input
                  placeholder="Find archived node..."
                  variant="borderless"
                  style={{ fontSize: 13, fontWeight: 600, padding: 0 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </div>

              {(selectedProject || searchText) && (
                <div className="ar-active-filter-badge">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                  <Text style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>Active</Text>
                </div>
              )}
          </div>
        </div>

        {/* Tickets Table */}
        <Card
          styles={{ body: { padding: 0 } }}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-pure-white)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }}
        >
          {tickets.length === 0 && !isLoading ? (
            <div style={{ padding: '64px 0' }}>
              <Empty
                image={<FolderOutlined style={{ fontSize: 64, color: '#f0f0f0' }} />}
                description={
                  <div style={{ padding: '20px 0' }}>
                    <Text type="secondary" style={{ display: "block", fontSize: 16, fontWeight: 500 }}>No archived tickets found</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>Tickets are automatically archived when sprints are completed</Text>
                  </div>
                }
              />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="id"
              loading={isLoading}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              pagination={{
                current: page,
                pageSize,
                total: pagination?.total || 0,
                showSizeChanger: true,
                showTotal: (total) => <Text type="secondary" style={{ fontSize: 13 }}>Total <b>{total}</b> Archived Tickets</Text>,
                onChange: (newPage, newPageSize) => {
                  setPage(newPage);
                  setPageSize(newPageSize);
                },
                style: { padding: '16px 24px' }
              }}
              className="premium-table"
              scroll={{ x: 1300 }}
            />
          )}
        </Card>

        <style jsx global>{`
          /* ── Header ─────────────────────────────────────────── */
          .ar-header-icon-box {
            width: 36px; height: 36px;
            background: var(--bg-blue-50);
            border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
            border: 1px solid var(--border-blue-200);
          }
          [data-theme='dark'] .ar-header-icon-box {
            background: rgba(59,130,246,0.15) !important;
            border-color: rgba(59,130,246,0.25) !important;
          }
          .ar-header-divider {
            height: 18px;
            border-left: 1.5px solid var(--border-slate-200);
            margin: 0;
          }

          /* ── Control bar ─────────────────────────────────────── */
          .ar-control-bar {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            margin: 0 8px 24px 8px;
            border-radius: 8px;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 28px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          }
          [data-theme='dark'] .ar-control-bar {
            background: #161b22 !important;
            border-color: #1f2937 !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
          }

          /* ── Metrics group ───────────────────────────────────── */
          .ar-metrics-group {
            display: flex; align-items: center; gap: 12px;
            padding-right: 28px;
            border-right: 1px solid var(--border-slate-100);
          }
          [data-theme='dark'] .ar-metrics-group {
            border-right-color: #1f2937 !important;
          }
          .ar-metric-icon {
            width: 34px; height: 34px; border-radius: 6px;
            display: flex; align-items: center; justify-content: center;
          }
          .ar-metric-icon.blue {
            background: var(--bg-blue-50);
            border: 1px solid var(--border-blue-200);
          }
          [data-theme='dark'] .ar-metric-icon.blue {
            background: rgba(59,130,246,0.15) !important;
            border-color: rgba(59,130,246,0.25) !important;
          }

          /* ── Filter select ───────────────────────────────────── */
          .ar-filter-select {
            width: 280px; font-size: 13px; font-weight: 700;
            background: var(--bg-slate-50) !important;
            border-radius: 4px;
            border: 1px solid var(--border-slate-100);
            height: 38px; display: flex; align-items: center;
          }
          [data-theme='dark'] .ar-filter-select {
            background: #1f2937 !important;
            border-color: #374151 !important;
          }
          [data-theme='dark'] .ar-filter-select .ant-select-selector {
            background: transparent !important;
            border: none !important;
          }
          .ar-count-tag {
            margin: 0; font-size: 9px; font-weight: 800;
            background: var(--bg-slate-100); border: none; color: var(--text-slate-600);
          }
          [data-theme='dark'] .ar-count-tag {
            background: #374151 !important;
            color: #94a3b8 !important;
          }

          /* ── Project code tag ───────────────────────────────── */
          .ar-project-code-tag {
            margin: 0; font-size: 10px; font-weight: 800;
            background: var(--bg-slate-100);
            border: 1px solid var(--border-slate-200);
            color: var(--text-slate-600);
            border-radius: 4px;
          }
          [data-theme='dark'] .ar-project-code-tag {
            background: #1f2937 !important;
            border-color: #374151 !important;
            color: #94a3b8 !important;
          }

          /* ── Search box ──────────────────────────────────────── */
          .ar-search-box {
            display: flex; align-items: center; gap: 10px;
            background: var(--bg-slate-50);
            padding: 6px 16px;
            border-radius: 6px;
            border: 1px solid var(--border-slate-100);
            width: 320px;
          }
          [data-theme='dark'] .ar-search-box {
            background: #1f2937 !important;
            border-color: #374151 !important;
          }

          /* ── Active filter badge ──────────────────────────────── */
          .ar-active-filter-badge {
            display: flex; align-items: center; gap: 8px;
            background: var(--bg-blue-50);
            padding: 6px 12px;
            border-radius: 6px;
            border: 1px solid var(--border-blue-200);
            animation: pulse 2s infinite;
          }
          [data-theme='dark'] .ar-active-filter-badge {
            background: rgba(59,130,246,0.15) !important;
            border-color: rgba(59,130,246,0.2) !important;
          }

          /* ── Status tags ───────────────────────────────────────── */
          .ar-status-tag {
            font-size: 9px; font-weight: 800;
            margin: 0; border-radius: 4px;
            padding: 2px 8px; text-transform: uppercase;
          }
          .ar-status-tag.green {
            background: var(--bg-green-50); color: #10b981;
            border: 1px solid var(--border-green-200);
          }
          .ar-status-tag.slate {
            background: var(--bg-slate-100); color: var(--text-slate-600);
            border: 1px solid var(--border-slate-200);
          }
          [data-theme='dark'] .ar-status-tag.green {
            background: rgba(16,185,129,0.15) !important;
            color: #34d399 !important;
            border-color: rgba(16,185,129,0.2) !important;
          }
          [data-theme='dark'] .ar-status-tag.slate {
            background: #1f2937 !important;
            color: #94a3b8 !important;
            border-color: #374151 !important;
          }

          /* ── Premium table ─────────────────────────────────────── */
          .premium-table .ant-table-thead > tr > th {
            background: var(--bg-pure-white);
            font-weight: 600;
            color: var(--text-secondary);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 12px 16px;
            border-bottom: 2px solid var(--border-slate-100);
          }
          [data-theme='dark'] .premium-table .ant-table-thead > tr > th {
            background: #161b22 !important;
            border-bottom-color: #1f2937 !important;
          }
          .premium-table .ant-table-tbody > tr > td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-slate-100);
            transition: all 0.2s ease;
          }
          [data-theme='dark'] .premium-table .ant-table-tbody > tr > td {
            background: #161b22 !important;
            border-bottom-color: #1f2937 !important;
          }
          .premium-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-slate-50) !important;
          }
          [data-theme='dark'] .premium-table .ant-table-tbody > tr:hover > td {
            background: #1f2937 !important;
          }
          .premium-table .ant-table-tbody > tr {
            cursor: default;
          }
          [data-theme='dark'] .premium-table .ant-table {
            background: #161b22 !important;
          }
          [data-theme='dark'] .premium-table .ant-table-tbody > tr > td:first-child .ant-typography {
            background: #1f2937 !important;
            border-color: #374151 !important;
          }

          /* ── Misc ────────────────────────────────────────────── */
          .saas-header-container .ant-typography {
            margin-bottom: 0 !important;
          }
          .saas-button-item {
            border-radius: 4px !important;
            transition: all 0.2s ease;
            border: 1px solid var(--border-color);
          }
          .saas-button-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            background: var(--bg-pure-white) !important;
            border-color: var(--border-slate-300);
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
