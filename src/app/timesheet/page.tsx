"use client";

import MainLayout from "@/components/layout/MainLayout";
import { Suspense } from "react";
import { Spin } from "antd";
import TimesheetContent from "./TimesheetContent";

export default function MyTimesheetsPage() {
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
