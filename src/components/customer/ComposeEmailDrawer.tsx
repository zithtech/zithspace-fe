"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Drawer, Form, Input, Button, message, Tooltip, Segmented, Tag } from "antd";
import {
  Mail,
  Send,
  Paperclip,
  X,
  FileText,
  CheckCircle2,
  User,
  Type,
  Eye,
  Edit3,
  Sparkles,
  Clock,
  AlertTriangle,
  HeartHandshake,
  Check,
  Copy,
} from "lucide-react";
import { useSendInvoiceEmail } from "@/hooks/useInvoices";
import { useSettingsProfile, useActiveSettingsProfiles } from "@/hooks/useInvoiceSettings";
import { useQuery } from "@tanstack/react-query";
import { MailService } from "@/services/mailService";
import { currencyOptions } from "@/utils/currencyOptions";
import TiptapEditor, { TiptapEditorRef } from "@/components/common/TiptapEditor";
import dayjs from "dayjs";

interface ComposeEmailDrawerProps {
  open: boolean;
  onClose: () => void;
  invoice: any;
}

type TemplateKey = "standard" | "reminder" | "overdue" | "thankyou";

export default function ComposeEmailDrawer({
  open,
  onClose,
  invoice,
}: ComposeEmailDrawerProps) {
  const [form] = Form.useForm();
  const { mutate: sendEmail, isPending } = useSendInvoiceEmail();
  const editorRef = useRef<TiptapEditorRef>(null);

  // Fetch connected mail settings from backend integration
  const { data: invoiceMailSettingsData } = useQuery({
    queryKey: ["invoiceMailSettings"],
    queryFn: async () => {
      const res = await MailService.getInvoiceMailSettings();
      return (res as any)?.data?.data || (res as any)?.data || res;
    },
    staleTime: 60 * 1000,
  });

  // Fetch settings profiles to dynamically resolve company name
  const { data: specificProfile } = useSettingsProfile(
    invoice?.settingsProfileId,
    !!invoice?.settingsProfileId
  );
  const { data: activeProfilesData } = useActiveSettingsProfiles();

  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("standard");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [bodyContent, setBodyContent] = useState<string>("");

  // Derive contextual data
  const customer = useMemo(() => {
    return invoice?.customerSnapshot || invoice?.customer || {};
  }, [invoice]);

  const customerName = useMemo(() => {
    return customer?.companyName || customer?.name || "Valued Client";
  }, [customer]);

  const customerEmail = useMemo(() => {
    return customer?.email || "";
  }, [customer]);

  const companyName = useMemo(() => {
    if (specificProfile?.general?.companyName) {
      return specificProfile.general.companyName;
    }
    if (specificProfile?.name) {
      return specificProfile.name;
    }
    if (Array.isArray(activeProfilesData) && activeProfilesData.length > 0) {
      const active = activeProfilesData.find((p: any) => p.isActive) || activeProfilesData[0];
      if (active?.general?.companyName) return active.general.companyName;
      if (active?.name) return active.name;
    } else if (activeProfilesData && (activeProfilesData as any)?.general?.companyName) {
      return (activeProfilesData as any).general.companyName;
    }
    return (
      invoice?.settingsSnapshot?.general?.companyName ||
      invoice?.settingsSnapshot?.name ||
      invoice?.settings?.name ||
      invoice?.settings?.general?.companyName ||
      invoice?.general?.companyName ||
      "Company"
    );
  }, [specificProfile, activeProfilesData, invoice]);

  const companyLogo = useMemo(() => {
    return (
      specificProfile?.general?.companyLogo ||
      (Array.isArray(activeProfilesData) ? activeProfilesData[0]?.general?.companyLogo : (activeProfilesData as any)?.general?.companyLogo) ||
      invoice?.settingsSnapshot?.general?.companyLogo ||
      invoice?.settings?.general?.companyLogo ||
      null
    );
  }, [specificProfile, activeProfilesData, invoice]);

  // Derive sender integration email
  const senderEmail = useMemo(() => {
    const rawData = invoiceMailSettingsData;
    const settingsList: any[] = Array.isArray(rawData?.settings)
      ? rawData.settings
      : Array.isArray(rawData?.data?.settings)
      ? rawData.data.settings
      : [];
    const accountsList: any[] = Array.isArray(rawData?.connectedAccounts)
      ? rawData.connectedAccounts
      : Array.isArray(rawData?.data?.connectedAccounts)
      ? rawData.data.connectedAccounts
      : [];

    // 1. Default verified invoice mail
    const defaultVerified = settingsList.find((s: any) => s.is_default_invoice_mail && s.is_verified);
    if (defaultVerified?.email) return defaultVerified.email;

    // 2. Default invoice mail
    const defaultMail = settingsList.find((s: any) => s.is_default_invoice_mail);
    if (defaultMail?.email) return defaultMail.email;

    // 3. Any verified mail
    const anyVerified = settingsList.find((s: any) => s.is_verified);
    if (anyVerified?.email) return anyVerified.email;

    // 4. Any mail settings entry
    if (settingsList.length > 0 && settingsList[0]?.email) return settingsList[0].email;

    // 5. Any active connected mail account from mail_accounts
    if (accountsList.length > 0 && accountsList[0]?.email) return accountsList[0].email;

    // 6. Company profile email from settings or invoice snapshot
    return (
      (specificProfile?.general as any)?.companyEmail ||
      (specificProfile?.general as any)?.email ||
      (activeProfilesData as any)?.[0]?.general?.companyEmail ||
      (activeProfilesData as any)?.[0]?.general?.email ||
      invoice?.settingsSnapshot?.general?.companyEmail ||
      invoice?.settingsSnapshot?.general?.email ||
      "billing@zukvo.com"
    );
  }, [invoiceMailSettingsData, specificProfile, activeProfilesData, invoice]);

  const currencyCode = invoice?.currency || "USD";
  const currencySymbol = useMemo(() => {
    return currencyOptions.find((c) => c.value === currencyCode)?.symbol || "$";
  }, [currencyCode]);

  const formattedAmount = useMemo(() => {
    const raw = Number(invoice?.grandTotal ?? invoice?.total ?? 0);
    return `${currencySymbol} ${raw.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [invoice, currencySymbol]);

  const formattedDueDate = useMemo(() => {
    if (!invoice?.dueDate) return "Due on receipt";
    return dayjs(invoice.dueDate).format("MMM DD, YYYY");
  }, [invoice]);

  const formattedInvoiceDate = useMemo(() => {
    if (!invoice?.invoiceDate) return dayjs().format("MMM DD, YYYY");
    return dayjs(invoice.invoiceDate).format("MMM DD, YYYY");
  }, [invoice]);

  const invoiceNumber = invoice?.invoiceNumber || "INV-0000";

  // Template generation
  const templates: Record<
    TemplateKey,
    {
      label: string;
      icon: any;
      subject: string;
      message: string;
      badge: string;
      color: string;
    }
  > = useMemo(() => {
    return {
      standard: {
        label: "Standard Invoice",
        icon: FileText,
        badge: "Default",
        color: "#2563eb",
        subject: `Invoice #${invoiceNumber} from ${companyName} [${formattedAmount}]`,
        message: `<p>Dear <strong>${customerName}</strong>,</p><p>We hope this email finds you well.</p><p>Please find attached invoice <strong>#${invoiceNumber}</strong> for the amount of <strong>${formattedAmount}</strong>, issued on ${formattedInvoiceDate}.</p><p><strong>Invoice Summary:</strong></p><ul><li><strong>Invoice Number:</strong> #${invoiceNumber}</li><li><strong>Amount Due:</strong> ${formattedAmount}</li><li><strong>Payment Due Date:</strong> ${formattedDueDate}</li></ul><p>Please review the attached invoice and arrange for payment in accordance with the agreed terms. If you have any questions or require clarification, feel free to reply directly to this email.</p><p>Thank you for your business!</p><p>Best regards,<br/><strong>${companyName} Accounts Team</strong></p>`,
      },
      reminder: {
        label: "Payment Reminder",
        icon: Clock,
        badge: "Friendly",
        color: "#f59e0b",
        subject: `Friendly Reminder: Invoice #${invoiceNumber} due on ${formattedDueDate}`,
        message: `<p>Dear <strong>${customerName}</strong>,</p><p>This is a friendly reminder that payment for invoice <strong>#${invoiceNumber}</strong> amounting to <strong>${formattedAmount}</strong> is scheduled to be due on <strong>${formattedDueDate}</strong>.</p><p><strong>Invoice Details:</strong></p><ul><li><strong>Invoice Number:</strong> #${invoiceNumber}</li><li><strong>Outstanding Balance:</strong> ${formattedAmount}</li><li><strong>Due Date:</strong> ${formattedDueDate}</li></ul><p>A copy of the invoice is attached for your convenient reference. If payment has already been sent, please disregard this notice with our thanks.</p><p>Kind regards,<br/><strong>${companyName} Finance Department</strong></p>`,
      },
      overdue: {
        label: "Overdue Notice",
        icon: AlertTriangle,
        badge: "Urgent",
        color: "#ef4444",
        subject: `OVERDUE NOTICE: Invoice #${invoiceNumber} (${formattedAmount})`,
        message: `<p>Dear <strong>${customerName}</strong>,</p><p>Our records indicate that we have not yet received payment for invoice <strong>#${invoiceNumber}</strong> in the amount of <strong>${formattedAmount}</strong>, which was due on <strong>${formattedDueDate}</strong>.</p><p><strong>Outstanding Details:</strong></p><ul><li><strong>Invoice Number:</strong> #${invoiceNumber}</li><li><strong>Overdue Amount:</strong> ${formattedAmount}</li><li><strong>Original Due Date:</strong> ${formattedDueDate}</li></ul><p>We kindly request you to remit this payment at your earliest convenience or reach out to us if there are any issues preventing processing.</p><p>Thank you for your prompt attention to this matter.</p><p>Sincerely,<br/><strong>${companyName} Credit &amp; Collections</strong></p>`,
      },
      thankyou: {
        label: "Payment Receipt",
        icon: HeartHandshake,
        badge: "Receipt",
        color: "#10b981",
        subject: `Payment Received - Thank You! (Invoice #${invoiceNumber})`,
        message: `<p>Dear <strong>${customerName}</strong>,</p><p>Thank you very much for your payment of <strong>${formattedAmount}</strong> towards invoice <strong>#${invoiceNumber}</strong>.</p><p>We have successfully received and processed your transaction.</p><p>We truly appreciate your prompt payment and look forward to continuing our partnership.</p><p>Warm regards,<br/><strong>${companyName} Team</strong></p>`,
      },
    };
  }, [
    invoiceNumber,
    companyName,
    formattedAmount,
    customerName,
    formattedInvoiceDate,
    formattedDueDate,
  ]);

  // Apply template
  const applyTemplate = (tplKey: TemplateKey) => {
    setSelectedTemplate(tplKey);
    const tpl = templates[tplKey];
    if (tpl) {
      form.setFieldsValue({
        subject: tpl.subject,
        message: tpl.message,
      });
      setBodyContent(tpl.message);
      setFormValues((prev) => ({
        ...prev,
        subject: tpl.subject,
        message: tpl.message,
      }));
    }
  };

  // Watch form values for live preview
  const [formValues, setFormValues] = useState<{
    to: string;
    subject: string;
    message: string;
  }>({
    to: "",
    subject: "",
    message: "",
  });

  const initializedInvoiceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (open && invoice) {
      if (initializedInvoiceIdRef.current !== invoice.id) {
        initializedInvoiceIdRef.current = invoice.id;
        const initialTpl = templates.standard;
        form.setFieldsValue({
          to: customerEmail,
          subject: initialTpl.subject,
          message: initialTpl.message,
        });
        setBodyContent(initialTpl.message);
        setFormValues({
          to: customerEmail,
          subject: initialTpl.subject,
          message: initialTpl.message,
        });
        setSelectedTemplate("standard");
        setActiveTab("compose");
      }
    } else if (!open) {
      initializedInvoiceIdRef.current = null;
    }
  }, [open, invoice?.id, customerEmail, templates, form]);

  const handleValuesChange = (_: any, allValues: any) => {
    setFormValues(allValues);
  };

  const handleInsertVariable = (variableKey: string) => {
    let insertHtml = "";
    switch (variableKey) {
      case "invoice_no":
        insertHtml = `<strong>#${invoiceNumber}</strong>`;
        break;
      case "amount":
        insertHtml = `<strong>${formattedAmount}</strong>`;
        break;
      case "due_date":
        insertHtml = `<strong>${formattedDueDate}</strong>`;
        break;
      case "company":
        insertHtml = `<strong>${companyName}</strong>`;
        break;
      case "customer":
        insertHtml = `<strong>${customerName}</strong>`;
        break;
    }

    if (editorRef.current) {
      editorRef.current.insertContentAtCursor(` ${insertHtml} `);
    } else {
      const currentMsg = form.getFieldValue("message") || bodyContent;
      const updated = currentMsg + ` ${insertHtml} `;
      form.setFieldsValue({ message: updated });
      setBodyContent(updated);
      setFormValues((prev) => ({ ...prev, message: updated }));
    }

    setCopiedVar(variableKey);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const onFinish = (values: any) => {
    const payload = {
      to: values.to,
      subject: values.subject,
      message: values.message || bodyContent,
      attachPdf: selectedTemplate !== "thankyou",
    };

    sendEmail(
      { id: invoice.id, data: payload },
      {
        onSuccess: () => {
          message.success(`Invoice email successfully sent to ${values.to}`);
          onClose();
        },
        onError: (err: any) => {
          console.error("Send email failed:", err);
          message.error(err.message || "Failed to send email");
        },
      }
    );
  };

  const customerInitial = (customerName || "C").charAt(0).toUpperCase();

  const inputBase: React.CSSProperties = {
    height: 38,
    borderRadius: 8,
    background: "var(--bg-secondary)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  return (
    <Drawer
      title={null}
      closable={false}
      placement="right"
      onClose={onClose}
      open={open}
      width={780}
      styles={{
        body: {
          padding: 0,
          background: "var(--customers-page-bg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        header: { display: "none" },
        wrapper: { boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.12)" },
        mask: {
          backdropFilter: "blur(3px)",
          background: "rgba(15, 23, 42, 0.4)",
        },
      }}
    >
      {/* HEADER */}
      <div
        className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-3 border-b backdrop-blur-md"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(37, 99, 235, 0.1)",
              color: "#2563eb",
              border: "1px solid rgba(37, 99, 235, 0.2)",
            }}
          >
            <Mail size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="text-[15px] font-bold leading-tight m-0 truncate"
                style={{ color: "var(--text-primary)" }}
              >
                Send Invoice Email
              </h3>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full font-mono"
                style={{
                  background: "var(--bg-blue-50)",
                  color: "#2563eb",
                  border: "1px solid var(--border-blue-200)",
                }}
              >
                #{invoiceNumber}
              </span>
            </div>
            <div
              className="text-[12px] mt-0.5 truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              Compose and send a branded invoice message to{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {customerName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Segmented
            value={activeTab}
            onChange={(val) => setActiveTab(val as "compose" | "preview")}
            options={[
              {
                label: (
                  <span className="flex items-center gap-1.5 px-1 py-0.5 text-[12px] font-medium">
                    <Edit3 size={13} />
                    Compose
                  </span>
                ),
                value: "compose",
              },
              {
                label: (
                  <span className="flex items-center gap-1.5 px-1 py-0.5 text-[12px] font-medium">
                    <Eye size={13} />
                    Preview
                  </span>
                ),
                value: "preview",
              },
            ]}
            style={{
              background: "var(--bg-slate-50)",
              border: "1px solid var(--border-color)",
              padding: "2px",
            }}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-slate-50)]"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-pure-white)",
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* RECIPIENT SUMMARY BAR */}
      <div
        className="flex-shrink-0 px-6 py-2.5 flex items-center justify-between border-b"
        style={{
          background: "var(--bg-slate-50)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: "rgba(37, 99, 235, 0.12)",
              color: "#2563eb",
              border: "1px solid rgba(37, 99, 235, 0.25)",
            }}
          >
            {customerInitial}
          </div>
          <div className="flex items-center gap-2 text-xs truncate">
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {customerName}
            </span>
            <span className="text-slate-400">·</span>
            <span style={{ color: "var(--text-secondary)" }}>
              {customerEmail || "No email on file"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span style={{ color: "var(--text-secondary)" }}>Amount:</span>
          <span className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>
            {formattedAmount}
          </span>
        </div>
      </div>

      {/* MAIN BODY: COMPOSE OR PREVIEW */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "compose" ? (
          <div className="px-6 py-5 space-y-5">
            {/* PRESET TEMPLATES */}
            <div>
              <div
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2 flex items-center gap-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <Sparkles size={13} style={{ color: "#2563eb" }} />
                Email Templates
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {(Object.keys(templates) as TemplateKey[]).map((key) => {
                  const tpl = templates[key];
                  const Icon = tpl.icon;
                  const isSelected = selectedTemplate === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyTemplate(key)}
                      className="text-left p-2.5 rounded-xl transition-all border relative flex flex-col justify-between cursor-pointer"
                      style={{
                        background: isSelected
                          ? "rgba(37, 99, 235, 0.05)"
                          : "var(--bg-secondary)",
                        borderColor: isSelected
                          ? "#2563eb"
                          : "var(--border-color)",
                        boxShadow: isSelected
                          ? "0 0 0 1.5px rgba(37, 99, 235, 0.2)"
                          : "none",
                      }}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{
                            background: isSelected
                              ? "#2563eb"
                              : `${tpl.color}15`,
                            color: isSelected ? "#fff" : tpl.color,
                          }}
                        >
                          <Icon size={13} />
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            size={14}
                            style={{ color: "#2563eb" }}
                          />
                        )}
                      </div>
                      <div
                        className="text-[12px] font-semibold truncate leading-tight"
                        style={{
                          color: isSelected
                            ? "#2563eb"
                            : "var(--text-primary)",
                        }}
                      >
                        {tpl.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={handleValuesChange}
              disabled={isPending}
              className="space-y-4"
            >
              {/* FROM (SENDER INTEGRATION) */}
              <div>
                <div
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 flex items-center justify-between"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span>From (Sender)</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                    <Check size={11} strokeWidth={2.5} /> Connected Integration Mail
                  </span>
                </div>
                <div
                  className="px-3.5 py-2 rounded-lg border flex items-center justify-between"
                  style={{
                    background: "var(--bg-slate-50)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: "#2563eb" }}
                    >
                      {companyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-xs truncate">
                      <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                        {companyName}
                      </span>{" "}
                      <span className="font-mono text-slate-500 text-[11px]">
                        &lt;{senderEmail}&gt;
                      </span>
                    </div>
                  </div>
                  <Tag
                    color="blue"
                    style={{
                      margin: 0,
                      fontSize: "10px",
                      borderRadius: 4,
                      padding: "0 6px",
                      fontWeight: 600,
                    }}
                  >
                    Verified
                  </Tag>
                </div>
              </div>

              {/* TO FIELD */}
              <Form.Item
                label={
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Recipient Email <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                }
                name="to"
                rules={[
                  {
                    required: true,
                    type: "email",
                    message: "Please provide a valid recipient email",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  prefix={
                    <User
                      size={14}
                      style={{ color: "var(--text-secondary)", marginRight: 4 }}
                    />
                  }
                  placeholder="recipient@company.com"
                  style={inputBase}
                />
              </Form.Item>

              {/* SUBJECT FIELD */}
              <Form.Item
                label={
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Subject Line <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                }
                name="subject"
                rules={[{ required: true, message: "Subject is required" }]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  prefix={
                    <Type
                      size={14}
                      style={{ color: "var(--text-secondary)", marginRight: 4 }}
                    />
                  }
                  placeholder="Enter email subject"
                  style={inputBase}
                />
              </Form.Item>

              {/* QUICK INSERT VARIABLES */}
              <div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1.5 flex items-center justify-between"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span>Insert Quick Variables into Editor</span>
                  {copiedVar && (
                    <span className="text-[#10b981] font-normal lowercase flex items-center gap-1">
                      <Check size={11} /> inserted at cursor!
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "invoice_no", label: `Invoice #${invoiceNumber}` },
                    { key: "amount", label: `Amount (${formattedAmount})` },
                    { key: "due_date", label: `Due (${formattedDueDate})` },
                    { key: "company", label: `Company (${companyName})` },
                    { key: "customer", label: `Client (${customerName})` },
                  ].map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      className="text-[11px] px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      style={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <Copy size={10} style={{ color: "var(--text-secondary)" }} />
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* MESSAGE BODY (TIPTAP EDITOR) */}
              <Form.Item
                label={
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Message Body (Rich Editor) <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                    <span
                      className="text-[10.5px] tabular-nums"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {bodyContent.replace(/<[^>]+>/g, "").length} characters
                    </span>
                  </div>
                }
                name="message"
                rules={[{ required: true, message: "Message cannot be empty" }]}
                style={{ marginBottom: 0 }}
              >
                <div
                  className="rounded-xl overflow-hidden border"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  <TiptapEditor
                    ref={editorRef}
                    content={bodyContent}
                    onChange={(html) => {
                      setBodyContent(html);
                      form.setFieldsValue({ message: html });
                      setFormValues((prev) => ({ ...prev, message: html }));
                    }}
                    placeholder="Write your email message..."
                    minHeight={240}
                  />
                </div>
              </Form.Item>

              {/* ATTACHMENT CARD */}
              {selectedTemplate !== "thankyou" && (
                <div
                  className="rounded-xl p-3.5 flex items-center justify-between gap-3 border"
                  style={{
                    background: "rgba(16, 185, 129, 0.05)",
                    borderColor: "rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#10b981",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      <FileText size={16} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-semibold truncate font-mono"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Invoice_{invoiceNumber}.pdf
                      </div>
                      <div
                        className="text-[11px] flex items-center gap-1.5"
                        style={{ color: "#059669" }}
                      >
                        <CheckCircle2 size={11} />
                        Attached automatically upon sending
                      </div>
                    </div>
                  </div>

                  <Tag
                    color="green"
                    style={{
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      margin: 0,
                      padding: "2px 8px",
                    }}
                  >
                    PDF READY
                  </Tag>
                </div>
              )}
            </Form>
          </div>
        ) : (
          /* LIVE CLIENT PREVIEW TAB */
          <div className="p-6">
            <div
              className="rounded-2xl border shadow-sm overflow-hidden"
              style={{
                background: "var(--bg-pure-white)",
                borderColor: "var(--border-color)",
              }}
            >
              {/* CLIENT EMAIL HEADER */}
              <div
                className="p-5 border-b space-y-3"
                style={{
                  background: "var(--bg-slate-50)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className="text-[11px] uppercase tracking-wider font-bold block"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Subject
                    </span>
                    <h4
                      className="text-base font-bold m-0 mt-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formValues.subject || "No subject provided"}
                    </h4>
                  </div>
                  <span
                    className="text-[11px] px-2 py-1 rounded font-medium"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    {dayjs().format("MMM DD, YYYY · h:mm A")}
                  </span>
                </div>

                <div
                  className="grid grid-cols-2 gap-2 text-xs pt-1 border-t"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div>
                    <span className="text-slate-400">From: </span>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {companyName} &lt;{senderEmail}&gt;
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">To: </span>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {formValues.to || customerEmail || "client@company.com"}
                    </span>
                  </div>
                </div>
              </div>

              {/* CLIENT EMAIL BODY CONTENT */}
              <div className="p-6 space-y-6">
                {/* BRAND ACCENT BAR */}
                <div
                  className="flex items-center justify-between pb-4 border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="flex items-center gap-2.5">
                    {companyLogo ? (
                      <img
                        src={companyLogo}
                        alt={companyName}
                        className="h-8 max-w-[120px] object-contain rounded"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: "#2563eb" }}
                      >
                        {companyName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div
                        className="font-bold text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {companyName}
                      </div>
                    </div>
                  </div>
                  <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
                    INVOICE
                  </Tag>
                </div>

                {/* RICH EMAIL HTML TEXT */}
                <div
                  className="prose dark:prose-invert max-w-none text-[13.5px] leading-relaxed font-sans"
                  style={{ color: "var(--text-primary)" }}
                  dangerouslySetInnerHTML={{
                    __html: formValues.message || bodyContent || "<p>No message content.</p>",
                  }}
                />

                {/* INVOICE HIGHLIGHT CARD */}
                <div
                  className="rounded-xl p-5 border"
                  style={{
                    background: "var(--bg-slate-50)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">
                    Invoice Overview
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-[11px] text-slate-400">Invoice Number</div>
                      <div
                        className="text-sm font-bold font-mono"
                        style={{ color: "var(--text-primary)" }}
                      >
                        #{invoiceNumber}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Due Date</div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formattedDueDate}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Total Amount Due</div>
                      <div className="text-base font-extrabold text-[#2563eb] font-mono">
                        {formattedAmount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER NOTE */}
                <div
                  className="text-center pt-2 text-[11px] text-slate-400 border-t"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  Sent by {companyName} via Zukvo Invoicing System · Please contact billing for any inquiries.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div
        className="flex-shrink-0 px-6 py-3.5 flex items-center justify-between gap-3 border-t backdrop-blur-md"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
        }}
      >
        <div
          className="text-[12px] flex items-center gap-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {selectedTemplate !== "thankyou" ? (
            <Tooltip title="PDF will be attached directly to the outgoing email">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11.5px]"
                style={{
                  background: "var(--bg-slate-50)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Paperclip size={12} className="text-[#10b981]" />
                Invoice_{invoiceNumber}.pdf
              </span>
            </Tooltip>
          ) : (
            <span className="text-[11.5px] text-slate-400 italic">
              No document attached (Receipt Notification)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={onClose}
            style={{
              borderRadius: 8,
              height: 38,
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<Send size={15} />}
            loading={isPending}
            onClick={() => {
              if (activeTab === "preview") {
                setActiveTab("compose");
              }
              form.submit();
            }}
            style={{
              borderRadius: 8,
              height: 38,
              fontWeight: 600,
              background: "#2563eb",
              display: "inline-flex",
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
              padding: "0 20px",
            }}
          >
            Send Email
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
