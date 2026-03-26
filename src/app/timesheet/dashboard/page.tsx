"use client";

import React from "react";
import DashboardTab from "@/components/timesheet/DashboardTab";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Spin } from "antd";

export default function TimesheetDashboardPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTimesheet } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadTimesheet) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadTimesheet, router]);

  if (authLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!canReadTimesheet) {
    return null;
  }

  return (
    <MainLayout>
      <DashboardTab />
    </MainLayout>
  );
}
