'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Table,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  message,
  Progress,
  Tag,
  Drawer,
  List,
  Avatar,
  Spin,
  Empty,
  Popconfirm,
  Tooltip,
  Divider,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  TeamOutlined,
  SearchOutlined,
  CloseOutlined,
  LoadingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import ReleasePlanService, { ReleasePlan, ReleasePlanFormData, ProjectTicket } from '@/services/releasePlanService';
import { ProjectService } from '@/services/projectService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function ReleasePlanComponent() {
  const router = useRouter();
  const [form] = Form.useForm();
  
  // State management
  const [releasePlans, setReleasePlans] = useState<ReleasePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ReleasePlan | null>(null);
  const [projects, setProjects] = useState<Array<{ value: string; label: string; code: string }>>([]);
  
  // Ticket selection state
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [availableTickets, setAvailableTickets] = useState<ProjectTicket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<ProjectTicket[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Drawer state for ticket details
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerReleasePlan, setDrawerReleasePlan] = useState<ReleasePlan | null>(null);

  // Search debounce timer
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    loadProjects();
  }, []);

  // Cleanup search timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchTimer]);

  // Update selected ticket details when selection changes
  useEffect(() => {
    if (selectedTickets.length > 0 && availableTickets.length > 0) {
      const details = availableTickets.filter(ticket => selectedTickets.includes(ticket.id));
      setSelectedTicketDetails(details);
    } else {
      setSelectedTicketDetails([]);
    }
  }, [selectedTickets, availableTickets]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await ReleasePlanService.getReleasePlans();
      setReleasePlans(data?.data || []);
    } catch (error) {
      console.error('Failed to load release plans:', error);
      message.error('Failed to load release plans');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await ProjectService.getUserProjects();
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadTicketsByProject = useCallback(async (projectId: string, search?: string, isSearching?: boolean) => {
    if (!projectId) return;
    
    try {
      if (isSearching) {
        setSearchLoading(true);
      } else {
        setTicketLoading(true);
      }
      
      const tickets = await ReleasePlanService.getTicketsByProject(projectId, {
        search: search || undefined,
        limit: search ? 50 : 20,
        excludeReleasePlan: editingPlan?.id
      });
      
      setAvailableTickets(tickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      message.error('Failed to load tickets');
      setAvailableTickets([]);
    } finally {
      setTicketLoading(false);
      setSearchLoading(false);
    }
  }, [editingPlan]);

  const handleProjectChange = useCallback((projectId: string) => {
    // Clear search timer
    if (searchTimer) {
      clearTimeout(searchTimer);
      setSearchTimer(null);
    }

    // Reset all related states
    setSelectedProject(projectId);
    setSelectedTickets([]);
    setSelectedTicketDetails([]);
    setTicketSearch('');
    setAvailableTickets([]);
    setSearchLoading(false);

    // Load tickets for new project
    if (projectId) {
      loadTicketsByProject(projectId);
    }
  }, [loadTicketsByProject, searchTimer]);

  const handleTicketSearch = useCallback((value: string) => {
    setTicketSearch(value);

    // Clear existing timer
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // Set new timer for debounced search
    const newTimer = setTimeout(() => {
      if (selectedProject) {
        loadTicketsByProject(selectedProject, value.trim() || undefined, true);
      }
    }, 300);

    setSearchTimer(newTimer);
  }, [selectedProject, loadTicketsByProject, searchTimer]);

  const handleTicketSelection = useCallback((ticketId: string) => {
    setSelectedTickets(prev => {
      const isSelected = prev.includes(ticketId);
      if (isSelected) {
        return prev.filter(id => id !== ticketId);
      } else {
        return [...prev, ticketId];
      }
    });
  }, []);

  const handleRemoveSelectedTicket = useCallback((ticketId: string) => {
    setSelectedTickets(prev => prev.filter(id => id !== ticketId));
    // Refetch tickets to potentially show the removed ticket in available list
    if (selectedProject) {
      loadTicketsByProject(selectedProject, ticketSearch || undefined);
    }
  }, [selectedProject, ticketSearch, loadTicketsByProject]);

  const handleCreateOrUpdate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const formData: ReleasePlanFormData = {
        name: values?.name || '',
        description: values?.description || '',
        project: values?.project || '',
        deadline: values?.deadline?.toISOString() || '',
        priority: values?.priority || 'Medium',
        tickets: selectedTickets || [],
        notes: values?.notes || ''
      };

      if (editingPlan) {
        await ReleasePlanService.updateReleasePlan(editingPlan.id, formData);
        message.success('Release plan updated successfully');
      } else {
        await ReleasePlanService.createReleasePlan(formData);
        message.success('Release plan created successfully');
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Failed to save release plan:', error);
      message.error('Failed to save release plan');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plan: ReleasePlan) => {
    setEditingPlan(plan);
    const projectId = typeof plan?.project === 'string' ? plan.project : plan?.project?.id || '';
    setSelectedProject(projectId);
    
    // Set selected tickets and their details
    const ticketIds = plan?.tickets?.map(t => t?.id) || [];
    setSelectedTickets(ticketIds);
    
    // Map existing tickets to ProjectTicket format for selectedTicketDetails
    const existingTicketDetails: ProjectTicket[] = plan?.tickets?.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      assignee: ticket.assignee,
      createdBy: ticket.assignee || { id: '', name: '', email: '' }, // Fallback if needed
      createdAt: new Date().toISOString() // Fallback if needed
    })) || [];
    
    setSelectedTicketDetails(existingTicketDetails);
    
    form.setFieldsValue({
      name: plan?.name,
      description: plan?.description,
      project: projectId,
      deadline: plan?.deadline ? dayjs(plan.deadline) : null,
      priority: plan?.priority,
      notes: plan?.notes
    });
    
    // Load available tickets (excluding current release plan tickets)
    loadTicketsByProject(projectId);
    setShowCreateModal(true);
  };

  const handleDelete = async (planId: string) => {
    try {
      await ReleasePlanService.deleteReleasePlan(planId);
      message.success('Release plan deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete release plan:', error);
      message.error('Failed to delete release plan');
    }
  };

  const handleCloseModal = () => {
    // Clear search timer
    if (searchTimer) {
      clearTimeout(searchTimer);
      setSearchTimer(null);
    }

    setShowCreateModal(false);
    setEditingPlan(null);
    setSelectedProject('');
    setSelectedTickets([]);
    setSelectedTicketDetails([]);
    setTicketSearch('');
    setAvailableTickets([]);
    setTicketLoading(false);
    setSearchLoading(false);
    form.resetFields();
  };

  const handleViewTickets = (plan: ReleasePlan) => {
    setDrawerReleasePlan(plan);
    setDrawerVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'processing';
      case 'planning': return 'default';
      case 'cancelled': return 'error';
      case 'on_hold': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'red';
      case 'Medium': return 'orange';
      case 'Low': return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ReleasePlan) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description?.length > 50 
              ? `${record.description.substring(0, 50)}...` 
              : record.description}
          </Text>
        </div>
      )
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 200,
      render: (progress: number, record: ReleasePlan) => (
        <div>
          <Progress percent={progress || 0} size="small" />
          <Text 
            style={{ fontSize: 12, cursor: 'pointer', color: '#1677ff' }}
            onClick={() => handleViewTickets(record)}
          >
            {record?.completedTickets || 0}/{record?.totalTickets || 0} tickets completed
          </Text>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
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
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      )
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline: string) => (
        <div>
          <Text style={{ fontSize: 12 }}>
            {dayjs(deadline).format('MMM DD, YYYY')}
          </Text>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: ReleasePlan) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="View Tickets">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewTickets(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Release Plan"
            description="Are you sure you want to delete this release plan?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Release Plans
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Release Plan
          </Button>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={releasePlans}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingPlan ? 'Edit Release Plan' : 'Create Release Plan'}
        open={showCreateModal}
        onCancel={handleCloseModal}
        width={800}
        maskClosable={false}
        footer={null}
        styles={{
          body: { maxHeight: '60vh', overflowY: 'auto' },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please enter release plan name' }]}
              >
                <Input placeholder="Enter release plan name..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Project"
                name="project"
                rules={[{ required: true, message: 'Please select project' }]}
              >
                <Select
                  placeholder="Select project"
                  onChange={handleProjectChange}
                  disabled={!!editingPlan} // Disable project field in edit mode
                >
                  {projects.map(project => (
                    <Select.Option key={project.value} value={project.value}>
                      {project.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Describe the release plan objectives..." />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                label="Deadline"
                name="deadline"
                rules={[{ required: true, message: 'Please select deadline' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  placeholder="Select deadline"
                  showTime={false}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                label="Priority"
                name="priority"
                initialValue="Medium"
              >
                <Select>
                  <Select.Option value="High">High</Select.Option>
                  <Select.Option value="Medium">Medium</Select.Option>
                  <Select.Option value="Low">Low</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Ticket Selection */}
          {selectedProject && (
            <>
              <Form.Item label="Select Tickets">
                {/* Selected Tickets Display */}
                {selectedTickets.length > 0 && (
                  <div style={{ 
                    marginBottom: 12, 
                    padding: '8px 12px', 
                    backgroundColor: '#f6f8fa', 
                    border: '1px solid #e1e8ed',
                    borderRadius: 6 
                  }}>
                    <div style={{ marginBottom: 6 }}>
                      <Text strong style={{ fontSize: 13, color: '#666' }}>
                        Selected Tickets ({selectedTickets.length})
                      </Text>
                    </div>
                    <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                      <Space size={[4, 4]} wrap>
                        {selectedTicketDetails.map((ticket) => (
                          <Tag
                            key={ticket.id}
                            closable
                            onClose={(e) => {
                              e.preventDefault();
                              handleRemoveSelectedTicket(ticket.id);
                            }}
                            color="blue"
                            style={{ 
                              marginBottom: 4,
                              maxWidth: 300,
                              cursor: 'default'
                            }}
                          >
                            <Tooltip title={`${ticket.ticketNumber} - ${ticket.title}`}>
                              <span style={{ fontSize: 11 }}>
                                {ticket.ticketNumber} - {ticket.title?.length > 25 ? `${ticket.title.substring(0, 25)}...` : ticket.title}
                              </span>
                            </Tooltip>
                          </Tag>
                        ))}
                        {/* Show remaining tickets by ID if details not available */}
                        {selectedTickets.filter(id => !selectedTicketDetails.find(t => t.id === id)).map((ticketId) => (
                          <Tag
                            key={ticketId}
                            closable
                            onClose={(e) => {
                              e.preventDefault();
                              handleRemoveSelectedTicket(ticketId);
                            }}
                            color="blue"
                            style={{ marginBottom: 4 }}
                          >
                            <span style={{ fontSize: 11 }}>
                              {ticketId.substring(0, 8)}...
                            </span>
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </div>
                )}

                <Input.Search
                  placeholder="Search tickets by number or title..."
                  value={ticketSearch}
                  onChange={(e) => handleTicketSearch(e.target.value)}
                  style={{ marginBottom: 12 }}
                  loading={searchLoading}
                  suffix={searchLoading ? <LoadingOutlined /> : <SearchOutlined />}
                />
                
                <div style={{ 
                  border: '1px solid #d9d9d9', 
                  borderRadius: 6, 
                  maxHeight: 280, 
                  overflowY: 'auto',
                  backgroundColor: '#fafafa'
                }}>
                  {ticketLoading ? (
                    <div style={{ padding: 20, textAlign: 'center' }}>
                      <Spin size="small" />
                      <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                        Loading tickets...
                      </div>
                    </div>
                  ) : availableTickets.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center' }}>
                      <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span style={{ color: '#999', fontSize: 13 }}>
                            {ticketSearch ? 'No tickets found matching your search' : 'No available tickets'}
                          </span>
                        }
                      />
                    </div>
                  ) : (
                    <List
                      dataSource={availableTickets}
                      renderItem={(ticket) => (
                        <List.Item
                          style={{ 
                            padding: '4px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedTickets.includes(ticket.id) ? '#e6f7ff' : 'transparent',
                            borderBottom: '1px solid #f0f0f0'
                          }}
                          onClick={() => handleTicketSelection(ticket.id)}
                        >
                          <List.Item.Meta
                            avatar={
                              <input
                                type="checkbox"
                                checked={selectedTickets.includes(ticket.id)}
                                onChange={() => {}}
                                style={{ cursor: 'pointer', transform: 'scale(0.9)' }}
                              />
                            }
                            title={
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Text 
                                  style={{ 
                                    cursor: 'pointer', 
                                    fontSize: 13,
                                    fontWeight: selectedTickets.includes(ticket.id) ? 600 : 400
                                  }}
                                >
                                  {ticket?.ticketNumber}
                                </Text>
                                <Text 
                                  style={{ 
                                    cursor: 'pointer', 
                                    fontSize: 13,
                                    color: '#666',
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {ticket?.title}
                                </Text>
                              </div>
                            }
                            description={
                              <div style={{ marginTop: 2 }}>
                                <Space size={4}>
                                  <Tag color="blue" style={{ fontSize: 10, lineHeight: '16px', margin: 0, padding: '0 6px', height: '18px' }}>
                                    {ticket?.status?.replace('_', ' ')}
                                  </Tag>
                                  <Tag color="orange" style={{ fontSize: 10, lineHeight: '16px', margin: 0, padding: '0 6px', height: '18px' }}>
                                    {ticket?.priority}
                                  </Tag>
                                  {ticket?.assignee && (
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      • {ticket.assignee.name}
                                    </Text>
                                  )}
                                </Space>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </div>
                
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {availableTickets.length > 0 && (
                      `${availableTickets.length} ticket${availableTickets.length !== 1 ? 's' : ''} available`
                    )}
                  </Text>
                  {selectedTickets.length > 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedTickets.length} selected
                    </Text>
                  )}
                </div>
              </Form.Item>
            </>
          )}

          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>
        </Form>

        {/* Fixed footer with action buttons */}
        <div style={{ 
          borderTop: '1px solid #f0f0f0', 
          padding: '16px 0', 
          marginTop: '16px',
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'white'
        }}>
          <Space style={{ float: 'right' }}>
            <Button onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              loading={saving} 
              onClick={handleCreateOrUpdate}
            >
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </Space>
          <div style={{ clear: 'both' }}></div>
        </div>
      </Modal>

      {/* Ticket Details Drawer */}
      <Drawer
        title={`${drawerReleasePlan?.name} - Tickets`}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={600}
      >
        {drawerReleasePlan && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Progress 
                percent={drawerReleasePlan?.progress || 0} 
                status="active"
                style={{ marginBottom: 8 }}
              />
              <Text type="secondary">
                {drawerReleasePlan?.completedTickets || 0} of {drawerReleasePlan?.totalTickets || 0} tickets completed
              </Text>
            </div>

            <List
              dataSource={drawerReleasePlan?.tickets || []}
              renderItem={(ticket) => (
                <List.Item
                  actions={[
                    <Button
                      key="view"
                      type="link"
                      size="small"
                      onClick={() => router.push(`/tickets/${ticket?.id}`)}
                    >
                      View
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#1677ff' }}>{ticket?.ticketNumber}</Avatar>}
                    title={ticket?.title}
                    description={
                      <Space>
                        <Tag color={ticket?.status === 'completed' ? 'success' : 
                                   ticket?.status === 'in_progress' ? 'processing' : 'default'}>
                          {ticket?.status?.replace('_', ' ')}
                        </Tag>
                        <Tag color={ticket?.priority === 'P1' ? 'red' : 
                                   ticket?.priority === 'P2' ? 'orange' : 'green'}>
                          {ticket?.priority}
                        </Tag>
                        {ticket?.assignee && (
                          <Text type="secondary">
                            {ticket?.assignee?.name}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
