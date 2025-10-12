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
  message,
  Divider,
} from 'antd';
import {
  PlusCircleOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ScheduleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DailyUpdateService from '@/services/dailyUpdateService';
import { ProjectService } from '@/services/projectService';
import { DailyStatusUpdate, ProjectUpdate } from '@/types/dailyUpdate';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;

export default function ViewDailyUpdatesPage() {
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
      <ViewDailyUpdatesContent />
    </MainLayout>
  );
}

function ViewDailyUpdatesContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<DailyStatusUpdate[]>([]);
  const [projects, setProjects] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);

  // Determine if user can view team updates
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
        // Fetch team updates
        const teamUpdates = await DailyUpdateService.getTeamUpdates({
          date: dateStr,
          projectId: selectedProject,
          userId: selectedUser,
        });
        console.log("ssss",{teamUpdates})
        setUpdates(teamUpdates);
      } else {
        // Fetch only own updates
        const myUpdates = await DailyUpdateService.getMyUpdates({
          date: dateStr,
        });
        console.log("ssssss",{myUpdates})

        setUpdates(myUpdates);
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
      message.error('Failed to load daily updates');
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

  // Get unique users from updates for filtering
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
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>Daily Status Updates</Title>
          <Text type="secondary">
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
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Date</Text>
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
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Project</Text>
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
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>User</Text>
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
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Loading updates...</Text>
            </div>
          </div>
        </Card>
      ) : updates.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">No updates found for this date</Text>
                <br />
                <Text type="secondary">
                  {canViewTeam
                    ? 'No team members have submitted updates yet'
                    : 'You haven\'t submitted an update for this date'}
                </Text>
              </div>
            }
          >
            <Button type="primary" onClick={handleSubmitNew}>
              Submit Update
            </Button>
          </Empty>
        </Card>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {updates.map((update) => (
            <Card key={update.id} style={{ borderLeft: '4px solid #1890ff' }}>
              {/* User Header */}
              <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                  <Space>
                    <Avatar size="large" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                      {update.user?.name.charAt(0)}
                    </Avatar>
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {update.user?.name}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {update.user?.position}
                      </Text>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    {update.mood && (
                      <Tag color={getMoodColor(update.mood)}>
                        {getMoodEmoji(update.mood)} {update.mood.charAt(0).toUpperCase() + update.mood.slice(1)}
                      </Tag>
                    )}
                    {update.totalHoursWorked && (
                      <Tag icon={<ClockCircleOutlined />} color="blue">
                        {update.totalHoursWorked} hours
                      </Tag>
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Submitted: {dayjs(update.submittedAt).format('h:mm A')}
                    </Text>
                  </Space>
                </Col>
              </Row>

              <Divider style={{ margin: '12px 0' }} />

              {/* Project Updates */}
              {(update.projectUpdates as ProjectUpdate[]).map((projectUpdate, index) => (
                <Card
                  key={index}
                  type="inner"
                  title={
                    <Space>
                      <Text strong>{projectUpdate.projectName}</Text>
                      {projectUpdate.hoursSpent && (
                        <Tag color="cyan">{projectUpdate.hoursSpent} hrs</Tag>
                      )}
                    </Space>
                  }
                  style={{ marginBottom: 12 }}
                >
                  {/* Completed Tasks */}
                  {projectUpdate.completedTasks && projectUpdate.completedTasks.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <Space align="start">
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16, marginTop: 4 }} />
                        <div style={{ flex: 1 }}>
                          <Text strong>Completed:</Text>
                          <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                            {projectUpdate.completedTasks.map((task, taskIndex) => (
                              <li key={taskIndex}>
                                <Text>{task}</Text>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Space>
                    </div>
                  )}

                  {/* Planned Tasks */}
                  {projectUpdate.plannedTasks && projectUpdate.plannedTasks.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <Space align="start">
                        <ScheduleOutlined style={{ color: '#1890ff', fontSize: 16, marginTop: 4 }} />
                        <div style={{ flex: 1 }}>
                          <Text strong>Planned:</Text>
                          <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                            {projectUpdate.plannedTasks.map((task, taskIndex) => (
                              <li key={taskIndex}>
                                <Text>{task}</Text>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Space>
                    </div>
                  )}

                  {/* Blockers */}
                  {projectUpdate.blockers && projectUpdate.blockers.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <Space align="start">
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 16, marginTop: 4 }} />
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ color: '#ff4d4f' }}>
                            Blockers:
                          </Text>
                          <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                            {projectUpdate.blockers.map((blocker, blockerIndex) => (
                              <li key={blockerIndex}>
                                <Text>{blocker}</Text>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Space>
                    </div>
                  )}

                  {/* Notes */}
                  {projectUpdate.notes && (
                    <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <strong>Notes:</strong> {projectUpdate.notes}
                      </Text>
                    </div>
                  )}
                </Card>
              ))}

              {/* General Notes */}
              {update.generalNotes && (
                <div style={{ marginTop: 12, padding: 12, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
                  <Text>
                    <strong>💬 General Notes:</strong> {update.generalNotes}
                  </Text>
                </div>
              )}
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
}
