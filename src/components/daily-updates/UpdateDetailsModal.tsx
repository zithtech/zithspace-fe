'use client';

import React from 'react';
import { Modal, Avatar, Tag, Space, Typography, Row, Col, Card, Divider, Collapse } from 'antd';
import {
  ClockCircleOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DailyStatusUpdate, ProjectUpdate, Task, WorkStatus, formatHours } from '@/types/dailyUpdate';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface UpdateDetailsModalProps {
  update: DailyStatusUpdate | null;
  open: boolean;
  onClose: () => void;
}

export default function UpdateDetailsModal({ update, open, onClose }: UpdateDetailsModalProps) {
  if (!update) return null;

  const projectUpdates = update.projectUpdates as ProjectUpdate[];
  const totalHours = projectUpdates.reduce((sum, project) => sum + (project.hoursWorked || 0), 0);

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'neutral': return '😐';
      case 'stressed': return '😰';
      case 'blocked': return '🚫';
      default: return '😐';
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'happy': return 'success';
      case 'neutral': return 'default';
      case 'stressed': return 'warning';
      case 'blocked': return 'error';
      default: return 'default';
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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', padding: 0 }}
    >
      {/* Header */}
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        backgroundColor: '#fff',
        zIndex: 1,
      }}>
        <Row justify="space-between" align="middle">
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
                  {update.user?.position?.title || ""}
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
            </Space>
          </Col>
        </Row>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Submitted: {dayjs(update.submittedAt).format('MMM DD, YYYY [at] h:mm A')}
          </Text>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
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
          </>
        )}

        {/* Project Updates */}
        <Collapse 
          defaultActiveKey={projectUpdates.map((_, i) => i.toString())} 
          style={{ backgroundColor: 'transparent', border: 'none' }}
        >
          {projectUpdates.map((projectUpdate, index) => (
            <Panel
              header={
                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
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
              key={index.toString()}
              style={{ 
                marginBottom: 12, 
                backgroundColor: '#fafafa',
                border: '1px solid #e8e8e8',
                borderRadius: 8,
              }}
            >
              <div style={{ padding: '12px 0' }}>
                {/* Time Tracking */}
                <div style={{ 
                  marginBottom: 16, 
                  padding: 12, 
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

                {/* Tasks */}
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
                    📝 Work Summary ({projectUpdate.tasks.length} {projectUpdate.tasks.length === 1 ? 'task' : 'tasks'})
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

                {/* Blockers & Notes */}
                {(projectUpdate.blockers || projectUpdate.notes) && (
                  <div>
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
              </div>
            </Panel>
          ))}
        </Collapse>
      </div>
    </Modal>
  );
}
