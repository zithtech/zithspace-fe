"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Spin } from "antd";
import TrashManagementPage from "@/components/projects/trash/TrashManagementPage";

export default function TrashPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTicket } = usePermission();
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadTicket) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadTicket, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ 
          margin: "0 -24px",
          padding: "24px 32px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin size="large" tip="Loading trash repository..." />
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadTicket) {
    return null;
  }

  return (
    <MainLayout>
      <TrashManagementPage />
    </MainLayout>
  );
}
