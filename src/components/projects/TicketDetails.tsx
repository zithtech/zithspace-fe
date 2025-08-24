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
  SendOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import TicketService from '@/services/ticketService';
import { ProjectService } from '@/services/projectService';

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
    userId: string;
    userName: string;
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
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    fetchTicket();
    fetchProjects();
  }, [ticketId]);

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
      
      // Populate form with ticket data
      if (ticketData) {
        form.setFieldsValue({
          title: ticketData.title,
          description: ticketData.description,
          platform: ticketData.platform,
          project: ticketData.project._id,
          priority: ticketData.priority,
          taskType: ticketData.taskType,
          taskLevel: ticketData.taskLevel,
          status: ticketData.status,
          assignee: ticketData.assignee.name,
          reportTo: ticketData.reportTo,
          storyPoint: ticketData.storyPoint,
          estimateHours: ticketData.estimateHours,
          startDate: ticketData.startDate ? dayjs(ticketData.startDate) : null,
          endDate: ticketData.endDate ? dayjs(ticketData.endDate) : null,
          releasePlan: ticketData.releasePlan
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
      
      const updateData = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null
      };

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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setAddingComment(true);
      await TicketService.addComment(ticketId, newComment);
      setNewComment('');
      message.success('Comment added successfully');
      fetchTicket(); // Refresh to get new comment
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
        <Col>
          <Space>
            {editing ? (
              <>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setEditing(false);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditing(true)}
              >
                Edit Ticket
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          <Card>
            {editing ? (
              <Form form={form} layout="vertical">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Title"
                      name="title"
                      rules={[{ required: true, message: 'Please enter title' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Platform"
                      name="platform"
                      rules={[{ required: true, message: 'Please select platform' }]}
                    >
                      <Select>
                        <Select.Option value="Development">Development</Select.Option>
                        <Select.Option value="UI/UX">UI/UX</Select.Option>
                        <Select.Option value="PM">PM</Select.Option>
                        <Select.Option value="Business Team">Business Team</Select.Option>
                        <Select.Option value="DevOps">DevOps</Select.Option>
                        <Select.Option value="Testing">Testing</Select.Option>
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
                      label="Project"
                      name="project"
                      rules={[{ required: true, message: 'Please select project' }]}
                    >
                      <Select>
                        {projects.map(project => (
                          <Select.Option key={project.value} value={project.value}>
                            {project.label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Priority"
                      name="priority"
                      rules={[{ required: true, message: 'Please select priority' }]}
                    >
                      <Select>
                        <Select.Option value="P1">High (P1)</Select.Option>
                        <Select.Option value="P2">Medium (P2)</Select.Option>
                        <Select.Option value="P3">Lite (P3)</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Status"
                      name="status"
                      rules={[{ required: true, message: 'Please select status' }]}
                    >
                      <Select>
                        <Select.Option value="not_started">Not Started</Select.Option>
                        <Select.Option value="in_progress">In Progress</Select.Option>
                        <Select.Option value="in_testing">In Testing</Select.Option>
                        <Select.Option value="completed">Completed</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Task Type"
                      name="taskType"
                      rules={[{ required: true, message: 'Please select task type' }]}
                    >
                      <Select>
                        <Select.Option value="Bug">Bug</Select.Option>
                        <Select.Option value="Task">Task</Select.Option>
                        <Select.Option value="Feat">Feature</Select.Option>
                        <Select.Option value="Overwrite">Overwrite</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Task Level"
                      name="taskLevel"
                      rules={[{ required: true, message: 'Please select task level' }]}
                    >
                      <Select>
                        <Select.Option value="Easy">Easy</Select.Option>
                        <Select.Option value="Lite">Lite</Select.Option>
                        <Select.Option value="Medium">Medium</Select.Option>
                        <Select.Option value="Hard">Hard</Select.Option>
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
                      rules={[{ required: true, message: 'Please enter assignee' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Report To"
                      name="reportTo"
                      rules={[{ required: true, message: 'Please enter report to' }]}
                    >
                      <Input />
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
            ) : (
              <div>
                <Alert
                  message={ticket.title}
                  description={ticket.description}
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

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
                    <Tag color="blue">{ticket.project.name}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Platform">
                    {ticket.platform}
                  </Descriptions.Item>
                  <Descriptions.Item label="Task Type">
                    <Tag color={getTaskTypeColor(ticket.taskType)}>
                      {ticket.taskType}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Task Level">
                    {ticket.taskLevel}
                  </Descriptions.Item>
                  <Descriptions.Item label="Story Points">
                    {ticket.storyPoint}/5
                  </Descriptions.Item>
                  <Descriptions.Item label="Estimate Hours">
                    {ticket.estimateHours}h
                  </Descriptions.Item>
                  <Descriptions.Item label="Assignee">
                    <Space>
                      <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                        {ticket.assignee.name.charAt(0)}
                      </Avatar>
                      {ticket.assignee.name}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Report To">
                    {typeof ticket.reportTo === 'string' 
                      ? ticket.reportTo 
                      : ticket.reportTo?.name || 'Not assigned'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Created By">
                    {ticket.createdBy.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At">
                    {dayjs(ticket.createdAt).format('MMMM DD, YYYY HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Duration" span={2}>
                    {ticket.startDate && ticket.endDate ? (
                      `${dayjs(ticket.startDate).format('MMM DD')} - ${dayjs(ticket.endDate).format('MMM DD, YYYY')}`
                    ) : (
                      'Not set'
                    )}
                  </Descriptions.Item>
                  {ticket.releasePlan && (
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
              renderItem={(comment) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <Avatar style={{ backgroundColor: '#1677ff', marginRight: 8 }}>
                        {comment?.userName?.charAt(0)}
                      </Avatar>
                      <div>
                        <Text strong>{comment.userName}</Text>
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
              )}
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
