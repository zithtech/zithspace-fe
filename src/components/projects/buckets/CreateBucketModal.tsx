"use client";

import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  ColorPicker,
  Space,
  Typography,
  message,
} from "antd";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useCreateBucket, useUpdateBucket } from "@/hooks/useBuckets";
import type { Bucket } from "@/services/bucketService";
import type { Color } from "antd/es/color-picker";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CreateBucketModalProps {
  open: boolean;
  bucket?: Bucket | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBucketModal({
  open,
  bucket,
  onClose,
  onSuccess,
}: CreateBucketModalProps) {
  const [form] = Form.useForm();
  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();

  const createBucket = useCreateBucket();
  const updateBucket = useUpdateBucket();

  const isEditing = !!bucket;

  // Reset form when modal opens/closes or bucket changes
  useEffect(() => {
    if (open && bucket) {
      form.setFieldsValue({
        name: bucket.name,
        description: bucket.description,
        projectId: typeof bucket.project === "string" ? bucket.project : bucket.project?.id,
        color: bucket.color || "#1890ff",
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({ color: "#1890ff" });
    }
  }, [open, bucket, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Handle color picker value
      const colorValue = typeof values.color === 'string' 
        ? values.color 
        : values.color?.toHexString?.() || "#1890ff";

      const data = {
        name: values.name,
        description: values.description || "",
        projectId: values.projectId,
        color: colorValue,
      };

      if (isEditing && bucket) {
        await updateBucket.mutateAsync({ id: bucket.id, data });
      } else {
        await createBucket.mutateAsync(data);
      }

      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      console.error("Failed to save bucket:", error);
      message.error(error.message || "Failed to save bucket");
    }
  };

  return (
    <Modal
      title={
        <div style={{ marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0 }}>
            {isEditing ? "Edit Bucket" : "Create Bucket"}
          </Title>
          <Text type="secondary">
            {isEditing
              ? "Update bucket details"
              : "Create a new bucket to organize tickets"}
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEditing ? "Update" : "Create"}
      cancelText="Cancel"
      width={600}
      confirmLoading={createBucket.isPending || updateBucket.isPending}
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ color: "#1890ff" }}
      >
        <Form.Item
          label={<Text strong>Bucket Name</Text>}
          name="name"
          rules={[
            { required: true, message: "Bucket name is required" },
            { max: 100, message: "Name must be less than 100 characters" },
          ]}
        >
          <Input
            placeholder="e.g. Backlog, Feature Requests, Technical Debt"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={<Text strong>Description</Text>}
          name="description"
          rules={[
            { max: 500, message: "Description must be less than 500 characters" },
          ]}
        >
          <TextArea
            rows={3}
            placeholder="Describe the purpose of this bucket"
            style={{ resize: "none" }}
          />
        </Form.Item>

        <Form.Item
          label={<Text strong>Project</Text>}
          name="projectId"
          rules={[{ required: true, message: "Project is required" }]}
        >
          <Select
            placeholder="Select project"
            size="large"
            loading={projectsLoading}
            options={projects}
            showSearch
            filterOption={(input, option) =>
              (option?.label?.toString() || "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label={<Text strong>Color</Text>}
          name="color"
          tooltip="Choose a color to identify this bucket"
        >
          <ColorPicker
            showText
            size="large"
            format="hex"
            presets={[
              {
                label: "Recommended",
                colors: [
                  "#1890ff", // Blue
                  "#52c41a", // Green
                  "#722ed1", // Purple
                  "#fa8c16", // Orange
                  "#eb2f96", // Pink
                  "#13c2c2", // Cyan
                  "#faad14", // Gold
                  "#f5222d", // Red
                ],
              },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
