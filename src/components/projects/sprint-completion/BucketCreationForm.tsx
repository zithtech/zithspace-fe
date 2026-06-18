"use client";

import React from "react";
import { Form, Input, Button, Typography, Tooltip, message } from "antd";
import {
  InboxOutlined,
  FolderAddOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import DocumentHubService from "@/services/documentHub";

const { Text } = Typography;
const { TextArea } = Input;

/** Strip HTML tags so AI-rewritten content lands cleanly in the plain-text description. */
const stripHtml = (html: string): string =>
  (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();

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

const NAME_MAX = 100;
const DESC_MAX = 500;

export function BucketCreationForm({
  loading = false,
  onSubmit,
  onCancel,
}: BucketCreationFormProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);
  const [enhancing, setEnhancing] = React.useState(false);

  const nameValue = Form.useWatch("name", form) || "";
  const descValue = Form.useWatch("description", form) || "";

  const handleEnhance = async () => {
    const current = (form.getFieldValue("description") || "").trim();
    if (!current) {
      message.info("Write a short description first, then enhance it with Zai.");
      return;
    }
    try {
      setEnhancing(true);
      const result = await DocumentHubService.rewriteAiSelection({
        text: current,
        instruction:
          "Expand this short note into a clear, well-structured bucket description. " +
          "Keep it concise (2–4 sentences), professional, and as plain prose without headings or lists.",
      });
      const enhanced = stripHtml(result?.rewrittenHtml || "").slice(0, DESC_MAX);
      if (!enhanced) {
        message.error("Zai returned an empty response. Please try again.");
        return;
      }
      form.setFieldsValue({ description: enhanced });
      message.success("Description enhanced with Zai.");
    } catch (err: any) {
      message.error(err?.message || "Failed to enhance with Zai");
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await onSubmit({
        name: values.name,
        description: values.description || "",
      });
    } catch (error) {
      console.error("Form validation failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sprint-creation-form bucket-creation-form">
      {/* Hero header */}
      <div className="scf-hero">
        <div className="scf-hero__icon">
          <InboxOutlined />
        </div>
        <div className="scf-hero__copy">
          <div className="scf-hero__title">Create a bucket</div>
          <div className="scf-hero__subtitle">
            Group related tickets to organize work outside of sprints.
          </div>
        </div>
        <div className="scf-hero__badge is-active">
          <span className="scf-hero__dot" />
          Shared
        </div>
      </div>

      <Form form={form} layout="vertical" requiredMark={false} className="scf-form">
        <div className="scf-section">
          <div className="scf-section__head">
            <AppstoreOutlined className="scf-section__icon" />
            <span className="scf-section__title">Bucket details</span>
          </div>

          <Form.Item
            label={
              <div className="scf-label">
                <span>Bucket name</span>
                <span className="scf-counter">
                  {nameValue.length}/{NAME_MAX}
                </span>
              </div>
            }
            name="name"
            rules={[
              { required: true, message: "Bucket name is required" },
              { max: NAME_MAX, message: `Name must be ${NAME_MAX} characters or fewer` },
            ]}
          >
            <Input
              placeholder="e.g. Feature Requests, Technical Debt, Q1 Planning"
              size="large"
              autoFocus
              maxLength={NAME_MAX}
              className="scf-input"
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="scf-label">
                <span>
                  Description
                  <Tooltip title="A short note about what belongs in this bucket.">
                    <InfoCircleOutlined className="scf-label__hint" />
                  </Tooltip>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  {/* <Tooltip title="Expand your short note into a detailed description">
                    <button
                      type="button"
                      className="scf-zai-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEnhance();
                      }}
                      disabled={enhancing}
                    >
                      {enhancing ? <LoadingOutlined spin /> : <ThunderboltOutlined />}
                      {enhancing ? "Enhancing…" : "Enhance with Zai"}
                    </button>
                  </Tooltip> */}
                  <span className="scf-counter">
                    {descValue.length}/{DESC_MAX}
                  </span>
                </span>
              </div>
            }
            name="description"
            rules={[{ max: DESC_MAX, message: `Description must be ${DESC_MAX} characters or fewer` }]}
          >
            <TextArea
              rows={3}
              placeholder="Describe the purpose of this bucket (optional)"
              maxLength={DESC_MAX}
              className="scf-textarea"
              style={{ resize: "none" }}
            />
          </Form.Item>
        </div>
      </Form>

      <div className="scf-footer">
        <Text type="secondary" className="scf-footer__hint">
          Buckets are shared across the project and visible to your team.
        </Text>
        <div className="scf-footer__actions">
          <Button onClick={onCancel} disabled={submitting || loading} className="scf-btn-ghost">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting || loading}
            icon={<FolderAddOutlined />}
            className="scf-btn-primary"
          >
            Create Bucket
          </Button>
        </div>
      </div>
    </div>
  );
}
