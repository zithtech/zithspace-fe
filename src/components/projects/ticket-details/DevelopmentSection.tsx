'use client';

import React, { useState } from 'react';
import { Card, Button, Form, Input, Select, Empty, Tag, Space, Modal, Tooltip } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GithubOutlined,
  GitlabOutlined,
  BranchesOutlined,
  LinkOutlined,
  SaveOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  useTicketDevelopmentInfo,
  useUpdateDevelopmentInfo,
  useTicketPullRequests,
  useCreatePullRequest,
  useUpdatePullRequest,
  useDeletePullRequest,
} from '@/hooks/useTicketDevelopment';
import type {
  TicketDevelopmentInfo,
  TicketPullRequest,
  DevelopmentInfoFormData,
  PullRequestFormData,
} from '@/types/ticket';

interface DevelopmentSectionProps {
  ticketId: string;
}

const DevelopmentSection: React.FC<DevelopmentSectionProps> = ({ ticketId }) => {
  const [repoForm] = Form.useForm();
  const [prForm] = Form.useForm();

  const [isEditingRepo, setIsEditingRepo] = useState(false);
  const [isAddingPR, setIsAddingPR] = useState(false);
  const [editingPR, setEditingPR] = useState<TicketPullRequest | null>(null);

  // Queries
  const { data: devInfo, isLoading: loadingDevInfo } = useTicketDevelopmentInfo(ticketId);
  const { data: pullRequests = [], isLoading: loadingPRs } = useTicketPullRequests(ticketId);

  // Mutations
  const updateDevInfoMutation = useUpdateDevelopmentInfo(ticketId);
  const createPRMutation = useCreatePullRequest(ticketId);
  const updatePRMutation = useUpdatePullRequest(ticketId);
  const deletePRMutation = useDeletePullRequest(ticketId);

  // Repository Info Handlers
  const handleSaveRepo = async () => {
    try {
      const values = await repoForm.validateFields();
      await updateDevInfoMutation.mutateAsync(values);
      setIsEditingRepo(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancelRepo = () => {
    if (devInfo) {
      repoForm.setFieldsValue({
        repositoryName: devInfo.repositoryName || '',
        repositoryUrl: devInfo.repositoryUrl || '',
        branchName: devInfo.branchName || '',
      });
    }
    setIsEditingRepo(false);
  };

  // Pull Request Handlers
  const handleAddPR = async () => {
    try {
      const values = await prForm.validateFields();
      await createPRMutation.mutateAsync(values);
      prForm.resetFields();
      setIsAddingPR(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleUpdatePR = async () => {
    if (!editingPR) return;
    try {
      const values = await prForm.validateFields();
      await updatePRMutation.mutateAsync({
        prId: editingPR.id,
        data: values,
      });
      prForm.resetFields();
      setEditingPR(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeletePR = (prId: string) => {
    Modal.confirm({
      title: 'Delete Pull Request',
      content: 'Are you sure you want to delete this pull request?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deletePRMutation.mutate(prId),
    });
  };

  const handleEditPR = (pr: TicketPullRequest) => {
    setEditingPR(pr);
    prForm.setFieldsValue({
      title: pr.title,
      url: pr.url,
      prNumber: pr.prNumber || undefined,
      status: pr.status,
    });
  };

  const handleCancelPR = () => {
    prForm.resetFields();
    setIsAddingPR(false);
    setEditingPR(null);
  };

  // Get icon based on repo URL
  const getRepoIcon = (url?: string | null) => {
    if (!url) return <GithubOutlined />;
    if (url.includes('github')) return <GithubOutlined />;
    if (url.includes('gitlab')) return <GitlabOutlined />;
    return <GithubOutlined />;
  };

  // Get status tag for PR
  const getPRStatusTag = (status: string) => {
    switch (status) {
      case 'open':
        return <Tag icon={<SyncOutlined spin />} color="blue">Open</Tag>;
      case 'merged':
        return <Tag icon={<CheckCircleOutlined />} color="green">Merged</Tag>;
      case 'closed':
        return <Tag icon={<CloseCircleOutlined />} color="red">Closed</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  React.useEffect(() => {
    if (devInfo && !isEditingRepo) {
      repoForm.setFieldsValue({
        repositoryName: devInfo.repositoryName || '',
        repositoryUrl: devInfo.repositoryUrl || '',
        branchName: devInfo.branchName || '',
      });
    }
  }, [devInfo, repoForm, isEditingRepo]);

  return (
    <div className="development-section" style={{ padding: '24px' }}>
      {/* Repository Information Card */}
      <Card
        title={
          <Space>
            {getRepoIcon(devInfo?.repositoryUrl)}
            <span>Repository Information</span>
          </Space>
        }
        extra={
          !isEditingRepo ? (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => setIsEditingRepo(true)}
            >
              Edit
            </Button>
          ) : null
        }
        loading={loadingDevInfo}
        style={{ marginBottom: '24px' }}
      >
        <Form form={repoForm} layout="vertical">
          <Form.Item
            label="Repository Name"
            name="repositoryName"
            rules={[{ max: 255, message: 'Repository name is too long' }]}
          >
            <Input
              placeholder="e.g., zithmi-backend"
              prefix={getRepoIcon(devInfo?.repositoryUrl)}
              disabled={!isEditingRepo}
            />
          </Form.Item>

          <Form.Item
            label="Repository URL"
            name="repositoryUrl"
            rules={[
              { type: 'url', message: 'Please enter a valid URL' },
            ]}
          >
            <Input
              placeholder="https://github.com/yourorg/repo"
              prefix={<LinkOutlined />}
              disabled={!isEditingRepo}
            />
          </Form.Item>

          <Form.Item
            label="Branch Name"
            name="branchName"
            rules={[{ max: 255, message: 'Branch name is too long' }]}
          >
            <Input
              placeholder="e.g., feature/ticket-123"
              prefix={<BranchesOutlined />}
              disabled={!isEditingRepo}
            />
          </Form.Item>

          {isEditingRepo && (
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveRepo}
                  loading={updateDevInfoMutation.isPending}
                >
                  Save
                </Button>
                <Button icon={<CloseOutlined />} onClick={handleCancelRepo}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Card>

      {/* Pull Requests Card */}
      <Card
        title={
          <Space>
            <GithubOutlined />
            <span>Pull Requests</span>
          </Space>
        }
        extra={
          !isAddingPR && !editingPR ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddingPR(true)}
            >
              Add PR
            </Button>
          ) : null
        }
        loading={loadingPRs}
      >
        {/* Add/Edit PR Form */}
        {(isAddingPR || editingPR) && (
          <Card style={{ marginBottom: '16px', background: '#fafafa' }}>
            <Form form={prForm} layout="vertical">
              <Form.Item
                label="PR Title"
                name="title"
                rules={[{ required: true, message: 'Please enter PR title' }]}
              >
                <Input placeholder="e.g., Fix: Resolve ticket editing bugs" />
              </Form.Item>

              <Form.Item
                label="PR URL"
                name="url"
                rules={[
                  { required: true, message: 'Please enter PR URL' },
                  { type: 'url', message: 'Please enter a valid URL' },
                ]}
              >
                <Input
                  placeholder="https://github.com/yourorg/repo/pull/123"
                  prefix={<LinkOutlined />}
                />
              </Form.Item>

              <Space style={{ width: '100%' }} size="large">
                <Form.Item
                  label="PR Number"
                  name="prNumber"
                  style={{ marginBottom: 0, width: '150px' }}
                >
                  <Input type="number" placeholder="123" />
                </Form.Item>

                <Form.Item
                  label="Status"
                  name="status"
                  initialValue="open"
                  style={{ marginBottom: 0, width: '150px' }}
                >
                  <Select>
                    <Select.Option value="open">Open</Select.Option>
                    <Select.Option value="merged">Merged</Select.Option>
                    <Select.Option value="closed">Closed</Select.Option>
                  </Select>
                </Form.Item>
              </Space>

              <Form.Item style={{ marginTop: '16px', marginBottom: 0 }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={editingPR ? handleUpdatePR : handleAddPR}
                    loading={createPRMutation.isPending || updatePRMutation.isPending}
                  >
                    {editingPR ? 'Update' : 'Add'}
                  </Button>
                  <Button icon={<CloseOutlined />} onClick={handleCancelPR}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* Pull Requests List */}
        {pullRequests.length === 0 ? (
          <Empty
            description="No pull requests added yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pullRequests.map((pr) => (
              <Card
                key={pr.id}
                size="small"
                style={{ background: '#fafafa' }}
                actions={[
                  <Tooltip title="Edit" key="edit">
                    <EditOutlined
                      onClick={() => handleEditPR(pr)}
                      style={{ color: '#1890ff' }}
                    />
                  </Tooltip>,
                  <Tooltip title="Delete" key="delete">
                    <DeleteOutlined
                      onClick={() => handleDeletePR(pr.id)}
                      style={{ color: '#ff4d4f' }}
                    />
                  </Tooltip>,
                ]}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px' }}>{pr.title}</strong>
                    {getPRStatusTag(pr.status)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <LinkOutlined />
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px' }}
                    >
                      {pr.url}
                    </a>
                  </div>
                  {pr.prNumber && (
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      PR #{pr.prNumber}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DevelopmentSection;
