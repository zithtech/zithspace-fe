"use client";
import React, { useEffect } from 'react'
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Spin } from "antd";

export default function OnboardingSettings() {
  const { isLoading: authLoading } = useAuth();
  const { canManageOnboarding } = usePermission();
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canManageOnboarding) {
      router.push('/dashboard');
    }
  }, [authLoading, canManageOnboarding, router]);

  // Loading & permission check
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" tip="Loading..." />
        </div>
      </MainLayout>
    );
  }

  if (!canManageOnboarding) {
    return null;
  }

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <div>Onboarding Settings</div>
      </div>
    </MainLayout>
  );
}