import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, message, Row, Col } from "antd";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { LinearService } from "@/services/linearService";

interface LinearTicketModalProps {
  open: boolean;
  onCancel: () => void;
  bugIds: string[];
  onSuccess: () => void;
}

export const LinearTicketModal: React.FC<LinearTicketModalProps> = ({
  open,
  onCancel,
  bugIds,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string, projects: { nodes: { id: string; name: string }[] } }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [labels, setLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      fetchLinearData();
    } else {
      form.resetFields();
    }
  }, [open]);

  const fetchLinearData = async () => {
    setFetchingData(true);
    try {
      const [teamsData, usersData, labelsData] = await Promise.all([
        LinearService.getTeams(),
        LinearService.getUsers(),
        LinearService.getLabels(),
      ]);
      setTeams(teamsData || []);
      setUsers(usersData || []);
      setLabels(labelsData || []);
    } catch (error: any) {
      message.error(error.message || "Failed to load Linear data");
    } finally {
      setFetchingData(false);
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      await LinearService.createIssue({
        title: values.title,
        description: values.description,
        teamId: values.teamId,
        projectId: values.projectId,
        assigneeId: values.assigneeId,
        priority: values.priority !== undefined && values.priority !== null ? Number(values.priority) : undefined,
        labelIds: values.labelIds,
        bugIds,
      });
      message.success("Successfully created Linear issue and linked bugs");
      onSuccess();
      onCancel();
    } catch (error: any) {
      message.error(error.message || "Failed to create Linear issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Ticket in Linear"
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
        initialValues={{ priority: 0 }}
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
              name="teamId"
              label="Team"
              rules={[{ required: true, message: "Please select a team" }]}
            >
              <SearchableDropdown
                placeholder="Select a Linear team"
                loading={fetchingData}
                options={teams.map((t) => ({ label: t.name, value: t.id }))}
                onChange={(val) => {
                  setSelectedTeamId(val);
                  form.setFieldsValue({ projectId: undefined });
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="projectId"
              label="Project"
            >
              <SearchableDropdown
                placeholder="Select a Linear project (optional)"
                allowClear
                loading={fetchingData}
                disabled={!selectedTeamId}
                options={
                  selectedTeamId
                    ? teams
                        .find((t) => t.id === selectedTeamId)
                        ?.projects.nodes.map((p) => ({ label: p.name, value: p.id })) || []
                    : []
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="assigneeId" label="Assignee">
              <SearchableDropdown
                placeholder="Select an assignee (optional)"
                allowClear
                loading={fetchingData}
                options={users.map((u) => ({ label: u.name, value: u.id }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="priority" label="Priority">
              <SearchableDropdown
                placeholder="Select priority"
                allowClear
                options={[
                  { label: "No priority", value: "0" },
                  { label: "Urgent", value: "1" },
                  { label: "High", value: "2" },
                  { label: "Medium", value: "3" },
                  { label: "Low", value: "4" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="labelIds" label="Labels">
          <SearchableDropdown
            mode="multiple"
            allowClear
            renderTags
            placeholder="Add labels..."
            loading={fetchingData}
            options={labels.map((l) => ({
              label: l.name,
              value: l.id,
              badge: <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: l.color }} />
            }))}
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
