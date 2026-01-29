"use client";

import React from "react";
import {
  Form,
  Input,
  Button,
  Space,
  Typography,
  Divider,
} from "antd";

const { Text } = Typography;
const { TextArea } = Input;

export interface BucketFormData {
  name: string;
  description?: string;
}

interface BucketCreationFormProps {
  projectId: string;
  loading?: boolean;
  onSubmit: (data: BucketFormData) => Promise<void>;
  onCancel: () => void;
}

export function BucketCreationForm({
  projectId,
  loading = false,
  onSubmit,
  onCancel,
}: BucketCreationFormProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const bucketData: BucketFormData = {
        name: values.name,
        description: values.description || "",
      };

      await onSubmit(bucketData);
    } catch (error) {
      console.error("Form validation failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label={<Text strong>Bucket Name</Text>}
          name="name"
          rules={[
            { required: true, message: "Bucket name is required" },
            { max: 100, message: "Name must be less than 100 characters" },
          ]}
        >
          <Input
            placeholder="e.g., Feature Requests, Technical Debt, Q1 Planning"
            size="large"
            autoFocus
          />
        </Form.Item>

        <Form.Item
          label={<Text strong>Description</Text>}
          name="description"
          rules={[{ max: 500, message: "Description must be less than 500 characters" }]}
        >
          <TextArea
            rows={2}
            placeholder="Describe the purpose of this bucket (optional)"
            style={{ resize: "none" }}
          />
        </Form.Item>
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
          Create Bucket
        </Button>
      </Space>
    </div>
  );
}
