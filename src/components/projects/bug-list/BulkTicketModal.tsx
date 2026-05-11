"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Select, Tooltip, message } from "antd";
import {
  Sparkles,
  Wand2,
  Hand,
  X,
  Search,
  Layers,
  Plus,
  CheckCircle2,
  Paperclip,
  Link as LinkIcon,
  ChevronRight,
  ArrowRight,
  Loader2,
  Filter,
  ListChecks,
  Split,
} from "lucide-react";
import { useBulkConvertBugsToTickets } from "@/hooks/useBugList";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useMembersSelect } from "@/hooks/useMembersSelect";
import { useTheme } from "@/context/ThemeContext";
import type { BugListItem } from "@/services/bugListService";

type Mode = null | "manual";
type GroupKey = "none" | "severity" | "type" | "module";

interface Props {
  open: boolean;
  bugs: BugListItem[];
  onClose: () => void;
  onPickAi: () => void;
  prefilledProjectId?: string;
}

const SEVERITY_RANK: Record<string, number> = {
  blocker: 0,
  critical: 1,
  major: 2,
  minor: 3,
};

export default function BulkTicketModal({ open, bugs, onClose, onPickAi, prefilledProjectId }: Props) {
  const { theme } = useTheme();
  const convert = useBulkConvertBugsToTickets();
  const { data: projects } = useUserProjects();
  const { users: members } = useMembersSelect();

  const [mode, setMode] = useState<Mode>(null);
  const [pool, setPool] = useState<BugListItem[]>([]);
  const [staged, setStaged] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupKey>("none");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>();
  const [assigneeId, setAssigneeId] = useState<string | undefined>();

  const [createdCount, setCreatedCount] = useState(0);

  // Snapshot the bug pool ONCE per open-session. Re-syncing on every `bugs`
  // prop change would clobber local pool mutations (e.g., consuming bugs after
  // a successful create), because the parent's selectedBugs refreshes after
  // the bulk-convert query invalidation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    setMode(null);
    setPool(bugs);
    setStaged(new Set());
    setGroupBy("none");
    setSearch("");
    setCollapsed(new Set());
    setTitle("");
    setProjectId(prefilledProjectId);
    
    // Pre-fill assignee if all bugs have the same assignee
    const bugsWithAssignee = bugs.filter(bug => bug.assigneeId);
    const allSameAssignee = bugsWithAssignee.length > 0 && 
      bugsWithAssignee.every(bug => bug.assigneeId === bugsWithAssignee[0].assigneeId);
    setAssigneeId(allSameAssignee ? (bugsWithAssignee[0].assigneeId || undefined) : undefined);
    
    setCreatedCount(0);
  }, [open, prefilledProjectId]); // Remove 'bugs' to prevent mode reset during ticket creation

  const stagedBugs = useMemo(
    () => pool.filter((b) => staged.has(b.id)),
    [pool, staged],
  );

  const filteredPool = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((b) =>
      [b.title, b.description, b.bugNumber, b.module]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q)),
    );
  }, [pool, search]);

  const buckets = useMemo(() => groupBugs(filteredPool, groupBy), [filteredPool, groupBy]);

  const toggleBug = (id: string) => {
    setStaged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stageAll = (ids: string[]) => {
    setStaged((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const unstage = (id: string) => {
    setStaged((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const consumeStaged = (created: number) => {
    const consumed = new Set(stagedBugs.map((b) => b.id));
    const remaining = pool.filter((b) => !consumed.has(b.id));
    setPool(remaining);
    setStaged(new Set());
    setTitle("");
    setCreatedCount((n) => n + created);
    // keep projectId + assigneeId — the user often re-uses them
    // After every successful create, return to the mode picker so the user can
    // re-choose Manual or AI for the remaining bugs. If nothing's left, stay
    // in the workspace so the celebratory "All done" state shows.
    if (remaining.length > 0) {
      setMode(null);
    } else {
      // When all bugs are processed, stay in manual mode so DoneState shows
      // The DoneState component handles the "Done" button to close the modal
    }
  };

  const handleCreateSingle = async () => {
    if (stagedBugs.length === 0) {
      message.warning("Stage at least one bug");
      return;
    }
    if (!projectId) {
      message.warning("Project is required");
      return;
    }
    if (!title.trim()) {
      message.warning("Title is required for a single ticket");
      return;
    }
    try {
      // Collect all attachments and links from staged bugs
      const allAttachments = stagedBugs.flatMap((b) => b.attachments || []);
      const allExternalLinks = stagedBugs.flatMap((b) => b.externalLinks || []);
      
      await convert.mutateAsync([
        {
          title: title.trim(),
          description: buildDescription(stagedBugs),
          bugIds: stagedBugs.map((b) => b.id),
          projectId,
          assigneeId,
          attachments: allAttachments,
          externalLinks: allExternalLinks,
        },
      ]);
      consumeStaged(1);
    } catch {
      // hook surfaces toast
    }
  };

  const handleCreateSplit = async () => {
    if (stagedBugs.length === 0) {
      message.warning("Stage at least one bug");
      return;
    }
    if (!projectId) {
      message.warning("Project is required");
      return;
    }
    try {
      const groups = stagedBugs.map((b) => ({
        title:
          b.title?.trim() ||
          truncate(b.description || "Bug", 80) ||
          b.bugNumber ||
          "Bug",
        description: buildSingleBugDescription(b),
        bugIds: [b.id],
        projectId,
        assigneeId,
        attachments: b.attachments || [],
        externalLinks: b.externalLinks || [],
      }));
      await convert.mutateAsync(groups);
      consumeStaged(groups.length);
    } catch {
      // hook surfaces toast
    }
  };

  const remaining = pool.length;
  const allDone = remaining === 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      destroyOnHidden
      width={mode === "manual" ? 1080 : 720}
      centered
      maskClosable={false}
      wrapClassName={`hb-btm-wrap ${theme === "dark" ? "hb-btm-dark" : "hb-btm-light"}`}
      styles={{
        mask: { backdropFilter: "blur(8px)", background: "rgba(8,12,24,0.55)" },
        content: { padding: 0, borderRadius: 18, overflow: "hidden", background: "transparent", boxShadow: "0 30px 80px rgba(8,12,24,0.45)" },
        body: { padding: 0 },
      }}
    >
      <div className="hb-btm">
        {mode === null && (
          <ModePicker
            count={pool.length}
            createdCount={createdCount}
            onClose={onClose}
            onManual={() => setMode("manual")}
            onAi={onPickAi}
          />
        )}

        {mode === "manual" && (
          <ManualWorkspace
            allDone={allDone}
            createdCount={createdCount}
            initialCount={bugs.length}
            remaining={remaining}
            stagedCount={staged.size}
            search={search}
            onSearch={setSearch}
            groupBy={groupBy}
            onGroupBy={setGroupBy}
            buckets={buckets}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
            staged={staged}
            onToggleBug={toggleBug}
            onStageAll={stageAll}
            stagedBugs={stagedBugs}
            onUnstage={unstage}
            title={title}
            onTitle={setTitle}
            projectId={projectId}
            onProjectId={setProjectId}
            assigneeId={assigneeId}
            onAssigneeId={setAssigneeId}
            projects={projects || []}
            members={members}
            converting={convert.isPending}
            onCreateSingle={handleCreateSingle}
            onCreateSplit={handleCreateSplit}
            onClose={onClose}
            theme={theme}
          />
        )}
      </div>
    </Modal>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Mode picker
// ───────────────────────────────────────────────────────────────────────────

function ModePicker({
  count,
  createdCount,
  onClose,
  onManual,
  onAi,
}: {
  count: number;
  createdCount: number;
  onClose: () => void;
  onManual: () => void;
  onAi: () => void;
}) {
  return (
    <>
      <div className="hb-btm-hero">
        <div className="hb-btm-hero-bg" />
        <div className="hb-btm-hero-row">
          <div className="hb-btm-hero-orb">
            <Sparkles size={20} />
          </div>
          <div className="hb-btm-hero-text">
            <div className="hb-btm-eyebrow">
              <Sparkles size={11} />
              {createdCount > 0 ? "Continue creating tickets" : "Create tickets"}
            </div>
            <div className="hb-btm-title">
              {count === 0
                ? "All bugs bundled"
                : `Bundle ${count} bug${count === 1 ? "" : "s"} into tickets`}
            </div>
            <div className="hb-btm-sub">
              {createdCount > 0
                ? `${createdCount} ticket${createdCount === 1 ? "" : "s"} created so far · pick a mode for the next batch.`
                : "Pick how you'd like to group them. You can mix & match later."}
            </div>
          </div>
          <button className="hb-btm-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="hb-btm-modegrid">
        <button className="hb-btm-modecard hb-btm-modecard-manual" onClick={onManual}>
          <div className="hb-btm-modecard-icon">
            <Hand size={22} />
          </div>
          <div className="hb-btm-modecard-title">Hand-pick</div>
          <div className="hb-btm-modecard-sub">
            Stage a few bugs, write the ticket, repeat. Group-by helpers and
            per-ticket assignee.
          </div>
          <ul className="hb-btm-modecard-list">
            <li><CheckCircle2 size={12} /> Full control over scope</li>
            <li><CheckCircle2 size={12} /> Select 5 of 20, 5 more, …</li>
            <li><CheckCircle2 size={12} /> Quick group-by severity / type / module</li>
          </ul>
          <div className="hb-btm-modecard-cta">
            Continue manually <ArrowRight size={14} />
          </div>
        </button>

        <button className="hb-btm-modecard hb-btm-modecard-ai" onClick={onAi}>
          <div className="hb-btm-modecard-icon hb-btm-modecard-icon-ai">
            <Wand2 size={22} />
          </div>
          <div className="hb-btm-modecard-title">
            AI assist
            <span className="hb-btm-modecard-pill">Smart</span>
          </div>
          <div className="hb-btm-modecard-sub">
            Auto-cluster bugs by context and polish each description before
            creating tickets.
          </div>
          <ul className="hb-btm-modecard-list">
            <li><CheckCircle2 size={12} /> Smart grouping by feature</li>
            <li><CheckCircle2 size={12} /> Cleaned titles + repro steps</li>
            <li><CheckCircle2 size={12} /> Edit before you ship</li>
          </ul>
          <div className="hb-btm-modecard-cta">
            Continue with AI <ArrowRight size={14} />
          </div>
        </button>
      </div>

      <div className="hb-btm-footer">
        <button className="hb-btm-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Manual workspace — two pane
// ───────────────────────────────────────────────────────────────────────────

interface ManualWorkspaceProps {
  allDone: boolean;
  createdCount: number;
  initialCount: number;
  remaining: number;
  stagedCount: number;
  search: string;
  onSearch: (v: string) => void;
  groupBy: GroupKey;
  onGroupBy: (g: GroupKey) => void;
  buckets: { key: string; label: string; bugs: BugListItem[] }[];
  collapsed: Set<string>;
  onToggleCollapse: (key: string) => void;
  staged: Set<string>;
  onToggleBug: (id: string) => void;
  onStageAll: (ids: string[]) => void;
  stagedBugs: BugListItem[];
  onUnstage: (id: string) => void;
  title: string;
  onTitle: (v: string) => void;
  projectId: string | undefined;
  onProjectId: (v: string | undefined) => void;
  assigneeId: string | undefined;
  onAssigneeId: (v: string | undefined) => void;
  projects: { value: string; label: string; code?: string }[];
  members: { value: string; label: string }[];
  converting: boolean;
  onCreateSingle: () => void;
  onCreateSplit: () => void;
  onClose: () => void;
  theme: string;
}

function ManualWorkspace(p: ManualWorkspaceProps) {
  const consumed = p.initialCount - p.remaining;
  const popupCls = `hb-btm-popup ${p.theme === "dark" ? "hb-btm-dark" : "hb-btm-light"}`;

  return (
    <>
      <div className="hb-btm-hero hb-btm-hero-compact">
        <div className="hb-btm-hero-bg" />
        <div className="hb-btm-hero-row">
          <div className="hb-btm-hero-orb">
            <ListChecks size={20} />
          </div>
          <div className="hb-btm-hero-text">
            <div className="hb-btm-eyebrow">
              <Hand size={11} />
              Hand-pick mode
            </div>
            <div className="hb-btm-title">
              {p.allDone
                ? "All done"
                : `${p.remaining} of ${p.initialCount} bugs left to bundle`}
            </div>
            <div className="hb-btm-sub">
              {p.allDone
                ? `Created ${p.createdCount} ticket${p.createdCount === 1 ? "" : "s"} from your selection.`
                : `Created ${p.createdCount} so far · ${p.stagedCount} staged for the next ticket.`}
            </div>
          </div>
          <button className="hb-btm-close" onClick={p.onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <ProgressBar consumed={consumed} total={p.initialCount} />
      </div>

      {p.allDone ? (
        <DoneState createdCount={p.createdCount} onClose={p.onClose} />
      ) : (
        <div className="hb-btm-grid">
          {/* Left: pool */}
          <div className="hb-btm-pane hb-btm-pane-pool">
            <div className="hb-btm-poolhead">
              <div className="hb-btm-search">
                <Search size={13} />
                <input
                  className="hb-btm-search-input"
                  placeholder="Search remaining bugs…"
                  value={p.search}
                  onChange={(e) => p.onSearch(e.target.value)}
                />
              </div>
              <div className="hb-btm-groupby">
                <Filter size={12} />
                <Select
                  value={p.groupBy}
                  onChange={(v) => p.onGroupBy(v as GroupKey)}
                  size="small"
                  variant="borderless"
                  popupClassName={popupCls}
                  className="hb-btm-groupby-select"
                  options={[
                    { value: "none", label: "No grouping" },
                    { value: "severity", label: "Group by severity" },
                    { value: "type", label: "Group by type" },
                    { value: "module", label: "Group by module" },
                  ]}
                />
              </div>
            </div>

            <div className="hb-btm-pool">
              {p.buckets.length === 0 || p.buckets.every((b) => b.bugs.length === 0) ? (
                <div className="hb-btm-empty">
                  <Layers size={22} />
                  <div>No bugs match the search.</div>
                </div>
              ) : (
                p.buckets.map((bucket) => {
                  const isCollapsed = p.collapsed.has(bucket.key);
                  const allStaged = bucket.bugs.every((b) => p.staged.has(b.id));
                  return (
                    <div className="hb-btm-bucket" key={bucket.key}>
                      {p.groupBy !== "none" && (
                        <div className="hb-btm-bucket-head">
                          <button
                            className="hb-btm-bucket-toggle"
                            onClick={() => p.onToggleCollapse(bucket.key)}
                          >
                            <ChevronRight
                              size={12}
                              style={{
                                transition: "transform 120ms ease",
                                transform: isCollapsed ? "none" : "rotate(90deg)",
                              }}
                            />
                            <span className="hb-btm-bucket-label">{bucket.label}</span>
                            <span className="hb-btm-bucket-count">
                              {bucket.bugs.length}
                            </span>
                          </button>
                          <button
                            className="hb-btm-bucket-stageall"
                            onClick={() =>
                              p.onStageAll(bucket.bugs.map((b) => b.id))
                            }
                            disabled={allStaged}
                          >
                            {allStaged ? "All staged" : "Stage all"}
                          </button>
                        </div>
                      )}
                      {(p.groupBy === "none" || !isCollapsed) &&
                        bucket.bugs.map((bug) => (
                          <BugRow
                            key={bug.id}
                            bug={bug}
                            staged={p.staged.has(bug.id)}
                            onToggle={() => p.onToggleBug(bug.id)}
                          />
                        ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: draft */}
          <div className="hb-btm-pane hb-btm-pane-draft">
            <div className="hb-btm-drafthead">
              <div className="hb-btm-drafthead-title">
                Ticket draft
                <span className="hb-btm-drafthead-count">
                  {p.stagedCount} bug{p.stagedCount === 1 ? "" : "s"}
                </span>
              </div>
              <div className="hb-btm-drafthead-sub">
                Bundles every staged bug's description, attachments &amp; links.
              </div>
            </div>

            {p.stagedBugs.length === 0 ? (
              <div className="hb-btm-draft-empty">
                <div className="hb-btm-draft-empty-orb">
                  <Plus size={20} />
                </div>
                <div className="hb-btm-draft-empty-title">
                  Stage bugs from the left
                </div>
                <div className="hb-btm-draft-empty-sub">
                  Tick the bugs you want bundled into one ticket — title and
                  description fill in automatically.
                </div>
              </div>
            ) : (
              <div className="hb-btm-draftbody">
                <Field
                  label="Title"
                  required
                  hint="Required for the single-ticket option"
                >
                  <input
                    className="hb-btm-input"
                    value={p.title}
                    onChange={(e) => p.onTitle(e.target.value)}
                    placeholder="Give this ticket a title…"
                  />
                </Field>

                <div className="hb-btm-row2">
                  <Field label="Project" required>
                    <Select
                      showSearch
                      placeholder="Pick a project"
                      value={p.projectId}
                      onChange={(v) => p.onProjectId(v)}
                      popupClassName={popupCls}
                      style={{ width: "100%" }}
                      options={p.projects.map((pr) => ({
                        value: pr.value,
                        label: pr.code ? `${pr.code} · ${pr.label}` : pr.label,
                      }))}
                      filterOption={(input, option) =>
                        (option?.label as string)
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </Field>
                  <Field label="Assignee" optional>
                    <Select
                      allowClear
                      showSearch
                      placeholder="Unassigned"
                      value={p.assigneeId}
                      onChange={(v) => p.onAssigneeId(v)}
                      popupClassName={popupCls}
                      style={{ width: "100%" }}
                      options={p.members}
                      filterOption={(input, option) =>
                        (option?.label as string)
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </Field>
                </div>

                <div className="hb-btm-staged">
                  <div className="hb-btm-staged-label">
                    Bundled bugs
                    <span className="hb-btm-staged-count">{p.stagedCount}</span>
                  </div>
                  <div className="hb-btm-staged-chips">
                    {p.stagedBugs.map((b) => (
                      <span key={b.id} className="hb-btm-chip">
                        <span className="hb-btm-chip-num">
                          {b.bugNumber || b.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="hb-btm-chip-title">
                          {b.title || b.description}
                        </span>
                        <button
                          onClick={() => p.onUnstage(b.id)}
                          aria-label="Remove from ticket"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="hb-btm-draftfoot">
              <button
                className="hb-btm-secondary"
                onClick={p.onClose}
                disabled={p.converting}
              >
                {p.createdCount > 0 ? "Done for now" : "Cancel"}
              </button>
              <Tooltip
                title={
                  p.stagedCount === 0
                    ? "Stage at least one bug"
                    : !p.projectId
                      ? "Pick a project first"
                      : `Creates ${p.stagedCount} separate ticket${p.stagedCount === 1 ? "" : "s"}, one per staged bug`
                }
              >
                <button
                  className="hb-btm-split"
                  disabled={
                    p.converting || p.stagedCount === 0 || !p.projectId
                  }
                  onClick={p.onCreateSplit}
                >
                  {p.converting ? (
                    <Loader2 size={14} className="hb-btm-spin" />
                  ) : (
                    <Split size={14} />
                  )}
                  Split ticket
                  {p.stagedCount > 0 && (
                    <span className="hb-btm-primary-count">
                      · {p.stagedCount}
                    </span>
                  )}
                </button>
              </Tooltip>
              <Tooltip
                title={
                  p.stagedCount === 0
                    ? "Stage at least one bug"
                    : !p.projectId
                      ? "Pick a project first"
                      : !p.title.trim()
                        ? "Enter a title first"
                        : `Creates 1 ticket bundling all ${p.stagedCount} staged bug${p.stagedCount === 1 ? "" : "s"}`
                }
              >
                <button
                  className="hb-btm-primary"
                  disabled={
                    p.converting ||
                    p.stagedCount === 0 ||
                    !p.projectId ||
                    !p.title.trim()
                  }
                  onClick={p.onCreateSingle}
                >
                  {p.converting ? (
                    <>
                      <Loader2 size={14} className="hb-btm-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Single ticket
                    </>
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Small primitives
// ───────────────────────────────────────────────────────────────────────────

function BugRow({
  bug,
  staged,
  onToggle,
}: {
  bug: BugListItem;
  staged: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`hb-btm-bugrow ${staged ? "active" : ""}`}
      onClick={onToggle}
      type="button"
    >
      <span className={`hb-btm-check ${staged ? "checked" : ""}`}>
        {staged && <CheckCircle2 size={13} />}
      </span>
      <span className="hb-btm-bugnum">
        {bug.bugNumber || bug.id.slice(-6).toUpperCase()}
      </span>
      <span className="hb-btm-bugtitle">
        {bug.title || bug.description}
      </span>
      {bug.severity && (
        <span className={`hb-btm-sev hb-btm-sev-${bug.severity}`}>
          {bug.severity}
        </span>
      )}
      <span className="hb-btm-bugmeta">
        {bug.attachments && bug.attachments.length > 0 && (
          <Tooltip title={`${bug.attachments.length} attachment(s)`}>
            <span className="hb-btm-bugmeta-pill">
              <Paperclip size={10} /> {bug.attachments.length}
            </span>
          </Tooltip>
        )}
        {bug.externalLinks && bug.externalLinks.length > 0 && (
          <Tooltip title={`${bug.externalLinks.length} link(s)`}>
            <span className="hb-btm-bugmeta-pill">
              <LinkIcon size={10} /> {bug.externalLinks.length}
            </span>
          </Tooltip>
        )}
      </span>
    </button>
  );
}

function Field({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hb-btm-field">
      <label className="hb-btm-label">
        <span>{label}</span>
        {required && <span className="hb-btm-req">*</span>}
        {optional && <span className="hb-btm-opt">optional</span>}
        {hint && <span className="hb-btm-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function ProgressBar({ consumed, total }: { consumed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((consumed / total) * 100));
  return (
    <div className="hb-btm-progress">
      <div className="hb-btm-progress-bar" style={{ width: `${pct}%` }} />
      <span className="hb-btm-progress-label">
        {consumed} / {total} bundled
      </span>
    </div>
  );
}

function DoneState({
  createdCount,
  onClose,
}: {
  createdCount: number;
  onClose: () => void;
}) {
  return (
    <div className="hb-btm-done">
      <div className="hb-btm-done-orb">
        <CheckCircle2 size={28} />
      </div>
      <div className="hb-btm-done-title">
        {createdCount} ticket{createdCount === 1 ? "" : "s"} created
      </div>
      <div className="hb-btm-done-sub">
        Every selected bug has been bundled into a ticket.
      </div>
      <button className="hb-btm-primary" onClick={onClose}>
        Done
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function groupBugs(bugs: BugListItem[], key: GroupKey) {
  if (key === "none") {
    return [{ key: "all", label: "All bugs", bugs }];
  }
  const map = new Map<string, BugListItem[]>();
  bugs.forEach((b) => {
    let bucket = "Unspecified";
    if (key === "severity") bucket = b.severity || "Unspecified";
    else if (key === "type") bucket = b.bugType || "Unspecified";
    else if (key === "module") bucket = b.module || "Unspecified";
    if (!map.has(bucket)) map.set(bucket, []);
    map.get(bucket)!.push(b);
  });
  const out = Array.from(map.entries()).map(([k, list]) => ({
    key: k,
    label: cap(k),
    bugs: list,
  }));
  if (key === "severity") {
    out.sort(
      (a, b) =>
        (SEVERITY_RANK[a.key.toLowerCase()] ?? 99) -
        (SEVERITY_RANK[b.key.toLowerCase()] ?? 99),
    );
  } else {
    out.sort((a, b) => a.label.localeCompare(b.label));
  }
  return out;
}

function buildSingleBugDescription(b: BugListItem): string {
  const lines: string[] = [];
  if (b.description) lines.push(b.description);
  if (b.attachments && b.attachments.length > 0) {
    lines.push(
      `_Attachments:_ ${b.attachments.map((a) => a.fileName).join(", ")}`,
    );
  }
  if (b.externalLinks && b.externalLinks.length > 0) {
    lines.push(
      `_Links:_ ${b.externalLinks.map((l) => l.label || l.url).join(", ")}`,
    );
  }
  return lines.join("\n\n");
}

function buildDescription(bugs: BugListItem[]): string {
  return bugs
    .map((b) => {
      const lines: string[] = [];
      if (b.description) lines.push(b.description);
      if (b.attachments && b.attachments.length > 0) {
        lines.push(
          `_Attachments:_ ${b.attachments.map((a) => a.fileName).join(", ")}`,
        );
      }
      if (b.externalLinks && b.externalLinks.length > 0) {
        lines.push(
          `_Links:_ ${b.externalLinks.map((l) => l.label || l.url).join(", ")}`,
        );
      }
      return lines.join("\n");
    })
    .filter((s) => s.trim().length > 0)
    .join("\n\n---\n\n");
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
