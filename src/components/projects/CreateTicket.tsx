'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  InputNumber,
  message,
  Divider,
  List,
  Badge,
  Avatar,
  Spin
} from 'antd';
import {
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ProjectService } from '@/services/projectService';
import { MembersService } from '@/services/membersService';
import TicketService from '@/services/ticketService';
import { SettingsService, TicketConfigurations } from '@/services/settingsService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TicketFormData {
  platform: string;
  project: string;
  parentTickets: string[];
  stack?: string;
  description: string;
  priority: string;
  taskLevel: string;
  taskType: string;
  storyPoint: number;
  estimateHours: number;
  reportTo: string;
  assignee: string;
  startDate: dayjs.Dayjs | null;
  endDate: dayjs.Dayjs | null;
  releasePlan?: string;
}

export default function CreateTicket() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [ticketId] = useState(`TKT-${Date.now().toString().slice(-6)}`);

  // State for dynamic data
  const [projects, setProjects] = useState<Array<{ value: string; label: string; code: string }>>([]);
  const [members, setMembers] = useState<Array<{ value: string; label: string; position: string }>>([]);
  const [ticketConfig, setTicketConfig] = useState<TicketConfigurations | null>(null);
  const [parentTickets, setParentTickets] = useState<Array<{ value: string; label: string }>>([]);
  const [releasePlans, setReleasePlans] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Dynamic dropdown options loaded from API
  const [platforms, setPlatforms] = useState<Array<{ value: string; label: string; color?: string; description?: string }>>([]);
  const [stacks, setStacks] = useState<Array<{ value: string; label: string; color?: string; description?: string }>>([]);
  const [priorities, setPriorities] = useState<Array<{ value: string; label: string; color?: string; description?: string }>>([]);
  const [taskLevels, setTaskLevels] = useState<Array<{ value: string; label: string; color?: string; description?: string }>>([]);
  const [taskTypes, setTaskTypes] = useState<Array<{ value: string; label: string; color?: string; description?: string }>>([]);

  const recentActivities = [
    { user: 'John Doe', action: 'created ticket #TKT-001', time: '2 mins ago' },
    { user: 'Jane Smith', action: 'updated priority', time: '5 mins ago' },
    { user: 'Mike Johnson', action: 'assigned to Sarah', time: '10 mins ago' },
    { user: 'David Brown', action: 'completed testing', time: '15 mins ago' }
  ];

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setDataLoading(true);
        
        // Load user projects, members, and ticket configurations in parallel
        const [projectsData, membersData, ticketConfigData] = await Promise.all([
          ProjectService.getUserProjects(),
          MembersService.getMembersForSelect(),
          SettingsService.getTicketConfigurations()
        ]);
        console.log("EEEEEEEEEEEEEE",{projectsData,membersData,ticketConfigData});

        setProjects(projectsData || []);
        setMembers(membersData || []);
        setTicketConfig(ticketConfigData);

        // Set dropdown options from the configuration with fallbacks
        setPlatforms(ticketConfigData?.platforms || []);
        setStacks(ticketConfigData?.stacks || []);
        setPriorities(ticketConfigData?.priorities || []);
        setTaskLevels(ticketConfigData?.taskLevels || []);
        setTaskTypes(ticketConfigData?.taskTypes || []);

      } catch (error) {
        console.error('Error loading initial data:', error);
        message.error('Failed to load form data. Please refresh the page.');
        
        // Set empty arrays as fallbacks to prevent map errors
        setPlatforms([]);
        setStacks([]);
        setPriorities([]);
        setTaskLevels([]);
        setTaskTypes([]);
      } finally {
        setDataLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load project-dependent data when project changes
  useEffect(() => {
    const loadProjectData = async () => {
      if (!selectedProject) {
        setParentTickets([]);
        setReleasePlans([]);
        return;
      }

      try {
        // TODO: Load parent tickets and release plans for selected project
        // const [parentTicketsData, releasePlansData] = await Promise.all([
        //   TicketService.getParentTickets(selectedProject),
        //   TicketService.getReleasePlansByProject(selectedProject)
        // ]);
        
        // setParentTickets(parentTicketsData);
        // setReleasePlans(releasePlansData);

        // For now, clear the arrays until APIs are implemented
        setParentTickets([]);
        setReleasePlans([]);
      } catch (error) {
        console.error('Error loading project data:', error);
        message.error('Failed to load project-specific data.');
      }
    };

    loadProjectData();
  }, [selectedProject]);

  const handleCreateTicket = async (values: TicketFormData) => {
    try {
      setLoading(true);
      
      // Prepare ticket data for API
      const ticketData = {
        title: values.description.split('\n')[0] || 'New Ticket', // Use first line as title
        description: values.description,
        platform: values.platform,
        project: values.project,
        parentTickets: values.parentTickets || [],
        stack: values.stack,
        priority: values.priority,
        taskLevel: values.taskLevel,
        taskType: values.taskType,
        storyPoint: values.storyPoint,
        estimateHours: values.estimateHours,
        reportTo: values.reportTo,
        assignee: values.assignee,
        startDate: values.startDate?.format('YYYY-MM-DD') || '',
        endDate: values.endDate?.format('YYYY-MM-DD') || '',
        releasePlan: values.releasePlan,
      };

      // Create ticket using API
      const createdTicket = await TicketService.createTicket(ticketData);
      
      message.success(`Ticket ${createdTicket.ticketNumber || ticketId} created successfully!`);
      
      // Reset form and selected project
      form.resetFields();
      setSelectedProject('');
      
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      message.error(error.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };


  const handleCancel = () => {
    form.resetFields();
    message.info('Form cleared');
  };

  console.log("SSS",{projects});

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Create New Ticket
      </Title>

      <Row gutter={24}>
        {/* Left Side - Main Form (70%) */}
        <Col xs={24} lg={17}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateTicket}
            initialValues={{
              storyPoint: 2,
              estimateHours: 8
            }}
          >
            {/* Basic Information Section */}
            <Card 
              style={{ marginBottom: 24 }}
              title={
                <Space>
                  <FileTextOutlined />
                  <Text strong>Basic Information</Text>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="platform"
                    label="Platform *"
                    rules={[{ required: true, message: 'Please select a platform' }]}
                  >
                    <Select placeholder="Select platform" size="large">
                      {platforms.map(platform => (
                        <Option key={platform.value} value={platform.value}>{platform.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="project"
                    label="Project *"
                    rules={[{ required: true, message: 'Please select a project' }]}
                  >
                    <Select 
                      placeholder="Select project" 
                      size="large"
                      loading={dataLoading}
                      onChange={(value) => setSelectedProject(value)}
                    >
                      {projects.map(project => (
                        <Option key={project.value} value={project.value}>
                          {project.label} ({project.code})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* <Form.Item
                name="parentTickets"
                label="Parent Tickets"
                tooltip="Link to parent tickets (optional)"
              >
                <Select
                  mode="multiple"
                  placeholder="Link to parent tickets (optional)"
                  options={parentTickets}
                  size="large"
                />
              </Form.Item> */}

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.platform !== currentValues.platform
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('platform') === 'Development' ? (
                    <Form.Item
                      name="stack"
                      label="Stack *"
                      rules={[{ required: true, message: 'Please select a stack' }]}
                    >
                      <Select placeholder="Select stack" size="large">
                        {stacks.map(stack => (
                          <Option key={stack.value} value={stack.value}>{stack.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Form.Item
                name="description"
                label="Description *"
                rules={[{ required: true, message: 'Please provide a description' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide a detailed explanation of the task..."
                  style={{ fontSize: 14 }}
                />
              </Form.Item>
            </Card>

            {/* Task Configuration Section */}
            <Card 
              style={{ marginBottom: 24 }}
              title={
                <Space>
                  <SettingOutlined />
                  <Text strong>Task Configuration</Text>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="priority"
                    label="Priority *"
                    rules={[{ required: true, message: 'Please select priority' }]}
                  >
                    <Select placeholder="Select priority" size="large">
                      {priorities.map(priority => (
                        <Option key={priority.value} value={priority.value}>
                          <Space>
                            <Badge color={priority.color} />
                            {priority.label}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="taskLevel"
                    label="Task Level *"
                    rules={[{ required: true, message: 'Please select task level' }]}
                  >
                    <Select placeholder="Select task level" size="large">
                      {taskLevels.map(level => (
                        <Option key={level.value} value={level.value}>{level.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="taskType"
                    label="Task Type *"
                    rules={[{ required: true, message: 'Please select task type' }]}
                  >
                    <Select placeholder="Select task type" size="large">
                      {taskTypes.map(type => (
                        <Option key={type.value} value={type.value}>
                          <Tag color={type.color}>{type.label}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="storyPoint"
                    label="Story Points *"
                    rules={[{ required: true, message: 'Please set story points' }]}
                  >
                    <InputNumber
                      min={1}
                      max={5}
                      placeholder="1-5"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="estimateHours"
                    label="Estimate Hours *"
                    rules={[{ required: true, message: 'Please set estimate hours' }]}
                  >
                    <InputNumber
                      min={1}
                      placeholder="Hours"
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Assignment & Timeline Section */}
            <Card 
              style={{ marginBottom: 24 }}
              title={
                <Space>
                  <UserOutlined />
                  <Text strong>Assignment & Timeline</Text>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="reportTo"
                    label="Report To *"
                    rules={[{ required: true, message: 'Please select report to' }]}
                  >
                    <Select 
                      placeholder="Select manager" 
                      size="large"
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
                        <Option key={member.value} value={member.value}>
                          {member.label} - {member.position}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="assignee"
                    label="Assignee *"
                    rules={[{ required: true, message: 'Please select assignee' }]}
                  >
                    <Select 
                      placeholder="Select assignee" 
                      size="large"
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
                        <Option key={member.value} value={member.value}>
                          {member.label} - {member.position}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="startDate"
                    label="Start Date *"
                    rules={[{ required: true, message: 'Please select start date' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      size="large"
                      placeholder="Pick a date"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="endDate"
                    label="End Date *"
                    rules={[{ required: true, message: 'Please select end date' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      size="large"
                      placeholder="Pick a date"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="releasePlan"
                label="Release Plan (Optional)"
              >
                <Select 
                  placeholder="Select release plan" 
                  allowClear 
                  size="large"
                  loading={dataLoading}
                  disabled={!selectedProject}
                >
                  {releasePlans.map(plan => (
                    <Option key={plan.value} value={plan.value}>
                      {plan.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>

            {/* Action Buttons */}
            <Card>
              <Space size="middle">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                  style={{ minWidth: 140 }}
                >
                  Create Ticket
                </Button>
                <Button 
                  size="large"
                  onClick={handleCancel}
                  icon={<CloseOutlined />}
                >
                  Cancel
                </Button>
              </Space>
            </Card>
          </Form>
        </Col>

        {/* Right Side - Information Panel (30%) */}
        <Col xs={24} lg={7}>
          {/* Quick Info Card */}
          <Card 
            style={{ marginBottom: 16 }}
            title={
              <Space>
                <InfoCircleOutlined style={{ color: '#1677ff' }} />
                <Text strong>Quick Info</Text>
              </Space>
            }
            size="small"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Ticket ID</Text>
                <br />
                <Text strong style={{ color: '#1677ff' }}>{ticketId}</Text>
              </div>
              <div>
                <Text type="secondary">Created</Text>
                <br />
                <Text strong>Today</Text>
              </div>
              <div>
                <Text type="secondary">Status</Text>
                <br />
                <Badge status="default" text="Draft" />
              </div>
            </Space>
          </Card>

          {/* Priority Guide Card */}
          <Card 
            style={{ marginBottom: 16 }}
            title={
              <Space>
                <CalendarOutlined style={{ color: '#faad14' }} />
                <Text strong>Priority Guide</Text>
              </Space>
            }
            size="small"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {priorities.map(priority => (
                <div key={priority.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge color={priority.color} />
                  <Text strong style={{ minWidth: 60 }}>{priority.value}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {priority.description}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>

          {/* Recent Activity Card */}
          <Card 
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#52c41a' }} />
                <Text strong>Recent Activity</Text>
              </Space>
            }
            size="small"
          >
            <List
              size="small"
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item style={{ padding: '8px 0', border: 'none' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                        {item.user.charAt(0)}
                      </Avatar>
                    }
                    title={
                      <Text style={{ fontSize: 12 }}>
                        <Text strong>{item.user}</Text> {item.action}
                      </Text>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {item.time}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
