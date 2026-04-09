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
    } catch (error: any) {}
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
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" tip="Loading bucket details">
            <div style={{ padding: 20 }} />
          </Spin>
        </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: '0 32px 32px', background: 'var(--bg-pure-white)', minHeight: '100vh' }}>
        
        {/* Breadcrumbs & Simple Navigation */}
        <div style={{ padding: '20px 0 0' }}>
          <Breadcrumb 
            separator={<span style={{ color: 'var(--border-color)' }}>/</span>}
            items={[
              { title: <Link href="/projects/buckets" style={{ color: 'var(--text-secondary)' }}>Buckets</Link> },
              { title: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{bucket?.name}</span> },
            ]}
          />
        </div>

        {/* Header Section */}
        <div style={{ 
          padding: '24px 0', 
          marginBottom: 32, 
          borderBottom: '1px solid var(--border-color)' 
        }}>
          <Row justify="space-between" align="bottom" gutter={[24, 24]}>
            <Col>
              <Space size="large" align="start">
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 16, 
                  background: `${bucket?.color || '#1677ff'}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FolderOutlined style={{ fontSize: 28, color: bucket?.color || '#1677ff' }} />
                </div>
                <div style={{ marginTop: -4 }}>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {bucket?.name}
                  </Title>
                  <Space size="middle" style={{ marginTop: 4 }}>
                    {bucket?.project ? (
                      <Space size={6}>
                        <ProjectOutlined style={{ color: 'var(--text-secondary)' }} />
                        <Text type="secondary" strong style={{ color: 'var(--text-secondary)' }}>{bucket.project.name}</Text>
                        <Tag color="blue" style={{ borderRadius: 4, fontSize: 10, marginLeft: 4 }}>
                          {bucket.project.code}
                        </Tag>
                      </Space>
                    ) : (
                      <Tag color="purple">CROSS-PROJECT BUCKET</Tag>
                    )}
                    <span style={{ color: 'var(--border-color)' }}>|</span>
                    <Space size={6}>
                      <FileTextOutlined style={{ color: 'var(--text-secondary)' }} />
                      <Text type="secondary" style={{ color: 'var(--text-secondary)' }}>{tickets.length} Tickets</Text>
                    </Space>
                  </Space>
                </div>
              </Space>
            </Col>
            <Col>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => router.back()}
                style={{ borderRadius: 8, height: 40 }}
              >
                Back to Buckets
              </Button>
            </Col>
          </Row>
          {bucket?.description && (
            <div style={{ marginTop: 20, maxWidth: 800 }}>
              <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                {bucket.description}
              </Text>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Input
                placeholder="Search by ticket ID or title..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ 
                  width: '100%', 
                  maxWidth: 400, 
                  height: 44, 
                  borderRadius: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
                }}
                allowClear
              />
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Space size="middle">
                {selectedRowKeys.length > 0 && (
                  <div style={{ 
                    background: 'var(--bg-pure-white)', 
                    padding: '4px 8px 4px 16px', 
                    borderRadius: 12, 
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Text strong style={{ color: '#0050b3', marginRight: 16 }}>
                      {selectedRowKeys.length} Selected
                    </Text>
                    <Space size="small">
                      <Select
                        placeholder="Select Sprint"
                        style={{ width: 160 }}
                        value={selectedSprint}
                        onChange={setSelectedSprint}
                        variant="borderless"
                        popupClassName="premium-select-popup"
                        styles={{ popup: { root: { borderRadius: 12 } } }}
                      >
                        {sprints?.map((sprint: any) => (
                          <Option key={sprint.id} value={sprint.id}>
                            {sprint.version}
                          </Option>
                        ))}
                      </Select>
                      <Tooltip title="Move to Sprint">
                        <Button
                          type="primary"
                          icon={<RocketOutlined />}
                          onClick={handleMoveToSprint}
                          loading={isMovingToSprint}
                          disabled={!selectedSprint}
                          style={{ borderRadius: 8 }}
                        >
                          Move
                        </Button>
                      </Tooltip>
                      <Popconfirm
                        title="Delete Tickets"
                        description={`Move ${selectedRowKeys.length} selected tickets to trash?`}
                        onConfirm={handleMoveToTrash}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          loading={isDeleting}
                          style={{ borderRadius: 8 }}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                )}
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => refetchTickets()}
                  style={{ height: 44, width: 44, borderRadius: 10 }}
                />
              </Space>
            </Col>
          </Row>
        </div>

        {/* Results Table */}
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
                <Text type="secondary" style={{ fontSize: 13 }}>Total <b>{total}</b> tickets</Text>
              ),
              style: { padding: '16px 24px' }
            }}
            scroll={{ x: 1200 }}
            className="premium-table"
            locale={{
              emptyText: (
                <Empty
                  image={<FolderOutlined style={{ fontSize: 48, color: '#f0f0f0' }} />}
                  description={
                    <div style={{ padding: '20px 0' }}>
                      <Text type="secondary" style={{ display: 'block' }}>No tickets found in this bucket</Text>
                      {searchText && <Text type="secondary" style={{ fontSize: 12 }}>Try adjusting your search criteria</Text>}
                    </div>
                  }
                />
              )
            }}
          />
        </Card>
      </div>

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
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-color);
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-pure-white) !important;
          filter: brightness(0.98);
        }
        .premium-select-popup .ant-select-item {
          border-radius: 6px;
          margin: 4px;
        }
      `}</style>
    </MainLayout>
  );
}
