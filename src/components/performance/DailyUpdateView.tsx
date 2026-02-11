import React from "react";
import { Card, Row, Col, Typography, Table, Tag } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CalendarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function DailyUpdateView({ data, summary }: { data: any[], summary?: any }) {
  const dailyUpdateColumns = [
    { title: "Date", dataIndex: "date", key: "date" },
    {
      title: "BOD",
      dataIndex: "bod",
      key: "bod",
      render: (bod: boolean) =>
        bod ? (
          <CheckCircleFilled style={{ color: "green", fontSize: 18 }} />
        ) : (
          <CloseCircleFilled style={{ color: "red", fontSize: 18 }} />
        ),
    },
    {
      title: "EOD",
      dataIndex: "eod",
      key: "eod",
      render: (eod: boolean) =>
        eod ? (
          <CheckCircleFilled style={{ color: "green", fontSize: 18 }} />
        ) : (
          <CloseCircleFilled style={{ color: "red", fontSize: 18 }} />
        ),
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      render: (text: string) =>
        text ? <Tag color="red">{text}</Tag> : <Tag color="green">Submitted</Tag>,
    },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <Title level={4}>Daily Updates Overview</Title>

      {/* 🔥 SUMMARY CARDS */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {/* Working Days */}
        <Col xs={24} sm={12} md={6}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#e6f7ff", padding: 10, borderRadius: "50%" }}>
                <CalendarOutlined style={{ fontSize: 20, color: "#1890ff" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Working Days</Text>
                  <Title level={4} style={{ margin: 0 }}>{summary?.workingDays || 0}</Title>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* BOD Submitted */}
        <Col xs={24} sm={12} md={6}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#f6ffed", padding: 10, borderRadius: "50%" }}>
                <CheckCircleFilled style={{ fontSize: 20, color: "#52c41a" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">BOD Submitted</Text>
                  <Title level={4} style={{ margin: 0, color: "green" }}>{summary?.bod || 0}</Title>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* EOD Submitted */}
        <Col xs={24} sm={12} md={6}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#f6ffed", padding: 10, borderRadius: "50%" }}>
                <CheckCircleFilled style={{ fontSize: 20, color: "#52c41a" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">EOD Submitted</Text>
                  <Title level={4} style={{ margin: 0, color: "green" }}>{summary?.eod || 0}</Title>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Missed */}
        <Col xs={24} sm={12} md={6}>
          <Card className="dash-card" bodyStyle={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#fff1f0", padding: 10, borderRadius: "50%" }}>
                <CloseCircleFilled style={{ fontSize: 20, color: "#f5222d" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text type="secondary">Days Missed</Text>
                  <Title level={4} style={{ margin: 0, color: "red" }}>{summary?.missed || 0}</Title>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 🔥 TABLE SECTION */}
      <div style={{ marginTop: 24 }}>
        <Title level={4}>Daily Update Log</Title>
        <Card>
          <Table
            columns={dailyUpdateColumns}
            dataSource={data}
            pagination={{ pageSize: 5 }}
          />
        </Card>
      </div>
    </div>
  );
}
