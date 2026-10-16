"use client";

import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Skeleton,
  Steps,
  Timeline,
  Tag,
  Tooltip,
  Typography,
  Popconfirm,
  Row,
  Col,
  Select,
  message as messageStatic,
} from "antd";
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Briefcase,
  Globe,
  Star,
  Sparkles,
  Rocket,
  Info,
  ChevronDown,
  ChevronRight,
  DollarSign,
  UserCheck,
  Clock,
  Flame,
  TrendingUp,
  Activity,
  Target,
  Edit2,
  Zap,
  X,
  Brain,
  CheckCircle2,
  FolderOpen,
  ArrowUpRight,
  Layout as LayoutIcon,
  Download,
  History,
  UserPlus,
  FolderPlus,
  FileEdit,
  Send,
  MessageSquare,
  Building2,
  Linkedin,
  MapPin,
  Users,
  Plus,
  Check,
  Lock,
  Trash2,
  Eye,
  Copy,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useLeads } from "@/hooks/useLeads";
import { useLeadSettings } from "@/hooks/useLeadSettings";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

const PLATFORM_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Upwork: { bg: "rgba(16, 185, 129, 0.08)", color: "#10b981", border: "rgba(16, 185, 129, 0.22)" },
  LinkedIn: { bg: "rgba(59, 130, 246, 0.08)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.22)" },
  Freelancer: { bg: "rgba(16, 185, 129, 0.08)", color: "#10b981", border: "rgba(16, 185, 129, 0.22)" },
  Fiverr: { bg: "rgba(59, 130, 246, 0.08)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.22)" },
  Zukvo: { bg: "rgba(16, 185, 129, 0.08)", color: "#10b981", border: "rgba(16, 185, 129, 0.22)" },
  Zithtech: { bg: "rgba(59, 130, 246, 0.08)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.22)" },
  Website: { bg: "rgba(16, 185, 129, 0.08)", color: "#10b981", border: "rgba(16, 185, 129, 0.22)" },
};

const getPlatformChip = (platform?: string) =>
  PLATFORM_COLORS[platform || ""] || {
    bg: "rgba(99, 102, 241, 0.08)",
    color: "#4f46e5",
    border: "rgba(99, 102, 241, 0.22)",
  };

const getInitials = (name?: string) =>
  (name || "—")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "—";

interface AiScoreLevel {
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
}

const getAIScoreLevel = (score?: number): AiScoreLevel | null => {
  if (score === undefined || score === null) return null;
  if (score >= 80) return { label: "Hot", color: "#10b981", bg: "rgba(16, 185, 129, 0.08)", icon: <Flame size={12} /> };
  if (score >= 60) return { label: "Warm", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)", icon: <TrendingUp size={12} /> };
  if (score >= 40) return { label: "Mild", color: "#64748b", bg: "rgba(100, 116, 139, 0.08)", icon: <Activity size={12} /> };
  return { label: "Cold", color: "#64748b", bg: "rgba(100, 116, 139, 0.08)", icon: <Activity size={12} /> };
};

export default function LeadProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { lead, loading, error, fetchLeadById, onboardLead, updateLead } = useLeads();
  const { statuses: configStatuses, fetchStatuses } = useLeadSettings();
  const [onboarding, setOnboarding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const [formDetailsExpanded, setFormDetailsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusEditing, setStatusEditing] = useState(false);
  const [onboardedProjectId, setOnboardedProjectId] = useState<string | null>(null);
  const [initForm] = Form.useForm();

  // Timeline state
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Mailing history state
  const [mails, setMails] = useState<any[]>([]);
  const [mailsLoading, setMailsLoading] = useState(false);

  const fetchMails = async () => {
    if (!params?.id) return;
    setMailsLoading(true);
    try {
      const res = await apiClient.get(`/api/leads/${params.id}/mails`);
      setMails(res.data?.data || []);
    } catch {
      messageStatic.error('Failed to load mailing history');
    } finally {
      setMailsLoading(false);
    }
  };

  // Notes modal state & multi-note support
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<any | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteModalTab, setNoteModalTab] = useState<"write" | "preview">("write");

  const handleOpenViewNoteModal = (note: any) => {
    setViewingNote(note);
  };

  const handleOpenAddNoteModal = () => {
    setEditingNoteId(null);
    setNoteContent("");
    setNoteModalTab("write");
    setNoteModalOpen(true);
  };

  const handleOpenNoteModal = handleOpenAddNoteModal;

  const handleOpenEditNoteModal = (note: { id: string; content: string }) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
    setNoteModalTab("write");
    setNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!lead?.id) return;
    if (!noteContent.trim()) {
      messageStatic.warning("Please enter note content");
      return;
    }
    setSavingNote(true);
    try {
      const fd = (lead.form_data as any) || {};
      const existingNotes: any[] = Array.isArray(fd.notes)
        ? [...fd.notes]
        : (fd.internalNotes || lead.internal_notes)
          ? [{
              id: "legacy-1",
              content: fd.internalNotes || lead.internal_notes,
              createdAt: lead.created_at || new Date().toISOString(),
            }]
          : [];

      let updatedNotes: any[];
      if (editingNoteId) {
        // Edit existing note
        updatedNotes = existingNotes.map((n) =>
          n.id === editingNoteId
            ? { ...n, content: noteContent.trim(), updatedAt: new Date().toISOString() }
            : n
        );
      } else {
        // Add new note (prepend so newest is first)
        const newNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          content: noteContent.trim(),
          createdAt: new Date().toISOString(),
        };
        updatedNotes = [newNote, ...existingNotes];
      }

      const summaryNotes = updatedNotes.map((n) => n.content).join("\n\n---\n\n");

      const updated = await updateLead(lead.id, {
        internalNotes: summaryNotes,
        internal_notes: summaryNotes,
        formData: {
          ...fd,
          notes: updatedNotes,
          internalNotes: summaryNotes,
        },
      });

      if (updated) {
        messageStatic.success(editingNoteId ? "Note updated successfully" : "Note added successfully");
      }
      setNoteModalOpen(false);
      setEditingNoteId(null);
      setNoteContent("");
      fetchLeadById(lead.id);
    } catch (err: any) {
      messageStatic.error(err.message || "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!lead?.id) return;
    try {
      const fd = (lead.form_data as any) || {};
      const existingNotes: any[] = Array.isArray(fd.notes)
        ? [...fd.notes]
        : (fd.internalNotes || lead.internal_notes)
          ? [{
              id: "legacy-1",
              content: fd.internalNotes || lead.internal_notes,
              createdAt: lead.created_at || new Date().toISOString(),
            }]
          : [];

      const updatedNotes = existingNotes.filter((n) => n.id !== noteId);
      const summaryNotes = updatedNotes.map((n) => n.content).join("\n\n---\n\n");

      const updated = await updateLead(lead.id, {
        internalNotes: summaryNotes,
        internal_notes: summaryNotes,
        formData: {
          ...fd,
          notes: updatedNotes,
          internalNotes: summaryNotes,
        },
      });

      if (updated) {
        messageStatic.success("Note deleted successfully");
      }
      fetchLeadById(lead.id);
    } catch (err: any) {
      messageStatic.error(err.message || "Failed to delete note");
    }
  };

  const handleAppendTimestamp = () => {
    const stamp = `[${dayjs().format("MMM D, YYYY · h:mm A")}] - `;
    setNoteContent((prev) => {
      const prefix = prev && !prev.endsWith("\n") ? "\n\n" : (prev ? "\n" : "");
      return `${prev || ""}${prefix}${stamp}`;
    });
  };

  const handleInsertTag = (tag: string) => {
    setNoteContent((prev) => {
      const prefix = prev && !prev.endsWith("\n") ? "\n" : "";
      return `${prev || ""}${prefix}${tag} `;
    });
  };

  const handleInsertFormat = (prefix: string, suffix: string = "") => {
    setNoteContent((prev) => {
      const newline = prev && !prev.endsWith("\n") ? "\n" : "";
      return `${prev || ""}${newline}${prefix}${suffix}`;
    });
  };

  const openTimeline = async () => {
    setTimelineOpen(true);
    if (!params?.id) return;
    setTimelineLoading(true);
    try {
      const res = await apiClient.get(`/api/leads/${params.id}/timeline`);
      setTimelineData(res.data?.data || []);
    } catch {
      messageStatic.error('Failed to load timeline');
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleDownload = async (url: string, fileName: string, mode: 'inline' | 'attachment' = 'attachment') => {
    if (!url) {
      return messageStatic.warning('No file to download');
    }

    // Handle Base64 downloads
    if (url.startsWith('data:')) {
      if (mode === 'inline') {
        try {
          const parts = url.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
          const b64 = parts[1];
          const bin = atob(b64);
          const u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          const blob = new Blob([u8], { type: mime });
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        } catch (e) {
          window.open(url, '_blank');
        }
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName || 'attachment');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      return;
    }

    // Handle remote downloads via proxy
    const loadingKey = mode === 'inline' ? 'view-doc' : 'download-doc';
    try {
      if (messageStatic && messageStatic.loading) {
        messageStatic.loading({ content: mode === 'inline' ? 'Opening...' : 'Downloading...', key: loadingKey });
      }
      
      const response = await apiClient.get(`/api/leads/attachments/download`, {
        params: { url, filename: fileName || 'attachment', mode },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: response.headers['content-type']?.toString() });
      const blobUrl = URL.createObjectURL(blob);
      
      if (mode === 'inline') {
        window.open(blobUrl, '_blank');
        if (messageStatic) messageStatic.destroy(loadingKey);
      } else {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName || 'attachment');
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
        if (messageStatic) messageStatic.success({ content: 'Download started', key: loadingKey });
      }
    } catch (err) {
      if (messageStatic) messageStatic.error({ content: `Failed to ${mode === 'inline' ? 'open' : 'download'} document`, key: loadingKey });
    }
  };

  const { canReadLead, canManageLeads, canReadActivityLog } = usePermission();
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(false);

  // ─── Route Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user && !canReadLead) {
      router.push("/dashboard");
    }
  }, [user, authLoading, canReadLead, router]);

  useEffect(() => {
    if (params.id) {
      fetchLeadById(params.id as string);
      fetchMails();
    }
  }, [params.id, fetchLeadById]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const handleOnboard = async (values: any) => {
    try {
      setOnboarding(true);
      const res: any = await onboardLead(params.id as string, values);
      if (res) {
        // Backend returns { success, message, data: { project, clientId } }; axios wraps in res.data
        const projectId =
          res?.data?.data?.project?.id ||
          res?.data?.project?.id ||
          res?.project?.id ||
          null;
        if (projectId) setOnboardedProjectId(projectId);
        messageStatic.success({ content: "Project initialized successfully", key: "onboard" });
        setIsModalOpen(false);
        // Refresh the lead so its status reflects the new 'Onboarded' state.
        fetchLeadById(params.id as string);
      }
    } catch (err: any) {
      messageStatic.error({ content: err.message || "Failed to initialize project", key: "onboard" });
    } finally {
      setOnboarding(false);
    }
  };

  const isOnboarded = useMemo(() => {
    const s = (lead?.status || "").toLowerCase();
    return s === "onboarded" || !!onboardedProjectId;
  }, [lead?.status, onboardedProjectId]);

  const openOnboardedProject = () => {
    if (onboardedProjectId) {
      router.push(`/projects/${onboardedProjectId}/overview`);
    } else {
      router.push("/projects/manage");
    }
  };

  const handleStatusChange = async (next: string) => {
    if (!lead) return;
    try {
      await updateLead(lead.id, { status: next });
      messageStatic.success("Status updated");
    } catch (err: any) {
      messageStatic.error(err?.message || "Failed to update status");
    } finally {
      setStatusEditing(false);
    }
  };

  const statusConfig = useMemo(
    () => configStatuses.find((s) => s.name === lead?.status),
    [configStatuses, lead?.status]
  );

  const aiScoreLevel = useMemo(() => getAIScoreLevel(lead?.ai_score), [lead?.ai_score]);

  if (loading && !lead) {
    return (
      <ProtectedRoute>
        <MainLayout noPadding>
          <div className="lv-page">
            <div className="lv-topbar">
              <div className="lv-topbar-left">
                <Skeleton.Button active size="small" shape="circle" />
                <Skeleton.Input active size="small" style={{ width: 220 }} />
              </div>
            </div>
            <div className="lv-body">
              <div className="lv-hero">
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
              <div className="lv-grid">
                <div className="lv-main">
                  <Skeleton active paragraph={{ rows: 6 }} />
                </div>
                <aside className="lv-side">
                  <Skeleton active paragraph={{ rows: 4 }} />
                </aside>
              </div>
            </div>
            {leadViewStyles}
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (error || (!loading && !lead)) {
    return (
      <ProtectedRoute>
        <MainLayout noPadding>
          <div className="lv-page lv-empty-page">
            <NoData description={
                                    <span style={{ color: "var(--text-slate-500)" }}>
                                      {error || "Lead not found"}
                                    </span>
                                  } />
            {leadViewStyles}
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!lead) return null;

  const platformChip = getPlatformChip(lead.platform);
  const statusColor = statusConfig?.color || "#3b82f6";
  const skillsList: string[] = Array.isArray(lead.skills) ? lead.skills : [];
  const matchPercentage = lead.skill_analysis?.matchPercentage || 0;
  const winProb = Math.round(lead.ai_score || 0);

  // Lead Intake leads get an entirely different detail structure (company
  // profile + decision makers) instead of the freelance-job layout.
  const isIntake = lead.lead_source_kind === "intake";
  const fd: any = (lead.form_data && typeof lead.form_data === "object") ? lead.form_data : {};
  const decisionMakers: any[] = Array.isArray(fd.decisionMakers) ? fd.decisionMakers : [];
  const displayContacts: any[] = decisionMakers.length > 0
    ? decisionMakers
    : (lead.contact_name || fd.contactName || lead.client_mail || lead.client_phone)
      ? [{
          name: lead.contact_name || fd.contactName || "Key Contact",
          designation: fd.contactRole || "Primary Contact",
          email: lead.client_mail,
          phone: lead.client_phone,
          linkedin: fd.linkedin,
          notes: fd.contactNotes || "",
          isPrimary: true
        }]
      : [];
  const intakeCompanyName = lead.company || lead.client_name || "Unnamed company";
  const currentNotesList: any[] = Array.isArray(fd.notes)
    ? fd.notes
    : (fd.internalNotes || lead.internal_notes)
      ? [{
          id: "legacy-1",
          content: fd.internalNotes || lead.internal_notes,
          createdAt: lead.updated_at || lead.created_at || new Date().toISOString(),
        }]
      : [];

  // Shared meta card — status, ownership, proposal & mail signals. Used in
  // both the platform and intake right rails.
  const renderKeyFacts = () => (
    <section className="lv-side-card">
      <header className="lv-side-head">Key facts</header>
      <div className="lv-facts">
        <div className="lv-fact">
          <span className="lv-fact-key"><Activity size={13} /> Status</span>
          {lead.status ? (
            <span className="lv-fact-badge" style={{ color: statusColor, background: `${statusColor}18` }}>
              <span className="lv-status-dot" style={{ background: statusColor }} />{lead.status}
            </span>
          ) : <span className="lv-fact-val">—</span>}
        </div>
        <div className="lv-fact">
          <span className="lv-fact-key"><UserCheck size={13} /> Created by</span>
          <span className="lv-fact-val">{(lead as any).created_by_name || "—"}</span>
        </div>
        <div className="lv-fact">
          <span className="lv-fact-key"><Calendar size={13} /> Created</span>
          <span className="lv-fact-val">{lead.created_at ? dayjs(lead.created_at).format("MMM D, YYYY") : "—"}</span>
        </div>
        <div className="lv-fact">
          <span className="lv-fact-key"><Clock size={13} /> Updated</span>
          <span className="lv-fact-val">{lead.updated_at ? dayjs(lead.updated_at).fromNow() : "—"}</span>
        </div>
        <div className="lv-fact">
          <span className="lv-fact-key"><FileText size={13} /> Agreement</span>
          <span
            className={`lv-fact-badge ${lead.agreement_id || lead.proposal_id ? "ok" : "off"}`}
            style={{ cursor: (lead.agreement_id || lead.proposal_id) ? "pointer" : undefined }}
            onClick={() => {
              if (lead.agreement_id) router.push(`/project-agreements/agreements?open=${lead.agreement_id}`);
              else if (lead.proposal_id) router.push(`/proposals/builder?id=${lead.proposal_id}`);
            }}
          >
            {lead.agreement_id ? "View Agreement" : lead.proposal_id ? "View Proposal" : "None"}
          </span>
        </div>
        <div className="lv-fact">
          <span className="lv-fact-key"><Mail size={13} /> Last email</span>
          <span className="lv-fact-val">{lead.last_mail_at ? dayjs(lead.last_mail_at).format("MMM D, YYYY") : "None"}</span>
        </div>
      </div>
    </section>
  );

  return (
    <ProtectedRoute>
      <MainLayout noPadding>
        <div className="lv-page">
          {/* ----------------------- Top bar ----------------------- */}
          <div className="lv-topbar">
            <div className="lv-topbar-left">
              <Button
                icon={<ArrowLeft size={15} />}
                className="lv-back-btn"
                onClick={() => router.push("/leads")}
                aria-label="Back to leads"
              />
              <div className="lv-breadcrumbs">
                <button
                  type="button"
                  className="lv-crumb"
                  onClick={() => router.push("/leads")}
                >
                  <Layers size={13} /> Leads
                </button>
                <ChevronRight size={13} className="lv-crumb-sep" />
                <span className="lv-crumb-current" title={lead.title}>
                  {lead.title}
                </span>
              </div>
            </div>

            <div className="lv-topbar-right">
              {/* Inline-edit status pill */}
              {statusEditing ? (
                <Select
                  defaultValue={lead.status}
                  defaultOpen
                  autoFocus
                  size="middle"
                  className="lv-status-select"
                  popupMatchSelectWidth={false}
                  onChange={(value) => handleStatusChange(value)}
                  onBlur={() => setStatusEditing(false)}
                  suffixIcon={null}
                  bordered={false}
                  options={configStatuses.map((s) => ({
                    value: s.name,
                    label: (
                      <span
                        className="lv-status-opt"
                        style={{
                          color: s.color || "#3b82f6",
                          backgroundColor: `${s.color || "#3b82f6"}12`,
                          border: `1px solid ${s.color || "#3b82f6"}25`,
                        }}
                      >
                        {s.name}
                      </span>
                    ),
                  }))}
                />
              ) : lead.status ? (
                <button
                  type="button"
                  className="lv-status-pill"
                  style={{
                    color: statusColor,
                    backgroundColor: `${statusColor}12`,
                    border: `1px solid ${statusColor}25`,
                  }}
                  onClick={() => setStatusEditing(true)}
                  title="Click to change status"
                >
                  <span className="lv-status-dot" style={{ background: statusColor }} />
                  <span className="lv-status-text">{lead.status}</span>
                  <Edit2 size={11} className="lv-status-edit" />
                </button>
              ) : (
                <button
                  type="button"
                  className="lv-status-pill lv-status-pill-empty"
                  onClick={() => setStatusEditing(true)}
                >
                  Set status
                </button>
              )}

              {lead.job_link && (
                <Button
                  icon={<ExternalLink size={14} />}
                  className="lv-secondary-btn"
                  href={lead.job_link}
                  target="_blank"
                >
                  Open on {lead.platform || "platform"}
                </Button>
              )}

              {isOnboarded ? (
                <Button
                  type="primary"
                  icon={<CheckCircle2 size={14} />}
                  className="lv-primary-btn lv-primary-btn-success"
                  onClick={openOnboardedProject}
                  title={onboardedProjectId ? "Open project workspace" : "Open in projects"}
                >
                  <FolderOpen size={13} style={{ marginLeft: 2 }} />
                  Project initiated
                  <ArrowUpRight size={13} />
                </Button>
              ) : canManageLeads && (
                <Button
                  type="primary"
                  icon={<Rocket size={14} />}
                  className="lv-primary-btn"
                  loading={onboarding}
                  onClick={() => {
                    initForm.setFieldsValue({
                      client_name: lead.client_name,
                      client_mail: lead.client_mail,
                      client_phone: lead.client_phone,
                      client_location: lead.client_location,
                      title: lead.title,
                      summary: lead.summary,
                      budget: lead.budget,
                      experience_level: lead.experience_level,
                    });
                    setIsModalOpen(true);
                    setCurrentStep(0);
                  }}
                >
                  Initialize Project
                </Button>
              )}
              {/* <Button
                icon={<History size={14} />}
                className="lv-secondary-btn"
                onClick={openTimeline}
              >
                View Timeline
              </Button> */}
              {/* {canReadActivityLog && (
                <Button
                  icon={<History size={14} />}
                  className="lv-secondary-btn"
                  onClick={() => setTransactionHistoryOpen(true)}
                >
                  Transaction History
                </Button>
              )} */}
            </div>
          </div>

          {/* ----------------------- Timeline Drawer ----------------------- */}
          <Drawer
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={16} style={{ color: '#3b82f6' }} />
                <span>Activity history</span>
              </div>
            }
            open={timelineOpen}
            onClose={() => setTimelineOpen(false)}
            width={480}
            styles={{ body: { padding: '24px 20px' } }}
          >
            {timelineLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <ZukvoLoader size="lg" />
              </div>
            ) : timelineData.length === 0 ? (
              <NoData description="No activity recorded yet" />
            ) : (
              <Timeline
                mode="left"
                items={timelineData.map((item: any) => {
                  const actionMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
                    CREATED_LEAD:    { label: 'Lead Created',      color: '#3b82f6', icon: <Layers size={13} /> },
                    UPDATED_LEAD:    { label: 'Lead Updated',      color: '#10b981', icon: <FileEdit size={13} /> },
                    CREATED_BIDIQ:   { label: 'BidIQ Analyzed',   color: '#3b82f6', icon: <Zap size={13} /> },
                    CREATED_PROPOSAL:{ label: 'Proposal Created',  color: '#10b981', icon: <FileText size={13} /> },
                    CLIENT_CREATED:  { label: 'Client Created',    color: '#3b82f6', icon: <UserPlus size={13} /> },
                    PROJECT_CREATED: { label: 'Project Created',   color: '#10b981', icon: <FolderPlus size={13} /> },
                    MAIL_SENT:       { label: 'Email Sent',        color: '#3b82f6', icon: <Send size={13} /> },
                  };
                  const meta = actionMeta[item.action] || { label: item.action, color: '#94a3b8', icon: <Activity size={13} /> };
                  const user = item.performedByUser;
                  const userName = user?.name || user?.email || 'System';

                  return {
                    color: meta.color,
                    dot: (
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: `${meta.color}18`,
                        border: `1.5px solid ${meta.color}50`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: meta.color
                      }}>
                        {meta.icon}
                      </div>
                    ),
                    children: (
                      <div style={{ paddingBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-slate-900, #0f172a)' }}>
                            {meta.label}
                          </span>
                          <Tag color={meta.color} style={{ fontSize: 10, padding: '0 6px', lineHeight: '18px', border: 'none', background: `${meta.color}18`, color: meta.color }}>
                            {item.action}
                          </Tag>
                        </div>
                        <div className="lv-tl-author" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>by <strong className="lv-tl-user">{userName}</strong></span>
                          <span>·</span>
                          <span>{dayjs(item.createdAt).format('DD MMM YYYY, h:mm A')}</span>
                        </div>
                        {item.metadata && (
                          <div className="lv-tl-metadata" style={{ marginTop: 6, fontSize: 11, borderRadius: 6, padding: '4px 8px' }}>
                            {item.action === 'MAIL_SENT' && `To: ${(item.metadata.to || []).join(', ')} · Subject: ${item.metadata.subject || ''}`}
                            {item.action === 'CLIENT_CREATED' && `Client: ${item.metadata.clientName || item.metadata.clientId}`}
                            {item.action === 'PROJECT_CREATED' && `Project: ${item.metadata.projectName || item.metadata.projectId}`}
                            {item.action === 'CREATED_PROPOSAL' && `${item.metadata.ai_generated ? '✨ AI Generated · ' : ''}${item.metadata.title || ''}`}
                            {item.action === 'CREATED_BIDIQ' && `BidIQ Score: ${item.metadata.score ?? '—'}`}
                          </div>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            )}
          </Drawer>

          <div className={isIntake ? "lv-body lv-body-intake" : "lv-body"}>
            {isIntake ? (
              /* ==================== INTAKE detail body (3-column layout with vertical & horizontal dividers) ==================== */
              <div className="lv-intake-3col-layout">
                {/* ==================== 1ST COLUMN: COMPANY DETAILS FULL ==================== */}
                <div className="lv-intake-col lv-intake-col-1">
                  <section className="lv-intake-card lv-cinfo">
                    <div className="lv-card-head">
                      <div className="lv-card-head-left">
                        <div className="lv-card-icon-circle" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                          <Building2 size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <h2 className="lv-card-head-title">{intakeCompanyName}</h2>
                            {fd.companyType && (
                              <span className="lv-company-type-tag">
                                {fd.companyType}
                              </span>
                            )}
                          </div>
                          <div className="lv-card-head-sub">
                            Organization Profile · Added {lead.created_at ? dayjs(lead.created_at).fromNow() : (lead.posted_on ? dayjs(lead.posted_on).fromNow() : "recently")}
                          </div>
                        </div>
                      </div>
                      {fd.website ? (
                        <a className="lv-card-head-action" href={/^https?:\/\//.test(fd.website) ? fd.website : `https://${fd.website}`} target="_blank" rel="noreferrer">
                          Website →
                        </a>
                      ) : (
                        <span className="lv-card-head-action lv-card-head-action-muted" style={{ cursor: 'default' }}>
                          Profile →
                        </span>
                      )}
                    </div>

                    {(lead.contact_name || fd.contactName) && (
                      <div className="lv-card-highlight-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div className="lv-card-icon-circle-sm" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                            <UserCheck size={14} />
                          </div>
                          <div>
                            <div className="lv-highlight-label">Key Contact Person</div>
                            <div className="lv-highlight-val">{lead.contact_name || fd.contactName}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata 6-tiles grid */}
                    <div className="lv-cinfo-grid-tiles">
                      <div className="lv-info-tile">
                        <span className="lv-info-tile-label"><Mail size={11} /> Email</span>
                        {lead.client_mail ? (
                          <a className="lv-info-tile-val lv-info-tile-link" href={`mailto:${lead.client_mail}`} title={lead.client_mail}>
                            {lead.client_mail}
                          </a>
                        ) : <span className="lv-info-tile-val lv-tile-val-empty">—</span>}
                      </div>

                      <div className="lv-info-tile">
                        <span className="lv-info-tile-label"><Phone size={11} /> Phone</span>
                        {lead.client_phone ? (
                          <a className="lv-info-tile-val lv-info-tile-link" href={`tel:${lead.client_phone}`} title={lead.client_phone}>
                            {lead.client_phone}
                          </a>
                        ) : <span className="lv-info-tile-val lv-tile-val-empty">—</span>}
                      </div>

                      <div className="lv-info-tile">
                        <span className="lv-info-tile-label"><Globe size={11} /> Website</span>
                        {fd.website ? (
                          <a className="lv-info-tile-val lv-info-tile-link" href={/^https?:\/\//.test(fd.website) ? fd.website : `https://${fd.website}`} target="_blank" rel="noreferrer" title={fd.website}>
                            {fd.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : <span className="lv-info-tile-val lv-tile-val-empty">—</span>}
                      </div>

                      <div className="lv-info-tile">
                        <span className="lv-info-tile-label"><Linkedin size={11} /> LinkedIn</span>
                        {fd.linkedin ? (
                          <a className="lv-info-tile-val lv-info-tile-link" href={/^https?:\/\//.test(fd.linkedin) ? fd.linkedin : `https://${fd.linkedin}`} target="_blank" rel="noreferrer" title={fd.linkedin}>
                            Company Page
                          </a>
                        ) : <span className="lv-info-tile-val lv-tile-val-empty">—</span>}
                      </div>

                      <div className="lv-info-tile">
                        <span className="lv-info-tile-label"><MapPin size={11} /> Location</span>
                        <span className="lv-info-tile-val" title={fd.location || lead.client_location || "Not specified"}>
                          {fd.location || lead.client_location || "—"}
                        </span>
                      </div>

                      <div className="lv-info-tile">
                        <span className="lv-info-tile-label"><Users size={11} /> Team Size</span>
                        <span className="lv-info-tile-val" title={fd.teamSize || lead.company_size || "Not specified"}>
                          {fd.teamSize || lead.company_size || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="lv-cinfo-details" style={{ marginTop: 12 }}>
                      {fd.coreBusiness && (
                        <div style={{ marginBottom: 8 }}>
                          <span className="lv-core-tag"><Sparkles size={11} /> {fd.coreBusiness}</span>
                        </div>
                      )}
                      <div className="lv-about-box">
                        <div className="lv-about-box-head">
                          <Info size={12} className="lv-about-head-ic" style={{ color: '#4f46e5' }} /> About Organization
                        </div>
                        <div className="lv-prose lv-about-prose" style={{ lineHeight: 1.6, fontSize: 12.5, whiteSpace: 'pre-wrap' }}>
                          {fd.companyDescription || lead.summary || "No company description provided."}
                        </div>
                      </div>
                      {fd.reviews && (
                        <div className="lv-reviews-box">
                          <div className="lv-about-box-head lv-reviews-head">
                            <Star size={12} className="lv-reviews-head-ic" style={{ color: '#d97706' }} /> Market Research & Reviews
                          </div>
                          <div className="lv-prose lv-reviews-prose" style={{ maxHeight: 120, overflowY: "auto", fontSize: 12.5, lineHeight: 1.55 }}>
                            {fd.reviews}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Contact details */}
                  <section className="lv-intake-card lv-intake-contacts-card">
                    <div className="lv-card-head">
                      <div className="lv-card-head-left">
                        <div className="lv-card-icon-circle" style={{ background: '#ecfdf5', color: '#10b981' }}>
                          <Users size={16} />
                        </div>
                        <div>
                          <h3 className="lv-card-head-title">Contact Details</h3>
                          <div className="lv-card-head-sub">Decision makers & stakeholders</div>
                        </div>
                      </div>
                      {displayContacts.length > 0 && (
                        <span className="lv-card-head-action" style={{ cursor: 'default' }}>
                          {displayContacts.length} {displayContacts.length === 1 ? 'contact' : 'contacts'} →
                        </span>
                      )}
                    </div>
                    <div>
                      {displayContacts.length > 0 ? (
                        <div className="lv-contacts-enhanced-list" style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 9 }}>
                          {displayContacts.map((c, i) => (
                            <div key={i} className="lv-contact-box">
                              <div className="lv-contact-box-top">
                                <div className="lv-contact-box-identity">
                                  <div className="lv-contact-avatar-pill">
                                    {getInitials(c.name)}
                                  </div>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <span className="lv-contact-name-txt" title={c.name}>{c.name || "Unnamed contact"}</span>
                                      {c.isPrimary && (
                                        <span className="lv-contact-primary-tag">Primary</span>
                                      )}
                                    </div>
                                    <div className="lv-contact-role-txt">
                                      <Briefcase size={10} style={{ color: '#94a3b8' }} />
                                      <span>{c.designation || "Stakeholder"}</span>
                                    </div>
                                  </div>
                                </div>

                                {c.linkedin && (
                                  <div className="lv-contact-quick-actions">
                                    <a className="lv-caction-btn lv-caction-linkedin" href={/^https?:\/\//.test(c.linkedin) ? c.linkedin : `https://${c.linkedin}`} target="_blank" rel="noreferrer" title="LinkedIn Profile">
                                      <Linkedin size={10} /> Profile
                                    </a>
                                  </div>
                                )}
                              </div>

                              {c.notes && (
                                <div className="lv-contact-note-strip">
                                  <MessageSquare size={11} className="lv-contact-note-ic" style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                                  <div className="lv-contact-note-text" style={{ flex: 1, minWidth: 0, fontSize: 11.5, lineHeight: 1.45 }}>
                                    <strong className="lv-contact-note-strong" style={{ color: '#059669', marginRight: 4, fontWeight: 700 }}>Note:</strong>
                                    {c.notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="lv-card-empty-state">
                          <div className="lv-card-icon-circle-sm" style={{ background: '#ecfdf5', color: '#10b981', width: 34, height: 34, marginBottom: 6 }}>
                            <Users size={16} />
                          </div>
                          <div className="lv-empty-state-title">No contacts added yet</div>
                          <div className="lv-empty-state-desc">Decision makers and stakeholders will appear here.</div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* ==================== 2ND COLUMN: NOTES + EMAIL HISTORY ==================== */}
                <div className="lv-intake-col lv-intake-col-2">
                  {/* Notes */}
                  <section className="lv-intake-card lv-intake-notes-card">
                    <div className="lv-card-head">
                      <div className="lv-card-head-left">
                        <div className="lv-card-icon-circle" style={{ background: '#eff6ff', color: '#2563eb' }}>
                          <Edit2 size={16} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h3 className="lv-card-head-title">Notes</h3>
                            {currentNotesList.length > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: '#eff6ff', color: '#2563eb' }}>
                                {currentNotesList.length}
                              </span>
                            )}
                          </div>
                          <div className="lv-card-head-sub">Internal notes & takeaways</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="lv-card-head-action"
                        onClick={handleOpenAddNoteModal}
                      >
                        <Plus size={13} style={{ marginRight: 2 }} /> Add Note
                      </button>
                    </div>
                    <div>
                      {currentNotesList.length > 0 ? (
                        <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                          {currentNotesList.map((noteItem: any, idx: number) => {
                            const contentStr = typeof noteItem.content === "string" ? noteItem.content : "";
                            const isBig = contentStr.length > 140 || contentStr.split("\n").length > 3;

                            return (
                              <div key={noteItem.id || idx} className="lv-note-box">
                                <div className="lv-note-box-head">
                                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                                    <span className="lv-note-badge">
                                      <FileEdit size={11} /> Note {currentNotesList.length - idx}
                                    </span>
                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                      {noteItem.createdAt ? dayjs(noteItem.createdAt).format("MMM D, YYYY · h:mm A") : "recently"}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    {isBig && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenViewNoteModal(noteItem)}
                                        className="lv-note-action-btn"
                                        title="View full note"
                                        style={{
                                          background: "none",
                                          border: "none",
                                          padding: "2px 6px",
                                          fontSize: 11,
                                          fontWeight: 600,
                                          color: "#059669",
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 3,
                                          borderRadius: 4,
                                        }}
                                      >
                                        <Eye size={11} /> View
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditNoteModal(noteItem)}
                                      className="lv-note-action-btn"
                                      title="Edit note"
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "2px 6px",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#2563eb",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3,
                                        borderRadius: 4,
                                      }}
                                    >
                                      <Edit2 size={11} /> Edit
                                    </button>
                                    <Popconfirm
                                      title="Delete note"
                                      description="Are you sure you want to delete this note?"
                                      okText="Delete"
                                      cancelText="Cancel"
                                      okButtonProps={{ danger: true, size: "small" }}
                                      cancelButtonProps={{ size: "small" }}
                                      onConfirm={() => handleDeleteNote(noteItem.id)}
                                    >
                                      <button
                                        type="button"
                                        title="Delete note"
                                        style={{
                                          background: "none",
                                          border: "none",
                                          padding: "2px 4px",
                                          fontSize: 11,
                                          color: "#ef4444",
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          borderRadius: 4,
                                        }}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </Popconfirm>
                                  </div>
                                </div>
                                <div
                                  className="lv-note-clamped-text"
                                  onClick={() => {
                                    if (isBig) handleOpenViewNoteModal(noteItem);
                                  }}
                                  style={{ cursor: isBig ? "pointer" : "default" }}
                                  title={isBig ? "Click to view full note" : undefined}
                                >
                                  {noteItem.content}
                                </div>
                                {isBig && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenViewNoteModal(noteItem)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: "3px 0 0 0",
                                      color: "#2563eb",
                                      fontSize: 11.5,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 3,
                                      width: "fit-content",
                                    }}
                                  >
                                    <Eye size={11} /> View note →
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="lv-card-empty-state">
                          <div className="lv-card-icon-circle-sm" style={{ background: '#eff6ff', color: '#2563eb', width: 34, height: 34, marginBottom: 6 }}>
                            <Edit2 size={16} />
                          </div>
                          <div className="lv-empty-state-title">No internal notes yet</div>
                          <div className="lv-empty-state-desc" style={{ marginBottom: 10, maxWidth: 220 }}>Record key client requirements, call takeaways, or scope caveats.</div>
                          <Button
                            type="primary"
                            size="small"
                            icon={<Plus size={12} />}
                            onClick={handleOpenAddNoteModal}
                            style={{ borderRadius: 8, height: 28, fontSize: 11.5, fontWeight: 600, background: '#2563eb' }}
                          >
                            Add Note
                          </Button>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Email History */}
                  <section className="lv-intake-card lv-intake-emails-card">
                    <div className="lv-card-head">
                      <div className="lv-card-head-left">
                        <div className="lv-card-icon-circle" style={{ background: '#fdf2f8', color: '#ec4899' }}>
                          <Mail size={16} />
                        </div>
                        <div>
                          <h3 className="lv-card-head-title">Email History</h3>
                          <div className="lv-card-head-sub">Communications log</div>
                        </div>
                      </div>
                      {mails.length > 0 && (
                        <span className="lv-card-head-action" style={{ cursor: 'default' }}>
                          {mails.length} {mails.length === 1 ? 'sent' : 'sent'} →
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
                      {mailsLoading ? (
                        <Skeleton active paragraph={{ rows: 4 }} />
                      ) : mails.length > 0 ? (
                        <div className="lv-intake-items-list" style={{ flex: 1, minHeight: 280, maxHeight: 460, overflowY: "auto" }}>
                          {mails.map((mail) => (
                            <div key={mail.id} className="lv-intake-row-item">
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                                  <span className="lv-row-title" style={{ fontSize: 12.5 }}>{mail.subject || "No Subject"}</span>
                                  <span className="lv-item-date-badge">• {dayjs(mail.sent_at).fromNow()}</span>
                                </div>
                                <div className="lv-mail-to">
                                  <Mail size={10} style={{ color: '#94a3b8' }} /> To: {mail.recipient_email}
                                </div>
                                <div className="lv-mail-snippet">
                                  {mail.body.replace(/<[^>]*>?/gm, '').slice(0, 95)}...
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="lv-card-empty-state" style={{ flex: 1, minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div className="lv-card-icon-circle-sm" style={{ background: '#fdf2f8', color: '#ec4899', width: 34, height: 34, marginBottom: 6 }}>
                            <Mail size={16} />
                          </div>
                          <div className="lv-empty-state-title">No emails sent yet</div>
                          <div className="lv-empty-state-desc">Outbound communications will appear here.</div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* ==================== 3RD COLUMN: KEY FACTS + DOCUMENTS ==================== */}
                <div className="lv-intake-col lv-intake-col-3">
                  {/* Key facts */}
                  <section className="lv-intake-card lv-intake-facts-card">
                    <div className="lv-card-head">
                      <div className="lv-card-head-left">
                        <div className="lv-card-icon-circle" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                          <Activity size={16} />
                        </div>
                        <div>
                          <h3 className="lv-card-head-title">Key Facts</h3>
                          <div className="lv-card-head-sub">Status & telemetry</div>
                        </div>
                      </div>
                      {/* <button
                        type="button"
                        className="lv-card-head-action"
                        onClick={openTimeline}
                      >
                        Timeline →
                      </button> */}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div className="lv-intake-facts-vlist">
                        <div className="lv-fact-bullet-item">
                          <span className="lv-fact-bullet-left">
                            <span className="lv-fact-dot" style={{ background: statusColor || '#3b82f6' }} />
                            Status
                          </span>
                          {lead.status ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: statusColor, background: `${statusColor}14`, border: `1px solid ${statusColor}33` }}>
                              • {lead.status}
                            </span>
                          ) : <span className="lv-fact-bullet-val">—</span>}
                        </div>
                        <div className="lv-fact-bullet-item">
                          <span className="lv-fact-bullet-left">
                            <span className="lv-fact-dot" style={{ background: '#3b82f6' }} />
                            Created by
                          </span>
                          <span className="lv-fact-bullet-val">{(lead as any).created_by_name || "—"}</span>
                        </div>
                        <div className="lv-fact-bullet-item">
                          <span className="lv-fact-bullet-left">
                            <span className="lv-fact-dot" style={{ background: '#8b5cf6' }} />
                            Created
                          </span>
                          <span className="lv-fact-bullet-val">{lead.created_at ? dayjs(lead.created_at).format("MMM D, YYYY") : "—"}</span>
                        </div>
                        <div className="lv-fact-bullet-item">
                          <span className="lv-fact-bullet-left">
                            <span className="lv-fact-dot" style={{ background: '#06b6d4' }} />
                            Updated
                          </span>
                          <span className="lv-fact-bullet-val">{lead.updated_at ? dayjs(lead.updated_at).fromNow() : "—"}</span>
                        </div>
                        <div className="lv-fact-bullet-item">
                          <span className="lv-fact-bullet-left">
                            <span className="lv-fact-dot" style={{ background: '#10b981' }} />
                            Agreement
                          </span>
                          <span
                            className={`lv-proposal-badge ${lead.agreement_id || lead.proposal_id ? 'has-proposal' : 'no-proposal'}`}
                            style={{ cursor: (lead.agreement_id || lead.proposal_id) ? 'pointer' : undefined }}
                            onClick={() => {
                              if (lead.agreement_id) router.push(`/project-agreements/agreements?open=${lead.agreement_id}`);
                              else if (lead.proposal_id) router.push(`/proposals/builder?id=${lead.proposal_id}`);
                            }}
                          >
                            {lead.agreement_id ? "View Agreement" : lead.proposal_id ? "View Proposal" : "None"}
                          </span>
                        </div>
                        <div className="lv-fact-bullet-item">
                          <span className="lv-fact-bullet-left">
                            <span className="lv-fact-dot" style={{ background: '#ec4899' }} />
                            Last email
                          </span>
                          <span className="lv-fact-bullet-val">{lead.last_mail_at ? dayjs(lead.last_mail_at).format("MMM D, YYYY") : "None"}</span>
                        </div>
                      </div>

                      {(canReadActivityLog !== false) && (
                        <div
                          className="lv-card-footer-banner"
                          onClick={() => setTransactionHistoryOpen(true)}
                          role="button"
                          tabIndex={0}
                          style={{ marginTop: 0 }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                            <History size={13} style={{ color: '#2563eb' }} />
                            <span>Transaction History</span>
                          </span>
                          <ArrowRight size={13} style={{ color: '#94a3b8' }} />
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Documents */}
                  <section className="lv-intake-card lv-intake-docs-card">
                    <div className="lv-card-head">
                      <div className="lv-card-head-left">
                        <div className="lv-card-icon-circle" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                          <FileText size={16} />
                        </div>
                        <div>
                          <h3 className="lv-card-head-title">Documents</h3>
                          <div className="lv-card-head-sub">Files & collateral</div>
                        </div>
                      </div>
                      {lead.documents && lead.documents.length > 0 && (
                        <span className="lv-card-head-action" style={{ cursor: 'default' }}>
                          {lead.documents.length} {lead.documents.length === 1 ? 'file' : 'files'} →
                        </span>
                      )}
                    </div>
                    <div>
                      {lead.documents && lead.documents.length > 0 ? (
                        <div className="lv-intake-items-list" style={{ maxHeight: 220, overflowY: "auto" }}>
                          {lead.documents.map((doc: any, i: number) => {
                            const d = typeof doc === "string" ? { name: doc, url: doc } : doc;
                            return (
                              <div key={i} className="lv-intake-row-item" style={{ padding: '7px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
                                  <div className="lv-doc-icon-badge">
                                    <FileText size={14} />
                                  </div>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div className="lv-row-title" title={d.name}>{d.name || "Attachment"}</div>
                                    <div className="lv-row-subtitle">Attached document</div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <button type="button" onClick={() => handleDownload(d.url, d.name, 'inline')} className="lv-doc-action-btn" title="Open preview">
                                    <ExternalLink size={12} />
                                  </button>
                                  <button type="button" onClick={() => handleDownload(d.url, d.name, 'attachment')} className="lv-doc-action-btn" title="Download">
                                    <Download size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="lv-card-empty-state">
                          <div className="lv-card-icon-circle-sm" style={{ background: '#f5f3ff', color: '#7c3aed', width: 34, height: 34, marginBottom: 6 }}>
                            <FileText size={16} />
                          </div>
                          <div className="lv-empty-state-title">No documents attached</div>
                          <div className="lv-empty-state-desc">Proposals and files attached to this lead appear here.</div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              /* ==================== PLATFORM detail body ==================== */
              <>
            {/* Hero section */}
            <section className="lv-hero">
              <div className="lv-hero-top">
                <div className="lv-hero-platform" style={{ background: platformChip.bg, color: platformChip.color, borderColor: platformChip.border }}>
                  <Globe size={11} />
                  {lead.platform || "Upwork"}
                </div>
                <span className="lv-hero-divider" />
                <div className="lv-hero-meta">
                  <Clock size={12} />
                  Posted {lead.posted_on ? dayjs(lead.posted_on).fromNow() : "recently"}
                </div>
                {lead.experience_level && (
                  <>
                    <span className="lv-hero-divider" />
                    <div className="lv-hero-meta">
                      <Star size={12} />
                      {lead.experience_level}
                    </div>
                  </>
                )}
                {lead.duration && (
                  <>
                    <span className="lv-hero-divider" />
                    <div className="lv-hero-meta">
                      <Calendar size={12} />
                      {lead.duration}
                    </div>
                  </>
                )}
                {aiScoreLevel && (
                  <>
                    <span className="lv-hero-divider" />
                    <div
                      className="lv-hero-score"
                      style={{
                        background: aiScoreLevel.bg,
                        color: aiScoreLevel.color,
                        borderColor: `${aiScoreLevel.color}33`,
                      }}
                    >
                      {aiScoreLevel.icon}
                      <span>{aiScoreLevel.label}</span>
                      <span className="lv-hero-score-val">{lead.ai_score}</span>
                    </div>
                  </>
                )}
              </div>

              <h1 className="lv-hero-title">{lead.title}</h1>

              {lead.summary && (
                <p className="lv-hero-sub">
                  {(lead.summary || "").split("\n")[0].slice(0, 220)}
                  {(lead.summary || "").length > 220 ? "…" : ""}
                </p>
              )}

              <div className="lv-kpi-grid">
                <div className="lv-kpi" style={{ ["--lv-kpi-accent" as any]: "#10b981" }}>
                  <div className="lv-kpi-icon">
                    <DollarSign size={14} />
                  </div>
                  <div className="lv-kpi-body">
                    <span className="lv-kpi-label">Budget</span>
                    <span className="lv-kpi-value">{lead.budget || "—"}</span>
                  </div>
                </div>
                <div className="lv-kpi" style={{ ["--lv-kpi-accent" as any]: "#3b82f6" }}>
                  <div className="lv-kpi-icon">
                    <Target size={14} />
                  </div>
                  <div className="lv-kpi-body">
                    <span className="lv-kpi-label">Win probability</span>
                    <span className="lv-kpi-value">{winProb}%</span>
                  </div>
                </div>
                <div className="lv-kpi" style={{ ["--lv-kpi-accent" as any]: "#3b82f6" }}>
                  <div className="lv-kpi-icon">
                    <Sparkles size={14} />
                  </div>
                  <div className="lv-kpi-body">
                    <span className="lv-kpi-label">Skill match</span>
                    <span className="lv-kpi-value">{matchPercentage}%</span>
                  </div>
                </div>
                <div className="lv-kpi" style={{ ["--lv-kpi-accent" as any]: "#10b981" }}>
                  <div className="lv-kpi-icon">
                    <Briefcase size={14} />
                  </div>
                  <div className="lv-kpi-body">
                    <span className="lv-kpi-label">Job type</span>
                    <span className="lv-kpi-value">{lead.job_type || "Hourly"}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2-column grid */}
            <div className="lv-grid">
              {/* ==================== LEFT — Work ==================== */}
              <main className="lv-main">
                {/* ------- Job description ------- */}
                <section className="lv-section">
                  <header className="lv-section-head">
                    <div className="lv-section-icon" style={{ ["--lv-section-accent" as any]: "#3b82f6" }}>
                      <FileText size={14} />
                    </div>
                    <h3 className="lv-section-title">Job description</h3>
                  </header>
                  <div className="lv-section-body">
                    <div className={`lv-prose ${!isExpanded ? "is-clamped" : ""}`}>
                      {lead.summary || "No summary provided for this opportunity."}
                    </div>
                    {(lead.summary || "").length > 280 && (
                      <button
                        type="button"
                        className="lv-link-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                      >
                        <ChevronDown
                          size={13}
                          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .15s ease" }}
                        />
                        {isExpanded ? "Show less" : "Read full description"}
                      </button>
                    )}
                  </div>
                </section>

                {/* ------- Intelligence summary ------- */}
                {lead.ai_summary && (
                  <section className="lv-section" style={{
                    background: "rgba(59, 130, 246, 0.02)",
                    border: "1px solid rgba(59, 130, 246, 0.1)"
                  }}>
                    <header className="lv-section-head">
                      <div className="lv-section-icon" style={{ ["--lv-section-accent" as any]: "#3b82f6" }}>
                        <Sparkles size={14} />
                      </div>
                      <h3 className="lv-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Intelligence Summary
                        <span style={{
                          padding: "1px 6px", borderRadius: 999, background: "rgba(59, 130, 246, 0.1)",
                          color: "#3b82f6", fontSize: 9, fontWeight: 800, letterSpacing: "0.05em",
                          textTransform: "uppercase", border: "1px solid rgba(59, 130, 246, 0.15)",
                          marginLeft: 4
                        }}>AI Distilled</span>
                      </h3>
                    </header>
                    <div className="lv-section-body">
                      <div className="lv-prose" style={{ color: "var(--text-slate-800)" }}>
                        {lead.ai_summary}
                      </div>
                    </div>
                  </section>
                )}

                {/* ------- Form Details (only for website leads with form_data) ------- */}
                {lead.lead_source_kind === 'website' && lead.form_data && Object.keys(lead.form_data).length > 0 && (
                  <section className="lv-section">
                    <header 
                      className="lv-section-head" 
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      onClick={() => setFormDetailsExpanded(!formDetailsExpanded)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="lv-section-icon" style={{ ["--lv-section-accent" as any]: "#4f46e5" }}>
                          <LayoutIcon size={14} />
                        </div>
                        <h3 className="lv-section-title">Form Details</h3>
                      </div>
                      <div style={{ color: 'var(--text-slate-400)', display: 'flex', alignItems: 'center' }}>
                        {formDetailsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </header>
                    {formDetailsExpanded && (
                      <div className="lv-section-body">
                        <div className="lv-form-details-grid">
                          {Object.entries(lead.form_data).map(([key, val]) => {
                            // Format key to a human readable label, e.g. "useCase" -> "Use Case", "full_name" -> "Full Name"
                            const label = key
                              .replace(/([A-Z])/g, ' $1') // insert a space before all caps
                              .replace(/[_-]/g, ' ')      // replace underscores/dashes with space
                              .trim()
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ');

                            let displayValue = '';
                            if (val === null || val === undefined) {
                              displayValue = '—';
                            } else if (typeof val === 'object') {
                              displayValue = JSON.stringify(val);
                            } else {
                              displayValue = String(val);
                            }

                            return (
                              <div key={key} className="lv-form-details-item">
                                <span className="lv-form-details-label">{label}</span>
                                <span className="lv-form-details-value">{displayValue}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* ------- Skills + Timeline row (60 / 40) ------- */}
                <div className="lv-row-60-40">
                  <section className="lv-section">
                    <header className="lv-section-head">
                      <div className="lv-section-icon" style={{ ["--lv-section-accent" as any]: "#3b82f6" }}>
                        <Layers size={14} />
                      </div>
                      <h3 className="lv-section-title">Required skills</h3>
                      {skillsList.length > 0 && (
                        <span className="lv-section-count">{skillsList.length}</span>
                      )}
                    </header>
                    <div className="lv-section-body">
                      {skillsList.length > 0 ? (
                        <>
                          <div className="lv-skills">
                            {skillsList.slice(0, isSkillsExpanded ? undefined : 10).map((s) => (
                              <span key={s} className="lv-skill-tag">
                                {s}
                              </span>
                            ))}
                          </div>
                          {skillsList.length > 10 && (
                            <button
                              type="button"
                              className="lv-link-btn"
                              onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                            >
                              {isSkillsExpanded ? "Collapse" : `+${skillsList.length - 10} more`}
                            </button>
                          )}

                          {lead.skill_analysis?.missingSkills && lead.skill_analysis.missingSkills.length > 0 && (
                            <div className="lv-skill-gaps">
                              <span className="lv-skill-gaps-label">Gaps detected</span>
                              <div className="lv-skill-gaps-list">
                                {lead.skill_analysis.missingSkills.map((s: string) => (
                                  <span key={s} className="lv-skill-gap">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <Text className="lv-muted">No skills listed yet.</Text>
                      )}
                    </div>
                  </section>

                  <section className="lv-section">
                    <header className="lv-section-head">
                      <div className="lv-section-icon" style={{ ["--lv-section-accent" as any]: "#3b82f6" }}>
                        <Calendar size={14} />
                      </div>
                      <h3 className="lv-section-title">Project timeline</h3>
                    </header>
                    <div className="lv-section-body">
                      <div className="lv-timeline-grid">
                        <div className="lv-timeline-item">
                          <span className="lv-meta-label">Posted on</span>
                          <span className="lv-meta-value">
                            {lead.posted_on ? dayjs(lead.posted_on).format("MMM D, YYYY") : "—"}
                          </span>
                        </div>
                        <div className="lv-timeline-item">
                          <span className="lv-meta-label">Duration</span>
                          <span className="lv-meta-value">{lead.duration || "Flexible"}</span>
                        </div>
                        <div className="lv-timeline-item">
                          <span className="lv-meta-label">Start date</span>
                          <span className="lv-meta-value">
                            {lead.timeline_start ? dayjs(lead.timeline_start).format("MMM D, YYYY") : "Pending"}
                          </span>
                        </div>
                        <div className="lv-timeline-item">
                          <span className="lv-meta-label">End date</span>
                          <span className="lv-meta-value">
                            {lead.timeline_end ? dayjs(lead.timeline_end).format("MMM D, YYYY") : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* ------- Mailing History ------- */}
                <section className="lv-section">
                  <header className="lv-section-head">
                    <div className="lv-section-icon" style={{ ["--lv-section-accent" as any]: "#ec4899" }}>
                      <Mail size={14} />
                    </div>
                    <h3 className="lv-section-title">Mailing History</h3>
                    {mails.length > 0 && <span className="lv-section-count">{mails.length}</span>}
                  </header>
                  <div className="lv-section-body">
                    {mailsLoading ? (
                      <Skeleton active paragraph={{ rows: 2 }} />
                    ) : mails.length > 0 ? (
                      <div className="lv-mailing-history">
                        {mails.map((mail) => (
                          <div key={mail.id} className="lv-mail-item">
                            <div className="lv-mail-item-head">
                              <span className="lv-mail-subject">{mail.subject}</span>
                              <span className="lv-mail-date">{dayjs(mail.sent_at).format("MMM D, YYYY · h:mm A")}</span>
                            </div>
                            <div className="lv-mail-recipient">To: {mail.recipient_email}</div>
                            <div className="lv-mail-excerpt">
                              {mail.body.replace(/<[^>]*>?/gm, '').slice(0, 120)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="lv-empty-state">
                        <Mail size={24} style={{ color: '#cbd5e1', marginBottom: 8 }} />
                        <Text className="lv-muted">No emails sent yet.</Text>
                      </div>
                    )}
                  </div>
                </section>
                {/* ------- Internal notes ------- */}
                <section className="lv-section">
                  <header className="lv-section-head">
                    <div className="lv-section-icon" style={{ ["--lv-section-accent" as any]: "#64748b" }}>
                      <Edit2 size={13} />
                    </div>
                    <h3 className="lv-section-title">Internal notes</h3>
                    <Button
                      size="small"
                      type="primary"
                      icon={<Plus size={12} />}
                      onClick={handleOpenNoteModal}
                      style={{
                        marginLeft: "auto",
                        borderRadius: 6,
                        height: 28,
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {lead.internal_notes ? "Edit Notes" : "Add Note"}
                    </Button>
                  </header>
                  <div className="lv-section-body">
                    {lead.internal_notes ? (
                      <div className="lv-notes">
                        <Paragraph style={{ margin: 0, color: "var(--text-slate-700)", whiteSpace: "pre-wrap" }}>
                          {lead.internal_notes}
                        </Paragraph>
                      </div>
                    ) : (
                      <div style={{ padding: "16px 8px", textAlign: "center" }}>
                        <Text className="lv-muted" style={{ display: "block", marginBottom: 10 }}>
                          No notes recorded. Add context for your team.
                        </Text>
                        <Button
                          type="dashed"
                          icon={<Plus size={13} />}
                          onClick={handleOpenNoteModal}
                          style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
                        >
                          Add Note
                        </Button>
                      </div>
                    )}
                  </div>
                </section>
              </main>

              {/* ==================== RIGHT rail — Meta ==================== */}
              <aside className="lv-side">
                {/* Client */}
                <section className="lv-side-card">
                  <header className="lv-side-head">About the client</header>
                  <div className="lv-client-id">
                    <div className="lv-avatar">{getInitials(lead.client_name)}</div>
                    <div className="lv-client-id-text">
                      <div className="lv-client-name">{lead.client_name || "Unknown client"}</div>
                      <div className="lv-client-meta">
                        <Globe size={11} />
                        <span>{lead.client_location || "Global"}</span>
                        {lead.client_rating && (
                          <>
                            <span className="lv-dot" />
                            <Star size={11} fill="#fbbf24" color="#fbbf24" />
                            <span>{lead.client_rating}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="lv-client-contact">
                    <div className="lv-contact-row">
                      <Mail size={13} />
                      <span title={lead.client_mail || ""}>{lead.client_mail || "—"}</span>
                    </div>
                    <div className="lv-contact-row">
                      <Phone size={13} />
                      <span>{lead.client_phone || "—"}</span>
                    </div>
                  </div>
                  <div className="lv-verify-row">
                    <div className={`lv-verify ${lead.client_payment_verified ? "ok" : "off"}`}>
                      {lead.client_payment_verified ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                      <span>Payment</span>
                    </div>
                    <div className={`lv-verify ${lead.client_phone_verified ? "ok" : "off"}`}>
                      {lead.client_phone_verified ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                      <span>Phone</span>
                    </div>
                  </div>
                </section>

                {/* Key facts */}
                {renderKeyFacts()}

                {/* Win probability */}
                <section className="lv-side-card">
                  <header className="lv-side-head">
                    <Sparkles size={12} /> Win probability
                  </header>
                  <div className="lv-donut-wrap">
                    <div className="lv-donut">
                      <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--border-slate-100)" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="transparent"
                          stroke="#3b82f6"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(winProb / 100) * 264} 264`}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="lv-donut-text">
                        <span className="lv-donut-val">{winProb}<span className="lv-donut-pct">%</span></span>
                        <span className="lv-donut-cap">Predicted</span>
                      </div>
                    </div>
                  </div>

                  <div className="lv-insight-row">
                    <span className="lv-meta-label">Competition</span>
                    <span className="lv-pill lv-pill-warn">
                      <Activity size={10} /> Medium
                    </span>
                  </div>
                  <div className="lv-insight-row lv-insight-progress">
                    <div className="lv-progress-meta">
                      <span className="lv-meta-label">Skill match</span>
                      <span className="lv-progress-val">{matchPercentage}%</span>
                    </div>
                    <div className="lv-progress-track">
                      <div
                        className="lv-progress-fill"
                        style={{ width: `${matchPercentage}%`, background: "linear-gradient(90deg, #3b82f6, #3b82f6)" }}
                      />
                    </div>
                  </div>
                </section>

                {/* Financial */}
                <section className="lv-side-card">
                  <header className="lv-side-head">Financial breakdown</header>
                  <div className="lv-fin-grid">
                    <div className="lv-fin-item">
                      <span className="lv-meta-label">Budget</span>
                      <span className="lv-fin-value">{lead.budget || "—"}</span>
                    </div>
                    <div className="lv-fin-item">
                      <span className="lv-meta-label">Total client spend</span>
                      <span className="lv-fin-value">{lead.client_spend || "—"}</span>
                    </div>
                    <div className="lv-fin-item">
                      <span className="lv-meta-label">Rate</span>
                      <span className="lv-fin-value">
                        {lead.hourly_rate || lead.hour_based_amount
                          ? `$${lead.hourly_rate || lead.hour_based_amount}`
                          : "Fixed"}
                      </span>
                    </div>
                    <div className="lv-fin-item">
                      <span className="lv-meta-label">Job type</span>
                      <span className="lv-fin-value">{lead.job_type || "Hourly"}</span>
                    </div>
                  </div>
                </section>

                {/* Documents */}
                <section className="lv-side-card">
                  <header className="lv-side-head">Documents</header>
                  <div className="lv-docs">
                    {lead.documents && lead.documents.length > 0 ? (
                      lead.documents.map((doc: any, i: number) => {
                        const d = typeof doc === "string" ? { name: doc, url: doc } : doc;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleDownload(d.url, d.name, 'inline')}
                              className="lv-doc-row"
                              style={{ 
                                flex: 1, 
                                minWidth: 0, 
                                marginBottom: 0, 
                                textAlign: 'left',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer'
                              }}
                            >
                              <FileText size={13} />
                              <span className="lv-doc-name" title={d.name}>{d.name || "Attachment"}</span>
                              <ExternalLink size={11} className="lv-doc-ext" />
                            </button>
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<Download size={14} />} 
                              onClick={() => handleDownload(d.url, d.name, 'attachment')}
                              style={{ 
                                color: '#3b82f6', 
                                background: 'rgba(99, 102, 241, 0.05)',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <Text className="lv-muted">No documents attached.</Text>
                    )}
                  </div>
                </section>
              </aside>
            </div>
              </>
            )}
          </div>

          {/* ----------------------- Enhanced Add / Edit Note Modal ----------------------- */}
          <Modal
            open={noteModalOpen}
            onCancel={() => setNoteModalOpen(false)}
            footer={null}
            destroyOnClose
            centered
            closable={false}
            width={680}
            className="lv-note-modal"
          >
            <div className="lv-note-modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="lv-note-modal-icon">
                  <Edit2 size={18} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span className="lv-note-modal-title">
                      {editingNoteId ? "Edit Internal Note" : "Add Internal Note"}
                    </span>
                    <span className="lv-note-badge-blue">
                      <Lock size={10} /> Workspace Private
                    </span>
                  </div>
                  <div className="lv-note-modal-sub">
                    Keep shared takeaways, meeting minutes & follow-ups for <strong>{lead?.company || lead?.client_name || lead?.title || "this lead"}</strong>.
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="lv-note-close-btn"
                onClick={() => setNoteModalOpen(false)}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div className="lv-note-modal-body">
              {/* Quick Template Chips & Tab Mode */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-slate-400)" }}>
                    Quick Templates
                  </span>
                  <div style={{ display: "flex", gap: 3, background: "var(--bg-slate-100, #f1f5f9)", padding: 2, borderRadius: 6 }}>
                    <button
                      type="button"
                      onClick={() => setNoteModalTab("write")}
                      className={`lv-note-tab-btn ${noteModalTab === "write" ? "is-active" : ""}`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteModalTab("preview")}
                      className={`lv-note-tab-btn ${noteModalTab === "preview" ? "is-active" : ""}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <button
                    type="button"
                    className="lv-note-quick-chip chip-time"
                    onClick={handleAppendTimestamp}
                    title="Insert current date & time"
                  >
                    <Clock size={11} />
                    <span>+ Timestamp</span>
                  </button>
                  <button
                    type="button"
                    className="lv-note-quick-chip chip-call"
                    onClick={() => handleInsertTag(`📞 [Call Notes · ${dayjs().format("MMM D")}]:`)}
                  >
                    <span>📞 Call Notes</span>
                  </button>
                  <button
                    type="button"
                    className="lv-note-quick-chip chip-meet"
                    onClick={() => handleInsertTag(`💬 [Meeting Note · ${dayjs().format("MMM D")}]:`)}
                  >
                    <span>💬 Meeting Note</span>
                  </button>
                  <button
                    type="button"
                    className="lv-note-quick-chip chip-action"
                    onClick={() => handleInsertTag("🎯 [Action Item]:")}
                  >
                    <span>🎯 Action Item</span>
                  </button>
                  <button
                    type="button"
                    className="lv-note-quick-chip chip-step"
                    onClick={() => handleInsertTag("⚡ [Next Step]:")}
                  >
                    <span>⚡ Next Step</span>
                  </button>
                  <button
                    type="button"
                    className="lv-note-quick-chip chip-warn"
                    onClick={() => handleInsertTag("⚠️ [Risk/Blocker]:")}
                  >
                    <span>⚠️ Blocker</span>
                  </button>
                </div>
              </div>

              {noteModalTab === "write" ? (
                <>
                  {/* Mini Formatting Toolbar */}
                  <div className="lv-note-toolbar">
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <button
                        type="button"
                        className="lv-note-tool-btn"
                        onClick={() => handleInsertFormat("**", "**")}
                        title="Bold text"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        type="button"
                        className="lv-note-tool-btn"
                        onClick={() => handleInsertFormat("• ")}
                        title="Bullet point"
                      >
                        • Bullet
                      </button>
                      <button
                        type="button"
                        className="lv-note-tool-btn"
                        onClick={() => handleInsertFormat("- [ ] ")}
                        title="Task checklist"
                      >
                        ☐ Task
                      </button>
                    </div>
                    {noteContent && (
                      <button
                        type="button"
                        className="lv-note-tool-btn lv-note-tool-clear"
                        onClick={() => setNoteContent("")}
                        title="Clear notes"
                      >
                        Clear text
                      </button>
                    )}
                  </div>

                  {/* Textarea */}
                  <Input.TextArea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        handleSaveNote();
                      }
                    }}
                    rows={8}
                    placeholder="Type key discussion points, client requirements, budget constraints, or next steps..."
                    className="lv-note-textarea"
                    autoFocus
                  />
                </>
              ) : (
                /* Note Preview */
                <div className="lv-note-preview-box">
                  {noteContent.trim() ? (
                    <div className="lv-note-preview-content">
                      {noteContent.split("\n").map((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={idx} style={{ height: 10 }} />;
                        if (trimmed.startsWith("📞") || trimmed.startsWith("💬") || trimmed.startsWith("🎯") || trimmed.startsWith("⚡") || trimmed.startsWith("⚠️")) {
                          return (
                            <div key={idx} className="lv-note-preview-badge-line">
                              {line}
                            </div>
                          );
                        }
                        if (trimmed.startsWith("[") && trimmed.includes("] -")) {
                          return (
                            <div key={idx} className="lv-note-preview-time-line">
                              <Clock size={11} /> {line}
                            </div>
                          );
                        }
                        if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]")) {
                          const isDone = trimmed.startsWith("- [x]");
                          return (
                            <div key={idx} className="lv-note-preview-task-line">
                              <input type="checkbox" checked={isDone} readOnly />
                              <span style={{ textDecoration: isDone ? "line-through" : "none" }}>
                                {trimmed.substring(5)}
                              </span>
                            </div>
                          );
                        }
                        if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
                          return (
                            <div key={idx} className="lv-note-preview-bullet-line">
                              <span className="lv-note-preview-dot">•</span>
                              <span>{trimmed.substring(2)}</span>
                            </div>
                          );
                        }
                        return <p key={idx} style={{ margin: "0 0 6px" }}>{line}</p>;
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "36px 0", color: "var(--text-slate-400)", fontSize: 13 }}>
                      Nothing to preview yet. Switch back to Write to add your thoughts.
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontSize: 11.5, color: "var(--text-slate-400)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <ShieldCheck size={12} style={{ color: "#10b981" }} /> Visible to all workspace teammates
                </span>
                <span style={{ fontSize: 11.5, color: "var(--text-slate-400)", fontVariantNumeric: "tabular-nums" }}>
                  {noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0} words · {noteContent.length} chars
                </span>
              </div>
            </div>

            <div className="lv-note-modal-footer">
              <span style={{ fontSize: 11.5, color: "var(--text-slate-400)", display: "flex", alignItems: "center", gap: 6 }}>
                Press <kbd style={{ background: "var(--bg-slate-200, #e2e8f0)", color: "var(--text-slate-700)", border: "1px solid var(--border-slate-300, #cbd5e1)", padding: "1px 6px", borderRadius: 4, fontSize: 10.5, fontWeight: 700 }}>⌘ + Enter</kbd> to save
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Button
                  onClick={() => setNoteModalOpen(false)}
                  style={{ borderRadius: 8, height: 38, fontWeight: 600, padding: "0 16px" }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={savingNote}
                  onClick={handleSaveNote}
                  icon={<Check size={14} />}
                  style={{
                    borderRadius: 8,
                    height: 38,
                    fontWeight: 700,
                    padding: "0 18px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    border: "none",
                    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.38)",
                  }}
                >
                  {editingNoteId ? "Save Changes" : "Add Note"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* ----------------------- View Note Detail Modal ----------------------- */}
          <Modal
            open={!!viewingNote}
            onCancel={() => setViewingNote(null)}
            footer={null}
            destroyOnClose
            centered
            closable={false}
            width={640}
            className="lv-note-modal"
          >
            <div className="lv-note-modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="lv-note-modal-icon lv-note-modal-icon-view">
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span className="lv-note-modal-title">
                      Internal Note Details
                    </span>
                    <span className="lv-note-private-badge">
                      <Lock size={10} /> Workspace Private
                    </span>
                  </div>
                  <div className="lv-note-modal-sub">
                    {viewingNote?.createdAt ? (
                      <>Recorded on <strong>{dayjs(viewingNote.createdAt).format("MMMM D, YYYY · h:mm A")}</strong> ({dayjs(viewingNote.createdAt).fromNow()})</>
                    ) : "Note recorded for this lead"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="lv-note-close-btn"
                onClick={() => setViewingNote(null)}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div className="lv-note-modal-body">
              <div className="lv-note-view-box">
                {viewingNote?.content}
              </div>

              <div className="lv-note-view-meta">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <ShieldCheck size={12} style={{ color: "#10b981" }} /> Visible to all workspace teammates
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {viewingNote?.content?.trim() ? viewingNote.content.trim().split(/\s+/).length : 0} words · {viewingNote?.content?.length || 0} chars
                </span>
              </div>
            </div>

            <div className="lv-note-modal-footer">
              <Button
                icon={<Copy size={13} />}
                onClick={() => {
                  if (viewingNote?.content) {
                    navigator.clipboard.writeText(viewingNote.content);
                    messageStatic.success("Note copied to clipboard");
                  }
                }}
                style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
              >
                Copy Content
              </Button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Button
                  onClick={() => setViewingNote(null)}
                  style={{ borderRadius: 8, height: 36, fontWeight: 600, padding: "0 16px" }}
                >
                  Close
                </Button>
                <Button
                  type="primary"
                  icon={<Edit2 size={13} />}
                  onClick={() => {
                    const noteToEdit = viewingNote;
                    setViewingNote(null);
                    handleOpenEditNoteModal(noteToEdit);
                  }}
                  style={{
                    borderRadius: 8,
                    height: 36,
                    fontWeight: 700,
                    padding: "0 18px",
                  }}
                >
                  Edit Note
                </Button>
              </div>
            </div>
          </Modal>

          {/* ----------------------- Initialize Project modal ----------------------- */}
          <Modal
            open={isModalOpen}
            onCancel={() => { if (!onboarding) setIsModalOpen(false); }}
            footer={null}
            width={680}
            centered
            closable={false}
            className="lv-init-modal"
            maskClosable={!onboarding}
          >
            <div className="lv-init-content">
              {/* Header — stays constant across all steps */}
              <div className="lv-init-head">
                <div className="lv-init-icon">
                  <Rocket size={20} />
                </div>
                <div className="lv-init-head-text">
                  <div className="lv-init-eyebrow">
                    <Sparkles size={11} /> AI Project Bootstrap
                  </div>
                  <h2 className="lv-init-title">Initialize Project</h2>
                  <p className="lv-init-sub">
                    Three quick steps — review what we'll create, confirm the client, and set up the project.
                  </p>
                  <div className="lv-init-steps">
                    <span className={`lv-init-step ${currentStep === 0 ? "is-active" : currentStep > 0 ? "is-done" : ""}`}>
                      <span className="lv-init-step-dot">1</span>
                      <span>Review</span>
                    </span>
                    <span className="lv-init-step-sep" />
                    <span className={`lv-init-step ${currentStep === 1 ? "is-active" : currentStep > 1 ? "is-done" : ""}`}>
                      <span className="lv-init-step-dot">2</span>
                      <span>Client</span>
                    </span>
                    <span className="lv-init-step-sep" />
                    <span className={`lv-init-step ${currentStep === 2 ? "is-active" : ""}`}>
                      <span className="lv-init-step-dot">3</span>
                      <span>Project</span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="lv-init-close"
                  onClick={() => { if (!onboarding) setIsModalOpen(false); }}
                  aria-label="Close"
                  disabled={onboarding}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              {currentStep === 0 ? (
                <>
                  {/* Lead snapshot */}
                  <div className="lv-init-snapshot">
                    <div className="lv-init-snapshot-head">
                      <Layers size={11} /> Lead snapshot
                    </div>
                    <div className="lv-init-snapshot-title" title={lead.title}>{lead.title}</div>
                    <div className="lv-init-snapshot-grid">
                      <div className="lv-init-snapshot-item">
                        <span className="lv-init-snapshot-label">
                          <UserCheck size={10} /> Client
                        </span>
                        <span className="lv-init-snapshot-value">{lead.client_name || "—"}</span>
                      </div>
                      <div className="lv-init-snapshot-item">
                        <span className="lv-init-snapshot-label">
                          <DollarSign size={10} /> Budget
                        </span>
                        <span className="lv-init-snapshot-value">{lead.budget || "—"}</span>
                      </div>
                      <div className="lv-init-snapshot-item">
                        <span className="lv-init-snapshot-label">
                          <Clock size={10} /> Duration
                        </span>
                        <span className="lv-init-snapshot-value">{lead.duration || "Flexible"}</span>
                      </div>
                      <div className="lv-init-snapshot-item">
                        <span className="lv-init-snapshot-label">
                          <ShieldCheck size={10} /> Status
                        </span>
                        <span className="lv-init-snapshot-value">{lead.status || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="lv-init-caps">
                    <div className="lv-init-caps-head">What we'll create for you</div>
                    <div className="lv-init-caps-grid">
                      <div className="lv-init-cap" style={{ ["--cap-accent" as any]: "#3b82f6" }}>
                        <div className="lv-init-cap-icon">
                          <UserCheck size={14} />
                        </div>
                        <div className="lv-init-cap-body">
                          <span className="lv-init-cap-title">Client record</span>
                          <span className="lv-init-cap-text">
                            First-class client profile with contact and billing info.
                          </span>
                        </div>
                      </div>
                      <div className="lv-init-cap" style={{ ["--cap-accent" as any]: "#3b82f6" }}>
                        <div className="lv-init-cap-icon">
                          <Briefcase size={14} />
                        </div>
                        <div className="lv-init-cap-body">
                          <span className="lv-init-cap-title">Project workspace</span>
                          <span className="lv-init-cap-text">
                            A new project tied to this lead with status and scope.
                          </span>
                        </div>
                      </div>
                      <div className="lv-init-cap" style={{ ["--cap-accent" as any]: "#10b981" }}>
                        <div className="lv-init-cap-icon">
                          <Activity size={14} />
                        </div>
                        <div className="lv-init-cap-body">
                          <span className="lv-init-cap-title">Pipeline tracking</span>
                          <span className="lv-init-cap-text">
                            Move from prospect to active engagement automatically.
                          </span>
                        </div>
                      </div>
                      <div className="lv-init-cap" style={{ ["--cap-accent" as any]: "#10b981" }}>
                        <div className="lv-init-cap-icon">
                          <Brain size={14} />
                        </div>
                        <div className="lv-init-cap-body">
                          <span className="lv-init-cap-title">AI-ready setup</span>
                          <span className="lv-init-cap-text">
                            Proposals, time tracking, and docs wired in from day one.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="lv-init-form-wrap">
                  <Form
                    form={initForm}
                    layout="vertical"
                    onFinish={handleOnboard}
                    requiredMark={false}
                    className="lv-form"
                  >
                    {currentStep === 1 && (
                      <div className="lv-init-pane">
                        <div className="lv-init-callout">
                          <Info size={13} />
                          <div>
                            <strong>Client verification</strong>
                            <span>Confirm contact details — used for invoicing and communication.</span>
                          </div>
                        </div>

                        <Row gutter={12}>
                          <Col span={24}>
                            <Form.Item
                              name="client_name"
                              label="Full name / company"
                              rules={[{ required: true, message: "Please enter client name" }]}
                            >
                              <Input prefix={<UserCheck size={13} />} placeholder="e.g. Acme Corp" className="lv-input" />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item
                              name="client_mail"
                              label="Primary email"
                              rules={[{ required: true, type: "email", message: "Please enter a valid email" }]}
                            >
                              <Input prefix={<Mail size={13} />} placeholder="client@example.com" className="lv-input" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="client_phone" label="Contact number">
                              <Input prefix={<Phone size={13} />} placeholder="+1 555 000 0000" className="lv-input" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="client_location" label="Client location">
                              <Input prefix={<Globe size={13} />} placeholder="New York, USA" className="lv-input" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="lv-init-pane">
                        <div className="lv-init-callout lv-init-callout-success">
                          <Zap size={13} />
                          <div>
                            <strong>Project scope</strong>
                            <span>Set up scope and budget — refine these later in the project dashboard.</span>
                          </div>
                        </div>

                        <Form.Item
                          name="title"
                          label="Project title"
                          rules={[{ required: true, message: "Please enter project title" }]}
                        >
                          <Input prefix={<LayoutIcon size={13} />} placeholder="e.g. Full Stack Dashboard" className="lv-input" />
                        </Form.Item>

                        <Form.Item name="summary" label="Strategic summary">
                          <Input.TextArea rows={4} placeholder="Briefly describe goals and delivery expectations…" className="lv-input lv-input-textarea" />
                        </Form.Item>

                        <Row gutter={12}>
                          <Col span={12}>
                            <Form.Item name="budget" label="Estimated budget">
                              <Input prefix={<DollarSign size={13} />} placeholder="$5,000" className="lv-input" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="experience_level" label="Expertise level">
                              <Input prefix={<Star size={13} />} placeholder="Expert / Senior" className="lv-input" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </Form>
                </div>
              )}

              {/* Footer */}
              <div className="lv-init-footer">
                <span className="lv-init-footnote">
                  <ShieldCheck size={12} />
                  {currentStep === 0
                    ? "Editable end-to-end in the project dashboard."
                    : currentStep === 1
                      ? "Used for invoicing and client comms."
                      : "Scope can be refined any time post-create."}
                </span>
                <div className="lv-init-footer-actions">
                  {currentStep === 0 ? (
                    <>
                      <Button onClick={() => setIsModalOpen(false)} className="lv-secondary-btn">
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        className="lv-primary-btn"
                        onClick={() => setCurrentStep(1)}
                        icon={<Rocket size={13} />}
                      >
                        Continue
                        <ChevronRight size={13} />
                      </Button>
                    </>
                  ) : currentStep === 1 ? (
                    <>
                      <Button
                        onClick={() => setCurrentStep(0)}
                        className="lv-secondary-btn"
                        disabled={onboarding}
                      >
                        Back
                      </Button>
                      <Button
                        type="primary"
                        className="lv-primary-btn"
                        onClick={async () => {
                          try {
                            await initForm.validateFields(["client_name", "client_mail"]);
                            setCurrentStep(2);
                          } catch {
                            /* validation failure shown inline */
                          }
                        }}
                      >
                        Next step
                        <ChevronRight size={13} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => setCurrentStep(1)}
                        className="lv-secondary-btn"
                        disabled={onboarding}
                      >
                        Back
                      </Button>
                      <Button
                        type="primary"
                        loading={onboarding}
                        className="lv-primary-btn lv-primary-btn-success"
                        onClick={() => initForm.submit()}
                        icon={<Sparkles size={13} />}
                      >
                        Create project
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Modal>

          {lead && (
            <TransactionHistoryDrawer
              open={transactionHistoryOpen}
              onClose={() => setTransactionHistoryOpen(false)}
              entityType="lead"
              entityId={lead.id}
              subtitle={lead.title || lead.client_name}
            />
          )}

          {leadViewStyles}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

/* ---------------------------------------------------------------- */
/*                          Scoped styles                            */
/* ---------------------------------------------------------------- */
const leadViewStyles = (
  <style dangerouslySetInnerHTML={{
    __html: `
      /* Page shell */
      .lv-page {
        background: var(--bg-primary);
        min-height: calc(100vh - 64px);
        margin: 0;
        width: 100%;
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
      }

      .lv-empty-page {
        display: flex; align-items: center; justify-content: center;
        min-height: calc(100vh - 64px);
      }

      /* ===================== Top bar ===================== */
      .lv-topbar {
        position: sticky;
        top: 0;
        z-index: 20;
        background: var(--bg-pure-white);
        border-bottom: 1px solid var(--border-slate-100);
        padding: 10px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .lv-topbar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
      .lv-topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

      .lv-back-btn.ant-btn {
        width: 34px !important;
        height: 34px !important;
        padding: 0 !important;
        border-radius: 9px !important;
        border: 1px solid var(--border-slate-100) !important;
        background: var(--bg-pure-white) !important;
        color: var(--text-slate-700) !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .lv-back-btn.ant-btn:hover {
        border-color: var(--border-slate-200) !important;
        color: var(--text-slate-900) !important;
      }

      .lv-breadcrumbs {
        display: flex; align-items: center; gap: 6px; min-width: 0;
      }
      .lv-crumb {
        background: none; border: 0; padding: 0; cursor: pointer;
        font: inherit;
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 12px; font-weight: 600;
        color: var(--text-slate-500);
        transition: color .15s ease;
      }
      .lv-crumb:hover { color: var(--text-slate-900); }
      .lv-crumb-sep { color: var(--text-slate-400); }
      .lv-crumb-current {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-slate-900);
        max-width: 480px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Status pill */
      .lv-status-pill {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 7px 12px;
        border-radius: 999px;
        font-size: 11.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        cursor: pointer;
        font-family: inherit;
        transition: filter .15s ease, transform .15s ease;
      }
      .lv-status-pill:hover { filter: brightness(0.97); }
      .lv-status-pill:hover .lv-status-edit { opacity: 0.85; transform: translateX(0); }
      .lv-status-pill-empty {
        color: var(--text-slate-500);
        background: var(--bg-slate-50);
        border: 1px dashed var(--border-slate-200) !important;
        text-transform: none;
        letter-spacing: 0;
        font-weight: 600;
      }
      .lv-status-dot {
        width: 6px; height: 6px; border-radius: 50%;
      }
      .lv-status-text { line-height: 1; }
      .lv-status-edit {
        opacity: 0;
        transform: translateX(-2px);
        transition: opacity .15s ease, transform .15s ease;
      }
      .lv-status-select.ant-select .ant-select-selector {
        padding: 4px 10px !important;
        height: 30px !important;
        border-radius: 999px !important;
        border: 1px dashed var(--border-slate-200) !important;
        background: var(--bg-slate-50) !important;
      }
      .lv-status-opt {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      /* Buttons */
      .lv-secondary-btn.ant-btn {
        height: 34px !important;
        border-radius: 9px !important;
        padding: 0 14px !important;
        border: 1px solid var(--border-slate-100) !important;
        background: var(--bg-pure-white) !important;
        color: var(--text-slate-700) !important;
        font-weight: 600 !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
      }
      .lv-secondary-btn.ant-btn:hover {
        border-color: var(--border-slate-200) !important;
        color: var(--text-slate-900) !important;
      }
      .lv-primary-btn.ant-btn {
        height: 34px !important;
        border-radius: 9px !important;
        padding: 0 16px !important;
        background: #3B82F6 !important;
        border: 0 !important;
        color: #fff !important;
        font-weight: 700 !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
      }
      .lv-primary-btn.ant-btn:hover {
        background: #2563EB !important;
      }
      .lv-primary-btn-success.ant-btn {
        background: #059669 !important;
      }
      .lv-primary-btn-success.ant-btn:hover {
        background: #047857 !important;
      }

      /* ===================== Body ===================== */
      .lv-body {
        padding: 12px 24px 48px;
        max-width: 1680px;
        margin: 0 auto;
      }

      /* Compact header (replaces the tall hero) */
      .lv-hero {
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-100);
        border-radius: 10px;
        padding: 14px 18px;
        margin-bottom: 14px;
      }
      .lv-hero-top {
        display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        margin-bottom: 8px;
        font-size: 12px; font-weight: 600; color: var(--text-slate-500);
      }
      .lv-hero-divider { width: 3px; height: 3px; border-radius: 50%; background: var(--border-slate-200); }
      .lv-hero-platform {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 9px; border-radius: 999px;
        font-size: 11px; font-weight: 700; letter-spacing: 0.02em; border: 1px solid;
      }
      .lv-hero-meta { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-slate-500); font-weight: 500; }
      .lv-hero-score { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid; }
      .lv-hero-score-val { opacity: 0.6; font-variant-numeric: tabular-nums; }

      .lv-hero-title {
        margin: 0 0 6px;
        font-size: 19px; font-weight: 800; line-height: 1.25;
        color: var(--text-slate-900); letter-spacing: -0.02em;
      }
      .lv-hero-sub {
        margin: 0 0 12px;
        font-size: 13px; color: var(--text-slate-600); line-height: 1.5; max-width: 900px;
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      }

      /* KPI strip → slim inline pill chips (was 4 big cards) */
      .lv-kpi-grid { display: flex; flex-wrap: wrap; gap: 8px; }
      .lv-kpi {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 6px 12px 6px 8px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
        border-radius: 999px;
      }
      .lv-kpi-icon {
        width: 24px; height: 24px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: color-mix(in oklab, var(--lv-kpi-accent) 14%, transparent);
        color: var(--lv-kpi-accent); flex-shrink: 0;
      }
      .lv-kpi-icon svg { width: 13px; height: 13px; }
      .lv-kpi-body { display: inline-flex; align-items: baseline; gap: 6px; min-width: 0; }
      .lv-kpi-label {
        font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
        color: var(--text-slate-500);
      }
      .lv-kpi-value {
        font-size: 13px; font-weight: 800; color: var(--text-slate-900);
        letter-spacing: -0.01em; line-height: 1.2; font-variant-numeric: tabular-nums;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px;
      }

      /* Key facts card (created by / updated / proposal / mail …) */
      .lv-facts { display: flex; flex-direction: column; }
      .lv-fact {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-slate-100);
      }
      .lv-fact:last-child { border-bottom: none; }
      .lv-fact-key {
        display: inline-flex; align-items: center; gap: 7px;
        font-size: 12px; font-weight: 600; color: var(--text-slate-500);
      }
      .lv-fact-key svg { color: var(--text-slate-400); flex-shrink: 0; }
      .lv-fact-val {
        font-size: 12.5px; font-weight: 700; color: var(--text-slate-800);
        text-align: right; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;
      }
      .lv-fact-badge {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700;
      }
      .lv-fact-badge.ok { color: #10b981; background: rgba(16,185,129,0.1); }
      .lv-fact-badge.off { color: #94a3b8; background: rgba(100,116,139,0.1); }
      a.lv-fact-val { text-decoration: none; }
      a.lv-fact-val:hover { color: #4f46e5; }

      /* ===================== Grid ===================== */
      /* 2-column: Work (flex) · Meta rail */
      .lv-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: 16px;
        align-items: start;
      }
      @media (max-width: 1100px) {
        .lv-grid { grid-template-columns: 1fr; }
      }
      .lv-main {
        display: flex; flex-direction: column; gap: 14px;
        min-width: 0;
      }
      .lv-side {
        display: flex; flex-direction: column; gap: 14px;
        min-width: 0;
      }

      /* Skills (60%) + Timeline (40%) row */
      .lv-row-60-40 {
        display: grid;
        grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
        gap: 16px;
        min-width: 0;
      }
      .lv-row-60-40 > .lv-section { min-width: 0; }
      @media (max-width: 900px) {
        .lv-row-60-40 { grid-template-columns: 1fr; }
      }

      /* Section card */
      .lv-section {
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        overflow: hidden;
      }
      .lv-section-head {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--border-slate-100);
      }
      .lv-section-icon {
        width: 26px; height: 26px;
        border-radius: 4px;
        display: flex; align-items: center; justify-content: center;
        background: color-mix(in oklab, var(--lv-section-accent) 12%, transparent);
        color: var(--lv-section-accent);
        flex-shrink: 0;
      }
      .lv-section-title {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
      }
      .lv-section-count {
        margin-left: auto;
        font-size: 11px;
        font-weight: 700;
        color: var(--text-slate-500);
        background: var(--bg-slate-50);
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid var(--border-slate-100);
      }
      .lv-section-body { padding: 16px 18px 18px; }

      /* Prose / description */
      .lv-prose {
        color: var(--text-slate-700);
        font-size: 14px;
        line-height: 1.7;
        white-space: pre-wrap;
      }
      .lv-prose.is-clamped {
        display: -webkit-box;
        -webkit-line-clamp: 5;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .lv-link-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-top: 10px;
        padding: 0;
        border: 0;
        background: none;
        color: #3b82f6;
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
      }
      .lv-link-btn:hover { color: #4f46e5; }

      /* Skills */
      .lv-skills {
        display: flex; flex-wrap: wrap; gap: 6px;
      }
      .lv-skill-tag {
        display: inline-flex; align-items: center;
        padding: 4px 11px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
        color: var(--text-slate-700);
        font-size: 12px;
        font-weight: 600;
        border-radius: 999px;
        line-height: 1.4;
      }
      .lv-skill-gaps {
        margin-top: 16px;
        padding-top: 14px;
        border-top: 1px dashed var(--border-slate-100);
      }
      .lv-skill-gaps-label {
        display: block;
        font-size: 10.5px;
        font-weight: 700;
        color: #b45309;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .lv-skill-gaps-list { display: flex; flex-wrap: wrap; gap: 6px; }
      .lv-skill-gap {
        display: inline-flex; align-items: center;
        padding: 3px 10px;
        background: rgba(245, 158, 11, 0.08);
        color: #b45309;
        border: 1px solid rgba(245, 158, 11, 0.22);
        font-size: 11px;
        font-weight: 700;
        border-radius: 999px;
      }

      /* Timeline grid */
      .lv-timeline-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px 20px;
      }
      .lv-timeline-item { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
      .lv-meta-label {
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-slate-500);
      }
      .lv-meta-value {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
      }

      /* Notes */
      .lv-notes {
        padding: 12px 14px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        font-size: 13px;
      }

      /* Mailing History */
      .lv-mailing-history {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .lv-mail-item {
        padding: 14px 16px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      .lv-mail-item:hover {
        border-color: rgba(236, 72, 153, 0.3);
        background: var(--bg-pure-white);
        box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);
      }
      .lv-mail-item-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .lv-mail-subject {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-slate-900);
        letter-spacing: -0.01em;
      }
      .lv-mail-date {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-slate-500);
      }
      .lv-mail-recipient {
        font-size: 12px;
        font-weight: 600;
        color: #ec4899;
        margin-bottom: 8px;
      }
      .lv-mail-excerpt {
        font-size: 13px;
        color: var(--text-slate-600);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .lv-empty-state {
        padding: 40px 20px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: var(--bg-slate-50);
        border: 1px dashed var(--border-slate-200);
        border-radius: 4px;
      }

      /* Sidebar cards */
      .lv-side-card {
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        padding: 14px 16px 16px;
      }
      .lv-side-head {
        display: flex; align-items: center; gap: 6px;
        font-size: 11px;
        font-weight: 800;
        color: var(--text-slate-500);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 14px;
      }

      .lv-client-id { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
      .lv-avatar {
        width: 42px; height: 42px;
        border-radius: 4px;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, #3b82f6 0%, #3b82f6 100%);
        color: #fff;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: 0.02em;
        flex-shrink: 0;
      }
      .lv-client-id-text { min-width: 0; flex: 1; }
      .lv-client-name {
        font-size: 14px;
        font-weight: 800;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .lv-client-meta {
        display: flex; align-items: center; gap: 5px;
        margin-top: 2px;
        font-size: 11.5px;
        color: var(--text-slate-500);
        font-weight: 500;
      }
      .lv-dot {
        width: 3px; height: 3px; border-radius: 50%;
        background: var(--border-slate-200);
      }

      .lv-client-contact {
        display: flex; flex-direction: column; gap: 6px;
        margin-bottom: 14px;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--border-slate-100);
      }
      .lv-contact-row {
        display: flex; align-items: center; gap: 8px;
        font-size: 12.5px;
        color: var(--text-slate-700);
        font-weight: 500;
        min-width: 0;
      }
      .lv-contact-row > span {
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .lv-contact-row svg { color: var(--text-slate-400); flex-shrink: 0; }

      /* ---------- Lead Intake additions (3-column layout with vertical & horizontal dividers) ---------- */
      .lv-body-intake {
        padding: 0 !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
      .lv-intake-3col-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(0, 1.15fr) minmax(0, 1fr);
        gap: 0;
        background: var(--bg-pure-white, #ffffff);
        border: none;
        border-radius: 0;
        overflow: hidden;
        align-items: stretch;
        min-height: calc(100vh - 55px);
      }
      @media (max-width: 1200px) {
        .lv-intake-3col-layout {
          grid-template-columns: 1fr;
        }
      }
      .lv-intake-col {
        display: flex;
        flex-direction: column;
        gap: 0;
        min-width: 0;
      }
      .lv-intake-col:not(:last-child) {
        border-right: 1px solid var(--border-slate-200, #e2e8f0);
      }
      @media (max-width: 1200px) {
        .lv-intake-col:not(:last-child) {
          border-right: none;
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
        }
      }
      .lv-intake-card {
        border-radius: 0 !important;
        border: none !important;
        box-shadow: none !important;
        overflow: hidden;
        background: transparent !important;
        display: flex;
        flex-direction: column;
        padding: 22px 24px !important;
        transition: none !important;
      }
      .lv-intake-card:not(:last-child) {
        border-bottom: 1px solid var(--border-slate-200, #e2e8f0) !important;
      }
      .lv-intake-card:last-child {
        flex: 1;
        padding-bottom: 36px !important;
      }
      .lv-intake-emails-card {
        min-height: 360px;
      }
      .lv-intake-emails-card > div:last-child {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .lv-intake-card:hover {
        border-color: transparent !important;
        box-shadow: none !important;
      }
      .lv-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        gap: 12px;
      }
      .lv-card-head-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .lv-card-icon-circle {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .lv-card-icon-circle-sm {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .lv-card-head-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-slate-900, #111827);
        line-height: 1.25;
        margin: 0;
        letter-spacing: -0.01em;
      }
      .lv-card-head-sub {
        font-size: 12px;
        color: var(--text-slate-400, #64748b);
        margin-top: 2px;
        line-height: 1.2;
        font-weight: 400;
      }
      .lv-card-head-action {
        color: #2563eb;
        font-size: 13px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        text-decoration: none;
        flex-shrink: 0;
        transition: color 0.15s ease;
      }
      .lv-card-head-action:hover {
        color: #1d4ed8;
      }
      .lv-intake-card.lv-cinfo {
        padding: 22px 24px !important;
      }

      /* Card Highlight Banner (e.g. Contact Person) */
      .lv-card-highlight-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 12px;
        background: #f0f7ff;
        border: 1px solid #e0effe;
        border-radius: 12px;
        margin-bottom: 12px;
      }
      .lv-card-banner-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11.5px;
        font-weight: 600;
        color: #2563eb;
        background: #ffffff;
        border: 1px solid #bfdbfe;
        padding: 3px 9px;
        border-radius: 999px;
        text-decoration: none;
        transition: all 0.15s ease;
      }
      .lv-card-banner-btn:hover {
        background: #eff6ff;
        border-color: #93c5fd;
      }

      /* Card Footer Banner (e.g. Key Facts bottom timeline link) */
      .lv-card-footer-banner {
        margin-top: 14px;
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 12px;
        padding: 9px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12.5px;
        font-weight: 500;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .lv-card-footer-banner:hover {
        background: #f1f5f9;
        color: #1e293b;
        border-color: #e2e8f0;
      }

      /* Facts Bullet List */
      .lv-intake-facts-vlist {
        display: flex;
        flex-direction: column;
        background: transparent;
      }
      .lv-fact-bullet-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #f8fafc;
        font-size: 12.5px;
      }
      .lv-fact-bullet-item:last-child {
        border-bottom: none;
      }
      .lv-fact-bullet-left {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #64748b;
        font-weight: 500;
        font-size: 12.5px;
      }
      .lv-fact-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .lv-fact-bullet-val {
        font-weight: 600;
        color: var(--text-slate-900, #0f172a);
        font-size: 12.5px;
      }

      /* Intake items list & rows (Contacts, Email History, Docs) */
      .lv-intake-items-list {
        display: flex;
        flex-direction: column;
      }
      .lv-intake-row-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 0;
        border-bottom: 1px solid #f1f5f9;
        gap: 12px;
        transition: background 0.12s ease;
      }
      .lv-intake-row-item:last-child {
        border-bottom: none;
      }
      .lv-row-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-slate-900, #0f172a);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .lv-row-subtitle {
        font-size: 11.5px;
        color: var(--text-slate-400, #64748b);
        margin-top: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .lv-row-excerpt {
        font-size: 11.5px;
        color: #94a3b8;
        margin-top: 2px;
        line-height: 1.35;
      }
      .lv-item-date-badge {
        font-size: 10.5px;
        color: #94a3b8;
        font-weight: 500;
        flex-shrink: 0;
      }
      .lv-item-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 500;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        color: #475569;
        text-decoration: none;
        transition: all 0.15s ease;
        white-space: nowrap;
      }
      .lv-item-pill:hover {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #2563eb;
      }
      .lv-contact-circle-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #eff6ff;
        color: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11.5px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .lv-doc-icon-badge {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: #f5f3ff;
        color: #7c3aed;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .lv-doc-action-btn {
        width: 26px;
        height: 26px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .lv-doc-action-btn:hover {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #2563eb;
      }
      .lv-card-empty-state {
        padding: 24px 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px dashed #e2e8f0;
        text-align: center;
      }

      /* Enhanced Intake Interior: Metadata 6-tiles grid */
      .lv-cinfo-grid-tiles {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 10px;
      }
      @media (max-width: 500px) {
        .lv-cinfo-grid-tiles {
          grid-template-columns: 1fr;
        }
      }
      .lv-info-tile {
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 10px;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
        transition: all 0.15s ease;
      }
      .lv-info-tile:hover {
        background: #f1f5f9;
        border-color: #e2e8f0;
      }
      .lv-info-tile-label {
        font-size: 10.5px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .lv-info-tile-val {
        font-size: 12.5px;
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }
      a.lv-info-tile-link {
        color: #2563eb;
        text-decoration: none;
      }
      a.lv-info-tile-link:hover {
        text-decoration: underline;
        color: #1d4ed8;
      }

      /* Core Tag, About Box, and Reviews Box */
      .lv-core-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 600;
        color: #4f46e5;
        background: #eef2ff;
        border: 1px solid #e0e7ff;
        padding: 3px 9px;
        border-radius: 999px;
      }
      .lv-about-box {
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 12px;
        padding: 10px 12px;
      }
      .lv-about-box-head {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11.5px;
        font-weight: 700;
        color: #334155;
        margin-bottom: 6px;
        letter-spacing: -0.01em;
      }
      .lv-reviews-box {
        margin-top: 8px;
        background: #fffbeb;
        border: 1px solid #fef3c7;
        border-radius: 12px;
        padding: 10px 12px;
      }

      /* Key Facts Metric Tiles (BOD/EOD reference style) */
      .lv-facts-tiles-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 12px;
      }
      .lv-metric-tile {
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .lv-metric-tile-title {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .lv-tile-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 999px;
        width: fit-content;
      }
      .lv-metric-tile-sub {
        font-size: 10.5px;
        color: #94a3b8;
        font-weight: 500;
      }

      /* Note Box (in Notes card) */
      .lv-note-box {
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 12px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: all 0.15s ease;
      }
      .lv-note-box:hover {
        background: #ffffff;
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.05);
      }
      .lv-note-clamped-text {
        margin: 0;
        color: var(--text-slate-700);
        font-size: 13px;
        line-height: 1.6;
        max-height: 4.8em !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 3 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        word-break: break-word;
        white-space: pre-wrap;
      }
      .lv-note-clamped-text:hover {
        color: var(--text-slate-900);
      }
      [data-theme='dark'] .lv-note-clamped-text {
        color: var(--text-slate-300);
      }
      [data-theme='dark'] .lv-note-clamped-text:hover {
        color: var(--text-slate-100);
      }
      .lv-note-box-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid #f1f5f9;
      }
      .lv-note-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 700;
        color: #2563eb;
        background: #eff6ff;
        border: 1px solid #dbeafe;
        padding: 2px 7px;
        border-radius: 6px;
      }

      /* Enhanced Contact Details Card */
      .lv-contact-box {
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 7px;
        transition: all 0.15s ease;
      }
      .lv-contact-box:hover {
        background: #ffffff;
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.06);
      }
      .lv-contact-box-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .lv-contact-box-identity {
        display: flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
        flex: 1;
      }
      .lv-contact-avatar-pill {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        border: 1px solid #a7f3d0;
        color: #047857;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .lv-contact-name-txt {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-slate-900, #0f172a);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .lv-contact-primary-tag {
        font-size: 9.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 1px 6px;
        border-radius: 999px;
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
      }
      .lv-contact-role-txt {
        font-size: 11.5px;
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 1px;
      }
      .lv-contact-quick-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }
      .lv-caction-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.15s ease;
        white-space: nowrap;
      }
      .lv-caction-phone {
        background: #ffffff;
        border: 1px solid #d1fae5;
        color: #059669;
      }
      .lv-caction-phone:hover {
        background: #ecfdf5;
        border-color: #a7f3d0;
      }
      .lv-caction-email {
        background: #ffffff;
        border: 1px solid #e0e7ff;
        color: #4f46e5;
      }
      .lv-caction-email:hover {
        background: #eef2ff;
        border-color: #c7d2fe;
      }
      .lv-caction-linkedin {
        background: #ffffff;
        border: 1px solid #dbeafe;
        color: #2563eb;
      }
      .lv-caction-linkedin:hover {
        background: #eff6ff;
        border-color: #bfdbfe;
      }
      .lv-contact-comms-row {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        padding-top: 5px;
        border-top: 1px dashed #e2e8f0;
      }
      .lv-contact-comm-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 2px 7px;
        font-size: 11px;
        color: #475569;
        text-decoration: none;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: all 0.15s ease;
      }
      .lv-contact-comm-chip:hover {
        border-color: #94a3b8;
        color: #0f172a;
      }
      .lv-comm-icon {
        color: #94a3b8;
        flex-shrink: 0;
      }
      .lv-comm-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lv-contact-note-strip {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-left: 3px solid #10b981;
        border-radius: 0 8px 8px 0;
        padding: 5px 8px;
      }

      /* Decision Maker / Contacts Callout */
      .lv-dm-notes-callout {
        margin-top: 4px;
        background: #f8fafc;
        border-left: 2px solid #3b82f6;
        border-radius: 0 6px 6px 0;
        padding: 5px 8px;
        font-size: 11.5px;
        color: #475569;
        line-height: 1.4;
      }
      .lv-dm-note-tag {
        font-weight: 700;
        color: #3b82f6;
        margin-right: 4px;
      }

      /* Email Snippet & To line */
      .lv-mail-to {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        color: #64748b;
        margin-bottom: 3px;
      }
      .lv-mail-snippet {
        font-size: 11.5px;
        color: #64748b;
        line-height: 1.4;
        background: #f8fafc;
        padding: 6px 8px;
        border-radius: 6px;
        border: 1px solid #f1f5f9;
        margin-top: 3px;
      }


      /* Company info card */
      .lv-cinfo { padding: 20px; }
      .lv-cinfo-head { display: flex; align-items: center; gap: 14px; }
      .lv-cinfo-titlerow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .lv-cinfo-name {
        margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;
        color: var(--text-slate-900); line-height: 1.2;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
      }
      .lv-cinfo-badge {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 10px; border-radius: 999px;
        font-size: 11px; font-weight: 700; letter-spacing: 0.01em;
        color: #4f46e5; background: rgba(99,102,241,0.09); border: 1px solid rgba(99,102,241,0.2);
      }
      .lv-cinfo-sub {
        display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        margin-top: 6px; font-size: 12px; font-weight: 500; color: var(--text-slate-500);
      }
      .lv-cinfo-kind {
        display: inline-flex; align-items: center; gap: 5px; font-weight: 700; color: #4f46e5;
      }
      .lv-cinfo-sub svg { flex-shrink: 0; }

      .lv-cinfo-grid {
        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 2px 24px;
        margin-top: 18px; padding-top: 16px;
        border-top: 1px solid var(--border-slate-100);
      }
      @media (max-width: 640px) { .lv-cinfo-grid { grid-template-columns: 1fr; } }
      .lv-cinfo-item {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 8px 0; min-width: 0;
      }
      .lv-cinfo-key {
        display: inline-flex; align-items: center; gap: 7px;
        font-size: 12px; font-weight: 600; color: var(--text-slate-500); flex-shrink: 0;
      }
      .lv-cinfo-key svg { color: var(--text-slate-400); }
      .lv-cinfo-val {
        font-size: 12.5px; font-weight: 700; color: var(--text-slate-800);
        text-align: right; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      a.lv-cinfo-link { text-decoration: none; cursor: pointer; }
      a.lv-cinfo-link:hover { color: #4f46e5; }

      .lv-cinfo-details {
        margin-top: 16px; padding-top: 16px;
        border-top: 1px solid var(--border-slate-100);
      }
      .lv-cinfo-core {
        display: flex; align-items: center; gap: 8px;
        margin-top: 10px; padding: 9px 12px;
        background: rgba(99,102,241,0.04); border: 1px solid rgba(99,102,241,0.12); border-radius: 10px;
        font-size: 13.5px; font-weight: 700; color: var(--text-slate-900);
      }
      .lv-cinfo-core svg { color: #6366f1; flex-shrink: 0; }
      .lv-cinfo-reviews { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border-slate-100); }
      [data-theme='dark'] .lv-cinfo-core { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.25); }
      a.lv-contact-link { text-decoration: none; cursor: pointer; transition: color .15s ease; }
      a.lv-contact-link:hover { color: #4f46e5; }
      a.lv-contact-link:hover svg { color: #4f46e5; }
      a.lv-contact-link svg:last-child { margin-left: auto; opacity: .55; }

      .lv-overview-line {
        display: flex; flex-direction: column; gap: 3px;
        padding: 10px 12px;
        background: rgba(99, 102, 241, 0.04);
        border: 1px solid rgba(99, 102, 241, 0.12);
        border-radius: 10px;
      }
      .lv-overview-line .lv-meta-value { font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); }

      /* Contacts — 2-up grid; a lone contact spans full width */
      .lv-dm-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .lv-dm-card:only-child { grid-column: 1 / -1; }
      @media (max-width: 720px) { .lv-dm-list { grid-template-columns: 1fr; } }

      .lv-dm-card {
        border: 1px solid var(--border-slate-100);
        border-radius: 12px;
        background: var(--bg-pure-white);
        padding: 14px 16px;
        transition: border-color .18s ease, box-shadow .18s ease;
      }
      .lv-dm-card:hover {
        border-color: #dbe3ee;
        box-shadow: 0 6px 18px -8px rgba(15, 23, 42, 0.14);
      }
      .lv-dm-card-head {
        display: flex; align-items: center; gap: 11px;
        padding-bottom: 12px; margin-bottom: 6px;
        border-bottom: 1px solid var(--border-slate-100);
      }
      .lv-dm-avatar {
        width: 38px; height: 38px; flex-shrink: 0;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #fff; font-weight: 800; font-size: 13px;
      }
      .lv-dm-name {
        font-size: 14.5px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.01em;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .lv-dm-role-sub { font-size: 11.5px; font-weight: 700; color: #4f46e5; margin-top: 1px; }

      .lv-dm-fields { display: flex; flex-direction: column; }
      .lv-dm-field {
        display: flex; align-items: center; justify-content: space-between; gap: 14px;
        padding: 7px 0;
        border-bottom: 1px solid var(--border-slate-100);
      }
      .lv-dm-field:last-child { border-bottom: none; }
      .lv-dm-k { font-size: 12px; font-weight: 600; color: var(--text-slate-500); flex-shrink: 0; }
      .lv-dm-v {
        font-size: 12.5px; font-weight: 700; color: var(--text-slate-800);
        text-align: right; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      a.lv-dm-v.lv-dm-vlink { text-decoration: none; cursor: pointer; }
      a.lv-dm-v.lv-dm-vlink:hover { color: #4f46e5; }
      [data-theme='dark'] .lv-dm-card { background: #161b22; border-color: #30363d; }
      [data-theme='dark'] .lv-dm-card:hover { border-color: #3d444d; }

      .lv-verify-row { display: flex; gap: 8px; }
      .lv-verify {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 11.5px;
        font-weight: 700;
        flex: 1;
        justify-content: center;
      }
      .lv-verify.ok {
        background: rgba(16, 185, 129, 0.08);
        color: #047857;
        border: 1px solid rgba(16, 185, 129, 0.22);
      }
      .lv-verify.off {
        background: var(--bg-slate-50);
        color: var(--text-slate-500);
        border: 1px solid var(--border-slate-100);
      }

      /* Win prob donut */
      .lv-donut-wrap { display: flex; justify-content: center; padding: 4px 0 14px; }
      .lv-donut {
        position: relative;
        width: 130px; height: 130px;
      }
      .lv-donut svg {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
      }
      .lv-donut-text {
        position: absolute; inset: 0;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
      }
      .lv-donut-val {
        font-size: 26px;
        font-weight: 800;
        color: var(--text-slate-900);
        letter-spacing: -0.02em;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .lv-donut-pct { font-size: 14px; opacity: 0.5; margin-left: 2px; }
      .lv-donut-cap {
        margin-top: 4px;
        font-size: 9.5px;
        font-weight: 800;
        letter-spacing: 0.1em;
        color: var(--text-slate-500);
        text-transform: uppercase;
      }
      .lv-insight-row {
        display: flex; align-items: center; justify-content: space-between;
        margin-top: 10px;
      }
      .lv-pill {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
      }
      .lv-pill-warn {
        background: rgba(245, 158, 11, 0.1);
        color: #b45309;
        border: 1px solid rgba(245, 158, 11, 0.22);
      }
      .lv-insight-progress { flex-direction: column; align-items: stretch; gap: 6px; }
      .lv-progress-meta { display: flex; justify-content: space-between; align-items: center; }
      .lv-progress-val {
        font-size: 11.5px;
        font-weight: 800;
        color: #3b82f6;
        font-variant-numeric: tabular-nums;
      }
      .lv-progress-track {
        height: 6px;
        background: var(--bg-slate-50);
        border-radius: 999px;
        overflow: hidden;
        border: 1px solid var(--border-slate-100);
      }
      .lv-progress-fill {
        display: block;
        height: 100%;
        border-radius: 999px;
        transition: width .4s ease;
      }

      /* Financial */
      .lv-fin-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px 16px;
      }
      .lv-fin-item { display: flex; flex-direction: column; gap: 3px; }
      .lv-fin-value {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
        font-variant-numeric: tabular-nums;
      }

      /* Documents */
      .lv-docs { display: flex; flex-direction: column; gap: 6px; }
      .lv-doc-row {
        display: flex; align-items: center; gap: 8px;
        padding: 9px 11px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        color: var(--text-slate-700);
        font-size: 12.5px;
        font-weight: 600;
        transition: border-color .15s ease, color .15s ease;
        text-decoration: none;
      }
      .lv-doc-row:hover {
        border-color: rgba(99, 102, 241, 0.35);
        color: #4f46e5;
      }
      .lv-doc-name {
        flex: 1; min-width: 0;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .lv-doc-ext { color: var(--text-slate-400); }

      .lv-muted { color: var(--text-slate-500) !important; font-size: 12.5px; }

      /* ===================== Enhanced Note Modal ===================== */
      .lv-note-modal .ant-modal-content {
        padding: 0 !important;
        border-radius: 16px !important;
        border: 1px solid var(--border-slate-100);
        overflow: hidden;
        background: var(--bg-pure-white);
        box-shadow: 0 24px 60px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(148, 163, 184, 0.1) !important;
      }
      .lv-note-modal .ant-modal-body {
        padding: 0 !important;
      }
      .lv-note-modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        padding: 22px 24px 18px;
        position: relative;
        background: linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 0) 100%);
        border-bottom: 1px solid var(--border-slate-100);
      }
      .lv-note-modal-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 8px 18px -4px rgba(59, 130, 246, 0.45);
      }
      .lv-note-close-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid var(--border-slate-100);
        background: var(--bg-pure-white);
        color: var(--text-slate-400);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.18s ease;
      }
      .lv-note-close-btn:hover {
        color: var(--text-slate-900);
        border-color: var(--border-slate-300);
        background: var(--bg-slate-50);
        transform: scale(1.04);
      }
      .lv-note-modal-body {
        padding: 20px 24px;
      }
      .lv-note-tab-btn {
        padding: 3px 10px;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 700;
        border: none;
        cursor: pointer;
        background: transparent;
        color: var(--text-slate-500);
        transition: all 0.15s ease;
      }
      .lv-note-tab-btn.is-active {
        background: var(--bg-pure-white);
        color: #2563eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
      .lv-note-quick-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 7px;
        font-size: 11.5px;
        font-weight: 600;
        cursor: pointer;
        background: var(--bg-slate-100, #f1f5f9);
        color: var(--text-slate-700, #334155);
        border: 1px solid var(--border-slate-200, #e2e8f0);
        transition: all 0.18s ease;
        user-select: none;
      }
      .lv-note-quick-chip:hover {
        transform: translateY(-1px);
      }
      .lv-note-quick-chip.chip-time:hover {
        background: rgba(59, 130, 246, 0.12);
        color: #2563eb;
        border-color: rgba(59, 130, 246, 0.35);
      }
      .lv-note-quick-chip.chip-call:hover {
        background: rgba(16, 185, 129, 0.12);
        color: #059669;
        border-color: rgba(16, 185, 129, 0.35);
      }
      .lv-note-quick-chip.chip-meet:hover {
        background: rgba(139, 92, 246, 0.12);
        color: #7c3aed;
        border-color: rgba(139, 92, 246, 0.35);
      }
      .lv-note-quick-chip.chip-action:hover {
        background: rgba(245, 158, 11, 0.12);
        color: #d97706;
        border-color: rgba(245, 158, 11, 0.35);
      }
      .lv-note-quick-chip.chip-step:hover {
        background: rgba(6, 182, 212, 0.12);
        color: #0891b2;
        border-color: rgba(6, 182, 212, 0.35);
      }
      .lv-note-quick-chip.chip-warn:hover {
        background: rgba(239, 68, 68, 0.12);
        color: #dc2626;
        border-color: rgba(239, 68, 68, 0.35);
      }
      .lv-note-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 10px;
        background: var(--bg-slate-50, #f8fafc);
        border: 1px solid var(--border-slate-200, #cbd5e1);
        border-bottom: none;
        border-radius: 10px 10px 0 0;
      }
      .lv-note-tool-btn {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 3px 8px;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
        background: transparent;
        color: var(--text-slate-600);
        transition: all 0.15s ease;
      }
      .lv-note-tool-btn:hover {
        background: var(--bg-slate-200, #e2e8f0);
        color: var(--text-slate-900);
      }
      .lv-note-tool-clear {
        color: var(--text-slate-400);
        font-size: 10.5px;
      }
      .lv-note-tool-clear:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.08);
      }
      .lv-note-textarea {
        border-radius: 0 0 10px 10px !important;
        font-size: 13.5px !important;
        line-height: 1.65 !important;
        padding: 12px 14px !important;
        border: 1px solid var(--border-slate-200, #cbd5e1) !important;
        background: var(--bg-slate-50, #f8fafc) !important;
        color: var(--text-slate-900, #0f172a) !important;
        transition: all 0.18s ease !important;
      }
      .lv-note-textarea:focus {
        background: var(--bg-pure-white, #ffffff) !important;
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
      }
      .lv-note-preview-box {
        border-radius: 10px;
        padding: 14px 16px;
        min-height: 220px;
        max-height: 320px;
        overflow-y: auto;
        background: var(--bg-slate-50, #f8fafc);
        border: 1px solid var(--border-slate-200, #cbd5e1);
        font-size: 13.5px;
        line-height: 1.65;
        color: var(--text-slate-800);
      }
      .lv-note-preview-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .lv-note-preview-badge-line {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 6px;
        background: rgba(59, 130, 246, 0.08);
        color: #1d4ed8;
        font-weight: 600;
        font-size: 12.5px;
        margin: 4px 0;
      }
      .lv-note-preview-time-line {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--text-slate-500);
        font-size: 12px;
        font-weight: 600;
        margin: 4px 0;
      }
      .lv-note-preview-task-line {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 2px 0;
      }
      .lv-note-preview-bullet-line {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 1px 0;
      }
      .lv-note-preview-dot {
        color: #3b82f6;
        font-weight: 800;
      }
      .lv-note-modal-title {
        font-size: 16.5px;
        font-weight: 800;
        color: var(--text-slate-900, #0f172a);
        letter-spacing: -0.015em;
      }
      .lv-note-modal-sub {
        font-size: 12px;
        color: var(--text-slate-500, #64748b);
        font-weight: 500;
      }
      .lv-note-modal-sub strong {
        color: var(--text-slate-700, #334155);
      }
      .lv-note-badge-blue {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 20px;
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        display: inline-flex;
        align-items: center;
        gap: 3px;
      }
      .lv-note-private-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 20px;
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        display: inline-flex;
        align-items: center;
        gap: 3px;
      }
      .lv-note-modal-icon-view {
        background: rgba(16, 185, 129, 0.12) !important;
        color: #10b981 !important;
        box-shadow: 0 8px 18px -4px rgba(16, 185, 129, 0.35) !important;
      }
      .lv-note-view-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px 18px;
        max-height: 380px;
        overflow-y: auto;
        color: #1e293b;
        font-size: 13.5px;
        line-height: 1.7;
        white-space: pre-wrap;
        word-break: break-word;
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
      }
      .lv-note-view-box::-webkit-scrollbar {
        width: 6px;
      }
      .lv-note-view-box::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      .lv-note-view-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        font-size: 11.5px;
        color: #64748b;
      }
      .lv-note-modal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
        background: var(--bg-slate-50, #f8fafc);
        border-top: 1px solid var(--border-slate-100, #e2e8f0);
      }
      [data-theme='dark'] .lv-note-modal .ant-modal-content {
        background: #0f172a !important;
        border-color: #1e293b !important;
      }
      [data-theme='dark'] .lv-note-modal-head {
        border-color: #1e293b !important;
        background: linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, rgba(15, 23, 42, 0) 100%) !important;
      }
      [data-theme='dark'] .lv-note-modal-title {
        color: #f1f5f9 !important;
      }
      [data-theme='dark'] .lv-note-modal-sub {
        color: #94a3b8 !important;
      }
      [data-theme='dark'] .lv-note-modal-sub strong {
        color: #cbd5e1 !important;
      }
      [data-theme='dark'] .lv-note-badge-blue {
        background: rgba(59, 130, 246, 0.18) !important;
        color: #60a5fa !important;
        border: 1px solid rgba(59, 130, 246, 0.3) !important;
      }
      [data-theme='dark'] .lv-note-private-badge {
        background: rgba(16, 185, 129, 0.18) !important;
        color: #34d399 !important;
        border: 1px solid rgba(16, 185, 129, 0.3) !important;
      }
      [data-theme='dark'] .lv-note-modal-icon-view {
        background: rgba(16, 185, 129, 0.2) !important;
        color: #34d399 !important;
        box-shadow: 0 8px 18px -4px rgba(16, 185, 129, 0.25) !important;
      }
      [data-theme='dark'] .lv-note-view-box {
        background: #0b1120 !important;
        border-color: #334155 !important;
        color: #f1f5f9 !important;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4) !important;
      }
      [data-theme='dark'] .lv-note-view-box::-webkit-scrollbar-thumb {
        background: #334155 !important;
      }
      [data-theme='dark'] .lv-note-view-meta {
        color: #94a3b8 !important;
      }
      [data-theme='dark'] .lv-note-close-btn {
        background: #1e293b;
        border-color: #334155;
        color: #94a3b8;
      }
      [data-theme='dark'] .lv-note-close-btn:hover {
        background: #334155;
        color: #f8fafc;
      }
      [data-theme='dark'] .lv-note-tab-btn.is-active {
        background: #1e293b;
        color: #60a5fa;
      }
      [data-theme='dark'] .lv-note-modal-footer {
        background: #0b1120 !important;
        border-color: #1e293b !important;
      }
      [data-theme='dark'] .lv-note-modal-footer .ant-btn:not(.ant-btn-primary) {
        background: #1e293b !important;
        border-color: #334155 !important;
        color: #e2e8f0 !important;
      }
      [data-theme='dark'] .lv-note-modal-footer .ant-btn:not(.ant-btn-primary):hover {
        background: #334155 !important;
        border-color: #475569 !important;
        color: #ffffff !important;
      }
      [data-theme='dark'] .lv-note-modal-footer .ant-btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
        border: none !important;
        color: #ffffff !important;
      }
      [data-theme='dark'] .lv-note-toolbar {
        background: #0b1120 !important;
        border-color: #334155 !important;
      }
      [data-theme='dark'] .lv-note-tool-btn {
        color: #94a3b8 !important;
      }
      [data-theme='dark'] .lv-note-tool-btn:hover {
        background: #1e293b !important;
        color: #f8fafc !important;
      }
      [data-theme='dark'] .lv-note-textarea {
        background: #0b1120 !important;
        border-color: #334155 !important;
        color: #f1f5f9 !important;
      }
      [data-theme='dark'] .lv-note-textarea:focus {
        background: #0f172a !important;
        border-color: #3b82f6 !important;
      }
      [data-theme='dark'] .lv-note-preview-box {
        background: #0b1120 !important;
        border-color: #334155 !important;
        color: #e2e8f0 !important;
      }
      [data-theme='dark'] .lv-note-preview-badge-line {
        background: rgba(59, 130, 246, 0.15) !important;
        color: #93c5fd !important;
      }
      [data-theme='dark'] .lv-note-quick-chip {
        background: rgba(255, 255, 255, 0.04) !important;
        border-color: #334155 !important;
        color: #cbd5e1 !important;
      }
      [data-theme='dark'] .lv-note-quick-chip:hover {
        background: rgba(59, 130, 246, 0.15) !important;
        border-color: #3b82f6 !important;
        color: #93c5fd !important;
      }

      /* Tag and Badge styles */
      .lv-company-type-tag {
        font-size: 11px;
        font-weight: 600;
        color: #4f46e5;
        background: #eef2ff;
        border: 1px solid #c7d2fe;
        padding: 2px 8px;
        border-radius: 999px;
      }
      .lv-highlight-label {
        font-size: 10.5px;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .lv-highlight-val {
        font-size: 13.5px;
        font-weight: 700;
        color: var(--text-slate-900, #0f172a);
      }
      .lv-tile-val-empty {
        color: var(--text-slate-400, #94a3b8) !important;
      }
      .lv-card-head-action-muted {
        color: var(--text-slate-400, #64748b) !important;
      }
      .lv-about-prose {
        color: var(--text-slate-700, #334155);
      }
      .lv-reviews-head {
        color: #b45309;
      }
      .lv-reviews-prose {
        color: #451a03;
      }
      .lv-contact-note-text {
        color: var(--text-slate-600, #475569);
      }
      .lv-empty-state-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-slate-900, #0f172a);
        margin-bottom: 2px;
      }
      .lv-empty-state-desc {
        font-size: 11.5px;
        color: var(--text-slate-400, #64748b);
      }
      .lv-proposal-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 999px;
      }
      .lv-proposal-badge.has-proposal {
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
      }
      .lv-proposal-badge.no-proposal {
        background: #f1f5f9;
        color: #64748b;
        border: 1px solid #e2e8f0;
      }
      .lv-tl-author {
        color: var(--text-slate-400, #64748b);
      }
      .lv-tl-user {
        color: var(--text-slate-700, #475569);
      }
      .lv-tl-metadata {
        color: var(--text-slate-400, #94a3b8);
        background: rgba(0,0,0,0.03);
        border: 1px solid rgba(0,0,0,0.05);
      }

      /* Dark mode overrides for Intake cards and elements */
      [data-theme='dark'] .lv-intake-3col-layout {
        background: var(--bg-secondary) !important;
        border: none !important;
      }
      [data-theme='dark'] .lv-intake-col:not(:last-child) {
        border-right-color: var(--border-slate-100) !important;
      }
      @media (max-width: 1200px) {
        [data-theme='dark'] .lv-intake-col:not(:last-child) {
          border-bottom-color: var(--border-slate-100) !important;
        }
      }
      [data-theme='dark'] .lv-intake-card {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      [data-theme='dark'] .lv-intake-card:not(:last-child) {
        border-bottom: 1px solid var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-intake-card:hover {
        border-color: transparent !important;
        box-shadow: none !important;
      }
      [data-theme='dark'] .lv-company-type-tag {
        color: #a5b4fc !important;
        background: rgba(99, 102, 241, 0.15) !important;
        border-color: rgba(99, 102, 241, 0.3) !important;
      }
      [data-theme='dark'] .lv-card-head-title {
        color: var(--text-slate-100) !important;
      }
      [data-theme='dark'] .lv-card-head-sub {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-card-head-action {
        color: #60a5fa !important;
      }
      [data-theme='dark'] .lv-card-head-action-muted {
        color: var(--text-slate-500) !important;
      }
      [data-theme='dark'] .lv-card-icon-circle {
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
      }
      [data-theme='dark'] .lv-card-icon-circle-sm {
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
      }
      [data-theme='dark'] .lv-card-highlight-banner {
        background: rgba(59, 130, 246, 0.12) !important;
        border-color: rgba(59, 130, 246, 0.25) !important;
      }
      [data-theme='dark'] .lv-highlight-label {
        color: #93c5fd !important;
      }
      [data-theme='dark'] .lv-highlight-val {
        color: #ffffff !important;
      }
      [data-theme='dark'] .lv-intake-facts-vlist {
        background: transparent !important;
      }
      [data-theme='dark'] .lv-fact-bullet-item {
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-fact-bullet-left {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-fact-bullet-val {
        color: var(--text-slate-100) !important;
      }
      [data-theme='dark'] .lv-proposal-badge.has-proposal {
        background: rgba(16, 185, 129, 0.15) !important;
        color: #34d399 !important;
        border-color: rgba(16, 185, 129, 0.3) !important;
      }
      [data-theme='dark'] .lv-proposal-badge.no-proposal {
        background: rgba(255, 255, 255, 0.04) !important;
        color: var(--text-slate-400) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-card-footer-banner {
        background: rgba(255, 255, 255, 0.03) !important;
        border-color: var(--border-slate-100) !important;
        color: var(--text-slate-300) !important;
      }
      [data-theme='dark'] .lv-card-footer-banner:hover {
        background: rgba(255, 255, 255, 0.06) !important;
        border-color: #334155 !important;
        color: #ffffff !important;
      }
      [data-theme='dark'] .lv-card-footer-banner svg {
        color: #60a5fa !important;
      }
      [data-theme='dark'] .lv-intake-row-item {
        border-bottom-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-row-title {
        color: var(--text-slate-100) !important;
      }
      [data-theme='dark'] .lv-row-subtitle {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-item-pill {
        background: var(--bg-primary) !important;
        border-color: var(--border-slate-100) !important;
        color: var(--text-slate-300) !important;
      }
      [data-theme='dark'] .lv-item-pill:hover {
        border-color: #3b82f6 !important;
        color: #60a5fa !important;
      }
      [data-theme='dark'] .lv-doc-icon-badge {
        background: rgba(124, 58, 237, 0.15) !important;
        color: #a78bfa !important;
        border: 1px solid rgba(124, 58, 237, 0.3) !important;
      }
      [data-theme='dark'] .lv-doc-action-btn {
        background: var(--bg-primary) !important;
        border-color: var(--border-slate-100) !important;
        color: var(--text-slate-300) !important;
      }
      [data-theme='dark'] .lv-doc-action-btn:hover {
        background: rgba(59, 130, 246, 0.15) !important;
        border-color: rgba(59, 130, 246, 0.3) !important;
        color: #60a5fa !important;
      }
      [data-theme='dark'] .lv-card-empty-state {
        background: rgba(255, 255, 255, 0.02) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-empty-state-title {
        color: var(--text-slate-100) !important;
      }
      [data-theme='dark'] .lv-empty-state-desc {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-info-tile {
        background: rgba(255, 255, 255, 0.03) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-info-tile:hover {
        background: rgba(255, 255, 255, 0.06) !important;
      }
      [data-theme='dark'] .lv-info-tile-label {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-info-tile-val {
        color: var(--text-slate-100) !important;
      }
      [data-theme='dark'] .lv-tile-val-empty {
        color: var(--text-slate-500) !important;
      }
      [data-theme='dark'] a.lv-info-tile-link {
        color: #60a5fa !important;
      }
      [data-theme='dark'] .lv-about-box {
        background: rgba(255, 255, 255, 0.02) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-about-box-head {
        color: var(--text-slate-200) !important;
      }
      [data-theme='dark'] .lv-about-head-ic {
        color: #818cf8 !important;
      }
      [data-theme='dark'] .lv-about-prose {
        color: var(--text-slate-300) !important;
      }
      [data-theme='dark'] .lv-reviews-box {
        background: rgba(245, 158, 11, 0.08) !important;
        border-color: rgba(245, 158, 11, 0.22) !important;
      }
      [data-theme='dark'] .lv-reviews-head {
        color: #fde68a !important;
      }
      [data-theme='dark'] .lv-reviews-head-ic {
        color: #fbbf24 !important;
      }
      [data-theme='dark'] .lv-reviews-prose {
        color: #fef3c7 !important;
      }
      [data-theme='dark'] .lv-metric-tile {
        background: rgba(255, 255, 255, 0.03) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-metric-tile-title {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-note-box {
        background: rgba(255, 255, 255, 0.02) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-note-box-head {
        border-bottom-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-note-badge {
        background: rgba(59, 130, 246, 0.15) !important;
        border-color: rgba(59, 130, 246, 0.3) !important;
        color: #93c5fa !important;
      }
      [data-theme='dark'] .lv-dm-notes-callout {
        background: rgba(255, 255, 255, 0.03) !important;
        color: var(--text-slate-300) !important;
      }
      [data-theme='dark'] .lv-mail-to {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-mail-snippet {
        background: rgba(255, 255, 255, 0.03) !important;
        border-color: var(--border-slate-100) !important;
        color: var(--text-slate-300) !important;
      }
      [data-theme='dark'] .lv-contact-box {
        background: rgba(255, 255, 255, 0.03) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-contact-box:hover {
        background: rgba(255, 255, 255, 0.05) !important;
        border-color: #334155 !important;
      }
      [data-theme='dark'] .lv-contact-avatar-pill {
        background: rgba(16, 185, 129, 0.15) !important;
        border-color: rgba(16, 185, 129, 0.3) !important;
        color: #34d399 !important;
      }
      [data-theme='dark'] .lv-contact-name-txt {
        color: var(--text-slate-100) !important;
      }
      [data-theme='dark'] .lv-contact-role-txt {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-contact-primary-tag {
        background: rgba(16, 185, 129, 0.15) !important;
        border-color: rgba(16, 185, 129, 0.3) !important;
        color: #34d399 !important;
      }
      [data-theme='dark'] .lv-caction-btn {
        background: var(--bg-primary) !important;
      }
      [data-theme='dark'] .lv-caction-phone {
        border-color: rgba(16, 185, 129, 0.3) !important;
        color: #34d399 !important;
      }
      [data-theme='dark'] .lv-caction-email {
        border-color: rgba(99, 102, 241, 0.3) !important;
        color: #818cf8 !important;
      }
      [data-theme='dark'] .lv-caction-linkedin {
        border-color: rgba(59, 130, 246, 0.3) !important;
        color: #60a5fa !important;
      }
      [data-theme='dark'] .lv-contact-note-strip {
        background: rgba(255, 255, 255, 0.02) !important;
        border-color: var(--border-slate-100) !important;
        border-left-color: #10b981 !important;
      }
      [data-theme='dark'] .lv-contact-note-text {
        color: var(--text-slate-300) !important;
      }

      /* Dark mode for Timeline Drawer */
      [data-theme='dark'] .lv-timeline-drawer .ant-drawer-content,
      [data-theme='dark'] .lv-timeline-drawer .ant-drawer-header {
        background: var(--bg-secondary) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-timeline-drawer .ant-drawer-title {
        color: var(--text-slate-100) !important;
      }
      [data-theme='dark'] .lv-timeline-drawer .ant-drawer-close {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-timeline-drawer .ant-drawer-close:hover {
        color: #ffffff !important;
      }
      [data-theme='dark'] .lv-tl-author {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-tl-user {
        color: var(--text-slate-200) !important;
      }
      [data-theme='dark'] .lv-tl-metadata {
        color: var(--text-slate-400) !important;
        background: rgba(255, 255, 255, 0.04) !important;
        border-color: rgba(255, 255, 255, 0.08) !important;
      }


      /* ===================== Initialize Project modal ===================== */
      .lv-init-modal .ant-modal-content {
        padding: 0 !important;
        border-radius: 4px !important;
        border: 1px solid var(--border-slate-100);
        overflow: hidden;
        background: var(--bg-pure-white);
        box-shadow: none !important;
      }
      .lv-init-modal .ant-modal-body { padding: 0 !important; }

      .lv-init-content { display: flex; flex-direction: column; }

      .lv-init-head {
        display: flex; align-items: flex-start; gap: 14px;
        padding: 22px 24px 18px;
        position: relative;
        border-bottom: 1px solid var(--border-slate-100);
      }
      .lv-init-icon {
        width: 44px; height: 44px;
        border-radius: 4px;
        background: linear-gradient(135deg, #3b82f6 0%, #3b82f6 100%);
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .lv-init-head-text { flex: 1; min-width: 0; padding-right: 40px; }
      .lv-init-eyebrow {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(99, 102, 241, 0.08);
        color: #4f46e5;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        border: 1px solid rgba(99, 102, 241, 0.2);
        margin-bottom: 8px;
      }
      .lv-init-title {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 800;
        color: var(--text-slate-900);
        letter-spacing: -0.015em;
      }
      .lv-init-sub {
        margin: 0;
        font-size: 12.5px;
        color: var(--text-slate-500);
        line-height: 1.5;
      }
      .lv-init-close {
        position: absolute;
        top: 16px; right: 16px;
        width: 30px; height: 30px;
        border-radius: 4px;
        border: 1px solid var(--border-slate-100);
        background: var(--bg-pure-white);
        color: var(--text-slate-500);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: color .15s ease, border-color .15s ease;
      }
      .lv-init-close:hover {
        color: var(--text-slate-900);
        border-color: var(--border-slate-200);
      }
      .lv-init-close:disabled { opacity: 0.5; cursor: not-allowed; }

      /* Step indicator */
      .lv-init-steps {
        display: flex; align-items: center; gap: 8px;
        margin-top: 10px;
      }
      .lv-init-step {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 11px; font-weight: 700;
        color: var(--text-slate-400);
        letter-spacing: 0.02em;
        transition: color .15s ease;
      }
      .lv-init-step-dot {
        width: 18px; height: 18px;
        border-radius: 999px;
        background: var(--bg-slate-50);
        border: 1px solid var(--border-slate-100);
        color: var(--text-slate-500);
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 10px; font-weight: 800; line-height: 1;
      }
      .lv-init-step.is-active { color: var(--text-slate-900); }
      .lv-init-step.is-active .lv-init-step-dot {
        background: #4f46e5;
        border-color: #4f46e5;
        color: #fff;
      }
      .lv-init-step.is-done { color: #047857; }
      .lv-init-step.is-done .lv-init-step-dot {
        background: rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.25);
        color: #047857;
      }
      .lv-init-step-sep {
        width: 28px; height: 1px;
        background: var(--border-slate-100);
      }

      /* Snapshot */
      .lv-init-snapshot {
        margin: 18px 24px 0;
        padding: 14px 16px;
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        background: var(--bg-slate-50);
      }
      .lv-init-snapshot-head {
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-slate-500);
        margin-bottom: 8px;
      }
      .lv-init-snapshot-title {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .lv-init-snapshot-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px 14px;
      }
      @media (max-width: 560px) {
        .lv-init-snapshot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      .lv-init-snapshot-item {
        display: flex; flex-direction: column; gap: 3px;
        min-width: 0;
      }
      .lv-init-snapshot-label {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-slate-500);
      }
      .lv-init-snapshot-value {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Capabilities */
      .lv-init-caps { padding: 18px 24px 0; }
      .lv-init-caps-head {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-slate-500);
        margin-bottom: 12px;
      }
      .lv-init-caps-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      @media (max-width: 560px) {
        .lv-init-caps-grid { grid-template-columns: 1fr; }
      }
      .lv-init-cap {
        display: flex; align-items: flex-start; gap: 10px;
        padding: 12px 14px;
        border: 1px solid var(--border-slate-100);
        border-radius: 4px;
        background: var(--bg-pure-white);
        transition: border-color .15s ease;
      }
      .lv-init-cap:hover {
        border-color: color-mix(in oklab, var(--cap-accent) 30%, var(--border-slate-100));
      }
      .lv-init-cap-icon {
        width: 28px; height: 28px;
        border-radius: 4px;
        background: color-mix(in oklab, var(--cap-accent) 12%, transparent);
        color: var(--cap-accent);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .lv-init-cap-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
      .lv-init-cap-title {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--text-slate-900);
        letter-spacing: -0.005em;
      }
      .lv-init-cap-text {
        font-size: 11.5px;
        color: var(--text-slate-500);
        line-height: 1.45;
      }

      /* Form steps */
      .lv-init-form-wrap { padding: 18px 24px 0; }
      .lv-init-pane { display: flex; flex-direction: column; }
      .lv-init-callout {
        display: flex; align-items: flex-start; gap: 10px;
        padding: 11px 13px;
        background: rgba(99, 102, 241, 0.06);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 4px;
        color: var(--text-slate-700);
        margin-bottom: 14px;
      }
      .lv-init-callout svg { color: #4f46e5; margin-top: 2px; flex-shrink: 0; }
      .lv-init-callout > div { display: flex; flex-direction: column; gap: 2px; }
      .lv-init-callout strong { font-size: 13px; color: var(--text-slate-900); font-weight: 700; }
      .lv-init-callout span { font-size: 12px; color: var(--text-slate-500); }
      .lv-init-callout-success {
        background: rgba(16, 185, 129, 0.06);
        border-color: rgba(16, 185, 129, 0.22);
      }
      .lv-init-callout-success svg { color: #059669; }

      /* Footer */
      .lv-init-footer {
        display: flex; align-items: center; justify-content: space-between;
        gap: 10px;
        padding: 18px 24px 22px;
        margin-top: 18px;
        border-top: 1px solid var(--border-slate-100);
        flex-wrap: wrap;
      }
      .lv-init-footnote {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 11.5px;
        color: var(--text-slate-500);
        font-weight: 500;
      }
      .lv-init-footnote svg { color: #10b981; }
      .lv-init-footer-actions { display: flex; gap: 8px; }

      /* Dark theme */
      [data-theme='dark'] .lv-init-modal .ant-modal-content {
        background: var(--bg-secondary) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-init-snapshot {
        background: var(--bg-primary);
        border-color: var(--border-slate-100);
      }
      [data-theme='dark'] .lv-init-cap,
      [data-theme='dark'] .lv-init-close {
        background: var(--bg-primary);
        border-color: var(--border-slate-100);
      }

      /* ===================== Legacy modal styles (kept for compat) ===================== */
      .lv-modal .ant-modal-content {
        border-radius: 4px !important;
        padding: 20px 22px !important;
        background: var(--bg-pure-white);
        border: 1px solid var(--border-slate-100);
      }
      .lv-modal .ant-modal-header { background: transparent; margin-bottom: 16px; padding: 0; border-bottom: 0; }
      .lv-modal .ant-modal-footer { padding-top: 16px; border-top: 1px solid var(--border-slate-100); margin-top: 16px; display: flex; justify-content: flex-end; gap: 8px; }

      .lv-modal-head { display: flex; align-items: center; gap: 12px; }
      .lv-modal-icon {
        width: 38px; height: 38px;
        border-radius: 4px;
        background: rgba(59, 130, 246, 0.1);
        color: #4f46e5;
        display: flex; align-items: center; justify-content: center;
      }
      .lv-modal-head-text { display: flex; flex-direction: column; }
      .lv-modal-title {
        font-size: 16px; font-weight: 800; color: var(--text-slate-900);
        letter-spacing: -0.01em;
      }
      .lv-modal-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }

      .lv-steps.ant-steps {
        margin-bottom: 18px;
      }
      .lv-steps .ant-steps-item-icon {
        width: 32px !important; height: 32px !important;
        border-radius: 4px !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
      }
      .lv-steps .ant-steps-item-process .ant-steps-item-icon {
        background: #4f46e5 !important;
        border-color: #4f46e5 !important;
      }
      .lv-steps .ant-steps-item-process .ant-steps-item-icon svg { color: #fff !important; }
      .lv-steps .ant-steps-item-finish .ant-steps-item-icon {
        background: rgba(16, 185, 129, 0.12) !important;
        border-color: rgba(16, 185, 129, 0.25) !important;
      }
      .lv-steps .ant-steps-item-finish .ant-steps-item-icon svg { color: #059669 !important; }
      .lv-steps .ant-steps-item-wait .ant-steps-item-icon {
        background: var(--bg-slate-50) !important;
        border-color: var(--border-slate-100) !important;
      }
      .lv-steps .ant-steps-item-wait .ant-steps-item-icon svg { color: var(--text-slate-500) !important; }
      .lv-steps .ant-steps-item-title { font-size: 13px !important; font-weight: 700 !important; }

      .lv-callout {
        display: flex; align-items: flex-start; gap: 10px;
        padding: 11px 13px;
        background: rgba(99, 102, 241, 0.06);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 4px;
        color: var(--text-slate-700);
        margin-bottom: 14px;
      }
      .lv-callout svg { color: #4f46e5; margin-top: 2px; flex-shrink: 0; }
      .lv-callout > div { display: flex; flex-direction: column; gap: 2px; }
      .lv-callout strong { font-size: 13px; color: var(--text-slate-900); font-weight: 700; }
      .lv-callout span { font-size: 12px; color: var(--text-slate-500); }
      .lv-callout-success {
        background: rgba(16, 185, 129, 0.06);
        border-color: rgba(16, 185, 129, 0.22);
      }
      .lv-callout-success svg { color: #059669; }

      .lv-form .ant-form-item { margin-bottom: 14px; }
      .lv-form .ant-form-item-label > label {
        font-size: 11.5px !important;
        font-weight: 700 !important;
        color: var(--text-slate-700) !important;
        letter-spacing: -0.005em !important;
      }
      .lv-input.ant-input,
      .lv-input.ant-input-affix-wrapper {
        border-radius: 4px !important;
        border: 1px solid var(--border-slate-100) !important;
        background: var(--bg-pure-white) !important;
        padding: 8px 12px !important;
        font-size: 13px !important;
      }
      .lv-input.ant-input:focus,
      .lv-input.ant-input-affix-wrapper-focused,
      .lv-input.ant-input-affix-wrapper:focus-within {
        border-color: #3b82f6 !important;
      }
      .lv-input.ant-input-affix-wrapper > .ant-input { padding: 0 !important; }
      .lv-input.lv-input-textarea.ant-input { padding: 10px 12px !important; }

      /* ===================== Dark theme ===================== */
      [data-theme='dark'] .lv-page {
        background: var(--bg-primary);
        color: var(--text-slate-100);
      }
      [data-theme='dark'] .lv-topbar { background: var(--bg-secondary); border-bottom-color: var(--border-slate-100); }
      [data-theme='dark'] .lv-back-btn.ant-btn,
      [data-theme='dark'] .lv-secondary-btn.ant-btn,
      [data-theme='dark'] .lv-hero,
      [data-theme='dark'] .lv-section,
      [data-theme='dark'] .lv-side-card,
      [data-theme='dark'] .lv-modal .ant-modal-content {
        background: var(--bg-secondary) !important;
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-back-btn.ant-btn:hover,
      [data-theme='dark'] .lv-secondary-btn.ant-btn:hover {
        background: rgba(255, 255, 255, 0.06) !important;
        border-color: #334155 !important;
        color: #ffffff !important;
      }
      [data-theme='dark'] .lv-hero-title,
      [data-theme='dark'] .lv-section-title,
      [data-theme='dark'] .lv-kpi-value,
      [data-theme='dark'] .lv-cinfo-name,
      [data-theme='dark'] .lv-dm-name {
        color: var(--text-slate-100) !important;
      }
      [data-theme='dark'] .lv-hero-sub,
      [data-theme='dark'] .lv-section-sub,
      [data-theme='dark'] .lv-hero-meta,
      [data-theme='dark'] .lv-cinfo-sub {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-cinfo-val,
      [data-theme='dark'] .lv-dm-v,
      [data-theme='dark'] .lv-fact-val {
        color: var(--text-slate-100) !important;
      }
      [data-theme='dark'] .lv-cinfo-key,
      [data-theme='dark'] .lv-dm-k,
      [data-theme='dark'] .lv-fact-key {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-kpi,
      [data-theme='dark'] .lv-notes,
      [data-theme='dark'] .lv-doc-row,
      [data-theme='dark'] .lv-skill-tag {
        background: var(--bg-primary);
        border-color: var(--border-slate-100);
      }
      [data-theme='dark'] .lv-verify.off { background: var(--bg-primary); border-color: var(--border-slate-100); }
      [data-theme='dark'] .lv-section-count { background: var(--bg-primary); border-color: var(--border-slate-100); }
      [data-theme='dark'] .lv-timeline-grid {
        background: transparent !important;
      }
      [data-theme='dark'] .lv-timeline-item {
        border-color: var(--border-slate-100) !important;
      }
      [data-theme='dark'] .lv-timeline-label {
        color: var(--text-slate-400) !important;
      }
      [data-theme='dark'] .lv-timeline-date {
        color: var(--text-slate-100) !important;
      }
      [data-theme='dark'] .lv-input.ant-input,
      [data-theme='dark'] .lv-input.ant-input-affix-wrapper {
        background: var(--bg-primary) !important;
        border-color: var(--border-slate-100) !important;
        color: var(--text-slate-100) !important;
      }

      /* Form Details */
      .lv-form-details-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px 24px;
        padding: 4px 0;
      }
      @media (max-width: 768px) {
        .lv-form-details-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }
      }
      .lv-form-details-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        border-bottom: 1px solid var(--border-slate-100);
        padding-bottom: 12px;
      }
      [data-theme='dark'] .lv-form-details-item {
        border-bottom-color: var(--border-slate-100);
      }
      .lv-form-details-item:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }
      .lv-form-details-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-slate-400);
      }
      .lv-form-details-value {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--text-slate-800);
        word-break: break-word;
        white-space: pre-wrap;
      }
      [data-theme='dark'] .lv-form-details-value {
        color: var(--text-slate-300);
      }

      /* Autofill fix for dark mode */
      [data-theme='dark'] input:-webkit-autofill,
      [data-theme='dark'] input:-webkit-autofill:hover,
      [data-theme='dark'] input:-webkit-autofill:focus,
      [data-theme='dark'] textarea:-webkit-autofill,
      [data-theme='dark'] textarea:-webkit-autofill:hover,
      [data-theme='dark'] textarea:-webkit-autofill:focus,
      [data-theme='dark'] select:-webkit-autofill,
      [data-theme='dark'] select:-webkit-autofill:hover,
      [data-theme='dark'] select:-webkit-autofill:focus {
        -webkit-text-fill-color: #c9d1d9 !important;
        -webkit-box-shadow: 0 0 0px 1000px #0d1117 inset !important;
        transition: background-color 5000s ease-in-out 0s;
      }
    `,
  }} />
);
