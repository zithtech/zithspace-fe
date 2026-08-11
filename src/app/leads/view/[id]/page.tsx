"use client";
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
  Row,
  Col,
  Select,
  message as messageStatic,
} from "antd";
import {
  ArrowLeft,
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
  Building2,
  Linkedin,
  MapPin,
  Users,
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
        <MainLayout>
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
        <MainLayout>
          <div className="lv-page lv-empty-page">
            <Empty
              description={
                <span style={{ color: "var(--text-slate-500)" }}>
                  {error || "Lead not found"}
                </span>
              }
            >
              <Button
                type="primary"
                className="lv-primary-btn"
                onClick={() => router.push("/leads")}
              >
                Back to leads
              </Button>
            </Empty>
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
  const intakeCompanyName = lead.company || lead.client_name || "Unnamed company";

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
          <span className="lv-fact-key"><FileText size={13} /> Proposal</span>
          <span className={`lv-fact-badge ${lead.proposal_id ? "ok" : "off"}`}>{lead.proposal_id ? "Created" : "None"}</span>
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
      <MainLayout>
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
              <Button
                icon={<History size={14} />}
                className="lv-secondary-btn"
                onClick={openTimeline}
              >
                View Timeline
              </Button>
              {canReadActivityLog && (
                <Button
                  icon={<History size={14} />}
                  className="lv-secondary-btn"
                  onClick={() => setTransactionHistoryOpen(true)}
                >
                  Transaction History
                </Button>
              )}
            </div>
          </div>

          {/* ----------------------- Timeline Drawer ----------------------- */}
          <Drawer
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={16} style={{ color: '#3b82f6' }} />
                <span>Lead Activity Timeline</span>
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
              <Empty description="No activity recorded yet" />
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
                        <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>by <strong style={{ color: '#475569' }}>{userName}</strong></span>
                          <span>·</span>
                          <span>{dayjs(item.createdAt).format('DD MMM YYYY, h:mm A')}</span>
                        </div>
                        {item.metadata && (
                          <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8', background: 'rgba(0,0,0,0.03)', borderRadius: 6, padding: '4px 8px', border: '1px solid rgba(0,0,0,0.05)' }}>
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

          <div className="lv-body">
            {isIntake ? (
              /* ==================== INTAKE detail body ==================== */
              <>
                <div className="lv-grid">
                  {/* LEFT — Company · Contacts · Notes */}
                  <main className="lv-main">
                    {/* 1. Company info */}
                    <section className="lv-section lv-cinfo">
                      <div className="lv-cinfo-head">
                        <div className="lv-avatar lv-avatar-sq lv-avatar-lg">{getInitials(intakeCompanyName)}</div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="lv-cinfo-titlerow">
                            <h2 className="lv-cinfo-name">{intakeCompanyName}</h2>
                            {fd.companyType && <span className="lv-cinfo-badge"><Briefcase size={11} />{fd.companyType}</span>}
                          </div>
                          <div className="lv-cinfo-sub">
                            <span className="lv-cinfo-kind"><Building2 size={11} /> Lead Intake</span>
                            <span className="lv-dot" />
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <Clock size={11} /> Added {lead.created_at ? dayjs(lead.created_at).fromNow() : (lead.posted_on ? dayjs(lead.posted_on).fromNow() : "recently")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="lv-cinfo-grid">
                        <div className="lv-cinfo-item">
                          <span className="lv-cinfo-key"><Mail size={12} /> Email</span>
                          {lead.client_mail ? <a className="lv-cinfo-val lv-cinfo-link" href={`mailto:${lead.client_mail}`} title={lead.client_mail}>{lead.client_mail}</a> : <span className="lv-cinfo-val">—</span>}
                        </div>
                        <div className="lv-cinfo-item">
                          <span className="lv-cinfo-key"><Phone size={12} /> Phone</span>
                          <span className="lv-cinfo-val">{lead.client_phone || "—"}</span>
                        </div>
                        <div className="lv-cinfo-item">
                          <span className="lv-cinfo-key"><Globe size={12} /> Website</span>
                          {fd.website ? <a className="lv-cinfo-val lv-cinfo-link" href={/^https?:\/\//.test(fd.website) ? fd.website : `https://${fd.website}`} target="_blank" rel="noreferrer" title={fd.website}>{fd.website}</a> : <span className="lv-cinfo-val">—</span>}
                        </div>
                        <div className="lv-cinfo-item">
                          <span className="lv-cinfo-key"><Linkedin size={12} /> LinkedIn</span>
                          {fd.linkedin ? <a className="lv-cinfo-val lv-cinfo-link" href={/^https?:\/\//.test(fd.linkedin) ? fd.linkedin : `https://${fd.linkedin}`} target="_blank" rel="noreferrer" title={fd.linkedin}>{fd.linkedin}</a> : <span className="lv-cinfo-val">—</span>}
                        </div>
                        <div className="lv-cinfo-item">
                          <span className="lv-cinfo-key"><MapPin size={12} /> Location</span>
                          <span className="lv-cinfo-val">{fd.location || lead.client_location || "—"}</span>
                        </div>
                        <div className="lv-cinfo-item">
                          <span className="lv-cinfo-key"><Users size={12} /> Team size</span>
                          <span className="lv-cinfo-val">{fd.teamSize || lead.company_size || "—"}</span>
                        </div>
                      </div>

                      <div className="lv-cinfo-details">
                        <span className="lv-meta-label">Company details</span>
                        {fd.coreBusiness && (
                          <div className="lv-cinfo-core"><Briefcase size={12} /> {fd.coreBusiness}</div>
                        )}
                        <div className="lv-prose" style={{ marginTop: fd.coreBusiness ? 10 : 6 }}>
                          {fd.companyDescription || lead.summary || "No company description provided."}
                        </div>
                        {fd.reviews && (
                          <div className="lv-cinfo-reviews">
                            <span className="lv-meta-label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Star size={12} /> Reviews & research</span>
                            <div className="lv-prose" style={{ marginTop: 6 }}>{fd.reviews}</div>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* 2. Contacts (decision makers) */}
                    <section className="lv-section">
                      <header className="lv-section-head">
                        <div className="lv-section-icon" style={{ ["--lv-section-accent" as any]: "#10b981" }}><Users size={14} /></div>
                        <h3 className="lv-section-title">Contacts</h3>
                        {decisionMakers.length > 0 && <span className="lv-section-count">{decisionMakers.length}</span>}
                      </header>
                      <div className="lv-section-body">
                        {decisionMakers.length > 0 ? (
                          <div className="lv-dm-list">
                            {decisionMakers.map((c, i) => (
                              <div key={i} className="lv-dm-card">
                                <div className="lv-dm-card-head">
                                  <div className="lv-dm-avatar">{getInitials(c.name)}</div>
                                  <div style={{ minWidth: 0 }}>
                                    <div className="lv-dm-name">{c.name || "Unnamed contact"}</div>
                                    {c.designation && <div className="lv-dm-role-sub">{c.designation}</div>}
                                  </div>
                                </div>
                                <div className="lv-dm-fields">
                                  <div className="lv-dm-field">
                                    <span className="lv-dm-k">Designation</span>
                                    <span className="lv-dm-v">{c.designation || "—"}</span>
                                  </div>
                                  <div className="lv-dm-field">
                                    <span className="lv-dm-k">Phone</span>
                                    {c.phone ? <a className="lv-dm-v lv-dm-vlink" href={`tel:${c.phone}`}>{c.phone}</a> : <span className="lv-dm-v">—</span>}
                                  </div>
                                  <div className="lv-dm-field">
                                    <span className="lv-dm-k">Mail</span>
                                    {c.email ? <a className="lv-dm-v lv-dm-vlink" href={`mailto:${c.email}`} title={c.email}>{c.email}</a> : <span className="lv-dm-v">—</span>}
                                  </div>
                                  <div className="lv-dm-field">
                                    <span className="lv-dm-k">LinkedIn URL</span>
                                    {c.linkedin ? <a className="lv-dm-v lv-dm-vlink" href={/^https?:\/\//.test(c.linkedin) ? c.linkedin : `https://${c.linkedin}`} target="_blank" rel="noreferrer" title={c.linkedin}>{c.linkedin}</a> : <span className="lv-dm-v">—</span>}
                                  </div>
                                  {c.notes && (
                                    <div className="lv-dm-field">
                                      <span className="lv-dm-k">Notes</span>
                                      <span className="lv-dm-v" title={c.notes}>{c.notes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="lv-empty-state">
                            <Users size={24} style={{ color: '#cbd5e1', marginBottom: 8 }} />
                            <Text className="lv-muted">No contacts added yet.</Text>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* 3. Notes */}
                    <section className="lv-section">
                      <header className="lv-section-head">
                        <div className="lv-section-icon" style={{ ["--lv-section-accent" as any]: "#64748b" }}><Edit2 size={13} /></div>
                        <h3 className="lv-section-title">Notes</h3>
                      </header>
                      <div className="lv-section-body">
                        <div className="lv-notes">
                          {(fd.internalNotes || lead.internal_notes) ? (
                            <Paragraph style={{ margin: 0, color: "var(--text-slate-700)" }}>{fd.internalNotes || lead.internal_notes}</Paragraph>
                          ) : (
                            <Text className="lv-muted">No notes recorded. Add context for your team.</Text>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Mailing history */}
                    <section className="lv-section">
                      <header className="lv-section-head">
                        <div className="lv-section-icon" style={{ ["--lv-section-accent" as any]: "#ec4899" }}><Mail size={14} /></div>
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
                                <div className="lv-mail-excerpt">{mail.body.replace(/<[^>]*>?/gm, '').slice(0, 120)}...</div>
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
                  </main>

                  {/* RIGHT — Key facts · Documents */}
                  <aside className="lv-side">
                    {/* 4. Key facts */}
                    {renderKeyFacts()}

                    {/* 5. Documents */}
                    <section className="lv-side-card">
                      <header className="lv-side-head">Documents</header>
                      <div className="lv-docs">
                        {lead.documents && lead.documents.length > 0 ? (
                          lead.documents.map((doc: any, i: number) => {
                            const d = typeof doc === "string" ? { name: doc, url: doc } : doc;
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <button type="button" onClick={() => handleDownload(d.url, d.name, 'inline')} className="lv-doc-row" style={{ flex: 1, minWidth: 0, marginBottom: 0, textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                  <FileText size={13} />
                                  <span className="lv-doc-name" title={d.name}>{d.name || "Attachment"}</span>
                                  <ExternalLink size={11} className="lv-doc-ext" />
                                </button>
                                <Button type="text" size="small" icon={<Download size={14} />} onClick={() => handleDownload(d.url, d.name, 'attachment')} style={{ color: '#3b82f6', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
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
                  </header>
                  <div className="lv-section-body">
                    <div className="lv-notes">
                      {lead.internal_notes ? (
                        <Paragraph style={{ margin: 0, color: "var(--text-slate-700)" }}>{lead.internal_notes}</Paragraph>
                      ) : (
                        <Text className="lv-muted">No notes recorded. Add context for your team.</Text>
                      )}
                    </div>
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
        margin: 0 -24px;
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

      /* ---------- Lead Intake additions ---------- */
      .lv-avatar-sq { border-radius: 10px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
      .lv-avatar-lg { width: 54px; height: 54px; font-size: 18px; border-radius: 12px; }

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
      [data-theme='dark'] .lv-kpi,
      [data-theme='dark'] .lv-notes,
      [data-theme='dark'] .lv-doc-row,
      [data-theme='dark'] .lv-skill-tag {
        background: var(--bg-primary);
        border-color: var(--border-slate-100);
      }
      [data-theme='dark'] .lv-verify.off { background: var(--bg-primary); border-color: var(--border-slate-100); }
      [data-theme='dark'] .lv-section-count { background: var(--bg-primary); border-color: var(--border-slate-100); }

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
