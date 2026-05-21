"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Spin,
  Empty,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  notification,
  Tag,
} from "antd";
import {
  ArrowLeft,
  Download,
  Upload,
  FileText,
  Building2,
  Calendar,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Send,
  Ban,
  CreditCard,
  Paperclip,
  Clock,
} from "lucide-react";
import dayjs from "dayjs";
import {
  portalInvoiceService,
  PortalInvoiceDetail,
} from "@/services/portalInvoiceService";

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceSubtle: "#f9fafb",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#3b82f6",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

const STATUS_META: Record<
  string,
  { label: string; tone: "accent" | "success" | "warning" | "danger" | "neutral"; icon: any }
> = {
  SENT: { label: "Sent", tone: "accent", icon: Send },
  VIEWED: { label: "Viewed", tone: "neutral", icon: Eye },
  PARTIALLY_PAID: { label: "Partially paid", tone: "warning", icon: CreditCard },
  PAID: { label: "Paid", tone: "success", icon: CheckCircle2 },
  OVERDUE: { label: "Overdue", tone: "danger", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", tone: "neutral", icon: Ban },
};
const STATUS_TONE = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  danger: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText },
};

function fmtCurrency(value: number | string | null | undefined, currency?: string | null) {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency || ""} ${n.toFixed(2)}`.trim();
  }
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] || {
    label: status,
    tone: "neutral" as const,
    icon: Receipt,
  };
  const tone = STATUS_TONE[meta.tone];
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 11px",
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 500,
      }}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

/* --------------------------------------------------------------- */

export default function PortalInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [invoice, setInvoice] = useState<PortalInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notify, contextHolder] = notification.useNotification();

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await portalInvoiceService.detail(id);
      setInvoice(data);
    } catch (err: any) {
      notify.error({
        message: "Could not load invoice",
        description: err?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: 48 }}>
        <Empty description="Invoice not found" />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Button onClick={() => router.push("/portal/invoices")}>
            Back to invoices
          </Button>
        </div>
      </div>
    );
  }

  const currency = invoice.currency;
  const total = invoice.grandTotal ?? invoice.subtotal;
  const paid = invoice.paidAmount;
  const balance = invoice.balanceDue;

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 1100 }}>
      {contextHolder}

      {/* Back */}
      <Button
        type="text"
        icon={<ArrowLeft size={14} />}
        onClick={() => router.push("/portal/invoices")}
        style={{
          padding: "4px 8px",
          height: 28,
          color: p.textMuted,
          marginBottom: 14,
        }}
      >
        Back to invoices
      </Button>

      {/* Header card */}
      <div
        style={{
          padding: 24,
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.textSubtle,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Invoice
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: p.text,
                marginTop: 4,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                letterSpacing: "-0.02em",
              }}
            >
              {invoice.invoiceNumber}
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <StatusPill status={invoice.status} />
              {invoice.viewedAt && invoice.status !== "VIEWED" && (
                <span
                  style={{
                    fontSize: 11.5,
                    color: p.textSubtle,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Eye size={11} /> First viewed {fmtDate(invoice.viewedAt)}
                </span>
              )}
            </div>
            {invoice.description && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: p.textMuted,
                  maxWidth: 640,
                }}
              >
                {invoice.description}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              flexShrink: 0,
            }}
          >
            {invoice.pdfUrl && (
              <Button
                icon={<Download size={14} />}
                onClick={() => window.open(invoice.pdfUrl!, "_blank")}
              >
                Download PDF
              </Button>
            )}
            {Number(balance) > 0 && invoice.status !== "CANCELLED" && (
              <Button
                type="primary"
                icon={<Upload size={14} />}
                onClick={() => setUploadOpen(true)}
              >
                Upload payment proof
              </Button>
            )}
          </div>
        </div>

        {/* Money strip */}
        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 0,
            border: `1px solid ${p.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <MoneyBlock label="Subtotal" value={fmtCurrency(invoice.subtotal, currency)} />
          <MoneyBlock label="Tax" value={fmtCurrency(invoice.taxTotal, currency)} />
          {Number(invoice.discountTotal) > 0 && (
            <MoneyBlock
              label="Discount"
              value={`− ${fmtCurrency(invoice.discountTotal, currency)}`}
            />
          )}
          <MoneyBlock label="Total" value={fmtCurrency(total, currency)} emphasized />
          <MoneyBlock label="Paid" value={fmtCurrency(paid, currency)} tone="success" />
          <MoneyBlock
            label="Balance"
            value={fmtCurrency(balance, currency)}
            tone={Number(balance) > 0 ? "danger" : "neutral"}
            emphasized
          />
        </div>
      </div>

      {/* Two-col body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {/* Left: line items, taxes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Line items" icon={Receipt}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th align="right">Qty</Th>
                  <Th align="right">Rate</Th>
                  <Th align="right">Tax</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: p.textSubtle,
                      }}
                    >
                      No line items.
                    </td>
                  </tr>
                ) : (
                  invoice.lineItems.map((li) => (
                    <tr key={li.id}>
                      <Td>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 500,
                            color: p.text,
                          }}
                        >
                          {li.item_name}
                        </div>
                        {li.description && (
                          <div
                            style={{
                              fontSize: 12,
                              color: p.textSubtle,
                              marginTop: 2,
                            }}
                          >
                            {li.description}
                          </div>
                        )}
                      </Td>
                      <Td align="right">{Number(li.quantity).toFixed(2)}</Td>
                      <Td align="right">{fmtCurrency(li.rate, currency)}</Td>
                      <Td align="right">{Number(li.tax_rate).toFixed(2)}%</Td>
                      <Td align="right" bold>
                        {fmtCurrency(li.total ?? li.subtotal, currency)}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          {invoice.taxes.length > 0 && (
            <Card title="Tax breakdown" icon={FileText}>
              {invoice.taxes.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: `1px solid ${p.border}`,
                    fontSize: 13,
                  }}
                >
                  <span>
                    {t.tax_name} · {Number(t.tax_rate).toFixed(2)}%
                  </span>
                  <span style={{ fontWeight: 600, color: p.text }}>
                    {fmtCurrency(t.tax_amount, currency)}
                  </span>
                </div>
              ))}
            </Card>
          )}

          {invoice.notes && (
            <Card title="Notes" icon={FileText}>
              <div
                style={{
                  fontSize: 13,
                  color: p.textMuted,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                {invoice.notes}
              </div>
            </Card>
          )}

          {invoice.terms && (
            <Card title="Terms" icon={FileText}>
              <div
                style={{
                  fontSize: 13,
                  color: p.textMuted,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                {invoice.terms}
              </div>
            </Card>
          )}
        </div>

        {/* Right: meta, customer, payments, attachments, proofs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Issued to" icon={Building2}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: p.text }}>
              {invoice.customer.name || "—"}
            </div>
            {invoice.customer.email && (
              <div style={{ fontSize: 12.5, color: p.textSubtle, marginTop: 2 }}>
                {invoice.customer.email}
              </div>
            )}
            {(invoice.customer.address ||
              invoice.customer.city ||
              invoice.customer.country) && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12.5,
                  color: p.textMuted,
                  whiteSpace: "pre-line",
                }}
              >
                {[
                  invoice.customer.address,
                  [invoice.customer.city, invoice.customer.country]
                    .filter(Boolean)
                    .join(", "),
                ]
                  .filter(Boolean)
                  .join("\n")}
              </div>
            )}
            {invoice.customer.taxId && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: p.textSubtle,
                }}
              >
                Tax ID: {invoice.customer.taxId}
              </div>
            )}
          </Card>

          <Card title="Dates" icon={Calendar}>
            <DateRow label="Issued" value={fmtDate(invoice.invoiceDate)} />
            <DateRow
              label="Due"
              value={fmtDate(invoice.dueDate)}
              danger={invoice.isOverdue}
            />
            {invoice.sentAt && (
              <DateRow label="Sent" value={fmtDate(invoice.sentAt)} />
            )}
            {invoice.paidAt && (
              <DateRow label="Paid" value={fmtDate(invoice.paidAt)} />
            )}
            {invoice.cancelledAt && (
              <DateRow label="Cancelled" value={fmtDate(invoice.cancelledAt)} />
            )}
          </Card>

          <Card title="Payment history" icon={CreditCard}>
            {invoice.payments.length === 0 ? (
              <div style={{ fontSize: 12.5, color: p.textSubtle }}>
                No payments recorded yet.
              </div>
            ) : (
              invoice.payments.map((pay) => (
                <div
                  key={pay.id}
                  style={{
                    padding: "10px 0",
                    borderBottom: `1px solid ${p.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: p.text,
                      }}
                    >
                      {fmtCurrency(pay.amount, currency)}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: p.textSubtle,
                        marginTop: 2,
                      }}
                    >
                      {fmtDate(pay.payment_date)}
                      {pay.payment_method ? ` · ${pay.payment_method}` : ""}
                      {pay.reference_id ? ` · Ref ${pay.reference_id}` : ""}
                    </div>
                  </div>
                  <Tag
                    color="default"
                    style={{
                      background: p.successBg,
                      borderColor: p.successBorder,
                      color: p.successText,
                    }}
                  >
                    {pay.status}
                  </Tag>
                </div>
              ))
            )}
          </Card>

          {invoice.attachments.length > 0 && (
            <Card title="Attachments" icon={Paperclip}>
              {invoice.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 0",
                    borderBottom: `1px solid ${p.border}`,
                    textDecoration: "none",
                    color: p.text,
                    fontSize: 13,
                  }}
                >
                  <FileText size={14} color={p.textSubtle} />
                  <span style={{ flex: 1 }}>{a.file_name}</span>
                  <Download size={14} color={p.textSubtle} />
                </a>
              ))}
            </Card>
          )}

          <Card title="Your payment proofs" icon={Upload}>
            {invoice.paymentProofs.length === 0 ? (
              <div style={{ fontSize: 12.5, color: p.textSubtle }}>
                No proofs uploaded yet.
              </div>
            ) : (
              invoice.paymentProofs.map((pp) => {
                const tone =
                  pp.status === "approved"
                    ? STATUS_TONE.success
                    : pp.status === "rejected"
                    ? STATUS_TONE.danger
                    : STATUS_TONE.warning;
                return (
                  <div
                    key={pp.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: `1px solid ${p.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <a
                        href={pp.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 13,
                          color: p.accentText,
                          textDecoration: "none",
                          fontWeight: 500,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <FileText size={13} />
                        {pp.file_name || "Proof"}
                      </a>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 7px",
                          background: tone.bg,
                          border: `1px solid ${tone.border}`,
                          color: tone.text,
                          borderRadius: 999,
                        }}
                      >
                        {pp.status.replace("_", " ")}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11.5,
                        color: p.textSubtle,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Clock size={11} /> Uploaded {fmtDate(pp.created_at)}
                      {pp.amount != null
                        ? ` · ${fmtCurrency(pp.amount, currency)}`
                        : ""}
                    </div>
                    {pp.review_note && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: p.textMuted,
                          fontStyle: "italic",
                        }}
                      >
                        “{pp.review_note}”
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </div>

      <UploadProofModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        invoice={invoice}
        notify={notify}
        onUploaded={() => {
          setUploadOpen(false);
          load();
        }}
      />
    </div>
  );
}

/* ====================================================================== */
/*  Sub-components                                                         */
/* ====================================================================== */

function MoneyBlock({
  label,
  value,
  tone,
  emphasized,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger" | "neutral";
  emphasized?: boolean;
}) {
  const color =
    tone === "success"
      ? p.successText
      : tone === "danger"
      ? p.dangerText
      : p.text;
  return (
    <div
      style={{
        padding: "12px 14px",
        background: emphasized ? p.surfaceMuted : p.surfaceElevated,
        borderRight: `1px solid ${p.border}`,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: emphasized ? 16 : 14,
          fontWeight: 600,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: p.surfaceMuted,
        }}
      >
        <Icon size={14} color={p.textSubtle} />
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: p.textSubtle,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ padding: "10px 16px 14px" }}>{children}</div>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      style={{
        textAlign: align || "left",
        padding: "10px 0",
        borderBottom: `1px solid ${p.border}`,
        fontSize: 11,
        fontWeight: 600,
        color: p.textSubtle,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  align,
  bold,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  bold?: boolean;
}) {
  return (
    <td
      style={{
        textAlign: align || "left",
        padding: "10px 0",
        borderBottom: `1px solid ${p.border}`,
        fontSize: 13,
        color: bold ? p.text : p.textMuted,
        fontWeight: bold ? 600 : 400,
        fontVariantNumeric: align === "right" ? "tabular-nums" : "normal",
      }}
    >
      {children}
    </td>
  );
}

function DateRow({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        fontSize: 13,
      }}
    >
      <span style={{ color: p.textSubtle }}>{label}</span>
      <span style={{ color: danger ? p.dangerText : p.text, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

/* ====================================================================== */
/*  Upload proof modal                                                     */
/* ====================================================================== */

function UploadProofModal({
  open,
  onClose,
  invoice,
  notify,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  invoice: PortalInvoiceDetail;
  notify: any;
  onUploaded: () => void;
}) {
  const [form] = Form.useForm();
  const [file, setFile] = useState<{
    dataUrl: string;
    name: string;
    size: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setFile(null);
    }
  }, [open, form]);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      notify.error({ message: "File exceeds 10 MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFile({
        dataUrl: String(reader.result),
        name: f.name,
        size: f.size,
      });
    };
    reader.readAsDataURL(f);
  };

  const onSubmit = async (values: any) => {
    if (!file) {
      notify.error({ message: "Please attach a file" });
      return;
    }
    setUploading(true);
    try {
      await portalInvoiceService.uploadPaymentProof(invoice.id, {
        file: file.dataUrl,
        fileName: file.name,
        amount: values.amount ?? undefined,
        paymentDate: values.paymentDate
          ? dayjs(values.paymentDate).format("YYYY-MM-DD")
          : undefined,
        reference: values.reference || undefined,
        note: values.note || undefined,
      });
      notify.success({ message: "Payment proof uploaded" });
      onUploaded();
    } catch (err: any) {
      notify.error({ message: "Upload failed", description: err?.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={520}
      closable={false}
      styles={{
        mask: { backgroundColor: "rgba(15,23,42,0.45)" },
        content: {
          background: p.surfaceElevated,
          border: `1px solid ${p.border}`,
          padding: 0,
        },
        body: { padding: 0 },
      }}
    >
      <div
        style={{
          padding: "18px 22px 14px",
          borderBottom: `1px solid ${p.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: p.accentBg,
              color: p.accentText,
              border: `1px solid ${p.accentBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Upload size={16} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: p.text }}>
              Upload payment proof
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 12.5,
                color: p.textSubtle,
              }}
            >
              For invoice{" "}
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontWeight: 600,
                }}
              >
                {invoice.invoiceNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
          {/* File picker */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: p.textMuted,
                marginBottom: 6,
              }}
            >
              Proof file
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {file ? (
              <div
                style={{
                  padding: "10px 12px",
                  border: `1px solid ${p.border}`,
                  borderRadius: 10,
                  background: p.surfaceMuted,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                  <FileText size={14} color={p.textSubtle} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: p.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: p.textSubtle }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <Button size="small" onClick={() => setFile(null)}>
                  Replace
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                style={{
                  width: "100%",
                  padding: "20px",
                  border: `1px dashed ${p.borderStrong}`,
                  borderRadius: 10,
                  background: p.surfaceMuted,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  color: p.textMuted,
                  fontSize: 13,
                }}
              >
                <Upload size={18} />
                <span>Click to upload a file</span>
                <span style={{ fontSize: 11, color: p.textFaint }}>
                  PDF, PNG, JPG · up to 10 MB
                </span>
              </button>
            )}
          </div>

          <Form.Item
            label={<span style={{ fontSize: 12.5, color: p.textMuted }}>Amount paid</span>}
            name="amount"
            style={{ marginBottom: 12 }}
          >
            <InputNumber
              style={{ width: "100%" }}
              prefix={invoice.currency || "USD"}
              min={0}
              step={0.01}
              placeholder="e.g. 1250.00"
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 12.5, color: p.textMuted }}>Payment date</span>}
            name="paymentDate"
            style={{ marginBottom: 12 }}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 12.5, color: p.textMuted }}>Reference / transaction ID</span>}
            name="reference"
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="e.g. UTR / wire reference" />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 12.5, color: p.textMuted }}>Note</span>}
            name="note"
            style={{ marginBottom: 4 }}
          >
            <Input.TextArea rows={3} placeholder="Any context for our finance team…" />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
              paddingTop: 14,
              borderTop: `1px solid ${p.border}`,
            }}
          >
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={uploading}
              disabled={!file}
            >
              Submit proof
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
