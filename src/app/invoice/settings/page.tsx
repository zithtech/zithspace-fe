"use client";
import { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Space,
  Typography,
  Button,
  Card,
  Row,
  Col,
  Steps,
  Dropdown,
  Modal,
  Badge,
  Tag,
  message,
  Divider,
  Spin,
  Drawer,
  Tooltip
} from "antd";

import {
  Plus,
  Search,
  MoreVertical,
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
  Info,
  ShieldAlert,
  Eye,
  PenTool,
  Clock,
  Check,
  MapPin,
  Globe,
  Landmark,
  QrCode,
  Building,
  AlertCircle
} from "lucide-react";
import GeneralSettings from "./GeneralSettings";
import InvoiceSetting from "./InvoiceSetting";
import { useActivateSettingsProfile } from "@/hooks/useInvoiceSettings";


import {
  InvoiceDraft,
  GeneralDraft,
  Draft,
  Currency,
  DateFormat

} from "@/types/invoice";

import BankPaymentSettings from "./PaymentSetting";
import { useSettingsProfiles, useDeleteSettingsProfile, useCreateSettingsProfile, useUpdateSettingsProfile } from "@/hooks/useInvoiceSettings";
import MiniCard from "@/components/customer/MiniCard";


const { Title, Paragraph } = Typography;

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
    // padding: 3,
    // nextNumber: 1,
    // resetYearly: true,
    // lastResetYear: new Date().getFullYear(),
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
  const { canUpdateSettings } = usePermission();
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !canUpdateSettings) {
      router.push('/dashboard');
    }
  }, [authLoading, canUpdateSettings, router]);

  const [mode, setMode] = useState<"view" | "create">("view");
  const { data: savedSettingsData, isLoading, isError, error, refetch } = useSettingsProfiles();

  const [currentStep, setCurrentStep] = useState(0);
  const createMutation = useCreateSettingsProfile();
  const updateMutation = useUpdateSettingsProfile();
  const deleteMutation = useDeleteSettingsProfile();
  const activateMutation = useActivateSettingsProfile();

  const settingsList = savedSettingsData?.data || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const generalFormRef = useRef<any>(null);
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedProfileForView, setSelectedProfileForView] = useState<any>(null);



  const StepButton = ({ id, label, description, icon: Icon, active, completed, onClick }: any) => (
    <div
      onClick={onClick}
      style={{
        padding: "16px 20px",
        borderRadius: 14,
        cursor: "pointer",
        transition: "all 0.2s ease",
        background: active ? "var(--customers-card-bg)" : "transparent",
        boxShadow: active ? "0 4px 6px -1px rgb(0 0 0 / 0.1)" : "none",
        border: active ? "1px solid var(--customers-card-border)" : "1px solid transparent",
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 12,
        opacity: completed || active ? 1 : 0.6
      }}
      className="group"
    >
      <div style={{
        background: active ? "var(--customers-header-icon-color)" : completed ? "#10b981" : "var(--customers-card-border)",
        color: active || completed ? "#ffffff" : "var(--customers-stat-label)",
        width: 40,
        height: 40,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease"
      }}>
        {completed && !active ? <CheckCircle2 size={20} /> : <Icon size={20} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: active ? "var(--text-primary)" : "var(--customers-stat-label)", fontWeight: 600, fontSize: 14 }}>{label}</div>
        <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>{description}</div>
      </div>
      {active && <ChevronRight size={16} style={{ color: "var(--customers-header-icon-color)" }} />}
    </div>
  );

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card
      styles={{ body: { padding: "12px 16px" } }}
      style={{
        borderRadius: 14,
        border: "1px solid var(--customers-card-border)",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        backgroundColor: "var(--customers-card-bg)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Typography.Text style={{ color: "var(--customers-stat-label)", fontSize: 13, fontWeight: 500 }}>{label}</Typography.Text>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--customers-stat-value)", marginTop: 4 }}>{value}</div>
        </div>
        <div style={{
          color,
          background: `${color}12`,
          padding: 12,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );

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
      invoice: {
        format: s.invoice.format,
      },
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

  const activeSettingsCount = settingsList.filter(
    (s) => s.isActive
  ).length;

  const resetDraft = () => {
    setDraft(JSON.parse(JSON.stringify(DEFAULT_DRAFT)));
    setEditingId(null);
    setCurrentStep(0);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };


  // Early Returns for Initialization
  if (authLoading) {
    return (
      <MainLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Spin tip="Initializing session..." />
        </div>
      </MainLayout>
    );
  }

  if (!canUpdateSettings) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center flex-col gap-3">
          <ShieldAlert size={40} className="text-red-400" />
          <Typography.Text style={{ color: "var(--text-slate-400)" }} className="italic">Verifying profile access permissions...</Typography.Text>
          <Button type="link" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
          <Typography.Title level={4} style={{ color: "#ef4444", margin: 0 }}>Failed to Load Settings</Typography.Title>
          <Typography.Text type="secondary" style={{ maxWidth: 400, textAlign: 'center' }}>
            {(error as any)?.message || "An unexpected error occurred while fetching your invoice settings."}
          </Typography.Text>
          <Button type="primary" onClick={() => refetch()} style={{ borderRadius: 10 }}>Retry Connection</Button>
        </div>
      </MainLayout>
    );
  }



  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        padding: "12px 32px 24px 32px",
        background: "var(--customers-page-bg)",
        minHeight: "calc(100vh - 64px)",
        ...(mode === "create" ? {
          height: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        } : {})
      }}>
        {/* ================= HEADER ================= */}
        <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <Space size={8} align="center">
              <div style={{ background: "var(--customers-header-icon-bg)", padding: "6px 8px", borderRadius: 8, color: "var(--customers-header-icon-color)", display: "flex" }}>
                <SettingsIcon size={18} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: "15px" }}>Settings Profiles</Title>
                <Paragraph style={{ color: "var(--text-secondary)", fontSize: "11px", margin: 0 }}>Configure company branding, invoice numbering, and regional formats.</Paragraph>
              </div>
            </Space>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
            {mode === "create" ? (
              <Button
                size="middle"
                icon={<ArrowLeft size={16} />}
                onClick={() => { resetDraft(); setMode("view"); }}
                style={{ borderRadius: 8, height: 38 }}
              >
                Back to Settings
              </Button>
            ) : (
              <Button
                type="primary"
                size="middle"
                icon={<Plus size={16} />}
                onClick={() => {
                  resetDraft();
                  setMode("create");
                  setCurrentStep(0);
                }}
                style={{ borderRadius: 8, height: 38, padding: "0 16px", fontWeight: 600, background: "var(--customers-header-icon-color)", border: "none" }}
              >
                Create Profile
              </Button>
            )}
          </div>
        </div>

        <Divider style={{ margin: "4px -32px 12px -32px", width: "calc(100% + 64px)", borderColor: 'var(--border-color)' }} />

        {mode === "view" && (
          <>
            {/* ================= METRIC STATS ================= */}
            <Row gutter={[24, 24]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={6}>
                <StatCard label="Total Profiles" value={settingsList.length} icon={ShieldCheck} color="#6366f1" />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <StatCard label="Active Profiles" value={activeSettingsCount} icon={CheckCircle2} color="#10b981" />
              </Col>
            </Row>


          </>
        )}




        {/* VIEW MODE */}
        {mode === "view" && (
          <>
            {isLoading ? (
              <div className="flex h-[40vh] items-center justify-center flex-col gap-4">
                <Spin size="large" />
                <Typography.Text style={{ color: "var(--text-slate-500)" }} className="font-medium tracking-wide">Fetching profiles & synchronizing your dashboard...</Typography.Text>
              </div>
            ) : settingsList.length === 0 ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div
                  onClick={() => setMode("create")}
                  className="group relative w-full max-w-lg cursor-pointer rounded-2xl border border-dashed p-10 text-center shadow-sm transition-all duration-300 hover:border-blue-400 hover:shadow-lg" style={{ borderColor: 'var(--border-color)', background: 'linear-gradient(to bottom right, var(--bg-slate-50), var(--customers-card-bg))' }}
                >
                  {/* Icon */}
                  <div
                    className="size-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: 'var(--customers-avatar-bg)', color: 'var(--customers-avatar-text)' }}
                  >
                    <SettingsIcon size={24} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    No Invoice Settings
                  </h3>

                  {/* Description */}
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-slate-500)' }}>
                    Create a configuration to start generating invoices
                  </p>

                  {/* CTA */}
                  <div className="mt-6">
                    <Button
                      type="primary"
                      icon={<Plus size={18} />}
                      size="large"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMode("create");
                      }}
                    >
                      Create Settings
                    </Button>
                  </div>

                  {/* Hover hint */}
                  <span className="pointer-events-none absolute bottom-4 right-4 text-xs opacity-0 transition group-hover:opacity-100" style={{ color: 'var(--text-slate-400)' }}>
                    Click anywhere to create
                  </span>
                </div>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {settingsList.map((setting) => (
                  <Col xs={24} sm={12} md={12} lg={8} xl={6} key={setting.id}>
                    <Badge.Ribbon
                      text={<span className="flex items-center gap-1.5"><Check size={12} /> Active</span>}
                      color="#10b981"
                      style={{ display: setting.isActive ? "flex" : "none", zIndex: 1, padding: "0 10px", borderRadius: "0 8px 0 8px" }}
                    >
                      <Card
                        hoverable
                        className="rounded-2xl border-none shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] group/card h-full flex flex-col"
                        styles={{ body: { padding: 0 } }}
                        onClick={() => {
                          setSelectedProfileForView(setting);
                          setViewDrawerVisible(true);
                        }}
                      >
                        {/* CARD BODY: General Info */}
                        <div className="p-6 flex-1">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 p-2 rounded-2xl flex items-center justify-center border shrink-0 group-hover/card:border-blue-100 group-hover/card:bg-blue-50/30 transition-colors" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--customers-card-border)' }}>
                              {setting.general?.companyLogo ? (
                                <img
                                  src={setting.general.companyLogo}
                                  alt="Logo"
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Building2 size={28} style={{ color: 'var(--text-slate-300)' }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                              <h3 className="text-lg font-bold truncate mb-0.5 group-hover/card:text-blue-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
                                {setting.general?.companyName || "Unnamed Profile"}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] font-mono px-2 py-0.5 rounded-md inline-block border" style={{ color: 'var(--customers-avatar-text)', backgroundColor: 'var(--customers-avatar-bg)', borderColor: 'var(--customers-avatar-border)' }}>
                                  {(setting.invoice?.format || "—").toUpperCase()}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-slate-400)' }}>Address</p>
                            <div className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
                              <p className="truncate">
                                {[
                                  setting.general?.address?.plot_no,
                                  setting.general?.address?.floor_no,
                                  setting.general?.address?.building_name,
                                ].filter(Boolean).join(", ") || "—"}
                              </p>
                              <p className="truncate" style={{ color: 'var(--text-slate-500)' }}>
                                {[
                                  setting.general?.address?.street,
                                  setting.general?.address?.area,
                                ].filter(Boolean).join(", ")}
                              </p>
                              <p className="truncate" style={{ color: 'var(--text-slate-500)' }}>
                                {[
                                  setting.general?.address?.city,
                                  setting.general?.address?.pincode,
                                  setting.general?.address?.country,
                                ].filter(Boolean).join(", ")}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CARD FOOTER: Actions */}
                        <div className="px-6 py-4 flex items-center justify-between rounded-b-2xl" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--customers-card-border)', borderTop: '1px solid var(--customers-card-border)' }}>
                          <div className="flex gap-2">
                            <Tooltip title="View Details">
                              <Button
                                type="text"
                                size="small"
                                icon={<Eye size={16} />}
                                onClick={() => {
                                  setSelectedProfileForView(setting);
                                  setViewDrawerVisible(true);
                                }}
                                className="rounded-lg flex items-center justify-center p-0 w-8 h-8" style={{ color: 'var(--text-slate-400)' }}
                              />
                            </Tooltip>
                            <Tooltip title="Edit Profile">
                              <Button
                                type="text"
                                size="small"
                                icon={<Edit size={16} />}
                                onClick={() => handleEdit(setting.id)}
                                className="rounded-lg flex items-center justify-center p-0 w-8 h-8" style={{ color: 'var(--text-slate-400)' }}
                              />
                            </Tooltip>
                            <Tooltip title="Delete Profile">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<Trash2 size={16} />}
                                onClick={() => handleDelete(setting.id)}
                                className="rounded-lg flex items-center justify-center p-0 w-8 h-8" style={{ color: 'var(--text-slate-300)' }}
                              />
                            </Tooltip>
                          </div>

                          <Button
                            size="small"
                            type={setting.isActive ? "default" : "primary"}
                            onClick={() => {
                              activateMutation.mutate({
                                id: setting.id,
                                isActive: !setting.isActive
                              });
                            }}
                            className={`rounded-lg text-[10px] font-bold uppercase tracking-wider h-8 ${setting.isActive ? '' : 'border-none'}`} style={{ borderColor: setting.isActive ? 'var(--customers-card-border)' : '', color: setting.isActive ? 'var(--text-slate-400)' : '#ffffff', backgroundColor: setting.isActive ? 'var(--customers-card-bg)' : 'var(--customers-header-icon-color)' }}
                          >
                            {setting.isActive ? "Deactivate" : "Set Active"}
                          </Button>
                        </div>
                      </Card>
                    </Badge.Ribbon>
                  </Col>
                ))}
              </Row>






            )}
          </>
        )}

        {/* CREATE MODE */}
        {mode === "create" && (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32, marginTop: 8, flex: 1, minHeight: 0 }}>
            {/* SIDEBAR NAVIGATION */}
            <div className="no-scrollbar" style={{ overflowY: "auto", height: "100%", paddingRight: 4, paddingBottom: 24 }}>
              <div style={{
                backgroundColor: "var(--customers-card-bg)",
                padding: "24px 16px",
                borderRadius: 20,
                border: "1px solid var(--customers-card-border)"
              }}>
                <div style={{ marginBottom: 24, paddingLeft: 8 }}>
                  <Typography.Text style={{ color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em" }}>
                    Configuration steps
                  </Typography.Text>
                </div>

                <StepButton
                  label="General Details"
                  description="Logo, Address & Regional"
                  icon={Building2}
                  active={currentStep === 0}
                  completed={currentStep > 0}
                  onClick={() => setCurrentStep(0)}
                />

                <StepButton
                  label="Invoice Format"
                  description="Numbering & Prefix"
                  icon={ReceiptText}
                  active={currentStep === 1}
                  completed={currentStep > 1}
                  onClick={async () => {
                    try {
                      await generalFormRef.current?.validateFields();
                      setCurrentStep(1);
                    } catch {
                      message.error("Complete General Details first");
                    }
                  }}
                />

                <StepButton
                  label="Payment Info"
                  description="Bank & QR Code"
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

                <div style={{
                  marginTop: 32,
                  padding: 16,
                  backgroundColor: "var(--customers-card-bg)",
                  borderRadius: 16,
                  border: "1px solid var(--customers-card-border)",
                  display: "flex",
                  gap: 12
                }}>
                  <div style={{ color: "var(--customers-header-icon-color)" }}><Info size={18} /></div>
                  <Typography.Text style={{ fontSize: 12, color: "var(--customers-stat-label)", lineHeight: 1.5 }}>
                    Each profile represents a different business entity or branding scheme.
                  </Typography.Text>
                </div>
              </div>
            </div>

            {/* CONTENT AREA */}
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
              <Card
                style={{
                  borderRadius: 24,
                  border: "1px solid var(--customers-card-border)",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.04)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  backgroundColor: "var(--customers-card-bg)"
                }}
                styles={{ body: { padding: 0, display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" } }}
              >
                <div style={{ padding: "16px 32px", borderBottom: "1px solid var(--customers-card-border)", background: "linear-gradient(to right, var(--customers-card-bg), var(--bg-slate-50))", flexShrink: 0 }}>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)" }}>
                    {currentStep === 0 && "General Information"}
                    {currentStep === 1 && "Invoice Configuration"}
                    {currentStep === 2 && "Payment & Bank Details"}
                  </Title>
                  <Paragraph style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: 13 }}>
                    {currentStep === 0 && "Set up your company branding and regional localization."}
                    {currentStep === 1 && "Define how your invoice numbers are generated."}
                    {currentStep === 2 && "Add payment methods and bank information."}
                  </Paragraph>
                </div>

                <div className="no-scrollbar" style={{ padding: "24px 32px 100px 32px", overflowY: "auto", flex: 1 }}>
                  <div className="max-w-4xl mx-auto">
                    {currentStep === 0 && (
                      <GeneralSettings
                        formRef={generalFormRef}
                        initialValues={draft.general}
                        onSave={(data) => setDraft((prev) => ({ ...prev, general: data }))}
                      />
                    )}

                    {currentStep === 1 && (
                      <InvoiceSetting
                        initialValues={draft.invoice}
                        onSave={(data) => setDraft((prev) => ({ ...prev, invoice: data }))}
                      />
                    )}

                    {currentStep === 2 && (
                      <BankPaymentSettings
                        initialValues={draft.payment}
                        onSave={(data) => setDraft((prev) => ({ ...prev, payment: data }))}
                      />
                    )}
                  </div>
                </div>

              </Card>
            </div>

            <div className="fixed bottom-0 left-0 w-full backdrop-blur-md border-t p-6 flex justify-between items-center z-50 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)]" style={{ backgroundColor: 'var(--customers-page-bg)', borderColor: 'var(--border-color)' }}>
              {/* BACK */}
              <div style={{ paddingLeft: "5%" }}>
                <Button
                  size="large"
                  disabled={currentStep === 0}
                  icon={<ArrowLeft size={18} />}
                  onClick={() => setCurrentStep((s) => s - 1)}
                  style={{ borderRadius: 12, height: 48, padding: "0 28px", fontWeight: 600 }}
                >
                  Previous Step
                </Button>
              </div>

              {/* NEXT / SAVE */}
              <div style={{ paddingRight: "5%" }}>
                {currentStep < 2 ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<ChevronRight size={18} />}
                    style={{
                      borderRadius: 12,
                      height: 48,
                      padding: "0 32px",
                      fontWeight: 700,
                      backgroundColor: "var(--customers-header-icon-color)",
                      display: "flex",
                      flexDirection: "row-reverse",
                      gap: 8,
                      alignItems: "center"
                    }}
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
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircle2 size={18} />}
                    loading={createMutation.isPending || updateMutation.isPending}
                    style={{
                      borderRadius: 12,
                      height: 48,
                      padding: "0 36px",
                      fontWeight: 700,
                      backgroundColor: "#10b981",
                      border: "none",
                      display: "flex",
                      gap: 8,
                      alignItems: "center"
                    }}
                    onClick={async () => {
                      try {
                        await generalFormRef.current?.validateFields();
                      } catch {
                        setCurrentStep(0);
                        message.error("Please fix errors in General tab");
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
                              message.success("Settings updated successfully!");
                              refetch();
                              resetDraft();
                              setMode("view");
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
                            resetDraft();
                            setMode("view");
                          },
                          onError: (err) => console.error(err),
                        });
                      }
                    }}
                  >
                    {editingId ? "Update Profile" : "Save & Finish"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}


        <Drawer
          title={null}
          closable={false}
          placement="right"
          onClose={() => setViewDrawerVisible(false)}
          open={viewDrawerVisible}
          width={720}
          styles={{
            body: { padding: 0, backgroundColor: 'var(--customers-page-bg)' },
            header: { display: 'none' }
          }}
        >
          {selectedProfileForView && (
            <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg-slate-50)' }}>
              {/* Header */}
              <div className="px-6 py-5 shadow-sm" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)', borderBottom: '1px solid var(--customers-card-border)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--customers-card-border)' }}>
                      {selectedProfileForView.general?.companyLogo ? (
                        <img
                          src={selectedProfileForView.general.companyLogo}
                          alt="Logo"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <Building2 size={24} style={{ color: 'var(--text-slate-300)' }} />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold m-0 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {selectedProfileForView.general?.companyName || "Untitled Profile"}
                      </h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        {selectedProfileForView.isActive ? (
                          <Tag color="success" className="rounded-full px-2.5 font-semibold text-[10px] uppercase tracking-wider m-0 flex items-center gap-1 border-none bg-emerald-50 text-emerald-600">
                            <Check size={10} strokeWidth={3} /> Active Configuration
                          </Tag>
                        ) : (
                          <Tag className="rounded-full px-2.5 font-semibold text-[10px] uppercase tracking-wider m-0 border-none" style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-slate-500)' }}>
                            Inactive
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewDrawerVisible(false)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all border border-transparent" style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-slate-400)' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                {/* BUSINESS & REGIONAL GROUP */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Business Address Card */}
                  <div className="rounded-2xl border p-4 shadow-sm flex flex-col hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--customers-avatar-bg)', color: 'var(--customers-avatar-text)' }}>
                        <MapPin size={14} />
                      </div>
                      <h3 className="text-[10px] font-extrabold uppercase tracking-widest m-0 leading-none" style={{ color: 'var(--text-slate-400)' }}>Business Address</h3>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed m-0 font-medium whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                        {(() => {
                          const addr = selectedProfileForView.general?.address;
                          if (!addr) return "No address configured";
                          const parts = [
                            [addr.plot_no, addr.floor_no, addr.building_name].filter(Boolean).join(", "),
                            addr.street,
                            addr.area,
                            [addr.city, addr.pincode].filter(Boolean).join(" - "),
                            addr.country
                          ].filter(Boolean);

                          return parts.length > 0 ? parts.join("\n") : "No address configured";
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Regional Settings Card */}
                  <div className="rounded-2xl border p-4 shadow-sm flex flex-col hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--drawer-icon-bg-indigo)', color: 'var(--drawer-icon-text-indigo)' }}>
                        <Globe size={14} />
                      </div>
                      <h3 className="text-[10px] font-extrabold uppercase tracking-widest m-0 leading-none" style={{ color: 'var(--text-slate-400)' }}>Regional Settings</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--text-slate-400)' }}>Base Currency</span>
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--customers-card-border)' }}>
                          <span style={{ color: 'var(--customers-avatar-text)' }} className="font-bold">{selectedProfileForView.general.currency}</span>
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>ISO-4217 Standard</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--text-slate-400)' }}>Date Format</span>
                        <div className="font-mono text-sm font-semibold rounded-lg px-3 py-2 border" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--customers-card-border)' }}>
                          {selectedProfileForView.general.dateFormat || "MM/DD/YYYY"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INVOICE & TAX GROUP */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Invoice Formatting */}
                  <div className="rounded-2xl border p-4 shadow-sm flex flex-col hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#fef3c7', color: '#f97316' }}>
                        <ReceiptText size={14} />
                      </div>
                      <h3 className="text-[10px] font-extrabold uppercase tracking-widest m-0 leading-none" style={{ color: 'var(--text-slate-400)' }}>Invoice Format</h3>
                    </div>
                    <div className="mt-auto">
                      <div className="rounded-xl p-4 relative overflow-hidden group border" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--customers-card-border)' }}>
                        <div className="absolute inset-0 opacity-50" style={{ background: 'linear-gradient(to bottom right, var(--bg-slate-50), transparent)' }}></div>
                        <code className="text-lg font-mono font-bold block text-center tracking-wider relative z-10" style={{ color: 'var(--text-primary)' }}>
                          {selectedProfileForView.invoice.format.toUpperCase()}
                        </code>
                        <span className="text-[8px] font-bold uppercase block text-center mt-2 relative z-10" style={{ color: 'var(--text-slate-400)' }}>Current Sequence Mask</span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Identifiers */}
                  <div className="rounded-2xl border p-4 shadow-sm flex flex-col hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                        <ShieldCheck size={14} />
                      </div>
                      <h3 className="text-[10px] font-extrabold uppercase tracking-widest m-0 leading-none" style={{ color: 'var(--text-slate-400)' }}>Compliance Info</h3>
                    </div>
                    <div className="space-y-4">
                      {selectedProfileForView.general.gstin && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">GSTIN</span>
                          <p className="text-sm font-mono font-bold text-slate-700 m-0 bg-emerald-50/30 px-2 py-1 rounded border border-emerald-100/50 inline-block">{selectedProfileForView.general.gstin}</p>
                        </div>
                      )}
                      {selectedProfileForView.general.pan && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PAN Number</span>
                          <p className="text-sm font-mono font-bold text-slate-700 m-0 bg-blue-50/30 px-2 py-1 rounded border border-blue-100/50 inline-block">{selectedProfileForView.general.pan}</p>
                        </div>
                      )}
                      {!selectedProfileForView.general.gstin && !selectedProfileForView.general.pan && (
                        <div className="flex flex-col items-center justify-center flex-1 min-h-[80px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          <AlertCircle size={20} className="text-slate-300 mb-2" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">No identifiers set</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* FINANCIAL DETAILS CARD */}
                <div className="rounded-3xl border p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Landmark size={80} />
                  </div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--customers-header-icon-color)', color: '#ffffff' }}>
                      <CreditCard size={18} />
                    </div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider m-0" style={{ color: 'var(--text-primary)' }}>Payment & Bank Details</h3>
                  </div>

                  {selectedProfileForView.payment.bankName ||
                    selectedProfileForView.payment.accountNumber ||
                    selectedProfileForView.payment.ifscCode ||
                    selectedProfileForView.payment.qrCode ? (
                    <div className="grid grid-cols-12 gap-6 items-center">
                      <div className="col-span-12 md:col-span-8 space-y-5">
                        {selectedProfileForView.payment.bankName && (
                          <div>
                            <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--text-slate-400)' }}>Financial Institution</span>
                            <p className="text-base font-bold m-0" style={{ color: 'var(--text-primary)' }}>{selectedProfileForView.payment.bankName}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-6">
                          {selectedProfileForView.payment.accountNumber && (
                            <div>
                              <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--text-slate-400)' }}>Account Number</span>
                              <p className="text-sm font-mono font-extrabold m-0" style={{ color: 'var(--text-primary)' }}>{selectedProfileForView.payment.accountNumber}</p>
                            </div>
                          )}
                          {selectedProfileForView.payment.ifscCode && (
                            <div>
                              <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--text-slate-400)' }}>IFSC Code</span>
                              <p className="text-sm font-mono font-extrabold m-0 px-2 py-0.5 rounded inline-block" style={{ color: 'var(--customers-avatar-text)', backgroundColor: 'var(--customers-avatar-bg)' }}>{selectedProfileForView.payment.ifscCode}</p>
                            </div>
                          )}
                        </div>
                        {selectedProfileForView.payment.branchName && (
                          <div>
                            <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--text-slate-400)' }}>Branch Name</span>
                            <p className="text-sm font-semibold m-0 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                              <Building size={14} style={{ color: 'var(--text-slate-400)' }} /> {selectedProfileForView.payment.branchName}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Payment QR Section */}
                      <div className="col-span-12 md:col-span-4 flex justify-center">
                        <div className="p-3 rounded-2xl border w-full max-w-[140px] text-center shadow-inner" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--customers-card-border)' }}>
                          {selectedProfileForView.payment.qrCode ? (
                            <>
                              <div className="rounded-xl border p-2 shadow-sm mb-2" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                                <img src={selectedProfileForView.payment.qrCode} alt="QR Code" className="w-full h-auto rounded" />
                              </div>
                              <span className="text-[9px] font-extrabold uppercase tracking-tighter" style={{ color: 'var(--text-slate-400)' }}>Fast Billing QR</span>
                            </>
                          ) : (
                            <div className="py-6 flex flex-col items-center opacity-40">
                              <QrCode size={32} style={{ color: 'var(--text-slate-300)' }} className="mb-2" />
                              <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-slate-400)' }}>No QR Code</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--customers-card-border)' }}>
                      <CreditCard size={32} style={{ color: 'var(--text-slate-200)' }} className="mb-3" />
                      <p className="text-sm font-semibold m-0 tracking-tight" style={{ color: 'var(--text-slate-400)' }}>Payment Method Not Configured</p>
                    </div>
                  )}
                </div>

                {/* SIGNATURE SECTION */}
                <div className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-slate-50)', color: 'var(--text-slate-500)' }}>
                      <PenTool size={14} />
                    </div>
                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest m-0 leading-none" style={{ color: 'var(--text-slate-400)' }}>Authorized Signature</h3>
                  </div>
                  <div className="rounded-2xl p-6 flex justify-center border border-dashed min-h-[120px] items-center" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--customers-card-border)' }}>
                    {selectedProfileForView.general.signature ? (
                      <div className="relative group">
                        <div className="absolute -inset-2 bg-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img
                          src={selectedProfileForView.general.signature}
                          alt="Signature"
                          className="max-h-20 object-contain drop-shadow-sm relative z-10 grayscale-[0.5] contrast-125"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-slate-300)' }}>
                        <PenTool size={28} strokeWidth={1} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Pending Upload</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </Drawer>

        <Modal
          open={deleteModalOpen}
          onCancel={() => setDeleteModalOpen(false)}
          footer={null}
          width={440}
          centered
          closable={false}
          styles={{
            body: { padding: 0, overflow: 'hidden', borderRadius: '24px' },
            mask: { backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.6)' },
            content: { borderRadius: '24px', padding: 0, backgroundColor: 'var(--customers-modal-bg)' }
          }}
          className="overflow-hidden"
        >
          <div className="relative">
            {/* Decorative Background Header */}
            <div className="h-32 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, var(--customers-delete-header-bg), var(--customers-modal-bg))' }}>
              {/* Icon Container */}
              <div className="w-20 h-20 rounded-[20px] flex items-center justify-center border relative z-10 bottom-[-24px]" style={{ backgroundColor: 'var(--customers-modal-bg)', borderColor: 'var(--customers-delete-icon-bg)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: 'var(--customers-delete-icon-bg)', color: 'var(--customers-delete-icon-color)', borderColor: 'var(--customers-delete-icon-bg)' }}>
                  <Trash2 size={28} strokeWidth={2} />
                </div>
              </div>
            </div>

            <div className="px-8 pt-10 pb-8 text-center flex flex-col items-center">
              <h3 className="text-2xl font-extrabold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Delete Profile permanently?
              </h3>

              <p className="text-[14px] leading-relaxed mb-6 font-medium" style={{ color: 'var(--text-secondary)' }}>
                Are you absolutely sure? This action will permanently erase the configuration, including:
              </p>

              <div className="flex flex-wrap justify-center gap-2 mb-8 w-full">
                <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><Building2 size={14} style={{ color: 'var(--customers-header-icon-color)' }} /> General Info</span>
                <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><ReceiptText size={14} style={{ color: '#f59e0b' }} /> Invoice Format</span>
                <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><CreditCard size={14} style={{ color: '#10b981' }} /> Payment Rules</span>
              </div>

              <div className="flex w-full gap-4">
                <Button
                  size="large"
                  className="flex-1 rounded-[16px] h-14 font-bold border-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-slate-400)' }}
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Keep Profile
                </Button>
                <Button
                  size="large"
                  danger
                  type="primary"
                  loading={deleteMutation.isPending}
                  className="flex-1 rounded-[16px] h-14 font-bold border-none shadow-sm transition-all"
                  style={{ backgroundColor: '#ef4444' }}
                  onClick={() => {
                    if (deleteId) {
                      deleteMutation.mutate(deleteId, {
                        onSuccess: () => {
                          setDeleteModalOpen(false);
                          setDeleteId(null);
                        }
                      });
                    }
                  }}
                >
                  Yes, Delete
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}


