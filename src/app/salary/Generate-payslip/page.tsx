"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Typography, Spin } from "antd";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const { Title } = Typography;

const GeneratePayslipPage = () => {
  const { canCreatePayslip } = usePermission();
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canCreatePayslip) {
      router.push("/dashboard");
    }
  }, [authLoading, canCreatePayslip, router]);

  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <Spin size="large" tip="Loading" />
        </div>
      </MainLayout>
    );
  }

  if (!canCreatePayslip) return null;

  return (
    <MainLayout>
      <Title level={3}>Generate Payslip</Title>
    </MainLayout>
  );
};

export default GeneratePayslipPage;
