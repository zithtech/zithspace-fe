"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Suspense } from "react";
import TimesheetsTab from "@/components/timesheet/TimesheetTable";

export default function ApprovalTimesheetsPage() {
  const { isLoading: authLoading } = useAuth();
  const { canApproveTimesheet } = usePermission();
  const router = useRouter();

  // Route guard: Requires approve permissions
  useEffect(() => {
    if (!authLoading && !canApproveTimesheet) {
      router.push('/dashboard');
    }
  }, [authLoading, canApproveTimesheet, router]);

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
        <ZukvoLoader size="lg" message="Loading..." />
      </div>
    );
  }

  // Permission check
  if (!canApproveTimesheet) {
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
              height: "calc(100vh - 64px)",
            }}
          >
            <ZukvoLoader size="lg" />
          </div>
        }
      >
        <TimesheetsTab goToSubmitTimesheet={goToSubmitTimesheet} approvalMode={true} />
      </Suspense>
    </MainLayout>
  );
}
