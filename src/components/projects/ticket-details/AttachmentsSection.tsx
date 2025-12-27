"use client";

import React from "react";
import { Card, Space, Tag, message } from "antd";
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
    <Card
      title={
        <Space>
          <span>Attachments</span>
          {attachments.length > 0 && (
            <Tag color="blue">{attachments.length}</Tag>
          )}
        </Space>
      }
      style={{ marginTop: 16 }}
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
    </Card>
  );
}
