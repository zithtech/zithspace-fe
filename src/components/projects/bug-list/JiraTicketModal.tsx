import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, message, Row, Col } from "antd";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { JiraService } from "@/services/jiraService";

interface JiraTicketModalProps {
  open: boolean;
  onCancel: () => void;
  bugIds: string[];
  onSuccess: () => void;
}

export const JiraTicketModal: React.FC<JiraTicketModalProps> = ({
  open,
  onCancel,
  bugIds,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: string; key: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ accountId: string; displayName: string; emailAddress: string }[]>([]);
  const [issueTypes, setIssueTypes] = useState<{ id: string; name: string; description: string; iconUrl: string }[]>([]);
  
  const [fetchingInitialData, setFetchingInitialData] = useState(false);
  const [fetchingIssueTypes, setFetchingIssueTypes] = useState(false);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      fetchJiraData();
    } else {
      form.resetFields();
      setSelectedProjectId(undefined);
      setIssueTypes([]);
    }
  }, [open]);

  const fetchJiraData = async () => {
    setFetchingInitialData(true);
    try {
      const [projectsData, usersData] = await Promise.all([
        JiraService.getProjects(),
        JiraService.getUsers(),
      ]);
      setProjects(projectsData || []);
      setUsers(usersData || []);
    } catch (error: any) {
      message.error(error.message || "Failed to load Jira data");
    } finally {
      setFetchingInitialData(false);
    }
  };

  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId);
    form.setFieldsValue({ issueTypeId: undefined });
    if (!projectId) {
      setIssueTypes([]);
      return;
    }
    
    setFetchingIssueTypes(true);
    try {
      const types = await JiraService.getIssueTypes(projectId);
      setIssueTypes(types || []);
    } catch (error: any) {
      message.error(error.message || "Failed to load Jira issue types");
    } finally {
      setFetchingIssueTypes(false);
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      await JiraService.createIssue({
        title: values.title,
        description: values.description,
        projectId: values.projectId,
        issueTypeId: values.issueTypeId,
        assigneeId: values.assigneeId,
        bugIds,
      });
      message.success("Successfully created Jira issue and linked bugs");
      onSuccess();
      onCancel();
    } catch (error: any) {
      message.error(error.message || "Failed to create Jira issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Ticket in Jira"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      width={650}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input placeholder="Ticket title" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={4} placeholder="Description (optional)" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="projectId"
              label="Project"
              rules={[{ required: true, message: "Please select a project" }]}
            >
              <SearchableDropdown
                placeholder="Select a Jira project"
                loading={fetchingInitialData}
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
                onChange={handleProjectChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="issueTypeId"
              label="Issue Type"
              rules={[{ required: true, message: "Please select an issue type" }]}
            >
              <SearchableDropdown
                placeholder="Select an issue type"
                loading={fetchingIssueTypes}
                disabled={!selectedProjectId}
                options={issueTypes.map((t) => ({ label: t.name, value: t.id }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="assigneeId" label="Assignee">
          <SearchableDropdown
            placeholder="Select an assignee (optional)"
            allowClear
            loading={fetchingInitialData}
            options={users.map((u) => ({ label: u.displayName, value: u.accountId }))}
          />
        </Form.Item>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Issue
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
