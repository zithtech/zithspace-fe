"use client";

/** New playbook. Everything lives in PlaybookEditor; this page just gates it. */

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import PlaybookEditor from "@/components/qa/PlaybookEditor";

function CreatePlaybook() {
  useActivitySource({ section: "WORK", module: "QA", page: "CreatePlaybook" });

  const { user } = useAuth();
  const { canCreatePlaybook } = usePermission();
  const params = useSearchParams();
  /* Arriving from a category in the catalog: the new playbook is filed where
     the author was already standing, rather than making them retype it. */
  const category = params.get("category") ?? "";
  /* And the collection the author picked before the editor opened — filed into
     it once the playbook actually exists and has an id. */
  const collectionId = params.get("collection") ?? "";

  const hasNewPlaybookFeature =
    !user?.subscriptionFeatures ||
    user.subscriptionFeatures.includes("work_playbooks_qa_playbooks_new_playbook");

  const { data: meta } = useQuery<any>({
    queryKey: ["qa", "playbooks", "meta"],
    queryFn: () => axios.get("/api/v2/qa/playbooks/meta"),
    enabled: canCreatePlaybook && hasNewPlaybookFeature,
    staleTime: 60 * 60 * 1000,
  });

  if (!canCreatePlaybook || !hasNewPlaybookFeature) {
    return (
      <MainLayout>
        <NoData
          title="No access"
          description="You do not have permission or subscription access to create playbooks."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <PlaybookEditor
        mode="create"
        meta={meta}
        defaultCategory={category}
        fileIntoCollectionId={collectionId || undefined}
      />
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
