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
  Popconfirm,
} from 'antd';
import {
  FolderOpenOutlined,
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUserProjects } from '@/hooks/useGlobalData';
import { useTickets } from '@/hooks/useTickets';
import { useMoveToTrash } from '@/hooks/useTrash';
import { Ticket } from '@/services/ticketService';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ArchivedTicketsPage() {
  const { message, modal } = App.useApp();
  const { data: projects } = useUserProjects();

  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Use useTickets hook with archivedOnly flag to show ONLY archived tickets
  const { data: ticketsData, isLoading, refetch } = useTickets({
    archivedOnly: true,
    projectId: selectedProject,
    search: searchText,
    page,
    limit: pageSize,
  });

  // Use useMoveToTrash hook
  const { mutate: moveToTrash, isPending: isDeleting } = useMoveToTrash();

  const handleDelete = () => {
    moveToTrash(selectedRowKeys as string[], {
      onSuccess: () => {
        message.success(`${selectedRowKeys.length} ticket(s) moved to trash`);
        setSelectedRowKeys([]);
        refetch();
      },
      onError: (error: any) => {
        message.error(`Failed to move to trash: ${error.message || 'Unknown error'}`);
      }
    });
  };

  const tickets = ticketsData?.data || [];
  const pagination = ticketsData?.pagination;

  const columns: ColumnsType<Ticket> = [
    {
      title: 'Ticket',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 120,
      fixed: 'left',
      render: (text) => <Tag color="default">{text}</Tag>,
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
      render: (_: any, record: Ticket) => {
        const project = typeof record.project === 'object' ? record.project : null;
        if (!project) return null;
        return (
          <Space>
            <Tag color="blue">{project.code}</Tag>
            <Text>{project.name}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'completed' ? 'success' : 'default'}>
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
        <div style={{ marginBottom: 24 }}>
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Title level={3} style={{ margin: 0 }}>
              <FolderOpenOutlined /> Archived Tickets
            </Title>
            <Text type="secondary">
              Completed tickets that were archived during sprint completion. These tickets are stored long-term.
            </Text>
          </Space>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space wrap>
              <Input
                placeholder="Search tickets..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                placeholder="All Projects"
                style={{ width: 200 }}
                value={selectedProject}
                onChange={setSelectedProject}
                allowClear
              >
                {projects?.map((project: any) => (
                  <Option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </Option>
                ))}
              </Select>
            </Space>
            <Space>
              {selectedRowKeys.length > 0 && (
                <Popconfirm
                  title="Move to Trash?"
                  description={`Move ${selectedRowKeys.length} archived ticket(s) to trash? They can be restored within 7 days.`}
                  onConfirm={handleDelete}
                  okText="Move to Trash"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={isDeleting}
                  >
                    Delete ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
              <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                Refresh
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Tickets Table */}
        <Card>
          {tickets.length === 0 && !isLoading ? (
            <Empty
              image={<FolderOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description={
                <div>
                  <Text type="secondary">No archived tickets found</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tickets are automatically archived when sprints are completed
                  </Text>
                </div>
              }
            />
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
                showTotal: (total) => `Total ${total} archived tickets`,
                onChange: (newPage, newPageSize) => {
                  setPage(newPage);
                  setPageSize(newPageSize);
                },
              }}
              scroll={{ x: 1400 }}
              size="small"
            />
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
