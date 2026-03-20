"use client";

import React, { useState } from "react";
import { Card, Row, Col, Typography, Space, Button, Spin, Empty, message } from "antd";
import { DeleteOutlined, DownloadOutlined, FileOutlined } from "@ant-design/icons";
import AttachmentUploader from "@/components/common/AttachmentUploader";
import dayjs from "dayjs";

const { Text, Title } = Typography;

export interface AttachmentItem {
  id?: string;
  fileName: string;
  fileUrl: string;       // base64 for new (unsaved) files, R2 URL for saved files
  fileSize?: number;
  fileType: string;
  category: string;
  uploadedAt?: string;
  uploadedBy?: {
    id?: string;
    name: string;
    position?: string;
  };
  isNew?: boolean;       // true if not yet uploaded to R2
}

interface AttachmentSectionProps {
  attachments: AttachmentItem[];
  onAttachmentsChange: (attachments: AttachmentItem[]) => void;
  onDeleteSaved?: (attachmentId: string) => Promise<void>;
  loading?: boolean;
}

const ATTACHMENT_CATEGORIES = [
  { key: "job_description", label: "Job Description Document" },
  { key: "client_requirements", label: "Client Requirement File" },
  { key: "interview_guide", label: "Interview Guide" },
];

export default function AttachmentSection({
  attachments,
  onAttachmentsChange,
  onDeleteSaved,
  loading = false,
}: AttachmentSectionProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleUploadFile = async (category: string, base64File: string, fileName: string) => {
    const newAttachment: AttachmentItem = {
      fileName,
      fileUrl: base64File,
      fileType: fileName.split(".").pop()?.toLowerCase() || "unknown",
      category,
      uploadedAt: new Date().toISOString(),
      isNew: true,
    };

    const updated = [
      ...attachments.filter((a) => a.category !== category),
      newAttachment,
    ];
    onAttachmentsChange(updated);
    message.success(`${fileName} attached successfully`);
  };

  const handleDeleteAttachment = async (attachment: AttachmentItem) => {
    try {
      setDeleting(attachment.id || attachment.category);

      // If it's a saved attachment (has an ID and is not new), delete from backend
      if (!attachment.isNew && attachment.id && onDeleteSaved) {
        await onDeleteSaved(attachment.id);
      }

      const updated = attachments.filter((a) => a.category !== attachment.category);
      onAttachmentsChange(updated);
      message.success("Attachment removed successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      message.error(error.message || "Failed to delete attachment");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    if (fileUrl.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.target = "_blank";
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getAttachmentByCategory = (category: string): AttachmentItem | undefined => {
    return attachments.find((a) => a.category === category);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card title="Attachments" bordered={false} style={{ marginBottom: 24 }}>
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          {ATTACHMENT_CATEGORIES.map((category) => {
            const attachment = getAttachmentByCategory(category.key);

            return (
              <Col xs={24} sm={12} lg={8} key={category.key}>
                <div
                  style={{
                    border: "1px solid #d9d9d9",
                    borderRadius: "8px",
                    padding: "16px",
                    minHeight: "200px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Title level={5} style={{ marginBottom: 16 }}>
                    {category.label}
                  </Title>

                  {attachment ? (
                    <Space direction="vertical" style={{ flex: 1, width: "100%" }} size="small">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flex: 1,
                        }}
                      >
                        <FileOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            ellipsis
                            title={attachment.fileName}
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              display: "block",
                            }}
                          >
                            {attachment.fileName}
                          </Text>
                          {attachment.fileSize && (
                            <Text type="secondary" style={{ fontSize: "11px", display: "block" }}>
                              {formatFileSize(attachment.fileSize)}
                            </Text>
                          )}
                          {attachment.uploadedAt && (
                            <Text type="secondary" style={{ fontSize: "11px", display: "block" }}>
                              {dayjs(attachment.uploadedAt).format("MMM DD, YYYY")}
                            </Text>
                          )}
                          {attachment.isNew && (
                            <Text type="warning" style={{ fontSize: "11px", display: "block" }}>
                              (Not yet saved)
                            </Text>
                          )}
                        </div>
                      </div>

                      <Space size="small" style={{ width: "100%" }}>
                        {!attachment.isNew && (
                          <Button
                            type="link"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(attachment.fileUrl, attachment.fileName)}
                          >
                            Download
                          </Button>
                        )}
                        <Button
                          type="link"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          loading={deleting === (attachment.id || attachment.category)}
                          onClick={() => handleDeleteAttachment(attachment)}
                        >
                          Delete
                        </Button>
                      </Space>
                    </Space>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No file uploaded"
                        style={{ marginBottom: 16 }}
                      />
                      <AttachmentUploader
                        onUpload={(file: string, fileName: string) =>
                          handleUploadFile(category.key, file, fileName)
                        }
                        accept="*"
                        style={{
                          width: "100%",
                        }}
                      />
                    </div>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
      </Spin>
    </Card>
  );
}
