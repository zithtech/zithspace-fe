"use client";

import React, { useEffect, useState } from "react";
import {
  Typography,
  Tabs,
  Button,
  Space,
  Spin,
  message,
  Input,
  Select,
  Switch,
  notification,
  Tooltip,
} from "antd";
import {
  ArrowLeft,
  Edit3,
  Check,
  X,
  Building2,
  Globe,
  Globe2,
  ShieldCheck,
  Users,
  Layers,
  DollarSign,
  Briefcase,
  Mail,
  MapPin,
  ExternalLink,
  Settings2,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  CircleDot,
  Hash,
  Banknote,
  Landmark,
  Sparkles,
  Activity,
  Copy,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  FileText,
  BadgeCheck,
  Calendar,
  ChevronRight,
  KeyRound,
  LifeBuoy,
  Flag,
  Rocket,
  GitPullRequest,
  CheckSquare,
  Server,
  Receipt,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { api } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { usePermission } from "@/hooks/usePermission";

import ContactsTab from "./Tabs/ContactsTab";
import AllocationsTab from "./Tabs/AllocationsTab";
import DocumentsTab from "./Tabs/DocumentsTab";
import ProjectsTab from "./Tabs/ProjectsTab";
import InvoicesTab from "./Tabs/InvoicesTab";
import PortalAccessTab from "./Tabs/PortalAccessTab";
import MeetingsTab from "./Tabs/MeetingsTab";
import ChangeRequestsTab from "./Tabs/ChangeRequestsTab";
import ApprovalsTab from "./Tabs/ApprovalsTab";
import EnvironmentsTab from "./Tabs/EnvironmentsTab";
import TeamTab from "./Tabs/TeamTab";
import SupportTicketsTab from "./Tabs/SupportTicketsTab";
import MilestonesTab from "./Tabs/MilestonesTab";
import ReleasesTab from "./Tabs/ReleasesTab";

const { Text } = Typography;

/* -------------------------------------------------------------------------- */
/*                            Visual helpers                                  */
/* -------------------------------------------------------------------------- */

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
  "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
];

const gradientFor = (key?: string) => {
  if (!key) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const initialsOf = (name?: string, code?: string) => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  return code?.substring(0, 2).toUpperCase() || "CL";
};

const formatCurrencyShort = (val?: number) => {
  if (val == null || isNaN(val)) return "—";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
};

/* -------------------------------------------------------------------------- */
/*                             Editable fields                                */
/* -------------------------------------------------------------------------- */

const EditableText: React.FC<{
  value: string;
  field: string;
  placeholder?: string;
  mono?: boolean;
  onUpdate: (f: string, v: any) => void;
  activeField: string | null;
  setActiveField: (f: string | null) => void;
  isEditMode: boolean;
}> = ({ value, field, placeholder, mono, onUpdate, activeField, setActiveField, isEditMode }) => {
  const isEditing = activeField === field;
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => setTempValue(value), [value]);

  if (isEditing) {
    return (
      <div className="cd-edit-row">
        <Input
          autoFocus
          size="small"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onPressEnter={() => {
            onUpdate(field, tempValue);
            setActiveField(null);
          }}
          className="cd-edit-input"
        />
        <button
          type="button"
          className="cd-edit-btn save"
          onClick={() => {
            onUpdate(field, tempValue);
            setActiveField(null);
          }}
        >
          <Check size={13} />
        </button>
        <button
          type="button"
          className="cd-edit-btn cancel"
          onClick={() => {
            setTempValue(value);
            setActiveField(null);
          }}
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`cd-field-value ${isEditMode ? "editable" : ""} ${mono ? "mono" : ""}`}
      onClick={() => isEditMode && setActiveField(field)}
    >
      <span className={value ? "" : "muted"}>{value || placeholder || "—"}</span>
      {isEditMode && <Edit3 size={11} className="cd-pencil" />}
    </div>
  );
};

const EditableSelect: React.FC<{
  value: string;
  field: string;
  options: any[];
  renderTag?: (val: string) => React.ReactNode;
  onUpdate: (f: string, v: any) => void;
  activeField: string | null;
  setActiveField: (f: string | null) => void;
  isEditMode: boolean;
}> = ({ value, field, options, renderTag, onUpdate, activeField, setActiveField, isEditMode }) => {
  const isEditing = activeField === field;
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => setTempValue(value), [value]);

  if (isEditing) {
    return (
      <div className="cd-edit-row">
        <Select
          autoFocus
          size="small"
          value={tempValue}
          options={options}
          onChange={(val) => setTempValue(val)}
          style={{ width: "100%", minWidth: 140 }}
          open
        />
        <button
          type="button"
          className="cd-edit-btn save"
          onClick={() => {
            onUpdate(field, tempValue);
            setActiveField(null);
          }}
        >
          <Check size={13} />
        </button>
        <button
          type="button"
          className="cd-edit-btn cancel"
          onClick={() => {
            setTempValue(value);
            setActiveField(null);
          }}
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`cd-field-value ${isEditMode ? "editable" : ""}`}
      onClick={() => isEditMode && setActiveField(field)}
    >
      {renderTag ? renderTag(value) : <span className={value ? "" : "muted"}>{value || "—"}</span>}
      {isEditMode && <Edit3 size={11} className="cd-pencil" />}
    </div>
  );
};

const EditableTextArea: React.FC<{
  value: string;
  field: string;
  onUpdate: (f: string, v: any) => void;
  activeField: string | null;
  setActiveField: (f: string | null) => void;
  isEditMode: boolean;
}> = ({ value, field, onUpdate, activeField, setActiveField, isEditMode }) => {
  const isEditing = activeField === field;
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => setTempValue(value), [value]);

  if (isEditing) {
    return (
      <div style={{ width: "100%" }}>
        <Input.TextArea
          autoFocus
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{ marginBottom: 8, borderRadius: 8 }}
        />
        <Space size={6}>
          <Button
            type="primary"
            size="small"
            icon={<Check size={13} />}
            className="cd-primary-btn"
            onClick={() => {
              onUpdate(field, tempValue);
              setActiveField(null);
            }}
          >
            Save
          </Button>
          <Button
            size="small"
            icon={<X size={13} />}
            onClick={() => {
              setTempValue(value);
              setActiveField(null);
            }}
          >
            Cancel
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <div
      className={`cd-field-value multiline ${isEditMode ? "editable" : ""}`}
      onClick={() => isEditMode && setActiveField(field)}
    >
      <span className={value ? "" : "muted"} style={{ whiteSpace: "pre-wrap" }}>
        {value || "—"}
      </span>
      {isEditMode && <Edit3 size={11} className="cd-pencil" />}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Stat Card                                   */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<any>;
  accent: string;
  trend?: { value: number; positive?: boolean };
  subtle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, accent, trend, subtle }) => (
  <div className="cd-stat-card">
    <div className="cd-stat-glow" style={{ background: accent }} />
    <div className="cd-stat-row">
      <div
        className="cd-stat-icon"
        style={{ background: `${accent}14`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}30` }}
      >
        <Icon size={18} color={accent} />
      </div>
      {trend && (
        <div className={`cd-trend ${trend.positive ? "up" : "down"}`}>
          {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trend.value > 0 ? "+" : ""}{trend.value}%</span>
        </div>
      )}
    </div>
    <Text className="cd-stat-label">{label}</Text>
    <div className="cd-stat-value">{value}</div>
    {subtle && <Text className="cd-stat-subtle">{subtle}</Text>}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                              Section Card                                  */
/* -------------------------------------------------------------------------- */

interface SectionCardProps {
  title: string;
  description?: string;
  icon: React.ComponentType<any>;
  accent: string;
  editLabel?: string;
  editOn?: boolean;
  onToggleEdit?: (v: boolean) => void;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  icon: Icon,
  accent,
  editOn,
  onToggleEdit,
  children,
}) => (
  <div className="cd-section">
    <div className="cd-section-header">
      <div className="cd-section-titlewrap">
        <div
          className="cd-section-icon"
          style={{ background: `${accent}14`, color: accent, boxShadow: `inset 0 0 0 1px ${accent}30` }}
        >
          <Icon size={16} color={accent} />
        </div>
        <div>
          <div className="cd-section-title">{title}</div>
          {description && <div className="cd-section-desc">{description}</div>}
        </div>
      </div>
      {onToggleEdit && (
        <div className={`cd-edit-toggle ${editOn ? "on" : ""}`}>
          <Edit3 size={12} />
          <span>Edit</span>
          <Switch
            size="small"
            checked={editOn}
            onChange={(v) => onToggleEdit(v)}
            className="cd-switch"
          />
        </div>
      )}
    </div>
    <div className="cd-section-body">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode; icon?: React.ComponentType<any> }> = ({
  label,
  children,
  icon: Icon,
}) => (
  <div className="cd-field">
    <div className="cd-field-label">
      {Icon && <Icon size={11} />}
      <span>{label}</span>
    </div>
    <div className="cd-field-content">{children}</div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function ClientV2DetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { tenantId } = useTenant();
  const { canUpdateClient } = usePermission();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notify, contextHolder] = notification.useNotification();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("1");
  const [copiedCode, setCopiedCode] = useState(false);

  const [editModes, setEditModes] = useState({
    basic: false,
    operational: false,
    finance: false,
    banking: false,
  });

  const handleEditModeChange = (section: keyof typeof editModes, checked: boolean) => {
    setEditModes((prev) => ({ ...prev, [section]: checked }));
    if (!checked) setActiveField(null);
  };

  const fetchClientDetails = async () => {
    if (!tenantId || !params.id) return;
    if (!client) setLoading(true);
    try {
      const [clientData, projectsData] = await Promise.all([
        api.get(`/api/clients-v2/${params.id}`),
        api.get(`/api/clients-v2/${params.id}/projects`).catch(() => []),
      ]);
      if (clientData) {
        setClient({ ...clientData, projects: projectsData || [] });
      } else {
        message.error("Failed to fetch client details");
        router.push("/clients-v2");
      }
    } catch (err) {
      console.error(err);
      message.error("Error fetching details");
    } finally {
      setLoading(false);
    }
  };

  const getGstLabel = () => {
    const normCountry = client?.country ? String(client.country).trim().toLowerCase() : "";
    if (normCountry === "india" || normCountry === "in") return "GSTIN";
    if (normCountry === "us" || normCountry === "usa" || normCountry === "united states" || normCountry === "united states of america") return "Tax ID (EIN/SSN)";
    return "GST / VAT / Tax ID";
  };

  const getPanLabel = () => {
    const normCountry = client?.country ? String(client.country).trim().toLowerCase() : "";
    if (normCountry === "india" || normCountry === "in") return "PAN";
    if (normCountry === "us" || normCountry === "usa" || normCountry === "united states" || normCountry === "united states of america") return "Tax ID / EIN";
    return "PAN / Tax ID";
  };

  useEffect(() => {
    fetchClientDetails();
  }, [tenantId, params.id]);

  const handleUpdateField = async (field: string, value: any) => {
    try {
      if (client[field] === value) return;

      // Validate GST/Tax ID, PAN, and Year of Incorporation if they or country are updated
      if (field === "gstVatTaxId" || field === "pan" || field === "yearOfIncorporation" || field === "country") {
        const gstVatTaxId = field === "gstVatTaxId" ? value : client.gstVatTaxId;
        const pan = field === "pan" ? value : client.pan;
        const yearOfIncorporation = field === "yearOfIncorporation" ? value : client.yearOfIncorporation;
        const country = field === "country" ? value : client.country;

        // 1. GST Validation
        if (gstVatTaxId && gstVatTaxId.trim() !== "") {
          const val = gstVatTaxId.trim();
          const normCountry = country ? country.trim().toLowerCase() : "";
          const isIndia = normCountry === "india" || normCountry === "in";
          const isUS = normCountry === "us" || normCountry === "usa" || normCountry === "united states" || normCountry === "united states of america";

          const indiaRegex = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[Zz][0-9A-Za-z]{1}$/;
          const usEinRegex = /^\d{2}-\d{7}$/;
          const usSsnRegex = /^\d{3}-\d{2}-\d{4}$/;
          const usPlainRegex = /^\d{9}$/;

          let validationError: string | null = null;
          if (isIndia) {
            if (!indiaRegex.test(val)) {
              validationError = "Invalid Indian GSTIN format (e.g. 22AAAAA0000A1Z1).";
            }
          } else if (isUS) {
            if (!usEinRegex.test(val) && !usSsnRegex.test(val) && !usPlainRegex.test(val)) {
              validationError = "Invalid US Tax ID format. Use EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX).";
            }
          } else {
            const matchesIndia = indiaRegex.test(val);
            const matchesUS = usEinRegex.test(val) || usSsnRegex.test(val) || usPlainRegex.test(val);
            if (!matchesIndia && !matchesUS) {
              validationError = "Must match Indian GSTIN or US Tax ID format.";
            }
          }

          if (validationError) {
            notify.error({
              message: "Validation Error",
              description: validationError,
              placement: "top",
            });
            setActiveField(null);
            return;
          }
        }

        // 2. PAN Validation
        if (pan && pan.trim() !== "") {
          const val = pan.trim();
          const normCountry = country ? country.trim().toLowerCase() : "";
          const isIndia = normCountry === "india" || normCountry === "in";
          const isUS = normCountry === "us" || normCountry === "usa" || normCountry === "united states" || normCountry === "united states of america";

          const indiaPanRegex = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;
          const usEinRegex = /^\d{2}-\d{7}$/;
          const usSsnRegex = /^\d{3}-\d{2}-\d{4}$/;
          const usPlainRegex = /^\d{9}$/;

          let validationError: string | null = null;
          if (isIndia) {
            if (!indiaPanRegex.test(val)) {
              validationError = "Invalid Indian PAN format (e.g. ABCDE1234F).";
            }
          } else if (isUS) {
            if (!usEinRegex.test(val) && !usSsnRegex.test(val) && !usPlainRegex.test(val)) {
              validationError = "Invalid US Tax ID format for PAN. Use EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX).";
            }
          } else {
            const matchesIndia = indiaPanRegex.test(val);
            const matchesUS = usEinRegex.test(val) || usSsnRegex.test(val) || usPlainRegex.test(val);
            if (!matchesIndia && !matchesUS) {
              validationError = "Must match Indian PAN or US Tax ID format.";
            }
          }

          if (validationError) {
            notify.error({
              message: "Validation Error",
              description: validationError,
              placement: "top",
            });
            setActiveField(null);
            return;
          }
        }

        // 3. Year of Incorporation Validation
        if (yearOfIncorporation !== undefined && yearOfIncorporation !== null && String(yearOfIncorporation).trim() !== "") {
          const valStr = String(yearOfIncorporation).trim();
          if (!/^\d{4}$/.test(valStr)) {
            notify.error({
              message: "Validation Error",
              description: "Year must be a valid 4-digit number.",
              placement: "top",
            });
            setActiveField(null);
            return;
          }

          const yearNum = Number(valStr);
          const currentYear = new Date().getFullYear();
          if (yearNum < 1800 || yearNum > currentYear) {
            notify.error({
              message: "Validation Error",
              description: `Year must be between 1800 and ${currentYear}.`,
              placement: "top",
            });
            setActiveField(null);
            return;
          }
        }
      }

      const payload = { [field]: value };
      const updatedClient = await api.put(`/api/clients-v2/${client.id}`, payload);
      if (updatedClient) {
        setClient((prev: any) => ({ ...prev, [field]: value }));
        notify.success({
          message: "Updated successfully",
          description: `${field} has been updated.`,
          placement: "top",
        });
      }
    } catch (err: any) {
      console.error(err);
      const serverError = err.response?.data?.error || err.response?.data?.message || "Failed to update the field.";
      notify.error({
        message: "Update failed",
        description: serverError,
        placement: "top",
      });
      fetchClientDetails();
    } finally {
      setActiveField(null);
    }
  };

  const handleCopyCode = () => {
    if (!client?.clientCode) return;
    navigator.clipboard.writeText(client.clientCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  };

  /* ---------------------- Loading state ---------------------- */

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="cd-loading">
            <div className="cd-loading-card">
              <Spin size="large" />
              <Text className="cd-loading-text">Loading client profile…</Text>
            </div>
            <style jsx global>{`
              .cd-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: calc(100vh - 64px);
                margin: 0 -24px;
                background: var(--bg-primary);
              }
              .cd-loading-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 14px;
                padding: 40px 56px;
                border-radius: 18px;
                background: var(--bg-pure-white);
                border: 1px solid var(--border-slate-100);
                box-shadow: 0 10px 30px -16px rgba(15, 23, 42, 0.18);
              }
              .cd-loading-text {
                color: var(--text-slate-500);
                font-size: 13px;
                font-weight: 500;
              }
            `}</style>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!client) return null;

  /* ---------------------- Derived metrics ---------------------- */

  const activeContacts = client.contacts?.filter((c: any) => c.status === "Active").length || 0;
  const totalContacts = client.contacts?.length || 0;
  const totalAllocations = client.allocations?.length || 0;
  const activeAllocations = client.allocations?.filter((a: any) => a.status === "Active").length || 0;
  const totalProjects = client.projects?.length || 0;
  const totalProjectBudget =
    client.projects?.reduce((sum: number, p: any) => sum + (Number(p.budget) || 0), 0) || 0;
  const totalDocuments = client.documents?.length || 0;

  const initials = initialsOf(client.companyName, client.clientCode);
  const heroGradient = gradientFor(client.companyName || client.clientCode);

  const isActive = client.status === "Active";
  const riskLevel = (client.riskLevel || "Low") as "High" | "Medium" | "Low";
  const riskMap = {
    High: { color: "#ef4444", bg: "rgba(239,68,68,0.14)" },
    Medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.16)" },
    Low: { color: "#10b981", bg: "rgba(16,185,129,0.14)" },
  } as const;
  const riskCfg = riskMap[riskLevel] || riskMap.Low;

  const createdAt = client.createdAt
    ? new Date(client.createdAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : null;

  /* ---------------------- Render ---------------------- */

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}
        <div className="cd-page">
          {/* ---------------- Top command bar ---------------- */}
          <div className="cd-cmdbar">
            <div className="cd-crumbs">
              <button
                type="button"
                className="cd-back"
                onClick={() => router.push("/clients-v2")}
              >
                <ArrowLeft size={15} />
              </button>
              <button
                type="button"
                className="cd-crumb-link"
                onClick={() => router.push("/clients-v2")}
              >
                <Building2 size={13} />
                <span>Clients</span>
              </button>
              <ChevronRight size={13} className="cd-crumb-sep" />
              <span className="cd-crumb-current">{client.companyName}</span>
            </div>

            <div className="cd-cmdbar-actions">
              {canUpdateClient && (
                <Button
                  icon={<Settings2 size={15} />}
                  className="cd-secondary-btn"
                  onClick={() => router.push(`/clients-v2/create?id=${client.id}`)}
                >
                  Edit profile
                </Button>
              )}
            </div>
          </div>

          {/* ---------------- Tabs (Side nav) ---------------- */}
          <div className="cd-body">
            <Tabs
              tabPosition="left"
              activeKey={activeTab}
              onChange={setActiveTab}
              className="cd-tabs"
              items={[
                {
                  key: "1",
                  label: (
                    <span className="cd-tab-label">
                      <Layers size={15} />
                      <span>Overview</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      {/* ---------------- Premium Hero ---------------- */}
                      <div className="cd-hero">
                        <div className="cd-hero-mesh" />
                        <div className="cd-hero-blob" style={{ background: heroGradient }} />

                        <div className="cd-hero-main">
                          <div className="cd-hero-avatar" style={{ background: heroGradient }}>
                            <span>{initials}</span>
                            <span className={`cd-hero-avatar-status ${isActive ? "active" : ""}`} />
                          </div>

                          <div className="cd-hero-info">
                            <h1 className="cd-hero-title">{client.companyName}</h1>

                            <div className="cd-hero-meta">
                              <div className="cd-hero-meta-left">
                                <Tooltip title={copiedCode ? "Copied!" : "Click to copy code"}>
                                  <button type="button" className="cd-meta-code" onClick={handleCopyCode}>
                                    <Hash size={11} />
                                    <span>{client.clientCode}</span>
                                    {copiedCode ? <Check size={11} /> : <Copy size={11} />}
                                  </button>
                                </Tooltip>
                                {client.industry && (
                                  <span className="cd-meta-item">
                                    <ShieldCheck size={12} />
                                    {client.industry}
                                  </span>
                                )}
                                {client.country && (
                                  <span className="cd-meta-item">
                                    <Globe2 size={12} />
                                    {client.country}
                                  </span>
                                )}
                                {client.website && (
                                  <a
                                    href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="cd-meta-link"
                                  >
                                    <Globe size={12} />
                                    <span>{client.website.replace(/^https?:\/\//, "")}</span>
                                    <ArrowUpRight size={11} />
                                  </a>
                                )}
                                {createdAt && (
                                  <span className="cd-meta-item">
                                    <Calendar size={12} />
                                    Onboarded {createdAt}
                                  </span>
                                )}
                              </div>

                              <div className="cd-hero-pills">
                                <span className={`cd-pill status ${isActive ? "active" : "inactive"}`}>
                                  <span className="cd-pill-dot" />
                                  {(client.status || "Inactive").toUpperCase()}
                                </span>
                                <span
                                  className="cd-pill risk"
                                  style={{ background: riskCfg.bg, color: riskCfg.color }}
                                >
                                  <CircleDot size={10} fill={riskCfg.color} stroke={riskCfg.color} />
                                  {riskLevel.toUpperCase()} RISK
                                </span>
                                {client.clientType && (
                                  <span className="cd-pill type">
                                    <Sparkles size={11} />
                                    {client.clientType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Stat cards */}
                      <div className="cd-stat-grid">
                        <StatCard
                          label="Active Contacts"
                          value={`${activeContacts}`}
                          icon={Users}
                          accent="#3b82f6"
                          subtle={`${totalContacts} total contacts`}
                        />
                        <StatCard
                          label="Resource Allocations"
                          value={`${activeAllocations} / ${totalAllocations}`}
                          icon={Briefcase}
                          accent="#10b981"
                          subtle="Currently engaged"
                        />
                        <StatCard
                          label="Total Projects"
                          value={totalProjects}
                          icon={FolderKanban}
                          accent="#f59e0b"
                          subtle={totalDocuments ? `${totalDocuments} documents` : "Active engagements"}
                        />
                        <StatCard
                          label="Projected Budget"
                          value={formatCurrencyShort(totalProjectBudget)}
                          icon={Wallet}
                          accent="#8b5cf6"
                          subtle="Across all projects"
                        />
                      </div>

                      {/* Section grid */}
                      <div className="cd-section-grid">
                        <SectionCard
                          title="Corporate Profile"
                          description="Legal and corporate identity details"
                          icon={Building2}
                          accent="#3b82f6"
                          editOn={editModes.basic}
                          onToggleEdit={canUpdateClient ? (v) => handleEditModeChange("basic", v) : undefined}
                        >
                          <div className="cd-grid">
                            <Field label="Legal Entity" icon={Building2}>
                              <EditableText
                                value={client.legalName}
                                field="legalName"
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.basic}
                              />
                            </Field>
                            <Field label="Client Category" icon={BadgeCheck}>
                              <EditableSelect
                                value={client.clientType}
                                field="clientType"
                                onUpdate={handleUpdateField}
                                options={[
                                  { value: "Direct", label: "Direct" },
                                  { value: "Partner", label: "Partner" },
                                  { value: "Reseller", label: "Reseller" },
                                  { value: "Vendor", label: "Vendor" },
                                ]}
                                renderTag={(val) =>
                                  val ? <span className="cd-mini-tag">{val}</span> : <span className="muted">—</span>
                                }
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.basic}
                              />
                            </Field>
                            <Field label="Industry Sector" icon={ShieldCheck}>
                              <EditableText
                                value={client.industry}
                                field="industry"
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.basic}
                              />
                            </Field>
                            <Field label="Company Size" icon={Users}>
                              <EditableText
                                value={client.companySize}
                                field="companySize"
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.basic}
                              />
                            </Field>
                            <Field label="Website" icon={Globe}>
                              <div className="cd-website-row">
                                <EditableText
                                  value={client.website}
                                  field="website"
                                  onUpdate={handleUpdateField}
                                  activeField={activeField}
                                  setActiveField={setActiveField}
                                  isEditMode={editModes.basic}
                                />
                                {client.website && !editModes.basic && (
                                  <a
                                    href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="cd-website-go"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            </Field>
                            <Field label="Registration No." icon={FileText}>
                              <EditableText
                                value={client.registrationNumber}
                                field="registrationNumber"
                                mono
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.basic}
                              />
                            </Field>
                          </div>
                        </SectionCard>

                        <SectionCard
                          title="Operations & Risk"
                          description="Account status, segment, and billing contact"
                          icon={Activity}
                          accent="#ef4444"
                          editOn={editModes.operational}
                          onToggleEdit={canUpdateClient ? (v) => handleEditModeChange("operational", v) : undefined}
                        >
                          <div className="cd-grid">
                            <Field label="Account Status" icon={CheckCircle2}>
                              <EditableSelect
                                value={client.status}
                                field="status"
                                onUpdate={handleUpdateField}
                                options={[
                                  { value: "Active", label: "Active" },
                                  { value: "Inactive", label: "Inactive" },
                                  { value: "Prospect", label: "Prospect" },
                                ]}
                                renderTag={(val) => {
                                  const ok = val === "Active";
                                  return (
                                    <span className={`cd-pill status ${ok ? "active" : "inactive"}`}>
                                      <span className="cd-pill-dot" />
                                      {(val || "—").toUpperCase()}
                                    </span>
                                  );
                                }}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.operational}
                              />
                            </Field>
                            <Field label="Risk Exposure" icon={AlertCircle}>
                              <EditableSelect
                                value={client.riskLevel}
                                field="riskLevel"
                                onUpdate={handleUpdateField}
                                options={[
                                  { value: "High", label: "High" },
                                  { value: "Medium", label: "Medium" },
                                  { value: "Low", label: "Low" },
                                ]}
                                renderTag={(val) => {
                                  const cfg = riskMap[(val || "Low") as keyof typeof riskMap] || riskMap.Low;
                                  return (
                                    <span
                                      className="cd-pill risk"
                                      style={{ background: cfg.bg, color: cfg.color }}
                                    >
                                      <CircleDot size={10} fill={cfg.color} stroke={cfg.color} />
                                      {(val || "Low").toUpperCase()}
                                    </span>
                                  );
                                }}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.operational}
                              />
                            </Field>
                            <Field label="Client Segment" icon={Layers}>
                              <EditableText
                                value={client.clientSegment}
                                field="clientSegment"
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.operational}
                              />
                            </Field>
                            <Field label="Client Code" icon={Hash}>
                              <span className="cd-code-chip">{client.clientCode}</span>
                            </Field>
                            <Field label="Billing Contact" icon={Mail}>
                              <EditableText
                                value={client.billingContactEmail}
                                field="billingContactEmail"
                                placeholder="No billing email"
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.operational}
                              />
                            </Field>
                            <Field label="Billing Address" icon={MapPin}>
                              <EditableTextArea
                                value={client.billingAddress}
                                field="billingAddress"
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.operational}
                              />
                            </Field>
                          </div>
                        </SectionCard>

                        <SectionCard
                          title="Compliance & Finance"
                          description="Tax, credit, and payment configuration"
                          icon={ShieldCheck}
                          accent="#10b981"
                          editOn={editModes.finance}
                          onToggleEdit={canUpdateClient ? (v) => handleEditModeChange("finance", v) : undefined}
                        >
                          <div className="cd-grid">
                            <Field label={getGstLabel()} icon={FileText}>
                              <EditableText
                                value={client.gstVatTaxId}
                                field="gstVatTaxId"
                                mono
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.finance}
                              />
                            </Field>
                            <Field label={getPanLabel()} icon={FileText}>
                              <EditableText
                                value={client.pan}
                                field="pan"
                                mono
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.finance}
                              />
                            </Field>
                            <Field label="DUNS Number" icon={Hash}>
                              <EditableText
                                value={client.dunsNumber}
                                field="dunsNumber"
                                mono
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.finance}
                              />
                            </Field>
                            <Field label="Credit Limit" icon={DollarSign}>
                              <EditableText
                                value={
                                  client.creditLimit
                                    ? `$${Number(client.creditLimit).toLocaleString()}`
                                    : ""
                                }
                                field="creditLimit"
                                onUpdate={(f, v) => handleUpdateField(f, v.replace(/[^0-9.]/g, ""))}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.finance}
                              />
                            </Field>
                            <Field label="Payment Terms" icon={Calendar}>
                              <EditableSelect
                                value={client.paymentTerms}
                                field="paymentTerms"
                                onUpdate={handleUpdateField}
                                options={[
                                  { value: "Net 15", label: "Net 15" },
                                  { value: "Net 30", label: "Net 30" },
                                  { value: "Net 60", label: "Net 60" },
                                  { value: "Due on Receipt", label: "Due on Receipt" },
                                ]}
                                renderTag={(val) =>
                                  val ? <span className="cd-mini-tag">{val}</span> : <span className="muted">—</span>
                                }
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.finance}
                              />
                            </Field>
                            <Field label="Default Currency" icon={Wallet}>
                              <span className="cd-currency-tag">{client.defaultCurrency || "USD"}</span>
                            </Field>
                          </div>
                        </SectionCard>

                        <SectionCard
                          title="Banking Information"
                          description="Wire and transfer details for settlements"
                          icon={Landmark}
                          accent="#8b5cf6"
                          editOn={editModes.banking}
                          onToggleEdit={canUpdateClient ? (v) => handleEditModeChange("banking", v) : undefined}
                        >
                          <div className="cd-grid">
                            <Field label="Bank Name" icon={Landmark}>
                              <EditableText
                                value={client.bankName}
                                field="bankName"
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.banking}
                              />
                            </Field>
                            <Field label="Account Number" icon={Banknote}>
                              <EditableText
                                value={client.bankAccountNumber}
                                field="bankAccountNumber"
                                mono
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.banking}
                              />
                            </Field>
                            <Field label="IFSC / SWIFT" icon={Hash}>
                              <EditableText
                                value={client.ifscSwift}
                                field="ifscSwift"
                                mono
                                onUpdate={handleUpdateField}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.banking}
                              />
                            </Field>
                            <Field label="Preferred Mode" icon={Wallet}>
                              <EditableSelect
                                value={client.preferredPaymentMode}
                                field="preferredPaymentMode"
                                onUpdate={handleUpdateField}
                                options={[
                                  { value: "Wire Transfer", label: "Wire Transfer" },
                                  { value: "ACH", label: "ACH" },
                                  { value: "Credit Card", label: "Credit Card" },
                                  { value: "Cheque", label: "Cheque" },
                                ]}
                                renderTag={(val) =>
                                  val ? (
                                    <span className="cd-mini-tag accent">{val}</span>
                                  ) : (
                                    <span className="muted">—</span>
                                  )
                                }
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.banking}
                              />
                            </Field>
                          </div>
                        </SectionCard>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span className="cd-tab-label">
                      <Users size={15} />
                      <span>Contacts</span>
                      {totalContacts > 0 && <span className="cd-tab-count">{totalContacts}</span>}
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <ContactsTab
                        clientId={params.id as string}
                        contacts={client.contacts || []}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
                /* {
                  key: "3",
                  label: (
                    <span className="cd-tab-label">
                      <Briefcase size={15} />
                      <span>Allocations</span>
                      {totalAllocations > 0 && <span className="cd-tab-count">{totalAllocations}</span>}
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <AllocationsTab
                        clientId={params.id as string}
                        allocations={client.allocations || []}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                }, */
                {
                  key: "4",
                  label: (
                    <span className="cd-tab-label">
                      <FolderKanban size={15} />
                      <span>Projects</span>
                      {totalProjects > 0 && <span className="cd-tab-count">{totalProjects}</span>}
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <ProjectsTab clientId={params.id as string} onRefresh={fetchClientDetails} />
                    </div>
                  ),
                },
                {
                  key: "invoices",
                  label: (
                    <span className="cd-tab-label">
                      <Receipt size={15} />
                      <span>Invoices</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <InvoicesTab clientId={params.id as string} onRefresh={fetchClientDetails} />
                    </div>
                  ),
                },
                {
                  key: "5",
                  label: (
                    <span className="cd-tab-label">
                      <FileText size={15} />
                      <span>Documents</span>
                      {totalDocuments > 0 && <span className="cd-tab-count">{totalDocuments}</span>}
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <DocumentsTab
                        clientId={params.id as string}
                        documents={client.documents || []}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
                {
                  key: "6",
                  label: (
                    <span className="cd-tab-label">
                      <KeyRound size={15} />
                      <span>Portal Access</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <PortalAccessTab
                        clientId={params.id as string}
                        contacts={client.contacts || []}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
                {
                  key: "7",
                  label: (
                    <span className="cd-tab-label">
                      <Calendar size={15} />
                      <span>Meetings</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <MeetingsTab
                        clientId={params.id as string}
                        projects={(client.projects || []).map((p: any) => ({
                          id: p.id || p.projectId,
                          name: p.name || p.projectName,
                          code: p.code || null,
                        }))}
                        contacts={client.contacts || []}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
                {
                  key: "8",
                  label: (
                    <span className="cd-tab-label">
                      <GitPullRequest size={15} />
                      <span>Change Requests</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <ChangeRequestsTab
                        clientId={params.id as string}
                        projects={(client.projects || []).map((p: any) => ({
                          id: p.id || p.projectId,
                          name: p.name || p.projectName,
                          code: p.code || null,
                        }))}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
                {
                  key: "9",
                  label: (
                    <span className="cd-tab-label">
                      <CheckSquare size={15} />
                      <span>Approvals</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <ApprovalsTab
                        clientId={params.id as string}
                        projects={(client.projects || []).map((p: any) => ({
                          id: p.id || p.projectId,
                          name: p.name || p.projectName,
                          code: p.code || null,
                        }))}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
                {
                  key: "10",
                  label: (
                    <span className="cd-tab-label">
                      <Server size={15} />
                      <span>Environments</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <EnvironmentsTab
                        clientId={params.id as string}
                        projects={(client.projects || []).map((p: any) => ({
                          id: p.id || p.projectId,
                          name: p.name || p.projectName,
                          code: p.code || null,
                        }))}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
                {
                  key: "11",
                  label: (
                    <span className="cd-tab-label">
                      <Users size={15} />
                      <span>Team</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <TeamTab
                        clientId={params.id as string}
                        projects={(client.projects || []).map((p: any) => ({
                          id: p.id || p.projectId,
                          name: p.name || p.projectName,
                          code: p.code || null,
                        }))}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
                {
                  key: "12",
                  label: (
                    <span className="cd-tab-label">
                      <LifeBuoy size={15} />
                      <span>Support Tickets</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <SupportTicketsTab
                        clientId={params.id as string}
                        projects={(client.projects || []).map((p: any) => ({
                          id: p.id || p.projectId,
                          name: p.name || p.projectName,
                          code: p.code || null,
                        }))}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
                {
                  key: "13",
                  label: (
                    <span className="cd-tab-label">
                      <Flag size={15} />
                      <span>Milestones</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <MilestonesTab
                        clientId={params.id as string}
                        projects={(client.projects || []).map((p: any) => ({
                          id: p.id || p.projectId,
                          name: p.name || p.projectName,
                          code: p.code || null,
                        }))}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
                {
                  key: "14",
                  label: (
                    <span className="cd-tab-label">
                      <Rocket size={15} />
                      <span>Releases</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <ReleasesTab
                        clientId={params.id as string}
                        projects={(client.projects || []).map((p: any) => ({
                          id: p.id || p.projectId,
                          name: p.name || p.projectName,
                          code: p.code || null,
                        }))}
                        onRefresh={fetchClientDetails}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* ---------------- Styles ---------------- */}
          <style jsx global>{`
            .cd-page {
              margin: 0 -8px;
              background: var(--bg-primary);
              min-height: calc(100vh - 64px);
              padding: 0;
              display: flex;
              flex-direction: column;
            }

            /* ---------- Command bar ---------- */
            .cd-cmdbar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 10.3px 32px;
              position: sticky;
              top: 0;
              z-index: 100;
              background: var(--bg-primary);
              border-bottom: 1px solid var(--border-slate-200);
            }
            .cd-crumbs {
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 0;
              flex: 1;
            }
            .cd-back {
              width: 34px;
              height: 34px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 10px;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-200);
              color: var(--text-slate-700);
              cursor: pointer;
              transition: all 0.18s ease;
              padding: 0;
              flex-shrink: 0;
            }
            .cd-back:hover {
              border-color: #8b5cf6;
              color: #8b5cf6;
              background: var(--bg-pure-white);
              transform: translateX(-1px);
            }
            .cd-crumb-link {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 6px 10px;
              border-radius: 8px;
              background: transparent;
              border: 0;
              color: var(--text-slate-500);
              font-size: 12.5px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.15s ease;
            }
            .cd-crumb-link:hover {
              color: #8b5cf6;
              background: rgba(139, 92, 246, 0.08);
            }
            .cd-crumb-sep {
              color: var(--text-slate-400);
              flex-shrink: 0;
            }
            .cd-crumb-current {
              font-size: 12.5px;
              font-weight: 700;
              color: var(--text-slate-900);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 320px;
            }
            .cd-cmdbar-actions {
              display: flex;
              gap: 8px;
              flex-shrink: 0;
            }
            .cd-secondary-btn {
              height: 36px !important;
              border-radius: 10px !important;
              border: 1px solid var(--border-slate-200) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
              font-weight: 600 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
              padding: 0 14px !important;
              transition: all 0.18s ease !important;
            }
            .cd-secondary-btn:hover {
              border-color: #8b5cf6 !important;
              color: #8b5cf6 !important;
              transform: translateY(-1px);
            }
            .cd-primary-btn {
              border-radius: 8px !important;
              background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%) !important;
              border: 0 !important;
              font-weight: 600 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 5px !important;
            }

            /* ---------- Hero ---------- */
            .cd-hero {
              position: relative;
              overflow: hidden;
              margin: 0 0 20px 0;
              padding: 28px 26px;
              border-radius: 18px;
              background:
                radial-gradient(900px 200px at -10% 0%, rgba(139, 92, 246, 0.42), transparent 60%),
                radial-gradient(800px 200px at 110% 100%, rgba(99, 102, 241, 0.38), transparent 60%),
                linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
              color: #fff;
              box-shadow: 0 14px 32px -18px rgba(76, 29, 149, 0.45);
            }
            [data-theme="dark"] .cd-hero {
              background:
                radial-gradient(1100px 240px at -10% 0%, rgba(139, 92, 246, 0.22), transparent 60%),
                radial-gradient(900px 240px at 110% 100%, rgba(59, 130, 246, 0.22), transparent 60%),
                linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              box-shadow: 0 18px 40px -22px rgba(15, 23, 42, 0.5);
            }
            .cd-hero-mesh {
              position: absolute;
              inset: 0;
              background-image:
                linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
              background-size: 32px 32px;
              mask-image: radial-gradient(ellipse 90% 70% at 50% 30%, #000 30%, transparent 80%);
              pointer-events: none;
            }
            .cd-hero-blob {
              position: absolute;
              top: -120px;
              right: -120px;
              width: 320px;
              height: 320px;
              border-radius: 50%;
              filter: blur(80px);
              opacity: 0.22;
              pointer-events: none;
            }
            .cd-hero-main {
              position: relative;
              display: flex;
              align-items: center;
              gap: 18px;
              z-index: 1;
            }
            .cd-hero-avatar {
              position: relative;
              width: 64px;
              height: 64px;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: 800;
              font-size: 22px;
              letter-spacing: 0.02em;
              box-shadow:
                0 10px 24px -10px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
              flex-shrink: 0;
            }
            .cd-hero-avatar-status {
              position: absolute;
              bottom: 3px;
              right: 3px;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: #94a3b8;
              border: 2.5px solid #4c1d95;
            }
            [data-theme="dark"] .cd-hero-avatar-status {
              border-color: #0f172a;
            }
            .cd-hero-avatar-status.active {
              background: #10b981;
              animation: cd-pulse-dot 2s infinite;
            }
            @keyframes cd-pulse-dot {
              0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
              50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            }
            .cd-hero-info {
              min-width: 0;
              flex: 1;
            }
            .cd-hero-title {
              color: #fff;
              font-size: 26px;
              font-weight: 800;
              margin: 0 0 10px 0;
              letter-spacing: -0.025em;
              line-height: 1.2;
              word-break: break-word;
            }
            .cd-hero-meta {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              flex-wrap: wrap;
              color: rgba(237, 233, 254, 0.82);
              font-size: 12px;
              font-weight: 500;
            }
            .cd-hero-meta-left {
              display: flex;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              flex: 1 1 auto;
              min-width: 0;
            }
            .cd-hero-pills {
              display: flex;
              align-items: center;
              gap: 6px;
              flex-shrink: 0;
              flex-wrap: wrap;
              justify-content: flex-end;
              margin-left: auto;
            }
            .cd-meta-item {
              display: inline-flex;
              align-items: center;
              gap: 5px;
            }
            .cd-meta-link {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              color: rgba(237, 233, 254, 0.88);
              transition: color 0.15s ease;
            }
            .cd-meta-link:hover {
              color: #fff;
              text-decoration: underline;
            }
            .cd-meta-code {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 2px 8px;
              border-radius: 6px;
              background: rgba(255, 255, 255, 0.14);
              border: 1px solid rgba(255, 255, 255, 0.2);
              color: rgba(255, 255, 255, 0.95);
              font-family: ui-monospace, "SF Mono", Menlo, monospace;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.18s ease;
            }
            .cd-meta-code:hover {
              background: rgba(255, 255, 255, 0.22);
              border-color: rgba(255, 255, 255, 0.32);
            }

            /* Hero KPI strip */
            .cd-hero-kpis {
              position: relative;
              z-index: 1;
              display: flex;
              align-items: stretch;
              padding: 10px 4px;
              border-top: 1px solid rgba(255, 255, 255, 0.14);
              gap: 0;
            }
            .cd-kpi {
              flex: 1;
              padding: 0 16px;
              min-width: 0;
            }
            .cd-kpi:first-child { padding-left: 0; }
            .cd-kpi:last-child { padding-right: 0; }
            .cd-kpi-label {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              color: rgba(237, 233, 254, 0.7);
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              margin-bottom: 2px;
            }
            .cd-kpi-value {
              color: #fff;
              font-size: 16px;
              font-weight: 700;
              letter-spacing: -0.015em;
              font-variant-numeric: tabular-nums;
              line-height: 1.1;
              display: flex;
              align-items: baseline;
              gap: 5px;
            }
            .cd-kpi-suffix {
              font-size: 10.5px;
              color: rgba(237, 233, 254, 0.6);
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .cd-kpi-sep {
              width: 1px;
              background: linear-gradient(
                180deg,
                transparent 0%,
                rgba(255, 255, 255, 0.18) 50%,
                transparent 100%
              );
              flex-shrink: 0;
              margin: 4px 0;
            }
            [data-theme="dark"] .cd-hero-kpis {
              border-top-color: rgba(255, 255, 255, 0.08);
            }
            [data-theme="dark"] .cd-kpi-label {
              color: rgba(203, 213, 225, 0.7);
            }
            [data-theme="dark"] .cd-kpi-suffix {
              color: rgba(203, 213, 225, 0.6);
            }
            [data-theme="dark"] .cd-kpi-sep {
              background: linear-gradient(
                180deg,
                transparent 0%,
                rgba(255, 255, 255, 0.12) 50%,
                transparent 100%
              );
            }

            /* ---------- Pills ---------- */
            .cd-pill {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 4px 10px;
              border-radius: 999px;
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.06em;
            }
            .cd-pill.status .cd-pill-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
            }
            .cd-pill.status.active {
              background: rgba(16, 185, 129, 0.18);
              color: #6ee7b7;
              border: 1px solid rgba(16, 185, 129, 0.3);
            }
            .cd-pill.status.active .cd-pill-dot {
              background: #34d399;
              box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
              animation: cd-pulse-dot2 2s infinite;
            }
            @keyframes cd-pulse-dot2 {
              0%, 100% { box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2); }
              50% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
            }
            .cd-pill.status.inactive {
              background: rgba(148, 163, 184, 0.18);
              color: #cbd5e1;
              border: 1px solid rgba(148, 163, 184, 0.3);
            }
            .cd-pill.status.inactive .cd-pill-dot {
              background: #94a3b8;
            }
            .cd-pill.risk {
              border: 1px solid rgba(255, 255, 255, 0.04);
            }
            .cd-pill.type {
              background: rgba(139, 92, 246, 0.2);
              color: #c4b5fd;
              border: 1px solid rgba(139, 92, 246, 0.3);
              text-transform: none;
              letter-spacing: 0.02em;
              font-size: 11px;
            }

            /* In light context (section cards), reuse pill styles with adjusted colors */
            .cd-section .cd-pill.status.active {
              background: rgba(16, 185, 129, 0.12);
              color: #047857;
              border: 0;
            }
            .cd-section .cd-pill.status.inactive {
              background: var(--bg-slate-50);
              color: var(--text-slate-500);
              border: 1px solid var(--border-slate-100);
            }

            /* ---------- Body & Side-nav Tabs ---------- */
            .cd-body {
              padding: 0;
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            .cd-tabs.ant-tabs {
              align-items: stretch;
              position: relative;
              flex: 1;
            }
            .cd-tabs.ant-tabs::before {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 220px;
              background: var(--bg-slate-50);
              border-right: 1px solid var(--border-slate-200);
              z-index: 1;
            }
            [data-theme="dark"] .cd-tabs.ant-tabs::before {
              background: var(--bg-secondary);
            }
            .cd-tabs.ant-tabs > .ant-tabs-nav {
              position: sticky !important;
              top: 61px;
              align-self: flex-start;
              width: 220px;
              flex-shrink: 0;
              margin: 0 !important;
              padding: 20px 14px !important;
              background: transparent;
              border-right: none !important;
              border-radius: 0;
              max-height: calc(100vh - 64px);
              overflow-y: auto;
              z-index: 2;
            }
            [data-theme="dark"] .cd-tabs.ant-tabs > .ant-tabs-nav {
              background: transparent;
            }
            .cd-tabs .ant-tabs-nav::before {
              display: none !important;
            }
            .cd-tabs .ant-tabs-nav .ant-tabs-nav-wrap {
              width: 100%;
            }
            .cd-tabs .ant-tabs-nav .ant-tabs-nav-list {
              width: 100%;
              gap: 2px;
            }
            .cd-tabs .ant-tabs-tab {
              width: 100%;
              padding: 10px 14px !important;
              margin: 0 !important;
              border-radius: 10px;
              transition: background 0.15s ease, color 0.15s ease !important;
            }
            .cd-tabs .ant-tabs-tab + .ant-tabs-tab {
              margin-top: 2px !important;
            }
            .cd-tabs .ant-tabs-tab .ant-tabs-tab-btn {
              width: 100%;
              text-align: left;
            }
            .cd-tabs .ant-tabs-tab .cd-tab-label {
              display: flex;
              align-items: center;
              gap: 12px;
              color: var(--text-slate-500);
              font-size: 13.5px;
              font-weight: 600;
              transition: color 0.15s ease;
              width: 100%;
            }
            .cd-tabs .ant-tabs-tab .cd-tab-label > span:not(.cd-tab-count) {
              flex: 1;
              min-width: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .cd-tabs .ant-tabs-tab:hover {
              background: var(--bg-slate-50);
            }
            .cd-tabs .ant-tabs-tab:hover .cd-tab-label {
              color: #8b5cf6;
            }
            .cd-tabs .ant-tabs-tab-active {
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(99, 102, 241, 0.10));
            }
            .cd-tabs .ant-tabs-tab-active:hover {
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.16), rgba(99, 102, 241, 0.14));
            }
            .cd-tabs .ant-tabs-tab-active .cd-tab-label {
              color: #8b5cf6;
            }
            .cd-tabs .ant-tabs-ink-bar {
              width: 3px !important;
              background: linear-gradient(180deg, #8b5cf6, #6366f1) !important;
              border-radius: 3px !important;
              left: 0 !important;
              right: auto !important;
            }
            .cd-tabs .ant-tabs-content-holder {
              flex: 1;
              min-width: 0;
              border-left: none !important;
              padding: 0 32px !important;
            }
            .cd-tabs .ant-tabs-content,
            .cd-tabs .ant-tabs-tabpane {
              margin: 0 !important;
              padding: 0 !important;
            }
            .cd-tab-count {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 20px;
              height: 18px;
              padding: 0 6px;
              border-radius: 999px;
              background: var(--bg-slate-50);
              color: var(--text-slate-600);
              font-size: 10.5px;
              font-weight: 700;
              border: 1px solid var(--border-slate-200);
              margin-left: auto;
            }
            .cd-tabs .ant-tabs-tab-active .cd-tab-count {
              background: linear-gradient(135deg, #8b5cf6, #6366f1);
              color: #fff;
              border-color: transparent;
            }
            .cd-tab-pane {
              animation: cd-fade-in 0.3s ease;
              padding: 8px 0 48px 0;
            }
            @media (max-width: 900px) {
              .cd-tabs.ant-tabs > .ant-tabs-nav {
                width: 180px;
                padding: 20px 10px !important;
              }
              .cd-tabs.ant-tabs::before {
                width: 180px;
              }
              .cd-tabs .ant-tabs-content-holder {
                padding: 0 20px !important;
              }
            }
            @media (max-width: 720px) {
              .cd-tabs.ant-tabs {
                flex-direction: column;
              }
              .cd-tabs.ant-tabs::before {
                display: none;
              }
              .cd-tabs.ant-tabs > .ant-tabs-nav {
                position: static !important;
                width: 100%;
                margin: 0 !important;
                padding: 8px 16px !important;
                max-height: none;
                border-right: none;
                border-bottom: 1px solid var(--border-slate-200);
              }
              .cd-tabs .ant-tabs-content-holder {
                padding: 0 16px !important;
              }
            }
            @keyframes cd-fade-in {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }

            /* ---------- Stat cards ---------- */
            .cd-stat-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 16px;
              margin-bottom: 24px;
            }
            @media (max-width: 1300px) {
              .cd-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 600px) {
              .cd-stat-grid { grid-template-columns: 1fr; }
            }
            .cd-stat-card {
              position: relative;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 14px;
              padding: 14px 18px 12px;
              overflow: hidden;
              transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
            }
            .cd-stat-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 14px 30px -16px rgba(15, 23, 42, 0.18);
              border-color: var(--border-slate-200);
            }
            .cd-stat-glow {
              position: absolute;
              top: -40px;
              right: -40px;
              width: 140px;
              height: 140px;
              border-radius: 50%;
              filter: blur(40px);
              opacity: 0.12;
              pointer-events: none;
            }
            .cd-stat-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .cd-stat-icon {
              width: 32px;
              height: 32px;
              border-radius: 9px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .cd-trend {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 3px 8px;
              border-radius: 999px;
              font-size: 11px;
              font-weight: 700;
            }
            .cd-trend.up { background: rgba(16, 185, 129, 0.1); color: #059669; }
            .cd-trend.down { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
            .cd-stat-label {
              display: block;
              font-size: 12px;
              font-weight: 600;
              color: var(--text-slate-500);
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .cd-stat-value {
              font-size: 22px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.02em;
              margin-top: 2px;
              line-height: 1.1;
              font-variant-numeric: tabular-nums;
            }
            .cd-stat-subtle {
              display: block;
              font-size: 11.5px;
              color: var(--text-slate-500);
              margin-top: 4px;
              font-weight: 500;
            }

            /* ---------- Section grid ---------- */
            .cd-section-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
            }
            @media (max-width: 1200px) {
              .cd-section-grid { grid-template-columns: 1fr; }
            }
            .cd-section {
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
              transition: box-shadow 0.2s ease, border-color 0.2s ease;
            }
            .cd-section:hover {
              box-shadow: 0 12px 28px -18px rgba(15, 23, 42, 0.16);
            }
            .cd-section-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 16px 20px;
              border-bottom: 1px solid var(--border-slate-100);
              background: linear-gradient(180deg, var(--bg-pure-white) 0%, var(--bg-slate-50) 100%);
            }
            .cd-section-titlewrap {
              display: flex;
              align-items: center;
              gap: 12px;
              min-width: 0;
            }
            .cd-section-icon {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .cd-section-title {
              font-size: 14.5px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.01em;
              line-height: 1.2;
            }
            .cd-section-desc {
              font-size: 12px;
              color: var(--text-slate-500);
              font-weight: 500;
              margin-top: 2px;
            }
            .cd-edit-toggle {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 5px 10px 5px 10px;
              border-radius: 999px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              color: var(--text-slate-500);
              font-size: 11.5px;
              font-weight: 600;
              transition: all 0.18s ease;
            }
            .cd-edit-toggle.on {
              background: rgba(139, 92, 246, 0.1);
              border-color: rgba(139, 92, 246, 0.3);
              color: #7c3aed;
            }
            .cd-edit-toggle .cd-switch.ant-switch-checked {
              background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
            }
            .cd-section-body {
              padding: 18px 20px 20px;
            }

            /* ---------- Field grid ---------- */
            .cd-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 18px 24px;
            }
            @media (max-width: 600px) {
              .cd-grid { grid-template-columns: 1fr; }
            }
            .cd-field { min-width: 0; }
            .cd-field-label {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              font-size: 10.5px;
              font-weight: 700;
              color: var(--text-slate-500);
              text-transform: uppercase;
              letter-spacing: 0.06em;
              margin-bottom: 6px;
            }
            .cd-field-label svg {
              opacity: 0.75;
            }
            .cd-field-content {
              font-size: 13.5px;
              color: var(--text-slate-900);
              font-weight: 500;
              min-height: 22px;
            }
            .cd-field-value {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 8px 4px 0;
              border-radius: 6px;
              line-height: 1.3;
              transition: all 0.15s ease;
              max-width: 100%;
            }
            .cd-field-value.editable {
              cursor: pointer;
              padding: 4px 8px;
              margin-left: -8px;
            }
            .cd-field-value.editable:hover {
              background: rgba(139, 92, 246, 0.08);
            }
            .cd-field-value.editable:hover .cd-pencil {
              opacity: 1;
            }
            .cd-field-value.mono {
              font-family: ui-monospace, "SF Mono", Menlo, monospace;
              font-size: 12.5px;
              letter-spacing: 0.01em;
            }
            .cd-field-value.multiline {
              align-items: flex-start;
              white-space: pre-wrap;
            }
            .cd-field-value .muted {
              color: var(--text-slate-400);
              font-style: italic;
              font-weight: 400;
            }
            .cd-pencil {
              opacity: 0;
              color: #8b5cf6;
              flex-shrink: 0;
              transition: opacity 0.15s ease;
            }

            /* Inline edit row */
            .cd-edit-row {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              max-width: 100%;
            }
            .cd-edit-input.ant-input {
              border-radius: 7px !important;
              font-size: 13px !important;
              border-color: rgba(139, 92, 246, 0.4) !important;
              box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
              min-width: 140px !important;
            }
            .cd-edit-btn {
              width: 26px;
              height: 26px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border: 0;
              border-radius: 7px;
              cursor: pointer;
              transition: all 0.15s ease;
              padding: 0;
              flex-shrink: 0;
            }
            .cd-edit-btn.save {
              background: linear-gradient(135deg, #10b981, #059669);
              color: #fff;
              box-shadow: 0 3px 8px -3px rgba(16, 185, 129, 0.5);
            }
            .cd-edit-btn.save:hover { filter: brightness(1.06); transform: translateY(-1px); }
            .cd-edit-btn.cancel {
              background: var(--bg-slate-50);
              color: var(--text-slate-500);
              border: 1px solid var(--border-slate-100);
            }
            .cd-edit-btn.cancel:hover {
              background: rgba(239, 68, 68, 0.08);
              color: #dc2626;
              border-color: rgba(239, 68, 68, 0.3);
            }

            /* Mini tags & code chip */
            .cd-mini-tag {
              display: inline-flex;
              align-items: center;
              padding: 2px 9px;
              border-radius: 6px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              color: var(--text-slate-700);
              font-size: 11.5px;
              font-weight: 600;
            }
            .cd-mini-tag.accent {
              background: rgba(139, 92, 246, 0.1);
              border-color: rgba(139, 92, 246, 0.2);
              color: #7c3aed;
            }
            .cd-code-chip {
              display: inline-flex;
              align-items: center;
              padding: 2px 8px;
              border-radius: 6px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              font-family: ui-monospace, "SF Mono", Menlo, monospace;
              font-size: 12px;
              color: var(--text-slate-700);
              font-weight: 600;
              letter-spacing: 0.02em;
            }
            .cd-currency-tag {
              display: inline-flex;
              align-items: center;
              padding: 2px 9px;
              border-radius: 6px;
              background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1));
              border: 1px solid rgba(6, 182, 212, 0.2);
              color: #0e7490;
              font-size: 11.5px;
              font-weight: 700;
              letter-spacing: 0.04em;
            }
            .cd-website-row {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              max-width: 100%;
            }
            .cd-website-go {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 22px;
              height: 22px;
              border-radius: 6px;
              color: var(--text-slate-400);
              transition: all 0.15s ease;
              flex-shrink: 0;
            }
            .cd-website-go:hover {
              background: rgba(139, 92, 246, 0.1);
              color: #8b5cf6;
            }

            /* ---------- Dark theme adjustments ---------- */
            [data-theme="dark"] .cd-back,
            [data-theme="dark"] .cd-secondary-btn {
              background: var(--bg-secondary) !important;
            }
            [data-theme="dark"] .cd-stat-card,
            [data-theme="dark"] .cd-section {
              background: var(--bg-secondary);
              border-color: var(--border-slate-100);
            }
            [data-theme="dark"] .cd-section-header {
              background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
            }
            [data-theme="dark"] .cd-edit-toggle {
              background: var(--bg-primary);
            }
            [data-theme="dark"] .cd-mini-tag,
            [data-theme="dark"] .cd-code-chip,
            [data-theme="dark"] .cd-tab-count {
              background: var(--bg-primary);
            }
            [data-theme="dark"] .cd-field-value.editable:hover {
              background: rgba(139, 92, 246, 0.16);
            }

            /* ===================================================== */
            /*  Premium Modal (.pmodal) — used by Add/Create dialogs  */
            /* ===================================================== */
            .pmodal .ant-modal-content {
              padding: 0 !important;
              border-radius: 18px !important;
              overflow: hidden;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              box-shadow: 0 30px 80px -20px rgba(15, 23, 42, 0.4);
            }
            .pmodal .ant-modal-close {
              top: 16px !important;
              right: 16px !important;
              width: 32px !important;
              height: 32px !important;
              border-radius: 10px !important;
              background: rgba(255, 255, 255, 0.12) !important;
              color: rgba(255, 255, 255, 0.85) !important;
              backdrop-filter: blur(8px);
              transition: all 0.18s ease;
              z-index: 10;
            }
            .pmodal .ant-modal-close:hover {
              background: rgba(255, 255, 255, 0.22) !important;
              color: #fff !important;
            }
            .pmodal-hero {
              position: relative;
              padding: 22px 24px;
              overflow: hidden;
              background:
                radial-gradient(800px 220px at -10% 0%, rgba(139, 92, 246, 0.32), transparent 60%),
                radial-gradient(600px 220px at 110% 100%, rgba(59, 130, 246, 0.32), transparent 60%),
                linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              color: #fff;
            }
            .pmodal-hero-mesh {
              position: absolute;
              inset: 0;
              background-image:
                linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
              background-size: 24px 24px;
              mask-image: radial-gradient(ellipse 90% 70% at 50% 30%, #000 30%, transparent 80%);
              pointer-events: none;
            }
            .pmodal-hero-blob {
              position: absolute;
              top: -90px;
              right: -90px;
              width: 260px;
              height: 260px;
              border-radius: 50%;
              background: linear-gradient(135deg, #8b5cf6, #6366f1);
              filter: blur(70px);
              opacity: 0.45;
              pointer-events: none;
            }
            .pmodal-hero.green .pmodal-hero-blob {
              background: linear-gradient(135deg, #10b981, #14b8a6);
            }
            .pmodal-hero.amber .pmodal-hero-blob {
              background: linear-gradient(135deg, #f59e0b, #f97316);
            }
            .pmodal-hero.blue .pmodal-hero-blob {
              background: linear-gradient(135deg, #3b82f6, #06b6d4);
            }
            .pmodal-hero-content {
              position: relative;
              z-index: 1;
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .pmodal-hero-icon {
              width: 44px;
              height: 44px;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.14);
              border: 1px solid rgba(255, 255, 255, 0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.18),
                0 6px 16px -8px rgba(0, 0, 0, 0.5);
              flex-shrink: 0;
            }
            .pmodal-hero-title {
              font-size: 17px;
              font-weight: 700;
              letter-spacing: -0.015em;
              color: #fff;
              line-height: 1.2;
            }
            .pmodal-hero-sub {
              font-size: 12.5px;
              color: rgba(226, 232, 240, 0.78);
              margin-top: 3px;
              font-weight: 500;
            }
            .pmodal-body {
              padding: 22px 24px 6px;
              background: var(--bg-pure-white);
              max-height: 65vh;
              overflow-y: auto;
            }
            .pmodal-body .ant-form-item-label {
              padding-bottom: 4px !important;
            }
            .pmodal-body .ant-form-item-label > label {
              font-size: 11px !important;
              font-weight: 700 !important;
              color: var(--text-slate-500) !important;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              height: auto !important;
            }
            .pmodal-body .ant-form-item-label > label::before {
              color: #ef4444 !important;
            }
            .pmodal-body .ant-input,
            .pmodal-body .ant-input-affix-wrapper,
            .pmodal-body .ant-select-selector,
            .pmodal-body .ant-picker,
            .pmodal-body .ant-input-number,
            .pmodal-body .ant-input-number-input,
            .pmodal-body .ant-input-number-affix-wrapper {
              border-radius: 10px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-slate-50) !important;
              transition: all 0.18s ease !important;
              min-height: 42px !important;
            }
            .pmodal-body .ant-input,
            .pmodal-body .ant-input-number-input {
              background: transparent !important;
              border: 0 !important;
            }
            .pmodal-body .ant-select-selector {
              display: flex !important;
              align-items: center !important;
            }
            .pmodal-body .ant-input-affix-wrapper:hover,
            .pmodal-body .ant-input-affix-wrapper-focused,
            .pmodal-body .ant-input:hover,
            .pmodal-body .ant-select:hover .ant-select-selector,
            .pmodal-body .ant-picker:hover,
            .pmodal-body .ant-input-number:hover {
              border-color: rgba(139, 92, 246, 0.45) !important;
            }
            .pmodal-body .ant-input-affix-wrapper-focused,
            .pmodal-body .ant-select-focused .ant-select-selector,
            .pmodal-body .ant-picker-focused,
            .pmodal-body .ant-input-number-focused {
              border-color: #8b5cf6 !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
            }
            .pmodal-section-label {
              display: flex;
              align-items: center;
              gap: 8px;
              margin: 4px 0 12px 0;
              font-size: 10.5px;
              font-weight: 700;
              color: var(--text-slate-500);
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            .pmodal-section-label::after {
              content: "";
              flex: 1;
              height: 1px;
              background: linear-gradient(
                90deg,
                var(--border-slate-100) 0%,
                transparent 100%
              );
            }
            .pmodal-section-label svg {
              color: #8b5cf6;
              flex-shrink: 0;
            }
            .pmodal-footer {
              display: flex;
              justify-content: flex-end;
              align-items: center;
              gap: 10px;
              padding: 14px 24px 18px;
              border-top: 1px solid var(--border-slate-100);
              background: var(--bg-slate-50);
            }
            .pmodal-footer-hint {
              margin-right: auto;
              font-size: 11.5px;
              color: var(--text-slate-500);
              font-weight: 500;
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            .pmodal-btn-cancel {
              height: 40px !important;
              border-radius: 10px !important;
              font-weight: 600 !important;
              padding: 0 18px !important;
              background: var(--bg-pure-white) !important;
              border: 1px solid var(--border-slate-100) !important;
              color: var(--text-slate-700) !important;
              transition: all 0.18s ease !important;
            }
            .pmodal-btn-cancel:hover {
              border-color: var(--border-slate-200) !important;
              color: var(--text-slate-900) !important;
            }
            .pmodal-btn-primary {
              height: 40px !important;
              border-radius: 10px !important;
              padding: 0 22px !important;
              font-weight: 700 !important;
              background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%) !important;
              border: 0 !important;
              box-shadow: 0 8px 18px -8px rgba(139, 92, 246, 0.6) !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
            }
            .pmodal-btn-primary:hover {
              filter: brightness(1.06);
              transform: translateY(-1px);
              transition: filter 0.18s ease, transform 0.18s ease;
            }

            /* ============================================================ */
            /*  Compact variant — used by Add New Contact modal             */
            /* ============================================================ */
            .pmodal-compact .ant-modal-close {
              top: 10px !important;
              right: 12px !important;
              width: 28px !important;
              height: 28px !important;
              border-radius: 8px !important;
            }
            .pmodal-hero-slim {
              padding: 14px 22px !important;
              background:
                radial-gradient(500px 140px at -10% 0%, rgba(139, 92, 246, 0.28), transparent 65%),
                radial-gradient(420px 140px at 110% 100%, rgba(99, 102, 241, 0.28), transparent 65%),
                linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
            }
            .pmodal-hero-slim .pmodal-hero-content { gap: 11px; }
            .pmodal-hero-slim .pmodal-hero-icon {
              width: 36px !important;
              height: 36px !important;
              border-radius: 10px !important;
            }
            .pmodal-hero-slim .pmodal-hero-title {
              font-size: 15px !important;
              line-height: 1.2;
            }
            .pmodal-hero-slim .pmodal-hero-sub {
              font-size: 11.5px !important;
              margin-top: 2px !important;
            }
            .pmodal-body-compact {
              padding: 18px 22px 4px !important;
              max-height: none !important;
            }
            .pmodal-body-compact .ant-form-item {
              margin-bottom: 12px !important;
            }
            .pmodal-body-compact .ant-form-item-label {
              padding-bottom: 4px !important;
            }
            .pmodal-body-compact .ant-form-item-label > label {
              font-size: 10.5px !important;
              letter-spacing: 0.07em;
            }
            .pmodal-body-compact .ant-input,
            .pmodal-body-compact .ant-input-affix-wrapper,
            .pmodal-body-compact .ant-select-selector,
            .pmodal-body-compact .ant-input-number {
              min-height: 38px !important;
              font-size: 13px !important;
            }
            .pmodal-segmented.ant-segmented {
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-100) !important;
              padding: 3px !important;
              border-radius: 10px !important;
              height: 38px !important;
            }
            .pmodal-segmented .ant-segmented-item {
              border-radius: 7px !important;
              min-height: 30px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-size: 12px !important;
              font-weight: 600 !important;
            }
            .pmodal-segmented .ant-segmented-item-selected {
              background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
              color: #fff !important;
              box-shadow: 0 4px 10px -4px rgba(139, 92, 246, 0.55) !important;
            }
            .pmodal-segmented .ant-segmented-item-selected .ant-segmented-item-label,
            .pmodal-segmented .ant-segmented-item-selected .pmodal-seg-label {
              color: #fff !important;
            }
            .pmodal-seg-label {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              line-height: 1;
            }
            .pmodal-footer-compact {
              padding: 12px 22px 14px !important;
              gap: 8px !important;
            }
            .pmodal-footer-compact .pmodal-btn-cancel,
            .pmodal-footer-compact .pmodal-btn-primary {
              height: 36px !important;
              padding: 0 16px !important;
              font-size: 13px !important;
            }

            /* ============================================================ */
            /*  Step bands — used by multi-section forms inside pmodal      */
            /* ============================================================ */
            .pmodal-step-band {
              display: flex;
              align-items: center;
              gap: 9px;
              margin: 4px 0 10px;
              padding: 6px 10px;
              border-radius: 9px;
              background: linear-gradient(
                90deg,
                rgba(139, 92, 246, 0.07) 0%,
                rgba(99, 102, 241, 0.04) 50%,
                transparent 100%
              );
              border: 1px solid var(--border-slate-100);
            }
            .pmodal-step-band:first-of-type { margin-top: 0; }
            .pmodal-step-num {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 22px;
              height: 22px;
              padding: 0 6px;
              border-radius: 6px;
              background: linear-gradient(135deg, #8b5cf6, #6366f1);
              color: #fff;
              font-size: 10.5px;
              font-weight: 800;
              letter-spacing: 0.04em;
              font-variant-numeric: tabular-nums;
              box-shadow: 0 4px 10px -4px rgba(139, 92, 246, 0.55);
            }
            .pmodal-step-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 18px;
              height: 18px;
              border-radius: 5px;
              background: rgba(139, 92, 246, 0.1);
              color: #8b5cf6;
            }
            .pmodal-step-text {
              font-size: 11px;
              font-weight: 700;
              color: var(--text-slate-700);
              text-transform: uppercase;
              letter-spacing: 0.08em;
              flex: 1;
            }

            /* ============================================================ */
            /*  Document Preview modal — premium 3-row shell                */
            /*  (header · pane · footer hint)                               */
            /* ============================================================ */
            .doc-preview-modal .ant-modal-content {
              padding: 0 !important;
              border-radius: 16px !important;
              overflow: hidden;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-100);
              box-shadow: 0 30px 80px -20px rgba(15, 23, 42, 0.4);
            }
            .doc-preview-modal .ant-modal-close {
              top: 14px !important;
              right: 14px !important;
              width: 30px !important;
              height: 30px !important;
              border-radius: 9px !important;
              background: var(--bg-slate-50) !important;
              color: var(--text-slate-700) !important;
              z-index: 10;
            }
            .doc-preview-modal .ant-modal-close:hover {
              background: var(--bg-pure-white) !important;
              color: #8b5cf6 !important;
            }

            /* Header */
            .doc-preview-head {
              display: flex;
              align-items: center;
              gap: 14px;
              padding: 14px 56px 14px 18px;
              border-bottom: 1px solid var(--border-slate-100);
              background: var(--bg-pure-white);
            }
            .doc-preview-icon {
              width: 40px;
              height: 40px;
              border-radius: 11px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #8b5cf6, #6366f1);
              color: #fff;
              box-shadow: 0 6px 14px -6px rgba(139, 92, 246, 0.5);
              flex-shrink: 0;
            }
            .doc-preview-info {
              flex: 1;
              min-width: 0;
            }
            .doc-preview-name {
              font-size: 15px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.01em;
              line-height: 1.25;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .doc-preview-meta {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;
              margin-top: 4px;
            }
            .doc-preview-tag {
              display: inline-flex;
              align-items: center;
              padding: 2px 8px;
              border-radius: 6px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              font-size: 10.5px;
              font-weight: 700;
              color: var(--text-slate-700);
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .doc-preview-source {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 2px 8px;
              border-radius: 999px;
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }
            .doc-preview-source.external {
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1));
              color: #6d28d9;
              border: 1px solid rgba(139, 92, 246, 0.25);
            }
            .doc-preview-source.uploaded {
              background: rgba(16, 185, 129, 0.1);
              color: #047857;
              border: 1px solid rgba(16, 185, 129, 0.25);
            }
            .doc-preview-service {
              font-size: 11px;
              font-weight: 500;
              color: var(--text-slate-500);
            }
            .doc-preview-actions {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-shrink: 0;
            }
            .doc-preview-btn {
              height: 34px !important;
              border-radius: 9px !important;
              padding: 0 14px !important;
              font-weight: 600 !important;
              font-size: 12.5px !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
            }
            .doc-preview-btn.pmodal-btn-primary {
              background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
              border: 0 !important;
              color: #fff !important;
              box-shadow: 0 6px 14px -6px rgba(139, 92, 246, 0.55) !important;
            }
            .doc-preview-btn:hover {
              border-color: rgba(139, 92, 246, 0.45) !important;
              color: #8b5cf6 !important;
            }
            .doc-preview-btn.pmodal-btn-primary:hover {
              filter: brightness(1.05);
              color: #fff !important;
            }
            .doc-preview-icon-btn {
              width: 34px !important;
              height: 34px !important;
              border-radius: 9px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-500) !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 0 !important;
            }
            .doc-preview-icon-btn:hover {
              border-color: rgba(139, 92, 246, 0.45) !important;
              color: #8b5cf6 !important;
            }

            /* Preview pane */
            .doc-preview-pane {
              position: relative;
              background: var(--bg-slate-50);
              height: 72vh;
              min-height: 420px;
              overflow: hidden;
            }
            .doc-preview-iframe {
              width: 100%;
              height: 100%;
              border: 0;
              background: var(--bg-pure-white);
              display: block;
            }
            .doc-preview-image-wrap {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 16px;
              background:
                linear-gradient(45deg, var(--border-slate-100) 25%, transparent 25%),
                linear-gradient(-45deg, var(--border-slate-100) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, var(--border-slate-100) 75%),
                linear-gradient(-45deg, transparent 75%, var(--border-slate-100) 75%);
              background-size: 20px 20px;
              background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            }
            .doc-preview-image {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              background: var(--bg-pure-white);
              border-radius: 8px;
              box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.25);
            }
            .doc-preview-fallback {
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 8px;
              padding: 32px;
              text-align: center;
            }
            .doc-preview-fb-icon {
              width: 60px;
              height: 60px;
              border-radius: 14px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(249, 115, 22, 0.1));
              color: #d97706;
              margin-bottom: 6px;
            }
            .doc-preview-fb-title {
              font-size: 15px;
              font-weight: 700;
              color: var(--text-slate-900);
            }
            .doc-preview-fb-desc {
              font-size: 12.5px;
              color: var(--text-slate-500);
              max-width: 420px;
              line-height: 1.5;
            }

            /* Footer hint */
            .doc-preview-foot {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 10px 18px;
              border-top: 1px solid var(--border-slate-100);
              background: var(--bg-slate-50);
            }
            .doc-preview-foot-hint {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 11.5px;
              color: var(--text-slate-500);
              font-weight: 500;
            }
            .doc-preview-foot-link {
              height: 28px !important;
              border-radius: 7px !important;
              border: 1px solid var(--border-slate-100) !important;
              font-size: 11.5px !important;
              font-weight: 600 !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
              padding: 0 10px !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 5px !important;
            }
            .doc-preview-foot-link:hover {
              border-color: rgba(139, 92, 246, 0.45) !important;
              color: #8b5cf6 !important;
            }

            /* Dark theme */
            [data-theme='dark'] .doc-preview-modal .ant-modal-content {
              background: var(--bg-secondary);
              border-color: var(--border-slate-100);
              box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.6);
            }
            [data-theme='dark'] .doc-preview-modal .ant-modal-close {
              background: var(--bg-primary) !important;
              color: var(--text-slate-400) !important;
            }
            [data-theme='dark'] .doc-preview-head { background: var(--bg-secondary); }
            [data-theme='dark'] .doc-preview-pane { background: var(--bg-primary); }
            [data-theme='dark'] .doc-preview-iframe { background: var(--bg-secondary); }
            [data-theme='dark'] .doc-preview-foot { background: var(--bg-primary); }
            [data-theme='dark'] .doc-preview-tag {
              background: var(--bg-primary);
              color: var(--text-slate-400);
              border-color: var(--border-slate-100);
            }
            [data-theme='dark'] .doc-preview-source.external {
              background: linear-gradient(135deg, rgba(167, 139, 250, 0.18), rgba(129, 140, 248, 0.14));
              color: #a78bfa;
              border-color: rgba(167, 139, 250, 0.3);
            }
            [data-theme='dark'] .doc-preview-source.uploaded {
              background: rgba(52, 211, 153, 0.18);
              color: #34d399;
              border-color: rgba(52, 211, 153, 0.3);
            }
            [data-theme='dark'] .doc-preview-btn,
            [data-theme='dark'] .doc-preview-icon-btn,
            [data-theme='dark'] .doc-preview-foot-link {
              background: var(--bg-secondary) !important;
              color: var(--text-slate-400) !important;
              border-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .doc-preview-btn:hover,
            [data-theme='dark'] .doc-preview-icon-btn:hover,
            [data-theme='dark'] .doc-preview-foot-link:hover {
              color: #a78bfa !important;
              border-color: rgba(167, 139, 250, 0.45) !important;
            }
            [data-theme='dark'] .doc-preview-btn.pmodal-btn-primary {
              color: #fff !important;
            }

            /* ============================================================ */
            /*  Add New Document modal — inline label help, source toggle,  */
            /*  refined dragger, selected-file card, URL mode               */
            /* ============================================================ */
            /* Inline help next to the label — sits above the input, so the
               AutoComplete dropdown can never overlap it. */
            .doc-field-label {
              display: flex;
              align-items: baseline;
              gap: 10px;
              flex-wrap: wrap;
              width: 100%;
            }
            .doc-field-label > span:first-child {
              font-weight: 700;
            }
            .doc-field-help {
              font-size: 10.5px;
              font-weight: 500;
              color: var(--text-slate-500);
              text-transform: none;
              letter-spacing: 0;
              line-height: 1.3;
            }
            /* Antd's Form.Item label wrapper truncates. Allow flex content. */
            .pmodal .ant-form-item-label > label {
              width: 100%;
            }
            .pmodal .ant-form-item-label > label::after { display: none !important; }

            /* Source toggle */
            .doc-source-toggle.ant-segmented {
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-100) !important;
              padding: 4px !important;
              border-radius: 10px !important;
            }
            .doc-source-toggle .ant-segmented-item {
              border-radius: 7px !important;
              min-height: 34px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .doc-source-opt {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              font-size: 12.5px;
              font-weight: 600;
            }
            .doc-source-toggle .ant-segmented-item-selected {
              background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
              color: #fff !important;
              box-shadow: 0 6px 14px -6px rgba(139, 92, 246, 0.55) !important;
            }
            .doc-source-toggle .ant-segmented-item-selected .ant-segmented-item-label,
            .doc-source-toggle .ant-segmented-item-selected .doc-source-opt {
              color: #fff !important;
            }

            /* Refined dragger */
            .doc-dragger.ant-upload-wrapper .ant-upload-drag {
              border-radius: 14px !important;
              border: 1.5px dashed var(--border-slate-200) !important;
              background: linear-gradient(180deg, var(--bg-slate-50) 0%, var(--bg-pure-white) 100%) !important;
              transition: all .2s ease;
            }
            .doc-dragger.ant-upload-wrapper .ant-upload-drag:hover {
              border-color: #8b5cf6 !important;
              background: linear-gradient(180deg, rgba(139, 92, 246, 0.06), rgba(99, 102, 241, 0.03)) !important;
              transform: translateY(-1px);
              box-shadow: 0 12px 24px -16px rgba(139, 92, 246, 0.4);
            }
            .doc-dragger.ant-upload-wrapper .ant-upload-drag-icon { margin-bottom: 0 !important; }
            .doc-dragger-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
              padding: 22px 16px;
            }
            .doc-dragger-icon {
              width: 52px;
              height: 52px;
              border-radius: 14px;
              background: linear-gradient(135deg, #8b5cf6, #6366f1);
              color: #fff;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 10px 24px -10px rgba(139, 92, 246, 0.55);
              margin-bottom: 8px;
            }
            .doc-dragger-title {
              font-size: 14px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
            }
            .doc-dragger-sub {
              font-size: 11.5px;
              color: var(--text-slate-500);
              font-weight: 500;
              margin-top: 2px;
            }

            /* Selected file card */
            .doc-file-card {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px 14px;
              border-radius: 12px;
              border: 1px solid rgba(139, 92, 246, 0.25);
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(99, 102, 241, 0.04));
            }
            .doc-file-icon {
              width: 40px;
              height: 40px;
              border-radius: 10px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #8b5cf6, #6366f1);
              color: #fff;
              flex-shrink: 0;
              box-shadow: 0 6px 14px -6px rgba(139, 92, 246, 0.55);
            }
            .doc-file-meta {
              flex: 1;
              min-width: 0;
            }
            .doc-file-name {
              font-size: 13.5px;
              font-weight: 700;
              color: var(--text-slate-900);
              line-height: 1.25;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .doc-file-sub {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-top: 4px;
            }
            .doc-file-tag {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 2px 8px;
              border-radius: 999px;
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.02em;
            }
            .doc-file-tag.ok {
              background: rgba(16, 185, 129, 0.1);
              color: #047857;
            }
            .doc-file-size {
              font-size: 11.5px;
              color: var(--text-slate-500);
              font-weight: 500;
              font-variant-numeric: tabular-nums;
            }
            .doc-file-remove {
              width: 28px;
              height: 28px;
              border: 1px solid var(--border-slate-100);
              background: var(--bg-pure-white);
              border-radius: 8px;
              color: var(--text-slate-500);
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              transition: all .15s ease;
              padding: 0;
              flex-shrink: 0;
            }
            .doc-file-remove:hover {
              border-color: #ef4444;
              color: #ef4444;
              background: rgba(239, 68, 68, 0.06);
            }

            /* Dark theme adjustments */
            [data-theme='dark'] .doc-source-toggle.ant-segmented {
              background: var(--bg-primary) !important;
            }
            [data-theme='dark'] .doc-dragger.ant-upload-wrapper .ant-upload-drag {
              background: linear-gradient(180deg, var(--bg-primary), var(--bg-secondary)) !important;
              border-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .doc-dragger.ant-upload-wrapper .ant-upload-drag:hover {
              border-color: #a78bfa !important;
            }
            [data-theme='dark'] .doc-file-card {
              background: linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(129, 140, 248, 0.06));
              border-color: rgba(167, 139, 250, 0.3);
            }
            [data-theme='dark'] .doc-file-remove {
              background: var(--bg-secondary);
              border-color: var(--border-slate-100);
            }
            [data-theme='dark'] .doc-field-help { color: var(--text-slate-400); }

            /* ============================================================ */
            /*  Creatable AutoComplete — Document category / subtype        */
            /* ============================================================ */
            .doc-autocomplete-popup .rc-virtual-list {
              padding: 4px 0;
            }
            .doc-autocomplete-popup .ant-select-item-group {
              font-size: 10px !important;
              font-weight: 700 !important;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--text-slate-500) !important;
              padding: 8px 12px 4px !important;
              background: transparent !important;
            }
            .doc-autocomplete-popup .ant-select-item-option {
              padding: 7px 12px !important;
              border-radius: 7px !important;
              margin: 0 6px !important;
              transition: all .15s ease;
            }
            .doc-autocomplete-popup .ant-select-item-option-active {
              background: rgba(139, 92, 246, 0.08) !important;
            }
            .doc-autocomplete-popup .ant-select-item-option-selected {
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.14), rgba(99, 102, 241, 0.1)) !important;
              color: #6d28d9 !important;
              font-weight: 600 !important;
            }
            .doc-opt {
              display: inline-flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              width: 100%;
            }
            .doc-opt-group {
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            .doc-opt-meta {
              font-size: 10.5px;
              font-weight: 500;
              color: var(--text-slate-500);
              letter-spacing: 0.02em;
            }
            .doc-opt-custom {
              display: inline-flex;
              align-items: center;
              padding: 1px 7px;
              border-radius: 999px;
              font-size: 9.5px;
              font-weight: 700;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(20, 184, 166, 0.12));
              color: #047857;
              border: 1px solid rgba(16, 185, 129, 0.25);
            }
            .doc-help {
              font-size: 11px;
              color: var(--text-slate-500);
              font-weight: 500;
              line-height: 1.35;
              display: block;
              margin-top: 4px;
            }
            [data-theme='dark'] .doc-autocomplete-popup .ant-select-item-option-selected {
              color: #c4b5fd !important;
            }
            [data-theme='dark'] .doc-opt-custom {
              background: linear-gradient(135deg, rgba(52, 211, 153, 0.18), rgba(45, 212, 191, 0.18));
              color: #34d399;
              border-color: rgba(52, 211, 153, 0.3);
            }

            /* Live availability check suffix (Project name/code) */
            .pmodal-check {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              transition: all 0.2s ease;
            }
            .pmodal-check.ok {
              background: rgba(16, 185, 129, 0.12);
              color: #059669;
            }
            .pmodal-check.bad {
              background: rgba(239, 68, 68, 0.12);
              color: #dc2626;
              animation: cd-shake 0.32s cubic-bezier(.36,.07,.19,.97);
            }
            .pmodal-check.spin {
              background: rgba(139, 92, 246, 0.12);
              color: #8b5cf6;
              animation: cd-spin 0.9s linear infinite;
            }
            @keyframes cd-spin { to { transform: rotate(360deg); } }
            @keyframes cd-shake {
              10%, 90% { transform: translateX(-1px); }
              20%, 80% { transform: translateX(2px); }
              30%, 50%, 70% { transform: translateX(-3px); }
              40%, 60% { transform: translateX(3px); }
            }
            .pmodal-check-hint {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              font-weight: 600;
              line-height: 1.2;
              margin-top: 4px;
            }
            .pmodal-check-hint.ok { color: #059669; }
            .pmodal-check-hint.muted { color: var(--text-slate-500); font-weight: 500; }
            [data-theme='dark'] .pmodal-check.ok { background: rgba(16, 185, 129, 0.2); color: #34d399; }
            [data-theme='dark'] .pmodal-check.bad { background: rgba(239, 68, 68, 0.22); color: #f87171; }
            [data-theme='dark'] .pmodal-check.spin { background: rgba(167, 139, 250, 0.2); color: #a78bfa; }
            [data-theme='dark'] .pmodal-check-hint.ok { color: #34d399; }

            /* ============================================================ */
            /*  Project modal — slightly wider feel, refined date inputs    */
            /* ============================================================ */
            .pmodal-project .pmodal-body-compact .ant-input-number-group-addon {
              border-radius: 10px 0 0 10px !important;
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-100) !important;
              border-right: 0 !important;
              padding: 0 6px !important;
            }
            .pmodal-project .pmodal-body-compact .ant-input-number-group-wrapper .ant-input-number {
              border-radius: 0 10px 10px 0 !important;
            }
            .pmodal-project .pmodal-body-compact .ant-picker {
              width: 100% !important;
            }

            [data-theme='dark'] .pmodal-step-band {
              background: linear-gradient(
                90deg,
                rgba(139, 92, 246, 0.12) 0%,
                rgba(99, 102, 241, 0.06) 50%,
                transparent 100%
              );
              border-color: var(--border-slate-100);
            }
            [data-theme='dark'] .pmodal-step-text { color: var(--text-slate-400); }
            [data-theme='dark'] .pmodal-step-icon {
              background: rgba(167, 139, 250, 0.18);
              color: #a78bfa;
            }
            [data-theme='dark'] .pmodal-project .pmodal-body-compact .ant-input-number-group-addon {
              background: var(--bg-primary) !important;
              border-color: var(--border-slate-100) !important;
              color: var(--text-slate-400) !important;
            }

            /* Dark theme — compact modal polish */
            [data-theme='dark'] .pmodal-compact .ant-modal-content {
              background: var(--bg-secondary) !important;
              border: 1px solid var(--border-slate-100) !important;
              box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.65) !important;
            }
            [data-theme='dark'] .pmodal-compact .ant-modal-close {
              background: rgba(255, 255, 255, 0.08) !important;
              color: rgba(255, 255, 255, 0.8) !important;
            }
            [data-theme='dark'] .pmodal-compact .ant-modal-close:hover {
              background: rgba(255, 255, 255, 0.16) !important;
              color: #fff !important;
            }
            [data-theme='dark'] .pmodal-hero-slim {
              background:
                radial-gradient(500px 140px at -10% 0%, rgba(139, 92, 246, 0.4), transparent 65%),
                radial-gradient(420px 140px at 110% 100%, rgba(99, 102, 241, 0.35), transparent 65%),
                linear-gradient(135deg, #0b1220 0%, #111827 100%) !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }
            [data-theme='dark'] .pmodal-hero-slim .pmodal-hero-icon {
              background: rgba(255, 255, 255, 0.1) !important;
              border-color: rgba(255, 255, 255, 0.16) !important;
            }
            [data-theme='dark'] .pmodal-body-compact {
              background: var(--bg-secondary) !important;
            }
            [data-theme='dark'] .pmodal-body-compact .ant-form-item-label > label {
              color: var(--text-slate-400) !important;
            }
            [data-theme='dark'] .pmodal-body-compact .ant-input,
            [data-theme='dark'] .pmodal-body-compact .ant-input-affix-wrapper,
            [data-theme='dark'] .pmodal-body-compact .ant-select-selector,
            [data-theme='dark'] .pmodal-body-compact .ant-input-number {
              background: var(--bg-primary) !important;
              border-color: var(--border-slate-100) !important;
              color: var(--text-slate-700) !important;
            }
            [data-theme='dark'] .pmodal-body-compact .ant-input::placeholder,
            [data-theme='dark'] .pmodal-body-compact .ant-input-number-input::placeholder {
              color: var(--text-slate-500) !important;
            }
            [data-theme='dark'] .pmodal-body-compact .ant-input-affix-wrapper:hover,
            [data-theme='dark'] .pmodal-body-compact .ant-input-affix-wrapper-focused,
            [data-theme='dark'] .pmodal-body-compact .ant-input:hover,
            [data-theme='dark'] .pmodal-body-compact .ant-input-number:hover {
              border-color: rgba(167, 139, 250, 0.55) !important;
            }
            [data-theme='dark'] .pmodal-body-compact .ant-input-affix-wrapper-focused,
            [data-theme='dark'] .pmodal-body-compact .ant-input-number-focused {
              border-color: #a78bfa !important;
              background: var(--bg-secondary) !important;
              box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.18) !important;
            }
            [data-theme='dark'] .pmodal-segmented.ant-segmented {
              background: var(--bg-primary) !important;
              border-color: var(--border-slate-100) !important;
            }
            [data-theme='dark'] .pmodal-segmented .ant-segmented-item {
              color: var(--text-slate-400) !important;
            }
            [data-theme='dark'] .pmodal-segmented .ant-segmented-item:hover:not(.ant-segmented-item-selected) {
              color: var(--text-slate-700) !important;
            }
            [data-theme='dark'] .pmodal-segmented .ant-segmented-item-selected {
              background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
              box-shadow: 0 6px 14px -4px rgba(139, 92, 246, 0.6) !important;
            }
            [data-theme='dark'] .pmodal-footer-compact {
              background: var(--bg-primary) !important;
              border-top: 1px solid var(--border-slate-100);
            }
            [data-theme='dark'] .pmodal-footer-compact .pmodal-btn-cancel {
              background: var(--bg-secondary) !important;
              border-color: var(--border-slate-100) !important;
              color: var(--text-slate-700) !important;
            }
            [data-theme='dark'] .pmodal-footer-compact .pmodal-btn-cancel:hover {
              border-color: rgba(167, 139, 250, 0.55) !important;
              color: #fff !important;
            }

            .pmodal .ant-upload.ant-upload-drag {
              border-radius: 14px !important;
              background: linear-gradient(180deg, var(--bg-slate-50) 0%, var(--bg-pure-white) 100%) !important;
              border: 1.5px dashed var(--border-slate-200) !important;
              transition: all 0.2s ease !important;
            }
            .pmodal .ant-upload.ant-upload-drag:hover {
              border-color: #8b5cf6 !important;
              background: linear-gradient(180deg, rgba(139, 92, 246, 0.06) 0%, var(--bg-pure-white) 100%) !important;
            }

            /* Dark theme */
            [data-theme="dark"] .pmodal .ant-modal-content {
              background: var(--bg-secondary);
              border-color: var(--border-slate-100);
            }
            [data-theme="dark"] .pmodal-body {
              background: var(--bg-secondary);
            }
            [data-theme="dark"] .pmodal-body .ant-input,
            [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper,
            [data-theme="dark"] .pmodal-body .ant-select-selector,
            [data-theme="dark"] .pmodal-body .ant-picker,
            [data-theme="dark"] .pmodal-body .ant-input-number,
            [data-theme="dark"] .pmodal-body .ant-input-number-affix-wrapper {
              background: var(--bg-primary) !important;
            }
            [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper-focused,
            [data-theme="dark"] .pmodal-body .ant-select-focused .ant-select-selector,
            [data-theme="dark"] .pmodal-body .ant-picker-focused,
            [data-theme="dark"] .pmodal-body .ant-input-number-focused {
              background: var(--bg-secondary) !important;
            }
            [data-theme="dark"] .pmodal-footer {
              background: var(--bg-primary);
            }
            [data-theme="dark"] .pmodal-btn-cancel {
              background: var(--bg-secondary) !important;
            }
            [data-theme="dark"] .pmodal .ant-upload.ant-upload-drag {
              background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%) !important;
            }

            /* ============================================================ */
            /* Premium tab shell — shared by Contacts, Allocations,         */
            /* Projects, and Documents tabs                                  */
            /* ============================================================ */
            .ptab-card {
              border-radius: 16px !important;
              border: 1px solid var(--border-slate-100) !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 4px 16px -8px rgba(15, 23, 42, 0.06) !important;
              overflow: hidden;
            }
            .ptab-card .ant-card-body { padding: 0 !important; }

            .ptab-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              padding: 20px 24px;
              border-bottom: 1px solid var(--border-slate-100);
              flex-wrap: wrap;
            }
            .ptab-header-left {
              display: flex;
              align-items: center;
              gap: 14px;
              min-width: 0;
              flex: 1;
            }
            .ptab-header-icon {
              width: 40px; height: 40px;
              border-radius: 11px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              color: #fff;
              box-shadow: 0 6px 14px -6px rgba(139, 92, 246, 0.45);
            }
            .ptab-header-icon.violet { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
            .ptab-header-icon.green {
              background: linear-gradient(135deg, #10b981, #14b8a6);
              box-shadow: 0 6px 14px -6px rgba(16, 185, 129, 0.45);
            }
            .ptab-header-icon.blue {
              background: linear-gradient(135deg, #3b82f6, #06b6d4);
              box-shadow: 0 6px 14px -6px rgba(59, 130, 246, 0.45);
            }
            .ptab-header-icon.amber {
              background: linear-gradient(135deg, #f59e0b, #f97316);
              box-shadow: 0 6px 14px -6px rgba(245, 158, 11, 0.45);
            }
            .ptab-header-titlewrap {
              min-width: 0;
              display: flex;
              flex-direction: column;
              gap: 3px;
            }
            .ptab-header-title {
              display: flex;
              align-items: center;
              gap: 9px;
              font-size: 16px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
              line-height: 1.2;
            }
            .ptab-header-count {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 24px;
              height: 20px;
              padding: 0 8px;
              border-radius: 999px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-100);
              color: var(--text-slate-700);
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.02em;
              font-variant-numeric: tabular-nums;
            }
            .ptab-header-desc {
              font-size: 12.5px;
              color: var(--text-slate-500);
              line-height: 1.4;
            }
            .ptab-header-right {
              display: flex;
              align-items: center;
              gap: 10px;
              flex-shrink: 0;
            }
            .ptab-search.ant-input-affix-wrapper {
              width: 280px !important;
              height: 38px !important;
              border-radius: 10px !important;
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-100) !important;
              transition: all .2s ease;
            }
            .ptab-search.ant-input-affix-wrapper:focus-within {
              border-color: #8b5cf6 !important;
              box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
              background: var(--bg-pure-white) !important;
            }
            .ptab-search .ant-input {
              background: transparent !important;
              font-size: 13px;
              font-weight: 500;
            }
            .ptab-primary-btn {
              height: 38px !important;
              border-radius: 10px !important;
              padding: 0 18px !important;
              font-weight: 700 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
              background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%) !important;
              border: 0 !important;
              box-shadow: 0 6px 16px -8px rgba(139, 92, 246, 0.6) !important;
              color: #fff !important;
            }
            .ptab-primary-btn:hover {
              filter: brightness(1.05);
              transform: translateY(-1px);
              transition: all .2s ease;
            }

            /* Refined premium-table — left hover accent + breathing room */
            .premium-table .ant-table-tbody > tr > td {
              position: relative;
              transition: background .15s ease;
            }
            .premium-table .ant-table-tbody > tr > td:first-child::before {
              content: "";
              position: absolute;
              left: 0; top: 0; bottom: 0;
              width: 3px;
              background: linear-gradient(180deg, #8b5cf6, #6366f1);
              opacity: 0;
              transition: opacity .2s ease;
              pointer-events: none;
            }
            .premium-table .ant-table-tbody > tr:hover > td:first-child::before {
              opacity: 1;
            }

            /* Premium avatar in tab tables */
            .ptab-avatar {
              width: 38px; height: 38px;
              border-radius: 11px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: 700;
              font-size: 12.5px;
              letter-spacing: 0.02em;
              box-shadow: 0 4px 10px -4px rgba(15, 23, 42, 0.25),
                          inset 0 1px 0 rgba(255, 255, 255, 0.18);
              flex-shrink: 0;
              position: relative;
            }
            .ptab-avatar.is-primary::after {
              content: "";
              position: absolute;
              right: -2px;
              bottom: -2px;
              width: 12px; height: 12px;
              border-radius: 50%;
              background: #10b981;
              border: 2px solid var(--bg-pure-white);
              box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
            }

            /* Premium empty state */
            .ptab-empty {
              padding: 56px 24px;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
            }
            .ptab-empty-icon {
              width: 56px; height: 56px;
              border-radius: 14px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1));
              color: #8b5cf6;
              margin-bottom: 4px;
            }
            .ptab-empty-title {
              font-size: 14px;
              font-weight: 700;
              color: var(--text-slate-900);
            }
            .ptab-empty-desc {
              font-size: 12.5px;
              color: var(--text-slate-500);
              max-width: 360px;
              line-height: 1.5;
            }

            @media (max-width: 768px) {
              .ptab-header { flex-direction: column; align-items: stretch; }
              .ptab-search.ant-input-affix-wrapper { width: 100% !important; }
              .ptab-header-right { width: 100%; }
              .ptab-primary-btn { flex: 1; justify-content: center !important; }
            }

            [data-theme='dark'] .ptab-card { background: var(--bg-secondary) !important; }
            [data-theme='dark'] .ptab-search.ant-input-affix-wrapper { background: var(--bg-secondary) !important; }
            [data-theme='dark'] .ptab-header-count { background: var(--bg-secondary); }
          `}</style>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
