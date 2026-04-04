"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function ReimbursementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadReimbursement } = usePermission();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadReimbursement) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadReimbursement, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading Reimbursement Modules..." />
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadReimbursement) {
    return null;
  }

  return <MainLayout>{children}</MainLayout>;
}
