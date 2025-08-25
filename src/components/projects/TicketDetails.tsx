'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Avatar,
  Descriptions,
  Progress,
  Timeline,
  Alert,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Spin,
  Divider,
  List
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  SendOutlined,
  CalendarOutlined,
  UserOutlined,
  FlagOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import TicketService from '@/services/ticketService';
import { ProjectService } from '@/services/projectService';
import { MembersService } from '@/services/membersService';
import { SettingsService, TicketConfigurations } from '@/services/settingsService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface TicketDetailsProps {
  ticketId: string;
}

interface TicketDetails {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  platform: string;
  project: {
    _id: string;
    name: string;
    code: string;
  };
  priority: 'P1' | 'P2' | 'P3';
  taskType: string;
  taskLevel: string;
  status: string;
  assignee: {
    _id: string;
    name: string;
    email: string;
  };
  reportTo: {
    _id: string;
    name: string;
    position?: string;
  } | string;
  storyPoint: number;
  estimateHours: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  currentStep?: string;
  completedSteps?: number;
  totalSteps?: number;
  releasePlan?: string;
  comments?: Array<{
    _id: string;
    userId: string | {
      _id: string;
      name: string;
      email: string;
    };
    userName?: string;
    comment: string;
    timestamp: string;
  }>;
}

interface TicketComment {
  _id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
}

export default function TicketDetails({ ticketId }: TicketDetailsProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Array<{ value: string; label: string; code: string }>>([]);
  const [members, setMembers] = useState<Array<{ value: string; label: string; position: string }>>([]);
  const [ticketConfig, setTicketConfig] = useState<TicketConfigurations | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Dynamic dropdown options loaded from API
  const [platforms, setPlatforms] = useState<Array<{ value: string; label: string; color?: string; description?: string }>>([]);
  const [priorities, setPriorities] = useState<Array<{ value: string; label: string; color?: string; description?: string }>>([]);
  const [taskLevels, setTaskLevels] = useState<Array<{ value: string; label: string; color?: string; description?: string }>>([]);
  const [taskTypes, setTaskTypes] = useState<Array<{ value: string; label: string; color?: string; description?: string }>>([]);

  useEffect(() => {
    fetchTicket();
    loadDropdownData();
  }, [ticketId]);

  // Load dropdown data when editing mode is enabled
  useEffect(() => {
    if (editing && (!members.length || !ticketConfig)) {
      loadDropdownData();
    }
  }, [editing]);

  const loadDropdownData = async () => {
    try {
      setDataLoading(true);
      
      // Load projects, members, and ticket configurations in parallel
      const [projectsData, membersData, ticketConfigData] = await Promise.all([
        ProjectService.getUserProjects(),
        MembersService.getMembersForSelect(),
        SettingsService.getTicketConfigurations()
      ]);

      setProjects(projectsData || []);
      setMembers(membersData || []);
      setTicketConfig(ticketConfigData);

      // Set dropdown options from the configuration with fallbacks
      setPlatforms(ticketConfigData?.platforms || []);
      setPriorities(ticketConfigData?.priorities || []);
      setTaskLevels(ticketConfigData?.taskLevels || []);
      setTaskTypes(ticketConfigData?.taskTypes || []);

    } catch (error) {
      console.error('Error loading dropdown data:', error);
      message.error('Failed to load form data. Please refresh the page.');
      
      // Set empty arrays as fallbacks to prevent map errors
      setPlatforms([]);
      setPriorities([]);
      setTaskLevels([]);
      setTaskTypes([]);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await TicketService.getTicketById(ticketId);
      // Transform the response to match our interface
      const ticketData: TicketDetails = {
        _id: response._id,
        ticketNumber: response.ticketNumber,
        title: response.title,
        description: response.description,
        platform: response.platform,
        project: typeof response.project === 'string' 
          ? { _id: response.project, name: 'Unknown', code: 'UNK' }
          : response.project,
        priority: response.priority as 'P1' | 'P2' | 'P3',
        taskType: response.taskType,
        taskLevel: response.taskLevel,
        status: response.status,
        assignee: typeof response.assignee === 'string'
          ? { _id: '', name: response.assignee, email: '' }
          : response.assignee,
        reportTo: (response as any).reportTo || '',
        storyPoint: (response as any).storyPoint || 0,
        estimateHours: (response as any).estimateHours || 0,
        createdBy: response.createdBy,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        startDate: (response as any).startDate,
        endDate: (response as any).endDate,
        completedSteps: (response as any).completedSteps || 0,
        totalSteps: (response as any).totalSteps || 11,
        comments: (response as any).comments || []
      };
      setTicket(ticketData);
      
      // Populate form with ticket data - CRITICAL: Use ObjectIds for relational fields
      if (ticketData) {
        form.setFieldsValue({
          title: ticketData?.title || '',
          description: ticketData?.description || '',
          platform: ticketData?.platform || '',
          project: ticketData?.project?._id || '',
          priority: ticketData?.priority || '',
          taskType: ticketData?.taskType || '',
          taskLevel: ticketData?.taskLevel || '',
          status: ticketData?.status || '',
          // FIXED: Use ObjectId instead of name for assignee
          assignee: ticketData?.assignee?._id || '',
          // FIXED: Use ObjectId instead of name for reportTo
          reportTo: typeof ticketData?.reportTo === 'string' 
            ? ticketData.reportTo 
            : ticketData?.reportTo?._id || '',
          storyPoint: ticketData?.storyPoint || 0,
          estimateHours: ticketData?.estimateHours || 0,
          startDate: ticketData?.startDate ? dayjs(ticketData.startDate) : null,
          endDate: ticketData?.endDate ? dayjs(ticketData.endDate) : null,
          releasePlan: ticketData?.releasePlan || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      message.error('Failed to load ticket details');
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      // CRITICAL FIX: Sanitize empty strings for optional ObjectId fields
      const updateData = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null
      };

      // Remove empty strings for optional ObjectId fields to prevent casting errors
      if (updateData.releasePlan === '' || updateData.releasePlan === null) {
        delete updateData.releasePlan;
      }

      // Handle parentTickets array - remove empty strings
      if (updateData.parentTickets && Array.isArray(updateData.parentTickets)) {
        updateData.parentTickets = updateData.parentTickets.filter((id: any) => id && id !== '');
        if (updateData.parentTickets.length === 0) {
          delete updateData.parentTickets;
        }
      }

      await TicketService.updateTicket(ticketId, updateData);
      message.success('Ticket updated successfully');
      setEditing(false);
      fetchTicket(); // Refresh ticket data
    } catch (error) {
      console.error('Failed to update ticket:', error);
      message.error('Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await TicketService.getTicketById(ticketId);
      if (ticket) {
        setTicket(prev => prev ? {
          ...prev,
          comments: (response as any).comments || []
        } : null);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setAddingComment(true);
      await TicketService.addComment(ticketId, newComment);
      setNewComment('');
      message.success('Comment added successfully');
      fetchComments(); // Only refresh comments section
    } catch (error) {
      console.error('Failed to add comment:', error);
      message.error('Failed to add comment');
    } finally {
      setAddingComment(false);
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

  const workflowSteps = [
    'Scope Document',
    'KT (Knowledge Transfer)',
    'Developer Doc',
    'Grooming',
    'Dev Code Work Effort',
    'Designer Approval',
    'Testing',
    'Unit Testing',
    'Code Review',
    'Push to Live',
    'Live Test'
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Alert
          message="Ticket Not Found"
          description="The requested ticket could not be found."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className='p-10'>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Back
            </Button>
            <Title level={3} style={{ margin: 0 ,marginLeft:10}}>
              {ticket.ticketNumber} - {ticket.title}
            </Title>
          </Space>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          <Card>
            {editing ? (
              <div style={{ position: 'relative' }}>
                {/* Save/Cancel Buttons - Top Right */}
                <div style={{ 
                  position: 'absolute',
                  top: '0px',
                  right: '0px',
                  zIndex: 10
                }}>
                  <Space>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={() => {
                        setEditing(false);
                        form.resetFields();
                      }}
                      size="small"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={saving}
                      onClick={handleSave}
                      size="small"
                    >
                      Save Changes
                    </Button>
                  </Space>
                </div>

                <Form form={form} layout="vertical" style={{ paddingTop: '40px' }}>
                  <Form.Item
                    label="Title"
                    name="title"
                    rules={[{ required: true, message: 'Please enter title' }]}
                  >
                    <Input placeholder="Enter ticket title..." />
                  </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Platform"
                      name="platform"
                      rules={[{ required: true, message: 'Please select platform' }]}
                    >
                      <Select loading={dataLoading}>
                        {platforms.map(platform => (
                          <Select.Option key={platform.value} value={platform.value}>
                            {platform.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Project"
                      name="project"
                      rules={[{ required: true, message: 'Please select project' }]}
                    >
                      <Select loading={dataLoading}>
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
                  <TextArea rows={4} />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Priority"
                      name="priority"
                      rules={[{ required: true, message: 'Please select priority' }]}
                    >
                      <Select loading={dataLoading}>
                        {priorities.map(priority => (
                          <Select.Option key={priority.value} value={priority.value}>
                            {priority.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Status"
                      name="status"
                      rules={[{ required: true, message: 'Please select status' }]}
                    >
                      <Select loading={dataLoading}>
                        <Select.Option value="not_started">Not Started</Select.Option>
                        <Select.Option value="in_progress">In Progress</Select.Option>
                        <Select.Option value="in_testing">In Testing</Select.Option>
                        <Select.Option value="completed">Completed</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    {/* Empty column for better spacing */}
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Task Type"
                      name="taskType"
                      rules={[{ required: true, message: 'Please select task type' }]}
                    >
                      <Select loading={dataLoading}>
                        {taskTypes.map(taskType => (
                          <Select.Option key={taskType.value} value={taskType.value}>
                            {taskType.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Task Level"
                      name="taskLevel"
                      rules={[{ required: true, message: 'Please select task level' }]}
                    >
                      <Select loading={dataLoading}>
                        {taskLevels.map(taskLevel => (
                          <Select.Option key={taskLevel.value} value={taskLevel.value}>
                            {taskLevel.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Story Points"
                      name="storyPoint"
                      rules={[{ required: true, message: 'Please enter story points' }]}
                    >
                      <InputNumber min={1} max={5} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Assignee"
                      name="assignee"
                      rules={[{ required: true, message: 'Please select assignee' }]}
                    >
                      <Select 
                        placeholder="Select assignee" 
                        loading={dataLoading}
                        showSearch
                        filterOption={(input, option) => {
                          const member = members.find(m => m.value === option?.value);
                          return member ? (
                            member.label.toLowerCase().includes(input.toLowerCase()) ||
                            member.position.toLowerCase().includes(input.toLowerCase())
                          ) : false;
                        }}
                      >
                        {members.map(member => (
                          <Select.Option key={member.value} value={member.value}>
                            {member.label} - {member.position}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Report To"
                      name="reportTo"
                      rules={[{ required: true, message: 'Please select report to' }]}
                    >
                      <Select 
                        placeholder="Select manager" 
                        loading={dataLoading}
                        showSearch
                        filterOption={(input, option) => {
                          const member = members.find(m => m.value === option?.value);
                          return member ? (
                            member.label.toLowerCase().includes(input.toLowerCase()) ||
                            member.position.toLowerCase().includes(input.toLowerCase())
                          ) : false;
                        }}
                      >
                        {members.map(member => (
                          <Select.Option key={member.value} value={member.value}>
                            {member.label} - {member.position}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Estimate Hours"
                      name="estimateHours"
                      rules={[{ required: true, message: 'Please enter estimate hours' }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Start Date"
                      name="startDate"
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="End Date"
                      name="endDate"
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Release Plan"
                  name="releasePlan"
                >
                  <Input />
                </Form.Item>
                </Form>
              </div>
            ) : (
              <div>
                {/* Simple Ticket Header Section */}
                <div style={{ 
                  background: '#fafafa',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '24px',
                  border: '1px solid #e8e8e8',
                  position: 'relative'
                }}>
                  {/* Edit Button - Top Right */}
                  <div style={{ 
                    position: 'absolute',
                    top: '16px',
                    right: '16px'
                  }}>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => setEditing(true)}
                      size="small"
                    >
                      Edit Ticket
                    </Button>
                  </div>

                  {/* Ticket Number */}
                  <div style={{ marginBottom: '12px' }}>
                    <Tag 
                      color="blue" 
                      style={{ 
                        fontSize: '13px', 
                        fontWeight: '600',
                        padding: '4px 10px',
                        borderRadius: '4px'
                      }}
                    >
                      {ticket.ticketNumber}
                    </Tag>
                  </div>

                  {/* Title */}
                  <Title 
                    level={3} 
                    style={{ 
                      margin: '0 0 16px 0',
                      color: '#262626',
                      fontSize: '22px',
                      fontWeight: '600',
                      lineHeight: '1.4',
                      paddingRight: '120px' // Add padding to avoid overlap with button
                    }}
                  >
                    {ticket.title}
                  </Title>

                  {/* Description */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '6px',
                    padding: '16px',
                    border: '1px solid #e8e8e8'
                  }}>
                    <Text strong style={{ 
                      color: '#8c8c8c', 
                      fontSize: '12px', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      Description
                    </Text>
                    <Paragraph 
                      style={{ 
                        margin: '0',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#595959'
                      }}
                      ellipsis={{ 
                        rows: 4, 
                        expandable: true, 
                        symbol: 'Show more' 
                      }}
                    >
                      {ticket.description}
                    </Paragraph>
                  </div>
                </div>

                <Descriptions title="Ticket Information" bordered column={2}>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Priority">
                    <Tag color={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Project">
                    <Tag color="blue">{ticket?.project?.name || 'Unknown'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Platform">
                    {ticket?.platform || 'Not specified'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Task Type">
                    <Tag color={getTaskTypeColor(ticket?.taskType || '')}>
                      {ticket?.taskType || 'Not specified'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Task Level">
                    {ticket?.taskLevel || 'Not specified'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Story Points">
                    {ticket?.storyPoint || 0}/5
                  </Descriptions.Item>
                  <Descriptions.Item label="Estimate Hours">
                    {ticket?.estimateHours || 0}h
                  </Descriptions.Item>
                  <Descriptions.Item label="Assignee">
                    <Space>
                      <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                        {ticket?.assignee?.name?.charAt(0) || 'U'}
                      </Avatar>
                      {ticket?.assignee?.name || 'Unassigned'}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Report To">
                    {typeof ticket?.reportTo === 'string' 
                      ? ticket.reportTo 
                      : ticket?.reportTo?.name || 'Not assigned'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Created By">
                    {ticket?.createdBy?.name || 'Unknown'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At">
                    {ticket?.createdAt ? dayjs(ticket.createdAt).format('MMMM DD, YYYY HH:mm') : 'Unknown'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Duration" span={2}>
                    {ticket?.startDate && ticket?.endDate ? (
                      `${dayjs(ticket.startDate).format('MMM DD')} - ${dayjs(ticket.endDate).format('MMM DD, YYYY')}`
                    ) : (
                      'Not set'
                    )}
                  </Descriptions.Item>
                  {ticket?.releasePlan && (
                    <Descriptions.Item label="Release Plan" span={2}>
                      <Tag color="purple">{ticket.releasePlan}</Tag>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}
          </Card>

          {/* Comments Section */}
          <Card title="Comments" style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <TextArea
                rows={3}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={addingComment}
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </Button>
              </div>
            </div>

            <Divider />

            <List
              dataSource={ticket.comments}
              renderItem={(comment) => {
                // Handle both populated user object and userName string
                const userName = comment.userName || 
                  (typeof comment.userId === 'object' && comment.userId?.name) || 
                  'Unknown User';
                
                return (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <Avatar style={{ backgroundColor: '#1677ff', marginRight: 8 }}>
                          {userName.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <Text strong>{userName}</Text>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {dayjs(comment?.timestamp).format('MMMM DD, YYYY HH:mm')}
                          </div>
                        </div>
                      </div>
                      <Paragraph style={{ marginLeft: 40, marginBottom: 0 }}>
                        {comment?.comment}
                      </Paragraph>
                    </div>
                  </List.Item>
                );
              }}
              locale={{ emptyText: 'No comments yet' }}
            />
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          <Card title="Workflow Progress">
            <Progress
              percent={Math.round(((ticket.completedSteps || 0) / (ticket.totalSteps || 11)) * 100)}
              format={() => `${ticket.completedSteps || 0}/${ticket.totalSteps || 11} steps completed`}
              style={{ marginBottom: 16 }}
            />
            
            <Timeline
              items={workflowSteps.map((step, index) => ({
                color: index < (ticket.completedSteps || 0) ? 'green' : 
                       index === (ticket.completedSteps || 0) ? 'blue' : 'gray',
                children: (
                  <div>
                    <Text strong={index === (ticket.completedSteps || 0)}>
                      {step}
                    </Text>
                    {index === (ticket.completedSteps || 0) && (
                      <Tag color="processing" style={{ marginLeft: 8 }}>
                        Current
                      </Tag>
                    )}
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
