"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Suspense } from "react";

import TimesheetsTab from "@/components/timesheet/TimesheetTable";


export default function TeamTimesheetsPage() {
  const { isLoading: authLoading } = useAuth();
  const { canManageTimesheets, canReadTimesheet } = usePermission();
  const router = useRouter();

  // Route guard: Requires management permissions or fallback to basic read
  useEffect(() => {
    if (!authLoading && !canManageTimesheets && !canReadTimesheet) {
      router.push('/dashboard');
    }
  }, [authLoading, canManageTimesheets, canReadTimesheet, router]);

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

  // Loading state
  if (authLoading) {
    return (
      <div style={{ 
        margin: "0 -24px", 
        padding: "24px", 
        background: "var(--bg-pure-white)", 
        minHeight: "calc(100vh - 64px)",
        textAlign: 'center' 
      }}>
        <LoadingSpinner message="Loading..." size="large" fullScreen={false} />
      </div>
    );
  }

  // Permission check
  if (!canManageTimesheets && !canReadTimesheet) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "calc(100vh - 64px)" }}
          >
            <LoadingSpinner size="large" fullScreen={false} />
          </div>
        }
      >
        <TimesheetsTab goToSubmitTimesheet={goToSubmitTimesheet} teamMode={true} />
      </Suspense>
    </MainLayout>
  );
}
