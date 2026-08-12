"use client";

import React, { useEffect, useState } from "react";
import { App } from "antd";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { usePermission } from "@/hooks/usePermission";
import QaSubmissionService, { type SubmissionDetail } from "@/services/qaSubmissionService";
import SubmissionForm from "../../SubmissionForm";

export default function EditQaSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { message } = App.useApp();
  const { canUpdateSubmission } = usePermission();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // SubmissionForm refuses to render without this permission anyway — checking
    // here too keeps the fetch (and its redirect side-effects) from firing at all.
    if (!canUpdateSubmission) return;

    (async () => {
      try {
        const data = await QaSubmissionService.get(id);
        // A signed-off record is history, not a live document (§24) — the API
        // rejects the edit anyway, so send the user to the read-only view.
        if (data.status === "QA Signed-off" || data.status === "Approved") {
          message.info("This submission has been signed off and can no longer be edited.");
          router.replace(`/qa-workspace/qa-submissions/${id}`);
          return;
        }
        setSubmission(data);
      } catch (e: any) {
        message.error(e?.response?.data?.error || "Failed to load the submission");
        router.replace("/qa-workspace/qa-submissions");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router, message, canUpdateSubmission]);

  // Guarded before the loading branch, or a user without the permission would
  // sit on the loader forever — the fetch that clears it never runs.
  if (!canUpdateSubmission) return null;

  if (loading || !submission) {
    return (
      <MainLayout noPadding>
        <ZukvoLoader size="lg" fullscreen message="Loading the QA submission…" />
      </MainLayout>
    );
  }

  return <SubmissionForm submission={submission} />;
}
