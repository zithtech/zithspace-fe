"use client";

import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";

import { useState, useMemo, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ReloadOutlined, MenuOutlined } from "@ant-design/icons";
import {
  Typography,
  Button,
  Input,
  Modal,
  Table,
  message,
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
import ConfirmDialog from "@/components/common/ConfirmDialog";

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

const ppMenuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
  <div className="pp-menu-item">
    <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
    <span className="pp-menu-text">
      <span className="pp-menu-title">{title}</span>
      <span className="pp-menu-desc">{desc}</span>
    </span>
  </div>
);

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

  const [currentStep, setCurrentStep] = useState(0);
  const createMutation = useCreateSettingsProfile();
  const updateMutation = useUpdateSettingsProfile();
  const deleteMutation = useDeleteSettingsProfile();
  const activateMutation = useActivateSettingsProfile();

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data: savedSettingsData, isLoading, isError, error, refetch, isFetching } = useSettingsProfiles({
    page: currentPage,
    limit: pageSize,
    search: searchText || undefined,
    isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : "all",
  });

  const settingsList = savedSettingsData?.data || [];
  const totalSettings = savedSettingsData?.pagination?.total ?? 0;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  const total = totalSettings || settingsList.length;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedSettings = useMemo(() => {
    return settingsList;
  }, [settingsList]);

  const activeSettingsCount = settingsList.filter((s) => s.isActive).length;
  const inactiveCount = settingsList.length - activeSettingsCount;
  const progressPct = settingsList.length > 0 ? Math.round((activeSettingsCount / settingsList.length) * 100) : 0;
  const activeViewTitle = useMemo(() => {
    switch (statusFilter) {
      case "active": return "Active Profiles";
      case "inactive": return "Inactive Profiles";
      default: return "All Profiles";
    }
  }, [statusFilter]);

  const filterPills: { key: "all" | "active" | "inactive"; label: string; count: number }[] = [
    { key: "all", label: "All", count: settingsList.length },
    { key: "active", label: "Active", count: activeSettingsCount },
    { key: "inactive", label: "Inactive", count: inactiveCount },
  ];

  const handleEdit = (id: string) => {
    setViewDrawerVisible(false);
    setSelectedProfileForView(null);
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
          <ZukvoLoader size="md" message="Initializing session..." />
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
        {isMobileOpen && (
          <div className="pp-backdrop" onClick={() => setIsMobileOpen(false)} />
        )}
        <aside className={`pp-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
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
            <button className="pp-mobile-toggle" onClick={() => setIsMobileOpen(true)}>
              <MenuOutlined style={{ fontSize: 16 }} />
            </button>
            <div className="pp-search-wrap">
              <Search className="pp-search-icon" size={14} />
              <input className="pp-search" placeholder="Search profiles..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{total}</strong> profiles</span>
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
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* ── Main Overview Banner (TicketList sprint head style) ── */}
                <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static invoice-overview-banner">
                  {/* Row 1: dot + title + status tags */}
                  <div className="tl-sprint-row1">
                    <div className="tl-sprint-title-block">
                      <span
                        className="tl-sprint-dot"
                        style={{
                          background: "#3b82f6",
                          boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                        }}
                      />
                      <Typography.Text
                        className="tl-sprint-title"
                        ellipsis={{ tooltip: `Settings — ${activeViewTitle}` }}
                      >
                        Settings — {activeViewTitle}
                      </Typography.Text>
                      <span className="tl-sprint-tags">
                        <span className="tl-sprint-tag tl-sprint-tag-neutral">
                          {settingsList.length} TOTAL
                        </span>
                        {activeSettingsCount > 0 && (
                          <span className="tl-sprint-tag tl-sprint-tag-active">
                            {activeSettingsCount} ACTIVE
                          </span>
                        )}
                        {inactiveCount > 0 && (
                          <span className="tl-sprint-tag tl-sprint-tag-delayed">
                            {inactiveCount} INACTIVE
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: count metrics */}
                  <div className="tl-sprint-row2">
                    <span className="tl-sprint-meta">
                      <b>{activeSettingsCount}</b>/{settingsList.length} profiles active
                    </span>
                    <span className="tl-sprint-meta">
                      <b>{inactiveCount}</b> inactive
                    </span>
                  </div>

                  {/* Row 3: wide progress bar + % */}
                  <div className="tl-sprint-row3">
                    <div className="tl-sprint-progress-bar">
                      <div
                        className="tl-sprint-progress-fill"
                        style={{ width: `${Math.min(100, progressPct)}%` }}
                      />
                    </div>
                    <span className="tl-sprint-progress-pct">{progressPct}%</span>
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
                  <NoData description={
                    <div
                      onClick={() => setMode("create")}
                      className="pp-empty"
                      style={{ cursor: "pointer" }}
                    >
                      <div className="pp-empty-orb">
                        <Sparkles size={24} />
                      </div>
                      <div className="pp-empty-title">
                        No settings profiles yet
                      </div>
                      <div className="pp-empty-sub">
                        Create a profile to start generating invoices.
                      </div>
                      {canCreateInvoiceSetting && (
                        <Button
                          type="primary"
                          icon={<Plus size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMode("create");
                          }}
                          style={{
                            marginTop: 14,
                            borderRadius: 6,
                            height: 32,
                            fontWeight: 600,
                          }}
                        >
                          Create profile
                        </Button>
                      )}
                    </div>
                  } />
                ) : viewMode === "table" ? (
                  <div className="pp-table-wrap">
                    <Table
                      className="saas-table tl-table pp-table profiles-table"
                      rowKey="id"
                      dataSource={pagedSettings}
                      pagination={false}
                      size="small"
                      scroll={{ x: 'max-content' }}
                      onRow={(record) => ({
                        onClick: () => {
                          setSelectedProfileForView(record);
                          setViewDrawerVisible(true);
                        },
                        className: "pp-row",
                      })}
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
                                  <ConfirmDialog
                                    tone="danger"
                                    title="Delete Profile"
                                    description="Are you sure you want to delete this profile? This action cannot be undone."
                                    confirmText="Delete"
                                    onConfirm={() => handleDelete(record.id)}
                                    placement="left"
                                  >
                                    <button
                                      type="button"
                                      className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-slate-50)]"
                                      style={{ color: "#dc2626" }}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </ConfirmDialog>
                                </Tooltip>
                              )}
                            </div>
                          ),
                        },
                      ]} locale={{ emptyText: <NoData /> }}
                    />
                  </div>
                ) : (
                  <div className="pp-grid">
                    {pagedSettings.map((setting) => {
                      const accent = accentFor(setting.general?.companyName || '');

                      const menuItems = [
                        canUpdateInvoiceSetting && {
                          key: "edit",
                          label: ppMenuLabel('Edit', 'Modify settings', <Edit size={14} />, '#64748b', 'rgba(100,116,139,0.12)'),
                          onClick: (info: any) => {
                            info?.domEvent?.stopPropagation();
                            handleEdit(setting.id);
                          },
                        },
                        canUpdateInvoiceSetting && {
                          key: "status_toggle",
                          label: ppMenuLabel(setting.isActive ? "Deactivate" : "Activate", 'Toggle status', <Power size={14} />, '#64748b', 'rgba(100,116,139,0.12)'),
                          onClick: (info: any) => {
                            info?.domEvent?.stopPropagation();
                            activateMutation.mutate({
                              id: setting.id,
                              isActive: !setting.isActive,
                            });
                          },
                        },
                        canDeleteInvoiceSetting && { type: "divider" },
                        canDeleteInvoiceSetting && {
                          key: "delete",
                          danger: true,
                          label: (
                            <div onClick={(e) => e.stopPropagation()}>
                              <ConfirmDialog
                                tone="danger"
                                title="Delete Profile"
                                description="Are you sure you want to delete this profile? This action cannot be undone."
                                confirmText="Delete"
                                onConfirm={() => handleDelete(setting.id)}
                                placement="left"
                              >
                                <div style={{ padding: 0, margin: 0 }}>
                                  {ppMenuLabel('Delete', 'Remove profile', <Trash2 size={14} />, '#ef4444', 'rgba(239,68,68,0.12)')}
                                </div>
                              </ConfirmDialog>
                            </div>
                          ),
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
                              overlayClassName="pp-action-pop"
                              menu={{
                                items: menuItems as any,
                                onClick: (e) => e.domEvent?.stopPropagation(),
                              }}
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
          {mode === "view" && total > 0 && (
            <div className="pp-footer">
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
                  size="small"
                  options={[
                    { value: 10, label: "10 / page" },
                    { value: 15, label: "15 / page" },
                    { value: 25, label: "25 / page" },
                    { value: 50, label: "50 / page" },
                  ]}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE MODE — full content view */}
      {mode === "create" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "var(--bg-pure-white)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* TOP BAR FOR CREATE MODE */}
          <div
            className="flex-shrink-0 px-8 py-3.5 border-b flex items-center justify-between"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  resetDraft();
                  setMode("view");
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                style={{
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-pure-white)",
                  color: "var(--text-secondary)",
                }}
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold m-0" style={{ color: "var(--text-primary)" }}>
                    {editingId ? "Edit Settings Profile" : "Create Settings Profile"}
                  </h2>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(59,130,246,0.1)",
                      color: "#2563eb",
                      border: "1px solid rgba(59,130,246,0.2)",
                    }}
                  >
                    Step {currentStep + 1} of 3
                  </span>
                </div>
                <p className="text-[11px] m-0" style={{ color: "var(--text-secondary)" }}>
                  {editingId
                    ? `Editing profile: ${draft.general.companyName || "Untitled"}`
                    : "Configure company details, invoice numbering, and payment options"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  resetDraft();
                  setMode("view");
                }}
                style={{
                  borderRadius: 8,
                  height: 34,
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                Exit
              </Button>
            </div>
          </div>

          {/* MAIN FORM BODY */}
          <div
            className="flex-1 min-h-0 px-8 py-5"
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
          </div>

          {/* FOOTER ACTION BAR */}
          <div
            className="flex-shrink-0 border-t z-20"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
              boxShadow: "0 -2px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div className="px-8 py-3.5 flex items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: currentStep === idx ? 22 : 6,
                        background:
                          currentStep === idx
                            ? "#2563eb"
                            : idx < currentStep
                            ? "#10b981"
                            : "var(--border-color)",
                      }}
                    />
                  ))}
                </div>
                <div
                  className="text-[13px] font-medium flex items-center gap-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span>Step</span>
                  <span
                    className="font-bold text-[13px]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {currentStep + 1}
                  </span>
                  <span>of</span>
                  <span
                    className="font-bold text-[13px]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    3
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1">·</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {STEP_LABELS[currentStep]}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  onClick={() => {
                    resetDraft();
                    setMode("view");
                  }}
                  style={{
                    borderRadius: 8,
                    height: 38,
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </Button>

                <Button
                  disabled={currentStep === 0}
                  icon={<ChevronLeft size={16} />}
                  onClick={() => setCurrentStep((s) => s - 1)}
                  style={{
                    borderRadius: 8,
                    height: 38,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Previous
                </Button>

                {editingId && currentStep < 2 && (
                  <Button
                    icon={<CheckCircle2 size={15} />}
                    loading={updateMutation.isPending}
                    onClick={() =>
                      persistDraft({
                        closeOnSuccess: false,
                        label: STEP_LABELS[currentStep],
                      })
                    }
                    style={{
                      borderRadius: 8,
                      height: 38,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    Save {STEP_LABELS[currentStep]}
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
                      height: 38,
                      fontWeight: 600,
                      background: "#2563eb",
                      display: "inline-flex",
                      alignItems: "center",
                      boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                    }}
                  >
                    Next step
                    <ChevronRight size={16} style={{ marginLeft: 4 }} />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<CheckCircle2 size={16} />}
                    loading={
                      createMutation.isPending || updateMutation.isPending
                    }
                    onClick={() => persistDraft({ closeOnSuccess: true })}
                    style={{
                      borderRadius: 8,
                      height: 38,
                      fontWeight: 600,
                      background: "#10b981",
                      borderColor: "#10b981",
                      display: "inline-flex",
                      alignItems: "center",
                      boxShadow: "0 2px 8px rgba(16,185,129,0.25)",
                    }}
                  >
                    {editingId ? "Update profile" : "Save & finish"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
        /* --- TicketList sprint-head banner styles --- */
        .invoice-overview-banner {
          background: var(--bg-pure-white);
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid var(--border-slate-200);
          border-radius: 0;
          padding: 10px 24px 10px 14px;
          margin: 0;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .invoice-overview-banner .tl-sprint-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 5px;
        }
        .invoice-overview-banner .tl-sprint-title-block {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }
        .invoice-overview-banner .tl-sprint-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .invoice-overview-banner .tl-sprint-title {
          font-size: 13px !important;
          font-weight: 700 !important;
          color: var(--text-slate-900) !important;
          letter-spacing: -0.01em;
          margin: 0 !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .invoice-overview-banner .tl-sprint-tags {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }
        .invoice-overview-banner .tl-sprint-tag {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 1.5px 6px;
          border-radius: 4px;
        }
        .invoice-overview-banner .tl-sprint-tag-neutral {
          background: var(--bg-slate-100);
          color: var(--text-slate-600);
          border: 1px solid var(--border-slate-200);
        }
        .invoice-overview-banner .tl-sprint-tag-active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .invoice-overview-banner .tl-sprint-tag-delayed {
          background: rgba(248, 113, 113, 0.1);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.25);
        }
        .invoice-overview-banner .tl-sprint-row2 {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .invoice-overview-banner .tl-sprint-meta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-slate-500);
        }
        .invoice-overview-banner .tl-sprint-meta b {
          color: var(--text-slate-800);
          font-weight: 700;
        }
        .invoice-overview-banner .tl-sprint-row3 {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 15px;
        }
        .invoice-overview-banner .tl-sprint-progress-bar {
          flex: 1 1 auto;
          position: relative;
          height: 6px !important;
          background: var(--bg-slate-100);
          border-radius: 999px;
          overflow: hidden;
          min-width: 60px;
        }
        [data-theme='dark'] .invoice-overview-banner .tl-sprint-progress-bar { background: #1f2937 !important; }
        .invoice-overview-banner .tl-sprint-progress-fill {
          position: absolute;
          inset: 0;
          height: 100% !important;
          background: linear-gradient(90deg, #3b82f6, #10b981) !important;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .invoice-overview-banner .tl-sprint-progress-pct {
          flex-shrink: 0;
          font-size: 12px !important;
          font-weight: 800 !important;
          color: var(--text-slate-900) !important;
          font-variant-numeric: tabular-nums;
          min-width: 36px;
          text-align: right;
        }
        [data-theme='dark'] .invoice-overview-banner .tl-sprint-progress-pct { color: #f1f5f9 !important; }

        .pp-shell {
          display: flex;
          margin: 0 -24px;
          height: calc(100vh - 54px);
          max-height: calc(100vh - 54px);
          overflow: hidden;
          background: var(--bg-pure-white);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        [data-theme='dark'] .pp-shell { background: #0b0f12; }

        .pp-sidebar {
          width: 256px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 14px 34px;
          box-sizing: border-box;
          overflow: hidden;
        }
        [data-theme='dark'] .pp-sidebar { background: #0f1419; border-right-color: #1f2937; }
        .pp-side-head {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 4px 10px;
          border-bottom: 1px solid var(--border-slate-100);
          margin-bottom: 10px;
        }
        [data-theme='dark'] .pp-side-head { border-bottom-color: #1f2937; }
        .pp-side-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-blue-50);
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        [data-theme='dark'] .pp-side-title { color: #f1f5f9; }
        .pp-side-subtitle {
          font-size: 10.5px;
          color: var(--text-slate-400);
          text-transform: capitalize;
        }
        .pp-create-btn {
          height: 32px !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          background: #3B82F6 !important;
          border: none !important;
          box-shadow: none !important;
          margin-bottom: 10px;
          color: #fff !important;
        }
        .pp-create-btn:hover { background: #2563EB !important; }
        .pp-create-btn .anticon { font-size: 12px !important; }
        .pp-side-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pp-side-scroll::-webkit-scrollbar { display: none; }
        .pp-side-section-label {
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-slate-400);
          padding: 0 8px;
          margin: 12px 0 4px;
        }
        .pp-side-scroll > .pp-side-section-label:first-child { margin-top: 2px; }
        .pp-side-list { display: flex; flex-direction: column; gap: 1px; }
        .pp-view-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 6px 8px;
          border-radius: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background .12s ease;
          text-align: left;
        }
        .pp-view-item:hover { background: var(--bg-slate-50); }
        [data-theme='dark'] .pp-view-item:hover { background: #1a222d; }
        .pp-view-item.is-active { background: var(--bg-blue-50); }
        [data-theme='dark'] .pp-view-item.is-active { background: rgba(59,130,246,0.15); }
        .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
        [data-theme='dark'] .pp-view-item.is-active .pp-view-label { color: #f1f5f9; }
        .pp-view-icon { font-size: 13px; width: 15px; display: inline-flex; justify-content: center; }
        .pp-view-label { flex: 1; font-size: 12.5px; font-weight: 500; color: var(--text-slate-700); }
        [data-theme='dark'] .pp-view-label { color: #cbd5e1; }
        .pp-view-count {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-400);
          min-width: 16px;
          text-align: right;
        }
        .pp-view-item.is-active .pp-view-count {
          color: #3B82F6;
          font-weight: 700;
          background: rgba(59,130,246,0.12);
          border-radius: 5px;
          padding: 1px 6px;
          min-width: 0;
        }
        .pp-side-bottom-actions {
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid var(--border-slate-100);
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .pp-side-bottom-actions { background: #0f1419; border-top-color: #1f2937; }

        .pp-main {
          flex: 1;
          min-width: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 100%;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        [data-theme='dark'] .pp-main { background: #0b0f12; }

        .pp-topbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 24px 8px 14px;
          margin-bottom: 0;
          border-bottom: 1px solid var(--border-slate-200);
          flex-wrap: nowrap;
          flex-shrink: 0;
          background: var(--bg-pure-white);
          box-sizing: border-box;
        }
        [data-theme='dark'] .pp-topbar { background: #0f1419; border-bottom-color: #1f2937; }

        .pp-search-wrap {
          position: relative;
          flex: 1;
          max-width: 380px;
          min-width: 180px;
          display: flex;
          align-items: center;
          height: 30px;
          border-radius: 6px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          padding: 0 9px;
        }
        [data-theme='dark'] .pp-search-wrap { background: #131a22; border-color: #1f2937; }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 13px; }
        .pp-search {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          margin-left: 8px;
          font-size: 12.5px;
          color: var(--text-slate-900);
        }
        [data-theme='dark'] .pp-search { color: #f1f5f9; }
        .pp-search::placeholder { color: var(--text-slate-400); }

        .pp-topbar-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11.5px;
          color: var(--text-slate-500);
          white-space: nowrap;
        }
        .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        [data-theme='dark'] .pp-topbar-meta strong { color: #f1f5f9; }

        .pp-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.18);
          margin-right: 4px;
        }

        .pp-topbar-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          flex-shrink: 0;
        }

        .pp-ghost-btn {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50);
          color: var(--text-slate-700);
          cursor: pointer;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }
        .pp-divider { display: none; }

        .pp-body {
          flex: 1;
          min-height: 0;
          padding-bottom: 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Empty state */
        .pp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }
        .pp-empty-orb {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--bg-blue-50);
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .pp-empty-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-slate-800);
          margin-bottom: 4px;
        }
        .pp-empty-sub {
          font-size: 12px;
          color: var(--text-slate-400);
          max-width: 320px;
        }

        /* Table */
        .pp-table-wrap {
          background: var(--bg-pure-white);
          border: none;
          border-radius: 0;
          overflow-y: auto;
          overflow-x: auto;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          margin: 0;
          padding: 0;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pp-table-wrap::-webkit-scrollbar,
        .pp-table-wrap .ant-table-body::-webkit-scrollbar,
        .pp-table-wrap .ant-table-content::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .pp-table-wrap .ant-table-body,
        .pp-table-wrap .ant-table-content {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        [data-theme='dark'] .pp-table-wrap { background: #0b0f12; }
        .pp-table .ant-table-cell-scrollbar,
        .tl-table .ant-table-cell-scrollbar {
          display: none !important;
          width: 0 !important;
          padding: 0 !important;
        }

        .pp-table,
        .pp-table.ant-table-wrapper,
        .pp-table .ant-table,
        .tl-table .ant-table,
        .pp-table .ant-table-container,
        .tl-table .ant-table-container {
          background: transparent;
          font-size: 12px;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-end-start-radius: 0 !important;
          border-end-end-radius: 0 !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
        }
        .pp-table .ant-table-header,
        .tl-table .ant-table-header,
        .pp-table .ant-table-thead,
        .tl-table .ant-table-thead,
        .pp-table .ant-table-thead > tr,
        .tl-table .ant-table-thead > tr {
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-end-start-radius: 0 !important;
          border-end-end-radius: 0 !important;
        }
        .pp-table .ant-table-body,
        .tl-table .ant-table-body {
          flex: 1 1 auto !important;
          max-height: none !important;
          overflow-y: auto !important;
        }
        .pp-table .ant-table-thead > tr > th,
        .tl-table .ant-table-thead > tr > th,
        .pp-table .ant-table-thead > tr > td,
        .tl-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase !important;
          color: var(--text-slate-500) !important;
          padding: 5px 10px !important;
          white-space: nowrap !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-end-start-radius: 0 !important;
          border-end-end-radius: 0 !important;
        }
        .pp-table .ant-table-thead > tr > th::before,
        .tl-table .ant-table-thead > tr > th::before {
          display: none !important;
        }
        [data-theme='dark'] .pp-table .ant-table-thead > tr > th,
        [data-theme='dark'] .tl-table .ant-table-thead > tr > th {
          background: #0f1419 !important;
          border-bottom-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        .pp-table .ant-table-tbody > tr > td,
        .tl-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 4px 10px !important;
          font-size: 11.5px !important;
          border-radius: 0 !important;
        }
        .pp-table .ant-table-cell,
        .tl-table .ant-table-cell {
          line-height: 1.3 !important;
          border-radius: 0 !important;
        }
        [data-theme='dark'] .pp-table .ant-table-tbody > tr > td,
        [data-theme='dark'] .tl-table .ant-table-tbody > tr > td {
          border-bottom-color: #1f2937 !important;
        }
        .pp-table .ant-table-tbody > tr:last-child > td,
        .tl-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td,
        .tl-table .ant-table-tbody > tr.pp-row:hover > td,
        .pp-table .ant-table-tbody > tr:hover > td,
        .tl-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        [data-theme='dark'] .pp-table .ant-table-tbody > tr.pp-row:hover > td,
        [data-theme='dark'] .tl-table .ant-table-tbody > tr.pp-row:hover > td,
        [data-theme='dark'] .pp-table .ant-table-tbody > tr:hover > td,
        [data-theme='dark'] .tl-table .ant-table-tbody > tr:hover > td {
          background: #1e293b !important;
        }
        .pp-table .ant-table-tbody > tr.pp-row {
          cursor: pointer;
        }
        .pp-table .ant-table-selection-column,
        .tl-table .ant-table-selection-column {
          padding-inline: 6px !important;
        }

        /* Footer + pager */
        .pp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 8px 24px 8px 14px;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          box-sizing: border-box;
          flex-shrink: 0;
          margin-top: auto;
          position: sticky;
          bottom: 0;
          z-index: 20;
        }
        [data-theme='dark'] .pp-footer { background: #0f1419; border-top-color: #1f2937; }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        [data-theme='dark'] .pp-footer-info strong { color: #f1f5f9; }

        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          display: inline-flex; align-items: center; justify-content: center;
        }
        [data-theme='dark'] .pp-pager-btn, [data-theme='dark'] .pp-pager-num { background: #131a22; border-color: #1f2937; color: #cbd5e1; }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 6px !important; height: 28px !important; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .pp-backdrop { display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 999; }
        .pp-mobile-toggle { display: none; align-items: center; justify-content: center; background: none; border: none; padding: 8px; cursor: pointer; color: var(--text-slate-600); margin-right: 12px; }
        @media (max-width: 1024px) {
          .pp-sidebar { position: fixed; left: -280px; top: 54px; bottom: 0; height: calc(100vh - 54px); transition: left 0.3s ease; z-index: 1000; box-shadow: 4px 0 24px rgba(15, 23, 42, 0.1); display: flex; }
          .pp-sidebar.is-open { left: 0; }
          .pp-backdrop { display: block; }
          .pp-mobile-toggle { display: flex; }
        }

        /* Grid view cards (matching accounts dashboard) */
        .pp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 10px 24px 10px 14px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          box-sizing: border-box;
          align-content: start;
          align-items: start;
          grid-auto-rows: max-content;
        }
        .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
          height: 154px;
        }
        [data-theme='dark'] .pc-card { background: #0f1419; border-color: #1f2937; }
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
        [data-theme='dark'] .pc-foot { background: #131a22; border-top-color: #1f2937; }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        [data-theme='dark'] .pc-foot-row + .pc-foot-row { border-top-color: #1f2937; }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }
        [data-theme='dark'] .pc-foot-item { color: #cbd5e1; }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-val { font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); flex-shrink: 0; }
        .pc-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .pc-view-btn:hover { text-decoration: underline; }

        .pp-segmented {
          display: inline-flex;
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-slate-50);
          padding: 1px;
        }
        .pp-segmented button {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--text-slate-400);
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all .15s ease;
        }
        .pp-segmented button.is-active {
          background: var(--bg-pure-white);
          color: #3B82F6;
          box-shadow: 0 1px 3px rgba(15,23,42,0.08);
        }

        /* Premium action dropdown */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          overflow: hidden !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .pp-action-pop .ant-dropdown-menu::-webkit-scrollbar { display: none !important; }
        .pp-action-pop,
        .pp-action-pop * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .pp-action-pop ::-webkit-scrollbar { display: none !important; }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-slate-50); color: var(--text-slate-500); font-size: 13px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

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
