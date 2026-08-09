"use client";

/**
 * Create / edit a QA Submission (§6–§8, §10, §16–§18).
 *
 * Everything numeric on this form is read-only and derived from the Test Runs
 * the user picks — QA never types a pass/fail count (§33.3, §33.4). The form
 * covers the sections that are meaningful *before* the record exists; the
 * derived sections that need saved data (bug summary, dev tickets, failed
 * cases, retesting history, known issues, attachments) live on the submission's
 * detail page.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { App, Button, Checkbox, Input, Modal, Tooltip } from "antd";
import { ArrowLeftOutlined, CloseOutlined } from "@ant-design/icons";
import { Sparkles, SpellCheck2, PlayCircle, RefreshCcw, Info } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { MembersService } from "@/services/membersService";
import TiptapEditor from "@/components/common/TiptapEditor";
import ZukvoLoader, { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import QaSubmissionService, {
  RECOMMENDATIONS,
  RECOMMENDATION_HELP,
  SUBMISSION_TYPES,
  type QaRecommendation,
  type SaveSubmissionInput,
  type SelectableRun,
  type SubmissionDetail,
  type SubmissionType,
} from "@/services/qaSubmissionService";
import {
  MetricCell,
  QA_SUBMISSION_STYLES,
  Section,
  WarningBanner,
  fmtDate,
  hasRichText,
} from "./shared";

type RunSelection = Record<string, "initial" | "retest">;

interface Props {
  /** Present when editing an existing submission. */
  submission?: SubmissionDetail;
}

export default function SubmissionForm({ submission }: Props) {
  useActivitySource({ section: "WORK", module: "QA", page: "QaSubmissionForm" });

  const router = useRouter();
  const { message } = App.useApp();
  const { user } = useAuth();
  const { canCreateSubmission, canUpdateSubmission, canManageQa } = usePermission();
  const isEdit = !!submission;
  const allowed = isEdit ? canUpdateSubmission : canCreateSubmission;

  const [scopes, setScopes] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [runs, setRuns] = useState<SelectableRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(submission?.submission_name ?? "");
  const [scopeId, setScopeId] = useState<string | undefined>(submission?.scope_id);
  const [type, setType] = useState<SubmissionType>(submission?.submission_type ?? "Testing Completion");
  const [qaOwnerId, setQaOwnerId] = useState<string | undefined>(submission?.qa_owner_id ?? undefined);
  const [reviewerId, setReviewerId] = useState<string | undefined>(submission?.reviewer_id ?? undefined);
  const [description, setDescription] = useState(submission?.description ?? "");
  const [qaSummary, setQaSummary] = useState(submission?.qa_summary ?? "");
  const [recommendation, setRecommendation] = useState<QaRecommendation | undefined>(
    submission?.qa_recommendation ?? undefined,
  );
  const [ack, setAck] = useState(!!submission?.recommendation_ack);
  const [ackNote, setAckNote] = useState(submission?.recommendation_ack_note ?? "");

  const [selection, setSelection] = useState<RunSelection>(() => {
    const initial: RunSelection = {};
    submission?.summary?.runs?.forEach((r) => {
      initial[r.id] = r.run_role;
    });
    return initial;
  });

  // AI (§18)
  const [zaiOpen, setZaiOpen] = useState(false);
  const [zaiPrompt, setZaiPrompt] = useState("");
  const [zaiDraft, setZaiDraft] = useState("");
  const [zaiBusy, setZaiBusy] = useState(false);
  const [polishing, setPolishing] = useState(false);

  // ─── Reference data ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [scopeRes, memberRes] = await Promise.all([
          axios.get("/api/v2/qa/test-scopes"),
          MembersService.getMembers({ limit: 500 }),
        ]);
        setScopes(Array.isArray(scopeRes) ? scopeRes : (scopeRes as any)?.data?.data || (scopeRes as any)?.data || []);
        setMembers(memberRes.data || []);
      } catch {
        message.error("Failed to load scopes and members");
      }
    })();
  }, [message]);

  /** QA Owner defaults to the signed-in user (§7). Only fills an empty field. */
  useEffect(() => {
    if (isEdit || qaOwnerId || !user?.id) return;
    setQaOwnerId(String(user.id));
  }, [isEdit, qaOwnerId, user?.id]);

  const selectedScope = useMemo(
    () => scopes.find((s: any) => s.id === scopeId),
    [scopes, scopeId],
  );

  /**
   * Reviewer follows the scope's configured reviewer/approver, unless the user
   * has already chosen someone (§7).
   *
   * Scopes store this two ways: approvalWorkflow.user is a real user id, but
   * details.reviewer is only a display name. Falling back to a name match means
   * the field prefills on scopes that never went through the approval-workflow
   * picker — an ambiguous or unrecognised name is left blank rather than
   * guessed, since this is who ends up accepting the QA outcome.
   */
  useEffect(() => {
    if (!selectedScope || reviewerId) return;

    const configuredId = selectedScope.details?.approvalWorkflow?.user;
    if (configuredId) {
      setReviewerId(String(configuredId));
      return;
    }

    const name = String(selectedScope.details?.reviewer ?? "").trim().toLowerCase();
    if (!name || members.length === 0) return;

    const matches = members.filter((m: any) => String(m.name ?? "").trim().toLowerCase() === name);
    if (matches.length === 1) setReviewerId(String(matches[0].id));
  }, [selectedScope, reviewerId, members]);

  // ─── Runs for the chosen scope (§8) ────────────────────────────────
  const loadRuns = useCallback(async () => {
    if (!scopeId) {
      setRuns([]);
      return;
    }
    try {
      setLoadingRuns(true);
      setRuns(await QaSubmissionService.getScopeRuns(scopeId, submission?.id));
    } catch {
      message.error("Failed to load test runs for this scope");
    } finally {
      setLoadingRuns(false);
    }
  }, [scopeId, submission?.id, message]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Drop selections that no longer belong to the chosen scope.
  useEffect(() => {
    if (!runs.length) return;
    const valid = new Set(runs.map((r) => r.id));
    setSelection((prev) => {
      const next: RunSelection = {};
      for (const [id, role] of Object.entries(prev)) if (valid.has(id)) next[id] = role;
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [runs]);

  const toggleRun = (run: SelectableRun) => {
    if (!run.selectable) return;
    setSelection((prev) => {
      const next = { ...prev };
      if (next[run.id]) delete next[run.id];
      // A retest submission's runs default to the retest role, which is what
      // drives the retesting figures (§15).
      else next[run.id] = type === "Retest Submission" ? "retest" : "initial";
      return next;
    });
  };

  const setRunRole = (runId: string, role: "initial" | "retest") =>
    setSelection((prev) => (prev[runId] ? { ...prev, [runId]: role } : prev));

  const selectedRuns = useMemo(() => runs.filter((r) => selection[r.id]), [runs, selection]);
  const attributedRuns = useMemo(() => runs.filter((r) => !r.unattributed), [runs]);
  const unattributedRuns = useMemo(() => runs.filter((r) => r.unattributed), [runs]);

  /**
   * Preview only.
   *
   * The authoritative figures collapse the linked runs to one result per test
   * case — which cannot be done here, because the browser never sees the case
   * ids. This sums the runs the user picked as *initial* evidence and reports
   * retest runs on their own, which matches the real totals for the normal case
   * (suites covering different cases) and is labelled as an estimate either way.
   */
  const preview = useMemo(() => {
    const initial = selectedRuns.filter((r) => selection[r.id] === "initial");
    const acc = { total: 0, passed: 0, failed: 0, blocked: 0, notExecuted: 0 };
    for (const r of initial) {
      acc.total += r.total_cases;
      acc.passed += r.passed;
      acc.failed += r.failed;
      acc.blocked += r.blocked;
      acc.notExecuted += r.not_executed;
    }
    const executed = acc.total - acc.notExecuted;
    return {
      ...acc,
      executed,
      passRate: executed > 0 ? Math.round((acc.passed / executed) * 1000) / 10 : 0,
      executionRate: acc.total > 0 ? Math.round((executed / acc.total) * 1000) / 10 : 0,
      retestCount: selectedRuns.length - initial.length,
    };
  }, [selectedRuns, selection]);

  /** Advisory warnings, mirroring the server's §17 rules. */
  const warnings = useMemo(() => {
    const out: Array<{ level: "critical" | "warning"; message: string }> = [];
    if (preview.failed > 0) {
      out.push({
        level: "warning",
        message: `${preview.failed} test case${preview.failed === 1 ? "" : "s"} failed in the selected runs.`,
      });
    }
    if (preview.notExecuted > 0) out.push({ level: "warning", message: "Some planned test cases have not been executed." });
    if (preview.blocked > 0) out.push({ level: "warning", message: "Blocked test cases remain in the selected runs." });
    return out;
  }, [preview]);

  /** §17 — "Pass" while failures remain needs an explicit acknowledgement. */
  const needsAck = recommendation === "Pass" && preview.failed > 0;

  // ─── AI (§18) ──────────────────────────────────────────────────────
  const openZai = () => {
    if (!isEdit) {
      message.info("Save the submission first — Zai drafts the summary from its linked runs.");
      return;
    }
    setZaiDraft("");
    setZaiPrompt("");
    setZaiOpen(true);
  };

  const runZai = async () => {
    if (!submission) return;
    try {
      setZaiBusy(true);
      setZaiDraft(await QaSubmissionService.draftSummary(submission.id, zaiPrompt));
    } catch (e: any) {
      message.error(e?.response?.data?.error || "Zai could not draft the summary");
    } finally {
      setZaiBusy(false);
    }
  };

  /** Explicit user action — AI output never lands in the field on its own. */
  const applyZai = (mode: "replace" | "append") => {
    setQaSummary((prev) => (mode === "append" && prev ? `${prev}\n${zaiDraft}` : zaiDraft));
    setZaiOpen(false);
    message.success(mode === "append" ? "Draft appended to the QA Summary" : "QA Summary replaced with the draft");
  };

  const polish = async () => {
    if (!hasRichText(qaSummary)) return message.info("Write the summary first, then polish it.");
    try {
      setPolishing(true);
      setQaSummary(await QaSubmissionService.polishText(qaSummary));
      message.success("Summary polished");
    } catch (e: any) {
      message.error(e?.response?.data?.error || "Could not polish the summary");
    } finally {
      setPolishing(false);
    }
  };

  // ─── Save ──────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!name.trim()) return "Submission Name is required";
    if (!scopeId) return "Test Scope is required";
    if (!selectedRuns.length) return "Select at least one Test Run as testing evidence";
    if (needsAck && !ack) {
      return 'Confirm that the remaining failures are accepted before recommending "Pass"';
    }
    return null;
  };

  const save = async (thenSubmit = false) => {
    const problem = validate();
    if (problem) return message.error(problem);

    const payload: SaveSubmissionInput = {
      submission_name: name.trim(),
      scope_id: scopeId,
      submission_type: type,
      qa_owner_id: qaOwnerId || null,
      reviewer_id: reviewerId || null,
      description: description || null,
      qa_summary: qaSummary || null,
      qa_recommendation: recommendation ?? null,
      recommendation_ack: ack,
      recommendation_ack_note: ackNote || null,
      runs: Object.entries(selection).map(([runId, role]) => ({ runId, role })),
    };

    try {
      setSaving(true);
      const saved = isEdit
        ? await QaSubmissionService.update(submission!.id, payload)
        : await QaSubmissionService.create(payload);

      if (thenSubmit) {
        await QaSubmissionService.submit(saved.id);
        message.success("Testing results submitted");
      } else {
        message.success(isEdit ? "QA Submission updated" : "QA Submission created");
      }
      router.push(`/qa-workspace/qa-submissions/${saved.id}`);
    } catch (e: any) {
      message.error(e?.response?.data?.error || "Failed to save the submission");
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return null;

  const memberOptions = members.map((m: any) => ({
    value: String(m.id),
    label: m.name,
    avatarUrl: m.avatarUrl,
    description: m.position?.name || m.designation || undefined,
  }));

  const renderRunRow = (run: SelectableRun) => {
    const selected = !!selection[run.id];
    return (
      <div
        key={run.id}
        className={`qs-runrow${selected ? " is-selected" : ""}${run.selectable ? "" : " is-disabled"}`}
      >
        <Checkbox
          checked={selected}
          disabled={!run.selectable}
          onChange={() => toggleRun(run)}
          style={{ marginTop: 2 }}
        />
        <div className="qs-runrow__body">
          <div className="qs-runrow__top">
            <span className="qs-runrow__name">{run.run_name}</span>
            {run.already_submitted && (
              // §9 — surfaced, not blocked. Reusing a run can be deliberate.
              <Tooltip title={`Already used by: ${run.used_by.join(", ")}`}>
                <span className="qs-pill qs-pill--amber qs-pill--sm">
                  <span className="qs-pill__dot" />
                  Already submitted
                </span>
              </Tooltip>
            )}
            {!run.selectable && (
              <span className="qs-pill qs-pill--ash qs-pill--sm">
                <span className="qs-pill__dot" />
                Nothing executed yet
              </span>
            )}
          </div>
          <div className="qs-runrow__meta">
            <span>{run.suite_name || "No suite"}</span>
            <span>·</span>
            <span>{run.execution_type || "Manual"}</span>
            <span>·</span>
            <span>
              {run.started_at ? fmtDate(run.started_at) : "Not started"} →{" "}
              {run.completed_at ? fmtDate(run.completed_at) : "in progress"}
            </span>
          </div>
          <div className="qs-runrow__stats">
            <span className="qs-runrow__stat">Total <b>{run.total_cases}</b></span>
            <span className="qs-runrow__stat is-pass">Passed <b>{run.passed}</b></span>
            <span className="qs-runrow__stat is-fail">Failed <b>{run.failed}</b></span>
            <span className="qs-runrow__stat is-blocked">Blocked <b>{run.blocked}</b></span>
            <span className="qs-runrow__stat">Not executed <b>{run.not_executed}</b></span>
            <span className="qs-runrow__stat">Executed <b>{run.execution_percentage}%</b></span>
          </div>
        </div>
        {selected && (
          <div className="qs-runrow__role">
            <SearchableDropdown
              options={[
                { value: "initial", label: "Initial run" },
                { value: "retest", label: "Retest run" },
              ]}
              value={selection[run.id]}
              onChange={(v) => setRunRole(run.id, v)}
              hideAvatar
              allowClear={false}
              width={170}
              itemNoun="roles"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: QA_SUBMISSION_STYLES }} />

      <div className="dh-main" style={{ height: "calc(100vh - 64px)" }}>
        <div className="dh-main-topbar sc-topbar">
          <div className="sc-topbar__title">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
            <span className="sc-topbar__h1">{isEdit ? "Edit QA Submission" : "Create QA Submission"}</span>
            <span className="sc-topbar__div" />
            <span className="sc-topbar__sub">
              Report the testing results for a scope — sign-off is a separate step
            </span>
          </div>
          <div className="dh-main-controls">
            <Button onClick={() => router.back()}>Cancel</Button>
            <Button loading={saving} onClick={() => save(false)}>
              Save as Draft
            </Button>
            <Button type="primary" loading={saving} onClick={() => save(true)}>
              Save &amp; Submit
            </Button>
          </div>
        </div>

        <div className="dh-main-scroll">
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            {/* ── §7 Submission Information ───────────────────────── */}
            <Section index={1} title="Submission Information" description="What is being reported, and by whom.">
              <div className="qs-field">
                <label className="qs-label">
                  Submission Name <span className="qs-req">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. TODO Module - QA Submission"
                  autoFocus
                />
                <p className="qs-hint">
                  A scope can be submitted several times — name this milestone, not the scope.
                </p>
              </div>

              <div className="qs-grid2">
                <div className="qs-field">
                  <label className="qs-label">
                    Test Scope <span className="qs-req">*</span>
                  </label>
                  <SearchableDropdown
                    options={scopes.map((s: any) => ({
                      value: s.id,
                      label: s.name,
                      description: [s.type, s.status].filter(Boolean).join(" · "),
                    }))}
                    value={scopeId}
                    onChange={(v) => setScopeId(v)}
                    placeholder="Select the scope that was tested"
                    itemNoun="scopes"
                  />
                  <p className="qs-hint">Changing the scope reloads the available test runs.</p>
                </div>

                <div className="qs-field">
                  <label className="qs-label">
                    Submission Type <span className="qs-req">*</span>
                  </label>
                  <SearchableDropdown
                    options={SUBMISSION_TYPES.map((t) => ({ value: t, label: t }))}
                    value={type}
                    onChange={(v) => setType(v)}
                    hideAvatar
                    allowClear={false}
                    itemNoun="types"
                  />
                </div>
              </div>

              {selectedScope && (
                <dl className="qs-scopecard qs-field">
                  <div>
                    <dt>Scope Type</dt>
                    <dd>{selectedScope.type || "—"}</dd>
                  </div>
                  <div>
                    <dt>Product</dt>
                    <dd>{selectedScope.details?.product || "—"}</dd>
                  </div>
                  <div>
                    <dt>Module</dt>
                    <dd>{(selectedScope.details?.modules || []).join(", ") || "—"}</dd>
                  </div>
                  <div>
                    <dt>QA Owner</dt>
                    <dd>{selectedScope.qa_owner || "—"}</dd>
                  </div>
                  <div>
                    <dt>Reviewer</dt>
                    <dd>{selectedScope.details?.reviewer || "—"}</dd>
                  </div>
                  <div>
                    <dt>Planned Start</dt>
                    <dd>{fmtDate(selectedScope.start_date)}</dd>
                  </div>
                  <div>
                    <dt>Planned End</dt>
                    <dd>{fmtDate(selectedScope.end_date)}</dd>
                  </div>
                  <div>
                    <dt>Scope Status</dt>
                    <dd>{selectedScope.status || "—"}</dd>
                  </div>
                </dl>
              )}

              <div className="qs-grid2">
                <div className="qs-field">
                  <label className="qs-label">
                    QA Owner <span className="qs-req">*</span>
                  </label>
                  <SearchableDropdown
                    options={memberOptions}
                    value={qaOwnerId}
                    onChange={(v) => setQaOwnerId(v)}
                    // Reassigning ownership is a QA-manager call, not something
                    // every engineer can do on their own submission (§7).
                    disabled={!canManageQa && isEdit && String(submission?.qa_owner_id) !== String(user?.id)}
                    placeholder="Select the QA owner"
                    itemNoun="people"
                  />
                </div>
                <div className="qs-field">
                  <label className="qs-label">Reviewer</label>
                  <SearchableDropdown
                    options={memberOptions}
                    value={reviewerId}
                    onChange={(v) => setReviewerId(v)}
                    placeholder="Prefilled from the scope where configured"
                    itemNoun="people"
                  />
                  <p className="qs-hint">
                    This is the approver — the person who accepts the QA outcome after sign-off.
                  </p>
                </div>
              </div>

              <div className="qs-field">
                <label className="qs-label">Submission Description</label>
                <TiptapEditor
                  content={description}
                  onChange={setDescription}
                  minHeight={120}
                  maxHeight={320}
                  placeholder="What testing was carried out, and anything the reviewer should know…"
                />
              </div>
            </Section>

            {/* ── §8 Testing Evidence ─────────────────────────────── */}
            <Section
              index={2}
              title="Testing Evidence"
              description="Pick the test runs this submission reports on. Mark a run as a retest to track it against the failures it re-verifies."
              actions={
                <Button size="small" icon={<RefreshCcw size={13} />} onClick={loadRuns} disabled={!scopeId}>
                  Refresh
                </Button>
              }
            >
              {!scopeId ? (
                <p className="qs-empty-note">Choose a Test Scope first — its runs will appear here.</p>
              ) : (
              // On Refresh the current runs stay in place and blur, so the
              // section keeps its height instead of collapsing and jumping.
              <ZukvoLoadingOverlay
                loading={loadingRuns}
                message="Finding test runs for this scope…"
                minHeight={runs.length === 0 ? 140 : undefined}
              >
              {loadingRuns && runs.length === 0 ? (
                <div style={{ minHeight: 140 }} />
              ) : runs.length === 0 ? (
                <p className="qs-empty-note">
                  No test runs found for this scope yet. Execute a run from the Runs page, then come back.
                </p>
              ) : (
                <>
                  {attributedRuns.length > 0 && (
                    <>
                      <div className="qs-runlist-caption">Runs for this scope</div>
                      {attributedRuns.map(renderRunRow)}
                    </>
                  )}
                  {unattributedRuns.length > 0 && (
                    <>
                      <div className="qs-runlist-caption">Runs not linked to a scope</div>
                      <p className="qs-hint" style={{ marginTop: -4, marginBottom: 8 }}>
                        These runs were created without a scope. They can still be used as evidence — set a scope on the
                        run to keep future submissions tidy.
                      </p>
                      {unattributedRuns.map(renderRunRow)}
                    </>
                  )}
                </>
              )}
              </ZukvoLoadingOverlay>
              )}
            </Section>

            {/* ── §10 / §11 Test Summary ──────────────────────────── */}
            <Section
              index={3}
              title="Test Execution Summary"
              description="Calculated from the selected runs. These figures cannot be edited by hand."
            >
              {selectedRuns.length === 0 ? (
                <p className="qs-empty-note">Select at least one test run to see the summary.</p>
              ) : (
                <>
                  <div className="qs-resultbar">
                    {preview.passed > 0 && <span className="is-pass" style={{ width: `${(preview.passed / Math.max(1, preview.total)) * 100}%` }} />}
                    {preview.failed > 0 && <span className="is-fail" style={{ width: `${(preview.failed / Math.max(1, preview.total)) * 100}%` }} />}
                    {preview.blocked > 0 && <span className="is-blocked" style={{ width: `${(preview.blocked / Math.max(1, preview.total)) * 100}%` }} />}
                    {preview.notExecuted > 0 && <span className="is-none" style={{ width: `${(preview.notExecuted / Math.max(1, preview.total)) * 100}%` }} />}
                  </div>
                  <div className="qs-metrics">
                    <MetricCell label="Total Cases" value={preview.total} />
                    <MetricCell label="Executed" value={preview.executed} tone="blue" />
                    <MetricCell label="Passed" value={preview.passed} tone="green" />
                    <MetricCell label="Failed" value={preview.failed} tone="red" />
                    <MetricCell label="Blocked" value={preview.blocked} tone="amber" />
                    <MetricCell label="Not Executed" value={preview.notExecuted} />
                    <MetricCell label="Pass Rate" value={preview.passRate} suffix="%" tone="green" />
                    <MetricCell label="Execution Rate" value={preview.executionRate} suffix="%" tone="blue" />
                  </div>
                  <p className="qs-hint" style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <Info size={13} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span>
                      Estimated from the runs marked <strong>initial</strong>
                      {preview.retestCount > 0 && ` (${preview.retestCount} retest run${preview.retestCount === 1 ? "" : "s"} tracked separately)`}.
                      On save, the submission reports one result per test case — a retested case counts once, showing its
                      latest outcome.
                    </span>
                  </p>
                </>
              )}
            </Section>

            {/* ── §16 / §17 QA Recommendation ─────────────────────── */}
            <Section
              index={4}
              title="QA Recommendation"
              description="Required before QA Sign-off. Choose what QA is recommending for this scope."
            >
              <div className="qs-field">
                <SearchableDropdown
                  options={RECOMMENDATIONS.map((r) => ({
                    value: r,
                    label: r,
                    description: RECOMMENDATION_HELP[r],
                  }))}
                  value={recommendation}
                  onChange={(v) => setRecommendation(v)}
                  hideAvatar
                  placeholder="Select a recommendation"
                  itemNoun="recommendations"
                  width={380}
                />
                {recommendation && <p className="qs-hint">{RECOMMENDATION_HELP[recommendation]}</p>}
              </div>

              {warnings.length > 0 && (
                <div className="qs-field">
                  {warnings.map((w, i) => (
                    <WarningBanner key={i} level={w.level}>
                      {w.message}
                    </WarningBanner>
                  ))}
                  <p className="qs-hint">
                    These are advisory. QA can still submit — reporting open defects is exactly what a submission is for.
                  </p>
                </div>
              )}

              {needsAck && (
                <div className="qs-field">
                  <WarningBanner level="critical">
                    You are recommending <strong>Pass</strong> while {preview.failed} case
                    {preview.failed === 1 ? "" : "s"} still fail. Confirm these are accepted, known, non-blocking issues.
                  </WarningBanner>
                  <Checkbox checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ marginTop: 8 }}>
                    I confirm the remaining failures are accepted and non-blocking.
                  </Checkbox>
                  <Input.TextArea
                    style={{ marginTop: 8 }}
                    rows={2}
                    value={ackNote}
                    onChange={(e) => setAckNote(e.target.value)}
                    placeholder="Why are these failures acceptable? (recommended)"
                  />
                </div>
              )}
            </Section>

            {/* ── §18 QA Summary ──────────────────────────────────── */}
            <Section
              index={5}
              title="QA Summary"
              description="Required before QA Sign-off. The narrative the approver reads alongside the numbers."
              actions={
                <>
                  <Tooltip title={isEdit ? "Draft a summary from this submission's own figures" : "Save the submission first"}>
                    <Button size="small" icon={<Sparkles size={13} />} onClick={openZai}>
                      Create with Zai
                    </Button>
                  </Tooltip>
                  <Button size="small" icon={<SpellCheck2 size={13} />} loading={polishing} onClick={polish}>
                    Grammar
                  </Button>
                </>
              }
            >
              <TiptapEditor
                content={qaSummary}
                onChange={setQaSummary}
                minHeight={180}
                maxHeight={480}
                placeholder="Summarise what was tested, the results, what happened to the defects, and what remains open…"
              />
            </Section>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "4px 0 24px" }}>
              <Button onClick={() => router.back()}>Cancel</Button>
              <Button loading={saving} onClick={() => save(false)}>
                Save as Draft
              </Button>
              <Button type="primary" icon={<PlayCircle size={14} />} loading={saving} onClick={() => save(true)}>
                Save &amp; Submit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Zai drafting — the result is never written into the field on its own. */}
      <Modal
        open={zaiOpen}
        onCancel={() => setZaiOpen(false)}
        title="Draft the QA Summary with Zai"
        width={720}
        closeIcon={<CloseOutlined />}
        footer={
          zaiDraft
            ? [
                <Button key="regen" onClick={runZai} loading={zaiBusy}>
                  Regenerate
                </Button>,
                <Button key="append" onClick={() => applyZai("append")}>
                  Append to summary
                </Button>,
                <Button key="replace" type="primary" onClick={() => applyZai("replace")}>
                  Replace summary
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={() => setZaiOpen(false)}>
                  Cancel
                </Button>,
                <Button key="go" type="primary" loading={zaiBusy} onClick={runZai}>
                  Generate draft
                </Button>,
              ]
        }
      >
        <p className="qs-hint" style={{ marginBottom: 10 }}>
          Zai writes from this submission&apos;s linked runs, defect counts and retesting figures. Nothing is written to
          the QA Summary until you choose to apply it.
        </p>
        <Input.TextArea
          rows={2}
          value={zaiPrompt}
          onChange={(e) => setZaiPrompt(e.target.value)}
          placeholder="Optional: anything specific to emphasise (e.g. 'mention the payment timeout fix')"
        />
        {zaiBusy && (
          <div style={{ padding: 20, display: "flex", justifyContent: "center" }}>
            <ZukvoLoader size="md" message="Zai is drafting the summary…" />
          </div>
        )}
        {zaiDraft && !zaiBusy && (
          <div className="qs-prose" style={{ marginTop: 14, padding: 12, border: "1px solid var(--border-slate-200)" }}>
            <div dangerouslySetInnerHTML={{ __html: zaiDraft }} />
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
