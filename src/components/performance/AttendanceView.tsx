import React from "react";
import { Card, Row, Col, Typography, Table, Tag } from "antd";
import {
  LoginOutlined,
  LogoutOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  Bar,
} from "recharts";

const { Title, Text } = Typography;

export default function AttendanceView({ trendData, logData, summary }: { trendData: any[], logData: any[], summary?: any }) {
  
  const attendanceStatusColorMap: any = {
    "Full Day": "green",
    "Half Day": "orange",
    "Short Day": "gold",
    Late: "red",
  };

  const attendanceLogColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Clock In', dataIndex: 'clockIn', key: 'clockIn' },
    { title: 'Clock Out', dataIndex: 'clockOut', key: 'clockOut' },
    { title: 'Hours', dataIndex: 'hours', key: 'hours' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={attendanceStatusColorMap[status]}>{status}</Tag>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <Title level={4}>Attendance Details</Title>

      {/* 🔥 TOP SUMMARY CARDS (Compact Style) */}
      <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
        {/* Avg Clock In */}
        <Col xs={24} sm={12} md={6}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#e6f7ff", padding: 10, borderRadius: "50%" }}>
                <LoginOutlined style={{ fontSize: 20, color: "#1890ff" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Avg Clock In</Text>
                  <Title level={4} style={{ margin: 0 }}>{summary?.avgClockIn || "-"}</Title>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Avg Clock Out */}
        <Col xs={24} sm={12} md={6}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#f6ffed", padding: 10, borderRadius: "50%" }}>
                <LogoutOutlined style={{ fontSize: 20, color: "#52c41a" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Avg Clock Out</Text>
                  <Title level={4} style={{ margin: 0 }}>{summary?.avgClockOut || "-"}</Title>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Avg Daily Hours */}
        <Col xs={24} sm={12} md={6}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#fff7e6", padding: 10, borderRadius: "50%" }}>
                <ClockCircleOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Avg Daily Hours</Text>
                  <Title level={4} style={{ margin: 0 }}>{summary?.avgHours || "0h"}</Title>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Late Logins */}
        <Col xs={24} sm={12} md={6}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#fff1f0", padding: 10, borderRadius: "50%" }}>
                <WarningOutlined style={{ fontSize: 20, color: "#f5222d" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Late Logins</Text>
                  <Title level={4} style={{ margin: 0 }}>{summary?.late || 0}</Title>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 🔥 Monthly Attendance Chart */}
      <Card style={{ marginTop: 20 }}>
        <Title level={5}>Monthly Attendance Overview</Title>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="hours" name="Hours Worked" fill="#1890ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 🔥 Attendance Table */}
      <Card style={{ marginTop: 20 }}>
        <Title level={5}>Attendance Log</Title>
        <Table
          columns={attendanceLogColumns}
          dataSource={logData}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
}
