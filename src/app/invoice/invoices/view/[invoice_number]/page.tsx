



"use client";

import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Typography, Table, Divider, Space, Tag, Spin, Alert } from "antd";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";

import { currencyOptions } from "@/utils/currencyOptions";
import { useInvoice, useDownloadInvoice, useInvoicePaymentHistory } from "@/hooks/useInvoices";
import { useSettingsProfile } from "@/hooks/useInvoiceSettings";
import { useTheme } from "@/context/ThemeContext";

import { DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import { ArrowLeft } from "lucide-react";

const { Title, Text } = Typography;

interface InvoiceItem {
  itemName: string;
  description?: string;
  quantity: number;
  rate: number;
  taxRate?: string | number;
}

interface CustomerSnapshot {
  id: string;
  companyName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  taxId?: string | null;
  gstin?: string | null;
  pan?: string | null;
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];

  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + inWords(n % 10000000) : "")
    );
  };

  return inWords(Math.floor(num)).trim();
}

// Helper function to safely format currency
const formatCurrency = (value: any, symbol: string): string => {
  const num = Number(value);
  if (isNaN(num)) return `${symbol} 0.00`;
  return `${symbol} ${num.toFixed(2)}`;
};

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { canReadInvoice } = usePermission();
  const { isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const invoice_number =
    (params as any)?.invoice_number ||
    (params as any)?.id ||
    (params as any)?.invoiceNumber;

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadInvoice) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadInvoice, router]);

  // Fetch invoice data
  const {
    data: invoice,
    isLoading,
    error,
  } = useInvoice(invoice_number, !!invoice_number && invoice_number !== "undefined");

  // Always call hooks at the top level
  const settingsProfileId = invoice?.settingsProfileId;

  // Fetch payment history (called unconditionally)
  const {
    data: paymentHistory,
    isLoading: isPaymentLoading,
  } = useInvoicePaymentHistory(invoice?.id, !!invoice?.id);

  const customer = invoice?.customerSnapshot as CustomerSnapshot | undefined;

  const { mutate: downloadInvoice, isPending: isDownloading } = useDownloadInvoice();

  // Fetch settings
  const {
    data: settings,
    isLoading: settingsLoading,
  } = useSettingsProfile(settingsProfileId as string, !!settingsProfileId);

  const currencyCode = invoice?.currency || "USD";
  const currencySymbol =
    currencyOptions.find((c) => c.value === currencyCode)?.symbol || "$";

  // Loading state
  if (authLoading || isLoading || settingsLoading) {
    return <Card><Spin tip="Loading invoice..." /></Card>;
  }

  if (!canReadInvoice) return null;

  // Error or no invoice state
  if (!invoice) {
    return <Card>Invoice not found</Card>;
  }

  if (!settings) {
    return <Card>Settings profile not found</Card>;
  }

  const tableItems = (invoice.lineItems || (invoice as any).items || []) as any[];
  const hasTax = tableItems.some(item => Number(item.taxRate || item.tax || 0) > 0);

  const tableData = tableItems.map((item, index: number) => {
    const qty = Number(item.quantity || item.qty || 0);
    const price = Number(item.rate || item.price || 0);
    const taxPercent = Number(item.taxRate || item.tax || 0);

    const lineSubtotal = price * qty;
    const lineTaxAmount = lineSubtotal * (taxPercent / 100);
    const total = lineSubtotal + lineTaxAmount;

    return {
      ...item,
      quantity: qty,
      rate: price,
      taxRate: taxPercent,
      _key: index,
      rowNumber: item.rowNumber || index + 1,
      lineTaxAmount,
      total,
    };
  }).sort((a, b) => (a.rowNumber || 0) - (b.rowNumber || 0));

  // Detect dynamic columns
  const extraFieldKeys = new Set<string>();
  const systemKeys = new Set(['quantity', 'qty', 'rate', 'price', 'taxRate', 'tax', 'itemName', 'description', 'projectId', 'projectName']);
  let hasProject = false;
  tableData.forEach(item => {
    if (item.projectId) hasProject = true;
    if (item.extraFields && typeof item.extraFields === 'object') {
      Object.keys(item.extraFields).forEach(key => {
        if (!systemKeys.has(key)) {
          extraFieldKeys.add(key);
        }
      });
    }
  });

  const columnLabels = (invoice.metadata as any)?.columnLabels || {};

  const columnDefinitions: Record<string, any> = {
    itemName: {
      title: columnLabels.itemName || "Item",
      dataIndex: "itemName",
      key: "itemName",
      render: (text: string, record: any) => (
        <div>
          <Text strong>{text || record.item}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    projectId: {
      title: columnLabels.projectId || "Project",
      dataIndex: "projectId",
      key: "projectId",
      width: 120,
      render: (val: any, record: any) => {
        // Prioritize record.projectName, then extraFields.projectName, then val.label, then val itself
        const projectName = record.projectName || record.extraFields?.projectName || val?.label || (typeof val === 'string' ? val : null);
        return projectName ? <Tag color="blue">{projectName.replace(/_/g, ' ').toUpperCase()}</Tag> : "-";
      }
    },
    quantity: {
      title: columnLabels.quantity || "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
      width: 80,
      render: (val: any, record: any) => val || record.qty
    },
    rate: {
      title: columnLabels.rate || "Price",
      dataIndex: "rate",
      key: "rate",
      align: "right" as const,
      width: 120,
      render: (value: number, record: any) => formatCurrency(value || record.price, currencySymbol),
    },
    taxRate: {
      title: columnLabels.taxRate || "Tax %",
      dataIndex: "taxRate",
      key: "taxRate",
      align: "center" as const,
      width: 100,
      render: (val: any, record: any) => {
        const rate = Number(val || record.tax || 0);
        return rate > 0 ? `${rate}%` : "-";
      }
    }
  };

  // Add extra fields to definitions
  extraFieldKeys.forEach(key => {
    columnDefinitions[key] = {
      title: columnLabels[key] || key.replace(/_/g, ' '),
      key: key,
      dataIndex: ['extraFields', key],
      width: 120,
      render: (val: any) => val || "-"
    };
  });

  const rawColumnOrder = (invoice.metadata as any)?.columnOrder as string[] || [
    "itemName", "projectId", "quantity", "rate", "taxRate"
  ];

  // Robustly ensure all required columns are present if they have data
  const finalColumnOrder = [...rawColumnOrder];

  // Note: We no longer forcibly re-add projectId or taxRate here.
  // The rawColumnOrder already provides a standard default if metadata is missing.
  // If metadata is present, we should respect the user's choice to hide these columns.

  // Add all extra fields that aren't in the order
  extraFieldKeys.forEach(key => {
    if (!finalColumnOrder.includes(key)) {
      finalColumnOrder.push(key);
    }
  });

  const orderedColumns = finalColumnOrder
    .flatMap(key => {
      // Normalize keys for system fields (handle aliases from older templates/metadata)
      let normalizedKey = key;
      if (key === 'tax') normalizedKey = 'taxRate';
      if (key === 'qty') normalizedKey = 'quantity';
      if (key === 'price') normalizedKey = 'rate';

      if (normalizedKey === 'taxRate') {
        if (!hasTax) return [];
        return [columnDefinitions.taxRate];
      }
      if (normalizedKey === 'projectId' && !hasProject) return [];

      const def = columnDefinitions[normalizedKey];
      if (def) {
        return [def];
      }
      if (extraFieldKeys.has(key)) {
        return [columnDefinitions[key]];
      }
      return [];
    });

  const columns = [
    {
      title: "S.NO",
      key: "sno",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    ...orderedColumns,
    {
      title: "Total",
      key: "total",
      align: "right" as const,
      width: 120,
      render: (_: any, record: any) => formatCurrency(record.total, currencySymbol),
    },
  ];

  // Helper mapping for summary cells
  const getColumnIndex = (targetKey: string) => {
    return columns.findIndex(c => c.key === targetKey);
  };

  const SNO_COL = getColumnIndex("sno");
  const ITEM_COL = getColumnIndex("itemName");
  const QTY_COL = getColumnIndex("quantity");
  const PRICE_COL = getColumnIndex("rate");
  const TAX_COL = hasTax ? getColumnIndex("taxRate") : null;
  const TOTAL_COL = getColumnIndex("total");

  const subtotal = Number(invoice?.subtotal || 0);
  const taxTotal = Number(invoice?.taxTotal || 0);
  const discount = Number(invoice?.discountTotal || invoice?.discount || 0);
  const grandTotal = Number(invoice?.grandTotal || (invoice as any)?.total || 0);

  const totalQty = tableItems.reduce(
    (sum, item) => sum + Number(item.quantity || item.qty || 0),
    0,
  );

  const currency = currencyOptions.find((c) => c.value === currencyCode);
  const majorAmount = Math.floor(grandTotal);
  const minorAmount = Math.round((grandTotal - majorAmount) * 100);
  const majorWord = majorAmount === 1 ? currency?.label : `${currency?.label}s`;
  const minorWord = minorAmount === 1 ? currency?.minor : `${currency?.minor}s`;
  const totalInWords = `${numberToWords(majorAmount)} ${majorWord}${minorAmount ? ` and ${numberToWords(minorAmount)} ${minorWord}` : ""
    } Only`;

  return (
    <div
      style={{
        height: "calc(100vh - 64px)",
        overflowY: "auto",
        backgroundColor: "var(--invoice-view-bg)",
      }}
    >
      {/* STICKY TOP HEADER */}
      <div
        className="sticky top-0 z-40 backdrop-blur-md border-b print:hidden"
        style={{
          background:
            "color-mix(in oklab, var(--invoice-view-bg) 88%, transparent)",
          borderColor: "var(--border-color)",
        }}
      >
        <div
          className="px-6 h-14 flex items-center justify-between gap-4 mx-auto"
          style={{ maxWidth: 1100 }}
        >
          <Button
            onClick={() => router.back()}
            icon={<ArrowLeft size={14} />}
            style={{
              borderRadius: 8,
              height: 36,
              fontWeight: 600,
            }}
          >
            Back to invoices
          </Button>

          <div className="flex items-center gap-2">
            <Button
              icon={<DownloadOutlined />}
              loading={isDownloading}
              onClick={() => downloadInvoice(invoice.id)}
              style={{
                borderRadius: 8,
                height: 36,
                fontWeight: 600,
              }}
            >
              {isDownloading ? "Generating PDF..." : "Download PDF"}
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              style={{
                borderRadius: 8,
                height: 36,
                fontWeight: 600,
                background: "#2563eb",
              }}
            >
              Print
            </Button>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "24px 16px 27px 16px",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {invoice.paymentProofs && invoice.paymentProofs.length > 0 && invoice.status !== 'PAID' && (
          <Alert
            message="Unverified Payment Proofs"
            description="The client has uploaded one or more payment proofs for this invoice."
            type="warning"
            showIcon
            action={
              <Space>
                <Button size="small" type="primary" onClick={() => window.open(invoice.paymentProofs![0].file, "_blank")}>
                  View Proof
                </Button>
              </Space>
            }
            style={{ marginBottom: 24, borderRadius: 8, border: "1px solid #ffe58f" }}
          />
        )}
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

          {/* Amount in Words */}
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              backgroundColor: "var(--invoice-section-bg)",
              borderRadius: 6,
              border: "1px solid var(--invoice-section-border)",
              fontSize: 13,
              color: "var(--text-primary)"
            }}
          >
            <Text strong>Amount in Words:</Text> <Text>{totalInWords}</Text>
          </div>



          {/* Payment / Bank Details + signature */}
          {settings?.payment && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 8,
                borderTop: "1px solid #f0f0f0",
                display: "grid",
                gridTemplateColumns: settings.general?.signature ? "2fr 1fr" : "1fr",
                gap: 24,
                fontSize: 12,
                alignItems: "flex-start",
              }}
            >
              {/* Bank Details */}
              <div style={{ flex: settings.general?.signature ? 2 : 1 }}>
                <Card
                  size="small"
                  style={{
                    backgroundColor: "var(--invoice-section-bg)",
                    border: "1px solid var(--invoice-section-border)",
                    borderRadius: 6,
                  }}
                  bodyStyle={{ padding: "12px" }}
                >
                  <Title level={5} style={{ marginBottom: 12, color: settings?.general?.primaryColor || "#1890ff", fontSize: "14px" }}>
                    Bank Details
                  </Title>

                  <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                    {/* Bank Info - label and value on same line */}
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 6, display: "flex" }}>
                        <Text type="secondary" style={{ width: 120, fontSize: "12px" }}>Bank Name:</Text>
                        <Text style={{ fontSize: "12px" }}>{settings.payment.bankName}</Text>
                      </div>

                      <div style={{ marginBottom: 6, display: "flex" }}>
                        <Text type="secondary" style={{ width: 120, fontSize: "12px" }}>Account Number:</Text>
                        <Text style={{ fontSize: "12px" }}>{settings.payment.accountNumber}</Text>
                      </div>

                      <div style={{ marginBottom: 6, display: "flex" }}>
                        <Text type="secondary" style={{ width: 120, fontSize: "12px" }}>IFSC Code:</Text>
                        <Text style={{ fontSize: "12px" }}>{settings.payment.ifscCode}</Text>
                      </div>

                      <div style={{ display: "flex" }}>
                        <Text type="secondary" style={{ width: 120, fontSize: "12px" }}>Branch:</Text>
                        <Text style={{ fontSize: "12px" }}>{settings.payment.branchName}</Text>
                      </div>
                    </div>

                    {/* QR Code */}
                    {settings.payment.qrCode && (
                      <div style={{ textAlign: "center", minWidth: 120 }}>
                        <img
                          src={settings.payment.qrCode}
                          alt="Payment QR Code"
                          style={{
                            width: 90,
                            height: 90,
                            objectFit: "contain",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            background: "#fff",
                            padding: 6,
                          }}
                        />
                        <Text
                          type="secondary"
                          style={{
                            display: "block",
                            fontSize: 10,
                            marginTop: 4,
                          }}
                        >
                          Scan to Pay
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Signature */}
              {settings.general?.signature && (
                <div style={{ textAlign: "center", flex: 1 }}>
                  <Title level={5} style={{ marginBottom: 8, color: settings?.general?.primaryColor || "#1890ff", fontSize: "14px" }}>
                    Authorized Signature
                  </Title>

                  <div
                    style={{
                      backgroundColor: "var(--invoice-section-bg)",
                      padding: 12,
                      borderRadius: 6,
                      display: "inline-block",
                      border: "1px solid var(--invoice-section-border)",
                    }}
                  >
                    <img
                      src={settings.general.signature}
                      alt="Authorized Signature"
                      style={{
                        width: 100,
                        height: 80,
                        objectFit: "contain",
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        padding: 8,
                        borderRadius: 6,
                      }}
                    />
                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        fontSize: 10,
                        marginTop: 4,
                      }}
                    >
                      Digitally signed
                    </Text>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes & Terms - After Bank Details */}
          {(invoice.notes || invoice.terms) && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f0f0", display: "flex", gap: 16, alignItems: "flex-start" }}>
              {invoice.notes && (
                <div style={{ flex: 1 }}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: "var(--invoice-section-bg)",
                      border: "1px solid var(--invoice-section-border)",
                      borderRadius: 6,
                      minHeight: 120,
                    }}
                    bodyStyle={{ padding: "12px" }}
                  >
                    <Title level={5} style={{ marginBottom: 8, color: settings?.general?.primaryColor || "#1890ff", fontSize: "14px" }}>
                      Notes
                    </Title>
                    <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                      <Text>{invoice.notes}</Text>
                    </div>
                  </Card>
                </div>
              )}
              {invoice.terms && (
                <div style={{ flex: 1 }}>
                  <Card
                    size="small"
                    style={{
                      backgroundColor: "var(--invoice-section-bg)",
                      border: "1px solid var(--invoice-section-border)",
                      borderRadius: 6,
                      minHeight: 120,
                    }}
                    bodyStyle={{ padding: "12px" }}
                  >
                    <Title level={5} style={{ marginBottom: 8, color: settings?.general?.primaryColor || "#1890ff", fontSize: "14px" }}>
                      Terms & Conditions
                    </Title>
                    <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                      <Text>{invoice.terms}</Text>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Invoice Footer */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 12,
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
                marginTop: "20px",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
              >
                Crafted with ease using
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                {settings?.general?.companyLogo && (
                  <img
                    src={settings.general.companyLogo}
                    alt="Company Logo"
                    style={{
                      width: 40,
                      height: 30,
                      objectFit: "contain",
                      marginRight: 2,
                    }}
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    lineHeight: 1.05,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#1a73e8",
                    }}
                  >
                    Zukvo
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    Invoice
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              Visit{" "}
              <a
                href={`https://${(
                  settings?.general?.companyName || "zithtech"
                ).toLowerCase()}.com/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#1a73e8",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                zukvo.com/invoice
              </a>{" "}
              to create truly professional invoices
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}