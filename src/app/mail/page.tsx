"use client";

import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Layout, Menu, Typography, Button, Space, Avatar, List, Divider, Empty, Spin, Input, Drawer, Badge, Modal, Form, message, Select, Popconfirm, Checkbox, Segmented, DatePicker, Upload, Popover, Tooltip, Tag } from "antd";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { apiClient } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import {
  Mail,
  RefreshCw,
  Search,
  PenSquare,
  Inbox,
  Send,
  FileText,
  Trash2,
  AlertOctagon,
  Archive,
  ArrowLeft,
  Paperclip,
  Download,
  Eye,
  Undo2,
  RotateCcw,
  X,
  Sparkles,
  Clock,
  Reply,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  SendOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { useMail, useMailThreads, useThreadMessages, useMailStatus, useMailContacts, useMailUnreadCount } from "@/hooks/useMail";
import { MailService, MailMessage } from "@/services/mailService";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TiptapEditor from "@/components/common/TiptapEditor";
import JSZip from "jszip";
import { saveAs } from "file-saver";

dayjs.extend(relativeTime);

const { TextArea } = Input;

// --- Premium design tokens (theme-aware via CSS vars) ---
const PALETTE = {
  primary: "var(--mail-primary)",
  primaryDark: "var(--mail-primary-dark)",
  violet: "var(--mail-violet)",
  pink: "var(--mail-pink)",
  emerald: "var(--mail-emerald)",
  amber: "var(--mail-amber)",
  rose: "var(--mail-rose)",
  slate900: "var(--mail-text-primary)",
  slate700: "var(--mail-text-secondary)",
  slate500: "var(--mail-text-muted)",
  slate400: "var(--mail-text-soft)",
  slate300: "var(--mail-border-strong)",
  slate200: "var(--mail-border)",
  slate100: "var(--mail-surface-2)",
  slate50: "var(--mail-surface-1)",
  white: "var(--mail-surface)",
  border: "var(--mail-border)",
};

// Deterministic gradient avatar generator
const AVATAR_GRADIENTS = [
  ["#6366F1", "#8B5CF6"],
  ["#3B82F6", "#06B6D4"],
  ["#10B981", "#14B8A6"],
  ["#F59E0B", "#F97316"],
  ["#EC4899", "#F43F5E"],
  ["#8B5CF6", "#EC4899"],
  ["#06B6D4", "#3B82F6"],
  ["#14B8A6", "#10B981"],
  ["#F97316", "#EF4444"],
  ["#A855F7", "#6366F1"],
];

const hashString = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const getAvatarStyle = (seed: string) => {
  const [c1, c2] = AVATAR_GRADIENTS[hashString(seed || "x") % AVATAR_GRADIENTS.length];
  return {
    background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
    color: "#fff",
  };
};

const getInitials = (input: string) => {
  if (!input) return "?";
  const cleaned = input.replace(/[<>"]/g, "").trim();
  const beforeAt = cleaned.split("@")[0] || cleaned;
  const parts = beforeAt.split(/[._\s-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return beforeAt.slice(0, 2).toUpperCase();
};

const FOLDERS = [
  {
    key: "INBOX",
    label: "Inbox",
    icon: Inbox,
    color: "var(--mail-primary)",
    tint: "var(--mail-tint-blue)",
  },
  {
    key: "SENT",
    label: "Sent",
    icon: Send,
    color: "var(--mail-emerald)",
    tint: "var(--mail-tint-emerald)",
  },
  {
    key: "DRAFTS",
    label: "Drafts",
    icon: FileText,
    color: "var(--mail-amber)",
    tint: "var(--mail-tint-amber)",
  },
  {
    key: "SPAM",
    label: "Spam",
    icon: AlertOctagon,
    color: "var(--mail-rose)",
    tint: "var(--mail-tint-rose)",
  },
  {
    key: "TRASH",
    label: "Trash",
    icon: Trash2,
    color: "var(--mail-text-muted)",
    tint: "var(--mail-surface-2)",
  },
  {
    key: "ARCHIVE",
    label: "Archive",
    icon: Archive,
    color: "var(--mail-violet)",
    tint: "var(--mail-tint-violet)",
  },
];

const FILTERS: { label: string; value: any; icon?: any }[] = [
  { label: "All", value: "ALL" },
  { label: "Unread", value: "UNREAD" },
  { label: "Read", value: "READ" },
  { label: "Has Attachment", value: "HAS_ATTACHMENTS" },
  { label: "No Attachment", value: "NO_ATTACHMENTS" },
];

export default function MailPage() {
  const { 
    canCreateMail, 
    canUpdateMail, 
    canDeleteMail, 
    canManageMail 
  } = usePermission();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [filter, setFilter] = useState<
    "ALL" | "READ" | "UNREAD" | "HAS_ATTACHMENTS" | "NO_ATTACHMENTS"
  >("ALL");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: threadsData = [], isLoading: threadsLoading } = useMailThreads(selectedFolder, filter, debouncedSearch);
  const { data: messages = [], isLoading: messagesLoading } = useThreadMessages(selectedThreadId);
  const { data: mailStatus } = useMailStatus();
  // const { data: unreadCount = 0 } = useMailUnreadCount();
  const threads = Array.isArray(threadsData) ? threadsData : [];
  const { data: contacts = [] } = useMailContacts();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    syncMail,
    isSyncing,
    sendMessage,
    isSending,
    saveDraft,
    isSavingDraft,
    sendDraft,
    uploadAttachment,
    deleteThread,
    deleteThreads,
    isDeletingThreads,
    restoreThread,
    bulkRestoreThreads,
    isRestoringThreads,
    archiveThread,
    bulkArchiveThreads,
    isArchivingThreads,
    bulkDestroyThreads,
    isDestroyingThreads,
    emptyTrash,
    markAsRead,
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
  const [inlinePreview, setInlinePreview] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

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
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FilePdfOutlined />;
      case "doc":
      case "docx":
      case "rtf":
      case "odt":
        return <FileWordOutlined />;
      case "xls":
      case "xlsx":
      case "csv":
        return <FileExcelOutlined />;
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "webp":
        return <FileImageOutlined />;
      default:
        return <FileOutlined />;
    }
  };

  const getFileColor = (fileName?: string) => {
    if (!fileName) return PALETTE.slate500;
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "#DC2626";
      case "doc":
      case "docx":
      case "rtf":
      case "odt":
        return "#2563EB";
      case "xls":
      case "xlsx":
      case "csv":
        return "#059669";
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "webp":
        return "#7C3AED";
      default:
        return PALETTE.slate500;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const previewAttachment = async (att: any) => {
    const isPdf =
      att.mimeType === "application/pdf" ||
      att.contentType === "application/pdf" ||
      att.fileName?.toLowerCase().endsWith(".pdf");

    try {
      // Use backend proxy with authenticated apiClient to fetch blob
      const proxyUrl = `/api/mail/attachments/download?url=${encodeURIComponent(att.downloadUrl)}&filename=${encodeURIComponent(att.fileName)}&mode=inline&attachmentId=${encodeURIComponent(att.id)}`;
      const response = await apiClient.get(proxyUrl, { responseType: 'blob' });

      const blob = new Blob([response.data], {
        type: isPdf
          ? "application/pdf"
          : att.mimeType || att.contentType || "application/octet-stream",
      });
      const blobUrl = URL.createObjectURL(blob);

      setInlinePreview({
        url: blobUrl,
        name: att.fileName,
        type: isPdf
          ? "application/pdf"
          : att.mimeType || att.contentType || "",
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

  const unreadCount = useMemo(
    () =>
      threads.filter((t: any) => !t.isRead).length,
    [threads]
  );

  const activeFolder = FOLDERS.find((f) => f.key === selectedFolder)!;

  return (
    <MainLayout>
      <style>{`
        .mail-shell {
          height: calc(100vh - 64px);
          display: flex;
          background: var(--mail-shell-bg);
          overflow: hidden;
        }
        .mail-sidebar {
          width: 264px;
          flex-shrink: 0;
          background: var(--mail-sidebar-bg);
          backdrop-filter: blur(20px);
          border-right: 1px solid ${PALETTE.slate200};
          display: flex;
          flex-direction: column;
          padding: 20px 16px;
        }
        .mail-compose-btn {
          height: 48px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #3B82F6 0%, #6366F1 60%, #8B5CF6 100%);
          color: white;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 8px 24px -8px rgba(99, 102, 241, 0.55);
          transition: all 0.2s ease;
          width: 100%;
        }
        .mail-compose-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px -8px rgba(99, 102, 241, 0.7);
        }
        .mail-compose-btn:active { transform: translateY(0); }

        .mail-folder-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          color: ${PALETTE.slate700};
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 2px;
          position: relative;
        }
        .mail-folder-item:hover {
          background: var(--mail-folder-hover);
        }
        .mail-folder-item.active {
          background: var(--mail-surface);
          color: ${PALETTE.slate900};
          box-shadow: var(--mail-shadow-sm);
        }
        .mail-folder-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 25%; bottom: 25%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, var(--mail-primary), var(--mail-violet));
        }
        .mail-folder-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .mail-folder-count {
          margin-left: auto;
          font-size: 12px;
          font-weight: 600;
          color: ${PALETTE.slate500};
          background: ${PALETTE.slate100};
          padding: 2px 8px;
          border-radius: 999px;
          min-width: 22px;
          text-align: center;
        }
        .mail-folder-item.active .mail-folder-count {
          background: var(--mail-tint-blue);
          color: var(--mail-primary);
        }

        .mail-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .mail-topbar {
          height: 72px;
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: var(--mail-topbar-bg);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid ${PALETTE.slate200};
        }
        .mail-search {
          flex: 1;
          max-width: 520px;
          height: 42px;
          background: var(--mail-surface);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 12px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
        }
        .mail-search:focus-within {
          border-color: var(--mail-primary);
          box-shadow: 0 0 0 4px var(--mail-focus-ring);
        }
        .mail-search input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: ${PALETTE.slate900};
        }
        .mail-search input::placeholder { color: ${PALETTE.slate400}; }
        .mail-kbd {
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 11px;
          color: ${PALETTE.slate500};
          background: ${PALETTE.slate100};
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid ${PALETTE.slate200};
        }
        .mail-icon-btn {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: var(--mail-surface);
          border: 1px solid ${PALETTE.slate200};
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: ${PALETTE.slate700};
          transition: all 0.15s ease;
        }
        .mail-icon-btn:hover {
          border-color: ${PALETTE.slate300};
          background: ${PALETTE.slate50};
        }

        .mail-header-section {
          padding: 24px 28px 12px;
        }
        .mail-folder-title {
          display: flex; align-items: center; gap: 12px;
        }
        .mail-folder-title h1 {
          font-size: 22px; font-weight: 700; margin: 0;
          color: ${PALETTE.slate900};
          letter-spacing: -0.01em;
        }
        .mail-folder-title .badge {
          font-size: 12px; font-weight: 600;
          color: var(--mail-primary);
          background: var(--mail-tint-blue);
          padding: 4px 10px;
          border-radius: 999px;
        }

        .mail-toolbar {
          padding: 0 28px 12px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
        }
        .filter-pill {
          padding: 6px 14px;
          border-radius: 999px;
          background: var(--mail-surface);
          border: 1px solid ${PALETTE.slate200};
          font-size: 13px;
          font-weight: 500;
          color: ${PALETTE.slate700};
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-pill:hover { border-color: ${PALETTE.slate300}; }
        .filter-pill.active {
          background: var(--mail-pill-active-bg);
          color: var(--mail-pill-active-fg);
          border-color: var(--mail-pill-active-bg);
        }

        .bulk-bar {
          margin-left: auto;
          display: flex; align-items: center; gap: 8px;
          padding: 4px 8px 4px 14px;
          background: var(--mail-surface);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 12px;
          box-shadow: var(--mail-shadow-md);
        }
        .bulk-bar .count {
          font-size: 12px; font-weight: 600;
          color: ${PALETTE.slate900};
          padding-right: 8px;
          border-right: 1px solid ${PALETTE.slate200};
        }
        .bulk-action-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 10px;
          background: transparent; border: none;
          border-radius: 8px;
          font-size: 13px; font-weight: 500;
          color: ${PALETTE.slate700};
          cursor: pointer;
        }
        .bulk-action-btn:hover { background: ${PALETTE.slate100}; }
        .bulk-action-btn.danger { color: ${PALETTE.rose}; }
        .bulk-action-btn.danger:hover { background: var(--mail-tint-rose); }

        .mail-thread-list-wrap {
          flex: 1; overflow-y: auto;
          padding: 4px 28px 28px;
        }
        .mail-thread-card {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 18px;
          background: var(--mail-surface);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 14px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }
        .mail-thread-card:hover {
          border-color: ${PALETTE.slate300};
          box-shadow: var(--mail-shadow-lg);
          transform: translateY(-1px);
        }
        .mail-thread-card.selected {
          background: var(--mail-card-selected-bg);
          border-color: var(--mail-card-selected-border);
          box-shadow: var(--mail-shadow-blue);
        }
        .mail-thread-card.unread::before {
          content: '';
          position: absolute;
          left: 6px; top: 50%; transform: translateY(-50%);
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--mail-primary);
          box-shadow: 0 0 0 3px var(--mail-focus-ring);
        }
        .thread-checkbox-wrap {
          padding-top: 6px;
        }
        .thread-avatar {
          width: 40px; height: 40px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 13px;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }
        .thread-meta { flex: 1; min-width: 0; }
        .thread-row1 {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; margin-bottom: 2px;
        }
        .thread-sender {
          font-size: 14px; font-weight: 600;
          color: ${PALETTE.slate900};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .thread-sender.unread { font-weight: 700; }
        .thread-time {
          font-size: 12px; color: ${PALETTE.slate500};
          white-space: nowrap;
          display: flex; align-items: center; gap: 6px;
        }
        .thread-subject {
          font-size: 13.5px;
          color: ${PALETTE.slate700};
          font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 2px;
        }
        .thread-subject.unread { color: ${PALETTE.slate900}; font-weight: 600; }
        .thread-snippet {
          font-size: 13px; color: ${PALETTE.slate500};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .mail-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 20px;
          text-align: center;
        }
        .mail-empty-icon {
          width: 72px; height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, var(--mail-tint-blue) 0%, var(--mail-tint-violet) 100%);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          color: ${PALETTE.primary};
        }
        .mail-empty h3 {
          font-size: 17px; font-weight: 600;
          color: ${PALETTE.slate900};
          margin: 0 0 6px;
        }
        .mail-empty p {
          font-size: 14px; color: ${PALETTE.slate500};
          margin: 0;
        }

        .skeleton-row {
          height: 88px; background: var(--mail-surface);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 14px; margin-bottom: 8px;
          padding: 16px;
          display: flex; gap: 14px;
        }
        .skeleton-shape {
          background: linear-gradient(90deg, ${PALETTE.slate100} 25%, ${PALETTE.slate200} 50%, ${PALETTE.slate100} 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.4s infinite linear;
          border-radius: 8px;
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Drawer overrides */
        .mail-detail-drawer .ant-drawer-header,
        .mail-compose-drawer .ant-drawer-header {
          padding: 20px 28px;
          border-bottom: 1px solid ${PALETTE.slate200};
        }
        .mail-detail-drawer .ant-drawer-body,
        .mail-compose-drawer .ant-drawer-body {
          padding: 0;
          background: var(--mail-drawer-bg);
        }
        .mail-detail-drawer .ant-drawer-content,
        .mail-compose-drawer .ant-drawer-content {
          background: var(--mail-drawer-bg);
        }
        .mail-detail-drawer .ant-drawer-header,
        .mail-compose-drawer .ant-drawer-header {
          background: var(--mail-surface);
        }

        .message-card {
          background: var(--mail-surface);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 16px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .message-card-header {
          padding: 18px 22px 14px;
          display: flex; align-items: flex-start; gap: 14px;
          border-bottom: 1px solid ${PALETTE.slate100};
        }
        .message-card-body {
          padding: 18px 22px 22px;
          font-size: 14px; line-height: 1.65;
          color: ${PALETTE.slate700};
        }
        .message-card-body img { max-width: 100%; height: auto; border-radius: 8px; }

        .attach-card {
          display: flex; align-items: center; gap: 12px;
          padding: 12px;
          background: var(--mail-surface-1);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 12px;
          width: 320px;
          transition: all 0.15s;
        }
        .attach-card:hover {
          background: var(--mail-surface);
          border-color: ${PALETTE.slate300};
          box-shadow: var(--mail-shadow-md);
        }
        .attach-icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          color: white;
          flex-shrink: 0;
        }

        .quick-reply-wrap {
          background: var(--mail-surface);
          border-top: 1px solid ${PALETTE.slate200};
          padding: 18px 22px;
        }
        .quick-reply-box {
          background: var(--mail-surface-1);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 14px;
          padding: 12px 14px;
          transition: all 0.2s;
        }
        .quick-reply-box:focus-within {
          background: var(--mail-surface);
          border-color: var(--mail-primary);
          box-shadow: 0 0 0 4px var(--mail-focus-ring);
        }

        .compose-section {
          background: var(--mail-surface);
          border-bottom: 1px solid ${PALETTE.slate100};
          padding: 12px 28px;
          display: flex; align-items: center; gap: 12px;
        }
        .compose-section-label {
          font-size: 12px; font-weight: 600;
          color: ${PALETTE.slate500};
          text-transform: uppercase;
          letter-spacing: 0.04em;
          width: 64px;
          flex-shrink: 0;
        }

        .send-gradient-btn {
          background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%) !important;
          border: none !important;
          height: 38px !important;
          padding: 0 22px !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
          box-shadow: 0 6px 18px -6px rgba(99, 102, 241, 0.55) !important;
        }

        .mail-thread-list-wrap::-webkit-scrollbar { width: 8px; }
        .mail-thread-list-wrap::-webkit-scrollbar-thumb {
          background: ${PALETTE.slate200}; border-radius: 8px;
        }
        .mail-thread-list-wrap::-webkit-scrollbar-thumb:hover { background: ${PALETTE.slate300}; }
      `}</style>

      <div className="mail-shell">
        {/* ============== SIDEBAR ============== */}
        <aside className="mail-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px 18px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 6px 16px -6px rgba(99, 102, 241, 0.6)",
              }}
            >
              <Mail size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: PALETTE.slate900, letterSpacing: "-0.01em" }}>
                Mail
              </div>
              {mailStatus?.connectedEmail && (
                <div
                  style={{
                    fontSize: 11,
                    color: PALETTE.slate500,
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mailStatus.connectedEmail}
                </div>
              )}
            </div>
          </div>

          {canCreateMail && (
            <button
              className="mail-compose-btn"
              onClick={() => {
                setComposeVisible(true);
                setCurrentDraftId(null);
                setTimeout(() => form.resetFields(), 0);
              }}
            >
              <PenSquare size={16} strokeWidth={2.4} />
              Compose
            </button>
          )}

          <div style={{ marginTop: 24, padding: "0 4px 8px", fontSize: 11, fontWeight: 600, color: PALETTE.slate400, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Folders
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {FOLDERS.map((f) => {
              const Icon = f.icon;
              const isActive = selectedFolder === f.key;
              const showCount = isActive && threads.length > 0;
              return (
                <div
                  key={f.key}
                  className={`mail-folder-item ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedFolder(f.key)}
                >
                  <div
                    className="mail-folder-icon-wrap"
                    style={{
                      background: isActive ? f.tint : "transparent",
                      color: f.color,
                    }}
                  >
                    <Icon size={16} strokeWidth={2.2} />
                  </div>
                  <span>{f.label}</span>
                  {showCount && (
                    <span className="mail-folder-count">{threads.length}</span>
                  )}
                  {f.key === "INBOX" && !isActive && unreadCount > 0 && (
                    <span className="mail-folder-count" style={{ background: "var(--mail-tint-blue)", color: "var(--mail-primary)" }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              background: "linear-gradient(135deg, var(--mail-tint-blue) 0%, var(--mail-tint-violet) 100%)",
              border: "1px solid var(--mail-tip-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Sparkles size={14} color={PALETTE.violet} />
              <span style={{ fontSize: 12, fontWeight: 700, color: PALETTE.slate900 }}>
                Pro tip
              </span>
            </div>
            <p style={{ fontSize: 12, color: PALETTE.slate500, margin: 0, lineHeight: 1.5 }}>
              Use the <span className="mail-kbd" style={{ fontSize: 10 }}>/</span> shortcut to quickly search any message.
            </p>
          </div>
        </aside>

        {/* ============== MAIN ============== */}
        <main className="mail-main">
          <div className="mail-topbar">
            <div className="mail-search">
              <Search size={16} color={PALETTE.slate400} />
              <input
                placeholder="Search messages, senders, attachments…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search ? (
                <X
                  size={14}
                  color={PALETTE.slate400}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSearch("")}
                />
              ) : (
                <span className="mail-kbd">/</span>
              )}
            </div>

            <Space size={10}>
              {selectedFolder === "TRASH" && threads.length > 0 && canDeleteMail && (
                <Popconfirm
                  title="Empty Trash?"
                  description="All conversations in Trash will be permanently deleted."
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
                  <button className="mail-icon-btn" style={{ width: "auto", padding: "0 14px", color: PALETTE.rose, gap: 8, display: "flex" }}>
                    <Trash2 size={14} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Empty</span>
                  </button>
                </Popconfirm>
              )}
              {canManageMail && (
                <Tooltip title="Sync mail">
                  <button
                    className="mail-icon-btn"
                    onClick={() => syncMail()}
                    disabled={isSyncing}
                    style={{ opacity: isSyncing ? 0.5 : 1 }}
                  >
                    <RefreshCw
                      size={16}
                      style={{
                        animation: isSyncing ? "spin 1s linear infinite" : "none",
                      }}
                    />
                  </button>
                </Tooltip>
              )}
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </Space>
          </div>

          <div className="mail-header-section">
            <div className="mail-folder-title">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: activeFolder.tint,
                  color: activeFolder.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <activeFolder.icon size={18} strokeWidth={2.2} />
              </div>
              <h1>{activeFolder.label}</h1>
              {threads.length > 0 && (
                <span className="badge">
                  {threads.length} {threads.length === 1 ? "thread" : "threads"}
                </span>
              )}
            </div>
          </div>

          <div className="mail-toolbar">
            <Checkbox
              disabled={threads.length === 0}
              checked={threads.length > 0 && selectedThreadIds.length === threads.length}
              indeterminate={
                selectedThreadIds.length > 0 &&
                selectedThreadIds.length < threads.length
              }
              onChange={(e: any) => {
                if (e.target.checked) {
                  setSelectedThreadIds(threads.map((t: any) => t.id));
                } else {
                  setSelectedThreadIds([]);
                }
              }}
            />
            <div style={{ width: 1, height: 22, background: PALETTE.slate200 }} />

            {FILTERS.map((f) => (
              <button
                key={f.value}
                className={`filter-pill ${filter === f.value ? "active" : ""}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}

            {selectedThreadIds.length > 0 && (
              <div className="bulk-bar">
                <span className="count">{selectedThreadIds.length} selected</span>
                {canDeleteMail && (
                  <button
                    className="bulk-action-btn danger"
                    disabled={isDestroyingThreads || isDeletingThreads}
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
                    <Trash2 size={14} />
                    {selectedFolder === "TRASH" ? "Delete" : "Trash"}
                  </button>
                )}

                {canUpdateMail && (selectedFolder === "TRASH" || selectedFolder === "ARCHIVE") && (
                  <button
                    className="bulk-action-btn"
                    disabled={isRestoringThreads}
                    onClick={async () => {
                      await bulkRestoreThreads(selectedThreadIds);
                      message.success(
                        selectedFolder === "TRASH"
                          ? "Selected items restored"
                          : "Selected items moved to inbox"
                      );
                      setSelectedThreadIds([]);
                    }}
                  >
                    <Undo2 size={14} />
                    {selectedFolder === "TRASH" ? "Restore" : "Inbox"}
                  </button>
                )}

                {selectedFolder !== "ARCHIVE" && (
                  <button
                    className="bulk-action-btn"
                    disabled={isArchivingThreads}
                    onClick={async () => {
                      await bulkArchiveThreads(selectedThreadIds);
                      message.success("Selected items archived");
                      setSelectedThreadIds([]);
                    }}
                  >
                    <Archive size={14} />
                    Archive
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mail-thread-list-wrap">
            {threadsLoading && !isSyncing ? (
              <>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton-row">
                    <div className="skeleton-shape" style={{ width: 40, height: 40, borderRadius: 12 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-shape" style={{ height: 12, width: "30%", marginBottom: 8 }} />
                      <div className="skeleton-shape" style={{ height: 10, width: "60%", marginBottom: 6 }} />
                      <div className="skeleton-shape" style={{ height: 10, width: "85%" }} />
                    </div>
                  </div>
                ))}
              </>
            ) : threads.length === 0 ? (
              <div className="mail-empty">
                <div className="mail-empty-icon">
                  <activeFolder.icon size={32} strokeWidth={1.8} />
                </div>
                <h3>No conversations in {activeFolder.label}</h3>
                <p>
                  {search
                    ? "Try adjusting your search or filters."
                    : "When you receive new mail, it will appear here."}
                </p>
              </div>
            ) : (
              threads.map((item: any) => {
                const isSent = selectedFolder === "SENT";
                const sender = isSent
                  ? item.toEmails?.[0] || "Unknown Recipient"
                  : item.fromAddress || "Unknown Sender";
                const isSelected = selectedThreadId === item.id;
                const isUnread = !item.isRead;
                return (
                  <div
                    key={item.id}
                    className={`mail-thread-card ${isSelected ? "selected" : ""} ${isUnread ? "unread" : ""}`}
                    onClick={() => {
                      setSelectedThreadId(item.id);
                      if (!item.isRead) markAsRead(item.id);
                    }}
                  >
                    <div className="thread-checkbox-wrap" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedThreadIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedThreadIds((prev) => [...prev, item.id]);
                          } else {
                            setSelectedThreadIds((prev) => prev.filter((id) => id !== item.id));
                          }
                        }}
                      />
                    </div>
                    <div className="thread-avatar" style={getAvatarStyle(sender)}>
                      {getInitials(sender)}
                    </div>
                    <div className="thread-meta">
                      <div className="thread-row1">
                        <span className={`thread-sender ${isUnread ? "unread" : ""}`}>{sender}</span>
                        <span className="thread-time">
                          {item.hasAttachments && <Paperclip size={12} />}
                          {dayjs(item.lastMessageAt).format("MMM D")}
                        </span>
                      </div>
                      <div className={`thread-subject ${isUnread ? "unread" : ""}`}>
                        {item.subject || "(No Subject)"}
                      </div>
                      <div className="thread-snippet">
                        {item.snippet || "No preview available"}
                      </div>
                      {isSent && item.toEmails && item.toEmails.length > 1 && (
                        <div style={{ marginTop: 4, fontSize: 11, color: PALETTE.slate400 }}>
                          + {item.toEmails.length - 1} more recipient
                          {item.toEmails.length - 1 > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* ============== MESSAGE DETAIL DRAWER ============== */}
      <Drawer
        className="mail-detail-drawer"
        placement="right"
        width={720}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedThreadId(null);
          setInlinePreview(null);
        }}
        open={drawerVisible}
        title={
          inlinePreview ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                className="mail-icon-btn"
                style={{ width: 32, height: 32 }}
                onClick={() => setInlinePreview(null)}
              >
                <ArrowLeft size={14} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 600, color: PALETTE.slate900 }}>
                {inlinePreview.name}
              </span>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: PALETTE.slate500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Conversation
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: PALETTE.slate900, letterSpacing: "-0.01em" }}>
                {selectedThread?.subject || "(No Subject)"}
              </div>
            </div>
          )
        }
        extra={
          inlinePreview ? null : (
            <Space>
              {selectedFolder === "TRASH" && (
                <Tooltip title="Restore to Inbox">
                  <button
                    className="mail-icon-btn"
                    onClick={async () => {
                      if (selectedThreadId) {
                        await restoreThread(selectedThreadId);
                        message.success("Thread restored to Inbox");
                        setDrawerVisible(false);
                        setSelectedThreadId(null);
                      }
                    }}
                  >
                    <RotateCcw size={16} />
                  </button>
                </Tooltip>
              )}
              {selectedFolder !== "ARCHIVE" && selectedFolder !== "TRASH" && canUpdateMail && (
                <Tooltip title="Archive">
                  <button
                    className="mail-icon-btn"
                    onClick={async () => {
                      if (selectedThreadId) {
                        await archiveThread(selectedThreadId);
                        message.success("Thread archived");
                        setDrawerVisible(false);
                        setSelectedThreadId(null);
                      }
                    }}
                  >
                    <Archive size={16} />
                  </button>
                </Tooltip>
              )}
              {canDeleteMail && (
                <Popconfirm
                  title={selectedFolder === "TRASH" ? "Permanently delete?" : "Move to trash?"}
                  description={
                    selectedFolder === "TRASH"
                      ? "This action cannot be undone."
                      : "You can restore it later from the Trash folder."
                  }
                  onConfirm={async () => {
                    if (selectedThreadId) {
                      await deleteThread(selectedThreadId);
                      message.success(
                        selectedFolder === "TRASH"
                          ? "Thread permanently deleted"
                          : "Thread moved to trash"
                      );
                      setDrawerVisible(false);
                      setSelectedThreadId(null);
                    }
                  }}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Tooltip title="Delete">
                    <button className="mail-icon-btn" style={{ color: PALETTE.rose }}>
                      <Trash2 size={16} />
                    </button>
                  </Tooltip>
                </Popconfirm>
              )}
              <button className="mail-icon-btn">
                <MoreHorizontal size={16} />
              </button>
            </Space>
          )
        }
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {inlinePreview ? (
            <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  flex: 1,
                  background: "white",
                  borderRadius: 16,
                  border: `1px solid ${PALETTE.slate200}`,
                  overflow: "hidden",
                }}
              >
                {inlinePreview.type.startsWith("image/") ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 24,
                    }}
                  >
                    <img
                      src={inlinePreview.url}
                      alt={inlinePreview.name}
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
                    />
                  </div>
                ) : inlinePreview.type === "application/pdf" ? (
                  <iframe
                    src={`${inlinePreview.url}#toolbar=0&navpanes=0&scrollbar=1`}
                    title={inlinePreview.name}
                    style={{ width: "100%", height: "100%", border: "none" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: 60 }}>
                    <p style={{ color: PALETTE.slate500, marginBottom: 16 }}>
                      Preview not available for this file type.
                    </p>
                    <Button type="primary" href={inlinePreview.url} download={inlinePreview.name}>
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {messages.map((msg: any) => {
                  const fromName = msg.fromEmail || "Unknown";
                  return (
                    <div key={msg.id} className="message-card">
                      <div className="message-card-header">
                        <div
                          className="thread-avatar"
                          style={{ ...getAvatarStyle(fromName), width: 44, height: 44 }}
                        >
                          {getInitials(fromName)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: PALETTE.slate900 }}>
                                {fromName}
                              </div>
                              <div style={{ fontSize: 12, color: PALETTE.slate500, marginTop: 2 }}>
                                to{" "}
                                {Array.isArray(msg.toEmails)
                                  ? msg.toEmails.join(", ")
                                  : msg.toEmails}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: PALETTE.slate500,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Clock size={12} />
                                {dayjs(msg.receivedAt).format("MMM D, h:mm A")}
                              </span>
                              {canCreateMail && (
                                <Tooltip title="Reply">
                                  <button
                                    className="mail-icon-btn"
                                    style={{ width: 30, height: 30 }}
                                    onClick={() => {
                                      const ta = document.getElementById("quick-reply-textarea");
                                      if (ta) ta.focus();
                                    }}
                                  >
                                    <Reply size={14} />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="message-card-body">
                        {msg.bodyHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: msg.bodyHtml }} />
                        ) : (
                          <div style={{ whiteSpace: "pre-wrap" }}>{msg.bodyText}</div>
                        )}

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${PALETTE.slate100}` }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 14,
                              }}
                            >
                              <Paperclip size={14} color={PALETTE.slate500} />
                              <span style={{ fontSize: 13, fontWeight: 600, color: PALETTE.slate900 }}>
                                {msg.attachments.length} Attachment
                                {msg.attachments.length > 1 ? "s" : ""}
                              </span>
                              <span style={{ color: PALETTE.slate300 }}>•</span>
                              <button
                                onClick={() => downloadAsZip(msg.attachments)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: PALETTE.primary,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Download size={12} />
                                Download all
                              </button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                              {msg.attachments.map((att: any) => (
                                <div key={att.id} className="attach-card">
                                  <div
                                    className="attach-icon"
                                    style={{ background: getFileColor(att.fileName) }}
                                  >
                                    {getFileIcon(att.fileName)}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: PALETTE.slate900,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {att.fileName}
                                    </div>
                                    <div style={{ fontSize: 11, color: PALETTE.slate500, marginTop: 2 }}>
                                      {formatFileSize(att.size)}
                                    </div>
                                  </div>
                                  <Tooltip title="Preview">
                                    <button
                                      className="mail-icon-btn"
                                      style={{ width: 30, height: 30 }}
                                      onClick={() => previewAttachment(att)}
                                    >
                                      <Eye size={14} />
                                    </button>
                                  </Tooltip>
                                  <a
                                    href={`/api/mail/attachments/download?url=${encodeURIComponent(
                                      att.downloadUrl
                                    )}&filename=${encodeURIComponent(att.fileName)}`}
                                    download={att.fileName}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Tooltip title="Download">
                                      <button className="mail-icon-btn" style={{ width: 30, height: 30 }}>
                                        <Download size={14} />
                                      </button>
                                    </Tooltip>
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {canCreateMail && (
                <div className="quick-reply-wrap">
                  <div className="quick-reply-box">
                    <TextArea
                      id="quick-reply-textarea"
                      placeholder="Reply to this conversation…"
                      autoSize={{ minRows: 2, maxRows: 8 }}
                      value={quickReply}
                      onChange={(e) => setQuickReply(e.target.value)}
                      bordered={false}
                      style={{ background: "transparent", padding: 0, resize: "none" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: `1px solid ${PALETTE.slate200}`,
                      }}
                    >
                      <div style={{ display: "flex", gap: 8 }}>
                        <Tooltip title="Attach">
                          <button className="mail-icon-btn" style={{ width: 32, height: 32 }}>
                            <Paperclip size={14} />
                          </button>
                        </Tooltip>
                      </div>
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        loading={isSendingReply}
                        disabled={!quickReply.trim()}
                        className="send-gradient-btn"
                        onClick={async () => {
                          const lastMsg = messages[messages.length - 1];
                          if (!lastMsg) return;

                          setIsSendingReply(true);
                          const result = await sendMessage({
                            to: [lastMsg.fromEmail],
                            subject: lastMsg.subject.startsWith("Re:")
                              ? lastMsg.subject
                              : `Re: ${lastMsg.subject}`,
                            body: quickReply,
                            threadId: selectedThreadId || undefined,
                          });

                          if (result) {
                            message.success("Reply sent");
                            setQuickReply("");
                            if (selectedThreadId) await syncMail();
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
              )}
            </>
          )}
        </div>
      </Drawer>

      {/* ============== COMPOSE DRAWER ============== */}
      <Drawer
        className="mail-compose-drawer"
        placement="right"
        width={780}
        onClose={() => {
          setComposeVisible(false);
          setCurrentDraftId(null);
          setSelectedThreadId(null);
        }}
        open={composeVisible}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <PenSquare size={16} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: PALETTE.slate500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {currentDraftId ? "Editing draft" : "New message"}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: PALETTE.slate900 }}>
                Compose
              </div>
            </div>
          </div>
        }
        extra={
          <Space>
            {canCreateMail && (
              <Button
                onClick={async () => {
                  const values = form.getFieldsValue();
                  const cleanedAttachments = values.attachments
                    ?.map((file: any) => ({
                      filename: file.name || file.fileName,
                      url: file.url || file.response?.fileUrl || file.response?.url,
                      size: file.size,
                      contentType: file.type || file.contentType,
                    }))
                    .filter((a: any) => a.url);

                  const draftData = {
                    ...values,
                    to: values.to || [],
                    attachments: cleanedAttachments,
                    id: currentDraftId || undefined,
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
                style={{ borderRadius: 10, height: 38, fontWeight: 600 }}
              >
                Save Draft
              </Button>
            )}
            {canCreateMail && (
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={isSending}
                icon={<SendOutlined />}
                className="send-gradient-btn"
              >
                Send
              </Button>
            )}
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const cleanedAttachments = values.attachments
              ?.map((file: any) => ({
                filename: file.name || file.fileName,
                url: file.url || file.response?.fileUrl || file.response?.url,
                size: file.size,
                contentType: file.type || file.contentType,
              }))
              .filter((a: any) => a.url);

            const mailData = {
              ...values,
              to: values.to || [],
              cc: values.cc || undefined,
              bcc: values.bcc || undefined,
              attachments: cleanedAttachments,
              scheduledAt: values.scheduledAt?.toISOString() || null,
            };

            let result;
            if (currentDraftId) {
              await saveDraft({ ...mailData, id: currentDraftId });
              result = await sendDraft(currentDraftId);
            } else {
              result = await sendMessage(mailData);
            }

            if (result) {
              message.success(
                mailData.scheduledAt ? "Email scheduled successfully" : "Email sent successfully"
              );
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
          <div className="compose-section">
            <div className="compose-section-label">From</div>
            {!mailStatus ? (
              <Spin size="small" />
            ) : (
              <span style={{ fontSize: 14, color: PALETTE.slate900, fontWeight: 500 }}>
                {mailStatus.connectedEmail || "No connected email found"}
              </span>
            )}
          </div>

          <Form.Item
            name="to"
            rules={[{ required: true, message: "Recipient is required" }]}
            style={{ margin: 0 }}
          >
            <Select
              mode="tags"
              placeholder="Recipients"
              tokenSeparators={[",", " "]}
              options={contacts
                .map((u: any) => ({
                  value: u.email || "",
                  label: `${u.name} (${u.email || "No Email"})`,
                }))
                .filter((u: any) => u.value)}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase()) ||
                (option?.value ?? "")
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              variant="borderless"
              style={{ width: "100%" }}
              popupMatchSelectWidth={false}
              tagRender={(props) => (
                <span
                  style={{
                    background: "var(--mail-tint-blue)",
                    color: "var(--mail-primary)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    margin: "2px 4px 2px 0",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {props.label}
                  <X
                    size={12}
                    style={{ cursor: "pointer" }}
                    onClick={props.onClose as any}
                  />
                </span>
              )}
              suffixIcon={null}
              dropdownStyle={{ borderRadius: 10 }}
              popupClassName="compose-recipient-dropdown"
              className="compose-select"
              {...({ style: { width: "100%", padding: "10px 28px" } } as any)}
            />
          </Form.Item>
          <div style={{ borderBottom: `1px solid ${PALETTE.slate100}` }} />

          <Form.Item name="cc" style={{ margin: 0 }}>
            <Select
              mode="tags"
              placeholder="Cc"
              tokenSeparators={[",", " "]}
              options={contacts
                .map((u: any) => ({
                  value: u.email || "",
                  label: `${u.name} (${u.email || "No Email"})`,
                }))
                .filter((u: any) => u.value)}
              variant="borderless"
              style={{ width: "100%", padding: "10px 28px" }}
              popupMatchSelectWidth={false}
              suffixIcon={null}
            />
          </Form.Item>
          <div style={{ borderBottom: `1px solid ${PALETTE.slate100}` }} />

          <Form.Item name="bcc" style={{ margin: 0 }}>
            <Select
              mode="tags"
              placeholder="Bcc"
              tokenSeparators={[",", " "]}
              options={contacts
                .map((u: any) => ({
                  value: u.email || "",
                  label: `${u.name} (${u.email || "No Email"})`,
                }))
                .filter((u: any) => u.value)}
              variant="borderless"
              style={{ width: "100%", padding: "10px 28px" }}
              popupMatchSelectWidth={false}
              suffixIcon={null}
            />
          </Form.Item>
          <div style={{ borderBottom: `1px solid ${PALETTE.slate100}` }} />

          <Form.Item
            name="subject"
            rules={[{ required: true, message: "Subject is required" }]}
            style={{ margin: 0 }}
          >
            <Input
              placeholder="Subject"
              variant="borderless"
              style={{
                padding: "14px 28px",
                fontSize: 16,
                fontWeight: 600,
                color: PALETTE.slate900,
              }}
            />
          </Form.Item>
          <div style={{ borderBottom: `1px solid ${PALETTE.slate100}` }} />

          <div style={{ background: "white", padding: "16px 28px" }}>
            <Form.Item
              name="body"
              rules={[{ required: true, message: "Message body is required" }]}
              style={{ margin: 0 }}
            >
              <TiptapEditor
                content={form.getFieldValue("body")}
                onChange={(html) => form.setFieldsValue({ body: html })}
                minHeight={320}
              />
            </Form.Item>
          </div>

          <div
            style={{
              padding: "14px 28px",
              background: "white",
              borderTop: `1px solid ${PALETTE.slate200}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Form.Item
              name="attachments"
              valuePropName="fileList"
              getValueFromEvent={(e: any) => {
                if (Array.isArray(e)) return e;
                return e?.fileList;
              }}
              style={{ margin: 0 }}
            >
              <Upload
                customRequest={async ({ file, onSuccess, onError }: any) => {
                  try {
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const response = await uploadAttachment({
                          file: reader.result,
                          fileName: file.name,
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
                <Button
                  icon={<PaperClipOutlined />}
                  style={{ borderRadius: 10, height: 36, fontWeight: 500 }}
                >
                  Attach files
                </Button>
              </Upload>
            </Form.Item>

            <Form.Item name="scheduledAt" style={{ margin: 0 }}>
              <DatePicker
                showTime
                placeholder="Schedule send"
                disabledDate={(current) => current && current < dayjs().startOf("day")}
                style={{ borderRadius: 10, height: 36 }}
                suffixIcon={<Calendar size={14} />}
              />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </MainLayout>
  );
}
