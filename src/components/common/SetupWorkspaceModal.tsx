'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Alert } from 'antd';
import { useTenant } from '@/context/TenantContext';
import { api } from '@/lib/axios';

const { Text } = Typography;

export default function SetupWorkspaceModal() {
  const { resolveTenant } = useTenant();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values: { workspaceName: string }) => {
    try {
      setLoading(true);
      setError('');

      const data = await api.put<{ name: string; subdomain: string }>(
        '/api/tenants/complete-setup',
        { workspaceName: values.workspaceName }
      );

      await resolveTenant(data.subdomain);
      const basePart = window.location.host.includes('.')
        ? window.location.host.split('.').slice(1).join('.')
        : window.location.host;
      window.location.href = `${window.location.protocol}//${data.subdomain}.${basePart}/dashboard`;
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      closable={false}
      maskClosable={false}
      footer={null}
      centered
      width={440}
      title={
        <div style={{ paddingTop: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111' }}>
            Complete your workspace setup
          </div>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
            Give your workspace a name. You can always change it later.
          </Text>
        </div>
      }
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
          style={{ marginBottom: 20, fontSize: 13 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="workspaceName"
          label="Workspace Name"
          rules={[
            { required: true, message: 'Please enter a workspace name' },
            { min: 2, message: 'Must be at least 2 characters' },
          ]}
        >
          <Input
            placeholder="e.g. Acme Corp or Abraham Immanuel"
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 20, marginTop: -8 }}>
          This will be your workspace URL slug (e.g. acme-corp.zukov.app)
        </Text>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          style={{
            height: 44,
            fontSize: 15,
            fontWeight: 500,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            border: 'none',
            borderRadius: 8,
          }}
        >
          {loading ? 'Saving…' : 'Save & continue'}
        </Button>
      </Form>
    </Modal>
  );
}
