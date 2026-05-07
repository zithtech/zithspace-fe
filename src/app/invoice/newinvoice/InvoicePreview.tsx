
import React from 'react';
import { Card, Typography, Table, Divider, Row, Col, Space } from 'antd';
import dayjs from 'dayjs';
import { currencyOptions } from "@/utils/currencyOptions";

const { Title, Text } = Typography;

interface Column {
  key: string;
  label: string;
  isSystem: boolean;
  width?: string;
  type?: 'text' | 'textarea' | 'number' | 'currency' | 'percentage' | 'dropdown' | 'date';
  options?: string[];
}

interface InvoicePreviewProps {
  data: any;
  settings: any;
  totals: {
    subtotal: number;
    totalTax: number;
    totalBeforeDiscount: number;
    finalTotal: number;
    discountAmount: number;
  };
  currencySymbol: string;
  activeColumns: Column[];
}

const formatCurrency = (value: any, symbol: string): string => {
  const num = Number(value);
  if (isNaN(num)) return `${symbol} 0.00`;
  return `${symbol} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const numberToWords = (num: number): string => {
  if (num === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
  };
  return inWords(Math.floor(num)).trim();
};

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ 
  data, 
  settings, 
  totals, 
  currencySymbol, 
  activeColumns 
}) => {
  const customer = data.customer_snapshot || {};
  const items = data.lineItems || [];
  const hasTax = totals.totalTax > 0;
  const currencyCode = data.currency || "USD";
  const currencyInfo = currencyOptions.find((c) => c.value === currencyCode);
  const primaryColor = settings?.general?.primaryColor || "#1890ff";

  // Replicate ViewInvoicePage total in words logic
  const majorAmount = Math.floor(totals.finalTotal);
  const minorAmount = Math.round((totals.finalTotal - majorAmount) * 100);
  const majorWord = majorAmount === 1 ? currencyInfo?.label : `${currencyInfo?.label}s`;
  const minorWord = minorAmount === 1 ? currencyInfo?.minor : `${currencyInfo?.minor}s`;
  const totalInWords = `${numberToWords(majorAmount)} ${majorWord}${
    minorAmount ? ` and ${numberToWords(minorAmount)} ${minorWord}` : ""
  } Only`;

  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return 0;
    for (const k of keys) {
      const val = obj[k] ?? obj[k.toLowerCase()] ?? obj[k.charAt(0).toUpperCase() + k.slice(1).toLowerCase()];
      if (val !== undefined && val !== null && val !== '') return Number(val);
    }
    return 0;
  };

  const getItemTaxRate = (item: any) => {
    const extraTax = getVal(item?.extraFields, ['taxRate', 'tax', 'tax_rate', 'VAT', 'GST']);
    return Number(item?.taxRate || item?.tax || extraTax || 0);
  };

  // Construction of columns exactly like ViewInvoicePage
  const columns = [
    {
      title: "S.NO",
      key: "sno",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    ...activeColumns
      .filter(col => col.key !== 'description')
      .map(col => {
      const baseCol: any = {
        title: col.label,
        dataIndex: col.key,
        key: col.key,
        width: col.width,
      };
      
      if (col.key === 'itemName') {
        baseCol.render = (text: string, record: any) => (
          <div>
            <Text strong style={{ color: 'var(--text-primary)' }}>{text}</Text>
            {record.description && (
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{record.description}</div>
            )}
          </div>
        );
      } else if (col.key === 'rate') {
        baseCol.align = 'right';
        baseCol.render = (val: any) => formatCurrency(val, currencySymbol);
      } else if (col.key === 'taxRate') {
        baseCol.align = 'center';
        baseCol.render = (_: any, record: any) => {
          const t = getItemTaxRate(record);
          return t ? `${t}%` : '-';
        };
      } else if (col.key === 'projectId') {
        baseCol.render = (val: any, record: any) => {
          // Prioritize record.projectName, then extraFields.projectName, then val.label, then val itself
          const projectName = record.projectName || record.extraFields?.projectName || val?.label || (typeof val === 'string' ? val : null);
          return projectName || '-';
        };
      } else if (col.key === 'quantity') {
        baseCol.align = 'center';
      } else if (!col.isSystem) {
        baseCol.dataIndex = ['extraFields', col.key];
      }
      return baseCol;
    }),
    {
      title: "Total",
      key: "total",
      align: "right" as const,
      width: 120,
      render: (_: any, record: any) => {
        const q = Number(record.quantity || 0);
        const p = Number(record.rate || 0);
        const t = getItemTaxRate(record);
        const extraDiscount = getVal(record.extraFields, ['discount', 'dis', 'disc']);
        const d = Number(extraDiscount || 0);

        const discountedBase = Math.max(0, (q * p) - d);
        let total = 0;

        if (data.tax_inclusive && t > 0) {
          total = discountedBase;
        } else {
          const sub = discountedBase;
          const tax = discountedBase * (t / 100);
          total = sub + tax;
        }
        return formatCurrency(total, currencySymbol);
      },
    },
  ];

  const ITEM_COL_IDX = columns.findIndex(c => c.key === 'itemName');
  const TOTAL_COL_IDX = columns.findIndex(c => c.key === 'total');
  const QTY_COL_IDX = columns.findIndex(c => c.key === 'quantity');

  return (
    <div style={{ padding: "24px 16px", backgroundColor: "var(--bg-primary)", minHeight: "100%" }}>
      <Card
        id="invoice-preview-content"
        style={{
          border: "1px solid var(--border-color)",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          maxWidth: "800px",
          margin: "0 auto",
          background: "var(--bg-secondary)"
        }}
      >
{/* Header with Invoice Title and Logo */}
<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
  {/* Left side - Invoice Title and Details */}
  <div>
    <div style={{ marginBottom: 12 }}>
      <Title level={1} style={{ margin: 0, color: primaryColor, lineHeight: 1.2, fontSize: "32px" }}>
        INVOICE
      </Title>
    </div>
    
    {/* Invoice Number and Dates - All together */}
    <div>
      <div style={{ display: "flex", marginBottom: 2, lineHeight: 1.5 }}>
        <Text strong style={{ width: 90, fontSize: "13px", color: "var(--text-primary)" }}>Invoice No:</Text>
        <Text style={{ fontSize: "13px", color: "var(--text-secondary)" }}>#{data.invoiceNumber || "---"}</Text>
      </div>
      <div style={{ display: "flex", marginBottom: 2, lineHeight: 1.5 }}>
        <Text strong style={{ width: 90, fontSize: "13px", color: "var(--text-primary)" }}>Invoice Date:</Text>
        <Text style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {data.invoice_date ? dayjs(data.invoice_date).format(settings?.general?.dateFormat || 'MMM DD, YYYY') : "---"}
        </Text>
      </div>
      <div style={{ display: "flex", marginBottom: 2, lineHeight: 1.5 }}>
        <Text strong style={{ width: 90, fontSize: "13px", color: "var(--text-primary)" }}>Due Date:</Text>
        <Text style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {data.due_date ? dayjs(data.due_date).format(settings?.general?.dateFormat || 'MMM DD, YYYY') : "---"}
        </Text>
      </div>
    </div>
  </div>

  {/* Right side - Logo with company name underneath */}
  {settings?.general?.companyLogo && (
    <div style={{ textAlign: "right" }}>
      <img 
        src={settings.general.companyLogo} 
        alt="Logo" 
        style={{ height: 80, width: "auto", objectFit: "contain", marginBottom: 4 }} 
      />
      {settings?.general?.companyName && (
        <div style={{ fontSize: "14px", fontWeight: "bold", color: primaryColor, textAlign: "center" }}>
          {settings.general.companyName}
        </div>
      )}
    </div>
  )}
</div>

        {/* Billed By and Billed To - Equal Height Cards without internal labels */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          {/* Billed By (Company Info) */}
          <div style={{ flex: 1, display: "flex" }}>
            <Card 
              size="small" 
              style={{ 
                width: "100%", 
                backgroundColor: "var(--bg-slate-50)",
                border: "1px solid var(--border-color)",
                borderRadius: 8
              }}
              bodyStyle={{ padding: "12px" }}
            >
              <Title level={5} style={{ marginBottom: 8, color: primaryColor, fontSize: "14px" }}>BILLED BY</Title>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: 4, color: "var(--text-primary)" }}>
                  {settings?.general?.companyName || "Your Company"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.5 }}>
                  {settings?.general?.address ? [
                    settings.general.address.plot_no,
                    settings.general.address.floor_no,
                    settings.general.address.building_name,
                    settings.general.address.street,
                    settings.general.address.area,
                    settings.general.address.city,
                    settings.general.address.pincode,
                    settings.general.address.country,
                  ].filter(Boolean).join(", ") : "---"}
                </div>
                
                {/* Tax related fields with labels */}
                {settings?.general?.taxId && (
                  <div style={{ marginTop: 6, fontSize: "11px", color: "var(--text-secondary)" }}>
                    <Text type="secondary" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Tax ID: </Text>
                    <Text style={{ fontSize: "11px", color: "var(--text-primary)" }}>{settings.general.taxId}</Text>
                  </div>
                )}
                {settings?.general?.gstin && (
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    <Text type="secondary" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>GSTIN: </Text>
                    <Text style={{ fontSize: "11px", color: "var(--text-primary)" }}>{settings.general.gstin}</Text>
                  </div>
                )}
                {settings?.general?.pan && (
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    <Text type="secondary" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>PAN: </Text>
                    <Text style={{ fontSize: "11px", color: "var(--text-primary)" }}>{settings.general.pan}</Text>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Billed To (Customer Info) */}
{/* Billed To (Customer Info) */}
<div style={{ flex: 1, display: "flex" }}>
  <Card 
    size="small" 
    style={{ 
      width: "100%", 
      backgroundColor: "var(--bg-slate-50)",
      border: "1px solid var(--border-color)",
      borderRadius: 8
    }}
    bodyStyle={{ padding: "12px" }}
  >
    <Title level={5} style={{ marginBottom: 8, color: primaryColor, fontSize: "14px" }}>BILLED TO</Title>
    <div>
      <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: 4, color: "var(--text-primary)" }}>
        {customer.companyName || "Customer Name"}
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.5 }}>
        {[
          customer.address,
          customer.city,
          customer.country
        ].filter(Boolean).join(", ") || "---"}
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: 4 }}>
        {customer.email || ""}
      </div>
      
      {/* Tax related fields with labels */}
      {customer.gstin && (
        <div style={{ marginTop: 6, fontSize: "11px", color: "var(--text-secondary)" }}>
          <Text type="secondary" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>GSTIN: </Text>
          <Text style={{ fontSize: "11px", color: "var(--text-primary)" }}>{customer.gstin}</Text>
        </div>
      )}
      {customer.pan && (
        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          <Text type="secondary" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>PAN: </Text>
          <Text style={{ fontSize: "11px", color: "var(--text-primary)" }}>{customer.pan}</Text>
        </div>
      )}
      {customer.taxId && !customer.gstin && (
        <div style={{ marginTop: 6, fontSize: "11px", color: "var(--text-secondary)" }}>
          <Text type="secondary" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Tax ID: </Text>
          <Text style={{ fontSize: "11px", color: "var(--text-primary)" }}>{customer.taxId}</Text>
        </div>
      )}
    </div>
  </Card>
</div>
        </div>

        {/* Table - exactly as before */}
        <Table
          dataSource={items}
          columns={columns}
          pagination={false}
          rowKey={(r, i) => i?.toString() || '0'}
          bordered
          size="small"
          summary={() => (
            <>
              <Table.Summary.Row>
                {columns.map((_, idx) => {
                  if (idx === ITEM_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="right"><Text>Subtotal</Text></Table.Summary.Cell>;
                  if (idx === TOTAL_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="right"><Text>{formatCurrency(totals.subtotal, currencySymbol)}</Text></Table.Summary.Cell>;
                  return <Table.Summary.Cell key={idx} index={idx} />;
                })}
              </Table.Summary.Row>

              {hasTax && (
                <>
                  <Table.Summary.Row>
                    {columns.map((_, idx) => {
                      const effectivePct = totals.subtotal > 0 ? ((totals.totalTax / 2) / totals.subtotal) * 100 : 0;
                      const rateLabel = ` (${effectivePct.toFixed(2)}%)`;
                      
                      if (idx === ITEM_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="right"><Text>CGST{rateLabel}</Text></Table.Summary.Cell>;
                      if (idx === TOTAL_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="right"><Text>{formatCurrency(totals.totalTax / 2, currencySymbol)}</Text></Table.Summary.Cell>;
                      return <Table.Summary.Cell key={idx} index={idx} />;
                    })}
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    {columns.map((_, idx) => {
                      const effectivePct = totals.subtotal > 0 ? ((totals.totalTax / 2) / totals.subtotal) * 100 : 0;
                      const rateLabel = ` (${effectivePct.toFixed(2)}%)`;

                      if (idx === ITEM_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="right"><Text>SGST{rateLabel}</Text></Table.Summary.Cell>;
                      if (idx === TOTAL_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="right"><Text>{formatCurrency(totals.totalTax / 2, currencySymbol)}</Text></Table.Summary.Cell>;
                      return <Table.Summary.Cell key={idx} index={idx} />;
                    })}
                  </Table.Summary.Row>
                </>
              )}

              {totals.discountAmount > 0 && (
                <Table.Summary.Row>
                  {columns.map((_, idx) => {
                    if (idx === ITEM_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="right"><Text>Discount</Text></Table.Summary.Cell>;
                    if (idx === TOTAL_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="right"><Text>-{formatCurrency(totals.discountAmount, currencySymbol)}</Text></Table.Summary.Cell>;
                    return <Table.Summary.Cell key={idx} index={idx} />;
                  })}
                </Table.Summary.Row>
              )}

              <Table.Summary.Row style={{ backgroundColor: "var(--bg-slate-50)", borderTop: "2px solid var(--border-color)" }}>
                {columns.map((_, idx) => {
                  if (idx === ITEM_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="right"><Text strong style={{ color: "var(--text-primary)" }}>Total</Text></Table.Summary.Cell>;
                  if (idx === QTY_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="center"><Text strong>{items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0)}</Text></Table.Summary.Cell>;
                  if (idx === TOTAL_COL_IDX) return <Table.Summary.Cell key={idx} index={idx} align="right"><Text strong style={{ fontSize: 16, color: primaryColor }}>{formatCurrency(totals.finalTotal, currencySymbol)}</Text></Table.Summary.Cell>;
                  return <Table.Summary.Cell key={idx} index={idx} />;
                })}
              </Table.Summary.Row>
            </>
          )}
        />

        {/* Amount in Words */}
        <div style={{ marginTop: 12, padding: "10px 14px", backgroundColor: "var(--bg-slate-50)", borderRadius: 6, border: "1px solid var(--border-color)", fontSize: "13px" }}>
          <Text strong style={{ color: "var(--text-primary)" }}>Amount in Words:</Text> <Text style={{ color: "var(--text-secondary)" }}>{totalInWords}</Text>
        </div>


        {/* Payment / Bank Details + signature */}
        {settings?.payment && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 8,
              borderTop: "1px solid var(--border-color)",
              display: "grid",
              gridTemplateColumns: settings.general?.signature ? "2fr 1fr" : "1fr",
              gap: 24,
              fontSize: 12,
              alignItems: "flex-start",
            }}
          >
            {/* Bank Details - Title inside card */}
            <div>
              <Card
                size="small"
                style={{
                  backgroundColor: "var(--bg-slate-50)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 6,
                }}
                bodyStyle={{ padding: "12px" }}
              >
                <Title level={5} style={{ marginBottom: 12, color: primaryColor, fontSize: "14px" }}>
                  Bank Details
                </Title>

                <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  {/* Bank Info - label and value on same line */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 6, display: "flex" }}>
                      <Text type="secondary" style={{ width: 120, fontSize: "12px", color: "var(--text-secondary)" }}>Bank Name:</Text>
                      <Text style={{ fontSize: "12px", color: "var(--text-primary)" }}>{settings.payment.bankName}</Text>
                    </div>

                    <div style={{ marginBottom: 6, display: "flex" }}>
                      <Text type="secondary" style={{ width: 120, fontSize: "12px", color: "var(--text-secondary)" }}>Account Number:</Text>
                      <Text style={{ fontSize: "12px", color: "var(--text-primary)" }}>{settings.payment.accountNumber}</Text>
                    </div>

                    <div style={{ marginBottom: 6, display: "flex" }}>
                      <Text type="secondary" style={{ width: 120, fontSize: "12px", color: "var(--text-secondary)" }}>IFSC Code:</Text>
                      <Text style={{ fontSize: "12px", color: "var(--text-primary)" }}>{settings.payment.ifscCode}</Text>
                    </div>

                    <div style={{ display: "flex" }}>
                      <Text type="secondary" style={{ width: 120, fontSize: "12px", color: "var(--text-secondary)" }}>Branch:</Text>
                      <Text style={{ fontSize: "12px", color: "var(--text-primary)" }}>{settings.payment.branchName}</Text>
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
                          border: "1px solid var(--border-color)",
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
                          color: "var(--text-secondary)"
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
              <div style={{ textAlign: "center" }}>
                <Title level={5} style={{ marginBottom: 8, color: primaryColor, fontSize: "14px" }}>
                  Authorized Signature
                </Title>

                <div
                  style={{
                    backgroundColor: "var(--bg-slate-50)",
                    padding: 12,
                    borderRadius: 6,
                    display: "inline-block",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <img
                    src={settings.general.signature}
                    alt="Authorized Signature"
                    style={{
                      width: 100,
                      height: 80,
                      objectFit: "contain",
                      border: "1px solid var(--border-color)",
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
                      color: "var(--text-secondary)"
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
        {(data.notes || data.terms) && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-color)", display: "flex", gap: 16, alignItems: "flex-start" }}>
            {data.notes && (
              <div style={{ flex: 1 }}>
                <Card
                  size="small"
                  style={{
                    backgroundColor: "var(--bg-slate-50)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 6,
                    minHeight: 120,
                  }}
                  bodyStyle={{ padding: "12px" }}
                >
                  <Title level={5} style={{ marginBottom: 8, color: primaryColor, fontSize: "14px" }}>
                    Notes
                  </Title>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    <Text style={{ color: "var(--text-secondary)" }}>{data.notes}</Text>
                  </div>
                </Card>
              </div>
            )}
            {data.terms && (
              <div style={{ flex: 1 }}>
                <Card
                  size="small"
                  style={{
                    backgroundColor: "var(--bg-slate-50)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 6,
                    minHeight: 120,
                  }}
                  bodyStyle={{ padding: "12px" }}
                >
                  <Title level={5} style={{ marginBottom: 8, color: primaryColor, fontSize: "14px" }}>
                    Terms & Conditions
                  </Title>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    <Text style={{ color: "var(--text-secondary)" }}>{data.terms}</Text>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

      </Card>
    </div>
  );
};

export default InvoicePreview;
