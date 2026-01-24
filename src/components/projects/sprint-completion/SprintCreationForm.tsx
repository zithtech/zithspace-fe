"use client";

import React from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  Space,
  Select,
  Row,
  Col,
  Typography,
  Divider,
} from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

const { Text } = Typography;

export interface SprintFormData {
  name: string;
  goal?: string;
  startDate: Dayjs;
  endDate: Dayjs;
}

interface SprintCreationFormProps {
  projectId: string;
  loading?: boolean;
  onSubmit: (data: SprintFormData) => Promise<void>;
  onCancel: () => void;
}

export function SprintCreationForm({
  projectId,
  loading = false,
  onSubmit,
  onCancel,
}: SprintCreationFormProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const sprintData: SprintFormData = {
        name: values.name,
        goal: values.goal || "",
        startDate: values.startDate,
        endDate: values.endDate,
      };

      await onSubmit(sprintData);
    } catch (error) {
      console.error("Form validation failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDurationChange = (duration: string) => {
    const startDate = form.getFieldValue("startDate") || dayjs();
    let endDate = dayjs(startDate);

    switch (duration) {
      case "1w":
        endDate = endDate.add(1, "week");
        break;
      case "2w":
        endDate = endDate.add(2, "week");
        break;
      case "3w":
        endDate = endDate.add(3, "week");
        break;
      case "4w":
        endDate = endDate.add(4, "week");
        break;
      default:
        break;
    }

    form.setFieldsValue({
      startDate,
      endDate,
    });
  };

  return (
    <div>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label={<Text strong>Sprint Name</Text>}
          name="name"
          rules={[
            { required: true, message: "Sprint name is required" },
            { max: 100, message: "Name must be less than 100 characters" },
          ]}
        >
          <Input
            placeholder="e.g., Sprint 6, Q1 Sprint 2"
            size="large"
            autoFocus
          />
        </Form.Item>

        <Form.Item
          label={<Text strong>Sprint Goal</Text>}
          name="goal"
          rules={[{ max: 500, message: "Goal must be less than 500 characters" }]}
        >
          <Input.TextArea
            rows={2}
            placeholder="What is the main objective of this sprint?"
            style={{ resize: "none" }}
          />
        </Form.Item>

        <Divider style={{ margin: "16px 0" }} />

        <Text strong style={{ display: "block", marginBottom: 12 }}>
          Schedule
        </Text>

        <Form.Item
          label="Duration Helper"
          style={{ marginBottom: 12 }}
        >
          <Select
            placeholder="Quick select duration"
            onChange={handleDurationChange}
            options={[
              { label: "1 Week", value: "1w" },
              { label: "2 Weeks", value: "2w" },
              { label: "3 Weeks", value: "3w" },
              { label: "4 Weeks", value: "4w" },
            ]}
          />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true, message: "Start date is required" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="End Date"
              name="endDate"
              rules={[{ required: true, message: "End date is required" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Divider style={{ margin: "24px 0" }} />

      <Space style={{ width: "100%", justifyContent: "flex-end" }}>
        <Button onClick={onCancel} disabled={submitting || loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={submitting || loading}
        >
          Create & Move Tickets
        </Button>
      </Space>
    </div>
  );
}
