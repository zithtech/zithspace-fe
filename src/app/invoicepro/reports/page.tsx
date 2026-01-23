"use client";

import MainLayout from "@/components/layout/MainLayout";
import { Space, Typography } from "antd";
const { Title } = Typography;
import { SettingOutlined } from "@ant-design/icons";

export default function InvoiceproReportsPage() {
  return (
    <MainLayout>
      <div>
        <div style={{ marginBottom: 20 }}>
          <Space align="center">
            <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
            <Title level={3} style={{ margin: 0 }}>
              Report
            </Title>
          </Space>
        </div>
      </div>
    </MainLayout>
  );
}
