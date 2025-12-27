"use client";

import React, { useEffect } from "react";
import { Form, Input, Select, DatePicker, InputNumber, Button, Space, Row, Col } from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import TiptapEditor from "@/components/common/TiptapEditor";
import { TicketDetails } from "@/types/ticket";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TYPE_OPTIONS } from "@/utils/ticketUtils";

interface TicketDetailsFormProps {
  ticket: TicketDetails;
  form: any;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  projects: Array<{ value: string; label: string }>;
  members: Array<{ value: string; label: string; position: string }>;
  platforms: Array<{ value: string; label: string }>;
  stacks: Array<{ value: string; label: string }>;
  priorities: Array<{ value: string; label: string }>;
  taskLevels: Array<{ value: string; label: string }>;
  taskTypes: Array<{ value: string; label: string }>;
  dataLoading: boolean;
}

export default function TicketDetailsForm({
  ticket,
  form,
  onSave,
  onCancel,
  isSaving,
  projects,
  members,
  platforms,
  stacks,
  priorities,
  taskLevels,
  taskTypes,
  dataLoading,
}: TicketDetailsFormProps) {
  // Populate form when ticket data is loaded
  useEffect(() => {
    if (ticket) {
      form.setFieldsValue({
        title: ticket.title || "",
        description: ticket.description || "",
        platform: ticket.platform || "",
        stack: (ticket as any).stack || "",
        project: typeof ticket.project === 'string' ? ticket.project : ticket.project?.id || "",
        priority: ticket.priority || "",
        type: ticket.type || "",
        taskLevel: ticket.taskLevel || "",
        status: ticket.status || "",
        assignee: ticket.assignee?.id || "",
        reportTo: typeof ticket.reportTo === "string" ? ticket.reportTo : ticket.reportTo?.id || "",
        storyPoint: (ticket as any).storyPoint || 0,
        estimateHours: (ticket as any).estimateHours || 0,
        startDate: (ticket as any).startDate ? dayjs((ticket as any).startDate) : null,
        endDate: (ticket as any).endDate ? dayjs((ticket as any).endDate) : null,
        releasePlan: (ticket as any).releasePlan || "",
      });
    }
  }, [ticket, form]);

  return (
    <div style={{ position: "relative" }}>
      {/* Save/Cancel Buttons - Top Right */}
      <div
        style={{
          position: "absolute",
          top: "0px",
          right: "0px",
          zIndex: 10,
        }}
      >
        <Space>
          <Button
            icon={<CloseOutlined />}
            onClick={onCancel}
            size="small"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isSaving}
            onClick={onSave}
            size="small"
          >
            Save Changes
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        style={{ paddingTop: "40px" }}
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter title" }]}
        >
          <Input placeholder="Enter ticket title..." />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Platform"
              name="platform"
              rules={[
                { required: true, message: "Please select platform" },
              ]}
            >
              <Select loading={dataLoading}>
                {platforms.map((platform) => (
                  <Select.Option
                    key={platform.value}
                    value={platform.value}
                  >
                    {platform.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Project"
              name="project"
              rules={[
                { required: true, message: "Please select project" },
              ]}
            >
              <Select loading={dataLoading}>
                {projects.map((project) => (
                  <Select.Option
                    key={project.value}
                    value={project.value}
                  >
                    {project.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.platform !== currentValues.platform
          }
        >
          {({ getFieldValue }) =>
            getFieldValue("platform") === "Development" ? (
              <Form.Item
                label="Stack"
                name="stack"
                rules={[
                  { required: true, message: "Please select a stack" },
                ]}
              >
                <Select loading={dataLoading}>
                  {stacks.map((stack) => (
                    <Select.Option
                      key={stack.value}
                      value={stack.value}
                    >
                      {stack.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { required: true, message: "Please enter description" },
          ]}
        >
          <TiptapEditor
            content={form.getFieldValue('description')}
            onChange={(html) => form.setFieldValue('description', html)}
            minHeight={200}
            maxHeight={400}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Priority"
              name="priority"
              rules={[
                { required: true, message: "Please select priority" },
              ]}
            >
              <Select loading={dataLoading}>
                {priorities.map((priority) => (
                  <Select.Option
                    key={priority.value}
                    value={priority.value}
                  >
                    {priority.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Status"
              name="status"
              rules={[
                { required: true, message: "Please select status" },
              ]}
            >
              <Select loading={dataLoading}>
                {STATUS_OPTIONS.map((status) => (
                  <Select.Option key={status.value} value={status.value}>
                    {status.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            {/* Empty column for better spacing */}
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Task Type"
              name="type"
              rules={[
                {
                  required: true,
                  message: "Please select task type",
                },
              ]}
            >
              <Select loading={dataLoading}>
                {taskTypes.map((taskType) => (
                  <Select.Option
                    key={taskType.value}
                    value={taskType.value}
                  >
                    {taskType.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Task Level"
              name="taskLevel"
              rules={[
                {
                  required: true,
                  message: "Please select task level",
                },
              ]}
            >
              <Select loading={dataLoading}>
                {taskLevels.map((taskLevel) => (
                  <Select.Option
                    key={taskLevel.value}
                    value={taskLevel.value}
                  >
                    {taskLevel.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Story Points"
              name="storyPoint"
              rules={[
                {
                  required: true,
                  message: "Please enter story points",
                },
              ]}
            >
              <InputNumber
                min={1}
                max={5}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Assignee"
              name="assignee"
              rules={[
                { required: true, message: "Please select assignee" },
              ]}
            >
              <Select
                placeholder="Select assignee"
                loading={dataLoading}
                showSearch
                filterOption={(input, option) => {
                  const member = members.find(
                    (m) => m.value === option?.value
                  );
                  return member
                    ? member.label
                        .toLowerCase()
                        .includes(input.toLowerCase()) ||
                        member.position
                          .toLowerCase()
                          .includes(input.toLowerCase())
                    : false;
                }}
              >
                {members.map((member) => (
                  <Select.Option
                    key={member.value}
                    value={member.value}
                  >
                    {member.label} - {member.position}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Report To"
              name="reportTo"
              rules={[
                {
                  required: true,
                  message: "Please select report to",
                },
              ]}
            >
              <Select
                placeholder="Select manager"
                loading={dataLoading}
                showSearch
                filterOption={(input, option) => {
                  const member = members.find(
                    (m) => m.value === option?.value
                  );
                  return member
                    ? member.label
                        .toLowerCase()
                        .includes(input.toLowerCase()) ||
                        member.position
                          .toLowerCase()
                          .includes(input.toLowerCase())
                    : false;
                }}
              >
                {members.map((member) => (
                  <Select.Option
                    key={member.value}
                    value={member.value}
                  >
                    {member.label} - {member.position}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Estimate Hours"
              name="estimateHours"
              rules={[
                {
                  required: true,
                  message: "Please enter estimate hours",
                },
              ]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Start Date" name="startDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="End Date" name="endDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Plans" name="releasePlan">
          <Input />
        </Form.Item>
      </Form>
    </div>
  );
}
