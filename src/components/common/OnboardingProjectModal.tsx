'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Col,
  Row,
} from 'antd';
import { ProjectService } from '@/services/projectService';
import { MembersService } from '@/services/membersService';
import { AuthService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import SearchableDropdown, { SearchableDropdownOption } from '@/components/common/SearchableDropdown';

const { Text } = Typography;

const STATUS_OPTIONS: SearchableDropdownOption[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS: SearchableDropdownOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function OnboardingProjectModal() {
  const { checkAuth } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<SearchableDropdownOption[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    MembersService.getMembersForSelect()
      .then((data) => {
        setMembers(
          data.map((m: any) => ({
            value: m.value,
            label: m.label,
            description: m.position,
            avatarUrl: m.avatarUrl,
          }))
        );
      })
      .catch((err) => console.error('Failed to load members:', err));
  }, []);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      setError('');
      await ProjectService.createProject({
        name: values.name,
        description: 'Initial project created during setup',
        startDate: new Date().toISOString(),
        status: values.status,
        projectManagerId: values.projectManagerId,
        defaultPriority: values.defaultPriority,
        teamMemberIds: [values.projectManagerId],
      });
      await AuthService.completeOnboarding();
      await checkAuth(); // Re-fetches user to update onboardingCompleted
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      await AuthService.completeOnboarding();
      await checkAuth(); // Re-fetches user to update onboardingCompleted
    } catch {
      // Ignore
    }
  };

  return (
      <Modal
        open
        closable={false}
        maskClosable={false}
        footer={null}
        centered
        width={480}
        title={
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              Create your first project
            </div>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
              Set up a project to get started. You can always create more later.
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

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ status: 'planning', defaultPriority: 'medium' }}
        >
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter a project name' }]}
          >
            <Input
              placeholder="e.g. Q3 Marketing Campaign"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="projectManagerId"
            label="Project Manager"
            rules={[{ required: true, message: 'Please select a project manager' }]}
          >
            <SearchableDropdown
              options={members}
              placeholder="Search members..."
              style={{ width: '100%', height: '40px', borderRadius: '8px' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Project Status"
                rules={[{ required: true, message: 'Please select a status' }]}
              >
                <SearchableDropdown
                  options={STATUS_OPTIONS}
                  placeholder="Select status..."
                  hideAvatar
                  style={{ width: '100%', height: '40px', borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="defaultPriority"
                label="Default Priority"
                rules={[{ required: true, message: 'Please select a priority' }]}
              >
                <SearchableDropdown
                  options={PRIORITY_OPTIONS}
                  placeholder="Select priority..."
                  hideAvatar
                  style={{ width: '100%', height: '40px', borderRadius: '8px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Button
              size="large"
              onClick={handleSkip}
              disabled={loading}
              style={{ flex: 1, height: 44, borderRadius: 8 }}
            >
              Skip for now
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                flex: 2,
                height: 44,
                fontSize: 15,
                fontWeight: 500,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none',
                borderRadius: 8,
              }}
            >
              {loading ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </Form>
      </Modal>
  );
}
