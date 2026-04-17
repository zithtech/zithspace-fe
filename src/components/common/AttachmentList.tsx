"use client";

import React from "react";
import { Button, Tag, Space, Typography, Tooltip, Row, Col, Input } from "antd";
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
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
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
  onRename?: (attachmentId: string, newFileName: string) => Promise<void>;
  currentUserId?: string;
  loading?: boolean;
}

export default function AttachmentList({
  attachments,
  onDelete,
  onRename,
  currentUserId,
  loading = false,
}: AttachmentListProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState<string>("");
  const [renamingId, setRenamingId] = React.useState<string | null>(null);

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    const iconStyle = { fontSize: "20px" };

    if (type.includes("image")) {
      return { icon: <FileImageOutlined style={iconStyle} />, color: "#52c41a", bg: "#f6ffed" };
    }
    if (type.includes("pdf")) {
      return { icon: <FilePdfOutlined style={iconStyle} />, color: "#ff4d4f", bg: "#fff1f0" };
    }
    if (type.includes("word") || type.includes("msword") || type.includes("document")) {
      return { icon: <FileWordOutlined style={iconStyle} />, color: "#1890ff", bg: "#e6f7ff" };
    }
    if (type.includes("excel") || type.includes("spreadsheet") || type.includes("sheet")) {
      return { icon: <FileExcelOutlined style={iconStyle} />, color: "#52c41a", bg: "#f6ffed" };
    }
    if (type.includes("text") || type.includes("plain")) {
      return { icon: <FileTextOutlined style={iconStyle} />, color: "#8c8c8c", bg: "#f5f5f5" };
    }
    if (type.includes("zip") || type.includes("rar") || type.includes("7z") || type.includes("tar") || type.includes("gz")) {
      return { icon: <FileZipOutlined style={iconStyle} />, color: "#fa8c16", bg: "#fff7e6" };
    }
    if (type.includes("video")) {
      return { icon: <VideoCameraOutlined style={iconStyle} />, color: "#722ed1", bg: "#f9f0ff" };
    }
    if (type.includes("audio")) {
      return { icon: <AudioOutlined style={iconStyle} />, color: "#eb2f96", bg: "#fff0f6" };
    }
    return { icon: <FileOutlined style={iconStyle} />, color: "#8c8c8c", bg: "#f5f5f5" };
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

  const startEditing = (attachment: Attachment) => {
    setEditingId(attachment.id);
    setEditingName(attachment.fileName);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleRename = async (attachmentId: string) => {
    if (!onRename || !editingName.trim()) return;
    
    try {
      setRenamingId(attachmentId);
      await onRename(attachmentId, editingName.trim());
      setEditingId(null);
    } catch (error) {
      console.error("Failed to rename attachment:", error);
    } finally {
      setRenamingId(null);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
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
      <div style={{
        textAlign: "center",
        padding: "48px 20px",
        background: "var(--bg-secondary)",
        borderRadius: "12px",
        border: "1px dashed var(--border-color)"
      }}>
        <FileOutlined style={{ fontSize: "40px", marginBottom: "12px", color: "#bfbfbf" }} />
        <div style={{ color: "#8c8c8c", fontSize: "14px" }}>No attachments attached to this ticket</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "4px 0" }}>
      <Row gutter={[12, 12]}>
        {attachments.map((attachment) => {
          const { icon, color, bg } = getFileIcon(attachment.fileType);
          
          return (
            <Col xs={24} sm={12} key={attachment.id}>
              <div
                className="attachment-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  transition: "all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "default"
                }}
              >
                {/* File Icon Block */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: color,
                  flexShrink: 0
                }}>
                  {icon}
                </div>

                {/* File Info Block */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === attachment.id ? (
                    <Space size={4} style={{ width: "100%" }}>
                      <Input
                        size="small"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onPressEnter={() => handleRename(attachment.id)}
                        autoFocus
                        style={{ fontSize: "12px", borderRadius: 4 }}
                      />
                      <Button
                        size="small"
                        type="text"
                        icon={<CheckOutlined style={{ color: "#52c41a", fontSize: 12 }} />}
                        onClick={() => handleRename(attachment.id)}
                        loading={renamingId === attachment.id}
                      />
                      <Button
                        size="small"
                        type="text"
                        icon={<CloseOutlined style={{ color: "#ff4d4f", fontSize: 12 }} />}
                        onClick={cancelEditing}
                      />
                    </Space>
                  ) : (
                    <Tooltip title={attachment.fileName}>
                      <Text strong style={{ 
                        fontSize: "13px", 
                        display: "block", 
                        marginBottom: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#262626"
                      }}>
                        {attachment.fileName}
                      </Text>
                    </Tooltip>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      {formatFileSize(attachment.fileSize)}
                    </Text>
                    <span style={{ color: "#d9d9d9" }}>•</span>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      {dayjs(attachment.uploadedAt).format("MMM DD")}
                    </Text>
                  </div>
                </div>

                {/* Hover Actions Overlay */}
                <div className="attachment-actions" style={{
                  display: "flex",
                  gap: 4,
                  opacity: 0,
                  transition: "opacity 0.2s",
                  marginLeft: 8
                }}>
                  <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined style={{ fontSize: 13, color: "#1890ff" }} />}
                    onClick={() => handleDownload(attachment.fileUrl, attachment.fileName)}
                    style={{ background: "#e6f7ff", borderRadius: 6 }}
                  />
                  {onRename && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined style={{ fontSize: 13, color: "#faad14" }} />}
                      onClick={() => startEditing(attachment)}
                      style={{ background: "#fff7e6", borderRadius: 6 }}
                    />
                  )}
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                    loading={deletingId === attachment.id}
                    onClick={() => handleDelete(attachment.id)}
                    style={{ background: "#fff1f0", borderRadius: 6 }}
                  />
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      <style jsx global>{`
        .attachment-card:hover {
          border-color: #1890ff40 !important;
          background-color: var(--bg-secondary) !important;
          filter: brightness(0.98);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
          transform: translateY(-2px);
        }
        .attachment-card:hover .attachment-actions {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
