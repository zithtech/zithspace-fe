
"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Layout, Menu, Typography, Button, Space, Avatar, List, Divider, Empty, Spin, Input, Drawer, Badge, Modal, Form, message, Select, Popconfirm, Checkbox, Segmented, DatePicker, Upload, Popover, Tooltip, Tag } from "antd";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { apiClient } from "@/lib/axios";
import { useRouter } from "next/navigation";
import {
  MailOutlined,
  SyncOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
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
import { useMail, useMailThreads, useThreadMessages, useMailStatus, useMailContacts, useMailUnreadCount } from "@/hooks/useMail";
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

// --- SaaS Design Tokens ---
const TOKENS = {
  primary: '#2563eb', // Indigo 600
  sidebarBg: '#f8fafc', // Slate 50
  border: '#e2e8f0', // Slate 200
  textPrimary: '#0f172a', // Slate 900 (Deepened for premium contrast)
  textSecondary: '#64748b', // Slate 500
  unreadDot: '#3b82f6',
  hover: '#f1f5f9',
  active: '#eff6ff',
  shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
};

// --- Premium UI Helpers ---
const getInitials = (nameOrEmail: string) => {
  if (!nameOrEmail) return '?';
  const clean = nameOrEmail.split('<')[0].replace(/[()]/g, '').trim();
  const parts = clean.split(' ');
  if (parts.length > 1) return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
  return clean[0].toUpperCase();
};

const getAvatarColor = (id: string) => {
  const colors = [
    '#f87171', '#fb923c', '#fbbf24', '#facc15', '#a3e635',
    '#4ade80', '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8',
    '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'
  ];
  let hash = 0;
  if (!id) return colors[0];
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};


const STYLES = `
  .mail-thread-list .ant-list-item {
    transition: all 0.2s ease;
    border: none !important;
    border-bottom: 1px solid ${TOKENS.border} !important;
    margin: 0 !important;
    padding: 12px 20px !important;
    border-radius: 0 !important;
    display: flex !important;
    align-items: center !important;
  }
  .mail-thread-list .ant-list-item-meta {
    align-items: center !important;
  }
  .mail-thread-list .ant-list-item-meta-avatar {
    margin-right: 12px !important;
  }
  .mail-thread-list .ant-list-item:hover {
    background-color: ${TOKENS.hover} !important;
  }
  .mail-thread-list  .active-thread {
    background-color: ${TOKENS.active} !important;
    border-left: 3px solid ${TOKENS.primary} !important;
  }
  .attachment-card-hover:hover {
    border-color: ${TOKENS.primary} !important;
    background-color: #fff !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  .mail-html-content img {
    max-width: 100% !important;
    height: auto !important;
    border-radius: 8px;
  }
  .unread-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${TOKENS.unreadDot};
    display: inline-block;
    margin-right: 8px;
  }
  .user-header-hover:hover {
    background-color: ${TOKENS.hover} !important;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
`;


export default function MailPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [filter, setFilter] = useState<'ALL' | 'READ' | 'UNREAD' | 'HAS_ATTACHMENTS' | 'NO_ATTACHMENTS'>('ALL');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: threadsData = [], isLoading: threadsLoading } = useMailThreads(selectedFolder, filter, debouncedSearch);
  const { data: messages = [], isLoading: messagesLoading } = useThreadMessages(selectedThreadId);
  const { data: mailStatus } = useMailStatus();
  const { data: unreadCount = 0 } = useMailUnreadCount();
  const threads = Array.isArray(threadsData) ? threadsData : [];
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
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [currentDraftThreadId, setCurrentDraftThreadId] = useState<string | null>(null);
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
        const proxyUrl = `/api/mail/attachments/download?url=${encodeURIComponent(att.downloadUrl)}&filename=${encodeURIComponent(att.fileName)}&attachmentId=${encodeURIComponent(att.id)}`;
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

  const downloadAttachment = async (att: any) => {
    try {
      // Use backend proxy with authenticated apiClient to fetch blob
      const proxyUrl = `/api/mail/attachments/download?url=${encodeURIComponent(att.downloadUrl)}&filename=${encodeURIComponent(att.fileName)}&attachmentId=${encodeURIComponent(att.id)}`;
      const response = await apiClient.get(proxyUrl, { responseType: 'blob' });

      // Create a temporary object URL and trigger download
      const blob = new Blob([response.data], { type: att.mimeType || att.contentType || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = att.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download attachment:", error);
      message.error("Could not download attachment");
    }
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
      const proxyUrl = `/api/mail/attachments/download?url=${encodeURIComponent(att.downloadUrl)}&filename=${encodeURIComponent(att.fileName)}&mode=inline&attachmentId=${encodeURIComponent(att.id)}`;
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
          body: lastMsg.bodyHtml || lastMsg.bodyText || ""
        });
        
        // Show Cc/Bcc if they have values
        if (lastMsg.ccEmails && lastMsg.ccEmails.length > 0) setShowCc(true);
        else setShowCc(false);
        if (lastMsg.bccEmails && lastMsg.bccEmails.length > 0) setShowBcc(true);
        else setShowBcc(false);

        // Store the local message id (for save-as-draft updates) and the thread id (for deletion after send)
        setCurrentDraftId(lastMsg.externalId || lastMsg.id);
        setCurrentDraftThreadId(threadId);
        setComposeVisible(true);
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
      message.error("Failed to load draft");
    }
  };

  const selectedThread = threads.find((t: any) => t.id === selectedThreadId);


  const profileCardContent = (
    <div style={{ width: 280, padding: '4px 0' }}>
      {/* Card Header with Gradient */}
      <div style={{
        height: 80,
        background: `linear-gradient(135deg, ${TOKENS.primary} 0%, #1d4ed8 100%)`,
        borderRadius: '12px 12px 0 0',
        position: 'relative',
        marginBottom: 36
      }}>
        <div style={{
          position: 'absolute',
          bottom: -32,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: 4,
          background: '#fff',
          borderRadius: '50%'
        }}>
          <Avatar
            size={64}
            icon={<UserOutlined />}
            style={{
              backgroundColor: TOKENS.primary,
              fontSize: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
        </div>
      </div>

      {/* User Info */}
      <div style={{ textAlign: 'center', padding: '0 16px' }}>
        <Title level={5} style={{ margin: '0 0 2px 0', fontSize: 16 }}>{user?.name}</Title>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>{user?.email}</Text>

        <div style={{
          display: 'inline-flex',
          padding: '2px 10px',
          background: '#eff6ff',
          borderRadius: '20px',
          marginBottom: 12
        }}>
          <Text style={{ fontSize: 11, color: TOKENS.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {user?.role?.replace('_', ' ') || 'User'}
          </Text>
        </div>
      </div>

      <Divider style={{ margin: '4px 0' }} />

      {/* Actions */}
      <div style={{ padding: '8px' }}>
        <Button
          block
          type="text"
          icon={<UserOutlined />}
          style={{ textAlign: 'left', height: 38, borderRadius: 8 }}
          onClick={() => router.push('/profile')}
        >
          View Profile
        </Button>
      </div>
    </div>
  );

  const folderItems = [
    { key: "INBOX", icon: <InboxOutlined />, label: "Inbox", count: selectedFolder === "INBOX" ? threads.length : 0 },
    { key: "SENT", icon: <SendOutlined />, label: "Sent", count: selectedFolder === "SENT" ? threads.length : 0 },
    { key: "DRAFTS", icon: <FileTextOutlined />, label: "Drafts", count: selectedFolder === "DRAFTS" ? threads.length : 0 },
    { key: "SPAM", icon: <ExclamationCircleOutlined />, label: "Spam", count: selectedFolder === "SPAM" ? threads.length : 0 },
    { key: "TRASH", icon: <DeleteOutlined />, label: "Trash", count: selectedFolder === "TRASH" ? threads.length : 0 },
    { key: "ARCHIVE", icon: <FolderOutlined />, label: "Archive", count: selectedFolder === "ARCHIVE" ? threads.length : 0 },
  ];

  return (
    <MainLayout noPadding>
      <style>{STYLES}</style>
      <Layout style={{ height: "calc(100vh - 54px)", background: 'transparent' }}>
        {/* Header Section */}
        <Header style={{
          background: "transparent",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${TOKENS.border}`,
          height: "54px",
          boxShadow: 'none'
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <MailOutlined style={{ fontSize: "20px", color: TOKENS.primary }} />
            </div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Mail
              {mailStatus?.isConnected && mailStatus.provider && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#22c55e', 
                  fontWeight: 500, 
                  background: '#f0fdf4', 
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1px solid #bbf7d0'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
                  {mailStatus.provider === 'GOOGLE' ? 'Google' : 
                   mailStatus.provider === 'ZOHO' ? 'Zoho' : 
                   mailStatus.provider === 'MICROSOFT' ? 'Microsoft' : mailStatus.provider} Connected
                </span>
              )}
            </Title>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 40px' }}>
            <Input
              placeholder="Search mail, contacts, or threads..."
              prefix={<SearchOutlined style={{ color: TOKENS.textSecondary }} />}
              style={{
                maxWidth: "600px",
                borderRadius: "10px",
                background: '#f1f5f9',
                border: 'none',
                height: '36px',
                padding: '0 16px'
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>

          <Space size="large">
            <Tooltip title={isSyncing ? "Synchronizing..." : "Sync Mailbox"}>
              <Button
                type="text"
                onClick={() => syncMail()}
                disabled={isSyncing}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  height: '34px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  color: isSyncing ? TOKENS.primary : TOKENS.textSecondary,
                  background: isSyncing ? TOKENS.active : 'transparent',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                className="user-header-hover"
              >
                <SyncOutlined spin={isSyncing} style={{ fontSize: '15px' }} />
                <span>Sync</span>
              </Button>
            </Tooltip>

            {unreadCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px' }}>
                <Text style={{ fontSize: '13px', fontWeight: 500, color: TOKENS.textSecondary }}>Unread</Text>
                <Badge 
                  count={unreadCount} 
                  overflowCount={999} 
                  style={{ 
                    backgroundColor: TOKENS.primary, 
                    boxShadow: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 600,
                    minWidth: '20px',
                    height: '20px',
                    lineHeight: '20px',
                    padding: '0 4px',
                    borderRadius: '10px'
                  }} 
                />
              </div>
            )}

            <Divider type="vertical" style={{ height: '20px' }} />
            <Popover
              content={profileCardContent}
              trigger="click"
              placement="bottomRight"
              overlayStyle={{ paddingTop: 4 }}
              overlayInnerStyle={{ borderRadius: 16, padding: 0, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
            >
              <Space size={8} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: '10px', transition: 'all 0.2s' }} className="user-header-hover">
                <Avatar
                  icon={<UserOutlined style={{ fontSize: '14px' }} />}
                  size="small"
                  style={{
                    background: '#f1f5f9',
                    color: TOKENS.textSecondary,
                    border: `1px solid ${TOKENS.border}`
                  }}
                />
                <Text strong style={{ fontSize: '13px', color: TOKENS.textPrimary }}>{user?.name || "User"}</Text>
                <CaretDownOutlined style={{ fontSize: '10px', color: TOKENS.textSecondary }} />
              </Space>
            </Popover>
          </Space>
        </Header>

        <Layout>
          {/* Left Sider - Folders and Compose */}
          <Sider width={210} theme="light" style={{ background: 'transparent', borderRight: `1px solid ${TOKENS.border}` }}>
            <div style={{ padding: "16px 12px" }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                block
                size="large"
                style={{
                  borderRadius: "10px",
                  fontWeight: 600,
                  height: "40px",
                  background: TOKENS.primary,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
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
              style={{ background: 'transparent', borderRight: 0, padding: '0 4px' }}
              items={folderItems.map(item => ({
                key: item.key,
                icon: React.cloneElement(item.icon as React.isValidElement, { style: { fontSize: '16px' } }),
                label: (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: selectedFolder === item.key ? 600 : 400 }}>{item.label}</span>
                    {item.count > 0 && (
                      <Badge
                        count={item.count}
                        overflowCount={99}
                        style={{
                          backgroundColor: selectedFolder === item.key ? TOKENS.primary : 'transparent',
                          color: selectedFolder === item.key ? '#fff' : TOKENS.textSecondary,
                          boxShadow: "none",
                          fontSize: '11px',
                          minWidth: '20px'
                        }}
                      />
                    )}
                  </div>
                )
              }))}
            />
          </Sider>

          {/* Center Content - Thread List */}
          <Content style={{ overflow: "auto", background: "transparent" }}>
            <div style={{ padding: "12px 24px", background: "transparent", borderBottom: `1px solid ${TOKENS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                <Space size={8} wrap>
                  {[
                    { label: 'All', value: 'ALL' },
                    { label: 'Unread', value: 'UNREAD' },
                    { label: 'Read', value: 'READ' },
                    { label: 'Has Attachment', value: 'HAS_ATTACHMENTS' },
                    { label: 'No Attachment', value: 'NO_ATTACHMENTS' }
                  ].map(opt => (
                    <Button
                      key={opt.value}
                      size="small"
                      type={filter === opt.value ? 'primary' : 'default'}
                      onClick={() => setFilter(opt.value as any)}
                      style={{
                        borderRadius: '20px',
                        fontSize: '12px',
                        height: '28px',
                        border: filter === opt.value ? 'none' : `1px solid ${TOKENS.border}`,
                        background: filter === opt.value ? TOKENS.primary : '#fff',
                        color: filter === opt.value ? '#fff' : TOKENS.textSecondary,
                        boxShadow: filter === opt.value ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none'
                      }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </Space>
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
                  <div
                    className={`${selectedThreadId === item.id ? 'active-thread' : ''}`}
                    style={{ display: "flex", alignItems: "center", width: '100%' }}
                  >
                    <div style={{ paddingLeft: "16px", display: 'flex', alignItems: 'center' }}>
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
                        borderBottom: "none",
                        padding: 0
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24 }}>
                            <MailOutlined style={{
                              color: !item.isRead ? TOKENS.primary : TOKENS.textSecondary,
                              fontSize: '14px',
                              transition: 'all 0.2s ease'
                            }} />
                          </div>
                        }
                        title={
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <Text strong={!item.isRead} style={{
                              fontSize: "14.5px",
                              color: !item.isRead ? TOKENS.textPrimary : TOKENS.textSecondary,
                              maxWidth: '220px',
                              letterSpacing: '-0.01em'
                            }} ellipsis>
                              {selectedFolder === 'SENT' ? (item.toEmails?.[0] || 'Unknown Recipient') : (item.fromAddress || 'Unknown Sender')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: "11px", fontWeight: 700, color: TOKENS.textSecondary }}>
                              {dayjs(item.lastMessageAt).format(dayjs().isSame(item.lastMessageAt, 'day') ? "h:mm A" : "MMM D")}
                            </Text>
                          </div>
                        }
                        description={
                          <div style={{ marginTop: "2px" }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Text strong={!item.isRead} style={{
                                display: "block",
                                color: !item.isRead ? TOKENS.textPrimary : TOKENS.textSecondary,
                                fontSize: "13.5px",
                                marginBottom: "1px",
                                fontWeight: !item.isRead ? 600 : 400
                              }} ellipsis>
                                {item.subject || "(No Subject)"}
                              </Text>
                              {item.hasAttachments && <PaperClipOutlined style={{ fontSize: "12px", color: TOKENS.textSecondary }} />}
                            </div>
                            <Paragraph ellipsis={{ rows: 1 }} style={{ marginBottom: 0, fontSize: "12.5px", color: TOKENS.textSecondary, lineHeight: '1.4' }}>
                              {item.snippet || "No preview available"}
                            </Paragraph>
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
          title={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Tag bordered={false} style={{ 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: selectedFolder === "SENT" ? "#f3e8ff" : selectedFolder === "DRAFTS" ? "#fef3c7" : "#eff6ff",
                      color: selectedFolder === "SENT" ? "#7e22ce" : selectedFolder === "DRAFTS" ? "#b45309" : TOKENS.primary,
                      margin: 0
                    }}>
                      {selectedFolder === "SENT" ? "Sent" : selectedFolder === "DRAFTS" ? "Draft" : selectedFolder === "TRASH" ? "Trash" : "Inbox"}
                    </Tag>
                    <Badge 
                      count={`${messages.length} ${messages.length === 1 ? 'Message' : 'Messages'}`} 
                      style={{ 
                        backgroundColor: '#f1f5f9', 
                        color: '#64748b', 
                        boxShadow: 'none',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: `1px solid ${TOKENS.border}`
                      }} 
                    />
                  </div>
                  <Title level={4} style={{
                    margin: 0,
                    fontSize: "20px",
                    lineHeight: '1.3',
                    color: TOKENS.textPrimary,
                    letterSpacing: '-0.025em',
                    fontWeight: 700
                  }}>
                    {selectedThread?.subject || "No Subject"}
                  </Title>
                </div>

                {!inlinePreview && (
                  <Space size={8} style={{ marginTop: '4px' }}>
                    {selectedFolder === "TRASH" && (
                      <Button
                        icon={<RollbackOutlined />}
                        size="small"
                        onClick={async () => {
                          if (selectedThreadId) {
                            await restoreThread(selectedThreadId);
                            message.success("Thread restored to Inbox");
                            setDrawerVisible(false);
                            setSelectedThreadId(null);
                          }
                        }}
                        style={{ borderRadius: '6px', fontWeight: 600 }}
                      >
                        Restore
                      </Button>
                    )}
                    {selectedFolder !== "ARCHIVE" && selectedFolder !== "TRASH" && (
                      <Tooltip title="Archive">
                        <Button
                          icon={<FolderOutlined />}
                          size="small"
                          onClick={async () => {
                            if (selectedThreadId) {
                              await archiveThread(selectedThreadId);
                              message.success("Thread archived");
                              setDrawerVisible(false);
                              setSelectedThreadId(null);
                            }
                          }}
                          style={{ borderRadius: '6px' }}
                        />
                      </Tooltip>
                    )}
                    <Popconfirm
                      title={selectedFolder === "TRASH" ? "Permanently delete?" : "Move to trash?"}
                      onConfirm={async () => {
                        if (selectedThreadId) {
                          await deleteThread(selectedThreadId);
                          message.success(selectedFolder === "TRASH" ? "Thread permanently deleted" : "Thread moved to trash");
                          setDrawerVisible(false);
                          setSelectedThreadId(null);
                        }
                      }}
                    >
                      <Button icon={<DeleteOutlined />} danger size="small" style={{ borderRadius: '6px' }} />
                    </Popconfirm>
                    <Tooltip title="Report Spam">
                      <Button
                        icon={<ExclamationCircleOutlined />}
                        type="text"
                        size="small"
                        style={{ color: TOKENS.textSecondary, borderRadius: '6px' }}
                      />
                    </Tooltip>
                  </Space>
                )}
              </div>
            </div>
          }
          placement="right"
          width={720}
          closable={true}
          closeIcon={<CloseOutlined style={{ fontSize: '16px', color: TOKENS.textSecondary }} />}
          onClose={() => {
            setDrawerVisible(false);
            setSelectedThreadId(null);
            setInlinePreview(null);
          }}
          open={drawerVisible}
          extra={
            inlinePreview && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setInlinePreview(null)}
              >
                Back
              </Button>
            )
          }
          style={{ background: '#f8fafc' }}
          headerStyle={{
            background: '#fff',
            borderBottom: `1px solid ${TOKENS.border}`,
            padding: '12px 24px',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
          bodyStyle={{ padding: '0', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {inlinePreview ? (
              <div style={{ flex: 1, padding: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0 0 16px 0', borderBottom: `1px solid ${TOKENS.border}`, marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: '16px' }}>{inlinePreview.name}</Text>
                  <Button type="text" icon={<CloseOutlined />} onClick={() => setInlinePreview(null)} />
                </div>
                <div style={{ flex: 1, width: '100%', background: '#fff', borderRadius: '12px', border: `1px solid ${TOKENS.border}`, overflow: 'hidden', boxShadow: TOKENS.shadow }}>
                  {inlinePreview.type.startsWith('image/') ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                      <img src={inlinePreview.url} alt={inlinePreview.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : inlinePreview.type === 'application/pdf' ? (
                    <iframe
                      src={`${inlinePreview.url}#toolbar=0&navpanes=0`}
                      title={inlinePreview.name}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 100 }}>
                      <Empty description="Preview not available" />
                      <Button type="primary" href={inlinePreview.url} download={inlinePreview.name} style={{ marginTop: 20 }}>
                        Download to View
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
                  <List
                    dataSource={messages}
                    split={false}
                    renderItem={(msg: any) => (
                        <div style={{
                          marginBottom: "20px",
                          background: "#fff",
                          borderRadius: "16px",
                          border: `1px solid ${TOKENS.border}`,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                          overflow: 'hidden',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}>
                          <div style={{
                            padding: "16px 24px",
                            background: "#fff",
                            borderBottom: `1px solid ${TOKENS.hover}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                              <Avatar
                                size={44}
                                style={{
                                  background: getAvatarColor(msg.fromEmail || msg.id),
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '15px',
                                  border: '2px solid #fff',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                }}
                              >
                                {getInitials(msg.fromEmail?.split('<')[0].trim() || msg.fromEmail)}
                              </Avatar>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                                  <Text strong style={{ 
                                    fontSize: "15px", 
                                    color: TOKENS.textPrimary,
                                    maxWidth: '350px'
                                  }} ellipsis>
                                    {user?.email && (msg.fromEmail?.toLowerCase().includes(user.email.toLowerCase())) ? "Me" : (msg.fromEmail?.split('<')[0].trim() || msg.fromEmail)}
                                  </Text>
                                  {msg.fromEmail?.includes('<') && (
                                    <Text style={{ fontSize: '12px', color: TOKENS.textSecondary, opacity: 0.8 }}>
                                      &lt;{msg.fromEmail?.match(/<(.+)>/)?.[1]}&gt;
                                    </Text>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                  <Text type="secondary" style={{ fontSize: "12px", marginRight: '4px' }}>to</Text>
                                  {(Array.isArray(msg.toEmails) ? msg.toEmails : [msg.toEmails]).map((email: string, idx: number) => (
                                    <Tag key={idx} bordered={false} style={{ 
                                      margin: 0, 
                                      fontSize: '11px', 
                                      borderRadius: '12px',
                                      background: '#f1f5f9',
                                      color: '#475569',
                                      fontWeight: 500
                                    }}>
                                      {email?.split('@')[0]}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <Text style={{ fontSize: "12px", color: TOKENS.textSecondary, fontWeight: 500 }}>
                                {dayjs(msg.receivedAt).format("MMM D, YYYY")}
                              </Text>
                              <br />
                              <Text style={{ fontSize: "11px", color: TOKENS.textSecondary, opacity: 0.7 }}>
                                {dayjs(msg.receivedAt).format("h:mm A")}
                              </Text>
                            </div>
                          </div>

                          <div className="mail-body" style={{
                            padding: "24px 28px",
                            lineHeight: "1.8",
                            color: TOKENS.textPrimary,
                            fontSize: '15.5px',
                            background: '#fff'
                          }}>
                            {msg.bodyHtml ? (
                              <div className="mail-html-content" dangerouslySetInnerHTML={{ __html: msg.bodyHtml }} style={{ fontSize: 'inherit', color: 'inherit' }} />
                            ) : (
                              <Paragraph style={{ whiteSpace: "pre-wrap", color: "inherit", margin: 0 }}>{msg.bodyText}</Paragraph>
                            )}
                          </div>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ padding: "0 28px 28px 28px", background: '#fff' }}>
                              <Divider style={{ margin: '0 0 20px 0' }} />
                              <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: "12px" }}>
                                <PaperClipOutlined style={{ fontSize: "15px", color: TOKENS.primary }} />
                                <span style={{ fontSize: "14px", fontWeight: 700, color: TOKENS.textPrimary }}>
                                  Attachments ({msg.attachments.length})
                                </span>
                                <Button
                                  type="text"
                                  size="small"
                                  onClick={() => downloadAsZip(msg.attachments)}
                                  icon={<DownloadOutlined />}
                                  style={{ marginLeft: 'auto', borderRadius: '6px', fontSize: '12px', color: TOKENS.primary, fontWeight: 600 }}
                                >
                                  Zip All
                                </Button>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                                {msg.attachments.map((att: any) => (
                                  <div
                                    key={att.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      background: '#f8fafc',
                                      borderRadius: "12px",
                                      padding: "10px 14px",
                                      color: TOKENS.textPrimary,
                                      border: `1px solid ${TOKENS.border}`,
                                      transition: 'all 0.2s ease',
                                      gap: '12px'
                                    }}
                                    className="attachment-card-hover"
                                  >
                                    <div style={{
                                      width: "40px",
                                      height: "40px",
                                      background: "#fff",
                                      borderRadius: "10px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "20px",
                                      color: TOKENS.primary,
                                      border: `1px solid ${TOKENS.border}`,
                                      flexShrink: 0,
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                                    }}>
                                      {getFileIcon(att.fileName)}
                                    </div>
                                    <div style={{ flex: 1, overflow: "hidden" }}>
                                      <div style={{
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: TOKENS.textPrimary,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                      }}>
                                        {att.fileName}
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", color: TOKENS.textSecondary, fontSize: "11px", marginTop: '2px' }}>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>{formatFileSize(att.size)}</Text>
                                        <Divider type="vertical" style={{ margin: '0 6px' }} />
                                        <Space size={8}>
                                          <Text 
                                            style={{ color: TOKENS.primary, cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                                            onClick={() => previewAttachment(att)}
                                          >
                                            Preview
                                          </Text>
                                          <DownloadOutlined 
                                            style={{ fontSize: "13px", cursor: 'pointer', opacity: 0.7 }}
                                            onClick={() => downloadAttachment(att)}
                                          />
                                        </Space>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    />
                  </div>

                  {/* Quick Reply Area - Pinned Composer Style */}
                  <div style={{
                    padding: "24px",
                    borderTop: `1px solid ${TOKENS.border}`,
                    background: "#fff",
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.02)',
                    zIndex: 20
                  }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                      <Avatar
                        size={40}
                        style={{
                          background: TOKENS.primary,
                          color: '#fff',
                          fontWeight: 700,
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
                          marginTop: '2px'
                        }}
                      >
                        {getInitials(user?.name || user?.email || "?")}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <TextArea
                          id="quick-reply-textarea"
                          placeholder="Write a quick reply..."
                          autoSize={{ minRows: 4, maxRows: 12 }}
                          value={quickReply}
                          onChange={(e) => setQuickReply(e.target.value)}
                          style={{
                            borderRadius: "16px",
                            border: `1px solid ${TOKENS.border}`,
                            padding: "16px 20px",
                            fontSize: '15px',
                            background: '#f8fafc',
                            transition: 'all 0.3s ease',
                            marginBottom: '16px',
                            boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.02)'
                          }}
                          onFocus={(e) => {
                            e.target.style.background = '#fff';
                            e.target.style.borderColor = TOKENS.primary;
                            e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.08)';
                          }}
                          onBlur={(e) => {
                            if (!quickReply) {
                              e.target.style.background = '#f8fafc';
                              e.target.style.borderColor = TOKENS.border;
                              e.target.style.boxShadow = 'none';
                            }
                          }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Space size={12}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div>
                              <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
                                Replying as <span style={{ color: TOKENS.textPrimary }}>{user?.email}</span>
                              </Text>
                            </div>
                          </Space>
                          <Space size={12}>
                            <Button
                              icon={<CloseOutlined />}
                              onClick={() => setQuickReply("")}
                              disabled={!quickReply.trim()}
                              style={{ borderRadius: '8px', border: 'none', background: '#f1f5f9', fontWeight: 600, height: '36px' }}
                            >
                              Discard
                            </Button>
                            <Button
                              type="primary"
                              icon={<SendOutlined />}
                              loading={isSendingReply}
                              disabled={!quickReply.trim()}
                              style={{
                                borderRadius: "8px",
                                height: '36px',
                                padding: '0 24px',
                                fontWeight: 700,
                                background: TOKENS.primary,
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                                border: 'none',
                                fontSize: '14px'
                              }}
                              onClick={async () => {
                                const lastMsg = messages[messages.length - 1];
                                if (!lastMsg) return;
                                setIsSendingReply(true);
                                try {
                                  await sendMessage({
                                    to: [lastMsg.fromEmail],
                                    subject: lastMsg.subject.startsWith("Re:") ? lastMsg.subject : `Re: ${lastMsg.subject}`,
                                    body: quickReply,
                                    threadId: selectedThreadId || undefined
                                  });
                                  message.success("Reply sent");
                                  setQuickReply("");
                                } catch (err) {
                                  message.error("Failed to send reply");
                                } finally {
                                  setIsSendingReply(false);
                                }
                              }}
                            >
                              Send Reply
                            </Button>
                          </Space>
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
          title={<div style={{ padding: "4px 0" }}><Title level={4} style={{ margin: 0 }}>{currentDraftThreadId ? "Edit Draft" : "New Message"}</Title></div>}
          placement="right"
          width={750}
          onClose={() => {
            setComposeVisible(false);
            setCurrentDraftId(null);
            setCurrentDraftThreadId(null);
            setSelectedThreadId(null);
            setShowCc(false);
            setShowBcc(false);
          }}
          open={composeVisible}
          extra={
            <Space size={16}>
              <Form.Item
                name="scheduledAt"
                noStyle
              >
                <DatePicker
                  showTime
                  variant="borderless"
                  placeholder="Send Later"
                  size="small"
                  suffixIcon={<CaretDownOutlined />}
                  style={{ 
                    fontWeight: 500, 
                    color: TOKENS.primary, 
                    border: `1px solid ${TOKENS.border}`,
                    borderRadius: '8px',
                    padding: '4px 8px',
                    height: '32px'
                  }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
              <Button
                type="text"
                style={{ 
                  color: TOKENS.textSecondary,
                  fontWeight: 500,
                  height: '32px',
                  padding: '0 8px'
                }}
                className="user-header-hover"
                onClick={async () => {
                  const values = form.getFieldsValue();
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
                    // Pass provider external draft ID so the backend updates the existing draft instead of creating a new one
                    id: currentDraftId || undefined,
                    threadId: currentDraftThreadId || undefined
                  };
                  try {
                    await saveDraft(draftData);
                    message.success("Draft saved");
                    setComposeVisible(false);
                    setCurrentDraftId(null);
                    setCurrentDraftThreadId(null);
                    setSelectedThreadId(null);
                    setShowCc(false);
                    setShowBcc(false);
                  } catch (err: any) {
                    console.error("[Mail] Failed to save draft:", err);
                    message.error(err?.response?.data?.error || "Failed to save draft");
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
                style={{ 
                  borderRadius: "8px", 
                  padding: "0 20px", 
                  height: '32px',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
                }}
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

              try {
                if (currentDraftThreadId) {
                  // Sending a draft: send as a regular message using the composed content,
                  // then delete the draft thread so it's removed from the Drafts folder.
                  // We do NOT call saveDraft again here — that would create a duplicate.
                  await sendMessage(mailData);

                  // Delete the draft thread from local DB / provider
                  try {
                    await deleteThread(currentDraftThreadId);
                  } catch (delErr) {
                    console.warn("[Mail] Could not remove draft thread after send:", delErr);
                  }
                } else {
                  await sendMessage(mailData);
                }

                message.success(mailData.scheduledAt ? "Email scheduled successfully" : "Email sent successfully");
                setComposeVisible(false);
                setCurrentDraftId(null);
                setCurrentDraftThreadId(null);
                setSelectedThreadId(null);
                setShowCc(false);
                setShowBcc(false);
                form.resetFields();
              } catch (err: any) {
                console.error("[Mail] Failed to send email:", err);
                message.error(err?.response?.data?.error || "Failed to send email");
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

            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', marginBottom: '12px' }}>
              <Form.Item
                name="to"
                label={<Text type="secondary" style={{ width: '40px' }}>To</Text>}
                rules={[{ required: true, message: "Recipient is required" }]}
                style={{ marginBottom: 0, flex: 1 }}
                className="compose-recipient-item"
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
                  style={{ width: '100%', borderRadius: 0, paddingLeft: 0 }}
                  popupMatchSelectWidth={false}
                />
              </Form.Item>
              <Space size={12} style={{ paddingRight: '8px' }}>
                <Text 
                  style={{ 
                    fontSize: '13px', 
                    fontWeight: 500, 
                    color: showCc ? TOKENS.primary : TOKENS.textSecondary,
                    cursor: 'pointer',
                    opacity: showCc ? 1 : 0.7
                  }} 
                  onClick={() => setShowCc(!showCc)}
                >
                  Cc
                </Text>
                <Text 
                  style={{ 
                    fontSize: '13px', 
                    fontWeight: 500, 
                    color: showBcc ? TOKENS.primary : TOKENS.textSecondary,
                    cursor: 'pointer',
                    opacity: showBcc ? 1 : 0.7
                  }} 
                  onClick={() => setShowBcc(!showBcc)}
                >
                  Bcc
                </Text>
              </Space>
            </div>

            {showCc && (
              <Form.Item
                name="cc"
                label={<Text type="secondary" style={{ width: '40px' }}>Cc</Text>}
                style={{ marginBottom: "12px", borderBottom: '1px solid #f0f0f0' }}
              >
                <Select
                  mode="tags"
                  placeholder="Select or type copy recipient emails"
                  tokenSeparators={[',', ' ']}
                  options={contacts.map((u: any) => ({ value: u.email || '', label: `${u.name} (${u.email || 'No Email'})` })).filter((u: any) => u.value)}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                    (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  variant="borderless"
                  style={{ width: '100%', borderRadius: 0, paddingLeft: 0 }}
                  popupMatchSelectWidth={false}
                />
              </Form.Item>
            )}

            {showBcc && (
              <Form.Item
                name="bcc"
                label={<Text type="secondary" style={{ width: '40px' }}>Bcc</Text>}
                style={{ marginBottom: "12px", borderBottom: '1px solid #f0f0f0' }}
              >
                <Select
                  mode="tags"
                  placeholder="Select or type blind copy recipient emails"
                  tokenSeparators={[',', ' ']}
                  options={contacts.map((u: any) => ({ value: u.email || '', label: `${u.name} (${u.email || 'No Email'})` })).filter((u: any) => u.value)}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                    (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  variant="borderless"
                  style={{ width: '100%', borderRadius: 0, paddingLeft: 0 }}
                  popupMatchSelectWidth={false}
                />
              </Form.Item>
            )}

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

            <div style={{ paddingBottom: '24px' }}>
              <Form.Item
                name="attachments"
                valuePropName="fileList"
                getValueFromEvent={(e: any) => {
                  if (Array.isArray(e)) return e;
                  return e?.fileList;
                }}
                style={{ marginBottom: 0 }}
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
                  <Button icon={<PaperClipOutlined />} style={{ borderRadius: '8px', border: `1px solid ${TOKENS.border}` }}>Attach Files</Button>
                </Upload>
              </Form.Item>
            </div>
          </Form>
        </Drawer>
      </Layout>
    </MainLayout>
  );
}