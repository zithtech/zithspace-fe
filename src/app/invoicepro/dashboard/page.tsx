



"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, Row, Col, Typography, Table, Tag, Button,Spin ,Skeleton} from "antd";
import {
  FileTextOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";

import { Line } from "@ant-design/plots";
import { Tooltip } from "antd";

import { Calendar, Badge } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useInvoices } from "@/hooks/useInvoices";
import type { ColumnsType } from "antd/es/table";



import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { Title, Text } = Typography;

export default function DashboardPage() {
  const router = useRouter();
  const { canReadInvoice, canCreateInvoice } = usePermission();
  const { isLoading: authLoading } = useAuth();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadInvoice) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadInvoice, router]);

  const [currentMonth, setCurrentMonth] = useState(dayjs());



  const { data, isLoading } = useInvoices({
  page: 1,
  limit: 100, // dashboard needs summary data
});

const invoices = data?.data ?? [];


  /* ================= CALCULATE METRICS ================= */
  const totalInvoices = invoices.length;




  const totalRevenue = invoices.reduce(
  (sum, inv) => sum + Number(inv.grandTotal || (inv as any).total || 0),
  0
);

  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);



  const pendingAmount = invoices.reduce(
  (sum, inv) => sum + Number(inv.balanceDue || 0),
  0
);





  const now = new Date();

const overdueAmount = invoices
  .filter(
    (inv) =>
      new Date(inv.dueDate) < now &&
      Number(inv.balanceDue || 0) > 0
  )
  .reduce(
    (sum, inv) => sum + Number(inv.balanceDue || 0),
    0
  );


  /* ================= CALENDAR DATA ================= */
  const calendarMap: Record<string, { created: number; received: number }> = {};

  invoices.forEach((inv) => {
    // 1️⃣ Invoice CREATED
    if (inv.invoiceDate) {
      const createdKey = new Date(inv.invoiceDate).toISOString().split("T")[0];

      if (!calendarMap[createdKey]) {
        calendarMap[createdKey] = { created: 0, received: 0 };
      }

      calendarMap[createdKey].created += 1;
    }

    // 2️⃣ Invoice RECEIVED (temporary logic)
    if (inv.paidAmount > 0 && inv.invoiceDate) {
      const paidKey = new Date(inv.invoiceDate).toISOString().split("T")[0];

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
    border: "1px solid #f0f0f0",
    background: "#ffffff", 
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
      

      {/* Icon */}
      <div
        style={{
    fontSize: 20,
    color: "#ffffff",          
    background: color,         
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






/* ================= CURRENT YEAR REVENUE (MONTH WISE) ================= */

const currentYear = dayjs().year();
const yearlyRevenueMap: Record<string, number> = {};

// collect revenue month-wise for CURRENT YEAR
invoices.forEach((inv) => {
  if (!inv.invoiceDate) return;

  const d = dayjs(inv.invoiceDate);
  if (d.year() !== currentYear) return;

  const month = d.format("MMM"); // Jan, Feb, Mar...
  yearlyRevenueMap[month] =
    (yearlyRevenueMap[month] || 0) + Number(inv.grandTotal || (inv as any).total || 0);
});

// ensure all 12 months appear (even if 0)
const months = Array.from({ length: 12 }).map((_, i) =>
  dayjs().month(i).format("MMM")
);

const yearlyRevenueData = months.map((month) => ({
  month,
  revenue: yearlyRevenueMap[month] || 0,
}));

const monthlyRevenueConfig = {
  data: yearlyRevenueData,
  xField: "month",
  yField: "revenue",
  smooth: true,
  color: "#2f6df6",
  lineStyle: { lineWidth: 3 },
  point: {
    size: 4,
    style: {
      fill: "#fff",
      stroke: "#2f6df6",
      lineWidth: 2,
    },
  },
  area: {
    style: {
      fill: "l(270) 0:rgba(47,109,246,0.25) 1:rgba(47,109,246,0.05)",
    },
  },
  yAxis: {
    label: {
      formatter: (v: string) => `$${Number(v).toFixed(0)}`,
    },
  },
};







const columns: ColumnsType<any> = [
  {
    title: "Invoice No",
    dataIndex: "invoiceNumber",
    key: "invoice_number",
    width: 120,
    className: "font-mono px-4",
    render: (value) => (
      <div className="font-medium text-gray-900 tracking-tight">
        {value || "-"}
      </div>
    ),
  },
{
  title: "Customer",
  key: "customer",
  // Removed fixed width to let it grow/shrink, or use a smaller minWidth
  width: 200, 
  className: "px-4", 
  render: (_, record) => {
    const snapshot = record.customerSnapshot;
    const companyName = snapshot?.companyName || record.customer?.companyName;
    
    return (
      // Removed pr-4 to keep content closer to the next column border
      <div className="truncate max-w-[180px]"> 
        <div className="font-semibold text-gray-900 truncate">
          {companyName || "Unknown Customer"}
        </div>
      </div>
    );
  },
},
{
  title: "Invoice Date",
  dataIndex: "invoiceDate",
  width: 110, // Slightly reduced
  align: "left", // Changed from center to left to keep it closer to the Customer text
  className: "px-2", 
  render: (date: string) => (
    <div className="text-gray-700 font-medium whitespace-nowrap">
      {date
        ? new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "-"}
    </div>
  ),
},
  {
    title: "Due Date",
    dataIndex: "dueDate",
    width: 140, // Slightly wider
    align: "center" as const,
    className: "px-4",
    render: (date: string) => {
      const today = new Date();
      const dueDate = new Date(date);
      const isPastDue = dueDate < today;
      
      return (
        <div className={`font-medium ${isPastDue ? 'text-red-600' : 'text-gray-700'}`}>
          {date
            ? new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "-"}
          {isPastDue && date && (
            <div className="text-xs text-red-500 font-normal">Past due</div>
          )}
        </div>
      );
    },
  },
  {
    title: "Amount",
    dataIndex: "grandTotal",
    width: 130,
    align: "right" as const,
    className: "px-4",
    render: (v, record) => (
      <div className="font-bold text-gray-900">
        $ {Number(v || record.total || 0).toFixed(2)}
      </div>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 140,
    align: "center" as const,
    className: "px-4",
    render: (status: string) => {
      const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
        submitted: { color: "text-green-700", bg: "bg-green-100", label: "Submitted" },
        paid: { color: "text-blue-700", bg: "bg-blue-100", label: "Paid" },
        draft: { color: "text-yellow-700", bg: "bg-yellow-100", label: "Draft" },
        overdue: { color: "text-red-700", bg: "bg-red-100", label: "Overdue" },
        pending: { color: "text-orange-700", bg: "bg-orange-100", label: "Pending" },
      };
      
      const config = statusConfig[status?.toLowerCase()] || 
                    { color: "text-gray-700", bg: "bg-gray-100", label: status || "Unknown" };
      
      return (
        <span className={`
          inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
          ${config.color} ${config.bg}
        `}>
          {config.label}
        </span>
      );
    },
  },
  {
    title: "Balance Due",
    dataIndex: "balanceDue",
    width: 140,
    align: "right" as const,
    className: "px-4",
    render: (v) => {
      const amount = Number(v);
      const isZero = amount === 0;
      
      return (
        <div className={`
          font-semibold 
          ${isZero ? 'text-green-600' : 'text-gray-900'}
        `}>
          $ {amount.toFixed(2)}
          {isZero && (
            <div className="text-xs text-green-500 font-normal">Paid</div>
          )}
        </div>
      );
    },
  },
];




  


const fullCellRender = (value: Dayjs) => {
  if (!value.isSame(currentMonth, "month")) {
    return <div style={{ height: "100%" }} />;
  }

  const dateKey = value.format("YYYY-MM-DD");
  const data = calendarMap[dateKey];
  const isToday = value.isSame(dayjs(), "day");

  // Build tooltip text ONLY if data exists
  const tooltipText =
    data && (data.created > 0 || data.received > 0)
      ? `${data.created > 0 ? `Created: ${data.created}` : ""}${
          data.created > 0 && data.received > 0 ? " | " : ""
        }${data.received > 0 ? `Received: ${data.received}` : ""}`
      : null;




  const cell = (
  <div
    style={{
      height: "100%",
      width: "100%",
      padding: 2,
      borderRadius: 4,
      cursor: tooltipText ? "pointer" : "default",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    }}
  >
    {/* Date wrapper (controls today highlight positioning) */}
    <div
      style={{
        position: "relative",
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Today highlight */}
      {isToday && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#e6f7ff",
            border: "1px solid #91d5ff",
            zIndex: 1,
          }}
        />
      )}

      {/* Date number */}
      <span
        style={{
          fontSize: 12,
          fontWeight: isToday ? 700 : 600,
          color: isToday ? "#1890ff" : "#262626",
          zIndex: 2,
          lineHeight: 1,
        }}
      >
        {value.date()}
      </span>
    </div>

    {/* Dots (always below the date) */}
    {data && (
      <div
        style={{
          display: "flex",
          gap: 2,
        }}
      >
        {data.created > 0 && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#1890ff",
            }}
          />
        )}
        {data.received > 0 && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#52c41a",
            }}
          />
        )}
      </div>
    )}
  </div>
);


  // ONLY wrap with Tooltip if there is data
  return tooltipText ? (
    <Tooltip title={tooltipText} trigger={["hover", "click"]}>
      {cell}
    </Tooltip>
  ) : (
    cell
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

  if (authLoading) return <MainLayout><Spin tip="Loading..." /></MainLayout>;
  if (!canReadInvoice) return null;

  return (
    <MainLayout>
      <Spin spinning={isLoading} tip="Loading dashboard...">
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
  {[1, 2, 3, 4].map((i) => (
    <Col xs={24} sm={12} md={6} key={i}>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        renderCard(
          i === 1 ? <FileTextOutlined /> :
          i === 2 ? <DollarOutlined /> :
          i === 3 ? <ExclamationCircleOutlined /> :
          <ClockCircleOutlined />,
          ["Total Invoices", "Total Revenue", "Pending Amount", "Overdue Amount"][i - 1],
          [
            `${totalInvoices}`,
            `$${totalRevenue.toFixed(2)}`,
            `$${pendingAmount.toFixed(2)}`,
            `$${overdueAmount.toFixed(2)}`
          ][i - 1],
          ["#1890ff", "#52c41a", "#faad14", "#f5222d"][i - 1]
        )
      )}
    </Col>
  ))}
</Row>


        {/* ================= CHART + CALENDAR (SAME LINE) ================= */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={14}>
            <Card
              title={<span style={{ fontSize: 14 }}>Monthly Revenue</span>}
              style={{ borderRadius: 12, height: "100%" }}
              styles={{
                header: { padding: "10px 16px" },
                body: { padding: "8px 12px" },
              }}
            >
              {/* <div style={{ height: 250, overflow: "hidden" }}>
                {yearlyRevenueData.length ? (
                  <Line {...monthlyRevenueConfig} />
                ) : (
                  <Text type="secondary">No data for this month</Text>
                )}
              </div> */}


              <div style={{ height: 250 ,overflow: "hidden"}}>
  {isLoading ? (
    <Skeleton active paragraph={{ rows: 6 }} />
  ) : yearlyRevenueData.length ? (
    <Line {...monthlyRevenueConfig} />
  ) : (
    <Text type="secondary">No data</Text>
  )}
</div>
            </Card>
          </Col>

          <Col xs={24} md={10}>
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
              {isLoading ? (
  <Skeleton active paragraph={{ rows: 8 }} />
) : (
              <Calendar
                fullscreen={false}
                value={currentMonth}
                onChange={(val) => setCurrentMonth(val)}
                fullCellRender={fullCellRender}
                style={{ height: 280 }}
                headerRender={({ value, onChange }) => (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 700 }}>
                      {value.format("MMMM YYYY")}
                    </Text>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        size="small"
                        onClick={() => {
                          const v = value.clone().subtract(1, "month");
                          setCurrentMonth(v);
                          onChange(v);
                        }}
                      >
                        ◀
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          const v = value.clone().add(1, "month");
                          setCurrentMonth(v);
                          onChange(v);
                        }}
                      >
                        ▶
                      </Button>
                    </div>
                  </div>
                )}
              />
)}
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
                {canCreateInvoice && (
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
                )}

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
                  new Date(b.invoiceDate).getTime() -
                  new Date(a.invoiceDate).getTime(),
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
      </Spin>
    </MainLayout>
  );
}
