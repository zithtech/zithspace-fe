"use client";

/**
 * Known issue editor (§19).
 *
 * A known issue is a defect the business is being asked to *accept*, so this is
 * a decision record, not a bug form. The screen is built around that: it starts
 * from the defects this submission already reports rather than an empty text
 * box, and picking one carries its severity and status across, because a known
 * issue that disagrees with the bug it names is worse than no record at all.
 *
 * Free text stays available throughout — the vocabularies below are the common
 * cases, not a schema, and anything already stored that falls outside them is
 * kept and shown rather than silently dropped.
 */

import React, { useEffect, useMemo, useState } from "react";
import { DatePicker, Input, Modal, Tooltip } from "antd";
import {
  AlertTriangle,
  Bug as BugIcon,
  Check,
  LifeBuoy,
  PenLine,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import dayjs from "dayjs";

import type { KnownIssue } from "@/services/qaSubmissionService";

/* ── Vocabularies ──────────────────────────────────────────────────────── */

type Tone = "blue" | "green" | "ash" | "amber" | "red";

const SEVERITIES: Array<{ label: string; tone: Tone }> = [
  { label: "Critical", tone: "red" },
  { label: "High", tone: "amber" },
  { label: "Medium", tone: "blue" },
  { label: "Low", tone: "ash" },
];

const STATUSES: Array<{ label: string; tone: Tone }> = [
  { label: "Open", tone: "red" },
  { label: "In Progress", tone: "blue" },
  { label: "Fixed", tone: "green" },
  { label: "Deferred", tone: "amber" },
  { label: "Won't Fix", tone: "ash" },
];

/** How a bug's own severity maps onto the four the business reads. */
const SEVERITY_ALIASES: Record<string, string> = {
  blocker: "Critical",
  critical: "Critical",
  major: "High",
  high: "High",
  medium: "Medium",
  normal: "Medium",
  minor: "Low",
  low: "Low",
  trivial: "Low",
};

/** Bug workflow keys, in the words the approver uses. */
const BUG_STATUS_LABELS: Record<string, string> = {
  new: "Open",
  converted: "In Progress",
  reopened: "Open",
  verified: "Fixed",
};

const severityToneOf = (value?: string | null): Tone =>
  SEVERITIES.find((s) => s.label.toLowerCase() === String(value || "").toLowerCase())?.tone || "ash";

export const KNOWN_ISSUE_STYLES = `
.ki-modal .ant-modal-content { padding: 0; overflow: hidden; border-radius: 14px; }
.ki-modal .ant-modal-body { padding: 0; }

/* Header */
.ki-head { display: flex; align-items: flex-start; gap: 12px; padding: 18px 22px 16px; border-bottom: 1px solid var(--border-slate-200); background: var(--bg-secondary); }
.ki-head__icon { width: 38px; height: 38px; flex-shrink: 0; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(245,158,11,.12); color: #b45309; border: 1px solid rgba(245,158,11,.24); }
.ki-head__title { margin: 0; font-size: 15.5px; font-weight: 700; color: var(--text-slate-900); line-height: 1.25; }
.ki-head__sub { margin: 4px 0 0; font-size: 12px; line-height: 1.5; color: var(--text-slate-400); }

/* Body */
.ki-body { padding: 18px 22px 22px; max-height: min(62vh, 640px); overflow-y: auto; background: var(--bg-secondary); }

.ki-step { margin-bottom: 20px; }
.ki-step:last-child { margin-bottom: 0; }
.ki-step__head { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
.ki-step__icon { width: 22px; height: 22px; border-radius: 6px; background: var(--bg-slate-50); color: var(--text-slate-600); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ki-step__title { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-slate-600); }
.ki-step__hint { margin-left: auto; font-size: 11px; font-weight: 500; color: var(--text-slate-400); }

/* Bug picker */
.ki-search { margin-bottom: 8px; }
.ki-buglist { display: grid; gap: 6px; max-height: 208px; overflow-y: auto; padding-right: 2px; }
.ki-bug { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 9px 11px; border-radius: 10px; border: 1px solid var(--border-slate-200); background: var(--bg-secondary); cursor: pointer; transition: border-color .15s ease, background .15s ease, box-shadow .15s ease; }
.ki-bug:hover { border-color: #bfdbfe; background: var(--bg-slate-50); }
.ki-bug.is-active { border-color: #3b82f6; background: rgba(59,130,246,.07); box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
.ki-bug__tick { width: 18px; height: 18px; flex-shrink: 0; border-radius: 99px; border: 1.5px solid var(--border-slate-200); display: flex; align-items: center; justify-content: center; color: transparent; }
.ki-bug.is-active .ki-bug__tick { border-color: #3b82f6; background: #3b82f6; color: #fff; }
.ki-bug__body { flex: 1; min-width: 0; }
.ki-bug__top { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.ki-bug__num { font-size: 11.5px; font-weight: 700; color: #2563eb; }
.ki-bug__title { display: block; margin-top: 2px; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ki-manual { margin-top: 8px; display: flex; align-items: center; gap: 7px; }
.ki-linkbtn { padding: 0; border: none; background: none; font-size: 11.5px; font-weight: 600; color: #2563eb; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
.ki-linkbtn:hover { color: #1d4ed8; text-decoration: underline; }

/* Chips */
.ki-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ki-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 99px; border: 1px solid var(--border-slate-200); background: var(--bg-secondary); font-size: 12px; font-weight: 600; color: var(--text-slate-600); cursor: pointer; transition: all .15s ease; }
.ki-chip:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
.ki-chip__dot { width: 6px; height: 6px; border-radius: 99px; background: currentColor; opacity: .55; }
.ki-chip.is-active { color: #2563eb; border-color: rgba(59,130,246,.42); background: rgba(59,130,246,.09); }
.ki-chip.is-active .ki-chip__dot { opacity: 1; }
.ki-chip.is-active.ki-chip--red { color: #dc2626; border-color: rgba(239,68,68,.4); background: rgba(239,68,68,.08); }
.ki-chip.is-active.ki-chip--amber { color: #b45309; border-color: rgba(245,158,11,.42); background: rgba(245,158,11,.1); }
.ki-chip.is-active.ki-chip--green { color: #047857; border-color: rgba(16,185,129,.4); background: rgba(16,185,129,.09); }
.ki-chip.is-active.ki-chip--ash { color: var(--text-slate-900); border-color: var(--border-slate-200); background: var(--bg-slate-50); }

/* Fields */
.ki-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ki-field { margin-bottom: 12px; }
.ki-field:last-child { margin-bottom: 0; }
.ki-label { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; font-size: 11.5px; font-weight: 600; color: var(--text-slate-600); }
.ki-label__count { margin-left: auto; font-size: 10.5px; font-weight: 500; color: var(--text-slate-400); }
.ki-req { color: #dc2626; }
.ki-hint { margin: 5px 0 0; font-size: 11px; line-height: 1.5; color: var(--text-slate-400); }

/* Preview — what the approver will actually read on the record. */
.ki-preview { margin-top: 14px; border: 1px dashed var(--border-slate-200); border-radius: 10px; padding: 11px 13px; background: var(--bg-slate-50); }
.ki-preview__caption { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-slate-400); margin-bottom: 6px; }
.ki-preview__row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; font-size: 12px; color: var(--text-slate-900); font-weight: 600; }
.ki-preview__impact { margin: 6px 0 0; font-size: 11.5px; line-height: 1.5; color: var(--text-slate-600); }

/* Footer */
.ki-foot { display: flex; align-items: center; gap: 9px; padding: 13px 22px; border-top: 1px solid var(--border-slate-200); background: var(--bg-secondary); }
.ki-foot__note { flex: 1; min-width: 0; font-size: 11.5px; color: var(--text-slate-400); }
.ki-btn { height: 34px; padding: 0 16px; border-radius: 9px; font-size: 12.5px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-slate-200); background: var(--bg-secondary); color: var(--text-slate-600); transition: all .15s ease; }
.ki-btn:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
.ki-btn--primary { border-color: #3b82f6; background: #3b82f6; color: #fff; }
.ki-btn--primary:hover { background: #2563eb; border-color: #2563eb; color: #fff; }
.ki-btn:disabled { opacity: .5; cursor: not-allowed; }
.ki-btn--primary:disabled:hover { background: #3b82f6; border-color: #3b82f6; }

/* Dark theme — surfaces already follow the theme variables; the fixed accents
   are what need lifting off a dark background. */
[data-theme='dark'] .ki-head__icon { color: #fbbf24; background: rgba(245,158,11,.16); border-color: rgba(251,191,36,.3); }
[data-theme='dark'] .ki-bug__num { color: #93c5fd; }
[data-theme='dark'] .ki-bug.is-active { border-color: rgba(96,165,250,.55); background: rgba(59,130,246,.14); box-shadow: 0 0 0 3px rgba(59,130,246,.14); }
[data-theme='dark'] .ki-bug:hover { border-color: rgba(96,165,250,.35); }
[data-theme='dark'] .ki-linkbtn { color: #93c5fd; }
[data-theme='dark'] .ki-chip.is-active { color: #93c5fd; border-color: rgba(96,165,250,.45); background: rgba(59,130,246,.16); }
[data-theme='dark'] .ki-chip.is-active.ki-chip--red { color: #fca5a5; border-color: rgba(248,113,113,.42); background: rgba(239,68,68,.16); }
[data-theme='dark'] .ki-chip.is-active.ki-chip--amber { color: #fcd34d; border-color: rgba(251,191,36,.42); background: rgba(245,158,11,.16); }
[data-theme='dark'] .ki-chip.is-active.ki-chip--green { color: #6ee7b7; border-color: rgba(52,211,153,.42); background: rgba(16,185,129,.16); }
[data-theme='dark'] .ki-chip.is-active.ki-chip--ash { color: var(--text-slate-900); background: var(--bg-slate-50); }
[data-theme='dark'] .ki-req { color: #f87171; }
`;

/* ── Pieces ────────────────────────────────────────────────────────────── */

const Step = ({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: any;
  title: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="ki-step">
    <div className="ki-step__head">
      <span className="ki-step__icon">
        <Icon size={13} />
      </span>
      <span className="ki-step__title">{title}</span>
      {hint && <span className="ki-step__hint">{hint}</span>}
    </div>
    {children}
  </div>
);

const ChipRow = ({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; tone: Tone }>;
  value?: string | null;
  onChange: (next: string) => void;
}) => (
  <div className="ki-chips">
    {options.map((o) => {
      const active = String(value || "").toLowerCase() === o.label.toLowerCase();
      return (
        <button
          key={o.label}
          type="button"
          className={`ki-chip ki-chip--${o.tone}${active ? " is-active" : ""}`}
          // Clicking the selected chip clears it — nothing here is mandatory,
          // and a value chosen by mistake needs a way back out.
          onClick={() => onChange(active ? "" : o.label)}
        >
          <span className="ki-chip__dot" />
          {o.label}
        </button>
      );
    })}
  </div>
);

const Pill = ({ tone = "ash", children }: { tone?: Tone; children: React.ReactNode }) => (
  <span className={`qs-pill qs-pill--${tone} qs-pill--sm`}>
    <span className="qs-pill__dot" />
    {children}
  </span>
);

/* ── Modal ─────────────────────────────────────────────────────────────── */

export interface KnownIssueModalProps {
  /** The draft being edited; null closes the modal. */
  value: Partial<KnownIssue> | null;
  onChange: (next: Partial<KnownIssue>) => void;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  /** The defects this submission already reports, used for the picker. */
  bugs?: any[];
}

export default function KnownIssueModal({
  value,
  onChange,
  onCancel,
  onSave,
  saving,
  bugs = [],
}: KnownIssueModalProps) {
  const open = !!value;
  const isEdit = !!value?.id;

  const [bugSearch, setBugSearch] = useState("");
  const [manual, setManual] = useState(false);

  // A reopened modal starts clean: a search term or a manual-entry toggle left
  // over from the last issue would frame the next one wrongly.
  useEffect(() => {
    if (!open) return;
    setBugSearch("");
    // An existing issue whose bug isn't in the list was clearly typed by hand,
    // so it opens back on the field that produced it.
    setManual(!!value?.bug_number && !bugs.some((b) => b.bug_number === value?.bug_number));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value?.id]);

  const filteredBugs = useMemo(() => {
    const q = bugSearch.trim().toLowerCase();
    if (!q) return bugs;
    return bugs.filter((b) =>
      `${b.bug_number || ""} ${b.title || ""}`.toLowerCase().includes(q),
    );
  }, [bugs, bugSearch]);

  const set = (patch: Partial<KnownIssue>) => onChange({ ...(value || {}), ...patch });

  /**
   * Picking a bug carries its own severity and status across. Both stay
   * editable afterwards — the business view of a defect legitimately differs
   * from the engineering one — but they start out agreeing with the bug.
   */
  const selectBug = (bug: any) => {
    if (value?.bug_id === bug.id) {
      set({ bug_id: null, bug_number: null });
      return;
    }
    const sev = SEVERITY_ALIASES[String(bug.severity || "").toLowerCase()];
    set({
      bug_id: bug.id,
      bug_number: bug.bug_number,
      severity: value?.severity || sev || bug.severity || null,
      current_status:
        value?.current_status || BUG_STATUS_LABELS[String(bug.status || "").toLowerCase()] || null,
    });
  };

  /** Enough to be worth recording: something to point at, or something to say. */
  const canSave = !!(value?.bug_number?.trim() || value?.business_impact?.trim());

  const impact = value?.business_impact || "";
  const workaround = value?.workaround || "";

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      width={660}
      className="ki-modal"
      destroyOnHidden
    >
      <style dangerouslySetInnerHTML={{ __html: KNOWN_ISSUE_STYLES }} />

      <div className="ki-head">
        <span className="ki-head__icon">
          <AlertTriangle size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="ki-head__title">{isEdit ? "Edit known issue" : "Add a known issue"}</h3>
          <p className="ki-head__sub">
            An unresolved defect the business is being asked to accept alongside this submission. What you write here
            is what the approver reads when deciding.
          </p>
        </div>
      </div>

      <div className="ki-body">
        <Step
          icon={BugIcon}
          title="Which defect"
          hint={bugs.length > 0 ? `${bugs.length} on this submission` : undefined}
        >
          {bugs.length > 0 && !manual && (
            <>
              {bugs.length > 5 && (
                <Input
                  className="ki-search"
                  size="small"
                  allowClear
                  placeholder="Search bugs…"
                  prefix={<Search size={13} style={{ color: "var(--text-slate-400)" }} />}
                  value={bugSearch}
                  onChange={(ev) => setBugSearch(ev.target.value)}
                />
              )}
              <div className="ki-buglist">
                {filteredBugs.length === 0 ? (
                  <p className="ki-hint" style={{ margin: 0 }}>
                    No bugs match “{bugSearch}”.
                  </p>
                ) : (
                  filteredBugs.map((b) => {
                    const active = value?.bug_id === b.id || value?.bug_number === b.bug_number;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className={`ki-bug${active ? " is-active" : ""}`}
                        onClick={() => selectBug(b)}
                      >
                        <span className="ki-bug__tick">
                          <Check size={12} />
                        </span>
                        <span className="ki-bug__body">
                          <span className="ki-bug__top">
                            <span className="ki-bug__num">{b.bug_number || "No number"}</span>
                            {b.severity && (
                              <Pill tone={severityToneOf(SEVERITY_ALIASES[String(b.severity).toLowerCase()])}>
                                {b.severity}
                              </Pill>
                            )}
                            {b.status && <Pill tone="ash">{BUG_STATUS_LABELS[b.status] || b.status}</Pill>}
                          </span>
                          <span className="ki-bug__title" title={b.title || ""}>
                            {b.title || "Untitled bug"}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="ki-manual">
                <button type="button" className="ki-linkbtn" onClick={() => setManual(true)}>
                  <PenLine size={12} />
                  Not listed — enter a reference by hand
                </button>
              </div>
            </>
          )}

          {(manual || bugs.length === 0) && (
            <div className="ki-field">
              <label className="ki-label">Bug reference</label>
              <Input
                value={value?.bug_number ?? ""}
                onChange={(ev) => set({ bug_number: ev.target.value, bug_id: null })}
                placeholder="E.g. BUG-108"
              />
              <p className="ki-hint">
                {bugs.length > 0 ? (
                  <>
                    Typed references aren&apos;t linked to a bug record.{" "}
                    <button type="button" className="ki-linkbtn" onClick={() => setManual(false)}>
                      Pick from this submission instead
                    </button>
                  </>
                ) : (
                  "This submission has no linked bugs, so the reference is recorded as text."
                )}
              </p>
            </div>
          )}
        </Step>

        <Step icon={AlertTriangle} title="How bad, and where it stands">
          <div className="ki-field">
            <label className="ki-label">Severity</label>
            <ChipRow options={SEVERITIES} value={value?.severity} onChange={(v) => set({ severity: v })} />
          </div>
          <div className="ki-field">
            <label className="ki-label">Current status</label>
            <ChipRow
              options={STATUSES}
              value={value?.current_status}
              onChange={(v) => set({ current_status: v })}
            />
          </div>
          {/* Anything stored outside the two vocabularies is surfaced rather than
              quietly replaced the first time someone saves. */}
          {(!!value?.severity &&
            !SEVERITIES.some((s) => s.label.toLowerCase() === String(value.severity).toLowerCase())) ||
          (!!value?.current_status &&
            !STATUSES.some((s) => s.label.toLowerCase() === String(value.current_status).toLowerCase())) ? (
            <p className="ki-hint">
              Recorded as{" "}
              <strong>
                {[value?.severity, value?.current_status].filter(Boolean).join(" · ")}
              </strong>
              . Choosing above replaces it.
            </p>
          ) : null}
        </Step>

        <Step icon={LifeBuoy} title="Impact and workaround">
          <div className="ki-field">
            <label className="ki-label">
              Business impact <span className="ki-req">*</span>
              <span className="ki-label__count">{impact.length}/400</span>
            </label>
            <Input.TextArea
              rows={2}
              maxLength={400}
              value={impact}
              onChange={(ev) => set({ business_impact: ev.target.value })}
              placeholder="What does this cost the business if it ships as is?"
            />
            <p className="ki-hint">
              Written for the approver, not for engineering — say what they are agreeing to live with.
            </p>
          </div>
          <div className="ki-field">
            <label className="ki-label">
              Workaround
              <span className="ki-label__count">{workaround.length}/400</span>
            </label>
            <Input.TextArea
              rows={2}
              maxLength={400}
              value={workaround}
              onChange={(ev) => set({ workaround: ev.target.value })}
              placeholder="Is there something users can do in the meantime?"
            />
          </div>
        </Step>

        <Step icon={UserCheck} title="Acceptance">
          <div className="ki-grid2">
            <div className="ki-field">
              <label className="ki-label">Accepted by</label>
              <Input
                value={value?.accepted_by ?? ""}
                onChange={(ev) => set({ accepted_by: ev.target.value })}
                placeholder="E.g. Product Owner"
              />
            </div>
            <div className="ki-field">
              <label className="ki-label">Expected resolution</label>
              <DatePicker
                style={{ width: "100%" }}
                format="DD MMM YYYY"
                value={value?.expected_resolution ? dayjs(value.expected_resolution) : null}
                onChange={(dt) =>
                  set({ expected_resolution: dt ? dt.format("YYYY-MM-DD") : null })
                }
                placeholder="When will it be fixed?"
              />
            </div>
          </div>
          <div className="ki-field">
            <label className="ki-label">Comment</label>
            <Input
              value={value?.comment ?? ""}
              onChange={(ev) => set({ comment: ev.target.value })}
              placeholder="Anything else worth recording (optional)"
            />
          </div>
        </Step>

        {/* The record as the approver will meet it, assembled from what has been
            entered so far — so the gaps are obvious before saving. */}
        {canSave && (
          <div className="ki-preview">
            <div className="ki-preview__caption">On the submission this reads as</div>
            <div className="ki-preview__row">
              <span>{value?.bug_number || "Unreferenced defect"}</span>
              {value?.severity && <Pill tone={severityToneOf(value.severity)}>{value.severity}</Pill>}
              {value?.current_status && <Pill tone="ash">{value.current_status}</Pill>}
              {value?.expected_resolution && (
                <span style={{ fontWeight: 500, color: "var(--text-slate-400)" }}>
                  due {dayjs(value.expected_resolution).format("DD MMM YYYY")}
                </span>
              )}
            </div>
            <p className="ki-preview__impact">
              {impact.trim() || "No business impact described yet — the approver will have nothing to judge."}
            </p>
          </div>
        )}
      </div>

      <div className="ki-foot">
        <span className="ki-foot__note">
          {canSave ? "Saved against this submission and shown to the approver." : "Add a bug reference or the business impact to save."}
        </span>
        <button type="button" className="ki-btn" onClick={onCancel}>
          Cancel
        </button>
        <Tooltip title={canSave ? undefined : "Nothing to record yet"}>
          <span>
            <button
              type="button"
              className="ki-btn ki-btn--primary"
              disabled={!canSave || saving}
              onClick={onSave}
            >
              <ShieldCheck size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add known issue"}
            </button>
          </span>
        </Tooltip>
      </div>
    </Modal>
  );
}
