// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { Card, Button, Space, Typography } from "antd";

// const { Title, Text } = Typography;

// export default function ViewInvoicePage() {
//   const { invoice_number } = useParams(); // must match filename
//   const router = useRouter();
//   const [invoice, setInvoice] = useState<any>(null);

//   useEffect(() => {
//     const invoices = JSON.parse(localStorage.getItem("invoices") || "[]");
//     const found = invoices.find(
//       (inv: any) => inv.invoice_number === invoice_number
//     );
//     setInvoice(found);
//   }, [invoice_number]);

//   if (!invoice) {
//     return <Card>Invoice not found</Card>;
//   }

//   return (
//     <Card style={{ maxWidth: 900, margin: "auto" }}>
//       <Space direction="vertical" size="large" style={{ width: "100%" }}>
//         <Title level={3}>Invoice {invoice.invoice_number}</Title>

//         <Text>
//           <b>Date:</b> {new Date(invoice.invoice_date).toLocaleDateString()}
//         </Text>

//         <Text>
//           <b>Due Date:</b> {new Date(invoice.due_date).toLocaleDateString()}
//         </Text>

//         <Text>
//           <b>Status:</b> {invoice.status}
//         </Text>

//         <Text>
//           <b>Currency:</b> {invoice.currency}
//         </Text>

//         <Text>
//           <b>Notes:</b> {invoice.notes || "-"}
//         </Text>

//         {/* ITEMS */}
//         <div>
//           <Title level={5}>Items</Title>
//           {(invoice.items || []).map((item: any, idx: number) => (
//             <Card key={idx} size="small" style={{ marginBottom: 8 }}>
//               {item.item} — {item.qty} × {item.price}
//             </Card>
//           ))}
//         </div>

//         <Space>
//           <Button onClick={() => router.back()}>Back</Button>
//           <Button type="primary" onClick={() => window.print()}>
//             Print
//           </Button>
//         </Space>
//       </Space>
//     </Card>
//   );
// }

// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { Card, Button, Space, Typography, Table } from "antd";

// const { Title, Text } = Typography;

// export default function ViewInvoicePage() {
//   const { invoice_number } = useParams();
//   const router = useRouter();
//   const [invoice, setInvoice] = useState<any>(null);
//   const [settings, setSettings] = useState<any>(null); // company logo & info

//   useEffect(() => {
//     // Load invoice
//     const invoices = JSON.parse(localStorage.getItem("invoices") || "[]");
//     const found = invoices.find(
//       (inv: any) => inv.invoice_number === invoice_number
//     );
//     setInvoice(found);

//     // Load settings
//     const savedSettings = JSON.parse(localStorage.getItem("settings") || "{}");
//     setSettings(savedSettings);
//   }, [invoice_number]);

//   if (!invoice) {
//     return <Card>Invoice not found</Card>;
//   }

//   const columns = [
//     {
//       title: "Item",
//       dataIndex: "item",
//       key: "item",
//     },
//     {
//       title: "Quantity",
//       dataIndex: "qty",
//       key: "qty",
//     },
//     {
//       title: "Price",
//       dataIndex: "price",
//       key: "price",
//       render: (value: any) =>
//         `${invoice.currency} ${(Number(value) || 0).toFixed(2)}`,
//     },
//     {
//       title: "Total",
//       key: "total",
//       render: (_: any, record: any) =>
//         `${invoice.currency} ${(record.qty * record.price).toFixed(2)}`,
//     },
//   ];

//   const subtotal = invoice.items.reduce(
//     (acc: number, i: any) => acc + i.qty * i.price,
//     0
//   );

//   const total = subtotal; // you can add tax, discount, etc.

//   return (
//     <Card style={{ maxWidth: 900, margin: "auto", padding: 24 }}>
//       {/* Header */}
//       <Space style={{ justifyContent: "space-between", width: "100%" }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//           {settings?.logo && (
//             <img src={settings.logo} alt="Logo" style={{ height: 50 }} />
//           )}
//           <div>
//             <Title
//               level={3}
//               style={{ color: settings?.primaryColor || "#000" }}
//             >
//               {settings?.companyName || "Company Name"}
//             </Title>
//             <Text>Invoice</Text>
//           </div>
//         </div>

//         <Space>
//           <Button onClick={() => router.back()}>Back</Button>
//           <Button
//             onClick={() => {
//               // simple download logic
//               const blob = new Blob(
//                 [document.getElementById("invoice")!.innerHTML],
//                 {
//                   type: "text/html",
//                 }
//               );
//               const url = URL.createObjectURL(blob);
//               const a = document.createElement("a");
//               a.href = url;
//               a.download = `invoice_${invoice.invoice_number}.html`;
//               a.click();
//             }}
//           >
//             Download
//           </Button>
//           <Button type="primary" onClick={() => window.print()}>
//             Print
//           </Button>
//         </Space>
//       </Space>

//       <div id="invoice" style={{ marginTop: 24 }}>
//         <hr />

//         {/* Invoice Info */}
//         <Space style={{ justifyContent: "space-between", width: "100%" }}>
//           <div>
//             <Text>
//               <b>Invoice Number:</b> {invoice.invoice_number}
//             </Text>
//             <br />
//             <Text>
//               <b>Type:</b> {invoice.type || "-"}
//             </Text>
//           </div>
//           <div>
//             <Text>
//               <b>Invoice Date:</b>{" "}
//               {new Date(invoice.invoice_date).toLocaleDateString()}
//             </Text>
//             <br />
//             <Text>
//               <b>Due Date:</b> {new Date(invoice.due_date).toLocaleDateString()}
//             </Text>
//           </div>
//         </Space>

//         <hr />

//         {/* Bill To */}
//         <div style={{ marginBottom: 24 }}>
//           <Title level={5}>Bill To:</Title>
//           <Text>{invoice.customer?.companyName}</Text>
//           <br />
//           <Text>{invoice.customer?.address}</Text>
//           <br />
//           <Text>
//             {invoice.customer?.city}, {invoice.customer?.state}{" "}
//             {invoice.customer?.zip}
//           </Text>
//           <br />
//           <Text>{invoice.customer?.email}</Text>
//         </div>

//         {/* Line Items */}
//         <Table
//           dataSource={invoice.items}
//           columns={columns}
//           pagination={false}
//           rowKey={(record) => record.item} // or record.id
//         />

//         <hr />

//         {/* Totals */}
//         <div style={{ textAlign: "right", marginTop: 16 }}>
//           <Text>
//             <b>Subtotal:</b> {invoice.currency} {subtotal.toFixed(2)}
//           </Text>
//           <br />
//           <Text>
//             <b>Total:</b> {invoice.currency} {total.toFixed(2)}
//           </Text>
//         </div>

//         <hr />

//         {/* Notes */}
//         <div>
//           <Title level={5}>Notes & Terms</Title>
//           <Text>{invoice.notes || "-"}</Text>
//         </div>
//       </div>
//     </Card>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Typography, Table, Divider, Space, Tag } from "antd";

import InvoiceDownloadButton from "../../InvoiceDownloadButton";

import { currencyOptions } from "@/utils/currencyOptions";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "../../InvoicePDF";

import {
  EditOutlined,
  LoadingOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";
import TiptapEditor from "@/components/common/TiptapEditor";

//import { ArrowLeft, Download, Printer } from "lucide-react";

const { Title, Text } = Typography;

interface InvoiceItem {
  item: string;
  description?: string;
  qty: number;
  price: number;
  tax?: string | number;
}

export default function ViewInvoicePage() {
  const { invoice_number } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [descriptionEditorOpen, setDescriptionEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [invoice_page_descriptions, setInvoicePageDescriptions] = useState<
    Record<string, string>
  >({});

  const currencyCode = invoice?.currency || "USD";

  const params = useParams();

  const invoiceNumber =
    typeof params.invoice_number === "string"
      ? params.invoice_number
      : Array.isArray(params.invoice_number)
      ? params.invoice_number[0]
      : null;

  const currencySymbol =
    currencyOptions.find((c) => c.value === currencyCode)?.symbol || "$";

  useEffect(() => {
    const invoices = JSON.parse(localStorage.getItem("invoices") || "[]");
    const found = invoices.find(
      (inv: any) => inv.invoice_number === invoice_number
    );
    setInvoice(found);

    const savedSettings = JSON.parse(
      localStorage.getItem("invoice_settings") || "[]"
    );

    setSettings(savedSettings[0] || null);
  }, [invoice_number]);

  useEffect(() => {
    if (invoiceNumber === null) return;

    const savedDescriptions: Record<string, string> = JSON.parse(
      localStorage.getItem("invoice_page_descriptions") || "{}"
    );

    const description = savedDescriptions[invoiceNumber] ?? "";
    setEditorContent(description);
  }, [invoiceNumber]);

  useEffect(() => {
    const savedDescriptions: Record<string, string> = JSON.parse(
      localStorage.getItem("invoice_page_descriptions") || "{}"
    );
    setInvoicePageDescriptions(savedDescriptions);
  }, []);

  if (!invoice || !settings) {
    return <Card>Invoice not found</Card>;
  }

  const hasTax = (invoice.items as InvoiceItem[]).some(
    (item) => Number(String(item.tax || 0).replace("%", "")) > 0
  );

  const ITEM_COL = 0;
  const QTY_COL = 1;
  const PRICE_COL = 2;
  const TAX_COL = hasTax ? 3 : null;
  const TOTAL_COL = hasTax ? 4 : 3;

  // const columns = [
  //   {
  //     title: "Item",
  //     dataIndex: "item",
  //     key: "item",
  //     render: (text: string, record: any) => (
  //       <div>
  //         <Text strong>{text}</Text>
  //         {record.description && (
  //           <div>
  //             <Text type="secondary" style={{ fontSize: "12px" }}>
  //               {record.description}
  //             </Text>
  //           </div>
  //         )}
  //       </div>
  //     ),
  //   },
  //   {
  //     title: "Qty",
  //     dataIndex: "qty",
  //     key: "qty",
  //     align: "center" as const,
  //     width: 80,
  //   },
  //   {
  //     title: "Price",
  //     dataIndex: "price",
  //     key: "price",
  //     align: "right" as const,
  //     width: 120,
  //     render: (value: number) =>
  //       `${currencySymbol} ${(Number(value) || 0).toFixed(2)}`,
  //   },
  //   {
  //     title: "Tax",
  //     dataIndex: "tax",
  //     key: "tax",
  //     align: "center" as const,
  //     width: 80,
  //     render: (tax: string | number) => {
  //       if (typeof tax === "number") return `${tax}%`;
  //       if (typeof tax === "string" && tax.includes("%")) return tax;
  //       return `${tax || 0}%`;
  //     },
  //   },
  //   {
  //     title: "Total",
  //     key: "total",
  //     align: "right" as const,
  //     width: 120,
  //     render: (_: any, record: any) => {
  //       const subtotal = record.qty * record.price;
  //       const taxRate =
  //         parseFloat(String(record.tax || 0).replace("%", "")) / 100;
  //       const taxAmount = subtotal * taxRate;
  //       const total = subtotal + taxAmount;
  //       return `${currencySymbol} ${total.toFixed(2)}`;
  //     },
  //   },
  // ];

  const columns = [
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
      render: (value: number) =>
        `${currencySymbol} ${(Number(value) || 0).toFixed(2)}`,
    },

    // ✅ TAX COLUMN ONLY IF TAX EXISTS
    ...(hasTax
      ? [
          {
            title: "Tax",
            dataIndex: "tax",
            key: "tax",
            align: "center" as const,
            width: 80,
            render: (tax: string | number) => {
              if (typeof tax === "number") return `${tax}%`;
              if (typeof tax === "string" && tax.includes("%")) return tax;
              return `${tax || 0}%`;
            },
          },
        ]
      : []),

    {
      title: "Total",
      key: "total",
      align: "right" as const,
      width: 120,
      render: (_: any, record: any) => {
        const subtotal = record.qty * record.price;
        const taxRate = hasTax
          ? parseFloat(String(record.tax || 0).replace("%", "")) / 100
          : 0;
        const taxAmount = subtotal * taxRate;
        return `${currencySymbol} ${(subtotal + taxAmount).toFixed(2)}`;
      },
    },
  ];

  const tableData = (invoice.items as InvoiceItem[]).map(
    (item: InvoiceItem, index: number) => ({
      ...item,
      _key: index,
    })
  );

  // Calculate totals
  // const itemsWithTax = (invoice.items as InvoiceItem[]).map(
  //   (item: InvoiceItem) => {
  //     const subtotal = item.qty * item.price;
  //     const taxRate = parseFloat(String(item.tax || 0).replace("%", "")) / 100;
  //     const taxAmount = subtotal * taxRate;

  //     return {
  //       ...item,
  //       subtotal,
  //       taxAmount,
  //       total: subtotal + taxAmount,
  //     };
  //   }
  // );

  const itemsWithTax = (invoice.items as InvoiceItem[]).map((item) => {
    const subtotal = item.qty * item.price;
    const taxRate = hasTax
      ? parseFloat(String(item.tax || 0).replace("%", "")) / 100
      : 0;
    const taxAmount = subtotal * taxRate;

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      qty: item.qty,
    };
  });

  const subtotal = itemsWithTax.reduce<number>((acc, i) => acc + i.subtotal, 0);
  const totalTax = itemsWithTax.reduce<number>(
    (acc, i) => acc + i.taxAmount,
    0
  );

  const totalQty = (invoice.items as InvoiceItem[]).reduce<number>(
    (sum, item) => sum + item.qty,
    0
  );

  const discount = invoice.discount || 0;

  const grandTotal = subtotal + totalTax - discount;

  const itemColumnIndex = 0; // Item column position
  const lastColumnIndex = columns.length - 1;

  const handleDescriptionSave = () => {
    if (!invoiceNumber) return;

    const savedDescriptions: Record<string, string> = JSON.parse(
      localStorage.getItem("invoice_page_descriptions") || "{}"
    );

    savedDescriptions[invoiceNumber] = editorContent;

    localStorage.setItem(
      "invoice_page_descriptions",
      JSON.stringify(savedDescriptions)
    );

    setDescriptionEditorOpen(false);
  };

  return (
    <div
      style={{
        height: "calc(100vh - 64px)", // adjust if header height differs
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
            //icon={<ArrowLeft size={16} />}
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            Back to Invoices
          </Button>

          <Space>
            {/* <Button
              //icon={<Download size={16} />}
              // onClick={() => {
              //   const blob = new Blob(
              //     [document.getElementById("invoice")!.innerHTML],
              //     { type: "text/html" }
              //   );
              //   const url = URL.createObjectURL(blob);
              //   const a = document.createElement("a");
              //   a.href = url;
              //   a.download = `invoice_${invoice.invoice_number}.html`;
              //   a.click();
              // }}
              onClick={downloadPDF}
            >
              Download
            </Button> */}
            {/* <PDFDownloadLink
              document={<InvoicePDF invoice={invoice} settings={settings} />}
              fileName={`invoice_${invoice.invoice_number}.pdf`}
            >
              {({ loading }) =>
                loading ? (
                  "Preparing PDF..."
                ) : (
                  <Button type="primary">Download PDF</Button>
                )
              }
            </PDFDownloadLink> */}

            <Space>
              <InvoiceDownloadButton
                invoice={invoice}
                settings={settings}
                invoice_page_descriptions={invoice_page_descriptions}
              />
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
                {settings?.general?.company_logo && (
                  <img
                    src={settings.general.company_logo}
                    alt="Logo"
                    style={{
                      height: 48,
                      objectFit: "contain",
                    }}
                  />
                )}

                <div>
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      color: settings?.general?.primary_color || "#1890ff",
                    }}
                  >
                    {settings?.general?.company_name || "InvoicePro Inc."}
                  </Title>

                  <Text
                    type="secondary"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: "1.4",
                      maxWidth: 500, // adjust based on layout
                    }}
                  >
                    {settings?.general?.company_address || "Address line 1"}
                  </Text>
                </div>
              </div>

              {/* Right: Invoice Info */}
              <div style={{ textAlign: "right" }}>
                <Title level={2} style={{ margin: 0 }}>
                  INVOICE
                </Title>
                <Text type="secondary">Invoice #{invoice.invoice_number}</Text>
              </div>
            </div>
          </div>

          {/* Invoice Info Grid */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 32,
              alignItems: "flex-start", // important: align both cards at the top
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
                  height: "100%", // ensures it stretches naturally with content
                }}
              >
                <Text
                  strong
                  style={{ fontSize: 16, display: "block", marginBottom: 6 }}
                >
                  {invoice.customer_snapshot?.name || "Acme Corporation"}
                </Text>
                <Text
                  style={{ display: "block", marginBottom: 2, color: "#555" }}
                >
                  {invoice.customer_snapshot?.address || "123 Business Ave"}
                </Text>
                <Text
                  style={{ display: "block", marginBottom: 2, color: "#555" }}
                >
                  {invoice.customer_snapshot?.city || "San Francisco"},{" "}
                  {invoice.customer_snapshot?.state || "USA"}
                </Text>
                <Text
                  style={{ display: "block", marginBottom: 2, color: "#555" }}
                >
                  {invoice.customer_snapshot?.email || "billing@acme.com"}
                </Text>
                {invoice.customer_snapshot?.taxId && (
                  <Text
                    style={{
                      display: "block",
                      marginTop: 8,
                      fontSize: 13,
                      color: "#888",
                    }}
                  >
                    <strong>Tax ID:</strong>{" "}
                    {invoice.customer_snapshot.taxId || "US-123456789"}
                  </Text>
                )}
              </div>
            </div>

            {/* Invoice Details */}
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
                  textAlign: "left", // front-aligned inside card
                  minWidth: 220,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Invoice Date:</Text>{" "}
                  <Text>
                    {new Date(invoice.invoice_date).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </Text>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <Text strong>Due Date:</Text>{" "}
                  <Text>
                    {new Date(invoice.due_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </div>

                <div>
                  <Text strong>Type:</Text>{" "}
                  <Text style={{ color: settings?.primaryColor || "#1890ff" }}>
                    {invoice.type || "Standard"}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Invoice Description */}

          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Description
              </Text>

              {!descriptionEditorOpen && (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setDescriptionEditorOpen(true)}
                >
                  Edit
                </Button>
              )}
            </div>

            {descriptionEditorOpen ? (
              <>
                <TiptapEditor
                  content={editorContent}
                  onChange={setEditorContent}
                  placeholder="Add description..."
                  minHeight={150}
                />

                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => setDescriptionEditorOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="primary"
                    size="small"
                    onClick={handleDescriptionSave}
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <div
                onClick={() => setDescriptionEditorOpen(true)}
                style={{
                  minHeight: 40,
                  cursor: "text",
                  padding: 12,
                  borderRadius: 6,
                  border: "1px dashed #d9d9d9",
                }}
              >
                {editorContent ? (
                  <div dangerouslySetInnerHTML={{ __html: editorContent }} />
                ) : (
                  <Text type="secondary" italic>
                    Click to add a description…
                  </Text>
                )}
              </div>
            )}
          </div>

          <Table
            dataSource={tableData}
            columns={columns}
            pagination={false}
            rowKey="_key"
            bordered
            size="small"
            summary={() => (
              <>
                {/* ===== SUBTOTAL ===== */}
                <Table.Summary.Row>
                  <Table.Summary.Cell index={ITEM_COL} align="right">
                    <Text>Subtotal</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={QTY_COL} />
                  <Table.Summary.Cell index={PRICE_COL} />
                  {hasTax && <Table.Summary.Cell index={TAX_COL!} />}
                  <Table.Summary.Cell index={TOTAL_COL} align="right">
                    <Text>
                      {currencySymbol} {subtotal.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>

                {/* ===== TAX ===== */}
                {hasTax && totalTax > 0 && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={ITEM_COL} align="right">
                      <Text>Tax</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={QTY_COL} />
                    <Table.Summary.Cell index={PRICE_COL} />
                    <Table.Summary.Cell index={TAX_COL!} />
                    <Table.Summary.Cell index={TOTAL_COL} align="right">
                      <Text>
                        {currencySymbol} {totalTax.toFixed(2)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}

                {/* ===== DISCOUNT ===== */}
                {discount > 0 && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={ITEM_COL} align="right">
                      <Text>Discount</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={QTY_COL} />
                    <Table.Summary.Cell index={PRICE_COL} />
                    {hasTax && <Table.Summary.Cell index={TAX_COL!} />}
                    <Table.Summary.Cell index={TOTAL_COL} align="right">
                      <Text>
                        -{currencySymbol} {discount.toFixed(2)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}

                {/* ===== TOTAL ===== */}
                <Table.Summary.Row
                  style={{
                    backgroundColor: "#fafafa",
                    borderTop: "2px solid #000",
                  }}
                >
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
                      {currencySymbol} {grandTotal.toFixed(2)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            )}
          />

          {/* Payment / Bank Details + sign */}
          {settings?.payments && (
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
              {/* ================= COLUMN 1 : BANK + QR ================= */}
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
                      <Text>{settings.payments.account_name}</Text>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Account Number:</Text>{" "}
                      <Text>{settings.payments.account_number}</Text>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <Text strong>IFSC Code:</Text>{" "}
                      <Text>{settings.payments.ifsc_code}</Text>
                    </div>

                    <div>
                      <Text strong>Branch:</Text>{" "}
                      <Text>{settings.payments.branch_name}</Text>
                    </div>
                  </div>

                  {/* QR Code */}
                  {settings.payments.qr_code && (
                    <div style={{ textAlign: "center", minWidth: 180 }}>
                      <img
                        src={settings.payments.qr_code}
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

              {/* ================= COLUMN 2 : SIGNATURE ================= */}
              {settings.general?.company_signature && (
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
                      src={settings.general.company_signature}
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
        </Card>
      </div>
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import {
//   Card,
//   Button,
//   Typography,
//   Table,
//   Divider,
//   Space,
//   Tag,
//   Row,
//   Col,
// } from "antd";
// import {
//   ArrowLeftOutlined,
//   DownloadOutlined,
//   PrinterOutlined,
// } from "@ant-design/icons";

// const { Title, Text } = Typography;

// export default function ViewInvoicePage() {
//   const { invoice_number } = useParams();
//   const router = useRouter();
//   const [invoice, setInvoice] = useState<any>(null);
//   const [settings, setSettings] = useState<any>(null);

//   useEffect(() => {
//     const invoices = JSON.parse(localStorage.getItem("invoices") || "[]");
//     const found = invoices.find(
//       (inv: any) => inv.invoice_number === invoice_number
//     );
//     setInvoice(found);

//     const savedSettings = JSON.parse(
//       localStorage.getItem("invoice_settings") || "[]"
//     );
//     setSettings(savedSettings[0] || null);
//   }, [invoice_number]);

//   if (!invoice || !settings) {
//     return (
//       <Card
//         style={{
//           margin: "40px auto",
//           maxWidth: 600,
//           textAlign: "center",
//           padding: "40px 24px",
//         }}
//       >
//         <Title level={3} style={{ color: "#999", marginBottom: 16 }}>
//           Invoice Not Found
//         </Title>
//         <Button
//           type="primary"
//           onClick={() => router.back()}
//           icon={<ArrowLeftOutlined />}
//         >
//           Back to Invoices
//         </Button>
//       </Card>
//     );
//   }

//   const columns = [
//     {
//       title: "Item",
//       dataIndex: "item",
//       key: "item",
//       width: 200,
//       render: (text: string, record: any) => (
//         <div>
//           <Text strong style={{ fontSize: "14px" }}>
//             {text}
//           </Text>
//           {record.description && (
//             <div>
//               <Text
//                 type="secondary"
//                 style={{ fontSize: "12px", marginTop: 4, display: "block" }}
//               >
//                 {record.description}
//               </Text>
//             </div>
//           )}
//         </div>
//       ),
//     },
//     {
//       title: "Quantity",
//       dataIndex: "qty",
//       key: "qty",
//       align: "center" as const,
//       width: 100,
//     },
//     {
//       title: "Unit Price",
//       dataIndex: "price",
//       key: "price",
//       align: "right" as const,
//       width: 120,
//       render: (value: number) => (
//         <Text strong>
//           {invoice.currency} {(Number(value) || 0).toFixed(2)}
//         </Text>
//       ),
//     },
//     {
//       title: "Tax Rate",
//       dataIndex: "tax",
//       key: "tax",
//       align: "center" as const,
//       width: 100,
//       render: (tax: string | number) => (
//         <Tag color="blue">
//           {typeof tax === "number"
//             ? `${tax}%`
//             : typeof tax === "string" && tax.includes("%")
//             ? tax
//             : `${tax || 0}%`}
//         </Tag>
//       ),
//     },
//     {
//       title: "Total",
//       key: "total",
//       align: "right" as const,
//       width: 140,
//       render: (_: any, record: any) => {
//         const subtotal = record.qty * record.price;
//         const taxRate =
//           parseFloat(String(record.tax || 0).replace("%", "")) / 100;
//         const taxAmount = subtotal * taxRate;
//         const total = subtotal + taxAmount;
//         return (
//           <Text strong style={{ fontSize: "14px", color: "#1890ff" }}>
//             {invoice.currency} {total.toFixed(2)}
//           </Text>
//         );
//       },
//     },
//   ];

//   // Calculate totals
//   const itemsWithTax = invoice.items.map((item: any) => {
//     const subtotal = item.qty * item.price;
//     const taxRate = parseFloat(String(item.tax || 0).replace("%", "")) / 100;
//     const taxAmount = subtotal * taxRate;
//     return {
//       ...item,
//       subtotal,
//       taxAmount,
//       total: subtotal + taxAmount,
//     };
//   });

//   const subtotal = itemsWithTax.reduce(
//     (acc: number, i: any) => acc + i.subtotal,
//     0
//   );
//   const totalTax = itemsWithTax.reduce(
//     (acc: number, i: any) => acc + i.taxAmount,
//     0
//   );
//   const discount = invoice.discount || 0;
//   const total = subtotal + totalTax - discount;

//   // Get primary color from settings
//   const primaryColor = settings?.general?.primary_color || "#1890ff";

//   return (
//     <div
//       style={{
//         maxWidth: 1000,
//         margin: "0 auto",
//         padding: "24px 16px",
//         background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
//         minHeight: "100vh",
//       }}
//     >
//       {/* Header with Back button */}
//       <div
//         style={{
//           marginBottom: 24,
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           backgroundColor: "#fff",
//           padding: "16px 24px",
//           borderRadius: "12px",
//           boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
//         }}
//       >
//         <div>
//           <Button
//             icon={<ArrowLeftOutlined />}
//             onClick={() => router.back()}
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 8,
//               padding: "8px 16px",
//               height: "auto",
//             }}
//           >
//             Back to Invoices
//           </Button>
//           <Text
//             style={{
//               display: "block",
//               marginTop: 8,
//               color: "#666",
//               fontSize: "12px",
//             }}
//           >
//             Invoice #{invoice.invoice_number}
//           </Text>
//         </div>

//         <Space>
//           <Button
//             icon={<DownloadOutlined />}
//             onClick={() => {
//               const blob = new Blob(
//                 [document.getElementById("invoice")!.innerHTML],
//                 { type: "text/html" }
//               );
//               const url = URL.createObjectURL(blob);
//               const a = document.createElement("a");
//               a.href = url;
//               a.download = `invoice_${invoice.invoice_number}.html`;
//               a.click();
//             }}
//             style={{ padding: "8px 16px" }}
//           >
//             Download PDF
//           </Button>
//           <Button
//             type="primary"
//             icon={<PrinterOutlined />}
//             onClick={() => window.print()}
//             style={{
//               padding: "8px 20px",
//               background: primaryColor,
//               borderColor: primaryColor,
//             }}
//           >
//             Print Invoice
//           </Button>
//         </Space>
//       </div>

//       <Card
//         id="invoice"
//         style={{
//           border: "none",
//           borderRadius: "16px",
//           boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
//           overflow: "hidden",
//           backgroundColor: "#fff",
//         }}
//         bodyStyle={{ padding: 0 }}
//       >
//         {/* Invoice Header with Gradient */}
//         <div
//           style={{
//             background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
//             padding: "32px 40px",
//             color: "#fff",
//             marginBottom: 32,
//           }}
//         >
//           <Row align="middle" justify="space-between">
//             <Col>
//               {settings?.general?.company_logo && (
//                 <img
//                   src={settings.general.company_logo}
//                   alt="Logo"
//                   style={{
//                     height: 60,
//                     marginBottom: 12,
//                     backgroundColor: "#fff",
//                     padding: 8,
//                     borderRadius: 8,
//                   }}
//                 />
//               )}
//               <Title level={2} style={{ margin: 0, color: "#fff" }}>
//                 {settings?.general?.company_name || "InvoicePro Inc."}
//               </Title>
//               <Text
//                 style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}
//               >
//                 {settings?.general?.company_address || "Your Company Address"}
//               </Text>
//             </Col>
//             <Col>
//               <div
//                 style={{
//                   backgroundColor: "rgba(255,255,255,0.1)",
//                   padding: "20px 24px",
//                   borderRadius: "12px",
//                   backdropFilter: "blur(10px)",
//                 }}
//               >
//                 <Text strong style={{ fontSize: "32px", color: "#fff" }}>
//                   INVOICE
//                 </Text>
//                 <div style={{ marginTop: 8 }}>
//                   <Text
//                     style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}
//                   >
//                     #{invoice.invoice_number}
//                   </Text>
//                 </div>
//               </div>
//             </Col>
//           </Row>
//         </div>

//         {/* Invoice Details Section */}
//         <div style={{ padding: "0 40px 32px" }}>
//           <Row gutter={[32, 32]}>
//             {/* Bill To Section */}
//             <Col xs={24} md={12}>
//               <Card
//                 title="BILL TO"
//                 size="small"
//                 style={{ borderRadius: "12px" }}
//                 headStyle={{
//                   backgroundColor: "#fafafa",
//                   borderBottom: `2px solid ${primaryColor}`,
//                   fontSize: "14px",
//                   fontWeight: 600,
//                 }}
//               >
//                 <div style={{ padding: 8 }}>
//                   <Text
//                     strong
//                     style={{
//                       fontSize: "16px",
//                       display: "block",
//                       marginBottom: 8,
//                     }}
//                   >
//                     {invoice.customer?.name || "Acme Corporation"}
//                   </Text>
//                   <Text
//                     style={{ display: "block", marginBottom: 4, color: "#666" }}
//                   >
//                     {invoice.customer?.address || "123 Business Ave"}
//                   </Text>
//                   <Text
//                     style={{ display: "block", marginBottom: 4, color: "#666" }}
//                   >
//                     {invoice.customer?.city || "San Francisco"},{" "}
//                     {invoice.customer?.state || "USA"}
//                   </Text>
//                   <Text
//                     style={{ display: "block", marginBottom: 8, color: "#666" }}
//                   >
//                     {invoice.customer?.email || "billing@acme.com"}
//                   </Text>
//                   {invoice.customer?.taxId && (
//                     <Tag color="blue" style={{ marginTop: 8 }}>
//                       <strong>Tax ID:</strong> {invoice.customer.taxId}
//                     </Tag>
//                   )}
//                 </div>
//               </Card>
//             </Col>

//             {/* Invoice Info */}
//             <Col xs={24} md={12}>
//               <Card
//                 title="INVOICE DETAILS"
//                 size="small"
//                 style={{ borderRadius: "12px" }}
//                 headStyle={{
//                   backgroundColor: "#fafafa",
//                   borderBottom: `2px solid ${primaryColor}`,
//                   fontSize: "14px",
//                   fontWeight: 600,
//                 }}
//               >
//                 <Space
//                   direction="vertical"
//                   size={12}
//                   style={{ width: "100%", padding: 8 }}
//                 >
//                   <div
//                     style={{ display: "flex", justifyContent: "space-between" }}
//                   >
//                     <Text type="secondary">Invoice Date:</Text>
//                     <Text strong>
//                       {new Date(invoice.invoice_date).toLocaleDateString(
//                         "en-US",
//                         {
//                           year: "numeric",
//                           month: "short",
//                           day: "numeric",
//                         }
//                       )}
//                     </Text>
//                   </div>
//                   <div
//                     style={{ display: "flex", justifyContent: "space-between" }}
//                   >
//                     <Text type="secondary">Due Date:</Text>
//                     <Text
//                       strong
//                       style={{ color: total > 0 ? primaryColor : "#52c41a" }}
//                     >
//                       {new Date(invoice.due_date).toLocaleDateString("en-US", {
//                         year: "numeric",
//                         month: "short",
//                         day: "numeric",
//                       })}
//                     </Text>
//                   </div>
//                   <div
//                     style={{ display: "flex", justifyContent: "space-between" }}
//                   >
//                     <Text type="secondary">Invoice Type:</Text>
//                     <Tag
//                       color={invoice.type === "Standard" ? "blue" : "purple"}
//                     >
//                       {invoice.type || "Standard"}
//                     </Tag>
//                   </div>
//                   <div
//                     style={{ display: "flex", justifyContent: "space-between" }}
//                   >
//                     <Text type="secondary">Status:</Text>
//                     <Tag color={invoice.paid ? "success" : "warning"}>
//                       {invoice.paid ? "Paid" : "Pending"}
//                     </Tag>
//                   </div>
//                 </Space>
//               </Card>
//             </Col>
//           </Row>

//           {/* Items Table */}
//           <div style={{ marginTop: 32 }}>
//             <Card
//               title="ITEMS"
//               size="small"
//               style={{ borderRadius: "12px" }}
//               headStyle={{
//                 backgroundColor: "#fafafa",
//                 borderBottom: `2px solid ${primaryColor}`,
//                 fontSize: "14px",
//                 fontWeight: 600,
//               }}
//               bodyStyle={{ padding: 0 }}
//             >
//               <Table
//                 dataSource={invoice.items}
//                 columns={columns}
//                 pagination={false}
//                 rowKey={(record, index) => `${record.item}-${index}`}
//                 style={{ margin: 0 }}
//                 bordered={false}
//                 size="middle"
//                 rowClassName={() => "invoice-table-row"}
//               />
//             </Card>
//           </div>

//           {/* Totals Section */}
//           <Row justify="end" style={{ marginTop: 32 }}>
//             <Col xs={24} sm={12} md={8}>
//               <Card
//                 style={{
//                   borderRadius: "12px",
//                   border: `1px solid ${primaryColor}22`,
//                   backgroundColor: `${primaryColor}08`,
//                 }}
//                 bodyStyle={{ padding: 24 }}
//               >
//                 <Space direction="vertical" size={12} style={{ width: "100%" }}>
//                   <div
//                     style={{ display: "flex", justifyContent: "space-between" }}
//                   >
//                     <Text type="secondary">Subtotal:</Text>
//                     <Text strong>
//                       {invoice.currency} {subtotal.toFixed(2)}
//                     </Text>
//                   </div>

//                   {discount > 0 && (
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                       }}
//                     >
//                       <Text type="secondary">Discount:</Text>
//                       <Text strong style={{ color: "#ff4d4f" }}>
//                         -{invoice.currency} {discount.toFixed(2)}
//                       </Text>
//                     </div>
//                   )}

//                   {totalTax > 0 && (
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                       }}
//                     >
//                       <Text type="secondary">Tax:</Text>
//                       <Text strong>
//                         {invoice.currency} {totalTax.toFixed(2)}
//                       </Text>
//                     </div>
//                   )}

//                   <Divider
//                     style={{
//                       margin: "8px 0",
//                       borderColor: `${primaryColor}33`,
//                     }}
//                   />

//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       padding: "12px 16px",
//                       backgroundColor: `${primaryColor}0f`,
//                       borderRadius: "8px",
//                       border: `1px solid ${primaryColor}22`,
//                     }}
//                   >
//                     <Text strong style={{ fontSize: "18px" }}>
//                       Total Due:
//                     </Text>
//                     <Title
//                       level={3}
//                       style={{
//                         margin: 0,
//                         color: primaryColor,
//                       }}
//                     >
//                       {invoice.currency} {total.toFixed(2)}
//                     </Title>
//                   </div>
//                 </Space>
//               </Card>
//             </Col>
//           </Row>

//           {/* Notes Section */}
//           {invoice.notes && (
//             <div style={{ marginTop: 32 }}>
//               <Card
//                 title="NOTES & TERMS"
//                 size="small"
//                 style={{ borderRadius: "12px" }}
//                 headStyle={{
//                   backgroundColor: "#fafafa",
//                   borderBottom: `2px solid ${primaryColor}`,
//                   fontSize: "14px",
//                   fontWeight: 600,
//                 }}
//               >
//                 <div
//                   style={{
//                     backgroundColor: `${primaryColor}08`,
//                     padding: 16,
//                     borderRadius: 8,
//                     borderLeft: `4px solid ${primaryColor}`,
//                   }}
//                 >
//                   <Text style={{ fontSize: "14px", lineHeight: 1.6 }}>
//                     {invoice.notes}
//                   </Text>
//                 </div>
//               </Card>
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div
//           style={{
//             marginTop: 32,
//             padding: "32px 40px",
//             backgroundColor: "#fafafa",
//             borderTop: "1px solid #f0f0f0",
//             textAlign: "center",
//           }}
//         >
//           <Text type="secondary" style={{ fontSize: "14px", display: "block" }}>
//             Thank you for your business!
//           </Text>
//           <Text type="secondary" style={{ fontSize: "12px", marginTop: 8 }}>
//             Please contact us with any questions regarding this invoice.
//           </Text>
//           <div style={{ marginTop: 16 }}>
//             <Text type="secondary" style={{ fontSize: "11px" }}>
//               {settings?.general?.company_name || "Your Company"} •
//               {settings?.general?.company_phone || " (123) 456-7890"} •
//               {settings?.general?.company_email || " billing@company.com"}
//             </Text>
//           </div>
//         </div>
//       </Card>

//       {/* Style for print and table rows */}
//       <style jsx global>{`
//         @media print {
//           body * {
//             visibility: hidden;
//           }
//           #invoice,
//           #invoice * {
//             visibility: visible;
//           }
//           #invoice {
//             position: absolute;
//             left: 0;
//             top: 0;
//             width: 100%;
//             box-shadow: none !important;
//             margin: 0 !important;
//             padding: 0 !important;
//           }
//           .no-print {
//             display: none !important;
//           }
//         }

//         .invoice-table-row:hover td {
//           background-color: ${primaryColor}08 !important;
//         }

//         .ant-table-thead > tr > th {
//           background-color: #fafafa !important;
//           font-weight: 600 !important;
//           border-bottom: 2px solid ${primaryColor} !important;
//         }
//       `}</style>
//     </div>
//   );
// }
