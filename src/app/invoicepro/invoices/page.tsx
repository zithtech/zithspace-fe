"use client";

import {  useState } from "react";
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
import { useInvoices, useDeleteInvoice } from "@/hooks/useInvoices";

const { Title } = Typography;

export default function InvoiceproInvoicesPage() {
  const router = useRouter();

 
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [invoice_page_descriptions, setInvoicePageDescriptions] = useState<any>(
    {},
  );


const {
  data,
  isLoading,
  isError,
} = useInvoices();

const invoices = data?.data ?? [];
const deleteMutation = useDeleteInvoice();

  const [settings, setSettings] = useState<any>(null);
  const [searchText, setSearchText] = useState("");



  /* ================= DELETE SINGLE ================= */

  const deleteInvoice = (id: string) => {
  deleteMutation.mutate(id);
};
  /* ================= BULK DELETE ================= */


  const bulkDelete = async () => {
  for (const inv of selectedInvoices) {
    deleteMutation.mutate(inv.id);
  }
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
        router.push(`/invoicepro/invoices/view/${record.invoiceNumber}`),

    },
 {
  key: "edit",
  icon: <EditOutlined />,
  label: "Edit",
  onClick: () =>
    // Use record.id instead of record.invoice_number if your form needs the DB ID to save
    router.push(`/invoicepro/newinvoice?edit=${record.id}`),
},
    { type: "divider" },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Delete",
      danger: true,
      onClick: () => deleteInvoice(record.id),
    },
  ];

  /* ================= TABLE COLUMNS ================= */
  const columns: ColumnsType<any> = [
    {
      title: "Invoice No",
      dataIndex: "invoiceNumber",
      key: "invoice_number",
    },
  
    {
  title: "Customer",
  key: "customer",
  render: (_, record) => {
    // Accessing the camelCase property from your API response
    const snapshot = record.customerSnapshot as any;; 
    
    return (
      <div>
        <div className="font-medium">
          {snapshot?.companyName || record.customer?.companyName || "Unknown"}
        </div>
        <div className="text-xs text-gray-500">
          {snapshot?.email || record.customer?.email || ""}
        </div>
      </div>
    );
  },
},
    {
      title: "Date",
      dataIndex: "invoiceDate",
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
      dataIndex: "dueDate",
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
  dataIndex: "total",
  render: (v) => `$ ${Number(v).toFixed(2)}`
}
    ,
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
  dataIndex: "balanceDue",
  render: (v) => `$ ${Number(v).toFixed(2)}`
}

 
    ,
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

  // Cast the snapshot to 'any' or your CustomerDraft interface to access properties
  const snapshot = inv.customerSnapshot as any;

  return (
    inv.invoiceNumber?.toLowerCase().includes(q) ||
    // Search in snapshot using the casted variable
    snapshot?.companyName?.toLowerCase().includes(q) ||
    snapshot?.email?.toLowerCase().includes(q) ||
    // Search in live relation (fallback)
    inv.customer?.companyName?.toLowerCase().includes(q) ||
    inv.customer?.email?.toLowerCase().includes(q)
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
                            invoice_page_descriptions,
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
    key: inv.id,
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
