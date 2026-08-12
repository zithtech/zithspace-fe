"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import { useEffect, useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Table, Button, Skeleton, Tooltip, Calendar } from "antd";
import {
  FileText,
  DollarSign,
  AlertCircle,
  Plus,
  LayoutDashboard,
  TrendingUp,
  History,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ChevronLeft as ChevLeft,
  ChevronRight as ChevRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import EmailHistoryDrawer from "@/components/invoice/EmailHistoryDrawer";

import { Line } from "@ant-design/plots";

import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useInvoices } from "@/hooks/useInvoices";
import type { ColumnsType } from "antd/es/table";

import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

export default function DashboardPage() {
  const router = useRouter();
  const { canReadInvoice, canCreateInvoice, canReadInvoiceDashboard, canReadInvoiceHistory } = usePermission();
  const { isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!authLoading && !canReadInvoice && !canReadInvoiceDashboard) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadInvoice, canReadInvoiceDashboard, router]);

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useInvoices({ page: 1, limit: 100 });
  const invoices = data?.data ?? [];

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
        new Date(inv.dueDate) < now && Number(inv.balanceDue || 0) > 0
    )
    .reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

  /* Calendar map */
  const calendarMap: Record<string, { created: number; received: number }> = {};
  invoices.forEach((inv) => {
    if (inv.invoiceDate) {
      const createdKey = dayjs(inv.invoiceDate).format("YYYY-MM-DD");
      if (!calendarMap[createdKey]) calendarMap[createdKey] = { created: 0, received: 0 };
      calendarMap[createdKey].created += 1;
    }
    if (inv.paidAmount > 0 && inv.invoiceDate) {
      const paidKey = dayjs(inv.invoiceDate).format("YYYY-MM-DD");
      if (!calendarMap[paidKey]) calendarMap[paidKey] = { created: 0, received: 0 };
      calendarMap[paidKey].received += 1;
    }
  });

  /* Yearly revenue */
  const currentYear = dayjs().year();
  const yearlyRevenueMap: Record<string, number> = {};
  invoices.forEach((inv) => {
    if (!inv.invoiceDate) return;
    const d = dayjs(inv.invoiceDate);
    if (d.year() !== currentYear) return;
    const month = d.format("MMM");
    yearlyRevenueMap[month] =
      (yearlyRevenueMap[month] || 0) +
      Number(inv.grandTotal || (inv as any).total || 0);
  });
  const months = Array.from({ length: 12 }).map((_, i) =>
    dayjs().month(i).format("MMM")
  );
  const yearlyRevenueData = months.map((month) => ({
    month,
    revenue: yearlyRevenueMap[month] || 0,
  }));

  const monthlyRevenueConfig = useMemo(
    () => ({
      data: yearlyRevenueData,
      xField: "month",
      yField: "revenue",
      smooth: true,
      theme: isDark ? "dark" : undefined,
      color: "#3B82F6",
      lineStyle: { lineWidth: 2.5 },
      point: {
        size: 3,
        style: {
          fill: isDark ? "#161B22" : "#fff",
          stroke: "#3B82F6",
          lineWidth: 2,
        },
      },
      area: {
        style: {
          fill: isDark
            ? "l(270) 0:rgba(59,130,246,0.25) 1:rgba(59,130,246,0.01)"
            : "l(270) 0:rgba(59,130,246,0.18) 1:rgba(59,130,246,0.02)",
        },
      },
      xAxis: {
        label: {
          style: {
            fill: isDark ? "#94a3b8" : "#64748b",
            fontSize: 11,
          },
        },
        grid: {
          line: {
            style: {
              stroke: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            },
          },
        },
      },
      yAxis: {
        label: {
          formatter: (v: string) => `$${Number(v).toFixed(0)}`,
          style: {
            fill: isDark ? "#94a3b8" : "#64748b",
            fontSize: 11,
          },
        },
        grid: {
          line: {
            style: {
              stroke: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            },
          },
        },
      },
    }),
    [yearlyRevenueData, isDark]
  );

  /* Stat tile */
  const StatTile = ({
    label,
    value,
    icon: Icon,
    color,
    bgColor,
    sub,
  }: {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    bgColor: string;
    sub?: string;
  }) => (
    <div className="pp-stat-card">
      <div className="pp-stat-top">
        <div className="pp-stat-left">
          <span className="pp-stat-icon" style={{ background: bgColor, color }}>
            <Icon size={14} />
          </span>
          <span className="pp-stat-label">{label}</span>
        </div>
      </div>
      <div className="pp-stat-bottom">
        <div className="pp-stat-value-wrap">
          <span className="pp-stat-value">{value}</span>
        </div>
        {sub && <span className="pp-stat-period">{sub}</span>}
      </div>
    </div>
  );

  /* Section header — inline divider style */
  const SectionHeader = ({
    icon: Icon,
    title,
    subtitle,
    right,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
  }) => (
    <div
      className="px-4 py-2 flex items-center justify-between gap-3 border-b"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(59,130,246,0.1)",
            color: "#3B82F6",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        >
          <Icon size={13} strokeWidth={2.25} />
        </div>
        <span
          className="text-[13px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </span>
        {subtitle && (
          <>
            <span
              className="h-3 w-px"
              style={{ background: "var(--border-color)" }}
            />
            <span
              className="text-[10.5px] uppercase tracking-[0.08em]"
              style={{ color: "var(--text-secondary)" }}
            >
              {subtitle}
            </span>
          </>
        )}
      </div>
      {right}
    </div>
  );

  /* Table columns */
  const columns: ColumnsType<any> = [
    {
      title: "INVOICE",
      dataIndex: "invoiceNumber",
      width: 220,
      render: (value, record) => {
        const snapshot = record.customerSnapshot;
        const companyName =
          snapshot?.companyName || record.customer?.companyName || "Unknown";
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
              style={{
                background: "var(--bg-blue-50)",
                color: "var(--text-blue-700)",
                border: "1px solid var(--border-blue-200)",
              }}
            >
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div
                className="text-sm font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {value || "—"}
              </div>
              <div
                className="text-[11px] mt-0.5 truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {companyName}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "DATE",
      dataIndex: "invoiceDate",
      width: 130,
      render: (date: string) => (
        <span
          className="text-[12.5px]"
          style={{ color: "var(--text-secondary)" }}
        >
          {date ? dayjs(date).format("MMM D, YYYY") : "—"}
        </span>
      ),
    },
    {
      title: "DUE DATE",
      dataIndex: "dueDate",
      width: 140,
      render: (date: string) => {
        const isPastDue =
          date && new Date(date) < new Date();
        return (
          <span
            className="inline-flex items-center gap-1 text-[12px]"
            style={{ color: isPastDue ? "#f87171" : "var(--text-secondary)" }}
          >
            {date ? dayjs(date).format("MMM D, YYYY") : "—"}
            {isPastDue && (
              <span
                className="text-[9.5px] font-bold uppercase tracking-wider"
                style={{ color: "#f87171" }}
              >
                · past due
              </span>
            )}
          </span>
        );
      },
    },
    {
      title: "AMOUNT",
      dataIndex: "grandTotal",
      width: 130,
      align: "right",
      render: (v, record) => (
        <span
          className="text-[12px] font-semibold tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          ${Number(v || record.total || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 130,
      align: "center",
      render: (status: string) => {
        const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
          paid: {
            bg: "rgba(16,185,129,0.10)",
            color: "#10b981",
            border: "rgba(16,185,129,0.25)",
            label: "Paid",
          },
          submitted: {
            bg: "rgba(59,130,246,0.10)",
            color: "#3b82f6",
            border: "rgba(59,130,246,0.25)",
            label: "Submitted",
          },
          pending: {
            bg: "rgba(59,130,246,0.10)",
            color: "#3b82f6",
            border: "rgba(59,130,246,0.25)",
            label: "Pending",
          },
          draft: {
            bg: "rgba(100,116,139,0.10)",
            color: "#64748b",
            border: "rgba(100,116,139,0.25)",
            label: "Draft",
          },
          overdue: {
            bg: "rgba(248,113,113,0.10)",
            color: "#f87171",
            border: "rgba(248,113,113,0.25)",
            label: "Overdue",
          },
        };
        const cfg =
          map[status?.toLowerCase()] || {
            bg: "rgba(100,116,139,0.10)",
            color: "#64748b",
            border: "rgba(100,116,139,0.25)",
            label: status || "Unknown",
          };
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
            style={{
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.color }}
            />
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: "BALANCE",
      dataIndex: "balanceDue",
      width: 130,
      align: "right",
      render: (v) => {
        const amount = Number(v);
        const isZero = amount === 0;
        return (
          <span
            className="text-[12px] font-semibold tabular-nums"
            style={{
              color: isZero ? "#10b981" : "var(--text-primary)",
            }}
          >
            {isZero ? "Settled" : `$${amount.toFixed(2)}`}
          </span>
        );
      },
    },
  ];

  /* Calendar cell render */
  const fullCellRender = (value: Dayjs) => {
    if (!value.isSame(currentMonth, "month")) {
      return <div style={{ height: "100%" }} />;
    }
    const dateKey = value.format("YYYY-MM-DD");
    const data = calendarMap[dateKey];
    const isToday = value.isSame(dayjs(), "day");

    const tooltipText =
      data && (data.created > 0 || data.received > 0)
        ? `${data.created > 0 ? `Created: ${data.created}` : ""}${
            data.created > 0 && data.received > 0 ? " · " : ""
          }${data.received > 0 ? `Received: ${data.received}` : ""}`
        : null;

    const cell = (
      <div
        className="h-full w-full p-1 flex flex-col items-center justify-center gap-1 transition-colors"
        style={{
          borderRadius: 8,
          cursor: tooltipText ? "pointer" : "default",
          background: data ? "var(--bg-slate-50)" : "transparent",
          border:
            isToday && !tooltipText
              ? "1px solid var(--border-blue-200)"
              : "1px solid transparent",
        }}
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          {isToday && (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: "var(--bg-blue-50)",
                border: "1px solid var(--border-blue-200)",
              }}
            />
          )}
          <span
            className="relative text-[12px]"
            style={{
              fontWeight: isToday ? 700 : 600,
              color: isToday
                ? "var(--text-blue-700)"
                : "var(--text-primary)",
            }}
          >
            {value.date()}
          </span>
        </div>
        {data && (
          <div className="flex gap-1">
            {data.created > 0 && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#3B82F6" }}
              />
            )}
            {data.received > 0 && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#10b981" }}
              />
            )}
          </div>
        )}
      </div>
    );

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

  if (authLoading)
    return (
      <MainLayout>
        <div style={{ padding: 100, textAlign: "center" }}>
          <ZukvoLoader size="md" />
        </div>
      </MainLayout>
    );
  if (!canReadInvoice && !canReadInvoiceDashboard) return null;

  return (
    <MainLayout>
      <div
        style={{
          margin: "0 -24px",
          background: "var(--customers-page-bg)",
          minHeight: "calc(100vh - 54px)",
        }}
      >
        {/* TOP BAR */}
        <div
          className="sticky top-0 z-40 backdrop-blur-md border-b"
          style={{
            background:
              "color-mix(in oklab, var(--customers-page-bg) 85%, transparent)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="px-6 py-2 md:py-0 min-h-[48px] md:h-12 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    color: "#3B82F6",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  <LayoutDashboard size={13} strokeWidth={2.25} />
                </div>
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Dashboard
                </span>
              </div>
              <span
                className="h-3 w-px hidden sm:inline"
                style={{ background: "var(--border-color)" }}
              />
              <span
                className="text-[11.5px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Overview of your invoicing and revenue performance
              </span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {canReadInvoiceHistory && (
                <Button
                  icon={<History size={13} />}
                  onClick={() => setHistoryDrawerVisible(true)}
                  className="flex-1 md:flex-initial flex items-center justify-center"
                  style={{ borderRadius: 6, height: 30, fontSize: 12, fontWeight: 600 }}
                >
                  <span>Email history</span>
                </Button>
              )}
              {canCreateInvoice && (
                <Button
                  type="primary"
                  icon={<Plus size={13} />}
                  onClick={() => router.push("/invoice/newinvoice")}
                  className="flex-1 md:flex-initial flex items-center justify-center"
                  style={{
                    borderRadius: 6,
                    height: 30,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "#3B82F6",
                  }}
                >
                  <span>New invoice</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pt-4 pb-8">
          <div className="mx-auto max-w-[1600px]">
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
              {isLoading ? (
                <>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="pp-stat-card"
                    >
                      <Skeleton active paragraph={{ rows: 1 }} />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <StatTile
                    label="Total invoices"
                    value={totalInvoices}
                    icon={FileText}
                    color="#3B82F6"
                    bgColor="rgba(59,130,246,0.1)"
                    sub="All-time"
                  />
                  <StatTile
                    label="Total revenue"
                    value={`$${totalRevenue.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`}
                    icon={DollarSign}
                    color="#10b981"
                    bgColor="rgba(16,185,129,0.1)"
                    sub={`Paid: $${totalPaid.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`}
                  />
                  <StatTile
                    label="Pending amount"
                    value={`$${pendingAmount.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`}
                    icon={TrendingUp}
                    color="#64748b"
                    bgColor="rgba(100,116,139,0.1)"
                    sub="Awaiting payment"
                  />
                  <StatTile
                    label="Overdue"
                    value={`$${overdueAmount.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`}
                    icon={AlertCircle}
                    color="#f87171"
                    bgColor="rgba(248,113,113,0.1)"
                    sub="Past due date"
                  />
                </>
              )}
            </div>

            {/* CHART + CALENDAR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
              {/* Chart card */}
              <div
                className="col-span-12 lg:col-span-7 rounded-none overflow-hidden"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <SectionHeader
                  icon={TrendingUp}
                  title="Monthly revenue"
                  subtitle={`Year ${currentYear}`}
                />
                <div className="px-4 py-4">
                  <div style={{ height: 220 }}>
                    {isLoading ? (
                      <Skeleton active paragraph={{ rows: 5 }} />
                    ) : mounted && yearlyRevenueData.length > 0 ? (
                      <Line key={theme} {...monthlyRevenueConfig} />
                    ) : (
                      <div
                        className="h-full flex items-center justify-center text-[12px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        No data
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Calendar card */}
              <div
                className="col-span-12 lg:col-span-5 rounded-none overflow-hidden"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <SectionHeader
                  icon={LayoutDashboard}
                  title="Invoice calendar"
                  subtitle="Activity by day"
                  right={
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                        style={{
                          background: "rgba(59,130,246,0.1)",
                          color: "#3B82F6",
                          border: "1px solid rgba(59,130,246,0.2)",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "#3B82F6" }}
                        />
                        {monthlyCreated} created
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                        style={{
                          background: "rgba(16,185,129,0.1)",
                          color: "#10b981",
                          border: "1px solid rgba(16,185,129,0.2)",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "#10b981" }}
                        />
                        {monthlyReceived} received
                      </span>
                    </div>
                  }
                />
                <div className="px-2 py-2">
                  {isLoading ? (
                    <Skeleton active paragraph={{ rows: 6 }} />
                  ) : (
                    <Calendar
                      fullscreen={false}
                      value={currentMonth}
                      onChange={(val) => setCurrentMonth(val)}
                      fullCellRender={fullCellRender}
                      headerRender={({ value, onChange }) => (
                        <div className="flex items-center justify-between mb-1.5 px-1">
                          <span
                            className="text-[13px] font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {value.format("MMMM YYYY")}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const v = value.clone().subtract(1, "month");
                                setCurrentMonth(v);
                                onChange(v);
                              }}
                              className="w-6.5 h-6.5 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-slate-50)]"
                              style={{
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border-color)",
                              }}
                            >
                              <ChevLeft size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const v = value.clone().add(1, "month");
                                setCurrentMonth(v);
                                onChange(v);
                              }}
                              className="w-6.5 h-6.5 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--bg-slate-50)]"
                              style={{
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border-color)",
                              }}
                            >
                              <ChevRight size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* RECENT INVOICES */}
            <div
              className="rounded-none overflow-hidden"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <SectionHeader
                icon={FileText}
                title="Recent invoices"
                subtitle="Latest 5"
                right={
                  <button
                    type="button"
                    onClick={() => router.push("/invoice/invoices")}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold transition-colors"
                    style={{ color: "#3B82F6" }}
                  >
                    View all
                    <ArrowRight size={12} />
                  </button>
                }
              />
              <Table
                columns={columns}
                dataSource={invoices
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.invoiceDate).getTime() -
                      new Date(a.invoiceDate).getTime()
                  )
                  .slice(0, 5)}
                rowKey="id"
                pagination={false}
                size="middle"
                scroll={{ x: "max-content" }}
                onRow={(record) => ({
                  onClick: () =>
                    router.push(`/invoice/invoices?edit=${record.id}`),
                  className: "cursor-pointer",
                })}
                className="dashboard-table"
                locale={{
                  emptyText: (
                    <div className="py-10 text-center">
                      <FileText
                        size={28}
                        className="mx-auto mb-2"
                        style={{ color: "var(--text-secondary)" }}
                      />
                      <div
                        className="text-[13px] font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        No invoices yet
                      </div>
                      <div
                        className="text-[11.5px] mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Create your first invoice to see it here
                      </div>
                    </div>
                  ),
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pp-stat-card {
          background: var(--bg-pure-white, #fff); border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 0; padding: 10px 12px; min-height: 84px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 8px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 11.5px; font-weight: 600; color: var(--text-slate-600, #475569); }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 18px; font-weight: 800; color: var(--text-slate-900, #0f172a); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 10.5px; color: var(--text-slate-400, #94a3b8); font-weight: 500; }

        .dashboard-table .ant-table-thead > tr > th {
          background-color: var(--bg-slate-50) !important;
          color: var(--text-secondary) !important;
          font-weight: 650 !important;
          font-size: 10.5px !important;
          padding: 6px 12px !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid var(--border-color) !important;
          text-transform: uppercase !important;
        }
        .dashboard-table .ant-table-tbody > tr > td {
          padding: 8px 12px !important;
          border-bottom: 1px solid var(--border-color) !important;
          font-size: 12px !important;
        }
        .dashboard-table .ant-table-row:hover > td {
          background-color: var(--bg-slate-50) !important;
        }
        .dashboard-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .ant-picker-calendar-mini .ant-picker-content thead th {
          color: var(--text-secondary) !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.06em !important;
          padding: 4px 0 !important;
        }
        .ant-picker-calendar-mini .ant-picker-cell {
          padding: 0px !important;
        }
        .ant-picker-calendar-mini .ant-picker-cell-inner {
          height: 30px !important;
        }
      `,
        }}
      />

      <EmailHistoryDrawer
        open={historyDrawerVisible}
        onClose={() => setHistoryDrawerVisible(false)}
      />
    </MainLayout>
  );
}
