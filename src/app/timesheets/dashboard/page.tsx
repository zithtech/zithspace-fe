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
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";
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

const { Title, Text } = Typography;
const kpis = [
  {
    label: "Total Timesheets",
    value: 128,
    color: "#1677ff",
    icon: <ScheduleOutlined />,
  },
  {
    label: "Approved",
    value: 92,
    color: "#52c41a",
    icon: <CheckCircleOutlined />,
  },
  {
    label: "Pending Approval",
    value: 21,
    color: "#faad14",
    icon: <ClockCircleOutlined />,
  },
  {
    label: "Rejected",
    value: 15,
    color: "#ff4d4f",
    icon: <CloseCircleOutlined />,
  },
];
const statusData = [
  { name: "Approved", value: 92 },
  { name: "Pending", value: 21 },
  { name: "Rejected", value: 15 },
];

const STATUS_COLORS = ["#2e844a", "#f4b400", "#d32f2f"]; // Salesforce-like

const weeklyHoursData = [
  { week: "Week 1", hours: 150 },
  { week: "Week 2", hours: 168 },
  { week: "Week 3", hours: 172 },
  { week: "Week 4", hours: 140 },
];
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

export default function DashboardHeader() {
  return (
    <MainLayout>
      <div
        style={{
          padding: "24px", // 👈 OVERALL PADDING
          // background: "#f5f7fa",
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
          }}
        >
          {/* Left: Title */}
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Timesheet Dashboard
            </Title>
            <Text type="secondary">Weekly Activity Overview</Text>
          </div>

          {/* Right: Filters & Actions */}
          <Space size={12}>
            <Select
              prefix={<CalendarOutlined />}
              defaultValue="thisWeek"
              style={{ width: 180 }}
              options={[
                { label: "This Week", value: "thisWeek" },
                { label: "Last Week", value: "lastWeek" },
                { label: "Custom Range", value: "custom" },
              ]}
            />

            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} type="default" />
            </Tooltip>
          </Space>
        </div>

        <Row gutter={16} style={{ marginTop: 24 }}>
          {kpis.map((item) => (
            <Col key={item.label} xs={24} sm={12} md={12} lg={6}>
              <div
                style={{
                  //width:300,
                  background: "#ffffff",
                  borderRadius: 8,
                  padding: "16px 20px",
                  borderLeft: `4px solid ${item.color}`,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(0,0,0,0.12)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 1px 2px rgba(0,0,0,0.08)")
                }
              >
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 20,
                    width: 28, // circle width
                    height: 28, // circle height
                    //borderRadius: "50%", // makes it a circle
                    borderRadius: "3px",
                    background: "#e6f7ff", // light blue background
                    display: "flex", // center the icon
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

        <Row gutter={16} style={{ marginTop: 24 }}>
          {/* LEFT: Status Breakdown */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Text style={{ letterSpacing: 0.6 }}>STATUS BREAKDOWN</Text>
              }
              bordered={false}
              style={{
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                height: "100%",
              }}
            >
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    cursor="pointer" // ❌ disables grey hover highlight
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
          <Col xs={24} lg={12}>
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
            >
              <ResponsiveContainer width="100%" height={300}>
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
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
