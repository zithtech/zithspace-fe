import {
  Typography,
  Space,
  Select,
  Button,
  Tooltip,
  Row,
  Col,
  Card,
} from "antd";
import {
  ReloadOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { useTimesheets } from "@/hooks/useTimesheet";
import dayjs from "dayjs";
import { useState } from "react";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

const { Title, Text } = Typography;

const STATUS_COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // Match Leave Management colors

const StatBox = ({ label, value, icon: Icon, color, subText }: any) => (
  <Card
    bodyStyle={{ padding: "16px 20px" }}
    style={{
      borderRadius: 16,
      background: "var(--bg-pure-white)",
      border: "1px solid var(--border-color)",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      height: "100%"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>{value}</div>
        {subText && (
          <div style={{ marginTop: 2 }}>
            <Text style={{ fontSize: 11, color: "#94a3b8" }}>{subText}</Text>
          </div>
        )}
      </div>
      <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

export default function DashboardTab() {
  const [weekFilter, setWeekFilter] = useState<"all" | "thisWeek" | "lastWeek">(
    "all",
  );

  const getWeekRange = () => {
    if (weekFilter === "thisWeek") {
      return {
        fromDate: dayjs().startOf("week").format("YYYY-MM-DD"),
        toDate: dayjs().endOf("week").format("YYYY-MM-DD"),
      };
    }

    if (weekFilter === "lastWeek") {
      return {
        fromDate: dayjs()
          .subtract(1, "week")
          .startOf("week")
          .format("YYYY-MM-DD"),
        toDate: dayjs().subtract(1, "week").endOf("week").format("YYYY-MM-DD"),
      };
    }

    return {};
  };

  const { fromDate, toDate } = getWeekRange();
  const { data, isLoading } = useTimesheets({
    page: 1,
    limit: 1000,
    fromDate,
    toDate,
  });

  const timesheets = data?.data ?? [];
  const total = timesheets.length;

  const approved = timesheets.filter(
    (t: any) => t.status === "APPROVED",
  ).length;

  const pending = timesheets.filter(
    (t: any) => t.status === "SUBMITTED",
  ).length;

  const rejected = timesheets.filter(
    (t: any) => t.status === "REJECTED",
  ).length;

  const weeklyHoursData = timesheets.map((t: any) => {
    const totalHours =
      t.rows?.reduce((sum: number, r: any) => sum + (r.hours ?? 0), 0) || 0;

    return {
      week: dayjs(t.weekStart).format("DD MMM"),
      hours: totalHours,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "var(--bg-pure-white)",
            padding: "12px 14px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
          <div style={{ color: "#0ea5e9", fontWeight: 500 }}>
            Total Hours : {payload[0].value} hours
          </div>
        </div>
      );
    }
    return null;
  };

  const statusData = [
    { name: "Approved", value: approved },
    { name: "Pending", value: pending },
    { name: "Rejected", value: rejected },
  ];

  return (
    <div style={{
      margin: "0 -24px",
      background: "var(--bg-pure-white)",
      height: "calc(100vh - 64px)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      <TimeTrackingHeader
        style={{ padding: '10.5px 32px' }}
        icon={<LayoutDashboard size={20} color="#0ea5e9" />}
        title="Timesheet Dashboard"
        description="Weekly activity and timesheet status overview"
        extra={
          <Space size={12}>
            <Select
              prefix={<CalendarOutlined />}
              value={weekFilter}
              style={{ width: 180, height: 38 }}
              onChange={setWeekFilter}
              options={[
                { label: "All Weeks", value: "all" },
                { label: "This Week", value: "thisWeek" },
                { label: "Last Week", value: "lastWeek" },
              ]}
            />
            <Tooltip title="Refresh">
              <Button
                style={{ borderRadius: 8, height: 38, display: "flex", alignItems: "center", justifyContent: "center" }}
                icon={<RefreshCw size={18} />}
                onClick={() => window.location.reload()}
              />
            </Tooltip>
          </Space>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 32px 32px 32px", scrollbarWidth: "none" }}>
        <Row gutter={[16, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              label="Total Timesheets"
              value={total}
              icon={FileText}
              color="#0ea5e9"
              subText="All recorded records"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              label="Approved"
              value={approved}
              icon={CheckCircle2}
              color="#10b981"
              subText={`${approved} processed successfully`}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              label="Pending Approval"
              value={pending}
              icon={Clock}
              color="#f59e0b"
              subText="Awaiting manager review"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatBox
              label="Rejected"
              value={rejected}
              icon={AlertCircle}
              color="#ef4444"
              subText="Requires resubmission"
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* LEFT: Status Breakdown */}
          <Col xs={24} lg={10}>
            <Card
              title={<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Status Breakdown</span>}
              style={{ borderRadius: 16, background: "var(--bg-pure-white)", border: "1px solid var(--border-color)", height: "100%" }}
              headStyle={{ borderBottom: "1px solid var(--border-color)", padding: "0 20px", minHeight: 48 }}
              bodyStyle={{ padding: "12px 20px" }}
            >
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={index} fill={STATUS_COLORS[index]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div style={{ background: "var(--bg-pure-white)", border: "1px solid var(--border-color)", padding: "8px 12px", borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: 13 }}>
                              <strong style={{ color: "var(--text-primary)" }}>{payload[0].name}</strong>: {payload[0].value}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
                {statusData.map((item, i) => (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, background: STATUS_COLORS[i], borderRadius: "50%" }} />
                    <Text style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{item.name}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          {/* RIGHT: Weekly Hours Trend */}
          <Col xs={24} lg={14}>
            <Card
              title={<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Weekly Hours Trend</span>}
              style={{ borderRadius: 16, background: "var(--bg-pure-white)", border: "1px solid var(--border-color)", height: "100%" }}
              headStyle={{ borderBottom: "1px solid var(--border-color)", padding: "0 20px", minHeight: 48 }}
              bodyStyle={{ padding: "12px 20px" }}
            >
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyHoursData} barCategoryGap={6}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="week"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar
                      dataKey="hours"
                      fill="#0ea5e9"
                      barSize={30}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        <style dangerouslySetInnerHTML={{
          __html: `
        .ant-table-thead > tr > th {
          background-color: var(--bg-secondary) !important;
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
        }
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
        }
      `}} />
      </div>
    </div>
  );
}
