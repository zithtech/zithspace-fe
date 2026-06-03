"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
  const { data: savedSettingsData, isLoading, isError, error, refetch } =
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
      <div
        style={{
          margin: "0 -24px",
          background: "var(--customers-page-bg)",
          minHeight: "calc(100vh - 64px)",
          ...(mode === "create"
            ? {
                height: "calc(100vh - 64px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }
            : {}),
        }}
      >
        {/* TOP BAR */}
        <div
          className="sticky top-0 z-40 backdrop-blur-md border-b"
          style={{
            background:
              "color-mix(in oklab, var(--customers-page-bg) 85%, transparent)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (mode === "create") {
                    resetDraft();
                    setMode("view");
                  } else {
                    router.push("/invoice/invoices");
                  }
                }}
                className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
                aria-label="Back"
                style={{ color: "var(--text-secondary)" }}
              >
                <ChevronLeft size={18} />
              </button>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "var(--bg-blue-50)",
                  color: "var(--text-blue-700)",
                  border: "1px solid var(--border-blue-200)",
                }}
              >
                <SettingsIcon size={14} strokeWidth={2.25} />
              </div>
              <span
                className="text-[14px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {mode === "create"
                  ? editingId
                    ? "Edit settings profile"
                    : "New settings profile"
                  : "Settings profiles"}
              </span>
              <span
                className="h-4 w-px"
                style={{ background: "var(--border-color)" }}
              />
              <span
                className="text-[12px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {mode === "create"
                  ? "Configure branding, numbering & payment for this profile"
                  : "Configure company branding, invoice numbering, and regional formats"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {mode === "view" ? (
                canCreateInvoiceSetting && (
                  <Button
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      resetDraft();
                      setMode("create");
                      setCurrentStep(0);
                    }}
                    style={{
                      borderRadius: 8,
                      height: 36,
                      fontWeight: 600,
                      background: "#2563eb",
                    }}
                  >
                    New profile
                  </Button>
                )
              ) : (
                <Button
                  icon={<ArrowLeft size={14} />}
                  onClick={() => {
                    resetDraft();
                    setMode("view");
                  }}
                  style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
                >
                  Back to profiles
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* VIEW MODE */}
        {mode === "view" && (
          <div className="px-8 pt-6 pb-12">
            <div className="mx-auto max-w-[1600px]">
              {/* STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <StatTile
                  label="Total profiles"
                  value={isLoading ? "—" : settingsList.length}
                  icon={ShieldCheck}
                  accent="#2563eb"
                />
                <StatTile
                  label="Active"
                  value={isLoading ? "—" : activeSettingsCount}
                  icon={CheckCircle2}
                  accent="#10b981"
                />
                <StatTile
                  label="Inactive"
                  value={isLoading ? "—" : inactiveCount}
                  icon={AlertCircle}
                  accent="#f43f5e"
                />
              </div>

              {/* TOOLS */}
              {settingsList.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {filterPills.map((p) => {
                      const active = statusFilter === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setStatusFilter(p.key)}
                          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium transition-all"
                          style={{
                            background: active
                              ? "var(--bg-blue-50)"
                              : "var(--bg-secondary)",
                            color: active
                              ? "var(--text-blue-700)"
                              : "var(--text-secondary)",
                            border: `1px solid ${
                              active
                                ? "var(--border-blue-200)"
                                : "var(--border-color)"
                            }`,
                            boxShadow: active
                              ? "0 0 0 3px rgba(96,165,250,0.12)"
                              : "none",
                          }}
                        >
                          {p.label}
                          <span
                            className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-md text-[11px] font-semibold tabular-nums"
                            style={{
                              background: active
                                ? "white"
                                : "var(--bg-slate-50)",
                              color: active
                                ? "var(--text-blue-700)"
                                : "var(--text-secondary)",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            {p.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search profiles..."
                      prefix={
                        <Search
                          size={14}
                          style={{ color: "var(--text-secondary)" }}
                        />
                      }
                      allowClear
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{
                        width: 280,
                        borderRadius: 8,
                        height: 36,
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                      }}
                    />
                    <div
                      className="inline-flex items-center h-9 rounded-lg p-0.5"
                      style={{
                        background: "var(--bg-slate-50)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <Tooltip title="Card view">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => setViewMode("card")}
                          className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold transition-all"
                          style={{
                            background:
                              viewMode === "card"
                                ? "var(--bg-secondary)"
                                : "transparent",
                            color:
                              viewMode === "card"
                                ? "var(--text-blue-700)"
                                : "var(--text-secondary)",
                            boxShadow:
                              viewMode === "card"
                                ? "0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px var(--border-color)"
                                : "none",
                          }}
                        >
                          <LayoutGrid size={14} strokeWidth={2.25} />
                          Cards
                        </button>
                      </Tooltip>
                      <Tooltip title="Table view">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => setViewMode("table")}
                          className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold transition-all"
                          style={{
                            background:
                              viewMode === "table"
                                ? "var(--bg-secondary)"
                                : "transparent",
                            color:
                              viewMode === "table"
                                ? "var(--text-blue-700)"
                                : "var(--text-secondary)",
                            boxShadow:
                              viewMode === "table"
                                ? "0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px var(--border-color)"
                                : "none",
                          }}
                        >
                          <List size={14} strokeWidth={2.25} />
                          Table
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENT */}
              {isLoading ? (
                <div
                  className="flex justify-center items-center h-64 rounded-2xl"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <Spin />
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
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <Table
                    rowKey="id"
                    dataSource={filteredSettings}
                    pagination={{
                      pageSize: 10,
                      style: { padding: "12px 20px" },
                    }}
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
                                background: "#ecfdf5",
                                color: "#047857",
                                border: "1px solid #a7f3d0",
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                  {filteredSettings.map((setting) => {
                    const addr = setting.general?.address;
                    const addressLines = [
                      [addr?.plot_no, addr?.floor_no, addr?.building_name]
                        .filter(Boolean)
                        .join(", "),
                      [addr?.street, addr?.area].filter(Boolean).join(", "),
                      [addr?.city, addr?.pincode, addr?.country]
                        .filter(Boolean)
                        .join(", "),
                    ].filter(Boolean);

                    return (
                      <div
                        key={setting.id}
                        className="profile-card group rounded-2xl cursor-pointer transition-all relative overflow-hidden"
                        style={{
                          background: "var(--bg-secondary)",
                          border: `1px solid ${
                            setting.isActive
                              ? "var(--border-blue-200)"
                              : "var(--border-color)"
                          }`,
                        }}
                        onClick={() => {
                          setSelectedProfileForView(setting);
                          setViewDrawerVisible(true);
                        }}
                      >
                        {setting.isActive && (
                          <span
                            className="absolute top-0 left-0 right-0 h-[2px]"
                            style={{ background: "#2563eb" }}
                          />
                        )}

                        {/* Body */}
                        <div className="p-5">
                          <div className="flex items-start gap-3 mb-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                              style={{
                                background: setting.general?.companyLogo
                                  ? "var(--bg-secondary)"
                                  : "var(--bg-blue-50)",
                                color: "var(--text-blue-700)",
                                border: "1px solid var(--border-color)",
                              }}
                            >
                              {setting.general?.companyLogo ? (
                                <img
                                  src={setting.general.companyLogo}
                                  alt="Logo"
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <Building2 size={20} strokeWidth={2.25} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-[15px] font-semibold leading-tight truncate"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {setting.general?.companyName ||
                                  "Unnamed profile"}
                              </div>
                              <span
                                className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                                style={
                                  setting.isActive
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
                                    background: setting.isActive
                                      ? "#10b981"
                                      : "#94a3b8",
                                  }}
                                />
                                {setting.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>

                          {/* Format chip */}
                          <div className="mb-3">
                            <div
                              className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1.5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Invoice format
                            </div>
                            <code
                              className="inline-flex items-center px-2 py-1 rounded-md text-[12px] font-semibold"
                              style={{
                                background: "var(--bg-slate-50)",
                                color: "var(--text-primary)",
                                border: "1px solid var(--border-color)",
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                              }}
                            >
                              {setting.invoice?.format || "—"}
                            </code>
                          </div>

                          {/* Address */}
                          <div>
                            <div
                              className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1.5 flex items-center gap-1.5"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <MapPin size={10} />
                              Address
                            </div>
                            <div
                              className="text-[12px] leading-relaxed line-clamp-3"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {addressLines.length > 0
                                ? addressLines.join(", ")
                                : "—"}
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div
                          className="px-5 py-3 flex items-center justify-between gap-2"
                          style={{
                            borderTop: "1px solid var(--border-color)",
                            background: "var(--bg-slate-50)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1">
                            <Tooltip title="View details">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProfileForView(setting);
                                  setViewDrawerVisible(true);
                                }}
                                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)]"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                <Eye size={14} />
                              </button>
                            </Tooltip>
                             {canUpdateInvoiceSetting && (
                               <Tooltip title="Edit profile">
                                 <button
                                   type="button"
                                   onClick={() => handleEdit(setting.id)}
                                   className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)]"
                                   style={{ color: "var(--text-secondary)" }}
                                 >
                                   <Edit size={14} />
                                 </button>
                               </Tooltip>
                             )}
                             {canDeleteInvoiceSetting && (
                               <Tooltip title="Delete">
                                 <button
                                   type="button"
                                   onClick={() => handleDelete(setting.id)}
                                   className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)]"
                                   style={{ color: "#dc2626" }}
                                 >
                                   <Trash2 size={14} />
                                 </button>
                               </Tooltip>
                             )}
                          </div>

                          {canUpdateInvoiceSetting && (
                            <button
                              type="button"
                              onClick={() => {
                                activateMutation.mutate({
                                  id: setting.id,
                                  isActive: !setting.isActive,
                                });
                              }}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[11.5px] font-semibold transition-colors"
                            style={
                              setting.isActive
                                ? {
                                    background: "var(--bg-secondary)",
                                    color: "var(--text-secondary)",
                                    border: "1px solid var(--border-color)",
                                  }
                                : {
                                    background: "#2563eb",
                                    color: "#fff",
                                    border: "1px solid #2563eb",
                                  }
                            }
                          >
                            <Power size={12} strokeWidth={2.25} />
                            {setting.isActive ? "Deactivate" : "Set active"}
                          </button>
                        )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CREATE MODE */}
        {mode === "create" && (
          <div
            className="flex-1 min-h-0 px-8 pt-6 pb-24"
            style={{ display: "flex", flexDirection: "column" }}
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
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
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
                background: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              <AlertCircle
                size={14}
                className="mt-0.5 flex-shrink-0"
                style={{ color: "#dc2626" }}
              />
              <span className="text-[12px]" style={{ color: "#991b1b" }}>
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
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .profile-card:hover {
          border-color: #93c5fd !important;
          box-shadow: 0 0 0 3px rgba(96,165,250,0.10), 0 4px 12px -2px rgba(15,23,42,0.06);
        }
        .profiles-table .ant-table-thead > tr > th {
          background-color: var(--bg-slate-50) !important;
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          padding: 10px 16px !important;
          letter-spacing: 0.06em !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .profiles-table .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .profiles-table .ant-table-row:hover > td {
          background-color: var(--bg-slate-50) !important;
        }
        .profiles-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
      `,
        }}
      />
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
      className={`text-[14px] font-semibold leading-tight mt-1 ${
        truncate ? "truncate" : ""
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
