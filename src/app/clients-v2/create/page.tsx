"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Typography,
  message,
  Spin,
  Progress,
  Tooltip,
} from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import {
  ArrowLeft,
  Save,
  Building2,
  ShieldCheck,
  Briefcase,
  Landmark,
  CheckCircle2,
  Sparkles,
  Globe2,
  Hash,
  Calendar,
  Users,
  Wallet,
  CreditCard,
  Mail,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

const { Title, Text } = Typography;
const { Option } = Select;

/* -------------------------------------------------------------------------- */
/*                              Section config                                 */
/* -------------------------------------------------------------------------- */

interface SectionDef {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  fields: string[];
  required?: string[];
}

const SECTIONS: SectionDef[] = [
  {
    key: "overview",
    label: "Company Overview",
    description: "Identity, type, and where they operate.",
    icon: Building2,
    fields: [
      "companyName",
      "legalName",
      "clientType",
      "industry",
      "companySize",
      "yearOfIncorporation",
      "country",
      "website",
    ],
    required: ["companyName", "clientType"],
  },
  {
    key: "compliance",
    label: "Compliance & Finance",
    description: "Legal IDs and contract economics.",
    icon: ShieldCheck,
    fields: [
      "gstVatTaxId",
      "registrationNumber",
      "pan",
      "dunsNumber",
      "defaultCurrency",
      "contractValue",
      "paymentTerms",
      "creditLimit",
    ],
  },
  {
    key: "operations",
    label: "Operations",
    description: "Status, risk posture, and billing contact.",
    icon: Briefcase,
    fields: [
      "status",
      "riskLevel",
      "clientSegment",
      "billingAddress",
      "billingContactEmail",
    ],
  },
  {
    key: "banking",
    label: "Banking Information",
    description: "How payments are received and processed.",
    icon: Landmark,
    fields: [
      "bankName",
      "bankAccountNumber",
      "ifscSwift",
      "currencyOfPayment",
      "preferredPaymentMode",
    ],
  },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "INR", label: "Indian Rupee", symbol: "₹" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "GBP", label: "British Pound", symbol: "£" },
  { value: "JPY", label: "Japanese Yen", symbol: "¥" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$" },
  { value: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { value: "CNY", label: "Chinese Yuan", symbol: "¥" },
];

/* -------------------------------------------------------------------------- */
/*                                Field label                                 */
/* -------------------------------------------------------------------------- */

const FieldLabel: React.FC<{
  icon?: React.ComponentType<any>;
  text: string;
  required?: boolean;
  hint?: string;
}> = ({ icon: Icon, text, required, hint }) => (
  <span className="cc-field-label">
    {Icon && <Icon size={12} className="cc-field-label-icon" />}
    <span className="cc-field-label-text">{text}</span>
    {required && <span className="cc-required-dot">*</span>}
    {hint && (
      <Tooltip title={hint}>
        <span className="cc-field-hint">?</span>
      </Tooltip>
    )}
  </span>
);

/* -------------------------------------------------------------------------- */
/*                              Form content                                  */
/* -------------------------------------------------------------------------- */

function CreateClientV2Content() {
  const [form] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].key);
  const [, forceTick] = useState(0);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  /* ---------------------- Load existing client (edit) ---------------------- */
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setIsEditMode(true);
      setClientId(id);
      setLoading(true);
      const fetchClientData = async () => {
        try {
          const data = await api.get(`/api/clients-v2/${id}`);
          form.setFieldsValue(data);
          forceTick((t) => t + 1);
        } catch (err) {
          console.error(err);
          message.error("Failed to load client data for editing.");
          router.push("/clients-v2");
        } finally {
          setLoading(false);
        }
      };
      fetchClientData();
    }
  }, [searchParams, form, router]);

  /* ---------------------- Scroll spy ---------------------- */
  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!isUserScrolling.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const key = (visible[0].target as HTMLElement).dataset.sectionKey;
          if (key) setActiveSection(key);
        }
      },
      { root, rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    SECTIONS.forEach((s) => {
      const el = sectionRefs.current[s.key];
      if (el) observer.observe(el);
    });
    const onScroll = () => {
      isUserScrolling.current = true;
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      root.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    isUserScrolling.current = false;
    setActiveSection(sectionId);
    const section = sectionRefs.current[sectionId];
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => {
      isUserScrolling.current = true;
    }, 700);
  };

  /* ---------------------- Submit ---------------------- */
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = { ...values };
      if (isEditMode && clientId) {
        await api.put(`/api/clients-v2/${clientId}`, payload);
        message.success("Client successfully updated!");
        router.push(`/clients-v2/${clientId}`);
      } else {
        await api.post("/api/clients-v2", payload);
        message.success("Client successfully created!");
        router.push("/clients-v2");
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === 'ApiError' || err.message) {
        message.error(err.message || `An error occurred while ${isEditMode ? "updating" : "creating"} the client`);
      } else {
        message.error(
          `An error occurred while ${isEditMode ? "updating" : "creating"} the client`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- Live values & progress ---------------------- */
  Form.useWatch([], form);
  const allValues = form.getFieldsValue(true);

  const sectionStats = useMemo(() => {
    return SECTIONS.map((s) => {
      const filled = s.fields.filter((f) => {
        const v = allValues?.[f];
        return v !== undefined && v !== null && v !== "";
      }).length;
      const requiredFilled = (s.required || []).every((f) => {
        const v = allValues?.[f];
        return v !== undefined && v !== null && v !== "";
      });
      return {
        key: s.key,
        filled,
        total: s.fields.length,
        requiredFilled,
        complete: filled === s.fields.length && requiredFilled,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(allValues)]);

  const totalFields = SECTIONS.reduce((sum, s) => sum + s.fields.length, 0);
  const filledFields = sectionStats.reduce((sum, s) => sum + s.filled, 0);
  const overallProgress = Math.round((filledFields / totalFields) * 100);

  const getGstLabel = () => {
    const normCountry = allValues?.country ? String(allValues.country).trim().toLowerCase() : "";
    if (normCountry === "india" || normCountry === "in") return "GSTIN";
    if (normCountry === "us" || normCountry === "usa" || normCountry === "united states" || normCountry === "united states of america") return "Tax ID (EIN/SSN)";
    return "GST / VAT / Tax ID";
  };

  const getPanLabel = () => {
    const normCountry = allValues?.country ? String(allValues.country).trim().toLowerCase() : "";
    if (normCountry === "india" || normCountry === "in") return "PAN";
    if (normCountry === "us" || normCountry === "usa" || normCountry === "united states" || normCountry === "united states of america") return "Tax ID / EIN";
    return "PAN / Tax ID";
  };

  /* ---------------------- Render ---------------------- */
  return (
    <MainLayout>
      {loading && (
        <div className="cm-overlay">
          <div className="cm-overlay-card">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: "#8b5cf6" }} spin />} />
            <Text className="cm-overlay-text">
              {isEditMode ? "Updating client…" : "Creating client…"}
            </Text>
          </div>
        </div>
      )}

      <div className="cc-page">
        {/* ========================== Header ========================== */}
        <TimeTrackingHeader
          icon={
            <div className="cc-header-icon-group">
              <Button
                icon={<ArrowLeft size={18} />}
                onClick={() => router.back()}
                type="text"
                className="cc-header-back-btn"
              />
              <div className="cc-header-icon-box">
                <Building2 size={20} color="#8b5cf6" />
              </div>
            </div>
          }
          title={isEditMode ? "Edit Client" : "Create New Client"}
          description={isEditMode
            ? "Update the client details below"
            : "Set up a complete client record with billing, compliance, and banking details."}
          extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="cc-progress-pill">
                <div className="cc-progress-track">
                  <div className="cc-progress-fill" style={{ width: `${overallProgress}%` }} />
                </div>
                <span className="cc-progress-text">{overallProgress}%</span>
              </div>
              <Button onClick={() => router.back()} className="cc-cancel-btn">
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                icon={<Save size={15} />}
                loading={loading}
                className="cc-save-btn"
              >
                {isEditMode ? "Save Changes" : "Create Client"}
              </Button>
            </div>
          }
          style={{ padding: '9.5px 32px', marginBottom: 0, borderBottom: '1px solid var(--border-slate-100)' }}
        />

        {/* ========================== Body ========================== */}
        <div className="cc-body">
          {/* Sidebar nav */}
          <aside className="cc-sidebar">
            <div className="cc-sidebar-inner">
              <div className="cc-sidebar-header">
                <div className="cc-sidebar-title-row">
                  <Text className="cc-sidebar-title">Setup steps</Text>
                  <span className="cc-sidebar-count">
                    {filledFields}<span>/{totalFields}</span>
                  </span>
                </div>
                <Progress
                  percent={overallProgress}
                  showInfo={false}
                  strokeColor={{ "0%": "#8b5cf6", "100%": "#6366f1" }}
                  trailColor="var(--border-slate-100)"
                  size={["100%" as any, 5]}
                  style={{ marginTop: 8, marginBottom: 0, lineHeight: 0 }}
                />
              </div>

              <nav className="cc-nav">
                {SECTIONS.map((s, idx) => {
                  const stats = sectionStats.find((st) => st.key === s.key)!;
                  const isActive = activeSection === s.key;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => scrollToSection(s.key)}
                      className={`cc-nav-item ${isActive ? "active" : ""}`}
                    >
                      <span className={`cc-nav-step ${stats.complete ? "done" : ""}`}>
                        {stats.complete ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <span className="cc-step-num">{idx + 1}</span>
                        )}
                      </span>
                      <span className="cc-nav-body">
                        <span className="cc-nav-label">
                          <Icon size={13} />
                          <span>{s.label}</span>
                        </span>
                        <span className="cc-nav-sub">
                          <span className="cc-nav-progress">
                            <span
                              className="cc-nav-progress-fill"
                              style={{ width: `${(stats.filled / stats.total) * 100}%` }}
                            />
                          </span>
                          <span>{stats.filled}/{stats.total}</span>
                        </span>
                      </span>
                      <ChevronRight size={13} className="cc-nav-arrow" />
                    </button>
                  );
                })}
              </nav>

              <div className="cc-tip-box">
                <Sparkles size={13} />
                <span>
                  Required fields have a <span style={{ color: "#8b5cf6", fontWeight: 700 }}>•</span> dot.
                </span>
              </div>
            </div>
          </aside>

          {/* Form scroll area */}
          <div className="cc-scroll" ref={scrollContainerRef}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ defaultCurrency: "USD", status: "Prospect" }}
              onValuesChange={() => forceTick((t) => t + 1)}
              className="cc-form"
            >
              {/* ----------- Section: Overview ----------- */}
              <section
                ref={(el) => { sectionRefs.current.overview = el; }}
                data-section-key="overview"
                className="cc-section"
              >
                <SectionHeader
                  icon={Building2}
                  badge="01"
                  title="Company Overview"
                  description="Identity and where they operate. The company name and client type are required."
                />
                <div className="cc-grid">
                  <Form.Item
                    name="companyName"
                    label={<FieldLabel icon={Building2} text="Company Name" required />}
                    rules={[{ required: true, message: "Company name is required" }]}
                    className="cc-col-2"
                  >
                    <Input placeholder="Acme Corporation" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="legalName"
                    label={<FieldLabel text="Legal Name" hint="Full registered legal name" />}
                  >
                    <Input placeholder="Acme Corporation Ltd." size="large" />
                  </Form.Item>
                  <Form.Item
                    name="clientType"
                    label={<FieldLabel text="Client Type" required />}
                    rules={[{ required: true, message: "Client type is required" }]}
                  >
                    <Select placeholder="Select type" size="large">
                      <Option value="B2B">B2B</Option>
                      <Option value="B2C">B2C</Option>
                      <Option value="Direct">Direct</Option>
                      <Option value="Enterprise">Enterprise</Option>
                      <Option value="Government">Government</Option>
                      <Option value="Partner">Partner</Option>
                      <Option value="Reseller">Reseller</Option>
                      <Option value="SME">SME</Option>
                      <Option value="Vendor">Vendor</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="industry" label={<FieldLabel text="Industry" />}>
                    <Input placeholder="Technology, Healthcare…" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="companySize"
                    label={<FieldLabel icon={Users} text="Company Size" />}
                  >
                    <Select placeholder="Select size" size="large">
                      <Option value="1-10">1–10 employees</Option>
                      <Option value="11-50">11–50 employees</Option>
                      <Option value="51-200">51–200 employees</Option>
                      <Option value="200+">200+ employees</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="yearOfIncorporation"
                    label={<FieldLabel icon={Calendar} text="Year of Incorporation" />}
                    getValueFromEvent={(e) => e.target.value.replace(/\D/g, "").slice(0, 4)}
                    rules={[
                      {
                        validator(_, value) {
                          if (value === undefined || value === null || value === "") {
                            return Promise.resolve();
                          }
                          const valStr = String(value).trim();
                          if (valStr === "") return Promise.resolve();

                          if (!/^\d{4}$/.test(valStr)) {
                            return Promise.reject(new Error("Year must be a valid 4-digit number."));
                          }

                          const yearNum = Number(valStr);
                          const currentYear = new Date().getFullYear();
                          if (yearNum < 1800 || yearNum > currentYear) {
                            return Promise.reject(new Error(`Year must be between 1800 and ${currentYear}.`));
                          }
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <Input placeholder="YYYY" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="country"
                    label={<FieldLabel icon={Globe2} text="Country" />}
                  >
                    <Input
                      placeholder="United States"
                      size="large"
                      onKeyDown={(e) => {
                        if (
                          !/^[A-Za-z\s-]$/.test(e.key) &&
                          !["Backspace", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="website"
                    label={<FieldLabel icon={Globe2} text="Website" />}
                    className="cc-col-2"
                    rules={[
                      {
                        pattern: /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/,
                        message: "Enter a valid website URL"
                      }
                    ]}
                  >
                    <Input placeholder="https://acme.com" size="large" />
                  </Form.Item>
                </div>
              </section>

              {/* ----------- Section: Compliance ----------- */}
              <section
                ref={(el) => { sectionRefs.current.compliance = el; }}
                data-section-key="compliance"
                className="cc-section"
              >
                <SectionHeader
                  icon={ShieldCheck}
                  badge="02"
                  title="Compliance & Finance"
                  description="Tax IDs, registration details, and contract economics."
                  accent="#10b981"
                />
                <div className="cc-grid">
                  <Form.Item
                    name="gstVatTaxId"
                    label={<FieldLabel icon={Hash} text={getGstLabel()} />}
                    dependencies={["country"]}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || value.trim() === "") {
                            return Promise.resolve();
                          }
                          const country = getFieldValue("country");
                          const val = value.trim();
                          const normCountry = country ? country.trim().toLowerCase() : "";
                          const isIndia = normCountry === "india" || normCountry === "in";
                          const isUS = normCountry === "us" || normCountry === "usa" || normCountry === "united states" || normCountry === "united states of america";

                          const indiaRegex = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[Zz][0-9A-Za-z]{1}$/;
                          const usEinRegex = /^\d{2}-\d{7}$/;
                          const usSsnRegex = /^\d{3}-\d{2}-\d{4}$/;
                          const usPlainRegex = /^\d{9}$/;

                          if (isIndia) {
                            if (!indiaRegex.test(val)) {
                              return Promise.reject(
                                new Error("Invalid Indian GSTIN format (e.g. 22AAAAA0000A1Z1).")
                              );
                            }
                          } else if (isUS) {
                            if (!usEinRegex.test(val) && !usSsnRegex.test(val) && !usPlainRegex.test(val)) {
                              return Promise.reject(
                                new Error("Invalid US Tax ID format. Use EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX).")
                              );
                            }
                          } else {
                            const matchesIndia = indiaRegex.test(val);
                            const matchesUS = usEinRegex.test(val) || usSsnRegex.test(val) || usPlainRegex.test(val);
                            if (!matchesIndia && !matchesUS) {
                              return Promise.reject(
                                new Error("Must match Indian GSTIN or US Tax ID format.")
                              );
                            }
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <Input placeholder="Tax identification number" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="registrationNumber"
                    label={<FieldLabel icon={Hash} text="Registration Number" />}
                  >
                    <Input placeholder="Company registration no." size="large" />
                  </Form.Item>
                  <Form.Item
                    name="pan"
                    label={<FieldLabel text={getPanLabel()} />}
                    dependencies={["country"]}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || value.trim() === "") {
                            return Promise.resolve();
                          }
                          const country = getFieldValue("country");
                          const val = value.trim();
                          const normCountry = country ? country.trim().toLowerCase() : "";
                          const isIndia = normCountry === "india" || normCountry === "in";
                          const isUS = normCountry === "us" || normCountry === "usa" || normCountry === "united states" || normCountry === "united states of america";

                          const indiaPanRegex = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;
                          const usEinRegex = /^\d{2}-\d{7}$/;
                          const usSsnRegex = /^\d{3}-\d{2}-\d{4}$/;
                          const usPlainRegex = /^\d{9}$/;

                          if (isIndia) {
                            if (!indiaPanRegex.test(val)) {
                              return Promise.reject(
                                new Error("Invalid Indian PAN format (e.g. ABCDE1234F).")
                              );
                            }
                          } else if (isUS) {
                            if (!usEinRegex.test(val) && !usSsnRegex.test(val) && !usPlainRegex.test(val)) {
                              return Promise.reject(
                                new Error("Invalid US Tax ID format. Use EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX).")
                              );
                            }
                          } else {
                            const matchesIndia = indiaPanRegex.test(val);
                            const matchesUS = usEinRegex.test(val) || usSsnRegex.test(val) || usPlainRegex.test(val);
                            if (!matchesIndia && !matchesUS) {
                              return Promise.reject(
                                new Error("Must match Indian PAN or US Tax ID format.")
                              );
                            }
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <Input placeholder="ABCDE1234F" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="dunsNumber"
                    label={<FieldLabel text="DUNS Number" hint="Dun & Bradstreet ID" />}
                    getValueFromEvent={(e) => e.target.value.replace(/\D/g, "").slice(0, 9)}
                    rules={[
                      {
                        pattern: /^\d{9}$/,
                        message: "Enter a valid DUNS number"
                      }
                    ]}
                  >
                    <Input placeholder="123456789" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="defaultCurrency"
                    label={<FieldLabel icon={Wallet} text="Default Currency" />}
                  >
                    <Select showSearch allowClear placeholder="Select currency" size="large">
                      {CURRENCY_OPTIONS.map((c) => (
                        <Option key={c.value} value={c.value}>
                          {c.value} · {c.symbol}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="contractValue"
                    label={<FieldLabel icon={Wallet} text="Contract Value" />}
                  >
                    <InputNumber
                      controls={false}
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="0.00"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    name="paymentTerms"
                    label={<FieldLabel text="Payment Terms" />}
                  >
                    <Select placeholder="e.g. Net 30" size="large">
                      <Option value="Net 15">Net 15</Option>
                      <Option value="Net 30">Net 30</Option>
                      <Option value="Net 60">Net 60</Option>
                      <Option value="Due on Receipt">Due on Receipt</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="creditLimit"
                    label={<FieldLabel icon={CreditCard} text="Credit Limit" />}
                  >
                    <InputNumber
                      controls={false}
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="0.00"
                    />
                  </Form.Item>
                </div>
              </section>

              {/* ----------- Section: Operations ----------- */}
              <section
                ref={(el) => { sectionRefs.current.operations = el; }}
                data-section-key="operations"
                className="cc-section"
              >
                <SectionHeader
                  icon={Briefcase}
                  badge="03"
                  title="Operations"
                  description="How this client is positioned and where they're billed."
                  accent="#f59e0b"
                />
                <div className="cc-grid">
                  <Form.Item name="status" label={<FieldLabel text="Client Status" />}>
                    <Select size="large">
                      <Option value="Prospect">
                        <span className="cc-opt-dot" style={{ background: "#94a3b8" }} /> Prospect
                      </Option>
                      <Option value="Active">
                        <span className="cc-opt-dot" style={{ background: "#10b981" }} /> Active
                      </Option>
                      <Option value="Inactive">
                        <span className="cc-opt-dot" style={{ background: "#64748b" }} /> Inactive
                      </Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="riskLevel"
                    label={<FieldLabel icon={AlertTriangle} text="Risk Level" />}
                  >
                    <Select placeholder="Select risk" size="large">
                      <Option value="Low">
                        <span className="cc-opt-dot" style={{ background: "#10b981" }} /> Low risk
                      </Option>
                      <Option value="Medium">
                        <span className="cc-opt-dot" style={{ background: "#f59e0b" }} /> Medium risk
                      </Option>
                      <Option value="High">
                        <span className="cc-opt-dot" style={{ background: "#ef4444" }} /> High risk
                      </Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="clientSegment"
                    label={<FieldLabel text="Client Segment" />}
                    className="cc-col-2"
                  >
                    <Input placeholder="Enterprise, SMB, Startup…" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="billingAddress"
                    label={<FieldLabel text="Billing Address" />}
                    className="cc-col-2"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="123 Market Street, San Francisco, CA 94103"
                    />
                  </Form.Item>
                  <Form.Item
                    name="billingContactEmail"
                    label={<FieldLabel icon={Mail} text="Billing Contact Email" />}
                    className="cc-col-2"
                    rules={[{ type: "email", message: "Enter a valid email" }]}
                  >
                    <Input
                      type="email"
                      placeholder="finance@acme.com"
                      size="large"
                    />
                  </Form.Item>
                </div>
              </section>

              {/* ----------- Section: Banking ----------- */}
              <section
                ref={(el) => { sectionRefs.current.banking = el; }}
                data-section-key="banking"
                className="cc-section"
              >
                <SectionHeader
                  icon={Landmark}
                  badge="04"
                  title="Banking Information"
                  description="Where and how invoice payments will be settled."
                  accent="#3b82f6"
                />
                <div className="cc-grid">
                  <Form.Item
                    name="bankName"
                    label={<FieldLabel icon={Landmark} text="Bank Name" />}
                  >
                    <Input
                      placeholder="HSBC Bank"
                      size="large"
                      onKeyDown={(e) => {
                        if (
                          !/^[A-Za-z\s-]$/.test(e.key) &&
                          !["Backspace", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="bankAccountNumber"
                    label={<FieldLabel icon={Hash} text="Account Number" />}
                    getValueFromEvent={(e) => e.target.value.replace(/\D/g, "").slice(0, 20)}
                    rules={[
                      {
                        pattern: /^\d{6,20}$/,
                        message: "Enter a valid account number (6 to 20 digits)"
                      }
                    ]}
                  >
                    <Input placeholder="••••••••1234" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="ifscSwift"
                    label={<FieldLabel text="IFSC / SWIFT Code" />}
                    getValueFromEvent={(e) => e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11)}
                    rules={[
                      {
                        pattern: /^([A-Z]{4}0[A-Z0-9]{6}|[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)$/,
                        message: "Enter a valid IFSC or SWIFT code"
                      }
                    ]}
                  >
                    <Input placeholder="HSBCUS33" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="currencyOfPayment"
                    label={<FieldLabel icon={Wallet} text="Currency of Payment" />}
                  >
                    <Select
                      placeholder="Select currency"
                      showSearch
                      size="large"
                      optionFilterProp="children"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <Option key={c.value} value={c.value}>
                          {c.value} · {c.label} ({c.symbol})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="preferredPaymentMode"
                    label={<FieldLabel icon={CreditCard} text="Preferred Payment Mode" />}
                    className="cc-col-2"
                  >
                    <Select placeholder="Select mode" size="large">
                      <Option value="Wire Transfer">Wire Transfer</Option>
                      <Option value="ACH">ACH</Option>
                      <Option value="Credit Card">Credit Card</Option>
                      <Option value="Cheque">Cheque</Option>
                    </Select>
                  </Form.Item>
                </div>
              </section>
            </Form>
          </div>
        </div>

        {/* ====================== Sticky page footer ====================== */}
        <div className="cc-footer">
          <div className="cc-footer-info">
            <CheckCircle2 size={14} />
            <Text className="cc-footer-text">
              {filledFields} of {totalFields} fields filled
              {isEditMode ? " · editing existing record" : " · new client"}
            </Text>
          </div>
          <div className="cc-footer-actions">
            <Button onClick={() => router.back()} className="cc-cancel-btn">
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              icon={<Save size={15} />}
              loading={loading}
              className="cc-save-btn"
            >
              {isEditMode ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </div>

        {/* ============================ Styles ============================ */}
        <style jsx global>{`
          /* Remove browser spinners from number inputs */
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
          }

          .cc-page {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 64px);
            background: var(--bg-primary);
            margin: 0 -24px;
            overflow-x: hidden;
            max-width: calc(100% + 48px);
          }

          /* ---------- Loading overlay ---------- */
          .cm-overlay {
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(15,23,42,0.4);
            backdrop-filter: blur(6px);
            display: flex; align-items: center; justify-content: center;
          }
          .cm-overlay-card {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            border-radius: 16px;
            padding: 24px 32px;
            box-shadow: 0 20px 50px -12px rgba(15,23,42,0.4);
            display: flex; flex-direction: column; align-items: center; gap: 12px;
          }
          .cm-overlay-text {
            color: var(--text-slate-700) !important;
            font-weight: 600;
            font-size: 13px;
          }

          /* ---------- Header Overrides ---------- */
          :global(.bh-header-icon-box), 
          [data-theme='dark'] :global(.bh-header-icon-box) {
            background: transparent !important;
            border: none !important;
            width: auto !important;
            height: auto !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
          }
          .cc-header-icon-group {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .cc-header-back-btn {
            width: 38px !important; height: 38px !important;
            border-radius: 10px !important;
            border: 1px solid var(--border-slate-100) !important;
            background: transparent !important;
            color: var(--text-slate-600) !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
            padding: 0 !important;
            transition: all 0.2s !important;
            flex-shrink: 0;
          }
          .cc-header-back-btn:hover {
            border-color: #8b5cf6 !important;
            color: #8b5cf6 !important;
            background: rgba(139,92,246,0.04) !important;
          }
          .cc-header-icon-box {
            width: 38px; height: 38px;
            background: rgba(139,92,246,0.1);
            border: 1px solid rgba(139,92,246,0.2);
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          [data-theme='dark'] .cc-header-back-btn {
            border-color: rgba(255,255,255,0.1) !important;
            color: var(--text-slate-400) !important;
          }
          [data-theme='dark'] .cc-header-icon-box {
            background: rgba(139,92,246,0.15);
            border-color: rgba(139,92,246,0.3);
          }

          .cc-progress-pill {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 6px 12px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            border-radius: 999px;
          }
          .cc-progress-track {
            width: 80px; height: 5px;
            border-radius: 999px;
            background: var(--border-slate-100);
            overflow: hidden;
          }
          .cc-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #6366f1);
            border-radius: 999px;
            transition: width .25s ease;
          }
          .cc-progress-text {
            font-size: 11.5px;
            font-weight: 700;
            color: var(--text-slate-700);
            font-variant-numeric: tabular-nums;
          }

          .cc-cancel-btn {
            height: 38px !important;
            border-radius: 10px !important;
            border: 1px solid var(--border-slate-100) !important;
            background: var(--bg-pure-white) !important;
            color: var(--text-slate-700) !important;
            font-weight: 600 !important;
            padding: 0 18px !important;
          }
          .cc-cancel-btn:hover {
            border-color: var(--border-slate-200) !important;
            color: var(--text-slate-900) !important;
          }
          .cc-save-btn {
            height: 38px !important;
            border-radius: 10px !important;
            padding: 0 18px !important;
            font-weight: 700 !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%) !important;
            border: 0 !important;
            box-shadow: 0 6px 16px -8px rgba(139,92,246,0.6) !important;
          }
          .cc-save-btn:hover { filter: brightness(1.05); transform: translateY(-1px); transition: all .2s ease; }

          /* ---------- Body layout ---------- */
          .cc-body {
            display: grid;
            grid-template-columns: 300px 1fr;
            flex: 1;
            min-height: 0;
          }
          @media (max-width: 900px) {
            .cc-body { grid-template-columns: 1fr; }
            .cc-sidebar { display: none; }
          }

          /* ---------- Sidebar ---------- */
          .cc-sidebar {
            border-right: 1px solid var(--border-slate-100);
            background: var(--bg-pure-white);
            overflow-y: auto;
          }
          .cc-sidebar-inner {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .cc-sidebar-header { padding: 0 0 16px; border-bottom: 1px dashed var(--border-slate-100); }
          .cc-sidebar-title-row {
            display: flex; align-items: center; justify-content: space-between;
            gap: 8px;
          }
          .cc-sidebar-title {
            display: inline-block;
            font-size: 11px !important;
            font-weight: 700 !important;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--text-slate-500) !important;
          }
          .cc-sidebar-count {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-slate-900);
            font-variant-numeric: tabular-nums;
          }
          .cc-sidebar-count span {
            color: var(--text-slate-400);
            font-weight: 600;
            font-size: 11.5px;
          }

          .cc-nav { display: flex; flex-direction: column; gap: 2px; }
          .cc-nav-item {
            all: unset;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 16px;
            border-radius: 14px;
            transition: all .18s ease;
            position: relative;
            width: 100%;
            box-sizing: border-box;
          }
          .cc-nav-item:hover { background: var(--bg-slate-50); }
          .cc-nav-item.active {
            background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.04));
            box-shadow: inset 0 0 0 1px rgba(139,92,246,0.15);
          }
          .cc-nav-step {
            width: 24px; height: 24px;
            border-radius: 7px;
            background: var(--bg-slate-50);
            color: var(--text-slate-500);
            display: inline-flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 700;
            border: 1px solid var(--border-slate-100);
            flex-shrink: 0;
            transition: all .2s ease;
          }
          .cc-nav-item.active .cc-nav-step {
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: #fff;
            border-color: transparent;
            box-shadow: 0 4px 10px -4px rgba(139,92,246,0.5);
          }
          .cc-nav-step.done {
            background: rgba(16,185,129,0.12);
            color: #059669;
            border-color: rgba(16,185,129,0.25);
          }
          .cc-nav-item.active .cc-nav-step.done {
            background: #10b981;
            color: #fff;
            border-color: transparent;
            box-shadow: 0 4px 10px -4px rgba(16,185,129,0.5);
          }
          .cc-step-num { line-height: 1; }

          .cc-nav-body { display: flex; flex-direction: column; min-width: 0; flex: 1; gap: 4px; }
          .cc-nav-label {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 12.5px;
            font-weight: 600;
            color: var(--text-slate-700);
            line-height: 1.2;
            white-space: nowrap;
          }
          .cc-nav-item.active .cc-nav-label { color: var(--text-slate-900); }
          .cc-nav-sub {
            display: flex; align-items: center; gap: 8px;
            font-size: 10.5px;
            color: var(--text-slate-500);
            font-weight: 600;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }
          .cc-nav-progress {
            flex: 1;
            height: 3px;
            background: var(--border-slate-100);
            border-radius: 999px;
            overflow: hidden;
          }
          .cc-nav-progress-fill {
            display: block;
            height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #6366f1);
            border-radius: 999px;
            transition: width .25s ease;
          }
          .cc-nav-arrow { color: var(--text-slate-400); opacity: 0; transition: all .2s ease; flex-shrink: 0; }
          .cc-nav-item:hover .cc-nav-arrow,
          .cc-nav-item.active .cc-nav-arrow { opacity: 1; transform: translateX(2px); color: #8b5cf6; }

          .cc-tip-box {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            background: linear-gradient(135deg, rgba(139,92,246,0.06), rgba(99,102,241,0.03));
            border: 1px solid rgba(139,92,246,0.15);
            border-radius: 10px;
            font-size: 11.5px;
            color: var(--text-slate-600);
            line-height: 1.4;
          }
          .cc-tip-box svg { color: #8b5cf6; flex-shrink: 0; }

          /* ---------- Scroll area & sections ---------- */
          .cc-scroll {
            overflow-y: auto;
            padding: 24px 32px 32px 32px;
            scroll-behavior: smooth;
          }
          @media (max-width: 900px) { .cc-scroll { padding: 18px 16px 24px; } }
          .cc-form { max-width: 980px; margin: 0 auto; }
          .cc-section {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            border-radius: 16px;
            padding: 24px 26px 8px;
            margin-bottom: 18px;
            scroll-margin-top: 40px;
            box-shadow: 0 1px 3px rgba(15,23,42,0.04);
            transition: border-color .2s ease;
          }
          .cc-section:hover { border-color: var(--border-slate-200); }

          .cc-section-header {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            margin-bottom: 22px;
            padding-bottom: 18px;
            border-bottom: 1px dashed var(--border-slate-100);
          }
          .cc-section-icon {
            width: 40px; height: 40px;
            border-radius: 11px;
            display: inline-flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            position: relative;
          }
          .cc-section-badge {
            position: absolute;
            bottom: -6px; right: -6px;
            min-width: 20px; height: 20px;
            border-radius: 6px;
            background: var(--bg-pure-white);
            color: var(--text-slate-700);
            border: 1px solid var(--border-slate-100);
            font-size: 9.5px;
            font-weight: 800;
            display: inline-flex; align-items: center; justify-content: center;
            padding: 0 4px;
          }
          .cc-section-text { min-width: 0; }
          .cc-section-title {
            margin: 0 !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            color: var(--text-slate-900) !important;
            letter-spacing: -0.01em;
          }
          .cc-section-desc {
            display: block;
            font-size: 12.5px;
            color: var(--text-slate-500);
            font-weight: 500;
            margin-top: 2px;
          }

          /* ---------- Field grid & labels ---------- */
          .cc-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 18px;
          }
          @media (max-width: 600px) { .cc-grid { grid-template-columns: 1fr; } }
          .cc-grid .cc-col-2 { grid-column: 1 / -1; }
          .cc-grid .ant-form-item { margin-bottom: 14px; }

          .cc-field-label {
            display: inline-flex !important;
            flex-direction: row !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
            gap: 6px;
            font-size: 12.5px;
            font-weight: 600;
            color: var(--text-slate-700);
            white-space: nowrap;
            line-height: 1.2;
          }
          .cc-field-label-icon { color: var(--text-slate-400); flex-shrink: 0; display: inline-block !important; vertical-align: middle; }
          .cc-field-label-text { display: inline-block; vertical-align: middle; }
          .cc-form .ant-form-item-label { padding-bottom: 6px !important; line-height: 1.2 !important; overflow: visible !important; }
          .cc-form .ant-form-item-label > label {
            display: inline-flex !important;
            flex-direction: row !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
            height: auto !important;
            white-space: nowrap !important;
            min-height: 0 !important;
            line-height: 1.2 !important;
          }
          .cc-form .ant-form-item-label > label > * { display: inline-flex; align-items: center; }
          .cc-form .ant-form-item-label > label::after { display: none !important; }
          .cc-form .ant-form-item-label > label.ant-form-item-required::before { display: none !important; }
          .cc-required-dot {
            display: inline-block;
            color: #8b5cf6;
            font-weight: 800;
            font-size: 13px;
            line-height: 1;
            margin-left: 1px;
          }
          .cc-field-hint {
            display: inline-flex; align-items: center; justify-content: center;
            width: 14px; height: 14px;
            border-radius: 50%;
            background: var(--bg-slate-50);
            color: var(--text-slate-500);
            font-size: 10px;
            font-weight: 700;
            cursor: help;
            border: 1px solid var(--border-slate-100);
          }

          /* Inputs */
          .cc-form .ant-input,
          .cc-form .ant-input-number,
          .cc-form .ant-input-number-input,
          .cc-form .ant-select-selector,
          .cc-form .ant-input-affix-wrapper {
            border-radius: 10px !important;
            border-color: var(--border-slate-100) !important;
            background: var(--bg-pure-white) !important;
            font-size: 13.5px !important;
            transition: all .18s ease !important;
          }
          .cc-form .ant-input-lg,
          .cc-form .ant-input-number-lg .ant-input-number-input,
          .cc-form .ant-select-lg .ant-select-selector,
          .cc-form .ant-input-affix-wrapper-lg {
            min-height: 42px !important;
            padding: 0 14px !important;
          }
          .cc-form .ant-select-lg .ant-select-selector {
            padding: 0 14px !important;
            display: flex !important;
            align-items: center !important;
          }
          .cc-form .ant-input:hover,
          .cc-form .ant-input-number:hover,
          .cc-form .ant-select:hover .ant-select-selector,
          .cc-form .ant-input-affix-wrapper:hover {
            border-color: var(--border-slate-200) !important;
          }
          .cc-form .ant-input:focus,
          .cc-form .ant-input-focused,
          .cc-form .ant-input-number-focused,
          .cc-form .ant-select-focused .ant-select-selector,
          .cc-form .ant-input-affix-wrapper-focused {
            border-color: #8b5cf6 !important;
            box-shadow: 0 0 0 3px rgba(139,92,246,0.12) !important;
          }
          .cc-form .ant-form-item-explain-error {
            font-size: 11.5px;
            margin-top: 4px;
            color: #ef4444 !important;
          }

          .cc-opt-dot {
            display: inline-block;
            width: 7px; height: 7px;
            border-radius: 50%;
            margin-right: 8px;
            vertical-align: middle;
          }

          /* ---------- Sticky page footer ---------- */
          .cc-footer {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 32px;
            background: var(--bg-pure-white);
            border-top: 1px solid var(--border-slate-100);
            box-shadow: 0 -6px 20px -10px rgba(15,23,42,0.08);
            z-index: 5;
          }
          @media (max-width: 900px) { .cc-footer { padding: 10px 16px; } }
          .cc-footer-info {
            display: inline-flex; align-items: center; gap: 8px;
            color: #059669;
            min-width: 0;
          }
          .cc-footer-text {
            font-size: 12.5px;
            color: var(--text-slate-700) !important;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .cc-footer-actions { display: flex; gap: 10px; flex-shrink: 0; }

          /* ---------- Dark theme overrides ---------- */
          [data-theme='dark'] .cc-page { background: var(--bg-primary); }
          [data-theme='dark'] .cc-header { background: var(--bg-secondary); }
          [data-theme='dark'] .cc-back-btn,
          [data-theme='dark'] .cc-cancel-btn { background: var(--bg-secondary) !important; color: var(--text-slate-700) !important; }
          [data-theme='dark'] .cc-progress-pill { background: var(--bg-secondary); }
          [data-theme='dark'] .cc-sidebar { background: var(--bg-secondary); }
          [data-theme='dark'] .cc-section { background: var(--bg-secondary); }
          [data-theme='dark'] .cc-form .ant-input,
          [data-theme='dark'] .cc-form .ant-input-number,
          [data-theme='dark'] .cc-form .ant-input-number-input,
          [data-theme='dark'] .cc-form .ant-select-selector,
          [data-theme='dark'] .cc-form .ant-input-affix-wrapper {
            background: var(--bg-primary) !important;
            color: var(--text-slate-700) !important;
          }
          [data-theme='dark'] .cc-footer {
            background: var(--bg-secondary);
            border-top-color: var(--border-slate-100);
          }
          [data-theme='dark'] .cc-section-badge { background: var(--bg-primary); color: var(--text-slate-700); }
          [data-theme='dark'] .cc-nav-step { background: var(--bg-primary); }
          [data-theme='dark'] .cc-field-hint { background: var(--bg-primary); }
        `}</style>
      </div>
    </MainLayout>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Section header                                 */
/* -------------------------------------------------------------------------- */

const SectionHeader: React.FC<{
  icon: React.ComponentType<any>;
  badge: string;
  title: string;
  description: string;
  accent?: string;
}> = ({ icon: Icon, badge, title, description, accent = "#8b5cf6" }) => (
  <div className="cc-section-header">
    <div
      className="cc-section-icon"
      style={{
        background: `${accent}14`,
        color: accent,
        boxShadow: `inset 0 0 0 1px ${accent}30`,
      }}
    >
      <Icon size={18} />
      <span className="cc-section-badge">{badge}</span>
    </div>
    <div className="cc-section-text">
      <Title level={5} className="cc-section-title">{title}</Title>
      <Text className="cc-section-desc">{description}</Text>
    </div>
  </div>
);

export default function CreateClientV2Page() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: "#8b5cf6" }} spin />} />
        </div>
      }
    >
      <CreateClientV2Content />
    </Suspense>
  );
}
