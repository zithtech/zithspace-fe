"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Space,
  Typography,
  Card,
  Table,
  Dropdown,
  Button,
  MenuProps,
} from "antd";
const { Title } = Typography;
import {
  SettingOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

export default function InvoiceproInvoicesPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const storedInvoices = JSON.parse(localStorage.getItem("invoices") || "[]");
    setInvoices(storedInvoices);
  }, []);

  const deleteInvoice = (invoice_number: string) => {
    const updated = invoices.filter(
      (inv) => inv.invoice_number !== invoice_number
    );
    setInvoices(updated);
    localStorage.setItem("invoices", JSON.stringify(updated));
  };

  const getMenuItems = (record: any): MenuProps["items"] => [
    {
      key: "view",
      icon: <EyeOutlined />,
      label: "View",
      onClick: () => {
        router.push(`/invoicepro/invoices/view/${record.invoice_number}`);
      },
    },

    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit",
      onClick: () => {
        console.log("EDIT CLICKED", record.invoice_number);
        router.push(`/invoicepro/newinvoice?edit=${record.invoice_number}`);
      },
    },
    {
      type: "divider" as const,
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Delete",
      danger: true,
      onClick: () => deleteInvoice(record.invoice_number),
    },
  ];

  const columns: ColumnsType<any> = [
    {
      title: "Invoice No",
      dataIndex: "invoice_number",
      key: "invoice_number",
    },
    {
      title: "Customer",
      key: "customer",
      render: (_text: any, record: any) => {
        const customer = record.customer_snapshot; // 👈 from localStorage invoice

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
      key: "invoice_date",
      render: (date: string) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (date: string) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
    {
      title: "Amount",
      dataIndex: "items",
      key: "amount",
      render: (items: any[]) => {
        const subtotal =
          items?.reduce((sum, i) => sum + (i.qty || 0) * (i.price || 0), 0) ||
          0;
        const taxTotal =
          items?.reduce((sum, i) => {
            const line = (i.qty || 0) * (i.price || 0);
            return sum + (line * (i.tax || 0)) / 100;
          }, 0) || 0;
        return `$ ${(subtotal + taxTotal).toFixed(2)}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color = status === "submitted" ? "green" : "orange";
        return <span style={{ color }}>{status}</span>;
      },
    },
    {
      title: "Payment",
      key: "payment",
      render: (_text: any, record: any) => {
        const subtotal =
          record.items?.reduce(
            (sum: number, i: any) => sum + (i.qty || 0) * (i.price || 0),
            0
          ) || 0;
        const taxTotal =
          record.items?.reduce((sum: number, i: any) => {
            const line = (i.qty || 0) * (i.price || 0);
            return sum + (line * (i.tax || 0)) / 100;
          }, 0) || 0;
        const total = subtotal + taxTotal;
        const paid = record.paid || 0;
        const balanceDue = total - paid;
        return `$ ${balanceDue.toFixed(2)}`;
      },
    },
    {
      title: "",
      key: "actions",
      align: "center",
      render: (_: any, record: any) => (
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

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <Space align="center">
            <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
            <Title level={3} style={{ margin: 0 }}>
              Invoice
            </Title>
          </Space>

          <div className="mt-5">
            {invoices.length === 0 ? (
              <Card>No invoices found. Create a new invoice first.</Card>
            ) : (
              <Card className="rounded-xl shadow-md border border-gray-200">
                <Table
                  dataSource={invoices.map((inv, idx) => ({
                    ...inv,
                    key: idx,
                  }))}
                  columns={columns}
                  pagination={{ pageSize: 5 }}
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
