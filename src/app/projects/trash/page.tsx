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
  const { canReadTicket, canUpdateTicket, canDeleteTicket } = usePermission();
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
        <div style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 64px)', padding: 24, textAlign: 'center' }}>
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" tip="Loading trash">
            <div style={{ padding: 20 }} />
          </Spin>
        </div>
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
      <div style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 64px)', padding: '20px' }}>
        <TrashManagementPage />
      </div>
    </MainLayout>
  );
}
