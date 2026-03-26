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
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={5} style={{ fontSize: 13, margin: 0, color: '#595959' }}>
          Attachments
          {attachments.length > 0 && (
            <span style={{ fontSize: 12, color: '#bfbfbf', fontWeight: 400, marginLeft: 6 }}>
              • {attachments.length} files
            </span>
          )}
        </Typography.Title>
        
        {!isEditing && (
          <AttachmentUploader
            onUpload={handleUpload}
            maxSize={5}
            disabled={isEditing}
          />
        )}
      </div>

      <div style={{ padding: '0 4px' }}>
        <AttachmentList
          attachments={attachments}
          onDelete={handleDelete}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
