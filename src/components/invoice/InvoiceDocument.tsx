import React from 'react';
import { Card, Typography, Table, Tag, Alert, Space, Button } from 'antd';
import dayjs from 'dayjs';
const { Title, Text } = Typography;

export function InvoiceDocument({ 
  invoice, 
  settings, 
  customer, 
  tableData, 
  columns, 
  subtotal, 
  taxTotal, 
  discount, 
  grandTotal, 
  totalQty, 
  currencySymbol, 
  totalInWords, 
  hasTax,
  ITEM_COL,
  QTY_COL,
  TOTAL_COL,
  formatCurrency
}: any) {
  const isDark = false;
  return (
    <Card
          id="invoice"
          style={{
            backgroundColor: "var(--invoice-paper-bg)",
            border: `1px solid var(--invoice-paper-border)`,
            borderRadius: 8,
            boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
            width: "85%",
            margin: "0 auto",
            color: "var(--text-primary)"
          }}
        >
          {/* Header with Invoice Title and Logo */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            {/* Left side - Invoice Title and Details */}
            <div>
              <div style={{ marginBottom: 12 }}>
                <Title level={1} style={{ margin: 0, color: settings?.general?.primaryColor || "#1890ff", lineHeight: 1.2, fontSize: "32px" }}>
                  INVOICE
                </Title>
              </div>

              {/* Invoice Number and Dates - All together */}
              <div>
                <div style={{ display: "flex", marginBottom: 2, lineHeight: 1.5 }}>
                  <Text strong style={{ width: 90, fontSize: "13px" }}>Invoice No:</Text>
                  <Text style={{ fontSize: "13px" }}>#{invoice.invoiceNumber || "---"}</Text>
                </div>
                <div style={{ display: "flex", marginBottom: 2, lineHeight: 1.5 }}>
                  <Text strong style={{ width: 90, fontSize: "13px" }}>Invoice Date:</Text>
                  <Text style={{ fontSize: "13px" }}>
                    {invoice.invoiceDate ? dayjs(invoice.invoiceDate).format(settings?.general?.dateFormat || 'MMM DD, YYYY') : "---"}
                  </Text>
                </div>
                <div style={{ display: "flex", marginBottom: 2, lineHeight: 1.5 }}>
                  <Text strong style={{ width: 90, fontSize: "13px" }}>Due Date:</Text>
                  <Text style={{ fontSize: "13px" }}>
                    {invoice.dueDate ? dayjs(invoice.dueDate).format(settings?.general?.dateFormat || 'MMM DD, YYYY') : "---"}
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
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: settings?.general?.primaryColor || "#1890ff", textAlign: "center" }}>
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
                  backgroundColor: "var(--invoice-section-bg)",
                  border: "1px solid var(--invoice-section-border)",
                  borderRadius: 8
                }}
                bodyStyle={{ padding: "12px" }}
              >
                <Title level={5} style={{ marginBottom: 8, color: settings?.general?.primaryColor || "#1890ff", fontSize: "14px" }}>BILLED BY</Title>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: 4 }}>
                    {settings?.general?.companyName || "Your Company"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.5 }}>
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
                      <Text type="secondary" style={{ fontSize: "11px" }}>Tax ID: </Text>
                      <Text style={{ fontSize: "11px" }}>{settings.general.taxId}</Text>
                    </div>
                  )}
                  {settings?.general?.gstin && (
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      <Text type="secondary" style={{ fontSize: "11px" }}>GSTIN: </Text>
                      <Text style={{ fontSize: "11px" }}>{settings.general.gstin}</Text>
                    </div>
                  )}
                  {settings?.general?.pan && (
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      <Text type="secondary" style={{ fontSize: "11px" }}>PAN: </Text>
                      <Text style={{ fontSize: "11px" }}>{settings.general.pan}</Text>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Billed To (Customer Info) */}
            <div style={{ flex: 1, display: "flex" }}>
              <Card
                size="small"
                style={{
                  width: "100%",
                  backgroundColor: "var(--invoice-section-bg)",
                  border: "1px solid var(--invoice-section-border)",
                  borderRadius: 8
                }}
                bodyStyle={{ padding: "12px" }}
              >
                <Title level={5} style={{ marginBottom: 8, color: settings?.general?.primaryColor || "#1890ff", fontSize: "14px" }}>BILLED TO</Title>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: 4 }}>
                    {customer?.companyName || "Customer Name"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.5 }}>
                    {[
                      customer?.address,
                      customer?.city,
                      customer?.country
                    ].filter(Boolean).join(", ") || "---"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)", marginBottom: 4 }}>
                    {customer?.email || ""}
                  </div>

                  {/* Tax related fields with labels */}
                  {customer?.gstin && (
                    <div style={{ marginTop: 6, fontSize: "11px", color: "var(--text-secondary)" }}>
                      <Text type="secondary" style={{ fontSize: "11px" }}>GSTIN: </Text>
                      <Text style={{ fontSize: "11px" }}>{customer.gstin}</Text>
                    </div>
                  )}
                  {customer?.pan && (
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      <Text type="secondary" style={{ fontSize: "11px" }}>PAN: </Text>
                      <Text style={{ fontSize: "11px" }}>{customer.pan}</Text>
                    </div>
                  )}
                  {customer?.taxId && !customer?.gstin && (
                    <div style={{ marginTop: 6, fontSize: "11px", color: "var(--text-secondary)" }}>
                      <Text type="secondary" style={{ fontSize: "11px" }}>Tax ID: </Text>
                      <Text style={{ fontSize: "11px" }}>{customer.taxId}</Text>
                    </div>
                  )}
                </div>
              </Card>
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
                  {columns.map((_: any, idx: number) => {
                    if (idx === ITEM_COL) {
                      return (
                        <Table.Summary.Cell key={idx} index={idx} align="right">
                          <Text>Subtotal</Text>
                        </Table.Summary.Cell>
                      );
                    }
                    if (idx === TOTAL_COL) {
                      return (
                        <Table.Summary.Cell key={idx} index={idx} align="right">
                          <Text>{formatCurrency(subtotal, currencySymbol)}</Text>
                        </Table.Summary.Cell>
                      );
                    }
                    return <Table.Summary.Cell key={idx} index={idx} />;
                  })}
                </Table.Summary.Row>

                {/* CGST & SGST Split */}
                {hasTax && taxTotal > 0 && (
                  <>
                    <Table.Summary.Row>
                      {columns.map((_: any, idx: number) => {
                        const effectivePct = subtotal > 0 ? ((taxTotal / 2) / subtotal) * 100 : 0;
                        const rateLabel = ` (${effectivePct.toFixed(2)}%)`;

                        if (idx === ITEM_COL) {
                          return (
                            <Table.Summary.Cell key={idx} index={idx} align="right">
                              <Text>CGST{rateLabel}</Text>
                            </Table.Summary.Cell>
                          );
                        }
                        if (idx === TOTAL_COL) {
                          return (
                            <Table.Summary.Cell key={idx} index={idx} align="right">
                              <Text>{formatCurrency(taxTotal / 2, currencySymbol)}</Text>
                            </Table.Summary.Cell>
                          );
                        }
                        return <Table.Summary.Cell key={idx} index={idx} />;
                      })}
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      {columns.map((_: any, idx: number) => {
                        const effectivePct = subtotal > 0 ? ((taxTotal / 2) / subtotal) * 100 : 0;
                        const rateLabel = ` (${effectivePct.toFixed(2)}%)`;

                        if (idx === ITEM_COL) {
                          return (
                            <Table.Summary.Cell key={idx} index={idx} align="right">
                              <Text>SGST{rateLabel}</Text>
                            </Table.Summary.Cell>
                          );
                        }
                        if (idx === TOTAL_COL) {
                          return (
                            <Table.Summary.Cell key={idx} index={idx} align="right">
                              <Text>{formatCurrency(taxTotal / 2, currencySymbol)}</Text>
                            </Table.Summary.Cell>
                          );
                        }
                        return <Table.Summary.Cell key={idx} index={idx} />;
                      })}
                    </Table.Summary.Row>
                  </>
                )}

                {/* DISCOUNT */}
                {discount > 0 && (
                  <Table.Summary.Row>
                    {columns.map((_: any, idx: number) => {
                      if (idx === ITEM_COL) {
                        return (
                          <Table.Summary.Cell key={idx} index={idx} align="right">
                            <Text>Discount</Text>
                          </Table.Summary.Cell>
                        );
                      }
                      if (idx === TOTAL_COL) {
                        return (
                          <Table.Summary.Cell key={idx} index={idx} align="right">
                            <Text>-{formatCurrency(discount, currencySymbol)}</Text>
                          </Table.Summary.Cell>
                        );
                      }
                      return <Table.Summary.Cell key={idx} index={idx} />;
                    })}
                  </Table.Summary.Row>
                )}

                {/* GRAND TOTAL */}
                <Table.Summary.Row
                  style={{
                    backgroundColor: "var(--invoice-total-row-bg)",
                    borderTop: `2px solid var(--invoice-total-row-border)`,
                  }}
                >
                  {columns.map((_: any, idx: number) => {
                    if (idx === ITEM_COL) {
                      return (
                        <Table.Summary.Cell key={idx} index={idx} align="right">
                          <Text strong>Total</Text>
                        </Table.Summary.Cell>
                      );
                    }
                    if (idx === QTY_COL) {
                      return (
                        <Table.Summary.Cell key={idx} index={idx} align="center">
                          <Text strong>{totalQty}</Text>
                        </Table.Summary.Cell>
                      );
                    }
                    if (idx === TOTAL_COL) {
                      return (
                        <Table.Summary.Cell key={idx} index={idx} align="right">
                          <Text strong style={{ fontSize: 16, color: settings?.general?.primaryColor || "#1890ff" }}>
                            {formatCurrency(grandTotal, currencySymbol)}
                          </Text>
                        </Table.Summary.Cell>
                      );
                    }
                    return <Table.Summary.Cell key={idx} index={idx} />;
                  })}
                </Table.Summary.Row>
              </>
            )}
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
                    Zithspace
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
                zithspace.com/invoice
              </a>{" "}
              to create truly professional invoices
            </div>
          </div>
        </Card>
  );
}
