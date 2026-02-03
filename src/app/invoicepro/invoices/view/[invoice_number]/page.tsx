



"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Typography, Table, Divider, Space, Tag } from "antd";

import { currencyOptions } from "@/utils/currencyOptions";
import { useInvoice, useDownloadInvoice, useInvoicePaymentHistory } from "@/hooks/useInvoices";
import { useSettingsProfile } from "@/hooks/useInvoiceSettings";

import { DownloadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface InvoiceItem {
  item: string;
  description?: string;
  qty: number;
  price: number;
  tax?: string | number;
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
}

export function numberToWords(num: number): string {
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

  const invoice_number =
    (params as any)?.invoice_number ||
    (params as any)?.id ||
    (params as any)?.invoiceNumber;

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
  if (isLoading || settingsLoading) {
    return <Card>Loading invoice...</Card>;
  }

  // Error or no invoice state
  if (!invoice) {
    return <Card>Invoice not found</Card>;
  }

  if (!settings) {
    return <Card>Settings profile not found</Card>;
  }

  const hasTax = invoice.taxTotal > 0;

  // Prepare table data
  const tableData = (invoice.items as InvoiceItem[]).map((item, index: number) => {
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const taxPercent = Number(item.tax || 0);

    const lineSubtotal = price * qty;
    const lineTaxAmount = lineSubtotal * (taxPercent / 100);
    const total = lineSubtotal + lineTaxAmount;

    return {
      ...item,
      _key: index,
      lineTaxAmount,
      total,
    };
  });

  const SNO_COL = 0;
  const ITEM_COL = 1;
  const QTY_COL = 2;
  const PRICE_COL = 3;
  const TAX_COL = hasTax ? 4 : null;
  const TOTAL_COL = hasTax ? 5 : 4;

  const columns = [
    {
      title: "S.NO",
      key: "sno",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Item",
      dataIndex: "item",
      key: "item",
      render: (text: string, record: any) => (
        <div>
          <Text strong>{text}</Text>
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
    {
      title: "Qty",
      dataIndex: "qty",
      key: "qty",
      align: "center" as const,
      width: 80,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      align: "right" as const,
      width: 120,
      render: (value: number) => formatCurrency(value, currencySymbol),
    },
    ...(hasTax
      ? [
          {
            title: "Tax",
            dataIndex: "tax",
            key: "tax",
            align: "center" as const,
            width: 80,
            render: (_: any, record: InvoiceItem) =>
              formatCurrency(record.tax, currencySymbol),
          },
        ]
      : []),
    {
      title: "Total",
      key: "total",
      align: "right" as const,
      width: 120,
      render: (_: any, record: any) => formatCurrency(record.total, currencySymbol),
    },
  ];

  const subtotal = Number(invoice?.subtotal || 0);
  const taxTotal = Number(invoice?.taxTotal || 0);
  const discount = Number(invoice?.discount || 0);
  const grandTotal = Number(invoice?.total || 0);

  const totalQty = invoice.items.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );

  const currency = currencyOptions.find((c) => c.value === currencyCode);
  const majorAmount = Math.floor(grandTotal);
  const minorAmount = Math.round((grandTotal - majorAmount) * 100);
  const majorWord = majorAmount === 1 ? currency?.label : `${currency?.label}s`;
  const minorWord = minorAmount === 1 ? currency?.minor : `${currency?.minor}s`;
  const totalInWords = `${numberToWords(majorAmount)} ${majorWord}${
    minorAmount ? ` and ${numberToWords(minorAmount)} ${minorWord}` : ""
  } Only`;

  return (
    <div
      style={{
        height: "calc(100vh - 64px)",
        overflowY: "auto",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header with Back button */}
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            Back to Invoices
          </Button>

          <Space>
            <Space>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                loading={isDownloading}
                onClick={() => downloadInvoice(invoice.id)}
              >
                {isDownloading ? "Generating PDF..." : "Download PDF"}
              </Button>
              <Button type="primary" onClick={() => window.print()}>
                Print
              </Button>
            </Space>
          </Space>
        </div>

        <Card
          id="invoice"
          style={{
            border: "1px solid #e8e8e8",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            width: "85%",
            margin: "0 auto",
          }}
        >
          {/* Company Header */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              {/* Left: Logo + Company Info */}
              <div style={{ display: "flex", gap: 16 }}>
                {settings?.general?.companyLogo && (
                  <img
                    src={settings.general.companyLogo}
                    alt="Logo"
                    style={{
                      height: 68,
                      objectFit: "contain",
                    }}
                  />
                )}

                <div>
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      color: settings?.general?.primaryColor || "#1890ff",
                    }}
                  >
                    {settings?.general?.companyName || ""}
                  </Title>

                  <Text
                    type="secondary"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: "1.4",
                      maxWidth: 500,
                    }}
                  >
                    {[
                      settings?.general?.address?.plot_no,
                      settings?.general?.address?.floor_no,
                      settings?.general?.address?.building_name,
                      settings?.general?.address?.street,
                      settings?.general?.address?.area,
                      settings?.general?.address?.city,
                      settings?.general?.address?.pincode,
                      settings?.general?.address?.country,
                    ]
                      .filter(Boolean)
                      .join(" ") || ""}
                  </Text>
                </div>
              </div>

              {/* Right: Invoice Info */}
              <div style={{ textAlign: "right" }}>
                <Title level={2} style={{ margin: 0 }}>
                  INVOICE
                </Title>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                  <Text type="secondary">Invoice #{invoice.invoiceNumber}</Text>
                  <Tag
                    color={
                      invoice?.status === 'PAID' ? 'success' :
                      invoice?.status === 'PARTIALLY_PAID' ? 'warning' :
                      invoice?.status === 'OVERDUE' ? 'error' : 'default'
                    }
                    style={{ margin: 0 }}
                  >
                    {invoice?.status?.replace('_', ' ')}
                  </Tag>
                </div>
                {(Number(invoice?.balanceDue) || 0) > 0 && (
                  <Text type="danger" style={{ fontSize: 12, marginTop: 4 }}>
                    Balance Due: {formatCurrency(invoice?.balanceDue, currencySymbol)}
                  </Text>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Info Grid */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 32,
              alignItems: "flex-start",
            }}
          >
            {/* Bill To Section */}
            <div style={{ flex: 1 }}>
              <Title level={5} style={{ marginBottom: 4, color: "#555" }}>
                BILL TO
              </Title>
              <div
                style={{
                  backgroundColor: "#f9f9f9",
                  padding: 12,
                  borderRadius: 8,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  height: "100%",
                }}
              >
                <Text strong style={{ fontSize: 16, display: "block", marginBottom: 6 }}>
                  {customer?.companyName || ""}
                </Text>
                <Text style={{ display: "block", marginBottom: 2, color: "#555" }}>
                  {customer?.address || ""}
                </Text>
                <Text style={{ display: "block", marginBottom: 2, color: "#555" }}>
                  {customer?.city ? `${customer.city}, ` : ""}{customer?.country || ""}
                </Text>
                <Text style={{ display: "block", marginBottom: 2, color: "#555" }}>
                  {customer?.email || ""}
                </Text>
                {customer?.taxId && (
                  <Text style={{ display: "block", marginTop: 8, fontSize: 13, color: "#888" }}>
                    <strong>Tax ID:</strong> {customer.taxId}
                  </Text>
                )}
              </div>
            </div>

            {/* Invoice Details with Payment Info */}
            <div style={{ flex: 1 }}>
              <Title
                level={5}
                style={{ marginBottom: 8, color: "#555", textAlign: "right" }}
              >
                INVOICE INFO
              </Title>
              <div
                style={{
                  backgroundColor: "#f9f9f9",
                  padding: 20,
                  borderRadius: 8,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  textAlign: "left",
                  minWidth: 220,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Invoice Date:</Text>{" "}
                  <Text>
                    {new Date(invoice.invoiceDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </Text>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <Text strong>Due Date:</Text>{" "}
                  <Text>
                    {new Date(invoice.dueDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <Text strong>Type:</Text>{" "}
                  <Text style={{ color: settings?.general?.primaryColor || "#1890ff" }}>
                    {invoice.invoiceType || "Standard"}
                  </Text>
                </div>

                
                
              </div>
            </div>




          </div>

          {/* Items Table */}
          <Table
            dataSource={tableData}
            columns={columns}
            pagination={false}
            rowKey="_key"
            bordered
            size="small"
            summary={() => (
              <>
                {/* SUBTOTAL */}
                <Table.Summary.Row>
                  <Table.Summary.Cell index={SNO_COL} />
                  <Table.Summary.Cell index={ITEM_COL} align="right">
                    <Text>Subtotal</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={QTY_COL} />
                  <Table.Summary.Cell index={PRICE_COL} />
                  {hasTax && <Table.Summary.Cell index={TAX_COL!} />}
                  <Table.Summary.Cell index={TOTAL_COL} align="right">
                    <Text>{formatCurrency(subtotal, currencySymbol)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>

                {/* TAX */}
                {hasTax && taxTotal > 0 && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={SNO_COL} />
                    <Table.Summary.Cell index={ITEM_COL} align="right">
                      <Text>Tax</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={QTY_COL} />
                    <Table.Summary.Cell index={PRICE_COL} />
                    <Table.Summary.Cell index={TAX_COL!} />
                    <Table.Summary.Cell index={TOTAL_COL} align="right">
                      <Text>{formatCurrency(taxTotal, currencySymbol)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}

                {/* DISCOUNT */}
                {discount > 0 && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={SNO_COL} />
                    <Table.Summary.Cell index={ITEM_COL} align="right">
                      <Text>Discount</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={QTY_COL} />
                    <Table.Summary.Cell index={PRICE_COL} />
                    {hasTax && <Table.Summary.Cell index={TAX_COL!} />}
                    <Table.Summary.Cell index={TOTAL_COL} align="right">
                      <Text>-{formatCurrency(discount, currencySymbol)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}

                {/* GRAND TOTAL */}
                <Table.Summary.Row
                  style={{
                    backgroundColor: "#fafafa",
                    borderTop: "2px solid #000",
                  }}
                >
                  <Table.Summary.Cell index={SNO_COL} />
                  <Table.Summary.Cell index={ITEM_COL} align="right">
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>

                  <Table.Summary.Cell index={QTY_COL} align="center">
                    <Text strong>{totalQty}</Text>
                  </Table.Summary.Cell>

                  <Table.Summary.Cell index={PRICE_COL} />
                  {hasTax && <Table.Summary.Cell index={TAX_COL!} />}

                  <Table.Summary.Cell index={TOTAL_COL} align="right">
                    <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                      {formatCurrency(grandTotal, currencySymbol)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            )}
          />

          {/* Amount in Words */}
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              backgroundColor: "#fafafa",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              fontSize: 13,
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
                gridTemplateColumns: "2fr 1fr",
                gap: 24,
                fontSize: 12,
                alignItems: "flex-start",
              }}
            >
              {/* Bank Details */}
              <div>
                <Title level={4} style={{ marginBottom: 8, color: "#555" }}>
                  Bank Details
                </Title>

                <div
                  style={{
                    backgroundColor: "#fafafa",
                    padding: 12,
                    borderRadius: 6,
                    display: "flex",
                    gap: 20,
                    alignItems: "flex-start",
                  }}
                >
                  {/* Bank Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Bank Name:</Text>{" "}
                      <Text>{settings.payment.bankName}</Text>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Account Number:</Text>{" "}
                      <Text>{settings.payment.accountNumber}</Text>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <Text strong>IFSC Code:</Text>{" "}
                      <Text>{settings.payment.ifscCode}</Text>
                    </div>

                    <div>
                      <Text strong>Branch:</Text>{" "}
                      <Text>{settings.payment.branchName}</Text>
                    </div>
                  </div>

                  {/* QR Code */}
                  {settings.payment.qrCode && (
                    <div style={{ textAlign: "center", minWidth: 180 }}>
                      <img
                        src={settings.payment.qrCode}
                        alt="Payment QR Code"
                        style={{
                          width: 130,
                          height: 130,
                          objectFit: "contain",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          background: "#fff",
                          padding: 8,
                        }}
                      />
                      <Text
                        type="secondary"
                        style={{
                          display: "block",
                          fontSize: 11,
                          marginTop: 6,
                        }}
                      >
                        Scan to Pay
                      </Text>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature */}
              {settings.general?.signature && (
                <div style={{ textAlign: "center" }}>
                  <Title level={4} style={{ marginBottom: 8, color: "#555" }}>
                    Authorized Signature
                  </Title>

                  <div
                    style={{
                      backgroundColor: "#fafafa",
                      padding: 12,
                      borderRadius: 6,
                      display: "inline-block",
                    }}
                  >
                    <img
                      src={settings.general.signature}
                      alt="Authorized Signature"
                      style={{
                        width: 130,
                        height: 130,
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
                        fontSize: 11,
                        marginTop: 6,
                      }}
                    >
                      Digitally signed
                    </Text>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div
              style={{
                marginTop: 32,
                paddingTop: 16,
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              {/* Notes */}
              {invoice.notes && (
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ marginBottom: 8 }}>
                    Notes
                  </Title>
                  <div
                    style={{
                      backgroundColor: "#fafafa",
                      padding: 16,
                      borderRadius: 4,
                      minHeight: 80,
                    }}
                  >
                    <Text>{invoice.notes}</Text>
                  </div>
                </div>
              )}

              {/* Terms & Conditions */}
              {invoice.terms && (
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ marginBottom: 8 }}>
                    Terms & Conditions
                  </Title>
                  <div
                    style={{
                      backgroundColor: "#fafafa",
                      padding: 16,
                      borderRadius: 4,
                      minHeight: 80,
                    }}
                  >
                    <Text>{invoice.terms}</Text>
                  </div>
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
                  color: "#374151",
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
                    Zithspace
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#111827",
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
                color: "#6b7280",
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
                zithspace.com/invoice
              </a>{" "}
              to create truly professional invoices
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}