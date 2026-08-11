"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import "../../projects/projects.css";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";

import MemberTrashManagementPage from "@/components/members/trash/MemberTrashManagementPage";


export default function MembersTrashPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadUser } = usePermission();
  useActivitySource({ section: "ADMIN", module: "Members", page: "MemberTrash" });
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadUser) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadUser, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <div
          style={{
            margin: "0 -24px",
            padding: "24px 32px",
            background: "var(--bg-pure-white)",
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center" }}
        >
          <LoadingSpinner message="Loading member trash..." size="large" fullScreen={false} />
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadUser) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <MemberTrashManagementPage />
    </MainLayout>
  );
}
