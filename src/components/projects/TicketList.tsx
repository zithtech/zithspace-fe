'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  Input,
  Tag,
  Avatar,
  Alert,
  Table,
  Empty,
  Progress,
  message
} from 'antd';
import {
  PlusCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import TicketService, { Ticket } from '@/services/ticketService';
import { ProjectService } from '@/services/projectService';

const { Title, Text } = Typography;

interface FilterState {
  status: string[];
  priority: string[];
  project: string[];
  assignee: string[];
  search: string;
}

export default function TicketList() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Array<{ value: string; label: string; code: string }>>([]);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    project: [],
    assignee: [],
    search: ''
  });

  useEffect(() => {
    fetchTickets();
    fetchProjects();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await TicketService.getTickets({
        page: 1,
        limit: 50,
        status: filters.status.length > 0 ? filters.status[0] : undefined,
        priority: filters.priority.length > 0 ? filters.priority[0] : undefined,
        project: filters.project.length > 0 ? filters.project[0] : undefined,
        assignee: filters.assignee.length > 0 ? filters.assignee[0] : undefined,
        search: filters.search || undefined
      });
      setTickets(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      message.error('Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const projectsData = await ProjectService.getUserProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      case 'in_testing': return 'warning';
      case 'not_started': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'red';
      case 'P2': return 'orange';
      case 'P3': return 'green';
      default: return 'default';
    }
  };

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case 'Bug': return 'red';
      case 'Task': return 'blue';
      case 'Feat': return 'green';
      case 'Overwrite': return 'orange';
      default: return 'default';
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    router.push(`/tickets/${ticket.id}`);
  };

  const handleCreateTicket = () => {
    router.push('/projects/create');
  };

  const handleDeleteTicket = async (ticket: Ticket) => {
    const { Modal } = await import('antd');
    
    Modal.confirm({
      title: 'Delete Ticket',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete ticket ${ticket.ticketNumber}? This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await TicketService.deleteTicket(ticket.id);
          message.success('Ticket deleted successfully');
          fetchTickets(); // Refresh the list
        } catch (error) {
          console.error('Failed to delete ticket:', error);
          message.error('Failed to delete ticket');
        }
      }
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Ticket',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 100,
      render: (text: string) => (
        <Text strong style={{ color: '#1677ff' }}>
          {text}
        </Text>
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (text: string, record: Ticket) => (
        <div>
          <Text strong>{text}</Text>
          {/* <br /> */}
          {/* <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description.substring(0, 50)}...
          </Text> */}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority}
        </Tag>
      )
    },
    {
      title: 'Type',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 100,
      render: (taskType: string) => (
        <Tag color={getTaskTypeColor(taskType)}>
          {taskType}
        </Tag>
      )
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 150,
      render: (project: any) => {
        if (typeof project === 'string') {
          return <Tag color="blue">{project}</Tag>;
        }
        return (
          <Tag color="blue">
            {project.name} ({project.code})
          </Tag>
        );
      }
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 150,
      render: (assignee: any) => {
        const name = assignee && typeof assignee === 'string' ? assignee : assignee ? assignee?.name : 'Unassigned';
        return (
          <Space>
            <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
              {name.charAt(0)}
            </Avatar>
            <Text>{name}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt: string) => (
        <Text type="secondary">
          {dayjs(createdAt).format('MMM DD, YYYY')}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Ticket) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTicket(record)}
          >
            View
          </Button>
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTicket(record)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];
console.log('Projects:', tickets);
  // Show empty state if user has no projects
  if (!loading && projects.length === 0) {
    return (
      <div>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3}>Tickets</Title>
          </Col>
        </Row>
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">You are not a member of any projects yet.</Text>
                <br />
                <Text type="secondary">Contact your project manager to be added to a project.</Text>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>Tickets</Title>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchTickets}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleCreateTicket}
              disabled
            >
              Create Ticket
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={6} lg={4}>
            <Input
              placeholder="Search tickets..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder="Status"
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              options={[
                { label: 'Not Started', value: 'not_started' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'In Testing', value: 'in_testing' },
                { label: 'Completed', value: 'completed' }
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder="Priority"
              style={{ width: '100%' }}
              value={filters.priority}
              onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              options={[
                { label: 'High (P1)', value: 'P1' },
                { label: 'Medium (P2)', value: 'P2' },
                { label: 'Lite (P3)', value: 'P3' }
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder="Project"
              style={{ width: '100%' }}
              value={filters.project}
              onChange={(value) => setFilters(prev => ({ ...prev, project: value }))}
              options={projects.map(project => ({
                label: project.label,
                value: project.value
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Button
              type="primary"
              onClick={fetchTickets}
              loading={loading}
            >
              Apply Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tickets Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} tickets`,
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: tickets.length === 0 && !loading ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No tickets found for your projects"
              />
            ) : undefined
          }}
        />
      </Card>
    </div>
  );
}
