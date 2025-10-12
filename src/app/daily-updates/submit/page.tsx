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
  message,
  InputNumber,
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

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading..." />
      </MainLayout>
    );
  }

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
    for (let i = 0; i < projectUpdates.length; i++) {
      if (!projectUpdates[i].projectId) {
        message.error(`Please select a project for update #${i + 1}`);
        return false;
      }

      const completedTasks = projectUpdates[i].completedTasks.filter((task) => task.trim() !== '');
      if (completedTasks.length === 0) {
        message.error(`Please add at least one completed task for ${projectUpdates[i].projectName}`);
        return false;
      }
    }

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
        await DailyUpdateService.updateUpdate(existingUpdate.id, data);
        message.success('Daily update updated successfully!');
      } else {
        await DailyUpdateService.createUpdate(data);
        message.success('Daily update submitted successfully!');
      }

      router.push('/daily-updates/view');
    } catch (error: any) {
      console.error('Failed to submit update:', error);
      message.error(error.message || 'Failed to submit daily update');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSubmission) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
        <Card loading={true}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text>Checking submission status...</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 900, 
      margin: '0 auto', 
      padding: '24px 16px',
      minHeight: 'calc(100vh - 64px)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          {alreadySubmitted ? 'Edit Daily Status Update' : 'Submit Daily Status Update'}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        {alreadySubmitted && (
          <Tag 
            icon={<CheckCircleOutlined />} 
            color="success" 
            style={{ marginLeft: 12, fontSize: 12 }}
          >
            Already Submitted Today
          </Tag>
        )}
      </div>

      {/* Form Card */}
      <Card 
        style={{ 
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          borderRadius: 8,
          border: '1px solid #e8e8e8'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Form form={form} layout="vertical">
          {/* Mood Section */}
          <Form.Item 
            label={
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                How are you feeling today?
              </span>
            }
            name="mood"
            style={{ marginBottom: 20 }}
          >
            <Space size="small" wrap>
              <Button
                icon={<span style={{ fontSize: 16 }}>😊</span>}
                onClick={() => form.setFieldsValue({ mood: 'happy' })}
                type={form.getFieldValue('mood') === 'happy' ? 'primary' : 'default'}
                style={{ 
                  backgroundColor: form.getFieldValue('mood') === 'happy' ? '#5B68F4' : undefined,
                  borderColor: form.getFieldValue('mood') === 'happy' ? '#5B68F4' : undefined
                }}
              >
                Happy
              </Button>
              <Button
                icon={<span style={{ fontSize: 16 }}>😐</span>}
                onClick={() => form.setFieldsValue({ mood: 'neutral' })}
                type={form.getFieldValue('mood') === 'neutral' ? 'primary' : 'default'}
                style={{ 
                  backgroundColor: form.getFieldValue('mood') === 'neutral' ? '#5B68F4' : undefined,
                  borderColor: form.getFieldValue('mood') === 'neutral' ? '#5B68F4' : undefined
                }}
              >
                Neutral
              </Button>
              <Button
                icon={<span style={{ fontSize: 16 }}>😰</span>}
                onClick={() => form.setFieldsValue({ mood: 'stressed' })}
                type={form.getFieldValue('mood') === 'stressed' ? 'primary' : 'default'}
                style={{ 
                  backgroundColor: form.getFieldValue('mood') === 'stressed' ? '#5B68F4' : undefined,
                  borderColor: form.getFieldValue('mood') === 'stressed' ? '#5B68F4' : undefined
                }}
              >
                Stressed
              </Button>
              <Button
                icon={<span style={{ fontSize: 16 }}>🚫</span>}
                onClick={() => form.setFieldsValue({ mood: 'blocked' })}
                type={form.getFieldValue('mood') === 'blocked' ? 'primary' : 'default'}
                style={{ 
                  backgroundColor: form.getFieldValue('mood') === 'blocked' ? '#5B68F4' : undefined,
                  borderColor: form.getFieldValue('mood') === 'blocked' ? '#5B68F4' : undefined
                }}
              >
                Blocked
              </Button>
            </Space>
          </Form.Item>

          {/* Total Hours */}
          <Form.Item 
            label={
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                Total Hours Worked <Text type="secondary" style={{ fontSize: 12 }}>(Optional)</Text>
              </span>
            }
            name="totalHoursWorked"
            style={{ marginBottom: 24 }}
          >
            <InputNumber
              min={0}
              max={24}
              step={0.5}
              placeholder="e.g., 8"
              style={{ width: 200 }}
            />
          </Form.Item>

          {/* Project Updates Section */}
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 16 }}>
              Project Updates
            </Text>

            {projectUpdates.map((update, projectIndex) => (
              <div
                key={projectIndex}
                style={{
                  border: '1px solid #e8e8e8',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  backgroundColor: '#fafafa',
                  position: 'relative'
                }}
              >
                {/* Project Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <Text strong style={{ fontSize: 14 }}>
                    Project Update #{projectIndex + 1}
                  </Text>
                  {projectUpdates.length > 1 && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveProject(projectIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {/* Project Selection */}
                <Form.Item
                  label={
                    <span style={{ fontSize: 13 }}>
                      Project <span style={{ color: '#ff4d4f' }}>*</span>
                    </span>
                  }
                  required={false}
                  validateStatus={!update.projectId ? 'error' : 'success'}
                  help={!update.projectId && 'Please select a project'}
                  style={{ marginBottom: 16 }}
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
                <Form.Item
                  label={
                    <span style={{ fontSize: 13 }}>
                      What did you complete today? <span style={{ color: '#ff4d4f' }}>*</span>
                    </span>
                  }
                  required={false}
                  style={{ marginBottom: 16 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {update.completedTasks.map((task, taskIndex) => (
                      <div key={taskIndex} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Input
                          placeholder="Describe completed task..."
                          value={task}
                          onChange={(e) =>
                            handleTaskChange(projectIndex, 'completedTasks', taskIndex, e.target.value)
                          }
                          style={{ flex: 1 }}
                        />
                        {update.completedTasks.length > 1 && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleRemoveTask(projectIndex, 'completedTasks', taskIndex)}
                          />
                        )}
                      </div>
                    ))}
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddTask(projectIndex, 'completedTasks')}
                      size="small"
                      style={{ padding: 0, height: 'auto', fontSize: 13 }}
                    >
                      Add Task
                    </Button>
                  </Space>
                </Form.Item>

                {/* Planned Tasks */}
                <Form.Item
                  label={
                    <span style={{ fontSize: 13 }}>
                      What will you do tomorrow? <Text type="secondary" style={{ fontSize: 12 }}>(Optional)</Text>
                    </span>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {update.plannedTasks && update.plannedTasks.length > 0 && (
                      update.plannedTasks.map((task, taskIndex) => (
                        <div key={taskIndex} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Input
                            placeholder="Describe planned task..."
                            value={task}
                            onChange={(e) =>
                              handleTaskChange(projectIndex, 'plannedTasks', taskIndex, e.target.value)
                            }
                            style={{ flex: 1 }}
                          />
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleRemoveTask(projectIndex, 'plannedTasks', taskIndex)}
                          />
                        </div>
                      ))
                    )}
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddTask(projectIndex, 'plannedTasks')}
                      size="small"
                      style={{ padding: 0, height: 'auto', fontSize: 13 }}
                    >
                      Add Planned Task
                    </Button>
                  </Space>
                </Form.Item>

                {/* Blockers */}
                <Form.Item
                  label={
                    <span style={{ fontSize: 13 }}>
                      Any blockers or issues? <Text type="secondary" style={{ fontSize: 12 }}>(Optional)</Text>
                    </span>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {update.blockers && update.blockers.length > 0 && (
                      update.blockers.map((blocker, blockerIndex) => (
                        <div key={blockerIndex} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Input
                            placeholder="Describe blocker..."
                            value={blocker}
                            onChange={(e) =>
                              handleTaskChange(projectIndex, 'blockers', blockerIndex, e.target.value)
                            }
                            style={{ flex: 1 }}
                          />
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleRemoveTask(projectIndex, 'blockers', blockerIndex)}
                          />
                        </div>
                      ))
                    )}
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddTask(projectIndex, 'blockers')}
                      size="small"
                      style={{ padding: 0, height: 'auto', fontSize: 13 }}
                    >
                      Add Blocker
                    </Button>
                  </Space>
                </Form.Item>

                {/* Hours Spent */}
                <Form.Item
                  label={
                    <span style={{ fontSize: 13 }}>
                      Hours Spent <Text type="secondary" style={{ fontSize: 12 }}>(Optional)</Text>
                    </span>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <InputNumber
                    min={0}
                    max={24}
                    step={0.5}
                    value={update.hoursSpent}
                    onChange={(value) => handleHoursChange(projectIndex, value)}
                    placeholder="e.g., 5"
                    style={{ width: 200 }}
                  />
                </Form.Item>

                {/* Additional Notes */}
                <Form.Item
                  label={
                    <span style={{ fontSize: 13 }}>
                      Additional Notes <Text type="secondary" style={{ fontSize: 12 }}>(Optional)</Text>
                    </span>
                  }
                  style={{ marginBottom: 0 }}
                >
                  <TextArea
                    rows={2}
                    placeholder="Any additional notes for this project..."
                    value={update.notes}
                    onChange={(e) => handleNotesChange(projectIndex, e.target.value)}
                  />
                </Form.Item>
              </div>
            ))}

            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={handleAddProject}
              disabled={projectUpdates.length >= projects.length}
              style={{ padding: 0, height: 'auto', fontSize: 13 }}
            >
              Add Another Project Update
            </Button>
          </div>

          {/* General Notes */}
          <Form.Item
            label={
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                General Notes <Text type="secondary" style={{ fontSize: 12 }}>(Optional)</Text>
              </span>
            }
            name="generalNotes"
            style={{ marginBottom: 24 }}
          >
            <TextArea
              rows={3}
              placeholder="Any other updates not related to specific projects..."
            />
          </Form.Item>

          {/* Submit Buttons */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button 
                type="primary" 
                onClick={handleSubmit} 
                loading={loading}
                // style={{ 
                //   minWidth: 140,
                //   backgroundColor: '#5B68F4',
                //   borderColor: '#5B68F4'
                // }}
              >
                {alreadySubmitted ? 'Update Daily Status' : 'Submit Daily Status'}
              </Button>
              <Button 
                onClick={() => router.push('/daily-updates/view')}
                style={{ minWidth: 100 }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
