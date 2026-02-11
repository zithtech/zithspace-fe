import React from "react";
import { Card, Row, Col, Typography, Table, Tag } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function LeaveView({ data, summary }: { data: any[], summary?: any }) {
  const leaveColumns = [
    { title: "From", dataIndex: "from", key: "from" },
    { title: "To", dataIndex: "to", key: "to" },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => <Tag color="red">{text}</Tag>,
    },
    { title: "Duration", dataIndex: "duration", key: "duration" },
    { title: "Reason", dataIndex: "reason", key: "reason" },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <Title level={4}>Leave & Permission Overview</Title>

      {/* 🔥 SUMMARY CARDS */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {/* Total Leave Days */}
        <Col xs={24} md={8}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#fff7e6", padding: 10, borderRadius: "50%" }}>
                <CalendarOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Total Leave Days</Text>
                  <Title level={4} style={{ margin: 0 }}>{summary?.taken || 0}</Title>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>{summary?.paidUnpaid || "0 / 0"}</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Permissions */}
        <Col xs={24} md={8}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#e6f7ff", padding: 10, borderRadius: "50%" }}>
                <ClockCircleOutlined style={{ fontSize: 20, color: "#1890ff" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Permissions</Text>
                  <Title level={4} style={{ margin: 0 }}>{summary?.permissions || 0}</Title>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>Approved</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Attendance Rate */}
        <Col xs={24} md={8}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#f6ffed", padding: 10, borderRadius: "50%" }}>
                <PercentageOutlined style={{ fontSize: 20, color: "#52c41a" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Attendance Rate</Text>
                  <Title level={4} style={{ margin: 0 }}>{summary?.attendanceRate || "0%"}</Title>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>Based on working days</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 🔥 TABLE */}
      <div style={{ marginTop: 24 }}>
        <Title level={4}>Leave History</Title>
        <Card>
          <Table
            columns={leaveColumns}
            dataSource={data}
            pagination={{ pageSize: 5 }}
          />
        </Card>
      </div>
    </div>
  );
}
