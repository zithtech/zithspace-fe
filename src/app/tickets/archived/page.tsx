"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ArchivedManagementPage from "@/components/projects/archived/ArchivedManagementPage";
import "@/app/projects/projects.css";

export default function TicketsArchivedPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTicketArchive } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadTicketArchive) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadTicketArchive, router]);

  useActivitySource({ section: "WORK", module: "Archived", page: "ArchivedView" });

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
          }}
        >
          <ZukvoLoader size="lg" message="Loading tickets archive..." />
        </div>
      </MainLayout>
    );
  }

  if (!canReadTicketArchive) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <ArchivedManagementPage />
    </MainLayout>
  );
}
