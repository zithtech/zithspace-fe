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
  DatePicker,
  Tag,
  Avatar,
  Empty,
  Spin,
  notification,
  Divider,
  Statistic,
} from 'antd';
import type { NotificationArgsProps } from 'antd';
import {
  PlusCircleOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ScheduleOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  BugOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DailyUpdateService from '@/services/dailyUpdateService';
import { ProjectService } from '@/services/projectService';
import { DailyStatusUpdate, ProjectUpdate, Task, WorkStatus, formatHours } from '@/types/dailyUpdate';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;

export default function ViewDailyUpdatesPage() {
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
      <ViewDailyUpdatesContent />
    </MainLayout>
  );
}

function ViewDailyUpdatesContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<DailyStatusUpdate[]>([]);
  const [projects, setProjects] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);

  const canViewTeam = user?.role === 'super_admin' || user?.position === 'Project Manager';

  useEffect(() => {
    fetchProjects();
    fetchUpdates();
  }, [selectedDate, selectedProject, selectedUser]);

  const fetchProjects = async () => {
    try {
      const projectsData = await ProjectService.getUserProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.format('YYYY-MM-DD');

      if (canViewTeam) {
        const teamUpdates = await DailyUpdateService.getTeamUpdates({
          date: dateStr,
          projectId: selectedProject,
          userId: selectedUser,
        });
        setUpdates(teamUpdates);
      } else {
        const myUpdates = await DailyUpdateService.getMyUpdates({
          date: dateStr,
        });
        setUpdates(myUpdates);
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
      api.error({
        message: 'Error',
        description: 'Failed to load daily updates',
        placement: 'bottomRight',
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'happy':
        return '😊';
      case 'neutral':
        return '😐';
      case 'stressed':
        return '😰';
      case 'blocked':
        return '🚫';
      default:
        return '😐';
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'happy':
        return 'success';
      case 'neutral':
        return 'default';
      case 'stressed':
        return 'warning';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusConfig = (status: WorkStatus) => {
    const configs = {
      pending: { label: 'Pending', color: 'default', icon: '⏳' },
      in_progress: { label: 'In Progress', color: 'processing', icon: '⚙️' },
      dev_complete: { label: 'Dev Complete', color: 'success', icon: '✅' },
      in_testing: { label: 'In Testing', color: 'warning', icon: '🧪' },
      pushed_to_staging: { label: 'Pushed to Staging', color: 'cyan', icon: '🚀' },
      pushed_to_production: { label: 'Pushed to Production', color: 'purple', icon: '🎉' },
    };
    return configs[status] || configs.pending;
  };

  const formatTime = (isoString: string) => {
    return dayjs(isoString).format('h:mm A');
  };

  const calculateTotalHours = (projectUpdates: ProjectUpdate[]) => {
    return projectUpdates.reduce((sum, project) => sum + (project.hoursWorked || 0), 0);
  };

  const getTaskStats = (tasks: Task[]) => {
    const stats = {
      total: tasks.length,
      pending: 0,
      in_progress: 0,
      dev_complete: 0,
      in_testing: 0,
      pushed_to_staging: 0,
      pushed_to_production: 0,
    };

    tasks.forEach((task) => {
      if (task.status in stats) {
        stats[task.status as keyof typeof stats]++;
      }
    });

    return stats;
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleRefresh = () => {
    fetchUpdates();
  };

  const handleSubmitNew = () => {
    router.push('/daily-updates/submit');
  };

  const uniqueUsers = Array.from(
    new Set(updates.map((update) => update.user?.name).filter(Boolean))
  ).map((name) => {
    const update = updates.find((u) => u.user?.name === name);
    return {
      label: name as string,
      value: update?.userId as string,
    };
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
            Daily Status Updates
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {canViewTeam ? 'Team Updates' : 'My Updates'}
          </Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusCircleOutlined />} onClick={handleSubmitNew}>
              Submit Update
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <Text strong style={{ fontSize: 13 }}>Date</Text>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </Space>
          </Col>

          {canViewTeam && (
            <>
              <Col xs={24} sm={12} md={6}>
                <Space direction="vertical" style={{ width: '100%' }} size={4}>
                  <Text strong style={{ fontSize: 13 }}>Project</Text>
                  <Select
                    placeholder="All Projects"
                    style={{ width: '100%' }}
                    value={selectedProject}
                    onChange={setSelectedProject}
                    allowClear
                    options={projects}
                  />
                </Space>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Space direction="vertical" style={{ width: '100%' }} size={4}>
                  <Text strong style={{ fontSize: 13 }}>User</Text>
                  <Select
                    placeholder="All Users"
                    style={{ width: '100%' }}
                    value={selectedUser}
                    onChange={setSelectedUser}
                    allowClear
                    options={uniqueUsers}
                  />
                </Space>
              </Col>
            </>
          )}
        </Row>
      </Card>

      {/* Updates List */}
      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Loading updates...</Text>
            </div>
          </div>
        </Card>
      ) : updates.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary" style={{ fontSize: 14 }}>No updates found for this date</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {canViewTeam
                    ? 'No team members have submitted updates yet'
                    : 'You haven\'t submitted an update for this date'}
                </Text>
              </div>
            }
          >
            <Button type="primary" onClick={handleSubmitNew} style={{ marginTop: 16 }}>
              Submit Update
            </Button>
          </Empty>
        </Card>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={20}>
          {updates.map((update) => {
            const projectUpdates = update.projectUpdates as ProjectUpdate[];
            const totalHours = calculateTotalHours(projectUpdates);

            return (
              <Card 
                key={update.id} 
                style={{ 
                  borderLeft: '4px solid #1890ff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: 8,
                }}
                bodyStyle={{ padding: 24 }}
              >
                {/* User Header */}
                <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                  <Col>
                    <Space size={12}>
                      <Avatar 
                        size={48} 
                        style={{ backgroundColor: '#1890ff', fontSize: 20 }}
                      >
                        {update.user?.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <Text strong style={{ fontSize: 16, display: 'block', lineHeight: 1.3 }}>
                          {update.user?.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {update.user?.position}
                        </Text>
                      </div>
                    </Space>
                  </Col>
                  <Col>
                    <Space wrap size={8}>
                      {update.mood && (
                        <Tag color={getMoodColor(update.mood)} style={{ fontSize: 13, padding: '4px 12px' }}>
                          {getMoodEmoji(update.mood)} {update.mood.charAt(0).toUpperCase() + update.mood.slice(1)}
                        </Tag>
                      )}
                      <Tag icon={<ClockCircleOutlined />} color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
                        {formatHours(totalHours)} total
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Submitted: {dayjs(update.submittedAt).format('h:mm A')}
                      </Text>
                    </Space>
                  </Col>
                </Row>

                {/* General Notes - TOP LEVEL */}
                {update.generalNotes && (
                  <>
                    <div style={{ 
                      padding: 16, 
                      backgroundColor: '#e6f7ff', 
                      borderRadius: 6,
                      borderLeft: '3px solid #1890ff',
                      marginBottom: 20
                    }}>
                      <Space align="start" size={12}>
                        <FileTextOutlined style={{ fontSize: 16, color: '#1890ff', marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ display: 'block', marginBottom: 6, color: '#1890ff', fontSize: 14 }}>
                            General Notes
                          </Text>
                          <Text style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>
                            {update.generalNotes}
                          </Text>
                        </div>
                      </Space>
                    </div>
                    <Divider style={{ margin: '20px 0' }} />
                  </>
                )}

                {/* Project Updates */}
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {projectUpdates.map((projectUpdate, index) => {
                    const taskStats = getTaskStats(projectUpdate.tasks);
                    
                    return (
                      <Card
                        key={index}
                        type="inner"
                        style={{ 
                          backgroundColor: '#fafafa',
                          border: '1px solid #e8e8e8',
                          borderRadius: 8,
                        }}
                        bodyStyle={{ padding: 20 }}
                        title={
                          <Row justify="space-between" align="middle">
                            <Col>
                              <Space>
                                <Text strong style={{ fontSize: 15 }}>
                                  📦 {projectUpdate.projectName}
                                </Text>
                              </Space>
                            </Col>
                            <Col>
                              <Tag icon={<FieldTimeOutlined />} color="cyan" style={{ fontSize: 13 }}>
                                {formatHours(projectUpdate.hoursWorked)}
                              </Tag>
                            </Col>
                          </Row>
                        }
                      >
                        {/* Two Column Layout */}
                        <Row gutter={24}>
                          {/* Left Column - Tasks (60%) */}
                          <Col xs={24} lg={14}>
                            <div style={{ marginBottom: 16 }}>
                              <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
                                📝 Work Summary ({taskStats.total} {taskStats.total === 1 ? 'task' : 'tasks'})
                              </Text>
                              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                {projectUpdate.tasks.map((task: Task, taskIndex: number) => {
                                  const statusConfig = getStatusConfig(task.status);
                                  
                                  return (
                                    <div
                                      key={taskIndex}
                                      style={{
                                        padding: 12,
                                        backgroundColor: '#fff',
                                        borderRadius: 6,
                                        border: '1px solid #e8e8e8',
                                      }}
                                    >
                                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                        <Space wrap>
                                          <Text strong style={{ fontSize: 13, color: '#595959' }}>
                                            {taskIndex + 1}.
                                          </Text>
                                          {task.type === 'ticket' ? (
                                            <>
                                              <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                                                🎫 Ticket
                                              </Tag>
                                              <Text strong style={{ fontSize: 13 }}>
                                                {task.ticketNumber}
                                              </Text>
                                            </>
                                          ) : (
                                            <Tag color="green" style={{ fontSize: 11, margin: 0 }}>
                                              ✍️ Manual
                                            </Tag>
                                          )}
                                        </Space>
                                        <Text style={{ fontSize: 13, display: 'block', paddingLeft: 24 }}>
                                          {task.type === 'ticket' ? task.ticketTitle : task.description}
                                        </Text>
                                        <div style={{ paddingLeft: 24 }}>
                                          <Tag color={statusConfig.color} style={{ fontSize: 12 }}>
                                            {statusConfig.icon} {statusConfig.label}
                                          </Tag>
                                        </div>
                                      </Space>
                                    </div>
                                  );
                                })}
                              </Space>
                            </div>
                          </Col>

                          {/* Right Column - Time & Stats (40%) */}
                          <Col xs={24} lg={10}>
                            {/* Time Tracking */}
                            <div style={{ 
                              marginBottom: 16, 
                              padding: 16, 
                              backgroundColor: '#fff',
                              borderRadius: 6,
                              border: '1px solid #e8e8e8'
                            }}>
                              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                                ⏰ Time Tracking
                              </Text>
                              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                <Row justify="space-between">
                                  <Text type="secondary" style={{ fontSize: 12 }}>Start:</Text>
                                  <Text strong style={{ fontSize: 13 }}>{formatTime(projectUpdate.startTime)}</Text>
                                </Row>
                                <Row justify="space-between">
                                  <Text type="secondary" style={{ fontSize: 12 }}>End:</Text>
                                  <Text strong style={{ fontSize: 13 }}>{formatTime(projectUpdate.endTime)}</Text>
                                </Row>
                                <Divider style={{ margin: '8px 0' }} />
                                <Row justify="space-between">
                                  <Text strong style={{ fontSize: 12 }}>Total:</Text>
                                  <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                                    {formatHours(projectUpdate.hoursWorked)}
                                  </Text>
                                </Row>
                              </Space>
                            </div>

                            {/* Task Summary Stats */}
                            <div style={{ 
                              padding: 16, 
                              backgroundColor: '#fff',
                              borderRadius: 6,
                              border: '1px solid #e8e8e8'
                            }}>
                              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                                📊 Task Summary
                              </Text>
                              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                {taskStats.pushed_to_production > 0 && (
                                  <Row justify="space-between">
                                    <Space size={4}>
                                      <span style={{ fontSize: 12 }}>🎉</span>
                                      <Text style={{ fontSize: 12 }}>Production</Text>
                                    </Space>
                                    <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>
                                      {taskStats.pushed_to_production}
                                    </Tag>
                                  </Row>
                                )}
                                {taskStats.pushed_to_staging > 0 && (
                                  <Row justify="space-between">
                                    <Space size={4}>
                                      <span style={{ fontSize: 12 }}>🚀</span>
                                      <Text style={{ fontSize: 12 }}>Staging</Text>
                                    </Space>
                                    <Tag color="cyan" style={{ fontSize: 11, margin: 0 }}>
                                      {taskStats.pushed_to_staging}
                                    </Tag>
                                  </Row>
                                )}
                                {taskStats.in_testing > 0 && (
                                  <Row justify="space-between">
                                    <Space size={4}>
                                      <span style={{ fontSize: 12 }}>🧪</span>
                                      <Text style={{ fontSize: 12 }}>Testing</Text>
                                    </Space>
                                    <Tag color="warning" style={{ fontSize: 11, margin: 0 }}>
                                      {taskStats.in_testing}
                                    </Tag>
                                  </Row>
                                )}
                                {taskStats.dev_complete > 0 && (
                                  <Row justify="space-between">
                                    <Space size={4}>
                                      <span style={{ fontSize: 12 }}>✅</span>
                                      <Text style={{ fontSize: 12 }}>Complete</Text>
                                    </Space>
                                    <Tag color="success" style={{ fontSize: 11, margin: 0 }}>
                                      {taskStats.dev_complete}
                                    </Tag>
                                  </Row>
                                )}
                                {taskStats.in_progress > 0 && (
                                  <Row justify="space-between">
                                    <Space size={4}>
                                      <span style={{ fontSize: 12 }}>⚙️</span>
                                      <Text style={{ fontSize: 12 }}>In Progress</Text>
                                    </Space>
                                    <Tag color="processing" style={{ fontSize: 11, margin: 0 }}>
                                      {taskStats.in_progress}
                                    </Tag>
                                  </Row>
                                )}
                                {taskStats.pending > 0 && (
                                  <Row justify="space-between">
                                    <Space size={4}>
                                      <span style={{ fontSize: 12 }}>⏳</span>
                                      <Text style={{ fontSize: 12 }}>Pending</Text>
                                    </Space>
                                    <Tag style={{ fontSize: 11, margin: 0 }}>
                                      {taskStats.pending}
                                    </Tag>
                                  </Row>
                                )}
                              </Space>
                            </div>
                          </Col>
                        </Row>

                        {/* Full Width Sections - Blockers & Notes */}
                        {(projectUpdate.blockers || projectUpdate.notes) && (
                          <div style={{ marginTop: 16 }}>
                            {projectUpdate.blockers && (
                              <div style={{ 
                                marginBottom: 12, 
                                padding: 12, 
                                backgroundColor: '#fff2e8',
                                borderRadius: 6,
                                borderLeft: '3px solid #fa8c16'
                              }}>
                                <Space align="start" size={8}>
                                  <ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: 14, marginTop: 2 }} />
                                  <div style={{ flex: 1 }}>
                                    <Text strong style={{ color: '#fa8c16', display: 'block', marginBottom: 4, fontSize: 13 }}>
                                      Blockers
                                    </Text>
                                    <Text style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
                                      {projectUpdate.blockers}
                                    </Text>
                                  </div>
                                </Space>
                              </div>
                            )}

                            {projectUpdate.notes && (
                              <div style={{ 
                                padding: 12, 
                                backgroundColor: '#f6ffed',
                                borderRadius: 6,
                                borderLeft: '3px solid #52c41a'
                              }}>
                                <Space align="start" size={8}>
                                  <FileTextOutlined style={{ color: '#52c41a', fontSize: 14, marginTop: 2 }} />
                                  <div style={{ flex: 1 }}>
                                    <Text strong style={{ color: '#52c41a', display: 'block', marginBottom: 4, fontSize: 13 }}>
                                      Notes
                                    </Text>
                                    <Text style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
                                      {projectUpdate.notes}
                                    </Text>
                                  </div>
                                </Space>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </Space>
              </Card>
            );
          })}
        </Space>
      )}
    </div>
  );
}
