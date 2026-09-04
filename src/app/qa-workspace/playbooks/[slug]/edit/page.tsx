"use client";

/**
 * Edit an existing playbook.
 *
 * The editor needs the whole document, so this loads the unfiltered detail —
 * a level or category filter left over from the reader must never silently trim
 * what gets saved back.
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import PlaybookEditor from "@/components/qa/PlaybookEditor";
import type { PlaybookDetail } from "@/components/qa/playbookShared";

export default function EditPlaybookPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "EditPlaybook" });

  const params = useParams();
  const slug = String((params as any)?.slug ?? "");
  const { canCreateCase } = usePermission();

  const { data: meta } = useQuery<any>({
    queryKey: ["qa", "playbooks", "meta"],
    queryFn: () => axios.get("/api/v2/qa/playbooks/meta"),
    enabled: canCreateCase,
    staleTime: 60 * 60 * 1000,
  });

  const { data: playbook, isLoading } = useQuery<PlaybookDetail>({
    queryKey: ["qa", "playbooks", slug, "edit"],
    queryFn: () => axios.get(`/api/v2/qa/playbooks/${encodeURIComponent(slug)}`),
    enabled: canCreateCase && !!slug,
    // Always refetch on open: editing a stale copy would save back over whatever
    // changed in the meantime.
    staleTime: 0,
  });

  if (!canCreateCase) {
    return (
      <MainLayout>
        <NoData
          title="No access"
          description="You need permission to create test cases before you can edit a playbook."
        />
      </MainLayout>
    );
  }

  if (isLoading || !playbook) {
    return (
      <MainLayout>
        <ZukvoLoadingOverlay loading={isLoading} minHeight={360}>
          {!isLoading && !playbook ? (
            <NoData
              title="Playbook not found"
              description="This playbook is not available in your workspace."
            />
          ) : (
            <div />
          )}
        </ZukvoLoadingOverlay>
      </MainLayout>
    );
  }

  /* A locked premium playbook comes back without its items, so saving from here
     would wipe the body. The reader offers the request-access path instead. */
  if (playbook.locked) {
    return (
      <MainLayout>
        <NoData
          title="This playbook is locked"
          description="Request access from the playbook page before editing it."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <PlaybookEditor mode="edit" initial={playbook} meta={meta} />
    </MainLayout>
  );
}
