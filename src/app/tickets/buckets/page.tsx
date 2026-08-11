"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";

import BucketManagementPage from "@/components/projects/buckets/BucketManagementPage";


export default function BucketsPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTicketBucket } = usePermission();
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadTicketBucket) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadTicketBucket, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <LoadingSpinner message="Loading buckets..." size="large" fullScreen={false} />
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadTicketBucket) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <BucketManagementPage />
    </MainLayout>
  );
}
