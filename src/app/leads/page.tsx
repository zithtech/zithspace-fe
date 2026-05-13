"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Briefcase,
  Plus,
  Search,
  CheckCircle2,
  Settings2,
  Trash2,
  Mail,
  Phone,
  Clock,
  Link as LinkIcon,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  User,
  PlusCircle,
  X,
  ExternalLink,
  AlertCircle,
  Eye,
  Filter,
  RefreshCw,
  ShieldCheck,
  Zap,
  Sparkles,
  MoreVertical,
  ChevronRight,
  Edit2,
  Flame,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Brain,
  CheckCircle,
  ArrowUpRight,
  ListFilter,
  Download
} from "lucide-react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Drawer,
  notification,
  Space,
  Row,
  Col,
  Typography,
  Tooltip,
  Popconfirm,
  InputNumber,
  Divider,
  DatePicker,
  Avatar,
  Empty,
  Spin,
  Tabs,
  Dropdown,
  Modal,
  App,
  Skeleton,
  Popover,
  Segmented,
  Switch,
  type MenuProps
} from "antd";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { TablePreferenceService } from "@/services/tablePreferenceService";
import dayjs from "dayjs";
import { useLeads } from "@/hooks/useLeads";
import { useLeadSettings } from "@/hooks/useLeadSettings";
import { Lead } from "@/services/leadService";
import {
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  FileOutlined,
  CalendarOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  SendOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { TextArea } = Input;
const { Text, Title } = Typography;

// Table settings — density + column visibility, persisted per-user in DB.
type LmDensity = "compact" | "comfortable" | "spacious";
const LM_TABLE_KEY = "leads_v1";
const TOGGLEABLE_COLUMNS: { key: string; label: string }[] = [
  { key: "platform",     label: "Platform" },
  { key: "status",       label: "Status" },
  { key: "actions_item", label: "Workflow Action" },
  { key: "budget",       label: "Budget" },
  { key: "ai_score",     label: "AI Score" },
  { key: "bidiq",        label: "BidIq" },
  { key: "proposal",     label: "Proposal" },
  { key: "created_by",   label: "Created by" },
  { key: "created_at",   label: "Created" },
];

export default function LeadsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm();
  const { message: messageApi, modal } = App.useApp();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [filterCreatedBy, setFilterCreatedBy] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<"all" | "hot" | "week" | "won">("all");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [statusEditId, setStatusEditId] = useState<string | null>(null);
  const [actionEditId, setActionEditId] = useState<string | null>(null);
  const [bidiqPreviewLead, setBidiqPreviewLead] = useState<Lead | null>(null);
  const [tableDensity, setTableDensity] = useState<LmDensity>("comfortable");
  const [hiddenCols, setHiddenCols] = useState<Record<string, boolean>>({});
  // Gate persistence until the initial DB load completes; otherwise the persist
  // effects fire on first mount with the empty defaults and clobber whatever
  // the user previously saved.
  const [tablePrefsLoaded, setTablePrefsLoaded] = useState(false);
  const tablePrefsSaveTimer = useRef<number | null>(null);

  // Load saved preferences from the backend on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await TablePreferenceService.get<{
          density?: LmDensity;
          hiddenCols?: Record<string, boolean>;
        }>(LM_TABLE_KEY);
        if (cancelled) return;
        if (saved?.density && ["compact", "comfortable", "spacious"].includes(saved.density)) {
          setTableDensity(saved.density);
        }
        if (saved?.hiddenCols && typeof saved.hiddenCols === "object") {
          setHiddenCols(saved.hiddenCols);
        }
      } catch (err) {
        // 404 / no prefs yet is fine — keep defaults.
        console.warn("Failed to load table preferences", err);
      } finally {
        if (!cancelled) setTablePrefsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist any change (debounced) to the backend after the initial load.
  useEffect(() => {
    if (!tablePrefsLoaded) return;
    if (tablePrefsSaveTimer.current !== null) {
      window.clearTimeout(tablePrefsSaveTimer.current);
    }
    tablePrefsSaveTimer.current = window.setTimeout(() => {
      TablePreferenceService.save(LM_TABLE_KEY, {
        density: tableDensity,
        hiddenCols,
      }).catch((err) => console.warn("Failed to save table preferences", err));
    }, 300);
    return () => {
      if (tablePrefsSaveTimer.current !== null) {
        window.clearTimeout(tablePrefsSaveTimer.current);
        tablePrefsSaveTimer.current = null;
      }
    };
  }, [tablePrefsLoaded, tableDensity, hiddenCols]);

  const openBidiqPreview = (lead: Lead) => setBidiqPreviewLead(lead);
  const closeBidiqPreview = () => setBidiqPreviewLead(null);
  const launchBidiq = () => {
    if (!bidiqPreviewLead) return;
    const id = bidiqPreviewLead.id;
    setBidiqPreviewLead(null);
    router.push(`/leads/bidiq/${id}`);
  };

  // Use the custom hook for backend connectivity
  const { leads, loading: leadsLoading, error, fetchLeads, createLead, updateLead, deleteLead } = useLeads();
  const { statuses: configStatuses, actions: configActions, fetchStatuses, fetchActions, loading: settingsLoading } = useLeadSettings();

  const loading = leadsLoading || settingsLoading;

  const handleView = (record: Lead) => {
    router.push(`/leads/view/${record.id}`);
  };

  // Load leads and settings on component mount
  useEffect(() => {
    fetchLeads();
    fetchStatuses();
    fetchActions();
  }, [fetchLeads, fetchStatuses, fetchActions]);

  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      messageApi.error(error);
    }
  }, [error, messageApi]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLead(leadId, { status: newStatus });
      messageApi.success('Status Updated');
    } catch (error) {
      messageApi.error('Failed to update status');
    }
  };

  const handleActionChange = async (leadId: string, newAction: string) => {
    try {
      await updateLead(leadId, { actions: newAction });
      messageApi.success('Action Updated');
    } catch (error) {
      messageApi.error('Failed to update action');
    }
  };

  const renderActionIcon = (iconName?: string): React.ReactElement => {
    switch (iconName) {
      case 'phone': return <PhoneOutlined />;
      case 'mail': return <MailOutlined />;
      case 'clock': return <ClockCircleOutlined />;
      case 'user': return <UserOutlined />;
      case 'file': return <FileOutlined />;
      case 'calendar': return <CalendarOutlined />;
      case 'message': return <MessageOutlined />;
      case 'video': return <VideoCameraOutlined />;
      case 'check': return <CheckCircleOutlined />;
      case 'close': return <CloseCircleOutlined />;
      case 'team': return <TeamOutlined />;
      case 'send': return <SendOutlined />;
      case 'link': return <LinkOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const AVATAR_PALETTE = [
    { bg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", ring: "rgba(99, 102, 241, 0.18)" },
    { bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)", ring: "rgba(16, 185, 129, 0.18)" },
    { bg: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)", ring: "rgba(245, 158, 11, 0.18)" },
    { bg: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)", ring: "rgba(236, 72, 153, 0.18)" },
    { bg: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", ring: "rgba(6, 182, 212, 0.18)" },
    { bg: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", ring: "rgba(139, 92, 246, 0.18)" },
    { bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", ring: "rgba(239, 68, 68, 0.18)" },
  ];

  const getAvatarStyle = (key: string) => {
    if (!key) return AVATAR_PALETTE[0];
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  };

  const getAIScoreLevel = (score?: number) => {
    if (score === undefined || score === null) return null;
    if (score >= 80) return { label: "Hot", color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", icon: <Flame size={11} /> };
    if (score >= 60) return { label: "Warm", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", icon: <TrendingUp size={11} /> };
    if (score >= 40) return { label: "Mild", color: "#6366f1", bg: "rgba(99, 102, 241, 0.08)", icon: <Activity size={11} /> };
    return { label: "Cold", color: "#64748b", bg: "rgba(100, 116, 139, 0.08)", icon: <Activity size={11} /> };
  };

  const formatRelativeTime = (date?: string) => {
    if (!date) return "";
    const diff = dayjs().diff(dayjs(date), "hour");
    if (diff < 1) return "just now";
    if (diff < 24) return `${diff}h ago`;
    const days = Math.floor(diff / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return dayjs(date).format("MMM D");
  };

  // Resolve the creator name from any of the possible backend fields, falling
  // back to the currently-signed-in user when no creator data exists yet.
  const getLeadCreator = (lead: Lead): string => {
    const r = lead as any;
    return r.created_by_name || r.created_by || r.creator_name || r.owner_name || user?.name || "";
  };

  const columns = [
    {
      title: "Lead",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Lead) => {
        const avatar = getAvatarStyle(record.client_name || record.id);
        const scoreLevel = getAIScoreLevel(record.ai_score);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              className="lead-avatar"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: avatar.bg,
                boxShadow: `0 0 0 4px ${avatar.ring}`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: "0.02em",
                flexShrink: 0,
                position: "relative",
              }}
            >
              {getInitials(record.client_name)}
              {scoreLevel?.label === "Hot" && (
                <div style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #fff",
                  color: "#fff"
                }}>
                  <Flame size={9} />
                </div>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                {(() => {
                  const fullTitle = text || "";
                  const isLong = fullTitle.length > 28;
                  const display = isLong ? `${fullTitle.slice(0, 28)}…` : fullTitle;
                  const titleNode = (
                    <Text
                      strong
                      style={{
                        color: "var(--text-slate-900)",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: isLong ? "help" : "default",
                      }}
                    >
                      {display}
                    </Text>
                  );
                  if (!isLong) return titleNode;
                  return (
                    <Tooltip
                      placement="topLeft"
                      mouseEnterDelay={0.15}
                      classNames={{ root: "lm-title-tooltip-overlay" }}
                      title={
                        <div className="lm-title-tooltip">
                          <div className="lm-title-tooltip-eyebrow">Lead title</div>
                          <div className="lm-title-tooltip-text">{fullTitle}</div>
                          {(record.client_name || record.posted_on) && (
                            <div className="lm-title-tooltip-sub">
                              {record.client_name && <span>{record.client_name}</span>}
                              {record.client_name && record.posted_on && <span className="lm-title-tooltip-dot" />}
                              {record.posted_on && <span>Posted {formatRelativeTime(record.posted_on)}</span>}
                            </div>
                          )}
                        </div>
                      }
                    >
                      {titleNode}
                    </Tooltip>
                  );
                })()}
                {record.client_payment_verified && (
                  <span title="Payment Verified" style={{ display: "inline-flex", color: "#10b981" }}>
                    <CheckCircle size={13} />
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-slate-500)" }}>
                <span style={{ fontWeight: 500 }}>{record.client_name}</span>
                {record.posted_on && (
                  <>
                    <span style={{ color: "#cbd5e1" }}>·</span>
                    <span style={{ color: "#94a3b8" }}>{formatRelativeTime(record.posted_on)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      width: 120,
      render: (platform: string) => (
        <Tag color={
          platform === 'Upwork' ? 'green' :
            platform === 'LinkedIn' ? 'blue' :
              platform === 'Freelancer' ? 'cyan' :
                platform === 'Fiverr' ? 'orange' : 'default'
        } style={{ borderRadius: 6 }}>
          {platform || 'Upwork'}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string, record: Lead) => {
        const cfg = configStatuses.find(s => s.name === status);
        const color = cfg?.color || '#6366f1';
        const isEditing = statusEditId === record.id;

        if (isEditing) {
          return (
            <Select
              value={status}
              defaultOpen
              autoFocus
              style={{ width: '100%' }}
              bordered={false}
              className="status-select-premium lm-status-select"
              classNames={{ popup: { root: "lm-status-dropdown" } }}
              onChange={(value) => { handleStatusChange(record.id, value); setStatusEditId(null); }}
              onBlur={() => setStatusEditId(null)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              popupMatchSelectWidth={false}
              suffixIcon={null}
              optionLabelProp="label"
              options={configStatuses.map(s => {
                const c = s.color || "#6366f1";
                return {
                  value: s.name,
                  label: (
                    <span
                      className="lm-status-pill"
                      style={{
                        backgroundColor: `${c}12`,
                        color: c,
                        border: `1px solid ${c}25`,
                      }}
                    >
                      <span className="lm-status-pill-text">{s.name}</span>
                    </span>
                  ),
                  data: { color: c, name: s.name },
                };
              })}
              optionRender={(opt) => {
                const d: any = (opt.data as any)?.data || (opt as any).data || {};
                const c = d.color || "#6366f1";
                const selected = (opt.value as string) === status;
                return (
                  <div className={`lm-dd-row${selected ? " is-selected" : ""}`}>
                    <span className="lm-dd-dot" style={{ background: c, boxShadow: `0 0 0 3px ${c}26` }} />
                    <span className="lm-dd-text" style={{ color: selected ? "var(--text-slate-900)" : "var(--text-slate-700)" }}>
                      {d.name || (opt.value as string)}
                    </span>
                    {selected && <CheckCircle2 size={13} className="lm-dd-check" style={{ color: c }} />}
                  </div>
                );
              }}
            />
          );
        }

        return (
          <button
            type="button"
            className="lm-status-pill"
            onClick={(e) => {
              e.stopPropagation();
              setStatusEditId(record.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              ["--pill-color" as any]: color,
              backgroundColor: `${color}12`,
              color,
              border: `1px solid ${color}25`,
            }}
            title="Click to change status"
          >
            <span className="lm-status-pill-text">{status || "—"}</span>
            <Edit2 size={10} className="lm-status-pill-edit" />
          </button>
        );
      },
    },
    {
      title: "Workflow Action",
      dataIndex: "actions_item",
      key: "actions_item",
      width: 150,
      render: (action: string, record: Lead) => {
        const cfg = configActions.find(a => a.name === action);
        const color = cfg?.color || "#6366f1";
        const isEditing = actionEditId === record.id;

        if (isEditing) {
          return (
            <Select
              defaultValue={action}
              defaultOpen
              autoFocus
              allowClear
              placeholder="Choose action"
              style={{ width: "100%" }}
              bordered={false}
              className="status-select-premium lm-status-select"
              classNames={{ popup: { root: "lm-status-dropdown" } }}
              onChange={(value) => { handleActionChange(record.id, value || ""); setActionEditId(null); }}
              onBlur={() => setActionEditId(null)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              popupMatchSelectWidth={false}
              suffixIcon={null}
              optionLabelProp="label"
              options={configActions.map(a => {
                const c = a.color || "#6366f1";
                return {
                  value: a.name,
                  label: (
                    <span
                      className="lm-status-pill lm-action-pill"
                      style={{
                        backgroundColor: `${c}12`,
                        color: c,
                        border: `1px solid ${c}25`,
                      }}
                    >
                      <span className="lm-action-pill-icon" style={{ background: `${c}22`, color: c }}>
                        {React.cloneElement(renderActionIcon(a.icon) as React.ReactElement, { style: { fontSize: 11 } })}
                      </span>
                      <span className="lm-status-pill-text">{a.name}</span>
                    </span>
                  ),
                  data: { color: c, name: a.name, icon: a.icon },
                };
              })}
              optionRender={(opt) => {
                const d: any = (opt.data as any)?.data || (opt as any).data || {};
                const c = d.color || "#6366f1";
                const selected = (opt.value as string) === action;
                return (
                  <div className={`lm-dd-row${selected ? " is-selected" : ""}`}>
                    <span className="lm-dd-icon" style={{ background: `${c}14`, color: c, border: `1px solid ${c}26` }}>
                      {React.cloneElement(renderActionIcon(d.icon) as React.ReactElement, { style: { fontSize: 12 } })}
                    </span>
                    <span className="lm-dd-text" style={{ color: selected ? "var(--text-slate-900)" : "var(--text-slate-700)" }}>
                      {d.name || (opt.value as string)}
                    </span>
                    {selected && <CheckCircle2 size={13} className="lm-dd-check" style={{ color: c }} />}
                  </div>
                );
              }}
            />
          );
        }

        if (!action) {
          return (
            <button
              type="button"
              className="lm-status-pill lm-status-pill-empty"
              onClick={(e) => { e.stopPropagation(); setActionEditId(record.id); }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Click to set action"
            >
              <PlusCircle size={11} />
              Set action
            </button>
          );
        }

        return (
          <button
            type="button"
            className="lm-status-pill lm-action-pill"
            onClick={(e) => { e.stopPropagation(); setActionEditId(record.id); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              ["--pill-color" as any]: color,
              backgroundColor: `${color}12`,
              color,
              border: `1px solid ${color}25`,
            }}
            title="Click to change action"
          >
            <span
              className="lm-action-pill-icon"
              style={{ background: `${color}22`, color }}
            >
              {React.cloneElement(renderActionIcon(cfg?.icon || "") as React.ReactElement, { style: { fontSize: 11 } })}
            </span>
            <span className="lm-status-pill-text">{action}</span>
            <Edit2 size={10} className="lm-status-pill-edit" />
          </button>
        );
      },
    },
    {
      title: "Budget",
      key: "budget",
      width: 130,
      render: (_: unknown, record: Lead) => {
        const value = record.budget || (record.hour_based_amount ? `${record.hour_based_amount}/hr` : null);
        if (!value) return <Text style={{ color: "#cbd5e1", fontSize: 12 }}>—</Text>;
        const isHourly = String(value).includes("/hr");
        return (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <DollarSign size={13} style={{ color: "#10b981", alignSelf: "center" }} />
            <Text strong style={{ color: "var(--text-slate-900)", fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
              {String(value).replace(/^\$/, "").replace("/hr", "")}
            </Text>
            {isHourly && (
              <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>/hr</Text>
            )}
          </div>
        );
      },
    },
    {
      title: "AI Score",
      dataIndex: "ai_score",
      key: "ai_score",
      width: 110,
      render: (score: number | undefined) => {
        const level = getAIScoreLevel(score);
        if (!level) return <Text style={{ color: "#cbd5e1", fontSize: 12 }}>—</Text>;
        return (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: level.bg,
              color: level.color,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.03em",
              border: `1px solid ${level.color}25`,
            }}
          >
            {level.icon}
            <span>{level.label}</span>
            <span style={{ opacity: 0.7, fontWeight: 600 }}>{score}</span>
          </div>
        );
      },
    },
    {
      title: "BidIq",
      key: "bidiq",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: Lead) => {
        const hasBidiq =
          (record.ai_score && record.ai_score > 0) ||
          !!record.skill_analysis ||
          !!record.ai_summary;

        return (
          <Button
            type="link"
            icon={hasBidiq ? <Eye size={15} /> : <Zap size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              if (hasBidiq) {
                router.push(`/leads/bidiq/${record.id}`);
              } else {
                openBidiqPreview(record);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: hasBidiq ? "#10b981" : "var(--premium-blue)",
              fontWeight: 700,
              fontSize: 13,
              padding: 0,
            }}
          >
            {hasBidiq ? "View BidIq" : "BidIq"}
          </Button>
        );
      },
    },
    {
      title: "Proposal",
      key: "proposal",
      width: 140,
      render: (_: unknown, record: Lead) => (
        record.proposal_id ? (
          <Button
            type="link"
            icon={<FileText size={16} />}
            onClick={(e) => { e.stopPropagation(); router.push(`/proposals/${record.proposal_id}`); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#10b981",
              fontWeight: 700,
              fontSize: 13,
              padding: 0
            }}
          >
            View Proposal
          </Button>
        ) : (
          <Button
            type="link"
            icon={<Sparkles size={16} />}
            onClick={(e) => { e.stopPropagation(); openBidiqPreview(record); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--premium-blue)",
              fontWeight: 700,
              fontSize: 13,
              padding: 0
            }}
          >
            Generate
          </Button>
        )
      ),
    },
    {
      title: "Created by",
      key: "created_by",
      width: 170,
      render: (_: unknown, record: Lead) => {
        const r = record as any;
        const rawName: string | undefined =
          r.created_by_name || r.created_by || r.creator_name || r.owner_name;
        const name = rawName || user?.name || "—";
        const isYou = !rawName && !!user?.name;
        const initials = (name || "—")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w: string) => w[0]?.toUpperCase() || "")
          .join("") || "—";
        const palette = getAvatarStyle(name);
        return (
          <div className="lm-creator-cell">
            <span
              className="lm-creator-avatar"
              style={{ background: palette.bg }}
            >
              {initials}
            </span>
            <div className="lm-creator-text">
              <span className="lm-creator-name">
                {name}
                {isYou && <span className="lm-creator-you"> · you</span>}
              </span>
              {r.created_by_email && (
                <span className="lm-creator-email">{r.created_by_email}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (value: string) => {
        if (!value) return <Text style={{ color: "#cbd5e1", fontSize: 12 }}>—</Text>;
        const d = dayjs(value);
        return (
          <Tooltip title={d.format("MMM D, YYYY · h:mm A")} placement="topLeft">
            <div className="lm-created-cell">
              <span className="lm-created-date">{d.format("MMM D, YYYY")}</span>
              <span className="lm-created-rel">{formatRelativeTime(value)}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "table-actions",
      align: "right" as const,
      width: 80,
      render: (_: unknown, record: Lead) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: 'View Details',
            icon: <Eye size={16} />,
          },
          {
            key: 'edit',
            label: 'Edit Lead',
            icon: <Settings2 size={16} />,
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: 'Delete Lead',
            danger: true,
            icon: <Trash2 size={16} />,
          }
        ];

        return (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                if (key === 'view') handleView(record);
                if (key === 'edit') handleEdit(record);
                if (key === 'delete') {
                  modal.confirm({
                    title: "Are you sure you want to delete this lead?",
                    content: "This action cannot be undone.",
                    okText: "Delete",
                    cancelText: "Cancel",
                    okButtonProps: { danger: true },
                    onOk: () => handleDelete(record.id)
                  });
                }
              }
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreVertical size={20} style={{ color: "var(--text-slate-400)" }} />}
              className="action-btn"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
  ];

  const handleEdit = (record: Lead) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      clientName: record.client_name,
      clientMail: record.client_mail,
      clientPhone: record.client_phone,
      clientLocation: record.client_location,
      title: record.title,
      summary: record.summary,
      skills: record.skills,
      duration: record.duration,
      hourBasedAmount: record.hour_based_amount,
      jobLink: record.job_link,
      estOrProjectDuration: record.est_project_duration,
      status: record.status,
      actions: record.actions_item,
      timeline: record.timeline_start && record.timeline_end
        ? [dayjs(record.timeline_start), dayjs(record.timeline_end)]
        : null,
      postedOn: record.posted_on ? dayjs(record.posted_on) : null,
      documents: Array.isArray(record.documents)
        ? record.documents.map(doc =>
          typeof doc === 'string' ? { name: doc, url: doc } : doc
        )
        : record.documents,
      platform: ['Upwork', 'LinkedIn', 'Freelancer', 'Fiverr'].includes(record.platform || '') ? record.platform : 'Other',
      customPlatform: !['Upwork', 'LinkedIn', 'Freelancer', 'Fiverr'].includes(record.platform || '') ? record.platform : '',
      experienceLevel: record.experience_level,
      jobType: record.job_type,
      budget: record.budget,
      clientRating: record.client_rating,
      clientSpend: record.client_spend,
      clientPaymentVerified: record.client_payment_verified,
      clientPhoneVerified: record.client_phone_verified,
      ai_summary: record.ai_summary,
    });
    setIsDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLead(id);
      messageApi.success("Lead moved to Trash");
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) return;
    modal.confirm({
      title: `Delete ${selectedRowKeys.length} lead${selectedRowKeys.length > 1 ? "s" : ""}?`,
      content: "Selected leads will be moved to Trash. This action can be reverted from there.",
      okText: "Move to Trash",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map((id) => deleteLead(String(id))));
          messageApi.success(`${selectedRowKeys.length} lead${selectedRowKeys.length > 1 ? "s" : ""} moved to Trash`);
          setSelectedRowKeys([]);
        } catch (err) {
          // Error surfaced via hook
        }
      },
    });
  };

  const handleSaveLead = async (values: any) => {
    try {
      // Map custom platform if 'Other' is selected
      const finalValues = { ...values };
      if (values.platform === 'Other') {
        finalValues.platform = values.customPlatform;
      }
      delete finalValues.customPlatform;

      if (editingKey) {
        await updateLead(editingKey, finalValues);
        messageApi.success("Lead Updated");
      } else {
        await createLead(finalValues);
        messageApi.success("Lead Created");
      }
      setIsDrawerVisible(false);
      form.resetFields();
      setEditingKey(null);
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const filteredLeads = useMemo(() => {
    const weekAgo = dayjs().subtract(7, 'day');
    return leads.filter(item => {
      // Search matching
      const matchesSearch = !searchText ||
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.client_name.toLowerCase().includes(searchText.toLowerCase());

      // Status matching
      const matchesStatus = !filterStatus || item.status === filterStatus;

      // Action matching
      const matchesAction = !filterAction || item.actions_item === filterAction;

      // Platform matching
      const matchesPlatform = !filterPlatform || item.platform === filterPlatform;

      // Date Range matching
      let matchesDateRange = true;
      if (filterDateRange && item.posted_on) {
        const postedOn = dayjs(item.posted_on);
        const [start, end] = filterDateRange;
        matchesDateRange = postedOn.isAfter(start.startOf('day')) && postedOn.isBefore(end.endOf('day'));
      }

      // Created-by matching
      const matchesCreatedBy =
        !filterCreatedBy ||
        getLeadCreator(item) === filterCreatedBy;

      // Segment matching
      let matchesSegment = true;
      if (activeSegment === "hot") {
        matchesSegment = (item.ai_score || 0) >= 80;
      } else if (activeSegment === "week") {
        matchesSegment = dayjs(item.created_at || item.posted_on).isAfter(weekAgo);
      } else if (activeSegment === "won") {
        const status = (item.status || "").toLowerCase();
        matchesSegment = status.includes("won") || status.includes("accept") || status.includes("close") || !!item.proposal_id;
      }

      return matchesSearch && matchesStatus && matchesAction && matchesPlatform && matchesDateRange && matchesCreatedBy && matchesSegment;
    });
  }, [leads, searchText, filterStatus, filterAction, filterPlatform, filterDateRange, filterCreatedBy, activeSegment, user]);

  const creatorOptions = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      const name = getLeadCreator(l);
      if (name) set.add(name);
    });
    return Array.from(set).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, user]);

  const segmentCounts = useMemo(() => {
    const weekAgo = dayjs().subtract(7, 'day');
    return {
      all: leads.length,
      hot: leads.filter(l => (l.ai_score || 0) >= 80).length,
      week: leads.filter(l => dayjs(l.created_at || l.posted_on).isAfter(weekAgo)).length,
      won: leads.filter(l => {
        const s = (l.status || "").toLowerCase();
        return s.includes("won") || s.includes("accept") || s.includes("close") || !!l.proposal_id;
      }).length,
    };
  }, [leads]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (filterStatus) chips.push({ key: "status", label: `Status: ${filterStatus}`, onClear: () => setFilterStatus(null) });
    if (filterPlatform) chips.push({ key: "platform", label: `Platform: ${filterPlatform}`, onClear: () => setFilterPlatform(null) });
    if (filterAction) chips.push({ key: "action", label: `Action: ${filterAction}`, onClear: () => setFilterAction(null) });
    if (filterDateRange) chips.push({
      key: "date",
      label: `${filterDateRange[0].format("MMM D")} – ${filterDateRange[1].format("MMM D")}`,
      onClear: () => setFilterDateRange(null),
    });
    if (filterCreatedBy) chips.push({
      key: "createdBy",
      label: `Created by: ${filterCreatedBy}`,
      onClear: () => setFilterCreatedBy(null),
    });
    if (searchText) chips.push({ key: "search", label: `“${searchText}”`, onClear: () => setSearchText("") });
    return chips;
  }, [filterStatus, filterPlatform, filterAction, filterDateRange, filterCreatedBy, searchText]);

  const leadsToday = useMemo(() => {
    const today = dayjs().startOf('day');
    return leads.filter(l => dayjs(l.created_at || l.posted_on).isAfter(today)).length;
  }, [leads]);

  const leadsThisWeek = useMemo(() => {
    const weekAgo = dayjs().subtract(7, 'day');
    return leads.filter(l => dayjs(l.created_at || l.posted_on).isAfter(weekAgo)).length;
  }, [leads]);

  const hotLeadsCount = useMemo(() => {
    return leads.filter(l => (l.ai_score || 0) >= 80).length;
  }, [leads]);

  const pipelineRate = useMemo(() => {
    if (!leads.length) return 0;
    const withProposal = leads.filter(l => !!l.proposal_id).length;
    return Math.round((withProposal / leads.length) * 100);
  }, [leads]);

  const totalClients = useMemo(() => {
    return new Set(leads.map(l => l.client_name)).size;
  }, [leads]);

  interface LmStatCardProps {
    label: string;
    value: React.ReactNode;
    icon: React.ComponentType<any>;
    accent: string;
    trend?: { value: number; label: string; positive?: boolean };
    subtle?: string;
    loading?: boolean;
    chart?: React.ReactNode;
  }

  const StatCard: React.FC<LmStatCardProps> = ({
    label,
    value,
    icon: Icon,
    accent,
    trend,
    subtle,
    loading,
    chart,
  }) => (
    <div className="lm-stat-card" style={{ ["--lm-accent" as any]: accent }}>
      <div className="lm-stat-head">
        <div
          className="lm-stat-icon"
          style={{
            background: `${accent}12`,
            color: accent,
            boxShadow: `inset 0 0 0 1px ${accent}26`,
          }}
        >
          <Icon size={16} color={accent} />
        </div>
        <Text className="lm-stat-label">{label}</Text>
        <div className="lm-stat-value-wrap">
          {loading ? (
            <Skeleton.Input active size="small" style={{ width: 64, height: 22 }} />
          ) : (
            <span className="lm-stat-value">{value}</span>
          )}
          {trend && (
            <span className={`lm-trend ${trend.positive ? "up" : "down"}`}>
              {trend.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span className="lm-trend-value">
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
            </span>
          )}
        </div>
      </div>
      {subtle && <Text className="lm-stat-subtle">{subtle}</Text>}
      {chart && <div className="lm-stat-chart">{chart}</div>}
      <span
        className="lm-stat-accent"
        style={{ background: `linear-gradient(90deg, ${accent} 0%, transparent 80%)` }}
      />
    </div>
  );

  interface LmMiniBarProps {
    segments: { value: number; color: string; label: string }[];
  }
  const MiniBar: React.FC<LmMiniBarProps> = ({ segments }) => {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    return (
      <div className="lm-minibar">
        <div className="lm-minibar-track">
          {segments.map((s, i) => (
            <Tooltip key={i} title={`${s.label}: ${s.value}`}>
              <span
                className="lm-minibar-seg"
                style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
              />
            </Tooltip>
          ))}
        </div>
        <div className="lm-minibar-legend">
          {segments.map((s, i) => (
            <span key={i} className="lm-minibar-legend-item">
              <span className="lm-minibar-dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="lm-page">
          <TimeTrackingHeader
            icon={<Layers size={20} color="#6366f1" />}
            title="Leads Management"
            description="Track, manage and convert your potential business opportunities."
            extra={
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Input
                  placeholder="Search leads…"
                  prefix={<Search size={15} style={{ color: "var(--text-slate-400)" }} />}
                  className="lm-search-input"
                  onChange={(e) => setSearchText(e.target.value)}
                  value={searchText}
                  allowClear
                />
                <Button icon={<Download size={15} />} className="lm-secondary-btn">
                  Export
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  className="lm-primary-btn"
                  onClick={() => {
                    setEditingKey(null);
                    form.resetFields();
                    form.setFieldsValue({ platform: 'Upwork', customPlatform: '' });
                    const defaultStatus = configStatuses.find(s => s.is_default);
                    if (defaultStatus) {
                      form.setFieldsValue({ status: defaultStatus.name });
                    }
                    setIsDrawerVisible(true);
                  }}
                >
                  New Lead
                </Button>
              </div>
            }
          />

          <div className="lm-ambient" />

          <div className="lm-body">

          {/* Saved-View Segments */}
          {/* <div className="lead-segments" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {([
              { key: "all", label: "All Leads", icon: <Layers size={13} />, count: segmentCounts.all },
              { key: "hot", label: "Hot", icon: <Flame size={13} />, count: segmentCounts.hot, accent: "#ef4444" },
              { key: "week", label: "This Week", icon: <Activity size={13} />, count: segmentCounts.week, accent: "#f59e0b" },
              { key: "won", label: "Won / Closed", icon: <CheckCircle size={13} />, count: segmentCounts.won, accent: "#10b981" },
            ] as const).map(seg => {
              const isActive = activeSegment === seg.key;
              const accent = (seg as any).accent || "#6366f1";
              return (
                <button
                  key={seg.key}
                  onClick={() => setActiveSegment(seg.key)}
                  className={`lead-segment-btn${isActive ? " is-active" : ""}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    height: 32,
                    borderRadius: 999,
                    border: `1px solid ${isActive ? accent : "#e2e8f0"}`,
                    background: isActive ? `${accent}10` : "#fff",
                    color: isActive ? accent : "#475569",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: "0.01em",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {seg.icon}
                  {seg.label}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 20,
                      height: 18,
                      padding: "0 6px",
                      borderRadius: 999,
                      background: isActive ? accent : "#f1f5f9",
                      color: isActive ? "#fff" : "#64748b",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {seg.count}
                  </span>
                </button>
              );
            })}
          </div> */}

          <div className="lm-stat-grid">
            <StatCard
              label="Total Leads"
              value={leads.length}
              icon={Layers}
              accent="#6366f1"
              subtle={leads.length > 0 ? `${leadsThisWeek} added in the last 7 days` : "No leads yet"}
              loading={leads.length === 0 && loading}
              chart={
                leads.length > 0 ? (
                  <MiniBar
                    segments={[
                      { value: hotLeadsCount, color: "#ef4444", label: `${hotLeadsCount} hot` },
                      { value: Math.max(0, leads.length - hotLeadsCount), color: "#94a3b8", label: `${Math.max(0, leads.length - hotLeadsCount)} warm` },
                    ]}
                  />
                ) : null
              }
            />
            <StatCard
              label="New Today"
              value={leadsToday}
              icon={Zap}
              accent="#f59e0b"
              subtle={leadsToday > 0 ? "Fresh activity in the last 24h" : "No new leads today"}
              loading={leads.length === 0 && loading}
              chart={
                leadsThisWeek > 0 ? (
                  <MiniBar
                    segments={[
                      { value: leadsToday, color: "#f59e0b", label: `${leadsToday} today` },
                      { value: Math.max(0, leadsThisWeek - leadsToday), color: "#94a3b8", label: `${Math.max(0, leadsThisWeek - leadsToday)} earlier this week` },
                    ]}
                  />
                ) : null
              }
            />
            <StatCard
              label="Hot Leads"
              value={hotLeadsCount}
              icon={Flame}
              accent="#ef4444"
              subtle={
                leads.length > 0
                  ? `${Math.round((hotLeadsCount / leads.length) * 100)}% of pipeline · ${totalClients} clients`
                  : "AI score ≥ 80"
              }
              loading={leads.length === 0 && loading}
              chart={
                leads.length > 0 ? (
                  <div className="lm-progress-row">
                    <div className="lm-progress-track">
                      <span
                        className="lm-progress-fill"
                        style={{
                          width: `${Math.round((hotLeadsCount / leads.length) * 100)}%`,
                          background: "linear-gradient(90deg, #ef4444, #f97316)",
                        }}
                      />
                    </div>
                    <span className="lm-progress-label">
                      {Math.round((hotLeadsCount / leads.length) * 100)}%
                    </span>
                  </div>
                ) : null
              }
            />
            <StatCard
              label="Pipeline Rate"
              value={`${pipelineRate}%`}
              icon={Target}
              accent="#10b981"
              subtle={leads.length > 0 ? "Leads with proposals out" : "Send your first proposal"}
              loading={leads.length === 0 && loading}
              chart={
                leads.length > 0 ? (
                  <div className="lm-progress-row">
                    <div className="lm-progress-track">
                      <span
                        className="lm-progress-fill"
                        style={{
                          width: `${pipelineRate}%`,
                          background: "linear-gradient(90deg, #10b981, #34d399)",
                        }}
                      />
                    </div>
                    <span className="lm-progress-label">{pipelineRate}%</span>
                  </div>
                ) : null
              }
            />
          </div>

          

          {/* Filter bar — flat, compact, with inline Table Settings */}
          <div className="lm-filter-bar">
            <span className="lm-filter-bar-label">
              <Filter size={13} />
              Filters
            </span>

            <Select
              placeholder="Status"
              className="lm-filter-select"
              style={{ width: 140 }}
              allowClear
              value={filterStatus}
              onChange={setFilterStatus}
            >
              {configStatuses.map(s => (
                <Select.Option key={s.id} value={s.name}>
                  <span
                    className="lm-filter-status-chip"
                    style={{
                      backgroundColor: `${s.color}15`,
                      color: s.color,
                      border: `1px solid ${s.color}30`,
                    }}
                  >
                    {s.name}
                  </span>
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="Platform"
              className="lm-filter-select"
              style={{ width: 130 }}
              allowClear
              value={filterPlatform}
              onChange={setFilterPlatform}
            >
              <Select.Option value="Upwork">Upwork</Select.Option>
              <Select.Option value="LinkedIn">LinkedIn</Select.Option>
              <Select.Option value="Freelancer">Freelancer</Select.Option>
              <Select.Option value="Fiverr">Fiverr</Select.Option>
            </Select>

            <Select
              placeholder="Workflow"
              className="lm-filter-select"
              style={{ width: 160 }}
              allowClear
              value={filterAction}
              onChange={setFilterAction}
            >
              {configActions.map(a => (
                <Select.Option key={a.id} value={a.name}>
                  <Space size={6}>
                    {renderActionIcon(a.icon)}
                    {a.name}
                  </Space>
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="Created by"
              className="lm-filter-select"
              style={{ width: 160 }}
              allowClear
              value={filterCreatedBy}
              onChange={setFilterCreatedBy}
              showSearch
              filterOption={(input, option) =>
                String((option as any)?.value || "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {creatorOptions.map((name) => {
                const palette = getAvatarStyle(name);
                return (
                  <Select.Option key={name} value={name}>
                    <Space size={8}>
                      <span
                        className="lm-creator-avatar"
                        style={{ background: palette.bg, width: 20, height: 20, fontSize: 9 }}
                      >
                        {getInitials(name)}
                      </span>
                      <span style={{ fontSize: 12.5 }}>{name}</span>
                    </Space>
                  </Select.Option>
                );
              })}
            </Select>

            <DatePicker.RangePicker
              className="lm-filter-date"
              style={{ width: 230 }}
              value={filterDateRange}
              onChange={(dates) => setFilterDateRange(dates as any)}
            />

            <Button
              icon={<RefreshCw size={13} />}
              className="lm-filter-clear-btn"
              onClick={() => {
                setFilterStatus(null);
                setFilterAction(null);
                setFilterPlatform(null);
                setFilterDateRange(null);
                setFilterCreatedBy(null);
                setSearchText("");
              }}
            >
              Clear
            </Button>

            <span className="lm-filter-bar-spacer" />

            <span className="lm-filter-bar-count">
              <b>{filteredLeads.length}</b> of <b>{leads.length}</b>
            </span>

            <Popover
              trigger={["click"]}
              placement="bottomRight"
              classNames={{ root: "lm-table-settings-popover" }}
              content={
                <div style={{ width: 240 }}>
                  <div className="lm-popover-section-label">
                    <Settings2 size={11} />
                    <span>Density</span>
                  </div>
                  <Segmented
                    block
                    value={tableDensity}
                    onChange={(v) => setTableDensity(v as LmDensity)}
                    options={[
                      { label: "Compact", value: "compact" },
                      { label: "Cozy", value: "comfortable" },
                      { label: "Roomy", value: "spacious" },
                    ]}
                  />
                  <div className="lm-popover-section-label" style={{ marginTop: 14 }}>
                    <Layers size={11} />
                    <span>Columns</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {TOGGLEABLE_COLUMNS.map((c) => (
                      <label key={c.key} className="lm-col-toggle-row">
                        <span>{c.label}</span>
                        <Switch
                          size="small"
                          checked={!hiddenCols[c.key]}
                          onChange={(checked) =>
                            setHiddenCols((prev) => ({ ...prev, [c.key]: !checked }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div className="lm-popover-footer">
                    <button
                      type="button"
                      className="lm-popover-reset"
                      onClick={() => {
                        setHiddenCols({});
                        setTableDensity("comfortable");
                      }}
                    >
                      Reset to defaults
                    </button>
                    <span className="lm-popover-saved">Saved automatically</span>
                  </div>
                </div>
              }
            >
              <Tooltip title="Table settings">
                <Button
                  icon={<Settings2 size={14} />}
                  className="lm-filter-settings-btn"
                  aria-label="Table settings"
                />
              </Tooltip>
            </Popover>
          </div>

          {/* Active filter chips */}
          {activeFilterChips.length > 0 && (
            <div className="lead-filter-chips" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16, alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <ListFilter size={12} /> Active
              </span>
              {activeFilterChips.map(chip => (
                <span
                  key={chip.key}
                  className="lead-filter-chip"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 6px 4px 10px",
                    borderRadius: 999,
                    background: "rgba(99, 102, 241, 0.08)",
                    color: "#4f46e5",
                    border: "1px solid rgba(99, 102, 241, 0.18)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {chip.label}
                  <button
                    onClick={chip.onClear}
                    aria-label={`Clear ${chip.key}`}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "rgba(99, 102, 241, 0.15)",
                      border: "none",
                      color: "#4f46e5",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {selectedRowKeys.length > 0 && (
            <div className="lm-bulk-bar">
              <div className="lm-bulk-bar-left">
                <span className="lm-bulk-count">
                  <span className="lm-bulk-count-dot" />
                  {selectedRowKeys.length} selected
                </span>
                <span className="lm-bulk-divider" />
                <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                  Apply a bulk action or clear the selection.
                </Text>
              </div>
              <div className="lm-bulk-bar-right">
                <Button
                  size="small"
                  className="lm-bulk-btn"
                  onClick={() => setSelectedRowKeys([])}
                >
                  Clear
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<Trash2 size={13} />}
                  className="lm-bulk-btn lm-bulk-btn-danger"
                  onClick={handleBulkDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}

          <div className="lm-table-card" data-density={tableDensity}>
            {loading && leads.length === 0 ? (
              <div className="leads-skeleton" style={{ padding: "8px 0" }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "16px 20px",
                      borderBottom: "1px solid var(--border-slate-100)",
                    }}
                  >
                    <div className="sk-shimmer" style={{ width: 18, height: 18, borderRadius: 4 }} />
                    <div className="sk-shimmer" style={{ width: 38, height: 38, borderRadius: 12 }} />
                    <div style={{ flex: 1 }}>
                      <div className="sk-shimmer" style={{ width: "55%", height: 12, borderRadius: 6, marginBottom: 8 }} />
                      <div className="sk-shimmer" style={{ width: "35%", height: 10, borderRadius: 6 }} />
                    </div>
                    <div className="sk-shimmer" style={{ width: 80, height: 22, borderRadius: 999 }} />
                    <div className="sk-shimmer" style={{ width: 90, height: 22, borderRadius: 999 }} />
                    <div className="sk-shimmer" style={{ width: 60, height: 22, borderRadius: 999 }} />
                  </div>
                ))}
              </div>
            ) : (
              <Table
                columns={columns.filter((c: any) => !hiddenCols[c.key as string])}
                dataSource={filteredLeads}
                rowKey="id"
                size="middle"
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys),
                  columnWidth: 48,
                }}
                pagination={{
                  pageSize: 10,
                  position: ["bottomRight"],
                  showSizeChanger: false,
                  className: "premium-pagination"
                }}
                className="lm-table premium-table"
                rowClassName={() => "lm-row"}
                onRow={(record) => ({
                  onClick: () => handleView(record),
                  style: { cursor: 'pointer' }
                })}
                locale={{
                  emptyText: (
                    <div style={{ padding: "60px 24px", textAlign: "center" }}>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          margin: "0 auto 16px",
                          borderRadius: 18,
                          background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6366f1",
                        }}
                      >
                        <Layers size={28} />
                      </div>
                      <Title level={5} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>
                        {leads.length === 0 ? "No leads yet" : "No matching leads"}
                      </Title>
                      <Text style={{ color: "#94a3b8", fontSize: 13, display: "block", marginTop: 4, marginBottom: 16 }}>
                        {leads.length === 0
                          ? "Add your first opportunity to start tracking your pipeline."
                          : "Try clearing filters or switching to a different view."}
                      </Text>
                      {leads.length === 0 ? (
                        <Button
                          type="primary"
                          icon={<Plus size={14} />}
                          onClick={() => {
                            setEditingKey(null);
                            form.resetFields();
                            form.setFieldsValue({ platform: 'Upwork', customPlatform: '' });
                            const defaultStatus = configStatuses.find(s => s.is_default);
                            if (defaultStatus) form.setFieldsValue({ status: defaultStatus.name });
                            setIsDrawerVisible(true);
                          }}
                          style={{
                            borderRadius: 8,
                            height: 36,
                            fontWeight: 700,
                            background: "#6366f1",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                          }}
                        >
                          Add First Lead
                        </Button>
                      ) : (
                        <Button
                          icon={<RefreshCw size={14} />}
                          onClick={() => {
                            setFilterStatus(null);
                            setFilterAction(null);
                            setFilterPlatform(null);
                            setFilterDateRange(null);
                            setSearchText("");
                            setActiveSegment("all");
                          }}
                          style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  ),
                }}
              />
            )}
          </div>
          </div>
        </div>

        {/* BidIq Preview Modal */}
        <Modal
          open={!!bidiqPreviewLead}
          onCancel={closeBidiqPreview}
          footer={null}
          width={680}
          centered
          closable={false}
          className="lm-bidiq-modal"
        >
          {bidiqPreviewLead && (
            <div className="lm-bidiq-content">
              {/* Header */}
              <div className="lm-bidiq-head">
                <div className="lm-bidiq-icon">
                  <Zap size={20} />
                </div>
                <div className="lm-bidiq-head-text">
                  <div className="lm-bidiq-eyebrow">
                    <Sparkles size={11} /> AI Win-Rate Engine
                  </div>
                  <h2 className="lm-bidiq-title">BidIq · Pre-flight check</h2>
                  <p className="lm-bidiq-sub">
                    Before you spend time crafting a proposal, BidIq runs a smart
                    analysis on this lead and shows you whether it's worth the bid.
                  </p>
                </div>
                <button
                  type="button"
                  className="lm-bidiq-close"
                  onClick={closeBidiqPreview}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Lead snapshot */}
              <div className="lm-bidiq-snapshot">
                <div className="lm-bidiq-snapshot-head">
                  <Layers size={11} /> Lead snapshot
                </div>
                <div className="lm-bidiq-snapshot-title" title={bidiqPreviewLead.title}>
                  {bidiqPreviewLead.title}
                </div>
                <div className="lm-bidiq-snapshot-grid">
                  <div className="lm-bidiq-snapshot-item">
                    <span className="lm-bidiq-snapshot-label">
                      <DollarSign size={10} /> Budget
                    </span>
                    <span className="lm-bidiq-snapshot-value">
                      {bidiqPreviewLead.budget ||
                        (bidiqPreviewLead.hour_based_amount
                          ? `$${bidiqPreviewLead.hour_based_amount}/hr`
                          : "—")}
                    </span>
                  </div>
                  <div className="lm-bidiq-snapshot-item">
                    <span className="lm-bidiq-snapshot-label">
                      <Clock size={10} /> Duration
                    </span>
                    <span className="lm-bidiq-snapshot-value">
                      {bidiqPreviewLead.duration || "Flexible"}
                    </span>
                  </div>
                  <div className="lm-bidiq-snapshot-item">
                    <span className="lm-bidiq-snapshot-label">
                      <Layers size={10} /> Platform
                    </span>
                    <span className="lm-bidiq-snapshot-value">
                      {bidiqPreviewLead.platform || "—"}
                    </span>
                  </div>
                  <div className="lm-bidiq-snapshot-item">
                    <span className="lm-bidiq-snapshot-label">
                      <ShieldCheck size={10} /> Experience
                    </span>
                    <span className="lm-bidiq-snapshot-value">
                      {bidiqPreviewLead.experience_level || "Any"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div className="lm-bidiq-caps">
                <div className="lm-bidiq-caps-head">What BidIq will do for you</div>
                <div className="lm-bidiq-caps-grid">
                  <div className="lm-bidiq-cap" style={{ ["--cap-accent" as any]: "#6366f1" }}>
                    <div className="lm-bidiq-cap-icon">
                      <Target size={14} />
                    </div>
                    <div className="lm-bidiq-cap-body">
                      <span className="lm-bidiq-cap-title">Win-probability score</span>
                      <span className="lm-bidiq-cap-text">
                        Predicts your chance of winning based on fit, history, and lead signals.
                      </span>
                    </div>
                  </div>
                  <div className="lm-bidiq-cap" style={{ ["--cap-accent" as any]: "#10b981" }}>
                    <div className="lm-bidiq-cap-icon">
                      <DollarSign size={14} />
                    </div>
                    <div className="lm-bidiq-cap-body">
                      <span className="lm-bidiq-cap-title">Smart pricing &amp; effort</span>
                      <span className="lm-bidiq-cap-text">
                        Recommended quote and estimated hours, anchored to the brief and budget.
                      </span>
                    </div>
                  </div>
                  <div className="lm-bidiq-cap" style={{ ["--cap-accent" as any]: "#ef4444" }}>
                    <div className="lm-bidiq-cap-icon">
                      <AlertCircle size={14} />
                    </div>
                    <div className="lm-bidiq-cap-body">
                      <span className="lm-bidiq-cap-title">Risk &amp; red-flag detection</span>
                      <span className="lm-bidiq-cap-text">
                        Aggressive timelines, scope creep, low-trust clients — all surfaced.
                      </span>
                    </div>
                  </div>
                  <div className="lm-bidiq-cap" style={{ ["--cap-accent" as any]: "#8b5cf6" }}>
                    <div className="lm-bidiq-cap-icon">
                      <Brain size={14} />
                    </div>
                    <div className="lm-bidiq-cap-body">
                      <span className="lm-bidiq-cap-title">Proposal-ready draft</span>
                      <span className="lm-bidiq-cap-text">
                        Tailored proposal with deliverables, milestones, and a tight scope.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="lm-bidiq-footer">
                <span className="lm-bidiq-footnote">
                  <ShieldCheck size={12} /> No data leaves your workspace.
                </span>
                <div className="lm-bidiq-footer-actions">
                  <Button onClick={closeBidiqPreview} className="lm-bidiq-cancel">
                    Maybe later
                  </Button>
                  <Button
                    type="primary"
                    onClick={launchBidiq}
                    className="lm-bidiq-launch"
                    icon={<Zap size={14} />}
                  >
                    Launch BidIq
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Lead Form Drawer */}
        <Drawer
          title={
            <div className="lead-drawer-header" style={{ position: "relative", overflow: "hidden", margin: "-16px -24px", padding: "20px 24px" }}>
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(120% 80% at 100% 0%, rgba(139,92,246,0.10) 0%, transparent 55%), radial-gradient(80% 60% at 0% 100%, rgba(99,102,241,0.08) 0%, transparent 60%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 20px -6px rgba(99, 102, 241, 0.5)",
                    flexShrink: 0,
                  }}
                >
                  {editingKey ? <Edit2 size={20} /> : <Sparkles size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <div className="premium-title" style={{ fontSize: 18, fontWeight: 800, color: "var(--text-slate-900)", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                      {editingKey ? "Edit Opportunity" : "New Lead Entry"}
                    </div>
                    <span
                      className="lead-drawer-badge"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(99, 102, 241, 0.1)",
                        color: "#6366f1",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                      }}
                    >
                      <Sparkles size={10} /> AI-ready
                    </span>
                  </div>
                  <div className="premium-text-sec" style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                    {editingKey
                      ? "Refine details and re-sync this opportunity to your pipeline"
                      : "4 quick sections — client, job, platform & docs. Takes under a minute."}
                  </div>
                </div>
              </div>
            </div>
          }
          width={680}
          open={isDrawerVisible}
          onClose={() => setIsDrawerVisible(false)}
          className="premium-drawer lead-drawer"
          headerStyle={{ borderBottom: '1px solid var(--border-slate-100)', padding: '16px 24px', background: 'var(--bg-pure-white)' }}
          bodyStyle={{ padding: '24px', background: 'var(--bg-pure-white)' }}
          footerStyle={{ borderTop: '1px solid var(--border-slate-100)', padding: '14px 24px', background: 'var(--bg-pure-white)' }}
          footer={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                <ShieldCheck size={13} style={{ color: "#10b981" }} />
                Auto-saved to your secure workspace
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={() => setIsDrawerVisible(false)} style={{ borderRadius: 10, height: 40, fontWeight: 600, padding: "0 18px" }} className="premium-btn-cancel">Cancel</Button>
                <Button
                  type="primary"
                  loading={loading}
                  onClick={() => form.submit()}
                  className="lead-drawer-submit"
                  style={{
                    borderRadius: 10,
                    height: 40,
                    padding: "0 22px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    border: "none",
                    fontWeight: 700,
                    boxShadow: "0 6px 16px -4px rgba(99, 102, 241, 0.45)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {editingKey ? "Update Lead" : "Create Lead"}
                  <ArrowUpRight size={15} />
                </Button>
              </div>
            </div>
          }
        >
          <Form form={form} layout="vertical" onFinish={handleSaveLead} requiredMark={false} className="lead-drawer-form">
            {/* Client Details Section */}
            <div className="premium-drawer-section lead-section-card" style={{
              marginBottom: 20,
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-slate-100)'
            }}>
              <div className="lead-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <span className="lead-section-step" style={{
                  width: 30, height: 30, borderRadius: 9, fontWeight: 800, fontSize: 12,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(99, 102, 241, 0.08)", color: "#6366f1",
                  border: "1px solid rgba(99, 102, 241, 0.18)",
                }}>01</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <User size={15} color="#6366f1" />
                    <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Client Information</span>
                  </div>
                  <Text className="premium-text-sec" style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Who you're pitching — contact, location, and trust signals</Text>
                </div>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientName" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Client Name</Text>} rules={[{ required: true }]}>
                    <Input placeholder="e.g. John Doe" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientMail" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Email Address</Text>} rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="john@example.com" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientPhone" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Phone Number</Text>}>
                    <Input placeholder="+1 234..." style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientLocation" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Location</Text>}>
                    <Input placeholder="City, Country" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientRating" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Client Rating</Text>}>
                    <Input placeholder="e.g. 4.9/5" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientSpend" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Total Spend</Text>}>
                    <Input placeholder="e.g. $10k+" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientPaymentVerified" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Payment Verified</Text>}>
                    <Select className="lead-verified-select" style={{ borderRadius: 8 }} suffixIcon={<ChevronRight size={13} color="#94a3b8" />}>
                      <Select.Option value={true}>
                        <Space size={6}><CheckCircle size={13} style={{ color: "#10b981" }} /> <span style={{ fontWeight: 600 }}>Verified</span></Space>
                      </Select.Option>
                      <Select.Option value={false}>
                        <Space size={6}><AlertCircle size={13} style={{ color: "#94a3b8" }} /> <span style={{ fontWeight: 600 }}>Not Verified</span></Space>
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientPhoneVerified" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Phone Verified</Text>}>
                    <Select className="lead-verified-select" style={{ borderRadius: 8 }} suffixIcon={<ChevronRight size={13} color="#94a3b8" />}>
                      <Select.Option value={true}>
                        <Space size={6}><CheckCircle size={13} style={{ color: "#10b981" }} /> <span style={{ fontWeight: 600 }}>Verified</span></Space>
                      </Select.Option>
                      <Select.Option value={false}>
                        <Space size={6}><AlertCircle size={13} style={{ color: "#94a3b8" }} /> <span style={{ fontWeight: 600 }}>Not Verified</span></Space>
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Job Details Section */}
            <div className="premium-drawer-section-alt lead-section-card" style={{
              marginBottom: 20,
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-slate-100)'
            }}>
              <div className="lead-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <span className="lead-section-step" style={{
                  width: 30, height: 30, borderRadius: 9, fontWeight: 800, fontSize: 12,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(245, 158, 11, 0.08)", color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                }}>02</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Briefcase size={15} color="#f59e0b" />
                    <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Job Specification</span>
                  </div>
                  <Text className="premium-text-sec" style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Scope, skills, and budget — what success looks like</Text>
                </div>
              </div>
              <Form.Item name="title" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Job Title</Text>} rules={[{ required: true }]}>
                <Input placeholder="e.g. Senior Frontend Engineer" style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item
                name="ai_summary"
                label={
                  <Space size={6}>
                    <span className="lead-ai-chip" style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", borderRadius: 999,
                      background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))",
                      color: "#6366f1", fontSize: 10, fontWeight: 800, letterSpacing: "0.04em",
                      textTransform: "uppercase", border: "1px solid rgba(99,102,241,0.25)",
                    }}>
                      <Sparkles size={10} /> AI
                    </span>
                    <Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Intelligence Summary</Text>
                  </Space>
                }
              >
                <TextArea
                  rows={4}
                  placeholder="Paste the job description or key notes — AI will distill this into actionable insights..."
                  className="lead-ai-textarea"
                  style={{
                    borderRadius: 12,
                    background: "linear-gradient(135deg, rgba(99,102,241,0.03) 0%, rgba(139,92,246,0.03) 100%)",
                    border: "1px solid rgba(99, 102, 241, 0.18)",
                  }}
                />
              </Form.Item>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="skills" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Required Skills</Text>}>
                    <Select mode="tags" style={{ width: '100%' }} placeholder="Add skills..." tokenSeparators={[',']} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="duration" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Duration</Text>}>
                    <Input placeholder="e.g. 3 Months" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="hourBasedAmount" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Hourly ($)</Text>}>
                    <InputNumber style={{ width: '100%', borderRadius: 8 }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="budget" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Budget ($)</Text>}>
                    <Input placeholder="e.g. 5000" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="estOrProjectDuration" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Type</Text>}>
                    <Input placeholder="Fixed/Hourly" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Timeline & Meta Section */}
            <div className="premium-drawer-section lead-section-card" style={{
              marginBottom: 20,
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-slate-100)'
            }}>
              <div className="lead-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <span className="lead-section-step" style={{
                  width: 30, height: 30, borderRadius: 9, fontWeight: 800, fontSize: 12,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(16, 185, 129, 0.08)", color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}>03</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LinkIcon size={15} color="#10b981" />
                    <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Platform & Status</span>
                  </div>
                  <Text className="premium-text-sec" style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Where this came from and where it sits in your pipeline</Text>
                </div>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="platform" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Platform</Text>} initialValue="Upwork">
                    <Select placeholder="Select Platform" style={{ borderRadius: 8 }}>
                      <Select.Option value="Upwork">Upwork</Select.Option>
                      <Select.Option value="LinkedIn">LinkedIn</Select.Option>
                      <Select.Option value="Freelancer">Freelancer</Select.Option>
                      <Select.Option value="Fiverr">Fiverr</Select.Option>
                      <Select.Option value="Other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Current Status</Text>}>
                    <Select placeholder="Select Status" style={{ borderRadius: 8 }}>
                      {configStatuses.map(s => (
                        <Select.Option key={s.id} value={s.name}>
                          <Space>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
                            {s.name}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="jobLink" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Job Link</Text>}>
                <Input placeholder="https://..." style={{ borderRadius: 8 }} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="postedOn" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Posted On</Text>} initialValue={dayjs()}>
                    <DatePicker style={{ width: '100%', borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="actions" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Next Action Items</Text>}>
                    <Select placeholder="Select Action" allowClear style={{ borderRadius: 8 }}>
                      {configActions.map(a => (
                        <Select.Option key={a.id} value={a.name}>
                          <Space>
                            {renderActionIcon(a.icon)}
                            <span style={{ color: a.color }}>{a.name}</span>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Documents Section */}
            <div className="premium-drawer-section-alt lead-section-card" style={{
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-slate-100)'
            }}>
              <div className="lead-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <span className="lead-section-step" style={{
                  width: 30, height: 30, borderRadius: 9, fontWeight: 800, fontSize: 12,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(236, 72, 153, 0.08)", color: "#ec4899",
                  border: "1px solid rgba(236, 72, 153, 0.2)",
                }}>04</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={15} color="#ec4899" />
                    <span className="premium-section-title" style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Supporting Documents</span>
                    <span style={{
                      padding: "1px 7px", borderRadius: 999, background: "#f1f5f9",
                      color: "#64748b", fontSize: 9, fontWeight: 800, letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}>Optional</span>
                  </div>
                  <Text className="premium-text-sec" style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Briefs, mockups, or contract drafts shared by the client</Text>
                </div>
              </div>
              <Form.List name="documents">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row key={key} gutter={12} align="middle" style={{ marginBottom: 12 }}>
                        <Col span={10}>
                          <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: 'Missing name' }]} noStyle>
                            <Input placeholder="Document Name" style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col span={10}>
                          <Form.Item {...restField} name={[name, 'url']} rules={[{ required: true, message: 'Missing URL' }]} noStyle>
                            <Input placeholder="URL" style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col span={4} style={{ textAlign: 'right' }}>
                          <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => remove(name)} style={{ borderRadius: 6 }} />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusCircle size={16} />} style={{ marginTop: 8, borderRadius: 10, height: 40, color: '#6366f1', borderColor: '#e0e7ff', background: '#f5f7ff' }}>
                      Add Supporting Document
                    </Button>
                  </>
                )}
              </Form.List>
            </div>
          </Form>
        </Drawer>

        <style dangerouslySetInnerHTML={{
          __html: `
            /* ====================================================== */
            /*                Leads Management — Premium               */
            /* ====================================================== */
            .lm-page {
              position: relative;
              margin: 0 -24px;
              background: var(--bg-primary);
              min-height: calc(100vh - 64px);
            }
            .lm-ambient {
              position: absolute;
              top: 0; left: 0; right: 0;
              height: 320px;
              pointer-events: none;
              background:
                radial-gradient(900px 240px at 12% 0%, rgba(99, 102, 241, 0.07), transparent 60%),
                radial-gradient(700px 220px at 90% 0%, rgba(239, 68, 68, 0.05), transparent 60%);
              z-index: 0;
            }
            [data-theme='dark'] .lm-ambient {
              background:
                radial-gradient(900px 240px at 12% 0%, rgba(99, 102, 241, 0.12), transparent 60%),
                radial-gradient(700px 220px at 90% 0%, rgba(239, 68, 68, 0.08), transparent 60%);
            }
            .lm-body {
              position: relative;
              z-index: 1;
              padding: 8px 32px 40px 32px;
            }

            /* ---------- Header buttons / search ---------- */
            .lm-search-input.ant-input-affix-wrapper {
              width: 280px !important;
              height: 38px !important;
              border-radius: 10px !important;
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-100) !important;
              transition: all .2s ease;
            }
            .lm-search-input.ant-input-affix-wrapper:focus-within {
              border-color: #6366f1 !important;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
              background: var(--bg-pure-white) !important;
            }
            .lm-search-input .ant-input {
              background: transparent !important;
              font-size: 13px;
              font-weight: 500;
            }
            .lm-secondary-btn {
              height: 38px !important;
              border-radius: 10px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
              font-weight: 600 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
            }
            .lm-secondary-btn:hover {
              border-color: var(--border-slate-200) !important;
              color: var(--text-slate-900) !important;
            }
            .lm-primary-btn {
              height: 38px !important;
              border-radius: 10px !important;
              padding: 0 18px !important;
              font-weight: 700 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
              border: 0 !important;
              box-shadow: 0 6px 16px -8px rgba(99, 102, 241, 0.6) !important;
            }
            .lm-primary-btn:hover {
              filter: brightness(1.05);
              transform: translateY(-1px);
              transition: all .2s ease;
            }

            /* ---------- Stat grid ---------- */
            .lm-stat-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 16px;
              margin-bottom: 22px;
            }
            @media (max-width: 1100px) {
              .lm-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 600px) {
              .lm-stat-grid { grid-template-columns: 1fr; }
            }
            .lm-stat-card {
              position: relative;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 14px;
              padding: 14px 16px 14px;
              overflow: hidden;
              transition: transform .25s cubic-bezier(.2,.8,.2,1),
                          box-shadow .25s cubic-bezier(.2,.8,.2,1),
                          border-color .25s ease;
              box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
            }
            .lm-stat-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 18px 36px -22px rgba(15,23,42,0.22);
              border-color: var(--border-slate-200);
            }
            .lm-stat-card:hover .lm-stat-accent { opacity: 1; }
            .lm-stat-accent {
              position: absolute;
              left: 0; right: 0; bottom: 0;
              height: 2px;
              opacity: 0.55;
              transition: opacity .25s ease;
              pointer-events: none;
            }
            .lm-stat-head {
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 0;
            }
            .lm-stat-icon {
              width: 32px; height: 32px;
              border-radius: 9px;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .lm-stat-label {
              flex: 1;
              min-width: 0;
              font-size: 13px;
              font-weight: 600;
              color: var(--text-slate-700);
              letter-spacing: -0.005em;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .lm-stat-value-wrap {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-shrink: 0;
            }
            .lm-stat-value {
              font-size: 22px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.025em;
              line-height: 1;
              font-variant-numeric: tabular-nums;
            }
            .lm-trend {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 3px 7px;
              border-radius: 999px;
              font-size: 10.5px;
              font-weight: 700;
              line-height: 1;
              white-space: nowrap;
            }
            .lm-trend.up { background: rgba(16,185,129,0.1); color: #047857; }
            .lm-trend.down { background: rgba(239,68,68,0.1); color: #b91c1c; }
            .lm-trend-value { letter-spacing: 0.01em; }
            .lm-stat-subtle {
              display: block;
              font-size: 11.5px;
              color: var(--text-slate-500);
              margin-top: 8px;
              padding-left: 42px;
              font-weight: 500;
              line-height: 1.4;
            }
            .lm-stat-chart {
              margin-top: 10px;
              padding-top: 10px;
              padding-left: 42px;
              border-top: 1px dashed var(--border-slate-100);
            }

            /* MiniBar */
            .lm-minibar { display: flex; flex-direction: column; gap: 7px; }
            .lm-minibar-track {
              height: 6px;
              background: var(--bg-slate-50);
              border-radius: 999px;
              display: flex;
              overflow: hidden;
              border: 1px solid var(--border-slate-100);
            }
            .lm-minibar-seg {
              display: block;
              height: 100%;
              transition: width .4s ease;
            }
            .lm-minibar-seg + .lm-minibar-seg {
              border-left: 1px solid var(--bg-pure-white);
            }
            .lm-minibar-legend {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
            }
            .lm-minibar-legend-item {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              font-size: 11px;
              color: var(--text-slate-600);
              font-weight: 500;
            }
            .lm-minibar-dot {
              width: 7px; height: 7px;
              border-radius: 2px;
              display: inline-block;
            }

            /* Inline progress (hot / pipeline) */
            .lm-progress-row {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .lm-progress-track {
              flex: 1;
              height: 6px;
              background: var(--bg-slate-50);
              border-radius: 999px;
              overflow: hidden;
              border: 1px solid var(--border-slate-100);
            }
            .lm-progress-fill {
              display: block;
              height: 100%;
              border-radius: 999px;
              transition: width .4s ease;
            }
            .lm-progress-label {
              font-size: 11px;
              font-weight: 700;
              color: var(--text-slate-700);
              font-variant-numeric: tabular-nums;
              white-space: nowrap;
            }

            /* ---------- Section divider ---------- */
            .lm-section-divider {
              position: relative;
              margin: 4px 0 16px;
              height: 18px;
              display: flex;
              align-items: center;
            }
            .lm-section-divider::before {
              content: "";
              position: absolute;
              left: 0; right: 0;
              top: 50%;
              height: 1px;
              background: linear-gradient(
                90deg,
                transparent 0%,
                var(--border-slate-100) 18%,
                var(--border-slate-100) 82%,
                transparent 100%
              );
              transform: translateY(-0.5px);
              pointer-events: none;
            }
            .lm-section-divider-label {
              position: relative;
              z-index: 1;
              background: var(--bg-primary);
              padding: 0 12px;
              margin-left: 4px;
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: var(--text-slate-500);
            }

            /* ---------- Inline-edit status pill ---------- */
            .lm-status-pill {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px 4px 12px;
              border-radius: 999px;
              font-size: 10.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              cursor: pointer;
              transition: filter 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
              font-family: inherit;
              outline: none;
              max-width: 100%;
            }
            .lm-status-pill:hover {
              filter: brightness(0.97);
              transform: translateY(-0.5px);
              box-shadow: 0 4px 10px -4px rgba(15, 23, 42, 0.12);
            }
            .lm-status-pill:focus-visible {
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
            }
            .lm-status-pill-text {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1;
            }
            .lm-status-pill-edit {
              opacity: 0;
              transform: translateX(-3px);
              transition: opacity 0.15s ease, transform 0.15s ease;
              flex-shrink: 0;
            }
            .lm-status-pill:hover .lm-status-pill-edit {
              opacity: 0.75;
              transform: translateX(0);
            }
            .lm-status-select.ant-select .ant-select-selector {
              padding: 0 !important;
              height: auto !important;
              background: transparent !important;
            }

            /* ---------- Bulk action bar ---------- */
            .lm-bulk-bar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 10px 14px;
              margin-bottom: 12px;
              background: linear-gradient(
                90deg,
                rgba(99, 102, 241, 0.08) 0%,
                rgba(139, 92, 246, 0.05) 100%
              );
              border: 1px solid rgba(99, 102, 241, 0.2);
              border-radius: 12px;
              animation: lmBulkSlide 0.2s ease-out;
            }
            @keyframes lmBulkSlide {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .lm-bulk-bar-left,
            .lm-bulk-bar-right {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .lm-bulk-count {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              border-radius: 999px;
              background: #fff;
              border: 1px solid rgba(99, 102, 241, 0.3);
              color: #4f46e5;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.01em;
            }
            .lm-bulk-count-dot {
              width: 6px; height: 6px;
              border-radius: 50%;
              background: #6366f1;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
            }
            .lm-bulk-divider {
              width: 1px; height: 16px;
              background: rgba(99, 102, 241, 0.2);
            }
            .lm-bulk-btn {
              height: 30px !important;
              border-radius: 8px !important;
              font-weight: 600 !important;
              font-size: 12px !important;
              padding: 0 12px !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 5px !important;
            }
            .lm-bulk-btn-danger {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
              border: 0 !important;
              color: #fff !important;
              box-shadow: 0 4px 12px -4px rgba(239, 68, 68, 0.5) !important;
            }
            .lm-bulk-btn-danger:hover {
              filter: brightness(1.05);
              transform: translateY(-1px);
              transition: all .15s ease;
            }
            [data-theme='dark'] .lm-bulk-bar {
              background: linear-gradient(
                90deg,
                rgba(99, 102, 241, 0.12) 0%,
                rgba(139, 92, 246, 0.08) 100%
              );
              border-color: rgba(99, 102, 241, 0.3);
            }
            [data-theme='dark'] .lm-bulk-count {
              background: #161b22;
              color: #a5b4fc;
              border-color: rgba(99, 102, 241, 0.4);
            }

            /* ---------- Premium table card ---------- */
            .lm-table-card {
              position: relative;
              background: var(--bg-pure-white);
              border-radius: 16px;
              border: 1px solid var(--border-slate-100);
              overflow: hidden;
              box-shadow: 0 4px 16px -8px rgba(15, 23, 42, 0.06);
            }
            .lm-table.ant-table-wrapper .ant-table {
              background: transparent !important;
            }
            .lm-table.ant-table-wrapper .ant-table-thead > tr > th {
              background: var(--bg-slate-50) !important;
              color: var(--text-slate-500) !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              font-size: 10.5px !important;
              letter-spacing: 0.08em !important;
              padding: 14px 16px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
            }
            .lm-table.ant-table-wrapper .ant-table-thead > tr > th::before { display: none !important; }
            .lm-table.ant-table-wrapper .ant-table-tbody > tr > td {
              padding: 16px 16px !important;
              border-bottom: 1px solid var(--border-slate-100) !important;
              transition: background .15s ease;
              position: relative;
            }
            .lm-table.ant-table-wrapper .lm-row > td:nth-child(2)::before {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 3px;
              background: linear-gradient(180deg, #6366f1, #8b5cf6);
              opacity: 0;
              transition: opacity .2s ease;
              pointer-events: none;
            }
            .lm-table.ant-table-wrapper .lm-row:hover > td {
              background: var(--bg-slate-50) !important;
            }
            .lm-table.ant-table-wrapper .lm-row:hover > td:nth-child(2)::before {
              opacity: 1;
            }
            .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td {
              background: rgba(99, 102, 241, 0.06) !important;
            }
            .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected:hover > td {
              background: rgba(99, 102, 241, 0.1) !important;
            }
            .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td:nth-child(2)::before {
              opacity: 1;
            }

            /* Selection checkbox column */
            .lm-table.ant-table-wrapper .ant-table-selection-column {
              padding-left: 16px !important;
              padding-right: 8px !important;
            }
            .lm-table.ant-table-wrapper .ant-checkbox-wrapper .ant-checkbox-inner {
              border-radius: 5px !important;
              border-color: #cbd5e1 !important;
              transition: all 0.15s ease;
              width: 17px;
              height: 17px;
            }
            .lm-table.ant-table-wrapper .ant-checkbox-wrapper:hover .ant-checkbox-inner {
              border-color: #8b5cf6 !important;
            }
            .lm-table.ant-table-wrapper .ant-checkbox-checked .ant-checkbox-inner {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
              border-color: #6366f1 !important;
              box-shadow: 0 2px 6px -2px rgba(99, 102, 241, 0.45);
            }
            .lm-table.ant-table-wrapper .ant-checkbox-indeterminate .ant-checkbox-inner::after {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
            }
            .lm-table.ant-table-wrapper .ant-checkbox-checked::after {
              border-color: #8b5cf6 !important;
            }

            /* Pagination polish */
            .lm-table.ant-table-wrapper .ant-pagination {
              padding: 12px 16px;
              margin: 0 !important;
            }

            /* Dark theme — table */
            [data-theme='dark'] .lm-table-card {
              background: var(--bg-secondary);
              border-color: var(--border-slate-100);
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-table-thead > tr > th {
              background: var(--bg-primary) !important;
              color: var(--text-slate-400) !important;
              border-bottom-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-table-tbody > tr > td {
              border-bottom-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .lm-row:hover > td {
              background: var(--bg-primary) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td {
              background: rgba(99, 102, 241, 0.12) !important;
            }
            [data-theme='dark'] .lm-table.ant-table-wrapper .ant-checkbox-wrapper .ant-checkbox-inner {
              background: var(--bg-primary) !important;
              border-color: #30363d !important;
            }

            /* ---------- Flat filter bar (replaces the boxy filter card) ---------- */
            .lm-filter-bar {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 14px;
              margin-bottom: 16px;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 12px;
              flex-wrap: wrap;
            }
            .lm-filter-bar-label {
              display: inline-flex; align-items: center; gap: 5px;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: var(--text-slate-500);
              padding-right: 4px;
            }
            .lm-filter-bar-label svg { color: var(--text-slate-400); }
            .lm-filter-bar-spacer { flex: 1 1 auto; }
            .lm-filter-bar-count {
              font-size: 12px;
              color: var(--text-slate-500);
              font-weight: 500;
              padding: 0 4px;
            }
            .lm-filter-bar-count b {
              color: var(--text-slate-900);
              font-weight: 700;
              font-variant-numeric: tabular-nums;
            }

            /* Filter selects */
            .lm-filter-select.ant-select .ant-select-selector {
              height: 32px !important;
              border-radius: 8px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-slate-50) !important;
              padding: 0 10px !important;
              display: flex; align-items: center;
              font-size: 12.5px;
            }
            .lm-filter-select.ant-select:hover .ant-select-selector {
              border-color: rgba(99, 102, 241, 0.35) !important;
            }
            .lm-filter-select.ant-select-focused .ant-select-selector {
              border-color: #6366f1 !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
            }
            .lm-filter-select .ant-select-selection-placeholder,
            .lm-filter-select .ant-select-selection-item {
              line-height: 30px !important;
              font-size: 12.5px;
              font-weight: 500;
            }
            .lm-filter-status-chip {
              display: inline-block;
              padding: 2px 9px;
              border-radius: 999px;
              font-weight: 700;
              font-size: 10px;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }

            /* Date range picker */
            .lm-filter-date.ant-picker {
              height: 32px !important;
              border-radius: 8px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-slate-50) !important;
            }
            .lm-filter-date.ant-picker:hover {
              border-color: rgba(99, 102, 241, 0.35) !important;
            }
            .lm-filter-date.ant-picker-focused {
              border-color: #6366f1 !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
            }
            .lm-filter-date.ant-picker input { font-size: 12.5px !important; }

            /* Clear button */
            .lm-filter-clear-btn.ant-btn {
              height: 32px !important;
              border-radius: 8px !important;
              padding: 0 12px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-600) !important;
              font-weight: 600 !important;
              font-size: 12.5px !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 5px !important;
            }
            .lm-filter-clear-btn.ant-btn:hover {
              border-color: var(--border-slate-200) !important;
              color: var(--text-slate-900) !important;
            }

            /* Settings button inside the filter bar */
            .lm-filter-settings-btn.ant-btn {
              height: 32px !important;
              width: 32px !important;
              padding: 0 !important;
              border-radius: 8px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-500) !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              transition: color .15s ease, border-color .15s ease;
            }
            .lm-filter-settings-btn.ant-btn:hover {
              color: #4f46e5 !important;
              border-color: rgba(99, 102, 241, 0.35) !important;
            }

            /* ---------- Enhanced inline-edit dropdowns (Status / Workflow) ---------- */
            .lm-status-dropdown.ant-select-dropdown {
              padding: 6px !important;
              border-radius: 12px !important;
              border: 1px solid var(--border-slate-100);
              background: var(--bg-pure-white);
              box-shadow: 0 16px 36px -16px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.05) !important;
              min-width: 220px;
            }
            .lm-status-dropdown .ant-select-item {
              padding: 0 !important;
              border-radius: 8px !important;
              margin-bottom: 2px !important;
              background: transparent !important;
            }
            .lm-status-dropdown .ant-select-item:last-child { margin-bottom: 0 !important; }
            .lm-status-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
              background: var(--bg-slate-50) !important;
            }
            .lm-status-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
              background: rgba(99, 102, 241, 0.06) !important;
            }
            .lm-status-dropdown .ant-select-item-option-content {
              padding: 0 !important;
            }

            .lm-dd-row {
              display: flex;
              align-items: center;
              gap: 9px;
              padding: 8px 10px;
              border-radius: 8px;
              min-height: 34px;
              cursor: pointer;
            }
            .lm-dd-dot {
              width: 8px; height: 8px;
              border-radius: 50%;
              flex-shrink: 0;
            }
            .lm-dd-icon {
              width: 22px; height: 22px;
              border-radius: 6px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .lm-dd-text {
              flex: 1;
              min-width: 0;
              font-size: 12.5px;
              font-weight: 600;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .lm-dd-row.is-selected .lm-dd-text { font-weight: 700; }
            .lm-dd-check { flex-shrink: 0; }

            [data-theme='dark'] .lm-status-dropdown.ant-select-dropdown {
              background: var(--bg-secondary);
              border-color: var(--border-slate-100);
            }
            [data-theme='dark'] .lm-status-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
              background: var(--bg-primary) !important;
            }

            /* Created by + Created cells */
            .lm-creator-cell {
              display: flex;
              align-items: center;
              gap: 8px;
              min-width: 0;
            }
            .lm-creator-avatar {
              width: 26px; height: 26px;
              border-radius: 8px;
              color: #fff;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 10.5px;
              font-weight: 800;
              letter-spacing: 0.02em;
              flex-shrink: 0;
            }
            .lm-creator-text {
              display: flex; flex-direction: column;
              min-width: 0;
            }
            .lm-creator-name {
              font-size: 12.5px;
              font-weight: 600;
              color: var(--text-slate-900);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 130px;
            }
            .lm-creator-you {
              font-size: 10px;
              color: var(--text-slate-500);
              font-weight: 600;
              letter-spacing: 0.02em;
              text-transform: uppercase;
            }
            .lm-creator-email {
              font-size: 10.5px;
              color: var(--text-slate-500);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 130px;
            }

            .lm-created-cell {
              display: flex; flex-direction: column;
              gap: 1px;
            }
            .lm-created-date {
              font-size: 12.5px;
              font-weight: 600;
              color: var(--text-slate-900);
              font-variant-numeric: tabular-nums;
            }
            .lm-created-rel {
              font-size: 10.5px;
              color: var(--text-slate-500);
              font-weight: 500;
            }

            /* Workflow Action pill — small icon prefix */
            .lm-action-pill {
              padding: 4px 10px 4px 6px;
              gap: 7px;
            }
            .lm-action-pill-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 18px;
              height: 18px;
              border-radius: 6px;
              flex-shrink: 0;
            }

            /* ---------- Table settings popover (used inline now) ---------- */

            .lm-table-settings-popover .ant-popover-inner {
              padding: 14px !important;
              border-radius: 14px !important;
              border: 1px solid var(--border-slate-100) !important;
            }
            .lm-popover-section-label {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 10.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--text-slate-500);
              margin-bottom: 8px;
            }
            .lm-popover-section-label svg { color: var(--text-slate-400); }
            .lm-col-toggle-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8px;
              padding: 5px 8px;
              border-radius: 7px;
              transition: background .12s ease;
              font-size: 12.5px;
              color: var(--text-slate-700);
              cursor: pointer;
            }
            .lm-col-toggle-row:hover { background: var(--bg-slate-50); }
            .lm-popover-footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8px;
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid var(--border-slate-100);
            }
            .lm-popover-reset {
              background: none;
              border: 0;
              padding: 0;
              cursor: pointer;
              color: #4f46e5;
              font-size: 11.5px;
              font-weight: 700;
              font-family: inherit;
            }
            .lm-popover-reset:hover { color: #4338ca; }
            .lm-popover-saved {
              font-size: 10.5px;
              color: var(--text-slate-400);
              font-weight: 500;
            }

            /* Density — vertical row padding inside the table card */
            .lm-table-card[data-density='compact'] .lm-table.ant-table-wrapper .ant-table-tbody > tr > td {
              padding: 8px 14px !important;
            }
            .lm-table-card[data-density='comfortable'] .lm-table.ant-table-wrapper .ant-table-tbody > tr > td {
              padding: 14px 16px !important;
            }
            .lm-table-card[data-density='spacious'] .lm-table.ant-table-wrapper .ant-table-tbody > tr > td {
              padding: 20px 18px !important;
            }
            /* Avatar / row visual scales down a bit on compact */
            .lm-table-card[data-density='compact'] .lead-avatar {
              transform: scale(0.92);
            }

            [data-theme='dark'] .lm-table-settings-btn.ant-btn {
              background: var(--bg-secondary) !important;
              border-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .lm-table-settings-popover .ant-popover-inner {
              background: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .lm-col-toggle-row:hover {
              background: var(--bg-primary);
            }

            /* ---------- Lead title tooltip (Document Hub style) ---------- */
            .lm-title-tooltip-overlay .ant-tooltip-inner {
              background: rgba(15, 23, 42, 0.96) !important;
              border-radius: 10px !important;
              padding: 10px 12px !important;
              box-shadow: 0 10px 32px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.06) !important;
              min-width: 220px;
              max-width: 360px;
            }
            .lm-title-tooltip-overlay .ant-tooltip-arrow::before,
            .lm-title-tooltip-overlay .ant-tooltip-arrow::after {
              background: rgba(15, 23, 42, 0.96) !important;
            }
            .lm-title-tooltip { padding: 2px 0; }
            .lm-title-tooltip-eyebrow {
              font-size: 9.5px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: rgba(255, 255, 255, 0.62);
              margin-bottom: 5px;
            }
            .lm-title-tooltip-text {
              font-size: 13px;
              font-weight: 700;
              color: rgba(255, 255, 255, 0.95);
              line-height: 1.4;
              letter-spacing: -0.005em;
              word-break: break-word;
            }
            .lm-title-tooltip-sub {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-top: 6px;
              padding-top: 6px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              font-size: 10.5px;
              color: rgba(255, 255, 255, 0.62);
              font-weight: 500;
            }
            .lm-title-tooltip-dot {
              width: 3px; height: 3px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.3);
            }

            /* ---------- BidIq preview modal ---------- */
            .lm-bidiq-modal .ant-modal-content {
              padding: 0 !important;
              border-radius: 16px !important;
              border: 1px solid var(--border-slate-100);
              overflow: hidden;
              background: var(--bg-pure-white);
              box-shadow: none !important;
            }
            .lm-bidiq-modal .ant-modal-body { padding: 0 !important; }

            .lm-bidiq-content { display: flex; flex-direction: column; }

            .lm-bidiq-head {
              display: flex;
              align-items: flex-start;
              gap: 14px;
              padding: 22px 24px 18px;
              position: relative;
              border-bottom: 1px solid var(--border-slate-100);
            }
            .lm-bidiq-icon {
              width: 44px; height: 44px;
              border-radius: 12px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: #fff;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .lm-bidiq-head-text { flex: 1; min-width: 0; padding-right: 40px; }
            .lm-bidiq-eyebrow {
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
            .lm-bidiq-title {
              margin: 0 0 4px;
              font-size: 18px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.015em;
            }
            .lm-bidiq-sub {
              margin: 0;
              font-size: 12.5px;
              color: var(--text-slate-500);
              line-height: 1.5;
            }
            .lm-bidiq-close {
              position: absolute;
              top: 16px; right: 16px;
              width: 30px; height: 30px;
              border-radius: 8px;
              border: 1px solid var(--border-slate-100);
              background: var(--bg-pure-white);
              color: var(--text-slate-500);
              cursor: pointer;
              display: flex; align-items: center; justify-content: center;
              transition: color .15s ease, border-color .15s ease;
            }
            .lm-bidiq-close:hover {
              color: var(--text-slate-900);
              border-color: var(--border-slate-200);
            }

            .lm-bidiq-snapshot {
              margin: 18px 24px 0;
              padding: 14px 16px;
              border: 1px solid var(--border-slate-100);
              border-radius: 12px;
              background: var(--bg-slate-50);
            }
            .lm-bidiq-snapshot-head {
              display: inline-flex; align-items: center; gap: 5px;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--text-slate-500);
              margin-bottom: 8px;
            }
            .lm-bidiq-snapshot-title {
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
            .lm-bidiq-snapshot-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 10px 14px;
            }
            @media (max-width: 560px) {
              .lm-bidiq-snapshot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            .lm-bidiq-snapshot-item {
              display: flex; flex-direction: column; gap: 3px;
              min-width: 0;
            }
            .lm-bidiq-snapshot-label {
              display: inline-flex; align-items: center; gap: 4px;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: var(--text-slate-500);
            }
            .lm-bidiq-snapshot-value {
              font-size: 13px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
              font-variant-numeric: tabular-nums;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .lm-bidiq-caps {
              padding: 18px 24px 0;
            }
            .lm-bidiq-caps-head {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--text-slate-500);
              margin-bottom: 12px;
            }
            .lm-bidiq-caps-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }
            @media (max-width: 560px) {
              .lm-bidiq-caps-grid { grid-template-columns: 1fr; }
            }
            .lm-bidiq-cap {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              padding: 12px 14px;
              border: 1px solid var(--border-slate-100);
              border-radius: 11px;
              background: var(--bg-pure-white);
              transition: border-color .15s ease;
            }
            .lm-bidiq-cap:hover {
              border-color: color-mix(in oklab, var(--cap-accent) 30%, var(--border-slate-100));
            }
            .lm-bidiq-cap-icon {
              width: 28px; height: 28px;
              border-radius: 8px;
              background: color-mix(in oklab, var(--cap-accent) 12%, transparent);
              color: var(--cap-accent);
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .lm-bidiq-cap-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
            .lm-bidiq-cap-title {
              font-size: 12.5px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
            }
            .lm-bidiq-cap-text {
              font-size: 11.5px;
              color: var(--text-slate-500);
              line-height: 1.45;
            }

            .lm-bidiq-footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              padding: 18px 24px 22px;
              margin-top: 18px;
              border-top: 1px solid var(--border-slate-100);
              flex-wrap: wrap;
            }
            .lm-bidiq-footnote {
              display: inline-flex; align-items: center; gap: 6px;
              font-size: 11.5px;
              color: var(--text-slate-500);
              font-weight: 500;
            }
            .lm-bidiq-footnote svg { color: #10b981; }
            .lm-bidiq-footer-actions { display: flex; gap: 8px; }
            .lm-bidiq-cancel.ant-btn {
              height: 36px !important;
              border-radius: 9px !important;
              font-weight: 600 !important;
              padding: 0 14px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
            }
            .lm-bidiq-cancel.ant-btn:hover {
              border-color: var(--border-slate-200) !important;
              color: var(--text-slate-900) !important;
            }
            .lm-bidiq-launch.ant-btn {
              height: 36px !important;
              border-radius: 9px !important;
              font-weight: 700 !important;
              padding: 0 16px !important;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
              border: 0 !important;
              color: #fff !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
            }
            .lm-bidiq-launch.ant-btn:hover {
              filter: brightness(1.05);
            }

            [data-theme='dark'] .lm-bidiq-modal .ant-modal-content {
              background: var(--bg-secondary) !important;
              border-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .lm-bidiq-snapshot,
            [data-theme='dark'] .lm-bidiq-cap,
            [data-theme='dark'] .lm-bidiq-close,
            [data-theme='dark'] .lm-bidiq-cancel.ant-btn {
              background: var(--bg-primary) !important;
              border-color: var(--border-slate-100) !important;
            }

            /* ---------- Dark theme overrides for new lm-* ---------- */
            [data-theme='dark'] .lm-stat-card {
              background: var(--bg-secondary);
              border-color: var(--border-slate-100);
            }
            [data-theme='dark'] .lm-search-input.ant-input-affix-wrapper {
              background: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .lm-secondary-btn {
              background: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .lm-section-divider-label {
              background: var(--bg-primary);
            }

            .premium-table .ant-table { background: transparent; }
            .premium-table .ant-table-thead > tr > th { 
              background: #f8fafc; 
              color: #64748b; 
              font-weight: 700; 
              font-size: 11px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em;
              border-bottom: 1px solid #f1f5f9;
              padding: 16px 20px;
            }
            .premium-table .ant-table-tbody > tr > td { 
              padding: 16px 20px; 
              border-bottom: 1px solid #f8fafc;
              transition: all 0.2s ease;
            }
            .premium-table .ant-table-tbody > tr:hover > td { 
              background: #fdfdff !important; 
            }
            .premium-table .ant-table-tbody > tr:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.02);
            }
            
            .status-select-premium .ant-select-selector, .action-select-premium .ant-select-selector {
              padding: 0 !important;
              height: auto !important;
            }
            
            .premium-pagination .ant-pagination-item-active {
              border-color: #6366f1;
            }
            .premium-pagination .ant-pagination-item-active a {
              color: #6366f1;
            }
            
            .action-btn:hover {
              background: #f1f5f9 !important;
              color: #6366f1 !important;
            }
            
            .leads-table-container {
              animation: slideUp 0.4s ease-out;
            }

            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }

            .stat-card-premium {
              transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
            }
            .stat-card-premium:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 24px -10px rgba(15, 23, 42, 0.08), 0 4px 8px -4px rgba(15, 23, 42, 0.04) !important;
              border-color: #e2e8f0 !important;
            }

            .lead-segment-btn {
              outline: none;
            }
            .lead-segment-btn:hover:not(.is-active) {
              background: #f8fafc !important;
              border-color: #cbd5e1 !important;
              color: #1e293b !important;
            }
            .lead-segment-btn.is-active {
              box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04);
            }

            .lead-filter-chip button:hover {
              background: rgba(99, 102, 241, 0.25) !important;
            }

            .lead-avatar {
              transition: transform 0.18s ease;
            }
            .premium-table .ant-table-tbody > tr:hover .lead-avatar {
              transform: scale(1.05);
            }

            .sk-shimmer {
              background: linear-gradient(90deg, #f1f5f9 0%, #f8fafc 50%, #f1f5f9 100%);
              background-size: 200% 100%;
              animation: skShimmer 1.4s ease-in-out infinite;
            }
            @keyframes skShimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }

            /* LEAD DRAWER ENHANCEMENTS */
            .lead-drawer .ant-drawer-header { padding: 0 !important; }
            .lead-drawer .ant-drawer-header-title { padding: 16px 24px; }
            .lead-drawer .ant-drawer-close {
              border-radius: 8px;
              transition: background 0.15s ease;
            }
            .lead-drawer .ant-drawer-close:hover {
              background: #f1f5f9;
            }

            .lead-section-card {
              background: var(--bg-pure-white);
              transition: border-color 0.18s ease, box-shadow 0.18s ease;
            }
            .lead-section-card:hover {
              border-color: #e2e8f0 !important;
              box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04);
            }

            .lead-drawer-form .ant-form-item-label > label {
              font-weight: 700 !important;
              text-transform: none;
              letter-spacing: 0;
            }

            .lead-drawer-form .ant-input,
            .lead-drawer-form .ant-input-number,
            .lead-drawer-form .ant-input-number-input,
            .lead-drawer-form .ant-input-affix-wrapper,
            .lead-drawer-form .ant-select-selector,
            .lead-drawer-form .ant-picker {
              border-radius: 10px !important;
              border: 1px solid #e2e8f0 !important;
              transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
            }
            .lead-drawer-form .ant-input:hover,
            .lead-drawer-form .ant-input-number:hover,
            .lead-drawer-form .ant-input-affix-wrapper:hover,
            .lead-drawer-form .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
            .lead-drawer-form .ant-picker:hover {
              border-color: #c7d2fe !important;
            }
            .lead-drawer-form .ant-input:focus,
            .lead-drawer-form .ant-input-number-focused,
            .lead-drawer-form .ant-input-affix-wrapper-focused,
            .lead-drawer-form .ant-select-focused .ant-select-selector,
            .lead-drawer-form .ant-picker-focused {
              border-color: #6366f1 !important;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
            }

            .lead-ai-textarea:focus,
            .lead-ai-textarea.ant-input-focused {
              background: #fff !important;
              border-color: #6366f1 !important;
              box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
            }

            .lead-drawer-form .ant-select-selection-item {
              font-weight: 600;
            }

            .lead-drawer-form .ant-select-selection-overflow .ant-select-selection-item {
              background: rgba(99, 102, 241, 0.08) !important;
              color: #4f46e5 !important;
              border: 1px solid rgba(99, 102, 241, 0.2) !important;
              border-radius: 999px !important;
              padding: 0 10px !important;
              font-weight: 700;
              font-size: 11px;
            }

            .lead-drawer-submit:hover {
              transform: translateY(-1px);
              box-shadow: 0 10px 24px -6px rgba(99, 102, 241, 0.55) !important;
            }
            .lead-drawer-submit {
              transition: transform 0.18s ease, box-shadow 0.18s ease;
            }

            /* DARK DRAWER ENHANCEMENTS */
            [data-theme='dark'] .lead-drawer .ant-drawer-close:hover { background: #1c2128 !important; }
            [data-theme='dark'] .lead-section-card { background: #0d1117 !important; border-color: #30363d !important; }
            [data-theme='dark'] .lead-section-card:hover { border-color: #3d444d !important; }
            [data-theme='dark'] .lead-drawer-form .ant-input,
            [data-theme='dark'] .lead-drawer-form .ant-input-number,
            [data-theme='dark'] .lead-drawer-form .ant-input-number-input,
            [data-theme='dark'] .lead-drawer-form .ant-input-affix-wrapper,
            [data-theme='dark'] .lead-drawer-form .ant-select-selector,
            [data-theme='dark'] .lead-drawer-form .ant-picker {
              background: #0d1117 !important;
              border-color: #30363d !important;
              color: #c9d1d9 !important;
            }
            [data-theme='dark'] .lead-drawer-form .ant-input:hover,
            [data-theme='dark'] .lead-drawer-form .ant-input-affix-wrapper:hover,
            [data-theme='dark'] .lead-drawer-form .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
            [data-theme='dark'] .lead-drawer-form .ant-picker:hover {
              border-color: rgba(99, 102, 241, 0.4) !important;
            }

            /* DARK SEGMENT/CHIP/SKELETON */
            [data-theme='dark'] .lead-segment-btn { background: #161b22 !important; border-color: #30363d !important; color: #c9d1d9 !important; }
            [data-theme='dark'] .lead-segment-btn:hover:not(.is-active) { background: #1c2128 !important; border-color: #3d444d !important; color: #f0f6fc !important; }
            [data-theme='dark'] .lead-filter-chip { background: rgba(99, 102, 241, 0.15) !important; border-color: rgba(99, 102, 241, 0.3) !important; color: #a5b4fc !important; }
            [data-theme='dark'] .sk-shimmer { background: linear-gradient(90deg, #161b22 0%, #21262d 50%, #161b22 100%); background-size: 200% 100%; }

            /* DARK THEME OVERRIDES */
            [data-theme='dark'] .leads-page-wrapper { background: #0d1117 !important; }
            [data-theme='dark'] .premium-table .ant-table-thead > tr > th { 
              background: #161b22 !important; 
              color: #8b949e !important; 
              border-bottom-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-table .ant-table-tbody > tr > td { 
              border-bottom-color: #21262d !important; 
              color: #c9d1d9 !important;
            }
            [data-theme='dark'] .premium-table .ant-table-tbody > tr:hover > td { 
              background: #1c2128 !important; 
            }
            [data-theme='dark'] .stat-card-premium { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .leads-table-container { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .leads-filter-card { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .hub-divider-premium { 
              border-top-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-title { color: #f0f6fc !important; }
            [data-theme='dark'] .premium-text-sec { color: #8b949e !important; }
            [data-theme='dark'] .premium-input-search { 
              background: #0d1117 !important; 
              border-color: #30363d !important; 
              color: #c9d1d9 !important; 
            }

            /* DARK DRAWER OVERRIDES */
            [data-theme='dark'] .premium-drawer .ant-drawer-content { background: #161b22 !important; }
            [data-theme='dark'] .premium-drawer .ant-drawer-header { 
              background: #161b22 !important; 
              border-bottom-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-drawer .ant-drawer-footer { 
              background: #0d1117 !important; 
              border-top-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-drawer-section { 
              background: #0d1117 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-drawer-section-alt { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-form-label { color: #8b949e !important; }
            [data-theme='dark'] .premium-section-title { color: #f0f6fc !important; }
            [data-theme='dark'] .premium-btn-cancel { 
              background: #21262d !important; 
              border-color: #30363d !important; 
              color: #c9d1d9 !important; 
            }
            [data-theme='dark'] .premium-drawer .ant-select-selector,
            [data-theme='dark'] .premium-drawer .ant-input,
            [data-theme='dark'] .premium-drawer .ant-input-number,
            [data-theme='dark'] .premium-drawer .ant-picker {
              background: #0d1117 !important;
              border-color: #30363d !important;
              color: #c9d1d9 !important;
            }
          `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
