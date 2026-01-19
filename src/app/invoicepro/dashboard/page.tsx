"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, Row, Col, Typography, Table, Tag, Button } from "antd";
import {
  FileTextOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Column } from "@ant-design/plots";
import { Calendar, Badge } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { Title, Text } = Typography;

export default function DashboardPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("invoices") || "[]");
    setInvoices(stored);
  }, []);

  /* ================= CALCULATE METRICS ================= */
  const totalInvoices = invoices.length;

  const totalRevenue = invoices.reduce((sum, inv) => {
    const subtotal =
      inv.items?.reduce(
        (s: number, i: any) => s + (i.qty || 0) * (i.price || 0),
        0,
      ) || 0;
    const tax =
      inv.items?.reduce((s: number, i: any) => {
        const line = (i.qty || 0) * (i.price || 0);
        return s + (line * (i.tax || 0)) / 100;
      }, 0) || 0;
    return sum + subtotal + tax;
  }, 0);

  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);

  const pendingAmount = totalRevenue - totalPaid;

  const now = new Date();
  const overdueAmount = invoices
    .filter(
      (inv) =>
        new Date(inv.due_date) < now &&
        (inv.paid || 0) <
          (inv.items?.reduce(
            (s: number, i: any) => s + (i.qty || 0) * (i.price || 0),
            0,
          ) || 0),
    )
    .reduce((sum, inv) => {
      const subtotal =
        inv.items?.reduce(
          (s: number, i: any) => s + (i.qty || 0) * (i.price || 0),
          0,
        ) || 0;
      const tax =
        inv.items?.reduce((s: number, i: any) => {
          const line = (i.qty || 0) * (i.price || 0);
          return s + (line * (i.tax || 0)) / 100;
        }, 0) || 0;
      const total = subtotal + tax;
      const balance = total - (inv.paid || 0);
      return sum + balance;
    }, 0);

  /* ================= CALENDAR DATA ================= */
  const calendarMap: Record<string, { created: number; received: number }> = {};

  invoices.forEach((inv) => {
    // 1️⃣ Invoice CREATED
    if (inv.invoice_date) {
      const createdKey = new Date(inv.invoice_date).toISOString().split("T")[0];

      if (!calendarMap[createdKey]) {
        calendarMap[createdKey] = { created: 0, received: 0 };
      }

      calendarMap[createdKey].created += 1;
    }

    // 2️⃣ Invoice RECEIVED (temporary logic)
    if (inv.paid > 0 && inv.invoice_date) {
      const paidKey = new Date(inv.invoice_date).toISOString().split("T")[0];

      if (!calendarMap[paidKey]) {
        calendarMap[paidKey] = { created: 0, received: 0 };
      }

      calendarMap[paidKey].received += 1;
    }
  });

  /* ================= ATTRACTIVE METRIC CARDS ================= */
  const renderCard = (
    icon: any,
    title: string,
    value: string,
    color: string,
  ) => (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        padding: "16px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: "100%",
        minHeight: "90px",
        border: "none",
        background: `linear-gradient(135deg, ${color}10, ${color}05)`,
        position: "relative",
        overflow: "hidden",
      }}
      styles={{
        body: {
          padding: 0,
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
        },
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          backgroundColor: color,
        }}
      />

      {/* Icon */}
      <div
        style={{
          fontSize: 20,
          color: color,
          background: `${color}15`,
          padding: "10px",
          borderRadius: "10px",
          marginLeft: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            color: "#666",
            fontSize: "13px",
            fontWeight: 500,
            display: "block",
            marginBottom: "2px",
          }}
        >
          {title}
        </Text>
        <Title
          level={3}
          style={{
            margin: 0,
            color: "#1f1f1f",
            fontSize: "20px",
            fontWeight: 600,
            lineHeight: "1.2",
          }}
        >
          {value}
        </Title>
      </div>
    </Card>
  );

  /* ================= RECENT INVOICES TABLE ================= */
  const statusColors: Record<string, string> = {
    submitted: "#52c41a",
    pending: "#faad14",
    draft: "#8c8c8c",
    overdue: "#f5222d",
  };

  /* ================= MONTHLY REVENUE ================= */
  const monthlyRevenueMap: Record<string, number> = {};

  invoices.forEach((inv) => {
    if (!inv.invoice_date) return;

    const date = new Date(inv.invoice_date);
    const month = date.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });

    const subtotal =
      inv.items?.reduce(
        (s: number, i: any) => s + (i.qty || 0) * (i.price || 0),
        0,
      ) || 0;

    const tax =
      inv.items?.reduce((s: number, i: any) => {
        const line = (i.qty || 0) * (i.price || 0);
        return s + (line * (i.tax || 0)) / 100;
      }, 0) || 0;

    monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + subtotal + tax;
  });

  const monthlyRevenueData = Object.entries(monthlyRevenueMap).map(
    ([month, revenue]) => ({
      month,
      revenue,
    }),
  );

  const monthlyRevenueConfig = {
    data: monthlyRevenueData,
    xField: "month",
    yField: "revenue",

    color: "#1890ff",

    /* 🔽 IMPORTANT SIZE CONTROLS */
    columnWidthRatio: 0.35, // narrower bars (default ~0.6)
    maxColumnWidth: 32, // hard limit so bars never get too wide

    radius: [6, 6, 0, 0],

    xAxis: {
      label: {
        autoRotate: false,
        style: {
          fontSize: 12,
          fill: "#595959",
        },
      },
    },

    yAxis: {
      label: {
        formatter: (v: string) => `$${Number(v).toFixed(0)}`,
        style: {
          fill: "#8c8c8c",
        },
      },
      grid: {
        line: {
          style: {
            stroke: "#f0f0f0",
            lineDash: [4, 4],
          },
        },
      },
    },

    tooltip: {
      formatter: (datum: any) => ({
        name: "Revenue",
        value: `$${datum.revenue.toFixed(2)}`,
      }),
    },

    animation: {
      appear: {
        animation: "scale-in-y",
        duration: 500,
      },
    },
  };

  const columns = [
    {
      title: "INVOICE",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (text: string) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong style={{ color: "#1890ff", fontSize: "14px" }}>
            #{text}
          </Text>
        </div>
      ),
    },
    {
      title: "CUSTOMER",
      dataIndex: ["customer_snapshot", "name"],
      key: "customer",
      render: (name: string) => (
        <Text style={{ fontWeight: 500, color: "#434343" }}>
          {name || "N/A"}
        </Text>
      ),
    },
    {
      title: "DATE",
      dataIndex: "invoice_date",
      key: "invoice_date",
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: "13px" }}>
          {new Date(date).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>
      ),
    },
    {
      title: "AMOUNT",
      key: "amount",
      align: "right" as const,
      render: (_: any, record: any) => {
        const subtotal =
          record.items?.reduce(
            (s: number, i: any) => s + (i.qty || 0) * (i.price || 0),
            0,
          ) || 0;
        const tax =
          record.items?.reduce(
            (s: number, i: any) =>
              s + ((i.qty || 0) * (i.price || 0) * (i.tax || 0)) / 100,
            0,
          ) || 0;
        return (
          <Text strong style={{ fontSize: "15px" }}>
            $
            {(subtotal + tax).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        );
      },
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (status: string | undefined) => {
        const s = status?.toLowerCase() || "draft";
        return (
          <Tag
            bordered={false}
            style={{
              borderRadius: "6px",
              padding: "2px 10px",
              fontWeight: 600,
              fontSize: "11px",
              textTransform: "uppercase",
              backgroundColor: `${statusColors[s]}15`, // Light background
              color: statusColors[s],
              border: `1px solid ${statusColors[s]}30`,
            }}
          >
            {s}
          </Tag>
        );
      },
    },
  ];

  const currentMonth = dayjs(); // today

  const fullCellRender = (value: Dayjs) => {
    if (!value.isSame(currentMonth, "month")) {
      return <div style={{ height: "100%" }} />;
    }

    const dateKey = value.format("YYYY-MM-DD");
    const data = calendarMap[dateKey];

    return (
      <div
        style={{
          height: "100%",
          padding: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 2,
        }}
      >
        {/* Date */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#1f1f1f",
          }}
        >
          {value.date()}
        </div>

        {/* Compact indicators */}
        {data && (
          <div
            style={{
              display: "flex",
              gap: 4,
              marginTop: 2,
            }}
          >
            {data.created > 0 && (
              <div
                title={`${data.created} invoices created`}
                style={{
                  minWidth: 16,
                  height: 14,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "#1890ff",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {data.created}
              </div>
            )}

            {data.received > 0 && (
              <div
                title={`${data.received} invoices received`}
                style={{
                  minWidth: 16,
                  height: 14,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "#52c41a",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {data.received}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const monthStart = currentMonth.startOf("month");
  const monthEnd = currentMonth.endOf("month");

  let monthlyCreated = 0;
  let monthlyReceived = 0;

  Object.entries(calendarMap).forEach(([date, data]) => {
    const d = dayjs(date);
    if (d.isBetween(monthStart, monthEnd, "day", "[]")) {
      monthlyCreated += data.created;
      monthlyReceived += data.received;
    }
  });

  return (
    <MainLayout>
      <div style={{ padding: "20px 24px" }}>
        {/* ================= HEADER ================= */}
        <div style={{ marginBottom: 24 }}>
          <Title
            level={2}
            style={{ margin: 0, color: "#1f1f1f", fontWeight: 600 }}
          >
            Dashboard
          </Title>
          <Text type="secondary" style={{ fontSize: "14px" }}>
            Overview of your invoicing and revenue
          </Text>
        </div>

        {/* ================= METRIC CARDS ================= */}
        <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
          <Col xs={24} sm={12} md={6}>
            {renderCard(
              <FileTextOutlined />,
              "Total Invoices",
              `${totalInvoices}`,
              "#1890ff",
            )}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderCard(
              <DollarOutlined />,
              "Total Revenue",
              `$${totalRevenue.toFixed(2)}`,
              "#52c41a",
            )}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderCard(
              <ExclamationCircleOutlined />,
              "Pending Amount",
              `$${pendingAmount.toFixed(2)}`,
              "#faad14",
            )}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderCard(
              <ClockCircleOutlined />,
              "Overdue Amount",
              `$${overdueAmount.toFixed(2)}`,
              "#f5222d",
            )}
          </Col>
        </Row>

        {/* ================= CHART + CALENDAR (SAME LINE) ================= */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Monthly Revenue */}
          <Col xs={24} md={12}>
            <Card
              title={<span style={{ fontSize: 14 }}>Monthly Revenue</span>}
              style={{ borderRadius: 12, height: "100%" }}
              styles={{
                header: { padding: "10px 16px" },
                body: { padding: "8px 12px" },
              }}
            >
              <div style={{ height: 250, overflow: "hidden" }}>
                {monthlyRevenueData.length ? (
                  <Column {...monthlyRevenueConfig} />
                ) : (
                  <Text type="secondary">No data</Text>
                )}
              </div>
            </Card>
          </Col>

          {/* Invoice Calendar */}
          <Col xs={24} md={12}>
            <Card
              title={
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    Invoice Calendar
                  </span>

                  <div style={{ display: "flex", gap: 12 }}>
                    <span
                      style={{
                        fontSize: 12,
                        background: "#1890ff15",
                        color: "#1890ff",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontWeight: 600,
                      }}
                    >
                      Created: {monthlyCreated}
                    </span>

                    <span
                      style={{
                        fontSize: 12,
                        background: "#52c41a15",
                        color: "#52c41a",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontWeight: 600,
                      }}
                    >
                      Received: {monthlyReceived}
                    </span>
                  </div>
                </div>
              }
              style={{ borderRadius: 12, height: "100%" }}
              styles={{
                header: { padding: "12px 16px" },
                body: { padding: "12px" },
              }}
            >
              <Calendar
                fullscreen={false}
                //cellRender={dateCellRender}
                fullCellRender={fullCellRender}
                //headerRender={() => null}
                //validRange={[dayjs().startOf("month"), dayjs().endOf("month")]}
                style={{ borderRadius: 12 }}
              />
            </Card>
          </Col>
        </Row>

        {/* ================= RECENT INVOICES TABLE ================= */}
        <Card
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {/* Left: Icon + Title */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FileTextOutlined style={{ color: "#1890ff", fontSize: 16 }} />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 16,
                    color: "#1f1f1f",
                  }}
                >
                  Recent Invoices
                </span>
              </div>

              {/* Right: Actions */}
              <div style={{ display: "flex", gap: "10px" }}>
                <Button
                  type="primary"
                  style={{
                    fontWeight: 500,
                    borderRadius: 8,
                  }}
                  onClick={() => router.push("/invoicepro/newinvoice")}
                >
                  New Invoice
                </Button>

                <Button
                  style={{
                    fontWeight: 500,
                    borderRadius: 8,
                  }}
                  onClick={() => router.push("/invoicepro/invoices")}
                >
                  View All
                </Button>
              </div>
            </div>
          }
          style={{
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid #f0f0f0",
          }}
          styles={{
            header: {
              borderBottom: "1px solid #f0f0f0",
              padding: "16px 20px",
              fontSize: "16px",
            },
            body: {
              padding: "16px",
            },
          }}
        >
          <Table
            columns={columns}
            dataSource={invoices
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.invoice_date).getTime() -
                  new Date(a.invoice_date).getTime(),
              )
              .slice(0, 5)}
            rowKey="invoice_number"
            pagination={false}
            style={{ marginTop: "8px" }}
            scroll={{ x: "max-content" }}
            components={{
              header: {
                cell: (props: any) => (
                  <th
                    {...props}
                    style={{
                      ...props.style,
                      background: "#fafafa",
                      color: "#8c8c8c",
                      fontSize: "11px",
                      fontWeight: 700,
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  />
                ),
              },
            }}
            onRow={() => ({
              style: { cursor: "pointer" },
            })}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
