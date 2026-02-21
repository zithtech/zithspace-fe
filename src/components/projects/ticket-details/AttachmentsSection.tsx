"use client";

import React from "react";
import { Space, Tag, message, Typography } from "antd";
import AttachmentUploader from "@/components/common/AttachmentUploader";
import AttachmentList from "@/components/common/AttachmentList";


interface AttachmentsSectionProps {
  attachments: any[];
  isLoading: boolean;
  isEditing: boolean;
  onUpload: (file: string, fileName: string) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
}

export default function AttachmentsSection({
  attachments,
  isLoading,
  isEditing,
  onUpload,
  onDelete,
}: AttachmentsSectionProps) {
  const handleUpload = async (file: string, fileName: string) => {
    try {
      await onUpload(file, fileName);
      message.success("Attachment uploaded successfully");
    } catch (error: any) {
      console.error("Failed to upload attachment:", error);
      throw error;
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await onDelete(attachmentId);
      message.success("Attachment deleted successfully");
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      message.error("Failed to delete attachment");
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <Space style={{ marginBottom: 8 }}>
        <Typography.Title level={5} style={{ fontSize: 13, margin: 0 }}>
          Attachments
        </Typography.Title>
        {attachments.length > 0 && (
          <Tag
            style={{
              borderRadius: 10,
              fontSize: 10,
              lineHeight: "16px",
              border: "none",
              background: "#e6f7ff",
              color: "#1890ff",
            }}
          >
            {attachments.length}
          </Tag>
        )}
      </Space>

      <div
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: 4,
          background: "#fff",
          padding: 16,
        }}
      >
        {!isEditing && (
          <div style={{ marginBottom: 16 }}>
            <AttachmentUploader
              onUpload={handleUpload}
              maxSize={5}
              disabled={isEditing}
            />
          </div>
        )}

        <AttachmentList
          attachments={attachments}
          onDelete={handleDelete}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
