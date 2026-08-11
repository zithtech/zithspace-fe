"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";



/**
 * The Bug List moved to QA Space. This route stays behind so existing links and
 * bookmarks land on the new page instead of a 404.
 */
export default function BugListRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/qa-workspace/bug-list");
  }, [router]);

  return (
    <MainLayout noPadding>
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "var(--bg-pure-white)" }}
      >
        <LoadingSpinner message="Taking you to QA Space…" size="large" fullScreen={false} />
      </div>
    </MainLayout>
  );
}
