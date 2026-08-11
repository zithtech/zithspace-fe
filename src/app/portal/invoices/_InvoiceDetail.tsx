"use client";

import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Empty,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  notification,
  Tag,
  Timeline
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
  X
} from "lucide-react";
import dayjs from "dayjs";
import {

  portalInvoiceService,
  PortalInvoiceDetail
} from "@/services/portalInvoiceService";
import ZukvoLoader from "@/components/common/ZukvoLoader";

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceSubtle: "#f1f5f9",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#2563eb",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  danger: "#e11d48",
  dangerBg: "#fff1f2",
  dangerBorder: "#fecdd3",
  dangerText: "#be123c",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  neutralBg: "#f8fafc",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569"
};

const STATUS_META: Record<
  string,
  { label: string; tone: "accent" | "success" | "warning" | "danger" | "neutral"; icon: any }
> = {
  DRAFT: { label: "Draft", tone: "neutral", icon: FileText },
  PENDING: { label: "Pending", tone: "warning", icon: Clock },
  APPROVAL: { label: "Approval", tone: "warning", icon: Clock },
  SUBMITTED: { label: "Submitted", tone: "accent", icon: Send },
  SENT: { label: "Sent", tone: "accent", icon: Send },
  VIEWED: { label: "Viewed", tone: "neutral", icon: Eye },
  PARTIALLY_PAID: { label: "Partially paid", tone: "warning", icon: CreditCard },
  PAID: { label: "Paid", tone: "success", icon: CheckCircle2 },
  OVERDUE: { label: "Overdue", tone: "danger", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", tone: "neutral", icon: Ban }
};
const STATUS_TONE = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  danger: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText }
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
      maximumFractionDigits: 2
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
      day: "numeric"
    });
  } catch {
    return String(iso);
  }
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] || {
    label: status,
    tone: "neutral" as const,
    icon: Receipt
  };
  const tone = STATUS_TONE[meta.tone];
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        background: `linear-gradient(to right, ${tone.bg}, #ffffff)`,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
      }}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

/* --------------------------------------------------------------- */

export function PortalInvoiceDetailContent({ invoiceId, onClose }: { invoiceId?: string; onClose?: () => void }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = invoiceId || params?.id;

  const [invoice, setInvoice] = useState<PortalInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewDocumentUrl, setViewDocumentUrl] = useState<string | null>(null);
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
        description: err?.message
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
          justifyContent: "center"
        }}
      >
        <ZukvoLoader size="lg" />
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


  // --- Start of mapped props for InvoiceDocument ---
  const settings = (invoice as any).settingsProfile;
  const customer = invoice.customerSnapshot || (invoice as any).customer;
  const currencySymbol = invoice.currency;

  const tableItems = invoice.lineItems || [];
  const hasTax = tableItems.some((item: any) => Number(item.tax_rate || item.taxRate || 0) > 0);

  const formatCurrency = (val: number, cur: string) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur || "USD"
    }).format(val || 0);
  };

  const tableData = tableItems.map((item: any, index: number) => {
    const qty = Number(item.quantity || item.qty || 0);
    const price = Number(item.rate || item.price || 0);
    const taxPercent = Number(item.tax_rate || item.taxRate || 0);

    const lineSubtotal = price * qty;
    const lineTaxAmount = lineSubtotal * (taxPercent / 100);
    const total = lineSubtotal + lineTaxAmount;

    return {
      ...item,
      itemName: item.item_name || item.itemName,
      quantity: qty,
      rate: price,
      taxRate: taxPercent,
      _key: index,
      rowNumber: item.rowNumber || index + 1,
      lineTaxAmount,
      total
    };
  });

  const columns = [
    {
      title: "S.NO",
      key: "sno",
      width: 60,
      align: "center",
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: "Item",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{text || record.item}</div>
          {record.description && (
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {record.description}
            </div>
          )}
        </div>
      )
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      width: 80
    },
    {
      title: "Price",
      dataIndex: "rate",
      key: "rate",
      align: "right",
      width: 120,
      render: (value: number) => formatCurrency(value, currencySymbol)
    },
    ...(hasTax ? [{
      title: "Tax %",
      dataIndex: "taxRate",
      key: "taxRate",
      align: "right",
      width: 80,
      render: (val: number) => `${val}%`
    }] : []),
    {
      title: "Total",
      key: "total",
      align: "right",
      width: 120,
      render: (_: any, record: any) => formatCurrency(record.total, currencySymbol)
    },
  ];

  const getColumnIndex = (targetKey: string) => columns.findIndex(c => c.key === targetKey);
  const ITEM_COL = getColumnIndex("itemName");
  const QTY_COL = getColumnIndex("quantity");
  const TOTAL_COL = getColumnIndex("total");

  const subtotal = Number(invoice.subtotal || 0);
  const taxTotal = Number(invoice.taxTotal || 0);
  const discount = Number(invoice.discountTotal || 0);
  const grandTotal = Number(invoice.grandTotal || 0);

  const totalQty = tableItems.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
  const totalInWords = "Amount in words not available in portal view";
  // --- End of mapped props ---
  return (
    <div style={{
      background: invoiceId ? "#f6f7f9" : "transparent",
      minHeight: invoiceId ? "100vh" : "auto",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    }}>
      {contextHolder}

      {/* Sticky header - Only show if in a drawer */}
      {invoiceId && (
        <div style={{
          position: "sticky", top: 0, zIndex: 10, background: "#ffffff", borderBottom: `1px solid ${p.border}`,
          padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: p.accentBg, color: p.accentText,
              border: `1px solid ${p.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Receipt size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: p.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Invoice {invoice.invoiceNumber}
                </span>
              </div>
              {(invoice.customer?.name || invoice.customerName || invoice.description) && (
                <div style={{ fontSize: 17, fontWeight: 700, color: p.text, letterSpacing: "-0.02em", lineHeight: 1.3, marginTop: 2 }}>
                  {invoice.customer?.name || invoice.customerName || invoice.description}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${p.border}`, background: "#ffffff",
              color: p.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{
        padding: invoiceId ? "16px 20px 32px" : "32px 40px 56px",
        maxWidth: 1100,
        margin: "0 auto"
      }}>
        {/* Back - Only show if not in a drawer (i.e. no invoiceId prop) */}
        {!invoiceId && (
          <Button
            type="text"
            icon={<ArrowLeft size={14} />}
            onClick={() => router.push("/portal/invoices")}
            style={{
              padding: "4px 8px",
              height: 28,
              color: p.textMuted,
              marginBottom: 14
            }}
          >
            Back to invoices
          </Button>
        )}

        {/* Header card */}
        <div
          style={{
            padding: 24,
            background: `linear-gradient(180deg, ${p.surfaceElevated} 0%, ${p.surfaceMuted} 100%)`,
            border: `1px solid ${p.border}`,
            borderRadius: 16,
            marginBottom: 24,
            boxShadow: "0 8px 24px -4px rgba(0,0,0,0.03)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap"
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: p.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em"
                }}
              >
                Invoice
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: p.text,
                  marginTop: 4,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  letterSpacing: "-0.03em"
                }}
              >
                {invoice.invoiceNumber}
              </div>
              {invoice.viewedAt && invoice.status !== "VIEWED" && (
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap"
                  }}
                >
                  <span
                    style={{
                      fontSize: 11.5,
                      color: p.textSubtle,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <Eye size={11} /> First viewed {fmtDate(invoice.viewedAt)}
                  </span>
                </div>
              )}
              {invoice.description && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    color: p.textMuted,
                    maxWidth: 640
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
                flexShrink: 0
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
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 0,
              border: `1px solid ${p.border}`,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 2px 10px -4px rgba(0,0,0,0.02)",
              background: p.surfaceElevated
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
        <div style={{ marginTop: 24 }}>
          <InvoiceDocument
            invoice={invoice}
            settings={settings}
            customer={customer}
            tableData={tableData}
            columns={columns}
            subtotal={subtotal}
            taxTotal={taxTotal}
            discount={discount}
            grandTotal={grandTotal}
            totalQty={totalQty}
            currencySymbol={currencySymbol}
            totalInWords={totalInWords}
            hasTax={hasTax}
            ITEM_COL={ITEM_COL}
            QTY_COL={QTY_COL}
            TOTAL_COL={TOTAL_COL}
            formatCurrency={formatCurrency}
          />

          {/* Payment Proofs Section */}
          {invoice.paymentProofs && invoice.paymentProofs.length > 0 && (
            <div style={{ marginTop: 32, padding: "0 20px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: p.text }}>Uploaded Payment Proofs</h3>
              <div style={{ background: "#fff", padding: "24px 24px 0", borderRadius: 12, border: `1px solid ${p.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                <Timeline
                  items={invoice.paymentProofs.map((proof: any) => ({
                    dot: <CheckCircle2 size={18} color={p.success} style={{ background: "#fff" }} />,
                    children: (
                      <div style={{ paddingLeft: 8, paddingBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 12, color: p.textSubtle, marginBottom: 2, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
                              {proof.payment_date ? dayjs(proof.payment_date).format('MMM DD, YYYY') : "Date not specified"}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: p.text }}>
                              {fmtCurrency(proof.amount, invoice.currency)}
                            </div>
                          </div>
                          <Tag color="success" style={{ margin: 0, borderRadius: 4, fontWeight: 600 }}>Uploaded</Tag>
                        </div>

                        {(proof.reference || proof.note) && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${p.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                            {proof.reference && (
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: 11, color: p.textSubtle, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Reference</span>
                                <span style={{ fontSize: 13.5, color: p.text, fontWeight: 500 }}>{proof.reference}</span>
                              </div>
                            )}
                            {proof.note && (
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: 11, color: p.textSubtle, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Note</span>
                                <span style={{ fontSize: 13.5, color: p.text }}>{proof.note}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ marginTop: 12 }}>
                          <Button
                            type="link"
                            icon={<Eye size={14} />}
                            onClick={() => setViewDocumentUrl(proof.file_url)}
                            style={{ padding: 0, fontWeight: 600 }}
                          >
                            View Document
                          </Button>
                        </div>
                      </div>
                    )
                  }))}
                />
              </div>
            </div>
          )}

        </div>
      </div>
      <UploadProofModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        invoice={invoice}
        notify={notify}
        onUploaded={load}
      />

      <Modal
        open={!!viewDocumentUrl}
        onCancel={() => setViewDocumentUrl(null)}
        footer={null}
        width={800}
        destroyOnClose
        title="Document Viewer"
        styles={{ body: { height: "70vh", padding: 0, background: p.surfaceMuted } }}
      >
        {viewDocumentUrl && (
          viewDocumentUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: 24 }}>
              <img
                src={viewDocumentUrl}
                alt="Document"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
              />
            </div>
          ) : (
            <iframe
              src={viewDocumentUrl}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Document Viewer"
            />
          )
        )}
      </Modal>
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
  emphasized }: {
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
        padding: "16px 20px",
        background: emphasized ? "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)" : p.surfaceElevated,
        borderRight: `1px solid ${p.border}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: p.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em"
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: emphasized ? 18 : 15,
          fontWeight: emphasized ? 700 : 600,
          color,
          fontVariantNumeric: "tabular-nums"
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
  children }: {
    title: string;
    icon: any;
    children: React.ReactNode;
  }) {
  return (
    <div
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 16,
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.03)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "linear-gradient(180deg, rgba(248,250,252,0.5) 0%, rgba(255,255,255,0) 100%)"
        }}
      >
        <div style={{
          padding: 6,
          background: p.surfaceMuted,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={16} color={p.textSubtle} />
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: p.text,
            letterSpacing: "-0.01em"
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

function Th({
  children,
  align }: {
    children: React.ReactNode;
    align?: "left" | "right";
  }) {
  return (
    <th
      style={{
        textAlign: align || "left",
        padding: "14px 10px",
        borderBottom: `1px solid ${p.border}`,
        fontSize: 11.5,
        fontWeight: 600,
        color: p.textSubtle,
        textTransform: "uppercase",
        letterSpacing: "0.06em"
      }}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  align,
  bold }: {
    children: React.ReactNode;
    align?: "left" | "right";
    bold?: boolean;
  }) {
  return (
    <td
      style={{
        textAlign: align || "left",
        padding: "16px 10px",
        borderBottom: `1px solid ${p.border}`,
        fontSize: 13.5,
        color: bold ? p.text : p.textMuted,
        fontWeight: bold ? 600 : 500,
        fontVariantNumeric: align === "right" ? "tabular-nums" : "normal"
      }}
    >
      {children}
    </td>
  );
}

function DateRow({
  label,
  value,
  danger }: {
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
        fontSize: 13
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
  onUploaded }: {
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
        size: f.size
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
        note: values.note || undefined
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
          padding: 0
        },
        body: { padding: 0 }
      }}
    >
      <div
        style={{
          padding: "18px 22px 14px",
          borderBottom: `1px solid ${p.border}`
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
              justifyContent: "center"
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
                color: p.textSubtle
              }}
            >
              For invoice{" "}
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontWeight: 600
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
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: p.text,
                marginBottom: 8
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
                  padding: "12px 16px",
                  border: `1px solid ${p.accentBorder}`,
                  borderRadius: 12,
                  background: p.accentBg,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 2px 8px rgba(67, 56, 202, 0.05)"
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${p.border}`, flexShrink: 0 }}>
                    <FileText size={18} color={p.accent} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: p.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {file.name}
                    </div>
                    <div style={{ fontSize: 12, color: p.accent, fontWeight: 500, marginTop: 2 }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <Button size="small" onClick={() => setFile(null)} style={{ borderRadius: 6, border: `1px solid ${p.border}` }}>
                  Replace
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                style={{
                  width: "100%",
                  padding: "24px 20px",
                  border: `2px dashed ${p.borderStrong}`,
                  borderRadius: 12,
                  background: p.surfaceMuted,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  color: p.textMuted,
                  fontSize: 13.5,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = p.accent;
                  e.currentTarget.style.background = p.accentBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = p.borderStrong;
                  e.currentTarget.style.background = p.surfaceMuted;
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 20, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <Upload size={18} color={p.text} />
                </div>
                <span style={{ fontWeight: 600, color: p.text, marginTop: 4 }}>Click to upload a file</span>
                <span style={{ fontSize: 12, color: p.textFaint }}>
                  PDF, PNG, JPG · up to 10 MB
                </span>
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item
              label={<span style={{ fontSize: 13, fontWeight: 600, color: p.text }}>Amount paid</span>}
              name="amount"
              style={{ marginBottom: 16 }}
            >
              <InputNumber
                style={{ width: "100%", borderRadius: 8 }}
                prefix={<span style={{ color: p.textMuted, marginRight: 4 }}>{invoice.currency || "USD"}</span>}
                min={0}
                step={0.01}
                placeholder="e.g. 1250.00"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontSize: 13, fontWeight: 600, color: p.text }}>Payment date</span>}
              name="paymentDate"
              style={{ marginBottom: 16 }}
            >
              <DatePicker style={{ width: "100%", borderRadius: 8 }} format="YYYY-MM-DD" size="large" />
            </Form.Item>
          </div>

          <Form.Item
            label={<span style={{ fontSize: 13, fontWeight: 600, color: p.text }}>Reference / transaction ID</span>}
            name="reference"
            style={{ marginBottom: 16 }}
          >
            <Input placeholder="e.g. UTR / wire reference" size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 13, fontWeight: 600, color: p.text }}>Note</span>}
            name="note"
            style={{ marginBottom: 4 }}
          >
            <Input.TextArea rows={3} placeholder="Any context for our finance team…" style={{ borderRadius: 8 }} />
          </Form.Item>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
              paddingTop: 14,
              borderTop: `1px solid ${p.border}`
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
