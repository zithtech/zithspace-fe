"use client";

import MainLayout from "@/components/layout/MainLayout";
import React from "react";
import { Space, Button, Typography } from "antd";
const { Title } = Typography;
import { PlusOutlined, TransactionOutlined } from "@ant-design/icons";

export default function ReimbursementPage() {
  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <Space align="center">
            <TransactionOutlined style={{ fontSize: 24, color: "#1677ff" }} />
            <Title level={3} style={{ margin: 0 }}>
              Reimbursement Portal
            </Title>
          </Space>
        </div>
        <div></div>
      </div>
    </MainLayout>
  );
}
