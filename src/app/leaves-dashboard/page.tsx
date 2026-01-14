"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { TrendingUpDown, AudioLines } from "lucide-react";
import {
  Card,
  Tabs,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  List,
  Avatar,
  Space,
  Calendar,
  Badge,
  Button,
  Tooltip
} from "antd";
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  EditOutlined,
  SettingOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

// Import images from the assets folder
import bhogiImage from "../../assets/holidays/bhogi.jpg";
import pongalImage from "../../assets/holidays/pongal.jpg";
import mattuPongalImage from "../../assets/holidays/mattupongal.jpg";
import defaultHolidayImage from "../../assets/holidays/default.jpg";

const { Title } = Typography;
const { Text } = Typography;

// --- Mock Data Simulation ---
// Data derived from your other pages to populate the dashboard.

// From leave-configuration/page.tsx
const leaveTypesData = [
  { key: "1", name: "Casual Leave", status: "Active" },
  { key: "2", name: "Sick Leave", status: "Active" },
  { key: "3", name: "Loss of Pay", status: "Inactive" },
];

// From position-configuration/page.tsx
const positionConfigData = [
  {
    key: "1",
    position: "Intern",
    leaveType: "Casual Leave",
    unit: 2,
    period: "MONTH",
  },
  {
    key: "2",
    position: "Intern",
    leaveType: "Sick Leave",
    unit: 0.5,
    period: "MONTH",
  },
  {
    key: "3",
    position: "Full Time",
    leaveType: "Casual Leave",
    unit: 1.5,
    period: "MONTH",
  },
  {
    key: "4",
    position: "Full Time",
    leaveType: "Sick Leave",
    unit: 1,
    period: "MONTH",
  },
  {
    key: "5",
    position: "Full Time",
    leaveType: "Privilege Leave",
    unit: 15,
    period: "YEAR",
  },
  {
    key: "6",
    position: "Contract",
    leaveType: "Loss of Pay",
    unit: 0,
    period: "MONTH",
  },
];

// From leave-adjustments/page.tsx
const adjustmentsData = [
  {
    key: "1",
    name: "mani",
    leavetype: "Casual Leave",
    type: "Credit",
    amount: 1,
    date: dayjs().format("YYYY-MM-DD"),
  },
  {
    key: "2",
    name: "mani",
    leavetype: "Casual Leave",
    type: "Debit",
    amount: 0.5,
    date: dayjs().format("YYYY-MM-DD"),
  },
  {
    key: "3",
    name: "mani",
    leavetype: "Casual Leave",
    type: "Credit",
    amount: 2,
    date: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
  },
  {
    key: "4",
    name: "mani",
    leavetype: "Casual Leave",
    type: "Credit",
    amount: 1,
    date: dayjs().format("YYYY-MM-DD"),
  },
  {
    key: "5",
    name: "mani",
    leavetype: "Casual Leave",
    type: "Debit",
    amount: 1,
    date: dayjs().format("YYYY-MM-DD"),
  },
];

// From government-holidays/page.tsx
const holidaysData = [
  { key: 1, name: "Bhogi", from_date: "2026-01-14", status: true, image: bhogiImage },
  { key: 2, name: "Thai Pongal", from_date: "2026-01-15", status: true, image: pongalImage },
  { key: 3, name: "Mattu Pongal", from_date: "2026-01-16", status: true, image:  mattuPongalImage},
  { key: 4, name: "Tamil New Year", from_date: "2026-04-14", status: true },
  { key: 5, name: "May Day", from_date: "2026-05-01", status: true },
  { key: 6, name: "Kamarajar Birthday", from_date: "2026-07-15", status: true },
];

interface DashboardStats {
  totalLeaveTypes: number;
  activeLeaveTypes: number;
  totalPositions: number;
  avgLeavePerPosition: number;
  adjustmentsThisMonth: number;
  credits: number;
  debits: number;
  upcomingHolidays: number;
  activeHolidays: number;
  inactiveHolidays: number;
  nextHoliday?: { name: string; from_date: string };
  isHolidayToday?: boolean;
}

export default function LeavesDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching and processing data from other pages
    const calculateStats = () => {
      // Leave Config Stats
      const totalLeaveTypes = leaveTypesData.length;
      const activeLeaveTypes = leaveTypesData.filter(
        (lt) => lt.status === "Active"
      ).length;

      // Position Config Stats
      const uniquePositions = [
        ...new Set(positionConfigData.map((p) => p.position)),
      ];
      const totalPositions = uniquePositions.length;
      const totalLeaves = positionConfigData.reduce((sum, p) => {
        const yearlyLeaves = p.period === "MONTH" ? p.unit * 12 : p.unit;
        return sum + yearlyLeaves;
      }, 0);
      const avgLeavePerPosition =
        totalPositions > 0 ? Math.round(totalLeaves / totalPositions) : 0;

      // Adjustments Stats
      const adjustmentsThisMonth = adjustmentsData.filter((adj) =>
        dayjs(adj.date).isSame(dayjs(), "month")
      ).length;
      const credits = adjustmentsData
        .filter((adj) => adj.type === "Credit")
        .reduce((sum, adj) => sum + adj.amount, 0);
      const debits = adjustmentsData
        .filter((adj) => adj.type === "Debit")
        .reduce((sum, adj) => sum + adj.amount, 0);

      // Holidays Stats (assuming today is Jan 14, 2026 for consistent upcoming count)
      const today = dayjs("2026-01-14");
      const todayStr = today.format("YYYY-MM-DD");
      const upcomingHolidays = holidaysData.filter(
        (h) =>
          h.status &&
          dayjs(h.from_date).isAfter(today) &&
          dayjs(h.from_date).diff(today, "day") <= 90
      ).length;
      const nextHoliday = holidaysData
        .filter((h) => h.status && (dayjs(h.from_date).isAfter(today) || h.from_date === todayStr))
        .sort(
          (a, b) => dayjs(a.from_date).valueOf() - dayjs(b.from_date).valueOf()
        )[0];

      const isHolidayToday = nextHoliday ? nextHoliday.from_date === todayStr : false;

      const activeHolidays = holidaysData.filter((h) => h.status).length;
      const inactiveHolidays = holidaysData.length - activeHolidays;

      setStats({
        totalLeaveTypes,
        activeLeaveTypes,
        totalPositions,
        avgLeavePerPosition,
        adjustmentsThisMonth,
        credits,
        debits,
        upcomingHolidays,
        activeHolidays,
        inactiveHolidays,
        nextHoliday,
        isHolidayToday,
      });
      setLoading(false);
    };

    const timer = setTimeout(calculateStats, 500); // Simulate network delay
    return () => clearTimeout(timer);
  }, []);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>
          <div style={{ marginTop: 14 }}>
            <Tabs
              activeKey="dashboard"
              onChange={(key) => {
                if (key === "dashboard") router.push("/leaves-dashboard");
                if (key === "leaves") router.push("/leaves");
                if (key === "holidays") router.push("/government-holidays");
                if (key === "adjustments") router.push("/leave-adjustments");
                if (key === "configuration")
                  router.push("/leave-configuration");
                if (key === "positions") router.push("/position-configuration");
              }}
              items={[
                {
                  key: "dashboard",
                  label: (
                    <span>
                      <AppstoreOutlined /> Dashboard
                    </span>
                  ),
                },
                {
                  key: "leaves",
                  label: (
                    <span>
                      <ClockCircleOutlined /> My Leave Status
                    </span>
                  ),
                },
                {
                  key: "holidays",
                  label: (
                    <span>
                      <ScheduleOutlined /> Government Holidays
                    </span>
                  ),
                },
                {
                  key: "adjustments",
                  label: (
                    <span>
                      <EditOutlined /> Leave Adjustment
                    </span>
                  ),
                },
                {
                  key: "configuration",
                  label: (
                    <span>
                      <SettingOutlined /> Leave Configuration
                    </span>
                  ),
                },
                {
                  key: "positions",
                  label: (
                    <span>
                      <ApartmentOutlined /> Position Configuration
                    </span>
                  ),
                },
              ]}
            />
          </div>
          <Title level={3} style={{ marginBottom: 24 }}>
            Leaves Dashboard
          </Title>

          <Row gutter={[16, 16]}>
            {/* postion configuration */}
            <Col xs={24} sm={12} md={6}>
              <Card
                loading={loading}
                size="small"
                hoverable
                onClick={() => router.push("/leave-configuration")}
                style={{
                  borderLeft: `4px solid #872eecff`,
                  borderRadius: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Total Leave Types</Text>
                  <Text strong style={{ fontSize: 18 }}>
                    <Space>
                      <SettingOutlined />
                      {stats?.totalLeaveTypes}
                    </Space>
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                loading={loading}
                hoverable
                onClick={() => router.push("/leave-configuration")}
                size="small"
                style={{
                  borderLeft: `4px solid #1c1515cf`,
                  borderRadius: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Active Leave Types</Text>
                  <Text strong style={{ fontSize: 18, color: "#3f8600" }}>
                    <Space>
                      <AudioLines size={20} />
                      {stats?.activeLeaveTypes}
                    </Space>
                  </Text>
                </div>
              </Card>
            </Col>
            {/* postion configuration */}
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                onClick={() => router.push("/position-configuration")}
                loading={loading}
                size="small"
                style={{
                  borderLeft: `4px solid #2e94e8ff`,
                  borderRadius: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Total Positions</Text>
                  <Text strong style={{ fontSize: 18 }}>
                    <Space>
                      <ApartmentOutlined />
                      {stats?.totalPositions}
                    </Space>
                  </Text>
                </div>
              </Card>
            </Col>
            {/* postion configuration */}
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                onClick={() => router.push("/position-configuration")}
                loading={loading}
                size="small"
                style={{
                  borderLeft: `4px solid #4fef85ff`,
                  borderRadius: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Avg Leave / Position</Text>
                  <Text strong style={{ fontSize: 18 }}>
                    <Space>
                      <CalendarOutlined />
                      {stats?.avgLeavePerPosition} days
                    </Space>
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                onClick={() => router.push("/leave-adjustments")}
                loading={loading}
                size="small"
                style={{
                  borderLeft: `4px solid #8543ffff`,
                  borderRadius: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Adjustments This Month</Text>
                  <Text strong style={{ fontSize: 18 }}>
                    <Space>
                      <EditOutlined />
                      {stats?.adjustmentsThisMonth}
                    </Space>
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                onClick={() => router.push("/leave-adjustments")}
                loading={loading}
                size="small"
                style={{
                  borderLeft: `4px solid #ff665bff`,
                  borderRadius: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Credits vs Debits</Text>
                  <Text strong style={{ fontSize: 18 }}>
                    <Space>
                      <TrendingUpDown size={20} />
                      {`${stats?.credits || 0} / ${stats?.debits || 0}`}
                    </Space>
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                onClick={() => router.push("/government-holidays")}
                loading={loading}
                size="small"
                style={{
                  borderLeft: `4px solid #ffa633ff`,
                  borderRadius: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Holidays Status</Text>
                  <Text strong style={{ fontSize: 18 }}>
                    {`${stats?.activeHolidays || 0} / ${stats?.inactiveHolidays || 0}`}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                onClick={() => router.push("/government-holidays")}
                loading={loading}
                bordered={false}
                style={{
                  borderRadius: 14,
                  borderLeft: `4px solid #5e5e5eff`,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary" style={stats?.isHolidayToday ? { color: "#faad14", fontWeight: 600 } : {}}>
                    {stats?.isHolidayToday ? "Today's Holiday" : "Upcoming Holiday"}
                  </Text>
                  <Text strong style={{ fontSize: 16 }}>
                    <Space>
                      <CalendarOutlined />
                      {stats?.nextHoliday ? (
                        <span>
                          {stats.nextHoliday.name}{" "}
                          <span style={{ fontSize: 12, color: "gray" }}>
                            {dayjs(stats.nextHoliday.from_date).format("DD MMM")}
                          </span>
                        </span>
                      ) : (
                        "None"
                      )}
                    </Space>
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title="Recent Leave Adjustments"
                loading={loading}
                hoverable
                size="small"
                bordered={false}
                style={{
                  borderRadius: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  width:399
                }}
                extra={
                  <Typography.Link
                    onClick={() => router.push("/leave-adjustments")}
                  >
                    View All
                  </Typography.Link>
                }
              >
                {/* Scroll container */}
                <div
                  style={{
                   maxHeight: 300, // 👈 height for ~4 items
                    overflowY: "auto", // 👈 enable scroll
                      paddingRight: 10,
                  }}
                >
                  <List
                    dataSource={adjustmentsData}
                    renderItem={(item) => {
                      const isCredit = item.type === "Credit";

                      return (
                        <List.Item style={{ padding: "8px 0" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              gap: 8,
                            }}
                          >
                            {/* Avatar */}
                            <Avatar
                              size={44}
                              style={{
                                backgroundColor: isCredit
                                  ? "#c9eeff"
                                  : "#fff1f0",
                                color: isCredit ? "#1677ff" : "#f5222d",
                                fontWeight: 600,
                              }}
                            >
                              {item.name?.[0]}
                            </Avatar>

                            {/* Name + Leave Type */}
                            <div style={{ flex: 1 }}>
                              <Text strong>{item.name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.leavetype}
                              </Text>
                            </div>

                            {/* Amount + Type */}
                            <Space>
                              <Tag
                                color={isCredit ? "success" : "error"}
                                style={{ borderRadius: 12 }}
                              >
                                {isCredit ? "+" : "-"} {item.amount ?? 1} Day
                              </Tag>

                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.type}
                              </Text>
                            </Space>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                </div>
              </Card>
            </Col>
           <Col xs={24} md={12}>
  <Card
    loading={loading}
    bordered={false}
    hoverable
    size="small"
    style={{
      borderRadius: 14,
      boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      width:399,
      right:260,
    }}
    title={
      <Space>
        <CalendarOutlined style={{ color: "#ff4d4f" }} />
        <Text strong>Holiday Calendar</Text>
      </Space>
    }
    extra={
      <Tag color="error" style={{ borderRadius: 12 }}>
        ● Holiday
      </Tag>
    }
  >
    <Calendar
      fullscreen={false}
      headerRender={({ value, onChange }) => (
        <div
          style={{
            padding: "0 0 8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            
          }}
        >
          <Text strong style={{ fontSize: 14 }}>
            {value.format("MMMM YYYY")}
          </Text>

          <Space>
            <Button
              size="small"
              onClick={() =>
                onChange(value.clone().subtract(1, "month"))
              }
            >
              ‹
            </Button>
            <Button
              size="small"
              onClick={() =>
                onChange(value.clone().add(1, "month"))
              }
            >
              ›
            </Button>
          </Space>
        </div>
      )}
      cellRender={(value, info) => {
        if (info.type === "date") {
          const dateString = value.format("YYYY-MM-DD");
          const holiday = holidaysData.find(
            (h) => h.from_date === dateString && h.status
          );

          if (holiday) {
            return (
              <Tooltip
                title={
                  <div style={{ textAlign: "center" }}>
                    <img
                      // Use the specific holiday image, or fallback to default
                      src={holiday.image ? holiday.image.src : defaultHolidayImage.src}
                      alt={holiday.name}
                      style={{ width: 120, height: "auto", borderRadius: 4, marginBottom: 4 }}
                    />
                    <div style={{ fontWeight: 600 }}>{holiday.name}</div>
                  </div>
                }
              >
                <div style={{ textAlign: "center", marginTop: 4, cursor: "pointer" }}>
                  <Badge color="red" />
                </div>
              </Tooltip>
            );
          }
        }
        return null;
      }}
    />

    {/* Legend */}
    {/* <div
      style={{
        marginTop: 12,
        display: "flex",
        justifyContent: "flex-end",
      }}
    > */}
      {/* <Space size={12}>
        <Space size={6}>
          <Badge color="red" />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Holiday
          </Text>
        </Space>
      </Space>
    </div> */}
  </Card>
</Col>

          </Row>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
