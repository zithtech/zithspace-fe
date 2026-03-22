
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Space,
  Spin,
  Tag,
  Button,
  Table,
  Avatar,
  Statistic,
  Progress,
} from "antd";
import {
  UserOutlined,
  FilterOutlined,
  TagOutlined,
  FileTextOutlined,
  TeamOutlined,
  BankOutlined,
  FlagOutlined,
  StarOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";
import { MembersService } from "@/services/membersService";
import {
  AttendanceService,
  AttendanceSummary,
} from "@/services/attendanceService";
import { usePerformance } from "@/hooks/userPerformance";
import { usePositions } from "@/hooks/usePositions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import dayjs from "dayjs";

const { Option } = Select;
const { Title, Text } = Typography;

export default function PerformanceManagePage() {
  const [loading, setLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>();
  const [selectedMonth, setSelectedMonth] = useState<string>("3");
  const [selectedYear, setSelectedYear] = useState<string>("2026");

  // State for selected user's full details including position
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);

  // Get all positions data
  const { dataSource: positions, loading: positionsLoading } = usePositions();

  // Attendance summary state
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>(
    {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      totalWorkingMinutes: 0,
      totalOvertimeMinutes: 0,
      averageWorkingHours: 0,
    },
  );

  // Filters for API
  const [appliedFilters, setAppliedFilters] = useState<{
    userId?: string;
    month?: string;
    year?: string;
  }>({});

  // Check if selected month is in the future
  const isFutureMonth = useMemo(() => {
    const today = dayjs();
    const selectedDate = dayjs(`${selectedYear}-${selectedMonth}-01`);
    return selectedDate.isAfter(today, "month");
  }, [selectedYear, selectedMonth]);

  // Use the performance hook
  const { data: performanceData, isLoading: performanceLoading } =
    usePerformance(appliedFilters);

  // Fetch members on page load
  useEffect(() => {
    fetchMembers();
  }, []);

  // Fetch attendance data when filters are applied (only if not future month)
  useEffect(() => {
    if (
      appliedFilters.userId &&
      appliedFilters.month &&
      appliedFilters.year &&
      !isFutureMonth
    ) {
      fetchAttendanceSummary();
    } else if (isFutureMonth) {
      // Reset attendance summary for future months
      setAttendanceSummary({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDays: 0,
        totalWorkingMinutes: 0,
        totalOvertimeMinutes: 0,
        averageWorkingHours: 0,
      });
    }
  }, [appliedFilters, isFutureMonth]);

  // Fetch selected user details when member is selected
  useEffect(() => {
    if (selectedMember && members.length > 0) {
      const member = members.find((m) => m.value === selectedMember);
      setSelectedUserDetails(member || null);
    } else {
      setSelectedUserDetails(null);
    }
  }, [selectedMember, members]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const membersData = await MembersService.getMembersForSelect({
        role: "user",
      });

      // Enhance members data with position info if available
      // You may need to fetch additional details here
      setMembers(membersData || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance summary from API
  const fetchAttendanceSummary = async () => {
    if (!appliedFilters.userId || !appliedFilters.month || !appliedFilters.year)
      return;

    try {
      setAttendanceLoading(true);

      const selectedYearNum = parseInt(appliedFilters.year);
      const selectedMonthNum = parseInt(appliedFilters.month);

      // Calculate start and end dates for the selected month
      const startDate = dayjs()
        .year(selectedYearNum)
        .month(selectedMonthNum - 1)
        .startOf("month")
        .format("YYYY-MM-DD");

      const endDate = dayjs()
        .year(selectedYearNum)
        .month(selectedMonthNum - 1)
        .endOf("month")
        .format("YYYY-MM-DD");

      console.log("📅 Fetching attendance for:", {
        userId: appliedFilters.userId,
        month: selectedMonthNum,
        year: selectedYearNum,
        startDate,
        endDate,
      });

      // Fetch all attendance records for this user in the date range
      const response = await AttendanceService.getAttendance({
        userId: appliedFilters.userId,
        startDate,
        endDate,
        limit: 1000,
      });

      console.log("📊 Attendance API Response:", response);

      const attendanceRecords = response?.data || [];

      // Calculate summary from attendance records
      const totalDays = daysInMonth;
      const presentDays = attendanceRecords.filter(
        (r: any) =>
          r.status === "present" ||
          r.status === "late" ||
          r.status === "half-day",
      ).length;

      const absentDays = attendanceRecords.filter(
        (r: any) => r.status === "absent",
      ).length;

      const lateDays = attendanceRecords.filter(
        (r: any) => r.status === "late",
      ).length;

      const halfDays = attendanceRecords.filter(
        (r: any) => r.status === "half-day",
      ).length;

      // Calculate working minutes
      const totalWorkingMinutes = attendanceRecords.reduce(
        (sum: number, r: any) => sum + (r.workingMinutes || 0),
        0,
      );

      const totalOvertimeMinutes = attendanceRecords.reduce(
        (sum: number, r: any) => sum + (r.overtimeMinutes || 0),
        0,
      );

      const averageWorkingHours =
        presentDays > 0 ? totalWorkingMinutes / presentDays / 60 : 0;

      const summary = {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        totalWorkingMinutes,
        totalOvertimeMinutes,
        averageWorkingHours: Math.round(averageWorkingHours * 10) / 10,
      };

      console.log("📊 Calculated Attendance Summary:", summary);
      setAttendanceSummary(summary);
    } catch (error) {
      console.error("Failed to fetch attendance summary:", error);
      setAttendanceSummary({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDays: 0,
        totalWorkingMinutes: 0,
        totalOvertimeMinutes: 0,
        averageWorkingHours: 0,
      });
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Apply filters
  const handleApply = () => {
    if (selectedMember && selectedMonth && selectedYear) {
      setAppliedFilters({
        userId: selectedMember,
        month: selectedMonth,
        year: selectedYear,
      });
    }
  };

  // Month options
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = ["2024", "2025", "2026"];

  // Ticket data from API
  const ticketSummary = performanceData?.tickets?.summary || {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  };

  const ticketDistribution = performanceData?.tickets?.distribution || [];

  // Daily Updates data from API
  const dailyUpdatesSummary = performanceData?.dailyUpdates?.summary || {
    bod: 0,
    eod: 0,
    total: 0,
  };

  // Get the updates that exist
  const existingUpdates = performanceData?.dailyUpdates?.logs || [];

  // Table columns for Daily Updates
  const dailyUpdateColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 100,
      render: (text: string) => dayjs(text).format("DD MMM"),
    },
    {
      title: "BOD",
      dataIndex: "bod",
      key: "bod",
      width: 60,
      align: "center" as const,
      render: (bod: boolean) => (bod ? "✅" : "❌"),
    },
    {
      title: "EOD",
      dataIndex: "eod",
      key: "eod",
      width: 60,
      align: "center" as const,
      render: (eod: boolean) => (eod ? "✅" : "❌"),
    },
    {
      title: "Status",
      dataIndex: "type",
      key: "type",
      width: 90,
      render: (type: string, record: any) => {
        if (record.bod && record.eod) return "Complete";
        if (record.bod) return "BOD Only";
        if (record.eod) return "EOD Only";
        return "Missed";
      },
    },
  ];

  // Calculate days in month based on applied filters
  const appliedMonth = appliedFilters.month || selectedMonth;
  const appliedYear = appliedFilters.year || selectedYear;
  const daysInMonth = dayjs(`${appliedYear}-${appliedMonth}-01`).daysInMonth();

  // Calculate summary statistics
  const completionRate =
    ticketSummary.total > 0
      ? Math.round((ticketSummary.completed / ticketSummary.total) * 100)
      : 0;

  const updateRate =
    Math.round((dailyUpdatesSummary.total / daysInMonth) * 100) || 0;

  // Calculate attendance rate (only if not future month and has data)
  const attendanceRate =
    !isFutureMonth && attendanceSummary.totalDays > 0
      ? Math.round(
          (attendanceSummary.presentDays / attendanceSummary.totalDays) * 100,
        )
      : 0;

  // Performance score - exclude attendance for future months
  const performanceScore =
    !isFutureMonth && appliedFilters.userId
      ? Math.round((completionRate + updateRate + attendanceRate) / 3)
      : Math.round((completionRate + updateRate) / 2);

  // BOD and EOD out of format
  const bodOutOf = `${dailyUpdatesSummary.bod}/${daysInMonth}`;
  const eodOutOf = `${dailyUpdatesSummary.eod}/${daysInMonth}`;

  // Attendance out of format
  const presentOutOf = `${attendanceSummary.presentDays}/${daysInMonth}`;
  const lateOutOf = `${attendanceSummary.lateDays}/${daysInMonth}`;
  const absentOutOf = `${attendanceSummary.absentDays}/${daysInMonth}`;

  // Get position tags for selected user
  const positionTags = useMemo(() => {
    if (!selectedUserDetails || !positions.length) return [];

    const tags = [];

    // Try to find matching position based on user's role/department
    // This logic needs to be adjusted based on your actual data structure

    // For now, we'll show some sample tags if position data exists
    if (positions.length > 0) {
      // You need to map user to position based on your data structure
      // Example: If user has positionId in their details
      // const userPosition = positions.find(p => p.id === selectedUserDetails.positionId);

      // For demo, showing first position from list
      const samplePosition = positions[0];

      if (samplePosition) {
        if (samplePosition.title) {
          tags.push({
            icon: <FlagOutlined />,
            color: "cyan",
            label: samplePosition.title,
          });
        }

        if (samplePosition.gradeName) {
          tags.push({
            icon: <StarOutlined />,
            color: "green",
            label: `Grade: ${samplePosition.gradeName}`,
          });
        }

        if (samplePosition.departmentName) {
          tags.push({
            icon: <BankOutlined />,
            color: "purple",
            label: samplePosition.departmentName,
          });
        }

        if (samplePosition.subDepartmentName) {
          tags.push({
            icon: <TeamOutlined />,
            color: "orange",
            label: samplePosition.subDepartmentName,
          });
        }
      }
    }

    return tags;
  }, [selectedUserDetails, positions]);
  console.log("🔍 selectedUserDetails:", selectedUserDetails);
  useEffect(() => {
    console.log("🔍 Debug: selectedMember", selectedMember);
    console.log("🔍 Debug: appliedFilters", appliedFilters);
    console.log("🔍 Debug: isFutureMonth", isFutureMonth);
    console.log("🔍 Debug: attendanceSummary", attendanceSummary);
    console.log("🔍 Debug: performanceData", performanceData);
    console.log("🔍 Debug: positions", positions);
    console.log("🔍 Debug: selectedUserDetails", selectedUserDetails);
    console.log("🔍 Debug: positionTags", positionTags);

    if (positions.length > 0) {
      console.log("🔍 Debug: positions - DETAILS:");
      positions.forEach((pos, index) => {
        console.log(`Position ${index + 1}:`, {
          id: pos.id,
          title: pos.title,
          gradeName: pos.gradeName,
          departmentName: pos.departmentName,
          subDepartmentName: pos.subDepartmentName,
          code: pos.code,
          status: pos.status,
        });
      });
    }
  }, [
    selectedMember,
    appliedFilters,
    isFutureMonth,
    attendanceSummary,
    performanceData,
    positions,
    selectedUserDetails,
    positionTags,
  ]);

  return (
    <MainLayout>
      <div style={{ padding: "16px", minHeight: "100vh" }}>
        {/* Sticky Header Section */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            // backgroundColor: "#f5f5f5",
            paddingTop: "16px",
            paddingBottom: "8px",
            marginBottom: 16,
            // borderBottom: "1px solid #e8e8e8",
          }}
        >
          {/* Header Text */}
          <div style={{ marginBottom: 12 }}>
            <Title level={3} style={{ margin: 0 }}>
              Performance Management
            </Title>
            <Text type="secondary">Track employee performance metrics</Text>
          </div>
          <Card
            size="small"
            style={{
              boxShadow:
                "0 10px 30px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)",
              borderRadius: "12px",
              // background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
              border: "none",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle gradient overlay */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #1890ff, #722ed1, #fa8c16)",
                borderRadius: "12px 12px 0 0",
              }}
            />

            <Space wrap style={{ padding: "4px 0" }}>
              <Select
                placeholder="Select Employee"
                style={{ width: 200 }}
                size="middle" // Increased size
                value={selectedMember}
                onChange={setSelectedMember}
                loading={loading}
                allowClear
                showSearch
              >
                {members.map((member) => (
                  <Option key={member.value} value={member.value}>
                    {member.label}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Month"
                style={{ width: 100 }}
                size="middle"
                value={selectedMonth}
                onChange={setSelectedMonth}
              >
                {months.map((month) => (
                  <Option key={month.value} value={month.value}>
                    {month.label}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Year"
                style={{ width: 80 }}
                size="middle"
                value={selectedYear}
                onChange={setSelectedYear}
              >
                {years.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>

              <Button
                type="primary"
                size="middle"
                icon={<FilterOutlined />}
                onClick={handleApply}
                disabled={!selectedMember || !selectedMonth || !selectedYear}
                loading={performanceLoading || attendanceLoading}
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 4px 10px rgba(24,144,255,0.3)",
                }}
              >
                Apply
              </Button>

              {/* User Tags */}
              {selectedUserDetails && (
                <Space wrap size={[4, 4]} style={{ marginLeft: 8 }}>
                  <Tag
                    color="blue"
                    icon={<UserOutlined />}
                    style={{ borderRadius: "20px", padding: "2px 12px" }}
                  >
                    {selectedUserDetails.label}
                  </Tag>
                </Space>
              )}
            </Space>
          </Card>
        </div>

        {/* Main Content */}
        <Spin
          spinning={
            performanceLoading ||
            loading ||
            attendanceLoading ||
            positionsLoading
          }
        >
          <Row gutter={[16, 16]}>
            {/* LEFT COLUMN - 70% - Scrollable with Hidden Scrollbar */}
            <Col
              xs={24}
              lg={17}
              style={{
                height: "calc(100vh - 200px)",
                overflowY: "scroll",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                paddingRight: "8px",
              }}
            >
              <style>
                {`
                  .left-scrollable::-webkit-scrollbar {
                    display: none;
                  }
                `}
              </style>

              <div className="left-scrollable">
                {/* Top 4 Cards Row */}
                {selectedMember && (
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card size="small">
                        <Statistic
                          title="Total Tickets"
                          value={ticketSummary.total}
                          valueStyle={{
                            fontSize: 20,
                            fontWeight: "bold",
                            color: "#1890ff",
                          }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">
                            Completed: {ticketSummary.completed}
                          </Text>
                          <Progress
                            percent={completionRate}
                            size="small"
                            showInfo={false}
                            strokeColor="#52c41a"
                          />
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card size="small">
                        <Statistic
                          title="Attendance"
                          value={
                            !isFutureMonth && appliedFilters.userId
                              ? attendanceSummary.presentDays
                              : 0
                          }
                          suffix={`/ ${daysInMonth}`}
                          valueStyle={{
                            fontSize: 20,
                            fontWeight: "bold",
                            color: "#722ed1",
                          }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">
                            {!appliedFilters.userId
                              ? "Select employee and apply filter"
                              : isFutureMonth
                                ? "No data for future month"
                                : `Present: ${presentOutOf} | Late: ${lateOutOf}`}
                          </Text>
                          {appliedFilters.userId && !isFutureMonth ? (
                            <Progress
                              percent={attendanceRate}
                              size="small"
                              showInfo={false}
                              strokeColor="#722ed1"
                            />
                          ) : (
                            <Progress
                              percent={0}
                              size="small"
                              showInfo={false}
                              strokeColor="#722ed1"
                            />
                          )}
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card size="small">
                        <Statistic
                          title="Daily Updates"
                          value={dailyUpdatesSummary.total}
                          suffix={`/ ${daysInMonth}`}
                          valueStyle={{
                            fontSize: 20,
                            fontWeight: "bold",
                            color: "#fa8c16",
                          }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Space
                            direction="vertical"
                            size={4}
                            style={{ width: "100%" }}
                          >
                            <Text type="secondary">
                              BOD: {bodOutOf} EOD: {eodOutOf}{" "}
                            </Text>
                            <Progress
                              percent={updateRate}
                              size="small"
                              showInfo={false}
                              strokeColor="#fa8c16"
                            />
                          </Space>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card size="small">
                        <Statistic
                          title="Leaves/Permissions"
                          value={
                            !isFutureMonth && appliedFilters.userId
                              ? attendanceSummary.absentDays
                              : 0
                          }
                          suffix={`/ ${daysInMonth}`}
                          valueStyle={{
                            fontSize: 20,
                            fontWeight: "bold",
                            color: "#f5222d",
                          }}
                        />
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary">
                            {!appliedFilters.userId
                              ? ""
                              : isFutureMonth
                                ? "No data for future month"
                                : `Absent: ${absentOutOf} | Half: ${attendanceSummary.halfDays}`}
                          </Text>
                          {appliedFilters.userId && !isFutureMonth ? (
                            <Progress
                              percent={
                                Math.round(
                                  (attendanceSummary.absentDays / daysInMonth) *
                                    100,
                                ) || 0
                              }
                              size="small"
                              showInfo={false}
                              // strokeColor="#f5222d"
                              strokeColor="#faad14" // Gold/Yellow
                            />
                          ) : (
                            <Progress
                              percent={0}
                              size="small"
                              showInfo={false}
                              strokeColor="#f5222d"
                            />
                          )}
                        </div>
                      </Card>
                    </Col>
                  </Row>
                )}

                {/* Tickets Overview */}
                <Card
                  size="small"
                  title={
                    <Space size={4}>
                      <TagOutlined />
                      <span style={{ fontSize: 14 }}>Tickets Overview</span>
                    </Space>
                  }
                  extra={<Tag color="blue">Total: {ticketSummary.total}</Tag>}
                  style={{ marginBottom: 16 }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {/* Completed */}
                        <div
                          style={{
                            background: "#f6ffed",
                            padding: "12px 16px",
                            borderRadius: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Completed
                            </Text>
                            <div
                              style={{
                                fontSize: 24,
                                fontWeight: "bold",
                                color: "#52c41a",
                              }}
                            >
                              {ticketSummary.completed}
                            </div>
                          </div>
                          <Progress
                            type="circle"
                            percent={completionRate}
                            width={50}
                            strokeColor="#52c41a"
                            format={() => ""}
                          />
                        </div>

                        {/* In Progress */}
                        <div
                          style={{
                            background: "#fff7e6",
                            padding: "12px 16px",
                            borderRadius: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              In Progress
                            </Text>
                            <div
                              style={{
                                fontSize: 24,
                                fontWeight: "bold",
                                color: "#fa8c16",
                              }}
                            >
                              {ticketSummary.inProgress}
                            </div>
                          </div>
                          <Progress
                            type="circle"
                            percent={
                              ticketSummary.total > 0
                                ? Math.round(
                                    (ticketSummary.inProgress /
                                      ticketSummary.total) *
                                      100,
                                  )
                                : 0
                            }
                            width={50}
                            strokeColor="#fa8c16"
                            format={() => ""}
                          />
                        </div>

                        {/* Pending */}
                        <div
                          style={{
                            background: "#fff1f0",
                            padding: "12px 16px",
                            borderRadius: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Pending
                            </Text>
                            <div
                              style={{
                                fontSize: 24,
                                fontWeight: "bold",
                                color: "#f5222d",
                              }}
                            >
                              {ticketSummary.pending}
                            </div>
                          </div>
                          <Progress
                            type="circle"
                            percent={
                              ticketSummary.total > 0
                                ? Math.round(
                                    (ticketSummary.pending /
                                      ticketSummary.total) *
                                      100,
                                  )
                                : 0
                            }
                            width={50}
                            strokeColor="#faad14" // Gold/Yellow
                            format={() => ""}
                          />
                        </div>
                      </div>
                    </Col>

                    {/* Right Column - Donut Chart */}
                    <Col span={12}>
                      {ticketDistribution.length > 0 ? (
                        <div style={{ height: 220 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={ticketDistribution.filter(
                                  (item) => item.value > 0,
                                )} // Filter zero values
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={90}
                                startAngle={0} // Start at 0 degrees
                                endAngle={360}
                                paddingAngle={0}
                                dataKey="value"
                              >
                                {ticketDistribution
                                  .filter((item) => item.value > 0)
                                  .map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                              </Pie>
                              {/* <Tooltip
                                formatter={(
                                  value: number,
                                  name: string,
                                  props: any,
                                ) => {
                                  const total = ticketDistribution.reduce(
                                    (sum, item) => sum + item.value,
                                    0,
                                  );
                                  const percentage =
                                    total > 0
                                      ? Math.round((value / total) * 100)
                                      : 0;
                                  return [`${value} (${percentage}%)`, name];
                                }}
                              /> */}
                              <Tooltip
                                formatter={(
                                  value: any,
                                  name: any,
                                  entry: any,
                                  index: any,
                                  payload: any,
                                ) => {
                                  // Safe defaults
                                  const safeValue = value || 0;
                                  const safeName = name || "";

                                  // Calculate total
                                  const total = ticketDistribution.reduce(
                                    (sum, item) => sum + (item.value || 0),
                                    0,
                                  );

                                  // Calculate percentage
                                  const percentage =
                                    total > 0 && safeValue > 0
                                      ? Math.round((safeValue / total) * 100)
                                      : 0;

                                  // Return as array of React nodes
                                  return [
                                    <span key="value">
                                      <b>{safeValue}</b> ({percentage}%)
                                    </span>,
                                    safeName,
                                  ];
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 20,
                              marginTop: 8,
                            }}
                          >
                            {/* Legend - Show all items even if zero */}
                            {ticketDistribution.map((item, index) => (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <div
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    backgroundColor: item.color,
                                  }}
                                />
                                <Text style={{ fontSize: 12 }}>
                                  {item.name}: {item.value}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 220,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text type="secondary">No data available</Text>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card>

                {/* Daily Updates Log */}
                {existingUpdates.length > 0 && (
                  <Card
                    size="small"
                    title={
                      <Space size={4}>
                        <FileTextOutlined />
                        <span style={{ fontSize: 14 }}>Daily Updates Log</span>
                      </Space>
                    }
                    extra={
                      <Space size={4}>
                        <Tag color="blue">BOD: {dailyUpdatesSummary.bod}</Tag>
                        <Tag color="purple">EOD: {dailyUpdatesSummary.eod}</Tag>
                      </Space>
                    }
                  >
                    <Table
                      columns={dailyUpdateColumns}
                      dataSource={existingUpdates}
                      rowKey="key"
                      pagination={{ pageSize: 5 }}
                      size="small"
                    />
                  </Card>
                )}
              </div>
            </Col>

            {/* RIGHT COLUMN - 30% - ALL CARDS VISIBLE WITHOUT SCROLL */}
            <Col xs={24} lg={7}>
              <div
                style={{
                  height: "calc(100vh - 200px)",
                  overflowY: "visible",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  
                }}
              >
                {/* Profile Card - Properly Aligned */}
                {selectedUserDetails && (
                  <Card size="small" bodyStyle={{ padding: "12px" }}>
                    <Row gutter={12} align="middle">
                      {/* Avatar Column */}
                      <Col span={6}>
                        <Avatar
                          size={48}
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#87d068" }}
                        />
                      </Col>

                      {/* User Info Column */}
                      <Col span={18}>
                        {/* Name */}
                        <div>
                          <Text strong style={{ fontSize: "14px" }}>
                            {selectedUserDetails.label}
                          </Text>
                        </div>

                        {/* Tags Row - Active and Position side by side */}
                        <div style={{ marginTop: 4 }}>
                          <Space size={4}>
                            <Tag
                              color="blue"
                              style={{ fontSize: "10px", margin: 0 }}
                            >
                              Active
                            </Tag>
                            {selectedUserDetails.position && (
                              <Tag
                                color="cyan"
                                // icon={<FlagOutlined />}
                                style={{ fontSize: "10px", margin: 0 }}
                              >
                                {selectedUserDetails.position}
                              </Tag>
                            )}
                            {selectedUserDetails?.subDepartmentName && (
                              <Tag
                                color="purple"
                                style={{ fontSize: "10px", margin: 0 }}
                              >
                                {selectedUserDetails.subDepartmentName}
                              </Tag>
                            )}
                          </Space>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* Performance Summary Card */}
                <Card
                  size="small"
                  title={
                    <span style={{ fontSize: "13px" }}>
                      Performance Summary
                    </span>
                  }
                  headStyle={{ padding: "6px 10px", minHeight: "auto" }}
                  bodyStyle={{ padding: "8px 10px" }}
                >
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    {/* Ticket Completion */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: "10px" }}>
                          Ticket
                        </Text>
                        <Text style={{ fontSize: "10px", fontWeight: 600 }}>
                          {completionRate}%
                        </Text>
                      </div>
                      <Progress
                        percent={completionRate}
                        size="small"
                        strokeColor="#52c41a"
                        showInfo={false}
                      />
                    </div>

                    {/* Attendance Rate */}
                    {!isFutureMonth && appliedFilters.userId && (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary" style={{ fontSize: "10px" }}>
                            Attendance
                          </Text>
                          <Text style={{ fontSize: "10px", fontWeight: 600 }}>
                            {attendanceRate}%
                          </Text>
                        </div>
                        <Progress
                          percent={attendanceRate}
                          size="small"
                          strokeColor="#722ed1"
                          showInfo={false}
                        />
                      </div>
                    )}

                    {/* Update Rate */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: "10px" }}>
                          Updates
                        </Text>
                        <Text style={{ fontSize: "10px", fontWeight: 600 }}>
                          {updateRate}%
                        </Text>
                      </div>
                      <Progress
                        percent={updateRate}
                        size="small"
                        strokeColor="#1890ff"
                        showInfo={false}
                      />
                    </div>

                    {/* BOD/EOD */}
                    <Row gutter={4}>
                      <Col span={12}>
                        <div
                          style={{
                            background: "#f9f0ff",
                            padding: "2px 4px",
                            borderRadius: 4,
                          }}
                        >
                          <Text type="secondary" style={{ fontSize: "9px" }}>
                            BOD
                          </Text>
                          <div>
                            <Text style={{ fontSize: "11px", fontWeight: 600 }}>
                              {bodOutOf}
                            </Text>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div
                          style={{
                            background: "#fff2e8",
                            padding: "2px 4px",
                            borderRadius: 4,
                          }}
                        >
                          <Text type="secondary" style={{ fontSize: "9px" }}>
                            EOD
                          </Text>
                          <div>
                            <Text style={{ fontSize: "11px", fontWeight: 600 }}>
                              {eodOutOf}
                            </Text>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Space>
                </Card>

                {/* Quick Stats Card */}
                <Card size="small" bodyStyle={{ padding: "8px" }}>
                  <Row gutter={4} align="middle">
                    <Col span={10}>
                      <Statistic
                        title={
                          <span style={{ fontSize: "10px" }}>Overall</span>
                        }
                        value={performanceScore}
                        suffix="%"
                        valueStyle={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#722ed1",
                        }}
                      />
                    </Col>
                    <Col span={14}>
                      <Row gutter={4}>
                        <Col span={24}>
                          <Tag
                            color="green"
                            style={{
                              width: "100%",
                              textAlign: "center",
                              fontSize: "9px",
                              padding: "2px 0",
                              marginBottom: 2,
                            }}
                          >
                            ✅ {ticketSummary.completed} Done
                          </Tag>
                        </Col>
                        <Col span={24}>
                          <Tag
                            color="purple"
                            style={{
                              width: "100%",
                              textAlign: "center",
                              fontSize: "9px",
                              padding: "2px 0",
                              marginBottom: 2,
                            }}
                          >
                            📊 {attendanceSummary.presentDays} Present
                          </Tag>
                        </Col>
                        <Col span={24}>
                          <Tag
                            color="blue"
                            style={{
                              width: "100%",
                              textAlign: "center",
                              fontSize: "9px",
                              padding: "2px 0",
                            }}
                          >
                            📅 {dailyUpdatesSummary.total} Updates
                          </Tag>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card>
              </div>
            </Col>
          </Row>
        </Spin>
      </div>
    </MainLayout>
  );
}
