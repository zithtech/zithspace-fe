'use client';

import React, { useState, useEffect } from 'react';
import { List, Card, Button, Form, Input, DatePicker, Modal, message, Empty, Checkbox, Avatar, Space, Tag } from 'antd';
import { PlusOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { dealService, DealTask } from '@/services/dealService';
import dayjs from 'dayjs';
import ZukvoLoader from "@/components/common/ZukvoLoader";

interface TasksTabProps {
  dealId: string;
}

const TasksTab: React.FC<TasksTabProps> = ({ dealId }) => {
  const [tasks, setTasks] = useState<DealTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await dealService.getTasks(dealId);
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [dealId]);

  const handleAddTask = async (values: any) => {
    try {
      await dealService.createTask(dealId, {
        ...values,
        dueDate: values.dueDate?.toISOString(),
      });
      message.success('Task created successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      message.error('Failed to create task');
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      await dealService.updateTaskStatus(taskId, newStatus);
      message.success(`Task marked as ${newStatus}`);
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
      message.error('Failed to update task status');
    }
  };

  const glassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(5px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          shape="round"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          style={{ background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
        >
          Add Task
        </Button>
      </div>

      <Card variant="borderless" style={glassStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><ZukvoLoader size="md" /></div>
        ) : tasks.length > 0 ? (
          <List
            dataSource={tasks}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '20px',
                  borderBottom: '1px solid rgba(0,0,0,0.03)',
                  transition: 'background-color 0.3s',
                  cursor: 'pointer'
                }}
                className="task-item-hover"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  <Checkbox
                    checked={item.status === 'Completed'}
                    onChange={() => handleToggleTask(item.id, item.status)}
                    style={{ marginTop: '4px', marginRight: '20px', transform: 'scale(1.2)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '16px',
                      textDecoration: item.status === 'Completed' ? 'line-through' : 'none',
                      color: item.status === 'Completed' ? '#8c8c8c' : 'inherit'
                    }}>
                      {item.title}
                    </div>
                    {item.description && (
                      <div style={{
                        color: '#595959',
                        marginTop: '8px',
                        fontSize: '14px',
                        opacity: item.status === 'Completed' ? 0.6 : 1
                      }}>
                        {item.description}
                      </div>
                    )}
                    <Space style={{ marginTop: '12px' }} size="middle">
                      {item.dueDate && (
                        <Tag
                          icon={<CalendarOutlined />}
                          color={dayjs(item.dueDate).isBefore(dayjs(), 'day') && item.status !== 'Completed' ? 'error' : 'default'}
                          style={{ borderRadius: '10px', padding: '2px 10px', border: 'none' }}
                        >
                          {dayjs(item.dueDate).format('MMM DD, YYYY')}
                        </Tag>
                      )}
                      {item.assignedTo && (
                        <Space style={{ backgroundColor: 'rgba(0,0,0,0.03)', padding: '2px 10px', borderRadius: '20px' }}>
                          <Avatar size={20} style={{ backgroundColor: '#1890ff', fontSize: '10px' }}>
                            {item.assignedTo.first_name?.[0]}
                          </Avatar>
                          <span style={{ fontSize: '12px', color: '#595959' }}>
                            {item.assignedTo.first_name} {item.assignedTo.last_name}
                          </span>
                        </Space>
                      )}
                    </Space>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No tasks added yet" />
        )}
      </Card>

      <Modal
        title="Create New Task"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddTask}
        >
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input placeholder="What needs to be done?" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Add details..." />
          </Form.Item>
          <Form.Item name="dueDate" label="Due Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TasksTab;
