"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import BugListPage from "@/components/projects/bug-list/BugListPage";

/**
 * Bug List — part of QA Space (it used to live under Tickets at
 * /tickets/bug-list, which now redirects here). Gated on the bug permissions
 * rather than ticket ones, so QA roles can own it without ticket access.
 */
export default function QaBugListRoute() {
  useActivitySource({ section: "WORK", module: "QA", page: "BugList" });

  const { isLoading: authLoading } = useAuth();
  const { canReadBug } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !canReadBug) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadBug, router]);

  if (authLoading) {
    return (
      <MainLayout noPadding>
        <ZukvoLoader size="lg" fullscreen message="Loading the bug list…" />
      </MainLayout>
    );
  }

  if (!canReadBug) return null;

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
