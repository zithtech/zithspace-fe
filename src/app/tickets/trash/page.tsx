"use client";

import ZukvoLoader from "@/components/common/ZukvoLoader";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import TrashManagementPage from "@/components/projects/trash/TrashManagementPage";
import "@/app/projects/projects.css";

export default function TicketsTrashPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadTicketTrash } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadTicketTrash) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadTicketTrash, router]);

  useActivitySource({ section: "WORK", module: "Trash", page: "TrashView" });

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
          <ZukvoLoader size="lg" message="Loading tickets trash..." />
        </div>
      </MainLayout>
    );
  }

  if (!canReadTicketTrash) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <TrashManagementPage />
    </MainLayout>
  );
}
