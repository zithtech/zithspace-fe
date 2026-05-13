"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
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
  MapPin,
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
  Activity,
  Target,
  CheckCircle,
  ArrowUpRight,
  ListFilter
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
  type MenuProps
} from "antd";
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

export default function LeadsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { 
    canReadLead, 
    canCreateLead, 
    canUpdateLead, 
    canDeleteLead, 
    canManageLeads,
    canCreateProposal 
  } = usePermission();

  const [form] = Form.useForm();
  const { message: messageApi, modal } = App.useApp();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [activeSegment, setActiveSegment] = useState<"all" | "hot" | "week" | "won">("all");

  // ─── Route Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && user && !canReadLead) {
      router.push("/dashboard");
    }
  }, [user, isLoading, canReadLead, router]);

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

  const renderActionIcon = (iconName: string) => {
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
      default: return null;
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
                <Text
                  strong
                  ellipsis
                  style={{ color: "var(--text-slate-900)", fontSize: 14, fontWeight: 700, maxWidth: 280 }}
                >
                  {text}
                </Text>
                {record.client_payment_verified && (
                  <span title="Payment Verified" style={{ display: "inline-flex", color: "#10b981" }}>
                    <CheckCircle size={13} />
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-slate-500)" }}>
                <span style={{ fontWeight: 500 }}>{record.client_name}</span>
                {record.client_location && (
                  <>
                    <span style={{ color: "#cbd5e1" }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={10} />
                      {record.client_location}
                    </span>
                  </>
                )}
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
      width: 160,
      render: (status: string, record: Lead) => (
        <Select
          value={status}
          style={{ width: '100%' }}
          bordered={false}
          className="status-select-premium"
          onChange={(value) => handleStatusChange(record.id, value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          dropdownMatchSelectWidth={false}
          suffixIcon={<ChevronRight size={14} color="#94a3b8" />}
        >
          {configStatuses.map(s => (
            <Select.Option key={s.id} value={s.name}>
              <Tag style={{
                backgroundColor: `${s.color || '#6366f1'}12`,
                color: s.color || '#6366f1',
                border: `1px solid ${s.color || '#6366f1'}25`,
                fontWeight: 800,
                borderRadius: 8,
                padding: "2px 12px",
                fontSize: 10,
                letterSpacing: "0.03em",
                margin: 0,
                textTransform: 'uppercase'
              }}>
                {s.name}
              </Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Action",
      dataIndex: "actions_item",
      key: "action",
      width: 180,
      render: (action: string, record: Lead) => (
        <Select
          value={action}
          placeholder="Next Step"
          style={{ width: '100%' }}
          bordered={false}
          className="action-select-premium"
          onChange={(value) => handleActionChange(record.id, value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          allowClear
          suffixIcon={<MoreVertical size={14} color="#94a3b8" />}
        >
          {configActions.map(a => (
            <Select.Option key={a.id} value={a.name}>
              <Space size={8} style={{ padding: '2px 0' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: `${a.color || '#6366f1'}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: a.color || '#6366f1'
                }}>
                  {React.cloneElement(renderActionIcon(a.icon) as React.ReactElement, { style: { fontSize: 12 } })}
                </div>
                <span style={{ fontWeight: 600, color: '#475569', fontSize: 12 }}>{a.name}</span>
              </Space>
            </Select.Option>
          ))}
        </Select>
      ),
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
      title: "Bidiq",
      key: "bidiq",
      width: 100,
      align: "center" as const,
      render: (_: unknown, record: Lead) => (
        canManageLeads && (
          <Button
            type="link"
            icon={<Zap size={16} />}
            onClick={(e) => { e.stopPropagation(); router.push(`/leads/bidiq/${record.id}`); }}
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
            Bidiq
          </Button>
        )
      ),
    },
    {
      title: "Proposal",
      key: "proposal",
      width: 140,
      render: (_: unknown, record: Lead) => (
        canCreateProposal && (
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
              onClick={(e) => { e.stopPropagation(); router.push(`/leads/bidiq/${record.id}`); }}
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
        )
      ),
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
          canUpdateLead && {
            key: 'edit',
            label: 'Edit Lead',
            icon: <Settings2 size={16} />,
          },
          (canUpdateLead || canDeleteLead) && {
            type: 'divider',
          },
          canDeleteLead && {
            key: 'delete',
            label: 'Delete Lead',
            danger: true,
            icon: <Trash2 size={16} />,
          }
        ].filter(Boolean) as MenuProps['items'];

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

      return matchesSearch && matchesStatus && matchesAction && matchesPlatform && matchesDateRange && matchesSegment;
    });
  }, [leads, searchText, filterStatus, filterAction, filterPlatform, filterDateRange, activeSegment]);

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
    if (searchText) chips.push({ key: "search", label: `“${searchText}”`, onClear: () => setSearchText("") });
    return chips;
  }, [filterStatus, filterPlatform, filterAction, filterDateRange, searchText]);

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

  const StatCard = ({ label, value, icon: Icon, color, trend, trendLabel, suffix }: any) => (
    <Card
      bodyStyle={{ padding: "16px 18px" }}
      className="stat-card-premium"
      style={{
        borderRadius: 16,
        border: "1px solid #f1f5f9",
        background: "#fff",
        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.02), 0 1px 2px -1px rgba(0,0,0,0.02)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(120% 100% at 100% 0%, ${color}10 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text
            className="premium-text-sec"
            style={{
              color: "#94a3b8",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </Text>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
            <div
              className="premium-title"
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#1e293b",
                lineHeight: 1,
                letterSpacing: "-0.025em",
              }}
            >
              {value}
            </div>
            {suffix && (
              <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 700 }}>{suffix}</span>
            )}
          </div>
          {trendLabel && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: trend === "up" ? "rgba(16, 185, 129, 0.1)" : trend === "down" ? "rgba(239, 68, 68, 0.1)" : "rgba(100, 116, 139, 0.08)",
                  color: trend === "up" ? "#059669" : trend === "down" ? "#dc2626" : "#64748b",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                }}
              >
                {trend === "up" && <ArrowUpRight size={10} />}
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            color: "#fff",
            background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
            padding: 10,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 12px ${color}30`,
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="leads-page-wrapper" style={{
          margin: "0 -24px",
          padding: "12px 24px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)"
        }}>

          {/* Header Section */}
          <div style={{ marginBottom: 0, paddingBottom: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <Space size={12} align="center">
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: "#6366f1"
                }}>
                  <Layers size={20} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Title level={4} className="premium-title" style={{ margin: 0, fontWeight: 800, color: "var(--text-primary)", fontSize: 18, letterSpacing: "-0.01em" }}>Leads Management</Title>
                  <span style={{ width: 1, height: 18, background: "var(--border-slate-200)", display: "inline-block" }} />
                  <Text type="secondary" className="premium-text-sec" style={{ fontSize: '11px', color: "var(--text-secondary)" }}>
                    Track, manage and convert your potential business opportunities
                  </Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                placeholder="Search leads..."
                prefix={<Search size={14} style={{ color: "#94a3b8" }} />}
                className="premium-input-search"
                style={{
                  width: 220,
                  borderRadius: 8,
                  height: 32,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: 13,
                  fontWeight: 500
                }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {canCreateLead && (
                <Button
                  type="primary"
                  size="small"
                  icon={<Plus size={14} />}
                  style={{
                    borderRadius: 6,
                    height: 32,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    background: "#6366f1",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                    padding: "0 12px",
                    fontSize: 13
                  }}
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
              )}
            </div>
          </div>

          <Divider className="hub-divider-premium" style={{ margin: '0 -24px 16px -24px', width: 'calc(100% + 48px)', borderTop: '1px solid #e2e8f0' }} />

          {/* Saved-View Segments */}
          <div className="lead-segments" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
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
          </div>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                label="Total Leads"
                value={leads.length}
                icon={Layers}
                color="#6366f1"
                trend={leadsThisWeek > 0 ? "up" : "neutral"}
                trendLabel={`${leadsThisWeek} this week`}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                label="New Today"
                value={leadsToday}
                icon={Zap}
                color="#f59e0b"
                trend={leadsToday > 0 ? "up" : "neutral"}
                trendLabel={leadsToday > 0 ? "Fresh activity" : "No new today"}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                label="Hot Leads"
                value={hotLeadsCount}
                icon={Flame}
                color="#ef4444"
                trend={hotLeadsCount > 0 ? "up" : "neutral"}
                trendLabel={`${totalClients} clients`}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                label="Pipeline Rate"
                value={pipelineRate}
                suffix="%"
                icon={Target}
                color="#10b981"
                trend={pipelineRate >= 50 ? "up" : "neutral"}
                trendLabel="With proposal"
              />
            </Col>
          </Row>

          {/* Filter Bar Section */}
          <Card
            bodyStyle={{ padding: "8px 16px" }}
            className="leads-filter-card"
            style={{
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "#fff",
              boxShadow: "0 2px 4px 0 rgb(0 0 0 / 0.05)"
            }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col>
                <Space size={8} style={{ color: "var(--text-slate-500)", fontWeight: 600 }}>
                  <Filter size={18} />
                  <span>Filters</span>
                </Space>
              </Col>
              <Col flex="auto">
                <Row gutter={12}>
                  <Col span={5}>
                    <Select
                      placeholder="Filter by Status"
                      style={{ width: '100%' }}
                      allowClear
                      value={filterStatus}
                      onChange={setFilterStatus}
                      dropdownStyle={{ borderRadius: 8 }}
                    >
                      {configStatuses.map(s => (
                        <Select.Option key={s.id} value={s.name}>
                          <Tag style={{
                            backgroundColor: `${s.color}15`,
                            color: s.color,
                            border: `1px solid ${s.color}30`,
                            fontWeight: 700,
                            borderRadius: 6,
                            padding: "2px 10px",
                            fontSize: 10,
                            margin: 0
                          }}>
                            {s.name.toUpperCase()}
                          </Tag>
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={5}>
                    <Select
                      placeholder="Filter by Platform"
                      style={{ width: '100%' }}
                      allowClear
                      value={filterPlatform}
                      onChange={setFilterPlatform}
                    >
                      <Select.Option value="Upwork">Upwork</Select.Option>
                      <Select.Option value="LinkedIn">LinkedIn</Select.Option>
                      <Select.Option value="Freelancer">Freelancer</Select.Option>
                      <Select.Option value="Fiverr">Fiverr</Select.Option>
                    </Select>
                  </Col>
                  <Col span={5}>
                    <Select
                      placeholder="Filter by Action"
                      style={{ width: '100%' }}
                      allowClear
                      value={filterAction}
                      onChange={setFilterAction}
                    >
                      {configActions.map(a => (
                        <Select.Option key={a.id} value={a.name}>
                          <Space>
                            {renderActionIcon(a.icon)}
                            {a.name}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <DatePicker.RangePicker
                      style={{ width: '100%' }}
                      value={filterDateRange}
                      onChange={(dates) => setFilterDateRange(dates as any)}
                    />
                  </Col>
                  <Col span={3}>
                    <Button
                      icon={<RefreshCw size={14} />}
                      onClick={() => {
                        setFilterStatus(null);
                        setFilterAction(null);
                        setFilterPlatform(null);
                        setFilterDateRange(null);
                        setSearchText("");
                      }}
                      block
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      Clear
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

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

          <Card
            bodyStyle={{ padding: 0 }}
            style={{
              borderRadius: 20,
              border: "1px solid #f1f5f9",
              overflow: "hidden",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04)"
            }}
            className="leads-table-container"
          >
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
                      borderBottom: "1px solid #f8fafc",
                    }}
                  >
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
                columns={columns}
                dataSource={filteredLeads}
                rowKey="id"
                size="middle"
                pagination={{
                  pageSize: 10,
                  position: ["bottomRight"],
                  showSizeChanger: false,
                  className: "premium-pagination"
                }}
                className="premium-table"
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
          </Card>
        </div>

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
                  {((editingKey && canUpdateLead) || (!editingKey && canCreateLead)) && (
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
                  )}
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
