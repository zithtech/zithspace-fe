'use client';
// commit merge merge
import React, { useState, use, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Empty,
  Badge,
  Breadcrumb,
  Popconfirm,
  message as antdMessage,
  Spin,
  Avatar,
  Row,
  Col,
  Tooltip,
  Divider,
} from 'antd';
import {
  FolderOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  RocketOutlined,
  FileTextOutlined,
  UserOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useBucket, useBucketTickets, bucketKeys } from '@/hooks/useBuckets';
import { useUpdateTicket, ticketKeys } from '@/hooks/useTickets';
import { useMoveToTrash } from '@/hooks/useTrash';
import { useAvailableSprints } from '@/hooks/useAvailableSprints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface BucketTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  storyPoint?: number;
  project: {
    id: string;
    name: string;
    code: string;
  };
  assignee?: {
    id: string;
    name: string;
    workEmail: string;
  };
  createdAt: string;
}

export default function BucketDetailPage({ params }: { params: Promise<{ bucketId: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoading: authLoading } = useAuth();
  const { canReadProject } = usePermission();
  const [messageApi, contextHolder] = antdMessage.useMessage();

  // Unwrap the params promise using React's use() hook
  const { bucketId } = use(params);

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadProject) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadProject, router]);

  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);

  // Use useBucket hook
  const { data: bucket, isLoading: bucketLoading } = useBucket(bucketId);

  // Use useBucketTickets hook for fetching tickets
  const [page, setPage] = useState(1);
  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useBucketTickets(bucketId, page, 100);

  // Fetch available sprints
  const { data: sprints } = useAvailableSprints(bucket?.project?.id);

  // Mutations
  const { mutateAsync: updateTicket, isPending: isMovingToSprint } = useUpdateTicket();
  const { mutateAsync: moveToTrash, isPending: isDeleting } = useMoveToTrash();

  const handleMoveToSprint = async () => {
    if (!selectedSprint || selectedRowKeys.length === 0) {
      antdMessage.warning("Please select tickets and a sprint");
      return;
    }

    try {
      await Promise.all(
        selectedRowKeys.map((ticketId) =>
          updateTicket({
            id: ticketId as string,
            data: { sprintPlanId: selectedSprint, bucketId: null } as any,
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });

      antdMessage.success(`${selectedRowKeys.length} ticket(s) moved to sprint`);
      setSelectedRowKeys([]);
      setSelectedSprint(null);
      refetchTickets();
    } catch (error: any) {
      antdMessage.error(`Failed to move tickets: ${error.message || 'Unknown error'}`);
    }
  };

  const handleMoveToTrash = async () => {
    if (selectedRowKeys.length === 0) return;

    try {
      await moveToTrash(selectedRowKeys as string[]);
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      setSelectedRowKeys([]);
      refetchTickets();
    } catch (error: any) { }
  };

  const tickets = useMemo(() => {
    const all = ticketsData?.tickets || [];
    if (!searchText) return all;
    const lower = searchText.toLowerCase();
    return all.filter((t: BucketTicket) =>
      t.title.toLowerCase().includes(lower) ||
      t.ticketNumber.toLowerCase().includes(lower)
    );
  }, [ticketsData, searchText]);

  const columns: ColumnsType<BucketTicket> = [
    {
      title: 'Ticket ID',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 140,
      fixed: 'left',
      render: (text) => (
        <Text strong style={{ color: '#1677ff', fontFamily: 'monospace', fontSize: 13 }}>
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
      render: (text) => (
        <Text strong style={{ fontSize: 14 }}>{text}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const color = status === 'completed' ? 'green' : status === 'in_progress' ? 'blue' : 'default';
        return (
          <Tag color={color} style={{ borderRadius: 6, textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>
            {status?.replace('_', ' ')}
          </Tag>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority) => {
        const colors: any = { HIGH: 'red', MEDIUM: 'orange', LOW: 'blue' };
        return (
          <Tag color={colors[priority] || 'default'} style={{ borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
            {priority}
          </Tag>
        );
      },
    },
    {
      title: 'Points',
      dataIndex: 'storyPoint',
      key: 'storyPoint',
      width: 90,
      align: 'center',
      render: (points) => (
        <Badge
          count={points || 0}
          showZero
          style={{ backgroundColor: points ? '#52c41a' : '#d9d9d9', boxShadow: 'none' }}
        />
      ),
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 180,
      render: (assignee) => (
        assignee ? (
          <Space>
            <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
              {assignee.name.charAt(0)}
            </Avatar>
            <Text style={{ fontSize: 13 }}>{assignee.name}</Text>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>Unassigned</Text>
        )
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(date).format('MMM D, YYYY')}
        </Text>
      ),
    },
  ];

  if (authLoading || bucketLoading) {
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
          <Spin size="large" tip="Orchestrating bucket inventory..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ background: "var(--bg-pure-white)", minHeight: "100vh" }}>
        {contextHolder}

        {/* 1. Global Workstation Header */}
        <div className="saas-header-container" style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          padding: '10.5px 48px',
          margin: '0 -24px 24px',
          marginBottom: 24
        }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <Space size={16}>
                <div style={{
                  width: 36,
                  height: 36,
                  background: `${bucket?.color || '#8b5cf6'}15`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${bucket?.color || '#8b5cf6'}30`
                }}>
                  <FolderOutlined style={{ fontSize: 18, color: bucket?.color || '#8b5cf6' }} />
                </div>
                <Space split={<Divider type="vertical" style={{ height: 18, borderLeft: '1.5px solid #cbd5e1' }} />} size={16}>
                  <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
                    {bucket?.name} Details
                  </Title>
                  <Text style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    Tickets inspection and inventory auditing terminal
                  </Text>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space size={12}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.back()}
                  className="saas-button-item"
                  style={{ height: 36, fontWeight: 600 }}
                >
                  Return to Hub
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: bucketKeys.all });
                    refetchTickets();
                  }}
                  loading={ticketsLoading || bucketLoading}
                  className="saas-button-item"
                  style={{ height: 36, fontWeight: 600 }}
                />
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ padding: "0 32px 32px" }}>
          {/* 2. Analytical Metrics Group */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
            marginBottom: 24
          }}>
            {/* Scoped Issues */}
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #f1f5f9'
              }}>
                <FileTextOutlined style={{ fontSize: 18, color: '#64748b' }} />
              </div>
              <div>
                <Text style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>{tickets.length}</Text>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL TICKETS</Text>
              </div>
            </div>

            {/* Total Velocity Points */}
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #dcfce7'
              }}>
                <RocketOutlined style={{ fontSize: 18, color: '#10b981' }} />
              </div>
              <div>
                <Text style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                  {tickets.reduce((acc, t) => acc + (t.storyPoint || 0), 0)}
                </Text>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>RESOURCE LOAD</Text>
              </div>
            </div>

            {/* Project Context */}
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              gridColumn: 'span 2'
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #dbeafe'
              }}>
                <ProjectOutlined style={{ fontSize: 18, color: '#3b82f6' }} />
              </div>
              <div>
                <Text style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'block', lineHeight: 1.2 }}>
                  {bucket?.project?.name || 'Cross-Project Scope'}
                </Text>
                <Space size={4} style={{ marginTop: 2 }}>
                  <Tag color="blue" style={{ borderRadius: 4, height: 16, fontSize: 9, fontWeight: 800, border: 'none', lineHeight: '16px' }}>
                    {bucket?.project?.code || 'SYSTEM'}
                  </Tag>
                  <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PRIMARY PROJECT ORIGIN</Text>
                </Space>
              </div>
            </div>
          </div>

          {/* 3. High-Density Unified Control Bar */}
          <div style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 28,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
              {/* Batch Actions Group */}
              {selectedRowKeys.length > 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#f8fafc',
                  padding: '4px 16px',
                  borderRadius: 6,
                  border: '1.5px solid #3b82f6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRight: '1.5px solid #e2e8f0', paddingRight: 16 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                    <Text style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{selectedRowKeys.length} SELECTED</Text>
                  </div>

                  <Space size={12}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Ship to:</Text>
                      <Select
                        placeholder="Select Phase"
                        variant="borderless"
                        style={{ width: 140, fontSize: 12, fontWeight: 700, background: '#fff', borderRadius: 4, height: 32, border: '1px solid #e2e8f0' }}
                        value={selectedSprint}
                        onChange={setSelectedSprint}
                      >
                        {sprints?.map((sprint: any) => (
                          <Option key={sprint.id} value={sprint.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <RocketOutlined style={{ fontSize: 10, color: '#3b82f6' }} />
                              <span>{sprint.version}</span>
                            </div>
                          </Option>
                        ))}
                      </Select>
                      <Button
                        type="primary"
                        size="small"
                        onClick={handleMoveToSprint}
                        loading={isMovingToSprint}
                        disabled={!selectedSprint}
                        style={{ borderRadius: 4, fontWeight: 700, height: 32 }}
                      >
                        Execute Move
                      </Button>
                    </div>

                    <Popconfirm
                      title="Purge Selection"
                      description={`Purge ${selectedRowKeys.length} items to trash?`}
                      onConfirm={handleMoveToTrash}
                    >
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        loading={isDeleting}
                        style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}
                      >
                        Purge
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              ) : (
                /* Static Description when no selection */
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 4, height: 24, borderRadius: 2, background: bucket?.color || '#8b5cf6' }} />
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, fontStyle: 'italic', color: '#64748b' }}>
                    {bucket?.description || 'Strategic categorization node active. Deep scan for inventory specifics.'}
                  </Text>
                </div>
              )}
            </div>

            {/* Deep Scan Search Module */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#f8fafc',
              padding: '2px 6px 2px 16px',
              borderRadius: 8,
              border: searchText ? '1px solid #3b82f6' : '1px solid #f1f5f9',
              width: 320,
              transition: 'all 0.2s ease',
              boxShadow: searchText ? '0 0 0 3px rgba(59, 130, 246, 0.05)' : 'none'
            }}>
              <SearchOutlined style={{ color: searchText ? '#3b82f6' : '#94a3b8', fontSize: 13 }} />
              <Input
                placeholder="Deep scan inventory..."
                variant="borderless"
                style={{ fontSize: 12, fontWeight: 700, padding: '8px 0', flex: 1 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              {searchText ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#eff6ff',
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: '1px solid #dbeafe',
                  animation: 'pulse 2s infinite'
                }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} />
                  <Text style={{ fontSize: 9, fontWeight: 900, color: '#1d4ed8', letterSpacing: '0.04em' }}>ACTIVE</Text>
                </div>
              ) : (
                <div style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  padding: '2px 6px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8' }}>⌘K</Text>
                </div>
              )}
            </div>
          </div>

          {/* 4. Results Table Terminal */}
          <Card
            bodyStyle={{ padding: 0 }}
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-pure-white)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="id"
              loading={ticketsLoading}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => (
                  <Text type="secondary" style={{ fontSize: 13 }}>Total <b>{total}</b> technical nodes</Text>
                ),
                style: { padding: '16px 24px' }
              }}
              scroll={{ x: 1200 }}
              className="premium-table"
              locale={{
                emptyText: (
                  <Empty
                    image={<FolderOutlined style={{ fontSize: 48, color: '#f1f5f9' }} />}
                    description={
                      <div style={{ padding: '20px 0' }}>
                        <Text type="secondary" style={{ display: 'block', fontSize: 16, fontWeight: 500 }}>No technical nodes found</Text>
                        {searchText && <Text type="secondary" style={{ fontSize: 12 }}>Adjusting filter parameters for broader scan...</Text>}
                      </div>
                    }
                  />
                )
              }}
            />
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .premium-table .ant-table-thead > tr > th {
          background: #f8fafc;
          font-weight: 800;
          color: #64748b;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 14px 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
      `}</style>
    </MainLayout>
  );
}
