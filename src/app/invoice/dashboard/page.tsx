



"use client";

import { useEffect, useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, Row, Col, Typography, Table, Tag, Button, Spin, Skeleton, Space } from "antd";
import { 
  FileText, 
  DollarSign, 
  AlertCircle, 
  Clock, 
  Plus,
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  History
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import EmailHistoryDrawer from "@/components/invoice/EmailHistoryDrawer";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadInvoice) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadInvoice, router]);

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card 
      styles={{ body: { padding: 20 } }} 
      style={{ 
        borderRadius: 16, 
        border: "1px solid var(--dashboard-card-border)", 
        background: "var(--dashboard-card-bg)",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        height: "100%"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>{value}</div>
        </div>
        <div style={{ 
          color, 
          background: `${color}12`, 
          padding: 12, 
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={24} />
        </div>
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

const monthlyRevenueConfig = useMemo(() => ({
  data: yearlyRevenueData,
  xField: "month",
  yField: "revenue",
  smooth: true,
  theme: isDark ? "dark" : undefined,
  color: "#3b82f6",
  lineStyle: { lineWidth: 3 },
  point: {
    size: 4,
    style: {
      fill: isDark ? "#161B22" : "#fff",
      stroke: "#3b82f6",
      lineWidth: 2,
    },
  },
  area: {
    style: {
      fill: isDark 
        ? "l(270) 0:rgba(59,130,246,0.2) 1:rgba(59,130,246,0.01)"
        : "l(270) 0:rgba(59,130,246,0.15) 1:rgba(59,130,246,0.02)",
    },
  },
  xAxis: {
    label: {
      style: {
        fill: isDark ? "#FFFFFF" : "#64748b",
        fontSize: 11,
      },
    },
    grid: {
      line: {
        style: {
          stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        },
      },
    },
  },
  yAxis: {
    label: {
      formatter: (v: string) => `$${Number(v).toFixed(0)}`,
      style: {
        fill: isDark ? "#FFFFFF" : "#64748b",
        fontSize: 11,
      },
    },
    grid: {
      line: {
        style: {
          stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        },
      },
    },
  },
  tooltip: {
    domStyles: {
      'g2-tooltip': {
        backgroundColor: isDark ? "#161B22" : "#fff",
        boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.1)",
        color: isDark ? "#F1F5F9" : "#1e293b",
        border: `1px solid ${isDark ? "#1F2937" : "#f1f5f9"}`,
      },
    },
  },
}), [yearlyRevenueData, isDark]);







const columns: ColumnsType<any> = [
  {
    title: "Invoice No",
    dataIndex: "invoiceNumber",
    key: "invoice_number",
    width: 120,
    className: "font-mono px-4",
    render: (value) => (
      <div className="font-medium text-[var(--dashboard-stat-value)] tracking-tight">
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
        <div className="font-semibold text-[var(--dashboard-stat-value)] truncate">
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
    <div className="text-[var(--dashboard-stat-label)] font-medium whitespace-nowrap">
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
        <div className={`font-medium ${isPastDue ? 'text-red-500' : 'text-[var(--dashboard-stat-label)]'}`}>
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
      <div className="font-bold text-[var(--dashboard-stat-value)]">
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
        submitted: { color: "text-green-500", bg: "bg-green-500/10", label: "Submitted" },
        paid: { color: "text-blue-500", bg: "bg-blue-500/10", label: "Paid" },
        draft: { color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Draft" },
        overdue: { color: "text-red-500", bg: "bg-red-500/10", label: "Overdue" },
        pending: { color: "text-orange-500", bg: "bg-orange-500/10", label: "Pending" },
      };
      
      const config = statusConfig[status?.toLowerCase()] || 
                    { color: "text-[var(--dashboard-stat-label)]", bg: "bg-[var(--dashboard-table-header-bg)]", label: status || "Unknown" };
      
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
          ${isZero ? 'text-green-500' : 'text-[var(--dashboard-stat-value)]'}
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
            background: "var(--dashboard-calendar-today-bg)",
            border: "1px solid var(--dashboard-calendar-today-border)",
            zIndex: 1,
          }}
        />
      )}

      {/* Date number */}
      <span
        style={{
          fontSize: 12,
          fontWeight: isToday ? 700 : 600,
          color: isToday ? "var(--dashboard-calendar-today-border)" : "var(--dashboard-calendar-date-text)",
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

  if (authLoading) return <MainLayout><div style={{ padding: 100, textAlign: 'center' }}><Spin tip="Loading"><div style={{ padding: 20 }} /></Spin></div></MainLayout>;
  if (!canReadInvoice) return null;

  return (
    <MainLayout>
      <Spin spinning={isLoading} tip="Loading dashboard">
        <div style={{
          margin: "0 -24px",
          background: "var(--dashboard-page-bg)",
          minHeight: "calc(100vh - 64px)"
        }}>
          <TimeTrackingHeader
            style={{ padding: '9.5px 32px' }}
            icon={<LayoutDashboard size={20} color="#8b5cf6" />}
            title="Dashboard"
            description="Overview of your invoicing and revenue performance."
            extra={
              <div className="flex items-center gap-3">
                <Button
                  size="middle"
                  icon={<History size={16} />}
                  onClick={() => setHistoryDrawerVisible(true)}
                  style={{ borderRadius: 8, height: 38, color: "var(--dashboard-stat-label)", background: "var(--dashboard-card-bg)", border: "1px solid var(--dashboard-card-border)" }}
                >
                  Email History
                </Button>
                {canCreateInvoice && (
                  <Button 
                    type="primary" 
                    size="middle" 
                    icon={<Plus size={16} />} 
                    style={{ borderRadius: 8, height: 38, padding: "0 16px", fontWeight: 600 }}
                    onClick={() => router.push("/invoice/newinvoice")}
                  >
                    New Invoice
                  </Button>
                )}
              </div>
            }
          />

          <div style={{ padding: "16px 32px 32px 32px" }}>

          {/* ================= METRIC CARDS ================= */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} md={6}>
              {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                <StatCard label="Total Invoices" value={`${totalInvoices}`} icon={FileText} color="#3b82f6" />
              )}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                <StatCard label="Monthly Revenue" value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} color="#10b981" />
              )}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                <StatCard label="Pending Amount" value={`$${pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={TrendingUp} color="#f59e0b" />
              )}
            </Col>
            <Col xs={24} sm={12} md={6}>
              {isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                <StatCard label="Overdue Amount" value={`$${overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={AlertCircle} color="#ef4444" />
              )}
            </Col>
          </Row>


        {/* ================= CHART + CALENDAR (SAME LINE) ================= */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={14}>
            <Card
              title="Monthly Revenue"
              style={{ borderRadius: 12, height: "100%", minHeight: 400, display: "flex", flexDirection: "column" }}
              styles={{
                header: { padding: "12px 16px" },
                body: { padding: "12px 16px 20px 16px", flex: 1 },
              }}
            >
              {/* <div style={{ height: 250, overflow: "hidden" }}>
                {yearlyRevenueData.length ? (
                  <Line {...monthlyRevenueConfig} />
                ) : (
                  <Text type="secondary">No data for this month</Text>
                )}
              </div> */}


              <div style={{ height: 250 }}>
  {isLoading ? (
    <Skeleton active paragraph={{ rows: 6 }} />
  ) : (mounted && yearlyRevenueData.length > 0) ? (
    <Line key={theme} {...monthlyRevenueConfig} />
  ) : (
    <Text style={{ color: "var(--text-secondary)" }}>No data</Text>
  )}
</div>
            </Card>
          </Col>

          <Col xs={24} md={10}>
            <Card
              title={
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 600, color: "var(--dashboard-stat-value)" }}>
                    Invoice Calendar
                  </Text>

                  <div style={{ display: "flex", gap: 12 }}>
                    <span
                      style={{
                        fontSize: 12,
                        background: "rgba(24, 144, 255, 0.1)",
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
                        background: "rgba(82, 196, 26, 0.1)",
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
              style={{ borderRadius: 12, height: "100%", minHeight: 400 }}
              styles={{
                header: { padding: "12px 16px" },
                body: { padding: "12px 16px 24px 16px" },
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
                headerRender={({ value, onChange }) => (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 700, color: "var(--dashboard-stat-value)" }}>
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
          bordered={false}
          style={{
            borderRadius: 16,
            border: "1px solid var(--dashboard-card-border)",
            background: "var(--dashboard-card-bg)",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            overflow: "hidden"
          }}
          styles={{ body: { padding: 0 } }}
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
            rowKey="id"
            pagination={false}
            size="middle"
            scroll={{ x: "max-content" }}
            onRow={() => ({
              style: { cursor: "pointer" },
            })}
            rowClassName={() => "dashboard-table-row"}
          />
        </Card>
        </div>
      </div>
      </Spin>
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-table-row:hover {
          background-color: var(--dashboard-table-row-hover) !important;
        }
        .ant-table-thead > tr > th {
          background-color: var(--dashboard-table-header-bg) !important;
          color: var(--dashboard-table-header-text) !important;
          font-weight: 600 !important;
          padding: 12px 16px !important;
          border-bottom: 1px solid var(--dashboard-card-border) !important;
        }
        .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid var(--dashboard-card-border) !important;
          color: var(--dashboard-stat-label) !important;
        }
        .ant-calendar {
          background: var(--dashboard-card-bg) !important;
          color: var(--dashboard-calendar-date-text) !important;
        }
        .ant-card-head {
          background: var(--dashboard-card-bg) !important;
          border-bottom: 1px solid var(--dashboard-card-border) !important;
        }
        .ant-card-head-title {
          color: var(--text-primary) !important;
          font-size: 14px !important;
          font-weight: 600 !important;
        }
      `}} />

      <EmailHistoryDrawer 
        open={historyDrawerVisible} 
        onClose={() => setHistoryDrawerVisible(false)} 
      />
    </MainLayout>
  );
}
