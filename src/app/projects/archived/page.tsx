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
} from 'antd';
import {
  FolderOpenOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FolderOutlined,
  ProjectOutlined,
  InfoCircleOutlined,
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
      title: 'Ticket #',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 140,
      fixed: 'left',
      render: (text) => (
        <Text strong style={{ background: '#f5f5f5', padding: '4px 10px', borderRadius: 6, fontSize: 13, color: '#1677ff', fontFamily: 'monospace' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 350,
      render: (text) => <Text strong style={{ fontSize: 14 }}>{text}</Text>
    },
    {
      title: 'Project',
      key: 'project',
      width: 180,
      render: (_: any, record: Ticket) => {
        const project = typeof record.project === 'object' ? record.project : null;
        if (!project) return null;
        return (
          <Space>
            <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 600 }}>{project.code}</Tag>
            <Text type="secondary" style={{ fontSize: 13 }}>{project.name}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => (
        <Tag color={status === 'completed' ? 'success' : 'default'} style={{ borderRadius: 6, textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>
          {status?.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority) => {
        const colors: Record<string, string> = {
          'HIGH': '#ff4d4f',
          'MEDIUM': '#faad14',
          'LOW': '#52c41a'
        };
        return (
          <Space size={6}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[priority] || '#d9d9d9' }} />
            <Text style={{ fontSize: 12, fontWeight: 500 }}>{priority}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Assignee',
      key: 'assignee',
      width: 200,
      render: (_: any, record: Ticket) => {
        const name = record.assignee?.name;
        if (!name) return <Text type="secondary" italic style={{ fontSize: 13 }}>Unassigned</Text>;
        return (
          <Space>
            <Avatar size="small" style={{ backgroundColor: '#1677ff', fontSize: 10 }}>{name.charAt(0)}</Avatar>
            <Text style={{ fontSize: 13 }}>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Archived',
      dataIndex: 'updatedAt',
      key: 'archivedAt',
      width: 150,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
        {/* Header Section */}
        <div style={{
          padding: "24px 0",
          marginBottom: 32,
          borderBottom: "1px solid var(--border-color)",
          background: "var(--bg-pure-white)",
          position: "sticky",
          top: 0,
          zIndex: 10
        }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#f0f5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <FolderOpenOutlined style={{ fontSize: 24, color: "#1677ff" }} />
                </div>
                <Space direction="vertical" size={2}>
                  <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>
                    Archived Tickets
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Completed issues stored for long-term tracking and reporting
                  </Text>
                </Space>
              </div>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: "right" }}>
              <Space size="middle">
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title="Move to Trash"
                    description={`Move ${selectedRowKeys.length} issues to trash?`}
                    onConfirm={handleDelete}
                    okText="Move to Trash"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                    styles={{ body: { padding: '12px' } }}
                  >
                    <Button
                      danger
                      type="primary"
                      icon={<DeleteOutlined />}
                      loading={isDeleting}
                      style={{ height: 40, borderRadius: 8, fontWeight: 600 }}
                    >
                      Delete Selection ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReload}
                  loading={isRefreshing || isFetching || statsLoading}
                  style={{ height: 40, borderRadius: 8 }}
                />
              </Space>
            </Col>
          </Row>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>


          {statsLoading ? (
            <div style={{ flex: 1 }}>
              <Card style={{ borderRadius: 12, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-pure-white)', height: 82, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="small" />
              </Card>
            </div>
          ) : (
            projectStats.map((p: any) => (
              <div key={p.id} style={{ flex: '0 0 160px' }}>
                <Card
                  styles={{ body: { padding: '16px 20px' } }}
                  style={{
                    borderRadius: 12,
                    height: '100%',
                    border: selectedProject === p.id ? '2px solid #1677ff' : '1px solid var(--border-color)',
                    background: 'var(--bg-pure-white)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: selectedProject === p.id ? '0 4px 12px rgba(22, 119, 255, 0.15)' : 'none'
                  }}
                  onClick={() => setSelectedProject(p.id)}
                >
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#8c8c8c' }}>{p.code}</Text>
                      {selectedProject === p.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1677ff' }} />}
                    </div>
                    <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{p.count}</Title>
                    <Text ellipsis style={{ fontSize: 11, color: '#bfbfbf', display: 'block', marginTop: -2 }}>
                      {p.name} - <small>{p.code}</small>
                    </Text>
                  </Space>
                </Card>
              </div>
            ))
          )}
        </div>

        {/* Filters Row */}
        <Card styles={{ body: { padding: 20 } }} style={{ borderRadius: 12, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-pure-white)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} md={12} lg={12}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong style={{ fontSize: 13 }}>Search Tickets</Text>
                <Input
                  placeholder="Filter by Project Code, Ticket ID, or Title..."
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ borderRadius: 8 }}
                  allowClear
                  size="large"
                />
              </Space>
            </Col>
            <Col xs={24} md={8} lg={7}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong style={{ fontSize: 13 }}>Project</Text>
                <Select
                  placeholder="All Projects"
                  style={{ width: '100%' }}
                  value={selectedProject}
                  onChange={setSelectedProject}
                  allowClear
                  size="large"
                  suffixIcon={<ProjectOutlined />}
                  optionLabelProp="label"
                >
                  {projects?.map((project: any) => (
                    <Option key={project.value} value={project.value} label={`${project.label} - ${project.code}`}>
                      <Text style={{ fontSize: 13 }}>{project.label} - <Text type="secondary" style={{ fontSize: 12 }}>{project.code}</Text></Text>
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col flex="auto" style={{ textAlign: 'right', paddingBottom: 10 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Showing <b>{tickets.length}</b> of <b>{totalArchived}</b> archived tickets
              </Text>
            </Col>
          </Row>
        </Card>

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
          .premium-table .ant-table-thead > tr > th {
            background: var(--bg-pure-white);
            font-weight: 600;
            color: var(--text-secondary);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 16px;
            border-bottom: 1px solid var(--border-color);
          }
          .premium-table .ant-table-tbody > tr > td {
            padding: 16px;
            border-bottom: 1px solid var(--border-color);
          }
          .ant-table-row:hover .ant-typography-strong {
            color: #1677ff;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
