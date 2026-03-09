"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Suspense } from "react";
import { Spin } from "antd";
import TimesheetContent from "./TimesheetContent";

export default function MyTimesheetsPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTimesheet } = usePermission();
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadTimesheet) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadTimesheet, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" tip="Loading..." />
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadTimesheet) {
    return null;
  }

  return (
    <MainLayout>
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
            <Spin size="large" />
          </div>
        }
      >
        <TimesheetContent />
      </Suspense>
    </MainLayout>
  );
}
