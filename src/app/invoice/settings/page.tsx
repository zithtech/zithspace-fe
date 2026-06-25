"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ReloadOutlined } from "@ant-design/icons";
import {
  Typography,
  Button,
  Input,
  Modal,
  Table,
  message,
  Spin,
  Drawer,
  Tooltip,
  Select,
  Skeleton,
  Dropdown,
} from "antd";

import {
  Plus,
  Trash2,
  Edit,
  ShieldCheck,
  CheckCircle2,
  Settings as SettingsIcon,
  ArrowLeft,
  Building2,
  ReceiptText,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Info,
  ShieldAlert,
  Eye,
  PenTool,
  Check,
  MapPin,
  Landmark,
  QrCode,
  Building,
  AlertCircle,
  X,
  Power,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
} from "lucide-react";
import GeneralSettings from "./GeneralSettings";
import InvoiceSetting from "./InvoiceSetting";
import { useActivateSettingsProfile } from "@/hooks/useInvoiceSettings";

import {
  Draft,
  Currency,
  DateFormat,
} from "@/types/invoice";

import BankPaymentSettings from "./PaymentSetting";
import {
  useSettingsProfiles,
  useDeleteSettingsProfile,
  useCreateSettingsProfile,
  useUpdateSettingsProfile,
} from "@/hooks/useInvoiceSettings";
import { useActivitySource } from "@/hooks/useActivitySource";

const { Title } = Typography;

const CARD_ACCENTS: [string, string][] = [
  ['#3b82f6', '#2563eb'], // blue
  ['#10b981', '#059669'], // green
  ['#64748b', '#475569'], // grey
];

const accentFor = (key: string): [string, string] => {
  return ['#3b82f6', '#2563eb'];
};

const initialsOf = (name: string) =>
  (name || '—')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const DEFAULT_DRAFT: Draft = {
  general: {
    companyName: "",
    address: {
      plot_no: "",
      floor_no: "",
      building_name: "",
      street: "",
      area: "",
      city: "",
      pincode: "",
      country: "",
    },
    primaryColor: "#1890ff",
    companyLogo: null,
    currency: Currency.USD,
    dateFormat: DateFormat.MM_DD_YYYY,
    signature: null,
    gstin: null,
    pan: null,
  },
  invoice: {
    format: "INV-{YYYY}-{###}",
  },
  payment: {
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    qrCode: null,
  },
};

export default function InvoiceSettingPage() {
  const router = useRouter();
  const {
    canReadInvoiceSetting,
    canCreateInvoiceSetting,
    canUpdateInvoiceSetting,
    canDeleteInvoiceSetting
  } = usePermission();
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !canReadInvoiceSetting) {
      router.push("/invoice/invoices");
    }
  }, [authLoading, canReadInvoiceSetting, router]);

  // Register UX context for activity logging
  useActivitySource({ section: "FINANCE", module: "Invoices", page: "InvoiceSettingsView" });

  const [mode, setMode] = useState<"view" | "create">("view");
  const { data: savedSettingsData, isLoading, isError, error, refetch, isFetching } =
    useSettingsProfiles();

  const [currentStep, setCurrentStep] = useState(0);
  const createMutation = useCreateSettingsProfile();
  const updateMutation = useUpdateSettingsProfile();
  const deleteMutation = useDeleteSettingsProfile();
  const activateMutation = useActivateSettingsProfile();

  const settingsList = savedSettingsData?.data || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const generalFormRef = useRef<any>(null);
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedProfileForView, setSelectedProfileForView] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const filteredSettings = useMemo(() => {
    return settingsList.filter((s: any) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !q ||
        s.general?.companyName?.toLowerCase().includes(q) ||
        s.invoice?.format?.toLowerCase().includes(q) ||
        s.general?.address?.city?.toLowerCase().includes(q) ||
        s.general?.address?.country?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (statusFilter === "active") return s.isActive;
      if (statusFilter === "inactive") return !s.isActive;
      return true;
    });
  }, [settingsList, searchText, statusFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  const total = filteredSettings.length;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedSettings = useMemo(() => {
    return filteredSettings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredSettings, currentPage, pageSize]);

  const filterPills: { key: "all" | "active" | "inactive"; label: string; count: number }[] = [
    { key: "all", label: "All", count: settingsList.length },
    { key: "active", label: "Active", count: settingsList.filter((s) => s.isActive).length },
    { key: "inactive", label: "Inactive", count: settingsList.filter((s) => !s.isActive).length },
  ];

  const handleEdit = (id: string) => {
    const s = settingsList.find((s) => s.id === id);
    if (!s) return;

    setDraft({
      general: {
        companyName: s.general.companyName,
        address: s.general.address,
        primaryColor: s.general.primaryColor,
        currency: s.general.currency,
        dateFormat: s.general.dateFormat,
        companyLogo: s.general.companyLogo,
        signature: s.general.signature,
        gstin: s.general.gstin,
        pan: s.general.pan,
      },
      invoice: { format: s.invoice.format },
      payment: {
        bankName: s.payment.bankName,
        accountNumber: s.payment.accountNumber,
        ifscCode: s.payment.ifscCode,
        branchName: s.payment.branchName,
        qrCode: s.payment.qrCode,
      },
    });

    setEditingId(id);
    setMode("create");
    setCurrentStep(0);
  };

  const activeSettingsCount = settingsList.filter((s) => s.isActive).length;
  const inactiveCount = settingsList.length - activeSettingsCount;
  const profileToDelete = settingsList.find((s) => s.id === deleteId);

  const resetDraft = () => {
    setDraft(JSON.parse(JSON.stringify(DEFAULT_DRAFT)));
    setEditingId(null);
    setCurrentStep(0);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  const STEP_LABELS = ["General details", "Invoice format", "Payment info"];

  const persistDraft = async ({
    closeOnSuccess,
    label,
  }: {
    closeOnSuccess: boolean;
    label?: string;
  }) => {
    try {
      await generalFormRef.current?.validateFields();
    } catch {
      setCurrentStep(0);
      message.error("Please fix errors in general step");
      return;
    }

    const payload = {
      name: draft.general.companyName || "Untitled",
      general: draft.general,
      invoice: draft.invoice,
      payment: draft.payment,
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            message.success(label ? `${label} saved` : "Settings updated successfully");
            refetch();
            if (closeOnSuccess) {
              resetDraft();
              setMode("view");
            }
          },
          onError: (err: any) => {
            message.error(err?.response?.data?.error || "Update failed");
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          refetch();
          if (closeOnSuccess) {
            resetDraft();
            setMode("view");
          }
        },
        onError: (err) => console.error(err),
      });
    }
  };

  // Stat tile — minimal accent strip
  const StatTile = ({
    label,
    value,
    icon: Icon,
    accent,
  }: {
    label: string;
    value: string | number;
    icon: any;
    accent: string;
  }) => (
    <div
      className="rounded-2xl px-5 py-4 flex items-center gap-4 relative overflow-hidden"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
      }}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: accent }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `${accent}14`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
      >
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </div>
        <div
          className="text-[22px] font-bold leading-tight tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </div>
      </div>
    </div>
  );

  // Step button for sidebar
  const StepButton = ({
    label,
    description,
    icon: Icon,
    active,
    completed,
    onClick,
  }: any) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
      style={{
        background: active ? "var(--bg-blue-50)" : "transparent",
        border: `1px solid ${active ? "var(--border-blue-200)" : "transparent"}`,
        boxShadow: active ? "0 0 0 3px rgba(96,165,250,0.10)" : "none",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={
          active
            ? {
              background: "#2563eb",
              color: "#fff",
            }
            : completed
              ? {
                background: "rgba(16,185,129,0.08)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.25)",
              }
              : {
                background: "var(--bg-slate-50)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
              }
        }
      >
        {completed && !active ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-[13px] font-semibold truncate"
          style={{ color: active ? "var(--text-blue-700)" : "var(--text-primary)" }}
        >
          {label}
        </div>
        <div
          className="text-[11px] truncate"
          style={{ color: "var(--text-secondary)" }}
        >
          {description}
        </div>
      </div>
      {active && (
        <ChevronRight
          size={14}
          style={{ color: "var(--text-blue-700)" }}
          className="flex-shrink-0"
        />
      )}
    </button>
  );

  if (authLoading) {
    return (
      <MainLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Spin tip="Initializing session..." />
        </div>
      </MainLayout>
    );
  }

  if (!canReadInvoiceSetting) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center flex-col gap-3">
          <ShieldAlert size={40} className="text-red-400" />
          <Typography.Text style={{ color: "var(--text-secondary)" }}>
            Access denied.
          </Typography.Text>
          <Button type="link" onClick={() => router.push("/invoice/invoices")}>
            Back to invoices
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
          <Typography.Title level={4} style={{ color: "#ef4444", margin: 0 }}>
            Failed to load settings
          </Typography.Title>
          <Typography.Text
            type="secondary"
            style={{ maxWidth: 400, textAlign: "center" }}
          >
            {(error as any)?.message ||
              "An unexpected error occurred while fetching your invoice settings."}
          </Typography.Text>
          <Button
            type="primary"
            onClick={() => refetch()}
            style={{ borderRadius: 8 }}
          >
            Retry
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="pp-shell">

        {/* ============================ SIDEBAR ============================ */}
        <aside className="pp-sidebar">
          <div className="pp-side-head">
            <div className="pp-side-logo"><SettingsIcon size={20} /></div>
            <div className="pp-side-head-text">
              <div className="pp-side-title">Settings</div>
              <div className="pp-side-subtitle">Profiles · Branding</div>
            </div>
          </div>

          {mode === "view" && canCreateInvoiceSetting && (
            <Button type="primary" icon={<Plus size={14} />} className="pp-create-btn"
              onClick={() => { resetDraft(); setMode("create"); setCurrentStep(0); }}
              block style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              New Profile
            </Button>
          )}
          {mode === "create" && (
            <Button icon={<ArrowLeft size={14} />} className="pp-create-btn"
              onClick={() => { resetDraft(); setMode("view"); }}
              block style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "var(--bg-slate-50)", color: "var(--text-primary)", border: "1px solid var(--border-slate-200)" }}>
              Back to Profiles
            </Button>
          )}

          <div className="pp-side-scroll">
            <div className="pp-side-section-label">Views</div>
            <div className="pp-side-list">
              <button type="button" className={`pp-view-item ${statusFilter === "all" ? "is-active" : ""}`} onClick={() => setStatusFilter("all")}>
                <span className="pp-view-icon" style={{ color: statusFilter === "all" ? "#3b82f6" : "var(--text-slate-400)" }}><ShieldCheck size={14} /></span>
                <span className="pp-view-label">All Profiles</span>
                <span className="pp-view-count">{settingsList.length}</span>
              </button>
              <button type="button" className={`pp-view-item ${statusFilter === "active" ? "is-active" : ""}`} onClick={() => setStatusFilter("active")}>
                <span className="pp-view-icon" style={{ color: statusFilter === "active" ? "#10b981" : "var(--text-slate-400)" }}><CheckCircle2 size={14} /></span>
                <span className="pp-view-label">Active</span>
                <span className="pp-view-count">{activeSettingsCount}</span>
              </button>
              <button type="button" className={`pp-view-item ${statusFilter === "inactive" ? "is-active" : ""}`} onClick={() => setStatusFilter("inactive")}>
                <span className="pp-view-icon" style={{ color: statusFilter === "inactive" ? "#f87171" : "var(--text-slate-400)" }}><AlertCircle size={14} /></span>
                <span className="pp-view-label">Inactive</span>
                <span className="pp-view-count">{inactiveCount}</span>
              </button>
            </div>


          </div>

          <div className="pp-side-bottom-actions">
            <button type="button" className="pp-view-item" onClick={() => router.push("/invoice/invoices")}
              style={{ padding: "7px 10px", borderRadius: "8px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", width: "100%", marginBottom: "4px" }}>
              <span className="pp-view-icon" style={{ color: "#3b82f6" }}><ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /></span>
              <span className="pp-view-label">Invoices</span>
            </button>
          </div>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="pp-main">
          {/* Top search bar */}
          <div className="pp-topbar">
            <div className="pp-search-wrap">
              <Search className="pp-search-icon" size={14} />
              <input className="pp-search" placeholder="Search profiles..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{filteredSettings.length}</strong> profiles</span>
            </div>

            <div className="pp-topbar-actions">
              <div className="pp-segmented">
                 <button
                  type="button"
                  className={viewMode === "table" ? "is-active" : ""}
                  onClick={() => setViewMode("table")}
                  aria-label="Table view"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  className={viewMode === "card" ? "is-active" : ""}
                  onClick={() => setViewMode("card")}
                  aria-label="Card view"
                >
                  <LayoutGrid size={14} />
                </button>
               
              </div>
              <Tooltip title="Refresh">
                <button type="button" className="pp-ghost-btn" onClick={() => refetch()}><ReloadOutlined spin={isLoading || isFetching} /></button>
              </Tooltip>
            </div>
          </div>
          <div className="pp-divider" />

          <div className="pp-body">
            {/* VIEW MODE CONTENT */}
            {mode === "view" && (
              <div>
                {/* Stat Cards */}
                <div className="pp-stats pp-stats-3">
                  <div className="pp-stat-card">
                    <div className="pp-stat-top"><div className="pp-stat-left"><span className="pp-stat-icon" style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}><ShieldCheck size={14} /></span><span className="pp-stat-label">Total Profiles</span></div></div>
                    <div className="pp-stat-bottom"><div className="pp-stat-value-wrap"><span className="pp-stat-value">{isLoading ? "—" : settingsList.length}</span></div><span className="pp-stat-period">All registered</span></div>
                  </div>
                  <div className="pp-stat-card">
                    <div className="pp-stat-top"><div className="pp-stat-left"><span className="pp-stat-icon" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}><CheckCircle2 size={14} /></span><span className="pp-stat-label">Active</span></div></div>
                    <div className="pp-stat-bottom"><div className="pp-stat-value-wrap"><span className="pp-stat-value">{isLoading ? "—" : activeSettingsCount}</span></div><span className="pp-stat-period">Currently active</span></div>
                  </div>
                  <div className="pp-stat-card">
                    <div className="pp-stat-top"><div className="pp-stat-left"><span className="pp-stat-icon" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}><AlertCircle size={14} /></span><span className="pp-stat-label">Inactive</span></div></div>
                    <div className="pp-stat-bottom"><div className="pp-stat-value-wrap"><span className="pp-stat-value">{isLoading ? "—" : inactiveCount}</span></div><span className="pp-stat-period">Deactivated</span></div>
                  </div>
                </div>

                {/* CONTENT */}
                {isLoading ? (
                  <div className="pp-grid">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="pc-card p-4"
                        style={{
                          background: "var(--bg-slate-50)",
                          border: "1px solid var(--border-slate-200)",
                        }}
                      >
                        <Skeleton active avatar paragraph={{ rows: 1 }} />
                      </div>
                    ))}
                  </div>
                ) : settingsList.length === 0 ? (
                  <div
                    onClick={() => setMode("create")}
                    className="flex flex-col items-center justify-center py-20 rounded-2xl cursor-pointer transition-colors hover:bg-[var(--bg-slate-50)]"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1.5px dashed var(--border-color)",
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: "var(--bg-blue-50)",
                        color: "var(--text-blue-700)",
                        border: "1px solid var(--border-blue-200)",
                      }}
                    >
                      <Sparkles size={24} strokeWidth={2} />
                    </div>
                    <Title
                      level={5}
                      style={{
                        color: "var(--text-primary)",
                        margin: 0,
                        fontWeight: 700,
                      }}
                    >
                      No settings profiles yet
                    </Title>
                    <Typography.Text
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: 13,
                        marginTop: 6,
                        marginBottom: 20,
                      }}
                    >
                      Create a profile to start generating invoices.
                    </Typography.Text>
                    {canCreateInvoiceSetting && (
                      <Button
                        type="primary"
                        icon={<Plus size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMode("create");
                        }}
                        style={{
                          borderRadius: 8,
                          height: 38,
                          fontWeight: 600,
                          background: "#2563eb",
                        }}
                      >
                        Create profile
                      </Button>
                    )}
                  </div>
                ) : filteredSettings.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-16 rounded-2xl"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1.5px dashed var(--border-color)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        background: "var(--bg-blue-50)",
                        color: "var(--text-blue-700)",
                        border: "1px solid var(--border-blue-200)",
                      }}
                    >
                      <Search size={20} strokeWidth={2} />
                    </div>
                    <Title
                      level={5}
                      style={{
                        color: "var(--text-primary)",
                        margin: 0,
                        fontWeight: 700,
                      }}
                    >
                      No profiles match your filters
                    </Title>
                    <Typography.Text
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: 13,
                        marginTop: 6,
                      }}
                    >
                      Try adjusting your search or filter
                    </Typography.Text>
                  </div>
                ) : viewMode === "table" ? (
                  <div
                    className="overflow-hidden"
                    style={{
                      background: "var(--bg-pure-white)",
                      border: "1px solid var(--border-slate-200)",
                    }}
                  >
                    <Table
                      rowKey="id"
                      dataSource={pagedSettings}
                      pagination={false}
                      size="middle"
                      onRow={(record) => ({
                        onClick: () => {
                          setSelectedProfileForView(record);
                          setViewDrawerVisible(true);
                        },
                        className: "cursor-pointer",
                      })}
                      className="profiles-table"
                      columns={[
                        {
                          title: "PROFILE",
                          dataIndex: "general",
                          key: "name",
                          render: (_: any, record: any) => (
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 overflow-hidden"
                                style={{
                                  background: record.general?.companyLogo
                                    ? "var(--bg-secondary)"
                                    : "var(--bg-blue-50)",
                                  color: "var(--text-blue-700)",
                                  border: "1px solid var(--border-color)",
                                }}
                              >
                                {record.general?.companyLogo ? (
                                  <img
                                    src={record.general.companyLogo}
                                    alt="Logo"
                                    className="w-full h-full object-contain p-1"
                                  />
                                ) : (
                                  <Building2 size={16} strokeWidth={2.25} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div
                                  className="text-sm font-semibold truncate"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {record.general?.companyName ||
                                    "Unnamed profile"}
                                </div>
                                <div
                                  className="text-[11px] mt-0.5 flex items-center gap-1"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  <MapPin size={10} />
                                  {[
                                    record.general?.address?.city,
                                    record.general?.address?.country,
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || "No location"}
                                </div>
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "FORMAT",
                          dataIndex: "invoice",
                          key: "format",
                          render: (_: any, record: any) => (
                            <code
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
                              style={{
                                background: "var(--bg-slate-50)",
                                color: "var(--text-primary)",
                                border: "1px solid var(--border-color)",
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                              }}
                            >
                              {record.invoice?.format || "—"}
                            </code>
                          ),
                        },
                        {
                          title: "CURRENCY",
                          dataIndex: ["general", "currency"],
                          key: "currency",
                          width: 120,
                          render: (v: string) => (
                            <span
                              className="text-[12.5px] font-semibold tabular-nums"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {v || "—"}
                            </span>
                          ),
                        },
                        {
                          title: "STATUS",
                          dataIndex: "isActive",
                          key: "status",
                          width: 110,
                          render: (isActive: boolean) =>
                            isActive ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
                                style={{
                                  background: "rgba(16,185,129,0.08)",
                                  color: "#10b981",
                                  border: "1px solid rgba(16,185,129,0.25)",
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: "#10b981" }}
                                />
                                Active
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
                                style={{
                                  background: "var(--bg-slate-50)",
                                  color: "var(--text-secondary)",
                                  border: "1px solid var(--border-color)",
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: "#94a3b8" }}
                                />
                                Inactive
                              </span>
                            ),
                        },
                        {
                          title: "",
                          key: "action",
                          width: 130,
                          render: (_: any, record: any) => (
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {canUpdateInvoiceSetting && (
                                <Tooltip title="Edit">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(record.id)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-slate-50)]"
                                    style={{ color: "var(--text-secondary)" }}
                                  >
                                    <Edit size={13} />
                                  </button>
                                </Tooltip>
                              )}
                              {canUpdateInvoiceSetting && (
                                <Tooltip
                                  title={
                                    record.isActive ? "Deactivate" : "Set active"
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      activateMutation.mutate({
                                        id: record.id,
                                        isActive: !record.isActive,
                                      })
                                    }
                                    className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-slate-50)]"
                                    style={{ color: "var(--text-secondary)" }}
                                  >
                                    <Power size={13} />
                                  </button>
                                </Tooltip>
                              )}
                              {canDeleteInvoiceSetting && (
                                <Tooltip title="Delete">
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(record.id)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-slate-50)]"
                                    style={{ color: "#dc2626" }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          ),
                        },
                      ]}
                    />
                  </div>
                ) : (
                  <div className="pp-grid">
                    {pagedSettings.map((setting) => {
                      const accent = accentFor(setting.general?.companyName || '');

                      const menuItems = [
                        canUpdateInvoiceSetting && {
                          key: "edit",
                          icon: <Edit size={14} />,
                          label: "Edit",
                          onClick: () => handleEdit(setting.id),
                        },
                        canUpdateInvoiceSetting && {
                          key: "status_toggle",
                          icon: <Power size={14} />,
                          label: setting.isActive ? "Deactivate" : "Activate",
                          onClick: () =>
                            activateMutation.mutate({
                              id: setting.id,
                              isActive: !setting.isActive,
                            }),
                        },
                        canDeleteInvoiceSetting && { type: "divider" },
                        canDeleteInvoiceSetting && {
                          key: "delete",
                          danger: true,
                          icon: <Trash2 size={14} />,
                          label: "Delete",
                          onClick: () => handleDelete(setting.id),
                        },
                      ].filter(Boolean);

                      return (
                        <div
                          key={setting.id}
                          className="pc-card"
                          onClick={() => {
                            setSelectedProfileForView(setting);
                            setViewDrawerVisible(true);
                          }}
                        >
                          <div className="pc-top">
                            <div
                              className="pc-avatar"
                              style={
                                setting.general?.companyLogo
                                  ? { background: "var(--bg-slate-50)" }
                                  : {
                                    background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)`,
                                  }
                              }
                            >
                              {setting.general?.companyLogo ? (
                                <img
                                  src={setting.general.companyLogo}
                                  alt="Logo"
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                initialsOf(setting.general?.companyName)
                              )}
                            </div>
                            <div className="pc-identity-body">
                              <div className="pc-title" style={{ fontSize: '13px' }}>
                                {setting.general?.companyName || "Unnamed profile"}
                              </div>
                              <div className="pc-client-line">
                                <span className="pc-client-key">Format:</span>
                                <span className="pc-client-val">
                                  {setting.invoice?.format || "—"}
                                </span>
                              </div>
                            </div>
                            <Dropdown
                              menu={{ items: menuItems as any }}
                              trigger={["click"]}
                            >
                              <button
                                type="button"
                                className="pc-actions"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical size={16} />
                              </button>
                            </Dropdown>
                          </div>

                          <div className="pc-foot">
                            <div className="pc-foot-row">
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Currency:</span>
                                <span className="pc-foot-val">{setting.general?.currency || "—"}</span>
                              </span>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">GSTIN/PAN:</span>
                                <span className="pc-foot-val">
                                  {setting.general?.gstin || setting.general?.pan || "—"}
                                </span>
                              </span>
                            </div>
                            <div className="pc-foot-row">
                              <span className="pc-foot-item">
                                <span className="pc-foot-key">Status:</span>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: setting.isActive ? "#10b981" : "#94a3b8",
                                  }}
                                >
                                  {setting.isActive ? "ACTIVE" : "INACTIVE"}
                                </span>
                              </span>
                              <span className="pc-foot-div" />
                              <button
                                type="button"
                                className="pc-foot-item pc-view-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProfileForView(setting);
                                  setViewDrawerVisible(true);
                                }}
                              >
                                Profile
                              </button>
                              {canUpdateInvoiceSetting && (
                                <>
                                  <span className="pc-foot-div" />
                                  <button
                                    type="button"
                                    className="pc-foot-item pc-view-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(setting.id);
                                    }}
                                  >
                                    Edit
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>)}
          </div>

          {/* Sticky footer pagination */}
          {total > 0 && (
            <div className="pp-footer pp-footer--sticky">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
              </div>
              <div className="pp-pager">
                <button
                  type="button"
                  className="pp-pager-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5)
                  .map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pp-pager-num ${p === currentPage ? "is-active" : ""}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  type="button"
                  className="pp-pager-btn"
                  disabled={currentPage >= pageCount}
                  onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                >
                  ›
                </button>
                <Select
                  className="pp-pagesize"
                  value={pageSize}
                  onChange={(v) => {
                    setPageSize(v);
                    setCurrentPage(1);
                  }}
                  options={[10, 20, 25, 50, 100].map((n) => ({
                    value: n,
                    label: `${n} / page`,
                  }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE MODE — fixed overlay */}
      {mode === "create" && (
        <div style={{ position: "fixed", inset: 0, top: 54, zIndex: 50, background: "var(--bg-pure-white)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div
            className="flex-1 min-h-0 px-8 pt-6 pb-24"
            style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
          >
            <div
              className="mx-auto w-full max-w-[1600px]"
              style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, flex: 1, minHeight: 0 }}
            >
              {/* SIDEBAR */}
              <aside className="no-scrollbar" style={{ overflowY: "auto" }}>
                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    className="px-3 pt-2 pb-3 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Configuration steps
                  </div>

                  <div className="space-y-1.5">
                    <StepButton
                      label="General details"
                      description="Logo, address & regional"
                      icon={Building2}
                      active={currentStep === 0}
                      completed={currentStep > 0}
                      onClick={() => setCurrentStep(0)}
                    />
                    <StepButton
                      label="Invoice format"
                      description="Numbering & prefix"
                      icon={ReceiptText}
                      active={currentStep === 1}
                      completed={currentStep > 1}
                      onClick={async () => {
                        try {
                          await generalFormRef.current?.validateFields();
                          setCurrentStep(1);
                        } catch {
                          message.error("Complete general details first");
                        }
                      }}
                    />
                    <StepButton
                      label="Payment info"
                      description="Bank & QR code"
                      icon={CreditCard}
                      active={currentStep === 2}
                      completed={currentStep > 2}
                      onClick={async () => {
                        try {
                          await generalFormRef.current?.validateFields();
                          setCurrentStep(2);
                        } catch {
                          message.error("Complete previous steps first");
                        }
                      }}
                    />
                  </div>
                </div>

                <div
                  className="mt-3 rounded-2xl p-4 flex items-start gap-3"
                  style={{
                    background: "var(--bg-blue-50)",
                    border: "1px solid var(--border-blue-200)",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-blue-700)",
                      border: "1px solid var(--border-blue-200)",
                    }}
                  >
                    <Info size={13} />
                  </div>
                  <div
                    className="text-[12px] leading-relaxed"
                    style={{ color: "var(--text-blue-700)" }}
                  >
                    Each profile represents a different business entity or
                    branding scheme.
                  </div>
                </div>
              </aside>

              {/* CONTENT */}
              <section
                className="rounded-2xl overflow-hidden flex flex-col min-h-0"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  className="px-6 py-3 flex items-center gap-3 border-b flex-shrink-0"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {currentStep === 0 && "General information"}
                    {currentStep === 1 && "Invoice configuration"}
                    {currentStep === 2 && "Payment & bank details"}
                  </span>
                  <span
                    className="h-4 w-px"
                    style={{ background: "var(--border-color)" }}
                  />
                  <span
                    className="text-[11px] uppercase tracking-[0.08em]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {currentStep === 0 &&
                      "Set up branding & regional localization"}
                    {currentStep === 1 && "Define invoice number generation"}
                    {currentStep === 2 && "Add payment methods & bank info"}
                  </span>
                </div>

                <div
                  className="no-scrollbar flex-1 overflow-y-auto"
                  style={{ padding: "20px 28px 32px 28px" }}
                >
                  <div className="max-w-4xl mx-auto">
                    {currentStep === 0 && (
                      <GeneralSettings
                        formRef={generalFormRef}
                        initialValues={draft.general}
                        onSave={(data) =>
                          setDraft((prev) => ({ ...prev, general: data }))
                        }
                      />
                    )}

                    {currentStep === 1 && (
                      <InvoiceSetting
                        initialValues={draft.invoice}
                        onSave={(data) =>
                          setDraft((prev) => ({ ...prev, invoice: data }))
                        }
                      />
                    )}

                    {currentStep === 2 && (
                      <BankPaymentSettings
                        initialValues={draft.payment}
                        onSave={(data) =>
                          setDraft((prev) => ({ ...prev, payment: data }))
                        }
                      />
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* FOOTER ACTION BAR */}
            <div
              className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md border-t"
              style={{
                background:
                  "color-mix(in oklab, var(--bg-secondary) 92%, transparent)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="px-8 py-3 flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
                <div
                  className="text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Step{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {currentStep + 1}
                  </span>{" "}
                  of 3
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    disabled={currentStep === 0}
                    icon={<ArrowLeft size={14} />}
                    onClick={() => setCurrentStep((s) => s - 1)}
                    style={{
                      borderRadius: 8,
                      height: 36,
                      fontWeight: 600,
                    }}
                  >
                    Previous
                  </Button>

                  {editingId && currentStep < 2 && (
                    <Button
                      icon={<CheckCircle2 size={14} />}
                      loading={updateMutation.isPending}
                      onClick={() =>
                        persistDraft({
                          closeOnSuccess: false,
                          label: STEP_LABELS[currentStep],
                        })
                      }
                      style={{
                        borderRadius: 8,
                        height: 36,
                        fontWeight: 600,
                      }}
                    >
                      Save {STEP_LABELS[currentStep].toLowerCase()}
                    </Button>
                  )}
                  {currentStep < 2 ? (
                    <Button
                      type="primary"
                      onClick={async () => {
                        if (currentStep === 0) {
                          try {
                            await generalFormRef.current?.validateFields();
                            setCurrentStep(1);
                          } catch {
                            message.error("Please fill required fields");
                          }
                        } else {
                          setCurrentStep((s) => s + 1);
                        }
                      }}
                      style={{
                        borderRadius: 8,
                        height: 36,
                        fontWeight: 600,
                        background: "#2563eb",
                      }}
                    >
                      Next step
                      <ChevronRight size={14} style={{ marginLeft: 4 }} />
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<CheckCircle2 size={14} />}
                      loading={
                        createMutation.isPending || updateMutation.isPending
                      }
                      onClick={() => persistDraft({ closeOnSuccess: true })}
                      style={{
                        borderRadius: 8,
                        height: 36,
                        fontWeight: 600,
                        background: "#10b981",
                      }}
                    >
                      {editingId ? "Update profile" : "Save & finish"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>)}

      {/* PROFILE VIEW DRAWER */}
      <Drawer
        title={null}
        closable={false}
        placement="right"
        onClose={() => setViewDrawerVisible(false)}
        open={viewDrawerVisible}
        width={680}
        styles={{
          body: { padding: 0, background: "var(--customers-page-bg)" },
          header: { display: "none" },
          wrapper: {
            boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.08)",
          },
          mask: {
            backdropFilter: "blur(2px)",
            background: "rgba(15, 23, 42, 0.35)",
          },
        }}
      >
        {selectedProfileForView && (
          <div className="h-full flex flex-col">
            {/* HEADER */}
            <div
              className="sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
              style={{
                background:
                  "color-mix(in oklab, var(--bg-secondary) 92%, transparent)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{
                    background: selectedProfileForView.general?.companyLogo
                      ? "var(--bg-secondary)"
                      : "var(--bg-blue-50)",
                    color: "var(--text-blue-700)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {selectedProfileForView.general?.companyLogo ? (
                    <img
                      src={selectedProfileForView.general.companyLogo}
                      alt="Logo"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Building2 size={20} strokeWidth={2.25} />
                  )}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[16px] font-semibold leading-tight truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedProfileForView.general?.companyName ||
                      "Untitled profile"}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
                      style={
                        selectedProfileForView.isActive
                          ? {
                            background: "#ecfdf5",
                            color: "#047857",
                            border: "1px solid #a7f3d0",
                          }
                          : {
                            background: "var(--bg-slate-50)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-color)",
                          }
                      }
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: selectedProfileForView.isActive
                            ? "#10b981"
                            : "#94a3b8",
                        }}
                      />
                      {selectedProfileForView.isActive ? "Active" : "Inactive"}
                    </span>
                    <code
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
                      style={{
                        background: "var(--bg-slate-50)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-color)",
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, monospace",
                      }}
                    >
                      {selectedProfileForView.invoice?.format || "—"}
                    </code>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDrawerVisible(false)}
                aria-label="Close"
                className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-24">
              {/* HERO META STRIP */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetaTile
                  label="Currency"
                  value={selectedProfileForView.general?.currency || "—"}
                  sub="ISO 4217"
                  accent="#2563eb"
                />
                <MetaTile
                  label="Date format"
                  value={
                    selectedProfileForView.general?.dateFormat || "MM/DD/YYYY"
                  }
                  sub={formatToday(
                    selectedProfileForView.general?.dateFormat || "MM/DD/YYYY"
                  )}
                  accent="#10b981"
                  mono
                />
                <MetaTile
                  label="GSTIN"
                  value={
                    selectedProfileForView.general?.gstin
                      ? "Verified"
                      : "Missing"
                  }
                  sub={
                    selectedProfileForView.general?.gstin
                      ? selectedProfileForView.general.gstin
                      : "Not configured"
                  }
                  accent={
                    selectedProfileForView.general?.gstin
                      ? "#10b981"
                      : "#94a3b8"
                  }
                  mono={!!selectedProfileForView.general?.gstin}
                  truncate
                />
                <MetaTile
                  label="PAN"
                  value={
                    selectedProfileForView.general?.pan ? "Verified" : "Missing"
                  }
                  sub={
                    selectedProfileForView.general?.pan
                      ? selectedProfileForView.general.pan
                      : "Not configured"
                  }
                  accent={
                    selectedProfileForView.general?.pan ? "#10b981" : "#94a3b8"
                  }
                  mono={!!selectedProfileForView.general?.pan}
                  truncate
                />
              </div>

              {/* ADDRESS — full width, structured grid */}
              <SectionCard
                icon={MapPin}
                title="Business address"
                subtitle="Where the business is located"
              >
                {(() => {
                  const addr = selectedProfileForView.general?.address;
                  const hasAny =
                    addr &&
                    Object.values(addr).some(
                      (v) => typeof v === "string" && v.trim() !== ""
                    );
                  if (!hasAny) {
                    return (
                      <div
                        className="flex flex-col items-center justify-center py-6 rounded-lg"
                        style={{
                          background: "var(--bg-slate-50)",
                          border: "1px dashed var(--border-color)",
                        }}
                      >
                        <MapPin
                          size={18}
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <span
                          className="text-[11px] font-semibold uppercase tracking-wider mt-2"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          No address configured
                        </span>
                      </div>
                    );
                  }
                  const street1 = [addr.plot_no, addr.floor_no, addr.building_name]
                    .filter(Boolean)
                    .join(", ");
                  const street2 = [addr.street, addr.area]
                    .filter(Boolean)
                    .join(", ");
                  const cityLine = [addr.city, addr.pincode]
                    .filter(Boolean)
                    .join(" - ");
                  return (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {street1 && (
                        <div className="col-span-2">
                          <KvRow label="Building" value={street1} />
                        </div>
                      )}
                      {street2 && (
                        <div className="col-span-2">
                          <KvRow label="Street" value={street2} />
                        </div>
                      )}
                      {cityLine && (
                        <div className="col-span-2">
                          <KvRow label="City" value={cityLine} />
                        </div>
                      )}
                      {addr.country && (
                        <div className="col-span-2">
                          <KvRow label="Country" value={addr.country} />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </SectionCard>

              {/* INVOICE FORMAT — with live preview */}
              <SectionCard
                icon={ReceiptText}
                title="Invoice format"
                subtitle="Number sequence mask"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div
                      className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Format
                    </div>
                    <div
                      className="rounded-lg px-3 py-2.5 text-center"
                      style={{
                        background: "var(--bg-slate-50)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <code
                        className="text-[13px] font-semibold"
                        style={{
                          color: "var(--text-primary)",
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                        }}
                      >
                        {selectedProfileForView.invoice?.format?.toUpperCase() ||
                          "—"}
                      </code>
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1.5"
                      style={{ color: "var(--text-blue-700)" }}
                    >
                      Next number
                    </div>
                    <div
                      className="rounded-lg px-3 py-2.5 text-center"
                      style={{
                        background: "var(--bg-blue-50)",
                        border: "1px solid var(--border-blue-200)",
                      }}
                    >
                      <code
                        className="text-[13px] font-bold"
                        style={{
                          color: "var(--text-blue-700)",
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                        }}
                      >
                        {previewNumber(
                          selectedProfileForView.invoice?.format || ""
                        )}
                      </code>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* PAYMENT */}
              <SectionCard
                icon={Landmark}
                title="Payment & bank"
                subtitle="Where customers pay"
              >
                {selectedProfileForView.payment?.bankName ||
                  selectedProfileForView.payment?.accountNumber ||
                  selectedProfileForView.payment?.ifscCode ||
                  selectedProfileForView.payment?.qrCode ? (
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-12 md:col-span-8 space-y-3">
                      {selectedProfileForView.payment.bankName && (
                        <KvRow
                          label="Bank"
                          value={selectedProfileForView.payment.bankName}
                          icon={Landmark}
                        />
                      )}
                      <KvRow
                        label="Account"
                        value={
                          selectedProfileForView.payment.accountNumber || "—"
                        }
                        mono
                      />
                      <KvRow
                        label="IFSC"
                        value={
                          selectedProfileForView.payment.ifscCode || "—"
                        }
                        mono
                      />
                      {selectedProfileForView.payment.branchName && (
                        <KvRow
                          label="Branch"
                          value={selectedProfileForView.payment.branchName}
                          icon={Building}
                        />
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <div
                        className="rounded-xl p-3 text-center"
                        style={{
                          background: "var(--bg-slate-50)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        {selectedProfileForView.payment.qrCode ? (
                          <>
                            <div
                              className="rounded-md p-2 mb-2"
                              style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border-color)",
                              }}
                            >
                              <img
                                src={selectedProfileForView.payment.qrCode}
                                alt="QR code"
                                className="w-full h-auto rounded"
                              />
                            </div>
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wider"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Pay via QR
                            </span>
                          </>
                        ) : (
                          <div className="py-5 flex flex-col items-center">
                            <QrCode
                              size={28}
                              style={{ color: "var(--text-secondary)" }}
                              className="mb-1.5"
                            />
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wider"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              No QR
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-8 rounded-lg"
                    style={{
                      background: "var(--bg-slate-50)",
                      border: "1px dashed var(--border-color)",
                    }}
                  >
                    <CreditCard
                      size={22}
                      style={{ color: "var(--text-secondary)" }}
                    />
                    <span
                      className="text-[12px] font-semibold mt-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Payment method not configured
                    </span>
                  </div>
                )}
              </SectionCard>

              {/* SIGNATURE */}
              <SectionCard
                icon={PenTool}
                title="Signature"
                subtitle="Authorized sign-off"
              >
                <div
                  className="rounded-lg flex justify-center items-center min-h-[100px] py-5"
                  style={{
                    background: "var(--bg-slate-50)",
                    border: "1px dashed var(--border-color)",
                  }}
                >
                  {selectedProfileForView.general?.signature ? (
                    <img
                      src={selectedProfileForView.general.signature}
                      alt="Signature"
                      className="max-h-20 object-contain"
                    />
                  ) : (
                    <div
                      className="flex flex-col items-center gap-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <PenTool size={20} strokeWidth={1.5} />
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider">
                        Pending upload
                      </span>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* STICKY ACTION FOOTER */}
            <div
              className="absolute bottom-0 left-0 right-0 px-6 py-3 flex items-center justify-between gap-2 border-t backdrop-blur-md"
              style={{
                background:
                  "color-mix(in oklab, var(--bg-secondary) 92%, transparent)",
                borderColor: "var(--border-color)",
              }}
            >
              <Button
                danger
                icon={<Trash2 size={14} />}
                onClick={() => {
                  setViewDrawerVisible(false);
                  handleDelete(selectedProfileForView.id);
                }}
                style={{ borderRadius: 8, height: 36 }}
              >
                Delete
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    activateMutation.mutate({
                      id: selectedProfileForView.id,
                      isActive: !selectedProfileForView.isActive,
                    });
                  }}
                  icon={<Power size={14} />}
                  style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
                >
                  {selectedProfileForView.isActive
                    ? "Deactivate"
                    : "Set active"}
                </Button>
                <Button
                  type="primary"
                  icon={<Edit size={14} />}
                  onClick={() => {
                    const id = selectedProfileForView.id;
                    setViewDrawerVisible(false);
                    handleEdit(id);
                  }}
                  style={{
                    borderRadius: 8,
                    height: 36,
                    fontWeight: 600,
                    background: "#2563eb",
                  }}
                >
                  Edit profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        open={deleteModalOpen}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeleteId(null);
        }}
        footer={null}
        width={440}
        centered
        closable={false}
        styles={{
          body: { padding: 0 },
          mask: {
            backdropFilter: "blur(4px)",
            background: "rgba(15, 23, 42, 0.45)",
          },
          content: { padding: 0, borderRadius: 20, overflow: "hidden" },
        }}
      >
        <div
          className="px-6 pt-5 pb-4 border-b"
          style={{
            background: "var(--bg-slate-50)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(248,113,113,0.08)",
                color: "#f87171",
                border: "1px solid rgba(248,113,113,0.25)",
              }}
            >
              <Trash2 size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Delete settings profile
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                This action cannot be undone
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p
            className="text-[13px] leading-relaxed mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            You are about to permanently delete
            {profileToDelete?.general?.companyName && (
              <>
                {" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  "{profileToDelete.general.companyName}"
                </span>
              </>
            )}
            . The general info, invoice format, and payment configuration
            will be removed.
          </p>

          <div
            className="rounded-lg p-3 mb-5 flex items-start gap-2"
            style={{
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.20)",
            }}
          >
            <AlertCircle
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: "#f87171" }}
            />
            <span className="text-[12px]" style={{ color: "#f87171" }}>
              Existing invoices linked to this profile will keep their
              snapshot, but new invoices won't be able to use it.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteId(null);
              }}
              style={{ borderRadius: 8, height: 36 }}
            >
              Keep profile
            </Button>
            <Button
              danger
              type="primary"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId, {
                    onSuccess: () => {
                      setDeleteModalOpen(false);
                      setDeleteId(null);
                    },
                  });
                }
              }}
              style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
            >
              Delete profile
            </Button>
          </div>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .pp-shell { display: flex; margin: 0 -24px; min-height: calc(100vh - 54px); background: var(--bg-pure-white); }
        .pp-shell,
        .pp-shell *,
        .ant-table,
        .ant-btn,
        .ant-select,
        .ant-picker,
        .ant-input,
        .ant-modal,
        .ant-drawer,
        .ant-tooltip,
        .ant-popconfirm,
        .ant-dropdown {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif !important;
        }
        .pp-sidebar { width: 264px; flex-shrink: 0; border-right: 1px solid var(--border-slate-200); background: var(--bg-pure-white); display: flex; flex-direction: column; padding: 14px 14px 0 38px; position: sticky; top: 0; height: calc(100vh - 54px); z-index: 31; }
        .pp-side-head { display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px; border-bottom: 1px solid var(--border-slate-100); }
        .pp-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900); }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .pp-side-subtitle { font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.07em; }
        .pp-create-btn { height: 35px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important; background: #3B82F6 !important; border: none !important; box-shadow: none !important; margin-bottom: 12px; }
        .pp-create-btn:hover { background: #2563EB !important; }
        .pp-create-btn .anticon { font-size: 12px !important; }
        .pp-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; -ms-overflow-style: none; }
        .pp-side-scroll::-webkit-scrollbar { display: none; }
        .pp-side-section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px; }
        .pp-side-list { display: flex; flex-direction: column; gap: 1px; }
        .pp-view-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 10px; border-radius: 8px; border: none; background: transparent; cursor: pointer; transition: background .12s ease; text-align: left; }
        .pp-view-item:hover { background: var(--bg-slate-50); }
        .pp-view-item.is-active { background: var(--bg-blue-50); }
        .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
        .pp-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
        .pp-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .pp-view-count { font-size: 11.5px; font-weight: 600; color: var(--text-slate-400); min-width: 18px; text-align: right; }
        .pp-view-item.is-active .pp-view-count { color: #3B82F6; font-weight: 700; background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0; }
        .pp-side-bottom-actions { margin: auto -14px 0 -38px; padding: 8px 14px 0 38px; border-top: 1px solid var(--border-slate-100); background: var(--bg-pure-white); }
        .pp-main { flex: 1; min-width: 0; padding: 8px 32px 0 20px; display: flex; flex-direction: column; }
        .pp-body { flex: 1 0 auto; padding-bottom: 60px; }
        .pp-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .pp-search-wrap { position: relative; flex: 1; max-width: 520px; display: flex; align-items: center; height: 32px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
        .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
        .pp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .pp-divider { height: 1px; background: var(--border-slate-200); margin: 0 -32px 10px -20px; }
        .pp-stats { display: grid; gap: 12px; margin-bottom: 14px; }
        .pp-stats-3 { grid-template-columns: repeat(3, 1fr); }
        .pp-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; padding: 12px 14px; min-height: 92px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
        .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .profile-card { display: flex; flex-direction: column; }
        .profile-card:hover { border-color: #93c5fd !important; box-shadow: 0 0 0 3px rgba(96,165,250,0.10), 0 4px 12px -2px rgba(15,23,42,0.06); }
        .pp-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; border-top: 1px solid var(--border-slate-200); }
        .pp-footer--sticky { position: sticky; bottom: 0; z-index: 30; margin: 8px -32px 0 -20px; padding: 0 32px 0 20px; background: var(--bg-pure-white); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); height: 45px; display: flex; align-items: center; }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }
        .profiles-table .ant-table { background: transparent; font-size: 12px; }
        .profiles-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important; white-space: nowrap !important; }
        .profiles-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 10px !important; }
        .profiles-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .profiles-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        @media (max-width: 820px) { .pp-sidebar { display: none; } .pp-topbar-meta { display: none; } }

        /* Grid view cards (matching accounts dashboard) */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
          height: 154px;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; height: 74px; overflow: hidden; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .pc-avatar img { width: 100%; height: 100%; object-fit: contain; }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); height: 78px; justify-content: center; }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-val { font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); flex-shrink: 0; }
        .pc-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .pc-view-btn .anticon { font-size: 12px; }
        .pc-view-btn:hover { text-decoration: underline; }

        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }

        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }

        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }
      ` }} />
    </MainLayout>
  );
}

const SectionCard = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
    }}
  >
    <div
      className="px-4 py-3 flex items-center gap-2.5 border-b"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: "var(--bg-blue-50)",
          color: "var(--text-blue-700)",
          border: "1px solid var(--border-blue-200)",
        }}
      >
        <Icon size={13} strokeWidth={2.25} />
      </div>
      <span
        className="text-[13px] font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </span>
      {subtitle && (
        <>
          <span
            className="h-3.5 w-px"
            style={{ background: "var(--border-color)" }}
          />
          <span
            className="text-[11px] uppercase tracking-[0.08em]"
            style={{ color: "var(--text-secondary)" }}
          >
            {subtitle}
          </span>
        </>
      )}
    </div>
    <div className="px-4 py-3.5">{children}</div>
  </div>
);

const KvRow = ({
  label,
  value,
  mono,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: any;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span
      className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: "var(--text-secondary)" }}
    >
      {label}
    </span>
    <span
      className="text-[13px] truncate text-right flex items-center gap-1.5"
      style={{
        color: "var(--text-primary)",
        fontFamily: mono
          ? "ui-monospace, SFMono-Regular, Menlo, monospace"
          : undefined,
        fontWeight: 500,
      }}
    >
      {Icon && (
        <Icon size={12} style={{ color: "var(--text-secondary)" }} />
      )}
      {value}
    </span>
  </div>
);

const MetaTile = ({
  label,
  value,
  sub,
  accent,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  mono?: boolean;
  truncate?: boolean;
}) => (
  <div
    className="rounded-xl px-3.5 py-3 relative overflow-hidden"
    style={{
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
    }}
  >
    <span
      className="absolute left-0 top-0 bottom-0 w-[3px]"
      style={{ background: accent }}
    />
    <div
      className="text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: "var(--text-secondary)" }}
    >
      {label}
    </div>
    <div
      className={`text-[14px] font-semibold leading-tight mt-1 ${truncate ? "truncate" : ""
        }`}
      style={{
        color: "var(--text-primary)",
        fontFamily: mono
          ? "ui-monospace, SFMono-Regular, Menlo, monospace"
          : undefined,
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        className={`text-[10.5px] mt-0.5 ${truncate ? "truncate" : ""}`}
        style={{
          color: "var(--text-secondary)",
          fontFamily: mono
            ? "ui-monospace, SFMono-Regular, Menlo, monospace"
            : undefined,
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

function previewNumber(format: string) {
  if (!format) return "—";
  const year = new Date().getFullYear();
  const shortYear = year.toString().slice(-2);
  return format
    .toUpperCase()
    .replace(/{YYYY}/g, year.toString())
    .replace(/{YY}/g, shortYear)
    .replace(/{####}/g, "0001")
    .replace(/{###}/g, "001");
}

function formatToday(format: string) {
  const d = new Date();
  const yyyy = d.getFullYear().toString();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  switch (format) {
    case "DD/MM/YYYY":
      return `${dd}/${mm}/${yyyy}`;
    case "YYYY-MM-DD":
      return `${yyyy}-${mm}-${dd}`;
    case "MM/DD/YYYY":
    default:
      return `${mm}/${dd}/${yyyy}`;
  }
}
