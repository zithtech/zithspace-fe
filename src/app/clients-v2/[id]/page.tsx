"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useState } from "react";
import {
  Typography,
  Tabs,
  Button,
  Space,
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
  History,
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
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { api } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";

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
import PortalModulesTab from "./Tabs/PortalModulesTab";
import { teamService } from "@/services/teamService";
import { momService } from "@/services/momService";
import { clientPortalService } from "@/services/clientPortalService";
import { environmentsService } from "@/services/environmentsService";
import { staffPortalTicketService } from "@/services/staffPortalTicketService";
import { crService } from "@/services/crService";
import { approvalsService } from "@/services/approvalsService";
import { milestoneService } from "@/services/milestoneService";
import { releaseService } from "@/services/releaseService";
import { currencyOptions } from "@/utils/currencyOptions";

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
  showSearch?: boolean;
}> = ({ value, field, options, renderTag, onUpdate, activeField, setActiveField, isEditMode, showSearch }) => {
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
          showSearch={showSearch}
          optionFilterProp="label"
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
    <div className="cd-stat-top">
      <div className="cd-stat-left">
        <div
          className="cd-stat-icon"
          style={{ background: `${accent}14`, color: accent }}
        >
          <Icon size={13} color={accent} />
        </div>
        <span className="cd-stat-label">{label}</span>
      </div>
      {trend && (
        <div className={`cd-trend ${trend.positive ? "up" : "down"}`}>
          {trend.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span>{trend.value > 0 ? "+" : ""}{trend.value}%</span>
        </div>
      )}
    </div>
    <div className="cd-stat-bottom">
      <div className="cd-stat-value">{value}</div>
      {subtle && <span className="cd-stat-subtle">{subtle}</span>}
    </div>
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
  useActivitySource({ section: "ADMIN", module: "ClientsV2", page: "ClientDetail" });
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { tenantId } = useTenant();
  const { canUpdateClient, canReadActivityLog } = usePermission();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notify, contextHolder] = notification.useNotification();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("1");
  const [copiedCode, setCopiedCode] = useState(false);

  /* Dynamic tab counts (loaded by each child tab) */
  const [meetingsCount, setMeetingsCount] = useState(0);
  const [portalCount, setPortalCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [ticketsCount, setTicketsCount] = useState(0);
  const [envsCount, setEnvsCount] = useState(0);
  const [invoicesCount, setInvoicesCount] = useState(0);
  const [crCount, setCrCount] = useState(0);
  const [approvalsCount, setApprovalsCount] = useState(0);
  const [milestonesCount, setMilestonesCount] = useState(0);
  const [releasesCount, setReleasesCount] = useState(0);

  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab === "projects") {
      setActiveTab("4");
    }
  }, [searchParams]);

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

  /* ---- Pre-fetch tab counts so badges show immediately ---- */
  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    Promise.allSettled([
      teamService.listForClient(id).then((d) => setTeamCount(d.length)).catch(() => { }),
      momService.listForClient(id).then((d) => setMeetingsCount((d || []).length)).catch(() => { }),
      clientPortalService.listForClient(id).then((d) => setPortalCount((d || []).length)).catch(() => { }),
      environmentsService.listForClient(id).then((d) => setEnvsCount(d.length)).catch(() => { }),
      staffPortalTicketService
        .list({ clientId: id, limit: 1 })
        .then(({ meta }) => setTicketsCount(meta.total))
        .catch(() => { }),
      crService.listForClient(id).then((d) => setCrCount((d || []).length)).catch(() => { }),
      approvalsService.listForClient(id).then((d) => setApprovalsCount((d || []).length)).catch(() => { }),
      milestoneService.list(id).then((d) => setMilestonesCount((d || []).length)).catch(() => { }),
      releaseService.list(id).then((d) => setReleasesCount((d || []).length)).catch(() => { }),
      api.get(`/api/clients-v2/${id}/invoices`).then((d: any) => setInvoicesCount((d || []).length)).catch(() => { }),
    ]);
  }, [params.id]);

  const handleUpdateField = async (field: string, value: any) => {
    try {
      if (client[field] === value) return;

      // Validate GST/Tax ID, PAN, and Year of Incorporation if they or country are updated
      if (
        field === "gstVatTaxId" ||
        field === "pan" ||
        field === "yearOfIncorporation" ||
        field === "country" ||
        field === "dunsNumber" ||
        field === "ifscSwift" ||
        field === "bankAccountNumber" ||
        field === "website"
      ) {
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

        // 4. DUNS Validation
        if (field === "dunsNumber" && value && value.trim() !== "") {
          const val = value.trim();
          if (!/^\d{9}$/.test(val)) {
            notify.error({
              message: "Validation Error",
              description: "Enter a valid DUNS number (must be exactly 9 digits).",
              placement: "top",
            });
            setActiveField(null);
            return;
          }
        }

        // 5. IFSC / SWIFT Validation
        if (field === "ifscSwift" && value && value.trim() !== "") {
          const val = value.trim();
          const ifscRegex = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
          const swiftRegex = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;
          if (!ifscRegex.test(val) && !swiftRegex.test(val)) {
            notify.error({
              message: "Validation Error",
              description: "Enter a valid IFSC or SWIFT code.",
              placement: "top",
            });
            setActiveField(null);
            return;
          }
        }

        // 6. Account Number Validation
        if (field === "bankAccountNumber" && value && value.trim() !== "") {
          const val = value.trim();
          if (!/^\d{6,20}$/.test(val)) {
            notify.error({
              message: "Validation Error",
              description: "Enter a valid account number (6 to 20 digits).",
              placement: "top",
            });
            setActiveField(null);
            return;
          }
        }

        // 7. Website Validation
        if (field === "website" && value && value.trim() !== "") {
          const val = value.trim();
          const websiteRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
          if (!websiteRegex.test(val)) {
            notify.error({
              message: "Validation Error",
              description: "Enter a valid website URL.",
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
              <ZukvoLoader size="lg" />
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
              {canReadActivityLog && (
                <Button
                  icon={<History size={15} />}
                  className="cd-secondary-btn"
                  onClick={() => setHistoryOpen(true)}
                >
                  History
                </Button>
              )}
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
              className={`cd-tabs active-tab-${activeTab}`}
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
                          accent="#3b82f6"
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
                              <EditableSelect
                                value={client.defaultCurrency || "USD"}
                                field="defaultCurrency"
                                onUpdate={handleUpdateField}
                                options={currencyOptions.map((c) => ({ value: c.value, label: `${c.value} - ${c.label}` }))}
                                renderTag={(val) => (
                                  <span className="cd-currency-tag">{val || "USD"}</span>
                                )}
                                activeField={activeField}
                                setActiveField={setActiveField}
                                isEditMode={editModes.finance}
                                showSearch
                              />
                            </Field>
                          </div>
                        </SectionCard>

                        <SectionCard
                          title="Banking Information"
                          description="Wire and transfer details for settlements"
                          icon={Landmark}
                          accent="#3b82f6"
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
                      <span className="cd-tab-count">{totalContacts}</span>
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
                      <span className="cd-tab-count">{totalAllocations}</span>
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
                      <span className="cd-tab-count">{totalProjects}</span>
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
                      <span className="cd-tab-count">{invoicesCount}</span>
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
                      <span className="cd-tab-count">{totalDocuments}</span>
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
                      <span className="cd-tab-count">{portalCount}</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <PortalAccessTab
                        clientId={params.id as string}
                        contacts={client.contacts || []}
                        onRefresh={fetchClientDetails}
                        onCountChange={setPortalCount}
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
                      <span className="cd-tab-count">{meetingsCount}</span>
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
                        onCountChange={setMeetingsCount}
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
                      <span className="cd-tab-count">{crCount}</span>
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
                      <span className="cd-tab-count">{approvalsCount}</span>
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
                      <span className="cd-tab-count">{envsCount}</span>
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
                        onCountChange={setEnvsCount}
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
                      <span className="cd-tab-count">{teamCount}</span>
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
                        onCountChange={setTeamCount}
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
                      <span className="cd-tab-count">{ticketsCount}</span>
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
                        onCountChange={setTicketsCount}
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
                      <span className="cd-tab-count">{milestonesCount}</span>
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
                      <span className="cd-tab-count">{releasesCount}</span>
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
                {
                  key: "settings",
                  label: (
                    <span className="cd-tab-label">
                      <Settings2 size={15} />
                      <span>Settings</span>
                    </span>
                  ),
                  children: (
                    <div className="cd-tab-pane">
                      <PortalModulesTab clientId={params.id as string} />
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
              background: var(--bg-pure-white);
              min-height: calc(100vh - 64px);
              padding: 0;
              display: flex;
              flex-direction: column;
            }
            [data-theme="dark"] .cd-page {
              background: var(--bg-primary);
            }

            /* ---------- Command bar ---------- */
            .cd-cmdbar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 6px 16px;
              position: sticky;
              top: 0;
              z-index: 100;
              background: var(--bg-pure-white);
              border-bottom: 1px solid var(--border-slate-200);
            }
            [data-theme="dark"] .cd-cmdbar {
              background: var(--bg-primary);
              border-color: var(--border-slate-800);
            }
            .cd-crumbs {
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 0;
              flex: 1;
            }
             .cd-back {
              width: 28px;
              height: 28px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-200);
              color: var(--text-slate-700);
              cursor: pointer;
              transition: all 0.18s ease;
              padding: 0;
              flex-shrink: 0;
            }
            .cd-back:hover {
              border-color: #3b82f6;
              color: #3b82f6;
              background: var(--bg-pure-white);
              transform: translateX(-1px);
            }
            .cd-crumb-link {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 8px;
              border-radius: 0;
              background: transparent;
              border: 0;
              color: var(--text-slate-500);
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.15s ease;
            }
            .cd-crumb-link:hover {
              color: #3b82f6;
              background: rgba(59, 130, 246, 0.08);
            }
            .cd-crumb-sep {
              color: var(--text-slate-400);
              flex-shrink: 0;
            }
            .cd-crumb-current {
              font-size: 12px;
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
              height: 28px !important;
              border-radius: 8px !important;
              border: 1px solid var(--border-slate-200) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
              font-weight: 600 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
              padding: 0 10px !important;
              transition: all 0.18s ease !important;
            }
            .cd-secondary-btn:hover {
              border-color: #3b82f6 !important;
              color: #3b82f6 !important;
              transform: translateY(-1px);
            }
            .cd-primary-btn {
              border-radius: 0 !important;
              background: #3b82f6 !important;
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
              margin: 5px 0 12px 0;
              padding: 12px 12px;
              border-radius: 0px;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-200);
              color: var(--text-slate-900);
              box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
            }
            [data-theme="dark"] .cd-hero {
              background: var(--bg-pure-white);
              border-color: var(--border-color);
              color: var(--text-slate-100);
              box-shadow: none;
            }
            .cd-hero-mesh {
              display: none;
            }
            .cd-hero-blob {
              display: none;
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
              width: 44px;
              height: 44px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #3b82f6 !important;
              background: #eff6ff !important;
              border: 1px solid #bfdbfe !important;
              font-weight: 800;
              font-size: 16px;
              letter-spacing: 0.02em;
              box-shadow: none;
              flex-shrink: 0;
            }
            [data-theme="dark"] .cd-hero-avatar {
              color: var(--text-slate-200);
              background: var(--bg-slate-800) !important;
              border-color: var(--border-slate-700);
            }
            .cd-hero-avatar-status {
              position: absolute;
              bottom: -2px;
              right: -2px;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #94a3b8;
              border: 2px solid var(--bg-pure-white);
            }
            [data-theme="dark"] .cd-hero-avatar-status {
              border-color: var(--bg-secondary);
            }
            .cd-hero-avatar-status.active {
              background: #10b981;
            }
            .cd-hero-info {
              min-width: 0;
              flex: 1;
            }
            .cd-hero-title {
              color: var(--text-slate-900);
              font-size: 18px;
              font-weight: 800;
              margin: 6px 0 4px 0;
              padding-top: 2px;
              letter-spacing: -0.025em;
              line-height: 1.2;
              word-break: break-word;
            }
            [data-theme="dark"] .cd-hero-title {
              color: var(--text-slate-100);
            }
            .cd-hero-meta {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              flex-wrap: wrap;
              color: var(--text-slate-500);
              font-size: 12px;
              font-weight: 500;
            }
            [data-theme="dark"] .cd-hero-meta {
              color: var(--text-slate-400);
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
              color: var(--text-slate-600);
              transition: color 0.15s ease;
            }
            [data-theme="dark"] .cd-meta-link {
              color: var(--text-slate-400);
            }
            .cd-meta-link:hover {
              color: #3b82f6;
              text-decoration: underline;
            }
            .cd-meta-code {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 2px 6px;
              border-radius: 8px;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-200);
              color: var(--text-slate-600);
              font-family: ui-monospace, "SF Mono", Menlo, monospace;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.18s ease;
            }
            [data-theme="dark"] .cd-meta-code {
              background: var(--bg-slate-800);
              border-color: var(--border-slate-700);
              color: var(--text-slate-300);
            }
            .cd-meta-code:hover {
              background: var(--bg-slate-100);
              border-color: var(--border-slate-300);
            }

            /* ---------- Pills ---------- */
            .cd-pill {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 3px 8px;
              border-radius: 8px;
              font-size: 10.5px;
              font-weight: 700;
              letter-spacing: 0.04em;
            }
            .cd-pill.status .cd-pill-dot {
              width: 5px;
              height: 5px;
              border-radius: 50%;
            }
            .cd-pill.status.active {
              background: rgba(16, 185, 129, 0.08);
              color: #059669;
              border: 1px solid rgba(16, 185, 129, 0.2);
            }
            [data-theme="dark"] .cd-pill.status.active {
              background: rgba(16, 185, 129, 0.15);
              color: #34d399;
              border-color: rgba(16, 185, 129, 0.3);
            }
            .cd-pill.status.active .cd-pill-dot {
              background: #10b981;
              box-shadow: none;
              animation: none;
            }
            .cd-pill.status.inactive {
              background: rgba(148, 163, 184, 0.08);
              color: #64748b;
              border: 1px solid rgba(148, 163, 184, 0.2);
            }
            [data-theme="dark"] .cd-pill.status.inactive {
              background: rgba(148, 163, 184, 0.15);
              color: #cbd5e1;
              border-color: rgba(148, 163, 184, 0.3);
            }
            .cd-pill.status.inactive .cd-pill-dot {
              background: #94a3b8;
            }
            .cd-pill.risk {
              border: 1px solid rgba(0, 0, 0, 0.04);
            }
            .cd-pill.type {
              background: var(--bg-slate-50);
              color: var(--text-slate-600);
              border: 1px solid var(--border-slate-200);
              text-transform: none;
              letter-spacing: 0.02em;
              font-size: 11px;
            }
            [data-theme="dark"] .cd-pill.type {
              background: var(--bg-slate-800);
              color: var(--text-slate-300);
              border-color: var(--border-slate-700);
            }

            /* In light context (section cards), reuse pill styles with adjusted colors */
            .cd-section .cd-pill.status.active {
              background: rgba(16, 185, 129, 0.08);
              color: #059669;
              border: 1px solid rgba(16, 185, 129, 0.2);
            }
            .cd-section .cd-pill.status.inactive {
              background: var(--bg-slate-50);
              color: var(--text-slate-500);
              border: 1px solid var(--border-slate-200);
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
              background: transparent;
              border-right: 1px solid var(--border-slate-200);
              z-index: 1;
              pointer-events: none;
            }
            [data-theme="dark"] .cd-tabs.ant-tabs::before {
              border-right-color: var(--border-slate-700, #374151);
            }
            .cd-tabs.ant-tabs > .ant-tabs-nav {
              position: sticky !important;
              top: 45px;
              align-self: flex-start;
              width: 220px;
              flex-shrink: 0;
              margin: 0 !important;
              padding: 8px 8px !important;
              background: transparent;
              border-right: none !important;
              border-radius: 0;
              max-height: calc(100vh - 48px);
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
              padding: 6px 10px !important;
              margin: 0 !important;
              border-radius: 8px !important;
              border: 1px solid transparent !important;
              transition: all 0.15s ease !important;
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
              color: var(--text-slate-500);
              font-size: 13px;
              font-weight: 600;
              transition: all 0.15s ease;
              width: 100%;
            }
            .cd-tabs .ant-tabs-tab .cd-tab-label > svg {
              flex: 0 0 16px;
              display: flex;
              justify-content: center;
              align-items: center;
              margin-right: 12px;
              color: var(--text-slate-400);
              transition: color 0.15s ease;
            }
            .cd-tabs .ant-tabs-tab .cd-tab-label > span:not(.cd-tab-count) {
              flex: 1;
              min-width: 0;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .cd-tabs .ant-tabs-tab .cd-tab-label .cd-tab-count {
              flex-shrink: 0;
              margin-left: auto;
            }
            .cd-tabs .ant-tabs-tab:hover {
              background: var(--bg-slate-50) !important;
              border-radius: 8px !important;
            }
            .cd-tabs .ant-tabs-tab:hover .cd-tab-label {
              color: #3b82f6;
            }
            .cd-tabs .ant-tabs-tab:hover .cd-tab-label > svg {
              color: #3b82f6;
            }
            .cd-tabs .ant-tabs-tab-active {
              background: var(--bg-blue-50) !important;
              border-radius: 8px !important;
              border: 1px solid rgba(59, 130, 246, 0.24) !important;
            }
            [data-theme="dark"] .cd-tabs .ant-tabs-tab-active {
              background: rgba(59, 130, 246, 0.15) !important;
              border-radius: 8px !important;
              border: 1px solid rgba(59, 130, 246, 0.4) !important;
            }
            .cd-tabs .ant-tabs-tab-active:hover {
              background: var(--bg-blue-50) !important;
              border-radius: 8px !important;
              border: 1px solid rgba(59, 130, 246, 0.24) !important;
            }
            [data-theme="dark"] .cd-tabs .ant-tabs-tab-active:hover {
              background: rgba(59, 130, 246, 0.2) !important;
              border-radius: 8px !important;
              border: 1px solid rgba(59, 130, 246, 0.4) !important;
            }
            .cd-tabs .ant-tabs-tab-active .cd-tab-label {
              color: var(--text-slate-900) !important;
              font-weight: 700;
            }
            [data-theme="dark"] .cd-tabs .ant-tabs-tab-active .cd-tab-label {
              color: var(--text-slate-100) !important;
            }
            .cd-tabs .ant-tabs-tab-active .cd-tab-label > svg {
              color: #3b82f6 !important;
            }
            .cd-tabs .ant-tabs-ink-bar {
              display: none !important;
            }
            .cd-tabs .ant-tabs-content-holder {
              flex: 1;
              min-width: 0;
              border-left: none !important;
              padding: 0 12px !important;
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
              height: 20px;
              padding: 0 4px;
              border-radius: 6px;
              background: transparent;
              color: var(--text-slate-400);
              font-size: 11px;
              font-weight: 600;
              border: none !important;
              margin-left: auto;
              transition: all 0.15s ease;
            }
            .cd-tabs .ant-tabs-tab-active .cd-tab-count {
              background: rgba(59, 130, 246, 0.12) !important;
              color: #3b82f6 !important;
              border: none !important;
              font-weight: 700;
            }
            [data-theme="dark"] .cd-tabs .ant-tabs-tab-active .cd-tab-count {
              background: rgba(59, 130, 246, 0.25) !important;
              color: #3b82f6 !important;
              border: none !important;
              font-weight: 700;
            }
            .cd-tab-pane {
              animation: cd-fade-in 0.3s ease;
              padding: 0 0 16px 0;
            }
            html body .contacts-header-wrap .saas-header-container,
            html body .projects-header-wrap .saas-header-container,
            html body .team-header-wrap .saas-header-container,
            html body .env-header-wrap .saas-header-container,
            html body .releases-header-wrap .saas-header-container,
            html body .approvals-header-wrap .saas-header-container,
            html body .support-header-wrap .saas-header-container,
            html body .milestones-header-wrap .saas-header-container,
            html body .documents-header-wrap .saas-header-container,
            html body .portal-access-header-wrap .saas-header-container,
            html body .cr-header-wrap .saas-header-container,
            html body .meetings-header-wrap .saas-header-container {
              padding-top: 12px !important;
              padding-bottom: 12px !important;
            }
            .ptab-divider {
              border-bottom: 1px solid var(--border-slate-200);
              margin-bottom: 12px;
              margin-left: -32px !important;
              margin-right: -32px !important;
            }
            @media (max-width: 900px) {
              .ptab-divider {
                margin-left: -20px !important;
                margin-right: -20px !important;
              }
            }
            @media (max-width: 720px) {
              .ptab-divider {
                margin-left: -16px !important;
                margin-right: -16px !important;
              }
            }

            /* Global Search Input & Select Overrides for Tab Filters */
            .contacts-search-input.ant-input-affix-wrapper,
            .projects-search-input.ant-input-affix-wrapper,
            .documents-search-input.ant-input-affix-wrapper,
            .contacts-search-input.ant-picker {
              height: 32px !important;
              border-radius: 8px !important;
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-200) !important;
              box-shadow: none !important;
              transition: all 0.2s ease !important;
              padding: 4px 12px !important;
              display: inline-flex !important;
              align-items: center !important;
            }
            .contacts-search-input.ant-input-affix-wrapper:hover,
            .projects-search-input.ant-input-affix-wrapper:hover,
            .documents-search-input.ant-input-affix-wrapper:hover,
            .contacts-search-input.ant-picker:hover {
              border-color: var(--border-slate-200) !important;
            }
            .contacts-search-input.ant-input-affix-wrapper:focus-within,
            .projects-search-input.ant-input-affix-wrapper:focus-within,
            .documents-search-input.ant-input-affix-wrapper:focus-within,
            .contacts-search-input.ant-picker-focused {
              border-color: #8b5cf6 !important;
              box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
              background: var(--bg-pure-white) !important;
            }
            .contacts-search-input .ant-input,
            .projects-search-input .ant-input,
            .documents-search-input .ant-input,
            .contacts-search-input .ant-picker-input > input {
              background: transparent !important;
              font-size: 13px !important;
              font-weight: 500 !important;
              color: var(--text-slate-800) !important;
            }
            [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper,
            [data-theme="dark"] .projects-search-input.ant-input-affix-wrapper,
            [data-theme="dark"] .documents-search-input.ant-input-affix-wrapper,
            [data-theme="dark"] .contacts-search-input.ant-picker {
              background: transparent !important;
              border-color: var(--border-slate-800) !important;
            }
            [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper:hover,
            [data-theme="dark"] .projects-search-input.ant-input-affix-wrapper:hover,
            [data-theme="dark"] .documents-search-input.ant-input-affix-wrapper:hover,
            [data-theme="dark"] .contacts-search-input.ant-picker:hover {
              border-color: var(--border-slate-700) !important;
            }
            [data-theme="dark"] .contacts-search-input.ant-input-affix-wrapper:focus-within,
            [data-theme="dark"] .projects-search-input.ant-input-affix-wrapper:focus-within,
            [data-theme="dark"] .documents-search-input.ant-input-affix-wrapper:focus-within,
            [data-theme="dark"] .contacts-search-input.ant-picker-focused {
              background: transparent !important;
              border-color: #8b5cf6 !important;
            }

            .contacts-filter-select.ant-select {
              height: 32px !important;
              border-radius: 8px !important;
            }
            .contacts-filter-select.ant-select .ant-select-selector {
              border-radius: 8px !important;
              height: 32px !important;
              display: flex !important;
              align-items: center !important;
              background: var(--bg-slate-50) !important;
              background-color: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-200) !important;
              box-shadow: none !important;
              transition: all 0.2s ease !important;
              padding: 0 12px !important;
            }
            .contacts-filter-select.ant-select:hover .ant-select-selector {
              border-color: var(--border-slate-200) !important;
              background-color: var(--bg-slate-50) !important;
            }
            .contacts-filter-select.ant-select.ant-select-focused .ant-select-selector {
              border-color: #8b5cf6 !important;
              box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
              background: var(--bg-pure-white) !important;
              background-color: var(--bg-pure-white) !important;
            }
            .contacts-filter-select.ant-select .ant-select-selection-item,
            .contacts-filter-select.ant-select .ant-select-selection-placeholder {
              font-size: 13px !important;
              font-weight: 500 !important;
              color: var(--text-slate-800) !important;
              line-height: 30px !important;
            }
            [data-theme="dark"] .contacts-filter-select.ant-select .ant-select-selector {
              background: var(--bg-secondary) !important;
              background-color: var(--bg-secondary) !important;
              border-color: var(--border-slate-200) !important;
            }
            [data-theme="dark"] .contacts-filter-select.ant-select:hover .ant-select-selector {
              border-color: var(--border-slate-200) !important;
              background-color: var(--bg-secondary) !important;
            }
            [data-theme="dark"] .contacts-filter-select.ant-select.ant-select-focused .ant-select-selector {
              background: var(--bg-slate-900) !important;
              background-color: var(--bg-slate-900) !important;
              border-color: #8b5cf6 !important;
            }
            [data-theme="dark"] .contacts-filter-select.ant-select .ant-select-arrow {
              color: var(--text-slate-400) !important;
            }
            [data-theme="dark"] .contacts-filter-select.ant-select .ant-select-selection-item,
            [data-theme="dark"] .contacts-filter-select.ant-select .ant-select-selection-placeholder {
              color: var(--text-slate-200) !important;
            }

            /* Searchable Dropdown Overrides */
            .contacts-filter-select-sd.sd-trigger {
              height: 32px !important;
              border-radius: 8px !important;
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-200) !important;
              transition: all 0.2s ease !important;
              padding: 4px 12px !important;
              width: auto !important;
              min-width: 160px;
            }
            .contacts-filter-select-sd.sd-trigger:hover {
              border-color: var(--border-slate-200) !important;
              background: var(--bg-slate-50) !important;
            }
            .contacts-filter-select-sd.sd-trigger.is-active {
              border-color: #8b5cf6 !important;
              background: var(--bg-pure-white) !important;
            }
            .contacts-filter-select-sd.sd-trigger.is-open {
              border-color: #8b5cf6 !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
            }
            [data-theme="dark"] .contacts-filter-select-sd.sd-trigger {
              background: transparent !important;
              border-color: var(--border-slate-800) !important;
            }
            [data-theme="dark"] .contacts-filter-select-sd.sd-trigger:hover {
              background: transparent !important;
              border-color: var(--border-slate-700) !important;
            }
            [data-theme="dark"] .contacts-filter-select-sd.sd-trigger.is-active,
            [data-theme="dark"] .contacts-filter-select-sd.sd-trigger.is-open {
              background: transparent !important;
              border-color: #8b5cf6 !important;
            }

            /* Segmented Toggles */
            .ptab-segmented {
              display: inline-flex;
              border: 1px solid var(--border-slate-200);
              border-radius: 8px;
              overflow: hidden;
              background: var(--bg-pure-white);
            }
            .ptab-segmented button {
              width: 32px;
              height: 32px;
              border: none;
              background: transparent;
              cursor: pointer;
              color: var(--text-slate-400);
              display: inline-flex;
              align-items: center;
              justify-content: center;
              transition: all 0.15s ease;
            }
            .ptab-segmented button:hover {
              color: var(--text-slate-600);
              background: var(--bg-slate-50);
            }
            .ptab-segmented button.is-active {
              background: var(--bg-blue-50) !important;
              color: #3b82f6 !important;
            }
            [data-theme='dark'] .ptab-segmented {
              border-color: var(--border-slate-200);
              background: var(--bg-secondary);
            }
            [data-theme='dark'] .ptab-segmented button.is-active {
              background: rgba(59, 130, 246, 0.15) !important;
              color: #60a5fa !important;
            }
            @media (max-width: 900px) {
              .cd-tabs.ant-tabs > .ant-tabs-nav {
                width: 150px;
                padding: 8px 4px !important;
              }
              .cd-tabs.ant-tabs::before {
                width: 150px;
              }
              .cd-tabs .ant-tabs-content-holder {
                padding: 0 12px !important;
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
              gap: 10px;
              margin-bottom: 12px;
            }
            @media (max-width: 1300px) {
              .cd-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 600px) {
              .cd-stat-grid { grid-template-columns: 1fr; }
            }
            .cd-stat-card {
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-200);
              border-radius: 0;
              padding: 12px 14px;
              min-height: 92px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              gap: 10px;
              box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
              transition: all 0.2s ease;
            }
            .cd-stat-card:hover {
              border-color: var(--border-slate-300);
            }
            .cd-stat-glow {
              display: none;
            }
            .cd-stat-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .cd-stat-left {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .cd-stat-icon {
              width: 26px;
              height: 26px;
              border-radius: 8px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .cd-trend {
              display: inline-flex;
              align-items: center;
              gap: 2px;
              font-size: 10.5px;
              font-weight: 700;
              color: #10b981;
              background: rgba(16, 185, 129, 0.10);
              border-radius: 0;
              padding: 1px 6px;
            }
            .cd-trend.up { background: rgba(16, 185, 129, 0.1); color: #10b981; }
            .cd-trend.down { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
            .cd-stat-label {
              font-size: 12px;
              font-weight: 600;
              color: var(--text-slate-600);
            }
            .cd-stat-bottom {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 8px;
            }
            .cd-stat-value {
              font-size: 23px;
              font-weight: 800;
              color: var(--text-slate-900);
              letter-spacing: -0.02em;
              line-height: 1;
            }
            .cd-stat-subtle {
              font-size: 11px;
              color: var(--text-slate-400);
              font-weight: 500;
            }

            /* ---------- Section grid ---------- */
            .cd-section-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }
            @media (max-width: 1200px) {
              .cd-section-grid { grid-template-columns: 1fr; }
            }
            .cd-section {
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-200);
              border-radius: 0;
              overflow: hidden;
              box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
              transition: box-shadow 0.2s ease, border-color 0.2s ease;
            }
            .cd-section:hover {
              box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
            }
            .cd-section-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 8px 12px;
              border-bottom: 1px solid var(--border-slate-200);
              background: var(--bg-slate-50);
            }
            .cd-section-titlewrap {
              display: flex;
              align-items: center;
              gap: 12px;
              min-width: 0;
            }
            .cd-section-icon {
              width: 28px;
              height: 28px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .cd-section-title {
              font-size: 13.5px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.01em;
              line-height: 1.2;
            }
            .cd-section-desc {
              font-size: 11px;
              color: var(--text-slate-500);
              font-weight: 500;
              margin-top: 1px;
            }
            .cd-edit-toggle {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 3px 8px;
              border-radius: 8px;
              background: var(--bg-slate-100);
              border: 1px solid var(--border-slate-200);
              color: var(--text-slate-500);
              font-size: 11px;
              font-weight: 600;
              transition: all 0.18s ease;
            }
            .cd-edit-toggle.on {
              background: rgba(59, 130, 246, 0.08);
              border-color: rgba(59, 130, 246, 0.2);
              color: #3b82f6;
            }
            .cd-edit-toggle .cd-switch.ant-switch-checked {
              background: #3b82f6 !important;
            }
            .cd-section-body {
              padding: 12px;
            }

            /* ---------- Field grid ---------- */
            .cd-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px 16px;
            }
            @media (max-width: 600px) {
              .cd-grid { grid-template-columns: 1fr; }
            }
            .cd-field { min-width: 0; }
            .cd-field-label {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              font-size: 10px;
              font-weight: 700;
              color: var(--text-slate-500);
              text-transform: uppercase;
              letter-spacing: 0.06em;
              margin-bottom: 4px;
            }
            .cd-field-label svg {
              opacity: 0.75;
            }
            .cd-field-content {
              font-size: 13px;
              color: var(--text-slate-900);
              font-weight: 500;
              min-height: 22px;
            }
            .cd-field-value {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 2px 4px 2px 0;
              border-radius: 0;
              line-height: 1.3;
              transition: all 0.15s ease;
              max-width: 100%;
            }
            .cd-field-value.editable {
              cursor: pointer;
              padding: 2px 6px;
              margin-left: -6px;
            }
            .cd-field-value.editable:hover {
              background: rgba(59, 130, 246, 0.08);
            }
            .cd-field-value.editable:hover .cd-pencil {
              opacity: 1;
            }
            .cd-field-value.mono {
              font-family: ui-monospace, "SF Mono", Menlo, monospace;
              font-size: 12px;
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
              color: #3b82f6;
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
              border-radius: 0 !important;
              font-size: 12.5px !important;
              border-color: rgba(59, 130, 246, 0.4) !important;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
              min-width: 140px !important;
            }
            .cd-edit-btn {
              width: 24px;
              height: 24px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border: 0;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.15s ease;
              padding: 0;
              flex-shrink: 0;
            }
            .cd-edit-btn.save {
              background: #10b981;
              color: #fff;
              box-shadow: none;
            }
            .cd-edit-btn.save:hover { filter: brightness(1.06); transform: translateY(-1px); }
            .cd-edit-btn.cancel {
              background: var(--bg-slate-50);
              color: var(--text-slate-500);
              border: 1px solid var(--border-slate-200);
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
              padding: 1px 6px;
              border-radius: 0;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-200);
              color: var(--text-slate-700);
              font-size: 11px;
              font-weight: 600;
            }
            .cd-mini-tag.accent {
              background: rgba(59, 130, 246, 0.08);
              border-color: rgba(59, 130, 246, 0.2);
              color: #3b82f6;
            }
            .cd-code-chip {
              display: inline-flex;
              align-items: center;
              padding: 1px 6px;
              border-radius: 0;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-200);
              font-family: ui-monospace, "SF Mono", Menlo, monospace;
              font-size: 11.5px;
              color: var(--text-slate-700);
              font-weight: 600;
              letter-spacing: 0.02em;
            }
            .cd-currency-tag {
              display: inline-flex;
              align-items: center;
              padding: 1px 6px;
              border-radius: 0;
              background: rgba(16, 185, 129, 0.08);
              border: 1px solid rgba(16, 185, 129, 0.2);
              color: #059669;
              font-size: 11px;
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
              width: 20px;
              height: 20px;
              border-radius: 0;
              color: var(--text-slate-400);
              transition: all 0.15s ease;
              flex-shrink: 0;
            }
            .cd-website-go:hover {
              background: rgba(59, 130, 246, 0.08);
              color: #3b82f6;
            }

            /* ---------- Dark theme adjustments ---------- */
            [data-theme="dark"] .cd-back,
            [data-theme="dark"] .cd-secondary-btn {
              background: var(--bg-secondary) !important;
            }
            [data-theme="dark"] .cd-stat-card,
            [data-theme="dark"] .cd-section {
              background: var(--bg-pure-white) !important;
              border-color: var(--border-slate-200) !important;
            }
            [data-theme="dark"] .cd-section-header {
              background: var(--bg-slate-50) !important;
              border-color: var(--border-slate-200) !important;
            }
            [data-theme="dark"] .cd-edit-toggle {
              background: var(--bg-primary);
            }
            [data-theme="dark"] .cd-mini-tag,
            [data-theme="dark"] .cd-code-chip {
              background: var(--bg-primary);
            }
            [data-theme="dark"] .cd-tab-count {
              background: transparent;
              color: var(--text-slate-400);
            }
            [data-theme="dark"] .cd-field-value.editable:hover {
              background: rgba(59, 130, 246, 0.16);
            }
 
            /* Global dark theme support for card views in all tabs */
            [data-theme="dark"] .pc-card {
              border-color: var(--border-slate-200) !important;
              background: var(--bg-pure-white) !important;
            }
            [data-theme="dark"] .pc-card:hover {
              border-color: #cbd5e1 !important;
              box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06) !important;
            }
            [data-theme="dark"] .pc-foot {
              border-color: var(--border-slate-200) !important;
              background: var(--bg-slate-50) !important;
            }
            [data-theme="dark"] .pc-foot-row {
              border-color: var(--border-slate-200) !important;
            }
            [data-theme="dark"] .pc-foot-row + .pc-foot-row {
              border-color: var(--border-slate-200) !important;
            }
            [data-theme="dark"] .pc-foot-item {
              color: var(--text-slate-700) !important;
            }
            [data-theme="dark"] .pc-foot-div {
              background: var(--border-slate-300, #cbd5e1) !important;
            }
            [data-theme="dark"] .pc-title {
              color: var(--text-slate-900) !important;
            }
            [data-theme="dark"] .pc-client-val {
              color: var(--text-slate-700) !important;
            }
            [data-theme="dark"] .pc-actions:hover {
              background: var(--bg-slate-100) !important;
              color: var(--text-slate-900) !important;
            }
            [data-theme="dark"] .pp-action-pop .ant-dropdown-menu {
              background: var(--bg-pure-white) !important;
              border-color: var(--border-slate-100) !important;
            }
            [data-theme="dark"] .pp-action-pop .ant-dropdown-menu-item:hover {
              background: var(--bg-slate-50) !important;
            }

            /* ===================================================== */
            /*  Premium Modal (.pmodal) — used by Add/Create dialogs  */
            /* ===================================================== */
            .pmodal .ant-modal-content {
              padding: 0 !important;
              border-radius: 0 !important;
              overflow: hidden;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-200);
              box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.25);
            }
            .pmodal .ant-modal-close {
              top: 10px !important;
              right: 10px !important;
              width: 28px !important;
              height: 28px !important;
              border-radius: 0 !important;
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
              padding: 14px 18px;
              overflow: hidden;
              background: var(--bg-slate-900);
              color: #fff;
            }
            .pmodal-hero-mesh {
              display: none;
            }
            .pmodal-hero-blob {
              display: none;
            }
            .pmodal-hero-content {
              position: relative;
              z-index: 1;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .pmodal-hero-icon {
              width: 36px;
              height: 36px;
              border-radius: 0;
              background: rgba(255, 255, 255, 0.14);
              border: 1px solid rgba(255, 255, 255, 0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              box-shadow: none;
              flex-shrink: 0;
            }
            .pmodal-hero-title {
              font-size: 15px;
              font-weight: 700;
              letter-spacing: -0.015em;
              color: #fff;
              line-height: 1.2;
            }
            .pmodal-hero-sub {
              font-size: 11.5px;
              color: rgba(226, 232, 240, 0.78);
              margin-top: 2px;
              font-weight: 500;
            }
            .pmodal-body {
              padding: 14px 18px 6px;
              background: var(--bg-pure-white);
              max-height: 65vh;
              overflow-y: auto;
            }
            .pmodal-body .ant-form-item-label {
              padding-bottom: 2px !important;
            }
            .pmodal-body .ant-form-item-label > label {
              font-size: 10px !important;
              font-weight: 700 !important;
              color: var(--text-slate-500) !important;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              height: auto !important;
            }
            .pmodal-body .ant-form-item-label > label::before {
              color: #ef4444 !important;
            }
            .pmodal-body .ant-form-item-explain,
            .pmodal-body .ant-form-item-explain-error {
              padding-top: 4px !important;
              font-size: 11.5px !important;
              position: relative !important;
              clear: both !important;
            }
            .pmodal-body .ant-input,
            .pmodal-body .ant-input-affix-wrapper,
            .pmodal-body .ant-select-selector,
            .pmodal-body .ant-picker,
            .pmodal-body .ant-input-number,
            .pmodal-body .ant-input-number-input,
            .pmodal-body .ant-input-number-affix-wrapper {
              border-radius: 0 !important;
              border: 1px solid var(--border-slate-200) !important;
              background: var(--bg-slate-50) !important;
              transition: all 0.18s ease !important;
              min-height: 36px !important;
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
            .pmodal-body .ant-input-affix-wrapper-focused,
            .pmodal-body .ant-input:hover,
            .pmodal-body .ant-select:hover .ant-select-selector,
            .pmodal-body .ant-picker:hover,
            .pmodal-body .ant-input-number:hover {
              border-color: rgba(59, 130, 246, 0.45) !important;
            }
            .pmodal-body .ant-input-affix-wrapper-focused,
            .pmodal-body .ant-select-focused .ant-select-selector,
            .pmodal-body .ant-picker-focused,
            .pmodal-body .ant-input-number-focused {
              border-color: #3b82f6 !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
            }
            .pmodal-section-label {
              display: flex;
              align-items: center;
              gap: 8px;
              margin: 4px 0 10px 0;
              font-size: 10px;
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
                var(--border-slate-200) 0%,
                transparent 100%
              );
            }
            .pmodal-section-label svg {
              color: #3b82f6;
              flex-shrink: 0;
            }
            .pmodal-footer {
              display: flex;
              justify-content: flex-end;
              align-items: center;
              gap: 8px;
              padding: 10px 18px 12px;
              border-top: 1px solid var(--border-slate-200);
              background: var(--bg-slate-50);
            }
            .pmodal-footer-hint {
              margin-right: auto;
              font-size: 11px;
              color: var(--text-slate-500);
              font-weight: 500;
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            .pmodal-btn-cancel {
              height: 32px !important;
              border-radius: 0 !important;
              font-weight: 600 !important;
              padding: 0 14px !important;
              background: var(--bg-pure-white) !important;
              border: 1px solid var(--border-slate-200) !important;
              color: var(--text-slate-700) !important;
              transition: all 0.18s ease !important;
            }
            .pmodal-btn-cancel:hover {
              border-color: var(--border-slate-300) !important;
              color: var(--text-slate-900) !important;
            }
            .pmodal-btn-primary {
              height: 32px !important;
              border-radius: 0 !important;
              padding: 0 16px !important;
              font-weight: 700 !important;
              background: #3b82f6 !important;
              border: 0 !important;
              box-shadow: none !important;
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
              top: 8px !important;
              right: 8px !important;
              width: 24px !important;
              height: 24px !important;
              border-radius: 0 !important;
            }
            .pmodal-hero-slim {
              padding: 10px 18px !important;
              background: var(--bg-slate-900) !important;
            }
            .pmodal-hero-slim .pmodal-hero-content { gap: 10px; }
            .pmodal-hero-slim .pmodal-hero-icon {
              width: 30px !important;
              height: 30px !important;
              border-radius: 0 !important;
            }
            .pmodal-hero-slim .pmodal-hero-title {
              font-size: 14px !important;
              line-height: 1.2;
            }
            .pmodal-hero-slim .pmodal-hero-sub {
              font-size: 11px !important;
              margin-top: 1px !important;
            }
            .pmodal-body-compact {
              padding: 12px 18px 4px !important;
              max-height: none !important;
            }
            .pmodal-body-compact .ant-form-item {
              margin-bottom: 10px !important;
            }
            .pmodal-body-compact .ant-form-item-label {
              padding-bottom: 2px !important;
            }
            .pmodal-body-compact .ant-form-item-label > label {
              font-size: 10px !important;
              letter-spacing: 0.07em;
            }
            .pmodal-body-compact .ant-input,
            .pmodal-body-compact .ant-input-affix-wrapper,
            .pmodal-body-compact .ant-select-selector,
            .pmodal-body-compact .ant-input-number {
              min-height: 32px !important;
              font-size: 12.5px !important;
            }
            .pmodal-segmented.ant-segmented {
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-200) !important;
              padding: 2px !important;
              border-radius: 0 !important;
              height: 32px !important;
            }
            .pmodal-segmented .ant-segmented-item {
              border-radius: 0 !important;
              min-height: 26px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-size: 11.5px !important;
              font-weight: 600 !important;
            }
            .pmodal-segmented .ant-segmented-item-selected {
              background: #3b82f6 !important;
              color: #fff !important;
              box-shadow: none !important;
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
              padding: 10px 18px 12px !important;
              gap: 6px !important;
            }
            .pmodal-footer-compact .pmodal-btn-cancel,
            .pmodal-footer-compact .pmodal-btn-primary {
              height: 30px !important;
              padding: 0 12px !important;
              font-size: 12px !important;
            }

            /* ============================================================ */
            /*  Step bands — used by multi-section forms inside pmodal      */
            /* ============================================================ */
            .pmodal-step-band {
              display: flex;
              align-items: center;
              gap: 8px;
              margin: 4px 0 8px;
              padding: 4px 8px;
              border-radius: 0;
              background: rgba(59, 130, 246, 0.04);
              border: 1px solid var(--border-slate-200);
            }
            .pmodal-step-band:first-of-type { margin-top: 0; }
            .pmodal-step-num {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 20px;
              height: 20px;
              padding: 0 4px;
              border-radius: 0;
              background: #3b82f6;
              color: #fff;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.04em;
              font-variant-numeric: tabular-nums;
              box-shadow: none;
            }
            .pmodal-step-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 16px;
              height: 16px;
              border-radius: 0;
              background: rgba(59, 130, 246, 0.08);
              color: #3b82f6;
            }
            .pmodal-step-text {
              font-size: 10px;
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
              border-radius: 0 !important;
              overflow: hidden;
              background: var(--bg-pure-white);
              border: 1px solid var(--border-slate-200);
              box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.25);
            }
            .doc-preview-modal .ant-modal-close {
              top: 10px !important;
              right: 10px !important;
              width: 28px !important;
              height: 28px !important;
              border-radius: 0 !important;
              background: var(--bg-slate-50) !important;
              color: var(--text-slate-700) !important;
              z-index: 10;
            }
            .doc-preview-modal .ant-modal-close:hover {
              background: var(--bg-pure-white) !important;
              color: #3b82f6 !important;
            }

            /* Header */
            .doc-preview-head {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 10px 48px 10px 14px;
              border-bottom: 1px solid var(--border-slate-200);
              background: var(--bg-pure-white);
            }
            .doc-preview-icon {
              width: 32px;
              height: 32px;
              border-radius: 0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: var(--bg-slate-50);
              color: var(--text-slate-600);
              box-shadow: none;
              flex-shrink: 0;
            }
            .doc-preview-info {
              flex: 1;
              min-width: 0;
            }
            .doc-preview-name {
              font-size: 14px;
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
              margin-top: 2px;
            }
            .doc-preview-tag {
              display: inline-flex;
              align-items: center;
              padding: 1px 6px;
              border-radius: 0;
              background: var(--bg-slate-50);
              border: 1px solid var(--border-slate-200);
              font-size: 10px;
              font-weight: 700;
              color: var(--text-slate-700);
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .doc-preview-source {
              display: inline-flex;
              align-items: center;
              gap: 5px;
              padding: 1px 6px;
              border-radius: 0;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }
            .doc-preview-source.external {
              background: rgba(59, 130, 246, 0.08);
              color: #3b82f6;
              border: 1px solid rgba(59, 130, 246, 0.2);
            }
            .doc-preview-source.uploaded {
              background: rgba(16, 185, 129, 0.08);
              color: #059669;
              border: 1px solid rgba(16, 185, 129, 0.2);
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
              height: 28px !important;
              border-radius: 0 !important;
              padding: 0 10px !important;
              font-weight: 600 !important;
              font-size: 12px !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
              border: 1px solid var(--border-slate-200) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
            }
            .doc-preview-btn.pmodal-btn-primary {
              background: #3b82f6 !important;
              border: 0 !important;
              color: #fff !important;
              box-shadow: none !important;
            }
            .doc-preview-btn:hover {
              border-color: rgba(59, 130, 246, 0.45) !important;
              color: #3b82f6 !important;
            }
            .doc-preview-btn.pmodal-btn-primary:hover {
              filter: brightness(1.05);
              color: #fff !important;
            }
            .doc-preview-icon-btn {
              width: 28px !important;
              height: 28px !important;
              border-radius: 0 !important;
              border: 1px solid var(--border-slate-200) !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-500) !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 0 !important;
            }
            .doc-preview-icon-btn:hover {
              border-color: rgba(59, 130, 246, 0.45) !important;
              color: #3b82f6 !important;
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
              border-radius: 0;
              box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
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
              width: 44px;
              height: 44px;
              border-radius: 0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: rgba(245, 158, 11, 0.08);
              color: #d97706;
              margin-bottom: 4px;
            }
            .doc-preview-fb-title {
              font-size: 14px;
              font-weight: 700;
              color: var(--text-slate-900);
            }
            .doc-preview-fb-desc {
              font-size: 12px;
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
              padding: 8px 14px;
              border-top: 1px solid var(--border-slate-200);
              background: var(--bg-slate-50);
            }
            .doc-preview-foot-hint {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 11px;
              color: var(--text-slate-500);
              font-weight: 500;
            }
            .doc-preview-foot-link {
              height: 26px !important;
              border-radius: 0 !important;
              border: 1px solid var(--border-slate-200) !important;
              font-size: 11px !important;
              font-weight: 600 !important;
              background: var(--bg-pure-white) !important;
              color: var(--text-slate-700) !important;
              padding: 0 8px !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 5px !important;
            }
            .doc-preview-foot-link:hover {
              border-color: rgba(59, 130, 246, 0.45) !important;
              color: #3b82f6 !important;
            }

            /* Dark theme */
            [data-theme='dark'] .doc-preview-modal .ant-modal-content {
              background: var(--bg-secondary);
              border-color: var(--border-color);
              box-shadow: none;
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
              border-color: var(--border-slate-700);
            }
            [data-theme='dark'] .doc-preview-source.external {
              background: rgba(59, 130, 246, 0.12);
              color: #60a5fa;
              border-color: rgba(59, 130, 246, 0.25);
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
              border-color: var(--border-slate-700) !important;
            }
            [data-theme='dark'] .doc-preview-btn:hover,
            [data-theme='dark'] .doc-preview-icon-btn:hover,
            [data-theme='dark'] .doc-preview-foot-link:hover {
              color: #60a5fa !important;
              border-color: rgba(59, 130, 246, 0.45) !important;
            }
            [data-theme='dark'] .doc-preview-btn.pmodal-btn-primary {
              color: #fff !important;
            }

            /* ============================================================ */
            /*  Add New Document modal — inline label help, source toggle,  */
            /*  refined dragger, selected-file card, URL mode               */
            /* ============================================================ */
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
              font-size: 10px;
              font-weight: 500;
              color: var(--text-slate-500);
              text-transform: none;
              letter-spacing: 0;
              line-height: 1.3;
            }
            .pmodal .ant-form-item-label > label {
              width: 100%;
            }
            .pmodal .ant-form-item-label > label::after { display: none !important; }

            /* Source toggle */
            .doc-source-toggle.ant-segmented {
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-200) !important;
              padding: 2px !important;
              border-radius: 0 !important;
            }
            .doc-source-toggle .ant-segmented-item {
              border-radius: 0 !important;
              min-height: 28px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .doc-source-opt {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              font-size: 11.5px;
              font-weight: 600;
            }
            .doc-source-toggle .ant-segmented-item-selected {
              background: #3b82f6 !important;
              color: #fff !important;
              box-shadow: none !important;
            }
            .doc-source-toggle .ant-segmented-item-selected .ant-segmented-item-label,
            .doc-source-toggle .ant-segmented-item-selected .doc-source-opt {
              color: #fff !important;
            }

            /* Refined dragger */
            .doc-dragger.ant-upload-wrapper .ant-upload-drag {
              border-radius: 0 !important;
              border: 1px dashed var(--border-slate-300) !important;
              background: var(--bg-slate-50) !important;
              transition: all .2s ease;
            }
            .doc-dragger.ant-upload-wrapper .ant-upload-drag:hover {
              border-color: #3b82f6 !important;
              background: rgba(59, 130, 246, 0.04) !important;
              transform: translateY(-1px);
              box-shadow: none;
            }
            .doc-dragger.ant-upload-wrapper .ant-upload-drag-icon { margin-bottom: 0 !important; }
            .doc-dragger-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
              padding: 14px 12px;
            }
            .doc-dragger-icon {
              width: 40px;
              height: 40px;
              border-radius: 0;
              background: #3b82f6;
              color: #fff;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              box-shadow: none;
              margin-bottom: 4px;
            }
            .doc-dragger-title {
              font-size: 13px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
            }
            .doc-dragger-sub {
              font-size: 11px;
              color: var(--text-slate-500);
              font-weight: 500;
              margin-top: 2px;
            }

            /* Selected file card */
            .doc-file-card {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 8px 10px;
              border-radius: 0;
              border: 1px solid rgba(59, 130, 246, 0.2);
              background: rgba(59, 130, 246, 0.04);
            }
            .doc-file-icon {
              width: 32px;
              height: 32px;
              border-radius: 0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: #3b82f6;
              color: #fff;
              flex-shrink: 0;
              box-shadow: none;
            }
            .doc-file-meta {
              flex: 1;
              min-width: 0;
            }
            .doc-file-name {
              font-size: 12.5px;
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
              padding: 1px 6px;
              border-radius: 0;
              font-size: 10px;
              font-weight: 700;
              letter-spacing: 0.02em;
            }
            .doc-file-tag.ok {
              background: rgba(16, 185, 129, 0.08);
              color: #059669;
            }
            .doc-file-size {
              font-size: 11px;
              color: var(--text-slate-500);
              font-weight: 500;
              font-variant-numeric: tabular-nums;
            }
            .doc-file-remove {
              width: 24px;
              height: 24px;
              border: 1px solid var(--border-slate-200);
              background: var(--bg-pure-white);
              border-radius: 0;
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
              border-color: var(--border-slate-700) !important;
            }
            [data-theme='dark'] .doc-dragger.ant-upload-wrapper .ant-upload-drag {
              background: var(--bg-primary) !important;
              border-color: var(--border-slate-700) !important;
            }
            [data-theme='dark'] .doc-dragger.ant-upload-wrapper .ant-upload-drag:hover {
              border-color: #3b82f6 !important;
            }
            [data-theme='dark'] .doc-file-card {
              background: rgba(59, 130, 246, 0.08);
              border-color: rgba(59, 130, 246, 0.3);
            }
            [data-theme='dark'] .doc-file-remove {
              background: var(--bg-secondary);
              border-color: var(--border-slate-700);
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
              padding: 6px 8px 2px !important;
              background: transparent !important;
            }
            .doc-autocomplete-popup .ant-select-item-option {
              padding: 6px 10px !important;
              border-radius: 0 !important;
              margin: 0 !important;
              transition: all .15s ease;
            }
            .doc-autocomplete-popup .ant-select-item-option-active {
              background: rgba(59, 130, 246, 0.08) !important;
            }
            .doc-autocomplete-popup .ant-select-item-option-selected {
              background: rgba(59, 130, 246, 0.12) !important;
              color: #3b82f6 !important;
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
              font-size: 10px;
              font-weight: 500;
              color: var(--text-slate-500);
              letter-spacing: 0.02em;
            }
            .doc-opt-custom {
              display: inline-flex;
              align-items: center;
              padding: 1px 6px;
              border-radius: 0;
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              background: rgba(16, 185, 129, 0.08);
              color: #059669;
              border: 1px solid rgba(16, 185, 129, 0.2);
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
              color: #60a5fa !important;
            }
            [data-theme='dark'] .doc-opt-custom {
              background: rgba(52, 211, 153, 0.15);
              color: #34d399;
              border-color: rgba(52, 211, 153, 0.25);
            }

            /* Live availability check suffix (Project name/code) */
            .pmodal-check {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 20px;
              border-radius: 0;
              transition: all 0.2s ease;
            }
            .pmodal-check.ok {
              background: rgba(16, 185, 129, 0.08);
              color: #059669;
            }
            .pmodal-check.bad {
              background: rgba(239, 68, 68, 0.08);
              color: #dc2626;
              animation: cd-shake 0.32s cubic-bezier(.36,.07,.19,.97);
            }
            .pmodal-check.spin {
              background: rgba(59, 130, 246, 0.08);
              color: #3b82f6;
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
            [data-theme='dark'] .pmodal-check.ok { background: rgba(16, 185, 129, 0.15); color: #34d399; }
            [data-theme='dark'] .pmodal-check.bad { background: rgba(239, 68, 68, 0.15); color: #f87171; }
            [data-theme='dark'] .pmodal-check.spin { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
            [data-theme='dark'] .pmodal-check-hint.ok { color: #34d399; }

            /* ============================================================ */
            /*  Project modal — slightly wider feel, refined date inputs    */
            /* ============================================================ */
            .pmodal-project .pmodal-body-compact .ant-input-number-group-addon {
              border-radius: 0 !important;
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-200) !important;
              border-right: 0 !important;
              padding: 0 6px !important;
            }
            .pmodal-project .pmodal-body-compact .ant-input-number-group-wrapper .ant-input-number {
              border-radius: 0 !important;
            }
            .pmodal-project .pmodal-body-compact .ant-picker {
              width: 100% !important;
            }

            [data-theme='dark'] .pmodal-step-band {
              background: rgba(59, 130, 246, 0.08);
              border-color: var(--border-slate-700);
            }
            [data-theme='dark'] .pmodal-step-text { color: var(--text-slate-400); }
            [data-theme='dark'] .pmodal-step-icon {
              background: rgba(59, 130, 246, 0.15);
              color: #60a5fa;
            }
            [data-theme='dark'] .pmodal-project .pmodal-body-compact .ant-input-number-group-addon {
              background: var(--bg-primary) !important;
              border-color: var(--border-slate-700) !important;
              color: var(--text-slate-400) !important;
            }

            /* Dark theme — compact modal polish */
            [data-theme='dark'] .pmodal-compact .ant-modal-content {
              background: var(--bg-secondary) !important;
              border: 1px solid var(--border-color) !important;
              box-shadow: none !important;
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
              background: var(--bg-slate-900) !important;
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
              border-color: var(--border-slate-700) !important;
              color: var(--text-slate-200) !important;
            }
            [data-theme='dark'] .pmodal-body-compact .ant-input::placeholder,
            [data-theme='dark'] .pmodal-body-compact .ant-input-number-input::placeholder {
              color: var(--text-slate-500) !important;
            }
            [data-theme='dark'] .pmodal-body-compact .ant-input-affix-wrapper:hover,
            [data-theme='dark'] .pmodal-body-compact .ant-input-affix-wrapper-focused,
            [data-theme='dark'] .pmodal-body-compact .ant-input:hover,
            [data-theme='dark'] .pmodal-body-compact .ant-input-number:hover {
              border-color: rgba(59, 130, 246, 0.45) !important;
            }
            [data-theme='dark'] .pmodal-body-compact .ant-input-affix-wrapper-focused,
            [data-theme='dark'] .pmodal-body-compact .ant-input-number-focused {
              border-color: #3b82f6 !important;
              background: var(--bg-secondary) !important;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
            }
            [data-theme='dark'] .pmodal-segmented.ant-segmented {
              background: var(--bg-primary) !important;
              border-color: var(--border-slate-700) !important;
            }
            [data-theme='dark'] .pmodal-segmented .ant-segmented-item {
              color: var(--text-slate-400) !important;
            }
            [data-theme='dark'] .pmodal-segmented .ant-segmented-item:hover:not(.ant-segmented-item-selected) {
              color: var(--text-slate-200) !important;
            }
            [data-theme='dark'] .pmodal-segmented .ant-segmented-item-selected {
              background: #3b82f6 !important;
              box-shadow: none !important;
            }
            [data-theme='dark'] .pmodal-footer-compact {
              background: var(--bg-primary) !important;
              border-top: 1px solid var(--border-color);
            }
            [data-theme='dark'] .pmodal-footer-compact .pmodal-btn-cancel {
              background: var(--bg-secondary) !important;
              border-color: var(--border-slate-700) !important;
              color: var(--text-slate-400) !important;
            }
            [data-theme='dark'] .pmodal-footer-compact .pmodal-btn-cancel:hover {
              border-color: rgba(59, 130, 246, 0.45) !important;
              color: #fff !important;
            }

            .pmodal .ant-upload.ant-upload-drag {
              border-radius: 0 !important;
              background: var(--bg-slate-50) !important;
              border: 1px dashed var(--border-slate-300) !important;
              transition: all 0.2s ease !important;
            }
            .pmodal .ant-upload.ant-upload-drag:hover {
              border-color: #3b82f6 !important;
              background: rgba(59, 130, 246, 0.04) !important;
            }

            /* Dark theme */
            [data-theme="dark"] .pmodal .ant-modal-content {
              background: var(--bg-secondary);
              border-color: var(--border-color);
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
              border-color: var(--border-slate-700) !important;
            }
            [data-theme="dark"] .pmodal-body .ant-input-affix-wrapper-focused,
            [data-theme="dark"] .pmodal-body .ant-select-focused .ant-select-selector,
            [data-theme="dark"] .pmodal-body .ant-picker-focused,
            [data-theme="dark"] .pmodal-body .ant-input-number-focused {
              background: var(--bg-secondary) !important;
              border-color: #3b82f6 !important;
            }
            [data-theme="dark"] .pmodal-footer {
              background: var(--bg-primary);
              border-color: var(--border-color);
            }
            [data-theme="dark"] .pmodal-btn-cancel {
              background: var(--bg-secondary) !important;
              border-color: var(--border-slate-700) !important;
              color: var(--text-slate-400) !important;
            }
            [data-theme="dark"] .pmodal .ant-upload.ant-upload-drag {
              background: var(--bg-primary) !important;
              border-color: var(--border-slate-700) !important;
            }

            /* ============================================================ */
            /* Premium tab shell — shared by Contacts, Allocations,         */
            /* Projects, and Documents tabs                                  */
            /* ============================================================ */
            .ptab-card {
              border-radius: 0 !important;
              border: 1px solid var(--border-slate-200) !important;
              background: var(--bg-pure-white) !important;
              box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04) !important;
              overflow: hidden;
            }
            .ptab-card .ant-card-body { padding: 0 !important; }

            .ptab-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 10px 16px;
              border-bottom: 1px solid var(--border-slate-200);
              flex-wrap: wrap;
            }
            .ptab-header-left {
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 0;
              flex: 1;
            }
            .ptab-header-icon {
              width: 30px; height: 30px;
              border-radius: 8px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              color: var(--text-slate-600);
              background: var(--bg-slate-50);
              box-shadow: none !important;
            }
            .ptab-header-icon.violet,
            .ptab-header-icon.green,
            .ptab-header-icon.blue,
            .ptab-header-icon.amber {
              background: var(--bg-slate-50) !important;
              color: var(--text-slate-600) !important;
              box-shadow: none !important;
            }
            [data-theme='dark'] .ptab-header-icon {
              background: var(--bg-slate-800) !important;
              color: var(--text-slate-300) !important;
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
              gap: 6px;
              font-size: 14px;
              font-weight: 700;
              color: var(--text-slate-900);
              letter-spacing: -0.005em;
              line-height: 1.2;
            }
            .ptab-header-count {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 20px;
              height: 18px;
              padding: 0 6px;
              border-radius: 6px;
              background: var(--bg-slate-100);
              border: 1px solid var(--border-slate-200);
              color: var(--text-slate-600);
              font-size: 10px;
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
              height: 32px !important;
              border-radius: 0 !important;
              background: var(--bg-slate-50) !important;
              border: 1px solid var(--border-slate-200) !important;
              transition: all .2s ease;
            }
            .ptab-search.ant-input-affix-wrapper:focus-within {
              border-color: #3b82f6 !important;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
              background: var(--bg-pure-white) !important;
            }
            .ptab-search .ant-input {
              background: transparent !important;
              font-size: 13px;
              font-weight: 500;
            }
            .ptab-primary-btn {
              height: 32px !important;
              border-radius: 0 !important;
              padding: 0 14px !important;
              font-weight: 600 !important;
              display: inline-flex !important;
              align-items: center !important;
              gap: 6px !important;
              background: #3b82f6 !important;
              border: 1px solid #3b82f6 !important;
              box-shadow: none !important;
              color: #fff !important;
              transition: all .2s ease;
            }
            .ptab-primary-btn:hover {
              background: #2563eb !important;
              border-color: #2563eb !important;
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
              background: #3b82f6;
              opacity: 0;
              transition: opacity .2s ease;
              pointer-events: none;
            }
            .premium-table .ant-table-tbody > tr:hover > td:first-child::before {
              opacity: 1;
            }

            /* Premium avatar in tab tables */
            .ptab-avatar {
              width: 32px; height: 32px;
              border-radius: 0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: 600;
              font-size: 11.5px;
              letter-spacing: 0.02em;
              box-shadow: none;
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
              width: 48px; height: 48px;
              border-radius: 0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: var(--bg-slate-100);
              border: 1px solid var(--border-slate-200);
              color: var(--text-slate-500);
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

            [data-theme='dark'] .ptab-card { background: var(--bg-pure-white) !important; }
            [data-theme='dark'] .ptab-search.ant-input-affix-wrapper { background: var(--bg-secondary) !important; }
            [data-theme='dark'] .ptab-header-count { background: var(--bg-secondary); }
          `}</style>
          <TransactionHistoryDrawer
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            entityType="client"
            entityId={client.id}
            subtitle={client.companyName}
          />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
