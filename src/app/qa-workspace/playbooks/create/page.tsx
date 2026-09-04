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

  const { canCreateCase } = usePermission();
  /* Arriving from a category in the catalog: the new playbook is filed where
     the author was already standing, rather than making them retype it. */
  const category = useSearchParams().get("category") ?? "";

  const { data: meta } = useQuery<any>({
    queryKey: ["qa", "playbooks", "meta"],
    queryFn: () => axios.get("/api/v2/qa/playbooks/meta"),
    enabled: canCreateCase,
    staleTime: 60 * 60 * 1000,
  });

  if (!canCreateCase) {
    return (
      <MainLayout>
        <NoData
          title="No access"
          description="You need permission to create test cases before you can author a playbook."
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
