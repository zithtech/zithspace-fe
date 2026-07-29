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

const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96;
  const h = 34;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block', width: '100%', maxWidth: '96px', height: 'auto' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const StatBox = ({ label, value, icon: Icon, color, subText }: any) => {
  // Use a pseudo-random trend for visual effect, or static
  const trend = [3, 4, 7, 5, 8, 6, 9];
  return (
    <div className="pp-stat-card" style={{ borderRadius: 0 }}>
      <div className="pp-stat-top">
        <div className="pp-stat-left">
          <span className="pp-stat-icon" style={{ background: `${color}15`, color: color }}><Icon size={16} /></span>
          <span className="pp-stat-label">{label}</span>
        </div>
      </div>
      <div className="pp-stat-bottom">
        <div className="pp-stat-value-wrap">
          <span className="pp-stat-value">{value}</span>
          <span className="pp-stat-period">{subText}</span>
        </div>
        <div className="pp-stat-spark"><AreaSparkline values={trend} color={color} /></div>
      </div>
    </div>
  );
};

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
              style={{ borderRadius: 0, background: "transparent", border: "1px solid var(--border-color)", height: "100%" }}
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
              style={{ borderRadius: 0, background: "transparent", border: "1px solid var(--border-color)", height: "100%" }}
              headStyle={{ borderBottom: "1px solid var(--border-color)", padding: "0 20px", minHeight: 48 }}
              bodyStyle={{ padding: "12px 20px" }}
            >
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyHoursData} barCategoryGap={6}>

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
        .pp-stat-card {
          background: transparent; border: 1px solid var(--border-slate-200);
          border-radius: 0 !important; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; white-space: nowrap; }
        .pp-stat-spark { opacity: 0.95; }
        
        .ant-table-thead > tr > th {
          background-color: var(--bg-secondary) !important;
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
        }
      `}} />
      </div>
    </div>
  );
}
