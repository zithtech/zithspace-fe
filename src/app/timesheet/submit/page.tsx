"use client";

import React from "react";
import SubmittimesheetTab from "@/components/timesheet/SubmittimesheetTab";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Spin } from "antd";

export default function SubmitTimesheetPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTimesheet, canCreateTimesheet } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!canReadTimesheet || !canCreateTimesheet)) {
      router.push('/timesheet');
    }
  }, [authLoading, canReadTimesheet, canCreateTimesheet, router]);

  if (authLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!canReadTimesheet || !canCreateTimesheet) {
    return null;
  }

  return (
    <MainLayout>
      <div
        style={{
          flex: 1,
          height: "calc(100vh - 64px)",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="hide-scrollbar"
      >
        <SubmittimesheetTab
          onSubmitted={() => router.push("/timesheet")}
        />
      </div>
    </MainLayout>
  );
}
