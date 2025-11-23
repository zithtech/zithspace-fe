"use client";

import React from "react";
import { List, Button, Tag, Space, Typography, Avatar } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileZipOutlined,
  FileOutlined,
  VideoCameraOutlined,
  AudioOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    workEmail: string;
    position: string;
  };
}

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete: (attachmentId: string) => Promise<void>;
  currentUserId?: string;
  loading?: boolean;
}

export default function AttachmentList({
  attachments,
  onDelete,
  currentUserId,
  loading = false,
}: AttachmentListProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();

    // Images
    if (type.includes("image")) {
      return <FileImageOutlined style={{ fontSize: "24px", color: "#52c41a" }} />;
    }
    // PDFs
    if (type.includes("pdf")) {
      return <FilePdfOutlined style={{ fontSize: "24px", color: "#ff4d4f" }} />;
    }
    // Word documents
    if (type.includes("word") || type.includes("msword") || type.includes("document")) {
      return <FileWordOutlined style={{ fontSize: "24px", color: "#1890ff" }} />;
    }
    // Excel spreadsheets
    if (type.includes("excel") || type.includes("spreadsheet") || type.includes("sheet")) {
      return <FileExcelOutlined style={{ fontSize: "24px", color: "#52c41a" }} />;
    }
    // Text files
    if (type.includes("text") || type.includes("plain")) {
      return <FileTextOutlined style={{ fontSize: "24px", color: "#8c8c8c" }} />;
    }
    // Archives
    if (type.includes("zip") || type.includes("rar") || type.includes("7z") || type.includes("tar") || type.includes("gz")) {
      return <FileZipOutlined style={{ fontSize: "24px", color: "#fa8c16" }} />;
    }
    // Videos
    if (type.includes("video")) {
      return <VideoCameraOutlined style={{ fontSize: "24px", color: "#722ed1" }} />;
    }
    // Audio
    if (type.includes("audio")) {
      return <AudioOutlined style={{ fontSize: "24px", color: "#eb2f96" }} />;
    }
    // Default
    return <FileOutlined style={{ fontSize: "24px", color: "#8c8c8c" }} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      setDeletingId(attachmentId);
      await onDelete(attachmentId);
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    // Open in new tab for download
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (attachments.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          color: "#999",
          padding: "40px 20px",
          background: "#fafafa",
          borderRadius: "8px",
        }}
      >
        <FileOutlined style={{ fontSize: "48px", marginBottom: "16px", color: "#d9d9d9" }} />
        <div>No attachments yet</div>
      </div>
    );
  }

  return (
    <List
      loading={loading}
      dataSource={attachments}
      renderItem={(attachment) => (
        <List.Item
          actions={[
            <Button
              key="download"
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(attachment.fileUrl, attachment.fileName)}
            >
              Download
            </Button>,
            <Button
              key="delete"
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === attachment.id}
              onClick={() => handleDelete(attachment.id)}
            >
              Delete
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={getFileIcon(attachment.fileType)}
            title={
              <Space>
                <Text strong style={{ fontSize: "14px" }}>
                  {attachment.fileName}
                </Text>
                <Tag color="blue">{formatFileSize(attachment.fileSize)}</Tag>
              </Space>
            }
            description={
              <Space direction="vertical" size={0}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Uploaded by {attachment.uploadedBy.name} ({attachment.uploadedBy.position})
                </Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {dayjs(attachment.uploadedAt).format("MMMM DD, YYYY HH:mm")}
                </Text>
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
}
