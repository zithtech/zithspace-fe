"use client";
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
  ScheduleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
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
import isoWeek from "dayjs/plugin/isoWeek";


const { Title, Text } = Typography;

const STATUS_COLORS = ["#2e844a", "#f4b400", "#d32f2f"]; // Salesforce-like

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
            background: "#ffffff",
            padding: "12px 14px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            border: "1px solid #f0f0f0",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {label}
          </div>

          <div
            style={{
              color: "#1677ff", // Salesforce blue
              fontWeight: 500,
            }}
          >
            Total Hours : {payload[0].value} hours
          </div>
        </div>
      );
    }

    return null;
  };
  const kpis = [
    {
      label: "Total Timesheets",
      value: total,
      color: "#1677ff",
      icon: <ScheduleOutlined />,
    },
    {
      label: "Approved",
      value: approved,
      color: "#52c41a",
      icon: <CheckCircleOutlined />,
    },
    {
      label: "Pending Approval",
      value: pending,
      color: "#faad14",
      icon: <ClockCircleOutlined />,
    },
    {
      label: "Rejected",
      value: rejected,
      color: "#ff4d4f",
      icon: <CloseCircleOutlined />,
    },
  ];
  const statusData = [
    { name: "Approved", value: approved },
    { name: "Pending", value: pending },
    { name: "Rejected", value: rejected },
  ];

  return (
    <div
      style={{
        padding: "12px", // 👈 padding reduce
        height: "calc(100vh - 112px)", // 👈 fixed viewport height
        overflow: "hidden", // 👈 page scroll stop
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          background: "#ffffff",
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: 24,
          marginTop: "10px",
        }}
      >
        {/* Left: Title */}
        <div>
          <Title
            level={4}
            style={{
              margin: 0,
              marginTop: "6px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <DashboardOutlined style={{ color: "#1677ff" }} />
            Timesheet Dashboard
          </Title>
          <Text style={{ marginLeft: "27px" }} type="secondary">
            Weekly Activity Overview
          </Text>
        </div>
        <Space size={12}>
          <Select
            prefix={<CalendarOutlined />}
            value={weekFilter}
            style={{ width: 180 }}
            onChange={(value) => {
              console.log("SELECT CHANGE 👉", value); // 👈 DEBUG
              setWeekFilter(value);
            }}
            options={[
              { label: "All Weeks", value: "all" },
              { label: "This Week", value: "thisWeek" },
              { label: "Last Week", value: "lastWeek" },
            ]}
          />
          <Tooltip title="Refresh">
            <Button
              icon={<ReloadOutlined />}
              type="default"
              onClick={() => window.location.reload()}
            />
          </Tooltip>
          

        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {kpis.map((item) => (
          <Col key={item.label} xs={24} sm={12} md={12} lg={6}>
            <div
              style={{
                position: "relative",
                background: "#ffffff",
                borderRadius: 8,
                padding: "12px 10px",
                borderLeft: `4px solid ${item.color}`,
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                transition: "all 0.2s ease",
                cursor: "pointer",
                height: "100%",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 10px rgba(0,0,0,0.12)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.08)")
              }
            >
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 20,
                  width: 28,
                  height: 28,
                  borderRadius: "3px",
                  background: "#e6f7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: item.color,
                }}
              >
                {item.icon}
              </div>

              {/* Number */}
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: "#1f1f1f",
                  marginBottom: 4,
                }}
              >
                {item.value}
              </div>

              {/* Label */}
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </Text>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        {/* LEFT: Status Breakdown */}
        <Col xs={24} lg={12} style={{ marginBottom: 24 }}>
          <Card
            title={<Text style={{ letterSpacing: 0.6 }}>STATUS BREAKDOWN</Text>}
            bordered={false}
            style={{
              borderRadius: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              height: "100%",
            }}
            bodyStyle={{
              padding: "8px 12px",
            }}
            headStyle={{
              padding: "8px 12px",
              minHeight: "auto",
            }}
          >
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={STATUS_COLORS[index]} />
                    ))}
                  </Pie>

                  {/* Custom Tooltip */}
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div
                            style={{
                              background: "#fff",
                              border: "1px solid #ccc",
                              padding: "6px 10px",
                              borderRadius: 4,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              fontSize: 12,
                            }}
                          >
                            <strong>{payload[0].name}</strong>:{" "}
                            {payload[0].value}
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
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginTop: 12,
              }}
            >
              {statusData.map((item, i) => (
                <div
                  key={item.name}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      background: STATUS_COLORS[i],
                      borderRadius: 2,
                    }}
                  />
                  <Text>{item.name}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* RIGHT: Weekly Hours Trend */}
        <Col xs={24} lg={12} style={{ marginBottom: 24 }}>
          <Card
            title={
              <Text style={{ letterSpacing: 0.6 }}>WEEKLY HOURS TREND</Text>
            }
            bordered={false}
            style={{
              borderRadius: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              height: "100%",
            }}
            bodyStyle={{ paddingBottom: 12 }}
          >
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyHoursData} barCategoryGap={6}>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} />

                  <XAxis dataKey="week" axisLine={false} tickLine={false} />

                  <YAxis axisLine={false} tickLine={false} />

                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#d9d9d9" }} // 👈 grey hover background
                  />

                  <Bar
                    dataKey="hours"
                    fill="#1677ff"
                    barSize={40}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
