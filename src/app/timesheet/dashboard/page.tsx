"use client";

import React from "react";
import TimesheetDashboard from "@/components/timesheet/TimesheetDashboard";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ZukvoLoader from "@/components/common/ZukvoLoader";



export default function TimesheetDashboardPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTimesheet } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadTimesheet) {
      router.push('/timesheet');
    }
  }, [authLoading, canReadTimesheet, router]);

  if (authLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <ZukvoLoader message="Loading..." size="lg" />
      </div>
    );
  }

  if (!canReadTimesheet) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <TimesheetDashboard />
    </MainLayout>
  );
}
