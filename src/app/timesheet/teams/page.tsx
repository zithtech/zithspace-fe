"use client";

import React from "react";
import TeamsTab from "@/components/timesheet/TeamsTab";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Spin } from "antd";

export default function TeamsTimesheetPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTimesheet, canApproveTimesheet } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!canReadTimesheet || !canApproveTimesheet)) {
      router.push('/timesheet');
    }
  }, [authLoading, canReadTimesheet, canApproveTimesheet, router]);

  if (authLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!canReadTimesheet || !canApproveTimesheet) {
    return null;
  }

  const goToSubmitTimesheet = (
    id?: string,
    mode: "edit" | "resubmit" | "create" = "edit",
  ) => {
    if (id) {
      router.push(`/timesheet/submit?id=${id}&mode=${mode}`);
    } else {
      router.push(`/timesheet/submit?mode=create`);
    }
  };

  return (
    <MainLayout>
      <TeamsTab
        goToSubmitTimesheet={goToSubmitTimesheet}
        onActionCompleted={() => router.push("/timesheet")}
      />
    </MainLayout>
  );
}
