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
  MapPin
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
        background: active ? "#ffffff" : "transparent",
        boxShadow: active ? "0 4px 6px -1px rgb(0 0 0 / 0.1)" : "none",
        border: active ? "1px solid #f1f5f9" : "1px solid transparent",
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 12,
        opacity: completed || active ? 1 : 0.6
      }}
      className="group"
    >
      <div style={{
        background: active ? "#3b82f6" : completed ? "#10b981" : "#f1f5f9",
        color: active || completed ? "#ffffff" : "#64748b",
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
        <div style={{ color: active ? "#1e293b" : "#64748b", fontWeight: 600, fontSize: 14 }}>{label}</div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{description}</div>
      </div>
      {active && <ChevronRight size={16} style={{ color: "#3b82f6" }} />}
    </div>
  );

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card
      styles={{ body: { padding: "12px 16px" } }}
      style={{
        borderRadius: 14,
        border: "1px solid #f1f5f9",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Typography.Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Typography.Text>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
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
          <Typography.Text className="text-slate-400 italic">Verifying profile access permissions...</Typography.Text>
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
          <Spin size="large" />
          <Typography.Text className="text-slate-500 font-medium tracking-wide">Fetching profiles & synchronizing your dashboard...</Typography.Text>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        padding: "24px 32px",
        background: "#ffffff",
        minHeight: "calc(100vh - 64px)"
      }}>
        {/* ================= HEADER ================= */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <Space size={14} align="center">
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 14, color: "#475569", display: "flex" }}>
                <SettingsIcon size={28} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Settings Profiles</Title>
                <Paragraph style={{ color: "#64748b", fontSize: 15, margin: 0 }}>Configure company branding, invoice numbering, and regional formats.</Paragraph>
              </div>
            </Space>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
            {mode === "create" ? (
              <Button
                size="large"
                icon={<ArrowLeft size={18} />}
                onClick={() => { resetDraft(); setMode("view"); }}
                style={{ borderRadius: 12, height: 44 }}
              >
                Back to Settings
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<Plus size={18} />}
                onClick={() => {
                  resetDraft();
                  setMode("create");
                  setCurrentStep(0);
                }}
                style={{ borderRadius: 12, height: 44, padding: "0 24px", fontWeight: 600, background: "#2563eb", border: "none" }}
              >
                Create Profile
              </Button>
            )}
          </div>
        </div>

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

            <Divider style={{ marginTop: "0", borderTop: "1px solid #f1f5f9" }} />
          </>
        )}




        {/* VIEW MODE */}
        {mode === "view" && (
          <>
            {settingsList.length === 0 ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div
                  onClick={() => setMode("create")}
                  className="group relative w-full max-w-lg cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-10 text-center shadow-sm transition-all duration-300 hover:border-blue-400 hover:shadow-lg"
                >
                  {/* Icon */}
                  <div
                    className="size-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 mb-4 transition-transform group-hover:scale-110"
                  >
                    <SettingsIcon size={24} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-800">
                    No Invoice Settings
                  </h3>

                  {/* Description */}
                  <p className="mt-1 text-sm text-gray-500">
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
                  <span className="pointer-events-none absolute bottom-4 right-4 text-xs text-gray-400 opacity-0 transition group-hover:opacity-100">
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
                            <div className="w-16 h-16 p-2 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0 group-hover/card:border-blue-100 group-hover/card:bg-blue-50/30 transition-colors">
                              {setting.general?.companyLogo ? (
                                <img
                                  src={setting.general.companyLogo}
                                  alt="Logo"
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Building2 size={28} className="text-slate-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                              <h3 className="text-lg font-bold text-slate-800 truncate mb-0.5 group-hover/card:text-blue-600 transition-colors">
                                {setting.general?.companyName || "Unnamed Profile"}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-1">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.1em] font-mono px-2 py-0.5 bg-blue-50/50 rounded-md inline-block border border-blue-100/30">
                                  {(setting.invoice?.format || "—").toUpperCase()}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Address</p>
                            <div className="text-xs text-slate-600 leading-relaxed font-medium">
                              <p className="truncate">
                                {[
                                  setting.general?.address?.plot_no,
                                  setting.general?.address?.floor_no,
                                  setting.general?.address?.building_name,
                                ].filter(Boolean).join(", ") || "—"}
                              </p>
                              <p className="truncate text-slate-500">
                                {[
                                  setting.general?.address?.street,
                                  setting.general?.address?.area,
                                ].filter(Boolean).join(", ")}
                              </p>
                              <p className="truncate text-slate-500">
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
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between rounded-b-2xl" onClick={e => e.stopPropagation()}>
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
                                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center p-0 w-8 h-8"
                              />
                            </Tooltip>
                            <Tooltip title="Edit Profile">
                              <Button
                                type="text"
                                size="small"
                                icon={<Edit size={16} />}
                                onClick={() => handleEdit(setting.id)}
                                className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg flex items-center justify-center p-0 w-8 h-8"
                              />
                            </Tooltip>
                            <Tooltip title="Delete Profile">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<Trash2 size={16} />}
                                onClick={() => handleDelete(setting.id)}
                                className="text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center p-0 w-8 h-8"
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
                            className={`rounded-lg text-[10px] font-bold uppercase tracking-wider h-8 ${setting.isActive ? 'border-slate-200 text-slate-400 bg-white' : 'bg-blue-600 border-none'}`}
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
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32, marginTop: 8 }}>
            {/* SIDEBAR NAVIGATION */}
            <div style={{ position: "sticky", top: 24, height: "fit-content" }}>
              <div style={{
                background: "#f8fafc",
                padding: "24px 16px",
                borderRadius: 20,
                border: "1px solid #f1f5f9"
              }}>
                <div style={{ marginBottom: 24, paddingLeft: 8 }}>
                  <Typography.Text style={{ color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em" }}>
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
                  background: "#ffffff",
                  borderRadius: 16,
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  gap: 12
                }}>
                  <div style={{ color: "#3b82f6" }}><Info size={18} /></div>
                  <Typography.Text style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                    Each profile represents a different business entity or branding scheme.
                  </Typography.Text>
                </div>
              </div>
            </div>

            {/* CONTENT AREA */}
            <div style={{ minHeight: "60vh" }}>
              <Card
                style={{
                  borderRadius: 24,
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.04)",
                  overflow: "hidden"
                }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ padding: "16px 32px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(to right, #ffffff, #f8fafc)" }}>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>
                    {currentStep === 0 && "General Information"}
                    {currentStep === 1 && "Invoice Configuration"}
                    {currentStep === 2 && "Payment & Bank Details"}
                  </Title>
                  <Paragraph style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
                    {currentStep === 0 && "Set up your company branding and regional localization."}
                    {currentStep === 1 && "Define how your invoice numbers are generated."}
                    {currentStep === 2 && "Add payment methods and bank information."}
                  </Paragraph>
                </div>

                <div style={{ padding: "24px 32px" }}>
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

              {/* Spacer for bottom bar */}
              <div style={{ height: 100 }} />
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-100 p-6 flex justify-between items-center z-50 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)]">
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
                      background: "#3b82f6",
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
                      background: "#10b981",
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
            body: { padding: 0, background: '#ffffff' },
            header: { display: 'none' }
          }}
        >
          {selectedProfileForView && (
            <div className="h-full flex flex-col bg-white">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                      {selectedProfileForView.general?.companyLogo ? (
                        <img
                          src={selectedProfileForView.general.companyLogo}
                          alt="Logo"
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <Building2 size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 m-0">
                        {selectedProfileForView.general?.companyName || "Untitled Profile"}
                      </h2>
                      {selectedProfileForView.isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mt-1">
                          <Check size={10} />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setViewDrawerVisible(false)}
                    className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* Row 1: Business Address & Regional Settings - Equal Height */}
                <div className="grid grid-cols-2 gap-5 mb-5">
                  {/* Business Address */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin size={14} className="text-gray-400" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Business Address</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 flex-1">
                      <p className="text-sm text-gray-700 leading-relaxed m-0">
                        {[
                          selectedProfileForView.general.address.plot_no,
                          selectedProfileForView.general.address.floor_no,
                          selectedProfileForView.general.address.building_name,
                        ].filter(Boolean).join(", ")}
                        {selectedProfileForView.general.address.street && (
                          <><br />{selectedProfileForView.general.address.street}, {selectedProfileForView.general.address.area}</>
                        )}
                        {selectedProfileForView.general.address.city && (
                          <><br />{selectedProfileForView.general.address.city}, {selectedProfileForView.general.address.pincode}</>
                        )}
                        {selectedProfileForView.general.address.country && (
                          <><br /><span className="text-blue-600 text-xs font-medium">{selectedProfileForView.general.address.country}</span></>
                        )}
                        {!selectedProfileForView.general.address.plot_no &&
                          !selectedProfileForView.general.address.street &&
                          !selectedProfileForView.general.address.city && (
                            <span className="text-gray-400">No address configured</span>
                          )}
                      </p>
                    </div>
                  </div>

                  {/* Regional Settings */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                      <SettingsIcon size={14} className="text-gray-400" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Regional Settings</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500">Currency</span>
                        <span className="text-sm font-medium text-gray-800">{selectedProfileForView.general.currency}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Date Format</span>
                        <span className="text-sm font-medium text-gray-800">{selectedProfileForView.general.dateFormat || "MM/DD/YYYY"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Invoice Format & Tax Info - Equal Height */}
                <div className="grid grid-cols-2 gap-5 mb-5">
                  {/* Invoice Format */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ReceiptText size={14} className="text-gray-400" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Invoice Format</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 flex-1 flex items-center">
                      <code className="text-sm font-mono font-semibold text-gray-800 bg-white px-2 py-1 rounded block text-center w-full border border-gray-200">
                        {selectedProfileForView.invoice.format.toUpperCase()}
                      </code>
                    </div>
                  </div>

                  {/* Tax Info (GSTIN & PAN) */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ShieldCheck size={14} className="text-gray-400" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Tax Information</h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 flex-1">
                      {selectedProfileForView.general.gstin && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500">GSTIN</span>
                          <p className="text-sm font-mono text-gray-700 m-0">{selectedProfileForView.general.gstin}</p>
                        </div>
                      )}
                      {selectedProfileForView.general.pan && (
                        <div>
                          <span className="text-xs text-gray-500">PAN</span>
                          <p className="text-sm font-mono text-gray-700 m-0">{selectedProfileForView.general.pan}</p>
                        </div>
                      )}
                      {!selectedProfileForView.general.gstin && !selectedProfileForView.general.pan && (
                        <div className="flex items-center justify-center h-full min-h-[60px]">
                          <span className="text-sm text-gray-400">No tax information</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard size={14} className="text-gray-400" />
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Payment Information</h3>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {selectedProfileForView.payment.bankName ||
                      selectedProfileForView.payment.accountNumber ||
                      selectedProfileForView.payment.ifscCode ||
                      selectedProfileForView.payment.qrCode ? (
                      <div className="space-y-3">
                        {/* Bank Name - Full width */}
                        {selectedProfileForView.payment.bankName && (
                          <div>
                            <span className="text-xs text-gray-500">Bank Name</span>
                            <p className="text-sm font-medium text-gray-800 m-0">{selectedProfileForView.payment.bankName}</p>
                          </div>
                        )}

                        {/* Two column layout for Account & QR */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Left column: Account & Branch & IFSC */}
                          <div className="space-y-3">
                            {selectedProfileForView.payment.accountNumber && (
                              <div>
                                <span className="text-xs text-gray-500">Account Number</span>
                                <p className="text-sm font-mono text-gray-700 m-0">{selectedProfileForView.payment.accountNumber}</p>
                              </div>
                            )}
                            {selectedProfileForView.payment.branchName && (
                              <div>
                                <span className="text-xs text-gray-500">Branch</span>
                                <p className="text-sm text-gray-700 m-0">{selectedProfileForView.payment.branchName}</p>
                              </div>
                            )}
                            {selectedProfileForView.payment.ifscCode && (
                              <div>
                                <span className="text-xs text-gray-500">IFSC Code</span>
                                <p className="text-sm font-mono text-gray-700 m-0">{selectedProfileForView.payment.ifscCode}</p>
                              </div>
                            )}
                            {!selectedProfileForView.payment.accountNumber &&
                              !selectedProfileForView.payment.branchName &&
                              !selectedProfileForView.payment.ifscCode && (
                                <div className="flex items-center justify-center h-full min-h-[80px]">
                                  <span className="text-sm text-gray-400">No bank details</span>
                                </div>
                              )}
                          </div>

                          {/* Right column: QR Code */}
                          <div className="flex justify-center items-center">
                            {selectedProfileForView.payment.qrCode ? (
                              <div className="text-center">
                                <div className="w-24 h-24 bg-white rounded-xl border border-gray-200 flex items-center justify-center p-2">
                                  <img src={selectedProfileForView.payment.qrCode} alt="QR Code" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-xs text-gray-400 mt-1 block">Scan to pay</span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="w-24 h-24 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
                                  <CreditCard size={24} className="text-gray-300" />
                                </div>
                                <span className="text-xs text-gray-400 mt-1 block">No QR code</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <span className="text-sm text-gray-400">No payment information configured</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <PenTool size={14} className="text-gray-400" />
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide m-0">Signature</h3>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 flex justify-center">
                    {selectedProfileForView.general.signature ? (
                      <img
                        src={selectedProfileForView.general.signature}
                        alt="Signature"
                        className="max-h-16 object-contain"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <PenTool size={16} />
                        <span className="text-sm">No signature uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Drawer>

        <Modal
          title="Confirm Permanent Deletion"
          open={deleteModalOpen}
          onCancel={() => setDeleteModalOpen(false)}
          onOk={() => {
            if (deleteId) {
              deleteMutation.mutate(deleteId, {
                onSuccess: () => {
                  setDeleteModalOpen(false); // Close modal on success
                  setDeleteId(null);
                }
              });
            }
          }}
          okText="Delete"
          okButtonProps={{
            danger: true,
            loading: deleteMutation.isPending
          }}
        >
          <p>Are you sure? This will delete the profile and all associated <strong>General, Invoice, and Payment</strong> settings permanently.</p>
        </Modal>
      </div>
    </MainLayout>
  );
}


