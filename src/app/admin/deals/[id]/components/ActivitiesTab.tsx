'use client';

import React, { useState, useEffect } from 'react';
import { Timeline, Card, Button, Form, Input, DatePicker, Select, Modal, message, Spin, Empty, Typography } from 'antd';
import { PlusOutlined, PhoneOutlined, VideoCameraOutlined, MailOutlined, FileTextOutlined } from '@ant-design/icons';
import { dealService, DealActivity } from '@/services/dealService';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ActivitiesTabProps {
  dealId: string;
}

const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ dealId }) => {
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await dealService.getActivities(dealId);
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      message.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [dealId]);

  const handleAddActivity = async (values: any) => {
    try {
      await dealService.createActivity(dealId, {
        ...values,
        scheduledAt: values.scheduledAt.toISOString(),
      });
      message.success('Activity logged successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchActivities();
    } catch (error) {
      console.error('Failed to create activity:', error);
      message.error('Failed to log activity');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Call': return <PhoneOutlined style={{ color: '#52c41a' }} />;
      case 'Meeting': return <VideoCameraOutlined style={{ color: '#1890ff' }} />;
      case 'Email': return <MailOutlined style={{ color: '#faad14' }} />;
      default: return <FileTextOutlined style={{ color: '#8c8c8c' }} />;
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
          Log Activity
        </Button>
      </div>

      <Card variant="borderless" style={glassStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><Spin /></div>
        ) : activities.length > 0 ? (
          <div style={{ padding: '20px' }}>
            <Timeline
              mode="left"
              items={activities.map(activity => ({
                label: (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {dayjs(activity.scheduledAt).format('MMM DD, YYYY HH:mm')}
                  </Text>
                ),
                children: (
                  <div style={{ paddingBottom: '24px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '8px' }}>{activity.type}</div>
                    <div style={{ 
                      backgroundColor: 'rgba(0,0,0,0.02)', 
                      padding: '16px', 
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.03)',
                      color: '#434343'
                    }}>
                      {activity.content}
                    </div>
                  </div>
                ),
                dot: (
                  <div style={{ 
                    backgroundColor: '#fff', 
                    padding: '8px', 
                    borderRadius: '50%', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getActivityIcon(activity.type)}
                  </div>
                ),
              }))}
            />
          </div>
        ) : (
          <Empty description="No activities logged yet" />
        )}
      </Card>

      <Modal
        title="Log New Activity"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddActivity}
          initialValues={{ type: 'Note', scheduledAt: dayjs() }}
        >
          <Form.Item name="type" label="Activity Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Call">Call</Select.Option>
              <Select.Option value="Meeting">Meeting</Select.Option>
              <Select.Option value="Email">Email</Select.Option>
              <Select.Option value="Note">Note</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="scheduledAt" label="Date & Time" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="content" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="What happened?" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ActivitiesTab;
