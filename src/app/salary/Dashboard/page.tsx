"use client";

import React, { useEffect } from "react";
import { Typography, Space, Spin } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";

const { Title, Text } = Typography;

const page = () => {
  const { canReadSalary } = usePermission();
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadSalary) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadSalary, router]);

  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" tip="Loading">
            <div style={{ padding: 20 }} />
          </Spin>
        </div>
        </div>
      </MainLayout>
    );
  }

  if (!canReadSalary) return null;

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
