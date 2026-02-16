"use client";

import React from "react";
import { Typography, Space } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";

const { Title, Text } = Typography;

const page = () => {
  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        {/* Header */}
        {/* <Space align="center" size={12}>
          <SettingOutlined style={{ fontSize: 22, color: "#1677ff" }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Settings
            </Title>
            <Text type="secondary">
              Manage application settings
            </Text>
          </div>
        </Space> */}

        {/* Page Content */}
        <div style={{ marginTop: 24 }}>
          App
        </div>
      </div>
    </MainLayout>
  );
};

export default page;
