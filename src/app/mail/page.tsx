
"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Layout, Menu, Typography, Button, Space, Avatar, List, Divider, Empty, Spin, Input, Drawer, Badge, Modal, Form, message, Select, Popconfirm, Checkbox, Segmented, DatePicker, Upload } from "antd";
import axios from "axios";
import { apiClient } from "@/lib/axios";
import {
  MailOutlined,
  SyncOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SearchOutlined,
  EditOutlined,
  InboxOutlined,
  SendOutlined,
  FileTextOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FolderOutlined,
  CloseOutlined,
  RollbackOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  CaretDownOutlined,
  EyeOutlined,
  UndoOutlined
} from "@ant-design/icons";
import { useMail, useMailThreads, useThreadMessages, useMailStatus, useMailContacts } from "@/hooks/useMail";
import { MailService, MailMessage } from "@/services/mailService";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TiptapEditor from "@/components/common/TiptapEditor";
import JSZip from "jszip";
import { saveAs } from "file-saver";

dayjs.extend(relativeTime);

const { Sider, Content, Header } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function MailPage() {
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [filter, setFilter] = useState<'ALL' | 'READ' | 'UNREAD' | 'HAS_ATTACHMENTS' | 'NO_ATTACHMENTS'>('ALL');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: threads = [], isLoading: threadsLoading } = useMailThreads(selectedFolder, filter, debouncedSearch);
  const { data: messages = [], isLoading: messagesLoading } = useThreadMessages(selectedThreadId);
  const { data: mailStatus } = useMailStatus();
  const { data: contacts = [] } = useMailContacts();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    syncMail, isSyncing,
    sendMessage, isSending,
    saveDraft, isSavingDraft,
    sendDraft,
    uploadAttachment, isUploading,
    deleteThread, deleteThreads, isDeletingThreads, restoreThread, bulkRestoreThreads, isRestoringThreads, archiveThread, bulkArchiveThreads, isArchivingThreads, bulkDestroyThreads, isDestroyingThreads, emptyTrash, isEmptyingTrash, markAsRead
  } = useMail();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [composeVisible, setComposeVisible] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const [quickReply, setQuickReply] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [inlinePreview, setInlinePreview] = useState<{ url: string, name: string, type: string } | null>(null);

  const downloadAsZip = async (attachments: any[]) => {
    const zip = new JSZip();
    let filesAdded = 0;

    const promises = attachments.map(async (att) => {
      try {
        // Use backend proxy to bypass CORS
        const proxyUrl = `/api/mail/attachments/download?url=${encodeURIComponent(att.downloadUrl)}&filename=${encodeURIComponent(att.fileName)}`;
        const response = await apiClient.get(proxyUrl, { responseType: 'blob' });
        zip.file(att.fileName, response.data);
        filesAdded++;
      } catch (error) {
        console.error(`Failed to download ${att.fileName}:`, error);
      }
    });

    await Promise.all(promises);

    if (filesAdded === 0) {
      message.error("Could not download any attachments for the ZIP");
      return;
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "attachments.zip");
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <FileOutlined />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return <FilePdfOutlined />;
      case 'doc':
      case 'docx':
      case 'rtf':
      case 'odt': return <FileWordOutlined />;
      case 'xls':
      case 'xlsx':
      case 'csv': return <FileExcelOutlined />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp': return <FileImageOutlined />;
      default: return <FileOutlined />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const previewAttachment = async (att: any) => {
    const isPdf = (att.mimeType === 'application/pdf' || att.contentType === 'application/pdf' || att.fileName?.toLowerCase().endsWith('.pdf'));

    try {
      // Use backend proxy with authenticated apiClient to fetch blob
      const proxyUrl = `/api/mail/attachments/download?url=${encodeURIComponent(att.downloadUrl)}&filename=${encodeURIComponent(att.fileName)}&mode=inline`;
      const response = await apiClient.get(proxyUrl, { responseType: 'blob' });

      // Create a local object URL for the blob
      const blob = new Blob([response.data], { type: isPdf ? 'application/pdf' : (att.mimeType || att.contentType || 'application/octet-stream') });
      const blobUrl = URL.createObjectURL(blob);

      setInlinePreview({
        url: blobUrl,
        name: att.fileName,
        type: isPdf ? 'application/pdf' : (att.mimeType || att.contentType || "")
      });
    } catch (error) {
      console.error("Failed to preview attachment:", error);
      message.error("Could not load preview");
    }
  };

  useEffect(() => {
    setSelectedThreadIds([]);
  }, [selectedFolder]);

  useEffect(() => {
    if (selectedThreadId) {
      if (selectedFolder === "DRAFTS") {
        openDraft(selectedThreadId);
      } else {
        setDrawerVisible(true);
      }
    }
  }, [selectedThreadId]);

  const openDraft = async (threadId: string) => {
    try {
      const data = await MailService.getThreadMessages(threadId);
      const msgs = data?.data || data || [];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg) {
        form.setFieldsValue({
          to: lastMsg.toEmails || [],
          cc: lastMsg.ccEmails || [],
          bcc: lastMsg.bccEmails || [],
          subject: lastMsg.subject || "",
          body: lastMsg.bodyText || lastMsg.bodyHtml || ""
        });
        setCurrentDraftId(lastMsg.id);
        setComposeVisible(true);
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
      message.error("Failed to load draft");
    }
  };

  const selectedThread = threads.find((t: any) => t.id === selectedThreadId);

  const folderItems = [
    { key: "INBOX", icon: <InboxOutlined />, label: "Inbox", count: selectedFolder === "INBOX" ? threads.length : 0 },
    { key: "SENT", icon: <SendOutlined />, label: "Sent", count: selectedFolder === "SENT" ? threads.length : 0 },
    { key: "DRAFTS", icon: <FileTextOutlined />, label: "Drafts", count: selectedFolder === "DRAFTS" ? threads.length : 0 },
    { key: "SPAM", icon: <ExclamationCircleOutlined />, label: "Spam", count: selectedFolder === "SPAM" ? threads.length : 0 },
    { key: "TRASH", icon: <DeleteOutlined />, label: "Trash", count: selectedFolder === "TRASH" ? threads.length : 0 },
    { key: "ARCHIVE", icon: <FolderOutlined />, label: "Archive", count: selectedFolder === "ARCHIVE" ? threads.length : 0 },
  ];

  return (
    <MainLayout>
      <Layout style={{ height: "calc(100vh - 64px)", background: "#fff" }}>
        {/* Header Section */}
        <Header style={{
          background: "#fff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f0f0f0",
          height: "64px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <MailOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0 }}>Mail</Title>
          </div>

          <Input
            placeholder="Search mail..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            style={{ width: "40%", borderRadius: "8px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />

          <Space size="middle">
            {selectedFolder === "TRASH" && threads.length > 0 && (
              <Popconfirm
                title="Empty Trash?"
                description="All conversations in Trash will be permanently deleted. This action cannot be undone."
                onConfirm={async () => {
                  const res = await emptyTrash();
                  if (res.success) {
                    message.success("Trash emptied");
                    syncMail();
                  }
                }}
                okText="Empty Trash"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>Empty Trash</Button>
              </Popconfirm>
            )}
            <Button
              type="text"
              icon={<SyncOutlined spin={isSyncing} />}
              onClick={() => syncMail()}
              disabled={isSyncing}
            />
            <Avatar icon={<UserOutlined />} style={{ cursor: "pointer" }} />
          </Space>
        </Header>

        <Layout>
          {/* Left Sider - Folders and Compose */}
          <Sider width={250} theme="light" style={{ borderRight: "1px solid #f0f0f0" }}>
            <div style={{ padding: "16px" }}>
              <Button
                type="primary"
                icon={<EditOutlined rotate={270} />}
                block
                size="large"
                style={{ borderRadius: "8px", fontWeight: "bold", height: "48px" }}
                onClick={() => {
                  setComposeVisible(true);
                  setCurrentDraftId(null);
                  setTimeout(() => form.resetFields(), 0);
                }}
              >
                Compose
              </Button>
            </div>
            <Menu
              mode="inline"
              selectedKeys={[selectedFolder]}
              onClick={({ key }) => setSelectedFolder(key)}
              style={{ borderRight: 0 }}
              items={folderItems.map(item => ({
                key: item.key,
                icon: item.icon,
                label: (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{item.label}</span>
                    {item.count > 0 && <Badge count={item.count} overflowCount={999} style={{ backgroundColor: "#f5f5f5", color: "#8c8c8c", boxShadow: "none" }} />}
                  </div>
                )
              }))}
            />
          </Sider>

          {/* Center Content - Thread List */}
          <Content style={{ overflow: "auto", background: "#fff" }}>
            <div style={{ padding: "8px 24px", background: "#fff", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Space>
                <Checkbox
                  disabled={threads.length === 0}
                  checked={threads.length > 0 && selectedThreadIds.length === threads.length}
                  indeterminate={selectedThreadIds.length > 0 && selectedThreadIds.length < threads.length}
                  onChange={(e: any) => {
                    if (e.target.checked) {
                      setSelectedThreadIds(threads.map((t: any) => t.id));
                    } else {
                      setSelectedThreadIds([]);
                    }
                  }}
                />
                <Divider type="vertical" />
                <Segmented
                  value={filter}
                  onChange={(val) => setFilter(val as any)}
                  options={[
                    { label: 'All', value: 'ALL' },
                    { label: 'Unread', value: 'UNREAD' },
                    { label: 'Read', value: 'READ' },
                    { label: 'Has Attachment', value: 'HAS_ATTACHMENTS' },
                    { label: 'No Attachment', value: 'NO_ATTACHMENTS' }
                  ]}
                  size="small"
                />
                {selectedThreadIds.length > 0 && (
                  <>
                    <Divider type="vertical" />
                    <Text type="secondary">{selectedThreadIds.length} selected</Text>
                    <Button
                      size="small"
                      type="text"
                      icon={<DeleteOutlined />}
                      danger
                      loading={isDestroyingThreads || isDeletingThreads}
                      onClick={async () => {
                        if (selectedFolder === "TRASH") {
                          await bulkDestroyThreads(selectedThreadIds);
                          message.success("Selected items deleted permanently");
                        } else {
                          await deleteThreads(selectedThreadIds);
                          message.success("Selected items moved to trash");
                        }
                        setSelectedThreadIds([]);
                      }}
                    >
                      {selectedFolder === "TRASH" ? "Delete" : "Move to Trash"}
                    </Button>

                    {(selectedFolder === "TRASH" || selectedFolder === "ARCHIVE") && (
                      <Button
                        size="small"
                        type="text"
                        icon={<UndoOutlined />}
                        loading={isRestoringThreads}
                        onClick={async () => {
                          await bulkRestoreThreads(selectedThreadIds);
                          message.success(selectedFolder === "TRASH" ? "Selected items restored to inbox" : "Selected items moved back to inbox");
                          setSelectedThreadIds([]);
                        }}
                      >
                        {selectedFolder === "TRASH" ? "Restore" : "Move to Inbox"}
                      </Button>
                    )}

                    {selectedFolder !== "ARCHIVE" && (
                      <Button
                        size="small"
                        type="text"
                        icon={<FolderOutlined />}
                        loading={isArchivingThreads}
                        onClick={async () => {
                          await bulkArchiveThreads(selectedThreadIds);
                          message.success("Selected items archived");
                          setSelectedThreadIds([]);
                        }}
                      >
                        Archive
                      </Button>
                    )}
                  </>
                )}
              </Space>
            </div>
            {threadsLoading && !isSyncing ? (
              <div style={{ padding: 40, textAlign: "center" }}><Spin size="large" /></div>
            ) : (
              <List
                className="mail-thread-list"
                style={{ padding: "8px" }}
                dataSource={threads}
                renderItem={(item: any) => (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ paddingLeft: "16px" }}>
                      <Checkbox
                        checked={selectedThreadIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedThreadIds(prev => [...prev, item.id]);
                          } else {
                            setSelectedThreadIds(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                      />
                    </div>
                    <List.Item
                      onClick={() => {
                        setSelectedThreadId(item.id);
                        if (!item.isRead) {
                          markAsRead(item.id);
                        }
                      }}
                      style={{
                        flex: 1,
                        cursor: "pointer",
                        padding: "16px 20px",
                        margin: "4px 8px",
                        borderRadius: "8px",
                        background: selectedThreadId === item.id ? "#f0f7ff" : "#fff",
                        border: "1px solid #f0f0f0",
                        transition: "all 0.3s",
                        boxShadow: selectedThreadId === item.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
                      }}
                    >
                      <List.Item.Meta
                        avatar={<Avatar size="large" icon={<UserOutlined />} />}
                        title={
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text strong ellipsis style={{ fontSize: "15px" }}>
                              {selectedFolder === 'SENT' ? (item.toEmails?.[0] || 'Unknown Recipient') : (item.fromAddress || 'Unknown Sender')}
                            </Text>
                            <Space size={4}>
                              {item.hasAttachments && <PaperClipOutlined style={{ fontSize: "14px", color: "rgba(0,0,0,0.45)" }} />}
                              <Text type="secondary" style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                                {dayjs(item.lastMessageAt).format("MMM D")}
                              </Text>
                            </Space>
                          </div>
                        }
                        description={
                          <div style={{ marginTop: "2px" }}>
                            <Text strong={!item.isRead} style={{ display: "block", color: "var(--ant-text-color)", fontSize: "14px", marginBottom: "2px" }}>
                              {item.subject || "(No Subject)"}
                            </Text>
                            <Paragraph ellipsis={{ rows: 1 }} type="secondary" style={{ marginBottom: 0, fontSize: "13px" }}>
                              {item.snippet || "No preview available"}
                            </Paragraph>
                            {selectedFolder === 'SENT' && item.toEmails && item.toEmails.length > 1 && (
                              <Text type="secondary" style={{ fontSize: "11px" }}>
                                + {item.toEmails.length - 1} more
                              </Text>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  </div>
                )}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{ color: "#8c8c8c" }}>
                          No conversations found in {folderItems.find((f) => f.key === selectedFolder)?.label}
                        </span>
                      }
                    />
                  )
                }}
              />
            )}
          </Content>
        </Layout>

        {/* Right Drawer - Message Details */}
        <Drawer
          title={selectedThread?.subject || "No Subject"}
          placement="right"
          width={650}
          onClose={() => {
            setDrawerVisible(false);
            setSelectedThreadId(null);
            setInlinePreview(null);
          }}
          open={drawerVisible}
          extra={
            <Space>
              {inlinePreview ? (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setInlinePreview(null)}
                >
                  Back to Messages
                </Button>
              ) : (
                <>
                  {selectedFolder === "TRASH" && (
                    <Button
                      icon={<RollbackOutlined />}
                      onClick={async () => {
                        if (selectedThreadId) {
                          await restoreThread(selectedThreadId);
                          message.success("Thread restored to Inbox");
                          setDrawerVisible(false);
                          setSelectedThreadId(null);
                        }
                      }}
                    >
                      Restore
                    </Button>
                  )}
                  {selectedFolder !== "ARCHIVE" && selectedFolder !== "TRASH" && (
                    <Button
                      icon={<FolderOutlined />}
                      onClick={async () => {
                        if (selectedThreadId) {
                          await archiveThread(selectedThreadId);
                          message.success("Thread archived");
                          setDrawerVisible(false);
                          setSelectedThreadId(null);
                        }
                      }}
                    >
                      Archive
                    </Button>
                  )}
                  <Popconfirm
                    title={selectedFolder === "TRASH" ? "Permanently delete?" : "Move to trash?"}
                    description={selectedFolder === "TRASH" ? "This action cannot be undone." : "You can restore it later from the Trash folder."}
                    onConfirm={async () => {
                      if (selectedThreadId) {
                        await deleteThread(selectedThreadId);
                        message.success(selectedFolder === "TRASH" ? "Thread permanently deleted" : "Thread moved to trash");
                        setDrawerVisible(false);
                        setSelectedThreadId(null);
                      }
                    }}
                    okText="Delete"
                    cancelText="Cancel"
                  >
                    <Button icon={<DeleteOutlined />} type="text" danger />
                  </Popconfirm>
                  <Button icon={<ExclamationCircleOutlined />} type="text" />
                </>
              )}
            </Space>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {inlinePreview ? (
              <div style={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: '12px' }}>
                  <Text strong>{inlinePreview.name}</Text>
                </div>
                <div style={{ flex: 1, width: '100%', background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden' }}>
                  {inlinePreview.type.startsWith('image/') ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                      <img src={inlinePreview.url} alt={inlinePreview.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : inlinePreview.type === 'application/pdf' ? (
                    <iframe
                      src={inlinePreview.type === 'application/pdf' ? `${inlinePreview.url}#toolbar=0&navpanes=0&scrollbar=1` : inlinePreview.url}
                      title={inlinePreview.name}
                      style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <p>Preview not available for this file type.</p>
                      <Button type="primary" href={inlinePreview.url} download={inlinePreview.name}>
                        Download to View
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflow: "auto", paddingBottom: "20px" }}>
                  <List
                    dataSource={messages}
                    renderItem={(msg: any) => (
                      <div style={{
                        marginBottom: "24px",
                        padding: "20px",
                        background: "#fff",
                        borderRadius: "12px",
                        border: "1px solid #f0f0f0"
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 20 }}>
                          <Avatar size="large" icon={<UserOutlined />} style={{ marginRight: 12, marginTop: 4, background: "#f0f0f0", color: "#8c8c8c" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Space direction="vertical" size={0}>
                                <Text strong style={{ fontSize: "15px", color: "rgba(0, 0, 0, 0.85)" }}>{msg.fromEmail}</Text>
                                <Text style={{ fontSize: "12px", color: "rgba(0, 0, 0, 0.45)" }}>
                                  to {Array.isArray(msg.toEmails) ? msg.toEmails.join(", ") : msg.toEmails}
                                </Text>
                              </Space>
                              <Space>
                                <Text style={{ fontSize: "12px", color: "rgba(0, 0, 0, 0.45)" }}>
                                  {dayjs(msg.receivedAt).format("MMM D, YYYY [at] h:mm A")}
                                </Text>
                                <Button
                                  type="text"
                                  icon={<RollbackOutlined />}
                                  size="small"
                                  style={{ color: "rgba(0, 0, 0, 0.45)" }}
                                  onClick={() => {
                                    // Scroll to quick reply and focus
                                    const textArea = document.getElementById('quick-reply-textarea');
                                    if (textArea) textArea.focus();
                                  }}
                                >
                                  Reply
                                </Button>
                              </Space>
                            </div>
                          </div>
                        </div>

                        <div className="mail-body" style={{
                          background: "transparent",
                          padding: "0 8px",
                          lineHeight: "1.6",
                          color: "rgba(0, 0, 0, 0.85)"
                        }}>
                          {msg.bodyHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: msg.bodyHtml }} />
                          ) : (
                            <Paragraph style={{ whiteSpace: "pre-wrap", color: "inherit" }}>{msg.bodyText}</Paragraph>
                          )}
                        </div>

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div style={{ marginTop: 20, padding: "8px 0" }}>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: "8px" }}>
                              <CaretDownOutlined style={{ fontSize: "10px", color: "rgba(0, 0, 0, 0.45)" }} />
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(0, 0, 0, 0.85)", display: "flex", alignItems: "center" }}>
                                {msg.attachments.length} Attachment(s)
                              </span>
                              <span style={{ color: "rgba(0, 0, 0, 0.45)", fontSize: "14px" }}>•</span>
                              <Button
                                type="link"
                                size="small"
                                onClick={() => downloadAsZip(msg.attachments)}
                                style={{ padding: 0, color: "#fa541c", height: "auto", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center" }}
                              >
                                Download as Zip
                              </Button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                              {msg.attachments.map((att: any) => (
                                <div
                                  key={att.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "320px",
                                    background: "#f9f9f9",
                                    borderRadius: "8px",
                                    padding: "12px",
                                    color: "rgba(0, 0, 0, 0.85)",
                                    border: "1px solid #f0f0f0"
                                  }}
                                >
                                  <div style={{
                                    width: "48px",
                                    height: "48px",
                                    background: "#fa541c",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: "12px",
                                    fontSize: "24px",
                                    color: "#fff",
                                    flexShrink: 0
                                  }}>
                                    {getFileIcon(att.fileName)}
                                  </div>
                                  <div style={{ flex: 1, overflow: "hidden" }}>
                                    <div style={{
                                      fontSize: "14px",
                                      fontWeight: 500,
                                      color: "rgba(0, 0, 0, 0.85)",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      marginBottom: "4px"
                                    }}>
                                      {att.fileName}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", color: "rgba(0, 0, 0, 0.45)", fontSize: "12px" }}>
                                      <span>{formatFileSize(att.size)}</span>
                                      <span style={{ margin: "0 6px" }}>•</span>
                                      <Space size={12}>
                                        <Button
                                          type="text"
                                          size="small"
                                          onClick={() => previewAttachment(att)}
                                          style={{ color: "rgba(0, 0, 0, 0.45)", display: "flex", alignItems: "center", padding: 0 }}
                                        >
                                          <EyeOutlined style={{ fontSize: "16px" }} />
                                        </Button>
                                        <a
                                          href={`/api/mail/attachments/download?url=${encodeURIComponent(att.downloadUrl)}&filename=${encodeURIComponent(att.fileName)}`}
                                          download={att.fileName}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ color: "rgba(0, 0, 0, 0.45)", display: "flex", alignItems: "center" }}
                                        >
                                          <DownloadOutlined style={{ fontSize: "16px" }} />
                                        </a>
                                      </Space>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <Divider />
                      </div>
                    )}
                  />
                </div>

                {/* Quick Reply Area */}
                <div style={{
                  padding: "20px 0 0 0",
                  borderTop: "1px solid #f0f0f0",
                  background: "#fff"
                }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <Avatar icon={<UserOutlined />} />
                    <div style={{ flex: 1 }}>
                      <TextArea
                        id="quick-reply-textarea"
                        placeholder="Write a reply..."
                        autoSize={{ minRows: 2, maxRows: 10 }}
                        value={quickReply}
                        onChange={(e) => setQuickReply(e.target.value)}
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #d9d9d9",
                          padding: "8px 12px"
                        }}
                      />
                      <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          loading={isSendingReply}
                          disabled={!quickReply.trim()}
                          onClick={async () => {
                            const lastMsg = messages[messages.length - 1];
                            if (!lastMsg) return;

                            setIsSendingReply(true);
                            const result = await sendMessage({
                              to: [lastMsg.fromEmail],
                              subject: lastMsg.subject.startsWith("Re:") ? lastMsg.subject : `Re: ${lastMsg.subject}`,
                              body: quickReply,
                              threadId: selectedThreadId || undefined
                            });

                            if (result) {
                              message.success("Reply sent");
                              setQuickReply("");
                              // Refresh messages to show the new one
                              if (selectedThreadId) {
                                await syncMail();
                              }
                            } else {
                              message.error("Failed to send reply");
                            }
                            setIsSendingReply(false);
                          }}
                        >
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Drawer>

        {/* Compose Drawer */}
        <Drawer
          title={<div style={{ padding: "4px 0" }}><Title level={4} style={{ margin: 0 }}>New Message</Title></div>}
          placement="right"
          width={750}
          onClose={() => {
            setComposeVisible(false);
            setCurrentDraftId(null);
            setSelectedThreadId(null);
          }}
          open={composeVisible}
          extra={
            <Space>
              <Button
                onClick={async () => {
                  const values = form.getFieldsValue();
                  // Clean up attachments: only send the metadata needed by the backend
                  const cleanedAttachments = values.attachments?.map((file: any) => ({
                    filename: file.name || file.fileName,
                    url: file.url || file.response?.fileUrl || file.response?.url,
                    size: file.size,
                    contentType: file.type || file.contentType
                  })).filter((a: any) => a.url);

                  const draftData = {
                    ...values,
                    to: values.to || [],
                    attachments: cleanedAttachments,
                    id: currentDraftId || undefined
                  };
                  const result = await saveDraft(draftData);
                  if (result) {
                    message.success("Draft saved");
                    setComposeVisible(false);
                    setCurrentDraftId(null);
                    setSelectedThreadId(null);
                  }
                }}
                loading={isSavingDraft}
              >
                Save as Draft
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={isSending}
                icon={<SendOutlined />}
                style={{ borderRadius: "8px", padding: "0 24px" }}
              >
                Send
              </Button>
            </Space>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              // Clean up attachments: only send the metadata needed by the backend
              const cleanedAttachments = values.attachments?.map((file: any) => ({
                filename: file.name || file.fileName,
                url: file.url || file.response?.fileUrl || file.response?.url,
                size: file.size,
                contentType: file.type || file.contentType
              })).filter((a: any) => a.url);

              const mailData = {
                ...values,
                to: values.to || [],
                cc: values.cc || undefined,
                bcc: values.bcc || undefined,
                attachments: cleanedAttachments,
                scheduledAt: values.scheduledAt?.toISOString() || null
              };

              let result;
              if (currentDraftId) {
                await saveDraft({ ...mailData, id: currentDraftId });
                result = await sendDraft(currentDraftId);
              } else {
                result = await sendMessage(mailData);
              }

              if (result) {
                message.success(mailData.scheduledAt ? "Email scheduled successfully" : "Email sent successfully");
                setComposeVisible(false);
                setCurrentDraftId(null);
                setSelectedThreadId(null);
                form.resetFields();
              } else {
                message.error("Failed to process email");
              }
            }}
            initialValues={{ to: [], cc: [], bcc: [], subject: "", body: "" }}
          >
            <Form.Item
              label={<Text type="secondary">From</Text>}
              style={{ marginBottom: "12px" }}
            >
              {!mailStatus ? (
                <div style={{ padding: "4px 11px", borderBottom: "1px solid #f0f0f0" }}>
                  <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>Loading...</Text>
                </div>
              ) : (
                <Input
                  value={mailStatus.connectedEmail || "No connected email found"}
                  disabled
                  variant="borderless"
                  style={{ borderBottom: "1px solid #f0f0f0", color: "#262626", fontWeight: 500 }}
                />
              )}
            </Form.Item>

            <Form.Item
              name="to"
              label={<Text type="secondary">To</Text>}
              rules={[{ required: true, message: "Recipient is required" }]}
              style={{ marginBottom: "12px" }}
            >
              <Select
                mode="tags"
                placeholder="Select or type recipient emails"
                tokenSeparators={[',', ' ']}
                options={contacts.map((u: any) => ({ value: u.email || '', label: `${u.name} (${u.email || 'No Email'})` })).filter((u: any) => u.value)}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                variant="borderless"
                style={{ width: '100%', borderBottom: '1px solid #d9d9d9', borderRadius: 0, padding: 0 }}
                popupMatchSelectWidth={false}
              />
            </Form.Item>

            <Form.Item
              name="cc"
              label={<Text type="secondary">Cc</Text>}
              style={{ marginBottom: "12px" }}
            >
              <Select
                mode="tags"
                placeholder="Select or type secondary recipient emails"
                tokenSeparators={[',', ' ']}
                options={contacts.map((u: any) => ({ value: u.email || '', label: `${u.name} (${u.email || 'No Email'})` })).filter((u: any) => u.value)}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                variant="borderless"
                style={{ width: '100%', borderBottom: '1px solid #d9d9d9', borderRadius: 0, padding: 0 }}
                popupMatchSelectWidth={false}
              />
            </Form.Item>

            <Form.Item
              name="bcc"
              label={<Text type="secondary">Bcc</Text>}
              style={{ marginBottom: "12px" }}
            >
              <Select
                mode="tags"
                placeholder="Select or type blind tertiary recipient emails"
                tokenSeparators={[',', ' ']}
                options={contacts.map((u: any) => ({ value: u.email || '', label: `${u.name} (${u.email || 'No Email'})` })).filter((u: any) => u.value)}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                variant="borderless"
                style={{ width: '100%', borderBottom: '1px solid #d9d9d9', borderRadius: 0, padding: 0 }}
                popupMatchSelectWidth={false}
              />
            </Form.Item>

            <Form.Item
              name="subject"
              label={<Text type="secondary">Subject</Text>}
              rules={[{ required: true, message: "Subject is required" }]}
              style={{ marginBottom: "16px" }}
            >
              <Input placeholder="Enter subject" variant="borderless" style={{ borderBottom: "1px solid #f0f0f0", fontWeight: 500 }} />
            </Form.Item>

            <Form.Item
              name="body"
              rules={[{ required: true, message: "Message body is required" }]}
              style={{ marginTop: "24px" }}
            >
              <TiptapEditor
                content={form.getFieldValue('body')}
                onChange={(html) => form.setFieldsValue({ body: html })}
                minHeight={300}
              />
            </Form.Item>

            <Divider />

            <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Form.Item
                name="attachments"
                valuePropName="fileList"
                getValueFromEvent={(e: any) => {
                  if (Array.isArray(e)) return e;
                  return e?.fileList;
                }}
              >
                <Upload
                  customRequest={async ({ file, onSuccess, onError }: any) => {
                    try {
                      const reader = new FileReader();
                      reader.onload = async () => {
                        try {
                          const response = await uploadAttachment({
                            file: reader.result,
                            fileName: file.name
                          });
                          onSuccess(response);
                        } catch (err) {
                          onError(err);
                        }
                      };
                      reader.onerror = (err) => onError(err);
                      reader.readAsDataURL(file);
                    } catch (err) {
                      onError(err);
                    }
                  }}
                  multiple
                  listType="text"
                >
                  <Button icon={<PaperClipOutlined />}>Attach Files</Button>
                </Upload>
              </Form.Item>

              <Form.Item
                name="scheduledAt"
                label={<Text type="secondary">Send Later</Text>}
              >
                <DatePicker
                  showTime
                  placeholder="Schedule time"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Space>
          </Form>
        </Drawer>
      </Layout>
    </MainLayout >
  );
}