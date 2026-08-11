"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import "../projects.css";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";

import ProjectTrashManagementPage from "@/components/projects/trash/ProjectTrashManagementPage";


export default function ProjectTrashPage() {
  const { isLoading: authLoading } = useAuth();
  const { canReadProject } = usePermission(); // Assuming we use PROJECT_READ for trash
  useActivitySource({ section: "WORK", module: "Projects", page: "ProjectTrash" });
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadProject) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadProject, router]);

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
          <LoadingSpinner message="Loading project trash..." size="large" fullScreen={false} />
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadProject) {
    return null;
  }

  return (
    <MainLayout noPadding>
      <ProjectTrashManagementPage />
    </MainLayout>
  );
}
