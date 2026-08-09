"use client";

/**
 * QA Submission detail (§30) — the structured, read-only record.
 *
 * Also the home of the three workflow actions, which stay deliberately
 * separate (§22):
 *   Submit       report the current results, open bugs and all
 *   QA Sign-off  QA's final recommendation, after retesting
 *   Approval     business acceptance by the named approver
 *
 * Once signed off, everything shown here comes from the frozen snapshot taken
 * at that moment (§24) — later run activity is reported separately rather than
 * silently rewriting the record.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { App, Button, Checkbox, Input, Modal, Popover, Table, Tooltip, Upload } from "antd";
import { ArrowLeftOutlined, PaperClipOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Pencil,
  Send,
  ShieldCheck,
  ThumbsUp,
  Undo2,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Link2,
  History,
  RotateCcw,
  Info,
  Plus,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import TiptapViewer from "@/components/common/TiptapViewer";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import QaSubmissionService, {
  ATTACHMENT_CATEGORIES,
  type AttachmentCategory,
  type FailedCase,
  type KnownIssue,
  type SubmissionDetail,
  type SubmissionStatus,
} from "@/services/qaSubmissionService";
import {
  EmptyNote,
  MetricCell,
  QA_SUBMISSION_STYLES,
  RecommendationPill,
  RetestPill,
  Section,
  StatusPill,
  STATUS_HELP,
  WarningBanner,
  fmtBytes,
  fmtDate,
  fmtDateTimeShort,
  hasRichText,
  initialsOf,
} from "../shared";

/** Timeline events worth a coloured node (§27). */
const KEY_EVENTS = new Set(["submitted", "sent_back", "reopened"]);
const GOOD_EVENTS = new Set(["signed_off", "approved"]);

type CaseModalState = { status: "Pass" | "Fail" | "Blocked" | "Not Executed"; rows: FailedCase[] } | null;

/**
 * What Send Back is, why it exists and what it actually does.
 *
 * The steps change depending on whether the submission has been signed off yet,
 * so the panel reflects the submission's current stage instead of describing
 * both and leaving the reader to work out which one applies to them.
 */
const SendBackHelp = ({ afterSignoff }: { afterSignoff: boolean }) => (
  <div className="qs-infopop__body">
    <h4>Send Back</h4>
    <p>
      Returns the submission to QA with a reason. It asks for more work — it is not a rejection of the testing, and
      nothing that was already recorded is deleted.
    </p>

    <h5>Why it exists</h5>
    <p>
      {afterSignoff
        ? "QA has signed off and is recommending this scope. Send Back is how the approver says the recommendation can't be accepted yet — usually because something still needs testing or fixing."
        : "Results have been reported but the reviewer wants something changed or retested before QA signs off."}
    </p>

    <h5>How it works</h5>
    <ol>
      <li>
        You give a reason. It is required — QA needs to know what to act on.
      </li>
      <li>
        The status becomes <strong>Sent Back</strong>, and your reason appears at the top of the submission and in the
        timeline.
      </li>
      {afterSignoff && (
        <li>
          The sign-off is withdrawn and the submission goes back to reporting live figures. The signed-off numbers stay
          readable under their version.
        </li>
      )}
      <li>
        QA updates the submission, links any new retest runs, and submits again — which creates a new version, so the
        earlier figures remain in the history.
      </li>
      <li>
        {afterSignoff
          ? "QA signs off again, and it comes back to you for approval."
          : "It carries on through sign-off as normal."}
      </li>
    </ol>
  </div>
);

export default function QaSubmissionDetailPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "QaSubmissionDetail" });

  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { message } = App.useApp();
  const {
    canReadSubmission,
    canUpdateSubmission,
    canSubmitSubmission,
    canSignOffSubmission,
    canApproveSubmission,
    canSendBackSubmission,
  } = usePermission();

  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [signoffOpen, setSignoffOpen] = useState(false);
  const [signoffPreview, setSignoffPreview] = useState<any>(null);
  const [signoffConfirmed, setSignoffConfirmed] = useState(false);
  const [signoffComment, setSignoffComment] = useState("");

  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [sendBackReason, setSendBackReason] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const [caseModal, setCaseModal] = useState<CaseModalState>(null);
  const [issueModal, setIssueModal] = useState<Partial<KnownIssue> | null>(null);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [attachmentCategory, setAttachmentCategory] = useState<AttachmentCategory>("Test Evidence");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await QaSubmissionService.get(id));
    } catch (e: any) {
      message.error(e?.response?.data?.error || "Failed to load the submission");
      router.replace("/qa-workspace/qa-submissions");
    } finally {
      setLoading(false);
    }
  }, [id, router, message]);

  useEffect(() => {
    if (canReadSubmission) load();
  }, [canReadSubmission, load]);

  const summary = data?.summary;
  const locked = data?.status === "QA Signed-off" || data?.status === "Approved";

  /**
   * §25 — after sign-off the submission is waiting on its approver. That reads
   * as a distinct stage to everyone involved, so it is shown as one, derived
   * from the signed-off status rather than stored as a separate value.
   */
  const awaitingApproval = data?.status === "QA Signed-off";

  /**
   * The approver is the Reviewer linked on the submission — that field is who
   * the scope nominated to accept the QA outcome. Whoever actually clicks
   * Approve is recorded separately, so a stand-in is visible rather than hidden.
   */
  const approverName = data?.reviewer_name || null;
  const approvedBySomeoneElse =
    !!data?.approved_by && !!data?.reviewer_id && String(data.approved_by) !== String(data.reviewer_id);

  /**
   * Ready-made reasons drawn from what is actually outstanding on this
   * submission. A send-back is only useful if QA can act on it, and "please fix
   * the issues" is not actionable — these name the specific gap and the count.
   */
  const sendBackSuggestions = useMemo(() => {
    const s = data?.summary;
    if (!s) return [] as string[];
    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
    const out: string[] = [];

    if (s.bugs.criticalOpen > 0) {
      out.push(`${plural(s.bugs.criticalOpen, "critical bug is", "critical bugs are")} still open — please resolve and retest before resubmitting.`);
    }
    if (s.retest.stillFailed > 0) {
      out.push(`${plural(s.retest.stillFailed, "case is", "cases are")} still failing after retest — please confirm the fix.`);
    } else if (s.execution.failed > 0) {
      out.push(`${plural(s.execution.failed, "test case is", "test cases are")} still failing — please retest once the fixes land.`);
    }
    if (s.execution.notExecuted > 0) {
      out.push(`${plural(s.execution.notExecuted, "planned case has", "planned cases have")} not been executed — please complete the run.`);
    }
    if (s.execution.blocked > 0) {
      out.push(`${plural(s.execution.blocked, "case is", "cases are")} blocked — please clear the blocker and retest.`);
    }
    return out;
  }, [data?.summary]);

  /** Figures that moved since the snapshot was frozen — worth flagging (§24). */
  const snapshotDrift = useMemo(() => {
    if (!data?.isSnapshot || !data.liveSummary) return null;
    const a = data.summary.execution;
    const b = data.liveSummary.execution;
    const changed =
      a.totalCases !== b.totalCases || a.passed !== b.passed || a.failed !== b.failed || a.blocked !== b.blocked;
    return changed ? b : null;
  }, [data]);

  const act = async (fn: () => Promise<any>, okMessage: string) => {
    try {
      setBusy(true);
      await fn();
      message.success(okMessage);
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.error || "The action could not be completed");
    } finally {
      setBusy(false);
    }
  };

  const openSignoff = async () => {
    try {
      setBusy(true);
      const preview = await QaSubmissionService.getSignoffPreview(id);
      setSignoffPreview(preview);
      setSignoffConfirmed(false);
      setSignoffComment("");
      setSignoffOpen(true);
    } catch (e: any) {
      message.error(e?.response?.data?.error || "Could not open the sign-off review");
    } finally {
      setBusy(false);
    }
  };

  const openCases = async (status: "Pass" | "Fail" | "Blocked" | "Not Executed") => {
    try {
      setBusy(true);
      setCaseModal({ status, rows: await QaSubmissionService.getCases(id, status) });
    } catch {
      message.error("Could not load the test cases");
    } finally {
      setBusy(false);
    }
  };

  const saveIssue = async () => {
    if (!issueModal) return;
    await act(
      () => QaSubmissionService.saveKnownIssue(id, { ...issueModal, issueId: issueModal.id }),
      "Known issue saved",
    );
    setIssueModal(null);
  };

  /**
   * antd would take over the upload if this returned a promise, so the read and
   * the POST are kicked off separately and `false` is returned synchronously —
   * the file goes to our own endpoint, not antd's.
   */
  const uploadAttachment = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      await act(
        () =>
          QaSubmissionService.addAttachment(id, {
            category: attachmentCategory,
            base64: String(reader.result),
            fileName: file.name,
            name: file.name,
          }),
        "Attachment added",
      );
      setAttachmentOpen(false);
    };
    reader.onerror = () => message.error("Could not read that file");
    reader.readAsDataURL(file);
    return false;
  };

  const addLink = async () => {
    if (!attachmentUrl.trim()) return message.error("Enter a link");
    await act(
      () =>
        QaSubmissionService.addAttachment(id, {
          category: attachmentCategory,
          url: attachmentUrl.trim(),
          name: attachmentName.trim() || attachmentUrl.trim(),
        }),
      "Link added",
    );
    setAttachmentOpen(false);
    setAttachmentUrl("");
    setAttachmentName("");
  };

  if (!canReadSubmission) return null;

  if (loading || !data || !summary) {
    return (
      <MainLayout noPadding>
        <ZukvoLoader size="lg" fullscreen message="Loading the QA submission…" />
      </MainLayout>
    );
  }

  const e = summary.execution;

  // Which manual transitions make sense from here (§21).
  const nextStatuses: SubmissionStatus[] = [];
  if (data.status === "Submitted") nextStatuses.push("Under Review", "Retesting", "Ready for QA Sign-off");
  if (data.status === "Under Review") nextStatuses.push("Retesting", "Ready for QA Sign-off");
  if (data.status === "Retesting") nextStatuses.push("Ready for QA Sign-off");
  if (data.status === "Sent Back") nextStatuses.push("Draft", "Retesting");

  const canSubmitNow =
    canSubmitSubmission &&
    !locked &&
    ["Draft", "Sent Back", "Retesting", "Under Review", "Submitted", "Ready for QA Sign-off"].includes(data.status);

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: QA_SUBMISSION_STYLES }} />

      <div className="dh-main" style={{ height: "calc(100vh - 64px)" }}>
        <div className="dh-main-topbar sc-topbar">
          <div className="sc-topbar__title">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push("/qa-workspace/qa-submissions")} />
            <span className="sc-topbar__h1">QA Submission</span>
            <span className="sc-topbar__div" />
            <span className="sc-topbar__sub">{STATUS_HELP[data.status] || ""}</span>
          </div>
        </div>

        <div className="dh-main-scroll">
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            {/* ── Header (§30) ────────────────────────────────────── */}
            <div className="qs-header">
              <div className="qs-header__top">
                <div className="qs-header__id">
                  <span className="qs-header__avatar">{initialsOf(data.submission_name)}</span>
                  <div>
                    <h1 className="qs-header__name">{data.submission_name}</h1>
                    <div className="qs-header__sub">
                      <StatusPill status={data.status} size="sm" />
                      {awaitingApproval && (
                        <span className="qs-pill qs-pill--blue qs-pill--sm">
                          <span className="qs-pill__dot" />
                          Ready for Approval
                        </span>
                      )}
                      <RecommendationPill value={data.qa_recommendation} size="sm" />
                      <span>v{data.version}</span>
                    </div>
                  </div>
                </div>

                <div className="qs-header__actions">
                  {canUpdateSubmission && !locked && (
                    <Button
                      icon={<Pencil size={14} />}
                      onClick={() => router.push(`/qa-workspace/qa-submissions/edit/${id}`)}
                    >
                      Edit
                    </Button>
                  )}

                  {nextStatuses.length > 0 && canUpdateSubmission && (
                    <SearchableDropdown
                      options={nextStatuses.map((s) => ({ value: s, label: s, description: STATUS_HELP[s] }))}
                      value={undefined}
                      onChange={(v) => act(() => QaSubmissionService.changeStatus(id, v), `Moved to ${v}`)}
                      placeholder="Move to…"
                      hideAvatar
                      width={280}
                      itemNoun="statuses"
                    />
                  )}

                  {canSubmitNow && (
                    <Button icon={<Send size={14} />} loading={busy} onClick={() => act(() => QaSubmissionService.submit(id), "Testing results submitted")}>
                      {data.submitted_at ? "Resubmit" : "Submit"}
                    </Button>
                  )}

                  {canSignOffSubmission && !locked && data.status !== "Draft" && (
                    <Button type="primary" icon={<ShieldCheck size={14} />} loading={busy} onClick={openSignoff}>
                      QA Sign-off
                    </Button>
                  )}

                  {awaitingApproval && canApproveSubmission && (
                    <Button type="primary" icon={<ThumbsUp size={14} />} onClick={() => setApproveOpen(true)}>
                      Approve
                    </Button>
                  )}
                  {canSendBackSubmission && !["Draft", "Approved", "Sent Back"].includes(data.status) && (
                    <>
                      <Button
                        icon={<Undo2 size={14} />}
                        onClick={() => {
                          // Start clean — a reason left over from a cancelled
                          // send-back would be the wrong text on a later one.
                          setSendBackReason("");
                          setSendBackOpen(true);
                        }}
                      >
                        Send Back
                      </Button>
                      {/* Send Back reads like a rejection but isn't one, and what
                          it does differs before and after sign-off — worth
                          explaining next to the button rather than in a doc. */}
                      <Popover
                        placement="bottomRight"
                        trigger={["hover", "click"]}
                        overlayClassName="qs-infopop"
                        content={<SendBackHelp afterSignoff={awaitingApproval} />}
                      >
                        <button type="button" className="qs-infobtn" aria-label="About Send Back">
                          <Info size={15} />
                        </button>
                      </Popover>
                    </>
                  )}
                  {canSignOffSubmission && locked && (
                    <Button icon={<RotateCcw size={14} />} onClick={() => setReopenOpen(true)}>
                      Reopen
                    </Button>
                  )}
                </div>
              </div>

              <div className="qs-header__facts">
                <div className="qs-fact">
                  <dt>Scope</dt>
                  <dd>{data.scope_name || "—"}</dd>
                </div>
                <div className="qs-fact">
                  <dt>QA Owner</dt>
                  <dd>{data.qa_owner_name || "—"}</dd>
                </div>
                <div className="qs-fact">
                  <dt>Reviewer</dt>
                  <dd>{data.reviewer_name || "—"}</dd>
                </div>
                <div className="qs-fact">
                  <dt>Type</dt>
                  <dd>{data.submission_type}</dd>
                </div>
                <div className="qs-fact">
                  <dt>Submitted</dt>
                  <dd>{fmtDate(data.submitted_at)}</dd>
                </div>
                <div className="qs-fact">
                  <dt>Retesting</dt>
                  <dd>
                    <RetestPill value={data.retesting_status} />
                  </dd>
                </div>
              </div>
            </div>

            {/* Summary cards (§30) */}
            <div className="qs-metrics" style={{ marginBottom: 14 }}>
              <MetricCell label="Total Cases" value={e.totalCases} />
              <MetricCell label="Passed" value={e.passed} tone="green" onClick={() => openCases("Pass")} />
              <MetricCell label="Failed" value={e.failed} tone="red" onClick={() => openCases("Fail")} />
              <MetricCell label="Blocked" value={e.blocked} tone="amber" onClick={() => openCases("Blocked")} />
              <MetricCell label="Bugs" value={summary.bugs.total} />
              <MetricCell label="Open Bugs" value={summary.bugs.open} tone="red" />
              <MetricCell label="Tickets" value={summary.tickets.created} tone="blue" />
            </div>

            {data.isSnapshot && (
              <div className="qs-snapshot-note">
                <CheckCircle2 size={14} />
                <span>
                  These figures are the snapshot frozen at QA Sign-off on {fmtDate(data.signed_off_at, true)}.
                  {snapshotDrift && (
                    <>
                      {" "}Live runs now report {snapshotDrift.passed}/{snapshotDrift.totalCases} passed and{" "}
                      {snapshotDrift.failed} failed — the signed-off record is intentionally unchanged.
                    </>
                  )}
                </span>
              </div>
            )}

            {data.status === "Sent Back" && data.sent_back_reason && (
              <WarningBanner level="warning">
                <strong>
                  {data.sent_back_stage === "approver" ? "Sent back by the approver" : "Sent back for changes"}
                  {data.sent_back_by_name ? ` — ${data.sent_back_by_name}` : ""}:
                </strong>{" "}
                {data.sent_back_reason}
              </WarningBanner>
            )}

            {/* ── 1. Submission Information ───────────────────────── */}
            <Section index={1} title="Submission Information">
              <div className="qs-header__facts" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                <div className="qs-fact">
                  <dt>Created by</dt>
                  <dd>{data.created_by_name || "—"}</dd>
                </div>
                <div className="qs-fact">
                  <dt>Created</dt>
                  <dd>{fmtDate(data.created_at, true)}</dd>
                </div>
                <div className="qs-fact">
                  <dt>Submitted by</dt>
                  <dd>{data.submitted_by_name || "—"}</dd>
                </div>
                <div className="qs-fact">
                  <dt>Last updated</dt>
                  <dd>{fmtDate(data.updated_at, true)}</dd>
                </div>
              </div>
              {hasRichText(data.description) ? (
                <div className="qs-prose" style={{ marginTop: 14 }}>
                  <TiptapViewer content={data.description || ""} />
                </div>
              ) : (
                <EmptyNote>No description provided.</EmptyNote>
              )}
            </Section>

            {/* ── 2. Test Scope ───────────────────────────────────── */}
            <Section
              index={2}
              title="Test Scope"
              actions={
                <Button size="small" icon={<ExternalLink size={13} />} onClick={() => router.push(`/qa-workspace/test-scope/${data.scope_id}`)}>
                  Open scope
                </Button>
              }
            >
              <dl className="qs-scopecard">
                <div>
                  <dt>Scope</dt>
                  <dd>{data.scope_name || "—"}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{data.scope_type || "—"}</dd>
                </div>
                <div>
                  <dt>Product</dt>
                  <dd>{data.scope_details?.product || "—"}</dd>
                </div>
                <div>
                  <dt>Module</dt>
                  <dd>{(data.scope_details?.modules || []).join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt>Scope QA Owner</dt>
                  <dd>{data.scope_qa_owner || "—"}</dd>
                </div>
                <div>
                  <dt>Planned Start</dt>
                  <dd>{fmtDate(data.scope_start_date)}</dd>
                </div>
                <div>
                  <dt>Planned End</dt>
                  <dd>{fmtDate(data.scope_end_date)}</dd>
                </div>
                <div>
                  <dt>Scope Status</dt>
                  <dd>{data.scope_status || "—"}</dd>
                </div>
              </dl>
            </Section>

            {/* ── 3. Testing Runs ─────────────────────────────────── */}
            <Section index={3} title="Testing Runs" description="The execution evidence this submission reports on.">
              {summary.runs.length === 0 ? (
                <EmptyNote>No test runs linked.</EmptyNote>
              ) : (
                summary.runs.map((r) => (
                  <div key={r.id} className="qs-runrow">
                    <div className="qs-runrow__body">
                      <div className="qs-runrow__top">
                        <span className="qs-runrow__name">{r.run_name}</span>
                        <span className={`qs-pill qs-pill--${r.run_role === "retest" ? "blue" : "ash"} qs-pill--sm`}>
                          <span className="qs-pill__dot" />
                          {r.run_role === "retest" ? "Retest run" : "Initial run"}
                        </span>
                      </div>
                      <div className="qs-runrow__meta">
                        <span>{r.suite_name || "No suite"}</span>
                        <span>·</span>
                        <span>{r.execution_type || "Manual"}</span>
                        <span>·</span>
                        <span>
                          {r.started_at ? fmtDate(r.started_at) : "Not started"} →{" "}
                          {r.completed_at ? fmtDate(r.completed_at) : "in progress"}
                        </span>
                      </div>
                      <div className="qs-runrow__stats">
                        <span className="qs-runrow__stat">Total <b>{r.total_cases}</b></span>
                        <span className="qs-runrow__stat is-pass">Passed <b>{r.passed}</b></span>
                        <span className="qs-runrow__stat is-fail">Failed <b>{r.failed}</b></span>
                        <span className="qs-runrow__stat is-blocked">Blocked <b>{r.blocked}</b></span>
                        <span className="qs-runrow__stat">Not executed <b>{r.not_executed}</b></span>
                        <span className="qs-runrow__stat">Executed <b>{r.execution_percentage}%</b></span>
                      </div>
                    </div>
                    <Tooltip title="Open the test run">
                      <button className="qs-iconbtn" onClick={() => router.push(`/qa-workspace/test-runs/${r.id}`)} aria-label="Open run">
                        <ExternalLink size={15} />
                      </button>
                    </Tooltip>
                  </div>
                ))
              )}
            </Section>

            {/* ── 4. Test Execution Summary (§10, §11) ────────────── */}
            <Section
              index={4}
              title="Test Execution Summary"
              description="Calculated from the linked runs — one result per test case, showing its latest outcome."
            >
              <div className="qs-resultbar">
                {e.passed > 0 && <span className="is-pass" style={{ width: `${(e.passed / Math.max(1, e.totalCases)) * 100}%` }} />}
                {e.failed > 0 && <span className="is-fail" style={{ width: `${(e.failed / Math.max(1, e.totalCases)) * 100}%` }} />}
                {e.blocked > 0 && <span className="is-blocked" style={{ width: `${(e.blocked / Math.max(1, e.totalCases)) * 100}%` }} />}
                {e.notExecuted > 0 && <span className="is-none" style={{ width: `${(e.notExecuted / Math.max(1, e.totalCases)) * 100}%` }} />}
              </div>
              <div className="qs-metrics">
                <MetricCell label="Total Cases" value={e.totalCases} />
                <MetricCell label="Executed" value={e.executed} tone="blue" />
                <MetricCell label="Passed" value={e.passed} tone="green" onClick={() => openCases("Pass")} />
                <MetricCell label="Failed" value={e.failed} tone="red" onClick={() => openCases("Fail")} />
                <MetricCell label="Blocked" value={e.blocked} tone="amber" onClick={() => openCases("Blocked")} />
                <MetricCell label="Not Executed" value={e.notExecuted} onClick={() => openCases("Not Executed")} />
                <MetricCell label="Pass Rate" value={e.passRate} suffix="%" tone="green" />
                <MetricCell label="Execution Rate" value={e.executionRate} suffix="%" tone="blue" />
              </div>
              <p className="qs-hint" style={{ marginTop: 10 }}>
                Click any result count to see the test cases behind it.
              </p>
            </Section>

            {/* ── 5. Failed Cases (§14) ───────────────────────────── */}
            <Section index={5} title="Failed Cases" description="Cases still failing after every linked run.">
              {summary.failedCases.length === 0 ? (
                <EmptyNote>No failing cases in this submission.</EmptyNote>
              ) : (
                <Table
                  className="sc-table"
                  size="small"
                  rowKey="test_case_id"
                  pagination={false}
                  dataSource={summary.failedCases}
                  columns={[
                    {
                      title: "Test Case",
                      key: "case",
                      render: (_: any, r: FailedCase) => (
                        <div className="sc-name__text">
                          <span className="sc-name__title">{r.case_name}</span>
                          <span className="sc-name__meta">{r.case_ref}</span>
                        </div>
                      ),
                    },
                    { title: "Run", dataIndex: "run_name", key: "run_name", width: 170 },
                    { title: "Severity", dataIndex: "severity", key: "severity", width: 110, render: (v: string) => v || "—" },
                    {
                      title: "Bug",
                      key: "bug",
                      width: 120,
                      render: (_: any, r: FailedCase) =>
                        r.bug_number ? (
                          <button className="qs-linkbtn" onClick={() => router.push(`/qa-workspace/bug-list?bugId=${r.bug_id}`)}>
                            {r.bug_number}
                          </button>
                        ) : (
                          <span className="qs-muted">Not filed</span>
                        ),
                    },
                    {
                      title: "Ticket",
                      key: "ticket",
                      width: 130,
                      render: (_: any, r: FailedCase) =>
                        r.ticket_number ? (
                          <button className="qs-linkbtn" onClick={() => router.push(`/tickets/${r.ticket_id}`)}>
                            {r.ticket_number}
                          </button>
                        ) : (
                          <span className="qs-muted">—</span>
                        ),
                    },
                    {
                      title: "Status",
                      key: "status",
                      width: 120,
                      render: (_: any, r: FailedCase) => (
                        <span className="qs-pill qs-pill--ash qs-pill--sm">
                          <span className="qs-pill__dot" />
                          {r.bug_status_key || "Open"}
                        </span>
                      ),
                    },
                  ]}
                />
              )}
            </Section>

            {/* ── 6. Bug Summary (§12) ────────────────────────────── */}
            <Section
              index={6}
              title="Bug Summary"
              description="Defects raised from the linked runs, including ones already resolved."
              actions={
                summary.bugs.total > 0 ? (
                  <Button size="small" icon={<ExternalLink size={13} />} onClick={() => router.push("/qa-workspace/bug-list")}>
                    View Bugs
                  </Button>
                ) : undefined
              }
            >
              {summary.bugs.total === 0 ? (
                <EmptyNote>No bugs were raised from these runs.</EmptyNote>
              ) : (
                <>
                  <div className="qs-metrics">
                    <MetricCell label="Total Bugs" value={summary.bugs.total} />
                    <MetricCell label="Open" value={summary.bugs.open} tone="red" />
                    <MetricCell label="Resolved" value={summary.bugs.resolved} tone="green" />
                    <MetricCell label="Reopened" value={summary.bugs.reopened} tone="amber" />
                  </div>
                  <div className="qs-metrics" style={{ marginTop: 8 }}>
                    <MetricCell label="Critical" value={summary.bugs.critical} tone={summary.bugs.critical ? "red" : "ash"} />
                    <MetricCell label="High" value={summary.bugs.high} tone={summary.bugs.high ? "amber" : "ash"} />
                    <MetricCell label="Medium" value={summary.bugs.medium} />
                    <MetricCell label="Low" value={summary.bugs.low} />
                  </div>
                  {summary.bugs.criticalOpen > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <WarningBanner level="critical">
                        Critical bugs are still open. QA Sign-off may not be appropriate.
                      </WarningBanner>
                    </div>
                  )}
                </>
              )}
            </Section>

            {/* ── 7. Development Tickets (§13) ────────────────────── */}
            <Section index={7} title="Development Tickets" description="Tickets raised for the defects found.">
              <div className="qs-metrics">
                <MetricCell label="Bugs Created" value={summary.tickets.bugsCreated} />
                <MetricCell label="Tickets Created" value={summary.tickets.created} tone="blue" />
                <MetricCell label="Tickets Resolved" value={summary.tickets.resolved} tone="green" />
                <MetricCell label="Tickets Open" value={summary.tickets.open} tone={summary.tickets.open ? "amber" : "ash"} />
              </div>
              {summary.tickets.list.length > 0 && (
                <Table
                  style={{ marginTop: 12 }}
                  className="sc-table"
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={summary.tickets.list}
                  onRow={(r) => ({ onClick: () => router.push(`/tickets/${r.id}`) })}
                  columns={[
                    { title: "Ticket", dataIndex: "ticket_number", key: "ticket_number", width: 130 },
                    { title: "Title", dataIndex: "title", key: "title" },
                    {
                      title: "Status",
                      dataIndex: "status",
                      key: "status",
                      width: 140,
                      render: (v: string) => (
                        <span className={`qs-pill qs-pill--${v === "completed" ? "green" : v === "in_progress" ? "blue" : "ash"} qs-pill--sm`}>
                          <span className="qs-pill__dot" />
                          {String(v || "not started").replace(/_/g, " ")}
                        </span>
                      ),
                    },
                  ]}
                />
              )}
            </Section>

            {/* ── 8. Retesting History (§15) ──────────────────────── */}
            <Section
              index={8}
              title="Retesting History"
              description="How the cases that failed initially have fared since the fixes."
              actions={<RetestPill value={summary.retest.status} />}
            >
              {summary.retest.failedInitially === 0 ? (
                <EmptyNote>Nothing failed in the initial runs, so there is nothing to retest.</EmptyNote>
              ) : (
                <>
                  <div className="qs-metrics">
                    <MetricCell label="Failed Initially" value={summary.retest.failedInitially} tone="red" />
                    <MetricCell label="Retested" value={summary.retest.retested} tone="blue" />
                    <MetricCell label="Passed After Retest" value={summary.retest.passedAfterRetest} tone="green" />
                    <MetricCell label="Still Failed" value={summary.retest.stillFailed} tone={summary.retest.stillFailed ? "red" : "green"} />
                  </div>
                  <p className="qs-hint" style={{ marginTop: 10 }}>
                    Retesting uses new test runs — the original execution results are never rewritten. Link a retest run
                    from Edit → Testing Evidence.
                  </p>
                </>
              )}
            </Section>

            {/* ── 9. QA Recommendation (§16) ──────────────────────── */}
            <Section index={9} title="QA Recommendation">
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <RecommendationPill value={data.qa_recommendation} />
                {data.recommendation_ack && (
                  <span className="qs-muted">Remaining failures explicitly accepted by QA.</span>
                )}
              </div>
              {data.recommendation_ack_note && (
                <p className="qs-hint" style={{ marginTop: 8 }}>{data.recommendation_ack_note}</p>
              )}
              {summary.warnings.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {summary.warnings.map((w, i) => (
                    <WarningBanner key={i} level={w.level}>
                      {w.message}
                    </WarningBanner>
                  ))}
                </div>
              )}
            </Section>

            {/* ── 10. QA Summary (§18) ────────────────────────────── */}
            <Section index={10} title="QA Summary">
              {hasRichText(data.qa_summary) ? (
                <div className="qs-prose">
                  <TiptapViewer content={data.qa_summary || ""} />
                </div>
              ) : (
                <EmptyNote>No QA summary written yet — it is required before sign-off.</EmptyNote>
              )}
            </Section>

            {/* ── 11. Known Issues (§19) ──────────────────────────── */}
            <Section
              index={11}
              title="Known Issues"
              description="Unresolved defects the business is being asked to accept."
              actions={
                canUpdateSubmission && !locked ? (
                  <Button size="small" icon={<PlusOutlined />} onClick={() => setIssueModal({})}>
                    Add
                  </Button>
                ) : undefined
              }
            >
              {data.knownIssues.length === 0 ? (
                <EmptyNote>No known issues recorded.</EmptyNote>
              ) : (
                <Table
                  className="sc-table"
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={data.knownIssues}
                  columns={[
                    { title: "Bug", dataIndex: "bug_number", key: "bug_number", width: 110, render: (v: string) => v || "—" },
                    { title: "Severity", dataIndex: "severity", key: "severity", width: 100, render: (v: string) => v || "—" },
                    { title: "Status", dataIndex: "current_status", key: "current_status", width: 100, render: (v: string) => v || "—" },
                    { title: "Business Impact", dataIndex: "business_impact", key: "business_impact" },
                    { title: "Workaround", dataIndex: "workaround", key: "workaround" },
                    {
                      title: "Expected Resolution",
                      dataIndex: "expected_resolution",
                      key: "expected_resolution",
                      width: 150,
                      render: (v: string) => fmtDate(v),
                    },
                    { title: "Accepted By", dataIndex: "accepted_by", key: "accepted_by", width: 130, render: (v: string) => v || "—" },
                    ...(canUpdateSubmission && !locked
                      ? [
                          {
                            title: "",
                            key: "actions",
                            width: 80,
                            align: "right" as const,
                            render: (_: any, r: KnownIssue) => (
                              <div className="sc-rowactions">
                                <button className="qs-iconbtn" onClick={() => setIssueModal(r)} aria-label="Edit">
                                  <Pencil size={14} />
                                </button>
                                <ConfirmDialog
                                  tone="danger"
                                  title="Remove this known issue?"
                                  confirmText="Remove"
                                  onConfirm={() => act(() => QaSubmissionService.deleteKnownIssue(id, r.id), "Known issue removed")}
                                >
                                  <button className="qs-iconbtn is-danger" aria-label="Remove">
                                    <Trash2 size={14} />
                                  </button>
                                </ConfirmDialog>
                              </div>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              )}
            </Section>

            {/* ── 12. Attachments (§20) ───────────────────────────── */}
            <Section
              index={12}
              title="Attachments"
              description="Supporting evidence — reports, screenshots and documents."
              actions={
                canUpdateSubmission && !locked ? (
                  <Button size="small" icon={<PaperClipOutlined />} onClick={() => setAttachmentOpen(true)}>
                    Add
                  </Button>
                ) : undefined
              }
            >
              {data.attachments.length === 0 ? (
                <EmptyNote>No attachments.</EmptyNote>
              ) : (
                <Table
                  className="sc-table"
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={data.attachments}
                  columns={[
                    {
                      title: "File",
                      key: "name",
                      render: (_: any, r: any) => (
                        <a href={r.url} target="_blank" rel="noreferrer" className="qs-linkbtn">
                          {r.kind === "link" ? <Link2 size={13} style={{ marginRight: 6, display: "inline" }} /> : null}
                          {r.name}
                        </a>
                      ),
                    },
                    { title: "Category", dataIndex: "category", key: "category", width: 140 },
                    {
                      title: "Type",
                      key: "type",
                      width: 130,
                      render: (_: any, r: any) => (r.kind === "link" ? "Link" : r.file_type || "File"),
                    },
                    {
                      title: "Size",
                      key: "size",
                      width: 90,
                      render: (_: any, r: any) => fmtBytes(r.file_size) || "—",
                    },
                    { title: "Uploaded by", dataIndex: "uploaded_by_name", key: "uploaded_by_name", width: 150, render: (v: string) => v || "—" },
                    { title: "Uploaded", dataIndex: "created_at", key: "created_at", width: 130, render: (v: string) => fmtDate(v) },
                    ...(canUpdateSubmission && !locked
                      ? [
                          {
                            title: "",
                            key: "actions",
                            width: 60,
                            align: "right" as const,
                            render: (_: any, r: any) => (
                              <ConfirmDialog
                                tone="danger"
                                title="Remove this attachment?"
                                confirmText="Remove"
                                onConfirm={() => act(() => QaSubmissionService.deleteAttachment(id, r.id), "Attachment removed")}
                              >
                                <button className="qs-iconbtn is-danger" aria-label="Remove">
                                  <Trash2 size={14} />
                                </button>
                              </ConfirmDialog>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              )}
            </Section>

            {/* ── 13. QA Sign-off (§24) ───────────────────────────── */}
            <Section index={13} title="QA Sign-off" description="QA's final recommendation for this scope.">
              {data.signed_off_at ? (
                <div className="qs-header__facts" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                  <div className="qs-fact">
                    <dt>Signed off by</dt>
                    <dd>{data.signed_off_by_name || "—"}</dd>
                  </div>
                  <div className="qs-fact">
                    <dt>Signed off on</dt>
                    <dd>{fmtDate(data.signed_off_at, true)}</dd>
                  </div>
                  <div className="qs-fact">
                    <dt>Recommendation</dt>
                    <dd>
                      <RecommendationPill value={data.qa_recommendation} size="sm" />
                    </dd>
                  </div>
                  {data.signoff_comment && (
                    <div className="qs-fact" style={{ gridColumn: "1 / -1" }}>
                      <dt>Comment</dt>
                      <dd style={{ fontWeight: 500 }}>{data.signoff_comment}</dd>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyNote>
                  Not signed off yet. Sign-off records the final QA recommendation and freezes these figures.
                </EmptyNote>
              )}
            </Section>

            {/* ── 14. Approver (§25, §26) ─────────────────────────── */}
            <Section
              index={14}
              title="Approver"
              description="Business acceptance, separate from QA's recommendation."
            >
              <div className="qs-header__facts" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                {/* Named up front, so it is clear who this is waiting on before
                    anyone has acted — not only once it has been approved. */}
                <div className="qs-fact">
                  <dt>Approver</dt>
                  <dd>
                    {approverName || <span className="qs-muted">No reviewer linked</span>}
                  </dd>
                </div>
                <div className="qs-fact">
                  <dt>Status</dt>
                  <dd>
                    {data.approved_at ? (
                      <span className="qs-pill qs-pill--green qs-pill--sm">
                        <span className="qs-pill__dot" />
                        Approved
                      </span>
                    ) : awaitingApproval ? (
                      <span className="qs-pill qs-pill--blue qs-pill--sm">
                        <span className="qs-pill__dot" />
                        Awaiting approval
                      </span>
                    ) : (
                      <span className="qs-pill qs-pill--ash qs-pill--sm">
                        <span className="qs-pill__dot" />
                        Not yet due
                      </span>
                    )}
                  </dd>
                </div>
                {data.approved_at && (
                  <div className="qs-fact">
                    <dt>Approved on</dt>
                    <dd>{fmtDate(data.approved_at, true)}</dd>
                  </div>
                )}
                {approvedBySomeoneElse && (
                  <div className="qs-fact">
                    <dt>Approved by</dt>
                    <dd>{data.approved_by_name || "—"}</dd>
                  </div>
                )}
                {data.approver_comment && (
                  <div className="qs-fact" style={{ gridColumn: "1 / -1" }}>
                    <dt>Comment</dt>
                    <dd style={{ fontWeight: 500 }}>{data.approver_comment}</dd>
                  </div>
                )}
              </div>

              {approvedBySomeoneElse && (
                <p className="qs-hint" style={{ marginTop: 10 }}>
                  Approved by {data.approved_by_name} rather than the linked reviewer
                  {approverName ? ` (${approverName})` : ""}.
                </p>
              )}
              {!data.approved_at && !awaitingApproval && (
                <p className="qs-hint" style={{ marginTop: 10 }}>
                  Approval becomes available once QA has signed off.
                </p>
              )}
              {!approverName && (
                <p className="qs-hint" style={{ marginTop: 10 }}>
                  No Reviewer is set on this submission — add one from Edit so it is clear who approves.
                </p>
              )}
            </Section>

            {/* ── 15. Submission History (§27, §29) ───────────────── */}
            <Section
              index={15}
              title="Submission History"
              description="Every status change, submission and approval, in order."
              actions={
                data.versions.length > 0 ? (
                  <span className="qs-muted">
                    <History size={12} style={{ display: "inline", marginRight: 4 }} />
                    {data.versions.length} version{data.versions.length === 1 ? "" : "s"}
                  </span>
                ) : undefined
              }
            >
              {data.versions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="qs-runlist-caption">Submitted versions</div>
                  {data.versions.map((v) => (
                    <div key={v.version} className="qs-runrow">
                      <div className="qs-runrow__body">
                        <div className="qs-runrow__top">
                          <span className="qs-runrow__name">Submission v{v.version}</span>
                          {v.version === data.version && (
                            <span className="qs-pill qs-pill--blue qs-pill--sm">
                              <span className="qs-pill__dot" />
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="qs-runrow__meta">
                          <span>{fmtDate(v.created_at, true)}</span>
                          {v.created_by_name && (
                            <>
                              <span>·</span>
                              <span>{v.created_by_name}</span>
                            </>
                          )}
                        </div>
                        {v.execution && (
                          <div className="qs-runrow__stats">
                            <span className="qs-runrow__stat">Total <b>{v.execution.totalCases}</b></span>
                            <span className="qs-runrow__stat is-pass">Passed <b>{v.execution.passed}</b></span>
                            <span className="qs-runrow__stat is-fail">Failed <b>{v.execution.failed}</b></span>
                            <span className="qs-runrow__stat is-blocked">Blocked <b>{v.execution.blocked}</b></span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.history.length === 0 ? (
                <EmptyNote>No history recorded yet.</EmptyNote>
              ) : (
                <div className="qs-timeline">
                  {data.history.map((h) => (
                    <div
                      key={h.id}
                      className={`qs-tl-item${GOOD_EVENTS.has(h.event_type) ? " is-good" : KEY_EVENTS.has(h.event_type) ? " is-key" : ""}`}
                    >
                      <div className="qs-tl-time">{fmtDateTimeShort(h.created_at)}</div>
                      <div className="qs-tl-title">{h.title}</div>
                      {h.detail && <div className="qs-tl-detail">{h.detail}</div>}
                      {h.actor_name && <div className="qs-tl-actor">{h.actor_name}</div>}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* ── QA Sign-off review (§23) ──────────────────────────────── */}
      <Modal
        open={signoffOpen}
        onCancel={() => setSignoffOpen(false)}
        title="Confirm QA Sign-off"
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setSignoffOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="go"
            type="primary"
            icon={<ShieldCheck size={14} />}
            disabled={!signoffConfirmed || !signoffPreview?.canSignOff}
            loading={busy}
            onClick={async () => {
              await act(() => QaSubmissionService.signOff(id, signoffComment), "QA Sign-off completed");
              setSignoffOpen(false);
            }}
          >
            Confirm QA Sign-off
          </Button>,
        ]}
      >
        {signoffPreview && (
          <>
            {signoffPreview.blockers.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {signoffPreview.blockers.map((b: string, i: number) => (
                  <WarningBanner key={i} level="critical">
                    {b}
                  </WarningBanner>
                ))}
              </div>
            )}

            <div className="qs-header__facts" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              <div className="qs-fact">
                <dt>Scope</dt>
                <dd>{signoffPreview.scope_name || "—"}</dd>
              </div>
              <div className="qs-fact">
                <dt>Recommendation</dt>
                <dd>
                  <RecommendationPill value={signoffPreview.qa_recommendation} size="sm" />
                </dd>
              </div>
            </div>

            <div className="qs-runlist-caption">Testing runs</div>
            {signoffPreview.runs.map((r: any) => (
              <div key={r.id} className="qs-runrow" style={{ padding: "8px 10px" }}>
                <CheckCircle2 size={15} style={{ color: "#10b981", marginTop: 2, flexShrink: 0 }} />
                <div className="qs-runrow__body">
                  <span className="qs-runrow__name">{r.run_name}</span>
                  <div className="qs-runrow__meta">
                    {r.run_role === "retest" ? "Retest" : "Initial"} · {r.passed}/{r.total_cases} passed
                  </div>
                </div>
              </div>
            ))}

            <div className="qs-runlist-caption">Test results</div>
            <div className="qs-metrics">
              <MetricCell label="Total" value={signoffPreview.execution.totalCases} />
              <MetricCell label="Passed" value={signoffPreview.execution.passed} tone="green" />
              <MetricCell label="Failed" value={signoffPreview.execution.failed} tone="red" />
              <MetricCell label="Blocked" value={signoffPreview.execution.blocked} tone="amber" />
            </div>

            <div className="qs-runlist-caption">Defects</div>
            <div className="qs-metrics">
              <MetricCell label="Created" value={signoffPreview.bugs.total} />
              <MetricCell label="Resolved" value={signoffPreview.bugs.resolved} tone="green" />
              <MetricCell label="Open" value={signoffPreview.bugs.open} tone={signoffPreview.bugs.open ? "red" : "green"} />
            </div>

            {signoffPreview.warnings.length > 0 && (
              <div style={{ marginTop: 14 }}>
                {signoffPreview.warnings.map((w: any, i: number) => (
                  <WarningBanner key={i} level={w.level}>
                    {w.message}
                  </WarningBanner>
                ))}
              </div>
            )}

            <div className="qs-confirmbox" style={{ marginTop: 14 }}>
              <Checkbox checked={signoffConfirmed} onChange={(ev) => setSignoffConfirmed(ev.target.checked)}>
                I confirm that the required testing and retesting for this scope have been completed and the above
                results accurately represent the QA outcome.
              </Checkbox>
            </div>

            <Input.TextArea
              style={{ marginTop: 12 }}
              rows={2}
              value={signoffComment}
              onChange={(ev) => setSignoffComment(ev.target.value)}
              placeholder="Sign-off comment (optional)"
            />
          </>
        )}
      </Modal>

      {/* ── Approve (§26) ─────────────────────────────────────────── */}
      <Modal
        open={approveOpen}
        onCancel={() => setApproveOpen(false)}
        title="Approve this QA Submission"
        okText="Approve"
        confirmLoading={busy}
        onOk={async () => {
          await act(() => QaSubmissionService.approve(id, approveComment), "Submission approved");
          setApproveOpen(false);
          setApproveComment("");
        }}
      >
        <p className="qs-hint" style={{ marginBottom: 10 }}>
          Approving accepts QA&apos;s recommendation of <strong>{data.qa_recommendation}</strong> for{" "}
          <strong>{data.scope_name}</strong>.
        </p>
        {approverName && (
          <p className="qs-hint" style={{ marginBottom: 10 }}>
            The linked approver is <strong>{approverName}</strong>. Whoever confirms is recorded on the submission.
          </p>
        )}
        <Input.TextArea
          rows={3}
          value={approveComment}
          onChange={(ev) => setApproveComment(ev.target.value)}
          placeholder="Approval comment (optional)"
        />
      </Modal>

      {/* ── Send Back — reason required (§26, §33.15) ─────────────── */}
      <Modal
        open={sendBackOpen}
        onCancel={() => setSendBackOpen(false)}
        width={560}
        className="qs-sbm"
        title={
          <div className="qs-sbm__head">
            <span className="qs-sbm__icon">
              <Undo2 size={17} />
            </span>
            <div className="qs-sbm__headtext">
              <h3>Send back to QA</h3>
              <span>
                {data.submission_name}
                {data.scope_name ? ` · ${data.scope_name}` : ""}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="qs-sbm__foot">
            <Button onClick={() => setSendBackOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              icon={<Undo2 size={14} />}
              disabled={!sendBackReason.trim()}
              loading={busy}
              onClick={async () => {
                await act(() => QaSubmissionService.sendBack(id, sendBackReason), "Submission sent back");
                setSendBackOpen(false);
                setSendBackReason("");
              }}
            >
              Send Back to QA
            </Button>
          </div>
        }
      >
        {/* Withdrawing a sign-off is the consequential, non-obvious part of this
            action — surfaced at the point of decision, not after the fact. */}
        {awaitingApproval && (
          <WarningBanner level="warning">
            This withdraws QA&apos;s sign-off. The submission returns to live figures and has to be signed off again
            before it comes back to you. The signed-off numbers stay readable as version {data.version}.
          </WarningBanner>
        )}

        <div className="qs-field" style={{ marginTop: awaitingApproval ? 14 : 0 }}>
          <label className="qs-label">
            Reason <span className="qs-req">*</span>
          </label>
          <Input.TextArea
            rows={4}
            value={sendBackReason}
            onChange={(ev) => setSendBackReason(ev.target.value)}
            placeholder="E.g. Please retest the payment timeout scenario before final approval."
            autoFocus
          />
          <p className="qs-hint">
            QA acts on this directly — say what needs testing or changing, not just that something is wrong.
          </p>
        </div>

        {/* Built from this submission's own numbers, so the shortcuts are always
            about what is actually outstanding rather than generic boilerplate. */}
        {sendBackSuggestions.length > 0 && (
          <div className="qs-field">
            <span className="qs-sbm__caption">Based on this submission</span>
            <div className="qs-sbm__chips">
              {sendBackSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="qs-sbm__chip"
                  onClick={() =>
                    // Append, so several outstanding items can be raised at once.
                    setSendBackReason((prev) => (prev.trim() ? `${prev.trim()}\n${s}` : s))
                  }
                >
                  <Plus size={12} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="qs-sbm__next">
          <span className="qs-sbm__caption">What happens next</span>
          <ol>
            <li>
              Status becomes <strong>Sent Back</strong> and your reason appears on the submission.
            </li>
            <li>QA reworks it, links any new retest runs and submits again as <strong>v{data.version + 1}</strong>.</li>
            <li>{awaitingApproval ? "QA signs off again and it returns to you." : "It carries on through sign-off."}</li>
          </ol>
        </div>
      </Modal>

      {/* ── Reopen a signed-off submission (§32) ──────────────────── */}
      <Modal
        open={reopenOpen}
        onCancel={() => setReopenOpen(false)}
        title="Reopen this submission"
        okText="Reopen"
        okButtonProps={{ disabled: !reopenReason.trim() }}
        confirmLoading={busy}
        onOk={async () => {
          await act(() => QaSubmissionService.reopen(id, reopenReason), "Submission reopened for retesting");
          setReopenOpen(false);
          setReopenReason("");
        }}
      >
        <p className="qs-hint" style={{ marginBottom: 10 }}>
          The signed-off figures are preserved as version {data.version} — reopening never rewrites what was already
          signed off. The submission moves back to Retesting.
        </p>
        <Input.TextArea
          rows={3}
          value={reopenReason}
          onChange={(ev) => setReopenReason(ev.target.value)}
          placeholder="Why does this submission need reopening?"
        />
      </Modal>

      {/* ── Result click-through (§11) ────────────────────────────── */}
      <Modal
        open={!!caseModal}
        onCancel={() => setCaseModal(null)}
        title={`${caseModal?.status} test cases`}
        width={860}
        footer={<Button onClick={() => setCaseModal(null)}>Close</Button>}
      >
        <Table
          className="sc-table"
          size="small"
          rowKey="test_case_id"
          pagination={{ pageSize: 10, size: "small" }}
          dataSource={caseModal?.rows || []}
          columns={[
            {
              title: "Test Case",
              key: "case",
              render: (_: any, r: FailedCase) => (
                <div className="sc-name__text">
                  <span className="sc-name__title">{r.case_name}</span>
                  <span className="sc-name__meta">{r.case_ref}</span>
                </div>
              ),
            },
            { title: "Run", dataIndex: "run_name", key: "run_name", width: 180 },
            { title: "Severity", dataIndex: "severity", key: "severity", width: 110, render: (v: string) => v || "—" },
            ...(caseModal?.status === "Fail"
              ? [
                  { title: "Bug", dataIndex: "bug_number", key: "bug_number", width: 110, render: (v: string) => v || "—" },
                  { title: "Ticket", dataIndex: "ticket_number", key: "ticket_number", width: 120, render: (v: string) => v || "—" },
                ]
              : []),
          ]}
        />
      </Modal>

      {/* ── Known issue editor (§19) ──────────────────────────────── */}
      <Modal
        open={!!issueModal}
        onCancel={() => setIssueModal(null)}
        title={issueModal?.id ? "Edit known issue" : "Add a known issue"}
        okText="Save"
        confirmLoading={busy}
        onOk={saveIssue}
        width={620}
      >
        <div className="qs-grid2">
          <div className="qs-field">
            <label className="qs-label">Bug</label>
            <Input
              value={issueModal?.bug_number ?? ""}
              onChange={(ev) => setIssueModal((p) => ({ ...p, bug_number: ev.target.value }))}
              placeholder="E.g. BUG-108"
            />
          </div>
          <div className="qs-field">
            <label className="qs-label">Severity</label>
            <Input
              value={issueModal?.severity ?? ""}
              onChange={(ev) => setIssueModal((p) => ({ ...p, severity: ev.target.value }))}
              placeholder="E.g. Medium"
            />
          </div>
        </div>
        <div className="qs-grid2">
          <div className="qs-field">
            <label className="qs-label">Current Status</label>
            <Input
              value={issueModal?.current_status ?? ""}
              onChange={(ev) => setIssueModal((p) => ({ ...p, current_status: ev.target.value }))}
              placeholder="E.g. Open"
            />
          </div>
          <div className="qs-field">
            <label className="qs-label">Expected Resolution</label>
            <Input
              type="date"
              value={issueModal?.expected_resolution ?? ""}
              onChange={(ev) => setIssueModal((p) => ({ ...p, expected_resolution: ev.target.value }))}
            />
          </div>
        </div>
        <div className="qs-field">
          <label className="qs-label">Business Impact</label>
          <Input.TextArea
            rows={2}
            value={issueModal?.business_impact ?? ""}
            onChange={(ev) => setIssueModal((p) => ({ ...p, business_impact: ev.target.value }))}
            placeholder="E.g. Minor UI issue in the filter panel."
          />
        </div>
        <div className="qs-field">
          <label className="qs-label">Workaround</label>
          <Input.TextArea
            rows={2}
            value={issueModal?.workaround ?? ""}
            onChange={(ev) => setIssueModal((p) => ({ ...p, workaround: ev.target.value }))}
            placeholder="E.g. Users can refresh the page."
          />
        </div>
        <div className="qs-grid2">
          <div className="qs-field">
            <label className="qs-label">Accepted By</label>
            <Input
              value={issueModal?.accepted_by ?? ""}
              onChange={(ev) => setIssueModal((p) => ({ ...p, accepted_by: ev.target.value }))}
              placeholder="E.g. PM / Product Owner"
            />
          </div>
          <div className="qs-field">
            <label className="qs-label">Comment</label>
            <Input
              value={issueModal?.comment ?? ""}
              onChange={(ev) => setIssueModal((p) => ({ ...p, comment: ev.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* ── Attachments (§20) ─────────────────────────────────────── */}
      <Modal
        open={attachmentOpen}
        onCancel={() => setAttachmentOpen(false)}
        title="Add supporting evidence"
        footer={<Button onClick={() => setAttachmentOpen(false)}>Close</Button>}
      >
        <div className="qs-field">
          <label className="qs-label">Category</label>
          <SearchableDropdown
            options={ATTACHMENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            value={attachmentCategory}
            onChange={(v) => setAttachmentCategory(v)}
            hideAvatar
            allowClear={false}
            itemNoun="categories"
          />
        </div>
        <div className="qs-field">
          <label className="qs-label">Upload a file</label>
          <Upload beforeUpload={uploadAttachment} showUploadList={false} maxCount={1}>
            <Button icon={<PaperClipOutlined />}>Choose file</Button>
          </Upload>
          <p className="qs-hint">Up to 10 MB per file.</p>
        </div>
        <div className="qs-field">
          <label className="qs-label">…or link to something hosted elsewhere</label>
          <Input
            value={attachmentUrl}
            onChange={(ev) => setAttachmentUrl(ev.target.value)}
            placeholder="https://…"
            style={{ marginBottom: 8 }}
          />
          <Input
            value={attachmentName}
            onChange={(ev) => setAttachmentName(ev.target.value)}
            placeholder="Label (optional)"
          />
          <Button type="primary" style={{ marginTop: 8 }} onClick={addLink} loading={busy}>
            Add link
          </Button>
        </div>
      </Modal>
    </MainLayout>
  );
}
