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
  Tooltip,
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
  PlusOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useLeaveTypes } from "@/hooks/useLeaveTypes";
import { useCompanyGovernmentHolidays } from "@/hooks/useCompanyGovernmentHolidays";
import dayjs from "dayjs";

// Import images from the assets folder
import bhogiImage from "../../assets/holidays/bhogi.jpg";
import pongalImage from "../../assets/holidays/pongal.jpg";
import mattuPongalImage from "../../assets/holidays/mattupongal.jpg";
import defaultHolidayImage from "../../assets/holidays/default.jpg";


const { Text } = Typography;

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

const holidayImageMap: { [key: string]: any } = {
  "Bhogi": bhogiImage,
  "Thai Pongal": pongalImage,
  "Mattu Pongal": mattuPongalImage,
};

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

  const {
    leaveTypes,
    loading: leaveTypesLoading,
    fetchLeaveTypes,
  } = useLeaveTypes();
  const {
    holidays,
    loading: holidaysLoading,
    fetchHolidays,
  } = useCompanyGovernmentHolidays();

  const loading = leaveTypesLoading || holidaysLoading;

  useEffect(() => {
    fetchLeaveTypes();
    fetchHolidays();
  }, [fetchLeaveTypes, fetchHolidays]);

  useEffect(() => {
    if (loading || !leaveTypes || !holidays) {
      return;
    }

    const calculateStats = () => {
      // Leave Config Stats
      const totalLeaveTypes = leaveTypes.length;
      const activeLeaveTypes = leaveTypes.filter(
        (lt) => lt.isActive,
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
        dayjs(adj.date).isSame(dayjs(), "month"),
      ).length;
      const credits = adjustmentsData
        .filter((adj) => adj.type === "Credit")
        .reduce((sum, adj) => sum + adj.amount, 0);
      const debits = adjustmentsData
        .filter((adj) => adj.type === "Debit")
        .reduce((sum, adj) => sum + adj.amount, 0);

      // Holidays Stats
      const today = dayjs();
      const upcomingHolidays = holidays.filter(
        (h) =>
          h.status === "ACTIVE" &&
          dayjs(h.fromDate).isAfter(today) &&
          dayjs(h.fromDate).diff(today, "day") <= 90,
      ).length;
      const nextHolidayRaw = holidays
        .filter(
          (h) =>
            h.status === "ACTIVE" &&
            (dayjs(h.fromDate).isAfter(today) ||
              dayjs(h.fromDate).isSame(today, "day")),
        )
        .sort(
          (a, b) => dayjs(a.fromDate).valueOf() - dayjs(b.fromDate).valueOf(),
        )[0];

      const nextHoliday = nextHolidayRaw
        ? { name: nextHolidayRaw.holidayName, from_date: nextHolidayRaw.fromDate }
        : undefined;

      const isHolidayToday = nextHolidayRaw
        ? dayjs(nextHolidayRaw.fromDate).isSame(today, "day")
        : false;

      const activeHolidays = holidays.filter(
        (h) => h.status === "ACTIVE",
      ).length;
      const inactiveHolidays = holidays.length - activeHolidays;

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
    };

    calculateStats();
  }, [loading, leaveTypes, holidays]);
  const cardStyle = {
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease",
    cursor: "pointer",
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>
          <div >
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
                if (key === "addLeaves") router.push("/add-goverment-leaves");
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
                      <ClockCircleOutlined /> Apply Leave
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
                {
                  key: "addLeaves",
                  label: (
                    <span>
                      <PlusOutlined /> Add Government Leaves
                    </span>
                  ),
                },
              ]}
            />
          </div>
          <Row gutter={[16, 16]}>
            {/* postion configuration */}
            <Col xs={24} sm={12} md={6}>
              <Card
                loading={loading}
                size="small"
                onClick={() => router.push("/leave-configuration")}
                bodyStyle={{ padding: 16 }}
                style={{
                  ...cardStyle,
                }}
              >
                <Row align="middle" justify="space-between">
                  {/* LEFT SIDE - Title */}
                  <Col>
                    <div style={{ color: "#595959", fontSize: 14 }}>
                      Total Leave Types
                    </div>
                  </Col>

                  {/* RIGHT SIDE - Icon + Number */}
                  <Col>
                    <Row align="middle" gutter={12}>
                      {/* ICON */}
                      <Col>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#872eecff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 19,
                          }}
                        >
                          <SettingOutlined />
                        </div>
                      </Col>

                      {/* NUMBER */}
                      <Col>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 600,
                            color: "#872eecff",
                          }}
                        >
                          {stats?.totalLeaveTypes}
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                loading={loading}
                onClick={() => router.push("/leave-configuration")}
                size="small"
                bodyStyle={{ padding: 16 }}
                style={{
                  ...cardStyle,
                  border: "none",
                }}
              >
                <Row align="middle" justify="space-between">
                  {/* LEFT - Name */}
                  <Col>
                    <div style={{ color: "#595959", fontSize: 14 }}>
                      Active Leave Types
                    </div>
                  </Col>

                  {/* RIGHT - Icon → Number */}
                  <Col>
                    <Row align="middle" gutter={10}>
                      {/* ICON */}
                      <Col>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#3f8600",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 18,
                          }}
                        >
                          <AudioLines size={18} />
                        </div>
                      </Col>

                      {/* NUMBER */}
                      <Col>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 600,
                            color: "#3f8600",
                          }}
                        >
                          {stats?.activeLeaveTypes}
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            {/* postion configuration */}
            <Col xs={24} sm={12} md={6}>
              <Card
                onClick={() => router.push("/position-configuration")}
                loading={loading}
                size="small"
                bodyStyle={{ padding: 16 }}
                style={{
                  ...cardStyle,
                  border: "none",
                }}
              >
                <Row align="middle" justify="space-between">
                  {/* LEFT - Title */}
                  <Col>
                    <div style={{ color: "#595959", fontSize: 14 }}>
                      Total Positions
                    </div>
                  </Col>

                  {/* RIGHT - Icon → Number */}
                  <Col>
                    <Row align="middle" gutter={12}>
                      {/* ICON */}
                      <Col>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#2e94e8ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 18,
                          }}
                        >
                          <ApartmentOutlined />
                        </div>
                      </Col>

                      {/* NUMBER */}
                      <Col>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 600,
                            color: "#2e94e8ff",
                          }}
                        >
                          {stats?.totalPositions}
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            {/* postion configuration */}
            <Col xs={24} sm={12} md={6}>
              <Card
                onClick={() => router.push("/position-configuration")}
                loading={loading}
                size="small"
                bodyStyle={{ padding: 16 }}
                style={{
                  ...cardStyle,
                  border: "none",
                }}
              >
                <Row align="middle" justify="space-between">
                  {/* LEFT - Title */}
                  <Col>
                    <div style={{ color: "#595959", fontSize: 14 }}>
                      Avg Leave / Position
                    </div>
                  </Col>

                  {/* RIGHT - Icon → Number */}
                  <Col>
                    <Row align="middle" gutter={12}>
                      {/* ICON */}
                      <Col>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#4fef85ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 18,
                          }}
                        >
                          <CalendarOutlined />
                        </div>
                      </Col>

                      {/* NUMBER */}
                      <Col>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: "#3f8600",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {stats?.avgLeavePerPosition} days
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                onClick={() => router.push("/leave-adjustments")}
                loading={loading}
                size="small"
                bodyStyle={{ padding: 16 }}
                style={{
                  ...cardStyle,
                  border: "none",
                }}
              >
                <Row align="middle" justify="space-between">
                  {/* LEFT - Title */}
                  <Col>
                    <div style={{ color: "#595959", fontSize: 14 }}>
                      Adjustments This Month
                    </div>
                  </Col>

                  {/* RIGHT - Icon → Number */}
                  <Col>
                    <Row align="middle" gutter={12}>
                      {/* ICON */}
                      <Col>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#ec51e6ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 18,
                          }}
                        >
                          <EditOutlined />
                        </div>
                      </Col>

                      {/* NUMBER */}
                      <Col>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 600,
                            color: "#8543ffff",
                          }}
                        >
                          {stats?.adjustmentsThisMonth}
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                onClick={() => router.push("/leave-adjustments")}
                loading={loading}
                size="small"
                bodyStyle={{ padding: 16 }}
                style={{
                  ...cardStyle,
                  border: "none",
                }}
              >
                <Row align="middle" justify="space-between">
                  {/* LEFT - Title */}
                  <Col>
                    <div style={{ color: "#595959", fontSize: 14 }}>
                      Credits vs Debits
                    </div>
                  </Col>

                  {/* RIGHT - Icon → Number */}
                  <Col>
                    <Row align="middle" gutter={12}>
                      {/* ICON */}
                      <Col>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#ff665bff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 18,
                          }}
                        >
                          <TrendingUpDown size={18} />
                        </div>
                      </Col>

                      {/* NUMBER */}
                      <Col>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: "#ff665bff",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {`${stats?.credits || 0} / ${stats?.debits || 0}`}
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card
                onClick={() => router.push("/government-holidays")}
                loading={loading}
                size="small"
                bodyStyle={{ padding: 16 }}
                style={{
                  ...cardStyle,
                  border: "none",
                }}
              >
                <Row align="middle" justify="space-between">
                  {/* LEFT - Title */}
                  <Col>
                    <div style={{ color: "#595959", fontSize: 14 }}>
                      Holidays Status
                    </div>
                  </Col>

                  {/* RIGHT - Icon → Number */}
                  <Col>
                    <Row align="middle" gutter={12}>
                      {/* ICON */}
                      <Col>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "#efdc08ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 18,
                          }}
                        >
                          <CalendarOutlined />
                        </div>
                      </Col>

                      {/* NUMBER */}
                      <Col>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: "#efdc08ff",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {`${stats?.activeHolidays || 0} / ${stats?.inactiveHolidays || 0}`}
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                onClick={() => router.push("/government-holidays")}
                loading={loading}
                bordered={false}
                bodyStyle={{ padding: 16 }}
                style={{
                  ...cardStyle,
                }}
              >
                <Row align="middle" justify="space-between">
                  {/* LEFT - Title */}
                  <Col>
                    <div
                      style={
                        stats?.isHolidayToday
                          ? { color: "#faad14", fontWeight: 600, fontSize: 14 }
                          : { color: "#595959", fontSize: 14 }
                      }
                    >
                      {stats?.isHolidayToday
                        ? "Today's Holiday"
                        : "Upcoming Holiday"}
                    </div>
                  </Col>

                  {/* RIGHT - Icon → Text */}
                  <Col>
                    <Row align="middle" gutter={10}>
                      {/* ICON */}
                      <Col>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#faad14",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 16,
                          }}
                        >
                          <CalendarOutlined />
                        </div>
                      </Col>

                      {/* TEXT */}
                      <Col>
                        <div
                          style={{
                            fontSize: 19,
                            fontWeight: 600,
                            color: "#8b8b8bff",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {stats?.nextHoliday ? (
                            <>
                              {stats.nextHoliday.name}
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#8c8c8c",
                                  marginLeft: 6,
                                }}
                              >
                                {dayjs(stats.nextHoliday.from_date).format(
                                  "DD MMM",
                                )}
                              </span>
                            </>
                          ) : (
                            "None"
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title="Recent Leave Adjustments"
                loading={loading}
                size="small"
                bordered={false}
                style={{
                  borderRadius: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  width: "100%",
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
                size="small"
                style={{
                  borderRadius: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  width: "100%",
                  //right: 260,
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
                  fullCellRender={(value) => {
                    const dateString = value.format("YYYY-MM-DD");
                    const holiday = holidays.find(
                      (h) => h.fromDate === dateString && h.status === "ACTIVE",
                    );

                    const content = (
                      <div className="ant-picker-cell-inner">
                        <div className="ant-picker-calendar-date-value">
                          {value.date()}
                        </div>
                        <div className="ant-picker-calendar-date-content">
                          {holiday && <Badge color="red" />}
                        </div>
                      </div>
                    );

                    if (holiday) {
                      return (
                        <Tooltip
                          title={
                            <div style={{ textAlign: "center" }}>
                              <img
                                // Use the specific holiday image, or fallback to default
                                src={
                                  (holidayImageMap[holiday.holidayName] ||
                                    defaultHolidayImage)
                                    .src
                                }
                                alt={holiday.holidayName}
                                style={{
                                  width: 120,
                                  height: "auto",
                                  borderRadius: 4,
                                  marginBottom: 4,
                                }}
                              />
                              <div style={{ fontWeight: 600 }}>
                                {holiday.holidayName}
                              </div>
                            </div>
                          }
                        >
                          {content}
                        </Tooltip>
                      );
                    }
                    return content;
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
