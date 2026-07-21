"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Spin } from "antd";
import BugListPage from "@/components/projects/bug-list/BugListPage";

export default function BugListRoute() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTicket } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadTicket) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadTicket, router]);

  if (authLoading) {
    return (
      <MainLayout noPadding>
        <div
          style={{
            margin: 0,
            padding: "24px 32px",
            background: "var(--bg-pure-white)",
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            width: "100%",
            maxWidth: "100vw",
          }}
        >
          <Spin size="large" tip="Loading bug list..." />
        </div>
      </MainLayout>
    );
  }

  if (!canReadTicket) return null;

  return (
    <MainLayout noPadding>
      <div
        style={{
          margin: 0,
          padding: 0,
          background: "var(--bg-pure-white)",
          height: "100%",
          overflow: "hidden",
          width: "100%",
          maxWidth: "100vw",
        }}
      >
        <BugListPage />
      </div>
    </MainLayout>
  );
}
