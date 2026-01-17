// "use client";

// import { useEffect, useState } from "react";
// import MainLayout from "@/components/layout/MainLayout";
// import {
//   Space,
//   Typography,
//   Card,
//   Table,
//   Dropdown,
//   Button,
//   MenuProps,
// } from "antd";
// const { Title } = Typography;
// import {
//   SettingOutlined,
//   MoreOutlined,
//   EyeOutlined,
//   EditOutlined,
//   DeleteOutlined,
// } from "@ant-design/icons";

// import type { ColumnsType } from "antd/es/table";
// import { useRouter } from "next/navigation";

// export default function InvoiceproInvoicesPage() {
//   const router = useRouter();

//   const [invoices, setInvoices] = useState<any[]>([]);

//   useEffect(() => {
//     const storedInvoices = JSON.parse(localStorage.getItem("invoices") || "[]");
//     setInvoices(storedInvoices);
//   }, []);

//   const deleteInvoice = (invoice_number: string) => {
//     const updated = invoices.filter(
//       (inv) => inv.invoice_number !== invoice_number
//     );
//     setInvoices(updated);
//     localStorage.setItem("invoices", JSON.stringify(updated));
//   };

//   const getMenuItems = (record: any): MenuProps["items"] => [
//     {
//       key: "view",
//       icon: <EyeOutlined />,
//       label: "View",
//       onClick: () => {
//         router.push(`/invoicepro/invoices/view/${record.invoice_number}`);
//       },
//     },

//     {
//       key: "edit",
//       icon: <EditOutlined />,
//       label: "Edit",
//       onClick: () => {
//         console.log("EDIT CLICKED", record.invoice_number);
//         router.push(`/invoicepro/newinvoice?edit=${record.invoice_number}`);
//       },
//     },
//     {
//       type: "divider" as const,
//     },
//     {
//       key: "delete",
//       icon: <DeleteOutlined />,
//       label: "Delete",
//       danger: true,
//       onClick: () => deleteInvoice(record.invoice_number),
//     },
//   ];

//   const columns: ColumnsType<any> = [
//     {
//       title: "Invoice No",
//       dataIndex: "invoice_number",
//       key: "invoice_number",
//     },
//     {
//       title: "Customer",
//       key: "customer",
//       render: (_text: any, record: any) => {
//         const customer = record.customer_snapshot; // 👈 from localStorage invoice

//         return (
//           <div>
//             <div className="font-medium">{customer?.name || "Unknown"}</div>
//             <div className="text-xs text-gray-500">
//               {customer?.email || "-"}
//             </div>
//           </div>
//         );
//       },
//     },

//     {
//       title: "Date",
//       dataIndex: "invoice_date",
//       key: "invoice_date",
//       render: (date: string) => {
//         if (!date) return "-";
//         return new Date(date).toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "short",
//           day: "numeric",
//         });
//       },
//     },
//     {
//       title: "Due Date",
//       dataIndex: "due_date",
//       key: "due_date",
//       render: (date: string) => {
//         if (!date) return "-";
//         return new Date(date).toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "short",
//           day: "numeric",
//         });
//       },
//     },
//     {
//       title: "Amount",
//       dataIndex: "items",
//       key: "amount",
//       render: (items: any[]) => {
//         const subtotal =
//           items?.reduce((sum, i) => sum + (i.qty || 0) * (i.price || 0), 0) ||
//           0;
//         const taxTotal =
//           items?.reduce((sum, i) => {
//             const line = (i.qty || 0) * (i.price || 0);
//             return sum + (line * (i.tax || 0)) / 100;
//           }, 0) || 0;
//         return `$ ${(subtotal + taxTotal).toFixed(2)}`;
//       },
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//       render: (status: string) => {
//         const color = status === "submitted" ? "green" : "orange";
//         return <span style={{ color }}>{status}</span>;
//       },
//     },
//     {
//       title: "Payment",
//       key: "payment",
//       render: (_text: any, record: any) => {
//         const subtotal =
//           record.items?.reduce(
//             (sum: number, i: any) => sum + (i.qty || 0) * (i.price || 0),
//             0
//           ) || 0;
//         const taxTotal =
//           record.items?.reduce((sum: number, i: any) => {
//             const line = (i.qty || 0) * (i.price || 0);
//             return sum + (line * (i.tax || 0)) / 100;
//           }, 0) || 0;
//         const total = subtotal + taxTotal;
//         const paid = record.paid || 0;
//         const balanceDue = total - paid;
//         return `$ ${balanceDue.toFixed(2)}`;
//       },
//     },
//     {
//       title: "",
//       key: "actions",
//       align: "center",
//       render: (_: any, record: any) => (
//         <Dropdown trigger={["click"]} menu={{ items: getMenuItems(record) }}>
//           <Button
//             type="text"
//             icon={<MoreOutlined />}
//             onClick={(e) => e.stopPropagation()}
//           />
//         </Dropdown>
//       ),
//     },
//   ];

//   return (
//     <MainLayout>
//       <div style={{ padding: 20 }}>
//         <div style={{ marginBottom: 20 }}>
//           <Space align="center">
//             <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
//             <Title level={3} style={{ margin: 0 }}>
//               Invoice
//             </Title>
//           </Space>

//           <div className="mt-5">
//             {invoices.length === 0 ? (
//               <Card>No invoices found. Create a new invoice first.</Card>
//             ) : (
//               <Card className="rounded-xl shadow-md border border-gray-200">
//                 <Table
//                   dataSource={invoices.map((inv, idx) => ({
//                     ...inv,
//                     key: idx,
//                   }))}
//                   columns={columns}
//                   pagination={{ pageSize: 5 }}
//                 />
//               </Card>
//             )}
//           </div>
//         </div>
//       </div>
//     </MainLayout>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Space, Typography, Card, Table, Dropdown, Button, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  SettingOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  DownloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { downloadInvoicePDF } from "./InvoiceDownloadButton";

const { Title } = Typography;

export default function InvoiceproInvoicesPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [invoice_page_descriptions, setInvoicePageDescriptions] = useState<any>(
    {}
  );

  const [settings, setSettings] = useState<any>(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem("invoice_settings") || "null");
    setSettings(s);
  }, []);

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("invoice_page_descriptions") || "{}"
    );
    setInvoicePageDescriptions(stored);
  }, []);

  /* ================= LOAD INVOICES ================= */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("invoices") || "[]");
    setInvoices(stored);
  }, []);

  /* ================= DELETE SINGLE ================= */
  const deleteInvoice = (invoice_number: string) => {
    const updated = invoices.filter(
      (inv) => inv.invoice_number !== invoice_number
    );
    setInvoices(updated);
    localStorage.setItem("invoices", JSON.stringify(updated));
  };

  /* ================= BULK DELETE ================= */
  const bulkDelete = () => {
    const remaining = invoices.filter(
      (inv) =>
        !selectedInvoices.some(
          (sel) => sel.invoice_number === inv.invoice_number
        )
    );

    setInvoices(remaining);
    localStorage.setItem("invoices", JSON.stringify(remaining));
    setSelectedRowKeys([]);
    setSelectedInvoices([]);
  };

  /* ================= ACTION MENU ================= */
  const getMenuItems = (record: any): MenuProps["items"] => [
    {
      key: "view",
      icon: <EyeOutlined />,
      label: "View",
      onClick: () =>
        router.push(`/invoicepro/invoices/view/${record.invoice_number}`),
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit",
      onClick: () =>
        router.push(`/invoicepro/newinvoice?edit=${record.invoice_number}`),
    },
    { type: "divider" },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Delete",
      danger: true,
      onClick: () => deleteInvoice(record.invoice_number),
    },
  ];

  /* ================= TABLE COLUMNS ================= */
  const columns: ColumnsType<any> = [
    {
      title: "Invoice No",
      dataIndex: "invoice_number",
      key: "invoice_number",
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => {
        const customer = record.customer_snapshot;
        return (
          <div>
            <div className="font-medium">{customer?.name || "Unknown"}</div>
            <div className="text-xs text-gray-500">
              {customer?.email || "-"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "invoice_date",
      render: (date: string) =>
        date
          ? new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-",
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      render: (date: string) =>
        date
          ? new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-",
    },
    {
      title: "Amount",
      dataIndex: "items",
      render: (items: any[]) => {
        const subtotal =
          items?.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0) || 0;
        const tax =
          items?.reduce((s, i) => {
            const line = (i.qty || 0) * (i.price || 0);
            return s + (line * (i.tax || 0)) / 100;
          }, 0) || 0;
        return `$ ${(subtotal + tax).toFixed(2)}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => (
        <span style={{ color: status === "submitted" ? "green" : "orange" }}>
          {status}
        </span>
      ),
    },
    {
      title: "Payment Due",
      render: (_, record) => {
        const subtotal =
          record.items?.reduce(
            (s: number, i: any) => s + (i.qty || 0) * (i.price || 0),
            0
          ) || 0;
        const tax =
          record.items?.reduce((s: number, i: any) => {
            const line = (i.qty || 0) * (i.price || 0);
            return s + (line * (i.tax || 0)) / 100;
          }, 0) || 0;
        const total = subtotal + tax;
        const paid = record.paid || 0;
        return `$ ${(total - paid).toFixed(2)}`;
      },
    },
    {
      title: "",
      align: "center",
      render: (_, record) => (
        <Dropdown trigger={["click"]} menu={{ items: getMenuItems(record) }}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  /* ================= ROW SELECTION ================= */
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[], rows: any[]) => {
      setSelectedRowKeys(keys);
      setSelectedInvoices(rows);
    },
  };

  /* ================= search ================= */
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchText) return true;

    const q = searchText.toLowerCase();

    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_snapshot?.name?.toLowerCase().includes(q) ||
      inv.customer_snapshot?.email?.toLowerCase().includes(q)
    );
  });

  /* ================= RENDER ================= */
  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        <Space align="center">
          <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
          <Title level={3} style={{ margin: 0 }}>
            Invoice
          </Title>
        </Space>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            padding: "8px 12px",
            background: "#fff",
            borderRadius: 6,
            border: "1px solid #f0f0f0",
            marginTop: 4,
          }}
        >
          <Input.Search
            placeholder="Search by invoice number or customer..."
            allowClear
            size="large"
            style={{ flex: 1, minWidth: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => router.push("/invoicepro/newinvoice")}
          >
            New Invoice
          </Button>
        </div>

        <div className="mt-5">
          {invoices.length === 0 ? (
            <Card>No invoices found. Create a new invoice first.</Card>
          ) : (
            <Card className="rounded-xl shadow-md border border-gray-200">
              {/* ===== BULK ACTION BAR ===== */}
              {selectedRowKeys.length > 0 && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "10px 14px",
                    background: "#f0f5ff",
                    borderRadius: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>{selectedRowKeys.length} invoice(s) selected</strong>

                  <Space>
                    <Button icon={<MailOutlined />}>Send Mail</Button>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={async () => {
                        if (!settings) return;

                        for (const invoice of selectedInvoices) {
                          await downloadInvoicePDF(
                            invoice,
                            settings,
                            invoice_page_descriptions
                          );
                          await new Promise((r) => setTimeout(r, 300)); // browser-safe
                        }
                      }}
                    >
                      Download
                    </Button>

                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={bulkDelete}
                    >
                      Delete
                    </Button>
                  </Space>
                </div>
              )}

              {/* ===== TABLE ===== */}
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={filteredInvoices.map((inv) => ({
                  ...inv,
                  key: inv.invoice_number,
                }))}
                pagination={{ pageSize: 5 }}
              />
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
