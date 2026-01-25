'use client';

import React, { useState } from 'react';
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
  App,
  Empty,
  Badge,
  Breadcrumb,
} from 'antd';
import {
  FolderOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBucket, useBucketTickets } from '@/hooks/useBuckets';
import { useUpdateTicket } from '@/hooks/useTickets';
import { useMoveToTrash } from '@/hooks/useTrash';
import { useQuery } from '@tanstack/react-query';
import ReleasePlanService from '@/services/releasePlanService';

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
}

export default function BucketDetailPage({ params }: { params: { bucketId: string } }) {
  const { message, modal } = App.useApp();
  const router = useRouter();

  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null);

  // Use useBucket hook
  const { data: bucket, isLoading: bucketLoading, refetch: refetchBucket } = useBucket(params.bucketId);

  // Use useBucketTickets hook for fetching tickets
  const [page, setPage] = useState(1);
  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useBucketTickets(params.bucketId, page, 100);

  // Fetch all sprints for the project and filter out completed ones
  const { data: allSprints } = useQuery({
    queryKey: ['sprints', bucket?.project?.id],
    queryFn: async () => {
      if (!bucket?.project?.id) return [];
      const response = await ReleasePlanService.getReleasePlans({
        project: bucket.project.id,
        type: 'sprint_plan',
      });
      return response.data || [];
    },
    enabled: !!bucket?.project?.id,
  });

  // Filter out completed sprints - only show active and planning sprints
  const sprints = allSprints?.filter((s: any) => s.status !== 'completed') || [];

  // Use useUpdateTicket hook for moving to sprint
  const { mutate: updateTicket, isPending: isMovingToSprint } = useUpdateTicket();

  // Use useMoveToTrash hook
  const { mutate: moveToTrash, isPending: isDeleting } = useMoveToTrash();

  const handleMoveToSprint = () => {
    if (!selectedSprint) {
      message.warning('Please select a sprint');
      return;
    }
    if (selectedRowKeys.length === 0) {
      message.warning('Please select tickets');
      return;
    }

    const selectedSprintData = sprints?.find((s: any) => s.id === selectedSprint);
    modal.confirm({
      title: 'Move to Sprint?',
      content: `Move ${selectedRowKeys.length} ticket(s) to sprint "${selectedSprintData?.version}"?`,
      okText: 'Move',
      onOk: () => {
        // Move tickets one by one
        let completed = 0;
        selectedRowKeys.forEach((ticketId) => {
          updateTicket(
            { id: ticketId as string, data: { releasePlan: selectedSprint, bucketId: null } as any },
            {
              onSuccess: () => {
                completed++;
                if (completed === selectedRowKeys.length) {
                  message.success(`${completed} ticket(s) moved to sprint`);
                  setSelectedRowKeys([]);
                  setSelectedSprint(null);
                  refetchTickets();
                }
              },
            }
          );
        });
      },
    });
  };

  const handleMoveToTrash = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select tickets');
      return;
    }

    modal.confirm({
      title: 'Move to Trash?',
      content: `Move ${selectedRowKeys.length} ticket(s) to trash? They can be restored within 7 days.`,
      okText: 'Move to Trash',
      okType: 'danger',
      onOk: () => {
        moveToTrash(selectedRowKeys as string[], {
          onSuccess: () => {
            setSelectedRowKeys([]);
            refetchBucket();
          },
        });
      },
    });
  };

  const allTickets = ticketsData?.tickets || [];
  const tickets = allTickets.filter((ticket: BucketTicket) =>
    searchText
      ? ticket.title.toLowerCase().includes(searchText.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchText.toLowerCase())
      : true
  );

  const columns: ColumnsType<BucketTicket> = [
    {
      title: 'Ticket',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 120,
      fixed: 'left',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 300,
    },
    {
      title: 'Project',
      key: 'project',
      width: 150,
      render: (_: any, record: BucketTicket) => (
        <Space>
          {/* <Tag color="blue">{record.project.code}</Tag> */}
          <Text>{record.project.name}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'completed' ? 'success' : status === 'in_progress' ? 'processing' : 'default'}>
          {status?.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => {
        const color = priority === 'HIGH' ? 'red' : priority === 'MEDIUM' ? 'orange' : 'default';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: 'Points',
      dataIndex: 'storyPoint',
      key: 'storyPoint',
      width: 80,
      align: 'center',
      render: (points) => (
        <Badge count={points} showZero style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: 'Assignee',
      dataIndex: ['assignee', 'name'],
      key: 'assignee',
      width: 150,
      ellipsis: true,
      render: (name) => name || <Text type="secondary">Unassigned</Text>,
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item>
              <Link href="/projects/buckets">Buckets</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{bucket?.name || 'Loading...'}</Breadcrumb.Item>
          </Breadcrumb>

          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
              >
                Back
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                <FolderOutlined /> {bucket?.name || 'Loading...'}
              </Title>
              {bucket?.project && (
                <Tag color="blue">{bucket.project.name}</Tag>
              )}
            </Space>
            {bucket?.description && (
              <Text type="secondary">{bucket.description}</Text>
            )}
            <Text type="secondary">
              {tickets.length} ticket(s) in this bucket
            </Text>
          </Space>
        </div>

        {/* Filters & Actions */}
        <Card style={{ marginBottom: 16 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Input
              placeholder="Search tickets..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Space>
              {selectedRowKeys.length > 0 && (
                <>
                  <Select
                    placeholder="Move to Sprint"
                    style={{ width: 200 }}
                    value={selectedSprint}
                    onChange={setSelectedSprint}
                    suffixIcon={<RocketOutlined />}
                  >
                    {sprints?.map((sprint: any) => (
                      <Option key={sprint.id} value={sprint.id}>
                        {sprint.version}
                      </Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    icon={<RocketOutlined />}
                    onClick={handleMoveToSprint}
                    loading={isMovingToSprint}
                    disabled={!selectedSprint}
                  >
                    Move ({selectedRowKeys.length})
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleMoveToTrash}
                    loading={isDeleting}
                  >
                    Delete ({selectedRowKeys.length})
                  </Button>
                </>
              )}
              <Button icon={<ReloadOutlined />} onClick={() => refetchBucket()}>
                Refresh
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Tickets Table */}
        <Card>
          {tickets.length === 0 && !bucketLoading ? (
            <Empty
              image={<FolderOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description="No tickets in this bucket"
            />
          ) : (
            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="id"
              loading={bucketLoading}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} tickets`,
              }}
              scroll={{ x: 1200 }}
              size="small"
            />
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
