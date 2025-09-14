'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  Alert,
  Popconfirm,
  Tag,
  DatePicker,
  Card,
  Row,
  Col,
  Tooltip,
  Avatar,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  TeamOutlined,
  CalendarOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ProjectService, Project, CreateProjectData, UpdateProjectData, ProjectsFilters } from '@/services/projectService';
import { MembersService } from '@/services/membersService';
import { useAuth } from '@/context/AuthContext';
import { RBAC } from '@/lib/rbac';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import MainLayout from '@/components/layout/MainLayout';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Member {
  value: string;
  label: string;
  position: string;
}

const ProjectsManagePage: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();

  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filters
  const [filters, setFilters] = useState<ProjectsFilters>({
    page: 1,
    limit: 10,
  });

  // Load data
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await ProjectService.getProjects(filters);
      setProjects(response.data);
      console.log({projects:response.data})
      setPagination({
        current: response.pagination.current,
        pageSize: response.pagination.pageSize,
        total: response.pagination.total,
      });
    } catch (error) {
      message.error('Failed to load projects');
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const membersList = await MembersService.getMembersForSelect();
      setMembers(membersList);
    } catch (error) {
      message.error('Failed to load members');
      console.error('Error loading members:', error);
    }
  };

  useEffect(() => {
    loadProjects();
    loadMembers();
  }, [filters]);

  // Handle table pagination
  const handleTableChange = (pagination: any) => {
    setFilters(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
    }));
  };

  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value || undefined,
      page: 1,
    }));
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status || undefined,
      page: 1,
    }));
  };

  // Handle project manager filter
  const handleProjectManagerFilter = (projectManager: string) => {
    setFilters(prev => ({
      ...prev,
      projectManagerId: projectManager || undefined,
      page: 1,
    }));
  };

  // Handle date range filter
  const handleDateRangeFilter = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
        page: 1,
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
        page: 1,
      }));
    }
  };

  // Handle create/edit project
  const handleSubmit = async (values: any) => {
    try {
      setError("");
      const projectData = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
      };

      if (editingProject) {
        await ProjectService.updateProject(editingProject.id, projectData as UpdateProjectData);
        setSuccess('Project updated successfully');
      } else {
        await ProjectService.createProject(projectData as CreateProjectData);
        setSuccess('Project created successfully');
      }

      setModalVisible(false);
      setEditingProject(null);
      form.resetFields();
      loadProjects();
    } catch (error: any) {
      setError(error.message || 'Failed to save project');
    }
  };

  // Handle delete project
  const handleDelete = async (id: string) => {
    try {
      setError("");
      await ProjectService.deleteProject(id);
      setSuccess('Project deleted successfully');
      loadProjects();
    } catch (error: any) {
      setError(error.message || 'Failed to delete project');
    }
  };

  // Handle edit
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      ...project,
      startDate: dayjs(project.startDate),
      endDate: project.endDate ? dayjs(project.endDate) : null,
      projectManager: project.projectManager.id,
      teamMembers: project.members.map(member => member.user.id),
    });
    setModalVisible(true);
  };

  // Handle add new
  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'planning',
      defaultPriority: 'medium',
    });
    setModalVisible(true);
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'blue',
      active: 'green',
      'on-hold': 'orange',
      completed: 'purple',
      cancelled: 'red',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'red',
      medium: 'orange',
      low: 'green',
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  // Table columns
  const columns: ColumnsType<Project> = [
    {
      title: 'Project',
      key: 'project',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name}</div>
          <div className="text-sm text-gray-500">{record.code}</div>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase().replace('-', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Project Manager',
      key: 'projectManager',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Avatar size="small">{record?.projectManager?.name.charAt(0)}</Avatar>
          <div>
            <div className="font-medium">{record?.projectManager?.name}</div>
            <div className="text-sm text-gray-500">{record.projectManager?.position}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Team',
      key: 'teamMembers',
      render: (_, record) => (
        <div className="flex items-center space-x-1">
          <TeamOutlined />
          <span>{record?.members?.length || 0} members</span>
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'defaultPriority',
      key: 'defaultPriority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => (
        <div className="text-sm">
          <div>Start: {dayjs(record?.startDate).format('MMM DD, YYYY')}</div>
          {record.endDate && (
            <div>End: {dayjs(record?.endDate).format('MMM DD, YYYY')}</div>
          )}
        </div>
      ),
    },
    // {
    //   title: 'Statistics',
    //   key: 'statistics',
    //   render: (_, record) => (
    //     <div className="text-sm">
    //       <div>Total: {record.statistics.totalTickets}</div>
    //       <div>Completed: {record.statistics.completedTickets}</div>
    //     </div>
    //   ),
    // },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                // Navigate to project details - implement as needed
                message.info('Project details view - to be implemented');
              }}
            />
          </Tooltip>
          {user?.role && RBAC.hasPermission(user.role as any, 'projects', 'update') && (
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {user?.role && RBAC.hasPermission(user.role as any, 'projects', 'delete') && (
            <Popconfirm
              title="Are you sure you want to delete this project?"
              description="This action cannot be undone and may affect related tickets."
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (!user?.role || !RBAC.hasPermission(user.role as any, 'projects', 'read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view projects.</p>
        </div>
      </div>
    );
  }

  // Clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Space align="center">
              <ProjectOutlined style={{ fontSize: 24, color: "#1677ff" }} />
              <Title level={3} style={{ margin: 0 }}>
                Projects Management
              </Title>
            </Space>
            {user?.role && RBAC.hasPermission(user.role as any, 'projects', 'create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                size="middle"
              >
                Add Project
              </Button>
            )}
          </Space>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16, fontSize: 13 }}
            onClose={() => setError("")}
          />
        )}
        {success && (
          <Alert
            message={success}
            type="success"
            showIcon
            closable
            style={{ marginBottom: 16, fontSize: 13 }}
            onClose={() => setSuccess("")}
          />
        )}

        {/* Filters Card */}
        <Card
          size="small"
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: 16 } }}
        >
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search projects..."
              prefix={<SearchOutlined />}
              value={filters.search || ""}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />

            <Select
              placeholder="Filter by status"
              value={filters.status}
              onChange={handleStatusFilter}
              style={{ width: 200 }}
              allowClear
            >
              <Option value="planning">Planning</Option>
              <Option value="active">Active</Option>
              <Option value="on-hold">On Hold</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>

            <Select
              placeholder="Filter by project manager"
              value={filters.projectManagerId}
              onChange={handleProjectManagerFilter}
              style={{ width: 250 }}
              allowClear
              showSearch
              filterOption={(input, option) => {
                const member = members.find(m => m.value === option?.value);
                return member ? 
                  (member.label.toLowerCase().includes(input.toLowerCase()) || 
                   member.position.toLowerCase().includes(input.toLowerCase())) : false;
              }}
            >
              {members.map(member => (
                <Option key={member.value} value={member.value}>
                  {member.label} - {member.position}
                </Option>
              ))}
            </Select>

            <RangePicker
              placeholder={['Start Date', 'End Date']}
              onChange={handleDateRangeFilter}
              style={{ width: 250 }}
            />
          </div>
        </Card>

        {/* Projects Table */}
        <Card size="small">
          <Table
            columns={columns}
            dataSource={projects}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total}`,
              onChange: (page, pageSize) => {
                setFilters((prev) => ({
                  ...prev,
                  page: page,
                  limit: pageSize || 10,
                }));
              },
            }}
            scroll={{ x: 1200 }}
          />
        </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingProject(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'planning',
            defaultPriority: 'medium',
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Project Name"
                rules={[
                  { required: true, message: 'Please enter project name' },
                  { min: 2, message: 'Name must be at least 2 characters' },
                ]}
              >
                <Input placeholder="Enter project name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  <Option value="planning">Planning</Option>
                  <Option value="active">Active</Option>
                  <Option value="on-hold">On Hold</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter project description"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="projectManager"
                label="Project Manager"
                rules={[{ required: true, message: 'Please select project manager' }]}
              >
                <Select
                  placeholder="Select project manager"
                  showSearch
                  filterOption={(input, option) => {
                    const member = members.find(m => m.value === option?.value);
                    return member ? 
                      (member.label.toLowerCase().includes(input.toLowerCase()) || 
                       member.position.toLowerCase().includes(input.toLowerCase())) : false;
                  }}
                >
                  {members.map(member => (
                    <Option key={member.value} value={member.value}>
                      {member.label} - {member.position}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="defaultPriority"
                label="Default Priority"
                rules={[{ required: true, message: 'Please select default priority' }]}
              >
                <Select placeholder="Select default priority">
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="teamMembers"
            label="Team Members"
          >
            <Select
              mode="multiple"
              placeholder="Select team members"
              showSearch
              filterOption={(input, option) => {
                const member = members.find(m => m.value === option?.value);
                return member ? 
                  (member.label.toLowerCase().includes(input.toLowerCase()) || 
                   member.position.toLowerCase().includes(input.toLowerCase())) : false;
              }}
            >
              {members.map(member => (
                <Option key={member.value} value={member.value}>
                  {member.label} - {member.position}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="endDate"
                label="End Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setModalVisible(false);
                setEditingProject(null);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingProject ? 'Update' : 'Create'} Project
            </Button>
          </div>
        </Form>
      </Modal>
      </div>
    </MainLayout>
  );
};

export default ProjectsManagePage;
