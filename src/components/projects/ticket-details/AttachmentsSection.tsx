"use client";

import React from "react";
import { message, Typography } from "antd";
import { Paperclip } from "lucide-react";
import AttachmentUploader from "@/components/common/AttachmentUploader";
import AttachmentList from "@/components/common/AttachmentList";
import { SectionCard, EmptyState } from "./ticketDetailUI";

interface AttachmentsSectionProps {
  attachments: any[];
  isLoading: boolean;
  isEditing: boolean;
  onUpload: (file: string, fileName: string) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
  onRename?: (attachmentId: string, newFileName: string) => Promise<void>;
  onOpen?: () => void;
  currentUserId?: string;
  /** "card" renders inside the premium ticket-detail card shell. */
  chrome?: "default" | "card";
}

export default function AttachmentsSection({
  attachments,
  isLoading,
  isEditing,
  onUpload,
  onDelete,
  onRename,
  onOpen,
  currentUserId,
  chrome = "default",
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

  const handleRename = async (attachmentId: string, newFileName: string) => {
    if (!onRename) return;
    try {
      await onRename(attachmentId, newFileName);
      message.success("Attachment renamed successfully");
    } catch (error) {
      console.error("Failed to rename attachment:", error);
      message.error("Failed to rename attachment");
    }
  };

  const uploader = !isEditing ? (
    <AttachmentUploader onUpload={handleUpload} maxSize={5} disabled={isEditing} />
  ) : null;

  const compactUploader = !isEditing ? (
    <AttachmentUploader
      onUpload={handleUpload}
      maxSize={5}
      disabled={isEditing}
      label="Add file"
      style={{ height: 28, fontSize: 12 }}
    />
  ) : null;

  const list = (
    <AttachmentList
      attachments={attachments}
      onDelete={handleDelete}
      onRename={handleRename}
      onOpen={onOpen}
      currentUserId={currentUserId}
      loading={isLoading}
    />
  );

  if (chrome === "card") {
    return (
      <SectionCard
        title="Attachments"
        icon={<Paperclip size={13} strokeWidth={2} />}
        count={attachments.length}
        action={compactUploader}
      >
        {attachments.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Paperclip size={20} strokeWidth={1.6} />}
            title="No attachments"
            hint="Drop specs, screenshots or logs here to keep them with the ticket."
          />
        ) : (
          list
        )}
      </SectionCard>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={5} style={{ fontSize: 13, margin: 0, color: 'var(--text-primary)' }}>
          Attachments
          {attachments.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 6 }}>
              • {attachments.length} files
            </span>
          )}
        </Typography.Title>

        {uploader}
      </div>

      <div style={{ padding: '0 4px' }}>{list}</div>
    </div>
  );
}
