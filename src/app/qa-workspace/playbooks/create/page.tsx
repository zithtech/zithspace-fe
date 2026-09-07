"use client";

/** New playbook. Everything lives in PlaybookEditor; this page just gates it. */

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import PlaybookEditor from "@/components/qa/PlaybookEditor";

function CreatePlaybook() {
  useActivitySource({ section: "WORK", module: "QA", page: "CreatePlaybook" });

  const { canCreatePlaybook, canAccessPlaybookCreate } = usePermission();
  /* Arriving from a category in the catalog: the new playbook is filed where
     the author was already standing, rather than making them retype it. */
  const category = useSearchParams().get("category") ?? "";

  const { data: meta } = useQuery<any>({
    queryKey: ["qa", "playbooks", "meta"],
    queryFn: () => axios.get("/api/v2/qa/playbooks/meta"),
    enabled: canCreatePlaybook && canAccessPlaybookCreate,
    staleTime: 60 * 60 * 1000,
  });

  if (!canCreatePlaybook) {
    return (
      <MainLayout>
        <NoData
          title="No access"
          description="You need permission to create playbooks before you can author a playbook."
        />
      </MainLayout>
    );
  }

  if (!canAccessPlaybookCreate) {
    return (
      <MainLayout>
        <NoData
          title="Feature not included in your plan"
          description="Authoring new playbooks is not enabled for your subscription plan. Please contact your administrator."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <PlaybookEditor mode="create" meta={meta} defaultCategory={category} />
    </MainLayout>
  );
}

/* useSearchParams needs a boundary of its own in the app router — without it
   the whole route opts out of static rendering. */
export default function CreatePlaybookPage() {
  return (
    <Suspense fallback={null}>
      <CreatePlaybook />
    </Suspense>
  );
}
