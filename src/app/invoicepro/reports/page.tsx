"use client";

import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Space, Typography, Spin } from "antd";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
const { Title } = Typography;
import { SettingOutlined } from "@ant-design/icons";

export default function InvoiceproReportsPage() {
  const router = useRouter();
  const { canReadInvoice } = usePermission();
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !canReadInvoice) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadInvoice, router]);

  if (authLoading) return <MainLayout><Spin tip="Loading..." /></MainLayout>;
  if (!canReadInvoice) return null;

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
