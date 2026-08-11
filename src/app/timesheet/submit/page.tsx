"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React from "react";
import SubmittimesheetTab from "@/components/timesheet/SubmittimesheetTab";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";



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
        <LoadingSpinner message="Loading..." size="large" fullScreen={false} />
      </div>
    );
  }

  if (!canReadTimesheet || !canCreateTimesheet) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <SubmittimesheetTab
        onSubmitted={() => router.push("/timesheet")}
      />
    </MainLayout>
  );
}
