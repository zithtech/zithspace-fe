"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import { useActivitySource } from '@/hooks/useActivitySource';
import React, { useState, useEffect, useMemo, Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Layout, Menu, Typography, Button, Space, Avatar, List, Divider, Empty, Input, Drawer, Badge, Modal, Form, message, Select, Popconfirm, Checkbox, Segmented, DatePicker, Upload, Popover, Tooltip, Tag, App, Spin } from "antd";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { apiClient } from "@/lib/axios";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  Wand2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  SendOutlined,
  PaperClipOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useMail, useMailThreads, useThreadMessages, useMailStatus, useMailContacts, useMailUnreadCount } from "@/hooks/useMail";
import { MailService, MailMessage } from "@/services/mailService";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TiptapEditor from "@/components/common/TiptapEditor";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import SearchableDropdown from "@/components/common/SearchableDropdown";

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
  slate900: "var(--text-slate-900)",
  slate700: "var(--text-slate-700)",
  slate500: "var(--text-slate-500)",
  slate400: "var(--text-slate-400)",
  slate300: "var(--border-slate-200)",
  slate200: "var(--border-slate-200)",
  slate100: "var(--bg-slate-100)",
  slate50: "var(--bg-slate-50)",
  white: "var(--bg-pure-white)",
  border: "var(--border-slate-200)",
};

// Avatar style generator based on read status and folder
const getAvatarStyle = (seed: string, isRead?: boolean, folder?: string) => {
  let c1, c2;
  if (folder === "SPAM") {
    c1 = "#FCA5A5"; c2 = "#EF4444"; // Light Red
  } else if (folder === "DRAFTS") {
    c1 = "#9CA3AF"; c2 = "#4B5563"; // Gray
  } else if (isRead) {
    c1 = "#64748b"; c2 = "#475569"; // Gray for read
  } else {
    c1 = "#60A5FA"; c2 = "#2563EB"; // Blue for unread
  }
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
    tint: "var(--bg-blue-50)",
  },
  {
    key: "SENT",
    label: "Sent",
    icon: Send,
    color: "var(--mail-emerald)",
    tint: "var(--bg-green-50)",
  },
  {
    key: "DRAFTS",
    label: "Drafts",
    icon: FileText,
    color: "var(--mail-text-muted)",
    tint: "var(--bg-slate-100)",
  },
  {
    key: "SPAM",
    label: "Spam",
    icon: AlertOctagon,
    color: "var(--mail-rose)",
    tint: "var(--bg-red-50)",
  },
  {
    key: "TRASH",
    label: "Trash",
    icon: Trash2,
    color: "var(--mail-text-muted)",
    tint: "var(--bg-slate-100)",
  },
  {
    key: "ARCHIVE",
    label: "Archive",
    icon: Archive,
    color: "var(--mail-text-muted)",
    tint: "var(--bg-slate-100)",
  },
];

const FILTERS: { label: string; value: any; icon?: any }[] = [
  { label: "All", value: "ALL" },
  { label: "Unread", value: "UNREAD" },
  { label: "Read", value: "READ" },
  { label: "Has Attachment", value: "HAS_ATTACHMENTS" },
  { label: "No Attachment", value: "NO_ATTACHMENTS" },
];

function MailPageContent() {
  const { message } = App.useApp();
  const {
    canCreateMail,
    canUpdateMail,
    canDeleteMail,
    canManageMail
  } = usePermission();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [filter, setFilter] = useState<
    "ALL" | "READ" | "UNREAD" | "HAS_ATTACHMENTS" | "NO_ATTACHMENTS"
  >("ALL");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [toFilter, setToFilter] = useState<string | null>(null);
  const [fromFilter, setFromFilter] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: threadsData = [], isLoading: threadsLoading } = useMailThreads(
    selectedFolder,
    filter,
    debouncedSearch,
    toFilter || undefined,
    fromFilter || undefined
  );
  const { data: messages = [], isLoading: messagesLoading } = useThreadMessages(selectedThreadId);
  const { data: mailStatus } = useMailStatus();
  const { data: folderCountsData } = useMailUnreadCount();
  const folderCounts = folderCountsData?.counts || {};
  const globalUnreadCount = folderCountsData?.unreadCount || 0;
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

  const [isFixingGrammar, setIsFixingGrammar] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isFixingReplyGrammar, setIsFixingReplyGrammar] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mail_last_sync");
      if (saved) setLastSyncTime(new Date(saved));
    }
  }, []);

  const processedConnection = React.useRef(false);

  useEffect(() => {
    if (searchParams && searchParams.get('connected') === 'true' && !processedConnection.current) {
      processedConnection.current = true;
      const provider = searchParams.get('provider');
      if (provider) {
        message.success(`Mail connected successfully! Syncing your emails...`);
        syncMail();
        router.replace(pathname || '/mail');
      }
    }
  }, [searchParams, pathname, router, syncMail]);

  const prevSyncingRef = React.useRef(isSyncing);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSyncing && !prevSyncingRef.current) {
      message.success("Mail sync initiated...");
    }

    if (!isSyncing && prevSyncingRef.current) {
      setSyncProgress(100);
      setTimeout(() => {
        message.success("Mail synced successfully.");
        setSyncProgress(null);
        const now = new Date();
        setLastSyncTime(now);
        localStorage.setItem("mail_last_sync", now.toISOString());
      }, 800);
    }

    prevSyncingRef.current = isSyncing;

    if (isSyncing) {
      setSyncProgress(0);
      interval = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev === null) return 0;
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 300);
    }

    return () => clearInterval(interval);
  }, [isSyncing]);

  const fixComposeGrammar = async () => {
    const body = form.getFieldValue("body");
    if (!body || !String(body).trim()) {
      message.warning("Write something first, then fix grammar");
      return;
    }
    setIsFixingGrammar(true);
    try {
      const res: any = await MailService.correctMailGrammar({ body });
      const corrected = res?.body || res?.data?.body;
      if (corrected) {
        form.setFieldsValue({ body: corrected });
        message.success("Grammar corrected");
      } else {
        message.error("Could not correct grammar");
      }
    } catch (err) {
      console.error(err);
      message.error("Could not correct grammar");
    } finally {
      setIsFixingGrammar(false);
    }
  };

  const enhanceComposeBody = async () => {
    const body = form.getFieldValue("body");
    const subject = form.getFieldValue("subject");
    if (!body || !String(body).trim()) {
      message.warning("Write something first, then enhance");
      return;
    }
    setIsEnhancing(true);
    try {
      const res: any = await MailService.enhanceMailContent({ subject, body });
      const enhanced = res?.body || res?.data?.body;
      if (enhanced) {
        form.setFieldsValue({ body: enhanced });
        message.success("Email enhanced");
      } else {
        message.error("Could not enhance email");
      }
    } catch (err) {
      console.error(err);
      message.error("Could not enhance email");
    } finally {
      setIsEnhancing(false);
    }
  };

  const fixReplyGrammar = async () => {
    if (!quickReply.trim()) {
      message.warning("Type a reply first");
      return;
    }
    setIsFixingReplyGrammar(true);
    try {
      const res: any = await MailService.correctMailGrammar({ body: quickReply });
      const corrected = res?.body || res?.data?.body;
      if (corrected) {
        setQuickReply(typeof corrected === "string" ? corrected.replace(/<[^>]*>/g, "") : corrected);
        message.success("Grammar corrected");
      } else {
        message.error("Could not correct grammar");
      }
    } catch (err) {
      console.error(err);
      message.error("Could not correct grammar");
    } finally {
      setIsFixingReplyGrammar(false);
    }
  };

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
        return "#EF4444";
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
        return "#6B7280";
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
    const fileName = att.fileName || "";
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    const isPdf =
      att.mimeType === "application/pdf" ||
      att.contentType === "application/pdf" ||
      ext === "pdf";

    const isImage =
      att.mimeType?.startsWith("image/") ||
      att.contentType?.startsWith("image/") ||
      ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);

    try {
      // Use backend proxy with authenticated apiClient to fetch blob
      const proxyUrl = `/api/mail/attachments/download?url=${encodeURIComponent(att.downloadUrl)}&filename=${encodeURIComponent(att.fileName)}&mode=inline&attachmentId=${encodeURIComponent(att.id)}`;
      const response = await apiClient.get(proxyUrl, { responseType: 'blob' });

      // Determine Content Type from response headers or fall back to mimeType or inference
      const responseType = response.headers?.['content-type'] || response.headers?.['Content-Type'];
      let resolvedType = responseType || att.mimeType || att.contentType || "application/octet-stream";

      if (resolvedType === "application/octet-stream" || !resolvedType) {
        if (isPdf) resolvedType = "application/pdf";
        else if (isImage) {
          resolvedType = `image/${ext === "jpg" ? "jpeg" : ext}`;
        }
      }

      const blob = new Blob([response.data], { type: resolvedType });
      const blobUrl = URL.createObjectURL(blob);

      setInlinePreview({
        url: blobUrl,
        name: att.fileName,
        type: resolvedType,
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
    setExpandedMessages({});
  }, [selectedThreadId]);

  const uniqueParticipants = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const m of messages as any[]) {
      const e = m?.fromEmail;
      if (e && !seen.has(e)) {
        seen.add(e);
        out.push(e);
      }
    }
    return out;
  }, [messages]);

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

  const unreadCount = globalUnreadCount;

  const activeFolder = FOLDERS.find((f) => f.key === selectedFolder)!;

  return (
    <MainLayout>
      <style>{`
        .ant-message, .ant-message-wrapper {
          z-index: 100000 !important;
        }

        /* Sidebar Toggle Button */
        .mail-sidebar-show-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-pure-white);
          border: 1px solid ${PALETTE.slate200};
          color: ${PALETTE.slate500};
          cursor: pointer;
          transition: all 0.2s;
        }
        .mail-sidebar-show-toggle:hover {
          background: var(--bg-slate-50);
          color: ${PALETTE.slate900};
          border-color: ${PALETTE.slate300};
        }
        [data-theme='dark'] .mail-sidebar-show-toggle {
          background: #1e293b;
          border-color: #334155;
          color: #94a3b8;
        }
        [data-theme='dark'] .mail-sidebar-show-toggle:hover {
          background: #334155;
          color: #f8fafc;
        }

        .mail-shell {
          display: flex;
          height: calc(100vh - 60px);
          overflow: hidden;
        }
        .mail-shell.is-sidebar-closed .mail-sidebar {
          display: none;
        }

        .mail-sidebar {
          width: 224px;
          flex-shrink: 0;
          background: var(--bg-pure-white);
          border-right: 1px solid ${PALETTE.slate200};
          display: flex;
          flex-direction: column;
          padding: 12px 10px;
        }
        .mail-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid ${PALETTE.slate200};
        }
        .mail-side-logo {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .mail-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .mail-side-title { font-size: 16px; font-weight: 800; color: ${PALETTE.slate900}; letter-spacing: -0.025em; line-height: 1.1; }
        .mail-side-subtitle {
          font-size: 10.5px; color: ${PALETTE.slate500}; font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .mail-compose-btn {
          height: 34px;
          border: 1px solid #2563EB;
          border-radius: 8px;
          background: #2563EB;
          color: #fff;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: opacity 0.15s ease;
          width: 100%;
        }
        .mail-compose-btn:hover { background: #eff6ff; }
        [data-theme='dark'] .mail-compose-btn:hover { background: rgba(37,99,235,0.15); }

        .mail-sidebar-backdrop { display: none; }

        @media (max-width: 1099.98px) {
          .mail-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            max-height: none;
            z-index: 1050;
            background: var(--bg-pure-white);
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
            box-shadow: 4px 0 24px rgba(0,0,0,0.15);
            opacity: 1 !important;
            pointer-events: auto !important;
          }
          [data-theme='dark'] .mail-sidebar {
            background: #0B0F1A !important;
            border-right-color: #1F2937 !important;
          }
          .mail-shell.is-sidebar-open .mail-sidebar {
            transform: translateX(0);
            display: flex; /* Override display: none from desktop if it was closed */
          }
          .mail-shell.is-sidebar-closed .mail-sidebar {
            transform: translateX(-100%);
            display: flex;
          }
          .mail-sidebar-backdrop {
            display: block !important;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.45);
            z-index: 1040;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          .mail-sidebar-backdrop.is-open {
            opacity: 1;
            pointer-events: auto;
          }
        }

        .mail-folder-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 7px 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background .12s ease;
          text-align: left;
          margin-bottom: 1px;
        }
        .mail-folder-item:hover {
          background: ${PALETTE.slate50};
        }
        .mail-folder-item.active {
          background: var(--bg-blue-50);
        }
        .mail-folder-icon {
          font-size: 14px;
          width: 16px;
          display: inline-flex;
          justify-content: center;
          color: ${PALETTE.slate500};
        }
        .mail-folder-item.active .mail-folder-icon {
          color: var(--mail-primary);
        }
        .mail-folder-label {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: ${PALETTE.slate700};
        }
        .mail-folder-item.active .mail-folder-label {
          color: ${PALETTE.slate900};
          font-weight: 600;
        }
        .mail-folder-count {
          margin-left: auto;
          font-size: 11.5px;
          font-weight: 600;
          color: ${PALETTE.slate400};
          min-width: 18px;
          text-align: right;
        }
        .mail-folder-item.active .mail-folder-count {
          color: var(--mail-primary);
          font-weight: 700;
          background: var(--bg-blue-50);
          border-radius: 6px;
          padding: 1px 7px;
          min-width: 0;
        }

        .mail-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .mail-topbar {
          height: 48px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: var(--bg-pure-white);
          border-bottom: 1px solid ${PALETTE.slate200};
          flex-shrink: 0;
        }
        .mail-search {
          flex: 1;
          max-width: 420px;
          height: 36px;
          background: var(--bg-slate-50);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 6px;
          padding: 0 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: border-color 0.15s, background 0.15s;
        }
        .mail-search:focus-within {
          border-color: var(--mail-border-strong);
          background: var(--bg-pure-white);
        }
        .mail-search input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: ${PALETTE.slate900};
        }
        .mail-search input::placeholder { color: ${PALETTE.slate400}; }
        .mail-kbd {
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 10px;
          color: ${PALETTE.slate500};
          background: var(--bg-pure-white);
          padding: 1px 5px;
          border-radius: 3px;
          border: 1px solid ${PALETTE.slate200};
        }
        .mail-icon-btn {
          width: 30px; height: 30px;
          border-radius: 6px;
          background: transparent;
          border: 1px solid transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: ${PALETTE.slate700};
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .mail-icon-btn:hover {
          background: var(--bg-slate-100);
          border-color: ${PALETTE.slate200};
        }

        .mail-header-section {
          padding: 14px 20px 8px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .mail-folder-title {
          display: flex; align-items: baseline; gap: 8px;
        }
        .mail-folder-title h1 {
          font-size: 15px; font-weight: 600; margin: 0;
          color: ${PALETTE.slate900};
          letter-spacing: -0.01em;
        }
        .mail-folder-title .count {
          font-size: 12px; font-weight: 500;
          color: ${PALETTE.slate500};
          font-variant-numeric: tabular-nums;
        }

        .mail-toolbar {
          padding: 0 20px 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .filter-pill {
          padding: 3px 10px;
          height: 26px;
          border-radius: 6px;
          background: transparent;
          border: 1px solid transparent;
          font-size: 12px;
          font-weight: 500;
          color: ${PALETTE.slate500};
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
        }
        .filter-pill:hover { color: ${PALETTE.slate900}; background: var(--bg-slate-100); }
        .filter-pill.active {
          background: var(--bg-slate-100);
          color: ${PALETTE.slate900};
          border-color: ${PALETTE.slate200};
        }

        .bulk-bar {
          margin-left: auto;
          display: flex; align-items: center; gap: 4px;
          padding: 2px 4px 2px 10px;
          background: var(--bg-pure-white);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 6px;
          height: 28px;
        }
        .bulk-bar .count {
          font-size: 11px; font-weight: 600;
          color: ${PALETTE.slate900};
          padding-right: 8px;
          border-right: 1px solid ${PALETTE.slate200};
        }
        .bulk-action-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 3px 8px;
          background: transparent; border: none;
          border-radius: 4px;
          font-size: 12px; font-weight: 500;
          color: ${PALETTE.slate700};
          cursor: pointer;
          height: 22px;
        }
        .bulk-action-btn:hover { background: var(--bg-slate-100); }
        .bulk-action-btn.danger { color: ${PALETTE.rose}; }
        .bulk-action-btn.danger:hover { background: var(--bg-red-50); }

        .mail-thread-list-wrap {
          flex: 1; overflow-y: auto;
          padding: 0;
          border-top: 1px solid ${PALETTE.slate200};
        }
        .mail-thread-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 20px;
          background: var(--bg-pure-white);
          border-bottom: 1px solid ${PALETTE.slate100};
          cursor: pointer;
          transition: background 0.1s ease;
          position: relative;
        }
        .mail-thread-card:hover {
          background: var(--bg-slate-50);
        }
        .mail-thread-card.selected {
          background: var(--bg-blue-50);
        }
        .mail-thread-card.selected::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 2px;
          background: var(--mail-primary);
        }
        .mail-thread-card.unread .thread-sender,
        .mail-thread-card.unread .thread-subject {
          color: ${PALETTE.slate900};
        }
        .mail-thread-card.unread .unread-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--mail-primary);
          flex-shrink: 0;
        }
        .unread-dot {
          width: 6px;
        }
        .thread-checkbox-wrap {
          display: flex; align-items: center;
        }
        .thread-avatar {
          width: 28px; height: 28px;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 11px;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }
        .thread-meta { flex: 1; min-width: 0; }
        .thread-row1 {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; margin-bottom: 1px;
        }
        .thread-sender {
          font-size: 13px; font-weight: 500;
          color: ${PALETTE.slate700};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .thread-sender.unread { font-weight: 600; color: ${PALETTE.slate900}; }
        .thread-time {
          font-size: 11px; color: ${PALETTE.slate500};
          white-space: nowrap;
          display: flex; align-items: center; gap: 5px;
          font-variant-numeric: tabular-nums;
        }
        .thread-subject {
          font-size: 12.5px;
          color: ${PALETTE.slate700};
          font-weight: 400;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .thread-subject.unread { color: ${PALETTE.slate900}; font-weight: 600; }
        .thread-subject .snippet {
          color: ${PALETTE.slate500};
          font-weight: 400;
        }

        .mail-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 64px 20px;
          text-align: center;
        }
        .mail-empty-icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          background: var(--bg-slate-50);
          border: 1px solid ${PALETTE.slate200};
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
          color: ${PALETTE.slate500};
        }
        .mail-empty h3 {
          font-size: 14px; font-weight: 600;
          color: ${PALETTE.slate900};
          margin: 0 0 4px;
        }
        .mail-empty p {
          font-size: 13px; color: ${PALETTE.slate500};
          margin: 0;
        }

        .skeleton-row {
          height: 56px; background: var(--bg-pure-white);
          border-bottom: 1px solid ${PALETTE.slate100};
          padding: 10px 20px;
          display: flex; gap: 10px;
          align-items: center;
        }
        .skeleton-shape {
          background: linear-gradient(90deg, ${PALETTE.slate100} 25%, ${PALETTE.slate200} 50%, ${PALETTE.slate100} 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.4s infinite linear;
          border-radius: 4px;
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Drawer overrides */
        .mail-detail-drawer .ant-drawer-header,
        .mail-compose-drawer .ant-drawer-header {
          padding: 14px 24px;
          border-bottom: 1px solid ${PALETTE.slate200};
          background: var(--bg-pure-white);
        }
        .mail-detail-drawer .ant-drawer-body,
        .mail-compose-drawer .ant-drawer-body {
          padding: 0;
          background: var(--bg-pure-white);
        }
        .mail-detail-drawer .ant-drawer-content,
        .mail-compose-drawer .ant-drawer-content {
          background: var(--bg-pure-white);
        }
        .mail-detail-drawer .ant-drawer-close,
        .mail-compose-drawer .ant-drawer-close {
          color: ${PALETTE.slate500};
        }

        .convo-header {
          padding: 18px 24px 14px;
          border-bottom: 1px solid ${PALETTE.slate200};
          background: var(--bg-pure-white);
        }
        .convo-subject {
          font-size: 18px; font-weight: 700;
          color: ${PALETTE.slate900};
          letter-spacing: -0.015em;
          margin: 0;
          line-height: 1.3;
        }
        .convo-meta {
          margin-top: 6px;
          display: flex; align-items: center; gap: 8px;
          font-size: 11.5px; color: ${PALETTE.slate500};
          font-weight: 500;
        }
        .convo-meta .dot { color: ${PALETTE.slate300}; font-size: 10px; }
        .convo-meta .avatars { display: flex; align-items: center; }
        .convo-meta .pa-avatar {
          width: 20px; height: 20px;
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
          color: white;
          margin-left: -5px;
          border: 1.5px solid var(--bg-pure-white);
          letter-spacing: 0.02em;
        }
        .convo-meta .pa-avatar:first-child { margin-left: 0; }

        .msg-row {
          padding: 0 24px;
          border-bottom: 1px solid ${PALETTE.slate100};
          background: var(--bg-pure-white);
          transition: background 0.12s;
        }
        .msg-row:last-child { border-bottom: none; }
        .msg-row.collapsed .msg-body,
        .msg-row.collapsed .msg-attachments,
        .msg-row.collapsed .msg-to { display: none; }
        .msg-row.collapsed .msg-head {
          padding: 11px 0;
          cursor: pointer;
        }
        .msg-row.collapsed:hover { background: var(--bg-slate-50); }
        .msg-row.collapsed .msg-snippet {
          flex: 1; min-width: 0;
          font-size: 12.5px;
          color: ${PALETTE.slate500};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-weight: 400;
        }
        .msg-head {
          padding: 14px 0 6px;
          display: flex; align-items: center; gap: 10px;
        }
        .msg-avatar {
          width: 28px; height: 28px;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 11px;
          flex-shrink: 0;
          letter-spacing: 0.02em;
          color: white;
        }
        .msg-identity { min-width: 0; flex: 0 0 auto; }
        .msg-name {
          font-size: 13.5px; font-weight: 600;
          color: ${PALETTE.slate900};
          letter-spacing: -0.005em;
          line-height: 1.2;
        }
        .msg-to {
          font-size: 11.5px;
          color: ${PALETTE.slate500};
          margin-top: 1px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .msg-time {
          font-size: 11.5px;
          color: ${PALETTE.slate500};
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          display: flex; align-items: center; gap: 5px;
          flex-shrink: 0;
        }
        .msg-body {
          padding: 4px 0 16px 38px;
          font-size: 13.5px; line-height: 1.65;
          color: ${PALETTE.slate700};
        }
        .msg-body img { max-width: 100%; height: auto; border-radius: 6px; }
        .msg-attachments { padding: 0 0 18px 38px; }

        .attach-card {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          background: var(--bg-pure-white);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 8px;
          width: 280px;
          max-width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .attach-card:hover {
          border-color: ${PALETTE.slate300};
          background: var(--bg-slate-50);
        }
        .attach-icon {
          width: 32px; height: 32px;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          color: white;
          flex-shrink: 0;
        }

        .quick-reply-wrap {
          background: var(--bg-pure-white);
          border-top: 1px solid ${PALETTE.slate200};
          padding: 14px 24px;
        }
        .quick-reply-box {
          background: var(--bg-pure-white);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 8px;
          padding: 10px 12px;
          transition: border-color 0.15s;
        }
        .quick-reply-box:focus-within {
          border-color: var(--mail-border-strong);
        }

        .compose-section {
          background: var(--bg-pure-white);
          border-bottom: 1px solid ${PALETTE.slate100};
          padding: 6px 24px;
          display: flex; align-items: center; gap: 10px;
          min-height: 38px;
        }
        .compose-section-label {
          font-size: 12px; font-weight: 500;
          color: ${PALETTE.slate500};
          width: 36px;
          flex-shrink: 0;
        }
        .compose-cc-toggle {
          margin-left: auto;
          display: flex; gap: 4px;
          font-size: 11.5px; font-weight: 500;
        }
        .compose-cc-toggle button {
          background: transparent; border: none;
          color: ${PALETTE.slate500};
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .compose-cc-toggle button:hover { background: var(--bg-slate-100); color: ${PALETTE.slate900}; }
        .compose-cc-toggle button.active { color: var(--mail-primary); }

        .send-gradient-btn {
          background: var(--mail-pill-active-bg) !important;
          border: 1px solid var(--mail-pill-active-bg) !important;
          height: 30px !important;
          padding: 0 14px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          color: var(--mail-pill-active-fg) !important;
        }
        .send-gradient-btn:hover { opacity: 0.88 !important; }

        .ai-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px;
          height: 26px;
          background: var(--bg-pure-white);
          border: 1px solid ${PALETTE.slate200};
          border-radius: 999px;
          font-size: 12px; font-weight: 500;
          color: ${PALETTE.slate700};
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .ai-pill:hover:not(:disabled) {
          border-color: var(--mail-primary);
          color: var(--mail-primary);
          background: var(--bg-blue-50);
        }
        .ai-pill:disabled { opacity: 0.55; cursor: not-allowed; }
        .ai-pill .ai-icon {
          color: var(--mail-violet);
        }
        .ai-pill:hover:not(:disabled) .ai-icon {
          color: var(--mail-primary);
        }

        .ai-toolbar {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 24px;
          background: var(--bg-pure-white);
          border-bottom: 1px solid ${PALETTE.slate100};
          flex-wrap: wrap;
        }
        .ai-toolbar-label {
          font-size: 11.5px; font-weight: 500;
          color: ${PALETTE.slate500};
          margin-right: 4px;
        }
        .ai-pill {
          padding: 3px 9px !important;
          height: 24px !important;
          border-radius: 6px !important;
          background: transparent !important;
          border: 1px solid ${PALETTE.slate200} !important;
          font-size: 12px !important;
        }

        .mail-thread-list-wrap::-webkit-scrollbar { width: 8px; }
        .mail-thread-list-wrap::-webkit-scrollbar-thumb {
          background: ${PALETTE.slate200}; border-radius: 8px;
        }
        .mail-thread-list-wrap::-webkit-scrollbar-thumb:hover { background: ${PALETTE.slate300}; }
      `}</style>

      <div className={`mail-shell ${isSidebarOpen ? 'is-sidebar-open' : 'is-sidebar-closed'}`}>
        <div
          className={`mail-sidebar-backdrop ${isSidebarOpen ? 'is-open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
        {/* ============== SIDEBAR ============== */}
        <aside className="mail-sidebar">
          <div className="mail-side-head">
            <div className="mail-side-logo">
              <Mail size={24} strokeWidth={2} color={PALETTE.slate900} />
            </div>
            <div className="mail-side-head-text">
              <div className="mail-side-title">Mail</div>
              <div className="mail-side-subtitle">
                {mailStatus?.connectedEmail || "Inbox · Sent · Drafts"}
              </div>
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
              <PenSquare size={13} strokeWidth={2.2} />
              Compose
            </button>
          )}

          <div style={{ marginTop: 18, padding: "0 10px 6px", fontSize: 10.5, fontWeight: 600, color: PALETTE.slate400, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Folders
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {FOLDERS.map((f) => {
              const Icon = f.icon;
              const isActive = selectedFolder === f.key;
              const count = folderCounts[f.key] || 0;
              return (
                <div
                  key={f.key}
                  className={`mail-folder-item ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedFolder(f.key)}
                >
                  <div className="mail-folder-icon">
                    <Icon size={14} strokeWidth={2} />
                  </div>
                  <span className="mail-folder-label">{f.label}</span>

                  {f.key === "INBOX" && unreadCount > 0 ? (
                    <span className="mail-folder-count" style={!isActive ? { color: "var(--mail-primary)", fontWeight: 600 } : {}}>
                      {unreadCount}
                    </span>
                  ) : (
                    <span className="mail-folder-count">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ============== MAIN ============== */}
        <main className="mail-main">
          <div className="mail-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <Tooltip title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'} placement="bottom">
                <button
                  type="button"
                  className="mail-sidebar-show-toggle"
                  onClick={() => setIsSidebarOpen((v) => !v)}
                  aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                  aria-pressed={!isSidebarOpen}
                >
                  {isSidebarOpen ? (
                    <MenuFoldOutlined style={{ fontSize: 14 }} />
                  ) : (
                    <MenuUnfoldOutlined style={{ fontSize: 14 }} />
                  )}
                </button>
              </Tooltip>

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

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <SearchableDropdown
                  placeholder="To..."
                  options={contacts
                    .map((u: any) => ({
                      value: u.email || "",
                      label: `${u.name || ''} ${u.email ? `(${u.email})` : ""}`.trim(),
                    }))
                    .filter((u: any) => u.value)}
                  value={toFilter || ""}
                  onChange={(val) => setToFilter(val || null)}
                  style={{ width: 140 }}
                  allowClear
                />
                <SearchableDropdown
                  placeholder="From..."
                  options={contacts
                    .map((u: any) => ({
                      value: u.email || "",
                      label: `${u.name || ''} ${u.email ? `(${u.email})` : ""}`.trim(),
                    }))
                    .filter((u: any) => u.value)}
                  value={fromFilter || ""}
                  onChange={(val) => setFromFilter(val || null)}
                  style={{ width: 140 }}
                  allowClear
                />
              </div>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {syncProgress !== null ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: PALETTE.emerald, fontWeight: 600 }}>
                        {syncProgress}%
                      </span>
                      <div style={{ width: 60, height: 4, background: PALETTE.slate200, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${syncProgress}%`, height: "100%", background: PALETTE.emerald, transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  ) : lastSyncTime ? (
                    <span style={{ fontSize: 11, color: PALETTE.slate500, fontWeight: 500 }}>
                      Last sync: {dayjs(lastSyncTime).format("MMM D, h:mm A")}
                    </span>
                  ) : null}
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
                </div>
              )}
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </Space>
          </div>

          <div className="mail-header-section">
            <div className="mail-folder-title">
              <h1>{activeFolder.label}</h1>
              {threads.length > 0 && (
                <span className="count">
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
            <div style={{ width: 1, height: 16, background: PALETTE.slate200, margin: "0 4px" }} />

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
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="skeleton-row">
                    <div className="skeleton-shape" style={{ width: 28, height: 28, borderRadius: 6 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-shape" style={{ height: 10, width: "26%", marginBottom: 6 }} />
                      <div className="skeleton-shape" style={{ height: 9, width: "72%" }} />
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
                    {isUnread ? <span className="unread-dot" /> : <span className="unread-dot" style={{ background: "transparent" }} />}
                    <div className="thread-avatar" style={getAvatarStyle(sender, item.isRead, selectedFolder)}>
                      {getInitials(sender)}
                    </div>
                    <div className="thread-meta">
                      <div className="thread-row1">
                        <span className={`thread-sender ${isUnread ? "unread" : ""}`}>
                          {sender}
                          {isSent && item.toEmails && item.toEmails.length > 1 && (
                            <span style={{ color: PALETTE.slate400, fontWeight: 400, marginLeft: 6 }}>
                              +{item.toEmails.length - 1}
                            </span>
                          )}
                        </span>
                        <span className="thread-time">
                          {item.hasAttachments && <Paperclip size={11} />}
                          {dayjs(item.lastMessageAt).format("MMM D")}
                        </span>
                      </div>
                      <div className={`thread-subject ${isUnread ? "unread" : ""}`}>
                        {item.subject || "(No Subject)"}
                        {item.snippet && (
                          <span className="snippet"> — {item.snippet}</span>
                        )}
                      </div>
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
            <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", overflow: "hidden" }}>
              <button
                className="mail-icon-btn"
                style={{ width: 32, height: 32, flexShrink: 0 }}
                onClick={() => setInlinePreview(null)}
              >
                <ArrowLeft size={14} />
              </button>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: PALETTE.slate900,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
                minWidth: 0
              }}>
                {inlinePreview.name}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 500, color: PALETTE.slate500 }}>
              {selectedThread?.fromAddress || "Conversation"}
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
              <div className="convo-header">
                <h2 className="convo-subject">{selectedThread?.subject || "(No Subject)"}</h2>
                <div className="convo-meta">
                  <div className="avatars">
                    {uniqueParticipants.slice(0, 4).map((p) => (
                      <div key={p} className="pa-avatar" style={getAvatarStyle(p, selectedThread?.isRead, selectedFolder)} title={p}>
                        {getInitials(p)}
                      </div>
                    ))}
                    {uniqueParticipants.length > 4 && (
                      <div
                        className="pa-avatar"
                        style={{ background: PALETTE.slate200, color: PALETTE.slate700 }}
                      >
                        +{uniqueParticipants.length - 4}
                      </div>
                    )}
                  </div>
                  <span>
                    {messages.length} {messages.length === 1 ? "message" : "messages"}
                  </span>
                  <span className="dot">•</span>
                  <span>
                    {uniqueParticipants.length}{" "}
                    {uniqueParticipants.length === 1 ? "participant" : "participants"}
                  </span>
                </div>
              </div>

              <div className="convo-body">
                {messages.map((msg: any, idx: number) => {
                  const fromName = msg.fromEmail || "Unknown";
                  const isLast = idx === messages.length - 1;
                  const isExpanded =
                    msg.id in expandedMessages ? expandedMessages[msg.id] : isLast;
                  const toggleExpand = () =>
                    setExpandedMessages((prev) => ({ ...prev, [msg.id]: !isExpanded }));
                  return (
                    <div
                      key={msg.id}
                      className={`msg-row ${!isExpanded ? "collapsed" : ""}`}
                    >
                      <div
                        className="msg-head"
                        onClick={!isExpanded ? toggleExpand : undefined}
                      >
                        <div className="msg-avatar" style={getAvatarStyle(fromName, selectedThread?.isRead, selectedFolder)}>
                          {getInitials(fromName)}
                        </div>

                        {!isExpanded ? (
                          <>
                            <div className="msg-identity">
                              <div className="msg-name">{fromName}</div>
                            </div>
                            <div className="msg-snippet">
                              {msg.snippet || (msg.bodyText ? msg.bodyText.slice(0, 140) : "")}
                            </div>
                            <span className="msg-time">
                              {dayjs(msg.receivedAt).format("MMM D")}
                            </span>
                            <ChevronDown size={14} color={PALETTE.slate400} style={{ flexShrink: 0 }} />
                          </>
                        ) : (
                          <>
                            <div className="msg-identity" style={{ flex: 1, minWidth: 0 }}>
                              <div className="msg-name">{fromName}</div>
                              <div className="msg-to">
                                to{" "}
                                {Array.isArray(msg.toEmails)
                                  ? msg.toEmails.join(", ")
                                  : msg.toEmails}
                              </div>
                            </div>
                            <span className="msg-time">
                              <Clock size={11} />
                              {dayjs(msg.receivedAt).format("MMM D, h:mm A")}
                            </span>
                            {canCreateMail && (
                              <Tooltip title="Reply">
                                <button
                                  className="mail-icon-btn"
                                  style={{ width: 26, height: 26 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const ta = document.getElementById("quick-reply-textarea");
                                    if (ta) ta.focus();
                                  }}
                                >
                                  <Reply size={13} />
                                </button>
                              </Tooltip>
                            )}
                            {messages.length > 1 && (
                              <Tooltip title="Collapse">
                                <button
                                  className="mail-icon-btn"
                                  style={{ width: 26, height: 26 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand();
                                  }}
                                >
                                  <ChevronUp size={13} />
                                </button>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </div>

                      <div className="msg-body">
                        {msg.bodyHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: msg.bodyHtml }} />
                        ) : (
                          <div style={{ whiteSpace: "pre-wrap" }}>{msg.bodyText}</div>
                        )}
                      </div>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="msg-attachments">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 8,
                              fontSize: 11.5,
                              fontWeight: 500,
                              color: PALETTE.slate500,
                            }}
                          >
                            <Paperclip size={12} />
                            <span>
                              {msg.attachments.length}{" "}
                              {msg.attachments.length > 1 ? "attachments" : "attachment"}
                            </span>
                            <span style={{ color: PALETTE.slate300 }}>•</span>
                            <button
                              onClick={() => downloadAsZip(msg.attachments)}
                              style={{
                                background: "none",
                                border: "none",
                                color: PALETTE.primary,
                                fontSize: 11.5,
                                fontWeight: 500,
                                cursor: "pointer",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Download size={11} />
                              Download all
                            </button>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                                      fontSize: 12.5,
                                      fontWeight: 500,
                                      color: PALETTE.slate900,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {att.fileName}
                                  </div>
                                  <div style={{ fontSize: 10.5, color: PALETTE.slate500, marginTop: 1 }}>
                                    {formatFileSize(att.size)}
                                  </div>
                                </div>
                                <Tooltip title="Preview">
                                  <button
                                    className="mail-icon-btn"
                                    style={{ width: 24, height: 24, flexShrink: 0 }}
                                    onClick={() => previewAttachment(att)}
                                  >
                                    <Eye size={12} />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Download">
                                  <button
                                    className="mail-icon-btn"
                                    style={{ width: 24, height: 24, flexShrink: 0 }}
                                    onClick={() => downloadAttachment(att)}
                                  >
                                    <Download size={12} />
                                  </button>
                                </Tooltip>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <Tooltip title="Attach">
                          <button type="button" className="mail-icon-btn" style={{ width: 28, height: 28 }}>
                            <Paperclip size={13} />
                          </button>
                        </Tooltip>
                        <button
                          type="button"
                          className="ai-pill"
                          onClick={fixReplyGrammar}
                          disabled={isFixingReplyGrammar || !quickReply.trim()}
                        >
                          {isFixingReplyGrammar ? (
                            <Spin indicator={<LoadingOutlined className="ai-icon" />} />
                          ) : (
                            <CheckCircle2 size={13} className="ai-icon" />
                          )}
                          Fix grammar
                        </button>
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
                          try {
                            const result = await sendMessage({
                              to: [lastMsg.fromEmail],
                              subject: lastMsg.subject.startsWith("Re:")
                                ? lastMsg.subject
                                : `Re: ${lastMsg.subject}`,
                              body: quickReply,
                              threadId: selectedThreadId || undefined,
                            });

                            message.success("Reply sent");
                            setQuickReply("");
                            setDrawerVisible(false);
                            if (selectedThreadId) await syncMail();
                          } catch (err: any) {
                            console.error("Failed to send reply:", err);
                            message.error(err.message || "Failed to send reply");
                          } finally {
                            setIsSendingReply(false);
                          }
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
          <div style={{ fontSize: 15, fontWeight: 600, color: PALETTE.slate900, letterSpacing: "-0.005em" }}>
            {currentDraftId ? "Draft" : "New message"}
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
                style={{ borderRadius: 6, height: 30, fontWeight: 600, fontSize: 13 }}
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

            try {
              if (currentDraftId) {
                await saveDraft({ ...mailData, id: currentDraftId });
                await sendDraft(currentDraftId);
              } else {
                await sendMessage(mailData);
              }

              message.success(
                mailData.scheduledAt ? "Email scheduled successfully" : "Email sent successfully"
              );
              setComposeVisible(false);
              setCurrentDraftId(null);
              setSelectedThreadId(null);
              form.resetFields();
            } catch (err: any) {
              console.error("Failed to process email:", err);
              message.error(err.message || "Failed to process email");
            }
          }}
          initialValues={{ to: [], cc: [], bcc: [], subject: "", body: "" }}
        >
          <div className="compose-section">
            <div className="compose-section-label">From</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {!mailStatus ? (
                <Spin indicator={<LoadingOutlined className="ai-icon" />} />
              ) : (
                <span style={{ fontSize: 13, color: PALETTE.slate700 }}>
                  {mailStatus.connectedEmail || "No connected email found"}
                </span>
              )}
            </div>
            <div className="compose-cc-toggle">
              <button
                type="button"
                className={showCc ? "active" : ""}
                onClick={() => setShowCc((v) => !v)}
              >
                Cc
              </button>
              <button
                type="button"
                className={showBcc ? "active" : ""}
                onClick={() => setShowBcc((v) => !v)}
              >
                Bcc
              </button>
            </div>
          </div>

          <div className="compose-section">
            <div className="compose-section-label">To</div>
            <Form.Item
              name="to"
              rules={[{ required: true, message: "Recipient is required" }]}
              style={{ margin: 0, flex: 1, minWidth: 0 }}
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
                      background: "var(--bg-slate-100)",
                      color: PALETTE.slate900,
                      padding: "1px 7px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      margin: "1px 4px 1px 0",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {props.label}
                    <X
                      size={11}
                      style={{ cursor: "pointer" }}
                      onClick={props.onClose as any}
                    />
                  </span>
                )}
                suffixIcon={null}
                dropdownStyle={{ borderRadius: 8 }}
                popupClassName="compose-recipient-dropdown"
                className="compose-select"
              />
            </Form.Item>
          </div>

          {showCc && (
            <div className="compose-section">
              <div className="compose-section-label">Cc</div>
              <Form.Item name="cc" style={{ margin: 0, flex: 1, minWidth: 0 }}>
                <Select
                  mode="tags"
                  placeholder="Cc recipients"
                  tokenSeparators={[",", " "]}
                  options={contacts
                    .map((u: any) => ({
                      value: u.email || "",
                      label: `${u.name} (${u.email || "No Email"})`,
                    }))
                    .filter((u: any) => u.value)}
                  variant="borderless"
                  style={{ width: "100%" }}
                  popupMatchSelectWidth={false}
                  suffixIcon={null}
                />
              </Form.Item>
            </div>
          )}

          {showBcc && (
            <div className="compose-section">
              <div className="compose-section-label">Bcc</div>
              <Form.Item name="bcc" style={{ margin: 0, flex: 1, minWidth: 0 }}>
                <Select
                  mode="tags"
                  placeholder="Bcc recipients"
                  tokenSeparators={[",", " "]}
                  options={contacts
                    .map((u: any) => ({
                      value: u.email || "",
                      label: `${u.name} (${u.email || "No Email"})`,
                    }))
                    .filter((u: any) => u.value)}
                  variant="borderless"
                  style={{ width: "100%" }}
                  popupMatchSelectWidth={false}
                  suffixIcon={null}
                />
              </Form.Item>
            </div>
          )}

          <Form.Item
            name="subject"
            rules={[{ required: true, message: "Subject is required" }]}
            style={{ margin: 0 }}
          >
            <Input
              placeholder="Subject"
              variant="borderless"
              style={{
                padding: "12px 24px",
                fontSize: 16,
                fontWeight: 600,
                color: PALETTE.slate900,
                letterSpacing: "-0.01em",
              }}
            />
          </Form.Item>
          <div style={{ borderBottom: `1px solid ${PALETTE.slate100}` }} />

          <div className="ai-toolbar">
            <span className="ai-toolbar-label">AI Assist</span>
            <button
              type="button"
              className="ai-pill"
              onClick={fixComposeGrammar}
              disabled={isFixingGrammar || isEnhancing}
            >
              {isFixingGrammar ? (
                <Spin indicator={<LoadingOutlined className="ai-icon" />} />
              ) : (
                <CheckCircle2 size={13} className="ai-icon" />
              )}
              Fix grammar
            </button>
            <button
              type="button"
              className="ai-pill"
              onClick={enhanceComposeBody}
              disabled={isFixingGrammar || isEnhancing}
            >
              {isEnhancing ? (
                <Spin indicator={<LoadingOutlined className="ai-icon" />} />
              ) : (
                <Wand2 size={13} className="ai-icon" />
              )}
              Enhance writing
            </button>
            <Tooltip title="AI cleans up tone, clarity, and grammar while preserving your message.">
              <span style={{ fontSize: 11, color: PALETTE.slate400, marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={11} color={PALETTE.violet} />
                Powered by AI
              </span>
            </Tooltip>
          </div>

          <div style={{ background: "var(--bg-pure-white)", padding: "16px 24px" }}>
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
              padding: "12px 24px",
              background: "var(--bg-pure-white)",
              borderTop: `1px solid ${PALETTE.slate200}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
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
                onPreview={async (file) => {
                  let src = file.url;
                  if (!src && file.response && file.response.data && file.response.data.url) {
                    src = file.response.data.url;
                  }
                  if (!src && file.originFileObj) {
                    src = URL.createObjectURL(file.originFileObj);
                  }
                  if (src) {
                    const isPdf = file.name?.toLowerCase().endsWith(".pdf");
                    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name || "");
                    setInlinePreview({
                      url: src,
                      name: file.name || "Attachment",
                      type: isPdf ? "application/pdf" : (isImage ? "image/png" : "application/octet-stream"),
                    });
                  }
                }}
                multiple
                listType="text"
              >
                <Button
                  icon={<PaperClipOutlined />}
                  style={{ borderRadius: 6, height: 30, fontWeight: 500, fontSize: 13 }}
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
                style={{ borderRadius: 6, height: 30, fontSize: 13 }}
                suffixIcon={<Calendar size={13} />}
              />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </MainLayout>
  );
}

export default function MailPage() {
  useActivitySource({ section: "HOME", module: "Integrations", page: "IntegrationMail" });
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center" }}><ZukvoLoader size="lg" /></div>}>
      <MailPageContent />
    </Suspense>
  );
}