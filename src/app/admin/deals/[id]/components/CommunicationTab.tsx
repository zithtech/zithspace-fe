'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState, useEffect } from 'react';
import { List, Card, Button, Form, Input, Select, Modal, message, Empty, Avatar, Tag } from 'antd';
import { MailOutlined, UserOutlined } from '@ant-design/icons';
import { dealService, DealCommunication } from '@/services/dealService';
import dayjs from 'dayjs';

interface CommunicationTabProps {
  dealId: string;
}

const CommunicationTab: React.FC<CommunicationTabProps> = ({ dealId }) => {
  const [communications, setCommunications] = useState<DealCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const data = await dealService.getCommunications(dealId);
      setCommunications(data);
    } catch (error) {
      console.error('Failed to fetch communications:', error);
      message.error('Failed to load communications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, [dealId]);

  const handleLogEmail = async (values: any) => {
    try {
      await dealService.createCommunication(dealId, {
        ...values,
        type: 'Email',
      });
      message.success('Email logged successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchCommunications();
    } catch (error) {
      console.error('Failed to log communication:', error);
      message.error('Failed to log communication');
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="primary" 
          icon={<MailOutlined />} 
          onClick={() => setIsModalVisible(true)}
        >
          Log Email Manually
        </Button>
      </div>

      <Card variant="borderless" className="shadow-sm">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><ZukvoLoader size="md" /></div>
        ) : communications.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={communications}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        <span style={{ fontWeight: 'bold' }}>{item.subject || '(No Subject)'}</span>
                        <Tag color={item.direction === 'Inbound' ? 'green' : 'blue'} style={{ marginLeft: 8 }}>
                          {item.direction}
                        </Tag>
                      </span>
                      <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                        {dayjs(item.timestamp).format('MMM DD, YYYY HH:mm')}
                      </span>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>
                        From: {item.sender} | To: {item.receiver}
                      </div>
                      <div style={{ color: '#262626', whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '4px' }}>
                        {item.content}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No communications logged yet" />
        )}
      </Card>

      <Modal
        title="Log Email"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogEmail}
          initialValues={{ direction: 'Outbound' }}
        >
          <Form.Item name="direction" label="Direction" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Inbound">Inbound</Select.Option>
              <Select.Option value="Outbound">Outbound</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="sender" label="Sender Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="sender@example.com" />
          </Form.Item>
          <Form.Item name="receiver" label="Receiver Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="receiver@example.com" />
          </Form.Item>
          <Form.Item name="subject" label="Subject">
            <Input placeholder="Email Subject" />
          </Form.Item>
          <Form.Item name="content" label="Email Content" rules={[{ required: true }]}>
            <Input.TextArea rows={6} placeholder="Paste the email content here..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommunicationTab;
