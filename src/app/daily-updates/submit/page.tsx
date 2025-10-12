'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  Select,
  Input,
  Space,
  Typography,
  Row,
  Col,
  message,
  Radio,
  InputNumber,
  Divider,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ProjectService } from '@/services/projectService';
import DailyUpdateService from '@/services/dailyUpdateService';
import { ProjectUpdate } from '@/types/dailyUpdate';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ProjectOption {
  value: string;
  label: string;
  code: string;
}

export default function SubmitDailyUpdatePage() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading..." />
      </MainLayout>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <SubmitDailyUpdateContent />
    </MainLayout>
  );
}

function SubmitDailyUpdateContent() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingUpdate, setExistingUpdate] = useState<any>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([
    {
      projectId: '',
      projectName: '',
      completedTasks: [''],
      plannedTasks: [],
      blockers: [],
      hoursSpent: undefined,
      notes: '',
    },
  ]);

  useEffect(() => {
    fetchProjects();
    checkTodaySubmission();
  }, []);

  const fetchProjects = async () => {
    try {
      const projectsData = await ProjectService.getUserProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      message.error('Failed to load projects');
    }
  };

  const checkTodaySubmission = async () => {
    try {
      setCheckingSubmission(true);
      const result = await DailyUpdateService.checkTodaySubmission();
      
      if (result.submitted && result.data) {
        setAlreadySubmitted(true);
        setExistingUpdate(result.data);
        
        // Pre-fill form with existing data
        const existingProjectUpdates = result.data.projectUpdates as ProjectUpdate[];
        setProjectUpdates(existingProjectUpdates);
        
        form.setFieldsValue({
          mood: result.data.mood,
          totalHoursWorked: result.data.totalHoursWorked,
          generalNotes: result.data.generalNotes,
        });
      }
    } catch (error) {
      console.error('Failed to check submission:', error);
    } finally {
      setCheckingSubmission(false);
    }
  };

  const handleAddProject = () => {
    setProjectUpdates([
      ...projectUpdates,
      {
        projectId: '',
        projectName: '',
        completedTasks: [''],
        plannedTasks: [],
        blockers: [],
        hoursSpent: undefined,
        notes: '',
      },
    ]);
  };

  const handleRemoveProject = (index: number) => {
    if (projectUpdates.length === 1) {
      message.warning('At least one project update is required');
      return;
    }
    const newUpdates = projectUpdates.filter((_, i) => i !== index);
    setProjectUpdates(newUpdates);
  };

  const handleProjectChange = (index: number, projectId: string) => {
    const project = projects.find((p) => p.value === projectId);
    const newUpdates = [...projectUpdates];
    newUpdates[index].projectId = projectId;
    newUpdates[index].projectName = project?.label || '';
    setProjectUpdates(newUpdates);
  };

  const handleTaskChange = (
    projectIndex: number,
    taskType: 'completedTasks' | 'plannedTasks' | 'blockers',
    taskIndex: number,
    value: string
  ) => {
    const newUpdates = [...projectUpdates];
    newUpdates[projectIndex][taskType]![taskIndex] = value;
    setProjectUpdates(newUpdates);
  };

  const handleAddTask = (
    projectIndex: number,
    taskType: 'completedTasks' | 'plannedTasks' | 'blockers'
  ) => {
    const newUpdates = [...projectUpdates];
    newUpdates[projectIndex][taskType]!.push('');
    setProjectUpdates(newUpdates);
  };

  const handleRemoveTask = (
    projectIndex: number,
    taskType: 'completedTasks' | 'plannedTasks' | 'blockers',
    taskIndex: number
  ) => {
    const newUpdates = [...projectUpdates];
    if (taskType === 'completedTasks' && newUpdates[projectIndex][taskType]!.length === 1) {
      message.warning('At least one completed task is required');
      return;
    }
    newUpdates[projectIndex][taskType]!.splice(taskIndex, 1);
    setProjectUpdates(newUpdates);
  };

  const handleHoursChange = (projectIndex: number, value: number | null) => {
    const newUpdates = [...projectUpdates];
    newUpdates[projectIndex].hoursSpent = value || undefined;
    setProjectUpdates(newUpdates);
  };

  const handleNotesChange = (projectIndex: number, value: string) => {
    const newUpdates = [...projectUpdates];
    newUpdates[projectIndex].notes = value;
    setProjectUpdates(newUpdates);
  };

  const getAvailableProjects = (currentIndex: number) => {
    const selectedProjectIds = projectUpdates
      .map((update, index) => (index !== currentIndex ? update.projectId : null))
      .filter(Boolean);
    
    return projects.filter((project) => !selectedProjectIds.includes(project.value));
  };

  const validateForm = () => {
    // Check if all projects are selected
    for (let i = 0; i < projectUpdates.length; i++) {
      if (!projectUpdates[i].projectId) {
        message.error(`Please select a project for update #${i + 1}`);
        return false;
      }

      // Check if at least one completed task exists and is not empty
      const completedTasks = projectUpdates[i].completedTasks.filter((task) => task.trim() !== '');
      if (completedTasks.length === 0) {
        message.error(`Please add at least one completed task for ${projectUpdates[i].projectName}`);
        return false;
      }
    }

    // Check for duplicate projects
    const projectIds = projectUpdates.map((update) => update.projectId);
    const uniqueProjectIds = new Set(projectIds);
    if (projectIds.length !== uniqueProjectIds.size) {
      message.error('You cannot select the same project multiple times');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const values = form.getFieldsValue();

      // Clean up project updates (remove empty tasks)
      const cleanedProjectUpdates = projectUpdates.map((update) => ({
        ...update,
        completedTasks: update.completedTasks.filter((task) => task.trim() !== ''),
        plannedTasks: update.plannedTasks?.filter((task) => task.trim() !== '') || [],
        blockers: update.blockers?.filter((blocker) => blocker.trim() !== '') || [],
      }));

      const data = {
        mood: values.mood,
        totalHoursWorked: values.totalHoursWorked,
        projectUpdates: cleanedProjectUpdates,
        generalNotes: values.generalNotes,
      };

      if (alreadySubmitted && existingUpdate) {
        // Update existing
        await DailyUpdateService.updateUpdate(existingUpdate.id, data);
        message.success('Daily update updated successfully!');
      } else {
        // Create new
        await DailyUpdateService.createUpdate(data);
        message.success('Daily update submitted successfully!');
      }

      router.push('/daily-updates/view');
    } catch (error: any) {
      console.error('Failed to submit update:', error);
      message.error(error.response?.data?.error || 'Failed to submit daily update');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSubmission) {
    return (
      <div style={{ padding: 24 }}>
        <Card loading={true}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text>Checking submission status...</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>
            {alreadySubmitted ? 'Edit Daily Status Update' : 'Submit Daily Status Update'}
          </Title>
          <Text type="secondary">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Col>
        <Col>
          {alreadySubmitted && (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Already Submitted Today
            </Tag>
          )}
        </Col>
      </Row>

      <Card>
        <Form form={form} layout="vertical">
          {/* Mood and Hours */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="How are you feeling today?" name="mood">
                <Radio.Group>
                  <Radio.Button value="happy">😊 Happy</Radio.Button>
                  <Radio.Button value="neutral">😐 Neutral</Radio.Button>
                  <Radio.Button value="stressed">😰 Stressed</Radio.Button>
                  <Radio.Button value="blocked">🚫 Blocked</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Total Hours Worked (Optional)" name="totalHoursWorked">
                <InputNumber
                  min={0}
                  max={24}
                  step={0.5}
                  style={{ width: '100%' }}
                  placeholder="e.g., 8"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Project Updates</Divider>

          {/* Project Updates */}
          {projectUpdates.map((update, projectIndex) => (
            <Card
              key={projectIndex}
              style={{ marginBottom: 16 }}
              title={`Project Update #${projectIndex + 1}`}
              extra={
                projectUpdates.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveProject(projectIndex)}
                  >
                    Remove
                  </Button>
                )
              }
            >
              {/* Project Selection */}
              <Form.Item
                label="Project"
                required
                help={!update.projectId && 'Please select a project'}
                validateStatus={!update.projectId ? 'error' : 'success'}
              >
                <Select
                  placeholder="Select a project"
                  value={update.projectId || undefined}
                  onChange={(value) => handleProjectChange(projectIndex, value)}
                  options={getAvailableProjects(projectIndex).map((project) => ({
                    label: `${project.label} (${project.code})`,
                    value: project.value,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>

              {/* Completed Tasks */}
              <Form.Item label="✅ What did you complete today?" required>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {update.completedTasks.map((task, taskIndex) => (
                    <Space key={taskIndex} style={{ width: '100%' }}>
                      <Input
                        placeholder="Describe completed task..."
                        value={task}
                        onChange={(e) =>
                          handleTaskChange(projectIndex, 'completedTasks', taskIndex, e.target.value)
                        }
                        style={{ width: 400 }}
                      />
                      {update.completedTasks.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleRemoveTask(projectIndex, 'completedTasks', taskIndex)}
                        />
                      )}
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddTask(projectIndex, 'completedTasks')}
                    block
                  >
                    Add Task
                  </Button>
                </Space>
              </Form.Item>

              {/* Planned Tasks */}
              <Form.Item label="📋 What will you do tomorrow? (Optional)">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {update.plannedTasks && update.plannedTasks.length > 0 ? (
                    update.plannedTasks.map((task, taskIndex) => (
                      <Space key={taskIndex} style={{ width: '100%' }}>
                        <Input
                          placeholder="Describe planned task..."
                          value={task}
                          onChange={(e) =>
                            handleTaskChange(projectIndex, 'plannedTasks', taskIndex, e.target.value)
                          }
                          style={{ width: 400 }}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleRemoveTask(projectIndex, 'plannedTasks', taskIndex)}
                        />
                      </Space>
                    ))
                  ) : null}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddTask(projectIndex, 'plannedTasks')}
                    block
                  >
                    Add Planned Task
                  </Button>
                </Space>
              </Form.Item>

              {/* Blockers */}
              <Form.Item label="🚫 Any blockers or issues? (Optional)">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {update.blockers && update.blockers.length > 0 ? (
                    update.blockers.map((blocker, blockerIndex) => (
                      <Space key={blockerIndex} style={{ width: '100%' }}>
                        <Input
                          placeholder="Describe blocker..."
                          value={blocker}
                          onChange={(e) =>
                            handleTaskChange(projectIndex, 'blockers', blockerIndex, e.target.value)
                          }
                          style={{ width: 400 }}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleRemoveTask(projectIndex, 'blockers', blockerIndex)}
                        />
                      </Space>
                    ))
                  ) : null}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddTask(projectIndex, 'blockers')}
                    block
                  >
                    Add Blocker
                  </Button>
                </Space>
              </Form.Item>

              {/* Hours and Notes */}
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Hours Spent (Optional)">
                    <InputNumber
                      min={0}
                      max={24}
                      step={0.5}
                      value={update.hoursSpent}
                      onChange={(value) => handleHoursChange(projectIndex, value)}
                      style={{ width: '100%' }}
                      placeholder="e.g., 5"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Additional Notes (Optional)">
                <TextArea
                  rows={2}
                  placeholder="Any additional notes for this project..."
                  value={update.notes}
                  onChange={(e) => handleNotesChange(projectIndex, e.target.value)}
                />
              </Form.Item>
            </Card>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddProject}
            block
            style={{ marginBottom: 16 }}
            disabled={projectUpdates.length >= projects.length}
          >
            Add Another Project Update
          </Button>

          <Divider />

          {/* General Notes */}
          <Form.Item label="💬 General Notes (Optional)" name="generalNotes">
            <TextArea
              rows={3}
              placeholder="Any other updates not related to specific projects..."
            />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Space>
              <Button type="primary" size="large" onClick={handleSubmit} loading={loading}>
                {alreadySubmitted ? 'Update Daily Status' : 'Submit Daily Status'}
              </Button>
              <Button size="large" onClick={() => router.push('/daily-updates/view')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
