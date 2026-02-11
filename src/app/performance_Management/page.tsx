"use client";
import React, { useState, useEffect } from "react";
import { Card, Select, Button, Row, Col,
   Space, Typography, Tag, Table, Spin
} from "antd";
import { FilterOutlined, CalendarOutlined, BarChartOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  CheckSquareOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import AttendanceView from "@/components/performance/AttendanceView";
import DailyUpdateView from "@/components/performance/DailyUpdateView";
import LeaveView from "@/components/performance/LeaveView";
import { usePerformance } from "@/hooks/usePerformance"; // This import will now work
import TicketService from "@/services/ticketService";


const { Option } = Select;

export default function PerformanceManagePage() {
  const [employee, setEmployee] = useState<string | undefined>();
  const [month, setMonth] = useState<string | undefined>();
  const [year, setYear] = useState<string | undefined>();
  const [activeView, setActiveView] = useState('tickets');
  const [employees, setEmployees] = useState<any[]>([]);
  
  // State to trigger the query
  const [appliedFilters, setAppliedFilters] = useState<{userId?: string, month?: string, year?: string}>({});

  // Use the React Query hook
  const { data: performanceData, isLoading: loading, isError } = usePerformance(appliedFilters);

  const monthMap: { [key: string]: string } = {
    "1": "January", "2": "February", "3": "March", "4": "April", "5": "May", "6": "June",
    "7": "July", "8": "August", "9": "September", "10": "October", "11": "November", "12": "December"
  };

  // Fetch employees on mount
 useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const data = await TicketService.getTeamMembers();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  };

  fetchEmployees();
}, []);


  const selectedEmployeeDetails = employees.find(e => e.value === employee);

  const ticketData = performanceData?.tickets?.distribution || [];
  const totalTickets = ticketData.reduce((acc: number, curr: any) => acc + curr.value, 0);
  const completedTickets = performanceData?.tickets?.summary?.completed || 0;
  const completionPercentage = totalTickets > 0 ? ((completedTickets / totalTickets) * 100).toFixed(1) : "0.0";

  const trendData = performanceData?.tickets?.trend || [];

  // Directly use the data from API as it is already filtered by Month/Year
  const ticketDetailsData = performanceData?.tickets?.details || [];
  const attendanceTrendData = performanceData?.attendance?.trend || [];
  const attendanceLogData = performanceData?.attendance?.logs || [];
  const dailyUpdateData = performanceData?.dailyUpdates?.logs || [];
  const leaveData = performanceData?.leaves?.history || [];


  const statusColorMap: { [key: string]: string } = {
    Completed: 'green',
    'In Progress': 'gold',
    Pending: 'red',
    Open: 'blue',
    'To Do': 'default'
  };
  
  const priorityColorMap: { [key:string]: string } = {
    High: 'volcano',
    Medium: 'orange',
    Low: 'geekblue',
    Critical: 'red'
  };

  const handleApply = () => {
    if (employee) {
      // Update applied filters to trigger the hook
      setAppliedFilters({ userId: employee, month, year });
    }
  };

  const handleReset = () => {
    setEmployee(undefined);
    setMonth(undefined);
    setYear(undefined);
    setAppliedFilters({});
  };

  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'ticketId',
      key: 'ticketId',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status]} key={status}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priorityColorMap[priority]} key={priority}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created',
      key: 'created',
    },
    {
      title: 'Closed',
      dataIndex: 'closed',
      key: 'closed',
    },
  ];

  return (
    <MainLayout>
    <div style={{ 
      padding:0,  /* This allows the content below to scroll within the layout */ 
    }}>
      <style>{`
        .dash-card {
          transition: all 0.3s ease;
          cursor: pointer;
          height: 100%;
          border: 1px solid transparent;
        }
        .iconBox {
          background: #f5f7fa;
          padding: 10px;
          border-radius: 50%;
          display: flex;
        }
      `}</style>
      {/* 🔥 FILTER CARD */}
      <div>
        <Card bodyStyle={{ padding: '12px 24px' }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          {/* Left Side: Filters */}
          <Col>
            <Space wrap>
              <Space>
                <FilterOutlined />
                <Typography.Text strong>Filters</Typography.Text>
              </Space>

              <Select
                placeholder="Employee"
                style={{ width: 160 }}
                value={employee}
                onChange={setEmployee}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {employees.map((emp) => (
                  <Option key={emp.value} value={emp.value}>{emp.label}</Option>
                ))}
              </Select>

              <Select
                placeholder="Month"
                style={{ width: 140 }}
                value={month}
                onChange={setMonth}
                allowClear
              >
                <Option value="1">January</Option>
                <Option value="2">February</Option>
                <Option value="3">March</Option>
                <Option value="4">April</Option>
                <Option value="5">May</Option>
                <Option value="6">June</Option>
                <Option value="7">July</Option>
                <Option value="8">August</Option>
                <Option value="9">September</Option>
                <Option value="10">October</Option>
                <Option value="11">November</Option>
                <Option value="12">December</Option>
              </Select>

              <Select
                placeholder="Year"
                style={{ width: 120 }}
                value={year}
                onChange={setYear}
                allowClear
              >
                <Option value="2026">2026</Option>
                <Option value="2025">2025</Option>
                <Option value="2024">2024</Option>
              </Select>

              <Button type="primary" onClick={handleApply} loading={loading}>
                Apply
              </Button>
              <Button onClick={handleReset}>
                Reset
              </Button>
            </Space>
          </Col>

          {/* Right Side: Badges */}
          <Col>
            <Space>
              <Tag icon={<CalendarOutlined />} color="blue">
                {month && year ? `${monthMap[month]} ${year}` : "Select Date"}
              </Tag>
              <Tag color="cyan">
                {selectedEmployeeDetails
                  ? `${selectedEmployeeDetails.label} : ${selectedEmployeeDetails.role || 'Member'}`
                  : "Select Employee"}
              </Tag>
            </Space>
          </Col>
        </Row>
      </Card>
      </div>

      {/* Top Content Area - Cards and Charts */}
      <Spin spinning={loading} tip="Loading dashboard data..." size="large" style={{ minHeight: "60vh" }}>
      <div style={{ padding: "0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            background: "#e6f7ff",
            padding: "10px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <BarChartOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
          </div>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Performance View
            </Typography.Title>
            <Typography.Text type="secondary">
              Evaluate individual user performance across key metrics
            </Typography.Text>
          </div>
        </div>

        <Row gutter={[16, 16]}  style={{ marginTop: 5 }}> 
          {/* 🎫 Tickets */}
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card 
              className="dash-card"
              onClick={() => setActiveView('tickets')}
              style={activeView === 'tickets' ? { borderColor: '#1890ff', background: '#e6f7ff' } : {}}
              bodyStyle={{ padding: '16px 20px' }}
            >
              {/* top heading + icon */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography.Title level={5} style={{ margin: 0 }}>Tickets</Typography.Title>

                <div className="iconBox">
                  <CheckSquareOutlined />
                </div>
              </div>

              {/* details */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>Completed</span>
                  <span style={{ color: "green" }}>{performanceData?.tickets?.summary?.completed || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>In Progress</span>
                  <span style={{ color: "orange" }}>{performanceData?.tickets?.summary?.inProgress || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>Pending</span>
                  <span style={{ color: "red" }}>{performanceData?.tickets?.summary?.pending || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
                  <span style={{ background: "#fff7e6", color: "#fa8c16", padding: "4px 50px", borderRadius: "16px", fontSize: "13px" }}>Completion: {completionPercentage}%</span>
                </div>
              </div>
            </Card>
          </Col>

          {/* ⏰ Attendance */}
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card 
              className="dash-card"
              onClick={() => setActiveView('attendance')}
              style={activeView === 'attendance' ? { borderColor: '#1890ff', background: '#e6f7ff' } : {}}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography.Title level={5} style={{ margin: 0 }}>Attendance</Typography.Title>
                <div className="iconBox">
                  <ClockCircleOutlined />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>Avg Hours</span>
                  <span style={{ color: "#fa8c16" }}>{performanceData?.attendance?.summary?.avgHours || "0h"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>Late Logins</span>
                  <span style={{ color: "red" }}>{performanceData?.attendance?.summary?.late || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>Early Logouts</span>
                  <span>{performanceData?.attendance?.summary?.early || 0}</span>
                </div>
              </div>
            </Card>
          </Col>

          {/* 📅 Daily Updates */}
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card 
              className="dash-card"
              onClick={() => setActiveView('dailyUpdate')}
              style={activeView === 'dailyUpdate' ? { borderColor: '#1890ff', background: '#e6f7ff' } : {}}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography.Title level={5} style={{ margin: 0 }}>Daily Updates</Typography.Title>
                <div className="iconBox">
                  <FileTextOutlined />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>BOD Submitted</span>
                  <span style={{ color: "green" }}>{performanceData?.dailyUpdates?.summary?.bod || "0"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>EOD Submitted</span>
                  <span style={{ color: "green" }}>{performanceData?.dailyUpdates?.summary?.eod || "0"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>Missed</span>
                  <span style={{ color: "red" }}>{performanceData?.dailyUpdates?.summary?.missed || 0}</span>
                </div>
              </div>
            </Card>
          </Col>

          {/* 🏖 Leaves */}
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card
              className="dash-card"
              onClick={() => setActiveView('leave')}
              style={activeView === 'leave' ? { borderColor: '#1890ff', background: '#e6f7ff' } : {}}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography.Title level={5} style={{ margin: 0 }}>Leaves & Permissions</Typography.Title>
                <div className="iconBox">
                  <CalendarOutlined />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>Leaves Taken</span>
                  <span>{performanceData?.leaves?.summary?.taken || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>Permissions</span>
                  <span>{performanceData?.leaves?.summary?.permissions || "0"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#8c8c8c" }}>Paid / Unpaid</span>
                  <span>{performanceData?.leaves?.summary?.paidUnpaid || "0 / 0"}</span>
                </div>
              </div>
            </Card>
          </Col>

        </Row>

        {/* --- Details Section --- */}
        {activeView === 'tickets' && (
          <div style={{ marginTop: 5 }}>
            {/* 📊 Ticket Performance Section */}
            <div>
              <Typography.Title level={4}>Ticket Performance</Typography.Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={10}>
                  <Card className="dash-card" style={{ minHeight: 190 }} bodyStyle={{ padding: "8px 12px" }}>
                    <Typography.Title level={5} style={{ textAlign: "center", marginBottom: 0, fontSize: "14px" }}>Distribution</Typography.Title>
                    <div style={{ height: 160, width: "100%" }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={ticketData}
                            cx="50%"
                            cy="40%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {ticketData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "0px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={14}>
                  <Card className="dash-card" style={{ minHeight: 190 }} bodyStyle={{ padding: "8px 12px" }}>
                    <Typography.Title level={5} style={{ marginBottom: 0, fontSize: "14px" }}>Ticket Trend (Daily)</Typography.Title>
                    <div style={{ height: 160, width: "100%" }}>
                      <ResponsiveContainer>
                        <BarChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <RechartsTooltip />
                          <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                          <Bar dataKey="Completed" fill="#52c41a" radius={[4, 4, 0, 0]} barSize={16} />
                          <Bar dataKey="Created" fill="#1890ff" radius={[4, 4, 0, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
            {/* 📋 Ticket Details Table */}
            <div style={{ marginTop: 24 }}>
              <Typography.Title level={4}>Ticket Details</Typography.Title>
              <Card>
                <Table columns={columns} dataSource={ticketDetailsData} pagination={{pageSize: 5}} />
              </Card>
            </div>
          </div>
        )}
{activeView === 'attendance' && (
  <AttendanceView trendData={attendanceTrendData} logData={attendanceLogData} summary={performanceData?.attendance?.summary} />
)}


       {activeView === 'dailyUpdate' && (
  <DailyUpdateView data={dailyUpdateData} summary={performanceData?.dailyUpdates?.summary} />
)}
{activeView === 'leave' && (
  <LeaveView data={leaveData} summary={performanceData?.leaves?.summary} />
)}
      </div>
      </Spin>
    </div>
   
    </MainLayout>
  );
}
